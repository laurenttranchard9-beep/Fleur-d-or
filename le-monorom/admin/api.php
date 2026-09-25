<?php
/* Le Monorom : API du panneau d'administration (JSON). */
declare(strict_types=1);
require __DIR__ . '/lib.php';

fd_session();
fd_entetes_securite('application/json; charset=utf-8');

function fd_reponse(int $code, array $corps): void
{
    http_response_code($code);
    echo json_encode($corps, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (!fd_connecte()) {
    fd_reponse(401, ['ok' => false, 'message' => 'Session expirée : reconnectez-vous.']);
}

$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = (string) ($_GET['action'] ?? '');

function fd_photos_publiques(): array
{
    $liste = [];
    foreach (fd_photos() as $nom => $p) {
        $liste[] = ['nom' => $nom, 'src' => '../assets/img/' . $p['petite']];
    }
    return $liste;
}

try {
    if ($methode === 'GET') {
        if ($action === 'donnees') {
            fd_reponse(200, [
                'ok' => true,
                'donnees' => fd_lire_carte(),
                'photos' => fd_photos_publiques(),
                'sauvegardes' => fd_sauvegardes(),
            ]);
        }
        if ($action === 'sauvegardes') {
            fd_reponse(200, ['ok' => true, 'sauvegardes' => fd_sauvegardes()]);
        }
        fd_reponse(404, ['ok' => false, 'message' => 'Action inconnue.']);
    }

    if ($methode !== 'POST') {
        header('Allow: GET, POST');
        fd_reponse(405, ['ok' => false, 'message' => 'Méthode non autorisée.']);
    }
    if (!fd_csrf_valide($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null)) {
        fd_reponse(403, ['ok' => false, 'message' => 'Jeton de sécurité invalide : rechargez la page.']);
    }
    $brut = file_get_contents('php://input', false, null, 0, 3 * 1024 * 1024 + 1);
    if ($brut === false || strlen($brut) > 3 * 1024 * 1024) {
        fd_reponse(413, ['ok' => false, 'message' => 'Données trop volumineuses.']);
    }
    $corps = json_decode($brut, true);
    if (!is_array($corps)) {
        fd_reponse(400, ['ok' => false, 'message' => 'Données illisibles.']);
    }

    if ($action === 'publier') {
        [$propre, $erreurs] = fd_valider($corps['donnees'] ?? null);
        if ($erreurs) {
            fd_reponse(422, ['ok' => false, 'message' => 'Rien n’a été publié : corrigez les points signalés.', 'erreurs' => array_slice($erreurs, 0, 50)]);
        }
        $compte = fd_publier($propre);
        fd_reponse(200, ['ok' => true, 'donnees' => $propre, 'compte' => $compte, 'sauvegardes' => fd_sauvegardes(),
            'message' => sprintf('Publié : %d plats, %d boissons, %d formules.', $compte['plats'], $compte['boissons'], $compte['formules'])]);
    }

    if ($action === 'restaurer') {
        $nom = (string) ($corps['nom'] ?? '');
        if (!preg_match('/^carte-\d{8}-\d{6}(?:-\d+)?\.json$/', $nom) || !is_file(FD_SAUVEGARDES . '/' . $nom)) {
            fd_reponse(404, ['ok' => false, 'message' => 'Sauvegarde introuvable.']);
        }
        [$propre, $erreurs] = fd_valider(fd_lire_json(FD_SAUVEGARDES . '/' . $nom));
        if ($erreurs) {
            fd_reponse(422, ['ok' => false, 'message' => 'Cette sauvegarde est abîmée et ne peut pas être restaurée.', 'erreurs' => array_slice($erreurs, 0, 20)]);
        }
        $compte = fd_publier($propre);
        fd_reponse(200, ['ok' => true, 'donnees' => $propre, 'compte' => $compte, 'sauvegardes' => fd_sauvegardes(),
            'message' => 'Version restaurée et publiée. La version remplacée a elle-même été sauvegardée.']);
    }

    if ($action === 'mot_de_passe') {
        $actuel = (string) ($corps['actuel'] ?? '');
        $nouveau = (string) ($corps['nouveau'] ?? '');
        if (fd_attente_connexion() > 0) {
            fd_reponse(429, ['ok' => false, 'message' => 'Trop d’essais : patientez un quart d’heure.']);
        }
        if (!fd_verifier_mot_de_passe($actuel)) {
            fd_noter_echec();
            fd_reponse(403, ['ok' => false, 'message' => 'Le mot de passe actuel est incorrect.']);
        }
        if ($pb = fd_mot_de_passe_acceptable($nouveau)) {
            fd_reponse(422, ['ok' => false, 'message' => $pb]);
        }
        fd_definir_mot_de_passe($nouveau);
        session_regenerate_id(true);
        fd_reponse(200, ['ok' => true, 'message' => 'Mot de passe modifié.']);
    }

    fd_reponse(404, ['ok' => false, 'message' => 'Action inconnue.']);
} catch (Throwable $e) {
    error_log('Monorom admin : ' . $e->getMessage());
    fd_reponse(500, ['ok' => false, 'message' => $e instanceof RuntimeException ? $e->getMessage() : 'Erreur du serveur.']);
}
