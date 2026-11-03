# Aux Saveurs du Cambodge — nouveau site

Refonte complète du site [auxsaveursducambodge-saintalban.com](https://www.auxsaveursducambodge-saintalban.com),
restaurant cambodgien du 10 avenue Salvador Allende, à Saint-Alban.

Version actuelle : **minimaliste, à la manière d'apple.com** (demande du 3 novembre 2026). La première refonte,
l'« étal de marché » coloré et animé, reste disponible dans l'historique git (commit `ba701ed`).

![Accueil sur ordinateur](apercus/accueil-bureau.jpg)

| Mobile | La carte |
|---|---|
| ![Accueil sur mobile](apercus/accueil-mobile.jpg) | ![La carte sur ordinateur, avec une commande en cours](apercus/carte-bureau.jpg) |

Page d'accueil entière : [apercus/accueil-page-entiere.jpg](apercus/accueil-page-entiere.jpg).

## Ce qui change

| Avant (Squarespace) | Maintenant |
|---|---|
| Fond gris, aucune image, aucune identité | Des tuiles noires et gris perle comme sur apple.com : chaque plat présenté comme un produit, dessiné vu du dessus, une seule police (celle d'Apple sur iPhone et Mac), un seul bleu pour agir |
| Bouton « Cammandez dès maintenant » qui renvoyait vers l'accueil | Bouton **Appeler** dans chaque tuile, téléphone toujours présent dans la navigation, barre « Votre commande · Appeler » en bas de la carte sur mobile |
| Horaires en texte brut, avec fautes | **État ouvert/fermé en direct** (heure de Paris) dans le bandeau sous la navigation, horaires en tableau avec le jour courant mis en avant, rappel « commandez la veille » pour le midi du week-end |
| Carte à l'adresse `/nouvelle-page`, 35 répétitions de la mention riz, prix « €7,5 € » | Carte à `/carte/` (l'ancienne adresse redirige), recherche instantanée, rubriques dans une barre collante, prix au format « 7,50 € » alignés |
| — | **Votre commande** : on ajoute ses plats, on voit le total, on appelle et on la dicte |
| Formulaire « Vous avez envie de travailler avec nous ? » (texte de modèle) | Adresse, plan du quartier redessiné d'après l'IGN, liens Itinéraire / Waze / Plans |
| Pas de description, pas de données pour Google | Titre et description, image de partage, données structurées `Restaurant` et `Menu` (horaires, adresse, prix), sitemap |
| — | Accessible (0 erreur axe-core, contrastes AA, clavier, lecteurs d'écran), sans cookie, sans traceur ; aucune police à télécharger sur les appareils Apple, 75 Ko (Inter) ailleurs |
| Aucune animation | Au chargement, le nom monte en fondu et le bol de soupe se pose en tournant ; chaque tuile se dévoile une fois au défilement, les plats pivotent doucement, la phrase « fait maison » s'allume ; sur la carte, un jeton « +1 » vole jusqu'à la commande. Tout respecte le réglage « réduire les animations » du téléphone |

Toutes les coquilles corrigées et les points à confirmer sont listés dans [CORRECTIONS.md](CORRECTIONS.md).

## Avant la mise en ligne

1. **Mentions légales** : remplir `legal` dans `data/restaurant.json` (raison sociale, SIRET, directeur de la publication, hébergeur), puis reconstruire. C'est obligatoire pour un site professionnel (LCEN).
2. **Vérifier la carte** : les points du tableau « À faire vérifier » de [CORRECTIONS.md](CORRECTIONS.md), notamment les brochettes de crevettes affichées à deux prix.
3. **Photos** : les plats du site sont des dessins, signalés comme tels. De vraies photos prises du dessus sur fond neutre les remplaceraient directement (`public/assets/img/plats/`, un fichier par plat).
4. **Service sur place** : le site dit « Commandes et réservations par téléphone ». À corriger si le restaurant ne fait que de la vente à emporter.

## Modifier le site

Tout le contenu vient de deux fichiers :

- `data/restaurant.json` : nom, téléphone, adresse, horaires, fermetures exceptionnelles, mentions légales ;
- `data/carte.json` : rubriques, plats, descriptions, prix ; les plats de l'accueil ont en plus une image (`"image"`) et une phrase (`"accroche"`).

Les quatre plats de la grille de l'accueil sont choisis par leur nom dans `build.mjs` (fonction `accueil`).

Puis, avec Node.js 18 ou plus récent, sans rien installer :

```sh
node build.mjs          # régénère les pages dans public/
npx serve public        # aperçu sur http://localhost:3000
```

Fermeture exceptionnelle (le bandeau d'état l'affichera) :

```json
"closures": [{ "from": "2026-12-24", "to": "2027-01-02", "label": "congés de fin d'année" }]
```

## Mettre en ligne

Le site complet tient dans un seul fichier : **`livraison/aux-saveurs-du-cambodge-site.zip`** (250 Ko environ).
Il contient le contenu du dossier `public/` : du HTML, du CSS, un peu de JavaScript, sans base de données ni PHP.
Il est refait à chaque `node build.mjs`.

### Chez IONOS (ou tout hébergement Apache : OVH, o2switch…)

1. **Décompresser l'archive sur l'ordinateur.** On obtient `index.html`, `404.html`, les dossiers `assets`, `carte`,
   `mentions-legales`, `nouvelle-page`, et un fichier caché **`.htaccess`** (sur Mac, Cmd + Maj + point pour l'afficher).
2. **Récupérer les accès SFTP** : espace client IONOS → Menu → Hébergement → tuile « SFTP & SSH » → Gérer → le nom
   d'utilisateur. On y trouve l'hôte (`access…webspace-data.io`), l'utilisateur et le mot de passe ; port 22.
3. **Envoyer les fichiers** avec [FileZilla](https://filezilla-project.org) (gratuit, protocole SFTP) : glisser **le contenu**
   du dossier décompressé, `.htaccess` compris, dans le dossier du webspace prévu pour le site. Remplacer les fichiers existants.
   L'explorateur de webspace d'IONOS, dans le navigateur, permet aussi de téléverser les fichiers ;
   FileZilla reste le plus simple pour envoyer tous les dossiers d'un coup, `.htaccess` compris.
4. **Rattacher le domaine à ce dossier** : Domaines & SSL → le domaine → connexion au webspace → choisir le dossier.
   Si le domaine est encore chez Squarespace, le transférer chez IONOS ou faire pointer ses DNS vers IONOS
   (IONOS propose de faire les réglages DNS lui-même quand il gère le domaine).
5. **Vérifier que le certificat SSL du domaine est actif** (inclus dans les offres d'hébergement IONOS) :
   `.htaccess` renvoie tout le monde vers `https://www.auxsaveursducambodge-saintalban.com`.

Ce que fait `.htaccess` : page 404 du site, ancienne adresse `/nouvelle-page` → `/carte/`, passage en HTTPS avec « www »
(seulement sur le domaine du restaurant, pour que d'autres adresses de test affichent le site sans redirection),
compression, cache et en-têtes de sécurité. Il a été essayé sur Apache 2.4 avec les seules directives qu'un hébergement mutualisé autorise.
En cas de page blanche « erreur 500 » ou d'erreur de certificat, supprimer `.htaccess` sur le serveur remet le site en ligne sans ces réglages.

Si le site change de domaine, mettre la nouvelle adresse dans `url` de `data/restaurant.json` puis relancer `node build.mjs` :
les liens, le plan du site et `.htaccess` suivent.

### Autres hébergeurs

- **Netlify** : glisser le dossier `public/` sur [app.netlify.com/drop](https://app.netlify.com/drop).
  Avec le dépôt GitHub : dossier de base `aux-saveurs-du-cambodge`, le reste est dans `netlify.toml`.
- **Cloudflare Pages, Vercel** : commande `node build.mjs`, dossier de sortie `public`.

Pour garder l'adresse actuelle, il faut faire pointer le domaine vers le nouvel hébergeur
(enregistrements DNS chez le gestionnaire du domaine, éventuellement Squarespace Domains) et résilier l'abonnement Squarespace une fois la bascule faite.

`_redirects` et `_headers` jouent le rôle de `.htaccess` sur Netlify et Cloudflare ; une page de redirection couvre l'ancienne adresse partout ailleurs.

## Organisation

```
aux-saveurs-du-cambodge/
├── build.mjs              générateur, sans dépendance
├── data/                  contenu : restaurant.json, carte.json
├── public/                site prêt à publier (pages générées + assets)
│   └── assets/            css, js, police Inter (OFL), plats dessinés, plan du quartier
├── livraison/             public/ en une archive ZIP, à déposer chez IONOS ou un autre hébergeur
├── tools/                 régénération ponctuelle des dessins, de la police, du plan et des images
├── PRODUCT.md, DESIGN.md  contexte produit et système visuel (couleurs, typographie, règles)
└── CORRECTIONS.md         corrections de contenu et points à vérifier
```

Les outils de `tools/` ne servent que pour changer les dessins, la police, le plan ou l'image de partage :

| Outil | Rôle | Prérequis |
|---|---|---|
| `node tools/plats.mjs` | dessine les six plats vus du dessus (`public/assets/img/plats/`) | Node |
| `python tools/fonts.py` | sous-ensemble latin de la police Inter | `pip install fonttools brotli` |
| `python tools/plan.py` | plan du quartier depuis la BD TOPO de l'IGN | `pip install fonttools brotli` |
| `node tools/images.mjs` | favicon, icônes, image de partage `og.jpg` | Playwright + Chromium |

## Crédits

- Illustrations : dessins vectoriels créés pour le site (ce ne sont pas des photos des plats).
- Plan : IGN – BD TOPO®, Licence Ouverte Etalab 2.0.
- Police : Inter (Rasmus Andersson), SIL Open Font License 1.1 — voir `public/assets/fonts/OFL.txt`. Sur iPhone, iPad et Mac, le site utilise la police du système (SF Pro), rien n'est téléchargé.
