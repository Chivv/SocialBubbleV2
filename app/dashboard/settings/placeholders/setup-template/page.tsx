'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { setupDefaultBriefingTemplate } from '@/app/actions/setup-default-template';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function SetupTemplatePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSetupTemplate = async () => {
    setLoading(true);
    try {
      const response = await setupDefaultBriefingTemplate();
      setResult(response);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Setup Default Briefing Template</h1>
        <p className="text-muted-foreground mt-2">
          Create or update the default briefing template with placeholders
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Default Template Structure</CardTitle>
          <CardDescription>
            The default template will include the following placeholders in order:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-md font-mono text-sm">
            <p>{'{{briefing_intro}}'}</p>
            <p className="mt-2">{'{{video_instructions}}'}</p>
            <p className="mt-2">{'{{expectations}}'}</p>
            <p className="mt-2">{'{{scripts}}'}</p>
            <p className="mt-2">{'{{lifestyle_photos}}'}</p>
          </div>
          
          <p className="text-sm text-muted-foreground">
            When creating a new briefing, these placeholders will be automatically replaced with the actual content from your global placeholders, allowing editors to modify the content as needed.
          </p>

          <Button 
            onClick={handleSetupTemplate} 
            disabled={loading}
          >
            <FileText className="h-4 w-4 mr-2" />
            {loading ? 'Setting up...' : 'Setup Default Template'}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
              <AlertDescription>
                {result.success ? result.message : result.error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}