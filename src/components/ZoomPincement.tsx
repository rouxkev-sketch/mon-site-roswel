"use client";

import { useEffect, useRef } from "react";

/**
 * LE ZOOM AU PINCEMENT — deux doigts, comme sur Instagram
 * ========================================================
 * Agrandit une image au PINCEMENT à deux doigts, SANS rien casser
 * autour. Réservé aux VRAIS écrans tactiles (`data-appareil="mobile"`) :
 * une souris ne pince pas.
 *
 * LA DISTINCTION DES GESTES tient à trois choses :
 *  1. LE NOMBRE DE DOIGTS — un doigt : on ne fait RIEN (le défilement
 *     de la page et le balayage du carrousel gardent la main) ; le
 *     zoom ne s'arme qu'au POSER DU DEUXIÈME doigt.
 *  2. `touch-action: pan-x pan-y` CIBLÉ sur la zone écoutée — le
 *     navigateur garde le défilement au doigt, mais N'A PAS le droit
 *     de prendre le pincement à son compte (pas de zoom natif de
 *     page, pas de `pointercancel`) : les événements de pointeur
 *     continuent d'arriver, c'est nous qui zoomons l'image.
 *  3. Pendant le pincement, les `touchmove` sont ANNULÉS (écouteur
 *     non passif) : la page ne défile pas sous les doigts, le
 *     carrousel ne balaie pas.
 *
 * AU RELÂCHEMENT, l'image REVIENT D'ELLE-MÊME à sa taille normale
 * (transition douce) — le « coup d'œil » d'Instagram : on agrandit
 * pour regarder, on lâche, tout se range. Aucun état zoomé ne peut
 * rester coincé (relâchement, annulation : même retour).
 *
 * ⚠️ « AU RELÂCHEMENT » VEUT DIRE AU LEVER DU DERNIER DOIGT
 * (nº 207-§8), et non plus dès qu'il n'en reste qu'un. On agrandit à
 * deux doigts, on en relève un pour mieux voir : l'image RESTE
 * agrandie, figée telle quelle, tant qu'un doigt touche encore. Elle
 * ne se range qu'une fois la main partie. Reposer un deuxième doigt
 * REPREND le geste là où il s'était arrêté — l'échelle et le décalage
 * courants deviennent la nouvelle base, il n'y a donc aucun saut.
 *
 * LE PINCEMENT N'OUVRE JAMAIS RIEN : à la fin du geste, un court
 * instant est mémorisé (`pincementRecent`) — les clics qui suivraient
 * (lien de carte…) le consultent et s'abstiennent.
 *
 * DEUX FORMES :
 *  - le HOOK `usePincement` — pour les zones dont les événements
 *    n'arrivent pas sur l'image elle-même (la carte : son lien étiré
 *    par-dessus l'image reçoit les pointeurs ; on écoute donc LA
 *    CARTE, et on ne transforme QUE la photo) ;
 *  - le COMPOSANT `ZoomPincement` — l'enveloppe simple, quand l'image
 *    est directement sous les doigts (le carrousel de la fiche).
 */

/* La fin du dernier pincement, partagée avec les liens qui doivent
   s'abstenir de naviguer juste après le geste. */
let finDernierPincement = 0;

/** Un pincement est-il en cours, ou vient-il de se terminer ? */
export function pincementRecent(): boolean {
  return Date.now() - finDernierPincement < 450;
}

type Doigt = { x: number; y: number };
type Mesure = { distance: number; centreX: number; centreY: number };

export function usePincement({
  ecoute,
  cible,
  surPincement,
  arme = true,
  sortirDuCadre = false,
}: {
  /** L'élément qui REÇOIT les doigts (les gestionnaires retournés y
      sont posés — et le blocage du défilement s'y accroche).
      §1 (nº 276) : il porte `data-pincement` le temps du geste — c'est
      ce qui LÈVE SON CONFINEMENT (voir la règle dans globals.css). */
  ecoute: React.RefObject<HTMLElement | null>;
  /**
   * L'élément TRANSFORMÉ (l'image, ou son cadre direct).
   * §3-b (nº 880) — IL PEUT AUSSI ÊTRE DEMANDÉ AU MOMENT DU GESTE, par
   * une fonction. LA RAISON : sur une carte du fil, ce qu'il faut
   * agrandir est le CADRE DES PHOTOS du carrousel — un nœud que la
   * carte ne possède pas, et qu'elle ne peut donc pas tenir dans une
   * référence à elle. Le demander au premier doigt le trouve toujours
   * (le carrousel est monté depuis longtemps) et n'oblige personne à se
   * prêter une référence. Rendre `null` annule le geste, comme une
   * référence vide.
   */
  cible: React.RefObject<HTMLElement | null> | (() => HTMLElement | null);
  /** Prévient quand le pincement commence/finit — le carrousel s'en
      sert pour ABANDONNER son balayage en cours. */
  surPincement?: (actif: boolean) => void;
  /**
   * LE PINCEMENT EST-IL ARMÉ ? (passe nº 219-§2)
   * ------------------------------------------------------------------
   * ⚠️ CE N'EST PAS « LE COMPOSANT EXISTE-T-IL ». La nº 216-§3 avait
   * réduit le nombre d'écouteurs non passifs en ne MONTANT l'enveloppe
   * que sur la photo regardée — mais monter et démonter une enveloppe,
   * c'est DÉTRUIRE ET RECRÉER l'image qu'elle contient, à l'instant
   * précis où la photo s'immobilise. Le relevé du propriétaire le
   * montre ligne à ligne : « DISPARAÎT IMG … APPARAÎT IMG … image
   * VIDE ». C'était le scintillement.
   * L'enveloppe est donc DÉSORMAIS TOUJOURS LÀ, sur chaque colonne, et
   * c'est ce drapeau qui décide si elle ÉCOUTE. Le DOM ne bouge plus,
   * et il n'y a toujours qu'un seul écouteur non passif : les deux
   * acquis sont gardés.
   */
  arme?: boolean;
  /**
   * §1 (nº 276) — SORTIR LA PHOTO DE SON CADRE DE DÉFILEMENT.
   * ------------------------------------------------------------------
   * Sur la FICHE, la photo pincée vit DANS le cadre du carrousel — un
   * conteneur de défilement, et un conteneur de défilement rogne
   * toujours ce qui dépasse (c'est la limite actée à la nº 209-§7, que
   * la nº 276 lève). On ne peut pas ouvrir ce cadre le temps du geste :
   * il perdrait sa position de défilement, et toutes les colonnes
   * glisseraient sous les doigts. La photo en SORT donc elle-même :
   * `position: fixed`, posée au pixel exact où elle est déjà (la page
   * ne peut pas défiler pendant le geste, rien ne bouge), le temps du
   * pincement — puis tout est effacé au rangement.
   * Les CARTES de la mosaïque n'en ont pas besoin : leur photo n'est
   * dans aucun cadre de défilement, lever le confinement suffit.
   */
  sortirDuCadre?: boolean;
}) {
  /*  §3-b (nº 880) — LA CIBLE DU MOMENT, demandée d'une seule façon
      que l'appelant l'ait donnée en référence ou en fonction. */
  const cibleDuMoment = () =>
    typeof cible === "function" ? cible() : cible.current;
  const doigts = useRef(new Map<number, Doigt>());
  const depart = useRef<Mesure | null>(null);
  const actif = useRef(false);
  /** LA TRANSFORMATION COURANTE — ce que l'image porte à l'instant.
      Elle sert de BASE quand un deuxième doigt revient se poser sur un
      zoom tenu par un seul (nº 207-§8) : le geste reprend d'ici, sans
      saut. Remise à l'identité à la fin de chaque pincement. */
  const courant = useRef({ echelle: 1, dx: 0, dy: 0 });
  /** CE QUE L'IMAGE PORTE À L'ÉCRAN — noté au moment où on le pose,
      jamais relu dans le style. */
  const affiche = useRef({ echelle: 1, dx: 0, dy: 0 });
  /** LE CADRE ET L'ORIGINE DU ZOOM, mesurés au premier pincement : ils
      donnent les BUTÉES du déplacement (nº 208-§5). */
  const cadre = useRef({ largeur: 0, hauteur: 0, ox: 0, oy: 0 });
  /** LE RANGEMENT EN VOL (§1 nº 276) — les 220 ms qui suivent la fin
      d'un geste : la photo revient en place, PUIS ses styles et le
      `data-pincement` s'effacent. Un pincement qui REPREND pendant ce
      délai l'annule : sans cela, le rangement du geste précédent
      s'abattrait au milieu du nouveau — styles effacés, confinement
      revenu — et l'image serait rognée sous les doigts. */
  const rangement = useRef<number | null>(null);

  /**
   * LES BUTÉES DU DÉPLACEMENT (nº 208-§5) — la photo agrandie glisse,
   * mais ne DÉCOUVRE JAMAIS son cadre.
   * Un point `p` de l'image se peint en `o + s·(p − o) + t` (origine
   * `o`, échelle `s`, décalage `t`). Pour que le bord gauche reste à
   * gauche du cadre : `o(1−s) + t ≤ 0`, donc `t ≤ o(s−1)`. Pour que le
   * bord droit reste à droite : `t ≥ −(L−o)(s−1)`. Même calcul en
   * hauteur. À l'échelle 1, les deux bornes valent zéro : l'image ne
   * bouge pas — c'est exactement ce qu'on veut.
   */
  function borner(valeur: number, origine: number, taille: number, echelle: number) {
    const marge = echelle - 1;
    const haute = origine * marge;
    const basse = -(taille - origine) * marge;
    return Math.min(haute, Math.max(basse, valeur));
  }

  /* Pendant le pincement : la page ne doit NI défiler NI zoomer
     nativement — l'écouteur non passif annule les touchmove. Posé au
     montage (léger), il ne fait rien tant qu'on ne pince pas. */
  useEffect(() => {
    const element = ecoute.current;
    //  DÉSARMÉ : aucun écouteur, aucun compte — la colonne existe, mais
    //  elle n'écoute pas (nº 219-§2).
    if (!element || !arme) return;
    /**
     * ⚠️ CET ÉCOUTEUR EST NON PASSIF : le navigateur consulte le fil
     * principal avant chaque mouvement de doigt, au lieu de décider
     * seul. Il n'y en a qu'UN par carrousel — celui de la photo
     * regardée (nº 216-§3, conservé) — et un par carte de mosaïque.
     */
    function bloquerDefilement(evenement: TouchEvent) {
      if (actif.current) evenement.preventDefault();
    }
    element.addEventListener("touchmove", bloquerDefilement, {
      passive: false,
    });
    //  SONDE (nº 218-§1) : un zoom armé = un écouteur `touchmove` NON
    //  PASSIF de plus. Le compteur dit d'un coup d'œil s'il en reste.
    return () => {
      element.removeEventListener("touchmove", bloquerDefilement);
      /**
       * ⚠️ UN PINCEMENT NE SURVIT PAS AU DÉSARMEMENT (nº 217-§4)
       * ----------------------------------------------------------------
       * Le carrousel n'arme que la photo regardée : le désarmement
       * arrive donc dès qu'on change de photo — y compris AU MILIEU
       * d'un geste. Sans ceci, `terminer` n'était jamais appelé, et
       * deux choses restaient allumées pour toujours : `data-zoom` sur
       * `<html>`, et surtout `surPincement(true)` jamais démenti — le
       * carrousel gardait `overflow-hidden`, et PLUS RIEN NE DÉFILAIT.
       * Le désarmement vaut fin de geste, sans exception.
       */
      terminer();
    };
    // Les refs sont stables d'un rendu à l'autre ; `terminer` ne lit
    // que des refs et ne change pas de comportement d'un rendu à
    // l'autre. Seul l'armement compte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arme]);

  function mesure(): Mesure {
    const [a, b] = [...doigts.current.values()];
    return {
      distance: Math.hypot(b.x - a.x, b.y - a.y) || 1,
      centreX: (a.x + b.x) / 2,
      centreY: (a.y + b.y) / 2,
    };
  }

  function terminer() {
    if (!actif.current) return;
    actif.current = false;
    depart.current = null;
    courant.current = { echelle: 1, dx: 0, dy: 0 };
    affiche.current = { echelle: 1, dx: 0, dy: 0 };
    //  Le plan de la mosaïque redescend sous la barre (nº 209-§2).
    delete document.documentElement.dataset.zoom;
    finDernierPincement = Date.now();
    surPincement?.(false);
    const element = cibleDuMoment();
    //  §1 (nº 276) — la zone est notée MAINTENANT : au moment où le
    //  rangement s'achèvera, la ref peut déjà être vide (démontage).
    const zone = ecoute.current;
    if (element) {
      // Retour en place, en douceur — puis on efface tout : la cible
      // redevient un simple élément, sans style résiduel.
      element.style.transition = "transform 200ms ease-out";
      element.style.transform = "";
      rangement.current = window.setTimeout(() => {
        rangement.current = null;
        element.style.transition = "";
        element.style.zIndex = "";
        element.style.position = "";
        element.style.transformOrigin = "";
        //  La sortie du cadre (fiche) s'efface avec le reste.
        element.style.left = "";
        element.style.top = "";
        element.style.width = "";
        element.style.height = "";
        //  §1 (nº 276) — LE CONFINEMENT NE REVIENT QU'ICI, une fois le
        //  retour animé achevé : le reprendre pendant les 200 ms de la
        //  transition rognerait l'image en plein mouvement.
        if (zone) delete zone.dataset.pincement;
      }, 220);
    } else if (zone) {
      delete zone.dataset.pincement;
    }
  }

  function onPointerDown(evenement: React.PointerEvent) {
    //  DÉSARMÉ (nº 219-§2) : la colonne existe, elle n'écoute pas.
    if (!arme) return;
    if (evenement.pointerType !== "touch") return;
    if (document.documentElement.dataset.appareil !== "mobile") return;
    doigts.current.set(evenement.pointerId, {
      x: evenement.clientX,
      y: evenement.clientY,
    });
    if (doigts.current.size === 2) {
      //  DEUX doigts posés : le zoom prend (ou REPREND) la main. Le
      //  marqueur part TOUT DE SUITE : un tap-navigation ne doit pas
      //  se déclencher même si le geste est ultra-bref.
      //  ⚠️ ON PASSE AUSSI ICI QUAND UN DEUXIÈME DOIGT REVIENT sur un
      //  zoom tenu par un seul (nº 207-§8) : la mesure de départ est
      //  reprise à zéro, et `courant` — l'état affiché — sert de base.
      //  Le geste continue donc là où il s'était figé.
      const reprise = actif.current;
      actif.current = true;
      //  §1 (nº 276) — un rangement encore en vol (les 220 ms du geste
      //  précédent) est annulé : il ne doit pas s'abattre sur ce geste.
      if (rangement.current !== null) {
        window.clearTimeout(rangement.current);
        rangement.current = null;
      }
      //  ⚠️ LA PHOTO PASSE DEVANT LA BARRE FIXE (nº 209-§2) : le plan
      //  de la mosaïque, tenu sous la barre au repos, monte au-dessus
      //  le temps du geste (voir la règle dans globals.css).
      document.documentElement.dataset.zoom = "1";
      //  §1 (nº 276) — PENDANT LE GESTE, LA ZONE PINCÉE CESSE D'ÊTRE
      //  CONFINÉE. La nº 224 a posé `content-visibility: auto` sur
      //  chaque carte, et cette propriété implique un confinement de
      //  peinture : tout ce qui dépasse de la boîte est rogné — le
      //  zoom ne débordait donc plus de son cadre. Le marqueur lève ce
      //  confinement (règle dans globals.css), sur CETTE zone et elle
      //  seule, le temps du pincement : les autres cartes gardent leur
      //  mémoire (le plantage à 92 cartes que la nº 224 a tué ne peut
      //  pas revenir pour une carte, le temps d'un geste).
      if (ecoute.current) ecoute.current.dataset.pincement = "1";
      finDernierPincement = Date.now();
      depart.current = mesure();
      //  LA BASE DU GESTE EST TOUJOURS CE QUE L'IMAGE MONTRE — au
      //  premier pincement l'identité, à une reprise l'état atteint
      //  (zoom tenu, et déplacements faits au doigt depuis).
      courant.current = affiche.current;
      if (!reprise) surPincement?.(true);
      const element = cibleDuMoment();
      if (element) {
          element.style.transition = "";
        if (!reprise) {
          const rect = element.getBoundingClientRect();
          // L'origine du zoom : le point ENTRE les deux doigts. Elle
          // est posée au PREMIER pincement et ne bouge plus — la
          // changer en cours de geste déplacerait l'image d'un bond.
          const ox = depart.current.centreX - rect.left;
          const oy = depart.current.centreY - rect.top;
          element.style.transformOrigin = `${ox}px ${oy}px`;
          //  Le cadre et l'origine servent aux butées du déplacement.
          cadre.current = {
            largeur: rect.width,
            hauteur: rect.height,
            ox,
            oy,
          };
          if (sortirDuCadre) {
            //  §1 (nº 276) — LA PHOTO SORT DE SON CADRE DE DÉFILEMENT
            //  (fiche) : posée en `fixed` au pixel exact où elle est
            //  déjà — la page ne peut pas défiler pendant le geste,
            //  rien ne bouge à l'écran — elle échappe au rognage du
            //  carrousel. Sa colonne garde sa taille (le cadre 4/5 est
            //  porté par la colonne, pas par elle) : la mise en page ne
            //  bronche pas.
            element.style.left = `${rect.left}px`;
            element.style.top = `${rect.top}px`;
            element.style.width = `${rect.width}px`;
            element.style.height = `${rect.height}px`;
            element.style.position = "fixed";
          } else {
            // Au-dessus des voisines de la grille pendant le geste.
            element.style.position = "relative";
          }
          element.style.zIndex = "60";
        }
      }
    }
  }

  /** Poser la transformation, et retenir ce qu'on vient de poser. */
  function poser(echelle: number, dx: number, dy: number) {
    const element = cibleDuMoment();
    if (!element) return;
    element.style.transform = `translate(${dx}px, ${dy}px) scale(${echelle})`;
    affiche.current = { echelle, dx, dy };
    finDernierPincement = Date.now();
  }

  function onPointerMove(evenement: React.PointerEvent) {
    const precedent = doigts.current.get(evenement.pointerId);
    if (!precedent) return;
    doigts.current.set(evenement.pointerId, {
      x: evenement.clientX,
      y: evenement.clientY,
    });
    if (!actif.current) return;

    //  ⚠️ UN SEUL DOIGT : IL DÉPLACE LA PHOTO AGRANDIE (nº 208-§5).
    //  Le zoom tient depuis la nº 207-§8 ; il devient manœuvrable —
    //  le doigt restant fait glisser l'image dans toutes les
    //  directions, et les butées l'empêchent de découvrir son cadre.
    //  (À l'échelle 1, les butées valent zéro : rien ne bouge.)
    if (doigts.current.size === 1) {
      const { echelle, dx, dy } = affiche.current;
      const { largeur, hauteur, ox, oy } = cadre.current;
      poser(
        echelle,
        borner(dx + (evenement.clientX - precedent.x), ox, largeur, echelle),
        borner(dy + (evenement.clientY - precedent.y), oy, hauteur, echelle)
      );
      return;
    }

    if (doigts.current.size < 2 || !depart.current) return;
    const { distance, centreX, centreY } = mesure();
    //  L'échelle suit l'écart des doigts (jamais plus petite que
    //  l'image, plafonnée à ×4) ; l'image SUIT AUSSI leur centre.
    //  ⚠️ TOUT PART DE `base` — l'état figé au moment où ce pincement
    //  a commencé : au premier, l'identité ; à une reprise, ce que
    //  l'image montrait déjà. D'où l'absence de saut.
    const base = courant.current;
    const echelle = Math.min(
      4,
      Math.max(1, base.echelle * (distance / depart.current.distance))
    );
    //  LES MÊMES BUTÉES QU'AU DOIGT (nº 208-§5) : suivre le centre des
    //  doigts ne doit pas non plus découvrir le cadre.
    const { largeur, hauteur, ox, oy } = cadre.current;
    poser(
      echelle,
      borner(base.dx + (centreX - depart.current.centreX), ox, largeur, echelle),
      borner(base.dy + (centreY - depart.current.centreY), oy, hauteur, echelle)
    );
  }

  function onPointerUp(evenement: React.PointerEvent) {
    //  ⚠️ ON NE RANGE QU'AU DERNIER DOIGT (nº 207-§8). Tant qu'il en
    //  reste un, l'image reste agrandie, exactement telle quelle : on
    //  garde l'état affiché de côté, il servira de base si un deuxième
    //  doigt revient reprendre le geste.
    doigts.current.delete(evenement.pointerId);
    if (doigts.current.size === 0) {
      terminer();
      return;
    }
    if (actif.current) {
      //  Le geste reprendra depuis ce que l'image montre — un
      //  deuxième doigt qui revient ne fait donc aucun saut.
      courant.current = affiche.current;
      depart.current = null;
    }
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  };
}

/** L'enveloppe simple : écoute et transforme le MÊME cadre — pour les
    images directement sous les doigts (carrousel de la fiche). */
export function ZoomPincement({
  children,
  classe = "",
  surPincement,
  arme = true,
  sortirDuCadre = false,
}: {
  children: React.ReactNode;
  /** Classes du cadre (il épouse l'image : lui donner sa taille). */
  classe?: string;
  surPincement?: (actif: boolean) => void;
  /**
   * ⚠️ L'ENVELOPPE EST TOUJOURS LÀ, C'EST L'ÉCOUTE QUI S'ARME
   * (nº 219-§2). Le carrousel en pose une sur CHAQUE colonne — le DOM
   * ne change donc jamais quand la photo regardée change — et n'arme
   * que celle qu'on regarde. Monter et démonter l'enveloppe, c'était
   * détruire et recréer l'image qu'elle contient, à l'instant précis
   * de l'immobilisation : le scintillement.
   */
  arme?: boolean;
  /** §1 (nº 276) — voir `usePincement` : la photo du carrousel de la
      fiche sort de son cadre de défilement le temps du geste. */
  sortirDuCadre?: boolean;
}) {
  const cadre = useRef<HTMLDivElement>(null);
  const gestes = usePincement({
    ecoute: cadre,
    cible: cadre,
    surPincement,
    arme,
    sortirDuCadre,
  });

  return (
    <div
      ref={cadre}
      className={classe}
      // Le navigateur garde le DÉFILEMENT (pan) ; le PINCEMENT, non —
      // il est à nous. Ciblé sur cette zone, jamais sur la page.
      style={{ touchAction: "pan-x pan-y" }}
      {...gestes}
    >
      {children}
    </div>
  );
}
