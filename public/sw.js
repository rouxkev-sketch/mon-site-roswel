/*
 * SERVICE WORKER DE ROSWEL
 * ------------------------
 * Petit programme exécuté par le navigateur, en arrière-plan.
 * Son rôle :
 *  1. mettre en cache les fichiers du site pour un affichage rapide ;
 *  2. afficher une page « hors ligne » si la connexion est coupée.
 *
 * En cas de mise à jour importante du site, augmenter le numéro
 * de VERSION ci-dessous pour forcer le rafraîchissement du cache.
 */

const VERSION = "roswel-v1";
const PAGE_HORS_LIGNE = "/offline.html";

// À l'installation : on met de côté la page « hors ligne »
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.add(PAGE_HORS_LIGNE))
  );
  self.skipWaiting();
});

// À l'activation : on supprime les caches des anciennes versions
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

  // 1) Navigation vers une page : le réseau d'abord (contenu frais),
  //    et si la connexion est coupée → page « hors ligne ».
  if (requete.mode === "navigate") {
    event.respondWith(
      fetch(requete).catch(() =>
        caches
          .match(requete)
          .then((reponse) => reponse || caches.match(PAGE_HORS_LIGNE))
      )
    );
    return;
  }

  // 2) Fichiers statiques (scripts, styles, images, icônes) :
  //    le cache d'abord (rapidité), le réseau sinon.
  const estStatique =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    requete.destination === "image" ||
    requete.destination === "style" ||
    requete.destination === "script" ||
    requete.destination === "font";

  if (estStatique) {
    event.respondWith(
      caches.match(requete).then(
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
