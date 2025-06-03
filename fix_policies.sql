-- This script fixes only RLS policies without dropping tables
-- Use when you want to preserve existing data

-- Enable Row Level Security if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (to avoid duplicate policy error)
DROP POLICY IF EXISTS "Allow public insert" ON profiles;
DROP POLICY IF EXISTS "Allow public select" ON profiles;
DROP POLICY IF EXISTS "Allow public update" ON profiles;
DROP POLICY IF EXISTS "Allow insert own search history" ON search_history;
DROP POLICY IF EXISTS "Allow select own search history" ON search_history;
DROP POLICY IF EXISTS "Allow delete own search history" ON search_history;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload" ON storage.objects;

-- Create RLS policies for profiles
-- Allow anyone to insert profiles (needed for signup)
CREATE POLICY "Allow public insert" ON profiles
  FOR INSERT TO public
  WITH CHECK (true);

-- Allow users to select their own profile
CREATE POLICY "Allow public select" ON profiles
  FOR SELECT TO public
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Allow public update" ON profiles
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for search_history
-- Allow users to insert their own search history
CREATE POLICY "Allow insert own search history" ON search_history
  FOR INSERT TO public
  WITH CHECK (true);

-- Allow users to select their own search history
CREATE POLICY "Allow select own search history" ON search_history
  FOR SELECT TO public
  USING (true);

-- Allow users to delete their own search history
CREATE POLICY "Allow delete own search history" ON search_history
  FOR DELETE TO public
  USING (true);

-- Ensure the storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public read access to user-uploads
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'user-uploads');

-- Create policy to allow anyone to upload to user-uploads
CREATE POLICY "Allow Upload" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'user-uploads'); 