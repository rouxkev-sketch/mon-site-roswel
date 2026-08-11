/**
 * LA MÉMOIRE « UN COMPTE S'EST DÉJÀ CONNECTÉ ICI »
 * =================================================
 * Un simple drapeau — valeur « 1 », rien d'autre : AUCUNE donnée
 * personnelle. Il sert à adapter les mots de l'interface au visiteur
 * qui revient :
 *  - le bouton du compte dit « Se connecter » au lieu de « Rejoindre »
 *    (la formule d'invitation est réservée à qui n'a jamais eu de
 *    compte ici) ;
 *  - la page /devenir-tatoueur s'ouvre sur l'onglet « Me connecter »
 *    au lieu de « Créer mon compte ».
 *
 * ⚠️ IL VIT DANS UN COOKIE, PLUS DANS LE STOCKAGE LOCAL (nº 203-§1a).
 * Le stockage local n'est lisible QUE par le navigateur : le serveur
 * rendait donc toujours « Rejoindre », et le bon libellé n'arrivait
 * qu'après l'hydratation — le bouton changeait sous les yeux à chaque
 * retour à l'accueil, et sa largeur poussait le bloc central de la
 * barre. Un COOKIE, lui, voyage avec la requête : le serveur lit le
 * drapeau (mise en page du groupe tatouage) et rend le bon bouton du
 * PREMIER coup. L'ancien drapeau du stockage local est encore LU
 * (navigateurs d'avant cette passe) et recopié en cookie au premier
 * passage — la transition se fait toute seule.
 */

/** Le nom du cookie — importé par la mise en page (serveur). */
export const COOKIE_DEJA_CONNECTE = "yokofolio-deja-connecte";

/** L'ancien drapeau du stockage local — lu en héritage seulement. */
const CLE_DEJA_CONNECTE = "yokofolio-deja-connecte";

/** Dix ans : la mémoire d'un navigateur, pas une session. */
const DUREE_COOKIE = 60 * 60 * 24 * 365 * 10;

export function souscrireStockage(rappel: () => void) {
  window.addEventListener("storage", rappel);
  return () => window.removeEventListener("storage", rappel);
}

export function lireDejaConnecte(): boolean {
  try {
    if (
      document.cookie
        .split("; ")
        .some((cookie) => cookie === `${COOKIE_DEJA_CONNECTE}=1`)
    ) {
      return true;
    }
    // L'HÉRITAGE : le drapeau posé avant la nº 203 vivait ici.
    return localStorage.getItem(CLE_DEJA_CONNECTE) === "1";
  } catch {
    // Stockage indisponible (navigation privée stricte) : on garde
    // simplement les formules d'invitation.
    return false;
  }
}

/** Pose le drapeau — appelé par chaque session connectée, et au
    premier passage d'un navigateur qui portait l'ancien drapeau. */
export function marquerDejaConnecte() {
  try {
    document.cookie = `${COOKIE_DEJA_CONNECTE}=1; max-age=${DUREE_COOKIE}; path=/; SameSite=Lax`;
  } catch {
    // Cookies refusés : tant pis pour la mémoire, rien à faire.
  }
  try {
    localStorage.setItem(CLE_DEJA_CONNECTE, "1");
  } catch {
    // Stockage indisponible : le cookie suffit.
  }
}
