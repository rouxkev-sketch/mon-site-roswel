"use client";

import Link from "next/link";
import {
  declarerArriveeEnHaut,
  declarerDepartVouluVersLAccueil,
  oublierDefilementDe,
} from "@/lib/navigation-session";

/** L'accueil. Écrit une fois : le `href` du lien ET l'adresse dont on
    oublie la place doivent désigner la MÊME page — deux chaînes
    finiraient par diverger, et l'oubli porterait alors sur une adresse
    que personne ne sert. */
const ADRESSE_ACCUEIL = "/";

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
 *
 * ██ §1 (nº 659) — IL MANQUAIT D'OUBLIER LA PLACE DE L'ACCUEIL ██
 * ==================================================================
 * LE SYMPTÔME DU PROPRIÉTAIRE : « Explorer les styles », depuis une
 * page « Ma sélection » vide, atterrit EN BAS de l'accueil.
 *
 * CE QUE LES DEUX DÉCLARATIONS FONT, ET CE QU'ELLES NE FONT PAS. Elles
 * disent « cette arrivée est voulue » à ceux qui écoutent —
 * `DefilementEnHaut` remonte, `MemoireNavigation` s'abstient de
 * restituer. Ce sont deux CONSIGNES, adressées à deux composants, et
 * valables trois et huit secondes. Elles ne touchent PAS à la place
 * mémorisée de l'accueil : `yokofolio:defilement:/` reste écrite, et
 * n'importe quel autre chemin de restitution peut encore la relire —
 * le script d'avant peinture sur une navigation qualifiée « retour »,
 * une demande nommée, un réveil de traversée. Une consigne qui expire
 * ne protège pas une note qui, elle, vit une demi-heure.
 *
 * LE TROISIÈME GESTE : ON OUBLIE LA PLACE DE LA LISTE QUI ARRIVE.
 * C'est le geste nº 2 de `ouvrirLaListeEnHaut` (lib/liste-neuve), et
 * c'est le seul des cinq qui manque ici — les quatre autres touchent au
 * GEL, au défilement ou à une restitution en vol, et il est mesuré
 * (nº 659) qu'appelés depuis ce clic-ci ils ANNULENT la navigation.
 * On prend donc l'écriture qui n'agit que sur la mémoire :
 * `oublierDefilementDe` (lib/navigation-session), un seul
 * `removeItem` — aucune touche au DOM, aucun défilement, rien qui
 * puisse interrompre le routeur.
 *
 * ⚠️ ON OUBLIE LA PLACE DE LA DESTINATION, JAMAIS CELLE DE LA PAGE
 * QU'ON QUITTE : c'est la règle nº 332-§2, mesurée — au moment du
 * clic, l'adresse courante est encore celle du départ. D'où l'adresse
 * passée en clair.
 * ⚠️ ET C'EST CE QUI DISTINGUE UNE NAVIGATION VOULUE D'UN RETOUR : cet
 * oubli est posé PAR LE GESTE, jamais déduit de l'adresse. Un retour
 * arrière ne passe pas par ce composant — il ne trouve donc rien
 * d'effacé, et la restitution de position lui revient intacte (nº 653).
 * ⚠️ CE QUE ÇA COÛTE, ET JE LE DIS : la place mémorisée de l'accueil
 * est perdue par ce clic. C'est voulu — on part explorer, on ne revient
 * pas voir ce qu'on avait laissé. Le retour immédiat, lui, ramène à la
 * page qu'on vient de quitter et n'est pas concerné ; et le premier
 * défilement sur l'accueil réécrit une place neuve.
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
      href={ADRESSE_ACCUEIL}
      aria-label={ariaLabel}
      className={className}
      onClick={() => {
        declarerDepartVouluVersLAccueil();
        declarerArriveeEnHaut();
        //  §1 (nº 659) — et la place de l'accueil est oubliée : plus
        //  rien à restituer, par aucun chemin. Voir la note du §1.
        oublierDefilementDe(ADRESSE_ACCUEIL);
      }}
    >
      {children}
    </Link>
  );
}
