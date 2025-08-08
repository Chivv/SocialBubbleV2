// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  task?: string;
  isManualTrigger?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    
    // Verify the request is coming from pg_cron or has proper authorization
    // In production, you should verify this more securely
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body if any
    let body: RequestBody = {}
    try {
      const rawBody = await req.text()
      if (rawBody) {
        body = JSON.parse(rawBody)
      }
    } catch (e) {
      // No body or invalid JSON, continue with empty body
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Log the execution
    console.log(`Daily task started at ${new Date().toISOString()} (Amsterdam time: ${new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' })})`)
    console.log('Task:', body.task || 'default')
    console.log('Manual trigger:', body.isManualTrigger || false)

    // ============================================
    // YOUR DAILY TASK LOGIC GOES HERE
    // ============================================
    
    // Example: Update creator statistics
    const { data: creators, error: creatorsError } = await supabase
      .from('creators')
      .select('id, created_at')
    
    if (creatorsError) {
      throw new Error(`Failed to fetch creators: ${creatorsError.message}`)
    }

    // Example: Send daily reports
    // You can add logic here to:
    // - Generate reports
    // - Send emails
    // - Update statistics
    // - Clean up old data
    // - Sync with external services
    // - etc.

    // Log task completion
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      amsterdamTime: new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }),
      processedItems: creators?.length || 0,
      task: body.task || 'default',
      message: 'Daily task completed successfully'
    }

    // Optionally, store execution log in database
    const { error: logError } = await supabase
      .from('cron_logs')
      .insert({
        function_name: 'daily-task',
        execution_time: new Date().toISOString(),
        status: 'success',
        details: result
      })
    
    if (logError) {
      console.error('Failed to log execution:', logError)
      // Don't fail the function just because logging failed
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Daily task error:', error)
    
    // Try to log the error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      await supabase
        .from('cron_logs')
        .insert({
          function_name: 'daily-task',
          execution_time: new Date().toISOString(),
          status: 'error',
          details: { error: error.message }
        })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})