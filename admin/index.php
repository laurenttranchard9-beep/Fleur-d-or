<?php
/* La Fleur d'Or : panneau d'administration (connexion et application). */
declare(strict_types=1);
require __DIR__ . '/lib.php';

fd_session();
fd_entetes_securite();

$message = '';
$erreur = '';
$action = $_POST['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!fd_csrf_valide($_POST['csrf'] ?? null)) {
        $erreur = 'La page a expiré. Rechargez-la et recommencez.';
    } elseif ($action === 'creation') {
        $mdp = (string) ($_POST['mdp'] ?? '');
        if (fd_mot_de_passe_defini()) {
            $erreur = 'Le mot de passe existe déjà.';
        } elseif (!fd_est_local()) {
            $erreur = 'Pour des raisons de sécurité, le mot de passe se crée depuis l’ordinateur qui fait tourner XAMPP (adresse localhost).';
        } elseif ($pb = fd_mot_de_passe_acceptable($mdp)) {
            $erreur = $pb;
        } elseif ($mdp !== (string) ($_POST['mdp2'] ?? '')) {
            $erreur = 'Les deux mots de passe ne sont pas identiques.';
        } else {
            fd_definir_mot_de_passe($mdp);
            session_regenerate_id(true);
            $_SESSION['connecte'] = true;
            $_SESSION['vu'] = time();
            header('Location: ./', true, 303);
            exit;
        }
    } elseif ($action === 'connexion') {
        $attente = fd_attente_connexion();
        if ($attente > 0) {
            $erreur = "Trop d’essais. Réessayez dans $attente min.";
        } elseif (fd_verifier_mot_de_passe((string) ($_POST['mdp'] ?? ''))) {
            fd_effacer_echecs();
            session_regenerate_id(true);
            $_SESSION['connecte'] = true;
            $_SESSION['vu'] = time();
            header('Location: ./', true, 303);
            exit;
        } else {
            fd_noter_echec();
            sleep(1);
            $erreur = 'Mot de passe incorrect.';
        }
    } elseif ($action === 'deconnexion') {
        $_SESSION = [];
        session_regenerate_id(true);
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        $message = 'Vous êtes déconnecté.';
    }
}

$etat = fd_connecte() ? 'app' : (fd_mot_de_passe_defini() ? 'connexion' : 'creation');
$csrf = fd_csrf();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="csrf" content="<?= fd_e($csrf) ?>">
<title>Administration · La Fleur d’Or</title>
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="admin.css">
<?php if ($etat === 'app'): ?>
<script src="admin.js" defer></script>
<?php endif; ?>
</head>
<body class="<?= $etat === 'app' ? 'a-app' : 'a-porte' ?>">
<svg class="a-sprite" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
  <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></symbol>
  <symbol id="i-haut" viewBox="0 0 24 24"><path d="m6 14 6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-bas" viewBox="0 0 24 24"><path d="m6 10 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-corbeille" viewBox="0 0 24 24"><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-copie" viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="11" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 8.5v-3a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
  <symbol id="i-loupe" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="m15 15 5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></symbol>
  <symbol id="i-oeil" viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
  <symbol id="i-coche" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-alerte" viewBox="0 0 24 24"><path d="M12 4 2.8 19.5h18.4L12 4Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v4.5M12 17.2v.3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></symbol>
  <symbol id="i-piment" viewBox="0 0 24 24"><path d="M15.6 7.4c2.9 1.4 3.1 5.3-.3 8.9-3 3.2-7.8 4.7-11.1 4.3 3.4-1.7 6.3-5.1 7.2-9 .7-2.9 2.2-4.8 4.2-4.2Z" fill="currentColor"/><path d="M15.4 7.6c.1-2.1 1.2-3.6 3.3-4.1M13.3 8.3c1.1-1.4 3-1.7 4.5-.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
  <symbol id="i-fleche" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
</svg>

<header class="a-poutre">
  <p class="a-marque"><span class="a-disque" lang="zh-Hant" aria-hidden="true">金</span><span class="a-marque-nom">La Fleur d’Or</span><span class="a-marque-role">Administration</span></p>
  <?php if ($etat === 'app'): ?>
  <nav class="a-poutre-actions" aria-label="Liens">
    <a class="a-lien-site" href="../" target="_blank" rel="noopener"><svg class="a-ico" aria-hidden="true"><use href="#i-oeil"></use></svg><span>Voir le site</span></a>
    <form method="post" action="./" class="a-deconnexion">
      <input type="hidden" name="csrf" value="<?= fd_e($csrf) ?>">
      <input type="hidden" name="action" value="deconnexion">
      <button type="submit" class="a-bouton a-bouton-discret">Se déconnecter</button>
    </form>
  </nav>
  <?php endif; ?>
</header>

<?php if ($etat === 'app'): ?>
<nav class="a-onglets" aria-label="Sections du panneau">
  <button type="button" class="a-onglet" data-onglet="carte" aria-current="page">La carte</button>
  <button type="button" class="a-onglet" data-onglet="formules">Les formules</button>
  <button type="button" class="a-onglet" data-onglet="sauvegardes">Sauvegardes</button>
  <button type="button" class="a-onglet" data-onglet="compte">Mot de passe</button>
</nav>
<main id="a-contenu" class="a-contenu" tabindex="-1">
  <p class="a-chargement">Chargement de la carte…</p>
</main>
<div class="a-publier" data-barre-publier>
  <p class="a-publier-etat" data-etat-publication role="status">Aucune modification.</p>
  <div class="a-publier-actions">
    <button type="button" class="a-bouton a-bouton-discret" data-annuler disabled><span class="a-long">Annuler les modifications</span><span class="a-court">Annuler</span></button>
    <button type="button" class="a-bouton a-bouton-principal" data-publier disabled><span class="a-long">Publier sur le site</span><span class="a-court">Publier</span></button>
  </div>
</div>
<?php else: ?>
<main class="a-porte-contenu">
  <div class="a-ardoise-porte">
    <?php if ($etat === 'creation'): ?>
      <h1 class="a-titre">Créer le mot de passe</h1>
      <?php if (!fd_est_local()): ?>
        <p>Le mot de passe du panneau se crée une seule fois, <strong>depuis l’ordinateur qui fait tourner XAMPP</strong>, à l’adresse <code>http://localhost/…/admin/</code>.</p>
        <p>Une fois créé, vous pourrez vous connecter depuis n’importe quel appareil.</p>
      <?php else: ?>
        <p>Choisissez le mot de passe qui protégera la modification de la carte (10 caractères au moins).</p>
        <form method="post" action="./" class="a-form-porte">
          <input type="hidden" name="csrf" value="<?= fd_e($csrf) ?>">
          <input type="hidden" name="action" value="creation">
          <label class="a-champ"><span>Mot de passe</span><input type="password" name="mdp" autocomplete="new-password" minlength="10" required autofocus></label>
          <label class="a-champ"><span>Le même, une seconde fois</span><input type="password" name="mdp2" autocomplete="new-password" minlength="10" required></label>
          <?php if ($erreur): ?><p class="a-erreur" role="alert"><?= fd_e($erreur) ?></p><?php endif; ?>
          <button type="submit" class="a-bouton a-bouton-principal">Créer et entrer</button>
        </form>
      <?php endif; ?>
    <?php else: ?>
      <h1 class="a-titre">Connexion</h1>
      <?php if ($message): ?><p class="a-info" role="status"><?= fd_e($message) ?></p><?php endif; ?>
      <form method="post" action="./" class="a-form-porte">
        <input type="hidden" name="csrf" value="<?= fd_e($csrf) ?>">
        <input type="hidden" name="action" value="connexion">
        <label class="a-champ"><span>Mot de passe</span><input type="password" name="mdp" autocomplete="current-password" required autofocus></label>
        <?php if ($erreur): ?><p class="a-erreur" role="alert"><?= fd_e($erreur) ?></p><?php endif; ?>
        <button type="submit" class="a-bouton a-bouton-principal">Entrer</button>
      </form>
    <?php endif; ?>
    <p class="a-retour"><a href="../">Retour au site</a></p>
  </div>
</main>
<?php endif; ?>
</body>
</html>
