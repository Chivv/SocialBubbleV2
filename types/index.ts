export type UserRole = 'social_bubble' | 'client' | 'creator';

export type ClientStatus = 'onboarding' | 'active' | 'lost';

export type BriefingStatus = 
  | 'draft'
  | 'waiting_internal_feedback'
  | 'internal_feedback_given'
  | 'sent_client_feedback'
  | 'client_feedback_given'
  | 'approved';

export interface Creator {
  id: string;
  clerk_user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  primary_language: string;
  has_dog: boolean;
  has_children: boolean;
  email: string;
  phone: string;
  address: string;
  website_url?: string;
  profile_picture_url?: string;
  introduction_video_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  company_name: string;
  website: string;
  interesting_competitors?: string;
  differentiation?: string;
  cool_ads_brands?: string;
  content_folder_link?: string;
  brand_assets_url?: string;
  ideal_customer?: string;
  customer_problems?: string;
  customer_objections?: string;
  recent_research?: string;
  pricing_info?: string;
  cold_friendly_offer?: string;
  contract_email: string;
  contract_full_name: string;
  phone: string;
  drive_folder_id?: string;
  drive_folder_url?: string;
  address: string;
  kvk: string;
  invoice_details?: string;
  briefing_client_overview?: any; // JSONB content from Tiptap
  status: ClientStatus;
  creators_count: number;
  briefings_count: number;
  creatives_count: number;
  invoice_date?: number;
  created_at: string;
  updated_at: string;
}

export interface ClientUser {
  id: string;
  clerk_user_id: string;
  client_id: string;
  email: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  clerk_user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Briefing {
  id: string;
  title: string;
  content: any; // JSONB content from Tiptap
  client_id: string;
  created_by: string;
  status: BriefingStatus;
  created_at: string;
  updated_at: string;
  client?: Client; // Optional joined data
}

export interface BriefingComment {
  id: string;
  briefing_id: string;
  user_id: string;
  user_role: 'social_bubble' | 'client';
  content: string;
  created_at: string;
  user?: {
    name?: string;
    email?: string;
  }; // Optional user data
}

export interface GlobalPlaceholder {
  id: string;
  key: string;
  name: string;
  content: any; // JSONB content from Tiptap
  created_at: string;
  updated_at: string;
}

export interface BriefingTemplate {
  id: string;
  name: string;
  content: any; // JSONB content from Tiptap with placeholders
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Creative Strategy Types
export type CreativeStrategyStatus = BriefingStatus; // Reuse same statuses

export interface CreativeStrategy {
  id: string;
  client_id: string;
  content: any; // JSONB content from Tiptap
  status: CreativeStrategyStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  client?: Client; // Optional joined data
}

export interface CreativeStrategyComment {
  id: string;
  creative_strategy_id: string;
  user_id: string;
  user_role: 'social_bubble' | 'client';
  content: string;
  created_at: string;
  user?: {
    name?: string;
    email?: string;
  }; // Optional user data
}

export interface CreativeStrategyTemplate {
  id: string;
  name: string;
  content: any; // JSONB content from Tiptap with placeholders
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Casting Types
export type CastingStatus = 
  | 'draft'
  | 'inviting'
  | 'check_intern'
  | 'send_client_feedback'
  | 'approved_by_client'
  | 'shooting'
  | 'done';

export type InvitationStatus = 'pending' | 'accepted' | 'rejected';

export interface Casting {
  id: string;
  client_id: string;
  title: string;
  status: CastingStatus;
  max_creators: number;
  compensation: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  client?: Client; // Optional joined data
  _count?: {
    invitations?: number;
    acceptedInvitations?: number;
    selections?: number;
  };
}

export interface CastingInvitation {
  id: string;
  casting_id: string;
  creator_id: string;
  status: InvitationStatus;
  rejection_reason?: string;
  invited_at: string;
  responded_at?: string;
  casting?: Casting; // Optional joined data
  creator?: Creator; // Optional joined data
}

export interface CastingSelection {
  id: string;
  casting_id: string;
  creator_id: string;
  selected_by: string;
  selected_by_role: 'social_bubble' | 'client';
  created_at: string;
  casting?: Casting; // Optional joined data
  creator?: Creator; // Optional joined data
}

// Briefing-Casting Link Types
export interface CastingBriefingLink {
  id: string;
  casting_id: string;
  briefing_id: string;
  linked_by: string;
  linked_at: string;
  briefing?: Briefing; // Optional joined data
  casting?: Casting; // Optional joined data
}

export type SubmissionStatus = 'pending' | 'submitted' | 'pending_review' | 'revision_requested' | 'approved';

export interface CreatorSubmission {
  id: string;
  casting_id: string;
  creator_id: string;
  content_upload_link?: string;
  submission_status: SubmissionStatus;
  submitted_at?: string;
  feedback?: string;
  feedback_by?: string;
  feedback_at?: string;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  drive_folder_id?: string;
  drive_folder_url?: string;
  drive_folder_created_at?: string;
  creator?: Creator; // Optional joined data
  casting?: Casting; // Optional joined data
}

// Invoice Types
export type InvoiceStatus = 'pending_payment' | 'paid';

export interface CreatorInvoice {
  id: string;
  creator_submission_id: string;
  creator_id: string;
  casting_id: string;
  deal_amount: number;
  invoice_pdf_url: string;
  full_name: string;
  iban: string;
  payment_reference: string;
  status: InvoiceStatus;
  submitted_at: string;
  payment_deadline: string;
  paid_at?: string;
  paid_by?: string;
  created_at: string;
  updated_at: string;
  
  // Optional joined data
  creator?: Creator;
  casting?: Casting;
  submission?: CreatorSubmission;
}

// Creative Agenda Types
export type CardType = 'briefing' | 'concept';
export type Department = 'concepting' | 'editing' | 'publication';
export type VideoType = 'video' | 'static';
export type FormatType = '4:5' | '1:1' | '9:16' | '9:16_safe' | '6:4' | '16:9';

export type ConceptingStatus = 
  | 'to_do'
  | 'in_progress'
  | 'waiting_internal_feedback'
  | 'internal_feedback_given'
  | 'sent_client_feedback'  // briefing cards only
  | 'approved';

export type EditingStatus = 
  | 'to_do'
  | 'in_progress'
  | 'waiting_internal_feedback'
  | 'internal_feedback_given'
  | 'approved';

export type PublicationStatus = 
  | 'waiting_client_feedback'
  | 'client_feedback_given'
  | 'client_feedback_processed'
  | 'media_buying'
  | 'done';

export type CreativeAgendaStatus = ConceptingStatus | EditingStatus | PublicationStatus;

export interface CreativeAgendaCard {
  id: string;
  card_type: CardType;
  client_id: string;
  department: Department;
  status: CreativeAgendaStatus;
  title: string;
  content: any; // JSONB content from Tiptap
  deadline?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_edited_by?: string;
  last_edited_at?: string;
  
  // For briefing cards only
  briefing_id?: string;
  casting_id?: string;
  parent_card_id?: string;
  creator_id?: string;
  
  // Optional joined data
  client?: Client;
  briefing?: Briefing;
  casting?: Casting;
  creator?: Creator;
  properties?: CreativeAgendaCardProperties;
}

export interface CreativeAgendaCardProperties {
  id: string;
  card_id: string;
  frame_link?: string;
  example_video_url?: string;
  video_type?: VideoType;
  format?: FormatType;
  created_at: string;
  updated_at: string;
}

export interface CreativeAgendaComment {
  id: string;
  card_id: string;
  user_id: string;
  user_role: UserRole;
  content: string;
  created_at: string;
  user?: {
    name?: string;
    email?: string;
  };
}

export interface CreativeAgendaStatusHistory {
  id: string;
  card_id: string;
  from_department?: Department;
  to_department: Department;
  from_status?: string;
  to_status: string;
  changed_by: string;
  changed_at: string;
  reason?: string;
  user?: {
    name?: string;
    email?: string;
  };
}

export interface CreatorImport {
  id: string;
  email: string;
  full_name: string;
  imported_at: string;
  invitation_sent_at?: string;
  follow_up_sent_at?: string;
  signed_up_at?: string;
  created_at: string;
  updated_at: string;
}