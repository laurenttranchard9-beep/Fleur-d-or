/* La Fleur d'Or : répartit les blocs des modèles de carte dans leurs colonnes.
   Chaque flux (formules, carte…) remplit ses colonnes dans l'ordre. Pour chaque échelle
   (--e pour les plats, --ef pour les formules), on cherche la plus grande taille où tous
   les flux qui l'utilisent tiennent, dans une limite pour garder une carte équilibrée. */
(function () {
  "use strict";

  var racine = document.documentElement;
  var etat = document.querySelector("[data-etat]");
  var apercu = document.querySelector("[data-apercu]");
  // Tailles maximales en points (réglables par modèle : data-max-e, data-max-ef)
  var MAX = { "--e": (+racine.getAttribute("data-max-e") || 14) / 9.5, "--ef": (+racine.getAttribute("data-max-ef") || 13) / 9.5 };
  var flux = {};

  Array.prototype.forEach.call(document.querySelectorAll("[data-reserve]"), function (r) {
    flux[r.getAttribute("data-reserve")] = {
      blocs: Array.prototype.slice.call(r.children),
      echelle: r.getAttribute("data-echelle"),
      colonnes: []
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-flux]"), function (c) {
    var p = c.getAttribute("data-flux").split(":");
    if (flux[p[0]]) flux[p[0]].colonnes.push({ el: c, n: +p[1] });
  });
  Object.keys(flux).forEach(function (k) {
    flux[k].colonnes = flux[k].colonnes.sort(function (a, b) { return a.n - b.n; }).map(function (c) { return c.el; });
  });

  function deborde(el) {
    return el.scrollHeight > el.clientHeight + 0.5;
  }

  function remplir(f) {
    f.colonnes.forEach(function (c) { c.textContent = ""; });
    var i = 0;
    for (var k = 0; k < f.colonnes.length; k++) {
      var c = f.colonnes[k];
      // Colonne où l'on arrive en tournant la page : la catégorie en cours y passe entière
      if (k > 0 && c.hasAttribute("data-sans-coupe")) {
        while (i < f.blocs.length && f.blocs[i].classList.contains("c-bloc-suite") && f.colonnes[k - 1].children.length > 1) {
          i--;
          f.colonnes[k - 1].removeChild(f.blocs[i]);
        }
      }
      while (i < f.blocs.length) {
        c.appendChild(f.blocs[i]);
        if (deborde(c)) {
          if (c.children.length === 1) return false;
          c.removeChild(f.blocs[i]);
          break;
        }
        i++;
      }
    }
    return i === f.blocs.length;
  }

  function essai(variable) {
    var liste = Object.keys(flux).map(function (k) { return flux[k]; }).filter(function (f) { return f.echelle === variable; });
    return function () {
      var ok = true;
      liste.forEach(function (f) { if (!remplir(f)) ok = false; });
      return ok;
    };
  }

  function chercher(variable, min, max) {
    var test = essai(variable);
    racine.style.setProperty(variable, String(max));
    if (test()) return max;
    var bon = null;
    for (var n = 0; n < 14; n++) {
      var milieu = (min + max) / 2;
      racine.style.setProperty(variable, String(milieu));
      if (test()) { bon = milieu; min = milieu; } else { max = milieu; }
    }
    if (bon !== null) {
      // La coupe entre colonnes change avec la taille : on essaie aussi un peu au-dessus
      var haut = bon;
      for (var v = bon + 0.004; v <= Math.min(bon * 1.08, MAX[variable]); v += 0.004) {
        racine.style.setProperty(variable, String(v));
        if (test()) haut = v;
      }
      bon = haut;
    }
    racine.style.setProperty(variable, String(bon === null ? min : bon));
    test();
    return bon;
  }

  function libre(c) {
    var dernier = c.lastElementChild;
    if (!dernier) return 0;
    var s = getComputedStyle(c);
    var bas = c.getBoundingClientRect().bottom - parseFloat(s.paddingBottom) - parseFloat(s.borderBottomWidth);
    return bas - dernier.getBoundingClientRect().bottom - parseFloat(getComputedStyle(dernier).marginBottom);
  }

  /** Répartit l'espace libre d'une colonne entre ses blocs (sans écarter une liste coupée). */
  function respirer(c, plafond) {
    var blocs = Array.prototype.filter.call(c.children, function (b, i) {
      return i > 0 && b.classList.contains("c-bloc") && !b.classList.contains("c-bloc-coupe");
    });
    c.style.setProperty("--respire", "0px");
    var place = libre(c);
    if (!blocs.length || place <= 0) return;
    c.style.setProperty("--respire", Math.min(place / blocs.length, plafond) + "px");
    if (deborde(c) || libre(c) < 0) c.style.setProperty("--respire", "0px");
  }

  function miseEnPage() {
    var mm = 96 / 25.4;
    var e = chercher("--e", 0.7, MAX["--e"]);
    var ef = chercher("--ef", 0.6, MAX["--ef"]);
    Object.keys(flux).forEach(function (k) {
      flux[k].colonnes.forEach(function (c) { respirer(c, (flux[k].echelle === "--ef" ? 5 : 8) * mm); });
    });
    var erreur = e === null || ef === null;
    if (etat) {
      etat.textContent = erreur
        ? "Attention : la carte est trop longue pour ce modèle. Raccourcissez-la dans le panneau."
        : "Prêt · plats en " + (9.5 * e).toFixed(1).replace(".", ",") + " pt, formules en " + (9.5 * ef).toFixed(1).replace(".", ",") + " pt.";
    }
    ajusterApercu();
    racine.setAttribute("data-pret", erreur ? "erreur" : "1");
  }

  function ajusterApercu() {
    if (!apercu || window.matchMedia("print").matches) return;
    var page = apercu.querySelector(".m-page");
    var largeur = page.offsetWidth;
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

  document.fonts.ready.then(miseEnPage);
})();
