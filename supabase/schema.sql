-- Supabase PostgreSQL Schema for World Cup 2026 Predictor

-- 1. Create profiles table (linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create predictions table
create table public.predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id text not null,
  home_predicted_score integer not null,
  away_predicted_score integer not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicate predictions for same match by same user
  constraint unique_user_match unique(user_id, match_id)
);

-- 3. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.predictions enable row level security;

-- 4. Set up security policies

-- Profiles Policies
create policy "Allow public read access to profiles" 
  on public.profiles for select 
  using (true);

create policy "Allow users to insert their own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

create policy "Allow users to update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Predictions Policies
create policy "Allow users to read their own predictions" 
  on public.predictions for select 
  using (auth.uid() = user_id);

create policy "Allow users to insert/update their own predictions" 
  on public.predictions for insert 
  with check (auth.uid() = user_id);

create policy "Allow users to update their own predictions" 
  on public.predictions for update 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Allow users to delete their own predictions" 
  on public.predictions for delete 
  using (auth.uid() = user_id);

-- 5. Helper trigger to automatically create a profile when a new user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
