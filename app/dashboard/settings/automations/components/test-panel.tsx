'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TriggerDefinition } from '@/lib/automations/triggers';
import { testAutomation } from '@/app/actions/automations';
import { getCastings } from '@/app/actions/castings';
import { getCreators } from '@/app/actions/creators';
import { toast } from 'sonner';

interface TestPanelProps {
  trigger: TriggerDefinition;
}

export function TestPanel({ trigger }: TestPanelProps) {
  const [castings, setCastings] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [selectedTestDataId, setSelectedTestDataId] = useState<string>('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    parameters?: Record<string, any>;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const isCreatorTrigger = trigger.name === 'creator_signed_up';

  useEffect(() => {
    if (isCreatorTrigger) {
      loadCreators();
    } else {
      loadCastings();
    }
  }, [isCreatorTrigger]);

  const loadCastings = async () => {
    try {
      const castingsData = await getCastings();
      setCastings(castingsData || []);
    } catch (error) {
      console.error('Error loading castings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCreators = async () => {
    try {
      const creatorsData = await getCreators();
      setCreators(creatorsData || []);
    } catch (error) {
      console.error('Error loading creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!isCreatorTrigger && !selectedTestDataId) {
      toast.error('Please select a casting to test with');
      return;
    }

    setTesting(true);
    setTestResult(null);
    
    try {
      // Pass undefined if using sample data for creator trigger
      const testDataId = selectedTestDataId === '__sample__' ? undefined : selectedTestDataId;
      const result = await testAutomation(trigger.name, testDataId || undefined);
      
      if (result.success) {
        setTestResult({
          success: true,
          parameters: result.parameters
        });
        toast.success('Test automation sent successfully. Check your Slack channels!');
      } else {
        setTestResult({
          success: false,
          error: result.error
        });
        toast.error(result.error || 'Test failed');
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Failed to run test'
      });
      toast.error('Failed to run test');
    } finally {
      setTesting(false);
    }
  };

  const selectedCasting = castings.find(c => c.id === selectedTestDataId);
  const selectedCreator = selectedTestDataId !== '__sample__' ? creators.find(c => c.id === selectedTestDataId) : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Test Automation</CardTitle>
          <CardDescription>
            {isCreatorTrigger 
              ? "Test with sample data or select a real creator to test your automation rules"
              : "Select a real casting to test your automation rules with actual data"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Test messages will be sent with a <Badge variant="secondary" className="ml-1 mr-1">[TEST]</Badge> prefix.
              {!isCreatorTrigger && " The casting status will not be changed."}
            </AlertDescription>
          </Alert>

          {isCreatorTrigger ? (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Test Data Option
                </label>
                <Select
                  value={selectedTestDataId}
                  onValueChange={setSelectedTestDataId}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading..." : "Select test data"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__sample__">
                      <div>
                        <div className="font-medium">Use Sample Data</div>
                        <div className="text-xs text-muted-foreground">
                          Test with generic creator data
                        </div>
                      </div>
                    </SelectItem>
                    {creators.map((creator) => (
                      <SelectItem key={creator.id} value={creator.id}>
                        <div>
                          <div className="font-medium">{creator.first_name} {creator.last_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {creator.email} • {creator.primary_language}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCreator && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Selected Creator Details</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Name:</dt>
                      <dd>{selectedCreator.first_name} {selectedCreator.last_name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Email:</dt>
                      <dd>{selectedCreator.email}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Language:</dt>
                      <dd>{selectedCreator.primary_language}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Profile Picture:</dt>
                      <dd>{selectedCreator.profile_picture_url ? '✅' : '❌'}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select Casting
                </label>
                <Select
                  value={selectedTestDataId}
                  onValueChange={setSelectedTestDataId}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading castings..." : "Select a casting"} />
                  </SelectTrigger>
                  <SelectContent>
                    {castings.map((casting) => (
                      <SelectItem key={casting.id} value={casting.id}>
                        <div>
                          <div className="font-medium">{casting.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {casting.client?.company_name} • Status: {casting.status}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCasting && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Selected Casting Details</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Title:</dt>
                      <dd>{selectedCasting.title}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Client:</dt>
                      <dd>{selectedCasting.client?.company_name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Status:</dt>
                      <dd>
                        <Badge variant="outline">{selectedCasting.status}</Badge>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Max Creators:</dt>
                      <dd>{selectedCasting.max_creators}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </>
          )}

          <Button
            onClick={handleTest}
            disabled={(!isCreatorTrigger && !selectedTestDataId) || testing}
            className="w-full"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Running Test...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Test Successful
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Test Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResult.error ? (
              <Alert variant="destructive">
                <AlertDescription>{testResult.error}</AlertDescription>
              </Alert>
            ) : testResult.parameters ? (
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  The following parameters were used in the test:
                </p>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(testResult.parameters, null, 2)}
                </pre>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}