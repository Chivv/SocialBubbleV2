import { TriggerParameter } from './types';

export interface TriggerDefinition {
  name: string;
  description: string;
  parameters: TriggerParameter[];
  exampleValues: Record<string, any>;
}

// Hardcoded trigger definitions
export const AUTOMATION_TRIGGERS: Record<string, TriggerDefinition> = {
  casting_approved: {
    name: 'casting_approved',
    description: 'Triggered when a client approves a casting and selects final creators',
    parameters: [
      {
        name: 'castingId',
        type: 'string',
        description: 'Unique identifier for the casting'
      },
      {
        name: 'castingTitle',
        type: 'string',
        description: 'Title/name of the casting'
      },
      {
        name: 'clientName',
        type: 'string',
        description: 'Name of the client company'
      },
      {
        name: 'chosenCreatorsCount',
        type: 'number',
        description: 'Number of creators selected'
      },
      {
        name: 'briefingStatus',
        type: 'string',
        description: 'Status of briefing: ready or not_ready',
        possibleValues: ['ready', 'not_ready']
      },
      {
        name: 'briefingCount',
        type: 'number',
        description: 'Number of briefings linked to the casting'
      },
      {
        name: 'approvedBy',
        type: 'string',
        description: 'Email of the user who approved the casting'
      },
      {
        name: 'appUrl',
        type: 'string',
        description: 'Base URL of the platform for creating links'
      }
    ],
    exampleValues: {
      castingId: '123e4567-e89b-12d3-a456-426614174000',
      castingTitle: 'Summer Fashion Campaign 2024',
      clientName: 'Fashion Brand XYZ',
      chosenCreatorsCount: 5,
      briefingStatus: 'ready',
      briefingCount: 2,
      approvedBy: 'client@example.com',
      appUrl: 'https://platform.bubbleads.nl'
    }
  },
  casting_invitation_accepted: {
    name: 'casting_invitation_accepted',
    description: 'Triggered when a creator accepts an invitation to a casting',
    parameters: [
      {
        name: 'castingId',
        type: 'string',
        description: 'Unique identifier for the casting'
      },
      {
        name: 'castingTitle',
        type: 'string',
        description: 'Title/name of the casting'
      },
      {
        name: 'clientName',
        type: 'string',
        description: 'Name of the client company'
      },
      {
        name: 'creatorId',
        type: 'string',
        description: 'Unique identifier for the creator'
      },
      {
        name: 'creatorName',
        type: 'string',
        description: 'Name of the creator who accepted'
      },
      {
        name: 'creatorEmail',
        type: 'string',
        description: 'Email of the creator who accepted'
      },
      {
        name: 'totalInvited',
        type: 'number',
        description: 'Total number of creators invited to this casting'
      },
      {
        name: 'totalAccepted',
        type: 'number',
        description: 'Total number of creators who have accepted so far'
      },
      {
        name: 'compensation',
        type: 'number',
        description: 'Compensation amount for the casting'
      },
      {
        name: 'briefingStatus',
        type: 'string',
        description: 'Status of briefing: ready or not_ready',
        possibleValues: ['ready', 'not_ready']
      },
      {
        name: 'briefingCount',
        type: 'number',
        description: 'Number of briefings linked to the casting'
      },
      {
        name: 'appUrl',
        type: 'string',
        description: 'Base URL of the platform for creating links'
      }
    ],
    exampleValues: {
      castingId: '123e4567-e89b-12d3-a456-426614174000',
      castingTitle: 'Summer Fashion Campaign 2024',
      clientName: 'Fashion Brand XYZ',
      creatorId: '456e7890-a12b-34c5-d678-901234567890',
      creatorName: 'Jane Doe',
      creatorEmail: 'jane@example.com',
      totalInvited: 20,
      totalAccepted: 8,
      compensation: 500,
      briefingStatus: 'not_ready',
      briefingCount: 0,
      appUrl: 'https://platform.bubbleads.nl'
    }
  },
  casting_status_changed: {
    name: 'casting_status_changed',
    description: 'Triggered when the status of a casting changes',
    parameters: [
      {
        name: 'castingId',
        type: 'string',
        description: 'Unique identifier for the casting'
      },
      {
        name: 'castingTitle',
        type: 'string',
        description: 'Title/name of the casting'
      },
      {
        name: 'clientName',
        type: 'string',
        description: 'Name of the client company'
      },
      {
        name: 'previousStatus',
        type: 'string',
        description: 'Previous status of the casting',
        possibleValues: ['draft', 'inviting', 'check_intern', 'selecting', 'send_client_feedback', 'approved_by_client', 'shooting', 'done']
      },
      {
        name: 'newStatus',
        type: 'string',
        description: 'New status of the casting',
        possibleValues: ['draft', 'inviting', 'check_intern', 'selecting', 'send_client_feedback', 'approved_by_client', 'shooting', 'done']
      },
      {
        name: 'chosenCreatorsCount',
        type: 'number',
        description: 'Number of creators selected by client'
      },
      {
        name: 'totalInvited',
        type: 'number',
        description: 'Total number of creators invited'
      },
      {
        name: 'totalAccepted',
        type: 'number',
        description: 'Total number of creators who accepted'
      },
      {
        name: 'compensation',
        type: 'number',
        description: 'Compensation amount for the casting'
      },
      {
        name: 'briefingStatus',
        type: 'string',
        description: 'Status of briefing: ready or not_ready',
        possibleValues: ['ready', 'not_ready']
      },
      {
        name: 'briefingCount',
        type: 'number',
        description: 'Number of briefings linked to the casting'
      },
      {
        name: 'changedBy',
        type: 'string',
        description: 'Email of the user who changed the status'
      },
      {
        name: 'appUrl',
        type: 'string',
        description: 'Base URL of the platform for creating links'
      }
    ],
    exampleValues: {
      castingId: '123e4567-e89b-12d3-a456-426614174000',
      castingTitle: 'Summer Fashion Campaign 2024',
      clientName: 'Fashion Brand XYZ',
      previousStatus: 'send_client_feedback',
      newStatus: 'approved_by_client',
      chosenCreatorsCount: 5,
      totalInvited: 20,
      totalAccepted: 12,
      compensation: 500,
      briefingStatus: 'ready',
      briefingCount: 2,
      changedBy: 'admin@bubbleads.nl',
      appUrl: 'https://platform.bubbleads.nl'
    }
  },
  creator_signed_up: {
    name: 'creator_signed_up',
    description: 'Triggered when a new creator signs up and completes their profile',
    parameters: [
      {
        name: 'creatorId',
        type: 'string',
        description: 'Unique identifier for the creator'
      },
      {
        name: 'creatorName',
        type: 'string',
        description: 'Full name of the creator'
      },
      {
        name: 'creatorEmail',
        type: 'string',
        description: 'Email address of the creator'
      },
      {
        name: 'creatorPhone',
        type: 'string',
        description: 'Phone number of the creator'
      },
      {
        name: 'primaryLanguage',
        type: 'string',
        description: 'Primary language of the creator'
      },
      {
        name: 'hasProfilePicture',
        type: 'boolean',
        description: 'Whether the creator uploaded a profile picture'
      },
      {
        name: 'hasIntroductionVideo',
        type: 'boolean',
        description: 'Whether the creator uploaded an introduction video'
      },
      {
        name: 'signupSource',
        type: 'string',
        description: 'Source of signup: import_invitation or organic',
        possibleValues: ['import_invitation', 'organic']
      },
      {
        name: 'signupDate',
        type: 'string',
        description: 'Date and time when the creator signed up'
      },
      {
        name: 'appUrl',
        type: 'string',
        description: 'Base URL of the platform for creating links'
      }
    ],
    exampleValues: {
      creatorId: '456e7890-a12b-34c5-d678-901234567890',
      creatorName: 'Jane Doe',
      creatorEmail: 'jane@example.com',
      creatorPhone: '+31612345678',
      primaryLanguage: 'en',
      hasProfilePicture: true,
      hasIntroductionVideo: false,
      signupSource: 'import_invitation',
      signupDate: '2024-01-15T14:30:00Z',
      appUrl: 'https://platform.bubbleads.nl'
    }
  }
  // Future triggers can be added here
};

export function getTriggerDefinition(triggerName: string): TriggerDefinition | undefined {
  return AUTOMATION_TRIGGERS[triggerName];
}

export function getAllTriggers(): TriggerDefinition[] {
  return Object.values(AUTOMATION_TRIGGERS);
}