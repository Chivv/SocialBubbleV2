-- Update the trigger function to handle cases where a creative strategy might already exist

CREATE OR REPLACE FUNCTION create_creative_strategy_for_client()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_template_content JSONB;
  existing_strategy_id UUID;
BEGIN
  -- Check if a creative strategy already exists for this client
  SELECT id INTO existing_strategy_id
  FROM creative_strategies
  WHERE client_id = NEW.id
  LIMIT 1;
  
  -- If one already exists, just return without creating a duplicate
  IF existing_strategy_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
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