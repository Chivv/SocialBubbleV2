#!/bin/bash

# Ploi Deploy Script for Next.js Application
# This script should be added to your Ploi server's deploy script section

echo "🚀 Starting deployment..."

# Navigate to the project directory
cd /home/ploi/platform.bubbleads.nl || exit

# Pull the latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Run database migrations
echo "🗄️ Running database migrations..."
npx supabase migration up

# Build the Next.js application
echo "🏗️ Building application..."
npm run build

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Stop the existing PM2 process (if running)
echo "🛑 Stopping existing application..."
pm2 stop socialbubble || true

# Start the application with PM2
echo "🟢 Starting application..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Ensure PM2 starts on system reboot
pm2 startup systemd -u ploi --hp /home/ploi || true

echo "✅ Deployment completed successfully!"