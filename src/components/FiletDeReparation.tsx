"use client";

import { useEffect } from "react";

/**
 * ██ §2 (nº 546) — LE FILET DE RÉPARATION ██
 * ==================================================================
 * CE QU'IL RATTRAPE, EN UNE PHRASE : un document ANCIEN qui tourne
 * contre une mise en ligne NEUVE. La page s'affiche, elle réagit même
 * — mais dès qu'elle réclame un morceau de programme qui n'existe plus
 * sous ce nom, elle reste sans réponse, et une partie du site cesse de
 * fonctionner sans rien dire.
 *
 * ██ §1 (nº 791) — IL VIT DÉSORMAIS SEUL, ET C'EST LUI LA PROTECTION ██
 * ------------------------------------------------------------------
 * Il partageait un fichier avec l'enregistrement du service worker,
 * et cela entretenait une confusion qu'il faut lever : CE FILET N'A
 * JAMAIS DÉPENDU DU SERVICE WORKER. Le programme d'arrière-plan ne
 * rangeait aucune page (§1 nº 479) ; ce que ce filet rattrape, c'est
 * la copie que LE NAVIGATEUR garde du document — celle du retour
 * d'historique, que le §2 de la nº 336 lui laisse volontairement pour
 * que le geste reste instantané. Cette copie-là ne nous appartient
 * pas : on ne peut pas l'empêcher, on peut seulement s'en relever.
 * Le service worker est parti à la nº 791 ; ce filet, lui, reste — et
 * il reste la seule chose qui protège une mise en ligne côté visiteur.
 *
 * CE QUI DÉCLENCHE LA RÉPARATION, ET RIEN D'AUTRE : l'échec de
 * chargement d'un MORCEAU DE PROGRAMME du site — un fichier de
 * `/_next/static/`. C'est le seul signal qui dise sans ambiguïté « les
 * fichiers servis ne vont pas avec le document qui tourne ». Il arrive
 * par deux portes, et on écoute les deux :
 *  · l'erreur d'un `script` ou d'un `link` qui n'a pas pu charger
 *    (elle ne remonte QU'EN CAPTURE, elle ne bulle pas) ;
 *  · la promesse rejetée d'un morceau chargé à la demande —
 *    « ChunkLoadError », « Loading chunk … failed », « Failed to fetch
 *    dynamically imported module ».
 *
 * CE QUI NE LA DÉCLENCHE PAS, ET C'EST AUSSI IMPORTANT :
 *  · une IMAGE manquante — l'adresse ne mène pas à `/_next/static/`
 *    et l'élément n'est ni `script` ni `link` ;
 *  · une ERREUR D'API — `fetch` ne lève pas d'erreur de ressource, et
 *    le message ne porte aucune des marques ci-dessus ;
 *  · une LENTEUR — tant que le fichier finit par arriver, aucune
 *    erreur n'est levée ; et s'il n'arrive pas du tout faute de
 *    réseau, la réparation est de toute façon sans risque : elle
 *    recharge une fois et le drapeau interdit d'insister ;
 *  · une erreur de NOTRE code — elle ne parle pas de morceau.
 *
 * ⚠️ JAMAIS DE BOUCLE, ET C'EST LA CONTRAINTE ABSOLUE. Trois
 * garde-fous :
 *  1. UNE SEULE FOIS PAR ONGLET, gravé dans la mémoire de session. Si
 *     la réparation ne suffit pas, on s'arrête là : le visiteur voit
 *     un site abîmé, jamais un site qui clignote sans fin.
 *  2. UN DRAPEAU DE MODULE en plus, pour les erreurs qui arrivent en
 *     rafale dans le même souffle — dix morceaux manquants ne font
 *     qu'une réparation.
 *  3. SANS MÉMOIRE DE SESSION (navigation privée stricte), on ne
 *     répare PAS : pas de compteur, pas de tentative. Un site dégradé
 *     vaut mieux qu'un site qui tourne en rond.
 * ⚠️ ET LE DRAPEAU S'EFFACE au premier chargement qui se passe bien
 * (voir plus bas) : la mise en ligne SUIVANTE aura donc de nouveau
 * droit à son unique réparation.
 *
 * CE QUE LE VISITEUR VOIT : la page se recharge une fois. Rien n'est
 * affiché, rien n'est demandé — il n'y a pas de décision à lui
 * confier, et une phrase d'excuse serait plus longue que la panne.
 */
export function FiletDeReparation() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

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
      /*  §1 (nº 791) — ON VIDE QUAND MÊME L'ENTREPÔT AVANT DE RECHARGER.
          Le service worker est parti, mais un visiteur qui n'est pas
          encore revenu peut avoir des caches de l'ancien programme —
          et c'est précisément lui qui risque de servir un morceau
          périmé. L'échec de cette purge n'empêche pas le rechargement :
          c'est lui qui répare, le reste est du ménage. */
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
