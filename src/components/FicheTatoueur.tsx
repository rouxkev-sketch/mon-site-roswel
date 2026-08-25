"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
//  §2 (nº 455) — `useRouter` : la vignette du Portfolio navigue vers
//  la vue photo au doigt (une entrée, le retour rend le profil).
import { usePathname, useRouter } from "next/navigation";
//  §2 (nº 337) — le chemin lu là où il est vrai, et le réveil par les
//  DEUX portes : voir la note de `cheminDuNavigateur` plus bas.
import {
  lireCheminCourant,
  lireCheminServeur,
  souscrireAdresse,
} from "@/lib/adresse-courante";
import {
  libelleStyle,
  //  §1 (nº 451) — le mot « Artiste / Salon / Studio » de la ligne
  //  grise, la MÊME écriture que le sous-titre des cartes (nº 211-§2).
  libelleTypeFiche,
  MARQUE_YOKOFOLIO,
} from "@/config/tatouage";
//  §1 (nº 451) — le lieu de la ligne grise : l'écriture du sous-titre
//  MOBILE des cartes (nº 212-§6), jamais recomposée ici.
import { ligneCarteMobile, villeAffichee } from "@/lib/adresse";
import { positionSousLeGel } from "@/lib/gel-du-corps";
import { BoutonPartageFiche } from "@/components/BoutonPartageFiche";
import { BoutonCoeurPhoto } from "@/components/BoutonCoeurPhoto";
import {
  CarrouselPortfolio,
  PointsDuCarrousel,
} from "@/components/CarrouselPortfolio";
//  §2 (nº 451) — `adresseDeLienInterne` : l'adresse de la vue profil
//  (« ?entree=lien », sans photo en haut), l'écriture UNIQUE des liens
//  internes — la PLAQUE du profil de la photo mobile la consomme (le
//  badge « Profil » qui la portait jusqu'à la nº 502 a laissé sa place
//  au chevron, mais la destination est la même).
import {
  adresseDeLienInterne,
  ContenuFiche,
  ENTREE_LIEN,
} from "@/components/ContenuFiche";
import { FenetreCarrousel } from "@/components/FenetreCarrousel";
import { PileFiches } from "@/components/PileFiches";
import { SondePhoto } from "@/components/SondePhoto";
//  §1 (nº 502) — la rangée du profil de la vue photo devient une
//  PLAQUE : l'écriture partagée (celle des membres d'équipe et des
//  lieux) et le chevron qui dit le lien. Rien n'est recopié.
import { ENCADRE_MEMBRE_CLIQUABLE } from "@/components/plaque";
import { IconeChevronBas } from "@/components/Icones";
//  §2 (nº 455) — `cheminDeLaFenetreCarrousel` est parti avec
//  `ouvrirLaFenetreCarrousel` : plus aucun geste n'écrit l'adresse de
//  la fenêtre de carrousel (elle reste LUE — routes 328/329).
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
import { NATURE_PAR_DEFAUT, titreDeGalerie } from "@/lib/photos-tatoueur";
//  §1 (nº 438) — la fermeture de la fenêtre de carrousel passe par
//  history.back() : elle se déclare, pour que le rattrapage du filet
//  ne la prenne jamais pour un atterrissage au fond de la pile.
import { annoncerRepriseDuSite } from "@/lib/navigation-session";
import type { Tatoueur } from "@/lib/tatoueurs";
//  §2 (nº 455) — l'import `mecanismeCoupe` est parti avec la porte de
//  banc « fenetres » d'`ouvrirLaFenetreCarrousel`, son seul emploi ici.

/**
 * LA FICHE COMPLÈTE D'UN TATOUEUR — le mode d'ARRIVÉE DIRECTE
 * ============================================================
 * C'est la page qu'ouvre un lien partagé ou un moteur de recherche
 * (/tatoueur/nom). Depuis la GRILLE, c'est la FENÊTRE (FenetreFiche)
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
  /** L'INDICE de la photo affichée, DANS la série montrée. Une série
      restreinte commence à sa première photo — elle répond déjà à tout
      ce qui a été cherché. */
  const [indicePhoto, setIndicePhoto] = useState(
    surUnePhoto ? surUnePhoto.indice : serieCherchee ? 0 : ouverture.indice
  );

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

  /**
   * §1 (nº 376) — LE TITRE DE LA GALERIE, sous la photo, AU DOIGT.
   * ------------------------------------------------------------------
   * LA MÊME CHAÎNE QUE LE PORTFOLIO, et c'est le point : elle est
   * composée par `titreDeGalerie` (lib/photos-tatoueur), l'écriture
   * unique que les titres de galerie du portfolio consomment aussi.
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
  const titreDuCarrousel =
    photosDuCarrousel.length > 0
      ? titreDeGalerie(groupeAffiche?.label, serieEffective?.rendu)
      : "";

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
   */
  const fanionSousLaPhoto = !apercu && Boolean(photoAffichee);
  const rangeeSousLaPhoto = Boolean(titreDuCarrousel) || fanionSousLaPhoto;
  /*  §3 (nº 302) — LA GALERIE AFFICHÉE N'EST PLUS CALCULÉE ICI, et
      elle n'a plus de lecteur : elle ne servait qu'au cœur, pour
      enregistrer TOUT le carrousel d'un geste (nº 208-§6). Cette règle
      est annulée — un cœur ne met en favori que sa photo. */

  /**
   * ██ LA FENÊTRE DE CARROUSEL — SMARTPHONE SEULEMENT (nº 284) ██
   * ==================================================================
   * AU DOIGT, toucher un carrousel n'entraîne PLUS AUCUNE remontée :
   * une page s'ouvre PAR-DESSUS (FenetreCarrousel), et la refermer
   * retombe EXACTEMENT à l'endroit touché — la page reste MONTÉE
   * dessous, corps gelé à sa position.
   *
   * L'ADRESSE DÉCIDE, comme pour la pile des fiches (nº 226-§5) :
   *  · OUVRIR pousse UNE entrée d'historique (`pushState` vers
   *    `/tatoueur/<slug>/carrousel?…` — une vraie page, servie aussi
   *    par le serveur : c'est elle qu'on partage) ;
   *  · la fenêtre ne s'affiche que tant que l'adresse correspond —
   *    le bouton retour du téléphone et le glissement du bord la
   *    referment donc naturellement, d'un cran ;
   *  · l'état `fenetreFiche` du pushState dit à la mémoire de
   *    navigation que ce N'EST PAS une page — le journal d'onglet ne
   *    la retient pas, la reprise de session ne la rouvrira pas.
   * ⚠️ LE DRAPEAU `data-fenetre-fiche` EST POSÉ AVANT le pushState :
   * c'est lui qui retient `DefilementEnHaut` de remonter la page (une
   * adresse `/tatoueur/…` qui change remonte, sinon — nº 193-§2).
   *
   * SUR LE WEB ET EN APERÇU (« Ma fiche »), RIEN NE CHANGE : la
   * fonction répond faux, et les vignettes gardent leur comportement
   * (le carrousel principal change, la page remonte — nº 197-§4).
   */
  const pathname = usePathname();
  //  §2 (nº 455) — la navigation des vignettes du Portfolio, au doigt.
  const router = useRouter();

  /**
   * CE QUE L'ADRESSE DU CARROUSEL DÉCRIT — style, série, photo.
   * La MÊME lecture que la route serveur (`/carrousel/page.tsx`) et
   * que `cheminDeLaFenetreCarrousel` qui l'écrit : trois paramètres,
   * pas un de plus. C'est elle qui permet à un RETOUR de rouvrir la
   * fenêtre exactement telle qu'elle était (nº 328-§4).
   */
  function fenetreDeLAdresse() {
    const p = new URLSearchParams(window.location.search);
    const style = p.get("style") ?? "";
    const nature = p.get("nature") ?? "";
    const rendu = p.get("rendu") ?? "";
    return {
      style,
      serie: nature || style ? { nature, rendu } : null,
      photo: Math.max(0, Math.floor(Number(p.get("photo")) || 0)),
      position: positionSousLeGel(),
    };
  }

  const [fenetreCarrousel, setFenetreCarrousel] = useState<{
    style: string;
    serie: { nature: string; rendu: string } | null;
    photo: number;
    position: number;
  } | null>(null);
  /**
   * §4 (nº 328) — L'ADRESSE OUVRE LA FENÊTRE AUTANT QU'ELLE LA FERME.
   * ==================================================================
   * CE QUI ÉTAIT ÉCRIT : l'ajustement ne jouait QUE DANS UN SENS —
   * l'adresse qui ne correspond plus REFERME la fenêtre, mais
   * l'adresse qui redevient celle du carrousel ne la ROUVRAIT pas. La
   * fenêtre ne s'ouvrait que par le geste (`ouvrirLaFenetreCarrousel`).
   *
   * CE QUE CELA CASSAIT (C-1 de l'inventaire nº 327). Depuis la
   * fenêtre, le rond de profil menait à la fiche ; l'entrée du
   * carrousel restait dans l'historique, mais plus rien ne la montait.
   * Un retour ramenait donc l'ADRESSE du carrousel sans la fenêtre :
   * la route serveur répondait, et l'on tombait sur une PAGE PLEINE
   * sans barre, dont la flèche était devenue un lien. On ne revenait
   * jamais à ce qu'on venait de quitter.
   *
   * LA CORRECTION, ET C'EST LE POINT 5 DE LA RÈGLE (l'état d'un écran
   * vit dans l'adresse) : l'ajustement devient SYMÉTRIQUE. L'adresse
   * dit tout — si elle est celle du carrousel, la fenêtre est montée,
   * avec le style, la série et la photo QU'ELLE PORTE. Le retour la
   * rouvre donc dans le même état (point 8), sans repasser par le
   * serveur, et sans qu'aucun geste n'ait à être rejoué.
   *
   * ⚠️ LA POSITION DE LA PAGE DESSOUS, à la réouverture : celle du
   * moment, lue SOUS LE GEL (point 4). Au retour, le corps n'est plus
   * gelé — le dégel de la fermeture précédente l'a rendu à sa place —
   * et c'est donc bien la position de la fiche qu'on relit.
   * ⚠️ AJUSTÉ PENDANT LE RENDU, jamais dans un effet (le motif de
   * PileFiches), avec la même vérité : `location`, car `usePathname`
   * reste en retard d'un rendu et ne sert que de réveil.
   *
   * §1 (nº 336) — SAUF AU TOUT PREMIER RENDU, OÙ C'EST L'INVERSE, ET
   * C'EST LÀ QUE LA FENÊTRE NE SE REFERMAIT PAS.
   * ==================================================================
   * MESURÉ, PAS SUPPOSÉ. Depuis un lien de partage, on touche le rond
   * de profil de la fenêtre : le relevé image par image donne
   *
   *     +0 ms     /tatoueur/…/carrousel?…   FENÊTRE
   *     +1177 ms  /tatoueur/…?entree=lien   FENÊTRE   ← et pour toujours
   *
   * La fiche est bien arrivée (barre, réserve, onglets Profil et
   * Portfolio, tous absents de la page partagée) — ET ELLE A ROUVERT
   * LA FENÊTRE PAR-DESSUS ELLE-MÊME. C'est exactement ce que le
   * propriétaire voyait depuis trois passes : « je touche, rien ne se
   * passe ». Rien ne se passait, en effet : la fiche était dessous.
   *
   * POURQUOI. Pendant une navigation de client, le routeur rend LA
   * NOUVELLE PAGE AVANT que le navigateur n'ait commis l'adresse. Au
   * TOUT PREMIER rendu de la fiche, `usePathname()` dit déjà
   * `/tatoueur/<slug>` (la route où l'on va), tandis que
   * `window.location.pathname` dit encore `/tatoueur/<slug>/carrousel`
   * (l'adresse d'où l'on vient). C'est l'INVERSE du retard décrit
   * ci-dessus. La fenêtre s'ouvrait donc sur une adresse qu'on était en
   * train de QUITTER — et plus rien ne la refermait ensuite : l'adresse
   * commise ne provoque aucun nouveau rendu, puisque `usePathname` ne
   * change pas (il donnait déjà la bonne route).
   *
   * LA RÈGLE : au premier rendu, c'est LE ROUTEUR qui dit la vérité —
   * lui seul sait vers quelle page on va. Ensuite, et pour toute la vie
   * du composant, c'est `location` — lui seul voit les `pushState`
   * bruts de l'ouverture au doigt et les `popstate` du retour, que le
   * routeur ne traduit pas toujours.
   * ⚠️ CECI NE TOUCHE NI À L'OUVERTURE AU DOIGT (elle pose l'état
   * elle-même, `ouvrirLaFenetreCarrousel`), NI À LA RÉOUVERTURE AU
   * RETOUR (nº 328-§4 : le `popstate` change `location`, on n'est plus
   * au premier rendu), NI À LA FERMETURE D'UN SEUL APPUI (nº 330).
   */
  const adresseDeLaFenetre = `/tatoueur/${tatoueur.slug}/carrousel`;
  //  ⚠️ UN ÉTAT, PAS UNE RÉFÉRENCE : une référence ne se lit pas
  //  pendant le rendu (règle de React, et le linte le refuse). Faux au
  //  tout premier rendu, vrai pour toujours ensuite.
  const [ficheDejaPosee, setFicheDejaPosee] = useState(false);
  useEffect(() => {
    //  Une image plus tard — le motif de `useAppareilMobile` : poser
    //  un état SYNCHRONEMENT dans un effet enchaîne les rendus, et le
    //  linte le refuse. À cet instant, l'adresse est commise.
    const image = requestAnimationFrame(() => setFicheDejaPosee(true));
    return () => cancelAnimationFrame(image);
  }, []);
  /**
   * §2 (nº 337) — ET IL FALLAIT ÊTRE RÉVEILLÉ, SANS QUOI LA RÈGLE
   * CI-DESSUS NE S'APPLIQUAIT JAMAIS DEUX FOIS.
   * ==================================================================
   * MESURÉ, RÉSEAU RALENTI ET PROCESSEUR BRIDÉ, SUR LA FENÊTRE
   * SUPERPOSÉE — le chemin du propriétaire, enfin reproduit :
   *
   *     premier appui sur le rond → /tatoueur/x#profil  + FENÊTRE
   *     second  appui sur le rond → /tatoueur/x#profil  (plus de fenêtre)
   *
   * « Au premier appui la page saute et la fenêtre revient ; au second,
   * j'accède au profil. » Exactement cela.
   *
   * POURQUOI. La fenêtre pose son adresse par un `pushState` BRUT — le
   * routeur de Next n'en sait rien et continue d'annoncer le chemin de
   * la PAGE, `/tatoueur/<slug>`. Quand le rond ramène à ce même chemin,
   * `usePathname()` NE CHANGE PAS : il valait déjà cela. Aucun rendu
   * n'est donc déclenché, l'ajustement ci-dessous n'est jamais rejoué,
   * et la fenêtre reste. Le second appui, lui, provoque un rendu pour
   * une autre raison — et c'est ce rendu-là qui refermait.
   * Ma correction de la nº 336 était juste sur le fond (le routeur dit
   * la vérité à la naissance) mais elle ne pouvait pas s'appliquer : il
   * n'y avait pas de second rendu.
   *
   * LA CORRECTION : on s'abonne à TOUT changement d'adresse, par les
   * DEUX portes — le navigateur (`popstate`) et le code
   * (`pushState`/`replaceState`, Next compris). C'est l'écriture
   * commune qui existe déjà pour cela (`souscrireAdresse`,
   * lib/adresse-courante), celle que la mémoire de navigation emploie
   * depuis la nº 154. Aucun second dispositif.
   * ⚠️ DÉTERMINISTE, ET NON PLUS DÉPENDANT D'UN ORDRE : quel que soit
   * l'instant où l'adresse est commise, elle réveille ce composant, et
   * l'ajustement retrouve la vérité.
   */
  const cheminDuNavigateur = useSyncExternalStore(
    souscrireAdresse,
    lireCheminCourant,
    lireCheminServeur
  );
  const cheminReel =
    !ficheDejaPosee || !cheminDuNavigateur ? pathname : cheminDuNavigateur;
  if (fenetreCarrousel && cheminReel !== adresseDeLaFenetre) {
    setFenetreCarrousel(null);
  }
  if (
    !fenetreCarrousel &&
    !apercu &&
    cheminReel === adresseDeLaFenetre &&
    typeof window !== "undefined" &&
    document.documentElement.dataset.appareil === "mobile"
  ) {
    setFenetreCarrousel(fenetreDeLAdresse());
  }

  /**
   * §3 (nº 290) — LA PHOTO ÉPOUSE LA HAUTEUR VISIBLE : ON LA MESURE,
   * ON NE LA DEVINE PLUS
   * ==================================================================
   * CE QUI ÉTAIT ÉCRIT : `calc((100vh − 119px) × 0,8)`. Ces 119 px
   * étaient une SOMME DEVINÉE — 79 de barre fixe, 20 de marge en
   * haut, 20 en bas — posée il y a plusieurs passes. Deux choses la
   * rendent fausse : la barre ne mesure pas 79 px (relevé ici : 76),
   * et surtout, en APERÇU (« Mon portfolio » du menu Mon compte), la
   * fiche est posée DANS l'espace tatoueur, qui a son propre bandeau
   * au-dessus : la photo commence bien plus bas, la constante réserve
   * bien trop peu, et le cadre calcule donc une largeur trop grande —
   * il s'élargit et déborde par le bas, en mangeant la marge.
   *
   * LA VOIE PRISE : MESURER CE QUI ENTOURE VRAIMENT LA PHOTO — pas
   * une nouvelle constante, aucune. Deux nombres, tous deux lus :
   *   · LE HAUT — la position du haut de la photo dans le document.
   *     Elle contient TOUT ce qui vit au-dessus (barre, bandeau de
   *     l'espace, marge du haut), quel qu'il soit et quoi qu'il
   *     devienne ;
   *   · LE BAS — la marge du bas, DÉJÀ ÉCRITE sur la racine de la
   *     fiche (`lg:pb-5`, la jumelle de `lg:pt-5`) : on la LIT sur
   *     l'élément, on ne la réécrit pas.
   * La hauteur libre est la différence, et la largeur en découle
   * (× 0,8, le format 4:5). Somme garantie : haut + photo + bas =
   * hauteur de l'écran, exactement.
   *
   * ⚠️ AUCUNE BOUCLE POSSIBLE : le haut de la photo ne dépend pas de
   * sa propre taille (elle ouvre sa colonne, et les deux colonnes de
   * la grille partagent la même rangée). On ne l'observe donc jamais
   * elle-même — seulement la fenêtre et ce qui la précède.
   * ⚠️ AVANT LA MESURE (le tout premier rendu, avant l'hydratation),
   * la feuille de style retombe sur l'ancien calcul : rien ne change
   * pour cet instant-là, et la valeur juste arrive dans la foulée.
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
  const sansPhoto = entreeInitiale === ENTREE_LIEN;

  const cadrePhoto = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const zone = cadrePhoto.current;
    if (!zone) return;
    const racine = zone.closest("[data-racine-fiche]");
    let posee = -1;
    const mesurer = () => {
      if (!zone.isConnected) return;
      //  LA POSITION AU REPOS : `rect.top` seul suivrait le
      //  défilement ; la somme avec le défilement courant, non.
      const haut =
        zone.getBoundingClientRect().top +
        (document.scrollingElement?.scrollTop ?? 0);
      const basEcrit = racine
        ? parseFloat(getComputedStyle(racine).paddingBottom) || 0
        : 0;
      const libre = window.innerHeight - haut - basEcrit;
      //  Une fenêtre plus courte que ce qui surmonte la photo : on ne
      //  pose rien, l'ancien calcul reste — jamais de largeur nulle.
      if (!(libre > 0)) return;
      if (Math.abs(libre - posee) < 0.5) return;
      posee = libre;
      zone.style.setProperty("--photo-hauteur-libre", `${libre}px`);
      /**
       * §1 (nº 293) — LA LARGEUR TOMBE SUR UN MULTIPLE DE 4, ET VOICI
       * POURQUOI CE NOMBRE-LÀ.
       * ----------------------------------------------------------------
       * CE QUI ÉCHAPPAIT À L'ARRONDI : l'ENVELOPPE. `round(down,100%,1px)`
       * (nº 280) est écrit sur le CADRE et sur lui seul ; l'enveloppe,
       * elle, prenait `libre × 0,8` tel quel — 565,594 px au relevé du
       * propriétaire. Le cadre tombait donc à 565, et il restait 0,594 px
       * d'enveloppe À DROITE du cadre, sur toute la hauteur : une bande
       * du fond de la carte, pile là où il voit « une marge verticale ».
       * ET LA HAUTEUR N'ÉTAIT PAS ENTIÈRE NON PLUS : 565 × 1,25 = 706,25.
       * Le bord du bas tombait donc entre deux pixels — à densité 2,
       * c'est un demi-pixel d'écran, et c'est le liseré du haut et du bas.
       *
       * LE NOMBRE 4 N'EST PAS CHOISI À L'ŒIL, IL EST DÉDUIT : le format
       * est 4/5, donc la hauteur vaut largeur × 1,25. Une largeur entière
       * ne suffit pas — il faut qu'elle soit MULTIPLE DE 4 pour que
       * × 1,25 retombe sur un entier (4k × 1,25 = 5k). Alors tout tombe
       * juste ENSEMBLE : l'enveloppe, le cadre (dont l'arrondi de la
       * nº 280 n'a plus rien à retirer), chaque colonne (100 % du cadre),
       * les positions d'arrêt du défilement (k × largeur) et la hauteur.
       * ⚠️ CE QUE ÇA COÛTE : jusqu'à 3 px de largeur, qui partent dans la
       * marge du bas. Elle reste donc à un cheveu de celle du haut, et
       * TOUJOURS du bon côté — jamais un débordement.
       * ⚠️ LE DOIGT N'EST PAS CONCERNÉ : la règle qui lit cette variable
       * est sous `lg:`. Au doigt la photo est bord à bord, et elle le
       * reste.
       */
      zone.style.setProperty(
        "--photo-largeur",
        `${Math.floor((libre * 0.8) / 4) * 4}px`
      );
    };
    mesurer();
    //  UNE SECONDE MESURE À LA TRAME SUIVANTE : la première tombe
    //  parfois avant que les polices ne soient posées, et la barre
    //  fixe change alors de hauteur d'un cheveu.
    const trame = requestAnimationFrame(mesurer);
    window.addEventListener("resize", mesurer);
    //  LA BARRE FIXE peut changer de hauteur sans que la fenêtre
    //  bouge : on la regarde, ELLE — jamais la photo, ni aucun de ses
    //  parents (leur hauteur dépend de la sienne : ce serait une
    //  boucle).
    const barre = document.querySelector("header");
    const observateur = new ResizeObserver(mesurer);
    if (barre) observateur.observe(barre);
    return () => {
      cancelAnimationFrame(trame);
      window.removeEventListener("resize", mesurer);
      observateur.disconnect();
    };
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
      ⚠️ CE QUI RESTE, ET DOIT RESTER (règles 328/329 — les vieilles
      adresses vivent) : la route serveur `/tatoueur/<slug>/carrousel`
      et la RÉOUVERTURE PAR L'ADRESSE (l'ajustement symétrique
      nº 328-§4, plus haut) — un vieux lien partagé, un retour ou un pas
      en avant vers une adresse de carrousel montent la fenêtre
      exactement comme avant. Seule l'entrée par geste a changé de
      destination. */

  /*  §3 (nº 304) — LA PHOTO DU HAUT N'OUVRE PLUS RIEN, et
      `surToucherDeLaPhoto` est SUPPRIMÉE, code compris.
      ------------------------------------------------------------------
      LA RÈGLE DU PROPRIÉTAIRE : la fenêtre de carrousel (nº 284) était
      RÉSERVÉE À LA PARTIE PORTFOLIO de la fiche. Toucher la photo
      principale l'ouvrait aussi — ce n'était pas voulu.
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
        `/tatoueur/<slug>` — une adresse SANS ce paramètre. La vue
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
      data-vue-photo={!apercu && !sansPhoto ? "" : undefined}
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
             §3 (nº 295) — SAUF QUAND LE LIEN A DIT « PAS DE PHOTO » :
             la colonne entière disparaît, la page commence par Profil /
             Portfolio. Le carrousel n'est même pas monté — aucune image
             n'est demandée. */}
        {!sansPhoto && (
        <div
          //  nº 359 — le nom de la colonne, pour la garde d'avant
          //  peinture de la fiche préparée d'avance (globals.css).
          data-photo-de-tete=""
          className="flex flex-col gap-3 min-w-0"
        >
          {/*  §1 (nº 454) — LA PHOTO REMONTE EN TÊTE : la rangée du
               profil (nº 452, affinée nº 453) ne vit plus au-dessus de
               l'image — elle est descendue SOUS la ligne du titre, en
               dernier bloc de la colonne (voir plus bas). L'ordre de la
               vue photo au doigt : photo · titre + fanion · rangée du
               profil, et rien après (la coupe nº 453 suit). */}

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
                haut n'ouvre plus la fenêtre de carrousel (voir la note
                de la fonction supprimée, plus haut). */
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
            className={`lg:w-[var(--photo-largeur,calc((100vh_-_119px)*0.8))] max-w-full mobile:-mx-4 mobile:max-w-none ${
              apercu ? "mobile:-mt-4" : "mobile:-mt-[15px]"
            }`}
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
                       siens SOUS la photo (plus bas dans ce fichier). */}
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
            * `titreDuCarrousel` est vide quand la fiche n'a aucune
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
                 │           Artiste • Ville, Pays      │
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
               L'AIR, MESURÉ À L'ÉCRAN. La colonne écarte ses enfants
               de 12 px (`gap-3`), et la ligne du titre en reprenait
               quatre (`mobile:-mt-1`, §2 nº 453) : il y avait donc
               8 px entre la photo et le titre. Ce bloc-ci s'intercale
               avec le MÊME réglage — 8 px sous la photo, ses 6 px de
               ronds, puis 8 px avant le titre. La zone sous la photo
               s'allonge de 14 px, et de rien d'autre.
               ⚠️ LE POINT D'ÉQUERRE PHOTO/ÉCRAN DES nº 472-474 N'EST
               PAS TOUCHÉ : il se joue AU-DESSUS de la photo (la
               remontée qui la fait toucher la barre fixe,
               `mobile:-mt-[15px]`), et rien ici ne le concerne. Ce
               qu'on ajoute est en dessous.
               ⚠️ LA LIGNE DU TITRE NE BOUGE PAS D'UN PIXEL PAR
               RAPPORT À CE QUI LA SUIT : elle garde son écriture, ses
               deux icônes et son écart de 10 px. Elle descend de
               14 px, avec tout ce qui est sous elle.
               ⚠️ ET LE COMPTEUR RESTE (nº 483, nº 487) : il vit dans
               l'angle de la photo, il n'est pas concerné par cette
               ligne-ci. */}
          {rangeeSousLaPhoto && photosDuCarrousel.length > 1 && (
            <div className="hidden mobile:flex justify-center mobile:-mt-1">
              <PointsDuCarrousel
                photos={photosDuCarrousel}
                indice={indicePhoto}
                surRang={setIndicePhoto}
              />
            </div>
          )}
          {rangeeSousLaPhoto && (
            <div className="hidden mobile:flex items-center gap-2.5 mobile:-mt-1">
              <p
                data-titre-carrousel=""
                className="flex-1 min-w-0 truncate text-[15px]
                           font-semibold text-sombre-texte"
              >
                {titreDuCarrousel}
              </p>
              {/*  ██ §1-d (nº 483) — LE FANION SE CALE SUR LA MARGE ██
                   L'ÉCART, MESURÉ : la cible du fanion fait 48 px et son
                   glyphe 30 — le dessin est donc centré, et il lui reste
                   NEUF pixels de vide à droite. Le fanion paraissait
                   rentré d'autant par rapport au bord de l'interface,
                   alors que sa BOÎTE, elle, y touchait déjà. C'est le
                   défaut exact de la silhouette « mon compte » à la
                   nº 465, et le remède est le sien : on tire la boîte
                   vers la droite d'exactement ce vide, pour que le
                   GLYPHE tombe sur la marge. La cible ne change ni de
                   taille ni de forme — elle déborde dans la marge, où
                   rien d'autre ne vit.
                   §1 (nº 487) — LA VALEUR EST RECALCULÉE avec le
                   glyphe réduit : (48 − 26) / 2 = ONZE pixels, contre
                   neuf quand il en faisait trente. Sans ce recalcul, le
                   fanion se serait décalé de deux pixels vers
                   l'intérieur en rapetissant.
                   ⚠️ LES DEUX GESTES SONT GROUPÉS SANS ÉCART : leurs
                   cibles se touchent, mais chaque glyphe garde son
                   retrait interne — huit pixels pour la flèche (24 dans
                   40), onze pour le fanion. À l'œil, dix-neuf pixels
                   les séparent, et AUCUNE des deux cibles n'a rétréci :
                   quarante et quarante-huit pixels, comme avant. */}
              <div className="flex shrink-0 items-center -mr-[11px]">
                {!apercu && (
                  <BoutonPartageFiche
                    nomArtisan={tatoueur.nom}
                    cheminFiche={cheminDuCarrousel(
                      tatoueur.slug,
                      styleAffiche,
                      serieEffective
                    )}
                    variante="icone"
                    /*  §2 (nº 459), REVU nº 487 — LA FLÈCHE À 24 px.
                        Elle était montée de 22 à 28 pour se tenir à
                        l'échelle du fanion d'en face ; les deux
                        descendent ensemble d'un même cran (28 → 24 ici,
                        30 → 26 pour le fanion), donc l'équilibre entre
                        elles est celui d'avant — le fanion reste plus
                        gros de deux pixels, ni plus ni moins.
                        ⚠️ LA CIBLE RESTE À 40 px (variante « icone »,
                        nº 458) : le dessin rétrécit, pas la surface
                        qu'on touche. */
                    tailleIcone={24}
                    avecFenetre
                    sombre
                    metier={stylePrincipal?.label}
                    commune={villeAffichee(tatoueur.ville_nom)}
                    marque={MARQUE_YOKOFOLIO.nom}
                  />
                )}
                {!apercu && photoAffichee && (
                  <BoutonCoeurPhoto
                    photoId={photoAffichee.cle}
                    variante="fiche-mobile"
                  />
                )}
              </div>
            </div>
          )}

          {/*  ██ §1 (nº 454) — LA RANGÉE DU PROFIL, SOUS LA LIGNE DU
               TITRE ██
               ==================================================
               Posée au-dessus de la photo à la nº 452, elle DESCEND en
               dernier bloc de la colonne : photo · titre + fanion ·
               cette rangée — et rien après (la coupe nº 453 retire la
               colonne de lecture de la vue photo). Elle garde TOUT de
               la nº 453 : avatar 40 px, nom blanc gras, ligne grise
               13 px avec ses 4 px d'air sous le nom, jetons du site,
               navigation inchangée (le badge « Profil » de 30 px et sa
               cible tactile de 44 sont remplacés par le chevron à la
               nº 502 : c'est la plaque entière qui se touche) (`adresseDeLienInterne`, UNE entrée, le retour
               rend la vue photo). SEULE SA PLACE change — le
               `mobile:-mt-2` de la nº 453 (l'air sous la barre) part
               avec elle : sous le titre, l'air est le `gap-3` de la
               colonne, 12 px.
               ⚠️ WEB ET APERÇU : RIEN — `hidden mobile:flex`, aperçu
               exclu comme le partage. La garde d'avant peinture
               (nº 359) couvre la COLONNE entière : une arrivée
               `entree=lien` cache la rangée avec la photo. */}
          {!apercu && (
            <div data-habillage-photo="" className="hidden mobile:block">
              {/*  §1 (nº 455) — TOUTE LA RANGÉE MÈNE AU PROFIL : le bloc
                   avatar + nom + ligne est un `<Link>` vers
                   `adresseDeLienInterne` — UNE entrée, le retour rend la
                   vue photo ; un re-clic pendant l'attente est avalé par
                   le signe (332-§1).
                   LA TYPO GRANDIT : le nom passe de 13,5 à 15 px — LA
                   taille du titre de la galerie sous la photo
                   (nº 376) ; la ligne d'adresse suit en proportion,
                   de 13 à 14,5 px (le corps du sous-titre des cartes en
                   pleine largeur).
                   ██ §1 (nº 502) — LA RANGÉE DEVIENT UNE PLAQUE ██
                   ==============================================================
                   Elle prend l'écriture PARTAGÉE des plaques
                   (`components/plaque`), celle des membres d'équipe et
                   des lieux : fond uni permanent, quatre coins à 12 px,
                   douze pixels d'air sur les quatre côtés (nº 497),
                   aucune bordure, arrêt aux marges. Pas une seconde
                   écriture — la même, lue au même endroit : les trois
                   blocs ne peuvent plus diverger.
                   LE BADGE « Profil » DISPARAÎT, et le CHEVRON prend sa
                   place à droite (nº 493) : la forme dit le lien, pas un
                   mot. Ce qui règle du même coup le point délicat de la
                   nº 455 — il n'y a plus DEUX liens vers une même
                   destination côte à côte, mais UN SEUL, qui est la
                   plaque entière.
                   PAS DE MENTION GRISE AU-DESSUS, contrairement aux
                   plaques d'équipe : ici il n'y a ni statut ni type de
                   lieu à annoncer. La plaque commence directement.
                   ⚠️ CE QUI CHANGE MALGRÉ MOI, ET JE LE DIS : l'écart
                   entre l'avatar et son texte passe de 10 à 14 px — la
                   valeur que l'écriture partagée porte depuis la nº 227.
                   C'est la contrepartie de la réutilisation ; recopier
                   l'écriture pour garder 10 px ferait exactement ce que
                   cette passe cherche à éviter.
                   ⚠️ WEB ET APERÇU : RIEN — `hidden mobile:block`,
                   aperçu exclu comme le partage. */}
              <Link
                href={adresseDeLienInterne(tatoueur.slug)}
                className={ENCADRE_MEMBRE_CLIQUABLE}
              >
                {/*  §1 (nº 502) — DEUX CRANS AU-DESSUS DE LA PLAQUE, et
                     pas un : au repos elle vaut `bg-sombre-eleve`, au
                     survol elle monte d'un cran. Un rond de repli posé
                     sur ce cran-là disparaîtrait. C'est le défaut traité
                     à la nº 492 sur `PhotoRonde`, ici sur le rond écrit
                     à la main de la vue photo. Il ne concerne QUE le
                     repli sans photo : une vraie photo couvre le rond
                     entièrement. */}
                {/*  §1 (nº 524) — le rond revient à sa valeur d'avant
                     la nº 523, avec sa plaque (voir plaque.ts). */}
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center
                             overflow-hidden rounded-full bg-sombre-haut"
                >
                  {tatoueur.photo_profil ? (
                    /* eslint-disable-next-line @next/next/no-img-element --
                       photo déposée par le tatoueur, servie telle quelle. */
                    <img
                      src={tatoueur.photo_profil}
                      alt=""
                      decoding="async"
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="text-[16px] font-bold text-sombre-texte-doux"
                    >
                      {tatoueur.nom.trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  {/*  ██ §2 (nº 555) — CE NOM SUIT LES DEUX AUTRES ██
                       LA QUESTION POSÉE : cette plaque doit-elle monter
                       à 16 px avec celles des lieux et de l'équipe ?
                       OUI, ET POUR LA RAISON QUI A CRÉÉ CE FICHIER À LA
                       nº 502 : c'est LA MÊME PLAQUE, lue au même endroit
                       (`ENCADRE_MEMBRE_CLIQUABLE`, components/plaque) —
                       « les trois blocs ne peuvent plus diverger », dit
                       la note du dessus. La laisser à 15 px rouvrirait
                       exactement la divergence que le §1 de cette passe
                       referme sur la graisse.
                       ET C'EST LE NOM LE PLUS IMPORTANT DES TROIS : en
                       vue photo au doigt, le `<h1>` de la fiche n'est
                       pas à l'écran — cette plaque EST le seul endroit
                       où le nom du tatoueur se lit.
                       ⚠️ CELLE-CI GRANDIT, ET JE LE DIS : elle n'a pas
                       de plancher (les deux autres ont `min-h-13`), sa
                       hauteur suit son contenu. `leading-tight` (1,25) :
                       la ligne passe de 18,75 à 20 px, le bloc de texte
                       de 40,875 à 42,125, et la plaque — 24 px d'air
                       compris — de 64,9 à 66,1 px. UN PIXEL ET QUART DE
                       PLUS, une seule fois dans la page.
                       ⚠️ LA COUPE NE CHANGE PAS DE NATURE : `truncate`
                       garde le nom sur UNE ligne avec ses points de
                       suspension — deux ou trois caractères de moins y
                       tiennent, rien d'autre ne bouge. */}
                  <span className="block truncate text-[16px] font-semibold leading-tight text-sombre-texte">
                    {tatoueur.nom}
                  </span>
                  {/*  La puce « • » : la seule ponctuation du site entre
                       deux valeurs (nº 395). §1 (nº 455) : 14,5 px (13 à
                       la nº 453), les 4 px d'air sous le nom restent. */}
                  <span className="block truncate text-[14.5px] leading-tight text-sombre-texte-doux mt-1">
                    {[
                      libelleTypeFiche(
                        tatoueur.type_fiche,
                        tatoueur.etablissement
                      ),
                      ligneCarteMobile({
                        ville: tatoueur.ville_nom,
                        region: tatoueur.region,
                        pays: tatoueur.pays,
                        code_pays: tatoueur.code_pays,
                      }),
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </span>
                </span>
                {/*  §1 (nº 502) — LE CHEVRON REMPLACE LE BADGE
                     « Profil » : la même icône que le volet des horaires,
                     pivotée d'un quart de tour pour pointer à droite,
                     dans le gris des textes secondaires — l'écriture
                     exacte des plaques d'équipe (nº 493). Centré sur
                     TOUTE la plaque par `self-center`, les rembourrages
                     haut et bas étant égaux (nº 497).
                     ⚠️ CE QUE LE BADGE PORTAIT ET QUI N'A PLUS D'OBJET :
                     ses 30 px de haut, sa cible tactile de 44 px par
                     ourlet, et son propre lien vers la même destination
                     (nº 453/455). La plaque ENTIÈRE est la cible
                     désormais — plus large que 44 px dans les deux
                     sens —, et il n'y a plus qu'un seul lien. */}
                <span
                  aria-hidden="true"
                  className="-rotate-90 self-center shrink-0 text-sombre-texte-doux"
                >
                  <IconeChevronBas taille={16} />
                </span>
              </Link>
            </div>
          )}

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
            WEB : la colonne DÉFILE TOUTE SEULE (overflow-y-auto) dans
            la même hauteur que la photo — même butée haute (79 + 20),
            même hauteur maximale (100vh − 119) : la marge sous son
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
        <div
          data-colonne-lecture=""
          className="lg:sticky lg:top-[99px] lg:self-start lg:max-h-[calc(100vh-119px)] lg:overflow-y-auto lg:overflow-x-clip lg:px-3 lg:-mx-3 min-w-0 flex flex-col bg-sombre-fond [--fond-colonne:var(--rw-sombre-fond)]"
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
                  La fenêtre de carrousel (nº 284) n'est plus le chemin
                  des vignettes : le geste NAVIGUE, par le routeur, vers
                  l'adresse que les CARTES écrivent (nº 371 — style,
                  rendu, nature, photo ; `URLSearchParams`, mêmes
                  paramètres, même page servie par le jumeau dynamique).
                  UNE entrée d'historique (332-§1) ; l'arrivée se fait
                  en haut (nº 446, DefilementEnHaut) ; le RETOUR rend le
                  profil à sa position (mémoire de navigation) — comme
                  depuis une carte, parce que c'est le même chemin.
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
                const requete = suite.toString();
                router.push(
                  requete
                    ? `/tatoueur/${tatoueur.slug}?${requete}`
                    : `/tatoueur/${tatoueur.slug}`
                );
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

      {/*  §2 (nº 291) — LA SONDE DE LA PHOTO, `?sonde-photo=1`. Elle
           est posée ICI et pas sur la page publique seule : le défaut
           relevé vit sur « Mon portfolio », qui rend CE composant en
           mode aperçu — une sonde montée ailleurs n'aurait jamais vu
           l'écran qui se plaint.
           ⚠️ ELLE NE DÉPLACE RIEN : son bandeau part dans un portail
           vers `document.body`, en `position: fixed`. Sans le
           paramètre dans l'adresse, elle ne rend rien du tout. */}
      <SondePhoto />
    </Racine>
      {/*  §Fenêtre (nº 284) — LA FENÊTRE DE CARROUSEL, par-dessus la
           page. Elle ne vit que tant que l'adresse est la sienne
           (voir l'ajustement pendant le rendu, plus haut) : le retour
           du téléphone la referme, et le gel du corps rend la page à
           sa position exacte. */}
      {fenetreCarrousel && (
        <FenetreCarrousel
          tatoueur={tatoueur}
          style={fenetreCarrousel.style}
          serie={fenetreCarrousel.serie}
          photoInitiale={fenetreCarrousel.photo}
          positionPage={fenetreCarrousel.position}
          surFermeture={() => {
            //  §1 (nº 438) — reprise déclarée AVANT le back : le
            //  rattrapage du filet la lit au popstate et se tait.
            annoncerRepriseDuSite();
            window.history.back();
          }}
        />
      )}
    </PileFiches>
  );
}
