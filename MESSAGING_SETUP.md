# Real-Time Messaging Setup Guide

This guide will help you set up the real-time messaging system for your TraceOn app.

## Prerequisites

1. Make sure you have Supabase set up as described in `SUPABASE_SETUP.md`
2. Your existing `profiles` table should be working
3. Real-time features should be enabled in your Supabase project

## Database Setup

### Step 1: Run the Migration

1. Go to your Supabase dashboard
2. Navigate to "SQL Editor"
3. Create a new query
4. Copy the entire contents of `supabase/migrations/001_create_messaging_tables.sql`
5. Run the query

This will create:
- `conversations` table
- `conversation_participants` table (many-to-many relationship)
- `messages` table
- Necessary indexes for performance
- RLS policies for security
- Real-time subscriptions
- Helper functions

### Step 2: Enable Real-time (if not already enabled)

1. In your Supabase dashboard, go to "Database" → "Replication"
2. Make sure the following tables are enabled for real-time:
   - `messages`
   - `conversations`
   - `conversation_participants`

If they're not listed, add them by clicking "Add table" and selecting each table.

### Step 3: Test the Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Connect your wallet in the app
3. Navigate to the Messages page
4. Try searching for users and starting conversations

## Features

The messaging system includes:

### Real-time Features
- ✅ Instant message delivery (no polling)
- ✅ Real-time conversation updates
- ✅ Unread message counts
- ✅ Message read status

### User Experience
- ✅ Search users by wallet address or name
- ✅ Start new conversations
- ✅ Message history
- ✅ Responsive design
- ✅ Loading states

### Technical Features
- ✅ Supabase real-time subscriptions
- ✅ Row Level Security (RLS)
- ✅ Optimized database queries
- ✅ TypeScript support
- ✅ Error handling

## How It Works

### Database Structure

1. **conversations**: Stores conversation metadata
2. **conversation_participants**: Links users to conversations (many-to-many)
3. **messages**: Stores individual messages

### Real-time Flow

1. User sends a message → inserted into `messages` table
2. Supabase real-time triggers → notifies all subscribers
3. Recipients receive message instantly via WebSocket
4. UI updates automatically

### User Discovery

Users can find each other by:
- Exact wallet address
- Partial wallet address
- User name

## Troubleshooting

### Common Issues

**Messages not appearing in real-time:**
- Check if real-time is enabled for the `messages` table in Supabase
- Verify your Supabase URL and anon key in `.env.local`
- Check browser console for WebSocket connection errors

**Can't find users:**
- Make sure the user has a profile in the `profiles` table
- Check that the search query is at least 3 characters

**Database errors:**
- Verify the migration was run successfully
- Check Supabase logs in the dashboard

**RLS policy issues:**
- For development, the policies are simplified
- In production, you may want to implement stricter policies

### Development Tips

1. **Monitor real-time connections:**
   - Open browser dev tools → Network tab
   - Look for WebSocket connections to Supabase

2. **Debug database queries:**
   - Check Supabase dashboard → Logs
   - Enable SQL logging if needed

3. **Test with multiple browser tabs:**
   - Open multiple tabs with different wallets
   - Test message delivery between them

## Next Steps

You can enhance the messaging system by adding:

1. **File/Image sharing**
2. **Message reactions**
3. **Typing indicators**
4. **Online presence**
5. **Message encryption**
6. **Push notifications**
7. **Group chats**

## Production Considerations

Before deploying to production:

1. **Implement stricter RLS policies**
2. **Add rate limiting**
3. **Implement message moderation**
4. **Add backup/archiving**
5. **Monitor performance and costs**
6. **Set up proper error tracking**

The current setup is perfect for testing and development. The real-time messaging will work instantly without any polling! 

## Messaging Non-Platform Users

The messaging system now supports sending messages to wallet addresses that haven't joined the platform yet. Here's how it works:

### Feature Overview

1. **Placeholder Profiles**: When you message a wallet address that doesn't exist in the platform, the system automatically creates a "placeholder profile" for them
2. **Message Storage**: All messages are stored normally in the conversation, just like with regular users
3. **Automatic Upgrade**: When the recipient eventually connects their wallet to the platform, their placeholder profile is automatically upgraded to a full profile
4. **Message Delivery**: The recipient will see all messages that were sent to their wallet address when they join

### How to Message Non-Platform Users

1. **Direct Wallet Address**: In the "Start New Conversation" modal, you can enter any valid Ethereum wallet address (0x...)
2. **Visual Indicators**: Non-platform users are marked with:
   - 📧 Orange badge icon
   - "Not on platform" or "Not joined" label
   - Orange text indicating message delivery status

### Technical Implementation

- **Placeholder Detection**: Users with `credits: 0` are considered placeholder profiles
- **Automatic Upgrade**: When a placeholder user connects their wallet via `getOrCreateProfile()`, they receive:
  - Updated name: "User" (instead of truncated address)
  - Credits: 100 (instead of 0)
  - All existing messages remain intact

### Database Schema

No additional tables needed! The feature uses the existing:
- `profiles` table (for placeholder profiles)
- `conversations` table (normal conversations)
- `messages` table (normal messages)
- `conversation_participants` table (normal participants)

### User Experience

**For Senders:**
- Can message any wallet address immediately
- Clear visual indicators show message status
- Normal chat experience

**For Recipients:**
- Messages appear when they join the platform
- Seamless transition from placeholder to real user
- No data loss or message history issues 