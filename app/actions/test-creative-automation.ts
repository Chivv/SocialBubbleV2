'use server';

import { currentUser } from '@clerk/nextjs/server';
import { checkAndGenerateMonthlyAgendas, generateMonthlyCreativeAgenda } from './creative-agenda-automation';

// Manual trigger for testing the creative agenda automation
export async function testCreativeAutomation(clientId?: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Check if user is bas@bubbleads.nl (for testing)
    const email = user.emailAddresses?.[0]?.emailAddress;
    if (email !== 'bas@bubbleads.nl') {
      throw new Error('Unauthorized: Testing only available for admin');
    }

    if (clientId) {
      // Generate for specific client
      const result = await generateMonthlyCreativeAgenda(clientId);
      return {
        success: result.success,
        message: `Generated ${result.conceptCardsCreated} concept cards and ${result.briefingsCreated} briefings`,
        details: result
      };
    } else {
      // Run the full daily check
      const result = await checkAndGenerateMonthlyAgendas();
      return {
        success: true,
        message: `Processed ${result.clientsProcessed} clients, created ${result.totalConceptCards} concept cards and ${result.totalBriefings} briefings`,
        details: result
      };
    }
  } catch (error) {
    console.error('Error testing creative automation:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to test automation',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}