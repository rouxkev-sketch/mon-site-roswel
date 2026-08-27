/**
 * ██ nº 443 — LA VUE PHOTOTHÈQUE (« sans texte ») EST SUPPRIMÉE ██
 * ==================================================================
 * CE QU'ELLE ÉTAIT (nº 140 → 442) : une seconde façon de regarder la
 * mosaïque — badge, portrait, nom et adresse masqués, les photos
 * seules. Elle vivait dans l'adresse (« ?texte=sans »), dans un cookie
 * par surface (`yf_texte`, lu par le serveur du jumeau et de « Ma
 * sélection »), et se basculait par un rond de la barre
 * (BoutonPhototheque, supprimé à cette passe).
 *
 * LA DÉCISION DU PROPRIÉTAIRE (passe nº 443) : UNE SEULE MISE EN
 * PAGE — les cartes AVEC leur texte, partout, web comme mobile. Les
 * ronds sont retirés des trois barres (barre web, barre mobile,
 * « Ma sélection »).
 *
 * ⚠️ POURQUOI CE MODULE RESTE, NEUTRALISÉ, AU LIEU DE DISPARAÎTRE :
 * ses lecteurs sont nombreux (les pages serveur, la barre qui bâtit
 * des adresses, la grille, « Ma sélection ») et la GARDE de la passe
 * exige qu'un visiteur qui avait MÉMORISÉ « sans texte » retombe
 * proprement sur la mise en page standard :
 *  · `phototequeDuCookie` répond FAUX quoi que dise le cookie — le
 *    serveur (recherche/page.tsx, mes-favoris/page.tsx) rend
 *    donc TOUJOURS les cartes avec texte, vieux cookie ou pas ;
 *  · `lirePhototheque` répond FAUX — le navigateur dit la même chose
 *    que le serveur, aucun écart d'hydratation possible ;
 *  · un vieux lien « /?texte=sans » est IGNORÉ proprement (le
 *    paramètre reste reconnu par l'accueil comme un réglage
 *    d'affichage, voir _accueil/rendu.tsx — il ne déclenche ni
 *    recherche ni erreur, il ne fait plus rien) ;
 *  · `reprendrePhototheque` NETTOIE les cookies obsolètes des deux
 *    surfaces (expiration immédiate) — la mémoire morte ne traîne pas.
 * Les écritures (`poserPhototheque`, `basculerPhototheque`) sont des
 * gestes vides : plus aucun bouton ne les appelle, et un appel oublié
 * ne pourrait rien rétablir.
 */

import { cleDeSurface, type SurfaceAffichage } from "@/lib/surface-affichage";

/** Le paramètre d'adresse d'hier — encore RECONNU (un vieux lien ne
    doit pas casser), plus jamais ÉCRIT ni obéi. */
export const PARAMETRE_TEXTE = "texte";

/** Le cookie d'hier — plus jamais écrit ; nettoyé au passage. */
export const COOKIE_TEXTE = "yf_texte";
export const TEXTE_SANS = "sans";
export const TEXTE_AVEC = "avec";

/** Les deux surfaces qui avaient chacune leur cookie (nº 263-§1). */
const SURFACES: SurfaceAffichage[] = ["recherche", "selection"];

/** LE NOM DU COOKIE D'UNE SURFACE — gardé pour les pages serveur qui
    le lisent encore (leur lecture passe par `phototequeDuCookie`,
    qui répond faux : lire un cookie mort ne coûte rien). */
export function cleCookieTexte(surface: SurfaceAffichage): string {
  return cleDeSurface(COOKIE_TEXTE, surface);
}

/**
 * nº 443 — TOUJOURS FAUX. C'est l'unique porte du serveur vers cette
 * vue : la fermer ici ferme tout — un visiteur au vieux cookie
 * « sans » reçoit la mise en page standard dès le HTML.
 * ⚠️ PURE, et sans `window` : le serveur l'appelle.
 */
export function phototequeDuCookie(
  _valeurCookie: string | undefined | null
): boolean {
  return false;
}

/** nº 443 — le seul travail restant : NETTOYER la mémoire obsolète.
    Appelée par l'accueil à chaque rendu servi (IndexTatoueurs). */
export function reprendrePhototheque() {
  for (const surface of SURFACES) {
    try {
      const cle = cleCookieTexte(surface);
      if (
        document.cookie.split("; ").some((m) => m.startsWith(`${cle}=`))
      ) {
        //  La même politique que l'écriture d'origine (path=/,
        //  samesite=lax), l'âge en moins : expiration immédiate.
        document.cookie = `${cle}=; path=/; max-age=0; samesite=lax`;
      }
    } catch {
      //  Cookies refusés : il n'y a rien à nettoyer non plus.
    }
  }
}

/** nº 443 — TOUJOURS FAUX : les cartes gardent leur texte, partout.
    (La surface n'importe plus — la réponse est la même pour toutes.) */
export function lirePhototheque(_surface?: SurfaceAffichage): boolean {
  return false;
}

/** nº 443 — un geste vide : la vue n'existe plus, rien à poser. */
export function poserPhototheque(_voulue: boolean) {
  //  Volontairement vide (voir l'en-tête du module).
}

/** nº 443 — un geste vide, comme `poserPhototheque`. */
export function basculerPhototheque() {
  //  Volontairement vide (voir l'en-tête du module).
}

/** nº 443 — la valeur ne change plus jamais : il n'y a rien à
    écouter. `useSyncExternalStore` accepte un abonnement muet — la
    lecture (`lirePhototheque`) est constante et stable. */
export function souscrirePhototheque(_rappel: () => void) {
  return () => {
    //  Rien à défaire : rien n'a été posé.
  };
}
