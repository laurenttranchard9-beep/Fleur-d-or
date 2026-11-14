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
        // La carte : prix, noms, descriptions, rubriques ; plats et rubriques ajoutés (public/inc/gestion.php).
        $vue = 'prix';
        $resultat = asdc_enregistrer_carte($_POST);
        $erreurs = $resultat['erreurs'];
        if ($erreurs) {
            http_response_code(422);
            $erreur = count($erreurs) === 1
                ? 'Un champ n’est pas valide : corrigez-le, puis enregistrez de nouveau.'
                : count($erreurs) . ' champs ne sont pas valides : corrigez-les, puis enregistrez de nouveau.';
        } elseif (!$resultat['ecrit']) {
            $erreur = 'Impossible d’enregistrer : le dossier « donnees » du site n’est pas modifiable par le serveur.';
        } else {
            $n = $resultat['changes'];
            asdc_rediriger('prix', $n === 0
                ? 'Aucune modification.'
                : ($n === 1 ? '1 modification enregistrée' : $n . ' modifications enregistrées') . ' : la carte en ligne est à jour.');
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
    $durees = asdc_resume_durees($s['durees']);
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

  <section class="g-section" aria-labelledby="titre-heures">
    <h2 id="titre-heures">Heures de visite</h2>
    <?php if (array_sum($s['heures'])): ?>
    <p class="g-aide g-aide--haut">L’heure d’arrivée sur le site, heure de Paris, toutes les visites de la période additionnées.</p>
    <?= asdc_histogramme_heures($s['heures']) ?>
    <?php else: ?>
    <p class="g-vide">Les heures sont comptées depuis la mise à jour du 14 novembre : elles apparaîtront ici avec les prochaines visites.</p>
    <?php endif ?>
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
    <section class="g-section" aria-labelledby="titre-duree">
      <h2 id="titre-duree">Temps passé sur le site</h2>
      <?php if ($durees['nombre']): ?>
      <p class="g-duree"><?= asdc_h(asdc_duree($durees['mediane'])) ?></p>
      <p class="g-duree__legende">par visite en général (médiane), <?= asdc_h(asdc_duree($durees['moyenne'])) ?> en moyenne, sur <?= asdc_nombre($durees['nombre']) ?> visite<?= $durees['nombre'] > 1 ? 's' : '' ?> mesurée<?= $durees['nombre'] > 1 ? 's' : '' ?>.</p>
      <?= asdc_classement($durees['tranches'], '', 6, null, $durees['nombre']) ?>
      <?php else: ?>
      <p class="g-vide">Le temps passé est mesuré depuis la mise à jour du 14 novembre : il apparaîtra ici avec les prochaines visites.</p>
      <?php endif ?>
    </section>
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
  <p class="g-note">Mesure faite par le site lui-même, sans service extérieur ni publicité : un cookie de 13 mois, des chiffres gardés 25 mois. Le temps passé ne compte que les moments où une page est affichée à l’écran. Vos visites depuis ce navigateur ne sont pas comptées.</p>

<?php elseif ($vue === 'prix'): ?>
<?php
    $carteDuMoment = asdc_carte_du_moment();
    $actuels = asdc_prix();
    $origine = asdc_prix_origine();
    $plats = asdc_plats();
    $titresOrigine = asdc_titres_origine();
    $fixes = array_values(array_filter(asdc_carte()['rubriques'], function (array $r): bool {
        return !empty($r['fixe']);
    }));
    // Après un envoi refusé, chaque champ garde ce qui avait été tapé.
    $saisie = function (string $groupe, string $cle, string $defaut): string {
        $valeur = $_POST[$groupe][$cle] ?? null;
        return is_string($valeur) ? $valeur : $defaut;
    };
    $coche = function (string $groupe, string $cle, bool $defaut): bool {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            return $defaut;
        }
        return (string) ($_POST[$groupe][$cle] ?? '') === '1';
    };
    // Aide sous un champ : l'original (avec « Rétablir »), l'erreur.
    $decrit = function (string $champ, bool $origine) use ($erreurs): string {
        $ids = [];
        if ($origine) {
            $ids[] = 'o-' . $champ;
        }
        if (isset($erreurs[$champ])) {
            $ids[] = 'e-' . $champ;
        }
        return ($ids ? ' aria-describedby="' . asdc_h(implode(' ', $ids)) . '"' : '') . (isset($erreurs[$champ]) ? ' aria-invalid="true"' : '');
    };
    $erreurDe = function (string $champ, string $classe = 'g-plat__erreur g-plat__erreur--texte') use ($erreurs): string {
        return isset($erreurs[$champ]) ? '<p class="' . $classe . '" id="e-' . asdc_h($champ) . '">' . asdc_h($erreurs[$champ]) . '</p>' : '';
    };
    $retablir = function (string $champ, string $valeur): string {
        return '<button type="button" class="g-retablir" data-retablir="' . asdc_h($champ) . '" data-valeur="' . asdc_h($valeur) . '" hidden>Rétablir</button>';
    };
    // Les rubriques où ranger un plat, et les places possibles d'une rubrique ajoutée.
    $optionsRubriques = function (string $choisi, bool $avecNouvelle) use ($carteDuMoment): string {
        $html = '';
        foreach ($carteDuMoment as $r) {
            $html .= '<option value="' . asdc_h($r['id']) . '"' . ($r['id'] === $choisi ? ' selected' : '') . '>' . asdc_h($r['titre']) . '</option>';
        }
        if ($avecNouvelle) {
            $html .= '<option value="__nouvelle__"' . ($choisi === '__nouvelle__' ? ' selected' : '') . '>La nouvelle rubrique (ci-dessus)</option>';
        }
        return $html;
    };
    $optionsPlaces = function (string $choisi, string $sauf) use ($carteDuMoment): string {
        $html = '<option value=""' . ($choisi === '' ? ' selected' : '') . '>En tête de la carte</option>';
        foreach ($carteDuMoment as $r) {
            if ($r['id'] !== $sauf) {
                $html .= '<option value="' . asdc_h($r['id']) . '"' . ($r['id'] === $choisi ? ' selected' : '') . '>Après « ' . asdc_h($r['titre']) . ' »</option>';
            }
        }
        return $html;
    };
?>
  <div class="g-entete-vue">
    <h1>La carte</h1>
  </div>
  <p class="g-intro">Changez un prix, un nom, une description, rangez un plat dans une autre rubrique, ajoutez une rubrique ou un plat, puis enregistrez : le site et les informations lues par Google suivent aussitôt.</p>
  <p class="g-filtre" data-filtre-zone hidden>
    <label class="visuellement-cache" for="filtre">Chercher un plat</label>
    <input id="filtre" type="search" placeholder="Chercher un plat" autocomplete="off" data-filtre>
  </p>
  <form class="g-prix" method="post" data-formulaire-prix novalidate>
    <input type="hidden" name="jeton" value="<?= $jeton ?>">
    <input type="hidden" name="action" value="prix">

    <section class="g-rubrique g-ajout" aria-labelledby="titre-ajout">
      <h2 id="titre-ajout">Ajouter</h2>
      <div class="g-ajout__blocs">
        <fieldset class="g-ajout__bloc">
          <legend>Une rubrique</legend>
          <label class="g-mini" for="nr-titre">Nom</label>
          <input class="g-texte" id="nr-titre" name="nouvelle_rubrique[titre]" type="text" maxlength="<?= ASDC_TITRE_MAX ?>" autocomplete="off" placeholder="Par exemple : Plats du jour"
            value="<?= asdc_h($saisie('nouvelle_rubrique', 'titre', '')) ?>" data-actuel=""<?= $decrit('nr-titre', false) ?>>
          <?= $erreurDe('nr-titre') ?>
          <label class="g-mini" for="nr-apres">Place sur la carte</label>
          <select class="g-choix" id="nr-apres" name="nouvelle_rubrique[apres]" data-actuel="<?= asdc_h($saisie('nouvelle_rubrique', 'apres', '')) ?>"<?= $decrit('nr-apres', false) ?>><?= $optionsPlaces($saisie('nouvelle_rubrique', 'apres', ''), '') ?></select>
          <?= $erreurDe('nr-apres') ?>
          <label class="g-case"><input type="checkbox" name="nouvelle_rubrique[riz]" value="1" data-actuel="0"<?= $coche('nouvelle_rubrique', 'riz', false) ? ' checked' : '' ?>> <span>Plats servis avec du riz nature</span></label>
        </fieldset>
        <fieldset class="g-ajout__bloc">
          <legend>Un plat</legend>
          <div class="g-ajout__ligne">
            <span class="g-ajout__nom">
              <label class="g-mini" for="np-nom">Nom</label>
              <input class="g-texte" id="np-nom" name="nouveau_plat[nom]" type="text" maxlength="<?= ASDC_NOM_MAX ?>" autocomplete="off" placeholder="Par exemple : Curry de légumes"
                value="<?= asdc_h($saisie('nouveau_plat', 'nom', '')) ?>" data-actuel=""<?= $decrit('np-nom', false) ?>>
            </span>
            <span class="g-ajout__prix">
              <label class="g-mini" for="np-prix">Prix</label>
              <span class="g-plat__champ">
                <input id="np-prix" name="nouveau_plat[prix]" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="10,50"
                  value="<?= asdc_h($saisie('nouveau_plat', 'prix', '')) ?>" data-actuel="" data-genre="prix"<?= $decrit('np-prix', false) ?>>
                <span class="g-plat__euro" aria-hidden="true">€</span>
              </span>
            </span>
          </div>
          <?= $erreurDe('np-nom') ?><?= $erreurDe('np-prix') ?>
          <label class="g-mini" for="np-desc">Description</label>
          <textarea class="g-plat__description" id="np-desc" name="nouveau_plat[desc]" rows="1" maxlength="<?= ASDC_DESC_MAX ?>" placeholder="Facultative"
            data-actuel=""<?= $decrit('np-desc', false) ?>><?= asdc_h($saisie('nouveau_plat', 'desc', '')) ?></textarea>
          <?= $erreurDe('np-desc') ?>
          <label class="g-mini" for="np-rubrique">Rubrique</label>
          <select class="g-choix" id="np-rubrique" name="nouveau_plat[rubrique]" data-actuel="<?= asdc_h($saisie('nouveau_plat', 'rubrique', $carteDuMoment[0]['id'] ?? '')) ?>"<?= $decrit('np-rubrique', false) ?>><?= $optionsRubriques($saisie('nouveau_plat', 'rubrique', $carteDuMoment[0]['id'] ?? ''), true) ?></select>
          <?= $erreurDe('np-rubrique') ?>
        </fieldset>
      </div>
      <p class="g-aide">Rempli, chaque bloc crée sa rubrique ou son plat quand vous enregistrez ; laissé vide, il ne change rien.</p>
    </section>

    <?php foreach ($carteDuMoment as $rubrique):
        $rid = (string) $rubrique['id'];
        $ajoutee = $rubrique['ajoutee'];
        $titreValeur = $saisie('rubrique', $rid, $rubrique['titre']);
        $titreChange = !$ajoutee && $rubrique['titre'] !== ($titresOrigine[$rid] ?? $rubrique['titre']);
    ?>
    <section class="g-rubrique<?= $ajoutee ? ' g-rubrique--ajoutee' : '' ?>" aria-labelledby="r-<?= asdc_h($rid) ?>" data-rubrique-prix>
      <h2 class="visuellement-cache" id="r-<?= asdc_h($rid) ?>"><?= asdc_h($rubrique['titre']) ?></h2>
      <div class="g-rubrique__tete">
        <label class="g-rubrique__etiquette" for="t-<?= asdc_h($rid) ?>">Nom de la rubrique<?= $ajoutee ? ' · ajoutée' : '' ?></label>
        <input class="g-rubrique__champ" id="t-<?= asdc_h($rid) ?>" name="rubrique[<?= asdc_h($rid) ?>]" type="text" maxlength="<?= ASDC_TITRE_MAX ?>" required autocomplete="off"
          value="<?= asdc_h($titreValeur) ?>" data-actuel="<?= asdc_h($rubrique['titre']) ?>"<?= $decrit('t-' . $rid, $titreChange) ?>>
        <?php if ($titreChange): ?><p class="g-plat__origine g-plat__origine--texte" id="o-t-<?= asdc_h($rid) ?>">Nom d’origine : « <?= asdc_h($titresOrigine[$rid]) ?> » <?= $retablir('t-' . $rid, $titresOrigine[$rid]) ?></p><?php endif ?>
        <?= $erreurDe('t-' . $rid) ?>
        <?php if ($ajoutee): ?>
        <div class="g-rubrique__options">
          <input type="hidden" name="riz[<?= asdc_h($rid) ?>]" value="0">
          <label class="g-case"><input type="checkbox" id="z-<?= asdc_h($rid) ?>" name="riz[<?= asdc_h($rid) ?>]" value="1" data-actuel="<?= $rubrique['riz'] ? '1' : '0' ?>"<?= $coche('riz', $rid, $rubrique['riz']) ? ' checked' : '' ?>> <span>Plats servis avec du riz nature</span></label>
          <span class="g-ligne-choix">
            <label class="g-mini" for="a-<?= asdc_h($rid) ?>">Place</label>
            <select class="g-choix" id="a-<?= asdc_h($rid) ?>" name="apres[<?= asdc_h($rid) ?>]" data-actuel="<?= asdc_h($rubrique['apres']) ?>"<?= $decrit('a-' . $rid, false) ?>><?= $optionsPlaces($saisie('apres', $rid, $rubrique['apres']), $rid) ?></select>
          </span>
          <?= $erreurDe('a-' . $rid) ?>
          <label class="g-case g-case--danger"><input type="checkbox" id="sr-<?= asdc_h($rid) ?>" name="supprimer_rubrique[<?= asdc_h($rid) ?>]" value="1" data-actuel="0" data-supprimer<?= $coche('supprimer_rubrique', $rid, false) ? ' checked' : '' ?>> <span>Supprimer cette rubrique (ses plats ajoutés aussi ; les autres retournent dans leur rubrique)</span></label>
        </div>
        <?php endif ?>
      </div>
      <?php if (!$rubrique['plats']): ?>
      <p class="g-vide g-rubrique__vide">Aucun plat pour l’instant : ajoutez-en un, ou rangez-y un plat existant. Tant qu’elle est vide, la rubrique n’apparaît pas sur le site.</p>
      <?php endif ?>
      <ul class="g-plats">
        <?php foreach ($rubrique['plats'] as $plat):
            $id = (string) $plat['id'];
            $ajoute = $plat['ajoute'];
            $nomBase = $plats[$id]['nom'];
            $descBase = $plats[$id]['desc'];
            $prixChange = !$ajoute && $actuels[$id] !== $origine[$id];
            $nomChange = !$ajoute && $plat['nom'] !== $nomBase;
            $descChange = !$ajoute && $plat['desc'] !== $descBase;
            $deplace = !$ajoute && $rid !== $plat['origine'];
        ?>
        <li class="g-plat<?= $ajoute ? ' g-plat--ajoute' : '' ?>" data-plat-prix="<?= asdc_h(asdc_normaliser($plat['nom'] . ' ' . $plat['desc'])) ?>">
          <span class="g-plat__nom-zone">
            <label class="visuellement-cache" for="n-<?= asdc_h($id) ?>">Nom du plat</label>
            <input class="g-plat__nom-champ" id="n-<?= asdc_h($id) ?>" name="nom[<?= asdc_h($id) ?>]" type="text" maxlength="<?= ASDC_NOM_MAX ?>" required autocomplete="off"
              value="<?= asdc_h($saisie('nom', $id, $plat['nom'])) ?>" data-actuel="<?= asdc_h($plat['nom']) ?>"<?= $decrit('n-' . $id, $nomChange) ?>>
          </span>
          <span class="g-plat__champ">
            <label class="visuellement-cache" for="p-<?= asdc_h($id) ?>">Prix de « <?= asdc_h($plat['nom']) ?> »</label>
            <input id="p-<?= asdc_h($id) ?>" name="prix[<?= asdc_h($id) ?>]" type="text" inputmode="decimal" autocomplete="off" spellcheck="false"
              value="<?= asdc_h($saisie('prix', $id, asdc_saisie_prix($actuels[$id]))) ?>" data-actuel="<?= asdc_h(asdc_saisie_prix($actuels[$id])) ?>" data-genre="prix"<?= $decrit('p-' . $id, $prixChange) ?>>
            <span class="g-plat__euro" aria-hidden="true">€</span>
          </span>
          <?php if ($nomChange): ?><p class="g-plat__origine g-plat__origine--texte" id="o-n-<?= asdc_h($id) ?>">Nom d’origine : « <?= asdc_h($nomBase) ?> » <?= $retablir('n-' . $id, $nomBase) ?></p><?php endif ?>
          <?= $erreurDe('n-' . $id) ?>
          <?php if ($prixChange): ?><p class="g-plat__origine" id="o-p-<?= asdc_h($id) ?>">Prix d’origine : <?= asdc_h(asdc_euros($origine[$id])) ?> <?= $retablir('p-' . $id, asdc_saisie_prix($origine[$id])) ?></p><?php endif ?>
          <?= $erreurDe('p-' . $id, 'g-plat__erreur') ?>
          <label class="visuellement-cache" for="d-<?= asdc_h($id) ?>">Description de « <?= asdc_h($plat['nom']) ?> »</label>
          <textarea class="g-plat__description" id="d-<?= asdc_h($id) ?>" name="desc[<?= asdc_h($id) ?>]" rows="1" maxlength="<?= ASDC_DESC_MAX ?>" placeholder="Ajouter une description"
            data-actuel="<?= asdc_h($plat['desc']) ?>"<?= $decrit('d-' . $id, $descChange) ?>><?= asdc_h($saisie('desc', $id, $plat['desc'])) ?></textarea>
          <?php if ($descChange): ?><p class="g-plat__origine g-plat__origine--texte" id="o-d-<?= asdc_h($id) ?>"><?= $descBase === '' ? 'Pas de description à l’origine.' : 'Description d’origine : « ' . asdc_h($descBase) . ' »' ?> <?= $retablir('d-' . $id, $descBase) ?></p><?php endif ?>
          <?= $erreurDe('d-' . $id) ?>
          <div class="g-plat__bas">
            <span class="g-ligne-choix">
              <label class="g-mini" for="pl-<?= asdc_h($id) ?>">Rubrique</label>
              <select class="g-choix" id="pl-<?= asdc_h($id) ?>" name="place[<?= asdc_h($id) ?>]" data-actuel="<?= asdc_h($rid) ?>"<?= $decrit('pl-' . $id, $deplace) ?>><?= $optionsRubriques($saisie('place', $id, $rid), true) ?></select>
            </span>
            <?php if ($ajoute): ?>
            <label class="g-case g-case--danger"><input type="checkbox" id="sp-<?= asdc_h($id) ?>" name="supprimer_plat[<?= asdc_h($id) ?>]" value="1" data-actuel="0" data-supprimer<?= $coche('supprimer_plat', $id, false) ? ' checked' : '' ?>> <span>Supprimer ce plat</span></label>
            <?php endif ?>
          </div>
          <?php if ($deplace): ?><p class="g-plat__origine g-plat__origine--texte" id="o-pl-<?= asdc_h($id) ?>">Rubrique d’origine : « <?= asdc_h(asdc_titre_rubrique($plat['origine'])) ?> » <?= $retablir('pl-' . $id, $plat['origine']) ?></p><?php endif ?>
          <?= $erreurDe('pl-' . $id) ?>
        </li>
        <?php endforeach ?>
      </ul>
    </section>
    <?php endforeach ?>

    <?php foreach ($fixes as $rubrique): ?>
    <section class="g-rubrique" aria-labelledby="r-<?= asdc_h($rubrique['id']) ?>" data-rubrique-prix>
      <h2 id="r-<?= asdc_h($rubrique['id']) ?>"><?= asdc_h($rubrique['titre']) ?></h2>
      <ul class="g-plats">
        <?php foreach ($rubrique['plats'] as $plat):
            $id = (string) $plat['id'];
            $prixChange = $actuels[$id] !== $origine[$id];
        ?>
        <li class="g-plat" data-plat-prix="<?= asdc_h(asdc_normaliser($plat['nom'] . ' ' . ($plat['desc'] ?? ''))) ?>">
          <label class="g-plat__texte" for="p-<?= asdc_h($id) ?>">
            <span class="g-plat__nom"><?= asdc_h($plat['nom']) ?></span>
            <?php if (!empty($plat['desc'])): ?><span class="g-plat__desc"><?= asdc_h($plat['desc']) ?></span><?php endif ?>
          </label>
          <span class="g-plat__champ">
            <input id="p-<?= asdc_h($id) ?>" name="prix[<?= asdc_h($id) ?>]" type="text" inputmode="decimal" autocomplete="off" spellcheck="false"
              value="<?= asdc_h($saisie('prix', $id, asdc_saisie_prix($actuels[$id]))) ?>" data-actuel="<?= asdc_h(asdc_saisie_prix($actuels[$id])) ?>" data-genre="prix"<?= $decrit('p-' . $id, $prixChange) ?>>
            <span class="g-plat__euro" aria-hidden="true">€</span>
          </span>
          <?php if ($prixChange): ?><p class="g-plat__origine" id="o-p-<?= asdc_h($id) ?>">Prix d’origine : <?= asdc_h(asdc_euros($origine[$id])) ?> <?= $retablir('p-' . $id, asdc_saisie_prix($origine[$id])) ?></p><?php endif ?>
          <?= $erreurDe('p-' . $id, 'g-plat__erreur') ?>
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
