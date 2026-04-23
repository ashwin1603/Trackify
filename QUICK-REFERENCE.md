# Quick Reference - OWASP Alert System

## API Requests

### Headers (All Requests)

```json
{
  "Authorization": "Bearer {JWT_TOKEN}",
  "X-API-Key": "dev-api-key-secure-bug-tracker-2026",
  "Content-Type": "application/json"
}
```

---

## 1. Admin: Get All Alerts

```bash
GET /api/security/alerts?severity=CRITICAL&status=OPEN&limit=50&offset=0

# Response
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
      "user": {"id": "...", "email": "..."},
      "assignedTo": null,
      "aiAnalysis": {
        "riskScore": 95,
        "explanation": "...",
        "recommendedAction": [...]
      },
      "createdAt": "2026-03-23T06:15:00Z"
    }
  ],
  "pagination": {"total": 42, "offset": 0, "limit": 50}
}
```

---

## 2. Admin: Assign Alert

```bash
POST /api/security/assign-alert

{
  "alertId": "alert-uuid",
  "securityUserId": "user-uuid"
}

# Response
{
  "data": {
    "id": "alert-uuid",
    "status": "ASSIGNED",
    "assignedTo": {"id": "...", "email": "ashwin@example.com", "name": "Ashwin"}
  },
  "message": "Alert assigned successfully"
}
```

---

## 3. Security Team: Get My Alerts

```bash
GET /api/security/my-alerts?status=ASSIGNED&limit=20

# Same response format as Get All Alerts
```

---

## 4. Security Team: Resolve Alert

```bash
PUT /api/security/resolve-alert

{
  "alertId": "alert-uuid",
  "resolutionNotes": "Investigated - legitimate penetration testing"
}

# Response
{
  "data": {
    "id": "alert-uuid",
    "status": "RESOLVED",
    "resolutionNotes": "Investigated - legitimate...",
    "updatedAt": "2026-03-23T07:30:00Z"
  },
  "message": "Alert resolved successfully"
}
```

---

## 5. Get Statistics

```bash
GET /api/security/stats

# Response
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
      "A01_BROKEN_ACCESS_CONTROL": 15
    },
    "openCount": 5,
    "criticalCount": 1,
    "totalAlerts": 150
  }
}
```

---

## 6. Admin: Create API Key

```bash
POST /api/security/api-keys

{
  "name": "Production - Main Service"
}

# Response
{
  "data": {
    "id": "key-uuid",
    "name": "Production - Main Service",
    "key": "generated-32-char-key",
    "active": true,
    "createdAt": "2026-03-23T00:00:00Z"
  },
  "message": "API key created successfully. Store it securely..."
}
```

---

## 7. Admin: List API Keys

```bash
GET /api/security/api-keys

# Response
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
      "key": "prod-key-xxx...",
      "active": true,
      "createdAt": "2026-03-15T00:00:00Z",
      "lastUsedAt": "2026-03-23T06:55:00Z"
    }
  ]
}
```

---

## 8. Admin: Deactivate API Key

```bash
DELETE /api/security/api-keys/{keyId}

# Response
{
  "data": {
    "id": "key-uuid",
    "active": false
  },
  "message": "API key deactivated successfully"
}
```

---

## Threat Types Reference

| Code | Category                  | Example                      |
| ---- | ------------------------- | ---------------------------- |
| A01  | Broken Access Control     | User access other's data     |
| A02  | Security Misconfiguration | Missing security headers     |
| A03  | Supply Chain              | Invalid dependencies         |
| A04  | Cryptographic Failures    | Weak JWT tokens              |
| A05  | Injection                 | SQL/NoSQL/XSS/Path traversal |
| A06  | Insecure Design           | Logic bypass                 |
| A07  | Authentication Failures   | Brute force (5+ attempts)    |
| A08  | Data Integrity            | Payload tampering            |
| A09  | Logging Failures          | Missing critical logs        |
| A10  | Error Handling            | Repeated 5xx errors          |

---

## Severity Mapping

| Severity | Risk Score | Response Time |
| -------- | ---------- | ------------- |
| CRITICAL | 85-100     | 15 minutes    |
| HIGH     | 70-84      | 1 hour        |
| MEDIUM   | 50-69      | 4 hours       |
| LOW      | 20-49      | 24 hours      |

---

## Status Flow

```
OPEN → ASSIGNED → RESOLVED

OPEN (Admin reviews)
  ↓
ASSIGNED (Assigned to Security Team)
  ↓
RESOLVED (Team investigates and resolves)
```

---

## Frontend Components

### SecurityAlertBadge

- Shows CRITICAL alert count in red
- Auto-refreshes every 30 seconds
- Admin/Security Team only

```jsx
import SecurityAlertBadge from "../components/common/SecurityAlertBadge";
<SecurityAlertBadge />;
```

### SecurityAlertList

- List all/assigned alerts
- Filter by status
- Admin: assign
- Team: resolve

```jsx
import SecurityAlertList from "../components/common/SecurityAlertList";
<SecurityAlertList />;
```

---

## Curl Examples

### Get Alerts with SQL Injection

```bash
curl -H "Authorization: Bearer $JWT" \
     -H "X-API-Key: dev-api-key-secure-bug-tracker-2026" \
  "http://localhost:3000/api/security/alerts?type=A05_INJECTION&severity=CRITICAL"
```

### Assign Alert

```bash
curl -X POST http://localhost:3000/api/security/assign-alert \
  -H "Authorization: Bearer $JWT" \
  -H "X-API-Key: dev-api-key-secure-bug-tracker-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "alertId": "alert-id",
    "securityUserId": "user-id"
  }'
```

### Resolve Alert

```bash
curl -X PUT http://localhost:3000/api/security/resolve-alert \
  -H "Authorization: Bearer $JWT" \
  -H "X-API-Key: dev-api-key-secure-bug-tracker-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "alertId": "alert-id",
    "resolutionNotes": "Resolved - legitimate activity"
  }'
```

---

## Environment Variables

```bash
# Backend .env
DATABASE_URL=postgresql://user:password@host:port/db
JWT_SECRET=your-secret-key
NODE_ENV=production
PORT=3000

# Frontend .env.local
VITE_API_BASE=http://localhost:3000
VITE_API_KEY=dev-api-key-secure-bug-tracker-2026
```

---

## Default Credentials

| User       | Email                  | Password   | Role          |
| ---------- | ---------------------- | ---------- | ------------- |
| Admin      | vinayn@gmail.com       | Admin@123  | ADMIN         |
| Security 1 | ashwinampily@gmail.com | Security@1 | SECURITY_TEAM |
| Security 2 | logeshbalaji@gmail.com | Security@2 | SECURITY_TEAM |

**API Key**: `dev-api-key-secure-bug-tracker-2026`

---

## Error Responses

### 403 Forbidden (Missing API Key)

```json
{
  "error": {
    "message": "API key is required (x-api-key header)"
  }
}
```

### 401 Unauthorized (Invalid JWT)

```json
{
  "error": {
    "message": "Invalid or expired token"
  }
}
```

### 403 Forbidden (No Permission)

```json
{
  "error": {
    "message": "Forbidden: this resource requires one of [ADMIN]"
  }
}
```

### 404 Not Found

```json
{
  "error": {
    "message": "Alert not found"
  }
}
```

---

## Files Overview

```
backend/
├── src/
│   ├── middleware/
│   │   ├── globalTokenMiddleware.js       ← API key validation
│   │   └── owaspDetectionMiddleware.js    ← Threat detection
│   ├── utils/
│   │   ├── owaspDetector.js               ← Detection engine
│   │   └── securityAnalyzer.js            ← AI analysis
│   ├── services/
│   │   └── securityService.js             ← Updated with alerts
│   ├── controllers/
│   │   └── securityController.js          ← New endpoints
│   ├── routes/
│   │   └── securityRoutes.js              ← Updated routes
│   └── app.js                             ← Middleware chain
├── prisma/
│   ├── schema.prisma                      ← New models
│   └── seed.js                            ← Updated seed
└── test-owasp-system.js                   ← Test suite

frontend/
└── src/components/common/
    ├── SecurityAlertBadge.jsx             ← Alert badge
    └── SecurityAlertList.jsx              ← Alert list

docs/
├── owasp-setup-guide.md                   ← Setup
├── OWASP-THREAT-DETECTION-SYSTEM.md       ← Reference
└── FRONTEND-INTEGRATION.md                ← Frontend

IMPLEMENTATION-SUMMARY.md                  ← Complete overview
DEPLOYMENT-GUIDE.md                        ← Deployment
QUICK-REFERENCE.md                         ← This file
```

---

## Quick Test

```bash
# 1. Check health
curl http://localhost:3000/api/health

# 2. Get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vinayn@gmail.com","password":"Admin@123"}'

# 3. Get alerts
curl -H "Authorization: Bearer $TOKEN" \
  -H "X-API-Key: dev-api-key-secure-bug-tracker-2026" \
  http://localhost:3000/api/security/alerts

# 4. Test SQL injection detection
curl -X POST http://localhost:3000/api/bugs \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-API-Key: dev-api-key-secure-bug-tracker-2026" \
  -H "Content-Type: application/json" \
  -d '{"title":"test","description":"'\'' OR 1=1","priority":1}'

# 5. Check alert was created
curl -H "Authorization: Bearer $TOKEN" \
  -H "X-API-Key: dev-api-key-secure-bug-tracker-2026" \
  http://localhost:3000/api/security/alerts
```

---

**Version**: 1.0.0
**Updated**: March 23, 2026
