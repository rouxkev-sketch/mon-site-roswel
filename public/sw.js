/*
 * SERVICE WORKER DE YOKOFOLIO
 * ------------------------
 * Petit programme exécuté par le navigateur, en arrière-plan.
 * Son rôle :
 *  1. mettre en cache les fichiers du site pour un affichage rapide ;
 *  2. afficher une page « hors ligne » si la connexion est coupée.
 *
 * Sa VERSION suit automatiquement la mise en ligne (voir plus bas) :
 * il n'y a plus aucun numéro à incrémenter à la main.
 *
 * ⚠️ LES ICÔNES NE SONT JAMAIS MISES EN CACHE ICI. L'ancienne version
 * gardait « pour toujours » toute image déjà vue (cache d'abord, sans
 * revalidation) : une icône d'un ancien produit capturée une fois
 * revenait donc dans l'onglet à chaque visite, même une fois le
 * fichier disparu du projet. Désormais, toute demande d'icône ou de
 * logo part TOUJOURS sur le réseau (le cache ne sert qu'en secours,
 * hors ligne, pour le logo de la page « hors ligne »).
 *
 * ██████████████████████████████████████████████████████████████████
 * ██  §1 (nº 479) — POURQUOI LE SITE CASSAIT APRÈS UNE MISE EN     ██
 * ██  LIGNE, ET CE QUI A CHANGÉ                                    ██
 * ██████████████████████████████████████████████████████████████████
 * Le symptôme : « This page couldn't load » sur Safari, en session
 * normale seulement — jamais en navigation privée (qui n'a ni cache ni
 * service worker), et réglé en effaçant les données du site (ce qui
 * supprime ce programme-ci). Le fautif était donc ce fichier. TROIS
 * défauts s'y trouvaient, tous capables de produire cet écran :
 *
 *  A. LE REPLI POUVAIT NE RIEN RENDRE DU TOUT. La branche des
 *     navigations répondait `cache.match(PAGE_HORS_LIGNE)` : quand
 *     cette page n'est PAS dans le cache, cette expression vaut
 *     `undefined` — et répondre `undefined` à une navigation, c'est
 *     exactement l'écran d'échec du navigateur. Or le cache pouvait
 *     très bien être vide : `skipWaiting()` était appelé EN DEHORS du
 *     `waitUntil` de l'installation, donc le programme pouvait passer
 *     à l'activation — qui efface tous les caches sauf le sien — sans
 *     que la mise en cache de la page « hors ligne » ait eu le temps de
 *     s'écrire. Un simple hoquet de réseau suffisait ensuite à montrer
 *     l'écran d'échec, et cela DURAIT : la mise en cache ne se rejoue
 *     qu'à l'installation, qui ne revient pas.
 *  B. N'IMPORTE QUELLE RÉPONSE ÉTAIT MÉMORISÉE. La branche des
 *     fichiers rangeait dans le cache TOUT ce que le réseau rendait —
 *     y compris une 404 ou une erreur de serveur. Pendant les quelques
 *     secondes d'une mise en ligne, un fichier peut très bien répondre
 *     404 : cette 404 était alors gardée, puis RESSERVIE à chaque
 *     visite (« le cache d'abord »), longtemps après que le site fût
 *     redevenu sain. Un script de l'application servi en 404, c'est la
 *     page qui casse.
 *  C. UN RÉSEAU QUI FLANCHE CASSAIT LA RESSOURCE. Cette même branche
 *     n'avait AUCUN filet : si le `fetch` échouait, la promesse rendue
 *     était rejetée — et une promesse rejetée dans `respondWith`, c'est
 *     une erreur dure, pas un repli.
 *
 * CE QUI EST ÉCRIT MAINTENANT — les mêmes principes, mais sans trou :
 *  · le cache est versionné par mise en ligne ET porte le millésime du
 *    site, pour se lire d'un coup d'œil dans les outils du navigateur ;
 *  · l'installation met la page « hors ligne » de côté AVANT de prendre
 *    la main, et l'activation efface tous les autres caches ;
 *  · AUCUNE réponse invalide n'entre dans le cache : 200 seulement, et
 *    seulement les réponses de notre propre serveur ;
 *  · AUCUNE branche ne peut rendre `undefined` ni une promesse rejetée :
 *    il y a toujours une réponse au bout, et en dernier recours une
 *    page « hors ligne » écrite ici même, qui ne dépend de rien.
 */

/**
 * ⚠️ LA VERSION VIENT DE LA MISE EN LIGNE, PLUS D'UN NUMÉRO À LA MAIN.
 * La page enregistre ce fichier avec, dans son adresse, l'empreinte de
 * la compilation ET le millésime du script d'avant-peinture
 * (`/sw.js?v=<empreinte>-<millésime>`, voir
 * EnregistrementServiceWorker) : chaque mise en ligne donne donc un
 * service worker NEUF, un cache NEUF, et l'activation efface tous les
 * autres. Plus rien à penser.
 */
const VERSION =
  "yokofolio-" +
  (new URL(self.location.href).searchParams.get("v") || "sans-version");
const PAGE_HORS_LIGNE = "/offline.html";
const LOGO_HORS_LIGNE = "/yokofolio-icone.png";

/**
 * §1 (nº 479) — LE DERNIER RECOURS, ÉCRIT ICI ET DÉPENDANT DE RIEN.
 * Si la page « hors ligne » elle-même manque au cache (installation
 * interrompue, cache vidé par le système), on rend CE document plutôt
 * que `undefined` : le visiteur lit une phrase et peut réessayer, au
 * lieu de tomber sur l'écran d'échec du navigateur.
 */
function pageDeSecours() {
  return new Response(
    "<!doctype html><html lang=\"fr\"><meta charset=\"utf-8\">" +
      "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
      "<title>Hors ligne</title>" +
      "<body style=\"margin:0;display:flex;align-items:center;justify-content:center;" +
      "min-height:100vh;background:#0B0F14;color:#F2F2F4;" +
      "font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px\">" +
      "<p style=\"font-size:16px;line-height:1.6\">Connexion perdue.<br>" +
      "Réessaie dans un instant.</p></body></html>",
    {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

/**
 * Une adresse d'icône ou de logo ? Large exprès : favicon, .ico,
 * apple-touch-icon, /icons/, et tout nom contenant « icon », « icone »
 * ou « logo ». Pour ces fichiers, le réseau fait foi — c'est ce qui
 * empêche une vieille icône de s'incruster.
 */
function estIcone(url) {
  return (
    url.pathname === "/favicon.ico" ||
    url.pathname.endsWith(".ico") ||
    url.pathname.startsWith("/icons/") ||
    /icon|icone|logo/i.test(url.pathname)
  );
}

/**
 * §1 (nº 479) — CE QUI A LE DROIT D'ENTRER DANS LE CACHE.
 * Trois conditions, et les trois comptent :
 *  · une réponse qui existe (un `fetch` peut rendre `undefined` si le
 *    navigateur a coupé) ;
 *  · un statut 200 EXACTEMENT — ni 404, ni 500, ni 206 (une réponse
 *    partielle, comme un morceau de vidéo, ne se ressert pas) ;
 *  · une réponse « basic », c'est-à-dire venue de NOTRE serveur : une
 *    réponse opaque (autre domaine) ne se lit pas et ne se vérifie pas.
 * C'est ce filtre qui empêche une 404 de mise en ligne de s'installer
 * pour des jours (le défaut B de l'en-tête).
 */

/**
 * ██ §1 (nº 686) — LE PROGRAMME SE SOIGNE TOUT SEUL ██
 * ==================================================================
 * CE QUI EST ARRIVÉ LE 27 AOÛT AU SOIR, et qui a coûté une soirée au
 * propriétaire. Un incident passager a laissé ce service worker avec
 * une version périmée en mémoire. Il l'a RESSERVIE même après la fin
 * de l'incident : les fichiers du programme demandés par le HTML neuf
 * répondaient 404, la page restait cassée, et un simple rechargement
 * n'y changeait RIEN — c'est nous qui répondions, pas le réseau. Seule
 * la suppression manuelle des données du site a réparé.
 * ⚠️ UN VISITEUR NE FERA JAMAIS CELA. C'est la seule chose qui compte
 * ici : une réparation qui exige d'ouvrir les réglages du navigateur
 * n'est pas une réparation.
 *
 * LE SIGNAL, ET IL EST SANS AMBIGUÏTÉ : un fichier de `/_next/static/`
 * qui répond 404. Ces noms portent une empreinte de contenu — ils ne
 * changent JAMAIS de sens. Un 404 sur l'un d'eux ne veut dire qu'une
 * chose : ce que nous gardons ne correspond plus à ce qui est en
 * ligne. Il n'y a rien à interpréter, rien à supposer.
 *
 * LA RÉPONSE : on vide TOUS les caches et l'on se DÉSINSCRIT. Au
 * rechargement suivant, plus personne ne s'interpose — le navigateur
 * parle au serveur, prend le programme neuf, et le site repart. Un
 * geste que le visiteur fait naturellement quand une page est cassée.
 *
 * ⚠️ UNE SEULE FOIS, ET SANS BLOQUER LA RÉPONSE EN COURS. Une page
 * cassée demande vingt fichiers : sans ce verrou, vingt purges
 * partiraient de front. Et la guérison ne s'intercale JAMAIS devant la
 * réponse qu'on est en train de rendre — elle part à côté.
 * ⚠️ CE QUE CE PROGRAMME GARDE VRAIMENT — et le dossier de reprise se
 * trompe là-dessus. Il dit « rien n'est mis en cache » (nº 651) : c'est
 * FAUX, et c'est même la cause de l'incident. La branche des fichiers
 * STATIQUES est en CACHE D'ABORD (`cache.match` avant `fetch`) et RANGE
 * tout ce qui répond 200 : `/_next/static/`, `/images/`, les scripts,
 * les feuilles, les polices. Ce qui n'est PAS gardé : les routes
 * `/api/` (jamais interceptées — elles portent des données
 * personnelles), les navigations (jamais rangées), et les icônes de
 * marque (réseau d'abord, cache en secours seulement).
 * ⚠️ ON NE RECHARGE PAS À LA PLACE DU VISITEUR. Recharger sous les
 * doigts de quelqu'un qui est peut-être en train d'écrire, c'est
 * échanger une panne contre une perte. On se met en état de guérir ;
 * c'est son geste qui achève.
 */
let guerisonLancee = false;

function seSoigner() {
  if (guerisonLancee) return;
  guerisonLancee = true;
  //  L'ordre compte : on vide AVANT de se désinscrire — une fois
  //  désinscrit, plus rien ne garantit qu'on tourne assez longtemps.
  caches
    .keys()
    .then((noms) => Promise.all(noms.map((nom) => caches.delete(nom))))
    .catch(() => {})
    .then(() => self.registration.unregister())
    .catch(() => {});
}

/** Un fichier du PROGRAMME — ceux dont le nom porte une empreinte. */
function estFichierDuProgramme(url) {
  return url.pathname.startsWith("/_next/static/");
}

function peutEtreGardee(reponse) {
  return Boolean(
    reponse && reponse.status === 200 && reponse.type === "basic"
  );
}

/**
 * À l'installation : on met de côté la page « hors ligne » et le logo
 * qu'elle affiche.
 * §1 (nº 479) — `skipWaiting()` EST DÉSORMAIS DANS LE `waitUntil`, et
 * APRÈS la mise en cache : le programme ne prend la main qu'une fois
 * son repli en place (défaut A). Et l'installation ne peut plus
 * ÉCHOUER sur ce seul motif — si la page « hors ligne » n'est pas
 * joignable, on prend quand même la main : le dernier recours écrit
 * ci-dessus couvre ce cas, et un service worker qui refuse de
 * s'installer laisserait l'ANCIEN en place, c'est-à-dire le problème
 * qu'on répare.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) =>
        cache
          .add(PAGE_HORS_LIGNE)
          .then(() => cache.add(LOGO_HORS_LIGNE).catch(() => {}))
      )
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

// À l'activation : on supprime les caches de TOUTES les autres
// versions — y compris ceux d'anciens produits, quel que soit leur nom.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((noms) =>
        Promise.all(
          noms.filter((nom) => nom !== VERSION).map((nom) => caches.delete(nom))
        )
      )
      .then(() => self.clients.claim())
  );
});

// À chaque requête du navigateur :
self.addEventListener("fetch", (event) => {
  const requete = event.request;

  // On ne gère que les lectures de pages/fichiers du site
  if (requete.method !== "GET") return;
  const url = new URL(requete.url);
  if (url.origin !== self.location.origin) return;

  /*  §1 (nº 479) — LES ROUTES DE DONNÉES NE PASSENT JAMAIS PAR ICI, et
      c'est écrit noir sur blanc plutôt que déduit. `/api/` sert les
      réponses PERSONNELLES (compte, favoris, Ma sélection,
      notifications) : une seule d'entre elles gardée dans un cache
      partagé par l'appareil, et le visiteur suivant lirait les données
      du précédent. On ne les intercepte pas — le navigateur les
      demande au serveur, à chaque fois, comme s'il n'y avait pas de
      service worker. (Les pages personnelles, elles, sont des
      navigations : la branche 1 ci-dessous ne range JAMAIS une page.) */
  if (url.pathname.startsWith("/api/")) return;

  // 0) ICÔNES ET LOGOS : le réseau, TOUJOURS — jamais de copie gardée.
  //    Le cache (où seul le logo yokofolio est rangé, à l'installation)
  //    ne répond qu'en secours, quand la connexion est coupée.
  if (estIcone(url)) {
    event.respondWith(
      fetch(requete).catch(() =>
        caches
          .open(VERSION)
          .then((cache) => cache.match(requete))
          //  §1 (nº 479) — jamais `undefined` : une icône introuvable
          //  hors ligne rend une réponse vide, pas une erreur dure.
          .then((enCache) => enCache || new Response("", { status: 504 }))
      )
    );
    return;
  }

  // 1) NAVIGATION VERS UNE PAGE : LE RÉSEAU, ET RIEN D'AUTRE.
  //    Hors ligne → la page « hors ligne », jamais une page du site
  //    tirée du cache.
  //
  //    ⚠️ ET C'EST UNE PROTECTION, PAS UNE ÉCONOMIE. Une page HTML mise
  //    en cache désigne ses feuilles de style et ses scripts par des
  //    noms qui CHANGENT à chaque compilation. La resservir après une
  //    mise en ligne, c'est demander au navigateur des fichiers qui
  //    n'existent plus : il affiche alors le texte brut, sans aucune
  //    mise en forme — photo démesurée, icônes en vrac. Exactement le
  //    défaut décrit. On ne range donc AUCUNE page dans le cache, et on
  //    n'en ressort aucune : le repli est la page « hors ligne », qui
  //    ne dépend de rien.
  if (requete.mode === "navigate") {
    /**
     * §2 (nº 336) — UN RETOUR OU UNE AVANCE, ON NE S'EN MÊLE PAS.
     * ==================================================================
     * CE QUI SE PASSAIT, ET C'EST « L'ÉCRAN VIDE QUAND JE GLISSE POUR
     * REVENIR ». Cette interception vaut pour TOUTES les navigations —
     * y compris celles de l'HISTORIQUE. Or, pour un retour, le
     * navigateur a DÉJÀ sa propre copie de la page : c'est elle qu'il
     * fait glisser sous le doigt, et c'est ce qui rend le geste
     * instantané. En répondant `fetch(requete)`, on la lui reprenait :
     * il repartait chercher la page sur le réseau, et pendant ce
     * temps-là il n'y avait rien à peindre — le fond anthracite du site,
     * nu, puis la page. Sur un téléphone en 4G, cela dure.
     *
     * LA RAISON D'ÊTRE DE CETTE RÈGLE — « une page HTML gardée désigne
     * des scripts qui n'existent plus après une mise en ligne » — reste
     * ENTIÈREMENT VRAIE, et rien n'y touche : elle interdit de RANGER
     * une page dans NOTRE cache, et on n'en range toujours aucune. Le
     * navigateur, lui, ne garde pas une page pour la resservir plus
     * tard : il garde CELLE QU'IL VIENT D'AFFICHER, avec les scripts
     * qu'elle a réellement chargés. Les deux n'ont rien à voir.
     *
     * COMMENT ON RECONNAÎT UN RETOUR, SANS RIEN DEVINER : une
     * navigation d'historique demande sa page en « force-cache » —
     * c'est la spécification qui l'impose, et c'est lisible ici.
     * Un navigateur qui ne le poserait pas retombe simplement sur le
     * comportement d'avant : rien ne casse.
     *
     * ⚠️ ET HORS LIGNE ? Un retour hors ligne est mieux servi par le
     * navigateur (il a la page) que par notre page « hors ligne ». Une
     * navigation NEUVE, elle, garde son repli inchangé.
     */
    if (requete.cache === "force-cache" || requete.cache === "only-if-cached") {
      return;
    }
    event.respondWith(
      fetch(requete).catch(() =>
        caches
          .open(VERSION)
          .then((cache) => cache.match(PAGE_HORS_LIGNE))
          //  §1 (nº 479) — LE TROU DU DÉFAUT A EST BOUCHÉ ICI : si la
          //  page « hors ligne » manque au cache, on rend le dernier
          //  recours écrit en tête de ce fichier. Cette branche ne peut
          //  plus rendre `undefined`, donc plus produire l'écran
          //  d'échec du navigateur.
          .then((horsLigne) => horsLigne || pageDeSecours())
          .catch(() => pageDeSecours())
      )
    );
    return;
  }

  // 2) Autres fichiers statiques (scripts, styles, images de contenu,
  //    polices) : le cache d'abord (rapidité), le réseau sinon. On ne
  //    regarde QUE le cache de la version courante — et celui-ci a été
  //    vidé à l'activation de cette version : il ne peut donc contenir
  //    que des fichiers de la mise en ligne courante.
  const estStatique =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/") ||
    requete.destination === "image" ||
    requete.destination === "style" ||
    requete.destination === "script" ||
    requete.destination === "font";

  if (estStatique) {
    event.respondWith(
      caches
        .open(VERSION)
        .then((cache) =>
          cache.match(requete).then((enCache) => {
            if (enCache) return enCache;
            return fetch(requete).then((reponse) => {
              /*  §1 (nº 686) — LE 404 QUI DIT QUE NOUS SOMMES PÉRIMÉS.
                  Voir `seSoigner` : on purge et l'on se désinscrit, de
                  sorte que le rechargement suivant reparte propre. */
              if (reponse && reponse.status === 404 && estFichierDuProgramme(url)) {
                seSoigner();
              }
              /*  §1 (nº 479) — ON NE GARDE QUE CE QUI EST BON (défaut
                  B) : une 404 rendue pendant les secondes d'une mise en
                  ligne n'est plus mémorisée, donc plus resservie
                  ensuite. La copie est prise AVANT de rendre la
                  réponse — un corps ne se lit qu'une fois. */
              if (peutEtreGardee(reponse)) {
                const copie = reponse.clone();
                cache.put(requete, copie).catch(() => {});
              }
              return reponse;
            });
          })
        )
        /*  §1 (nº 479) — LE FILET (défaut C) : si le réseau flanche ou
            si le cache refuse de s'ouvrir, on tente une dernière fois
            le réseau nu, et l'on rend une réponse d'erreur LISIBLE
            plutôt qu'une promesse rejetée — qui, elle, casse la
            ressource et souvent la page avec. */
        .catch(() =>
          fetch(requete).catch(() => new Response("", { status: 504 }))
        )
    );
  }
});
