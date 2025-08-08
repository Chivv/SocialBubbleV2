-- Create briefings table
CREATE TABLE briefings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL, -- clerk_user_id of social bubble worker
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_briefings_client_id ON briefings(client_id);
CREATE INDEX idx_briefings_created_by ON briefings(created_by);
CREATE INDEX idx_briefings_created_at ON briefings(created_at DESC);

-- Enable RLS
ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;

-- Policy: Social Bubble workers can create, view, update, and delete all briefings
CREATE POLICY "Social Bubble can manage all briefings" ON briefings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE clerk_user_id = auth.uid()::text 
      AND role = 'social_bubble'
    )
  );

-- Policy: Client users can view briefings assigned to their company
CREATE POLICY "Clients can view their briefings" ON briefings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_users 
      WHERE clerk_user_id = auth.uid()::text 
      AND client_id = briefings.client_id
    )
  );

-- Update trigger for updated_at
CREATE TRIGGER update_briefings_updated_at BEFORE UPDATE ON briefings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update clients table to track briefings count automatically
CREATE OR REPLACE FUNCTION update_client_briefings_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE clients 
    SET briefings_count = briefings_count + 1 
    WHERE id = NEW.client_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE clients 
    SET briefings_count = GREATEST(briefings_count - 1, 0) 
    WHERE id = OLD.client_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_briefings_count_trigger
AFTER INSERT OR DELETE ON briefings
FOR EACH ROW EXECUTE FUNCTION update_client_briefings_count();