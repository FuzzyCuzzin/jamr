# Jamr — Database Schema

This file documents the Supabase (PostgreSQL) database tables.
Run these SQL statements in your Supabase SQL editor to create the schema.

The database is entirely managed by Supabase and is independent of the app platform
(Next.js, Expo, or anything else). All SQL here is reusable regardless of what the
app is built with.

---

## How Supabase auth works

Supabase manages users in a special `auth.users` table that you do not control directly.
When someone signs up, a row is automatically added there. We create a `profiles` table
in the public schema that mirrors it — one row per user — where we store display names,
avatars, and anything else we need.

In Expo (React Native), Supabase uses AsyncStorage to persist the session across app restarts.
There is no server client — just one browser-style client used everywhere.

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

> `invite_code` is a short random string (e.g. `a3f9b2c1`) used for joining a band
> without email invites.

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

---

### songs

The song catalog. Each song belongs to a band.

```sql
create table public.songs (
  id         uuid primary key default gen_random_uuid(),
  band_id    uuid not null references public.bands(id) on delete cascade,
  title      text not null,
  artist     text,
  key        text,     -- e.g. 'C', 'Am', 'F#'
  bpm        integer,
  status     text not null default 'learning',
             -- 'learning' | 'ready' | 'performance_ready'
  notes      text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

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

### events

Rehearsals and gigs.

```sql
create table public.events (
  id         uuid primary key default gen_random_uuid(),
  band_id    uuid not null references public.bands(id) on delete cascade,
  title      text not null,
  type       text not null default 'rehearsal',  -- 'rehearsal' | 'gig'
  date       timestamptz not null,
  location   text,
  notes      text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
```

---

## Row Level Security (RLS)

Every table must have RLS enabled. The rule: **a user can only see and modify data
for bands they belong to.**

Enable RLS on each table:

```sql
alter table public.profiles      enable row level security;
alter table public.bands         enable row level security;
alter table public.band_members  enable row level security;
alter table public.songs         enable row level security;
alter table public.setlists      enable row level security;
alter table public.setlist_songs enable row level security;
alter table public.events        enable row level security;
```

The pattern for all policies — only band members can access the data:

```sql
-- Example: only band members can view songs
create policy "Band members can view songs"
  on public.songs for select
  using (
    band_id in (
      select band_id from public.band_members
      where user_id = auth.uid()
    )
  );
```

Policies for `profiles` are simpler — users can read any profile but only edit their own:

```sql
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);
```

Write the full set of policies for each table as you build each feature step.

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

### polls

```sql
create table public.polls (
  id         uuid primary key default gen_random_uuid(),
  band_id    uuid not null references public.bands(id) on delete cascade,
  question   text not null,
  created_by uuid references public.profiles(id),
  closes_at  timestamptz,
  created_at timestamptz default now()
);
```

### poll_options

```sql
create table public.poll_options (
  id       uuid primary key default gen_random_uuid(),
  poll_id  uuid not null references public.polls(id) on delete cascade,
  label    text not null,
  position integer not null default 0
);
```

### poll_votes

```sql
create table public.poll_votes (
  id         uuid primary key default gen_random_uuid(),
  poll_id    uuid not null references public.polls(id) on delete cascade,
  option_id  uuid not null references public.poll_options(id) on delete cascade,
  user_id    uuid not null references public.profiles(id),
  created_at timestamptz default now(),
  unique(poll_id, user_id)  -- one vote per user per poll
);
```

---

## Phase 3 Tables — Rehearsal Tools

Add these when starting Phase 3. Do not create them yet.

**Add lyrics to songs (ALTER, not a new table):**

```sql
alter table public.songs add column lyrics text;
```

### rehearsal_logs

One log per event. Captures what happened at a rehearsal or gig.

```sql
create table public.rehearsal_logs (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  band_id    uuid not null references public.bands(id) on delete cascade,
  notes      text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
```

### practice_tasks

Tasks assigned to individual band members.

```sql
create table public.practice_tasks (
  id           uuid primary key default gen_random_uuid(),
  band_id      uuid not null references public.bands(id) on delete cascade,
  assigned_to  uuid references public.profiles(id),
  song_id      uuid references public.songs(id),
  description  text not null,
  completed    boolean not null default false,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz default now()
);
```

### rehearsal_recordings

Audio/video recordings stored in Supabase Storage.

```sql
create table public.rehearsal_recordings (
  id          uuid primary key default gen_random_uuid(),
  band_id     uuid not null references public.bands(id) on delete cascade,
  event_id    uuid references public.events(id),
  title       text not null,
  storage_path text not null,  -- path in Supabase Storage bucket
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now()
);
```

---

## Phase 4 Tables — Events & Promo

Add these when starting Phase 4. Do not create them yet.

### event_rsvp

Member availability per event.

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
