"use client";

import type { CritèresTatouage } from "@/components/MoteurTatouage";

/**
 * LA RECHERCHE EN COURS, LE TEMPS DE LA VISITE
 * =============================================
 * (passe nº 209-§1)
 *
 * LE DÉFAUT. On cherche « réalisme à Lyon », on ouvre une fiche, on
 * touche la loupe de la barre : le moteur s'ouvre VIDE. La fiche n'a
 * pas les critères — ils vivent dans l'adresse de la MOSAÏQUE, et
 * celle de la fiche ne les porte pas. Le moteur repartait donc de
 * zéro, et il fallait tout ressaisir pour affiner.
 *
 * ⚠️ CE N'EST PAS UNE MÉMOIRE PARALLÈLE au sens de la refonte nº 191,
 * et la distinction est nette :
 *  · elle ne décide d'AUCUNE carte. La mosaïque n'affiche que ce que
 *    le serveur a rendu POUR SON ADRESSE, et rien d'autre — cette
 *    mémoire n'est jamais lue là-bas ;
 *  · elle ne réécrit JAMAIS une adresse toute seule. Elle ne fait que
 *    PRÉ-REMPLIR le formulaire d'une page qui n'a pas de critères à
 *    elle. Valider pousse ensuite une adresse, qui décide de tout,
 *    comme toujours ;
 *  · elle meurt avec l'onglet (`sessionStorage`) : une visite qui
 *    commence sur un lien partagé n'hérite de rien.
 *
 * QUI ÉCRIT : l'accueil, quand le serveur lui sert des critères — donc
 * l'adresse, toujours elle. QUI LIT : la barre, sur une page qui n'a
 * pas de critères propres (fiche, page style + ville).
 */

const CLE = "yokofolio-derniere-recherche";
const EVENEMENT = "yokofolio-derniere-recherche-changee";

/** Retenir la recherche que le serveur vient de servir. */
export function memoriserRechercheTatouage(criteres: CritèresTatouage) {
  try {
    sessionStorage.setItem(CLE, JSON.stringify(criteres));
    lue = criteres;
    window.dispatchEvent(new Event(EVENEMENT));
  } catch {
    // Stockage refusé (navigation privée stricte) : le moteur
    // s'ouvrira vide, ce qui était le comportement d'avant.
  }
}

/**
 * LA DERNIÈRE RECHERCHE DE CETTE VISITE — `null` s'il n'y en a pas.
 * ⚠️ LUE UNE SEULE FOIS, et rendue TOUJOURS À L'IDENTIQUE ensuite :
 * c'est l'instantané d'un `useSyncExternalStore`, et ce hook exige une
 * référence stable — un objet reconstruit à chaque lecture ferait
 * boucler React (la leçon de lib/disposition-grille, nº 164).
 */
let lue: Partial<CritèresTatouage> | null | undefined;

function depuisLeStockage(): Partial<CritèresTatouage> | null {
  try {
    const brut = sessionStorage.getItem(CLE);
    if (!brut) return null;
    const valeur = JSON.parse(brut) as Partial<CritèresTatouage> | null;
    //  Une valeur écrite par une version précédente, ou abîmée : on
    //  préfère un moteur vide à un moteur faux.
    return valeur && typeof valeur === "object" ? valeur : null;
  } catch {
    return null;
  }
}

export function lireDerniereRechercheTatouage(): Partial<CritèresTatouage> | null {
  if (lue === undefined) lue = depuisLeStockage();
  return lue;
}

/** Ce que voit le serveur : rien. Il ne connaît pas cette visite. */
export function lireDerniereRechercheServeur(): Partial<CritèresTatouage> | null {
  return null;
}

/** Abonnement pour `useSyncExternalStore`. La mémoire ne change qu'ici
    (ou dans un autre onglet, que l'on ne suit pas : chaque onglet a sa
    propre visite). */
export function souscrireDerniereRecherche(rappel: () => void) {
  const auChangement = () => {
    lue = depuisLeStockage();
    rappel();
  };
  window.addEventListener(EVENEMENT, auChangement);
  return () => window.removeEventListener(EVENEMENT, auChangement);
}
