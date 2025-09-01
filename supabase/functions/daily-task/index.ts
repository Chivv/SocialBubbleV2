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
    // DAILY TASK LOGIC
    // ============================================
    
    // 1. Check and generate monthly creative agendas for clients
    const today = new Date()
    const currentDay = today.getDate() // Day of month (1-31)
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    console.log(`Checking for clients with invoice date: ${currentDay}`)
    
    // Get all clients with invoice_date matching today
    const { data: clientsToProcess, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('invoice_date', currentDay)
    
    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`)
    }
    
    let clientsProcessed = 0
    let totalConceptCards = 0
    let totalBriefings = 0
    const processingErrors = []
    
    if (clientsToProcess && clientsToProcess.length > 0) {
      console.log(`Found ${clientsToProcess.length} clients to process`)
      
      for (const client of clientsToProcess) {
        try {
          // Check if we've already generated for this client this month
          const startOfMonth = new Date(currentYear, currentMonth, 1)
          const { data: existingCards } = await supabase
            .from('creative_agenda_cards')
            .select('id')
            .eq('client_id', client.id)
            .eq('created_by', 'system')
            .gte('created_at', startOfMonth.toISOString())
            .limit(1)
          
          if (existingCards && existingCards.length > 0) {
            console.log(`Already generated for client ${client.company_name} this month`)
            continue
          }
          
          // Calculate deadlines
          const conceptDeadline = new Date(today)
          conceptDeadline.setDate(conceptDeadline.getDate() + 14) // 2 weeks from now
          
          const briefingDeadline = new Date(today)
          briefingDeadline.setDate(briefingDeadline.getDate() + 7) // 1 week from now
          
          // Determine how many items to create
          const numberOfConcepts = client.creatives_count || 4
          const numberOfBriefings = client.briefings_count || 2
          
          // Generate concept cards
          for (let i = 1; i <= numberOfConcepts; i++) {
            const { error: cardError } = await supabase
              .from('creative_agenda_cards')
              .insert({
                card_type: 'concept',
                client_id: client.id,
                department: 'concepting',
                status: 'to_do',
                title: `${client.company_name} - Concept ${i} - ${getMonthName(today)}`,
                content: {
                  type: 'doc',
                  content: [{
                    type: 'paragraph',
                    content: [{
                      type: 'text',
                      text: `Monthly concept ${i} for ${client.company_name}`
                    }]
                  }]
                },
                deadline: conceptDeadline.toISOString(),
                created_by: 'system',
                in_waitlist: false
              })
            
            if (!cardError) {
              totalConceptCards++
            } else {
              processingErrors.push(`Concept card ${i} for ${client.company_name}: ${cardError.message}`)
            }
          }
          
          // Generate briefings
          for (let i = 1; i <= numberOfBriefings; i++) {
            // Create the briefing
            const { data: briefing, error: briefingError } = await supabase
              .from('briefings')
              .insert({
                title: `${client.company_name} - Briefing ${i} - ${getMonthName(today)}`,
                client_id: client.id,
                content: {
                  type: 'doc',
                  content: [{
                    type: 'heading',
                    attrs: { level: 1 },
                    content: [{
                      type: 'text',
                      text: `${client.company_name} - Monthly Briefing ${i}`
                    }]
                  }, {
                    type: 'paragraph',
                    content: [{
                      type: 'text',
                      text: 'This briefing has been automatically generated. Please update with specific requirements.'
                    }]
                  }]
                },
                created_by: 'system',
                status: 'draft',
                deadline: briefingDeadline.toISOString()
              })
              .select()
              .single()
            
            if (!briefingError && briefing) {
              totalBriefings++
              
              // Create corresponding card in creative agenda
              await supabase
                .from('creative_agenda_cards')
                .insert({
                  card_type: 'briefing',
                  client_id: client.id,
                  department: 'concepting',
                  status: 'to_do',
                  title: `${client.company_name} - Briefing ${i} - ${getMonthName(today)}`,
                  content: briefing.content,
                  deadline: briefingDeadline.toISOString(),
                  created_by: 'system',
                  briefing_id: briefing.id,
                  in_waitlist: false
                })
            } else if (briefingError) {
              processingErrors.push(`Briefing ${i} for ${client.company_name}: ${briefingError.message}`)
            }
          }
          
          clientsProcessed++
          console.log(`Processed client ${client.company_name}: ${numberOfConcepts} concepts, ${numberOfBriefings} briefings`)
          
        } catch (error) {
          processingErrors.push(`Error processing ${client.company_name}: ${error.message}`)
        }
      }
    } else {
      console.log(`No clients with invoice date ${currentDay}`)
    }
    
    // Helper function to get month name
    function getMonthName(date: Date): string {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]
      return months[date.getMonth()]
    }

    // Log task completion
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      amsterdamTime: new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }),
      task: body.task || 'default',
      message: 'Daily task completed successfully',
      creativeAgenda: {
        clientsProcessed,
        totalConceptCards,
        totalBriefings,
        errors: processingErrors
      }
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