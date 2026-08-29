# UNIPIXEL — 3 Minute Demo Script (Preliminary Pitch)

**Target runtime:** 3:00
**Format:** TIME | VISUAL | VO / ON-SCREEN TEXT

---

| Time | Visual | VO / On-screen text |
|---|---|---|
| 0:00–0:08 | Open on J03, 9th floor. Wide shot, empty-ish study space, late afternoon light. | *(no VO — ambient sound only)* |
| 0:08–0:15 | Quick montage of Reddit posts scrolling by — r/sydney, r/UNSW-style "how do I make friends at uni" threads. | **VO:** "Has this ever been you?" |
| 0:15–0:20 | Freeze frame on Hubert, sitting alone at a table, laptop open, one earbud in. | *(hold, no VO — let it sit)* |
| 0:20–0:28 | Freeze frame holds. | **VO:** "Lonely. Unsure how to find friends. New at university?" |
| 0:28–0:32 | Cut to black. | **VO:** "Then UNIPIXEL is for you." |
| 0:32–0:38 | UNIPIXEL logo animates in, centred, on the dark navy background. | *(logo sting / music hit)* |
| 0:38–0:48 | Logo holds, then dissolves into the live registration screen. | **VO:** "With a simple onboarding and verification system, UNIPIXEL provides a safe, trusted platform for students to meet people at their own institution — and actually become friends. Not a swipe app. Not another Discord full of strangers. Built for first-years, exchange students, postgrads — anyone starting over, at your own uni." |
| 0:48–1:02 | Sped-up screen capture: create account → ID verification step → gender/faculty/age → MBTI picker → availability grid (show the .ics import as a callout). | **VO:** "Sign up in under a minute. Verify who you are, tell us a bit about yourself, and let us know when you're usually free — even import it straight from your class timetable." |
| 1:02–1:20 | Cut to the dashboard: online/offline grid, live green presence dots, then type into the search bar and pick a faculty + age range filter live. | **VO:** "Once you're in, see who's actually online right now at your uni — search by name, or filter by faculty, age range, gender, even MBTI. Every filter stacks, so you find exactly who you're looking for." |
| 1:20–1:35 | Click "Add friend" → cut to Friends page, accept a request → open a DM chat, send a message. | **VO:** "Add people, chat instantly, and start actually talking." |
| 1:35–2:00 | **Hook feature.** Screen-record two windows side by side: click "🎮 Start a game" in a chat → show Tile Rush being played co-operatively, then a quick cut to Tic-Tac-Toe, then a quick cut to Gartic Phone (someone drawing, someone guessing, the reveal screen). | **VO:** "But UNIPIXEL isn't just another chat app. Every conversation has games built right in — race your friends in Tile Rush, face off in Tic-Tac-Toe, or get the whole group chat laughing with Gartic Phone. No downloads, no third-party service — real-time multiplayer, built entirely from scratch, running live inside the same chat window." |
| 2:00–2:22 | Cut to the Match page: toggle "same gender only" / age factor / faculty factor / MBTI factor, click "Find people free right now," show it land in a new group chat with a "Strong match" summary. | **VO:** "Can't decide who to talk to? Hit 'Find a group' and our own matching engine groups you live with people who are free at the same time as you — scored across gender, age, faculty, and MBTI, however you want to weigh it." |
| 2:22–2:30 | Quick montage: profile page — upload an avatar, type a bio, toggle a chip's visibility off, flip dark mode on with the floating toggle. | **VO:** "Make it yours — a profile picture, a bio, and control over exactly what other people can see." |
| 2:30–2:42 | Cut to the admin-only Minecraft config page, then cut to a Minecraft screen recording showing the actionbar status message appear ("🟢 unipixel: online"). | **VO:** "And yes — we even bridged this into Minecraft. An admin-configured relay pushes your online status straight into the game as a live indicator." |
| 2:42–2:48 | Cut back to Hubert from the opening shot — same table, same J03 9th floor — but now his laptop screen shows an active UNIPIXEL group chat, and he's smiling, looking up like someone's about to sit down. | **VO:** "Because finding your people shouldn't be this hard." |
| 2:48–2:54 | Logo returns, centred, with tagline underneath. | **On-screen text:** "UNIPIXEL — find your people." |
| 2:54–3:00 | Fade to team credit card. | **On-screen text:** "Built at Syncs Hack 2026" |

---

## Production notes

- **Pacing check:** roughly 310 words of VO across 3:00 is still a relaxed, conversational pace (well under the ~400–450 words a 3-minute video can hold at normal delivery) — there's room to breathe on the screen-capture beats. If a rehearsal read-through runs long, trim narration before cutting demo time.
- **Two beats to protect above all others if the edit runs long:** the games segment (1:35–2:00) and the Minecraft beat (2:30–2:42). Both are "nobody else in this room built that" moments — cut from the profile montage or the closing callback shot before touching either of these.
- **Live footage needed:** registration flow, dashboard filter interaction, a DM being sent, all three minigames in action, the match page toggles + result, profile page (avatar/bio/visibility), dark mode toggle, the admin Minecraft config page, and a real Minecraft client showing the actionbar status message. The Minecraft shot needs the datapack loaded and the bridge script actually running against a live server — don't leave that recording until the last minute.
- **Freeze frame/bookend:** reusing the opening J03 shot at 2:42 for the "resolution" beat is optional but a nice touch if the footage allows it — ties the story back together without needing new VO to explain it.

## Judging criteria coverage

The preliminary round scores this video against the same four criteria as the live final pitch. Where each one lands in the script:

| Criterion | Where it's hit |
|---|---|
| **Level of innovation** | 0:38–0:48 explicitly contrasts UNIPIXEL against swipe apps and generic Discord servers. 1:35–2:00 (in-chat multiplayer games) and 2:30–2:42 (the Minecraft relay) are the two clearest "nobody else does this" moments — protect both above all else. |
| **Technical complexity** | 1:35–2:00 calls out that the games are real-time multiplayer built from scratch, not a bolted-on third party. 2:00–2:22 calls out the live matching engine. 2:30–2:42 calls out the Minecraft bridge. If time allows in the final live pitch, be ready to go deeper on all three (custom Socket.IO server, the weighted matching algorithm, privacy-preserving chip visibility, the raw-socket IP check behind the Minecraft relay) — the video hints at it, the Q&A can prove it. |
| **Practicality of solution** | 0:00–0:32 establishes the real problem (loneliness, new to uni) via the Reddit montage and Hubert freeze-frame. 0:38–0:48 names exactly who it's for (first-years, exchange students, postgrads). |
| **Elegance of solution** | Demonstrated rather than narrated — every beat from 0:48 onward should show a clean, fast, no-fumbling interaction (registration in one take, filters responding instantly, a game starting in one click, dark mode flipping instantly). If any demo clip has hesitation or a bug, re-record it — this criterion lives or dies on the footage looking effortless. |

**For the live 4-minute final pitch (if selected):** this same script's beats can be repurposed, but there's room to slow down and explicitly narrate the technical complexity points (algorithm details, the custom real-time infrastructure) that this 3-minute cut only gestures at.
