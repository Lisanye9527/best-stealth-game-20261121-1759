// Quiet Vault — shared constants: sizes, speeds, vision and the colour palette.
// Everything visual or tunable lives here so the other modules stay about logic.

export const TILE = 40;
export const COLS = 24;
export const ROWS = 15;
export const FIELD_W = COLS * TILE; // 960
export const FIELD_H = ROWS * TILE; // 600
export const HUD_H = 60;
export const VIEW_W = FIELD_W;
export const VIEW_H = FIELD_H + HUD_H; // 660

export const PLAYER_SPEED = 152; // px per second, normal walk
export const PLAYER_SNEAK_SPEED = 84; // px per second while Shift is held
export const PLAYER_RADIUS = 13;

export const GUARD_RADIUS = 14;
export const GUARD_TURN_RATE = 3.4; // radians per second a guard can swing round
export const VISION_RANGE = 182; // px a flashlight beam reaches
export const VISION_HALF_ANGLE = 0.58; // radians, half the cone's spread

export const DETECTION_FILL = 0.8; // alarm gained per second at point blank
export const DETECTION_DRAIN = 0.4; // alarm lost per second while unseen
export const SHADOW_FACTOR = 0.45; // detection multiplier standing in shadow
export const SNEAK_FACTOR = 0.6; // detection multiplier while sneaking

export const COLORS = {
  pageBg: '#07090f',
  hudBg: '#0d1120',
  hudLine: '#232c47',
  hudText: '#c9d4f2',
  hudDim: '#6d7ba3',
  floorA: '#1b2138',
  floorB: '#1e2540',
  floorLine: 'rgba(120, 140, 200, 0.05)',
  shadowFloor: '#11152a',
  moonPool: 'rgba(140, 170, 255, 0.055)',
  wall: '#39406b',
  wallTop: '#4d578a',
  wallEdge: '#232946',
  crate: '#8a6a42',
  crateDark: '#6e5433',
  crateLine: '#543f24',
  shelf: '#4a3a5e',
  shelfDark: '#382b47',
  exitGlow: '#39e6a3',
  exitDoor: '#14532d',
  player: '#2dd4bf',
  playerDark: '#0f766e',
  guard: '#e05252',
  guardDark: '#7f1d1d',
  guardCap: '#991b1b',
  coneCalm: '255, 205, 92',
  coneAlarmed: '255, 84, 60',
  alarm: '#ff5147',
  gold: '#f5c451',
  parchment: '#e8e3d3',
};
