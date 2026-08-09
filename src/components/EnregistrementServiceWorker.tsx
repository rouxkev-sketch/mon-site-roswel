"use client";

import { useEffect } from "react";

/**
 * Active le "service worker" : un petit programme que le navigateur
 * garde en mémoire pour que Roswel se charge plus vite et reste
 * consultable même avec une connexion instable (c'est ce qui rend
 * le site installable comme une application).
 *
 * Il n'est activé qu'en version finale (site en ligne), jamais
 * pendant le développement, pour éviter d'afficher des pages
 * périmées pendant qu'on travaille.
 */
export function EnregistrementServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "production") {
      // ⚠️ L'EMPREINTE DE COMPILATION DANS L'ADRESSE. Sans elle,
      // `/sw.js` est identique d'une mise en ligne à l'autre : le
      // navigateur garde l'ancien service worker, et donc son ancien
      // cache. Avec elle, chaque mise en ligne installe un service
      // worker neuf, qui efface tous les caches précédents en
      // s'activant (voir public/sw.js).
      const version = process.env.NEXT_PUBLIC_VERSION_SITE ?? "1";
      navigator.serviceWorker.register(`/sw.js?v=${version}`).catch(() => {
        // Si l'activation échoue, le site fonctionne quand même
        // normalement : on ne bloque rien.
      });
    } else {
      // En développement : on désactive tout service worker
      // resté en mémoire d'une session précédente.
      navigator.serviceWorker.getRegistrations().then((liste) => {
        liste.forEach((sw) => sw.unregister());
      });
    }
  }, []);

  return null; // Ce composant n'affiche rien à l'écran
}
