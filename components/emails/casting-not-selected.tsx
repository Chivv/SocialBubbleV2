import * as React from 'react';
import { BaseEmailTemplate, emailStyles } from './base-email-template';

interface CastingNotSelectedProps {
  creatorName: string;
  castingTitle: string;
  clientName: string;
}

export function CastingNotSelectedTemplate({
  creatorName,
  castingTitle,
  clientName,
}: CastingNotSelectedProps) {
  return (
    <BaseEmailTemplate previewText={`Update on your casting application for ${castingTitle}`}>
      <h1 style={emailStyles.heading}>Hey {creatorName},</h1>
      
      <p style={emailStyles.paragraph}>
        Thank you for your interest in the casting opportunity with <strong>{clientName}</strong>.
      </p>
      
      <div style={emailStyles.infoBox}>
        <strong style={{ display: 'block', marginBottom: '8px', color: '#333333', fontSize: '18px' }}>
          Casting Update
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
        We wanted to let you know that the selection process for this casting has been completed. 
        While you weren't selected for this particular project, we truly appreciate your interest 
        and the time you took to apply.
      </p>
      
      <p style={emailStyles.paragraph}>
        <strong>Please don't be discouraged!</strong> We have many casting opportunities throughout 
        the year, and we'd love to see you apply for future projects that match your profile.
      </p>
      
      <div style={{
        ...emailStyles.infoBox,
        backgroundColor: '#E3F2FD',
        borderLeftColor: '#2196F3',
      }}>
        <strong style={{ color: '#1565C0', fontSize: '16px' }}>
          💡 Tips for Future Applications
        </strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#1565C0' }}>
          <li>Keep your profile updated with recent work</li>
          <li>Respond quickly to casting invitations</li>
          <li>Make sure your portfolio showcases your best content</li>
          <li>Check your email regularly for new opportunities</li>
        </ul>
      </div>
      
      <p style={emailStyles.paragraph}>
        We value having you in our creator community and look forward to potentially working 
        with you on future projects. Stay tuned for more opportunities!
      </p>
      
      <p style={emailStyles.paragraph}>
        If you have any questions, feel free to reach out to us at{' '}
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