import * as React from 'react';
import { BaseEmailTemplate, emailStyles } from './base-email-template';

interface CastingClosedNoResponseProps {
  creatorName: string;
  castingTitle: string;
  clientName: string;
}

export function CastingClosedNoResponseTemplate({
  creatorName,
  castingTitle,
  clientName,
}: CastingClosedNoResponseProps) {
  return (
    <BaseEmailTemplate previewText={`Casting closed: ${castingTitle}`}>
      <h1 style={emailStyles.heading}>Hey {creatorName},</h1>
      
      <p style={emailStyles.paragraph}>
        We recently invited you to apply for a casting opportunity with <strong>{clientName}</strong>, 
        but we didn't receive a response from you.
      </p>
      
      <div style={emailStyles.infoBox}>
        <strong style={{ display: 'block', marginBottom: '8px', color: '#333333', fontSize: '18px' }}>
          Missed Opportunity
        </strong>
        <p style={{ margin: '4px 0', color: '#666666' }}>
          <strong>Title:</strong> {castingTitle}
        </p>
        <p style={{ margin: '4px 0', color: '#666666' }}>
          <strong>Client:</strong> {clientName}
        </p>
        <p style={{ margin: '4px 0', color: '#666666' }}>
          <strong>Status:</strong> Closed
        </p>
      </div>
      
      <p style={emailStyles.paragraph}>
        This casting has now been closed and creators have been selected. We understand that 
        sometimes emails can be missed or timing doesn't work out, but we wanted to let you 
        know the outcome.
      </p>
      
      <div style={{
        ...emailStyles.infoBox,
        backgroundColor: '#FFF3E5',
        borderLeftColor: '#FF8C00',
      }}>
        <strong style={{ color: '#E65100', fontSize: '16px' }}>
          ⏰ Don't Miss Future Opportunities!
        </strong>
        <p style={{ margin: '8px 0 0 0', color: '#E65100' }}>
          To avoid missing out on future castings:
        </p>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#E65100' }}>
          <li>Check your email regularly</li>
          <li>Add castings@bubbleads.nl to your contacts</li>
          <li>Respond to invitations within 48 hours</li>
          <li>Keep your creator profile active and updated</li>
        </ul>
      </div>
      
      <p style={emailStyles.paragraph}>
        We have many exciting projects coming up and would love to see you participate in future 
        castings. Make sure to keep an eye on your inbox so you don't miss the next opportunity!
      </p>
      
      <p style={emailStyles.paragraph}>
        <strong>Remember:</strong> Quick responses significantly increase your chances of being 
        selected for castings. We typically give creators 1 week to respond to invitations.
      </p>
      
      <p style={emailStyles.paragraph}>
        If you have any questions or want to update your email preferences, please contact us at{' '}
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