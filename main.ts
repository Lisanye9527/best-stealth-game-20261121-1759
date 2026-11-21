// Quiet Vault — the hand-in program.
//
// Copies game/ and screenshots/ from this repository into the output
// directory and writes dossier.json with buildDossier from the kit's
// vendored library. Runs on Node 22 with the standard library only:
// no installs, no network. The grader runs it twice and requires
// both runs to write the same bytes, so there is no timestamp, no
// random value and no ordering surprise anywhere in here — directory
// entries are copied in sorted order.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

if (out === here) {
  throw new Error('refusing to use the repository root as the output directory');
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const gameDir = resolve(here, 'game');
if (!existsSync(gameDir)) throw new Error('game/ is missing from the repository');
cpSync(gameDir, resolve(out, 'game'), { recursive: true });

const shotsDir = resolve(here, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, resolve(out, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(resolve(out, 'dossier.json'), dossier);

// A one-line receipt on stderr, so a local run shows what it wrote
// without touching the bytes the grader compares.
const bytes = statSync(resolve(out, 'dossier.json')).size;
process.stderr.write(`wrote ${resolve(out, 'dossier.json')} (${bytes} bytes)\n`);
