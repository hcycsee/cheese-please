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

On any machine (this repo has no other setup steps — `npm install` auto-creates `.env` and the local database):

1. Install [Node.js 20 LTS](https://nodejs.org) if you don't have it.
2. `npm install`
3. `npm run dev`
4. Open http://localhost:3000

If step 2 or 3 errors out, it's almost always one of: Node isn't actually on your PATH (check `node -v` in a
*new* terminal after installing it), or another process is already using port 3000.

To try the group-matching and chat features you'll want two accounts online at once — open a second browser
(or an incognito window) and register another account.

### Letting other people on your WiFi join

The server already listens on all network interfaces, not just localhost, so anyone on the same WiFi can hit it
directly — you just have to give them the right address and get out of your own firewall's way.

1. Find your machine's local IP:
   - Windows: `ipconfig` in a terminal, look for "IPv4 Address" under your WiFi adapter.
   - Mac: `ipconfig getifaddr en0` (or check System Settings → WiFi → Details).
   - Linux: `ip addr` or `hostname -I`.
2. Windows Defender Firewall blocks inbound connections by default. The first time you run `npm run dev`,
   Windows should prompt you to allow Node through — click **Allow**, and pick "Private networks" at minimum
   (tick "Public networks" too if you're on something like a phone hotspot, which Windows treats as public).
   If you missed that prompt, go to Windows Defender Firewall → Allow an app through firewall, and check both
   boxes next to Node.js.
3. Give people `http://<your-ip>:3000` — e.g. `http://192.168.1.23:3000`.

If it still doesn't connect: some networks (a lot of uni/office/public WiFi, some phone hotspots) block devices
from talking to each other even when they're on the same network — this is called AP/client isolation and
there's no fix on your end, you'd need a different network. A phone's personal hotspot usually doesn't isolate
clients and is a reliable fallback for demoing.

### Optional: Steam integration

Get a free key at https://steamcommunity.com/dev/apikey, put it in `.env` as `STEAM_API_KEY=...`, restart the
dev server, then use the "Steam library" section on the Profile page. Your Steam "Game details" privacy has to
be set to Public for the sync to see your games.

## Notes

- The "verify ID" step in registration is a demo placeholder 
