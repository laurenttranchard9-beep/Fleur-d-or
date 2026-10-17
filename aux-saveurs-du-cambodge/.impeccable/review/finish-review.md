Revue de finition exécutée en ligne (degraded/finish-reviewer.md) : les sous-agents ne sont lancés ici que sur demande explicite de l'utilisateur.
Entrées absentes : carte QUALITY BAR (direction issue de la liste propre, pas du catalogue) et comp (code-led, pas de génération d'images).

disposition: fix

## persistence
pass — PRODUCT.md présent (aux-saveurs-du-cambodge/PRODUCT.md) ; build code-led, donc pas de state.json ni de tour de comps ; DESIGN.md sera écrit après cette revue (nouveau monde).

## fidelity
Pas de comp approuvé : TYPE, MATERIAL et GROUND jugés contre OWN-WORLD.
- TYPE — match : enseigne Moul (khmer + capitales latines), Kantumruy Pro partout ailleurs, prix en chiffres tabulaires.
- MATERIAL — contradicted (partiel) : le médium promis (aplats sérigraphiés, contour décalé, trame) est tenu, mais OWN-WORLD annonce « 4–5 encres » et l'illustration en compte ~35.
- GROUND — match : curcuma #F2A51C sur les champs nommés ; champ de lecture riz #FFFBF3, quasi blanc, sans dérive crème.
- Enseigne ~4,5 vw au lieu de « ~7 vw » — adaptation : plafond 6 rem du craft floor et largeur de colonne.
- État d'ouverture « étiquette » — contradicted : rendu en pastille arrondie, sans la grammaire de l'étiquette (trou, bout entaillé).
- Étiquette pendue « Menu bon et pas cher 10 € » — match.
- Feuille coupée par le bord droit, boutons Appeler + Voir la carte, barre mobile après le héros — match.
- Conseil « Envie de déjeuner … midi ? » — adaptation : RAISE « l'heure locale est un état de premier rang ».
- Khmer masqué dans l'en-tête de l'accueil — adaptation : évite le doublon avec l'enseigne du héros.

## ceiling
- Le bandeau de la promesse est un encadré arrondi générique, moitié droite vide : aucun matériau du monde (feuille, tampon, étiquette).
- Le motif de feuille déchirée reste confiné au héros ; aucune section ne le reprend.

## material_fixes
1. Floor — eyebrow interdit : retirer la rubrique en petites capitales au-dessus de chaque plat de « Par où commencer ? ».
2. Contrat (RAISE « une seule couleur d'action ») : le pictogramme piment de la carte est rouge piment ; le passer à l'encre sucre.
3. MATERIAL — réduire la palette de l'illustration à un jeu d'encres lié aux jetons de la page (curcuma, orange, piment, deux verts feuille, vert tendre, rose, sucre, riz), ombres en trame.
4. Saveurs — la botte de citronnelle déborde de sa vignette et chevauche « Citronnelle » sur bureau : la recadrer dans son cadre 200 × 200.
5. OWN-WORLD « étiquettes … pour l'état d'ouverture » : donner à l'état en direct la forme d'une étiquette (trou perforé, bout entaillé).
6. Ceiling — la promesse : y poser un matériau du monde (tampon khmer en Moul, « ឆ្ងាញ់ » = « délicieux »), pas un encadré nu.
7. Carte mobile — la note riz se coupe en « · riz cantonais… » avec le séparateur en tête de ligne : deux lignes propres sur petit écran.
8. FINISH — les rasters livrés (og.jpg, icônes) n'ont pas encore leur provenance intégrée.

## keep
L'enseigne bilingue Moul sur le champ curcuma, l'étal sur feuille de bananier coupé par le bord droit, et le rouge piment réservé à l'appel.

---

# Passe de verdict (captures refaites sur les mêmes fichiers)

## verdict
1. Eyebrow au-dessus des plats — resolved : « Par où commencer ? » ne montre plus que nom, texte et prix.
2. Rouge piment réservé à l'appel — resolved : le pictogramme rouge a disparu de la carte ; le rouge ne reste que sur « Appeler / Commander ».
3. Palette de l'illustration — resolved : cinq encres (sucre, curcuma, piment, feuille, vert tendre) sur papier riz, tons obtenus par trame ou surimpression ; échalotes rouge sombre, galanga ocre pâle.
4. Citronnelle des saveurs — resolved : la botte tient dans sa vignette, l'étiquette est dégagée.
5. État en étiquette — resolved : bout en pointe, pastille en trou perforé, dans l'en-tête, le héros et les horaires.
6. Promesse — resolved : tampon khmer « ឆ្ងាញ់ » en Moul, traduit « Délicieux », sur le bandeau feuille.
7. Note riz sur mobile — resolved : deux lignes nettes, plus de séparateur en tête de ligne.
8. Provenance des rasters — resolved : `impeccable embed-prompt --scan public` → 5 rasters, 0 missing.

Régression introduite puis corrigée dans le même lot : le piment passé à l'encre se lisait comme une banane ; remplacé par une mention texte, retirée ensuite car redondante avec « piquante » dans le nom.

## remaining
clear

disposition: ship (porte sur les huit corrections notées, pas sur une nouvelle revue complète de la surface)
