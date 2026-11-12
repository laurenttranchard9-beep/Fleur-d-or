---
name: Aux Saveurs du Cambodge
description: Une vitrine minimaliste à la manière d'apple.com — tuiles noires et gris perle, police du système, un seul bleu pour agir, les plats comme des produits.
colors:
  blanc: "#FFFFFF"
  perle: "#F5F5F7"
  verre: "rgb(250 250 252 / 0.8)"
  verre-plein: "#FAFAFC"
  noir: "#000000"
  encre: "#1D1D1F"
  gris: "#6E6E73"
  gris-nuit: "#86868B"
  filet: "#D2D2D7"
  pied-lien: "#424245"
  bleu: "#0071E3"
  bleu-appuye: "#0066CC"
  lien: "#0066CC"
  lien-nuit: "#2997FF"
  ouvert: "#34C759"
  commande: "#FF9F0A"
  ferme: "#FF3B30"
  erreur: "#D70015"
  succes: "#1D7A35"
typography:
  manifeste:
    fontFamily: "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "64px"
    fontWeight: 600
    lineHeight: 1.0625
    letterSpacing: "-0.009em"
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "56px"
    fontWeight: 600
    lineHeight: 1.07143
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "0"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.125
    letterSpacing: "0.004em"
  tagline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: 1.14286
    letterSpacing: "0.007em"
  subhead:
    fontFamily: "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "21px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.011em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.47059
    letterSpacing: "-0.022em"
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.42859
    letterSpacing: "-0.016em"
  footnote:
    fontFamily: "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.33337
    letterSpacing: "-0.01em"
rounded:
  pilule: "980px"
  carte: "18px"
  champ: "12px"
  cercle: "50%"
spacing:
  navigation: "44px"
  gouttiere: "22px"
  entre-tuiles: "12px"
  haut-de-tuile: "52px"
  tuile-pleine: "692px"
  tuile-demi: "580px"
  cible-tactile: "44px"
  texte-max: "980px"
components:
  bouton:
    backgroundColor: "{colors.bleu}"
    textColor: "{colors.blanc}"
    typography: "{typography.body}"
    rounded: "{rounded.pilule}"
    padding: "11px 21px"
    height: "{spacing.cible-tactile}"
  bouton-hover:
    backgroundColor: "{colors.bleu-appuye}"
  bouton-contour:
    backgroundColor: "transparent"
    textColor: "{colors.lien}"
    typography: "{typography.body}"
    rounded: "{rounded.pilule}"
    padding: "11px 21px"
    height: "{spacing.cible-tactile}"
  bouton-contour-hover:
    backgroundColor: "{colors.bleu}"
    textColor: "{colors.blanc}"
  bouton-contour-nuit:
    backgroundColor: "transparent"
    textColor: "{colors.lien-nuit}"
  lien-chevron:
    textColor: "{colors.lien}"
  navigation:
    backgroundColor: "{colors.verre}"
    textColor: "{colors.encre}"
    typography: "{typography.footnote}"
    height: "{spacing.navigation}"
  ruban:
    backgroundColor: "{colors.perle}"
    textColor: "{colors.encre}"
    typography: "{typography.caption}"
    padding: "13px 22px"
  tuile-noire:
    backgroundColor: "{colors.noir}"
    textColor: "{colors.perle}"
  tuile-claire:
    backgroundColor: "{colors.perle}"
    textColor: "{colors.encre}"
  champ-recherche:
    backgroundColor: "{colors.blanc}"
    textColor: "{colors.encre}"
    rounded: "{rounded.champ}"
    padding: "0 16px 0 46px"
    height: "52px"
  bouton-ajout:
    backgroundColor: "{colors.blanc}"
    textColor: "{colors.bleu}"
    rounded: "{rounded.cercle}"
    size: "32px"
  bouton-ajout-actif:
    backgroundColor: "{colors.bleu}"
    textColor: "{colors.blanc}"
  commande:
    backgroundColor: "{colors.perle}"
    textColor: "{colors.encre}"
    rounded: "{rounded.carte}"
    padding: "24px"
---

# Design System: Aux Saveurs du Cambodge

<!-- Système relevé sur le site livré (public/) après la refonte demandée le 03/11/2026 : « minimaliste comme le site d'Apple ». -->

## Overview

**Creative North Star: "La vitrine produit"**

Chaque plat est présenté comme Apple présente un produit : seul, centré, vu du dessus, sur une tuile pleine largeur noire ou gris perle, avec un nom court, une phrase et un prix. L'interface se retire : trois fonds (blanc, perle, noir), une police, un bleu. Toute la couleur de la page vient des plats dessinés ; le reste est de l'air, du texte demi-gras serré et des pilules bleues.

La page se lit comme une suite de tuiles : le nom du restaurant et le bol de soupe sur noir, la box anti-crise à 10 € sur perle, quatre plats en grille de deux, une phrase manifeste sur blanc, les horaires, l'adresse et son plan. La carte reprend la même retenue pour lire 85 plats : une barre locale collante en verre dépoli, des lignes séparées par des filets, un cercle bleu pour ajouter, une fiche « Votre commande » gris perle.

**Key Characteristics:**
- Tuiles pleine largeur noires (#000000) et gris perle (#F5F5F7), séparées par 12 px de blanc
- Police du système d'Apple (SF Pro) sur ses appareils, Inter auto-hébergée ailleurs ; titres demi-gras serrés
- Un seul bleu d'action : pilules pleines ou en contour, cercle d'ajout, compteur
- Les plats dessinés vus du dessus, coupés par le bas de leur tuile
- Verre dépoli réservé à ce qui reste collé au-dessus du contenu
- Prix en chiffres tabulaires, au format « 10,00 € »
- Un site vivant mais sobre : le nom se lève mot après mot, le bol fume, la soupe se prépare au fil du défilement, le reste répond au geste
- Un espace gestion au même système : prix et statistiques, sans un pixel de décor

## Colors

Une palette sans teinte : blanc, gris perle, noir, deux gris de texte, et le bleu d'Apple pour agir.

### Primary
- **Bleu d'action** (bleu) : fond des boutons pilules pleins (Appeler, Commander, Itinéraire), contour des pilules secondaires, cercle d'ajout de la carte, pastille du compteur de commande, anneau de focus. Survol : **bleu appuyé**.
- **Bleu de lien** (lien) : liens à chevron « Découvrir la carte › », texte des pilules en contour sur fond clair. Sur noir, **bleu de nuit** (lien-nuit).

### Neutral
- **Blanc** : fond de page, des pages de texte, de la tuile Accès et du manifeste.
- **Gris perle** (perle) : tuiles claires, ruban d'état, fiche « Votre commande », pied de page.
- **Noir** : tuile du héros et tuiles sombres de la grille.
- **Encre** : tout le texte sur fond clair ; texte des tuiles noires en gris perle.
- **Gris** : texte secondaire sur clair (détails, descriptions, notes) ; **gris de nuit** : texte secondaire sur noir.
- **Filet** : séparateurs de lignes de plats, du tableau des horaires et du pied de page.
- **Verre** (blanc à 80 %, flou 20 px, saturation 180 %) : navigation, rubriques de la carte, barre de commande mobile ; **verre plein** quand le flou n'est pas disponible ou que le menu mobile est ouvert.

### Tertiary
- **Pastilles d'état** : ouvert, midi sur commande, fermé — uniquement le point devant l'état d'ouverture, jamais du texte ni un fond.
- **Erreur** et **succès** : espace gestion seulement — texte et fond pâle d'un message, contour d'un champ refusé, bouton « Effacer les statistiques ». Jamais sur le site public.

### Named Rules
**The One Blue Rule.** Le bleu est la seule couleur d'action. Rien d'autre n'est cliquable en couleur ; les pastilles d'état sont des points, pas des boutons.

**The Dish Is The Color Rule.** L'interface n'a pas de teinte : la couleur de la page vient des plats dessinés (bouillon, herbes, crevettes). Une nouvelle surface n'ajoute pas de couleur d'interface, elle ajoute un plat.

**The Three Grounds Rule.** Trois fonds seulement : blanc pour lire, perle et noir pour les tuiles. Deux tuiles de même fond ne se touchent jamais sans les 12 px de blanc qui les séparent.

## Typography

**Display Font:** SF Pro, par la police du système (-apple-system, BlinkMacSystemFont), sur les appareils Apple
**Body Font:** la même ; ailleurs Inter (Rasmus Andersson, SIL OFL 1.1), variable 400–700 avec axe de taille optique, auto-hébergée (75 Ko), affichée dès son arrivée (`font-display: swap`)

**Character:** une seule famille, celle de la référence. La hiérarchie vient de la taille et de l'interligne, pas des graisses : 600 pour les titres, 400 pour tout le reste. Approche resserrée sur les grands corps, légèrement ouverte sur les sous-titres, comme sur apple.com.

### Hierarchy
- **Manifeste** (600, 64 px / 48 px / 40 px selon l'écran, interligne 1,06) : la phrase « Tout est fait maison. Avec des produits frais. Et beaucoup d'amour. »
- **Display** (600, 56 px, 48 px sous 1068 px, 40 px sous 734 px, interligne 1,07) : nom du restaurant, titres des tuiles pleine largeur, « La carte ».
- **Headline** (600, 40 px, 32 px sous 1068 px) : noms des plats dans la grille.
- **Title** (600, 32 px, 28 px sur mobile) : rubriques de la carte.
- **Tagline** (400, 28 px, 24 px puis 21 px) : phrase sous un titre de tuile pleine largeur.
- **Subhead** (400, 21 px, interligne 1,3 pour rester lisible sur deux lignes) : phrase des tuiles de la grille, accroche de la carte, titre de la fiche commande (en 600).
- **Body** (400, 17 px, interligne 1,47) : texte courant, boutons, noms de plats (en 600), prix.
- **Caption** (400, 14 px) : descriptions de plats, rubriques, ruban d'état, notes.
- **Footnote** (400, 12 px) : liens de navigation, pied de page, crédits.

### Named Rules
**The System Voice Rule.** Une seule famille : SF Pro par la police du système chez Apple, Inter auto-hébergée ailleurs. C'est la police de la référence demandée, pas un repli faute de mieux.

**The Semibold Ceiling Rule.** Le gras s'arrête à 600. Un titre gagne sa place par sa taille, jamais par une graisse plus forte, une capitale ou une couleur.

**The Tabular Price Rule.** Un prix s'écrit « 10,00 € » (Intl fr-FR) en chiffres tabulaires, aligné à droite.

**The Fine Space Rule.** Espace fine insécable avant « ? ! : ; » et dans « « » » ; gluon après le tiret des plages horaires pour que « 18 h – 21 h 45 » ne se coupe pas.

## Layout

Tout est centré. Les tuiles pleine largeur font 692 px de haut sur grand écran, texte en haut à 52 px du bord, image en bas ; la grille de plats est en deux colonnes de 580 px de haut, séparées et bordées de 12 px. Le texte ne dépasse jamais 980 px de large ; les tuiles de la grille, 40rem. Marges latérales de 22 px, 16 px sous 734 px.

Points de rupture : 1068 px (sous ce seuil les tuiles perdent leur hauteur fixe, la commande devient une feuille basse et une barre « Votre commande » apparaît), 833 px (la navigation passe au bouton menu, 48 px de haut), 734 px (une colonne, corps réduits). Sur la carte, au-delà de 1068 px, trois colonnes : index des rubriques (200 px), liste, fiche commande (320 px), les deux bords collants.

### Named Rules
**The Hot Dish Rule.** Seul ce qui vit pour de vrai bouge en boucle : la vapeur d'un plat chaud, la pastille « ouvert », l'épingle du plan. Jamais hors de l'écran, jamais en mouvement réduit.

**The One Scene Rule.** Une page a au plus une scène liée au défilement, et elle raconte le produit : sur l'accueil, la soupe se prépare. Tout le reste se révèle une fois et s'arrête.

**The Centered Tile Rule.** Une tuile porte un seul sujet, dans cet ordre : titre, phrase, détail en gris, deux actions (pleine puis contour), image centrée qui sort par le bas.

## Elevation & Depth

Aucune ombre d'interface. La profondeur vient de deux choses : l'ombre floue que chaque plat dessiné porte sous lui, et le verre dépoli des barres qui restent collées au-dessus du contenu. Le voile de la feuille de commande mobile (noir à 32 %) est le seul assombrissement.

### Named Rules
**The Glass Only When Sticky Rule.** Le verre dépoli ne sert qu'à ce qui flotte au-dessus du contenu qui défile : navigation, rubriques, barre de commande. Jamais sur une carte posée dans la page.

## Shapes

Ce qui agit est une pilule (980 px) ou un cercle ; ce qui contient est arrondi à 18 px (fiche commande, plan, feuille mobile) ; le champ de recherche et la ligne du jour à 12 px. Filets de 1 px pour séparer, jamais de cadre autour d'une liste.

### Named Rules
**The Pill Rule.** Un bouton est toujours une pilule pleine ou en contour, jamais un rectangle ; une action dans une ligne est un cercle de 32 px.

## Components

### Buttons
- **Forme :** pilule (980 px), 17 px, 11 × 21 px de marge intérieure, 44 px de haut.
- **Plein :** fond bleu, texte blanc ; survol bleu appuyé. Toujours l'action principale : Appeler, Commander, Itinéraire.
- **Contour :** 1 px de bleu, texte bleu de lien ; au survol, il se remplit de bleu. Sur noir, bleu de nuit, rempli au survol avec un texte noir.
- **Lien à chevron :** texte bleu suivi d'un chevron dessiné (trait 2,6), souligné au survol.

### Ruban d'état
- Bande gris perle sous la navigation, centrée : pastille d'état, texte court calculé à l'heure de Paris (« Ouvert jusqu'à 14 h », « Fermé · ouvre à 18 h »), puis « Appeler › ».
- Sans JavaScript, il affiche le résumé des horaires ; avec, le texte statique ne s'affiche pas avant l'état en direct, pour que rien ne bouge.

### Tuiles
- **Pleine largeur** (héros, box anti-crise à 10 €, horaires, accès) et **demi** (grille de plats), noires ou perle, contenu centré selon The Centered Tile Rule.
- Le plat dessiné mesure 520 px (380 px dans la grille, 360 px sur mobile) et sort de 16 à 20 % par le bas.

### Inputs / Fields
- **Recherche :** fond blanc, contour gris de nuit de 1 px (3,5:1), rayon 12 px, 52 px de haut, loupe à gauche ; au focus, contour bleu et halo bleu de 4 px.

### Navigation
- Verre dépoli de 44 px, collé en haut : nom du restaurant (14 px, 600) à gauche, liens de 12 px au centre, téléphone à droite.
- Sous 833 px : nom, icône téléphone et bouton menu à deux traits qui se croisent ; le menu ouvert couvre l'écran en blanc, liens en 28 px demi-gras, le reste de la page inerte.
- Carte : barre locale collante des rubriques, soulignée d'un trait de 2 px qui glisse sous la rubrique en cours (index vertical sur grand écran).

### Scène « fait maison » (moment fort)
- Une tuile noire de 3,4 écrans de haut ; son cadre reste collé à l'écran pendant qu'on la traverse.
- En haut, les trois phrases du restaurant, centrées (56 px, 40 px sur mobile), grises puis blanches à mesure qu'elles arrivent ; en bas, la soupe Phnom Penh vue du dessus, en deux couches : le bol vide (image) et la garniture (dessin inséré dans la page, un groupe par ingrédient).
- Au défilement : le bouillon se verse depuis le centre, les nouilles arrivent en tournant, le porc, les crevettes, les herbes, l'ail et les piments tombent dans le bol (ils viennent de plus près, donc plus grands, et se posent), le citron vert se pose, les baguettes glissent ; le bol entier se redresse de −30° et grandit de 10 %. Puis le détail des saveurs et « Découvrir la carte › » apparaissent, et le bol se met à fumer.
- Sans JavaScript : une tuile normale, la soupe complète, les phrases en blanc.
- En mouvement réduit : la tuile ne s'épingle pas et rien ne bouge, mais les ingrédients apparaissent en fondu, dans le même ordre, pendant que le bol entre dans l'écran, et les phrases s'allument de même.
- « Découvrir la carte › » devient visible dès qu'il reçoit le focus, même avant la fin de la scène.

### Vapeur
- Trois voiles blancs en dégradé radial au-dessus d'un bol chaud (héros, fin de la scène) : ils montent vers nous en grandissant et se dissipent, 7 à 8,6 s chacun, décalés.
- Seulement quand le plat est posé et à l'écran ; rien en mouvement réduit.

### Votre commande (signature)
- Grand écran : fiche gris perle (rayon 18 px) collée dans la colonne de droite. Mobile et tablette : feuille blanche qui monte du bas sur un voile, ouverte depuis la barre « Votre commande ».
- Chaque plat a son cercle bleu « + » ; dans la commande, la quantité s'affiche en pastille noire sur le cercle devenu plein.
- Lignes : nom, montant, boutons − / + ; total en 600 ; « Appeler pour commander » en pilule pleine largeur ; « Tout retirer » en lien.
- Mouvement : le cercle touché fait une onde bleue ; un jeton bleu « +1 » vole en parabole du cercle jusqu'au total (ou jusqu'au sac de la barre, qui remue), 620 ms ; le total défile jusqu'à sa nouvelle valeur (420 ms), total et compteur pulsent une fois.

### Pied de page
- Gris perle, 12 px : notes (prix, dessins, crédits, mesure d'audience), plan du site en trois colonnes, puis la ligne du bas : copyright à gauche ; « Mentions légales » et « Espace gestion » à droite, séparés d'un filet (côte à côte sans filet sur mobile, cibles de 44 px). « Espace gestion » mène à la connexion de l'espace gestion.

### Espace gestion (outil)
- Mode « Operate » : le même système en version outil, pour une personne qui gère le restaurant, souvent sur téléphone.
- Fond gris perle, contenus sur des fiches blanches arrondies à 18 px ; barre du haut en verre collante : « Gestion », sections en commande segmentée (Statistiques, Prix, Réglages), « Voir le site », « Se déconnecter ».
- Statistiques : un seul grand nombre par vue (visiteurs, 64 px demi-gras, chiffres proportionnels) et sa phrase ; histogramme des visites (barres d'encre de 24 px au plus, bout arrondi de 4 px, base carrée, 2 px d'écart, filets de graduation à 0, la moitié et le haut, bleu au survol et au clavier avec une info-bulle qui glisse avec la position du jour pour rester dans le cadre, tableau des chiffres repliable) ; actions en quatre colonnes séparées de filets ; listes classées avec un trait de 6 px sur une piste perle.
- Prix : une ligne par plat (nom, description, champ de prix aligné à droite suivi de « € »), un champ modifié passe au bleu pâle, le prix d'origine rappelé dessous ; barre « Enregistrer les prix » en verre collée en bas, avec le compte des prix modifiés ; un champ atteint au clavier ne passe jamais sous une barre collante.
- Réglages : interrupteur vert à la manière d'iOS pour la mesure d'audience, case de confirmation avant d'effacer, champs de mot de passe.
- Mouvement d'outil : les barres poussent depuis la base au chargement (700 ms), les traits des listes s'étirent ; rien d'autre.

## Do's and Don'ts

### Do:
- **Do** présenter un plat comme un produit : seul, vu du dessus, centré sur une tuile noire ou perle, coupé par le bas.
- **Do** garder le bleu (#0071E3) pour l'action et le bleu de lien (#0066CC, #2997FF sur noir) pour les liens à chevron.
- **Do** écrire les prix « 10,00 € » en chiffres tabulaires, alignés à droite.
- **Do** garder des cibles tactiles de 44 px et un focus bleu visible de 2 px.
- **Do** dévoiler une seule fois : le héros au chargement (nom qui se lève mot après mot, texte qui monte en 1 s, bol qui se pose en tournant en 1,6 s), chaque tuile en entrant à l'écran ; en mouvement réduit, les mêmes révélations en simple fondu, sans aucun déplacement.
- **Do** ne faire boucler que ce qui est vivant pour de vrai : la vapeur d'un plat chaud, la pastille « ouvert », l'onde de l'épingle du plan ; chacune seulement à l'écran.
- **Do** garder une seule scène liée au défilement par page : la soupe qui se prépare.
- **Do** signaler les dessins comme dessins (« (illustration) » dans le texte alternatif, note de pied de page) tant qu'il n'y a pas de vraies photos.

### Don't:
- **Don't** ajouter une couleur d'interface : pas de rouge, d'or, de vert, hors des pastilles d'état.
- **Don't** mettre de sur-titre ou d'étiquette (« Nouveau ») au-dessus d'un titre de tuile.
- **Don't** dépasser le demi-gras (600) ni composer de titre en capitales.
- **Don't** poser de texture, d'ornement, de photo d'ambiance sombre ou d'ombre portée sur l'interface.
- **Don't** utiliser de dégradé de texte ni de verre dépoli sur ce qui ne reste pas collé à l'écran.
- **Don't** présenter un dessin comme une photo des plats de la maison.
