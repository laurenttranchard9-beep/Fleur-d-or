// Dessine les plats vus du dessus, au style épuré (aplats, dégradés doux, aucune ligne d'encre).
// Sortie : public/assets/img/plats/<plat>.svg, affichés en <img> (le texte alternatif vit dans la page),
// plus la soupe en deux couches pour la scène « fait maison » : soupe-bol.svg (le bol vide, en <img>)
// et soupe-garniture.svg (chaque ingrédient dans son groupe, insérée dans la page et animée au défilement).
// Usage : node tools/plats.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const OUT = `${root}public/assets/img/plats`;

// Générateur pseudo-aléatoire déterministe : le dessin est identique à chaque génération.
const hasard = (graine) => () => {
  graine = (graine * 1664525 + 1013904223) % 4294967296;
  return graine / 4294967296;
};
const f = (n) => Number(n.toFixed(1));

// Point au hasard dans un disque, réparti uniformément.
const dansDisque = (r, R) => {
  const a = r() * Math.PI * 2;
  const d = Math.sqrt(r()) * R;
  return [Math.cos(a) * d, Math.sin(a) * d];
};

const defs = (id) => `
  <radialGradient id="${id}-ceramique" cx="42%" cy="38%" r="70%">
    <stop offset="0" stop-color="#ffffff"/><stop offset=".72" stop-color="#f1eee9"/><stop offset="1" stop-color="#d8d3cb"/>
  </radialGradient>
  <radialGradient id="${id}-creux" cx="55%" cy="60%" r="65%">
    <stop offset="0" stop-color="#fbfaf7"/><stop offset=".8" stop-color="#e7e2da"/><stop offset="1" stop-color="#cfc8bd"/>
  </radialGradient>
  <filter id="${id}-ombre" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter>
  <filter id="${id}-doux" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>`;

const bol = (id, r) => `
  <ellipse cx="0" cy="${f(r * 0.1)}" rx="${r * 0.98}" ry="${r * 0.98}" fill="#000" opacity=".28" filter="url(#${id}-ombre)"/>
  <circle r="${r}" fill="url(#${id}-ceramique)"/>
  <circle r="${f(r * 0.86)}" fill="url(#${id}-creux)"/>
  <circle r="${r - 1}" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>`;

const assiette = (id, r) => `
  <ellipse cx="0" cy="${f(r * 0.08)}" rx="${r * 0.98}" ry="${r * 0.98}" fill="#000" opacity=".24" filter="url(#${id}-ombre)"/>
  <circle r="${r}" fill="url(#${id}-ceramique)"/>
  <circle r="${f(r * 0.74)}" fill="#f7f5f1"/>
  <circle r="${f(r * 0.74)}" fill="none" stroke="#e2ddd5" stroke-width="3"/>`;

// Crevette décortiquée vue de dessus : un « C » qui s'affine vers la queue, anneaux clairs, queue en éventail.
const crevette = (x, y, rot, s = 1) => {
  const a0 = -0.7;
  const a1 = 3.9;
  const N = 18;
  const ext = [];
  const int = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = a0 + (a1 - a0) * t;
    const re = (44 - 12 * t) * s;
    const ri = (17 + 5 * t) * s;
    ext.push([Math.cos(a) * re, Math.sin(a) * re]);
    int.push([Math.cos(a) * ri, Math.sin(a) * ri]);
  }
  const corps = `M${ext.map(([u, v]) => `${f(u)} ${f(v)}`).join(' L')} L${int.reverse().map(([u, v]) => `${f(u)} ${f(v)}`).join(' L')} Z`;
  const anneaux = [0.16, 0.32, 0.48, 0.64, 0.8]
    .map((t) => {
      const a = a0 + (a1 - a0) * t;
      const re = (42 - 12 * t) * s;
      const ri = (19 + 5 * t) * s;
      return `M${f(Math.cos(a) * ri)} ${f(Math.sin(a) * ri)} L${f(Math.cos(a) * re)} ${f(Math.sin(a) * re)}`;
    })
    .join(' ');
  const ax = Math.cos(a1) * 26 * s;
  const ay = Math.sin(a1) * 26 * s;
  const tangente = a1 + Math.PI / 2;
  const queue = (dx) =>
    `M${f(ax)} ${f(ay)} q ${f(Math.cos(tangente + dx) * 16 * s)} ${f(Math.sin(tangente + dx) * 16 * s)} ${f(Math.cos(tangente + dx * 1.6) * 30 * s)} ${f(Math.sin(tangente + dx * 1.6) * 30 * s)} q ${f(Math.cos(tangente) * -10 * s)} ${f(Math.sin(tangente) * -10 * s)} ${f(Math.cos(tangente - dx) * -24 * s)} ${f(Math.sin(tangente - dx) * -24 * s)} Z`;
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">
    <path d="${corps}" fill="#000" opacity=".16" transform="translate(${f(3 * s)} ${f(5 * s)})"/>
    <path d="${queue(0.45)} ${queue(-0.45)}" fill="#cf4a2c"/>
    <path d="${corps}" fill="#ef8059"/>
    <path d="${anneaux}" stroke="#ffc3a8" stroke-width="${f(2.6 * s)}" stroke-linecap="round"/>
    <path d="M${f(Math.cos(a0 + 0.4) * 34 * s)} ${f(Math.sin(a0 + 0.4) * 34 * s)} A${f(34 * s)} ${f(34 * s)} 0 0 1 ${f(Math.cos(a0 + 2.2) * 34 * s)} ${f(Math.sin(a0 + 2.2) * 34 * s)}" stroke="#ffd2bd" stroke-width="${f(5 * s)}" fill="none" stroke-linecap="round" opacity=".55"/>
  </g>`;
};

// Tranche de porc : ovale rosé à bord grillé.
const porc = (x, y, rot, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">
    <ellipse rx="${f(40 * s)}" ry="${f(25 * s)}" fill="#b9735a"/>
    <ellipse rx="${f(34 * s)}" ry="${f(19 * s)}" fill="#e3b3a0"/>
    <path d="M${f(-22 * s)} ${f(-6 * s)} C ${f(-8 * s)} ${f(-14 * s)} ${f(10 * s)} ${f(-12 * s)} ${f(24 * s)} ${f(-4 * s)}" stroke="#f3d4c7" stroke-width="${f(4 * s)}" fill="none" stroke-linecap="round"/>
  </g>`;

const ciboule = (x, y, s = 1) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(6 * s)}" fill="none" stroke="#5aa64a" stroke-width="${f(3.4 * s)}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(2.6 * s)}" fill="#cfe8b4"/>`;

const coriandre = (x, y, rot, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${s})">
    <path d="M0 0 C -10 -8 -18 -4 -16 6 C -10 12 -2 8 0 0 Z M0 0 C 2 -12 12 -16 18 -8 C 16 2 6 4 0 0 Z M0 0 C 8 6 10 16 2 20 C -6 18 -6 8 0 0 Z" fill="#3f9a43"/>
    <path d="M0 0 L -10 2 M0 0 L 10 -6 M0 0 L 3 12" stroke="#86c56f" stroke-width="1.4"/>
  </g>`;

const citronVert = (x, y, rot, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${s})">
    <path d="M0 0 L 60 0 A 60 60 0 0 1 0 60 Z" fill="#4f9a2f"/>
    <path d="M0 0 L 54 0 A 54 54 0 0 1 0 54 Z" fill="#eef3c7"/>
    <path d="M0 0 L 49 0 A 49 49 0 0 1 0 49 Z" fill="#b9d65f"/>
    <path d="M0 0 L 49 0 M0 0 L 42 25 M0 0 L 25 42 M0 0 L 0 49" stroke="#eef3c7" stroke-width="3"/>
  </g>`;

const piment = (x, y, s = 1) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(7 * s)}" fill="#d8352a"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(3.4 * s)}" fill="#f6d6a8"/><circle cx="${f(x + 1.2 * s)}" cy="${f(y - 1 * s)}" r="${f(1.1 * s)}" fill="#fff4dd"/>`;

// Paire de baguettes en bois clair, posées en travers. Sans flou, l'ombre reste nette (couche animée : rien de coûteux à repeindre).
const baguettes = (id, x, y, rot, l = 520, flou = true) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">
    <rect x="${-l / 2 + 8}" y="6" width="${l}" height="13" rx="6.5" fill="#000" opacity="${flou ? '.22' : '.14'}"${flou ? ` filter="url(#${id}-doux)"` : ''}/>
    <rect x="${-l / 2}" y="-16" width="${l}" height="12" rx="6" fill="url(#${id}-bois)"/>
    <rect x="${-l / 2 + 14}" y="2" width="${l - 14}" height="12" rx="6" fill="url(#${id}-bois)"/>
  </g>`;

const bois = (id) => `<linearGradient id="${id}-bois" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ecd2ac"/><stop offset=".5" stop-color="#d6ac77"/><stop offset="1" stop-color="#b98652"/>
  </linearGradient>`;

// Nid de nouilles de riz : de longues courbes régulières serrées autour d'un centre.
const nid = (r, cx, cy, R, n) =>
  Array.from({ length: n }, () => {
    const a = r() * Math.PI * 2;
    const d = R * (0.25 + r() * 0.75);
    const x0 = cx + Math.cos(a) * d;
    const y0 = cy + Math.sin(a) * d;
    const b = a + Math.PI * (0.55 + r() * 0.5);
    const x1 = cx + Math.cos(b) * d * (0.7 + r() * 0.4);
    const y1 = cy + Math.sin(b) * d * (0.7 + r() * 0.4);
    const c = a + (b - a) / 2;
    return `M${f(x0)} ${f(y0)} Q ${f(cx + Math.cos(c) * d * 1.5)} ${f(cy + Math.sin(c) * d * 1.5)} ${f(x1)} ${f(y1)}`;
  }).join(' ');

// --- Soupe Phnom Penh -------------------------------------------------------------------------------
// « entier » : le dessin complet. « bol » et « garniture » : les deux couches de la scène, même tirage au hasard,
// donc exactement la même soupe ; dans la garniture, chaque ingrédient porte sa fenêtre d'arrivée (data-de → data-a,
// en part du défilement de la scène) et sa façon d'arriver (verse, tourne, tombe, glisse, fondu).
const soupe = (mode = 'entier') => {
  const r = hasard(7);
  const entier = mode === 'entier';
  const id = entier ? 'soupe' : 'etapes';
  const nouilles = nid(r, -20, 20, 125, 34);
  const soja = Array.from({ length: 7 }, () => {
    const [x, y] = dansDisque(r, 130);
    const a = r() * Math.PI * 2;
    return `<path d="M${f(x)} ${f(y)} q ${f(Math.cos(a) * 20)} ${f(Math.sin(a) * 20 - 8)} ${f(Math.cos(a) * 34)} ${f(Math.sin(a) * 34)}" stroke="#fbf6e6" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="${f(x)}" cy="${f(y)}" r="4.5" fill="#f0d98c"/>`;
  });
  const ail = Array.from({ length: 30 }, () => {
    const [x, y] = dansDisque(r, 180);
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.8 + r() * 2.4)}" fill="#e7ad52"/>`;
  }).join('');
  const cib = Array.from({ length: 16 }, () => ciboule(...dansDisque(r, 170), 0.9 + r() * 0.4)).join('');
  const brins = `<path d="${nouilles}" stroke="#b07a3a" stroke-width="7" fill="none" stroke-linecap="round" opacity=".35" transform="translate(2 3)"/>
    <path d="${nouilles}" stroke="#f8edd2" stroke-width="5.5" fill="none" stroke-linecap="round"/>
    <path d="${nouilles}" stroke="#ffffff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7" transform="translate(-1 -1.4)"/>`;
  const porcs = [porc(-92, -58, 24), porc(-40, -110, -8, 0.92), porc(-118, 18, 74, 0.95)];
  const crevettes = [crevette(78, -40, 20), crevette(26, 86, 150, 0.95), crevette(112, 70, 250, 0.9)];
  const herbes = [coriandre(-52, 92, 20, 1.15), coriandre(-8, 48, 140, 1), coriandre(46, -118, 60, 1.2), coriandre(140, -10, 100, 1)];
  const piments = [piment(-128, 84), piment(-142, 110, 0.9), piment(132, -96)];
  const reflet = '<path d="M -150 -80 A 170 170 0 0 1 -40 -168" stroke="#fff" stroke-width="16" fill="none" stroke-linecap="round" opacity=".16"/>';
  const bouillonDefs = `<radialGradient id="${id}-bouillon" cx="42%" cy="38%" r="66%">
      <stop offset="0" stop-color="#f3cd86"/><stop offset=".62" stop-color="#dfa24c"/><stop offset=".92" stop-color="#bf7a2f"/><stop offset="1" stop-color="#a4652a"/>
    </radialGradient>
    <clipPath id="${id}-surface"><circle r="202"/></clipPath>`;

  if (entier) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-330 -330 660 660">
  <title>Soupe Phnom Penh vue du dessus : bouillon clair, nouilles de riz, porc et crevettes (illustration)</title>
  <defs>${defs(id)}${bois(id)}
    ${bouillonDefs}
  </defs>
  ${bol(id, 264)}
  <circle r="202" fill="url(#${id}-bouillon)"/>
  <g clip-path="url(#${id}-surface)">
    ${brins}
    ${soja.join('')}
    ${porcs.join('')}
    ${crevettes.join('')}
    ${cib}
    ${herbes.join('')}
    ${ail}
    ${piments.join('')}
    ${reflet}
  </g>
  <circle r="202" fill="none" stroke="#8a5223" stroke-width="5" opacity=".18"/>
  ${citronVert(96, -150, 12, 0.92)}
  ${baguettes(id, 70, 210, -28, 500)}
</svg>
`;
  }

  if (mode === 'bol') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-330 -330 660 660">
  <title>Bol vide vu du dessus (illustration)</title>
  <defs>${defs('bol')}</defs>
  ${bol('bol', 264)}
</svg>
`;
  }

  const fenetre = (de, a) => `data-de="${f(de * 100) / 100}" data-a="${f(a * 100) / 100}"`;
  const piece = (contenu, de, a, effet) => `<g class="piece piece--${effet}" ${fenetre(de, a)}>${contenu}</g>`;
  const suite = (liste, de, pas, duree, effet) => liste.map((c, i) => piece(c, de + i * pas, de + i * pas + duree, effet)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-330 -330 660 660" class="scene__garniture" aria-hidden="true" focusable="false">
  <defs>${bois(id)}
    ${bouillonDefs}
  </defs>
  ${piece(`<circle r="202" fill="url(#${id}-bouillon)"/>`, 0.06, 0.24, 'verse')}
  <g clip-path="url(#${id}-surface)">
    ${piece(brins, 0.18, 0.36, 'tourne')}
    ${suite(soja, 0.3, 0.014, 0.08, 'tombe')}
    ${suite(porcs, 0.38, 0.03, 0.1, 'tombe')}
    ${suite(crevettes, 0.46, 0.03, 0.1, 'tombe')}
    ${piece(cib, 0.58, 0.68, 'tombe')}
    ${suite(herbes, 0.62, 0.02, 0.08, 'tombe')}
    ${piece(ail, 0.66, 0.74, 'tombe')}
    ${suite(piments, 0.7, 0.02, 0.07, 'tombe')}
    ${piece(reflet, 0.74, 0.84, 'fondu')}
  </g>
  ${piece('<circle r="202" fill="none" stroke="#8a5223" stroke-width="5" opacity=".18"/>', 0.06, 0.24, 'fondu')}
  ${piece(citronVert(96, -150, 12, 0.92), 0.76, 0.86, 'tombe')}
  ${piece(baguettes(id, 70, 210, -28, 500, false), 0.82, 0.94, 'glisse')}
</svg>
`;
};

// --- Garnitures communes -----------------------------------------------------------------------------

// Feuille de laitue froissée : bord ondulé, nervure claire.
const laitue = (x, y, rot, s = 1, teinte = 0) => {
  const pts = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 40) * Math.PI * 2;
    const rx = 70 * s * (1 + 0.08 * Math.sin(a * 9) + 0.05 * Math.sin(a * 17));
    const ry = 44 * s * (1 + 0.08 * Math.sin(a * 9 + 1) + 0.05 * Math.sin(a * 13));
    return `${f(Math.cos(a) * rx)} ${f(Math.sin(a) * ry)}`;
  });
  const vert = ['#7cc35a', '#8fcf63', '#6bb64e'][teinte % 3];
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">
    <path d="M${pts.join(' L')} Z" fill="${vert}"/>
    <path d="M${pts.join(' L')} Z" fill="#d9f0b8" opacity=".45" transform="scale(.62) translate(-12 -6)"/>
    <path d="M${f(-60 * s)} ${f(4 * s)} C ${f(-20 * s)} ${f(-6 * s)} ${f(20 * s)} ${f(-4 * s)} ${f(60 * s)} ${f(2 * s)}" stroke="#e8f6cf" stroke-width="${f(4 * s)}" fill="none" stroke-linecap="round"/>
  </g>`;
};

const tomate = (x, y, s = 1) => {
  const loges = [0, 1, 2, 3]
    .map((i) => `<ellipse rx="${f(9 * s)}" ry="${f(13 * s)}" fill="#ff8a72" transform="rotate(${i * 90 + 45}) translate(0 ${f(-14 * s)})"/>`)
    .join('');
  const pepins = [0, 1, 2, 3].map((i) => `<circle r="${f(2 * s)}" fill="#ffe2a8" transform="rotate(${i * 90 + 45}) translate(0 ${f(-14 * s)})"/>`).join('');
  return `<g transform="translate(${f(x)} ${f(y)})"><circle r="${f(30 * s)}" fill="#e2412f"/><circle r="${f(26 * s)}" fill="#f2604a"/>${loges}${pepins}<circle r="${f(5 * s)}" fill="#f9b29f"/></g>`;
};

const concombre = (x, y, s = 1) => {
  const pepins = Array.from({ length: 6 }, (_, i) => `<ellipse rx="${f(2 * s)}" ry="${f(4 * s)}" fill="#f6fbe8" transform="rotate(${i * 60}) translate(0 ${f(-9 * s)})"/>`).join('');
  return `<g transform="translate(${f(x)} ${f(y)})"><circle r="${f(26 * s)}" fill="#3f7d34"/><circle r="${f(23 * s)}" fill="#cfe6a6"/><circle r="${f(16 * s)}" fill="#e4f2c6"/>${pepins}</g>`;
};

const oignon = (x, y, s = 1) =>
  `<g transform="translate(${f(x)} ${f(y)})"><circle r="${f(24 * s)}" fill="none" stroke="#9c4e86" stroke-width="${f(4 * s)}"/><circle r="${f(15 * s)}" fill="none" stroke="#c48ab4" stroke-width="${f(3.4 * s)}"/></g>`;

// Cube de bœuf saisi : arrondi, brillant de sauce.
const boeuf = (x, y, rot, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">
    <rect x="${f(-22 * s)}" y="${f(-19 * s)}" width="${f(44 * s)}" height="${f(40 * s)}" rx="${f(11 * s)}" fill="#000" opacity=".2" transform="translate(${f(3 * s)} ${f(4 * s)})"/>
    <rect x="${f(-22 * s)}" y="${f(-19 * s)}" width="${f(44 * s)}" height="${f(40 * s)}" rx="${f(11 * s)}" fill="#6e3a21"/>
    <rect x="${f(-17 * s)}" y="${f(-15 * s)}" width="${f(32 * s)}" height="${f(28 * s)}" rx="${f(9 * s)}" fill="#8f4d2a"/>
    <path d="M${f(-12 * s)} ${f(-9 * s)} q ${f(10 * s)} ${f(-5 * s)} ${f(20 * s)} ${f(-1 * s)}" stroke="#d48a5a" stroke-width="${f(3.4 * s)}" fill="none" stroke-linecap="round" opacity=".8"/>
  </g>`;

// Nem frit : cylindre doré, cloques claires, bouts plus foncés.
const nem = (id, x, y, rot, l = 150, s = 1, r) => {
  const cloques = Array.from({ length: 16 }, () => {
    const cx = (r() - 0.5) * (l - 30);
    const cy = (r() - 0.5) * 22 * s;
    return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(3 + r() * 4)}" ry="${f(2 + r() * 2)}" fill="#f7c879" opacity=".75"/>`;
  }).join('');
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">
    <rect x="${-l / 2 + 4}" y="${f(-16 * s + 6)}" width="${l}" height="${f(34 * s)}" rx="${f(16 * s)}" fill="#000" opacity=".2" filter="url(#${id}-doux)"/>
    <rect x="${-l / 2}" y="${f(-17 * s)}" width="${l}" height="${f(34 * s)}" rx="${f(17 * s)}" fill="url(#${id}-dore)"/>
    ${cloques}
    <path d="M${-l / 2 + 18} ${f(-8 * s)} L ${l / 2 - 18} ${f(-8 * s)}" stroke="#fde3a7" stroke-width="${f(4 * s)}" stroke-linecap="round" opacity=".6"/>
  </g>`;
};

const dore = (id) => `<linearGradient id="${id}-dore" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f0b155"/><stop offset=".55" stop-color="#d98b2f"/><stop offset="1" stop-color="#a95f1c"/>
  </linearGradient>`;

const menthe = (x, y, rot, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${s})">
    <ellipse cx="-10" cy="0" rx="13" ry="8" fill="#2f8a43" transform="rotate(-20 -10 0)"/>
    <ellipse cx="10" cy="-2" rx="13" ry="8" fill="#3c9a4d" transform="rotate(25 10 -2)"/>
    <ellipse cx="0" cy="-14" rx="10" ry="7" fill="#4aa857"/>
    <path d="M-20 4 L 20 -6 M0 -6 L 0 -20" stroke="#8fd08a" stroke-width="1.4"/>
  </g>`;

// Coupelle de sauce : nuoc cham ambré, carottes et piment.
const coupelle = (id, x, y, rr, sauce, garniture = '') => `<g transform="translate(${f(x)} ${f(y)})">
    <circle r="${rr}" fill="#000" opacity=".22" filter="url(#${id}-doux)" transform="translate(4 7)"/>
    <circle r="${rr}" fill="url(#${id}-ceramique)"/>
    <circle r="${f(rr * 0.78)}" fill="${sauce}"/>
    <circle r="${f(rr * 0.78)}" fill="none" stroke="#000" stroke-width="3" opacity=".08"/>
    ${garniture}
    <path d="M ${f(-rr * 0.5)} ${f(-rr * 0.35)} A ${f(rr * 0.62)} ${f(rr * 0.62)} 0 0 1 ${f(rr * 0.1)} ${f(-rr * 0.62)}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".35"/>
  </g>`;

// Dôme de riz jasmin : grains clairs sur fond blanc ombré.
const riz = (id, x, y, rr, r) => {
  const grains = Array.from({ length: Math.round(rr * 2.2) }, () => {
    const [gx, gy] = dansDisque(r, rr - 6);
    return `<ellipse cx="${f(gx)}" cy="${f(gy)}" rx="5" ry="2.2" fill="#ffffff" transform="rotate(${f(r() * 180)} ${f(gx)} ${f(gy)})"/>`;
  }).join('');
  return `<g transform="translate(${f(x)} ${f(y)})">
    <circle r="${rr}" fill="#000" opacity=".16" filter="url(#${id}-doux)" transform="translate(5 9)"/>
    <circle r="${rr}" fill="url(#${id}-riz)"/>
    ${grains}
  </g>`;
};

const rizDefs = (id) => `<radialGradient id="${id}-riz" cx="40%" cy="36%" r="70%">
    <stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#f1ede4"/><stop offset="1" stop-color="#d9d2c4"/>
  </radialGradient>`;

const carottes = (r, n, R, cx = 0, cy = 0) =>
  Array.from({ length: n }, () => {
    const [x, y] = dansDisque(r, R);
    const a = r() * Math.PI;
    const l = 26 + r() * 22;
    return `<path d="M${f(cx + x)} ${f(cy + y)} l ${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}" stroke="#f28b2e" stroke-width="4.5" stroke-linecap="round"/>`;
  }).join('');

const cacahuetes = (r, n, R, cx = 0, cy = 0) =>
  Array.from({ length: n }, () => {
    const [x, y] = dansDisque(r, R);
    return `<path d="M${f(cx + x)} ${f(cy + y)} l ${f(4 + r() * 4)} ${f(-2 - r() * 3)} l ${f(3 + r() * 3)} ${f(4 + r() * 3)} l ${f(-6 - r() * 3)} ${f(3)} Z" fill="#e2bd7f"/>`;
  }).join('');

// --- Lok lac ----------------------------------------------------------------------------------------
const loklac = () => {
  const r = hasard(11);
  const id = 'loklac';
  const cubes = Array.from({ length: 13 }, () => {
    const [x, y] = dansDisque(r, 70);
    return boeuf(x + 10, y - 10, r() * 90, 0.95 + r() * 0.25);
  }).join('');
  const poivre = Array.from({ length: 22 }, () => {
    const [x, y] = dansDisque(r, 30);
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.4 + r() * 1.2)}" fill="#2b2118"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-330 -330 660 660">
  <title>Lok lac vu du dessus : bœuf mariné sauté sur salade, tomates et oignon (illustration)</title>
  <defs>${defs(id)}${bois(id)}</defs>
  ${assiette(id, 250)}
  ${laitue(-60, -40, -20, 1.45, 0)}${laitue(40, 50, 30, 1.35, 1)}${laitue(-30, 70, -60, 1.1, 2)}${laitue(60, -70, 70, 1.15, 1)}
  ${tomate(-120, 40, 1)}${tomate(-100, 95, 0.9)}${concombre(115, 30, 1)}${concombre(120, -30, 0.92)}
  ${oignon(-20, -125, 1)}${oignon(20, 120, 0.9)}
  ${cubes}
  ${coupelle(id, 205, 195, 62, '#f3e3b0', `<g>${poivre}</g>${citronVert(-6, 6, -20, 0.42)}`)}
  ${baguettes(id, -120, 228, 12, 430)}
</svg>
`;
};

// --- Nems -------------------------------------------------------------------------------------------
const nems = () => {
  const r = hasard(23);
  const id = 'nems';
  const rouleaux = [0, 1, 2, 3, 4].map((i) => nem(id, -10 + i * 4, -96 + i * 44, -14, 180, 1, r)).join('');
  const garniture = `${carottes(r, 6, 26)}${piment(-10, -12, 0.8)}${piment(12, 10, 0.8)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-330 -330 660 660">
  <title>Nems au porc vus du dessus : cinq rouleaux dorés, salade, menthe et sauce (illustration)</title>
  <defs>${defs(id)}${dore(id)}</defs>
  ${assiette(id, 250)}
  ${laitue(-120, -40, 80, 1.15, 0)}${laitue(-110, 80, 60, 1.05, 2)}
  ${menthe(-150, 10, 20, 1.2)}${menthe(-120, 140, -30, 1.1)}${menthe(-150, -120, 60, 1.1)}
  ${rouleaux}
  ${coupelle(id, 200, -190, 66, '#e9a65a', garniture)}
</svg>
`;
};

// --- Bo bun -----------------------------------------------------------------------------------------
const bobun = () => {
  const r = hasard(31);
  const id = 'bobun';
  const vermicelles = nid(r, 0, 0, 150, 60);
  const lamelles = Array.from({ length: 9 }, () => {
    const [x, y] = dansDisque(r, 50);
    const a = r() * 180;
    return `<g transform="translate(${f(x - 20)} ${f(y - 50)}) rotate(${f(a)})"><rect x="-26" y="-9" width="52" height="18" rx="8" fill="#7a3f22"/><rect x="-20" y="-5" width="34" height="9" rx="4.5" fill="#a35d34"/></g>`;
  }).join('');
  const tronçons = [
    [70, 40, 20],
    [100, -10, 70],
    [40, 95, -40],
  ]
    .map(
      ([x, y, a]) => `<g transform="translate(${x} ${y}) rotate(${a})">
      <rect x="-30" y="-16" width="60" height="32" rx="14" fill="url(#${id}-dore)"/>
      <ellipse cx="30" cy="0" rx="9" ry="15" fill="#f3d9a3"/><ellipse cx="30" cy="0" rx="5" ry="10" fill="#c8915f"/></g>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-330 -330 660 660">
  <title>Bo bun vu du dessus : vermicelles, bœuf sauté, nems, carottes, cacahuètes et herbes (illustration)</title>
  <defs>${defs(id)}${dore(id)}${bois(id)}
    <clipPath id="${id}-creux-clip"><circle r="222"/></clipPath>
  </defs>
  ${bol(id, 264)}
  <g clip-path="url(#${id}-creux-clip)">
    ${laitue(-120, 60, 30, 1.2, 0)}${laitue(-80, -120, -40, 1.1, 1)}${laitue(130, -90, 50, 1.1, 2)}
    <path d="${vermicelles}" stroke="#d9d2c1" stroke-width="5" fill="none" stroke-linecap="round" transform="translate(2 3)"/>
    <path d="${vermicelles}" stroke="#fbf8f0" stroke-width="3.6" fill="none" stroke-linecap="round"/>
    ${carottes(r, 16, 60, -110, 0)}${carottes(r, 10, 40, 60, -110)}
    ${lamelles}
    ${tronçons}
    ${cacahuetes(r, 30, 70, 10, 10)}
    ${menthe(-40, 110, 20, 1.2)}${menthe(110, 110, -40, 1.1)}${coriandre(-130, -40, 30, 1.3)}
  </g>
  ${baguettes(id, 40, 222, -20, 480)}
</svg>
`;
};

// --- Porc au caramel --------------------------------------------------------------------------------
const caramel = () => {
  const r = hasard(41);
  const id = 'caramel';
  const morceaux = Array.from({ length: 13 }, () => {
    const [x, y] = dansDisque(r, 118);
    const a = r() * 180;
    const s = 1.15 + r() * 0.3;
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)}) scale(${f(s)})">
      <rect x="-30" y="-24" width="60" height="48" rx="16" fill="#000" opacity=".22" transform="translate(4 6)"/>
      <rect x="-30" y="-24" width="60" height="48" rx="16" fill="#7a3510"/>
      <rect x="-26" y="-20" width="52" height="16" rx="8" fill="#d79a5c"/>
      <rect x="-26" y="-2" width="52" height="20" rx="9" fill="#a2501c"/>
      <path d="M-18 -14 q 16 -5 34 -1" stroke="#f6d2a2" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>
      <path d="M-16 6 q 14 -4 28 0" stroke="#e5975d" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".8"/>
    </g>`;
  }).join('');
  const cib = Array.from({ length: 14 }, () => ciboule(...dansDisque(r, 150), 1.1)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-330 -330 660 660">
  <title>Porc au caramel vu du dessus : morceaux laqués dans leur sauce, ciboule (illustration)</title>
  <defs>${defs(id)}${bois(id)}
    <radialGradient id="${id}-sauce" cx="42%" cy="38%" r="66%"><stop offset="0" stop-color="#d0843d"/><stop offset=".7" stop-color="#a5571f"/><stop offset="1" stop-color="#7c3c13"/></radialGradient>
    <clipPath id="${id}-surface"><circle r="214"/></clipPath>
  </defs>
  ${bol(id, 264)}
  <circle r="214" fill="url(#${id}-sauce)"/>
  <g clip-path="url(#${id}-surface)">
    ${morceaux}
    ${cib}
    <path d="M -150 -90 A 178 178 0 0 1 -50 -170" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round" opacity=".16"/>
  </g>
  <circle r="214" fill="none" stroke="#5a2a0c" stroke-width="5" opacity=".18"/>
  ${baguettes(id, -60, 226, 18, 470)}
</svg>
`;
};

// --- Box anti-crise : deux nems, poulet mariné sur son riz, une boisson ------------------------------

// Pilon de poulet laqué : chair dorée en massue, os clair au bout, marques de grill.
const CHAIR = 'M48 -11 C 28 -15 8 -42 -30 -42 C -68 -42 -84 -16 -82 4 C -80 28 -58 44 -26 42 C 6 40 28 16 48 11 Z';
const pilon = (id, x, y, rot, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${s})">
    <path d="${CHAIR}" fill="#000" opacity=".24" filter="url(#${id}-doux)" transform="translate(6 9)"/>
    <rect x="42" y="-9" width="50" height="18" rx="9" fill="#000" opacity=".16" filter="url(#${id}-doux)" transform="translate(6 9)"/>
    <rect x="42" y="-8" width="48" height="16" rx="8" fill="#eadfca"/>
    <circle cx="91" cy="-8" r="11" fill="#f5eee1"/><circle cx="91" cy="8" r="11" fill="#f5eee1"/>
    <path d="${CHAIR}" fill="url(#${id}-laque)"/>
    <path d="M-50 4 l 14 -17 M-28 16 l 17 -22 M-4 18 l 15 -19 M18 12 l 10 -12" stroke="#6b2a0d" stroke-width="5" stroke-linecap="round" opacity=".42"/>
    <path d="M-62 -18 C -46 -32 -14 -34 12 -24" stroke="#f7b779" stroke-width="7" stroke-linecap="round" fill="none" opacity=".55"/>
  </g>`;

// Lit de riz dans un compartiment : riz blanc tassé, grains clairs.
const rizBac = (id, x, y, w, h, r) => {
  const grains = Array.from({ length: Math.round((w * h) / 230) }, () => {
    const gx = (r() - 0.5) * (w - 26);
    const gy = (r() - 0.5) * (h - 26);
    return `<ellipse cx="${f(gx)}" cy="${f(gy)}" rx="5" ry="2.2" fill="#ffffff" transform="rotate(${f(r() * 180)} ${f(gx)} ${f(gy)})"/>`;
  }).join('');
  return `<g transform="translate(${f(x)} ${f(y)})">
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="16" fill="url(#${id}-riz)"/>
    ${grains}
  </g>`;
};

// Boîte en carton ouverte, vue du dessus : bord clair, fond des compartiments plus sombre, ombre des parois.
const compartiment = (id, x, y, w, h) => `<g transform="translate(${f(x)} ${f(y)})">
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="18" fill="url(#${id}-fond)"/>
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="18" fill="url(#${id}-paroi)"/>
  </g>`;

// Canette vue du dessus, sans marque : couvercle d'aluminium, ouverture, languette.
const canette = (id, x, y, rr) => `<g transform="translate(${f(x)} ${f(y)})">
    <circle r="${rr}" fill="#000" opacity=".26" filter="url(#${id}-doux)" transform="translate(7 11)"/>
    <circle r="${rr}" fill="url(#${id}-alu)"/>
    <circle r="${f(rr * 0.84)}" fill="#cfd4db"/>
    <circle r="${f(rr * 0.84)}" fill="none" stroke="#f4f6f9" stroke-width="3"/>
    <circle r="${f(rr * 0.78)}" fill="url(#${id}-couvercle)"/>
    <path d="M${f(-rr * 0.3)} ${f(-rr * 0.5)} Q 0 ${f(-rr * 0.74)} ${f(rr * 0.3)} ${f(-rr * 0.5)} Q ${f(rr * 0.22)} ${f(-rr * 0.3)} 0 ${f(-rr * 0.28)} Q ${f(-rr * 0.22)} ${f(-rr * 0.3)} ${f(-rr * 0.3)} ${f(-rr * 0.5)} Z" fill="#7f868f"/>
    <rect x="${f(-rr * 0.17)}" y="${f(-rr * 0.36)}" width="${f(rr * 0.34)}" height="${f(rr * 0.66)}" rx="${f(rr * 0.17)}" fill="#e6e9ee" stroke="#a7aeb7" stroke-width="2"/>
    <ellipse cx="0" cy="${f(rr * 0.12)}" rx="${f(rr * 0.08)}" ry="${f(rr * 0.11)}" fill="#9aa1aa"/>
    <circle r="${f(rr * 0.06)}" cy="${f(-rr * 0.16)}" fill="#b4bac2"/>
    <path d="M${f(-rr * 0.62)} ${f(rr * 0.38)} A ${f(rr * 0.74)} ${f(rr * 0.74)} 0 0 1 ${f(-rr * 0.5)} ${f(-rr * 0.52)}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/>
  </g>`;

const box = () => {
  const r = hasard(67);
  const id = 'box';
  const W = 452;
  const H = 318;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-330 -330 660 660">
  <title>Box anti-crise vue du dessus : deux nems, poulet mariné sur son riz et une boisson (illustration)</title>
  <defs>${defs(id)}${rizDefs(id)}${dore(id)}
    <linearGradient id="${id}-carton" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ddb789"/><stop offset=".6" stop-color="#cfa472"/><stop offset="1" stop-color="#bf915e"/>
    </linearGradient>
    <linearGradient id="${id}-fond" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a87a49"/><stop offset="1" stop-color="#b98a57"/>
    </linearGradient>
    <linearGradient id="${id}-paroi" x1="0" y1="0" x2=".35" y2=".55">
      <stop offset="0" stop-color="#6b4521" stop-opacity=".45"/><stop offset=".22" stop-color="#6b4521" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${id}-laque" cx="38%" cy="34%" r="75%">
      <stop offset="0" stop-color="#e08a45"/><stop offset=".55" stop-color="#b8571f"/><stop offset="1" stop-color="#7c3311"/>
    </radialGradient>
    <radialGradient id="${id}-alu" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#dfe3e8"/><stop offset="1" stop-color="#a9b0b9"/>
    </radialGradient>
    <radialGradient id="${id}-couvercle" cx="42%" cy="38%" r="70%">
      <stop offset="0" stop-color="#eef1f4"/><stop offset="1" stop-color="#bfc5cd"/>
    </radialGradient>
  </defs>
  <g transform="translate(-34 38) rotate(-7)">
    <rect x="${-W / 2 + 10}" y="${-H / 2 + 22}" width="${W}" height="${H}" rx="30" fill="#000" opacity=".28" filter="url(#${id}-ombre)"/>
    <rect x="${-W / 2}" y="${-H / 2}" width="${W}" height="${H}" rx="30" fill="url(#${id}-carton)"/>
    <rect x="${-W / 2 + 3}" y="${-H / 2 + 3}" width="${W - 6}" height="${H - 6}" rx="27" fill="none" stroke="#efd6b2" stroke-width="3" opacity=".9"/>
    ${compartiment(id, -64, 0, 290, 286)}
    ${compartiment(id, 150, 0, 120, 286)}
    ${rizBac(id, -64, 0, 282, 278, r)}
    ${pilon(id, -96, -58, -24, 1.08)}
    ${pilon(id, -52, 62, 14, 1.08)}
    ${ciboule(-150, 20, 1)}${ciboule(-10, -10, 0.9)}${ciboule(-138, 96, 0.9)}${ciboule(34, 104, 1)}${ciboule(26, -96, 0.85)}
    ${laitue(150, 40, 96, 0.92, 0)}
    ${nem(id, 126, -12, 90, 166, 1.18, r)}${nem(id, 172, 6, 90, 166, 1.18, r)}
    ${menthe(148, 112, -20, 1)}
  </g>
  ${canette(id, 228, -218, 68)}
</svg>
`;
};

mkdirSync(OUT, { recursive: true });
const plats = { soupe, loklac, nems, bobun, caramel, box, 'soupe-bol': () => soupe('bol'), 'soupe-garniture': () => soupe('garniture') };
for (const [nom, dessin] of Object.entries(plats)) {
  writeFileSync(`${OUT}/${nom}.svg`, dessin());
}
console.log(Object.keys(plats).map((n) => `${n}.svg`).join(', '));
