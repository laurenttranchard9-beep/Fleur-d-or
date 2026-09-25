<?php
/*
 * La Fleur d'Or : carte A3 à imprimer (pli roulé, 3 volets, recto-verso).
 * Générée depuis donnees/carte.json : toujours à jour avec le site.
 * Les formules dont « Imprimer sur la carte A3 » est décoché (la fondue) n'y figurent pas.
 *   Navigateur : admin/carte-a3.php            (format A3, pour une imprimante de bureau)
 *                admin/carte-a3.php?format=imprimeur   (fonds perdus de 3 mm, pour un imprimeur)
 *   Teinte du papier : crème par défaut, ou &teinte=gris pour un fond gris clair.
 */
declare(strict_types=1);
require __DIR__ . '/lib.php';

fd_session();
if (!fd_connecte()) {
    header('Location: ./', true, 303);
    exit;
}
fd_entetes_securite();

$format = ($_GET['format'] ?? '') === 'imprimeur' ? 'imprimeur' : 'a3';
$teinte = ($_GET['teinte'] ?? '') === 'gris' ? 'gris' : 'creme';
[$d] = fd_valider(fd_lire_carte());

/** Lien vers la carte dans un format et une teinte donnés. */
function a3_lien(string $format, string $teinte): string
{
    $q = array_filter(['format' => $format === 'imprimeur' ? 'imprimeur' : null, 'teinte' => $teinte === 'gris' ? 'gris' : null]);
    return 'carte-a3.php' . ($q ? '?' . http_build_query($q, '', '&amp;') : '');
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

$sprite = '<svg class="c-sprite" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><symbol id="i-piment" viewBox="0 0 24 24"><path d="M15.6 7.4c2.9 1.4 3.1 5.3-.3 8.9-3 3.2-7.8 4.7-11.1 4.3 3.4-1.7 6.3-5.1 7.2-9 .7-2.9 2.2-4.8 4.2-4.2Z" fill="currentColor"/><path d="M15.4 7.6c.1-2.1 1.2-3.6 3.3-4.1M13.3 8.3c1.1-1.4 3-1.7 4.5-.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol></svg>';
?>
<!DOCTYPE html>
<html lang="fr" class="<?= $format ?> teinte-<?= $teinte ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Carte A3 · La Fleur d’Or</title>
<link rel="stylesheet" href="carte-a3.css">
<script src="carte-a3.js" defer></script>
</head>
<body>
<?= $sprite ?>
<div class="c-outils">
  <p><b>Carte A3, pli roulé en 3 volets</b> · recto : couverture et formules · verso : l’intérieur. Imprimez en <b>A3 paysage, recto-verso (bord court)</b>, sans marges, avec les <b>graphiques d’arrière-plan</b>.</p>
  <p class="c-outils-actions">
    <a href="<?= a3_lien('a3', $teinte) ?>"<?= $format === 'a3' ? ' aria-current="true"' : '' ?>>Format A3 (bureau)</a>
    <a href="<?= a3_lien('imprimeur', $teinte) ?>"<?= $format === 'imprimeur' ? ' aria-current="true"' : '' ?>>Format imprimeur (fonds perdus 3 mm)</a>
  </p>
  <p class="c-outils-actions">
    <a href="<?= a3_lien($format, 'creme') ?>"<?= $teinte === 'creme' ? ' aria-current="true"' : '' ?>>Fond crème</a>
    <a href="<?= a3_lien($format, 'gris') ?>"<?= $teinte === 'gris' ? ' aria-current="true"' : '' ?>>Fond gris clair</a>
  </p>
  <p class="c-outils-actions">
    <button type="button" data-imprimer>Imprimer ou enregistrer en PDF</button>
  </p>
  <p class="c-outils-etat" data-etat>Mise en page…</p>
</div>
<div class="c-apercu" data-apercu>
  <section class="c-feuille c-recto" aria-label="Recto : extérieur de la carte">
    <div class="c-volet c-v1"><div class="c-flux" data-flux="4" data-sans-coupe></div></div>
    <div class="c-volet c-v2"><div class="c-flux" data-flux="5" data-sans-coupe></div></div>
    <div class="c-volet c-v3 c-couv">
      <div class="c-marque">
        <p class="c-enseigne" lang="zh-Hant" aria-label="金花餐廳"><span>金</span><span>花</span><span>餐</span><span>廳</span></p>
        <h1 class="c-nom-resto">La Fleur d’<span>Or</span></h1>
        <p class="c-accroche">Cuisine asiatique · Bar à sushis</p>
        <p class="c-contact">Sur place ou à emporter · <b>05 61 82 43 56</b></p>
        <p class="c-horaires"><b>Du mardi au samedi</b> 12h – 14h et 18h – 22h · <b>dimanche</b> 18h – 22h<br>Fermé le dimanche midi et le lundi · 14 bis, av. du Président Kennedy, Grenade</p>
      </div>
      <div class="c-ardoise">
        <h2 class="c-ardoise-titre">Les formules</h2>
        <div class="c-flux c-flux-formules" data-formules></div>
      </div>
    </div>
  </section>
  <section class="c-feuille c-verso" aria-label="Verso : intérieur de la carte">
    <div class="c-volet c-v4"><div class="c-flux" data-flux="1"></div></div>
    <div class="c-volet c-v5"><div class="c-flux" data-flux="2"></div></div>
    <div class="c-volet c-v6"><div class="c-flux" data-flux="3"></div></div>
  </section>
</div>
<div class="c-reserve" data-reserve-formules><?= a3_formules($d) ?></div>
<div class="c-reserve" data-reserve><?= a3_blocs($d) ?></div>
</body>
</html>
