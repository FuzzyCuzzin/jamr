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

The song catalog. Each song belongs to a band. The schema is designed to support
import-first adding (from Spotify, Apple Music, YouTube) with manual entry as a fallback.

```sql
create table public.songs (
  id                uuid primary key default gen_random_uuid(),
  band_id           uuid not null references public.bands(id) on delete cascade,

  -- Core metadata
  title             text not null,
  artist            text,
  key               text,
  bpm               integer,
  duration_seconds  integer,           -- track length; used for setlist planning and sorting

  -- Status tracking
  status            text not null default 'learning',
                    -- 'learning' | 'ready' | 'performance_ready'
  status_changed_at timestamptz,       -- set whenever status changes; used for dashboard delta

  -- Setlist planning
  energy_level      text default 'medium',
                    -- 'low' | 'medium' | 'high'
                    -- helps plan setlist arc: openers, closers, cool-downs

  -- Content
  notes             text,
  artwork_url       text,              -- album art from import source; shown as thumbnail

  -- Import provenance
  source_platform   text,              -- 'spotify' | 'apple_music' | 'youtube' | 'manual'
  source_url        text,              -- original link pasted by the user
  source_track_id   text,              -- platform track/video ID for future API lookups
  imported_at       timestamptz,       -- null if added manually

  -- Authorship
  created_by        uuid references public.profiles(id),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
```

**Add new columns to existing songs table:**
```sql
-- Songs v2: richer metadata (Phase A)
alter table public.songs add column if not exists duration_seconds  integer;
alter table public.songs add column if not exists energy_level      text default 'medium';
alter table public.songs add column if not exists artwork_url       text;
alter table public.songs add column if not exists source_platform   text;
alter table public.songs add column if not exists source_url        text;
alter table public.songs add column if not exists source_track_id   text;
alter table public.songs add column if not exists imported_at       timestamptz;

-- Songs v2: ratings and lyrics (Phase 2)
alter table public.songs add column if not exists rating  integer check (rating >= 1 and rating <= 5);
alter table public.songs add column if not exists lyrics  text;
```

**Rating:** 1–5 integer. Represents how well the band performs the song. Null means unrated. Used for filtering (e.g. "only 4+ star songs") and setlist planning.

**Lyrics:** Free text. Stored per-song for in-app viewing. Future: used by performance mode (full-screen teleprompter).

**Fields deliberately left out (not needed yet):**
- `tags` — keep notes as free text for now; add a `tags text[]` column in Phase 3 if tag filtering becomes a real need
- `normalized_title` / `normalized_artist` — not needed until duplicate detection at import time (Phase 3+)
- A separate `song_imports` table — overkill; provenance fields inline on songs are sufficient

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

**Energy level values:** `low` | `medium` | `high`
- `low` — ballad, cool-down, slow song
- `medium` — mid-tempo, crowd-warmer
- `high` — opener, closer, high-energy crowd moment

Status: **already created. Run the ALTER TABLE statements above to add new columns.**

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

**Add new columns to existing events table (Phase 2):**
```sql
alter table public.events add column if not exists end_time             timestamptz;
alter table public.events add column if not exists setlist_id           uuid references public.setlists(id);
alter table public.events add column if not exists number_of_sets       integer;
alter table public.events add column if not exists set_duration_minutes integer;
alter table public.events add column if not exists break_duration_minutes integer;
```

- `end_time` — used to display event duration and to plan schedules
- `setlist_id` — links a gig or rehearsal to the setlist being played
- `number_of_sets`, `set_duration_minutes`, `break_duration_minutes` — gig-specific structure fields; mirrors what's on the setlist but can be set independently

Status: **already created. Add status and revenue columns.**

---

### setlists

A named list of songs for a show or rehearsal.

```sql
create table public.setlists (
  id                    uuid primary key default gen_random_uuid(),
  band_id               uuid not null references public.bands(id) on delete cascade,
  name                  text not null,
  notes                 text,
  number_of_sets        integer default 1,         -- how many sets in this show (1–10)
  set_duration_minutes  integer,                   -- target length per set in minutes
  break_duration_minutes integer,                  -- break between sets in minutes
  created_by            uuid references public.profiles(id),
  created_at            timestamptz default now()
);
```

**Add new columns to existing setlists table:**
```sql
alter table public.setlists add column if not exists number_of_sets         integer default 1;
alter table public.setlists add column if not exists set_duration_minutes   integer;
alter table public.setlists add column if not exists break_duration_minutes integer;
```

---

### setlist_songs

The songs inside a setlist, with their order and set assignment.

```sql
create table public.setlist_songs (
  id         uuid primary key default gen_random_uuid(),
  setlist_id uuid not null references public.setlists(id) on delete cascade,
  song_id    uuid not null references public.songs(id) on delete cascade,
  position   integer not null default 0,   -- order within the full setlist
  set_number integer not null default 1,   -- which set this song belongs to (1, 2, 3…)
  unique(setlist_id, song_id)
);
```

**Add set_number to existing setlist_songs table:**
```sql
alter table public.setlist_songs add column if not exists set_number integer not null default 1;
```

> `position` starts at 0. `set_number` starts at 1. When reordering, update all affected positions in a single transaction.

---

### practice_tasks

Tasks assigned to individual band members. Used by the dashboard checklist widget.
In Phase 2, tasks are primarily created from rehearsal outcomes and linked back to
the rehearsal and song they came from.

**Two task levels — distinguished by whether `song_id` is set:**
- **Song-level task**: `song_id` is set — linked to a specific song (and usually a rehearsal).
  Shown in the checklist with the song name as a subtitle.
- **Rehearsal-level task**: `song_id` is null — general task for the whole session.
  Shown with no song subtitle; may still be linked to a rehearsal via `rehearsal_id`.

```sql
create table public.practice_tasks (
  id            uuid primary key default gen_random_uuid(),
  band_id       uuid not null references public.bands(id) on delete cascade,
  assigned_to   uuid references public.profiles(id),   -- null = unassigned / visible to all
  song_id       uuid references public.songs(id),       -- null = rehearsal-level task
  rehearsal_id  uuid references public.events(id),      -- null = manually created (not from rehearsal)
  description   text not null,
  due_date      date,                                    -- optional soft deadline
  completed     boolean not null default false,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz default now()
);
```

**Add new columns to existing practice_tasks table (Phase 2):**
```sql
alter table public.practice_tasks add column if not exists rehearsal_id uuid references public.events(id);
alter table public.practice_tasks add column if not exists due_date     date;
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

**Dashboard query — my tasks (with song and rehearsal context):**
```sql
select
  pt.id,
  pt.description,
  pt.completed,
  pt.due_date,
  pt.rehearsal_id,
  s.title as song_title,
  e.date  as rehearsal_date
from public.practice_tasks pt
left join public.songs  s on s.id = pt.song_id
left join public.events e on e.id = pt.rehearsal_id
where pt.band_id = $band_id
  and (pt.assigned_to = auth.uid() or pt.assigned_to is null)
order by pt.completed asc, pt.created_at asc;
```

**Rehearsal query — tasks created from a specific rehearsal:**
```sql
select
  pt.id,
  pt.description,
  pt.completed,
  pt.assigned_to,
  p.display_name as assigned_name,
  s.title        as song_title
from public.practice_tasks pt
left join public.profiles p on p.id = pt.assigned_to
left join public.songs    s on s.id = pt.song_id
where pt.rehearsal_id = $rehearsal_event_id
order by pt.song_id nulls last, pt.created_at asc;
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

## Phase 2 Tables — Enhanced Features

Add these when starting Phase 2. Do not create them yet.

### rehearsal_songs

Songs practiced at a specific rehearsal. Only used for events with `type = 'rehearsal'`.

This is the richer replacement for the simpler `event_songs` concept. It adds per-song
notes and a practiced flag, which are needed for the Rehearsal Detail workflow.

- `notes` — free text captured during the rehearsal for that song.
  (e.g. "Still struggling with verse 2 key change", "Solo sounded great tonight")
- `practiced` — whether the band actually ran through this song during the session.
  False means it was planned but skipped.
- `position` — the order songs are displayed in the rehearsal (matches planned setlist order
  or the order they were added).

```sql
create table public.rehearsal_songs (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  song_id    uuid not null references public.songs(id) on delete cascade,
  notes      text,                           -- per-song notes captured during rehearsal
  practiced  boolean not null default false, -- was this song actually run through?
  position   integer not null default 0,     -- display order within the rehearsal
  created_at timestamptz default now(),
  unique(event_id, song_id)
);

alter table public.rehearsal_songs enable row level security;

-- RLS: scoped through the event's band_id
create policy "Band members can view rehearsal songs"
  on public.rehearsal_songs for select
  using (event_id in (
    select id from public.events
    where band_id in (select public.get_my_band_ids())
  ));

create policy "Band members can insert rehearsal songs"
  on public.rehearsal_songs for insert
  with check (event_id in (
    select id from public.events
    where band_id in (select public.get_my_band_ids())
  ));

create policy "Band members can update rehearsal songs"
  on public.rehearsal_songs for update
  using (event_id in (
    select id from public.events
    where band_id in (select public.get_my_band_ids())
  ));

create policy "Band members can delete rehearsal songs"
  on public.rehearsal_songs for delete
  using (event_id in (
    select id from public.events
    where band_id in (select public.get_my_band_ids())
  ));
```

**Rehearsal Detail query — songs with notes and task counts:**
```sql
select
  rs.id,
  rs.song_id,
  rs.notes,
  rs.practiced,
  rs.position,
  s.title,
  s.artist,
  count(pt.id) as task_count
from public.rehearsal_songs rs
join  public.songs s on s.id = rs.song_id
left join public.practice_tasks pt
  on pt.song_id = rs.song_id
  and pt.rehearsal_id = rs.event_id
where rs.event_id = $event_id
group by rs.id, rs.song_id, rs.notes, rs.practiced, rs.position, s.title, s.artist
order by rs.position asc;
```

---

### event_rsvp

Per-member RSVP status for each event. A row is created automatically for each band member when an event is created.

```sql
create table public.event_rsvp (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'pending',  -- 'yes' | 'no' | 'maybe' | 'pending'
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(event_id, user_id)
);

alter table public.event_rsvp enable row level security;

-- All band members can see RSVPs for their band's events
create policy "Band members can view RSVPs"
  on public.event_rsvp for select
  using (event_id in (
    select id from public.events
    where band_id in (select public.get_my_band_ids())
  ));

-- Users can only insert their own RSVP
create policy "Users can insert own RSVP"
  on public.event_rsvp for insert
  with check (auth.uid() = user_id);

-- Users can only update their own RSVP
create policy "Users can update own RSVP"
  on public.event_rsvp for update
  using (auth.uid() = user_id);
```

**RSVP query — summary for an event:**
```sql
select
  status,
  count(*) as count
from public.event_rsvp
where event_id = $event_id
group by status;
```

---

### user_availability

Dates a user is unavailable. Used to help schedule events without conflicts.

```sql
create table public.user_availability (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  date       date not null,
  available  boolean not null default false,  -- false = blocked/unavailable
  notes      text,
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.user_availability enable row level security;

-- Users can view their own availability; band members can view others'
create policy "Users can view own availability"
  on public.user_availability for select
  using (auth.uid() = user_id);

create policy "Users can manage own availability"
  on public.user_availability for insert
  with check (auth.uid() = user_id);

create policy "Users can update own availability"
  on public.user_availability for update
  using (auth.uid() = user_id);

create policy "Users can delete own availability"
  on public.user_availability for delete
  using (auth.uid() = user_id);
```

**Availability query — who is unavailable on a given date:**
```sql
select ua.user_id, p.display_name
from public.user_availability ua
join public.profiles p on p.id = ua.user_id
join public.band_members bm on bm.user_id = ua.user_id
where bm.band_id = $band_id
  and ua.date = $date
  and ua.available = false;
```

---

## Phase 3 Tables — Communication

Add these when starting Phase 3. Do not create them yet.

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

The main rehearsal data (`rehearsal_songs`, per-song notes, practice tasks) is handled
by tables added in Phase 2. Phase 3 adds recordings support only.

```sql
-- Lyrics (alter existing table, if not already added in Songs v2)
alter table public.songs add column if not exists lyrics text;

-- Rehearsal recordings: audio/video files stored in Supabase Storage
-- Each recording is linked to a rehearsal event and optionally a song
create table public.rehearsal_recordings (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  band_id    uuid not null references public.bands(id) on delete cascade,
  song_id    uuid references public.songs(id),   -- null = whole-session recording
  file_url   text not null,                       -- Supabase Storage URL
  label      text,                                -- optional label ("Full run-through", "Bridge section")
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
```

> Note: `rehearsal_logs` (a simple notes table) has been removed from the plan.
> Overall rehearsal notes are stored directly on the `events.notes` column.
> Per-song notes are stored on `rehearsal_songs.notes`.
> Practice tasks from the rehearsal are in `practice_tasks` with `rehearsal_id` set.

---

## Phase 4 Tables — Promo & Media

Add these when starting Phase 4. Do not create them yet.

> Note: `event_rsvp` is defined in Phase 2 (see above). No additional tables are needed
> for Phase 4 beyond Storage-based media uploads handled by `rehearsal_recordings` (Phase 3)
> and a future `media_assets` table for band photos and press kit files.
