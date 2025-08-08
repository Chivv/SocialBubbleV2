#!/bin/bash

echo "🚀 Server Setup Script for Next.js on Ploi"
echo "==========================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
   echo "⚠️  Please run this script with sudo: sudo bash setup-server.sh"
   exit 1
fi

echo "📝 This script will:"
echo "  1. Check if PM2 process is running"
echo "  2. Update NGINX configuration for Next.js"
echo "  3. Test and reload NGINX"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# Check PM2 status
echo ""
echo "📊 Checking PM2 status..."
su - ploi -c "pm2 status"

# Check if the app is running on port 3000
echo ""
echo "🔍 Checking if app is running on port 3000..."
if netstat -tuln | grep -q ':3000'; then
    echo "✅ App is running on port 3000"
else
    echo "❌ App is NOT running on port 3000"
    echo "   Please run the deployment script first: ./deploy.sh"
    exit 1
fi

# Backup current NGINX config
echo ""
echo "💾 Backing up current NGINX config..."
cp /etc/nginx/sites-available/platform.bubbleads.nl /etc/nginx/sites-available/platform.bubbleads.nl.backup.$(date +%Y%m%d-%H%M%S)

# Update NGINX config
echo ""
echo "📝 Updating NGINX configuration..."
cat > /etc/nginx/sites-available/platform.bubbleads.nl << 'EOF'
# Ploi Webserver Configuration, do not remove!
include /etc/nginx/ploi/platform.bubbleads.nl/before/*;

server {
    #listen 80;
    #listen [::]:80;

    server_name platform.bubbleads.nl;

    include /etc/nginx/ssl/platform.bubbleads.nl;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ecdh_curve X25519:prime256v1:secp384r1;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_dhparam /etc/nginx/dhparams.pem;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    charset utf-8;

    # Ploi Configuration, do not remove!
    include /etc/nginx/ploi/platform.bubbleads.nl/server/*;

    # Proxy all requests to Next.js application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Handle Next.js static files
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }

    # Handle Next.js image optimization
    location /_next/image {
        proxy_pass http://127.0.0.1:3000;
    }

    # Handle favicon
    location = /favicon.ico {
        proxy_pass http://127.0.0.1:3000;
        access_log off;
        log_not_found off;
    }

    # Handle robots.txt
    location = /robots.txt {
        proxy_pass http://127.0.0.1:3000;
        access_log off;
        log_not_found off;
    }

    access_log /var/log/nginx/platform.bubbleads.nl-access.log;
    error_log  /var/log/nginx/platform.bubbleads.nl-error.log error;
}

# Ploi Webserver Configuration, do not remove!
include /etc/nginx/ploi/platform.bubbleads.nl/after/*;
EOF

# Test NGINX configuration
echo ""
echo "🧪 Testing NGINX configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ NGINX configuration is valid"
    echo "🔄 Reloading NGINX..."
    systemctl reload nginx
    echo "✅ NGINX reloaded successfully"
    
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Your Next.js app should now be accessible at:"
    echo "  https://platform.bubbleads.nl"
    echo ""
    echo "To check app logs, run:"
    echo "  su - ploi -c 'pm2 logs socialbubble'"
else
    echo ""
    echo "❌ NGINX configuration test failed"
    echo "   Restoring backup..."
    cp /etc/nginx/sites-available/platform.bubbleads.nl.backup.$(date +%Y%m%d-%H%M%S) /etc/nginx/sites-available/platform.bubbleads.nl
    echo "   Please check the error messages above"
    exit 1
fi