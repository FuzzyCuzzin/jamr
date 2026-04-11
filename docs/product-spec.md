# Jamr — Product Specification

## What is Jamr?

Jamr is a shared web app for cover bands. It replaces the group chat chaos of managing a band (WhatsApp threads, Google Sheets setlists, texted song requests) with one place that actually understands what a band needs.

---

## Who uses it?

- Band members — all treated equally in the MVP (no roles yet)
- Future: band admin role for managing members and permissions

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
- Join a band via invite code (simple string code stored on the band)
- Future: multiple bands per user, role-based access

### 3. Song Catalog
- Add a song with: title, artist, key, BPM, status, notes
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
- Create an event with: title, type (rehearsal or gig), date, time, location, notes
- View upcoming events (sorted by date)
- View past events separately
- Edit an event
- Delete an event

---

## Out of Scope for Phase 1

Do not build these yet. They are tracked in the roadmap.

- In-app chat or messaging
- Polls and voting
- Member availability per event
- Rehearsal logs and notes
- Practice tasks per member
- Lyrics viewer or auto-scroll
- Live performance mode
- Rehearsal recording uploads
- Shareable event links (public pages)
- Media or promo management
- Mobile app

---

## Design Principles

- **Mobile-first layout** — responsive Tailwind, works on phone screens
- **Simple navigation** — top nav on desktop, accessible on mobile
- **No heavy UI libraries** — plain Tailwind components only
- **Empty states** — every list page shows a helpful message when empty
- **Loading + error states** — every form and data fetch handles these
- **Confirmation before delete** — never delete without asking

---

## Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Industry standard, great Vercel integration |
| Language | TypeScript | Catches errors before runtime |
| Styling | Tailwind CSS | Fast, consistent, no separate CSS files |
| Database + Auth | Supabase | Hosted Postgres + auth in one, free tier |
| Hosting | Vercel | Made by the Next.js team, free tier |
| Version control | GitHub | Standard, free |
