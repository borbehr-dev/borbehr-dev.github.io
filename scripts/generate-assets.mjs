import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const sourceIcon = path.join(publicDir, 'favicon.svg');

const lime = '#c9f84a';
const orange = '#ff7043';
const bg = '#080a09';

async function ensureSource() {
  try {
    await fs.access(sourceIcon);
  } catch {
    throw new Error('Не найден public/favicon.svg — сначала создайте исходную иконку.');
  }
}

async function generateIcons() {
  const svg = await fs.readFile(sourceIcon);

  await Promise.all([
    sharp(svg, { density: 384 }).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32.png')),
    sharp(svg, { density: 384 }).resize(192, 192).png().toFile(path.join(publicDir, 'favicon-192.png')),
    sharp(svg, { density: 384 }).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png')),
  ]);

  console.log('✓ favicon-32.png, favicon-192.png, apple-touch-icon.png');
}

function socialCardSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="78%" cy="18%" r="62%">
      <stop offset="0" stop-color="${lime}" stop-opacity=".22"/>
      <stop offset="1" stop-color="${lime}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M60 0H0V60" fill="none" stroke="#ffffff" stroke-opacity=".055" stroke-width="1"/>
    </pattern>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".11"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="${bg}"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect x="40" y="40" width="1120" height="550" rx="26" fill="none" stroke="#ffffff" stroke-opacity=".1"/>

  <g transform="translate(78 84)">
    <rect width="54" height="54" rx="16" fill="none" stroke="${lime}" stroke-opacity=".3"/>
    <circle cx="27" cy="27" r="15" fill="none" stroke="${lime}" stroke-width="2" stroke-dasharray="3 4"/>
    <circle cx="27" cy="27" r="4.5" fill="${lime}"/>
    <path d="M27 3v8M27 43v8M3 27h8M43 27h8" stroke="${lime}" stroke-width="2" stroke-linecap="round"/>
  </g>

  <text x="150" y="122" fill="#f2f4ef" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" letter-spacing="-1">bor<tspan fill="${lime}">Be</tspan>HR</text>

  <text x="76" y="330" fill="#f2f4ef" font-family="Arial, Helvetica, sans-serif" font-size="154" font-weight="700" letter-spacing="-9">bor<tspan fill="${lime}">Be</tspan>HR</text>
  <text x="1000" y="218" fill="${orange}" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="400">*</text>

  <text x="80" y="398" fill="#9aa39b" font-family="Arial, Helvetica, sans-serif" font-size="25" letter-spacing="3">SOUND · CODE · EXPERIMENTS</text>

  <line x1="80" y1="468" x2="1120" y2="468" stroke="#ffffff" stroke-opacity=".12"/>
  <text x="80" y="522" fill="#f2f4ef" font-family="Arial, Helvetica, sans-serif" font-size="24">Независимый звук, код и цифровые эксперименты</text>
  <text x="1120" y="522" fill="${lime}" font-family="Arial, Helvetica, sans-serif" font-size="24" text-anchor="end">borbehr.eu.org</text>

  <g transform="translate(980 96)" fill="none" stroke="${lime}">
    <circle cx="90" cy="90" r="88" stroke-opacity=".16"/>
    <circle cx="90" cy="90" r="64" stroke-opacity=".22" stroke-dasharray="1 8"/>
    <circle cx="90" cy="90" r="40" stroke-opacity=".3"/>
    <circle cx="90" cy="6" r="4" fill="${lime}" stroke="none"/>
    <circle cx="154" cy="90" r="3" fill="${orange}" stroke="none"/>
  </g>
</svg>`;
}

async function generateSocialCard() {
  const svg = Buffer.from(socialCardSvg());
  await sharp(svg).png({ quality: 96 }).toFile(path.join(publicDir, 'og.png'));
  console.log('✓ og.png (1200×630)');
}

async function main() {
  await ensureSource();
  await fs.mkdir(publicDir, { recursive: true });
  await generateIcons();
  await generateSocialCard();
  console.log('Ассеты готовы: public/');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
