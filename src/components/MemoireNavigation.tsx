"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  noterDepartOnglet,
  noterPageOnglet,
  noterPageVisitee,
} from "@/lib/navigation-session";
import {
  lireRequeteCourante,
  lireRequeteServeur,
  souscrireAdresse,
} from "@/lib/adresse-courante";

/**
 * ██ LE JOURNAL DES PAGES — CE QU'IL RESTE DE LA MÉMOIRE (nº 889) ██
 * ==================================================================
 * CE QU'IL FAISAIT JUSQU'À LA nº 888, ET QUI EST PARTI. Ce composant
 * était l'autorité du site sur LES POSITIONS : il écrivait la place de
 * chaque adresse au fil du défilement, la relisait à l'arrivée, la
 * rendait au retour, et arbitrait entre trois signaux (traversée
 * d'historique, document restitué, demande explicite). Six cents
 * lignes, huit passes de correctifs — et le défaut que tout cela
 * poursuivait n'était pas là (voir docs/DEFILEMENT-889-INVENTAIRE.md :
 * c'était le routeur de Next qui GARDE la position quand le haut du
 * contenu est encore visible, comportement documenté de `<Link>`).
 * LA DÉCISION DU PROPRIÉTAIRE (nº 889) : le navigateur restitue les
 * retours tout seul (`history.scrollRestoration = "auto"`, nº 363), et
 * le site ne mémorise plus AUCUNE position de page.
 *
 * ██ CE QU'IL FAIT ENCORE, ET QUI N'A JAMAIS ÉTÉ DU DÉFILEMENT ██
 * ------------------------------------------------------------------
 * 1. LE JOURNAL DES PAGES VISITÉES (`noterPageVisitee`) — persistant,
 *    lu par le bouton retour d'une fiche.
 * 2. LE JOURNAL D'ONGLET (`noterPageOnglet`) — la reprise de session
 *    du script d'avant peinture y lit la dernière VRAIE page.
 *    ⚠️ UNE FENÊTRE DE FICHE N'EST PAS UNE PAGE : elle se pose
 *    par-dessus la mosaïque et écrit son adresse par `pushState`
 *    (drapeau `fenetreFiche`) — l'inscrire ferait rouvrir au réveil
 *    une fiche que personne n'a demandée.
 * 3. LA NOTE DE DÉPART DU DOCUMENT (`noterDepartOnglet`, nº 428) —
 *    elle met l'adresse d'onglet à l'heure au `pagehide`, pour que le
 *    document suivant puisse RÉPARER un repli du routeur (Next
 *    recharge parfois sur « / » nu, critères perdus).
 *
 * ⚠️ ON N'ÉCRIT QUE SUR UNE ADRESSE STABLE (nº 154) : le chemin vient
 * du ROUTEUR, les critères du NAVIGATEUR, et les deux ne se mettent
 * pas à jour dans le même rendu. Inscrire l'entre-deux écrasait la
 * vraie page précédente. `souscrireAdresse` surveille les deux portes
 * (le navigateur ET le code) — voir lib/adresse-courante.
 *
 * N'affiche rien.
 */
export function MemoireNavigation() {
  const pathname = usePathname();
  //  Les critères, relus à CHAQUE écriture d'adresse — y compris
  //  celles du code (`replaceState` d'une recherche), qui n'émettent
  //  aucun `popstate`.
  const requete = useSyncExternalStore(
    souscrireAdresse,
    lireRequeteCourante,
    lireRequeteServeur
  );

  useEffect(() => {
    const auDepartDuDocument = () => {
      noterDepartOnglet();
    };
    window.addEventListener("pagehide", auDepartDuDocument);
    return () => {
      window.removeEventListener("pagehide", auDepartDuDocument);
    };
  }, []);

  useEffect(() => {
    if (pathname !== window.location.pathname) return;
    const url = pathname + window.location.search;
    noterPageVisitee(url);
    if (
      !(window.history.state as { fenetreFiche?: boolean } | null)?.fenetreFiche
    ) {
      noterPageOnglet(url);
    }
  }, [pathname, requete]);

  return null;
}
