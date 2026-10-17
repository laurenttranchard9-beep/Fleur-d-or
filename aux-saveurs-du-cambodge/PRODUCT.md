# Product

<!-- impeccable:product-schema 1 -->

> Rédigé sans entretien : le commanditaire a donné « carte blanche ». Tout ce qui suit vient du site en ligne
> (auxsaveursducambodge-saintalban.com, relevé le 17/10/2026) ou de la Base Adresse Nationale.
> Les points marqués **[déduit]** sont des inférences à faire confirmer par le restaurant.

## Platform

web

## Stack

délégué : site statique HTML/CSS/JS sans framework, généré par un petit script Node sans dépendance
(`build.mjs`) à partir de deux fichiers de données (`data/restaurant.json`, `data/carte.json`).
Raison : hébergeable partout (Netlify, Cloudflare Pages, OVH, GitHub Pages), aucune maintenance de dépendances,
et une seule source de vérité pour les horaires, la carte et les données structurées.
Le site actuel tourne sur Squarespace ; la migration du domaine reste une décision du restaurant.

## Users

- Voisins de Saint-Alban, Aucamville, Fenouillet, Launaguet et du nord toulousain qui cherchent « restaurant
  cambodgien / asiatique Saint-Alban » sur leur téléphone, souvent juste avant de commander.
- Actifs en pause déjeuner du lundi au vendredi (12 h – 14 h) : le menu « bon et pas cher » à 10 € leur est destiné **[déduit]**.
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
- Horaires : lundi → vendredi 12 h – 14 h et 18 h – 21 h 45 ; samedi et dimanche 18 h – 21 h 45 ;
  le midi du week-end **uniquement sur commande, la veille pour le lendemain**.
- Le site actuel contient un formulaire de contact générique (« Vous avez envie de travailler avec nous ? ») : texte de modèle Squarespace, pas une offre réelle.

## Capabilities and Constraints

- Carte d'environ 90 plats en 16 rubriques (menu bon et pas cher, entrées, salades, vapeurs, soupes, porc, poulet, bœuf,
  canard, crevettes, seiches, spécialités du chef, brochettes, nouilles, accompagnements, desserts). Source : `data/carte.json`.
- Les plats principaux sont servis avec du riz nature ; supplément riz cantonais (porc ou crevettes) : 4,50 €.
- Prix publiés en euros TTC tels qu'affichés sur le site actuel ; aucun prix n'est inventé.
- Non décidé / inconnu : livraison (ne pas l'annoncer), paiement accepté, nombre de couverts, e-mail, réseaux sociaux,
  identité légale (raison sociale, SIRET, directeur de publication) pour les mentions légales.

## Brand Commitments

- Nom : « Aux Saveurs du Cambodge » ; lieu : Saint-Alban.
- Formules existantes à conserver : « On vous garde une petite place ? », « Chez nous, tout est fait maison, avec des produits frais… et beaucoup d'amour ! », « Commandez dès maintenant ! », « Menu bon et pas cher ».
- Aucun logo, aucune charte : l'identité visuelle actuelle (gris Squarespace, Space Grotesk) n'est pas un engagement.

## Evidence on Hand

- Textes et carte du site actuel (corrigés pour l'orthographe, voir `CORRECTIONS.md`).
- Aucune photo du restaurant ni des plats. Ne jamais présenter une image comme une photo des plats de la maison ;
  toute illustration doit être signalée comme telle et listée pour remplacement.
- Pas d'avis clients vérifiés : n'en afficher aucun, ne pas inventer de note.

## Product Principles

1. Le téléphone est le bouton principal : chaque écran mène à un appel en un geste.
2. La carte est le contenu : lisible au pouce, prix nets, rien à télécharger.
3. Dire l'heure juste : ouvert / fermé / prochain service, y compris la règle du midi en week-end sur commande.
4. Fait maison et prix de quartier : montrer la générosité, pas le luxe.
5. Rien d'inventé : ni avis, ni livraison, ni photos présentées comme réelles.

## Accessibility & Inclusion

Public large et local (tous âges) : texte confortable sur mobile, contrastes AA, cibles tactiles ≥ 44 px,
navigation clavier, contenu complet sans JavaScript, respect de `prefers-reduced-motion`.
