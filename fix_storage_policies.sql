-- This script only fixes the storage policies
-- Use when you're getting the error about duplicate policies

-- First, drop the existing policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload" ON storage.objects;

-- Make sure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Create new policies with slightly different names to avoid conflicts
CREATE POLICY "User Uploads Public Access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'user-uploads');

CREATE POLICY "User Uploads Upload Permission" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'user-uploads'); 