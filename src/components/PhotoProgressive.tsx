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
 *     REGARDE (`pleineResolution`). Elle se pose par-dessus dès
 *     qu'elle est prête, SANS AUCUNE TRANSITION (nº 217-§5) : deux
 *     images superposées au pixel près n'ont rien à se fondre, et le
 *     moindre fondu se voit — c'est lui qui scintillait ;
 *  3. UNE FOIS CHARGÉE, ELLE RESTE. Revenir en arrière dans le
 *     carrousel ne retélécharge rien.
 *
 * LE CARROUSEL, LUI, décide QUELLES photos existent à l'écran : la
 * courante et ses DEUX voisines de chaque côté. Les autres n'ont même
 * pas de balise <img> — donc aucune requête. C'est la deuxième moitié
 * de la tenue en charge, et elle vit dans CarrouselPortfolio.
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
  } else if (pleineResolution && !demandee) {
    setDemandee(true);
  }

  const memeImage = miniature === url;

  return (
    <>
      {/* LA MINIATURE — étirée, donc adoucie tant que la grande n'est
          pas là. Elle RESTE EN PLACE, à pleine opacité, sous la grande.
          ⚠️ ELLE NE S'EFFACE PLUS EN FONDU (nº 210-§3), et c'est la
          cause du scintillement en fin de défilement : deux images
          opaques dont les opacités se croisent laissent, à mi-course,
          voir LE FOND SOMBRE à travers les deux — l'image s'assombrit
          puis « le voile se lève » d'un coup à la fin de la
          transition. La grande se pose maintenant par-dessus une
          miniature qui ne bouge pas : elle la recouvre exactement, il
          n'y a plus rien à traverser, et plus aucun creux de
          luminosité. */}
      {!memeImage && (
        /*  §4 (nº 276) — L'APERÇU EST FLOUTÉ, STATIQUEMENT. Le relevé
            du propriétaire : « d'abord très pixelisées, puis nettes »
            — la miniature de 320 px, étirée sur un cadre qui en
            affiche jusqu'à trois fois plus (pixels physiques, écrans
            denses compris), se lisait en mosaïque grossière. Un flou
            posé UNE FOIS transforme cette étape en simple réservation
            adoucie : plus aucun pixel apparent, sur aucune connexion.
            ⚠️ AUCUNE TRANSITION, ni ici ni sur la grande (nº 217-§5 :
            tout fondu à l'instant où une photo s'immobilise
            scintille) : la grande, opaque, recouvre l'aperçu d'un
            coup, exactement comme avant.
            L'ENVELOPPE PORTE LE CADRE (les classes du parent) et rogne
            le débordement du flou : un flou échantillonne au-delà de
            ses bords — sans `overflow-hidden` et sans la légère
            surtaille (`scale-105`), l'image montrerait un liseré
            sombre sur tout son tour. */
        <span aria-hidden="true" className={`overflow-hidden ${classe}`}>
          {/* eslint-disable-next-line @next/next/no-img-element --
              image déjà découpée et servie telle quelle (stockage ou
              SVG de démonstration) : rien à optimiser au vol. */}
          <img
            src={miniature}
            alt=""
            draggable={false}
            //  §4 (nº 276) — l'aperçu de la photo REGARDÉE part tout
            //  de suite : c'est lui qui tient la place pendant que la
            //  grande arrive. Les voisines restent en `lazy`.
            loading={prioritaire || demandee ? "eager" : "lazy"}
            fetchPriority={prioritaire ? "high" : undefined}
            decoding="async"
            width={PHOTO_MINIATURE.largeur}
            height={PHOTO_MINIATURE.hauteur}
            className="h-full w-full scale-105 object-cover blur-md"
          />
        </span>
      )}

      {(demandee || memeImage) && (
        /* eslint-disable-next-line @next/next/no-img-element --
           image déjà découpée et servie telle quelle (stockage ou SVG
           de démonstration) : rien à optimiser au vol. */
        <img
          src={url}
          alt={alt}
          draggable={false}
          /*  §4 (nº 276) — LA PLEINE RÉSOLUTION NE PERD PLUS UN TOUR.
              Elle était `lazy` partout sauf la première photo : le
              navigateur la relâchait derrière tout le reste alors
              qu'elle n'est MONTÉE que pour la photo qu'on REGARDE
              (`demandee`) — c'est elle qu'on attend, elle part donc
              `eager` et en priorité haute, EN MÊME TEMPS que son
              aperçu. Seul cas encore `lazy` : la démonstration
              (`memeImage`, une seule image) sur une photo non
              regardée. */
          loading={prioritaire || demandee ? "eager" : "lazy"}
          fetchPriority={prioritaire || demandee ? "high" : undefined}
          decoding="async"
          width={PHOTO_PORTFOLIO.largeur}
          height={PHOTO_PORTFOLIO.hauteur}
          /*  ⚠️ PLUS AUCUNE TRANSITION D'OPACITÉ (nº 217-§5) — c'est le
              dernier reste du fondu que la nº 210 croyait avoir
              supprimé, et c'est lui qui a ramené le scintillement.
              Il se déclenchait PILE au moment où la photo s'immobilise
              (l'indice change, cette photo devient « celle qu'on
              regarde », la pleine résolution est demandée, l'image
              naît à `opacity-0` puis monte en 300 ms) : quelque chose
              apparaissait donc brutalement à l'arrêt, exactement comme
              décrit.
              CE QUI LA REMPLACE : rien. Une image qui n'a pas fini de
              charger ne peint RIEN — la miniature, immobile dessous,
              reste seule visible ; quand la grande est prête, elle la
              recouvre exactement, au pixel près (même découpe, même
              cadrage). Il n'y a plus aucun instant où l'on voit deux
              images à la fois, donc plus rien à faire scintiller. */
          className={classe}
        />
      )}
    </>
  );
}
