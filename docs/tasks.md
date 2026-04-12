# Jamr — Implementation Tasks

Work through these steps in order. Complete each step before moving to the next.
Mark tasks with [x] as you finish them.

---

## Step 0 — Project Scaffold ✓

Replace the Next.js scaffold with Expo + Expo Router. The Supabase project
(tables, auth config, API keys) is already set up and is not touched here.

### Tag the current state first

```bash
git tag v0-nextjs-scaffold
git push origin v0-nextjs-scaffold
```

This creates a permanent named bookmark in git. If you ever need the old code,
you can recover any file with: `git checkout v0-nextjs-scaffold -- src/`

### Prepare the environment file

- [x] Rename `.env.local` → `.env`
- [x] Update the key prefixes inside `.env`:
  ```
  EXPO_PUBLIC_SUPABASE_URL=your-project-url
  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```
  > Expo uses `EXPO_PUBLIC_` instead of `NEXT_PUBLIC_`. Same values, different prefix.

### Delete the Next.js scaffold

- [x] Delete `src/`
- [x] Delete `next.config.ts`
- [x] Delete `node_modules/`
- [x] Delete `public/`
- [x] Delete `.next/`

### Scaffold Expo

- [x] Run:
  ```bash
  npx create-expo-app@latest .
  ```
  > The `.` means "use the current directory." No `--template` flag — the default
  > template includes Expo Router and TypeScript out of the box.

- [x] Run whatever install command it suggests (usually `npx expo install`)

### Add Supabase

- [x] Run:
  ```bash
  npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
  ```

- [x] Create `lib/supabase.ts`:
  ```typescript
  import AsyncStorage from '@react-native-async-storage/async-storage'
  import { createClient } from '@supabase/supabase-js'

  export const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  )
  ```
  > This is the only Supabase client you need. Unlike Next.js, there is no server/client
  > split — one client, used everywhere.

### Verify and commit

- [x] Run `npx expo start`
- [x] Verify the app opens on iOS simulator — press `i`
- [ ] Verify the app opens on Android emulator — press `a`
- [ ] Verify the app opens in the browser — press `w`
- [x] Update `AGENTS.md` to remove the Next.js-specific note
- [x] Commit: `chore: scaffold Expo + Expo Router, replace Next.js`

---

## Step 1 — Authentication ✓

**Why first:** Every screen needs to know who the user is. Auth must work before anything else.

### Supabase (already done — verify these exist)

- [x] `profiles` table exists in Supabase
- [x] `handle_new_user` trigger exists (auto-creates profile on signup)
- [x] RLS enabled on `profiles`
- [x] Profile policies exist:
  ```sql
  create policy "Profiles are publicly readable"
    on public.profiles for select using (true);

  create policy "Users can update own profile"
    on public.profiles for update using (auth.uid() = id);
  ```

### App — auth gate

- [x] Create `app/_layout.tsx` — root layout
  - On mount: calls `supabase.auth.getSession()` to check for an existing session
  - Subscribes to `supabase.auth.onAuthStateChange()` for sign-in/sign-out events
  - Shows a blank screen while loading (prevents flash of wrong content)
  - No session + not on auth screen → `router.replace('/(auth)/login')`
  - Session + on auth screen → `router.replace('/(tabs)/songs')`

- [x] Create `app/(auth)/_layout.tsx` — plain Stack for auth screens (no tab bar)

### App — screens

- [x] Create `app/(auth)/login.tsx`
  - Email + password inputs
  - "Sign in" button → calls `supabase.auth.signInWithPassword({ email, password })`
  - Error message on failure
  - Link to signup screen
  - On success: root layout detects session change and redirects automatically

- [x] Create `app/(auth)/signup.tsx`
  - Display name + email + password inputs
  - "Create account" button → calls `supabase.auth.signUp()` with `display_name` in metadata
  - Error message on failure
  - "Check your email" message if confirmation is required
  - Link to login screen

- [x] Create `app/(tabs)/settings/index.tsx`
  - Shows signed-in email address
  - "Sign out" button → calls `supabase.auth.signOut()`
  - Root layout detects session change and redirects to login

- [x] Create `app/(tabs)/_layout.tsx` — 4-tab navigator
  - Tabs: Songs, Setlists, Events, Settings (with Ionicons)

- [x] Create placeholder screens: `songs/index.tsx`, `setlists/index.tsx`, `events/index.tsx`

### Test

- [x] Sign up with a new email → profile row appears in Supabase `profiles` table
- [x] Redirect lands on main app (Songs tab visible)
- [x] Sign out → redirected back to login
- [x] Close and reopen the app → session is restored (AsyncStorage persistence)
- [x] Commit: `feat: Step 1 — authentication screens and auth gate`

---

## Step 2 — Band Setup

**Why second:** Every piece of data (`songs`, `setlists`, `events`) belongs to a `band_id`.
Nothing else can be stored without a band.

### Supabase

- [ ] Run `bands` table SQL (see `schema.md`)
- [ ] Run `band_members` table SQL (see `schema.md`)
- [ ] Enable RLS on both tables:
  ```sql
  alter table public.bands        enable row level security;
  alter table public.band_members enable row level security;
  ```
- [ ] Add policies:
  ```sql
  -- Anyone authenticated can create a band
  create policy "Users can create bands"
    on public.bands for insert
    with check (auth.uid() = created_by);

  -- Band members can view their own band
  create policy "Band members can view band"
    on public.bands for select
    using (
      id in (select band_id from public.band_members where user_id = auth.uid())
    );

  -- Band members can view the member list
  create policy "Band members can view members"
    on public.band_members for select
    using (
      band_id in (select band_id from public.band_members where user_id = auth.uid())
    );

  -- Users can insert themselves as a member (used when creating or joining)
  create policy "Users can join bands"
    on public.band_members for insert
    with check (auth.uid() = user_id);
  ```

### App — screens

- [ ] Create `app/band/new.tsx` — create band form
  - Name (required) + description (optional) inputs
  - On submit:
    1. Insert row into `bands` with `created_by = user.id`
    2. Insert row into `band_members` with `role = 'admin'`
  - On success: navigate to `/(tabs)/songs`

- [ ] Create `app/band/join.tsx` — join by invite code
  - Single invite code input
  - On submit:
    1. Query `bands` where `invite_code = input`
    2. If found: insert row into `band_members` with `role = 'member'`
    3. If not found: show "Band not found" error
  - On success: navigate to `/(tabs)/songs`

- [ ] Update `app/_layout.tsx` auth gate to also check for band membership
  - After confirming user is logged in: query `band_members` for current user
  - If no band: `router.replace('/band/new')`
  - If band found: `router.replace('/(tabs)/songs')`

- [ ] Create a `BandContext` to store the current band ID and name
  - Fetched once after login, available to all tab screens without re-fetching
  - Show band name in the tab bar header

### Test

- [ ] Create a band → redirected to Songs tab → band name visible in header
- [ ] Share invite code with a second user → they join → see same band
- [ ] Commit: `feat: band setup — create, join, onboarding gate`

---

## Step 3 — Song Catalog

**Why third:** Songs are the core data. Setlists reference them.

### Supabase

- [ ] Run `songs` table SQL (see `schema.md`)
- [ ] Enable RLS on `songs`
- [ ] Add policies:
  ```sql
  create policy "Band members can view songs"
    on public.songs for select
    using (band_id in (select band_id from public.band_members where user_id = auth.uid()));

  create policy "Band members can insert songs"
    on public.songs for insert
    with check (band_id in (select band_id from public.band_members where user_id = auth.uid()));

  create policy "Band members can update songs"
    on public.songs for update
    using (band_id in (select band_id from public.band_members where user_id = auth.uid()));

  create policy "Band members can delete songs"
    on public.songs for delete
    using (band_id in (select band_id from public.band_members where user_id = auth.uid()));
  ```

### App — screens

- [ ] Replace `app/(tabs)/songs/index.tsx` — song list (replaces placeholder)
  - Fetch songs for the current band, sorted by `title`
  - Each row: title, artist, status badge (color-coded)
  - Filter bar at the top: All / Learning / Ready / Performance Ready
  - Floating "+" button or header button → navigate to `new.tsx`
  - Empty state: "No songs yet — add your first one"
  - Loading state while fetching

- [ ] Create `app/(tabs)/songs/new.tsx` — add song form
  - Inputs: title (required), artist, key, BPM (numeric), notes
  - Status picker: Learning / Ready / Performance Ready (default: Learning)
  - "Save" button → insert into Supabase → navigate back to list
  - Error message on failure

- [ ] Create `app/(tabs)/songs/[id].tsx` — edit/view song
  - Fetch song by `id` from Supabase
  - Same form as `new.tsx`, pre-filled with existing values
  - "Save" button → update in Supabase → navigate back
  - "Delete" button → confirmation alert → delete → navigate back to list
  - Error handling on all operations

### Test

- [ ] Add a song → appears in list
- [ ] Edit a song → changes saved
- [ ] Delete a song (with confirmation) → removed from list
- [ ] Filter by status → list updates correctly
- [ ] Empty state shows when no songs exist
- [ ] Commit: `feat: song catalog — list, add, edit, delete, filter`

---

## Step 4 — Setlist Builder

**Why fourth:** Setlists are only useful once songs exist.

### Supabase

- [ ] Run `setlists` table SQL (see `schema.md`)
- [ ] Run `setlist_songs` table SQL (see `schema.md`)
- [ ] Enable RLS on both tables
- [ ] Add policies to both tables (same band-membership pattern as songs):
  ```sql
  -- Repeat the 4-policy pattern (select/insert/update/delete) for setlists
  -- and for setlist_songs, scoped by band_id or setlist ownership
  ```

### App — screens

- [ ] Replace `app/(tabs)/setlists/index.tsx` — setlists list (replaces placeholder)
  - Fetch setlists for the current band
  - Each row: setlist name + song count
  - "Create setlist" button
  - Empty state: "No setlists yet"

- [ ] Create `app/(tabs)/setlists/new.tsx` — create setlist
  - Name input (required)
  - Save → insert into Supabase → navigate to setlist detail

- [ ] Create `app/(tabs)/setlists/[id].tsx` — setlist detail
  - Fetch songs in this setlist ordered by `position`
  - Each row: position number, title, artist, up/down buttons
  - Up button: swap `position` with the song above
  - Down button: swap `position` with the song below
  - "Add song" button → opens a modal or separate screen to pick from catalog
  - Swipe-to-delete or a remove button per song (with confirmation)
  - Delete setlist button at the bottom (with confirmation)
  - Empty state: "No songs in this setlist yet"

### Test

- [ ] Create a setlist
- [ ] Add songs to it from the catalog
- [ ] Reorder songs with up/down buttons
- [ ] Remove a song from the setlist
- [ ] Delete the setlist
- [ ] Commit: `feat: setlist builder — create, add songs, reorder, delete`

---

## Step 5 — Events

**Why fifth:** Events are standalone — no dependencies on songs or setlists.

### Supabase

- [ ] Run `events` table SQL (see `schema.md`)
- [ ] Enable RLS on `events`
- [ ] Add policies (same band-membership pattern):
  ```sql
  -- 4-policy pattern: select / insert / update / delete, scoped to band members
  ```

### App — screens

- [ ] Replace `app/(tabs)/events/index.tsx` — events list (replaces placeholder)
  - Two sections: **Upcoming** (date ≥ today) and **Past** (date < today)
  - Each row: title, type badge (Rehearsal / Gig), formatted date, location
  - "Add event" button
  - Empty state for each section: "No upcoming events — schedule one"

- [ ] Create `app/(tabs)/events/new.tsx` — create event form
  - Inputs: title (required), type picker (Rehearsal / Gig), date + time picker, location, notes
  - Save → insert → navigate back to list

- [ ] Create `app/(tabs)/events/[id].tsx` — edit event
  - Same form pre-filled
  - Save → update → navigate back
  - Delete button with confirmation

### Test

- [ ] Create a rehearsal event → appears in Upcoming
- [ ] Edit it → changes saved
- [ ] Create a past-dated event → appears in Past section
- [ ] Delete an event → removed from list
- [ ] Commit: `feat: events — create, edit, delete, upcoming/past split`

---

## Step 6 — Polish + Device Testing

Do this before starting Phase 2. The app should be fully usable on a real device.

### EAS setup

- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Log in: `eas login`
- [ ] Initialize: `eas init` (links the project to your Expo account)
- [ ] Configure `eas.json` with a `preview` build profile

### Device testing

- [ ] Build and install on a physical iOS device: `eas build --profile preview --platform ios`
- [ ] Build and install on a physical Android device: `eas build --profile preview --platform android`
- [ ] Walk through the full flow on each device: sign up → create band → add songs → build setlist → create event → sign out

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

## Step 7 — Rehearsal Logs + Practice Tasks

**Why here:** These build on events (logs) and songs (tasks). Phase 1 must be stable first.

### Supabase

- [ ] Run `rehearsal_logs` table SQL (see `schema.md`)
- [ ] Run `practice_tasks` table SQL (see `schema.md`)
- [ ] Enable RLS on both tables and add band-membership policies

### App — rehearsal logs

- [ ] Add "View Log" entry point on each event detail screen
- [ ] Create rehearsal log screen: notes field + list of songs covered
- [ ] Save log entry linked to the event
- [ ] View past log entries from the event detail

### App — practice tasks

- [ ] Create practice tasks list screen (accessible from settings or its own tab)
- [ ] Add task form: description, optional song link, optional assigned member
- [ ] Mark task as complete (checkbox or swipe)
- [ ] Filter: all tasks / my tasks / incomplete only

### Test

- [ ] Create a log for a rehearsal event
- [ ] Add and complete practice tasks
- [ ] Commit: `feat: rehearsal logs and practice tasks`

---

## Step 8 — Chat + Polls

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

### Extras

- [ ] Long-press a message → option to "Convert to song idea" or "Convert to task"

### Test

- [ ] Two users can exchange real-time messages
- [ ] Create a poll, vote, see results update
- [ ] Commit: `feat: band chat and polls`

---

## Step 9 — Performance Mode

**Why here:** Needs lyrics data on songs (added as part of this step) and is a self-contained
feature once the song catalog is solid.

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

## Step 10 — Promo + Media Tools

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
