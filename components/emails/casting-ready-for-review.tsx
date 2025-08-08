import * as React from 'react';
import { BaseEmailTemplate, emailStyles } from './base-email-template';

interface CastingReadyForReviewTemplateProps {
  clientContactName?: string;
  castingTitle: string;
  selectedCreatorsCount: number;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://platform.bubbleads.nl';

export function CastingReadyForReviewTemplate({
  clientContactName = 'there',
  castingTitle,
  selectedCreatorsCount,
}: CastingReadyForReviewTemplateProps) {
  const loginUrl = `${baseUrl}/sign-in`;

  return (
    <BaseEmailTemplate previewText={`Your casting is ready for review - ${selectedCreatorsCount} creators selected`}>
      <h1 style={emailStyles.heading}>
        Hi {clientContactName}! 👋
      </h1>
      
      <p style={emailStyles.paragraph}>
        Great news! Our team has reviewed all the creator applications for <strong>{castingTitle}</strong> and selected the best matches for your campaign.
      </p>

      <div style={emailStyles.infoBox}>
        <p style={{ ...emailStyles.paragraph, margin: '0 0 10px 0', fontWeight: '700' }}>
          Ready for Your Review:
        </p>
        <p style={{ ...emailStyles.paragraph, margin: 0 }}>
          <strong>{selectedCreatorsCount} creators</strong> have been carefully selected based on your requirements
        </p>
      </div>

      <p style={emailStyles.paragraph}>
        <strong>What happens next?</strong>
      </p>
      
      <ul style={{ paddingLeft: '20px', margin: '0 0 20px 0' }}>
        <li style={{ ...emailStyles.paragraph, margin: '0 0 8px 0' }}>
          Review the selected creators' profiles and content
        </li>
        <li style={{ ...emailStyles.paragraph, margin: '0 0 8px 0' }}>
          Choose your final selection of creators
        </li>
        <li style={{ ...emailStyles.paragraph, margin: '0' }}>
          We'll notify everyone of your decision
        </li>
      </ul>

      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a href={loginUrl} style={emailStyles.button}>
          Review Selected Creators
        </a>
      </div>

      <p style={emailStyles.paragraph}>
        Take your time to review each creator carefully. Once you've made your final selection, we'll handle all the communication with both selected and non-selected creators.
      </p>
      
      <p style={emailStyles.signature}>
        Best regards,<br />
        The Bubble Ads Team
      </p>
    </BaseEmailTemplate>
  );
}

export default CastingReadyForReviewTemplate;