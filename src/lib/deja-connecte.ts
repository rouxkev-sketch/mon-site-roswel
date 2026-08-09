/**
 * LA MÉMOIRE « UN COMPTE S'EST DÉJÀ CONNECTÉ ICI »
 * =================================================
 * Un simple drapeau dans le stockage local du navigateur — valeur
 * « 1 », rien d'autre : AUCUNE donnée personnelle. Il sert à adapter
 * les mots de l'interface au visiteur qui revient :
 *  - le bouton du compte dit « Se connecter » au lieu de « Montrer
 *    mon travail » (la formule d'invitation est réservée à qui n'a
 *    jamais eu de compte ici) ;
 *  - la page /devenir-tatoueur s'ouvre sur l'onglet « Me connecter »
 *    au lieu de « Créer mon compte ».
 *
 * Il se lit comme un petit magasin externe (useSyncExternalStore) : le
 * serveur répond toujours « non » (il ne connaît pas le navigateur),
 * le navigateur lit la vraie valeur à chaque rendu, et l'événement
 * `storage` tient les AUTRES onglets au courant.
 */

const CLE_DEJA_CONNECTE = "yokofolio-deja-connecte";

export function souscrireStockage(rappel: () => void) {
  window.addEventListener("storage", rappel);
  return () => window.removeEventListener("storage", rappel);
}

export function lireDejaConnecte(): boolean {
  try {
    return localStorage.getItem(CLE_DEJA_CONNECTE) === "1";
  } catch {
    // Stockage local indisponible (navigation privée stricte) : on
    // garde simplement les formules d'invitation.
    return false;
  }
}

/** Le serveur ne connaît pas le navigateur : toujours « non ». */
export function lireDejaConnecteServeur(): boolean {
  return false;
}

/** Pose le drapeau — appelé par chaque session connectée. */
export function marquerDejaConnecte() {
  try {
    localStorage.setItem(CLE_DEJA_CONNECTE, "1");
  } catch {
    // Stockage indisponible : tant pis pour la mémoire, rien à faire.
  }
}
