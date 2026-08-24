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

  /**
   * ██ §2 (nº 546) — LE FILET DE RÉPARATION ██
   * ==================================================================
   * CE QU'IL RATTRAPE, EN UNE PHRASE : un document ANCIEN qui tourne
   * contre une mise en ligne NEUVE. La page s'affiche, elle réagit
   * même — mais dès qu'elle réclame un morceau qui n'existe plus sous
   * ce nom, elle reste sans réponse, et une partie du site cesse de
   * fonctionner sans rien dire.
   *
   * POURQUOI LE SERVICE WORKER NE SUFFIT PAS, ET CE N'EST PAS SA
   * FAUTE : il ne range AUCUNE page (public/sw.js, §1 nº 479) et il
   * efface tous les caches des autres versions en s'activant. Mais le
   * NAVIGATEUR garde sa propre copie du document, et le §2 de la
   * nº 336 lui laisse volontairement la main sur les retours
   * d'historique — pour que le geste reste instantané. Cette copie-là
   * ne nous appartient pas ; on ne peut pas l'empêcher, on peut
   * seulement s'en relever.
   *
   * CE QUI DÉCLENCHE LA RÉPARATION, ET RIEN D'AUTRE : l'échec de
   * chargement d'un MORCEAU DE PROGRAMME du site — un fichier de
   * `/_next/static/`. C'est le seul signal qui dise sans ambiguïté
   * « les fichiers servis ne vont pas avec le document qui tourne ».
   * Il arrive par deux portes, et on écoute les deux :
   *  · l'erreur d'un `script` ou d'un `link` qui n'a pas pu charger
   *    (elle ne remonte QU'EN CAPTURE, elle ne bulle pas) ;
   *  · la promesse rejetée d'un morceau chargé à la demande —
   *    « ChunkLoadError », « Loading chunk … failed », « Failed to
   *    fetch dynamically imported module ».
   *
   * CE QUI NE LA DÉCLENCHE PAS, ET C'EST AUSSI IMPORTANT :
   *  · une IMAGE manquante — l'adresse ne mène pas à `/_next/static/`
   *    et l'élément n'est ni `script` ni `link` ;
   *  · une ERREUR D'API — `fetch` ne lève pas d'erreur de ressource,
   *    et le message ne porte aucune des marques ci-dessus ;
   *  · une LENTEUR — tant que le fichier finit par arriver, aucune
   *    erreur n'est levée ; et s'il n'arrive pas du tout faute de
   *    réseau, la réparation est de toute façon sans risque : elle
   *    recharge une fois, la page hors ligne répond, et le drapeau
   *    interdit d'insister ;
   *  · une erreur de NOTRE code — elle ne parle pas de morceau.
   *
   * ⚠️ JAMAIS DE BOUCLE, ET C'EST LA CONTRAINTE ABSOLUE. Trois
   * garde-fous, du même esprit que ceux du rechargement ci-dessus :
   *  1. UNE SEULE FOIS PAR ONGLET, gravé dans la mémoire de session.
   *     Si la réparation ne suffit pas, on s'arrête là : le visiteur
   *     voit un site abîmé, jamais un site qui clignote sans fin.
   *  2. UN DRAPEAU DE MODULE en plus, pour les erreurs qui arrivent en
   *     rafale dans le même souffle — dix morceaux manquants ne font
   *     qu'une réparation.
   *  3. SANS MÉMOIRE DE SESSION (navigation privée stricte), on ne
   *     répare PAS : pas de compteur, pas de tentative. Un site
   *     dégradé vaut mieux qu'un site qui tourne en rond.
   * ⚠️ ET LE DRAPEAU S'EFFACE au premier chargement qui se passe bien
   * (voir plus bas) : la mise en ligne SUIVANTE aura donc de nouveau
   * droit à son unique réparation.
   *
   * CE QUE LE VISITEUR VOIT : la page se recharge une fois, comme elle
   * le fait déjà au moment d'une mise en ligne (nº 479). Rien n'est
   * affiché, rien n'est demandé — il n'y a pas de décision à lui
   * confier, et une phrase d'excuse serait plus longue que la panne.
   */
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (document.cookie.indexOf("yf_nu_total=1") >= 0) return;

    const CLE_REPARATION = "yf:reparation-version";
    let dejaRepare = false;

    //  ⚠️ ON EFFACE LE DRAPEAU DÈS QUE TOUT VA BIEN : ce document-ci a
    //  chargé son programme sans faute, la réparation précédente a donc
    //  abouti (ou n'a jamais été nécessaire). La prochaine mise en
    //  ligne repart avec son essai intact.
    try {
      sessionStorage.removeItem(CLE_REPARATION);
    } catch {
      //  Sans mémoire de session, il n'y a rien à effacer — et la
      //  réparation ne se déclenchera pas non plus (garde-fou nº 3).
    }

    /** L'adresse désigne-t-elle un morceau de programme du site ? */
    const morceauDuSite = (adresse: string) => {
      try {
        const url = new URL(adresse, window.location.href);
        return (
          url.origin === window.location.origin &&
          url.pathname.startsWith("/_next/static/")
        );
      } catch {
        return false;
      }
    };

    /** Ce texte dit-il « un morceau n'a pas pu être chargé » ? */
    const parleDeMorceau = (raison: unknown) => {
      const texte =
        raison instanceof Error
          ? `${raison.name} ${raison.message}`
          : String(raison ?? "");
      return (
        texte.includes("ChunkLoadError") ||
        texte.includes("Loading chunk") ||
        texte.includes("Loading CSS chunk") ||
        texte.includes("Failed to fetch dynamically imported module") ||
        texte.includes("error loading dynamically imported module")
      );
    };

    const reparer = () => {
      if (dejaRepare) return;
      dejaRepare = true;
      try {
        if (sessionStorage.getItem(CLE_REPARATION) === "1") return;
        sessionStorage.setItem(CLE_REPARATION, "1");
      } catch {
        return;
      }
      //  On vide TOUS les caches avant de recharger : le service worker
      //  n'en garde que des fichiers de la mise en ligne courante, mais
      //  s'il en restait un d'une autre, il ne doit pas resservir.
      //  L'échec de cette purge n'empêche pas le rechargement — c'est
      //  lui qui répare, le reste est du ménage.
      const purge =
        typeof caches !== "undefined"
          ? caches
              .keys()
              .then((noms) => Promise.all(noms.map((nom) => caches.delete(nom))))
              .catch(() => undefined)
          : Promise.resolve(undefined);
      purge.then(() => window.location.reload());
    };

    /*  L'ERREUR D'UNE RESSOURCE NE BULLE PAS : elle ne se voit qu'en
        CAPTURE, sur `window`. C'est pourquoi cet écouteur-ci est le
        seul des deux à porter `capture`. */
    const surErreur = (evenement: Event) => {
      const cible = evenement.target;
      if (cible instanceof HTMLScriptElement && morceauDuSite(cible.src)) {
        reparer();
        return;
      }
      if (cible instanceof HTMLLinkElement && morceauDuSite(cible.href)) {
        reparer();
      }
    };
    const surRejet = (evenement: PromiseRejectionEvent) => {
      if (parleDeMorceau(evenement.reason)) reparer();
    };

    window.addEventListener("error", surErreur, true);
    window.addEventListener("unhandledrejection", surRejet);
    return () => {
      window.removeEventListener("error", surErreur, true);
      window.removeEventListener("unhandledrejection", surRejet);
    };
  }, []);

  return null; // Ce composant n'affiche rien à l'écran
}
