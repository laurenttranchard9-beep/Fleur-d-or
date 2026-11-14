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

function asdc_id_valide($id): bool
{
    return is_string($id) && preg_match('/^[a-z0-9][a-z0-9-]{0,99}$/', $id) === 1;
}

/* ---------- Ce que l'espace gestion a changé dans la carte ---------- */

// Rubriques et plats créés dans l'espace gestion, plats d'origine rangés dans une autre rubrique (donnees/structure.php).
function asdc_structure(): array
{
    static $structure = null;
    if ($structure === null) {
        $lu = asdc_lire(ASDC_DONNEES . '/structure.php');
        $structure = ['rubriques' => [], 'plats' => [], 'places' => []];
        foreach ((array) ($lu['rubriques'] ?? []) as $r) {
            if (is_array($r) && asdc_id_valide($r['id'] ?? null) && is_string($r['titre'] ?? null) && $r['titre'] !== '') {
                $structure['rubriques'][] = [
                    'id' => $r['id'],
                    'titre' => $r['titre'],
                    'riz' => !empty($r['riz']),
                    'apres' => asdc_id_valide($r['apres'] ?? null) ? $r['apres'] : '',
                ];
            }
        }
        foreach ((array) ($lu['plats'] ?? []) as $p) {
            if (is_array($p) && asdc_id_valide($p['id'] ?? null) && asdc_id_valide($p['rubrique'] ?? null) && is_string($p['nom'] ?? null) && $p['nom'] !== '') {
                $structure['plats'][] = [
                    'id' => $p['id'],
                    'rubrique' => $p['rubrique'],
                    'nom' => $p['nom'],
                    'desc' => is_string($p['desc'] ?? null) ? $p['desc'] : '',
                ];
            }
        }
        foreach ((array) ($lu['places'] ?? []) as $id => $rubrique) {
            if (asdc_id_valide((string) $id) && asdc_id_valide($rubrique)) {
                $structure['places'][(string) $id] = $rubrique;
            }
        }
    }
    return $structure;
}

// Prix en centimes : ceux de la carte, sauf ceux changés dans l'espace gestion, et ceux des plats ajoutés.
function asdc_prix(): array
{
    static $prix = null;
    if ($prix === null) {
        $prix = asdc_prix_origine();
        $ajoutes = array_column(asdc_structure()['plats'], 'id', 'id');
        foreach (asdc_lire(ASDC_DONNEES . '/prix.php') as $id => $centimes) {
            if ((isset($prix[$id]) || isset($ajoutes[$id])) && asdc_prix_valide($centimes)) {
                $prix[$id] = $centimes;
            }
        }
    }
    return $prix;
}

/* ---------- Noms, descriptions et rubriques du moment ---------- */

// Tous les plats, ceux de la carte d'origine puis ceux ajoutés : nom et description de base, rubrique de départ,
// mots de recherche en plus. Le nom et la description du moment passent par asdc_nom() et asdc_desc().
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
                    'ajoute' => false,
                    'fixe' => !empty($rubrique['fixe']),
                ];
            }
        }
        foreach (asdc_structure()['plats'] as $plat) {
            if (!isset($plats[$plat['id']])) {
                $plats[$plat['id']] = [
                    'nom' => $plat['nom'],
                    'desc' => $plat['desc'],
                    'rubrique' => $plat['rubrique'],
                    'cles' => '',
                    'ajoute' => true,
                    'fixe' => false,
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

// Textes changés dans l'espace gestion pour la carte d'origine : une description peut devenir vide,
// un nom de plat ou de rubrique jamais. Les plats et rubriques ajoutés portent leurs textes eux-mêmes.
function asdc_textes(): array
{
    static $textes = null;
    if ($textes === null) {
        $lu = asdc_lire(ASDC_DONNEES . '/textes.php');
        $plats = asdc_plats();
        $titres = asdc_titres_origine();
        $textes = ['desc' => [], 'rubriques' => [], 'noms' => []];
        foreach ((array) ($lu['desc'] ?? []) as $id => $texte) {
            if (isset($plats[$id]) && !$plats[$id]['ajoute'] && is_string($texte)) {
                $textes['desc'][$id] = $texte;
            }
        }
        foreach ((array) ($lu['noms'] ?? []) as $id => $nom) {
            if (isset($plats[$id]) && !$plats[$id]['ajoute'] && is_string($nom) && $nom !== '') {
                $textes['noms'][$id] = $nom;
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

function asdc_nom(string $id): string
{
    return asdc_textes()['noms'][$id] ?? (asdc_plats()[$id]['nom'] ?? '');
}

function asdc_desc(string $id): string
{
    $changees = asdc_textes()['desc'];
    return array_key_exists($id, $changees) ? $changees[$id] : (asdc_plats()[$id]['desc'] ?? '');
}

function asdc_titre_rubrique(string $id): string
{
    if (isset(asdc_textes()['rubriques'][$id])) {
        return asdc_textes()['rubriques'][$id];
    }
    $origine = asdc_titres_origine();
    if (isset($origine[$id])) {
        return $origine[$id];
    }
    foreach (asdc_structure()['rubriques'] as $r) {
        if ($r['id'] === $id) {
            return $r['titre'];
        }
    }
    return '';
}

// Le supplément de riz cantonais : le plat de la rubrique « fixe » de la carte d'origine.
function asdc_id_riz(): string
{
    foreach (asdc_carte()['rubriques'] as $r) {
        if (!empty($r['fixe']) && !empty($r['plats'][0]['id'])) {
            return (string) $r['plats'][0]['id'];
        }
    }
    return '';
}

/* ---------- La carte du moment ---------- */

// La carte telle que le site l'affiche : les rubriques dans l'ordre (les nouvelles à la place choisie), et dans
// chacune ses plats : ceux d'origine restés là, puis ceux qu'on y a rangés, puis les nouveaux. La rubrique « fixe »
// (le supplément de riz cantonais, propre à l'espace gestion) n'en fait pas partie.
function asdc_carte_du_moment(): array
{
    static $carte = null;
    if ($carte !== null) {
        return $carte;
    }
    $structure = asdc_structure();
    $suivantes = [];
    foreach ($structure['rubriques'] as $r) {
        $suivantes[$r['apres']][] = $r;
    }
    $rubriques = [];
    $poser = function (string $id, string $titre, bool $riz, bool $ajoutee, string $apres) use (&$poser, &$rubriques, $suivantes): void {
        if (isset($rubriques[$id])) {
            return;
        }
        $rubriques[$id] = ['id' => $id, 'titre' => $titre, 'riz' => $riz, 'ajoutee' => $ajoutee, 'apres' => $apres, 'plats' => []];
        foreach ($suivantes[$id] ?? [] as $r) {
            $poser($r['id'], $r['titre'], $r['riz'], true, $r['apres']);
        }
    };
    foreach ($suivantes[''] ?? [] as $r) {
        $poser($r['id'], $r['titre'], $r['riz'], true, '');
    }
    foreach (asdc_carte()['rubriques'] as $r) {
        if (empty($r['fixe'])) {
            $poser((string) $r['id'], asdc_titre_rubrique((string) $r['id']), !empty($r['riz']), false, '');
        }
    }
    // Une rubrique dont la voisine a disparu se range en fin de carte.
    foreach ($structure['rubriques'] as $r) {
        $poser($r['id'], $r['titre'], $r['riz'], true, $r['apres']);
    }

    $prix = asdc_prix();
    $plats = asdc_plats();
    $places = $structure['places'];
    $poserPlat = function (string $id, string $rubrique) use (&$rubriques, $prix, $plats): void {
        if (!isset($rubriques[$rubrique]) || !isset($prix[$id])) {
            return;
        }
        $rubriques[$rubrique]['plats'][] = [
            'id' => $id,
            'nom' => asdc_nom($id),
            'desc' => asdc_desc($id),
            'prix' => $prix[$id],
            'cles' => $plats[$id]['cles'],
            'ajoute' => $plats[$id]['ajoute'],
            'origine' => $plats[$id]['rubrique'],
        ];
    };
    foreach ($plats as $id => $p) {
        if (!$p['ajoute'] && !$p['fixe'] && !isset($places[$id])) {
            $poserPlat((string) $id, $p['rubrique']);
        }
    }
    foreach ($plats as $id => $p) {
        if (!$p['ajoute'] && !$p['fixe'] && isset($places[$id])) {
            $poserPlat((string) $id, isset($rubriques[$places[$id]]) ? $places[$id] : $p['rubrique']);
        }
    }
    foreach ($plats as $id => $p) {
        if ($p['ajoute']) {
            $poserPlat((string) $id, $p['rubrique']);
        }
    }
    $carte = array_values($rubriques);
    return $carte;
}

function asdc_rubrique_du_plat(string $id): string
{
    static $ou = null;
    if ($ou === null) {
        $ou = [];
        foreach (asdc_carte_du_moment() as $r) {
            foreach ($r['plats'] as $p) {
                $ou[$p['id']] = $r['id'];
            }
        }
    }
    return $ou[$id] ?? (asdc_plats()[$id]['rubrique'] ?? '');
}

function asdc_nombre_plats(): int
{
    $n = 0;
    foreach (asdc_carte_du_moment() as $r) {
        $n += count($r['plats']);
    }
    return $n;
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
    $morceaux = [asdc_nom($id), asdc_desc($id), asdc_titre_rubrique(asdc_rubrique_du_plat($id)), $plat['cles']];
    return asdc_normaliser(implode(' ', array_filter($morceaux, 'strlen')));
}

/* ---------- La carte en HTML et pour Google ---------- */

// Les rubriques de la page « La carte », plat par plat ; une rubrique encore vide ne s'affiche pas.
function asdc_html_carte(): string
{
    $prix = asdc_prix();
    $idRiz = asdc_id_riz();
    $plus = '<svg class="icone icone--plus" aria-hidden="true" focusable="false"><use href="#i-plus"/></svg>';
    $nl = chr(10);
    $html = '';
    foreach (asdc_carte_du_moment() as $r) {
        if (!$r['plats']) {
            continue;
        }
        $id = asdc_h($r['id']);
        $html .= '      <section class="rubrique" id="' . $id . '" aria-labelledby="r-' . $id . '" data-rubrique>' . $nl
            . '        <h2 id="r-' . $id . '" class="rubrique__titre">' . asdc_typo(asdc_h($r['titre'])) . '</h2>' . $nl;
        if ($r['riz'] && isset($prix[$idRiz])) {
            $html .= '        <p class="rubrique__riz">Servis avec du riz nature. Riz cantonais (porc ou crevettes) en supplément'
                . ASDC_NBSP . ': + ' . asdc_euros($prix[$idRiz]) . '</p>' . $nl;
        }
        $html .= '        <ul class="plats">' . $nl;
        foreach ($r['plats'] as $p) {
            $pid = asdc_h($p['id']);
            $nom = asdc_typo(asdc_h($p['nom']));
            $html .= '          <li class="plat" data-plat="' . $pid . '" data-nom="' . $nom . '" data-prix="' . $p['prix']
                . '" data-recherche="' . asdc_h(asdc_recherche_plat($p['id'])) . '"' . ($r['riz'] ? ' data-riz' : '') . '>' . $nl
                . '            <span class="plat__nom">' . $nom . '</span>' . $nl
                . ($p['desc'] !== '' ? '            <span class="plat__desc">' . asdc_typo(asdc_h($p['desc'])) . '</span>' . $nl : '')
                . '            <span class="plat__prix">' . asdc_euros($p['prix']) . '</span>' . $nl
                . '            <button type="button" class="plat__ajout" data-ajouter="' . $pid . '" hidden aria-label="Ajouter à la commande : '
                . $nom . '">' . $plus . '</button>' . $nl
                . '          </li>' . $nl;
        }
        $html .= '        </ul>' . $nl . '      </section>' . $nl;
    }
    return $html;
}

// L'index des rubriques (barre collante sur mobile, colonne sur grand écran).
function asdc_html_index(): string
{
    $html = '';
    foreach (asdc_carte_du_moment() as $r) {
        if ($r['plats']) {
            $html .= '        <li><a href="#' . asdc_h($r['id']) . '" data-lien-rubrique="' . asdc_h($r['id']) . '">'
                . asdc_typo(asdc_h($r['titre'])) . '</a></li>' . chr(10);
        }
    }
    return $html;
}

// Les données structurées « Menu » pour Google : la base vient du générateur, les rubriques et plats du moment d'ici.
function asdc_jsonld_menu(): string
{
    $base = asdc_carte()['menu'] ?? null;
    if (!is_array($base)) {
        return '';
    }
    $prix = asdc_prix();
    $idRiz = asdc_id_riz();
    $sections = [];
    foreach (asdc_carte_du_moment() as $r) {
        if (!$r['plats']) {
            continue;
        }
        $section = ['@type' => 'MenuSection', 'name' => $r['titre']];
        if ($r['riz'] && isset($prix[$idRiz])) {
            $section['description'] = 'Servis avec du riz nature. Riz cantonais (porc ou crevettes) : + ' . asdc_euros($prix[$idRiz]) . '.';
        }
        $section['hasMenuItem'] = array_map(function (array $p): array {
            $item = ['@type' => 'MenuItem', 'name' => $p['nom']];
            if ($p['desc'] !== '') {
                $item['description'] = $p['desc'];
            }
            $item['offers'] = ['@type' => 'Offer', 'price' => number_format($p['prix'] / 100, 2, '.', ''), 'priceCurrency' => 'EUR'];
            return $item;
        }, $r['plats']);
        $sections[] = $section;
    }
    $base['hasMenuSection'] = $sections;
    $json = json_encode($base, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG);
    return is_string($json) ? '<script type="application/ld+json">' . $json . '</script>' : '';
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

// Les pages portent des jetons {{prix:id}}, {{nom:id}}, {{carte:rubriques}}… : on les remplace au dernier instant
// par le prix, le nom, la description, ou la carte entière du moment (celle d'origine, plus l'espace gestion).
function asdc_remplir(string $html): string
{
    $prix = asdc_prix();
    $motif = '/[{][{](prix|cents|json|rond|des|desc|jdesc|rubrique|jrubrique|recherche|carte|nombre|nom|ancre):([a-z0-9,-]+)[}][}]/';
    $rempli = preg_replace_callback($motif, function (array $m) use ($prix): string {
        switch ($m[1]) {
            case 'carte':
                if ($m[2] === 'rubriques') {
                    return asdc_html_carte();
                }
                if ($m[2] === 'index') {
                    return asdc_html_index();
                }
                return $m[2] === 'jsonld' ? asdc_jsonld_menu() : '';
            case 'nombre':
                return (string) asdc_nombre_plats();
            case 'nom':
                return asdc_typo(asdc_h(asdc_nom($m[2])));
            case 'ancre':
                return asdc_h(asdc_rubrique_du_plat($m[2]));
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
