#!/bin/bash

echo "🚀 Starting deployment..."

# Exit on error
set -e

# Save existing .env.production if it exists
if [ -f .env.production ]; then
  echo "💾 Backing up existing .env.production..."
  cp .env.production .env.production.backup
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git fetch origin main
git reset --hard origin/main

# Restore .env.production from backup
if [ -f .env.production.backup ]; then
  echo "♻️  Restoring .env.production from backup..."
  mv .env.production.backup .env.production
elif [ ! -f .env.production ] && [ -f .env.production.example ]; then
  echo "📝 Creating .env.production from example (please update with real values)..."
  cp .env.production.example .env.production
  echo "⚠️  WARNING: Using placeholder values. Please update .env.production with real values!"
fi

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