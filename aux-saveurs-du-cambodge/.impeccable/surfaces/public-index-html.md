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
- Demande du 06/11/2026 : « ajoute plus d'animation sur le site, il faut que ce soit vivant ». Elle complète la direction sans la changer.
- Thèse : la cuisine est vivante, l'interface reste calme. Le moment fort est une scène liée au défilement où la soupe Phnom Penh se prépare sous les yeux, ingrédient par ingrédient, pendant que s'allument les trois phrases du restaurant ; c'est la version « produit » d'apple.com (une vue éclatée qui se rassemble), appliquée à un plat fait maison.
- Héros : le nom se lève mot après mot depuis son cache (1,05 s, 70 ms d'écart), le reste monte en fondu, le bol se pose en tournant, puis fume (trois voiles, seulement à l'écran).
- Défilement : chaque tuile se révèle une fois ; le plat d'une tuile pivote de −10° à +10° pendant qu'elle traverse l'écran (lié au défilement par le navigateur, ou par le script là où il ne sait pas le faire : Firefox, Safari d'avant 26) et, sur ordinateur, s'incline sous la souris.
- États vivants : la pastille « ouvert » et l'épingle du plan émettent une onde lente, seulement à l'écran.
- Carte : les plats d'une rubrique arrivent à la file (28 ms d'écart, 10 au plus) ; le « + » touché fait une onde ; le jeton « +1 » vole jusqu'au total ou au sac, qui remue ; le total défile jusqu'à sa nouvelle valeur.
- Budget : rien d'animé hors de l'écran ; la garniture de la scène est un SVG sans flou (pas de filtre à repeindre), le bol vide une image fixe ; 60 images par seconde mesurées avec un processeur ralenti six fois sur mobile.
- Sans JavaScript : aucune boucle, aucun déplacement, la scène devient une tuile normale avec la soupe complète.
- Mouvement réduit (souvent activé sans le savoir sous Windows ou sur iPhone) : aucune boucle, aucun déplacement ni rotation, mais des fondus. Le nom apparaît mot après mot, les tuiles et les plats de la carte en entrant à l'écran, la soupe se garnit en fondu pendant que le bol entre dans l'écran. « Réduire » ne veut pas dire « figer » (demande du 06/11/2026 : « les animations ne marchent pas »).

## Unresolved
- Photos réelles des plats : les dessins sont prévus pour être remplacés.
- Service sur place confirmé ? Moyens de paiement ? Fermetures annuelles ?
