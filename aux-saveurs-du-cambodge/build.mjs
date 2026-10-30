// Génère le site statique dans public/ à partir de data/*.json et src/svg/*.svg.
// Aucune dépendance : node build.mjs (Node 18 ou plus).

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ROOT, 'public');

const resto = JSON.parse(readFileSync(join(ROOT, 'data/restaurant.json'), 'utf8'));
const carte = JSON.parse(readFileSync(join(ROOT, 'data/carte.json'), 'utf8'));
const svg = (name) => readFileSync(join(ROOT, 'src/svg', name), 'utf8').trim();

/* ---------- Outils ---------- */

// Échappe le HTML et pose les espaces fines insécables de la typographie française.
const esc = (s) =>
  String(s)
    .replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
    .replace(/ ([?!:;»])/g, '\u202f$1')
    .replace(/« /g, '«\u202f');

const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const euro = (n) => euros.format(n);
const euroRond = (n) => (Number.isInteger(n) ? `${n}\u00a0€` : euro(n));

const NBSP = '\u00a0';
const heure = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return m ? `${h}${NBSP}h${NBSP}${String(m).padStart(2, '0')}` : `${h}${NBSP}h`;
};
// Le gluon U+2060 empêche la coupure après le tiret : « 18 h – 21 h 45 » reste sur une ligne.
const plage = ([a, b]) => `${heure(a)}${NBSP}–\u2060${NBSP}${heure(b)}`;

const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const normaliser = (s) =>
  s
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const empreinte = (file) => createHash('md5').update(readFileSync(join(PUBLIC, file))).digest('hex').slice(0, 8);

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const SEMAINE = [1, 2, 3, 4, 5, 6, 0];
const SCHEMA_JOURS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const capitale = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const tel = `tel:${resto.phone.e164}`;
const adresseLigne = `${resto.address.street}, ${resto.address.postalCode} ${resto.address.city}`;
const destination = encodeURIComponent(`${resto.name}, ${adresseLigne}`);
const liens = {
  itineraire: `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
  carteGoogle: `https://www.google.com/maps/search/?api=1&query=${destination}`,
  waze: `https://waze.com/ul?ll=${resto.geo.lat},${resto.geo.lng}&navigate=yes`,
  apple: `https://maps.apple.com/?daddr=${encodeURIComponent(adresseLigne)}&ll=${resto.geo.lat},${resto.geo.lng}`,
};

const tousLesPlats = carte.sections.flatMap((section) => section.items.map((item) => ({ ...item, section })));
const nbPlats = tousLesPlats.length;

/* ---------- Icônes (tracé 1,8, bouts ronds) ---------- */

const ICONES = {
  telephone:
    '<path d="M6.6 3.5h2.6l1.6 4.2-2 1.4a12 12 0 0 0 6.1 6.1l1.4-2 4.2 1.6v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/>',
  itineraire:
    '<path d="M12.8 2.6l8.6 8.6a1.1 1.1 0 0 1 0 1.6l-8.6 8.6a1.1 1.1 0 0 1-1.6 0l-8.6-8.6a1.1 1.1 0 0 1 0-1.6l8.6-8.6a1.1 1.1 0 0 1 1.6 0z"/><path d="M9 14.5v-2.3a2 2 0 0 1 2-2h4.6"/><path d="M13.4 8l2.3 2.2-2.3 2.2"/>',
  carte: '<path d="M6 3.5h9l3 3V20.5H6z"/><path d="M9 9.5h6M9 13h6M9 16.5h3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  moins: '<path d="M5 12h14"/>',
  fermer: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  recherche: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5l5 5"/>',
  fleche: '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
  bon: '<path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
};

const icone = (nom, classe = '') =>
  `<svg class="icone icone--${nom}${classe ? ` ${classe}` : ''}" aria-hidden="true" focusable="false"><use href="#i-${nom}"/></svg>`;

// Les dessins d'ingrédients ne sont embarqués que sur l'accueil ; les icônes, partout.
const sprite = (avecDessins) => {
  const base = avecDessins
    ? svg('sprite.svg')
    : '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">\n</svg>';
  const symboles = Object.entries(ICONES)
    .map(
      ([id, body]) =>
        `<symbol id="i-${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</symbol>`,
    )
    .join('\n');
  return base.replace('</svg>', `${symboles}\n</svg>`);
};

/* ---------- Horaires ---------- */

const horairesResume = () => {
  const groupes = [];
  for (const jour of SEMAINE) {
    const cle = JSON.stringify(resto.hours[jour] || []);
    const dernier = groupes.at(-1);
    if (dernier && dernier.cle === cle) dernier.jours.push(jour);
    else groupes.push({ cle, jours: [jour], plages: resto.hours[jour] || [] });
  }
  return groupes
    .map(({ jours, plages }) => {
      const nom = (j) => JOURS[j];
      const qui = jours.length > 2 ? `du ${nom(jours[0])} au ${nom(jours.at(-1))}` : jours.map(nom).join(' et ');
      return `${capitale(qui)} : ${plages.length ? plages.map(plage).join(' et ') : 'fermé'}`;
    })
    .join(' · ');
};

const tableHoraires = () => `
      <table class="semaine">
        <caption class="visuellement-cache">Horaires d’ouverture, du lundi au dimanche</caption>
        <thead class="visuellement-cache"><tr><th scope="col">Jour</th><th scope="col">Midi</th><th scope="col">Soir</th></tr></thead>
        <tbody>
${SEMAINE.map((jour) => {
  const plages = resto.hours[jour] || [];
  const midi = plages.find(([a]) => a < '15:00');
  const soir = plages.find(([a]) => a >= '15:00');
  const surCommande = !midi && resto.preorderLunch.days.includes(jour);
  return `          <tr data-jour="${jour}">
            <th scope="row"><span class="semaine__jour">${capitale(JOURS[jour])}</span></th>
            <td${surCommande ? ' class="semaine__commande"' : ''}>${midi ? plage(midi) : surCommande ? 'Sur commande, la veille' : 'Fermé'}</td>
            <td>${soir ? plage(soir) : 'Fermé'}</td>
          </tr>`;
}).join('\n')}
        </tbody>
      </table>`;

const etat = (variante) =>
  `<p class="etat etat--${variante}" data-etat="${variante}"${variante === 'compact' ? ' hidden' : ''}><span class="etat__pastille" aria-hidden="true"></span><span class="etat__texte">${esc(
    variante === 'compact' ? 'Horaires' : horairesResume(),
  )}</span></p>`;

/* ---------- Données structurées ---------- */

const schemaHoraires = () => {
  const parPlage = new Map();
  for (const jour of SEMAINE) {
    for (const [a, b] of resto.hours[jour] || []) {
      const cle = `${a}-${b}`;
      if (!parPlage.has(cle)) parPlage.set(cle, { opens: a, closes: b, days: [] });
      parPlage.get(cle).days.push(SCHEMA_JOURS[jour]);
    }
  }
  return [...parPlage.values()].map(({ opens, closes, days }) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: days,
    opens,
    closes,
  }));
};

const schemaRestaurant = () => ({
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  '@id': `${resto.url}/#restaurant`,
  name: resto.name,
  description: resto.description,
  url: `${resto.url}/`,
  telephone: resto.phone.e164,
  image: `${resto.url}/og.jpg`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: resto.address.street,
    postalCode: resto.address.postalCode,
    addressLocality: resto.address.city,
    addressRegion: resto.address.region,
    addressCountry: resto.address.country,
  },
  geo: { '@type': 'GeoCoordinates', latitude: resto.geo.lat, longitude: resto.geo.lng },
  hasMap: liens.carteGoogle,
  servesCuisine: ['Cambodgienne', 'Asiatique'],
  priceRange: '€',
  currenciesAccepted: 'EUR',
  hasMenu: `${resto.url}/carte/`,
  openingHoursSpecification: schemaHoraires(),
});

const schemaMenu = () => ({
  '@context': 'https://schema.org',
  '@type': 'Menu',
  '@id': `${resto.url}/carte/#menu`,
  name: `La carte — ${resto.name}`,
  inLanguage: 'fr',
  url: `${resto.url}/carte/`,
  hasMenuSection: carte.sections.map((section) => ({
    '@type': 'MenuSection',
    name: section.title,
    ...(section.withRice ? { description: carte.riceNote } : {}),
    hasMenuItem: section.items.map((item) => ({
      '@type': 'MenuItem',
      name: item.name,
      ...(item.desc ? { description: item.desc } : {}),
      offers: { '@type': 'Offer', price: item.price.toFixed(2), priceCurrency: 'EUR' },
    })),
  })),
});

const jsonld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

/* ---------- Gabarit commun ---------- */

const ASSETS = {};
const asset = (file) => (ASSETS[file] ??= `${file}?v=${empreinte(file)}`);

function page({ chemin, titre, description, corps, classe, schema, barre, prechargement = [], indexable = true, dessins = false }) {
  const profondeur = chemin.split('/').filter(Boolean).length;
  const r = profondeur ? '../'.repeat(profondeur) : './';
  const url = `${resto.url}/${chemin}`;
  const donnees = {
    hours: resto.hours,
    preorderLunch: resto.preorderLunch,
    closures: resto.closures,
    timezone: resto.timezone,
  };
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titre)}</title>
<meta name="description" content="${esc(description)}">
${indexable ? `<link rel="canonical" href="${url}">` : '<meta name="robots" content="noindex">'}
<meta name="theme-color" content="#F2A51C">
<meta name="format-detection" content="telephone=no">
<meta property="og:type" content="restaurant">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="${esc(resto.name)}">
<meta property="og:title" content="${esc(titre)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${resto.url}/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(resto.name)} — cuisine cambodgienne faite maison à ${esc(resto.town)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${r}favicon.svg" type="image/svg+xml">
<link rel="icon" href="${r}favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${r}apple-touch-icon.png">
<link rel="manifest" href="${r}site.webmanifest">
<link rel="preload" href="${r}assets/fonts/kantumruy-pro-latin.woff2" as="font" type="font/woff2" crossorigin>
${prechargement.map((f) => `<link rel="preload" href="${r}${f}" as="font" type="font/woff2" crossorigin>\n`).join('')}<script>document.documentElement.classList.add('js')</script>
<link rel="stylesheet" href="${r}${asset('assets/css/site.css')}">
<script src="${r}${asset('assets/js/site.js')}" defer></script>
${schema ? jsonld(schema) : ''}
</head>
<body class="${classe}">
<a class="evitement" href="#contenu">Aller au contenu</a>
${sprite(dessins)}
${entete(r, chemin)}
${corps(r)}
${pied(r)}
${barre ? barre(r) : ''}
<script type="application/json" id="donnees-site">${JSON.stringify(donnees)}</script>
</body>
</html>
`;
  const dossier = join(PUBLIC, chemin);
  mkdirSync(dossier, { recursive: true });
  writeFileSync(join(dossier, 'index.html'), html);
  return html;
}

const entete = (r, chemin) => `<header class="entete">
  <div class="entete__barre conteneur">
    <a class="enseigne-mini" href="${r}"${chemin === '' ? ' aria-current="page"' : ''}>
      <span class="enseigne-mini__km" lang="km" aria-hidden="true">${resto.nameKhmer}</span>
      <span class="enseigne-mini__nom">${esc(resto.name)}</span>
    </a>
    <nav class="entete__nav" aria-label="Navigation principale">
      <a href="${r}carte/"${chemin === 'carte/' ? ' aria-current="page"' : ''}>La carte</a>
      <a href="${r}#infos">Horaires et accès</a>
    </nav>
    ${etat('compact')}
    <a class="bouton bouton--appel bouton--entete" href="${tel}" aria-label="Appeler le restaurant au ${resto.phone.display}">${icone('telephone')}<span class="bouton__num">${resto.phone.display}</span></a>
  </div>
</header>`;

const pied = (r) => `<footer class="pied">
  <div class="conteneur pied__grille">
    <div class="pied__merci">
      <p class="pied__km" lang="km" aria-hidden="true">អរគុណ</p>
      <p class="pied__au-revoir">Merci, et à très vite !</p>
    </div>
    <div class="pied__bloc">
      <h2 class="pied__titre">${esc(resto.name)}</h2>
      <address>
        ${esc(resto.address.street)}<br>
        ${resto.address.postalCode} ${esc(resto.address.city)}<br>
        <a href="${tel}">${resto.phone.display}</a>
      </address>
    </div>
    <div class="pied__bloc">
      <h2 class="pied__titre">Horaires</h2>
      <p>${esc(horairesResume()).replace(' · ', '<br>')}</p>
      <p class="pied__note">${esc(resto.preorderLunch.rule)}</p>
    </div>
    <nav class="pied__bloc" aria-label="Pied de page">
      <h2 class="pied__titre">Sur ce site</h2>
      <ul>
        <li><a href="${r}">Accueil</a></li>
        <li><a href="${r}carte/">La carte</a></li>
        <li><a href="${r}#infos">Horaires et accès</a></li>
        <li><a href="${r}mentions-legales/">Mentions légales</a></li>
      </ul>
    </nav>
  </div>
  <p class="conteneur pied__credits">Illustrations dessinées pour le site · Plan : IGN – BD TOPO® · Polices Kantumruy Pro et Moul (SIL OFL) · Aucun cookie.</p>
</footer>`;

/* ---------- Accueil ---------- */

const bonEtPasCher = carte.sections.find((s) => s.id === 'menu-bon-et-pas-cher');
const classiques = tousLesPlats.filter((p) => p.featured).sort((a, b) => a.featured - b.featured);

const SAVEURS = [
  { sym: 'botte', fr: 'Citronnelle', km: 'ស្លឹកគ្រៃ', vb: '0 0 200 200', w: 74, x: 100, y: 100, r: 45 },
  { sym: 'galanga', fr: 'Galanga', km: 'រំដេង', vb: '0 0 200 200', w: 200, x: 100, y: 104, r: -24 },
  { sym: 'curcuma', fr: 'Curcuma', km: 'រមៀត', vb: '0 0 200 200', w: 196, x: 100, y: 104, r: 14 },
  { sym: 'combava', fr: 'Combava', km: 'ក្រូចសើច', vb: '0 0 200 200', w: 206, x: 100, y: 100, r: -34 },
  { sym: 'ail', fr: 'Ail', km: 'ខ្ទឹមស', vb: '0 0 200 200', w: 136, x: 100, y: 98, r: 6 },
  { sym: 'echalote', fr: 'Échalote', km: 'ខ្ទឹមក្រហម', vb: '0 0 200 200', w: 100, x: 100, y: 100, r: -12 },
  { sym: 'piment', fr: 'Piment', km: 'ម្ទេស', vb: '0 0 200 200', w: 196, x: 100, y: 100, r: -36 },
  { sym: 'citron', fr: 'Citron vert', km: 'ក្រូចឆ្មារ', vb: '0 0 200 200', w: 138, x: 100, y: 100, r: 0 },
];

const VIEWBOXES = Object.fromEntries(
  [...svg('sprite.svg').matchAll(/<symbol id="([^"]+)" viewBox="([^"]+)"/g)].map(([, id, vb]) => [id, vb.split(' ').map(Number)]),
);

const vignette = ({ sym, vb, w, x, y, r }, i) => {
  const [, , vw, vh] = VIEWBOXES[sym];
  const h = (w * vh) / vw;
  const use = (classe) =>
    `<use${classe ? ` class="${classe}"` : ''} href="#${sym}" x="${-w / 2}" y="${(-h / 2).toFixed(1)}" width="${w}" height="${h.toFixed(1)}" transform="translate(${x} ${y}) rotate(${r})"/>`;
  return `<svg class="saveur__dessin" style="--i:${i}" viewBox="${vb}" aria-hidden="true" focusable="false"><g class="saveur__ombre" filter="url(#silhouette)" transform="translate(6 8)">${use('')}</g>${use('saveur__piece')}</svg>`;
};

const accueil = () =>
  page({
    chemin: '',
    titre: `${resto.name} — restaurant cambodgien à ${resto.town}`,
    description: resto.description,
    classe: 'page-accueil',
    dessins: true,
    schema: schemaRestaurant(),
    prechargement: ['assets/fonts/moul-enseigne.woff2'],
    barre: (r) => `<nav class="barre-action" aria-label="Actions rapides" data-barre>
  <a class="barre-action__appel" href="${tel}">${icone('telephone')}<span>Appeler</span></a>
  <a href="${r}carte/">${icone('carte')}<span>La carte</span></a>
  <a href="${liens.itineraire}">${icone('itineraire')}<span>Y aller</span></a>
</nav>`,
    corps: (r) => `<main id="contenu">
  <section class="heros" aria-labelledby="heros-titre">
    <div class="heros__grille conteneur">
      <div class="heros__texte">
        <h1 class="enseigne" id="heros-titre">
          <span class="enseigne__km" lang="km" aria-hidden="true">${resto.nameKhmer}</span>
          <span class="enseigne__nom"><span>Aux Saveurs</span> <span><span class="enseigne__du">du</span> Cambodge</span></span>
        </h1>
        <p class="heros__accroche">${esc(resto.tagline)}, à ${esc(resto.town)}.</p>
        ${etat('long')}
        <p class="heros__conseil" data-conseil hidden></p>
        <div class="heros__actions" data-actions-heros>
          <a class="bouton bouton--appel" href="${tel}">${icone('telephone')}<span>Appeler</span><span class="bouton__num">${resto.phone.display}</span></a>
          <a class="bouton bouton--trait" href="${r}carte/"><span>Voir la carte</span>${icone('fleche')}</a>
        </div>
        <p class="heros__mention">Commandes et réservations par téléphone.</p>
      </div>
      <div class="heros__etal">
        <div class="etal etal--large">${svg('etal.svg')}</div>
        <div class="etal etal--bande">${svg('etal-bande.svg')}</div>
        <div class="accroche">
          <a class="etiquette etiquette--pendue" href="${r}carte/#menu-bon-et-pas-cher">
            <span class="etiquette__titre">Menu bon et pas cher</span>
            <span class="etiquette__prix">${euroRond(bonEtPasCher.items[0].price)}</span>
          </a>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--feuille bpc" id="bon-et-pas-cher" aria-labelledby="bpc-titre">
    <div class="conteneur bpc__grille">
      <div class="bpc__tete">
        <h2 id="bpc-titre">Le menu bon et pas cher</h2>
        <p class="bpc__prix" aria-hidden="true">${euroRond(bonEtPasCher.items[0].price)}</p>
        <p class="bpc__texte">Une viande marinée, du riz thaï et sa salade composée : un vrai repas, pour ${euroRond(
          bonEtPasCher.items[0].price,
        )}.</p>
      </div>
      <ul class="bpc__choix">
${bonEtPasCher.items
  .slice(0, 3)
  .map(
    (item, i) => `        <li class="bpc__plat${i === 2 ? ' bpc__plat--extra' : ''}">
          <h3>${esc(i < 2 ? capitale(item.name.replace('Menu bon et pas cher ', '')) : item.name)}</h3>
          <p>${esc(item.desc)}</p>
          <p class="prix">${i === 2 ? '+ ' : ''}${euro(item.price)}</p>
        </li>`,
  )
  .join('\n')}
      </ul>
      <div class="bpc__actions">
        <a class="bouton bouton--appel" href="${tel}">${icone('telephone')}<span>Commander</span><span class="bouton__num">${resto.phone.display}</span></a>
        <a class="lien-fort" href="${r}carte/">Toute la carte, ${nbPlats} plats ${icone('fleche')}</a>
      </div>
    </div>
  </section>

  <section class="section section--riz classiques" aria-labelledby="classiques-titre">
    <div class="conteneur classiques__grille">
      <div class="classiques__tete">
        <h2 id="classiques-titre">Par où commencer&#8239;?</h2>
        <p>Six plats de la carte, du lok lac à la soupe Phnom Penh. Les plats sont servis avec leur riz nature.</p>
        <a class="bouton bouton--trait" href="${r}carte/"><span>Voir les ${nbPlats} plats</span>${icone('fleche')}</a>
      </div>
      <ul class="classiques__liste">
${classiques
  .map(
    (p) => `        <li class="classique">
          <a class="classique__lien" href="${r}carte/#${p.section.id}">
            <span class="classique__nom">${esc(p.name)}</span>
            <span class="classique__texte">${esc(p.blurb)}</span>
            <span class="classique__prix">${euro(p.price)}</span>
          </a>
        </li>`,
  )
  .join('\n')}
      </ul>
    </div>
  </section>

  <section class="section section--curcuma saveurs" aria-labelledby="saveurs-titre">
    <div class="conteneur saveurs__grille">
      <div class="saveurs__texte">
        <h2 id="saveurs-titre">Les saveurs du Cambodge</h2>
        <p>Citronnelle, galanga, curcuma, combava, ail et échalote&#8239;: pilés ensemble, ils donnent le <span lang="km-Latn">kroeung</span>, la pâte aromatique qui parfume la cuisine khmère. Le piment vient ensuite, selon les goûts.</p>
      </div>
      <ul class="saveurs__liste">
${SAVEURS.map(
  (s, i) => `        <li class="saveur">
          ${vignette(s, i)}
          <span class="saveur__fr">${s.fr}</span>
          <span class="saveur__km" lang="km">${s.km}</span>
        </li>`,
).join('\n')}
      </ul>
      <div class="promesse">
        <blockquote class="promesse__citation">
          <p>${esc(resto.promise)}</p>
        </blockquote>
        <p class="promesse__tampon"><span class="promesse__km" lang="km" aria-hidden="true">ឆ្ងាញ់</span><span class="promesse__sens">«&#8239;Délicieux&#8239;», en khmer</span></p>
      </div>
    </div>
  </section>

  <section class="section section--riz infos" id="infos" aria-labelledby="infos-titre">
    <div class="conteneur">
      <h2 class="infos__titre" id="infos-titre">${esc(resto.invite)}</h2>
      <div class="infos__grille">
        <div class="horaires" id="horaires">
          <h3>Horaires</h3>
          ${etat('grand')}
${tableHoraires()}
          <p class="horaires__note">${esc(resto.preorderLunch.rule)}</p>
        </div>
        <div class="acces" id="nous-trouver">
          <h3>Nous trouver</h3>
          <address class="acces__adresse">${esc(resto.address.street)}<br>${resto.address.postalCode} ${esc(resto.address.city)}</address>
          <p class="acces__tel"><a href="${tel}">${icone('telephone')}${resto.phone.display}</a></p>
          <figure class="plan">
            <a href="${liens.carteGoogle}" class="plan__lien">
              <img src="${r}assets/img/plan-quartier.svg" width="800" height="560" loading="lazy" decoding="async" alt="Plan du quartier : le restaurant est au 10 avenue Salvador Allende, près de la rue de Fenouillet et de la route de Paris.">
            </a>
            <figcaption>Plan : IGN – BD TOPO®, Licence Ouverte Etalab 2.0</figcaption>
          </figure>
          <div class="acces__actions">
            <a class="bouton bouton--trait" href="${liens.itineraire}">${icone('itineraire')}<span>Itinéraire</span></a>
            <a class="lien" href="${liens.waze}">Waze</a>
            <a class="lien" href="${liens.apple}">Plans (Apple)</a>
          </div>
        </div>
      </div>
    </div>
  </section>
</main>`,
  });

/* ---------- La carte ---------- */

const plat = (item, section) => {
  const id = `${section.id}--${slug(item.name)}`;
  const recherche = normaliser([item.name, item.desc, section.title, item.spicy ? 'piquant epice' : ''].filter(Boolean).join(' '));
  return `          <li class="plat" data-plat="${id}" data-nom="${esc(item.name)}" data-prix="${Math.round(item.price * 100)}" data-recherche="${esc(recherche)}">
            <span class="plat__nom">${esc(item.name)}</span>
            ${item.desc ? `<span class="plat__desc">${esc(item.desc)}</span>` : ''}
            <span class="plat__prix">${euro(item.price)}</span>
            <button type="button" class="plat__ajout" data-ajouter="${id}" hidden aria-label="Ajouter au bon : ${esc(item.name)}">${icone('plus')}</button>
          </li>`;
};

const rubrique = (section) => `      <section class="rubrique" id="${section.id}" aria-labelledby="r-${section.id}" data-rubrique>
        <h2 id="r-${section.id}" class="rubrique__titre">${esc(section.title)}</h2>
        ${
          section.withRice
            ? `<p class="rubrique__riz"><span>Servis avec du riz nature.</span> <span class="rubrique__riz-sup">Riz cantonais (porc ou crevettes) <span class="prix-inline">+&nbsp;${euro(
                carte.riceUpgrade.price,
              )}</span> <button type="button" class="plat__ajout plat__ajout--petit" data-ajouter="supplement-riz-cantonais" data-nom="${esc(
                carte.riceUpgrade.name,
              )}" data-prix="${Math.round(carte.riceUpgrade.price * 100)}" hidden aria-label="Ajouter au bon : ${esc(
                carte.riceUpgrade.name,
              )}">${icone('plus')}</button></span></p>`
            : ''
        }
        <ul class="plats">
${section.items.map((item) => plat(item, section)).join('\n')}
        </ul>
      </section>`;

const lacarte = () =>
  page({
    chemin: 'carte/',
    titre: `La carte — ${resto.name}, ${resto.town}`,
    description: `Toute la carte d’${resto.name} à ${resto.town} : ${nbPlats} plats faits maison, du menu bon et pas cher à 10 € au lok lac, avec les prix. Commande par téléphone au ${resto.phone.display}.`,
    classe: 'page-carte',
    schema: schemaMenu(),
    barre: () => `<nav class="barre-action barre-action--carte est-visible" aria-label="Actions rapides" data-barre>
  <a class="barre-action__appel" href="${tel}">${icone('telephone')}<span>Appeler</span></a>
  <button type="button" class="barre-action__bon" data-ouvrir-bon aria-controls="bon" aria-expanded="false" hidden>${icone('bon')}<span>Mon bon</span><span class="barre-action__compte" data-bon-compte>0</span></button>
</nav>`,
    corps: (r) => `<main id="contenu">
  <section class="carte-tete section--feuille" aria-labelledby="carte-titre">
    <div class="conteneur carte-tete__grille">
      <div>
        <h1 id="carte-titre">La carte</h1>
        <p class="carte-tete__intro">${nbPlats} plats faits maison. Prix TTC. On commande par téléphone, au <a href="${tel}">${resto.phone.display}</a>.</p>
      </div>
      <div class="recherche" role="search">
        <label class="recherche__label" for="recherche">Chercher un plat</label>
        <div class="recherche__champ">
          ${icone('recherche')}
          <input id="recherche" type="search" placeholder="lok lac, citronnelle, crevettes…" autocomplete="off" spellcheck="false" enterkeyhint="search" aria-describedby="recherche-etat">
        </div>
        <p class="recherche__etat" id="recherche-etat" role="status" aria-live="polite"></p>
      </div>
    </div>
  </section>

  <div class="carte conteneur">
    <nav class="rubriques" aria-label="Rubriques de la carte">
      <ul>
${carte.sections.map((s) => `        <li><a href="#${s.id}" data-lien-rubrique="${s.id}">${esc(s.title)}</a></li>`).join('\n')}
      </ul>
    </nav>

    <div class="carte__liste">
      <div class="carte__vide" data-vide hidden>
        <p>Aucun plat ne correspond à «&nbsp;<span data-vide-terme></span>&nbsp;».</p>
        <p>Essayez «&nbsp;crevettes&nbsp;», «&nbsp;poulet&nbsp;» ou «&nbsp;soupe&nbsp;», ou <button type="button" class="lien" data-effacer>effacez la recherche</button>.</p>
      </div>
${carte.sections.map(rubrique).join('\n')}
      <p class="carte__maj">Carte mise à jour le ${new Date(`${carte.updated}T12:00:00`).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}. Les prix affichés sont ceux du restaurant&#8239;; en cas de doute, ils font foi au téléphone.</p>
    </div>

    <aside class="bon" id="bon" aria-labelledby="bon-titre" data-bon hidden>
      <div class="bon__feuille">
        <div class="bon__tete">
          <h2 id="bon-titre">Mon bon de commande</h2>
          <button type="button" class="bon__fermer" data-fermer-bon aria-label="Fermer le bon">${icone('fermer')}</button>
        </div>
        <p class="bon__vide" data-bon-vide>Touchez ${icone('plus', 'icone--inline')} à côté d’un plat pour le noter ici, puis appelez-nous pour le dicter.</p>
        <ul class="bon__lignes" data-bon-lignes></ul>
        <p class="bon__total"><span>Total indicatif</span> <output data-bon-total>0,00&nbsp;€</output></p>
        <a class="bouton bouton--appel bouton--large" href="${tel}">${icone('telephone')}<span>Appeler pour commander</span></a>
        <button type="button" class="bouton bouton--texte" data-bon-vider>Vider le bon</button>
        <p class="bon__note">Ce bon ne passe pas commande&#8239;: il vous aide à la dicter au téléphone. Il reste sur votre appareil.</p>
      </div>
    </aside>
  </div>
</main>`,
  });

/* ---------- Mentions légales ---------- */

const aCompleter = (v) => (v ? esc(v) : '<span class="a-completer">à compléter</span>');

const mentions = () =>
  page({
    chemin: 'mentions-legales/',
    titre: `Mentions légales — ${resto.name}`,
    description: `Mentions légales et informations sur le site d’${resto.name}, ${resto.town}.`,
    classe: 'page-texte',
    corps: () => `<main id="contenu" class="section section--riz">
  <div class="conteneur texte">
    <h1>Mentions légales</h1>
    <h2>Éditeur du site</h2>
    <p>${esc(resto.name)}<br>
      Raison sociale : ${aCompleter(resto.legal.company)}${resto.legal.legalForm ? ` (${esc(resto.legal.legalForm)})` : ''}<br>
      SIRET : ${aCompleter(resto.legal.siret)}<br>
      ${esc(resto.address.street)}, ${resto.address.postalCode} ${esc(resto.address.city)}<br>
      Téléphone : <a href="${tel}">${resto.phone.display}</a></p>
    <p>Directeur ou directrice de la publication : ${aCompleter(resto.legal.publisher)}</p>
    <h2>Hébergement</h2>
    <p>${aCompleter(resto.legal.host)}${resto.legal.hostAddress ? `<br>${esc(resto.legal.hostAddress)}` : ''}</p>
    <h2>Données personnelles et cookies</h2>
    <p>Ce site ne dépose aucun cookie, n’utilise aucun outil de mesure d’audience et ne collecte aucune donnée personnelle. Le «&nbsp;bon de commande&nbsp;» de la carte est enregistré uniquement dans votre navigateur (stockage local) et n’est jamais transmis&#8239;: vous pouvez le vider à tout moment.</p>
    <h2>Crédits</h2>
    <p>Illustrations&#8239;: dessins vectoriels créés pour ce site. Ce ne sont pas des photos des plats du restaurant.<br>
      Plan du quartier&#8239;: données IGN – BD TOPO®, Licence Ouverte Etalab 2.0.<br>
      Polices&#8239;: Kantumruy Pro (Tep Sovichet, Wei Huang) et Moul (Danh Hong), sous licence SIL Open Font License 1.1.</p>
    <h2>Prix</h2>
    <p>Les prix sont indiqués en euros, toutes taxes comprises. Ils peuvent évoluer&#8239;; le prix confirmé au téléphone ou au comptoir fait foi.</p>
  </div>
</main>`,
  });

/* ---------- 404 et redirection ---------- */

const introuvable = () => {
  const html = page({
    chemin: '404-tmp/',
    titre: `Page introuvable — ${resto.name}`,
    description: 'Cette page n’existe pas ou plus.',
    classe: 'page-texte page-404',
    indexable: false,
    corps: () => `<main id="contenu" class="section section--curcuma">
  <div class="conteneur texte introuvable">
    <p class="introuvable__code" aria-hidden="true">404</p>
    <h1>Cette page s’est perdue au marché.</h1>
    <p>L’adresse a peut-être changé. La carte, elle, est toujours là.</p>
    <p class="introuvable__actions"><a class="bouton bouton--trait" href="/carte/"><span>Voir la carte</span>${icone('fleche')}</a> <a class="lien" href="/">Revenir à l’accueil</a></p>
  </div>
</main>`,
  });
  // La 404 est servie depuis n'importe quelle profondeur : chemins absolus.
  writeFileSync(join(PUBLIC, '404.html'), html.replaceAll('href="../', 'href="/').replaceAll('src="../', 'src="/'));
};

const redirection = (de, vers) => {
  const dossier = join(PUBLIC, de);
  mkdirSync(dossier, { recursive: true });
  writeFileSync(
    join(dossier, 'index.html'),
    `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>La carte a déménagé — ${esc(resto.name)}</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${resto.url}/${vers}">
<meta http-equiv="refresh" content="0; url=../${vers}">
</head>
<body>
<p>La carte a déménagé : <a href="../${vers}">${resto.url}/${vers}</a></p>
</body>
</html>
`,
  );
};

/* ---------- Fichiers annexes ---------- */

const annexes = () => {
  writeFileSync(
    join(PUBLIC, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${resto.url}/</loc><lastmod>${carte.updated}</lastmod></url>
  <url><loc>${resto.url}/carte/</loc><lastmod>${carte.updated}</lastmod></url>
  <url><loc>${resto.url}/mentions-legales/</loc></url>
</urlset>
`,
  );
  writeFileSync(join(PUBLIC, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${resto.url}/sitemap.xml\n`);
  writeFileSync(
    join(PUBLIC, 'site.webmanifest'),
    JSON.stringify(
      {
        name: resto.name,
        short_name: 'Saveurs du Cambodge',
        lang: 'fr',
        start_url: './',
        display: 'browser',
        background_color: '#F2A51C',
        theme_color: '#F2A51C',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      null,
      2,
    ) + '\n',
  );
  writeFileSync(join(PUBLIC, '_redirects'), '/nouvelle-page  /carte/  301\n/nouvelle-page/  /carte/  301\n');
};

/* ---------- Construction ---------- */

accueil();
lacarte();
mentions();
introuvable();
redirection('nouvelle-page/', 'carte/');
annexes();

rmSync(join(PUBLIC, '404-tmp'), { recursive: true, force: true });

const manquants = Object.entries(resto.legal)
  .filter(([cle, v]) => !v && cle !== 'legalForm' && cle !== 'hostAddress')
  .map(([cle]) => cle);
console.log(`Site généré dans public/ : accueil, carte (${nbPlats} plats), mentions légales, 404.`);
if (manquants.length) console.warn(`À compléter avant la mise en ligne (data/restaurant.json → legal) : ${manquants.join(', ')}`);
