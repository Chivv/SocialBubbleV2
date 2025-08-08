-- Clean up ALL orphaned creative strategies where the client doesn't exist
-- This is more aggressive cleanup for testing scenarios

-- Delete ALL creative strategies where the client doesn't exist
DELETE FROM creative_strategies cs
WHERE NOT EXISTS (
  SELECT 1 FROM clients c WHERE c.id = cs.client_id
);

-- Also delete any creative strategies for the specific client_id mentioned in the error
-- This handles the case where you might be trying to recreate a client with the same ID
DELETE FROM creative_strategies 
WHERE client_id = '19a6acc2-eab3-4945-836a-14128d741279'::uuid;