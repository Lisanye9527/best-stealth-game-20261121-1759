// Quiet Vault — the two floors.
//
// A floor is drawn as text: '#' wall, '.' open floor, 'c' crate,
// 's' hatched shadow, 'P' where the courier starts, 'E' the green
// exit door. Patrols are tile waypoints a warden walks in order, then
// loops. buildFloor turns the text into the grid the game plays on
// and complains loudly if a floor is ragged or missing its start or
// its exit, so a typo fails at boot instead of mid-game.

import { tileCenter } from './geometry.js';

const READING_ROOM = {
  name: 'Floor 1 — Reading Room',
  sub: 'Slip past the wardens. Reach the green door unseen.',
  rows: [
    '########################',
    '#P....#.......#....s...#',
    '#.....#..c....#....s...#',
    '#..s..#.......#....#...#',
    '#.....#.......#....#.E.#',
    '#..c.......c.......#...#',
    '#.....#.......#....#...#',
    '#..s..#..c....#....s...#',
    '#.....#.......#....#...#',
    '#..c.......c.......#...#',
    '#.....#.......#....#.s.#',
    '#..s..#..c....#....#...#',
    '#......................#',
    '########################',
  ],
  // Right-hand stacks, the bottom corridor, the left stacks, the top
  // reading desks: four patrols whose pauses never quite line up.
  patrols: [
    [[17, 1], [17, 6], [17, 12]],
    [[1, 12], [11, 12], [22, 12]],
    [[5, 1], [5, 6], [5, 12]],
    [[8, 1], [13, 1], [13, 6], [8, 6]],
  ],
};

const THE_VAULT = {
  name: 'Floor 2 — The Vault',
  sub: 'The strongroom door is watched twice over. Be patient.',
  rows: [
    '########################',
    '#P...#....c.....#...s..#',
    '#....#....c.....#......#',
    '#.s..#....c.....#..c...#',
    '#....#..........#......#',
    '#.c..#..c....c..#..s...#',
    '#....#..........#......#',
    '#.s..#....c.....#..c...#',
    '#....#....c.....#......#',
    '#....#....c.....#..s...#',
    '#.c.......c.....#......#',
    '#....#....c.....#...E..#',
    '#......................#',
    '########################',
  ],
  // The strongroom aisle, the cross-vault patrol, the west wall.
  patrols: [
    [[21, 1], [21, 6], [21, 12]],
    [[8, 4], [15, 4], [15, 6], [8, 6]],
    [[4, 1], [4, 6], [4, 11]],
  ],
};

export const FLOORS = [READING_ROOM, THE_VAULT];
export const FLOOR_COUNT = FLOORS.length;

export function buildFloor(index) {
  const def = FLOORS[index];
  if (!def) throw new Error('no floor ' + index);
  const width = def.rows[0].length;
  const grid = [];
  let start = null;
  let exit = null;
  for (let row = 0; row < def.rows.length; row++) {
    const line = def.rows[row];
    if (line.length !== width) {
      throw new Error(def.name + ' row ' + row + ' is ' + line.length + ' wide, not ' + width);
    }
    const cells = [];
    for (let col = 0; col < width; col++) {
      const ch = line[col];
      if (ch === 'P') {
        if (start) throw new Error(def.name + ' has two starts');
        start = tileCenter(col, row);
        cells.push('.');
      } else if (ch === 'E') {
        if (exit) throw new Error(def.name + ' has two exits');
        exit = tileCenter(col, row);
        cells.push('E');
      } else if ('#.cs.'.includes(ch)) {
        cells.push(ch);
      } else {
        throw new Error(def.name + ' row ' + row + ' holds unknown tile ' + JSON.stringify(ch));
      }
    }
    grid.push(cells);
  }
  if (!start) throw new Error(def.name + ' has no start');
  if (!exit) throw new Error(def.name + ' has no exit');
  const patrols = def.patrols.map((route) =>
    route.map(([col, row]) => tileCenter(col, row)),
  );
  return { name: def.name, sub: def.sub, grid, start, exit, patrols };
}
