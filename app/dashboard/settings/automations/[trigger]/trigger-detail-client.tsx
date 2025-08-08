'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Plus, 
  Settings, 
  Activity, 
  TestTube, 
  Info,
  Zap
} from 'lucide-react';
import { getAutomationRules, getAutomationLogs } from '@/app/actions/automations';
import { AutomationRule, AutomationLog } from '@/lib/automations/types';
import { getTriggerDefinition } from '@/lib/automations/triggers';
import { RulesList } from '../components/rules-list';
import { RuleEditor } from '../components/rule-editor';
import { TestPanel } from '../components/test-panel';
import { LogsViewer } from '../components/logs-viewer';
import { toast } from 'sonner';

interface TriggerDetailClientProps {
  triggerName: string;
}

export function TriggerDetailClient({ triggerName }: TriggerDetailClientProps) {
  const router = useRouter();
  const trigger = getTriggerDefinition(triggerName);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [creatingRule, setCreatingRule] = useState(false);
  const [activeTab, setActiveTab] = useState('rules');

  useEffect(() => {
    if (trigger) {
      loadRules();
    }
  }, [trigger]);

  useEffect(() => {
    if (trigger && activeTab === 'logs') {
      loadLogs();
    }
  }, [trigger, activeTab]);

  const loadRules = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
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
    loadRules();
    setEditingRule(null);
    setCreatingRule(false);
  };

  if (!trigger) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Trigger not found</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeRulesCount = rules.filter(r => r.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push('/dashboard/settings/automations')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">
                {trigger.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h1>
            </div>
            <p className="text-muted-foreground mt-1">
              {trigger.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={activeRulesCount > 0 ? "default" : "secondary"}>
            {activeRulesCount} active rule{activeRulesCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="parameters" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
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
            <div>
              <h2 className="text-xl font-semibold">Automation Rules</h2>
              <p className="text-sm text-muted-foreground">
                Configure rules with conditions and actions for this trigger
              </p>
            </div>
            <Button onClick={() => setCreatingRule(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
          
          <RulesList
            rules={rules}
            trigger={trigger}
            onEdit={setEditingRule}
            onRulesChanged={loadRules}
          />
        </TabsContent>

        <TabsContent value="parameters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Parameters</CardTitle>
              <CardDescription>
                These parameters can be used in your automation templates with {`{{parameterName}}`} syntax
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trigger.parameters.map((param) => (
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

              {trigger.exampleValues && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Example Values</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(trigger.exampleValues, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Test Automation</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select real data to test your automation rules
            </p>
          </div>
          <TestPanel trigger={trigger} />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Execution Logs</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Recent automation executions for this trigger
            </p>
          </div>
          <LogsViewer logs={logs} />
        </TabsContent>
      </Tabs>

      {/* Rule Editor Modal */}
      {(editingRule || creatingRule) && (
        <RuleEditor
          rule={editingRule}
          trigger={trigger}
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