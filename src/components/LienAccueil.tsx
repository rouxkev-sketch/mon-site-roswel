"use client";

import Link from "next/link";
import {
  declarerArriveeEnHaut,
  declarerDepartVouluVersLAccueil,
} from "@/lib/navigation-session";

/**
 * ██ §4 (nº 475) — LE LIEN QUI RAMÈNE À L'ACCUEIL, ET QUI LE DÉCLARE ██
 * ==================================================================
 * POURQUOI IL EXISTE. Un lien vers « / » qui part SANS RIEN DÉCLARER
 * est repris par la chaîne de restitution comme s'il s'agissait d'un
 * RETOUR : elle rend alors la place mémorisée de l'accueil — le bas de
 * la page, là où le visiteur l'avait quitté. C'est le défaut relevé
 * pour la loupe (nº 468) et, à cette passe, pour la sortie confirmée
 * de la garde de saisie. Or aller à l'accueil depuis un bouton est une
 * navigation EN AVANT : elle arrive EN HAUT.
 *
 * CE COMPOSANT NE CRÉE AUCUN MÉCANISME : il pose, au clic, LES DEUX
 * DÉCLARATIONS QUI EXISTENT DÉJÀ — celles du logo et de la loupe —, et
 * elles se complètent exactement là où l'autre s'arrête :
 *  · `declarerDepartVouluVersLAccueil` (nº 429) vit en MÉMOIRE DE
 *    SESSION : elle SURVIT à un rechargement de document. C'est elle
 *    qui couvre le repli du routeur en navigation de document (nº
 *    428/430 — la frontière du prérendu de « / ») et qui, du même
 *    geste, empêche le filet de réparation de renvoyer le visiteur
 *    vers la recherche qu'il vient de quitter ;
 *  · `declarerArriveeEnHaut` (nº 446) vit en MÉMOIRE DE MODULE : elle
 *    meurt avec le document, mais elle est LUE par DefilementEnHaut et
 *    CONSOMMÉE par MemoireNavigation — c'est elle qui couvre la
 *    navigation douce, celle qui garde le document en vie.
 * Aucune des deux n'est un frein : la navigation part exactement comme
 * avant, et une déclaration non utilisée expire seule (8 s et 3 s).
 *
 * ⚠️ CE QU'IL NE FAUT PAS LUI FAIRE PORTER : un VRAI RETOUR vers
 * l'accueil (bouton « précédent », geste, fermeture de surface) ne
 * déclare RIEN et doit continuer de restituer sa position. Ce
 * composant est réservé aux gestes qui vont EN AVANT vers l'accueil.
 *
 * ⚠️ UNE SEULE ENTRÉE D'HISTORIQUE (nº 332-§1) : c'est un `<Link>`
 * ordinaire — une navigation, une entrée ; le retour depuis l'accueil
 * ramène en un appui (nº 332-§4).
 */
export function LienAccueil({
  children,
  className,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <Link
      href="/"
      aria-label={ariaLabel}
      className={className}
      onClick={() => {
        declarerDepartVouluVersLAccueil();
        declarerArriveeEnHaut();
      }}
    >
      {children}
    </Link>
  );
}
