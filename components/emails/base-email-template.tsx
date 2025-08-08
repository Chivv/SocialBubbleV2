import * as React from 'react';

interface BaseEmailTemplateProps {
  children: React.ReactNode;
  previewText?: string;
}

export function BaseEmailTemplate({ children, previewText }: BaseEmailTemplateProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <title>Bubble Ads</title>
        {previewText && (
          <>
            <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>
              {previewText}
            </div>
            <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>
              &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
            </div>
          </>
        )}
        <style>
          {`
            @media only screen and (max-width: 600px) {
              .inner-container {
                width: 100% !important;
              }
            }
          `}
        </style>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#FFBACB',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        <table
          role="presentation"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#FFBACB',
          }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: '0' }}>
                {/* Spacer */}
                <div style={{ height: '40px' }} />
                
                {/* Main Container */}
                <table
                  className="inner-container"
                  role="presentation"
                  style={{
                    width: '600px',
                    maxWidth: '100%',
                    borderCollapse: 'collapse',
                  }}
                >
                  <tbody>
                    {/* Header */}
                    <tr>
                      <td
                        style={{
                          backgroundColor: '#FF4776',
                          padding: '40px',
                          borderRadius: '14px 14px 0 0',
                          textAlign: 'center',
                        }}
                      >
                        <img
                          src="https://drive.google.com/uc?export=view&id=1vqrf12Czfk3YY8GncEFC5Aip4f7fSUAM"
                          alt="Bubble Ads"
                          width="276"
                          height="50"
                          style={{
                            display: 'block',
                            margin: '0 auto',
                            border: '0',
                            outline: 'none',
                            textDecoration: 'none',
                          }}
                        />
                      </td>
                    </tr>
                    
                    {/* Content */}
                    <tr>
                      <td
                        style={{
                          backgroundColor: '#FFFFFF',
                          padding: '40px 30px',
                          borderRadius: '0 0 14px 14px',
                        }}
                      >
                        {children}
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                {/* Footer Spacer */}
                <div style={{ height: '40px' }} />
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

// Export common styles for consistent formatting
export const emailStyles = {
  heading: {
    fontSize: '24px',
    lineHeight: '32px',
    fontWeight: '700',
    color: '#333333',
    margin: '0 0 20px 0',
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#333333',
    margin: '0 0 16px 0',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#FF4776',
    color: '#FFFFFF',
    padding: '12px 24px',
    textDecoration: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    textAlign: 'center' as const,
  },
  infoBox: {
    backgroundColor: '#f8f9fa',
    borderLeft: '4px solid #FF4776',
    padding: '20px',
    margin: '20px 0',
    borderRadius: '0 8px 8px 0',
  },
  signature: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#333333',
    margin: '30px 0 0 0',
  },
};