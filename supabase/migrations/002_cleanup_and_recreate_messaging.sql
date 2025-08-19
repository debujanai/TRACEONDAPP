-- Clean up existing messaging tables
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Drop any existing functions
DROP FUNCTION IF EXISTS update_conversation_timestamp() CASCADE;
DROP FUNCTION IF EXISTS get_or_create_conversation(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS set_config(text, text, boolean) CASCADE;

-- Remove from real-time publication (if they exist)
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS messages;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS conversations;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS conversation_participants;

-- Now create the new simplified tables

-- Create conversations table
CREATE TABLE conversations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_message_at timestamp with time zone DEFAULT now()
);

-- Create conversation_participants table for many-to-many relationship
CREATE TABLE conversation_participants (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Create function to update conversation's updated_at and last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS trigger AS $$
BEGIN
  UPDATE conversations 
  SET 
    updated_at = now(),
    last_message_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update conversation timestamp when message is inserted
CREATE TRIGGER update_conversation_timestamp_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies (allow all for development)
CREATE POLICY "Allow all operations on conversations" ON conversations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on conversation_participants" ON conversation_participants
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on messages" ON messages
  FOR ALL USING (true) WITH CHECK (true);

-- Enable real-time for tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants; 