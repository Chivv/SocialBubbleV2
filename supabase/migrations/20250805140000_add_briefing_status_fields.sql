-- Add approval fields to briefings table (status already exists)
ALTER TABLE briefings 
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_briefings_status ON briefings(status);
CREATE INDEX IF NOT EXISTS idx_briefings_approved_at ON briefings(approved_at);

-- Add comment for clarity
COMMENT ON COLUMN briefings.status IS 'Status of the briefing: draft, pending_approval, approved, rejected';
COMMENT ON COLUMN briefings.approved_by IS 'Clerk user ID of the person who approved the briefing';
COMMENT ON COLUMN briefings.approved_at IS 'Timestamp when the briefing was approved';
COMMENT ON COLUMN briefings.rejected_by IS 'Clerk user ID of the person who rejected the briefing';
COMMENT ON COLUMN briefings.rejected_at IS 'Timestamp when the briefing was rejected';
COMMENT ON COLUMN briefings.rejection_reason IS 'Reason for rejection if briefing was rejected';