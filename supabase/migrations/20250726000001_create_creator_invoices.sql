-- Create invoice status enum
CREATE TYPE invoice_status AS ENUM ('pending_payment', 'paid');

-- Create creator invoices table
CREATE TABLE creator_invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_submission_id UUID NOT NULL REFERENCES creator_submissions(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  casting_id UUID NOT NULL REFERENCES castings(id) ON DELETE CASCADE,
  
  -- Invoice details
  deal_amount DECIMAL(10,2) NOT NULL,
  invoice_pdf_url TEXT NOT NULL,
  
  -- Creator details at time of submission (snapshot)
  full_name TEXT NOT NULL,
  iban TEXT NOT NULL,
  payment_reference TEXT NOT NULL,
  
  -- Status and dates
  status invoice_status NOT NULL DEFAULT 'pending_payment',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  payment_deadline TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc', NOW()) + INTERVAL '30 days'),
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Ensure one invoice per submission
  UNIQUE(creator_submission_id)
);

-- Indexes
CREATE INDEX idx_creator_invoices_creator_id ON creator_invoices(creator_id);
CREATE INDEX idx_creator_invoices_casting_id ON creator_invoices(casting_id);
CREATE INDEX idx_creator_invoices_status ON creator_invoices(status);
CREATE INDEX idx_creator_invoices_payment_deadline ON creator_invoices(payment_deadline);

-- Enable RLS
ALTER TABLE creator_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Creators can view and create their own invoices
CREATE POLICY "Creators can view own invoices" ON creator_invoices
  FOR SELECT USING (creator_id IN (
    SELECT id FROM creators WHERE clerk_user_id = auth.uid()::text
  ));

CREATE POLICY "Creators can create own invoices" ON creator_invoices
  FOR INSERT WITH CHECK (
    creator_id IN (
      SELECT id FROM creators WHERE clerk_user_id = auth.uid()::text
    )
    AND EXISTS (
      SELECT 1 FROM creator_submissions
      WHERE id = creator_invoices.creator_submission_id
      AND creator_id = creator_invoices.creator_id
      AND submission_status = 'approved'
    )
  );

-- Social Bubble can manage all invoices
CREATE POLICY "Social Bubble can manage all invoices" ON creator_invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE clerk_user_id = auth.uid()::text 
      AND role = 'social_bubble'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_creator_invoices_updated_at BEFORE UPDATE ON creator_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();