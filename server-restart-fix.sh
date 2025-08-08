#!/bin/bash

echo "🔧 Fixing services after server restart..."

# 1. Check if Nginx is running
echo "📍 Checking Nginx status..."
sudo systemctl status nginx

# If not running, start it
echo "🚀 Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# 2. Check if PM2 processes are running
echo "📍 Checking PM2 processes..."
pm2 list

# Resurrect PM2 saved processes
echo "🔄 Resurrecting PM2 processes..."
pm2 resurrect

# 3. Start all PM2 processes if needed
echo "🚀 Starting all PM2 apps..."
pm2 start all

# 4. Check if MySQL/PostgreSQL is running (if used)
echo "📍 Checking database services..."
sudo systemctl status mysql || sudo systemctl status postgresql

# Start if needed
sudo systemctl start mysql || sudo systemctl start postgresql

# 5. Save PM2 configuration for auto-start
echo "💾 Setting up PM2 startup..."
pm2 save
pm2 startup systemd -u $USER --hp $HOME
# Copy and run the command it outputs

# 6. Check all services
echo "✅ Service status:"
echo "-------------------"
sudo systemctl status nginx
echo "-------------------"
pm2 list
echo "-------------------"

echo "🎯 All services should now be running!"