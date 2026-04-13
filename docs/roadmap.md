# Jamr — Roadmap

---

## Phase 1 — Foundation (MVP)

**Goal:** A band can sign in, set up their band, manage their song catalog, build setlists,
track upcoming events, and see a real-time snapshot of their band on the dashboard.

**Status:** In progress

### Step 0 — Project Scaffold ✓
- [x] Replace Next.js scaffold with Expo + TypeScript template
- [x] Install Supabase client + AsyncStorage
- [x] Configure Expo Router
- [x] Set up `.env` with Supabase URL and anon key

### Step 1 — Authentication ✓
- [x] Login screen (email + password)
- [x] Signup screen (display name + email + password)
- [x] Protect all main routes — redirect unauthenticated users to login
- [x] Handle auth state changes (session persistence via AsyncStorage)

### Step 2 — Band Setup ✓
- [x] bands and band_members tables + RLS
- [x] Create band screen (name + description)
- [x] Join band screen (enter invite code)
- [x] Show band name in app header
- [x] Redirect users with no band to onboarding

### Step 3 — Song Catalog ✓
- [x] songs table + RLS
- [x] Songs list screen with filter chips and status badges
- [x] Add song form (title, artist, key, BPM, status, notes)
- [x] Edit and delete song

### Step 3.5 — Songs v2: Import-First Repertoire Manager
The current Songs experience is functional but manual. This step upgrades it to an
import-first flow with richer metadata for setlist planning.

**Phase A — Richer metadata (no external APIs)**
- [ ] Add columns: `duration_seconds`, `energy_level`, `artwork_url`, `source_platform`, `source_url`, `source_track_id`, `imported_at`
- [ ] Update add/edit song forms to include duration, energy level, artwork URL
- [ ] Redesign song list row: artwork thumbnail, energy dot, duration
- [ ] Add sort control: Title, Artist, Recently Added, BPM, Duration, Energy
- [ ] Add energy level filter (All / Low / Medium / High) alongside existing status filter
- [ ] Update `seed_songs.sql` to set energy levels on existing catalog

**Phase B — Import from YouTube (no OAuth needed)**
- [ ] Detect YouTube URL pasted by user (regex match)
- [ ] Fetch title + channel via YouTube oEmbed endpoint (free, no API key)
- [ ] Pre-fill title + artist on the review screen
- [ ] Store `source_platform = 'youtube'`, `source_url`, `source_track_id`, `imported_at`
- [ ] Fallback to manual entry if fetch fails

**Phase C — Import from Spotify**
- [ ] Register a Spotify app (Client Credentials flow — no user login required)
- [ ] Store Spotify Client ID + Secret in Supabase Edge Function (keeps secrets off device)
- [ ] Parse Spotify track URL → extract track ID
- [ ] Call Spotify `/tracks/{id}` endpoint via Edge Function → get title, artist, duration, artwork
- [ ] Pre-fill review screen; store `source_platform = 'spotify'`, `source_track_id`, `artwork_url`

**Phase D — Import from Apple Music**
- [ ] Parse Apple Music link → extract catalog ID from URL
- [ ] Call Apple Music API (MusicKit — requires Apple Developer account)
- [ ] Pre-fill review screen; store `source_platform = 'apple_music'`, `artwork_url`
- [ ] Note: more complex than Spotify due to Apple token signing; tackle last

### Step 4 — Setlist Builder ✓
- [x] Run `setlists` and `setlist_songs` SQL in Supabase
- [x] Enable RLS and add policies (use get_my_band_ids())
- [x] Setlists list screen
- [x] Create setlist form (name only)
- [x] Setlist detail screen — songs in order
- [x] Add songs to setlist (pick from catalog)
- [x] Move song up / down (updates position)
- [x] Remove song from setlist
- [x] Delete setlist
- [x] Test: create → add songs → reorder → remove → delete

### Step 5 — Events ✓
- [x] Run `events` SQL in Supabase
- [x] Enable RLS and add policies (use get_my_band_ids())
- [x] Add `status` column (scheduled / completed / canceled)
- [x] Add `revenue` column (nullable numeric, for gigs)
- [x] Events list screen (upcoming + past sections)
- [x] Create event form (title, type, date, location, notes)
- [x] Edit event form (include marking as completed)
- [x] Delete event with confirmation

### Step 6 — Dashboard ✓
- [x] Add `status_changed_at` column to songs
- [x] Create `practice_tasks` table + RLS
- [x] Add Dashboard tab to tab bar (center position)
- [x] Metrics grid: Earnings, Songs Learned, Repertoire, Gigs Played
- [x] Band Members row (avatars with initials)
- [x] Next Gig card + Next Rehearsal card
- [x] Practice Checklist (toggle complete, add new)
- [x] Set Dashboard as the default landing tab

### Step 7 — Polish + Ship
- [ ] Test on physical iOS and Android devices via EAS build
- [ ] Review all screens on different screen sizes
- [ ] Consistent loading indicators everywhere
- [ ] Consistent error messages on all form failures
- [ ] All empty states in place
- [ ] Set up EAS project for builds

---

## Phase 2 — Enhanced Features

**Goal:** Make the core features genuinely great. Better song management, smarter setlist
building, richer events, and coordination tools so the band can actually plan together.

**Status:** Not started. Begin after Phase 1 Step 7 ships.

### Step 8 — Songs v2: Richer Metadata + Import Flow
_(see Step 3.5 above for full detail — Phases A through D)_
- [ ] Schema: add `duration_seconds`, `energy_level`, `artwork_url`, import provenance fields
- [ ] Schema: add `rating` (1–5) and `lyrics` to songs
- [ ] Updated song list: artwork thumbnail, energy dot, star rating, duration
- [ ] Sort control: Title, Artist, Recently Added, BPM, Duration, Energy, Rating
- [ ] Energy + rating filter options
- [ ] Import-first add flow (method picker → import/manual → review screen)
- [ ] "Add to Setlist" from song detail: multi-select existing setlists + create new
- [ ] Lyrics field in add/edit song form
- [ ] YouTube import via oEmbed (no API key)
- [ ] Spotify import via Supabase Edge Function

### Step 9 — Setlist Wizard
- [ ] Schema: add `number_of_sets`, `set_duration_minutes`, `break_duration_minutes` to setlists
- [ ] Schema: add `set_number` to setlist_songs
- [ ] Wizard Step 1: show structure (sets, set length, break length)
- [ ] Wizard Step 2: song picker with same filter/sort as Songs tab, multi-select, running total
- [ ] Wizard Step 3: duration review (total duration, songs per set, fit vs. target)
- [ ] Wizard Step 4: assign songs to sets, reorder within sets
- [ ] Setlist detail: show songs grouped by set with per-set duration
- [ ] Setlist export: share as plain text via native share sheet (grouped by set, with durations)

### Step 10 — Rehearsal Detail
The Rehearsal Detail screen makes rehearsals first-class. It is the primary place where
practice tasks are created and where the band logs what was worked on.

- [ ] Schema: create `rehearsal_songs` table + RLS
  (replaces the simpler `event_songs` concept; adds `notes`, `practiced`, `position`)
- [ ] Schema: update `practice_tasks` — add `rehearsal_id` (FK to events) and `due_date`
- [ ] Events list: tapping a rehearsal row navigates to the Rehearsal Detail screen
  (not the edit form — that remains accessible via an "Edit" button in the header)
- [ ] Create `app/(tabs)/events/rehearsal/[id].tsx` — Rehearsal Detail screen
  - Header: date, time, location, status badge, "Edit" button
  - Songs section: list of songs added to this rehearsal; "Add song" button opens catalog picker
  - Each song row: title + artist, "Practiced" toggle, "Notes" button
  - Notes button opens a bottom sheet: per-song notes + "Create task" button
  - Create task from notes: pre-filled description, assignee picker, optional due date
  - Rehearsal notes: free-text field for overall session notes (saves to `events.notes`)
  - Tasks section: list of all tasks created from this rehearsal
- [ ] Dashboard checklist: update query to join `songs` and `events` so task rows show
  song title and rehearsal date as context
- [ ] Dashboard checklist: tapping a task with a `rehearsal_id` navigates to that rehearsal

### Step 11 — Events Overhaul (Gig-specific)
- [ ] Schema: add `end_time`, `setlist_id`, `number_of_sets`, `set_duration_minutes`, `break_duration_minutes` to events
- [ ] Event form: add end time field
- [ ] Gig form: add setlist picker, set structure fields
- [ ] Rehearsal form: add setlist picker (optional — which setlist to run through)
- [ ] Event detail: show linked setlist with tap-to-navigate
- [ ] Event detail (gig): show event duration (start → end)

### Step 12 — RSVP System
- [ ] Schema: create `event_rsvp` table + RLS
- [ ] On event create: auto-insert `pending` RSVP row for all current band members
- [ ] Event detail: show RSVP summary ("3 yes · 1 maybe · 1 no response")
- [ ] Event detail: current user can tap to change their RSVP (Yes / Maybe / No)
- [ ] Dashboard: show current user's RSVP status on Next Gig and Next Rehearsal cards
- [ ] Events list: show small RSVP indicator on each row

### Step 13 — Calendar View
- [ ] Add a Calendar screen (new tab or accessible from Events)
- [ ] Month view: dots on event days (purple = rehearsal, teal = gig)
- [ ] Tap a day → see events for that day
- [ ] Tap an event → navigate to event detail

### Step 14 — User Availability
- [ ] Schema: create `user_availability` table + RLS
- [ ] User profile screen: "My Availability" section
- [ ] Calendar-style date picker to mark unavailable dates (blackout dates)
- [ ] Band members can view each other's availability from a member profile
- [ ] Event creation: highlight dates where one or more members are unavailable

---

## Phase 3 — Communication

**Goal:** Band communication lives inside Jamr. Members can chat, vote on decisions,
and convert conversations into structured items.

**Why after Phase 2?** Chat is only valuable once people already open the app for another reason.
Phases 1 and 2 give them that reason.

**Status:** Not started.

- [ ] Read Supabase Realtime docs before starting
- [ ] Run Phase 3 SQL (messages, polls, poll_options, poll_votes)
- [ ] Enable RLS on all tables
- [ ] Band chat: real-time message list (Supabase Realtime subscription)
- [ ] Band chat: send a message
- [ ] Band chat: unread indicator on tab
- [ ] Polls: create a poll with options
- [ ] Polls: vote (one vote per user per poll)
- [ ] Polls: view results
- [ ] Convert chat message → song idea or task

---

## Phase 4 — Performance + Recordings

**Goal:** Support in-room performance and capture what happens at rehearsals.

The core rehearsal workflow (song list, per-song notes, practice tasks) is built in
Phase 2 Step 10. Phase 4 adds the real-time in-room tools layered on top.

**Status:** Not started.

- [ ] Lyrics viewer: full-screen display for a song (uses `songs.lyrics` field)
- [ ] Lyrics viewer: auto-scroll at adjustable speed
- [ ] Lyrics viewer: adjustable font size
- [ ] Performance mode: full-screen teleprompter with dark background, no UI chrome
- [ ] Recordings: upload audio/video per rehearsal (Supabase Storage)
- [ ] Recordings: optionally link a recording to a specific song from the rehearsal
- [ ] Recordings: list and play recordings on the Rehearsal Detail screen

---

## Phase 5 — Promo & Media

**Goal:** Public-facing features and band promotion tools.

**Status:** Not started.

- [ ] Shareable event link: public event page (no login required)
- [ ] Setlist share via public link
- [ ] Media library: band photos and assets (Supabase Storage)
- [ ] Promo manager: bio, social links, press kit

---

## Future Ideas

Not scheduled. Tracked here so they don't get lost.

- External calendar integration: export events to Google Calendar / iCal
- Suggest event dates based on all members' availability
- Push notifications for new events, RSVPs, or chat messages
- Tempo trainer / click track built into song detail
- Song request form (public-facing)
- Venue contacts list
- Set timer that counts down during a performance
- Offline-first sync (cached songs + setlists without a connection)
- Dashboard trends: charts over time for earnings, repertoire growth
- Apple Music import (MusicKit — most complex, tackle last)
