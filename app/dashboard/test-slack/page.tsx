'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Send } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'success' | 'failed';
  error?: string;
}

interface TestResponse {
  success: boolean;
  message?: string;
  error?: string;
  results?: TestResult[];
  environmentVariables?: Record<string, boolean>;
  instructions?: {
    checkSlack: string;
    channels: Record<string, string>;
  };
}

export default function TestSlackPage() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<TestResponse | null>(null);

  const runTest = async () => {
    setLoading(true);
    setResponse(null);
    
    try {
      const res = await fetch('/api/test-slack');
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({
        success: false,
        error: 'Failed to run test. Check console for details.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-6 w-6" />
            Slack Integration Test
          </CardTitle>
          <CardDescription>
            Test your Slack bot integration by sending test notifications to all configured channels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">This test will send messages to:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">operations</Badge>
                  <span className="text-muted-foreground">Casting without briefing alert</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">castings</Badge>
                  <span className="text-muted-foreground">Casting approved notification</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">alerts</Badge>
                  <span className="text-muted-foreground">Error notification</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">general</Badge>
                  <span className="text-muted-foreground">Info notification</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={runTest} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending test notifications...
                </>
              ) : (
                'Run Slack Test'
              )}
            </Button>
          </div>

          {response && (
            <div className="space-y-4">
              {response.success ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Test Completed</AlertTitle>
                  <AlertDescription>{response.message}</AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Test Failed</AlertTitle>
                  <AlertDescription>{response.error}</AlertDescription>
                </Alert>
              )}

              {response.environmentVariables && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Environment Variables:</h3>
                  <div className="space-y-1">
                    {Object.entries(response.environmentVariables).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {value ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">{key}</code>
                        {!value && <span className="text-red-500 text-xs">Missing</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {response.results && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Test Results:</h3>
                  <div className="space-y-2">
                    {response.results.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                        <span className="text-sm font-mono">{result.test}</span>
                        <div className="flex items-center gap-2">
                          {result.status === 'success' ? (
                            <Badge variant="default" className="bg-green-500">Success</Badge>
                          ) : (
                            <>
                              <Badge variant="destructive">Failed</Badge>
                              {result.error && (
                                <span className="text-xs text-red-500">{result.error}</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {response.instructions && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{response.instructions.checkSlack}</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-1">
                      {Object.entries(response.instructions.channels).map(([channel, message]) => (
                        <div key={channel} className="text-sm">
                          <span className="font-medium">#{channel}:</span> {message}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}