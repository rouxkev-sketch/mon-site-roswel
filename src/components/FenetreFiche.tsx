"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { corpsGele, gelerLeCorps } from "@/lib/gel-du-corps";
import { declarerDepartVouluVersLAccueil } from "@/lib/navigation-session";
import Link from "next/link";
//  §1 (nº 459) — `villeAffichee`, `MARQUE_YOKOFOLIO`,
//  `BoutonPartageFiche` et `cheminDuCarrousel` sont partis avec la
//  pastille de partage de la photo : le partage vit dans la rangée du
//  va-et-vient (ContenuFiche, nº 458-§2).
import { libelleStyle } from "@/config/tatouage";
import { BoutonCoeurPhoto } from "@/components/BoutonCoeurPhoto";
import {
  CarrouselPortfolio,
  PointsDuCarrousel,
} from "@/components/CarrouselPortfolio";
import { ContenuFiche } from "@/components/ContenuFiche";
import { SondePhoto } from "@/components/SondePhoto";
import {
  galerieParStyles,
  ouvertureGalerie,
  ouvertureSurUnePhoto,
  serieDeLOuverture,
  serieMontree,
} from "@/lib/photo-tatoueur";
import { NATURE_PAR_DEFAUT, titreDeGalerie } from "@/lib/photos-tatoueur";
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
  avecVoile = true,
  habillageEfface = false,
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
  /**
   * §2 (nº 320) — CETTE FENÊTRE PEINT-ELLE LE VOILE ?
   * ------------------------------------------------------------------
   * VRAI PAR DÉFAUT : une fenêtre seule est la première, elle le peint.
   * FAUX pour toute fenêtre qui s'ouvre PAR-DESSUS une autre — le voile
   * est déjà là, dessous, et un second ne ferait qu'assombrir la page
   * du fond jusqu'à l'effacer (0,96 à deux fenêtres, 0,992 à trois).
   * ⚠️ C'EST L'APPELANT QUI TRANCHE, et c'est voulu : lui seul sait ce
   * qu'il y a sous lui. Voir `PileFiches`, qui porte la règle pour
   * toutes les surfaces du site.
   */
  avecVoile?: boolean;
  /**
   * ██ §1 (nº 440) — UN SEUL HABILLAGE À LA FOIS DANS LA PILE ██
   * ------------------------------------------------------------------
   * LE DÉFAUT (relevé du propriétaire, version ordinateur) : quand des
   * fiches s'empilent (fiche ouverte depuis une fiche), CHAQUE fenêtre
   * gardait son fil d'Ariane (au-dessus d'elle, dans le voile) et son
   * titre de galerie (au-dessous) — les fenêtres étant toutes centrées
   * au même endroit, les textes de toutes les couches se superposaient,
   * illisibles.
   * LA RÈGLE : seule la fiche DU SOMMET montre son habillage. VRAI ici
   * quand une autre fiche vit PAR-DESSUS celle-ci : le fil d'Ariane et
   * le titre passent alors en `invisible` — la VISIBILITÉ seule change,
   * jamais la place ni le style (les deux textes sont hors du flux,
   * `absolute` : visibles ou non, ils ne pèsent rien — la fenêtre ne
   * bouge pas d'un pixel). `visibility: hidden` coupe aussi les clics :
   * les liens du fil d'une couche cachée ne peuvent pas voler ceux de
   * la couche du dessus.
   * QUI LE SAIT : la position dans la pile, jamais un bricolage visuel —
   * PileFiches le dit à chaque fenêtre empilée (dernier rang = sommet),
   * la mosaïque et « Ma sélection » à leur fenêtre de base
   * (`profondeurPile > 0` = une fiche vit dessus). À la fermeture de la
   * fiche du dessus, le rendu suivant rend son habillage à celle qui
   * redevient le sommet — la mécanique de fermeture (nº 438) n'est pas
   * touchée.
   */
  habillageEfface?: boolean;
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
  /**
   * ██ §1 (nº 372) — LA PHOTO REGARDÉE ARRIVAIT APRÈS LA SEMENCE ██
   * ------------------------------------------------------------------
   * CE QUI SE PASSAIT, et c'est un défaut de TIMING, pas de câblage :
   * les deux `useState` ci-dessus ne sont évalués QU'AU MONTAGE. Or
   * cette fenêtre est montée EN PERMANENCE (avec `tatoueur = null`
   * quand elle est fermée), et son état d'ouverture ne dépend pas
   * seulement de sa clé : `visible` attend que le chemin du routeur
   * rattrape l'adresse poussée à la main (`pushState` brut — la mesure
   * de la nº 337-§2). Au premier rendu qui suit le clic, la fiche peut
   * donc être encore `null` : `groupes` est vide, `ouvertureSurUnePhoto`
   * ne trouve rien, et l'indice est SEMÉ À ZÉRO. Quand la fiche arrive
   * un rendu plus tard, plus personne ne relit la photo — d'où la
   * première photo, sur le web seulement (au doigt, la page de fiche
   * naît, elle, avec l'adresse déjà complète).
   * LA CORRECTION, sans nouveau mécanisme : un AJUSTEMENT PENDANT LE
   * RENDU — le motif officiel de React, déjà employé dans
   * CarrouselPortfolio (`indiceVu`) et ContenuFiche (`requeteLue`).
   * Dès que le couple (fiche, photo demandée) change, on resème. Comme
   * cela se joue PENDANT le rendu, aucune image intermédiaire n'est
   * peinte : jamais la photo 1 puis un saut.
   * ⚠️ ET SEULEMENT SUR CE COUPLE : une fois la fenêtre ouverte, faire
   * défiler ses photos ne change ni la fiche ni la photo demandée —
   * l'ajustement ne se déclenche donc pas, et le geste garde la main.
   */
  const semence = `${tatoueur?.slug ?? ""}|${photoRecherche}`;
  const [semenceVue, setSemenceVue] = useState(semence);
  if (semence !== semenceVue) {
    setSemenceVue(semence);
    if (surUnePhoto) {
      setSerieOuverte(surUnePhoto.serie);
      setIndice(surUnePhoto.indice);
    }
  }

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

  /**
   * ██ §2 (nº 393) — LE TITRE DE LA GALERIE MONTRÉE ██
   * ==================================================================
   * LE PENDANT EXACT DE LA nº 376, qui a posé ce titre sous la photo de
   * tête AU DOIGT : la même chaîne, composée par la même écriture
   * unique (`titreDeGalerie`, lib/photos-tatoueur). Rien n'est
   * recomposé ici — le portfolio, la fiche au doigt et cette fenêtre ne
   * peuvent pas dire trois choses différentes de la même galerie, et le
   * changement de séparateur de la §1 les emporte tous les trois d'un
   * coup.
   *
   * LE RENDU VIENT DE `serieEffective`, PAS DE `serieOuverte`, et pour
   * la raison écrite à la nº 376 : quand la série demandée ne donne
   * aucune photo, le carrousel montre le STYLE ENTIER (rendus mêlés) et
   * `serieEffective` retombe à `null` — le titre ne dit alors que le
   * style, ce qui est exactement ce qui est à l'écran.
   *
   * IL SUIT LE CONTENU DE LA FENÊTRE : `groupeAffiche` et
   * `serieEffective` sont les MÊMES valeurs que celles qui décident des
   * photos (`photosDuStyleAffiche`, deux lignes plus haut). Choisir une
   * autre galerie dans le panneau de droite (`surSerieChoisie`) change
   * `styleAffiche` et `serieOuverte` : le titre se recompose dans le
   * même rendu que la photo. Il ne suit PAS le défilement du carrousel,
   * et il n'a pas à le faire — une galerie ne contient qu'un style, donc
   * `indice` n'entre pas dans ce calcul.
   *
   * ⚠️ LES DEUX CAS OÙ RIEN NE DOIT S'AFFICHER, ET ILS SONT COUVERTS
   * SANS UNE LIGNE DE PLUS :
   *  · une fiche sans aucune publication → `n` vaut 0, la chaîne est
   *    vide ;
   *  · une galerie sans libellé exploitable → `titreDeGalerie` rend la
   *    chaîne vide par construction (elle sort avant d'écrire quoi que
   *    ce soit quand le style est vide).
   * Dans les deux cas le rendu est gardé par `titreDeLaGalerie && (…)`
   * plus bas : pas de ligne, pas d'espace, et JAMAIS une puce orpheline
   * — le séparateur n'existe que lorsqu'il a un texte de chaque côté.
   */
  const titreDeLaGalerie =
    n > 0 ? titreDeGalerie(groupeAffiche?.label, serieEffective?.rendu) : "";

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
      {/*  LE VOILE : la grille reste visible derrière ; un clic referme.
           §2 (nº 320) — MAIS UN SEUL VOILE POUR TOUTE LA PILE.
           ------------------------------------------------------------
           LE DÉFAUT : chaque fenêtre peignait le sien. Deux fenêtres
           empilées faisaient donc 0,8 puis 0,8 par-dessus — soit 0,96
           de noir cumulé ; à trois, 0,992 : la page du fond
           disparaissait, et l'on ne savait plus d'où l'on venait.
           LA RÈGLE : SEULE LA PREMIÈRE FENÊTRE SUPERPOSÉE POSE UN
           VOILE ; les suivantes n'en ajoutent AUCUN. Le voile
           appartient à la PILE, pas à la fenêtre — il est peint une
           seule fois, tout en bas. C'est l'appelant qui le sait (lui
           seul connaît ce qu'il y a dessous), d'où le paramètre.
           ⚠️ LA SURFACE RESTE, MÊME SANS PEINTURE : c'est elle qui
           referme au clic. On lui retire sa couleur, jamais son rôle —
           sans quoi cliquer à côté d'une fenêtre empilée ne fermerait
           plus rien.
           ⚠️ ET AUCUN FONDU N'EST AJOUTÉ ICI (rappel de la nº 234) :
           l'opacité qui s'anime vit sur l'enveloppe `role="dialog"`
           ci-dessus, jamais sur une plaque de verre. */}
      <div
        aria-hidden="true"
        data-voile-fiche={avecVoile ? "" : undefined}
        onClick={surFermeture}
        className={`absolute inset-0${avecVoile ? " bg-black/80" : ""}`}
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
            //  §1 (nº 440) — sous une autre fiche, le fil s'efface
            //  (visibilité seule : même place, même style, zéro clic).
            className={`pointer-events-auto absolute bottom-full left-0 mb-2 w-max max-w-full${
              habillageEfface ? " invisible" : ""
            }`}
          >
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/70">
              <li>
                {/*  §1 (nº 429) — l'intention est déclarée : si cette
                     navigation douce dégénère en document (repli du
                     routeur), le filet de réparation la respecte au
                     lieu de renvoyer vers la mosaïque quittée. */}
                <Link
                  href="/"
                  onClick={() => declarerDepartVouluVersLAccueil()}
                  className="hover:text-white transition-colors"
                >
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

          {/*  ██ §1 (nº 499) — ESSAI : LA FENÊTRE PREND LE FOND DE LA
               PAGE ██
               ==============================================================
               CE QU'ELLE PORTAIT : `carte` (#1A1F26). Le relevé de la
               nº 498 a montré pourquoi elle paraissait grise — à la
               nº 466 le fond de page a été fortement ASSOMBRI
               (#1A1A1D → #0B0F14) alors que les autres barreaux n'ont
               été que RETINTÉS en bleu : la fenêtre se retrouvait donc
               à peu près à la clarté de l'ancien fond du site.
               CE QU'ELLE PORTE : `fond` (#0B0F14), le fond de la page.

               ⚠️ LA COULEUR NE DÉLIMITE PLUS RIEN, et c'est le point à
               juger : le contraste fenêtre / page passe de 1,16 à
               1,00 — identiques au pixel près. Ce qui reste pour la
               découper, et qui suffit ou non selon l'œil :
                1. LE VOILE, et c'est lui le vrai découpage : la page
                   du dessous reçoit `bg-black/80`, ce qui la ramène à
                   #020304 — quasi noire. La fenêtre, restée à
                   #0B0F14, s'en détache de 1,07. C'est peu, mais c'est
                   dans le bon sens : c'est la PAGE qui s'efface, pas
                   la fenêtre qui s'allume.
                2. L'OMBRE PORTÉE, 80 px de flou à 60 % de noir, juste
                   dessous — le seul trait franc qui reste.
                3. LES COINS ARRONDIS à droite, et LA PHOTO qui occupe
                   toute la moitié gauche : c'est elle, en pratique,
                   qui dit où la fenêtre commence.
               ⚠️ MON AVIS, PUISQU'IL EST DEMANDÉ : la fenêtre ne
               devient PAS indistincte — la photo et l'ombre la tiennent
               —, mais elle perd son côté « panneau posé sur le site »
               au profit d'un « le site continue ici ». C'est un choix
               de sens, pas un défaut ; il se juge à l'œil, pas au
               calcul. Aucun contour n'est ajouté pour compenser
               (charte).

               ██ §2 (nº 501) — L'ENVELOPPE NE PEINT PLUS ██
               ==============================================================
               CE QUI CHANGE : `bg-sombre-fond`, posé ici par la nº 499,
               est RETIRÉ de ce conteneur. Chacune des deux moitiés
               porte désormais son fond EN PROPRE — la boîte de la photo
               depuis cette passe (§1), la colonne de droite depuis la
               nº 499 (elle ne l'a jamais perdu). L'enveloppe, elle, ne
               fait plus que les tenir côte à côte.
               ⚠️ CE QUE ÇA CHANGE À L'ŒIL : RIEN, et c'est voulu — les
               deux moitiés se partagent toute la largeur, et elles
               peignent la même couleur qu'avant. C'est un changement de
               STRUCTURE, décidé en connaissance de cause.
               ⚠️ CE QUI SE TROUVE DERRIÈRE, MAINTENANT QU'ELLE NE PEINT
               PLUS : le VOILE (`bg-black/80` sur la page #0B0F14, donc
               #020304 — presque noir). Ni l'enveloppe de centrage ni
               le porteur du fil d'Ariane ne peignent quoi que ce soit.
               Le voile n'est visible QUE si les deux moitiés ne
               couvrent pas toute la largeur au pixel près — c'est le
               seul risque de cette passe, et il est symétrique de celui
               que la nº 500 vient de fermer : un liseré PLUS SOMBRE au
               lieu d'un liseré plus clair.
               ⚠️ CE QUI NE DÉPENDAIT PAS DE CE FOND, vérifié un par un :
               `--fond-colonne` est posée sur LA COLONNE (pas ici), donc
               les blocs collants gardent leur masque ; les coins
               arrondis restent dessinés parce que `lg:overflow-hidden`
               rogne les ENFANTS, qui peignent ; l'ombre portée est
               dessinée autour de la boîte, qu'elle ait un fond ou non ;
               et la zone sous la colonne au contenu court est tenue par
               son `lg:h-full`. */}
          <div
            ref={fenetreRef}
            className="pointer-events-auto flex flex-col lg:flex-row
                       w-full lg:w-auto min-h-0
                       lg:h-[min(88vh,940px,calc((100vw-476px)*1.25))]
                       lg:max-w-[min(1200px,calc(100vw-96px))]
                       overflow-y-auto lg:overflow-hidden overscroll-contain
                       rounded-b-lg rounded-t-none lg:rounded-none lg:rounded-r-lg
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
            {/*  ██ §2 (nº 500) — LA BOÎTE DE LA PHOTO NE PEINT PLUS ██
                 ==============================================================
                 ELLE PORTAIT `bg-black`, un noir plus sombre que le
                 fond de la fenêtre. Il ne se voyait que dans deux
                 situations — pendant le chargement d'une photo, et sur
                 le demi-pixel que l'arrondi du cadre laisse découvert —
                 mais dans les deux cas il faisait une SECONDE couleur
                 dans une fenêtre qui n'en veut qu'une. Décision du
                 propriétaire : une seule couleur dans toute la fenêtre.
                 CE QUI CHANGE À L'ŒIL : pendant le chargement, la
                 moitié gauche montre le fond de la fenêtre au lieu d'un
                 rectangle noir. Rien d'autre — la photo arrivée le
                 couvrait déjà entièrement.
                 ⚠️ LA PLACE RESTE RÉSERVÉE, ET ELLE NE VIENT PAS D'ICI :
                 `aspect-[4/5]` sur cette boîte et sur la colonne du
                 carrousel donne la hauteur AVANT la première image
                 (l'acquis nº 280, redit par la nº 295). Un fond n'a
                 jamais réservé quoi que ce soit — il ne faisait que
                 colorer une place déjà tenue.
                 ⚠️ LA GÉOMÉTRIE NE BOUGE PAS D'UN PIXEL : `aspect-[4/5]`,
                 `lg:h-full`, `min-w-0`, `shrink-0 lg:shrink` sont
                 intouchés. Une seule classe de couleur disparaît.
                 ██ §1 (nº 501) — UN FOND REVIENT ICI, MAIS PAS LE NOIR ██
                 --------------------------------------------------------
                 CE QUI CHANGE PAR RAPPORT À LA nº 500 : cette boîte
                 peint de nouveau — avec `fond` (#0B0F14), LA COULEUR DU
                 SITE, jamais le noir pur qu'elle portait avant.
                 POURQUOI C'EST AUTRE CHOSE QUE LE RETOUR EN ARRIÈRE :
                 le noir de la nº 500 faisait une SECONDE couleur dans
                 la fenêtre — il se voyait pendant le chargement et sur
                 le demi-pixel du cadre. Celui-ci est la MÊME couleur
                 que tout le reste : il ne peut, par construction, se
                 distinguer de rien. Il ne rétablit aucun des quatre
                 défauts fermés à la nº 500, puisqu'aucun d'eux ne
                 tenait à la PRÉSENCE d'un fond, mais à sa DIFFÉRENCE.
                 CE QU'IL PORTE MAINTENANT, ET C'EST SON RÔLE : la
                 moitié gauche de la fenêtre n'a plus d'enveloppe qui
                 peigne derrière elle (§2, juste au-dessus). C'est donc
                 CETTE boîte, et elle seule, qui couvre le voile là. */}
            <div className="relative w-full lg:w-auto lg:h-full aspect-[4/5] min-w-0 shrink-0 lg:shrink bg-sombre-fond select-none">
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
                {/*  §1 (nº 459) — LA PASTILLE DE PARTAGE A QUITTÉ LA
                     PHOTO (l'angle haut gauche, nº 198-§3) : le
                     partage du profil vit dans la rangée du
                     va-et-vient (à gauche de « Suivre », nº 458-§2 —
                     ContenuFiche, que cette fenêtre monte). Sur la
                     photo, il ne reste que le fanion (bas droit,
                     nº 375). */}
                {photoEnregistrable && (
                  /*  §1 (nº 375) — LA FENÊTRE SUIT LA PAGE, PARCE
                      QU'ELLE EST LA PAGE. Elle n'existe QUE sur le
                      web et consomme LE MÊME `CarrouselPortfolio` :
                      sa capsule est donc déjà remontée en haut à
                      droite par le même réglage. Laisser le fanion
                      en haut ici, c'est le superposer à la capsule
                      et faire diverger la fenêtre de la page — il
                      descend avec elle, à l'identique. */
                  <div className="absolute bottom-3 right-3 z-[2]">
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
                {/*  ██ §1 (nº 599) — LES POINTS AUSSI, ET C'EST TOUTE
                     LA CAUSE DU DÉFAUT ██
                     ----------------------------------------------
                     LA nº 598 a rebranché la frise dans `FicheTatoueur`
                     seulement. Or le web a DEUX affichages d'une fiche,
                     et celui qu'on voit en cliquant une carte est
                     CELUI-CI : la fenêtre superposée monte SON PROPRE
                     `CarrouselPortfolio` (juste au-dessus), avec pour
                     seul enfant le fanion. La page pleine avait donc
                     ses points, la fenêtre non — et comme la mosaïque
                     n'ouvre jamais la page, on ne voyait rien.
                     C'EST L'ÉCRITURE DE LA PAGE, MOT POUR MOT : même
                     composant, même ancrage bas, même surimpression
                     qui ne prend aucune place et n'intercepte aucun
                     clic (seuls les ronds répondent).
                     ⚠️ AUCUNE BASCULE D'APPAREIL ICI, contrairement à
                     la page : cette fenêtre s'ouvre AUSSI au doigt
                     (une fiche ouverte depuis une fiche, PileFiches),
                     et ses habillages de photo — le fanion juste
                     au-dessus — n'en ont jamais porté. Les points
                     suivent le fanion, pas la page. */}
                {photosDuStyleAffiche.length > 1 && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[2] flex justify-center">
                    <PointsDuCarrousel
                      photos={photosDuStyleAffiche}
                      indice={rang}
                      surRang={setIndice}
                    />
                  </div>
                )}
              </CarrouselPortfolio>
            </div>

            {/*  ██ §1 (nº 617) — LE TITRE REVIENT EN UNE COLONNE ██
                 ==============================================================
                 LA CAUSE DE SA DISPARITION, et elle est écrite dans le
                 titre lui-même (plus bas, la garde `hidden lg:block`) :
                 il est BORNÉ À LA DISPOSITION LARGE, délibérément. Il
                 vit HORS DE LA FENÊTRE, posé sur le voile
                 (`absolute top-full left-0`) : en deux colonnes il y a
                 du vide sous la photo, en une colonne il n'y en a plus
                 — la colonne de lecture commence là, et un texte hors
                 flux se poserait PAR-DESSUS elle. La borne `lg:` était
                 donc la seule façon de ne pas le voir chevaucher.
                 ⚠️ CE N'EST PAS UNE COLONNE DISPARUE : le titre n'a
                 jamais vécu dans la colonne de lecture. C'est bien la
                 disposition large qui le porte, et elle seule.

                 CE BLOC-CI EST L'AUTRE MOITIÉ, ET RIEN D'AUTRE : le
                 MÊME texte (`titreDeLaGalerie`, l'écriture unique de
                 `titreDeGalerie`), rendu DANS LE FLUX entre la photo et
                 le va-et-vient. Aucune recomposition — les deux
                 lectures ne peuvent pas diverger, c'est la même
                 variable. C'est le motif que la nº 599 a posé pour les
                 points de défilement : la fenêtre a ses propres
                 habillages, le contenu n'est écrit qu'une fois.

                 LES DEUX GARDES, ET CE QU'ELLES DISENT :
                  · `lg:hidden` — en deux colonnes, le titre hors cadre
                    règne seul, exactement où il est. La disposition
                    large ne bouge pas d'un pixel : ce bloc n'existe pas
                    pour elle (`display:none`), il n'entre donc dans
                    aucun calcul de la rangée `lg:flex-row` ;
                  · `mobile:hidden` — au doigt, rien de neuf : le titre
                    y vit déjà sous la photo de tête (nº 376). C'est la
                    consigne d'origine du propriétaire, celle que la
                    seconde garde du titre large tient déjà.

                 L'AIR, ET LE FOND :
                  · AU-DESSUS, `pt-4` — SEIZE pixels entre le bas de la
                    photo et le haut du texte ;
                  · EN DESSOUS, rien n'est écrit ici : ce sont les VINGT
                    pixels du rembourrage de la colonne de lecture
                    (`p-5`, vingt-quatre au-delà de 640 px de fenêtre)
                    qui séparent le titre du va-et-vient. La colonne
                    n'est pas touchée — piège 378/379 ;
                  · `bg-sombre-fond` et `px-5 sm:px-6` : LE fond et LE
                    retrait de cette colonne, repris tels quels. Le bloc
                    la prolonge vers le haut, sans couture visible et
                    sans une seule couleur neuve — sans fond, on verrait
                    le voile au travers.
                 APPARENCE : `text-[16px] font-bold text-white`, les
                 trois classes du titre large, mot pour mot. */}
            {titreDeLaGalerie && (
              <p
                data-titre-fenetre-flux=""
                className="lg:hidden mobile:hidden bg-sombre-fond px-5 sm:px-6 pt-4
                           text-[16px] font-bold text-white"
              >
                {titreDeLaGalerie}
              </p>
            )}

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
              /*  §3 (nº 383) — LA MÊME CORRECTION QUE LA PAGE, ÉCRITE
                  ICI PARCE QUE CETTE COLONNE EST LA SIENNE. Son
                  `lg:overflow-y-auto` déclarait lui aussi, sans le
                  dire, un défilement HORIZONTAL (règle du langage : un
                  axe réglé rend l'autre `auto`), et le débord de la
                  rangée du haut (nº 381) suffisait à le rendre
                  glissant. `lg:overflow-x-clip` rogne au même pixel
                  sans créer de port de défilement. Rien de
                  géométrique : ni largeur, ni rembourrage, ni marge. */
              /*  ██ §5 (nº 459) — `data-signe-muet` : DEPUIS UNE
                  FENÊTRE SUPERPOSÉE, OUVRIR UNE FICHE PAR-DESSUS NE
                  MONTRE PAS LE TRAIT ROSE ██
                  La marque d'exemption de la nº 452, posée sur LA
                  COLONNE DE CONTENU (le fil d'Ariane, hors d'elle,
                  garde son trait) : un clic sur un profil, un studio,
                  un salon ou un membre d'équipe EMPILE une fenêtre
                  (PileFiches) — ce n'est pas un chargement de page,
                  le trait mentait. L'attente reste armée (l'avalement
                  du re-clic 332-§1 et le nettoyage à l'arrivée ne
                  changent pas), seul l'affichage se tait.
                  ⚠️ ASSUMÉ ET DIT : les badges de style de la fenêtre
                  (qui NAVIGUENT vers la recherche en fermant la pile)
                  vivent dans cette colonne — leur trait se tait
                  aussi, sur ce chemin marginal. La PAGE de fiche,
                  elle, n'est pas marquée : ses liens gardent le trait
                  (au doigt, ils naviguent réellement). */
              data-signe-muet=""
              /*  ██ §1 (nº 499) — LA COLONNE SUIT LA FENÊTRE ██
                  Elle passe elle aussi de `carte` au fond de la page.
                  ⚠️ ET SA VARIABLE AVEC : `--fond-colonne` est ce que
                  les blocs COLLANTS de `ContenuFiche` reprennent pour
                  masquer le contenu qui défile dessous (le sélecteur
                  d'onglets, le voile de huit pixels au-dessus de lui).
                  Laisser la variable sur l'ancien jeton aurait peint
                  une bande `carte` en travers d'une colonne devenue
                  noire — le défaut aurait sauté aux yeux dès le
                  premier défilement. Les deux valeurs se posent donc
                  ensemble, comme elles l'ont toujours été.
                  ⚠️ LA PAGE DE FICHE PORTE DÉJÀ CE COUPLE-LÀ
                  (`FicheTatoueur`, `bg-sombre-fond` +
                  `--rw-sombre-fond`) : les deux enveloppes de la fiche
                  disent maintenant exactement la même chose. */
              className="w-full lg:w-[380px] shrink-0 lg:h-full lg:overflow-y-auto lg:overflow-x-clip p-5 sm:p-6 flex flex-col bg-sombre-fond [--fond-colonne:var(--rw-sombre-fond)]"
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

          {/*  ██ §2 (nº 393) — LE TITRE DE LA GALERIE, SOUS LA FENÊTRE ██
               ==============================================================
               LE MÉCANISME EST CELUI DU FIL D'ARIANE, AU MIROIR, et rien
               d'autre n'a été inventé : le fil s'accroche à cette même
               enveloppe `relative` par `absolute bottom-full left-0 mb-2`
               — il s'écrit dans le voile VERS LE HAUT. Ce titre-ci prend
               l'exact symétrique : `absolute top-full left-0 mt-2`, il
               s'écrit dans le voile VERS LE BAS. Même ancrage, même
               alignement à gauche sur le bord de la fenêtre, même air de
               8 px, même `w-max max-w-full` (il ne s'étire pas, et ne
               peut pas dépasser la largeur de la fenêtre).

               ⚠️ COMMENT ON S'ASSURE QUE LA FENÊTRE NE BOUGE PAS — c'est
               la note de la nº 202, mot pour mot, et elle vaut ici parce
               que c'est le MÊME dispositif : ce texte est HORS DU FLUX
               (`absolute`). Il ne pèse donc RIEN dans l'enveloppe — ni
               dans sa largeur, ni dans sa hauteur. Or c'est l'enveloppe,
               et elle seule, que le conteneur du dessus centre
               (`flex items-center justify-center`). La fenêtre garde
               exactement la position et la taille qu'elle avait : ni au
               chargement, ni quand le titre change de longueur, ni quand
               il disparaît, il n'existe de chemin par lequel il pourrait
               la déplacer. C'est aussi pourquoi il est écrit APRÈS elle
               dans le fichier : l'ordre du source suit l'ordre de l'œil,
               sans rien changer à la mise en page.

               ⚠️ IL ÉTAIT TRANSPARENT AU CLIC, ET C'ÉTAIT VOULU : le
               conteneur parent l'est, le fil d'Ariane s'en réveille
               parce qu'il porte des liens ; celui-ci n'en portant
               aucun, le laisser transparent faisait que cliquer dessus
               refermait la fiche, comme partout ailleurs dans le voile.

               ██ §1 (nº 518) — IL DEVIENT TANGIBLE, ET C'EST TOUTE LA
               CAUSE DE CETTE PASSE ██
               ------------------------------------------------------
               LE SYMPTÔME : sur le web, des deux textes posés HORS de
               la fenêtre, le fil d'Ariane se surlignait et ce titre
               non. LA DIFFÉRENCE ÉTAIT ENTRE EUX DEUX, à quelques
               lignes d'écart : le fil est réveillé au pointeur, ce
               titre ne l'était pas. Or un élément transparent au clic
               ne reçoit aucun appui — on ne peut donc pas y DÉMARRER
               une sélection. Ce n'était ni un lien, ni une couche
               posée dessus, ni une classe qui interdit la sélection :
               c'était le texte lui-même, rendu intangible.
               CE QUE ÇA COÛTAIT DE LE RÉVEILLER, et pourquoi la
               fermeture est rejouée juste en dessous : la transparence
               laissait le clic tomber sur le voile, qui referme. En
               rendant ce texte tangible, on lui prend ce clic — il
               faut donc le rendre à la main, sans quoi le titre
               deviendrait un trou dans le voile.
               ⚠️ ET LA FERMETURE S'ABSTIENT QUAND ON VIENT DE
               SÉLECTIONNER : un glissement de sélection se termine par
               un clic. Sans cette garde, surligner le titre le
               referait disparaître au relâchement — le geste ne
               servirait à rien.
               ⚠️ RIEN D'AUTRE N'EST NÉCESSAIRE ICI : ce titre n'est
               PAS un lien, la copie rend donc déjà le texte (les deux
               attributs des nº 513-514 n'ont pas d'objet), et il ne
               contient aucune image (la propriété de glissement de la
               nº 516 non plus).
               ⚠️ SOUS UNE AUTRE FICHE, RIEN NE CHANGE : le titre passe
               en `invisible` (nº 440), ce qui le rend déjà inerte ET
               insélectionnable — la garde du dessus n'a même pas à s'y
               appliquer.

               ⚠️ WEB UNIQUEMENT, avec DEUX gardes qui disent deux choses
               différentes : `hidden lg:block` demande la largeur à deux
               colonnes (sous 1024 px la fenêtre est en UNE colonne et
               défile — il n'y a pas d'espace sous elle : ce texte-ci,
               qui est HORS DU FLUX, se poserait par-dessus la colonne
               de lecture. C'est CETTE borne que le propriétaire a vue
               comme une disparition ; depuis la nº 617, l'autre moitié
               de la largeur est tenue par un second rendu DANS le flux,
               plus haut — même variable, même apparence, garde
               inverse), et `mobile:hidden` écarte le doigt quelle que soit la
               largeur, parce que cette fenêtre s'ouvre AUSSI au doigt
               (nº 226-§5) et qu'au doigt le titre vit déjà sous la photo
               de tête (nº 376). Le propriétaire a demandé « rien de neuf
               sur mobile » : c'est cette seconde garde qui le tient.

               APPARENCE : 16 px (nº 394 — c'était 20 à la nº 393, le
               propriétaire l'a trouvé trop imposant), gras, blanc plein
               — contre les 13 px du fil d'Ariane en `text-white/70`.
               L'écart reste net : +23 % de corps, plus le gras et le
               blanc plein contre un gris.
               ⚠️ SEUL LE CORPS CHANGE : même ancrage, même `mt-2`, même
               couleur, même graisse — et la fenêtre ne bouge pas d'un
               pixel, pour la raison dite juste au-dessus (ce texte est
               hors du flux, sa taille n'entre dans aucun calcul de
               centrage). Il gagne même 4 px de dégagement en bas. */}
          {titreDeLaGalerie && (
            <p
              data-titre-fenetre=""
              //  §1 (nº 440) — même règle que le fil d'Ariane : sous une
              //  autre fiche, le titre s'efface (visibilité seule).
              //  §1 (nº 518) — LA FERMETURE QUE LA TRANSPARENCE RENDAIT
              //  GRATUITE, rejouée : un clic sur ce titre referme la
              //  fiche, comme un clic sur le voile. MAIS PAS QUAND ON
              //  VIENT DE SURLIGNER — un glissement de sélection finit
              //  par un clic, et le titre disparaîtrait au relâchement.
              onClick={() => {
                if (window.getSelection()?.toString()) return;
                surFermeture();
              }}
              className={`pointer-events-auto absolute top-full left-0 mt-2
                         w-max max-w-full hidden lg:block mobile:hidden
                         text-[16px] font-bold text-white${
                           habillageEfface ? " invisible" : ""
                         }`}
            >
              {titreDeLaGalerie}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
