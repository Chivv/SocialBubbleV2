'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, X } from 'lucide-react';
import { 
  AutomationRule, 
  Condition,
  ConditionGroup 
} from '@/lib/automations/types';
import { TriggerDefinition } from '@/lib/automations/triggers';
import { createAutomationRule, updateAutomationRule } from '@/app/actions/automations';
import { toast } from 'sonner';
import { ConditionBuilder } from './condition-builder';

interface RuleEditorProps {
  rule: AutomationRule | null;
  trigger: TriggerDefinition;
  onClose: () => void;
  onSave: () => void;
}

export function RuleEditor({ rule, trigger, onClose, onSave }: RuleEditorProps) {
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [conditions, setConditions] = useState<ConditionGroup>(
    rule?.conditions || { all: [] }
  );
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Rule name is required');
      return;
    }

    setSaving(true);
    try {
      const data = {
        trigger_name: trigger.name,
        name: name.trim(),
        description: description.trim() || undefined,
        conditions,
        enabled,
      };

      const result = rule
        ? await updateAutomationRule(rule.id, data)
        : await createAutomationRule(data);

      if (result.success) {
        toast.success(rule ? 'Rule updated' : 'Rule created');
        onSave();
      } else {
        toast.error(result.error || 'Failed to save rule');
      }
    } catch (error) {
      toast.error('Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const addCondition = () => {
    const newCondition: Condition = {
      field: trigger.parameters[0]?.name || '',
      operator: 'equals',
      value: ''
    };
    
    setConditions({
      ...conditions,
      all: [...(conditions.all || []), newCondition]
    });
  };

  const updateCondition = (index: number, condition: Condition) => {
    const newConditions = [...(conditions.all || [])];
    newConditions[index] = condition;
    setConditions({ ...conditions, all: newConditions });
  };

  const removeCondition = (index: number) => {
    const newConditions = [...(conditions.all || [])];
    newConditions.splice(index, 1);
    setConditions({ ...conditions, all: newConditions });
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="sm:max-w-2xl flex flex-col h-full p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{rule ? 'Edit Rule' : 'Create Rule'}</SheetTitle>
          <SheetDescription>
            Configure automation rule for {trigger.name.replace('_', ' ')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
          <div>
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Notify team when casting approved"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this rule does..."
              rows={2}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Conditions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCondition}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Condition
              </Button>
            </div>
            
            {(!conditions.all || conditions.all.length === 0) ? (
              <div className="text-center py-6 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  No conditions configured. This rule will always execute.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Rule will execute when ALL of these conditions are met:
                </p>
                {conditions.all.map((condition, index) => (
                  <div key={index} className="flex items-end gap-2">
                    <div className="flex-1">
                      <ConditionBuilder
                        condition={condition}
                        parameters={trigger.parameters}
                        onChange={(c) => updateCondition(index, c)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCondition(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enable Rule</Label>
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t">
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Rule'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}