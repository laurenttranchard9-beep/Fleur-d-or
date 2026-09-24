---
name: La Fleur d'Or
description: Trois cuisines sous un même toit, bâties comme la halle de brique de Grenade.
colors:
  brique: "#ac4429"
  brique-sombre: "#8c3520"
  tuile: "#b5553a"
  ardoise: "#23272b"
  ardoise-2: "#2d3237"
  ardoise-3: "#3b4147"
  craie: "#fff6ec"
  craie-2: "#bfb8ae"
  or: "#f2b53a"
  or-clair: "#f8c95f"
  chene: "#3a2a20"
  chene-2: "#5b3f2b"
  papier: "#fbf8f2"
  encre: "#1e1a17"
  encre-2: "#5d5650"
  piment: "#e8553a"
typography:
  display:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(3.25rem, 1.4rem + 6.2vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.86
    letterSpacing: "0"
    fontVariation: "'wdth' 62"
  headline:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(2.75rem, 1.6rem + 4.4vw, 5.25rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 68"
  title:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(1.625rem, 1.3rem + 1vw, 2rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 68"
  body:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "0.1em"
  price:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 800
    lineHeight: 1.3
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 68"
  enseigne:
    fontFamily: "Noto Serif TC, Songti TC, serif"
    fontSize: "27px"
    fontWeight: 900
    lineHeight: 1
rounded:
  plaque: "2px"
  outil: "3px"
  pastille: "999px"
  disque: "50%"
spacing:
  gouttiere: "clamp(16px, 4.5vw, 72px)"
  rang: "2.75rem"
  pilier: "14px"
  ardoise: "22px"
  section: "clamp(64px, 8vw, 120px)"
components:
  button-primary:
    backgroundColor: "{colors.or}"
    textColor: "{colors.ardoise}"
    rounded: "{rounded.outil}"
    padding: "0 22px"
    height: "56px"
  button-primary-hover:
    backgroundColor: "{colors.or-clair}"
    textColor: "{colors.ardoise}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.craie}"
    rounded: "{rounded.outil}"
    padding: "0 22px"
    height: "56px"
  input-search:
    backgroundColor: "{colors.ardoise-2}"
    textColor: "{colors.craie}"
    rounded: "{rounded.outil}"
    padding: "0 56px 0 50px"
    height: "58px"
  chip-filter:
    backgroundColor: "transparent"
    textColor: "{colors.craie}"
    rounded: "{rounded.outil}"
    padding: "0 16px"
    height: "44px"
  chip-filter-active:
    backgroundColor: "{colors.or}"
    textColor: "{colors.ardoise}"
  nav-poutre:
    backgroundColor: "{colors.chene}"
    textColor: "{colors.craie}"
    height: "64px"
  ardoise:
    backgroundColor: "{colors.ardoise}"
    textColor: "{colors.craie}"
    rounded: "{rounded.outil}"
    padding: "20px"
  ilot:
    backgroundColor: "{colors.tuile}"
    textColor: "{colors.craie}"
    rounded: "{rounded.plaque}"
    padding: "9px 10px 8px"
  carnet:
    backgroundColor: "{colors.papier}"
    textColor: "{colors.encre}"
    rounded: "{rounded.plaque}"
    padding: "30px 22px 22px"
---

# Design System: La Fleur d'Or

## Overview

**Creative North Star: "La halle de Grenade"**

The site is built like the brick market hall at the heart of the bastide of Grenade: a roof of oak, walls and pillars of Toulouse brick, and under it stalls with slate boards and prices in chalk. Three cuisines (Chinese, Thai, Japanese) sit under that one roof the way stalls share a halle. The brick holds the house together (welcome, set menus, practical info). The slate holds whatever you read at length (the carte, the set menus). The gold of the golden flower (金花, the restaurant's own Chinese name) marks what counts: prices, the call button, "open".

Density follows the market: dense menu passages, each one a stall of ruled rows, alternate with quiet bands (the takeaway band on dark brick). Materials are drawn flat. The brick is the real *brique foraine* coursing (wide, thin bricks, staggered joints) drawn as a vector tile. The oak and the slate are flat colours. Nothing is bevelled, embossed or chalk-effected. The direction refuses the Asian-restaurant defaults (red lanterns, gold dragons, cherry blossom) and the zen-white sushi-bar minimalism alike.

The one motion is the roller shutters (rideaux de fer) over the three food bays: they roll up once on load when the restaurant is open, and stay a third of the way down, with the reopening time painted on, when it is closed.

**Key Characteristics:**
- Brick fields own whole regions; slate boards carry reading; oak bars carry navigation.
- One family, Archivo: condensed 800 capitals for fascia-style display, normal-width 400 for reading.
- Gold is spent only on prices, the call to action, the live "open" state and the brand discs.
- Menu rows are brick courses: one row per course (2.75rem), never boxed.
- The 金花餐廳 sign (four characters in gold discs) is the brand mark.

## Colors

A committed palette: saturated brick fields, blue-black slate, dark oak, one gold.

### Primary
- **Brique de Grenade** (brique): the ground of the house. Hero, set menus and infos sit on this colour under the brick-coursing tile. White chalk text reaches 5.8:1 on it.
- **Brique d'ombre** (brique-sombre): recessed brick. Pillars between the photo bays, the quiet takeaway band, the frame around the dining-room photos.
- **Tuile canal** (tuile): roof tiles seen from above. Used only for the blocks of the bastide plan (the carte index).

### Secondary
- **Or de la fleur** (or): prices, the primary button, the live "open" dot, the 金 discs, the word "Or" in the name. On brick it reaches only 3.16:1, so there it is used at large sizes only.
- **Or clair** (or-clair): hover state of gold controls.

### Tertiary
- **Piment** (piment): the chilli mark on spicy dishes. Always paired with the text "pimenté" for screen readers.

### Neutral
- **Ardoise** (ardoise): the market slate. The carte section, the set-menu boards, the bay labels, the live status plate.
- **Ardoise levée** (ardoise-2) and **Ardoise usée** (ardoise-3): the search field and its borders, chip borders.
- **Craie** (craie): all text on brick and slate.
- **Craie passée** (craie-2): secondary text on slate only (counts, descriptions, placeholders): 7.6:1 on slate. Never on brick.
- **Chêne** (chene) and **Chêne clair** (chene-2): the header beam, the footer, the bottom bar on phones, the frames of the slate boards, the sign.
- **Papier**, **Encre**, **Encre passée** (papier, encre, encre-2): the order pad (carnet), and nowhere else.

### Named Rules
**The Brick-Is-Structure Rule.** Brick carries the house; slate carries reading. Never set a dense list (dishes, prices) directly on brick.
**The Gold-Is-Money Rule.** Gold marks prices, the call action and "open". It is never decoration, and never body-size text on brick.
**The Paper-Is-The-Pad Rule.** The warm paper colour exists only on the order pad. It never becomes a page ground.

## Typography

**Display Font:** Archivo, self-hosted variable (width 62–125 %, weight 400–800), with Helvetica Neue and Arial as fallback
**Body Font:** Archivo at normal width
**Brand Font:** Noto Serif TC 900, subset to the four characters 金花餐廳 only

**Character:** a condensed grotesque in heavy capitals, like painted shop fascias in the Midi, paired with the same family at normal width for calm reading. The width axis does the display work, so there is only one family.

### Hierarchy
- **Display** (800, width 62 %, clamp(3.25rem → 6rem), line-height 0.86, capitals): the restaurant's name, once.
- **Headline** (800, width 68 %, clamp(2.75rem → 5.25rem), line-height 0.9, capitals): section titles (Les formules, La carte, Horaires et accès) and the takeaway line.
- **Title** (800, width 68 %, clamp(1.625rem → 2rem), capitals): stall titles in the carte, district bands, set-menu names, pad title.
- **Body** (400, 1.0625rem, line-height 1.55): dish names, paragraphs. Paragraph measure capped at 58ch.
- **Label** (800, 0.8125rem, letter-spacing 0.1em, capitals): group names inside a stall, course names on a board, table heads. Never above a heading as a kicker.
- **Price** (800, width 68 %, 1.1875rem, tabular figures, gold): every price.

### Named Rules
**The One-Face Rule.** Archivo only, weights 400 and 800 only. The CJK face appears only in the 金花餐廳 mark.
**The Tabular-Money Rule.** Every price, total and phone number uses tabular figures.

## Layout

A 1320px maximum content width, with a fluid side gutter from 16px to 72px. Sections breathe with clamp(64px, 8vw, 120px) vertical padding. More space sits above a heading than below it.

- **Hero:** two columns (text 1.08fr, bays 0.92fr) at 1000px and up. Below that it becomes one column, and the three bays sit as a row under the text.
- **Photo bays:** three equal bays between 14px brick pillars under a 30px oak beam. The same bay structure frames the dining-room photos in the infos section.
- **Set menus:** slate boards hung in CSS columns (272px minimum, 22px gutter), so short boards leave no holes.
- **The carte:** content column plus a 340px sticky order pad from 1100px up. Stalls flow in two columns (330px minimum) and never split. Rows are one course high (2.75rem). Below 1100px the pad becomes a bottom panel, opened from a fixed bottom bar with Appeler and Ma liste.
- **Bastide plan:** a 12-column grid of districts: the Chinese and Thai district (7 columns, 2 rows), the sushi bar (5 columns), the halle for set menus (5 columns), desserts (4 columns), the bar (8 columns). Each block's flex-grow is its number of dishes. On phones the districts stack.
- **Sticky layers:** the oak header (64px, 56px on phones), then the section bar (52px, 48px on phones) inside the carte. Anchored stalls use a scroll margin that clears both.

## Elevation & Depth

Depth is physical and hung, never floating. Objects hang on the brick wall (slate boards, the sign), sit under the beam (bays), or lie on the table (the order pad). Every shadow has a vertical offset and a soft blur. Bays are openings, drawn with inset shadows under the beam.

### Shadow Vocabulary
- **Hung board** (`box-shadow: 0 16px 26px -14px rgba(20, 6, 2, 0.75)`): set-menu slates.
- **Button lift** (`box-shadow: 0 8px 18px -8px rgba(20, 8, 2, 0.6)`): gold primary button, status plate.
- **Beam** (`box-shadow: 0 6px 14px -6px rgba(0, 0, 0, 0.55)`): header beam and the beam over the bays.
- **Bay opening** (`box-shadow: inset 0 22px 26px -12px rgba(0, 0, 0, 0.7)`): inside each photo bay.
- **Pad on the table** (`box-shadow: 0 18px 32px -16px rgba(0, 0, 0, 0.9)`): the order pad.

### Named Rules
**The Hung-Not-Floating Rule.** Shadows fall downward from where an object hangs. No zero-offset glows, no hard offset block shadows.

## Shapes

Nearly square. Plates and photos take 2px corners, tools (buttons, inputs, chips, boards) take 3px. Only count badges are pills and only the brand discs and add buttons are circles. Slate boards have a 10px oak frame. The order pad has a brick binding strip with perforations along the top.

**The Square-Market Rule.** Market objects have square corners. Nothing is rounded beyond 3px except discs and badges.

## Components

### Buttons
- **Shape:** tool corners (3px), 56px high.
- **Primary:** gold with slate text, condensed 800 capitals, the phone icon on the left. Used for "Appeler" everywhere.
- **Hover / Focus:** lighter gold and a 1px lift. The focus ring is 3px chalk (it would vanish in gold on gold).
- **Secondary:** transparent with a 2px chalk outline, "Voir la carte" and "Itinéraire". On hover it takes a 12 % chalk wash.

### Chips
- **Style:** quick searches under the search field, 44px high, 2px slate-worn border, chalk text.
- **State:** a pressed chip turns gold with slate text (`aria-pressed`), and pressing it again clears the search.

### Cards / Containers
- **Slate board (ardoise):** slate inside a 10px oak frame, 20px padding, hung shadow. Name and gold price on one line, conditions in gold with a clock icon, courses as labels with "au choix" lists, and a dashed "Noter sur ma liste" control that turns solid gold once noted.
- **Stall (étal):** no box. A title, a count line, a 4px mortar rule, then rows. Optional 16:9 photo on top.

### Inputs / Fields
- **Style:** raised slate, 2px worn-slate border, 58px high, loupe icon inset left, clear button right.
- **Focus:** the border turns gold; caret is gold.

### Navigation
- **Header beam:** flat oak, mark on the left (金 disc and name), links centred, the phone number as a gold button on the right. Phones keep the mark and a square phone button.
- **Section bar:** sticky slate strip of the carte's stalls; the current stall is chalk with a 3px gold underline; it scrolls horizontally with faded edges.

### Menu row (plat)
A grid of name, dotted leader, gold price and a 38px round add button (44px hit area). Descriptions sit under the name in chalk-faded text. Once added, the button fills gold and shows the quantity. Wine rows carry two formatted prices (37,5 cl and 75 cl, or 1/4 and 1/2) and no add button.

### Bastide plan (ilot)
Tile-red blocks with vertical canal-tile hatching, the stall name in condensed capitals and its count. During a search every block shows "found / total" in a gold tag, and blocks with no match fade out and stop taking clicks. The halle block (set menus) is oak with a timber grid and a gold inner frame.

### Order pad (carnet)
White paper with a perforated brick binding strip, the brick title "Ma liste", lines with a round minus and plus, a double rule over the total, and the gold call button. It is sticky on desktop and a bottom panel on phones. It is saved in the browser and absent without JavaScript.

### Roller shutters (volet)
Flat grey slats over each photo bay. They roll up (translateY) once on load when open. When closed they sit at 44 % with "Fermé" and the reopening time painted on them. They are the only authored motion.

## Do's and Don'ts

### Do:
- **Do** put every list of dishes or prices on slate (ardoise) with chalk text and gold prices.
- **Do** keep one row per brick course (2.75rem minimum) with a dotted leader between name and price.
- **Do** draw icons from the SVG sprite (2px strokes, round caps), with the chilli always paired with the text "pimenté".
- **Do** keep shadows offset and blurred, hanging downward.
- **Do** keep the live status and the shutters wired to the real hours (lunch 12h–14h, dinner 18h–22h, closed Sunday lunch and Monday).

### Don't:
- **Don't** use red lanterns, gold dragons, cherry blossom or brush-stroke ornaments as decoration.
- **Don't** fall back to zen-white minimalism for the sushi bar; it lives under the same brick roof.
- **Don't** add bevels, wood grain, embossing or chalk textures. The materials stay flat.
- **Don't** box menu rows or nest cards inside the slate boards.
- **Don't** set gold text below 18.66px bold on brick (3.16:1 only).
- **Don't** put a kicker or eyebrow label above a heading.
