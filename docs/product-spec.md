# Jamr — Product Specification

## What is Jamr?

Jamr is a native mobile app for cover bands. It replaces the chaos of group chats,
Google Sheets setlists, and texted song requests with one app that actually understands
what a band needs — from learning songs to running a live show.

Jamr targets iOS and Android as first-class experiences, with web as a secondary companion.

---

## Who uses it?

- Band members on iOS and Android (primary audience)
- Occasional web access for reference or admin work
- Future: band admin role for managing members and permissions

---

## Platform targets

| Platform | Priority | Notes |
|---|---|---|
| iOS | Primary | Expo + EAS build |
| Android | Primary | Expo + EAS build |
| Web | Secondary | Expo Web — same codebase, no SEO needed |

---

## Navigation

The app uses a bottom tab bar with five tabs:

| Tab | Route | Description |
|---|---|---|
| Songs | `/(tabs)/songs` | Song catalog |
| Setlists | `/(tabs)/setlists` | Setlist builder |
| Dashboard | `/(tabs)/dashboard` | Band home screen (default landing tab) |
| Events | `/(tabs)/events` | Rehearsals and gigs |
| Settings | `/(tabs)/settings` | Account and band info |

**Dashboard is the default landing tab.** After login and band setup, the user lands on Dashboard, not Songs.

---

## MVP — Phase 1 Scope

These are the only features being built in Phase 1. Everything else is future.

### 1. Authentication
- Sign up with email + password
- Log in / log out
- Each user gets a profile (display name, placeholder avatar)
- Unauthenticated users are redirected to login

### 2. Band Setup
- Create a new band (name, optional description)
- Each user belongs to one band in the MVP
- Join a band via invite code (short random string stored on the band)
- Future: multiple bands per user, role-based access

### 3. Song Catalog

Songs is the heart of Jamr. It is an **import-first repertoire manager** — the primary path
for adding a song is to paste a link from Spotify, Apple Music, or YouTube. Manual entry
exists as a fallback, not the default.

#### Song statuses
`learning` | `ready` | `performance_ready`

#### Song metadata
Each song stores:
- **Title**, **Artist** — required
- **Key**, **BPM**, **Duration** (seconds) — optional, useful for setlist planning
- **Energy Level** — `low` | `medium` | `high`. Used to plan setlist arc (openers, closers, cool-downs)
- **Rating** — 1–5 stars. How well the band currently performs the song. Used for filtering and setlist planning.
- **Status** + **Status Changed At** — tracks when a song moved to ready/performance-ready
- **Notes** — free text, arrangement cues, member notes
- **Lyrics** — full song lyrics; viewable in-app and used by future performance mode
- **Artwork URL** — album art from the import source; shown as a thumbnail in the list
- **Source Platform** — `spotify` | `apple_music` | `youtube` | `manual`
- **Source URL** — the original link used to import the song
- **Source Track ID** — the platform's track/video ID for future API lookups

#### Add song flow (import-first)

**Entry point:** FAB (+) on the Songs list

**Step 1 — Method picker** ("Add a Song")
Four options presented as large tappable cards:
- Paste a Spotify link
- Paste an Apple Music link
- Paste a YouTube link
- Enter manually

**Step 2a — Import** (Spotify / Apple Music / YouTube)
- Single text input: "Paste your link"
- "Import" button fetches metadata from the platform API
- Loading state while fetching
- On success → pre-fills the review screen
- On failure → error message + "Enter manually instead" fallback link

**Step 2b — Manual entry**
Skips import, goes directly to the review screen with all fields empty.

**Step 3 — Review / edit screen**
- All fields shown and editable: Title*, Artist, Key, BPM, Duration, Energy Level, Rating, Status, Notes
- Lyrics field (multi-line, collapsible)
- If imported: Artwork thumbnail + source platform badge shown read-only at top
- "Save song" → inserts → back to Songs list

#### Add to Setlist (from song detail)
- Song detail screen has an "Add to Setlist" button
- Opens a list of existing setlists with checkboxes (multi-select supported)
- User can also tap "New Setlist" at the top to create one on the spot
- Saves to `setlist_songs` for each selected setlist

#### Sorting options
Users can sort the song list by:
- Title A→Z (default)
- Artist A→Z
- Recently Added
- Status
- Rating (high → low)
- Duration (short → long)
- BPM (low → high)
- Energy Level

#### Filtering options
Users can filter by:
- **Status**: All / Learning / Ready / Performance Ready
- **Energy Level**: All / Low / Medium / High
- **Rating**: All / 3+ stars / 5 stars only

#### Song list display
Each row shows:
- Artwork thumbnail (if available, else colored initial block)
- Title + Artist
- Status badge
- Energy dot (colored indicator: low=blue, medium=amber, high=red)
- Star rating (if set)
- Duration (if set)

### 4. Setlist Builder

#### Current (MVP)
- Create a named setlist
- Add songs from the catalog
- Reorder songs (up/down buttons)
- Remove a song from a setlist
- Delete a setlist

#### Setlist Wizard (Phase 2)
A guided flow for creating a setlist that fits a specific show format.

**Step 1 — Show structure**
- Number of sets (1–10)
- Set length in minutes (e.g. 45)
- Break length in minutes (optional, e.g. 15)

**Step 2 — Pick songs**
- Browse the full catalog using the same filter/sort UI as the Songs tab
- Multi-select songs by tapping them (checkmark appears)
- Running total shown: "X songs selected / ~Y minutes"
- Filter by status, energy, rating to find the right songs

**Step 3 — Review & distribute**
- System calculates: total duration, songs per set, fit vs. target length
- User can assign songs to specific sets (Set 1, Set 2, etc.)
- Warning shown if total duration is significantly over or under target

**Step 4 — Reorder within sets**
- Drag-and-drop reordering within each set
- Songs show duration + energy indicator to help plan flow

#### Setlist metadata
Each setlist tracks:
- Name
- Number of sets
- Target set duration (minutes)
- Break duration (minutes)
- Notes

#### Setlist export / print
- Export a setlist as plain text (song list in order, grouped by set)
- Share via the native share sheet (messages, email, AirDrop, etc.)
- Format: one song per line, set headers, total duration at the bottom

### 5. Events

#### Event types
`rehearsal` | `gig`

#### Shared fields (all events)
- Title (required)
- Type: Rehearsal or Gig
- Date (required)
- Start time
- End time (optional — used to calculate duration)
- Location
- Notes
- Status: `scheduled` | `completed` | `canceled`

#### Gig-specific fields
- Linked setlist (optional — which setlist the band will play)
- Number of sets
- Set duration (minutes)
- Break duration (minutes)
- Revenue (recorded when marking as completed)

#### Rehearsal-specific fields
- Linked setlist (optional — what the band plans to run through)
- Songs to practice: pick from the song catalog (multi-select) before the rehearsal

#### Rehearsal Detail screen
The Rehearsal Detail is a dedicated view for running through a rehearsal. It is separate
from the generic event edit form — it is designed for use **during and after** the rehearsal.

From the Events list, tapping a rehearsal row opens the Rehearsal Detail screen.
An "Edit" button in the header opens the standard event edit form.

The Rehearsal Detail screen contains:

**Header**
- Date, time, and location pulled from the event
- Status badge (Scheduled / Completed / Canceled)
- "Edit" button → opens the event edit form

**Songs Practiced**
- List of songs added to this rehearsal (from the catalog, pre-selected before rehearsal)
- "Add song" button to add from the catalog on the fly
- Each row shows: song title, artist, a "Practiced" toggle, and a "Notes" button
- Tapping "Notes" opens an inline or bottom-sheet text field for per-song notes
  (e.g. "Struggled with the key change in verse 2", "Nailed the intro finally")
- "Create task" button on the notes sheet creates a follow-up practice task linked
  to that song and this rehearsal

**Rehearsal Notes**
- Free text field for overall notes about the session
- (e.g. "Strong energy tonight, transitions still rough between set 1 and 2")

**Practice Tasks from this Rehearsal**
- List of tasks created during this rehearsal (song-level and rehearsal-level)
- Shows: description, assigned member, linked song name (if any)
- Checkbox to mark complete

#### Events list
- **Upcoming** section: status = scheduled, date ≥ today, sorted soonest first
- **Past** section: completed or canceled, or date < today, sorted most recent first
- Each row: type badge, title, formatted date, location

#### RSVP (Phase 2)
Each event supports per-member RSVP:
- Statuses: `yes` | `no` | `maybe` | `pending` (default)
- When an event is created, all band members are automatically invited (a row is created for each with status = pending)
- Members respond from the event detail screen
- Event detail shows RSVP summary: "3 yes · 1 maybe · 1 no response"
- Dashboard shows RSVP status for upcoming events

### 6. Dashboard
The Dashboard is the main landing screen after login. It surfaces a high-level snapshot
of the band's current state and upcoming activity.

#### Band Header
- Band name (large, prominent)
- "Welcome back" label above

#### Metrics Grid
Four metric cards arranged in a 2×2 grid:

| Metric | Source | Notes |
|---|---|---|
| Earnings (this month) | `sum(events.revenue)` where type=gig, status=completed, date in current month | Shows $0 until gig revenue is recorded |
| Songs Learned | `count(songs)` where status in (ready, performance\_ready) | Shows weekly delta: "+N this week" based on status\_changed\_at |
| Repertoire | `count(songs)` for the band | Total songs regardless of status |
| Gigs Played | `count(events)` where type=gig, status=completed | All-time count |

#### Band Members
- Horizontal scrollable list of member avatars
- Each avatar: colored circle with the member's initial
- "+" button at the end opens the invite code sheet (shows the band's invite code)

#### Next Gig Card
- Queries the earliest upcoming event where `type = 'gig'` and `status = 'scheduled'` and `date >= now()`
- Shows: date/time (formatted), venue/location
- Includes a "Setlist" button that navigates to the linked setlist (if one is associated)
- If no upcoming gig: shows "No gigs scheduled" placeholder

#### Next Rehearsal Card
- Queries the earliest upcoming event where `type = 'rehearsal'` and `status = 'scheduled'` and `date >= now()`
- Shows: date/time (formatted), location
- If no upcoming rehearsal: shows "No rehearsals scheduled" placeholder

#### Practice Checklist
The Practice Checklist surfaces the current user's open practice tasks on the dashboard.
In the MVP, tasks are added manually. Starting in Phase 2, tasks are generated from
rehearsal outcomes and linked back to the rehearsal and song they came from.

- Shows tasks assigned to the current user (`assigned_to = auth.uid()`)
- Each task shows: description text; if linked to a song, the song title appears as a subtitle
- Completed tasks show strikethrough text and move to the bottom
- "+" button to manually add a task (description only; no song or rehearsal link)
- Order: open tasks first (by created_at), completed tasks below

**Task levels (Phase 2):**

Two types of tasks coexist in the same list:

- **Song-level tasks** — linked to a specific song and optionally a rehearsal
  (e.g. "Work on the key change in Purple Rain — from Mar 14 rehearsal")
  Display: song name shown as subtitle; tap → navigates to that song
- **Rehearsal-level tasks** — general tasks for the whole band, no song link
  (e.g. "Tighten transitions between set 1 and 2")
  Display: no subtitle; optionally linked to a rehearsal date

Both types can be assigned to a specific member or left unassigned (visible to all band members).
Both types can have an optional due date (shown as a soft deadline, not enforced).

---

## Phase 2 — Enhanced Features

These are built after Phase 1 is stable and shipped.

### Rehearsal Detail
A dedicated screen for running and logging a rehearsal. This is the primary way
practice tasks are created.

**Rehearsal workflow:**
1. Open or create a rehearsal event
2. Add songs to the rehearsal (pick from the catalog or pull from a linked setlist)
3. During rehearsal: open each song, mark it as practiced, add per-song notes
4. From any note, create a follow-up practice task and assign it to a band member
5. After the rehearsal: add overall rehearsal notes; mark the event as completed
6. The dashboard checklist shows all assigned tasks for the current user

**Schema additions needed:**
- `rehearsal_songs` table: links songs to a rehearsal event, stores per-song notes and practiced status
- Update `practice_tasks`: add `rehearsal_id` (FK to events) and `due_date`

### Calendar View
- A dedicated calendar screen showing all events (gigs + rehearsals) plotted by date
- Month view with dots on event days; tap a day to see event details
- Quick way to spot scheduling conflicts or gaps in the schedule

### User Availability
- Each user can mark dates they are **unavailable** (blackout dates)
- Optional: preferred rehearsal times (e.g. weekday evenings only)
- Availability is visible to all band members
- Future: system suggests event dates based on everyone's availability

### User Profile Enhancements
- Edit display name and avatar
- Set availability preferences
- Add blackout dates (dates unavailable)
- View own RSVP history

---

## Out of Scope for Phase 1

Do not build these yet. They are tracked in the roadmap.

- In-app chat or messaging
- Polls and voting
- Member availability / RSVP per event
- Rehearsal logs and notes
- Lyrics viewer or auto-scroll
- Live performance mode
- Rehearsal recording uploads
- Shareable event links (public pages)
- Media or promo management
- External calendar integrations (Google Calendar, iCal)

---

## Design Principles

- **Native feel** — use platform conventions: bottom tab bar, stack navigation, native inputs
- **Mobile-first layout** — designed for phone screens; web is a bonus, not the target
- **Empty states** — every list screen shows a helpful message when empty
- **Loading + error states** — every form and data fetch handles these
- **Confirmation before delete** — never delete without asking
- **Dashboard as home** — the band dashboard is the entry point, not a list screen

---

## Product Areas (full scope, all phases)

These are the product areas Jamr will cover over time. Phase 1 is the foundation.

### Dashboard
- Band snapshot: earnings, repertoire size, gigs played
- Upcoming gig and rehearsal cards
- Practice checklist per member
- Band member roster with avatars

### Planning tools
- Song catalog / repertoire manager (import-first)
- Setlist wizard: guided flow with set structure, duration planning, energy arc
- Song details: BPM, key, duration, energy level, rating, lyrics, notes, status
- "Add to Setlist" from song detail (multi-select setlists)
- Setlist export / share via native share sheet
- Shared band calendar (monthly view)
- Band member availability and blackout dates
- Rehearsal song planning (pick songs to practice per event)

### Rehearsal / performance tools
- Rehearsal Detail screen: song list, per-song notes, practiced toggle
- Practice tasks created from rehearsal outcomes (song-level and rehearsal-level)
- Task assignment by band member with optional due date
- Rehearsal overall notes (session-level free text)
- Rehearsal recordings manager (Phase 4)
- Lyrics viewer with auto-scroll and adjustable font size (Phase 4)
- Performance mode (full-screen teleprompter) (Phase 4)

### Communication
- In-app band chat
- Inline polls
- Ability to convert chat items into structured app items

### Events / promo
- Gig and rehearsal event management
- Member RSVP per event
- Shareable public event links
- Future: media library, promo manager

---

## Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Framework | Expo (React Native) | Cross-platform iOS, Android, Web from one codebase |
| Router | Expo Router | File-system routing — same model as Next.js App Router |
| Language | TypeScript | Catches errors before runtime |
| Styling | React Native StyleSheet | Standard, conventional, no extra dependencies |
| Database + Auth | Supabase | Hosted Postgres + auth in one, generous free tier |
| Builds | EAS (Expo Application Services) | App Store + Play Store builds without Xcode/Android Studio |
| Version control | GitHub | Standard, free |
