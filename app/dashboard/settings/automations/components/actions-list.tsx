'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, MessageSquare, Mail, Webhook } from 'lucide-react';
import { AutomationAction } from '@/lib/automations/types';
import { updateAutomationAction, deleteAutomationAction } from '@/app/actions/automations';
import { toast } from 'sonner';
import { ActionEditor } from './action-editor';

interface ActionsListProps {
  actions: AutomationAction[];
  ruleId: string;
  onActionsChanged: () => void;
}

export function ActionsList({ actions, ruleId, onActionsChanged }: ActionsListProps) {
  const [editingAction, setEditingAction] = useState<AutomationAction | null>(null);
  const [creatingAction, setCreatingAction] = useState(false);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'slack_notification':
        return <MessageSquare className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'webhook':
        return <Webhook className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getActionDescription = (action: AutomationAction) => {
    switch (action.type) {
      case 'slack_notification':
        return action.configuration.channelId 
          ? `Send to channel: ${action.configuration.channelId}`
          : 'Slack notification (not configured)';
      case 'email':
        return action.configuration.to 
          ? `Send to: ${action.configuration.to}`
          : 'Email (not configured)';
      case 'webhook':
        return action.configuration.url 
          ? `Webhook: ${action.configuration.url}`
          : 'Webhook (not configured)';
      default:
        return 'Unknown action type';
    }
  };

  const handleToggleEnabled = async (action: AutomationAction) => {
    try {
      const result = await updateAutomationAction(action.id, {
        enabled: !action.enabled
      });
      if (result.success) {
        toast.success(`Action ${action.enabled ? 'disabled' : 'enabled'}`);
        onActionsChanged();
      } else {
        toast.error(result.error || 'Failed to update action');
      }
    } catch (error) {
      toast.error('Failed to update action');
    }
  };

  const handleDelete = async (action: AutomationAction) => {
    if (!confirm(`Are you sure you want to delete "${action.name}"?`)) {
      return;
    }

    try {
      const result = await deleteAutomationAction(action.id);
      if (result.success) {
        toast.success('Action deleted');
        onActionsChanged();
      } else {
        toast.error(result.error || 'Failed to delete action');
      }
    } catch (error) {
      toast.error('Failed to delete action');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">Actions</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCreatingAction(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Action
        </Button>
      </div>

      {actions.length === 0 ? (
        <div className="text-center py-6 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            No actions configured. Add an action to execute when conditions are met.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((action, index) => (
            <div
              key={action.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                !action.enabled ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">
                  {index + 1}.
                </div>
                {getActionIcon(action.type)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{action.name}</span>
                    {!action.enabled && (
                      <Badge variant="secondary" className="text-xs">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getActionDescription(action)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={action.enabled}
                  onCheckedChange={() => handleToggleEnabled(action)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditingAction(action)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(action)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(editingAction || creatingAction) && (
        <ActionEditor
          action={editingAction}
          ruleId={ruleId}
          onClose={() => {
            setEditingAction(null);
            setCreatingAction(false);
          }}
          onSave={() => {
            setEditingAction(null);
            setCreatingAction(false);
            onActionsChanged();
          }}
        />
      )}
    </div>
  );
}