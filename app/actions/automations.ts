'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import { 
  AutomationRule, 
  AutomationAction, 
  AutomationLog,
  ConditionGroup,
  ActionConfiguration
} from '@/lib/automations/types';
import { triggerAutomation } from '@/lib/automations/service';
import { getAllTriggers } from '@/lib/automations/triggers';

// Check if user is authorized to manage automations
async function checkAuthorization(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  
  const email = user.emailAddresses?.[0]?.emailAddress;
  return email === 'bas@bubbleads.nl' || email === 'kaylie@bubbleads.nl';
}

// Get all automation triggers (hardcoded)
export async function getAutomationTriggers() {
  try {
    if (!await checkAuthorization()) {
      throw new Error('Unauthorized');
    }

    const triggers = getAllTriggers();
    return { success: true, triggers };
  } catch (error) {
    console.error('Error fetching automation triggers:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch triggers' 
    };
  }
}

// Get automation rules for a trigger
export async function getAutomationRules(triggerName: string) {
  try {
    if (!await checkAuthorization()) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('trigger_name', triggerName)
      .order('execution_order');

    if (error) throw error;

    return { success: true, rules };
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch rules' 
    };
  }
}

// Get automation actions for a rule
export async function getAutomationActions(ruleId: string) {
  try {
    if (!await checkAuthorization()) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    const { data: actions, error } = await supabase
      .from('automation_actions')
      .select('*')
      .eq('rule_id', ruleId)
      .order('execution_order');

    if (error) throw error;

    return { success: true, actions };
  } catch (error) {
    console.error('Error fetching automation actions:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch actions' 
    };
  }
}

// Create a new automation rule
export async function createAutomationRule(data: {
  trigger_name: string;
  name: string;
  description?: string;
  conditions?: ConditionGroup;
  execution_order?: number;
  enabled?: boolean;
}) {
  try {
    if (!await checkAuthorization()) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    const { data: rule, error } = await supabase
      .from('automation_rules')
      .insert({
        ...data,
        conditions: data.conditions || { all: [] }
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/settings/automations');
    return { success: true, rule };
  } catch (error) {
    console.error('Error creating automation rule:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create rule' 
    };
  }
}

// Update an automation rule
export async function updateAutomationRule(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    conditions: ConditionGroup;
    execution_order: number;
    enabled: boolean;
  }>
) {
  try {
    if (!await checkAuthorization()) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    const { data: rule, error } = await supabase
      .from('automation_rules')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/settings/automations');
    return { success: true, rule };
  } catch (error) {
    console.error('Error updating automation rule:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update rule' 
    };
  }
}

// Delete an automation rule
export async function deleteAutomationRule(id: string) {
  try {
    if (!await checkAuthorization()) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/settings/automations');
    return { success: true };
  } catch (error) {
    console.error('Error deleting automation rule:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete rule' 
    };
  }
}

// Create a new automation action
export async function createAutomationAction(data: {
  rule_id: string;
  name: string;
  type: 'slack_notification' | 'email' | 'webhook';
  configuration: ActionConfiguration;
  execution_order?: number;
  enabled?: boolean;
}) {
  try {
    if (!await checkAuthorization()) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    const { data: action, error } = await supabase
      .from('automation_actions')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/settings/automations');
    return { success: true, action };
  } catch (error) {
    console.error('Error creating automation action:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create action' 
    };
  }
}

// Update an automation action
export async function updateAutomationAction(
  id: string,
  data: Partial<{
    name: string;
    type: 'slack_notification' | 'email' | 'webhook';
    configuration: ActionConfiguration;
    execution_order: number;
    enabled: boolean;
  }>
) {
  try {
    if (!await checkAuthorization()) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    const { data: action, error } = await supabase
      .from('automation_actions')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/settings/automations');
    return { success: true, action };
  } catch (error) {
    console.error('Error updating automation action:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update action' 
    };
  }
}

// Delete an automation action
export async function deleteAutomationAction(id: string) {
  try {
    if (!await checkAuthorization()) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from('automation_actions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/settings/automations');
    return { success: true };
  } catch (error) {
    console.error('Error deleting automation action:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete action' 
    };
  }
}

// Get automation logs
export async function getAutomationLogs(options: {
  triggerName?: string;
  ruleId?: string;
  status?: string;
  limit?: number;
}) {
  try {
    if (!await checkAuthorization()) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    let query = supabase
      .from('automation_logs')
      .select('*')
      .order('executed_at', { ascending: false });

    if (options.triggerName) {
      query = query.eq('trigger_name', options.triggerName);
    }
    if (options.ruleId) {
      query = query.eq('rule_id', options.ruleId);
    }
    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data: logs, error } = await query;

    if (error) throw error;

    return { success: true, logs };
  } catch (error) {
    console.error('Error fetching automation logs:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch logs' 
    };
  }
}

// Test an automation with a real casting or creator
export async function testAutomation(
  triggerName: string,
  testDataId?: string
) {
  try {
    if (!await checkAuthorization()) {
      throw new Error('Unauthorized');
    }

    const user = await currentUser();
    const supabase = createServiceClient();
    
    // Handle creator_signed_up trigger differently
    if (triggerName === 'creator_signed_up') {
      // Get a sample creator or use test data
      let parameters: Record<string, any>;
      
      if (testDataId) {
        // If a creator ID is provided, use that creator's data
        const { data: creator, error: creatorError } = await supabase
          .from('creators')
          .select('*')
          .eq('id', testDataId)
          .single();
          
        if (creatorError || !creator) {
          throw new Error('Creator not found');
        }
        
        // Check if this creator was imported
        const { data: importedCreator } = await supabase
          .from('creator_import_list')
          .select('id')
          .eq('email', creator.email)
          .single();
          
        parameters = {
          creatorId: creator.id,
          creatorName: `${creator.first_name} ${creator.last_name}`.trim(),
          creatorEmail: creator.email,
          creatorPhone: creator.phone,
          primaryLanguage: creator.primary_language,
          hasProfilePicture: !!creator.profile_picture_url,
          hasIntroductionVideo: !!creator.introduction_video_url,
          signupSource: importedCreator ? 'import_invitation' : 'organic',
          signupDate: new Date().toISOString(),
          appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://platform.bubbleads.nl'
        };
      } else {
        // Use test data
        parameters = {
          creatorId: 'test-creator-id',
          creatorName: 'Test Creator',
          creatorEmail: 'test@example.com',
          creatorPhone: '+31612345678',
          primaryLanguage: 'en',
          hasProfilePicture: true,
          hasIntroductionVideo: false,
          signupSource: 'organic',
          signupDate: new Date().toISOString(),
          appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://platform.bubbleads.nl'
        };
      }
      
      // Trigger the automation in test mode
      await triggerAutomation(triggerName, parameters, {
        isTest: true,
        executedBy: user?.emailAddresses?.[0]?.emailAddress
      });

      return { success: true, parameters };
    }
    
    // For casting-related triggers, we need a casting ID
    if (!testDataId) {
      throw new Error('Casting ID is required for this trigger');
    }
    
    // Get casting data
    const { data: casting, error: castingError } = await supabase
      .from('castings')
      .select(`
        *,
        client:clients(company_name),
        casting_selections!inner(
          creator_id
        )
      `)
      .eq('id', testDataId)
      .single();

    if (castingError || !casting) {
      throw new Error('Casting not found');
    }

    // Get linked briefings
    const { data: linkedBriefings } = await supabase
      .from('casting_briefing_links')
      .select('briefing_id')
      .eq('casting_id', castingId);

    // Count chosen creators (client selections)
    const { data: selections } = await supabase
      .from('casting_selections')
      .select('id')
      .eq('casting_id', castingId)
      .eq('selected_by_role', 'client');

    const chosenCreatorsCount = selections?.length || 0;
    const briefingCount = linkedBriefings?.length || 0;
    const hasBriefing = briefingCount > 0;
    
    // TODO: Check if briefing is approved (when briefing approval is implemented)
    const briefingStatus = hasBriefing ? 'ready' : 'not_ready';

    // Prepare parameters based on trigger type
    let parameters: Record<string, any> = {};
    
    if (triggerName === 'casting_approved') {
      parameters = {
        castingId: casting.id,
        castingTitle: casting.title,
        clientName: casting.client?.company_name || 'Unknown Client',
        chosenCreatorsCount,
        briefingStatus,
        briefingCount,
        approvedBy: user?.emailAddresses?.[0]?.emailAddress || 'Test User',
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://platform.bubbleads.nl'
      };
    } else if (triggerName === 'casting_invitation_accepted') {
      // Get invitations for this casting
      const { data: invitations } = await supabase
        .from('casting_invitations')
        .select(`
          *,
          creator:creators(id, first_name, last_name, email)
        `)
        .eq('casting_id', castingId);

      const totalInvited = invitations?.length || 0;
      const totalAccepted = invitations?.filter(inv => inv.status === 'accepted').length || 0;
      
      // Use the first accepted invitation for test, or first invitation if none accepted
      const testInvitation = invitations?.find(inv => inv.status === 'accepted') || invitations?.[0];
      
      if (!testInvitation?.creator) {
        throw new Error('No invitations found for this casting');
      }

      parameters = {
        castingId: casting.id,
        castingTitle: casting.title,
        clientName: casting.client?.company_name || 'Unknown Client',
        creatorId: testInvitation.creator.id,
        creatorName: `${testInvitation.creator.first_name} ${testInvitation.creator.last_name || ''}`.trim(),
        creatorEmail: testInvitation.creator.email,
        totalInvited,
        totalAccepted,
        compensation: casting.compensation,
        briefingStatus,
        briefingCount,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://platform.bubbleads.nl'
      };
    } else if (triggerName === 'casting_status_changed') {
      // Get invitations and selections for statistics
      const { data: invitations } = await supabase
        .from('casting_invitations')
        .select('id, status')
        .eq('casting_id', castingId);

      const { data: selections } = await supabase
        .from('casting_selections')
        .select('id, selected_by_role')
        .eq('casting_id', castingId);

      const totalInvited = invitations?.length || 0;
      const totalAccepted = invitations?.filter(inv => inv.status === 'accepted').length || 0;
      const chosenCreatorsCount = selections?.filter(sel => sel.selected_by_role === 'client').length || 0;

      parameters = {
        castingId: casting.id,
        castingTitle: casting.title,
        clientName: casting.client?.company_name || 'Unknown Client',
        previousStatus: casting.status,
        newStatus: casting.status, // For test, we'll simulate keeping the same status
        chosenCreatorsCount,
        totalInvited,
        totalAccepted,
        compensation: casting.compensation,
        briefingStatus,
        briefingCount,
        changedBy: user?.emailAddresses?.[0]?.emailAddress || 'Test User',
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://platform.bubbleads.nl'
      };
    }

    // Trigger the automation in test mode
    await triggerAutomation(triggerName, parameters, {
      isTest: true,
      executedBy: user?.emailAddresses?.[0]?.emailAddress
    });

    return { success: true, parameters };
  } catch (error) {
    console.error('Error testing automation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to test automation' 
    };
  }
}

// Update rule order
export async function updateRuleOrder(
  triggerName: string,
  ruleOrders: { id: string; order: number }[]
) {
  try {
    if (!await checkAuthorization()) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    // Update each rule's execution order
    const updates = ruleOrders.map(({ id, order }) =>
      supabase
        .from('automation_rules')
        .update({ execution_order: order })
        .eq('id', id)
    );

    await Promise.all(updates);

    revalidatePath('/dashboard/settings/automations');
    return { success: true };
  } catch (error) {
    console.error('Error updating rule order:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update rule order' 
    };
  }
}