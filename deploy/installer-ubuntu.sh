#!/usr/bin/env bash
# La Fleur d'Or et Le Monorom : installe ou met à jour les deux sites sur un serveur Ubuntu
# (VPS OVH ou autre, Ubuntu 22.04 ou 24.04), chacun sur son nom de domaine, avec Apache et PHP-FPM.
#
#   Installer ou mettre à jour :
#     curl -fsSL https://raw.githubusercontent.com/laurenttranchard9-beep/Fleur-d-or/claude/practical-mendel-dpj572/deploy/installer-ubuntu.sh | sudo bash
#
#   Options (à placer après « sudo ») :
#     IMPORT=/tmp/donnees-sites.tar.gz   reprend la carte, le mot de passe et les sauvegardes de l'ancien serveur
#     EMAIL=vous@exemple.fr              active le HTTPS (certbot) si les domaines pointent déjà vers ce serveur
#     FLEUR_DOMAINE=fleurdor31.fr  MONOROM_DOMAINE=lemonorom.fr   (valeurs par défaut)
#
# Les sites sont copiés dans /var/www/fleur-dor et /var/www/le-monorom.
# Une mise à jour remplace le code mais garde la carte, le mot de passe et les sauvegardes
# de chaque panneau (dossier donnees/), ainsi que la configuration Apache déjà en place (HTTPS compris).
set -euo pipefail

FLEUR_DOMAINE="${FLEUR_DOMAINE:-fleurdor31.fr}"
MONOROM_DOMAINE="${MONOROM_DOMAINE:-lemonorom.fr}"
FLEUR_DOSSIER="${FLEUR_DOSSIER:-/var/www/fleur-dor}"
MONOROM_DOSSIER="${MONOROM_DOSSIER:-/var/www/le-monorom}"
BRANCHE="${BRANCHE:-claude/practical-mendel-dpj572}"
ARCHIVE="${ARCHIVE:-https://codeload.github.com/laurenttranchard9-beep/Fleur-d-or/tar.gz/refs/heads/$BRANCHE}"
IMPORT="${IMPORT:-}"
EMAIL="${EMAIL:-}"
WEB=www-data

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez ce script avec sudo." >&2
  exit 1
fi
if ! command -v apt-get >/dev/null; then
  echo "Ce script est prévu pour Ubuntu (ou Debian)." >&2
  exit 1
fi
if [ -n "$IMPORT" ] && [ ! -f "$IMPORT" ]; then
  echo "Archive à importer introuvable : $IMPORT" >&2
  exit 1
fi

# Démarre, recharge ou redémarre un service, avec ou sans systemd
service_() { # action nom
  if command -v systemctl >/dev/null && [ -d /run/systemd/system ]; then
    systemctl "$1" "$2"
  else
    service "$2" "$1"
  fi
}

# ---------- Apache, PHP-FPM et certbot ----------
echo "Installation d'Apache, PHP et certbot…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq apache2 php-fpm php-cli php-mbstring curl tar ca-certificates certbot python3-certbot-apache >/dev/null
PHPV=$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')
a2enmod -q rewrite headers expires deflate mime alias setenvif proxy_fcgi ssl >/dev/null
a2enconf -q "php$PHPV-fpm" >/dev/null

# ---------- Télécharger le site depuis GitHub ----------
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
echo "Téléchargement du site…"
curl -fsSL "$ARCHIVE" -o "$TMP/site.tar.gz"
tar -xzf "$TMP/site.tar.gz" -C "$TMP"
NEUF=$(find "$TMP" -mindepth 1 -maxdepth 1 -type d | head -n 1)
[ -f "$NEUF/admin/publier.php" ] && [ -f "$NEUF/le-monorom/admin/publier.php" ] \
  || { echo "Archive inattendue : les deux sites sont introuvables." >&2; exit 1; }

# ---------- Copier : le code est remplacé, les données des panneaux sont gardées ----------
# $1 source, $2 dossier du site, $3… fichiers et dossiers de code à copier
copier_site() {
  local src="$1" dst="$2"
  shift 2
  mkdir -p "$dst/donnees/sauvegardes"
  for f in "$@"; do
    [ -e "$src/$f" ] || continue
    rm -rf "${dst:?}/$f"
    cp -a "$src/$f" "$dst/"
  done
  cp -a "$src/donnees/.htaccess" "$dst/donnees/"
  [ -f "$dst/donnees/carte.json" ] || cp -a "$src/donnees/carte.json" "$dst/donnees/"
}
echo "Copie de La Fleur d'Or dans $FLEUR_DOSSIER…"
copier_site "$NEUF" "$FLEUR_DOSSIER" .htaccess admin assets impression index.html mentions-legales.html robots.txt sitemap.xml
echo "Copie du Monorom dans $MONOROM_DOSSIER…"
copier_site "$NEUF/le-monorom" "$MONOROM_DOSSIER" .htaccess admin assets index.html mentions-legales.html robots.txt sitemap.xml

# ---------- Reprendre les données de l'ancien serveur ----------
if [ -n "$IMPORT" ]; then
  echo "Import des données depuis $IMPORT…"
  mkdir -p "$TMP/import"
  tar -xzf "$IMPORT" -C "$TMP/import"
  for paire in "fleur-dor:$FLEUR_DOSSIER" "le-monorom:$MONOROM_DOSSIER"; do
    nom="${paire%%:*}"; dst="${paire#*:}"
    if [ -d "$TMP/import/$nom/donnees" ]; then
      cp -a "$TMP/import/$nom/donnees/." "$dst/donnees/"
      echo "  $nom : carte, mot de passe et sauvegardes repris."
    else
      echo "  $nom : rien à reprendre dans l'archive."
    fi
  done
fi

# ---------- Régénérer les pages, droits ----------
for dst in "$FLEUR_DOSSIER" "$MONOROM_DOSSIER"; do
  (cd "$dst" && php admin/publier.php)
  # Le panneau réécrit la page, le sitemap et la carte : ces fichiers appartiennent à Apache
  chown "$WEB:$WEB" "$dst" "$dst/index.html" "$dst/sitemap.xml" "$dst/mentions-legales.html"
  chown -R "$WEB:$WEB" "$dst/donnees"
  chmod -R u+rwX,g+rwX,o-rwx "$dst/donnees"
done

# ---------- Apache : un site par nom de domaine ----------
# $1 fichier, $2 domaine, $3 dossier. Un fichier déjà en place est gardé (HTTPS de certbot compris).
vhost() {
  local conf="/etc/apache2/sites-available/$1.conf" dom="${2#www.}" dst="$3"
  if [ -f "$conf" ]; then
    echo "Configuration Apache existante conservée ($conf)."
  else
    cat > "$conf" <<CONF
<VirtualHost *:80>
    ServerName $dom
    ServerAlias www.$dom
    DocumentRoot $dst
    <Directory $dst>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    # Données des panneaux : jamais servies, même si les .htaccess étaient ignorés
    <Directory $dst/donnees>
        Require all denied
    </Directory>
    ErrorLog \${APACHE_LOG_DIR}/$1-erreurs.log
    CustomLog \${APACHE_LOG_DIR}/$1-acces.log combined
</VirtualHost>
CONF
  fi
  a2ensite -q "$1" >/dev/null
}
vhost fleur-dor "$FLEUR_DOMAINE" "$FLEUR_DOSSIER"
vhost le-monorom "$MONOROM_DOMAINE" "$MONOROM_DOSSIER"

# Discrétion : ni version d'Apache ni version de PHP dans les réponses
cat > /etc/apache2/conf-available/zz-discretion.conf <<CONF
ServerName localhost
ServerTokens Prod
ServerSignature Off
TraceEnable Off
CONF
a2enconf -q zz-discretion >/dev/null
echo "expose_php = Off" > "/etc/php/$PHPV/fpm/conf.d/99-discretion.ini"

# Pare-feu : si ufw est actif, on ouvre le web (le port SSH n'est pas touché)
if command -v ufw >/dev/null && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow "Apache Full" >/dev/null
fi

apache2ctl configtest
service_ restart "php$PHPV-fpm"
service_ restart apache2

# ---------- Mots de passe des panneaux ----------
for paire in "La Fleur d'Or:$FLEUR_DOSSIER" "Le Monorom:$MONOROM_DOSSIER"; do
  nom="${paire%%:*}"; dst="${paire#*:}"
  if [ ! -f "$dst/donnees/admin.json" ] && [ -r /dev/tty ]; then
    echo
    echo "Choisissez le mot de passe du panneau de $nom (10 caractères au moins) :"
    (cd "$dst" && sudo -u "$WEB" php admin/mot-de-passe.php < /dev/tty) || true
  fi
done

# ---------- HTTPS ----------
IP=$(curl -fsS -m 3 https://checkip.amazonaws.com 2>/dev/null || hostname -I | awk '{print $1}')
IP="${IP:-adresse-du-serveur}"
pointe() { getent ahostsv4 "$1" | awk '{print $1}' | grep -qx "$IP"; }
A_FAIRE=""
for dom in "${FLEUR_DOMAINE#www.}" "${MONOROM_DOMAINE#www.}"; do
  if [ -n "$EMAIL" ] && pointe "$dom" && pointe "www.$dom"; then
    certbot --apache -n --agree-tos -m "$EMAIL" --redirect -d "$dom" -d "www.$dom" || A_FAIRE="$A_FAIRE $dom"
  else
    A_FAIRE="$A_FAIRE $dom"
  fi
done

echo
echo "C'est prêt."
echo "  La Fleur d'Or : http://$FLEUR_DOMAINE/   panneau : /admin/   (dossier $FLEUR_DOSSIER)"
echo "  Le Monorom    : http://$MONOROM_DOMAINE/   panneau : /admin/   (dossier $MONOROM_DOSSIER)"
echo "Avant de changer les DNS, testez depuis ce serveur :"
echo "  curl -s -H 'Host: $FLEUR_DOMAINE' http://localhost/ | grep -o '<title>[^<]*'"
echo "  curl -s -H 'Host: $MONOROM_DOMAINE' http://localhost/ | grep -o '<title>[^<]*'"
for dst in "$FLEUR_DOSSIER" "$MONOROM_DOSSIER"; do
  [ -f "$dst/donnees/admin.json" ] || echo "Mot de passe à créer : cd $dst && sudo -u $WEB php admin/mot-de-passe.php"
done
if [ -n "$A_FAIRE" ]; then
  echo "HTTPS à activer quand les DNS pointent vers ce serveur ($IP) :"
  for dom in $A_FAIRE; do
    echo "  sudo certbot --apache --redirect -d $dom -d www.$dom"
  done
fi
