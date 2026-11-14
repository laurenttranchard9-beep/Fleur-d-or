---
version: 1
slug: "public-admin-index-php"
primary_target: "public/admin/index.php"
related_targets: ["public/admin/admin.css", "public/admin/admin.js", "public/inc/gestion.php"]
---

# Surface brief — espace gestion (public/admin/)

## Scope and mode
- Operate. Une seule personne, celle qui tient le restaurant : changer un prix entre deux services, souvent sur téléphone ; regarder une fois par semaine si le site amène des appels.
- Demande du 06/11/2026 : « créer un panel pour gérer les stats avec des cookies et pour modifier les prix ».
- Extension du monde existant (DESIGN.md) : pas de tirage de direction, pas de nouveau langage visuel.

## Direction contract

THESIS: Le réglage d'un appareil Apple appliqué à un restaurant : trois sections nettes (Statistiques, Carte, Réglages), des chiffres lisibles d'un coup d'œil et des prix qu'on change comme on tape un montant. Refuse le tableau de bord générique en cartes de métriques colorées, icônes et jauges.

OWN-WORLD: Fond gris perle #F5F5F7, fiches blanches arrondies à 18 px, encre #1D1D1F, gris #6E6E73 ; un seul bleu #0071E3 pour agir et pour la donnée sélectionnée ; commande segmentée à la manière d'iOS, interrupteur vert d'iOS ; rouge #D70015 réservé aux erreurs et à l'effacement. Police du système, comme le site.

STORY: À la connexion, la personne voit combien de visiteurs sont venus, combien ont appelé ou préparé une commande, ce qu'ils ont cherché et ajouté. Dans Carte, elle trouve un plat, tape le nouveau prix, le renomme, retouche sa description ou le range ailleurs, crée une rubrique ou un plat, enregistre, et la carte en ligne change aussitôt. Dans Statistiques, elle voit aussi à quelle heure les clients arrivent et combien de temps ils restent. Dans Réglages, elle coupe la mesure, efface les chiffres ou change son mot de passe.

FIRST VIEWPORT: Bureau 1280×900 : barre de verre de 52 px (« Gestion », sections segmentées au centre, « Voir le site » et « Se déconnecter » à droite) ; « Statistiques » en 40 px et la période segmentée (7 jours, 30 jours, 12 mois) ; une fiche blanche avec le nombre de visiteurs en 64 px et sa phrase ; dessous, l'histogramme des visites par jour. Mobile 390×844 : sections segmentées sur toute la largeur sous la barre, le même ordre en une colonne.

FORM: Extension Operate du canon épinglé par l'utilisateur (« minimaliste comme le site d'Apple ») ; pas de tirage (extension d'un monde établi) ; code-led.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Depuis le 14/11/2026, tout se change en ligne sauf retirer un plat d'origine ou réordonner les rubriques d'origine (demande : « ajouter des catégories de plats et modifier les noms des plats »). Le fichier Excel des prix (tools/excel-prix.py) reprend `data/carte.json`, pas ces changements.
