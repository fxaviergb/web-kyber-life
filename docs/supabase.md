# KyberLife Supabase Integration

This guide explains how to configure and run KyberLife with Supabase as the backend.

## 1. Prerequisites

- A Supabase Project created at [supabase.com](https://supabase.com).
- **CRITICAL**: The project must be named "KyberLife" (to avoid confusion with other environments).

## 2. Environment Configuration

1. Copy `.env` or edit it directly.
2. Set `DATA_SOURCE=SUPABASE`.
3. Fill in your Supabase credentials:

```env
DATA_SOURCE=SUPABASE

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Note**: `SUPABASE_SERVICE_ROLE_KEY` is not currently used by the client-side code but may be needed for admin scripts or strict RLS bypass if implemented in the future.

## 3. Database Schema Migration

Navigate to your Supabase Dashboard -> SQL Editor and run the migration found in:

`supabase/migrations/20260201000000_initial_schema.sql`

This script will:
- Enable the UUID extension.
- Create all necessary tables (`profiles`, `market_purchases`, `market_products`, etc.).
- Setup Row Level Security (RLS) policies.
- **Configure Auth Trigger**: Automatically creates a `profiles` entry when a user signs up.

## 4. Authentication

The project now uses **Supabase Auth** natively.

- **Sign Up**: Creates a user in `auth.users` and a profile in `public.profiles`.
- **Sign In**: Standard email/password login.
- **Forgot Password**: Triggers Supabase recovery email.

## 5. Testing the Integration

### Manual Test
1. Set `DATA_SOURCE=SUPABASE` in your local `.env`.
2. Restart the dev server: `npm run dev`.
3. Go to `/auth/register` and create an account.
4. Check your Supabase "Table Editor" -> `profiles` table to see the new user.
5. Go to the Market section and create a shopping list.
6. Check `market_templates` table in Supabase.

### Verify Script (Optional)
A verification script is available (requires `ts-node` or execution via Next.js api route if added):
*(See implementation details in project)*

## 6. Project Structure Changes

- **Entities**: Mapped to tables in `src/domain/entities`.
- **Repositories**: 
  - Interfaces in `src/domain/repositories`.
  - Supabase Implementations in `src/infrastructure/repositories/supabase`.
  - In-Memory Implementations in `src/infrastructure/repositories/implementations` (still available for testing).
- **Container**: `src/infrastructure/container.ts` selects the repository implementation based on `DATA_SOURCE`.

## 7. Troubleshooting

- **"Database connection error"**: Check your `.env` variables.
- **"RLS policy violation"**: Ensure you are logged in. The RLS rules generally require `auth.uid() = owner_user_id`.
