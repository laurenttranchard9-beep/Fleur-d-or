#!/usr/bin/env bash
# La Fleur d'Or : met à jour le site servi par son nom de domaine (fleurdor31.fr) sur un serveur
# Amazon Linux qui héberge aussi d'autres sites, SANS modifier la configuration d'Apache.
#
#   curl -fsSL https://raw.githubusercontent.com/laurenttranchard9-beep/Fleur-d-or/claude/practical-mendel-dpj572/deploy/installer-fleurdor.sh | sudo bash
#
# Le dossier du site est celui qu'Apache sert pour fleurdor31.fr (DocumentRoot du VirtualHost),
# ou /var/www/html/fleur-dor, ou celui donné en paramètre :  … | sudo bash -s -- /chemin/du/site
# Le code est remplacé ; la carte, le mot de passe et les sauvegardes du panneau (dossier donnees/)
# sont gardés. Une copie complète du dossier est faite avant, dans /root.
set -euo pipefail

DOMAINE="${DOMAINE:-fleurdor31.fr}"
BRANCHE="${BRANCHE:-claude/practical-mendel-dpj572}"
ARCHIVE="${ARCHIVE:-https://codeload.github.com/laurenttranchard9-beep/Fleur-d-or/tar.gz/refs/heads/$BRANCHE}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez ce script avec sudo." >&2
  exit 1
fi

# ---------- Dossier servi par le nom de domaine ----------
DOSSIER="${1:-${DOSSIER:-}}"
if [ -z "$DOSSIER" ]; then
  for f in /etc/httpd/conf.d/*.conf; do
    if grep -qiE "^\s*Server(Name|Alias)\s+(www\.)?${DOMAINE//./\\.}\s*$" "$f" 2>/dev/null; then
      DOSSIER=$(awk 'tolower($1)=="documentroot"{gsub(/"/,"",$2); print $2; exit}' "$f")
      [ -n "$DOSSIER" ] && break
    fi
  done
fi
DOSSIER="${DOSSIER:-/var/www/html/fleur-dor}"
DOSSIER="${DOSSIER%/}"
if [ ! -f "$DOSSIER/admin/publier.php" ]; then
  echo "Le site de La Fleur d'Or est introuvable dans $DOSSIER." >&2
  echo "Donnez son dossier :  … | sudo bash -s -- /chemin/du/site" >&2
  exit 1
fi
echo "Site de La Fleur d'Or : $DOSSIER"

# ---------- Copie de secours ----------
SECOURS="/root/fleur-dor-avant-mise-a-jour-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$SECOURS" -C "$DOSSIER" .
chmod 600 "$SECOURS"
echo "Copie de secours : $SECOURS"

# ---------- Télécharger le site depuis GitHub ----------
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
echo "Téléchargement du site…"
curl -fsSL "$ARCHIVE" -o "$TMP/site.tar.gz"
tar -xzf "$TMP/site.tar.gz" -C "$TMP"
NEUF=$(find "$TMP" -mindepth 1 -maxdepth 1 -type d | head -n 1)
[ -f "$NEUF/admin/publier.php" ] || { echo "Archive inattendue : admin/publier.php introuvable." >&2; exit 1; }

# ---------- Copier : le code est remplacé, les données du panneau sont gardées ----------
for d in admin assets impression; do
  rm -rf "${DOSSIER:?}/$d"
  cp -a "$NEUF/$d" "$DOSSIER/"
done
for f in .htaccess mentions-legales.html robots.txt; do
  cp -a "$NEUF/$f" "$DOSSIER/"
done
mkdir -p "$DOSSIER/donnees/sauvegardes"
cp -a "$NEUF/donnees/.htaccess" "$DOSSIER/donnees/"
[ -f "$DOSSIER/donnees/carte.json" ] || cp -a "$NEUF/donnees/carte.json" "$DOSSIER/donnees/"

# ---------- Régénérer la page depuis la carte du panneau ----------
cd "$DOSSIER"
php admin/publier.php
if id apache >/dev/null 2>&1; then
  chown -R apache:apache donnees index.html sitemap.xml
fi
chmod -R u+rwX,g+rwX donnees

echo
echo "C'est prêt : https://www.$DOMAINE/ (la configuration d'Apache n'a pas été modifiée)."
echo "En cas de problème, la version précédente est dans $SECOURS :"
echo "  sudo tar -xzf $SECOURS -C $DOSSIER"
