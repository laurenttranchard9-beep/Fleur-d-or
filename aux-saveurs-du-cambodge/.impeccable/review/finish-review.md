Revue de finition exécutée en ligne (degraded/finish-reviewer.md) : les sous-agents ne sont lancés ici que sur demande explicite de l'utilisateur.
Entrées absentes : carte QUALITY BAR (canon épinglé par l'utilisateur, « minimaliste comme le site d'Apple », pas de carte de monde) et comp (build code-led). Captures lues : desktop.png, mobile.png, carte-desktop.png, carte-mobile.png (pages entières, mouvement réduit pour montrer l'état final).

disposition: fix

## persistence
pass — PRODUCT.md présent et mis à jour (direction du 03/11/2026) ; build code-led, donc ni state.json ni tour de comps. DESIGN.md et .impeccable/design.json décrivent encore l'étal de marché : nouveau monde, ils sont réécrits après cette revue.

## fidelity
Pas de comp : TYPE, MATERIAL et GROUND jugés contre OWN-WORLD ; le reste contre FIRST VIEWPORT et STORY.
- TYPE — adaptation (demande de l'utilisateur) : la voix d'affichage est la police système d'Apple, ce que le plancher refuse par défaut mais que la demande « comme le site d'Apple » réclame ; ailleurs Inter auto-hébergée, demi-gras 600, approche serrée. Conforme à OWN-WORLD.
- MATERIAL — adaptation (vérité produit : aucune photo des plats, PRODUCT.md interdit d'en simuler) : les « produits » sont des plats dessinés vus du dessus, aplats et dégradés doux, ombre floue ; aucune matière simulée en CSS.
- GROUND — match : blanc, #F5F5F7 et #000 relevés sur les captures ; aucune dérive crème ou ardoise.
- Navigation translucide 44 px (nom, liens 12 px centrés, téléphone) — match.
- Ruban d'état centré sur gris clair — match.
- Tuile noire : titre 56 px sur une ligne, sous-titre 28 px, ligne grise, pilules Appeler / Voir la carte — match.
- Bol de soupe centré, coupé par le bas de la tuile — match.
- Mobile : même pile, titre 40 px, boutons côte à côte — match ; bol de 360 px au lieu de 300 px — adaptation non citée (à consigner).
- Tuiles produit (menu 10 €, lok lac, bo bun, nems, porc au caramel), manifeste « fait maison », horaires, adresse — match.
- Carte : recherche, barre locale collante soulignée, ajout, « Votre commande », appel — match.
- Rotation des plats liée au défilement et manifeste qui s'allume phrase après phrase — added without approval : absents de la section Motion du contrat.
- Rail de l'index (bureau), trait actif de 2 px — adaptation : repère de position d'un index, pas une bande décorative de carte.

## ceiling
reached — tuiles pleine largeur, produit isolé et coupé par le bord, pilules bleues, liens à chevron, verre dépoli limité aux barres collantes, pied de page en 12 px : les dispositifs du canon sont tous employés.

## material_fixes
1. Truth — le manifeste annonce « Citronnelle, galanga, curcuma, combava » : galanga, curcuma et combava n'apparaissent nulle part sur la carte ; ne citer que des saveurs que la carte nomme (citronnelle, saté, caramel, lait de coco).
2. FINISH — og.jpg et les quatre icônes PNG ont été régénérés sans provenance : l'intégrer (`impeccable embed-prompt`).
3. Contrat — consigner dans la section Motion la rotation des plats au défilement et l'allumage du manifeste, et le bol mobile de 360 px, ou les retirer.

## keep
La tuile noire du héros avec le nom sur une ligne et le bol coupé par le bas, et le bleu réservé à l'action.

---

# Passe de verdict (captures refaites sur les mêmes fichiers)

## verdict
1. Truth, saveurs du manifeste — resolved : desktop.png montre « Citronnelle, saté, caramel, lait de coco », quatre mots présents dans data/carte.json.
2. FINISH, provenance des rasters — resolved : `impeccable embed-prompt --scan public` → 5 rasters, 0 missing (og.jpg régénérée pour garder « à Saint-Alban » sur une ligne, provenance réintégrée).
3. Contrat, mouvement et bol mobile — resolved : la section Motion consigne la rotation liée au défilement et l'allumage du manifeste ; FIRST VIEWPORT donne le bol mobile de 360 px.

Aucune régression visible dans les captures refaites.

## remaining
clear

disposition: ship (porte sur les trois corrections notées, pas sur une nouvelle revue complète de la surface)

---

# Extension du 06/11/2026 : espace gestion, mesure d'audience, scène « fait maison », mentions légales

Revue de finition exécutée en ligne (degraded/finish-reviewer.md) : les sous-agents ne sont lancés ici que sur demande explicite de l'utilisateur.
Entrées absentes : carte QUALITY BAR et comp (build code-led, canon épinglé « minimaliste comme le site d'Apple »). Captures lues : desktop.png, mobile.png, carte-desktop.png, carte-mobile.png, mobile-defilement.png, g-connexion, g-stats, g-prix, g-reglages et g-survol en bureau (1280) et mobile (390), mouvement réduit pour montrer l'état final.

disposition: fix

## persistence
pass — PRODUCT.md à jour (espace gestion, mesure d'audience, PHP requis). DESIGN.md et .impeccable/design.json précèdent l'extension et décrivent le monde construit : jetons erreur et succès, règle de la scène unique, composants de l'espace gestion ; brief de surface public-admin-index-php.md écrit (mode Operate). Build code-led : ni state.json ni comps.

## fidelity
Pas de comp : TYPE, MATERIAL et GROUND jugés contre OWN-WORLD ; le reste contre la demande et le contrat consigné.
- TYPE — match : Inter demi-gras, approche serrée, chiffres tabulaires ; même voix dans l'espace gestion.
- MATERIAL — match : bol de la scène en aplats et dégradés doux comme les autres plats dessinés ; vapeur en dégradés flous ; aucune matière simulée.
- GROUND — match : blanc, #F5F5F7 et #000 sur le site ; gris perle et fiches blanches dans l'espace gestion.
- Mentions légales (TRANCHARD, SIRET 517 803 433 00039, Laurent Tranchard, IONOS SARL avec adresse et téléphone) — match à la demande.
- Scène « fait maison » épinglée, la soupe se compose au défilement — match à la demande « plus d'animation, vivant » ; consignée (scène unique) dans DESIGN.md et le brief de surface.
- Titre de la scène sur mobile : « maison. », « frais. » et « d'amour. » seuls sur leur ligne — contradicted (plancher typographique des titres).
- Espace gestion : barre en verre, commande segmentée, grand nombre, histogramme, classements, éditeur de prix, réglages — match (mode Operate).
- Histogramme 30 jours sur mobile : les info-bulles des dernières colonnes sortent du cadre, la page devient 4 px plus large que l'écran (10 px à 320 px) — contradicted (pas de défilement horizontal).
- Éditeur de prix au clavier : 18 à 28 des 80 passages de Tab posent le champ actif sous la barre « Enregistrer » ou sous la barre du haut — contradicted (WCAG 2.2, critère 2.4.11).
- Bouton « Enregistrer » gris sur g-prix-mobile.png alors qu'un prix est modifié — adaptation (capture) : prise pendant la transition de 0,2 s, la sonde lit le bouton actif et bleu 600 ms plus tard.
- Info-bulle visible sur g-stats — adaptation (capture) : pointeur resté au-dessus du graphique après le clic de connexion.

## ceiling
reached — une seule scène épinglée, le nom qui se lève, le bol qui se pose et fume, le pouls d'état, l'inclinaison au pointeur, l'onde du « + », le total qui défile : les devices de mouvement du canon sont employés sans second centre d'attention.

## material_fixes
1. Histogramme — garder l'info-bulle dans le cadre à chaque colonne (ancrage proportionnel à la position du jour) ; plus aucun débordement horizontal à 390 et 320 px.
2. Éditeur de prix — un champ atteint au clavier ne finit jamais sous une barre collante : marge de défilement haute et basse à la hauteur des barres, mobile compris.
3. Accueil mobile — titre de la scène en lignes équilibrées, plus de mot seul en fin de phrase.

## keep
La soupe qui se compose sur fond noir comme seul grand moment, et l'espace gestion sobre, en encre et bleu d'action.

---

# Passe de verdict (captures refaites sur les mêmes fichiers, sondes relancées)

## verdict
1. Histogramme — resolved : g-stats-mobile.png fait 390 px de large ; largeur de page égale à l'écran à 390 et 320 px sur 7 jours, 30 jours et 12 mois ; bulles du premier jour, du 15e, de l'antépénultième et du dernier dans le cadre.
2. Éditeur de prix — resolved : 0 champ caché sur 80 passages Tab et Maj+Tab à 1280, 390 et 320 px ; g-prix-mobile.png montre le champ modifié entier au-dessus de la barre.
3. Titre de la scène — resolved : mobile.png montre « Tout est / fait maison. », « Avec des / produits frais. », « Et beaucoup / d'amour. ».

Aucune régression : 39 contrôles sur 39 pour l'espace gestion sur Apache 2.4 et PHP 8.3 avec l'archive régénérée ; provenance : 5 rasters, 0 missing.

## remaining
clear

disposition: ship (porte sur les trois corrections notées, pas sur une nouvelle revue complète de la surface)
