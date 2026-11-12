"""Write the price list for Excel (livraison/carte-des-prix.xlsx) from data/carte.json.

One sheet, one row per dish in menu order, plus the supplements: section, dish, price,
details, remark. Prices are numbers formatted as euros, so they can be sorted and summed.
Prices changed later in the admin area live on the server and are not included.
Requires: pip install openpyxl
Usage: python tools/excel-prix.py
"""

import json
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.properties import PageSetupProperties

RACINE = Path(__file__).resolve().parent.parent
SORTIE = RACINE / "livraison" / "carte-des-prix.xlsx"
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
        "septembre", "octobre", "novembre", "décembre"]

carte = json.loads((RACINE / "data" / "carte.json").read_text(encoding="utf-8"))
resto = json.loads((RACINE / "data" / "restaurant.json").read_text(encoding="utf-8"))
an, mois, jour = (int(x) for x in carte["updated"].split("-"))
date_carte = f"{jour} {MOIS[mois - 1]} {an}"

# Une ligne par plat, dans l'ordre de la carte, puis le supplément de riz cantonais.
lignes = []
for section in carte["sections"]:
    for plat in section["items"]:
        remarques = []
        if section.get("withRice"):
            remarques.append("Servi avec du riz nature")
        if plat.get("spicy"):
            remarques.append("Piquant")
        lignes.append((section["title"], plat["name"], plat["price"], plat.get("desc", ""), ", ".join(remarques)))
riz = carte["riceUpgrade"]
lignes.append(("Suppléments", riz["name"], riz["price"],
               "À la place du riz nature, avec les plats servis avec du riz", ""))

POLICE = "Arial"
ENCRE = "1D1D1F"
GRIS = "6E6E73"
PERLE = "F5F5F7"
FILET = Side(style="thin", color="D2D2D7")
FORMAT_EUROS = '#,##0.00 "€"'

classeur = Workbook()
feuille = classeur.active
feuille.title = "Carte"
classeur.properties.title = f"{resto['name']} — carte et prix"
classeur.properties.creator = resto["name"]

feuille["A1"] = f"{resto['name']} — carte et prix"
feuille["A1"].font = Font(name=POLICE, size=14, bold=True, color=ENCRE)
feuille["A2"] = (f"Prix en euros, toutes taxes comprises, d'après la carte du site mise à jour le {date_carte}. "
                 "Les prix changés ensuite dans l'espace gestion du site ne sont pas repris ici.")
feuille["A2"].font = Font(name=POLICE, size=9, color=GRIS)

ENTETE = 4
titres = ["Rubrique", "Plat", "Prix (€ TTC)", "Détail", "Remarque"]
for col, titre in enumerate(titres, start=1):
    cellule = feuille.cell(row=ENTETE, column=col, value=titre)
    cellule.font = Font(name=POLICE, size=10, bold=True, color=ENCRE)
    cellule.fill = PatternFill("solid", fgColor=PERLE)
    cellule.border = Border(bottom=Side(style="thin", color="86868B"))
    cellule.alignment = Alignment(horizontal="right" if col == 3 else "left", vertical="center", indent=2 if col == 4 else 0)
feuille.row_dimensions[ENTETE].height = 20

precedente = None
for i, (rubrique, nom, prix, detail, remarque) in enumerate(lignes):
    ligne = ENTETE + 1 + i
    valeurs = [rubrique, nom, prix, detail, remarque]
    for col, valeur in enumerate(valeurs, start=1):
        cellule = feuille.cell(row=ligne, column=col, value=valeur if valeur != "" else None)
        cellule.font = Font(name=POLICE, size=10, color=ENCRE if col != 4 else GRIS, bold=(col == 2))
        cellule.alignment = Alignment(vertical="top", wrap_text=(col == 4), horizontal="right" if col == 3 else "left",
                                      indent=2 if col == 4 else 0)
        # Un filet sépare les rubriques.
        if rubrique != precedente and precedente is not None:
            cellule.border = Border(top=FILET)
    feuille.cell(row=ligne, column=3).number_format = FORMAT_EUROS
    precedente = rubrique

derniere = ENTETE + len(lignes)
feuille.column_dimensions["A"].width = 22
feuille.column_dimensions["B"].width = 42
feuille.column_dimensions["C"].width = 14
feuille.column_dimensions["D"].width = 62
feuille.column_dimensions["E"].width = 26
feuille.freeze_panes = f"A{ENTETE + 1}"
feuille.auto_filter.ref = f"A{ENTETE}:E{derniere}"

# Impression : paysage, une page de large, l'en-tête du tableau répété sur chaque page.
feuille.page_setup.orientation = "landscape"
feuille.page_setup.paperSize = feuille.PAPERSIZE_A4
feuille.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
feuille.page_setup.fitToWidth = 1
feuille.page_setup.fitToHeight = 0
feuille.print_title_rows = f"{ENTETE}:{ENTETE}"
feuille.print_options.horizontalCentered = True
feuille.oddFooter.center.text = "Page &P sur &N"
feuille.oddFooter.center.font = POLICE

SORTIE.parent.mkdir(parents=True, exist_ok=True)
classeur.save(SORTIE)
print(f"{SORTIE.relative_to(RACINE)} : {len(lignes)} prix, rubriques {len(carte['sections']) + 1}")
