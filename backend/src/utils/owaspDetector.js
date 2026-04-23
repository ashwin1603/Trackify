/**
 * OWASP Top 10 Threat Detection Engine
 * Analyzes requests for security threats based on OWASP categories
 */

const SQL_INJECTION_PATTERNS = [
  /(\bOR\b\s*1\s*=\s*1)/gi,
  /(\bAND\b\s*1\s*=\s*1)/gi,
  /('|")\s*(\bOR\b|\bAND\b)/gi,
  /(DROP\s+TABLE|DELETE\s+FROM|INSERT\s+INTO|UPDATE\s+.*SET)/gi,
  /(\bunion\b|\bselect\b|\bwhere\b|\bfrom\b|;|\-\-|\/\*|\*\/)/gi,
];

const NOSQL_INJECTION_PATTERNS = [
  /[\{\$\}][\w\$]+/g,
  /(\$where|\$ne|\$gt|\$lt|\$eq|\$in|\$nin|\$and|\$or)/gi,
];

const MALICIOUS_INPUT_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on(load|error|click|mouseover|focus|blur)=/gi,
  /eval\(/gi,
  /expression\s*\(/gi,
];

const SUSPICIOUS_PATTERNS = {
  pathTraversal: /\.\.[\/\\]/g,
  commandInjection: /([;&|`\n\r])/g,
  xxe: /<!ENTITY/gi,
  xxs: /<|>/g,
};

class OwaspDetector {
  /**
   * Detect SQL Injection patterns
   */
  static detectSQLInjection(input) {
    if (!input) return null;
    const str = String(input).toLowerCase();
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(str)) {
        return {
          type: "A05_INJECTION",
          category: "SQL_INJECTION",
          severity: "CRITICAL",
          message: "SQL injection pattern detected",
          pattern: pattern.toString(),
        };
      }
    }
    return null;
  }

  /**
   * Detect NoSQL Injection patterns
   */
  static detectNoSQLInjection(input) {
    if (typeof input !== "object" && typeof input !== "string") return null;
    const str = JSON.stringify(input).toLowerCase();
    for (const pattern of NOSQL_INJECTION_PATTERNS) {
      if (pattern.test(str)) {
        return {
          type: "A05_INJECTION",
          category: "NOSQL_INJECTION",
          severity: "CRITICAL",
          message: "NoSQL injection pattern detected",
        };
      }
    }
    return null;
  }

  /**
   * Detect XSS patterns
   */
  static detectXSS(input) {
    if (!input) return null;
    const str = String(input);
    for (const pattern of MALICIOUS_INPUT_PATTERNS) {
      if (pattern.test(str)) {
        return {
          type: "A05_INJECTION",
          category: "CROSS_SITE_SCRIPTING",
          severity: "HIGH",
          message: "XSS pattern detected",
        };
      }
    }
    return null;
  }

  /**
   * Detect unauthorized access attempts
   */
  static detectAccessControl(req, user, targetUserId) {
    if (!user || !targetUserId) return null;
    if (user.id !== targetUserId && user.role.name !== "ADMIN") {
      return {
        type: "A01_BROKEN_ACCESS_CONTROL",
        category: "UNAUTHORIZED_ACCESS",
        severity: "HIGH",
        message: "Attempting to access other user's data",
        metadata: { targetUserId, userId: user.id },
      };
    }
    return null;
  }

  /**
   * Detect brute force login attempts
   */
  static detectBruteForce(failedAttempts) {
    if (failedAttempts >= 5) {
      return {
        type: "A07_AUTHENTICATION_FAILURES",
        category: "BRUTE_FORCE",
        severity: failedAttempts >= 10 ? "CRITICAL" : "HIGH",
        message: `Multiple failed login attempts detected (${failedAttempts} attempts)`,
      };
    }
    return null;
  }

  /**
   * Detect missing security headers
   */
  static detectMissingHeaders(headers) {
    const missingHeaders = [];
    const requiredHeaders = [
      "content-security-policy",
      "x-content-type-options",
      "x-frame-options",
      "x-xss-protection",
    ];

    for (const header of requiredHeaders) {
      if (!headers[header.toLowerCase()]) {
        missingHeaders.push(header);
      }
    }

    if (missingHeaders.length > 0) {
      return {
        type: "A02_SECURITY_MISCONFIGURATION",
        category: "MISSING_HEADERS",
        severity: "MEDIUM",
        message: `Missing security headers: ${missingHeaders.join(", ")}`,
      };
    }
    return null;
  }

  /**
   * Detect invalid HTTP methods on suspicious endpoints
   */
  static detectInvalidRoutes(method, path) {
    const suspiciousPaths = ["/admin", "/config", "/.env", "/debug"];
    const isInvalid = suspiciousPaths.some((p) => path.includes(p));

    if (
      isInvalid &&
      !["GET", "POST", "PUT", "DELETE", "PATCH"].includes(method)
    ) {
      return {
        type: "A02_SECURITY_MISCONFIGURATION",
        category: "INVALID_ROUTES",
        severity: "MEDIUM",
        message: `Invalid HTTP method on suspicious endpoint: ${method} ${path}`,
      };
    }
    return null;
  }

  /**
   * Detect weak JWT tokens
   */
  static detectWeakJWT(token) {
    if (!token) return null;

    // Check if token lacks standard claims
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return {
          type: "A04_CRYPTOGRAPHIC_FAILURES",
          category: "WEAK_JWT",
          severity: "CRITICAL",
          message: "Malformed JWT token",
        };
      }
    } catch (e) {
      return {
        type: "A04_CRYPTOGRAPHIC_FAILURES",
        category: "INVALID_JWT",
        severity: "CRITICAL",
        message: "Invalid JWT token format",
      };
    }

    return null;
  }

  /**
   * Detect path traversal attempts
   */
  static detectPathTraversal(path) {
    if (SUSPICIOUS_PATTERNS.pathTraversal.test(path)) {
      return {
        type: "A05_INJECTION",
        category: "PATH_TRAVERSAL",
        severity: "HIGH",
        message: "Path traversal attempt detected",
      };
    }
    return null;
  }

  /**
   * Detect command injection patterns
   */
  static detectCommandInjection(input) {
    if (!input) return null;
    const str = String(input);
    const dangerousChars = [";", "&", "|", "`", "\n", "\r"];
    const hasDangerousChars = dangerousChars.some((char) => str.includes(char));

    if (
      hasDangerousChars &&
      (str.includes("cat") || str.includes("ls") || str.includes("bash"))
    ) {
      return {
        type: "A05_INJECTION",
        category: "COMMAND_INJECTION",
        severity: "CRITICAL",
        message: "Command injection attempt detected",
      };
    }
    return null;
  }

  /**
   * Detect data integrity failures (payload tampering)
   */
  static detectTamperredPayload(originalHash, currentHash) {
    if (originalHash && currentHash && originalHash !== currentHash) {
      return {
        type: "A08_DATA_INTEGRITY_FAILURES",
        category: "PAYLOAD_TAMPERING",
        severity: "HIGH",
        message: "Request payload appears to have been tampered with",
      };
    }
    return null;
  }

  /**
   * Run all detection checks on request
   */
  static analyzeRequest(req, user = null) {
    const threats = [];
    const {
      body = {},
      query = {},
      params = {},
      headers = {},
      method,
      path,
      ip,
    } = req;

    // Check all input vectors
    const inputs = [
      JSON.stringify(body),
      JSON.stringify(query),
      JSON.stringify(params),
    ];

    for (const input of inputs) {
      const sqlCheck = this.detectSQLInjection(input);
      if (sqlCheck) threats.push(sqlCheck);

      const nosqlCheck = this.detectNoSQLInjection(input);
      if (nosqlCheck) threats.push(nosqlCheck);

      const xssCheck = this.detectXSS(input);
      if (xssCheck) threats.push(xssCheck);

      const pathCheck = this.detectPathTraversal(input);
      if (pathCheck) threats.push(pathCheck);

      const cmdCheck = this.detectCommandInjection(input);
      if (cmdCheck) threats.push(cmdCheck);
    }

    // Check headers
    const headerCheck = this.detectMissingHeaders(headers);
    if (headerCheck) threats.push(headerCheck);

    // Check JWT
    const authHeader = headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      const jwtCheck = this.detectWeakJWT(token);
      if (jwtCheck) threats.push(jwtCheck);
    }

    // Check routes
    const routeCheck = this.detectInvalidRoutes(method, path);
    if (routeCheck) threats.push(routeCheck);

    return threats;
  }
}

module.exports = OwaspDetector;
