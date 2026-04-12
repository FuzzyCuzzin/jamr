# Jamr — Database Schema

This file documents the Supabase (PostgreSQL) database tables.
Run these SQL statements in your Supabase SQL editor to create the schema.

---

## How Supabase auth works

Supabase manages users in a special `auth.users` table that you do not control directly.
When someone signs up, a row is automatically added there. We create a `profiles` table
in the public schema that mirrors it — one row per user — where we store display names,
avatars, and anything else we need.

In Expo (React Native), Supabase uses AsyncStorage to persist the session across app restarts.
There is no server client — just one browser-style client used everywhere.

---

## RLS helper function

Every table policy uses this function instead of querying `band_members` directly.
This avoids infinite recursion in self-referential RLS policies.

```sql
create or replace function public.get_my_band_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select band_id from public.band_members where user_id = auth.uid()
$$;
```

**Use this in every policy that checks band membership:**
```sql
-- Pattern used everywhere
using (band_id in (select public.get_my_band_ids()))
```

---

## Phase 1 Tables

### profiles

Stores public user data. Created automatically when a user signs up (via a database trigger).

```sql
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now()
);
```

**Trigger to auto-create a profile on signup:**

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

Status: **already created in Supabase.**

---

### bands

One row per band.

```sql
create table public.bands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  invite_code text unique default substring(md5(random()::text), 1, 8),
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now()
);
```

Status: **already created in Supabase.**

---

### band_members

Links users to bands. A user can belong to multiple bands (one in the MVP, many later).

```sql
create table public.band_members (
  id        uuid primary key default gen_random_uuid(),
  band_id   uuid not null references public.bands(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member',  -- 'admin' | 'member'
  joined_at timestamptz default now(),
  unique(band_id, user_id)
);
```

Status: **already created in Supabase.**

---

### songs

The song catalog. Each song belongs to a band.

```sql
create table public.songs (
  id                uuid primary key default gen_random_uuid(),
  band_id           uuid not null references public.bands(id) on delete cascade,
  title             text not null,
  artist            text,
  key               text,
  bpm               integer,
  status            text not null default 'learning',
                    -- 'learning' | 'ready' | 'performance_ready'
  status_changed_at timestamptz,  -- set whenever status is updated; used for "songs learned this week"
  notes             text,
  created_by        uuid references public.profiles(id),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
```

**Add `status_changed_at` to existing table:**
```sql
alter table public.songs add column if not exists status_changed_at timestamptz;
```

**Dashboard query — songs learned (ready or better), with weekly delta:**
```sql
select
  count(*) as total,
  count(*) filter (
    where status_changed_at >= now() - interval '7 days'
  ) as this_week
from public.songs
where band_id = $band_id
  and status in ('ready', 'performance_ready');
```

> The app must set `status_changed_at = now()` whenever it updates the `status` field.

Status: **already created. Add status_changed_at column.**

---

### events

Rehearsals and gigs.

```sql
create table public.events (
  id         uuid primary key default gen_random_uuid(),
  band_id    uuid not null references public.bands(id) on delete cascade,
  title      text not null,
  type       text not null default 'rehearsal',  -- 'rehearsal' | 'gig'
  status     text not null default 'scheduled',  -- 'scheduled' | 'completed' | 'canceled'
  date       timestamptz not null,
  location   text,
  notes      text,
  revenue    numeric,     -- optional; gig earnings in dollars; null if not tracked
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
```

**Add new columns to existing table:**
```sql
alter table public.events add column if not exists status text not null default 'scheduled';
alter table public.events add column if not exists revenue numeric;
```

**Dashboard query — earnings this month:**
```sql
select coalesce(sum(revenue), 0) as earnings_this_month
from public.events
where band_id = $band_id
  and type = 'gig'
  and status = 'completed'
  and date >= date_trunc('month', now())
  and date <  date_trunc('month', now()) + interval '1 month';
```

**Dashboard query — gigs played all time:**
```sql
select count(*) as gigs_played
from public.events
where band_id = $band_id
  and type = 'gig'
  and status = 'completed';
```

**Dashboard query — next gig:**
```sql
select id, title, date, location
from public.events
where band_id = $band_id
  and type = 'gig'
  and status = 'scheduled'
  and date >= now()
order by date asc
limit 1;
```

**Dashboard query — next rehearsal:**
```sql
select id, title, date, location
from public.events
where band_id = $band_id
  and type = 'rehearsal'
  and status = 'scheduled'
  and date >= now()
order by date asc
limit 1;
```

Status: **already created. Add status and revenue columns.**

---

### setlists

A named list of songs for a show or rehearsal.

```sql
create table public.setlists (
  id         uuid primary key default gen_random_uuid(),
  band_id    uuid not null references public.bands(id) on delete cascade,
  name       text not null,
  notes      text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
```

---

### setlist_songs

The songs inside a setlist, with their order.

```sql
create table public.setlist_songs (
  id         uuid primary key default gen_random_uuid(),
  setlist_id uuid not null references public.setlists(id) on delete cascade,
  song_id    uuid not null references public.songs(id) on delete cascade,
  position   integer not null default 0,
  unique(setlist_id, song_id)
);
```

> `position` starts at 0. When reordering, update all affected positions in a single transaction.

---

### practice_tasks

Tasks assigned to individual band members. Used by the dashboard checklist widget.

```sql
create table public.practice_tasks (
  id          uuid primary key default gen_random_uuid(),
  band_id     uuid not null references public.bands(id) on delete cascade,
  assigned_to uuid references public.profiles(id),  -- null = unassigned / whole band
  song_id     uuid references public.songs(id),      -- optional song link
  description text not null,
  completed   boolean not null default false,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now()
);
```

**RLS policies:**
```sql
alter table public.practice_tasks enable row level security;

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
```

**Dashboard query — my tasks:**
```sql
select id, description, completed, song_id
from public.practice_tasks
where band_id = $band_id
  and (assigned_to = auth.uid() or assigned_to is null)
order by completed asc, created_at asc;
```

---

## Dashboard query — band members with display names

```sql
select bm.user_id, bm.role, p.display_name, p.avatar_url
from public.band_members bm
join public.profiles p on p.id = bm.user_id
where bm.band_id = $band_id
order by bm.joined_at asc;
```

---

## Row Level Security (RLS)

Every table must have RLS enabled. The pattern for all band-scoped tables:

```sql
-- Enable RLS
alter table public.<table> enable row level security;

-- Select: band members only
create policy "Band members can view <table>"
  on public.<table> for select
  using (band_id in (select public.get_my_band_ids()));

-- Insert: band members only
create policy "Band members can insert <table>"
  on public.<table> for insert
  with check (band_id in (select public.get_my_band_ids()));

-- Update: band members only
create policy "Band members can update <table>"
  on public.<table> for update
  using (band_id in (select public.get_my_band_ids()));

-- Delete: band members only
create policy "Band members can delete <table>"
  on public.<table> for delete
  using (band_id in (select public.get_my_band_ids()));
```

---

## Phase 2 Tables — Communication

Add these when starting Phase 2. Do not create them yet.

### messages

```sql
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  band_id    uuid not null references public.bands(id) on delete cascade,
  user_id    uuid not null references public.profiles(id),
  content    text not null,
  created_at timestamptz default now()
);
```

### polls / poll_options / poll_votes

```sql
create table public.polls (
  id         uuid primary key default gen_random_uuid(),
  band_id    uuid not null references public.bands(id) on delete cascade,
  question   text not null,
  created_by uuid references public.profiles(id),
  closes_at  timestamptz,
  created_at timestamptz default now()
);

create table public.poll_options (
  id       uuid primary key default gen_random_uuid(),
  poll_id  uuid not null references public.polls(id) on delete cascade,
  label    text not null,
  position integer not null default 0
);

create table public.poll_votes (
  id        uuid primary key default gen_random_uuid(),
  poll_id   uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id   uuid not null references public.profiles(id),
  created_at timestamptz default now(),
  unique(poll_id, user_id)
);
```

---

## Phase 3 Tables — Rehearsal Tools

Add these when starting Phase 3. Do not create them yet.

```sql
-- Lyrics (alter existing table)
alter table public.songs add column lyrics text;

create table public.rehearsal_logs (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  band_id    uuid not null references public.bands(id) on delete cascade,
  notes      text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
```

---

## Phase 4 Tables — Events & Promo

Add these when starting Phase 4. Do not create them yet.

```sql
create table public.event_rsvp (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'pending',  -- 'yes' | 'no' | 'maybe' | 'pending'
  created_at timestamptz default now(),
  unique(event_id, user_id)
);
```
