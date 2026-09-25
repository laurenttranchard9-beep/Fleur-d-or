<?php
/*
 * Régénère index.html depuis donnees/carte.json, en ligne de commande :
 *   php admin/publier.php
 * (Le panneau d'administration fait la même chose à chaque « Publier ».)
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require __DIR__ . '/lib.php';

try {
    [$propre, $erreurs] = fd_valider(fd_lire_carte());
    if ($erreurs) {
        fwrite(STDERR, "La carte contient des erreurs :\n - " . implode("\n - ", $erreurs) . "\n");
        exit(1);
    }
    $page = fd_generer_page($propre);
    fd_ecrire_atomique(FD_PAGE, $page['html']);
    printf("index.html publié : %d plats, %d boissons, %d formules.\n", $page['plats'], $page['boissons'], $page['formules']);
} catch (Throwable $e) {
    fwrite(STDERR, 'Erreur : ' . $e->getMessage() . "\n");
    exit(1);
}
