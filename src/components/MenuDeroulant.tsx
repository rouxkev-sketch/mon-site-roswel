"use client";

import { useEffect, useRef, useState } from "react";
import { gelerLeCorps } from "@/lib/gel-du-corps";
//  §3 (nº 573) — LE VERROU DE DÉFILEMENT COMPTÉ de la maison (nº 469),
//  le même qu'à la nº 560 : le corps ne redéfile qu'au dernier retrait.
import {
  poserLeVerrouDeDefilement,
  retirerLeVerrouDeDefilement,
} from "@/lib/verrou-defilement";
//  §3 (nº 330) — L'ÉTAPE D'HISTORIQUE D'UNE SURFACE QUI COUVRE
//  L'ÉCRAN : l'écriture unique des quatre surfaces du C-4.
import { useEtapeQuiSeReferme } from "@/lib/etape-refermable";
import { createPortal } from "react-dom";
import { COULEURS } from "@/config/roswel";
import {
  OPTION_LISTE,
  PANNEAU_LISTE_FLOTTANT,
} from "@/components/champs-recherche";
import { stylePanneau, usePlacementMenu } from "@/components/placement-menu";
import { useVoileDeLaPage } from "@/components/VoileDeLaPage";
//  §1 et §2-a (nº 317) — LES TROIS RÈGLES DE REPLI, SORTIES D'ICI pour
//  qu'un banc puisse les jouer plutôt que les relire.
import {
  aDesPortesDeGroupe,
  optionSeVoit,
  replieALOuverture,
  sousTitresDe,
} from "@/lib/repli-menu";

// La petite flèche du menu, dessinée dans le code. Deux versions :
// GRISE au repos, ROSE quand le menu est ouvert (elle change en même
// temps que le contour du champ).
const flecheImage = (couleur: string) =>
  `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='8'><path d='M1 1l6 6 6-6' stroke='${couleur}' stroke-width='2' fill='none' stroke-linecap='round'/></svg>`
  )}")`;
/** §3 (nº 260) — LA TAILLE DES POINTS DE LA FEUILLE, écrite une fois.
    §1 (nº 262) — PORTÉE À 6 px : les 4 px de la nº 260 étaient trop
    discrets, on ne les voyait plus.
    §3 (nº 525) — ELLE NE SERT PLUS QU'AUX DEUX POINTS ROSES : la
    PORTE de famille (« Cultures du monde ») et le SOUS-TITRE
    (« ARTISTE », « LIEU »). Les points gris des styles ont été
    supprimés — voir la note du rendu d'une entrée, plus bas. */
const TAILLE_POINT = "w-1.5 h-1.5";

const FLECHE_GRISE = flecheImage(COULEURS.flecheMenus);
const FLECHE_ROSE = flecheImage(COULEURS.primaire);

/**
 * §2-b (nº 317) — L'ÉCRITURE D'UN TITRE DE GROUPE, EXTRAITE.
 * ------------------------------------------------------------------
 * Elle habillait « Styles », « Profil », « Réalisations », « Flashs »
 * — et elle vivait en dur dans `enTeteSection`. Le propriétaire exige
 * que les SOUS-TITRES (« ARTISTE », « LIEU ») portent LA MÊME taille
 * et LA MÊME graisse : la seule façon de le garantir pour de bon est
 * qu'ils lisent la même chaîne. Deux valeurs recopiées finiraient par
 * diverger — c'est la règle du site depuis la nº 276.
 * ⚠️ LA COULEUR N'EN FAIT PAS PARTIE, et c'est voulu : le titre de
 * groupe est ROSE, le sous-titre GRIS. C'est la seule chose qui les
 * sépare, et elle se lit d'un coup d'œil.
 * ⚠️ LA TAILLE (13 px) EST SOUS CELLE DES ENTRÉES (16 px) : un titre
 * annonce, il ne se choisit pas.
 */
const ECRITURE_TITRE_GROUPE =
  "text-[13px] font-bold uppercase tracking-[0.08em]";

export type OptionMenu = {
  value: string;
  label: string;
  /** En-tête de section (non cliquable) sous lequel ranger l'option.
      Les options qui partagent le même `groupe` se suivent ; l'en-tête
      s'affiche une seule fois, en gras, avant la première d'entre elles. */
  groupe?: string;
  /** SOUS-SECTION DÉPLIANTE, à l'intérieur d'un groupe (passe nº 113).
      N'a d'effet qu'avec `repliable`. Les options qui la partagent se
      suivent ; une PORTE portant ce nom s'affiche à leur place dans la
      liste, et ne les révèle qu'une fois ouverte.
      ⚠️ CE NOM N'EST PAS UNE OPTION : on ne peut pas le choisir. C'est
      ce qui permet à « Cultures du monde » d'exister dans le menu
      « Explorer » sans être un style cherchable. */
  sousGroupe?: string;
  /**
   * §2 (nº 317) — CETTE SOUS-SECTION EST UN SIMPLE SOUS-TITRE.
   * ------------------------------------------------------------------
   * ⚠️ IL REMPLACE `sousGroupeGris` (nº 316), ET IL DIT PLUS QUE LUI.
   * La nº 316 avait posé « ARTISTE » et « LIEU » comme de vraies
   * PORTES : flèche, pliage, clic. Le propriétaire a tranché — ce sont
   * de simples sous-titres. Ils ANNONCENT, et rien de plus :
   *  · aucune flèche, aucun pliage — leurs options sont visibles dès
   *    que leur groupe est ouvert ;
   *  · aucun clic, aucun survol, aucun état choisi ;
   *  · en gris : la typographie des titres de groupe au web
   *    (`ECRITURE_TITRE_GROUPE`), le rang des entrées au doigt.
   * ⚠️ « CULTURES DU MONDE » N'EST PAS CONCERNÉE : elle EST une porte,
   * onze styles derrière elle et d'autres styles à côté. Elle ne passe
   * pas ce drapeau et garde tout — flèche, pliage, blanc des options.
   */
  sousTitre?: boolean;
  /** CE QUI S'ÉCRIT À DROITE DE L'INTITULÉ (nº 216-§2) — le nombre de
      créations disponibles pour cette entrée. Rien quand il est
      absent : une option sans compte s'affiche exactement comme
      avant. La couleur est celle du nombre du menu de « Ma
      sélection » (`sombre-texte-doux`) : une seule écriture pour une
      seule chose. */
  compte?: number;
};

/**
 * MENU DÉROULANT « MAISON » (UN SEUL composant partout)
 * -----------------------------------------------------
 * Le même menu déroulant pour toute la recherche et les formulaires
 * (Catégorie d'artisan, Sujet du contact…) : mêmes dimensions,
 * bordures, arrondis, ombre, options (voir `champs-recherche.ts`), et
 * même comportement — à l'ouverture, le contour du champ ET la flèche
 * passent au ROSE ; à la fermeture, retour au gris. Avec `sansBordure`,
 * le champ se pose nu dans un encadré partagé (menu compact des
 * résultats) : `onOuvertureChange` prévient le parent pour qu'il
 * colore l'encadré. Fermeture au clic à l'extérieur ou par Échap.
 *
 * `feuilleMobile` : sur SMARTPHONE (< 768 px), la liste s'ouvre en
 * FEUILLE GLISSANTE depuis le bas (style Airbnb / Uber) — barre de
 * glissement, titre en gras, options NUES (§3 nº 525 : leur puce
 * ronde est partie ; seules la PORTE de famille et un SOUS-TITRE
 * gardent la leur, rose),
 * fermeture au tap sur le fond, au glissement vers le bas ou au tap
 * d'une option. Sur iPad / web (≥ 768 px) : le menu déroulant
 * classique. Le contour rose du champ reste actif (le fond de la
 * feuille est semi-transparent : le champ reste visible).
 *
 * MÊMES SECTIONS PARTOUT (smartphone, tablette, web) : les EN-TÊTES
 * DE SECTION (`groupe` des options) s'affichent dans les DEUX
 * habillages — en ROSE, en gras, non cliquables. Un seul composant,
 * donc aucune divergence possible entre les formats.
 *
 * Le TITRE (`titreFeuille`), lui, n'apparaît QUE sur la feuille
 * smartphone : elle monte du bas et recouvre le champ. Sur les grands
 * formats, le menu s'ouvre juste sous le champ, resté visible — un
 * titre y serait redondant.
 *
 * Le menu déroulant ne SORT JAMAIS de la fenêtre : sa hauteur est
 * plafonnée à la place disponible (mesurée à l'ouverture) et il
 * s'ouvre vers le HAUT si le bas est trop juste. Au-delà, il défile
 * sur lui-même — la page ne défile jamais à sa place.
 */
/**
 * §4 (nº 303) — LA ROBE D'UN CHAMP SOMBRE, ÉCRITE UNE SEULE FOIS.
 * ==================================================================
 * Le champ de STYLE du moteur est ce menu ; le champ de LOCALITÉ est
 * un autre composant (`ChampLocalisation`). Au doigt, le propriétaire
 * les veut identiques — « au pixel et à la valeur près ». Deux chaînes
 * recopiées dans deux fichiers finissent toujours par diverger : la
 * robe est donc DÉCLARÉE ICI, et le champ de localité la CONSOMME.
 * Un jour où l'on changera l'arrondi, les deux suivront ensemble, sans
 * qu'on ait à y penser.
 */
export const ROBE_CHAMP_SOMBRE = {
  /** §3 (nº 449) — L'arrondi descend de 16 à 12 px (`rounded-xl`) :
      un rayon un cran au-dessus de celui des badges (8 px depuis la
      même passe), pour un ensemble homogène — champs plus grands,
      rayon un peu plus grand. */
  rayon: "rounded-xl",
  /** §1 (nº 449) — Le fond au repos prend LA COULEUR DES BADGES
      ACTIVÉS (`bg-sombre-eleve-clair`, le jeton exact de
      `robeDuBadge` actif — BadgesCharte) : sur la page mobile, les
      champs du style et de la localité, la piste du rayon et les
      badges allumés se disent dans la même couleur. Repos et ouvert
      valent désormais le même fond — le menu ouvert se dit par sa
      liste, plus par une teinte. */
  repos: "bg-sombre-eleve-clair",
  /** Le fond quand le champ est ouvert (menu) ou actif (saisie) : un
      cran plus clair, la règle de la charte en sombre (nº 141-2B). */
  actif: "bg-sombre-eleve-clair",
  /** Le même, en variante de focus — ÉCRIT EN TOUTES LETTRES parce que
      Tailwind lit des chaînes littérales : `focus:${…}` fabriqué à
      l'exécution ne produirait aucune règle. */
  actifAuFocus: "focus:bg-sombre-eleve-clair",
} as const;

export function MenuDeroulant({
  valeur,
  surChangement,
  options,
  ariaLabel,
  placeholder,
  hauteur = "min-h-[50px]",
  taillePolice = "text-base",
  sansBordure = false,
  onOuvertureChange,
  feuilleMobile = false,
  titreFeuille,
  compact = false,
  sombre = false,
  fondRepos,
  fondActif,
  repliable = false,
  libelleValeur,
  positionFleche,
  champMobile,
  iconeTitreFeuille,
  enErreur,
  arrondi,
  familleSoulignee = false,
  avecVoile = false,
  commandeOuverture = 0,
  feuilleDecollee = false,
  panneauCaleSurAncre = false,
  opaque = false,
  entetesCollants = false,
  verrouilleLaPage = false,
}: {
  valeur: string;
  surChangement: (valeur: string) => void;
  options: OptionMenu[];
  /**
   * ██ §1 (nº 571) — LES EN-TÊTES DE SECTION RESTENT EN HAUT ██
   * ------------------------------------------------------------------
   * LE DÉFAUT : le menu des styles a deux sections — « Réalisations » et
   * « Flash ». Déplier l'une allonge la liste de ses styles, et l'autre
   * en-tête part loin en bas ; on ne sait plus dans laquelle on se
   * trouve, et repasser à l'autre demande de tout redéfiler.
   *
   * CE QUE FAIT LE DRAPEAU : les deux en-têtes deviennent COLLANTS
   * (`sticky`) dans la zone qui défile déjà — le comportement ordinaire
   * d'une longue liste à sections. RIEN N'EST RÉORDONNÉ.
   *
   * ⚠️ IL FAUT SORTIR L'EN-TÊTE DE SON `<li>`, et c'est la seule raison
   * pour laquelle ce drapeau existe au lieu de trois classes. Un élément
   * collant ne peut pas dépasser LA BOÎTE DE SON PARENT : tant que
   * l'en-tête vit dans le `<li>` de la première option de sa section, il
   * ne « colle » que le temps où cette unique option est à l'écran,
   * c'est-à-dire jamais utilement. Il lui faut être L'ENFANT DIRECT de
   * la liste qui défile.
   * ⚠️ SANS LE DRAPEAU, PAS UN NŒUD NE CHANGE : ce menu est partagé par
   * le formulaire de fiche et les sélecteurs de la page tactile. Aucun
   * d'eux n'a demandé quoi que ce soit, et la structure qu'ils rendent
   * reste celle d'avant, à l'élément près.
   * ⚠️ DEUX APPELANTS LE PASSENT (nº 575) : le menu des styles du moteur
   * (nº 571) et les deux menus de « Ma sélection » — favoris et
   * portfolios. Il ne suffit pas à lui seul : voir `blocEntetes` plus
   * bas, qui exige aussi de VRAIES portes.
   * ⚠️ LA FEUILLE GLISSANTE (`feuilleMobile`) NE LE LIT PAS : elle a sa
   * propre écriture plus bas, et le propriétaire a précisé que le
   * smartphone, qui sépare Flash et Réalisations en va-et-vient, n'a pas
   * ce défaut.
   */
  entetesCollants?: boolean;
  /**
   * ██ §3 (nº 573) — LA PAGE NE DÉFILE PLUS DERRIÈRE CE MENU ██
   * ------------------------------------------------------------------
   * Le panneau classique est un MENU ANCRÉ, et la règle de la maison
   * (nº 469) veut qu'un menu ancré ne verrouille pas — c'est une fenêtre
   * centrée à voile qui verrouille. CELUI-CI PORTE UN VOILE (nº 293) :
   * il assombrit toute la page, et la page continuait de défiler
   * dessous. Le propriétaire l'a fait retirer.
   * ⚠️ LE VERROU EST CELUI DE LA MAISON, COMPTÉ (`lib/verrou-defilement`,
   * nº 469, même emploi qu'à la nº 560) : le corps ne redéfile qu'au
   * DERNIER retrait, donc une autre surface ouverte en même temps ne se
   * débloque pas à tort. Et il ne fait pas sauter la page : `globals.css`
   * cache toutes les barres de défilement, `overflow: hidden` ne reprend
   * donc aucune largeur.
   * ⚠️ SUR DEMANDE, ET LE WEB SEUL LE DEMANDE. Ce panneau sert aussi le
   * menu des styles AU DOIGT, où la page de recherche a besoin que le
   * document défile (la remontée du champ). Sans ce réglage, rien ne
   * change nulle part.
   */
  verrouilleLaPage?: boolean;
  ariaLabel: string;
  placeholder?: string;
  hauteur?: string;
  taillePolice?: string;
  sansBordure?: boolean;
  onOuvertureChange?: (ouvert: boolean) => void | Promise<void>;
  feuilleMobile?: boolean;
  /** LES EN-TÊTES DE SECTION DEVIENNENT DES PORTES (passe nº 110).
      Le menu s'ouvre alors sur les seuls titres de groupe ; en toucher
      un déplie SES options et referme l'autre. C'est ce qui permet au
      menu « Explorer » de poser sa vraie première question —
      tatouages ou flashs ? — au lieu d'aligner soixante-deux lignes.
      Faux (le cas de tous les autres menus) : rien ne change, les
      en-têtes restent de simples étiquettes non cliquables. */
  repliable?: boolean;
  /** CE QUE LE CHAMP REFERMÉ AFFICHE, quand ce n'est pas le libellé
      de l'option choisie (passe nº 110).
      ⚠️ LE MENU « EXPLORER » EN A BESOIN : ses options s'appellent
      « Réalisme » dans les deux catégories, et un champ refermé sur
      « Réalisme » ne dirait plus si l'on cherche des tatouages ou des
      flashs. Il affiche donc « Flashs · Réalisme ». La LISTE, elle,
      garde ses libellés courts — la catégorie est déjà écrite en
      titre au-dessus, la répéter trente et une fois serait du bruit. */
  libelleValeur?: string;
  /** §5 (nº 258) — OÙ LA FLÈCHE SE POSE, quand le champ vit dans une
      capsule dont la courbe mange le bord (l'encadré de « Ma
      sélection ») : la position par défaut reste celle de toujours,
      l'appelant peut donner plus d'air. Une position CSS
      (`background-position`), rien d'autre. */
  positionFleche?: string;
  /** Titre principal EN GRAS, affiché en tête de la liste — dans la
      feuille mobile ET dans le menu déroulant (structure identique sur
      tous les formats). */
  titreFeuille?: string;
  /** §3 (nº 262) — CE QUE LE CHAMP AFFICHE SUR SMARTPHONE, à la place
      du libellé : le champ de « Ma sélection » y dit « Filtrer » avec
      l'icône de filtre, et LA FLÈCHE DISPARAÎT avec le libellé — c'est
      l'icône, grise, qui dit « ceci ouvre ». La borne est CELLE DE LA
      FEUILLE (même chaîne que le gel, au centième près) : le contenu
      change exactement là où ce qui s'ouvre change. Sur le web et
      l'iPad, rien : libellé et chevron comme partout. */
  champMobile?: React.ReactNode;
  /** §3 (nº 262) — L'ICÔNE À GAUCHE DU TITRE DE LA FEUILLE : la même
      écriture d'icône que dans le champ, à la couleur du titre. Le
      gris dans la barre dit « ceci ouvre », ici elle dit « tu y es ». */
  iconeTitreFeuille?: React.ReactNode;
  /** Padding resserré (moteur des résultats) : gagne ~16 px de largeur
      utile pour le libellé, sans changer la hauteur ni la flèche. */
  compact?: boolean;
  /** Habillage SOMBRE (index des tatoueurs) : mêmes comportements,
      seules les couleurs changent. Les pages artisans ne passent
      jamais cette option. */
  sombre?: boolean;
  /**
   * ██ §2 (nº 552) — LE PANNEAU SANS VERRE, SUR DEMANDE ██
   * ------------------------------------------------------------------
   * LE DÉFAUT RELEVÉ : les menus déroulants du formulaire de fiche
   * sont trop sombres UNE FOIS OUVERTS. Ce n'est pas une impression —
   * c'est mesurable. `data-verre-menu` vaut `rgba(11,15,20,0.45)` sur
   * un `blur(60px) saturate(200%)` ; posé sur le fond de page
   * (#0B0F14, uniforme sous un menu), il compose EXACTEMENT
   * rgb(9,15,23) — contraste 1,00 avec la page. Le panneau n'est pas
   * « un peu sombre » : il EST le fond de la page, et seul son liseré
   * le distingue. Posé sur une carte (#1A1F26) il tombe à
   * rgb(17,24,34), soit PLUS SOMBRE que la carte qui le porte (1,08 à
   * l'envers). Un menu ouvert doit se poser AU-DESSUS de ce qu'il
   * recouvre, pas en dessous.
   * CE QUE FAIT CE DRAPEAU : l'attribut de verre n'est pas posé, et un
   * aplat le remplace. C'est le MÊME drapeau, du même nom, que
   * `MenuDeVerre` (nº 537) et `FenetreDeVerre` (nº 543) portent déjà :
   * aucun mécanisme neuf, aucune couleur inventée, `globals.css`
   * intouché (règle nº 172).
   *
   * ██ §1 (nº 553) — L'APLAT MONTE DE `carte` À `eleve` ██
   * ------------------------------------------------------------------
   * LA nº 552 AVAIT POSÉ `carte` (#1A1F26), et ça n'a pas suffi : ces
   * menus s'ouvrent DANS le formulaire, dont les encadrés sont
   * EXACTEMENT à `carte` (`FormulaireFiche`). Le panneau se confondait
   * donc avec ce qui le porte — contraste 1,00 — et restait invisible
   * là où il compte. Le défaut avait juste changé de voisin : la page
   * hier, l'encadré aujourd'hui.
   * LE JETON EST DÉSORMAIS `eleve` (#262C34), celui des ENCADRÉS du
   * site : un panneau qui flotte au-dessus d'une surface doit paraître
   * PLUS HAUT qu'elle. Mesuré : 1,18 avec l'encadré du formulaire,
   * 1,37 avec la page quand il déborde. Il n'existe pas de cran
   * au-dessus qui reste sous le plafond — `eleve` EST le plafond.
   * ⚠️ LES FENÊTRES DU SITE (nº 542-544) NE SUIVENT PAS : elles
   * restent à `carte`. Une fenêtre se pose sur la page ; un menu se
   * pose sur une fenêtre. Deux rangs, deux jetons.
   * ⚠️ POURQUOI UN DRAPEAU PLUTÔT QUE CHANGER L'ÉCRITURE. C'est
   * exactement le raisonnement de `fondRepos` (nº 388) juste dessous :
   * ce panneau est PARTAGÉ par cinq appelants — les deux menus du
   * formulaire, les deux du moteur de recherche et celui de « Ma
   * sélection ». Le moteur n'a rien demandé. Sans réglage, rien ne
   * bouge : il garde son verre au pixel.
   * ⚠️ IL COUVRE LES DEUX HABILLAGES d'un seul coup — le panneau
   * classique (web, iPad) et la feuille glissante (smartphone) : deux
   * écritures dans ce fichier, une seule question posée à l'appelant.
   * ⚠️ SANS EFFET SANS `sombre` : les menus clairs du produit artisans
   * gardent `bg-fond`, ils n'ont jamais eu de verre.
   */
  opaque?: boolean;
  /**
   * §1 (nº 388) — LE FOND AU REPOS, RÉGLABLE PAR L'APPELANT.
   * ------------------------------------------------------------------
   * La palette sombre pose `bg-sombre-eleve`. Sur le formulaire de
   * fiche, le menu du booking se retrouvait ainsi un cran plus sombre
   * que les champs qui l'entourent (`bg-sombre-eleve-clair`) — c'est
   * le défaut relevé. Mais cette palette est PARTAGÉE avec le moteur
   * de recherche, qui n'a rien demandé : on ne la change donc pas, on
   * laisse l'appelant dire son fond. Sans réglage, rien ne bouge —
   * le moteur garde le sien au pixel.
   */
  fondRepos?: string;
  /**
   * §3 (nº 407) — LE FOND À L'OUVERTURE, RÉGLABLE LUI AUSSI.
   * ------------------------------------------------------------------
   * MÊME MÉTHODE QUE `fondRepos` CI-DESSUS, ET POUR LA MÊME RAISON —
   * cette palette est PARTAGÉE avec le moteur de recherche, qui n'a
   * rien demandé. Sans réglage, rien ne bouge : le moteur garde son
   * `ROBE_CHAMP_SOMBRE.actif` au pixel.
   * CE QUE ÇA RÉPARE : la nº 388 avait posé `fondRepos` à
   * `bg-sombre-eleve-clair` sur le formulaire, pour que le menu du
   * booking soit au niveau des champs qui l'entourent. Mais l'état
   * OUVERT vaut lui aussi `bg-sombre-eleve-clair` — le menu ne
   * changeait donc PLUS DU TOUT au clic, là où tous les champs voisins
   * s'éclaircissent d'un cran (`focus:bg-sombre-haut`). Le formulaire
   * dit désormais ses DEUX fonds, et retrouve le cran manquant.
   */
  fondActif?: string;
  /** §2 (nº 270) — LE MENU PEUT ÊTRE EN FAUTE, comme un champ : le
      formulaire de fiche exige le Booking, et un manque s'y dit par
      un bord rouge — la même écriture que tous ses champs
      (`border-erreur` / `border-transparent`). ⚠️ LES CLASSES DE
      BORD NE SONT POSÉES QUE SI LA PROP EST FOURNIE : les menus qui
      ne la passent pas gardent leur boîte au pixel près. */
  enErreur?: boolean;
  /** §2 (nº 270) — L'ARRONDI DU CHAMP, quand le menu vit au milieu
      de champs de formulaire (`rounded-xl` chez eux) : sans rien,
      le `rounded-2xl` historique des menus. */
  arrondi?: string;
  /**
   * §2 (nº 290) — LA PORTE DE FAMILLE PORTE UN SOULIGNEMENT ROSE.
   * ------------------------------------------------------------------
   * « Cultures du monde » occupe la place d'un style dans la liste
   * alphabétique et lui ressemble en tout : rien ne disait, au repos,
   * qu'elle OUVRE au lieu de se choisir. Un trait fin rose sous ses
   * seuls mots le dit.
   * ⚠️ SUR DEMANDE, ET NULLE PART AILLEURS. Deux appelants seulement
   * le passent — le moteur de recherche principal (son panneau est le
   * même au doigt et au web) et les deux menus de « Ma sélection ».
   * Le formulaire de fiche, le formulaire de contact et le menu métier
   * du produit artisans ne le passent pas : ils ne changent pas.
   * ⚠️ §4 (nº 525) — ET DÉSORMAIS SUR LA FEUILLE GLISSANTE AUSSI
   * (`feuilleMobile`, la présentation smartphone de « Ma sélection » :
   * elle monte du bas). La nº 290 avait réservé le trait au panneau
   * classique ; le propriétaire le veut aux deux appareils, à
   * l'identique. Le drapeau commande donc les deux présentations —
   * mais TOUJOURS SUR DEMANDE : qui ne le passe pas ne voit rien
   * changer.
   */
  familleSoulignee?: boolean;
  /**
   * §2 (nº 293) — LA PAGE S'ASSOMBRIT DERRIÈRE CE MENU (web).
   * ⚠️ SUR DEMANDE, comme le trait rose de la nº 291 : seuls le menu
   * des styles du moteur principal et les deux menus de « Ma
   * sélection » le passent. Le formulaire de fiche, le formulaire de
   * contact et le menu métier des artisans ne l'ont pas demandé.
   */
  avecVoile?: boolean;
  /**
   * §2 (nº 460) — L'OUVERTURE COMMANDÉE DE L'EXTÉRIEUR : un COMPTEUR.
   * Chaque incrément (> 0) OUVRE le menu — le va-et-vient mobile de
   * « Ma sélection » s'en sert : son côté déjà choisi, appuyé une
   * seconde fois, ouvre la feuille de filtres alors que le champ
   * déclencheur du menu n'est pas affiché. Rien d'autre ne change :
   * la fermeture, le choix et le clic dehors restent les siens.
   */
  commandeOuverture?: number;
  /**
   * §2 (nº 462) — LE PANNEAU DU WEB SE CALE SUR L'ANCRE, NI PLUS NI
   * MOINS : largeur = celle du bouton mesuré (la branche `width` de
   * `stylePanneau`), au lieu du régime « au contenu » (minWidth +
   * max-content). « Ma sélection » le passe : son ancre fantôme fait
   * la largeur de l'ONGLET ACTIF, et le déroulant ne doit pas la
   * dépasser. Les autres déroulants ne passent rien et gardent leur
   * largeur actuelle.
   */
  panneauCaleSurAncre?: boolean;
  /**
   * §4 (nº 460) — LA FEUILLE DÉCOLLÉE DES BORDS : l'encadré de la
   * feuille du bas prend la marge latérale de l'interface (16 px, le
   * `px-4` des pages) au lieu de toucher les bords de l'écran. Sur
   * demande — seule « Ma sélection » le passe ; hauteur, contenu et
   * animation ne changent pas.
   */
  feuilleDecollee?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const conteneur = useRef<HTMLDivElement>(null);
  /*  §2 (nº 460) — L'OUVERTURE COMMANDÉE, ajustée PENDANT LE RENDU
      (le motif officiel de React, celui de `ouvertureConnue` plus
      bas) : chaque incrément du compteur ouvre le menu — jamais un
      effet, jamais un rendu intermédiaire fermé. */
  const [commandeVue, setCommandeVue] = useState(commandeOuverture);
  if (commandeOuverture !== commandeVue) {
    setCommandeVue(commandeOuverture);
    if (commandeOuverture > 0 && !ouvert) setOuvert(true);
  }
  /**
   * §2 (nº 253) — LA PLAQUE DE LA FEUILLE, NOMMÉE.
   * ------------------------------------------------------------------
   * LA CAUSE DU DÉFAUT, ET ELLE EST DANS LE CODE DE LA nº 251 : la
   * fermeture au clic extérieur (plus bas) excuse DEUX zones — le
   * conteneur du champ, et le panneau du menu déroulant. Tant que la
   * feuille vivait DANS le flux, elle était à l'intérieur du
   * conteneur : elle était donc excusée sans qu'on ait à le dire.
   * La nº 251 l'a montée dans un PORTAIL sur le corps du document —
   * `conteneur.contains(cible)` est devenu FAUX pour tout ce qu'elle
   * contient, et le moindre appui à l'intérieur fermait le menu.
   * POURQUOI LES OPTIONS SEMBLAIENT MARCHER : une option choisit dès
   * l'appui (`onPointerDown`) et referme dans la foulée — la fermeture
   * parasite ne changeait rien. Une PORTE, elle, ne fait que basculer :
   * l'état s'ouvrait, puis le menu se fermait sous elle. Vu de
   * l'écran : « appuyer sur Réalisations n'ouvre rien du tout ».
   * C'est exactement la leçon de la nº 238-§3 (une fermeture au clic
   * dehors doit connaître TOUTES les surfaces montées en portail),
   * qu'il fallait rejouer ici.
   */
  /*  ██ §2 (nº 464) — LA REF COUVRE LE PORTAIL ENTIER, VOILE COMPRIS ██
      Elle vivait sur la seule PLAQUE de la feuille : le VOILE, sa sœur,
      n'était couvert par aucune des gardes de `surClic` — la leçon
      nº 238-§3 ci-dessus (« connaître TOUTES les surfaces montées en
      portail ») s'appliquait à lui aussi, et c'est la moitié du tap qui
      traversait (l'autre : le `onPointerDown` du voile lui-même — voir
      la feuille, tout en bas). La ref remonte sur la RACINE du portail
      (`fixed inset-0`) : plaque ET voile sont excusés d'un coup, et la
      fermeture de la feuille n'appartient plus qu'à ses propres
      chemins — le voile (au `click`), le glissement, Échap, le retour,
      un choix. */
  const racineFeuille = useRef<HTMLDivElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  /**
   * §3 (nº 262) — SOMMES-NOUS SUR SMARTPHONE ? Seul le champ qui reçoit
   * `champMobile` en a besoin : en deçà de la borne, il affiche ce
   * contenu-là (sans flèche) ; au-delà, le libellé et le chevron de
   * toujours. LA BORNE EST CELLE DE LA FEUILLE — la même chaîne que le
   * gel du corps, au centième près : on ne pose pas un second point de
   * rupture, le champ change exactement là où ce qui s'ouvre change.
   * Le premier rendu (celui du serveur) prend le libellé, l'effet
   * corrige après l'hydratation — le précédent est celui du libellé
   * raccourci de « Ma sélection » (nº 255).
   */
  const [surSmartphone, setSurSmartphone] = useState(false);
  useEffect(() => {
    const borne = window.matchMedia("(max-width: 767.98px)");
    const lire = () => setSurSmartphone(borne.matches);
    lire();
    borne.addEventListener("change", lire);
    return () => borne.removeEventListener("change", lire);
  }, []);
  const champEnModeMobile = Boolean(champMobile) && surSmartphone;
  // Hauteur maximale du menu et sens d'ouverture : le calcul est
  // PARTAGÉ avec la liste des villes (usePlacementMenu), pour que les
  // deux menus du moteur se comportent exactement pareil.
  const { hauteurMax, ouvreVersLeHaut, cadre } = usePlacementMenu(
    ouvert,
    bouton
  );
  /** Le panneau vit DANS <body> : le clic extérieur doit donc
      l'épargner explicitement, sinon choisir une option refermerait
      le menu avant que le clic n'arrive. */
  const panneau = useRef<HTMLDivElement>(null);

  //  ⚠️ EN SOMBRE, LE CHAMP SUIT LA CHARTE (nº 141-2B) : ni contour,
  //  ni halo — OUVERT, LE FOND S'ÉCLAIRCIT D'UN CRAN, c'est tout. Le
  //  liseré rose à l'ouverture (border-primaire + ring) se lisait
  //  comme un encadrement d'alerte. Le mode CLAIR (produit artisans)
  //  garde son habillage historique.
  //  §2 (nº 270) — l'arrondi se règle (formulaire de fiche :
  //  `rounded-xl`, comme ses champs) ; et le bord rouge d'un manque
  //  n'existe QUE pour les appelants qui passent `enErreur` — les
  //  autres menus ne reçoivent aucune classe de bord en plus.
  const rayon = arrondi ?? ROBE_CHAMP_SOMBRE.rayon;
  const bordDuManque =
    enErreur === undefined
      ? ""
      : enErreur
        ? " border border-erreur"
        : " border border-transparent";
  const habillage = sansBordure
    ? "bg-transparent"
    : sombre
      ? `${rayon} transition-colors ${
          ouvert
            ? //  §3 (nº 407) — le fond à l'ouverture, dit par l'appelant
              //  quand il en a un ; sinon celui de la palette, inchangé.
              (fondActif ?? ROBE_CHAMP_SOMBRE.actif)
            : //  §1 (nº 388) — le fond au repos, dit par l'appelant quand
              //  il en a un ; sinon celui de la palette, inchangé.
              (fondRepos ?? ROBE_CHAMP_SOMBRE.repos)
        }${bordDuManque}`
      : `${rayon} border bg-fond ${
          ouvert
            ? "border-primaire ring-2 ring-primaire/25"
            : enErreur
              ? "border-erreur"
              : "border-bordure-champ"
        }`;

  const libelleChoisi =
    libelleValeur || options.find((o) => o.value === valeur)?.label;

  /**
   * ON NE PRÉVIENT LE PARENT QUE SUR UN VRAI CHANGEMENT.
   * ⚠️ La fonction reçue est recréée à chaque rendu du parent. La
   * mettre en dépendance, c'était rejouer l'effet à CHAQUE rendu et
   * REPUBLIER « fermé » alors que rien n'avait bougé. Tant que
   * personne n'écoutait la fermeture, cela ne se voyait pas ; le jour
   * où la fenêtre du moteur s'est mise à redescendre quand le menu se
   * referme, elle repartait vers le bas à chaque rendu — y compris à
   * l'instant précis où l'on touchait la localité pour la faire
   * monter. La fonction se lit donc dans une référence, et l'effet ne
   * dépend plus que de l'état d'ouverture.
   */
  /** Vrai quand la liste est réellement à l'écran — elle n'apparaît
      qu'une fois la remontée du parent TERMINÉE (nº 195-§2). */
  const [listeVisible, setListeVisible] = useState(false);
  //  §2 (nº 293), §3 (nº 294) — le voile suit l'ouverture, et le BLOC
  //  qui contient ce menu reste clair : on donne notre conteneur, le
  //  crochet remonte tout seul à l'encadré qui l'entoure.
  useVoileDeLaPage(avecVoile && listeVisible, conteneur);
  /*  §3 (nº 573) — ET LA PAGE NE DÉFILE PLUS DERRIÈRE. Même forme
      qu'à la nº 560 : on pose à l'ouverture, le nettoyage retire —
      quel que soit le chemin de fermeture, y compris un démontage. */
  useEffect(() => {
    if (!verrouilleLaPage || !listeVisible) return;
    /*  §1 (nº 576) — ET SEULEMENT QUAND C'EST LE PANNEAU CLASSIQUE QU'ON
        VOIT. Quand l'appelant a une FEUILLE (`feuilleMobile`), les deux
        habillages sont montés et c'est une borne de largeur qui décide
        lequel s'affiche : le panneau est caché sous 768 px (`hidden
        md:flex`), la feuille au-dessus. Sous cette borne, la feuille est
        déjà gelée par `gelerLeCorps` — poser un second verrou par-dessus
        opposerait deux mécaniques sur le même corps. C'est la question
        que se pose déjà le gel de la feuille, juste plus bas, dans les
        mêmes mots et à la même borne.
        ⚠️ SANS FEUILLE (le menu des styles du moteur), il n'y a rien à
        départager : le panneau classique est le seul habillage, à toutes
        les largeurs. Rien ne change pour lui. */
    if (feuilleMobile && !window.matchMedia("(min-width: 768px)").matches) {
      return;
    }
    poserLeVerrouDeDefilement();
    return retirerLeVerrouDeDefilement;
  }, [verrouilleLaPage, listeVisible, feuilleMobile]);
  //  À LA FERMETURE, la liste disparaît sur-le-champ — ajusté pendant
  //  le rendu (le motif React officiel), jamais dans un effet.
  if (!ouvert && listeVisible) setListeVisible(false);
  const prevenirOuverture = useRef(onOuvertureChange);
  useEffect(() => {
    prevenirOuverture.current = onOuvertureChange;
  }, [onOuvertureChange]);
  /**
   * §3 (nº 259) — LA PAGE NE DÉFILE PLUS DERRIÈRE LA FEUILLE OUVERTE.
   * ------------------------------------------------------------------
   * Le défaut : feuille ouverte, un doigt qui parcourt la liste faisait
   * défiler LA PAGE derrière — l'interface paraissait cassée, et l'on
   * revenait ailleurs en refermant.
   * ⚠️ LE GEL N'EST PAS ÉCRIT ICI : c'est celui de la fenêtre de fiche
   * (nº 226-§5), EXTRAIT à cette passe (lib/gel-du-corps) et partagé —
   * même compte (la première surface gèle, la dernière dégèle), même
   * restitution de la position. Une feuille ouverte par-dessus une
   * fenêtre ne peut donc pas dégeler la page en se refermant.
   * ⚠️ LA FEUILLE SEULE (`feuilleMobile`) : le panneau du web ne
   * recouvre pas la page et ne gèle rien.
   * Le défilement INTERNE, lui, reste vivant — et il ne se propage pas
   * à la page en bout de liste (`overscroll-contain` sur la liste).
   */
  /** §3 (nº 330) — VRAI TANT QUE LA FEUILLE COUVRE VRAIMENT L'ÉCRAN.
      Le gel s'en servait déjà sans le nommer ; l'étape d'historique en
      a besoin AU RENDU, et pas seulement dans un effet — d'où l'état.
      Sur le web (panneau sous le champ) il reste faux : le panneau ne
      recouvre pas la page, il ne gèle rien et ne pose rien. */
  const [feuilleALEcran, setFeuilleALEcran] = useState(false);
  useEffect(() => {
    if (!feuilleMobile || !listeVisible) return;
    //  La feuille ne vit qu'au doigt (`md:hidden`) : au-dessus de cette
    //  borne, rien n'est monté à l'écran — donc rien à geler.
    if (!window.matchMedia("(max-width: 767.98px)").matches) return;
    return gelerLeCorps();
  }, [feuilleMobile, listeVisible]);
  /*  La MÊME question, posée pour l'historique — et posée dans une
      image, jamais dans le corps de l'effet : c'est le motif de
      `useAppareilMobile`, celui que React recommande pour lire le
      document sans enchaîner les rendus. */
  useEffect(() => {
    const ouvertePourDeVrai = feuilleMobile && listeVisible;
    const image = requestAnimationFrame(() => {
      setFeuilleALEcran(
        ouvertePourDeVrai &&
          window.matchMedia("(max-width: 767.98px)").matches
      );
    });
    return () => cancelAnimationFrame(image);
  }, [feuilleMobile, listeVisible]);
  /**
   * §3 (nº 330) — LE RETOUR DU TÉLÉPHONE REFERME LA FEUILLE.
   * ------------------------------------------------------------------
   * C'est la première des quatre surfaces du C-4 (inventaire nº 327),
   * et le point 1 de la règle de navigation : une surface qui couvre
   * l'écran pose une entrée d'historique, et le retour la referme —
   * au lieu de QUITTER la page, ce qu'il faisait jusqu'ici.
   * ⚠️ L'ÉCRITURE EST UNIQUE (lib/etape-refermable), partagée par les
   * quatre surfaces. C'est elle aussi qui préserve l'adresse écrite
   * pendant l'ouverture — le filtre de « Ma sélection » s'écrit par
   * `replaceState` SUR l'étape de la feuille, et serait perdu sans
   * cela.
   * ⚠️ LE GEL N'EST PAS CONCERNÉ : il reste posé et repris par l'effet
   * ci-dessus, une fois et une seule, quel que soit le chemin de
   * fermeture (le retour, la croix, un choix, le glissement).
   */
  useEtapeQuiSeReferme(feuilleALEcran, () => fermer());
  /**
   * LA REMONTÉE D'ABORD, LE MENU ENSUITE — UN ENCHAÎNEMENT, PAS UNE
   * SURVEILLANCE (nº 195-§2)
   * ==================================================================
   * LE CONSTAT : le menu s'ouvrait pendant que le champ remontait.
   * L'attente de la nº 194 (« deux images sans mouvement ») ne suffisait
   * pas — le défilement doux d'iOS ne commence pas à la première image,
   * et la page paraissait immobile alors qu'elle n'avait pas encore
   * bougé.
   * ON N'OBSERVE DONC PLUS RIEN : on PRÉVIENT le parent, et c'est LUI
   * qui dit quand il a fini (il rend une promesse). La liste n'apparaît
   * qu'après. Les menus dont le parent ne remonte rien s'ouvrent au
   * tour suivant, c'est-à-dire tout de suite.
   */
  useEffect(() => {
    if (!ouvert) {
      prevenirOuverture.current?.(false);
      return;
    }
    let vivant = true;
    void Promise.resolve(prevenirOuverture.current?.(true)).then(() => {
      if (vivant) setListeVisible(true);
    });
    return () => {
      vivant = false;
    };
  }, [ouvert]);

  /**
   * LA LISTE NE S'AFFICHE QU'UNE FOIS LA PAGE IMMOBILE (nº 194-§3)
   * ==================================================================
   * LE CONSTAT : sur la page de recherche du smartphone, toucher
   * « style » ouvrait le menu PENDANT que le champ remontait. Deux
   * mouvements en même temps, illisibles.
   * L'ordre est donc : on prévient le parent (il fait remonter le
   * champ — voir `onOuvertureChange`), on attend que le défilement se
   * soit arrêté, ET SEULEMENT ENSUITE la liste apparaît. Quand rien ne
   * remonte — tous les autres menus du site — l'attente dure deux
   * images et ne se voit pas.
   */
  // Fermeture au clic extérieur / Échap : SEULEMENT pour le menu
  // déroulant classique (la feuille mobile a son propre fond noir).
  useEffect(() => {
    if (!ouvert) return;
    const surClic = (evenement: PointerEvent) => {
      const cible = evenement.target as Node;
      if (conteneur.current?.contains(cible)) return;
      if (panneau.current?.contains(cible)) return;
      //  §2 (nº 253) — ET LA FEUILLE, montée en portail depuis la
      //  nº 251 : sans cette ligne, ses portes s'ouvraient puis le
      //  menu se fermait sous elles.
      //  ██ §2 (nº 464) — LE VOILE AUSSI : la garde ne couvrait que la
      //  PLAQUE (`feuille`), et le voile — sa SŒUR dans le portail —
      //  restait un « dehors » : un tap dessus fermait ICI, au
      //  `pointerdown`, et le `click` du même tap partait sur la page.
      //  La ref couvre désormais la RACINE du portail (voile + plaque) :
      //  cet écouteur ne tire plus jamais sur la feuille — au doigt,
      //  c'est le voile qui ferme, au `click` (voir la feuille). Le
      //  panneau WEB, lui, garde ce chemin tel quel.
      if (racineFeuille.current?.contains(cible)) return;
      setOuvert(false);
    };
    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") setOuvert(false);
    };
    document.addEventListener("pointerdown", surClic);
    document.addEventListener("keydown", surTouche);
    return () => {
      document.removeEventListener("pointerdown", surClic);
      document.removeEventListener("keydown", surTouche);
    };
  }, [ouvert]);

  // Glissement vers le bas pour fermer la feuille.
  const [dragY, setDragY] = useState(0);
  const [enGlissement, setEnGlissement] = useState(false);
  const depart = useRef<number | null>(null);
  const departSurLaBande = useRef(false);
  /**
   * §2 (nº 261) — LA FEUILLE ENTIÈRE ÉCOUTE LE GLISSEMENT, ET LA LISTE
   * ARBITRE.
   * ------------------------------------------------------------------
   * LE RELEVÉ : pour refermer la feuille il fallait viser la petite
   * barre du haut, et l'on s'y reprenait à plusieurs fois. Désormais :
   *  · TOUTE LA BANDE HAUTE (la barre de glissement ET le titre) est
   *    préhensible — plus de 44 px, la cible minimale d'un pouce ;
   *  · et quand la liste est DÉJÀ EN HAUT de son défilement, un
   *    glissement vers le bas N'IMPORTE OÙ dans la feuille la referme —
   *    le comportement des feuilles natives ;
   *  · quand elle n'est PAS en haut, le geste défile la liste, il ne
   *    referme rien : la condition se lit au DÉPART du geste ET au
   *    moment du mouvement (les deux doivent dire « en haut »).
   * Le drag ne s'arme qu'après 6 px vers le bas : un tap sur une option
   * reste un tap. La capture du pointeur n'est prise qu'à l'armement —
   * jamais au départ — pour ne rien voler aux options.
   * ⚠️ RIEN NE CHANGE du gel de la nº 259 : le corps reste gelé par
   * lib/gel-du-corps, la liste garde son `overscroll-contain`, et la
   * position de la page revient au pixel à la fermeture.
   */
  function listeEnHaut() {
    return (listeDeroulante.current?.scrollTop ?? 0) <= 0;
  }
  function glissementDebut(e: React.PointerEvent, bande: boolean) {
    //  Sur la LISTE, le geste n'est candidat que si elle est en haut ;
    //  sur la bande haute, toujours.
    if (!bande && !listeEnHaut()) return;
    depart.current = e.clientY;
    departSurLaBande.current = bande;
  }
  function glissementBouge(e: React.PointerEvent) {
    if (depart.current == null) return;
    const delta = e.clientY - depart.current;
    if (!enGlissement) {
      //  L'ARMEMENT : 6 px vers le bas. Parti de la LISTE, le geste
      //  re-vérifie qu'elle est toujours en haut (elle a pu défiler
      //  entre-temps — le natif garde la main) ; parti de la BANDE,
      //  il s'arme toujours : la bande referme, même liste défilée.
      if (delta < 6) return;
      if (!departSurLaBande.current && !listeEnHaut()) {
        depart.current = null;
        return;
      }
      setEnGlissement(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }
    setDragY(Math.max(0, delta));
  }
  function glissementFin() {
    if (dragY > 70) fermer();
    depart.current = null;
    setEnGlissement(false);
    setDragY(0);
  }

  function fermer() {
    setOuvert(false);
    bouton.current?.blur();
  }

  function choisir(value: string) {
    surChangement(value);
    fermer();
  }

  const listeClassique = feuilleMobile
    ? `${PANNEAU_LISTE_FLOTTANT} hidden md:flex`
    : PANNEAU_LISTE_FLOTTANT;

  // Les options précédées de leur EN-TÊTE DE SECTION (une seule fois,
  // avant la première option du groupe). Calculé UNE FOIS et utilisé
  // par les deux habillages : la structure est donc rigoureusement la
  // même sur smartphone, tablette et web.
  //  ⚠️ LE SOUS-EN-TÊTE SUIT LA MÊME RÈGLE (passe nº 113), avec une
  //  précaution en plus : un changement de GROUPE recommence aussi la
  //  sous-section. Sans ça, une sous-section terminant un groupe et
  //  une autre du même nom ouvrant le suivant seraient lues comme une
  //  seule suite — et la seconde porte ne s'afficherait jamais. C'est
  //  exactement le cas du menu « Explorer », où « Traditionnel
  //  ethnique » existe sous Réalisations ET sous Flashs.
  const optionsAvecEntetes = options.map((option, index) => {
    const precedente = options[index - 1];
    const nouveauGroupe = option.groupe !== precedente?.groupe;
    return {
      option,
      /**
       * §1 (nº 291) — LA CLÉ DE RENDU N'EST PLUS LA VALEUR.
       * ----------------------------------------------------------------
       * Depuis que « Japonais · Irezumi » se lit AUX DEUX ENDROITS, deux
       * entrées d'une même liste portent la même `value` — et deux clés
       * React identiques, c'est un rendu qui se mélange. La clé prend
       * donc aussi la place : groupe, sous-groupe, valeur. Aucune autre
       * conséquence — la clé ne sert qu'au rendu, la `value` reste ce
       * qu'on choisit et ce qu'on compare.
       */
      cle: `${option.groupe ?? ""}▸${option.sousGroupe ?? ""}▸${option.value}`,
      entete: option.groupe && nouveauGroupe ? option.groupe : null,
      sousEntete:
        option.sousGroupe &&
        (nouveauGroupe || option.sousGroupe !== precedente?.sousGroupe)
          ? option.sousGroupe
          : null,
    };
  });

  /**
   * §2 (nº 572) — LES NOMS DES SECTIONS, DANS L'ORDRE, UNE FOIS CHACUN.
   * ------------------------------------------------------------------
   * C'est la MÊME source que les en-têtes rendus dans la liste : le
   * champ `entete` n'est posé que sur la première option d'une section
   * (voir juste au-dessus), donc le filtrer donne exactement la suite
   * des titres, dans leur ordre, sans doublon. AUCUN RÉORDONNANCEMENT :
   * on lit ce que les options disent, on n'en décide rien.
   */
  const entetesDesSections = optionsAvecEntetes
    .map(({ entete }) => entete)
    .filter((entete): entete is string => Boolean(entete));

  /* ----------------------------------------------------------------
     LES CATÉGORIES REPLIABLES (`repliable`)
     ----------------------------------------------------------------
     UN SEUL GROUPE OUVERT À LA FOIS. À l'ouverture du menu, c'est
     celui du choix courant qui est déplié — on retombe donc sur ce
     qu'on avait choisi, sans avoir à le rechercher. Rien de choisi :
     tout est replié, et le menu tient en deux lignes.
     ⚠️ L'ÉTAT SE RECALCULE À CHAQUE OUVERTURE, jamais dans un effet :
     `ouvertureConnue` compare l'état d'ouverture au précédent pendant
     le rendu (le motif que React recommande), ce qui évite un rendu
     perdu et le clignotement qui va avec.
  ---------------------------------------------------------------- */
  /**
   * §1 (nº 291) — UN MÊME STYLE PEUT TENIR DEUX PLACES.
   * ------------------------------------------------------------------
   * « Japonais · Irezumi » se lit à sa lettre ET dans « Cultures du
   * monde » : deux entrées, une seule valeur. On préfère donc CELLE DU
   * PREMIER NIVEAU pour décider quoi déplier — sans quoi le choisir
   * dans la liste alphabétique ouvrirait la famille au rendez-vous
   * suivant, ce que personne n'a demandé. Les styles qui ne vivent QUE
   * dans la famille (Maori, Tribal…) n'ont pas de jumeau : le repli
   * les retrouve, et « on retombe sur son style » tient toujours.
   */
  /*  §1 (nº 317) — RIEN N'EST PRÉ-OUVERT QUAND RIEN N'EST CHOISI, et
      LA RÈGLE N'EST PLUS ÉCRITE ICI : elle vit dans `lib/repli-menu`,
      où un banc peut l'EXÉCUTER. C'est ce qui manquait — le défaut
      corrigé ici a vécu une passe entière parce qu'on ne pouvait que
      relire ce code, jamais le jouer. */
  const { groupe: groupeDuChoix, sousGroupe: sousGroupeDuChoix } =
    replieALOuverture(options, valeur);
  /**
   * §2 (nº 304) — UN SEUL GROUPE N'A PAS DE PORTE.
   * ------------------------------------------------------------------
   * LE CAS, ET C'EST CELUI DES FAVORIS : le menu ne range ses styles en
   * volets (« Réalisation », « Flash ») que parce qu'il y a DEUX
   * natures. Quand le compte n'a que des réalisations, un volet unique
   * « Réalisation » s'affichait quand même — avec sa flèche, et fermé :
   * il fallait l'ouvrir pour voir une liste qui n'avait aucune
   * alternative. Une porte qui ne mène qu'à une pièce n'est pas une
   * porte.
   * LA RÈGLE : le pliage PAR GROUPE ne joue qu'à partir de DEUX
   * groupes. À un seul, l'en-tête redevient une étiquette (pas de
   * flèche, rien à toucher) et ses options sont visibles d'emblée.
   * ⚠️ ELLE NE TOUCHE PAS AUX SOUS-SECTIONS : « Cultures du monde »
   * garde sa porte, elle en est une vraie — onze styles derrière, et
   * d'autres styles à côté.
   * ⚠️ ET ELLE EST GÉNÉRALE, non pas réservée aux favoris : c'est le
   * même composant partout, et « une porte unique n'est pas une
   * porte » vaut partout. Le menu du moteur, lui, a toujours ses deux
   * catégories : il ne voit aucune différence.
   */
  const portesDeGroupe = aDesPortesDeGroupe(options, repliable);
  /**
   * §1 (nº 575) — LE BLOC FIXE N'EXISTE QUE S'IL Y A DEUX SECTIONS.
   * ------------------------------------------------------------------
   * Le drapeau `entetesCollants` dit qu'on VEUT le bloc ; `portesDeGroupe`
   * dit qu'il y a de quoi le remplir. Il faut les deux.
   * LE CAS QUI L'IMPOSE : dans « Ma sélection », les sections d'un menu
   * sont celles que le visiteur a vraiment. Qui n'a que des réalisations
   * en favori n'a qu'une section — et `aDesPortesDeGroupe` le sait déjà :
   * il compte les groupes et rend faux en dessous de deux. Il n'y a alors
   * ni porte, ni chevron, ni rien à ouvrir : un bloc fixe n'y serait
   * qu'un titre immobile au-dessus de ses propres entrées, avec un trait
   * qui ne pourrait jamais apparaître. Le menu reste donc exactement ce
   * qu'il est aujourd'hui.
   * ⚠️ LE MOTEUR N'EST PAS CONCERNÉ par cette garde : ses deux
   * catégories (« Réalisations », « Flashs ») sont écrites dans le
   * catalogue et ne dépendent de personne — il a toujours ses portes.
   */
  const blocEntetes = entetesCollants && portesDeGroupe;
  /**
   * ██ §1 (nº 577) — UN TITRE SEUL NE DISTINGUE RIEN ██
   * ------------------------------------------------------------------
   * LA nº 575 avait retiré LE BLOC quand il ne reste qu'une section,
   * mais l'en-tête reprenait alors sa place DANS la liste. Le
   * propriétaire n'en veut ni l'un ni l'autre : à une seule section,
   * AUCUN TITRE — le menu est une simple liste d'entrées. Et il a
   * raison : un titre ne sert qu'à séparer de ce qui n'est pas lui.
   * « STYLE » au-dessus de la seule liste possible n'apprend rien.
   *  · PORTFOLIOS : plus que « Style », ou plus que « Profil » (les
   *    sections que la nº 576 écarte quand elles ne trient rien) ;
   *  · FAVORIS : plus que « Réalisations », ou plus que « Flash ».
   * ⚠️ LE MOTEUR NE PEUT PAS Y TOMBER, et ce n'est pas une chance : ses
   * options sont bâties par un `flatMap` sur TOUTES les catégories du
   * catalogue, sans condition — les deux sections existent donc
   * toujours, quoi qu'il y ait en base. La règle est écrite pour lui
   * comme pour les autres, elle ne s'y déclenchera simplement jamais.
   * ⚠️ ELLE NE VISE QUE LES MENUS À BLOC (`entetesCollants`) : les
   * autres — le formulaire de fiche, les sélecteurs tactiles — gardent
   * leurs en-têtes tels quels, section unique comprise.
   */
  const titreEnLigne =
    !blocEntetes && !(entetesCollants && entetesDesSections.length <= 1);

  /**
   * §1 (nº 579) — L'APLAT DE CETTE SURFACE, ÉCRIT UNE FOIS.
   * ------------------------------------------------------------------
   * LE BLOC DES EN-TÊTES ET LA PLAQUE DE LA FEUILLE LE PARTAGENT : ils
   * ne peuvent donc plus se contredire, et c'est tout le sujet de la
   * nº 579 — la feuille montrait deux fonds, un aplat au milieu et du
   * verre aux deux bouts.
   * ⚠️ SANS `opaque`, C'EST `carte` (#1A1F26) — la valeur que le bloc
   * portait déjà depuis la nº 573, et celle que le propriétaire veut
   * voir sur toute la feuille. Avec `opaque`, c'est `eleve` : le jeton
   * que la plaque prenait déjà dans ce cas (nº 552), à quoi le bloc
   * s'aligne au lieu de monter d'un cran de plus. Aucun appelant ne
   * passe aujourd'hui `opaque` ET des en-têtes collants ; cette branche
   * ne fait que rester cohérente si l'un le fait un jour.
   * ⚠️ LE PANNEAU DU WEB N'EST PAS CONCERNÉ : lui reste EN VERRE, et
   * son bloc garde son `carte` posé dessus (§2 nº 573) — un panneau
   * ancré n'est pas une feuille qui couvre le bas de l'écran.
   */
  const aplatDeLaSurface = opaque ? "bg-sombre-eleve" : "bg-sombre-carte";

  /**
   * ██ §2 (nº 578) — LE BLOC DES EN-TÊTES, UNE ÉCRITURE POUR DEUX BORDS ██
   * ------------------------------------------------------------------
   * Il était écrit en ligne dans le panneau du web (nº 572-574). La
   * feuille du doigt le demande à son tour, mais EN BAS : les entrées
   * défilent au-dessus, les deux titres restent collés au bas de la
   * feuille. Le bloc est donc sorti ici, SANS CHANGER UN MOT de ce qu'il
   * dessine, et il ne prend qu'une chose de son appelant : de quel côté
   * il est posé.
   *
   * ⚠️ LE TRAIT SUIT LE BORD, ET C'EST TOUT CE QUI CHANGE. Au web le
   * bloc est en haut, le trait le sépare de la liste par en dessous
   * (`border-b`) ; au doigt il est en bas, le trait passe donc AU-DESSUS
   * (`border-t`). Même jeton, même règle d'apparition, même épaisseur.
   * ⚠️ L'AIR NE CHANGE PAS DE CÔTÉ, LUI, et ce n'est pas un oubli :
   * les 8 px que le bloc rend (§1 nº 574) compensent le rembourrage
   * ASYMÉTRIQUE DU BOUTON d'en-tête (`pt-3` contre `pb-1`), qui est le
   * même où qu'on pose le bloc. `pt-1 pb-3` équilibre donc les deux
   * côtés dans les deux cas.
   * ⚠️ C'EST L'EXCEPTION À LA CHARTE DE LA nº 574 : elle interdit les
   * contours, et le propriétaire a demandé ce trait explicitement après
   * que je lui aie proposé de séparer par l'air seul. QU'UNE PASSE
   * FUTURE NE LE RETIRE PAS en croyant réparer un oubli.
   * ⚠️ LE BORD EXISTE TOUJOURS, IL CHANGE SEULEMENT DE COULEUR
   * (`border-transparent` quand rien n'est déplié) : sans quoi le bloc
   * grandirait d'un pixel à l'ouverture d'une section, et tout ce qu'il
   * porte sauterait d'autant.
   * ⚠️ LE RETRAIT LATÉRAL VIENT DE L'APPELANT : le panneau du web aligne
   * ses titres sur ses options (`px-4`), la feuille sur les siennes
   * (`px-3`). C'est la seule autre chose qui diffère.
   */
  function blocDesEntetes(retrait: string, enBas = false) {
    return (
      <div
        className={`shrink-0 pt-1 pb-3 ${
          enBas ? "border-t" : "border-b"
        } ${aplatDeLaSurface} ${
          groupeDeplie ? "border-sombre-trait" : "border-transparent"
        }`}
      >
        {entetesDesSections.map((entete) => (
          <div key={entete}>{enTeteSection(entete, `${retrait} pt-3 pb-1`)}</div>
        ))}
      </div>
    );
  }
  const [groupeDeplie, setGroupeDeplie] = useState<string | null>(groupeDuChoix);
  /** LA SOUS-SECTION OUVERTE (passe nº 113) — une seule à la fois, et
      elle repart elle aussi du choix courant à chaque ouverture : on
      retombe sur son style, fût-il rangé dans une famille. */
  const [sousGroupeDeplie, setSousGroupeDeplie] = useState<string | null>(
    sousGroupeDuChoix
  );
  const [ouvertureConnue, setOuvertureConnue] = useState(ouvert);
  if (ouvert !== ouvertureConnue) {
    setOuvertureConnue(ouvert);
    if (ouvert) {
      setGroupeDeplie(groupeDuChoix);
      setSousGroupeDeplie(sousGroupeDuChoix);
    }
  }

  /**
   * §2-a (nº 317) — LES SOUS-TITRES QUI NE SE PLIENT PAS.
   * ------------------------------------------------------------------
   * « ARTISTE » et « LIEU » ne sont pas des portes : ils annoncent.
   * Leurs options sont donc TOUJOURS visibles dès que leur groupe est
   * ouvert — il n'y a rien à déplier. La liste des noms concernés est
   * lue sur LES ENTRÉES elles-mêmes (`sousTitre`), jamais écrite ici :
   * le menu ne connaît aucun mot du produit, et « Cultures du monde »,
   * qui ne porte pas ce drapeau, garde sa porte entière.
   */
  const sousTitres = sousTitresDe(options);

  /** Cette option se voit-elle ? La règle vit dans `lib/repli-menu`,
      avec les deux autres : elle s'exécute, elle ne se relit pas. */
  const optionVisible = (option: OptionMenu) =>
    optionSeVoit(option, {
      repliable,
      portesDeGroupe,
      groupeDeplie,
      sousGroupeDeplie,
      sousTitres,
    });

  /** La PORTE d'une sous-section se voit dès que son groupe est ouvert
      (elle tient la place d'une option dans la liste). */
  const sousEnteteVisible = (option: OptionMenu) =>
    repliable &&
    (!portesDeGroupe || !option.groupe || option.groupe === groupeDeplie);

  /**
   * ██ §1 (nº 573) — LA LISTE A-T-ELLE QUELQUE CHOSE À MONTRER ? ██
   * ------------------------------------------------------------------
   * LE DÉFAUT : menu ouvert, aucune section dépliée, le panneau montrait
   * ses deux lignes PUIS une bande plus claire en dessous — le verre du
   * panneau, que rien ne couvrait.
   * LA CAUSE, NOMMÉE, ET CE N'EST NI UN PLANCHER NI UNE HAUTEUR
   * MINIMALE : rien n'impose de hauteur au panneau, `stylePanneau` ne
   * pose qu'un PLAFOND (`maxHeight`). C'est la LISTE qui garde de la
   * place alors qu'elle n'a rien à dire. Jusqu'à la nº 572 elle
   * contenait les deux en-têtes, et son air vertical (`py-1`, 4 px en
   * haut et en bas) les entourait — c'était juste. La nº 572 a sorti les
   * en-têtes dans un bloc au-dessus, EN LEUR DONNANT CET AIR ; celui de
   * la liste est resté, sans plus rien à entourer. Toutes les options
   * étant repliées, ses `<li>` sont vides et ne mesurent rien : il ne
   * restait que ces 8 px, et ils montraient le verre.
   * LE REMÈDE : la liste ne garde son air QUE si elle a quelque chose à
   * montrer. Elle mesure alors zéro, et le panneau s'arrête sous le
   * bloc.
   * ⚠️ ET QUAND UNE SECTION DÉPLIÉE A PEU D'ENTRÉES, il n'y a pas de
   * bande non plus : le panneau n'a AUCUNE hauteur imposée, donc aucun
   * espace libre où la liste pourrait s'étirer — `flex-1` ne peut
   * grandir que dans une place qui existe. Elle grandit jusqu'au plafond
   * et fait défiler au-delà, comme avant.
   */
  const listeGarnie = optionsAvecEntetes.some(
    ({ option }) => optionVisible(option) || sousEnteteVisible(option)
  );

  /** LA LISTE QUI DÉFILE — pour la remonter en haut (5B, nº 139). Une
      seule référence : un seul habillage est monté à la fois. */
  const listeDeroulante = useRef<HTMLUListElement>(null);

  function basculerGroupe(groupe: string) {
    const ouvre = groupeDeplie !== groupe;
    setGroupeDeplie(ouvre ? groupe : null);
    //  Changer de catégorie remet la sous-section sur celle du choix
    //  courant : on ne garde pas ouverte la famille d'une autre
    //  catégorie par simple inertie.
    setSousGroupeDeplie(sousGroupeDuChoix);
    //  ⚠️ OUVRIR UNE CATÉGORIE REMONTE LA LISTE EN HAUT (5B). Le cas
    //  vécu : on défile jusqu'à « Flashs », tout en bas, on l'ouvre —
    //  et sa liste s'est dépliée AU-DESSUS du point où l'on est :
    //  l'écran ne bouge pas, le clic semble mort. La liste repart du
    //  haut, où la catégorie ouverte commence.
    if (ouvre) listeDeroulante.current?.scrollTo({ top: 0, behavior: "instant" });
  }

  function basculerSousGroupe(sousGroupe: string) {
    const ouvre = sousGroupeDeplie !== sousGroupe;
    setSousGroupeDeplie((courant) =>
      courant === sousGroupe ? null : sousGroupe
    );
    //  §2 (nº 238) — UNE SOUS-SECTION REMONTE COMME SA PORTE. Elle ne
    //  le faisait pas, au motif qu'elle se déplie « déjà sous les
    //  yeux » : c'est faux dès qu'on l'a cherchée en bas de liste —
    //  « Cultures du monde » ouvre ONZE entrées sous le point où
    //  l'on est, l'écran ne bouge pas, et le geste semble mort.
    //  CE QUE FAIT UNE PORTE, EXACTEMENT : ce qu'on vient d'ouvrir
    //  passe EN TÊTE de la liste, et son contenu se lit dessous. Pour
    //  une catégorie, la tête est le zéro ; pour une famille rangée à
    //  sa lettre, c'est SA propre ligne qu'on amène en haut — un
    //  retour à zéro l'aurait renvoyée hors de l'écran, à la lettre T.
    //  Même mouvement, même instant, AUCUNE entrée d'historique : un
    //  défilement de liste n'en pousse pas.
    if (!ouvre) return;
    requestAnimationFrame(() => {
      const liste = listeDeroulante.current;
      const porte = liste?.querySelector<HTMLElement>(
        `[data-sous-porte="${CSS.escape(sousGroupe)}"]`
      );
      if (!liste || !porte) return;
      //  §2 (nº 572) — ET IL N'Y A PLUS RIEN À RETRANCHER. La nº 571
      //  ôtait ici la hauteur de l'en-tête COLLANT, qui vivait dans la
      //  liste et se serait posé sur la ligne qu'on amène en haut. Les
      //  en-têtes ont quitté la liste : ils forment un bloc au-dessus
      //  d'elle. `liste.getBoundingClientRect().top` est donc DÉJÀ le
      //  haut de la zone visible des styles, et « Cultures du monde » —
      //  avec son trait rose (nº 525, nº 559) — s'y range en entier.
      //  Le calcul redevient celui de la nº 238, au pixel.
      liste.scrollTo({
        top:
          liste.scrollTop +
          (porte.getBoundingClientRect().top -
            liste.getBoundingClientRect().top),
        behavior: "instant",
      });
    });
  }

  /** L'EN-TÊTE D'UNE SECTION — une étiquette, ou une porte quand le
      menu est repliable. Mêmes mots, même rose, même graisse dans les
      deux cas : seule l'interaction change.
      ⚠️ LA TAILLE (13 px) EST SOUS CELLE DES ENTRÉES (16 px) : un
      titre de catégorie annonce, il ne se choisit pas — et rien ne
      doit le confondre avec une option. */
  function enTeteSection(entete: string, marge: string) {
    const classes = `${marge} ${ECRITURE_TITRE_GROUPE} text-primaire`;
    //  §2 (nº 304) — À UN SEUL GROUPE, c'est une étiquette : aucune
    //  flèche, rien à toucher, et le contenu est déjà là.
    if (!portesDeGroupe) {
      return (
        <p role="presentation" className={classes}>
          {entete}
        </p>
      );
    }
    return (
      <button
        type="button"
        aria-expanded={groupeDeplie === entete}
        //  ⚠️ `onClick` SEUL — surtout pas `onPointerDown` en plus.
        //  Les OPTIONS choisissent dès l'appui (pour ne pas voler le
        //  focus) et se referment dans la foulée : jouer deux fois n'y
        //  change rien. Une PORTE, elle, BASCULE : la jouer au
        //  pointerdown PUIS au click la rouvrait et la refermait dans
        //  le même geste — le menu paraissait mort. Mesuré au banc,
        //  corrigé ici.
        onClick={() => basculerGroupe(entete)}
        className={`${classes} flex w-full items-center justify-between gap-2
                   min-h-[44px] text-left transition-opacity hover:opacity-80`}
      >
        {entete}
        {chevron(groupeDeplie === entete)}
      </button>
    );
  }

  /**
   * §2-b et §2-c (nº 317) — UN SOUS-TITRE, ET RIEN D'AUTRE.
   * ------------------------------------------------------------------
   * Ni bouton, ni flèche, ni survol, ni `role` : un `<p>` que rien ne
   * peut choisir. C'est ce qui remplace la porte de la nº 316 pour
   * « ARTISTE » et « LIEU ».
   *
   * §2-b — EN WEB, IL PREND LA TYPOGRAPHIE DES TITRES DE GROUPE
   * (« Styles », « Profil ») : la MÊME taille, la MÊME graisse, la
   * MÊME chasse — et le gris à la place du rose. Un sous-titre est un
   * titre d'un rang plus bas, pas une option : il devait se lire comme
   * un titre. Aucun soulignement, jamais : le trait rose de
   * `familleSoulignee` appartient aux PORTES (« Cultures du monde »),
   * et celui-ci n'en est pas une.
   *
   * §2-c — AU DOIGT, IL GARDE CE QUE LA nº 316 A POSÉ : le gris et le
   * point rose à sa gauche, à la géométrie des entrées voisines. Seul
   * le pliage part.
   * ⚠️ CE POINT ROSE EST UN EMPLOI PRÉVU DE LA CHARTE, PAS UNE DÉRIVE.
   * C'est EXACTEMENT le même usage que le point de la porte de famille
   * « Cultures du monde » : le rose y dit « ceci ouvre un niveau », il
   * ne désigne jamais une sélection. La charte réserve le rose ; ceci
   * en fait partie. AUCUNE PASSE FUTURE NE DOIT L'EFFACER AU NOM DE LA
   * CHARTE — décision du propriétaire, passe nº 316, tenue à la nº 317.
   */
  function sousTitreDeSection(
    sousEntete: string,
    { avecPoint = false, classes = "" } = {}
  ) {
    return (
      <p
        role="presentation"
        data-sous-titre={sousEntete}
        className={`flex w-full items-center gap-3 ${classes}`}
      >
        {avecPoint && (
          <span
            data-point-option=""
            className={`${TAILLE_POINT} rounded-full shrink-0`}
            style={{ backgroundColor: COULEURS.primaire }}
            aria-hidden
          />
        )}
        {sousEntete}
      </p>
    );
  }

  /** LE CHEVRON — il pivote, il ne change pas de dessin : c'est le
      même objet qui s'ouvre, pas deux icônes qui se remplacent. */
  function chevron(ouvertVers: boolean) {
    return (
      <span
        aria-hidden="true"
        className={`shrink-0 transition-transform duration-200 ${
          ouvertVers ? "rotate-180" : ""
        }`}
      >
        <svg width="12" height="8" viewBox="0 0 14 8" fill="none">
          <path
            d="M1 1l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  /**
   * LA PORTE D'UNE SOUS-SECTION (passe nº 113)
   * ===========================================
   * Elle ressemble à une OPTION, pas à un titre de catégorie — et
   * c'est voulu : « Cultures du monde » occupe la place d'un style
   * dans la liste alphabétique, entre « Suminagashi » et « Trash
   * Polka ». Même taille, même couleur, même hauteur de touche ; seul
   * le chevron dit qu'elle s'ouvre au lieu de se choisir.
   * ⚠️ `onClick` SEUL, pour la raison écrite plus haut : une porte
   * bascule, la jouer deux fois dans un même geste la referme.
   */
  function porteSousSection(
    sousEntete: string,
    classes: string,
    //  §3 (nº 260) — `avecPoint`, ET LA FEUILLE SEULE LE DEMANDE : la
    //  porte reçoit un point comme les styles, et lui seul est ROSE —
    //  c'est ce qui la distingue d'eux, elle ne mène pas à une
    //  sélection, elle ouvre un niveau.
    //  §2 (nº 290) — `souligne` : le trait rose sous les seuls mots de
    //  la porte, quand l'appelant l'a demandé.
    //  §4 (nº 525) — LES DEUX PRÉSENTATIONS LE POSENT désormais : le
    //  panneau classique comme la feuille glissante. C'est la même
    //  ligne d'écriture pour les deux, plus bas — aucun second trait.
    //  §2-b (nº 318) — `sansVoile` A DISPARU AVEC LE VOILE : le
    //  panneau du web perd le sien (voir la note des options — le menu
    //  garde UNE couleur de fond), la feuille l'avait perdu à la
    //  nº 260. Plus personne ne le passait : le paramètre part avec.
    { avecPoint = false, souligne = false } = {}
  ) {
    return (
      <button
        type="button"
        aria-expanded={sousGroupeDeplie === sousEntete}
        onClick={() => basculerSousGroupe(sousEntete)}
        //  C'est cette ligne que la remontée du §2 (nº 238) amène en
        //  tête de liste : elle se désigne elle-même, aucun calcul
        //  d'index à tenir à jour.
        data-sous-porte={sousEntete}
        data-porte-famille={avecPoint ? "" : undefined}
        className={`${classes} flex w-full items-center gap-3 text-left`}
      >
        {avecPoint && (
          <span
            data-point-option=""
            className={`${TAILLE_POINT} rounded-full shrink-0`}
            style={{ backgroundColor: COULEURS.primaire }}
            aria-hidden
          />
        )}
        {/*  §2 (nº 290) — LE TRAIT NE TIENT QU'AUX MOTS : le `flex-1`
             porte toute la largeur de la ligne, il ne peut donc pas
             porter le soulignement (il barrerait la ligne entière,
             chevron compris). C'est un second `span`, EN LIGNE, qui
             le reçoit — la largeur du texte, et rien de plus.
             ⚠️ `decoration-primaire` : le rose de la charte
             (`#FF2E6C` depuis la nº 466), lu au jeton — jamais
             recopié. */}
        <span className="flex-1">
          <span
            data-porte-soulignee={souligne ? "" : undefined}
            className={
              souligne
                ? "underline decoration-primaire decoration-1 underline-offset-4"
                : undefined
            }
          >
            {sousEntete}
          </span>
        </span>
        {/*  ⚠️ LA FLÈCHE DE LA PORTE EST ROSE (nº 155-§5B), pointée en
             bas comme en haut — c'est elle, et elle seule, qui dit
             « ceci s'ouvre au lieu de se choisir ». LE TITRE, LUI,
             RESTE BLANC : il est un style parmi les styles. */}
        <span className="text-primaire">
          {chevron(sousGroupeDeplie === sousEntete)}
        </span>
      </button>
    );
  }

  /**
   * ⚠️ L'ENCADRÉ BLANC AU SURVOL (bug nº 139-5A) — LA CAUSE EXACTE.
   * `OPTION_LISTE` (champs-recherche.ts) porte `hover:bg-fond-doux` :
   * le BLANC CASSÉ du produit artisans, pour ses menus clairs. Sur le
   * panneau SOMBRE, les options y échappaient par accident — la
   * surcouche `hover:bg-sombre-eleve` gagnait à l'ordre de la feuille
   * CSS — mais la PORTE « Cultures du monde » recevait la classe
   * NUE : au survol, un pavé blanc sous la typographie blanche.
   * On ne s'en remet plus à l'ordre de la feuille : en sombre, les
   * classes claires sont RETIRÉES avant d'être remplacées.
   */
  /**
   * ██ §1 (nº 553) — LE SURVOL D'UNE ENTRÉE SUIT LE FOND DU PANNEAU ██
   * ------------------------------------------------------------------
   * IL LE DOIT, SOUS PEINE DE DISPARAÎTRE. Le survol valait
   * `bg-sombre-eleve` (#262C34) quel que soit le panneau. C'est
   * EXACTEMENT le fond que `opaque` donne au panneau depuis cette
   * passe : survol et panneau deviendraient la même couleur, contraste
   * 1,00 — une liste dont les entrées ne répondent plus au doigt ni à
   * la souris. Le survol monte donc du même cran que le panneau, à
   * `bg-sombre-eleve-clair` (#323942) : 1,21 sur le nouveau fond, soit
   * un peu MIEUX que les 1,18 qu'il avait sur le fond `carte` de la
   * nº 552.
   * ⚠️ LES DEUX BRANCHES SONT DES CHAÎNES LITTÉRALES, et ce n'est pas
   * un détail de style : Tailwind lit le TEXTE des fichiers.
   * `hover:${…}` assemblé à l'exécution ne produirait aucune règle —
   * la leçon écrite noir sur blanc au-dessus de `actifAuFocus`.
   * ⚠️ SANS `opaque`, RIEN NE BOUGE : le moteur de recherche et « Ma
   * sélection » gardent leur verre ET leur survol au pixel.
   */
  const SURVOL_ENTREE = opaque
    ? "hover:bg-sombre-eleve-clair"
    : "hover:bg-sombre-eleve";
  const APPUI_ENTREE = opaque
    ? "active:bg-sombre-eleve-clair"
    : "active:bg-sombre-eleve";

  const optionSombre = (base: string) =>
    sombre
      ? `${base
          .replace("hover:bg-fond-doux", "")
          .replace("active:bg-primaire-clair", "")} ${SURVOL_ENTREE} ${APPUI_ENTREE}`
      : base;

  return (
    <div ref={conteneur} className={sansBordure ? "relative h-full" : "relative"}>
      <button
        ref={bouton}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        onClick={() => (ouvert ? fermer() : setOuvert(true))}
        //  §3 (nº 262) — en mode mobile du champ, AUCUNE flèche : elle
        //  part avec le libellé, c'est l'icône grise du contenu qui dit
        //  « ceci ouvre ».
        style={
          champEnModeMobile
            ? undefined
            : {
                backgroundImage: ouvert ? FLECHE_ROSE : FLECHE_GRISE,
                backgroundRepeat: "no-repeat",
                backgroundPosition:
                  positionFleche ??
                  (compact ? "right 0.65rem center" : "right 0.9rem center"),
              }
        }
        className={`w-full ${hauteur} ${taillePolice} ${habillage} ${
          compact ? "pl-3 pr-7" : "pl-4 pr-10"
        } text-left outline-none overflow-hidden text-ellipsis whitespace-nowrap ${
          // Sans choix, l'indication (« Explorer ») se lit en gris
          // doux, comme le fantôme d'un champ vide — pas comme une
          // valeur.
          sombre
            ? libelleChoisi
              ? "text-sombre-texte"
              : "text-sombre-texte-doux"
            : libelleChoisi
              ? ""
              : "text-encre"
        }`}
      >
        {champEnModeMobile ? (
          //  §3 (nº 262) — le contenu smartphone de l'appelant (l'icône
          //  et son mot), aligné comme le titre de la page du moteur.
          <span className="flex items-center gap-2.5">{champMobile}</span>
        ) : (
          (libelleChoisi ?? placeholder ?? "Choisir…")
        )}
      </button>

      {/* Menu déroulant CLASSIQUE (toujours sur web/iPad ; sur mobile
          seulement si la feuille glissante n'est pas demandée).
          PAS de titre ici : le champ reste visible juste au-dessus, le
          répéter serait redondant. Le titre n'existe que sur la feuille
          smartphone, qui recouvre le champ. */}
      {listeVisible &&
        typeof document !== "undefined" &&
        createPortal(
        <div
          {...(sombre && !opaque ? { "data-verre-menu": "" } : {})}
          ref={panneau}
          // POSÉ DANS <body>, en coordonnées d'écran : plus aucun cadre
          // ne le découpe. Il déborde donc de la fenêtre du moteur et
          // descend jusqu'au bas de l'écran — trente et un styles, pas
          // quatre.
          //  ⚠️ LARGEUR AU CONTENU (nº 144-§5) : le champ n'est plus
          //  qu'un plancher — le panneau s'élargit jusqu'au style le
          //  plus long, et plus aucune entrée ne revient à la ligne.
          style={stylePanneau(cadre, ouvreVersLeHaut, hauteurMax, !panneauCaleSurAncre)}
          //  ⚠️ EN SOMBRE, LES CLASSES CLAIRES SONT RETIRÉES, pas
          //  recouvertes (même règle que `optionSombre`) — et le
          //  panneau suit la charte : ni contour ni ombre, le fond
          //  carte seul (la robe des fenêtres depuis la nº 130).
          //  §2 (nº 552) — `opaque` REMET UN FOND À LA PLACE DU VERRE,
          //  et c'est le seul endroit où il s'écrit pour ce panneau-ci.
          //  Il vient APRÈS le `.replace("bg-fond", "")` : le retrait
          //  de la classe claire est fait, on ne le défait pas.
          className={
            sombre
              ? `${listeClassique
                  .replace("border border-bordure", "")
                  .replace("bg-fond", "")
                  .replace(/shadow-\[[^\]]*\]/, "")} text-sombre-texte${
                  opaque ? " bg-sombre-eleve" : ""
                }`
              : listeClassique
          }
        >
          {/*  ██ §2 (nº 572) — LES DEUX EN-TÊTES, ENSEMBLE ET FIXES ██
               ==========================================================
               LA nº 571 LES AVAIT RENDUS COLLANTS DANS LA LISTE : l'un
               remplaçait l'autre au défilement. Le propriétaire veut LES
               DEUX visibles en permanence, l'un sous l'autre, et les
               styles qui défilent dessous.
               LE PROCÉDÉ, ET IL EST PLUS SIMPLE QUE `sticky` : le bloc
               SORT de la liste et devient son frère du dessus. Le
               panneau est déjà une colonne (`flex flex-col`) dont la
               liste est l'élément élastique (`min-h-0 flex-1
               overflow-y-auto`) : un bloc posé avant elle est fixe par
               construction, et la liste prend ce qui reste.
               ⚠️ AUCUN STYLE NE PEUT PASSER DERRIÈRE, et ce n'est pas le
               fond qui l'empêche : la liste CLIPE son contenu (elle est
               son propre conteneur de défilement), lequel ne peut donc
               pas peindre hors de sa boîte. Le fond, lui, sert à DIRE LE
               BLOC.
               ⚠️ §2 (nº 573) — ET IL MONTE D'UN CRAN. La nº 572 avait
               posé `fond` (#0B0F14) pour que la jointure soit invisible :
               le propriétaire veut au contraire que le bloc se
               distingue. C'est `carte` (#1A1F26) désormais — le cran
               au-dessus de ce que le panneau rend vraiment (le verre
               donne rgb(9,15,23)), donc la règle ordinaire de la
               nº 144-§3 : ce qui est POSÉ sur une surface monte d'un
               cran. Mesuré : 1,16 avec le panneau, là où `fond` donnait
               1,00 — le bloc se lit. Et LE ROSE DES TITRES Y RESTE
               LISIBLE : 4,62 sur `carte`, au-dessus du seuil des petits
               textes. Le cran suivant (`eleve`) le ferait tomber à 3,93,
               sous ce seuil — c'est pourquoi on s'arrête là.
               Quand l'appelant passe `opaque`, le panneau est un aplat
               `eleve` et le bloc prend le cran au-dessus,
               `eleve-clair`. Aucune couleur nouvelle dans les deux cas.
               ⚠️ LE CHEVRON N'A RIEN DEMANDÉ : `enTeteSection` est repris
               tel quel, et il porte déjà le procédé de rotation de la
               maison — `transition-transform duration-200` plus
               `rotate-180` quand la section est ouverte. Celui de la
               section ouverte pointe donc vers le haut, l'autre vers le
               bas, et il pivote au clic.
               ⚠️ LA HAUTEUR DU PANNEAU NE BOUGE PAS : elle est plafonnée
               par `usePlacementMenu`, et c'est la liste qui raccourcit
               d'autant.
               ⚠️ §1 (nº 574) — L'AIR DU BAS RATTRAPE CELUI DU HAUT.
               L'air était de 20 px au-dessus de « RÉALISATIONS » et de
               12 px seulement sous « FLASHS ». LES 8 PX D'ÉCART NE
               VIENNENT PAS DU BLOC mais du bouton d'en-tête lui-même :
               son rembourrage est asymétrique (`pt-3` en haut, `pb-1` en
               bas), parce qu'il a été dessiné pour des titres EMPILÉS
               DANS UNE LISTE, où le haut sépare une section de la
               précédente et où le bas colle le titre à ses options. Le
               bloc rend donc les 8 px manquants : `pt-1 pb-3` au lieu de
               `py-1`. Le calcul est exact quelle que soit la taille du
               texte, l'écart valant simplement `pt-3` moins `pb-1`.
               ⚠️ ET LA LISTE N'Y EST POUR RIEN : elle n'a toujours pas
               d'air quand elle est vide (§1 nº 573), donc le panneau
               s'arrête toujours net et aucune bande claire ne revient.

               ██ §2 (nº 574) — LE TRAIT, ET C'EST UNE EXCEPTION VOULUE ██
               LA CHARTE INTERDIT LES CONTOURS. Celui-ci est une
               EXCEPTION EXPLICITEMENT DEMANDÉE par le propriétaire,
               après que je lui aie proposé de séparer par l'air seul :
               il a préféré le trait. QU'UNE PASSE FUTURE NE LE RETIRE
               PAS en croyant réparer un oubli.
               Il ne paraît QUE quand une section est ouverte — rien de
               déplié, rien à séparer. Jeton `trait` (#2F353E), le plus
               visible des deux traits de la nº 466 : 1,34 avec le bloc
               `carte`, là où `bordure` n'aurait donné que 1,28.
               ⚠️ IL APPARTIENT AU BLOC, PAS À LA LISTE : posé en bas du
               bloc fixe, il ne peut donc pas bouger quand les styles
               défilent dessous.
               ⚠️ LE BORD EXISTE TOUJOURS, IL CHANGE SEULEMENT DE
               COULEUR (`border-transparent` quand rien n'est déplié) :
               sans quoi le bloc grandirait d'un pixel à l'ouverture
               d'une section, et tout ce qu'il porte sauterait d'autant. */}
          {blocEntetes && blocDesEntetes("px-4")}
          <ul
            ref={listeDeroulante}
            role="listbox"
            aria-label={ariaLabel}
            // C'est la LISTE qui défile dans le plafond de hauteur du
            // panneau : le menu ne dépasse jamais le bas (ni le haut)
            // de l'écran, et ne fait jamais défiler la page.
            // Barre de défilement VISIBLE (defilement-visible) : quand la
            // liste dépasse la place disponible, il faut voir tout de
            // suite qu'il reste des choix plus bas. C'est l'exception
            // assumée à la règle « jamais d'ascenseur affiché ».
            //  §1 (nº 573) — L'AIR VERTICAL N'EST LÀ QUE S'IL ENTOURE
            //  QUELQUE CHOSE : sans lui, une liste toute repliée mesure
            //  zéro et le panneau s'arrête sous le bloc des en-têtes.
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain defilement-visible${
              listeGarnie ? " py-1" : ""
            }`}
          >
            {optionsAvecEntetes.map(({ option, cle, entete, sousEntete }) => (
              <li key={cle}>
                {/* En-tête de section — étiquette, ou porte repliable */}
                {/*  §1 (nº 577) — `titreEnLigne` dit à la fois « le bloc
                     ne s'en charge pas » ET « il y a de quoi
                     distinguer ». Voir sa note plus haut. */}
                {entete && titreEnLigne && enTeteSection(entete, "px-4 pt-3 pb-1")}
                {/* Porte de sous-section — à la place d'une option */}
                {sousEntete &&
                  sousEnteteVisible(option) &&
                  /*  §2-b (nº 317) — UN SOUS-TITRE PLUTÔT QU'UNE PORTE,
                      quand l'entrée le demande. Il prend la
                      typographie des titres de groupe (`ECRITURE_TITRE_
                      GROUPE` — même taille, même graisse, même chasse),
                      et le gris à la place du rose. Le rembourrage est
                      celui des en-têtes de section juste au-dessus :
                      c'est un titre, il s'aligne sur les titres.
                      ⚠️ ET SANS `souligne` : le trait rose appartient
                      aux portes, celui-ci n'en est pas une. */
                  (option.sousTitre
                    ? sousTitreDeSection(sousEntete, {
                        classes: `${ECRITURE_TITRE_GROUPE} px-4 pt-3 pb-1 ${
                          sombre ? "text-sombre-texte-doux" : "text-encre-douce"
                        }`,
                      })
                    : //  §2 (nº 290) — LE PANNEAU CLASSIQUE, et lui seul,
                      //  pose le trait rose : c'est la présentation du
                      //  moteur principal AU DOIGT COMME AU WEB, et celle
                      //  de « Ma sélection » sur le web. La feuille
                      //  glissante (plus bas) ne le pose jamais.
                      porteSousSection(sousEntete, optionSombre(OPTION_LISTE), {
                        souligne: familleSoulignee,
                      }))}
                {optionVisible(option) && (
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === valeur}
                  // À la SOURIS : choisir dès l'appui, sans voler le focus.
                  // AU DOIGT : ne rien faire à l'appui — un appui qui
                  // devient un GESTE DE DÉFILEMENT ne doit pas choisir
                  // l'option (préverrouiller ici empêchait la liste de
                  // défiler au doigt) ; le tap complet passe par onClick.
                  onPointerDown={(evenement) => {
                    if (evenement.pointerType === "mouse") {
                      evenement.preventDefault();
                      choisir(option.value);
                    }
                  }}
                  onClick={() => choisir(option.value)}
                  // AUCUNE mise en évidence du choix courant : le métier
                  // déjà sélectionné s'affiche EXACTEMENT comme les
                  // autres (même couleur, même graisse). Le rose est
                  // réservé au contour du champ et aux en-têtes de
                  // section — il ne doit pas désigner une option.
                  //  ⚠️ LES OPTIONS D'UNE VRAIE PORTE SONT RETRAITÉES
                  //  (passe nº 113) : le décrochage dit qu'elles
                  //  appartiennent à la porte du dessus, sans avoir à
                  //  l'écrire.
                  //  §2-a (nº 318) — MAIS PAS CELLES D'UN SOUS-TITRE :
                  //  « ARTISTE » et « LIEU » ne sont pas des portes
                  //  (nº 317), leurs options n'ont rien « dedans » à
                  //  dire — elles s'alignent à GAUCHE, sur la même
                  //  ligne verticale que leur sous-titre. Aucun
                  //  retrait, aux deux largeurs.
                  //  ⚠️ ON REMPLACE `px-4` AU LIEU D'AJOUTER `pl-9` :
                  //  deux classes Tailwind qui visent la même propriété
                  //  ont la même force, et c'est l'ORDRE DE LA FEUILLE
                  //  qui tranche — pas l'ordre d'écriture. Ajoutée,
                  //  `pl-9` perdait contre le `px-4` d'OPTION_LISTE et
                  //  le retrait ne se voyait pas (mesuré au banc).
                  //  ⚠️ `optionSombre` RETIRE les classes claires au
                  //  lieu de les recouvrir : le survol sombre ne doit
                  //  rien à l'ordre de la feuille CSS (voir 5A).
                  //  ⚠️ `flex` SEULEMENT QUAND IL Y A UN COMPTE
                  //  (nº 216-§2) : sans lui, rien ne change pour les
                  //  autres menus du site, qui n'en portent pas.
                  /*  §2-b (nº 318) — LE VOILE BLANC DU SOUS-MENU EST
                      SUPPRIMÉ, et c'est une ANNULATION de la nº 241-§5,
                      sur consigne : « en web, le menu garde UNE SEULE
                      couleur de fond, quel que soit le groupe ouvert —
                      un seul fond, du haut en bas, tout le temps. »
                      Depuis que les entrées de « Profil » vivent sous
                      des sous-titres toujours dépliés (nº 317), ce
                      voile teintait TOUT le groupe ouvert : le panneau
                      changeait de couleur selon le menu ouvert. Ce qui
                      dit encore l'appartenance : le RETRAIT des enfants
                      d'une vraie porte (ci-dessous), et le trait rose
                      de la porte (nº 290). La feuille du bas l'avait
                      déjà retiré (nº 260-§3) — les deux habillages
                      disent enfin la même chose. */
                  className={`${optionSombre(
                    option.sousGroupe && !option.sousTitre
                      ? OPTION_LISTE.replace("px-4", "pr-4 pl-9")
                      : OPTION_LISTE
                  )}${option.compte !== undefined ? " flex items-center" : ""}`}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.compte !== undefined && (
                    <span className="shrink-0 pl-3 text-[12.5px] text-sombre-texte-doux tabular-nums">
                      {option.compte}
                    </span>
                  )}
                </button>
                )}
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}

      {/**
        * FEUILLE GLISSANTE — smartphone uniquement (< 768 px)
        * ------------------------------------------------------------
        * §2 (nº 251) — LES TROIS CONDITIONS DÉJÀ PAYÉES, tenues ici :
        *  1. elle est montée dans un PORTAIL sur le corps du document.
        *     Elle vivait dans le flux, à l'endroit du champ : posée
        *     dans un titre de page ou dans la barre, le moindre
        *     ancêtre à filtre, transformation ou `backdrop-filter` en
        *     faisait une racine d'arrière-plan — et le verre n'y
        *     floutait plus la page ;
        *  2. la plaque est SŒUR du voile, jamais son enfant — sinon
        *     elle floute le voile (un noir uni) au lieu de la page, et
        *     redevient noire ;
        *  3. AUCUN FONDU D'OPACITÉ SUR LA PLAQUE : son animation ne
        *     touche que `transform` (`rw-feuille-monte`, globals.css).
        *     Le fondu vit sur LE VOILE.
        * ⚠️ ET C'EST LE VERRE DES MENUS (`data-verre-menu` : 45 %,
        * flou 60, liseré discret), pas celui des fenêtres : cette
        * feuille EST un menu — elle en porte les entrées, ses portes de
        * catégorie et sa sous-porte de famille.
        */}
      {listeVisible &&
        feuilleMobile &&
        typeof document !== "undefined" &&
        createPortal(
        <div
          //  §2 (nº 464) — la ref vit sur la RACINE : voile + plaque,
          //  tout le portail est connu de `surClic` (leçon nº 238-§3).
          ref={racineFeuille}
          className="md:hidden fixed inset-0 z-[70] flex flex-col justify-end"
        >
          {/*  LE VOILE — il porte le fondu (la plaque, jamais). Tap =
               fermeture.
               ██ §2 (nº 464) — AU `click`, PLUS JAMAIS AU `pointerdown` ██
               LE TAP TRAVERSAIT : fermer à l'appui démonte le portail
               dans la foulée (React vide sa file avant de rendre la
               main — et l'ajustement « !ouvert → listeVisible=false »
               retire le portail au même rendu) ; au LEVER du doigt, le
               navigateur fabrique le `click` du tap, refait son
               hit-test dans un document où le voile n'existe plus, et
               ce `click` atterrit sur ce qui se trouve SOUS le doigt —
               une carte, un onglet, un lien — et l'actionne. En fermant
               au `click` — le DERNIER événement de la séquence d'un
               tap —, le voile est encore là pour le recevoir : il le
               CONSOMME, le démontage vient après, rien ne traverse.
               Un tap dehors ferme, RIEN d'autre. (Un glissement sur le
               voile ne produit pas de `click` : il ne ferme plus — un
               glissement n'est pas un tap, et le corps est gelé.) */}
          <div
            className="absolute inset-0 bg-black/40 opacity-100
                       transition-opacity duration-200 starting:opacity-0"
            onClick={fermer}
            aria-hidden
          />
          {/* La feuille — SŒUR du voile, jamais son enfant. */}
          <div
            role="listbox"
            aria-label={ariaLabel}
            /*  §4 (nº 460) — `feuilleDecollee` : l'encadré ne touche
                plus les bords de l'écran — `mx-4`, la marge latérale
                de l'interface (le `px-4` des pages), posée sur la
                plaque ELLE-MÊME (jamais sur un parent — piège 378).
                Hauteur, contenu, animation : rien d'autre ne bouge. */
            /*  ██ §1 (nº 579) — LA FEUILLE SOMBRE EST UN APLAT, PLUS DU
                 VERRE ██
                 LE DÉFAUT : la feuille n'avait pas une couleur. Son bloc
                 de titres portait un APLAT (`carte`, posé à la nº 573)
                 tandis que la plaque, elle, portait `data-verre-menu` —
                 le verre des menus, `rgba(11,15,20,0.45)` plus un flou.
                 Deux natures de fond dans une même surface : le haut et
                 le bas laissaient voir la page, le milieu non.
                 LA CAUSE EST DONC LÀ, ET PAS DANS LE BLOC : le bloc a
                 fait ce qu'on lui demandait ; c'est la plaque qui est
                 restée en verre.
                 LE REMÈDE : la plaque prend LE MÊME APLAT que le bloc
                 (`aplatDeLaSurface`, écrit une fois juste au-dessus du
                 bloc) et l'attribut de verre s'en va. Une seule surface,
                 une seule couleur.
                 ⚠️ `globals.css` N'EST PAS TOUCHÉ (règle nº 172) : les
                 valeurs du verre y restent écrites en dur, intactes.
                 On ne les modifie pas — ON N'EN VEUT PLUS ICI, ce qui
                 se dit en retirant l'attribut, pas en réécrivant la
                 règle. Toutes les autres surfaces de verre du site la
                 lisent toujours.
                 ⚠️ LA BRANCHE CLAIRE NE BOUGE PAS (`bg-fond shadow-2xl`)
                 et c'est elle que prend la feuille du produit ARTISANS
                 (`ChampMetier` ne passe pas `sombre`). Elle n'a jamais
                 été en verre, elle ne le devient pas.
                 ⚠️ LE BLOC NE SE DISTINGUE PLUS DU RESTE, et c'est
                 exactement ce qui était demandé : c'est désormais LE
                 TRAIT qui sépare, seul. Mesuré : `trait` (#2F353E) sur
                 `carte` rend 1,34 — la même valeur qu'avant, le bloc
                 étant déjà à `carte`. */
            className={`relative rounded-t-3xl max-h-[80vh] flex flex-col pb-[max(1rem,env(safe-area-inset-bottom))] ${
              feuilleDecollee ? "mx-4 " : ""
            }${
              sombre
                ? `text-sombre-texte ${aplatDeLaSurface}`
                : "bg-fond shadow-2xl"
            }`}
            style={{
              transform: `translateY(${dragY}px)`,
              transition: enGlissement ? "none" : "transform .25s ease",
              animation: "rw-feuille-monte .25s ease",
            }}
            //  §2 (nº 261) — la feuille ENTIÈRE écoute : sur la liste,
            //  le geste ne devient une fermeture que si elle est en
            //  haut (voir `glissementDebut`).
            onPointerDown={(e) => glissementDebut(e, false)}
            onPointerMove={glissementBouge}
            onPointerUp={glissementFin}
            onPointerCancel={glissementFin}
          >
            {/*  §2 (nº 261) — LA BANDE PRÉHENSIBLE : la barre ET le
                 titre, d'un seul tenant (data-bande-feuille, mesurée
                 au-delà des 44 px du pouce). `touch-none` : au doigt,
                 le navigateur n'a rien à défiler ici — le geste nous
                 revient entier. */}
            <div
              data-bande-feuille=""
              className="cursor-grab touch-none"
              onPointerDown={(e) => glissementDebut(e, true)}
            >
              {/*  ██ §1 (nº 527) — L'AIR DU HAUT, RÉPARTI AUTREMENT ██
                   DEUX RÉSERVES, ET ELLES SE LISENT SUR CETTE SEULE
                   BOÎTE — c'est pour cela qu'elles sont ensemble. La
                   nº 526 avait mis le gros de l'air AU-DESSUS du trait ;
                   le propriétaire veut l'inverse — le trait plus haut,
                   le titre plus dégagé :
                    · AU-DESSUS DU TRAIT (bord haut de la feuille →
                      trait) : 24 px à la nº 526, 16 px ici ;
                    · AU-DESSUS DU TITRE (trait → titre) : 16 px à la
                      nº 526, 24 px ici.
                   Les deux valeurs s'échangent, sur l'échelle de 4
                   demandée. Du bord haut de la feuille au titre :
                   44 px, comme hier — c'est LA RÉPARTITION qui change,
                   et c'est bien ce qui était demandé.
                   HISTORIQUE DES DEUX RÉSERVES, pour ne pas le
                   rechercher : au-dessus du trait 12 (nº 262) → 20
                   (nº 525) → 24 (nº 526) → 16 ; au-dessus du titre 8
                   (nº 262, immobile jusque-là) → 16 (nº 526) → 24.
                   ⚠️ LE TRAIT NE CHANGE PAS : 4 px de haut (nº 525),
                   40 px de large, sa couleur et son centrage.
                   ⚠️ LA BANDE PRÉHENSIBLE NE CHANGE PAS NON PLUS : elle
                   englobe le trait ET le titre (voir la note du
                   dessus), et sa hauteur totale est inchangée — la
                   mesure des 44 px du pouce (nº 261) reste tenue.
                   ⚠️ Classes en ORDRE ALPHABÉTIQUE, une seule par
                   propriété : la règle du site. */}
              <div className="flex justify-center pb-6 pt-4">
                <span className="bg-bordure h-1 rounded-full w-10" aria-hidden />
              </div>
              {/*  §3 (nº 262) — l'icône de l'appelant à gauche du
                   titre, à la couleur du titre : dans la barre elle
                   était grise (« ceci ouvre »), ici elle dit
                   « tu y es ». Une seule écriture d'icône. */}
              {/*  ██ §3 (nº 578) — PAS DE TITRE SANS TITRE DONNÉ ██
                   La feuille écrivait « Choisissez une option » quand
                   l'appelant n'en fournissait aucun. Le propriétaire ne
                   veut plus de grand titre sur les feuilles de « Ma
                   sélection » : elles ne passent donc plus de `titreFeuille`,
                   et le repli part avec — un titre inventé au nom de
                   quelqu'un qui n'en a pas demandé, c'est ce qu'on retire.
                   ⚠️ LES AUTRES FEUILLES GARDENT LE LEUR : `ChampMetier`
                   (le produit artisans) passe « Quel artisan ? », il
                   s'affiche comme avant.
                   ⚠️ L'AIR EST DÉJÀ JUSTE, ET RIEN N'EST À AJOUTER : les
                   24 px qui séparaient le trait du titre (§1 nº 527)
                   deviennent l'air au-dessus de la première entrée. La
                   BANDE PRÉHENSIBLE, elle, garde ses 44 px — 16 au-dessus
                   du trait, 4 de trait, 24 en dessous — et la mesure du
                   pouce de la nº 261 reste tenue au pixel. */}
              {titreFeuille && (
                <h2 className="px-5 pb-3 text-lg font-bold text-left flex items-center gap-2.5">
                  {iconeTitreFeuille}
                  {titreFeuille}
                </h2>
              )}
            </div>
            <ul
              ref={listeDeroulante}
              //  §3 (nº 259) — `overscroll-contain` : arrivé en bout de
              //  liste, le geste NE SE PROPAGE PAS à la page (la même
              //  écriture que le panneau du web, ci-dessus).
              className="overflow-y-auto overscroll-contain px-2 pb-2 defilement-visible"
            >
              {optionsAvecEntetes.map(({ option, cle, entete, sousEntete }) => {
                const { value, label } = option;
                const choisi = value === valeur;
                return (
                  <li key={cle}>
                    {/* En-tête de section — étiquette, ou porte repliable.
                        §1 (nº 578) — LA MÊME GARDE QU'AU WEB : le bloc du bas
                        s'en charge quand il existe, et une section SEULE n'a
                        pas de titre du tout (nº 577). Voir `titreEnLigne`. */}
                    {entete && titreEnLigne && enTeteSection(entete, "px-3 pt-3 pb-1")}
                    {/* Porte de sous-section — à la place d'une option.
                        §3 (nº 525) — LA PUCE EST DÉSORMAIS SA MARQUE À
                        ELLE : les options ont perdu la leur, la porte
                        garde la sienne, ROSE. Elle part du même bord
                        gauche que les styles (`pl-3`), son point la
                        décale ensuite de 18 px — voir la note du rendu
                        d'une entrée. */}
                    {sousEntete &&
                      sousEnteteVisible(option) &&
                      /*  §2-c (nº 317) — AU DOIGT, LE SOUS-TITRE GARDE
                          CE QUE LA nº 316 A POSÉ — le gris, le point
                          rose, la géométrie des entrées voisines — mais
                          IL NE SE PLIE PLUS ET NE SE CLIQUE PLUS. C'est
                          un `<p>`, plus un bouton : rien à toucher,
                          rien à survoler, aucun état choisi possible.
                          ⚠️ ET PLUS DE `hover:` : une classe de survol
                          sur un texte qui ne réagit pas serait un
                          mensonge visuel — le doigt ne survole pas, la
                          souris si. */
                      (option.sousTitre
                        ? sousTitreDeSection(sousEntete, {
                            avecPoint: true,
                            classes: `min-h-[52px] pl-3 pr-3 text-base ${
                              sombre
                                ? "text-sombre-texte-doux"
                                : "text-encre-douce"
                            }`,
                          })
                        : porteSousSection(
                        sousEntete,
                        //  §2 (nº 262) — LA PORTE EST UNE ENTRÉE DE MÊME
                        //  RANG que les styles : même `pl-3` qu'eux, son
                        //  point et son libellé partent du même bord
                        //  gauche. Le retrait (`pl-8`) ne dit qu'une
                        //  chose — « ceci est DEDANS » — et il ne vaut
                        //  que pour les styles qu'elle contient, une
                        //  fois ouverte (la branche `sousGroupe` des
                        //  options, ci-dessous).
                        //  §1 (nº 553) — le survol de la porte suit le
                        //  fond de la feuille, comme celui des entrées.
                        `min-h-[52px] pl-3 pr-3 rounded-2xl text-base ${
                          sombre
                            ? `text-sombre-texte ${SURVOL_ENTREE}`
                            : "text-encre hover:bg-fond-doux"
                        }`,
                        //  §3 (nº 260) — le point rose. (Le voile est
                        //  parti PARTOUT à la nº 318-§2-b — plus rien
                        //  à refuser ici.)
                        //  ██ §4 (nº 525) — ET LE TRAIT ROSE, ENFIN ██
                        //  La feuille du doigt était le SEUL endroit
                        //  où « Cultures du monde » n'avait pas son
                        //  soulignement : la nº 290 l'avait réservé au
                        //  panneau classique. Le propriétaire le veut
                        //  aux deux appareils, et IDENTIQUE — c'est
                        //  pourquoi on passe le drapeau de l'appelant
                        //  (`familleSoulignee`) au lieu d'écrire un
                        //  second trait : les mots sont soulignés par
                        //  LA MÊME ligne de `porteSousSection`, donc
                        //  le même rose de la charte, la même finesse
                        //  et le même décalage, par construction. Les
                        //  menus qui ne demandent rien (formulaire de
                        //  fiche, contact, métier des artisans) ne
                        //  voient toujours aucun trait.
                        { avecPoint: true, souligne: familleSoulignee }
                      ))}
                    {optionVisible(option) && (
                    <button
                      type="button"
                      role="option"
                      aria-selected={choisi}
                      // Même règle que le menu déroulant : l'appui au doigt
                      // laisse le geste décider (défilement possible), le
                      // choix passe par le tap complet (onClick).
                      onPointerDown={(evenement) => {
                        if (evenement.pointerType === "mouse") {
                          evenement.preventDefault();
                          choisir(value);
                        }
                      }}
                      onClick={() => choisir(value)}
                      // Comme dans le menu déroulant : le LIBELLÉ du choix
                      // courant reste de couleur et de graisse normales.
                      // §3 (nº 525) — ET RIEN NE LE DÉSIGNE PLUS DANS LA
                      // FEUILLE, sans que rien ne se perde : la puce
                      // ronde était GRISE sur le choix courant comme sur
                      // les autres depuis la nº 260 — elle ne l'a jamais
                      // désigné. Ce qui le dit, c'est le CHAMP juste
                      // au-dessus et le TITRE de la page, comme avant.
                      // `aria-selected` (ci-dessous) le dit aux lecteurs
                      // d'écran, et lui ne bouge pas.
                      className={`w-full flex items-center gap-3 min-h-[52px] pr-3 rounded-2xl text-left text-base ${
                        //  Retrait des options d'une VRAIE porte
                        //  (passe nº 113) — même règle que sur le web.
                        //  §3 (nº 260) — MAIS PLUS LE VOILE (nº 241-§5) :
                        //  le sous-niveau garde la teinte de la fenêtre.
                        //  §2-a (nº 318) — ET AUCUN RETRAIT SOUS UN
                        //  SOUS-TITRE : « ARTISTE » et « LIEU » ne sont
                        //  pas des portes (nº 317) — leurs options
                        //  partent de la même ligne verticale qu'eux,
                        //  comme sur le web.
                        option.sousGroupe && !option.sousTitre
                          ? "pl-8"
                          : "pl-3"
                      } ${
                        //  §1 (nº 553) — idem pour les entrées de la
                        //  feuille glissante.
                        sombre
                          ? `text-sombre-texte ${SURVOL_ENTREE}`
                          : "text-encre hover:bg-fond-doux"
                      }`}
                    >
                      {/*  ██ §3 (nº 525) — LE POINT D'UN STYLE EST PARTI ██
                           Chaque entrée de la feuille portait une puce
                           ronde à sa gauche (nº 260 : 6 px, grise,
                           `data-point-option`). Elle ne disait RIEN —
                           ni la sélection (elle était grise sur le
                           style choisi comme sur les autres, et c'est
                           la nº 260 qui l'avait voulu ainsi), ni un
                           niveau : une décoration, répétée trente
                           fois, qui poussait tous les libellés de
                           18 px vers la droite. Le propriétaire la
                           supprime, sur TOUS les menus déroulants du
                           doigt — c'est ici qu'ils passent tous.
                           ⚠️ LES DEUX POINTS ROSES RESTENT, et ce ne
                           sont pas des styles : celui de la PORTE de
                           famille (« Cultures du monde ») et celui
                           d'un SOUS-TITRE (« ARTISTE », « LIEU »).
                           Le rose y dit « ceci ouvre un niveau », et
                           la note de `sousTitreDeSection` interdit
                           explicitement de l'effacer (décision du
                           propriétaire, nº 316, tenue à la nº 317).
                           CONSÉQUENCE D'ALIGNEMENT, ASSUMÉE : ces
                           deux lignes-là gardent donc leur retrait de
                           18 px, quand les styles reviennent au bord
                           du `pl-3`. */}
                      {/*  §1-b (nº 316) — LE NOMBRE MANQUAIT AU DOIGT.
                           Le panneau du web l'écrivait depuis la
                           nº 216 ; la feuille du bas, non — elle ne
                           rendait que le libellé. Aucun compte n'était
                           donc lisible sur smartphone : ni à côté de
                           « Néo-Japonais » dans le filtre des
                           portfolios, ni à côté des photos des favoris.
                           ⚠️ MÊME SOURCE, MÊME ÉCRITURE, AUCUN SECOND
                           CALCUL : c'est `option.compte`, celui-là même
                           que le panneau du web affiche — les deux
                           lisent la seule table de comptes bâtie par le
                           serveur. Et c'est le gris des nombres
                           (`sombre-texte-doux`), la taille des nombres
                           (12,5 px) et leurs chiffres à chasse fixe :
                           l'écriture du web, recopiée nulle part
                           ailleurs qu'ici.
                           ⚠️ `flex-1` SUR LE LIBELLÉ : sans lui, le
                           nombre se collerait au mot au lieu de tenir
                           le bord droit — la ligne est déjà un `flex`,
                           il ne manquait qu'à dire qui pousse. */}
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      {option.compte !== undefined && (
                        <span className="shrink-0 pl-3 text-[12.5px] text-sombre-texte-doux tabular-nums">
                          {option.compte}
                        </span>
                      )}
                    </button>
                    )}
                  </li>
                );
              })}
            </ul>
            {/*  ██ §2 (nº 578) — LE BLOC DES EN-TÊTES, EN BAS ██
                 Au web il coiffe la liste ; ICI IL LA CHAUSSE. Les
                 entrées défilent AU-DESSUS, les deux titres restent
                 collés au bas de la feuille — c'est là que le pouce les
                 atteint sans traverser l'écran.
                 LA MÉCANIQUE EST CELLE DE LA COLONNE, comme au web : la
                 plaque est un `flex flex-col` plafonné (`max-h-[80vh]`),
                 le bloc est `shrink-0`, et la liste — qui coupe déjà son
                 débordement — se réduit d'autant. Rien à mesurer, rien à
                 positionner.
                 ⚠️ LE TRAIT PASSE AU-DESSUS (`border-t`) : c'est la
                 seule chose que ce côté-ci change, et c'est
                 `blocDesEntetes` qui la reçoit. Voir sa note.
                 ⚠️ IL RESTE AU-DESSUS DE LA RÉSERVE DU BAS de la plaque
                 (`pb-[max(1rem,env(safe-area-inset-bottom))]`) : la
                 barre d'accueil du téléphone ne le recouvre donc jamais. */}
            {blocEntetes && blocDesEntetes("px-3", true)}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
