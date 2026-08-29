# unipixel

Find your people — at your own uni.

## What problem are you trying to solve?

Starting at a new university is lonely in a very specific way: the people around you are physically close, but
there's no easy, low-stakes way to actually meet them. Discord servers are full of strangers, dating apps are
the wrong tool for making friends, and cold-messaging someone from your course is awkward. On top of that, even
once two people want to hang out, figuring out when you're both actually free is its own hassle.

## Who would use it?

Students at the same institution — first-years without a social circle yet, exchange and international
students, postgrads starting fresh, or honestly anyone who wants an easier way to meet people nearby.

## What is your prototype?

unipixel is a web app where you sign up with your uni, build a quick profile, and see who else is online right
now. You can search and filter that list, add friends, chat one-on-one or in groups, and hit "Find a group" to
get auto-matched with people who are free at the same time as you. Every chat also has built-in multiplayer
minigames — a co-op tile-matcher, Tic-Tac-Toe, and a Gartic-Phone-style drawing game — so breaking the ice
doesn't take any effort at all.

## How does your prototype work?

After a short onboarding (with a mock ID check and a profile — gender, faculty, age, MBTI, availability, bio),
you land on a live dashboard of everyone online. Add friends, chat instantly, or click "Find a group" and get
dropped into a group chat with people who share your free time and whichever traits you tell it to weigh. Any
chat window doubles as a game lobby — start a game, everyone in the conversation can jump in, and it plays out
live for everyone at once.

## How did you implement your prototype?

Next.js and TypeScript on the frontend, a custom Node server running Socket.IO for everything real-time
(presence, chat, and all the in-game state), Prisma with SQLite for data, and JWT cookie-based auth. The
matching feature is a small scoring algorithm we wrote ourselves, and the minigames are all built from scratch
rather than pulled from a third-party service.
