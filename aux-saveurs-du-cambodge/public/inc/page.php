<?php
// Début de chaque page qui affiche des prix : les jetons {{prix:id}} sont remplacés juste avant l'envoi.

if (realpath((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) {
    http_response_code(404);
    exit;
}
if (!defined('ASDC')) {
    define('ASDC', true);
}
require __DIR__ . '/noyau.php';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');
ob_start('asdc_remplir');
