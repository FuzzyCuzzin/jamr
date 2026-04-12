# Jamr uses Expo Router (not Next.js)

This is a React Native app built with Expo SDK 54 and Expo Router v6.
APIs, file structure, and conventions differ significantly from Next.js.

Key facts to know before writing code:
- All screens live in `app/`. File names map directly to routes (same as Next.js App Router).
- There are no Server Components, Server Actions, or API routes. Everything runs client-side.
- Styling uses React Native `StyleSheet.create()` — not CSS or Tailwind.
- Navigation uses Expo Router's `<Link>`, `router.push()`, `router.replace()` — not `next/link`.
- The Supabase client is in `lib/supabase.ts` — one client, used everywhere.
- Layout uses Flexbox. The default flex direction in React Native is `column` (not `row`).

Read the Expo Router docs if unfamiliar: https://docs.expo.dev/router/introduction/
