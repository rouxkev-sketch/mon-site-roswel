/**
 * LA DISPOSITION DE LA MOSAÏQUE (smartphone) — deux colonnes ou une
 * ==================================================================
 * Le bouton rond de la barre fixe bascule la grille entre :
 *  - « deux » : deux colonnes façon Instagram (le défaut, toujours) ;
 *  - « une »  : une image par ligne, bord à bord, textes agrandis.
 *
 * LE CHOIX EST MÉMORISÉ d'une visite à l'autre (stockage local du
 * navigateur — aucune donnée personnelle, juste un mot). Le magasin
 * suit le modèle de deja-connecte : une valeur, un événement, et
 * `useSyncExternalStore` côté composants — le serveur, lui, rend
 * toujours « deux » (il ne connaît pas le navigateur).
 *
 * Seuls les VRAIS MOBILES voient le bouton : sur un ordinateur, la
 * valeur reste « deux » pour toujours.
 */

const CLE = "yokofolio-disposition-grille";
const EVENEMENT = "yokofolio-disposition-grille-changee";

export type DispositionGrille = "deux" | "une";

/** La disposition en cours — « deux » tant que rien n'est mémorisé. */
export function lireDisposition(): DispositionGrille {
  try {
    return window.localStorage.getItem(CLE) === "une" ? "une" : "deux";
  } catch {
    return "deux"; // stockage refusé : le défaut, sans bruit
  }
}

/** Ce que voit le serveur (et la première peinture) : le défaut. */
export function lireDispositionServeur(): DispositionGrille {
  return "deux";
}

/** Bascule et prévient tous les abonnés (grille, cartes, bouton). */
export function basculerDisposition() {
  try {
    window.localStorage.setItem(
      CLE,
      lireDisposition() === "une" ? "deux" : "une"
    );
  } catch {
    // Stockage refusé : la bascule vivra le temps de la page.
  }
  window.dispatchEvent(new Event(EVENEMENT));
}

/** Abonnement pour `useSyncExternalStore` (autre onglet compris). */
export function souscrireDisposition(rappel: () => void) {
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener("storage", rappel);
  return () => {
    window.removeEventListener(EVENEMENT, rappel);
    window.removeEventListener("storage", rappel);
  };
}
