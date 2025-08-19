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

-- Create function to get or create conversation between two users
create or replace function get_or_create_conversation(user1_id uuid, user2_id uuid)
returns uuid as $$
declare
  conversation_id uuid;
begin
  -- Try to find existing conversation between these two users
  select c.id into conversation_id
  from conversations c
  inner join conversation_participants cp1 on c.id = cp1.conversation_id
  inner join conversation_participants cp2 on c.id = cp2.conversation_id
  where cp1.user_id = user1_id 
    and cp2.user_id = user2_id
    and c.id in (
      select conversation_id 
      from conversation_participants 
      group by conversation_id 
      having count(*) = 2
    )
  limit 1;

  -- If no conversation exists, create one
  if conversation_id is null then
    insert into conversations default values returning id into conversation_id;
    
    -- Add both users as participants
    insert into conversation_participants (conversation_id, user_id) 
    values (conversation_id, user1_id), (conversation_id, user2_id);
  end if;

  return conversation_id;
end;
$$ language plpgsql;

-- Create helper function for setting config (used for RLS context)
create or replace function set_config(setting_name text, setting_value text, is_local boolean default false)
returns text as $$
begin
  perform set_config(setting_name, setting_value, is_local);
  return setting_value;
end;
$$ language plpgsql security definer;

-- Enable RLS on all tables
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;

-- RLS policies for conversations (simplified for now)
create policy "Users can view their conversations" on conversations
  for select using (true);

create policy "Users can create conversations" on conversations
  for insert with check (true);

create policy "Users can update their conversations" on conversations
  for update using (true);

-- RLS policies for conversation_participants (simplified for now)
create policy "Users can view conversation participants" on conversation_participants
  for select using (true);

create policy "Users can join conversations" on conversation_participants
  for insert with check (true);

-- RLS policies for messages (simplified for now)
create policy "Users can view messages" on messages
  for select using (true);

create policy "Users can send messages" on messages
  for insert with check (true);

create policy "Users can update messages" on messages
  for update using (true);

-- Enable real-time for messages table
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table conversation_participants; 