"""Regenerate the self-hosted web fonts in public/assets/fonts/.

Only needed when the Khmer words on the site change. Requires: pip install fonttools brotli
Usage: python tools/fonts.py

Sources (SIL Open Font License 1.1, see public/assets/fonts/OFL.txt):
  Kantumruy Pro — Tep Sovichet, Wei Huang (github.com/googlefonts/kantumruy)
  Moul          — Danh Hong (github.com/danhhong/Moul)
"""

import io
import pathlib
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "assets" / "fonts"
GF = "https://raw.githubusercontent.com/google/fonts/main/ofl"

LATIN = (
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,"
    "U+0300-0301,U+0303,U+0308,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212,U+2215"
)
KHMER = "U+1780-17FF,U+19E0-19FF,U+200B-200D,U+25CC"

# Every Khmer string the site displays in the Moul sign face.
MOUL_TEXT = "រសជាតិកម្ពុជា" + "អរគុណ" + "ឆ្ងាញ់" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz" + " -’"

PRICE_TEXT = "0123456789,.€+−-\u00a0\u202f "


def fetch(path):
    with urllib.request.urlopen(f"{GF}/{path}") as response:
        return TTFont(io.BytesIO(response.read()))


def save(font, name, unicodes=None, text=None, features="*"):
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = [features] if features == "*" else features
    options.name_IDs = ["*"]
    options.notdef_outline = True
    options.hinting = False
    subsetter = subset.Subsetter(options)
    subsetter.populate(
        unicodes=subset.parse_unicodes(unicodes) if unicodes else [],
        text=text or "",
    )
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(OUT / name)
    print(f"{name}: {(OUT / name).stat().st_size / 1024:.1f} KB")


def rename(font, family):
    for record in font["name"].names:
        if record.nameID in (1, 4, 16):
            record.string = family
        elif record.nameID == 6:
            record.string = family.replace(" ", "")


def tabular_digits(font):
    """Give 0–9 one shared advance so prices line up in a column."""
    cmap = font.getBestCmap()
    glyf, hmtx = font["glyf"], font["hmtx"]
    digits = [cmap[ord(d)] for d in "0123456789"]
    width = max(hmtx[g][0] for g in digits)
    for g in digits:
        advance, lsb = hmtx[g]
        dx = (width - advance) // 2
        glyph = glyf[g]
        if glyph.numberOfContours > 0:
            glyph.coordinates.translate((dx, 0))
            glyph.recalcBounds(glyf)
        hmtx[g] = (width, lsb + dx)


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    save(fetch("kantumruypro/KantumruyPro%5Bwght%5D.ttf"), "kantumruy-pro-latin.woff2", unicodes=LATIN)
    save(fetch("kantumruypro/KantumruyPro%5Bwght%5D.ttf"), "kantumruy-pro-khmer.woff2", unicodes=KHMER)

    prices = instancer.instantiateVariableFont(fetch("kantumruypro/KantumruyPro%5Bwght%5D.ttf"), {"wght": 600})
    tabular_digits(prices)
    rename(prices, "Kantumruy Pro Prix")
    save(prices, "kantumruy-pro-prix.woff2", text=PRICE_TEXT, features=["kern"])

    save(fetch("moul/Moul-Regular.ttf"), "moul-enseigne.woff2", text=MOUL_TEXT)


if __name__ == "__main__":
    main()
