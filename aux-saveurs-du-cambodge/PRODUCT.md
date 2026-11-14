# Product

<!-- impeccable:product-schema 1 -->

> Rédigé sans entretien : le commanditaire a donné « carte blanche ». Tout ce qui suit vient du site en ligne
> (auxsaveursducambodge-saintalban.com, relevé le 17/10/2026) ou de la Base Adresse Nationale.
> Les points marqués **[déduit]** sont des inférences à faire confirmer par le restaurant.

## Platform

web

## Stack

délégué : pages HTML/CSS/JS sans framework, générées par un petit script Node sans dépendance
(`build.mjs`) à partir de deux fichiers de données (`data/restaurant.json`, `data/carte.json`), plus un peu de PHP
(7.4 ou plus récent, sans base de données) pour ce qui doit vivre sur le serveur : les prix modifiables depuis
l'espace gestion (`/admin/`) et la mesure d'audience du site lui-même. Données du serveur en fichiers dans `donnees/`.
Hébergement choisi par le restaurant : IONOS (essai local possible avec XAMPP). Le site actuel tourne sur Squarespace ;
la bascule du domaine reste à faire.

## Users

- Voisins de Saint-Alban, Aucamville, Fenouillet, Launaguet et du nord toulousain qui cherchent « restaurant
  cambodgien / asiatique Saint-Alban » sur leur téléphone, souvent juste avant de commander.
- Actifs en pause déjeuner du lundi au vendredi (11 h 30 – 14 h) : la box anti-crise à 10 €, boisson comprise, leur est destinée **[déduit]**.
- Familles qui commandent le soir pour emporter, et clients qui veulent une table (« On vous garde une petite place ? ») **[déduit : sur place + à emporter]**.

Leur tâche : savoir si c'est ouvert, voir la carte et les prix, appeler pour commander ou réserver, trouver l'adresse.

## Product Purpose

Restaurant cambodgien familial : « Chez nous, tout est fait maison, avec des produits frais… et beaucoup d'amour ! »
Le site doit transformer une recherche locale en appel téléphonique ou en visite. Succès = un appel, un itinéraire lancé,
une carte consultée sans friction sur mobile.

## Positioning

Cuisine cambodgienne faite maison à prix de quartier, à Saint-Alban : lok lac, soupe Phnom Penh, porc au caramel,
nems et vapeurs maison, et un menu complet à 10 €. Ce n'est ni un « asiatique » générique ni une adresse gastronomique :
c'est la cuisine de la maison, servie comme chez soi.

## Operating Context

- Commande et réservation **par téléphone** : 07 59 52 53 41 (+33 7 59 52 53 41). Aucun système de commande en ligne n'existe.
- Adresse : 10 avenue Salvador Allende, 31140 Saint-Alban (Haute-Garonne). Coordonnées BAN : 43.688048, 1.40842.
- Horaires (donnés par le restaurant le 12/11/2026) : du lundi au jeudi 11 h 30 – 14 h et 18 h – 21 h ;
  vendredi et samedi 11 h 30 – 14 h et 18 h – 21 h 30 ; dimanche 18 h – 21 h. Plus de midi « sur commande ».
- Le site actuel contient un formulaire de contact générique (« Vous avez envie de travailler avec nous ? ») : texte de modèle Squarespace, pas une offre réelle.

## Capabilities and Constraints

- Carte d'environ 90 plats en 16 rubriques (box anti-crise, entrées, salades, vapeurs, soupes, porc, poulet, bœuf,
  canard, crevettes, seiches, spécialités du chef, brochettes, nouilles, accompagnements, desserts). Source : `data/carte.json`.
- Les plats principaux sont servis avec du riz nature ; supplément riz cantonais (porc ou crevettes) : 4,50 €.
- Prix publiés en euros TTC tels qu'affichés sur le site actuel ; aucun prix n'est inventé.
- Identité légale (06/11/2026) : raison sociale TRANCHARD, SIRET 517 803 433 00039, directeur de la publication
  Laurent Tranchard, hébergeur IONOS SARL.
- Dans l'espace gestion se changent les prix, noms et descriptions des plats, leur rubrique, et les noms des rubriques ; on y crée des rubriques et des plats. `data/carte.json` reste l'original ; la carte du site est rendue par le serveur à chaque visite.
- Mesure d'audience demandée par le restaurant (« des stats avec des cookies ») : faite par le site, dans les conditions
  d'exemption de consentement de la CNIL (cookie de 13 mois, données 25 mois, aucun tiers), refus possible.
- Non décidé / inconnu : livraison (ne pas l'annoncer), paiement accepté, nombre de couverts, e-mail, réseaux sociaux.

## Brand Commitments

- Nom : « Aux Saveurs du Cambodge » ; lieu : Saint-Alban.
- Formules existantes à conserver : « On vous garde une petite place ? », « Chez nous, tout est fait maison, avec des produits frais… et beaucoup d'amour ! », « Commandez dès maintenant ! ». Le « Menu bon et pas cher » est remplacé par la « Box anti-crise » (demande du 12/11/2026) : 2 nems (porc ou poulet), un haut de cuisse de poulet mariné ou deux pilons marinés avec leur riz, une boisson (Coca, Coca zéro, Oasis, Fuze Tea ; jus de coco + 1 €), 10 €.
- Aucun logo, aucune charte : l'identité visuelle de l'ancien site (gris Squarespace, Space Grotesk) n'est pas un engagement.
- Direction visuelle demandée le 03/11/2026 : « minimaliste comme le site d'Apple ». Elle remplace la direction « étal de marché » de la première refonte.
- Demande du 06/11/2026 : « plus d'animation, il faut que ce soit vivant », dans cette même direction.

## Evidence on Hand

- Textes et carte du site actuel (corrigés pour l'orthographe, voir `CORRECTIONS.md`).
- Aucune photo du restaurant ni des plats. Ne jamais présenter une image comme une photo des plats de la maison ;
  toute illustration doit être signalée comme telle et listée pour remplacement. Les plats du site sont dessinés
  (`tools/plats.mjs`) en attendant de vraies photos.
- Pas d'avis clients vérifiés : n'en afficher aucun, ne pas inventer de note.

## Product Principles

1. Le téléphone est le bouton principal : chaque écran mène à un appel en un geste.
2. La carte est le contenu : lisible au pouce, prix nets, rien à télécharger.
3. Dire l'heure juste : ouvert / fermé / prochain service, et l'heure de fermeture du service en cours.
4. Fait maison et prix de quartier : montrer la générosité, pas le luxe.
5. Rien d'inventé : ni avis, ni livraison, ni photos présentées comme réelles.

## Accessibility & Inclusion

Public large et local (tous âges) : texte confortable sur mobile, contrastes AA, cibles tactiles ≥ 44 px,
navigation clavier, contenu complet sans JavaScript, respect de `prefers-reduced-motion`.
L'espace gestion suit les mêmes exigences : il sert une personne, souvent sur téléphone, entre deux services.
