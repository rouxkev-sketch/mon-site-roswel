"use client";

import { useEffect } from "react";

/**
 * ██ nº 791 — LA DÉSINSCRIPTION DU SERVICE WORKER ██
 * ==================================================================
 * CE COMPOSANT REMPLACE `EnregistrementServiceWorker`, ET IL FAIT
 * L'INVERSE : au lieu d'installer un programme d'arrière-plan, il
 * retire celui que les navigateurs des visiteurs ont encore.
 *
 * POURQUOI LE SERVICE WORKER EST PARTI : décision de l'enquête nº 738.
 * Il a servi de vieilles pages à Safari pendant une journée entière et
 * rendu le diagnostic impossible — on ne savait plus si l'on regardait
 * le site ou une copie qu'il gardait. Le site n'a pas besoin de lui :
 * la vitesse vient du cache mondial de Vercel (nº 782) et des fichiers
 * versionnés de Next.
 *
 * ⚠️ ON NE PEUT PAS SE CONTENTER DE NE PLUS L'ENREGISTRER, et c'est
 * tout le point de ce fichier. Un service worker déjà installé
 * continue de tourner tout seul, indéfiniment : ne plus appeler
 * `register` n'a AUCUN effet sur les navigateurs qui l'ont déjà. Sans
 * la désinscription ci-dessous, les visiteurs d'avant la nº 791
 * garderaient l'ancien comportement — et l'ancien cache — pendant des
 * mois.
 *
 * ⚠️ DEUX VOIES, ET AUCUNE NE SUFFIT SEULE (voir aussi public/sw.js) :
 *  · CELLE-CI agit tout de suite, dès que le code de la page tourne ;
 *  · LA PIERRE TOMBALE (`public/sw.js`) agit sans notre code, quand le
 *    navigateur revérifie le programme de lui-même. Elle rattrape le
 *    cas où l'ancien programme sert une PAGE ANCIENNE : ce vieux
 *    code-là ne connaît pas ce fichier-ci, il réenregistre `/sw.js` —
 *    et tombe sur la pierre tombale, qui l'achève.
 *
 * ⚠️ ET LES CACHES AVEC : la désinscription retire le programme, pas
 * ce qu'il avait rangé. On vide donc l'entrepôt nous-mêmes. Aucun
 * autre mécanisme du site n'utilise l'API `caches` — l'entrepôt entier
 * appartenait au service worker, il part entier.
 *
 * ⚠️ AUCUN RECHARGEMENT. L'ancien composant en provoquait un à chaque
 * changement de programme (nº 479) parce qu'une page servie par
 * l'ancienne version se retrouvait pilotée par la neuve. Ici il n'y a
 * plus de version neuve : le programme s'en va, la page continue sa
 * vie, et le rechargement serait gratuit.
 *
 * ⚠️ CE COMPOSANT EST TEMPORAIRE, comme la pierre tombale. Il pourra
 * partir avec elle quand tous les visiteurs d'avant la nº 791 seront
 * repassés — disons dans un an. Le retirer plus tôt laisserait des
 * programmes vivants chez ceux qui ne sont pas revenus.
 */
export function DesinscriptionServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    /*  L'ENTREPÔT DE L'ANCIEN PROGRAMME. `caches` peut manquer (vieux
        navigateur, contexte non sécurisé) — d'où la garde. */
    const purger = async () => {
      if (typeof caches === "undefined") return;
      try {
        const noms = await caches.keys();
        await Promise.all(noms.map((nom) => caches.delete(nom)));
      } catch {
        //  Le ménage rate : la désinscription tient quand même.
      }
    };

    /*  ██ L'ORDRE DES DEUX VOIES, ET POURQUOI IL N'EST PAS LIBRE ██
        ------------------------------------------------------------------
        LE DÉFAUT MESURÉ AU BANC, avec sa cause : le premier jet
        appelait `unregister()` tout de suite, puis purgeait. Résultat —
        le programme partait, MAIS SON CACHE RESTAIT, intact, visite
        après visite. DEUX faits l'expliquent, et il fallait les deux :
         1. `unregister()` retire l'enregistrement SUR-LE-CHAMP, ce qui
            ANNULE la mise à jour en cours : la pierre tombale, qui
            était en train de s'installer, n'atteint jamais son
            activation — donc ne purge jamais ;
         2. un programme désinscrit CONTINUE DE PILOTER le document déjà
            ouvert jusqu'à sa fermeture. Il voit donc encore passer les
            requêtes de ce chargement-ci (morceaux de programme,
            préparations de route) et les RANGE — après notre purge.
            Purger depuis un document qu'il pilote est une course
            perdue d'avance.
        L'ORDRE, DÉSORMAIS, et chaque étape a sa raison :
         1. `update()` D'ABORD. Le navigateur va chercher `/sw.js`, y
            trouve la pierre tombale, l'installe. Elle prend la main
            (`clients.claim`), vide TOUS les caches et se désinscrit —
            et à partir de là plus rien ne pilote le document, donc plus
            rien ne re-remplit. C'est la voie propre, et elle fait le
            travail en entier (éprouvée seule au banc) ;
         2. `unregister()` ENSUITE, et seulement sur ce qui reste. C'est
            le filet : si la pierre tombale n'a pas pu être récupérée
            (réseau coupé, relais qui répond mal), le programme part
            quand même ;
         3. PURGER pour finir, et à chaque chargement. Une fois qu'aucun
            programme ne pilote plus, la purge tient. Elle ne coûte rien
            quand il n'y a rien : `caches.keys()` rend une liste vide.
        ⚠️ EN DÉVELOPPEMENT AUSSI, et c'est voulu : l'atelier a pu garder
        un programme d'une session de travail précédente. La règle est la
        même partout — il n'y a plus de service worker. */
    let vivant = true;
    const faireLeMenage = async () => {
      try {
        const enregistres = await navigator.serviceWorker.getRegistrations();
        await Promise.all(enregistres.map((sw) => sw.update().catch(() => {})));
        if (!vivant) return;
        const restants = await navigator.serviceWorker.getRegistrations();
        await Promise.all(restants.map((sw) => sw.unregister().catch(() => {})));
      } catch {
        //  Un navigateur qui refuse de répondre ne doit pas empêcher la
        //  page de vivre.
      }
      if (vivant) await purger();
    };

    void faireLeMenage();
    return () => {
      vivant = false;
    };
  }, []);

  return null; // Ce composant n'affiche rien à l'écran
}
