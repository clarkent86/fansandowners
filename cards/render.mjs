// Renders the business cards, a mockup scene, the social share image, and the touch icon.
//
//   npm run cards                       QR -> https://powertothe.fan
//   CARD_URL=https://... npm run cards  QR -> any URL
//
// Cards are US standard 3.5" x 2" with a 1/8" bleed, drawn at 300 dpi and exported at 600 dpi.
// Outputs: cards/out/*.png (print + mockups), public/og.png, public/apple-touch-icon.png
import { Resvg } from '@resvg/resvg-js';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'out');
const PUBLIC = join(HERE, '..', 'public');
mkdirSync(OUT, { recursive: true });

const URL_ = process.env.CARD_URL ?? 'https://powertothe.fan';
const DOMAIN = new URL(URL_).host.replace(/^www\./, '');

const C = {
  ink: '#12142a', ink2: '#1b1e3a', ink3: '#272b4f',
  paper: '#faf5e6', paperInk: '#1f2236', muted: '#5d6078',
  volt: '#f2df3c', flare: '#e8432f', sky: '#62b8ec', text: '#f7f4ea',
};
const fontFiles = readdirSync(join(HERE, 'fonts')).filter((f) => f.endsWith('.ttf')).map((f) => join(HERE, 'fonts', f));
const DISPLAY = 'Big Shoulders Display';
const BODY = 'Instrument Sans';

// ---------- shared pieces ----------

const BLADE = 'M32 32C29 27 27.5 19 30.5 10.5C35.5 10.5 39.5 15.5 37.5 22.5C36.5 26.5 34.5 29.5 32 32Z';
/** The fan mark, drawn in a 64x64 box, placed at (x, y) with size s. */
function fanMark(x, y, s, { face = C.volt, ink = C.ink, rot = 0 } = {}) {
  const k = s / 64;
  return `<g transform="translate(${x} ${y}) scale(${k})">
    <circle cx="32" cy="32" r="29.5" fill="${face}" stroke="${ink}" stroke-width="3"/>
    <circle cx="32" cy="32" r="24.5" fill="none" stroke="${ink}" stroke-width="1.6"/>
    <g fill="${ink}" transform="rotate(${rot} 32 32)">
      ${[0, 72, 144, 216, 288].map((a) => `<path d="${BLADE}" transform="rotate(${a} 32 32)"/>`).join('')}
    </g>
    <circle cx="32" cy="32" r="4.5" fill="${face}" stroke="${ink}" stroke-width="2.5"/>
  </g>`;
}

/** Comic sunburst rays around (cx, cy). */
function rays(cx, cy, r, color, opacity, { step = 15, width = 6, offset = 0 } = {}) {
  let d = '';
  for (let a = offset; a < 360 + offset; a += step) {
    const a1 = (a * Math.PI) / 180, a2 = ((a + width) * Math.PI) / 180;
    d += `M${cx} ${cy}L${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}L${cx + r * Math.cos(a2)} ${cy + r * Math.sin(a2)}Z`;
  }
  return `<path d="${d}" fill="${color}" opacity="${opacity}"/>`;
}

function halftoneDefs(id, color, opacity, gap = 14, rad = 2.2) {
  return `<pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse">
    <circle cx="${gap / 2}" cy="${gap / 2}" r="${rad}" fill="${color}" fill-opacity="${opacity}"/></pattern>`;
}

/** QR code as SVG, with error correction H so the fan mark can sit in the middle. */
function qr(text, x, y, size, { dark = C.ink, light = C.paper, logo = true } = {}) {
  const q = QRCode.create(text, { errorCorrectionLevel: 'H' });
  const n = q.modules.size;
  const quiet = 4;
  const m = size / (n + quiet * 2);
  const logoModules = logo ? Math.floor(n * 0.24) | 1 : 0; // odd number keeps it centered
  const lo = (n - logoModules) / 2;
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!q.modules.get(r, c)) continue;
      if (logo && r >= lo - 1 && r < lo + logoModules + 1 && c >= lo - 1 && c < lo + logoModules + 1) continue;
      d += `M${c * m} ${r * m}h${m}v${m}h${-m}z`;
    }
  }
  const off = quiet * m;
  const logoSvg = logo ? fanMark(off + lo * m, off + lo * m, logoModules * m, { face: C.volt, ink: dark }) : '';
  return `<g transform="translate(${x} ${y})">
    <rect width="${size}" height="${size}" rx="${m * 2}" fill="${light}"/>
    <path transform="translate(${off} ${off})" d="${d}" fill="${dark}" shape-rendering="crispEdges"/>
    ${logoSvg}
  </g>`;
}

// ---------- cards (300 dpi units: 1125 x 675 including 37.5 px bleed) ----------

const W = 1125, H = 675, BLEED = 37.5, SAFE = 75;

function frontDark() {
  return `
  <defs>${halftoneDefs('dotsA', '#ffffff', 0.09)}
    <radialGradient id="fadeA" cx="0.78" cy="0.42" r="0.75"><stop offset="0" stop-color="${C.ink}" stop-opacity="0"/><stop offset="1" stop-color="${C.ink}" stop-opacity="1"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${C.ink}"/>
  ${rays(880, 290, 900, C.volt, 0.13, { step: 16, width: 6.5, offset: 3 })}
  <rect width="${W}" height="${H}" fill="url(#dotsA)"/>
  <rect width="${W}" height="${H}" fill="url(#fadeA)"/>
  ${fanMark(735, 95, 290, { rot: 18 })}
  <g font-family="${DISPLAY}" font-weight="900" fill="${C.text}">
    <text x="${SAFE + 8}" y="205" font-size="118" letter-spacing="1">POWER</text>
    <text x="${SAFE + 8}" y="310" font-size="118" letter-spacing="1">TO THE</text>
    <text x="${SAFE + 2}" y="478" font-size="210" fill="${C.volt}" letter-spacing="2">FAN</text>
  </g>
  <rect x="${SAFE + 8}" y="512" width="70" height="5" fill="${C.flare}"/>
  <text x="${SAFE + 8}" y="566" font-family="${BODY}" font-weight="600" font-size="31" fill="${C.text}" letter-spacing="0.5">Of the fans. By the fans. For the fans.</text>
  <text x="${W - SAFE - 8}" y="566" text-anchor="end" font-family="${DISPLAY}" font-weight="800" font-size="46" fill="${C.volt}" letter-spacing="1">${DOMAIN}</text>`;
}

function frontVolt() {
  return `
  <defs>${halftoneDefs('dotsB', C.ink, 0.12, 13, 2.4)}
    <linearGradient id="fadeB" x1="0" y1="0" x2="1" y2="0"><stop offset="0.25" stop-color="${C.volt}" stop-opacity="1"/><stop offset="1" stop-color="${C.volt}" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${C.volt}"/>
  <rect width="${W}" height="${H}" fill="url(#dotsB)"/>
  <rect width="${W}" height="${H}" fill="url(#fadeB)"/>
  <g font-family="${DISPLAY}" font-weight="900" fill="${C.ink}">
    <text x="${SAFE + 6}" y="190" font-size="92" letter-spacing="1">GIVE FANS A CHANCE</text>
    <text x="${SAFE + 6}" y="290" font-size="92" letter-spacing="1">TO <tspan fill="${C.flare}">OWN</tspan> THE FUTURE</text>
    <text x="${SAFE + 6}" y="390" font-size="92" letter-spacing="1">OF DC.</text>
  </g>
  <rect x="${SAFE + 6}" y="440" width="${W - 2 * SAFE - 12}" height="4" fill="${C.ink}"/>
  ${fanMark(SAFE + 6, 482, 88)}
  <text x="${SAFE + 112}" y="538" font-family="${DISPLAY}" font-weight="900" font-size="52" fill="${C.ink}" letter-spacing="1">POWER TO THE FAN</text>
  <text x="${W - SAFE - 6}" y="538" text-anchor="end" font-family="${BODY}" font-weight="600" font-size="34" fill="${C.ink}">${DOMAIN}</text>`;
}

function back() {
  const qs = 430;
  const qx = W - SAFE - qs + 10, qy = (H - qs) / 2;
  return `
  <defs>${halftoneDefs('dotsC', C.ink, 0.06, 14, 2)}</defs>
  <rect width="${W}" height="${H}" fill="${C.paper}"/>
  <rect width="${W}" height="${H}" fill="url(#dotsC)"/>
  <rect x="0" y="0" width="${W}" height="${BLEED + 22}" fill="${C.ink}"/>
  <rect x="0" y="${BLEED + 22}" width="${W}" height="7" fill="${C.volt}"/>
  <text x="${SAFE + 6}" y="168" font-family="${BODY}" font-weight="600" font-size="24" fill="${C.flare}" letter-spacing="5">A FAN PETITION</text>
  <g font-family="${DISPLAY}" font-weight="900" fill="${C.ink}" font-size="84" letter-spacing="0.5">
    <text x="${SAFE + 4}" y="252">SCAN TO</text>
    <text x="${SAFE + 4}" y="334">ADD YOUR</text>
    <text x="${SAFE + 4}" y="416">NAME<tspan fill="${C.flare}">.</tspan></text>
  </g>
  <text x="${SAFE + 6}" y="482" font-family="${DISPLAY}" font-weight="800" font-size="48" fill="${C.ink}" letter-spacing="0.5">${DOMAIN}</text>
  <g font-family="${BODY}" font-weight="500" font-size="21" fill="${C.muted}">
    <text x="${SAFE + 6}" y="548">Free to sign · No money requested</text>
    <text x="${SAFE + 6}" y="578">Independent fan campaign · Not affiliated with DC</text>
  </g>
  <rect x="${qx - 14}" y="${qy - 14}" width="${qs + 28}" height="${qs + 28}" rx="30" fill="${C.ink}"/>
  ${qr(URL_, qx, qy, qs)}`;
}

const wrapCard = (body, w = W, h = H) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

function render(svg, file, scale = 1) {
  const img = new Resvg(svg, {
    fitTo: { mode: 'zoom', value: scale },
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: BODY },
  }).render();
  writeFileSync(file, img.asPng());
  return img;
}

/** Make sure the QR on the rendered back really scans to the right URL. */
function verifyQr(img) {
  const { width, height } = img;
  const code = jsQR(new Uint8ClampedArray(img.pixels), width, height);
  if (!code || code.data !== URL_) throw new Error(`QR check failed: got ${code?.data ?? 'nothing'}`);
  console.log(`QR verified: ${code.data}`);
}

const cards = { 'front-dark': frontDark(), 'front-volt': frontVolt(), back: back() };
for (const [name, body] of Object.entries(cards)) {
  // Print file: full bleed, 600 dpi (2250 x 1350 px). Trim 1/8" (75 px) off each edge.
  const img = render(wrapCard(body), join(OUT, `card-${name}-print-600dpi.png`), 2);
  if (name === 'back') verifyQr(img);
  // Trimmed preview at 300 dpi (1050 x 600), what the finished card looks like.
  render(wrapCard(`<g transform="translate(${-BLEED} ${-BLEED})">${body}</g>`, W - 2 * BLEED, H - 2 * BLEED), join(OUT, `card-${name}.png`), 1);
}

// ---------- mockup scene ----------
{
  const SW = 2000, SH = 1250;
  const cw = W - 2 * BLEED, ch = H - 2 * BLEED;
  const card = (body, x, y, rot, s = 1) => `
    <g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" filter="url(#shadow)">
      <svg x="${-cw / 2}" y="${-ch / 2}" width="${cw}" height="${ch}" viewBox="${BLEED} ${BLEED} ${cw} ${ch}">
        <clipPath id="r${x}"><rect x="${BLEED}" y="${BLEED}" width="${cw}" height="${ch}" rx="14"/></clipPath>
        <g clip-path="url(#r${x})">${body}</g>
      </svg>
    </g>`;
  const scene = `<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}" viewBox="0 0 ${SW} ${SH}">
    <defs>
      <radialGradient id="desk" cx="0.45" cy="0.4" r="0.8"><stop offset="0" stop-color="#3a3f5c"/><stop offset="1" stop-color="#14162a"/></radialGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#000" flood-opacity="0.55"/></filter>
      ${halftoneDefs('deskdots', '#ffffff', 0.03, 18, 2)}
    </defs>
    <rect width="${SW}" height="${SH}" fill="url(#desk)"/>
    <rect width="${SW}" height="${SH}" fill="url(#deskdots)"/>
    ${card(frontDark(), 560, 360, -6, 0.84)}
    ${card(frontVolt(), 1450, 330, 5, 0.84)}
    ${card(back(), 1010, 880, -2, 0.88)}
    <text x="80" y="${SH - 70}" font-family="${BODY}" font-weight="500" font-size="30" fill="#ffffff" fill-opacity="0.55">Mockup · 3.5" × 2" · QR: ${URL_}</text>
  </svg>`;
  render(scene, join(OUT, 'mockup.png'), 1);
}

// ---------- social share image (1200 x 630) ----------
{
  const OW = 1200, OH = 630;
  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="${OW}" height="${OH}" viewBox="0 0 ${OW} ${OH}">
    <defs>${halftoneDefs('ogdots', '#ffffff', 0.08)}
      <radialGradient id="ogfade" cx="0.82" cy="0.45" r="0.7"><stop offset="0" stop-color="${C.ink}" stop-opacity="0"/><stop offset="1" stop-color="${C.ink}" stop-opacity="1"/></radialGradient>
    </defs>
    <rect width="${OW}" height="${OH}" fill="${C.ink}"/>
    ${rays(990, 300, 1000, C.volt, 0.13, { step: 16, width: 6.5, offset: 3 })}
    <rect width="${OW}" height="${OH}" fill="url(#ogdots)"/>
    <rect width="${OW}" height="${OH}" fill="url(#ogfade)"/>
    ${fanMark(840, 150, 300, { rot: 18 })}
    ${fanMark(70, 62, 64)}
    <text x="150" y="108" font-family="${DISPLAY}" font-weight="900" font-size="44" fill="${C.text}" letter-spacing="1">POWER TO THE <tspan fill="${C.volt}">FAN</tspan></text>
    <g font-family="${DISPLAY}" font-weight="900" fill="${C.text}" font-size="104">
      <text x="66" y="262">GIVE FANS A CHANCE</text>
      <text x="66" y="364">TO <tspan fill="${C.volt}">OWN</tspan> THE FUTURE</text>
      <text x="66" y="466">OF DC.</text>
    </g>
    <text x="70" y="560" font-family="${BODY}" font-weight="600" font-size="30" fill="${C.text}">Free to sign · No money requested · <tspan fill="${C.volt}">${DOMAIN}</tspan></text>
  </svg>`;
  render(og, join(PUBLIC, 'og.png'), 1);
}

// ---------- apple touch icon ----------
render(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" fill="${C.ink}"/>${fanMark(14, 14, 152)}</svg>`,
  join(PUBLIC, 'apple-touch-icon.png'), 1);

console.log(`Rendered cards for ${URL_} -> ${OUT}`);
