// Quiet Vault — the courier: smooth keyboard movement with tile collision,
// a facing that follows the last move, and a footstep stride counter the
// sound kit listens to.

import {
  TILE, PLAYER_SPEED, PLAYER_SNEAK_SPEED, PLAYER_RADIUS,
} from './config.js';
import { discBlocked } from './geometry.js';

export class Player {
  constructor(startTile) {
    this.startX = (startTile.x + 0.5) * TILE;
    this.startY = (startTile.y + 0.5) * TILE;
    this.reset();
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.facing = 0; // east
    this.moving = false;
    this.sneaking = false;
    this.stride = 0; // px walked since the last footstep sound
  }

  // input: {x: -1..1, y: -1..1, sneak: boolean} from the keyboard each frame.
  update(dt, input, grid) {
    this.sneaking = Boolean(input.sneak);
    const speed = this.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_SPEED;
    let vx = input.x;
    let vy = input.y;
    const len = Math.hypot(vx, vy);
    this.moving = len > 0;
    this.stride = 0;
    if (!this.moving) return;
    vx /= len;
    vy /= len;
    this.facing = Math.atan2(vy, vx);
    // Move one axis at a time so the courier slides along walls and crates
    // instead of sticking to them.
    const stepX = vx * speed * dt;
    const stepY = vy * speed * dt;
    if (!discBlocked(grid, this.x + stepX, this.y, PLAYER_RADIUS)) {
      this.x += stepX;
      this.stride += Math.abs(stepX);
    }
    if (!discBlocked(grid, this.x, this.y + stepY, PLAYER_RADIUS)) {
      this.y += stepY;
      this.stride += Math.abs(stepY);
    }
  }

  get radius() {
    return PLAYER_RADIUS;
  }
}
