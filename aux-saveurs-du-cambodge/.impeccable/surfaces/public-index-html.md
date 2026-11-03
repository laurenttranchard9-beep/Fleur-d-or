---
version: 1
slug: "public-index-html"
primary_target: "public/index.html"
related_targets: ["public/carte/index.html"]
---

# Surface brief — accueil (public/index.html) + carte (public/carte/index.html)

## Scope and mode
- Accueil : Persuade. Carte : Read/Operate (scanner 86 plats, préparer une commande téléphonique).
- Audience : voisins du nord toulousain sur mobile, pause déjeuner ou commande du soir. Action : appeler (07 59 52 53 41), sinon itinéraire ou carte.
- Demande du 03/11/2026 : « fait un site qui soit minimaliste comme le site de Apple ». Elle remplace la direction « étal de marché » (toujours dans l'historique, commit ba701ed).
- Référence relevée sur apple.com/fr le 03/11/2026 : tuiles pleine largeur noires et gris clair, titre centré 40–56 px demi-gras, sous-titre 28 px, boutons pilules bleus plein et contour, grande image produit centrée, navigation 44 px, pied de page gris en 12 px.

## Direction contract

THESIS: Une vitrine épurée à la manière d'Apple : chaque plat est présenté comme un produit, seul et centré sur une tuile noire ou gris très clair, avec un nom court, une phrase et un prix. Le téléphone reste à un geste et l'état d'ouverture tient dans un bandeau. Refuse la vitrine de restaurant chargée (photos sombres, textures, ornements) comme l'étal coloré précédent.

OWN-WORLD: Blanc, gris #F5F5F7 et noir en tuiles pleine largeur ; texte #1D1D1F, gris #6E6E73 ; bleu #0071E3 pour les boutons pilules, #0066CC (#2997FF sur noir) pour les liens à chevron ; aucune autre couleur dans l'interface : la couleur vient seulement des plats dessinés vus du dessus (aplats, dégradés doux, ombre floue). Police système d'Apple (SF Pro via -apple-system) et Inter auto-hébergée ailleurs ; titres demi-gras serrés, beaucoup d'air.

STORY: En un écran, le visiteur sait qui c'est, voit dans le bandeau si c'est ouvert et peut appeler. Il fait défiler des tuiles « produit » (menu à 10 €, lok lac, bo bun, nems, porc au caramel), lit la promesse « fait maison », les horaires et l'adresse. Sur la carte, il cherche, ajoute au bon de commande et appelle.

FIRST VIEWPORT: Desktop 1440×900 : navigation translucide de 44 px (nom à gauche, liens de 12 px au centre, téléphone à droite) ; bandeau d'état gris clair centré ; tuile noire : « Aux Saveurs du Cambodge » 56 px centré, sous-titre 28 px, ligne grise, boutons pilules « Appeler » (plein) et « Voir la carte » (contour), le bol de soupe vu du dessus centré sous le texte qui dépasse en bas de l'écran. Mobile 390×844 : même pile centrée, titre 40 px, boutons côte à côte, bol de 360 px (94 % de la largeur), coupé par le bas comme sur bureau.

FORM: Canon épinglé par l'utilisateur (« minimaliste comme le site d'Apple ») ; seed key b7e0bfa3, tirage (index 3) écarté parce que la demande explicite l'emporte ; code-led (pas de génération d'images).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Motion
- Moment fort : au chargement, le titre et les boutons montent en fondu, puis le bol de soupe s'élève en tournant légèrement, comme un produit qu'on dévoile.
- Défilement : chaque tuile révèle son texte puis son plat une seule fois en entrant à l'écran (fondu, montée de 36 px, le plat de 90 px). Rien ne tourne en boucle.
- Défilement lié (navigateurs qui gèrent `animation-timeline`, sinon rien) : le plat d'une tuile tourne de −10° à +10° pendant qu'elle traverse l'écran, comme un produit qu'on fait pivoter ; le manifeste s'allume phrase après phrase, du gris au noir.
- Retour d'action : bandeau d'état en fondu ; sur la carte, un point bleu vole du plat jusqu'au bon, les lignes entrent et sortent, un trait souligne la rubrique en cours ; transition douce entre les pages.
- Mouvement réduit : aucun déplacement, fondus conservés.

## Unresolved
- Identité légale (raison sociale, SIRET, directeur de publication) pour les mentions légales.
- Photos réelles des plats : les dessins sont prévus pour être remplacés.
- Service sur place confirmé ? Moyens de paiement ? Fermetures annuelles ?
