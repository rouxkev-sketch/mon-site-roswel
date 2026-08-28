"use client";

import { PHOTO_PORTFOLIO } from "@/config/tatouage";

/**
 * ██ UNE PHOTO ARRIVE EN UNE SEULE FOIS (nº 280-§1) ██
 * ==================================================================
 * ⚠️ L'APERÇU EST SUPPRIMÉ, ENTIÈREMENT ET PARTOUT. Ce composant
 * affichait la MINIATURE (320 × 400) d'abord, étirée sur toute la
 * largeur du cadre, puis posait la pleine résolution par-dessus quand
 * elle arrivait. Résultat, relevé par le propriétaire sur web comme
 * sur smartphone : à l'ouverture d'une fiche ET à CHAQUE photo qu'on
 * fait défiler, l'image apparaissait grossière, puis nette une seconde
 * plus tard. Sur toutes les photos, pas seulement la première.
 *
 * LA DÉCISION, ET ELLE EST JUSTE : Instagram ne fait pas cela, les
 * sites d'annonces non plus. Ils réservent un rectangle sombre, et la
 * photo apparaît d'un coup quand elle est prête. Il n'y a rien à voir
 * entre les deux, donc personne ne voit rien.
 *
 * CE QUI RESTE, ET QUI NE DOIT JAMAIS PARTIR :
 *  · LA RÉSERVATION DE HAUTEUR — les dimensions intrinsèques
 *    déclarées (1080 × 1350) et le cadre 4:5 de la colonne. C'est elle
 *    qui empêche la page de sauter, et elle a coûté plusieurs passes
 *    (nº 226-§3) ;
 *  · LE FOND SOMBRE du cadre, et rien d'autre : aucun flou, aucun
 *    dégradé, aucune animation d'apparition (la règle « pas de fondu
 *    sur une photo » de la nº 217-§5 vaut toujours, et elle n'a plus
 *    rien à interdire ici — il n'y a plus qu'une image).
 *
 * ⚠️ CE QUI N'EST PAS UN APERÇU, et qu'on ne touche donc pas : les
 * CARTES de la mosaïque servent la miniature (320 × 400) et ne la
 * remplacent JAMAIS. Ce n'est pas un affichage en deux temps, c'est la
 * photo définitive d'une vignette de 190 à 390 px — y charger du
 * 1080 × 1350 serait dix fois le poids pour rien.
 *
 * LE CARROUSEL, LUI, décide QUELLES photos existent à l'écran : la
 * courante et ses DEUX voisines de chaque côté. Les autres n'ont même
 * pas de balise <img> — donc aucune requête. C'est la tenue en charge,
 * et elle vit dans CarrouselPortfolio.
 *
 * Les images sont servies telles quelles (URL de stockage ou SVG de
 * démonstration) : `next/image` n'apporterait rien ici — la découpe et
 * les tailles sont faites au dépôt. ⚠️ ET AUCUN `srcset` NI `sizes` :
 * ce serait rouvrir la porte à un fichier plus petit choisi par le
 * navigateur, c'est-à-dire à un aperçu qui ne dit pas son nom.
 */
export function PhotoProgressive({
  url,
  alt,
  pleineResolution,
  classe = "",
  prioritaire = false,
}: {
  url: string;
  alt: string;
  /** Vrai pour la photo affichée. Elle est demandée TOUT DE SUITE
      (`eager`, priorité haute) : c'est celle qu'on regarde. */
  pleineResolution: boolean;
  classe?: string;
  /** La toute première photo de la fiche — elle ne doit attendre
      aucun défilement. */
  prioritaire?: boolean;
}) {
  //  LA PHOTO REGARDÉE PART IMMÉDIATEMENT ; ses voisines attendent le
  //  défilement (`lazy`), ce qui ne se voit pas : elles ne sont pas à
  //  l'écran. Aucune photo affichée n'est donc jamais différée.
  const tout_de_suite = prioritaire || pleineResolution;
  return (
    /* eslint-disable-next-line @next/next/no-img-element --
       image déjà découpée et servie telle quelle (stockage ou SVG de
       démonstration) : rien à optimiser au vol. */
    <img
      src={url}
      alt={alt}
      draggable={false}
      loading={tout_de_suite ? "eager" : "lazy"}
      fetchPriority={tout_de_suite ? "high" : undefined}
      decoding="async"
      //  LA RÉSERVATION : les dimensions intrinsèques du format du site
      //  (voir config/tatouage). Elles ne bougent pas.
      width={PHOTO_PORTFOLIO.largeur}
      height={PHOTO_PORTFOLIO.hauteur}
      /*  §1 (nº 709) — L'ALT NE SE PEINT PLUS DANS LE CADRE. Pendant
          que la photo arrive (ou si elle manque), le navigateur écrit
          le texte `alt` EN CLAIR sur le fond de réserve gris — mesuré
          au banc nº 709 : « Réalisme, 14 portfolios », à moitié coupé
          par le cadre, que le propriétaire prenait pour une fuite du
          squelette. `text-transparent` rend ce texte invisible À
          L'ÉCRAN seulement : l'attribut reste entier pour les
          lecteurs d'écran et les moteurs. */
      className={`text-transparent ${classe}`}
    />
  );
}
