// Quiet Vault — hand-in program for the make.fun "best stealth game" bounty.
//
// The game itself is the static site in game/ (open game/index.html in a desktop
// browser, it plays offline). This program is the delivery step: it copies game/
// and screenshots/ into the output directory and writes dossier.json there with
// buildDossier from the vendored make.fun library, so the grader rebuilds the
// exact same dossier from the same files and can compare byte for byte.
//
// Run it the way the grader does, with the output directory named by the
// environment:  MAKEFUN_OUTPUT_DIR=out node main.ts
// (On the grader /output is used when the variable is unset.)

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's caps, mirrored here so a bad hand-in fails loudly at build time
// instead of quietly at grading time.
const DOSSIER_TEXT_MAX_BYTES = 163840;
const SCREENSHOT_MAX_COUNT = 4;
const SCREENSHOT_MAX_BYTES = 262144;
const GAME_MAX_FILES = 993;
const GAME_MAX_BYTES = 50331648;
const GAME_PATH_MAX_BYTES = 1000;

function copyTree(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
}

const shotNames = existsSync(join(outputDir, 'screenshots'))
  ? readdirSync(join(outputDir, 'screenshots')).filter((name) => !name.startsWith('.'))
  : [];
if (shotNames.length < 3 || shotNames.length > SCREENSHOT_MAX_COUNT) {
  throw new Error(`screenshots/ must hold 3 or 4 images, found ${shotNames.length}`);
}

writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: DOSSIER_TEXT_MAX_BYTES,
    screenshots: { max: SCREENSHOT_MAX_COUNT, max_bytes: SCREENSHOT_MAX_BYTES },
    game_max_files: GAME_MAX_FILES,
    game_max_bytes: GAME_MAX_BYTES,
    game_path_max_bytes: GAME_PATH_MAX_BYTES,
  }),
);
