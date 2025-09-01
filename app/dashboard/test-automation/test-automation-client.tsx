'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { testCreativeAutomation } from '@/app/actions/test-creative-automation';
import { createServiceClient } from '@/lib/supabase/client';

export default function TestAutomationClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runDailyTask = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const supabase = createServiceClient();
      
      // Call the edge function directly
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/daily-task`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: 'test-creative-agenda',
          isManualTrigger: true
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to run daily task');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run daily task');
    } finally {
      setLoading(false);
    }
  };

  const runCreativeAutomation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await testCreativeAutomation();
      
      if (response.success) {
        setResult(response);
      } else {
        setError(response.message || 'Failed to run automation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run automation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Test Creative Agenda Automation</h1>

      <div className="grid gap-6">
        {/* Test Options */}
        <Card>
          <CardHeader>
            <CardTitle>Run Automation Tests</CardTitle>
            <CardDescription>
              Test the automatic generation of concept cards and briefings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Button
                onClick={runDailyTask}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Run Full Daily Task
              </Button>
              
              <Button
                onClick={runCreativeAutomation}
                disabled={loading}
                variant="secondary"
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Calendar className="mr-2 h-4 w-4" />
                )}
                Run Creative Automation Only
              </Button>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Note:</strong> The automation will check all clients whose invoice_date matches today's date ({new Date().getDate()}).
                It will generate concept cards (2-week deadline) and briefings (1-week deadline) for each matching client.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Automation Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.message && (
                  <Alert>
                    <AlertDescription>{result.message}</AlertDescription>
                  </Alert>
                )}

                {result.creativeAgenda && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Creative Agenda Generation:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Clients Processed: {result.creativeAgenda.clientsProcessed}</li>
                      <li>Concept Cards Created: {result.creativeAgenda.totalConceptCards}</li>
                      <li>Briefings Created: {result.creativeAgenda.totalBriefings}</li>
                    </ul>
                    
                    {result.creativeAgenda.errors && result.creativeAgenda.errors.length > 0 && (
                      <div className="mt-2">
                        <h4 className="font-medium text-red-600">Errors:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                          {result.creativeAgenda.errors.map((err: string, i: number) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {result.details && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium">Full Response Details</summary>
                    <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. The daily task runs every day at 8 AM Amsterdam time</p>
            <p>2. It checks all clients for matching invoice dates (day of month)</p>
            <p>3. For each matching client, it generates:</p>
            <ul className="list-disc list-inside ml-4">
              <li>Concept cards (default: 4) with 2-week deadline</li>
              <li>Briefings (default: 2) with 1-week deadline</li>
            </ul>
            <p>4. Cards are automatically added to the Creative Agenda concepting column</p>
            <p>5. The system prevents duplicate generation within the same month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}