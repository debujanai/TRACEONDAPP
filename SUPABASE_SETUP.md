# Supabase Database Setup Guide

This guide will help you set up your Supabase database correctly for the TraceOn app.

## 1. Prerequisites

- You need a Supabase account. Sign up at [https://supabase.io](https://supabase.io) if you don't have one.
- Create a new project in Supabase.

## 2. Getting Your API Keys

1. Go to your Supabase project dashboard.
2. Click on the gear icon (⚙️) in the sidebar, then select "API".
3. Under "Project API keys", copy the following:
   - **URL**: Your project URL (e.g., `https://abcdefghijklm.supabase.co`)
   - **anon public**: Your anonymous key (used for public operations)

## 3. Environment Variables

1. Create or update your `.env.local` file in the root of your project with the following:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_PINATA_API_KEY=your-pinata-api-key
NEXT_PUBLIC_PINATA_API_SECRET=your-pinata-api-secret
```

2. Replace the placeholders with your actual values.

## 4. Database Setup

You can set up your database tables in two ways:

### Option 1: Using the SQL Editor

1. Go to your Supabase dashboard.
2. Click on "SQL Editor" in the sidebar.
3. Create a new query.
4. Copy the entire contents of the `supabase_setup.sql` file.
5. Run the query.

### Option 2: Running Each Command Manually

If you prefer to set up your database step by step:

1. Go to "Table Editor" in your Supabase dashboard.
2. Create the `profiles` table first:
   - Click "Create a new table".
   - Name it "profiles".
   - Add the following columns:
     - `id` (type: uuid, primary key, default: `uuid_generate_v4()`)
     - `wallet_address` (type: text, unique, not null)
     - `name` (type: text)
     - `created_at` (type: timestamptz, default: `now()`)
     - `credits` (type: int, default: 100, not null)
     - `profile_image` (type: text)

3. Create the `search_history` table:
   - Click "Create a new table".
   - Name it "search_history".
   - Add the following columns:
     - `id` (type: uuid, primary key, default: `uuid_generate_v4()`)
     - `user_id` (type: uuid, references: profiles.id, not null)
     - `search_query` (type: text, not null)
     - `created_at` (type: timestamptz, default: `now()`)
     - `contract_address` (type: text)
     - `search_type` (type: text)

## 5. RLS Policies (Row Level Security)

For security, you need to set up RLS policies:

1. Go to "Authentication" → "Policies" in your Supabase dashboard.
2. Select the "profiles" table.
3. Enable RLS by toggling the button (if not already enabled).
4. Add the following policies:
   - **Name**: "Allow public insert"
     - Operation: INSERT
     - USING expression: `true`
     - Check expression: `true`
   - **Name**: "Allow public select"
     - Operation: SELECT
     - USING expression: `true`
   - **Name**: "Allow public update"
     - Operation: UPDATE
     - USING expression: `true`
     - Check expression: `true`

5. Select the "search_history" table.
6. Enable RLS by toggling the button (if not already enabled).
7. Add the following policies:
   - **Name**: "Allow insert own search history"
     - Operation: INSERT
     - Check expression: `true`
   - **Name**: "Allow select own search history"
     - Operation: SELECT
     - USING expression: `true`
   - **Name**: "Allow delete own search history"
     - Operation: DELETE
     - USING expression: `true`

## 6. Storage Setup

1. Go to "Storage" in your Supabase dashboard.
2. Create a new bucket named "user-uploads".
3. Set the bucket to "Public".
4. Create two policies for this bucket:
   - **Name**: "Public Access"
     - Operation: SELECT
     - USING expression: `bucket_id = 'user-uploads'`
   - **Name**: "Allow Upload"
     - Operation: INSERT
     - Check expression: `bucket_id = 'user-uploads'`

## 7. Testing Your Setup

1. Restart your application.
2. The app should now be able to connect to Supabase.
3. Try the following operations to test your setup:
   - Create a new account (connects wallet)
   - Update profile information
   - Upload a profile image
   - Check the search history

## Troubleshooting

If you encounter issues:

1. **Check your console for errors** - Look for specific error messages.
2. **Verify environment variables** - Make sure they're properly set.
3. **Check network requests** - Inspect the network tab for failed requests.
4. **Database logs** - Check the SQL query logs in Supabase.
5. **Common issues**:
   - RLS policies blocking operations
   - Missing or incorrect environment variables
   - Storage bucket permissions
   - Cross-origin (CORS) issues

If you need to start from scratch, you can run the "Reset all existing tables" section of the SQL script to drop and recreate all tables. 