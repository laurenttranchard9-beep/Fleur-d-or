# Le Monorom : site du restaurant

Deuxième site, construit sur le même modèle que celui de La Fleur d’Or (`../`). La carte (plats, prix, formules) est la même au départ ; tout le reste est propre au Monorom :

- nom, lune dorée de l’enseigne à la place des caractères chinois ;
- adresse : 12 chemin de Benis, croisement route de Toulouse, lieu-dit Rouzeau, 82100 Castelsarrasin ;
- téléphone 05 63 29 23 81, e-mail contact.darachan@gmail.com ;
- horaires : du mardi au dimanche, 10h – 14h et 18h – 22h, fermé le lundi (ventes à emporter dès 10h et dès 18h) ;
- paiement : espèces, carte bancaire dès 10 €, Chèque Déjeuner, Ticket Restaurant ;
- photos de la salle zen, du bar à sushis et de la façade, reprises du site actuel du restaurant.

Informations reprises de https://www.restaurantlemonorom.com/ le 25 septembre 2026.

Ce dossier est un site complet et indépendant : son propre panneau d’administration (`admin/`, mot de passe à créer), sa propre carte (`donnees/carte.json`), sa carte A3 et ses affiches QR code. Modifier la carte ici ne change pas celle de La Fleur d’Or, et inversement.

- **Installation sur un serveur Amazon Linux (Apache), à côté d’autres sites** : `deploy/installer-monorom.sh` copie ce dossier dans `/var/www/le-monorom`, le sert à l’adresse `/le-monorom/` et, si on lui donne le domaine, sur `lemonorom.fr` :
  `curl -fsSL https://raw.githubusercontent.com/laurenttranchard9-beep/Fleur-d-or/claude/practical-mendel-dpj572/deploy/installer-monorom.sh | sudo bash -s -- lemonorom.fr`
  Relancer la même commande met le site à jour en gardant la carte, le mot de passe et les sauvegardes du panneau.
- **Sur le même serveur** que La Fleur d’Or, avec `deploy/amazon-linux.sh` : le site est à l’adresse `/le-monorom/`.
- **Seul, sur un autre hébergement ou sous XAMPP** : copiez le contenu de ce dossier (avec les `.htaccess`) à la racine du site ; il faut Apache et PHP 8.
- Après un changement de `admin/modele.html` : `php admin/publier.php` régénère `index.html`.
