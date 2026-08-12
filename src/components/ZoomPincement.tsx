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
}: {
  /** L'élément qui REÇOIT les doigts (les gestionnaires retournés y
      sont posés — et le blocage du défilement s'y accroche). */
  ecoute: React.RefObject<HTMLElement | null>;
  /** L'élément TRANSFORMÉ (l'image, ou son cadre direct). */
  cible: React.RefObject<HTMLElement | null>;
  /** Prévient quand le pincement commence/finit — le carrousel s'en
      sert pour ABANDONNER son balayage en cours. */
  surPincement?: (actif: boolean) => void;
}) {
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
    if (!element) return;
    /**
     * ⚠️ CET ÉCOUTEUR EST NON PASSIF, et il y en a un par carte : le
     * navigateur consulte le fil principal avant chaque mouvement de
     * doigt, au lieu de décider seul. Il a été mesuré comme suspect de
     * l'écran gris à la passe 162 ; l'interrupteur qui permettait de
     * l'éteindre (`&sans=tactile`) a été supprimé avec le reste des
     * interrupteurs de mesure (refonte nº 191) — il n'a rien montré.
     */
    function bloquerDefilement(evenement: TouchEvent) {
      if (actif.current) evenement.preventDefault();
    }
    element.addEventListener("touchmove", bloquerDefilement, {
      passive: false,
    });
    return () => element.removeEventListener("touchmove", bloquerDefilement);
    // La ref est stable d'un rendu à l'autre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const element = cible.current;
    if (element) {
      // Retour en place, en douceur — puis on efface tout : la cible
      // redevient un simple élément, sans style résiduel.
      // eslint-disable-next-line react-hooks/immutability -- animation impérative du style d'un élément du DOM, jamais un état React
      element.style.transition = "transform 200ms ease-out";
      element.style.transform = "";
      window.setTimeout(() => {
        element.style.transition = "";
        element.style.zIndex = "";
        element.style.position = "";
        element.style.transformOrigin = "";
      }, 220);
    }
  }

  function onPointerDown(evenement: React.PointerEvent) {
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
      //  ⚠️ LA PHOTO PASSE DEVANT LA BARRE FIXE (nº 209-§2) : le plan
      //  de la mosaïque, tenu sous la barre au repos, monte au-dessus
      //  le temps du geste (voir la règle dans globals.css).
      document.documentElement.dataset.zoom = "1";
      finDernierPincement = Date.now();
      depart.current = mesure();
      //  LA BASE DU GESTE EST TOUJOURS CE QUE L'IMAGE MONTRE — au
      //  premier pincement l'identité, à une reprise l'état atteint
      //  (zoom tenu, et déplacements faits au doigt depuis).
      courant.current = affiche.current;
      if (!reprise) surPincement?.(true);
      const element = cible.current;
      if (element) {
        // eslint-disable-next-line react-hooks/immutability -- animation impérative du style d'un élément du DOM, jamais un état React
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
          // Au-dessus des voisines de la grille pendant le geste.
          element.style.position = "relative";
          element.style.zIndex = "60";
        }
      }
    }
  }

  /** Poser la transformation, et retenir ce qu'on vient de poser. */
  function poser(echelle: number, dx: number, dy: number) {
    const element = cible.current;
    if (!element) return;
    // eslint-disable-next-line react-hooks/immutability -- animation impérative du style d'un élément du DOM, jamais un état React
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
}: {
  children: React.ReactNode;
  /** Classes du cadre (il épouse l'image : lui donner sa taille). */
  classe?: string;
  surPincement?: (actif: boolean) => void;
}) {
  const cadre = useRef<HTMLDivElement>(null);
  const gestes = usePincement({ ecoute: cadre, cible: cadre, surPincement });

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
