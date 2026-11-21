// Quiet Vault — boot, input and the frame loop.
//
// This is the only file the page loads. It builds one game object —
// floor, wardens, courier, alarm, sound, mode — and owns the loop
// that ticks it and the renderer that draws it. Modes: title, play,
// caught, clear, win. A ?shot= scene freezes the loop after staging,
// so a screenshot is one drawn frame of a real game state.

import { VIEW_H, VIEW_W } from './config.js';
import { FLOOR_COUNT, buildFloor } from './levels.js';
import { Warden } from './guards.js';
import { Courier } from './player.js';
import { Alarm } from './detection.js';
import { SoundKit } from './audio.js';
import { drawScene } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const game = {
  floor: null,
  floorIndex: 0,
  wardens: [],
  courier: null,
  alarm: new Alarm(),
  sound: new SoundKit(),
  mode: 'title',
  frozen: false,
  time: 0,
  loadFloor(index) {
    this.floorIndex = index;
    this.floor = buildFloor(index);
    this.wardens = this.floor.patrols.map((route, k) => new Warden(route, k * 0.7));
    if (this.courier) {
      this.courier.reset(this.floor.start.x, this.floor.start.y);
    } else {
      this.courier = new Courier(this.floor.start.x, this.floor.start.y);
    }
    this.alarm.reset();
    this.mode = 'play';
  },
};

game.loadFloor(0);
game.mode = 'title';

const keys = new Set();

function readInput() {
  let x = 0;
  let y = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
  const sneak = keys.has('ShiftLeft') || keys.has('ShiftRight');
  return { x, y, sneak };
}

function update(dt) {
  game.time += dt;
  const input = readInput();
  game.courier.update(dt, game.floor.grid, input, input.sneak);
  if (game.courier.stepped) {
    game.sound.footstep(320, game.courier.sneaking);
  }
  let exposure = 0;
  for (const warden of game.wardens) {
    warden.update(dt, game.floor.grid);
    if (warden.stepped) {
      const d = Math.hypot(warden.x - game.courier.x, warden.y - game.courier.y);
      game.sound.footstep(d, false);
    }
    const seen = warden.exposureTo(game.floor.grid, game.courier);
    if (seen > exposure) exposure = seen;
  }
  const shadow = game.courier.inShadow(game.floor.grid);
  game.alarm.update(dt, exposure, game.courier.sneaking, shadow);
  game.sound.alarmHum(game.alarm.value);
  if (game.alarm.caught) {
    game.mode = 'caught';
    game.sound.thud();
    game.sound.stopAlarm();
    return;
  }
  const exit = game.floor.exit;
  if (Math.hypot(game.courier.x - exit.x, game.courier.y - exit.y) < 26) {
    game.sound.chime();
    game.sound.stopAlarm();
    game.mode = game.floorIndex + 1 >= FLOOR_COUNT ? 'win' : 'clear';
  }
}

function pressStart() {
  if (game.mode === 'title') {
    game.mode = 'play';
  } else if (game.mode === 'clear') {
    game.loadFloor(game.floorIndex + 1);
  } else if (game.mode === 'win') {
    game.loadFloor(0);
    game.mode = 'title';
  }
}

window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
  game.sound.resume();
  if (event.code === 'Enter' || event.code === 'Space') {
    pressStart();
    return;
  }
  if (event.code === 'KeyR') {
    if (game.mode === 'caught' || game.mode === 'play') {
      game.loadFloor(game.floorIndex);
    }
    return;
  }
  keys.add(event.code);
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
});

canvas.addEventListener('mousedown', () => {
  game.sound.resume();
  pressStart();
});

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  applyShot(game, shot);
  game.frozen = true;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.frozen && game.mode === 'play') update(dt);
  drawScene(ctx, game);
  if (!window.__ready) window.__ready = true;
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Keep the canvas honest about its size if the page ever resizes it.
if (canvas.width !== VIEW_W || canvas.height !== VIEW_H) {
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
}
