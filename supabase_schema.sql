-- ==========================================
-- SUPABASE SCHEMA SETUP FOR COMMENTS
-- ==========================================

-- 1. Create the public comments table
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  blog_id text not null,
  name text not null,
  email text not null,
  website text,
  content text not null,
  user_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS) to secure the table
alter table public.comments enable row level security;

-- 3. Policy: Allow anyone (public) to read comments
create policy "Allow public read access"
  on public.comments for select
  using (true);

-- 4. Policy: Allow anyone (anonymous or logged-in) to insert/post comments
create policy "Allow public insert access"
  on public.comments for insert
  with check (true);
