-- Update the trigger function to use the default template
CREATE OR REPLACE FUNCTION create_creative_strategy_for_client()
RETURNS TRIGGER AS $$
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
  VALUES (NEW.id, default_template_content, 'draft', NEW.created_by);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS create_creative_strategy_on_client_insert ON clients;
CREATE TRIGGER create_creative_strategy_on_client_insert
  AFTER INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION create_creative_strategy_for_client();