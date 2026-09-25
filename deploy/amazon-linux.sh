#!/usr/bin/env bash
# La Fleur d'Or et Le Monorom : installe ou met à jour les deux sites sur un serveur Amazon Linux (2023 ou 2).
#
#   Première fois :  curl -fsSL https://raw.githubusercontent.com/laurenttranchard9-beep/Fleur-d-or/claude/practical-mendel-dpj572/deploy/amazon-linux.sh | sudo bash
#   Mises à jour  :  sudo bash /var/www/fleur-dor/deploy/amazon-linux.sh
#
# Les sites sont installés dans /var/www/fleur-dor et servis par Apache sur le port 80 :
#   La Fleur d'Or : http://adresse-du-serveur/        Le Monorom : http://adresse-du-serveur/le-monorom/
# Pour donner au Monorom son propre nom de domaine (déjà dirigé vers ce serveur) :
#   sudo MONOROM_DOMAINE=www.restaurantlemonorom.com bash /var/www/fleur-dor/deploy/amazon-linux.sh
# Serveur qui héberge déjà d'autres sites : n'installer que Le Monorom, sur son nom de domaine,
# sans toucher aux sites existants ni devenir le site par défaut :
#   sudo MONOROM_SEUL=1 MONOROM_DOMAINE=lemonorom.fr bash /var/www/fleur-dor/deploy/amazon-linux.sh
# Une mise à jour prend les cartes de GitHub ; la carte de chaque site modifiée dans son panneau
# est d'abord gardée dans les sauvegardes de ce panneau, onglet « Sauvegardes ».
set -euo pipefail

DEPOT="${DEPOT:-https://github.com/laurenttranchard9-beep/Fleur-d-or.git}"
BRANCHE="${BRANCHE:-claude/practical-mendel-dpj572}"
DOSSIER="${DOSSIER:-/var/www/fleur-dor}"
MONOROM_DOMAINE="${MONOROM_DOMAINE:-}"
MONOROM_SEUL="${MONOROM_SEUL:-}"
SITES=". le-monorom"
if [ -n "$MONOROM_SEUL" ] && [ -z "$MONOROM_DOMAINE" ]; then
  echo "MONOROM_SEUL demande aussi MONOROM_DOMAINE (ex. MONOROM_DOMAINE=lemonorom.fr)." >&2
  exit 1
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez ce script avec sudo." >&2
  exit 1
fi

# ---------- Apache, PHP et git ----------
if ! command -v httpd >/dev/null || ! command -v php >/dev/null || ! command -v git >/dev/null; then
  echo "Installation d'Apache, PHP et git…"
  if command -v dnf >/dev/null; then
    dnf install -y httpd php php-cli php-fpm php-mbstring git
  else
    amazon-linux-extras enable php8.2 >/dev/null
    yum clean metadata
    yum install -y httpd php php-cli php-fpm php-mbstring git
  fi
fi

# ---------- Ne pas écraser un site déjà en place ----------
# Racine du serveur (site servi à l'adresse « / » quand aucun VirtualHost ne répond)
RACINE=$(awk 'tolower($1)=="documentroot"{gsub(/"/,"",$2); print $2; exit}' /etc/httpd/conf/httpd.conf 2>/dev/null || true)
AUTRES_VHOSTS=$(grep -lis "<VirtualHost" /etc/httpd/conf.d/*.conf 2>/dev/null | grep -v -e '/fleur-dor.conf$' -e '/le-monorom.conf$' -e '/000-defaut.conf$' -e '/ssl.conf$' || true)
if [ -z "$MONOROM_SEUL" ] && [ ! -f /etc/httpd/conf.d/fleur-dor.conf ]; then
  if [ -n "$AUTRES_VHOSTS" ] || { [ -n "$RACINE" ] && [ "$RACINE" != "$DOSSIER" ] && ls "$RACINE"/index.* >/dev/null 2>&1; }; then
    echo "Ce serveur héberge déjà d'autres sites ($RACINE${AUTRES_VHOSTS:+, $AUTRES_VHOSTS})." >&2
    echo "Pour ne pas les remplacer, installez Le Monorom seul, sur son nom de domaine :" >&2
    echo "  sudo MONOROM_SEUL=1 MONOROM_DOMAINE=lemonorom.fr bash $DOSSIER/deploy/amazon-linux.sh" >&2
    exit 1
  fi
fi

# ---------- Récupérer le site ----------
if [ -d "$DOSSIER/.git" ]; then
  echo "Mise à jour depuis GitHub ($BRANCHE)…"
  cd "$DOSSIER"
  git config --global --add safe.directory "$DOSSIER"
  git fetch --depth 1 origin "$BRANCHE"
  # La carte modifiée sur le serveur est gardée dans les sauvegardes de son panneau
  for s in $SITES; do
    if [ -f "$s/donnees/carte.json" ] && ! git diff --quiet -- "$s/donnees/carte.json"; then
      mkdir -p "$s/donnees/sauvegardes"
      cp "$s/donnees/carte.json" "$s/donnees/sauvegardes/carte-$(date +%Y%m%d-%H%M%S).json"
      echo "La carte du serveur ($s) a été gardée dans son panneau, onglet « Sauvegardes »."
    fi
  done
  git reset --hard FETCH_HEAD
else
  echo "Première installation dans $DOSSIER…"
  git clone --depth 1 --branch "$BRANCHE" "$DEPOT" "$DOSSIER"
  git config --global --add safe.directory "$DOSSIER"
fi

# ---------- Page du site et droits ----------
cd "$DOSSIER"
for s in $SITES; do
  [ -f "$s/admin/publier.php" ] || continue
  (cd "$s" && php admin/publier.php)
  mkdir -p "$s/donnees/sauvegardes"
  chown -R apache:apache "$s/donnees" "$s/index.html"
  chmod -R u+rwX,g+rwX "$s/donnees"
done

# ---------- Apache : ce site sur le port 80, .htaccess actifs ----------
CONF_MONOROM=/etc/httpd/conf.d/fleur-dor.conf
if [ -n "$MONOROM_SEUL" ]; then
  # Seulement Le Monorom, dans son propre fichier : les autres sites du serveur ne changent pas
  CONF_MONOROM=/etc/httpd/conf.d/le-monorom.conf
  : > "$CONF_MONOROM"
  # Dès qu'un VirtualHost existe, Apache envoie les visiteurs « sans nom de domaine » (par l'IP) au premier.
  # Sans autre VirtualHost, on en crée un d'abord pour le site actuel : il reste le site par défaut.
  if [ -z "$AUTRES_VHOSTS" ] && [ ! -f /etc/httpd/conf.d/000-defaut.conf ] && [ -n "$RACINE" ]; then
    printf '<VirtualHost *:80>\n    DocumentRoot %s\n</VirtualHost>\n' "$RACINE" > /etc/httpd/conf.d/000-defaut.conf
    echo "Site par défaut conservé : $RACINE (fichier /etc/httpd/conf.d/000-defaut.conf)."
  fi
else
cat > /etc/httpd/conf.d/fleur-dor.conf <<CONF
<VirtualHost *:80>
    DocumentRoot $DOSSIER
    <Directory $DOSSIER>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    <DirectoryMatch "^$DOSSIER/(\.git|deploy)">
        Require all denied
    </DirectoryMatch>
</VirtualHost>
CONF
fi
if [ -n "$MONOROM_DOMAINE" ]; then
  # Le Monorom sur son propre nom de domaine (avec et sans www)
  NU="${MONOROM_DOMAINE#www.}"
  cat >> "$CONF_MONOROM" <<CONF
<VirtualHost *:80>
    ServerName $NU
    ServerAlias www.$NU
    DocumentRoot $DOSSIER/le-monorom
    <Directory $DOSSIER/le-monorom>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
CONF
fi

# PHP tourne à côté d'Apache (php-fpm) sur Amazon Linux
if systemctl list-unit-files php-fpm.service >/dev/null 2>&1; then
  systemctl enable php-fpm >/dev/null 2>&1
  systemctl restart php-fpm
fi
systemctl enable httpd >/dev/null 2>&1
if ! apachectl configtest; then
  echo "La configuration d'Apache contient une erreur : rien n'a été redémarré." >&2
  exit 1
fi
systemctl reload httpd 2>/dev/null || systemctl restart httpd

IP=$(curl -fsS -m 2 http://checkip.amazonaws.com 2>/dev/null || hostname -I | awk '{print $1}')
IP=${IP:-adresse-du-serveur}
echo
echo "C'est prêt."
if [ -z "$MONOROM_SEUL" ]; then
  echo "  La Fleur d'Or : http://$IP/            panneau : http://$IP/admin/"
  echo "  Le Monorom    : http://$IP/le-monorom/  panneau : http://$IP/le-monorom/admin/"
fi
[ -n "$MONOROM_DOMAINE" ] && echo "  Le Monorom sur son domaine : http://${MONOROM_DOMAINE#www.}/ et http://www.${MONOROM_DOMAINE#www.}/"
[ -n "$MONOROM_SEUL" ] || [ -f donnees/admin.json ] || echo "Mot de passe du panneau Fleur d'Or :  sudo -u apache php $DOSSIER/admin/mot-de-passe.php"
[ -f le-monorom/donnees/admin.json ] || echo "Mot de passe du panneau Monorom    :  sudo -u apache php $DOSSIER/le-monorom/admin/mot-de-passe.php"
echo "Pensez à ouvrir le port 80 dans le groupe de sécurité de l'instance EC2."
