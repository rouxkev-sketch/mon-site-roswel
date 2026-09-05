"use client";

import { useEffect, useMemo, useRef, useState } from "react";
//  §3 (nº 862) — `Link` N'EST PLUS APPELÉ D'ICI : la plaque du profil,
//  son dernier porteur dans ce fichier, a cédé la place à l'en-tête du
//  fil, qui écrit son lien chez lui (components/CarteFil).
//  §2 (nº 455) — `useRouter` : la vignette du Portfolio navigue vers
//  la vue photo au doigt (une entrée, le retour rend le profil).
import { useRouter } from "next/navigation";
/*  §1 (nº 602) — LA SURVEILLANCE D'ADRESSE EST PARTIE AVEC LA FENÊTRE
    DE CARROUSEL. Elle ne servait qu'à elle : `usePathname`,
    `useSyncExternalStore` et les trois lecteurs de `adresse-courante`
    (nº 336/337) répondaient à UNE seule question — « l'adresse est-elle
    encore celle du carrousel ? ». Plus de carrousel, plus de question.
    L'écriture commune `adresse-courante` reste vivante ailleurs (la
    mémoire de navigation, « Ma sélection », le moteur, la sonde de
    retour) : c'est ce fichier-ci qui cesse de la lire. */
import {
  //  §2 (nº 776) — la largeur de la photo de tête (web) est une
  //  écriture unique : la silhouette d'attente (SqueletteFiche) dessine
  //  la même géométrie qu'ici, sans recopie.
  LARGEUR_PHOTO_FICHE,
  libelleStyle,
} from "@/config/tatouage";
//  ██ §3 (nº 863) — LA CONSIGNE « entree=portfolio » ██ Écrite par le
//  geste de l'onglet Portfolio (plus bas), lue ici : la vue photo
//  devient alors LE FIL DE LA GALERIE (FilDeGalerie) — voir sa note.
import { ENTREE_PORTFOLIO, PARAM_ENTREE } from "@/lib/lien-interne";
import { FilDeGalerie } from "@/components/FilDeGalerie";
/*  ██ §3 (nº 862) — QUATRE IMPORTS SONT PARTIS AVEC LA PLAQUE ET LA
    RANGÉE D'ICÔNES DU DOIGT ██
    ------------------------------------------------------------------
    `MARQUE_YOKOFOLIO`, `villeAffichee` (le partage du doigt),
    `ligneCarteMobile` et `sousTitreDeCarte` (la ligne grise de la
    plaque) : la vue photo ne compose plus ni l'un ni l'autre — elle
    MONTE L'EN-TÊTE ET LE PIED DU FIL, qui écrivent tout cela chez eux
    (components/CarteFil). Un import qui ne sert plus est un piège pour
    la passe suivante ; ils partent avec leurs appelants. Le WEB, lui,
    ne perd rien : ces quatre-là ne servaient qu'au doigt. */
//  §3 (nº 862) — le lieu que l'en-tête du fil écrit : sa forme est
//  celle des cartes (`ligneDeLieuDeCarte`, chez lui), et c'est le type
//  du site qui la nomme.
import type { LieuAffichable } from "@/lib/adresse";
//  §2 (nº 776) — la mesure de la photo de tête, partagée avec la
//  silhouette d'attente (voir lib/mesure-photo-fiche).
import { observerLargeurPhotoFiche } from "@/lib/mesure-photo-fiche";
//  §1 (nº 604) — la mémoire de la nº 459, celle des galeries du
//  Portfolio : le carrousel de l'affiche y range sa photo sous son
//  propre préfixe. Aucune seconde mémoire n'est écrite.
import {
  cleDuCarrouselDeFiche,
  photoDuCarrouselRetenue,
  retenirPhotoDuCarrousel,
} from "@/lib/memoire-galeries";
//  §3 (nº 862) — `BoutonPartageFiche` N'EST PLUS APPELÉ D'ICI : le
//  partage du doigt vivait dans la rangée du titre, il est passé dans
//  le PIED DU FIL (components/CarteFil), qui le monte lui-même. Le web
//  n'en avait pas dans cette page.
import { BoutonCoeurPhoto } from "@/components/BoutonCoeurPhoto";
/*  ██ §3 (nº 862) — L'EN-TÊTE ET LE PIED DE LA CARTE DU FIL ██
    ------------------------------------------------------------------
    DÉCISION DU PROPRIÉTAIRE : « la VUE PHOTO prend EXACTEMENT la
    présentation des cartes du fil ». Ce ne sont donc pas deux blocs
    ressemblants, c'est LE MÊME COMPOSANT, monté ici : au-dessus de
    l'image l'en-tête (avatar, nom, ville, badge du type), sous elle le
    pied (signaler, vues, points, fanion, partage). Aucune apparence
    n'est recopiée — une seule écriture, celle de CarteFil. */
import { EnTeteDeFil, PiedDeFil } from "@/components/CarteFil";
import {
  CarrouselPortfolio,
  PointsDuCarrousel,
} from "@/components/CarrouselPortfolio";
//  §3 (nº 862) — `adresseDeLienInterne` N'EST PLUS APPELÉ D'ICI : la
//  plaque du profil, son seul porteur, a cédé la place à l'en-tête du
//  fil — qui mène au profil PAR LA MÊME ADRESSE, écrite chez lui.
import { ContenuFiche, ENTREE_LIEN } from "@/components/ContenuFiche";
import { PileFiches } from "@/components/PileFiches";
//  §1 (nº 502) — la rangée du profil de la vue photo devient une
//  PLAQUE : l'écriture partagée (celle des membres d'équipe et des
//  lieux) et le chevron qui dit le lien. Rien n'est recopié.
//  §1 (nº 845) — RÉTABLIS avec la plaque (la nº 844 les avait retirés).
//  ██ §3 (nº 862) — ET ILS REPARTENT AVEC ELLE ██ La plaque est
//  REMPLACÉE par l'en-tête du fil (décision du propriétaire) :
//  `ENCADRE_MEMBRE_CLIQUABLE` et `IconeChevronBas` n'ont plus
//  d'appelant dans ce fichier. Les deux écritures restent vivantes
//  ailleurs (les plaques d'équipe et de lieux, les volets d'horaires) —
//  c'est ce fichier-ci qui cesse de les lire.
//  §1 (nº 602) — `cheminDuCarrousel` reste, et lui seul : c'est
//  l'adresse PARTAGEABLE d'un carrousel de fiche (nº 280-§3), rien à
//  voir avec la fenêtre plein écran supprimée à cette passe.
import {
  cheminDuCarrousel,
  galerieParStyles,
  ouvertureGalerie,
  ouvertureSurUnePhoto,
  serieDeLOuverture,
  serieMontree,
} from "@/lib/photo-tatoueur";
//  §3 (nº 304) — TROIS IMPORTS SONT PARTIS AVEC `surToucherDeLaPhoto`
//  (`RENDU_PAR_DEFAUT`, `ensembleDeLaPhoto`, `natureConnue`), et
//  `pincementRecent` avec eux : ils ne servaient qu'à ouvrir la fenêtre
//  de carrousel depuis la photo du haut.
import {
  NATURE_PAR_DEFAUT,
  partiesDeGalerie,
  SEPARATEUR_GALERIE,
} from "@/lib/photos-tatoueur";
import type { Tatoueur } from "@/lib/tatoueurs";
//  §1 (nº 742) — l'abonnement aux changements d'adresse, l'écriture
//  unique du site : la vue photo attend que l'adresse soit commise
//  avant de poser la page en haut (voir `surSerieChoisie`).
import { souscrireAdresse } from "@/lib/adresse-courante";
//  §1 (nº 718) — la variante d'avatar à servir : la règle de
//  nommage et le repli vivent dans lib/avatar-variantes.
//  §1 (nº 845) — RÉTABLI avec la plaque, son seul porteur ici.
//  §3 (nº 862) — et reparti avec elle : le rond de la vue photo est
//  désormais celui de l'EN-TÊTE DU FIL, qui l'appelle chez lui.
/*  §1 (nº 602) — DEUX AUTRES IMPORTS SONT PARTIS AVEC LA FENÊTRE DE
    CARROUSEL : `positionSousLeGel` (la position de la page dessous, que
    la fenêtre gelait) et `annoncerRepriseDuSite` (sa fermeture passait
    par history.back() et devait se déclarer au rattrapage du filet,
    nº 438). Ni l'un ni l'autre n'avait d'autre emploi ici — le gel du
    corps et le filet restent en service ailleurs, intacts.
    (Rappel nº 455 : `mecanismeCoupe` était déjà parti avec la porte de
    banc « fenetres ».) */

/**
 * LA FICHE COMPLÈTE D'UN TATOUEUR — le mode d'ARRIVÉE DIRECTE
 * ============================================================
 * C'est la page qu'ouvre un lien partagé ou un moteur de recherche
 * (/artist/nom). Depuis la GRILLE, c'est la FENÊTRE (FenetreFiche)
 * qui s'ouvre à la place — même mécanique qu'Instagram : la fenêtre
 * pour naviguer, la page pour arriver.
 *
 * L'IMAGE EST LA PAGE : une photo par style, AVEC BUTÉES (plus de
 * boucle). Si la fiche a été ouverte APRÈS une recherche par style
 * (`styleInitial`), le carrousel S'OUVRE SUR LA PHOTO DE CE STYLE.
 *
 * LA COLONNE DE LECTURE — l'ordre du fichier de référence, du haut
 * vers le bas :
 *   1 le nom · 2 l'adresse · 3 le site · 4 la bio · 5 Instagram ·
 *   6 TikTok · 7 Styles · 8 Technique · 9 Composition ·
 *   10 le signalement. PAS de fil d'Ariane : la page partagée
 *   commence par le nom, rien au-dessus.
 * Les blocs RESPIRENT (marges larges), et des LIGNES DE SÉPARATION
 * discrètes détachent : réseaux | Styles | Technique | Composition |
 * signalement. Ces lignes n'existent QUE sur cette page — la fenêtre
 * superposée s'en passe (elle est déjà cadrée).
 *
 * INSTAGRAM ET TIKTOK SONT LES BOUTONS-PHARES : les seuls éléments
 * au liseré rose et au léger halo — c'est la visite que la fiche
 * existe pour déclencher. L'icône ronde garde son fin cercle blanc ;
 * le texte est une invitation (« Voir son Instagram »), centrée. Les
 * badges de STYLES gardent leur robe neutre (le survol rose dit seul
 * qu'ils se cliquent).
 *
 * L'ADRESSE ET LE SITE, à la taille de la bio, portent les icônes
 * déposées par le propriétaire (public/adresse.png et public/site.png,
 * des glyphes noirs) passées en CLAIR par un simple filtre `invert` —
 * les fichiers eux-mêmes ne sont jamais retouchés.
 *
 * `apercu` : le mode « Ma fiche » de l'espace tatoueur — la fiche
 * telle que le public la voit, SANS le partage ni le signalement, et
 * rendue dans un <div> (la page de l'espace a déjà son <main>).
 *
 * AUCUNE INFORMATION D'ÉTAT ICI : une fiche consultée depuis la
 * recherche ou une adresse publique est la même pour tout le monde,
 * son propriétaire compris — l'état (« en cours de validation »…) ne
 * vit QUE dans le menu « Mon espace » et dans le formulaire.
 */
export function FicheTatoueur({
  studioCourant,
  tatoueur,
  demonstration,
  styleInitial = "",
  renduInitial = "",
  natureInitiale = "",
  photoInitiale = "",
  entreeInitiale = "",
  apercu = false,
  suiviAuDepart = false,
}: {
  tatoueur: Tatoueur;
  demonstration: boolean;
  /** LE STUDIO REGARDÉ, quand l'adresse porte « ?studio=<id> ». Une
      enseigne à plusieurs adresses met alors CELLE-CI en tête
      (« Studio actuel »), les autres restant listées dessous. */
  studioCourant?: string | null;
  /** Le style CHERCHÉ avant d'ouvrir la fiche : le carrousel s'ouvre
      sur CE style. Vide : le premier style de la fiche. */
  styleInitial?: string;
  /** LE RENDU CHERCHÉ (noir et gris, ou couleur), quand la recherche
      portait sur lui : le carrousel s'ouvre sur une photo qui y
      correspond. */
  renduInitial?: string;
  /** LA CATÉGORIE CHERCHÉE (réalisation, flash). Avec le style et le
      rendu, les trois désignent UN ENSEMBLE : la fiche s'ouvre alors
      sur cette série seule (nº 210-§1). */
  natureInitiale?: string;
  /** §4 (nº 302) — L'IDENTIFIANT D'UNE PHOTO PRÉCISE, venu de
      l'adresse (`?photo=`). Le carrousel s'ouvre SUR ELLE. Vide : le
      comportement d'avant, à la lettre. */
  photoInitiale?: string;
  /** §4 (nº 329) — COMMENT ON EST ARRIVÉ, lu dans l'adresse PAR LE
      SERVEUR (`?entree=`). `ENTREE_LIEN` : par un lien interne à un
      autre portfolio — pas de photo en haut. Vide : par une carte ou un
      lien de partage, la photo est là. */
  entreeInitiale?: string;
  /** Vrai dans l'espace tatoueur (« Ma fiche ») : aperçu public SANS
      partage ni signalement, dans un <div> et non un <main>. */
  apercu?: boolean;
  /** SUIT-ON DÉJÀ CE TATOUEUR ? — la page l'a demandé au serveur
      (nº 208-§1) : le bouton naît juste, sans se corriger. */
  suiviAuDepart?: boolean;
}) {
  const styles = tatoueur.styles.map((slug) => ({
    slug,
    label: libelleStyle(slug),
  }));
  const stylePrincipal = styles[0];

  /** LE PORTFOLIO, GROUPÉ PAR STYLE — et non plus une photo par
      style. Le style cherché passe en tête ; l'indice d'ouverture
      tient compte du RENDU cherché (voir `ouvertureGalerie`). */
  const ouverture = useMemo(
    () =>
      //  ⚠️ LES TROIS CRITÈRES, PAS DEUX (nº 217-§3) : la catégorie
      //  cherchée décide elle aussi du style ouvert et de la photo
      //  d'ouverture. Sans elle, « flash + aquarelle » ouvrait sur la
      //  première aquarelle — une RÉALISATION.
      ouvertureGalerie(
        galerieParStyles(tatoueur),
        styleInitial,
        renduInitial,
        natureInitiale,
        //  §4 (nº 302) — et la photo demandée, qui passe avant tout le
        //  reste quand elle existe.
        photoInitiale
      ),
    [tatoueur, styleInitial, renduInitial, natureInitiale, photoInitiale]
  );
  const groupes = ouverture.groupes;

  /** LE STYLE AFFICHÉ — c'est une vignette de l'onglet « Portfolio »
      qui en change, et le carrousel suit. */
  const [styleAffiche, setStyleAffiche] = useState(ouverture.style);
  /** LA SÉRIE OUVERTE (nº 204-§3) — catégorie + rendu d'une vignette
      touchée : le carrousel ne montre alors QUE cette galerie de
      dépôt. `null` à l'arrivée : le style entier, comme toujours.
      ⚠️ SAUF QUAND L'ADRESSE DÉSIGNE UN ENSEMBLE (nº 210-§1) : les
      trois tags réunis — style, catégorie, rendu — ne peuvent désigner
      qu'une série, et c'est elle qu'on vient voir (c'est le lien que
      « Ma sélection » écrit). */
  /*  ⚠️ LA CATÉGORIE SUFFIT À RESTREINDRE (nº 217-§3). Il fallait
      auparavant LES TROIS tags pour que le carrousel se limite à une
      série ; une recherche « flash + aquarelle », qui n'en porte que
      deux, laissait donc défiler les réalisations avec les flashs.
      `rendu` vide veut désormais dire « tous les rendus » : on montre
      ce qu'on est venu voir, sans jamais montrer autre chose. */
  /*  §4 (nº 272) — UN STYLE CHERCHÉ SANS CATÉGORIE VAUT
      « RÉALISATIONS ». La catégorie voyageait (nº 247) mais les
      chemins de recherche PAR STYLE SEUL (le champ « Recherche », les
      pages de style) n'en portent pas : la fiche montrait alors le
      style ENTIER, flashs compris. Chercher « réaliste », c'est
      chercher des réalisations réalistes — « Réalisations » est la
      catégorie par défaut du menu Explorer (NATURE_PAR_DEFAUT). La
      fiche ouverte depuis une recherche ne montre QUE le carrousel
      demandé — le style ET la catégorie ; le reste du travail reste
      accessible par l'onglet Portfolio. SANS recherche (lien direct,
      favoris, équipe d'un salon — aucun paramètre) : tout, comme
      toujours. Même règle dans FenetreFiche. */
  const serieCherchee =
    natureInitiale || styleInitial
      ? { nature: natureInitiale || NATURE_PAR_DEFAUT, rendu: renduInitial }
      : null;
  /*  §2 (nº 278) — SANS RECHERCHE, ON N'OUVRE PLUS « TOUT LE STYLE ».
      La règle 3 du carrousel (lib/photos-tatoueur) interdit de mêler
      deux galeries : le carrousel s'ouvre donc sur L'ENSEMBLE DE LA
      PREMIÈRE PHOTO de l'artiste — sa vitrine (règle 1). La consigne
      « sans recherche, montre tout » (nº 272-§4) est annulée par la
      définition de la nº 278-§0. Rien n'est perdu : les autres séries
      du style vivent dans l'onglet Portfolio, sous leurs vignettes. */
  /*  §4 (nº 302) — UNE PHOTO DEMANDÉE COMMANDE SA PROPRE SÉRIE. Sans
      cela, on ouvrait la série de la PREMIÈRE photo du style, et la
      photo visée pouvait en être absente : on retombait sur « 1/… ». */
  const surUnePhoto = ouvertureSurUnePhoto(groupes, photoInitiale);
  const serieInitiale =
    surUnePhoto?.serie ??
    serieCherchee ??
    serieDeLOuverture(groupes, ouverture.style);
  const [serieOuverte, setSerieOuverte] = useState<{
    nature: string;
    rendu: string;
  } | null>(serieInitiale);
  /**
   * ██ §1 (nº 604) — L'IDENTITÉ DE CE CARROUSEL POUR LA MÉMOIRE ██
   * L'ADRESSE COMPLÈTE DE LA FICHE, assemblée des mêmes ingrédients
   * que la clé de remontage de `FicheSelonLAdresse` — et dans le même
   * ordre, pour qu'on puisse les comparer d'un coup d'œil. C'est elle
   * qui distingue un RETOUR (adresse rejouée à l'identique) d'une
   * NOUVELLE VISITE par un lien (adresse différente) : voir la note
   * longue de lib/memoire-galeries.
   */
  const cleDuCarrousel = cleDuCarrouselDeFiche(
    [
      tatoueur.slug,
      styleInitial,
      renduInitial,
      natureInitiale,
      photoInitiale,
      entreeInitiale,
      studioCourant ?? "",
    ].join("|")
  );
  /** L'INDICE de la photo affichée, DANS la série montrée. Une série
      restreinte commence à sa première photo — elle répond déjà à tout
      ce qui a été cherché.
      ██ §1 (nº 604) — LA MÉMOIRE PASSE DEVANT, quand elle a quelque
      chose à dire. Elle n'a rien à dire au premier passage : la valeur
      d'avant s'applique alors mot pour mot, sur tous les chemins
      d'arrivée (une carte, « Ma sélection », un lien de partage, une
      adresse tapée).
      ⚠️ LU ICI, DANS LA VALEUR INITIALE, ET C'EST CE QUI DONNE LA
      RESTITUTION AVANT LA PREMIÈRE PEINTURE : l'indice est juste dès le
      PREMIER rendu, donc la pose de défilement du carrousel (celle de
      la nº 372, avant peinture) place la bonne colonne sans qu'aucune
      image intermédiaire n'existe. Un `useLayoutEffect` serait déjà
      trop tard : il faudrait un second rendu, et la pose du carrousel
      n'a lieu qu'au montage.
      ⚠️ AUCUNE DIVERGENCE D'HYDRATATION POSSIBLE, et ce n'est pas une
      chance : la garde `typeof window` tient le serveur à l'écart, et
      l'instance d'hydratation de la page publique naît SANS TAGS
      (`lireRequeteServeur` rend la chaîne vide, nº 359/360) — la
      mémoire est donc lue par l'instance RESEMÉE, qui n'existe
      qu'après l'hydratation. */
  const [indicePhoto, setIndicePhoto] = useState(() => {
    const parDefaut = surUnePhoto
      ? surUnePhoto.indice
      : serieCherchee
        ? 0
        : ouverture.indice;
    if (typeof window === "undefined") return parDefaut;
    return photoDuCarrouselRetenue(cleDuCarrousel) ?? parDefaut;
  });

  /**
   * §3 (nº 293) — QUEL QUE SOIT LE CHEMIN, LA PHOTO EST EN HAUT.
   * ------------------------------------------------------------------
   * CE QUE J'AI VÉRIFIÉ AVANT DE TOUCHER À QUOI QUE CE SOIT : les liens
   * internes (équipe, guest, adresse d'un salon) pointent bien vers la
   * fiche SANS style ni catégorie ni rendu — mais ce n'est PAS la cause.
   * Le repli existe depuis la nº 278 (`serieDeLOuverture`) et il tient :
   * mesuré au doigt, une fiche ouverte depuis l'intérieur d'une autre
   * affiche ses trois colonnes.
   * CE QUI RESTAIT OUVERT, EN REVANCHE : un groupe SANS photo faisait
   * un carrousel vide — hauteur nulle avant la nº 292, et depuis elle
   * un grand rectangle noir. C'est le seul chemin qui donne exactement
   * le symptôme décrit (« la page commence par Profil / Portfolio »),
   * et c'est celui-ci qu'on ferme : on ne se pose jamais sur un groupe
   * vide, et à défaut on prend LE PREMIER GROUPE QUI A DES PHOTOS —
   * le carrousel principal de la fiche, jamais rien.
   */
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
  /*  §1 (nº 247) — LA SÉRIE VIENT DE `serieMontree`, L'ÉCRITURE
      UNIQUE : une catégorie demandée n'y est jamais violée. Le filtre
      qui vivait ici en double (page ET fenêtre superposée) est parti
      avec son repli « série vide → tout le style » — le chemin par
      lequel une réalisation entrait dans un carrousel de flashs. */
  const photosRestreintes = serieMontree(photosDuStyleEntier, serieOuverte);
  //  UN CARROUSEL VIDE N'EXISTE PAS : ce style n'a rien de la
  //  catégorie demandée (une adresse écrite à la main — `ouvertureGalerie`
  //  met sinon devant un style qui l'a). On montre alors le style
  //  entier, mais LA SÉRIE EST ABANDONNÉE : le carrousel ne déclare
  //  plus aucune catégorie, il ne prétend donc rien montrer d'autre
  //  que ce style.
  const serieEffective = photosRestreintes.length > 0 ? serieOuverte : null;
  const photosDuCarrousel =
    photosRestreintes.length > 0 ? photosRestreintes : photosDuStyleEntier;

  /*  ██ §1 (nº 604) — ET SI LA PHOTO RETENUE N'EXISTE PLUS ? ██
      Le tatoueur peut l'avoir retirée entre deux visites, ou la série
      montrée peut avoir changé sous l'indice. ON REVIENT À LA
      PREMIÈRE, franchement, plutôt que de garder un rang qui ne
      désigne rien : le repli de `photoAffichee` plus bas montrait déjà
      la bonne image, mais le compteur aurait annoncé « 9/6 » et les
      points auraient cherché un cran absent.
      ⚠️ AJUSTÉ PENDANT LE RENDU, jamais dans un effet — le motif de
      PileFiches : la valeur est juste avant la première peinture, il
      n'y a donc pas d'image à rattraper. React refait le rendu
      immédiatement, sans repasser par l'écran.
      ⚠️ CETTE GARDE NE VAUT PAS QUE POUR LA MÉMOIRE : un indice hors
      bornes n'a jamais de sens, d'où qu'il vienne. */
  if (indicePhoto > 0 && indicePhoto >= photosDuCarrousel.length) {
    setIndicePhoto(0);
  }

  /*  ██ §1 (nº 604) — ON NOTE LA PHOTO REGARDÉE, AU DOIGT SEULEMENT ██
      QUI ÉCRIT : cet effet, et lui seul — il couvre donc TOUS les
      gestes d'un coup (le défilement du doigt, les flèches du clavier,
      un rond de la frise), sans qu'aucun d'eux ait à s'en occuper.
      ⚠️ L'APPAREIL EST LU DANS L'EFFET, JAMAIS AU RENDU (règle nº 60
      et la leçon de PileFiches) : le serveur ne connaît aucun
      appareil, et une lecture au rendu ferait diverger l'hydratation.
      POURQUOI BORNER AU DOIGT : sur le web, une fiche ne se démonte
      pas quand on va voir son profil — la colonne de lecture est déjà
      à côté de la photo, et la rangée du profil n'y existe même pas
      (`hidden mobile:block`). Il n'y a donc rien à retenir, et une
      table qui reste vide ne peut rien restituer de travers.
      ⚠️ RIEN DANS L'ADRESSE, RIEN DANS L'HISTORIQUE, RIEN DANS UN
      STOCKAGE (règle 332-§1) : une table en mémoire vive, qui meurt
      avec l'onglet — le chemin le plus inerte qui existe, celui de la
      nº 459.
      ⚠️ NI EN APERÇU : « Ma fiche » n'est pas une visite. */
  useEffect(() => {
    if (apercu) return;
    if (document.documentElement.dataset.appareil !== "mobile") return;
    retenirPhotoDuCarrousel(cleDuCarrousel, indicePhoto);
  }, [apercu, cleDuCarrousel, indicePhoto]);

  /**
   * §1 (nº 376) — LE TITRE DE LA GALERIE, sous la photo, AU DOIGT.
   * ------------------------------------------------------------------
   * LA MÊME CHAÎNE QUE LE PORTFOLIO, et c'est le point : elle est
   * composée par `partiesDeGalerie` (lib/photos-tatoueur, nº 628),
   * l'écriture unique dont `titreDeGalerie` — que les titres de galerie
   * du portfolio consomment — n'est que la mise bout à bout.
   * Rien n'est recomposé ici — les deux endroits ne peuvent pas dire
   * deux choses différentes de la même galerie.
   *
   * LE RENDU VIENT DE `serieEffective`, PAS DE `serieOuverte` : quand
   * la série demandée ne donne aucune photo, le carrousel montre le
   * STYLE ENTIER (rendus mêlés) et `serieEffective` retombe à `null` —
   * le titre ne dit alors que le style, ce qui est exactement ce qui
   * est à l'écran.
   *
   * ⚠️ CALCULÉ AU RENDU, DONC PRÉSENT DANS LE HTML PRÉRENDU : ni
   * mesure, ni effet, ni lecture de navigateur. `groupeAffiche` et
   * `serieEffective` sortent des mêmes données que la photo elle-même.
   * Ce qui décide de le MONTRER (le doigt) est une bascule de feuille
   * de style, pas un rendu conditionnel — voir plus bas.
   *
   * ⚠️ IL NE SUIT PAS LE DÉFILEMENT, ET IL N'A PAS À LE FAIRE : une
   * galerie ne contient qu'un style. `indicePhoto` n'entre pas dans ce
   * calcul, le titre ne se recalcule donc jamais quand on fait défiler.
   */
  /*  ██ §2 (nº 628) — EN DEUX MORCEAUX, POUR QUE LE RENDU PERDE LE
       GRAS ██
       LE TITRE NE CHANGE NI DE MOTS NI DE PUCE : c'est toujours
       l'écriture unique de `lib/photos-tatoueur`, mais lue par
       `partiesDeGalerie` — LA SOURCE, dont `titreDeGalerie` n'est que
       la mise bout à bout (nº 407). Rien n'est recomposé ici : la puce
       et le mot du rendu restent écrits à un seul endroit.
       ⚠️ LA GARDE EST LA MÊME, à la lettre : `partiesDeGalerie` rend
       `null` quand le style n'a pas de libellé (elle sort avant
       d'écrire quoi que ce soit), et la fiche sans photo est écartée
       ici comme avant. `rangeeSousLaPhoto` lit donc exactement la même
       vérité qu'avec la chaîne vide. */
  const partiesDuTitre =
    photosDuCarrousel.length > 0
      ? partiesDeGalerie(groupeAffiche?.label, serieEffective?.rendu)
      : null;

  /** LA PHOTO SOUS LES YEUX — celle que le cœur enregistre. Elle suit
      le carrousel : changer de photo change ce qu'on enregistre, et le
      cœur se rallume (ou s'éteint) selon que CELLE-CI est déjà gardée.
      ⚠️ `cle` N'EST L'IDENTIFIANT DE BASE QUE POUR UN PORTFOLIO
      CATALOGUÉ (migration nº 31). Les fiches d'avant portent une clé
      FABRIQUÉE (« style-adresse ») qui ne désigne aucune ligne :
      enregistrer serait impossible.
      ⚠️ ON NE JUGE PLUS LA FICHE ENTIÈRE (passe nº 142) : le test se
      faisait sur `galerie.length`, donc une seule photo non cataloguée
      suffisait à priver TOUT le carrousel de son cœur. C'est
      `BoutonCoeurPhoto` qui tranche, PHOTO PAR PHOTO — la seule
      question qui vaille étant « CETTE image-ci existe-t-elle en
      base ? ». (La migration nº 55 catalogue les portfolios que la
      nº 31 avait laissés de côté : après elle, la réponse est oui
      partout.) */
  const photoAffichee = photosDuCarrousel[indicePhoto] ?? photosDuCarrousel[0];

  /**
   * §3 (nº 451) — LA RANGÉE SOUS LA PHOTO, AU DOIGT : le titre de la
   * galerie À GAUCHE (nº 376, inchangé), et désormais LE FANION À
   * DROITE — il quitte l'angle bas droit de l'image, seule sa place
   * change. La rangée existe dès que l'un des deux existe : un style
   * sans libellé garde son fanion (seul, à droite) ; l'aperçu « Ma
   * fiche » et une fiche sans photo n'ont ni l'un ni l'autre, et la
   * ligne n'est pas rendue — aucun blanc réservé.
   * ⚠️ CALCULÉ AU RENDU, DONC DANS LE HTML PRÉRENDU : les deux
   * drapeaux ne sortent que des données de la fiche (règle 137 — le
   * fanion lui-même continue de juger sa photo côté navigateur).
   * ██ §3 (nº 862) — IL N'Y A PLUS QUE LE TITRE DANS CETTE RANGÉE ██
   * ------------------------------------------------------------------
   * LE FANION L'A QUITTÉE : il est descendu dans LE PIED DU FIL, avec
   * le partage, le signalement, les vues et les points — la vue photo
   * prend la présentation des cartes du fil (décision du propriétaire).
   * `fanionSousLaPhoto` n'a donc plus d'objet et part avec lui ; ce
   * drapeau-ci ne dit plus qu'une chose, et il la dit en clair : cette
   * fiche a-t-elle un titre de galerie à écrire ?
   * ⚠️ CE QU'IL GOUVERNE ENCORE, ET C'EST TOUT : la ligne du titre
   * elle-même, et le blanc réparti autour d'elle dans l'APERÇU
   * (`mobile:gap-5` sur la grille — la seule vue du doigt où les deux
   * colonnes se suivent, voir la note de la grille). Le pied, lui, ne
   * dépend d'aucun titre : il porte le signalement et les vues, qui
   * existent sans photo.
   */
  const rangeeSousLaPhoto = Boolean(partiesDuTitre);
  /**
   * §3 (nº 862) — LE LIEU QUE L'EN-TÊTE DU FIL ÉCRIT SOUS LE NOM.
   * ------------------------------------------------------------------
   * Les quatre champs que le site donne à lire à une écriture de lieu,
   * ceux-là mêmes que la carte lui passe (`lieuDeLaCarte`,
   * CarteTatoueur) : l'en-tête les rend par `ligneDeLieuDeCarte`, chez
   * lui, et cette page ne compose plus rien.
   * ⚠️ CE QUI CHANGE À L'ŒIL, ET JE LE DIS : la plaque écrivait
   * « Artiste · Lyon, FR » (`sousTitreDeCarte` + `ligneCarteMobile`,
   * qui abrège le pays quand une division s'écrit) ; l'en-tête écrit
   * « Lyon, France » et met le TYPE dans son badge, à droite. C'est la
   * présentation du fil, demandée telle quelle — pas un choix pris ici.
   */
  const lieuDeLaFiche: LieuAffichable = {
    ville: tatoueur.ville_nom,
    region: tatoueur.region,
    pays: tatoueur.pays,
    code_pays: tatoueur.code_pays,
  };
  /**
   * ██ §3 (nº 863) — D'OÙ VIENT-ON ? LA CONSIGNE « entree=portfolio » ██
   * ------------------------------------------------------------------
   * DÉCISION DU PROPRIÉTAIRE : la vue photo ouverte DEPUIS L'ONGLET
   * PORTFOLIO d'un profil (au doigt) prend une autre présentation que
   * celle ouverte depuis « Ma sélection » ou un lien partagé (§4, qui
   * garde la nº 862) — LE FIL DE GALERIES : une carte-carrousel par
   * galerie du portfolio, le titre de la galerie au-dessus de chaque
   * image (FilDeGalerie ; nº 866-§1, sur consigne — la nº 863 empilait
   * une carte par photo).
   * C'EST L'ADRESSE QUI LE DIT, et elle seule : le geste de l'onglet
   * écrit `entree=portfolio` (voir `surSerieChoisie`, plus bas), comme
   * les liens internes écrivent `entree=lien` — un réglage explicite,
   * jamais une devinette (nº 365). La fiche est resemée sur cette
   * valeur (elle entre dans la clé de FicheSelonLAdresse) : un retour,
   * un pas en avant, un rechargement retrouvent la même vue.
   * ⚠️ CE QUE LA CONSIGNE COMMANDE, ET RIEN D'AUTRE : au doigt, le fil
   * de galerie à la place de l'en-tête, de l'image et du pied de la
   * nº 862 ; la ligne du titre sous le pied n'existe pas là (le titre
   * est au-dessus). Le WEB n'est pas concerné : sa colonne photo reste
   * rendue et montrée, le fil y est masqué (règle nº 60).
   */
  const consignePortfolio = entreeInitiale === ENTREE_PORTFOLIO;
  /*  nº 866 — le surtitre du fil (« Tattoos » / « Flash ») n'est plus
      calculé ici : chaque carte du fil de galeries porte le sien, lu
      dans la liste des galeries du profil (`galeriesDuPortfolio`). */
  /*  §3 (nº 302) — LA GALERIE AFFICHÉE N'EST PLUS CALCULÉE ICI, et
      elle n'a plus de lecteur : elle ne servait qu'au cœur, pour
      enregistrer TOUT le carrousel d'un geste (nº 208-§6). Cette règle
      est annulée — un cœur ne met en favori que sa photo. */

  /*  ██ §1 (nº 602) — LA FENÊTRE DE CARROUSEL A QUITTÉ LE DÉPÔT ██
      ------------------------------------------------------------------
      CE QUI ÉTAIT ICI : cent quatre-vingt-huit lignes qui ne servaient
      qu'à une chose — surveiller l'adresse du navigateur pour monter,
      puis démonter, la page plein écran de la nº 284 (barre à logo,
      photo dessous). Un état, sa lecture des paramètres, l'ajustement
      symétrique de la nº 328-§4, la correction de premier rendu de la
      nº 336 et son réveil par les deux portes de la nº 337.
      POURQUOI TOUT PART D'UN COUP. La nº 455 avait déjà supprimé le
      GESTE qui l'ouvrait : la vignette du Portfolio navigue depuis vers
      la vue photo (voir `surSerieChoisie`, plus bas). Ne restait que la
      porte de l'ADRESSE, gardée pour les vieux liens partagés — le
      propriétaire a tranché à la nº 602 : le site n'est pas en ligne,
      aucun lien de ce genre n'existe. La porte n'ouvre donc plus sur
      rien qu'il faille préserver, et le composant, sa route serveur et
      cette surveillance partent ensemble. Laisser l'un des trois, c'est
      une adresse qui répond à du vide.
      ⚠️ CE QUI NE BOUGE PAS, ET C'EST L'ESSENTIEL : la VUE PHOTO du
      doigt (nº 451 à nº 455) est une AUTRE surface — c'est cette
      page-ci —, et la FENÊTRE SUPERPOSÉE du web (FenetreFiche) une
      troisième. Aucune des deux ne consommait ce qui part. */
  //  §2 (nº 455) — la navigation des vignettes du Portfolio, au doigt.
  const router = useRouter();

  /**
   * §3 (nº 290, EXTRAITE nº 776) — LA PHOTO ÉPOUSE LA HAUTEUR
   * VISIBLE : ON LA MESURE, ON NE LA DEVINE PLUS. La mesure entière —
   * son histoire (nº 290, nº 293) et ses raisons — vit désormais dans
   * `lib/mesure-photo-fiche` : la silhouette d'attente de cette page
   * (SqueletteFiche) doit poser LA MÊME largeur, et deux copies
   * auraient divergé (piège nº 378). Rien d'autre n'a changé : même
   * cadre, même variable `--photo-largeur`, même repli d'avant
   * l'hydratation dans la feuille de style.
   */
  /**
   * §4 (nº 329) — LA CONSIGNE D'ARRIVÉE VIT DANS L'ADRESSE.
   * ==================================================================
   * C'est le POINT 6 de la règle de navigation (lib/navigation-session) :
   * un lien interne vers un autre portfolio n'affiche pas la photo en
   * haut ; une arrivée par une carte ou un lien de partage l'affiche.
   *
   * CE QUI ÉTAIT ÉCRIT, ET QU'IL NE FAUT PAS REJOUER (nº 295) :
   * `consommerArriveeSansPhoto`, une mémoire de session QUI SE VIDAIT À
   * LA PREMIÈRE LECTURE. Un retour sur la fiche la trouvait vide, et la
   * photo revenait — le défaut que le propriétaire a redécrit à la
   * nº 329. Le module `lib/arrivee-sans-photo` a été SUPPRIMÉ, code
   * compris, et la règle CSS qui l'accompagnait avec lui.
   * MAINTENANT : `?entree=lien` dans l'adresse. Elle ne se consomme
   * pas — le retour ET le pas en avant la retrouvent tout seuls, parce
   * que l'adresse de l'étape la porte (points 5, 6 et 8 de la règle).
   *
   * ⚠️ ET ELLE EST LUE PAR LE SERVEUR, PAS PAR LE NAVIGATEUR. Mesuré :
   * au PREMIER clic sur un lien interne, `window.location.search` est
   * encore celui de la fiche QUITTÉE quand celle-ci se rend — la
   * consigne n'était pas vue, et la photo montait. Le serveur, lui,
   * connaît l'adresse de l'étape dès le premier pixel : elle arrive donc
   * en accessoire (`entreeInitiale`), et il n'y a plus aucun rendu
   * intermédiaire à rattraper — donc aucun clignotement, et rien à
   * garder d'un rendu à l'autre.
   *
   * ⚠️ L'APERÇU N'EST PLUS EXCLU (nº 330-§4). Il l'était sur une raison
   * qui a cessé d'être vraie : « on n'y arrive pas par un lien ». On y
   * arrive par « Mon portfolio », dans le menu « Mon espace » — et le
   * propriétaire attend là exactement ce qu'il attend ailleurs. C'est
   * donc la CONSIGNE qui décide, dans les deux modes, et rien d'autre :
   * un aperçu ouvert sans consigne garde sa photo, comme avant.
   */
  const consigneLien = entreeInitiale === ENTREE_LIEN;
  /**
   * ██ §4 (nº 729) — LA RÈGLE 6 NE VAUT PLUS QU'AU DOIGT SUR LA PAGE
   * PUBLIQUE ██
   * ------------------------------------------------------------------
   * LE DÉFAUT DU PROPRIÉTAIRE : clic droit → « ouvrir dans un nouvel
   * onglet » sur un lien interne d'une fenêtre superposée — la page
   * s'ouvre AMPUTÉE : pas de photo à gauche, la seule colonne de
   * droite. La cause : le `href` de ces liens porte `?entree=lien`
   * (règle 6 — « un lien interne n'affiche pas la photo EN HAUT »), et
   * cette consigne retirait la colonne ENTIÈRE, aux deux appareils. Or
   * la règle 6 décrit la vue du DOIGT (la photo « en haut ») ; en
   * pleine page web à deux colonnes, la retirer ne donne pas une vue
   * profil — elle donne une page cassée. Et un NOUVEL ONGLET est une
   * arrivée de l'extérieur au sens de la règle nº 318 : la photo doit
   * être là, comme sur un lien de partage.
   * LA DÉCOUPE, DÉSORMAIS :
   *  · APERÇU (« Mon portfolio » + consigne) : retrait entier, aux
   *    deux appareils — la décision nº 330-§4 du propriétaire, intacte ;
   *  · PAGE PUBLIQUE + consigne : la colonne est RENDUE, et cachée AU
   *    DOIGT SEULEMENT par la bascule d'appareil (`mobile:hidden`,
   *    data-appareil — piège nº 60, jamais une largeur). La règle 6
   *    mobile est entière ; le web montre sa photo.
   * ⚠️ LES FENÊTRES SUPERPOSÉES NE PASSENT PAS PAR ICI (elles montent
   * ContenuFiche) : rien ne change pour elles.
   */
  const sansPhoto = apercu && consigneLien;
  const photoCacheeAuDoigt = !apercu && consigneLien;

  const cadrePhoto = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const zone = cadrePhoto.current;
    if (!zone) return;
    return observerLargeurPhotoFiche(zone);
  }, []);
  /*  ██ §2 (nº 455) — `ouvrirLaFenetreCarrousel` EST SUPPRIMÉE, CODE
      COMPRIS.
      ------------------------------------------------------------------
      Son unique appelant (la vignette de l'onglet Portfolio,
      `surSerieChoisie` plus bas) n'ouvre PLUS la fenêtre de carrousel
      au doigt : il navigue vers LA VUE PHOTO — la même page qu'un clic
      de carte (nº 453/454). La fenêtre n'a donc plus aucun POINT
      D'ENTRÉE par geste ; la porte de banc `mecanismeCoupe("fenetres")`
      part avec elle (plus rien à couper).
      ██ SUITE ET FIN À LA nº 602 : IL N'EN RESTE RIEN. Cette note
      gardait alors la route serveur et la réouverture par l'adresse au
      nom des règles 328/329 — « les vieilles adresses vivent ». Le
      propriétaire a levé cette réserve : le site n'est pas en ligne,
      il n'existe aucun lien partagé à préserver. Le composant, sa page
      serveur et la surveillance d'adresse sont donc partis ensemble.
      Une adresse de carrousel ne mène plus nulle part — c'est une page
      introuvable, ce qu'elle doit être. */

  /*  §3 (nº 304) — LA PHOTO DU HAUT N'OUVRE PLUS RIEN, et
      `surToucherDeLaPhoto` est SUPPRIMÉE, code compris.
      ------------------------------------------------------------------
      LA RÈGLE DU PROPRIÉTAIRE : la page plein écran de la nº 284 était
      RÉSERVÉE À LA PARTIE PORTFOLIO de la fiche. Toucher la photo
      principale l'ouvrait aussi — ce n'était pas voulu. (Cette page
      n'existe plus du tout depuis la nº 602.)
      ⚠️ LA PHOTO GARDE TOUT LE RESTE : son défilement latéral, son
      compteur « 3/12 », ses flèches. (Depuis la nº 455, la vignette du
      Portfolio ouvre la VUE PHOTO — voir la note ci-dessus.) */

  /*  ⚠️ LE SÉLECTEUR DE STYLE POSÉ SUR LA PHOTO A ÉTÉ SUPPRIMÉ
      (nº 198-§1) — le badge déroulant du bas gauche (mobile) comme le
      menu du haut gauche (web). La navigation entre styles vit
      désormais dans l'onglet « Portfolio » (nº 197) : les vignettes
      remplacent le menu, il n'avait plus de raison d'être. */

  /** LA LIGNE D'ADRESSE, LISIBLE PARTOUT DANS LE MONDE : le pays
      s'ajoute dès qu'il n'est pas la France — « 10001 New York,
      États-Unis » se comprend, « 10001 New York » beaucoup moins. */


  /** CE QUI S'ÉCRIT SOUS LE MODE D'EXERCICE — une seule ligne
      d'adresse pour un salon ou un artiste en salon, la ville pour
      celui qui travaille sur zone, TOUTES LES VILLES pour un
      itinérant. Chacune ouvre la carte : d'où le rose. */

  /*  §1 (nº 459) — LA PASTILLE DE PARTAGE DU WEB (`boutonPartage`,
      posée dans l'angle haut gauche de la photo) EST SUPPRIMÉE, code
      compris : le partage du profil vit dans la rangée du va-et-vient
      (à gauche de « Suivre », nº 458-§2), et la vue photo du doigt a
      sa flèche (nº 458-§1) — le partage du carrousel ouvert
      (`cheminDuCarrousel`, règle nº 280-§3) continue par elle. */

  /** L'avertissement des fiches de démonstration — sa place change :
      au-dessus de tout sur le web, SOUS la photo sur smartphone (la
      page mobile doit commencer par l'image, sans bande au-dessus). */
  const Racine = apercu ? "div" : "main";

  return (
    /*  LA PILE DES FICHES SUPERPOSÉES (nº 226-§5) : depuis cette page,
        un membre d'équipe ou le salon d'un profil s'ouvre en FENÊTRE
        par-dessus — web comme mobile — et le retour rend cette page,
        à sa position de défilement. Inactive en aperçu (« Ma fiche ») :
        les liens y restent des liens. */
    /*  ██ §5 (nº 505) — LA PILE S'ACTIVE AUSSI DANS L'APERÇU ██
        LE RELEVÉ : depuis « Mon compte → Mon profil » sur le web,
        toucher un membre d'équipe ouvrait une PAGE PLEINE au lieu
        d'une fenêtre superposée.
        LA CAUSE : cette ligne portait `actif={!apercu}`. Sans pile
        active, `useOuvertureFiche` rend `null`, `useClicVersFiche`
        rend `undefined`, et le lien redevient un lien ordinaire — la
        page complète. C'était voulu : « on n'empile rien par-dessus un
        formulaire ». Le propriétaire tranche autrement, et la nº 473
        lui donne raison : l'aperçu doit se comporter comme la fiche
        publique.
        ⚠️ RIEN N'EST ÉCRIT DE NEUF : c'est le mécanisme existant, avec
        son historique (une entrée poussée par ouverture, un cran rendu
        par fermeture) et son gel compté (nº 469). La fenêtre se
        superpose au formulaire, qui reste monté dessous ; la fermeture
        rend l'adresse du formulaire et la pile se défait d'un cran.
        ⚠️ LA GARDE DE SAISIE N'EST PAS CONCERNÉE : l'ouverture annule
        le lien (`preventDefault`) et pousse l'adresse elle-même — il
        n'y a aucune navigation à intercepter, donc aucune fenêtre
        « Modifications non enregistrées » intempestive.
        ⚠️ AU DOIGT, RIEN NE CHANGE : la pile ne s'ouvre qu'au-dessus de
        1024 px (`laLargeurVeutUneFenetre`, nº 230-§3).
        ██ §1 (nº 506) — MAIS PAS ICI : ELLE DÉMÉNAGE D'UN CRAN ██
        --------------------------------------------------------
        LA nº 505 AVAIT POSÉ `actif` TOUT COURT, ET C'ÉTAIT UNE BOUCLE.
        Sur l'aperçu, ce composant est rendu DANS `{vue === "apercu" &&
        …}` (FormulaireFiche), et `vue` se lit dans l'ADRESSE
        (`?vue=apercu`). Or la pile, en ouvrant une fenêtre, POUSSE
        `/artist/<slug>` — une adresse SANS ce paramètre. La vue
        rebascule donc sur « modification », ce composant est démonté,
        ET LA PILE AVEC LUI : la fenêtre n'apparaissait jamais, il ne
        restait que la page de modification. La pile changeait
        l'adresse qui la faisait vivre.
        LA PILE EST DONC MONTÉE PLUS HAUT, dans `FormulaireFiche`,
        AU-DESSUS des deux vues — là où aucun changement d'adresse ne
        peut la démonter. Ce composant reprend `actif={!apercu}` : en
        aperçu, il n'en monte pas une seconde, il consomme celle du
        dessus par le contexte. Sur la fiche PUBLIQUE, rien ne change —
        c'est toujours lui qui la monte. */
    <PileFiches actif={!apercu}>
    <Racine
      //  §3 (nº 290) — LA RACINE SE NOMME : c'est sur elle qu'est
      //  ÉCRITE la marge du bas de la photo (`lg:pb-5`, jumelle de
      //  `lg:pt-5`), et c'est là que la mesure va la LIRE — plus
      //  aucune valeur recopiée dans le calcul.
      data-racine-fiche=""
      //  §2 (nº 291) — LA SONDE DOIT POUVOIR DIRE OÙ ELLE EST : le
      //  défaut du propriétaire ne se voit que sur « Mon portfolio »,
      //  et un relevé qui ne nomme pas sa page ne prouve rien. Une
      //  marque, aucune conséquence de mise en page.
      data-fiche-vue={apercu ? "apercu" : "publique"}
      /*  ██ §3 (nº 453) — LA VUE PHOTO MOBILE EST MINIMALE ██
          La fiche publique EN VUE PHOTO (pas d'`entree=lien`) se nomme :
          au doigt, la feuille de style (globals.css, à côté de la garde
          nº 359) y RETIRE LA COLONNE DE LECTURE de l'affichage — la
          page ne montre que la rangée du profil, la photo et la ligne
          titre + fanion. Tout le reste vit dans la VUE PROFIL, par le
          plaque du profil (nº 451-§2 ; c'était un badge « Profil »
          jusqu'à la nº 502, la destination n'a pas changé).
          ⚠️ UNE BASCULE DE FEUILLE DE STYLE, JAMAIS UN RENDU
          CONDITIONNEL D'APPAREIL : la marque sort des données que le
          SERVEUR connaît (`apercu`, `entreeInitiale`) — le HTML
          prérendu est le même pour les deux appareils, la borne ○/●
          tient. Aucune mécanique d'historique ne bouge : la coupe est
          un affichage, le retour et la restitution de position (423,
          438, 446) traversent les mêmes chemins qu'hier. */
      //  §4 (nº 729) — `consigneLien` et non plus `sansPhoto` : la
      //  valeur est LA MÊME qu'avant (l'ancien `sansPhoto` valait la
      //  consigne), seule la découpe du retrait de photo a changé —
      //  voir le bloc de `sansPhoto`. Au doigt avec consigne, la vue
      //  reste PROFIL (pas de data-vue-photo), et la garde jumelle de
      //  la nº 453 garde la colonne de lecture visible.
      data-vue-photo={!apercu && !consigneLien ? "" : undefined}
      // En aperçu (« Ma fiche »), l'ESPACE fournit déjà le cadre
      // (largeur, marges latérales, marge du haut) : ne pas les
      // doubler — la photo mobile reste ainsi bord à bord et vient
      // TOUCHER la barre fixe, comme sur la vraie page.
      // WEB : le bas de page se réduit à la MÊME marge que le haut
      // (20 px) — c'est elle qui ferme la géométrie du point d'équerre
      // photo/écran (voir la piste photo).
      className={
        apercu
          ? "w-full pb-16 lg:pb-5"
          : "flex-1 mx-auto w-full max-w-[1760px] px-4 sm:px-6 pt-4 lg:pt-5 pb-16 lg:pb-5"
      }
    >
      {/* Les DEUX COLONNES FORMENT UN ENSEMBLE CENTRÉ : la piste photo
          prend sa largeur réelle (`auto`), la colonne de lecture est
          fixée à 340 px, et `justify-center` centre le tout — plus de
          photo collée à gauche avec un trou au milieu. */}
      {/*  §1 (nº 298, révisé nº 299 puis nº 300) — LA COLONNE DE
           LECTURE FAIT 340 px EN PLEINE PAGE.
           ------------------------------------------------------------
           ⚠️ 340 EST UNE VALEUR CHOISIE À L'ŒIL PAR LE PROPRIÉTAIRE, ET
           ELLE NE SE « CORRIGE » PAS. Aucune session future ne doit la
           recalculer, l'arrondir, ni la réaligner sur quoi que ce soit :
           c'est SA décision de mise en page, prise sur ses propres
           captures. Si elle doit changer un jour, c'est lui qui le dira.
           L'HISTOIRE, POUR QU'ON NE LA REFASSE PAS : la colonne
           s'ouvrait jusqu'à 400 px et le contenu ne la remplissait pas
           — la page paraissait vide à droite. La nº 298 l'a alignée sur
           la FENÊTRE SUPERPOSÉE (380 px, `lg:w-[380px]` dans
           FenetreFiche) ; mesuré chez le propriétaire, c'était encore
           trop long. La nº 299 a posé 350, une erreur de saisie de sa
           part. La nº 300 pose la valeur qu'il voulait : 340.
           ⚠️ ET LA FENÊTRE SUPERPOSÉE RESTE À 380 — elle n'est pas
           concernée, aucun de ses fichiers ne bouge. Les deux vues
           n'ont plus la même laisse, EN CONNAISSANCE DE CAUSE.
           ⚠️ UNE LARGEUR FIXE, PLUS UN `minmax` : la plage allait de
           340 à 350 ; les deux bornes se rejoignant sur 340, il ne
           reste qu'un nombre. C'est aussi la borne basse d'origine,
           celle qui protégeait les fenêtres étroites — la colonne ne
           peut donc pas pousser la photo hors de l'écran, elle est
           déjà à son minimum historique.
           ⚠️ LE RECENTRAGE VIENT TOUT SEUL : `justify-center` centre
           l'ENSEMBLE photo + gouttière + colonne. En retirant 10 px à
           la colonne, le bloc se rétrécit d'autant et les deux marges
           extérieures gagnent 5 px chacune — elles restent égales, sans
           qu'aucune marge soit écrite nulle part.
           ⚠️ CE QUI NE BOUGE PAS : la photo (sa largeur découle de la
           hauteur de l'écran, nº 290) et la gouttière (`lg:gap-10`). */}
      {/*  §1 (nº 376) — `mobile:gap-5` QUAND, ET SEULEMENT QUAND, LE
           TITRE DE GALERIE EXISTE.
           ------------------------------------------------------------
           Les 32 px du `gap-8` étaient TOUT le blanc entre la photo et
           les liens Profil / Portfolio. Le titre s'y loge : 12 px
           au-dessus de lui (le `gap-3` de la colonne de tête), 20 px en
           dessous — 12 + 20 = 32, le blanc est le même, il est
           seulement réparti. Sans titre (fiche sans photo, style sans
           libellé), la classe n'est pas posée et l'espacement est celui
           d'hier, au pixel.
           ⚠️ LE WEB N'EST JAMAIS CONCERNÉ : `mobile:` ne s'applique
           qu'au doigt, et `lg:gap-10` reste seul maître de la
           gouttière des deux colonnes. */}
      {/*  §3 (nº 451) — la condition suit LA RANGÉE (titre OU fanion),
           plus le seul titre : le blanc réparti de la nº 376 vaut dès
           que quelque chose vit sous la photo. */}
      <div
        className={`grid gap-8 lg:gap-10 lg:grid-cols-[auto_340px] lg:justify-center ${
          rangeeSousLaPhoto ? "mobile:gap-5" : ""
        }`}
      >
        {/* ---------- La photo — calée dans la hauteur visible (web) ----------
             §3 (nº 295, DÉCOUPÉ nº 729) — QUAND LE LIEN A DIT « PAS DE
             PHOTO » : en APERÇU la colonne entière disparaît (décision
             nº 330-§4, les deux appareils) ; sur la PAGE PUBLIQUE elle
             est rendue et cachée AU DOIGT seulement (`mobile:hidden`,
             la bascule d'appareil) — la règle 6 vaut la vue du doigt,
             pas la pleine page web, où la retirer amputait la page
             (voir le bloc de `sansPhoto`). Au doigt caché, le
             carrousel monté ne demande pas d'image visible ; au web,
             la photo est celle de toujours. */}
        {!sansPhoto && (
        <div
          //  nº 359 — le nom de la colonne, pour la garde d'avant
          //  peinture de la fiche préparée d'avance (globals.css).
          data-photo-de-tete=""
          className={`flex flex-col gap-3 min-w-0${
            photoCacheeAuDoigt ? " mobile:hidden" : ""
          }`}
        >
          {/*  §1 (nº 454) — LA PHOTO REMONTE EN TÊTE : la rangée du
               profil (nº 452, affinée nº 453) ne vit plus au-dessus de
               l'image — elle est descendue SOUS la ligne du titre, en
               dernier bloc de la colonne (voir plus bas). L'ordre de la
               vue photo au doigt : photo · titre + fanion · rangée du
               profil, et rien après (la coupe nº 453 suit).
               ██ §3 (nº 862) — ET L'ORDRE REDEVIENT CELUI DU FIL ██
               La rangée du profil REMONTE au-dessus de l'image, sous la
               forme de l'EN-TÊTE DU FIL ; le titre et le pied la
               suivent. La vue photo au doigt se lit donc :
                 en-tête (avatar · nom · ville · badge du type)
                 photo
                 pied (signaler · vues · points · fanion · partage)
                 titre de la galerie
               — les trois premiers blocs étant, au pixel, ceux d'une
               carte du fil (components/CarteFil). */}

          {/*  ██ §3 (nº 862) — L'EN-TÊTE DU FIL, AU-DESSUS DE L'IMAGE ██
               ==================================================
               IL REMPLACE LA PLAQUE DU PROFIL (nº 845), qui vivait en
               dernier bloc de la colonne : « la plaque du profil est
               remplacée par ce bloc d'en-tête, qui mène au profil »,
               décision du propriétaire. La destination ne change pas
               (`adresseDeLienInterne`, écrite chez l'en-tête) : UNE
               entrée, le retour rend la vue photo.
               ⚠️ LA MARQUE `data-habillage-photo` RESTE, ET C'EST VOULU :
               elle nomme l'habillage de la photo au doigt depuis la
               nº 451 — les bancs 841 à 845 la lisent pour vérifier que
               la vue photo mène au profil, et c'est toujours vrai de ce
               bloc-ci. Renommer une marque qui désigne la même chose
               ferait perdre cinq bancs sans rien gagner.
               ⚠️ POURQUOI CETTE ENVELOPPE, ET CE QU'ELLE FAIT :
                · `hidden mobile:block` — l'appareil décide (règle
                  nº 60), comme la plaque avant elle ;
                · `mobile:-mx-4` — LE MÊME DÉBORDEMENT QUE LA PHOTO
                  (juste dessous) et que la grille du fil
                  (`SOCLE_GRILLE_CARTES`, GrilleTatoueurs) : la page pose
                  seize pixels de marge, l'en-tête les annule et remet
                  les siens (`px-4`, chez lui). Sans cela il commencerait
                  à trente-deux du bord et ne ressemblerait plus à une
                  carte du fil ;
                · `mobile:-mb-3` — LA COLONNE ÉCARTE SES ENFANTS DE
                  DOUZE PIXELS (`gap-3`, plus haut) ; une carte du fil,
                  elle, n'a aucun blanc entre son en-tête et son image —
                  l'air vit DANS l'en-tête (`pb-3`). Cette marge rend
                  exactement le gap de la colonne, et les deux blocs se
                  touchent comme sur une carte. Le pied fait de même par
                  le haut.
               ⚠️ APERÇU (« Ma fiche ») : RIEN, comme la plaque — on ne
               met pas un lien vers son propre profil au-dessus de sa
               propre photo. La photo y garde donc sa place et son
               collage à la barre. */}
          {/*  §3 (nº 863) — PAS D'EN-TÊTE AVATAR / BADGE depuis l'onglet
               Portfolio : la carte du fil de galerie porte le titre de
               la galerie à sa place (FilDeGalerie). */}
          {!apercu && !consignePortfolio && (
            <div
              data-habillage-photo=""
              className="hidden mobile:block mobile:-mx-4 mobile:-mb-3"
            >
              <EnTeteDeFil tatoueur={tatoueur} lieu={lieuDeLaFiche} />
            </div>
          )}

          {/* LA HAUTEUR DE LA PHOTO ÉPOUSE L'ÉCRAN (web) : la marge
              entre le BAS de l'image et le bas de la fenêtre doit être
              IDENTIQUE à celle entre la barre fixe et le HAUT de
              l'image. Barre fixe : 79 px ; marge : 20 px de chaque
              côté → hauteur de photo = 100vh − 119 px, et le ratio 4:5
              donne la largeur (× 0,8). Même équation dans la colonne
              de lecture (butée basse et hauteur maximale).
              SMARTPHONE : la photo ANNULE les marges de la page — elle
              touche la barre fixe du haut et les deux bords. */}
          {/*  ⚠️ LA PHOTO SE NOMME (nº 209-§5a) : le contenu partagé
               lit son bas pour savoir où arrêter la remontée, sans
               rien connaître de la géométrie de cette page. */}
          <div
            ref={cadrePhoto}
            data-photo-fiche=""
            /*  §3 (nº 304) — PLUS AUCUN `onClick` ICI : la photo du
                haut n'ouvre plus rien (voir la note de la fonction
                supprimée, plus haut). */
            /*  §3 (nº 290) — LA LARGEUR DÉCOULE DE LA HAUTEUR LIBRE
                MESURÉE (voir l'effet plus haut). Le repli
                `100vh − 119px` ne sert plus qu'au tout premier rendu,
                avant l'hydratation : dès la mesure, c'est le nombre
                relevé qui commande, et il tient compte de TOUT ce qui
                surmonte la photo — barre fixe, bandeau de l'espace,
                marge du haut. */
            /*  §1 (nº 452, revu nº 454) — LA REMONTÉE SUIT LA VUE. En
                APERÇU (« Ma fiche »), la photo colle à la barre comme
                depuis toujours (`-mt-4`, les 16 px du `pt` rendus). Sur
                la PAGE PUBLIQUE, la photo est redevenue LE PREMIER
                élément (nº 454 : la rangée du profil est descendue sous
                le titre) : elle vit directement sous la barre avec un
                air PROPRE de 8 px — `mobile:-mt-2` reprend la moitié du
                `pt-4` de la racine, la même valeur que l'air choisi à
                la nº 453. */
            /*  §2 (nº 472) — L'AIR SE RESSERRE : 8 px → 4 px. Le calcul
                est celui de la nº 453/454, au même endroit : la racine
                de la page pose `pt-4` (16 px) et cette remontée en
                reprend une part — `-mt-2` (8) en rendait 8, `-mt-3`
                (12) n'en laisse plus que 4. La photo reste DÉCOLLÉE de
                la barre (elle ne la touche pas : c'est `-mt-4`, la
                valeur de l'aperçu, qui collerait). Rien d'autre de la
                vue ne bouge — ordre des blocs, ligne du titre, rangée
                du profil, compteur et la coupe `data-vue-photo` /
                `data-colonne-lecture` sont intacts, et le web n'est pas
                concerné (variante `mobile:`). */
            /*  §3 (nº 474) — ENCORE UN CRAN : 4 px → 2 px. Le même
                calcul, au même endroit : la racine pose 16 px de
                rembourrage haut, et cette remontée en reprend désormais
                QUATORZE (en toutes lettres : le piège des
                commentaires, nº 472) — le cran d'avant, douze,
                en laissait quatre. La photo reste DÉCOLLÉE de la
                barre : c'est `mobile:-mt-4` — seize repris, plus un
                pixel d'air — qui la ferait TOUCHER, et c'est la valeur
                que l'aperçu, lui, garde. Rien d'autre de la vue ne
                bouge, et le web n'est pas concerné (variante du
                doigt). */
            /*  ██ §1-a (nº 483) — ENCORE UN PIXEL, ET C'EST LE DERNIER ██
                L'air passe de DEUX pixels à UN : la racine pose seize
                pixels de rembourrage haut, et cette remontée en reprend
                désormais QUINZE. Il n'y a pas de cran intermédiaire
                au-delà : à seize repris — la valeur de l'aperçu — la
                photo TOUCHERAIT la barre. Un pixel est donc tout ce qui
                la sépare encore du contact, et c'est voulu : elle reste
                décollée, mais de justesse.
                L'aperçu garde son collage, le web n'est pas concerné
                (variante du doigt), et rien d'autre de la vue ne
                bouge. */
            /*  ██ §1 (nº 476) — LE CALAGE SUR LE LOGO EST ANNULÉ ██
                Le propriétaire a regardé les 14 px de la nº 475 sur son
                téléphone : c'est TROP. L'air revient à la valeur de la
                nº 474 — DEUX pixels (la remontée
                reprend 14 des 16 px de rembourrage de la racine). Le
                relevé de la nº 475 reste écrit ci-dessous parce qu'il
                est juste et qu'il resservira si la question revient :
                c'est la CONCLUSION qui est abandonnée, pas la mesure.
                Rien d'autre de la vue ne bouge ; l'aperçu garde son
                collage (`-mt-4`) et le web n'est pas concerné. */
            /*  §1 (nº 475, ANNULÉE À LA nº 476) — L'AIR SE CALE SUR
                CELUI DU LOGO ██
                LA VALEUR N'EST PLUS CHOISIE, ELLE EST MESURÉE. Dans la
                barre fixe (EnTeteTatouage, l. 719-720), la rangée porte
                `py-3` — DOUZE pixels en haut comme en bas, la barre est
                symétrique — et ses éléments sont centrés sur une rangée
                dont la hauteur est celle des ronds d'action
                (HAUTEUR_ACTIONS = 40, l. 110). Le logo, lui, fait 36 px
                de haut au doigt (`h-9`, l. 793) : il est donc centré
                dans ces 40 px et descend de 2 px de plus.
                AIR AU-DESSUS DU LOGO = 12 + (40 − 36) / 2 = QUATORZE
                PIXELS. (Contrôle indépendant : 12 + 40 + 12 = 64, la
                hauteur de barre que lit `--rw-rangee-collante`.)
                LA PHOTO PREND EXACTEMENT CETTE VALEUR : la racine pose
                16 px de rembourrage haut, la remontée n'en reprend plus
                que DEUX (une remontée d'un demi-cran, en toutes lettres
                pour ne pas fabriquer une règle morte — le piège des
                commentaires de la nº 472) — il reste 14. L'aperçu
                garde son collage (`-mt-4`), la barre ne bouge en rien
                (ni hauteur, ni rembourrage, ni place du logo : c'est la
                photo qui vient s'aligner), et le web n'est pas concerné
                (variante du doigt). */
            /*  ██ §1 (nº 616) — LA LARGEUR N'EST PLUS BORNÉE AU CRAN
                `lg`, ELLE EST BORNÉE À L'APPAREIL ██
                ------------------------------------------------------
                LE DÉFAUT, ET SA CAUSE EXACTE. Cette largeur — le
                contrat de la nº 290 : « la hauteur de la photo épouse
                l'écran, la largeur en découle (× 0,8) » — était écrite
                sous `lg:`, c'est-à-dire À PARTIR DE 1024 px DE FENÊTRE
                (64 rem, le cran de série de Tailwind : `@theme` ne
                redéfinit que `grille` et `grille5`). Un pixel en
                dessous, la classe ne s'applique plus, ce bloc n'a PLUS
                AUCUNE LARGEUR — il prend donc toute la colonne, et le
                format 4/5 du carrousel étire sa hauteur d'autant. La
                photo ne se déforme pas (le rapport est tenu par
                `aspect-4/5`, cadre et colonne) : elle SAUTE d'un coup
                à toute la largeur de la page, et devient bien plus
                haute que l'écran. C'est cela, « elle n'est plus à son
                format » — elle a cessé d'être calée sur la hauteur
                visible.
                LA BORNE EST DONC FAUSSE DEPUIS LE DÉBUT, et la règle
                du site le dit déjà (globals.css, la note de la variante
                `mobile:`) : « en web étroit, l'interface WEB s'adapte,
                elle ne se déguise plus en smartphone ». Une largeur de
                fenêtre ne décide de rien ici — c'est l'APPAREIL qui
                décide (règle nº 60). `not-mobile:` est l'exacte
                négation de la variante du doigt : le contrat vaut donc
                sur TOUT le web, à toute largeur, et le doigt garde son
                bord à bord (aucune largeur, `mobile:-mx-4`).
                ⚠️ UNE SEULE CLASSE PAR PROPRIÉTÉ (piège nº 389) : la
                largeur n'est écrite qu'ici, et `max-w-full` la borne
                comme avant — sur une fenêtre plus étroite que la
                largeur calculée, la photo tient dans la page au lieu
                d'en sortir.
                ⚠️ ET ELLE SE CENTRE, sur le web et seulement là : sous
                1024 px la grille n'a plus qu'une colonne, une photo à
                largeur fixe s'y collerait à gauche avec un trou à
                droite. `self-center` agit sur l'axe transversal de la
                colonne parente (`flex flex-col`), donc à l'horizontale.
                AU-DESSUS DE 1024 px RIEN NE CHANGE : la colonne de la
                grille est `auto`, la photo la remplit exactement, et se
                centrer dans sa propre largeur ne déplace rien. */
            /*  §2 (nº 776) — les trois classes de la largeur web vivent
                dans LARGEUR_PHOTO_FICHE (config/tattoo), partagées
                avec la silhouette d'attente. Mêmes classes qu'avant, au
                caractère près — seul le foyer change. */
            /*  ██ §3 (nº 862) — LA REMONTÉE DU DOIGT N'A PLUS D'OBJET
                SUR LA PAGE PUBLIQUE ██
                --------------------------------------------------------
                CE QU'ELLE FAISAIT, ET POURQUOI ELLE PART. Les passes
                nº 472, 474, 476 et 483 ont réglé UNE SEULE QUESTION :
                de combien la PHOTO, premier élément de la vue, devait
                s'approcher de la barre fixe. La réponse s'était arrêtée
                à un pixel : la racine pose seize pixels de rembourrage
                haut, et la remontée du doigt en reprenait quinze (le
                nom de cette classe n'est plus écrit nulle part, pas
                même ici — Tailwind lit les commentaires, et une classe
                citée dans un commentaire produit une règle vivante dans
                la feuille, piège nº 472). LA PHOTO N'OUVRE PLUS LA VUE : l'EN-TÊTE la
                précède désormais, et un rond de profil collé sous la
                barre ne se lit pas comme le bord d'une image. La
                question posée par ces quatre passes ne se pose donc
                plus ; sa réponse s'en va avec elle, sans être remplacée
                par un nombre choisi : la vue commence sur le
                rembourrage que la page déclare pour tout le reste
                (`pt-4`, seize pixels, sur la racine).
                ⚠️ L'APERÇU GARDE TOUT : pas d'en-tête là-bas (voir
                plus haut), donc la photo y ouvre toujours la vue et son
                collage à la barre reste celui de la nº 452
                (`mobile:-mt-4`, les seize pixels rendus).
                ⚠️ LE WEB N'A JAMAIS ÉTÉ CONCERNÉ : les deux valeurs sont
                des variantes du doigt (règle nº 60). */
            /*  §3 (nº 863) — DEPUIS L'ONGLET PORTFOLIO, LA PHOTO DE TÊTE
                S'EFFACE AU DOIGT : le fil de galerie montre toutes les
                photos de la série, chacune dans sa carte — un carrousel
                de plus dirait deux fois la même chose. Elle reste
                rendue, et montrée au web (règle nº 60) ; une seule
                déclaration d'affichage, par appareil (piège nº 389). */
            className={`${LARGEUR_PHOTO_FICHE} mobile:-mx-4 mobile:max-w-none ${
              apercu ? "mobile:-mt-4" : ""
            }${consignePortfolio ? " mobile:hidden" : ""}`}
          >
            <CarrouselPortfolio
              photos={photosDuCarrousel}
              nomTatoueur={tatoueur.nom}
              styleLabel={groupeAffiche?.label ?? ""}
              //  §1 (nº 247) — LE CARROUSEL DIT CE QU'IL MONTRE : la
              //  catégorie qu'il déclare est celle de TOUTES ses
              //  photos, sans exception (rien quand il montre un style
              //  entier).
              natureDeLaSerie={serieEffective?.nature ?? ""}
              indice={indicePhoto}
              surChangement={setIndicePhoto}
            >
              {/*  §1 (nº 459) — LA PASTILLE DE PARTAGE A QUITTÉ LA
                   PHOTO (l'angle haut gauche, nº 198-§3) : le partage
                   du profil vit dans la rangée du va-et-vient
                   (nº 458-§2). Sur la photo du web, il ne reste que le
                   fanion (angle bas droit, nº 375). */}
              {!apercu && (
                <>
                  {/*  ██ §1 (nº 845) — LA CROIX DE RETOUR DE LA nº 844
                       EST RETIRÉE ██
                       Elle vivait ici, dans l'angle haut gauche de la
                       photo. Le pourquoi de son départ est écrit en fin
                       de fichier, là où sa définition vivait. */}
                  {photoAffichee && (
                    /*  §1 (nº 375) — LE FANION DESCEND, LA CAPSULE
                        MONTE. Sur le web, les deux échangent leurs
                        places : le fanion prend l'angle BAS droit,
                        la capsule du compteur prend le HAUT droit
                        (CarrouselPortfolio). Le partage ne bouge
                        pas — il reste seul dans l'angle haut gauche.
                        ⚠️ LE DOIGT N'EST PAS CONCERNÉ : ce bloc est
                        `mobile:hidden`, et le cœur tactile plus bas
                        garde son `bottom-3 right-3` d'origine. Même
                        gabarit, même variante, même marge de 12 px
                        au bord : seule l'ancre verticale change. */
                    <div className="mobile:hidden absolute bottom-3 right-3 z-[2]">
                      <BoutonCoeurPhoto
                        photoId={photoAffichee.cle}
                        variante="fiche"
                      />
                    </div>
                  )}
                  {/*  ██ §1 (nº 598) — LES POINTS REVIENNENT DANS LA
                       PHOTO, AU WEB ██
                       ----------------------------------------------
                       LA nº 307 LES AVAIT RETIRÉS D'ICI, au motif que
                       « la capsule du compteur, seule, dit le volume »
                       et que deux repères pour le même renseignement
                       se gênaient. Le propriétaire les rappelle : le
                       compteur dit COMBIEN, les points montrent OÙ —
                       et il garde les deux, sur les deux appareils.
                       ⚠️ L'ÉCRITURE N'EST PAS NEUVE : `PointsDuCarrousel`
                       n'a jamais quitté ce dépôt (bas de
                       CarrouselPortfolio). Elle était seulement
                       devenue morte, plus rendue nulle part. On la
                       rebranche telle quelle — sept crans au plus,
                       frise qui glisse, extrémités qui décroissent.
                       ⚠️ LE BLANC PUR N'EST PAS UN OUBLI, et c'est à
                       écrire pour qu'une passe future ne le « corrige »
                       pas : ces ronds vivent SUR UNE PHOTO, pas sur un
                       fond de charte — aucun jeton de la nº 466 n'y
                       aurait de sens, puisqu'on ne sait pas ce qu'il y
                       a dessous. Leur lisibilité vient de l'ombre douce
                       de la nº 221, la même sur tous, jamais d'une
                       couleur.
                       ⚠️ LA BANDE NE PREND AUCUNE PLACE et n'intercepte
                       aucun clic : elle est posée EN SURIMPRESSION
                       (`absolute`), et seuls les ronds eux-mêmes
                       répondent au doigt — c'est ce que
                       `pointer-events-auto`, écrit sur eux depuis
                       toujours, permet enfin de servir. La photo garde
                       donc sa taille, son format et son plein écran
                       cliquable.
                       ⚠️ ET RIEN AU DOIGT : ce bloc est `mobile:hidden`,
                       comme le fanion juste au-dessus. Le doigt a les
                       siens SOUS la photo (plus bas dans ce fichier).
                       ██ ⚠️ CE N'EST PAS LE SEUL AFFICHAGE DU WEB
                       (nº 599) : une fiche s'y regarde en PAGE PLEINE
                       — celle-ci — ou en FENÊTRE SUPERPOSÉE, et c'est
                       la fenêtre qu'ouvre un clic de carte. Elle monte
                       son propre carrousel dans `FenetreFiche`, avec
                       ses propres habillages : les points y sont
                       écrits une seconde fois, à l'identique. Toucher
                       l'un sans l'autre, c'est le défaut que la nº 599
                       a fermé. */}
                  {photosDuCarrousel.length > 1 && (
                    <div className="mobile:hidden pointer-events-none absolute inset-x-0 bottom-3 z-[2] flex justify-center">
                      <PointsDuCarrousel
                        photos={photosDuCarrousel}
                        indice={indicePhoto}
                        surRang={setIndicePhoto}
                      />
                    </div>
                  )}
                </>
              )}

              {/*  §1 (nº 452) — PLUS AUCUN HABILLAGE POSÉ SUR L'IMAGE
                   AU DOIGT : la rangée avatar/nom/« Profil » de la
                   nº 451 vit désormais AU-DESSUS de la photo, dans le
                   flux (premier enfant de la colonne de tête). Le haut
                   droit de l'image est rendu à la capsule du compteur
                   (CarrouselPortfolio), le fanion reste SOUS la photo
                   (nº 451-§3). */}
            </CarrouselPortfolio>
          </div>

          {/**
            * §1 (nº 376) — LE TITRE DE LA GALERIE, SOUS LA PHOTO.
            * ------------------------------------------------------
            * OÙ IL VIT : deuxième enfant de la colonne de tête, donc
            * HORS du cadre de la photo — celui-ci saigne jusqu'aux
            * bords de l'écran (`mobile:-mx-4`), le titre non : il
            * s'aligne à gauche sur les marges de la page, comme tout
            * le reste de la fiche.
            *
            * AU DOIGT SEULEMENT (`hidden mobile:block`) — l'écriture
            * du cœur tactile, quinze lignes plus haut. C'EST UNE
            * BASCULE DE FEUILLE DE STYLE, PAS UN RENDU CONDITIONNEL :
            * la balise est dans le HTML prérendu, `data-appareil` est
            * posé par le script d'avant peinture, et la règle CSS
            * s'applique donc dès la première image — le mécanisme est
            * celui qui fait déjà saigner la photo au doigt. Sur le
            * web l'élément est `display:none`, il n'est donc même pas
            * un élément de la boîte souple : le `gap-3` de la colonne
            * ne s'applique pas, et la mise en page du web ne bouge
            * pas d'un pixel.
            *
            * L'ESPACE, ET IL N'EN NAÎT AUCUN : le blanc entre la
            * photo et les liens Profil / Portfolio valait 32 px (le
            * `gap-8` de la grille). Il en vaut toujours 32, RÉPARTIS
            * AUTOUR DU TITRE — 12 px au-dessus (le `gap-3` de cette
            * colonne, écrit depuis toujours et resté sans emploi
            * jusqu'ici) et 20 px en dessous (`mobile:gap-5` sur la
            * grille, posé seulement quand ce titre existe). Le titre
            * est donc PLUS PRÈS DE LA PHOTO QUE DES LIENS : il nomme
            * ce qui le précède — c'est la règle d'aération de la
            * nº 277, prise à l'envers parce que le titre vient après
            * ce qu'il nomme. La page ne s'allonge que de la ligne de
            * texte elle-même.
            *
            * L'ÉCRITURE : 15 px, `font-semibold`, blanc plein.
            *  · 15 px — la taille que CE MÊME libellé porte déjà dans
            *    le portfolio, et celle du texte courant de la fiche :
            *    les mêmes mots ne changent pas de taille selon
            *    l'endroit de la page où ils apparaissent ;
            *  · `font-semibold` — le gras du site pour tout ce qui
            *    n'est pas le `<h1>`. Le nom du tatoueur est en 20 px
            *    `font-bold` quelques centimètres plus bas ; monter ce
            *    titre-ci à `font-bold` mettrait deux titres au même
            *    poids en haut de la page ;
            *  · `text-sombre-texte` — le blanc plein du site, le jeton
            *    déjà porté par les titres de galerie du portfolio.
            *    Aucune couleur neuve.
            *
            * UN TITRE LONG NE POUSSE RIEN : `truncate` le tient sur
            * UNE ligne et le coupe par des points de suspension. La
            * hauteur du bloc est donc constante quoi qu'il arrive, et
            * les liens Profil / Portfolio ne peuvent pas être
            * repoussés. (`min-w-0` est déjà sur la colonne : sans lui
            * une boîte souple refuse de rétrécir sous son contenu.)
            *
            * ET S'IL N'Y A RIEN À DIRE, IL N'Y A PAS DE LIGNE :
            * `partiesDuTitre` est nul (nº 628) quand la fiche n'a aucune
            * photo, ou quand le style n'a pas de libellé — on ne rend
            * alors NI la balise, NI son `gap`, NI le `mobile:gap-5`.
            * Aucun blanc réservé à un texte absent.
            */}
          {/*  §3 (nº 451) — LA LIGNE DEVIENT UNE RANGÉE : le titre garde
               sa gauche, LE FANION prend la droite — même bouton, même
               variante, même comportement (nº 198-§2) : seule sa place
               change, de l'angle bas droit de l'image à cette ligne.
               `items-center` : le titre se centre sur la hauteur du
               fanion (48 px de cible). Un titre long se coupe toujours
               (`truncate` + `min-w-0`) — le fanion ne bouge pas. */}
          {/*  §2 (nº 453) — LA LIGNE REMONTE : l'air photo → titre passe
               de 12 px (le `gap-3` de la colonne) à 8 px
               (`mobile:-mt-1` en reprend 4). */}
          {/*  ██ §1 (nº 458), REDISPOSÉ À LA nº 483 — LA LIGNE DU TITRE ██
               La zone sous la photo se lit désormais ainsi :
                 Titre                      [partage] [fanion]
                 ┌──────────────────────────────────────┐
                 │ [avatar]  Nom                      › │
                 │           Artiste: Ville, Pays      │
                 └──────────────────────────────────────┘
               (la rangée est devenue une PLAQUE à la nº 502, et le
                badge « Profil » un chevron.)
               CE QUE LA nº 458 AVAIT ÉCRIT, et pourquoi cela tombe : le
               partage occupait à gauche une colonne de la largeur de
               l'avatar, et le titre commençait après elle pour tomber à
               l'aplomb du NOM. Le propriétaire veut l'inverse — le
               titre à l'aplomb du BORD GAUCHE DE L'AVATAR, donc au bord
               de la colonne, sans rien devant lui ; et les deux gestes
               réunis à droite.
               ⚠️ LE COMPOSANT DE PARTAGE NE CHANGE PAS D'UN CARACTÈRE :
               même `BoutonPartageFiche`, même variante « icone » de la
               nº 458 (glyphe 28 dans une cible de 40), même lien
               partagé (`cheminDuCarrousel`, nº 280-§3). C'est sa PLACE
               qui bouge, et elle seule.
               ⚠️ L'ÉCART DE 10 px (`gap-2.5`) NE SERT PLUS QU'À UNE
               CHOSE : séparer le titre du groupe de droite. Le titre
               reste souple (`flex-1 min-w-0 truncate`) — un long
               libellé s'abrège, il ne pousse jamais les deux icônes. */}
          {/*  ██ §2 (nº 598) — ET SOUS LA PHOTO, AU DOIGT ██
               ----------------------------------------------------
               LE PROPRIÉTAIRE LES VEUT DEHORS ICI, et c'est la
               différence avec le web : au doigt, la photo saigne
               jusqu'aux bords de l'écran et rien ne doit être posé
               dessus (règle nº 452). Les points prennent donc leur
               place dans le flux, entre la photo et la ligne du titre,
               centrés.
               L'AIR, MESURÉ À L'ÉCRAN (repris nº 599). La colonne
               écarte ses enfants de 12 px (`gap-3`), et la ligne du
               titre en reprend quatre (§2 nº 453). LA nº 598 AVAIT
               DONNÉ À CE BLOC-CI LA MÊME REPRISE, et c'est ce qui
               collait les ronds à la photo : 8 px d'encre au-dessus
               d'eux, 13 px en dessous. Les deux airs ne se
               ressemblaient pas parce que la ligne du titre N'EST PAS
               DE L'ENCRE — sa boîte fait 22,5 px pour une capitale de
               12, soit cinq pixels de blanc de plomb au-dessus des
               lettres, que l'œil compte comme de l'air (la leçon de la
               nº 584 : on compare de l'encre, pas des boîtes).
               CE BLOC NE REPREND DONC PLUS RIEN : les 12 px de la
               colonne s'appliquent tels quels. Mesuré à l'écran après
               correction — 12 px d'encre entre le bas de la photo et
               les ronds, 13 px entre les ronds et les lettres du
               titre, inchangés. La zone sous la photo s'allonge de
               18 px par rapport à l'état d'avant la nº 598, et de rien
               d'autre.
               ⚠️ LE POINT D'ÉQUERRE PHOTO/ÉCRAN DES nº 472-474 N'EST
               PAS TOUCHÉ : il se joue AU-DESSUS de la photo (la
               remontée du doigt qui la fait toucher la barre fixe), et
               rien ici ne le concerne. Ce qu'on ajoute est en dessous.
               ⚠️ nº 862 — CETTE REMONTÉE N'EXISTE PLUS SUR LA PAGE
               PUBLIQUE : l'en-tête du fil ouvre la vue, la photo ne la
               touche plus. L'aperçu garde la sienne.
               ⚠️ LA LIGNE DU TITRE NE BOUGE PAS D'UN PIXEL PAR
               RAPPORT À CE QUI LA SUIT : elle garde son écriture, ses
               deux icônes et son écart de 10 px. Elle descend de
               18 px, avec tout ce qui est sous elle.
               ⚠️ ET LE COMPTEUR RESTE (nº 483, nº 487) : il vit dans
               l'angle de la photo, il n'est pas concerné par cette
               ligne-ci. */}
          {/*  ██ §3 (nº 862) — LE PIED DU FIL, SOUS L'IMAGE ██
               ==================================================
               DÉCISION DU PROPRIÉTAIRE : « sous l'image le bloc des
               icônes (signaler, vues, partage, fanion, points) — tout
               pareil, une seule écriture (celle de CarteFil) ». C'est
               donc LE MÊME COMPOSANT que la carte du fil, avec les
               mêmes places (nº 842 et nº 855 : signaler puis les vues à
               gauche, les points centrés sur toute la largeur, le fanion
               puis le partage à droite) et les mêmes cibles.
               CE QU'IL REMPLACE ICI, ET QUI PART AVEC LUI :
                · LES POINTS de la nº 598, qui vivaient à cet endroit
                  précis, seuls dans le flux — le pied les porte
                  désormais, centrés en absolu sur toute la carte ;
                · LE PARTAGE ET LE FANION de la ligne du titre
                  (nº 458/483) — ils descendent d'un cran et changent de
                  gabarit avec l'écriture du fil (le fanion passe de la
                  variante « fiche-mobile » à « carte ») ;
                · et LE SIGNALEMENT et LES VUES apparaissent, qui
                  n'étaient pas dans cette vue : ils font partie du bloc
                  demandé.
               ⚠️ IL NE DÉPEND D'AUCUN TITRE ni d'aucune photo : le
               signalement et les vues existent sans galerie. Seuls les
               points (plus d'une photo) et le fanion (une photo en
               base) se gardent eux-mêmes, chez lui.
               ⚠️ LES DEUX ENVELOPPES SONT CELLES DE L'EN-TÊTE, pour la
               même raison, et elles se répondent : `mobile:-mx-4` remet
               le pied bord à bord (il pose ses seize pixels lui-même) et
               `mobile:-mt-3` rend le gap de la colonne, pour qu'il
               touche l'image comme sur une carte du fil.
               ⚠️ APERÇU : RIEN — on ne se signale pas soi-même, et « Ma
               fiche » n'a ni partage ni fanion depuis toujours. */}
          {/*  §3 (nº 863) — depuis l'onglet Portfolio, chaque carte du
               fil de galerie porte son propre pied ; celui-ci ne se
               rend pas. */}
          {!apercu && !consignePortfolio && (
            <div className="hidden mobile:block mobile:-mx-4 mobile:-mt-3">
              <PiedDeFil
                tatoueur={tatoueur}
                photos={photosDuCarrousel}
                indice={indicePhoto}
                surRang={setIndicePhoto}
                /*  L'ADRESSE PARTAGÉE EST CELLE DU CARROUSEL OUVERT
                    (`cheminDuCarrousel`, nº 280-§3) : exactement celle
                    que la rangée du titre emportait avant cette passe —
                    le lien partagé ne change pas d'un caractère. */
                cheminAPartager={cheminDuCarrousel(
                  tatoueur.slug,
                  styleAffiche,
                  serieEffective
                )}
                /*  LE STYLE QUI PRÉ-REMPLIT LE MESSAGE DE PARTAGE : le
                    même qu'avant (`stylePrincipal`), et la chaîne vide
                    quand la fiche n'en a aucun — le pied l'attend
                    toujours écrit. */
                metier={stylePrincipal?.label ?? ""}
                /*  §6 (nº 853) — LE NOMBRE DE VUES arrive de la base
                    avec la fiche (colonne `vues`, SQL nº 852). Le pied
                    l'affiche TOUJOURS, et lit un nombre absent comme un
                    zéro (nº 854). */
                vues={tatoueur.vues}
              />
            </div>
          )}

          {/*  ██ §3 (nº 863, REFAIT PAR LA nº 866-§1) — LE FIL DE GALERIES,
               DEPUIS L'ONGLET PORTFOLIO ██
               ==================================================
               DÉCISION DU PROPRIÉTAIRE : une carte PAR GALERIE du
               portfolio (les styles de tattoos, puis ceux de flashs),
               empilées ; dans chaque carte on glisse entre les photos de
               cette galerie — le mécanisme des cartes de recherche
               (encadré fixe, pastille, points) ; le titre de la galerie
               au-dessus de l'image, le pied du fil en dessous ; la carte
               touchée ouverte sur la photo touchée, la page ouverte sur
               cette carte. Tout cela vit chez `FilDeGalerie` ; ce qu'on
               lui donne : LE PORTFOLIO ENTIER (`groupes`, dont le
               profil fait ses bandes), l'identité de la galerie touchée
               (le style montré et sa série), le rang de la photo
               touchée (`indicePhoto`, lu dans l'adresse), le style du
               message de partage et le nombre de vues — les mêmes que
               le pied de la nº 862.
               ⚠️ SEUL ENFANT VISIBLE DE LA COLONNE AU DOIGT dans ce
               mode : l'en-tête et le pied ne se rendent pas, la photo
               de tête est masquée — le gap de la colonne n'a donc rien
               à écarter. Il déborde jusqu'aux bords comme une carte du
               fil (`mobile:-mx-4`, chez lui). */}
          {!apercu && consignePortfolio && (
            <FilDeGalerie
              tatoueur={tatoueur}
              groupes={groupes}
              ouverte={
                serieEffective
                  ? {
                      style: groupeAffiche?.slug ?? "",
                      nature: serieEffective.nature,
                      rendu: serieEffective.rendu,
                    }
                  : null
              }
              indiceOuvert={indicePhoto}
              metier={stylePrincipal?.label ?? ""}
              vues={tatoueur.vues}
            />
          )}
          {/*  §3 (nº 863) — et cette ligne n'existe pas depuis l'onglet
               Portfolio : le titre est au-dessus de chaque image. */}
          {rangeeSousLaPhoto && !consignePortfolio && (
            <div className="hidden mobile:flex items-center gap-2.5 mobile:-mt-1">
              <p
                data-titre-carrousel=""
                className="flex-1 min-w-0 truncate text-[15px]
                           font-semibold text-sombre-texte"
              >
                {partiesDuTitre?.style}
                {/*  ██ §2 (nº 628) — « • NOIR ET GRIS » PERD LE GRAS ██
                     LE NOM DU STYLE GARDE LE SIEN (le demi-gras de
                     cette ligne, nº 458) ; ce qui suit la puce passe en
                     graisse NORMALE. C'est la hiérarchie que la carte
                     d'accueil porte depuis la nº 407 : le style se lit
                     d'abord, le rendu le précise.
                     ⚠️ DEUX ÉLÉMENTS, DEUX CLASSES — pas deux classes
                     de graisse sur un même élément (piège 389) : le
                     paragraphe reste demi-gras et ne connaît que sa
                     classe, le morceau qui s'allège a la sienne.
                     ⚠️ ET AUCUNE PUCE ORPHELINE : le séparateur est
                     DANS la garde, il n'existe que lorsqu'il a un texte
                     de chaque côté (la règle de `partiesDeGalerie`). */}
                {partiesDuTitre?.rendu && (
                  <span className="font-normal">
                    {SEPARATEUR_GALERIE}
                    {partiesDuTitre.rendu}
                  </span>
                )}
              </p>
              {/*  ██ §3 (nº 862) — LES DEUX GESTES ONT QUITTÉ CETTE
                   LIGNE ██
                   Le PARTAGE (nº 458) et le FANION (nº 451, calé sur la
                   marge à la nº 483/487) vivent désormais dans LE PIED
                   DU FIL, juste au-dessus dans la page : la vue photo
                   prend la présentation des cartes du fil, et ce bloc
                   d'icônes en fait partie. La ligne ne garde que ce
                   qu'elle nommait — LE TITRE DE LA GALERIE, seul, à
                   gauche. Son air et son écriture ne bougent pas d'un
                   pixel (`mobile:-mt-1`, nº 453).
                   ⚠️ LES RÉGLAGES DE LA nº 483/487 NE SONT PAS PERDUS :
                   ils vivent dans le pied du fil, qui a les siens depuis
                   la nº 842 — et c'est le point de la consigne, une
                   seule écriture pour ces icônes. */}
            </div>
          )}

          {/*  ██ §3 (nº 862) — LA PLAQUE DU PROFIL EST REMPLACÉE ██
               ==================================================
               ELLE VIVAIT ICI, en dernier bloc de la colonne : avatar,
               nom, ligne « Artiste · Lyon, FR » et chevron, le tout
               dans l'écriture partagée des plaques
               (`ENCADRE_MEMBRE_CLIQUABLE`, components/plaque) — posée à
               la nº 451, devenue plaque à la nº 502, supprimée par
               erreur à la nº 844 et rétablie à la nº 845.
               CE QUI LA REMPLACE, ET C'EST LA CONSIGNE : « la plaque du
               profil (845) est remplacée par ce bloc d'en-tête, qui
               mène au profil ». L'EN-TÊTE DU FIL, en tête de colonne
               (voir tout en haut de ce bloc) — même destination
               (`adresseDeLienInterne`), même rond de profil
               (`AvatarRond`), même nom sur une ligne ; le TYPE passe
               dans un badge à droite, et la ligne grise garde la ville.
               ⚠️ CE QUE LA PAGE PERD À L'ŒIL, ET IL FAUT LE DIRE : le
               fond de plaque (le cran `bg-sombre-eleve` et ses douze
               pixels d'air sur quatre côtés), le chevron qui disait le
               lien, et la place — le bloc n'est plus sous la photo mais
               au-dessus. C'est exactement ce que demande « prendre la
               présentation des cartes du fil » : une carte du fil n'a
               ni plaque ni chevron.
               ⚠️ LES TROIS ÉCRITURES PARTAGÉES NE BOUGENT PAS : les
               plaques d'équipe et de lieux gardent la leur, intacte —
               c'est cette page-ci qui cesse de l'employer. */}

          {/*  L'AVERTISSEMENT DE DÉMONSTRATION a rejoint le contenu
               partagé (nº 199) : il s'affiche en tête de la colonne,
               donc juste sous la photo au doigt. */}
        </div>

        )}

        {/* ---------- La colonne de lecture — L'ORDRE DU FICHIER DE
            RÉFÉRENCE : 1 nom · 2 adresse · 3 site · 4 bio ·
            5-6 réseaux · 7-9 les trois sections · 10 signalement —
            chaque grand bloc détaché d'une ligne. PAS de fil
            d'Ariane : la lecture commence par le nom.
            WEB : la colonne DÉFILE TOUTE SEULE (overflow-y-auto), À LA
            HAUTEUR DE LA PHOTO — l'étirement de la grille la lui donne
            (nº 737), et 100vh − 119 la borne : la marge sous son
            contenu, à bout de course, égale la marge sous la photo.
            ⚠️ SON FOND EST ÉCRIT (nº 207-§4) : les deux blocs qui ne
            défilent pas (la rangée du haut, le sélecteur de catégorie)
            le reprennent par `bg-inherit` — le contenu partagé n'a
            ainsi aucune couleur d'enveloppe à connaître. C'est
            l'anthracite de la page : rien ne change à l'œil.
            ⚠️ ET IL VOYAGE PAR UNE VARIABLE (nº 209-§6) : `bg-inherit`
            ne prend que le fond du PARENT DIRECT — les blocs collants
            enfouis plus bas (le sélecteur de catégorie vit dans le
            panneau du portfolio) héritaient donc du transparent, et on
            voyait le contenu défiler derrière. Une variable, elle,
            traverse tout l'arbre.
            §2 (nº 298) — ET ELLE NE COUPE PLUS LES ENCADRÉS DE SURVOL.
            ------------------------------------------------------------
            LE DÉFAUT : au survol d'un membre d'équipe, d'un guest ou
            d'un studio, l'encadré avait les bords DROITS — « on dirait
            que ça a été coupé par les marges ». C'est exactement ça.
            LA MÉCANIQUE : `CLASSES_LIGNE_CLIQUABLE` porte `-m-2 p-2`,
            donc l'encadré déborde de 8 px de chaque côté du contenu —
            C'EST VOULU (sans ce débord, son texte ne serait plus aligné
            sur le reste de la colonne). Or `overflow-y-auto` fait
            calculer `overflow-x` à `auto` : la colonne devient un
            conteneur qui ROGNE AUSSI LATÉRALEMENT, et le bord de la
            colonne tranchait les quatre arrondis.
            LA FENÊTRE SUPERPOSÉE, ELLE, N'A JAMAIS EU CE DÉFAUT : sa
            colonne rogne pareil, mais elle porte `p-5 sm:p-6` — les
            8 px du débord tombent dans son rembourrage, loin du bord.
            LE REMÈDE EST LE SIEN, SANS DÉPLACER QUOI QUE CE SOIT : un
            rembourrage de 12 px, ANNULÉ par une marge négative de 12 px
            (`lg:px-3 lg:-mx-3`). La boîte de contenu ne bouge pas d'un
            pixel — même position, même largeur, donc des lignes de
            séparation identiques —, mais le bord qui rogne s'écarte de
            12 px : l'encadré déborde toujours dans les marges, et ses
            quatre arrondis sont dessinés en entier, avec 4 px de reste.
            ⚠️ CE ROGNAGE-LÀ N'EST PAS CELUI DES PHOTOS : celui de la
            nº 295, sur les colonnes du carrousel, protège les images et
            n'est pas touché.
            §1 (nº 306) — À GAUCHE, IL S'ÉTAIT ÉCARTÉ DE 40 px POUR
            LAISSER PASSER LE DÉBORD DES GALERIES DU PORTFOLIO.
            §1-c (nº 312) — ANNULÉ : IL REVIENT À 12 px, DE CHAQUE CÔTÉ.
            ------------------------------------------------------------
            LE DÉBORD DES GALERIES EST SUPPRIMÉ (nº 312-§1) : elles
            s'arrêtent désormais à l'alignement du texte. Les 40 px
            n'avaient PAS d'autre client — c'est vérifié : le seul
            besoin de cette colonne reste celui de la nº 298, les 8 px
            d'encadré de survol (`-m-2 p-2` de
            `CLASSES_LIGNE_CLIQUABLE`), et 12 px les couvrent avec 4 px
            de reste. On retrouve donc exactement l'écriture de la
            nº 298, symétrique : `lg:px-3 lg:-mx-3`.
            ⚠️ 12 ET PAS 40, DES DEUX CÔTÉS : 40 px de débord
            sortiraient de la fenêtre sur un écran étroit (marge de
            page 24 px à 1024) et ÉLARGIRAIENT le document — le piège
            de la nº 228. */}
        {/**
          * ██ §3 (nº 383) — ELLE NE DÉFILERA PLUS JAMAIS LATÉRALEMENT ██
          * ==================================================================
          * LA CAUSE, ET C'EST UNE RÈGLE DU LANGAGE, PAS UN BOGUE DU SITE :
          * quand un seul axe reçoit une valeur de débordement, L'AUTRE
          * CESSE D'ÊTRE `visible` ET DEVIENT `auto`. En écrivant
          * `lg:overflow-y-auto`, on a donc AUSSI déclaré un défilement
          * HORIZONTAL, sans jamais l'écrire. La nº 298 l'avait vu comme
          * un ROGNAGE (« la colonne devient un conteneur qui rogne aussi
          * latéralement ») — mais `auto` ne rogne pas : il rogne ET
          * défile. Il suffit qu'un pixel dépasse pour que la colonne
          * devienne glissante, et elle ne revient pas toute seule.
          * CE QUI DÉPASSE ICI : la rangée du haut déborde de 12 px de
          * chaque côté depuis la nº 381 (`lg:-mx-3 lg:px-3`, pour aller
          * d'un bord à l'autre), et les encadrés de survol de 8 px
          * (nº 298). Aucun n'était censé être ATTEIGNABLE.
          * LES DEUX SYMPTÔMES N'EN FONT QU'UN : le geste horizontal du
          * trackpad entre deux galeries ne trouve aucune galerie sous le
          * curseur, il remonte donc au premier conteneur défilant —
          * cette colonne ; et les flèches du clavier font défiler, elles
          * aussi, le conteneur défilant le plus proche. Même cause,
          * deux entrées.
          * ⚠️ CE N'EST PAS L'ÉCOUTEUR DE LA Nº 371 : `ClavierCartes`
          * n'est monté que par la mosaïque (GrilleTatoueurs) et par
          * « Ma sélection » (PageFavoris). La fiche ne le monte nulle
          * part — vérifié. Ce sont les flèches natives du navigateur.
          *
          * LE REMÈDE, ET C'EST UN SEUL MOT : `overflow-x: clip`. Il
          * rogne EXACTEMENT comme `auto` — même bord, au pixel — mais
          * il ne crée AUCUN port de défilement : la colonne devient
          * incapable de bouger latéralement, quel que soit le geste,
          * et même par programme. Le débordement vertical, lui, ne
          * change pas d'un cheveu.
          * ⚠️ RIEN DE GÉOMÉTRIQUE : ni marge, ni rembourrage, ni écart,
          * ni largeur. Le débord de la nº 381 et les encadrés de la
          * nº 298 restent visibles exactement comme avant.
          * ⚠️ ET CETTE COLONNE N'EST PARTAGÉE AVEC RIEN : la fenêtre
          * superposée écrit la SIENNE, dans son propre fichier
          * (FenetreFiche). Les deux ne partagent que le contrat
          * `--fond-colonne` et le contenu qu'elles montent. La même
          * correction y est posée séparément, à un mot près.
          */}
        {/*  §3 (nº 453) — LA COLONNE SE NOMME : c'est elle que la vue
             photo mobile retire de l'affichage (globals.css — le HTML
             reste rendu, seul `display` bascule ; la vue profil et le
             web l'affichent comme toujours). */}
        {/*  ██ §1 (nº 737) — LE SÉLECTEUR NE BOUGE PLUS À LA BASCULE ██
             ------------------------------------------------------------
             LE DÉFAUT, DIT PAR LE PROPRIÉTAIRE (web, pleine largeur) :
             toucher Profil ↔ Portfolio faisait REMONTER la colonne de
             quelques pixels — le bouton fuyait sous la souris.
             LA CAUSE, MESURÉE AU BANC (±3 px page en haut, ±43 px
             défilée de 40, ±112 à fond) : la colonne portait
             `self-start`, sa hauteur suivait donc le CONTENU de
             l'onglet. Or la course d'un `sticky` est la hauteur de la
             cellule MOINS la sienne : onglet court (profil sans longue
             bio, 356 px), 424 px de course — la colonne COLLAIT à
             99 px ; onglet débordant (781 px, la borne), course nulle —
             le collage lâchait et la colonne suivait la page. Deux
             régimes, un saut à chaque bascule.
             LE REMÈDE : l'étirement PAR DÉFAUT de la grille
             (`self-start` retiré) — la colonne prend la hauteur de sa
             cellule, celle de la photo, quel que soit l'onglet, et
             `max-h` (100vh − 119) la borne comme avant. Hauteur
             constante → position constante : le bouton ne bouge plus
             d'un pixel, dans les deux sens, quel que soit le contenu.
             C'est l'intention écrite en tête de ce bloc — « à la
             hauteur de la photo » — enfin tenue à la lettre.
             ⚠️ LE COLLANT ET SA BUTÉE DE 99 px PARTENT AVEC (le
             `sticky` de cette colonne — leurs deux classes ne sont pas
             nommées ici : le scanner de Tailwind lit AUSSI les
             commentaires, et les écrire en toutes lettres regénérerait
             leurs règles, fantômes, dans la feuille) : photo et
             colonne partagent la même borne de hauteur, la course est
             donc nulle PARTOUT — un collant sans course ne colle
             jamais, c'est un mot mort, et il ne reste pas (la règle
             « pas de code mort », nº 735). L'air sous un onglet court est le
             fond de la colonne — l'anthracite de la page, rien à
             l'œil.
             ⚠️ CE QUI NE BOUGE PAS : le défilement INTERNE
             (overflow-y-auto) et « chaque onglet s'ouvre à son début »
             (nº 383, chemin 1) ; la grille et ses marges (pièges
             378/379) ; la fenêtre superposée, qui écrit SA colonne
             dans son fichier (FenetreFiche). */}
        <div
          data-colonne-lecture=""
          className="lg:max-h-[calc(100vh-119px)] lg:overflow-y-auto lg:overflow-x-clip lg:px-3 lg:-mx-3 min-w-0 flex flex-col bg-sombre-fond [--fond-colonne:var(--rw-sombre-fond)]"
        >
          {/*  ⚠️ LE CONTENU DE LA FICHE VIT DANS UN SEUL COMPOSANT
               (nº 199) : cette page et la fenêtre superposée du web
               affichent le MÊME. Ce qui reste ici est l'enveloppe — la
               grille à deux colonnes, la photo, et les boutons posés
               dessus. */}
          <ContenuFiche
            //  §3 (nº 329) — LA PAGE A UNE ADRESSE À ELLE : c'est elle
            //  qui porte l'onglet. La fenêtre du web, non.
            adresseALui
            /*  §2 (nº 377) — ET C'EST LA PAGE, ET ELLE SEULE, QUI A UNE
                BARRE FIXE AU-DESSUS D'ELLE : sa rangée Profil /
                Portfolio / Suivre s'y colle au doigt. Les fenêtres
                superposées montent le même contenu — au doigt comme à
                la souris — et ne doivent pas hériter de ce
                comportement : elles ne passent pas ce drapeau. */
            collantSousLaBarre
            tatoueur={tatoueur}
            groupes={groupes}
            studioCourant={studioCourant}
            demonstration={demonstration}
            apercu={apercu}
            //  §3 (nº 276) — plus de natureCherchee / renduCherche : le
            //  panneau montre les deux sections, il n'a plus rien à
            //  ouvrir « au bon endroit ». La série cherchée continue,
            //  elle, d'ouvrir le carrousel ci-dessus (serieCherchee).
            suiviAuDepart={suiviAuDepart}
            surSerieChoisie={(serie) => {
              /*  ██ §2 (nº 455) — AU DOIGT, UNE GALERIE OUVRE LA VUE
                  PHOTO, la même page qu'un clic de carte ██
                  --------------------------------------------------
                  La page plein écran de la nº 284 n'est plus le chemin
                  des vignettes (et n'existe plus depuis la nº 602) :
                  le geste NAVIGUE, par le routeur, vers
                  l'adresse que les CARTES écrivent (nº 371 — style,
                  rendu, nature, photo ; `URLSearchParams`, mêmes
                  paramètres, même page servie par le jumeau dynamique).
                  UNE entrée d'historique (332-§1) ; le RETOUR rend le
                  profil à sa position (mémoire de navigation) — comme
                  depuis une carte, parce que c'est le même chemin.
                  ⚠️ CORRIGÉ À LA nº 742 : cette note disait « l'arrivée
                  se fait en haut (nº 446, DefilementEnHaut) ». C'était
                  FAUX, et mesuré comme tel — ce composant ne joue qu'au
                  changement de CHEMIN, et ce geste n'en change pas. La
                  page arrivait donc où le raccourcissement du document
                  la laissait. C'est la pose du §1 (nº 742), plus bas,
                  qui tient désormais cette promesse.
                  LA PHOTO TOUCHÉE (nº 314-§3d) voyage désormais par son
                  IDENTIFIANT : le rang touché est traduit dans la série
                  affichée (`serieMontree`, l'écriture unique nº 247) —
                  `ouvertureSurUnePhoto` la retrouve à l'arrivée
                  (nº 302-§4). Sans photo trouvée (série vide), l'adresse
                  porte les trois tags et la fiche ouvre leur série.
                  ⚠️ LU AU MOMENT DU GESTE, jamais au rendu (la règle de
                  PileFiches) : le serveur ne connaît pas l'appareil.
                  SUR LE WEB (et en aperçu), tout ce qui suit reste le
                  comportement d'avant, à la lettre. */
              if (
                !apercu &&
                document.documentElement.dataset.appareil === "mobile"
              ) {
                const groupeTouche = groupes.find(
                  (groupe) => groupe.slug === serie.style
                );
                const photosDeLaSerie = serieMontree(
                  groupeTouche?.photos ?? [],
                  { nature: serie.nature, rendu: serie.rendu }
                );
                const photoTouchee = photosDeLaSerie[serie.indice ?? 0];
                const suite = new URLSearchParams();
                if (serie.style) suite.set("style", serie.style);
                if (serie.rendu) suite.set("rendu", serie.rendu);
                if (serie.nature) suite.set("nature", serie.nature);
                if (photoTouchee?.cle) suite.set("photo", photoTouchee.cle);
                /*  ██ §3 (nº 863) — LA CONSIGNE PART AVEC LE GESTE ██
                    « entree=portfolio » : la vue photo qui s'ouvre saura
                    qu'elle vient de l'onglet Portfolio, et montrera la
                    galerie entière, empilée (FilDeGalerie). C'est le
                    seul endroit du site qui l'écrit — celui qui pose le
                    lien sait d'où il vient (nº 365), et une carte de
                    « Ma sélection » comme un lien partagé n'en portent
                    aucune (§4 : la vue de la nº 862). */
                suite.set(PARAM_ENTREE, ENTREE_PORTFOLIO);
                const requete = suite.toString();
                /*  ██ §1 (nº 742) — LA PAGE EST POSÉE EN HAUT ICI, AU
                    GESTE, ET VOICI POURQUOI ██
                    ------------------------------------------------------
                    LE DÉFAUT, DIT PAR LE PROPRIÉTAIRE : toucher une photo
                    au fond d'une galerie fait « clignoter et se
                    réinitialiser » la page AVANT que la photo ne s'ouvre.
                    LA CAUSE, MESURÉE (nº 742, base ralentie) : cette
                    navigation ne change PAS de chemin — seuls les
                    paramètres bougent. Elle fait donc apparaître la VUE
                    PHOTO, dont la feuille de style retire la colonne de
                    lecture de l'affichage (nº 453) : le document PERD
                    presque toute sa hauteur, en deux temps, à mesure que
                    le contenu arrive. Relevé depuis 763 px de
                    défilement : le document passe de 5 579 à 1 543 px
                    (+131 ms) puis à 933 (+599 ms), et le navigateur
                    RAMÈNE la page à chaque fois — 763 → 699 → 89. Ce
                    glissement de six cents millisecondes EST le
                    clignotement.
                    ⚠️ CE N'EST PAS `DefilementEnHaut` : il ne joue qu'au
                    changement de CHEMIN, et il n'a jamais été appelé sur
                    ce geste. La note de la nº 455 qui promettait « l'
                    arrivée se fait en haut (nº 446) » était donc fausse
                    pour lui — elle est remise d'aplomb juste au-dessus.
                    LE REMÈDE, ET IL TIENT EN UNE POSE : on met la page en
                    haut AU GESTE, tant que le document est encore long.
                    Zéro reste une position valable quel que soit ce qui
                    suit : le raccourcissement ne trouve plus rien à
                    ramener, et il n'y a plus qu'un seul mouvement — le
                    même que sur tout autre départ du site (nº 446).
                    ⚠️ ET LA POSE ATTEND QUE L'ADRESSE SOIT COMMISE —
                    c'est la moitié la plus importante, et elle est
                    MESURÉE. Posée à l'instant du geste, elle marchait :
                    plus aucun glissement. Mais la mémoire de navigation
                    écrit la position AU FIL DU DÉFILEMENT, pour
                    l'adresse affichée : ce zéro était donc enregistré
                    pour LA GALERIE qu'on quitte, et le retour la rendait
                    en haut au lieu de 763 px (mesuré). On attend donc
                    l'écriture d'adresse (`souscrireAdresse`, l'écriture
                    unique du site) : le zéro tombe alors sur la VUE
                    PHOTO — qui s'ouvre en haut, c'est sa règle — et la
                    galerie garde la sienne. L'attente est courte devant
                    le raccourcissement : l'adresse se commet vers 90 ms,
                    le document ne perd sa hauteur qu'à 131 ms.
                    ⚠️ NI GARDE DE POSITION NI DÉCLARATION D'ARRIVÉE EN
                    HAUT, et ce n'est pas un oubli : les deux ont été
                    essayées et MESURÉES inutiles une fois la remontée
                    animée bornée (§1 nº 742 de ContenuFiche). La garde
                    (nº 661) défend une pose contre les recalages du
                    navigateur : la boîte noire n'en relève aucun ici, et
                    zéro n'a de toute façon rien à défendre — aucun
                    raccourcissement ne peut le déplacer. La déclaration
                    (nº 429/446) empêche une restitution : personne n'en
                    tente. Les garder aurait été du code mort.
                    ⚠️ RIEN NE FUIT : l'abonnement se retire dès qu'il a
                    servi, et un filet de deux secondes le retire même si
                    l'adresse n'est jamais commise (navigation
                    abandonnée) — on ne pose alors rien du tout, la page
                    reste où elle est.
                    ⚠️ AU DOIGT SEULEMENT : cette branche entière l'est
                    déjà (`data-appareil`, lu au geste — piège nº 60). Le
                    web ouvre sa galerie sans changer d'adresse, et ne
                    passe jamais ici. */
                const destination = requete
                  ? `/artist/${tatoueur.slug}?${requete}`
                  : `/artist/${tatoueur.slug}`;
                let retirerLEcoute = () => {};
                let posee = false;
                const poserEnHautALArrivee = () => {
                  if (posee) return;
                  const ici =
                    window.location.pathname + window.location.search;
                  if (ici !== destination) return;
                  posee = true;
                  retirerLEcoute();
                  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                };
                const desabonner = souscrireAdresse(poserEnHautALArrivee);
                const filet = window.setTimeout(() => retirerLEcoute(), 2000);
                retirerLEcoute = () => {
                  desabonner();
                  window.clearTimeout(filet);
                };
                router.push(destination);
                return;
              }
              setStyleAffiche(serie.style);
              setSerieOuverte({ nature: serie.nature, rendu: serie.rendu });
              //  §1-6 (nº 306) — LE RANG DE LA PHOTO TOUCHÉE. Les
              //  galeries du web en envoient un : le cadre photo de la
              //  fiche s'ouvre SUR CETTE PHOTO. La grille du doigt n'en
              //  envoie pas — la première, comme depuis toujours.
              setIndicePhoto(serie.indice ?? 0);
              /*  ⚠️ PLUS AUCUNE REMONTÉE ICI (nº 238-§1), ET C'EST LA
                  CAUSE DE « LA PAGE DESCEND ».
                  --------------------------------------------------
                  CE QUI SE PASSAIT, mesuré au banc depuis le bas de la
                  galerie (départ 2967) :
                    t=0 ms   → 0    (le saut instantané écrit ICI, nº 218-§3)
                    t=100 ms → 24
                    t=250 ms → 340
                    t=500 ms → 488  (le repère « sous la barre »)
                  DEUX mécanismes agissaient sur le même geste : ce
                  `scrollTo(0)` instantané, puis la remontée douce
                  ajoutée par la nº 236-§1. L'œil ne voit pas le saut —
                  il voit la page GLISSER VERS LE BAS de 0 à 488. Le
                  défaut n'était donc ni un calcul faux ni une hauteur
                  mal lue : c'était un mouvement de trop.
                  IL N'EN RESTE QU'UN, `remonterSousLaBarre` (dans
                  ContenuFiche), le MÊME que Profil / Portfolio —
                  mesuré au même repère, 488, et déclenché seulement
                  quand la nouvelle liste a sa hauteur définitive. */
            }}
          />
        </div>
      </div>

    </Racine>
      {/*  §1 (nº 602) — LA FENÊTRE DE CARROUSEL SE RENDAIT ICI, en
           frère de la racine et sous la pile. Elle est supprimée : la
           fiche n'a plus qu'UNE surface à elle, cette racine. La pile
           des fiches (nº 226-§5), elle, reste — c'est une autre
           mécanique, et c'est elle qui enveloppe. */}
    </PileFiches>
  );
}

/**
 * ██ §1 (nº 845) — LA CROIX DE RETOUR DE LA nº 844 EST RETIRÉE ██
 * ==================================================================
 * CE QUI VIVAIT ICI : `RetourDeVuePhoto`, un lien en croix posé dans
 * l'angle haut gauche de la photo, qui prenait le retour d'historique
 * quand l'onglet avait un derrière et menait au profil sinon. Il avait
 * été ajouté à la nº 844 POUR REMPLACER la plaque du profil, supprimée
 * à cette passe-là.
 *
 * LA PLAQUE EST RÉTABLIE (nº 845-§1) — et le propriétaire tranche : la
 * croix reste « si elle ne fait pas doublon gênant, sinon la retirer ».
 * ELLE EN FAIT UN, POUR TROIS RAISONS MESURABLES :
 *  1. MÊME DESTINATION, À QUATRE PIXELS D'ÉCART. La plaque est un lien
 *     vers le profil, entière, avec le NOM de l'artiste et un chevron
 *     qui dit où l'on va ; la croix menait au même profil, sans un mot,
 *     juste au-dessus d'elle. Deux cibles pour un seul chemin, dont une
 *     muette : c'est la situation que la nº 502 avait justement
 *     supprimée en fondant le badge « Profil » dans la plaque (« il n'y
 *     a plus DEUX liens vers une même destination côte à côte, mais UN
 *     SEUL »). La rétablir serait défaire cet acquis ;
 *  2. ELLE COUVRE LE TATOUAGE. Un disque de 40 px posé en permanence
 *     sur l'angle haut gauche de CHAQUE photo — l'angle que la nº 459 a
 *     justement libéré en sortant la pastille de partage de l'image.
 *     Une vue photo existe pour montrer la photo ;
 *  3. LE RETOUR D'HISTORIQUE, SON SEUL AVANTAGE PROPRE (rendre la
 *     galerie à sa position), EST DÉJÀ RENDU par le geste de retour du
 *     système — sur les deux plateformes, et c'est ce sur quoi le site
 *     s'appuie partout ailleurs. La nº 455 le dit en toutes lettres à
 *     propos de ce chemin précis : « UNE entrée d'historique ; le
 *     RETOUR rend le profil à sa position ».
 * ⚠️ CE QUI PART AVEC ELLE : `IconeCroix`, `ongletADejaNavigue` et
 * `annoncerRepriseDuSite` n'ont plus d'appelant dans ce fichier.
 */

