"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AvatarRond } from "@/components/AvatarRond";
import { MARGES_EN_TETE_DE_FIL, PiedDeFil } from "@/components/CarteFil";
import { CarrouselPortfolio } from "@/components/CarrouselPortfolio";
import { PhotoDeCarte, TAILLES_CARTE } from "@/components/PhotoDeCarte";
import {
  TitreDeGalerie,
  galeriesDuPortfolio,
  type GalerieDuPortfolio,
} from "@/components/PortfolioDeLAffiche";
import { GOUTTIERE_DU_FIL } from "@/components/GrilleTatoueurs";
import { CADRE_PHOTO_PORTFOLIO, FOND_RESERVE_PHOTO } from "@/config/tatouage";
import { defilerSansGeste } from "@/lib/defilement-programme";
import { cleDeGalerie, retenirPhotoDeGalerie } from "@/lib/memoire-galeries";
import { cheminDuCarrousel } from "@/lib/photo-tatoueur";
import type { StyleGalerie } from "@/lib/photo-tatoueur";
import { titreDeGalerie } from "@/lib/photos-tatoueur";
import type { Tatoueur } from "@/lib/tatoueurs";

/** LA SÉRIE TOUCHÉE — l'identité d'une galerie du portfolio (style,
    catégorie, rendu), celle que le geste de l'onglet met dans
    l'adresse. */
export type SerieDuFil = { style: string; nature: string; rendu: string };

/**
 * ██ LE FIL DE GALERIES — LA VUE PHOTO OUVERTE DEPUIS L'ONGLET PORTFOLIO
 * D'UN PROFIL, AU DOIGT (nº 863-§3, REFAIT PAR LA nº 866-§1) ██
 * ==================================================================
 * DÉCISION DU PROPRIÉTAIRE, À LA LETTRE — la nº 863 avait mal compris :
 * elle empilait UNE CARTE PAR PHOTO de la galerie touchée. Ce qu'il
 * veut : UNE CARTE PAR GALERIE DU PORTFOLIO (trois styles de tattoos et
 * trois de flashs font six cartes), empilées de haut en bas dans l'ordre
 * du profil ; et DANS chaque carte, on GLISSE pour faire défiler les
 * photos DE CETTE galerie — le mécanisme des cartes de recherche :
 * l'encadré fixe, la pastille « 4/11 », les points de position. La
 * carte de la galerie touchée est ouverte SUR la photo touchée, et la
 * page s'ouvre positionnée sur cette carte. Le fil « une carte par
 * photo » a disparu, code compris.
 *
 * LA CARTE, DE HAUT EN BAS — et rien n'y est dessiné pour l'occasion :
 *  a. L'AVATAR DU PORTFOLIO, puis LE TITRE ET LE SOUS-TITRE DE LA
 *     GALERIE (« TATTOOS » / « Blackwork • Black ») — `TitreDeGalerie`,
 *     le composant même qui les écrit sur le profil : même couleur,
 *     même corps, même graisse, parce que c'est le même marquage. Posé
 *     dans LA BOÎTE DE L'EN-TÊTE DU FIL (`MARGES_EN_TETE_DE_FIL`,
 *     CarteFil) : seize pixels de côté, douze au-dessus de l'image — la
 *     carte a la forme d'une carte du fil, avec un autre en-tête.
 *     ██ §3 (nº 867) — LE ROND DE QUARANTE, À GAUCHE DU TITRE ██
 *     Décision du propriétaire : la carte porte l'avatar du portfolio,
 *     à gauche de ses deux lignes. C'est LE ROND DES CARTES DU FIL
 *     (`AvatarRond`, quarante pixels, l'initiale quand il n'y a pas de
 *     photo), avec la robe exacte de l'en-tête des résultats
 *     (EnTeteDeFil) et l'écart de sa rangée : rien n'est redessiné, ni
 *     retaillé. Il ne mène nulle part — ce n'est pas un lien : on est
 *     déjà chez cet artiste, et une carte du fil de galeries n'a pas de
 *     profil à ouvrir (piège nº 455 : deux liens voisins vers la même
 *     destination) ;
 *  b. L'IMAGE — l'encadré d'une carte des résultats (CarteTatoueur au
 *     doigt, à la lettre) : pleine largeur, le format 4:5 du site
 *     (`CADRE_PHOTO_PORTFOLIO`), la réserve grise (`FOND_RESERVE_PHOTO`)
 *     et LE CARROUSEL DE LA FICHE EN VARIANTE « CARTE »
 *     (`CarrouselPortfolio`) : défilement natif avec accrochage par
 *     photo, les miniatures seules, la photo suivante chargée quand la
 *     carte approche de l'écran (`approchee`, comme dans la grille), la
 *     pastille allumée d'emblée comme sur une page de résultats
 *     (`eveilPastille="page"`, nº 852). Une galerie d'une seule photo
 *     garde l'image simple (`PhotoDeCarte`), comme une carte à photo
 *     unique. Un toucher sur l'image ne fait rien : aucune photo n'est
 *     un lien ;
 *  c. LE PIED DU FIL (`PiedDeFil`) : signaler, les vues, les POINTS de
 *     position au centre (la frise des fiches — il y a plusieurs photos,
 *     le pied les dessine), le fanion de LA PHOTO REGARDÉE, son partage
 *     (`cheminDuCarrousel`, avec cette photo). Un rond touché pose le
 *     rang, et le carrousel glisse jusqu'à la photo (nº 217) — le
 *     motif de la carte des résultats, mot pour mot.
 *
 * LA LIGNE « Blackwork • Black » QUI VIVAIT SOUS LE PIED (nº 376, puis
 * nº 862) N'EXISTE PAS ICI, c'est la consigne : le titre est monté
 * au-dessus de l'image, il n'a pas à se répéter dessous.
 *
 * ██ LA LISTE DES GALERIES EST CELLE DU PROFIL ██
 * ------------------------------------------------------------------
 * `galeriesDuPortfolio` (PortfolioDeLAffiche) — l'écriture que le
 * panneau Portfolio lit pour ses bandes : toutes les réalisations puis
 * tous les flashs, les styles de A à Z, dans un style les rendus dans
 * l'ordre du site, une section vide n'existe pas. Six bandes sur le
 * profil, six cartes ici : par construction, pas par accord.
 *
 * ██ L'OUVERTURE SUR LA CARTE TOUCHÉE, ET SUR SA PHOTO ██
 * ------------------------------------------------------------------
 * La galerie touchée est reconnue par son identité (style, catégorie,
 * rendu — `ouverte`) ; sa carte naît AVEC le rang de la photo touchée
 * (`indiceOuvert`, lu dans l'adresse), les autres à leur première. Au
 * montage — après la mise en page, AVANT la peinture
 * (`useLayoutEffect`) — la page est posée pour que LA CARTE TOUCHÉE
 * PRENNE EXACTEMENT LA PLACE DE LA PREMIÈRE au repos : on défile de la
 * distance qui sépare les deux cartes dans le document, ni plus ni
 * moins. Rien n'est lu de la barre ni des marges de la page. La pose
 * passe par `defilerSansGeste` : ce n'est pas un geste du doigt, la
 * barre ne doit pas s'y replier (nº 154-§6A), et la garde de position
 * (nº 427) tient la pose contre les recalages qui suivent l'arrivée des
 * images — et les encadrés ont leur hauteur avant toute image (le
 * format 4:5), la distance est donc juste dès le premier rendu.
 * ⚠️ LA POSE EN HAUT DE LA nº 742 (au geste, dans FicheTatoueur) reste
 * en place et passe AVANT celle-ci : elle protège la galerie qu'on
 * quitte du zéro qui ne lui est pas destiné ; celle-ci la remplace dès
 * que la carte existe. Un RETOUR vers cette vue (le navigateur, après
 * un passage par le profil) est rendu par la mémoire de navigation du
 * site, qui pose sa place après ce composant et l'emporte.
 *
 * ██ LE RETOUR : LA GALERIE DU PROFIL SUR LA BONNE PHOTO ██
 * ------------------------------------------------------------------
 * Décision du propriétaire : au retour sur le profil, la bande de la
 * galerie est « sur la bonne photo ». Sans glissement, c'est la photo
 * touchée, et la mémoire de position des bandes (nº 459, nº 863-§5) la
 * rend d'elle-même : la carte ne dit rien. Si l'on a GLISSÉ dans une
 * carte, sa galerie retient LE RANG de la dernière photo regardée
 * (`retenirPhotoDeGalerie`, lib/memoire-galeries), et la bande du
 * profil se pose sur cette case en se remontant (GalerieQuiDefile).
 * Chaque carte ne parle que de SA galerie : glisser dans la troisième
 * ne déplace jamais la première.
 *
 * ⚠️ AU DOIGT SEULEMENT (règle nº 60, `hidden mobile:block`) : le web
 * n'ouvre jamais une vue photo depuis l'onglet Portfolio — une vignette
 * y change la photo de l'affiche sans naviguer (nº 306). Une adresse
 * portant la consigne, ouverte au web, montre la fiche ordinaire ; ce
 * bloc y est rendu masqué, et ses images différées ne partent pas.
 */
export function FilDeGalerie({
  tatoueur,
  groupes,
  ouverte,
  indiceOuvert,
  metier,
  vues,
}: {
  tatoueur: Tatoueur;
  /** LE PORTFOLIO ENTIER, par style — ce dont le profil fait ses
      bandes ; le fil en fait ses cartes, par la même liste. */
  groupes: StyleGalerie[];
  /** La galerie touchée. Absente (série abandonnée) : le fil s'ouvre
      sur sa première carte, à sa première photo. */
  ouverte: SerieDuFil | null;
  /** Le rang de la photo touchée DANS sa galerie : sa carte s'ouvre
      dessus, et c'est elle seule dont l'image ne se diffère pas. */
  indiceOuvert: number;
  /** Le style montré, pour le message pré-rempli du partage. */
  metier: string;
  vues?: number | null;
}) {
  const galeries = galeriesDuPortfolio(groupes);
  const rangOuvert = Math.max(
    0,
    galeries.findIndex(
      (galerie) =>
        ouverte !== null &&
        galerie.nature === ouverte.nature &&
        galerie.serie.style === ouverte.style &&
        galerie.serie.rendu === ouverte.rendu
    )
  );
  const liste = useRef<HTMLUListElement | null>(null);

  useLayoutEffect(() => {
    const enveloppe = liste.current;
    if (!enveloppe) return;
    const carte = enveloppe.querySelector<HTMLElement>("[data-carte-ouverte]");
    const premiere = enveloppe.firstElementChild as HTMLElement | null;
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
      "gallery feed — opened on the touched gallery (no. 866)"
    );
    //  Une seule pose, à l'ouverture : la carte touchée ne change plus.
  }, []);

  /*  L'APPROCHE — LE MOTIF DE LA GRILLE DES RÉSULTATS (GrilleTatoueurs,
      nº 841) : un seul observateur pour toutes les cartes, qui lève le
      drapeau d'une carte quand elle arrive à moins d'un écran ; son
      carrousel monte alors la photo voisine, chargée sans attendre. La
      carte ouverte est approchée d'emblée : c'est elle qu'on regarde à
      l'arrivée. Un drapeau levé ne redescend pas. */
  const [approchees, setApprochees] = useState<Set<number>>(
    () => new Set([rangOuvert])
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
    <div data-fil-de-galerie="" className="hidden mobile:block mobile:-mx-4">
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
            ouverte={rang === rangOuvert}
            indiceInitial={rang === rangOuvert ? indiceOuvert : 0}
            approchee={approchees.has(rang)}
            metier={metier}
            vues={vues}
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
 */
function CarteDeGalerie({
  tatoueur,
  galerie,
  rang,
  ouverte,
  indiceInitial,
  approchee,
  metier,
  vues,
}: {
  tatoueur: Tatoueur;
  galerie: GalerieDuPortfolio;
  rang: number;
  ouverte: boolean;
  indiceInitial: number;
  approchee: boolean;
  metier: string;
  vues?: number | null;
}) {
  const { serie, nature, titre } = galerie;
  const [indice, setIndice] = useState(indiceInitial);
  const cle = cleDeGalerie(tatoueur.slug, nature, serie.style, serie.rendu);
  /*  LE RANG REGARDÉ EST NOTÉ POUR LA BANDE DU PROFIL — au glissement
      seulement (voir la note du fil : « la bonne photo »). Le premier
      rendu ne dit rien ; dès qu'on a bougé, chaque rang s'écrit, y
      compris un retour à la photo de départ : la bande suit ce qu'on
      regarde, pas ce qu'on a touché. */
  const aGlisse = useRef(false);
  useEffect(() => {
    if (!aGlisse.current && indice === indiceInitial) return;
    aGlisse.current = true;
    retenirPhotoDeGalerie(cle, indice);
  }, [cle, indice, indiceInitial]);

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
      data-carte-ouverte={ouverte ? "" : undefined}
      data-galerie-serie={`${nature}·${serie.style}·${serie.rendu}`}
    >
      {/*  §3 (nº 867) — L'AVATAR, PUIS LES DEUX LIGNES : l'écart de la
           rangée d'en-tête du fil (douze pixels), et une colonne qui
           peut rétrécir (`min-w-0`) pour que le titre s'abrège au lieu
           de pousser le rond. Centré sur la hauteur des deux lignes,
           comme sur une carte des résultats. */}
      <div className={`flex items-center gap-3 ${MARGES_EN_TETE_DE_FIL}`}>
        <AvatarRond
          photo={tatoueur.photo_profil}
          nom={tatoueur.nom}
          classeFond="bg-sombre-haut"
          classeInitiale="text-[16px] font-bold text-sombre-texte-doux"
          paresseux
        />
        <span className="min-w-0 flex-1">
          <TitreDeGalerie
            nature={titre}
            titre={titreDeGalerie(serie.label, serie.rendu)}
          />
        </span>
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
            //  LA CARTE OUVERTE NE SE DIFFÈRE PAS : c'est elle qu'on
            //  regarde à l'arrivée. Les autres attendent qu'on défile
            //  jusqu'à elles.
            prioritaire={ouverte}
            approchee={approchee}
          />
        ) : (
          photoSeule && (
            <PhotoDeCarte
              url={photoSeule.miniature}
              urlPleine={photoSeule.url}
              tailles={TAILLES_CARTE}
              alt={texteDeLaPhotoSeule}
              chargement={ouverte ? "eager" : "lazy"}
              priorite={ouverte ? "high" : undefined}
              classe="relative w-full h-full object-cover"
            />
          )
        )}
      </div>
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
    </li>
  );
}
