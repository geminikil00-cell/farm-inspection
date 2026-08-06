-- ============================================================
-- Farm Inspection Tool - Supabase Migration
-- Run this in your Supabase SQL Editor
-- ============================================================
-- SECURITY MODEL: No authentication required (no login).
-- Records:  SELECT + INSERT only (nobody can delete inspection data).
-- Templates: SELECT + INSERT + UPDATE + DELETE (form structures, non-sensitive).
-- Photos:   SELECT + INSERT + DELETE (user can manage attachments).
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

-- 3. RLS policies — SELECT + INSERT only (no anon DELETE/UPDATE)
CREATE POLICY "anon_select_records" ON inspection_tool_records
  FOR SELECT USING (true);

CREATE POLICY "anon_insert_records" ON inspection_tool_records
  FOR INSERT WITH CHECK (true);

-- 4. Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_records_facility ON inspection_tool_records (facility_id);
CREATE INDEX IF NOT EXISTS idx_records_date     ON inspection_tool_records (date DESC);

-- 5. Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE inspection_tool_records;

-- ============================================================
-- STORAGE BUCKET SETUP
-- Create the bucket manually in Dashboard:
--   Storage -> New Bucket -> Name: inspection_tool_photos, Public: YES
-- ============================================================

-- 6. Storage RLS policies
CREATE POLICY "public_read_photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'inspection_tool_photos');

CREATE POLICY "anon_upload_photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'inspection_tool_photos');

CREATE POLICY "anon_delete_photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'inspection_tool_photos');

-- ============================================================
-- MIGRATION FOR EXISTING DATABASES
-- Run this if your table already exists and you need new columns:
-- ============================================================
-- ALTER TABLE inspection_tool_records ADD COLUMN IF NOT EXISTS inspection_year integer;
-- ALTER TABLE inspection_tool_records ADD COLUMN IF NOT EXISTS inspection_quarter text;

-- ============================================================
-- TEMPLATE BUILDER TABLE
-- ============================================================
-- JSONB schema reference:
--   columns: [
--     { id: "criteria", header: "المعيار", type: "label" },
--     { id: "col_1",    header: "الحالة",  type: "select", options: [{ value, label, color, score }] },
--     { id: "col_2",    header: "الإجراء", type: "textarea" },
--     { id: "col_3",    header: "المسؤول", type: "textarea" }
--   ]
--   items: [{ id: "row_1", text: "نظافة المحيط", order: 0 }, ...]
CREATE TABLE IF NOT EXISTS inspection_templates (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL,
  type       text DEFAULT 'custom',
  columns    jsonb NOT NULL DEFAULT '[]',
  items      jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id    uuid DEFAULT auth.uid()
);

ALTER TABLE inspection_templates ENABLE ROW LEVEL SECURITY;

-- Templates are non-sensitive form structures — full CRUD allowed
CREATE POLICY "anon_select_templates" ON inspection_templates FOR SELECT USING (true);
CREATE POLICY "anon_insert_templates" ON inspection_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_templates" ON inspection_templates FOR UPDATE USING (true);
CREATE POLICY "anon_delete_templates" ON inspection_templates FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_templates_updated ON inspection_templates (updated_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE inspection_templates;
