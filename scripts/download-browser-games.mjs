import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetDir = path.resolve(__dirname, '..', 'public', 'browser-games');

const games = [
  'computer-space',
  'pong',
  'gun-fight',
  'breakout',
  'space-invaders',
  'galaxian',
  'asteroids',
  'lunar-lander',
  'pac-man',
  'centipede',
  'missile-command',
  'defender'
];

const files = ['index.html', 'style.css', 'game.js'];
const repoUrl = 'https://raw.githubusercontent.com/juliensimon/browser-games/main';

async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  const content = await response.text();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf-8');
  return true;
}

async function main() {
  console.log('=== Downloading browser games ===\n');

  for (const game of games) {
    const gameDir = path.join(targetDir, game);
    console.log(`Downloading ${game}...`);

    for (const file of files) {
      const url = `${repoUrl}/${game}/${file}`;
      const outputPath = path.join(gameDir, file);

      try {
        await downloadFile(url, outputPath);
        console.log(`  OK ${file}`);
      } catch (err) {
        if (file === 'style.css') {
          // style.css might not exist for some games - that's ok
          console.log(`  - ${file} (not found, skipping)`);
        } else {
          console.log(`  FAIL ${file}: ${err.message}`);
        }
      }
    }
    console.log('');
  }

  console.log(`=== All games downloaded to: ${targetDir} ===`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

