<?php
/*
 * La Fleur d'Or : affiche « Scannez pour accéder au menu » avec un QR code vers la carte du site.
 *   admin/affiche-qr.php                  affiche A4
 *   admin/affiche-qr.php?format=chevalets 4 cartes de table A6 sur une feuille A4 (à découper)
 *   admin/affiche-qr.php?format=etiquette  une seule étiquette carte de visite, page de 85 × 55 mm
 *   admin/affiche-qr.php?format=etiquettes 10 étiquettes format carte de visite (85 × 55 mm) sur A4, à coller au bord des tables
 *   &adresse=https://…                    adresse du site (par défaut : celle de ce serveur)
 * Le QR code est calculé dans la page (admin/vendor/qrcode.js), sans service extérieur.
 */
declare(strict_types=1);
require __DIR__ . '/lib.php';

fd_session();
if (!fd_connecte()) {
    header('Location: ./', true, 303);
    exit;
}
fd_entetes_securite();

$format = in_array($_GET['format'] ?? '', ['chevalets', 'etiquettes', 'etiquette'], true) ? $_GET['format'] : 'affiche';

// Adresse du site : celle saisie, sinon la racine du site sur ce serveur
$https = ($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off';
$racine = ($https ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost')
    . rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/admin/affiche-qr.php')), '/') . '/';
$adresse = trim((string) ($_GET['adresse'] ?? ''));
if (!preg_match('~^https?://[^\s<>"]+$~i', $adresse)) {
    $adresse = $racine;
}
$lien = rtrim(preg_replace('~#.*$~', '', $adresse), '/') . '/#formules';
$visible = preg_replace('~^https?://(www\.)?~i', '', rtrim(preg_replace('~#.*$~', '', $adresse), '/'));

function qr_affiche(string $lien, string $visible, string $classe): string
{
    return '<article class="q-affiche ' . $classe . '">'
        . '<header class="q-tete">'
        . '<p class="q-enseigne" lang="zh-Hant" aria-label="金花餐廳"><span>金</span><span>花</span><span>餐</span><span>廳</span></p>'
        . '<p class="q-nom">La Fleur d’<span>Or</span></p>'
        . '<p class="q-accroche">Cuisine asiatique · Bar à sushis</p>'
        . '</header>'
        . '<div class="q-corps">'
        . '<h1 class="q-titre">Scannez<br>pour accéder<br>au menu</h1>'
        . '<div class="q-cadre"><div class="q-code" data-qr="' . fd_e($lien) . '" role="img" aria-label="QR code vers la carte : ' . fd_e($visible) . '"></div></div>'
        . '<p class="q-aide">Visez le code avec l’appareil photo de votre téléphone</p>'
        . '<p class="q-adresse">' . fd_e($visible) . '</p>'
        . '</div>'
        . '<footer class="q-pied">Sur place ou à emporter · <b>05 61 82 43 56</b></footer>'
        . '</article>';
}

/** Petite étiquette horizontale, format carte de visite : le code à gauche, le texte à droite. */
function qr_etiquette(string $lien, string $visible): string
{
    return '<article class="q-etiquette">'
        . '<div class="q-cadre"><div class="q-code" data-qr="' . fd_e($lien) . '" role="img" aria-label="QR code vers la carte : ' . fd_e($visible) . '"></div></div>'
        . '<div class="q-etiquette-texte">'
        . '<p class="q-enseigne" lang="zh-Hant" aria-label="金花餐廳"><span>金</span><span>花</span><span>餐</span><span>廳</span></p>'
        . '<p class="q-nom">La Fleur d’<span>Or</span></p>'
        . '<p class="q-titre">Scannez pour accéder au menu</p>'
        . '<p class="q-pied"><b>05 61 82 43 56</b></p>'
        . '</div></article>';
}

$lienFormat = fn(string $f) => 'affiche-qr.php?' . http_build_query(array_filter([
    'format' => $f !== 'affiche' ? $f : null,
    'adresse' => $adresse !== $racine ? $adresse : null,
]), '', '&amp;');
?>
<!DOCTYPE html>
<html lang="fr" class="q-<?= $format === 'etiquette' ? 'une' : $format ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Affiche QR code · La Fleur d’Or</title>
<link rel="stylesheet" href="carte-a3.css">
<link rel="stylesheet" href="affiche-qr.css">
<script src="vendor/qrcode.js" defer></script>
<script src="affiche-qr.js" defer></script>
</head>
<body>
<div class="c-outils">
  <p><b>Affiche « Scannez pour accéder au menu »</b> · le QR code ouvre les formules et la carte du site. Imprimez en <b>A4 portrait</b>, taille réelle, avec les <b>graphiques d’arrière-plan</b>.</p>
  <form class="q-form" method="get" action="affiche-qr.php">
    <?php if ($format !== 'affiche'): ?><input type="hidden" name="format" value="<?= $format ?>"><?php endif; ?>
    <label for="adresse">Adresse du site</label>
    <input id="adresse" name="adresse" type="url" value="<?= fd_e($adresse) ?>" required>
    <button type="submit">Mettre à jour le QR code</button>
  </form>
  <p class="c-outils-actions">
    <a href="<?= $lienFormat('affiche') ?>"<?= $format === 'affiche' ? ' aria-current="true"' : '' ?>>Affiche A4</a>
    <a href="<?= $lienFormat('chevalets') ?>"<?= $format === 'chevalets' ? ' aria-current="true"' : '' ?>>4 cartes de table A6</a>
    <a href="<?= $lienFormat('etiquette') ?>"<?= $format === 'etiquette' ? ' aria-current="true"' : '' ?>>1 étiquette carte de visite</a>
    <a href="<?= $lienFormat('etiquettes') ?>"<?= $format === 'etiquettes' ? ' aria-current="true"' : '' ?>>10 étiquettes carte de visite</a>
    <button type="button" data-imprimer>Imprimer ou enregistrer en PDF</button>
  </p>
  <p class="c-outils-etat">Le code mène à : <b><?= fd_e($lien) ?></b> · testez-le avec votre téléphone avant d’imprimer.</p>
</div>
<div class="q-apercu">
  <section class="q-feuille">
    <?php if ($format === 'affiche'): ?>
      <?= qr_affiche($lien, $visible, 'q-a4') ?>
    <?php elseif ($format === 'etiquette'): ?>
      <?= qr_etiquette($lien, $visible) ?>
    <?php elseif ($format === 'etiquettes'): ?>
      <?php for ($i = 0; $i < 10; $i++): ?><?= qr_etiquette($lien, $visible) ?><?php endfor; ?>
    <?php else: ?>
      <?php for ($i = 0; $i < 4; $i++): ?><?= qr_affiche($lien, $visible, 'q-a6') ?><?php endfor; ?>
    <?php endif; ?>
  </section>
</div>
</body>
</html>
