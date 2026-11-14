// Génère le site statique dans public/ à partir de data/*.json, et l'archive à déposer
// chez un hébergeur classique (IONOS, OVH, o2switch…) dans livraison/.
// Aucune dépendance : node build.mjs (Node 18 ou plus).

import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ROOT, 'public');

const resto = JSON.parse(readFileSync(join(ROOT, 'data/restaurant.json'), 'utf8'));
const carte = JSON.parse(readFileSync(join(ROOT, 'data/carte.json'), 'utf8'));

/* ---------- Outils ---------- */

// Caractères invisibles construits ici plutôt qu'écrits en dur : ils restent lisibles dans le code.
const NBSP = String.fromCharCode(0xa0);
const FINE = String.fromCharCode(0x202f);
const GLUON = String.fromCharCode(0x2060);
const BARRE = String.fromCharCode(92);

// Échappe le HTML et pose les espaces fines insécables de la typographie française.
const esc = (s) =>
  String(s)
    .replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
    .replace(/ ([?!:;»])/g, `${FINE}$1`)
    .replace(/« /g, `«${FINE}`);

const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const euro = (n) => euros.format(n);
const euroRond = (n) => (Number.isInteger(n) ? `${n}${NBSP}€` : euro(n));

const heure = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return m ? `${h}${NBSP}h${NBSP}${String(m).padStart(2, '0')}` : `${h}${NBSP}h`;
};
// Le gluon empêche la coupure après le tiret : « 18 h – 21 h 45 » reste sur une ligne.
const plage = ([a, b]) => `${heure(a)}${NBSP}–${GLUON}${NBSP}${heure(b)}`;

const sansAccents = (s) =>
  [...s.normalize('NFD')]
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code < 0x300 || code > 0x36f;
    })
    .join('');

const slug = (s) =>
  sansAccents(s.toLowerCase())
    .replace(/œ/g, 'oe')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const normaliser = (s) =>
  sansAccents(s.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae'))
    .replace(/[’']/g, ' ')
    .split(' ')
    .filter(Boolean)
    .join(' ');

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
const plat = (nom) => tousLesPlats.find((p) => p.name === nom);

// Les prix ne sont pas écrits en dur dans les pages : un jeton que le serveur remplace par le prix du moment,
// celui de la carte ou celui saisi dans l'espace gestion (public/inc/noyau.php).
const idPlat = (item, section) => `${section.id}--${slug(item.name)}`;
const ID_SUPPLEMENT = 'supplement-riz-cantonais';
const jeton = (genre, ...ids) => `{{${genre}:${ids.join(',')}}}`;
// La box anti-crise, en tête de la carte et en grand sur l'accueil.
const BOX = tousLesPlats.find((p) => p.section.id === 'box-anti-crise' && p.name === 'Box anti-crise');
const ID_BOX = idPlat(BOX, BOX.section);
const descriptionResto = resto.description.replace('{prix-box}', jeton('rond', ID_BOX));

/* ---------- Icônes : un trait fin, des bouts ronds ---------- */

const ICONES = {
  telephone:
    '<path d="M6.6 3.5h2.6l1.6 4.2-2 1.4a12 12 0 0 0 6.1 6.1l1.4-2 4.2 1.6v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/>',
  chevron: '<path d="M9 5.5l6.5 6.5L9 18.5"/>',
  recherche: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5l5 5"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  moins: '<path d="M5.5 12h13"/>',
  fermer: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  sac: '<path d="M5.5 8.5h13l-1 11.5h-11z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',
};

const icone = (nom, classe = '') =>
  `<svg class="icone icone--${nom}${classe ? ` ${classe}` : ''}" aria-hidden="true" focusable="false"><use href="#i-${nom}"/></svg>`;

const sprite = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${Object.entries(
    ICONES,
  )
    .map(
      ([id, body]) =>
        `<symbol id="i-${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${body}</symbol>`,
    )
    .join('')}</svg>`;

// Lien bleu suivi d'un chevron, comme sur apple.com.
const lien = (href, texte, extra = '') => `<a class="lien" href="${href}"${extra}>${texte}${icone('chevron')}</a>`;

/* ---------- Horaires ---------- */

const groupesHoraires = () => {
  const groupes = [];
  for (const jour of SEMAINE) {
    const cle = JSON.stringify(resto.hours[jour] || []);
    const dernier = groupes.at(-1);
    if (dernier && dernier.cle === cle) dernier.jours.push(jour);
    else groupes.push({ cle, jours: [jour], plages: resto.hours[jour] || [] });
  }
  return groupes.map(({ jours, plages }) => {
    const qui = jours.length > 2 ? `du ${JOURS[jours[0]]} au ${JOURS[jours.at(-1)]}` : jours.map((j) => JOURS[j]).join(' et ');
    return `${capitale(qui)} : ${plages.length ? plages.map(plage).join(' et ') : 'fermé'}`;
  });
};
const horairesResume = () => groupesHoraires().join(' · ');

// Un midi « sur commande passée la veille » (data/restaurant.json, preorderLunch) : rien à dire s'il n'y en a pas.
const regleMidi = () => (resto.preorderLunch.days.length && resto.preorderLunch.rule) || '';

const tableHoraires = () => `<table class="semaine">
        <caption class="visuellement-cache">Horaires d’ouverture, du lundi au dimanche</caption>
        <thead class="visuellement-cache"><tr><th scope="col">Jour</th><th scope="col">Midi</th><th scope="col">Soir</th></tr></thead>
        <tbody>
${SEMAINE.map((jour) => {
  const plages = resto.hours[jour] || [];
  const midi = plages.find(([a]) => a < '15:00');
  const soir = plages.find(([a]) => a >= '15:00');
  const surCommande = !midi && resto.preorderLunch.days.includes(jour);
  return `          <tr data-jour="${jour}">
            <th scope="row">${capitale(JOURS[jour])}</th>
            <td${surCommande ? ' class="semaine__commande"' : ''}>${midi ? plage(midi) : surCommande ? 'Sur commande' : 'Fermé'}</td>
            <td>${soir ? plage(soir) : 'Fermé'}</td>
          </tr>`;
}).join('')}
        </tbody>
      </table>`;

// État d'ouverture : le résumé statique sert sans JavaScript, le script le remplace par l'état en direct.
const etat = (variante, classe = '') =>
  `<span class="etat${classe ? ` ${classe}` : ''}" data-etat="${variante}"><span class="etat__pastille" aria-hidden="true"></span><span class="etat__texte">${esc(
    horairesResume(),
  )}</span></span>`;

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
  description: descriptionResto,
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

// Les données structurées « Menu » : cette base, plus les rubriques et les plats du moment, que le serveur ajoute
// (public/inc/noyau.php, asdc_jsonld_menu) puisque l'espace gestion peut en créer, en renommer, en déplacer.
const baseMenu = () => ({
  '@context': 'https://schema.org',
  '@type': 'Menu',
  '@id': `${resto.url}/carte/#menu`,
  name: `La carte — ${resto.name}`,
  inLanguage: 'fr',
  url: `${resto.url}/carte/`,
});

const jsonld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replaceAll('<', `${BARRE}u003c`)}</script>`;

/* ---------- Gabarit commun ---------- */

const ASSETS = {};
const asset = (file) => (ASSETS[file] ??= `${file}?v=${empreinte(file)}`);

function page({ chemin, cle, titre, description, corps, classe, schema, apres = '', indexable = true, php = false }) {
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
<meta name="theme-color" content="#fafafc">
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
<script>document.documentElement.classList.add('js')</script>
<link rel="stylesheet" href="${r}${asset('assets/css/site.css')}">
<script src="${r}${asset('assets/js/site.js')}" defer></script>
${typeof schema === 'string' ? schema : schema ? jsonld(schema) : ''}
</head>
<body class="${classe}" data-page="${cle}" data-collecte="${r}stats/collecte.php">
<a class="evitement" href="#contenu">Aller au contenu</a>
${sprite()}
${navigation(r, chemin)}
${ruban()}
${corps(r)}
${apres}
${pied(r)}
<script type="application/json" id="donnees-site">${JSON.stringify(donnees)}</script>
</body>
</html>
`;
  const dossier = join(PUBLIC, chemin);
  mkdirSync(dossier, { recursive: true });
  // Page à prix : un fichier PHP qui remplace les jetons {{prix:…}} au moment de l'envoi.
  if (php) {
    rmSync(join(dossier, 'index.html'), { force: true });
    writeFileSync(join(dossier, 'index.php'), `<?php require __DIR__ . '/${'../'.repeat(profondeur)}inc/page.php'; ?>${String.fromCharCode(10)}${html}`);
  } else {
    writeFileSync(join(dossier, 'index.html'), html);
  }
  return html;
}

const navigation = (r, chemin) => `<header class="navigation">
  <nav class="navigation__barre" aria-label="Navigation principale">
    <a class="navigation__nom" href="${r}"${chemin === '' ? ' aria-current="page"' : ''}>${esc(resto.name)}</a>
    <ul class="navigation__liens" id="navigation-liens">
      <li><a href="${r}carte/"${chemin === 'carte/' ? ' aria-current="page"' : ''}>La carte</a></li>
      <li><a href="${r}#horaires">Horaires</a></li>
      <li><a href="${r}#acces">Accès</a></li>
    </ul>
    <a class="navigation__appel" href="${tel}" aria-label="Appeler le restaurant au ${resto.phone.display}">${icone('telephone')}<span>${resto.phone.display}</span></a>
    <button type="button" class="navigation__menu" data-menu aria-controls="navigation-liens" aria-expanded="false" aria-label="Menu" hidden><span></span><span></span></button>
  </nav>
</header>`;

// Le bandeau sous la navigation dit si c'est ouvert, à toute heure, sur toutes les pages.
const ruban = () => `<aside class="ruban" aria-label="Ouverture">
  <p class="ruban__texte">${etat('ruban')} ${lien(tel, 'Appeler')}</p>
</aside>`;

const pied = (r) => `<footer class="pied">
  <div class="pied__conteneur">
    <div class="pied__notes">
      <p>Prix en euros, toutes taxes comprises. Le prix confirmé au téléphone ou au comptoir fait foi.</p>
      <p>Les plats du site sont des dessins, pas des photos de nos assiettes.</p>
      <p>Plan : IGN – BD TOPO®, Licence Ouverte Etalab 2.0. Police Inter, licence SIL OFL 1.1.</p>
      <p>Le site mesure sa fréquentation avec un cookie à lui, sans publicité ni partage : <a href="${r}mentions-legales/#cookies">en savoir plus ou refuser</a>.</p>
    </div>
    <nav class="pied__plan" aria-label="Plan du site">
      <div>
        <h2>Le restaurant</h2>
        <ul>
          <li><a href="${r}carte/">La carte</a></li>
          <li><a href="${r}#horaires">Horaires</a></li>
          <li><a href="${r}#acces">Accès</a></li>
        </ul>
      </div>
      <div>
        <h2>Contact</h2>
        <ul>
          <li><a href="${tel}">${resto.phone.display}</a></li>
          <li>${esc(resto.address.street)}</li>
          <li>${resto.address.postalCode} ${esc(resto.address.city)}</li>
        </ul>
      </div>
      <div>
        <h2>Horaires</h2>
        <ul>
${groupesHoraires()
  .map((g) => `          <li>${esc(g)}</li>`)
  .join('')}${regleMidi() ? `
          <li>${esc(regleMidi())}</li>` : ''}
        </ul>
      </div>
    </nav>
    <div class="pied__bas">
      <p>Copyright © ${new Date().getFullYear()} ${esc(resto.name)}. Tous droits réservés.</p>
      <ul><li><a href="${r}mentions-legales/">Mentions légales</a></li><li><a href="${r}admin/" rel="nofollow">Espace gestion</a></li></ul>
    </div>
  </div>
</footer>`;

/* ---------- Accueil ---------- */

const image = (r, nom, alt, classe, { taille = 660, charge = 'lazy' } = {}) =>
  `<img class="${classe}" src="${r}assets/img/plats/${nom}.svg" width="${taille}" height="${taille}" alt="${esc(alt)}"${
    charge === 'eager' ? ' fetchpriority="high"' : ' loading="lazy"'
  } decoding="async">`;

// La vapeur d'un plat chaud : trois voiles qui montent vers nous et se dissipent (animés seulement à l'écran).
const vapeur = () => '<span class="vapeur" aria-hidden="true"><span></span><span></span><span></span></span>';

// Le plat dans son cadre : c'est le cadre qui se révèle et qui recadre, le dessin qui tourne et s'incline.
const cadrePlat = (contenu, classe = '') => `<div class="tuile__plat${classe ? ` ${classe}` : ''}">${contenu}</div>`;

// Le titre du héros se lève mot après mot, chacun sorti de son propre cache.
const motsLeves = (texte) =>
  texte
    .split(' ')
    .map((mot, i) => `<span class="mot"><span class="mot__in" style="--m:${i}">${esc(mot)}</span></span>`)
    .join(' ');

// Une tuile « produit » : nom, phrase, prix, deux actions, le plat dessiné.
// Le nom du plat et sa rubrique sur la carte sont des jetons : l'espace gestion peut renommer ou déplacer le plat.
const tuile = (r, p, teinte) => {
  const id = idPlat(p, p.section);
  const prix = jeton('prix', id);
  const detail = p.section.withRice ? `${prix}, servi avec du riz nature.` : `${prix}.`;
  return `<section class="tuile tuile--${teinte} tuile--demi" aria-labelledby="tuile-${slug(p.name)}" data-reveler>
      <div class="tuile__texte">
        <h2 class="tuile__titre" id="tuile-${slug(p.name)}">${jeton('nom', id)}</h2>
        <p class="tuile__accroche">${esc(p.accroche)}</p>
        <p class="tuile__detail">${esc(detail)}</p>
        <div class="tuile__actions">
          <a class="bouton" href="${tel}">Commander</a>
          <a class="bouton bouton--contour" href="${r}carte/#${jeton('ancre', id)}">Voir à la carte</a>
        </div>
      </div>
      ${cadrePlat(image(r, p.image, `${jeton('nom', id)} vu du dessus (illustration)`, 'tuile__image', { taille: 660 }))}
    </section>`;
};

// La soupe en deux couches pour la scène « fait maison » : le bol vide, puis la garniture, ingrédient par ingrédient.
const garnitureSoupe = readFileSync(join(PUBLIC, 'assets/img/plats/soupe-garniture.svg'), 'utf8').trim();

const accueil = () =>
  page({
    chemin: '',
    cle: 'accueil',
    php: true,
    titre: `${resto.name} — restaurant cambodgien à ${resto.town}`,
    description: descriptionResto,
    classe: 'page-accueil',
    schema: schemaRestaurant(),
    corps: (r) => `<main id="contenu">
  <section class="tuile tuile--noire tuile--heros" aria-labelledby="heros-titre">
    <div class="tuile__texte">
      <h1 class="tuile__titre" id="heros-titre">${motsLeves(resto.name)}</h1>
      <p class="tuile__accroche">${esc(resto.tagline)}.</p>
      <p class="tuile__detail">${esc(resto.town)}. Commandes et réservations par téléphone.</p>
      <div class="tuile__actions">
        <a class="bouton" href="${tel}">Appeler</a>
        <a class="bouton bouton--contour" href="${r}carte/">Voir la carte</a>
      </div>
    </div>
    ${cadrePlat(`${image(r, 'soupe', 'Soupe Phnom Penh vue du dessus (illustration)', 'tuile__image', { taille: 660, charge: 'eager' })}${vapeur()}`, 'tuile__plat--chaud')}
  </section>

  <section class="tuile tuile--claire" id="box" aria-labelledby="box-titre" data-reveler>
    <div class="tuile__texte">
      <h2 class="tuile__titre" id="box-titre">${jeton('nom', ID_BOX)}</h2>
      <p class="tuile__accroche">Deux nems, du poulet mariné et son riz, une boisson.</p>
      <p class="tuile__detail">${jeton('rond', ID_BOX)}, boisson comprise.</p>
      <div class="tuile__actions">
        <a class="bouton" href="${tel}">Commander</a>
        <a class="bouton bouton--contour" href="${r}carte/#${jeton('ancre', ID_BOX)}">En savoir plus</a>
      </div>
    </div>
    ${cadrePlat(image(r, BOX.image, 'Box anti-crise vue du dessus : deux nems, poulet mariné sur son riz et une canette (illustration)', 'tuile__image'))}
  </section>

  <div class="grille">
    ${tuile(r, plat('Lok lac'), 'claire')}
    ${tuile(r, plat('Bo bun'), 'noire')}
    ${tuile(r, plat('Nems au porc'), 'noire')}
    ${tuile(r, plat('Porc au caramel'), 'claire')}
  </div>

  <section class="scene" id="fait-maison" aria-labelledby="scene-titre" data-scene>
    <div class="scene__cadre">
      <div class="scene__texte">
        <h2 class="scene__titre" id="scene-titre">
          <span class="scene__ligne" data-de="0" data-a="0.1">Tout est fait maison.</span>
          <span class="scene__ligne" data-de="0.38" data-a="0.48">Avec des produits frais.</span>
          <span class="scene__ligne" data-de="0.72" data-a="0.82">Et beaucoup d’amour.</span>
        </h2>
        <p class="scene__suite" data-de="0.86" data-a="0.96">
          <span class="scene__detail">Citronnelle, saté, caramel, lait de coco&#8239;: les saveurs du Cambodge, dans une carte de ${jeton('nombre', 'plats')} plats.</span>
          ${lien(`${r}carte/`, 'Découvrir la carte')}
        </p>
      </div>
      <div class="scene__bol" role="img" aria-label="Une soupe Phnom Penh qui se prépare, vue du dessus : le bouillon, les nouilles, le porc, les crevettes, les herbes et le citron vert (illustration)">
        <img class="scene__fond" src="${r}assets/img/plats/soupe-bol.svg" width="660" height="660" alt="" loading="lazy" decoding="async">
        ${garnitureSoupe}
        ${vapeur()}
      </div>
    </div>
  </section>

  <section class="tuile tuile--claire tuile--horaires" id="horaires" aria-labelledby="horaires-titre" data-reveler>
    <div class="tuile__texte">
      <h2 class="tuile__titre" id="horaires-titre">Horaires</h2>
      <p class="tuile__accroche">${etat('grand')}</p>
      <p class="tuile__detail tuile__conseil" data-conseil hidden></p>
    </div>
    ${tableHoraires()}
${regleMidi() ? `    <p class="tuile__note">${esc(regleMidi())}</p>
` : ''}    <div class="tuile__actions"><a class="bouton" href="${tel}">Appeler</a></div>
  </section>

  <section class="tuile tuile--blanche tuile--acces" id="acces" aria-labelledby="acces-titre" data-reveler>
    <div class="tuile__texte">
      <h2 class="tuile__titre" id="acces-titre">${esc(resto.invite)}</h2>
      <p class="tuile__accroche"><span class="insecable">${esc(resto.address.street)},</span> <span class="insecable">${resto.address.postalCode} ${esc(resto.address.city)}.</span></p>
      <p class="tuile__detail">Au nord de Toulouse. Commandes et réservations par téléphone.</p>
      <div class="tuile__actions">
        <a class="bouton" href="${liens.itineraire}">Itinéraire</a>
        <a class="bouton bouton--contour" href="${tel}">Appeler</a>
      </div>
      <p class="tuile__liens">${lien(liens.waze, 'Ouvrir dans Waze')} ${lien(liens.apple, 'Ouvrir dans Plans')}</p>
    </div>
    <figure class="plan">
      <a class="plan__lien" href="${liens.carteGoogle}">
        <img src="${r}assets/img/plan-quartier.svg" width="800" height="560" loading="lazy" decoding="async" alt="Plan du quartier : le restaurant est au 10 avenue Salvador Allende, près de la rue de Fenouillet et de la route de Paris.">
        <span class="plan__onde" aria-hidden="true"></span>
      </a>
      <figcaption>Plan : IGN – BD TOPO®, Licence Ouverte Etalab 2.0</figcaption>
    </figure>
  </section>
</main>`,
  });

/* ---------- La carte ---------- */

// Les rubriques, leurs plats et l'index sont rendus par le serveur à chaque visite (public/inc/noyau.php) : l'espace
// gestion peut ajouter des rubriques et des plats, renommer et déplacer les plats. Ici, la page autour.
const lacarte = () =>
  page({
    chemin: 'carte/',
    cle: 'carte',
    php: true,
    titre: `La carte — ${resto.name}, ${resto.town}`,
    description: `Toute la carte d’${resto.name} à ${resto.town} : ${jeton('nombre', 'plats')} plats faits maison, de la box anti-crise à ${jeton('rond', ID_BOX)} au lok lac, avec les prix. Commande par téléphone au ${resto.phone.display}.`,
    classe: 'page-carte',
    schema: jeton('carte', 'jsonld'),
    apres: `<nav class="barre-bon" aria-label="Actions rapides" data-barre-bon>
  <button type="button" class="barre-bon__ouvrir" data-ouvrir-bon aria-controls="bon" aria-expanded="false" hidden>${icone('sac')}<span>Votre commande</span><span class="barre-bon__compte" data-bon-compte hidden>0</span></button>
  <a class="bouton bouton--petit" href="${tel}">Appeler</a>
</nav>`,
    corps: () => `<main id="contenu">
  <header class="carte-tete">
    <h1 class="carte-tete__titre">La carte</h1>
    <p class="carte-tete__accroche">${jeton('nombre', 'plats')} plats faits maison.</p>
    <p class="carte-tete__detail">${esc('Commandez dès maintenant !')} Par téléphone, au <a href="${tel}">${resto.phone.display}</a>.</p>
    <div class="recherche" role="search">
      <label class="visuellement-cache" for="recherche">Chercher un plat</label>
      ${icone('recherche')}
      <input id="recherche" type="search" placeholder="Chercher un plat : lok lac, crevettes…" autocomplete="off" spellcheck="false" enterkeyhint="search" aria-describedby="recherche-etat">
    </div>
    <p class="recherche__etat" id="recherche-etat" role="status" aria-live="polite"></p>
  </header>

  <div class="carte">
    <nav class="rubriques" aria-label="Rubriques de la carte">
      <ul>
${jeton('carte', 'index')}
      </ul>
    </nav>

    <div class="carte__liste">
      <div class="carte__vide" data-vide hidden>
        <p>Aucun plat ne correspond à «&#8239;<span data-vide-terme></span>&#8239;».</p>
        <p>Essayez «&#8239;crevettes&#8239;», «&#8239;poulet&#8239;» ou «&#8239;soupe&#8239;», ou <button type="button" class="lien lien--bouton" data-effacer>effacez la recherche</button>.</p>
      </div>
${jeton('carte', 'rubriques')}
      <p class="carte__maj">Carte mise à jour le ${new Date(`${carte.updated}T12:00:00`).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}. Prix TTC&#8239;; en cas de doute, le prix annoncé au téléphone fait foi.</p>
    </div>

    <aside class="bon" id="bon" aria-labelledby="bon-titre" data-bon data-riz-id="${ID_SUPPLEMENT}" data-riz-prix="${jeton('cents', ID_SUPPLEMENT)}" hidden>
      <div class="bon__feuille">
        <div class="bon__tete">
          <h2 id="bon-titre">Votre commande</h2>
          <button type="button" class="bon__fermer" data-fermer-bon aria-label="Fermer">${icone('fermer')}</button>
        </div>
        <p class="bon__vide" data-bon-vide>Ajoutez des plats avec le bouton ${icone('plus', 'icone--texte')}, puis appelez-nous pour commander.</p>
        <ul class="bon__lignes" data-bon-lignes></ul>
        <p class="bon__total"><span>Total</span> <output data-bon-total>0,00&nbsp;€</output></p>
        <a class="bouton bouton--large" href="${tel}">Appeler pour commander</a>
        <button type="button" class="lien lien--bouton bon__vider" data-bon-vider>Tout retirer</button>
        <p class="bon__note">Rien n’est envoyé : vous dictez votre commande au téléphone. Le total est indicatif et reste sur votre appareil.</p>
      </div>
    </aside>
  </div>
</main>`,
  });

/* ---------- Mentions légales ---------- */

const aCompleter = (v) => (v ? esc(v) : '<span class="a-completer">à compléter</span>');
const siret = (v) => (v ? esc(v.replace(/^([0-9]{3})([0-9]{3})([0-9]{3})([0-9]{5})$/, '$1 $2 $3 $4')) : aCompleter(v));

const mentions = () =>
  page({
    chemin: 'mentions-legales/',
    cle: 'mentions',
    titre: `Mentions légales — ${resto.name}`,
    description: `Mentions légales et informations sur le site d’${resto.name}, ${resto.town}.`,
    classe: 'page-texte',
    corps: () => `<main id="contenu" class="texte">
  <h1>Mentions légales</h1>
  <h2>Éditeur du site</h2>
  <p>${esc(resto.name)}<br>
    Raison sociale : ${aCompleter(resto.legal.company)}${resto.legal.legalForm ? ` (${esc(resto.legal.legalForm)})` : ''}<br>
    SIRET : ${siret(resto.legal.siret)}<br>
    ${esc(resto.address.street)}, ${resto.address.postalCode} ${esc(resto.address.city)}<br>
    Téléphone : <a href="${tel}">${resto.phone.display}</a></p>
  <p>Directeur de la publication : ${aCompleter(resto.legal.publisher)}</p>
  <h2>Hébergement</h2>
  <p>${aCompleter(resto.legal.host)}${resto.legal.hostAddress ? `<br>${esc(resto.legal.hostAddress)}` : ''}${
    resto.legal.hostPhone ? `<br>Téléphone : ${esc(resto.legal.hostPhone)}` : ''
  }</p>
  <h2 id="cookies">Données personnelles et cookies</h2>
  <p>Le site mesure lui-même sa fréquentation, pour savoir combien de personnes le consultent et ce qui leur sert. Il dépose pour cela un cookie, «&#8239;asdc_mesure&#8239;», qui ne sert qu’à ces statistiques&#8239;: pas de publicité, aucun partage, aucun service extérieur. Il dure 13 mois au plus et n’est jamais prolongé&#8239;; les chiffres sont conservés 25 mois. Un second cookie, «&#8239;asdc_visite&#8239;», distingue une visite de la suivante et s’efface après 30 minutes sans activité.</p>
  <p>Sont comptés, sans rien qui vous identifie&#8239;: les pages vues, l’heure d’arrivée et le temps passé sur le site (seulement quand une page est affichée), la provenance (moteur de recherche, réseau social…), le type d’appareil, les boutons «&#8239;Appeler&#8239;» et «&#8239;Itinéraire&#8239;» touchés, les plats ajoutés à la commande et les mots cherchés dans la carte. Ce fonctionnement dispense le site de bandeau de consentement selon les règles de la CNIL, mais vous pouvez refuser à tout moment.</p>
  <div class="refus" data-refus>
    <p class="refus__etat" data-refus-etat>Sans JavaScript, rien n’est mesuré.</p>
    <button type="button" class="bouton bouton--contour" data-refus-bouton hidden>Refuser la mesure d’audience</button>
  </div>
  <p>Un navigateur réglé pour demander à ne pas être suivi («&#8239;Do Not Track&#8239;», «&#8239;Global Privacy Control&#8239;») n’est jamais mesuré.</p>
  <p>La commande préparée sur la carte reste dans votre navigateur (stockage local) et n’est jamais transmise&#8239;; vous pouvez la vider à tout moment. Seuls le nombre de plats et le total sont comptés, sans le détail, quand vous appelez depuis «&#8239;Votre commande&#8239;».</p>
  <p>Un dernier cookie, «&#8239;asdc_gestion&#8239;», ne sert qu’à l’espace de gestion réservé au restaurant.</p>
  <h2>Crédits</h2>
  <p>Illustrations&#8239;: dessins vectoriels créés pour ce site. Ce ne sont pas des photos des plats du restaurant.<br>
    Plan du quartier&#8239;: données IGN – BD TOPO®, Licence Ouverte Etalab 2.0.<br>
    Police&#8239;: Inter (Rasmus Andersson), sous licence SIL Open Font License 1.1&#8239;; police système sur les appareils Apple.</p>
  <h2>Prix</h2>
  <p>Les prix sont indiqués en euros, toutes taxes comprises. Ils peuvent évoluer&#8239;; le prix confirmé au téléphone ou au comptoir fait foi.</p>
</main>`,
  });

/* ---------- 404 et redirection ---------- */

const introuvable = () => {
  const html = page({
    chemin: '404-tmp/',
    cle: 'introuvable',
    titre: `Page introuvable — ${resto.name}`,
    description: 'Cette page n’existe pas ou plus.',
    classe: 'page-texte page-404',
    indexable: false,
    corps: () => `<main id="contenu" class="introuvable">
  <h1>Cette page est introuvable.</h1>
  <p>L’adresse a peut-être changé. La carte, elle, est toujours là.</p>
  <div class="tuile__actions">
    <a class="bouton" href="/carte/">Voir la carte</a>
    <a class="bouton bouton--contour" href="/">Revenir à l’accueil</a>
  </div>
</main>`,
  });
  // La 404 est servie depuis n'importe quelle profondeur : chemins absolus.
  writeFileSync(
    join(PUBLIC, '404.html'),
    html.replaceAll('href="../', 'href="/').replaceAll('src="../', 'src="/').replaceAll('data-collecte="../', 'data-collecte="/'),
  );
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
  writeFileSync(join(PUBLIC, 'robots.txt'), ['User-agent: *', 'Allow: /', '', `Sitemap: ${resto.url}/sitemap.xml`, ''].join(String.fromCharCode(10)));
  writeFileSync(
    join(PUBLIC, 'site.webmanifest'),
    `${JSON.stringify(
      {
        name: resto.name,
        short_name: 'Saveurs du Cambodge',
        lang: 'fr',
        start_url: './',
        display: 'browser',
        background_color: '#ffffff',
        theme_color: '#fafafc',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      null,
      2,
    )}${String.fromCharCode(10)}`,
  );
  // Le site a besoin de PHP (prix modifiables, statistiques) : les réglages propres à Netlify n'ont plus lieu d'être.
  for (const fichier of ['_redirects', '_headers']) rmSync(join(PUBLIC, fichier), { force: true });

  // La carte pour le serveur : identifiants, noms et prix d'origine en centimes (espace gestion, remplacement des jetons).
  const rubriquesServeur = [
    ...carte.sections.map((section) => ({
      id: section.id,
      titre: section.title,
      riz: Boolean(section.withRice),
      plats: section.items.map((item) => ({
        id: idPlat(item, section),
        nom: item.name,
        desc: item.desc || '',
        prix: Math.round(item.price * 100),
        recherche: normaliser([item.name, item.desc, section.title].filter(Boolean).join(' ')),
        cles: item.spicy ? 'piquant epice' : '',
      })),
    })),
    {
      id: 'supplements',
      titre: 'Supplément',
      // Rubrique propre à l'espace gestion : seul le prix s'y change.
      fixe: true,
      plats: [
        {
          id: ID_SUPPLEMENT,
          nom: carte.riceUpgrade.name,
          desc: 'Avec les plats servis avec du riz nature',
          prix: Math.round(carte.riceUpgrade.price * 100),
          recherche: normaliser(`${carte.riceUpgrade.name} riz`),
        },
      ],
    },
  ];
  const ids = rubriquesServeur.flatMap((r) => r.plats.map((p) => p.id));
  const doublons = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (doublons.length) throw new Error(`Deux plats portent le même identifiant : ${doublons.join(', ')}`);
  mkdirSync(join(PUBLIC, 'inc'), { recursive: true });
  // Comme les données du serveur : un fichier PHP qui s'arrête avant son contenu si on le demande depuis le navigateur.
  rmSync(join(PUBLIC, 'inc/carte.json'), { force: true });
  writeFileSync(
    join(PUBLIC, 'inc/carte.php'),
    `<?php http_response_code(404); exit; ?>${String.fromCharCode(10)}${JSON.stringify({ maj: carte.updated, menu: baseMenu(), rubriques: rubriquesServeur }, null, 1)}${String.fromCharCode(10)}`,
  );

  // Hébergement Apache (IONOS, OVH, o2switch…) : les règles de _redirects et _headers, plus le passage en HTTPS.
  // Aucune barre oblique inverse : les points des motifs s'écrivent [.].
  const hote = new URL(resto.url).hostname;
  const motif = hote.replace(/^www[.]/, '').split('.').join('[.]');
  writeFileSync(
    join(PUBLIC, '.htaccess'),
    [
      '# Aux Saveurs du Cambodge : réglages pour un hébergement Apache (IONOS, OVH, o2switch…).',
      '# Fichier généré par build.mjs : modifier le générateur plutôt que ce fichier.',
      '',
      '# Page « introuvable » du site',
      'ErrorDocument 404 /404.html',
      '',
      '# Pas de DirectoryIndex ici : un hébergement strict le refuse (erreur 500 sur tout le site).',
      '# Les serveurs PHP servent index.php par défaut, et aucun dossier n’a à la fois index.php et index.html.',
      '',
      '# Types et encodage des fichiers',
      'AddType application/manifest+json .webmanifest',
      'AddType font/woff2 .woff2',
      'AddType image/svg+xml .svg',
      'AddCharset utf-8 .html .css .js .svg .xml .txt .webmanifest',
      '',
      '<IfModule mod_rewrite.c>',
      '  RewriteEngine On',
      '',
      '  # Fichiers internes (code commun, prix, statistiques, mot de passe) : jamais servis.',
      '  RewriteRule ^(inc|donnees)(/|$) - [R=404,L]',
      '',
      `  # Toujours https://${hote}, avec le test de port conseillé par IONOS.`,
      '  # Ne joue que sur le vrai domaine : l’adresse provisoire de l’hébergeur reste consultable pendant les essais.',
      '  # Prérequis : le certificat SSL du domaine doit être actif.',
      `  RewriteCond %{HTTP_HOST} ^(www[.])?${motif}(:[0-9]+)?$ [NC]`,
      '  RewriteCond %{SERVER_PORT} !=443 [OR]',
      '  RewriteCond %{HTTP_HOST} !^www[.] [NC]',
      `  RewriteRule ^(.*)$ https://${hote}/$1 [R=301,L]`,
      '',
      '  # L’ancienne adresse de la carte',
      '  RewriteRule ^nouvelle-page/?$ /carte/ [R=301,L]',
      '</IfModule>',
      '',
      '<IfModule mod_deflate.c>',
      '  <IfModule mod_filter.c>',
      '    AddOutputFilterByType DEFLATE text/html text/css text/plain text/xml application/xml application/javascript text/javascript application/json application/manifest+json image/svg+xml',
      '  </IfModule>',
      '</IfModule>',
      '',
      '<IfModule mod_headers.c>',
      '  Header always set X-Content-Type-Options "nosniff"',
      '  Header always set Referrer-Policy "strict-origin-when-cross-origin"',
      '  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"',
      '  # La police ne change jamais (un an) ; images, styles et scripts versionnés : une semaine ; les pages se revérifient.',
      '  <FilesMatch "[.]woff2$">',
      '    Header set Cache-Control "public, max-age=31536000, immutable"',
      '  </FilesMatch>',
      '  <FilesMatch "[.](css|js|svg|png|jpg|webmanifest)$">',
      '    Header set Cache-Control "public, max-age=604800"',
      '  </FilesMatch>',
      '  <FilesMatch "[.]html$">',
      '    Header set Cache-Control "no-cache"',
      '  </FilesMatch>',
      '</IfModule>',
      '',
    ].join(String.fromCharCode(10)),
  );
};

/* ---------- Archive à déposer chez un hébergeur classique ---------- */

// CRC-32 (polynôme 0xEDB88320), la somme de contrôle du format ZIP.
const TABLE_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (octets) => {
  let c = 0xffffffff;
  for (const o of octets) c = TABLE_CRC[(c ^ o) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

// Dossiers puis fichiers de public/, triés, chemins séparés par « / ».
const inventaire = (dossier, prefixe = '') =>
  readdirSync(dossier, { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .flatMap((e) =>
      e.isDirectory() ? [`${prefixe}${e.name}/`, ...inventaire(join(dossier, e.name), `${prefixe}${e.name}/`)] : [`${prefixe}${e.name}`],
    );

// ZIP reproductible : ordre trié, date de la carte, et pour chaque fichier une heure tirée de son contenu.
// La même archive tant que le site ne change pas ; mais un fichier modifié change d'heure, si bien qu'un serveur
// où l'on décompresse une mise à jour (cache OPcache de PHP, qui se fie à la date) sert bien la nouvelle version.
// Les fichiers sont à la racine de l'archive : on la décompresse directement dans le dossier du site chez l'hébergeur.
const archiver = (source, cible, garder) => {
  const [an, mois, jour] = carte.updated.split('-').map(Number);
  const dateDos = ((an - 1980) << 9) | (mois << 5) | jour;
  const locaux = [];
  const central = [];
  let decalage = 0;
  let nombre = 0;
  for (const nom of inventaire(source).filter(garder)) {
    const dossier = nom.endsWith('/');
    const brut = dossier ? Buffer.alloc(0) : readFileSync(join(source, nom));
    const compresse = dossier ? brut : deflateRawSync(brut, { level: 9 });
    const stocke = dossier || compresse.length >= brut.length;
    const donnees = stocke ? brut : compresse;
    const nomOctets = Buffer.from(nom, 'utf8');
    const crc = crc32(brut);
    // Heure du jour à 2 secondes près, comme le veut le format : 43 200 heures possibles.
    const pas = dossier ? 0 : crc % 43200;
    const heureDos = (Math.floor(pas / 1800) << 11) | (Math.floor((pas % 1800) / 30) << 5) | pas % 30;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(stocke ? 0 : 8, 8);
    local.writeUInt16LE(heureDos, 10);
    local.writeUInt16LE(dateDos, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(donnees.length, 18);
    local.writeUInt32LE(brut.length, 22);
    local.writeUInt16LE(nomOctets.length, 26);
    local.writeUInt16LE(0, 28);
    const fiche = Buffer.alloc(46);
    fiche.writeUInt32LE(0x02014b50, 0);
    fiche.writeUInt16LE(0x0314, 4);
    fiche.writeUInt16LE(20, 6);
    fiche.writeUInt16LE(0x0800, 8);
    fiche.writeUInt16LE(stocke ? 0 : 8, 10);
    fiche.writeUInt16LE(heureDos, 12);
    fiche.writeUInt16LE(dateDos, 14);
    fiche.writeUInt32LE(crc, 16);
    fiche.writeUInt32LE(donnees.length, 20);
    fiche.writeUInt32LE(brut.length, 24);
    fiche.writeUInt16LE(nomOctets.length, 28);
    fiche.writeUInt32LE(dossier ? 0o40755 * 65536 + 0x10 : 0o100644 * 65536, 38);
    fiche.writeUInt32LE(decalage, 42);
    locaux.push(local, nomOctets, donnees);
    central.push(fiche, nomOctets);
    decalage += local.length + nomOctets.length + donnees.length;
    nombre += 1;
  }
  const tailleCentral = central.reduce((s, b) => s + b.length, 0);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(nombre, 8);
  fin.writeUInt16LE(nombre, 10);
  fin.writeUInt32LE(tailleCentral, 12);
  fin.writeUInt32LE(decalage, 16);
  mkdirSync(dirname(cible), { recursive: true });
  writeFileSync(cible, Buffer.concat([...locaux, ...central, fin]));
  return nombre;
};

/* ---------- Construction ---------- */

accueil();
lacarte();
mentions();
introuvable();
redirection('nouvelle-page/', 'carte/');
annexes();
rmSync(join(PUBLIC, '404-tmp'), { recursive: true, force: true });

// Les données du serveur (prix saisis, statistiques, mot de passe) ne partent jamais dans l'archive :
// une mise à jour déposée par-dessus le site en ligne ne les écrase pas.
const ARCHIVE = 'livraison/aux-saveurs-du-cambodge-site.zip';
const PROTEGES = ['donnees/', 'donnees/.htaccess', 'donnees/index.html'];
const nbFichiers = archiver(PUBLIC, join(ROOT, ARCHIVE), (nom) => !nom.startsWith('donnees/') || PROTEGES.includes(nom));

const manquants = Object.entries(resto.legal)
  .filter(([cle, v]) => !v && cle !== 'legalForm' && cle !== 'hostAddress')
  .map(([cle]) => cle);
console.log(`Site généré dans public/ : accueil, carte (${nbPlats} plats), mentions légales, 404.`);
console.log(`Archive pour un hébergeur classique (IONOS…) : ${ARCHIVE} (${nbFichiers} fichiers et dossiers).`);
if (manquants.length) console.warn(`À compléter avant la mise en ligne (data/restaurant.json → legal) : ${manquants.join(', ')}`);
