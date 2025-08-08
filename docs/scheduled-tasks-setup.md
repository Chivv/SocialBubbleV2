# Scheduled Tasks Setup with pg_cron and Supabase Edge Functions

This guide explains how to set up and manage scheduled tasks that run daily at 8:00 AM Amsterdam time using pg_cron and Supabase Edge Functions.

## Overview

The scheduled task system consists of:
1. **pg_cron** - PostgreSQL extension that schedules database jobs
2. **Edge Function** - Deno-based function that executes the actual task logic
3. **HTTP Extension** - Allows PostgreSQL to make HTTP calls to the edge function
4. **Cron Logs** - Database table to track execution history

## Prerequisites

1. **Supabase CLI** - Install it globally:
   ```bash
   npm install -g supabase
   ```

2. **Supabase Pro Plan** - Required for pg_cron extension

3. **Environment Variables** - Add to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Setup Instructions

### 1. Enable Required Extensions

Run the migrations to enable pg_cron and http extensions:

```bash
npm run supabase:migration:up
```

This will:
- Enable pg_cron extension
- Enable http extension (for calling edge functions)
- Create cron_logs table for monitoring
- Set up the scheduled job

### 2. Deploy the Edge Function

Deploy the daily-task edge function to Supabase:

```bash
npm run supabase:functions:deploy
```

### 3. Configure the Connection

In your Supabase dashboard:

1. Go to Settings → Database
2. Under "Database Settings", add these configurations:
   ```sql
   ALTER DATABASE postgres SET "app.settings.supabase_url" = 'https://YOUR_PROJECT_REF.supabase.co';
   ALTER DATABASE postgres SET "app.settings.service_role_key" = 'YOUR_SERVICE_ROLE_KEY';
   ```

### 4. Update the Cron Job

After deploying, update the pg_cron job with your actual edge function URL:

```sql
-- First, unschedule the existing job
SELECT cron.unschedule('daily-task-8am-amsterdam');

-- Then create it with the correct configuration
SELECT cron.schedule(
  'daily-task-8am-amsterdam',
  '0 6 * * *', -- 6:00 AM UTC = 8:00 AM CEST (summer) or 7:00 AM UTC = 8:00 AM CET (winter)
  $$SELECT public.trigger_daily_task()$$
);
```

## Time Zone Considerations

Amsterdam operates on:
- **CET (Winter)**: UTC+1 (roughly October to March)
- **CEST (Summer)**: UTC+2 (roughly March to October)

The cron job is set to 7:00 AM UTC which equals:
- 8:00 AM CET (winter)
- 9:00 AM CEST (summer)

To maintain exact 8:00 AM Amsterdam time year-round, you may need to:
1. Adjust the cron schedule twice a year, OR
2. Use a time zone aware scheduling solution

## Testing

### 1. Test the Edge Function Locally

```bash
npm run supabase:functions:serve
```

In another terminal:
```bash
npm run daily-task:test
```

### 2. Manually Trigger in Production

You can manually trigger the daily task from your application:

```javascript
const { data, error } = await supabase
  .rpc('manual_trigger_daily_task');
```

### 3. Check Execution Logs

```sql
-- View recent executions
SELECT * FROM cron_logs 
WHERE function_name = 'daily-task' 
ORDER BY execution_time DESC 
LIMIT 10;

-- Check if cron job is active
SELECT * FROM cron_job_status;
```

## Monitoring

### Database Queries for Monitoring

```sql
-- Check next scheduled run
SELECT 
  jobname,
  schedule,
  command,
  nextrun
FROM cron.job
WHERE jobname = 'daily-task-8am-amsterdam';

-- View execution statistics
SELECT 
  status,
  COUNT(*) as count,
  DATE(execution_time) as date
FROM cron_logs
WHERE function_name = 'daily-task'
GROUP BY status, DATE(execution_time)
ORDER BY date DESC;
```

### Edge Function Logs

View edge function logs in Supabase Dashboard:
1. Go to Functions
2. Click on "daily-task"
3. View "Logs" tab

## Customizing the Task

### Modify Task Logic

Edit `/supabase/functions/daily-task/index.ts` to implement your specific logic:

```typescript
// Example: Send daily report emails
const { data: users } = await supabase
  .from('users')
  .select('email')
  .eq('wants_daily_report', true);

// Process each user
for (const user of users || []) {
  // Send email logic here
}
```

### Add New Scheduled Tasks

1. Create new edge function:
   ```bash
   supabase functions new my-new-task
   ```

2. Add to pg_cron:
   ```sql
   SELECT cron.schedule(
     'my-new-task',
     '0 14 * * *', -- 2 PM daily
     'SELECT public.trigger_my_new_task()'
   );
   ```

## Troubleshooting

### Common Issues

1. **Function not executing**
   - Check if pg_cron is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
   - Verify job is scheduled: `SELECT * FROM cron.job;`
   - Check logs: `SELECT * FROM cron_logs ORDER BY execution_time DESC;`

2. **Authentication errors**
   - Ensure service role key is correct
   - Verify edge function URL is accessible
   - Check database configuration settings

3. **Time zone issues**
   - Remember DST changes affect execution time
   - Consider using UTC and converting in the function

### Debug Mode

Enable verbose logging in the edge function:

```typescript
const DEBUG = Deno.env.get('DEBUG') === 'true';
if (DEBUG) {
  console.log('Detailed execution info...');
}
```

## Security Considerations

1. **Never expose service role key** in client-side code
2. **Validate requests** in edge functions
3. **Use RLS policies** for data access
4. **Monitor execution logs** for anomalies
5. **Set up alerts** for failed executions

## Additional Resources

- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [PostgreSQL Cron Expression](https://crontab.guru/)
- [Time Zone Database](https://www.timeanddate.com/time/zones/)