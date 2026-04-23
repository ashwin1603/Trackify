#!/bin/bash

# Setup script for the Secure Bug Tracking System

echo "Setting up the project..."

# Start Docker services
echo "Starting PostgreSQL with Docker Compose..."
docker compose up -d

# Wait for DB to be ready
echo "Waiting for database to be ready..."
sleep 10

# Backend setup
echo "Setting up backend..."
cd ../backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Frontend setup
echo "Setting up frontend..."
cd ../frontend
npm install

echo "Setup complete!"
echo "Run 'cd backend && npm run dev' and 'cd frontend && npm run dev' to start the application."