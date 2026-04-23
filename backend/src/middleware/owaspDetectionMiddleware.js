/**
 * OWASP Detection Middleware
 * Monitors all requests for security threats and generates alerts
 */

const OwaspDetector = require("../utils/owaspDetector");
const SecurityAnalyzer = require("../utils/securityAnalyzer");
const prisma = require("../config/prisma");
const logger = require("../utils/logger");
const fs = require("fs");
const path = require("path");

// In-memory threat cache to prevent alert flooding
const threatCache = new Map();

function getCacheKey(ip, threatType) {
  return `${ip}:${threatType}`;
}

async function createSecurityAlert(threat, req) {
  try {
    const { type, category, severity, message } = threat;
    const cacheKey = getCacheKey(req.ip, type);

    console.log(`[ALERT] Creating alert for threat: ${type} (${severity})`);

    // Throttle alerts to prevent flooding (max 1 per minute per threat type per IP)
    if (threatCache.has(cacheKey)) {
      const lastAlert = threatCache.get(cacheKey);
      if (Date.now() - lastAlert < 60000) {
        console.log(`[ALERT] Alert throttled for ${type}`);
        return; // Skip if alert was created recently
      }
    }

    threatCache.set(cacheKey, Date.now());

    console.log(`[ALERT] About to create alert in database...`);
    const alert = await prisma.securityAlert.create({
      data: {
        type,
        message,
        severity,
        status: "OPEN",
        endpoint: `${req.method} ${req.path}`,
        ipAddress: req.ip,
        userId: req.user?.id || null,
        metadata: {
          category,
          url: req.originalUrl,
          userAgent: req.headers["user-agent"],
          timestamp: new Date().toISOString(),
          queryParams: req.query,
          requestHeaders: sanitizeHeaders(req.headers),
        },
      },
    });

    console.log(`[ALERT] ✓ Alert created in database with ID: ${alert.id}`);

    // Generate AI analysis
    const analysis = SecurityAnalyzer.analyzeSecurityAlert(alert);

    // Update alert with AI analysis
    await prisma.securityAlert.update({
      where: { id: alert.id },
      data: { aiAnalysis: analysis },
    });

    logger.warn(`Security alert created: ${type}`, {
      alertId: alert.id,
      severity,
      endpoint: alert.endpoint,
      ip: req.ip,
      riskScore: analysis.riskScore,
    });

    // Log to audit trail
    if (req.user?.id) {
      await prisma.auditLog.create({
        data: {
          actorId: req.user.id,
          action: `SECURITY_THREAT_DETECTED`,
          entityType: "SecurityAlert",
          entityId: alert.id,
          ipAddress: req.ip,
          metadata: {
            threatType: type,
            severity,
            riskScore: analysis.riskScore,
          },
        },
      });
    }

    // If CRITICAL severity, immediately escalate
    if (severity === "CRITICAL") {
      logger.error(`CRITICAL SECURITY THREAT: ${message}`, {
        alertId: alert.id,
        endpoint: alert.endpoint,
      });
    }
  } catch (error) {
    console.error(
      `[ALERT ERROR] Failed to create security alert:`,
      error.message,
    );
    logger.error("Failed to create security alert", { error: error.message });
  }
}

function sanitizeHeaders(headers) {
  const sanitized = { ...headers };
  const sensitiveHeaders = ["authorization", "x-api-key", "cookie"];
  sensitiveHeaders.forEach((header) => {
    if (sanitized[header]) {
      sanitized[header] = "***REDACTED***";
    }
  });
  return sanitized;
}

// Debug logging to file
const debugLogPath = path.join(__dirname, "../../owasp-debug.log");
function debugLog(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(debugLogPath, `[${timestamp}] ${message}\n`);
  console.log(`[OWASP-DEBUG] ${message}`);
}

async function owaspDetectionMiddleware(req, _res, next) {
  try {
    debugLog(`Middleware called for: ${req.method} ${req.path}`);

    // Skip health check
    if (req.path === "/api/health") {
      return next();
    }

    // Run OWASP threat detection
    const threats = OwaspDetector.analyzeRequest(req, req.user);

    debugLog(`Path: ${req.path}, Threats detected: ${threats.length}`);

    if (threats.length > 0) {
      console.log(
        `[OWASP] Found threats:`,
        threats.map((t) => ({ type: t.type, severity: t.severity })),
      );
      // Create alerts for each threat (throttled)
      for (const threat of threats) {
        console.log(`[OWASP] Creating alert for threat: ${threat.type}`);
        await createSecurityAlert(threat, req);
        console.log(
          `[OWASP] Alert creation completed for threat: ${threat.type}`,
        );
      }

      // If CRITICAL threat found, reject request
      const criticalThreats = threats.filter((t) => t.severity === "CRITICAL");
      if (criticalThreats.length > 0) {
        console.log(
          `[OWASP] Rejecting request due to ${criticalThreats.length} CRITICAL threat(s)`,
        );
        return next(new Error("Request rejected due to security threat"));
      }
    }

    // Check for repeated 5xx errors (A10 - Error Handling Failures)
    if (req.statusCode >= 500) {
      const recentErrors = await prisma.securityAlert.count({
        where: {
          type: "A10_ERROR_HANDLING_FAILURES",
          ipAddress: req.ip,
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
      });

      if (recentErrors >= 3) {
        await createSecurityAlert(
          {
            type: "A10_ERROR_HANDLING_FAILURES",
            category: "REPEATED_ERRORS",
            severity: "HIGH",
            message: "Multiple server errors detected",
          },
          req,
        );
      }
    }

    return next();
  } catch (error) {
    logger.error("OWASP detection middleware error", { error: error.message });
    return next();
  }
}

module.exports = { owaspDetectionMiddleware, createSecurityAlert };
