# The story behind unipixel

## Inspiration

This one came from a pretty common moment we've all experienced - the start of uni, when you're sitting in your room, unsure how to make friends.

What got us was how *solvable* the problem looked once you stopped treating it like a dating problem. Everyone at a university is already in the same building, the same course, sometimes the same 9am lecture they're both dreading. The hard part isn't proximity, it's that there's no low-stakes way to say "hey, are you free Thursday" to someone you've never spoken to. Dating apps are the wrong tool. A Discord server full of randoms is worse. So we built the thing we actually wanted: something scoped to your own institution, where you can see who's around right now and just message them, without it being weird.

## What it does

You sign up with your uni email, build a quick profile (bio, avatar, MBTI, an availability grid you can import straight from your class timetable), and land on a dashboard showing who's actually online at your institution right now. Search and filter that list, add friends, chat one on one or in groups, drop in a photo or a GIF when text isn't enough, and hit "Find a group" to get auto-matched with people who are free at the same time as you. Every chat also doubles as a game lobby, so you can challenge whoever you're talking to instead of running out of things to say. There's a block button for anyone who gives you a bad vibe, a lightweight admin view behind the scenes, and a small "online in Minecraft" toggle showing how a game-side status integration could plug into the same account.

## How we built it

Next.js and TypeScript for the frontend, but the backbone of the whole thing is a custom Node server bolted onto Next, since we needed raw Socket.IO for presence, chat, and game state, and that doesn't fit cleanly into the normal Next.js request/response model. Prisma with SQLite for data, JWT-in-a-cookie for auth, and a registration wizard that walks you through a mock ID check, a profile, MBTI, and an availability grid you can also just import from a `.ics` file if you'd rather not click forty boxes by hand.

Once the core loop worked: see who's online, filter, add friends, chat, we kept asking "okay but why would someone open this twice." That's where the minigames came from. Every chat window is also a game lobby: a co-op tile-matcher, Tic-Tac-Toe, and a Gartic-Phone-style drawing game, all real-time multiplayer, all built from scratch rather than embedded from somewhere else. Group matching came next: a small scoring algorithm that groups people by shared free time, weighted by whatever traits you tell it to care about. After that it was a steady drip of the stuff that makes an app feel finished instead of just functional: block, bio, avatars, a profanity filter, dark mode, in-app notifications, and (mostly because it was funny) a demo toggle showing how a game like Minecraft could plug into your online status.

## Challenges we ran into

The presence system broke in a way that took an embarrassingly long time to track down: our custom server and Next's route handlers were each loading their own separate copy of the same module, so the "online users" map one side wrote to was never the map the other side read from. Everything looked fine in isolation and just silently failed together. The fix was small (move the shared state onto `globalThis`) but finding it wasn't.

Building three different real-time multiplayer games from scratch, on top of hand-rolled room and session logic, ate more time than any single feature had a right to. There's no shortcut for "someone disconnects mid-round" edge cases, you just have to handle them one by one. And a few good old-fashioned UI bugs slipped through anywhere we trusted the type-checker instead of actually clicking the thing: a toggle switch that looked fine in the code but rendered flush against the wrong edge in the browser, contrast that broke specifically in dark mode on one screen of the onboarding flow. Nothing catches those except opening the app and poking at it, which is a lesson we relearned more than once.

## Accomplishments that we're proud of

Honestly, that all three minigames work at all. It's easy to underestimate how much logic goes into something as small as Tic-Tac-Toe once you add a second player who can disconnect mid-game, and we built three of those (plus the room and session plumbing underneath all of them) instead of embedding someone else's widget. We're also proud that the whole loop actually holds together end to end: sign up, get verified, show up on the dashboard, get matched, chat, play a game, all without any of the seams showing. And dark mode works on every single screen, not just the easy ones.

## What we learned

Mostly that the boring infrastructure decisions are the ones that bite you, and the flashy features are usually less risky than they look. We also learned to stop trusting "it compiles" as a stand-in for "it works": every real bug we hit this week showed up only once we ran the thing live and tried to break it, never in a type-check. And honestly, we learned that the feature people react to isn't the matching algorithm or the auth system, it's being able to challenge your one new friend to Tic-Tac-Toe without leaving the chat. Sometimes the fun part is the point.

## What's next for UNIPIXEL

Real ID verification instead of the mock check, so this could actually run at a real university instead of just simulating one. We'd also like to pilot it with one campus group rather than launching cold, since a directory of "people online now" is only useful once there are enough people actually on it. On the feature side: more minigames, a real Minecraft (or Discord, or whatever students actually use) integration instead of the demo toggle, and probably a native mobile app, since most of this is going to get used from someone's phone in a lecture hall, not a laptop.
