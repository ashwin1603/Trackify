# OWASP Threat Detection System - Deployment Guide

## Quick Start (5 minutes)

### Prerequisites

- Node.js 16+
- PostgreSQL 12+
- npm/yarn

### Backend Deployment

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Configure environment
# Edit .env with your database credentials
# DATABASE_URL=postgresql://user:password@host:5432/db

# 4. Run migrations
npx prisma migrate deploy

# 5. Seed database (creates roles, users, API key)
npx prisma db seed

# 6. Start server
npm start
```

### Frontend Deployment

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Configure environment
# Create .env.local with:
# VITE_API_BASE=http://localhost:3000
# VITE_API_KEY=dev-api-key-secure-bug-tracker-2026

# 4. Build for production
npm run build

# 5. Deploy 'dist' folder to your static host
# Or run locally
npm run dev
```

---

## Verification Checklist

After deployment, verify:

### ✓ Database

```bash
# Check tables exist
npx prisma studio

# Should see:
# - User
# - Role
# - Permission
# - SecurityAlert (NEW)
# - ApiKey (NEW)
# - AuditLog
# - Bug
# - Comment
```

### ✓ API Health

```bash
# Health check (no auth required)
curl http://localhost:3000/api/health

# Should return: {"status": "ok"}
```

### ✓ API Key Validation

```bash
# Missing API key (should fail)
curl http://localhost:3000/api/security/alerts

# Error: 403 Forbidden - "API key is required"

# Valid API key (should work)
curl -H "X-API-Key: dev-api-key-secure-bug-tracker-2026" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  http://localhost:3000/api/security/alerts

# Should return: {"data": [...], "pagination": {...}}
```

### ✓ Threat Detection

```bash
# Try SQL injection payload
curl -X POST http://localhost:3000/api/bugs \
  -H "X-API-Key: dev-api-key-secure-bug-tracker-2026" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title":"test","description":"' OR 1=1","priority":1}'

# Alert should be created automatically
# View it: /api/security/alerts?type=A05_INJECTION
```

---

## Default Credentials

**Admin Account:**

- Email: `vinayn@gmail.com`
- Password: `Admin@123`
- Role: ADMIN

**Security Team:**

- Email: `ashwinampily@gmail.com`
- Password: `Security@1`
- Role: SECURITY_TEAM

**API Key (Development):**

- `dev-api-key-secure-bug-tracker-2026`

⚠️ **WARNING**: Change these passwords and create new API keys in production!

---

## Production Setup

### 1. Environment Configuration

Create `.env` in backend/

```env
# Database
DATABASE_URL=postgresql://prod-user:secure-password@prod-db.example.com:5432/bug_tracker_prod

# JWT
JWT_SECRET=your-very-secure-random-secret-key-here

# Node
NODE_ENV=production
PORT=3000

# Optional: Error tracking
SENTRY_DSN=https://your-sentry-project@sentry.io/project-id
```

### 2. Database Backup

```bash
# Before deployment, backup production database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Run migrations on backup first to test
```

### 3. API Keys

**Create production API key:**

```bash
# Log in as admin
# POST /api/security/api-keys with name "Production - Main Service"
# Store securely (AWS Secrets Manager, HashiCorp Vault, etc.)
```

**Deactivate development key:**

```bash
# DELETE /api/security/api-keys/{dev-key-id}
```

### 4. Security Headers

Verify in browser DevTools:

```
Content-Security-Policy (added by helmet)
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 5. HTTPS/TLS

```bash
# Ensure HTTPS is enforced
# Use SSL/TLS certificates (Let's Encrypt recommended)

# Update frontend config to use https://
# VITE_API_BASE=https://api.example.com
```

### 6. Monitoring & Alerting

Set up monitoring for:

- Server uptime
- CPU/Memory usage
- Database connections
- Alert creation rate
- API response time
- Error rate

```javascript
// Example: Monitor critical alert creation
GET / api / security / stats;
// Alert if criticalCount > 5
```

### 7. Logging

Enable centralized logging:

```bash
# Log files location
/var/log/bug-tracker/

# Aggregate with: ELK Stack, DataDog, CloudWatch, etc.
```

---

## Docker Deployment (Optional)

### Dockerfile for Backend

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Run migrations on startup
RUN npx prisma generate

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

### Docker Compose

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: tracker
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: bug_tracker
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://tracker:secure_password@postgres:5432/bug_tracker
      JWT_SECRET: change-me-in-production
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_BASE: http://localhost:3000

volumes:
  postgres_data:
```

**Deploy:**

```bash
docker-compose up -d
```

---

## Troubleshooting

### Issue: "API key not found"

```bash
# Check apiKey exists in database
psql $DATABASE_URL -c "SELECT * FROM \"ApiKey\" LIMIT 5;"

# If empty, run seed
npx prisma db seed
```

### Issue: "SecurityAlert table doesn't exist"

```bash
# Check migrations
npx prisma migrate status

# Run migrations
npx prisma migrate deploy

# Or reset for development
npx prisma migrate reset
```

### Issue: "Unauthorized - Invalid JWT"

```bash
# Generate new JWT token by logging in
POST /api/auth/login
{
  "email": "vinayn@gmail.com",
  "password": "Admin@123"
}

# Copy token from response
# Use in Authorization header
```

### Issue: "High memory usage"

```bash
# Check threat cache size
# In owaspDetectionMiddleware.js, threatCache may grow
# Add periodic cleanup:

setInterval(() => {
  threatCache.clear();
  console.log("Threat cache cleared");
}, 3600000); // Every hour
```

---

## Performance Tuning

### Database Indexes

Already created on:

- `SecurityAlert.severity`
- `SecurityAlert.status`
- `SecurityAlert.type`
- `SecurityAlert.createdAt`
- `AuditLog.action`
- `AuditLog.createdAt`

### Connect Pooling

For high traffic, configure in `.env`:

```env
# Prisma uses connection pooling by default
# Adjust if needed
DATABASE_POOL_SIZE=10
DATABASE_MIN_CONNECTIONS=2
```

### API Rate Limiting

Already implemented in middleware:

- Check `src/middleware/rateLimiter.js`
- Default: 100 requests/minute per IP

---

## Backup & Recovery

### Backup Schedule

```bash
# Daily backup at 2 AM
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/bug_tracker_$(date +\%Y\%m\%d).sql.gz

# Retention: keep last 30 days
find /backups -mtime +30 -delete
```

### Restore from Backup

```bash
gunzip -c backup-20260323.sql.gz | psql $DATABASE_URL
```

---

## Updates & Maintenance

### Updating Dependencies

```bash
# Backend
cd backend
npm update
npm audit fix

# Frontend
cd frontend
npm update
npm audit fix
```

### Prisma Schema Updates

```bash
# Make changes to prisma/schema.prisma
# Generate migration
npx prisma migrate dev --name description_of_changes

# Deploy in production
npx prisma migrate deploy
```

---

## Support Resources

- **Documentation**: `docs/OWASP-THREAT-DETECTION-SYSTEM.md`
- **Setup Guide**: `docs/owasp-setup-guide.md`
- **Frontend Guide**: `docs/FRONTEND-INTEGRATION.md`
- **Test Suite**: `backend/test-owasp-system.js`
- **Implementation Summary**: `IMPLEMENTATION-SUMMARY.md`

---

## Rollback Plan

If deployment fails:

```bash
# 1. Stop application
pm2 stop bug-tracker

# 2. Restore from backup
gunzip -c backup-20260323.sql.gz | psql $DATABASE_URL

# 3. Revert code to previous version
git checkout previous-commit

# 4. Restart
pm2 start bug-tracker
```

---

## Security Checklist

- [ ] Change default admin password
- [ ] Change JWT_SECRET to random 32+ character string
- [ ] Create new production API keys
- [ ] Deactivate development API keys
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for specific domains
- [ ] Set up firewall rules
- [ ] Enable database backups
- [ ] Set up centralized logging
- [ ] Configure monitoring/alerting
- [ ] Review security headers
- [ ] Test SQL injection detection
- [ ] Verify brute force protection
- [ ] Test alert generation
- [ ] Validate role-based access control

---

**Deployment Ready**: ✅
**Last Updated**: March 23, 2026
