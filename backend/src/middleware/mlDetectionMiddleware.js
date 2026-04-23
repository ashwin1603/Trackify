/**
 * ML Detection Middleware
 * ========================
 * Runs after the rule-based OWASP middleware.
 * Calls the Python ML microservice to classify the request and check for
 * anomalous behaviour, then creates SecurityAlerts for positive detections.
 *
 * Thresholds (overridable via env vars):
 *   ML_REQUEST_THRESHOLD  – malicious_prob ≥ this → ML_REQUEST_THREAT alert  (default 0.70)
 *   ML_ANOMALY_THRESHOLD  – risk_score      ≥ this → ML_ANOMALY_DETECTED alert (default 50)
 */

const { predictRequest, detectAnomaly } = require("../utils/mlClient");
const { extractRequestFeatures, extractAnomalyFeatures } = require("../utils/mlFeatureExtractor");
const SecurityAnalyzer = require("../utils/securityAnalyzer");
const prisma  = require("../config/prisma");
const logger  = require("../utils/logger");

const REQUEST_THRESHOLD = parseFloat(process.env.ML_REQUEST_THRESHOLD || "0.70");
const ANOMALY_THRESHOLD = parseFloat(process.env.ML_ANOMALY_THRESHOLD || "50");

// In-memory stats
const mlStats = {
  totalRequests: 0,
};

function getMlStats() {
  return { ...mlStats };
}

// Throttle: max 1 ML alert per (ip + type) per minute
const mlAlertCache = new Map();
function isThrottled(ip, type) {
  const key  = `${ip}:${type}`;
  const last = mlAlertCache.get(key);
  if (last && Date.now() - last < 60_000) return true;
  mlAlertCache.set(key, Date.now());
  return false;
}

async function saveMlAlert(threat, req, mlMeta) {
  if (isThrottled(req.ip, threat.type)) return;

  const analysis = SecurityAnalyzer.analyzeSecurityAlert({ ...threat, metadata: mlMeta });

  const alert = await prisma.securityAlert.create({
    data: {
      type:        threat.type,
      message:     threat.message,
      severity:    threat.severity,
      status:      "OPEN",
      endpoint:    `${req.method} ${req.path}`,
      ipAddress:   req.ip,
      userId:      req.user?.id || null,
      mlRiskScore: mlMeta.mlRiskScore   ?? null,
      mlAnomalyScore: mlMeta.mlAnomalyScore ?? null,
      metadata: {
        category:   threat.category,
        url:        req.originalUrl,
        userAgent:  req.headers["user-agent"],
        timestamp:  new Date().toISOString(),
        mlFeatures: mlMeta.features,
      },
      aiAnalysis: analysis,
    },
  });

  // Audit log if authenticated user
  if (req.user?.id) {
    await prisma.auditLog.create({
      data: {
        actorId:    req.user.id,
        action:     "SECURITY_THREAT_DETECTED",
        entityType: "SecurityAlert",
        entityId:   alert.id,
        ipAddress:  req.ip,
        metadata:   { threatType: threat.type, severity: threat.severity, riskScore: analysis.riskScore },
      },
    });
  }

  if (threat.severity === "CRITICAL") {
    logger.error(`[ML] CRITICAL threat: ${threat.message}`, { alertId: alert.id });
  } else {
    logger.warn(`[ML] Security alert: ${threat.type}`, { alertId: alert.id, riskScore: analysis.riskScore });
  }
}

async function mlDetectionMiddleware(req, _res, next) {
  // Skip health-check and the ML service's own internal path
  if (req.path === "/api/health") return next();

  mlStats.totalRequests++;

  try {
    const [requestFeatures, anomalyFeatures] = [
      extractRequestFeatures(req),
      extractAnomalyFeatures(req),
    ];

    // Fire both ML calls in parallel — neither blocks the other
    const [requestResult, anomalyResult] = await Promise.all([
      predictRequest(requestFeatures),
      detectAnomaly(anomalyFeatures),
    ]);

    // ── 1. Request classifier ─────────────────────────────────────────────
    if (requestResult && requestResult.malicious_prob >= REQUEST_THRESHOLD) {
      const severity = requestResult.malicious_prob >= 0.9 ? "CRITICAL" : "HIGH";
      await saveMlAlert(
        {
          type:     "ML_REQUEST_THREAT",
          category: "ML_CLASSIFIER",
          severity,
          message:  `ML model flagged request as malicious (${(requestResult.malicious_prob * 100).toFixed(1)}% confidence)`,
        },
        req,
        {
          mlRiskScore:   requestResult.risk_score,
          mlAnomalyScore: null,
          features:      requestFeatures,
          malicious_prob: requestResult.malicious_prob,
        },
      );

      // Reject CRITICAL threats immediately only if not authenticated as staff (ADMIN/SECURITY/DEVELOPER)
      // Actually, since this is a bug tracker, bug descriptions inherently contain "malicious" strings.
      // We will merely log the CRITICAL alert but let the request pass.
    }

    // ── 2. Anomaly detector ───────────────────────────────────────────────
    if (anomalyResult && anomalyResult.is_anomaly && anomalyResult.risk_score >= ANOMALY_THRESHOLD) {
      await saveMlAlert(
        {
          type:     "ML_ANOMALY_DETECTED",
          category: "ISOLATION_FOREST",
          severity: anomalyResult.risk_score >= 75 ? "HIGH" : "MEDIUM",
          message:  `Anomalous traffic behaviour detected for IP ${req.ip} (anomaly score: ${anomalyResult.anomaly_score.toFixed(4)})`,
        },
        req,
        {
          mlRiskScore:    null,
          mlAnomalyScore: anomalyResult.anomaly_score,
          features:       anomalyFeatures,
          risk_score:     anomalyResult.risk_score,
        },
      );
    }

    // Attach ML results to req for downstream use (e.g. logging)
    req.mlAnalysis = { requestResult, anomalyResult };
  } catch (err) {
    // Never crash the request pipeline due to ML errors
    logger.warn("[ML] Detection middleware error (non-fatal)", { error: err.message });
  }

  return next();
}

module.exports = { mlDetectionMiddleware, getMlStats };
