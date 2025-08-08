# Deployment Guide for Ploi

This guide will help you deploy the Social Bubble V2 Next.js application to Ploi.

## Prerequisites

1. A Ploi server with Node.js 18+ installed
2. Git repository connected to your Ploi site
3. PostgreSQL database (Supabase)
4. SSL certificate configured in Ploi

## Step 1: Initial Server Setup

SSH into your server and install required global packages:

```bash
# Install Node.js 18+ if not already installed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Supabase CLI
npm install -g supabase
```

## Step 2: Environment Variables

1. In Ploi, go to your site's "Environment" tab
2. Add all variables from `.env.production` file
3. Make sure to replace placeholder values with actual credentials

## Step 3: Configure Ploi Deploy Script

1. Go to your site in Ploi
2. Navigate to "Deploy Script" section
3. Replace the default script with the contents of `deploy.sh`
4. Save the deploy script

## Step 4: Update NGINX Configuration

1. In Ploi, go to "Manage" → "NGINX Configuration"
2. Replace the existing configuration with the contents of `nginx.conf`
3. Click "Save" and let Ploi test and apply the configuration

## Step 5: Create Required Directories

SSH into your server and create necessary directories:

```bash
cd /home/ploi/platform.bubbleads.nl
mkdir -p public
mkdir -p .next
```

## Step 6: Initial Deployment

1. In Ploi, click "Deploy Now" to run the deployment
2. Monitor the deployment log for any errors

## Step 7: Configure PM2 Startup

After first successful deployment, SSH into server and run:

```bash
pm2 startup systemd -u ploi --hp /home/ploi
# Copy and run the command it outputs
pm2 save
```

## Step 8: Set Up Cron Jobs (Optional)

If you need to run scheduled tasks, add them in Ploi's Cron tab:

```bash
# Example: Process email queue every 5 minutes
*/5 * * * * cd /home/ploi/platform.bubbleads.nl && npm run process-email-queue
```

## Troubleshooting

### Check Application Logs
```bash
pm2 logs socialbubble
pm2 status
```

### Check NGINX Logs
```bash
sudo tail -f /var/log/nginx/platform.bubbleads.nl-error.log
sudo tail -f /var/log/nginx/platform.bubbleads.nl-access.log
```

### Restart Application
```bash
pm2 restart socialbubble
```

### Clear Next.js Cache
```bash
cd /home/ploi/platform.bubbleads.nl
rm -rf .next
npm run build
pm2 restart socialbubble
```

### Database Migrations Not Running
```bash
cd /home/ploi/platform.bubbleads.nl
npx supabase migration up
```

## Security Considerations

1. Ensure all environment variables are properly set
2. Keep SSL certificates up to date
3. Regularly update dependencies
4. Monitor server resources
5. Set up backup strategy for database

## Performance Optimization

1. Enable NGINX caching for static assets (already configured)
2. Use CDN for images and static files
3. Monitor PM2 memory usage and adjust limits if needed
4. Consider using multiple PM2 instances for high traffic

## Monitoring

1. Set up Ploi monitoring for uptime
2. Configure PM2 monitoring:
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   ```

## Rollback Strategy

If deployment fails:
1. Check deployment logs in Ploi
2. SSH into server and check PM2 logs
3. If needed, rollback using Git:
   ```bash
   cd /home/ploi/platform.bubbleads.nl
   git log --oneline -10  # Find previous working commit
   git checkout <commit-hash>
   npm ci
   npm run build
   pm2 restart socialbubble
   ```