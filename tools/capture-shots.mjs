// Takes the entry's screenshots with the game's own screenshot mode: for each line of shots.json
// it opens game/index.html<query> in headless Chrome at 1280x720 and saves a JPEG to screenshots/.
// Start the static server first (`node serve.ts`), then run `node tools/capture-shots.mjs`.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser } from './chrome-cdp.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const origin = process.argv[2] ?? 'http://localhost:8080';
const shots = JSON.parse(readFileSync(join(root, 'shots.json'), 'utf8'));
const MAX_BYTES = 256 * 1024;

mkdirSync(join(root, 'screenshots'), { recursive: true });
const page = await openBrowser({ width: 1280, height: 720 });
try {
  for (const shot of shots) {
    await page.navigate(`${origin}/${shot.query}`, 900);
    const phase = await page.evaluate('document.body.dataset.phase');
    let quality = 90;
    let image = await page.screenshot('jpeg', quality);
    while (image.length > MAX_BYTES && quality > 50) {
      quality -= 8;
      image = await page.screenshot('jpeg', quality);
    }
    writeFileSync(join(root, 'screenshots', shot.name), image);
    console.log(`${shot.name}: phase ${phase}, ${(image.length / 1024).toFixed(0)} KiB, quality ${quality}`);
  }
  const problems = page.consoleLines.filter((line) => !line.startsWith(`request: ${origin}`));
  if (problems.length > 0) console.log(problems.join('\n'));
} finally {
  await page.close();
}
