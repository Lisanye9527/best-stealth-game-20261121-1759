// Quiet Vault — the wardens and their lamps.
//
// A warden walks his route one waypoint at a time: walk, wait, sweep
// his lamp from side to side, walk on. His heading is where his lamp
// points, and it turns smoothly rather than snapping, so a player
// watching the cone can read where it is going next. The same object
// answers the only question the alarm asks — "how clearly is the
// courier in this lamp right now?" — as a number from 0 to 1.

import {
  CONE_HALF,
  CONE_RANGE,
  CONE_RAYS,
  GUARD_PAUSE,
  GUARD_RADIUS,
  GUARD_SCAN,
  GUARD_SPEED,
  SPOT_NEAR,
} from './config.js';
import { angleDelta, conePolygon, losClear, moveWithWalls } from './geometry.js';

const TURN_RATE = 3.4;
const SCAN_SWEEP = 0.85;

export class Warden {
  constructor(waypoints, phase = 0) {
    this.route = waypoints;
    this.leg = 0;
    const first = waypoints[0];
    this.x = first.x;
    this.y = first.y;
    this.heading = 0;
    this.mode = 'walk';
    this.timer = phase;
    this.scanBase = 0;
    this.scanSign = 1;
    this.stepAcc = 0;
    this.stepped = false;
    this.exposure = 0;
    this.aimNext();
  }

  aimNext() {
    const target = this.route[(this.leg + 1) % this.route.length];
    this.heading = Math.atan2(target.y - this.y, target.x - this.x);
  }

  // One tick of patrol. Returns nothing; the warden's exposure field
  // is refreshed by exposureTo, which the frame loop calls after
  // every warden has moved.
  update(dt, grid) {
    this.stepped = false;
    if (this.mode === 'walk') {
      const target = this.route[(this.leg + 1) % this.route.length];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      const want = Math.atan2(dy, dx);
      this.heading += Math.max(-TURN_RATE * dt, Math.min(TURN_RATE * dt, angleDelta(this.heading, want)));
      if (dist < 6) {
        this.leg = (this.leg + 1) % this.route.length;
        this.mode = 'pause';
        this.timer = GUARD_PAUSE;
        this.scanBase = this.heading;
        return;
      }
      const step = Math.min(GUARD_SPEED * dt, dist);
      const moved = moveWithWalls(grid, this.x, this.y, (dx / dist) * step, (dy / dist) * step, GUARD_RADIUS);
      const travelled = Math.hypot(moved.x - this.x, moved.y - this.y);
      this.x = moved.x;
      this.y = moved.y;
      this.stepAcc += travelled;
      if (this.stepAcc >= 34) {
        this.stepAcc -= 34;
        this.stepped = true;
      }
      if (moved.blockedX && moved.blockedY) {
        // A crate wandered onto the route (it cannot — routes are
        // drawn on open floor — but never stand still forever).
        this.leg = (this.leg + 1) % this.route.length;
        this.aimNext();
      }
    } else if (this.mode === 'pause') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.mode = 'scan';
        this.timer = GUARD_SCAN;
        this.scanSign = 1;
      }
    } else {
      // Scan: sweep the lamp across the base heading and back.
      this.timer -= dt;
      const sweep = Math.sin((1 - this.timer / GUARD_SCAN) * Math.PI) * SCAN_SWEEP * this.scanSign;
      this.heading = this.scanBase + sweep;
      if (this.timer <= 0) {
        this.mode = 'walk';
        this.aimNext();
      }
    }
  }

  // How clearly this warden sees the courier, 0 (not at all) to 1
  // (dead centre, point blank). Near misses count: the falloff with
  // distance is gentle, and being close but off-axis still counts
  // for something, so the cone edge feels dangerous.
  exposureTo(grid, courier) {
    const dx = courier.x - this.x;
    const dy = courier.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= SPOT_NEAR) {
      this.exposure = 1;
      return 1;
    }
    if (dist > CONE_RANGE) {
      this.exposure = 0;
      return 0;
    }
    const toCourier = Math.atan2(dy, dx);
    const off = Math.abs(angleDelta(this.heading, toCourier));
    if (off > CONE_HALF) {
      this.exposure = 0;
      return 0;
    }
    if (!losClear(grid, this.x, this.y, courier.x, courier.y)) {
      this.exposure = 0;
      return 0;
    }
    const along = 1 - dist / CONE_RANGE;
    const across = 1 - off / CONE_HALF;
    const value = Math.max(0, Math.min(1, 0.25 + 0.75 * (along * 0.6 + across * 0.4)));
    this.exposure = value;
    return value;
  }

  // The lit polygon, for the renderer. Hot when the courier is in it.
  lampPolygon(grid) {
    return conePolygon(grid, this.x, this.y, this.heading, CONE_RANGE, CONE_HALF, CONE_RAYS);
  }
}
