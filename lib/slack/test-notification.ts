// Test script for Slack notifications
// Run with: npx tsx lib/slack/test-notification.ts

import { sendSlackNotification } from './send-notification-v2';

async function testSlackNotifications() {
  console.log('Testing Slack notifications...\n');

  // Test 1: Casting missing briefing notification
  console.log('1. Testing casting-missing-briefing notification...');
  await sendSlackNotification({
    type: 'casting-missing-briefing',
    data: {
      castingId: 'test-123',
      castingTitle: 'Summer Fashion Campaign',
      clientName: 'Fashion Brand XYZ',
      chosenCreatorsCount: 5,
      approvedBy: 'client@example.com',
    },
  });

  // Wait a bit between messages
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Casting approved notification
  console.log('2. Testing casting-approved notification...');
  await sendSlackNotification({
    type: 'casting-approved',
    data: {
      castingTitle: 'Product Launch Video',
      clientName: 'Tech Company ABC',
      chosenCount: 3,
      briefingLinked: true,
    },
  });

  // Wait a bit between messages
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Error notification
  console.log('3. Testing error notification...');
  await sendSlackNotification({
    type: 'error',
    data: {
      message: 'Failed to process casting',
      details: 'Database connection timeout after 30 seconds',
    },
  });

  // Wait a bit between messages
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 4: Info notification
  console.log('4. Testing info notification...');
  await sendSlackNotification({
    type: 'info',
    data: {
      message: 'System maintenance completed successfully',
    },
  });

  console.log('\nAll test notifications sent! Check your Slack channels.');
}

// Run the test
testSlackNotifications().catch(console.error);