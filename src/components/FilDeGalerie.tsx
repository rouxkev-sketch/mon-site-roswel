"use client";

import { useLayoutEffect, useRef } from "react";
import { MARGES_EN_TETE_DE_FIL, PiedDeFil } from "@/components/CarteFil";
import { PhotoDeCarte, TAILLES_CARTE } from "@/components/PhotoDeCarte";
import { TitreDeGalerie } from "@/components/PortfolioDeLAffiche";
import { GOUTTIERE_DU_FIL } from "@/components/GrilleTatoueurs";
import { CADRE_PHOTO_PORTFOLIO, FOND_RESERVE_PHOTO } from "@/config/tatouage";
import { defilerSansGeste } from "@/lib/defilement-programme";
import type { PhotoGalerie } from "@/lib/photo-tatoueur";
import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * ██ LE FIL D'UNE GALERIE — LA VUE PHOTO OUVERTE DEPUIS L'ONGLET
 * PORTFOLIO D'UN PROFIL, AU DOIGT (nº 863-§3) ██
 * ==================================================================
 * DÉCISION DU PROPRIÉTAIRE, À LA LETTRE : depuis l'onglet Portfolio, la
 * vue photo n'est plus UNE photo qu'on fait glisser, c'est LA GALERIE
 * ENTIÈRE, empilée — chaque photo est une carte, au-dessus et en dessous
 * de celle qu'on a touchée, et l'on fait défiler VERTICALEMENT pour voir
 * les autres ; la vue s'ouvre positionnée sur la photo touchée.
 *
 * LA CARTE, DE HAUT EN BAS — et rien n'y est dessiné pour l'occasion :
 *  a. LE TITRE ET LE SOUS-TITRE DE LA GALERIE d'où vient la photo
 *     (« TATTOOS » / « Blackwork • Black ») — `TitreDeGalerie`, le
 *     composant même qui les écrit sur le profil : même couleur, même
 *     corps, même graisse, parce que c'est le même marquage. Posé dans
 *     LA BOÎTE DE L'EN-TÊTE DU FIL (`MARGES_EN_TETE_DE_FIL`, CarteFil) :
 *     seize pixels de côté, douze au-dessus de l'image — la carte a la
 *     forme d'une carte du fil, avec un autre en-tête ;
 *  b. L'IMAGE — pleine largeur, le format 4:5 du site
 *     (`CADRE_PHOTO_PORTFOLIO`), la réserve grise
 *     (`FOND_RESERVE_PHOTO`), et l'écriture unique de l'image d'une
 *     carte (`PhotoDeCarte`). UNE photo par carte : le glissement
 *     horizontal n'a plus d'objet, la galerie se lit de haut en bas ;
 *  c. LE PIED DU FIL (`PiedDeFil`) : signaler, les vues, le fanion de
 *     CETTE photo, son partage. Pas de points : une carte n'a qu'une
 *     photo, et le pied ne les dessine que s'il y en a plusieurs.
 *
 * LA LIGNE « Blackwork • Black » QUI VIVAIT SOUS LE PIED (nº 376, puis
 * nº 862) N'EXISTE PAS ICI, c'est la consigne : le titre est monté
 * au-dessus de l'image, il n'a pas à se répéter dessous.
 *
 * ██ L'OUVERTURE SUR LA PHOTO TOUCHÉE ██
 * ------------------------------------------------------------------
 * Au montage — après la mise en page, AVANT la peinture
 * (`useLayoutEffect`) — la page est posée pour que LA CARTE TOUCHÉE
 * PRENNE EXACTEMENT LA PLACE DE LA PREMIÈRE au repos : on défile de la
 * distance qui sépare les deux cartes dans le document, ni plus ni
 * moins. Rien n'est lu de la barre ni des marges de la page — la
 * première carte est déjà posée où la page la pose, et la touchée vient
 * s'y substituer. La pose passe par `defilerSansGeste` : ce n'est pas
 * un geste du doigt, la barre ne doit pas s'y replier (nº 154-§6A), et
 * la garde de position (nº 427) tient la pose contre les recalages qui
 * suivent l'arrivée des images.
 * ⚠️ LA POSE EN HAUT DE LA nº 742 (au geste, dans FicheTatoueur) reste
 * en place et passe AVANT celle-ci : elle protège la galerie qu'on
 * quitte du zéro qui ne lui est pas destiné ; celle-ci la remplace dès
 * que la carte existe. Un RETOUR vers cette vue (le navigateur, après
 * un passage par le profil) est rendu par la mémoire de navigation du
 * site, qui pose sa place après ce composant et l'emporte.
 * ⚠️ AU DOIGT SEULEMENT (règle nº 60, `hidden mobile:block`) : le web
 * n'ouvre jamais une vue photo depuis l'onglet Portfolio — une vignette
 * y change la photo de l'affiche sans naviguer (nº 306). Une adresse
 * portant la consigne, ouverte au web, montre la fiche ordinaire ; ce
 * bloc y est rendu masqué, et ses images différées ne partent pas.
 */
export function FilDeGalerie({
  tatoueur,
  photos,
  indiceOuvert,
  nature,
  titre,
  styleLabel,
  cheminDe,
  metier,
  vues,
}: {
  tatoueur: Tatoueur;
  /** LA GALERIE ENTIÈRE, dans l'ordre de l'artiste — la série de la
      photo touchée (style, catégorie, rendu), celle que le carrousel
      de la vue photo faisait glisser. */
  photos: PhotoGalerie[];
  /** Le rang de la photo touchée : la vue s'ouvre sur sa carte, et
      c'est elle seule dont l'image ne se diffère pas. */
  indiceOuvert: number;
  /** Le surtitre — « Tattoos », « Flash » (CATEGORIES_EXPLORER). */
  nature: string;
  /** Le titre de la galerie — « Blackwork • Black » (`titreDeGalerie`). */
  titre: string;
  /** Le nom du style, pour le texte de remplacement des images — la
      même phrase que le carrousel de la fiche (« … 's portfolio — … »). */
  styleLabel: string;
  /** L'adresse que le partage d'une carte envoie : celle de SA photo
      (`cheminDuCarrousel`, avec la photo). */
  cheminDe: (photo: PhotoGalerie) => string;
  /** Le style montré, pour le message pré-rempli du partage. */
  metier: string;
  vues?: number | null;
}) {
  const carteOuverte = useRef<HTMLLIElement | null>(null);
  const premiereCarte = useRef<HTMLLIElement | null>(null);
  useLayoutEffect(() => {
    const carte = carteOuverte.current;
    const premiere = premiereCarte.current;
    if (!carte || !premiere || carte === premiere) return;
    //  La distance entre les deux cartes dans le document — arrondie au
    //  pixel : la garde de position (nº 427) défend un nombre entier,
    //  et c'est le même qu'on pose.
    const haut = Math.round(
      carte.getBoundingClientRect().top - premiere.getBoundingClientRect().top
    );
    if (haut <= 0) return;
    defilerSansGeste(
      { top: haut, left: 0 },
      "gallery feed — opened on the touched photo (no. 863)"
    );
    //  Une seule pose, à l'ouverture : l'indice ne bouge plus ensuite.
  }, []);

  /** Le texte de remplacement d'une photo — la phrase du carrousel de
      la fiche (CarrouselPortfolio, `texteDe`), mot pour mot. */
  const texteDe = (photo: PhotoGalerie) =>
    `${tatoueur.nom}'s portfolio — ${styleLabel}${
      photo.legende ? ` · ${photo.legende}` : ""
    }`;

  return (
    <div data-fil-de-galerie="" className="hidden mobile:block mobile:-mx-4">
      {/*  LA GOUTTIÈRE EST CELLE DU FIL DES RÉSULTATS (`GOUTTIERE_DU_FIL`,
           GrilleTatoueurs) : les cartes s'y détachent de vingt-quatre
           pixels, comme les cartes d'une liste de résultats au doigt. */}
      <ul className={`flex flex-col ${GOUTTIERE_DU_FIL}`}>
        {photos.map((photo, rang) => {
          const ouverte = rang === indiceOuvert;
          return (
            <li
              key={photo.cle}
              data-carte-de-galerie={rang}
              data-carte-ouverte={ouverte ? "" : undefined}
              ref={ouverte ? carteOuverte : rang === 0 ? premiereCarte : undefined}
            >
              <div className={MARGES_EN_TETE_DE_FIL}>
                <TitreDeGalerie nature={nature} titre={titre} />
              </div>
              <div
                data-cadre-de-galerie=""
                className={`relative w-full ${CADRE_PHOTO_PORTFOLIO} overflow-hidden`}
              >
                <span aria-hidden="true" className={FOND_RESERVE_PHOTO} />
                <PhotoDeCarte
                  url={photo.miniature}
                  urlPleine={photo.url}
                  tailles={TAILLES_CARTE}
                  alt={texteDe(photo)}
                  /*  LA CARTE OUVERTE NE SE DIFFÈRE PAS : c'est elle qu'on
                      regarde à l'arrivée. Les autres attendent qu'on
                      défile jusqu'à elles. */
                  chargement={ouverte ? "eager" : "lazy"}
                  priorite={ouverte ? "high" : undefined}
                  classe="relative w-full h-full object-cover"
                />
              </div>
              <PiedDeFil
                tatoueur={tatoueur}
                photos={[photo]}
                indice={0}
                //  Une seule photo par carte : le pied ne dessine aucun
                //  point, et n'a donc jamais de rang à poser.
                surRang={() => {}}
                cheminAPartager={cheminDe(photo)}
                metier={metier}
                vues={vues}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
