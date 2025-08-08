import * as React from 'react';
import { BaseEmailTemplate, emailStyles } from './base-email-template';

interface CastingApprovedNoBriefingProps {
  creatorName: string;
  castingTitle: string;
  clientName: string;
  compensation: number;
  loginUrl?: string;
}

export function CastingApprovedNoBriefingTemplate({
  creatorName,
  castingTitle,
  clientName,
  compensation,
  loginUrl,
}: CastingApprovedNoBriefingProps) {
  // Build the full login URL using the app URL and sign-in path
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://platform.bubbleads.nl';
  const signInPath = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in';
  const fullLoginUrl = loginUrl || `${appUrl}${signInPath}`;
  
  return (
    <BaseEmailTemplate previewText={`Great news! You've been selected for ${castingTitle}`}>
      <h1 style={emailStyles.heading}>Hey {creatorName}! 🎉</h1>
      
      <p style={emailStyles.paragraph}>
        <strong>Awesome news!</strong> You've been selected for the casting with{' '}
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
        backgroundColor: '#FFF3E5',
        borderLeftColor: '#FF8C00',
      }}>
        <strong style={{ color: '#E65100', fontSize: '16px' }}>
          📋 Briefing Coming Soon
        </strong>
        <p style={{ margin: '8px 0 0 0', color: '#E65100' }}>
          We're currently finalizing the briefing details. You'll receive another email as soon as 
          the briefing is ready (typically within 24-48 hours).
        </p>
      </div>
      
      <p style={emailStyles.paragraph}>
        <strong>What happens next:</strong>
      </p>
      <ol style={{ ...emailStyles.paragraph, paddingLeft: '20px' }}>
        <li>We'll notify you by email when the briefing is available</li>
        <li>You'll be able to log in and view all project details</li>
        <li>Start preparing once you have the briefing</li>
        <li>Complete and upload your content by the deadline</li>
      </ol>
      
      <p style={emailStyles.paragraph}>
        In the meantime, make sure you're ready to start as soon as the briefing arrives. 
        Clear your schedule and prepare your equipment!
      </p>
      
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={fullLoginUrl} style={emailStyles.button}>
          🔗 Go to Dashboard
        </a>
      </div>
      
      <p style={emailStyles.paragraph}>
        If you have any questions, please email us at{' '}
        <a href="mailto:castings@bubbleads.nl" style={{ color: '#FF4776', textDecoration: 'none' }}>
          castings@bubbleads.nl
        </a>
      </p>
      
      <p style={emailStyles.paragraph}>
        Congratulations again - we're looking forward to seeing your creative work!
      </p>
      
      <div style={emailStyles.signature}>
        <p style={{ margin: 0 }}>Team Bubble Ads 💬</p>
      </div>
    </BaseEmailTemplate>
  );
}