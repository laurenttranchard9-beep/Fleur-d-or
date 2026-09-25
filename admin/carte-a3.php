<?php
/*
 * La Fleur d'Or : carte A3 à imprimer (pli roulé, 3 volets, recto-verso).
 * Générée depuis donnees/carte.json : toujours à jour avec le site.
 * Les formules dont « Imprimer sur la carte A3 » est décoché (la fondue) n'y figurent pas.
 *   Navigateur : admin/carte-a3.php            (format A3, pour une imprimante de bureau)
 *                admin/carte-a3.php?format=imprimeur   (fonds perdus de 3 mm, pour un imprimeur)
 *   Teinte du papier : crème par défaut, ou &teinte=gris pour un fond gris clair.
 *   Autres modèles, même format et même palette : &modele=livret | ardoise | bistrot (styles dans modeles.css).
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

$format = ($_GET['format'] ?? '') === 'imprimeur' ? 'imprimeur' : 'a3';
$teinte = ($_GET['teinte'] ?? '') === 'gris' ? 'gris' : 'creme';
const A3_MODELES = ['' => 'Carte actuelle', 'livret' => 'Modèle Livret', 'ardoise' => 'Modèle Ardoise', 'bistrot' => 'Modèle Bistrot'];
$modele = array_key_exists($_GET['modele'] ?? '', A3_MODELES) ? (string) $_GET['modele'] : '';
if ($modele !== '') {
    $teinte = 'creme'; // chaque modèle a son papier
}
[$d] = fd_valider(fd_lire_carte());

/** Lien vers la carte dans un format, une teinte et un modèle donnés. */
function a3_lien(string $format, string $teinte, string $modele = ''): string
{
    $q = array_filter([
        'modele' => $modele !== '' ? $modele : null,
        'format' => $format === 'imprimeur' ? 'imprimeur' : null,
        'teinte' => $teinte === 'gris' ? 'gris' : null,
    ]);
    return 'carte-a3.php' . ($q ? '?' . http_build_query($q, '', '&amp;') : '');
}

?>
<!DOCTYPE html>
<html lang="fr" class="<?= $format ?> teinte-<?= $teinte ?><?= $modele !== '' ? " modele-$modele" : '' ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title><?= $modele !== '' ? fd_e(A3_MODELES[$modele]) . ' · ' : '' ?>Carte A3 · La Fleur d’Or</title>
<link rel="stylesheet" href="carte-a3.css">
<?php if ($modele !== ''): ?><link rel="stylesheet" href="modeles.css"><?php endif; ?>
<script src="carte-a3.js" defer></script>
</head>
<body>
<?= a3_sprite() ?>
<div class="c-outils">
  <p><b>Carte A3, pli roulé en 3 volets</b> · recto : couverture et formules · verso : l’intérieur. Imprimez en <b>A3 paysage, recto-verso (bord court)</b>, sans marges, avec les <b>graphiques d’arrière-plan</b>.</p>
  <p class="c-outils-actions">
    <?php foreach (A3_MODELES as $cle => $nom): ?>
    <a href="<?= a3_lien($format, $cle === '' ? $teinte : 'creme', $cle) ?>"<?= $cle === $modele ? ' aria-current="true"' : '' ?>><?= fd_e($nom) ?></a>
    <?php endforeach; ?>
    <a href="affiche-qr.php">Affiche QR code</a>
  </p>
  <p class="c-outils-actions">
    <a href="<?= a3_lien('a3', $teinte, $modele) ?>"<?= $format === 'a3' ? ' aria-current="true"' : '' ?>>Format A3 (bureau)</a>
    <a href="<?= a3_lien('imprimeur', $teinte, $modele) ?>"<?= $format === 'imprimeur' ? ' aria-current="true"' : '' ?>>Format imprimeur (fonds perdus 3 mm)</a>
    <?php if ($modele === ''): ?>
    <a href="<?= a3_lien($format, 'creme') ?>"<?= $teinte === 'creme' ? ' aria-current="true"' : '' ?>>Fond crème</a>
    <a href="<?= a3_lien($format, 'gris') ?>"<?= $teinte === 'gris' ? ' aria-current="true"' : '' ?>>Fond gris clair</a>
    <?php endif; ?>
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
