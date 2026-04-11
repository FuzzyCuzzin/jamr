# Jamr — Roadmap

---

## Phase 1 — Foundation (MVP)

**Goal:** A band can sign in, manage their song catalog, build setlists, and track upcoming events. This is the minimum that makes Jamr worth opening.

**Status:** In progress

### Checklist
- [ ] Project setup (Next.js + Supabase + Tailwind)
- [ ] Auth: sign up, log in, log out
- [ ] Auth: profile auto-creation on signup
- [ ] Auth: protected routes via middleware
- [ ] Band: create a band
- [ ] Band: join a band via invite code
- [ ] Band: show current band in layout
- [ ] Songs: list all songs
- [ ] Songs: add a song
- [ ] Songs: edit a song
- [ ] Songs: delete a song
- [ ] Songs: filter by status
- [ ] Setlists: list all setlists
- [ ] Setlists: create a setlist
- [ ] Setlists: add songs to a setlist
- [ ] Setlists: reorder songs (up/down)
- [ ] Setlists: remove a song
- [ ] Setlists: delete a setlist
- [ ] Events: list upcoming + past events
- [ ] Events: create an event
- [ ] Events: edit an event
- [ ] Events: delete an event
- [ ] Polish: empty states on all list pages
- [ ] Polish: loading states on all data fetches
- [ ] Polish: responsive layout
- [ ] Deploy to Vercel

---

## Phase 2 — Communication

**Goal:** Band communication lives inside Jamr. Members can chat, vote on decisions, and convert conversations into structured items (tasks, song ideas).

**Why after Phase 1?** Chat is only valuable once people are already opening the app for another reason. Phase 1 gives them that reason. Chat built on an active user base gets adopted. Chat built first gets ignored.

**Status:** Not started

### Checklist
- [ ] Design chat data model (messages table + Supabase Realtime)
- [ ] Band chat: real-time message list
- [ ] Band chat: send a message
- [ ] Band chat: unread indicator
- [ ] Polls: create a poll with options
- [ ] Polls: vote on a poll (one vote per user)
- [ ] Polls: view results
- [ ] Convert chat message → song idea or task (manual action)

---

## Phase 3 — Rehearsal Tools

**Goal:** Support the full rehearsal workflow. Members can log what they practiced, track tasks, and follow along with lyrics.

**Status:** Not started

### Checklist
- [ ] Rehearsal log: create a log entry per event
- [ ] Rehearsal log: add notes and songs covered
- [ ] Practice tasks: assign a task to a member
- [ ] Practice tasks: mark task complete
- [ ] Lyrics viewer: display lyrics for a song
- [ ] Lyrics viewer: auto-scroll at adjustable speed
- [ ] Lyrics viewer: adjustable font size
- [ ] Rehearsal recordings: upload a recording (Supabase Storage)
- [ ] Rehearsal recordings: list and play recordings

---

## Phase 4 — Events & Promo

**Goal:** Expand event management to include availability tracking and public-facing features.

**Status:** Not started

### Checklist
- [ ] Member availability: RSVP per event (yes / no / maybe)
- [ ] Member availability: view who's in for each event
- [ ] Shareable event link: public event page (no login required)
- [ ] Setlist export: share or print a setlist
- [ ] Media library: upload and organize band photos/assets
- [ ] Promo manager: store links, bios, social handles
