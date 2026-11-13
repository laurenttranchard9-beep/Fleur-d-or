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
    // Jamais plus d'une seconde et demie d'attente : sur un hébergement partagé (disque en réseau), mieux vaut
    // perdre une visite comptée que garder le serveur occupé. Si le disque ne sait pas verrouiller, on écrit quand même.
    $limite = microtime(true) + 1.5;
    $occupe = false;
    while (!flock($verrou, LOCK_EX | LOCK_NB, $occupe)) {
        if (!$occupe) {
            break;
        }
        if (microtime(true) > $limite) {
            fclose($verrou);
            return false;
        }
        usleep(50000);
    }
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

/* ---------- Descriptions des plats et noms des rubriques ---------- */

// Les plats de la carte par identifiant : nom, description d'origine, rubrique, mots de recherche en plus.
function asdc_plats(): array
{
    static $plats = null;
    if ($plats === null) {
        $plats = [];
        foreach (asdc_carte()['rubriques'] as $rubrique) {
            foreach ($rubrique['plats'] as $plat) {
                $plats[$plat['id']] = [
                    'nom' => (string) $plat['nom'],
                    'desc' => (string) ($plat['desc'] ?? ''),
                    'rubrique' => (string) $rubrique['id'],
                    'cles' => (string) ($plat['cles'] ?? ''),
                ];
            }
        }
    }
    return $plats;
}

function asdc_titres_origine(): array
{
    $titres = [];
    foreach (asdc_carte()['rubriques'] as $rubrique) {
        $titres[$rubrique['id']] = (string) $rubrique['titre'];
    }
    return $titres;
}

// Textes changés dans l'espace gestion : une description peut devenir vide, un nom de rubrique jamais.
function asdc_textes(): array
{
    static $textes = null;
    if ($textes === null) {
        $lu = asdc_lire(ASDC_DONNEES . '/textes.php');
        $plats = asdc_plats();
        $titres = asdc_titres_origine();
        $textes = ['desc' => [], 'rubriques' => []];
        foreach ((array) ($lu['desc'] ?? []) as $id => $texte) {
            if (isset($plats[$id]) && is_string($texte)) {
                $textes['desc'][$id] = $texte;
            }
        }
        foreach ((array) ($lu['rubriques'] ?? []) as $id => $titre) {
            if (isset($titres[$id]) && is_string($titre) && $titre !== '') {
                $textes['rubriques'][$id] = $titre;
            }
        }
    }
    return $textes;
}

function asdc_desc(string $id): string
{
    $changees = asdc_textes()['desc'];
    return array_key_exists($id, $changees) ? $changees[$id] : (asdc_plats()[$id]['desc'] ?? '');
}

function asdc_titre_rubrique(string $id): string
{
    return asdc_textes()['rubriques'][$id] ?? (asdc_titres_origine()[$id] ?? '');
}

// Comme le générateur des pages : espace fine insécable avant « ? ! : ; » et après « », dans un texte déjà échappé.
function asdc_typo(string $html): string
{
    return str_replace('« ', '«' . ASDC_FINE, (string) preg_replace('/ ([?!:;»])/u', ASDC_FINE . '$1', $html));
}

// Comme la recherche de la carte (site.js) : minuscules, sans accents, apostrophes changées en espaces.
function asdc_normaliser(string $texte): string
{
    static $table = null;
    if ($table === null) {
        $table = ['œ' => 'oe', 'Œ' => 'oe', 'æ' => 'ae', 'Æ' => 'ae', '’' => ' ', "'" => ' '];
        $variantes = ['a' => 'àáâãäåÀÁÂÃÄÅ', 'c' => 'çÇ', 'e' => 'èéêëÈÉÊË', 'i' => 'ìíîïÌÍÎÏ', 'n' => 'ñÑ', 'o' => 'òóôõöÒÓÔÕÖ', 'u' => 'ùúûüÙÚÛÜ', 'y' => 'ýÿÝŸ'];
        foreach ($variantes as $lettre => $liste) {
            preg_match_all('/./u', $liste, $lettres);
            foreach ($lettres[0] as $accentuee) {
                $table[$accentuee] = $lettre;
            }
        }
    }
    $mots = explode(' ', strtolower(strtr($texte, $table)));
    return implode(' ', array_filter($mots, function (string $mot): bool {
        return $mot !== '';
    }));
}

function asdc_recherche_plat(string $id): string
{
    $plat = asdc_plats()[$id] ?? null;
    if (!$plat) {
        return '';
    }
    $morceaux = [$plat['nom'], asdc_desc($id), asdc_titre_rubrique($plat['rubrique']), $plat['cles']];
    return asdc_normaliser(implode(' ', array_filter($morceaux, 'strlen')));
}

// Un texte à placer entre les guillemets d'une chaîne JSON (données pour Google), sans « < » brut.
function asdc_json_texte(string $texte): string
{
    $json = json_encode($texte, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG);
    return is_string($json) ? substr($json, 1, -1) : '';
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

// Les pages portent des jetons {{prix:id}}, {{desc:id}}, {{rubrique:id}}… : on les remplace au dernier instant
// par le prix, la description ou le nom de rubrique du moment (ceux de la carte, ou ceux changés dans l'espace gestion).
function asdc_remplir(string $html): string
{
    $prix = asdc_prix();
    $motif = '/[{][{](prix|cents|json|rond|des|desc|jdesc|rubrique|jrubrique|recherche):([a-z0-9,-]+)[}][}]/';
    $rempli = preg_replace_callback($motif, function (array $m) use ($prix): string {
        switch ($m[1]) {
            case 'desc':
                $desc = asdc_desc($m[2]);
                return $desc === '' ? '' : '<span class="plat__desc">' . asdc_typo(asdc_h($desc)) . '</span>';
            case 'jdesc':
                return asdc_json_texte(asdc_desc($m[2]));
            case 'rubrique':
                return asdc_typo(asdc_h(asdc_titre_rubrique($m[2])));
            case 'jrubrique':
                return asdc_json_texte(asdc_titre_rubrique($m[2]));
            case 'recherche':
                return asdc_h(asdc_recherche_plat($m[2]));
        }
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
