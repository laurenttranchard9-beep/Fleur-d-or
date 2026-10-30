// Draws the market-stall illustration set (screen-print style, flat inks).
// Output: src/svg/sprite.svg (symbols + patterns), src/svg/etal.svg (hero composition).
// Usage: node tools/etal.mjs

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

// Cinq encres sur papier riz, comme une sérigraphie : chaque teinte est une trame (tint)
// ou une surimpression (over) de ces encres, jamais une couleur de plus.
const ENCRES = {
  sucre: '#2A170D',
  curcuma: '#F2A51C',
  piment: '#C8261B',
  feuille: '#1B5232',
  vert: '#A9C65C',
  papier: '#FBF5EA',
};
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const melange = (a, b, k) =>
  '#' +
  hex(a)
    .map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
const tint = (encre, k) => melange(ENCRES.papier, encre, k);
const over = melange;
const { sucre, curcuma, piment, feuille, vert, papier } = ENCRES;

const C = {
  ink: sucre,
  leafDeep: feuille,
  leaf: tint(feuille, 0.84),
  leafLight: vert,
  vein: vert,
  rib: tint(vert, 0.6),
  grassBase: tint(vert, 0.14),
  grass: tint(vert, 0.52),
  grassTop: vert,
  grassNode: tint(piment, 0.35),
  turmericSkin: over(over(curcuma, piment, 0.3), sucre, 0.3),
  turmericRing: over(curcuma, sucre, 0.6),
  turmericFlesh: over(curcuma, piment, 0.35),
  turmericCore: curcuma,
  galangalSkin: tint(curcuma, 0.3),
  galangalRing: over(tint(curcuma, 0.3), sucre, 0.32),
  galangalPink: tint(piment, 0.55),
  galangalFlesh: tint(curcuma, 0.12),
  kaffir: feuille,
  kaffirLight: tint(feuille, 0.8),
  kaffirRib: vert,
  chili: piment,
  chiliDark: over(piment, sucre, 0.4),
  chiliLight: tint(piment, 0.6),
  chiliGreen: tint(feuille, 0.82),
  stem: tint(feuille, 0.82),
  garlic: papier,
  garlicShade: over(papier, sucre, 0.1),
  garlicLine: over(papier, sucre, 0.26),
  garlicPurple: tint(piment, 0.5),
  shallot: over(piment, sucre, 0.3),
  shallotLight: tint(piment, 0.72),
  shallotDark: over(piment, sucre, 0.56),
  papery: over(tint(curcuma, 0.45), sucre, 0.1),
  limeRind: tint(feuille, 0.84),
  limePith: papier,
  limeFlesh: vert,
  limeLight: tint(vert, 0.45),
  string: papier,
  ground: curcuma,
  pepper: over(sucre, papier, 0.25),
};

// Misregistered ink outline: the same shape, stroked, nudged like a second screen pass.
const ink = (d, w = 2.4) =>
  `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" transform="translate(1.6 1.3)"/>`;

const symbols = {};

symbols.piment = {
  viewBox: '0 0 124 40',
  body: (() => {
    const pod = 'M26 11 C52 7 88 12 120 21 C90 26 54 33 26 29 C21 24 21 16 26 11 Z';
    return `
      <path d="M17 20 C11 19 6 15 2 8" fill="none" stroke="${C.stem}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="${pod}" fill="${C.chili}"/>
      <path d="M30 26 C56 29 88 25 116 21.5 C92 30 56 33 30 29 Z" fill="${C.chiliDark}"/>
      <path d="M33 14.5 C58 12.5 84 15.5 106 19.5 C84 18 60 17.5 34 18.5 Z" fill="${C.chiliLight}"/>
      <path d="M17 12 C23 9 29 11 31 16 C32 21 30 27 25 30 C20 30 16 26 15 21 C14 17 15 14 17 12 Z" fill="${C.chiliGreen}"/>
      ${ink(pod)}
      ${ink('M17 12 C23 9 29 11 31 16 C32 21 30 27 25 30 C20 30 16 26 15 21 C14 17 15 14 17 12 Z', 2)}`;
  })(),
};

symbols.combava = {
  viewBox: '0 0 224 92',
  body: (() => {
    const leaf = 'M6 46 C20 27 60 21 96 43 C120 17 180 13 218 45 C180 74 122 76 96 49 C60 71 20 65 6 46 Z';
    return `
      <path d="${leaf}" fill="${C.kaffir}"/>
      <path d="M10 45 C24 31 58 26 92 43 C60 41 32 43 10 45 Z" fill="${C.kaffirLight}"/>
      <path d="M101 43 C126 22 176 19 212 44 C176 41 136 41 101 43 Z" fill="${C.kaffirLight}"/>
      <path d="M6 46 L216 45" stroke="${C.kaffirRib}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M40 45 L52 34 M60 45 L74 33 M126 45 L140 29 M150 45 L166 28 M174 45 L190 32 M44 46 L56 56 M66 46 L78 58 M130 46 L146 61 M156 46 L172 60 M180 46 L194 56" stroke="${C.kaffirRib}" stroke-width="1.2" opacity=".7" fill="none"/>
      ${ink(leaf)}`;
  })(),
};

symbols.ail = {
  viewBox: '0 0 160 172',
  body: (() => {
    const bulb = 'M80 20 C70 42 40 54 22 84 C6 112 18 150 52 160 C70 165 90 165 108 160 C142 150 154 112 138 84 C120 54 90 42 80 20 Z';
    return `
      <path d="M74 24 C76 12 78 5 80 2 C82 5 84 12 86 24 Z" fill="${C.garlicShade}"/>
      <path d="${bulb}" fill="${C.garlic}"/>
      <path d="M108 62 C140 92 150 142 108 160 C122 122 120 92 108 62 Z" fill="${C.garlicShade}"/>
      <path d="M80 34 C60 72 56 122 68 160 M80 34 C100 72 104 122 92 160 M52 72 C32 102 36 138 54 158 M108 72 C128 102 124 138 106 158" stroke="${C.garlicLine}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M40 124 C42 134 46 142 52 148 M60 132 C61 140 63 148 66 154 M118 126 C117 136 113 144 108 150" stroke="${C.garlicPurple}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <rect width="160" height="172" fill="url(#trame)" clip-path="url(#ail-ombre)" opacity=".5"/>
      <path d="M68 162 l-5 8 M75 163 l-2 9 M82 163 l1 9 M89 162 l4 8" stroke="${C.garlicLine}" stroke-width="2" stroke-linecap="round"/>
      ${ink(bulb)}`;
  })(),
  defs: `<clipPath id="ail-ombre"><path d="M112 70 C140 98 146 142 108 160 C122 124 122 96 112 70 Z"/></clipPath>`,
};

symbols.echalote = {
  viewBox: '0 0 112 152',
  body: (() => {
    const body = 'M56 14 C51 32 21 52 15 88 C9 122 31 146 56 146 C81 146 103 122 97 88 C91 52 61 32 56 14 Z';
    return `
      <path d="M51 18 C53 9 55 3 57 0 C59 4 61 10 61 20 Z" fill="${C.papery}"/>
      <path d="${body}" fill="${C.shallot}"/>
      <path d="M78 60 C96 82 100 120 74 142 C86 112 86 84 78 60 Z" fill="${C.shallotDark}"/>
      <path d="M31 72 C35 58 45 48 53 42 C47 58 41 76 37 100 C31 94 29 84 31 72 Z" fill="${C.shallotLight}"/>
      <path d="M56 22 C46 60 44 104 50 144 M56 22 C68 60 70 104 64 144" stroke="${C.shallotDark}" stroke-width="1.6" fill="none" opacity=".7"/>
      <path d="M48 146 l-3 6 M56 147 l0 6 M64 146 l3 6" stroke="${C.papery}" stroke-width="2" stroke-linecap="round"/>
      ${ink(body)}`;
  })(),
};

symbols.curcuma = {
  viewBox: '0 0 224 124',
  body: (() => {
    const body =
      'M20 72 C18 54 34 44 52 48 C64 32 84 28 98 40 C110 24 136 20 150 32 C166 28 190 32 204 46 C214 56 210 72 196 74 C180 76 166 68 154 72 C140 88 116 94 98 86 C84 100 58 102 44 92 C28 94 20 84 20 72 Z';
    return `
      <path d="${body}" fill="${C.turmericSkin}"/>
      <path d="M44 92 C58 102 84 100 98 86 C116 94 140 88 154 72 C166 68 180 76 196 74 C176 84 160 80 150 84 C134 100 112 102 96 94 C80 106 58 104 44 92 Z" fill="${C.turmericRing}" opacity=".55"/>
      <path d="M62 50 C66 58 66 70 62 80 M84 42 C88 52 88 66 84 78 M116 30 C120 42 120 58 116 72 M138 30 C142 42 142 56 138 70 M172 36 C176 46 176 58 172 68 M188 42 C191 50 191 60 188 68" stroke="${C.turmericRing}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <ellipse cx="24" cy="72" rx="9" ry="17" fill="${C.turmericFlesh}"/>
      <ellipse cx="24" cy="72" rx="5" ry="10" fill="${C.turmericCore}"/>
      ${ink(body)}
      ${ink('M24 55 C30 58 33 66 33 72 C33 80 30 86 24 89', 2)}`;
  })(),
};

symbols.curcumaTranche = {
  viewBox: '0 0 80 64',
  body: `
      <path d="M8 32 C8 16 20 6 36 6 L52 8 C66 10 74 20 74 32 C74 46 66 56 52 58 L36 58 C20 58 8 48 8 32 Z" fill="${C.turmericSkin}"/>
      <ellipse cx="36" cy="32" rx="22" ry="26" fill="${C.turmericFlesh}"/>
      <ellipse cx="36" cy="32" rx="15" ry="18" fill="${C.turmericCore}"/>
      <ellipse cx="36" cy="32" rx="15" ry="18" fill="none" stroke="${C.turmericFlesh}" stroke-width="1.5" stroke-dasharray="2 4"/>
      ${ink('M36 6 C20 6 8 16 8 32 C8 48 20 58 36 58 C52 58 58 46 58 32 C58 18 52 6 36 6 Z M36 6 L52 8 C66 10 74 20 74 32 C74 46 66 56 52 58 L36 58', 2.2)}`,
};

symbols.galanga = {
  viewBox: '0 0 244 142',
  body: (() => {
    const body =
      'M16 84 C12 64 30 50 50 54 C58 40 78 34 94 44 C104 28 128 24 142 36 C158 24 186 26 200 42 C220 46 230 64 222 80 C214 96 192 98 178 90 C164 106 136 112 118 102 C102 114 74 114 60 102 C40 112 18 104 16 84 Z';
    return `
      <path d="M196 44 C200 30 208 20 220 14 C218 28 212 38 204 46 Z" fill="${C.galangalPink}"/>
      <path d="M92 46 C92 34 96 24 104 16 C106 28 104 38 100 46 Z" fill="${C.galangalPink}"/>
      <path d="${body}" fill="${C.galangalSkin}"/>
      <path d="M60 102 C74 114 102 114 118 102 C136 112 164 106 178 90 C192 98 214 96 222 80 C208 100 186 102 176 98 C160 114 132 118 116 110 C100 120 72 118 60 102 Z" fill="${C.galangalRing}" opacity=".5"/>
      <path d="M44 58 C48 70 48 86 44 100 M66 48 C70 62 70 82 66 98 M88 44 C92 60 92 82 88 100 M112 34 C116 52 116 80 112 100 M134 32 C138 50 138 78 134 98 M156 30 C160 48 160 74 156 92 M180 34 C184 50 184 72 180 88 M204 46 C207 58 207 72 204 84" stroke="${C.galangalRing}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M36 62 C38 58 42 56 46 56 M58 52 C62 48 66 47 70 48 M150 34 C154 30 158 29 162 30" stroke="${C.galangalPink}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="20" cy="84" rx="9" ry="19" fill="${C.galangalFlesh}"/>
      <ellipse cx="20" cy="84" rx="5" ry="11" fill="none" stroke="${C.galangalRing}" stroke-width="1.4"/>
      ${ink(body)}`;
  })(),
};

symbols.citron = {
  viewBox: '0 0 140 140',
  body: (() => {
    const segs = Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
      return `M70 70 L${(70 + Math.cos(a) * 51).toFixed(1)} ${(70 + Math.sin(a) * 51).toFixed(1)}`;
    }).join(' ');
    return `
      <circle cx="70" cy="70" r="63" fill="${C.limeRind}"/>
      <circle cx="70" cy="70" r="56" fill="${C.limePith}"/>
      <circle cx="70" cy="70" r="51" fill="${C.limeFlesh}"/>
      <path d="M40 42 A40 40 0 0 1 96 34" stroke="${C.limeLight}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".8"/>
      <path d="${segs}" stroke="${C.limePith}" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="70" cy="70" r="7" fill="${C.limePith}"/>
      ${ink('M70 7 A63 63 0 1 1 69.9 7 Z')}`;
  })(),
};

symbols.citronnelle = {
  viewBox: '0 0 60 462',
  body: (() => {
    const stalk = 'M12 452 C5 428 5 398 10 366 L18 44 C19 28 22 16 27 6 L36 4 C38 16 40 30 41 44 L49 366 C54 398 54 428 47 452 C38 459 22 459 12 452 Z';
    return `
      <path d="${stalk}" fill="${C.grass}"/>
      <g clip-path="url(#tige)">
        <path d="M0 318 C16 310 38 326 60 314 L60 470 L0 470 Z" fill="${C.grassBase}"/>
        <path d="M0 404 C18 396 40 410 60 400 L60 418 C40 428 18 414 0 422 Z" fill="${C.grassNode}" opacity=".8"/>
        <path d="M0 0 L60 0 L60 162 C42 172 18 156 0 166 Z" fill="${C.grassTop}"/>
        <path d="M38 0 L60 0 L60 470 L44 470 C46 330 44 160 38 0 Z" fill="${C.ink}" opacity=".13"/>
      </g>
      <path d="M20 450 C20 380 22 250 24 112 M34 448 C35 360 34 240 32 136 M27 300 C27 240 28 180 29 120" stroke="${C.grassTop}" stroke-width="1.8" fill="none" opacity=".95"/>
      <path d="M11 360 C20 352 36 350 49 358 M14 252 C24 246 36 246 46 252" stroke="${C.grassTop}" stroke-width="1.4" fill="none"/>
      <ellipse cx="31.5" cy="6" rx="6" ry="2.8" fill="${C.grassBase}"/>
      <ellipse cx="29.5" cy="452" rx="17" ry="5.6" fill="${C.grassBase}"/>
      <ellipse cx="29.5" cy="452" rx="9" ry="2.8" fill="none" stroke="${C.grassTop}" stroke-width="1.3"/>
      ${ink(stalk)}`;
  })(),
  defs: `<clipPath id="tige"><path d="M12 452 C5 428 5 398 10 366 L18 44 C19 28 22 16 27 6 L36 4 C38 16 40 30 41 44 L49 366 C54 398 54 428 47 452 C38 459 22 459 12 452 Z"/></clipPath>`,
};

// Three stalks tied with market twine.
symbols.botte = {
  viewBox: '0 0 160 430',
  body: (() => {
    const wraps = [268, 280, 292]
      .map((y) => `M24 ${y + 4} C56 ${y - 4} 104 ${y - 4} 136 ${y + 4}`)
      .join(' ');
    return `
      <use href="#citronnelle" x="20" y="16" width="52" height="400" transform="rotate(-4 46 416)"/>
      <use href="#citronnelle" x="88" y="16" width="52" height="400" transform="rotate(4 114 416)"/>
      <use href="#citronnelle" x="54" y="10" width="52" height="400"/>
      <path d="${wraps}" stroke="${C.ink}" stroke-width="6.5" fill="none" stroke-linecap="round" opacity=".55" transform="translate(1.4 1.6)"/>
      <path d="${wraps}" stroke="${C.string}" stroke-width="4.2" fill="none" stroke-linecap="round"/>
      <path d="M110 290 C116 304 114 320 104 334 M114 290 C126 300 134 314 134 330" stroke="${C.ink}" stroke-width="5.6" fill="none" stroke-linecap="round" opacity=".55" transform="translate(1.4 1.6)"/>
      <path d="M110 290 C116 304 114 320 104 334 M114 290 C126 300 134 314 134 330" stroke="${C.string}" stroke-width="3.6" fill="none" stroke-linecap="round"/>
      <circle cx="112" cy="288" r="5" fill="${C.string}" stroke="${C.ink}" stroke-width="1.6"/>`;
  })(),
};

symbols.poivre = {
  viewBox: '0 0 60 40',
  body: [
    [10, 12, 5], [24, 8, 4.6], [36, 16, 5.2], [18, 26, 4.8], [48, 28, 4.4], [32, 32, 4],
  ]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.ink}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.32}" fill="${C.pepper}"/>`)
    .join(''),
};

// Banana leaf, drawn along x with the midrib at y = 210.
symbols.feuille = {
  viewBox: '0 0 1000 420',
  body: (() => {
    const outline = 'M0 200 C40 120 160 40 330 20 C520 0 760 30 1000 150 L1000 270 C760 390 520 420 330 400 C160 380 40 300 0 220 Z';
    const veinsUp = [];
    const veinsDown = [];
    for (let x = -40; x < 1000; x += 17) {
      veinsUp.push(`M${x} 206 C${x + 24} 150 ${x + 62} 80 ${x + 96} 0`);
      veinsDown.push(`M${x} 214 C${x + 24} 270 ${x + 62} 340 ${x + 96} 420`);
    }
    const tears = [
      'M478 6 L452 74 L486 6 Z',
      'M640 14 L606 92 L650 16 Z',
      'M812 66 L776 120 L824 72 Z',
      'M560 412 L528 336 L572 412 Z',
      'M744 384 L712 318 L756 380 Z',
      'M300 400 L280 352 L312 402 Z',
    ];
    return `
      <path d="${outline}" fill="${C.leaf}"/>
      <g clip-path="url(#limbe)">
        <rect x="0" y="210" width="1000" height="210" fill="${C.leafDeep}"/>
        <path d="${veinsUp.join(' ')}" stroke="${C.leafLight}" stroke-width="2" fill="none" opacity=".75"/>
        <path d="${veinsDown.join(' ')}" stroke="${C.leaf}" stroke-width="2" fill="none" opacity=".8"/>
        <rect width="1000" height="420" fill="url(#trame-claire)" opacity=".18"/>
      </g>
      <path d="M0 203 L1000 204 L1000 216 L0 217 Z" fill="${C.rib}"/>
      <path d="M0 214 L1000 214 L1000 216 L0 217 Z" fill="${C.leafDeep}" opacity=".35"/>
      <g fill="var(--dechirure, #F2A51C)">${tears.map((d) => `<path d="${d}"/>`).join('')}</g>
      ${ink(outline, 3)}`;
  })(),
  defs: `<clipPath id="limbe"><path d="M0 200 C40 120 160 40 330 20 C520 0 760 30 1000 150 L1000 270 C760 390 520 420 330 400 C160 380 40 300 0 220 Z"/></clipPath>`,
};

const patterns = `
  <pattern id="trame" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="3" cy="3" r="1.25" fill="${C.ink}"/></pattern>
  <filter id="silhouette" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feFlood flood-color="${C.ink}" flood-opacity=".3"/><feComposite in2="SourceAlpha" operator="in"/></filter>
  <filter id="silhouette-douce" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feFlood flood-color="${C.ink}" flood-opacity=".2"/><feComposite in2="SourceAlpha" operator="in"/></filter>
  <pattern id="trame-claire" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="3.5" cy="3.5" r="1.4" fill="${ENCRES.papier}"/></pattern>`;

const sprite = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
<defs>${patterns}
${Object.values(symbols).map((s) => s.defs || '').join('\n')}
</defs>
${Object.entries(symbols)
  .map(([id, s]) => `<symbol id="${id}" viewBox="${s.viewBox}">${s.body}</symbol>`)
  .join('\n')}
</svg>
`;

// A banana leaf drawn in frame coordinates: rib from A (stem end) to B (tip), both may sit off-frame.
function leaf({ a, b, width, tears = [], step = 15 }) {
  const [ax, ay] = a;
  const [bx, by] = b;
  const len = Math.hypot(bx - ax, by - ay);
  const u = [(bx - ax) / len, (by - ay) / len];
  const n = [u[1], -u[0]];
  const w = (t) => width * Math.pow(Math.sin(Math.PI * Math.min(Math.max(t, 0), 1)), 0.5) * (1 - 0.18 * t);
  const at = (t, side, k = 1) => [ax + (bx - ax) * t + n[0] * w(t) * side * k, ay + (by - ay) * t + n[1] * w(t) * side * k];
  const f = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  const N = 64;
  const up = Array.from({ length: N + 1 }, (_, i) => at(i / N, 1));
  const down = Array.from({ length: N + 1 }, (_, i) => at(i / N, -1)).reverse();
  const outline = `M${f(up[0])} ` + up.slice(1).map((p) => `L${f(p)}`).join(' ') + ' ' + down.map((p) => `L${f(p)}`).join(' ') + ' Z';
  const upperHalf = `M${f(up[0])} ` + up.slice(1).map((p) => `L${f(p)}`).join(' ') + ` L${f([bx, by])} L${f([ax, ay])} Z`;
  const veins = [];
  const count = Math.floor(len / step);
  for (let i = 1; i < count; i++) {
    const t = i / count;
    for (const side of [1, -1]) {
      const s0 = at(t, side, 0);
      const e = at(Math.min(t + 0.07, 1), side, 1.02);
      const c = at(t + 0.015, side, 0.55);
      veins.push({ side, d: `M${f(s0)} Q${f(c)} ${f(e)}` });
    }
  }
  const tearPaths = tears.map(([t, depth, gap]) => {
    const e = at(t, 1, 1.04);
    const e2 = at(t + gap, 1, 1.04);
    const inner = at(t - 0.03, 1, 1 - depth);
    return `M${f(e)} L${f(inner)} L${f(e2)} Z`;
  });
  const rib = [at(0, 1, 0.022), at(1, 1, 0.006), at(1, -1, 0.006), at(0, -1, 0.022)];
  return { outline, upperHalf, veins, tearPaths, rib: `M${rib.map(f).join(' L')} Z` };
}

const drawLeaf = (id, l) => `
  <clipPath id="${id}-clip"><path d="${l.outline}"/></clipPath>
  <g filter="url(#silhouette-douce)" transform="translate(14 18)"><path d="${l.outline}"/></g>
  <path d="${l.outline}" fill="${C.leafDeep}"/>
  <g clip-path="url(#${id}-clip)">
    <path d="${l.upperHalf}" fill="${C.leaf}"/>
    <path d="${l.veins.filter((v) => v.side === 1).map((v) => v.d).join(' ')}" stroke="${C.leafLight}" stroke-width="2.2" fill="none" opacity=".7"/>
    <path d="${l.veins.filter((v) => v.side === -1).map((v) => v.d).join(' ')}" stroke="${C.leaf}" stroke-width="2.2" fill="none" opacity=".85"/>
    <rect x="-200" y="-200" width="1400" height="1400" fill="url(#trame-claire)" opacity=".14"/>
  </g>
  <path d="${l.rib}" fill="${C.rib}"/>
  <g fill="var(--dechirure, ${C.ground})">${l.tearPaths.map((d) => `<path d="${d}"/>`).join('')}</g>
  ${ink(l.outline, 3)}`;

const place = (id, x, y, w, rot = 0, attrs = '') => {
  const [, , vw, vh] = symbols[id].viewBox.split(' ').map(Number);
  const h = (w * vh) / vw;
  return `<use href="#${id}" x="${(-w / 2).toFixed(1)}" y="${(-h / 2).toFixed(1)}" width="${w}" height="${h.toFixed(1)}" transform="translate(${x} ${y}) rotate(${rot})"${attrs}/>`;
};

const compose = ({ id, viewBox, title, leafSpec, items }) => {
  const l = leaf(leafSpec);
  const shadows = items.map(([sym, x, y, w, r]) => place(sym, x, y, w, r)).join('');
  const pieces = items.map(([sym, x, y, w, r], i) => place(sym, x, y, w, r, ` class="piece" style="--i:${i}"`)).join('\n  ');
  // Deux calques superposés : la feuille glisse d'un bloc (composée sur le GPU), les ingrédients tombent dessus.
  return `<svg class="etal__feuille" xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${drawLeaf(id, l)}
</svg>
<svg class="etal__pieces" xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-labelledby="${id}-titre" preserveAspectRatio="xMidYMid slice">
  <title id="${id}-titre">${title}</title>
  <g class="ombres" filter="url(#silhouette)" transform="translate(9 12)">${shadows}</g>
  ${pieces}
</svg>
`;
};

const titre = 'Citronnelle, galanga, curcuma, feuilles de combava, ail, échalotes, citron vert et piments sur une feuille de bananier (illustration)';

// Desktop: portrait frame for the right half of the first viewport.
const etal = compose({
  id: 'etal',
  viewBox: '0 0 800 900',
  title: titre,
  leafSpec: {
    a: [40, 1040],
    b: [1040, 40],
    width: 430,
    tears: [
      [0.3, 0.32, 0.012],
      [0.46, 0.22, 0.01],
      [0.6, 0.4, 0.014],
      [0.74, 0.26, 0.012],
    ],
  },
  items: [
    ['combava', 610, 236, 190, -40],
    ['combava', 660, 640, 190, 34],
    ['combava', 300, 770, 196, -12],
    ['botte', 410, 520, 190, 50],
    ['galanga', 616, 426, 252, -36],
    ['curcuma', 552, 712, 210, 14],
    ['curcumaTranche', 694, 800, 74, -12],
    ['curcumaTranche', 430, 690, 64, 22],
    ['ail', 724, 292, 142, 12],
    ['echalote', 236, 610, 92, -22],
    ['echalote', 306, 650, 82, 10],
    ['citron', 478, 352, 132, 0],
    ['piment', 640, 566, 122, -28],
    ['piment', 664, 596, 112, -48],
    ['piment', 236, 470, 112, 28],
    ['poivre', 370, 770, 54, 0],
    ['poivre', 760, 520, 46, 40],
  ],
});

// Mobile: a landscape band that sits under the call buttons.
const bande = compose({
  id: 'bande',
  viewBox: '0 0 800 440',
  title: titre,
  leafSpec: {
    a: [-160, 600],
    b: [980, -40],
    width: 330,
    tears: [
      [0.36, 0.3, 0.014],
      [0.55, 0.34, 0.012],
      [0.7, 0.22, 0.012],
    ],
  },
  items: [
    ['combava', 250, 340, 170, -20],
    ['combava', 610, 140, 170, 30],
    ['botte', 330, 220, 140, 66],
    ['galanga', 560, 262, 210, -24],
    ['citron', 442, 316, 112, 0],
    ['ail', 712, 236, 116, 10],
    ['curcuma', 176, 384, 170, 8],
    ['echalote', 112, 300, 74, -16],
    ['piment', 478, 150, 108, -30],
    ['piment', 664, 364, 104, 20],
    ['poivre', 300, 390, 44, 0],
  ],
});

writeFileSync(`${root}src/svg/sprite.svg`, sprite);
writeFileSync(`${root}src/svg/etal.svg`, etal);
writeFileSync(`${root}src/svg/etal-bande.svg`, bande);
console.log('sprite.svg', sprite.length, 'bytes · etal.svg', etal.length, 'bytes');
