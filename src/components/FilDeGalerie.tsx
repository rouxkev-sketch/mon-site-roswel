"use client";

import { useEffect, useRef, useState } from "react";
import { MARGES_EN_TETE_DE_FIL, PiedDeFil } from "@/components/CarteFil";
import { CarrouselPortfolio } from "@/components/CarrouselPortfolio";
import { PhotoDeCarte, TAILLES_CARTE } from "@/components/PhotoDeCarte";
import {
  TitreDeGalerie,
  type GalerieDuPortfolio,
} from "@/components/PortfolioDeLAffiche";
import { GOUTTIERE_DU_FIL } from "@/components/GrilleTatoueurs";
import { CADRE_PHOTO_PORTFOLIO, FOND_RESERVE_PHOTO } from "@/config/tatouage";
import { cheminDuCarrousel } from "@/lib/photo-tatoueur";
import { titreDeGalerie } from "@/lib/photos-tatoueur";
import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * ██ LE FIL DE GALERIES — LES PAGES PORTFOLIO ET FLASH D'UN PROFIL, AU
 * DOIGT (nº 863-§3, refait nº 866-§1, DEVENU LA PAGE À LA nº 873-§3) ██
 * ==================================================================
 * DÉCISION DU PROPRIÉTAIRE (nº 873) : au doigt, la page Portfolio d'un
 * artiste (`/artist/<nom>/portfolio`) et sa page Flash (`/flash`) SONT
 * ce fil — une carte PAR GALERIE de la catégorie (les styles de
 * tattoos sur l'une, les styles de flashs sur l'autre), empilées de
 * haut en bas dans l'ordre du profil ; DANS chaque carte, on GLISSE
 * pour faire défiler les photos de cette galerie — le mécanisme des
 * cartes de recherche : l'encadré fixe, la pastille « 4/11 », les
 * points de position. Les bandes par style du profil et la page
 * intermédiaire de la nº 866 (le fil ouvert SUR une carte touchée,
 * depuis ces bandes) ont disparu du mobile, code compris : il n'y a
 * plus de galerie « ouverte », plus de photo « touchée », plus de pose
 * de la page sur une carte — la page s'ouvre en haut, ou à sa place
 * rendue par la mémoire de navigation du site, comme toute page.
 *
 * LA CARTE, DE HAUT EN BAS — et rien n'y est dessiné pour l'occasion :
 *  a. LE TITRE ET LE SOUS-TITRE DE LA GALERIE (« TATTOOS » /
 *     « Blackwork • Black ») — `TitreDeGalerie`, le composant même qui
 *     les écrit sur le profil du web : même couleur, même corps, même
 *     graisse, parce que c'est le même marquage. Posés dans LA BOÎTE DE
 *     L'EN-TÊTE DU FIL (`MARGES_EN_TETE_DE_FIL`, CarteFil) : seize
 *     pixels de côté, douze au-dessus de l'image — la carte a la forme
 *     d'une carte du fil, avec un autre en-tête.
 *     ⚠️ SANS L'AVATAR (nº 873-§3) : le rond de quarante que la nº 867-§3
 *     avait posé à gauche du titre est retiré — on est déjà chez cet
 *     artiste, son visage est en tête du profil, et l'en-tête d'une
 *     galerie ne dit que la galerie ;
 *  b. L'IMAGE — l'encadré d'une carte des résultats (CarteTatoueur au
 *     doigt, à la lettre) : pleine largeur, le format 4:5 du site
 *     (`CADRE_PHOTO_PORTFOLIO`), la réserve grise (`FOND_RESERVE_PHOTO`)
 *     et LE CARROUSEL DE LA FICHE EN VARIANTE « CARTE »
 *     (`CarrouselPortfolio`) : défilement natif avec accrochage par
 *     photo, les miniatures seules, la photo suivante chargée quand la
 *     carte approche de l'écran (`approchee`, comme dans la grille), la
 *     pastille allumée d'emblée comme sur une page de résultats
 *     (`eveilPastille="page"`, nº 852). UNE GALERIE D'UNE SEULE PHOTO
 *     garde la même carte avec l'image simple (`PhotoDeCarte`) : pas
 *     de pastille, pas de points — comme une carte à photo unique.
 *     Un toucher sur l'image NE FAIT RIEN : aucune photo n'est un lien
 *     (« Clic sur une photo : rien », nº 873-§3) ;
 *  c. LE PIED DU FIL (`PiedDeFil`) : signaler, les vues, les POINTS de
 *     position au centre (la frise des fiches — il y a plusieurs photos,
 *     le pied les dessine ; une seule, il n'en dessine aucun), le fanion
 *     de LA PHOTO REGARDÉE, son partage (`cheminDuCarrousel`, avec cette
 *     photo). Un rond touché pose le rang, et le carrousel glisse
 *     jusqu'à la photo (nº 217) — le motif de la carte des résultats,
 *     mot pour mot.
 *     ⚠️ PAS EN APERÇU (« Ma fiche ») : on ne se signale pas soi-même,
 *     et l'aperçu n'a ni partage ni fanion depuis toujours (la règle de
 *     la vue photo, FicheTatoueur). La carte y garde son titre, son
 *     image et sa pastille, sans pied.
 *
 * LA LIGNE « Blackwork • Black » QUI VIVAIT SOUS LE PIED (nº 376, puis
 * nº 862) N'EXISTE PAS ICI, c'est la consigne : le titre est monté
 * au-dessus de l'image, il n'a pas à se répéter dessous.
 *
 * ██ LA LISTE DES GALERIES EST CELLE DE LA PAGE ██
 * ------------------------------------------------------------------
 * `galeriesDuPortfolio` (PortfolioDeLAffiche), calculée UNE FOIS par
 * ContenuFiche pour la catégorie de la page et donnée telle quelle au
 * panneau du web comme à ce fil : les styles de A à Z, dans un style
 * les rendus dans l'ordre du site. Trois galeries de tattoos sur le
 * profil du web, trois cartes ici : par construction, pas par accord.
 * Une liste vide ne monte pas ce fil — la page dit « No tattoos yet. »
 * ou « No flash yet. » (ContenuFiche, §4).
 *
 * L'AIR AU-DESSUS : quarante pixels sous le va-et-vient (`mt-10`), la
 * valeur qui ouvre le portfolio du web sous la rangée Profil / Portfolio
 * (PanneauPortfolio) et le bloc du nom sur le profil (nº 870-§5).
 *
 * ⚠️ AU DOIGT SEULEMENT (règle nº 60, `hidden mobile:block`) : le web
 * garde ses galeries par style (PanneauPortfolio). Ce bloc y est rendu
 * masqué, et ses images différées ne partent pas.
 */
export function FilDeGalerie({
  tatoueur,
  galeries,
  metier,
  vues,
  apercu = false,
}: {
  tatoueur: Tatoueur;
  /** Les galeries de la page — une catégorie, dans l'ordre du profil
      (`galeriesDuPortfolio`). */
  galeries: GalerieDuPortfolio[];
  /** Le style montré, pour le message pré-rempli du partage. */
  metier: string;
  vues?: number | null;
  /** L'aperçu « Ma fiche » : les cartes n'ont pas de pied. */
  apercu?: boolean;
}) {
  const liste = useRef<HTMLUListElement | null>(null);

  /*  L'APPROCHE — LE MOTIF DE LA GRILLE DES RÉSULTATS (GrilleTatoueurs,
      nº 841) : un seul observateur pour toutes les cartes, qui lève le
      drapeau d'une carte quand elle arrive à moins d'un écran ; son
      carrousel monte alors la photo voisine, chargée sans attendre. La
      première carte est approchée d'emblée : c'est elle qu'on regarde à
      l'arrivée. Un drapeau levé ne redescend pas. */
  const [approchees, setApprochees] = useState<Set<number>>(
    () => new Set([0])
  );
  useEffect(() => {
    const enveloppe = liste.current;
    if (!enveloppe || typeof IntersectionObserver === "undefined") return;
    const observateur = new IntersectionObserver(
      (entrees) => {
        const rangs = entrees
          .filter((entree) => entree.isIntersecting)
          .map((entree) => Number((entree.target as HTMLElement).dataset.carteDeGalerie));
        if (rangs.length === 0) return;
        rangs.forEach((rang) => {
          const carte = enveloppe.querySelector(`[data-carte-de-galerie="${rang}"]`);
          if (carte) observateur.unobserve(carte);
        });
        setApprochees((avant) => {
          if (rangs.every((rang) => avant.has(rang))) return avant;
          const suite = new Set(avant);
          rangs.forEach((rang) => suite.add(rang));
          return suite;
        });
      },
      { root: null, rootMargin: "100% 0px" }
    );
    for (const carte of enveloppe.children) observateur.observe(carte);
    return () => observateur.disconnect();
  }, []);

  return (
    <div
      data-fil-de-galerie=""
      className="mt-10 hidden mobile:block mobile:-mx-4"
    >
      {/*  LA GOUTTIÈRE EST CELLE DU FIL DES RÉSULTATS (`GOUTTIERE_DU_FIL`,
           GrilleTatoueurs) : les cartes s'y détachent de vingt-quatre
           pixels, comme les cartes d'une liste de résultats au doigt. */}
      <ul ref={liste} className={`flex flex-col ${GOUTTIERE_DU_FIL}`}>
        {galeries.map((galerie, rang) => (
          <CarteDeGalerie
            key={`${galerie.nature}-${galerie.serie.style}-${galerie.serie.rendu}`}
            tatoueur={tatoueur}
            galerie={galerie}
            rang={rang}
            approchee={approchees.has(rang)}
            metier={metier}
            vues={vues}
            apercu={apercu}
          />
        ))}
      </ul>
    </div>
  );
}

/**
 * UNE CARTE DU FIL — UNE GALERIE, SON CARROUSEL, SON PIED.
 * ------------------------------------------------------------------
 * ⚠️ AU MODULE, ET C'EST LA FORME : le rang de la photo regardée est un
 * ÉTAT, et il en faut un PAR carte — dans une boucle, un état ne peut
 * pas se déclarer (la règle des crochets) ; et un composant déclaré
 * dans un rendu serait recréé à chaque rendu, donc démonté (la leçon
 * de la nº 747, TeteDeGalerie).
 * LE RANG EST POSSÉDÉ PAR LA CARTE, comme sur une carte des résultats
 * (nº 841) : le carrousel natif l'annonce à chaque glissement, les
 * points du pied le posent — deux écritures du même nombre, une seule
 * source. Le poseur d'état de React est stable pour toujours : c'est
 * une dépendance de l'observateur du carrousel (nº 373).
 * ⚠️ IL NE SE RETIENT PLUS (nº 873) : la nº 863-§5 notait le rang
 * regardé pour que la bande du profil se pose « sur la bonne photo » au
 * retour. Il n'y a plus de bande au doigt — la page Portfolio EST ce
 * fil —, donc plus rien à qui le dire.
 */
function CarteDeGalerie({
  tatoueur,
  galerie,
  rang,
  approchee,
  metier,
  vues,
  apercu,
}: {
  tatoueur: Tatoueur;
  galerie: GalerieDuPortfolio;
  rang: number;
  approchee: boolean;
  metier: string;
  vues?: number | null;
  apercu: boolean;
}) {
  const { serie, nature, titre } = galerie;
  const [indice, setIndice] = useState(0);
  /** La première carte est celle qu'on regarde à l'arrivée : son image
      ne se diffère pas. Les autres attendent qu'on défile jusqu'à
      elles. */
  const premiere = rang === 0;

  /** Le texte de remplacement d'une photo seule — la phrase du
      carrousel de la fiche (CarrouselPortfolio, `texteDe`), mot pour
      mot ; le carrousel écrit lui-même la sienne. */
  const photoSeule = serie.photos[0];
  const texteDeLaPhotoSeule = photoSeule
    ? `${tatoueur.nom}'s portfolio — ${serie.label}${
        photoSeule.legende ? ` · ${photoSeule.legende}` : ""
      }`
    : "";

  return (
    <li
      data-carte-de-galerie={rang}
      data-galerie-serie={`${nature}·${serie.style}·${serie.rendu}`}
    >
      {/*  §3 (nº 873) — LES DEUX LIGNES DU TITRE, SEULES, dans la boîte
           de l'en-tête du fil (seize de côté, douze au-dessus de
           l'image) : l'avatar de la nº 867-§3 est parti. */}
      <div className={MARGES_EN_TETE_DE_FIL}>
        <TitreDeGalerie
          nature={titre}
          titre={titreDeGalerie(serie.label, serie.rendu)}
        />
      </div>
      <div
        data-cadre-de-galerie=""
        className={`relative w-full ${CADRE_PHOTO_PORTFOLIO} overflow-hidden`}
      >
        <span aria-hidden="true" className={FOND_RESERVE_PHOTO} />
        {serie.photos.length > 1 ? (
          <CarrouselPortfolio
            photos={serie.photos}
            nomTatoueur={tatoueur.nom}
            styleLabel={serie.label}
            natureDeLaSerie={nature}
            indice={indice}
            surChangement={setIndice}
            variante="carte"
            eveilPastille="page"
            prioritaire={premiere}
            approchee={approchee}
          />
        ) : (
          photoSeule && (
            <PhotoDeCarte
              url={photoSeule.miniature}
              urlPleine={photoSeule.url}
              tailles={TAILLES_CARTE}
              alt={texteDeLaPhotoSeule}
              chargement={premiere ? "eager" : "lazy"}
              priorite={premiere ? "high" : undefined}
              classe="relative w-full h-full object-cover"
            />
          )
        )}
      </div>
      {!apercu && (
        <PiedDeFil
          tatoueur={tatoueur}
          photos={serie.photos}
          indice={indice}
          surRang={setIndice}
          //  LE PARTAGE EMPORTE LA PHOTO REGARDÉE de cette galerie — la
          //  fiche s'ouvrira dessus (`ouvertureSurUnePhoto`).
          cheminAPartager={cheminDuCarrousel(
            tatoueur.slug,
            serie.style,
            { nature, rendu: serie.rendu },
            serie.photos[indice]?.cle ?? ""
          )}
          metier={metier}
          vues={vues}
        />
      )}
    </li>
  );
}
