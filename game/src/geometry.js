// Quiet Vault — grid and line-of-sight helpers.
// The level is a grid of characters; this module answers the three questions
// every other module asks: what tile is here, does this disc touch a wall,
// and can a guard at A actually see point B?

import { TILE } from './config.js';

// Tiles that block both walking and sight: stone wall, crate, bookcase.
export function isBlockingChar(ch) {
  return ch === '#' || ch === 'C' || ch === '=';
}

export function tileCharAt(grid, tileX, tileY) {
  if (tileY < 0 || tileY >= grid.length) return '#';
  const row = grid[tileY];
  if (tileX < 0 || tileX >= row.length) return '#';
  return row[tileX];
}

// Is the pixel point (x, y) inside a blocking tile?
export function pointBlocked(grid, x, y) {
  return isBlockingChar(tileCharAt(grid, Math.floor(x / TILE), Math.floor(y / TILE)));
}

// Does a disc of radius r around (x, y) overlap any blocking tile?
// Checks the disc's bounding box corners and edge midpoints — enough for the
// chunky tile sizes this game uses.
export function discBlocked(grid, x, y, r) {
  const probes = [
    [x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r],
    [x, y - r], [x, y + r], [x - r, y], [x + r, y],
  ];
  for (const [px, py] of probes) {
    if (pointBlocked(grid, px, py)) return true;
  }
  return false;
}

// The tile character under a pixel point, for floor effects like shadow.
export function floorCharAt(grid, x, y) {
  return tileCharAt(grid, Math.floor(x / TILE), Math.floor(y / TILE));
}

// March a ray from (x, y) along angle until it hits a blocking tile or runs
// out of range; returns the distance travelled. Steps are small (3 px) so a
// ray cannot tunnel through a one-tile wall.
export function castRay(grid, x, y, angle, maxDist) {
  const step = 3;
  const dx = Math.cos(angle) * step;
  const dy = Math.sin(angle) * step;
  let travelled = 0;
  let cx = x;
  let cy = y;
  while (travelled < maxDist) {
    cx += dx;
    cy += dy;
    travelled += step;
    if (pointBlocked(grid, cx, cy)) return travelled;
  }
  return maxDist;
}

// Straight-line sight between two points: sample the segment finely and fail
// if any sample lands inside a blocking tile. The endpoints themselves are
// exempt so an actor standing against a crate is not blinded by it.
export function hasLineOfSight(grid, x1, y1, x2, y2) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(1, Math.floor(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointBlocked(grid, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
  }
  return true;
}

// Smallest signed difference between two headings, in (-PI, PI].
export function angleDifference(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Turn heading `from` toward `to` by at most maxStep radians.
export function turnToward(from, to, maxStep) {
  const d = angleDifference(from, to);
  if (Math.abs(d) <= maxStep) return to;
  return from + Math.sign(d) * maxStep;
}
