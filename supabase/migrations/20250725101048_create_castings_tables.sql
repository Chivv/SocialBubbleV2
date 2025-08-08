-- Create enum types for castings
CREATE TYPE casting_status AS ENUM (
  'draft',
  'inviting',
  'check_intern',
  'send_client_feedback',
  'approved_by_client',
  'shooting',
  'done'
);

CREATE TYPE invitation_status AS ENUM (
  'pending',
  'accepted',
  'rejected'
);

-- Create castings table
CREATE TABLE castings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status casting_status NOT NULL DEFAULT 'draft',
  max_creators INTEGER NOT NULL,
  compensation DECIMAL(10,2) NOT NULL CHECK (compensation > 0),
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for castings
CREATE INDEX idx_castings_client_id ON castings(client_id);
CREATE INDEX idx_castings_status ON castings(status);
CREATE INDEX idx_castings_created_by ON castings(created_by);

-- Create casting invitations table
CREATE TABLE casting_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  casting_id UUID NOT NULL REFERENCES castings(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  status invitation_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(casting_id, creator_id)
);

-- Create indexes for invitations
CREATE INDEX idx_casting_invitations_casting_id ON casting_invitations(casting_id);
CREATE INDEX idx_casting_invitations_creator_id ON casting_invitations(creator_id);
CREATE INDEX idx_casting_invitations_status ON casting_invitations(status);

-- Create casting selections table
CREATE TABLE casting_selections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  casting_id UUID NOT NULL REFERENCES castings(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  selected_by TEXT NOT NULL,
  selected_by_role TEXT NOT NULL CHECK (selected_by_role IN ('social_bubble', 'client')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(casting_id, creator_id, selected_by_role)
);

-- Create indexes for selections
CREATE INDEX idx_casting_selections_casting_id ON casting_selections(casting_id);
CREATE INDEX idx_casting_selections_creator_id ON casting_selections(creator_id);

-- Enable RLS
ALTER TABLE castings ENABLE ROW LEVEL SECURITY;
ALTER TABLE casting_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE casting_selections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for castings table
-- Social Bubble can do everything
CREATE POLICY "Social Bubble can manage all castings" ON castings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE clerk_user_id = auth.uid()::text 
      AND role = 'social_bubble'
    )
  );

-- Clients can view their castings only when status is appropriate
CREATE POLICY "Clients can view their castings" ON castings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_users 
      WHERE clerk_user_id = auth.uid()::text 
      AND client_id = castings.client_id
    ) AND status IN ('send_client_feedback', 'approved_by_client', 'shooting', 'done')
  );

-- Clients can update status for their castings
CREATE POLICY "Clients can update casting status" ON castings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM client_users 
      WHERE clerk_user_id = auth.uid()::text 
      AND client_id = castings.client_id
    ) AND status = 'send_client_feedback'
  );

-- RLS Policies for casting_invitations table
-- Social Bubble can manage all invitations
CREATE POLICY "Social Bubble can manage all invitations" ON casting_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE clerk_user_id = auth.uid()::text 
      AND role = 'social_bubble'
    )
  );

-- Creators can view their own invitations
CREATE POLICY "Creators can view their invitations" ON casting_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE clerk_user_id = auth.uid()::text 
      AND id = casting_invitations.creator_id
    )
  );

-- Creators can update their own invitations
CREATE POLICY "Creators can respond to invitations" ON casting_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE clerk_user_id = auth.uid()::text 
      AND id = casting_invitations.creator_id
    )
  );

-- RLS Policies for casting_selections table
-- Social Bubble can manage all selections
CREATE POLICY "Social Bubble can manage all selections" ON casting_selections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE clerk_user_id = auth.uid()::text 
      AND role = 'social_bubble'
    )
  );

-- Clients can view and create selections for their castings
CREATE POLICY "Clients can view selections" ON casting_selections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM castings c
      JOIN client_users cu ON cu.client_id = c.client_id
      WHERE c.id = casting_selections.casting_id
      AND cu.clerk_user_id = auth.uid()::text
      AND c.status IN ('send_client_feedback', 'approved_by_client', 'shooting', 'done')
    )
  );

CREATE POLICY "Clients can create selections" ON casting_selections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM castings c
      JOIN client_users cu ON cu.client_id = c.client_id
      WHERE c.id = casting_selections.casting_id
      AND cu.clerk_user_id = auth.uid()::text
      AND c.status = 'send_client_feedback'
    )
  );

-- Creators can view selections where they are involved
CREATE POLICY "Creators can view their selections" ON casting_selections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE clerk_user_id = auth.uid()::text 
      AND id = casting_selections.creator_id
    )
  );

-- Update trigger for updated_at
CREATE TRIGGER update_castings_updated_at BEFORE UPDATE ON castings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate casting title
CREATE OR REPLACE FUNCTION generate_casting_title()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate title as "Casting - {client name} - {current month}"
  SELECT 'Casting - ' || c.company_name || ' - ' || TO_CHAR(NOW(), 'Month YYYY')
  INTO NEW.title
  FROM clients c
  WHERE c.id = NEW.client_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate title on insert
CREATE TRIGGER auto_generate_casting_title
  BEFORE INSERT ON castings
  FOR EACH ROW
  WHEN (NEW.title IS NULL OR NEW.title = '')
  EXECUTE FUNCTION generate_casting_title();

-- Function to copy max_creators from client
CREATE OR REPLACE FUNCTION set_max_creators_from_client()
RETURNS TRIGGER AS $$
BEGIN
  -- Copy creators_count from client at the time of casting creation
  SELECT creators_count
  INTO NEW.max_creators
  FROM clients
  WHERE id = NEW.client_id;
  
  -- Default to 1 if not set
  IF NEW.max_creators IS NULL OR NEW.max_creators < 1 THEN
    NEW.max_creators := 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set max_creators on insert
CREATE TRIGGER set_casting_max_creators
  BEFORE INSERT ON castings
  FOR EACH ROW
  WHEN (NEW.max_creators IS NULL OR NEW.max_creators = 0)
  EXECUTE FUNCTION set_max_creators_from_client();