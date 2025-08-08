import * as React from 'react';
import { BaseEmailTemplate, emailStyles } from './base-email-template';

interface CastingInviteTemplateProps {
  creatorName: string;
  castingTitle: string;
  clientName: string;
  compensation: number;
  responseDeadline?: string | null;
  loginUrl?: string;
}

export function CastingInviteTemplate({
  creatorName,
  castingTitle,
  clientName,
  compensation,
  responseDeadline,
  loginUrl,
}: CastingInviteTemplateProps) {
  // Build the full login URL using the app URL and sign-in path
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://platform.bubbleads.nl';
  const signInPath = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in';
  const fullLoginUrl = loginUrl || `${appUrl}${signInPath}`;
  
  return (
    <BaseEmailTemplate previewText={`Casting opportunity: ${castingTitle} - €${compensation}`}>
      <h1 style={emailStyles.heading}>Hey {creatorName},</h1>
      
      <p style={emailStyles.paragraph}>
        You've been invited to apply for a casting opportunity with{' '}
        <strong>{clientName}</strong>! 🎬
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
          <strong>Compensation:</strong> €{compensation.toFixed(2)}
        </p>
      </div>
      
      {responseDeadline && (
        <div style={{
          ...emailStyles.infoBox,
          backgroundColor: '#FFF3E5',
          borderLeftColor: '#FF8C00',
          textAlign: 'center',
        }}>
          <strong style={{ color: '#D07000', fontSize: '16px' }}>
            ⏰ Response Deadline
          </strong>
          <p style={{ margin: '8px 0 0 0', color: '#D07000' }}>
            {new Date(responseDeadline).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      )}
      
      <p style={emailStyles.paragraph}>
        <strong>Please note:</strong> This is an invitation to apply. We will select creators from all applicants 
        who accept this invitation. You will receive an email within 1 week to let you know if you've been 
        selected for the final casting.
      </p>
      
      <p style={emailStyles.paragraph}>
        Interested? Log in to your creator dashboard to view the full casting details and let us know 
        if you'd like to participate.
      </p>
      
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={fullLoginUrl} style={emailStyles.button}>
          🔗 View Casting Details
        </a>
      </div>
      
      <p style={emailStyles.paragraph}>
        If you have any questions about this casting, please email us at{' '}
        <a href="mailto:castings@bubbleads.nl" style={{ color: '#FF4776', textDecoration: 'none' }}>
          castings@bubbleads.nl
        </a>
      </p>
      
      <div style={emailStyles.signature}>
        <p style={{ margin: 0 }}>Team Bubble Ads 💬</p>
      </div>
    </BaseEmailTemplate>
  );
}