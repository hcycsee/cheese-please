# cheese-please

the repo of the greatest first year team at syncs hack 2026 \
hi! - hubert

## What this is

**unipixel** — a web app for meeting people at your own institution: see who's online right now, add friends, chat 1:1 or in
groups, and get auto-matched into a group of up to 12 people who are free at the same time as you (matched on
gender/age/faculty/MBTI, with per-user toggles for which of those count).

## Stack

Next.js (App Router, TypeScript) + Tailwind, Prisma + SQLite, a custom Node server running Socket.IO for
presence/chat, JWT cookie auth (`jose`), and an optional Steam Web API integration for game libraries.

## Setup

1. Install [Node.js 20 LTS](https://nodejs.org) if you don't have it.
2. `npm install`
3. `npm run db:push` — creates `prisma/dev.db` (SQLite) from `prisma/schema.prisma`.
4. `npm run dev`
5. Open http://localhost:3000

To try the group-matching and chat features you'll want two accounts online at once — open a second browser
(or an incognito window) and register another account.

### Optional: Steam integration

Get a free key at https://steamcommunity.com/dev/apikey, put it in `.env` as `STEAM_API_KEY=...`, restart the
dev server, then use the "Steam library" section on the Profile page. Your Steam "Game details" privacy has to
be set to Public for the sync to see your games.

## Notes

- The "verify ID" step in registration is a demo placeholder (simulated, not a real check) — swap it for a real
  KYC provider or institution SSO before this touches real users.
- Presence (who's online) is tracked in memory and resets if the server restarts.
