# OWASP Top 10 Threat Detection & Alert System

## Production-Ready Implementation

This document provides a complete overview of the OWASP-based threat detection and alert system with AI analysis and admin-controlled escalation.

---

## System Architecture

```
Request Flow
    ↓
Helmet (Security Headers)
    ↓
CORS Handling
    ↓
Global API Token Validation (validateGlobalToken)
    ↓
OWASP Detection Middleware (owaspDetectionMiddleware)
    ├─→ Analyze for OWASP Top 10 threats
    ├─→ Generate SecurityAlert records
    ├─→ AI Risk Analysis
    └─→ Auto-throttle (1 alert/minute per threat/IP)
    ↓
Route Handlers (Auth, Bugs, Comments, Security)
    ↓
Response Processing
    ↓
Error Handler
```

---

## 1. Global API Key Validation

### Implementation

- **Middleware**: `globalTokenMiddleware.js`
- **Header**: `X-API-Key`
- **Validation**: All endpoints except `/api/health`
- **Response**: 403 Forbidden if invalid/missing

### Usage

```bash
# Valid request
curl -H "X-API-Key: dev-api-key-secure-bug-tracker-2026" \
  http://localhost:3000/api/security/alerts

# Invalid / Missing (returns 403)
curl http://localhost:3000/api/security/alerts
```

### Database Model

```prisma
model ApiKey {
  id         String    @id @default(uuid())
  key        String    @unique
  name       String
  active     Boolean   @default(true)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  lastUsedAt DateTime?
}
```

---

## 2. OWASP Threat Detection Engine

### Threat Categories Detected

| ID      | Category                  | Detection Method                                    |
| ------- | ------------------------- | --------------------------------------------------- |
| **A01** | Broken Access Control     | Unauthorized data access, privilege escalation      |
| **A02** | Security Misconfiguration | Missing security headers, invalid routes            |
| **A03** | Supply Chain              | Dependency analysis (logged)                        |
| **A04** | Cryptographic Failures    | Weak JWT, invalid tokens, missing HTTPS             |
| **A05** | Injection                 | SQL, NoSQL, XSS, path traversal, command injection  |
| **A06** | Insecure Design           | Missing validation, logic bypass                    |
| **A07** | Authentication Failures   | Brute force (5+ failed attempts), repeated failures |
| **A08** | Data Integrity            | Payload tampering, hash mismatches                  |
| **A09** | Logging Failures          | Missing critical action logs                        |
| **A10** | Error Handling            | Repeated 5xx errors (3+ in 5 minutes)               |

### Detection Implementation

**File**: `src/utils/owaspDetector.js`

```javascript
// All detection happens automatically on each request
OwaspDetector.analyzeRequest(req, user);

// Returns array of threats detected:
[
  {
    type: "A05_INJECTION",
    category: "SQL_INJECTION",
    severity: "CRITICAL",
    message: "SQL injection pattern detected",
    pattern: "OR 1=1",
  },
];
```

### Detection Examples

**SQL Injection Patterns:**

- `' OR 1=1`
- `'; DROP TABLE users; --`
- `1' UNION SELECT password`

**XSS Patterns:**

- `<script>alert('xss')</script>`
- `javascript:void(0)`
- `onerror=alert('xss')`

**Command Injection:**

- `; ls /etc/passwd`
- `& whoami`
- `| cat /root/.ssh/id_rsa`

**Path Traversal:**

- `../../../../../../etc/passwd`
- `..\..\..\..\windows\system32\config\sam`

---

## 3. SecurityAlert Model & Generation

### Alert Model

```prisma
model SecurityAlert {
  id           String        @id @default(uuid())
  type         String        // OWASP category
  message      String        // Human-readable description
  severity     AlertSeverity // LOW, MEDIUM, HIGH, CRITICAL
  status       AlertStatus   // OPEN, ASSIGNED, RESOLVED
  ipAddress    String?
  endpoint     String?       // GET /api/bugs
  userId       String?
  user         User?
  assignedToId String?
  assignedTo   User?         // Security team member
  metadata     Json?         // Category, URL, user agent, etc.
  aiAnalysis   Json?         // { riskScore, explanation, recommendedAction }
  resolutionNotes String?    // Resolution notes from team
  createdAt    DateTime
  updatedAt    DateTime
}
```

### Alert Lifecycle

```
Detection → Create Alert (OPEN)
         ↓
    Admin Reviews
         ↓
    Admin Assigns → Alert Status = ASSIGNED
         ↓
    Security Team Reviews & Investigates
         ↓
    Team Resolves → Alert Status = RESOLVED (with notes)
```

### Auto-Throttling

- **Purpose**: Prevent alert spam
- **Rule**: Max 1 alert per threat type per IP address per minute
- **Implementation**: In-memory cache with timestamp tracking

---

## 4. AI-Powered Risk Analysis

### Analyzer: `src/utils/securityAnalyzer.js`

#### Risk Scoring (0-100)

```
Base Score by Severity:
- CRITICAL: 90
- HIGH: 70
- MEDIUM: 50
- LOW: 20

Type Multipliers:
- A01 (Access Control): 1.3x
- A04 (Cryptography): 1.25x
- A05 (Injection): 1.4x
- A07 (Auth Failures): 1.2x
- A02 (Misconfiguration): 0.8x

Repeat Bonus:
- +5 points per repeat after 3rd occurrence
```

#### Analysis Output

```json
{
  "riskScore": 85,
  "explanation": "SQL injection pattern detected in request. Attacker may be attempting to manipulate database queries.",
  "recommendedAction": [
    "URGENT: Escalate to security team immediately",
    "Use parameterized queries/prepared statements",
    "Implement input validation and sanitization",
    "Isolate affected systems if necessary"
  ],
  "analysisTimestamp": "2026-03-23T06:32:26.000Z"
}
```

---

## 5. Alert Management API

### Admin Endpoints

#### GET /api/security/alerts

**List all alerts with filters**

```bash
GET /api/security/alerts?severity=CRITICAL&status=OPEN&limit=50&offset=0
Authorization: Bearer {ADMIN_JWT}
X-API-Key: {API_KEY}

Response:
{
  "data": [
    {
      "id": "alert-uuid",
      "type": "A05_INJECTION",
      "message": "SQL injection pattern detected",
      "severity": "CRITICAL",
      "status": "OPEN",
      "endpoint": "POST /api/bugs",
      "ipAddress": "192.168.1.100",
      "user": { "id": "...", "email": "..." },
      "aiAnalysis": {
        "riskScore": 95,
        "explanation": "...",
        "recommendedAction": [...]
      },
      "createdAt": "2026-03-23T06:15:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "offset": 0,
    "limit": 50
  }
}
```

#### POST /api/security/assign-alert

**Assign alert to security team member**

```bash
POST /api/security/assign-alert
Authorization: Bearer {ADMIN_JWT}
X-API-Key: {API_KEY}
Content-Type: application/json

{
  "alertId": "alert-uuid",
  "securityUserId": "security-team-user-id"
}

Response:
{
  "data": {
    "id": "alert-uuid",
    "status": "ASSIGNED",
    "assignedTo": {
      "id": "...",
      "email": "ashwinampily@gmail.com",
      "name": "Ashwin Ampily"
    }
  },
  "message": "Alert assigned successfully"
}
```

### Security Team Endpoints

#### GET /api/security/my-alerts

**View assigned alerts**

```bash
GET /api/security/my-alerts?status=ASSIGNED&limit=50
Authorization: Bearer {SECURITY_TEAM_JWT}
X-API-Key: {API_KEY}

Response:
{
  "data": [
    {
      "id": "alert-uuid",
      "type": "A07_AUTHENTICATION_FAILURES",
      "message": "Multiple failed login attempts detected (6 attempts)",
      "severity": "HIGH",
      "status": "ASSIGNED",
      "assignedTo": { "id": "...", "email": "..." },
      "aiAnalysis": {
        "riskScore": 78,
        "recommendedAction": [
          "Lock user account temporarily",
          "Implement rate limiting on login endpoint"
        ]
      }
    }
  ]
}
```

#### PUT /api/security/resolve-alert

**Resolve alert with investigation notes**

```bash
PUT /api/security/resolve-alert
Authorization: Bearer {SECURITY_TEAM_JWT}
X-API-Key: {API_KEY}
Content-Type: application/json

{
  "alertId": "alert-uuid",
  "resolutionNotes": "False positive - legitimate penetration testing activity authorized by management"
}

Response:
{
  "data": {
    "id": "alert-uuid",
    "status": "RESOLVED",
    "resolutionNotes": "False positive - ...",
    "updatedAt": "2026-03-23T06:45:00Z"
  },
  "message": "Alert resolved successfully"
}
```

### Shared Endpoints

#### GET /api/security/stats

**Alert statistics dashboard**

```bash
GET /api/security/stats
Authorization: Bearer {JWT}
X-API-Key: {API_KEY}

Response:
{
  "data": {
    "statusStats": {
      "OPEN": 5,
      "ASSIGNED": 3,
      "RESOLVED": 142
    },
    "severityStats": {
      "CRITICAL": 1,
      "HIGH": 8,
      "MEDIUM": 24,
      "LOW": 117
    },
    "typeStats": {
      "A05_INJECTION": 45,
      "A07_AUTHENTICATION_FAILURES": 28,
      "A02_SECURITY_MISCONFIGURATION": 15,
      ...
    },
    "openCount": 5,
    "criticalCount": 1,
    "totalAlerts": 150
  }
}
```

---

## 6. API Key Management

### Create API Key (Admin)

```bash
POST /api/security/api-keys
Authorization: Bearer {ADMIN_JWT}
X-API-Key: {CURRENT_API_KEY}
Content-Type: application/json

{
  "name": "Production API Key - Main Service"
}

Response:
{
  "data": {
    "id": "key-uuid",
    "name": "Production API Key - Main Service",
    "key": "abcd1234efgh5678ijkl9012mnop3456",
    "active": true,
    "createdAt": "2026-03-23T06:50:00Z"
  },
  "message": "API key created successfully. Store it securely - it won't be shown again."
}
```

### List API Keys (Admin)

```bash
GET /api/security/api-keys
Authorization: Bearer {ADMIN_JWT}
X-API-Key: {API_KEY}

Response:
{
  "data": [
    {
      "id": "key-1",
      "name": "Development",
      "key": "dev-api-key-secure-bug-tracker-2026",
      "active": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "lastUsedAt": "2026-03-23T06:50:00Z"
    },
    {
      "id": "key-2",
      "name": "Production",
      "key": "prod-api-key-xxx...",
      "active": true,
      "createdAt": "2026-03-15T00:00:00Z",
      "lastUsedAt": "2026-03-23T06:55:00Z"
    }
  ]
}
```

### Deactivate API Key (Admin)

```bash
DELETE /api/security/api-keys/{keyId}
Authorization: Bearer {ADMIN_JWT}
X-API-Key: {API_KEY}

Response:
{
  "data": {
    "id": "key-uuid",
    "active": false
  },
  "message": "API key deactivated successfully"
}
```

---

## 7. Role-Based Access Control

### Admin Role

- ✓ View all security alerts
- ✓ Assign alerts to security team
- ✓ Manage API keys
- ✓ View alert statistics
- ✓ Access security dashboard

### Security Team Role

- ✓ View assigned alerts only
- ✓ Resolve alerts with notes
- ✓ View shared statistics
- ✓ Access security dashboard

### Developer / Tester Roles

- ✗ No alert system access
- ✗ No security management access

---

## 8. Logging & Audit Trail

### Audit Log Events

All security events logged to `AuditLog`:

```prisma
model AuditLog {
  id         String    @id
  actorId    String?   // Admin or SecurityTeam member
  actor      User?
  action     String    // "SECURITY_THREAT_DETECTED", "ALERT_ASSIGNED", etc.
  entityType String    // "SecurityAlert"
  entityId   String?   // Alert ID
  metadata   Json?     // Contextual data
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime
}
```

### Logged Actions

- `LOGIN_FAILED` - Failed authentication attempt
- `SECURITY_THREAT_DETECTED` - Threat detection triggered
- `ALERT_ASSIGNED` - Alert assigned to team member
- `ALERT_RESOLVED` - Alert resolved with notes
- `UNAUTHORIZED_ACCESS` - Access control violation

---

## 9. Middleware Execution Order

```
1. helmet()                    // Security headers
2. cors()                      // CORS handling
3. express.json()              // JSON parsing
4. morgan()                    // Request logging
5. validateGlobalToken         // API key validation
6. owaspDetectionMiddleware    // Threat detection & alerting
7. authenticate (per route)    // JWT validation
8. allowRoles (per route)      // Role-based access
9. Route handler
10. errorHandler               // Error formatting
```

---

## 10. Database Changes

### New Tables

- `SecurityAlert` - Detected threats and alerts
- `ApiKey` - API key management

### Schema Additions

- `User` relations: `securityAlerts`, `assignedAlerts`
- Indexes on severity, status, type, createdAt, assignedToId

---

## 11. Configuration

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:port/db
JWT_SECRET=your-jwt-secret-key
NODE_ENV=production  # or development
PORT=3000
```

### Initial Setup

```bash
cd backend

# Install dependencies
npm install

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Verify
npx prisma studio
```

---

## 12. Production Deployment

### Pre-Deployment Checklist

- [ ] Generate new production API keys
- [ ] Remove/deactivate development API keys
- [ ] Configure strong database credentials
- [ ] Set up monitoring and alerting for CRITICAL alerts
- [ ] Configure TLS/HTTPS
- [ ] Review firewall rules
- [ ] Set up log aggregation
- [ ] Test all alert endpoints
- [ ] Train security team on alert workflows

### Key Security Practices

1. **API Key Rotation**
   - Rotate keys monthly
   - Use secure storage (AWS Secrets Manager, etc.)
   - Never commit to version control

2. **Alert Response SLAs**
   - CRITICAL: 15 minutes response time
   - HIGH: 1 hour response time
   - MEDIUM: 4 hours response time
   - LOW: 24 hours response time

3. **Monitoring**
   - Track alert creation rate
   - Monitor for alert storms
   - Review resolved alerts weekly
   - Adjust detection rules based on false positives

---

## 13. Troubleshooting

### Alerts Not Being Created

1. Verify migration applied: `npx prisma migrate status`
2. Check middleware loaded in `app.js`
3. Review server logs for errors
4. Test with SQL injection attempt

### API Key Always Rejected

1. Verify key exists: `npx prisma studio` → ApiKey table
2. Check key is active: `active = true`
3. Verify header format: `X-API-Key` (case-sensitive)
4. Check for extra spaces in header value

### Can't Assign Alerts

1. Verify security team user exists and has SECURITY_TEAM role
2. Confirm admin is authenticated with valid JWT
3. Check X-API-Key header is valid
4. Review audit logs for errors

### High False Positive Rate

1. Review detected patterns
2. Adjust detection thresholds in `owaspDetector.js`
3. Implement pattern whitelist for legitimate payloads
4. Update regex patterns

---

## 14. Files Modified/Created

### Created Files

- ✨ `src/utils/owaspDetector.js` - Threat detection engine
- ✨ `src/utils/securityAnalyzer.js` - AI risk analysis
- ✨ `src/middleware/globalTokenMiddleware.js` - API key validation
- ✨ `src/middleware/owaspDetectionMiddleware.js` - Detection middleware
- ✨ `docs/owasp-setup-guide.md` - Setup documentation
- ✨ `test-owasp-system.js` - Test suite

### Modified Files

- 📝 `prisma/schema.prisma` - Added SecurityAlert, ApiKey models
- 📝 `src/services/securityService.js` - Extended with alert management
- 📝 `src/controllers/securityController.js` - New alert endpoints
- 📝 `src/routes/securityRoutes.js` - New alert routes
- 📝 `src/app.js` - Middleware chain integration
- 📝 `prisma/seed.js` - API key seeding

---

## 15. API Endpoint Summary

| Method | Endpoint                      | Role          | Status |
| ------ | ----------------------------- | ------------- | ------ |
| GET    | `/api/health`                 | Public        | Active |
| GET    | `/api/security/alerts`        | ADMIN         | Active |
| GET    | `/api/security/alerts/:id`    | ADMIN         | Active |
| POST   | `/api/security/assign-alert`  | ADMIN         | Active |
| GET    | `/api/security/my-alerts`     | SECURITY_TEAM | Active |
| PUT    | `/api/security/resolve-alert` | SECURITY_TEAM | Active |
| GET    | `/api/security/stats`         | ADMIN/TEAM    | Active |
| POST   | `/api/security/api-keys`      | ADMIN         | Active |
| GET    | `/api/security/api-keys`      | ADMIN         | Active |
| DELETE | `/api/security/api-keys/:id`  | ADMIN         | Active |
| GET    | `/api/security/dashboard`     | ADMIN/TEAM    | Active |
| GET    | `/api/security/audit-logs`    | ADMIN/TEAM    | Active |

---

## 16. Support & Resources

For issues or questions:

1. Check troubleshooting section above
2. Review audit logs: `npx prisma studio`
3. Test endpoints with `test-owasp-system.js`
4. Review documentation in `docs/`

---

**System Status**: ✅ Production Ready
**Last Updated**: March 23, 2026
**Version**: 1.0.0
