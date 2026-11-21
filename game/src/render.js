// Quiet Vault — the canvas renderer.
//
// One function draws a whole frame: floor, shadow, crates, the green
// exit, every lamp cone, the wardens, the courier, the HUD, and the
// title / caught / cleared banners on top. Nothing here keeps state
// and nothing here decides rules; it only reads the game object the
// frame loop hands it, so a screenshot is just a frozen game object
// drawn once.

import { ORIGIN_X, ORIGIN_Y, PALETTE, TILE, VIEW_H, VIEW_W } from './config.js';
import { tileCenter } from './geometry.js';

function floorRect() {
  return { x: ORIGIN_X, y: ORIGIN_Y, w: 24 * TILE, h: 14 * TILE };
}

function drawFloor(ctx, floor) {
  const { x, y, w, h } = floorRect();
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
  for (let row = 0; row < floor.grid.length; row++) {
    for (let col = 0; col < floor.grid[row].length; col++) {
      const ch = floor.grid[row][col];
      const px = x + col * TILE;
      const py = y + row * TILE;
      if (ch === '#') {
        ctx.fillStyle = PALETTE.wall;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = PALETTE.wallTop;
        ctx.fillRect(px, py, TILE, 4);
        continue;
      }
      ctx.fillStyle = (col + row) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(px, py, TILE, TILE);
      if (ch === 's') {
        ctx.fillStyle = PALETTE.shadow;
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        ctx.strokeStyle = PALETTE.shadowHatch;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let k = -TILE; k < TILE * 2; k += 12) {
          ctx.moveTo(px + k, py + TILE - 2);
          ctx.lineTo(px + k + TILE, py + 2);
        }
        ctx.stroke();
      }
      if (ch === 'E') {
        const cx = px + TILE / 2;
        const cy = py + TILE / 2;
        const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 300);
        ctx.fillStyle = PALETTE.exitDark;
        ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
        ctx.fillStyle = PALETTE.exit;
        ctx.globalAlpha = pulse;
        ctx.fillRect(px + 10, py + 6, TILE - 20, TILE - 12);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#062b18';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('EXIT', cx, cy);
      }
      ctx.strokeStyle = PALETTE.floorEdge;
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
    }
  }
}

function drawCrates(ctx, floor) {
  const { x, y } = floorRect();
  for (let row = 0; row < floor.grid.length; row++) {
    for (let col = 0; col < floor.grid[row].length; col++) {
      if (floor.grid[row][col] !== 'c') continue;
      const px = x + col * TILE;
      const py = y + row * TILE;
      ctx.fillStyle = PALETTE.crate;
      ctx.fillRect(px + 5, py + 5, TILE - 10, TILE - 10);
      ctx.strokeStyle = PALETTE.crateEdge;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 5.5, py + 5.5, TILE - 11, TILE - 11);
      ctx.beginPath();
      ctx.moveTo(px + 5, py + 5);
      ctx.lineTo(px + TILE - 5, py + TILE - 5);
      ctx.moveTo(px + TILE - 5, py + 5);
      ctx.lineTo(px + 5, py + TILE - 5);
      ctx.stroke();
    }
  }
}

function drawCones(ctx, game) {
  for (const warden of game.wardens) {
    const poly = warden.lampPolygon(game.floor.grid);
    const hot = warden.exposure > 0.45;
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fillStyle = hot ? PALETTE.coneHot : PALETTE.cone;
    ctx.fill();
    ctx.strokeStyle = PALETTE.coneEdge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawWardens(ctx, game) {
  for (const warden of game.wardens) {
    const { x, y, heading } = warden;
    // Coat: a broad circle, darker than the floor, rimmed in lamplight.
    ctx.fillStyle = PALETTE.guardCoat;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.lamp;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Head and shoulders: a pale face looking down the lamp.
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    // The lamp itself: a bright dot ahead of the face.
    const lx = x + Math.cos(heading) * 13;
    const ly = y + Math.sin(heading) * 13;
    ctx.fillStyle = PALETTE.lamp;
    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fill();
    // A warden who has you in his lamp says so.
    if (warden.exposure > 0.45) {
      ctx.fillStyle = '#ff5d5d';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('!', x, y - 18);
    }
  }
}

function drawCourier(ctx, game) {
  const c = game.courier;
  // A sneak ring: the slower you go, the tighter the circle reads.
  if (c.sneaking) {
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 20, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Cloak: a teal circle with a pale hood facing the heading.
  ctx.fillStyle = PALETTE.courierCloak;
  ctx.beginPath();
  ctx.arc(c.x, c.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.courier;
  ctx.lineWidth = 2;
  ctx.stroke();
  const hx = c.x + Math.cos(c.heading) * 6;
  const hy = c.y + Math.sin(c.heading) * 6;
  ctx.fillStyle = PALETTE.courier;
  ctx.beginPath();
  ctx.arc(hx, hy, 6, 0, Math.PI * 2);
  ctx.fill();
}

function alarmColor(value) {
  if (value >= 0.7) return PALETTE.alarmHigh;
  if (value >= 0.35) return PALETTE.alarmMid;
  return PALETTE.alarmLow;
}

function drawHud(ctx, game) {
  ctx.fillStyle = PALETTE.page;
  ctx.fillRect(0, 0, VIEW_W, 56);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(game.floor.name, 64, 22);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '14px sans-serif';
  ctx.fillText(game.floor.sub, 64, 44);
  // Alarm bar, top right: label on the left, bar, percentage.
  const label = game.alarm.label();
  ctx.fillStyle = alarmColor(game.alarm.value);
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(label, 1000, 22);
  const bx = 1012;
  const by = 12;
  const bw = 180;
  const bh = 18;
  ctx.fillStyle = '#11141c';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = alarmColor(game.alarm.value);
  ctx.fillRect(bx + 2, by + 2, (bw - 4) * game.alarm.value, bh - 4);
  ctx.strokeStyle = PALETTE.hudDim;
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('WASD / arrows move · Shift sneak · R restart floor', 64, VIEW_H - 22);
  ctx.textAlign = 'right';
  ctx.fillText('Reach the green EXIT unseen', VIEW_W - 64, VIEW_H - 22);
}

function drawBanner(ctx, title, lines) {
  ctx.fillStyle = PALETTE.banner;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 70);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '19px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, VIEW_H / 2 - 10 + i * 30);
  });
}

export function drawScene(ctx, game) {
  ctx.fillStyle = PALETTE.page;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx, game.floor);
  drawCones(ctx, game);
  drawCrates(ctx, game.floor);
  drawWardens(ctx, game);
  drawCourier(ctx, game);
  drawHud(ctx, game);
  if (game.mode === 'title') {
    drawBanner(ctx, 'QUIET VAULT', [
      'A moonlit archive. Wardens carry the only light.',
      'Slip between patrols, keep to the hatched shadow, reach the green door unseen.',
      '',
      'Press Enter or click to begin — WASD to move, Shift to sneak.',
    ]);
  } else if (game.mode === 'caught') {
    drawBanner(ctx, 'CAUGHT', [
      'The lamp found you, and the archive woke up.',
      'Press R to try the floor again.',
    ]);
  } else if (game.mode === 'clear') {
    drawBanner(ctx, 'FLOOR CLEAR', [
      'You slipped through unseen. The vault waits below.',
      'Press Enter for the next floor.',
    ]);
  } else if (game.mode === 'win') {
    drawBanner(ctx, 'THE VAULT IS YOURS', [
      'Both floors crossed, never once caught in the light.',
      'Press Enter to play again.',
    ]);
  }
}

// Kept for the screenshot helper: where a tile sits on the canvas.
export function shotTile(col, row) {
  return tileCenter(col, row);
}
