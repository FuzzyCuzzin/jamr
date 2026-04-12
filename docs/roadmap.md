# Jamr — Roadmap

---

## Phase 1 — Foundation (MVP)

**Goal:** A band can sign in, set up their band, manage their song catalog, build setlists,
and track upcoming events. This is the minimum that makes Jamr worth opening.

**Status:** In progress (transitioning to Expo)

### Step 0 — Project Scaffold
- [ ] Replace Next.js scaffold with Expo + TypeScript template
- [ ] Install Supabase client + AsyncStorage
- [ ] Configure Expo Router
- [ ] Set up `.env` with Supabase URL and anon key
- [ ] Verify app runs on iOS simulator, Android emulator, and web

### Step 1 — Authentication
- [ ] Verify profiles table + trigger still exist in Supabase
- [ ] Login screen (email + password)
- [ ] Signup screen (display name + email + password)
- [ ] Wire up Supabase `signInWithPassword`
- [ ] Wire up Supabase `signUp` (with display_name in metadata)
- [ ] Logout (accessible from settings)
- [ ] Protect all main routes — redirect unauthenticated users to login
- [ ] Handle auth state changes (session persistence via AsyncStorage)
- [ ] Test: sign up → profile created → redirected to app → sign out → redirected to login

### Step 2 — Band Setup
- [ ] Run `bands` and `band_members` SQL in Supabase
- [ ] Enable RLS on both tables and add policies
- [ ] Create band screen (name + description)
- [ ] Join band screen (enter invite code)
- [ ] Auto-add creator as admin in `band_members`
- [ ] Auto-add joiner as member in `band_members`
- [ ] Show band name in app header / tab bar
- [ ] Redirect users with no band to onboarding (create or join)
- [ ] Test: create band → see name → share invite code → second user joins

### Step 3 — Song Catalog
- [ ] Run `songs` SQL in Supabase
- [ ] Enable RLS on `songs` and add policies
- [ ] Songs list screen (sorted by title)
- [ ] Add song form (title, artist, key, BPM, status, notes)
- [ ] Edit song form (pre-filled)
- [ ] Delete song with confirmation
- [ ] Filter songs by status (all / learning / ready / performance_ready)
- [ ] Empty state: "No songs yet — add your first one"
- [ ] Test: add → edit → delete → filter

### Step 4 — Setlist Builder
- [ ] Run `setlists` and `setlist_songs` SQL in Supabase
- [ ] Enable RLS and add policies
- [ ] Setlists list screen
- [ ] Create setlist form (name only)
- [ ] Setlist detail screen — songs in order
- [ ] Add songs to setlist (pick from catalog)
- [ ] Move song up / down (updates `position`)
- [ ] Remove song from setlist
- [ ] Delete setlist
- [ ] Empty states on list and detail screens
- [ ] Test: create → add songs → reorder → remove → delete

### Step 5 — Events
- [ ] Run `events` SQL in Supabase
- [ ] Enable RLS and add policies
- [ ] Events list screen (upcoming + past)
- [ ] Create event form (title, type, date, location, notes)
- [ ] Edit event form
- [ ] Delete event with confirmation
- [ ] Empty state: "No upcoming events — schedule one"
- [ ] Test: create rehearsal → edit → create gig → check past/upcoming split

### Step 6 — Polish + Ship
- [ ] Test on physical iOS and Android devices via EAS build
- [ ] Review all screens on different screen sizes (small phone to tablet)
- [ ] Add consistent loading indicators
- [ ] Add consistent error messages on form failures
- [ ] Verify all empty states are in place
- [ ] Set up EAS project for builds

---

## Phase 2 — Communication

**Goal:** Band communication lives inside Jamr. Members can chat, vote on decisions,
and convert conversations into structured items.

**Why after Phase 1?** Chat is only valuable once people already open the app for another reason.
Phase 1 gives them that reason.

**Status:** Not started. Begin after Phase 1 ships.

- [ ] Read Supabase Realtime docs before starting
- [ ] Run Phase 2 SQL (`messages`, `polls`, `poll_options`, `poll_votes`)
- [ ] Enable RLS on all Phase 2 tables
- [ ] Band chat: real-time message list (Supabase Realtime subscription)
- [ ] Band chat: send a message
- [ ] Band chat: unread indicator
- [ ] Polls: create a poll with options
- [ ] Polls: vote (one vote per user per poll)
- [ ] Polls: view results
- [ ] Convert chat message → song idea or task (manual action)

---

## Phase 3 — Rehearsal Tools

**Goal:** Support the full rehearsal workflow — what was practiced, what still needs work,
following along live.

**Status:** Not started.

- [ ] Add `lyrics` column to `songs` table
- [ ] Lyrics viewer: full-screen display for a song
- [ ] Lyrics viewer: auto-scroll at adjustable speed
- [ ] Lyrics viewer: adjustable font size
- [ ] Rehearsal log: create a log entry per event
- [ ] Rehearsal log: notes and songs covered
- [ ] Practice tasks: assign to a band member, mark complete
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
- Song request form (public-facing, like a tip jar for song suggestions)
- Venue contacts list
- Set timer that counts down during a performance
- Push notifications for new events or chat messages
- Offline-first sync (cached songs + setlists without a connection)
