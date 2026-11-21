// Quiet Vault — the wardens: patrol movement, lamp vision, and spotting.
//
// A warden walks his waypoint loop, waits at each post sweeping his lamp,
// then moves on. His lamp is a cone: fixed range and spread, blocked by walls
// and cover, computed as a polygon of rays so the light pools and cuts off
// exactly the way a player expects.

import {
  TILE, GUARD_RADIUS, GUARD_TURN_RATE, VISION_RANGE, VISION_HALF_ANGLE,
} from './config.js';
import {
  castRay, hasLineOfSight, angleDifference, turnToward,
} from './geometry.js';

const BASE_PATROL_SPEED = 62; // px per second before the level's multiplier
const CONE_RAYS = 28; // rays fanned across the cone to shape its polygon

export class Guard {
  constructor(definition, grid, index = 0) {
    this.grid = grid;
    this.waypoints = definition.path.map(([tx, ty]) => ({
      x: (tx + 0.5) * TILE,
      y: (ty + 0.5) * TILE,
    }));
    this.speed = BASE_PATROL_SPEED * (definition.speed ?? 1);
    this.pauseTime = definition.pause ?? 1;
    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    this.targetIndex = this.waypoints.length > 1 ? 1 : 0;
    const next = this.waypoints[this.targetIndex];
    this.facing = Math.atan2(next.y - this.y, next.x - this.x);
    this.state = 'patrol'; // 'patrol' | 'pause'
    this.waited = 0;
    this.scanPhase = index * 1.7; // fixed per post, so a staged screenshot replays the same sweep
    this.alert = 0; // 0 calm .. 1 has eyes on the courier right now
    this.stepAccumulator = 0; // distance walked since the last footstep
    this.strideBank = 0; // px walked since the last warden footstep sound
  }

  // Direction the lamp points while paused: a slow sweep around the heading
  // the warden arrived with, so a patient player can time the gap.
  facingNow(time) {
    if (this.state !== 'pause') return this.facing;
    return this.facing + Math.sin(time * 1.4 + this.scanPhase) * 0.65;
  }

  update(dt, time) {
    this.stepAccumulator = 0;
    if (this.state === 'pause') {
      this.waited += dt;
      if (this.waited >= this.pauseTime) {
        this.waited = 0;
        this.state = 'patrol';
        this.targetIndex = (this.targetIndex + 1) % this.waypoints.length;
      }
      return;
    }
    const target = this.waypoints[this.targetIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 3) {
      this.x = target.x;
      this.y = target.y;
      this.state = this.waypoints.length > 1 ? 'pause' : 'patrol';
      this.waited = 0;
      return;
    }
    const wanted = Math.atan2(dy, dx);
    this.facing = turnToward(this.facing, wanted, GUARD_TURN_RATE * dt);
    // Walk mostly along facing so a turning warden drifts like a person, but
    // always make progress toward the post.
    const stepLen = Math.min(dist, this.speed * dt);
    this.x += (dx / dist) * stepLen;
    this.y += (dy / dist) * stepLen;
    this.stepAccumulator = stepLen;
  }

  // The lamp's lit polygon: fan rays across the cone, each stopped by the
  // first wall or cover it meets. Points are ordered for a single fill.
  visionPolygon(time) {
    const facing = this.facingNow(time);
    const points = [{ x: this.x, y: this.y }];
    for (let i = 0; i <= CONE_RAYS; i++) {
      const angle = facing - VISION_HALF_ANGLE + (2 * VISION_HALF_ANGLE * i) / CONE_RAYS;
      const d = castRay(this.grid, this.x, this.y, angle, VISION_RANGE);
      points.push({ x: this.x + Math.cos(angle) * d, y: this.y + Math.sin(angle) * d });
    }
    return points;
  }

  // Can this warden see the point (px, py) right now? Inside the cone's
  // range and spread, with no wall or cover in the way. Returns the
  // closeness 0..1 (1 = under his nose) or -1 when he cannot see it.
  seesPoint(px, py, time) {
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > VISION_RANGE) return -1;
    const facing = this.facingNow(time);
    const off = Math.abs(angleDifference(facing, Math.atan2(dy, dx)));
    if (off > VISION_HALF_ANGLE) return -1;
    if (!hasLineOfSight(this.grid, this.x, this.y, px, py)) return -1;
    return 1 - dist / VISION_RANGE;
  }

  get radius() {
    return GUARD_RADIUS;
  }
}
