# Jamr — Implementation Tasks

Work through these steps in order. Complete each step before moving to the next.
Mark tasks with [x] as you finish them.

---

## Step 0 — Project Scaffold ✓

- [x] Rename `.env.local` → `.env`, update key prefixes to `EXPO_PUBLIC_`
- [x] Delete Next.js scaffold (`src/`, `next.config.ts`, `node_modules/`, `public/`, `.next/`)
- [x] Run `npx create-expo-app@latest .`
- [x] Install `@supabase/supabase-js` and `@react-native-async-storage/async-storage`
- [x] Create `lib/supabase.ts` with AsyncStorage session persistence
- [x] Verify app opens on iOS simulator
- [x] Update `AGENTS.md` to reflect Expo Router conventions
- [x] Commit: `chore: scaffold Expo + Expo Router, replace Next.js`

---

## Step 1 — Authentication ✓

- [x] Verify `profiles` table and `handle_new_user` trigger exist in Supabase
- [x] Create `app/_layout.tsx` — root layout with auth gate
- [x] Create `app/(auth)/_layout.tsx`
- [x] Create `app/(auth)/login.tsx` — email + password sign in
- [x] Create `app/(auth)/signup.tsx` — display name + email + password
- [x] Create `app/(tabs)/_layout.tsx` — 4-tab navigator
- [x] Create `app/(tabs)/settings/index.tsx` — shows email, sign out button
- [x] Create placeholder screens: `songs/index.tsx`, `setlists/index.tsx`, `events/index.tsx`
- [x] Test: sign up → profile row in Supabase → redirect to app → sign out → back to login
- [x] Test: close and reopen → session restored
- [x] Commit: `feat: Step 1 — authentication screens and auth gate`

---

## Step 2 — Band Setup ✓

- [x] Create `band_members` table in Supabase
- [x] Enable RLS on `bands` and `band_members`
- [x] Create `get_my_band_ids()` security definer function (avoids RLS recursion)
- [x] Add band policies (publicly readable, users can create, members can view/join)
- [x] Create `lib/BandContext.tsx` — `BandProvider` + `useBand()` hook
- [x] Update `app/_layout.tsx` — check band membership after auth, route to `/band/new` if none
- [x] Create `app/band/_layout.tsx`
- [x] Create `app/band/new.tsx` — create band form
- [x] Create `app/band/join.tsx` — join by invite code
- [x] Update `app/(tabs)/_layout.tsx` — show band name in header via `useBand()`
- [x] Update `app/(tabs)/settings/index.tsx` — show invite code (tap to copy)
- [x] Test: create band → redirected to Songs tab → band name in header
- [x] Test: invite code visible in settings → second user can join
- [x] Commit: `feat: Step 2 — band setup, create/join flow, band context`

---

## Step 3 — Song Catalog ✓

- [x] Create `songs` table in Supabase
- [x] Enable RLS on `songs`, add 4 policies using `get_my_band_ids()`
- [x] Replace `app/(tabs)/songs/index.tsx` — list with filter chips, status badges, FAB
- [x] Create `app/(tabs)/songs/new.tsx` — add song form
- [x] Create `app/(tabs)/songs/[id].tsx` — edit/delete song
- [x] Test: add → edit → delete → filter by status → empty state
- [x] Commit: `feat: Step 3 — song catalog`

---

## Step 3.5 — Songs v2: Import-First Repertoire Manager

Songs is upgraded from a basic form to an import-first experience with richer metadata.
Work through Phase A first (no external APIs). Phases B–D add platform integrations.

---

### Phase A — Richer metadata (no external APIs required)

#### Supabase

- [ ] Run the following in the Supabase SQL editor:
  ```sql
  alter table public.songs add column if not exists duration_seconds  integer;
  alter table public.songs add column if not exists energy_level      text default 'medium';
  alter table public.songs add column if not exists artwork_url       text;
  alter table public.songs add column if not exists source_platform   text;
  alter table public.songs add column if not exists source_url        text;
  alter table public.songs add column if not exists source_track_id   text;
  alter table public.songs add column if not exists imported_at       timestamptz;
  ```
- [ ] Update `sql/schema.sql` to include these columns (already in schema.md)

#### App — song list screen (`songs/index.tsx`)

- [ ] Add sort control (dropdown or horizontal chip row):
  - Title A→Z (default), Artist A→Z, Recently Added, BPM ↑, Duration ↑, Energy
- [ ] Add energy filter chips alongside status chips:
  - All / Low / Medium / High
- [ ] Redesign song row to show:
  - Artwork thumbnail (small square, colored initial block if no artwork)
  - Title + Artist
  - Status badge + energy dot (colored: low=blue, medium=amber, high=red)
  - Duration (formatted as `m:ss`) if set

#### App — add song flow (`songs/new.tsx` → redesign)

Replace the current single-screen form with a two-screen import-first flow:

- [ ] **Screen 1 — Method picker** (`songs/add.tsx`)
  - Four options: Spotify link | Apple Music link | YouTube link | Enter manually
  - Tapping an import option navigates to `songs/import.tsx` with the platform pre-selected
  - Tapping "Enter manually" navigates directly to `songs/new.tsx` (the existing form, updated)

- [ ] **Screen 2a — Import screen** (`songs/import.tsx`)
  - Shows the selected platform label and a text input: "Paste your link"
  - "Import" button — in Phase A, this is a no-op placeholder that just parses the URL and stores it
  - Extracts `source_platform`, `source_url`, `source_track_id` from the URL client-side
  - Navigates to the review screen with those fields pre-filled
  - "Enter manually instead" link at the bottom

- [ ] **Screen 2b / Review screen** (`songs/new.tsx` — updated)
  - Add fields to the existing form:
    - Energy Level picker (Low / Medium / High chips)
    - Duration input (minutes + seconds, two small inputs side by side)
    - Artwork URL (text input, shown as preview thumbnail if filled)
  - If coming from import: show source platform badge read-only at top
  - On save: write all new fields including `source_platform`, `source_url`, `source_track_id`, `imported_at` (if imported)

#### App — edit song screen (`songs/[id].tsx`)

- [ ] Add the same new fields: Energy Level, Duration, Artwork URL
- [ ] Show source platform badge read-only if the song was imported

#### Test Phase A

- [ ] Add a song manually with energy level and duration → verify it saves and displays correctly
- [ ] Paste a Spotify URL → verify source fields are stored, platform badge shown in edit screen
- [ ] Sort by duration → verify order is correct
- [ ] Filter by energy High → verify only high-energy songs appear
- [ ] Commit: `feat: Songs v2 Phase A — richer metadata, sort/filter, import-first UI`

---

### Phase B — YouTube import (free, no API key needed)

- [ ] On the import screen, detect when a YouTube URL is pasted
- [ ] Call YouTube oEmbed: `https://www.youtube.com/oembed?url={url}&format=json`
  - Returns: `title`, `author_name` (channel name), `thumbnail_url`
- [ ] Pre-fill: title → song title, author_name → artist, thumbnail_url → artwork_url
- [ ] Extract video ID from URL (`?v=` param or `youtu.be/` path) → `source_track_id`
- [ ] Show loading spinner during fetch; show error + manual fallback on failure
- [ ] Test: paste a YouTube link → review screen pre-filled → song saved with source fields
- [ ] Commit: `feat: Songs v2 Phase B — YouTube import via oEmbed`

---

### Phase C — Spotify import (requires Supabase Edge Function)

- [ ] Create a Spotify app at developer.spotify.com (Client Credentials flow)
- [ ] Create a Supabase Edge Function: `spotify-track`
  - Input: Spotify track URL or track ID
  - Uses Client ID + Secret (stored as Supabase secrets, never on device)
  - Calls `GET /tracks/{id}` on the Spotify API
  - Returns: title, artist, duration_ms, album artwork URL, track ID
- [ ] On the import screen: detect Spotify URL → call Edge Function → pre-fill review screen
- [ ] Store: `source_platform = 'spotify'`, `source_track_id`, `artwork_url`, `duration_seconds`
- [ ] Test: paste a Spotify track link → metadata fetched → song saved correctly
- [ ] Commit: `feat: Songs v2 Phase C — Spotify import via Edge Function`

---

### Phase D — Apple Music import (requires Apple Developer account)

- [ ] Parse Apple Music URL → extract catalog ID (format: `.../album/name/{catalog-id}`)
- [ ] Create a Supabase Edge Function: `apple-music-track`
  - Requires a MusicKit developer token (JWT signed with Apple private key)
  - Calls Apple Music API: `GET /v1/catalog/us/songs/{id}`
  - Returns: title, artist, duration, artwork URL
- [ ] On the import screen: detect Apple Music URL → call Edge Function → pre-fill review screen
- [ ] Test: paste an Apple Music link → metadata fetched → song saved correctly
- [ ] Note: more complex than Spotify — tackle only after Phase C is stable
- [ ] Commit: `feat: Songs v2 Phase D — Apple Music import via Edge Function`

---

## Step 4 — Setlist Builder ✓

**Why fourth:** Setlists are only useful once songs exist.

### Supabase

- [x] Run `setlists` table SQL (see `schema.md`)
- [x] Run `setlist_songs` table SQL (see `schema.md`)
- [x] Enable RLS on both tables
- [x] Add 4 policies to each table using `get_my_band_ids()`:
  ```sql
  alter table public.setlists      enable row level security;
  alter table public.setlist_songs enable row level security;

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

  -- setlist_songs: scoped through the setlist's band
  create policy "Band members can view setlist songs"
    on public.setlist_songs for select
    using (
      setlist_id in (
        select id from public.setlists
        where band_id in (select public.get_my_band_ids())
      )
    );

  create policy "Band members can insert setlist songs"
    on public.setlist_songs for insert
    with check (
      setlist_id in (
        select id from public.setlists
        where band_id in (select public.get_my_band_ids())
      )
    );

  create policy "Band members can delete setlist songs"
    on public.setlist_songs for delete
    using (
      setlist_id in (
        select id from public.setlists
        where band_id in (select public.get_my_band_ids())
      )
    );
  ```

### App — screens

- [x] Replace `app/(tabs)/setlists/index.tsx` — setlists list
- [x] Create `app/(tabs)/setlists/new.tsx` — create setlist
- [x] Create `app/(tabs)/setlists/[id].tsx` — setlist detail with up/down reorder, remove, delete
- [x] Create `app/(tabs)/setlists/add-songs.tsx` — song picker

### Test

- [x] Create a setlist
- [x] Add songs from the catalog
- [x] Reorder with up/down buttons
- [x] Remove a song
- [x] Delete the setlist
- [x] Commit: `feat: Step 4 — setlist builder`

---

## Step 5 — Events

**Why fifth:** Events feed into the dashboard (next gig, next rehearsal, earnings).
Build them before the dashboard so the dashboard has real data to show.

### Supabase

- [ ] Run `events` table SQL (see `schema.md`)
- [ ] Add `status` and `revenue` columns:
  ```sql
  alter table public.events add column if not exists status text not null default 'scheduled';
  alter table public.events add column if not exists revenue numeric;
  ```
- [ ] Enable RLS on `events`
- [ ] Add 4 policies using `get_my_band_ids()`:
  ```sql
  alter table public.events enable row level security;

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
  ```

### App — screens

- [ ] Replace `app/(tabs)/events/index.tsx` — events list
  - Two sections: **Upcoming** (date ≥ today, status = scheduled) and **Past** (date < today OR status = completed)
  - Each row: title, type badge (Rehearsal / Gig), formatted date, location
  - "Add event" button
  - Empty state per section

- [ ] Create `app/(tabs)/events/new.tsx` — create event form
  - Inputs: title (required), type picker (Rehearsal / Gig), date + time picker, location, notes
  - Save → insert with `status = 'scheduled'` → navigate back

- [ ] Create `app/(tabs)/events/[id].tsx` — edit event
  - Same form pre-filled
  - "Mark as completed" button (for gigs: also shows revenue input)
  - Save → update → navigate back
  - Delete button with confirmation

### Test

- [ ] Create a rehearsal event → appears in Upcoming
- [ ] Create a gig → mark it completed with revenue → moves to Past
- [ ] Edit an event → changes saved
- [ ] Delete an event → removed from list
- [ ] Commit: `feat: Step 5 — events with status and revenue`

---

## Step 6 — Dashboard

**Why sixth:** The dashboard pulls from songs, events, and practice tasks.
All three must exist before the dashboard is built.

### Supabase

- [ ] Add `status_changed_at` column to songs:
  ```sql
  alter table public.songs add column if not exists status_changed_at timestamptz;
  ```
  > The app must set `status_changed_at = now()` whenever it updates `status`.
  > Update `songs/new.tsx` and `songs/[id].tsx` to include this field.

- [ ] Create `practice_tasks` table:
  ```sql
  create table public.practice_tasks (
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

### App — reusable components

- [ ] Create `components/MetricCard.tsx`
  - Props: `label`, `value`, `delta` (optional string like "+3 this week"), `accent` (optional color)
  - Used for Earnings, Songs Learned, Repertoire, Gigs Played

- [ ] Create `components/EventCard.tsx`
  - Props: `type` ('gig' | 'rehearsal'), `title`, `date`, `location`, optional `setlistId`
  - Shows formatted date/time and location
  - For gigs: shows a "Setlist" button if setlistId is provided

- [ ] Create `components/MemberAvatar.tsx`
  - Props: `displayName`, `size` (optional)
  - Colored circle with first initial; color derived from name
  - Used in the Band Members row

### App — screens

- [ ] Create `app/(tabs)/dashboard/_layout.tsx`
  ```tsx
  import { Stack } from 'expo-router'
  export default function DashboardLayout() {
    return <Stack screenOptions={{ headerShown: false }} />
  }
  ```

- [ ] Create `app/(tabs)/dashboard/index.tsx` — main dashboard screen
  - `ScrollView` root layout
  - Band Header section: "Welcome back" + band name
  - Metrics grid (2×2): Earnings, Songs Learned, Repertoire, Gigs Played
  - Band Members row: horizontal list of `MemberAvatar` + "+" button
  - Next Gig card using `EventCard`
  - Next Rehearsal card using `EventCard`
  - Practice Checklist: list of tasks, checkbox toggle, "Add task" input
  - All sections show a loading skeleton or `ActivityIndicator` while fetching
  - All sections have empty states

- [ ] Update `app/(tabs)/_layout.tsx`
  - Add Dashboard tab (center position, use grid/home icon)
  - Update tab order: Songs, Setlists, **Dashboard**, Events, Settings
  - Update `app/_layout.tsx` to redirect to `/(tabs)/dashboard` instead of `/(tabs)/songs` after login

### Dashboard queries (implement in the screen)

```typescript
// All run in parallel with Promise.all for performance

// 1. Metrics
const [songStats, gigStats, earningsResult] = await Promise.all([
  supabase.from('songs')
    .select('status, status_changed_at')
    .eq('band_id', band.id),

  supabase.from('events')
    .select('id')
    .eq('band_id', band.id)
    .eq('type', 'gig')
    .eq('status', 'completed'),

  supabase.from('events')
    .select('revenue')
    .eq('band_id', band.id)
    .eq('type', 'gig')
    .eq('status', 'completed')
    .gte('date', startOfMonth)
    .lt('date', startOfNextMonth),
])

// 2. Next gig and next rehearsal
const [nextGig, nextRehearsal] = await Promise.all([
  supabase.from('events')
    .select('id, title, date, location')
    .eq('band_id', band.id).eq('type', 'gig').eq('status', 'scheduled')
    .gte('date', now).order('date').limit(1).maybeSingle(),

  supabase.from('events')
    .select('id, title, date, location')
    .eq('band_id', band.id).eq('type', 'rehearsal').eq('status', 'scheduled')
    .gte('date', now).order('date').limit(1).maybeSingle(),
])

// 3. Band members
supabase.from('band_members')
  .select('user_id, role, profiles(display_name, avatar_url)')
  .eq('band_id', band.id)

// 4. My practice tasks
supabase.from('practice_tasks')
  .select('id, description, completed')
  .eq('band_id', band.id)
  .or(`assigned_to.eq.${userId},assigned_to.is.null`)
  .order('completed').order('created_at')
```

### Test

- [ ] Dashboard loads with real data (not empty)
- [ ] Metrics reflect actual songs/events in the database
- [ ] Next gig and rehearsal cards show the correct upcoming event
- [ ] Adding/completing a practice task updates the checklist immediately
- [ ] Dashboard is the default tab after login
- [ ] Commit: `feat: Step 6 — band dashboard`

---

## Step 7 — Polish + Device Testing

Do this before starting Phase 2. The app should be fully usable on a real device.

### EAS setup

- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Log in: `eas login`
- [ ] Initialize: `eas init` (links the project to your Expo account)
- [ ] Configure `eas.json` with a `preview` build profile

### Device testing

- [ ] Build and install on a physical iOS device: `eas build --profile preview --platform ios`
- [ ] Build and install on a physical Android device: `eas build --profile preview --platform android`
- [ ] Walk through the full flow: sign up → create band → add songs → build setlist → create event → check dashboard → sign out

### Polish checklist

- [ ] Every list screen has a loading indicator while fetching
- [ ] Every form shows an error message when the Supabase call fails
- [ ] Every list screen has an empty state
- [ ] Delete always asks for confirmation before proceeding
- [ ] No screen crashes when data is missing or slow to load
- [ ] Sign out is accessible from the settings tab

### Commit

- [ ] Commit: `chore: polish and device testing complete`

---

## Step 8 — Rehearsal Logs + Practice Tasks (extended)

**Why here:** These build on events (logs) and songs (tasks). Phase 1 must be stable first.

### Supabase

- [ ] Run `rehearsal_logs` table SQL (see `schema.md`)
- [ ] Enable RLS on `rehearsal_logs` and add band-membership policies

### App — rehearsal logs

- [ ] Add "View Log" entry point on each event detail screen
- [ ] Create rehearsal log screen: notes field + list of songs covered
- [ ] Save log entry linked to the event
- [ ] View past log entries from the event detail

### App — practice tasks (extended)

- [ ] Add song link to task creation (optional)
- [ ] Add ability to assign a task to a specific band member
- [ ] Filter: all tasks / my tasks / incomplete only

### Test

- [ ] Create a log for a rehearsal event
- [ ] Add and complete practice tasks with song links
- [ ] Commit: `feat: rehearsal logs and extended practice tasks`

---

## Step 9 — Chat + Polls

**Why here:** Chat is only valuable once people already open the app for another reason.
Phase 1 gives them that reason.

### Before starting

- [ ] Read the Supabase Realtime documentation before writing any code:
  https://supabase.com/docs/guides/realtime

### Supabase

- [ ] Run Phase 2 SQL: `messages`, `polls`, `poll_options`, `poll_votes` (see `schema.md`)
- [ ] Enable RLS on all four tables and add band-membership policies

### App — chat

- [ ] Add a Chat tab to the bottom tab bar
- [ ] Chat screen: scrollable message list (newest at bottom)
- [ ] Send message form: text input + send button
- [ ] Subscribe to new messages using `supabase.channel()` for real-time updates
- [ ] Show sender display name and timestamp per message
- [ ] Unread badge on the Chat tab

### App — polls

- [ ] "Create poll" button inside the Chat screen
- [ ] Poll creation form: question + 2–5 options
- [ ] Poll rendered inline in the chat: options with vote counts
- [ ] Tap to vote (one vote per user per poll)
- [ ] Show results after voting

### Test

- [ ] Two users can exchange real-time messages
- [ ] Create a poll, vote, see results update
- [ ] Commit: `feat: band chat and polls`

---

## Step 10 — Performance Mode

**Why here:** Needs lyrics data on songs and is self-contained once the song catalog is solid.

### Supabase

- [ ] Add lyrics column to songs:
  ```sql
  alter table public.songs add column lyrics text;
  ```

### App — lyrics editing

- [ ] Add a "Lyrics" section to the song edit screen (`songs/[id].tsx`)
- [ ] Multi-line text input for lyrics
- [ ] Save with the rest of the song data

### App — performance mode screen

- [ ] "Performance Mode" button on the song detail screen
- [ ] Full-screen view: large text, dark background, no navigation chrome
- [ ] Auto-scroll: starts scrolling at an adjustable speed
- [ ] Font size controls: increase / decrease
- [ ] Tap to pause/resume scroll
- [ ] Swipe down or back button to exit performance mode

### Test

- [ ] Add lyrics to a song
- [ ] Open performance mode → text is readable, scroll works
- [ ] Adjust font size and scroll speed
- [ ] Exit cleanly
- [ ] Commit: `feat: performance mode — lyrics viewer with auto-scroll`

---

## Step 11 — Promo + Media Tools

**Why last:** These are nice-to-have, not core workflow. Build them on top of a stable app.

### Supabase

- [ ] Run `event_rsvp` table SQL (see `schema.md`)
- [ ] Enable RLS and add policies
- [ ] Create a Supabase Storage bucket for media assets

### App — RSVP

- [ ] Add RSVP buttons to event detail screen (Yes / No / Maybe)
- [ ] Show RSVP summary on the event: "3 coming, 1 maybe, 1 no"
- [ ] View the full RSVP list

### App — shareable event links

- [ ] Generate a public URL for an event (no login required to view)
- [ ] Web-only route: `app/public/event/[id].tsx` — renders event details publicly

### App — media library

- [ ] Media tab or section within settings
- [ ] Upload band photos (Supabase Storage)
- [ ] View uploaded photos in a grid

### App — promo manager

- [ ] Promo screen (under settings): band bio, social links, press kit links
- [ ] Editable by any band member

### Test

- [ ] RSVP to an event and see the summary update
- [ ] Share an event link and confirm it opens without login
- [ ] Commit: `feat: RSVP, shareable events, promo tools`
