"use client";

/**
 * ██ LA BALISE DE POPULARITÉ — UNE PAR FICHE ET PAR DOCUMENT ██
 * ==================================================================
 * (§2 nº 725.)
 *
 * LE DÉFAUT, RELEVÉ PAR LE PROPRIÉTAIRE À LA SONDE VITESSE : ouvrir une
 * fiche depuis une carte envoyait DEUX FOIS `/api/tatoueur/clic` —
 * 513 ms et 481 ms sur le même écran. Deux émetteurs, chacun légitime
 * de son côté :
 *  · `CarteTatoueur` signale le CLIC, au départ. C'est le seul qui
 *    parle quand la fiche s'ouvre EN FENÊTRE par-dessus la grille
 *    (au web) — là, aucune page de fiche ne se monte ;
 *  · `CompteurConsultation` signale la CONSULTATION, au montage de la
 *    page de fiche. C'est le seul qui parle quand on arrive par un
 *    lien partagé, un moteur de recherche ou l'adresse tapée.
 * Aucun des deux ne peut donc partir : ils couvrent des chemins que
 * l'autre ne voit pas. Ce qui était en trop, c'est qu'ils parlent
 * DEUX FOIS quand les deux chemins se rejoignent — carte, puis fiche.
 *
 * ⚠️ CE N'ÉTAIT PAS UNE ERREUR DE COMPTAGE, ET IL FAUT LE DIRE : la
 * base dédoublonne par VISITEUR, par FICHE et par JOUR (index unique de
 * la migration nº 7, insertion qui ignore les doublons). Deux envois
 * comptaient déjà pour un. Ce qui se paie, c'est le voyage : deux
 * requêtes au lieu d'une, sur l'écran le plus chargé du site.
 *
 * LE VERROU VIT DANS LE MODULE, PAS DANS UN COMPOSANT — c'est la leçon
 * de la nº 713 : la barre et les cartes sont rendues par CHAQUE page,
 * donc un `useRef` meurt à chaque navigation douce et laisserait
 * l'envoi repartir. Cette mémoire-ci vit avec le DOCUMENT, la durée
 * exacte de ce qu'elle garde.
 * ⚠️ ET UN DOCUMENT NEUF REPART À ZÉRO, c'est voulu : rechargement,
 * onglet neuf, retour de session. La base tranche de toute façon.
 */

/** Les fiches déjà signalées dans CE document. */
const dejaSignalees = new Set<string>();

/**
 * Signale une consultation, une seule fois par fiche et par document.
 * Rend `true` si l'envoi est parti — pour que l'appelant puisse le
 * dire à une sonde, jamais pour qu'il en dépende.
 */
export function signalerConsultation(slug: string): boolean {
  if (!slug) return false;
  if (dejaSignalees.has(slug)) return false;
  dejaSignalees.add(slug);
  try {
    const corps = new Blob([JSON.stringify({ slug })], {
      type: "application/json",
    });
    //  `sendBeacon` : l'envoi part sans retarder la navigation et
    //  survit au départ de la page. Le `fetch` n'est qu'un repli pour
    //  les navigateurs qui ne la connaissent pas.
    if (!navigator.sendBeacon?.("/api/tatoueur/clic", corps)) {
      void fetch("/api/tatoueur/clic", {
        method: "POST",
        body: JSON.stringify({ slug }),
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
    return true;
  } catch {
    //  Navigateur sans balise : cette consultation ne sera pas comptée,
    //  et c'est tout — jamais une gêne pour la navigation.
    return false;
  }
}
