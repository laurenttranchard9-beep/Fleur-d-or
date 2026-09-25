<?php
/*
 * Crée ou change le mot de passe du panneau, en ligne de commande (utile sur un serveur
 * sans navigateur, où le premier réglage depuis le panneau est refusé) :
 *   sudo -u apache php admin/mot-de-passe.php
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require __DIR__ . '/lib.php';

function demander(string $question): string
{
    fwrite(STDOUT, $question);
    $tty = stream_isatty(STDIN);
    if ($tty) {
        shell_exec('stty -echo');
    }
    $reponse = rtrim((string) fgets(STDIN), "\r\n");
    if ($tty) {
        shell_exec('stty echo');
        fwrite(STDOUT, "\n");
    }
    return $reponse;
}

$mdp = demander('Nouveau mot de passe : ');
if (($refus = fd_mot_de_passe_acceptable($mdp)) !== null) {
    fwrite(STDERR, $refus . "\n");
    exit(1);
}
if (demander('Encore une fois : ') !== $mdp) {
    fwrite(STDERR, "Les deux mots de passe ne sont pas identiques.\n");
    exit(1);
}
fd_definir_mot_de_passe($mdp);
echo "Mot de passe enregistré. Connectez-vous sur /admin/.\n";
