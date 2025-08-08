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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AutomationAction,
  ActionConfiguration 
} from '@/lib/automations/types';
import { createAutomationAction, updateAutomationAction } from '@/app/actions/automations';
import { toast } from 'sonner';

interface ActionEditorProps {
  action: AutomationAction | null;
  ruleId: string;
  onClose: () => void;
  onSave: () => void;
}

export function ActionEditor({ action, ruleId, onClose, onSave }: ActionEditorProps) {
  const [name, setName] = useState(action?.name || '');
  const [type, setType] = useState<'slack_notification' | 'email' | 'webhook'>(
    action?.type || 'slack_notification'
  );
  const [configuration, setConfiguration] = useState<ActionConfiguration & { blocksTemplateString?: string }>(
    action?.configuration 
      ? {
          ...action.configuration,
          blocksTemplateString: action.configuration.blocksTemplate 
            ? JSON.stringify(action.configuration.blocksTemplate, null, 2)
            : ''
        }
      : {}
  );
  const [enabled, setEnabled] = useState(action?.enabled ?? true);
  const [messageMode, setMessageMode] = useState<'text' | 'blocks'>(
    configuration.useBlocks ? 'blocks' : 'text'
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Action name is required');
      return;
    }

    // Validate configuration based on type
    if (type === 'slack_notification') {
      if (!configuration.channelId) {
        toast.error('Channel ID is required for Slack notifications');
        return;
      }
      if (messageMode === 'text' && !configuration.messageTemplate) {
        toast.error('Message template is required');
        return;
      }
      if (messageMode === 'blocks' && !configuration.blocksTemplateString) {
        toast.error('Blocks template is required');
        return;
      }
    }

    setSaving(true);
    try {
      let finalConfig: ActionConfiguration = {
        channelId: configuration.channelId,
        messageTemplate: configuration.messageTemplate,
        useBlocks: messageMode === 'blocks'
      };

      // Parse blocks template if in blocks mode
      if (messageMode === 'blocks' && configuration.blocksTemplateString) {
        try {
          const blocks = JSON.parse(configuration.blocksTemplateString);
          finalConfig.blocksTemplate = blocks;
        } catch (e) {
          toast.error('Invalid JSON in blocks template');
          setSaving(false);
          return;
        }
      }

      const data = {
        rule_id: ruleId,
        name: name.trim(),
        type,
        configuration: finalConfig,
        enabled,
      };

      const result = action
        ? await updateAutomationAction(action.id, data)
        : await createAutomationAction(data);

      if (result.success) {
        toast.success(action ? 'Action updated' : 'Action created');
        onSave();
      } else {
        toast.error(result.error || 'Failed to save action');
      }
    } catch (error) {
      toast.error('Failed to save action');
    } finally {
      setSaving(false);
    }
  };

  const handleBlocksTemplateChange = (value: string) => {
    // Store the raw string for editing
    setConfiguration({ ...configuration, blocksTemplateString: value });
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="sm:max-w-xl flex flex-col h-full p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{action ? 'Edit Action' : 'Create Action'}</SheetTitle>
          <SheetDescription>
            Configure automation action to execute when conditions are met
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
          <div>
            <Label htmlFor="name">Action Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Send to operations channel"
            />
          </div>

          {/* For now, only Slack is implemented */}
          {type === 'slack_notification' && (
            <>
              <div>
                <Label htmlFor="channelId">Slack Channel ID</Label>
                <Input
                  id="channelId"
                  value={configuration.channelId || ''}
                  onChange={(e) => setConfiguration({ ...configuration, channelId: e.target.value })}
                  placeholder="e.g., C01234567"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the Slack channel ID where messages will be sent
                </p>
              </div>

              <div>
                <Label>Message Format</Label>
                <Tabs value={messageMode} onValueChange={(v) => {
                  setMessageMode(v as 'text' | 'blocks');
                  // Clear the blocksTemplateString if switching to text mode
                  if (v === 'text') {
                    setConfiguration({ ...configuration, blocksTemplateString: undefined });
                  }
                }}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text">Plain Text</TabsTrigger>
                    <TabsTrigger value="blocks">Slack Blocks</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="text" className="space-y-2">
                    <Textarea
                      value={configuration.messageTemplate || ''}
                      onChange={(e) => setConfiguration({ ...configuration, messageTemplate: e.target.value })}
                      placeholder="Enter message template. Use {{parameterName}} for dynamic values."
                      rows={5}
                    />
                    <div className="text-xs text-muted-foreground">
                      <p>Available parameters:</p>
                      <code className="block mt-1 p-2 bg-muted rounded">
                        {`{{castingId}}, {{castingTitle}}, {{clientName}}, {{chosenCreatorsCount}}, {{briefingStatus}}, {{briefingCount}}, {{approvedBy}}, {{appUrl}}`}
                      </code>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="blocks" className="space-y-2">
                    <Textarea
                      value={configuration.blocksTemplateString || ''}
                      onChange={(e) => handleBlocksTemplateChange(e.target.value)}
                      placeholder='Enter Slack blocks JSON array. Example:
[
  {
    "type": "header",
    "text": {
      "type": "plain_text",
      "text": "🚀 {{castingTitle}}",
      "emoji": true
    }
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "*{{castingTitle}}* approved by *{{approvedBy}}*"
    }
  }
]'
                      rows={10}
                      className="font-mono text-xs"
                    />
                    <div className="text-xs text-muted-foreground">
                      <p>Enter a JSON array of Slack blocks (not wrapped in an object). Parameters in text fields will be replaced.</p>
                      <a 
                        href="https://app.slack.com/block-kit-builder" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Use Slack Block Kit Builder →
                      </a>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enable Action</Label>
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
              {saving ? 'Saving...' : 'Save Action'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}