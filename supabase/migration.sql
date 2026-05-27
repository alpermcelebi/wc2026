-- Supabase PostgreSQL Migration for Tournament Awards Prediction

-- 1. Create players lookup table
create table public.players (
  id text primary key,
  name text not null,
  team_id varchar(3) not null, -- Country Code (e.g. FRA, ARG, GER)
  position varchar(2) not null check (position in ('GK', 'DF', 'MF', 'FW')),
  is_young_player boolean default false not null
);

-- 2. Create user awards predictions table
create table public.user_awards_predictions (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  golden_ball text references public.players(id) on delete set null,
  golden_boot text references public.players(id) on delete set null,
  golden_glove text references public.players(id) on delete set null,
  best_young_player text references public.players(id) on delete set null,
  
  -- Fallback columns for write-in candidates (when references above are set to 'other')
  golden_ball_custom text,
  golden_boot_custom text,
  golden_glove_custom text,
  best_young_player_custom text,
  
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS)
alter table public.players enable row level security;
alter table public.user_awards_predictions enable row level security;

-- 4. Set up security policies

-- Players Lookup Policies (Public read-only)
create policy "Allow public read access to players" 
  on public.players for select 
  using (true);

-- User Awards Predictions Policies (Owner read/write access)
create policy "Allow users to read their own awards predictions" 
  on public.user_awards_predictions for select 
  using (auth.uid() = user_id);

create policy "Allow users to insert/update their own awards predictions" 
  on public.user_awards_predictions for insert 
  with check (auth.uid() = user_id);

create policy "Allow users to update their own awards predictions" 
  on public.user_awards_predictions for update 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Allow users to delete their own awards predictions" 
  on public.user_awards_predictions for delete 
  using (auth.uid() = user_id);

-- 5. Seed Mock Player Data into lookup table
insert into public.players (id, name, team_id, position, is_young_player) values
  ('other', 'Other / Write-in', '', 'FW', false),
  ('p-mbappe', 'Kylian Mbappé', 'FRA', 'FW', false),
  ('p-griezmann', 'Antoine Griezmann', 'FRA', 'FW', false),
  ('p-maignan', 'Mike Maignan', 'FRA', 'GK', false),
  ('p-zaire-emery', 'Warren Zaïre-Emery', 'FRA', 'MF', true),
  ('p-saliba', 'William Saliba', 'FRA', 'DF', false),
  ('p-messi', 'Lionel Messi', 'ARG', 'FW', false),
  ('p-martinez-l', 'Lautaro Martínez', 'ARG', 'FW', false),
  ('p-martinez-e', 'Emiliano Martínez', 'ARG', 'GK', false),
  ('p-garnacho', 'Alejandro Garnacho', 'ARG', 'FW', true),
  ('p-fernandez-e', 'Enzo Fernández', 'ARG', 'MF', false),
  ('p-vinicius', 'Vinícius Júnior', 'BRA', 'FW', false),
  ('p-rodrygo', 'Rodrygo Goes', 'BRA', 'FW', false),
  ('p-alisson', 'Alisson Becker', 'BRA', 'GK', false),
  ('p-endrick', 'Endrick Felipe', 'BRA', 'FW', true),
  ('p-guimaraes', 'Bruno Guimarães', 'BRA', 'MF', false),
  ('p-kane', 'Harry Kane', 'ENG', 'FW', false),
  ('p-bellingham', 'Jude Bellingham', 'ENG', 'MF', true),
  ('p-saka', 'Bukayo Saka', 'ENG', 'FW', false),
  ('p-mainoo', 'Kobbie Mainoo', 'ENG', 'MF', true),
  ('p-pickford', 'Jordan Pickford', 'ENG', 'GK', false),
  ('p-musiala', 'Jamal Musiala', 'GER', 'MF', true),
  ('p-wirtz', 'Florian Wirtz', 'GER', 'MF', true),
  ('p-terstegen', 'Marc-André ter Stegen', 'GER', 'GK', false),
  ('p-kimmich', 'Joshua Kimmich', 'GER', 'DF', false),
  ('p-pavlovic', 'Aleksandar Pavlović', 'GER', 'MF', true),
  ('p-yamal', 'Lamine Yamal', 'ESP', 'FW', true),
  ('p-williams', 'Nico Williams', 'ESP', 'FW', false),
  ('p-simon', 'Unai Simón', 'ESP', 'GK', false),
  ('p-gavi', 'Gavi (Pablo Martín)', 'ESP', 'MF', true),
  ('p-rodri', 'Rodri (Rodrigo Hernández)', 'ESP', 'MF', false),
  ('p-ronaldo', 'Cristiano Ronaldo', 'POR', 'FW', false),
  ('p-fernandes-b', 'Bruno Fernandes', 'POR', 'MF', false),
  ('p-costa', 'Diogo Costa', 'POR', 'GK', false),
  ('p-neves', 'João Neves', 'POR', 'MF', true),
  ('p-haaland', 'Erling Haaland', 'I', 'FW', false),
  ('p-odegaard', 'Martin Ødegaard', 'I', 'MF', false),
  ('p-vandijk', 'Virgil van Dijk', 'NED', 'DF', false),
  ('p-simons-x', 'Xavi Simons', 'NED', 'MF', false),
  ('p-verbruggen', 'Bart Verbruggen', 'NED', 'GK', false),
  ('p-debruyne', 'Kevin De Bruyne', 'BEL', 'MF', false),
  ('p-lukaku', 'Romelu Lukaku', 'BEL', 'FW', false),
  ('p-courtois', 'Thibaut Courtois', 'BEL', 'GK', false),
  ('p-guler', 'Arda Güler', 'TUR', 'MF', true),
  ('p-calhanoglu', 'Hakan Çalhanoğlu', 'TUR', 'MF', false),
  ('p-yildiz', 'Kenan Yıldız', 'TUR', 'FW', true),
  ('p-cakir', 'Uğurcan Çakır', 'TUR', 'GK', false),
  ('p-pulisic', 'Christian Pulisic', 'USA', 'FW', false),
  ('p-mckennie', 'Weston McKennie', 'USA', 'MF', false),
  ('p-turner', 'Matt Turner', 'USA', 'GK', false),
  ('p-davies', 'Alphonso Davies', 'CAN', 'DF', false),
  ('p-david', 'Jonathan David', 'CAN', 'FW', false),
  ('p-hakimi', 'Achraf Hakimi', 'MAR', 'DF', false),
  ('p-bounou', 'Yassine Bounou', 'MAR', 'GK', false),
  ('p-diaz', 'Luis Díaz', 'COL', 'FW', false),
  ('p-rodriguez-j', 'James Rodríguez', 'COL', 'MF', false),
  ('p-valverde', 'Federico Valverde', 'URU', 'MF', false),
  ('p-nunez', 'Darwin Núñez', 'URU', 'FW', false),
  ('p-son', 'Heung-min Son', 'KOR', 'FW', false),
  ('p-kim', 'Min-jae Kim', 'KOR', 'DF', false),
  ('p-salah', 'Mohamed Salah', 'EGY', 'FW', false),
  ('p-modric', 'Luka Modrić', 'CRO', 'MF', false),
  ('p-gvardiol', 'Joško Gvardiol', 'CRO', 'DF', false),
  ('p-mane', 'Sadio Mané', 'SEN', 'FW', false),
  ('p-hincapie', 'Piero Hincapié', 'ECU', 'DF', false),
  ('p-paez', 'Kendry Páez', 'ECU', 'MF', true),
  ('p-isak', 'Alexander Isak', 'SWE', 'FW', false),
  ('p-gyokeres', 'Viktor Gyökeres', 'SWE', 'FW', false)
on conflict (id) do nothing;
