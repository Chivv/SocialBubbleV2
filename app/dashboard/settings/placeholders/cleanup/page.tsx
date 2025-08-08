'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cleanupMisplacedGlobalPlaceholders, listAllGlobalPlaceholders } from '@/app/actions/cleanup-placeholders';
import { Trash2, AlertCircle, CheckCircle } from 'lucide-react';

export default function PlaceholderCleanupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [placeholders, setPlaceholders] = useState<any[]>([]);

  const handleListPlaceholders = async () => {
    setLoading(true);
    try {
      const response = await listAllGlobalPlaceholders();
      if (response.success) {
        setPlaceholders(response.placeholders || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    setLoading(true);
    try {
      const response = await cleanupMisplacedGlobalPlaceholders();
      setResult(response);
      if (response.success) {
        // Refresh the list
        await handleListPlaceholders();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Placeholder Cleanup</h1>
        <p className="text-muted-foreground mt-2">
          Clean up misplaced global placeholders that should be client placeholders
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Global Placeholders</CardTitle>
          <CardDescription>
            These are all the global placeholders in your database. Client placeholder keys should not appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleListPlaceholders} disabled={loading}>
            List All Global Placeholders
          </Button>

          {placeholders.length > 0 && (
            <div className="space-y-2">
              {placeholders.map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <code className="font-mono text-sm">{`{{${p.key}}}`}</code>
                  <span className="text-sm text-muted-foreground">- {p.name}</span>
                  {['briefing_client_overview', 'briefing_client_brandname', 'briefing_client_domain'].includes(p.key) && (
                    <span className="text-xs text-red-500 font-medium ml-auto">Should be client placeholder!</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cleanup Misplaced Placeholders</CardTitle>
          <CardDescription>
            This will remove any global placeholders that have keys reserved for client placeholders:
            <ul className="list-disc list-inside mt-2">
              <li><code>briefing_client_overview</code></li>
              <li><code>briefing_client_brandname</code></li>
              <li><code>briefing_client_domain</code></li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleCleanup} 
            variant="destructive" 
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clean Up Misplaced Placeholders
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{result.success ? 'Cleanup Successful' : 'Cleanup Failed'}</AlertTitle>
              <AlertDescription>
                {result.success 
                  ? `Removed ${result.deletedCount} misplaced placeholder(s)`
                  : result.error}
              </AlertDescription>
              {result.success && result.deletedPlaceholders?.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Deleted:</p>
                  <ul className="list-disc list-inside text-sm">
                    {result.deletedPlaceholders.map((p: any) => (
                      <li key={p.id}><code>{`{{${p.key}}}`}</code> - {p.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}