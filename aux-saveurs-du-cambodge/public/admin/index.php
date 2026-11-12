<?php
// Espace gestion d'Aux Saveurs du Cambodge : statistiques de visite, carte (prix, descriptions, rubriques), réglages.

define('ASDC', true);
require __DIR__ . '/../inc/noyau.php';
require __DIR__ . '/../inc/gestion.php';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
header('Referrer-Policy: same-origin');

asdc_session();

$vues = ['statistiques' => 'Statistiques', 'prix' => 'Carte', 'reglages' => 'Réglages'];
$vue = isset($vues[$_GET['vue'] ?? '']) ? (string) $_GET['vue'] : 'statistiques';
$periodes = asdc_periodes();
$periode = isset($periodes[$_GET['periode'] ?? '']) ? (string) $_GET['periode'] : '30j';
$erreur = '';
$erreurs = [];
$erreursDesc = [];
$erreursTitres = [];
$saisies = [];
$saisiesDesc = [];
$saisiesTitres = [];
$message = (string) ($_SESSION['message'] ?? '');
unset($_SESSION['message']);

function asdc_rediriger(string $vue, string $message = ''): void
{
    if ($message !== '') {
        $_SESSION['message'] = $message;
    }
    header('Location: ./?vue=' . rawurlencode($vue), true, 303);
    exit;
}

/* ---------- Actions ---------- */

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $action = (string) ($_POST['action'] ?? '');
    if (!asdc_jeton_valide()) {
        http_response_code(400);
        $erreur = 'La page avait expiré. Recommencez, elle est à jour maintenant.';
    } elseif ($action === 'installer' && !asdc_mot_de_passe_installe()) {
        $motDePasse = (string) ($_POST['mot_de_passe'] ?? '');
        if (strlen($motDePasse) < 10) {
            $erreur = 'Choisissez un mot de passe d’au moins 10 caractères.';
        } elseif ($motDePasse !== (string) ($_POST['confirmation'] ?? '')) {
            $erreur = 'Les deux mots de passe ne sont pas identiques.';
        } elseif (!asdc_dossier_inscriptible() || !asdc_enregistrer_mot_de_passe($motDePasse)) {
            $erreur = 'Impossible d’écrire dans le dossier « donnees » du site : vérifiez que le serveur peut le modifier.';
        } else {
            asdc_ouvrir_session();
            asdc_rediriger('statistiques', 'Mot de passe créé. Bienvenue dans l’espace gestion.');
        }
    } elseif ($action === 'connexion') {
        if (asdc_bloque()) {
            $erreur = 'Trop d’essais. Réessayez dans 15 minutes.';
        } elseif (password_verify((string) ($_POST['mot_de_passe'] ?? ''), (string) (asdc_config()['mot_de_passe'] ?? ''))) {
            asdc_ouvrir_session();
            asdc_rediriger($vue);
        } else {
            asdc_noter_echec();
            sleep(1);
            $erreur = 'Mot de passe incorrect.';
        }
    } elseif (!asdc_connecte()) {
        $erreur = 'La session a expiré. Reconnectez-vous.';
    } elseif ($action === 'deconnexion') {
        $_SESSION = [];
        session_destroy();
        header('Location: ./', true, 303);
        exit;
    } elseif ($action === 'prix') {
        // La carte : prix, descriptions des plats, noms des rubriques. On ne garde que ce qui diffère de la carte d'origine.
        $vue = 'prix';
        $origine = asdc_prix_origine();
        $avant = asdc_prix();
        $saisies = is_array($_POST['prix'] ?? null) ? $_POST['prix'] : [];
        $saisiesDesc = is_array($_POST['desc'] ?? null) ? $_POST['desc'] : [];
        $saisiesTitres = is_array($_POST['rubrique'] ?? null) ? $_POST['rubrique'] : [];
        $remplacements = asdc_lire(ASDC_DONNEES . '/prix.php');
        foreach ($origine as $id => $centimesOrigine) {
            if (!array_key_exists($id, $saisies)) {
                continue;
            }
            $centimes = asdc_lire_prix($saisies[$id]);
            if ($centimes === null) {
                $erreurs[$id] = 'Écrivez un prix comme 10,50 (entre 0,10 et 9 999 €).';
            } elseif ($centimes === $centimesOrigine) {
                unset($remplacements[$id]);
            } else {
                $remplacements[$id] = $centimes;
            }
        }
        $remplacements = array_intersect_key($remplacements, $origine);

        $avantTextes = asdc_textes();
        $textes = $avantTextes;
        foreach (asdc_plats() as $id => $plat) {
            if (!array_key_exists($id, $saisiesDesc)) {
                continue;
            }
            $texte = asdc_texte_saisi($saisiesDesc[$id]);
            if ($texte === null) {
                $erreursDesc[$id] = 'Ce texte contient des caractères illisibles : retapez-le.';
            } elseif (asdc_longueur($texte) > ASDC_DESC_MAX) {
                $erreursDesc[$id] = 'Pas plus de ' . ASDC_DESC_MAX . ' caractères (' . asdc_longueur($texte) . ' pour l’instant).';
            } elseif ($texte === $plat['desc']) {
                unset($textes['desc'][$id]);
            } else {
                $textes['desc'][$id] = $texte;
            }
        }
        foreach (asdc_titres_origine() as $id => $titreOrigine) {
            if (!array_key_exists($id, $saisiesTitres)) {
                continue;
            }
            $titre = asdc_texte_saisi($saisiesTitres[$id]);
            if ($titre === null || $titre === '') {
                $erreursTitres[$id] = 'Donnez un nom à cette rubrique.';
            } elseif (asdc_longueur($titre) > ASDC_TITRE_MAX) {
                $erreursTitres[$id] = 'Pas plus de ' . ASDC_TITRE_MAX . ' caractères (' . asdc_longueur($titre) . ' pour l’instant).';
            } elseif ($titre === $titreOrigine) {
                unset($textes['rubriques'][$id]);
            } else {
                $textes['rubriques'][$id] = $titre;
            }
        }

        $nbErreurs = count($erreurs) + count($erreursDesc) + count($erreursTitres);
        if ($nbErreurs) {
            http_response_code(422);
            $erreur = $nbErreurs === 1
                ? 'Un champ n’est pas valide : corrigez-le, puis enregistrez de nouveau.'
                : $nbErreurs . ' champs ne sont pas valides : corrigez-les, puis enregistrez de nouveau.';
        } elseif (!asdc_ecrire(ASDC_DONNEES . '/prix.php', $remplacements) || !asdc_ecrire(ASDC_DONNEES . '/textes.php', $textes)) {
            $erreur = 'Impossible d’enregistrer : le dossier « donnees » du site n’est pas modifiable par le serveur.';
        } else {
            $apres = $origine;
            foreach ($remplacements as $id => $centimes) {
                $apres[$id] = $centimes;
            }
            $changes = count(array_diff_assoc($apres, $avant));
            foreach (['desc', 'rubriques'] as $genre) {
                $changes += count(array_diff_assoc($textes[$genre], $avantTextes[$genre]))
                    + count(array_diff_key($avantTextes[$genre], $textes[$genre]));
            }
            asdc_rediriger('prix', $changes === 0
                ? 'Aucune modification.'
                : ($changes === 1 ? '1 modification enregistrée' : $changes . ' modifications enregistrées') . ' : la carte en ligne est à jour.');
        }
    } elseif ($action === 'mesure') {
        $active = isset($_POST['mesure']);
        asdc_modifier(ASDC_DONNEES . '/config.php', function (array $c) use ($active): array {
            $c['mesure'] = $active;
            return $c;
        });
        asdc_rediriger('reglages', $active ? 'La mesure d’audience est activée.' : 'La mesure d’audience est désactivée : plus rien n’est compté.');
    } elseif ($action === 'effacer') {
        $vue = 'reglages';
        if (($_POST['confirmer'] ?? '') !== 'oui') {
            $erreur = 'Cochez la case de confirmation pour effacer les statistiques.';
        } else {
            foreach (glob(ASDC_DONNEES . '/stats/*.php') ?: [] as $fichier) {
                if (basename($fichier) !== 'verrou.php') {
                    @unlink($fichier);
                }
            }
            asdc_rediriger('reglages', 'Toutes les statistiques ont été effacées.');
        }
    } elseif ($action === 'mot-de-passe') {
        $vue = 'reglages';
        $nouveau = (string) ($_POST['nouveau'] ?? '');
        if (!password_verify((string) ($_POST['actuel'] ?? ''), (string) (asdc_config()['mot_de_passe'] ?? ''))) {
            $erreur = 'Le mot de passe actuel est incorrect.';
        } elseif (strlen($nouveau) < 10) {
            $erreur = 'Le nouveau mot de passe doit faire au moins 10 caractères.';
        } elseif ($nouveau !== (string) ($_POST['confirmation'] ?? '')) {
            $erreur = 'Les deux nouveaux mots de passe ne sont pas identiques.';
        } elseif (!asdc_enregistrer_mot_de_passe($nouveau)) {
            $erreur = 'Impossible d’enregistrer le mot de passe : le dossier « donnees » n’est pas modifiable.';
        } else {
            asdc_rediriger('reglages', 'Mot de passe changé.');
        }
    }
}

$connecte = asdc_connecte();
$installe = asdc_mot_de_passe_installe();
$jeton = asdc_h($_SESSION['jeton']);
$titre = $connecte ? $vues[$vue] . ' — Gestion' : 'Espace gestion';
$version = static function (string $fichier): string {
    return $fichier . '?v=' . substr((string) @filemtime(__DIR__ . '/' . $fichier), -6);
};
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title><?= asdc_h($titre) ?> · Aux Saveurs du Cambodge</title>
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="<?= asdc_h($version('admin.css')) ?>">
<script src="<?= asdc_h($version('admin.js')) ?>" defer></script>
</head>
<body class="g<?= $connecte ? '' : ' g--accueil' ?>">
<?php if (!$connecte): ?>
<main class="g-accueil">
  <h1 class="g-accueil__titre">Espace gestion</h1>
  <p class="g-accueil__sous">Aux Saveurs du Cambodge</p>
  <?php if ($erreur): ?><p class="g-alerte" role="alert"><?= asdc_h($erreur) ?></p><?php endif ?>
  <?php if (!$installe): ?>
  <p class="g-accueil__texte">Première visite : choisissez le mot de passe qui protégera les prix et les statistiques. Il est enregistré chiffré, jamais en clair.</p>
  <form class="g-formulaire" method="post">
    <input type="hidden" name="jeton" value="<?= $jeton ?>">
    <input type="hidden" name="action" value="installer">
    <label class="g-champ">
      <span class="g-champ__nom">Mot de passe</span>
      <input type="password" name="mot_de_passe" autocomplete="new-password" minlength="10" required aria-describedby="aide-mdp">
    </label>
    <p class="g-aide" id="aide-mdp">10 caractères au moins.</p>
    <label class="g-champ">
      <span class="g-champ__nom">Confirmer le mot de passe</span>
      <input type="password" name="confirmation" autocomplete="new-password" minlength="10" required>
    </label>
    <button class="g-bouton g-bouton--large" type="submit">Créer le mot de passe</button>
  </form>
  <?php else: ?>
  <form class="g-formulaire" method="post">
    <input type="hidden" name="jeton" value="<?= $jeton ?>">
    <input type="hidden" name="action" value="connexion">
    <label class="g-champ">
      <span class="g-champ__nom">Mot de passe</span>
      <input type="password" name="mot_de_passe" autocomplete="current-password" required autofocus>
    </label>
    <button class="g-bouton g-bouton--large" type="submit">Se connecter</button>
  </form>
  <?php endif ?>
  <p class="g-accueil__retour"><a href="../">Retour au site</a></p>
</main>
<?php else: ?>
<header class="g-barre">
  <div class="g-barre__contenu">
    <p class="g-barre__nom"><a href="./">Gestion</a></p>
    <nav class="g-segments" aria-label="Sections de la gestion">
      <?php foreach ($vues as $cle => $nom): ?>
      <a href="./?vue=<?= $cle ?>"<?= $cle === $vue ? ' aria-current="page"' : '' ?>><?= asdc_h($nom) ?></a>
      <?php endforeach ?>
    </nav>
    <div class="g-barre__actions">
      <a class="g-lien" href="../">Voir le site</a>
      <form method="post">
        <input type="hidden" name="jeton" value="<?= $jeton ?>">
        <input type="hidden" name="action" value="deconnexion">
        <button class="g-lien g-lien--bouton" type="submit">Se déconnecter</button>
      </form>
    </div>
  </div>
</header>

<main class="g-contenu" id="contenu">
  <?php if ($message): ?><p class="g-message" role="status"><?= asdc_h($message) ?></p><?php endif ?>
  <?php if ($erreur): ?><p class="g-alerte" role="alert"><?= asdc_h($erreur) ?></p><?php endif ?>

<?php if ($vue === 'statistiques'): ?>
<?php
    $s = asdc_statistiques($periode);
    $libellePeriode = ['7j' => 'ces 7 derniers jours', '30j' => 'ces 30 derniers jours', '12m' => 'ces 12 derniers mois'][$periode];
    $pagesVues = array_sum($s['vues']);
    $noms = ['accueil' => 'Accueil', 'carte' => 'La carte', 'mentions' => 'Mentions légales', 'introuvable' => 'Page introuvable'];
    $paniers = $s['paniers']['nombre'];
?>
  <div class="g-entete-vue">
    <h1>Statistiques</h1>
    <nav class="g-segments g-segments--periode" aria-label="Période">
      <?php foreach ($periodes as $cle => $nom): ?>
      <a href="./?vue=statistiques&amp;periode=<?= $cle ?>"<?= $cle === $periode ? ' aria-current="page"' : '' ?>><?= asdc_h($nom) ?></a>
      <?php endforeach ?>
    </nav>
  </div>
  <?php if (!asdc_mesure_active()): ?>
  <p class="g-alerte">La mesure d’audience est désactivée : aucune visite n’est comptée. Elle se réactive dans <a href="./?vue=reglages">Réglages</a>.</p>
  <?php endif ?>

  <?php if ($s['jours'] === 0): ?>
  <section class="g-section g-attente">
    <h2>Aucune visite enregistrée <?= asdc_h($libellePeriode) ?></h2>
    <p>Dès que le site est en ligne, chaque visite apparaît ici le jour même : visiteurs, appels lancés, plats ajoutés à la commande, recherches sur la carte.</p>
    <p>Vos propres visites depuis ce navigateur ne sont pas comptées.</p>
  </section>
  <?php else: ?>
  <section class="g-section g-resume" aria-labelledby="titre-resume">
    <h2 class="visuellement-cache" id="titre-resume">Résumé</h2>
    <p class="g-chiffre"><?= asdc_nombre($s['visiteurs']) ?></p>
    <p class="g-chiffre__legende"><?= $s['visiteurs'] > 1 ? 'visiteurs' : 'visiteur' ?> <?= asdc_h($libellePeriode) ?>,
      <?= asdc_nombre($s['visites']) ?> visite<?= $s['visites'] > 1 ? 's' : '' ?> et <?= asdc_nombre($pagesVues) ?> page<?= $pagesVues > 1 ? 's' : '' ?> vue<?= $pagesVues > 1 ? 's' : '' ?>.</p>
  </section>

  <section class="g-section" aria-labelledby="titre-visites">
    <h2 id="titre-visites"><?= $s['par_mois'] ? 'Visites par mois' : 'Visites par jour' ?></h2>
    <?= asdc_histogramme($s['serie'], $s['par_mois']) ?>
  </section>

  <section class="g-section" aria-labelledby="titre-actions">
    <h2 id="titre-actions">Ce que font les visiteurs</h2>
    <dl class="g-actions">
      <div><dt>Appels lancés</dt><dd><?= asdc_nombre((int) ($s['actions']['appel'] ?? 0) + (int) ($s['actions']['commande'] ?? 0)) ?></dd></div>
      <div><dt>Commandes préparées</dt><dd><?= asdc_nombre((int) ($s['actions']['commande'] ?? 0)) ?></dd></div>
      <div><dt>Panier moyen</dt><dd><?= $paniers ? asdc_h(asdc_euros((int) round($s['paniers']['total'] / $paniers))) : '—' ?></dd></div>
      <div><dt>Itinéraires demandés</dt><dd><?= asdc_nombre((int) ($s['actions']['itineraire'] ?? 0)) ?></dd></div>
    </dl>
    <p class="g-aide">Un appel lancé, c’est un bouton « Appeler » touché sur le site ; une commande préparée, un appel lancé depuis « Votre commande », avec son total.</p>
  </section>

  <div class="g-grille">
    <section class="g-section" aria-labelledby="titre-plats">
      <h2 id="titre-plats">Plats ajoutés à la commande</h2>
      <?= asdc_classement($s['plats'], 'Aucun plat ajouté pour l’instant.', 8, 'asdc_nom_plat') ?>
    </section>
    <section class="g-section" aria-labelledby="titre-recherches">
      <h2 id="titre-recherches">Recherches sur la carte</h2>
      <?= asdc_classement($s['recherches'], 'Aucune recherche pour l’instant.') ?>
    </section>
    <section class="g-section" aria-labelledby="titre-sources">
      <h2 id="titre-sources">D’où viennent les visites</h2>
      <?= asdc_classement($s['sources'], 'Pas encore de provenance connue.', 8, null, max(1, $s['visites'])) ?>
    </section>
    <section class="g-section" aria-labelledby="titre-appareils">
      <h2 id="titre-appareils">Appareils</h2>
      <?= asdc_classement($s['appareils'], 'Pas encore d’appareil connu.', 3, null, max(1, $s['visites'])) ?>
    </section>
    <section class="g-section" aria-labelledby="titre-pages">
      <h2 id="titre-pages">Pages vues</h2>
      <?= asdc_classement($s['vues'], 'Aucune page vue.', 4, function (string $p) use ($noms): string {
          return $noms[$p] ?? $p;
      }) ?>
    </section>
  </div>
  <?php endif ?>
  <p class="g-note">Mesure faite par le site lui-même, sans service extérieur ni publicité : un cookie de 13 mois, des chiffres gardés 25 mois. Vos visites depuis ce navigateur ne sont pas comptées.</p>

<?php elseif ($vue === 'prix'): ?>
<?php
    $actuels = asdc_prix();
    $origine = asdc_prix_origine();
    $plats = asdc_plats();
    $titresOrigine = asdc_titres_origine();
    // Un bouton « Rétablir » remet le texte ou le prix d'origine dans son champ (masqué sans JavaScript).
    $retablir = static function (string $champ, string $valeur): string {
        return '<button type="button" class="g-retablir" data-retablir="' . asdc_h($champ) . '" data-valeur="' . asdc_h($valeur) . '" hidden>Rétablir</button>';
    };
?>
  <div class="g-entete-vue">
    <h1>La carte</h1>
  </div>
  <p class="g-intro">Changez un prix, une description ou le nom d’une rubrique, puis enregistrez : le site et les informations lues par Google suivent aussitôt.</p>
  <p class="g-filtre" data-filtre-zone hidden>
    <label class="visuellement-cache" for="filtre">Chercher un plat</label>
    <input id="filtre" type="search" placeholder="Chercher un plat" autocomplete="off" data-filtre>
  </p>
  <form class="g-prix" method="post" data-formulaire-prix novalidate>
    <input type="hidden" name="jeton" value="<?= $jeton ?>">
    <input type="hidden" name="action" value="prix">
    <?php foreach (asdc_carte()['rubriques'] as $rubrique):
        $rid = (string) $rubrique['id'];
        $fixe = !empty($rubrique['fixe']);
        $titreActuel = asdc_titre_rubrique($rid);
        $titreValeur = array_key_exists($rid, $saisiesTitres) && is_string($saisiesTitres[$rid]) ? $saisiesTitres[$rid] : $titreActuel;
        $titreChange = $titreActuel !== $titresOrigine[$rid];
        $decritTitre = array_merge($titreChange ? ['ot-' . $rid] : [], isset($erreursTitres[$rid]) ? ['et-' . $rid] : []);
    ?>
    <section class="g-rubrique" aria-labelledby="r-<?= asdc_h($rid) ?>" data-rubrique-prix>
      <?php if ($fixe): ?>
      <h2 id="r-<?= asdc_h($rid) ?>"><?= asdc_h($titreActuel) ?></h2>
      <?php else: ?>
      <h2 class="visuellement-cache" id="r-<?= asdc_h($rid) ?>"><?= asdc_h($titreActuel) ?></h2>
      <div class="g-rubrique__tete">
        <label class="g-rubrique__etiquette" for="t-<?= asdc_h($rid) ?>">Nom de la rubrique</label>
        <input class="g-rubrique__champ" id="t-<?= asdc_h($rid) ?>" name="rubrique[<?= asdc_h($rid) ?>]" type="text" maxlength="<?= ASDC_TITRE_MAX ?>" required autocomplete="off"
          value="<?= asdc_h($titreValeur) ?>" data-actuel="<?= asdc_h($titreActuel) ?>"<?= $decritTitre ? ' aria-describedby="' . asdc_h(implode(' ', $decritTitre)) . '"' : '' ?><?= isset($erreursTitres[$rid]) ? ' aria-invalid="true"' : '' ?>>
        <?php if ($titreChange): ?><p class="g-plat__origine g-plat__origine--texte" id="ot-<?= asdc_h($rid) ?>">Nom d’origine : « <?= asdc_h($titresOrigine[$rid]) ?> » <?= $retablir('t-' . $rid, $titresOrigine[$rid]) ?></p><?php endif ?>
        <?php if (isset($erreursTitres[$rid])): ?><p class="g-plat__erreur g-plat__erreur--texte" id="et-<?= asdc_h($rid) ?>"><?= asdc_h($erreursTitres[$rid]) ?></p><?php endif ?>
      </div>
      <?php endif ?>
      <ul class="g-plats">
        <?php foreach ($rubrique['plats'] as $plat):
            $id = (string) $plat['id'];
            $valeur = array_key_exists($id, $saisies) && is_string($saisies[$id]) ? $saisies[$id] : asdc_saisie_prix($actuels[$id]);
            $change = $actuels[$id] !== $origine[$id];
            $decrit = array_merge($change ? ['o-' . $id] : [], isset($erreurs[$id]) ? ['e-' . $id] : []);
            $descActuelle = asdc_desc($id);
            $descValeur = array_key_exists($id, $saisiesDesc) && is_string($saisiesDesc[$id]) ? $saisiesDesc[$id] : $descActuelle;
            $descChange = $descActuelle !== $plats[$id]['desc'];
            $decritDesc = array_merge($descChange ? ['od-' . $id] : [], isset($erreursDesc[$id]) ? ['ed-' . $id] : []);
            $enErreur = isset($erreurs[$id]) || isset($erreursDesc[$id]);
        ?>
        <li class="g-plat<?= $enErreur ? ' g-plat--erreur' : '' ?>" data-plat-prix="<?= asdc_h(asdc_normaliser($plat['nom'] . ' ' . $descActuelle)) ?>">
          <label class="g-plat__texte" for="p-<?= asdc_h($id) ?>">
            <span class="g-plat__nom"><?= asdc_h($plat['nom']) ?></span>
            <?php if ($fixe && $descActuelle !== ''): ?><span class="g-plat__desc"><?= asdc_h($descActuelle) ?></span><?php endif ?>
          </label>
          <span class="g-plat__champ">
            <input id="p-<?= asdc_h($id) ?>" name="prix[<?= asdc_h($id) ?>]" type="text" inputmode="decimal" autocomplete="off" spellcheck="false"
              value="<?= asdc_h($valeur) ?>" data-actuel="<?= asdc_h(asdc_saisie_prix($actuels[$id])) ?>" data-genre="prix"<?= $decrit ? ' aria-describedby="' . asdc_h(implode(' ', $decrit)) . '"' : '' ?><?= isset($erreurs[$id]) ? ' aria-invalid="true"' : '' ?>>
            <span class="g-plat__euro" aria-hidden="true">€</span>
          </span>
          <?php if ($change): ?><p class="g-plat__origine" id="o-<?= asdc_h($id) ?>">Prix d’origine : <?= asdc_h(asdc_euros($origine[$id])) ?> <?= $retablir('p-' . $id, asdc_saisie_prix($origine[$id])) ?></p><?php endif ?>
          <?php if (isset($erreurs[$id])): ?><p class="g-plat__erreur" id="e-<?= asdc_h($id) ?>"><?= asdc_h($erreurs[$id]) ?></p><?php endif ?>
          <?php if (!$fixe): ?>
          <label class="visuellement-cache" for="d-<?= asdc_h($id) ?>">Description de « <?= asdc_h($plat['nom']) ?> »</label>
          <textarea class="g-plat__description" id="d-<?= asdc_h($id) ?>" name="desc[<?= asdc_h($id) ?>]" rows="1" maxlength="<?= ASDC_DESC_MAX ?>" placeholder="Ajouter une description"
            data-actuel="<?= asdc_h($descActuelle) ?>"<?= $decritDesc ? ' aria-describedby="' . asdc_h(implode(' ', $decritDesc)) . '"' : '' ?><?= isset($erreursDesc[$id]) ? ' aria-invalid="true"' : '' ?>><?= asdc_h($descValeur) ?></textarea>
          <?php if ($descChange): ?><p class="g-plat__origine g-plat__origine--texte" id="od-<?= asdc_h($id) ?>"><?= $plats[$id]['desc'] === '' ? 'Pas de description à l’origine.' : 'Description d’origine : « ' . asdc_h($plats[$id]['desc']) . ' »' ?> <?= $retablir('d-' . $id, $plats[$id]['desc']) ?></p><?php endif ?>
          <?php if (isset($erreursDesc[$id])): ?><p class="g-plat__erreur g-plat__erreur--texte" id="ed-<?= asdc_h($id) ?>"><?= asdc_h($erreursDesc[$id]) ?></p><?php endif ?>
          <?php endif ?>
        </li>
        <?php endforeach ?>
      </ul>
    </section>
    <?php endforeach ?>
    <p class="g-vide" data-filtre-vide hidden>Aucun plat ne correspond à cette recherche.</p>
    <div class="g-enregistrer">
      <p class="g-enregistrer__etat" data-compte aria-live="polite"></p>
      <button class="g-bouton" type="submit">Enregistrer</button>
    </div>
  </form>

<?php else: ?>
  <div class="g-entete-vue">
    <h1>Réglages</h1>
  </div>
  <section class="g-section" aria-labelledby="titre-mesure">
    <h2 id="titre-mesure">Mesure d’audience</h2>
    <form method="post" class="g-formulaire">
      <input type="hidden" name="jeton" value="<?= $jeton ?>">
      <input type="hidden" name="action" value="mesure">
      <label class="g-interrupteur">
        <input type="checkbox" name="mesure" role="switch"<?= asdc_mesure_active() ? ' checked' : '' ?>>
        <span class="g-interrupteur__piste" aria-hidden="true"></span>
        <span>Compter les visites du site</span>
      </label>
      <p class="g-aide">Un cookie du site lui-même, sans publicité ni partage : il dure 13 mois et les chiffres sont gardés 25 mois, ce qui le dispense de bandeau de consentement selon la CNIL. Chaque visiteur peut refuser depuis les mentions légales.</p>
      <button class="g-bouton g-bouton--contour" type="submit">Enregistrer</button>
    </form>
  </section>

  <section class="g-section" aria-labelledby="titre-effacer">
    <h2 id="titre-effacer">Effacer les statistiques</h2>
    <form method="post" class="g-formulaire">
      <input type="hidden" name="jeton" value="<?= $jeton ?>">
      <input type="hidden" name="action" value="effacer">
      <label class="g-case">
        <input type="checkbox" name="confirmer" value="oui" required>
        <span>Je veux effacer toutes les statistiques enregistrées. C’est définitif.</span>
      </label>
      <button class="g-bouton g-bouton--danger" type="submit">Effacer les statistiques</button>
    </form>
  </section>

  <section class="g-section" aria-labelledby="titre-mdp">
    <h2 id="titre-mdp">Mot de passe</h2>
    <form method="post" class="g-formulaire">
      <input type="hidden" name="jeton" value="<?= $jeton ?>">
      <input type="hidden" name="action" value="mot-de-passe">
      <label class="g-champ">
        <span class="g-champ__nom">Mot de passe actuel</span>
        <input type="password" name="actuel" autocomplete="current-password" required>
      </label>
      <label class="g-champ">
        <span class="g-champ__nom">Nouveau mot de passe</span>
        <input type="password" name="nouveau" autocomplete="new-password" minlength="10" required aria-describedby="aide-nouveau">
      </label>
      <p class="g-aide" id="aide-nouveau">10 caractères au moins.</p>
      <label class="g-champ">
        <span class="g-champ__nom">Confirmer le nouveau mot de passe</span>
        <input type="password" name="confirmation" autocomplete="new-password" minlength="10" required>
      </label>
      <button class="g-bouton g-bouton--contour" type="submit">Changer le mot de passe</button>
    </form>
  </section>
<?php endif ?>
</main>
<?php endif ?>
</body>
</html>
