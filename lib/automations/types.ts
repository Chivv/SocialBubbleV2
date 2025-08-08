export interface TriggerParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  possibleValues?: string[];
}

export interface AutomationRule {
  id: string;
  trigger_name: string;
  name: string;
  description?: string;
  conditions: ConditionGroup;
  execution_order: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationAction {
  id: string;
  rule_id: string;
  name: string;
  type: 'slack_notification' | 'email' | 'webhook';
  configuration: ActionConfiguration;
  execution_order: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConditionGroup {
  all?: Condition[];  // AND conditions
  any?: Condition[];  // OR conditions (future enhancement)
}

export interface Condition {
  field: string;
  operator: ConditionOperator;
  value: any;
}

export type ConditionOperator = 
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'contains'
  | 'not_contains'
  | 'is_empty'
  | 'is_not_empty'
  | 'in'
  | 'not_in';

export interface ActionConfiguration {
  // Slack notification config
  channelId?: string;
  messageTemplate?: string;
  useBlocks?: boolean;
  blocksTemplate?: any;
  
  // Future: Email config
  to?: string;
  subject?: string;
  body?: string;
  
  // Future: Webhook config
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  bodyTemplate?: string;
}

export interface AutomationLog {
  id: string;
  trigger_name: string;
  rule_id?: string;
  action_id?: string;
  parameters: Record<string, any>;
  status: 'success' | 'failed' | 'test' | 'skipped';
  error_message?: string;
  executed_at: string;
  executed_by?: string;
}

export interface TriggerExecutionContext {
  triggerName: string;
  parameters: Record<string, any>;
  isTest?: boolean;
  testPrefix?: string;
  executedBy?: string;
}