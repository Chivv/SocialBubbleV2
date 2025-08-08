import { SlackBlock } from '../client';

export interface CastingMissingBriefingData {
  castingId: string;
  castingTitle: string;
  clientName: string;
  chosenCreatorsCount: number;
  approvedBy: string;
}

export function buildCastingMissingBriefingMessage(
  data: CastingMissingBriefingData,
  mentionUserIds: string[] = []
): {
  blocks: SlackBlock[];
  text: string; // Fallback text
} {
  const mentions = mentionUserIds.map(userId => `<@${userId}>`).join(' ');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://platform.bubbleads.nl';
  
  return {
    text: `⚠️ Casting "${data.castingTitle}" approved without briefing - action required!`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⚠️ Casting Approved Without Briefing',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `A casting has been approved by the client but *no briefing is linked yet*. ${mentions}`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*🎬 Casting:*\n${data.castingTitle}`,
          },
          {
            type: 'mrkdwn',
            text: `*🏢 Client:*\n${data.clientName}`,
          },
          {
            type: 'mrkdwn',
            text: `*👥 Selected Creators:*\n${data.chosenCreatorsCount} creators`,
          },
          {
            type: 'mrkdwn',
            text: `*✅ Approved By:*\n${data.approvedBy}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*🚨 Action Required:*\n• Link a briefing to this casting ASAP\n• Selected creators are waiting for briefing details\n• They have been notified that briefing is coming soon',
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '📋 View Casting',
              emoji: true,
            },
            url: `${appUrl}/dashboard/castings/${data.castingId}`,
            style: 'primary',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '📝 Link Briefing',
              emoji: true,
            },
            url: `${appUrl}/dashboard/castings/${data.castingId}#briefings`,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `⏰ *Time is critical* - creators expect briefing within 24-48 hours | Casting ID: ${data.castingId}`,
          },
        ],
      },
    ],
  };
}