/* Aux Saveurs du Cambodge — état d'ouverture en direct, menu mobile, révélations, recherche et commande. */
(() => {
  'use strict';

  const source = document.getElementById('donnees-site');
  if (!source) return;
  const donnees = JSON.parse(source.textContent);

  // Caractères invisibles construits ici plutôt qu'écrits en dur : ils restent lisibles dans le code.
  const NBSP = String.fromCharCode(0xa0);
  const FINE = String.fromCharCode(0x202f);

  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)');
  const anime = Boolean(document.body.animate);
  const sousLaLigne = (el) => el.getBoundingClientRect().top > window.innerHeight;

  // Relance la petite pulsation qui signale un changement (total, compteur, quantité).
  const secouer = (elements) =>
    elements.forEach((el) => {
      el.classList.remove('vient-de-changer');
      void el.offsetWidth;
      el.classList.add('vient-de-changer');
    });

  const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const enMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const heure = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h}${NBSP}h${NBSP}${String(m).padStart(2, '0')}` : `${h}${NBSP}h`;
  };

  /* ---------- Heure de Paris, quel que soit le fuseau du visiteur ---------- */

  const horloge = new Intl.DateTimeFormat('en-GB', {
    timeZone: donnees.timezone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const maintenant = () => {
    const parts = Object.fromEntries(horloge.formatToParts(new Date()).map((p) => [p.type, p.value]));
    return {
      jour: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday),
      min: (Number(parts.hour) % 24) * 60 + Number(parts.minute),
      iso: `${parts.year}-${parts.month}-${parts.day}`,
    };
  };

  const isoPlus = (iso, jours) => {
    const [a, m, j] = iso.split('-').map(Number);
    return new Date(Date.UTC(a, m - 1, j + jours)).toISOString().slice(0, 10);
  };

  const services = (jour) => (donnees.hours[jour] || []).map(([a, b]) => [enMinutes(a), enMinutes(b)]);
  const fermeture = (iso) => (donnees.closures || []).find((c) => iso >= c.from && iso <= (c.to || c.from));
  const midiSurCommande = (jour) => donnees.preorderLunch.days.includes(jour);

  const dateLongue = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

  const prochainService = (t) => {
    let apresFermeture = false;
    for (let k = 0; k < 60; k++) {
      const jour = (t.jour + k) % 7;
      const iso = isoPlus(t.iso, k);
      if (fermeture(iso)) {
        apresFermeture = true;
        continue;
      }
      for (const [debut] of services(jour)) {
        if (k === 0 && debut <= t.min) continue;
        // Au-delà d'une fermeture, « dimanche » seul serait ambigu : on donne la date.
        const quand =
          k === 0 ? '' : k === 1 ? 'demain ' : apresFermeture || k > 6 ? `le ${dateLongue.format(new Date(`${iso}T00:00:00Z`))} ` : `${JOURS[jour]} `;
        return `ouvre ${quand}à ${heure(debut)}`;
      }
    }
    return '';
  };

  // Deux longueurs : « court » pour le ruban sous la navigation, « texte » pour la tuile Horaires.
  const calculer = (t) => {
    const ferie = fermeture(t.iso);
    if (ferie) {
      const suite = prochainService({ ...t, min: 24 * 60 });
      return {
        code: 'ferme',
        court: `Fermé aujourd’hui${suite ? ` · ${suite}` : ''}`,
        texte: `Fermé aujourd’hui${ferie.label ? ` (${ferie.label})` : ''}${suite ? ` · ${suite}` : ''}`,
      };
    }
    for (const [debut, fin] of services(t.jour)) {
      if (t.min >= debut && t.min < fin) {
        return {
          code: 'ouvert',
          court: `Ouvert jusqu’à ${heure(fin)}`,
          texte: `Ouvert · service du ${debut < 15 * 60 ? 'midi' : 'soir'} jusqu’à ${heure(fin)}`,
        };
      }
    }
    if (midiSurCommande(t.jour) && t.min >= 11 * 60 && t.min < 14 * 60) {
      const soir = services(t.jour)[0];
      return {
        code: 'commande',
        court: `Midi sur commande${soir ? ` · ce soir à ${heure(soir[0])}` : ''}`,
        texte: `Midi sur commande passée la veille${soir ? ` · ouvert ce soir à ${heure(soir[0])}` : ''}`,
      };
    }
    const suite = prochainService(t);
    const ferme = suite ? `Fermé · ${suite}` : 'Fermé';
    return { code: 'ferme', court: ferme, texte: ferme };
  };

  // Le midi du week-end se commande la veille : on le rappelle le jour d'avant, tant que c'est ouvert.
  const conseil = (t) => {
    const demain = (t.jour + 1) % 7;
    if (!midiSurCommande(demain) || fermeture(t.iso) || fermeture(isoPlus(t.iso, 1))) return '';
    const dernier = services(t.jour).at(-1);
    if (!dernier || t.min >= dernier[1]) return '';
    return `Envie de déjeuner ${JOURS[demain]} midi${FINE}? Commandez aujourd’hui, avant ${heure(dernier[1])}.`;
  };

  let premierAffichage = true;

  const afficherHoraires = () => {
    const t = maintenant();
    const e = calculer(t);
    document.querySelectorAll('[data-etat]').forEach((el) => {
      const texte = el.dataset.etat === 'ruban' ? e.court : e.texte;
      const zone = el.querySelector('.etat__texte');
      if (el.dataset.code === e.code && zone.textContent === texte) return;
      const changer = () => {
        el.dataset.code = e.code;
        zone.textContent = texte;
      };
      if (premierAffichage || !anime || reduit.matches) return changer();
      // Pendant la visite, l'état change en fondu enchaîné.
      const sortie = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' });
      sortie.onfinish = () => {
        changer();
        sortie.cancel();
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
      };
    });
    const astuce = conseil(t);
    document.querySelectorAll('[data-conseil]').forEach((el) => {
      el.textContent = astuce;
      el.hidden = !astuce;
    });
    document.querySelectorAll('.semaine tr[data-jour]').forEach((tr) => {
      const estAujourdhui = Number(tr.dataset.jour) === t.jour;
      tr.classList.toggle('est-aujourdhui', estAujourdhui);
      if (estAujourdhui) tr.setAttribute('aria-current', 'date');
      else tr.removeAttribute('aria-current');
    });
    premierAffichage = false;
  };

  afficherHoraires();
  setInterval(afficherHoraires, 60 * 1000);

  /* ---------- Menu sur mobile ---------- */

  const navigation = document.querySelector('.navigation');
  const boutonMenu = document.querySelector('[data-menu]');
  if (navigation && boutonMenu) {
    const etroit = window.matchMedia('(max-width: 833px)');
    const autour = () => [...document.body.children].filter((el) => el !== navigation && el.tagName !== 'SCRIPT');
    const basculerMenu = (ouvert, rendreLaMain = true) => {
      if (navigation.classList.contains('est-ouverte') === ouvert) return;
      navigation.classList.toggle('est-ouverte', ouvert);
      document.documentElement.classList.toggle('menu-ouvert', ouvert);
      boutonMenu.setAttribute('aria-expanded', String(ouvert));
      boutonMenu.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Menu');
      // Menu ouvert, le reste de la page ne reçoit ni le clic ni le clavier.
      autour().forEach((el) => (el.inert = ouvert));
      if (ouvert) navigation.querySelector('.navigation__liens a')?.focus({ preventScroll: true });
      else if (rendreLaMain) boutonMenu.focus({ preventScroll: true });
    };
    boutonMenu.hidden = false;
    boutonMenu.addEventListener('click', () => basculerMenu(!navigation.classList.contains('est-ouverte')));
    navigation.querySelectorAll('.navigation__liens a').forEach((a) => a.addEventListener('click', () => basculerMenu(false, false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') basculerMenu(false);
    });
    etroit.addEventListener('change', () => basculerMenu(false, false));
  }

  /* ---------- Les tuiles se révèlent en entrant dans l'écran ---------- */

  const aReveler = [...document.querySelectorAll('[data-reveler]')].filter(sousLaLigne);
  if (aReveler.length && !reduit.matches && 'IntersectionObserver' in window) {
    const observateur = new IntersectionObserver(
      (entrees) =>
        entrees.forEach((entree) => {
          if (!entree.isIntersecting) return;
          entree.target.classList.remove('est-pret');
          observateur.unobserve(entree.target);
        }),
      { rootMargin: '0px 0px -12% 0px' },
    );
    aReveler.forEach((el) => {
      el.classList.add('est-pret');
      observateur.observe(el);
    });
  }

  /* ---------- La carte ---------- */

  const champ = document.getElementById('recherche');
  if (!champ) return;

  const plats = [...document.querySelectorAll('.plat')];
  const rubriques = [...document.querySelectorAll('[data-rubrique]')];
  const liens = new Map([...document.querySelectorAll('[data-lien-rubrique]')].map((a) => [a.dataset.lienRubrique, a]));
  const vide = document.querySelector('[data-vide]');
  const terme = document.querySelector('[data-vide-terme]');
  const etatRecherche = document.getElementById('recherche-etat');

  const sansAccents = (s) =>
    [...s.normalize('NFD')]
      .filter((c) => {
        const code = c.charCodeAt(0);
        return code < 0x300 || code > 0x36f;
      })
      .join('');

  const normaliser = (s) =>
    sansAccents(s.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae'))
      .replace(/[’']/g, ' ')
      .split(' ')
      .filter(Boolean)
      .join(' ');

  const filtrer = () => {
    const brut = champ.value.trim();
    const mots = normaliser(brut)
      .split(' ')
      .filter(Boolean)
      .map((m) => (m.length > 3 ? m.replace(/s$/, '') : m));
    let trouves = 0;
    for (const p of plats) {
      const ok = mots.every((m) => p.dataset.recherche.includes(m));
      p.hidden = !ok;
      if (ok) trouves += 1;
    }
    for (const r of rubriques) {
      const visible = Boolean(r.querySelector('.plat:not([hidden])'));
      r.hidden = !visible;
      const lien = liens.get(r.id);
      if (lien) lien.parentElement.hidden = !visible;
    }
    vide.hidden = trouves > 0;
    terme.textContent = brut;
    etatRecherche.textContent =
      mots.length && trouves ? `${trouves} plat${trouves > 1 ? 's' : ''} pour «${FINE}${brut}${FINE}»` : '';
  };

  champ.addEventListener('input', filtrer);
  document.querySelector('[data-effacer]')?.addEventListener('click', () => {
    champ.value = '';
    filtrer();
    champ.focus();
  });

  // Un trait glisse sous la rubrique en cours (barre du haut), ou à sa gauche (index des grands écrans).
  const bandeau = document.querySelector('.rubriques');
  const bande = bandeau.querySelector('ul');
  const curseur = document.createElement('li');
  curseur.className = 'rubriques__curseur sans-transition';
  curseur.setAttribute('aria-hidden', 'true');
  bande.prepend(curseur);

  const position = (a) => {
    const ra = a.getBoundingClientRect();
    const rb = bande.getBoundingClientRect();
    return {
      x: ra.left - rb.left - bande.clientLeft + bande.scrollLeft,
      y: ra.top - rb.top - bande.clientTop + bande.scrollTop,
    };
  };

  const placerCurseur = (a, sansTransition = false) => {
    if (!a) {
      curseur.style.opacity = '0';
      return;
    }
    if (sansTransition) curseur.classList.add('sans-transition');
    const { x, y } = position(a);
    curseur.style.setProperty('--x', `${x}px`);
    curseur.style.setProperty('--y', `${y}px`);
    curseur.style.setProperty('--sx', String(a.offsetWidth / 100));
    curseur.style.setProperty('--sy', String(a.offsetHeight / 100));
    curseur.style.opacity = '1';
    if (curseur.classList.contains('sans-transition')) {
      requestAnimationFrame(() => requestAnimationFrame(() => curseur.classList.remove('sans-transition')));
    }
  };

  // Rubrique en cours : la dernière dont le titre a passé le tiers haut de l'écran.
  let courante = null;
  let attente = false;
  const marquer = () => {
    attente = false;
    const seuil = window.innerHeight * 0.3;
    const visibles = rubriques.filter((r) => !r.hidden);
    const active = visibles.filter((r) => r.getBoundingClientRect().top <= seuil).at(-1) || visibles[0];
    if (!active) {
      courante = null;
      placerCurseur(null);
      return;
    }
    if (active === courante) return;
    courante = active;
    const lien = liens.get(active.id);
    placerCurseur(lien);
    liens.forEach((a, id) => {
      if (id === active.id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    // Dans la barre qui défile, la rubrique en cours revient au centre.
    if (lien && bande.scrollWidth > bande.clientWidth + 1) {
      const { x } = position(lien);
      bande.scrollTo({ left: x - bande.clientWidth / 2 + lien.offsetWidth / 2, behavior: reduit.matches ? 'auto' : 'smooth' });
    }
  };
  const planifier = () => {
    if (attente) return;
    attente = true;
    requestAnimationFrame(marquer);
  };
  window.addEventListener('scroll', planifier, { passive: true });
  window.addEventListener('resize', () => {
    if (courante) placerCurseur(liens.get(courante.id), true);
    planifier();
  });
  champ.addEventListener('input', () => {
    courante = null;
    planifier();
  });
  marquer();

  /* ---------- Votre commande ---------- */

  const CLE = 'asdc-bon-v1';
  const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const prix = (centimes) => euros.format(centimes / 100);

  const catalogue = new Map();
  plats.forEach((p) => catalogue.set(p.dataset.plat, { nom: p.dataset.nom, prix: Number(p.dataset.prix) }));
  document
    .querySelectorAll('[data-ajouter][data-nom]')
    .forEach((b) => catalogue.set(b.dataset.ajouter, { nom: b.dataset.nom, prix: Number(b.dataset.prix) }));

  const lire = () => {
    try {
      const brut = JSON.parse(localStorage.getItem(CLE) || '{}');
      return Object.fromEntries(Object.entries(brut).filter(([id, q]) => catalogue.has(id) && Number.isInteger(q) && q > 0));
    } catch {
      return {};
    }
  };
  const ecrire = () => {
    try {
      localStorage.setItem(CLE, JSON.stringify(bon));
    } catch {
      /* stockage indisponible : la commande vit le temps de la page */
    }
  };

  let bon = lire();

  const feuille = document.querySelector('[data-bon]');
  const lignes = document.querySelector('[data-bon-lignes]');
  const total = document.querySelector('[data-bon-total]');
  const bonVide = document.querySelector('[data-bon-vide]');
  const compteurs = document.querySelectorAll('[data-bon-compte]');
  const ouvrir = document.querySelector('[data-ouvrir-bon]');
  const vider = document.querySelector('[data-bon-vider]');
  const bureau = window.matchMedia('(min-width: 1069px)');

  const annonce = document.createElement('p');
  annonce.className = 'visuellement-cache';
  annonce.setAttribute('aria-live', 'polite');
  document.body.append(annonce);

  const icone = (nom) => `<svg class="icone" aria-hidden="true" focusable="false"><use href="#i-${nom}"/></svg>`;
  const echapper = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  const somme = () => Object.keys(bon).reduce((s, id) => s + catalogue.get(id).prix * bon[id], 0);

  // Met la commande à jour et renvoie les éléments dont le changement mérite une pulsation.
  const rendre = (changement, modifie = null, avant = 0) => {
    const ids = Object.keys(bon);
    const nombre = ids.reduce((s, id) => s + bon[id], 0);
    const aSecouer = [];

    lignes.innerHTML = ids
      .map((id) => {
        const nom = echapper(catalogue.get(id).nom);
        return `<li class="bon__ligne" data-ligne="${id}">
          <span class="bon__nom">${nom}</span>
          <span class="bon__montant">${prix(catalogue.get(id).prix * bon[id])}</span>
          <span class="bon__quantite">
            <button type="button" data-moins="${id}" aria-label="Retirer un : ${nom}">${icone('moins')}</button>
            <span class="bon__qte" aria-label="Quantité">${bon[id]}</span>
            <button type="button" data-plus="${id}" aria-label="Ajouter un : ${nom}">${icone('plus')}</button>
          </span>
        </li>`;
      })
      .join('');

    bonVide.hidden = nombre > 0;
    lignes.hidden = nombre === 0;
    const texteTotal = prix(somme());
    if (total.textContent !== texteTotal) {
      total.textContent = texteTotal;
      if (changement) aSecouer.push(total);
    }
    compteurs.forEach((c) => {
      const ancien = c.textContent;
      c.textContent = nombre;
      c.hidden = nombre === 0;
      if (changement && nombre && ancien !== String(nombre)) aSecouer.push(c);
    });
    vider.hidden = nombre === 0;

    if (modifie && bon[modifie]) {
      const ligne = lignes.querySelector(`[data-ligne="${modifie}"]`);
      if (!avant) ligne?.classList.add('vient-d-arriver');
      else if (ligne) aSecouer.push(ligne.querySelector('.bon__qte'));
    }

    document.querySelectorAll('[data-ajouter]').forEach((b) => {
      const q = bon[b.dataset.ajouter] || 0;
      b.classList.toggle('est-dans-bon', q > 0);
      if (q > 0) b.dataset.quantite = q;
      else delete b.dataset.quantite;
    });
    return aSecouer;
  };

  // Le jeton « +1 » vole du bouton jusqu'au total (grand écran) ou jusqu'au sac de la barre du bas.
  const voler = (depuis, apres) => {
    const cible = bureau.matches || feuille.classList.contains('est-ouvert') ? total : ouvrir?.querySelector('.icone');
    if (reduit.matches || !anime || !depuis || !cible) return apres();
    const a = depuis.getBoundingClientRect();
    const b = cible.getBoundingClientRect();
    if (!a.width || !b.width) return apres();
    const x0 = a.left + a.width / 2;
    const y0 = a.top + a.height / 2;
    const dx = b.left + b.width / 2 - x0;
    const dy = b.top + b.height / 2 - y0;
    const haut = Math.min(dy, 0) - 90;
    const jeton = document.createElement('span');
    jeton.className = 'jeton';
    jeton.textContent = '+1';
    jeton.setAttribute('aria-hidden', 'true');
    jeton.style.left = `${x0}px`;
    jeton.style.top = `${y0}px`;
    document.body.append(jeton);
    const images = Array.from({ length: 11 }, (_, k) => {
      const t = k / 10;
      const x = 2 * (1 - t) * t * (dx / 2) + t * t * dx;
      const y = 2 * (1 - t) * t * haut + t * t * dy;
      return { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(1 - 0.45 * t).toFixed(2)})`, opacity: Math.min(1, t * 6) };
    });
    jeton.animate(images, { duration: 620, easing: 'cubic-bezier(0.45, 0, 0.55, 1)' }).onfinish = () => {
      jeton.remove();
      apres();
    };
  };

  const annoncer = (id, q) => {
    const { nom } = catalogue.get(id);
    annonce.textContent = q ? `${nom} : ${q} dans votre commande. Total ${prix(somme())}.` : `${nom} retiré de votre commande.`;
  };

  const modifier = (id, delta, origine = null) => {
    const avant = bon[id] || 0;
    const q = Math.max(0, avant + delta);
    if (q) bon[id] = q;
    else delete bon[id];
    ecrire();
    annoncer(id, q);

    // Une ligne retirée s'efface avant de disparaître.
    const sortante = !q && lignes.querySelector(`[data-ligne="${id}"]`);
    if (sortante && anime && !reduit.matches) {
      const sortie = sortante.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateX(1rem)' }], {
        duration: 170,
        easing: 'ease-in',
        fill: 'forwards',
      });
      sortie.onfinish = () => secouer(rendre(true, id, avant));
      return;
    }

    const aSecouer = rendre(true, id, avant);
    if (!origine) return secouer(aSecouer);
    voler(origine, () => secouer(aSecouer));
  };

  // Sur mobile et tablette, la commande est une feuille : le reste de la page attend derrière.
  const derriere = () =>
    [navigation, document.querySelector('.ruban'), document.querySelector('.carte-tete'), bandeau, document.querySelector('.carte__liste'), document.querySelector('.pied'), document.querySelector('.barre-bon')].filter(Boolean);

  const basculer = (ouvert) => {
    if (bureau.matches || feuille.classList.contains('est-ouvert') === ouvert) return;
    feuille.classList.toggle('est-ouvert', ouvert);
    ouvrir?.setAttribute('aria-expanded', String(ouvert));
    derriere().forEach((el) => (el.inert = ouvert));
    const titre = feuille.querySelector('h2');
    if (ouvert) {
      titre.setAttribute('tabindex', '-1');
      titre.focus({ preventScroll: true });
    } else {
      ouvrir?.focus({ preventScroll: true });
    }
  };

  document.addEventListener('click', (e) => {
    if (e.target === feuille) return basculer(false);
    const cible = e.target.closest('[data-ajouter], [data-plus], [data-moins], [data-bon-vider], [data-ouvrir-bon], [data-fermer-bon]');
    if (!cible) return;
    if (cible.dataset.ajouter) modifier(cible.dataset.ajouter, 1, cible);
    else if (cible.dataset.plus) modifier(cible.dataset.plus, 1);
    else if (cible.dataset.moins) modifier(cible.dataset.moins, -1);
    else if (cible.hasAttribute('data-bon-vider')) {
      const vidage = () => {
        bon = {};
        ecrire();
        secouer(rendre(true));
        annonce.textContent = 'Commande vidée.';
      };
      if (!anime || reduit.matches || !lignes.children.length) return vidage();
      const fondu = lignes.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' });
      fondu.onfinish = () => {
        vidage();
        fondu.cancel();
      };
    } else if (cible.hasAttribute('data-ouvrir-bon')) basculer(!feuille.classList.contains('est-ouvert'));
    else if (cible.hasAttribute('data-fermer-bon')) basculer(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') basculer(false);
  });

  bureau.addEventListener('change', () => {
    feuille.classList.remove('est-ouvert');
    ouvrir?.setAttribute('aria-expanded', 'false');
    derriere().forEach((el) => (el.inert = false));
  });

  document.querySelectorAll('[data-ajouter]').forEach((b) => (b.hidden = false));
  feuille.hidden = false;
  if (ouvrir) ouvrir.hidden = false;
  rendre(false);
})();
