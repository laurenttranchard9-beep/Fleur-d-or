/* Espace gestion : compteur des prix modifiés, filtre des plats, alerte avant de quitter sans enregistrer. */
(() => {
  'use strict';

  const formulaire = document.querySelector('[data-formulaire-prix]');
  if (!formulaire) return;

  const champs = [...formulaire.querySelectorAll('input[data-actuel]')];
  const compte = formulaire.querySelector('[data-compte]');
  const bouton = formulaire.querySelector('button[type="submit"]');
  const normaliserPrix = (v) => v.trim().split(' ').join('').replace('€', '').replace('.', ',');
  let envoi = false;

  const actualiser = () => {
    let n = 0;
    for (const champ of champs) {
      const change = normaliserPrix(champ.value) !== normaliserPrix(champ.dataset.actuel);
      champ.closest('.g-plat').classList.toggle('est-change', change);
      if (change) n += 1;
    }
    compte.textContent = n === 0 ? 'Aucun prix modifié' : n === 1 ? '1 prix modifié' : `${n} prix modifiés`;
    bouton.disabled = n === 0 && !formulaire.querySelector('[aria-invalid="true"]');
    return n;
  };

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
    });
  }
})();
