/* Aux Saveurs du Cambodge — état d'ouverture en direct, barre d'actions, recherche, bon de commande et mouvement. */
(() => {
  'use strict';

  const source = document.getElementById('donnees-site');
  if (!source) return;
  const donnees = JSON.parse(source.textContent);

  const NBSP = '\u00a0';
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)');
  const anime = Boolean(document.body.animate);
  const sousLaLigne = (el) => el.getBoundingClientRect().top > window.innerHeight;

  // Exécute une seule fois quand l'élément entre dans l'écran.
  const quandVisible = (el, faire, seuil = 0.3) => {
    if (!('IntersectionObserver' in window)) return faire();
    const io = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((e) => e.isIntersecting)) return;
        io.disconnect();
        faire();
      },
      { threshold: seuil },
    );
    io.observe(el);
  };

  // Relance une animation CSS de retour d'action (classe vient-de-changer).
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

  // L'étiquette d'état se retourne comme la pancarte « ouvert / fermé » d'une boutique.
  const PANCARTE = 'perspective(32rem) rotateY';
  const retourner = (el, maj) => {
    if (!anime) return maj();
    if (reduit.matches) {
      maj();
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });
      return;
    }
    const montrer = () =>
      el.animate([{ transform: `${PANCARTE}(-90deg)` }, { transform: `${PANCARTE}(0deg)` }], {
        duration: 380,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      });
    if (el.hidden) {
      maj();
      montrer();
      return;
    }
    const demi = el.animate([{ transform: `${PANCARTE}(0deg)` }, { transform: `${PANCARTE}(90deg)` }], {
      duration: 170,
      easing: 'cubic-bezier(0.5, 0, 0.9, 0.5)',
      fill: 'forwards',
    });
    demi.onfinish = () => {
      maj();
      montrer();
      demi.cancel();
    };
  };

  // Le jour courant est entouré à la main, d'un trait de marqueur qui se referme en dépassant.
  const CERCLE =
    '<svg class="cercle-main" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    '<path pathLength="1" d="M15 8C35 1 79 1 93 11C104 19 96 34 69 37C43 40 11 38 5 27C0 17 13 7 33 5"/></svg>';
  const entourer = (tr) => {
    const jour = tr.querySelector('.semaine__jour');
    if (!jour || jour.querySelector('.cercle-main')) return;
    jour.insertAdjacentHTML('beforeend', CERCLE);
    const cercle = jour.lastElementChild;
    if (reduit.matches) return;
    cercle.classList.add('est-pret');
    quandVisible(tr.closest('table'), () => requestAnimationFrame(() => cercle.classList.remove('est-pret')), 0.6);
  };

  const afficherHoraires = () => {
    const t = maintenant();
    const e = calculer(t);
    document.querySelectorAll('[data-etat]').forEach((el) => {
      const texte = el.dataset.etat === 'compact' ? e.court : e.texte;
      const zone = el.querySelector('.etat__texte');
      if (!el.hidden && el.dataset.code === e.code && zone.textContent === texte) return;
      retourner(el, () => {
        el.dataset.code = e.code;
        zone.textContent = texte;
        el.hidden = false;
      });
    });
    const astuce = conseil(t);
    document.querySelectorAll('[data-conseil]').forEach((el) => {
      const apparait = el.hidden && astuce;
      el.textContent = astuce;
      el.hidden = !astuce;
      if (apparait && anime) {
        el.animate([{ opacity: 0, transform: reduit.matches ? 'none' : 'translateY(0.4rem)' }, { opacity: 1, transform: 'none' }], {
          duration: 420,
          delay: 200,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'backwards',
        });
      }
    });
    document.querySelectorAll('.semaine tr[data-jour]').forEach((tr) => {
      const estAujourdhui = Number(tr.dataset.jour) === t.jour;
      tr.classList.toggle('est-aujourdhui', estAujourdhui);
      if (estAujourdhui) {
        tr.setAttribute('aria-current', 'date');
        entourer(tr);
      } else {
        tr.removeAttribute('aria-current');
        tr.querySelector('.cercle-main')?.remove();
      }
    });
  };

  afficherHoraires();
  setInterval(afficherHoraires, 60 * 1000);

  /* ---------- Accueil : les saveurs se posent, le tampon frappe ---------- */

  const armer = (el, pret, faire, seuil) => {
    if (!el || reduit.matches || !('IntersectionObserver' in window) || !sousLaLigne(el)) return;
    el.classList.add(pret);
    quandVisible(el, faire, seuil);
  };

  const saveurs = document.querySelector('.saveurs__liste');
  armer(saveurs, 'est-pret', () => saveurs.classList.remove('est-pret'), 0.25);

  const promesse = document.querySelector('.promesse');
  armer(
    promesse,
    'est-pret',
    () => {
      promesse.classList.remove('est-pret');
      promesse.classList.add('est-tamponne');
    },
    0.7,
  );

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
      .replace(/[\u0300-\u036f]/g, '')
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

  // Un curseur glisse sous la rubrique en cours, dans la bande (mobile) comme dans l'index (bureau).
  const bandeau = document.querySelector('.rubriques');
  const curseur = document.createElement('li');
  curseur.className = 'rubriques__curseur sans-transition';
  curseur.setAttribute('aria-hidden', 'true');
  bandeau.querySelector('ul').prepend(curseur);
  bandeau.classList.add('a-curseur');

  const placerCurseur = (a, sansTransition = false) => {
    if (!a) {
      curseur.style.opacity = '0';
      return;
    }
    if (sansTransition) curseur.classList.add('sans-transition');
    const li = a.parentElement;
    curseur.style.translate = `${li.offsetLeft + a.offsetLeft}px ${li.offsetTop + a.offsetTop}px`;
    curseur.style.width = `${a.offsetWidth}px`;
    curseur.style.height = `${a.offsetHeight}px`;
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
    placerCurseur(liens.get(active.id));
    liens.forEach((a, id) => {
      if (id !== active.id) {
        a.removeAttribute('aria-current');
        return;
      }
      a.setAttribute('aria-current', 'true');
      // Les puces sont positionnées : la position dans la bande se lit sur le <li>.
      const bande = a.closest('ul');
      if (bande && bande.scrollWidth > bande.clientWidth) {
        const gauche = a.parentElement.offsetLeft + a.offsetLeft;
        bande.scrollTo({ left: gauche - bande.clientWidth / 2 + a.clientWidth / 2, behavior: reduit.matches ? 'auto' : 'smooth' });
      }
    });
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

  const somme = () => Object.keys(bon).reduce((s, id) => s + catalogue.get(id).prix * bon[id], 0);

  // Met le bon à jour et renvoie les éléments dont le changement mérite un petit signe.
  const rendre = (changement, modifie = null, avant = 0) => {
    const ids = Object.keys(bon);
    const nombre = ids.reduce((s, id) => s + bon[id], 0);
    const aSecouer = [];

    lignes.innerHTML = ids
      .map((id) => {
        const { prix: p } = catalogue.get(id);
        const nom = echapper(catalogue.get(id).nom);
        return `<li class="bon__ligne" data-ligne="${id}">
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
    const texteTotal = prix(somme());
    if (total.textContent !== texteTotal) {
      total.textContent = texteTotal;
      if (changement) aSecouer.push(total);
    }
    compteurs.forEach((c) => {
      const ancien = c.textContent;
      c.textContent = nombre;
      c.hidden = nombre === 0;
      if (changement && ancien !== String(nombre)) aSecouer.push(c);
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
      b.closest('.plat')?.classList.toggle('est-dans-bon', q > 0);
      if (q > 0) b.dataset.quantite = q;
      else delete b.dataset.quantite;
      if (changement && q > 0 && b.dataset.ajouter === modifie) aSecouer.push(b);
    });
    return aSecouer;
  };

  // Le jeton « +1 » vole du bouton jusqu'au bon (ou jusqu'au bouton « Mon bon » sur mobile), en parabole.
  const voler = (depuis, apres) => {
    const cible = bureau.matches || feuille.classList.contains('est-ouvert') ? total : ouvrir;
    if (reduit.matches || !anime || !depuis || !cible) return apres();
    const a = depuis.getBoundingClientRect();
    const b = cible.getBoundingClientRect();
    if (!a.width || !b.width) return apres();
    const x0 = a.left + a.width / 2;
    const y0 = a.top + a.height / 2;
    const dx = b.left + b.width / 2 - x0;
    const dy = b.top + b.height / 2 - y0;
    const haut = Math.min(dy, 0) - 110;
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
      return { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(1 - 0.5 * t).toFixed(2)})`, opacity: Math.min(1, t * 6) };
    });
    jeton.animate(images, { duration: 640, easing: 'cubic-bezier(0.45, 0, 0.55, 1)' }).onfinish = () => {
      jeton.remove();
      apres();
    };
  };

  const annoncer = (id, q) => {
    const { nom } = catalogue.get(id);
    annonce.textContent = q ? `${nom} : ${q} au bon. Total ${prix(somme())}.` : `${nom} retiré du bon.`;
  };

  const modifier = (id, delta, origine = null) => {
    const avant = bon[id] || 0;
    const q = Math.max(0, avant + delta);
    if (q) bon[id] = q;
    else delete bon[id];
    ecrire();
    annoncer(id, q);

    // Une ligne retirée glisse hors du bon avant de disparaître.
    const sortante = !q && lignes.querySelector(`[data-ligne="${id}"]`);
    if (sortante && anime && !reduit.matches) {
      const sortie = sortante.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateX(1.5rem)' }], {
        duration: 170,
        easing: 'ease-in',
        fill: 'forwards',
      });
      sortie.onfinish = () => secouer(rendre(true, id, avant));
      return;
    }

    const aSecouer = rendre(true, id, avant);
    if (!origine) return secouer(aSecouer);
    secouer(aSecouer.filter((el) => el === origine));
    voler(origine, () => secouer(aSecouer.filter((el) => el !== origine)));
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
    if (cible.dataset.ajouter) modifier(cible.dataset.ajouter, 1, cible);
    else if (cible.dataset.plus) modifier(cible.dataset.plus, 1);
    else if (cible.dataset.moins) modifier(cible.dataset.moins, -1);
    else if (cible.hasAttribute('data-bon-vider')) {
      const vidage = () => {
        bon = {};
        ecrire();
        secouer(rendre(true));
        annonce.textContent = 'Bon de commande vidé.';
      };
      if (!anime || reduit.matches || !lignes.children.length) return vidage();
      lignes.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' }).onfinish = (e) => {
        vidage();
        e.target.cancel();
      };
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
