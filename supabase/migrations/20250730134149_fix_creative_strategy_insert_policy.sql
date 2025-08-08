-- Fix creative strategy insert policy to allow trigger-based inserts

-- Create a policy that allows inserts when done by the system (triggers)
-- This uses the fact that triggers run with the security context of the table owner
CREATE POLICY "System can insert creative strategies" ON creative_strategies
  FOR INSERT 
  WITH CHECK (true);

-- Also ensure the trigger function uses proper security definer
CREATE OR REPLACE FUNCTION create_creative_strategy_for_client()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_template_content JSONB;
BEGIN
  -- Get the default template content
  SELECT content INTO default_template_content
  FROM creative_strategy_templates
  WHERE is_default = true
  LIMIT 1;
  
  -- If no default template exists, use a basic template
  IF default_template_content IS NULL THEN
    default_template_content := '{"type":"doc","content":[{"type":"paragraph","content":[]}]}'::jsonb;
  END IF;
  
  -- Create a creative strategy for the new client
  INSERT INTO creative_strategies (client_id, content, status, created_by)
  VALUES (NEW.id, default_template_content, 'draft', COALESCE(NEW.created_by, 'system'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;