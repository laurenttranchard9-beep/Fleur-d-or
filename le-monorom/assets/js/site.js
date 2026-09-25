/* Le Monorom : statut en direct, recherche dans la carte, rubriques, liste de commande. */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Ouvert ou fermé (heure de Paris) ---------- */
  // Minutes depuis minuit, par jour (0 = dimanche). Du mardi au dimanche 10h-14h et 18h-22h ; lundi : fermé.
  var SERVICES = {
    0: [[600, 840], [1080, 1320]],
    1: [],
    2: [[600, 840], [1080, 1320]],
    3: [[600, 840], [1080, 1320]],
    4: [[600, 840], [1080, 1320]],
    5: [[600, 840], [1080, 1320]],
    6: [[600, 840], [1080, 1320]]
  };
  var JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

  function maintenant() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
      }).formatToParts(new Date());
      var get = function (t) { return parts.filter(function (p) { return p.type === t; })[0].value; };
      var jour = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[get("weekday")];
      return { jour: jour, min: (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute"), 10) };
    } catch (e) {
      var d = new Date();
      return { jour: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function heure(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return h + "h" + (m ? String(m).padStart(2, "0") : "");
  }

  function statut() {
    var t = maintenant();
    var aujourdhui = SERVICES[t.jour];
    for (var i = 0; i < aujourdhui.length; i++) {
      if (t.min >= aujourdhui[i][0] && t.min < aujourdhui[i][1]) {
        return { ouvert: true, jour: t.jour, fin: aujourdhui[i][1] };
      }
    }
    for (var d = 0; d < 8; d++) {
      var j = (t.jour + d) % 7;
      var services = SERVICES[j];
      for (var k = 0; k < services.length; k++) {
        if (d === 0 && services[k][0] <= t.min) continue;
        return { ouvert: false, jour: t.jour, dans: d, jourSuivant: j, debut: services[k][0] };
      }
    }
    return null;
  }

  function afficherStatut() {
    var s = statut();
    var bloc = $("[data-statut]");
    var texte = $("[data-statut-texte]");
    var halle = $("[data-halle]");
    if (!s || !bloc) return;
    var ligne = $('.horaires tr[data-jour="' + s.jour + '"]');
    $$(".horaires tr.aujourdhui").forEach(function (tr) { tr.classList.remove("aujourdhui"); });
    if (ligne) ligne.classList.add("aujourdhui");

    if (s.ouvert) {
      bloc.setAttribute("data-etat", "ouvert");
      texte.innerHTML = "<strong>Ouvert</strong> · service jusqu’à " + heure(s.fin);
      if (halle) halle.removeAttribute("data-ferme");
      return;
    }
    var quand = s.dans === 0 ? "aujourd’hui" : s.dans === 1 ? "demain" : JOURS[s.jourSuivant];
    bloc.setAttribute("data-etat", "ferme");
    texte.innerHTML = "<strong>Fermé</strong> pour le moment · ouverture " + quand + " à " + heure(s.debut);
    if (halle) {
      halle.setAttribute("data-ferme", "");
      var mot = s.dans === 0 ? "Ouverture à " + heure(s.debut) : "Ouverture " + quand + " " + heure(s.debut);
      $$(".volet-texte", halle).forEach(function (v, i) { v.textContent = i === 1 ? mot : "Fermé"; });
    }
  }

  afficherStatut();
  setInterval(afficherStatut, 60000);

  /* ---------- Liste de commande (carnet) ---------- */
  var CLE = "monorom-liste-v1";
  var liste = charger();
  var annonce = $("[data-annonce]");

  function charger() {
    try {
      var v = JSON.parse(window.localStorage.getItem(CLE) || "[]");
      return Array.isArray(v) ? v.filter(function (x) {
        return x && typeof x.id === "string" && typeof x.nom === "string" && typeof x.prix === "number" && x.qte > 0;
      }) : [];
    } catch (e) { return []; }
  }
  function sauver() {
    try { window.localStorage.setItem(CLE, JSON.stringify(liste)); } catch (e) { /* stockage indisponible : la liste vit le temps de la visite */ }
  }

  function cle(texte) {
    return texte.toLowerCase().replace(/œ/g, "oe").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function texteNom(el) {
    var copie = el.cloneNode(true);
    $$(".plat-desc, .sr-only, .piment", copie).forEach(function (n) { n.remove(); });
    return copie.textContent.replace(/\s+/g, " ").trim();
  }

  // Un bouton « + » par plat à prix unique, et un par formule.
  var boutons = {};
  $$(".etal").forEach(function (etal) {
    var prefixe = etal.getAttribute("data-prefixe");
    $$(".plat:not(.plat-vin)", etal).forEach(function (li) {
      var prixEl = $(".plat-prix", li);
      var nomEl = $(".plat-nom", li);
      if (!prixEl || !nomEl) return;
      var nom = texteNom(nomEl);
      var libelle = prefixe ? prefixe + " · " + nom : nom;
      var id = etal.id + "--" + cle(nom);
      var b = document.createElement("button");
      b.type = "button";
      b.className = "plat-ajout";
      b.setAttribute("data-id", id);
      b.setAttribute("data-nom", libelle);
      b.setAttribute("data-prix", prixEl.getAttribute("value"));
      b.innerHTML = '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-plus"></use></svg><span class="plat-ajout-qte" aria-hidden="true"></span>';
      li.appendChild(b);
      (boutons[id] = boutons[id] || []).push(b);
    });
  });
  $$(".ardoise").forEach(function (ardoise) {
    var nomEl = $(".ardoise-nom span", ardoise);
    var prixEl = $(".ardoise-prix", ardoise);
    if (!nomEl || !prixEl) return;
    var libelle = nomEl.textContent.trim() + " " + prixEl.textContent.trim();
    var id = ardoise.id || "formule--" + cle(libelle);
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ardoise-ajout";
    b.setAttribute("data-id", id);
    b.setAttribute("data-nom", libelle);
    b.setAttribute("data-prix", prixEl.getAttribute("value"));
    b.innerHTML = '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-plus"></use></svg><span class="ardoise-ajout-texte">Noter sur ma liste</span>';
    $(".ardoise-cadre", ardoise).appendChild(b);
    (boutons[id] = boutons[id] || []).push(b);
  });

  function trouver(id) {
    for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i];
    return null;
  }
  function total() {
    return liste.reduce(function (s, x) { return s + x.prix * x.qte; }, 0);
  }
  function nbArticles() {
    return liste.reduce(function (s, x) { return s + x.qte; }, 0);
  }

  function changer(id, nom, prix, delta) {
    var ligne = trouver(id);
    if (!ligne && delta > 0) {
      ligne = { id: id, nom: nom, prix: prix, qte: 0 };
      liste.push(ligne);
    }
    if (!ligne) return;
    ligne.qte += delta;
    if (ligne.qte <= 0) liste = liste.filter(function (x) { return x.id !== id; });
    sauver();
    rendre(delta > 0 ? id : null);
    var n = nbArticles();
    var message = (delta > 0 ? ligne.nom + " noté." : ligne.qte > 0 ? ligne.nom + " : " + ligne.qte + "." : ligne.nom + " retiré.") +
      " " + n + (n > 1 ? " articles" : " article") + ", total " + euros.format(total()) + ".";
    if (annonce) annonce.textContent = message;
  }

  var ol = $("[data-carnet-lignes]");
  var vide = $("[data-carnet-vide]");
  var blocTotal = $("[data-carnet-total]");
  var vider = $("[data-vider]");
  var barreCompte = $("[data-barre-compte]");
  var barreTotal = $("[data-barre-total]");
  var barreListe = $("[data-barre-liste]");

  function rendre(nouveau) {
    if (!ol) return;
    ol.innerHTML = "";
    liste.forEach(function (x) {
      var li = document.createElement("li");
      li.className = "carnet-ligne" + (x.id === nouveau ? " nouvelle" : "");
      li.innerHTML =
        '<span class="carnet-ligne-nom"></span>' +
        '<data class="carnet-ligne-prix"></data>' +
        '<span class="carnet-qte">' +
        '<button type="button" data-moins><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-moins"></use></svg><span class="sr-only"></span></button>' +
        "<output></output>" +
        '<button type="button" data-plus><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-plus"></use></svg><span class="sr-only"></span></button>' +
        '<span class="carnet-qte-pu"></span></span>';
      $(".carnet-ligne-nom", li).textContent = x.nom;
      var p = $(".carnet-ligne-prix", li);
      p.value = (x.prix * x.qte).toFixed(2);
      p.textContent = euros.format(x.prix * x.qte);
      $("output", li).textContent = x.qte;
      $("[data-moins] .sr-only", li).textContent = "Enlever 1 × " + x.nom;
      $("[data-plus] .sr-only", li).textContent = "Ajouter 1 × " + x.nom;
      $(".carnet-qte-pu", li).textContent = euros.format(x.prix) + " l’unité";
      li.setAttribute("data-id", x.id);
      ol.appendChild(li);
    });
    var n = nbArticles();
    var t = total();
    if (vide) vide.hidden = n > 0;
    if (blocTotal) {
      blocTotal.hidden = n === 0;
      var d = $("[data-total]", blocTotal);
      d.value = t.toFixed(2);
      d.textContent = euros.format(t);
    }
    if (vider) vider.hidden = n === 0;
    if (barreCompte) barreCompte.textContent = n;
    if (barreTotal) {
      barreTotal.hidden = n === 0;
      barreTotal.value = t.toFixed(2);
      barreTotal.textContent = euros.format(t);
    }
    if (barreListe) {
      if (n) barreListe.setAttribute("data-rempli", ""); else barreListe.removeAttribute("data-rempli");
      barreListe.setAttribute("aria-label", "Ma liste : " + n + (n > 1 ? " articles" : " article") + (n ? ", " + euros.format(t) : ""));
    }
    Object.keys(boutons).forEach(function (id) {
      var ligne = trouver(id);
      boutons[id].forEach(function (b) {
        var nom = b.getAttribute("data-nom");
        if (ligne) {
          b.setAttribute("data-qte", ligne.qte);
          b.setAttribute("aria-label", nom + " : " + ligne.qte + " sur ma liste, en ajouter un");
        } else {
          b.removeAttribute("data-qte");
          b.setAttribute("aria-label", "Noter " + nom + " sur ma liste");
        }
        var q = $(".plat-ajout-qte", b);
        if (q) q.textContent = ligne ? ligne.qte : "";
        var tx = $(".ardoise-ajout-texte", b);
        if (tx) tx.textContent = ligne ? "Noté · " + ligne.qte : "Noter sur ma liste";
      });
    });
  }

  document.addEventListener("click", function (e) {
    var ajout = e.target.closest(".plat-ajout, .ardoise-ajout");
    if (ajout) {
      changer(ajout.getAttribute("data-id"), ajout.getAttribute("data-nom"), parseFloat(ajout.getAttribute("data-prix")), 1);
      if (!reduit) {
        ajout.classList.add("tape");
        setTimeout(function () { ajout.classList.remove("tape"); }, 160);
      }
      return;
    }
    var ligne = e.target.closest(".carnet-ligne");
    if (ligne) {
      var id = ligne.getAttribute("data-id");
      var x = trouver(id);
      if (!x) return;
      if (e.target.closest("[data-plus]")) {
        changer(id, x.nom, x.prix, 1);
        var suite = $('.carnet-ligne[data-id="' + id + '"] [data-plus]');
        if (suite) suite.focus();
      } else if (e.target.closest("[data-moins]")) {
        changer(id, x.nom, x.prix, -1);
        var reste = $('.carnet-ligne[data-id="' + id + '"] [data-moins]');
        (reste || $("#carnet-titre")).focus();
      }
    }
  });

  if (vider) {
    vider.addEventListener("click", function () {
      liste = [];
      sauver();
      rendre();
      if (annonce) annonce.textContent = "Liste effacée.";
      $("#carnet-titre").focus();
    });
  }

  // Sur téléphone, la liste s'ouvre en panneau depuis la barre du bas.
  var carnet = $("[data-carnet]");
  function ouvrirCarnet(ouvrir) {
    if (!carnet || !barreListe) return;
    carnet.classList.toggle("ouvert", ouvrir);
    barreListe.setAttribute("aria-expanded", ouvrir ? "true" : "false");
    if (ouvrir) $("#carnet-titre").focus();
    else barreListe.focus();
  }
  if (barreListe) {
    barreListe.addEventListener("click", function () {
      ouvrirCarnet(!carnet.classList.contains("ouvert"));
    });
  }
  var fermer = $("[data-carnet-fermer]");
  if (fermer) fermer.addEventListener("click", function () { ouvrirCarnet(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && carnet && carnet.classList.contains("ouvert")) ouvrirCarnet(false);
  });

  rendre();

  /* ---------- Recherche dans la carte ---------- */
  function norm(s) {
    return s.toLowerCase().replace(/œ/g, "oe").replace(/æ/g, "ae").normalize("NFD")
      .replace(/[̀-ͯ]/g, "").replace(/[’'()\-,.]/g, " ").replace(/\s+/g, " ").trim();
  }
  var lignes = $$(".etal .plat").map(function (li) {
    var etal = li.closest(".etal");
    var groupe = li.closest(".groupe");
    var gt = groupe ? $(".groupe-titre", groupe) : null;
    var pimente = li.hasAttribute("data-piment") || etal.hasAttribute("data-piment");
    return {
      li: li, etal: etal, groupe: groupe,
      texte: norm([li.textContent, $(".etal-titre", etal).textContent, gt ? gt.textContent : "", etal.getAttribute("data-prefixe") || "", pimente ? "pimente piment epice" : ""].join(" "))
    };
  });
  var champ = $("#q");
  var effacer = $("[data-effacer]");
  var resultat = $("[data-resultat]");
  var carteVide = $("[data-vide]");
  var filtres = $$("[data-filtre]");
  var minuteur;

  function filtrer() {
    var brut = champ.value.trim();
    var mots = norm(brut).split(" ").filter(Boolean).map(function (m) {
      return m.length > 3 ? m.replace(/s$/, "") : m;
    });
    var actif = mots.length > 0;
    var parEtal = {};
    var n = 0;
    lignes.forEach(function (l) {
      var ok = !actif || mots.every(function (m) { return l.texte.indexOf(m) !== -1; });
      l.li.hidden = !ok;
      if (ok) { n++; parEtal[l.etal.id] = (parEtal[l.etal.id] || 0) + 1; }
    });
    $$(".groupe").forEach(function (g) {
      g.hidden = actif && !$$(".plat", g).some(function (li) { return !li.hidden; });
    });
    $$(".etal").forEach(function (etal) {
      var k = parEtal[etal.id] || 0;
      etal.hidden = actif && k === 0;
      var c = $(".etal-compte", etal);
      var total = parseInt(c.getAttribute("data-compte"), 10);
      c.textContent = actif ? k + " sur " + total : total + " " + c.getAttribute("data-unite");
      var rub = $('[data-rubrique="' + etal.id + '"]');
      if (rub) rub.parentNode.hidden = actif && k === 0;
    });
    $$(".quartier").forEach(function (q) {
      q.hidden = actif && !$$(".etal", q).some(function (e) { return !e.hidden; });
    });
    if (effacer) effacer.hidden = !brut;
    if (carteVide) {
      carteVide.hidden = !(actif && n === 0);
      $("[data-vide-terme]", carteVide).textContent = brut;
    }
    if (resultat) {
      resultat.innerHTML = !actif ? "" : n === 0 ? "Aucun plat trouvé." :
        "<strong>" + n + "</strong> " + (n > 1 ? "lignes trouvées" : "ligne trouvée") + " pour « " + escapeHtml(brut) + " ».";
    }
    filtres.forEach(function (f) {
      f.setAttribute("aria-pressed", norm(f.getAttribute("data-filtre")) === norm(brut) ? "true" : "false");
    });
  }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  if (champ) {
    champ.addEventListener("input", function () {
      clearTimeout(minuteur);
      minuteur = setTimeout(filtrer, 90);
    });
    champ.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && champ.value) { champ.value = ""; filtrer(); }
    });
  }
  if (effacer) effacer.addEventListener("click", function () { champ.value = ""; filtrer(); champ.focus(); });
  filtres.forEach(function (f) {
    f.addEventListener("click", function () {
      var deja = f.getAttribute("aria-pressed") === "true";
      champ.value = deja ? "" : f.getAttribute("data-filtre");
      filtrer();
    });
  });
  var reinit = $("[data-reinit]");
  if (reinit) reinit.addEventListener("click", function () { champ.value = ""; filtrer(); champ.focus(); });

  /* ---------- Rubrique en cours (barre collante) ---------- */
  var liens = $$("[data-rubrique]");
  var barre = $("[data-rubriques] ul");
  function activer(id) {
    liens.forEach(function (a) {
      var on = a.getAttribute("data-rubrique") === id;
      if (on) {
        a.setAttribute("aria-current", "true");
        if (barre) {
          var gauche = a.parentNode.offsetLeft - 24;
          if (gauche < barre.scrollLeft || gauche + a.offsetWidth + 48 > barre.scrollLeft + barre.clientWidth) {
            barre.scrollTo({ left: Math.max(0, gauche), behavior: reduit ? "auto" : "smooth" });
          }
        }
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }
  if ("IntersectionObserver" in window && liens.length) {
    var visibles = {};
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) { visibles[en.target.id] = en.isIntersecting ? en.boundingClientRect.top : null; });
      var meilleur = null, haut = Infinity;
      Object.keys(visibles).forEach(function (id) {
        if (visibles[id] !== null && visibles[id] < haut) { haut = visibles[id]; meilleur = id; }
      });
      if (meilleur) activer(meilleur);
    }, { rootMargin: "-25% 0px -55% 0px" });
    $$(".etal").forEach(function (e) { io.observe(e); });
  }
})();
