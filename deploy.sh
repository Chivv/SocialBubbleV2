#!/bin/bash

echo "🚀 Starting deployment..."

# Exit on error
set -e

# Pull latest changes
echo "📥 Pulling latest changes..."
git fetch origin main
git reset --hard origin/main

# Clean previous builds and caches to free memory
echo "🧹 Deep cleaning to free memory..."
rm -rf .next
rm -rf node_modules
rm -rf ~/.npm/_cacache
npm cache clean --force

# Create swap file if needed (requires sudo)
echo "💾 Checking swap space..."
free -h

# Install dependencies in smaller chunks with aggressive memory limits
echo "📦 Installing dependencies with memory optimization..."
export NODE_OPTIONS="--max-old-space-size=512"

# First install only production dependencies
npm install --production --no-audit --no-fund --prefer-offline

# Then install dev dependencies needed for build
npm install --no-audit --no-fund --prefer-offline --production=false

# Build the application with strict memory limits
echo "🔨 Building application..."
export NODE_OPTIONS="--max-old-space-size=768"
npm run build

# Clear memory after build
unset NODE_OPTIONS

# Stop existing PM2 process
echo "🛑 Stopping existing process..."
pm2 stop socialbubble || true
pm2 delete socialbubble || true

# Start the application
echo "🚀 Starting application..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save
pm2 startup || true

echo "✅ Deployment complete!"
echo "📊 Application status:"
pm2 status