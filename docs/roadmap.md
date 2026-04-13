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

### Step 5 — Events
- [ ] Run `events` SQL in Supabase
- [ ] Enable RLS and add policies (use get_my_band_ids())
- [ ] Add `status` column (scheduled / completed / canceled)
- [ ] Add `revenue` column (nullable numeric, for gigs)
- [ ] Events list screen (upcoming + past sections)
- [ ] Create event form (title, type, date, location, notes)
- [ ] Edit event form (include marking as completed)
- [ ] Delete event with confirmation
- [ ] Test: create rehearsal → create gig → mark gig completed → check past/upcoming split

### Step 6 — Dashboard
- [ ] Add `status_changed_at` column to songs (track when status changes)
- [ ] Create `practice_tasks` table + RLS
- [ ] Add Dashboard tab to tab bar (center position)
- [ ] Dashboard screen layout
- [ ] Metrics grid: Earnings, Songs Learned, Repertoire, Gigs Played
- [ ] Band Members row (avatars with initials)
- [ ] Next Gig card
- [ ] Next Rehearsal card
- [ ] Practice Checklist (current user's tasks, toggle complete, add new)
- [ ] Wire all queries to Supabase
- [ ] Set Dashboard as the default landing tab
- [ ] Test: full dashboard loads correctly, checklist toggles work

### Step 7 — Polish + Ship
- [ ] Test on physical iOS and Android devices via EAS build
- [ ] Review all screens on different screen sizes
- [ ] Consistent loading indicators everywhere
- [ ] Consistent error messages on all form failures
- [ ] All empty states in place
- [ ] Set up EAS project for builds

---

## Phase 2 — Communication

**Goal:** Band communication lives inside Jamr. Members can chat, vote on decisions,
and convert conversations into structured items.

**Why after Phase 1?** Chat is only valuable once people already open the app for another reason.
Phase 1 gives them that reason.

**Status:** Not started. Begin after Phase 1 ships.

- [ ] Read Supabase Realtime docs before starting
- [ ] Run Phase 2 SQL (messages, polls, poll_options, poll_votes)
- [ ] Enable RLS on all Phase 2 tables
- [ ] Band chat: real-time message list (Supabase Realtime subscription)
- [ ] Band chat: send a message
- [ ] Band chat: unread indicator
- [ ] Polls: create a poll with options
- [ ] Polls: vote (one vote per user per poll)
- [ ] Polls: view results
- [ ] Convert chat message → song idea or task

---

## Phase 3 — Rehearsal Tools

**Goal:** Support the full rehearsal workflow — what was practiced, what still needs work,
following along live.

**Status:** Not started.

- [ ] Add lyrics column to songs table
- [ ] Lyrics viewer: full-screen display for a song
- [ ] Lyrics viewer: auto-scroll at adjustable speed
- [ ] Lyrics viewer: adjustable font size
- [ ] Rehearsal log: create a log entry per event
- [ ] Rehearsal log: notes and songs covered
- [ ] Recordings: upload audio/video (Supabase Storage)
- [ ] Recordings: list and play recordings

---

## Phase 4 — Events & Promo

**Goal:** Richer event management and public-facing features.

**Status:** Not started.

- [ ] Member RSVP: yes / no / maybe per event
- [ ] View who's coming to each event
- [ ] Shareable event link: public event page (no login required)
- [ ] Setlist export / share / print
- [ ] Media library: band photos and assets (Supabase Storage)
- [ ] Promo manager: bio, social links, press kit

---

## Future Ideas

Not scheduled. Tracked here so they don't get lost.

- Performance mode: full-screen teleprompter during a live show
- Tempo trainer / click track built into song detail
- Song request form (public-facing)
- Venue contacts list
- Set timer that counts down during a performance
- Push notifications for new events or chat messages
- Offline-first sync (cached songs + setlists without a connection)
- Dashboard trends: charts over time for earnings, repertoire growth
