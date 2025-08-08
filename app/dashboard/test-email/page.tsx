'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { testEmailDelivery } from '@/app/actions/test-email';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sendTestEmail = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setIsSending(true);
    setResult(null);

    try {
      const response = await testEmailDelivery(email);
      setResult(response);
      
      if (response.success) {
        toast.success('Test email sent successfully!');
      } else {
        toast.error(response.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send test email');
      setResult({ success: false, error: 'Unexpected error' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Test</h1>
        <p className="text-muted-foreground mt-2">
          Test email delivery and verify the email queue is working
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
          <CardDescription>
            Send a test email to verify Resend integration and email queue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSending}
            />
          </div>

          <Button 
            onClick={sendTestEmail} 
            disabled={isSending || !email}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test Email
              </>
            )}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <AlertDescription>
                {result.success ? (
                  <div className="space-y-2">
                    <p className="font-medium">Email sent successfully!</p>
                    {result.data?.id && (
                      <p className="text-sm text-muted-foreground">
                        Resend ID: {result.data.id}
                      </p>
                    )}
                    <p className="text-sm">Check your inbox for the test email.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium">Failed to send email</p>
                    <p className="text-sm">{result.error}</p>
                    {result.details && (
                      <pre className="text-xs mt-2 p-2 bg-muted rounded">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Service:</strong> Resend
          </div>
          <div>
            <strong>From Address:</strong> Social Bubble &lt;platform@bubbleads.nl&gt;
          </div>
          <div>
            <strong>Rate Limit:</strong> 2 emails per second
          </div>
          <div>
            <strong>Queue Status:</strong> Emails are queued and sent in background
          </div>
        </CardContent>
      </Card>
    </div>
  );
}