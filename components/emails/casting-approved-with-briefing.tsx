import * as React from 'react';
import { BaseEmailTemplate, emailStyles } from './base-email-template';

interface CastingApprovedWithBriefingProps {
  creatorName: string;
  castingTitle: string;
  clientName: string;
  compensation: number;
  loginUrl?: string;
}

export function CastingApprovedWithBriefingTemplate({
  creatorName,
  castingTitle,
  clientName,
  compensation,
  loginUrl,
}: CastingApprovedWithBriefingProps) {
  // Build the full login URL using the app URL and sign-in path
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://platform.bubbleads.nl';
  const signInPath = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in';
  const fullLoginUrl = loginUrl || `${appUrl}${signInPath}`;
  
  return (
    <BaseEmailTemplate previewText={`Congratulations! You've been selected for ${castingTitle}`}>
      <h1 style={emailStyles.heading}>Hey {creatorName}! 🎉</h1>
      
      <p style={emailStyles.paragraph}>
        <strong>Fantastic news!</strong> You've been selected for the casting with{' '}
        <strong>{clientName}</strong>. 
      </p>
      
      <div style={emailStyles.infoBox}>
        <strong style={{ display: 'block', marginBottom: '8px', color: '#333333', fontSize: '18px' }}>
          Casting Details
        </strong>
        <p style={{ margin: '4px 0', color: '#666666' }}>
          <strong>Title:</strong> {castingTitle}
        </p>
        <p style={{ margin: '4px 0', color: '#666666' }}>
          <strong>Client:</strong> {clientName}
        </p>
        <p style={{ margin: '4px 0', color: '#666666' }}>
          <strong>Your compensation:</strong> €{compensation.toFixed(2)}
        </p>
      </div>
      
      <div style={{
        ...emailStyles.infoBox,
        backgroundColor: '#E8F5E9',
        borderLeftColor: '#4CAF50',
      }}>
        <strong style={{ color: '#2E7D32', fontSize: '16px' }}>
          ✅ Briefing Available Now!
        </strong>
        <p style={{ margin: '8px 0 0 0', color: '#2E7D32' }}>
          The briefing for this casting is ready. Log in to your dashboard to view all the details 
          and start preparing for the shoot.
        </p>
      </div>
      
      <p style={emailStyles.paragraph}>
        <strong>Next steps:</strong>
      </p>
      <ol style={{ ...emailStyles.paragraph, paddingLeft: '20px' }}>
        <li>Log in to your creator dashboard</li>
        <li>Review the full briefing and requirements</li>
        <li>Prepare for the shoot according to the guidelines</li>
        <li>Upload your content by the specified deadline</li>
      </ol>
      
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={fullLoginUrl} style={emailStyles.button}>
          🔗 View Briefing Now
        </a>
      </div>
      
      <p style={emailStyles.paragraph}>
        If you have any questions about the briefing or the shoot, please email us at{' '}
        <a href="mailto:castings@bubbleads.nl" style={{ color: '#FF4776', textDecoration: 'none' }}>
          castings@bubbleads.nl
        </a>
      </p>
      
      <p style={emailStyles.paragraph}>
        We're excited to work with you on this project!
      </p>
      
      <div style={emailStyles.signature}>
        <p style={{ margin: 0 }}>Team Bubble Ads 💬</p>
      </div>
    </BaseEmailTemplate>
  );
}