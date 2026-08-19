"use client";

import { useEffect, useRef, useState } from "react";
import { gelerLeCorps } from "@/lib/gel-du-corps";
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
/** §3 (nº 260) — LA TAILLE DES POINTS DE LA FEUILLE : la même pour
    tous (les styles et la porte de famille). Écrite une fois.
    §1 (nº 262) — PORTÉE À 6 px : les 4 px de la nº 260 étaient trop
    discrets, on ne les voyait plus. Les couleurs ne bougent pas :
    la porte de famille seule est rose, tous les autres restent
    clairs. */
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
 * glissement, titre en gras, options à puce ronde (rose si choisie),
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
  /** L'arrondi — 16 px (`rounded-2xl`). */
  rayon: "rounded-2xl",
  /** Le fond au repos. */
  repos: "bg-sombre-eleve",
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
  repliable = false,
  libelleValeur,
  positionFleche,
  champMobile,
  iconeTitreFeuille,
  enErreur,
  arrondi,
  familleSoulignee = false,
  avecVoile = false,
}: {
  valeur: string;
  surChangement: (valeur: string) => void;
  options: OptionMenu[];
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
   * ⚠️ ET JAMAIS SUR LA FEUILLE GLISSANTE (`feuilleMobile`, la
   * présentation smartphone de « Ma sélection » : elle monte du bas
   * avec ses points sur les côtés). Le drapeau ne vaut que pour le
   * panneau classique — c'est écrit à l'endroit qui le pose, plus bas.
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
}) {
  const [ouvert, setOuvert] = useState(false);
  const conteneur = useRef<HTMLDivElement>(null);
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
  const feuille = useRef<HTMLDivElement>(null);
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
            ? ROBE_CHAMP_SOMBRE.actif
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
      if (feuille.current?.contains(cible)) return;
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
    //  la porte. Posé par le panneau classique quand l'appelant l'a
    //  demandé, JAMAIS par la feuille glissante.
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
             (`#EE3D6F`), lu au jeton — jamais recopié. */}
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
  const optionSombre = (base: string) =>
    sombre
      ? `${base
          .replace("hover:bg-fond-doux", "")
          .replace("active:bg-primaire-clair", "")} hover:bg-sombre-eleve active:bg-sombre-eleve`
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
          {...(sombre ? { "data-verre-menu": "" } : {})}
          ref={panneau}
          // POSÉ DANS <body>, en coordonnées d'écran : plus aucun cadre
          // ne le découpe. Il déborde donc de la fenêtre du moteur et
          // descend jusqu'au bas de l'écran — trente et un styles, pas
          // quatre.
          //  ⚠️ LARGEUR AU CONTENU (nº 144-§5) : le champ n'est plus
          //  qu'un plancher — le panneau s'élargit jusqu'au style le
          //  plus long, et plus aucune entrée ne revient à la ligne.
          style={stylePanneau(cadre, ouvreVersLeHaut, hauteurMax, true)}
          //  ⚠️ EN SOMBRE, LES CLASSES CLAIRES SONT RETIRÉES, pas
          //  recouvertes (même règle que `optionSombre`) — et le
          //  panneau suit la charte : ni contour ni ombre, le fond
          //  carte seul (la robe des fenêtres depuis la nº 130).
          className={
            sombre
              ? `${listeClassique
                  .replace("border border-bordure", "")
                  .replace("bg-fond", "")
                  .replace(/shadow-\[[^\]]*\]/, "")} text-sombre-texte`
              : listeClassique
          }
        >
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
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain defilement-visible py-1"
          >
            {optionsAvecEntetes.map(({ option, cle, entete, sousEntete }) => (
              <li key={cle}>
                {/* En-tête de section — étiquette, ou porte repliable */}
                {entete && enTeteSection(entete, "px-4 pt-3 pb-1")}
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
        <div className="md:hidden fixed inset-0 z-[70] flex flex-col justify-end">
          {/* LE VOILE — il porte le fondu (la plaque, jamais). Tap =
              fermeture. */}
          <div
            className="absolute inset-0 bg-black/40 opacity-100
                       transition-opacity duration-200 starting:opacity-0"
            onPointerDown={fermer}
            aria-hidden
          />
          {/* La feuille — SŒUR du voile, jamais son enfant. */}
          <div
            {...(sombre ? { "data-verre-menu": "" } : {})}
            ref={feuille}
            role="listbox"
            aria-label={ariaLabel}
            className={`relative rounded-t-3xl max-h-[80vh] flex flex-col pb-[max(1rem,env(safe-area-inset-bottom))] ${
              sombre ? "text-sombre-texte" : "bg-fond shadow-2xl"
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
              <div className="pt-3 pb-2 flex justify-center">
                <span className="w-10 h-1.5 rounded-full bg-bordure" aria-hidden />
              </div>
              {/*  §3 (nº 262) — l'icône de l'appelant à gauche du
                   titre, à la couleur du titre : dans la barre elle
                   était grise (« ceci ouvre »), ici elle dit
                   « tu y es ». Une seule écriture d'icône. */}
              <h2 className="px-5 pb-3 text-lg font-bold text-left flex items-center gap-2.5">
                {iconeTitreFeuille}
                {titreFeuille ?? "Choisissez une option"}
              </h2>
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
                    {/* En-tête de section — étiquette, ou porte repliable */}
                    {entete && enTeteSection(entete, "px-3 pt-3 pb-1")}
                    {/* Porte de sous-section — à la place d'une option.
                        La puce ronde des options lui est refusée : elle
                        ne se choisit pas. Le retrait `pl-8` la met à
                        l'aplomb des libellés voisins. */}
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
                        `min-h-[52px] pl-3 pr-3 rounded-2xl text-base ${
                          sombre
                            ? "text-sombre-texte hover:bg-sombre-eleve"
                            : "text-encre hover:bg-fond-doux"
                        }`,
                        //  §3 (nº 260) — le point rose. (Le voile est
                        //  parti PARTOUT à la nº 318-§2-b — plus rien
                        //  à refuser ici.)
                        { avecPoint: true }
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
                      // Seule la puce ronde à sa gauche le désigne — sans
                      // elle, la feuille n'indiquerait plus du tout quel
                      // métier est sélectionné.
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
                        sombre
                          ? "text-sombre-texte hover:bg-sombre-eleve"
                          : "text-encre hover:bg-fond-doux"
                      }`}
                    >
                      {/*  §3 (nº 260) — LE POINT D'UN STYLE : 4 px, et
                           BLANC quoi qu'il arrive. Il faisait 10 px, et
                           il passait au ROSE sur le style choisi —
                           trois fois la même information : le champ
                           juste au-dessus dit lequel est choisi, et le
                           titre de la page le répète. Le menu n'a pas à
                           le redire. Le seul point rose de la liste est
                           celui de la porte de famille. */}
                      <span
                        data-point-option=""
                        className={`${TAILLE_POINT} rounded-full shrink-0`}
                        style={{ backgroundColor: COULEURS.bordureCarte }}
                        aria-hidden
                      />
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
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
