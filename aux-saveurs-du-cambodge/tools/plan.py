"""Draw the neighbourhood map (public/assets/img/plan-quartier.svg) from IGN BD TOPO data.

Data: IGN – BD TOPO®, Licence Ouverte Etalab 2.0, fetched from the Géoplateforme WFS
and cached in tools/.cache/. The label font (a Kantumruy Pro subset) is embedded so the
file renders the same when loaded as an <img>. Requires: pip install fonttools brotli
Usage: python tools/plan.py
"""

import base64
import io
import json
import math
import pathlib
import urllib.parse
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / "tools" / ".cache"
OUT = ROOT / "public" / "assets" / "img" / "plan-quartier.svg"
FONT = ROOT / "public" / "assets" / "fonts" / "kantumruy-pro-latin.woff2"

LAT0, LON0 = 43.688048, 1.40842  # 10 avenue Salvador Allende (Base Adresse Nationale)
W, H = 800, 560
SCALE = 0.86  # px per metre
BBOX = "43.6835,1.3995,43.6925,1.4175"

LAYERS = [
    "troncon_de_route",
    "batiment",
    "troncon_de_voie_ferree",
    "surface_hydrographique",
    "zone_d_activite_ou_d_interet",
    "equipement_de_transport",
]

INK = "#2A170D"
GROUND = "#F2A51C"
BUILT = "#E59A17"
RICE = "#FFFBF3"
LEAF = "#2C7343"
LEAF_DEEP = "#1B5232"


def fetch(layer):
    path = CACHE / f"{layer}.json"
    if not path.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        query = urllib.parse.urlencode(
            {
                "SERVICE": "WFS",
                "VERSION": "2.0.0",
                "REQUEST": "GetFeature",
                "TYPENAMES": f"BDTOPO_V3:{layer}",
                "BBOX": f"{BBOX},urn:ogc:def:crs:EPSG::4326",
                "OUTPUTFORMAT": "application/json",
                "SRSNAME": "urn:ogc:def:crs:EPSG::4326",
                "COUNT": "5000",
            }
        )
        with urllib.request.urlopen(f"https://data.geopf.fr/wfs/ows?{query}") as response:
            path.write_bytes(response.read())
    return json.loads(path.read_text(encoding="utf-8"))["features"]


def project(lon, lat):
    x = (lon - LON0) * 111320 * math.cos(math.radians(LAT0)) * SCALE + W / 2
    y = -(lat - LAT0) * 111132 * SCALE + H / 2
    return x, y


def lines(geometry):
    kind, coords = geometry["type"], geometry["coordinates"]
    if kind == "LineString":
        return [coords]
    if kind == "MultiLineString":
        return coords
    if kind == "Polygon":
        return coords[:1]
    if kind == "MultiPolygon":
        return [poly[0] for poly in coords]
    return []


def path(coords, close=False):
    points = [tuple(round(v) for v in project(c[0], c[1])) for c in coords]
    points = [pt for i, pt in enumerate(points) if i == 0 or pt != points[i - 1]]
    if len(points) < 2:
        return ""
    d = f"M{points[0][0]} {points[0][1]}"
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        d += f"l{x1 - x0} {y1 - y0}"
    return d + ("z" if close else "")


def point_at(pts, fraction):
    total = sum(math.dist(a, b) for a, b in zip(pts, pts[1:]))
    target, run = total * fraction, 0
    for a, b in zip(pts, pts[1:]):
        step = math.dist(a, b)
        if run + step >= target and step:
            k = (target - run) / step
            return a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k
        run += step
    return pts[-1]


def area(ring):
    pts = [project(c[0], c[1]) for c in ring]
    return abs(sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1]))) / 2 / SCALE**2


def font_face(text):
    """Subset the site's label face to the glyphs the map uses and inline it."""
    font = TTFont(FONT)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["kern"]
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    buffer = io.BytesIO()
    font.flavor = "woff2"
    font.save(buffer)
    data = base64.b64encode(buffer.getvalue()).decode()
    return f"@font-face{{font-family:Plan;font-weight:300 700;src:url(data:font/woff2;base64,{data}) format('woff2')}}"


def visible(coords, margin=60):
    return any(-margin < x < W + margin and -margin < y < H + margin for x, y in (project(c[0], c[1]) for c in coords))


def main():
    roads = fetch("troncon_de_route")
    buildings = fetch("batiment")
    rail = fetch("troncon_de_voie_ferree")
    water = fetch("surface_hydrographique")
    zones = fetch("zone_d_activite_ou_d_interet")
    transport = fetch("equipement_de_transport")

    green = {"Espace public", "Stade", "Autre équipement sportif"}
    parts = []

    parts.append(f'<rect width="{W}" height="{H}" fill="{GROUND}"/>')

    zone_paths = [
        path(ring, close=True)
        for f in zones
        if f["properties"].get("nature") in green
        for ring in lines(f["geometry"])
        if visible(ring)
    ]
    parts.append(f'<path d="{" ".join(zone_paths)}" fill="{LEAF}" opacity=".85"/>')

    water_paths = [path(ring, close=True) for f in water for ring in lines(f["geometry"]) if visible(ring)]
    parts.append(f'<path d="{" ".join(water_paths)}" fill="{LEAF_DEEP}"/>')

    building_paths = [
        path(ring, close=True) for f in buildings for ring in lines(f["geometry"]) if visible(ring, 10) and area(ring) > 18
    ]
    parts.append(f'<path d="{" ".join(building_paths)}" fill="{BUILT}"/>')

    def road_class(p):
        if p.get("nature") == "Type autoroutier":
            return "autoroute"
        if p.get("nature") in {"Sentier", "Chemin", "Route empierrée"}:
            return "sentier"
        importance = int(p.get("importance") or 6)
        return "majeure" if importance <= 3 else "mineure"

    groups = {"autoroute": [], "majeure": [], "mineure": [], "sentier": []}
    for f in roads:
        p = f["properties"]
        for line in lines(f["geometry"]):
            if visible(line):
                groups[road_class(p)].append(path(line))

    parts.append(
        f'<path d="{" ".join(groups["sentier"])}" stroke="{RICE}" stroke-width="1.6" stroke-dasharray="3 4" fill="none" opacity=".9"/>'
    )
    minor = " ".join(groups["mineure"])
    major = " ".join(groups["majeure"])
    highway = " ".join(groups["autoroute"])
    parts.append(f'<path d="{minor}" stroke="{INK}" stroke-width="7.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".35"/>')
    parts.append(f'<path d="{major}" stroke="{INK}" stroke-width="12.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    parts.append(f'<path d="{minor}" stroke="{RICE}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    parts.append(f'<path d="{major}" stroke="{RICE}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    parts.append(f'<path d="{highway}" stroke="{INK}" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    parts.append(f'<path d="{highway}" stroke="{GROUND}" stroke-width="2" fill="none" stroke-dasharray="10 8"/>')

    rails = [path(line) for f in rail if f["properties"].get("nature") == "Voie ferrée principale" for line in lines(f["geometry"]) if visible(line)]
    parts.append(f'<path d="{" ".join(rails)}" stroke="{INK}" stroke-width="3" fill="none"/>')
    parts.append(f'<path d="{" ".join(rails)}" stroke="{INK}" stroke-width="9" fill="none" stroke-dasharray="1.6 9"/>')

    # Street labels follow the longest visible segment of each named street.
    labels = {
        "Avenue Salvador Allende": "Av. Salvador Allende",
        "Rue de Fenouillet": "Rue de Fenouillet",
        "Route de Paris": "Route de Paris",
        "Avenue du huit Mai 1945": "Av. du 8 Mai 1945",
        "Avenue du Sers": "Av. du Sers",
    }
    offsets = {"Avenue du huit Mai 1945": 62}
    defs, texts = [], []
    for name, label in labels.items():
        best, best_len = None, 0
        for f in roads:
            if (f["properties"].get("nom_voie_ban_gauche") or f["properties"].get("nom_collaboratif_gauche")) != name:
                continue
            for line in lines(f["geometry"]):
                pts = [project(c[0], c[1]) for c in line]
                inside = [pt for pt in pts if 20 < pt[0] < W - 20 and 20 < pt[1] < H - 20]
                length = sum(math.dist(a, b) for a, b in zip(inside, inside[1:]))
                if inside and math.dist(point_at(inside, offsets.get(name, 50) / 100), (W / 2, H / 2)) < 80:
                    length = 0  # keep labels clear of the marker
                if length > best_len:
                    best, best_len = inside, length
        if not best or best_len < 90:
            continue
        if best[0][0] > best[-1][0]:
            best = best[::-1]
        pid = "rue-" + "".join(ch for ch in name.lower() if ch.isalnum())
        defs.append(f'<path id="{pid}" d="M' + " L".join(f"{x:.1f} {y:.1f}" for x, y in best) + '"/>')
        texts.append(
            f'<text class="rue" dy="4"><textPath href="#{pid}" startOffset="{offsets.get(name, 50)}%" text-anchor="middle">{label}</textPath></text>'
        )

    pois = []
    for f in transport:
        if f["properties"].get("toponyme") == "Halte Ferroviaire de Fenouillet-Saint-Alban":
            ring = lines(f["geometry"])[0]
            cx = sum(c[0] for c in ring) / len(ring)
            cy = sum(c[1] for c in ring) / len(ring)
            pois.append(("Halte SNCF", project(cx, cy)))
    for f in zones:
        if f["properties"].get("toponyme") in {"Mairie de Saint-Alban", "Parc Municipal", "Stade Marius Coudon"}:
            ring = lines(f["geometry"])[0]
            cx = sum(c[0] for c in ring) / len(ring)
            cy = sum(c[1] for c in ring) / len(ring)
            name = {"Mairie de Saint-Alban": "Mairie", "Parc Municipal": "Parc municipal", "Stade Marius Coudon": "Stade"}[
                f["properties"]["toponyme"]
            ]
            pois.append((name, project(cx, cy)))
    for name, (x, y) in pois:
        if 30 < x < W - 30 and 30 < y < H - 30:
            texts.append(
                f'<g class="lieu" transform="translate({x:.1f} {y:.1f})"><circle r="5" fill="{RICE}" stroke="{INK}" stroke-width="2"/>'
                f'<text x="9" y="4">{name}</text></g>'
            )

    # Scale bar: 100 m.
    bar = 100 * SCALE
    texts.append(
        f'<g class="note" transform="translate(24 {H - 28})"><rect width="{bar:.1f}" height="6" fill="{INK}"/>'
        f'<rect width="{bar / 2:.1f}" height="6" fill="{RICE}" stroke="{INK}" stroke-width="1.5"/><text y="-7">100 m</text></g>'
    )
    texts.append(
        f'<g class="note" transform="translate({W - 34} 34)"><circle r="18" fill="{RICE}" stroke="{INK}" stroke-width="2"/>'
        f'<path d="M0 -12 L6 6 L0 2 L-6 6 Z" fill="{INK}"/><text y="-22" text-anchor="middle">N</text></g>'
    )

    marker = (
        f'<g transform="translate({W / 2} {H / 2})">'
        f'<circle r="30" fill="{INK}" opacity=".16"/>'
        f'<path d="M0 0 C-4 -10 -17 -19 -17 -32 A17 17 0 1 1 17 -32 C17 -19 4 -10 0 0 Z" fill="{INK}"/>'
        f'<circle cy="-32" r="7" fill="{GROUND}"/>'
        f'<g class="enseigne" transform="translate(-246 -108)">'
        f'<rect width="214" height="50" rx="3" fill="{RICE}" stroke="{INK}" stroke-width="2.5"/>'
        f'<path d="M214 34 L232 66 L196 50 Z" fill="{RICE}" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>'
        f'<rect x="190" y="38" width="22" height="10" fill="{RICE}"/>'
        f'<text x="14" y="22" class="nom">Aux Saveurs du Cambodge</text>'
        f'<text x="14" y="40">10 av. Salvador Allende</text></g></g>'
    )

    used = "".join(labels.values()).upper() + "".join(name for name, _ in pois) + "100 mN" + "Aux Saveurs du Cambodge10 av. Salvador Allende"
    style = (
        font_face(used)
        + f"text{{font-family:Plan,sans-serif;font-weight:600;font-size:13px;fill:{INK}}}"
        + ".rue{letter-spacing:.06em;text-transform:uppercase;font-size:12px}"
        + ".enseigne text{font-size:13px;font-weight:500}.enseigne .nom{font-weight:700;font-size:15px}"
    )
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
        f"<style>{style}</style>"
        f'<defs>{"".join(defs)}</defs>'
        + "".join(parts)
        + "".join(texts)
        + marker
        + "</svg>\n"
    )
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(svg, encoding="utf-8")
    print(f"{OUT.name}: {len(svg) / 1024:.1f} KB, {len(building_paths)} bâtiments, {sum(len(v) for v in groups.values())} tronçons")


if __name__ == "__main__":
    main()
