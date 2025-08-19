import { Resend } from 'resend';
import { CastingInviteTemplate } from '@/components/emails/casting-invite-template';
import { CastingApprovedWithBriefingTemplate } from '@/components/emails/casting-approved-with-briefing';
import { CastingApprovedNoBriefingTemplate } from '@/components/emails/casting-approved-no-briefing';
import { CastingNotSelectedTemplate } from '@/components/emails/casting-not-selected';
import { CastingClosedNoResponseTemplate } from '@/components/emails/casting-closed-no-response';
import { CastingReadyForReviewTemplate } from '@/components/emails/casting-ready-for-review';
import { BriefingNowReadyTemplate } from '@/components/emails/briefing-now-ready';
import { CreatorInvitationTemplate } from '@/components/emails/creator-invitation-template';
import { CreatorFollowUpTemplate } from '@/components/emails/creator-follow-up-template';

const resend = new Resend(process.env.RESEND_API_KEY);

// Test email function
export async function sendTestEmail(to: string) {
  return resend.emails.send({
    from: 'Social Bubble <platform@bubbleads.nl>',
    to: [to],
    subject: 'Test Email from Social Bubble Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Test Email</h1>
        <p>This is a test email from the Social Bubble platform.</p>
        <p>If you're receiving this, it means:</p>
        <ul>
          <li>✅ Resend API is configured correctly</li>
          <li>✅ Email sending is working</li>
          <li>✅ Your email address is valid</li>
        </ul>
        <p style="color: #666; font-size: 14px;">
          Sent at: ${new Date().toISOString()}
        </p>
      </div>
    `,
  });
}

export interface SendCastingInviteEmailParams {
  to: string;
  creatorName: string;
  castingTitle: string;
  clientName: string;
  compensation: number;
  responseDeadline?: string | null;
}

export async function sendCastingInviteEmail({
  to,
  creatorName,
  castingTitle,
  clientName,
  compensation,
  responseDeadline,
}: SendCastingInviteEmailParams) {
  const { data, error } = await resend.emails.send({
    from: 'Bubble Ads Castings <castings@casting-invites.bubbleads.nl>',
    to: [to],
    subject: `Casting opportunity: ${castingTitle}`,
    react: CastingInviteTemplate({
      creatorName,
      castingTitle,
      clientName,
      compensation,
      responseDeadline,
      // Let the template handle the URL construction
    }),
  });

  if (error) {
    throw error;
  }

  return data;
}

// Send email when creator is selected and briefing is available
export interface SendCastingApprovedWithBriefingParams {
  to: string;
  creatorName: string;
  castingTitle: string;
  clientName: string;
  compensation: number;
}

export async function sendCastingApprovedWithBriefingEmail({
  to,
  creatorName,
  castingTitle,
  clientName,
  compensation,
}: SendCastingApprovedWithBriefingParams) {
  const { data, error } = await resend.emails.send({
    from: 'Bubble Ads Castings <castings@casting-invites.bubbleads.nl>',
    to: [to],
    subject: `Congratulations! You've been selected for ${castingTitle}`,
    react: CastingApprovedWithBriefingTemplate({
      creatorName,
      castingTitle,
      clientName,
      compensation,
    }),
  });

  if (error) {
    throw error;
  }

  return data;
}

// Send email when creator is selected but briefing is not yet available
export interface SendCastingApprovedNoBriefingParams {
  to: string;
  creatorName: string;
  castingTitle: string;
  clientName: string;
  compensation: number;
}

export async function sendCastingApprovedNoBriefingEmail({
  to,
  creatorName,
  castingTitle,
  clientName,
  compensation,
}: SendCastingApprovedNoBriefingParams) {
  const { data, error } = await resend.emails.send({
    from: 'Bubble Ads Castings <castings@casting-invites.bubbleads.nl>',
    to: [to],
    subject: `Great news! You've been selected for ${castingTitle}`,
    react: CastingApprovedNoBriefingTemplate({
      creatorName,
      castingTitle,
      clientName,
      compensation,
    }),
  });

  if (error) {
    throw error;
  }

  return data;
}

// Send email to creators who were not selected
export interface SendCastingNotSelectedParams {
  to: string;
  creatorName: string;
  castingTitle: string;
  clientName: string;
}

export async function sendCastingNotSelectedEmail({
  to,
  creatorName,
  castingTitle,
  clientName,
}: SendCastingNotSelectedParams) {
  const { data, error } = await resend.emails.send({
    from: 'Bubble Ads Castings <castings@casting-invites.bubbleads.nl>',
    to: [to],
    subject: `Update on your casting application`,
    react: CastingNotSelectedTemplate({
      creatorName,
      castingTitle,
      clientName,
    }),
  });

  if (error) {
    throw error;
  }

  return data;
}

// Send email to creators who didn't respond to invitation
export interface SendCastingClosedNoResponseParams {
  to: string;
  creatorName: string;
  castingTitle: string;
  clientName: string;
}

export async function sendCastingClosedNoResponseEmail({
  to,
  creatorName,
  castingTitle,
  clientName,
}: SendCastingClosedNoResponseParams) {
  const { data, error } = await resend.emails.send({
    from: 'Bubble Ads Castings <castings@casting-invites.bubbleads.nl>',
    to: [to],
    subject: `Casting closed: ${castingTitle}`,
    react: CastingClosedNoResponseTemplate({
      creatorName,
      castingTitle,
      clientName,
    }),
  });

  if (error) {
    throw error;
  }

  return data;
}

// Send email to client when casting is ready for review
export interface SendCastingReadyForReviewParams {
  to: string;
  clientContactName?: string;
  castingTitle: string;
  selectedCreatorsCount: number;
}

export async function sendCastingReadyForReviewEmail({
  to,
  clientContactName,
  castingTitle,
  selectedCreatorsCount,
}: SendCastingReadyForReviewParams) {
  const { data, error } = await resend.emails.send({
    from: 'Bubble Ads Castings <castings@casting-invites.bubbleads.nl>',
    to: [to],
    subject: `Casting ready for review: ${selectedCreatorsCount} creators selected`,
    react: CastingReadyForReviewTemplate({
      clientContactName,
      castingTitle,
      selectedCreatorsCount,
    }),
  });

  if (error) {
    throw error;
  }

  return data;
}

// Send email when briefing becomes available after approval
export interface SendBriefingNowReadyParams {
  to: string;
  creatorName: string;
  castingTitle: string;
  clientName: string;
  compensation: number;
}

export async function sendBriefingNowReadyEmail({
  to,
  creatorName,
  castingTitle,
  clientName,
  compensation,
}: SendBriefingNowReadyParams) {
  const { data, error } = await resend.emails.send({
    from: 'Bubble Ads Castings <castings@casting-invites.bubbleads.nl>',
    to: [to],
    subject: `Briefing now ready for ${castingTitle}`,
    react: BriefingNowReadyTemplate({
      creatorName,
      castingTitle,
      clientName,
      compensation,
    }),
  });

  if (error) {
    throw error;
  }

  return data;
}

// Send invitation email to imported creators
export interface SendCreatorInvitationParams {
  to: string;
  fullName: string;
}

export async function sendCreatorInvitationEmail({
  to,
  fullName,
}: SendCreatorInvitationParams) {
  const { data, error } = await resend.emails.send({
    from: "Social Bubble <platform@creator-invites.bubbleads.nl>",
    to: [to],
    subject: "📣 We're live baby – nieuw Bubble platform voor al jouw opdrachten",
    react: CreatorInvitationTemplate({
      fullName,
    }),
  });

  if (error) {
    throw error;
  }

  return data;
}

// Send follow-up email to imported creators
export interface SendCreatorFollowUpParams {
  to: string;
  fullName: string;
}

export async function sendCreatorFollowUpEmail({
  to,
  fullName,
}: SendCreatorFollowUpParams) {
  const { data, error } = await resend.emails.send({
    from: "Kaylie van Bubble Ads <kaylie@creator-invites.bubbleads.nl>",
    to: [to],
    subject: "Is alles duidelijk? Je hebt nog geen account aangemaakt",
    react: CreatorFollowUpTemplate({
      fullName,
    }),
  });

  if (error) {
    throw error;
  }

  return data;
}
