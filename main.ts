// EMBER DUEL's hand-in program (Node 22.18+, standard library only).
//
// The game itself is game/: plain static files (index.html, src/*.js modules, styles/*.css), no
// library, no build step and no network request. This program copies game/ and screenshots/ into
// the output folder (/output in the grader, MAKEFUN_OUTPUT_DIR anywhere else) and writes
// dossier.json there with buildDossier from the kit's vendored make.fun library.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** The gate's caps, passed to buildDossier so it refuses what the scorer would refuse. */
const DOSSIER_CAPS = {
  text_max_bytes: 160 * 1024,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};

function copyFolder(name: string): void {
  const source = join(repoRoot, name);
  const target = join(outputDir, name);
  mkdirSync(target, { recursive: true });
  if (existsSync(source)) cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyFolder('game');
copyFolder('screenshots');

const dossier = buildDossier(outputDir, DOSSIER_CAPS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);

const shots = readdirSync(join(outputDir, 'screenshots')).filter((name) => !name.startsWith('.'));
console.log(`EMBER DUEL handed in to ${outputDir}: game/, ${shots.length} screenshots, dossier.json (${dossier.byteLength} bytes)`);
