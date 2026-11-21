// Quiet Vault — the two floors of the archive and the wardens who patrol them.
//
// Grid legend:
//   '#' stone wall        — blocks walking and sight
//   'C' packing crate     — cover: blocks walking and sight
//   '=' bookcase          — cover: blocks walking and sight
//   ':' shadowed floor    — walkable; detection fills slower here
//   '.' lamplit floor     — walkable
//   'P' courier's entry   — walkable floor
//   'E' exit door         — reach it unseen to clear the floor
//
// Guard patrols are waypoint lists in tile coordinates. A warden walks the
// loop at `speed` (a multiplier on the base patrol speed), waits `pause`
// seconds at each waypoint, and sweeps his lamp while he waits.

export const LEVELS = [
  {
    name: 'Floor One — The Reading Room',
    brief: 'Cross the reading room and slip out of the east door, unseen.',
    grid: [
      '########################',
      '#P.....#.......#.......#',
      '#......#...C...#...:...#',
      '#..##..#...C...#.......#',
      '#..##......C...##.##...#',
      '#......##.##...........#',
      '#..==......##..C.......#',
      '#..==..##......C...#...#',
      '#......##..:.......#..E#',
      '#..:.......##..C...#...#',
      '#......##......C.......#',
      '#..C...##..##......##..#',
      '#..C.......##..:.......#',
      '#......##......##......#',
      '########################',
    ],
    guards: [
      { path: [[13, 1], [13, 4]], speed: 1.0, pause: 1.1 },
      { path: [[20, 4], [20, 10]], speed: 0.9, pause: 1.3 },
      { path: [[5, 12], [10, 12]], speed: 1.05, pause: 0.9 },
    ],
  },
  {
    name: 'Floor Two — The Vault',
    brief: 'The strongroom door is guarded twice over. Patience, courier.',
    grid: [
      '########################',
      '#P..#......#.....#.....#',
      '#...#..CC..#..C..#..:..#',
      '#...#..CC..#..C.....##.#',
      '##.##......##.###......#',
      '#......##..........C...#',
      '#..==..##..####..C..#..#',
      '#..==.......EE#.....#..#',
      '#..==..##..####..C.....#',
      '#......##..........##.##',
      '#..:.......C....C......#',
      '#..##..##......##..C...#',
      '#......##..:.......#...#',
      '#....C.....##..........#',
      '########################',
    ],
    guards: [
      { path: [[6, 3], [6, 1]], speed: 1.1, pause: 0.8 },
      { path: [[13, 5], [18, 5]], speed: 1.15, pause: 0.7 },
      { path: [[12, 10], [15, 10]], speed: 1.0, pause: 1.0 },
      { path: [[21, 10], [21, 12]], speed: 1.2, pause: 0.6 },
    ],
  },
];

// Scan a level's grid for the courier's entry tile and the exit tiles.
// Returns pixel-free tile coordinates; callers convert with TILE.
export function scanLevel(level) {
  let start = null;
  const exits = [];
  level.grid.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === 'P') start = { x, y };
      if (ch === 'E') exits.push({ x, y });
    });
  });
  return { start, exits };
}
