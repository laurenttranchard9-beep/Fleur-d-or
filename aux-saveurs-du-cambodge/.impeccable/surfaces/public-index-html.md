---
version: 1
slug: "public-index-html"
primary_target: "public/index.html"
related_targets: ["public/carte/index.html"]
---

# Surface brief — accueil (public/index.html) + carte (public/carte/index.html)

## Scope and mode
- Accueil : Persuade. Carte : Read/Operate (scanner ~90 plats, préparer une commande téléphonique).
- Audience : voisins du nord toulousain sur mobile, pause déjeuner ou commande du soir. Action : appeler (07 59 52 53 41), sinon itinéraire ou carte.
- Preuves disponibles : la carte et ses prix, les horaires, l'adresse, la promesse « fait maison ». Pas de photos, pas d'avis : rien d'inventé.
- Carte blanche du commanditaire : direction tirée au sort et retenue sans tour de décision (non présentée).

## Direction contract

THESIS: Le site est un étal de marché cambodgien : les « saveurs » du nom sont montrées telles quelles (citronnelle, galanga, curcuma, combava, piment), et la page vend comme un étal — prix francs, étiquette ouvert/fermé en direct, téléphone à un geste. Refuse le défaut de la catégorie : héro photo sombre + « Bienvenue » en script, et le costume rouge-or-lanterne « asiatique ».

OWN-WORLD: Aplats curcuma et feuille de bananier qui possèdent des régions entières ; encre sucre de palme ; rouge piment réservé à « Appeler ». Ingrédients sérigraphiés à plat sur feuille de bananier (SVG d'auteur, 4–5 encres, léger décalage de repérage). Étiquettes en carton pour les prix et l'état d'ouverture. Enseigne bilingue : khmer en Moul au-dessus du latin ; Kantumruy Pro (dessinée par un typographe cambodgien) pour tout ce qui se lit ; chiffres de prix tabulaires.

STORY: Le voisin affamé comprend en un écran ce que c'est (cuisine cambodgienne faite maison, Saint-Alban), si c'est ouvert maintenant, qu'un menu complet coûte 10 €, et il appelle. Les autres descendent vers les classiques, les saveurs, les horaires (midi du week-end sur commande la veille), l'adresse, puis la carte où ils composent un bon de commande à lire au téléphone.

FIRST VIEWPORT: Desktop 1440×900 : champ curcuma ; colonnes 1–6 : enseigne (khmer « រសជាតិកម្ពុជា » en Moul, puis AUX SAVEURS DU CAMBODGE en capitales Moul ~7vw, puis « Cuisine cambodgienne faite maison · Saint-Alban »), étiquette d'état en direct, bouton rouge piment « Appeler · 07 59 52 53 41 » + « Voir la carte ». Colonnes 7–12 : feuille de bananier portant l'étal d'ingrédients, coupée par le bord droit, étiquette pendue « Menu bon et pas cher 10 € ». Mobile 390×844 : enseigne empilée pleine largeur, étiquette d'état, deux boutons pleine largeur au-dessus de la ligne de flottaison, illustration qui dépasse en bas ; barre fixe basse (Appeler · Carte · Y aller) après le héro.

FORM: Étal de marché et ingrédients du kroeung — position 4 de ma liste ordonnée (krama, enseignes de street-food de Phnom Penh, dépliant de traiteur, ingrédients du marché, table de gargote, billets en riel, ornement d'Angkor) ; seed key d10c6c2b ; code-led (pas de génération d'images).

RAISES:
- Donné par le bord de nuage irisé (déclinée) : la couleur tient les bandes et les bords ; le champ de lecture de la carte reste calme pour que 90 plats restent lisibles.
- Donné par la ville endormie (déclinée) : l'heure locale est un état de premier rang — le premier écran parle du service en cours (déjeuner, dîner, fermé, midi du week-end sur commande la veille), calculé en heure de Paris.
- Donné par le relevé d'exposition (déclinée) : discipline tabulaire — un seul format de prix, chiffres tabulaires sur une colonne alignée.
- Donné par le compteur nixie (déclinée) : les quantités sont l'interface — le nombre et le total du bon de commande changent comme des événements visibles, chiffres à position fixe.
- Donné par l'établi matériel (déclinée) : une seule couleur d'action — le rouge piment est « Appeler » et rien d'autre dans l'interface.
- Calendrier publicitaire à feuillets (compétitive, reste l'alternative ; non construite faute de plaque peinte) : son anneau du jour inspire l'état « aujourd'hui » du tableau d'horaires.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Motion (ajoutée le 30/10/2026, demande « ajoute des animations »)
- Moment fort : « On installe l'étal ». Au chargement, la feuille de bananier glisse sur le curcuma, les ingrédients tombent un à un et leurs ombres se posent avec eux, puis l'étiquette 10 € tombe de son clou et se balance jusqu'au repos. Environ 1,6 s, une seule fois, en CSS seul. Le texte et les boutons d'appel restent visibles d'emblée.
- Continuité : transition entre les pages (l'en-tête reste en place, le contenu glisse) ; sur la carte, un curseur glisse d'une rubrique à l'autre, le titre visé par l'index se surligne au marqueur, et un jeton « +1 » vole du bouton jusqu'au bon de commande.
- Retour d'action : l'étiquette d'état se retourne comme une pancarte « ouvert / fermé » ; le jour courant est entouré au marqueur ; le tampon « ឆ្ងាញ់ » frappe le bandeau ; les ingrédients des saveurs se posent sur la table et se soulèvent au survol ; le téléphone sonne au survol des boutons d'appel ; les lignes du bon entrent et sortent.
- Budget : rien ne tourne en boucle ; transform, opacity et stroke-dashoffset ; la feuille est un calque à part pour rester composée sur le GPU ; les ombres s'animent en un seul groupe. Mouvement réduit : plus aucun déplacement, mais fondus et changements d'état conservés.

## Unresolved
- Identité légale (raison sociale, SIRET, directeur de publication) pour les mentions légales.
- Service sur place confirmé ? Moyens de paiement ? Fermetures annuelles ?
- Nom khmer officiel éventuel du restaurant (« រសជាតិកម្ពុជា » = « saveurs du Cambodge », traduction proposée).
