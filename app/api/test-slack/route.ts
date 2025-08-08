import { NextResponse } from 'next/server';
import { sendSlackNotification } from '@/lib/slack/send-notification-v2';

export async function GET() {
  try {
    const results = [];

    // Test 1: Casting missing briefing notification
    console.log('Testing casting-missing-briefing notification...');
    try {
      await sendSlackNotification({
        type: 'casting-missing-briefing',
        data: {
          castingId: 'test-123',
          castingTitle: 'Test Summer Fashion Campaign',
          clientName: 'Test Fashion Brand',
          chosenCreatorsCount: 5,
          approvedBy: 'test@bubbleads.nl',
        },
      });
      results.push({ test: 'casting-missing-briefing', status: 'success' });
    } catch (error) {
      results.push({ 
        test: 'casting-missing-briefing', 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    // Wait between messages
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Casting approved notification
    console.log('Testing casting-approved notification...');
    try {
      await sendSlackNotification({
        type: 'casting-approved',
        data: {
          castingTitle: 'Test Product Launch Video',
          clientName: 'Test Tech Company',
          chosenCount: 3,
          briefingLinked: true,
        },
      });
      results.push({ test: 'casting-approved', status: 'success' });
    } catch (error) {
      results.push({ 
        test: 'casting-approved', 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    // Wait between messages
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Error notification
    console.log('Testing error notification...');
    try {
      await sendSlackNotification({
        type: 'error',
        data: {
          message: 'Test error: Failed to process casting',
          details: 'This is a test error notification from Bubble Ads platform',
        },
      });
      results.push({ test: 'error', status: 'success' });
    } catch (error) {
      results.push({ 
        test: 'error', 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    // Wait between messages
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 4: Info notification
    console.log('Testing info notification...');
    try {
      await sendSlackNotification({
        type: 'info',
        data: {
          message: 'Test info: Slack integration test completed',
        },
      });
      results.push({ test: 'info', status: 'success' });
    } catch (error) {
      results.push({ 
        test: 'info', 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    // Check environment variables
    const envCheck = {
      SLACK_BOT_TOKEN: !!process.env.SLACK_BOT_TOKEN,
      SLACK_CHANNEL_ID_OPERATIONS: !!process.env.SLACK_CHANNEL_ID_OPERATIONS,
      SLACK_CHANNEL_ID_CASTINGS: !!process.env.SLACK_CHANNEL_ID_CASTINGS,
      SLACK_CHANNEL_ID_ALERTS: !!process.env.SLACK_CHANNEL_ID_ALERTS,
      SLACK_CHANNEL_ID_GENERAL: !!process.env.SLACK_CHANNEL_ID_GENERAL,
    };

    return NextResponse.json({
      success: true,
      message: 'Slack notification tests completed',
      results,
      environmentVariables: envCheck,
      instructions: {
        checkSlack: 'Check your Slack channels for the test messages',
        channels: {
          operations: 'Should have casting-missing-briefing message',
          castings: 'Should have casting-approved message',
          alerts: 'Should have error message',
          general: 'Should have info message',
        },
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}