"use client";

import { useEffect } from "react";
//  §1 (nº 495) — le millésime, en constante : plus aucune lecture du
//  DOM dans l'identité du service worker (voir la note, plus bas).
import { MILLESIME_SCRIPT } from "@/lib/millesime-script";

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
        //  nº 357 — LE NU TOTAL (nº 354) se décide ici, côté client : la
    //  racine est prérendue et ne lit plus le cookie. Une lecture,
    //  rien d'autre, et le composant se tait.
    if (document.cookie.indexOf("yf_nu_total=1") >= 0) return;
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "production") {
      // ⚠️ L'EMPREINTE DE COMPILATION DANS L'ADRESSE. Sans elle,
      // `/sw.js` est identique d'une mise en ligne à l'autre : le
      // navigateur garde l'ancien service worker, et donc son ancien
      // cache. Avec elle, chaque mise en ligne installe un service
      // worker neuf, qui efface tous les caches précédents en
      // s'activant (voir public/sw.js).
      const version = process.env.NEXT_PUBLIC_VERSION_SITE ?? "1";
      /*  §1 (nº 479) — LE MILLÉSIME REJOINT L'EMPREINTE. L'empreinte
          (l'heure de la compilation) garantit qu'il y a bien un
          programme NEUF à chaque mise en ligne ; le millésime, lui,
          rend le nom du cache LISIBLE dans les outils du navigateur —
          « yokofolio-<empreinte>-<millésime> » se rapproche du
          « script nº N » qu'affiche la sonde, et l'on voit d'un coup
          d'œil quelle version est réellement servie.
          ██ §1 (nº 495) — IL NE SE LIT PLUS SUR <html> ██
          ------------------------------------------------------------
          LE DÉFAUT, ET IL ÉTAIT GRAVE : cette ligne valait
          `document.documentElement.dataset.versionScript ?? "0"`. Elle
          suppose que le script d'avant peinture a DÉJÀ tourné — or il
          vit dans un layout ENFANT, donc plus bas dans le document,
          tandis que ce composant-ci est monté dans le layout RACINE.
          Sur une page STREAMÉE (toutes les routes dynamiques : le
          jumeau `/complet`, `/accueil-recherche`), l'effet peut
          s'exécuter AVANT que l'analyseur n'atteigne le script. La
          lecture rendait alors `undefined`, le repli `"0"` entrait
          dans l'ADRESSE du programme, et le navigateur voyait un
          service worker NEUF : installation, purge de TOUS les caches,
          prise de main, `controllerchange` — et le rechargement
          ci-dessous. Au chargement suivant le millésime était lisible,
          l'adresse redevenait `…-<millésime>`, donc encore un
          programme « neuf » : le cycle se refermait, et chaque tour
          rechargeait la page en interrompant tout ce qui était en
          train d'arriver — les photos comprises.
          LE REMÈDE : le millésime est une CONSTANTE DE COMPILATION
          (lib/millesime-script), lue ici comme dans le script. Il ne
          peut plus manquer, il ne peut plus valoir « 0 », et
          l'identité du programme ne dépend plus de l'ordre d'arrivée
          des morceaux du document. */
      const millesime = MILLESIME_SCRIPT;
      /*  ██ §1 (nº 479) — LE RECHARGEMENT, UNE FOIS ET UNE SEULE ██
          POURQUOI IL FAUT EN AVOIR UN : le nouveau programme prend la
          main IMMÉDIATEMENT (`skipWaiting` + `clients.claim`, voir
          public/sw.js) — c'est ce qui évite qu'un ancien cache survive
          à la mise en ligne. Mais cela veut dire qu'une page OUVERTE,
          servie par l'ancienne version, se retrouve pilotée par le
          programme neuf : elle demandera plus tard des fichiers de
          l'ancienne compilation, qui n'existent plus. La recharger une
          fois la remet d'aplomb, et c'est le seul moment où le site se
          recharge tout seul.
          ⚠️ LES TROIS GARDE-FOUS CONTRE LA BOUCLE, et ils comptent :
           1. ON N'AGIT QUE S'IL Y AVAIT DÉJÀ UN CONTRÔLEUR AU DÉPART.
              `controllerchange` se déclenche AUSSI à la toute première
              visite, quand le programme s'installe pour la première
              fois — recharger là serait un rechargement gratuit à
              chaque nouveau visiteur. On note donc l'état AVANT
              d'écouter : rien à remplacer, rien à recharger.
           2. UNE SEULE FOIS PAR ONGLET, gravé dans la mémoire de
              session : même si l'événement se répétait, le second
              passage ne fait rien. La mémoire de session meurt avec
              l'onglet — le prochain déploiement aura donc de nouveau
              droit à son unique rechargement.
           3. UN DRAPEAU DE MODULE en plus, pour les deux événements qui
              arriveraient dans le même souffle, avant que l'écriture ne
              soit relue.
          Un `location.reload()` ne crée AUCUNE entrée d'historique :
          la règle nº 332-§1 n'est pas concernée. */
      const CLE_RECHARGE = "yf:sw-recharge";
      const avaitUnControleur = Boolean(navigator.serviceWorker.controller);
      let dejaRecharge = false;
      const auChangementDeProgramme = () => {
        if (!avaitUnControleur || dejaRecharge) return;
        dejaRecharge = true;
        try {
          if (sessionStorage.getItem(CLE_RECHARGE) === "1") return;
          sessionStorage.setItem(CLE_RECHARGE, "1");
        } catch {
          //  Sans mémoire de session (navigation privée stricte), le
          //  drapeau de module ci-dessus reste le garde-fou : un seul
          //  rechargement pour la vie de ce document.
        }
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        auChangementDeProgramme
      );
      navigator.serviceWorker
        .register(`/sw.js?v=${version}-${millesime}`)
        .catch(() => {
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
