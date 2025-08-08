import { WebClient } from '@slack/web-api';

// Create a singleton instance of the Slack Web API client
let slackClient: WebClient | null = null;

export function getSlackWebClient(): WebClient {
  if (!slackClient) {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) {
      throw new Error('SLACK_BOT_TOKEN environment variable is not set');
    }
    slackClient = new WebClient(token);
  }
  return slackClient;
}

// Helper to join a channel if not already a member
export async function ensureBotInChannel(channelId: string): Promise<boolean> {
  const client = getSlackWebClient();
  
  try {
    // Try to join the channel
    await client.conversations.join({
      channel: channelId,
    });
    console.log(`Successfully joined channel ${channelId}`);
    return true;
  } catch (error: any) {
    // If already in channel, that's fine
    if (error?.data?.error === 'already_in_channel') {
      return true;
    }
    // If it's a private channel or other error, log it
    console.error(`Failed to join channel ${channelId}:`, error?.data?.error || error);
    return false;
  }
}

// Helper to get channel ID from environment or use default
export function getChannelId(channelType: 'operations' | 'castings' | 'alerts' | 'general'): string {
  const channelMap = {
    operations: process.env.SLACK_CHANNEL_ID_OPERATIONS,
    castings: process.env.SLACK_CHANNEL_ID_CASTINGS,
    alerts: process.env.SLACK_CHANNEL_ID_ALERTS,
    general: process.env.SLACK_CHANNEL_ID_GENERAL,
  };

  const channelId = channelMap[channelType];
  if (!channelId) {
    throw new Error(`Slack channel ID for ${channelType} is not configured`);
  }

  return channelId;
}