# Setup Guide

## Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)
- npm or yarn

## Steps

1. Clone the repository
2. Run `./scripts/setup.sh` or follow manual steps:
   - Start DB: `docker compose up -d`
   - Backend: `cd backend && npm install && npx prisma migrate dev && npx prisma generate && npx prisma db seed`
   - Frontend: `cd frontend && npm install`
3. Start servers:
   - Backend: `cd backend && npm run dev`
   - Frontend: `cd frontend && npm run dev`
4. Access at http://localhost:5173

## Environment Variables

- backend/.env: DATABASE_URL, JWT_SECRET, etc.
- frontend/.env: VITE_API_URL
