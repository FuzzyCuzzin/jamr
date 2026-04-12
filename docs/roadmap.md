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

### Step 4 — Setlist Builder
- [ ] Run `setlists` and `setlist_songs` SQL in Supabase
- [ ] Enable RLS and add policies (use get_my_band_ids())
- [ ] Setlists list screen
- [ ] Create setlist form (name only)
- [ ] Setlist detail screen — songs in order
- [ ] Add songs to setlist (pick from catalog)
- [ ] Move song up / down (updates position)
- [ ] Remove song from setlist
- [ ] Delete setlist
- [ ] Test: create → add songs → reorder → remove → delete

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
