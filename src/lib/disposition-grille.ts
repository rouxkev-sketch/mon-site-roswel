/**
 * ██ nº 443 — LA DISPOSITION « UNE COLONNE » (pleine page) EST
 * SUPPRIMÉE ██
 * ==================================================================
 * CE QU'ELLE ÉTAIT (jusqu'à la nº 442) : sur les vrais mobiles, le
 * bouton rond de la barre basculait la mosaïque entre « deux »
 * colonnes (le défaut, façon Instagram) et « une » image par ligne.
 * Elle vivait dans l'adresse (« ?disposition=une »), dans un filet de
 * session par surface, et le serveur du jumeau la lisait pour rendre
 * le bon HTML du premier coup.
 *
 * LA DÉCISION DU PROPRIÉTAIRE (passe nº 443) : UNE SEULE MISE EN
 * PAGE — les cartes côte à côte (deux colonnes) avec leur texte. Le
 * rond de disposition est retiré de la barre mobile, et la barre de
 * recherche se prolonge dans l'espace libéré.
 *
 * ⚠️ POURQUOI CE MODULE RESTE, NEUTRALISÉ (mêmes raisons que
 * lib/vue-phototheque, son jumeau) :
 *  · `lireDisposition` répond TOUJOURS « deux » — la barre qui bâtit
 *    des adresses n'écrit plus jamais le paramètre, la grille rend
 *    toujours la disposition standard, et le serveur du jumeau
 *    (_accueil/rendu.tsx) est aligné sur la même constante ;
 *  · un vieux lien « /?disposition=une » est IGNORÉ proprement (le
 *    paramètre reste reconnu comme un réglage d'affichage — ni
 *    recherche, ni erreur, plus aucun effet) ;
 *  · `reprendreDisposition` NETTOIE le filet de session obsolète des
 *    deux surfaces ;
 *  · L'ARITHMÉTIQUE DE LA MOSAÏQUE N'EST PAS TOUCHÉE : rangées
 *    complètes (nº 226), taille de page et « Voir plus » (nº 425),
 *    graine de mélange — aucun de ces calculs ne lisait la
 *    disposition (elle n'habillait que des classes CSS), et la
 *    constante « deux » est très exactement le chemin que tous les
 *    visiteurs au défaut ont toujours pris.
 */

import { cleDeSurface, type SurfaceAffichage } from "@/lib/surface-affichage";

/** Le paramètre d'adresse d'hier — encore RECONNU, plus jamais écrit. */
export const PARAMETRE_DISPOSITION = "disposition";

export type DispositionGrille = "deux" | "une";

/** Le filet de session d'hier (nº 212-§3) — plus jamais écrit ;
    nettoyé au passage. */
const CLE_SESSION = "yokofolio-disposition-visite";

/** Les deux surfaces qui avaient chacune leur filet (nº 263-§1). */
const SURFACES: SurfaceAffichage[] = ["recherche", "selection"];

/** nº 443 — le seul travail restant : NETTOYER la mémoire obsolète.
    Appelée par l'accueil à chaque rendu servi (IndexTatoueurs). */
export function reprendreDisposition() {
  for (const surface of SURFACES) {
    try {
      sessionStorage.removeItem(cleDeSurface(CLE_SESSION, surface));
    } catch {
      //  Stockage refusé : il n'y a rien à nettoyer non plus.
    }
  }
}

/** nº 443 — TOUJOURS « deux » : la seule disposition qui existe.
    (La surface n'importe plus — la réponse est la même pour toutes.) */
export function lireDisposition(
  _surface?: SurfaceAffichage
): DispositionGrille {
  return "deux";
}

/** nº 443 — un geste vide : la bascule n'existe plus. */
export function poserDisposition(_voulue: DispositionGrille) {
  //  Volontairement vide (voir l'en-tête du module).
}

/** nº 443 — un geste vide, comme `poserDisposition`. */
export function basculerDisposition() {
  //  Volontairement vide (voir l'en-tête du module).
}

/** nº 443 — la valeur ne change plus jamais : il n'y a rien à
    écouter. `useSyncExternalStore` accepte un abonnement muet — la
    lecture (`lireDisposition`) est constante et stable. */
export function souscrireDisposition(_rappel: () => void) {
  return () => {
    //  Rien à défaire : rien n'a été posé.
  };
}
