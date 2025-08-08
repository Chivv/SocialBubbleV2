'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlayCircle, Trash2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { runRealisticWorkflowTest, cleanupTestCasting } from '@/app/actions/test-workflow-v2';
import { toast } from 'sonner';

export default function TestWorkflowPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [testCastingId, setTestCastingId] = useState<string | null>(null);
  const [testBriefingId, setTestBriefingId] = useState<string | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);

  const runTest = async () => {
    setIsRunning(true);
    setResults([]);
    setTestCastingId(null);
    setTestBriefingId(null);

    try {
      const response = await runRealisticWorkflowTest();
      
      if (response.success) {
        setResults(response.results || []);
        setTestCastingId(response.castingId || null);
        setTestBriefingId(response.briefingId || null);
        toast.success('Workflow test completed successfully!');
      } else {
        toast.error(response.error || 'Test failed');
        setResults([`❌ Error: ${response.error}`]);
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Failed to run test');
      setResults([`❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const cleanup = async () => {
    if (!testCastingId) return;

    setIsCleaning(true);
    try {
      const response = await cleanupTestCasting(testCastingId, testBriefingId || undefined);
      
      if (response.success) {
        toast.success('Test data cleaned up successfully');
        setTestCastingId(null);
        setTestBriefingId(null);
        setResults(prev => [...prev, '\n🧹 Test data cleaned up']);
      } else {
        toast.error(response.error || 'Cleanup failed');
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      toast.error('Failed to cleanup test data');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workflow Test</h1>
        <p className="text-muted-foreground mt-2">
          Run a comprehensive test of the entire casting workflow
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Test Information</AlertTitle>
        <AlertDescription>
          This test will create real data in the database and trigger all automations including:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Creating a new casting for the "Hikaya" client</li>
            <li>Sending invitations to the 3 most recent creators</li>
            <li>Simulating creator responses and selections</li>
            <li>Testing email notifications (queued but not sent)</li>
            <li>Testing Google Drive folder creation (if configured)</li>
            <li>Creating a test submission</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Run Workflow Test</CardTitle>
          <CardDescription>
            Execute the complete casting workflow from start to finish
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={runTest} 
              disabled={isRunning || isCleaning}
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Run Workflow Test
                </>
              )}
            </Button>
            
            {testCastingId && !isRunning && (
              <Button
                onClick={cleanup}
                variant="destructive"
                disabled={isCleaning}
              >
                {isCleaning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cleanup Test Data
                  </>
                )}
              </Button>
            )}
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Test Results</h3>
                {testCastingId && (
                  <span className="text-sm text-muted-foreground">
                    Casting ID: {testCastingId}
                  </span>
                )}
              </div>
              
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <div 
                      key={index} 
                      className={`font-mono text-sm ${
                        result.includes('✅') ? 'text-green-600' :
                        result.includes('❌') ? 'text-red-600' :
                        result.includes('⚠️') ? 'text-yellow-600' :
                        result.includes('📊') || result.includes('🔔') ? 'font-bold' :
                        'text-muted-foreground'
                      }`}
                    >
                      {result}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prerequisites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Hikaya Client</p>
                <p className="text-sm text-muted-foreground">
                  A client named "Hikaya" must exist in the system
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">At Least 3 Creators</p>
                <p className="text-sm text-muted-foreground">
                  The system needs at least 3 creators to run the test
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Google Drive (Optional)</p>
                <p className="text-sm text-muted-foreground">
                  If the Hikaya client has a Drive folder configured, folders will be created automatically
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}