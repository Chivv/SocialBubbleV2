-- Enable HTTP extension for making HTTP requests from PostgreSQL
-- This is needed to call Supabase Edge Functions from pg_cron
CREATE EXTENSION IF NOT EXISTS http;

-- Create a more complete function that actually calls the edge function
CREATE OR REPLACE FUNCTION public.call_daily_task_edge_function()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _supabase_url text;
  _service_role_key text;
  _response jsonb;
  _status_code int;
  _headers jsonb;
BEGIN
  -- Get Supabase URL and service role key from vault
  -- These should be set up in your Supabase project settings
  _supabase_url := current_setting('app.settings.supabase_url', true);
  _service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- If settings are not available, you'll need to hardcode them (not recommended for production)
  IF _supabase_url IS NULL THEN
    -- Replace with your actual Supabase project URL
    RAISE EXCEPTION 'Supabase URL not configured. Set app.settings.supabase_url';
  END IF;
  
  IF _service_role_key IS NULL THEN
    -- Replace with your actual service role key
    RAISE EXCEPTION 'Service role key not configured. Set app.settings.service_role_key';
  END IF;
  
  -- Prepare headers
  _headers := jsonb_build_object(
    'Authorization', 'Bearer ' || _service_role_key,
    'Content-Type', 'application/json'
  );
  
  -- Make the HTTP request to the edge function
  SELECT 
    content::jsonb,
    status
  INTO 
    _response,
    _status_code
  FROM http((
    'POST',
    _supabase_url || '/functions/v1/daily-task',
    ARRAY[
      http_header('Authorization', 'Bearer ' || _service_role_key),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    jsonb_build_object(
      'task', 'scheduled',
      'isManualTrigger', false,
      'timestamp', NOW()
    )::text
  )::http_request);
  
  -- Log the result
  INSERT INTO public.cron_logs (function_name, status, details)
  VALUES (
    'daily-task',
    CASE WHEN _status_code = 200 THEN 'success' ELSE 'error' END,
    jsonb_build_object(
      'status_code', _status_code,
      'response', _response,
      'timestamp', NOW()
    )
  );
  
  IF _status_code != 200 THEN
    RAISE EXCEPTION 'Edge function returned error: %', _response;
  END IF;
  
  RETURN _response;
END;
$$;

-- Update the trigger function to use the new edge function caller
CREATE OR REPLACE FUNCTION public.trigger_daily_task()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  _result jsonb;
BEGIN
  -- Log the start of execution
  INSERT INTO public.cron_logs (function_name, status, details)
  VALUES (
    'daily-task',
    'running',
    jsonb_build_object(
      'triggered_at', NOW(),
      'timezone', current_setting('TIMEZONE'),
      'trigger_type', 'scheduled'
    )
  );
  
  BEGIN
    -- Try to call the edge function
    _result := public.call_daily_task_edge_function();
    
    -- Update the log with success
    UPDATE public.cron_logs
    SET 
      status = 'success',
      details = details || jsonb_build_object('result', _result, 'completed_at', NOW())
    WHERE function_name = 'daily-task'
      AND status = 'running'
    ORDER BY created_at DESC
    LIMIT 1;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error
    UPDATE public.cron_logs
    SET 
      status = 'error',
      details = details || jsonb_build_object(
        'error', SQLERRM,
        'error_detail', SQLSTATE,
        'failed_at', NOW()
      )
    WHERE function_name = 'daily-task'
      AND status = 'running'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Re-raise the exception
    RAISE;
  END;
END;
$$;