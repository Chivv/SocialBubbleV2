-- Fix cascade delete for creative strategies and clean up orphaned records

-- First, delete any orphaned creative strategies (where client doesn't exist)
DELETE FROM creative_strategies 
WHERE client_id NOT IN (SELECT id FROM clients);

-- Drop the existing foreign key constraint
ALTER TABLE creative_strategies 
DROP CONSTRAINT IF EXISTS creative_strategies_client_id_fkey;

-- Add it back with CASCADE delete
ALTER TABLE creative_strategies 
ADD CONSTRAINT creative_strategies_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES clients(id) 
ON DELETE CASCADE;

-- Also fix the same issue for briefings
DELETE FROM briefings 
WHERE client_id NOT IN (SELECT id FROM clients);

ALTER TABLE briefings 
DROP CONSTRAINT IF EXISTS briefings_client_id_fkey;

ALTER TABLE briefings 
ADD CONSTRAINT briefings_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES clients(id) 
ON DELETE CASCADE;

-- Fix for creative_agenda_cards
DELETE FROM creative_agenda_cards 
WHERE client_id IS NOT NULL AND client_id NOT IN (SELECT id FROM clients);

ALTER TABLE creative_agenda_cards 
DROP CONSTRAINT IF EXISTS creative_agenda_cards_client_id_fkey;

ALTER TABLE creative_agenda_cards 
ADD CONSTRAINT creative_agenda_cards_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES clients(id) 
ON DELETE CASCADE;

-- Fix for castings
DELETE FROM castings 
WHERE client_id NOT IN (SELECT id FROM clients);

ALTER TABLE castings 
DROP CONSTRAINT IF EXISTS castings_client_id_fkey;

ALTER TABLE castings 
ADD CONSTRAINT castings_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES clients(id) 
ON DELETE CASCADE;