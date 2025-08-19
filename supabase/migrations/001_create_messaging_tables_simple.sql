-- Create conversations table
create table conversations (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  last_message_at timestamp with time zone default now()
);

-- Create conversation_participants table for many-to-many relationship
create table conversation_participants (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default now(),
  unique(conversation_id, user_id)
);

-- Create messages table
create table messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  message_type text default 'text' check (message_type in ('text', 'image', 'file')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  is_read boolean default false,
  metadata jsonb default '{}'::jsonb
);

-- Create indexes for better performance
create index idx_conversations_updated_at on conversations(updated_at desc);
create index idx_conversations_last_message_at on conversations(last_message_at desc);
create index idx_conversation_participants_conversation_id on conversation_participants(conversation_id);
create index idx_conversation_participants_user_id on conversation_participants(user_id);
create index idx_messages_conversation_id on messages(conversation_id);
create index idx_messages_sender_id on messages(sender_id);
create index idx_messages_created_at on messages(created_at desc);
create index idx_messages_is_read on messages(is_read);

-- Create function to update conversation's updated_at and last_message_at
create or replace function update_conversation_timestamp()
returns trigger as $$
begin
  update conversations 
  set 
    updated_at = now(),
    last_message_at = now()
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

-- Create trigger to update conversation timestamp when message is inserted
create trigger update_conversation_timestamp_trigger
  after insert on messages
  for each row
  execute function update_conversation_timestamp();

-- Enable RLS on all tables
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;

-- Simple RLS policies (allow all for development)
create policy "Allow all operations on conversations" on conversations
  for all using (true) with check (true);

create policy "Allow all operations on conversation_participants" on conversation_participants
  for all using (true) with check (true);

create policy "Allow all operations on messages" on messages
  for all using (true) with check (true);

-- Enable real-time for tables
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table conversation_participants; 