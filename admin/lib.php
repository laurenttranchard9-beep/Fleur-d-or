<?php
/*
 * La Fleur d'Or : fonctions communes du panneau d'administration.
 * Données : donnees/carte.json (source unique de la carte et des formules).
 * Publication : génère index.html à partir de admin/modele.html.
 * PHP 8.0 ou plus récent, aucune extension particulière.
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}

const FD_RACINE = __DIR__ . '/..';
const FD_DONNEES = FD_RACINE . '/donnees';
const FD_CARTE = FD_DONNEES . '/carte.json';
const FD_ADMIN = FD_DONNEES . '/admin.json';
const FD_TENTATIVES = FD_DONNEES . '/tentatives.json';
const FD_SAUVEGARDES = FD_DONNEES . '/sauvegardes';
const FD_VERROU = FD_DONNEES . '/.verrou';
const FD_MODELE = __DIR__ . '/modele.html';
const FD_PAGE = FD_RACINE . '/index.html';
const FD_IMAGES = FD_RACINE . '/assets/img';
const FD_NB_SAUVEGARDES = 30;

/* ---------- Outils ---------- */

function fd_e(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
}

function fd_longueur(string $s): int
{
    return function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : (int) preg_match_all('/./us', $s);
}

function fd_slug(string $s): string
{
    $s = strtr(mb_strtolower_sur($s), [
        'à' => 'a', 'â' => 'a', 'ä' => 'a', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e', 'î' => 'i', 'ï' => 'i',
        'ô' => 'o', 'ö' => 'o', 'û' => 'u', 'ù' => 'u', 'ü' => 'u', 'ç' => 'c', 'œ' => 'oe', 'æ' => 'ae', '’' => '-', "'" => '-',
    ]);
    $s = trim((string) preg_replace('/[^a-z0-9]+/', '-', $s), '-');
    return substr($s, 0, 60) ?: 'element';
}

function mb_strtolower_sur(string $s): string
{
    return function_exists('mb_strtolower') ? mb_strtolower($s, 'UTF-8') : strtolower($s);
}

function fd_prix_valeur(float $p): string
{
    return number_format($p, 2, '.', '');
}

function fd_prix_texte(float $p): string
{
    return number_format($p, 2, ',', '') . "\u{00A0}€";
}

function fd_lire_json(string $fichier, $defaut = null)
{
    if (!is_file($fichier)) {
        return $defaut;
    }
    $brut = file_get_contents($fichier);
    $v = json_decode((string) $brut, true);
    return $v === null ? $defaut : $v;
}

/** Écrit un fichier sans jamais laisser de version à moitié écrite. */
function fd_ecrire_atomique(string $fichier, string $contenu): void
{
    $dossier = dirname($fichier);
    if (!is_dir($dossier) && !mkdir($dossier, 0775, true) && !is_dir($dossier)) {
        throw new RuntimeException("Impossible de créer le dossier $dossier.");
    }
    $temp = $dossier . '/.' . basename($fichier) . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (file_put_contents($temp, $contenu, LOCK_EX) === false) {
        throw new RuntimeException('Écriture impossible dans ' . basename($dossier) . ' : vérifiez les droits du dossier.');
    }
    if (!rename($temp, $fichier)) {
        @unlink($temp);
        throw new RuntimeException('Impossible de remplacer ' . basename($fichier) . '.');
    }
}

function fd_ecrire_json(string $fichier, $donnees): void
{
    fd_ecrire_atomique($fichier, json_encode($donnees, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");
}

/* ---------- Photos disponibles ---------- */

/** @return array<string, array{petite:string, grande:string, lp:int, lg:int, largeur:int, hauteur:int}> */
function fd_photos(): array
{
    $photos = [];
    foreach (glob(FD_IMAGES . '/*-*.webp') ?: [] as $f) {
        if (!preg_match('/^(.+)-(\d+)\.webp$/', basename($f), $m)) {
            continue;
        }
        [$nom, $l] = [$m[1], (int) $m[2]];
        $photos[$nom]['tailles'][$l] = basename($f);
    }
    $sortie = [];
    foreach ($photos as $nom => $p) {
        ksort($p['tailles']);
        $lp = array_key_first($p['tailles']);
        $lg = array_key_last($p['tailles']);
        $dim = @getimagesize(FD_IMAGES . '/' . $p['tailles'][$lp]) ?: [$lp, (int) round($lp * 0.75)];
        $sortie[$nom] = [
            'petite' => $p['tailles'][$lp], 'grande' => $p['tailles'][$lg],
            'lp' => $lp, 'lg' => $lg, 'largeur' => (int) $dim[0], 'hauteur' => (int) $dim[1],
        ];
    }
    ksort($sortie);
    return $sortie;
}

/* ---------- Validation ---------- */

final class FdValidation
{
    /** @var string[] */
    public array $erreurs = [];
    /** @var array<string, true> */
    private array $ids = [];
    /** @var array<string, mixed> */
    private array $photos;

    private const RESERVES = ['haut', 'titre', 'formules', 'carte', 'infos', 'carnet', 'q', 'resultat', 'emporter-titre',
        'formules-titre', 'carte-titre', 'infos-titre', 'carnet-titre'];

    public function __construct()
    {
        $this->photos = fd_photos();
        foreach (self::RESERVES as $r) {
            $this->ids[$r] = true;
        }
    }

    public function texte($v, string $ou, int $max, bool $requis = false): string
    {
        $s = is_string($v) ? trim(preg_replace('/[ \t\r\n\f\v]+/', ' ', $v) ?? '') : (is_numeric($v) ? (string) $v : '');
        if ($requis && $s === '') {
            $this->erreurs[] = "$ou : ce champ est obligatoire.";
        } elseif (fd_longueur($s) > $max) {
            $this->erreurs[] = "$ou : $max caractères au maximum.";
            $s = function_exists('mb_substr') ? mb_substr($s, 0, $max, 'UTF-8') : substr($s, 0, $max);
        }
        return $s;
    }

    /** @return float|null */
    public function prix($v, string $ou, bool $requis)
    {
        if ($v === null || $v === '') {
            if ($requis) {
                $this->erreurs[] = "$ou : le prix est obligatoire.";
            }
            return null;
        }
        if (is_string($v)) {
            $v = str_replace([' ', "\u{00A0}", '€', ','], ['', '', '', '.'], $v);
        }
        if (!is_numeric($v) || (float) $v <= 0 || (float) $v > 9999.99) {
            $this->erreurs[] = "$ou : prix invalide (exemple : 11,50).";
            return null;
        }
        return round((float) $v, 2);
    }

    public function id($v, string $titre): string
    {
        $base = (is_string($v) && preg_match('/^[a-z0-9][a-z0-9-]{0,59}$/', $v)) ? $v : fd_slug($titre);
        $id = $base;
        for ($i = 2; isset($this->ids[$id]); $i++) {
            $id = $base . '-' . $i;
        }
        $this->ids[$id] = true;
        return $id;
    }

    public function photo($v, string $ou): string
    {
        if (!is_string($v) || $v === '') {
            return '';
        }
        if (!isset($this->photos[$v])) {
            $this->erreurs[] = "$ou : la photo « $v » n’existe pas dans assets/img.";
            return '';
        }
        return $v;
    }

    /** @param mixed $v */
    public static function liste($v): array
    {
        return is_array($v) ? array_values($v) : [];
    }
}

/**
 * Nettoie et vérifie toute la carte. Ne garde que les champs connus.
 * @return array{0: array, 1: string[]}
 */
function fd_valider($brut): array
{
    $v = new FdValidation();
    $d = is_array($brut) ? $brut : [];
    $propre = ['version' => 1, 'formules' => [], 'quartiers' => []];
    $totalPlats = 0;

    $groupesF = FdValidation::liste($d['formules'] ?? []);
    if (count($groupesF) > 10) {
        $v->erreurs[] = 'Formules : 10 groupes au maximum.';
    }
    foreach (array_slice($groupesF, 0, 10) as $gi => $g) {
        $g = is_array($g) ? $g : [];
        $titre = $v->texte($g['titre'] ?? '', 'Groupe de formules n° ' . ($gi + 1) . ' : titre', 80, true);
        $G = ['id' => $v->id($g['id'] ?? '', 'formules-' . $titre), 'titre' => $titre, 'menus' => []];
        $menus = FdValidation::liste($g['menus'] ?? []);
        if (count($menus) > 30) {
            $v->erreurs[] = "Formules « $titre » : 30 formules au maximum.";
        }
        foreach (array_slice($menus, 0, 30) as $mi => $m) {
            $m = is_array($m) ? $m : [];
            $ou = "Formule n° " . ($mi + 1) . " de « $titre »";
            $nom = $v->texte($m['nom'] ?? '', "$ou : nom", 80, true);
            $ou = "Formule « " . ($nom ?: 'sans nom') . " »";
            $M = [
                'nom' => $nom,
                'prix' => $v->prix($m['prix'] ?? null, $ou, true),
                'condition' => $v->texte($m['condition'] ?? '', "$ou : condition", 120),
                'photo' => $v->photo($m['photo'] ?? '', $ou),
                'photo_alt' => '',
                'texte' => $v->texte($m['texte'] ?? '', "$ou : texte", 300),
                'imprimer' => !array_key_exists('imprimer', $m) || !empty($m['imprimer']),
                'services' => [],
            ];
            $M['photo_alt'] = $M['photo'] === '' ? '' : ($v->texte($m['photo_alt'] ?? '', "$ou : description de la photo", 160) ?: $nom);
            $services = FdValidation::liste($m['services'] ?? []);
            if (count($services) > 10) {
                $v->erreurs[] = "$ou : 10 parties au maximum (entrée, plat…).";
            }
            foreach (array_slice($services, 0, 10) as $si => $s) {
                $s = is_array($s) ? $s : [];
                $st = $v->texte($s['titre'] ?? '', "$ou, partie n° " . ($si + 1) . ' : titre', 40, true);
                $type = in_array($s['type'] ?? '', ['choix', 'ensemble', 'simple'], true) ? $s['type'] : 'simple';
                $choix = [];
                foreach (array_slice(FdValidation::liste($s['choix'] ?? []), 0, 20) as $c) {
                    $c = $v->texte($c, "$ou, « $st »", 160);
                    if ($c !== '') {
                        $choix[] = $c;
                    }
                }
                if (!$choix) {
                    $v->erreurs[] = "$ou, « $st » : ajoutez au moins une ligne.";
                }
                $M['services'][] = ['titre' => $st, 'type' => $type, 'choix' => $choix];
            }
            $G['menus'][] = $M;
        }
        $propre['formules'][] = $G;
    }

    $quartiers = FdValidation::liste($d['quartiers'] ?? []);
    if (!$quartiers) {
        $v->erreurs[] = 'La carte doit contenir au moins une partie.';
    }
    if (count($quartiers) > 30) {
        $v->erreurs[] = 'La carte : 30 parties au maximum.';
    }
    foreach (array_slice($quartiers, 0, 30) as $qi => $q) {
        $q = is_array($q) ? $q : [];
        $titre = $v->texte($q['titre'] ?? '', 'Partie n° ' . ($qi + 1) . ' : titre', 80, true);
        $Q = ['id' => $v->id($q['id'] ?? '', $titre), 'titre' => $titre, 'boissons' => !empty($q['boissons']), 'sections' => []];
        $sections = FdValidation::liste($q['sections'] ?? []);
        if (count($sections) > 60) {
            $v->erreurs[] = "Partie « $titre » : 60 catégories au maximum.";
        }
        foreach (array_slice($sections, 0, 60) as $si => $s) {
            $s = is_array($s) ? $s : [];
            $st = $v->texte($s['titre'] ?? '', "Catégorie n° " . ($si + 1) . " de « $titre » : nom", 80, true);
            $ou = "Catégorie « " . ($st ?: 'sans nom') . " »";
            $S = [
                'id' => $v->id($s['id'] ?? '', $st),
                'titre' => $st,
                'note' => $v->texte($s['note'] ?? '', "$ou : mention", 120),
                'prefixe' => $v->texte($s['prefixe'] ?? '', "$ou : préfixe", 60),
                'piment' => !empty($s['piment']),
                'photo' => $v->photo($s['photo'] ?? '', $ou),
                'photo_alt' => '',
                'groupes' => [],
            ];
            $S['photo_alt'] = $S['photo'] === '' ? '' : ($v->texte($s['photo_alt'] ?? '', "$ou : description de la photo", 160) ?: $st);
            $groupes = FdValidation::liste($s['groupes'] ?? []);
            if (count($groupes) > 20) {
                $v->erreurs[] = "$ou : 20 groupes au maximum.";
            }
            foreach (array_slice($groupes, 0, 20) as $gi => $g) {
                $g = is_array($g) ? $g : [];
                $G = [
                    'titre' => $v->texte($g['titre'] ?? '', "$ou, groupe n° " . ($gi + 1) . ' : titre', 80),
                    'note' => $v->texte($g['note'] ?? '', "$ou, groupe n° " . ($gi + 1) . ' : précision', 300),
                    'plats' => [],
                ];
                $plats = FdValidation::liste($g['plats'] ?? []);
                if (count($plats) > 150) {
                    $v->erreurs[] = "$ou : 150 plats au maximum par groupe.";
                }
                foreach (array_slice($plats, 0, 150) as $pi => $p) {
                    $p = is_array($p) ? $p : [];
                    $nom = $v->texte($p['nom'] ?? '', "$ou, plat n° " . ($pi + 1) . ' : nom', 150, true);
                    $po = "$ou, « " . ($nom ?: 'plat n° ' . ($pi + 1)) . ' »';
                    $P = [
                        'nom' => $nom,
                        'desc' => $v->texte($p['desc'] ?? '', "$po : précision", 200),
                        'piment' => !empty($p['piment']),
                        'prix' => null,
                        'formats' => [],
                    ];
                    $formats = array_slice(FdValidation::liste($p['formats'] ?? []), 0, 4);
                    if ($formats) {
                        $unPrix = false;
                        foreach ($formats as $fi => $f) {
                            $f = is_array($f) ? $f : [];
                            $fp = $v->prix($f['prix'] ?? null, "$po, format n° " . ($fi + 1), false);
                            $unPrix = $unPrix || $fp !== null;
                            $P['formats'][] = ['libelle' => $v->texte($f['libelle'] ?? '', "$po, format n° " . ($fi + 1), 20), 'prix' => $fp];
                        }
                        if (!$unPrix) {
                            $v->erreurs[] = "$po : indiquez au moins un prix.";
                        }
                    } else {
                        $P['prix'] = $v->prix($p['prix'] ?? null, $po, true);
                    }
                    $G['plats'][] = $P;
                    $totalPlats++;
                }
                $S['groupes'][] = $G;
            }
            $Q['sections'][] = $S;
        }
        $propre['quartiers'][] = $Q;
    }
    if ($totalPlats > 1500) {
        $v->erreurs[] = 'La carte : 1500 lignes au maximum.';
    }
    return [$propre, $v->erreurs];
}

/* ---------- Rendu de la page publique ---------- */

function fd_icone(string $nom, string $classe = 'ico'): string
{
    return '<svg class="' . $classe . '" aria-hidden="true" focusable="false"><use href="#i-' . $nom . '"></use></svg>';
}

function fd_piment(): string
{
    return '<span class="piment">' . fd_icone('piment', 'ico ico-piment') . '<span class="sr-only">pimenté</span></span>';
}

function fd_nb_plats(array $section): int
{
    $n = 0;
    foreach ($section['groupes'] as $g) {
        $n += count($g['plats']);
    }
    return $n;
}

function fd_rendre_plat(array $p): string
{
    $attrs = $p['piment'] ? ' data-piment' : '';
    $nom = '<span class="plat-nom">' . fd_e($p['nom']);
    if ($p['piment']) {
        $nom .= ' ' . fd_piment();
    }
    if ($p['desc'] !== '') {
        $nom .= ' <span class="plat-desc">' . fd_e($p['desc']) . '</span>';
    }
    $nom .= '</span>';
    if ($p['formats']) {
        $cellules = '';
        foreach ($p['formats'] as $f) {
            $c = $f['libelle'];
            if ($f['prix'] === null) {
                $cellules .= $c !== ''
                    ? '<span class="vin-prix vin-vide"><span class="sr-only">non servi en </span><span class="sr-only">' . fd_e($c) . '</span><span aria-hidden="true">–</span></span>'
                    : '<span class="vin-prix vin-vide"></span>';
            } else {
                $cellules .= '<span class="vin-prix">' . ($c !== '' ? '<span class="vin-format">' . fd_e($c) . '</span> ' : '')
                    . '<data value="' . fd_prix_valeur($f['prix']) . '">' . fd_prix_texte($f['prix']) . '</data></span>';
            }
        }
        return '<li class="plat plat-vin"' . $attrs . '>' . $nom . '<span class="vin-prix-ligne">' . $cellules . '</span></li>';
    }
    return '<li class="plat"' . $attrs . '>' . $nom . ' <data class="plat-prix" value="' . fd_prix_valeur($p['prix'])
        . '">' . fd_prix_texte($p['prix']) . '</data></li>';
}

function fd_rendre_section(array $s, array $q, array $photos): string
{
    $n = fd_nb_plats($s);
    $formats = false;
    foreach ($s['groupes'] as $g) {
        foreach ($g['plats'] as $p) {
            $formats = $formats || (bool) $p['formats'];
        }
    }
    $unite = $formats ? 'lignes' : ($q['boissons'] ? 'choix' : 'plats');
    $extra = ($s['prefixe'] !== '' ? ' data-prefixe="' . fd_e($s['prefixe']) . '"' : '') . ($s['piment'] ? ' data-piment' : '');
    $parties = ['<section class="etal" id="' . $s['id'] . '" aria-labelledby="t-' . $s['id'] . '"' . $extra . '>'];
    if ($s['photo'] !== '' && isset($photos[$s['photo']])) {
        $ph = $photos[$s['photo']];
        $parties[] = '<img class="etal-photo" src="assets/img/' . $ph['petite'] . '" srcset="assets/img/' . $ph['petite'] . ' ' . $ph['lp']
            . 'w, assets/img/' . $ph['grande'] . ' ' . $ph['lg'] . 'w" sizes="(min-width: 1100px) 420px, (min-width: 700px) 45vw, 92vw" width="'
            . $ph['largeur'] . '" height="' . $ph['hauteur'] . '" loading="lazy" decoding="async" alt="' . fd_e($s['photo_alt']) . '">';
    }
    $titre = fd_e($s['titre']) . ($s['piment'] ? ' ' . fd_piment() : '');
    $meta = ($s['note'] !== '' ? '<span class="etal-note">' . fd_e($s['note']) . '</span>' : '')
        . ($s['piment'] ? '<span class="etal-note">Toute la section est pimentée</span>' : '');
    $parties[] = '<header class="etal-tete"><h3 class="etal-titre" id="t-' . $s['id'] . '">' . $titre . '</h3>'
        . '<p class="etal-meta"><span class="etal-compte" data-compte="' . $n . '" data-unite="' . $unite . '">' . $n . ' ' . $unite . '</span>' . $meta . '</p></header>';
    foreach ($s['groupes'] as $g) {
        if (!$g['plats']) {
            continue;
        }
        $parties[] = '<div class="groupe">';
        if ($g['titre'] !== '') {
            $parties[] = '<h4 class="groupe-titre">' . fd_e($g['titre']) . '</h4>';
        }
        if ($g['note'] !== '') {
            $parties[] = '<p class="groupe-note">' . fd_e($g['note']) . '</p>';
        }
        $parties[] = '<ul class="plats" role="list">';
        foreach ($g['plats'] as $p) {
            $parties[] = fd_rendre_plat($p);
        }
        $parties[] = '</ul></div>';
    }
    $parties[] = '</section>';
    return implode("\n", $parties);
}

/** Les catégories vides ne sont pas publiées. */
function fd_sections_visibles(array $q): array
{
    return array_values(array_filter($q['sections'], fn($s) => fd_nb_plats($s) > 0));
}

function fd_rendre_carte(array $d, array $photos): string
{
    $sortie = [];
    foreach ($d['quartiers'] as $q) {
        $sections = fd_sections_visibles($q);
        if (!$sections) {
            continue;
        }
        $sortie[] = '<div class="quartier" id="q-' . $q['id'] . '" data-quartier="' . $q['id'] . '">';
        $sortie[] = '<h2 class="quartier-titre"><span>' . fd_e($q['titre']) . '</span></h2>';
        $sortie[] = '<div class="quartier-etals">';
        foreach ($sections as $s) {
            $sortie[] = fd_rendre_section($s, $q, $photos);
        }
        $sortie[] = '</div>';
        if ($q['boissons']) {
            $sortie[] = '<p class="mention-alcool">L’abus d’alcool est dangereux pour la santé, à consommer avec modération.</p>';
        }
        $sortie[] = '</div>';
    }
    return implode("\n", $sortie);
}

function fd_rendre_rubriques(array $d): string
{
    $li = [];
    foreach ($d['quartiers'] as $q) {
        foreach (fd_sections_visibles($q) as $s) {
            $li[] = '<li><a href="#' . $s['id'] . '" data-rubrique="' . $s['id'] . '">' . fd_e($s['titre']) . '</a></li>';
        }
    }
    return implode("\n", $li);
}

function fd_rendre_formules(array $d, array $photos): string
{
    $sortie = [];
    $vus = [];
    foreach ($d['formules'] as $g) {
        if (!$g['menus']) {
            continue;
        }
        $sortie[] = '<div class="formules-groupe" id="' . $g['id'] . '">';
        $sortie[] = '<h3 class="formules-groupe-titre">' . fd_e($g['titre']) . '</h3>';
        $sortie[] = '<ul class="ardoises" role="list">';
        foreach ($g['menus'] as $m) {
            $base = fd_slug('formule-' . $m['nom'] . '-' . fd_prix_valeur($m['prix']));
            $fid = $base;
            for ($i = 2; isset($vus[$fid]); $i++) {
                $fid = $base . '-' . $i;
            }
            $vus[$fid] = true;
            $o = '<li class="ardoise' . ($m['photo'] !== '' ? ' ardoise-photo' : '') . '" id="' . $fid . '">';
            $o .= '<div class="ardoise-cadre">';
            $o .= '<h4 class="ardoise-nom"><span>' . fd_e($m['nom']) . '</span> <data class="ardoise-prix" value="' . fd_prix_valeur($m['prix']) . '">'
                . fd_prix_texte($m['prix']) . '</data></h4>';
            if ($m['condition'] !== '') {
                $o .= '<p class="ardoise-condition">' . fd_icone('horloge') . '<span>' . fd_e($m['condition']) . '</span></p>';
            }
            if ($m['photo'] !== '' && isset($photos[$m['photo']])) {
                $ph = $photos[$m['photo']];
                $o .= '<img class="ardoise-img" src="assets/img/' . $ph['petite'] . '" srcset="assets/img/' . $ph['petite'] . ' ' . $ph['lp']
                    . 'w, assets/img/' . $ph['grande'] . ' ' . $ph['lg'] . 'w" sizes="(min-width: 1100px) 380px, 92vw" width="' . $ph['largeur']
                    . '" height="' . $ph['hauteur'] . '" loading="lazy" decoding="async" alt="' . fd_e($m['photo_alt']) . '">';
            }
            if ($m['texte'] !== '') {
                $o .= '<p class="ardoise-texte">' . fd_e($m['texte']) . '</p>';
            }
            foreach ($m['services'] as $s) {
                $classe = 'service-choix' . ($s['type'] === 'ensemble' ? ' service-et' : ($s['type'] === 'choix' ? ' service-ou' : ''));
                $o .= '<div class="service"><p class="service-titre">' . fd_e($s['titre'])
                    . ($s['type'] === 'choix' ? ' <span class="au-choix">au choix</span>' : '') . '</p>'
                    . '<ul class="' . $classe . '" role="list">';
                foreach ($s['choix'] as $c) {
                    $o .= '<li>' . fd_e($c) . '</li>';
                }
                $o .= '</ul></div>';
            }
            $o .= '</div></li>';
            $sortie[] = $o;
        }
        $sortie[] = '</ul></div>';
    }
    return implode("\n", $sortie);
}

/** @return array{html: string, plats: int, boissons: int, formules: int} */
function fd_generer_page(array $d): array
{
    $photos = fd_photos();
    $plats = 0;
    $boissons = 0;
    foreach ($d['quartiers'] as $q) {
        foreach (fd_sections_visibles($q) as $s) {
            if ($q['boissons']) {
                $boissons += fd_nb_plats($s);
            } else {
                $plats += fd_nb_plats($s);
            }
        }
    }
    $formules = 0;
    foreach ($d['formules'] as $g) {
        $formules += count($g['menus']);
    }
    $modele = file_get_contents(FD_MODELE);
    if ($modele === false) {
        throw new RuntimeException('Gabarit admin/modele.html introuvable.');
    }
    $modele = (string) preg_replace('/^<!--.*?-->\s*/s', '', $modele, 1);
    $html = strtr($modele, [
        '{{FORMULES}}' => fd_rendre_formules($d, $photos),
        '{{RUBRIQUES}}' => fd_rendre_rubriques($d),
        '{{CARTE}}' => fd_rendre_carte($d, $photos),
        '{{N_CUISINE}}' => (string) $plats,
        '{{N_BAR}}' => (string) $boissons,
    ]);
    return ['html' => $html, 'plats' => $plats, 'boissons' => $boissons, 'formules' => $formules];
}

/* ---------- Publication et sauvegardes ---------- */

function fd_lire_carte(): array
{
    $d = fd_lire_json(FD_CARTE);
    if (!is_array($d)) {
        throw new RuntimeException('Le fichier donnees/carte.json est introuvable ou illisible.');
    }
    return $d;
}

/**
 * Enregistre la carte (après sauvegarde de la version précédente) et régénère index.html.
 * @return array{plats: int, boissons: int, formules: int}
 */
function fd_publier(array $propre, bool $sauvegarder = true): array
{
    if (!is_dir(FD_DONNEES)) {
        mkdir(FD_DONNEES, 0775, true);
    }
    $verrou = fopen(FD_VERROU, 'c');
    if ($verrou === false || !flock($verrou, LOCK_EX)) {
        throw new RuntimeException('Une autre publication est en cours, réessayez dans un instant.');
    }
    try {
        $page = fd_generer_page($propre);
        if ($sauvegarder && is_file(FD_CARTE)) {
            if (!is_dir(FD_SAUVEGARDES)) {
                mkdir(FD_SAUVEGARDES, 0775, true);
            }
            $nom = 'carte-' . date('Ymd-His');
            $cible = FD_SAUVEGARDES . "/$nom.json";
            for ($i = 2; is_file($cible); $i++) {
                $cible = FD_SAUVEGARDES . "/$nom-$i.json";
            }
            if (!copy(FD_CARTE, $cible)) {
                throw new RuntimeException('Impossible de créer la sauvegarde dans donnees/sauvegardes.');
            }
            $toutes = fd_sauvegardes();
            foreach (array_slice($toutes, FD_NB_SAUVEGARDES) as $vieille) {
                @unlink(FD_SAUVEGARDES . '/' . $vieille['nom']);
            }
        }
        fd_ecrire_json(FD_CARTE, $propre);
        fd_ecrire_atomique(FD_PAGE, $page['html']);
        return ['plats' => $page['plats'], 'boissons' => $page['boissons'], 'formules' => $page['formules']];
    } finally {
        flock($verrou, LOCK_UN);
        fclose($verrou);
    }
}

/** @return array<int, array{nom: string, date: string, taille: int}> du plus récent au plus ancien */
function fd_sauvegardes(): array
{
    $liste = [];
    foreach (glob(FD_SAUVEGARDES . '/carte-*.json') ?: [] as $f) {
        $nom = basename($f);
        if (!preg_match('/^carte-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})(?:-\d+)?\.json$/', $nom, $m)) {
            continue;
        }
        $liste[] = ['nom' => $nom, 'date' => "$m[1]-$m[2]-$m[3]T$m[4]:$m[5]:$m[6]", 'taille' => (int) filesize($f)];
    }
    usort($liste, fn($a, $b) => strcmp($b['nom'], $a['nom']));
    return $liste;
}

/* ---------- Session, mot de passe, protections ---------- */

function fd_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') === '443');
}

function fd_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $chemin = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/admin/index.php')), '/') . '/';
    session_name('fleurdor_admin');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_set_cookie_params([
        'lifetime' => 0, 'path' => $chemin, 'secure' => fd_https(), 'httponly' => true, 'samesite' => 'Strict',
    ]);
    session_start();
    // Déconnexion automatique après 4 heures sans activité
    if (!empty($_SESSION['connecte']) && time() - (int) ($_SESSION['vu'] ?? 0) > 4 * 3600) {
        $_SESSION = [];
        session_regenerate_id(true);
    }
    if (!empty($_SESSION['connecte'])) {
        $_SESSION['vu'] = time();
    }
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
}

function fd_csrf(): string
{
    return (string) $_SESSION['csrf'];
}

function fd_csrf_valide(?string $jeton): bool
{
    return is_string($jeton) && $jeton !== '' && hash_equals(fd_csrf(), $jeton);
}

function fd_connecte(): bool
{
    return !empty($_SESSION['connecte']);
}

function fd_est_local(): bool
{
    return in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true);
}

function fd_mot_de_passe_defini(): bool
{
    $a = fd_lire_json(FD_ADMIN, []);
    return is_array($a) && !empty($a['hash']);
}

function fd_definir_mot_de_passe(string $mdp): void
{
    fd_ecrire_json(FD_ADMIN, ['hash' => password_hash($mdp, PASSWORD_DEFAULT), 'modifie' => date('c')]);
}

function fd_verifier_mot_de_passe(string $mdp): bool
{
    $a = fd_lire_json(FD_ADMIN, []);
    return is_array($a) && !empty($a['hash']) && password_verify($mdp, (string) $a['hash']);
}

function fd_mot_de_passe_acceptable(string $mdp): ?string
{
    if (fd_longueur($mdp) < 10) {
        return 'Le mot de passe doit faire au moins 10 caractères.';
    }
    if (fd_longueur($mdp) > 200) {
        return 'Le mot de passe est trop long.';
    }
    return null;
}

/** Limite les essais : 5 échecs par adresse en 15 minutes. Retourne les minutes d'attente, ou 0. */
function fd_attente_connexion(): int
{
    $t = fd_lire_json(FD_TENTATIVES, []);
    $ip = $_SERVER['REMOTE_ADDR'] ?? '?';
    $recents = array_filter((array) ($t[$ip] ?? []), fn($x) => is_int($x) && $x > time() - 900);
    if (count($recents) < 5) {
        return 0;
    }
    return max(1, (int) ceil((min($recents) + 900 - time()) / 60));
}

function fd_noter_echec(): void
{
    $t = fd_lire_json(FD_TENTATIVES, []);
    $t = is_array($t) ? $t : [];
    $ip = $_SERVER['REMOTE_ADDR'] ?? '?';
    foreach ($t as $k => $liste) {
        $t[$k] = array_values(array_filter((array) $liste, fn($x) => is_int($x) && $x > time() - 900));
        if (!$t[$k]) {
            unset($t[$k]);
        }
    }
    $t[$ip][] = time();
    fd_ecrire_json(FD_TENTATIVES, $t);
}

function fd_effacer_echecs(): void
{
    $t = fd_lire_json(FD_TENTATIVES, []);
    if (is_array($t) && isset($t[$_SERVER['REMOTE_ADDR'] ?? '?'])) {
        unset($t[$_SERVER['REMOTE_ADDR'] ?? '?']);
        fd_ecrire_json(FD_TENTATIVES, $t);
    }
}

function fd_entetes_securite(string $type = 'text/html; charset=utf-8'): void
{
    header('Content-Type: ' . $type);
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: same-origin');
    header('X-Robots-Tag: noindex, nofollow');
    header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
}
