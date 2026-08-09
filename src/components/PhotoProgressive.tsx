"use client";

import { useState } from "react";
import { PHOTO_MINIATURE, PHOTO_PORTFOLIO } from "@/config/tatouage";

/**
 * UNE PHOTO QUI ARRIVE EN DEUX TEMPS
 * ===================================
 * Un tatoueur peut avoir des dizaines de photos par style. Les
 * télécharger toutes en 1080 × 1350 à l'ouverture d'une fiche, c'est
 * plusieurs mégaoctets — sur un téléphone en 4G, la page est morte
 * avant d'être vue.
 *
 * LA RÈGLE, ICI ET NULLE PART AILLEURS :
 *  1. LA MINIATURE D'ABORD (320 × 400, ~25 ko). Elle est affichée
 *     tout de suite, étirée : c'est flou, mais c'est immédiat, et le
 *     cadrage est EXACTEMENT celui de la grande (elles sont découpées
 *     ensemble — voir RecadreurPhoto) ;
 *  2. LA PLEINE RÉSOLUTION ENSUITE, et SEULEMENT pour la photo qu'on
 *     REGARDE (`pleineResolution`). Elle se fond par-dessus dès
 *     qu'elle est prête ;
 *  3. UNE FOIS CHARGÉE, ELLE RESTE. Revenir en arrière dans le
 *     carrousel ne retélécharge rien.
 *
 * LE CARROUSEL, LUI, décide QUELLES photos existent à l'écran : la
 * courante et ses deux voisines. Les autres n'ont même pas de balise
 * <img> — donc aucune requête. C'est la deuxième moitié de la tenue
 * en charge, et elle vit dans CarrouselPortfolio.
 *
 * Les images sont servies telles quelles (URL de stockage ou SVG de
 * démonstration) : `next/image` n'apporterait rien ici — la découpe et
 * les deux tailles sont déjà faites au dépôt.
 */
export function PhotoProgressive({
  miniature,
  url,
  alt,
  pleineResolution,
  classe = "",
  prioritaire = false,
}: {
  miniature: string;
  url: string;
  alt: string;
  /** Vrai pour la photo affichée : c'est elle, et elle seule, qui
      demande la pleine résolution. */
  pleineResolution: boolean;
  classe?: string;
  /** La toute première photo de la fiche : elle ne doit pas attendre
      le défilement (`loading="eager"`). */
  prioritaire?: boolean;
}) {
  const [nette, setNette] = useState(false);
  /** Une fois demandée, la grande image RESTE montée : repasser devant
      la photo ne relance aucun téléchargement. */
  const [demandee, setDemandee] = useState(pleineResolution);

  /* AJUSTER L'ÉTAT PENDANT LE RENDU — le motif que React recommande
     quand un état dépend d'une propriété (le même que le zoom de
     RecadreurPhoto) : pas d'effet, donc pas de rendu perdu, et
     surtout pas de première image affichée à tort. */
  const [urlPrecedente, setUrlPrecedente] = useState(url);
  if (url !== urlPrecedente) {
    // Image différente : on repart du flou.
    setUrlPrecedente(url);
    setDemandee(pleineResolution);
    setNette(false);
  } else if (pleineResolution && !demandee) {
    setDemandee(true);
  }

  const memeImage = miniature === url;

  return (
    <>
      {/* LA MINIATURE — étirée, donc adoucie tant que la grande n'est
          pas là. Elle disparaît sous la grande, jamais avant. */}
      {!memeImage && (
        /* eslint-disable-next-line @next/next/no-img-element --
           image déjà découpée et servie telle quelle (stockage ou SVG
           de démonstration) : rien à optimiser au vol. */
        <img
          src={miniature}
          alt=""
          aria-hidden="true"
          draggable={false}
          loading={prioritaire ? "eager" : "lazy"}
          fetchPriority={prioritaire ? "high" : undefined}
          decoding="async"
          width={PHOTO_MINIATURE.largeur}
          height={PHOTO_MINIATURE.hauteur}
          className={`${classe} ${nette ? "opacity-0" : "opacity-100"}
                      transition-opacity duration-300`}
        />
      )}

      {(demandee || memeImage) && (
        /* eslint-disable-next-line @next/next/no-img-element --
           voir ci-dessus. */
        <img
          src={url}
          alt={alt}
          draggable={false}
          loading={prioritaire ? "eager" : "lazy"}
          fetchPriority={prioritaire ? "high" : undefined}
          decoding="async"
          width={PHOTO_PORTFOLIO.largeur}
          height={PHOTO_PORTFOLIO.hauteur}
          onLoad={() => setNette(true)}
          className={`${classe} ${
            memeImage || nette ? "opacity-100" : "opacity-0"
          } transition-opacity duration-300`}
        />
      )}
    </>
  );
}
