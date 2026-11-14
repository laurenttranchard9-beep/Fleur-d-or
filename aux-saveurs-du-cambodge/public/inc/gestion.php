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
        'heures' => array_fill(0, 24, 0), 'durees' => [],
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
        foreach ((array) ($jour['heures'] ?? []) as $heure => $n) {
            if ((int) $heure >= 0 && (int) $heure <= 23) {
                $total['heures'][(int) $heure] += (int) $n;
            }
        }
        foreach ((array) ($jour['durees'] ?? []) as $secondes) {
            $total['durees'][] = (int) $secondes;
        }
    }
    $total['visiteurs'] = count($total['visiteurs']);
    $total['serie'] = $serie;
    $total['par_mois'] = $parMois;
    foreach (['vues', 'appareils', 'sources', 'actions', 'plats', 'recherches'] as $table) {
        arsort($total[$table]);
    }
    return $total;
}

// Temps passé par visite : la durée habituelle (médiane), la moyenne, et la répartition par tranches.
function asdc_resume_durees(array $durees): array
{
    sort($durees);
    $n = count($durees);
    $tranches = [
        'Moins de 10 secondes' => 10, '10 à 30 secondes' => 30, '30 secondes à 1 minute' => 60,
        '1 à 3 minutes' => 180, '3 à 10 minutes' => 600, 'Plus de 10 minutes' => PHP_INT_MAX,
    ];
    $compte = array_fill_keys(array_keys($tranches), 0);
    foreach ($durees as $secondes) {
        foreach ($tranches as $nom => $avant) {
            if ($secondes < $avant) {
                $compte[$nom]++;
                break;
            }
        }
    }
    $mediane = $n === 0 ? 0 : ($n % 2 ? $durees[intdiv($n, 2)] : intdiv($durees[$n / 2 - 1] + $durees[$n / 2], 2));
    return [
        'nombre' => $n,
        'mediane' => $mediane,
        'moyenne' => $n ? (int) round(array_sum($durees) / $n) : 0,
        'tranches' => $compte,
    ];
}

// « 45 s », « 1 min 05 s », « 1 h 20 » : comme on le dit.
function asdc_duree(int $secondes): string
{
    $e = ASDC_NBSP;
    if ($secondes < 60) {
        return $secondes . $e . 's';
    }
    $minutes = intdiv($secondes, 60);
    $reste = $secondes % 60;
    if ($minutes < 60) {
        return $minutes . $e . 'min' . ($reste ? ' ' . str_pad((string) $reste, 2, '0', STR_PAD_LEFT) . $e . 's' : '');
    }
    return intdiv($minutes, 60) . $e . 'h' . ($minutes % 60 ? $e . str_pad((string) ($minutes % 60), 2, '0', STR_PAD_LEFT) : '');
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

// Histogramme des heures d'arrivée : 24 barres, de 0 h à 23 h, mêmes règles que celui des jours.
function asdc_histogramme_heures(array $heures): string
{
    $plafond = asdc_plafond(max($heures ?: [0]));
    $h = function (int $heure): string {
        return ($heure % 24) . ASDC_NBSP . 'h';
    };
    $barres = '';
    $lignes = '';
    for ($heure = 0; $heure < 24; $heure++) {
        $valeur = (int) ($heures[$heure] ?? 0);
        $plage = 'entre ' . $h($heure) . ' et ' . $h($heure + 1);
        $texte = asdc_nombre($valeur) . ' visite' . ($valeur > 1 ? 's' : '');
        $barres .= sprintf(
            '<li class="g-colonne" style="--v:%d;--x:%s" tabindex="0" aria-label="%s : %s" data-info="%s">'
            . '<span class="g-colonne__trait"></span><span class="g-colonne__date%s" aria-hidden="true">%s</span></li>',
            $valeur,
            number_format($heure / 23, 3, '.', ''),
            asdc_h(ucfirst($plage)),
            asdc_h($texte),
            asdc_h($texte . ' · ' . $plage),
            $heure % 3 === 0 ? '' : ' g-colonne__date--cachee',
            asdc_h($h($heure))
        );
        $lignes .= '<tr><th scope="row">' . asdc_h($h($heure) . ' – ' . $h($heure + 1)) . '</th><td>' . asdc_nombre($valeur) . '</td></tr>';
    }
    $graduations = '';
    foreach ([$plafond, intdiv($plafond, 2), 0] as $g) {
        $graduations .= '<span style="--v:' . $g . '">' . asdc_nombre($g) . '</span>';
    }
    return '<div class="g-histogramme g-histogramme--heures" style="--max:' . $plafond . '">'
        . '<div class="g-histogramme__graduations" aria-hidden="true">' . $graduations . '</div>'
        . '<ol class="g-histogramme__barres">' . $barres . '</ol></div>'
        . '<details class="g-tableau"><summary>Voir les chiffres</summary><table><thead><tr><th scope="col">Heure</th>'
        . '<th scope="col">Visites</th></tr></thead><tbody>' . $lignes . '</tbody></table></details>';
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

// Le nom du moment (renommé ou ajouté dans l'espace gestion). Un plat qui n'est plus sur la carte garde le nom
// qu'il avait, ou, à défaut, son identifiant rendu lisible (« plats-cambodgiens--lok-lac » : « Lok lac »).
function asdc_nom_plat(string $id): string
{
    $nom = asdc_nom($id);
    if ($nom !== '') {
        return $nom;
    }
    $nom = asdc_structure()['retires'][$id] ?? '';
    if ($nom === '') {
        // Plat d'origine : « rubrique--plat » ; plat ajouté : « nom-3f9a ».
        $nom = strpos($id, '--') === false
            ? (string) preg_replace('/-[a-f0-9]{4}$/', '', $id)
            : substr($id, strrpos($id, '--') + 2);
        $nom = ucfirst(trim(str_replace('-', ' ', $nom)));
    }
    return ($nom !== '' ? $nom : $id) . ' · retiré de la carte';
}

/* ---------- Prix ---------- */

// « 10,50 », « 10.5 », « 10 € » : tout ce qu'on tape naturellement devient des centimes ; le reste est refusé.
function asdc_lire_prix($saisie): ?int
{
    if (!is_string($saisie) && !is_int($saisie) && !is_float($saisie)) {
        return null;
    }
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

/* ---------- Descriptions et noms de rubriques ---------- */

const ASDC_DESC_MAX = 300;
const ASDC_TITRE_MAX = 60;
const ASDC_NOM_MAX = 80;

// Un texte saisi devient une seule ligne : retours à la ligne et espaces spéciaux changés en espaces simples,
// caractères de contrôle retirés. null si ce n'est pas du texte lisible (UTF-8 invalide, tableau…).
function asdc_texte_saisi($saisie): ?string
{
    if (!is_string($saisie) || !preg_match('//u', $saisie)) {
        return null;
    }
    $texte = str_replace([chr(13), chr(10), chr(9), ASDC_NBSP, ASDC_FINE], ' ', $saisie);
    $texte = (string) preg_replace('/[[:cntrl:]]/', '', $texte);
    $texte = (string) preg_replace('/ {2,}/', ' ', $texte);
    return trim($texte);
}

function asdc_longueur(string $texte): int
{
    return (int) preg_match_all('/./su', $texte);
}

/* ---------- Enregistrer la carte (prix, textes, rubriques et plats ajoutés) ---------- */

// Un identifiant nouveau, lisible et unique : « plats-du-jour-3f9a ». Il ne change plus ensuite, même si on renomme.
function asdc_nouvel_id(string $texte, array $pris): string
{
    $base = trim((string) preg_replace('/[^a-z0-9]+/', '-', asdc_normaliser($texte)), '-');
    $base = rtrim(substr($base !== '' ? $base : 'sans-nom', 0, 40), '-');
    do {
        $id = $base . '-' . bin2hex(random_bytes(2));
    } while (isset($pris[$id]));
    return $id;
}

// Enregistre le formulaire « La carte » de l'espace gestion. Ce qui ne diffère pas de la carte d'origine n'est pas
// gardé ; rien n'est écrit tant qu'un champ est refusé. Renvoie les erreurs (clé : identifiant du champ),
// le nombre de changements, et si l'écriture a réussi.
function asdc_enregistrer_carte(array $envoi): array
{
    $liste = function (string $cle) use ($envoi): array {
        return is_array($envoi[$cle] ?? null) ? $envoi[$cle] : [];
    };
    $rempli = function ($valeur): bool {
        return is_string($valeur) && trim($valeur) !== '';
    };
    $erreurs = [];
    $changes = 0;
    $texte = function ($saisie, string $champ, int $max, string $siVide) use (&$erreurs): ?string {
        $t = asdc_texte_saisi($saisie);
        if ($t === null) {
            $erreurs[$champ] = 'Ce texte contient des caractères illisibles : retapez-le.';
            return null;
        }
        if ($siVide !== '' && $t === '') {
            $erreurs[$champ] = $siVide;
            return null;
        }
        if (asdc_longueur($t) > $max) {
            $erreurs[$champ] = 'Pas plus de ' . $max . ' caractères (' . asdc_longueur($t) . ' pour l’instant).';
            return null;
        }
        return $t;
    };

    $origine = asdc_prix_origine();
    $plats = asdc_plats();
    $titresOrigine = asdc_titres_origine();
    $fixes = [];
    foreach (asdc_carte()['rubriques'] as $rubrique) {
        if (!empty($rubrique['fixe'])) {
            $fixes[$rubrique['id']] = true;
        }
    }
    $effectifs = asdc_prix();
    $prix = asdc_lire(ASDC_DONNEES . '/prix.php');
    $textes = asdc_textes();
    $structure = asdc_structure();
    $pris = $titresOrigine + array_column($structure['rubriques'], 'titre', 'id');

    // 1. Une rubrique nouvelle, si son nom est rempli.
    $nouvelle = $liste('nouvelle_rubrique');
    $idNouvelle = '';
    if ($rempli($nouvelle['titre'] ?? null)) {
        $titre = $texte($nouvelle['titre'], 'nr-titre', ASDC_TITRE_MAX, 'Donnez un nom à la nouvelle rubrique.');
        $apres = is_string($nouvelle['apres'] ?? null) ? $nouvelle['apres'] : '';
        if ($apres !== '' && (!isset($pris[$apres]) || isset($fixes[$apres]))) {
            $erreurs['nr-apres'] = 'Choisissez où placer la nouvelle rubrique.';
        } elseif ($titre !== null) {
            $idNouvelle = asdc_nouvel_id($titre, $pris);
            $structure['rubriques'][] = ['id' => $idNouvelle, 'titre' => $titre, 'riz' => !empty($nouvelle['riz']), 'apres' => $apres];
            $pris[$idNouvelle] = $titre;
            $changes++;
        }
    }

    // 2. Les rubriques ajoutées : nom, riz, place, ou suppression (avec leurs plats ajoutés).
    $titres = $liste('rubrique');
    $rizs = $liste('riz');
    $places = $liste('apres');
    $supprimerRubriques = $liste('supprimer_rubrique');
    $supprimees = [];
    $gardees = [];
    foreach ($structure['rubriques'] as $r) {
        $id = $r['id'];
        if ($id !== $idNouvelle && !empty($supprimerRubriques[$id])) {
            $supprimees[$id] = true;
            $changes++;
            continue;
        }
        if ($id !== $idNouvelle) {
            if (array_key_exists($id, $titres)) {
                $t = $texte($titres[$id], 't-' . $id, ASDC_TITRE_MAX, 'Donnez un nom à cette rubrique.');
                if ($t !== null && $t !== $r['titre']) {
                    $r['titre'] = $t;
                    $changes++;
                }
            }
            if (array_key_exists($id, $rizs) && ((string) $rizs[$id] === '1') !== $r['riz']) {
                $r['riz'] = (string) $rizs[$id] === '1';
                $changes++;
            }
            if (is_string($places[$id] ?? null) && $places[$id] !== $r['apres']) {
                if ($places[$id] !== '' && (!isset($pris[$places[$id]]) || $places[$id] === $id || isset($fixes[$places[$id]]))) {
                    $erreurs['a-' . $id] = 'Choisissez où placer cette rubrique.';
                } else {
                    $r['apres'] = $places[$id];
                    $changes++;
                }
            }
        }
        $gardees[] = $r;
    }
    $structure['rubriques'] = $gardees;

    // 3. Les noms des rubriques d'origine.
    foreach ($titresOrigine as $id => $titreOrigine) {
        if (isset($fixes[$id]) || !array_key_exists($id, $titres)) {
            continue;
        }
        $t = $texte($titres[$id], 't-' . $id, ASDC_TITRE_MAX, 'Donnez un nom à cette rubrique.');
        if ($t === null) {
            continue;
        }
        if ($t !== asdc_titre_rubrique($id)) {
            $changes++;
        }
        if ($t === $titreOrigine) {
            unset($textes['rubriques'][$id]);
        } else {
            $textes['rubriques'][$id] = $t;
        }
    }

    // Les rubriques où un plat peut aller.
    $destinations = [];
    foreach ($titresOrigine as $id => $t) {
        if (!isset($fixes[$id])) {
            $destinations[$id] = true;
        }
    }
    foreach ($structure['rubriques'] as $r) {
        $destinations[$r['id']] = true;
    }

    // 4. Les plats : prix, nom, description, rubrique ; un plat ajouté peut aussi être supprimé.
    $parId = array_column($structure['plats'], null, 'id');
    $saisiesPrix = $liste('prix');
    $noms = $liste('nom');
    $descs = $liste('desc');
    $rangements = $liste('place');
    $supprimerPlats = $liste('supprimer_plat');
    $gardes = [];
    foreach ($plats as $id => $p) {
        $id = (string) $id;
        $ajoute = $p['ajoute'];
        $entree = $ajoute ? ($parId[$id] ?? null) : null;
        if ($ajoute && $entree === null) {
            continue;
        }
        if ($ajoute && (isset($supprimees[$entree['rubrique']]) || !empty($supprimerPlats[$id]))) {
            unset($prix[$id]);
            $structure['retires'][$id] = $entree['nom'];
            if (!isset($supprimees[$entree['rubrique']])) {
                $changes++;
            }
            continue;
        }
        if (array_key_exists($id, $saisiesPrix)) {
            $centimes = asdc_lire_prix($saisiesPrix[$id]);
            if ($centimes === null) {
                $erreurs['p-' . $id] = 'Écrivez un prix comme 10,50 (entre 0,10 et 9 999 €).';
            } else {
                if ($centimes !== ($effectifs[$id] ?? null)) {
                    $changes++;
                }
                if (!$ajoute && $centimes === ($origine[$id] ?? null)) {
                    unset($prix[$id]);
                } else {
                    $prix[$id] = $centimes;
                }
            }
        }
        if (!$p['fixe']) {
            if (array_key_exists($id, $noms)) {
                $nom = $texte($noms[$id], 'n-' . $id, ASDC_NOM_MAX, 'Donnez un nom à ce plat.');
                if ($nom !== null) {
                    if ($nom !== asdc_nom($id)) {
                        $changes++;
                    }
                    if ($ajoute) {
                        $entree['nom'] = $nom;
                    } elseif ($nom === $p['nom']) {
                        unset($textes['noms'][$id]);
                    } else {
                        $textes['noms'][$id] = $nom;
                    }
                }
            }
            if (array_key_exists($id, $descs)) {
                $desc = $texte($descs[$id], 'd-' . $id, ASDC_DESC_MAX, '');
                if ($desc !== null) {
                    if ($desc !== asdc_desc($id)) {
                        $changes++;
                    }
                    if ($ajoute) {
                        $entree['desc'] = $desc;
                    } elseif ($desc === $p['desc']) {
                        unset($textes['desc'][$id]);
                    } else {
                        $textes['desc'][$id] = $desc;
                    }
                }
            }
            if (is_string($rangements[$id] ?? null)) {
                $ou = $rangements[$id] === '__nouvelle__' ? $idNouvelle : $rangements[$id];
                // Un plat d'origine rangé dans une rubrique qu'on supprime retourne dans la sienne.
                if (!$ajoute && isset($supprimees[$ou])) {
                    $ou = $p['rubrique'];
                }
                if ($ou === '' || !isset($destinations[$ou])) {
                    $erreurs['pl-' . $id] = $rangements[$id] === '__nouvelle__'
                        ? 'Donnez d’abord un nom à la nouvelle rubrique.'
                        : 'Choisissez une rubrique.';
                } else {
                    if ($ou !== asdc_rubrique_du_plat($id)) {
                        $changes++;
                    }
                    if ($ajoute) {
                        $entree['rubrique'] = $ou;
                    } elseif ($ou === $p['rubrique']) {
                        unset($structure['places'][$id]);
                    } else {
                        $structure['places'][$id] = $ou;
                    }
                }
            }
        }
        if ($ajoute) {
            $gardes[] = $entree;
        }
    }
    $structure['plats'] = $gardes;
    $structure['retires'] = array_slice($structure['retires'], -300, null, true);
    foreach ($structure['places'] as $id => $ou) {
        if (!isset($destinations[$ou])) {
            unset($structure['places'][$id]);
        }
    }

    // 5. Un plat nouveau, si l'un de ses champs est rempli.
    $nouveau = $liste('nouveau_plat');
    if ($rempli($nouveau['nom'] ?? null) || $rempli($nouveau['prix'] ?? null) || $rempli($nouveau['desc'] ?? null)) {
        $nom = $texte($nouveau['nom'] ?? '', 'np-nom', ASDC_NOM_MAX, 'Donnez un nom au nouveau plat.');
        $desc = $texte($nouveau['desc'] ?? '', 'np-desc', ASDC_DESC_MAX, '');
        $centimes = asdc_lire_prix($nouveau['prix'] ?? '');
        if ($centimes === null) {
            $erreurs['np-prix'] = 'Écrivez le prix du nouveau plat, comme 10,50.';
        }
        $choix = is_string($nouveau['rubrique'] ?? null) ? $nouveau['rubrique'] : '';
        $ou = $choix === '__nouvelle__' ? $idNouvelle : $choix;
        if ($ou === '' || !isset($destinations[$ou])) {
            $erreurs['np-rubrique'] = $choix === '__nouvelle__'
                ? 'Donnez d’abord un nom à la nouvelle rubrique.'
                : 'Choisissez la rubrique du nouveau plat.';
        } elseif ($nom !== null && $desc !== null && $centimes !== null) {
            $idPlat = asdc_nouvel_id($nom, $plats);
            $structure['plats'][] = ['id' => $idPlat, 'rubrique' => $ou, 'nom' => $nom, 'desc' => $desc];
            $prix[$idPlat] = $centimes;
            $changes++;
        }
    }

    if ($erreurs) {
        return ['erreurs' => $erreurs, 'changes' => 0, 'ecrit' => false];
    }
    $prix = array_intersect_key($prix, $origine + array_column($structure['plats'], 'id', 'id'));
    $ecrit = asdc_ecrire(ASDC_DONNEES . '/prix.php', $prix)
        && asdc_ecrire(ASDC_DONNEES . '/textes.php', $textes)
        && asdc_ecrire(ASDC_DONNEES . '/structure.php', $structure);
    return ['erreurs' => [], 'changes' => $changes, 'ecrit' => $ecrit];
}
