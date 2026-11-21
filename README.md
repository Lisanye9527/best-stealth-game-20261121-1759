# Quiet Vault — a tiny stealth game

[![make.fun bounty](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Lisanye9527/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Lisanye9527/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

An entry for make.fun's [best stealth game](https://make.fun/bounty/best-stealth-game-20261121-1759) bounty.

You are a courier in a moonlit archive. The wardens carry the only light:
their lamps sweep real cones across the floor, blocked by walls, crates and
bookcases. Slip between patrols, keep to the hatched shadow where suspicion
grows slowly, and reach the green exit door unseen. Get caught in the beam
and the alarm fills — break the line of sight and it fades again, so a near
miss is a scare, not a sentence.

Two floors: the Reading Room, then the Vault, where the strongroom door is
watched twice over.

## Play it

The game is plain static files in `game/` — no build step, no network.
Serve the folder with anything, for example the tiny server bundled here:

```
node serve.ts            # then open http://localhost:8080
```

**Controls** — WASD or arrow keys move, hold **Shift** to sneak (slower,
harder to spot), **R** restarts a floor, **Enter** or the mouse drives the
menus. Footsteps are synthesized live: a warden's boots grow louder as he
nears, so your ears can steer you before your eyes can.

## How it is put together

- `game/src/config.js` — sizes, speeds, vision and palette
- `game/src/levels.js` — the two floors and their patrol routes
- `game/src/geometry.js` — tile queries, raycasts and line of sight
- `game/src/guards.js` — warden patrols and their lamp-cone polygons
- `game/src/player.js` — the courier's movement and wall-sliding collision
- `game/src/detection.js` — the alarm meter: fill, shadow, sneak, recovery
- `game/src/audio.js` — a WebAudio sound kit; no audio files
- `game/src/render.js` — the canvas drawing: floor, cones, actors, screens
- `game/src/shots.js` — deterministic scenes for the screenshots (`?shot=`)
- `game/src/main.js` — boot, input and the frame loop

## Handing it in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to the output directory and writes `dossier.json` with `buildDossier` from
`vendor/makefun-game.ts`, the kit's library, vendored unchanged:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Licensed under MIT — see `LICENSE`.
