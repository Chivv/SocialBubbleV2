'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  ChevronRight, 
  Settings, 
  BarChart3,
  PlayCircle,
  Clock
} from 'lucide-react';
import { getAutomationRules, getAutomationLogs } from '@/app/actions/automations';
import { getAllTriggers } from '@/lib/automations/triggers';
import { AutomationRule, AutomationLog } from '@/lib/automations/types';
import { formatDistanceToNow } from 'date-fns';

interface TriggerStats {
  totalRules: number;
  activeRules: number;
  recentExecutions: number;
  lastExecution?: string;
}

export function AutomationsOverview() {
  const router = useRouter();
  const triggers = getAllTriggers();
  const [triggerStats, setTriggerStats] = useState<Record<string, TriggerStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stats: Record<string, TriggerStats> = {};

      for (const trigger of triggers) {
        // Load rules for this trigger
        const rulesResult = await getAutomationRules(trigger.name);
        const rules = rulesResult.success ? rulesResult.rules || [] : [];
        
        // Load recent logs for this trigger
        const logsResult = await getAutomationLogs({ 
          triggerName: trigger.name, 
          limit: 10 
        });
        const logs = logsResult.success ? logsResult.logs || [] : [];
        
        // Calculate stats
        stats[trigger.name] = {
          totalRules: rules.length,
          activeRules: rules.filter(r => r.enabled).length,
          recentExecutions: logs.filter(l => l.status !== 'skipped').length,
          lastExecution: logs[0]?.executed_at
        };
      }

      setTriggerStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerClick = (triggerName: string) => {
    router.push(`/dashboard/settings/automations/${triggerName}`);
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

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Triggers</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{triggers.length}</div>
            <p className="text-xs text-muted-foreground">
              Available automation triggers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(triggerStats).reduce((sum, stats) => sum + stats.activeRules, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all triggers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Executions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(triggerStats).reduce((sum, stats) => sum + stats.recentExecutions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              In the last 10 logs per trigger
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Triggers Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Available Triggers</CardTitle>
          <CardDescription>
            Click on a trigger to configure its rules and actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {triggers.map((trigger) => {
              const stats = triggerStats[trigger.name] || {
                totalRules: 0,
                activeRules: 0,
                recentExecutions: 0
              };
              
              return (
                <Card 
                  key={trigger.name}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTriggerClick(trigger.name)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Zap className="h-5 w-5 text-primary" />
                          {trigger.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {trigger.description}
                        </CardDescription>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Settings className="h-3 w-3 text-muted-foreground" />
                          <span>{stats.activeRules}/{stats.totalRules} rules</span>
                        </div>
                        {stats.recentExecutions > 0 && (
                          <div className="flex items-center gap-1">
                            <PlayCircle className="h-3 w-3 text-muted-foreground" />
                            <span>{stats.recentExecutions} recent</span>
                          </div>
                        )}
                      </div>
                      {stats.activeRules === 0 ? (
                        <Badge variant="outline">Not configured</Badge>
                      ) : stats.activeRules === stats.totalRules ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Partial</Badge>
                      )}
                    </div>
                    
                    {stats.lastExecution && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            Last run {formatDistanceToNow(new Date(stats.lastExecution), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}