-- Create missing Creative Agenda cards for existing approved briefings
INSERT INTO creative_agenda_cards (
    card_type,
    client_id,
    department,
    status,
    title,
    content,
    briefing_id,
    created_by,
    in_waitlist,
    casting_id
)
SELECT 
    'briefing'::card_type,
    b.client_id,
    'editing'::department,
    'waitlist',
    b.title,
    b.content,
    b.id,
    'system',
    true,
    cbl.casting_id
FROM briefings b
LEFT JOIN creative_agenda_cards c ON c.briefing_id = b.id
LEFT JOIN casting_briefing_links cbl ON cbl.briefing_id = b.id
WHERE b.status = 'approved' 
AND c.id IS NULL;

-- Fix the card for "Test briefing 3" which is still in concepting but should be in waitlist
UPDATE creative_agenda_cards
SET department = 'editing'::department,
    status = 'waitlist',
    in_waitlist = true,
    casting_id = (
        SELECT casting_id 
        FROM casting_briefing_links 
        WHERE briefing_id = creative_agenda_cards.briefing_id 
        LIMIT 1
    )
WHERE briefing_id = '70703462-b712-4151-abbd-275ba991a5cd'
AND department = 'concepting';