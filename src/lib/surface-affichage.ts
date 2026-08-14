/**
 * LA SURFACE D'AFFICHAGE — QUELLE PAGE PARLE ? (nº 263-§1)
 * ==================================================================
 * LE DÉFAUT, relevé sur l'appareil : retirer le texte des cartes sur
 * la page de recherche le retirait AUSSI sur « Ma sélection », et la
 * disposition en pleine largeur suivait pareillement. La cause est la
 * nº 257 : la mémoire de mise en page (cookie `yf_texte`, filet de
 * session de la disposition, valeur de module des magasins) était
 * UNIQUE et globale — posée pour supprimer le saut de page, elle
 * faisait parler les deux pages d'une seule voix.
 *
 * LE REMÈDE : DEUX MÉMOIRES, une par surface —
 *  · « recherche »  : l'accueil, la page de recherche et tout le
 *    parcours des fiches ;
 *  · « selection »  : « Ma sélection » (/mes-favoris).
 * Chacune se souvient de son propre état, et l'une ne touche jamais
 * l'autre. LE MÉCANISME N'EST PAS DOUBLÉ, LA CLÉ L'EST : les magasins
 * (vue-phototheque, disposition-grille) gardent leur écriture, et
 * suffixent leurs clés par la surface — `cleDeSurface`, la SEULE
 * écriture de cette correspondance, côté navigateur comme côté
 * serveur.
 *
 * ⚠️ LA CLÉ DE LA RECHERCHE RESTE NUE (`yf_texte`, pas
 * `yf_texte-recherche`) : les cookies déjà posés chez les visiteurs
 * restent valides — seule « Ma sélection » reçoit une clé neuve.
 */

export const SURFACE_RECHERCHE = "recherche";
export const SURFACE_SELECTION = "selection";
export type SurfaceAffichage =
  | typeof SURFACE_RECHERCHE
  | typeof SURFACE_SELECTION;

/** Le chemin de « Ma sélection » — celui de la page serveur. */
const CHEMIN_SELECTION = "/mes-favoris";

/** La surface d'un chemin d'adresse. PURE : le serveur peut l'appeler. */
export function surfaceDuChemin(chemin: string): SurfaceAffichage {
  return chemin === CHEMIN_SELECTION ||
    chemin.startsWith(`${CHEMIN_SELECTION}/`)
    ? SURFACE_SELECTION
    : SURFACE_RECHERCHE;
}

/** La surface de la page en cours — côté navigateur seulement ; la
    recherche en repli (le serveur, lui, nomme sa surface). */
export function surfaceCourante(): SurfaceAffichage {
  try {
    return surfaceDuChemin(window.location.pathname);
  } catch {
    return SURFACE_RECHERCHE;
  }
}

/** LA CLÉ D'UNE MÉMOIRE D'AFFICHAGE POUR UNE SURFACE — une écriture,
    deux valeurs : la clé nue pour la recherche (les mémoires déjà
    posées survivent), suffixée pour « Ma sélection ». */
export function cleDeSurface(cle: string, surface: SurfaceAffichage): string {
  return surface === SURFACE_SELECTION ? `${cle}-selection` : cle;
}
