<?php
/*
 * La Fleur d'Or : morceaux de la carte A3 à imprimer (carte-a3.php).
 * Chaque plat, catégorie ou formule devient un bloc que la mise en page répartit ensuite.
 */
declare(strict_types=1);

/** Icône piment à placer une fois dans la page (les plats y renvoient). */
function a3_sprite(): string
{
    return '<svg class="c-sprite" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><symbol id="i-piment" viewBox="0 0 24 24"><path d="M15.6 7.4c2.9 1.4 3.1 5.3-.3 8.9-3 3.2-7.8 4.7-11.1 4.3 3.4-1.7 6.3-5.1 7.2-9 .7-2.9 2.2-4.8 4.2-4.2Z" fill="currentColor"/><path d="M15.4 7.6c.1-2.1 1.2-3.6 3.3-4.1M13.3 8.3c1.1-1.4 3-1.7 4.5-.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol></svg>';
}

function a3_prix(?float $p): string
{
    return $p === null ? '' : fd_prix_texte($p);
}

function a3_piment(): string
{
    return ' <svg class="c-piment" aria-label="pimenté" role="img"><use href="#i-piment"></use></svg>';
}

function a3_plat(array $p): string
{
    $nom = '<span class="c-nom">' . fd_e($p['nom']) . ($p['piment'] ? a3_piment() : '')
        . ($p['desc'] !== '' ? ' <span class="c-desc">' . fd_e($p['desc']) . '</span>' : '') . '</span>';
    if ($p['formats']) {
        $cellules = '';
        foreach ($p['formats'] as $f) {
            $cellules .= '<span class="c-format">' . ($f['libelle'] !== '' ? '<small>' . fd_e($f['libelle']) . '</small> ' : '')
                . ($f['prix'] === null ? '–' : '<b>' . a3_prix($f['prix']) . '</b>') . '</span>';
        }
        return '<li class="c-plat c-plat-formats">' . $nom . '<span class="c-formats">' . $cellules . '</span></li>';
    }
    return '<li class="c-plat">' . $nom . '<b class="c-prix">' . a3_prix($p['prix']) . '</b></li>';
}

function a3_titre(array $s, bool $suite): string
{
    $o = '<h3 class="c-etal-titre' . ($suite ? ' c-suite' : '') . '">' . fd_e($s['titre']) . ($s['piment'] ? a3_piment() : '');
    if ($suite) {
        $o .= ' <span class="c-etal-note">(suite)</span>';
    } elseif ($s['note'] !== '') {
        $o .= ' <span class="c-etal-note">' . fd_e($s['note']) . '</span>';
    }
    return $o . '</h3>';
}

function a3_groupe(array $g, array $plats, bool $repris = false): string
{
    $o = '<div class="c-groupe">';
    if ($g['titre'] !== '') {
        // Morceau repris : le sous-titre ne s'affiche que s'il ouvre un volet
        $o .= '<h4 class="c-groupe-titre' . ($repris ? ' c-repris' : '') . '">' . fd_e($g['titre']) . '</h4>';
    }
    if (!$repris && $g['note'] !== '') {
        $o .= '<p class="c-groupe-note">' . fd_e($g['note']) . '</p>';
    }
    $o .= '<ul class="c-plats">';
    foreach ($plats as $p) {
        $o .= a3_plat($p);
    }
    return $o . '</ul></div>';
}

/** Coupe une longue liste en morceaux d'au moins 3 plats, pour mieux remplir les volets. */
function a3_morceaux(array $plats): array
{
    $n = count($plats);
    $k = intdiv($n, 3);
    if ($n <= 5 || $k < 2) {
        return [$plats];
    }
    $morceaux = [];
    $debut = 0;
    for ($i = 0; $i < $k; $i++) {
        $taille = intdiv($n, $k) + ($i < $n % $k ? 1 : 0);
        $morceaux[] = array_slice($plats, $debut, $taille);
        $debut += $taille;
    }
    return $morceaux;
}

/**
 * Une catégorie donne un bloc par groupe, et les longues listes se coupent en morceaux :
 * elle peut ainsi continuer sur le volet suivant. Le premier bloc porte le titre ;
 * les suivants affichent « (suite) » s'ils ouvrent un volet.
 */
function a3_section(array $s, string $avant = '', string $apres = ''): string
{
    $groupes = array_values(array_filter($s['groupes'], fn($g) => (bool) $g['plats']));
    $o = '';
    foreach ($groupes as $i => $g) {
        $morceaux = a3_morceaux($g['plats']);
        foreach ($morceaux as $j => $plats) {
            $fin = ($i === count($groupes) - 1 && $j === count($morceaux) - 1) ? $apres : '';
            if ($i === 0 && $j === 0) {
                $o .= '<div class="c-bloc">' . $avant . a3_titre($s, false) . a3_groupe($g, $plats) . $fin . '</div>';
            } elseif ($j === 0) {
                $o .= '<div class="c-bloc c-bloc-suite">' . a3_titre($s, true) . a3_groupe($g, $plats) . $fin . '</div>';
            } else {
                $o .= '<div class="c-bloc c-bloc-suite c-bloc-coupe">' . a3_titre($s, true) . a3_groupe($g, $plats, true) . $fin . '</div>';
            }
        }
    }
    return $o;
}

/**
 * Blocs de la carte : le titre d'une partie reste collé à sa première catégorie.
 * Horaires et adresse sont sur la couverture ; la légende termine la carte.
 */
function a3_blocs(array $d): string
{
    $quartiers = array_values(array_filter($d['quartiers'], fn($q) => (bool) fd_sections_visibles($q)));
    $o = '';
    foreach ($quartiers as $n => $q) {
        $sections = fd_sections_visibles($q);
        foreach ($sections as $i => $s) {
            $avant = $i === 0 ? '<h2 class="c-partie">' . fd_e($q['titre']) . '</h2>' : '';
            $apres = '';
            if ($i === count($sections) - 1) {
                if ($q['boissons']) {
                    $apres .= '<p class="c-alcool">L’abus d’alcool est dangereux pour la santé, à consommer avec modération.</p>';
                }
                if ($n === count($quartiers) - 1) {
                    $apres .= '<p class="c-legende">' . trim(a3_piment()) . ' pimenté · espèces, cartes bancaires, titres-restaurant.</p>';
                }
            }
            $o .= a3_section($s, $avant, $apres);
        }
    }
    return $o;
}

/** Une formule = un bloc ; le titre de son groupe reste collé à la première. */
function a3_formules(array $d): string
{
    $o = '';
    foreach ($d['formules'] as $g) {
        $menus = array_values(array_filter($g['menus'], fn($m) => $m['imprimer'] !== false));
        foreach ($menus as $i => $m) {
            $o .= '<div class="c-bloc c-bloc-formule">';
            if ($i === 0) {
                $o .= '<h3 class="c-fgroupe-titre">Formules · ' . fd_e($g['titre']) . '</h3>';
            }
            $o .= '<div class="c-formule"><p class="c-formule-tete"><span>' . fd_e($m['nom']) . '</span><b>' . a3_prix($m['prix']) . '</b></p>';
            if ($m['condition'] !== '') {
                $o .= '<p class="c-formule-condition">' . fd_e($m['condition']) . '</p>';
            }
            foreach ($m['services'] as $s) {
                $sep = $s['type'] === 'ensemble' ? ' + ' : ($s['type'] === 'choix' ? ' · ' : ', ');
                $o .= '<p class="c-service"><b>' . fd_e($s['titre']) . ($s['type'] === 'choix' ? ' au choix' : '') . '</b> '
                    . implode($sep, array_map('fd_e', $s['choix'])) . '</p>';
            }
            $o .= '</div></div>';
        }
    }
    return $o;
}
