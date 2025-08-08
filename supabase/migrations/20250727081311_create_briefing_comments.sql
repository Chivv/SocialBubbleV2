-- Create briefing_comments table
CREATE TABLE briefing_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_role user_role NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_briefing_comments_briefing_id ON briefing_comments(briefing_id);
CREATE INDEX idx_briefing_comments_created_at ON briefing_comments(created_at);

-- Enable RLS
ALTER TABLE briefing_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Social Bubble can view all comments
CREATE POLICY "Social Bubble can view all briefing comments"
    ON briefing_comments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.clerk_user_id = auth.jwt()->>'sub'
            AND user_roles.role = 'social_bubble'
        )
    );

-- Clients can view comments on their briefings
CREATE POLICY "Clients can view comments on their briefings"
    ON briefing_comments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM briefings
            JOIN client_users ON briefings.client_id = client_users.client_id
            WHERE briefings.id = briefing_comments.briefing_id
            AND client_users.clerk_user_id = auth.jwt()->>'sub'
        )
    );

-- Social Bubble can insert comments
CREATE POLICY "Social Bubble can insert briefing comments"
    ON briefing_comments FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.jwt()->>'sub' AND
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.clerk_user_id = auth.jwt()->>'sub'
            AND user_roles.role = 'social_bubble'
        )
    );

-- Clients can insert comments on their briefings
CREATE POLICY "Clients can insert comments on their briefings"
    ON briefing_comments FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.jwt()->>'sub' AND
        EXISTS (
            SELECT 1 FROM briefings
            JOIN client_users ON briefings.client_id = client_users.client_id
            WHERE briefings.id = briefing_comments.briefing_id
            AND client_users.clerk_user_id = auth.jwt()->>'sub'
        )
    );