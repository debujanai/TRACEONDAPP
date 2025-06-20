# TraceOn Security Suite

A blockchain security analytics and monitoring platform with wallet authentication.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with your Supabase and Pinata credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_PINATA_API_KEY=your-pinata-api-key
NEXT_PUBLIC_PINATA_API_SECRET=your-pinata-api-secret
```

3. Create the required tables in your Supabase database:

```sql
-- Create profiles table
create table profiles (
  id uuid default uuid_generate_v4() primary key,
  wallet_address text unique not null,
  name text,
  created_at timestamp with time zone default now(),
  credits int default 100 not null,
  profile_image text
);

-- Create search history table
create table search_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  search_query text not null,
  created_at timestamp with time zone default now(),
  contract_address text,
  search_type text
);

-- Create indexes for better performance
create index idx_profiles_wallet_address on profiles(wallet_address);
create index idx_search_history_user_id on search_history(user_id);
create index idx_search_history_created_at on search_history(created_at);
```

4. Sign up for a Pinata account at [https://pinata.cloud/](https://pinata.cloud/) and get your API keys.

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- Wallet connection (supports MetaMask and other Ethereum wallets)
- User profile creation and management
- Profile image upload via Pinata IPFS
- Search history tracking
- Persistent login sessions
- Dashboard with market sentiment analysis
- Security analytics tools

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
#   t r a c e o n a i d a p p 
 
 #   P E N T D A P P S A V I O R 
 
 #   p e n t a d a p p v e r c e l 
 
 #   p e n t a d a p p v e r c e l 
 
 #   p e n t a d a p p v e r c e l 
 
 