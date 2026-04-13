-- ============================================================
-- Supabase Blog System — Database Setup
-- Run this in the Supabase SQL editor to initialise the blogs table,
-- enable RLS, and wire up the auto-update trigger.
-- ============================================================

-- Ensure uuid-ossp extension is available (usually already enabled on Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: blogs
-- ============================================================
CREATE TABLE IF NOT EXISTS blogs (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           text NOT NULL,
  slug            text NOT NULL UNIQUE,
  content_markdown text NOT NULL,
  warnings        text[],
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  published       boolean NOT NULL DEFAULT false,
  author_id       uuid
);

-- Index on slug for fast look-ups
CREATE INDEX IF NOT EXISTS blogs_slug_idx ON blogs (slug);

-- Index on published + created_at for the public listing query
CREATE INDEX IF NOT EXISTS blogs_published_created_idx ON blogs (published, created_at DESC);

-- ============================================================
-- Trigger: auto-update updated_at on row modification
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blogs_set_updated_at ON blogs;
CREATE TRIGGER blogs_set_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Public read: only published posts
DROP POLICY IF EXISTS "Public can read published blogs" ON blogs;
CREATE POLICY "Public can read published blogs"
  ON blogs
  FOR SELECT
  USING (published = true);

-- Authenticated (admin) full access
DROP POLICY IF EXISTS "Authenticated users have full access" ON blogs;
CREATE POLICY "Authenticated users have full access"
  ON blogs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
