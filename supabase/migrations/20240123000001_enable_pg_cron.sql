-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create a table to log cron executions (optional but recommended)
CREATE TABLE IF NOT EXISTS public.cron_logs (
  id BIGSERIAL PRIMARY KEY,
  function_name TEXT NOT NULL,
  execution_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'running')),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_cron_logs_execution_time ON public.cron_logs(execution_time DESC);
CREATE INDEX IF NOT EXISTS idx_cron_logs_function_name ON public.cron_logs(function_name);

-- Create a function to call the edge function
CREATE OR REPLACE FUNCTION public.trigger_daily_task()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  _response jsonb;
  _status_code int;
BEGIN
  -- Call the edge function using http extension
  -- Note: You'll need to replace YOUR_ANON_KEY with your actual Supabase anon key
  -- and YOUR_EDGE_FUNCTION_URL with the actual URL after deployment
  
  -- For now, we'll just log that the function was called
  -- In production, you would use the http extension to call your edge function
  
  INSERT INTO public.cron_logs (function_name, status, details)
  VALUES (
    'daily-task',
    'running',
    jsonb_build_object(
      'triggered_at', NOW(),
      'timezone', current_setting('TIMEZONE')
    )
  );
  
  -- In production, uncomment and configure this:
  /*
  SELECT 
    content::jsonb,
    status
  INTO 
    _response,
    _status_code
  FROM http_post(
    'https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-task',
    jsonb_build_object('task', 'scheduled', 'isManualTrigger', false)::text,
    'application/json',
    jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    )::text
  );
  
  UPDATE public.cron_logs
  SET 
    status = CASE WHEN _status_code = 200 THEN 'success' ELSE 'error' END,
    details = _response
  WHERE function_name = 'daily-task'
  ORDER BY created_at DESC
  LIMIT 1;
  */
  
  RAISE NOTICE 'Daily task triggered at %', NOW();
END;
$$;

-- Schedule the function to run every day at 8:00 AM Amsterdam time
-- Amsterdam is UTC+1 (CET) or UTC+2 (CEST during daylight saving)
-- We'll use UTC time and adjust for CET (you may need to adjust for daylight saving)
SELECT cron.schedule(
  'daily-task-8am-amsterdam',           -- job name
  '0 7 * * *',                         -- cron expression: 7:00 AM UTC = 8:00 AM CET
  'SELECT public.trigger_daily_task()' -- SQL command to run
);

-- Alternative with explicit timezone handling (if your Postgres supports it)
-- This accounts for daylight saving time automatically
/*
SELECT cron.schedule(
  'daily-task-8am-amsterdam',
  '0 8 * * *',
  'SELECT public.trigger_daily_task()',
  'Europe/Amsterdam'
);
*/

-- Create a helper function to manually trigger the daily task (useful for testing)
CREATE OR REPLACE FUNCTION public.manual_trigger_daily_task()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _result jsonb;
BEGIN
  -- Log the manual trigger
  INSERT INTO public.cron_logs (function_name, status, details)
  VALUES (
    'daily-task',
    'running',
    jsonb_build_object(
      'triggered_at', NOW(),
      'trigger_type', 'manual',
      'triggered_by', auth.uid()
    )
  );
  
  -- Call the trigger function
  PERFORM public.trigger_daily_task();
  
  _result := jsonb_build_object(
    'success', true,
    'message', 'Daily task triggered manually',
    'timestamp', NOW()
  );
  
  RETURN _result;
END;
$$;

-- Grant execute permission to authenticated users for manual trigger
GRANT EXECUTE ON FUNCTION public.manual_trigger_daily_task() TO authenticated;

-- Create a view to easily check cron job status
CREATE OR REPLACE VIEW public.cron_job_status AS
SELECT 
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'daily-task-8am-amsterdam';

-- Grant select permission on the view
GRANT SELECT ON public.cron_job_status TO authenticated;