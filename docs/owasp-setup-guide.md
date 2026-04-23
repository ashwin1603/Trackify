# OWASP Threat Detection & Alert System Setup

## Overview

This document covers the OWASP-based threat detection and alert system implementation, including global API key validation, threat detection, alert generation, and admin/security team workflows.

## Features

### 1. Global API Key Validation

- **Endpoint**: All requests (except `/api/health`)
- **Header**: `X-API-Key`
- **Response**: 403 Unauthorized if missing or invalid
- **Default Key**: `dev-api-key-secure-bug-tracker-2026` (development only)

### 2. OWASP Top 10 Threat Detection

Detects threats in all 10 OWASP categories:

| Category                        | Threats Detected                                   |
| ------------------------------- | -------------------------------------------------- |
| A01 - Broken Access Control     | Unauthorized access, data exposure                 |
| A02 - Security Misconfiguration | Missing security headers, invalid routes           |
| A03 - Supply Chain              | Suspicious dependency usage                        |
| A04 - Cryptographic Failures    | Weak JWT, invalid tokens                           |
| A05 - Injection                 | SQL, NoSQL, XSS, path traversal, command injection |
| A06 - Insecure Design           | Logic bypass, missing validation                   |
| A07 - Authentication Failures   | Brute force, failed logins                         |
| A08 - Data Integrity            | Payload tampering                                  |
| A09 - Logging Failures          | Missing critical logs                              |
| A10 - Error Handling            | Repeated 5xx errors                                |

### 3. Alert Generation & Storage

- **Model**: `SecurityAlert`
- **Statuses**: OPEN, ASSIGNED, RESOLVED
- **Severity Levels**: LOW, MEDIUM, HIGH, CRITICAL
- **Auto-Throttling**: Max 1 alert per threat type per IP per minute
- **AI Analysis**: Risk scoring (0-100), explanations, recommendations

### 4. Admin Functions

- View all alerts: `GET /api/security/alerts`
- Filter by severity, status, type
- Assign alerts to security team: `POST /api/security/assign-alert`
- Manage API keys: `POST /api/security/api-keys`
- View alert statistics: `GET /api/security/stats`

### 5. Security Team Functions

- View assigned alerts: `GET /api/security/my-alerts`
- Resolve alerts with notes: `PUT /api/security/resolve-alert`
- View shared statistics: `GET /api/security/stats`

## Configuration

### Environment Variables

Add to `.env`:

```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key
```

### Database Migration

Already handled by seed script:

```bash
npx prisma migrate dev
npx prisma db seed
```

## API Key Management

### Create API Key (Admin)

```bash
POST /api/security/api-keys
Authorization: Bearer {JWT_TOKEN}
X-API-Key: {CURRENT_API_KEY}
Content-Type: application/json

{
  "name": "Production API Key"
}
```

### List API Keys (Admin)

```bash
GET /api/security/api-keys
Authorization: Bearer {JWT_TOKEN}
X-API-Key: {API_KEY}
```

### Deactivate API Key (Admin)

```bash
DELETE /api/security/api-keys/{keyId}
Authorization: Bearer {JWT_TOKEN}
X-API-Key: {API_KEY}
```

## Alert Workflow

### 1. Threat Detection

- All requests analyzed for OWASP threats
- Threats auto-generate `SecurityAlert` records
- Critical threats immediately flagged

### 2. Admin Assignment

Admin receives alerts and assigns to security team:

```bash
POST /api/security/assign-alert
Authorization: Bearer {ADMIN_JWT}
X-API-Key: {API_KEY}

{
  "alertId": "alert-uuid",
  "securityUserId": "security-team-user-id"
}
```

### 3. Security Team Resolution

Team member resolves with notes:

```bash
PUT /api/security/resolve-alert
Authorization: Bearer {SECURITY_TEAM_JWT}
X-API-Key: {API_KEY}

{
  "alertId": "alert-uuid",
  "resolutionNotes": "False positive - legitimate activity"
}
```

## Middleware Stack

Requests flow through:

1. `helmet()` - Security headers
2. `cors()` - CORS handling
3. `validateGlobalToken` - API key validation
4. `owaspDetectionMiddleware` - Threat detection & alerting
5. Route handlers
6. `errorHandler` - Error response formatting

## Detection Examples

### SQL Injection Detection

```javascript
// Detected patterns
' OR 1=1
'; DROP TABLE users; --
1' UNION SELECT * FROM passwords
```

### XSS Detection

```javascript
// Detected patterns
<script>alert('xss')</script>;
javascript: void 0;
onerror = alert("xss");
```

### Brute Force Detection

```javascript
// Triggers alert when user has 5+ failed attempts
// Auto-escalates at 10+ attempts
```

### Authentication Failures

```javascript
// Tracked via User.failedLoginAttempts
// Auto-logged in AuditLog
```

## Security Team Roles & Permissions

### ADMIN Role

- Full alert visibility
- Assign alerts to team
- Manage API keys
- View audit logs
- System configuration

### SECURITY_TEAM Role

- View assigned alerts only
- Resolve alerts with notes
- View aggregated statistics
- Limited audit log access

### DEVELOPER / TESTER Roles

- No alert access
- No security dashboard access

## Alert Statistics Dashboard

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
      "RESOLVED": 42
    },
    "severityStats": {
      "CRITICAL": 1,
      "HIGH": 4,
      "MEDIUM": 6,
      "LOW": 2
    },
    "typeStats": {
      "A05_INJECTION": 3,
      "A07_AUTHENTICATION_FAILURES": 2,
      ...
    },
    "openCount": 5,
    "criticalCount": 1,
    "totalAlerts": 50
  }
}
```

## Logging & Audit Trail

All security events logged to `AuditLog`:

- Login failures
- Unauthorized access attempts
- Alert assignments
- Alert resolutions
- Security events

## Best Practices

1. **API Key Security**
   - Rotate keys regularly (monthly recommended)
   - Use environment variables, never hardcode
   - Deactivate unused keys

2. **Alert Management**
   - Review CRITICAL alerts within 15 minutes
   - Assign alerts within 1 hour
   - Resolve within 24 hours

3. **Monitoring**
   - Check dashboard daily
   - Track resolution patterns
   - Adjust detection rules as needed

4. **Production Deployment**
   - Generate new production API key
   - Never use development key
   - Enable request logging
   - Set up alert notifications

## Testing

```bash
# Test with valid API key
curl -H "X-API-Key: dev-api-key-secure-bug-tracker-2026" \
  http://localhost:3000/api/security/alerts

# Test with invalid API key (should get 403)
curl -H "X-API-Key: invalid-key" \
  http://localhost:3000/api/security/alerts

# Test without API key (should get 403)
curl http://localhost:3000/api/security/alerts
```

## Troubleshooting

**Q: Alerts not being created**

- Verify database migration ran: `npx prisma migrate status`
- Check OWASP middleware is loaded in app.js
- Review logs for middleware errors

**Q: API key rejected**

- Verify key exists in database: `prisma studio`
- Check key is active: `active = true`
- Ensure correct header: `X-API-Key` (case-sensitive)

**Q: Can't assign alerts**

- Verify security team user exists and has SECURITY_TEAM role
- Check admin is authenticated with valid JWT
- Verify API key is valid with X-API-Key header

## Files Modified/Created

**New Files:**

- `src/utils/owaspDetector.js` - OWASP threat detection
- `src/utils/securityAnalyzer.js` - AI risk analysis
- `src/middleware/globalTokenMiddleware.js` - API key validation
- `src/middleware/owaspDetectionMiddleware.js` - Detection middleware
- `docs/owasp-setup-guide.md` - This file

**Modified Files:**

- `prisma/schema.prisma` - Added SecurityAlert and ApiKey models
- `src/services/securityService.js` - Extended with alert management
- `src/controllers/securityController.js` - New alert endpoints
- `src/routes/securityRoutes.js` - New alert routes
- `src/app.js` - Added middleware chain
- `prisma/seed.js` - Added API key seeding

## API Endpoints Summary

| Method | Endpoint                      | Role          | Purpose                |
| ------ | ----------------------------- | ------------- | ---------------------- |
| GET    | `/api/health`                 | Public        | Health check (no auth) |
| GET    | `/api/security/alerts`        | ADMIN         | List all alerts        |
| GET    | `/api/security/alerts/:id`    | ADMIN         | Get alert details      |
| POST   | `/api/security/assign-alert`  | ADMIN         | Assign alert to team   |
| GET    | `/api/security/my-alerts`     | SECURITY_TEAM | Assigned alerts        |
| PUT    | `/api/security/resolve-alert` | SECURITY_TEAM | Resolve alert          |
| GET    | `/api/security/stats`         | ADMIN/TEAM    | Alert statistics       |
| POST   | `/api/security/api-keys`      | ADMIN         | Create API key         |
| GET    | `/api/security/api-keys`      | ADMIN         | List API keys          |
| DELETE | `/api/security/api-keys/:id`  | ADMIN         | Deactivate key         |

All endpoints require:

- `Authorization: Bearer {JWT_TOKEN}` header
- `X-API-Key: {API_KEY}` header
