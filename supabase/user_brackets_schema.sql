-- Supabase PostgreSQL Schema for Save & Compare Brackets

-- Create user_brackets table
create table if not exists public.user_brackets (
  id uuid default gen_random_uuid() primary key,
  bracket_code varchar(10) unique not null,
  predictions_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.user_brackets enable row level security;

-- Set up security policies

-- Allow anyone to read brackets by code (public access)
create policy "Allow public read access to user brackets" 
  on public.user_brackets for select 
  using (true);

-- Allow anyone to insert new brackets (login-free saving)
create policy "Allow public write access to user brackets" 
  on public.user_brackets for insert 
  with check (true);
