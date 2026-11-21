// Quiet Vault — deterministic screenshot scenes.
//
// The game reads ?shot=<name> from the page address and stages one
// frozen moment: the frame loop keeps drawing but never updates, so
// the picture is the same every time it is taken. Each scene is a
// real position inside a real floor — a warden mid-patrol, the lamp
// on the courier, the alarm nearly full — never a drawing made for
// the camera. The cover is the game at its best: a cone sweeping
// across the reading room while the courier waits in the dark.

import { tileCenter } from './geometry.js';

export const SHOT_NAMES = ['cover', 'level2', 'alarm', 'title'];

function place(game, who, col, row) {
  const p = tileCenter(col, row);
  who.x = p.x;
  who.y = p.y;
}

export function applyShot(game, name) {
  if (name === 'cover') {
    game.loadFloor(0);
    place(game, game.courier, 10, 8);
    game.courier.heading = -Math.PI / 2;
    place(game, game.wardens[0], 17, 4);
    game.wardens[0].heading = 2.62;
    game.wardens[0].mode = 'pause';
    place(game, game.wardens[1], 8, 12);
    game.wardens[1].heading = -Math.PI / 2;
    game.wardens[1].mode = 'walk';
    place(game, game.wardens[2], 5, 3);
    game.wardens[2].heading = Math.PI / 2;
    game.alarm.value = 0.12;
    game.mode = 'play';
  } else if (name === 'level2') {
    game.loadFloor(1);
    place(game, game.courier, 2, 6);
    game.courier.heading = 0;
    game.courier.sneaking = true;
    place(game, game.wardens[0], 21, 6);
    game.wardens[0].heading = Math.PI;
    place(game, game.wardens[1], 12, 4);
    game.wardens[1].heading = Math.PI / 2;
    place(game, game.wardens[2], 4, 8);
    game.wardens[2].heading = -Math.PI / 2;
    game.alarm.value = 0.05;
    game.mode = 'play';
  } else if (name === 'alarm') {
    game.loadFloor(0);
    place(game, game.courier, 15, 4);
    game.courier.heading = Math.PI;
    place(game, game.wardens[0], 17, 4);
    game.wardens[0].heading = Math.PI;
    game.wardens[0].exposure = 0.9;
    place(game, game.wardens[1], 11, 12);
    game.wardens[1].heading = -Math.PI / 2;
    game.alarm.value = 0.86;
    game.mode = 'play';
  } else if (name === 'title') {
    game.loadFloor(0);
    game.mode = 'title';
  } else {
    game.loadFloor(0);
    game.mode = 'title';
  }
}
