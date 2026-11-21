// Quiet Vault — boot, input, the state machine and the frame loop.
//
// States: title → playing → (caught → playing) / (clear → playing) → won.
// The loop updates the world only in 'playing'; every state renders through
// render.js, and menu buttons are laid out there and hit-tested here.

import { LEVELS, scanLevel } from './levels.js';
import { Guard } from './guards.js';
import { Player } from './player.js';
import { updateDetection, touchesGuard, onExit } from './detection.js';
import { SoundKit } from './audio.js';
import { drawScene, layoutButtons } from './render.js';
import { readShotName, stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');
const sound = new SoundKit();

const game = {
  state: 'title',
  levelIndex: 0,
  level: null,
  grid: null,
  guards: [],
  player: null,
  exits: [],
  detection: 0,
  everSpotted: false,
  elapsed: 0,
  attempts: 0,
  stateTime: 0,
  staged: false,
  seenNow: false,

  loadLevel(index) {
    this.levelIndex = index;
    this.level = LEVELS[index];
    this.grid = this.level.grid;
    const { start, exits } = scanLevel(this.level);
    this.exits = exits;
    this.player = new Player(start);
    this.guards = this.level.guards.map((def) => new Guard(def, this.grid));
    this.detection = 0;
    this.everSpotted = false;
    this.seenNow = false;
  },
};

function announce(text) {
  if (statusLine) statusLine.textContent = text;
}

function setState(next) {
  game.state = next;
  game.stateTime = 0;
  if (next === 'playing') announce(`${game.level.name}. Reach the exit unseen.`);
  if (next === 'caught') announce('Spotted! The wardens caught you. Try the floor again.');
  if (next === 'clear') announce('Floor cleared. One floor deeper.');
  if (next === 'won') announce('The vault is empty. You were never there. You win.');
}

function startRun() {
  game.attempts = 0;
  game.elapsed = 0;
  game.loadLevel(0);
  setState('playing');
}

function pressButton(id) {
  sound.ensure();
  sound.click();
  if (id === 'start' || id === 'again') startRun();
  else if (id === 'retry') { game.loadLevel(game.levelIndex); setState('playing'); }
  else if (id === 'continue') { game.loadLevel(game.levelIndex + 1); setState('playing'); }
}

// ------------------------------------------------------------- input

const keysDown = new Set();

window.addEventListener('keydown', (event) => {
  sound.ensure();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
  if (event.repeat) return;
  keysDown.add(event.code);
  if (event.code === 'Enter' || event.code === 'Space') {
    const [first] = layoutButtons(game);
    if (first) pressButton(first.id);
  }
  if (event.code === 'KeyR') {
    if (game.state === 'playing' && !game.staged) { game.loadLevel(game.levelIndex); setState('playing'); }
    else if (game.state === 'caught') pressButton('retry');
  }
});

window.addEventListener('keyup', (event) => keysDown.delete(event.code));
window.addEventListener('blur', () => keysDown.clear());

canvas.addEventListener('click', (event) => {
  sound.ensure();
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (canvas.width / rect.width);
  const y = (event.clientY - rect.top) * (canvas.height / rect.height);
  for (const b of layoutButtons(game)) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      pressButton(b.id);
      return;
    }
  }
});

function readInput() {
  const has = (...codes) => codes.some((c) => keysDown.has(c));
  return {
    x: (has('KeyD', 'ArrowRight') ? 1 : 0) - (has('KeyA', 'ArrowLeft') ? 1 : 0),
    y: (has('KeyS', 'ArrowDown') ? 1 : 0) - (has('KeyW', 'ArrowUp') ? 1 : 0),
    sneak: has('ShiftLeft', 'ShiftRight'),
  };
}

// ------------------------------------------------------------- the loop

let lastStamp = performance.now();
let courierStrideBank = 0;

function frame(now) {
  const dt = Math.min(0.05, (now - lastStamp) / 1000);
  lastStamp = now;
  const time = now / 1000;
  game.stateTime += dt;

  if (game.state === 'playing' && !game.staged) {
    game.elapsed += dt;
    for (const guard of game.guards) {
      guard.update(dt, time);
      guard.strideBank = (guard.strideBank ?? 0) + guard.stepAccumulator;
      if (guard.strideBank > 26) {
        guard.strideBank = 0;
        const d = Math.hypot(guard.x - game.player.x, guard.y - game.player.y);
        sound.wardenStep(Math.max(0, 1 - d / 430));
      }
    }
    game.player.update(dt, readInput(), game.grid);
    courierStrideBank += game.player.stride;
    const strideAt = game.player.sneaking ? 20 : 27;
    if (courierStrideBank > strideAt) {
      courierStrideBank = 0;
      sound.courierStep(game.player.sneaking);
    }

    const { seenNow } = updateDetection(game, dt, time);
    game.seenNow = seenNow;

    if (game.detection >= 1 || touchesGuard(game)) {
      game.attempts += 1;
      sound.alarm();
      setState('caught');
    } else if (onExit(game)) {
      sound.chime();
      setState(game.levelIndex + 1 >= LEVELS.length ? 'won' : 'clear');
    }
  }

  drawScene(ctx, game, time);
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------- boot

game.loadLevel(0);
const shot = readShotName();
if (shot) stageShot(game, shot);
announce('Quiet Vault. Press Enter to begin the run.');
requestAnimationFrame(frame);

// A handle for automated play-tests (and curious players in devtools):
// window.__quietVault.state reads the state machine, .player the courier.
window.__quietVault = game;
