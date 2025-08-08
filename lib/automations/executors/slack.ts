import { ActionConfiguration, TriggerExecutionContext } from '../types';
import { substituteParameters, substituteParametersInJson } from '../parameter-parser';
import { getSlackWebClient, ensureBotInChannel } from '@/lib/slack/web-api-client';

export async function executeSlackNotification(
  configuration: ActionConfiguration,
  context: TriggerExecutionContext
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!configuration.channelId) {
      throw new Error('Channel ID is required for Slack notification');
    }

    const client = getSlackWebClient();
    const { parameters, isTest = false } = context;

    // Prepare the message
    let messagePayload: any = {
      channel: configuration.channelId,
      unfurl_links: false,
      unfurl_media: false,
    };

    if (configuration.useBlocks && configuration.blocksTemplate) {
      // Use blocks format
      const blocks = substituteParametersInJson(
        configuration.blocksTemplate,
        parameters,
        isTest
      );
      messagePayload.blocks = blocks;
      
      // Set fallback text
      messagePayload.text = isTest 
        ? `[TEST] Automation notification from ${context.triggerName}`
        : `Automation notification from ${context.triggerName}`;
    } else if (configuration.messageTemplate) {
      // Use plain text format
      messagePayload.text = substituteParameters(
        configuration.messageTemplate,
        parameters,
        isTest
      );
    } else {
      throw new Error('No message template provided');
    }

    // Try to send the message
    try {
      const result = await client.chat.postMessage(messagePayload);
      
      if (!result.ok) {
        throw new Error('Failed to send Slack message');
      }
      
      return { success: true };
    } catch (error: any) {
      // If bot is not in channel, try to join and retry
      if (error?.data?.error === 'not_in_channel') {
        console.log(`Bot not in channel ${configuration.channelId}, attempting to join...`);
        
        const joined = await ensureBotInChannel(configuration.channelId);
        if (joined) {
          // Retry sending the message
          const retryResult = await client.chat.postMessage(messagePayload);
          
          if (!retryResult.ok) {
            throw new Error('Failed to send Slack message after joining channel');
          }
          
          return { success: true };
        } else {
          throw new Error(`Failed to join channel ${configuration.channelId}`);
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Slack notification error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}