/* Espace gestion, la carte : compteur des modifications, « Rétablir », descriptions sur une ligne qui s'allongent,
   filtre des plats, alerte avant de quitter sans enregistrer. */
(() => {
  'use strict';

  const formulaire = document.querySelector('[data-formulaire-prix]');
  if (!formulaire) return;

  const champs = [...formulaire.querySelectorAll('[data-actuel]')];
  const compte = formulaire.querySelector('[data-compte]');
  const bouton = formulaire.querySelector('button[type="submit"]');
  // Un prix se compare sans espaces ni « € », virgule ou point ; un texte, sur une ligne aux espaces simples.
  const normaliserPrix = (v) => v.trim().split(' ').join('').replace('€', '').replace('.', ',');
  const ESPACES = [13, 10, 9, 0xa0, 0x202f].map((code) => String.fromCharCode(code));
  const normaliserTexte = (v) =>
    ESPACES.reduce((texte, espace) => texte.split(espace).join(' '), v)
      .split(' ')
      .filter(Boolean)
      .join(' ');
  const pareil = (champ) =>
    champ.dataset.genre === 'prix'
      ? normaliserPrix(champ.value) === normaliserPrix(champ.dataset.actuel)
      : normaliserTexte(champ.value) === normaliserTexte(champ.dataset.actuel);
  let envoi = false;

  const actualiser = () => {
    let n = 0;
    for (const champ of champs) {
      const change = !pareil(champ);
      champ.classList.toggle('est-change', change);
      if (change) n += 1;
    }
    compte.textContent = n === 0 ? 'Aucune modification' : n === 1 ? '1 modification' : `${n} modifications`;
    bouton.disabled = n === 0 && !formulaire.querySelector('[aria-invalid="true"]');
    return n;
  };

  // Les descriptions tiennent sur une ligne et s'allongent avec le texte (sans « field-sizing », on mesure).
  const descriptions = [...formulaire.querySelectorAll('textarea')];
  const ajuste = window.CSS && CSS.supports && CSS.supports('field-sizing', 'content');
  const ajuster = (zone) => {
    if (ajuste) return;
    zone.style.height = 'auto';
    zone.style.height = `${zone.scrollHeight + 2}px`;
  };
  descriptions.forEach((zone) => {
    ajuster(zone);
    zone.addEventListener('input', () => ajuster(zone));
    // Une description est un seul paragraphe : Entrée ne fait pas de retour à la ligne.
    zone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') e.preventDefault();
    });
  });

  // « Rétablir » remet le prix, la description ou le nom d'origine dans son champ.
  formulaire.querySelectorAll('[data-retablir]').forEach((lien) => {
    lien.hidden = false;
    lien.addEventListener('click', () => {
      const champ = document.getElementById(lien.dataset.retablir);
      if (!champ) return;
      champ.value = lien.dataset.valeur;
      champ.dispatchEvent(new Event('input', { bubbles: true }));
      champ.focus();
    });
  });

  formulaire.addEventListener('input', actualiser);
  formulaire.addEventListener('submit', () => {
    envoi = true;
  });
  window.addEventListener('beforeunload', (e) => {
    if (envoi || actualiser() === 0) return;
    e.preventDefault();
    e.returnValue = '';
  });
  actualiser();

  // Filtre : sans accents ni majuscules, sur le nom et la description.
  const zone = document.querySelector('[data-filtre-zone]');
  const filtre = document.querySelector('[data-filtre]');
  const vide = formulaire.querySelector('[data-filtre-vide]');
  const sansAccents = (s) =>
    [...s.toLowerCase().normalize('NFD')]
      .filter((c) => {
        const code = c.charCodeAt(0);
        return code < 0x300 || code > 0x36f;
      })
      .join('')
      .replace(/œ/g, 'oe');
  if (zone && filtre) {
    zone.hidden = false;
    filtre.addEventListener('input', () => {
      const mots = sansAccents(filtre.value).split(' ').filter(Boolean);
      let visibles = 0;
      for (const rubrique of formulaire.querySelectorAll('[data-rubrique-prix]')) {
        let dans = 0;
        for (const plat of rubrique.querySelectorAll('[data-plat-prix]')) {
          const ok = mots.every((m) => plat.dataset.platPrix.includes(m));
          plat.hidden = !ok;
          if (ok) dans += 1;
        }
        rubrique.hidden = dans === 0;
        visibles += dans;
      }
      vide.hidden = visibles > 0;
      descriptions.forEach(ajuster);
    });
  }
})();
