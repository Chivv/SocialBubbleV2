import { getSlackWebClient, getChannelId, ensureBotInChannel } from './web-api-client';
import { buildCastingMissingBriefingMessage } from './messages/casting-missing-briefing';

export type NotificationType = 
  | 'casting-missing-briefing'
  | 'casting-approved'
  | 'error'
  | 'info';

export interface SlackNotificationOptions {
  type: NotificationType;
  channelType?: 'operations' | 'castings' | 'alerts' | 'general';
  data?: Record<string, any>;
  mentionUsers?: string[]; // Array of Slack user IDs to mention
}

// Default channels for different notification types
const DEFAULT_CHANNEL_TYPES: Record<NotificationType, 'operations' | 'castings' | 'alerts' | 'general'> = {
  'casting-missing-briefing': 'operations',
  'casting-approved': 'castings',
  'error': 'alerts',
  'info': 'general',
};

export async function sendSlackNotification({
  type,
  channelType,
  data = {},
  mentionUsers = [],
}: SlackNotificationOptions): Promise<void> {
  try {
    const client = getSlackWebClient();
    const targetChannelType = channelType || DEFAULT_CHANNEL_TYPES[type];
    const channelId = getChannelId(targetChannelType);
    
    // Build the message based on notification type
    let text: string;
    let blocks: any[] | undefined;
    
    switch (type) {
      case 'casting-missing-briefing':
        const messageData = buildCastingMissingBriefingMessage(data, mentionUsers);
        text = messageData.text;
        blocks = messageData.blocks;
        break;
        
      case 'casting-approved':
        const { 
          castingTitle, 
          clientName, 
          chosenCount, 
          briefingLinked 
        } = data;
        text = `🎉 Casting "${castingTitle}" has been approved by ${clientName}!`;
        blocks = [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎉 Casting Approved',
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${castingTitle}* has been approved by *${clientName}*`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Chosen Creators:*\n${chosenCount} creators selected`,
              },
              {
                type: 'mrkdwn',
                text: `*Briefing Status:*\n${briefingLinked ? '✅ Ready' : '⚠️ Pending'}`,
              },
            ],
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Posted at <!date^${Math.floor(Date.now() / 1000)}^{date_pretty} at {time}|${new Date().toISOString()}>`,
              },
            ],
          },
        ];
        break;
        
      case 'error':
        text = `❌ Error: ${data.message || 'An error occurred'}`;
        if (data.details) {
          blocks = [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: text,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `\`\`\`${data.details}\`\`\``,
              },
            },
          ];
        }
        break;
        
      case 'info':
      default:
        text = data.message || 'Information';
        break;
    }
    
    // Try to send the message
    try {
      const result = await client.chat.postMessage({
        channel: channelId,
        text,
        blocks,
        unfurl_links: false,
        unfurl_media: false,
      });
      
      if (!result.ok) {
        throw new Error('Failed to send Slack message');
      }
      
      console.log(`Slack notification sent: ${type} to channel ${targetChannelType}`);
    } catch (error: any) {
      // If bot is not in channel, try to join and retry
      if (error?.data?.error === 'not_in_channel') {
        console.log(`Bot not in channel ${channelId}, attempting to join...`);
        
        const joined = await ensureBotInChannel(channelId);
        if (joined) {
          // Retry sending the message
          const retryResult = await client.chat.postMessage({
            channel: channelId,
            text,
            blocks,
            unfurl_links: false,
            unfurl_media: false,
          });
          
          if (!retryResult.ok) {
            throw new Error('Failed to send Slack message after joining channel');
          }
          
          console.log(`Slack notification sent after joining channel: ${type} to ${targetChannelType}`);
        } else {
          throw new Error(`Failed to join channel ${channelId}`);
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    // Don't throw - we don't want Slack failures to break the main flow
  }
}