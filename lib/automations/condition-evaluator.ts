import { Condition, ConditionGroup, ConditionOperator } from './types';

export function evaluateConditions(
  conditions: ConditionGroup,
  parameters: Record<string, any>
): boolean {
  // If no conditions specified, always return true
  if (!conditions || ((!conditions.all || conditions.all.length === 0) && (!conditions.any || conditions.any.length === 0))) {
    return true;
  }

  // Evaluate AND conditions (all must be true)
  if (conditions.all && conditions.all.length > 0) {
    const allConditionsMet = conditions.all.every(condition => 
      evaluateCondition(condition, parameters)
    );
    if (!allConditionsMet) return false;
  }

  // Evaluate OR conditions (at least one must be true) - for future use
  if (conditions.any && conditions.any.length > 0) {
    const anyConditionMet = conditions.any.some(condition => 
      evaluateCondition(condition, parameters)
    );
    if (!anyConditionMet) return false;
  }

  return true;
}

function evaluateCondition(
  condition: Condition,
  parameters: Record<string, any>
): boolean {
  const fieldValue = parameters[condition.field];
  const compareValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return fieldValue === compareValue;
    
    case 'not_equals':
      return fieldValue !== compareValue;
    
    case 'greater_than':
      return Number(fieldValue) > Number(compareValue);
    
    case 'less_than':
      return Number(fieldValue) < Number(compareValue);
    
    case 'greater_than_or_equal':
      return Number(fieldValue) >= Number(compareValue);
    
    case 'less_than_or_equal':
      return Number(fieldValue) <= Number(compareValue);
    
    case 'contains':
      if (typeof fieldValue === 'string') {
        return fieldValue.includes(String(compareValue));
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(compareValue);
      }
      return false;
    
    case 'not_contains':
      if (typeof fieldValue === 'string') {
        return !fieldValue.includes(String(compareValue));
      }
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(compareValue);
      }
      return true;
    
    case 'is_empty':
      if (fieldValue === null || fieldValue === undefined) return true;
      if (typeof fieldValue === 'string') return fieldValue.length === 0;
      if (Array.isArray(fieldValue)) return fieldValue.length === 0;
      return false;
    
    case 'is_not_empty':
      if (fieldValue === null || fieldValue === undefined) return false;
      if (typeof fieldValue === 'string') return fieldValue.length > 0;
      if (Array.isArray(fieldValue)) return fieldValue.length > 0;
      return true;
    
    case 'in':
      if (!Array.isArray(compareValue)) return false;
      return compareValue.includes(fieldValue);
    
    case 'not_in':
      if (!Array.isArray(compareValue)) return true;
      return !compareValue.includes(fieldValue);
    
    default:
      console.warn(`Unknown operator: ${condition.operator}`);
      return false;
  }
}

export function getOperatorsForType(type: 'string' | 'number' | 'boolean'): ConditionOperator[] {
  switch (type) {
    case 'number':
      return [
        'equals',
        'not_equals',
        'greater_than',
        'less_than',
        'greater_than_or_equal',
        'less_than_or_equal',
        'is_empty',
        'is_not_empty'
      ];
    
    case 'string':
      return [
        'equals',
        'not_equals',
        'contains',
        'not_contains',
        'is_empty',
        'is_not_empty',
        'in',
        'not_in'
      ];
    
    case 'boolean':
      return [
        'equals',
        'not_equals'
      ];
    
    default:
      return ['equals', 'not_equals'];
  }
}