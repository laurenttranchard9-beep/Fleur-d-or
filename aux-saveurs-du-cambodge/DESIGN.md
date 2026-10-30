---
name: Aux Saveurs du Cambodge
description: L'étal de marché cambodgien de Saint-Alban — curcuma, feuille de bananier, piment et sucre de palme.
colors:
  curcuma: "#F2A51C"
  curcuma-clair: "#F7C25A"
  curcuma-pale: "#FDE7B4"
  feuille: "#1B5232"
  feuille-2: "#2C7343"
  feuille-clair: "#B9DB95"
  feuille-encre: "#16472B"
  piment: "#C8261B"
  piment-fonce: "#A51D14"
  sucre: "#2A170D"
  sucre-doux: "#5A3416"
  riz: "#FFFBF3"
  riz-2: "#F4EAD6"
  riz-texte: "#6A5442"
  papier-bon: "#FFFDF8"
  pied-texte: "#D9C7AD"
  pied-note: "#CBB89C"
typography:
  enseigne:
    fontFamily: "Moul, Kantumruy Pro, serif"
    fontSize: "clamp(2.2rem, 0.9rem + 5.2vw, 4.05rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.01em"
  enseigne-khmer:
    fontFamily: "Moul, Kantumruy Pro, serif"
    fontSize: "clamp(1.5rem, 1rem + 2.2vw, 2.75rem)"
    fontWeight: 400
    lineHeight: 1.55
  headline:
    fontFamily: "Kantumruy Pro, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.3rem + 2.6vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Kantumruy Pro, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 1.25rem + 1.1vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Kantumruy Pro, Segoe UI, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Kantumruy Pro, Segoe UI, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 700
    letterSpacing: "0.06em"
  prix:
    fontFamily: "Kantumruy Pro Prix, Kantumruy Pro, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
rounded:
  etiquette: "0.45rem"
  base: "0.5rem"
  plan: "0.6rem"
  bandeau: "0.75rem"
  feuille-bon: "1rem"
  tampon: "1.25rem"
  pastille: "999px"
spacing:
  marge: "clamp(1rem, 4vw, 3rem)"
  conteneur: "80rem"
  section: "clamp(4rem, 3rem + 5vw, 8rem)"
  cible-tactile: "2.75rem"
  bouton: "3.25rem"
components:
  bouton-appel:
    backgroundColor: "{colors.piment}"
    textColor: "{colors.riz}"
    rounded: "{rounded.base}"
    padding: "0.5rem 1.35rem"
    height: "{spacing.bouton}"
  bouton-appel-hover:
    backgroundColor: "{colors.piment-fonce}"
  bouton-trait:
    backgroundColor: "transparent"
    textColor: "{colors.sucre}"
    rounded: "{rounded.base}"
    padding: "0.5rem 1.35rem"
    height: "{spacing.bouton}"
  bouton-trait-hover:
    backgroundColor: "{colors.sucre}"
    textColor: "{colors.curcuma-clair}"
  etat-etiquette:
    backgroundColor: "{colors.riz}"
    textColor: "{colors.sucre}"
    rounded: "{rounded.base}"
    padding: "0.5rem 0.95rem 0.5rem 0.3rem"
  etiquette-pendue:
    backgroundColor: "{colors.riz}"
    textColor: "{colors.sucre}"
    rounded: "{rounded.etiquette}"
    padding: "0.7rem 1.1rem 0.75rem 2.4rem"
  prix-etiquette:
    backgroundColor: "{colors.curcuma}"
    textColor: "{colors.sucre}"
    typography: "{typography.prix}"
    rounded: "0.3rem"
    padding: "0.2rem 0.55rem"
  rubrique-puce:
    backgroundColor: "{colors.riz}"
    textColor: "{colors.sucre}"
    rounded: "{rounded.pastille}"
    padding: "0.3rem 0.9rem"
    height: "2.5rem"
  rubrique-puce-active:
    backgroundColor: "{colors.sucre}"
    textColor: "{colors.riz}"
  champ-recherche:
    backgroundColor: "{colors.riz}"
    textColor: "{colors.sucre}"
    rounded: "{rounded.base}"
    padding: "0.5rem 1rem 0.5rem 2.9rem"
    height: "{spacing.bouton}"
  bouton-ajout:
    backgroundColor: "{colors.riz}"
    textColor: "{colors.sucre}"
    rounded: "{rounded.pastille}"
    size: "{spacing.cible-tactile}"
  bouton-ajout-actif:
    backgroundColor: "{colors.feuille}"
    textColor: "{colors.riz}"
---

# Design System: Aux Saveurs du Cambodge

<!-- Système relevé sur le site livré (public/), sans entretien : le commanditaire a donné carte blanche. -->

## Overview

**Creative North Star: "L'étal du marché"**

Le site se tient comme un étal de marché cambodgien : de grands aplats de curcuma et de feuille de bananier possèdent des régions entières de la page, les ingrédients du kroeung sont posés dessus en illustrations sérigraphiées, et l'on vend franchement — un prix lisible, une étiquette qui dit si c'est ouvert, un téléphone à un geste. L'identité tient dans l'enseigne bilingue : le nom en khmer, en Moul, au-dessus du nom latin en capitales Moul, comme sur les devantures de Phnom Penh.

La densité alterne : un héros saturé, des passages calmes sur papier riz pour lire (la carte compte 86 plats), puis de nouveau la couleur en bandes. Le relief est celui de l'impression : contours d'encre légèrement décalés, trame de points, ombres plates de sérigraphie. Aucune photo, aucun costume « asiatique » (laques rouge et or, lanternes, pinceau), aucun héros sombre façon restaurant chic.

**Key Characteristics:**
- Aplats curcuma (#F2A51C) et feuille (#1B5232) qui tiennent des sections entières
- Enseigne bilingue en Moul ; tout le texte courant en Kantumruy Pro
- Illustrations en cinq encres sur papier riz, contour décalé, trame de points
- Rouge piment réservé à l'appel téléphonique
- Étiquettes d'étal pour l'état d'ouverture et les prix mis en avant
- Prix en chiffres tabulaires, au format « 10,00 € »
- Un seul moment fort animé : l'étal s'installe au chargement ; le reste du mouvement explique un état ou répond à un geste

## Colors

Une palette de marché : épice jaune, feuille verte, piment rouge, encre brune de sucre de palme, papier de riz.

### Primary
- **Curcuma** (#F2A51C) : le champ principal — héros, section des saveurs, page 404, fond des étiquettes de prix sur papier riz. Toujours couvert d'une trame de points à 11 % d'encre.
- **Curcuma clair** (#F7C25A) : prix et guillemets sur fond feuille, tampon de la promesse, contour de focus sur fond sombre.
- **Curcuma pâle** (#FDE7B4) : fond de l'état « grand » dans les horaires, survol des puces de rubrique.

### Secondary
- **Feuille de bananier** (#1B5232) : champ profond — menu bon et pas cher, en-tête de la carte, bandeau de la promesse, bouton d'ajout actif.
- **Feuille vive** (#2C7343) : pastille « ouvert », mention « sur commande », curseur de saisie, barre de défilement.
- **Feuille tendre** (#B9DB95) : texte secondaire sur fond feuille (5,9:1).
- **Feuille encre** (#16472B) : petit khmer de l'enseigne d'en-tête sur curcuma (5,2:1).

### Tertiary
- **Piment** (#C8261B) / **Piment foncé** (#A51D14, survol) : uniquement le geste d'appel — boutons Appeler / Commander, bouton d'appel de la barre mobile.

### Neutral
- **Sucre de palme** (#2A170D) : l'encre — texte, contours, filets, pied de page.
- **Sucre doux** (#5A3416) : texte secondaire sur curcuma (5,25:1).
- **Riz** (#FFFBF3) : champ de lecture, fond des étiquettes et des champs.
- **Riz 2** (#F4EAD6) : texte du pied de page, piste de la barre de défilement.
- **Riz texte** (#6A5442) : texte secondaire sur riz (6,9:1).
- **Papier du bon** (#FFFDF8) : feuille du bon de commande.
- **Pied texte** (#D9C7AD) / **Pied note** (#CBB89C) : notes et crédits sur le pied sucre.

### Named Rules
**The One Chili Rule.** Le rouge piment est l'appel téléphonique et rien d'autre dans l'interface. Les seuls autres rouges sont les piments dessinés.

**The Five Inks Rule.** Les illustrations n'utilisent que cinq encres (sucre, curcuma, piment, feuille, vert tendre #A9C65C) sur papier riz (#FBF5EA) ; toute autre teinte est une trame ou une surimpression de ces encres (voir `tools/etal.mjs`).

**The Quiet Field Rule.** Les longues listes se lisent sur riz ; la couleur tient les bandes, les titres soulignés au curcuma et les bords, jamais le fond d'une liste de plats.

## Typography

**Display Font:** Moul (Danh Hong), repli Kantumruy Pro
**Body Font:** Kantumruy Pro (Tep Sovichet, Wei Huang), repli Segoe UI / system-ui
**Price Font:** Kantumruy Pro Prix — sous-ensemble de Kantumruy Pro 600 aux chiffres de chasse fixe

**Character:** deux faces dessinées par des typographes cambodgiens. Moul, l'écriture des enseignes et des titres khmers, porte l'identité ; Kantumruy Pro, sobre et lisible, porte tout le reste, en latin comme en khmer.

### Hierarchy
- **Enseigne** (Moul 400, clamp(2.2rem, 0.9rem + 5.2vw, 4.05rem), interligne 1, capitales, +0,01em) : le nom du restaurant en deux lignes, « du » glissé en petit Kantumruy 600 à 0,4em.
- **Enseigne khmère** (Moul, clamp(1.5rem, 1rem + 2.2vw, 2.75rem), interligne 1,55) : « រសជាតិកម្ពុជា » au-dessus du nom ; « អរគុណ » en pied de page ; « ឆ្ងាញ់ » sur le tampon.
- **Headline** (700, clamp(2rem, 1.3rem + 2.6vw, 3.5rem), 1,08, −0,015em) : titres de section.
- **Title** (700, clamp(1.6rem, 1.25rem + 1.1vw, 2.25rem), 1,05, −0,02em) : noms de plats mis en avant ; titres de rubrique de la carte en clamp(1.75rem, 1.35rem + 1.4vw, 2.5rem).
- **Body** (400, 1,0625rem, 1,55) : texte courant, 34 à 44ch selon les blocs.
- **Label** (700, 0,8rem, +0,06em, capitales) : titre d'étiquette, titres du pied de page (0,85rem, +0,08em).
- **Prix** (Kantumruy Pro Prix 600) : tous les prix, alignés à droite.

### Named Rules
**The Bilingual Sign Rule.** Moul ne sert qu'à l'enseigne et aux mots khmers. Jamais pour du français courant : sa partie latine n'a pas d'accents.

**The Tabular Price Rule.** Un prix s'écrit « 10,00 € » (Intl fr-FR), en Kantumruy Pro Prix, pour que les virgules s'alignent en colonne.

**The Fine Space Rule.** Espace fine insécable avant « ? ! : ; » et dans « « » » ; gluon U+2060 après le tiret des plages horaires pour que « 18 h – 21 h 45 » ne se coupe pas.

## Layout

Conteneur de 80rem centré, marges latérales clamp(1rem, 4vw, 3rem), sections espacées de clamp(4rem, 3rem + 5vw, 8rem). Points de rupture : 45rem (tablette : grilles à deux colonnes, barre d'actions mobile masquée), 64rem (bureau : héros à quatre pistes dont l'étal court jusqu'au bord droit de l'écran), 72rem (carte à trois colonnes : index 12rem, liste, bon 21rem).

Le héros de bureau est une grille pleine largeur `minmax(marge, 1fr) | 39rem | 41rem | minmax(marge, 1fr)` : le texte dans la deuxième piste, l'illustration sur les deux dernières, coupée par le bord. Sur mobile, l'enseigne passe pleine largeur, les deux boutons s'empilent au-dessus de la ligne de flottaison et l'étal devient une bande 800 × 440 sous les boutons.

Les sections alternent curcuma → feuille → riz → curcuma → riz → sucre ; jamais deux aplats de même couleur côte à côte.

## Elevation & Depth

Le relief vient de l'impression, pas de l'interface : contours d'encre décalés de 1,6 × 1,3 px sur chaque ingrédient, silhouettes d'ombre plates (encre à 30 %), trame de points. Côté interface, une seule ombre douce, réservée à ce qui se saisit : boutons d'appel, étiquettes, bon de commande.

### Shadow Vocabulary
- **Ombre de prise** (`box-shadow: 0 0.6rem 1.4rem -0.7rem rgb(42 23 13 / 0.55)`) : bouton d'appel, étiquette pendue, bon de commande sur bureau.
- **Ombre de barre** (`box-shadow: 0 -0.5rem 1.5rem -0.75rem rgb(42 23 13 / 0.6)`) : barre d'actions mobile.
- **Ombre de feuille** (`box-shadow: 0 -1rem 2rem -1rem rgb(42 23 13 / 0.45)`) : bon de commande ouvert en feuille basse sur mobile.

### Named Rules
**The Stall Setup Rule.** L'étal s'installe une fois, au chargement de l'accueil, et le texte n'attend jamais : nom, état et bouton d'appel sont lisibles dès la première image. Une animation qui n'explique ni un état, ni un geste, ni un lien entre deux endroits n'a pas sa place.

**The Print Depth Rule.** Pas d'ombre décalée dure ni de halo coloré : la profondeur d'une illustration est une silhouette plate décalée, celle d'un objet d'interface est une ombre douce sous ce que l'on peut prendre.

## Shapes

Coins doux de 0,5rem pour les boutons, champs et étiquettes d'état ; 0,45rem pour l'étiquette pendue ; 0,75rem pour les bandeaux ; 999px pour les puces et boutons ronds. Les filets sont l'encre : 2px pleins sous les titres de liste, 1px en tirets entre les plats.

### Named Rules
**The Tag Rule.** Ce qui annonce un état ou une offre est une étiquette d'étal : l'état d'ouverture a un bout en pointe dont la pastille fait le trou perforé ; l'offre à 10 € pend à sa ficelle et se balance au survol.

## Components

### Buttons
- **Shape :** coins doux (0,5rem), contour d'encre 2px, hauteur 3,25rem.
- **Appel :** fond piment, texte riz, icône téléphone, numéro séparé par un filet riz à 50 % ; survol piment foncé ; enfoncement de 1px.
- **Trait :** transparent, encre sucre ; au survol, fond sucre et texte curcuma clair sur curcuma, texte riz sur riz. Sur fond feuille, trait et texte riz, qui se remplit de riz au survol.
- **Texte :** lien souligné, 2,75rem de cible.

### État d'ouverture (étiquette)
- Riz, contour d'encre, bout gauche en pointe (carré pivoté de 45°), pastille : feuille vive = ouvert, curcuma = sur commande, riz 2 = fermé.
- Variantes : compacte dans l'en-tête, grande sur curcuma pâle dans les horaires. Texte calculé à l'heure de Paris.
- Mouvement : quand l'état change (et au chargement), la pancarte se retourne sur son axe vertical (170ms pour la demi-face sortante, 380ms pour l'entrante). En mouvement réduit, simple fondu.
- Le jour courant du tableau est entouré à la main : un trait SVG qui se referme en dépassant, tracé en 800ms quand le tableau entre à l'écran.

### Étiquette pendue
- Fond riz, trou perforé curcuma cerclé d'encre, ficelle d'encre, rotation de repos −5° (4° sur mobile, variable `--repos`) ; titre en label, prix en Kantumruy Pro Prix 2,6rem.
- Mouvement : l'attache (`.accroche`) la fait tomber de son clou puis osciller en pendule amorti jusqu'au repos (1,7s, à 1,15s du chargement) ; au survol, elle se balance de nouveau.

### Chips (rubriques de la carte)
- Puces pleine pastille à contour 1,5px ; active : sucre plein, texte riz. Sur bureau, liste verticale collante ; active : curcuma à contour d'encre.
- Mouvement : un curseur unique glisse sous la rubrique en cours (300ms) ; la rubrique visée par l'index voit son surlignage curcuma se repeindre de gauche à droite.

### Inputs / Fields
- Recherche : fond riz, contour d'encre 2px, icône loupe à gauche, focus en anneau curcuma clair de 3px.

### Liste de plats
- Nom (600), description (riz texte, 0,925rem), prix à droite en chiffres tabulaires, bouton rond « + » de 2,75rem qui passe au vert feuille avec une pastille de quantité curcuma.

### Bon de commande (signature)
- Feuille papier (#FFFDF8) à bord perforé sur bureau, collante dans la colonne de droite ; feuille basse non modale sur mobile, ouverte depuis la barre d'actions.
- Lignes avec quantité − / +, total indicatif en chiffres tabulaires qui remonte de 0,35em à chaque changement, bouton d'appel pleine largeur.
- Mouvement : un jeton « +1 » curcuma vole en parabole du bouton « + » jusqu'au total (bureau) ou jusqu'au bouton « Mon bon » (mobile), 640ms ; à l'arrivée, total et compteur remontent. Les lignes entrent en glissant (320ms) et sortent plus vite (170ms).

### Navigation
- En-tête curcuma : enseigne réduite, liens soulignés au survol par un trait qui se déroule, état compact, bouton d'appel. Sous 45rem, liens remplacés par la barre d'actions basse (Appeler · La carte · Y aller).

## Do's and Don'ts

### Do:
- **Do** poser la couleur en aplats de section (curcuma #F2A51C, feuille #1B5232) et garder les listes sur riz (#FFFBF3).
- **Do** écrire les prix « 10,00 € » en Kantumruy Pro Prix et les aligner à droite.
- **Do** dessiner tout nouvel ingrédient avec les cinq encres de `tools/etal.mjs`, contour décalé et ombre plate.
- **Do** garder des cibles tactiles de 2,75rem minimum et un focus visible (3px sucre, ou curcuma clair sur fond sombre).
- **Do** garder un seul moment fort par page : à l'accueil, la feuille glisse (950ms), les ingrédients tombent avec leurs ombres (720ms chacun, décalés de 36ms) et l'étiquette se balance. Le reste explique un état (pancarte, curseur, jeton) ou répond à un geste, sans boucle.
- **Do** prévoir le mouvement réduit : plus aucun déplacement, mais les fondus et changements d'état restent lisibles.

### Don't:
- **Don't** utiliser le rouge piment pour autre chose que l'appel.
- **Don't** composer du français en Moul, ni utiliser une police système comme voix d'affichage.
- **Don't** mettre de sur-titre ou d'eyebrow au-dessus d'un titre.
- **Don't** présenter une illustration ou une photo comme une photo des plats de la maison.
- **Don't** revenir au costume « asiatique » : laque rouge et or, lanternes, dragons, faux pinceau.
- **Don't** utiliser d'ombre décalée dure, de dégradé de texte ou de verre dépoli décoratif.
