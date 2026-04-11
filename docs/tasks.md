# Jamr — Implementation Tasks

Work through these steps in order. Each step builds on the previous one. Complete a step fully before moving to the next.

Mark tasks with [x] as you finish them.

---

## Step 0 — Project Setup

- [x] Initialize Next.js with TypeScript + Tailwind + ESLint
- [x] Install `@supabase/supabase-js` and `@supabase/ssr`
- [x] Create `src/lib/supabase/client.ts` (browser Supabase client)
- [x] Create `src/lib/supabase/server.ts` (server Supabase client)
- [x] Create `src/middleware.ts` (session refresh middleware)
- [x] Create `.env.local.example`
- [x] Initialize git and create first commit
- [ ] Create a Supabase project at supabase.com
- [ ] Copy `.env.local.example` to `.env.local` and fill in your keys
- [ ] Push repo to GitHub
- [ ] (Optional) Connect GitHub repo to Vercel for preview deployments

---

## Step 1 — Authentication

**Why first:** Every page and every database query will need to know who the user is. Auth has to work before anything else.

- [ ] Run the `profiles` table SQL + trigger in Supabase SQL editor (see `schema.md`)
- [ ] Enable RLS on `profiles` table
- [ ] Create `/src/app/(auth)/login/page.tsx` — login form
- [ ] Create `/src/app/(auth)/signup/page.tsx` — signup form
- [ ] Wire up Supabase `signInWithPassword` on login
- [ ] Wire up Supabase `signUp` on signup
- [ ] Add logout button (calls `supabase.auth.signOut()`)
- [ ] Update `middleware.ts` to redirect unauthenticated users to `/login`
- [ ] Test: sign up → auto-redirects → creates profile row in Supabase

---

## Step 2 — Band Setup

**Why second:** Every piece of data (songs, setlists, events) belongs to a `band_id`. Without a band, nothing else can be stored.

- [ ] Run `bands` and `band_members` table SQL in Supabase
- [ ] Enable RLS on both tables and add policies
- [ ] Create `/src/app/(dashboard)/band/new/page.tsx` — create band form
- [ ] Create `/src/app/(dashboard)/band/join/page.tsx` — join by invite code
- [ ] After creating band: auto-add creator as admin in `band_members`
- [ ] After joining band: add user as member in `band_members`
- [ ] Show band name in the app layout (nav/header)
- [ ] Redirect users with no band to onboarding (create or join)
- [ ] Test: create band → see name in header → share invite code → second user joins

---

## Step 3 — Song Catalog

**Why third:** Songs are the core data. Setlists reference them, and rehearsal tools will reference them too.

- [ ] Run `songs` table SQL in Supabase
- [ ] Enable RLS on `songs` and add policies
- [ ] Create `/src/app/(dashboard)/songs/page.tsx` — song list
- [ ] Fetch songs from Supabase, scoped to the user's band
- [ ] Add song form (title, artist, key, BPM, status, notes)
- [ ] Edit song form (pre-filled)
- [ ] Delete song with confirmation dialog
- [ ] Filter songs by status (all / learning / ready / performance_ready)
- [ ] Empty state: "No songs yet — add your first one"
- [ ] Test: add → edit → delete → filter

---

## Step 4 — Setlist Builder

**Why fourth:** Setlists are only useful once songs exist. This step is fast because songs are already in the database.

- [ ] Run `setlists` and `setlist_songs` table SQL in Supabase
- [ ] Enable RLS and add policies
- [ ] Create `/src/app/(dashboard)/setlists/page.tsx` — setlist list
- [ ] Create setlist form (just a name)
- [ ] Setlist detail page — shows songs in order
- [ ] Add songs to setlist (pick from catalog)
- [ ] Move song up / move song down (updates `position`)
- [ ] Remove song from setlist
- [ ] Delete setlist
- [ ] Empty state on list page and on empty setlist
- [ ] Test: create setlist → add songs → reorder → remove one → delete setlist

---

## Step 5 — Events

**Why fifth:** Events are standalone and don't depend on songs or setlists. They're simple enough to be a quick win at this point.

- [ ] Run `events` table SQL in Supabase
- [ ] Enable RLS and add policies
- [ ] Create `/src/app/(dashboard)/events/page.tsx` — events list
- [ ] Split view: upcoming events vs past events
- [ ] Create event form (title, type, date, location, notes)
- [ ] Edit event form
- [ ] Delete event with confirmation
- [ ] Empty state: "No upcoming events — schedule one"
- [ ] Test: create rehearsal → edit it → create gig → check past/upcoming split

---

## Step 6 — Polish + Deploy

Do this before starting Phase 2.

- [ ] Review all pages for responsive layout (test on mobile screen size)
- [ ] Add consistent loading spinners or skeletons
- [ ] Add consistent error messages on form failures
- [ ] Verify all empty states are in place
- [ ] Deploy to Vercel (connect GitHub repo)
- [ ] Add environment variables to Vercel dashboard
- [ ] Smoke test the deployed app end-to-end

---

## Phase 2 — Chat + Polls (start after Phase 1 is stable)

Do not start these until Step 6 is complete and the app is deployed.

- [ ] Read Supabase Realtime docs before starting
- [ ] Run Phase 2 table SQL (`messages`, `polls`, `poll_options`, `poll_votes`)
- [ ] Enable RLS on all Phase 2 tables
- [ ] Build band chat UI (message list + send form)
- [ ] Subscribe to new messages via Supabase Realtime
- [ ] Build poll creation (question + options)
- [ ] Build poll voting (one vote per user)
- [ ] Show poll results
- [ ] "Convert to task / song idea" action on a message
