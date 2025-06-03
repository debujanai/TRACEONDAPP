-- Add profile_image column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Create search history table
CREATE TABLE IF NOT EXISTS search_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  search_query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contract_address TEXT,
  search_type TEXT
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_search_history_user_id
ON search_history(user_id);

-- Create index on created_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_search_history_created_at
ON search_history(created_at);

-- Create storage bucket for profile images (run this in the SQL editor)
-- Note: This may need to be created manually in the Supabase dashboard
-- under Storage if the SQL command doesn't work
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO NOTHING; 