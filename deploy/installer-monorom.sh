#!/usr/bin/env bash
# Le Monorom : installe ou met à jour le site sur un serveur Amazon Linux (2023 ou 2) avec Apache,
# à côté des sites déjà présents, sans les modifier.
#
#   Installer ou mettre à jour :
#     curl -fsSL https://raw.githubusercontent.com/laurenttranchard9-beep/Fleur-d-or/claude/practical-mendel-dpj572/deploy/installer-monorom.sh | sudo bash
#   Avec son nom de domaine (déjà dirigé vers ce serveur) :
#     curl -fsSL https://raw.githubusercontent.com/laurenttranchard9-beep/Fleur-d-or/claude/practical-mendel-dpj572/deploy/installer-monorom.sh | sudo bash -s -- lemonorom.fr
#
# Le site est copié dans /var/www/le-monorom et servi :
#   - à l'adresse http://adresse-du-serveur/le-monorom/ (à côté des autres sites) ;
#   - et, si un domaine est donné, à http://lemonorom.fr/ et http://www.lemonorom.fr/.
# Une mise à jour remplace le code du site mais garde la carte, le mot de passe et les sauvegardes
# du panneau (dossier donnees/).
set -euo pipefail

DOMAINE="${1:-${MONOROM_DOMAINE:-}}"
# Mise à jour sans domaine : on garde celui de l'installation précédente
if [ -z "$DOMAINE" ] && [ -f /etc/httpd/conf.d/le-monorom.conf ]; then
  DOMAINE=$(awk '$1=="ServerName"{print $2; exit}' /etc/httpd/conf.d/le-monorom.conf)
fi
DOMAINE="${DOMAINE#http://}"; DOMAINE="${DOMAINE#https://}"; DOMAINE="${DOMAINE%%/*}"; DOMAINE="${DOMAINE#www.}"
DOSSIER="${DOSSIER:-/var/www/le-monorom}"
BRANCHE="${BRANCHE:-claude/practical-mendel-dpj572}"
ARCHIVE="https://codeload.github.com/laurenttranchard9-beep/Fleur-d-or/tar.gz/refs/heads/$BRANCHE"
CONF=/etc/httpd/conf.d/le-monorom.conf

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez ce script avec sudo." >&2
  exit 1
fi
if [ -n "$DOMAINE" ] && ! printf '%s' "$DOMAINE" | grep -Eq '^[a-z0-9.-]+\.[a-z]{2,}$'; then
  echo "Nom de domaine invalide : $DOMAINE" >&2
  exit 1
fi

# ---------- Apache et PHP ----------
if ! command -v httpd >/dev/null || ! command -v php >/dev/null; then
  echo "Installation d'Apache et PHP…"
  if command -v dnf >/dev/null; then
    dnf install -y httpd php php-cli php-fpm php-mbstring
  else
    amazon-linux-extras enable php8.2 >/dev/null
    yum clean metadata
    yum install -y httpd php php-cli php-fpm php-mbstring
  fi
fi

# ---------- Télécharger le site depuis GitHub ----------
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
echo "Téléchargement du site…"
if [ -n "${GITHUB_JETON:-}" ]; then
  curl -fsSL -H "Authorization: Bearer $GITHUB_JETON" "$ARCHIVE" -o "$TMP/site.tar.gz"
else
  curl -fsSL "$ARCHIVE" -o "$TMP/site.tar.gz"
fi
tar -xzf "$TMP/site.tar.gz" -C "$TMP" --wildcards '*/le-monorom/*'
NEUF=$(find "$TMP" -maxdepth 2 -type d -name le-monorom | head -n 1)
[ -f "$NEUF/admin/publier.php" ] || { echo "Archive inattendue : le dossier le-monorom est introuvable." >&2; exit 1; }

# ---------- Copier : le code est remplacé, les données du panneau sont gardées ----------
if [ -d "$DOSSIER" ]; then
  echo "Mise à jour de $DOSSIER (carte, mot de passe et sauvegardes gardés)…"
  find "$DOSSIER" -mindepth 1 -maxdepth 1 ! -name donnees -exec rm -rf {} +
else
  echo "Installation dans $DOSSIER…"
  mkdir -p "$DOSSIER"
fi
mkdir -p "$DOSSIER/donnees/sauvegardes"
for f in "$NEUF"/* "$NEUF"/.htaccess; do
  [ "$(basename "$f")" = donnees ] || cp -a "$f" "$DOSSIER/"
done
cp -a "$NEUF/donnees/.htaccess" "$DOSSIER/donnees/"
[ -f "$DOSSIER/donnees/carte.json" ] || cp -a "$NEUF/donnees/carte.json" "$DOSSIER/donnees/"

cd "$DOSSIER"
php admin/publier.php
chown -R apache:apache donnees index.html
chmod -R u+rwX,g+rwX donnees

# ---------- Apache : un seul fichier à nous, les autres sites ne changent pas ----------
{
  echo "# Le Monorom (installé par installer-monorom.sh)"
  echo "Alias /le-monorom $DOSSIER"
  echo "<Directory $DOSSIER>"
  echo "    Options -Indexes +FollowSymLinks"
  echo "    AllowOverride All"
  echo "    Require all granted"
  echo "</Directory>"
} > "$CONF"

if [ -n "$DOMAINE" ]; then
  # Dès qu'un VirtualHost existe, Apache envoie les visiteurs qui passent par l'IP au premier.
  # S'il n'y en avait aucun, on en crée d'abord un pour le site actuel du serveur : il reste le site par défaut.
  AUTRES=$(grep -lis "<VirtualHost" /etc/httpd/conf.d/*.conf 2>/dev/null | grep -v -e "$CONF" -e '/ssl.conf$' || true)
  RACINE=$(awk 'tolower($1)=="documentroot"{gsub(/"/,"",$2); print $2; exit}' /etc/httpd/conf/httpd.conf 2>/dev/null || true)
  if [ -z "$AUTRES" ] && [ -n "$RACINE" ]; then
    printf '<VirtualHost *:80>\n    DocumentRoot %s\n</VirtualHost>\n' "$RACINE" > /etc/httpd/conf.d/000-defaut.conf
    echo "Site par défaut du serveur conservé : $RACINE (/etc/httpd/conf.d/000-defaut.conf)."
  fi
  cat >> "$CONF" <<CONF

<VirtualHost *:80>
    ServerName $DOMAINE
    ServerAlias www.$DOMAINE
    DocumentRoot $DOSSIER
</VirtualHost>
CONF
fi

if systemctl list-unit-files php-fpm.service >/dev/null 2>&1; then
  systemctl enable php-fpm >/dev/null 2>&1
  systemctl restart php-fpm
fi
systemctl enable httpd >/dev/null 2>&1
if ! apachectl configtest; then
  echo "La configuration d'Apache contient une erreur : rien n'a été rechargé." >&2
  exit 1
fi
systemctl reload httpd 2>/dev/null || systemctl restart httpd

# ---------- Mot de passe du panneau ----------
if [ ! -f donnees/admin.json ]; then
  if [ -r /dev/tty ]; then
    echo
    echo "Choisissez le mot de passe du panneau du Monorom (10 caractères au moins) :"
    sudo -u apache php admin/mot-de-passe.php < /dev/tty || true
  fi
  [ -f donnees/admin.json ] || echo "Mot de passe à créer : sudo -u apache php $DOSSIER/admin/mot-de-passe.php"
fi

IP=$(curl -fsS -m 2 http://checkip.amazonaws.com 2>/dev/null || hostname -I | awk '{print $1}')
echo
echo "C'est prêt."
echo "  Le Monorom : http://${IP:-adresse-du-serveur}/le-monorom/     panneau : http://${IP:-adresse-du-serveur}/le-monorom/admin/"
if [ -n "$DOMAINE" ]; then
  echo "  Et sur son domaine : http://$DOMAINE/ et http://www.$DOMAINE/ (quand le DNS pointe vers ce serveur)"
  echo "  HTTPS (conseillé) : sudo dnf install -y certbot python3-certbot-apache && sudo certbot --apache -d $DOMAINE -d www.$DOMAINE"
fi
