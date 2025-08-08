'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  SkipForward,
  TestTube 
} from 'lucide-react';
import { AutomationLog } from '@/lib/automations/types';
import { formatDistanceToNow } from 'date-fns';

interface LogsViewerProps {
  logs: AutomationLog[];
}

export function LogsViewer({ logs }: LogsViewerProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'test':
        return <TestTube className="h-4 w-4 text-blue-500" />;
      case 'skipped':
        return <SkipForward className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: 'default',
      failed: 'destructive',
      test: 'secondary',
      skipped: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">
            No automation logs yet. Logs will appear here when automations are triggered.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Automation Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <span className="font-medium text-sm">
                      {log.trigger_name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    {getStatusBadge(log.status)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.executed_at), { addSuffix: true })}
                  </span>
                </div>

                {log.error_message && (
                  <div className="bg-destructive/10 text-destructive text-xs p-2 rounded">
                    {log.error_message}
                  </div>
                )}

                {log.parameters && Object.keys(log.parameters).length > 0 && (
                  <details className="cursor-pointer">
                    <summary className="text-xs text-muted-foreground hover:text-foreground">
                      View parameters
                    </summary>
                    <pre className="text-xs bg-muted mt-2 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.parameters, null, 2)}
                    </pre>
                  </details>
                )}

                {log.executed_by && (
                  <div className="text-xs text-muted-foreground">
                    Executed by: {log.executed_by}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}