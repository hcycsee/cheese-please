# The story behind unipixel

## Inspiration

This one came from a pretty common moment we've all experienced - the start of uni, when you're sitting in your room, unsure how to make friends.

What got us was how *solvable* the problem looked once you stopped treating it like a dating problem. Everyone at a university is already in the same building, the same course, sometimes the same 9am lecture they're both dreading. The hard part isn't proximity, it's that there's no low-stakes way to say "hey, are you free Thursday" to someone you've never spoken to. Dating apps are the wrong tool. A Discord server full of randoms is worse. So we built the thing we actually wanted: something scoped to your own institution, where you can see who's around right now and just message them, without it being weird.

## How we built it

Next.js and TypeScript for the frontend, but the backbone of the whole thing is a custom Node server bolted onto Next, since we needed raw Socket.IO for presence, chat, and game state, and that doesn't fit cleanly into the normal Next.js request/response model. Prisma with SQLite for data, JWT-in-a-cookie for auth, and a registration wizard that walks you through a mock ID check, a profile, MBTI, and an availability grid you can also just import from a `.ics` file if you'd rather not click forty boxes by hand.

Once the core loop worked: see who's online, filter, add friends, chat, we kept asking "okay but why would someone open this twice." That's where the minigames came from. Every chat window is also a game lobby: a co-op tile-matcher, Tic-Tac-Toe, and a Gartic-Phone-style drawing game, all real-time multiplayer, all built from scratch rather than embedded from somewhere else. Group matching came next: a small scoring algorithm that groups people by shared free time, weighted by whatever traits you tell it to care about. After that it was a steady drip of the stuff that makes an app feel finished instead of just functional: block, bio, avatars, a profanity filter, dark mode, in-app notifications, and (mostly because it was funny) a demo toggle showing how a game like Minecraft could plug into your online status.

## Challenges we ran into

The presence system broke in a way that took an embarrassingly long time to track down: our custom server and Next's route handlers were each loading their own separate copy of the same module, so the "online users" map one side wrote to was never the map the other side read from. Everything looked fine in isolation and just silently failed together. The fix was small (move the shared state onto `globalThis`) but finding it wasn't.

Building three different real-time multiplayer games from scratch, on top of hand-rolled room and session logic, ate more time than any single feature had a right to. There's no shortcut for "someone disconnects mid-round" edge cases, you just have to handle them one by one. And a few good old-fashioned UI bugs slipped through anywhere we trusted the type-checker instead of actually clicking the thing: a toggle switch that looked fine in the code but rendered flush against the wrong edge in the browser, contrast that broke specifically in dark mode on one screen of the onboarding flow. Nothing catches those except opening the app and poking at it, which is a lesson we relearned more than once.

## What we learned

Mostly that the boring infrastructure decisions are the ones that bite you, and the flashy features are usually less risky than they look. We also learned to stop trusting "it compiles" as a stand-in for "it works": every real bug we hit this week showed up only once we ran the thing live and tried to break it, never in a type-check. And honestly, we learned that the feature people react to isn't the matching algorithm or the auth system, it's being able to challenge your one new friend to Tic-Tac-Toe without leaving the chat. Sometimes the fun part is the point.
