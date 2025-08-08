-- Add briefing-specific metadata fields to clients table
ALTER TABLE clients 
ADD COLUMN briefing_client_overview JSONB;

-- Note: briefing_client_brandname will use existing company_name field
-- Note: briefing_client_domain will be extracted from existing website field