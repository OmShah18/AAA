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

-- ==========================================
-- USER REGISTRATION TRACKING (PUBLIC TABLE)
-- ==========================================

-- 5. Create a table to track all registered users publicly
create table public.registered_users (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Secure the registered_users table with RLS
alter table public.registered_users enable row level security;

-- 7. Policy: Allow admins or public to view registrations (modify if you want it private)
create policy "Allow public read access on registered users"
  on public.registered_users for select
  using (true);

-- 8. Create a trigger function to automatically log new users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.registered_users (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$;

-- 9. Attach the trigger to the internal auth.users table
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
