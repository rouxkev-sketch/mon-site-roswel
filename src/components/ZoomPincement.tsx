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
    if (doigts.current.size === 2 && !actif.current) {
      // DEUX doigts posés : le zoom prend la main. Le marqueur part
      // TOUT DE SUITE : un tap-navigation ne doit pas se déclencher
      // même si le geste est ultra-bref.
      actif.current = true;
      finDernierPincement = Date.now();
      depart.current = mesure();
      surPincement?.(true);
      const element = cible.current;
      if (element) {
        const rect = element.getBoundingClientRect();
        // eslint-disable-next-line react-hooks/immutability -- animation impérative du style d'un élément du DOM, jamais un état React
        element.style.transition = "";
        // L'origine du zoom : le point ENTRE les deux doigts.
        element.style.transformOrigin = `${depart.current.centreX - rect.left}px ${
          depart.current.centreY - rect.top
        }px`;
        // Au-dessus des voisines de la grille pendant le geste.
        element.style.position = "relative";
        element.style.zIndex = "60";
      }
    }
  }

  function onPointerMove(evenement: React.PointerEvent) {
    if (!doigts.current.has(evenement.pointerId)) return;
    doigts.current.set(evenement.pointerId, {
      x: evenement.clientX,
      y: evenement.clientY,
    });
    if (!actif.current || doigts.current.size < 2 || !depart.current) return;
    const { distance, centreX, centreY } = mesure();
    // L'échelle suit l'écart des doigts (jamais plus petite que
    // l'image, plafonnée à ×4) ; l'image SUIT AUSSI leur centre.
    const echelle = Math.min(
      4,
      Math.max(1, distance / depart.current.distance)
    );
    const dx = centreX - depart.current.centreX;
    const dy = centreY - depart.current.centreY;
    const element = cible.current;
    if (element) {
      // eslint-disable-next-line react-hooks/immutability -- animation impérative du style d'un élément du DOM, jamais un état React
      element.style.transform = `translate(${dx}px, ${dy}px) scale(${echelle})`;
      finDernierPincement = Date.now();
    }
  }

  function onPointerUp(evenement: React.PointerEvent) {
    doigts.current.delete(evenement.pointerId);
    if (doigts.current.size < 2) terminer();
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
