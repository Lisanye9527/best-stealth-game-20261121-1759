// Quiet Vault — the alarm: how fast the wardens' suspicion fills and fades.
//
// Being seen fills the meter; the closer the warden and the brighter the
// floor, the faster it fills. Shadowed floor and sneaking both slow it, so a
// player caught at the cone's edge has a real chance to break away and let
// the meter drain — that recovery chance is the heart of the game.

import {
  TILE, DETECTION_FILL, DETECTION_DRAIN, SHADOW_FACTOR, SNEAK_FACTOR,
} from './config.js';
import { floorCharAt } from './geometry.js';

// game: { detection, guards, player, grid, spotted (bool, latches per run) }
// Returns { seenNow, closestGuard } for the renderer and the sound kit.
export function updateDetection(game, dt, time) {
  const { guards, player, grid } = game;
  let seenNow = false;
  let closestGuard = null;
  let bestCloseness = -1;

  for (const guard of guards) {
    const closeness = guard.seesPoint(player.x, player.y, time);
    if (closeness >= 0) {
      seenNow = true;
      if (closeness > bestCloseness) {
        bestCloseness = closeness;
        closestGuard = guard;
      }
    }
    // Each warden's own lamp colour follows whether he personally sees her.
    const target = closeness >= 0 ? 1 : 0;
    guard.alert += (target - guard.alert) * Math.min(1, dt * 7);
  }

  if (seenNow) {
    let fill = DETECTION_FILL * (0.35 + 0.65 * bestCloseness);
    if (floorCharAt(grid, player.x, player.y) === ':') fill *= SHADOW_FACTOR;
    if (player.sneaking) fill *= SNEAK_FACTOR;
    game.detection = Math.min(1, game.detection + fill * dt);
    game.everSpotted = true;
  } else {
    game.detection = Math.max(0, game.detection - DETECTION_DRAIN * dt);
  }

  return { seenNow, closestGuard };
}

// Standing on the warden's boots is being caught, seen or not.
export function touchesGuard(game) {
  const { guards, player } = game;
  for (const guard of guards) {
    const d = Math.hypot(guard.x - player.x, guard.y - player.y);
    if (d < guard.radius + player.radius - 4) return guard;
  }
  return null;
}

// Is the courier standing on an exit tile?
export function onExit(game) {
  const { player, exits } = game;
  return exits.some(
    (e) => Math.floor(player.x / TILE) === e.x && Math.floor(player.y / TILE) === e.y,
  );
}
