-- Create creative strategies table
CREATE TABLE creative_strategies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph","content":[]}]}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'waiting_internal_feedback',
    'internal_feedback_given',
    'sent_client_feedback',
    'client_feedback_given',
    'approved'
  )),
  created_by TEXT NOT NULL, -- clerk_user_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX idx_creative_strategies_client_id ON creative_strategies(client_id);
CREATE INDEX idx_creative_strategies_status ON creative_strategies(status);
CREATE INDEX idx_creative_strategies_created_at ON creative_strategies(created_at DESC);

-- Create comments table for feedback
CREATE TABLE creative_strategy_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creative_strategy_id UUID NOT NULL REFERENCES creative_strategies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- clerk_user_id
  user_role TEXT NOT NULL CHECK (user_role IN ('social_bubble', 'client')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for comments
CREATE INDEX idx_creative_strategy_comments_strategy_id ON creative_strategy_comments(creative_strategy_id);
CREATE INDEX idx_creative_strategy_comments_created_at ON creative_strategy_comments(created_at DESC);

-- Add creative strategy client overview to clients table
ALTER TABLE clients ADD COLUMN creative_strategy_client_overview JSONB;

-- Create templates table
CREATE TABLE creative_strategy_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  content JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Ensure only one default template
CREATE UNIQUE INDEX idx_creative_strategy_templates_default ON creative_strategy_templates(is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE creative_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_strategy_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_strategy_templates ENABLE ROW LEVEL SECURITY;

-- Policies for creative_strategies
-- Social Bubble can manage all strategies
CREATE POLICY "Social Bubble can manage all creative strategies" ON creative_strategies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE clerk_user_id = auth.uid()::text 
      AND role = 'social_bubble'
    )
  );

-- Clients can view their strategy only when status is appropriate
CREATE POLICY "Clients can view their creative strategy" ON creative_strategies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_users 
      WHERE clerk_user_id = auth.uid()::text 
      AND client_id = creative_strategies.client_id
    )
    AND status IN ('sent_client_feedback', 'client_feedback_given', 'approved')
  );

-- Policies for comments
-- Social Bubble can manage all comments
CREATE POLICY "Social Bubble can manage all comments" ON creative_strategy_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE clerk_user_id = auth.uid()::text 
      AND role = 'social_bubble'
    )
  );

-- Clients can view comments on their strategy
CREATE POLICY "Clients can view comments on their strategy" ON creative_strategy_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM creative_strategies cs
      JOIN client_users cu ON cu.client_id = cs.client_id
      WHERE cs.id = creative_strategy_comments.creative_strategy_id
      AND cu.clerk_user_id = auth.uid()::text
      AND cs.status IN ('sent_client_feedback', 'client_feedback_given', 'approved')
    )
  );

-- Clients can create comments on their strategy
CREATE POLICY "Clients can create comments on their strategy" ON creative_strategy_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM creative_strategies cs
      JOIN client_users cu ON cu.client_id = cs.client_id
      WHERE cs.id = creative_strategy_comments.creative_strategy_id
      AND cu.clerk_user_id = auth.uid()::text
      AND cs.status IN ('sent_client_feedback', 'client_feedback_given', 'approved')
    )
    AND user_id = auth.uid()::text
  );

-- Policies for templates
-- Social Bubble can manage templates
CREATE POLICY "Social Bubble can manage templates" ON creative_strategy_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE clerk_user_id = auth.uid()::text 
      AND role = 'social_bubble'
    )
  );

-- Update triggers
CREATE TRIGGER update_creative_strategies_updated_at BEFORE UPDATE ON creative_strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creative_strategy_templates_updated_at BEFORE UPDATE ON creative_strategy_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create creative strategy when client is created
CREATE OR REPLACE FUNCTION create_creative_strategy_for_client()
RETURNS TRIGGER AS $$
DECLARE
  default_content JSONB;
BEGIN
  -- Get default template content if exists
  SELECT content INTO default_content
  FROM creative_strategy_templates
  WHERE is_default = true
  LIMIT 1;
  
  -- If no default template, use empty document
  IF default_content IS NULL THEN
    default_content := '{"type":"doc","content":[{"type":"paragraph","content":[]}]}'::jsonb;
  END IF;
  
  -- Create creative strategy for new client
  INSERT INTO creative_strategies (client_id, content, status, created_by)
  VALUES (
    NEW.id,
    default_content,
    'draft',
    COALESCE(NEW.created_by, 'system')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-creating creative strategies
CREATE TRIGGER auto_create_creative_strategy
AFTER INSERT ON clients
FOR EACH ROW EXECUTE FUNCTION create_creative_strategy_for_client();

-- Add created_by to clients table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'clients' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE clients ADD COLUMN created_by TEXT;
  END IF;
END $$;