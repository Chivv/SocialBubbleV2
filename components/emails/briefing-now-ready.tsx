import * as React from 'react';
import { BaseEmailTemplate, emailStyles } from './base-email-template';

interface BriefingNowReadyTemplateProps {
  creatorName: string;
  castingTitle: string;
  clientName: string;
  compensation: number;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://platform.bubbleads.nl';

export function BriefingNowReadyTemplate({
  creatorName,
  castingTitle,
  clientName,
  compensation,
}: BriefingNowReadyTemplateProps) {
  const loginUrl = `${baseUrl}/sign-in`;

  return (
    <BaseEmailTemplate previewText={`Briefing is now ready for ${castingTitle}`}>
      <h1 style={emailStyles.heading}>
        Great news, {creatorName}! 🎬
      </h1>
      
      <p style={emailStyles.paragraph}>
        The briefing for <strong>{castingTitle}</strong> is now ready! You can start creating your content.
      </p>

      <div style={emailStyles.infoBox}>
        <p style={{ ...emailStyles.paragraph, margin: '0 0 10px 0', fontWeight: '700' }}>
          Casting Details:
        </p>
        <p style={{ ...emailStyles.paragraph, margin: '0 0 8px 0' }}>
          <strong>Client:</strong> {clientName}
        </p>
        <p style={{ ...emailStyles.paragraph, margin: '0 0 8px 0' }}>
          <strong>Compensation:</strong> €{compensation}
        </p>
        <p style={{ ...emailStyles.paragraph, margin: 0 }}>
          <strong>Status:</strong> Ready to start creating!
        </p>
      </div>

      <p style={emailStyles.paragraph}>
        <strong>What to do next:</strong>
      </p>
      
      <ul style={{ paddingLeft: '20px', margin: '0 0 20px 0' }}>
        <li style={{ ...emailStyles.paragraph, margin: '0 0 8px 0' }}>
          Log in to your dashboard to view the complete briefing
        </li>
        <li style={{ ...emailStyles.paragraph, margin: '0 0 8px 0' }}>
          Review all requirements and guidelines carefully
        </li>
        <li style={{ ...emailStyles.paragraph, margin: '0 0 8px 0' }}>
          Start creating your amazing content
        </li>
        <li style={{ ...emailStyles.paragraph, margin: '0' }}>
          Submit your content before the deadline
        </li>
      </ul>

      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a href={loginUrl} style={emailStyles.button}>
          View Briefing & Start Creating
        </a>
      </div>

      <p style={emailStyles.paragraph}>
        If you have any questions about the briefing or need clarification on any requirements, please don't hesitate to reach out to us.
      </p>

      <p style={emailStyles.paragraph}>
        We're excited to see what you create! 🚀
      </p>

      <p style={emailStyles.signature}>
        Best regards,<br />
        The Bubble Ads Team
      </p>
    </BaseEmailTemplate>
  );
}

export default BriefingNowReadyTemplate;