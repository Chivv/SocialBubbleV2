#!/bin/bash

echo "🚀 Starting minimal deployment..."

# Exit on error
set -e

# Pull latest changes
echo "📥 Pulling latest changes..."
git fetch origin main
git reset --hard origin/main

# Check available memory
echo "💾 Current memory status:"
free -h

# Option 1: Build locally and upload
echo "⚠️  If memory issues persist, consider:"
echo "1. Building locally: npm run build"
echo "2. Uploading the .next folder via rsync/scp"
echo "3. Only running npm ci --production on server"

# Try installation with extreme memory limits
echo "📦 Attempting minimal installation..."
export NODE_OPTIONS="--max-old-space-size=256"

# Clean everything first
rm -rf node_modules .next

# Install with minimal memory usage
npm install --production \
  --no-audit \
  --no-fund \
  --no-optional \
  --no-save \
  --prefer-offline \
  --legacy-peer-deps

echo "✅ Production dependencies installed"

# For build, you might need to:
echo "🔨 To build, run locally and upload .next folder"
echo "Or increase server memory temporarily"

# If .next folder exists (uploaded), start the app
if [ -d ".next" ]; then
  echo "🚀 Starting application..."
  pm2 stop socialbubble || true
  pm2 delete socialbubble || true
  pm2 start ecosystem.config.js --env production
  pm2 save
  echo "✅ Application started!"
else
  echo "⚠️  No .next folder found. Build locally and upload it."
fi