// Quiet Vault — everything the player sees: the lamplit archive, the wardens'
// lamp cones, the actors, the alarm meter, and the menu screens. Pure canvas,
// no images: every shape below is drawn from the game's own state each frame.

import {
  TILE, COLS, ROWS, FIELD_W, FIELD_H, HUD_H, VIEW_W, VIEW_H, COLORS,
} from './config.js';

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';
const BOOK_SPINES = ['#a44a3f', '#3f6ea4', '#c2a24d', '#5d8a4a', '#7a4a8a', '#b0763a'];

// Small stable hash so book spines and floor wear never flicker between frames.
function hash2(a, b) {
  let h = (a * 374761393 + b * 668265263) ^ 0x5bf03635;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function coneColor(alert, alpha) {
  const calm = COLORS.coneCalm.split(',').map(Number);
  const hot = COLORS.coneAlarmed.split(',').map(Number);
  const r = Math.round(lerp(calm[0], hot[0], alert));
  const g = Math.round(lerp(calm[1], hot[1], alert));
  const b = Math.round(lerp(calm[2], hot[2], alert));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Buttons the current screen offers; main.js hit-tests clicks against these.
export function layoutButtons(game) {
  const cx = VIEW_W / 2;
  const mk = (id, label, y) => ({ id, label, x: cx - 110, y, w: 220, h: 46 });
  switch (game.state) {
    case 'title': return [mk('start', 'Begin the run', VIEW_H - 150)];
    case 'caught': return [mk('retry', 'Try this floor again', VIEW_H - 190)];
    case 'clear': return [mk('continue', 'Down to the next floor', VIEW_H - 190)];
    case 'won': return [mk('again', 'Run it again', VIEW_H - 190)];
    default: return [];
  }
}

export function drawScene(ctx, game, time) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawHud(ctx, game);
  ctx.save();
  ctx.translate(0, HUD_H);
  drawFloor(ctx, game);
  drawExit(ctx, game, time);
  drawCoverAndWalls(ctx, game);
  drawExitLabels(ctx, game);
  drawCones(ctx, game, time);
  drawActors(ctx, game, time);
  drawVignette(ctx);
  ctx.restore();
  if (game.state !== 'playing') drawOverlay(ctx, game, time);
}

// ---------------------------------------------------------------- the HUD

function drawHud(ctx, game) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = COLORS.hudLine;
  ctx.fillRect(0, HUD_H - 1, VIEW_W, 1);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `16px ${SERIF}`;
  ctx.fillStyle = COLORS.parchment;
  ctx.fillText(game.level.name, 18, HUD_H / 2 - 8);
  ctx.font = `11px ${SANS}`;
  ctx.fillStyle = COLORS.hudDim;
  ctx.fillText('Reach the green door unseen', 18, HUD_H / 2 + 13);

  // The alarm meter: an eye that opens as the meter fills.
  const meterW = 250;
  const meterX = VIEW_W / 2 - meterW / 2;
  const meterY = HUD_H / 2 - 8;
  ctx.font = `11px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = game.detection > 0.02 ? COLORS.alarm : COLORS.hudDim;
  ctx.fillText('A L A R M', VIEW_W / 2, meterY - 12);
  ctx.fillStyle = '#05070d';
  ctx.fillRect(meterX, meterY, meterW, 14);
  if (game.detection > 0) {
    const grad = ctx.createLinearGradient(meterX, 0, meterX + meterW, 0);
    grad.addColorStop(0, '#f5c451');
    grad.addColorStop(1, '#ff5147');
    ctx.fillStyle = grad;
    ctx.fillRect(meterX, meterY, meterW * game.detection, 14);
  }
  ctx.strokeStyle = COLORS.hudLine;
  ctx.strokeRect(meterX, meterY, meterW, 14);
  drawEye(ctx, VIEW_W / 2 + meterW / 2 + 26, HUD_H / 2, game.detection);

  ctx.textAlign = 'right';
  ctx.font = `15px ${SANS}`;
  ctx.fillStyle = COLORS.hudText;
  const mm = String(Math.floor(game.elapsed / 60)).padStart(2, '0');
  const ss = String(Math.floor(game.elapsed % 60)).padStart(2, '0');
  ctx.fillText(`${mm}:${ss}`, VIEW_W - 18, HUD_H / 2 - 8);
  ctx.font = `11px ${SANS}`;
  ctx.fillStyle = COLORS.hudDim;
  ctx.fillText(`caught ${game.attempts}×`, VIEW_W - 18, HUD_H / 2 + 13);
}

function drawEye(ctx, x, y, openness) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = openness > 0.02 ? COLORS.alarm : COLORS.hudDim;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 3 + openness * 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = openness > 0.02 ? COLORS.alarm : COLORS.hudDim;
  ctx.beginPath();
  ctx.arc(0, 0, 1.5 + openness * 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- the floor

function drawFloor(ctx, game) {
  const { grid } = game;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const ch = grid[y][x];
      if (ch === '#' || ch === 'C' || ch === '=') continue;
      const px = x * TILE;
      const py = y * TILE;
      ctx.fillStyle = ch === ':' ? COLORS.shadowFloor : ((x + y) % 2 === 0 ? COLORS.floorA : COLORS.floorB);
      ctx.fillRect(px, py, TILE, TILE);
      if (ch === ':') {
        // Hatched gloom: shadow you can read at a glance.
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px + 6, py + TILE - 6);
        ctx.lineTo(px + TILE - 6, py + 6);
        ctx.stroke();
      }
    }
  }
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= COLS; x++) { ctx.moveTo(x * TILE + 0.5, 0); ctx.lineTo(x * TILE + 0.5, FIELD_H); }
  for (let y = 0; y <= ROWS; y++) { ctx.moveTo(0, y * TILE + 0.5); ctx.lineTo(FIELD_W, y * TILE + 0.5); }
  ctx.stroke();

  // Pools of moonlight from high windows — bright floor is dangerous floor.
  const pools = game.levelIndex === 0
    ? [[300, 170, 150], [700, 420, 170], [520, 90, 110]]
    : [[220, 460, 160], [760, 180, 150], [480, 330, 120]];
  for (const [x, y, r] of pools) {
    const grad = ctx.createRadialGradient(x, y, 10, x, y, r);
    grad.addColorStop(0, COLORS.moonPool);
    grad.addColorStop(1, 'rgba(140, 170, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Controls reminder, quiet in the corner of the floor itself.
  ctx.font = `11px ${SANS}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(160, 175, 220, 0.5)';
  ctx.fillText('WASD / arrows — move · Shift — sneak · R — restart floor', 10, FIELD_H - 10);
}

function drawExit(ctx, game, time) {
  for (const e of game.exits) {
    const px = e.x * TILE;
    const py = e.y * TILE;
    const pulse = 0.75 + Math.sin(time * 2.4) * 0.25;
    const grad = ctx.createRadialGradient(px + TILE / 2, py + TILE / 2, 4, px + TILE / 2, py + TILE / 2, TILE * 1.15);
    grad.addColorStop(0, `rgba(57, 230, 163, ${0.28 * pulse})`);
    grad.addColorStop(1, 'rgba(57, 230, 163, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(px - TILE, py - TILE, TILE * 3, TILE * 3);
    ctx.fillStyle = COLORS.exitDoor;
    ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
    ctx.strokeStyle = COLORS.exitGlow;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
    ctx.beginPath();
    ctx.moveTo(px + TILE / 2, py + 3);
    ctx.lineTo(px + TILE / 2, py + TILE - 3);
    ctx.stroke();
  }
}

// One EXIT sign per run of door tiles, drawn after the walls so a door
// tucked under a lintel still names itself.
function drawExitLabels(ctx, game) {
  if (!game.exits.length) return;
  const xs = game.exits.map((e) => e.x);
  const ys = game.exits.map((e) => e.y);
  const cx = ((Math.min(...xs) + Math.max(...xs) + 1) / 2) * TILE;
  const top = Math.min(...ys) * TILE;
  ctx.font = `bold 10px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.exitGlow;
  ctx.fillText('EXIT', cx, top - 7);
}

// ------------------------------------------------------- cover and the walls

function drawCoverAndWalls(ctx, game) {
  const { grid } = game;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const ch = grid[y][x];
      const px = x * TILE;
      const py = y * TILE;
      if (ch === '#') drawWall(ctx, px, py);
      else if (ch === 'C') drawCrate(ctx, px, py);
      else if (ch === '=') drawBookcase(ctx, px, py, x, y);
    }
  }
}

function drawWall(ctx, px, py) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = COLORS.wallTop;
  ctx.fillRect(px, py, TILE, 7);
  ctx.fillStyle = COLORS.wallEdge;
  ctx.fillRect(px, py + TILE - 4, TILE, 4);
  ctx.strokeStyle = 'rgba(10, 12, 24, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
}

function drawCrate(ctx, px, py) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(px + 3, py + TILE - 5, TILE - 4, 5);
  ctx.fillStyle = COLORS.crate;
  ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
  ctx.strokeStyle = COLORS.crateLine;
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
  ctx.beginPath();
  ctx.moveTo(px + 3, py + 3);
  ctx.lineTo(px + TILE - 3, py + TILE - 3);
  ctx.moveTo(px + TILE - 3, py + 3);
  ctx.lineTo(px + 3, py + TILE - 3);
  ctx.stroke();
  ctx.fillStyle = COLORS.crateDark;
  ctx.fillRect(px + 2, py + TILE / 2 - 2, TILE - 4, 4);
}

function drawBookcase(ctx, px, py, tx, ty) {
  ctx.fillStyle = COLORS.shelf;
  ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
  ctx.fillStyle = COLORS.shelfDark;
  ctx.fillRect(px + 1, py + TILE / 2 - 1, TILE - 2, 3);
  // Two shelves of book spines, colours picked by a stable hash of position.
  for (let shelf = 0; shelf < 2; shelf++) {
    let bx = px + 5;
    let i = 0;
    while (bx < px + TILE - 7) {
      const w = 3 + Math.floor(hash2(tx * 7 + i, ty * 13 + shelf) * 3);
      const h = 10 + Math.floor(hash2(tx * 3 + shelf, ty * 5 + i) * 4);
      ctx.fillStyle = BOOK_SPINES[Math.floor(hash2(tx + i, ty + shelf) * BOOK_SPINES.length)];
      const top = shelf === 0 ? py + TILE / 2 - 3 - h : py + TILE - 4 - h;
      ctx.fillRect(bx, top, w, h);
      bx += w + 1.5;
      i++;
    }
  }
  ctx.strokeStyle = 'rgba(8, 6, 16, 0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 1.5, py + 1.5, TILE - 3, TILE - 3);
}

// ---------------------------------------------------------------- the light

function drawCones(ctx, game, time) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const guard of game.guards) {
    const polygon = guard.visionPolygon(time);
    const grad = ctx.createRadialGradient(guard.x, guard.y, 6, guard.x, guard.y, 190);
    grad.addColorStop(0, coneColor(guard.alert, 0.5));
    grad.addColorStop(0.7, coneColor(guard.alert, 0.22));
    grad.addColorStop(1, coneColor(guard.alert, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(polygon[0].x, polygon[0].y);
    for (let i = 1; i < polygon.length; i++) ctx.lineTo(polygon[i].x, polygon[i].y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- the actors

function drawActors(ctx, game, time) {
  for (const guard of game.guards) drawGuard(ctx, guard, time);
  drawPlayer(ctx, game.player);
}

function shadowEllipse(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.75, r * 0.95, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawGuard(ctx, guard, time) {
  shadowEllipse(ctx, guard.x, guard.y, guard.radius);
  const facing = guard.facingNow(time);
  // Lamp glow at the torch hand.
  const lx = guard.x + Math.cos(facing) * (guard.radius + 3);
  const ly = guard.y + Math.sin(facing) * (guard.radius + 3);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(lx, ly, 3.2, 0, Math.PI * 2);
  ctx.fill();
  // Body: the warden's maroon coat reads against the blue floor at a glance.
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.guardDark;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Cap: a half-disc swung to his facing, with a pale face beneath it.
  ctx.fillStyle = '#f2c09a';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(facing) * 4, guard.y + Math.sin(facing) * 4, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guardCap;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, guard.radius - 3.5, facing - 1.25, facing + 1.25);
  ctx.lineTo(guard.x, guard.y);
  ctx.closePath();
  ctx.fill();
  // A startled mark while his eyes are on the courier.
  if (guard.alert > 0.45) {
    const bob = Math.sin(time * 9) * 1.6;
    ctx.font = `bold 19px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.alarm;
    ctx.fillText('!', guard.x, guard.y - guard.radius - 9 + bob);
  }
}

function drawPlayer(ctx, player) {
  shadowEllipse(ctx, player.x, player.y, player.radius);
  if (player.sneaking) {
    // A faint ring so the player can read at a glance that sneak is on.
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  const squash = player.sneaking ? 0.88 : 1;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(1, squash);
  // Cloak: teal hood and shoulders, a pale face turned the way she moves.
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.playerDark;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#ffe3c2';
  ctx.beginPath();
  ctx.arc(Math.cos(player.facing) * 4.5, Math.sin(player.facing) * 4.5, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.playerDark;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius - 4, player.facing + 2.2, player.facing + 4.1);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawVignette(ctx) {
  const grad = ctx.createRadialGradient(
    FIELD_W / 2, FIELD_H / 2, FIELD_H * 0.42,
    FIELD_W / 2, FIELD_H / 2, FIELD_H * 0.95,
  );
  grad.addColorStop(0, 'rgba(2, 3, 8, 0)');
  grad.addColorStop(1, 'rgba(2, 3, 8, 0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);
}

// ---------------------------------------------------------------- the screens

function panel(ctx, title, lines, titleColor = COLORS.parchment) {
  ctx.fillStyle = 'rgba(4, 6, 12, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.font = `52px ${SERIF}`;
  ctx.fillStyle = titleColor;
  ctx.fillText(title, VIEW_W / 2, 168);
  ctx.font = `16px ${SANS}`;
  ctx.fillStyle = COLORS.hudText;
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 226 + i * 27));
}

function drawButtons(ctx, game) {
  for (const b of layoutButtons(game)) {
    ctx.fillStyle = 'rgba(20, 26, 46, 0.92)';
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, 9);
    ctx.fill();
    ctx.stroke();
    ctx.font = `16px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.parchment;
    ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
  }
  ctx.textBaseline = 'alphabetic';
}

function drawOverlay(ctx, game, time) {
  const mins = String(Math.floor(game.elapsed / 60)).padStart(2, '0');
  const secs = String(Math.floor(game.elapsed % 60)).padStart(2, '0');
  if (game.state === 'title') {
    panel(ctx, 'QUIET VAULT', [
      'A tiny stealth game in a moonlit archive.',
      'You are the courier. The wardens carry the only light —',
      'stay out of it, keep to the hatched shadow, and reach the green door.',
      '',
      'WASD / arrow keys move · hold Shift to sneak · R restarts a floor',
      'Fill the alarm and you are caught. Break the beam and it fades.',
    ]);
  } else if (game.state === 'caught') {
    ctx.fillStyle = `rgba(160, 20, 16, ${0.16 + Math.sin(Math.min(1, game.stateTime) * Math.PI) * 0.1})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    panel(ctx, 'SPOTTED!', [
      'A lamp swung round and there you were.',
      `Caught on ${game.level.name.toLowerCase()} — attempt ${game.attempts + 1} coming up.`,
      'Watch the patrols. Their lamps sweep while they wait at each post.',
    ], COLORS.alarm);
  } else if (game.state === 'clear') {
    panel(ctx, 'FLOOR CLEARED', [
      game.everSpotted
        ? 'Seen — but never held. The archive keeps its secret.'
        : 'In and out like a rumour. Nobody saw a thing.',
      `Time so far ${mins}:${secs}. One floor deeper, the lamps burn brighter.`,
    ], COLORS.exitGlow);
  } else if (game.state === 'won') {
    panel(ctx, 'THE VAULT IS EMPTY', [
      'Every floor crossed, every lamp dodged.',
      `Total time ${mins}:${secs} · caught ${game.attempts}× · a clean ghost run was possible.`,
      'Thank you for playing Quiet Vault.',
    ], COLORS.gold);
  }
  drawButtons(ctx, game);
}
