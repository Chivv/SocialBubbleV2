-- Create storage bucket for invoice PDFs
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices', 
  false,  -- Private bucket - only accessible through authenticated requests
  false,
  10485760,  -- 10MB file size limit
  ARRAY['application/pdf']::text[]  -- Only allow PDF files
);

-- Note: Storage policies need to be created through Supabase Dashboard
-- Go to Storage > invoices bucket > Policies and add:
-- 1. Creators can upload their own invoices (INSERT)
-- 2. Creators can view their own invoices (SELECT)
-- 3. Social Bubble team can view all invoices (SELECT)
-- 4. Social Bubble team can delete invoices (DELETE)