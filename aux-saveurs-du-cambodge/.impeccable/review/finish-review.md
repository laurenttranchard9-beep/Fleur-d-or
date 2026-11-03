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
