<?php
// Espace gestion : session, mot de passe, statistiques agrégées, graphiques et saisie des prix.

if (!defined('ASDC')) {
    http_response_code(404);
    exit;
}

const ASDC_JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const ASDC_JOURS_COURTS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const ASDC_MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const ASDC_MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const ASDC_DUREE_SESSION = 8 * 3600;

/* ---------- Session et mot de passe ---------- */

function asdc_session(): void
{
    session_name('asdc_gestion');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => asdc_https(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
    if (empty($_SESSION['jeton'])) {
        $_SESSION['jeton'] = bin2hex(random_bytes(16));
    }
}

function asdc_connecte(): bool
{
    $depuis = (int) ($_SESSION['gestion'] ?? 0);
    if ($depuis && $depuis > time() - ASDC_DUREE_SESSION) {
        return true;
    }
    unset($_SESSION['gestion']);
    return false;
}

function asdc_ouvrir_session(): void
{
    session_regenerate_id(true);
    $_SESSION['gestion'] = time();
    $_SESSION['jeton'] = bin2hex(random_bytes(16));
    // Les visites de la personne qui gère le site ne comptent pas dans les statistiques.
    asdc_cookie(ASDC_COOKIE_REFUS, '1', time() + ASDC_DUREE_COOKIE, false);
}

function asdc_jeton_valide(): bool
{
    return is_string($_POST['jeton'] ?? null) && hash_equals((string) $_SESSION['jeton'], $_POST['jeton']);
}

function asdc_mot_de_passe_installe(): bool
{
    return !empty(asdc_config()['mot_de_passe']);
}

function asdc_enregistrer_mot_de_passe(string $motDePasse): bool
{
    $empreinte = password_hash($motDePasse, PASSWORD_DEFAULT);
    $sel = asdc_sel();
    return asdc_modifier(ASDC_DONNEES . '/config.php', function (array $c) use ($empreinte, $sel): array {
        $c['mot_de_passe'] = $empreinte;
        $c['sel'] = $c['sel'] ?? $sel;
        $c['mesure'] = $c['mesure'] ?? true;
        return $c;
    });
}

// Cinq essais ratés en 15 minutes depuis la même adresse : on attend 15 minutes.
function asdc_essais(): array
{
    $cle = substr(hash('sha256', asdc_sel() . ($_SERVER['REMOTE_ADDR'] ?? '')), 0, 16);
    $tous = asdc_lire(ASDC_DONNEES . '/connexions.php');
    $recents = array_values(array_filter((array) ($tous[$cle] ?? []), function ($t) {
        return is_int($t) && $t > time() - 900;
    }));
    return [$cle, $recents];
}

function asdc_bloque(): bool
{
    return count(asdc_essais()[1]) >= 5;
}

function asdc_noter_echec(): void
{
    [$cle] = asdc_essais();
    asdc_modifier(ASDC_DONNEES . '/connexions.php', function (array $tous) use ($cle): array {
        foreach ($tous as $k => $liste) {
            $tous[$k] = array_values(array_filter((array) $liste, function ($t) {
                return is_int($t) && $t > time() - 900;
            }));
            if (!$tous[$k]) {
                unset($tous[$k]);
            }
        }
        $tous[$cle][] = time();
        return $tous;
    });
}

/* ---------- Statistiques ---------- */

function asdc_periodes(): array
{
    return ['7j' => '7 jours', '30j' => '30 jours', '12m' => '12 mois'];
}

// Additionne les fichiers du jour sur la période ; les visites se comptent par jour, ou par mois sur un an.
function asdc_statistiques(string $periode): array
{
    $aujourdhui = new DateTimeImmutable('today');
    $parMois = $periode === '12m';
    if ($parMois) {
        $debut = $aujourdhui->modify('first day of this month')->modify('-11 months');
    } else {
        $debut = $aujourdhui->modify($periode === '7j' ? '-6 days' : '-29 days');
    }

    $total = [
        'vues' => [], 'visites' => 0, 'visiteurs' => [], 'nouveaux' => 0, 'appareils' => [], 'sources' => [],
        'actions' => [], 'paniers' => ['nombre' => 0, 'total' => 0], 'plats' => [], 'recherches' => [], 'jours' => 0,
    ];
    $serie = [];
    for ($d = $debut; $d <= $aujourdhui; $d = $d->modify($parMois ? 'first day of next month' : '+1 day')) {
        $serie[$parMois ? $d->format('Y-m') : $d->format('Y-m-d')] = 0;
    }

    for ($d = $debut; $d <= $aujourdhui; $d = $d->modify('+1 day')) {
        $jour = asdc_lire(ASDC_DONNEES . '/stats/' . $d->format('Y-m-d') . '.php');
        if (!$jour) {
            continue;
        }
        $total['jours']++;
        $visites = (int) ($jour['visites'] ?? 0);
        $total['visites'] += $visites;
        $serie[$parMois ? $d->format('Y-m') : $d->format('Y-m-d')] += $visites;
        $total['nouveaux'] += (int) ($jour['nouveaux'] ?? 0);
        foreach ((array) ($jour['visiteurs'] ?? []) as $cle => $un) {
            $total['visiteurs'][$cle] = 1;
        }
        foreach (['vues', 'appareils', 'sources', 'actions', 'plats', 'recherches'] as $table) {
            foreach ((array) ($jour[$table] ?? []) as $cle => $n) {
                $total[$table][$cle] = ($total[$table][$cle] ?? 0) + (int) $n;
            }
        }
        $total['paniers']['nombre'] += (int) ($jour['paniers']['nombre'] ?? 0);
        $total['paniers']['total'] += (int) ($jour['paniers']['total'] ?? 0);
    }
    $total['visiteurs'] = count($total['visiteurs']);
    $total['serie'] = $serie;
    $total['par_mois'] = $parMois;
    foreach (['vues', 'appareils', 'sources', 'actions', 'plats', 'recherches'] as $table) {
        arsort($total[$table]);
    }
    return $total;
}

function asdc_nombre(int $n): string
{
    return number_format($n, 0, ',', ASDC_FINE);
}

// Graduation : 0, la moitié, le haut, sur des nombres ronds (2, 4, 6, 8, 10, 20, 40…).
function asdc_plafond(int $maximum): int
{
    for ($puissance = 1; ; $puissance *= 10) {
        foreach ([2, 4, 6, 8, 10] as $m) {
            if ($m * $puissance >= max($maximum, 4)) {
                return $m * $puissance;
            }
        }
    }
}

// Histogramme en HTML : une barre par jour (ou par mois), une info-bulle au survol et au clavier, le tableau en dessous.
function asdc_histogramme(array $serie, bool $parMois): string
{
    $maximum = $serie ? max($serie) : 0;
    $plafond = asdc_plafond($maximum);
    $n = count($serie);
    $pas = $n > 14 ? 5 : 1;
    $barres = '';
    $lignes = '';
    $i = 0;
    foreach ($serie as $cle => $valeur) {
        $date = new DateTimeImmutable($parMois ? $cle . '-01' : $cle);
        $m = (int) $date->format('n') - 1;
        if ($parMois) {
            $court = ASDC_MOIS_COURTS[$m];
            $long = ASDC_MOIS[$m] . ' ' . $date->format('Y');
        } else {
            $w = (int) $date->format('w');
            $court = $n <= 7 ? ASDC_JOURS_COURTS[$w] : $date->format('j');
            $long = ASDC_JOURS[$w] . ' ' . $date->format('j') . ' ' . ASDC_MOIS[$m];
        }
        $dernier = $i === $n - 1;
        $repere = $parMois || $n <= 7 || ($n - 1 - $i) % $pas === 0;
        $texte = asdc_nombre($valeur) . ' visite' . ($valeur > 1 ? 's' : '');
        $barres .= sprintf(
            '<li class="g-colonne%s" style="--v:%d;--x:%s" tabindex="0" aria-label="%s : %s" data-info="%s">'
            . '<span class="g-colonne__trait"></span><span class="g-colonne__date%s" aria-hidden="true">%s</span></li>',
            $dernier ? ' g-colonne--recente' : '',
            $valeur,
            number_format($n > 1 ? $i / ($n - 1) : 0.5, 3, '.', ''),
            asdc_h($long),
            asdc_h($texte),
            asdc_h($texte . ' · ' . $long),
            $repere ? '' : ' g-colonne__date--cachee',
            asdc_h($court)
        );
        $lignes .= '<tr><th scope="row">' . asdc_h($long) . '</th><td>' . asdc_nombre($valeur) . '</td></tr>';
        $i++;
    }
    $graduations = '';
    foreach ([$plafond, intdiv($plafond, 2), 0] as $g) {
        $graduations .= '<span style="--v:' . $g . '">' . asdc_nombre($g) . '</span>';
    }
    return '<div class="g-histogramme" style="--max:' . $plafond . '">'
        . '<div class="g-histogramme__graduations" aria-hidden="true">' . $graduations . '</div>'
        . '<ol class="g-histogramme__barres">' . $barres . '</ol></div>'
        . '<details class="g-tableau"><summary>Voir les chiffres</summary><table><thead><tr><th scope="col">'
        . ($parMois ? 'Mois' : 'Jour') . '</th><th scope="col">Visites</th></tr></thead><tbody>' . $lignes . '</tbody></table></details>';
}

// Liste classée : nom, nombre, et un trait proportionnel au premier.
function asdc_classement(array $table, string $vide, int $limite = 8, ?callable $nom = null, ?int $base = null): string
{
    if (!$table) {
        return '<p class="g-vide">' . asdc_h($vide) . '</p>';
    }
    $table = array_slice($table, 0, $limite, true);
    $reference = $base ?? max($table);
    $html = '<ol class="g-classement">';
    foreach ($table as $cle => $n) {
        $part = $reference > 0 ? min(1, $n / $reference) : 0;
        $html .= '<li><span class="g-classement__nom">' . asdc_h($nom ? $nom((string) $cle) : $cle) . '</span>'
            . '<span class="g-classement__valeur">' . asdc_nombre((int) $n) . ($base ? ' <span class="g-classement__part">' . round($part * 100) . '&#8239;%</span>' : '') . '</span>'
            . '<span class="g-classement__trait" style="--part:' . round($part, 3) . '"></span></li>';
    }
    return $html . '</ol>';
}

function asdc_nom_plat(string $id): string
{
    foreach (asdc_carte()['rubriques'] as $rubrique) {
        foreach ($rubrique['plats'] as $plat) {
            if ($plat['id'] === $id) {
                return $plat['nom'];
            }
        }
    }
    return $id;
}

/* ---------- Prix ---------- */

// « 10,50 », « 10.5 », « 10 € » : tout ce qu'on tape naturellement devient des centimes ; le reste est refusé.
function asdc_lire_prix($saisie): ?int
{
    $texte = str_replace([',', '€', ' ', ASDC_NBSP, ASDC_FINE], ['.', '', '', '', ''], trim((string) $saisie));
    if (!preg_match('/^[0-9]{1,4}([.][0-9]{1,2})?$/', $texte)) {
        return null;
    }
    $centimes = (int) round(((float) $texte) * 100);
    return asdc_prix_valide($centimes) ? $centimes : null;
}

function asdc_saisie_prix(int $centimes): string
{
    return number_format($centimes / 100, 2, ',', '');
}
