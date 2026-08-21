"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { PhotoProgressive } from "@/components/PhotoProgressive";
import { PhotoDeCarte, TAILLES_CARTE } from "@/components/PhotoDeCarte";
import { ZoomPincement } from "@/components/ZoomPincement";
import { CADRE_PHOTO_PORTFOLIO } from "@/config/tatouage";
import type { PhotoGalerie } from "@/lib/photo-tatoueur";
//  ⚠️ TEMPORAIRE (nº 218-§1) — la sonde du carrousel. Sans
//  `?sonde-carrousel=1`, chacun de ces appels sort à sa première ligne
//  et ne coûte rien. Pour la retirer : ces imports et les appels
//  `noter…` / `ressource` ci-dessous.
import {
  inventaire,
  noter,
  noterArret,
  noterDemontage,
  noterMontage,
  ressource,
} from "@/lib/journal-carrousel";

/**
 * LE CARROUSEL DU PORTFOLIO — TOUTES les photos d'un ensemble
 * ============================================================
 * Il montre l'ensemble choisi (style, catégorie, rendu) et toutes ses
 * photos, dans l'ordre du dépôt. C'est la fiche qui possède l'indice.
 *
 * ⚠️ UN DÉFILEMENT NATIF AVEC ACCROCHAGE, PLUS AUCUN CALCUL (nº 209-§7)
 * ====================================================================
 * CE QUI A ÉTÉ SUPPRIMÉ, ET POURQUOI. La piste était déplacée par une
 * translation que NOUS calculions : d'abord en pourcentage, puis (nº 207)
 * en pixels mesurés et arrondis. Les deux ont laissé la même bande
 * verticale à droite de la photo — le bord de la suivante. La cause
 * définitive est celle que le propriétaire a relevée : la mesure est
 * prise PENDANT L'OUVERTURE de la fenêtre superposée, avant qu'elle ait
 * sa taille définitive ; le pas de translation restait donc celui d'un
 * cadre qui n'existe plus. Corriger le calcul, c'était courir après la
 * mesure.
 *
 * IL N'Y A DONC PLUS DE CALCUL DU TOUT. Le cadre est un conteneur qui
 * DÉFILE (`overflow-x`), les photos sont des colonnes de 100 % de sa
 * largeur, et l'accrochage (`scroll-snap`) fait le reste. Le navigateur
 * connaît toujours sa largeur réelle, à l'instant près, pendant une
 * ouverture comme après un redimensionnement : il ne peut plus y avoir
 * d'écart entre la largeur d'une photo et le pas du défilement, parce
 * que PERSONNE ne calcule ce pas.
 *  · CE QUE LE CARROUSEL LIT : quelle photo occupe le cadre — par un
 *    `IntersectionObserver`, qui répond par un OUI/NON, sans aucune
 *    arithmétique ;
 *  · CE QUE LES FLÈCHES ET LES POINTS ÉCRIVENT : `scrollTo` vers
 *    `offsetLeft` de la photo visée — une position que le navigateur a
 *    lui-même posée. Aucune largeur n'est lue nulle part.
 *
 * DEUX ÉCRANS, DEUX GESTES :
 *  - SMARTPHONE : le doigt fait défiler (c'est désormais le défilement
 *    natif, avec son inertie et son accrochage) ; un COMPTEUR « 3/12 »
 *    vit dans l'angle haut droit ;
 *  - WEB (souris) : les flèches, et la pagination en bas de l'image.
 *
 * LA TENUE EN CHARGE — vingt photos sur un téléphone en 4G : seules la
 * photo courante et ses deux voisines existent comme IMAGES. Les autres
 * sont des colonnes vides du même format : aucune requête, et le cadre
 * garde ses dimensions.
 *
 * LES FLÈCHES SUIVENT LE POINTEUR, pas la largeur : visibles dès que
 * l'appareil a une souris (`pointer-fine`, déclarée en nº 208-§2), même
 * dans une fenêtre rétrécie. Sur un vrai écran tactile, jamais : le
 * balayage suffit.
 */

/**
 * COMBIEN DE PHOTOS DE PART ET D'AUTRE GARDENT UNE IMAGE MONTÉE.
 *
 * ⚠️ DEUX, ET C'EST LA CORRECTION DE §5 ET §6 (nº 217)
 * ==================================================================
 * À UNE VOISINE, l'ensemble monté était {i−1, i, i+1}. Dès que
 * l'indice passait à i+1 — c'est-à-dire À L'INSTANT OÙ LA PHOTO
 * S'IMMOBILISE —, la colonne i+2 naissait et la colonne i−1 mourait.
 * Or i+2 TOUCHE la colonne regardée : pendant que l'accrochage finit
 * sa course, on en voit la tranche. Son image apparaissait donc au
 * beau milieu du mouvement, puis sortait du cadre — un scintillement
 * sur un appareil rapide, et sur un iPhone 8, où le rendu arrive
 * après l'arrêt, LA MOITIÉ D'UNE IMAGE, coupée à la verticale, qui se
 * superpose un instant.
 *
 * À DEUX VOISINES, l'ensemble monté est {i−2 … i+2}. Quand l'indice
 * passe à i+1, la colonne qui naît est i+3 et celle qui meurt est
 * i−2 : toutes deux à DEUX cadres de la photo regardée, donc
 * strictement invisibles — le cadre ne peut jamais en montrer que
 * deux à la fois. Plus rien n'apparaît ni ne disparaît dans le champ
 * de vision au moment où la photo s'arrête.
 *
 * CE QUE ÇA COÛTE : cinq colonnes montées au lieu de trois, soit deux
 * MINIATURES de plus (~25 ko chacune, `lazy`). La pleine résolution,
 * elle, reste demandée pour la seule photo regardée — c'est elle qui
 * pèse, et rien n'a changé de ce côté.
 */
const VOISINES = 2;

/**
 * ██ §2 (nº 368) — LES CARTES ONT ENFIN DES VOISINES ██
 * ==================================================================
 * LE DÉFAUT, ET SA CAUSE EXACTE. Sur une carte, chaque photo mettait
 * un temps à arriver, avec un fond sombre entre deux ; sur une fiche,
 * non. La différence n'était ni le chargement paresseux (les deux
 * l'emploient), ni la couleur du fond (c'est bien la réserve du cadre
 * qu'on voit — mais on ne devrait pas avoir le temps de la voir), ni
 * l'optimiseur (il ne fabrique qu'à la première visite, puis sert du
 * cache) : LES VOISINES DE LA CARTE N'EXISTAIENT PAS DANS LA PAGE.
 *
 *   · FICHE — `montees` contient {i−2 … i+2} DÈS LE PREMIER RENDU :
 *     quand on fait défiler, la photo suivante est déjà là, et son
 *     image déjà demandée ;
 *   · CARTE — `rang === 0 || eveille` : AVANT le premier geste, une
 *     seule colonne existe ; le geste les monte TOUTES d'un coup, et
 *     c'est seulement à cet instant que le navigateur commence à
 *     télécharger celle qu'on est déjà en train de faire glisser.
 *     D'où le temps d'attente, à chaque photo, la première fois.
 *
 * LA MÊME RECETTE, RESSERRÉE. Une carte monte désormais {i−1 … i+1} —
 * UNE voisine de chaque côté au lieu de deux, parce qu'une carte a
 * beaucoup de sœurs et qu'il y en a vingt par page.
 *
 * CE QUE ÇA COÛTE, ET LA BORNE : au repos, une carte monte DEUX
 * colonnes (la photo 0 et sa voisine) au lieu d'une. La voisine est
 * `lazy` — le navigateur ne la télécharge donc QUE si la carte est à
 * l'écran ; les cartes hors champ ne demandent rien (`lazy` seul
 * depuis la nº 424-§3, et il suffit : une image paresseuse hors
 * écran n'est jamais demandée). Le premier écran coûte
 * ainsi au plus UNE photo de plus par carte VISIBLE, demandée après la
 * peinture. Zéro photo de plus pour les cartes qu'on ne voit pas.
 * ⚠️ LE BOUTON, S'IL FAUT REVENIR : mettre 0 ici rend le comportement
 * d'avant la nº 368 (aucune voisine montée d'avance).
 */
const VOISINES_CARTE = 1;

/** useLayoutEffect côté navigateur, useEffect côté serveur (silencieux)
    — le motif du projet (voir DefilementEnHaut, GrilleTatoueurs). */
const useEffetAvantPeinture =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function CarrouselPortfolio({
  photos,
  nomTatoueur,
  styleLabel,
  indice,
  surChangement,
  variante = "fiche",
  prioritaire = false,
  natureDeLaSerie = "",
  badgeReduit = false,
  lien,
  sansCompteur = false,
  //  §1 (nº 368) — `sansPoints` n'est plus LU : la frise a quitté les
  //  cartes, et personne d'autre ne la rendait ici. La propriété reste
  //  DÉCLARÉE (voir plus bas) pour que l'appel de la fenêtre de
  //  carrousel n'ait pas à changer, mais elle ne commande plus rien.
  dansLaFenetre = false,
  children,
}: {
  /** LES PHOTOS DE L'ENSEMBLE AFFICHÉ. */
  photos: PhotoGalerie[];
  nomTatoueur: string;
  /** Le libellé du style affiché — il sert aux textes de remplacement. */
  styleLabel: string;
  /**
   * §1 (nº 247) — LA CATÉGORIE QUE CE CARROUSEL DÉCLARE MONTRER
   * ------------------------------------------------------------------
   * « tatouage », « flash », ou rien du tout quand il montre un style
   * entier. Ce n'est pas un réglage : c'est une DÉCLARATION, et la
   * règle du site est qu'elle ne peut pas mentir — toute photo montrée
   * porte cette catégorie (l'enveloppe abandonne sa série plutôt que
   * d'en violer une, voir `serieMontree`). Elle s'écrit dans le DOM
   * (`data-serie-nature`), en face de la catégorie de chaque colonne
   * (`data-nature`) : le défaut redevient mesurable, il ne peut plus
   * revenir en silence.
   */
  natureDeLaSerie?: string;
  /** L'indice RÉEL affiché (0..n-1) — possédé par la fiche. */
  indice: number;
  surChangement: (indice: number) => void;
  /**
   * OÙ CE CARROUSEL VIT (nº 211-§5).
   *  · « fiche » — la photo principale : pleine résolution, compteur
   *    au doigt, flèches à la souris, pincement ;
   *  · « carte » — dans la mosaïque, en pleine largeur au doigt : LES
   *    MINIATURES SEULES (une mosaïque ne télécharge jamais de pleine
   *    résolution), aucun compteur, aucune flèche, les ronds toujours
   *    visibles, et le PINCEMENT LAISSÉ À LA CARTE, qui a déjà le sien.
   *    ⚠️ ET LE CHARGEMENT EST DIFFÉRÉ : seule la première photo est
   *    demandée tant que le doigt n'a pas touché cette carte-là.
   */
  variante?: "fiche" | "carte";
  /** En variante « carte » : cette carte est-elle dans les premières
      de la mosaïque ? Elle seule charge son image sans attendre le
      défilement — les autres restent `lazy`, donc une carte hors écran
      ne demande RIEN (nº 211-§5). */
  prioritaire?: boolean;
  /** §5 (nº 367) — LA PETITE CARTE (deux colonnes au doigt) : la
      capsule du compteur y descend d'un cran — 8/4 de rembourrage,
      texte 10, flèche 8 — pour rester proportionnée à une image de
      190 px. Sans effet sur une fiche, ni sur une carte pleine
      largeur : elles gardent le gabarit d'origine. */
  badgeReduit?: boolean;
  /** En variante « carte » : chaque photo est un LIEN vers la fiche —
      un toucher navigue, un glissement fait défiler (le navigateur
      n'émet aucun clic après un glissement). */
  lien?: {
    href: string;
    onClick?: (evenement: React.MouseEvent) => void;
    label: string;
  };
  /**
   * §Fenêtre (nº 284) — LA CAPSULE « 3/12 » NE S'AFFICHE PAS. Dans la
   * fenêtre de carrousel du smartphone, la photo est NETTE : rien de
   * posé dessus — les points, rendus SOUS la photo, disent déjà le
   * nombre. Faux partout ailleurs : la page et la fenêtre du web ne
   * changent en rien.
   */
  sansCompteur?: boolean;
  /**
   * §Fenêtre (nº 284) — LES POINTS NE SE DESSINENT PAS DANS LA PHOTO.
   * La fenêtre de carrousel les affiche elle-même SOUS la photo (la
   * même frise, `PointsDuCarrousel` — une seule écriture). Faux
   * partout ailleurs.
   */
  sansPoints?: boolean;
  /**
   * §1 (nº 296) — CE CARROUSEL VIT DANS LA FENÊTRE CENTRÉE SUPERPOSÉE.
   * ------------------------------------------------------------------
   * ⚠️ ELLE N'AURAIT JAMAIS DÛ ÊTRE TOUCHÉE, et le propriétaire l'avait
   * écrit dès la nº 290 : « NON concerné : les fiches au format FENÊTRE
   * SUPERPOSÉE. Elles vont bien, n'y touche pas. » Les nº 292 à 295 lui
   * ont pourtant appliqué des corrections pensées POUR LA PAGE, dont la
   * géométrie est l'inverse de la sienne : la page tire sa largeur d'une
   * mesure, la fenêtre tire la sienne de sa hauteur. Résultat, chez le
   * propriétaire : un vide entre la photo et la colonne de droite, et
   * une colonne de droite qui descend plus bas que la photo.
   * CE DRAPEAU REND À LA FENÊTRE SON ÉTAT D'AVANT LA nº 292, à la
   * lettre : le fond de la racine, aucun format sur le cadre, aucun
   * `min-h-0`, aucun rognage de colonne. RIEN DE PLUS, RIEN DE MOINS.
   * ⚠️ ET LA PAGE NE CHANGE PAS D'UN PIXEL : elle garde toutes ses
   * corrections, celle de la hauteur en particulier (nº 290-293), qui a
   * réglé la photo débordant sous l'écran dans « Mon portfolio ».
   */
  dansLaFenetre?: boolean;
  /** Posé PAR-DESSUS la photo (le partage, le cœur). */
  children?: React.ReactNode;
}) {
  const n = photos.length;
  const surCarte = variante === "carte";

  /* ---- SONDE (nº 218-§1) : ce carrousel vit-il, et depuis quand ? ---
     Le compteur d'instances est la ligne que le propriétaire veut voir :
     si un carrousel de fiche reste à deux, ou si le nombre grimpe en
     enchaînant les sélecteurs, la cause du blocage est là. */
  useEffect(() => {
    if (surCarte) return;
    noterMontage("carrousel");
    return () => noterDemontage("carrousel");
  }, [surCarte]);

  /**
   * §5 (nº 211) — LE CHARGEMENT DIFFÉRÉ DES CARTES, ET SA FIN (nº 368)
   * ==================================================================
   * LA RÈGLE D'ORIGINE : une carte ne montait qu'UNE colonne, et les
   * suivantes n'existaient même pas comme balises tant que le doigt
   * n'avait pas touché CETTE carte (`eveille`). Vingt cartes = vingt
   * images, quel que soit le nombre de photos publiées.
   * CE QU'ELLE COÛTAIT, mesuré par le propriétaire à la nº 368 : la
   * photo suivante n'était demandée qu'AU MOMENT du geste, et l'on
   * attendait devant le fond du cadre à chaque photo.
   * L'ÉTAT `eveille` EST DONC SUPPRIMÉ, code compris : c'est la même
   * fenêtre montée que la fiche qui décide désormais, resserrée à une
   * voisine (VOISINES_CARTE). La promesse de tenue en charge est
   * conservée autrement, et elle est même plus stricte qu'avant : la
   * voisine est `lazy`, donc jamais téléchargée pour une carte hors
   * champ, là où le réveil montait TOUTES les colonnes d'un coup.
   */

  /**
   * §4 (nº 198) — L'INDICATEUR DE VOLUME S'EFFACE ET REVIENT
   * ------------------------------------------------------------------
   * SMARTPHONE, angle haut droit : la capsule affiche « 1/5 ». Après
   * trois secondes sans interaction, LE TEXTE S'ESTOMPE et la capsule
   * SE RESSERRE pour ne laisser qu'une flèche minimale — vers la droite
   * s'il reste des photos après, vers la gauche en fin de galerie.
   * Cette flèche demeure : c'est le repère permanent. Au moindre geste,
   * le texte revient aussitôt, et les trois secondes repartent.
   *
   * ⚠️ AUCUN setState SYNCHRONE DANS UN EFFET (la règle du projet) :
   *  · le retour au toucher vit dans l'ÉCOUTEUR (un événement, pas un
   *    effet) et incrémente un compteur de réveil ;
   *  · le retour au changement de photo est un AJUSTEMENT PENDANT LE
   *    RENDU (le motif React officiel) ;
   *  · seul le minuteur — asynchrone par nature — éteint le texte.
   */
  /**
   * §3 (nº 367) — SUR UNE CARTE, LA CAPSULE NAÎT REPLIÉE.
   * ------------------------------------------------------------------
   * Sur une FICHE, rien ne change : elle s'ouvre dépliée, montre le
   * compte, et se replie trois secondes plus tard. Sur une CARTE, on
   * ne voit d'abord QUE LA FLÈCHE : le compte apparaît au premier
   * défilement (l'ajustement pendant le rendu, juste dessous, s'en
   * charge) et repart trois secondes après le dernier. C'est le MÊME
   * mécanisme, à sa valeur de départ près — il n'y en a pas deux.
   */
  const [compteurVisible, setCompteurVisible] = useState(!surCarte);
  const [reveils, setReveils] = useState(0);
  //  Le changement de photo est un geste : le texte revient, pendant
  //  le rendu — jamais dans un effet.
  const [indiceVu, setIndiceVu] = useState(indice);
  if (indice !== indiceVu) {
    setIndiceVu(indice);
    setCompteurVisible(true);
  }
  useEffect(() => {
    //  §3 (nº 367) — PAS SUR UNE CARTE, et pour deux raisons. D'abord
    //  le sens : sur une carte, SEUL LE DÉFILEMENT déplie la capsule —
    //  toucher l'écran ailleurs déplierait les vingt cartes de la
    //  mosaïque d'un coup. Ensuite le coût : c'était un écouteur de
    //  document PAR CARTE, pour un geste qui ne la concernait pas.
    if (surCarte) return;
    const auToucher = () => {
      setCompteurVisible(true);
      setReveils((n) => n + 1);
    };
    document.addEventListener("touchstart", auToucher, { passive: true });
    ressource("écouteur touchstart", 1);
    return () => {
      document.removeEventListener("touchstart", auToucher);
      ressource("écouteur touchstart", -1);
    };
    //  `surCarte` ne change jamais pour une instance donnée (une carte
    //  ne devient pas une fiche) — mais le linte veut le voir écrit,
    //  et il a raison : la garde du dessus le lit.
  }, [surCarte]);
  //  LE CYCLE DE TROIS SECONDES — réarmé par chaque réveil et chaque
  //  changement de photo. S'il expire, le texte s'estompe en douceur.
  //  §3 (nº 367) — ET IL NE TOURNE QUE QUAND IL Y A QUELQUE CHOSE À
  //  REPLIER : une carte qu'on ne touche pas (capsule déjà repliée)
  //  n'arme aucune minuterie. Sur la fiche, rien ne change — la
  //  capsule y naît dépliée, donc la minuterie part comme avant.
  useEffect(() => {
    if (!compteurVisible) return;
    const minuteur = window.setTimeout(() => setCompteurVisible(false), 3000);
    ressource("minuteur compteur", 1);
    return () => {
      window.clearTimeout(minuteur);
      ressource("minuteur compteur", -1);
    };
  }, [compteurVisible, reveils, indice]);

  /**
   * ██ §2 (nº 394) — LES FLÈCHES DORMENT, ET SE RÉVEILLENT À LA SOURIS ██
   * ==================================================================
   * LE COMPORTEMENT DEMANDÉ, sur une FICHE et à la SOURIS seulement :
   * au repos les deux flèches sont invisibles ; le moindre mouvement de
   * souris SUR LA PHOTO les rallume ; trois secondes après le dernier
   * mouvement, elles s'éteignent. C'est exactement le cycle de la
   * capsule (nº 198 et nº 367) transposé au geste de la souris — même
   * délai, même « le compte repart à chaque réveil ».
   *
   * ⚠️ SORTIE DE LA PHOTO : ON ÉTEINT TOUT DE SUITE, sans attendre les
   * trois secondes, et c'est un choix. Une flèche ne sert qu'à être
   * cliquée : le curseur parti, plus personne ne peut l'atteindre sans
   * revenir sur la photo — et revenir déclenche un mouvement, donc les
   * rallume. Attendre laisserait donc trois secondes de flèches
   * allumées sur une image que personne ne pointe : précisément ce
   * qu'on veut supprimer. C'est aussi le moins cher — la sortie ANNULE
   * la minuterie au lieu d'en armer une de plus.
   *
   * ⚠️ CE QUE ÇA COÛTE, ET C'EST LA QUESTION DU PROPRIÉTAIRE :
   *  · AUCUN écouteur de `document`, AUCUN `addEventListener` : ce sont
   *    deux PROPRIÉTÉS React (`onPointerMove`, `onPointerLeave`) sur
   *    la racine du carrousel. React n'attache qu'un seul écouteur
   *    délégué à la racine de l'application, pour tout l'arbre : ce
   *    dispositif n'en ajoute donc pas un seul de plus, ni par
   *    carrousel, ni par photo ;
   *  · ELLES NE SONT MÊME PAS POSÉES quand elles n'ont rien à faire —
   *    `flechesQuiDorment` est faux sur une carte de mosaïque (nº 369
   *    garde son survol, intact) et faux avec une seule photo (il n'y a
   *    alors aucune flèche) : le carrousel reçoit `undefined`, donc
   *    aucune fonction ;
   *  · LA MINUTERIE N'EXISTE QUE PENDANT L'ÉVEIL. Au repos il n'y en a
   *    aucune. Chaque mouvement remplace la précédente (`clearTimeout`
   *    puis `setTimeout`) : il n'y en a jamais deux ;
   *  · FERMETURE DE LA FENÊTRE OU CHANGEMENT DE FICHE : le composant
   *    est démonté, l'effet de nettoyage ci-dessous efface la minuterie
   *    en cours, et les deux propriétés partent avec l'arbre. Rien ne
   *    survit, rien ne réveille un carrousel qu'on ne regarde plus.
   *
   * ⚠️ ET PAS UN RENDU DE PLUS QU'IL N'EN FAUT : `mousemove` part
   * soixante fois par seconde, mais `setFlechesEveillees(true)` sur un
   * état DÉJÀ vrai est un non-événement pour React (il abandonne le
   * rendu quand la valeur ne change pas). Le réarmement, lui, ne passe
   * pas par React du tout : c'est une référence, pas un état. Deux
   * rendus par cycle — l'allumage, l'extinction —, jamais davantage.
   */
  const [flechesEveillees, setFlechesEveillees] = useState(false);
  const minuteurFleches = useRef(0);
  const flechesQuiDorment = !surCarte && n > 1;
  /*  ⚠️ UN DOIGT NE RÉVEILLE RIEN, et c'est une garde de COÛT autant
       que de sens. Au doigt les flèches n'existent pas (`hidden` sans
       `pointer-fine`) — mais un navigateur tactile émet quand même un
       `mousemove` de synthèse juste avant chaque appui. Sans ce test,
       taper la photo armerait une minuterie et provoquerait deux
       rendus de ce composant, pour des boutons que personne ne peut
       voir. On lit le TYPE du pointeur au moment de l'événement (jamais
       au rendu : ce serait un écart d'hydratation) et on écarte le seul
       cas qui n'a rien à y gagner. La souris et le stylet passent. */
  const reveillerLesFleches = (evenement: React.PointerEvent) => {
    if (evenement.pointerType === "touch") return;
    setFlechesEveillees(true);
    window.clearTimeout(minuteurFleches.current);
    minuteurFleches.current = window.setTimeout(
      () => setFlechesEveillees(false),
      3000
    );
  };
  const endormirLesFleches = () => {
    window.clearTimeout(minuteurFleches.current);
    setFlechesEveillees(false);
  };
  useEffect(() => () => window.clearTimeout(minuteurFleches.current), []);

  /** LE CADRE QUI DÉFILE, et les colonnes qu'il contient. */
  const cadre = useRef<HTMLDivElement>(null);
  const colonnes = useRef<(HTMLDivElement | null)[]>([]);

  /** PINCEMENT À DEUX DOIGTS (vrais mobiles) : le temps du geste, le
      cadre ne défile plus et l'accrochage est levé — sans quoi le
      navigateur ferait glisser la piste sous les doigts. */
  const [zoomEnCours, setZoomEnCours] = useState(false);
  function surPincement(actif: boolean) {
    setZoomEnCours(actif);
  }

  /**
   * QUELLE PHOTO OCCUPE LE CADRE ? — la question posée au navigateur,
   * qui répond sans qu'on calcule quoi que ce soit. Le seuil de 60 %
   * ne peut désigner qu'une seule colonne à la fois.
   */
  /**
   * ⚠️ L'IDENTITÉ DE LA SÉRIE, PAS SON NOMBRE (nº 214-§2)
   * ==================================================================
   * LE DÉFAUT — le défilement qui « se bloque » dans le portfolio.
   * L'observateur ne se reposait QUE si `n` changeait. Or on passe
   * sans cesse d'une série à une autre (onglet, catégorie, rendu,
   * style), et deux séries ont souvent LE MÊME NOMBRE de photos :
   * l'effet ne se rejouait pas, l'observateur restait accroché aux
   * colonnes de la série PRÉCÉDENTE — des nœuds démontés. Plus aucune
   * photo n'était signalée, l'indice se figeait, et `allerA` visait
   * lui aussi d'anciens nœuds : flèches et points ne répondaient plus.
   * On dépend donc des CLÉS des photos : changer de série, c'est
   * changer cette chaîne, quel que soit le nombre.
   */
  const cleDeLaSerie = photos.map((photo) => photo.cle).join("|");

  /**
   * §2 (nº 282) — LE CADRE SE POSE SUR LA GRILLE DE PIXELS
   * ==================================================================
   * ⚠️ CE N'EST PAS UN ARRONDI DE LARGEUR. Celui-là existe déjà
   * (nº 280-§4, `round(down,100%,1px)`) et il TIENT : mesuré au banc,
   * le décalage entre le bord gauche du cadre et le bord gauche de la
   * photo affichée vaut 0,000 px. La largeur n'était donc que LA
   * MOITIÉ du problème ; voici l'autre.
   *
   * CE QUI RESTAIT, MESURÉ. Sur une fiche à part entière, en fenêtre
   * de 1609 px, le cadre est large de 995,000 px — entier — mais son
   * BORD GAUCHE tombe à 110,90625 px. Il est posé ENTRE DEUX PIXELS.
   * D'où vient cette fraction : la colonne de la photo prend la
   * largeur `calc((100vh−119px)×0,8)`, qui n'est pas ronde ; la grille
   * de la fiche centre ses deux colonnes (`justify-center`), donc
   * partage en deux un espace libre fractionnaire — la moitié d'un
   * nombre à virgule tombe à son tour à virgule.
   *
   * POURQUOI UN BORD À VIRGULE FAIT UN TRAIT. Le cadre ROGNE (il
   * défile, donc il coupe) et la photo COMMENCE au même endroit : à
   * 110,90625. Le pixel nº 110 est donc réclamé à 9 % par la photo
   * regardée et à 91 % par ce qui est derrière — c'est-à-dire par la
   * TRANCHE DE LA PHOTO VOISINE, celle que le rognage est censé
   * supprimer. Chaque moteur de rendu tranche ce partage à sa façon :
   * Chromium recale tout sur le pixel entier et ne laisse rien passer
   * (mesuré ici : le pixel nº 110 est du fond pur, 26,26,29) ; un
   * moteur qui recale le ROGNAGE mais pas la PHOTO laisse voir ces
   * 91 % — un cheveu de la photo d'à côté. Et comme les flashs sont
   * sur fond blanc, ce cheveu est BLANC.
   * ⚠️ JE NE PEUX PAS LE VOIR D'ICI : je n'ai que Chromium, qui ne
   * l'affiche pas. Ce qui suit corrige la CAUSE MESURABLE — le bord à
   * virgule — et la sonde te donne le nombre pour le vérifier.
   *
   * LE REMÈDE : une marge gauche de moins d'un pixel, qui ramène le
   * bord sur le pixel entier le plus proche. La largeur restant
   * entière (nº 280), les DEUX bords tombent alors juste, et il n'y a
   * plus un seul pixel partagé à trancher.
   * ⚠️ CE QU'IL NE TOUCHE PAS, et c'est le point : ni la largeur, ni
   * `scrollLeft`, ni l'accrochage, ni `offsetLeft` (les colonnes se
   * repèrent sur le cadre, pas sur la page) — le glissement, la
   * restauration de position et la fenêtre superposée ne voient rien
   * passer. Au doigt, où la photo touche les deux bords de l'écran,
   * le bord vaut déjà 0 : la correction est nulle et rien ne bouge.
   * ⚠️ RÉSERVÉ AUX FICHES (`variante="fiche"`) : la raison d'origine
   * (« une carte de mosaïque porte `content-visibility` et n'est pas
   * mise en page hors écran ») est tombée avec la nº 424-§3, mais la
   * borne reste : au doigt le bord vaut déjà 0, et la mosaïque n'a
   * jamais montré le besoin de cette correction — on ne l'élargit pas
   * sans motif.
   */
  /**
   * §2 (nº 296) — LA POSITION DU DÉFILEMENT S'ARRÊTE SUR UN MULTIPLE
   * ENTIER DE LA LARGEUR D'UNE COLONNE, TOUJOURS.
   * ==================================================================
   * LE DÉFAUT, ÉTABLI PAR LES PIXELS DU PROPRIÉTAIRE : un trait d'UN
   * pixel au bord GAUCHE de la photo, sur toute sa hauteur, dont la
   * couleur CHANGE — rgb(133,100,99), rgb(107,80,79), rgb(95,74,71),
   * rgb(82,61,59). Des teintes de peau : c'est LA PHOTO D'À CÔTÉ. À sa
   * gauche le fond de page, à sa droite la photo regardée.
   *
   * TOUT LE RESTE A ÉTÉ ÉLIMINÉ EN CINQ PASSES : plus aucun fond peint
   * dans la chaîne (nº 295), le rognage de chaque colonne prouvé au
   * pixel (nº 295), le débordement d'un pixel annulé (nº 295), les
   * largeurs sur des pixels entiers (nº 293). Il ne reste qu'une cause
   * possible : la position du défilement s'arrête sur une FRACTION de
   * pixel. À un décalage fractionnaire, la dernière colonne de pixels
   * de la photo précédente reste dans le cadre — au bord gauche, sur
   * toute la hauteur, et seulement à partir de la deuxième photo.
   *
   * LE REMÈDE : après chaque arrêt, on ramène la position au multiple
   * entier le plus proche. C'est une GARANTIE, pas un calcul de pas —
   * la nº 209-§7 interdit de calculer le pas du défilement, et on ne
   * le calcule pas : on lit la largeur que le navigateur a lui-même
   * donnée à une colonne, et on corrige seulement le RESTE.
   *
   * ⚠️ APRÈS L'ARRÊT, JAMAIS PENDANT. `scrollend` quand le navigateur
   * le sert (Chromium 114+, Safari 17+) ; sinon un repos de 140 ms
   * après le dernier `scroll`. Corriger en cours de geste combattrait
   * l'accrochage natif et hacherait le mouvement.
   * ⚠️ ET SEULEMENT SI LE RESTE EST NON NUL : ici, dans Chromium, il
   * vaut déjà zéro à tous les coups — la correction ne fait alors
   * rien du tout. Elle est écrite pour les moteurs qui s'arrêtent
   * entre deux pixels.
   * ⚠️ TOUS LES CHEMINS PASSENT PAR LÀ, sans exception : l'accrochage
   * natif, les flèches, les points, le doigt, la molette, le clavier
   * et la restauration de position — parce qu'ils produisent tous un
   * défilement, donc un arrêt.
   */
  useEffect(() => {
    const zone = cadre.current;
    if (!zone) return;
    let repos = 0;
    const recaler = () => {
      const premiere = zone.firstElementChild as HTMLElement | null;
      const pas = premiere?.getBoundingClientRect().width ?? 0;
      if (!(pas > 1)) return;
      const reste = zone.scrollLeft % pas;
      if (reste < 0.001 || pas - reste < 0.001) return;
      zone.scrollLeft = Math.round(zone.scrollLeft / pas) * pas;
    };
    const auRepos = () => {
      window.clearTimeout(repos);
      repos = window.setTimeout(recaler, 140);
    };
    //  `scrollend` est le bon signal ; le repos est le repli des
    //  moteurs qui ne le servent pas encore.
    zone.addEventListener("scrollend", recaler);
    zone.addEventListener("scroll", auRepos, { passive: true });
    return () => {
      window.clearTimeout(repos);
      zone.removeEventListener("scrollend", recaler);
      zone.removeEventListener("scroll", auRepos);
    };
  }, []);

  const [calage, setCalage] = useState(0);
  const calagePose = useRef(0);
  useEffect(() => {
    if (surCarte) return;
    const zone = cadre.current;
    if (!zone) return;
    let image = 0;
    const caler = () => {
      //  LA POSITION SANS CORRECTION — on retranche ce qu'on a déjà
      //  posé, sans quoi on corrigerait sa propre correction.
      const brut = zone.getBoundingClientRect().left - calagePose.current;
      const voulu = Math.round(brut) - brut;
      //  Moins d'un millième de pixel d'écart : il n'y a rien à faire
      //  (et surtout rien à réécrire — un état posé pour rien
      //  relancerait un rendu à chaque image).
      if (Math.abs(voulu - calagePose.current) < 0.001) return;
      calagePose.current = voulu;
      setCalage(voulu);
    };
    //  ⚠️ TOUJOURS DANS UNE IMAGE D'ATTENTE : la mise en page doit être
    //  finie avant qu'on mesure, et poser un état SYNCHRONEMENT dans un
    //  effet déclenche des rendus en cascade (le piège de la nº 272).
    const auChangement = () => {
      cancelAnimationFrame(image);
      image = requestAnimationFrame(caler);
    };
    auChangement();
    //  Le cadre change de taille : la fenêtre a bougé, la colonne de
    //  lecture aussi, une police est arrivée. On remesure.
    const observateur = new ResizeObserver(auChangement);
    observateur.observe(zone);
    window.addEventListener("resize", auChangement);
    return () => {
      cancelAnimationFrame(image);
      observateur.disconnect();
      window.removeEventListener("resize", auChangement);
    };
  }, [surCarte, cleDeLaSerie]);

  /**
   * UNE COLONNE MONTÉE RESTE MONTÉE (passe nº 219-§2)
   * ==================================================================
   * La nº 217-§6 avait élargi la fenêtre à deux voisines de chaque
   * côté, pour que ce qui naît soit hors du champ de vision. Il restait
   * un mouvement : ce qui MEURT — la colonne à deux rangs en arrière,
   * démontée au moment même où la photo s'immobilise. Le relevé du
   * propriétaire l'a vu (« DISPARAÎT IMG … ⚠️ +249 ms APRÈS L'ARRÊT »).
   *
   * LA RÈGLE EST DONC PLUS SIMPLE, ET C'EST LA SIENNE : une colonne
   * montée le reste. On n'ajoute jamais que des colonnes — toujours à
   * deux rangs au moins de celle qu'on regarde, donc invisibles — et on
   * n'en retire aucune tant que la série ne change pas. Plus rien ne
   * disparaît du cadre, jamais.
   *
   * CE QUE ÇA COÛTE : à parcourir vingt photos, vingt miniatures
   * finissent montées — celles qu'on a effectivement regardées, et
   * elles sont déjà téléchargées. La pleine résolution reste demandée
   * pour la seule photo regardée : c'est elle qui pèse.
   *
   * ⚠️ AJUSTEMENT PENDANT LE RENDU, le motif officiel de React (le même
   * que le compteur ci-dessus) : jamais de `setState` dans un effet.
   */
  const fenetreCourante = () => {
    const rangs = new Set<number>();
    //  §2 (nº 368) — une carte prend UNE voisine de chaque côté, une
    //  fiche en garde DEUX (voir les deux notes en tête de fichier).
    const rayon = surCarte ? VOISINES_CARTE : VOISINES;
    for (let rang = indice - rayon; rang <= indice + rayon; rang += 1) {
      if (rang >= 0 && rang < n) rangs.add(rang);
    }
    return rangs;
  };
  const [montees, setMontees] = useState<Set<number>>(fenetreCourante);
  const [serieMontee, setSerieMontee] = useState(cleDeLaSerie);
  if (serieMontee !== cleDeLaSerie) {
    //  NOUVELLE SÉRIE : on repart de sa seule fenêtre — les colonnes de
    //  l'ancienne n'existent plus, il n'y a rien à garder.
    setSerieMontee(cleDeLaSerie);
    setMontees(fenetreCourante());
  } else {
    const voulues = fenetreCourante();
    let manque = false;
    for (const rang of voulues) if (!montees.has(rang)) manque = true;
    if (manque) setMontees(new Set([...montees, ...voulues]));
  }
  /** LA DERNIÈRE POSITION QUE NOUS AVONS POSÉE — voir l'effet plus bas.
      ⚠️ ELLE EST AUSSI POSÉE PAR L'OBSERVATEUR (nº 217-§6) : un indice
      qui vient DU DOIGT ne doit jamais provoquer un `scrollTo` en
      retour, sans quoi on se bat avec le défilement natif. */
  const dernierPose = useRef(-1);
  /*  §2 (nº 308) — L'INDICE VOULU, LISIBLE DEPUIS L'EFFET DE SÉRIE.
       L'effet de série ne peut PAS dépendre de `indice` (il
       reconstruirait l'observateur à chaque photo — voir sa note de
       fin), mais il doit savoir SUR QUELLE PHOTO la série s'ouvre.
       ⚠️ ET LA RÉFÉRENCE NE S'ÉCRIT PAS PENDANT LE RENDU — la règle du
       projet, et le linteur la fait respecter. Elle s'écrit dans un
       effet À ELLE, DÉCLARÉ AVANT celui de la série : React exécute
       les effets DANS L'ORDRE DE DÉCLARATION, donc sur le rendu où la
       série ET l'indice changent ensemble, celui-ci a déjà posé la
       valeur quand l'autre la lit. */
  const indiceVoulu = useRef(indice);
  useEffect(() => {
    indiceVoulu.current = indice;
  }, [indice]);
  useEffect(() => {
    const zone = cadre.current;
    //  Les colonnes de l'ancienne série n'ont plus rien à dire : on
    //  taille le tableau à la série courante (les refs viennent d'y
    //  reposer les nœuds neufs).
    colonnes.current.length = n;
    /*  SONDE (nº 218-§1) — LA SÉRIE REÇUE. Le nombre de photos que le
        carrousel reçoit RÉELLEMENT, en face de ce que la fiche croyait
        demander : c'est là qu'on verra « aucune photo affichée ». */
    if (!surCarte) {
      noter(
        `SÉRIE reçue · ${n} photo(s) · « ${styleLabel} » · cadre ` +
          `${zone ? "présent" : "ABSENT"} │ ${inventaire()}`
      );
    }
    if (!zone || n <= 1) return;
    /*  §2 (nº 308) — UNE NOUVELLE SÉRIE S'OUVRE SUR LA PHOTO DEMANDÉE,
        ET NE PASSE PLUS PAR LA PREMIÈRE.
        ------------------------------------------------------------
        CE QUI ÉTAIT ÉCRIT ICI : `scrollLeft = 0` et
        `dernierPose = 0` — « une nouvelle série commence à sa
        première photo ». L'intention était juste (ne pas garder le
        défilement de la série précédente) ; le moyen ouvrait une
        COURSE, et c'est le seul chemin qui donne le symptôme du
        propriétaire (« cliquer la 4ᵉ photo n'affiche rien ») :
         · cet effet-ci remettait la piste à zéro et créait
           l'observateur ;
         · l'effet de repositionnement, déclaré APRÈS, visait la photo
           demandée ;
         · entre les deux, l'observateur pouvait mesurer la colonne 0
           — celle sous les yeux à cet instant — et l'annoncer à la
           fiche (`surChangement(0)`), qui reposait alors son indice à
           0. La photo touchée était perdue en route.
        Plus de passage par zéro : on POSE directement la colonne
        demandée, et on note cette position comme la nôtre. Le
        défilement de la série précédente est écarté tout aussi
        sûrement — c'est une position choisie, pas une position
        gardée. L'observateur, à sa première mesure, voit déjà la
        bonne colonne : il n'a plus rien à corriger.
        ⚠️ REPLI SUR ZÉRO quand la colonne demandée n'existe pas
        encore (indice hors bornes après un changement de série) :
        c'est exactement l'ancien comportement. */
    const colonneVoulue = colonnes.current[indiceVoulu.current];
    zone.scrollLeft = colonneVoulue ? colonneVoulue.offsetLeft : 0;
    dernierPose.current = colonneVoulue ? indiceVoulu.current : 0;
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const entree of entrees) {
          if (!entree.isIntersecting) continue;
          const rang = colonnes.current.indexOf(
            entree.target as HTMLDivElement
          );
          if (rang < 0) continue;
          //  ⚠️ CET INDICE VIENT DU DÉFILEMENT LUI-MÊME : on le note
          //  comme « déjà en place » AVANT de l'annoncer, pour que
          //  l'effet de repositionnement n'aille pas rejouer un
          //  `scrollTo` par-dessus le geste en cours (nº 217-§6). Le
          //  seuil de 60 % se franchit souvent AVANT la fin de
          //  l'accrochage : la piste sautait alors à la colonne, en
          //  travers de l'élan du doigt — et l'on voyait passer la
          //  tranche d'une image.
          dernierPose.current = rang;
          if (!surCarte) noter(`INDICE → ${rang} · origine DOIGT (défilement)`);
          surChangement(rang);
        }
      },
      { root: zone, threshold: 0.6 }
    );
    for (const colonne of colonnes.current) {
      if (colonne) observateur.observe(colonne);
    }
    ressource("observateur intersection", 1);

    /*  SONDE (nº 218-§1) — L'ARRÊT DU DÉFILEMENT. C'est le repère des
        300 ms : la sonde note ensuite tout ce qui apparaît ou disparaît
        dans le cadre pendant ce délai. On l'obtient par un silence de
        120 ms après le dernier `scroll` — `scrollend` n'existe pas
        partout, et on ne peut pas se permettre de le supposer. */
    let silence = 0;
    const auDefilement = () => {
      window.clearTimeout(silence);
      silence = window.setTimeout(() => {
        if (surCarte) return;
        const images = zone.querySelectorAll("img");
        let chargees = 0;
        for (const image of images) {
          if (image.complete && image.naturalWidth > 0) chargees += 1;
        }
        noterArret(
          `scrollLeft ${Math.round(zone.scrollLeft)} · overflow ` +
            `${getComputedStyle(zone).overflowX} · largeur ${zone.clientWidth} · ` +
            `colonnes montées ${zone.children.length} · images ${images.length} ` +
            `(chargées ${chargees}, vides ${images.length - chargees})`
        );
      }, 120);
    };
    zone.addEventListener("scroll", auDefilement, { passive: true });
    ressource("écouteur scroll", 1);

    return () => {
      observateur.disconnect();
      ressource("observateur intersection", -1);
      zone.removeEventListener("scroll", auDefilement);
      ressource("écouteur scroll", -1);
      window.clearTimeout(silence);
    };
    //  ⚠️ `indice` N'EST PAS DANS CETTE LISTE, ET NE DOIT PAS Y ÊTRE :
    //  l'observateur serait reconstruit à chaque photo. Les deux ajouts
    //  de la sonde (`surCarte`, `styleLabel`) ne changent qu'avec la
    //  série, donc en même temps que `cleDeLaSerie`.
  }, [cleDeLaSerie, n, surChangement, surCarte, styleLabel]);

  /**
   * ALLER À UNE PHOTO — les flèches, les points, et tout changement
   * venu de la fiche (choisir un ensemble remet à zéro).
   * `offsetLeft` est la position que LE NAVIGATEUR a donnée à cette
   * colonne : on ne la calcule pas, on la lit.
   */
  /*  ⚠️ LA VARIANTE, DANS UNE RÉFÉRENCE (nº 218-§1) : `allerA` est
      appelée depuis un effet, et une fonction qui lit une VALEUR du
      rendu en devient une dépendance. Une référence, non — et la
      variante d'un carrousel ne change jamais de sa vie. La sonde ne
      modifie donc pas les dépendances de l'effet qu'elle observe. */
  const varianteRef = useRef(variante);
  function allerA(rang: number, doux: boolean, origine = "code") {
    const zone = cadre.current;
    const colonne = colonnes.current[rang];
    if (varianteRef.current !== "carte") {
      noter(
        `INDICE → ${rang} · origine ${origine.toUpperCase()} · ` +
          `cadre ${zone ? "présent" : "ABSENT"} · colonne ` +
          `${colonne ? "présente" : "ABSENTE"}`
      );
    }
    if (!zone || !colonne) return;
    zone.scrollTo({
      left: colonne.offsetLeft,
      behavior: doux ? "smooth" : "instant",
    });
  }

  /** L'indice vient de la fiche : on s'y rend, sans animation (c'est un
      changement d'ensemble, pas un défilement).
      ⚠️ ET SEULEMENT DE LA FICHE : quand il vient du doigt, l'observateur
      a déjà posé `dernierPose`, et cet effet ne fait rien (nº 217-§6).
      La comparaison de position qui servait de garde-fou ne suffisait
      pas — au moment où l'observateur parle, le défilement est encore
      en route, l'écart est donc grand, et l'on téléportait la piste. */
  useEffect(() => {
    if (n <= 1) return;
    if (dernierPose.current === indice) return;
    const zone = cadre.current;
    const colonne = colonnes.current[indice];
    if (!zone || !colonne) return;
    if (Math.abs(zone.scrollLeft - colonne.offsetLeft) > 1) {
      allerA(indice, false, "code (fiche)");
    }
    dernierPose.current = indice;
  }, [indice, n]);

  /**
   * §2 (nº 372) — SUR UNE CARTE, LA PHOTO RETENUE EST LÀ DÈS LA
   * PREMIÈRE IMAGE.
   * ------------------------------------------------------------------
   * L'effet ci-dessus se place APRÈS la peinture : au retour, une carte
   * semée sur sa photo 5 aurait montré la 1 pendant une image, puis
   * sauté. Ici, on pose le défilement AVANT la peinture, une seule fois,
   * au montage — la première image peinte est déjà la bonne photo.
   * ⚠️ RIEN DE GÉOMÉTRIQUE : on écrit `scrollLeft`, exactement ce que
   * fait `allerA` — au même endroit, simplement plus tôt. Aucune
   * classe, aucune largeur, aucune hauteur n'est touchée.
   * ⚠️ LES CARTES SEULEMENT : une fiche s'ouvre par son adresse, elle a
   * son propre chemin (nº 302) et ne doit rien recevoir d'ici.
   *
   * ██ §2 (nº 373) — ET AU DOIGT SEULEMENT ██
   * Sur le web, la fenêtre se pose PAR-DESSUS la mosaïque : rien n'est
   * démonté, donc rien n'est à replacer — cette pose n'y a jamais servi
   * à quoi que ce soit. On la borne à l'appareil tactile, le seul où le
   * retour démonte vraiment la mosaïque. Une écriture de `scrollLeft` de
   * moins sur le web, c'est une occasion de moins de déplacer une piste
   * que personne n'avait demandé de déplacer.
   */
  useEffetAvantPeinture(() => {
    if (typeof document !== "undefined") {
      if (document.documentElement.dataset.appareil !== "mobile") return;
    }
    if (!surCarte || indice <= 0) return;
    const zone = cadre.current;
    const colonne = colonnes.current[indice];
    if (!zone || !colonne) return;
    zone.scrollLeft = colonne.offsetLeft;
    //  L'observateur ne doit pas croire à un geste, et l'effet
    //  d'au-dessus n'a plus rien à rattraper.
    dernierPose.current = indice;
    //  AU MONTAGE, UNE FOIS : `indice` est lu à cet instant et ne doit
    //  pas relancer la pose (le défilement du doigt s'en charge, et
    //  l'effet du dessus rattrape tout changement venu de la fiche).
  }, []);

  /** Avance (+1) ou recule (−1) — DANS les bornes, c'est tout. */
  function aller(sens: 1 | -1) {
    const cible = indice + sens;
    if (cible < 0 || cible >= n) return;
    allerA(cible, true, "flèche");
  }

  /**
   * §1 (nº 297) — LA PHOTO EST DEUX PIXELS PLUS ÉTROITE QUE SA COLONNE,
   * CENTRÉE DEDANS. LE TRAIT DE LA VOISINE DEVIENT IMPOSSIBLE.
   * ==================================================================
   * LE FAIT QUI TRANCHE, ET QUI MANQUAIT AUX CINQ PASSES PRÉCÉDENTES :
   * le trait est INTERMITTENT — « des fois elle n'y est pas, d'un coup
   * elle va y être ». Un fond peint serait là EN PERMANENCE. Une
   * intermittence est la signature d'un ARRÊT DE DÉFILEMENT qui tombe
   * tantôt juste, tantôt sur une fraction de pixel.
   *
   * POURQUOI IL EST INMESURABLE D'ICI, ET POURQUOI LES VINGT RESTES À
   * ZÉRO DE LA nº 296 NE PROUVENT RIEN : WebKit RAPPORTE une position
   * de défilement ARRONDIE alors que le décalage réellement PEINT peut
   * être fractionnaire. Depuis le code, tout paraît entier — le chiffre
   * lu est faux. On ne peut donc RIEN fonder sur une valeur lue.
   *
   * LE REMÈDE NE DÉPEND D'AUCUNE MESURE. La photo n'occupe plus toute
   * sa colonne : elle laisse UN PIXEL LIBRE DE CHAQUE CÔTÉ, où rien
   * n'est peint (la chaîne est transparente depuis la nº 295 — donc
   * c'est la page, l'anthracite). Quel que soit le décalage
   * fractionnaire, et quel que soit le moteur, ce qui peut apparaître
   * au bord du cadre est au pire ce pixel de page : invisible sur
   * l'anthracite. LA PHOTO VOISINE NE PEUT PLUS PHYSIQUEMENT ATTEINDRE
   * LE BORD DU CADRE — ce n'est plus une affaire de précision, c'est
   * une impossibilité géométrique. C'est le raisonnement qui a réglé le
   * trait gris en nº 295 : on n'essaie plus de coller au pixel, on
   * supprime ce qui rend l'écart visible.
   *
   * CE QUE ÇA COÛTE : deux pixels de largeur d'image sur ~660, soit
   * 0,3 %. `object-cover` recadre, rien ne se déforme.
   * ⚠️ CE QUE ÇA NE TOUCHE PAS : la colonne, elle, garde sa largeur de
   * 100 % — donc le pas du défilement, l'accrochage, `offsetLeft`, la
   * restauration de position, le format 4/5 et la hauteur réservée sont
   * strictement inchangés. Seule l'IMAGE rétrécit, à l'intérieur.
   * ⚠️ LA PAGE PLEINE, ET ELLE SEULE :
   *  · les CARTES de la mosaïque ne changent pas (leur trait n'a jamais
   *    été signalé, et leurs miniatures sont bien plus petites) ;
   *  · la FENÊTRE CENTRÉE SUPERPOSÉE ne change pas — elle vient d'être
   *    remise dans son état d'avant la nº 292 (`dansLaFenetre`) et
   *    n'aurait jamais dû être touchée.
   */
  /*  ██ §1 (nº 433) — LA PHOTO REGARDÉE ÉPOUSE SON CADRE ; SES
      VOISINES GARDENT LEUR PIXEL DE GARDE ██
      ==================================================================
      LE LISERÉ, MESURÉ SUR LE RENDU RÉEL (la méthode des nº 406-416) :
       · PAGE MOBILE (photo bord à bord depuis `mobile:-mx-4`) : la
         rétraction nº 297 ci-dessus laisse 1 px de page de CHAQUE
         CÔTÉ — relevé : colonne 0→390, image 1→389. Invisible tant
         que la photo vivait au milieu d'une page anthracite ; contre
         les bords de l'écran, ce pixel se voit.
       · FENÊTRE SUPERPOSÉE : pas de rétraction (image pleine
         colonne), mais des FRACTIONS DE PIXEL — la boîte photo tire
         sa largeur de la hauteur (589,234 px au relevé), le cadre
         s'arrondit au pixel inférieur (589, nº 280) : 0,09 à 0,30 px
         du FOND NOIR de la boîte restent visibles sur les côtés et
         en bas, « tout autour » selon où tombent les virgules.
      LA CORRECTION, celle demandée : AGRANDIR LA PHOTO — un
      agrandissement UNIFORME (`scale`, aucune déformation, la source
      inchangée — règle 175-§5), appliqué À LA PHOTO REGARDÉE SEULE.
      Ses voisines gardent la rétraction nº 297 : leur photo ne peut
      toujours pas atteindre le bord du cadre, le trait intermittent
      de la voisine reste une impossibilité géométrique — les deux
      acquis tiennent ensemble. Le débord de l'agrandissement est
      rogné par la colonne (`overflow-hidden`, page) ou l'enveloppe de
      la fenêtre : rien n'atteint jamais la colonne d'à côté, et ni le
      flux, ni `offsetLeft`, ni le pas d'accrochage ne bougent (un
      `transform` ne déplace aucune boîte).
      LES DEUX FACTEURS, calculés sur les relevés :
       · mobile : 1,008 — l'image de 388 px s'étend de 1,55 px de
         chaque côté : le pixel de garde est couvert, ~0,55 px de
         photo rognés par bord (le propriétaire autorise « un ou
         deux ») ;
       · fenêtre : 1,002 — 0,59 px par côté sur 589 : les virgules
         mesurées (≤ 0,30) sont couvertes, sans rogner plus.
      ⚠️ LA PAGE PLEINE DU WEB NE BOUGE PAS D'UN PIXEL : le facteur
      mobile vit sous la variante `mobile:` (l'attribut d'appareil) —
      sur le web pleine page, la classe rendue est STRICTEMENT celle
      d'avant. Les cartes de la mosaïque : inchangées aussi. */
  const photoDansSaColonne = (regardee: boolean) =>
    surCarte
      ? "absolute inset-0 h-full w-full object-cover"
      : dansLaFenetre
        ? `absolute inset-0 h-full w-full object-cover${
            regardee ? " scale-[1.002]" : ""
          }`
        : `absolute inset-y-0 left-px h-full w-[calc(100%_-_2px)] object-cover${
            regardee ? " mobile:scale-[1.008]" : ""
          }`;

  /** Le texte de remplacement d'une photo : le style, et sa légende
      quand elle est taguée (« Avant-bras · Couleur »). */
  const texteDe = (photo: PhotoGalerie) =>
    `Portfolio de ${nomTatoueur} — ${styleLabel}${
      photo.legende ? ` · ${photo.legende}` : ""
    }`;

  /* LA CAPSULE « 3/12 » — AUCUNE quand l'ensemble n'a qu'une photo. Le
     texte se replie (largeur ET opacité) pour ne laisser que la
     flèche ; les deux mouvements sont doux, la réapparition est quasi
     immédiate — jamais de clignotement.
     §1 (nº 307) — ELLE S'AFFICHE AUSSI SUR LE WEB, et c'est LE MÊME
     ÉLÉMENT, pas une copie : la mécanique des trois secondes
     (`compteurVisible`, réarmée par `reveils` et par `indice`) et la
     flèche minimale qui reste sont donc rigoureusement identiques aux
     deux largeurs — elles ne peuvent pas diverger, il n'y en a qu'une.
     SEULE LA PLACE CHANGE, et c'est imposé par les boutons déjà là :
      · au doigt, l'angle HAUT DROIT (inchangé) — le cœur occupe le bas
        droit (voir FicheTatoueur, `variante="fiche-mobile"`) ;
      · au web, l'angle BAS DROIT — le cœur occupe le haut droit et le
        partage le haut gauche.
     ⚠️ `mobile:` n'est pas une largeur mais un POINTEUR
     (`[data-appareil="mobile"]`, voir globals.css) : la bascule suit
     l'appareil, comme partout ailleurs dans ce fichier. */
  const enFinDeGalerie = indice >= n - 1;
  /**
   * §2 et §5 (nº 367) — LA MÊME CAPSULE SUR LES CARTES, ET SES TROIS
   * GABARITS.
   * ------------------------------------------------------------------
   * · FICHE (page ou fenêtre) : capsule 10/6, texte 12, flèche 10 —
   *   inchangé, au pixel ;
   * · CARTE PLEINE LARGEUR : la même, à l'identique — l'image y occupe
   *   tout l'écran, rien ne justifie de la rapetisser ;
   * · CARTE CÔTE À CÔTE : réduite — capsule 8/4, texte 10, flèche 8.
   *   Une carte de 190 px ne peut pas porter le même bandeau qu'une
   *   photo de 390.
   * ⚠️ SUR UNE CARTE, ELLE EST RÉSERVÉE AU DOIGT : `hidden
   *   mobile:inline-flex`. Le web ne montre RIEN de neuf sur les cartes
   *   du moteur (ni fanion, ni capsule) — et c'est une bascule de
   *   feuille de style, pas un rendu conditionnel : aucun risque
   *   d'écart d'hydratation, aucun décalage.
   * ⚠️ ELLE N'OUVRE JAMAIS LA FICHE : elle est posée HORS du lien de
   *   chaque photo, au-dessus (`z-[2]`), et ne laisse pas passer le
   *   toucher (surtout pas de `pointer-events-none` ici).
   */
  const compteur = n > 1 && (
    <span
      /*  ⚠️ TEMPORAIRE (nº 218-§1) : la sonde nomme ce qui apparaît ou
          disparaît dans le cadre. Sans ce nom, son relevé dirait
          « SPAN » — inexploitable. */
      data-role="compteur"
      className={`absolute z-[2] items-center rounded-full bg-black/60
                 backdrop-blur text-white ${
                   surCarte
                     ? //  §2 (nº 369) — L'ÉCRITURE DU FANION, LA SEULE
                       //  ÉPROUVÉE, ET ELLE EST LA MÊME POUR LES TROIS :
                       //  l'élément est RENDU, puis rendu INVISIBLE sur
                       //  un pointeur fin, et redevenu visible au survol
                       //  de la carte (le `group` est l'article de
                       //  CarteTatoueur). Au doigt, `pointer-fine` ne
                       //  s'applique pas : la capsule est là en
                       //  permanence, comme à la nº 367.
                       //  ⚠️ `invisible`, PAS `hidden` : la visibilité
                       //  ne retire pas la place — rien ne bouge quand
                       //  la souris arrive — et un élément invisible ne
                       //  reçoit aucun clic.
                       `inline-flex pointer-fine:invisible
                        pointer-fine:group-hover:visible top-2 right-2 ${
                          badgeReduit ? "px-2 py-1" : "px-2.5 py-1.5"
                        }`
                     : //  §1 (nº 375) — SUR UNE FICHE, LA CAPSULE EST EN
                       //  HAUT, SUR LES DEUX APPAREILS.
                       //  ------------------------------------------
                       //  Elle était en bas sur le web et en haut au
                       //  doigt (`mobile:bottom-auto mobile:top-3`) —
                       //  c'est ce couple qui disparaît, le web
                       //  rejoignant la place du doigt. Au doigt,
                       //  RIEN NE CHANGE : `top-3` y était déjà la
                       //  valeur retenue, elle est simplement écrite
                       //  une fois au lieu de deux. Le fanion fait le
                       //  chemin inverse (FicheTatoueur, FenetreFiche).
                       //  ⚠️ Ni gabarit, ni rembourrage, ni couleur, ni
                       //  angle : seule l'ancre verticale bouge.
                       "inline-flex right-3 top-3 px-2.5 py-1.5"
                 }`}
    >
      <span
        aria-hidden={!compteurVisible}
        className={`overflow-hidden whitespace-nowrap
                   ${badgeReduit && surCarte ? "text-[10px]" : "text-[12px]"}
                   font-semibold tabular-nums
                   transition-[max-width,opacity,margin-right] ease-out ${
                     compteurVisible
                       ? `max-w-[64px] opacity-100 duration-150 ${
                           badgeReduit && surCarte ? "mr-1" : "mr-1.5"
                         }`
                       : "max-w-0 opacity-0 mr-0 duration-500"
                   } ${
                     //  §3 (nº 369) — SUR LE WEB, LA CAPSULE MONTRE LE
                     //  COMPTE dès qu'elle apparaît : le repli des trois
                     //  secondes est une mécanique DU DOIGT (elle se
                     //  déplie au défilé), et la souris ne défile pas.
                     //  Le survol ouvre donc le texte, en CSS, sans
                     //  toucher à l'état — celui-ci continue de mener au
                     //  doigt, exactement comme à la nº 367.
                     surCarte
                       ? `pointer-fine:group-hover:max-w-[64px]
                          pointer-fine:group-hover:opacity-100 ${
                            badgeReduit
                              ? "pointer-fine:group-hover:mr-1"
                              : "pointer-fine:group-hover:mr-1.5"
                          }`
                       : ""
                   }`}
      >
        {indice + 1}/{n}
      </span>
      {/*  LA FLÈCHE MINIMALE — le repère permanent : vers la droite
           tant qu'il reste des photos, vers la gauche en fin de
           galerie. Elle pivote en douceur, elle ne clignote pas. */}
      <svg
        //  §5 (nº 367) — 8 px sur une carte côte à côte, 10 partout
        //  ailleurs (fiche et carte pleine largeur).
        width={badgeReduit && surCarte ? "8" : "10"}
        height={badgeReduit && surCarte ? "8" : "10"}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={`shrink-0 transition-transform duration-500 ${
          enFinDeGalerie ? "rotate-180" : ""
        }`}
      >
        <path
          d="M9.5 5.5 16 12l-6.5 6.5"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );

  /* POINTEUR SOURIS (toute largeur) : les deux flèches, discrètes,
     mi-hauteur — la gauche seulement après le premier défilement, la
     droite jamais à la dernière photo. */
  const fleche = (sens: 1 | -1) => (
    <button
      type="button"
      aria-label={sens === 1 ? "Photo suivante" : "Photo précédente"}
      data-role={sens === 1 ? "flèche droite" : "flèche gauche"}
      //  §4 (nº 368) — ⚠️ LES DEUX GARDES : sur une carte, le bouton
      //  est posé au-dessus du lien étiré ; sans elles, un clic
      //  ouvrirait la fiche EN PLUS de faire défiler.
      onClick={(evenement) => {
        evenement.preventDefault();
        evenement.stopPropagation();
        aller(sens);
      }}
      className={`hidden pointer-fine:flex absolute z-[2] ${
        //  §2 (nº 369) — LA MÊME ÉCRITURE QUE LE FANION : sur une
        //  carte, la flèche EXISTE dès que la souris existe
        //  (`pointer-fine:flex`, comme la fiche), puis elle est rendue
        //  INVISIBLE tant que la carte n'est pas survolée. Au doigt,
        //  rien de tout cela ne s'applique : `hidden` seul, aucune
        //  flèche, comme avant.
        /*  §2 (nº 394) — SUR UNE FICHE, ELLE S'ÉTEINT AU REPOS.
             ------------------------------------------------------
             L'OPACITÉ, ET PAS LA VISIBILITÉ : le propriétaire veut une
             disparition DOUCE, or `visibility` ne se dégrade pas — elle
             saute. `opacity` s'anime, et elle ne retire RIEN de la mise
             en page : la flèche garde sa boîte, sa position, sa taille,
             rien ne se décale à l'allumage comme à l'extinction.
             ⚠️ ELLE RESTE CLIQUABLE MÊME ÉTEINTE, et c'est voulu : si
             le curseur s'est arrêté juste dessus, les trois secondes
             passent et un clic doit quand même faire défiler. On ne
             pose donc pas `pointer-events-none` — l'éteindre ne la
             désarme pas.
             ⚠️ LA TRANSITION EST DÉPLACÉE DANS CE TERNAIRE, et c'est
             une nécessité, pas un goût : `transition-property` est UNE
             déclaration — deux classes de transition sur le même
             élément se disputeraient l'ordre de la feuille (le piège de
             la nº 389). Chaque branche écrit donc la sienne, une seule
             fois. LA CARTE GARDE EXACTEMENT `transition-colors` : son
             survol de la nº 368-369 n'est pas touché d'un pixel ni
             d'une milliseconde. */
        surCarte
          ? "pointer-fine:invisible pointer-fine:group-hover:visible transition-colors"
          : `${
              flechesEveillees ? "opacity-100" : "opacity-0"
            } transition-[opacity,background-color] duration-200`
      } ${sens === 1 ? "right-2.5" : "left-2.5"}
      top-1/2 -translate-y-1/2 rounded-full
      ${
        //  §5 (nº 368) — LE GABARIT SUIT LA CARTE : 28 px sur une carte
        //  de mosaïque (l'image n'y fait que 300 à 340 px de large),
        //  36 px sur une fiche — inchangé.
        surCarte ? "w-7 h-7" : "w-9 h-9"
      }
      bg-sombre-fond/55 backdrop-blur items-center justify-center
      text-sombre-texte hover:bg-sombre-eleve/75`}
    >
      <svg
        width={surCarte ? "14" : "18"}
        height={surCarte ? "14" : "18"}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d={sens === 1 ? "M9.5 5.5 16 12l-6.5 6.5" : "M14.5 5.5 8 12l6.5 6.5"}
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  /**
   * §5 (nº 198) — LA PAGINATION DU WEB, EN BAS AU CENTRE
   * ==================================================================
   * CAS A — CINQ PHOTOS OU MOINS : tous les ronds, à taille pleine,
   * fixes et centrés. Le rond actif est BLANC ILLUMINÉ (jamais rose —
   * la charte le réserve à d'autres emplois) et se déplace de rond en
   * rond. Aucun glissement, aucune réduction.
   *
   * CAS B — PLUS DE CINQ : une frise de SEPT crans au plus, en trois
   * temps :
   *  · AU DÉBUT, l'actif est à l'extrême gauche — trois ronds pleins à
   *    gauche, puis 75 % et 50 % vers la droite : le sens du défilement
   *    s'annonce ;
   *  · AU MILIEU, la frise glisse et l'actif se stabilise au centre —
   *    trois ronds pleins au milieu, les extrémités décroissent
   *    symétriquement (75 %, 50 %) ;
   *  · À LA FIN, la frise cesse de glisser et l'actif migre vers la
   *    droite jusqu'au dernier rond.
   */
  //  §1 (nº 368) — `paginationWeb` EST SUPPRIMÉE, code compris : elle
  //  n'avait plus qu'un emploi (les cartes de la mosaïque), et le
  //  propriétaire retire les points des cartes. La frise elle-même
  //  (`PointsDuCarrousel`, en bas de ce fichier) reste : la fenêtre de
  //  carrousel du smartphone la rend sous la photo (nº 284).

  /**
   * ⚠️ LA BRANCHE « UNE SEULE PHOTO » A ÉTÉ SUPPRIMÉE (nº 219-§3)
   * ==================================================================
   * Elle rendait un arbre COMPLÈTEMENT DIFFÉRENT : pas de cadre qui
   * défile, donc pas de `ref`, donc la sonde relevait « cadre ABSENT »
   * — et une série d'une photo n'affichait parfois rien du tout.
   * Deux chemins de rendu pour une même chose, c'est deux fois plus
   * d'occasions de se tromper, et c'est celui qu'on regarde le moins
   * qui casse.
   *
   * IL N'Y EN A PLUS QU'UN. Avec une seule photo, le cadre existe,
   * n'a rien à faire défiler (une seule colonne, large de 100 %), et
   * tout ce qui suppose un choix disparaît de lui-même : les flèches
   * (`indice > 0` / `indice < n − 1` sont faux), le compteur (`n > 1`)
   * et les ronds (`n > 1`). Exactement ce que demande le propriétaire :
   * « une série d'une seule photo doit s'afficher normalement, sans
   * flèches ni ronds ».
   */
  return (
    <div
      role="region"
      aria-roledescription="carrousel"
      aria-label={`Portfolio de ${nomTatoueur} — ${styleLabel}`}
      /*  ⚠️ TEMPORAIRE (nº 218-§1) : c'est par cet attribut que la sonde
          TROUVE le carrousel — elle n'en connaît rien d'autre. */
      data-carrousel={variante}
      //  §1 (nº 247) — CE QUE CE CARROUSEL DÉCLARE MONTRER. Vide : un
      //  style entier, il ne promet aucune catégorie.
      data-serie-nature={natureDeLaSerie || undefined}
      /*  §2 (nº 394) — LE GESTE QUI RÉVEILLE LES FLÈCHES SE LIT ICI, ET
           NULLE PART AILLEURS. Cette racine est EXACTEMENT la surface de
           la photo : c'est elle qui porte le cadre, les colonnes et les
           flèches (elle est leur `relative`). Un mouvement ailleurs sur
           la page ne la traverse donc pas — le déclencheur est bien « la
           souris SUR LA PHOTO », comme demandé, sans qu'aucune
           géométrie n'ait à être calculée.
           ⚠️ `undefined` QUAND IL N'Y A RIEN À RÉVEILLER : une carte de
           mosaïque (son survol de la nº 369 est intact) et un carrousel
           d'une seule photo (aucune flèche n'existe) ne reçoivent aucune
           fonction. Voir la note complète du réveil, plus haut. */
      onPointerMove={flechesQuiDorment ? reveillerLesFleches : undefined}
      onPointerLeave={flechesQuiDorment ? endormirLesFleches : undefined}
      /*  §1 (nº 294) — LA RACINE NE PEINT PLUS RIEN. C'ÉTAIT ELLE, LE
           LISERÉ : `bg-sombre-carte` (#28282D) est UN CRAN PLUS CLAIR
           que la page, et il occupait toute la boîte du carrousel —
           donc le moindre pixel que la photo ne couvrait pas
           l'affichait en clair, tout autour d'elle. La nº 293 a fait
           tomber les fractions à zéro dans Chromium sans faire
           disparaître le trait : c'est qu'il ne fallait pas chercher
           un pixel de plus, mais retirer ce qu'il y avait DESSOUS.
           §1-b (nº 295) — ET PLUS AUCUNE BOÎTE DE LA CHAÎNE NE PEINT :
           ni l'enveloppe, ni cette racine, ni le cadre, ni la colonne,
           ni la boîte de la photo. C'est le seul remède qui ne peut
           pas échouer : on n'essaie plus de coller au pixel, on efface
           ce qui rendait l'écart visible. S'il manque un demi-pixel,
           il montre la page en pleine page et le fond de la fenêtre en
           superposé — la même couleur que tout autour, invisible quel
           que soit le moteur de rendu.
           LA RÉSERVATION DE LA nº 280 TIENT SANS COULEUR : elle vient
           du format 4/5 (cadre et colonne), pas d'un fond. La hauteur
           est connue avant la première image ; la page ne saute pas. */
      className={`relative select-none${dansLaFenetre ? " bg-sombre-carte" : ""}`}
    >
      {/* LE CADRE QUI DÉFILE — le navigateur fait tout : l'inertie du
          doigt, l'accrochage d'une photo à la fois (`snap-always`), et
          les butées franches aux extrémités. La barre de défilement est
          masquée : elle n'apprendrait rien.
          ⚠️ `relative` : c'est ce qui fait de ce cadre le repère des
          colonnes — `offsetLeft` s'y rapporte, et c'est la seule
          position que les flèches utilisent.
          ⚠️ `touch-action: pan-x pan-y` — le navigateur garde les deux
          défilements, mais PAS le pincement : celui-ci est à nous
          (ZoomPincement). Le temps du zoom, le cadre cesse de défiler
          et l'accrochage est levé. */}
      {/*  §4 (nº 280) — LE CADRE PREND UNE LARGEUR ENTIÈRE, et c'est la
           correction du « morceau de la photo d'à côté ».
           LA CAUSE, MESURÉE : sur une fiche de page (web), la colonne
           de la photo est fluide et tombe sur une largeur FRACTIONNAIRE
           — relevé 664,796875 px. Chaque colonne du carrousel fait
           100 % de cette largeur, mais les positions d'arrêt du
           défilement, elles, sont ARRONDIES À L'ENTIER (relevé : 0,
           665, 1330, 1994). L'écart s'accumule photo après photo —
           +0,203 px, +0,406 px, −0,391 px… — et ce qui dépasse du bord
           gauche, c'est la tranche de la photo précédente. D'où
           l'intermittence : l'écart change à chaque photo et repasse
           parfois par zéro.
           LE REMÈDE : `round(down, 100%, 1px)` — le cadre s'aligne sur
           le pixel entier inférieur, donc les colonnes aussi (elles
           font 100 % de lui), donc les positions d'arrêt tombent
           JUSTE. On perd moins d'un pixel de largeur, invisible, et
           rien d'autre ne bouge : ni le format 4:5, ni la hauteur
           réservée, ni la charte (aucune valeur graphique n'est
           écrite ici).
           ⚠️ UN NAVIGATEUR QUI NE CONNAÎT PAS `round()` IGNORE LA
           DÉCLARATION et retrouve exactement le comportement d'avant :
           aucune régression possible. (Chromium la connaît — le banc
           mesure 0,000 px d'écart sur vingt défilements.) */}
      <div
        ref={cadre}
        data-role="cadre"
        /*  §1 (nº 292) — LA HAUTEUR DU CADRE DÉCOULE DE SA LARGEUR, ET
             DE RIEN D'AUTRE.
             ------------------------------------------------------------
             LE DÉFAUT MESURÉ CHEZ LE PROPRIÉTAIRE (Safari, 1440 × 823) :
             un cadre large de 565,594 px et haut de 912,313 — rapport
             1,613 au lieu de 1,25. La largeur obéissait au calcul de la
             nº 290 ; la HAUTEUR, non : elle venait du contenu.
             LA MÉCANIQUE, REPRODUITE ICI AU BANC (et elle n'est pas
             propre à Safari) : sur une boîte à `aspect-ratio`,
             `min-height: auto` vaut LA HAUTEUR DU CONTENU. Le rapport ne
             pose donc qu'une hauteur SOUHAITÉE — le moindre élément en
             flux plus haut que lui la repousse, et la colonne, puis le
             cadre, puis l'enveloppe grandissent avec. Mesuré : un enfant
             de 912 px en flux fait passer le cadre de 706 à 1618 px.
             LE REMÈDE, EN DEUX TEMPS ET SANS UNE SEULE CONSTANTE :
              · `min-h-0` retire ce minimum-contenu — le rapport
                redevient une règle, plus un souhait ;
              · le cadre porte LUI-MÊME le format 4/5. Il est un
                CONTENEUR DE DÉFILEMENT (`overflow-x-auto`) : une fois sa
                hauteur définie par sa largeur, aucun contenu ne peut
                plus la changer — ce qui dépasse défile ou se rogne. La
                hauteur est donc connue AVANT la première image, la
                réservation de la nº 280 est tenue, et la photo se
                recadre à l'intérieur (`object-cover`) au lieu d'étirer
                son cadre.
             ⚠️ CE QU'IL NE TOUCHE PAS : la largeur entière
             (`round(down,100%,1px)`, nº 280), le défilement natif avec
             accrochage (nº 209-§7), le calage au pixel (nº 282) et la
             restauration de position — aucune de ces écritures ne parle
             de hauteur. */
        /*  §3 (nº 293) — PAS DE CADRE SANS PHOTO. Le format 4/5 que la
             nº 292 a posé ici donne une hauteur À COUP SÛR — y compris
             quand il n'y a rien à montrer, ce qui ferait un grand
             rectangle noir là où, avant elle, il n'y avait rien du
             tout. Un carrousel vide ne réserve donc aucune place :
             c'est au reste de la page de dire ce qui manque. */
        className={`relative flex w-[round(down,100%,1px)] ${
          dansLaFenetre ? "" : `${n > 0 ? CADRE_PHOTO_PORTFOLIO : ""} min-h-0`
        } ${
          zoomEnCours
            ? "overflow-hidden"
            : "overflow-x-auto snap-x snap-mandatory"
        } [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
        //  §2 (nº 282) — LE CALAGE SUR LA GRILLE DE PIXELS : moins d'un
        //  pixel, jamais une largeur. Zéro tant que le bord tombe déjà
        //  juste (au doigt, toujours).
        style={{ touchAction: "pan-x pan-y", marginLeft: calage || undefined }}
      >
        {photos.map((photo, rang) => {
          //  SUR UNE CARTE : la première photo, et les autres seulement
          //  une fois la carte réveillée. Sur une fiche : tout ce qui a
          //  été monté une fois le reste (voir `montees`).
          //  §2 (nº 368) — LA MÊME RÈGLE POUR LES DEUX : la fenêtre
          //  montée, cumulative, autour de la photo regardée. Les
          //  cartes n'ont plus leur « tout ou rien » (une seule colonne
          //  jusqu'au premier geste, puis toutes d'un coup), qui était
          //  la cause du temps d'attente entre deux photos.
          const montee = montees.has(rang);
          const image = surCarte ? (
            /*  §1 (nº 366) — LA PHOTO D'UNE CARTE A SON ÉCRITURE :
                components/PhotoDeCarte. Elle part de l'ORIGINAL et
                laisse l'optimiseur fabriquer la taille exacte de
                l'écran (densité comprise) — la miniature de 320 px
                servie ici était deux à quatre fois trop petite, et
                c'était tout le grain. La démonstration et les fiches
                d'avant le catalogue gardent leur image telle quelle. */
            <PhotoDeCarte
              url={photo.miniature}
              urlPleine={photo.url}
              //  ⚠️ LA MÊME LISTE EN DEUX COLONNES ET EN PLEINE LARGEUR
              //  (règle nº 175-§5, voir PhotoDeCarte) : la bascule de
              //  disposition ne doit RIEN faire redemander.
              tailles={TAILLES_CARTE}
              alt={rang === indice ? texteDe(photo) : ""}
              //  ⚠️ `lazy` PARTOUT SAUF LES PREMIÈRES CARTES : une
              //  carte hors écran ne demande aucune image, et les
              //  photos suivantes d'une carte ne sont demandées qu'une
              //  fois montées — c'est-à-dire au premier geste.
              //  (nº 366 : passé tel quel, l'ordre de priorité de la
              //  mosaïque ne change pas d'un cran.)
              chargement={rang === 0 && prioritaire ? undefined : "lazy"}
              priorite={rang === 0 && prioritaire ? "high" : undefined}
              //  §2 (nº 295) — LE DÉBORDEMENT D'UN PIXEL DE LA nº 294 EST
              //  ANNULÉ : c'est LUI qui posait la dernière colonne de
              //  pixels de la photo précédente au bord gauche de celle
              //  qu'on regarde (relevé du propriétaire : rgb(133,100,99),
              //  rgb(107,80,79)… — des teintes de peau, pas un fond).
              //  La photo épouse exactement sa colonne ; ce qui la
              //  protège d'un demi-pixel manquant, ce n'est plus un
              //  débordement, c'est qu'il n'y a RIEN à découvrir
              //  derrière (règle b).
              //  §1 (nº 297) — inchangé ici : une CARTE de mosaïque
              //  garde sa photo pleine colonne (voir la note de
              //  `PHOTO_DANS_SA_COLONNE`).
              classe={photoDansSaColonne(rang === indice)}
            />
          ) : (
            /*  §1 (nº 280) — PLUS D'APERÇU : la pleine résolution, et
                elle seule. La miniature ne lui est plus passée — elle
                n'existe plus dans ce chemin. Le cadre garde son fond
                sombre et sa hauteur réservée le temps du chargement. */
            <PhotoProgressive
              url={photo.url}
              alt={rang === indice ? texteDe(photo) : ""}
              pleineResolution={rang === indice}
              prioritaire={rang === 0}
              //  §2 (nº 295) — annulé ici aussi : la photo épouse
              //  exactement sa colonne (voir la note jumelle).
              //  §1 (nº 297) — …et en PAGE PLEINE elle s'y rétracte de
              //  deux pixels, centrée : il reste un pixel de page de
              //  chaque côté, que la voisine ne peut plus franchir
              //  (voir la note de `PHOTO_DANS_SA_COLONNE`).
              classe={photoDansSaColonne(rang === indice)}
            />
          );
          return (
            <div
              key={photo.cle}
              ref={(element) => {
                colonnes.current[rang] = element;
              }}
              data-role={`colonne ${rang}`}
              //  §4 (nº 302) — LA CLÉ DE LA PHOTO, DANS LE DOM. Même
              //  raison que `data-nature` (nº 247) : « le défaut
              //  redevient mesurable, il ne peut plus revenir en
              //  silence ». C'est par elle qu'on vérifie qu'une adresse
              //  `?photo=<clé>` ouvre bien SUR CETTE photo, et non sur
              //  la première. Aucune conséquence de mise en page.
              data-photo-cle={photo.cle}
              //  §1 (nº 247) — LA CATÉGORIE DE CETTE PHOTO, en face de
              //  celle que le carrousel déclare : les deux doivent
              //  concorder, toujours.
              data-nature={photo.nature}
              //  §1 (nº 292) — `min-h-0` : la colonne non plus ne se
              //  laisse pas grandir par ce qu'elle contient (voir la
              //  note du cadre). Elle garde son format 4/5 — le cadre
              //  l'étire déjà à sa hauteur, les deux disent la même
              //  chose et ne peuvent pas diverger.
              /*  §1-§2 (nº 295) — LA COLONNE ROGNE, ET ELLE NE PEINT
                   PLUS RIEN.
                   ------------------------------------------------------
                   `overflow-hidden` — LA RÈGLE (a) : une photo ne peut
                   JAMAIS déborder chez sa voisine, quelles que soient
                   les fractions. Le rognage n'est plus supposé : le
                   banc le prouve AU PIXEL, en posant une cale trop
                   large dans une colonne et en vérifiant qu'aucun de
                   ses pixels n'apparaît hors d'elle.
                   AUCUN FOND — LA RÈGLE (b) : la nº 294 avait descendu
                   `bg-sombre-carte` ici pour garder la réservation de
                   la nº 280. C'était encore une couleur à découvrir.
                   LA RÉSERVATION NE VIENT PAS D'UNE COULEUR, elle vient
                   du format 4/5 porté par le cadre et par la colonne :
                   la hauteur est connue avant la première image, sans
                   qu'un seul pixel soit peint. */
              className={`relative w-full shrink-0 snap-start snap-always ${
                dansLaFenetre ? "" : "min-h-0 overflow-hidden"
              } ${CADRE_PHOTO_PORTFOLIO}`}
              aria-hidden={rang !== indice}
            >
              {surCarte ? (
                //  CHAQUE PHOTO EST UN LIEN : un toucher ouvre la
                //  fiche, un glissement fait défiler.
                lien ? (
                  <Link
                    href={lien.href}
                    onClick={lien.onClick}
                    aria-label={lien.label}
                    //  nº 361 — PAS DE SAUT DU ROUTEUR : sa remise à
                    //  zéro part AVANT la photo d'adieu du navigateur
                    //  (l'écran noir du glissement retour). C'est
                    //  DefilementEnHaut qui remonte, à l'adresse
                    //  commise — après la photo, avant la peinture.
                    scroll={false}
                    tabIndex={rang === indice ? 0 : -1}
                    className="absolute inset-0 outline-none
                               focus-visible:outline-2 focus-visible:-outline-offset-2
                               focus-visible:outline-primaire"
                  >
                    {montee && image}
                  </Link>
                ) : (
                  montee && image
                )
              ) : (
                /*  ⚠️ L'ENVELOPPE DE ZOOM EST SUR TOUTES LES COLONNES,
                    ET SEULE CELLE QU'ON REGARDE EST ARMÉE (nº 219-§2).
                    ------------------------------------------------------
                    LA nº 216-§3 ne la MONTAIT que sur la photo regardée,
                    pour n'avoir qu'un seul écouteur `touchmove` non
                    passif — l'intention était juste, le moyen était
                    faux : monter et démonter cette enveloppe DÉTRUIT ET
                    RECRÉE l'image qu'elle contient, à l'instant précis
                    où la photo s'immobilise. Le relevé du propriétaire
                    le montre ligne à ligne — « DISPARAÎT DIV .h-full ·
                    APPARAÎT IMG · DISPARAÎT IMG · APPARAÎT DIV .h-full ·
                    APPARAÎT IMG (image VIDE) ». C'était LE
                    scintillement.
                    La structure du DOM est désormais la MÊME pour toutes
                    les colonnes, à tout instant : une image déjà
                    affichée n'est jamais remplacée. Seul `arme` change,
                    et changer un drapeau ne déplace pas un nœud — il n'y
                    a toujours qu'un seul écouteur non passif. */
                <ZoomPincement
                  surPincement={surPincement}
                  arme={rang === indice}
                  nom="zoom (fiche)"
                  //  §1 (nº 276) — le cadre du carrousel est un
                  //  conteneur de défilement : il rogne. La photo en
                  //  sort le temps du geste (voir usePincement).
                  sortirDuCadre
                  classe="h-full w-full"
                >
                  {montee && image}
                </ZoomPincement>
              )}
            </div>
          );
        })}
      </div>

      {/*  §4 (nº 368) — LES FLÈCHES SONT AUSSI SUR LES CARTES : le
           MÊME bouton, avec ses deux règles d'affichage inchangées —
           pas de flèche gauche sur la première photo, pas de droite
           sur la dernière (c'est ce que fait la fiche, et les cartes
           font pareil). Une seule photo : les deux conditions sont
           fausses, donc aucune flèche. */}
      {indice > 0 && fleche(-1)}
      {indice < n - 1 && fleche(1)}
      {/*  §Fenêtre (nº 284) — la capsule ne se pose pas quand la photo
           doit rester nette (fenêtre de carrousel).
           §2 (nº 367) — ELLE SE POSE DÉSORMAIS SUR LES CARTES AUSSI,
           les deux formats, en haut à droite et au doigt seulement :
           c'est LE MÊME élément que la fiche, avec sa mécanique de
           trois secondes — il n'y en a pas deux. Une seule photo :
           `compteur` ne rend rien (n > 1), donc rien du tout. */}
      {!sansCompteur && compteur}
      {children}

      {/* LA PAGINATION FAÇON INSTAGRAM, EN BAS AU CENTRE de l'image
          (nº 198-§5) — sauf quand l'appelant la rend lui-même SOUS la
          photo (fenêtre de carrousel, nº 284).
          §1 (nº 307) — ELLE NE RESTE QUE SUR LES CARTES de la
          mosaïque. Sur une FICHE — la page pleine comme la fenêtre
          centrée superposée, qui montent le même carrousel —, le bas
          de la photo est rendu à la photo : c'est la capsule du
          compteur, seule, qui dit le volume. Deux repères pour le même
          renseignement, au même endroit, se gênaient. */}
      {/*  §1 (nº 368) — LES POINTS ONT QUITTÉ LES CARTES, et la frise
           n'est plus rendue nulle part par ce composant. La capsule de
           la nº 367 (flèche + compte) dit déjà le volume, et deux
           repères pour le même renseignement se gênaient — c'est le
           raisonnement de la nº 307, appliqué cette fois aux cartes.
           Ils ne coûtaient AUCUNE place (`absolute bottom-3`) : la
           carte garde exactement sa hauteur, et la mosaïque ses
           rangées.
           ⚠️ `PointsDuCarrousel` RESTE EXPORTÉ, et c'est voulu : la
           fenêtre de carrousel du smartphone rend la frise elle-même,
           sous la photo (nº 284). Le drapeau `sansPoints` qu'elle
           passait n'a plus d'objet ici — il est conservé pour ne pas
           casser son appel, et ne commande plus rien. */}
    </div>
  );
}

/** Un cran de frise : le rond (6 px) et son air. Sept crans au plus. */
const CRAN_FRISE = 14;

/**
 * LA FRISE DE POINTS — L'ÉCRITURE UNIQUE (nº 198-§5, extraite nº 284)
 * ==================================================================
 * C'est la pagination façon Instagram du web, MOT POUR MOT : sept
 * crans au plus, l'actif blanc plein qui glisse, les extrémités qui
 * décroissent (75 %, 50 %). Elle vivait enfermée dans le carrousel ;
 * la FENÊTRE DE CARROUSEL du smartphone (nº 284) affiche LES MÊMES
 * points SOUS la photo — deux emplois, une seule écriture, aucun
 * risque qu'ils divergent.
 * `surRang` : ce que fait un rond touché. Le carrousel y met son
 * `allerA` (défilement doux vers `offsetLeft`) ; la fenêtre applique
 * la même règle sur son propre cadre.
 */
export function PointsDuCarrousel({
  photos,
  indice,
  surRang,
}: {
  photos: PhotoGalerie[];
  indice: number;
  surRang: (rang: number) => void;
}) {
  const n = photos.length;
  const crans = Math.min(n, 7);
  //  Le premier rond de la fenêtre : collée au début, puis centrée
  //  sur l'actif, puis collée à la fin — les trois temps.
  const debut = Math.max(0, Math.min(indice - 3, n - 7));
  //  La zone à taille pleine (trois ronds) : autour de l'actif quand
  //  la frise glisse, contre le bord au début et à la fin.
  const zone = n <= 5 ? 0 : Math.max(debut, Math.min(indice - 1, debut + 4));
  const echelle = (rang: number) => {
    if (n <= 5) return 1;
    const distance =
      rang < zone ? zone - rang : rang > zone + 2 ? rang - (zone + 2) : 0;
    return distance === 0 ? 1 : distance === 1 ? 0.75 : distance === 2 ? 0.5 : 0;
  };
  return (
    <div className="overflow-hidden" style={{ width: crans * CRAN_FRISE }}>
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${-debut * CRAN_FRISE}px)` }}
      >
        {photos.map((photo, rang) => {
          const taille = echelle(rang);
          return (
            <span
              key={photo.cle}
              className="flex shrink-0 items-center justify-center"
              style={{ width: CRAN_FRISE }}
            >
              <button
                type="button"
                aria-label={`Voir la photo ${rang + 1} sur ${n}`}
                aria-current={rang === indice ? "true" : undefined}
                onClick={() => surRang(rang)}
                tabIndex={taille === 0 ? -1 : 0}
                //  L'actif : blanc plein. Les autres : blanc voilé.
                //  ⚠️ L'OMBRE EST LA MÊME SUR TOUS LES RONDS
                //  (nº 221) : sans décalage, donc parfaitement
                //  centrée, très douce — elle n'existe que pour
                //  qu'un rond reste lisible sur une photo blanche.
                //  LE HALO BLANC DE L'ACTIF EST SUPPRIMÉ : à
                //  14 px d'entraxe, sa lueur touchait les voisins
                //  à gauche et à droite mais ne rencontrait rien
                //  en haut ni en bas — l'œil y lisait une
                //  projection latérale. Et sur une photo claire,
                //  un halo blanc n'éclairait rien du tout.
                //  (Elle sort de la liste de transition : une
                //  ombre constante n'a rien à animer.)
                className={`pointer-events-auto h-1.5 w-1.5 rounded-full
                           shadow-[0_0_2px_rgba(0,0,0,0.4)]
                           transition-[transform,opacity,background-color]
                           duration-300 ease-out ${
                             rang === indice
                               ? "bg-white"
                               : "bg-white/45 hover:bg-white/75"
                           }`}
                style={{ transform: `scale(${taille})`, opacity: taille === 0 ? 0 : 1 }}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
