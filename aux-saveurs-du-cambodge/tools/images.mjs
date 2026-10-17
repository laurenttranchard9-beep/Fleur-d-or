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

const sprite = readFileSync(`${root}src/svg/sprite.svg`, 'utf8');
const etal = readFileSync(`${root}src/svg/etal.svg`, 'utf8');
const piment = sprite.match(/<symbol id="piment" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/);

// Le piment sur un carré curcuma : lisible à 16 px, reconnaissable sur un écran d'accueil.
const icone = (arrondi) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${arrondi}" fill="#F2A51C"/>
  <svg x="2" y="18" width="60" height="28" viewBox="${piment[1]}" overflow="visible">
    <g transform="rotate(-32 62 20)">${piment[2].trim()}</g>
  </svg>
</svg>
`;

writeFileSync(`${root}public/favicon.svg`, icone(14));

const fonts = (name) => pathToFileURL(`${root}public/assets/fonts/${name}`).href;

const og = `<!doctype html><html lang="fr"><meta charset="utf-8"><style>
@font-face{font-family:"Kantumruy Pro";src:url(${fonts('kantumruy-pro-latin.woff2')});font-weight:300 700}
@font-face{font-family:Moul;src:url(${fonts('moul-enseigne.woff2')})}
html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#F2A51C;color:#2A170D;font-family:"Kantumruy Pro"}
.etal{position:absolute;right:-60px;top:-40px;width:640px;height:720px}
.etal svg{width:100%;height:100%}
.texte{position:absolute;left:72px;top:96px;width:620px}
.km{font-family:Moul;font-size:52px;line-height:1.5;color:#1B5232}
.nom{font-family:Moul;font-size:74px;line-height:1;text-transform:uppercase}
.nom small{font-family:"Kantumruy Pro";font-weight:600;font-size:30px;text-transform:none;vertical-align:28px;margin-right:6px}
.accroche{margin-top:28px;font-size:30px;font-weight:500;color:#5A3416}
.tel{display:inline-block;margin-top:34px;padding:12px 22px;background:#C8261B;color:#FFFBF3;border:3px solid #2A170D;border-radius:10px;font-size:30px;font-weight:700}
</style><body>${sprite}<div class="etal">${etal}</div>
<div class="texte"><div class="km">រសជាតិកម្ពុជា</div><div class="nom">Aux Saveurs<br><small>du</small>Cambodge</div>
<p class="accroche">Cuisine cambodgienne faite maison<br>à Saint-Alban</p><span class="tel">07 59 52 53 41</span></div></body></html>`;

// Une page file:// pour que les polices locales se chargent.
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
