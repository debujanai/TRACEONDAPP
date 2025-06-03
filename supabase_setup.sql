-- Reset all existing tables and policies (Run in emergency situations only)
DROP TABLE IF EXISTS search_history;
DROP TABLE IF EXISTS profiles;

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  credits INT DEFAULT 100 NOT NULL,
  profile_image TEXT
);

-- Create search history table
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  search_query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  contract_address TEXT,
  search_type TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_wallet_address ON profiles(wallet_address);
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Allow public insert" ON profiles;
DROP POLICY IF EXISTS "Allow public select" ON profiles;
DROP POLICY IF EXISTS "Allow public update" ON profiles;
DROP POLICY IF EXISTS "Allow insert own search history" ON search_history;
DROP POLICY IF EXISTS "Allow select own search history" ON search_history;
DROP POLICY IF EXISTS "Allow delete own search history" ON search_history;

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

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload" ON storage.objects;

-- Create policy to allow public read access to user-uploads
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'user-uploads');

-- Create policy to allow anyone to upload to user-uploads
CREATE POLICY "Allow Upload" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'user-uploads'); 