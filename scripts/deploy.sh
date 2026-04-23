#!/bin/bash

# Deploy script for the Secure Bug Tracking System

echo "Deploying the application..."

# Build frontend
echo "Building frontend..."
cd ../frontend
npm run build

# Deploy backend (assuming a server setup)
echo "Deploying backend..."
cd ../backend
npm run start

echo "Deployment complete!"