"use client";

import { CADRE_PHOTO_PORTFOLIO } from "@/config/tatouage";

import { useEffect, useRef } from "react";

/**
 * LA MOSAÏQUE RÉORDONNABLE — le glisser-déposer de la galerie
 * ============================================================
 * C'est ICI que l'ordre d'affichage des photos se règle (passe
 * nº 106) : une grille de vignettes, et on déplace. Au doigt, un
 * APPUI LONG soulève la photo (elle grossit d'un souffle, une ombre
 * se pose) puis elle suit le doigt ; à la souris, on saisit et on
 * tire, même ombre portée. Les autres vignettes S'ÉCARTENT en
 * glissant — jamais de saut sec.
 *
 * COMMENT LES GESTES NE SE MARCHENT PAS DESSUS
 * ---------------------------------------------
 * Les conflits de gestes ont coûté dix passes à la fenêtre de
 * recherche : celui-ci est donc conçu autour d'une règle simple —
 * NE RIEN CONFISQUER AVANT D'ÊTRE SÛR.
 *
 *  · AVANT l'activation, on ne bloque RIEN. Pas de `touch-action`
 *    restrictif, pas de `preventDefault` : le doigt qui balaie fait
 *    DÉFILER la page comme partout ailleurs. Si le navigateur prend
 *    la main (défilement commencé), il nous envoie `pointercancel`
 *    et l'appui long est simplement abandonné.
 *  · L'ACTIVATION est sans ambiguïté : au doigt, 350 ms IMMOBILE
 *    (bouger de plus de 8 px avant l'échéance annule le minuteur —
 *    c'était un défilement) ; à la souris, 6 px de déplacement
 *    bouton enfoncé (un clic sans mouvement reste un clic, et ouvre
 *    la fenêtre du style).
 *  · APRÈS l'activation seulement, un écouteur `touchmove` NON
 *    PASSIF sur le document neutralise le défilement — le temps du
 *    glisser, pas une seconde de plus. C'est le seul moment où l'on
 *    confisque quoi que ce soit.
 *  · UN DEUXIÈME DOIGT ANNULE TOUT, appui long comme glisser en
 *    cours : deux doigts, c'est un PINCEMENT — il appartient au
 *    zoom, jamais à nous.
 *
 * POURQUOI C'EST FLUIDE : pendant le glisser, React ne rend RIEN.
 * Les positions de toutes les vignettes sont mesurées une fois au
 * soulèvement (en coordonnées de document, pour survivre au
 * défilement automatique), puis chaque vignette est déplacée par
 * `transform` avec une transition — le tracé le moins cher du
 * navigateur. L'ordre n'est écrit dans l'état qu'AU LÂCHER.
 *
 * ⚠️ TOUTE LA MACHINERIE VIT HORS DU COMPOSANT (`poserLeGlisser`) :
 * c'est un contrôleur impératif, posé par un effet et déposé par son
 * nettoyage. Le composant, lui, ne fait que rendre la grille — les
 * règles de pureté de React n'ont rien à redire, et c'est la vraie
 * séparation des rôles : React possède le DOM entre deux glissers,
 * le contrôleur le possède PENDANT le glisser.
 *
 * L'IMAGE NE SE LAISSE PAS VOLER LE GESTE : `draggable={false}`
 * (le glisser natif d'image du bureau), `select-none` et
 * `-webkit-touch-callout: none` (le menu « enregistrer l'image »
 * de l'appui long iOS).
 */

export type TuileGalerie = {
  cle: string;
  src: string;
  /** Ce que le lecteur d'écran annonce — « Bras · Couleur ». */
  etiquette: string;
};

/** Ce que le contrôleur lit à chaque geste — tenu à jour par le
    composant, pour que les rappels ne soient jamais périmés. */
type RappelsGalerie = {
  cles: string[];
  surOrdre: (cles: string[]) => void;
  /** Un tap ou un clic sans glisser, avec LA CLÉ de la tuile touchée
      (passe nº 109 — le parent ouvre la photo visée, plus une fenêtre
      globale). */
  surOuverture: (cle: string) => void;
};

/** L'appui long qui soulève, au doigt. */
const APPUI_LONG_MS = 350;
/** Bouger plus que ça avant l'échéance = un défilement, pas un appui. */
const TOLERANCE_DOIGT = 8;
/** À la souris, le glisser commence après ce déplacement. */
const SEUIL_SOURIS = 6;
/** La bande, en haut et en bas de l'écran, qui fait défiler toute
    seule quand on y traîne une vignette. */
const BANDE_DEFILEMENT = 72;

/**
 * LE CONTRÔLEUR DE GLISSER — fonction ORDINAIRE, hors composant.
 * Elle pose ses écouteurs sur le conteneur, et rend la fonction qui
 * les enlève. Un seul geste à la fois ; tout l'état vit dans `s`.
 */
function poserLeGlisser(
  conteneur: HTMLUListElement,
  rappels: { current: RappelsGalerie }
): () => void {
  type Saisie = {
    pointeur: number;
    type: string;
    index: number;
    /** Position du doigt au départ, en coordonnées d'ÉCRAN. */
    x0: number;
    y0: number;
    /** La dernière position connue — le défilement automatique
        recalcule avec elle. */
    x: number;
    y: number;
    minuteur: number | null;
    actif: boolean;
    /** Les cases de la grille, mesurées au soulèvement, en
        coordonnées de DOCUMENT. */
    cases: { x: number; y: number; l: number; h: number }[];
    /** Où est le doigt par rapport au coin de la vignette saisie. */
    prise: { dx: number; dy: number };
    cible: number;
    boucleDefilement: number | null;
  };

  let s: Saisie | null = null;
  /** Le glisser vient de finir : le `click` fantôme qui suit ne doit
      pas ouvrir la fenêtre. */
  let finDuGlisser = 0;

  const elementDe = (index: number) =>
    (conteneur.children[index] as HTMLElement) ?? null;

  const nettoyerLesStyles = () => {
    for (const el of conteneur.children) {
      const tuile = el as HTMLElement;
      tuile.style.transform = "";
      tuile.style.transition = "";
      tuile.style.zIndex = "";
      tuile.style.boxShadow = "";
    }
  };

  function empecherToucher(evenement: TouchEvent) {
    evenement.preventDefault();
  }

  function abandonner() {
    if (!s) return;
    if (s.minuteur !== null) window.clearTimeout(s.minuteur);
    if (s.boucleDefilement !== null)
      window.cancelAnimationFrame(s.boucleDefilement);
    document.removeEventListener("pointermove", surMouvement);
    document.removeEventListener("pointerup", surLacher);
    document.removeEventListener("pointercancel", surAnnulation);
    document.removeEventListener("touchmove", empecherToucher);
    document.body.style.userSelect = "";
    nettoyerLesStyles();
    s = null;
  }

  /** LE SOULÈVEMENT — mesures, ombre, et confiscation (tardive) du
      défilement. */
  function soulever() {
    if (!s || s.actif) return;
    s.actif = true;
    //  ⚠️ SEULES LES VRAIES TUILES SONT DES CASES (passe nº 109) : la
    //  tuile d'ajout, en queue de grille, n'est ni une prise ni une
    //  cible de dépôt — on s'arrête au nombre de clés.
    s.cases = [...conteneur.children]
      .slice(0, rappels.current.cles.length)
      .map((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        return {
          x: r.left + window.scrollX,
          y: r.top + window.scrollY,
          l: r.width,
          h: r.height,
        };
      });
    const casePrise = s.cases[s.index];
    s.prise = {
      dx: s.x + window.scrollX - casePrise.x,
      dy: s.y + window.scrollY - casePrise.y,
    };
    s.cible = s.index;
    const el = elementDe(s.index);
    if (el) {
      el.style.transition = "box-shadow 150ms ease";
      el.style.zIndex = "30";
      el.style.boxShadow = "0 12px 32px rgba(0,0,0,0.55)";
      el.style.transform = "scale(1.05)";
    }
    document.body.style.userSelect = "none";
    //  C'est SEULEMENT maintenant que le défilement est suspendu.
    document.addEventListener("touchmove", empecherToucher, {
      passive: false,
    });
    //  Un petit battement sous le doigt, là où l'appareil sait le faire.
    try {
      navigator.vibrate?.(8);
    } catch {
      /* pas de vibreur : tant pis. */
    }
    //  Le défilement automatique ne vit QUE pendant le glisser.
    s.boucleDefilement = window.requestAnimationFrame(defilerSiAuBord);
  }

  /** OÙ POSER ? La case dont le centre est le plus proche du point
      saisi. Les cases sont fixes (mesurées au soulèvement) : le
      calcul est stable, quel que soit le désordre des transforms. */
  function caseLaPlusProche(xDoc: number, yDoc: number): number {
    let meilleure = 0;
    let distance = Infinity;
    s!.cases.forEach((c, rang) => {
      const dx = xDoc - (c.x + c.l / 2);
      const dy = yDoc - (c.y + c.h / 2);
      const d = dx * dx + dy * dy;
      if (d < distance) {
        distance = d;
        meilleure = rang;
      }
    });
    return meilleure;
  }

  /** LES AUTRES VIGNETTES S'ÉCARTENT : chacune glisse vers la case
      qu'elle occupera si l'on lâche ici. */
  function ecarterVers(cible: number) {
    if (!s || cible === s.cible) return;
    s.cible = cible;
    for (let index = 0; index < s.cases.length; index += 1) {
      if (index === s.index) continue;
      //  La case qu'occupera cette tuile : elle recule d'un cran si
      //  elle est entre l'origine et la cible, sinon elle reste.
      let caseOccupee = index;
      if (s.index < cible && index > s.index && index <= cible)
        caseOccupee = index - 1;
      if (s.index > cible && index >= cible && index < s.index)
        caseOccupee = index + 1;
      const el = elementDe(index);
      if (!el) continue;
      const depuis = s.cases[index];
      const vers = s.cases[caseOccupee];
      el.style.transition = "transform 190ms cubic-bezier(0.32,0.72,0,1)";
      el.style.transform =
        caseOccupee === index
          ? ""
          : `translate(${vers.x - depuis.x}px, ${vers.y - depuis.y}px)`;
    }
  }

  /** La vignette suit le doigt. */
  function suivre() {
    if (!s || !s.actif) return;
    const xDoc = s.x + window.scrollX;
    const yDoc = s.y + window.scrollY;
    const el = elementDe(s.index);
    if (el) {
      const casePrise = s.cases[s.index];
      el.style.transition = "box-shadow 150ms ease";
      el.style.transform = `translate(${xDoc - s.prise.dx - casePrise.x}px, ${
        yDoc - s.prise.dy - casePrise.y
      }px) scale(1.05)`;
    }
    ecarterVers(caseLaPlusProche(xDoc, yDoc));
  }

  /** LE DÉFILEMENT AUTOMATIQUE près des bords — sans lui, impossible
      de porter une photo au-delà de l'écran. */
  function defilerSiAuBord() {
    if (!s || !s.actif) return;
    let vitesse = 0;
    if (s.y < BANDE_DEFILEMENT) {
      vitesse = -Math.ceil((BANDE_DEFILEMENT - s.y) / 6);
    } else if (s.y > window.innerHeight - BANDE_DEFILEMENT) {
      vitesse = Math.ceil((s.y - (window.innerHeight - BANDE_DEFILEMENT)) / 6);
    }
    if (vitesse !== 0) {
      window.scrollBy(0, vitesse);
      suivre();
    }
    s.boucleDefilement = window.requestAnimationFrame(defilerSiAuBord);
  }

  function surMouvement(evenement: PointerEvent) {
    if (!s || evenement.pointerId !== s.pointeur) return;
    s.x = evenement.clientX;
    s.y = evenement.clientY;
    if (!s.actif) {
      const distance = Math.hypot(s.x - s.x0, s.y - s.y0);
      if (s.type === "mouse") {
        if (distance >= SEUIL_SOURIS) soulever();
      } else if (distance > TOLERANCE_DOIGT && s.minuteur !== null) {
        //  Le doigt balaie : c'était un défilement. On rend la main.
        abandonner();
        return;
      }
    }
    if (s?.actif) suivre();
  }

  function surLacher(evenement: PointerEvent) {
    if (!s || evenement.pointerId !== s.pointeur) return;
    const commande = s.actif && s.cible !== s.index;
    const depuis = s.index;
    const vers = s.cible;
    if (s.actif) finDuGlisser = Date.now();
    abandonner();
    if (!commande) return;
    const ordre = [...rappels.current.cles];
    const [deplacee] = ordre.splice(depuis, 1);
    ordre.splice(vers, 0, deplacee);
    rappels.current.surOrdre(ordre);
  }

  function surAnnulation(evenement: PointerEvent) {
    if (!s || evenement.pointerId !== s.pointeur) return;
    abandonner();
  }

  function surPrise(evenement: PointerEvent) {
    //  UN DEUXIÈME DOIGT PENDANT UNE PRISE : c'est un pincement — il
    //  appartient au zoom. On lâche tout, sans discuter.
    if (s) {
      abandonner();
      return;
    }
    if (evenement.pointerType === "mouse" && evenement.button !== 0) return;
    const tuile = (evenement.target as HTMLElement).closest("li");
    if (!tuile || tuile.parentElement !== conteneur) return;
    //  La tuile d'ajout ne se saisit pas : elle n'est pas une photo.
    if (tuile.hasAttribute("data-hors-galerie")) return;
    const index = [...conteneur.children].indexOf(tuile);
    if (index < 0 || index >= rappels.current.cles.length) return;
    s = {
      pointeur: evenement.pointerId,
      type: evenement.pointerType,
      index,
      x0: evenement.clientX,
      y0: evenement.clientY,
      x: evenement.clientX,
      y: evenement.clientY,
      minuteur: null,
      actif: false,
      cases: [],
      prise: { dx: 0, dy: 0 },
      cible: index,
      boucleDefilement: null,
    };
    if (evenement.pointerType !== "mouse") {
      s.minuteur = window.setTimeout(() => {
        if (!s) return;
        s.minuteur = null;
        soulever();
      }, APPUI_LONG_MS);
    }
    document.addEventListener("pointermove", surMouvement);
    document.addEventListener("pointerup", surLacher);
    document.addEventListener("pointercancel", surAnnulation);
  }

  /** UN TAP OU UN CLIC SANS GLISSER ouvre LA PHOTO touchée — le clic
      fantôme qui suit un glisser, lui, ne fait rien. La tuile d'ajout
      gère son propre clic : on ne la double pas. */
  function surClic(evenement: MouseEvent) {
    if (Date.now() - finDuGlisser < 400) return;
    const tuile = (evenement.target as HTMLElement).closest("li");
    if (!tuile || tuile.parentElement !== conteneur) return;
    if (tuile.hasAttribute("data-hors-galerie")) return;
    const index = [...conteneur.children].indexOf(tuile);
    const cle = rappels.current.cles[index];
    if (cle) rappels.current.surOuverture(cle);
  }

  conteneur.addEventListener("pointerdown", surPrise);
  conteneur.addEventListener("click", surClic);
  return () => {
    abandonner();
    conteneur.removeEventListener("pointerdown", surPrise);
    conteneur.removeEventListener("click", surClic);
  };
}

export function GrilleGalerie({
  tuiles,
  surOrdre,
  surOuverture,
  colonnes = "grid-cols-4 sm:grid-cols-6 md:grid-cols-7",
  queue,
}: {
  tuiles: TuileGalerie[];
  /** Le nouvel ordre, au lâcher — la liste complète des clés. */
  surOrdre: (cles: string[]) => void;
  /** Un TAP ou un CLIC sans glisser sur une tuile — sa clé. */
  surOuverture: (cle: string) => void;
  colonnes?: string;
  /** UNE CASE DE PLUS, EN QUEUE DE GRILLE (passe nº 109) — la tuile
      d'ajout. Elle est INERTE pour le glisser : ni prise, ni cible de
      dépôt, ni tap — son contenu gère ses propres clics. Elle vit
      dans la grille pour que l'alignement soit parfait, et hors de la
      mécanique pour que celle-ci reste exactement celle qui a coûté
      dix passes à stabiliser. */
  queue?: React.ReactNode;
}) {
  const liste = useRef<HTMLUListElement>(null);
  const rappels = useRef<RappelsGalerie>({
    cles: [],
    surOrdre: () => {},
    surOuverture: () => {},
  });

  //  LE CONTRÔLEUR LIT TOUJOURS LA VERSION COURANTE : cet effet (sans
  //  liste de dépendances : il court à chaque rendu) remet les
  //  rappels et les clés à jour dans la ref qu'il consulte.
  useEffect(() => {
    rappels.current = {
      cles: tuiles.map((tuile) => tuile.cle),
      surOrdre,
      surOuverture,
    };
  });

  //  LE CONTRÔLEUR EST POSÉ UNE FOIS, déposé au démontage.
  useEffect(() => {
    if (!liste.current) return;
    return poserLeGlisser(liste.current, rappels);
  }, []);

  //  (Pas d'effet de nettoyage au changement d'ordre : `abandonner`
  //  efface tous les styles AVANT d'appeler `surOrdre`, dans le même
  //  lot de rendu — le DOM réécrit arrive déjà propre.)

  return (
    <ul className={`grid ${colonnes} gap-1.5`} ref={liste}>
      {tuiles.map((tuile) => (
        <li key={tuile.cle} className="relative">
          <button
            type="button"
            aria-label={`${tuile.etiquette} — appui long (ou glisser) pour déplacer, toucher pour ouvrir`}
            //  ⚠️ ANGLES DROITS ET AUCUN CONTOUR (passe nº 110) : une
            //  mosaïque de photos se lit mieux en aplat continu. Les
            //  arrondis et les filets découpaient chaque vignette en
            //  petit objet séparé — l'œil comptait des cases au lieu
            //  de regarder des images.
            className="block w-full cursor-grab touch-manipulation select-none
                       overflow-hidden [-webkit-touch-callout:none]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element --
                aperçu local ou image déjà servie. */}
            <img
              src={tuile.src}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              className={`pointer-events-none ${CADRE_PHOTO_PORTFOLIO} w-full select-none object-cover`}
            />
          </button>
        </li>
      ))}
      {queue && (
        <li data-hors-galerie="" className="relative">
          {queue}
        </li>
      )}
    </ul>
  );
}
