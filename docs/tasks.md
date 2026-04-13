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

## Step 8 — Songs v2: Richer Metadata + Import Flow

_(This is Phase A of Step 3.5 plus the rating/lyrics additions. Work through 3.5 Phases A–D first, then pick up rating and lyrics here.)_

### Supabase

- [ ] Run all Songs v2 column additions (from Step 3.5 Phase A):
  ```sql
  alter table public.songs add column if not exists duration_seconds  integer;
  alter table public.songs add column if not exists energy_level      text default 'medium';
  alter table public.songs add column if not exists artwork_url       text;
  alter table public.songs add column if not exists source_platform   text;
  alter table public.songs add column if not exists source_url        text;
  alter table public.songs add column if not exists source_track_id   text;
  alter table public.songs add column if not exists imported_at       timestamptz;
  alter table public.songs add column if not exists rating  integer check (rating >= 1 and rating <= 5);
  alter table public.songs add column if not exists lyrics  text;
  ```

### App — song list screen

- [ ] Add sort control: Title, Artist, Recently Added, BPM, Duration, Energy, Rating
- [ ] Add energy filter chips: All / Low / Medium / High
- [ ] Add rating filter: All / 3+ stars / 5 stars only
- [ ] Redesign song row: artwork thumbnail, energy dot, star rating, duration

### App — add song flow (redesign)

- [ ] Create `app/(tabs)/songs/add.tsx` — method picker screen
  - Four large tappable cards: Spotify / Apple Music / YouTube / Manual
- [ ] Create `app/(tabs)/songs/import.tsx` — paste link + fetch metadata
  - Text input for link, "Import" button, loading state, error + manual fallback
  - Phase A: parse URL client-side only (no API calls yet)
  - Phase B: YouTube oEmbed fetch
  - Phase C: Spotify via Supabase Edge Function
- [ ] Update `app/(tabs)/songs/new.tsx` — review/edit screen
  - Add: Energy Level picker, Duration (m:ss inputs), Artwork URL input + thumbnail preview
  - Add: Star rating picker (1–5 tappable stars)
  - Add: Lyrics field (multi-line, collapsible)
  - Add: source platform badge (read-only, shown if imported)

### App — song detail screen

- [ ] Update `app/(tabs)/songs/[id].tsx`:
  - Add "Add to Setlist" button
  - Opens a modal/sheet listing all setlists with checkboxes (multi-select)
  - "New Setlist" option at top of the list creates one on the spot
  - On confirm: insert into `setlist_songs` for each selected setlist
  - Show lyrics section (read-only, with "Edit" link)
  - Show star rating (tappable to update)

### Components needed

- [ ] `components/StarRating.tsx` — 5 tappable stars; props: `value`, `onChange`, `readonly`
- [ ] `components/ArtworkThumbnail.tsx` — square image with colored-initial fallback; props: `artworkUrl`, `title`, `size`
- [ ] `components/EnergyDot.tsx` — small colored dot indicator; props: `level` ('low'|'medium'|'high')

### Test

- [ ] Add song manually with energy, duration, rating, lyrics → displays correctly in list
- [ ] Paste a YouTube link → title + channel pre-filled (Phase B)
- [ ] "Add to Setlist" from song detail → song appears in selected setlists
- [ ] Sort by rating → correct order
- [ ] Filter by energy High → only high-energy songs shown
- [ ] Commit: `feat: Step 8 — Songs v2 richer metadata, import flow, add-to-setlist`

---

## Step 9 — Setlist Wizard

### Supabase

- [ ] Add columns to setlists and setlist_songs:
  ```sql
  alter table public.setlists add column if not exists number_of_sets         integer default 1;
  alter table public.setlists add column if not exists set_duration_minutes   integer;
  alter table public.setlists add column if not exists break_duration_minutes integer;
  alter table public.setlist_songs add column if not exists set_number integer not null default 1;
  ```

### App — wizard screens

- [ ] Create `app/(tabs)/setlists/wizard.tsx` — multi-step wizard container (controls step state)

- [ ] **Wizard Step 1** — Show structure
  - Inputs: Number of sets (1–10 stepper), Set length (minutes), Break length (minutes, optional)
  - "Next" button

- [ ] **Wizard Step 2** — Pick songs
  - Same filter/sort controls as Songs list
  - Tap to select (checkmark shown); tap again to deselect
  - Sticky footer: "X songs selected · ~Y min" (sum of duration_seconds for selected songs)
  - "Next" button

- [ ] **Wizard Step 3** — Review
  - Shows: total songs, total duration, target duration (sets × set length)
  - Warning if total is more than 10% over or under target
  - Breakdown: estimated songs per set based on even distribution
  - "Next" button

- [ ] **Wizard Step 4** — Assign + reorder
  - Songs listed in groups by set (Set 1, Set 2, etc.)
  - Drag-and-drop reordering within each set (use `react-native-draggable-flatlist`)
  - Tap a song to move it to a different set
  - "Save Setlist" button

### App — setlist detail (updated)

- [ ] Show songs grouped by set (Set 1: X songs · Ymin, Set 2: ...)
- [ ] Show per-set duration calculated from `duration_seconds`
- [ ] Show total duration in setlist header

### App — setlist export

- [ ] "Share" button on setlist detail (header icon)
- [ ] Generates plain text: setlist name, songs grouped by set, total duration
- [ ] Opens native share sheet (Share API)

### Components needed

- [ ] `components/SetSection.tsx` — collapsible section for one set; props: `setNumber`, `songs`, `duration`
- [ ] `components/DurationBadge.tsx` — formatted `m:ss` or `Xmin` display; props: `seconds`

### Test

- [ ] Create setlist via wizard: 2 sets, 45 min each, pick 20 songs → review matches target
- [ ] Assign songs to sets → order saved correctly
- [ ] Setlist detail shows songs per set with duration
- [ ] Share button generates correct text output
- [ ] Commit: `feat: Step 9 — setlist wizard with set structure and export`

---

## Step 10 — Rehearsal Detail

**Why here:** Depends on events (Step 5) and songs (Step 3). Should come before the
Events Overhaul because the Rehearsal Detail defines what a rehearsal *is* in the app —
the Events Overhaul (Step 11) then layers on gig-specific fields and setlist linking.

**What this unlocks:** Practice tasks become rehearsal-driven, the dashboard checklist
becomes contextual (task → song → rehearsal), and the band has a first-class way to
log what was worked on.

### Supabase

- [ ] Create `rehearsal_songs` table + RLS:
  ```sql
  create table public.rehearsal_songs (
    id         uuid primary key default gen_random_uuid(),
    event_id   uuid not null references public.events(id) on delete cascade,
    song_id    uuid not null references public.songs(id) on delete cascade,
    notes      text,
    practiced  boolean not null default false,
    position   integer not null default 0,
    created_at timestamptz default now(),
    unique(event_id, song_id)
  );

  alter table public.rehearsal_songs enable row level security;

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

- [ ] Update `practice_tasks` table — add new columns:
  ```sql
  alter table public.practice_tasks
    add column if not exists rehearsal_id uuid references public.events(id);
  alter table public.practice_tasks
    add column if not exists due_date date;
  ```
  > `rehearsal_id` links a task back to the rehearsal where it was created.
  > `due_date` is optional; surfaced in the UI as a soft deadline.

### App — navigation update

- [ ] Update `app/(tabs)/events/index.tsx` — when tapping a rehearsal row, navigate to
  `/(tabs)/events/rehearsal/${item.id}` instead of `/(tabs)/events/${item.id}`.
  Gig rows continue to navigate to `/(tabs)/events/${item.id}` (the edit screen).

### App — Rehearsal Detail screen

- [ ] Create `app/(tabs)/events/rehearsal/[id].tsx`:

  **Data to fetch on load (all in parallel):**
  - The event row (`events` where id = rehearsalId)
  - Songs for this rehearsal (`rehearsal_songs` joined to `songs`, ordered by position)
  - Tasks from this rehearsal (`practice_tasks` where rehearsal_id = rehearsalId, joined to songs)
  - Band members (for the assignee picker when creating a task)

  **Header section:**
  - Date, time, location pulled from the event row
  - Status badge (Scheduled / Completed / Canceled)
  - "Edit" button in the header right → navigates to `/(tabs)/events/${id}` (existing edit form)

  **Songs Practiced section:**
  - Title: "Songs Practiced"
  - "Add song" button → opens a song picker (same catalog picker pattern as add-songs in setlists)
  - Each song row:
    - Song title + artist
    - "Practiced" toggle (tap to mark true/false → updates `rehearsal_songs.practiced`)
    - "Notes" button → opens an inline expandable text area (or bottom sheet)
      - Shows current `rehearsal_songs.notes` for that song
      - "Save notes" button → updates `rehearsal_songs.notes`
      - "Create task" button → opens the task creation sheet pre-filled with the song

  **Create Task sheet (opened from a song row or the "+" button in the Tasks section):**
  - Description text input (required)
  - Song link: pre-filled if opened from a song row; clearable
  - Assign to: member picker (scrollable list of band member names with tap-to-select;
    "Whole band / unassigned" as first option)
  - Due date: optional date text input (YYYY-MM-DD)
  - "Save task" → inserts to `practice_tasks` with `rehearsal_id` and `song_id` set

  **Rehearsal Notes section:**
  - Label: "Session Notes"
  - Multi-line text input
  - Auto-saves to `events.notes` on blur (or a "Save" button)

  **Practice Tasks section:**
  - Title: "Tasks from this Rehearsal"
  - "+" button opens the Create Task sheet (no pre-filled song)
  - Each task row:
    - Checkbox (tap to toggle `completed`)
    - Description
    - Song name subtitle (if `song_id` is set)
    - Assignee name (if `assigned_to` is set)
    - Due date (if set, shown as "Due Apr 20")

### App — Dashboard checklist update

- [ ] Update `dashboard/index.tsx` — update the practice_tasks query to join songs and events:
  ```typescript
  supabase
    .from('practice_tasks')
    .select('id, description, completed, due_date, rehearsal_id, song_id, songs(title), events(date)')
    .eq('band_id', band.id)
    .or(`assigned_to.eq.${userId},assigned_to.is.null`)
    .order('completed')
    .order('created_at')
  ```
- [ ] Update the checklist task row to show:
  - Song title as a small subtitle (if `songs.title` is present)
  - Tap a task that has a `rehearsal_id` → navigate to `/(tabs)/events/rehearsal/${rehearsal_id}`

### Test

- [ ] Create a rehearsal event
- [ ] Navigate to Rehearsal Detail via the events list
- [ ] Add 3 songs from the catalog
- [ ] Mark 2 songs as practiced; add notes to 1
- [ ] Create a song-level task from the notes sheet → assigned to a specific member
- [ ] Create a rehearsal-level task from the "+" button → no song linked
- [ ] Check the dashboard checklist → both tasks appear for the assigned member
- [ ] Tap a task on the dashboard → navigates back to the Rehearsal Detail
- [ ] Add overall rehearsal notes → saves correctly
- [ ] Commit: `feat: Step 10 — rehearsal detail screen with song notes and practice tasks`

---

## Step 11 — Events Overhaul (Gig-specific)

**Why here:** Builds on the foundation established in Step 10 (Rehearsal Detail).
Focuses on gig-specific enhancements: linking setlists, tracking set structure, end times.
The `rehearsal_songs` table from Step 10 already handles rehearsal-specific song linking.

### Supabase

- [ ] Add new columns to events:
  ```sql
  alter table public.events add column if not exists end_time               timestamptz;
  alter table public.events add column if not exists setlist_id             uuid references public.setlists(id);
  alter table public.events add column if not exists number_of_sets         integer;
  alter table public.events add column if not exists set_duration_minutes   integer;
  alter table public.events add column if not exists break_duration_minutes integer;
  ```

### App — event form (updated)

- [ ] Add end time field to create and edit forms
- [ ] **Gig form additions:**
  - Setlist picker: select from existing setlists (shows setlist name + song count)
  - Set structure fields: number of sets, set duration, break duration
- [ ] **Rehearsal form additions:**
  - Setlist picker (optional): which setlist to run through at this rehearsal
  - Note: the song-level rehearsal data lives in the Rehearsal Detail screen (Step 10),
    not in the edit form.

### App — event detail (gig-specific, updated)

- [ ] Show linked setlist on the gig detail/edit screen (tap to open it)
- [ ] Show event duration (start → end time)
- [ ] Note: for rehearsal detail, use the dedicated Rehearsal Detail screen from Step 10

### Test

- [ ] Create gig with linked setlist → setlist shown in detail, tap navigates to it
- [ ] Create rehearsal with songs to practice → list shown in detail
- [ ] Edit event → end time saves correctly
- [ ] Commit: `feat: Step 10 — events overhaul with end time, setlist link, rehearsal songs`

---

## Step 12 — RSVP System

### Supabase

- [ ] Create `event_rsvp` table + RLS (see schema.md)
- [ ] Write a Supabase database function (or handle in app) to auto-create `pending` RSVP rows for all band members when a new event is inserted:
  ```sql
  create or replace function public.create_event_rsvps()
  returns trigger as $$
  begin
    insert into public.event_rsvp (event_id, user_id, status)
    select new.id, user_id, 'pending'
    from public.band_members
    where band_id = new.band_id
    on conflict do nothing;
    return new;
  end;
  $$ language plpgsql security definer;

  create trigger on_event_created
    after insert on public.events
    for each row execute procedure public.create_event_rsvps();
  ```

### App — event detail (updated)

- [ ] Show RSVP summary: "3 yes · 1 maybe · 1 no response"
- [ ] Show current user's RSVP status with tap-to-change (Yes / Maybe / No buttons)
- [ ] Show list of who said what (names + status)

### App — events list (updated)

- [ ] Add small RSVP chip to each event row showing current user's status

### App — dashboard (updated)

- [ ] Show current user's RSVP status on Next Gig and Next Rehearsal cards

### Test

- [ ] Create event → all band members get `pending` RSVP rows automatically
- [ ] Respond to RSVP → status updates immediately in UI
- [ ] RSVP summary reflects all members' responses
- [ ] Commit: `feat: Step 11 — RSVP system with auto-invite and per-event responses`

---

## Step 13 — Calendar View

### App

- [ ] Add calendar screen: `app/(tabs)/events/calendar.tsx` (or new tab)
- [ ] Install `react-native-calendars` (lightweight, well-maintained)
- [ ] Month view: mark days with events using colored dots (purple = rehearsal, teal = gig)
- [ ] Tap a marked day → show event list for that day below the calendar
- [ ] Tap an event in the day list → navigate to event detail
- [ ] Navigation: accessible from Events list screen (calendar icon in header)

### Test

- [ ] Events appear as dots on correct dates
- [ ] Tap a date with multiple events → all events shown
- [ ] Navigating month forward/backward works
- [ ] Commit: `feat: Step 12 — calendar view for events`

---

## Step 14 — User Availability

### Supabase

- [ ] Create `user_availability` table + RLS (see schema.md)

### App

- [ ] Create `app/(tabs)/settings/availability.tsx` — My Availability screen
  - Calendar view (same library as Step 12)
  - Tap a date to toggle it unavailable (red highlight)
  - Tap again to remove the block
  - Optional notes per date
- [ ] Show availability summary in band member profile view (which dates are blocked)
- [ ] Event creation: when picking a date, show a banner if any member is unavailable
  - "2 members unavailable on this date" → tap to see who

### Test

- [ ] Mark dates unavailable → shows in calendar
- [ ] Create event on a blocked date → warning appears
- [ ] View another member's unavailability (read-only)
- [ ] Commit: `feat: Step 13 — user availability and blackout dates`

---

## Step 15 — Chat + Polls

**Why here:** Chat is only valuable once the core planning features are solid.

### Before starting

- [ ] Read the Supabase Realtime documentation: https://supabase.com/docs/guides/realtime

### Supabase

- [ ] Run Phase 3 SQL: `messages`, `polls`, `poll_options`, `poll_votes` (see schema.md)
- [ ] Enable RLS on all four tables

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
- [ ] Poll rendered inline in chat: options with vote counts
- [ ] Tap to vote (one vote per user per poll)
- [ ] Show results after voting

### Test

- [ ] Two users can exchange real-time messages
- [ ] Create a poll, vote, see results update
- [ ] Commit: `feat: Step 14 — band chat and polls`

---

## Step 16 — Performance Mode + Lyrics Viewer

**Why here:** Depends on lyrics data added in Step 8.

### App

- [ ] "Performance Mode" button on song detail screen
- [ ] Full-screen view: large text, dark background, no navigation chrome
- [ ] Auto-scroll at adjustable speed
- [ ] Font size controls (increase / decrease)
- [ ] Tap to pause/resume scroll; swipe down or back button to exit

### Test

- [ ] Add lyrics → open performance mode → text readable, scroll works
- [ ] Adjust font size and scroll speed
- [ ] Commit: `feat: Step 15 — performance mode lyrics viewer`

---

## Step 17 — Promo + Media Tools

**Why last:** Nice-to-have, not core workflow.

### App

- [ ] Shareable event link (public page, no login required)
- [ ] Media library: upload + view band photos (Supabase Storage)
- [ ] Promo manager: band bio, social links, press kit (under Settings)

### Test

- [ ] Share an event link → opens without login
- [ ] Commit: `feat: Step 16 — promo and media tools`
