/* La Fleur d'Or : panneau d'administration (carte, formules, sauvegardes, mot de passe). */
(function () {
  "use strict";

  var csrf = document.querySelector('meta[name="csrf"]').getAttribute("content");
  var contenu = document.getElementById("a-contenu");
  var barreEtat = document.querySelector("[data-etat-publication]");
  var boutonPublier = document.querySelector("[data-publier]");
  var boutonAnnuler = document.querySelector("[data-annuler]");

  var etat = {
    donnees: null,
    photos: [],
    sauvegardes: [],
    onglet: "carte",
    q: 0,
    s: 0,
    vueParties: false,
    recherche: "",
    sale: false,
    occupe: false,
    erreurs: [],
    focus: null
  };

  /* ---------- Outils ---------- */

  function h(tag, attrs, enfants) {
    var el = document.createElement(tag);
    var valeur;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "class") el.className = v;
        else if (k === "text") el.textContent = v;
        else if (k === "value") valeur = v;
        else if (k === "checked") el.checked = true;
        else if (k.indexOf("on") === 0) el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? "" : v);
      });
    }
    (Array.isArray(enfants) ? enfants : enfants == null ? [] : [enfants]).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    if (valeur !== undefined) el.value = valeur;
    return el;
  }

  function icone(nom) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "a-ico");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var use = document.createElementNS(ns, "use");
    use.setAttribute("href", "#i-" + nom);
    svg.appendChild(use);
    return svg;
  }

  function boutonIcone(nom, libelle, action, opts) {
    opts = opts || {};
    return h("button", {
      type: "button",
      class: "a-ico-bouton" + (opts.danger ? " a-danger" : ""),
      title: libelle,
      disabled: opts.desactive || null,
      "data-cle": opts.cle || null,
      onclick: action
    }, [icone(nom), h("span", { class: "a-sr", text: libelle })]);
  }

  function boutonAjout(texte, action, cle) {
    return h("button", { type: "button", class: "a-ajout", onclick: action, "data-cle": cle || null }, [icone("plus"), h("span", { text: texte })]);
  }

  function champ(libelle, input, aide) {
    return h("label", { class: "a-champ" }, [h("span", { class: "a-champ-libelle", text: libelle }), input, aide ? h("span", { class: "a-aide", text: aide }) : null]);
  }

  function lirePrix(texte) {
    var t = String(texte).replace(/[\s €]/g, "").replace(",", ".");
    if (t === "") return null;
    if (!/^\d{1,4}(\.\d{1,2})?$/.test(t)) return NaN;
    var n = Math.round(parseFloat(t) * 100) / 100;
    return n > 0 ? n : NaN;
  }

  function prixTexte(n) {
    return typeof n === "number" && !isNaN(n) ? n.toFixed(2).replace(".", ",") : "";
  }

  function norm(s) {
    return String(s || "").toLowerCase().replace(/œ/g, "oe").normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function nbPlats(s) {
    return s.groupes.reduce(function (n, g) { return n + g.plats.length; }, 0);
  }

  function platCorrespond(p, terme) {
    return terme !== "" && norm(p.nom + " " + p.desc).indexOf(terme) !== -1;
  }

  function deplacer(liste, i, delta) {
    var j = i + delta;
    if (j < 0 || j >= liste.length) return i;
    var x = liste.splice(i, 1)[0];
    liste.splice(j, 0, x);
    return j;
  }

  function copie(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function nouveauPlat() {
    return { nom: "", desc: "", piment: false, prix: null, formats: [] };
  }

  /* ---------- État de publication ---------- */

  function majBarre(message, genre) {
    boutonPublier.disabled = !etat.sale || etat.occupe;
    boutonAnnuler.disabled = !etat.sale || etat.occupe;
    barreEtat.className = "a-publier-etat" + (genre ? " a-" + genre : etat.sale ? " a-sale" : "");
    barreEtat.textContent = "";
    if (genre === "ok") barreEtat.appendChild(icone("coche"));
    if (genre === "erreur") barreEtat.appendChild(icone("alerte"));
    barreEtat.appendChild(document.createTextNode(message || (etat.sale ? "Modifications non publiées." : "Aucune modification.")));
  }

  function sale() {
    if (!etat.sale) {
      etat.sale = true;
      majBarre();
    }
  }

  /* ---------- Serveur ---------- */

  function api(action, methode, corps) {
    return fetch("api.php?action=" + encodeURIComponent(action), {
      method: methode,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: corps ? JSON.stringify(corps) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false, message: "Réponse illisible du serveur (" + r.status + ")." }; })
        .then(function (j) {
          if (r.status === 401) {
            window.alert(j.message || "Session expirée : reconnectez-vous.");
            etat.sale = false;
            window.location.reload();
          }
          return j;
        });
    }, function () {
      return { ok: false, message: "Le serveur ne répond pas. XAMPP (Apache) est-il bien démarré ?" };
    });
  }

  function charger() {
    return api("donnees", "GET").then(function (j) {
      if (!j.ok) {
        contenu.textContent = "";
        contenu.appendChild(h("p", { class: "a-alerte", role: "alert", text: j.message || "Impossible de charger la carte." }));
        return;
      }
      etat.donnees = j.donnees;
      etat.photos = j.photos || [];
      etat.sauvegardes = j.sauvegardes || [];
      etat.sale = false;
      etat.erreurs = [];
      majBarre();
      rendre();
    });
  }

  /* ---------- Vérification avant publication ---------- */

  function verifier() {
    var pb = [];
    var d = etat.donnees;
    d.quartiers.forEach(function (q) {
      if (!q.titre.trim()) pb.push("Une partie de la carte n’a pas de titre.");
      q.sections.forEach(function (s) {
        var cat = "« " + (s.titre.trim() || "catégorie sans nom") + " »";
        if (!s.titre.trim()) pb.push("Une catégorie de « " + q.titre + " » n’a pas de nom.");
        s.groupes.forEach(function (g) {
          g.plats.forEach(function (p, i) {
            var qui = cat + ", " + (p.nom.trim() ? "« " + p.nom.trim() + " »" : "plat n° " + (i + 1));
            if (!p.nom.trim()) pb.push(qui + " : le nom est vide.");
            if (p.formats.length) {
              var unPrix = false;
              p.formats.forEach(function (f) {
                if (typeof f.prix === "number" && isNaN(f.prix)) pb.push(qui + " : un prix de format est invalide.");
                if (typeof f.prix === "number" && !isNaN(f.prix)) unPrix = true;
              });
              if (!unPrix) pb.push(qui + " : indiquez au moins un prix.");
            } else if (typeof p.prix !== "number" || isNaN(p.prix)) {
              pb.push(qui + " : prix manquant ou invalide (exemple : 11,50).");
            }
          });
        });
      });
    });
    d.formules.forEach(function (g) {
      if (!g.titre.trim()) pb.push("Un groupe de formules n’a pas de titre.");
      g.menus.forEach(function (m, i) {
        var qui = "Formule " + (m.nom.trim() ? "« " + m.nom.trim() + " »" : "n° " + (i + 1)) + " (" + g.titre + ")";
        if (!m.nom.trim()) pb.push(qui + " : le nom est vide.");
        if (typeof m.prix !== "number" || isNaN(m.prix)) pb.push(qui + " : prix manquant ou invalide.");
        m.services.forEach(function (s) {
          if (!s.titre.trim()) pb.push(qui + " : une partie (entrée, plat…) n’a pas de titre.");
          if (!s.choix.length) pb.push(qui + ", « " + s.titre + " » : ajoutez au moins une ligne.");
        });
      });
    });
    return pb;
  }

  function publier() {
    if (etat.occupe || !etat.sale) return;
    var pb = verifier();
    if (pb.length) {
      etat.erreurs = pb;
      rendre();
      majBarre(pb.length > 1 ? pb.length + " points à corriger avant de publier." : "Un point à corriger avant de publier.", "erreur");
      contenu.focus();
      window.scrollTo(0, 0);
      return;
    }
    etat.occupe = true;
    majBarre("Publication en cours…");
    api("publier", "POST", { donnees: etat.donnees }).then(function (j) {
      etat.occupe = false;
      if (j.ok) {
        etat.donnees = j.donnees;
        etat.sauvegardes = j.sauvegardes || etat.sauvegardes;
        etat.sale = false;
        etat.erreurs = [];
        rendre();
        var t = new Date();
        majBarre(j.message + " (" + String(t.getHours()).padStart(2, "0") + "h" + String(t.getMinutes()).padStart(2, "0") + ")", "ok");
      } else {
        etat.erreurs = j.erreurs || [];
        rendre();
        majBarre(j.message || "La publication a échoué.", "erreur");
        window.scrollTo(0, 0);
      }
    });
  }

  boutonPublier.addEventListener("click", publier);
  boutonAnnuler.addEventListener("click", function () {
    if (window.confirm("Annuler toutes les modifications non publiées ?")) charger();
  });
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      publier();
    }
  });
  window.addEventListener("beforeunload", function (e) {
    if (etat.sale) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  /* ---------- Onglets ---------- */

  var onglets = Array.prototype.slice.call(document.querySelectorAll("[data-onglet]"));
  onglets.forEach(function (b) {
    b.addEventListener("click", function () {
      etat.onglet = b.getAttribute("data-onglet");
      rendre();
      contenu.focus({ preventScroll: true });
    });
  });

  function rendre() {
    if (!etat.donnees) return;
    onglets.forEach(function (b) {
      if (b.getAttribute("data-onglet") === etat.onglet) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    contenu.textContent = "";
    if (etat.erreurs.length) {
      contenu.appendChild(h("div", { class: "a-alerte", role: "alert" }, [
        h("p", { class: "a-alerte-titre" }, [icone("alerte"), h("span", { text: "À corriger avant de publier" })]),
        h("ul", null, etat.erreurs.map(function (e) { return h("li", { text: e }); }))
      ]));
    }
    if (etat.onglet === "carte") rendreCarte();
    else if (etat.onglet === "formules") rendreFormules();
    else if (etat.onglet === "sauvegardes") rendreSauvegardes();
    else rendreCompte();
    if (etat.focus) {
      var el = contenu.querySelector('[data-cle="' + etat.focus + '"]');
      etat.focus = null;
      if (el) el.focus();
    }
  }

  /* ---------- La carte ---------- */

  function rendreCarte() {
    var d = etat.donnees;
    if (!d.quartiers.length) etat.vueParties = true;
    etat.q = Math.min(etat.q, Math.max(0, d.quartiers.length - 1));
    var q = d.quartiers[etat.q];
    if (q) etat.s = Math.min(etat.s, Math.max(0, q.sections.length - 1));
    if (!q || !q.sections.length) {
      etat.vueParties = etat.vueParties || !d.quartiers.some(function (x) { return x.sections.length; });
    }

    var liste = h("div", { class: "a-arbo-liste" });
    var recherche = h("input", {
      type: "search", class: "a-input", placeholder: "Chercher un plat…", value: etat.recherche,
      "aria-label": "Chercher un plat dans toute la carte",
      oninput: function () {
        etat.recherche = recherche.value;
        majArbo();
        majSurlignage();
      }
    });

    function majArbo() {
      var terme = norm(etat.recherche.trim());
      liste.textContent = "";
      d.quartiers.forEach(function (qq, qi) {
        var items = [];
        qq.sections.forEach(function (s, si) {
          var trouves = 0;
          if (terme) {
            s.groupes.forEach(function (g) { g.plats.forEach(function (p) { if (platCorrespond(p, terme)) trouves++; }); });
            if (!trouves && norm(s.titre).indexOf(terme) === -1) return;
          }
          var actif = !etat.vueParties && qi === etat.q && si === etat.s;
          items.push(h("li", null, h("button", {
            type: "button", class: "a-arbo-cat", "aria-current": actif ? "true" : null,
            onclick: function () {
              etat.q = qi;
              etat.s = si;
              etat.vueParties = false;
              rendre();
              var premier = contenu.querySelector(".a-plat.a-trouve");
              if (premier) premier.scrollIntoView({ block: "center" });
            }
          }, [
            h("span", { class: "a-arbo-nom", text: s.titre.trim() || "Catégorie sans nom" }),
            h("span", { class: "a-arbo-n", text: terme ? (trouves ? String(trouves) : "–") : String(nbPlats(s)) })
          ])));
        });
        if (terme && !items.length) return;
        liste.appendChild(h("p", { class: "a-arbo-partie", text: qq.titre.trim() || "Partie sans titre" }));
        liste.appendChild(h("ul", { class: "a-arbo-cats", role: "list" }, items.length ? items : [h("li", { class: "a-arbo-vide", text: "Aucune catégorie" })]));
      });
      if (terme && !liste.childNodes.length) liste.appendChild(h("p", { class: "a-arbo-vide", text: "Aucun plat ne correspond." }));
    }

    var aside = h("aside", { class: "a-arbo", "aria-label": "Catégories de la carte" }, [
      h("div", { class: "a-recherche" }, [icone("loupe"), recherche]),
      liste,
      h("div", { class: "a-arbo-actions" }, [
        boutonAjout("Nouvelle catégorie", function () {
          if (!d.quartiers.length) return;
          var cible = d.quartiers[etat.vueParties ? 0 : etat.q];
          cible.sections.push({ id: "", titre: "Nouvelle catégorie", note: "", prefixe: "", piment: false, photo: "", photo_alt: "",
            groupes: [{ titre: "", note: "", plats: [nouveauPlat()] }] });
          etat.q = d.quartiers.indexOf(cible);
          etat.s = cible.sections.length - 1;
          etat.vueParties = false;
          etat.focus = "s-titre";
          sale();
          rendre();
        }, "ajout-cat"),
        h("button", {
          type: "button", class: "a-bouton a-bouton-discret a-bouton-plein", "aria-pressed": etat.vueParties ? "true" : "false",
          onclick: function () { etat.vueParties = !etat.vueParties; rendre(); }
        }, "Parties de la carte")
      ])
    ]);
    majArbo();

    var editeur = h("div", { class: "a-editeur" });
    if (etat.vueParties || !q || !q.sections.length) editeur.appendChild(editeurParties());
    else editeur.appendChild(editeurSection(q, q.sections[etat.s]));

    contenu.appendChild(h("div", { class: "a-carte" }, [aside, editeur]));
    majSurlignage();

    function majSurlignage() {
      var terme = norm(etat.recherche.trim());
      Array.prototype.forEach.call(contenu.querySelectorAll(".a-plat"), function (ligne) {
        ligne.classList.toggle("a-trouve", !!(ligne._plat && platCorrespond(ligne._plat, terme)));
      });
    }
  }

  function editeurParties() {
    var d = etat.donnees;
    var lignes = d.quartiers.map(function (q, qi) {
      return h("li", { class: "a-partie" }, [
        champ("Titre de la partie", h("input", {
          class: "a-input", value: q.titre, maxlength: "80", "data-cle": "q-" + qi,
          oninput: function (e) { q.titre = e.target.value; sale(); }
        })),
        h("label", { class: "a-case" }, [
          h("input", { type: "checkbox", checked: q.boissons, onchange: function (e) { q.boissons = e.target.checked; sale(); } }),
          h("span", { text: "Boissons (comptées à part, avec la mention sur l’alcool)" })
        ]),
        h("p", { class: "a-partie-n", text: q.sections.length + (q.sections.length > 1 ? " catégories" : " catégorie") }),
        h("div", { class: "a-actions" }, [
          boutonIcone("haut", "Monter la partie", function () { etat.focus = "q-" + deplacer(d.quartiers, qi, -1); sale(); rendre(); }, { desactive: qi === 0 }),
          boutonIcone("bas", "Descendre la partie", function () { etat.focus = "q-" + deplacer(d.quartiers, qi, 1); sale(); rendre(); }, { desactive: qi === d.quartiers.length - 1 }),
          boutonIcone("corbeille", q.sections.length ? "Déplacez ou supprimez d’abord ses catégories" : "Supprimer la partie", function () {
            d.quartiers.splice(qi, 1);
            sale();
            rendre();
          }, { danger: true, desactive: q.sections.length > 0 })
        ])
      ]);
    });
    return h("section", { class: "a-panneau", "aria-labelledby": "t-parties" }, [
      h("h2", { class: "a-titre", id: "t-parties", text: "Parties de la carte" }),
      h("p", { class: "a-intro", text: "Les grandes parties regroupent les catégories (par exemple « Bar à sushis »). Sur le site, chacune ouvre un bandeau de brique." }),
      h("ul", { class: "a-parties", role: "list" }, lignes),
      boutonAjout("Ajouter une partie", function () {
        d.quartiers.push({ id: "", titre: "Nouvelle partie", boissons: false, sections: [] });
        etat.focus = "q-" + (d.quartiers.length - 1);
        sale();
        rendre();
      })
    ]);
  }

  function selectPhoto(objet, cle) {
    var apercu = h("img", { class: "a-apercu", alt: "", src: photoSrc(objet.photo) || null, hidden: objet.photo ? null : true });
    var alt = h("input", {
      class: "a-input", value: objet.photo_alt || "", maxlength: "160", placeholder: "Ce que montre la photo (pour les personnes aveugles)",
      oninput: function (e) { objet.photo_alt = e.target.value; sale(); }
    });
    var blocAlt = champ("Description de la photo", alt);
    blocAlt.hidden = !objet.photo;
    var select = h("select", {
      class: "a-input", "data-cle": cle,
      onchange: function (e) {
        objet.photo = e.target.value;
        apercu.hidden = !objet.photo;
        if (objet.photo) apercu.src = photoSrc(objet.photo);
        blocAlt.hidden = !objet.photo;
        sale();
      }
    }, [h("option", { value: "", text: "Aucune photo" })].concat(etat.photos.map(function (p) {
      return h("option", { value: p.nom, text: p.nom });
    })));
    select.value = objet.photo || "";
    return h("div", { class: "a-photo" }, [champ("Photo", select), apercu, blocAlt]);
  }

  function photoSrc(nom) {
    for (var i = 0; i < etat.photos.length; i++) if (etat.photos[i].nom === nom) return etat.photos[i].src;
    return "";
  }

  function editeurSection(q, s) {
    var d = etat.donnees;
    var qi = etat.q;
    var si = etat.s;

    var selectPartie = h("select", {
      class: "a-input",
      onchange: function (e) {
        var cible = d.quartiers[+e.target.value];
        q.sections.splice(si, 1);
        cible.sections.push(s);
        etat.q = +e.target.value;
        etat.s = cible.sections.length - 1;
        sale();
        rendre();
      }
    }, d.quartiers.map(function (x, i) { return h("option", { value: String(i), text: x.titre || "Partie sans titre" }); }));
    selectPartie.value = String(qi);

    var tete = h("section", { class: "a-panneau a-cat", "aria-label": "Réglages de la catégorie" }, [
      h("div", { class: "a-cat-tete" }, [
        champ("Nom de la catégorie", h("input", {
          class: "a-input a-input-titre", value: s.titre, maxlength: "80", "data-cle": "s-titre",
          oninput: function (e) {
            s.titre = e.target.value;
            sale();
            var lien = document.querySelector('.a-arbo-cat[aria-current="true"] .a-arbo-nom');
            if (lien) lien.textContent = s.titre.trim() || "Catégorie sans nom";
          }
        })),
        h("div", { class: "a-actions" }, [
          boutonIcone("haut", "Monter la catégorie", function () { etat.s = deplacer(q.sections, si, -1); etat.focus = "s-haut"; sale(); rendre(); }, { desactive: si === 0, cle: "s-haut" }),
          boutonIcone("bas", "Descendre la catégorie", function () { etat.s = deplacer(q.sections, si, 1); etat.focus = "s-bas"; sale(); rendre(); }, { desactive: si === q.sections.length - 1, cle: "s-bas" }),
          boutonIcone("corbeille", "Supprimer la catégorie", function () {
            var n = nbPlats(s);
            if (n && !window.confirm("Supprimer la catégorie « " + s.titre + " » et ses " + n + " plats ?\n(Rien n’est effacé du site tant que vous ne publiez pas.)")) return;
            q.sections.splice(si, 1);
            etat.s = Math.max(0, si - 1);
            sale();
            rendre();
          }, { danger: true })
        ])
      ]),
      h("div", { class: "a-grille" }, [
        champ("Partie de la carte", selectPartie),
        champ("Mention", h("input", {
          class: "a-input", value: s.note, maxlength: "120", placeholder: "ex. 15 min d’attente",
          oninput: function (e) { s.note = e.target.value; sale(); }
        }), "Affichée en or sous le titre."),
        champ("Préfixe sur la liste de commande", h("input", {
          class: "a-input", value: s.prefixe, maxlength: "60", placeholder: "ex. Maki (6 pièces)",
          oninput: function (e) { s.prefixe = e.target.value; sale(); }
        }), "Utile quand les plats s’appellent seulement « Saumon », « Thon »…"),
        h("label", { class: "a-case a-case-piment" }, [
          h("input", { type: "checkbox", checked: s.piment, onchange: function (e) { s.piment = e.target.checked; sale(); } }),
          icone("piment"),
          h("span", { text: "Toute la catégorie est pimentée" })
        ])
      ]),
      selectPhoto(s, "s-photo")
    ]);

    var groupes = s.groupes.map(function (g, gi) { return editeurGroupe(s, g, gi); });

    return h("div", { class: "a-cat-edition" }, [
      tete,
      h("div", { class: "a-groupes" }, groupes),
      boutonAjout("Ajouter un groupe (sous-titre)", function () {
        s.groupes.push({ titre: "Nouveau groupe", note: "", plats: [nouveauPlat()] });
        etat.focus = "g-" + (s.groupes.length - 1) + "-titre";
        sale();
        rendre();
      })
    ]);
  }

  function editeurGroupe(s, g, gi) {
    var unSeul = s.groupes.length === 1;
    var entete = h("div", { class: "a-groupe-tete" }, [
      champ(unSeul ? "Sous-titre (facultatif)" : "Sous-titre du groupe", h("input", {
        class: "a-input", value: g.titre, maxlength: "80", placeholder: "ex. Salades", "data-cle": "g-" + gi + "-titre",
        oninput: function (e) { g.titre = e.target.value; sale(); }
      })),
      champ("Précision (facultatif)", h("input", {
        class: "a-input", value: g.note, maxlength: "300", placeholder: "ex. Parfums : vanille, chocolat…",
        oninput: function (e) { g.note = e.target.value; sale(); }
      })),
      h("div", { class: "a-actions" }, [
        boutonIcone("haut", "Monter le groupe", function () { etat.focus = "g-" + deplacer(s.groupes, gi, -1) + "-titre"; sale(); rendre(); }, { desactive: gi === 0 }),
        boutonIcone("bas", "Descendre le groupe", function () { etat.focus = "g-" + deplacer(s.groupes, gi, 1) + "-titre"; sale(); rendre(); }, { desactive: gi === s.groupes.length - 1 }),
        boutonIcone("corbeille", "Supprimer le groupe", function () {
          if (g.plats.length && !window.confirm("Supprimer ce groupe et ses " + g.plats.length + " plats ?")) return;
          s.groupes.splice(gi, 1);
          if (!s.groupes.length) s.groupes.push({ titre: "", note: "", plats: [] });
          sale();
          rendre();
        }, { danger: true, desactive: unSeul && !g.plats.length })
      ])
    ]);
    var lignes = g.plats.map(function (p, pi) { return lignePlat(g, p, gi, pi); });
    return h("section", { class: "a-panneau a-groupe", "aria-label": g.titre ? "Groupe " + g.titre : "Plats" }, [
      entete,
      h("div", { class: "a-plats-tete", "aria-hidden": "true" }, [
        h("span", { text: "Nom du plat" }), h("span", { text: "Précision" }), h("span", { text: "Prix (€)" }), h("span", { text: "" }), h("span", { text: "" })
      ]),
      h("div", { class: "a-plats" }, lignes.length ? lignes : [h("p", { class: "a-vide", text: "Aucun plat dans ce groupe." })]),
      boutonAjout("Ajouter un plat", function () {
        g.plats.push(nouveauPlat());
        etat.focus = "p-" + gi + "-" + (g.plats.length - 1) + "-nom";
        sale();
        rendre();
      }, "g-" + gi + "-ajout")
    ]);
  }

  function inputPrix(objet, cle, requis, dataCle, libelle) {
    var input = h("input", {
      class: "a-input a-prix", inputmode: "decimal", autocomplete: "off", value: prixTexte(objet[cle]), placeholder: requis ? "0,00" : "–",
      "aria-label": libelle, "data-cle": dataCle || null,
      "aria-invalid": (requis && (objet[cle] === null || isNaN(objet[cle]))) || (typeof objet[cle] === "number" && isNaN(objet[cle])) ? "true" : null,
      oninput: function () {
        var v = lirePrix(input.value);
        objet[cle] = v === null ? null : v;
        var faux = (v === null && requis) || (typeof v === "number" && isNaN(v));
        if (faux) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
        sale();
      },
      onblur: function () {
        if (typeof objet[cle] === "number" && !isNaN(objet[cle])) input.value = prixTexte(objet[cle]);
      }
    });
    return input;
  }

  function lignePlat(g, p, gi, pi) {
    var base = "p-" + gi + "-" + pi;
    var prix;
    if (p.formats.length) {
      prix = h("div", { class: "a-formats" }, p.formats.map(function (f, fi) {
        return h("div", { class: "a-format" }, [
          h("input", {
            class: "a-input a-format-nom", value: f.libelle, maxlength: "20", placeholder: "75 cl", "aria-label": "Format " + (fi + 1),
            oninput: function (e) { f.libelle = e.target.value; sale(); }
          }),
          inputPrix(f, "prix", false, null, "Prix du format " + (fi + 1) + " (vide = non servi)"),
          boutonIcone("corbeille", "Retirer ce format", function () {
            p.formats.splice(fi, 1);
            if (!p.formats.length) p.prix = null;
            sale();
            rendre();
          }, { danger: true })
        ]);
      }).concat([h("div", { class: "a-formats-actions" }, [
        p.formats.length < 4 ? h("button", { type: "button", class: "a-lien", onclick: function () { p.formats.push({ libelle: "", prix: null }); sale(); rendre(); } }, "+ format") : null,
        h("button", { type: "button", class: "a-lien", onclick: function () {
          var premier = p.formats.filter(function (f) { return typeof f.prix === "number" && !isNaN(f.prix); })[0];
          p.prix = premier ? premier.prix : null;
          p.formats = [];
          sale();
          rendre();
        } }, "prix unique")
      ])]));
    } else {
      prix = h("div", { class: "a-prix-bloc" }, [
        inputPrix(p, "prix", true, base + "-prix", "Prix de " + (p.nom || "ce plat")),
        h("button", { type: "button", class: "a-lien", title: "Par exemple 37,5 cl et 75 cl pour un vin", onclick: function () {
          p.formats = [{ libelle: "", prix: p.prix }, { libelle: "", prix: null }];
          p.prix = null;
          sale();
          rendre();
        } }, "plusieurs prix")
      ]);
    }
    var ligne = h("div", { class: "a-plat" }, [
      h("input", {
        class: "a-input a-plat-nom", value: p.nom, maxlength: "150", placeholder: "Nom du plat", "aria-label": "Nom du plat", "data-cle": base + "-nom",
        "aria-invalid": p.nom.trim() ? null : "true",
        oninput: function (e) {
          p.nom = e.target.value;
          if (p.nom.trim()) e.target.removeAttribute("aria-invalid"); else e.target.setAttribute("aria-invalid", "true");
          sale();
        }
      }),
      h("input", {
        class: "a-input", value: p.desc, maxlength: "200", placeholder: "Précision (facultatif)", "aria-label": "Précision sur " + (p.nom || "ce plat"),
        oninput: function (e) { p.desc = e.target.value; sale(); }
      }),
      prix,
      h("label", { class: "a-case a-case-piment", title: "Pimenté" }, [
        h("input", { type: "checkbox", checked: p.piment, onchange: function (e) { p.piment = e.target.checked; sale(); } }),
        icone("piment"),
        h("span", { class: "a-sr", text: "Pimenté : " + (p.nom || "ce plat") })
      ]),
      h("div", { class: "a-actions" }, [
        boutonIcone("haut", "Monter", function () { etat.focus = "p-" + gi + "-" + deplacer(g.plats, pi, -1) + "-haut"; sale(); rendre(); }, { desactive: pi === 0, cle: base + "-haut" }),
        boutonIcone("bas", "Descendre", function () { etat.focus = "p-" + gi + "-" + deplacer(g.plats, pi, 1) + "-bas"; sale(); rendre(); }, { desactive: pi === g.plats.length - 1, cle: base + "-bas" }),
        boutonIcone("copie", "Dupliquer", function () {
          g.plats.splice(pi + 1, 0, copie(p));
          etat.focus = "p-" + gi + "-" + (pi + 1) + "-nom";
          sale();
          rendre();
        }),
        boutonIcone("corbeille", "Supprimer " + (p.nom || "ce plat"), function () {
          g.plats.splice(pi, 1);
          etat.focus = g.plats.length ? "p-" + gi + "-" + Math.min(pi, g.plats.length - 1) + "-nom" : "g-" + gi + "-ajout";
          sale();
          rendre();
        }, { danger: true })
      ])
    ]);
    ligne._plat = p;
    return ligne;
  }

  /* ---------- Les formules ---------- */

  var TYPES = [
    ["choix", "Au choix"],
    ["ensemble", "Tout compris (+)"],
    ["simple", "Simple ligne"]
  ];

  function rendreFormules() {
    var d = etat.donnees;
    var blocs = d.formules.map(function (g, gi) {
      var menus = g.menus.map(function (m, mi) { return editeurFormule(g, m, gi, mi); });
      return h("section", { class: "a-panneau a-fgroupe", "aria-label": "Groupe " + g.titre }, [
        h("div", { class: "a-cat-tete" }, [
          champ("Groupe de formules", h("input", {
            class: "a-input a-input-titre", value: g.titre, maxlength: "80", "data-cle": "fg-" + gi,
            oninput: function (e) { g.titre = e.target.value; sale(); }
          })),
          h("div", { class: "a-actions" }, [
            boutonIcone("haut", "Monter le groupe", function () { etat.focus = "fg-" + deplacer(d.formules, gi, -1); sale(); rendre(); }, { desactive: gi === 0 }),
            boutonIcone("bas", "Descendre le groupe", function () { etat.focus = "fg-" + deplacer(d.formules, gi, 1); sale(); rendre(); }, { desactive: gi === d.formules.length - 1 }),
            boutonIcone("corbeille", "Supprimer le groupe", function () {
              if (g.menus.length && !window.confirm("Supprimer le groupe « " + g.titre + " » et ses " + g.menus.length + " formules ?")) return;
              d.formules.splice(gi, 1);
              sale();
              rendre();
            }, { danger: true })
          ])
        ]),
        h("div", { class: "a-formules" }, menus),
        boutonAjout("Ajouter une formule", function () {
          g.menus.push({ nom: "Nouvelle formule", prix: null, condition: "", photo: "", photo_alt: "", texte: "",
            services: [{ titre: "Entrée", type: "choix", choix: [] }, { titre: "Plat", type: "choix", choix: [] }] });
          etat.focus = "f-" + gi + "-" + (g.menus.length - 1) + "-nom";
          sale();
          rendre();
        })
      ]);
    });
    contenu.appendChild(h("div", { class: "a-colonne" }, [
      h("p", { class: "a-intro", text: "Les formules apparaissent sur des ardoises, groupe par groupe, dans l’ordre ci-dessous." })
    ].concat(blocs).concat([
      boutonAjout("Ajouter un groupe de formules", function () {
        d.formules.push({ id: "", titre: "Nouveau groupe", menus: [] });
        etat.focus = "fg-" + (d.formules.length - 1);
        sale();
        rendre();
      })
    ])));
  }

  function editeurFormule(g, m, gi, mi) {
    var base = "f-" + gi + "-" + mi;
    var services = m.services.map(function (s, si) {
      var select = h("select", {
        class: "a-input", "aria-label": "Présentation de « " + s.titre + " »",
        onchange: function (e) { s.type = e.target.value; sale(); }
      }, TYPES.map(function (t) { return h("option", { value: t[0], text: t[1] }); }));
      select.value = s.type;
      return h("div", { class: "a-service" }, [
        h("div", { class: "a-service-tete" }, [
          champ("Partie", h("input", {
            class: "a-input", value: s.titre, maxlength: "40", placeholder: "Entrée, Plat, Dessert…", "data-cle": base + "-s" + si,
            oninput: function (e) { s.titre = e.target.value; sale(); }
          })),
          champ("Présentation", select),
          h("div", { class: "a-actions" }, [
            boutonIcone("haut", "Monter", function () { etat.focus = base + "-s" + deplacer(m.services, si, -1); sale(); rendre(); }, { desactive: si === 0 }),
            boutonIcone("bas", "Descendre", function () { etat.focus = base + "-s" + deplacer(m.services, si, 1); sale(); rendre(); }, { desactive: si === m.services.length - 1 }),
            boutonIcone("corbeille", "Supprimer « " + s.titre + " »", function () { m.services.splice(si, 1); sale(); rendre(); }, { danger: true })
          ])
        ]),
        champ("Lignes (une par ligne)", h("textarea", {
          class: "a-input a-texte", rows: String(Math.max(2, s.choix.length + 1)), value: s.choix.join("\n"),
          oninput: function (e) {
            s.choix = e.target.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
            sale();
          }
        }))
      ]);
    });
    var details = h("details", { class: "a-details", open: m.photo || m.texte ? true : null }, [
      h("summary", { text: "Photo et texte (facultatif)" }),
      selectPhoto(m, base + "-photo"),
      champ("Texte sous la photo", h("textarea", {
        class: "a-input a-texte", rows: "2", maxlength: "300", value: m.texte,
        oninput: function (e) { m.texte = e.target.value; sale(); }
      }))
    ]);
    return h("article", { class: "a-formule", "aria-label": "Formule " + m.nom }, [
      h("div", { class: "a-formule-tete" }, [
        champ("Nom", h("input", {
          class: "a-input a-formule-nom", value: m.nom, maxlength: "80", "data-cle": base + "-nom",
          oninput: function (e) { m.nom = e.target.value; sale(); }
        })),
        champ("Prix (€)", inputPrix(m, "prix", true, base + "-prix", "Prix de la formule"))
      ]),
      champ("Condition", h("input", {
        class: "a-input", value: m.condition, maxlength: "120", placeholder: "ex. Midi uniquement, hors week-end et jours fériés",
        oninput: function (e) { m.condition = e.target.value; sale(); }
      }), "Affichée en or avec une horloge. Laisser vide si la formule est servie midi et soir."),
      h("div", { class: "a-services" }, services),
      boutonAjout("Ajouter une partie (entrée, plat, dessert…)", function () {
        m.services.push({ titre: "", type: "choix", choix: [] });
        etat.focus = base + "-s" + (m.services.length - 1);
        sale();
        rendre();
      }),
      details,
      h("div", { class: "a-actions a-formule-actions" }, [
        boutonIcone("haut", "Monter la formule", function () { etat.focus = "f-" + gi + "-" + deplacer(g.menus, mi, -1) + "-nom"; sale(); rendre(); }, { desactive: mi === 0 }),
        boutonIcone("bas", "Descendre la formule", function () { etat.focus = "f-" + gi + "-" + deplacer(g.menus, mi, 1) + "-nom"; sale(); rendre(); }, { desactive: mi === g.menus.length - 1 }),
        boutonIcone("copie", "Dupliquer la formule", function () {
          g.menus.splice(mi + 1, 0, copie(m));
          etat.focus = "f-" + gi + "-" + (mi + 1) + "-nom";
          sale();
          rendre();
        }),
        boutonIcone("corbeille", "Supprimer la formule", function () {
          if (!window.confirm("Supprimer la formule « " + m.nom + " » ?")) return;
          g.menus.splice(mi, 1);
          sale();
          rendre();
        }, { danger: true })
      ])
    ]);
  }

  /* ---------- Sauvegardes ---------- */

  var formatDate = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  function rendreSauvegardes() {
    var lignes = etat.sauvegardes.map(function (s) {
      return h("li", { class: "a-sauvegarde" }, [
        h("span", { text: formatDate.format(new Date(s.date)).replace(":", "h") }),
        h("button", {
          type: "button", class: "a-bouton a-bouton-discret",
          onclick: function () {
            var msg = "Remettre la carte telle qu’elle était le " + formatDate.format(new Date(s.date)).replace(":", "h") + " et la publier ?";
            if (etat.sale) msg += "\n\nVos modifications non publiées seront perdues.";
            if (!window.confirm(msg)) return;
            etat.occupe = true;
            majBarre("Restauration…");
            api("restaurer", "POST", { nom: s.nom }).then(function (j) {
              etat.occupe = false;
              if (j.ok) {
                etat.donnees = j.donnees;
                etat.sauvegardes = j.sauvegardes;
                etat.sale = false;
                etat.erreurs = [];
                rendre();
                majBarre(j.message, "ok");
              } else {
                majBarre(j.message || "La restauration a échoué.", "erreur");
              }
            });
          }
        }, "Restaurer cette version")
      ]);
    });
    contenu.appendChild(h("section", { class: "a-panneau a-colonne-etroite", "aria-labelledby": "t-sauv" }, [
      h("h2", { class: "a-titre", id: "t-sauv", text: "Sauvegardes" }),
      h("p", { class: "a-intro", text: "À chaque publication, la version précédente de la carte est gardée (les 30 dernières). Restaurer une version la republie aussitôt." }),
      lignes.length ? h("ul", { class: "a-sauvegardes", role: "list" }, lignes) : h("p", { class: "a-vide", text: "Aucune sauvegarde pour l’instant : elles apparaîtront après la première publication." })
    ]));
  }

  /* ---------- Mot de passe ---------- */

  function rendreCompte() {
    var actuel = h("input", { class: "a-input", type: "password", autocomplete: "current-password", required: true });
    var nouveau = h("input", { class: "a-input", type: "password", autocomplete: "new-password", minlength: "10", required: true });
    var confirme = h("input", { class: "a-input", type: "password", autocomplete: "new-password", minlength: "10", required: true });
    var retour = h("p", { class: "a-retour-form", role: "status" });
    var form = h("form", {
      class: "a-form",
      onsubmit: function (e) {
        e.preventDefault();
        if (nouveau.value !== confirme.value) {
          retour.className = "a-retour-form a-erreur";
          retour.textContent = "Les deux nouveaux mots de passe ne sont pas identiques.";
          return;
        }
        api("mot_de_passe", "POST", { actuel: actuel.value, nouveau: nouveau.value }).then(function (j) {
          retour.className = "a-retour-form " + (j.ok ? "a-ok" : "a-erreur");
          retour.textContent = j.message || (j.ok ? "Mot de passe modifié." : "Échec.");
          if (j.ok) form.reset();
        });
      }
    }, [
      champ("Mot de passe actuel", actuel),
      champ("Nouveau mot de passe", nouveau, "10 caractères au moins."),
      champ("Le nouveau, une seconde fois", confirme),
      h("button", { type: "submit", class: "a-bouton a-bouton-principal" }, "Changer le mot de passe"),
      retour
    ]);
    contenu.appendChild(h("section", { class: "a-panneau a-colonne-etroite", "aria-labelledby": "t-mdp" }, [
      h("h2", { class: "a-titre", id: "t-mdp", text: "Mot de passe" }),
      form
    ]));
  }

  charger();
})();
