import { getSlackClient, SlackWebhookPayload } from './client';
import { buildCastingMissingBriefingMessage } from './messages/casting-missing-briefing';

export type NotificationType = 
  | 'casting-missing-briefing'
  | 'casting-approved'
  | 'error'
  | 'info';

export interface SlackNotificationOptions {
  type: NotificationType;
  channel?: string;
  data?: Record<string, any>;
  mentionUsers?: string[]; // Array of Slack user IDs to mention
}

// Default channels for different notification types
const DEFAULT_CHANNELS: Record<NotificationType, string> = {
  'casting-missing-briefing': process.env.SLACK_CHANNEL_OPERATIONS || '#operations',
  'casting-approved': process.env.SLACK_CHANNEL_CASTINGS || '#castings',
  'error': process.env.SLACK_CHANNEL_ALERTS || '#alerts',
  'info': process.env.SLACK_CHANNEL_GENERAL || '#general',
};

export async function sendSlackNotification({
  type,
  channel,
  data = {},
  mentionUsers = [],
}: SlackNotificationOptions): Promise<void> {
  try {
    const client = getSlackClient();
    const targetChannel = channel || DEFAULT_CHANNELS[type];
    
    // Format user mentions
    const mentions = mentionUsers.map(userId => `<@${userId}>`).join(' ');
    
    // Build the payload based on notification type
    let payload: SlackWebhookPayload;
    
    switch (type) {
      case 'casting-missing-briefing':
        const messageData = buildCastingMissingBriefingMessage(data as any, mentionUsers);
        payload = {
          channel: targetChannel,
          username: 'Bubble Ads Platform',
          icon_emoji: ':warning:',
          text: messageData.text,
          blocks: messageData.blocks,
        };
        break;
        
      case 'casting-approved':
        const { 
          castingTitle: title, 
          clientName: client, 
          chosenCount, 
          briefingLinked 
        } = data;
        payload = {
          channel: targetChannel,
          username: 'Bubble Ads Platform',
          icon_emoji: ':tada:',
          text: `Casting "${title}" has been approved by ${client}!`,
          attachments: [
            {
              color: 'good',
              fields: [
                {
                  title: 'Chosen Creators',
                  value: `${chosenCount} creators selected`,
                  short: true,
                },
                {
                  title: 'Briefing Status',
                  value: briefingLinked ? '✅ Ready' : '⚠️ Pending',
                  short: true,
                },
              ],
              footer: 'Bubble Ads Platform',
              ts: Math.floor(Date.now() / 1000),
            },
          ],
        };
        break;
        
      case 'error':
        payload = {
          channel: targetChannel,
          username: 'Bubble Ads Platform',
          icon_emoji: ':x:',
          text: `Error: ${data.message || 'An error occurred'}`,
          attachments: [
            {
              color: 'danger',
              text: data.details || '',
              footer: 'Bubble Ads Platform',
              ts: Math.floor(Date.now() / 1000),
            },
          ],
        };
        break;
        
      case 'info':
      default:
        payload = {
          channel: targetChannel,
          username: 'Bubble Ads Platform',
          icon_emoji: ':information_source:',
          text: data.message || 'Information',
        };
        break;
    }
    
    await client.sendMessage(payload);
    console.log(`Slack notification sent: ${type}`);
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    // Don't throw - we don't want Slack failures to break the main flow
  }
}