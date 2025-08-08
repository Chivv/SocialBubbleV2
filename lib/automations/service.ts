import { createServiceClient } from '@/lib/supabase/service';
import { 
  AutomationRule, 
  AutomationAction, 
  TriggerExecutionContext,
  AutomationLog 
} from './types';
import { evaluateConditions } from './condition-evaluator';
import { executeSlackNotification } from './executors/slack';

/**
 * Main entry point for triggering automations
 */
export async function triggerAutomation(
  triggerName: string,
  parameters: Record<string, any>,
  options: {
    isTest?: boolean;
    executedBy?: string;
  } = {}
): Promise<void> {
  const supabase = createServiceClient();
  const context: TriggerExecutionContext = {
    triggerName,
    parameters: {
      ...parameters,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://platform.bubbleads.nl'
    },
    isTest: options.isTest || false,
    executedBy: options.executedBy
  };

  try {
    // Get all enabled rules for this trigger, ordered by execution_order
    const { data: rules, error: rulesError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('trigger_name', triggerName)
      .eq('enabled', true)
      .order('execution_order', { ascending: true });

    if (rulesError) {
      console.error('Error fetching automation rules:', rulesError);
      await logExecution(context, null, null, 'failed', rulesError.message);
      return;
    }

    if (!rules || rules.length === 0) {
      console.log(`No enabled automation rules found for trigger: ${triggerName}`);
      return;
    }

    // Process each rule
    for (const rule of rules) {
      await processRule(rule, context);
    }
  } catch (error) {
    console.error('Error in triggerAutomation:', error);
    await logExecution(
      context,
      null,
      null,
      'failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Process a single automation rule
 */
async function processRule(
  rule: AutomationRule,
  context: TriggerExecutionContext
): Promise<void> {
  const supabase = createServiceClient();

  try {
    // Evaluate conditions
    const conditionsMet = evaluateConditions(rule.conditions, context.parameters);
    
    if (!conditionsMet) {
      console.log(`Conditions not met for rule: ${rule.name}`);
      await logExecution(context, rule.id, null, 'skipped', 'Conditions not met');
      return;
    }

    // Get all enabled actions for this rule, ordered by execution_order
    const { data: actions, error: actionsError } = await supabase
      .from('automation_actions')
      .select('*')
      .eq('rule_id', rule.id)
      .eq('enabled', true)
      .order('execution_order', { ascending: true });

    if (actionsError) {
      console.error('Error fetching automation actions:', actionsError);
      await logExecution(context, rule.id, null, 'failed', actionsError.message);
      return;
    }

    if (!actions || actions.length === 0) {
      console.log(`No enabled actions found for rule: ${rule.name}`);
      return;
    }

    // Execute each action
    for (const action of actions) {
      await executeAction(action, context, rule.id);
    }
  } catch (error) {
    console.error('Error processing rule:', error);
    await logExecution(
      context,
      rule.id,
      null,
      'failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Execute a single automation action
 */
async function executeAction(
  action: AutomationAction,
  context: TriggerExecutionContext,
  ruleId: string
): Promise<void> {
  try {
    let result: { success: boolean; error?: string };

    switch (action.type) {
      case 'slack_notification':
        result = await executeSlackNotification(action.configuration, context);
        break;
      
      case 'email':
        // TODO: Implement email executor
        result = { success: false, error: 'Email automation not yet implemented' };
        break;
      
      case 'webhook':
        // TODO: Implement webhook executor
        result = { success: false, error: 'Webhook automation not yet implemented' };
        break;
      
      default:
        result = { success: false, error: `Unknown action type: ${action.type}` };
    }

    const status = context.isTest ? 'test' : (result.success ? 'success' : 'failed');
    await logExecution(context, ruleId, action.id, status, result.error);

    if (!result.success) {
      console.error(`Action failed: ${action.name}`, result.error);
    } else {
      console.log(`Action executed successfully: ${action.name}`);
    }
  } catch (error) {
    console.error('Error executing action:', error);
    await logExecution(
      context,
      ruleId,
      action.id,
      'failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Log automation execution
 */
async function logExecution(
  context: TriggerExecutionContext,
  ruleId: string | null,
  actionId: string | null,
  status: 'success' | 'failed' | 'test' | 'skipped',
  errorMessage?: string
): Promise<void> {
  const supabase = createServiceClient();
  
  try {
    await supabase.from('automation_logs').insert({
      trigger_name: context.triggerName,
      rule_id: ruleId,
      action_id: actionId,
      parameters: context.parameters,
      status,
      error_message: errorMessage,
      executed_by: context.executedBy
    });
  } catch (error) {
    console.error('Failed to log automation execution:', error);
  }
}