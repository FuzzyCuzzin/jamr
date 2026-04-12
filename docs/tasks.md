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

## Step 4 — Setlist Builder

**Why fourth:** Setlists are only useful once songs exist.

### Supabase

- [ ] Run `setlists` table SQL (see `schema.md`)
- [ ] Run `setlist_songs` table SQL (see `schema.md`)
- [ ] Enable RLS on both tables
- [ ] Add 4 policies to each table using `get_my_band_ids()`:
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

- [ ] Replace `app/(tabs)/setlists/index.tsx` — setlists list
  - Fetch setlists for the current band
  - Each row: setlist name + song count
  - "Create setlist" button
  - Empty state: "No setlists yet"

- [ ] Create `app/(tabs)/setlists/new.tsx` — create setlist
  - Name input (required)
  - Save → insert → navigate to setlist detail

- [ ] Create `app/(tabs)/setlists/[id].tsx` — setlist detail
  - Fetch songs in this setlist ordered by `position`
  - Each row: position number, title, artist, up/down buttons
  - Up/down buttons: swap `position` with adjacent song
  - "Add song" button → navigate to a song picker screen
  - Remove button per song (with confirmation)
  - Delete setlist button (with confirmation)
  - Empty state: "No songs in this setlist yet"

- [ ] Create `app/(tabs)/setlists/add-songs.tsx` — song picker
  - Shows songs from the catalog not already in this setlist
  - Tap to add → inserts into `setlist_songs`
  - Navigate back to setlist detail

### Test

- [ ] Create a setlist
- [ ] Add songs from the catalog
- [ ] Reorder with up/down buttons
- [ ] Remove a song
- [ ] Delete the setlist
- [ ] Commit: `feat: Step 4 — setlist builder`

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
