"""Regenerate the self-hosted web font public/assets/fonts/inter.woff2.

Apple devices render the site in SF Pro (the system font) and never download it;
every other device gets Inter, the closest open-licensed face.
Requires: pip install fonttools brotli
Usage: python tools/fonts.py

Source (SIL Open Font License 1.1, see public/assets/fonts/OFL.txt):
  Inter — Rasmus Andersson (github.com/rsms/inter)
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


def fetch(path):
    with urllib.request.urlopen(f"{GF}/{path}") as response:
        return TTFont(io.BytesIO(response.read()))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    font = fetch("inter/Inter%5Bopsz%2Cwght%5D.ttf")
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    options.hinting = False
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=subset.parse_unicodes(LATIN))
    subsetter.subset(font)
    # Weights 400–700 only (subset first: fontTools trips over limiting axes on the full font).
    # The optical-size axis stays, so large titles get Inter's display cut.
    font = instancer.instantiateVariableFont(font, {"wght": (400, 700)})
    font.flavor = "woff2"
    font.save(OUT / "inter.woff2")
    print(f"inter.woff2: {(OUT / 'inter.woff2').stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
