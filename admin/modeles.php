<?php
/*
 * La Fleur d'Or : trois autres modèles de carte à imprimer, générés depuis donnees/carte.json.
 *   admin/modeles.php?modele=livret   Livret A4 de 8 pages (2 feuilles A3 pliées, ou 4 feuilles A4 recto-verso)
 *   admin/modeles.php?modele=cartes   4 cartes A4 recto-verso : formules, cuisine chinoise et thaïlandaise (sur 3 faces), sushis, desserts + bar
 *   admin/modeles.php?modele=grand    2 grandes cartes A3 paysage recto-verso, sans pli
 * Même palette que le site ; la taille du texte est la plus grande possible (plafonnée).
 */
declare(strict_types=1);
require __DIR__ . '/lib.php';
require __DIR__ . '/impression.php';

fd_session();
if (!fd_connecte()) {
    header('Location: ./', true, 303);
    exit;
}
fd_entetes_securite();

const M_MODELES = [
    'livret' => ['Livret A4, 8 pages', 'Imprimez en A4 portrait recto-verso (bord long), puis rangez les feuilles dans un protège-menu ; un imprimeur en fait un livret agrafé.'],
    'cartes' => ['4 cartes A4', 'Imprimez en A4 portrait recto-verso (bord long) : formules ; cuisine chinoise et thaïlandaise ; sa suite et les sushis ; desserts et bar. Une carte par feuille, à plastifier.'],
    'grand' => ['Grand format A3', 'Imprimez en A3 paysage recto-verso (bord long) : deux grandes cartes sans pli, à plastifier.'],
];
$modele = array_key_exists($_GET['modele'] ?? '', M_MODELES) ? $_GET['modele'] : 'livret';
[$d] = fd_valider(fd_lire_carte());

const M_TEL = '05 61 82 43 56';
const M_HORAIRES = '<b>Du mardi au samedi</b> 12h – 14h et 18h – 22h · <b>dimanche</b> 18h – 22h';
const M_FERME = 'Fermé le dimanche midi et le lundi';
const M_ADRESSE = '14 bis, avenue du Président Kennedy, 31330 Grenade';

function m_enseigne(string $classe = ''): string
{
    return '<p class="c-enseigne ' . $classe . '" lang="zh-Hant" aria-label="金花餐廳"><span>金</span><span>花</span><span>餐</span><span>廳</span></p>';
}

function m_nom(string $classe): string
{
    return '<h1 class="' . $classe . '">La Fleur d’<span>Or</span></h1>';
}

/** Une colonne de flux : $flux = nom du flux, $n = son rang ; $sansCoupe si on y arrive en tournant la page. */
function m_col(string $flux, int $n, bool $sansCoupe = false, string $classe = ''): string
{
    $formules = str_starts_with($flux, 'formules') ? ' c-flux-formules' : '';
    return '<div class="c-flux' . $formules . ($classe ? " $classe" : '') . '" data-flux="' . $flux . ':' . $n . '"'
        . ($sansCoupe ? ' data-sans-coupe' : '') . '></div>';
}

function m_pied(string $page = ''): string
{
    return '<footer class="m-pied"><span>La Fleur d’Or · <b>' . M_TEL . '</b> · sur place ou à emporter</span>'
        . ($page !== '' ? '<span class="m-folio">' . $page . '</span>' : '') . '</footer>';
}

/* ---------- Modèle 1 : livret A4 de 8 pages ---------- */
function m_livret(): string
{
    $o = '<section class="m-page m-a4 m-livret-couv" aria-label="Page 1 : couverture"><div class="m-cadre">'
        . m_enseigne('m-enseigne-grande') . m_nom('m-nom-geant')
        . '<p class="m-accroche">Cuisine asiatique · Bar à sushis</p>'
        . '<p class="m-couv-tel">' . M_TEL . '</p>'
        . '<p class="m-couv-infos">Sur place ou à emporter<br>' . M_HORAIRES . '<br>' . M_FERME . '<br>' . M_ADRESSE . '</p>'
        . '</div></section>';
    foreach ([2, 3] as $i => $page) {
        $o .= '<section class="m-page m-a4 m-livret-page" aria-label="Page ' . $page . ' : formules">'
            . '<header class="m-entete"><h2>Les formules</h2>' . ($i ? '<span>(suite)</span>' : '<span>midi et soir, sur place ou à emporter</span>') . '</header>'
            . '<div class="m-corps">' . m_col('formules', $i + 1) . '</div>' . m_pied((string) $page) . '</section>';
    }
    $n = 1;
    foreach ([4, 5, 6, 7, 8] as $page) {
        // Pages 6 et 8 : on y arrive en tournant la feuille, une catégorie n'y est pas coupée
        $tourne = in_array($page, [6, 8], true);
        $o .= '<section class="m-page m-a4 m-livret-page" aria-label="Page ' . $page . ' : la carte">'
            . '<div class="m-corps m-deux-col">' . m_col('carte', $n++, $tourne) . m_col('carte', $n++) . '</div>'
            . m_pied((string) $page) . '</section>';
    }
    return $o;
}

/* ---------- Modèle 2 : 4 cartes A4 recto-verso ---------- */
function m_cartes(): string
{
    // [flux, premières colonnes, titre, sous-titre, recto ?] ; chaque face a son bandeau
    $faces = [
        ['formules-chine', 1, 'Les formules', 'Cuisine chinoise et thaïlandaise · midi et soir, sur place ou à emporter', true],
        ['formules-japon', 1, 'Les formules', 'Bar à sushis · midi et soir, sur place ou à emporter', false],
        ['cuisine', 1, 'Cuisine chinoise et thaïlandaise', 'Plats cuisinés à la commande', true],
        ['cuisine', 3, 'Cuisine chinoise et thaïlandaise', '', false],
        ['cuisine', 5, 'Cuisine chinoise et thaïlandaise', 'Suite de la carte : plats, riz et nouilles', true],
        ['sushi', 1, 'Bar à sushis', 'Sushis, makis, california, sashimis, chirashis', false],
        ['fin', 1, 'Desserts · Le bar', 'Desserts, glaces, apéritifs, cocktails, boissons et vins', true],
        ['fin', 3, 'Desserts · Le bar', '', false],
    ];
    $o = '';
    foreach ($faces as [$flux, $n, $titre, $sous, $recto]) {
        $o .= '<section class="m-page m-a4 m-carte-face" aria-label="' . fd_e($titre) . ($recto ? ' : recto' : ' : verso') . '">';
        if ($recto) {
            $o .= '<header class="m-bandeau">' . m_enseigne() . '<div><p class="m-bandeau-nom">La Fleur d’<span>Or</span></p>'
                . '<h2>' . fd_e($titre) . '</h2><p class="m-bandeau-sous">' . fd_e($sous) . '</p></div></header>';
        } else {
            $o .= '<header class="m-bandeau m-bandeau-mince"><h2>' . fd_e($titre) . '</h2><p class="m-bandeau-sous">'
                . ($sous !== '' ? fd_e($sous) : M_HORAIRES . ' · ' . M_FERME) . '</p></header>';
        }
        $o .= '<div class="m-corps m-deux-col">' . m_col($flux, $n, $n > 1) . m_col($flux, $n + 1) . '</div>'
            . m_pied() . '</section>';
    }
    return $o;
}

/* ---------- Modèle 3 : 2 grandes cartes A3 paysage ---------- */
function m_grand(): string
{
    $o = '<section class="m-page m-a3 m-grand-face" aria-label="Carte 1 recto : formules">'
        . '<header class="m-grand-tete">' . m_enseigne() . m_nom('m-grand-nom')
        . '<div class="m-grand-infos"><p class="m-accroche">Cuisine asiatique · Bar à sushis</p><p><b class="m-grand-tel">' . M_TEL . '</b> · sur place ou à emporter</p>'
        . '<p>' . M_HORAIRES . ' · ' . M_FERME . '</p><p>' . M_ADRESSE . '</p></div></header>'
        . '<h2 class="m-grand-titre">Les formules</h2>'
        . '<div class="m-corps m-trois-col">' . m_col('formules', 1) . m_col('formules', 2) . m_col('formules', 3) . '</div>'
        . '</section>';
    $faces = ['Carte 1 verso', 'Carte 2 recto', 'Carte 2 verso'];
    $n = 1;
    foreach ($faces as $f) {
        $o .= '<section class="m-page m-a3 m-grand-face" aria-label="' . $f . ' : la carte">'
            . '<header class="m-grand-bande"><p>La Fleur d’<span>Or</span></p><p>' . M_TEL . ' · Cuisine asiatique · Bar à sushis</p></header>'
            . '<div class="m-corps m-trois-col">' . m_col('carte', $n++, true) . m_col('carte', $n++) . m_col('carte', $n++) . '</div>'
            . '</section>';
    }
    return $o;
}

/* ---------- Contenu à répartir ---------- */
if ($modele === 'cartes') {
    // Une face par groupe de formules
    $reserves = '<div class="c-reserve" data-reserve="formules-chine" data-echelle="--ef">' . a3_formules($d, '', ['formules-chine-thai']) . '</div>'
        . '<div class="c-reserve" data-reserve="formules-japon" data-echelle="--ef">' . a3_formules($d, '', ['formules-japon']) . '</div>';
    // Le titre de la partie est dans le bandeau ; la légende « pimenté » va avec la cuisine
    $reserves .= '<div class="c-reserve" data-reserve="cuisine" data-echelle="--e">' . a3_blocs($d, ['cuisine'], true, false) . '</div>'
        . '<div class="c-reserve" data-reserve="sushi" data-echelle="--e">' . a3_blocs($d, ['sushi'], false, false) . '</div>'
        . '<div class="c-reserve" data-reserve="fin" data-echelle="--e">' . a3_blocs($d, ['douceurs', 'bar'], false) . '</div>';
} else {
    $reserves = '<div class="c-reserve" data-reserve="formules" data-echelle="--ef">' . a3_formules($d, '') . '</div>'
        . '<div class="c-reserve" data-reserve="carte" data-echelle="--e">' . a3_blocs($d) . '</div>';
}
$pages = $modele === 'livret' ? m_livret() : ($modele === 'cartes' ? m_cartes() : m_grand());
?>
<!DOCTYPE html>
<html lang="fr" class="m-<?= $modele ?>"<?= $modele === 'grand' ? ' data-max-e="15" data-max-ef="15"' : '' ?>>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title><?= fd_e(M_MODELES[$modele][0]) ?> · La Fleur d’Or</title>
<link rel="stylesheet" href="carte-a3.css">
<link rel="stylesheet" href="modeles.css">
<script src="modeles.js" defer></script>
</head>
<body>
<?= a3_sprite() ?>
<div class="c-outils">
  <p><b><?= fd_e(M_MODELES[$modele][0]) ?></b> · <?= fd_e(M_MODELES[$modele][1]) ?> Sans marges, avec les <b>graphiques d’arrière-plan</b>.</p>
  <p class="c-outils-actions">
    <?php foreach (M_MODELES as $cle => [$nom]): ?>
    <a href="modeles.php?modele=<?= $cle ?>"<?= $cle === $modele ? ' aria-current="true"' : '' ?>><?= fd_e($nom) ?></a>
    <?php endforeach; ?>
    <a href="carte-a3.php">Carte A3 pliée</a>
  </p>
  <p class="c-outils-actions"><button type="button" data-imprimer>Imprimer ou enregistrer en PDF</button></p>
  <p class="c-outils-etat" data-etat>Mise en page…</p>
</div>
<div class="c-apercu m-apercu" data-apercu><?= $pages ?></div>
<?= $reserves ?>
</body>
</html>
