"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PhotoProgressive } from "@/components/PhotoProgressive";
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

export function CarrouselPortfolio({
  photos,
  nomTatoueur,
  styleLabel,
  indice,
  surChangement,
  variante = "fiche",
  prioritaire = false,
  natureDeLaSerie = "",
  lien,
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
  /** En variante « carte » : chaque photo est un LIEN vers la fiche —
      un toucher navigue, un glissement fait défiler (le navigateur
      n'émet aucun clic après un glissement). */
  lien?: {
    href: string;
    onClick?: (evenement: React.MouseEvent) => void;
    label: string;
  };
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
   * §5 (nº 211) — LE CHARGEMENT DIFFÉRÉ DES CARTES
   * ==================================================================
   * À l'affichage d'une mosaïque, chaque carte ne demande QU'UNE
   * image : la première de son ensemble — exactement ce qu'elle
   * demandait avant cette passe. Les suivantes n'existent même pas
   * comme balises tant que le doigt n'a pas touché CETTE carte : une
   * mosaïque de vingt cartes charge donc vingt miniatures, et pas une
   * de plus, qu'un artiste ait publié une photo ou vingt.
   * Le réveil se fait au premier contact ou au premier défilement —
   * c'est-à-dire AVANT que la photo suivante n'entre à l'écran.
   */
  const [eveille, setEveille] = useState(false);
  const reveiller = () => {
    if (surCarte && !eveille) setEveille(true);
  };

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
  const [compteurVisible, setCompteurVisible] = useState(true);
  const [reveils, setReveils] = useState(0);
  //  Le changement de photo est un geste : le texte revient, pendant
  //  le rendu — jamais dans un effet.
  const [indiceVu, setIndiceVu] = useState(indice);
  if (indice !== indiceVu) {
    setIndiceVu(indice);
    setCompteurVisible(true);
  }
  useEffect(() => {
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
  }, []);
  //  LE CYCLE DE TROIS SECONDES — réarmé par chaque réveil et chaque
  //  changement de photo. S'il expire, le texte s'estompe en douceur.
  useEffect(() => {
    const minuteur = window.setTimeout(() => setCompteurVisible(false), 3000);
    ressource("minuteur compteur", 1);
    return () => {
      window.clearTimeout(minuteur);
      ressource("minuteur compteur", -1);
    };
  }, [reveils, indice]);

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
    for (let rang = indice - VOISINES; rang <= indice + VOISINES; rang += 1) {
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
    //  Une nouvelle série commence à sa première photo — sans quoi le
    //  cadre garderait le défilement de la précédente.
    zone.scrollLeft = 0;
    dernierPose.current = 0;
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

  /** Avance (+1) ou recule (−1) — DANS les bornes, c'est tout. */
  function aller(sens: 1 | -1) {
    const cible = indice + sens;
    if (cible < 0 || cible >= n) return;
    allerA(cible, true, "flèche");
  }

  /** Le texte de remplacement d'une photo : le style, et sa légende
      quand elle est taguée (« Avant-bras · Couleur »). */
  const texteDe = (photo: PhotoGalerie) =>
    `Portfolio de ${nomTatoueur} — ${styleLabel}${
      photo.legende ? ` · ${photo.legende}` : ""
    }`;

  /* SMARTPHONE : la capsule « 3/12 », angle haut droit — AUCUNE quand
     l'ensemble n'a qu'une photo. Le texte se replie (largeur ET
     opacité) pour ne laisser que la flèche ; les deux mouvements sont
     doux, la réapparition est quasi immédiate — jamais de
     clignotement. */
  const enFinDeGalerie = indice >= n - 1;
  const compteur = n > 1 && (
    <span
      /*  ⚠️ TEMPORAIRE (nº 218-§1) : la sonde nomme ce qui apparaît ou
          disparaît dans le cadre. Sans ce nom, son relevé dirait
          « SPAN » — inexploitable. */
      data-role="compteur"
      className="hidden mobile:inline-flex absolute top-3 right-3 z-[2]
                 items-center rounded-full bg-black/60 backdrop-blur
                 px-2.5 py-1.5 text-white"
    >
      <span
        aria-hidden={!compteurVisible}
        className={`overflow-hidden whitespace-nowrap text-[12px]
                   font-semibold tabular-nums
                   transition-[max-width,opacity,margin-right] ease-out ${
                     compteurVisible
                       ? "max-w-[64px] opacity-100 mr-1.5 duration-150"
                       : "max-w-0 opacity-0 mr-0 duration-500"
                   }`}
      >
        {indice + 1}/{n}
      </span>
      {/*  LA FLÈCHE MINIMALE — le repère permanent : vers la droite
           tant qu'il reste des photos, vers la gauche en fin de
           galerie. Elle pivote en douceur, elle ne clignote pas. */}
      <svg
        width="10"
        height="10"
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
      onClick={() => aller(sens)}
      className={`hidden pointer-fine:flex absolute z-[2] ${
        sens === 1 ? "right-2.5" : "left-2.5"
      } top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
      bg-sombre-fond/55 backdrop-blur items-center justify-center
      text-sombre-texte hover:bg-sombre-eleve/75 transition-colors`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
  //  Un cran de frise : le rond (6 px) et son air. Sept crans au plus.
  //  ⚠️ UNE FONCTION APPELÉE DANS LE JSX, comme `fleche` — et non une
  //  valeur calculée pendant le rendu : ses boutons commandent le
  //  défilement, donc ils touchent au cadre (une ref), ce qui n'a le
  //  droit de se produire QUE dans un gestionnaire d'événement.
  const CRAN_FRISE = 14;
  function paginationWeb() {
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
      <div
        data-role="pagination"
        className={`${
          surCarte ? "flex" : "flex mobile:hidden"
        } absolute bottom-3 inset-x-0 z-[2] justify-center pointer-events-none`}
      >
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
                    onClick={() => allerA(rang, true, "rond")}
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
      </div>
    );
  }

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
      className="relative bg-sombre-carte select-none"
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
        onPointerDown={reveiller}
        onScroll={reveiller}
        className={`relative flex w-[round(down,100%,1px)] ${
          zoomEnCours
            ? "overflow-hidden"
            : "overflow-x-auto snap-x snap-mandatory"
        } [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
        style={{ touchAction: "pan-x pan-y" }}
      >
        {photos.map((photo, rang) => {
          //  SUR UNE CARTE : la première photo, et les autres seulement
          //  une fois la carte réveillée. Sur une fiche : tout ce qui a
          //  été monté une fois le reste (voir `montees`).
          const montee = surCarte
            ? rang === 0 || eveille
            : montees.has(rang);
          const image = surCarte ? (
            /* eslint-disable-next-line @next/next/no-img-element --
               miniature déjà découpée, servie telle quelle : c'est la
               règle des cartes depuis toujours (voir CarteTatoueur). */
            <img
              src={photo.miniature}
              alt={rang === indice ? texteDe(photo) : ""}
              //  ⚠️ `lazy` PARTOUT SAUF LES PREMIÈRES CARTES : une
              //  carte hors écran ne demande aucune image, et les
              //  photos suivantes d'une carte ne sont demandées qu'une
              //  fois montées — c'est-à-dire au premier geste.
              loading={rang === 0 && prioritaire ? undefined : "lazy"}
              fetchPriority={rang === 0 && prioritaire ? "high" : undefined}
              className="absolute inset-0 h-full w-full object-cover"
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
              classe="absolute inset-0 h-full w-full object-cover"
            />
          );
          return (
            <div
              key={photo.cle}
              ref={(element) => {
                colonnes.current[rang] = element;
              }}
              data-role={`colonne ${rang}`}
              //  §1 (nº 247) — LA CATÉGORIE DE CETTE PHOTO, en face de
              //  celle que le carrousel déclare : les deux doivent
              //  concorder, toujours.
              data-nature={photo.nature}
              className={`relative w-full shrink-0 snap-start snap-always ${CADRE_PHOTO_PORTFOLIO}`}
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

      {!surCarte && indice > 0 && fleche(-1)}
      {!surCarte && indice < n - 1 && fleche(1)}
      {!surCarte && compteur}
      {children}

      {/* WEB : la pagination façon Instagram, EN BAS AU CENTRE de
          l'image (nº 198-§5). */}
      {n > 1 && paginationWeb()}
    </div>
  );
}
