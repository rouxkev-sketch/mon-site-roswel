"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { corpsGele, gelerLeCorps } from "@/lib/gel-du-corps";
import Link from "next/link";
import { villeAffichee } from "@/lib/adresse";
import { libelleStyle, MARQUE_YOKOFOLIO } from "@/config/tatouage";
import { BoutonPartageFiche } from "@/components/BoutonPartageFiche";
import { BoutonCoeurPhoto } from "@/components/BoutonCoeurPhoto";
import { CarrouselPortfolio } from "@/components/CarrouselPortfolio";
import { ContenuFiche } from "@/components/ContenuFiche";
import { SondePhoto } from "@/components/SondePhoto";
import {
  cheminDuCarrousel,
  galerieParStyles,
  ouvertureGalerie,
  ouvertureSurUnePhoto,
  serieDeLOuverture,
  serieMontree,
} from "@/lib/photo-tatoueur";
import { NATURE_PAR_DEFAUT } from "@/lib/photos-tatoueur";
import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * LA FENÊTRE DE FICHE — L'ENVELOPPE, ET RIEN QUE L'ENVELOPPE
 * =============================================================
 * Depuis la GRILLE (web, ≥ 1024 px), cliquer une carte n'ouvre plus
 * une page : cette fenêtre se superpose, la grille reste visible
 * derrière un voile sombre.
 *
 * ⚠️ CE FICHIER NE DESSINE PLUS LE CONTENU D'UNE FICHE (passe nº 199).
 * Il en portait une COPIE COMPLÈTE — identité, adresse, site, horaires,
 * bio, réseaux, équipe, badges, signalement — et les deux exemplaires
 * s'étaient éloignés : le sélecteur « Profil / Portfolio » de la nº 197
 * n'était arrivé que dans la page. Ouvrir une fiche depuis la mosaïque
 * ne montrait donc pas la même chose que coller son adresse dans la
 * barre du navigateur. Désormais le contenu vient de `ContenuFiche`,
 * l'unique composant, celui-là même qu'affiche la page.
 *
 * CE QUI RESTE ICI, ET RIEN D'AUTRE :
 *  - LA FAÇON DE S'OUVRIR ET DE SE FERMER : le voile, la croix hors de
 *    la fenêtre, Échap, et le gel de la grille en arrière-plan ;
 *  - LA MISE EN PAGE de l'enveloppe — deux colonnes larges (photo à
 *    gauche, contenu à droite), une seule colonne étroite ;
 *  - LES BOUTONS POSÉS SUR LA PHOTO, dont la place est celle du web
 *    depuis la nº 198-§3 : le PARTAGE dans l'angle haut GAUCHE, le
 *    CŒUR dans l'angle haut DROIT ;
 *  - LE FIL D'ARIANE (nº 201) : la page n'en a pas (nº 200-§1 — on y
 *    arrive directement), la fenêtre en a un, et il appartient à
 *    l'ENVELOPPE : c'est le chemin de la grille qu'elle recouvre, pas
 *    du contenu de la fiche. TEXTE SEUL, posé dans le voile AU-DESSUS
 *    de la fenêtre, calé sur son bord gauche — le bandeau de la nº 200
 *    (une surface sombre sur un voile déjà sombre, indiscernable, et
 *    qui recouvrait le haut de la photo) est supprimé : aucun fond,
 *    aucun encadré. Et il ne DÉPLACE rien (nº 202) : hors du flux, il
 *    s'écrit vers le haut dans le voile — la fenêtre garde exactement
 *    le centrage et les dimensions d'avant la nº 200.
 *
 * LA PHOTO, elle aussi, est le composant de la page (`CarrouselPortfolio`) :
 * la fenêtre avait son propre carrousel, avec ses flèches, ses points et
 * son compteur — trois pièces qui n'avaient pas reçu la nº 198 (capsule
 * qui se replie, pagination façon Instagram). Un seul carrousel, donc.
 *
 * RESPONSIVE, COMME INSTAGRAM : la fenêtre suit la largeur du
 * NAVIGATEUR, pas l'appareil.
 *  - large (≥ 1024 px) : les deux colonnes, et la hauteur se borne
 *    d'elle-même pour que la photo 4:5 garde EXACTEMENT ses
 *    proportions — jamais de photo écrasée entre deux largeurs ;
 *  - étroite (fenêtre rétrécie sous 1024 px) : UNE colonne — la photo
 *    EN HAUT, pleine largeur, les informations EN DESSOUS, et c'est la
 *    fenêtre elle-même qui défile verticalement.
 *  Sur les vrais mobiles, les CARTES de la grille continuent de
 *  naviguer vers la page complète ; mais depuis une FICHE, les liens
 *  vers d'autres fiches (équipe, salon d'un profil) ouvrent désormais
 *  cette fenêtre-ci, au doigt comme à la souris (nº 226-§5, voir
 *  PileFiches) — la forme étroite ci-dessus est la leur.
 *
 * ⚠️ LES FENÊTRES S'EMPILENT (nº 226-§5) : une fiche superposée peut en
 * ouvrir une autre. Deux mécaniques de ce fichier sont donc COMPTÉES
 * au niveau du module :
 *  · LE GEL DU CORPS — seule la PREMIÈRE fenêtre gèle le document,
 *    seule la DERNIÈRE à partir le dégèle et rend le défilement ;
 *    fermer une fenêtre du dessus ne rend jamais la page tant qu'une
 *    autre vit dessous. Le drapeau `data-fenetre-fiche` suit le même
 *    compte : posé tant qu'au moins une fenêtre vit.
 *  · LE CLAVIER — Échap et les flèches ne parlent qu'à la fenêtre DU
 *    DESSUS : sans cela, un seul Échap fermerait toute la pile d'un
 *    coup (chaque fenêtre écoutant pour elle-même).
 *
 * L'ADRESSE DU NAVIGATEUR se met à jour à l'ouverture (pushState vers
 * /tatoueur/nom — partage possible) : c'est la grille (GrilleTatoueurs)
 * qui pousse l'adresse, et la fenêtre ne s'affiche que tant que
 * l'adresse correspond — le bouton « précédent » du navigateur la
 * referme donc naturellement. La PAGE complète, elle, reste servie aux
 * arrivées directes (lien partagé, moteurs) : le référencement ne voit
 * que des pages.
 */

/** LA PILE DES CLAVIERS — chaque fenêtre ouverte y pose son jeton ;
    seule celle du DESSUS (le dernier jeton) répond aux touches. */
const pileClavier: object[] = [];

export function FenetreFiche({
  tatoueur,
  styleRecherche = "",
  renduRecherche = "",
  natureRecherche = "",
  photoRecherche = "",
  positionGrille = 0,
  surFermeture,
}: {
  /** La fiche à montrer — null : fenêtre fermée. */
  tatoueur: Tatoueur | null;
  /** Le style cherché dans la grille : la fenêtre s'ouvre sur SA photo
      (la même que la carte cliquée). */
  styleRecherche?: string;
  /** LE RENDU cherché (noir et gris, ou couleur) : la fenêtre s'ouvre
      alors sur une photo qui y correspond. */
  renduRecherche?: string;
  /** LA CATÉGORIE cherchée — « tatouage » ou « flash » (nº 217-§3).
      ⚠️ ELLE MANQUAIT ICI, ET LA FENÊTRE EST LE CHEMIN DU WEB : la
      nº 216 avait donné la catégorie à la carte, jamais à ce qui
      s'ouvre quand on la touche. La fenêtre montrait donc la première
      photo du style, réalisation ou flash indifféremment. */
  natureRecherche?: string;
  /** §4 (nº 302) — L'IDENTIFIANT D'UNE PHOTO PRÉCISE. Ouvrir une carte
      de « Ma sélection de photos » tombe SUR ELLE — « 8/14 », pas
      « 1/14 ». Même mécanisme que la page (`ouvertureGalerie`), aucun
      second chemin. */
  photoRecherche?: string;
  /** La position de défilement de la grille AU CLIC (capturée par la
      grille avant le pushState) : figée à l'ouverture, rendue à la
      fermeture. */
  positionGrille?: number;
  /** Referme (la grille fait alors machine arrière dans l'historique). */
  surFermeture: () => void;
}) {
  // LE PORTFOLIO ENTIER, GROUPÉ PAR STYLE — comme la page de fiche.
  // Le style cherché passe en premier (continuité exacte avec la carte
  // cliquée), et le rendu cherché décide de la photo d'ouverture.
  const ouverture = useMemo(
    () =>
      ouvertureGalerie(
        tatoueur ? galerieParStyles(tatoueur) : [],
        styleRecherche,
        renduRecherche,
        natureRecherche,
        photoRecherche
      ),
    [tatoueur, styleRecherche, renduRecherche, natureRecherche, photoRecherche]
  );
  const groupes = ouverture.groupes;

  /** LE STYLE AFFICHÉ — c'est une vignette de l'onglet « Portfolio »
      qui en change (nº 197-§4) ; la fenêtre est remontée à chaque
      ouverture (voir la clé dans GrilleTatoueurs), l'état repart donc
      toujours du bon style. */
  const [styleAffiche, setStyleAffiche] = useState(ouverture.style);
  /** LA SÉRIE OUVERTE (nº 204-§3) — catégorie + rendu d'une vignette
      touchée : le carrousel ne montre alors QUE cette galerie de
      dépôt. `null` à l'ouverture : le style entier, comme toujours. */
  /*  ⚠️ LA CATÉGORIE CHERCHÉE RESTREINT LA SÉRIE DÈS L'OUVERTURE
      (nº 217-§3) — même règle que la page de fiche : `rendu` vide veut
      dire « tous les rendus ».
      §4 (nº 272) — ET UN STYLE CHERCHÉ SANS CATÉGORIE VAUT
      « RÉALISATIONS » : la catégorie voyageait (nº 247) mais les
      chemins de recherche PAR STYLE SEUL (le champ « Recherche », les
      pages de style) n'en portent pas — la fiche montrait alors le
      style ENTIER, flashs compris (mesuré : 5 photos au lieu de 4).
      Or chercher « réaliste » sur ce site, c'est chercher des
      réalisations réalistes — « Réalisations » est la catégorie par
      défaut du menu Explorer (NATURE_PAR_DEFAUT). La fiche ouverte
      depuis une recherche ne montre QUE le carrousel demandé — le
      style ET la catégorie ; le reste du travail reste accessible par
      l'onglet Portfolio, rien n'est caché définitivement. SANS
      recherche (aucun style, aucune catégorie) : tout, comme
      toujours. */
  const serieCherchee =
    natureRecherche || styleRecherche
      ? { nature: natureRecherche || NATURE_PAR_DEFAUT, rendu: renduRecherche }
      : null;
  /*  §2 (nº 278) — MÊME RÈGLE QUE LA PAGE : sans recherche, on ouvre
      l'ensemble de la PREMIÈRE photo, jamais le style entier (règles 1
      et 3 du carrousel — voir lib/photos-tatoueur). */
  /*  §4 (nº 302) — UNE PHOTO DEMANDÉE COMMANDE SA PROPRE SÉRIE, et son
      rang s'y compte : ouvrir une carte de « Ma sélection de photos »
      tombe sur ELLE (« 8/14 »). Même écriture que la page. */
  const surUnePhoto = ouvertureSurUnePhoto(groupes, photoRecherche);
  const serieInitiale =
    surUnePhoto?.serie ??
    serieCherchee ??
    serieDeLOuverture(groupes, ouverture.style);
  const [serieOuverte, setSerieOuverte] = useState<{
    nature: string;
    rendu: string;
  } | null>(serieInitiale);
  const [indice, setIndice] = useState(
    surUnePhoto ? surUnePhoto.indice : serieCherchee ? 0 : ouverture.indice
  );

  /** LES DEUX BOÎTES QUI DÉFILENT — la fenêtre entière quand elle est
      en une colonne, la colonne de droite quand elle est en deux. Un
      toucher sur une vignette les remonte toutes les deux : dans une
      fenêtre superposée, le défilement de la PAGE ne veut rien dire
      (le corps est gelé le temps de l'ouverture). */
  const fenetreRef = useRef<HTMLDivElement>(null);
  const colonneRef = useRef<HTMLDivElement>(null);

  //  §3 (nº 293) — LA MÊME RÈGLE QUE LA PAGE, et pour la même raison :
  //  on ne se pose jamais sur un groupe VIDE. À défaut, le premier qui
  //  a des photos — le carrousel principal de la fiche, jamais rien.
  //  (Voir la note longue dans FicheTatoueur.)
  /**
   * §2 (nº 294) — LA nº 293-§3 EST ANNULÉE, SUR CONSIGNE.
   * ------------------------------------------------------------------
   * Elle repêchait le premier groupe GARNI quand celui du style
   * demandé était vide, pour qu'une photo apparaisse toujours en haut.
   * Le propriétaire veut l'inverse : une fiche ouverte depuis un lien
   * interne à une autre fiche commence par Profil / Portfolio, sans
   * photo. On revient donc au choix d'avant — le groupe demandé, sinon
   * le premier, garni ou non.
   * ⚠️ CE QUI RESTE DE LA nº 293, ET QUI EST UTILE : un carrousel sans
   * photo ne réserve AUCUNE place (voir CarrouselPortfolio). Pas de
   * grand rectangle noir : rien du tout, et la page commence bien par
   * Profil / Portfolio.
   */
  const groupeAffiche =
    groupes.find((groupe) => groupe.slug === styleAffiche) ?? groupes[0];
  const photosDuStyleEntier = groupeAffiche?.photos ?? [];
  /*  §1 (nº 247) — L'ÉCRITURE UNIQUE (`serieMontree`) : la copie du
      filtre qui vivait ici est partie, avec son repli. Une catégorie
      demandée n'est jamais violée — voir lib/photo-tatoueur. */
  const photosRestreintes = serieMontree(photosDuStyleEntier, serieOuverte);
  //  Jamais de fenêtre sans image : un style qui n'a rien de la
  //  catégorie demandée se montre entier — mais LA SÉRIE EST ALORS
  //  ABANDONNÉE, le carrousel ne déclare plus aucune catégorie (même
  //  règle que la page).
  const serieEffective = photosRestreintes.length > 0 ? serieOuverte : null;
  const photosDuStyleAffiche =
    photosRestreintes.length > 0 ? photosRestreintes : photosDuStyleEntier;
  const n = photosDuStyleAffiche.length;

  const ouverte = tatoueur !== null;

  // LE CLAVIER : Échap referme, ← → naviguent (avec butées) — et le
  // défilement de la grille est bloqué tant que la fenêtre est là.
  // (Des effets de PONT vers le navigateur : aucun état React n'y est
  // écrit directement.)
  /**
   * ⚠️ LE NOMBRE DE PHOTOS N'EST PLUS UNE DÉPENDANCE (passe nº 219-§1)
   * ==================================================================
   * `n` figurait dans la liste de l'effet ci-dessous. Or `n` change à
   * CHAQUE changement de sélecteur dans le portfolio — et l'effet, lui,
   * GÈLE LE CORPS DU DOCUMENT (`position: fixed`) et le dégèle à son
   * nettoyage, en repositionnant la page au passage. Chaque clic sur un
   * sélecteur dégelait donc tout le document, le repositionnait, puis
   * le regelait : sur un iPhone, c'est une remise en page complète de
   * la mosaïque restée derrière, images comprises, à chaque clic. Deux
   * ou trois clics, et l'appareil sature — c'est très exactement ce que
   * décrit le propriétaire.
   * L'effet ne dépend plus que de ce qui le concerne : la fenêtre est-
   * elle ouverte, et où était la grille. Les flèches du clavier lisent
   * le nombre de photos dans une RÉFÉRENCE, tenue à jour à chaque
   * rendu — une lecture, pas une dépendance.
   */
  const nombreDePhotos = useRef(n);
  //  ⚠️ MIS À JOUR DANS UN EFFET À LUI, jamais pendant le rendu (la
  //  règle du projet) : cet effet-ci ne fait qu'écrire un nombre, il
  //  ne gèle rien et ne repositionne rien.
  useEffect(() => {
    nombreDePhotos.current = n;
  }, [n]);
  useEffect(() => {
    if (!ouverte) return;
    //  LE JETON DE CETTE FENÊTRE dans la pile des claviers : les
    //  touches n'agissent que si elle est LA DERNIÈRE OUVERTE — la
    //  fenêtre du dessus quand plusieurs s'empilent (nº 226-§5).
    const jeton = {};
    pileClavier.push(jeton);
    const surTouche = (evenement: KeyboardEvent) => {
      if (pileClavier[pileClavier.length - 1] !== jeton) return;
      if (evenement.key === "Escape") {
        surFermeture();
      } else if (evenement.key === "ArrowRight") {
        setIndice((courant) =>
          Math.min(courant + 1, nombreDePhotos.current - 1)
        );
      } else if (evenement.key === "ArrowLeft") {
        setIndice((courant) => Math.max(courant - 1, 0));
      }
    };
    window.addEventListener("keydown", surTouche);
    // FIGER LA GRILLE SANS PERDRE SA POSITION. Couper l'overflow de la
    // racine remettrait son défilement à zéro (la grille sauterait en
    // haut derrière le voile). On fige donc le CORPS en place, décalé
    // de la position DU CLIC (capturée par la grille : après le
    // pushState, le routeur déplace brièvement le défilement — le lire
    // ici donnerait n'importe quoi) — et on la rend à la fermeture.
    //  ⚠️ LE GEL EST COMPTÉ (nº 226-§5) : quand des fenêtres
    //  s'empilent, seule la PREMIÈRE gèle (le corps l'est déjà pour
    //  les suivantes, à la même position) et seule la DERNIÈRE à
    //  partir dégèle et rend le défilement — fermer la fenêtre du
    //  dessus ne doit jamais rendre la page tant qu'une autre vit
    //  dessous. Le drapeau `data-fenetre-fiche` suit le même compte.
    //  ⚠️ LE GEL EST L'ÉCRITURE UNIQUE DU SITE (extraite nº 259-§3,
    //  lib/gel-du-corps) : même compte, mêmes valeurs, même
    //  restitution — la feuille du menu au doigt le partage désormais,
    //  et une feuille ouverte par-dessus une fenêtre ne peut plus
    //  dégeler la page en se refermant.
    const degeler = gelerLeCorps(positionGrille);
    //  Idempotent : la grille le pose déjà avant son pushState — mais
    //  une fenêtre de base qui REVIENT (la pile au-dessus d'elle
    //  vient de se fermer) doit le reposer elle-même.
    document.documentElement.setAttribute("data-fenetre-fiche", "1");
    return () => {
      window.removeEventListener("keydown", surTouche);
      const rang = pileClavier.indexOf(jeton);
      if (rang !== -1) pileClavier.splice(rang, 1);
      degeler();
      if (corpsGele()) return;
      // Le drapeau posé à l'ouverture (par la grille ou par la pile) :
      // on le retire quand la DERNIÈRE fenêtre disparaît, quelle que
      // soit la façon dont elle disparaît.
      document.documentElement.removeAttribute("data-fenetre-fiche");
    };
  }, [ouverte, positionGrille, surFermeture]);

  if (!tatoueur) return null;

  const rang = Math.min(indice, Math.max(0, n - 1));
  const photo = photosDuStyleAffiche[rang];
  /** LA PHOTO QUE LE CŒUR ENREGISTRE — celle qu'on regarde. `cle` est
      l'identifiant de base pour un portfolio catalogué (nº 31) ; les
      fiches d'avant portent une clé fabriquée, sans ligne en face.
      ⚠️ PLUS DE VERDICT SUR LA FICHE ENTIÈRE (passe nº 142) : c'est
      `BoutonCoeurPhoto` qui juge CETTE image-ci, comme sur la page de
      fiche — voir le commentaire jumeau dans FicheTatoueur.tsx. */
  const photoEnregistrable = photo?.cle;
  const stylePrincipal = groupes[0]
    ? { slug: groupes[0].slug, label: groupes[0].label }
    : tatoueur.styles[0]
      ? { slug: tatoueur.styles[0], label: libelleStyle(tatoueur.styles[0]) }
      : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Fiche de ${tatoueur.nom}`}
      className="fixed inset-0 z-[60]
                 opacity-100 transition-opacity duration-200 starting:opacity-0"
    >
      {/* Le VOILE : la grille reste visible derrière ; un clic referme. */}
      <div
        aria-hidden="true"
        onClick={surFermeture}
        className="absolute inset-0 bg-black/80"
      />

      {/* LA CROIX — hors de la fenêtre, dans la zone ombrée. */}
      <button
        type="button"
        aria-label="Fermer la fiche"
        onClick={surFermeture}
        className="absolute top-4 right-5 z-[2] w-11 h-11 flex items-center
                   justify-center text-white hover:text-primaire transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m5 5 14 14M19 5 5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* LA FENÊTRE — centrée. Large : deux colonnes. Étroite : UNE
          colonne (photo en haut, informations dessous) qui défile
          verticalement — le comportement d'Instagram, jamais l'état
          écrasé. La marge haute étroite (pt-16) laisse sa place à la
          croix. */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pt-16 lg:p-8 pointer-events-none">
        {/* ⚠️ LA FENÊTRE EST CENTRÉE EXACTEMENT COMME AVANT LA Nº 200
            (nº 202). Cette enveloppe ne fait qu'accrocher le fil
            d'Ariane : elle épouse la fenêtre (le fil, HORS du flux, ne
            pèse rien — ni dans sa largeur, ni dans sa hauteur), et
            c'est donc toujours la fenêtre seule que le conteneur
            centre. Pas un pixel de décalage. */}
        <div
          className="relative flex max-h-full flex-col
                     w-[min(560px,100%)] lg:w-auto"
        >
          {/* §1-§2 (nº 201) — LE FIL D'ARIANE, TEXTE SEUL DANS LE
              VOILE. Le bandeau de la nº 200 est SUPPRIMÉ : une surface
              sombre sur un voile déjà sombre ne se distinguait pas, et
              elle recouvrait le haut de la photo. Plus aucun fond,
              aucun encadré — le texte est posé AU-DESSUS de la fenêtre
              (`bottom-full` : il s'écrit dans le voile, vers le haut,
              et s'y adapte — JAMAIS la fenêtre, nº 202), aligné à
              gauche sur son bord, à 8 px de son bord haut (l'air d'une
              ligne, ni collé ni flottant). Gris clair sur le voile, le
              segment courant plus clair que les précédents — jamais de
              rose. */}
          <nav
            aria-label="Fil d'Ariane"
            className="pointer-events-auto absolute bottom-full left-0 mb-2 w-max max-w-full"
          >
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/70">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              {stylePrincipal && (
                <>
                  <li aria-hidden="true">›</li>
                  <li>
                    <Link
                      href={`/tatouage/${stylePrincipal.slug}/${tatoueur.ville_slug}`}
                      className="hover:text-white transition-colors"
                    >
                      {stylePrincipal.label}
                    </Link>
                  </li>
                </>
              )}
              <li aria-hidden="true">›</li>
              <li aria-current="page" className="font-semibold text-white">
                {tatoueur.nom}
              </li>
            </ol>
          </nav>

          <div
            ref={fenetreRef}
            className="pointer-events-auto flex flex-col lg:flex-row
                       w-full lg:w-auto min-h-0
                       lg:h-[min(88vh,940px,calc((100vw-476px)*1.25))]
                       lg:max-w-[min(1200px,calc(100vw-96px))]
                       overflow-y-auto lg:overflow-hidden overscroll-contain
                       rounded-b-lg rounded-t-none lg:rounded-none lg:rounded-r-lg bg-sombre-carte
                       shadow-[0_24px_80px_rgba(0,0,0,0.6)]
                       scale-100 transition-transform duration-200 starting:scale-[0.97]"
          >
            {/* ---- LA PHOTO : collée aux bords — haut, gauche et bas en
                deux colonnes ; haut, gauche et droite en une seule. La
                hauteur de la fenêtre est bornée pour que le 4:5 ne soit
                JAMAIS écrasé. Le carrousel est CELUI DE LA PAGE : mêmes
                flèches, même pagination, même capsule. ---- */}
            {/*  §1 (nº 294) — LE NOIR DERRIÈRE LA PHOTO S'EN VA, et c'est
                 la moitié « fenêtre superposée » du même défaut. CE QUE
                 LA nº 292 AVAIT CHANGÉ ICI : le cadre a reçu son propre
                 format 4/5, calculé sur sa largeur ARRONDIE AU PIXEL
                 INFÉRIEUR (nº 280) ; cette boîte-ci, elle, tire sa
                 largeur de sa hauteur et tombe donc à virgule. Le cadre
                 est devenu un cheveu plus étroit et plus court qu'elle
                 — et ce cheveu montrait le noir. Sans fond, il n'y a
                 plus rien à montrer. */}
            {/*  §1 (nº 294) — LA SONDE RELÈVE AUSSI ICI. Le liseré se
                 voit dans cette fenêtre comme sur la page : elle doit
                 pouvoir y prendre ses nombres. Elle ne rend rien sans
                 `?sonde-photo=1`, et une seule sonde s'affiche à la
                 fois — la plus récente, donc celle-ci. */}
            <SondePhoto />
            <div className="relative w-full lg:w-auto lg:h-full aspect-[4/5] min-w-0 shrink-0 lg:shrink bg-black select-none">
              <CarrouselPortfolio
                //  §1 (nº 296) — LA FENÊTRE RETROUVE SON ÉTAT D'AVANT LA
                //  nº 292 : les corrections des nº 292 à 295 étaient
                //  pensées pour la PAGE, dont la géométrie est
                //  l'inverse de la sienne. Voir la note du drapeau.
                dansLaFenetre
                photos={photosDuStyleAffiche}
                nomTatoueur={tatoueur.nom}
                styleLabel={groupeAffiche?.label ?? ""}
                //  §1 (nº 247) — la catégorie déclarée est celle de
                //  TOUTES les photos montrées, sans exception.
                natureDeLaSerie={serieEffective?.nature ?? ""}
                indice={rang}
                surChangement={setIndice}
              >
                {/* LE PARTAGE À GAUCHE, LE CŒUR À DROITE — la place des
                    deux boutons du web depuis la nº 198-§3, celle de la
                    page. Chacun seul dans son angle (nº 201-§3 : le
                    bandeau parti, plus rien ne recouvre le haut de la
                    photo, ils reprennent leurs angles). */}
                <div className="absolute top-3 left-3 z-[2]">
                  <BoutonPartageFiche
                    nomArtisan={tatoueur.nom}
                    /*  §3 (nº 280) — le carrousel ouvert, comme sur la
                        page de fiche : une seule écriture d'adresse. */
                    cheminFiche={cheminDuCarrousel(
                      tatoueur.slug,
                      styleAffiche,
                      serieEffective
                    )}
                    variante="fiche"
                    avecFenetre
                    sombre
                    metier={stylePrincipal?.label}
                    commune={villeAffichee(tatoueur.ville_nom)}
                    marque={MARQUE_YOKOFOLIO.nom}
                  />
                </div>
                {photoEnregistrable && (
                  <div className="absolute top-3 right-3 z-[2]">
                    <BoutonCoeurPhoto
                      photoId={photoEnregistrable}
                      //  L'ENSEMBLE DE LA PHOTO REGARDÉE — calculé
                      //  depuis la GALERIE BRUTE, la seule liste où
                      //  chaque photo porte ses trois tags : la réponse
                      //  ne dépend donc plus du chemin d'arrivée
                      //  (nº 210-§2, voir le commentaire jumeau dans
                      //  FicheTatoueur).
                      variante="fiche"
                    />
                  </div>
                )}
              </CarrouselPortfolio>
            </div>

            {/* ---- LE CONTENU — sous la photo en une colonne (il défile
                avec la fenêtre), à sa droite en deux (il défile tout
                seul). ⚠️ C'EST LE COMPOSANT DE LA PAGE : les deux onglets,
                les vignettes par style, et tout l'onglet « Profil ». Rien
                n'est redessiné ici. ---- */}
            {/*  ⚠️ SON FOND EST ÉCRIT (nº 207-§4) : les deux blocs qui
                 ne défilent pas le reprennent par `bg-inherit`. C'est
                 déjà la couleur de la fenêtre — rien ne change à
                 l'œil. */}
            <div
              ref={colonneRef}
              className="w-full lg:w-[380px] shrink-0 lg:h-full lg:overflow-y-auto p-5 sm:p-6 flex flex-col bg-sombre-carte [--fond-colonne:var(--rw-sombre-carte)]"
            >
              <ContenuFiche
                tatoueur={tatoueur}
                groupes={groupes}
                //  §3 (nº 276) — plus de natureCherchee / renduCherche :
                //  le panneau montre les deux sections (la série
                //  cherchée continue d'ouvrir le carrousel de gauche,
                //  serieCherchee n'a pas bougé).
                surSerieChoisie={(serie) => {
                  setStyleAffiche(serie.style);
                  setSerieOuverte({ nature: serie.nature, rendu: serie.rendu });
                  /*  §5 (nº 310) — LA PHOTO TOUCHÉE, PAS LA PREMIÈRE.
                      ------------------------------------------------
                      C'ÉTAIT ÉCRIT `setIndice(0)`, ET C'EST TOUT LE
                      DÉFAUT : la galerie envoie le RANG de la photo
                      cliquée depuis la nº 306-§6 (`serie.indice`), la
                      fiche PLEINE PAGE l'honore — et cette fenêtre-ci,
                      écrite avant, le jetait à la poubelle en reposant
                      l'indice à zéro. Cliquer la 4ᵉ photo ouvrait donc
                      bien la bonne série, mais sur sa PREMIÈRE image :
                      vu de l'écran, « il ne se passe rien ».
                      Les deux contextes lisent maintenant la MÊME
                      valeur, de la même façon. Le repli sur zéro reste
                      pour la grille du doigt, qui n'envoie pas de rang
                      (nº 306-§6). */
                  setIndice(serie.indice ?? 0);
                  //  ⚠️ LA COLONNE NE REMONTE PLUS (nº 218-§3). Elle le
                  //  faisait depuis la nº 197-§4 ; dans cette fenêtre,
                  //  la photo est en permanence sous les yeux, à
                  //  gauche : la remontée ne révélait rien et faisait
                  //  perdre la place qu'on venait de choisir dans la
                  //  galerie. Les deux références restent utilisées par
                  //  la mise en page, on ne les touche simplement plus
                  //  ici.
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
