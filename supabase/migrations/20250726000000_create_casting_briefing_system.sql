-- Create submission status enum
CREATE TYPE submission_status AS ENUM (
  'pending',
  'submitted', 
  'pending_review',
  'revision_requested',
  'approved'
);

-- Create casting-briefing link table
CREATE TABLE casting_briefing_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  casting_id UUID NOT NULL REFERENCES castings(id) ON DELETE CASCADE,
  briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  linked_by TEXT NOT NULL,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(casting_id, briefing_id)
);

-- Create indexes for casting_briefing_links
CREATE INDEX idx_casting_briefing_links_casting_id ON casting_briefing_links(casting_id);
CREATE INDEX idx_casting_briefing_links_briefing_id ON casting_briefing_links(briefing_id);

-- Create creator submissions table
CREATE TABLE creator_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  casting_id UUID NOT NULL REFERENCES castings(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  content_upload_link TEXT,
  submission_status submission_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE,
  feedback TEXT,
  feedback_by TEXT,
  feedback_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(casting_id, creator_id)
);

-- Create indexes for creator_submissions
CREATE INDEX idx_creator_submissions_casting_id ON creator_submissions(casting_id);
CREATE INDEX idx_creator_submissions_creator_id ON creator_submissions(creator_id);
CREATE INDEX idx_creator_submissions_status ON creator_submissions(submission_status);

-- Enable RLS
ALTER TABLE casting_briefing_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for casting_briefing_links
-- Social Bubble can manage all links
CREATE POLICY "Social Bubble can manage all briefing links" ON casting_briefing_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE clerk_user_id = auth.uid()::text 
      AND role = 'social_bubble'
    )
  );

-- Clients can view links for their castings/briefings
CREATE POLICY "Clients can view their briefing links" ON casting_briefing_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM castings c
      JOIN client_users cu ON cu.client_id = c.client_id
      WHERE c.id = casting_briefing_links.casting_id
      AND cu.clerk_user_id = auth.uid()::text
    ) OR EXISTS (
      SELECT 1 FROM briefings b
      JOIN client_users cu ON cu.client_id = b.client_id
      WHERE b.id = casting_briefing_links.briefing_id
      AND cu.clerk_user_id = auth.uid()::text
    )
  );

-- Creators can view links for their approved castings
CREATE POLICY "Creators can view their casting briefing links" ON casting_briefing_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM casting_selections cs
      JOIN castings c ON c.id = cs.casting_id
      JOIN creators cr ON cr.id = cs.creator_id
      WHERE cs.casting_id = casting_briefing_links.casting_id
      AND cs.selected_by_role = 'client'
      AND c.status IN ('approved_by_client', 'shooting', 'done')
      AND cr.clerk_user_id = auth.uid()::text
    )
  );

-- RLS Policies for creator_submissions
-- Social Bubble can manage all submissions
CREATE POLICY "Social Bubble can manage all submissions" ON creator_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE clerk_user_id = auth.uid()::text 
      AND role = 'social_bubble'
    )
  );

-- Creators can view and update their own submissions
CREATE POLICY "Creators can view their submissions" ON creator_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE clerk_user_id = auth.uid()::text 
      AND id = creator_submissions.creator_id
    )
  );

CREATE POLICY "Creators can update their submissions" ON creator_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE clerk_user_id = auth.uid()::text 
      AND id = creator_submissions.creator_id
    )
    -- Can only update when status is pending or revision_requested  
    AND creator_submissions.submission_status IN ('pending', 'revision_requested')
  );

-- Update trigger for creator_submissions updated_at
CREATE TRIGGER update_creator_submissions_updated_at BEFORE UPDATE ON creator_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create creator submissions when casting is approved by client
CREATE OR REPLACE FUNCTION create_creator_submissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create submissions when status changes to approved_by_client
  IF NEW.status = 'approved_by_client' AND OLD.status != 'approved_by_client' THEN
    -- Insert submission records for all client-selected creators
    INSERT INTO creator_submissions (casting_id, creator_id)
    SELECT NEW.id, cs.creator_id
    FROM casting_selections cs
    WHERE cs.casting_id = NEW.id
    AND cs.selected_by_role = 'client'
    ON CONFLICT (casting_id, creator_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create submissions
CREATE TRIGGER auto_create_creator_submissions
  AFTER UPDATE ON castings
  FOR EACH ROW
  EXECUTE FUNCTION create_creator_submissions();

-- Function to check if all creators are approved and transition to done
CREATE OR REPLACE FUNCTION check_all_creators_approved()
RETURNS TRIGGER AS $$
DECLARE
  all_approved BOOLEAN;
  casting_status casting_status;
BEGIN
  -- Only check when a submission is approved
  IF NEW.submission_status = 'approved' AND (OLD.submission_status IS NULL OR OLD.submission_status != 'approved') THEN
    -- Get current casting status
    SELECT status INTO casting_status
    FROM castings
    WHERE id = NEW.casting_id;
    
    -- Only proceed if casting is in shooting status
    IF casting_status = 'shooting' THEN
      -- Check if all creators for this casting are approved
      SELECT NOT EXISTS (
        SELECT 1 
        FROM creator_submissions cs
        WHERE cs.casting_id = NEW.casting_id
        AND cs.submission_status != 'approved'
      ) INTO all_approved;
      
      -- If all approved, update casting status to done
      IF all_approved THEN
        UPDATE castings
        SET status = 'done'
        WHERE id = NEW.casting_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check all creators approved
CREATE TRIGGER check_all_creators_approved_trigger
  AFTER INSERT OR UPDATE ON creator_submissions
  FOR EACH ROW
  EXECUTE FUNCTION check_all_creators_approved();