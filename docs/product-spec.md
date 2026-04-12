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
- Add a song: title, artist, key, BPM, status, notes
- Song statuses: `learning` | `ready` | `performance_ready`
- View all songs in a list (sorted by title)
- Filter songs by status
- Edit a song
- Delete a song (with confirmation)

### 4. Setlist Builder
- Create a named setlist
- Add songs from the catalog to a setlist
- Reorder songs (up/down buttons — no drag-and-drop in MVP)
- Remove a song from a setlist
- Delete a setlist

### 5. Events
- Create an event: title, type (rehearsal or gig), date, time, location, notes
- View upcoming events (sorted by date)
- View past events separately
- Edit an event
- Delete an event (with confirmation)

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
- Shows practice tasks assigned to the currently signed-in user (`assigned_to = auth.uid()`)
- Each task: checkbox + description text
- Completed tasks show strikethrough text
- "+" button to add a new task (description only, no song link in MVP)
- Filtering: show incomplete tasks first, then completed

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
- Song catalog / repertoire manager
- Setlist builder with ordering
- Song details: BPM, key, notes, lyrics, status
- Shared band calendar
- Band member availability
- Rehearsal and gig planning

### Rehearsal / performance tools
- Rehearsal log and notes
- Practice tasks by member
- Rehearsal recordings manager
- Lyrics viewer with auto-scroll and adjustable font size
- Performance mode (full-screen teleprompter)

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
