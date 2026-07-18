-- ============================================================
-- Farm Inspection Tool - Supabase Migration
-- Run this in your Supabase SQL Editor (one statement at a time)
-- ============================================================

-- 1. Create the records table
CREATE TABLE IF NOT EXISTS inspection_tool_records (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id    text NOT NULL,
  facility_title text NOT NULL,
  inspector      text NOT NULL,
  date           date NOT NULL,
  score          integer NOT NULL DEFAULT 0,
  inspection_year integer,
  inspection_quarter text,
  data           jsonb NOT NULL DEFAULT '{}',
  photo_urls     text[] DEFAULT '{}',
  created_at     timestamptz DEFAULT now(),
  user_id        uuid DEFAULT auth.uid()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE inspection_tool_records ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies for anonymous access (matches current app behavior)
CREATE POLICY "anon_select" ON inspection_tool_records
  FOR SELECT USING (true);

CREATE POLICY "anon_insert" ON inspection_tool_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_delete" ON inspection_tool_records
  FOR DELETE USING (true);

-- 4. Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_records_facility ON inspection_tool_records (facility_id);
CREATE INDEX IF NOT EXISTS idx_records_date     ON inspection_tool_records (date DESC);

-- 5. Enable Realtime for live updates (replaces Firestore onSnapshot)
ALTER PUBLICATION supabase_realtime ADD TABLE inspection_tool_records;

-- ============================================================
-- STORAGE BUCKET SETUP
-- Create the bucket manually in Dashboard, then run the policies below.
--   Go to: Dashboard -> Storage -> New Bucket
--   Name: inspection_tool_photos
--   Public bucket: YES
--   File size limit: 5 MB (optional)
-- ============================================================

-- 6. Storage RLS policies (run AFTER creating the bucket in Dashboard)
-- Allow public read of photos
CREATE POLICY "public_read_photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'inspection_tool_photos');

-- Allow anonymous upload of photos
CREATE POLICY "anon_upload_photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'inspection_tool_photos');

-- Allow anonymous delete of photos
CREATE POLICY "anon_delete_photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'inspection_tool_photos');

-- ============================================================
-- MIGRATION FOR EXISTING DATABASES
-- Run this if your table already exists and you just want to add the new columns:
-- ============================================================
-- ALTER TABLE inspection_tool_records ADD COLUMN IF NOT EXISTS inspection_year integer;
-- ALTER TABLE inspection_tool_records ADD COLUMN IF NOT EXISTS inspection_quarter text;

