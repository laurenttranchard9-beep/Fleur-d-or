#!/usr/bin/env bash
# La Fleur d'Or : installe ou met à jour le site sur un serveur Amazon Linux (2023 ou 2).
#
#   Première fois :  curl -fsSL https://raw.githubusercontent.com/laurenttranchard9-beep/Fleur-d-or/claude/practical-mendel-dpj572/deploy/amazon-linux.sh | sudo bash
#   Mises à jour  :  sudo bash /var/www/fleur-dor/deploy/amazon-linux.sh
#
# Le site est installé dans /var/www/fleur-dor et servi par Apache sur le port 80.
# Une mise à jour prend la carte de GitHub ; la carte du serveur (modifiée dans le panneau)
# est d'abord gardée dans les sauvegardes du panneau, onglet « Sauvegardes ».
set -euo pipefail

DEPOT="${DEPOT:-https://github.com/laurenttranchard9-beep/Fleur-d-or.git}"
BRANCHE="${BRANCHE:-claude/practical-mendel-dpj572}"
DOSSIER="${DOSSIER:-/var/www/fleur-dor}"

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

# ---------- Récupérer le site ----------
if [ -d "$DOSSIER/.git" ]; then
  echo "Mise à jour depuis GitHub ($BRANCHE)…"
  cd "$DOSSIER"
  git config --global --add safe.directory "$DOSSIER"
  git fetch --depth 1 origin "$BRANCHE"
  # La carte modifiée sur le serveur est gardée dans les sauvegardes du panneau
  if ! git diff --quiet -- donnees/carte.json; then
    mkdir -p donnees/sauvegardes
    cp donnees/carte.json "donnees/sauvegardes/carte-$(date +%Y%m%d-%H%M%S).json"
    echo "La carte du serveur a été gardée dans le panneau, onglet « Sauvegardes »."
  fi
  git reset --hard FETCH_HEAD
else
  echo "Première installation dans $DOSSIER…"
  git clone --depth 1 --branch "$BRANCHE" "$DEPOT" "$DOSSIER"
  git config --global --add safe.directory "$DOSSIER"
fi

# ---------- Page du site et droits ----------
cd "$DOSSIER"
php admin/publier.php
mkdir -p donnees/sauvegardes
chown -R apache:apache donnees index.html
chmod -R u+rwX,g+rwX donnees

# ---------- Apache : ce site sur le port 80, .htaccess actifs ----------
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

# PHP tourne à côté d'Apache (php-fpm) sur Amazon Linux
if systemctl list-unit-files php-fpm.service >/dev/null 2>&1; then
  systemctl enable php-fpm >/dev/null 2>&1
  systemctl restart php-fpm
fi
systemctl enable httpd >/dev/null 2>&1
systemctl restart httpd

IP=$(curl -fsS -m 2 http://checkip.amazonaws.com 2>/dev/null || hostname -I | awk '{print $1}')
IP=${IP:-adresse-du-serveur}
echo
echo "C'est prêt."
echo "  Le site    : http://$IP/"
echo "  Le panneau : http://$IP/admin/"
if [ ! -f donnees/admin.json ]; then
  echo "Créez le mot de passe du panneau :  sudo -u apache php $DOSSIER/admin/mot-de-passe.php"
fi
echo "Pensez à ouvrir le port 80 dans le groupe de sécurité de l'instance EC2."
