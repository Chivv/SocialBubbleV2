-- Create creator_import_list table for tracking imported creators
CREATE TABLE creator_import_list (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  follow_up_sent_at TIMESTAMP WITH TIME ZONE,
  signed_up_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_creator_import_list_email ON creator_import_list(email);
CREATE INDEX idx_creator_import_list_signed_up_at ON creator_import_list(signed_up_at);

-- Enable RLS
ALTER TABLE creator_import_list ENABLE ROW LEVEL SECURITY;

-- Only bas@bubbleads.nl can access this table
CREATE POLICY "Only bas@bubbleads.nl can manage creator imports" ON creator_import_list
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    auth.jwt()->>'email' = 'bas@bubbleads.nl'
  );

-- Update trigger for updated_at
CREATE TRIGGER update_creator_import_list_updated_at BEFORE UPDATE ON creator_import_list
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update signed_up_at when a creator signs up
CREATE OR REPLACE FUNCTION check_creator_import_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new creator is inserted, check if their email exists in import list
  UPDATE creator_import_list
  SET signed_up_at = NOW()
  WHERE email = NEW.email
  AND signed_up_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check signups
CREATE TRIGGER check_import_signup_on_creator_insert
  AFTER INSERT ON creators
  FOR EACH ROW
  EXECUTE FUNCTION check_creator_import_signup();

-- Comments for documentation
COMMENT ON TABLE creator_import_list IS 'Tracks imported creators who have not yet signed up to the platform';
COMMENT ON COLUMN creator_import_list.email IS 'Email address of the imported creator';
COMMENT ON COLUMN creator_import_list.full_name IS 'Full name of the imported creator';
COMMENT ON COLUMN creator_import_list.imported_at IS 'When the creator was imported';
COMMENT ON COLUMN creator_import_list.invitation_sent_at IS 'When the invitation email was sent';
COMMENT ON COLUMN creator_import_list.follow_up_sent_at IS 'When the follow-up email was sent';
COMMENT ON COLUMN creator_import_list.signed_up_at IS 'When the creator signed up (automatically updated)';