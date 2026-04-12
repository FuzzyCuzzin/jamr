-- ============================================================
-- Jamr — Full Schema + RLS Rebuild
-- Safe to re-run: uses IF NOT EXISTS and DROP POLICY IF EXISTS
-- Does NOT drop tables or delete any data
--
-- Run this entire file in the Supabase SQL editor to bring
-- the database schema up to date.
-- ============================================================


-- ============================================================
-- 0. Helper function (required by all band-scoped policies)
-- ============================================================

create or replace function public.get_my_band_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select band_id from public.band_members where user_id = auth.uid()
$$;


-- ============================================================
-- 1. profiles
-- ============================================================

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
drop policy if exists "Users can update own profile"   on public.profiles;

create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- 2. bands
-- ============================================================

create table if not exists public.bands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  invite_code text unique default substring(md5(random()::text), 1, 8),
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now()
);

alter table public.bands enable row level security;

drop policy if exists "Bands are publicly readable" on public.bands;
drop policy if exists "Users can create bands"      on public.bands;

create policy "Bands are publicly readable"
  on public.bands for select using (true);

create policy "Users can create bands"
  on public.bands for insert
  with check (auth.uid() = created_by);


-- ============================================================
-- 3. band_members
-- ============================================================

create table if not exists public.band_members (
  id        uuid primary key default gen_random_uuid(),
  band_id   uuid not null references public.bands(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member',
  joined_at timestamptz default now(),
  unique(band_id, user_id)
);

alter table public.band_members enable row level security;

drop policy if exists "Band members can view members" on public.band_members;
drop policy if exists "Users can join bands"          on public.band_members;

create policy "Band members can view members"
  on public.band_members for select
  using (band_id in (select public.get_my_band_ids()));

create policy "Users can join bands"
  on public.band_members for insert
  with check (auth.uid() = user_id);


-- ============================================================
-- 4. songs
-- ============================================================

create table if not exists public.songs (
  id                uuid primary key default gen_random_uuid(),
  band_id           uuid not null references public.bands(id) on delete cascade,
  title             text not null,
  artist            text,
  key               text,
  bpm               integer,
  status            text not null default 'learning',
  status_changed_at timestamptz,
  notes             text,
  created_by        uuid references public.profiles(id),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.songs add column if not exists status_changed_at timestamptz;

alter table public.songs enable row level security;

drop policy if exists "Band members can view songs"   on public.songs;
drop policy if exists "Band members can insert songs" on public.songs;
drop policy if exists "Band members can update songs" on public.songs;
drop policy if exists "Band members can delete songs" on public.songs;

create policy "Band members can view songs"
  on public.songs for select
  using (band_id in (select public.get_my_band_ids()));

create policy "Band members can insert songs"
  on public.songs for insert
  with check (band_id in (select public.get_my_band_ids()));

create policy "Band members can update songs"
  on public.songs for update
  using (band_id in (select public.get_my_band_ids()));

create policy "Band members can delete songs"
  on public.songs for delete
  using (band_id in (select public.get_my_band_ids()));


-- ============================================================
-- 5. events
-- ============================================================

create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  band_id    uuid not null references public.bands(id) on delete cascade,
  title      text not null,
  type       text not null default 'rehearsal',  -- 'rehearsal' | 'gig'
  status     text not null default 'scheduled',  -- 'scheduled' | 'completed' | 'canceled'
  date       timestamptz not null,
  location   text,
  notes      text,
  revenue    numeric,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.events add column if not exists status  text not null default 'scheduled';
alter table public.events add column if not exists revenue numeric;

alter table public.events enable row level security;

drop policy if exists "Band members can view events"   on public.events;
drop policy if exists "Band members can insert events" on public.events;
drop policy if exists "Band members can update events" on public.events;
drop policy if exists "Band members can delete events" on public.events;

create policy "Band members can view events"
  on public.events for select
  using (band_id in (select public.get_my_band_ids()));

create policy "Band members can insert events"
  on public.events for insert
  with check (band_id in (select public.get_my_band_ids()));

create policy "Band members can update events"
  on public.events for update
  using (band_id in (select public.get_my_band_ids()));

create policy "Band members can delete events"
  on public.events for delete
  using (band_id in (select public.get_my_band_ids()));


-- ============================================================
-- 6. setlists
-- ============================================================

create table if not exists public.setlists (
  id         uuid primary key default gen_random_uuid(),
  band_id    uuid not null references public.bands(id) on delete cascade,
  name       text not null,
  notes      text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.setlists enable row level security;

drop policy if exists "Band members can view setlists"   on public.setlists;
drop policy if exists "Band members can insert setlists" on public.setlists;
drop policy if exists "Band members can update setlists" on public.setlists;
drop policy if exists "Band members can delete setlists" on public.setlists;

create policy "Band members can view setlists"
  on public.setlists for select
  using (band_id in (select public.get_my_band_ids()));

create policy "Band members can insert setlists"
  on public.setlists for insert
  with check (band_id in (select public.get_my_band_ids()));

create policy "Band members can update setlists"
  on public.setlists for update
  using (band_id in (select public.get_my_band_ids()));

create policy "Band members can delete setlists"
  on public.setlists for delete
  using (band_id in (select public.get_my_band_ids()));


-- ============================================================
-- 7. setlist_songs
-- ============================================================

create table if not exists public.setlist_songs (
  id         uuid primary key default gen_random_uuid(),
  setlist_id uuid not null references public.setlists(id) on delete cascade,
  song_id    uuid not null references public.songs(id) on delete cascade,
  position   integer not null default 0,
  unique(setlist_id, song_id)
);

alter table public.setlist_songs enable row level security;

drop policy if exists "Band members can view setlist songs"   on public.setlist_songs;
drop policy if exists "Band members can insert setlist songs" on public.setlist_songs;
drop policy if exists "Band members can update setlist songs" on public.setlist_songs;
drop policy if exists "Band members can delete setlist songs" on public.setlist_songs;

create policy "Band members can view setlist songs"
  on public.setlist_songs for select
  using (setlist_id in (
    select id from public.setlists
    where band_id in (select public.get_my_band_ids())
  ));

create policy "Band members can insert setlist songs"
  on public.setlist_songs for insert
  with check (setlist_id in (
    select id from public.setlists
    where band_id in (select public.get_my_band_ids())
  ));

create policy "Band members can update setlist songs"
  on public.setlist_songs for update
  using (setlist_id in (
    select id from public.setlists
    where band_id in (select public.get_my_band_ids())
  ));

create policy "Band members can delete setlist songs"
  on public.setlist_songs for delete
  using (setlist_id in (
    select id from public.setlists
    where band_id in (select public.get_my_band_ids())
  ));


-- ============================================================
-- 8. practice_tasks
-- ============================================================

create table if not exists public.practice_tasks (
  id          uuid primary key default gen_random_uuid(),
  band_id     uuid not null references public.bands(id) on delete cascade,
  assigned_to uuid references public.profiles(id),
  song_id     uuid references public.songs(id),
  description text not null,
  completed   boolean not null default false,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now()
);

alter table public.practice_tasks enable row level security;

drop policy if exists "Band members can view tasks"   on public.practice_tasks;
drop policy if exists "Band members can insert tasks" on public.practice_tasks;
drop policy if exists "Band members can update tasks" on public.practice_tasks;
drop policy if exists "Band members can delete tasks" on public.practice_tasks;

create policy "Band members can view tasks"
  on public.practice_tasks for select
  using (band_id in (select public.get_my_band_ids()));

create policy "Band members can insert tasks"
  on public.practice_tasks for insert
  with check (band_id in (select public.get_my_band_ids()));

create policy "Band members can update tasks"
  on public.practice_tasks for update
  using (band_id in (select public.get_my_band_ids()));

create policy "Band members can delete tasks"
  on public.practice_tasks for delete
  using (band_id in (select public.get_my_band_ids()));


-- ============================================================
-- Done
-- ============================================================
