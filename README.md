# La Fleur d’Or · site du restaurant

Site d’une seule page pour le restaurant La Fleur d’Or (金花餐廳), 14 bis, avenue du Président Kennedy, 31330 Grenade.

Il contient toute la carte imprimée (179 plats, 39 boissons, 11 formules), les horaires, l’accès et les moyens de paiement. Il affiche aussi en direct si le restaurant est ouvert, et une liste de commande permet de noter ses plats avant d’appeler.

Le site est en HTML, CSS et JavaScript simples, sans étape de compilation : il suffit de déposer les fichiers chez n’importe quel hébergeur (GitHub Pages, Netlify, OVH…).

## Modifier la carte

Tout est dans `index.html`, une ligne par plat :

```html
<li class="plat"><span class="plat-nom">Canard laqué</span> <data class="plat-prix" value="11.00">11,00 €</data></li>
```

- **Changer un prix** : modifier les deux valeurs, `value="11.00"` (avec un point) et le texte `11,00 €`.
- **Ajouter un plat** : copier une ligne dans la bonne rubrique et changer le nom et le prix. Le bouton « + » s’ajoute tout seul.
- **Plat pimenté** : ajouter `data-piment` sur le `<li>`, par exemple `<li class="plat" data-piment>`.
- **Supprimer un plat** : supprimer sa ligne.

Les formules sont les blocs `<li class="ardoise">` dans la section `id="formules"`.

Pour changer les horaires, il faut modifier deux endroits : le tableau dans la section `id="infos"` de `index.html`, et `SERVICES` en haut de `assets/js/site.js` (c’est lui qui calcule « Ouvert / Fermé »).

## Fichiers

- `index.html` : la page, avec la carte complète.
- `assets/css/site.css` : l’apparence.
- `assets/js/site.js` : statut ouvert/fermé, recherche, liste de commande. Sans JavaScript, la carte reste entièrement lisible.
- `assets/img/` : les photos, en WebP. Chaque photo a un fichier `.json` à côté qui indique sa provenance.
- `assets/fonts/` : les polices, hébergées sur le site (aucun appel à Google Fonts).
- `PRODUCT.md` et `DESIGN.md` : le contexte produit et le système visuel, pour les prochaines modifications.

## Voir le site en local

```sh
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000.

## À vérifier par le restaurant

- Le texte d’un dessert, « Colonel chinois (glace citron vert et saké) » : la carte imprimée écrit « saté », que j’ai pris pour une coquille.
- La livraison Uber Eats : l’ancien site en montrait le logo. Est-elle toujours proposée ?
- La carte « à emporter » de l’ancien site (un livret feuilleté séparé) n’a pas été reprise. La remise de −10 % est mentionnée, mais sans calcul.
- Photos : le plateau de sushis vient d’Unsplash, et deux photos de l’ancien site (fondue, bols d’herbes) ressemblent à des photos de banque d’images. Des photos des vrais plats du restaurant seraient plus parlantes.
- Mentions légales : à ajouter (éditeur du site, hébergeur), car ces informations n’étaient pas disponibles.
