import React from 'react';
import { BaseEmailTemplate, emailStyles } from './base-email-template';

interface CreatorInvitationTemplateProps {
  fullName: string;
  inviteLink?: string;
}

export function CreatorInvitationTemplate({ 
  fullName, 
  inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/sign-up?redirect_url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/signup/creator`)}`
}: CreatorInvitationTemplateProps) {
  const firstName = fullName.split(' ')[0]; // Get first name for greeting
  
  return (
    <BaseEmailTemplate previewText="📣 We're live baby – nieuw Bubble platform voor al jouw opdrachten">
      <h1 style={emailStyles.heading}>
        Hey {firstName},
      </h1>
      
      <p style={emailStyles.paragraph}>
        We hebben iets leuks: vanaf nu werken we met ons eigen platform en dat maakt alles voor jou 10x makkelijker. 
        Geen gedoe meer met losse mailtjes of linkjes. Alles op één plek.
      </p>

      <p style={emailStyles.paragraph}>
        <strong>Wat je daar vindt? 👇</strong>
      </p>

      <p style={emailStyles.paragraph}>
        📬 Alle openstaande opdrachten meteen in je inbox én overzichtelijk in je dashboard<br />
        <br />
        📤 Een plek waar je supermakkelijk je content kunt uploaden<br />
        <br />
        💸 Al je facturen en betalingen netjes op een rijtje
      </p>

      <p style={emailStyles.paragraph}>
        <strong>Wil jij altijd als eerste op de hoogte zijn van nieuwe castings? 👀</strong><br />
        Dan is dit dé plek om te zijn.
      </p>

      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a
          href={inviteLink}
          style={emailStyles.button}
        >
          Klik hier om je aan te melden 🚀
        </a>
      </div>

      <p style={emailStyles.paragraph}>
        Heb je vragen of loopt er iets vast? Slide gerust in onze inbox.
      </p>

      <div style={{ ...emailStyles.signature, borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
          Let's make magic ✨<br />
          <strong style={{ color: '#333' }}>Team Bubble Ads</strong>
        </p>
      </div>
    </BaseEmailTemplate>
  );
}