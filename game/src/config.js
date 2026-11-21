// Quiet Vault — tuning table.
//
// Every number the game runs on lives here, in one place, so a balance
// change never means hunting through the actors. Distances are pixels,
// speeds are pixels per second, angles are radians. The playfield is a
// 24 by 14 tile grid drawn at 48 pixels a tile, centred on a 1280x800
// canvas with a slim strip top and bottom for the HUD and the hints.

export const TILE = 48;
export const COLS = 24;
export const ROWS = 14;

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const ORIGIN_X = 64;
export const ORIGIN_Y = 72;

export const WALK_SPEED = 178;
export const SNEAK_SPEED = 96;
export const GUARD_SPEED = 74;

// How long a warden waits at a waypoint, then sweeps his lamp, before
// walking on. The pause is the window a patient player walks through.
export const GUARD_PAUSE = 1.1;
export const GUARD_SCAN = 0.9;

// The lamp cone: how far it reaches, how wide it opens, and how many
// rays the renderer casts to bend it around walls and crates.
export const CONE_RANGE = 235;
export const CONE_HALF = 0.56;
export const CONE_RAYS = 19;

// Inside this distance a warden sees the courier outright, cone or not:
// you cannot brush past a guard in the dark.
export const SPOT_NEAR = 46;

// The alarm fills this fast per second at point blank, out in the open,
// walking upright. Sneaking and shadow each slow it down.
export const FILL_RATE = 0.85;
export const DECAY_RATE = 0.28;
export const SNEAK_FACTOR = 0.45;
export const SHADOW_FACTOR = 0.35;

export const PLAYER_RADIUS = 13;
export const GUARD_RADIUS = 15;
export const STEP_LENGTH = 34;

export const PALETTE = {
  page: '#0b0e14',
  floorA: '#20242e',
  floorB: '#1b1f28',
  floorEdge: '#2c3242',
  wall: '#0e1118',
  wallTop: '#3a4152',
  crate: '#6b5433',
  crateEdge: '#8a6f45',
  shadow: '#141a26',
  shadowHatch: '#232c3d',
  exit: '#3ddc84',
  exitDark: '#1d7a4a',
  cone: 'rgba(255, 196, 66, 0.30)',
  coneEdge: 'rgba(255, 196, 66, 0.55)',
  coneHot: 'rgba(255, 120, 60, 0.38)',
  guard: '#c8ccd4',
  guardCoat: '#5a3d2b',
  lamp: '#ffd166',
  courier: '#7dd3fc',
  courierCloak: '#155e75',
  hud: '#e8e6df',
  hudDim: '#9aa3b2',
  alarmLow: '#3ddc84',
  alarmMid: '#ffd166',
  alarmHigh: '#ff5d5d',
  banner: 'rgba(8, 10, 16, 0.82)',
};

// The alarm thresholds the HUD and the warden barks react to.
export const ALARM_WARN = 0.35;
export const ALARM_HOT = 0.7;
