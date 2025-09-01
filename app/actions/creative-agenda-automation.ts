'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { 
  Department,
  CardType,
  VideoType,
  FormatType
} from '@/types';

interface ClientConfig {
  id: string;
  company_name: string;
  invoice_date: number;
  // Add any other client-specific configuration here
  briefings_count?: number;
  creatives_count?: number;
}

interface GenerationResult {
  success: boolean;
  conceptCardsCreated: number;
  briefingsCreated: number;
  errors: string[];
}

// Main function to generate monthly creative agenda items for a client
export async function generateMonthlyCreativeAgenda(clientId: string): Promise<GenerationResult> {
  const supabase = createServiceClient();
  const errors: string[] = [];
  let conceptCardsCreated = 0;
  let briefingsCreated = 0;

  try {
    // Get client details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      throw new Error(`Client not found: ${clientId}`);
    }

    // Calculate deadlines
    const now = new Date();
    const conceptDeadline = new Date(now);
    conceptDeadline.setDate(conceptDeadline.getDate() + 14); // 2 weeks from now
    
    const briefingDeadline = new Date(now);
    briefingDeadline.setDate(briefingDeadline.getDate() + 7); // 1 week from now

    // Determine how many items to create based on client configuration
    // Default to 4 concepts if not specified
    const numberOfConcepts = client.creatives_count || 4;
    // Default to 2 briefings if not specified
    const numberOfBriefings = client.briefings_count || 2;

    // Generate concept cards
    for (let i = 1; i <= numberOfConcepts; i++) {
      try {
        const { error: cardError } = await supabase
          .from('creative_agenda_cards')
          .insert({
            card_type: 'concept' as CardType,
            client_id: clientId,
            department: 'concepting' as Department,
            status: 'to_do',
            title: `${client.company_name} - Concept ${i} - ${getMonthName(now)}`,
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: `Monthly concept ${i} for ${client.company_name}`
                    }
                  ]
                }
              ]
            },
            deadline: conceptDeadline.toISOString(),
            created_by: 'system',
            in_waitlist: false
          });

        if (cardError) {
          errors.push(`Failed to create concept card ${i}: ${cardError.message}`);
        } else {
          conceptCardsCreated++;
        }
      } catch (error) {
        errors.push(`Error creating concept card ${i}: ${error}`);
      }
    }

    // Generate briefings
    for (let i = 1; i <= numberOfBriefings; i++) {
      try {
        // First create the briefing
        const { data: briefing, error: briefingError } = await supabase
          .from('briefings')
          .insert({
            title: `${client.company_name} - Briefing ${i} - ${getMonthName(now)}`,
            client_id: clientId,
            content: {
              type: 'doc',
              content: [
                {
                  type: 'heading',
                  attrs: { level: 1 },
                  content: [
                    {
                      type: 'text',
                      text: `${client.company_name} - Monthly Briefing ${i}`
                    }
                  ]
                },
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'This briefing has been automatically generated. Please update with specific requirements.'
                    }
                  ]
                }
              ]
            },
            created_by: 'system',
            status: 'draft',
            deadline: briefingDeadline.toISOString()
          })
          .select()
          .single();

        if (briefingError) {
          errors.push(`Failed to create briefing ${i}: ${briefingError.message}`);
        } else {
          briefingsCreated++;

          // Create corresponding card in creative agenda
          const { error: cardError } = await supabase
            .from('creative_agenda_cards')
            .insert({
              card_type: 'briefing' as CardType,
              client_id: clientId,
              department: 'concepting' as Department,
              status: 'to_do',
              title: `${client.company_name} - Briefing ${i} - ${getMonthName(now)}`,
              content: briefing.content,
              deadline: briefingDeadline.toISOString(),
              created_by: 'system',
              briefing_id: briefing.id,
              in_waitlist: false
            });

          if (cardError) {
            errors.push(`Failed to create briefing card ${i}: ${cardError.message}`);
          }
        }
      } catch (error) {
        errors.push(`Error creating briefing ${i}: ${error}`);
      }
    }

    // Log the generation
    await supabase
      .from('cron_logs')
      .insert({
        function_name: 'generate-monthly-creative-agenda',
        execution_time: new Date().toISOString(),
        status: 'success',
        details: {
          client_id: clientId,
          client_name: client.company_name,
          concept_cards_created: conceptCardsCreated,
          briefings_created: briefingsCreated,
          errors
        }
      });

    return {
      success: true,
      conceptCardsCreated,
      briefingsCreated,
      errors
    };
  } catch (error) {
    console.error('Error generating monthly creative agenda:', error);
    
    // Log the error
    await supabase
      .from('cron_logs')
      .insert({
        function_name: 'generate-monthly-creative-agenda',
        execution_time: new Date().toISOString(),
        status: 'error',
        details: {
          client_id: clientId,
          error: error instanceof Error ? error.message : 'Unknown error',
          errors
        }
      });

    return {
      success: false,
      conceptCardsCreated,
      briefingsCreated,
      errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

// Check and generate creative agenda for all clients on their invoice date
export async function checkAndGenerateMonthlyAgendas(): Promise<{
  clientsProcessed: number;
  totalConceptCards: number;
  totalBriefings: number;
  errors: string[];
}> {
  const supabase = createServiceClient();
  const today = new Date();
  const currentDay = today.getDate(); // Day of month (1-31)
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  let clientsProcessed = 0;
  let totalConceptCards = 0;
  let totalBriefings = 0;
  const errors: string[] = [];

  try {
    // Get all clients with invoice_date matching today
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('invoice_date', currentDay);

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    if (!clients || clients.length === 0) {
      console.log(`No clients with invoice date ${currentDay}`);
      return {
        clientsProcessed: 0,
        totalConceptCards: 0,
        totalBriefings: 0,
        errors: []
      };
    }

    // Process each client
    for (const client of clients) {
      // Check if we've already generated for this client this month
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const { data: existingCards } = await supabase
        .from('creative_agenda_cards')
        .select('id')
        .eq('client_id', client.id)
        .eq('created_by', 'system')
        .gte('created_at', startOfMonth.toISOString())
        .limit(1);

      if (existingCards && existingCards.length > 0) {
        console.log(`Already generated for client ${client.company_name} this month`);
        continue;
      }

      // Generate creative agenda for this client
      const result = await generateMonthlyCreativeAgenda(client.id);
      
      if (result.success) {
        clientsProcessed++;
        totalConceptCards += result.conceptCardsCreated;
        totalBriefings += result.briefingsCreated;
      }
      
      if (result.errors.length > 0) {
        errors.push(...result.errors);
      }
    }

    return {
      clientsProcessed,
      totalConceptCards,
      totalBriefings,
      errors
    };
  } catch (error) {
    console.error('Error checking and generating monthly agendas:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    
    return {
      clientsProcessed,
      totalConceptCards,
      totalBriefings,
      errors
    };
  }
}

// Helper function to get month name
function getMonthName(date: Date): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[date.getMonth()];
}