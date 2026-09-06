"use client";

import Link from "next/link";
import { declarerDepartVouluVersLAccueil } from "@/lib/navigation-session";

/** L'accueil. Écrit une fois : le `href` du lien ET l'adresse dont on
    oublie la place doivent désigner la MÊME page — deux chaînes
    finiraient par diverger, et l'oubli porterait alors sur une adresse
    que personne ne sert. */
const ADRESSE_ACCUEIL = "/";

/**
 * ██ §4 (nº 475) — LE LIEN QUI RAMÈNE À L'ACCUEIL, ET QUI LE DÉCLARE ██
 * ==================================================================
 * POURQUOI IL EXISTE. Un lien vers « / » qui part SANS RIEN DÉCLARER
 * était repris par la chaîne de restitution comme s'il s'agissait d'un
 * RETOUR : elle rendait alors la place mémorisée de l'accueil — le bas
 * de la page, là où le visiteur l'avait quitté. C'est le défaut relevé
 * pour la loupe (nº 468) et pour la sortie confirmée de la garde de
 * saisie. Or aller à l'accueil depuis un bouton est une navigation EN
 * AVANT : elle arrive EN HAUT.
 *
 * ██ nº 889 — DEUX DES TROIS DÉCLARATIONS ONT PERDU LEUR OBJET ██
 * ------------------------------------------------------------------
 * Le site ne mémorise plus AUCUNE position de page : il n'y a donc plus
 * de place de l'accueil à oublier (`oublierDefilementDe`, nº 659), ni
 * de restitution à interdire (`declarerArriveeEnHaut`, nº 446). Les
 * deux sont parties. Une navigation vers l'accueil arrive en haut
 * parce que c'est ce que fait toute navigation, désormais.
 *
 * IL EN RESTE UNE, ET ELLE N'A JAMAIS PARLÉ DE DÉFILEMENT :
 * `declarerDepartVouluVersLAccueil` (nº 429) vit en MÉMOIRE DE SESSION
 * et SURVIT à un rechargement de document. C'est elle qui couvre le
 * repli du routeur en navigation de document (nº 428/430 — la
 * frontière du prérendu de « / ») et qui empêche le filet de
 * réparation de renvoyer le visiteur vers la recherche qu'il vient de
 * quitter. Elle n'est pas un frein : la navigation part exactement
 * comme avant, et une déclaration non utilisée expire seule (8 s).
 *
 * ⚠️ UNE SEULE ENTRÉE D'HISTORIQUE (nº 332-§1) : c'est un `<Link>`
 * ordinaire — une navigation, une entrée ; le retour depuis l'accueil
 * ramène en un appui (nº 332-§4).
 *
 * ██ §1 (nº 659, CLOS nº 889) — LA PLACE DE L'ACCUEIL ██
 * ==================================================================
 * LE SYMPTÔME D'ALORS : « Explorer les styles », depuis une page « Ma
 * sélection » vide, atterrissait EN BAS de l'accueil — la place
 * mémorisée de « / » lui était rendue. Ce clic l'oubliait donc
 * explicitement (`oublierDefilementDe`), et une déclaration de plus
 * interdisait la restitution (`declarerArriveeEnHaut`, nº 446).
 * IL N'Y A PLUS DE PLACE MÉMORISÉE (nº 889) : les deux gestes sont
 * partis, et le symptôme avec eux — par disparition de sa cause.
 */
export function LienAccueil({
  children,
  className,
  ariaLabel,
  draggable,
}: {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  /** nº 812 — le logo de la barre passe par ici et garde son
      `draggable={false}` (une image de lien se laisse « traîner » par
      défaut, et un clic légèrement glissé partait en glisser-déposer
      muet au lieu de naviguer). Omis : le défaut du navigateur. */
  draggable?: boolean;
}) {
  return (
    <Link
      href={ADRESSE_ACCUEIL}
      aria-label={ariaLabel}
      className={className}
      draggable={draggable}
      onClick={() => {
        declarerDepartVouluVersLAccueil();
      }}
    >
      {children}
    </Link>
  );
}
