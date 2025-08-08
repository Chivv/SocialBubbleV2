-- Ensure all creators have a user_roles entry
INSERT INTO user_roles (clerk_user_id, role)
SELECT DISTINCT clerk_user_id, 'creator'::user_role
FROM creators
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.clerk_user_id = creators.clerk_user_id
);

-- Create a trigger to automatically create user_roles entry when a creator is created
CREATE OR REPLACE FUNCTION create_creator_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_roles (clerk_user_id, role)
  VALUES (NEW.clerk_user_id, 'creator')
  ON CONFLICT (clerk_user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_creator_role
  AFTER INSERT ON creators
  FOR EACH ROW
  EXECUTE FUNCTION create_creator_role();