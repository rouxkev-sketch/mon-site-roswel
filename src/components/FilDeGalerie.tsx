"use client";

import { useEffect, useRef, useState } from "react";
import { PiedDeFil } from "@/components/CarteFil";
//  §6 (nº 877) — les flèches du clavier font défiler la carte survolée
//  (la mécanique de la nº 840, telle quelle).
import { ClavierCartes } from "@/components/ClavierCartes";
import { CarrouselPortfolio } from "@/components/CarrouselPortfolio";
//  §3 (nº 876) — la galerie de carte du WEB (nº 839) : la piste qui
//  glisse par transformation, ses deux chevrons au survol, et l'état
//  qui les tient. Voir la note du cadre, plus bas.
import {
  CommandesDeCarte,
  PisteDeCarte,
  useGalerieDeCarte,
} from "@/components/GalerieDeCarte";
import { PhotoDeCarte, TAILLES_CARTE } from "@/components/PhotoDeCarte";
import {
  CompteurDeGalerie,
  TitreDeGalerie,
  type GalerieDuPortfolio,
  type SerieChoisie,
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
 *  c. LE PIED DU FIL (`PiedDeFil`), AU DOIGT SEULEMENT depuis la
 *     nº 877-§2 : signaler, les vues, les POINTS de
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
 * valeur qui ouvrait le portfolio du web sous la rangée Profil /
 * Portfolio et qui ouvre le bloc du nom sur le profil (nº 870-§5).
 *
 * ██ §3 (nº 876) — ET LE WEB AUSSI : LE FIL EST LA PRÉSENTATION DES
 * DEUX APPAREILS ██
 * ==================================================================
 * DÉCISION DU PROPRIÉTAIRE : au web, les bandes horizontales par style
 * (PanneauPortfolio, nº 306 → nº 874-§5) DISPARAISSENT ; à leur place,
 * CES CARTES — une par rangée, PLEINE LARGEUR dans les marges gauche et
 * droite du web (la colonne de lecture d'une fiche, la colonne de
 * droite de la fenêtre superposée) : le titre en haut à gauche, le
 * compteur « 1/20 » en haut à droite, la photo.
 * Une galerie à une photo : sans compteur, comme au doigt.
 * CE QUI CHANGE D'UN APPAREIL À L'AUTRE, ET RIEN D'AUTRE : LA PHOTO.
 *  · AU DOIGT, le carrousel natif de la fiche en variante « carte »
 *    (glissement au doigt, accrochage par photo) — inchangé ;
 *  · AU WEB, la galerie de carte de la nº 839 (GalerieDeCarte) : la
 *    piste qui GLISSE par transformation d'une photo à l'autre, et LES
 *    DEUX CHEVRONS DE LA nº 839 AU SURVOL, sans la pastille (le
 *    compteur est déjà sur la ligne du titre, nº 874-§4 —
 *    `sansCompteur`). C'est exactement le partage des cartes de la
 *    grille (CarteTatoueur) : deux mécaniques, l'une par appareil, et
 *    la feuille de style qui choisit (`hidden mobile:block` / `hidden
 *    not-mobile:block`, règle nº 60 — l'appareil, jamais la largeur).
 *    Le web ne monte que ce que le survol a demandé (`precharger`,
 *    puis un pas à la fois) ; le carrousel du doigt, masqué au web, ne
 *    demande rien de plus que sa première photo (une image différée
 *    dans un élément sans boîte ne part jamais).
 * LE RANG REGARDÉ EST UN SEUL NOMBRE, écrit comme sur une carte des
 * résultats (nº 841) : celui du doigt ne bouge que par un glissement,
 * celui du web que par ses chevrons (ou les flèches du clavier, §6
 * nº 877, qui les pressent) — le plus grand des deux est donc toujours
 * le rang regardé, et l'autre zéro. Le compteur du titre le lit.
 *
 * ██ §2, §3, §5 ET §6 (nº 877) — CE QUE LE PROPRIÉTAIRE A CORRIGÉ À
 * L'ÉCRAN, LA PASSE SUIVANTE ██
 * ==================================================================
 *  · §2 — LE PIED DISPARAÎT DU WEB : plus de fanion, de signalement, de
 *    vues, de partage ni de points sous une carte de galerie. Ces
 *    commandes vivent désormais SUR LA GRANDE PHOTO, à gauche
 *    (`CommandesDeLAffiche`, CarteFil, §4 nº 877) — et la carte n'a
 *    plus rien à dire d'autre que son titre, son compteur et sa photo.
 *    Le DOIGT garde le sien, entier : ce sont les deux rangées de
 *    CarteFil qui portent l'appareil (`hidden mobile:flex`), rendues à
 *    leur état d'avant la nº 876 ;
 *  · §3 — LA PHOTO CLIQUÉE MONTE DANS L'AFFICHE : le chemin des
 *    anciennes vignettes (`SerieChoisie`, nº 204-§3 et nº 306), rendu
 *    aux cartes. Au web seulement ;
 *  · §5 — LE TITRE S'ALIGNE SUR LE BORD GAUCHE DE LA CARTE et le
 *    compteur sur le bord droit de l'image (`MARGES_DU_TITRE_DE_GALERIE`,
 *    juste au-dessus) ;
 *  · §6 — LES FLÈCHES DU CLAVIER font défiler la carte survolée
 *    (`ClavierCartes`, la mécanique de la nº 840).
 * LA GOUTTIÈRE entre deux cartes est celle du fil des résultats
 * (`GOUTTIERE_DU_FIL`, GrilleTatoueurs — vingt-quatre pixels), aux deux
 * appareils ; au doigt seulement, la liste saigne jusqu'aux bords
 * (`mobile:-mx-4`), comme les cartes des résultats.
 * ⚠️ AUCUNE PHOTO N'EST UN LIEN, ni au doigt (nº 873-§3) ni au web : la
 * page est déjà celle de cet artiste. Au web, elle est un BOUTON depuis
 * la nº 877 — il ne navigue pas, il pose la photo dans l'affiche.
 */
/**
 * ██ §5 (nº 877) — LA BOÎTE DU TITRE, ET SES DEUX APPAREILS ██
 * ==================================================================
 * CE QUE LE PROPRIÉTAIRE A RELEVÉ À L'ÉCRAN, AU WEB : « le titre est
 * trop à droite, le compteur trop à gauche ». La carte lisait la boîte
 * de l'en-tête du fil (`MARGES_EN_TETE_DE_FIL`, CarteFil — seize
 * pixels de côté), et ces seize pixels rentraient le titre ET le
 * compteur À L'INTÉRIEUR de l'image, qui, elle, prend toute la largeur
 * de la carte.
 * CE QUI EST DEMANDÉ : le titre à l'aplomb du BORD GAUCHE de la carte,
 * le compteur à l'aplomb du BORD DROIT DE L'IMAGE — donc aucune marge
 * horizontale au web, la ligne du titre et l'image partageant le même
 * bord.
 * ⚠️ LE DOIGT NE BOUGE PAS D'UN PIXEL, et c'est la consigne : là-bas
 * l'image SAIGNE jusqu'aux bords de l'écran (`mobile:-mx-4`, plus bas)
 * tandis que le titre s'aligne sur les marges de la page — ses seize
 * pixels sont donc JUSTES, et ils restent.
 * ⚠️ DEUX PRÉFIXES, JAMAIS UNE VALEUR NUE PUIS SA CORRECTION : une
 * seule déclaration de rembourrage horizontal par appareil (piège
 * nº 389), et les deux écrites en toutes lettres (piège nº 472 : la
 * feuille se fabrique en lisant ce texte).
 */
const MARGES_DU_TITRE_DE_GALERIE = "mobile:px-4 not-mobile:px-0 pb-3";

export function FilDeGalerie({
  tatoueur,
  galeries,
  metier,
  vues,
  apercu = false,
  surSerieChoisie,
}: {
  tatoueur: Tatoueur;
  /** Les galeries de la page — une catégorie, dans l'ordre du profil
      (`galeriesDuPortfolio`). */
  galeries: GalerieDuPortfolio[];
  /** §3 (nº 877) — LA PHOTO CLIQUÉE MONTE DANS L'AFFICHE : ce que
      l'enveloppe (ContenuFiche) fait remonter jusqu'à la fiche ou à la
      fenêtre superposée. Au web seulement — voir la carte. */
  surSerieChoisie: (serie: SerieChoisie) => void;
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
      //  §3 (nº 876) — aux deux appareils désormais (voir l'en-tête).
      className="mt-10 mobile:-mx-4"
    >
      {/*  LA GOUTTIÈRE EST CELLE DU FIL DES RÉSULTATS (`GOUTTIERE_DU_FIL`,
           GrilleTatoueurs) : les cartes s'y détachent de vingt-quatre
           pixels, comme les cartes d'une liste de résultats au doigt —
           et au web depuis la nº 876, la même valeur. */}
      {/*  ██ §6 (nº 877) — LES FLÈCHES DU CLAVIER, SUR LA CARTE SURVOLÉE ██
           LA MÊME MÉCANIQUE QUE LA MOSAÏQUE (nº 371, refaite nº 840) :
           un seul écouteur sur le document, la carte survolée demandée
           au navigateur (`:hover`), et son CHEVRON pressé — le geste de
           la souris, à la lettre. Ce composant n'affiche rien ; il est
           monté par la surface qui porte des cartes, et une page de
           portfolio n'en montre jamais deux (la mosaïque et « Ma
           sélection » ne coexistent pas avec elle).
           ⚠️ RIEN AU DOIGT : le composant s'en garde lui-même (règle
           nº 60, l'appareil). */}
      <ClavierCartes />
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
            surSerieChoisie={surSerieChoisie}
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
  surSerieChoisie,
}: {
  tatoueur: Tatoueur;
  galerie: GalerieDuPortfolio;
  rang: number;
  approchee: boolean;
  metier: string;
  vues?: number | null;
  apercu: boolean;
  surSerieChoisie: (serie: SerieChoisie) => void;
}) {
  const { serie, nature } = galerie;
  const [indice, setIndice] = useState(0);
  /*  §3 (nº 876) — LE RANG DU WEB, tenu par la galerie de carte
      (nº 839) ; celui du doigt est `indice`, juste au-dessus. Le rang
      regardé est le plus grand des deux (voir l'en-tête), et les points
      du pied posent l'un ou l'autre selon l'appareil — le partage exact
      d'une carte des résultats (CarteTatoueur). */
  const galerieWeb = useGalerieDeCarte(serie.photos.length);
  const rangRegarde = Math.max(galerieWeb.indice, indice);
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
      /*  §3 (nº 876) — `group` : les chevrons du web se montrent au
          survol de LA CARTE (`group-hover`, BoutonChevron), comme sur une
          carte de la grille ; et le survol prépare la photo suivante
          (`precharger`) — au premier chevron, elle est déjà là. Le doigt
          n'est pas concerné (l'appareil tranche, règle nº 60 : ce
          gestionnaire se déclenche aussi à la première touche d'un
          écran tactile). */
      className="group"
      onPointerEnter={
        serie.photos.length > 1
          ? () => {
              if (document.documentElement.dataset.appareil !== "mobile") {
                galerieWeb.precharger();
              }
            }
          : undefined
      }
    >
      {/*  §3 (nº 873) — LE TITRE SEUL, dans la boîte de l'en-tête du fil
           (seize de côté, douze au-dessus de l'image) : l'avatar de la
           nº 867-§3 est parti.
           ██ §4 (nº 874) — LE SURTITRE S'EN VA, LE COMPTEUR ARRIVE ██
           « TATTOOS » ne coiffe plus le titre (la page le dit déjà), et
           « 1/20 » quitte la photo pour LA LIGNE DU TITRE, à son opposé
           — le compteur du profil du web, le même composant, donc le
           même gris et le même corps « à l'identique » (décision du
           propriétaire). Une galerie d'une seule photo n'en a pas : il
           n'y a rien à compter (`serie.photos.length > 1`, la règle de
           la pastille qu'il remplace). */}
      <div className={MARGES_DU_TITRE_DE_GALERIE}>
        <TitreDeGalerie
          titre={titreDeGalerie(serie.label, serie.rendu)}
          compteur={
            serie.photos.length > 1 ? (
              <CompteurDeGalerie rang={rangRegarde} total={serie.photos.length} />
            ) : undefined
          }
        />
      </div>
      <div
        data-cadre-de-galerie=""
        className={`relative w-full ${CADRE_PHOTO_PORTFOLIO} overflow-hidden`}
      >
        <span aria-hidden="true" className={FOND_RESERVE_PHOTO} />
        {serie.photos.length > 1 ? (
          <>
          {/*  ██ §3 (nº 876) — AU WEB, LA GALERIE DE CARTE DE LA nº 839 ██
               La piste (une photo par case, chacune sur l'encadré
               entier, glissement par transformation — le remède au
               liseré de la nº 840 compris), et ses deux chevrons au
               survol, SANS la pastille : le compteur vit sur la ligne du
               titre. Le rang 0 est la photo que le doigt montre aussi —
               même source, même taille : rien de plus n'est demandé.
               Masqué au doigt par l'appareil (`hidden not-mobile:block`),
               jamais par une largeur (piège nº 60). */}
          <div className="absolute inset-0 hidden not-mobile:block">
            <PisteDeCarte
              photos={serie.photos}
              indice={galerieWeb.indice}
              chargees={galerieWeb.chargees}
              alt={texteDeLaPhotoSeule || `${tatoueur.nom}'s portfolio — ${serie.label}`}
              prioritaire={premiere}
            />
            <CommandesDeCarte
              indice={galerieWeb.indice}
              nombre={serie.photos.length}
              peutReculer={galerieWeb.peutReculer}
              peutAvancer={galerieWeb.peutAvancer}
              aller={galerieWeb.aller}
              pastilleEveillee={galerieWeb.pastilleEveillee}
              pleineLargeur
              sansCompteur
            />
          </div>
          {/*  AU DOIGT, LE CARROUSEL NATIF — inchangé depuis la nº 873 ;
               masqué au web par l'appareil (§3 nº 876). */}
          <div className="absolute inset-0 hidden mobile:block">
          <CarrouselPortfolio
            photos={serie.photos}
            nomTatoueur={tatoueur.nom}
            styleLabel={serie.label}
            natureDeLaSerie={nature}
            indice={indice}
            surChangement={setIndice}
            variante="carte"
            eveilPastille="page"
            /*  ██ §4 (nº 874) — PLUS DE PASTILLE DANS LA PHOTO ██
                Décision du propriétaire : au doigt, « 1/20 » ne se pose
                plus SUR l'image — il s'écrit sur la ligne du titre,
                au-dessus (voir l'en-tête). Le carrousel sait déjà se
                taire : `sansCompteur` existe depuis la nº 284 et
                n'avait plus d'appelant depuis que la fenêtre de
                carrousel a été supprimée (nº 602) — il en retrouve un,
                et le dessin de la pastille reste écrit une seule fois
                (PastilleCompteur, nº 844).
                ⚠️ LES POINTS DE POSITION NE SONT PAS TOUCHÉS : ils
                vivent dans le PIED de la carte (PiedDeFil), pas dans
                l'image, et le propriétaire n'en parle pas.
                ⚠️ LES CARTES DES RÉSULTATS NON PLUS : elles gardent leur
                pastille (CarteTatoueur) — c'est la carte d'un PROFIL
                qui change ici, pas celle d'une recherche. */
            sansCompteur
            prioritaire={premiere}
            approchee={approchee}
          />
          </div>
          </>
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
        {/*  ██ §3 (nº 877) — CLIQUER LA PHOTO LA MET DANS L'AFFICHE ██
             ------------------------------------------------------------
             DÉCISION DU PROPRIÉTAIRE : au web, un clic sur la photo d'une
             carte la montre EN GRAND dans la colonne de gauche du profil
             — « comme les anciennes vignettes le faisaient » (le chemin
             de la nº 204-§3 et de la nº 306, parti à la nº 876 avec les
             bandes par style).
             CE QUE CE BOUTON EST, ET RIEN DE PLUS : une surface
             transparente à l'aplomb de l'encadré, SŒUR de la photo et
             non son enveloppe — aucune image n'est déplacée, aucun lien
             n'est créé (nº 517 : on n'imbrique pas de l'interactif).
             ⚠️ SOUS LES CHEVRONS : ceux-ci portent `z-[2]` (BoutonChevron)
             et gardent donc leurs deux bandes latérales — avancer d'une
             photo ne la met pas dans l'affiche, et inversement.
             ⚠️ AU WEB SEULEMENT (`hidden not-mobile:block`, l'appareil —
             règle nº 60) : au doigt, « toucher une photo ne fait rien »
             (nº 873-§3), et rien ici ne peut être touché.
             ⚠️ IL PORTE LE RANG REGARDÉ : la photo montrée dans l'encadré
             à cet instant, jamais la première de la série (nº 306-§1-6 —
             le défaut que la nº 310-§5 avait relevé dans la fenêtre). */}
        <button
          type="button"
          data-photo-vers-affiche=""
          onClick={() =>
            surSerieChoisie({
              style: serie.style,
              nature,
              rendu: serie.rendu,
              indice: rangRegarde,
            })
          }
          aria-label={`Show photo ${rangRegarde + 1} of ${serie.photos.length}`}
          className="absolute inset-0 hidden not-mobile:block
                     focus-visible:outline-2 focus-visible:-outline-offset-2
                     focus-visible:outline-primaire"
        />
      </div>
      {!apercu && (
        <PiedDeFil
          tatoueur={tatoueur}
          photos={serie.photos}
          /*  ⛔ §2 (nº 877) — LE PIED N'EXISTE PLUS QU'AU DOIGT, et il ne
              le dit pas lui-même : ses deux rangées portent leur appareil
              (`hidden mobile:flex`, CarteFil), rendues à l'état d'avant la
              nº 876. Le rang qu'il montre et qu'il pose est donc CELUI DU
              DOIGT (`indice`), le seul qui existe là où il se voit — au
              web, la carte n'a plus ni pied, ni points, ni fanion, ni
              partage : les commandes de la photo vivent sur L'AFFICHE
              (§4, CommandesDeLAffiche). */
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
