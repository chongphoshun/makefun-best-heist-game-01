# MIDNIGHT VAULT — Steal the Meridian Diamond

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/chongphoshun/makefun-best-heist-game-01/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/chongphoshun/makefun-best-heist-game-01/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

An original top-down stealth heist game for [make.fun's best-heist-game bounty](https://make.fun/bounty/best-heist-game-20261122-0559).
You are the thief in the Meridian Museum at midnight. Cross one vault room
past three patrolling guards (Marco, Lena, Otto) with bright yellow vision
cones and two sweeping CCTV cameras, grab all five loot — gold bars, the
Velvet Lady painting, the Jade Phoenix, a cash stack, and the Meridian
Diamond in the vault — then slip out the EXIT before the alarm meter hits
100% and the vault locks down.

- Guards patrol waypoints, get suspicious, then chase; cameras sweep and raise the alarm
- Line-of-sight blocked by display cases and pillars; sneak (Shift) to be seen slower
- Smoke bombs (Q, ×2) blind guards and cameras; alarm decays when you break sight
- Score for loot + time + low alarm, best score in localStorage
- WebAudio-synthesised sound effects (M to mute), pause, restart, title / busted / victory screens

Play: `node serve.ts`, open http://localhost:8080. WASD / arrows move,
Shift sneak, Q smoke, P pause, R restart. No network request, no build
step — static files under `game/`.

Screenshots are real renders of this code (`?shot=title|play|alarm|victory`).
