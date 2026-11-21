// Quiet Vault — grid queries, rays and line of sight.
//
// The floor is a grid of characters. '#' is a wall, 'c' is a crate:
// both stop the courier and the wardens, and both block a lamp. 's' is
// hatched shadow floor, '.' is open floor. Everything here works in
// pixel space; the grid is only ever consulted tile by tile, so a
// half-open question — "is this point inside a wall?" — has exactly
// one answer.

import { COLS, ORIGIN_X, ORIGIN_Y, ROWS, TILE } from './config.js';

// Which tile a pixel sits in. Points outside the board report the
// nearest edge tile, so callers never index out of range.
export function tileOf(px, py) {
  const col = Math.floor((px - ORIGIN_X) / TILE);
  const row = Math.floor((py - ORIGIN_Y) / TILE);
  return {
    col: Math.max(0, Math.min(COLS - 1, col)),
    row: Math.max(0, Math.min(ROWS - 1, row)),
  };
}

export function tileChar(grid, col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return '#';
  return grid[row][col];
}

export function tileCenter(col, row) {
  return { x: ORIGIN_X + col * TILE + TILE / 2, y: ORIGIN_Y + row * TILE + TILE / 2 };
}

// True when the tile under a pixel stops a body: walls and crates.
export function solidAt(grid, px, py) {
  const { col, row } = tileOf(px, py);
  const ch = tileChar(grid, col, row);
  return ch === '#' || ch === 'c';
}

// True when the tile under a pixel stops a lamp: same set as bodies.
export function blocksSight(grid, px, py) {
  return solidAt(grid, px, py);
}

// True when the tile under a pixel is hatched shadow floor.
export function shadowAt(grid, px, py) {
  const { col, row } = tileOf(px, py);
  return tileChar(grid, col, row) === 's';
}

// Is the straight segment between two points free of anything that
// blocks a lamp? Sampled every few pixels; the endpoints themselves
// are the lamp and the courier, so they are not tested.
export function losClear(grid, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const steps = Math.ceil(dist / 5);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (blocksSight(grid, ax + dx * t, ay + dy * t)) return false;
  }
  return true;
}

// March a ray out from an origin until it hits something that blocks
// a lamp or runs out of range. Returns the stopping point and how far
// it travelled, so a cone edge can end exactly on a wall.
export function castRay(grid, ox, oy, angle, maxDist) {
  const step = 4;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  let travelled = 0;
  while (travelled < maxDist) {
    const nx = ox + cos * (travelled + step);
    const ny = oy + sin * (travelled + step);
    if (blocksSight(grid, nx, ny)) break;
    travelled += step;
  }
  const d = Math.min(travelled, maxDist);
  return { x: ox + cos * d, y: oy + sin * d, dist: d };
}

// The polygon a lamp paints on the floor: the origin plus one ray
// endpoint per slice across the cone. A wall close by shortens its
// rays, so the cone bends around corners instead of shining through.
export function conePolygon(grid, ox, oy, angle, range, half, rays) {
  const points = [{ x: ox, y: oy }];
  for (let i = 0; i <= rays; i++) {
    const a = angle - half + (2 * half * i) / rays;
    const hit = castRay(grid, ox, oy, a, range);
    points.push({ x: hit.x, y: hit.y });
  }
  return points;
}

// Would a circle of radius r centred here overlap a solid tile? The
// centre and eight rim points are tested, which is enough for a body
// much smaller than a tile.
export function circleHitsSolid(grid, x, y, r) {
  if (solidAt(grid, x, y)) return true;
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    if (solidAt(grid, x + Math.cos(a) * r, y + Math.sin(a) * r)) return true;
  }
  return false;
}

// Move a circle by (dx, dy), sliding along walls: try the x step, then
// the y step, keeping whichever half does not collide. Returns the new
// position and whether each axis was blocked.
export function moveWithWalls(grid, x, y, dx, dy, r) {
  let blockedX = false;
  let blockedY = false;
  if (!circleHitsSolid(grid, x + dx, y, r)) {
    x += dx;
  } else {
    blockedX = true;
  }
  if (!circleHitsSolid(grid, x, y + dy, r)) {
    y += dy;
  } else {
    blockedY = true;
  }
  return { x, y, blockedX, blockedY };
}

// Shortest signed turn from one heading to another, in (-PI, PI].
export function angleDelta(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}
