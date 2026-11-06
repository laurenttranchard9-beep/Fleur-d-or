<?php
// Mesure d'audience du site, pour le seul restaurant : des compteurs par jour, rien de transmis à personne.
// Le navigateur envoie un petit message (page vue, appel, ajout à la commande…) ; la réponse est toujours vide.

define('ASDC', true);
require __DIR__ . '/../inc/noyau.php';

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    exit;
}
http_response_code(204);

// Refus explicite : on ne compte pas, et l'identifiant de mesure déjà posé est effacé.
if (isset($_COOKIE[ASDC_COOKIE_REFUS])) {
    foreach ([ASDC_COOKIE_MESURE, ASDC_COOKIE_VISITE] as $nom) {
        if (isset($_COOKIE[$nom])) {
            asdc_cookie($nom, '', time() - 3600);
        }
    }
    exit;
}
// Mesure coupée dans l'espace gestion, « ne pas me suivre », robots : on ne compte pas.
if (!asdc_mesure_active()) {
    exit;
}
if (($_SERVER['HTTP_DNT'] ?? '') === '1' || ($_SERVER['HTTP_SEC_GPC'] ?? '') === '1') {
    exit;
}
$agent = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
if ($agent === '' || preg_match('/bot|crawl|spider|slurp|preview|monitor|headless|lighthouse|pingdom|curl|wget|python|java|facebookexternalhit/i', $agent)) {
    exit;
}

$message = json_decode((string) file_get_contents('php://input', false, null, 0, 2048), true);
if (!is_array($message) || !isset($message['type']) || !is_string($message['type'])) {
    exit;
}
if (!asdc_dossier_inscriptible()) {
    exit;
}

$sel = asdc_sel();

// Visiteur : un cookie de 13 mois posé à la première visite, jamais prolongé ensuite.
$identifiant = (string) ($_COOKIE[ASDC_COOKIE_MESURE] ?? '');
$nouveau = false;
if (!preg_match('/^[a-f0-9]{32}$/', $identifiant)) {
    $identifiant = bin2hex(random_bytes(16));
    $nouveau = true;
    asdc_cookie(ASDC_COOKIE_MESURE, $identifiant, time() + ASDC_DUREE_COOKIE);
}
$cle = substr(hash('sha256', $sel . $identifiant), 0, 16);

// Visite : elle dure tant que le visiteur revient dans les 30 minutes.
$debutVisite = !isset($_COOKIE[ASDC_COOKIE_VISITE]);
asdc_cookie(ASDC_COOKIE_VISITE, '1', time() + ASDC_DUREE_VISITE);

function asdc_appareil($largeur): string
{
    $largeur = (int) $largeur;
    if ($largeur > 0 && $largeur < 735) {
        return 'Téléphone';
    }
    if ($largeur > 0 && $largeur < 1069) {
        return 'Tablette';
    }
    return 'Ordinateur';
}

function asdc_source($referent): string
{
    $referent = is_string($referent) ? substr($referent, 0, 500) : '';
    if ($referent === '') {
        return 'Accès direct';
    }
    if (strpos($referent, 'android-app://com.google') === 0) {
        return 'Google';
    }
    $hote = strtolower((string) parse_url($referent, PHP_URL_HOST));
    $hote = (string) preg_replace('/^(www|m|l|lm|mobile)[.]/', '', $hote);
    $ici = strtolower((string) preg_replace('/^www[.]/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')));
    if ($hote === '' || $hote === $ici) {
        return 'Accès direct';
    }
    $connus = [
        'google' => 'Google', 'bing' => 'Bing', 'duckduckgo' => 'DuckDuckGo', 'qwant' => 'Qwant', 'ecosia' => 'Ecosia',
        'yahoo' => 'Yahoo', 'facebook' => 'Facebook', 'instagram' => 'Instagram', 'tripadvisor' => 'Tripadvisor',
        'thefork' => 'TheFork', 'lafourchette' => 'TheFork', 'pagesjaunes' => 'PagesJaunes', 'waze' => 'Waze',
        'apple' => 'Plans (Apple)', 'ubereats' => 'Uber Eats', 'deliveroo' => 'Deliveroo',
    ];
    foreach ($connus as $mot => $nom) {
        if (strpos($hote, $mot) !== false) {
            return $nom;
        }
    }
    return substr($hote, 0, 60);
}

// Recherche de la carte : minuscules sans accents, lettres, chiffres et espaces, 40 caractères au plus.
function asdc_terme($texte): string
{
    if (!is_string($texte)) {
        return '';
    }
    $texte = strtolower(substr(trim($texte), 0, 80));
    $sansAccents = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $texte);
    $texte = (string) preg_replace('/[^a-z0-9 ]+/', '', $sansAccents === false ? $texte : $sansAccents);
    $texte = trim((string) preg_replace('/ +/', ' ', $texte));
    return substr($texte, 0, 40);
}

function asdc_ajouter(array &$table, string $cle, int $combien = 1, int $plafond = 300): void
{
    if (!isset($table[$cle]) && count($table) >= $plafond) {
        return;
    }
    $table[$cle] = (int) ($table[$cle] ?? 0) + $combien;
}

$type = $message['type'];
$pages = ['accueil', 'carte', 'mentions', 'introuvable'];
$prix = asdc_prix();

$modification = null;
if ($type === 'vue' && in_array($message['p'] ?? '', $pages, true)) {
    $page = $message['p'];
    $appareil = asdc_appareil($message['l'] ?? 0);
    $source = asdc_source($message['r'] ?? '');
    $modification = function (array $j) use ($page, $cle, $nouveau, $debutVisite, $appareil, $source): array {
        $j['vues'] = $j['vues'] ?? [];
        asdc_ajouter($j['vues'], $page);
        $j['visiteurs'] = $j['visiteurs'] ?? [];
        $j['visiteurs'][$cle] = 1;
        if ($nouveau) {
            $j['nouveaux'] = (int) ($j['nouveaux'] ?? 0) + 1;
        }
        if ($debutVisite) {
            $j['visites'] = (int) ($j['visites'] ?? 0) + 1;
            $j['appareils'] = $j['appareils'] ?? [];
            asdc_ajouter($j['appareils'], $appareil);
            $j['sources'] = $j['sources'] ?? [];
            asdc_ajouter($j['sources'], $source, 1, 100);
        }
        return $j;
    };
} elseif ($type === 'appel' || $type === 'itineraire') {
    $modification = function (array $j) use ($type): array {
        $j['actions'] = $j['actions'] ?? [];
        asdc_ajouter($j['actions'], $type);
        return $j;
    };
} elseif ($type === 'ajout' && is_string($message['id'] ?? null) && isset($prix[$message['id']])) {
    $plat = $message['id'];
    $modification = function (array $j) use ($plat): array {
        $j['plats'] = $j['plats'] ?? [];
        asdc_ajouter($j['plats'], $plat);
        return $j;
    };
} elseif ($type === 'commande') {
    $nombre = (int) ($message['n'] ?? 0);
    $total = (int) ($message['t'] ?? 0);
    if ($nombre >= 1 && $nombre <= 200 && $total >= 0 && $total <= 1000000) {
        $modification = function (array $j) use ($total): array {
            $j['actions'] = $j['actions'] ?? [];
            asdc_ajouter($j['actions'], 'commande');
            $j['paniers'] = $j['paniers'] ?? ['nombre' => 0, 'total' => 0];
            $j['paniers']['nombre'] = (int) $j['paniers']['nombre'] + 1;
            $j['paniers']['total'] = (int) $j['paniers']['total'] + $total;
            return $j;
        };
    }
} elseif ($type === 'recherche') {
    $terme = asdc_terme($message['q'] ?? '');
    if (strlen($terme) >= 3) {
        $modification = function (array $j) use ($terme): array {
            $j['recherches'] = $j['recherches'] ?? [];
            asdc_ajouter($j['recherches'], $terme);
            return $j;
        };
    }
}

if ($modification) {
    asdc_modifier(ASDC_DONNEES . '/stats/' . date('Y-m-d') . '.php', $modification);
}

// De temps en temps, on efface ce qui a plus de 25 mois.
if (random_int(1, 40) === 1) {
    $limite = date('Y-m-d', strtotime(ASDC_GARDE_STATS));
    foreach (glob(ASDC_DONNEES . '/stats/*.php') ?: [] as $fichier) {
        $jour = basename($fichier, '.php');
        if (preg_match('/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/', $jour) && $jour < $limite) {
            @unlink($fichier);
        }
    }
}
