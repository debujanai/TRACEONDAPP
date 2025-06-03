-- Create user-uploads bucket if it doesn't exist
DO $$
DECLARE 
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'user-uploads'
  ) INTO bucket_exists;
  
  IF NOT bucket_exists THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('user-uploads', 'user-uploads', true);
  END IF;
END $$;

-- Set the security definer to true for RLS policies
UPDATE storage.buckets
SET public = true
WHERE id = 'user-uploads';

-- Enable Row Level Security on the objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any) to avoid duplicates
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "User Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "User Update Access" ON storage.objects;
DROP POLICY IF EXISTS "User Delete Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload" ON storage.objects;

-- Create storage policies that allow anyone (no auth required)
-- Allow anyone to view files (most permissive)
CREATE POLICY "Public Access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-uploads');

-- Allow anyone to upload (since we're using wallet auth not Supabase auth)
CREATE POLICY "Anyone can upload"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'user-uploads');

-- Allow anyone to update their uploads
CREATE POLICY "Anyone can update"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'user-uploads');

-- Allow anyone to delete their uploads
CREATE POLICY "Anyone can delete"
ON storage.objects
FOR DELETE
USING (bucket_id = 'user-uploads');

-- Make sure RLS is turned off for development (easier for testing)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY; 