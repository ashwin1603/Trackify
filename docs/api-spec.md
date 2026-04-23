# API Specification

## Authentication

- POST /api/auth/signup - User registration
- POST /api/auth/login - User login

## Bugs

- GET /api/bugs - List bugs
- GET /api/bugs/:id - Get bug details
- POST /api/bugs - Create bug
- PATCH /api/bugs/:id - Update bug
- DELETE /api/bugs/:id - Delete bug

## Comments

- POST /api/comments - Add comment

## Users

- GET /api/users/me/activity - User activity

## Security (SECURITY_TEAM only)

- GET /api/security/dashboard - Security dashboard
- GET /api/security/audit-logs - Audit logs
- GET /api/logs/failed-logins - Failed logins

## Audit

- GET /api/audit/logs - Audit logs (alias)
