# Slack Bot Setup Guide

This guide explains how to set up the Slack bot for Bubble Ads platform notifications.

## 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App"
3. Choose "From scratch"
4. Name your app (e.g., "Bubble Ads Bot")
5. Select your workspace

## 2. Configure Bot Token Scopes

1. Go to "OAuth & Permissions" in the sidebar
2. Scroll to "Scopes" section
3. Add these OAuth scopes under "Bot Token Scopes":
   - `chat:write` - Send messages as the bot
   - `chat:write.public` - Send messages to public channels without joining
   - `channels:read` - View basic channel info (optional, for channel lookup)
   - `channels:join` - Join public channels automatically

## 3. Install App to Workspace

1. Still in "OAuth & Permissions"
2. Click "Install to Workspace" at the top
3. Review permissions and click "Allow"
4. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

## 4. Get Channel IDs

To find channel IDs:

### Method 1: From Slack App
1. Right-click on the channel name in Slack
2. Select "View channel details"
3. Scroll to bottom and copy the Channel ID

### Method 2: From Slack Web
1. Open Slack in your browser
2. Navigate to the channel
3. The URL will contain the channel ID: `https://app.slack.com/client/T00000000/C00000000`
   - The part starting with `C` is the channel ID

## 5. Configure Environment Variables

Add these to your `.env.local`:

```env
# Slack Bot Token (starts with xoxb-)
SLACK_BOT_TOKEN=xoxb-your-workspace-id-token-here

# Channel IDs (start with C)
SLACK_CHANNEL_ID_OPERATIONS=C01234567
SLACK_CHANNEL_ID_CASTINGS=C01234568
SLACK_CHANNEL_ID_ALERTS=C01234569
SLACK_CHANNEL_ID_GENERAL=C01234570
```

## 6. Bot Channel Access

### Automatic Join (Public Channels)
The bot will automatically join public channels when it tries to send a message for the first time.

### Manual Invite (Private Channels)
For private channels, you must manually invite the bot:
1. Go to the private channel
2. Type `/invite @YourBotName`
3. The bot will be added to the channel

Note: The bot cannot automatically join private channels due to Slack's security restrictions.

## 7. Test the Integration

The bot will send notifications for:
- Casting approved without briefing → #operations
- Casting approved → #castings
- Errors → #alerts
- General info → #general

## Troubleshooting

- **"channel_not_found" error**: Make sure the channel ID is correct and the bot has access
- **"not_in_channel" error**: The bot needs to be invited to private channels
- **"invalid_auth" error**: Check that your bot token is correct and starts with `xoxb-`