import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google-drive-oauth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    // Redirect back to setup page with error
    return NextResponse.redirect(
      new URL('/dashboard/settings/google-drive?error=denied', request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard/settings/google-drive?error=no_code', request.url)
    );
  }

  try {
    const tokens = await getTokensFromCode(code);
    
    // Create an HTML page that displays the token and instructions
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Drive Authorization Success</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h1 { color: #333; }
            .token-box {
              background: #f0f0f0;
              padding: 15px;
              border-radius: 4px;
              word-break: break-all;
              margin: 20px 0;
              font-family: monospace;
              font-size: 14px;
            }
            .instructions {
              background: #e3f2fd;
              padding: 15px;
              border-radius: 4px;
              margin: 20px 0;
            }
            button {
              background: #1976d2;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
            }
            button:hover {
              background: #1565c0;
            }
            .success { color: #4caf50; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">✓ Authorization Successful!</h1>
            <p>Your Google account has been authorized. Copy the refresh token below:</p>
            
            <div class="token-box" id="token">${tokens.refresh_token || 'No refresh token received'}</div>
            
            <button onclick="copyToken()">Copy Token</button>
            
            <div class="instructions">
              <h3>Next Steps:</h3>
              <ol>
                <li>Copy the refresh token above</li>
                <li>Add it to your <code>.env.local</code> file:
                  <pre>GOOGLE_REFRESH_TOKEN=${tokens.refresh_token || 'your-token-here'}</pre>
                </li>
                <li>Restart your development server</li>
                <li>The Google Drive integration will now work automatically</li>
              </ol>
            </div>
            
            <p><a href="/dashboard/settings/google-drive">← Back to Google Drive Settings</a></p>
          </div>
          
          <script>
            function copyToken() {
              const token = document.getElementById('token').textContent;
              navigator.clipboard.writeText(token).then(() => {
                alert('Token copied to clipboard!');
              });
            }
          </script>
        </body>
      </html>
    `;
    
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings/google-drive?error=token_exchange_failed', request.url)
    );
  }
}