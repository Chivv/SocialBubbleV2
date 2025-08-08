-- Create briefing status enum type
CREATE TYPE briefing_status AS ENUM (
  'draft',
  'waiting_internal_feedback',
  'internal_feedback_given',
  'sent_client_feedback',
  'client_feedback_given',
  'approved'
);

-- Add status column to briefings table
ALTER TABLE briefings 
ADD COLUMN status briefing_status DEFAULT 'draft' NOT NULL;

-- Add index for filtering by status
CREATE INDEX idx_briefings_status ON briefings(status);

-- Update the updated_at trigger to include status changes
-- (The trigger already exists from the initial migration)