-- Fix null casting_ids in creative_agenda_cards by looking up from casting_briefing_links
UPDATE creative_agenda_cards
SET casting_id = cbl.casting_id
FROM casting_briefing_links cbl
WHERE creative_agenda_cards.briefing_id = cbl.briefing_id
AND creative_agenda_cards.casting_id IS NULL
AND creative_agenda_cards.in_waitlist = true;