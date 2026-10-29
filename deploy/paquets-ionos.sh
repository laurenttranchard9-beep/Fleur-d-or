#!/usr/bin/env bash
# La Fleur d'Or et Le Monorom : prépare deux fichiers ZIP à envoyer sur un hébergement mutualisé
# (IONOS Hébergement Web, ou tout hébergeur Apache + PHP 8), à partir des sites installés sur le
# serveur Ubuntu par installer-ubuntu.sh. Chaque ZIP contient le site complet avec sa carte, son
# mot de passe de panneau et ses sauvegardes : le panneau marche dès l'envoi.
#
#   curl -fsSL https://raw.githubusercontent.com/laurenttranchard9-beep/Fleur-d-or/claude/practical-mendel-dpj572/deploy/paquets-ionos.sh | sudo bash
#
# Les fichiers sont créés dans le dossier personnel de l'utilisateur (/home/ubuntu sur un VPS OVH).
set -euo pipefail

# Tout le script est dans main(), appelée à la dernière ligne (voir installer-ubuntu.sh).
main() {
FLEUR_DOSSIER="${FLEUR_DOSSIER:-/var/www/fleur-dor}"
MONOROM_DOSSIER="${MONOROM_DOSSIER:-/var/www/le-monorom}"
QUI="${SUDO_USER:-root}"
DEST=$(getent passwd "$QUI" | cut -d: -f6)
DEST="${DEST:-/root}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez ce script avec sudo." >&2
  exit 1
fi

manque=0
for paire in "La Fleur d'Or:$FLEUR_DOSSIER" "Le Monorom:$MONOROM_DOSSIER"; do
  nom="${paire%%:*}"; dst="${paire#*:}"
  if [ ! -f "$dst/index.html" ]; then
    echo "$nom : site introuvable dans $dst (lancez d'abord installer-ubuntu.sh)." >&2
    manque=1
  elif [ ! -f "$dst/donnees/admin.json" ]; then
    echo "$nom : le mot de passe du panneau n'est pas encore créé. Sur un hébergement" >&2
    echo "mutualisé, il ne peut pas l'être depuis le navigateur. Créez-le ici d'abord :" >&2
    echo "  cd $dst && sudo -u www-data php admin/mot-de-passe.php" >&2
    manque=1
  fi
done
[ "$manque" -eq 0 ] || exit 1

if ! command -v zip >/dev/null; then
  echo "Installation de zip…"
  DEBIAN_FRONTEND=noninteractive NEEDRESTART_SUSPEND=1 apt-get install -y -qq zip </dev/null >/dev/null
fi

for paire in "fleur-dor:$FLEUR_DOSSIER" "le-monorom:$MONOROM_DOSSIER"; do
  nom="${paire%%:*}"; dst="${paire#*:}"
  zipf="$DEST/$nom-ionos.zip"
  rm -f "$zipf"
  # Le contenu du dossier, pas le dossier lui-même : on le décompresse dans le dossier du domaine
  (cd "$dst" && zip -qr "$zipf" . -x '*.zip')
  chown "$QUI:" "$zipf"
  echo "Créé : $zipf ($(du -h "$zipf" | cut -f1))"
done

IP=$(curl -fsS -m 3 https://checkip.amazonaws.com 2>/dev/null || hostname -I | awk '{print $1}')
echo
echo "Pour les récupérer sur votre ordinateur, dans PowerShell (pas dans la session SSH) :"
echo "  scp $QUI@$IP:fleur-dor-ionos.zip \$HOME\\Downloads\\"
echo "  scp $QUI@$IP:le-monorom-ionos.zip \$HOME\\Downloads\\"
}

main "$@"
