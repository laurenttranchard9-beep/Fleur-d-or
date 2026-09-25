# La Fleur d’Or · site du restaurant

Site d’une seule page pour le restaurant La Fleur d’Or (金花餐廳), 14 bis, avenue du Président Kennedy, 31330 Grenade.

Il contient toute la carte imprimée (177 plats, 41 boissons, 11 formules), les horaires, l’accès et les moyens de paiement. Il affiche aussi en direct si le restaurant est ouvert, et une liste de commande permet de noter ses plats avant d’appeler.

La page publique est en HTML, CSS et JavaScript simples. Un panneau d’administration en PHP permet de modifier les plats, les catégories et les formules, puis republie la page. On lance le tout avec XAMPP. Node.js (`npm start`) peut servir la page publique, mais pas le panneau.

## Modifier la carte : le panneau d’administration

Le panneau permet de modifier la carte sans toucher au code. Il demande PHP 8 ou plus récent, c’est-à-dire XAMPP ou un hébergeur Apache avec PHP. Il n’a pas besoin de MySQL.

1. Démarrer Apache dans XAMPP, puis ouvrir **http://localhost/fleur-dor/admin/**, ou cliquer sur **Se connecter** en bas du site.
2. **La première fois**, choisir le mot de passe (10 caractères au moins). Pour des raisons de sécurité, ce premier réglage n’est possible que depuis l’ordinateur qui fait tourner XAMPP (adresse `localhost`). Ensuite, on peut se connecter depuis n’importe quel appareil.
3. Modifier ce que l’on veut, puis cliquer sur **Publier sur le site** (ou Ctrl+S).

Ce que l’on peut faire :

- **La carte** : ajouter, renommer, déplacer ou supprimer des **catégories** (Entrées, Canard…), et les ranger dans les grandes **parties** (Cuisine chinoise et thaïlandaise, Bar à sushis…). Dans chaque catégorie, on gère les **plats** : nom, précision, prix (ou plusieurs prix, comme 37,5 cl et 75 cl pour un vin), et le marquage pimenté. On peut les monter, les descendre, les dupliquer ou les supprimer. On peut aussi ajouter des sous-titres (groupes), une mention (« 15 min d’attente »), et une photo prise parmi celles du site. La recherche retrouve un plat dans toute la carte.
- **Les formules** : nom, prix, condition (« Midi uniquement… »), les parties (entrée, plat, dessert) avec leurs lignes, au choix ou tout compris, ainsi qu’une photo et un texte facultatifs.
- **Sauvegardes** : chaque publication garde la version précédente, soit les 30 dernières. Un clic remet une ancienne version en ligne.
- **Mot de passe** : pour le changer.

Tant que l’on n’a pas cliqué sur « Publier », rien ne change sur le site, et « Annuler les modifications » revient à la version en ligne. Le panneau refuse de publier un plat sans prix ou avec un prix mal écrit, et indique où corriger.

**Carte A3 à imprimer :** le lien **Carte A3** du panneau ouvre la carte papier (A3 paysage, recto-verso, pli roulé en 3 volets de 141 / 141 / 138 mm), générée à partir des mêmes données que le site. Elle est claire, sur fond crème ou gris clair au choix (prix en brique ; seule la couverture garde le mur de briques) et la taille du texte s’ajuste pour tout faire tenir. Une catégorie n’est jamais coupée entre l’intérieur, le rabat et le dos. Elle se met à jour toute seule. Cliquez sur « Imprimer ou enregistrer en PDF », en A3 paysage, recto-verso bord court, sans marges et avec les graphiques d’arrière-plan. Le format « imprimeur » ajoute 3 mm de fonds perdus. Une formule dont la case « Imprimer sur la carte A3 » est décochée (la fondue) n’y figure pas. Les PDF du 25 septembre 2026 sont dans `impression/` : `carte-a3.pdf` et `carte-a3-imprimeur.pdf` (crème), `carte-a3-gris.pdf` et `carte-a3-gris-imprimeur.pdf` (gris clair).

**Comment ça marche :** la carte et les formules sont dans `donnees/carte.json`. À chaque publication, le panneau réécrit `index.html` à partir du gabarit `admin/modele.html`. Il ne faut donc plus modifier la carte directement dans `index.html` : ces changements seraient écrasés à la publication suivante. Pour régénérer la page sans le panneau : `php admin/publier.php`.

Les horaires se trouvent dans `admin/modele.html` (tableau de la section `id="infos"`) et dans `SERVICES`, en haut de `assets/js/site.js` : c’est lui qui calcule « Ouvert / Fermé ».

**Sécurité :**

- Le mot de passe est enregistré chiffré (`donnees/admin.json`).
- Après 5 essais ratés, la connexion est bloquée 15 minutes.
- Chaque modification est protégée contre les requêtes envoyées depuis un autre site.
- Le dossier `donnees/` n’est jamais accessible depuis le navigateur.
- En ligne, utilisez le panneau en **HTTPS**.

## Fichiers

- `index.html` : la page publique, générée par le panneau (ne pas la modifier à la main).
- `donnees/carte.json` : la carte et les formules, que le panneau modifie.
- `admin/` : le panneau d’administration (PHP). `admin/modele.html` est le gabarit de la page.
- `assets/css/site.css` : l’apparence.
- `assets/js/site.js` : statut ouvert/fermé, recherche, liste de commande. Sans JavaScript, la carte reste entièrement lisible.
- `assets/img/` : les photos, en WebP. Chaque photo a un fichier `.json` à côté qui indique sa provenance.
- `assets/fonts/` : les polices, hébergées sur le site (aucun appel à Google Fonts).
- `server.js` et `package.json` : le serveur Node.js (`npm start`).
- `PRODUCT.md` et `DESIGN.md` : le contexte produit et le système visuel, pour les prochaines modifications.

## Lancer le site avec Node.js

Il faut Node.js 18 ou plus récent. Il n’y a aucune dépendance à installer.

```sh
npm start
```

Puis ouvrir http://localhost:3000. Pour changer de port : `PORT=8080 npm start`.

Le serveur (`server.js`) ne sert que la page et le dossier `assets/`. Les fichiers de travail (`PRODUCT.md`, `DESIGN.md`, `.impeccable/`, `.git`…) ne sont jamais accessibles depuis le navigateur. Il compresse le texte (gzip) et gère le cache des fichiers.

Le serveur Node ne fait pas tourner le panneau d’administration, qui a besoin de PHP (voir XAMPP ci-dessous). La page publique reste statique : on peut aussi déposer `index.html` et `assets/` chez n’importe quel hébergeur, sans Node.

## Lancer le site avec XAMPP (Apache)

Il suffit d’Apache et de PHP, tous deux inclus dans XAMPP. MySQL n’est pas utile.

1. Copier le dossier du site dans `C:\xampp\htdocs\fleur-dor\` (sur Mac : `/Applications/XAMPP/htdocs/fleur-dor/`), en gardant les fichiers `.htaccess`.
2. Dans le XAMPP Control Panel, démarrer **Apache**.
3. Ouvrir http://localhost/fleur-dor/ pour le site, et http://localhost/fleur-dor/admin/ pour le panneau.

Chez un hébergeur, PHP doit pouvoir écrire dans `index.html` et dans le dossier `donnees/`.

Le fichier `.htaccess` règle la compression et le cache, et renvoie une erreur 404 pour tout ce qui n’est pas le site : `.git`, `.impeccable`, fichiers `.md` et `.json`, `server.js`. Le dossier `donnees/` et les fichiers internes du panneau (`lib.php`, `modele.html`, `publier.php`) sont refusés. On peut donc copier le dépôt entier dans `htdocs` sans rien exposer. Il fonctionne même si certains modules Apache sont désactivés. Le même `.htaccess` sert chez un hébergeur Apache (OVH, o2switch…).

**Trois autres modèles, même format :** la page Carte A3 propose aussi trois styles de la même carte pliée en 3 volets, avec le même contenu et la même palette (`carte-a3.php?modele=…`) :

- **Livret** (`livret`) : papier crème, marque dans un cadre or, titres soulignés d’un double filet, grandes parties entre deux filets.
- **Ardoise** (`ardoise`) : papier gris clair, bandeau ardoise en couverture, titres de catégorie en ardoise, plats en lignes de tableau, formules en fiches.
- **Bistrot** (`bistrot`) : papier crème, bandeau de briques en couverture, grandes parties sur ardoise, losanges or devant les catégories.

La taille du texte s’ajuste comme pour la carte actuelle (plats 10 à 10,5 pt, formules environ 8 pt). Les PDF sont dans `impression/` (`carte-a3-livret.pdf`, `carte-a3-ardoise.pdf`, `carte-a3-bistrot.pdf`, et leurs versions `-imprimeur`).

**Affiche QR code :** le lien « Affiche QR code » du panneau ouvre l’affiche « Scannez pour accéder au menu », en affiche A4, en 4 cartes de table A6 à découper, ou en 10 étiquettes au format carte de visite (85 × 55 mm) à coller au bord des tables. Le QR code mène aux formules et à la carte du site (`/#formules`) ; saisissez l’adresse du site en haut de la page (par défaut, celle du serveur), puis testez le code avec un téléphone avant d’imprimer. Le code est calculé dans la page par `admin/vendor/qrcode.js` (qrcode-generator, licence MIT), sans service extérieur. Les PDF du 25 septembre 2026 (`impression/affiche-qr-a4.pdf`, `impression/affiche-qr-cartes-a6.pdf`, `impression/etiquettes-qr-carte-de-visite.pdf`) pointent vers https://www.restaurant-lafleurdor.com/.

## Deuxième site : Le Monorom

Le dossier `le-monorom/` contient un second site complet, sur le même modèle, pour le restaurant Le Monorom à Castelsarrasin : mêmes plats et formules au départ, mais nom, enseigne, adresse, horaires, téléphone, e-mail, paiements et photos du Monorom. Il a son propre panneau d’administration et sa propre carte. Voir `le-monorom/LISEZMOI.md`.

## Mettre en ligne sur un serveur Amazon Linux (EC2)

Le script `deploy/amazon-linux.sh` installe Apache, PHP et git, télécharge le site depuis GitHub dans `/var/www/fleur-dor` et le met en ligne sur le port 80. Il marche sur Amazon Linux 2023 et Amazon Linux 2.

**Première fois**, dans la console de l’instance :

```bash
curl -fsSL https://raw.githubusercontent.com/laurenttranchard9-beep/Fleur-d-or/claude/practical-mendel-dpj572/deploy/amazon-linux.sh | sudo bash
sudo -u apache php /var/www/fleur-dor/admin/mot-de-passe.php
```

La deuxième ligne crée le mot de passe du panneau (au moins 10 caractères). Le script installe aussi le site du Monorom, à l’adresse `/le-monorom/` ; son mot de passe se crée avec `sudo -u apache php /var/www/fleur-dor/le-monorom/admin/mot-de-passe.php`. Pour lui donner son propre nom de domaine (déjà dirigé vers le serveur) : `sudo MONOROM_DOMAINE=www.restaurantlemonorom.com bash /var/www/fleur-dor/deploy/amazon-linux.sh`. Sur un serveur qui héberge déjà d’autres sites, `MONOROM_SEUL=1` n’installe que Le Monorom sur son domaine, dans son propre fichier `/etc/httpd/conf.d/le-monorom.conf`, sans toucher aux autres sites : `sudo MONOROM_SEUL=1 MONOROM_DOMAINE=lemonorom.fr bash /var/www/fleur-dor/deploy/amazon-linux.sh`. Plusieurs sites partagent sans problème la même adresse IP : Apache les distingue par leur nom de domaine. Ouvrez aussi le port 80 (HTTP) dans le groupe de sécurité de l’instance.

**Mettre à jour** après un changement sur GitHub :

```bash
sudo bash /var/www/fleur-dor/deploy/amazon-linux.sh
```

La mise à jour prend la carte de GitHub. Si la carte avait été changée sur le serveur, dans le panneau, cette version est d’abord gardée : elle apparaît dans l’onglet « Sauvegardes » du panneau et peut être remise en ligne d’un clic. Le mot de passe du panneau est conservé.

Si le dépôt GitHub est privé, la première commande doit être remplacée par un `git clone` avec un jeton d’accès GitHub : `sudo git clone --branch claude/practical-mendel-dpj572 https://<jeton>@github.com/laurenttranchard9-beep/Fleur-d-or.git /var/www/fleur-dor`, puis `sudo bash /var/www/fleur-dor/deploy/amazon-linux.sh`.

## À vérifier par le restaurant

- Le texte d’un dessert, « Colonel chinois (glace citron vert et saké) » : la carte imprimée écrit « saté », que j’ai pris pour une coquille.
- La livraison Uber Eats : l’ancien site en montrait le logo. Est-elle toujours proposée ?
- La carte « à emporter » de l’ancien site (un livret feuilleté séparé) n’a pas été reprise.
- Photos : le plateau de sushis vient d’Unsplash, et deux photos de l’ancien site (fondue, bols d’herbes) ressemblent à des photos de banque d’images. Des photos des vrais plats du restaurant seraient plus parlantes.
- Mentions légales : à ajouter (éditeur du site, hébergeur), car ces informations n’étaient pas disponibles.
