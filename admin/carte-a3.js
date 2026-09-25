/* La Fleur d'Or : répartit la carte sur les volets de la carte A3.
   Cherche la plus grande taille de texte où tout tient, puis répartit l'espace restant. */
(function () {
  "use strict";

  var racine = document.documentElement;
  var etat = document.querySelector("[data-etat]");
  var reserve = document.querySelector("[data-reserve]");
  var reserveF = document.querySelector("[data-reserve-formules]");
  var ardoise = document.querySelector("[data-formules]");
  var formules = Array.prototype.slice.call(reserveF.children);
  var flux = Array.prototype.slice.call(document.querySelectorAll("[data-flux]"))
    .sort(function (a, b) { return +a.getAttribute("data-flux") - +b.getAttribute("data-flux"); });
  var blocs = Array.prototype.slice.call(reserve.children);
  var apercu = document.querySelector("[data-apercu]");

  function deborde(el) {
    return el.scrollHeight > el.clientHeight + 0.5;
  }

  function remplir() {
    flux.forEach(function (f) { f.textContent = ""; });
    var i = 0;
    for (var k = 0; k < flux.length; k++) {
      var f = flux[k];
      // Rabat et dos : une catégorie n'y est jamais coupée, elle passe entière au volet suivant
      if (k > 0 && f.hasAttribute("data-sans-coupe")) {
        while (i < blocs.length && blocs[i].classList.contains("c-bloc-suite") && flux[k - 1].children.length > 1) {
          i--;
          flux[k - 1].removeChild(blocs[i]);
        }
      }
      while (i < blocs.length) {
        f.appendChild(blocs[i]);
        if (deborde(f)) {
          if (f.children.length === 1) return false;
          f.removeChild(blocs[i]);
          break;
        }
        i++;
      }
    }
    return i === blocs.length;
  }

  function chercher(variable, essai, min, max) {
    var bon = null;
    for (var n = 0; n < 14; n++) {
      var milieu = (min + max) / 2;
      racine.style.setProperty(variable, String(milieu));
      if (essai()) {
        bon = milieu;
        min = milieu;
      } else {
        max = milieu;
      }
    }
    racine.style.setProperty(variable, String(bon === null ? min : bon));
    essai();
    return bon;
  }

  /**
   * La coupe entre volets change avec la taille : une taille un peu plus grande peut tenir
   * alors qu'une plus petite ne tient pas. On essaie donc aussi, pas à pas, au-dessus du résultat.
   */
  function affiner(variable, essai, depart) {
    if (depart === null) return null;
    var bon = depart;
    for (var v = depart + 0.004; v <= depart * 1.12; v += 0.004) {
      racine.style.setProperty(variable, String(v));
      if (essai()) bon = v;
    }
    racine.style.setProperty(variable, String(bon));
    essai();
    return bon;
  }

  /** Espace vide sous le dernier élément d'un conteneur. */
  function libre(conteneur) {
    var dernier = conteneur.lastElementChild;
    if (!dernier) return 0;
    var s = getComputedStyle(conteneur);
    var bas = conteneur.getBoundingClientRect().bottom - parseFloat(s.paddingBottom) - parseFloat(s.borderBottomWidth);
    return bas - dernier.getBoundingClientRect().bottom - parseFloat(getComputedStyle(dernier).marginBottom);
  }

  /** Répartit l'espace libre d'un volet entre ses blocs, sans dépasser un écart raisonnable. */
  function respirer(conteneur, selecteur, variable, plafond) {
    // Les écarts vont au-dessus de chaque bloc, sauf le premier du volet
    var n = Array.prototype.filter.call(conteneur.querySelectorAll(selecteur), function (b) {
      return b !== conteneur.firstElementChild;
    }).length;
    conteneur.style.setProperty(variable, "0px");
    var place = libre(conteneur);
    if (n < 1 || place <= 0) return;
    conteneur.style.setProperty(variable, Math.min(place / n, plafond) + "px");
    if (deborde(conteneur) || libre(conteneur) < 0) conteneur.style.setProperty(variable, "0px");
  }

  function miseEnPage() {
    var mm = 96 / 25.4;
    var e = affiner("--e", remplir, chercher("--e", remplir, 0.7, 1.4));
    var ef = chercher("--ef", function () {
      ardoise.textContent = "";
      formules.forEach(function (f) { ardoise.appendChild(f); });
      return !deborde(ardoise);
    }, 0.6, 1.4);
    respirer(ardoise, ".c-bloc-formule", "--respire", 3 * mm);
    flux.forEach(function (f) { respirer(f, ".c-bloc:not(.c-bloc-coupe)", "--respire", 7 * mm); });

    var restant = reserve.children.length + (ef === null ? 1 : 0);
    if (etat) {
      etat.textContent = restant || e === null
        ? "Attention : la carte est trop longue pour tenir sur les volets. Raccourcissez-la dans le panneau."
        : "Prêt · plats en " + (9.5 * e).toFixed(1).replace(".", ",") + " pt, formules en " + (9.5 * ef).toFixed(1).replace(".", ",") + " pt.";
    }
    ajusterApercu();
    racine.setAttribute("data-pret", restant || e === null ? "erreur" : "1");
  }

  function ajusterApercu() {
    if (!apercu || window.matchMedia("print").matches) return;
    var feuille = apercu.querySelector(".c-feuille");
    var largeur = feuille.offsetWidth;
    var z = Math.min(1, (document.documentElement.clientWidth - 40) / largeur);
    apercu.style.transform = "scale(" + z + ")";
    apercu.style.height = apercu.scrollHeight * z + "px";
    apercu.style.width = largeur + "px";
  }

  var bouton = document.querySelector("[data-imprimer]");
  if (bouton) bouton.addEventListener("click", function () { window.print(); });
  window.addEventListener("resize", function () {
    apercu.style.transform = "";
    apercu.style.height = "";
    ajusterApercu();
  });

  var images = Array.prototype.map.call(document.images, function (img) {
    return img.complete ? Promise.resolve() : new Promise(function (ok) { img.onload = img.onerror = ok; });
  });
  Promise.all([document.fonts.ready].concat(images)).then(miseEnPage);
})();
