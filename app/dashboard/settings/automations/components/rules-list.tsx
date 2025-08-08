'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Edit, 
  Trash2, 
  GripVertical, 
  ChevronDown, 
  ChevronUp,
  Plus
} from 'lucide-react';
import { 
  AutomationRule, 
  AutomationAction 
} from '@/lib/automations/types';
import { TriggerDefinition } from '@/lib/automations/triggers';
import { 
  updateAutomationRule, 
  deleteAutomationRule,
  getAutomationActions,
  updateRuleOrder
} from '@/app/actions/automations';
import { toast } from 'sonner';
import { ActionsList } from './actions-list';

interface RulesListProps {
  rules: AutomationRule[];
  trigger: TriggerDefinition;
  onEdit: (rule: AutomationRule) => void;
  onRulesChanged: () => void;
}

export function RulesList({ rules, trigger, onEdit, onRulesChanged }: RulesListProps) {
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [ruleActions, setRuleActions] = useState<Record<string, AutomationAction[]>>({});
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [reordering, setReordering] = useState(false);

  const toggleExpanded = async (ruleId: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
      // Load actions if not already loaded
      if (!ruleActions[ruleId] && !loadingActions.has(ruleId)) {
        await loadActionsForRule(ruleId);
      }
    }
    setExpandedRules(newExpanded);
  };

  const loadActionsForRule = async (ruleId: string) => {
    setLoadingActions(prev => new Set(prev).add(ruleId));
    try {
      const result = await getAutomationActions(ruleId);
      if (result.success && result.actions) {
        setRuleActions(prev => ({ ...prev, [ruleId]: result.actions }));
      }
    } catch (error) {
      console.error('Error loading actions:', error);
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(ruleId);
        return newSet;
      });
    }
  };

  const handleToggleEnabled = async (rule: AutomationRule) => {
    try {
      const result = await updateAutomationRule(rule.id, {
        enabled: !rule.enabled
      });
      if (result.success) {
        toast.success(`Rule ${rule.enabled ? 'disabled' : 'enabled'}`);
        onRulesChanged();
      } else {
        toast.error(result.error || 'Failed to update rule');
      }
    } catch (error) {
      toast.error('Failed to update rule');
    }
  };

  const handleDelete = async (rule: AutomationRule) => {
    if (!confirm(`Are you sure you want to delete "${rule.name}"?`)) {
      return;
    }

    try {
      const result = await deleteAutomationRule(rule.id);
      if (result.success) {
        toast.success('Rule deleted');
        onRulesChanged();
      } else {
        toast.error(result.error || 'Failed to delete rule');
      }
    } catch (error) {
      toast.error('Failed to delete rule');
    }
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newRules = [...rules];
    const [movedRule] = newRules.splice(fromIndex, 1);
    newRules.splice(toIndex, 0, movedRule);
    
    // Update order values
    const updates = newRules.map((rule, index) => ({
      id: rule.id,
      order: index * 10
    }));
    
    setReordering(true);
    try {
      const result = await updateRuleOrder(trigger.name, updates);
      if (result.success) {
        onRulesChanged();
      } else {
        toast.error('Failed to reorder rules');
      }
    } catch (error) {
      toast.error('Failed to reorder rules');
    } finally {
      setReordering(false);
    }
  };

  const renderConditions = (rule: AutomationRule) => {
    const conditions = rule.conditions?.all || [];
    if (conditions.length === 0) {
      return <Badge variant="secondary">No conditions</Badge>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {conditions.map((condition, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {condition.field} {condition.operator.replace('_', ' ')} {String(condition.value)}
          </Badge>
        ))}
      </div>
    );
  };

  if (rules.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No automation rules configured for this trigger yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Click "Add Rule" to create your first automation rule.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {rules.map((rule, index) => (
        <Card key={rule.id} className={!rule.enabled ? 'opacity-60' : ''}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <button
                  className="mt-1 cursor-move opacity-50 hover:opacity-100 transition-opacity"
                  disabled={reordering}
                  onMouseDown={(e) => {
                    // TODO: Implement drag and drop
                  }}
                >
                  <GripVertical className="h-5 w-5" />
                </button>
                
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {rule.name}
                    {!rule.enabled && <Badge variant="secondary">Disabled</Badge>}
                  </CardTitle>
                  {rule.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {rule.description}
                    </p>
                  )}
                  <div className="mt-2">
                    {renderConditions(rule)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={() => handleToggleEnabled(rule)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleExpanded(rule.id)}
                >
                  {expandedRules.has(rule.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(rule)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(rule)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {expandedRules.has(rule.id) && (
            <CardContent>
              {loadingActions.has(rule.id) ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <ActionsList
                  actions={ruleActions[rule.id] || []}
                  ruleId={rule.id}
                  onActionsChanged={() => loadActionsForRule(rule.id)}
                />
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}