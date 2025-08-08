'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, RefreshCw, User, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { checkGoogleDriveAuth } from '@/app/actions/google-drive';

export default function GoogleDriveSetupPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<{
    isAuthorized: boolean;
    email?: string;
    name?: string;
    message?: string;
  }>({ isAuthorized: false });
  
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const result = await checkGoogleDriveAuth();
      if (result.success) {
        setAuthStatus({
          isAuthorized: result.isAuthorized || false,
          email: result.email || undefined,
          name: result.name || undefined,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAuthorize = () => {
    // Build the OAuth URL
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      redirect_uri: `${window.location.origin}/api/auth/google/callback`,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      access_type: 'offline',
      prompt: 'consent'
    });
    
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Google Drive Setup</h1>
        <p className="text-muted-foreground mt-2">
          Configure Google Drive integration for automatic folder creation
        </p>
      </div>

      {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Required</AlertTitle>
          <AlertDescription>
            Please add the following environment variables to your .env.local file:
            <pre className="mt-2 p-2 bg-muted rounded text-xs">
{`NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/google/callback`}
            </pre>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Authorization Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Authorization Status</CardTitle>
                  <CardDescription>
                    Google Drive integration status
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={checkAuthStatus}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Checking authorization status...</span>
                </div>
              ) : authStatus.isAuthorized ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Connected</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  </div>
                  
                  {authStatus.email && (
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Account:</strong> {authStatus.name || authStatus.email}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {authStatus.email}
                      </div>
                    </div>
                  )}
                  
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Ready to use</AlertTitle>
                    <AlertDescription>
                      Google Drive folders will be created automatically when castings reach "shooting" status.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">Not Connected</span>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      Setup Required
                    </Badge>
                  </div>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Authorization Required</AlertTitle>
                    <AlertDescription>
                      {authStatus.message || 'Connect a Google account to enable automatic Drive folder creation.'}
                    </AlertDescription>
                  </Alert>
                  
                  <Button onClick={handleAuthorize} className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Authorize Google Account
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* How It Works Card */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>
                Automatic folder creation workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Client Drive Folder Setup</p>
                    <p className="text-sm text-muted-foreground">
                      Add each client's Google Drive folder URL in the client settings
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Automatic RAW Folder Creation</p>
                    <p className="text-sm text-muted-foreground">
                      When a casting reaches "shooting" status, a RAW folder is created if it doesn't exist
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Creator Folders</p>
                    <p className="text-sm text-muted-foreground">
                      Individual folders are created for each creator: "Creator Name - Casting Title"
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Access Links</p>
                    <p className="text-sm text-muted-foreground">
                      Folder links appear in the Submissions tab for easy access
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting Card */}
          {!authStatus.isAuthorized && (
            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Common issues:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Make sure redirect URIs are correctly configured in Google Cloud Console</li>
                  <li>Ensure the Google Drive API is enabled in your project</li>
                  <li>Check that the OAuth consent screen is properly configured</li>
                  <li>Verify environment variables are correctly set</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}