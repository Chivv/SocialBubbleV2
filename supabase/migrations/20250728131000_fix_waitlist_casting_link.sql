-- Update the sync_briefing_card_status function to properly handle casting_id
CREATE OR REPLACE FUNCTION sync_briefing_card_status()
RETURNS TRIGGER AS $$
DECLARE
    v_card_status TEXT;
    v_old_status TEXT;
    v_card_id UUID;
    v_user_id TEXT;
    v_casting_id UUID;
BEGIN
    -- Get the user ID, fallback to 'system' if not available
    v_user_id := COALESCE(auth.jwt()->>'sub', 'system');
    
    -- Map briefing status to card status
    v_card_status := CASE NEW.status
        WHEN 'draft' THEN 'to_do'
        WHEN 'waiting_internal_feedback' THEN 'waiting_internal_feedback'
        WHEN 'internal_feedback_given' THEN 'internal_feedback_given'
        WHEN 'sent_client_feedback' THEN 'sent_client_feedback'
        WHEN 'client_feedback_given' THEN 'sent_client_feedback'
        WHEN 'approved' THEN 'approved'
        ELSE 'to_do'
    END;
    
    -- Get the card ID and current status
    SELECT id, status INTO v_card_id, v_old_status
    FROM creative_agenda_cards
    WHERE briefing_id = NEW.id
    AND department = 'concepting'
    LIMIT 1;
    
    -- Update the card status
    UPDATE creative_agenda_cards
    SET status = v_card_status,
        content = NEW.content
    WHERE id = v_card_id;
    
    -- Record status change in history
    IF v_old_status IS DISTINCT FROM v_card_status THEN
        INSERT INTO creative_agenda_status_history (
            card_id,
            from_department,
            to_department,
            from_status,
            to_status,
            changed_by,
            reason
        )
        VALUES (
            v_card_id,
            'concepting',
            'concepting',
            v_old_status,
            v_card_status,
            v_user_id,
            'Synced from briefing status change'
        );
    END IF;
    
    -- If approved, move to editing waitlist
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Get casting_id from casting_briefing_links
        SELECT casting_id INTO v_casting_id
        FROM casting_briefing_links 
        WHERE briefing_id = NEW.id 
        LIMIT 1;
        
        -- Update the card to move to editing waitlist
        UPDATE creative_agenda_cards
        SET department = 'editing',
            status = 'waitlist',
            in_waitlist = true,
            casting_id = v_casting_id
        WHERE id = v_card_id;
        
        -- Record department transition
        INSERT INTO creative_agenda_status_history (
            card_id,
            from_department,
            to_department,
            from_status,
            to_status,
            changed_by,
            reason
        )
        VALUES (
            v_card_id,
            'concepting',
            'editing',
            'approved',
            'waitlist',
            v_user_id,
            'Auto-transition after briefing approval'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;