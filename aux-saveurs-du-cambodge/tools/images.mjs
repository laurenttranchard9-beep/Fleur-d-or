// Favicon, icônes et image de partage (og.jpg), rendus avec Playwright.
// Usage : node tools/images.mjs   (nécessite Playwright et Chromium : npm i -D playwright && npx playwright install chromium)

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try {
    return require('playwright');
  } catch {
    return require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
  }
})();

const resto = JSON.parse(readFileSync(`${root}data/restaurant.json`, 'utf8'));

// Un bol et ses baguettes, blancs sur noir : lisible à 16 px, net sur un écran d'accueil.
const icone = (arrondi) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${arrondi}" fill="#000"/>
  <g stroke="#f5f5f7" stroke-width="3.4" stroke-linecap="round">
    <path d="M30 27 47 8"/>
    <path d="M36 28 54 12"/>
  </g>
  <path d="M9 31h46a23 23 0 0 1-46 0z" fill="#f5f5f7"/>
  <rect x="23" y="52" width="18" height="5" rx="2.5" fill="#f5f5f7"/>
</svg>
`;

writeFileSync(`${root}public/favicon.svg`, icone(14));

const fichierLocal = (chemin) => pathToFileURL(`${root}${chemin}`).href;

// L'image de partage reprend la première tuile de l'accueil : le nom, la phrase, le bol.
const og = `<!doctype html><html lang="fr"><meta charset="utf-8"><style>
@font-face{font-family:Inter;src:url(${fichierLocal('public/assets/fonts/inter.woff2')});font-weight:400 700}
html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#000;color:#f5f5f7;font-family:Inter;-webkit-font-smoothing:antialiased}
.texte{position:absolute;left:84px;top:50%;width:560px;transform:translateY(-50%)}
h1{margin:0;font-size:70px;line-height:1.06;font-weight:600;letter-spacing:-0.012em}
p{margin:22px 0 0;font-size:30px;line-height:1.25;color:#86868b;letter-spacing:-0.005em;text-wrap:balance}
.tel{margin-top:30px;color:#f5f5f7;font-variant-numeric:tabular-nums}
img{position:absolute;top:50%;right:-110px;width:660px;height:660px;transform:translateY(-50%) rotate(-8deg)}
</style><body>
<div class="texte"><h1>${resto.name}</h1><p>Cuisine cambodgienne faite maison, à&nbsp;${resto.town}.</p><p class="tel">${resto.phone.display}</p></div>
<img src="${fichierLocal('public/assets/img/plats/soupe.svg')}" alt="">
</body></html>`;

// Une page file:// pour que la police et le dessin locaux se chargent.
const fichier = `${root}tools/.cache/og.html`;
mkdirSync(`${root}tools/.cache`, { recursive: true });
writeFileSync(fichier, og);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(fichier).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: `${root}public/og.jpg`, type: 'jpeg', quality: 88 });

for (const [file, size, arrondi] of [
  ['favicon-32.png', 32, 14],
  ['apple-touch-icon.png', 180, 0],
  ['icon-192.png', 192, 0],
  ['icon-512.png', 512, 0],
]) {
  const p = await browser.newPage({ viewport: { width: size, height: size } });
  await p.setContent(`<html><body style="margin:0">${icone(arrondi).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await p.screenshot({ path: `${root}public/${file}`, omitBackground: true });
  await p.close();
}

await browser.close();
console.log('favicon.svg, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png, og.jpg');
