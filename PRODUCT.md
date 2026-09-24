# Product

<!-- impeccable:product-schema 1 -->

> Brief: "Refais ce site internet, tu as carte blanche, mais tous les plats doivent y être" (source: https://www.restaurant-lafleurdor.com/menu). The owner gave carte blanche, so no interview round was run. Facts below come from the current site and its printed menu; lines marked *(inferred)* are assumptions to confirm.

## Platform

web

## Stack

delegated: a static public page (`index.html`, CSS, a little vanilla JS) that works on any host and without JavaScript. A PHP back office (`admin/`, PHP 8.0+, no database) edits `donnees/carte.json`, the single source of the menu and set menus, and regenerates `index.html` from `admin/modele.html` on every "Publier". It runs under XAMPP or any Apache + PHP host. `server.js` (Node) serves the public page only.

## Users

- People from Grenade (Haute-Garonne, 31330) and the villages north of Toulouse deciding where to eat or what to order tonight. Mostly on a phone *(inferred)*.
- Weekday lunch customers looking for the midweek set menus (Menu Express 14 €, Menu 16,90 €, Menu Express japonais 17,90 €).
- Takeaway customers who read the menu, then phone in an order.
- Families and groups picking between the set menus (21,50 €, 26,90 €, sushi platters, the 2-person fondue made to order).

## Product Purpose

The site does three jobs, in this order: show the whole menu with prices so people can choose; make it obvious how to order or book (phone call); give the practical info (address, opening hours, weekly closing days).

## Positioning

La Fleur d'Or is a Chinese, Thai and Japanese restaurant with a sushi bar in one room. About two hundred dishes, from nems to sizzling plates to California rolls, cooked to order, at small-town prices. You can eat in or take away, lunch and dinner.

## Operating Context

- Address: 14 bis, avenue du Président Kennedy, 31330 Grenade.
- Phone: 05 61 82 43 56 (the only ordering and booking channel shown today).
- Service hours: lunch 12h–14h, dinner 18h–22h.
- Weekly closing: Sunday lunch, and all day Monday.
- Takeaway: set menus are available to take away at lunch and dinner and made when you order. The owner asked to remove the old site's "-10 % à emporter" mention (2026-09-24): do not show a takeaway discount.
- Weekday lunch set menus are not served on weekends or public holidays.
- Steamed dishes need about 15 minutes' wait; the 2-person fondue is made to order only.

## Capabilities and Constraints

- No online ordering, booking engine or payment. Every call to action is a phone call or directions.
- The menu is the full printed A3 menu (two pages). Every dish and price must be on the site. `donnees/carte.json` is the source; `index.html` is generated from it and must not be edited by hand.
- Back office (`admin/`): password-protected (created once from localhost), edits categories, dishes (name, detail, price or several formats, spicy), groups, the large parts of the menu, and the set menus; every publish keeps the previous version (last 30) and can restore it. No photo upload yet: photos are chosen among the files in `assets/img/`.
- Payment accepted (from the old site): cash, CB, Visa, Visa Electron, Mastercard, Maestro, and meal vouchers: Chèque Déjeuner, Chèque Restaurant, Chèque de Table, Ticket Restaurant.
- Delivery: the old site showed an Uber Eats logo, linked only to ubereats.com/fr *(still active? to confirm)*.
- Spicy dishes are marked on the printed menu (Salade thaï pimentée, Lap thaï au bœuf, the Thai specialities section) and keep that mark.
- Beef is "Origine France" (printed on the menu).
- Language: French.

## Brand Commitments

- Name: "La Fleur d'Or", with the Chinese name 金花餐廳 ("restaurant Fleur d'Or"). The old sign sets these four characters vertically, each in a disc, and a banner reads "Fleur d'Or, restaurant chinois, thaïlandais".
- The old site's title also says "Restaurant Thaï" and "Bar à sushis".
- Three cuisines named together: chinoises, thaïlandaises, japonaises.
- Facebook page: https://www.facebook.com/restaurantlafleurdorgrenade/
- Site credit, requested by the owner: "Création du site : Laurent TRANCHARD · laurenttranchard9@gmail.com" in the footer and on the admin login page. The footer also links to the admin login ("Se connecter").

## Evidence on Hand

- The full printed menu, transcribed into `donnees/carte.json` (source images: the two A3 menu pages on the current Wix site).
- Photos from the old site in `assets/img/`: the dining room (two views), the facade, canard laqué, bouchées vapeur, a hot-pot table (for the fondue), bowls of herbs and chillies. Some old-site photos look like stock images. One sushi photo comes from Unsplash (free licence). The owner's own photos should replace these over time.
- There are no customer reviews, press or awards to use, so the site must not invent any.

## Product Principles

1. The menu is the product. Every dish, every price, easy to scan and search on a phone.
2. One tap to call. The phone number is always within reach.
3. Say practical facts plainly (hours, closing days, lunch-only conditions, waiting times) so nobody is surprised.
4. Show three cuisines under one roof without turning any of them into a costume.

## Accessibility & Inclusion

Readable on small screens and in bright daylight *(inferred)*: large tap targets, strong contrast, prices in tabular numerals, spicy marks that also exist as text.
