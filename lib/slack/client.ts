// Slack webhook client for sending notifications

export interface SlackWebhookPayload {
  text?: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
}

export interface SlackBlock {
  type: string;
  text?: {
    type: 'mrkdwn' | 'plain_text';
    text: string;
    emoji?: boolean;
  };
  elements?: any[];
  fields?: Array<{
    type: 'mrkdwn' | 'plain_text';
    text: string;
  }>;
}

export interface SlackAttachment {
  color?: string;
  fallback?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  footer?: string;
  footer_icon?: string;
  ts?: number;
}

export class SlackClient {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    if (!webhookUrl) {
      throw new Error('Slack webhook URL is required');
    }
    this.webhookUrl = webhookUrl;
  }

  async sendMessage(payload: SlackWebhookPayload): Promise<void> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Slack webhook failed: ${response.status} - ${text}`);
      }
    } catch (error) {
      console.error('Error sending Slack message:', error);
      throw error;
    }
  }
}

// Create a default client instance
let defaultClient: SlackClient | null = null;

export function getSlackClient(): SlackClient {
  if (!defaultClient) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('SLACK_WEBHOOK_URL environment variable is not set');
    }
    defaultClient = new SlackClient(webhookUrl);
  }
  return defaultClient;
}