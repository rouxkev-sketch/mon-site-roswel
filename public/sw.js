/*
 * SERVICE WORKER DE YOKOFOLIO
 * ------------------------
 * Petit programme exécuté par le navigateur, en arrière-plan.
 * Son rôle :
 *  1. mettre en cache les fichiers du site pour un affichage rapide ;
 *  2. afficher une page « hors ligne » si la connexion est coupée.
 *
 * Sa VERSION suit automatiquement la compilation (voir plus bas) :
 * il n'y a plus aucun numéro à incrémenter à la main.
 *
 * ⚠️ LES ICÔNES NE SONT JAMAIS MISES EN CACHE ICI. L'ancienne version
 * gardait « pour toujours » toute image déjà vue (cache d'abord, sans
 * revalidation) : une icône d'un ancien produit capturée une fois
 * revenait donc dans l'onglet à chaque visite, même une fois le
 * fichier disparu du projet. Désormais, toute demande d'icône ou de
 * logo part TOUJOURS sur le réseau (le cache ne sert qu'en secours,
 * hors ligne, pour le logo de la page « hors ligne »).
 */

/**
 * ⚠️ LA VERSION VIENT DE LA MISE EN LIGNE, PLUS D'UN NUMÉRO À LA MAIN.
 * Elle était écrite en dur (`yokofolio-v6`), à incrémenter soi-même à
 * chaque mise en ligne. Un oubli, et le cache d'une ancienne version
 * survivait à la nouvelle. Désormais, la page enregistre ce fichier
 * avec l'empreinte de la compilation dans son adresse
 * (`/sw.js?v=…`, voir EnregistrementServiceWorker) : chaque mise en
 * ligne donne donc un service worker NEUF, un cache NEUF, et
 * l'activation efface tous les autres. Plus rien à penser.
 */
const VERSION =
  "yokofolio-" +
  (new URL(self.location.href).searchParams.get("v") || "sans-version");
const PAGE_HORS_LIGNE = "/offline.html";
const LOGO_HORS_LIGNE = "/yokofolio-icone.png";

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

// À l'installation : on met de côté la page « hors ligne » et le
// logo qu'elle affiche (sans bloquer si le logo manque en local)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) =>
      cache
        .add(PAGE_HORS_LIGNE)
        .then(() => cache.add(LOGO_HORS_LIGNE).catch(() => {}))
    )
  );
  self.skipWaiting();
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

  // 0) ICÔNES ET LOGOS : le réseau, TOUJOURS — jamais de copie gardée.
  //    Le cache (où seul le logo yokofolio est rangé, à l'installation)
  //    ne répond qu'en secours, quand la connexion est coupée.
  if (estIcone(url)) {
    event.respondWith(
      fetch(requete).catch(() =>
        caches.open(VERSION).then((cache) => cache.match(requete))
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
        caches.open(VERSION).then((cache) => cache.match(PAGE_HORS_LIGNE))
      )
    );
    return;
  }

  // 2) Autres fichiers statiques (scripts, styles, images de contenu,
  //    polices) : le cache d'abord (rapidité), le réseau sinon. On ne
  //    regarde QUE le cache de la version courante.
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
        .then((cache) => cache.match(requete))
        .then(
          (enCache) =>
            enCache ||
            fetch(requete).then((reponse) => {
              // On garde une copie en cache pour la prochaine fois
              const copie = reponse.clone();
              caches.open(VERSION).then((cache) => cache.put(requete, copie));
              return reponse;
            })
        )
    );
  }
});
