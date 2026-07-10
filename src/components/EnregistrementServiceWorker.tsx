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
      navigator.serviceWorker.register("/sw.js").catch(() => {
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
