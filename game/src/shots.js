// Quiet Vault — screenshot staging. The entry's screenshots are real renders
// of this code in a browser; opening the game with ?shot=<name> freezes a
// composed, deterministic scene (patrols held, alarm set) so the cover frame
// shows the game at its most complete instead of whatever a timer caught.
//
//   ?shot=title   the title screen over a lamplit floor
//   ?shot=cover   floor one, mid-run: the courier lit at a lamp's edge
//   ?shot=level2  floor two, mid-run outside the strongroom door
//   ?shot=alarm   the moment before capture: alarm nearly full, lamp red

import { TILE } from './config.js';

export function readShotName() {
  return new URLSearchParams(window.location.search).get('shot');
}

function placePlayer(game, tileX, tileY, facing) {
  game.player.x = (tileX + 0.5) * TILE;
  game.player.y = (tileY + 0.5) * TILE;
  game.player.facing = facing;
}

function placeGuard(guard, tileX, tileY, facing, alert) {
  guard.x = (tileX + 0.5) * TILE;
  guard.y = (tileY + 0.5) * TILE;
  guard.facing = facing;
  guard.state = 'patrol';
  guard.alert = alert;
}

export function stageShot(game, name) {
  game.staged = true;
  if (name === 'title') {
    game.loadLevel(0);
    game.state = 'title';
    placePlayer(game, 9, 7, 0.4);
    placeGuard(game.guards[0], 13, 2, Math.PI / 2, 0);
    placeGuard(game.guards[1], 20, 6, Math.PI, 0);
    placeGuard(game.guards[2], 7, 12, 0, 0);
    game.elapsed = 0;
  } else if (name === 'cover') {
    game.loadLevel(0);
    game.state = 'playing';
    placePlayer(game, 13, 7, -Math.PI / 2);
    placeGuard(game.guards[0], 13, 3, Math.PI / 2, 0.85);
    placeGuard(game.guards[1], 20, 5, Math.PI, 0);
    placeGuard(game.guards[2], 6, 12, 0, 0);
    game.detection = 0.45;
    game.elapsed = 64;
  } else if (name === 'level2') {
    game.loadLevel(1);
    game.state = 'playing';
    placePlayer(game, 10, 7, 0);
    placeGuard(game.guards[0], 6, 2, Math.PI / 2, 0);
    placeGuard(game.guards[1], 16, 5, Math.PI, 0);
    placeGuard(game.guards[2], 13, 10, -Math.PI / 2, 0.35);
    placeGuard(game.guards[3], 21, 11, Math.PI, 0);
    game.detection = 0.3;
    game.elapsed = 131;
  } else if (name === 'alarm') {
    game.loadLevel(0);
    game.state = 'playing';
    placePlayer(game, 14, 4, Math.PI);
    placeGuard(game.guards[0], 13, 3, Math.PI / 4, 1);
    placeGuard(game.guards[1], 20, 8, -Math.PI / 2, 0);
    placeGuard(game.guards[2], 8, 12, 0, 0);
    game.detection = 0.93;
    game.everSpotted = true;
    game.elapsed = 38;
  }
}
