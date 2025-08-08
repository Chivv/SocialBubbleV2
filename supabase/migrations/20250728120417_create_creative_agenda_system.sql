-- Create enum types
CREATE TYPE card_type AS ENUM ('briefing', 'concept');
CREATE TYPE department AS ENUM ('concepting', 'editing', 'publication');
CREATE TYPE video_type AS ENUM ('video', 'static');
CREATE TYPE format_type AS ENUM ('4:5', '1:1', '9:16', '9:16_safe', '6:4', '16:9');

-- Main creative agenda cards table
CREATE TABLE creative_agenda_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_type card_type NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    department department NOT NULL,
    status TEXT NOT NULL,
    title TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}',
    deadline TIMESTAMPTZ,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_edited_by TEXT,
    last_edited_at TIMESTAMPTZ,
    
    -- For briefing cards only
    briefing_id UUID REFERENCES briefings(id) ON DELETE CASCADE,
    casting_id UUID REFERENCES castings(id) ON DELETE CASCADE,
    parent_card_id UUID REFERENCES creative_agenda_cards(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    
    -- For waitlist management
    in_waitlist BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX idx_creative_agenda_cards_department ON creative_agenda_cards(department);
CREATE INDEX idx_creative_agenda_cards_status ON creative_agenda_cards(status);
CREATE INDEX idx_creative_agenda_cards_client ON creative_agenda_cards(client_id);
CREATE INDEX idx_creative_agenda_cards_briefing ON creative_agenda_cards(briefing_id);
CREATE INDEX idx_creative_agenda_cards_casting ON creative_agenda_cards(casting_id);

-- Properties for concept cards
CREATE TABLE creative_agenda_card_properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES creative_agenda_cards(id) ON DELETE CASCADE,
    frame_link TEXT,
    example_video_url TEXT,
    video_type video_type,
    format format_type,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Unique constraint to ensure one property per card
    CONSTRAINT unique_card_properties UNIQUE (card_id)
);

-- Comments on cards
CREATE TABLE creative_agenda_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES creative_agenda_cards(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_role user_role NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for comments
CREATE INDEX idx_creative_agenda_comments_card ON creative_agenda_comments(card_id);

-- Status change history
CREATE TABLE creative_agenda_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES creative_agenda_cards(id) ON DELETE CASCADE,
    from_department department,
    to_department department NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    reason TEXT
);

-- Create index for history
CREATE INDEX idx_creative_agenda_history_card ON creative_agenda_status_history(card_id);

-- Function to ensure only concept cards have properties
CREATE OR REPLACE FUNCTION check_only_concept_cards_have_properties()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM creative_agenda_cards 
        WHERE id = NEW.card_id AND card_type = 'concept'
    ) THEN
        RAISE EXCEPTION 'Only concept cards can have properties';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce the constraint
CREATE TRIGGER ensure_only_concept_cards_have_properties
    BEFORE INSERT OR UPDATE ON creative_agenda_card_properties
    FOR EACH ROW
    EXECUTE FUNCTION check_only_concept_cards_have_properties();

-- Enable RLS
ALTER TABLE creative_agenda_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_agenda_card_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_agenda_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_agenda_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Creative agenda cards policies
CREATE POLICY "Social Bubble can view all creative agenda cards"
    ON creative_agenda_cards FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.clerk_user_id = auth.jwt()->>'sub'
            AND user_roles.role = 'social_bubble'
        )
    );

CREATE POLICY "Social Bubble can create creative agenda cards"
    ON creative_agenda_cards FOR INSERT
    TO authenticated
    WITH CHECK (
        created_by = auth.jwt()->>'sub' AND
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.clerk_user_id = auth.jwt()->>'sub'
            AND user_roles.role = 'social_bubble'
        )
    );

CREATE POLICY "Social Bubble can update creative agenda cards"
    ON creative_agenda_cards FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.clerk_user_id = auth.jwt()->>'sub'
            AND user_roles.role = 'social_bubble'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.clerk_user_id = auth.jwt()->>'sub'
            AND user_roles.role = 'social_bubble'
        )
    );

CREATE POLICY "Social Bubble can delete creative agenda cards"
    ON creative_agenda_cards FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.clerk_user_id = auth.jwt()->>'sub'
            AND user_roles.role = 'social_bubble'
        )
    );

-- Card properties policies
CREATE POLICY "Social Bubble can view card properties"
    ON creative_agenda_card_properties FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.clerk_user_id = auth.jwt()->>'sub'
            AND user_roles.role = 'social_bubble'
        )
    );

CREATE POLICY "Social Bubble can manage card properties"
    ON creative_agenda_card_properties FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.clerk_user_id = auth.jwt()->>'sub'
            AND user_roles.role = 'social_bubble'
        )
    );

-- Comments policies
CREATE POLICY "Social Bubble can view all comments"
    ON creative_agenda_comments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.clerk_user_id = auth.jwt()->>'sub'
            AND user_roles.role = 'social_bubble'
        )
    );

CREATE POLICY "Social Bubble can create comments"
    ON creative_agenda_comments FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.jwt()->>'sub' AND
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.clerk_user_id = auth.jwt()->>'sub'
            AND user_roles.role = 'social_bubble'
        )
    );

-- Status history policies
CREATE POLICY "Social Bubble can view status history"
    ON creative_agenda_status_history FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.clerk_user_id = auth.jwt()->>'sub'
            AND user_roles.role = 'social_bubble'
        )
    );

CREATE POLICY "Social Bubble can create status history"
    ON creative_agenda_status_history FOR INSERT
    TO authenticated
    WITH CHECK (
        changed_by = auth.jwt()->>'sub' AND
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.clerk_user_id = auth.jwt()->>'sub'
            AND user_roles.role = 'social_bubble'
        )
    );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_creative_agenda_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.content IS DISTINCT FROM OLD.content OR NEW.title IS DISTINCT FROM OLD.title THEN
        NEW.last_edited_at = NOW();
        NEW.last_edited_by = auth.jwt()->>'sub';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_creative_agenda_cards_updated_at
    BEFORE UPDATE ON creative_agenda_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_creative_agenda_updated_at();

CREATE TRIGGER update_creative_agenda_card_properties_updated_at
    BEFORE UPDATE ON creative_agenda_card_properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create briefing card when briefing is created
CREATE OR REPLACE FUNCTION create_briefing_card_on_briefing_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO creative_agenda_cards (
        card_type,
        client_id,
        department,
        status,
        title,
        content,
        briefing_id,
        created_by
    )
    VALUES (
        'briefing',
        NEW.client_id,
        'concepting',
        'to_do',
        NEW.title,
        NEW.content,
        NEW.id,
        NEW.created_by
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create briefing card when briefing is created
CREATE TRIGGER create_briefing_card_trigger
    AFTER INSERT ON briefings
    FOR EACH ROW
    EXECUTE FUNCTION create_briefing_card_on_briefing_insert();

-- Function to sync briefing status with briefing card
CREATE OR REPLACE FUNCTION sync_briefing_card_status()
RETURNS TRIGGER AS $$
DECLARE
    v_card_status TEXT;
    v_old_status TEXT;
    v_card_id UUID;
BEGIN
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
            auth.jwt()->>'sub',
            'Synced from briefing status change'
        );
    END IF;
    
    -- If approved, move to editing waitlist
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Get casting_id from casting_briefing_links
        UPDATE creative_agenda_cards
        SET department = 'editing',
            status = 'waitlist',
            in_waitlist = true,
            casting_id = (
                SELECT casting_id 
                FROM casting_briefing_links 
                WHERE briefing_id = NEW.id 
                LIMIT 1
            )
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
            auth.jwt()->>'sub',
            'Auto-transition after briefing approval'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync briefing status changes
CREATE TRIGGER sync_briefing_card_status_trigger
    AFTER UPDATE OF status, content ON briefings
    FOR EACH ROW
    EXECUTE FUNCTION sync_briefing_card_status();