/**
 * AI Security Alert Analysis
 * Generates risk scores and recommended actions for security threats
 */

class SecurityAnalyzer {
  /**
   * Analyze security threats and generate risk assessment
   */
  static analyzeSecurityAlert(alert) {
    const { type, severity, metadata = {} } = alert;

    // For ML-generated alerts, prefer the model's own risk score when available
    let riskScore =
      alert.mlRiskScore != null
        ? Math.round(alert.mlRiskScore)
        : alert.mlAnomalyScore != null
        ? Math.round(Math.abs(alert.mlAnomalyScore) * 100)
        : this.calculateRiskScore(type, severity, metadata);

    let explanation = this.generateExplanation(type, severity, metadata);
    let recommendedAction = this.generateRecommendation(
      type,
      severity,
      metadata,
    );

    return {
      riskScore,
      explanation,
      recommendedAction,
      analysisTimestamp: new Date(),
    };
  }

  /**
   * Calculate numerical risk score (0-100)
   */
  static calculateRiskScore(type, severity, metadata) {
    const severityScores = {
      CRITICAL: 90,
      HIGH: 70,
      MEDIUM: 50,
      LOW: 20,
    };

    let baseScore = severityScores[severity] || 50;

    // Adjust based on threat type
    const typeMultipliers = {
      A01_BROKEN_ACCESS_CONTROL: 1.3,
      A04_CRYPTOGRAPHIC_FAILURES: 1.25,
      A05_INJECTION: 1.4,
      A07_AUTHENTICATION_FAILURES: 1.2,
      A08_DATA_INTEGRITY_FAILURES: 1.3,
      A02_SECURITY_MISCONFIGURATION: 0.8,
      A10_ERROR_HANDLING_FAILURES: 0.7,
      ML_REQUEST_THREAT: 1.35,
      ML_ANOMALY_DETECTED: 1.1,
    };

    const multiplier = typeMultipliers[type] || 1.0;
    let score = Math.min(100, baseScore * multiplier);

    // Check for repeated patterns (metadata.repeatCount)
    if (metadata.repeatCount && metadata.repeatCount > 3) {
      score = Math.min(100, score + metadata.repeatCount * 5);
    }

    return Math.round(score);
  }

  /**
   * Generate human-readable threat explanation
   */
  static generateExplanation(type, severity, metadata) {
    const explanations = {
      A01_BROKEN_ACCESS_CONTROL: {
        UNAUTHORIZED_ACCESS:
          "User attempted to access resources they don't have permission to access. This violates the principle of least privilege.",
        DEFAULT:
          "Access control vulnerability detected. Unauthorized access attempt.",
      },
      A02_SECURITY_MISCONFIGURATION: {
        MISSING_HEADERS:
          "Critical security headers are missing from the response. These headers provide defense-in-depth against various attacks.",
        INVALID_ROUTES:
          "Request to suspicious or administrative endpoints detected.",
        DEFAULT: "Security misconfiguration detected.",
      },
      A03_SUPPLY_CHAIN: {
        DEFAULT:
          "Suspicious dependency or supply chain activity detected. Review dependency sources.",
      },
      A04_CRYPTOGRAPHIC_FAILURES: {
        WEAK_JWT:
          "JWT token appears weak or improperly formatted. This may indicate credential compromise.",
        INVALID_JWT:
          "JWT token validation failed. Possible tampering detected.",
        DEFAULT: "Cryptographic vulnerability detected.",
      },
      A05_INJECTION: {
        SQL_INJECTION:
          "SQL injection pattern detected in request. Attacker may be attempting to manipulate database queries.",
        NOSQL_INJECTION:
          "NoSQL injection pattern detected. MongoDB operators found in user input.",
        CROSS_SITE_SCRIPTING:
          "XSS payload detected in request. Attacker attempting to inject malicious scripts.",
        PATH_TRAVERSAL:
          "Path traversal attempt detected. User may be trying to access files outside intended directory.",
        COMMAND_INJECTION:
          "System command injection pattern detected. Attacker attempting to execute arbitrary commands.",
        DEFAULT: "Input injection vulnerability detected.",
      },
      A06_INSECURE_DESIGN: {
        DEFAULT:
          "Insecure design pattern detected. Validation or logic bypass attempted.",
      },
      A07_AUTHENTICATION_FAILURES: {
        BRUTE_FORCE: `Multiple failed authentication attempts (${metadata.attemptCount || "multiple"}) detected from same source. Possible brute force attack.`,
        DEFAULT: "Authentication failure detected.",
      },
      A08_DATA_INTEGRITY_FAILURES: {
        PAYLOAD_TAMPERING:
          "Request payload integrity check failed. Data appears to have been modified in transit.",
        DEFAULT: "Data integrity violation detected.",
      },
      A09_LOGGING_FAILURES: {
        DEFAULT: "Critical security event not properly logged.",
      },
      A10_ERROR_HANDLING_FAILURES: {
        DEFAULT:
          "Abnormal error pattern detected. Possible denial of service or systematic failure.",
      },
      ML_REQUEST_THREAT: {
        ML_CLASSIFIER:
          "A trained Random Forest classifier identified this HTTP request as malicious based on its structure, payload content, and parameter patterns. This is a data-driven signal beyond rule-based detection.",
        DEFAULT:
          "ML model detected a malicious HTTP request pattern.",
      },
      ML_ANOMALY_DETECTED: {
        ISOLATION_FOREST:
          "An Isolation Forest anomaly detector identified statistically abnormal network flow behaviour from this IP. The traffic pattern deviates significantly from the learned baseline of normal activity.",
        DEFAULT:
          "ML model detected anomalous traffic behaviour.",
      },
    };

    const typeExplanations = explanations[type] || {};
    const category = metadata.category || "DEFAULT";
    return (
      typeExplanations[category] ||
      typeExplanations.DEFAULT ||
      "Security threat detected."
    );
  }

  /**
   * Generate recommended mitigation actions
   */
  static generateRecommendation(type, severity, metadata) {
    const recommendations = {
      A01_BROKEN_ACCESS_CONTROL: {
        UNAUTHORIZED_ACCESS: [
          "Review user permissions and role assignments",
          "Implement proper authorization checks on all endpoints",
          "Log all unauthorized access attempts for audit trail",
          "Consider temporarily restricting user's access pending investigation",
        ],
        DEFAULT: ["Audit user permissions", "Review access control policies"],
      },
      A02_SECURITY_MISCONFIGURATION: {
        MISSING_HEADERS: [
          "Add Content-Security-Policy header",
          "Add X-Content-Type-Options: nosniff",
          "Add X-Frame-Options: DENY",
          "Add X-XSS-Protection: 1; mode=block",
        ],
        INVALID_ROUTES: [
          "Block access to suspicious endpoints",
          "Implement proper route validation",
          "Review API endpoint security",
        ],
        DEFAULT: ["Review security configuration"],
      },
      A04_CRYPTOGRAPHIC_FAILURES: {
        WEAK_JWT: [
          "Revoke current JWT tokens",
          "Force user to re-authenticate",
          "Review JWT signing algorithm and secret strength",
          "Implement token rotation policy",
        ],
        INVALID_JWT: [
          "Reject request immediately",
          "Force user re-authentication",
          "Investigate potential token compromise",
        ],
        DEFAULT: ["Review cryptographic implementation"],
      },
      A05_INJECTION: {
        SQL_INJECTION: [
          "Use parameterized queries/prepared statements",
          "Sanitize and validate all user inputs",
          "Implement input validation on client and server",
          "Consider blocking user pending investigation",
        ],
        NOSQL_INJECTION: [
          "Use schema validation for NoSQL queries",
          "Sanitize all user inputs before database operations",
          "Implement query whitelisting",
        ],
        CROSS_SITE_SCRIPTING: [
          "Sanitize all user-supplied HTML/JavaScript",
          "Implement Content-Security-Policy",
          "Use output encoding for all dynamic content",
        ],
        PATH_TRAVERSAL: [
          "Implement path canonicalization",
          "Validate file paths against whitelist",
          "Block access to sensitive directories",
        ],
        COMMAND_INJECTION: [
          "Avoid dynamic command construction",
          "Use safe APIs for system interaction",
          "Implement strict input validation",
        ],
        DEFAULT: ["Implement input validation and sanitization"],
      },
      A07_AUTHENTICATION_FAILURES: {
        BRUTE_FORCE: [
          "Lock user account temporarily",
          "Implement rate limiting on login endpoint",
          "Implement CAPTCHA after failed attempts",
          "Send MFA challenge to user",
          "Increase monitoring for this user",
        ],
        DEFAULT: [
          "Review authentication logs",
          "Strengthen password requirements",
        ],
      },
      A08_DATA_INTEGRITY_FAILURES: {
        PAYLOAD_TAMPERING: [
          "Invalidate current session",
          "Force user re-authentication",
          "Implement request signing",
          "Enable TLS/HTTPS only",
        ],
        DEFAULT: ["Implement data integrity checks"],
      },
      A10_ERROR_HANDLING_FAILURES: {
        DEFAULT: [
          "Review error handling implementation",
          "Implement proper logging without sensitive data exposure",
          "Monitor for patterns of repeated errors",
        ],
      },
      ML_REQUEST_THREAT: {
        ML_CLASSIFIER: [
          "Inspect full request payload in alert metadata",
          "Block or rate-limit source IP if repeated",
          "Validate and sanitize all user inputs",
          "Review WAF rules to cover detected pattern",
          "Escalate to security team if confidence ≥ 90%",
        ],
        DEFAULT: ["Review ML alert metadata", "Block suspicious IP"],
      },
      ML_ANOMALY_DETECTED: {
        ISOLATION_FOREST: [
          "Investigate traffic pattern from flagged IP",
          "Check for automated or scripted request patterns",
          "Consider temporary IP rate-limiting",
          "Correlate with OWASP rule-based alerts from same source",
          "Review session duration and request velocity",
        ],
        DEFAULT: ["Investigate anomalous traffic source", "Apply rate limiting"],
      },
    };

    const typeRecs = recommendations[type] || {};
    const category = metadata.category || "DEFAULT";
    const actions = typeRecs[category] ||
      typeRecs.DEFAULT || ["Review security logs"];

    if (severity === "CRITICAL") {
      return [
        "URGENT: Escalate to security team immediately",
        ...actions,
        "Isolate affected systems if necessary",
      ];
    }

    return actions;
  }
}

module.exports = SecurityAnalyzer;
