# System Architecture

## Overview

The Secure Bug Tracking System is a full-stack web application with role-based access control.

## Components

- **Frontend**: React SPA with Vite, Tailwind CSS
- **Backend**: Node.js Express API with Prisma ORM
- **Database**: PostgreSQL
- **Security**: JWT, bcrypt, rate limiting, audit logging

## Data Flow

1. User authenticates via frontend
2. Frontend calls backend APIs with JWT
3. Backend validates permissions and processes requests
4. Data stored/retrieved from PostgreSQL via Prisma
5. Audit logs recorded for security

## Roles

- TESTER: Bug creation and viewing
- DEVELOPER: Bug assignment and updates
- ADMIN: Full management
- SECURITY_TEAM: Security monitoring
