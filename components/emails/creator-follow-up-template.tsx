import React from 'react';
import { BaseEmailTemplate, emailStyles } from './base-email-template';

interface CreatorFollowUpTemplateProps {
  fullName: string;
  inviteLink?: string;
}

export function CreatorFollowUpTemplate({ 
  fullName, 
  inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/sign-up?redirect_url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/signup/creator`)}`
}: CreatorFollowUpTemplateProps) {
  const firstName = fullName.split(' ')[0]; // Get first name for greeting
  
  return (
    <BaseEmailTemplate previewText="Is alles duidelijk? Je hebt nog geen account aangemaakt">
      <h1 style={emailStyles.heading}>
        Hi {firstName}!
      </h1>
      
      <p style={emailStyles.paragraph}>
        Ik zag dat je ons nieuwe platform nog niet hebt uitgeprobeerd. Is alles duidelijk of heb je nog vragen?
      </p>

      <p style={emailStyles.paragraph}>
        <strong>Kleine reminder:</strong> zonder account kunnen we je helaas niet casten voor nieuwe opdrachten. 
        En dat zou zonde zijn, want er komen regelmatig gave projecten voorbij die perfect bij jou zouden passen!
      </p>

      <p style={emailStyles.paragraph}>
        Het aanmelden is helemaal gratis en duurt maar een paar minuutjes. Je hebt dan meteen toegang tot:
      </p>

      <ul style={{ ...emailStyles.paragraph, paddingLeft: '20px' }}>
        <li style={{ marginBottom: '8px' }}>Alle openstaande castings op één plek</li>
        <li style={{ marginBottom: '8px' }}>Je eigen dashboard voor content uploads</li>
        <li style={{ marginBottom: '8px' }}>Overzicht van al je opdrachten en betalingen</li>
      </ul>

      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a
          href={inviteLink}
          style={emailStyles.button}
        >
          Account aanmaken (gratis!) →
        </a>
      </div>

      <p style={emailStyles.paragraph}>
        Heb je vragen of loop je ergens tegenaan? Stuur me gerust een mailtje op{' '}
        <a href="mailto:kaylie@bubbleads.nl" style={{ color: '#FF6B35', textDecoration: 'none' }}>
          kaylie@bubbleads.nl
        </a>
        . Ik help je graag!
      </p>

      <p style={emailStyles.paragraph}>
        Hopelijk tot snel op het platform! 🚀
      </p>

      <div style={{ ...emailStyles.signature, borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
          Groetjes,<br />
          <strong style={{ color: '#333' }}>Kaylie</strong><br />
          <span style={{ fontSize: '13px', color: '#999' }}>Founder @ Bubble Ads</span>
        </p>
      </div>
    </BaseEmailTemplate>
  );
}