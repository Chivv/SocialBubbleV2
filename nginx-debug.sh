#!/bin/bash

echo "🔍 Debugging Nginx startup issue..."

# 1. Check the detailed error
echo "📋 Nginx service status:"
sudo systemctl status nginx.service

echo -e "\n📋 Recent Nginx journal entries:"
sudo journalctl -xeu nginx.service -n 50

# 2. Test Nginx configuration
echo -e "\n🧪 Testing Nginx configuration:"
sudo nginx -t

# 3. Check for port conflicts
echo -e "\n🔍 Checking what's using port 80 and 443:"
sudo lsof -i :80
sudo lsof -i :443

# 4. Check Nginx error log
echo -e "\n📄 Recent Nginx error log entries:"
sudo tail -n 50 /var/log/nginx/error.log

# 5. Check if another web server is running
echo -e "\n🔍 Checking for Apache:"
sudo systemctl status apache2 2>/dev/null || echo "Apache2 not found"

# 6. Try to find the specific error
echo -e "\n🔍 Checking Nginx configuration files:"
sudo ls -la /etc/nginx/sites-enabled/
sudo ls -la /etc/nginx/sites-available/