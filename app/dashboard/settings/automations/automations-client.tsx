'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, Activity, TestTube, ChevronRight } from 'lucide-react';
import { getAutomationTriggers, getAutomationRules, getAutomationLogs } from '@/app/actions/automations';
import { AutomationRule, AutomationLog } from '@/lib/automations/types';
import { TriggerDefinition } from '@/lib/automations/triggers';
import { RulesList } from './components/rules-list';
import { RuleEditor } from './components/rule-editor';
import { TestPanel } from './components/test-panel';
import { LogsViewer } from './components/logs-viewer';
import { toast } from 'sonner';

export function AutomationsClient() {
  const [triggers, setTriggers] = useState<TriggerDefinition[]>([]);
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerDefinition | null>(null);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [creatingRule, setCreatingRule] = useState(false);
  const [activeTab, setActiveTab] = useState('rules');

  useEffect(() => {
    loadTriggers();
  }, []);

  useEffect(() => {
    if (selectedTrigger) {
      loadRules(selectedTrigger.name);
      if (activeTab === 'logs') {
        loadLogs(selectedTrigger.name);
      }
    }
  }, [selectedTrigger, activeTab]);

  const loadTriggers = async () => {
    try {
      const result = await getAutomationTriggers();
      if (result.success && result.triggers) {
        setTriggers(result.triggers);
        if (result.triggers.length > 0) {
          setSelectedTrigger(result.triggers[0]);
        }
      } else {
        toast.error(result.error || 'Failed to load triggers');
      }
    } catch (error) {
      console.error('Error loading triggers:', error);
      toast.error('Failed to load automation triggers');
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async (triggerName: string) => {
    try {
      const result = await getAutomationRules(triggerName);
      if (result.success && result.rules) {
        setRules(result.rules);
      } else {
        toast.error(result.error || 'Failed to load rules');
      }
    } catch (error) {
      console.error('Error loading rules:', error);
      toast.error('Failed to load automation rules');
    }
  };

  const loadLogs = async (triggerName: string) => {
    try {
      const result = await getAutomationLogs({ triggerName, limit: 50 });
      if (result.success && result.logs) {
        setLogs(result.logs);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const handleRuleUpdated = () => {
    if (selectedTrigger) {
      loadRules(selectedTrigger.name);
    }
    setEditingRule(null);
    setCreatingRule(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Automations</h1>
        <p className="text-muted-foreground mt-1">
          Configure automated actions based on system events
        </p>
      </div>

      {/* Trigger Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available Triggers</CardTitle>
          <CardDescription>
            Select a trigger to configure its automation rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {triggers.map((trigger) => (
              <button
                key={trigger.name}
                onClick={() => setSelectedTrigger(trigger)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  selectedTrigger?.name === trigger.name
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium flex items-center justify-between">
                  {trigger.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  <ChevronRight className="h-4 w-4" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {trigger.description}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedTrigger && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="parameters" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Parameters
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Test
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Automation Rules</h2>
              <Button onClick={() => setCreatingRule(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>
            
            <RulesList
              rules={rules}
              trigger={selectedTrigger}
              onEdit={setEditingRule}
              onRulesChanged={() => loadRules(selectedTrigger.name)}
            />
          </TabsContent>

          <TabsContent value="parameters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Parameters</CardTitle>
                <CardDescription>
                  These parameters can be used in your automation templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedTrigger.parameters.map((param) => (
                    <div key={param.name} className="border-l-2 border-primary/20 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {`{{${param.name}}}`}
                        </code>
                        <Badge variant="outline">{param.type}</Badge>
                        {param.possibleValues && (
                          <div className="flex gap-1">
                            {param.possibleValues.map(value => (
                              <Badge key={value} variant="secondary" className="text-xs">
                                {value}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {param.description}
                      </p>
                    </div>
                  ))}
                </div>

                {selectedTrigger.exampleValues && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Example Values</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedTrigger.exampleValues, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <TestPanel trigger={selectedTrigger} />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <LogsViewer logs={logs} />
          </TabsContent>
        </Tabs>
      )}

      {/* Rule Editor Modal */}
      {(editingRule || creatingRule) && selectedTrigger && (
        <RuleEditor
          rule={editingRule}
          trigger={selectedTrigger}
          onClose={() => {
            setEditingRule(null);
            setCreatingRule(false);
          }}
          onSave={handleRuleUpdated}
        />
      )}
    </div>
  );
}