/* Aux Saveurs du Cambodge — état d'ouverture en direct, barre d'actions, recherche et bon de commande. */
(() => {
  'use strict';

  const source = document.getElementById('donnees-site');
  if (!source) return;
  const donnees = JSON.parse(source.textContent);

  const NBSP = ' ';
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

  const calculer = (t) => {
    const ferie = fermeture(t.iso);
    if (ferie) {
      const suite = prochainService({ ...t, min: 24 * 60 });
      return {
        code: 'ferme',
        court: 'Fermé',
        texte: `Fermé aujourd’hui${ferie.label ? ` (${ferie.label})` : ''}${suite ? ` · ${suite}` : ''}`,
      };
    }
    for (const [debut, fin] of services(t.jour)) {
      if (t.min >= debut && t.min < fin) {
        return {
          code: 'ouvert',
          court: 'Ouvert',
          texte: `Ouvert · ${debut < 15 * 60 ? 'service du midi' : 'service du soir'} jusqu’à ${heure(fin)}`,
        };
      }
    }
    if (midiSurCommande(t.jour) && t.min >= 11 * 60 && t.min < 14 * 60) {
      const soir = services(t.jour)[0];
      return {
        code: 'commande',
        court: 'Midi sur commande',
        texte: `Midi sur commande passée la veille${soir ? ` · ouvert ce soir à ${heure(soir[0])}` : ''}`,
      };
    }
    return { code: 'ferme', court: 'Fermé', texte: `Fermé · ${prochainService(t)}` };
  };

  // Le midi du week-end se commande la veille : on le rappelle le jour d'avant, tant que c'est ouvert.
  const conseil = (t) => {
    const demain = (t.jour + 1) % 7;
    if (!midiSurCommande(demain) || fermeture(t.iso) || fermeture(isoPlus(t.iso, 1))) return '';
    const dernier = services(t.jour).at(-1);
    if (!dernier || t.min >= dernier[1]) return '';
    return `Envie de déjeuner ${JOURS[demain]} midi\u202f? Commandez aujourd’hui, avant ${heure(dernier[1])}.`;
  };

  const afficherHoraires = () => {
    const t = maintenant();
    const e = calculer(t);
    document.querySelectorAll('[data-etat]').forEach((el) => {
      el.dataset.code = e.code;
      el.querySelector('.etat__texte').textContent = el.dataset.etat === 'compact' ? e.court : e.texte;
      el.hidden = false;
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
  };

  afficherHoraires();
  setInterval(afficherHoraires, 60 * 1000);

  /* ---------- Barre d'actions mobile (accueil) ---------- */

  const barre = document.querySelector('[data-barre]');
  const actionsHeros = document.querySelector('[data-actions-heros]');
  if (barre && actionsHeros) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entree]) => {
        barre.classList.toggle('est-visible', !entree.isIntersecting && entree.boundingClientRect.top < 0);
      }).observe(actionsHeros);
    } else {
      barre.classList.add('est-visible');
    }
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

  const normaliser = (s) =>
    s
      .toLowerCase()
      .replace(/œ/g, 'oe')
      .replace(/æ/g, 'ae')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[’']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

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
      liens.get(r.id)?.classList.toggle('est-vide', !visible);
    }
    vide.hidden = trouves > 0;
    terme.textContent = brut;
    etatRecherche.textContent = mots.length && trouves ? `${trouves} plat${trouves > 1 ? 's' : ''} pour « ${brut} »` : '';
  };

  champ.addEventListener('input', filtrer);
  document.querySelector('[data-effacer]')?.addEventListener('click', () => {
    champ.value = '';
    filtrer();
    champ.focus();
  });

  // Rubrique en cours : la dernière dont le titre a passé le tiers haut de l'écran.
  let courante = null;
  let attente = false;
  const marquer = () => {
    attente = false;
    const seuil = window.innerHeight * 0.3;
    const visibles = rubriques.filter((r) => !r.hidden);
    const active = visibles.filter((r) => r.getBoundingClientRect().top <= seuil).at(-1) || visibles[0];
    if (!active || active === courante) return;
    courante = active;
    liens.forEach((a, id) => {
      if (id !== active.id) {
        a.removeAttribute('aria-current');
        return;
      }
      a.setAttribute('aria-current', 'true');
      const bande = a.closest('ul');
      if (bande && bande.scrollWidth > bande.clientWidth) {
        bande.scrollTo({ left: a.offsetLeft - bande.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
      }
    });
  };
  const planifier = () => {
    if (attente) return;
    attente = true;
    requestAnimationFrame(marquer);
  };
  window.addEventListener('scroll', planifier, { passive: true });
  window.addEventListener('resize', planifier);
  champ.addEventListener('input', planifier);
  marquer();

  /* ---------- Bon de commande ---------- */

  const CLE = 'asdc-bon-v1';
  const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const prix = (centimes) => euros.format(centimes / 100);

  const catalogue = new Map();
  plats.forEach((p) => catalogue.set(p.dataset.plat, { nom: p.dataset.nom, prix: Number(p.dataset.prix) }));
  document.querySelectorAll('[data-ajouter][data-nom]').forEach((b) =>
    catalogue.set(b.dataset.ajouter, { nom: b.dataset.nom, prix: Number(b.dataset.prix) }),
  );

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
      /* stockage indisponible : le bon vit le temps de la page */
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
  const bureau = window.matchMedia('(min-width: 72rem)');

  const annonce = document.createElement('p');
  annonce.className = 'visuellement-cache';
  annonce.setAttribute('aria-live', 'polite');
  document.body.append(annonce);

  const icone = (nom) => `<svg class="icone" aria-hidden="true" focusable="false"><use href="#i-${nom}"/></svg>`;
  const echapper = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  const rendre = (changement) => {
    const ids = Object.keys(bon);
    const somme = ids.reduce((s, id) => s + catalogue.get(id).prix * bon[id], 0);
    const nombre = ids.reduce((s, id) => s + bon[id], 0);

    lignes.innerHTML = ids
      .map((id) => {
        const { prix: p } = catalogue.get(id);
        const nom = echapper(catalogue.get(id).nom);
        return `<li class="bon__ligne">
          <span class="bon__nom">${nom}</span>
          <span class="bon__montant">${prix(p * bon[id])}</span>
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
    const texteTotal = prix(somme);
    if (total.textContent !== texteTotal) {
      total.textContent = texteTotal;
      if (changement) {
        total.classList.remove('vient-de-changer');
        void total.offsetWidth;
        total.classList.add('vient-de-changer');
      }
    }
    compteurs.forEach((c) => {
      const avant = c.textContent;
      c.textContent = nombre;
      c.hidden = nombre === 0;
      if (changement && avant !== String(nombre)) {
        c.classList.remove('vient-de-changer');
        void c.offsetWidth;
        c.classList.add('vient-de-changer');
      }
    });
    vider.hidden = nombre === 0;

    document.querySelectorAll('[data-ajouter]').forEach((b) => {
      const q = bon[b.dataset.ajouter] || 0;
      b.classList.toggle('est-dans-bon', q > 0);
      b.closest('.plat')?.classList.toggle('est-dans-bon', q > 0);
      if (q > 0) b.dataset.quantite = q;
      else delete b.dataset.quantite;
    });
  };

  const modifier = (id, delta) => {
    const q = Math.max(0, (bon[id] || 0) + delta);
    if (q) bon[id] = q;
    else delete bon[id];
    ecrire();
    rendre(true);
    const { nom } = catalogue.get(id);
    annonce.textContent = q ? `${nom} : ${q} au bon. Total ${total.textContent}.` : `${nom} retiré du bon.`;
  };

  const basculer = (ouvert) => {
    if (bureau.matches) return;
    feuille.classList.toggle('est-ouvert', ouvert);
    ouvrir?.setAttribute('aria-expanded', String(ouvert));
    if (ouvert) {
      feuille.querySelector('h2').setAttribute('tabindex', '-1');
      feuille.querySelector('h2').focus({ preventScroll: true });
    } else {
      ouvrir?.focus({ preventScroll: true });
    }
  };

  document.addEventListener('click', (e) => {
    const cible = e.target.closest('[data-ajouter], [data-plus], [data-moins], [data-bon-vider], [data-ouvrir-bon], [data-fermer-bon]');
    if (!cible) return;
    if (cible.dataset.ajouter) modifier(cible.dataset.ajouter, 1);
    else if (cible.dataset.plus) modifier(cible.dataset.plus, 1);
    else if (cible.dataset.moins) modifier(cible.dataset.moins, -1);
    else if (cible.hasAttribute('data-bon-vider')) {
      bon = {};
      ecrire();
      rendre(true);
      annonce.textContent = 'Bon de commande vidé.';
    } else if (cible.hasAttribute('data-ouvrir-bon')) basculer(!feuille.classList.contains('est-ouvert'));
    else if (cible.hasAttribute('data-fermer-bon')) basculer(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && feuille.classList.contains('est-ouvert')) basculer(false);
  });

  bureau.addEventListener('change', () => {
    feuille.classList.remove('est-ouvert');
    ouvrir?.setAttribute('aria-expanded', 'false');
  });

  document.querySelectorAll('[data-ajouter]').forEach((b) => (b.hidden = false));
  feuille.hidden = false;
  if (ouvrir) ouvrir.hidden = false;
  rendre(false);
})();
