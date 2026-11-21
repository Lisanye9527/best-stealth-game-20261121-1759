// Quiet Vault — the courier.
//
// The player is a circle with a heading. Movement is the four keys as
// a unit vector, scaled by the sneak state; the circle slides along
// walls instead of sticking to them. Footsteps are counted in distance
// travelled, not in time, so standing still is always silent and the
// sound kit can spend one tick per stride.

import { PLAYER_RADIUS, SNEAK_SPEED, STEP_LENGTH, WALK_SPEED } from './config.js';
import { moveWithWalls, shadowAt } from './geometry.js';

export class Courier {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.heading = 0;
    this.sneaking = false;
    this.moving = false;
    this.stepAcc = 0;
    this.stepped = false;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.heading = 0;
    this.sneaking = false;
    this.moving = false;
    this.stepAcc = 0;
    this.stepped = false;
  }

  // input: { x, y } each in -1..1, already combined from the keys.
  // sneak: whether Shift is held. Returns nothing; the step flag is
  // read by the frame loop to play one footstep per stride.
  update(dt, grid, input, sneak) {
    this.stepped = false;
    this.sneaking = sneak;
    const len = Math.hypot(input.x, input.y);
    this.moving = len > 0.01;
    if (!this.moving) return;
    const nx = input.x / len;
    const ny = input.y / len;
    const speed = sneak ? SNEAK_SPEED : WALK_SPEED;
    const moved = moveWithWalls(grid, this.x, this.y, nx * speed * dt, ny * speed * dt, PLAYER_RADIUS);
    const travelled = Math.hypot(moved.x - this.x, moved.y - this.y);
    this.x = moved.x;
    this.y = moved.y;
    if (travelled > 0.01) {
      this.heading = Math.atan2(moved.y - this.y, moved.x - this.x);
      this.stepAcc += travelled;
      if (this.stepAcc >= STEP_LENGTH) {
        this.stepAcc -= STEP_LENGTH;
        this.stepped = true;
      }
    }
  }

  // Is the courier standing in hatched shadow this frame?
  inShadow(grid) {
    return shadowAt(grid, this.x, this.y);
  }
}
