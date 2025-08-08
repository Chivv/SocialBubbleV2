# Creator Signup Automation Examples

## How to Set Up Creator Signup Notifications

1. Go to **Dashboard → Settings → Automations**
2. Click on **"Creator Signed Up"** trigger
3. Create a new rule with your desired conditions

## Example Slack Block Templates

### 1. Standard Notification (Recommended)
Use this for most cases - it's clean and informative:

```json
[
  {
    "type": "header",
    "text": {
      "type": "plain_text",
      "text": "🎉 New Creator Signed Up!",
      "emoji": true
    }
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "*{{creatorName}}* has just completed their creator profile"
    }
  },
  {
    "type": "divider"
  },
  {
    "type": "section",
    "fields": [
      {
        "type": "mrkdwn",
        "text": "*📧 Email:*\n{{creatorEmail}}"
      },
      {
        "type": "mrkdwn", 
        "text": "*📱 Phone:*\n{{creatorPhone}}"
      },
      {
        "type": "mrkdwn",
        "text": "*🌍 Language:*\n{{primaryLanguage}}"
      },
      {
        "type": "mrkdwn",
        "text": "*🎯 Source:*\n{{signupSource}}"
      }
    ]
  },
  {
    "type": "actions",
    "elements": [
      {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "View Creator Profile",
          "emoji": true
        },
        "style": "primary",
        "url": "{{appUrl}}/dashboard/creators/{{creatorId}}/view"
      }
    ]
  }
]
```

### 2. Simple One-Line Notification
Use this for high-volume channels or when you want minimal notifications:

```json
[
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "🎉 *New Creator:* {{creatorName}} ({{creatorEmail}}) has signed up!"
    }
  },
  {
    "type": "context",
    "elements": [
      {
        "type": "mrkdwn",
        "text": "Language: *{{primaryLanguage}}* | <{{appUrl}}/dashboard/creators/{{creatorId}}/view|View Profile>"
      }
    ]
  }
]
```

### 3. Invitation Campaign Notification
Use this specifically for creators who signed up from invitations:

**Condition:** `signupSource equals import_invitation`

```json
[
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "📨 *Invitation Accepted!* {{creatorName}} has signed up from our invitation campaign"
    }
  },
  {
    "type": "section",
    "fields": [
      {
        "type": "mrkdwn",
        "text": "*Email:* {{creatorEmail}}"
      },
      {
        "type": "mrkdwn",
        "text": "*Profile Complete:* {{#if hasProfilePicture}}✅{{else}}⚠️ Missing photo{{/if}}"
      }
    ]
  },
  {
    "type": "actions",
    "elements": [
      {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "View Profile"
        },
        "url": "{{appUrl}}/dashboard/creators/{{creatorId}}/view"
      },
      {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Import Dashboard"
        },
        "url": "{{appUrl}}/dashboard/creator-imports"
      }
    ]
  }
]
```

### 4. Missing Profile Picture Alert
Use this to notify when creators sign up without profile pictures:

**Condition:** `hasProfilePicture equals false`

```json
[
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "⚠️ *Incomplete Profile:* {{creatorName}} signed up without a profile picture"
    }
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "Consider reaching out to help them complete their profile:\n• Email: {{creatorEmail}}\n• Phone: {{creatorPhone}}"
    }
  },
  {
    "type": "actions",
    "elements": [
      {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "View Profile"
        },
        "style": "danger",
        "url": "{{appUrl}}/dashboard/creators/{{creatorId}}/view"
      }
    ]
  }
]
```

## Available Parameters

All these parameters are available in your templates:

- `{{creatorId}}` - Unique ID of the creator
- `{{creatorName}}` - Full name of the creator
- `{{creatorEmail}}` - Email address
- `{{creatorPhone}}` - Phone number
- `{{primaryLanguage}}` - Primary language (en, nl, de, fr, es, etc.)
- `{{hasProfilePicture}}` - Boolean: true/false
- `{{hasIntroductionVideo}}` - Boolean: true/false
- `{{signupSource}}` - Either "import_invitation" or "organic"
- `{{signupDate}}` - ISO date string of when they signed up
- `{{appUrl}}` - Base URL of the platform

## Example Automation Rules

### 1. Notify #team-creators for all signups
- **Trigger:** Creator Signed Up
- **Conditions:** None (all signups)
- **Action:** Send Slack notification to #team-creators
- **Template:** Use Standard Notification

### 2. Alert when invited creators sign up
- **Trigger:** Creator Signed Up
- **Conditions:** signupSource equals import_invitation
- **Action:** Send Slack notification to #creator-invites
- **Template:** Use Invitation Campaign Notification

### 3. Alert for incomplete profiles
- **Trigger:** Creator Signed Up
- **Conditions:** hasProfilePicture equals false OR hasIntroductionVideo equals false
- **Action:** Send Slack notification to #creator-support
- **Template:** Use Missing Profile Picture Alert

### 4. Welcome Dutch creators
- **Trigger:** Creator Signed Up
- **Conditions:** primaryLanguage equals nl
- **Action:** Send Slack notification to #team-nl
- **Template:** Customize with Dutch welcome message