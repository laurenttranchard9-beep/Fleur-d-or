<?php
// Aux Saveurs du Cambodge : outils communs aux pages, à l'espace gestion et à la mesure d'audience.
// Les données vivent dans donnees/, en fichiers PHP qui s'arrêtent avant leur contenu : même sans .htaccess,
// un fichier demandé depuis le navigateur ne montre rien.

if (!defined('ASDC')) {
    http_response_code(404);
    exit;
}

date_default_timezone_set('Europe/Paris');

define('ASDC_RACINE', dirname(__DIR__));
define('ASDC_DONNEES', ASDC_RACINE . '/donnees');
define('ASDC_GARDE', '<?php http_response_code(404); exit; ?>');
define('ASDC_NBSP', html_entity_decode('&#160;', ENT_QUOTES, 'UTF-8'));
define('ASDC_FINE', html_entity_decode('&#8239;', ENT_QUOTES, 'UTF-8'));

// Mesure d'audience exemptée de consentement (CNIL) : cookie de 13 mois jamais prolongé, données gardées 25 mois.
define('ASDC_COOKIE_MESURE', 'asdc_mesure');
define('ASDC_COOKIE_VISITE', 'asdc_visite');
define('ASDC_COOKIE_REFUS', 'asdc_refus');
define('ASDC_DUREE_COOKIE', 395 * 86400);
define('ASDC_DUREE_VISITE', 30 * 60);
define('ASDC_GARDE_STATS', '-25 months');

/* ---------- Fichiers de données ---------- */

function asdc_lire(string $fichier, array $defaut = []): array
{
    if (!is_file($fichier)) {
        return $defaut;
    }
    $brut = (string) @file_get_contents($fichier);
    $debut = strpos($brut, chr(10));
    $donnees = json_decode($debut === false ? $brut : substr($brut, $debut + 1), true);
    return is_array($donnees) ? $donnees : $defaut;
}

// Écriture d'un bloc : fichier temporaire puis renommage, pour qu'une lecture ne tombe jamais sur un fichier à moitié écrit.
function asdc_ecrire(string $fichier, array $donnees): bool
{
    $dossier = dirname($fichier);
    if (!is_dir($dossier) && !@mkdir($dossier, 0755, true)) {
        return false;
    }
    $temporaire = $fichier . '-' . bin2hex(random_bytes(4)) . '.tmp.php';
    $contenu = ASDC_GARDE . chr(10) . json_encode($donnees, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (@file_put_contents($temporaire, $contenu, LOCK_EX) === false) {
        return false;
    }
    if (!@rename($temporaire, $fichier)) {
        @unlink($temporaire);
        return false;
    }
    return true;
}

// Lire, modifier, réécrire sous verrou : deux visites au même instant ne s'effacent pas l'une l'autre.
function asdc_modifier(string $fichier, callable $modification): bool
{
    $dossier = dirname($fichier);
    if (!is_dir($dossier) && !@mkdir($dossier, 0755, true)) {
        return false;
    }
    $verrou = @fopen($dossier . '/verrou.php', 'c');
    if (!$verrou) {
        return false;
    }
    flock($verrou, LOCK_EX);
    $ok = asdc_ecrire($fichier, $modification(asdc_lire($fichier)));
    flock($verrou, LOCK_UN);
    fclose($verrou);
    return $ok;
}

function asdc_dossier_inscriptible(): bool
{
    if (!is_dir(ASDC_DONNEES)) {
        @mkdir(ASDC_DONNEES, 0755, true);
    }
    return is_dir(ASDC_DONNEES) && is_writable(ASDC_DONNEES);
}

/* ---------- Réglages ---------- */

function asdc_config(): array
{
    return asdc_lire(ASDC_DONNEES . '/config.php');
}

function asdc_mesure_active(): bool
{
    $config = asdc_config();
    return !array_key_exists('mesure', $config) || $config['mesure'] === true;
}

// Sel propre à chaque installation : les identifiants de visiteurs ne sont jamais enregistrés tels quels.
function asdc_sel(): string
{
    $config = asdc_config();
    if (!empty($config['sel']) && is_string($config['sel'])) {
        return $config['sel'];
    }
    $sel = bin2hex(random_bytes(16));
    asdc_modifier(ASDC_DONNEES . '/config.php', function (array $c) use (&$sel) {
        if (!empty($c['sel']) && is_string($c['sel'])) {
            $sel = $c['sel'];
            return $c;
        }
        $c['sel'] = $sel;
        return $c;
    });
    return $sel;
}

/* ---------- La carte et ses prix ---------- */

function asdc_carte(): array
{
    static $carte = null;
    if ($carte === null) {
        $carte = asdc_lire(__DIR__ . '/carte.php');
        if (!isset($carte['rubriques']) || !is_array($carte['rubriques'])) {
            $carte = ['rubriques' => []];
        }
    }
    return $carte;
}

function asdc_prix_origine(): array
{
    $prix = [];
    foreach (asdc_carte()['rubriques'] as $rubrique) {
        foreach ($rubrique['plats'] as $plat) {
            $prix[$plat['id']] = (int) $plat['prix'];
        }
    }
    return $prix;
}

function asdc_prix_valide($centimes): bool
{
    return is_int($centimes) && $centimes >= 10 && $centimes <= 999999;
}

// Prix en centimes : ceux de la carte, sauf ceux changés dans l'espace gestion.
function asdc_prix(): array
{
    static $prix = null;
    if ($prix === null) {
        $prix = asdc_prix_origine();
        foreach (asdc_lire(ASDC_DONNEES . '/prix.php') as $id => $centimes) {
            if (isset($prix[$id]) && asdc_prix_valide($centimes)) {
                $prix[$id] = $centimes;
            }
        }
    }
    return $prix;
}

// « 10,50 € », comme Intl en fr-FR : virgule décimale, espace insécable avant l'euro.
function asdc_euros(int $centimes): string
{
    return number_format($centimes / 100, 2, ',', ASDC_FINE) . ASDC_NBSP . '€';
}

function asdc_euros_rond(int $centimes): string
{
    return $centimes % 100 === 0 ? intdiv($centimes, 100) . ASDC_NBSP . '€' : asdc_euros($centimes);
}

// Les pages portent des jetons {{prix:id}} : on les remplace par le prix du moment, au dernier instant.
function asdc_remplir(string $html): string
{
    $prix = asdc_prix();
    $rempli = preg_replace_callback('/[{][{](prix|cents|json|rond|des):([a-z0-9,-]+)[}][}]/', function (array $m) use ($prix): string {
        $valeurs = [];
        foreach (explode(',', $m[2]) as $id) {
            if (isset($prix[$id])) {
                $valeurs[] = $prix[$id];
            }
        }
        if (!$valeurs) {
            return '';
        }
        $centimes = $valeurs[0];
        switch ($m[1]) {
            case 'prix':
                return asdc_euros($centimes);
            case 'cents':
                return (string) $centimes;
            case 'json':
                return number_format($centimes / 100, 2, '.', '');
            case 'rond':
                return asdc_euros_rond($centimes);
            case 'des':
                $minimum = min($valeurs);
                return count(array_unique($valeurs)) === 1 ? asdc_euros_rond($minimum) : 'À partir de ' . asdc_euros_rond($minimum);
        }
        return '';
    }, $html);
    return $rempli === null ? $html : $rempli;
}

/* ---------- Cookies et requêtes ---------- */

function asdc_https(): bool
{
    if (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') {
        return true;
    }
    if ((int) ($_SERVER['SERVER_PORT'] ?? 0) === 443) {
        return true;
    }
    return strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
}

function asdc_cookie(string $nom, string $valeur, int $expiration, bool $httpOnly = true): void
{
    setcookie($nom, $valeur, [
        'expires' => $expiration,
        'path' => '/',
        'secure' => asdc_https(),
        'httponly' => $httpOnly,
        'samesite' => 'Lax',
    ]);
}

function asdc_h($texte): string
{
    return htmlspecialchars((string) $texte, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
