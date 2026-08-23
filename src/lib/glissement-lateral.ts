"use client";

import { useEffect, useMemo, useRef } from "react";
import type { TouchEvent as TouchEventReact } from "react";
//  Le gel du corps : il est posé par TOUTE surface qui recouvre
//  l'écran — la feuille des filtres au doigt, une fenêtre de fiche, la
//  pile. C'est notre garde « quelque chose est ouvert par-dessus ».
import { corpsGele } from "@/lib/gel-du-corps";

/**
 * ██ §2 (nº 526) — LE GLISSEMENT LATÉRAL QUI CHANGE D'ONGLET ██
 * ==================================================================
 * Sur « Ma sélection », au doigt, un glissement horizontal fait passer
 * de « Favoris » à « Portfolios » et retour. Ce module ne connaît NI
 * les onglets NI l'adresse : il RECONNAÎT LE GESTE et dit dans quel
 * sens il est allé. Ce qu'on en fait appartient à l'appelant — c'est
 * ce qui permet de le brancher sur l'écriture qui existe déjà (celle
 * du toucher d'un onglet), sans jamais en écrire une seconde.
 *
 * ⚠️ POURQUOI IL N'EST PAS UN COMPOSANT, ET NE POSE AUCUN MARQUAGE :
 * il rend QUATRE ÉCOUTEURS à poser sur un élément que l'appelant
 * possède déjà. Aucune classe, aucun conteneur, aucune boîte neuve —
 * donc rien de la mise en page ne peut bouger (pièges 378/379).
 * L'élément porteur gagne des écouteurs, il ne change ni de style ni
 * de forme.
 *
 * ══ POURQUOI DES ÉVÉNEMENTS TACTILES, ET NON DES POINTEURS ═══════
 * C'est LE choix technique de ce module, et il n'est pas un détail de
 * goût. Un `pointermove` s'ARRÊTE dès que le navigateur décide que le
 * geste lui appartient : il envoie `pointercancel` et ne dit plus rien.
 * Or le geste qu'on mesure se déroule sur une page qui défile — le
 * navigateur est un candidat permanent. La parade habituelle est de lui
 * retirer l'axe horizontal (`touch-action`), et ELLE EST INTERDITE ICI :
 * posée sur la racine de page, elle vaudrait pour tout ce qu'elle
 * contient — À COMMENCER PAR LES GALERIES, qui ne défileraient plus.
 * Les événements TACTILES, eux, continuent d'arriver pendant que la
 * page défile : ils permettent de REGARDER le geste sans jamais le
 * prendre. Et ils ne naissent que d'un doigt : une souris n'en produit
 * aucun — le web ne change pas, par construction, sans aucune garde à
 * écrire pour cela.
 *
 * ══ CE QUI DOIT REFUSER LE GESTE, ET COMMENT ══════════════════════
 *
 *  1. LE WEB. Les événements tactiles s'en chargent (ci-dessus) ; on
 *     demande en plus au document de se déclarer mobile
 *     (`data-appareil`, la règle du site depuis la nº 60 — un pointeur
 *     grossier, jamais une largeur d'écran). Un ordinateur à écran
 *     tactile ne bascule donc pas non plus.
 *
 *  2. UNE GALERIE QUI DÉFILE. Sur « Portfolios », chaque profil porte
 *     une rangée horizontale : le doigt doit y faire défiler la rangée,
 *     pas changer d'onglet. LA MESURE EST GÉNÉRIQUE, pas un marquage :
 *     on remonte les ancêtres du point de départ et on refuse dès que
 *     l'un d'eux DÉBORDE HORIZONTALEMENT et défile. Elle attrape donc
 *     `data-galerie-defilante`, le carrousel d'une fiche, et tout ce
 *     qu'une passe future ajoutera — il n'y a aucun attribut à penser
 *     à poser. Et une galerie qui tient ENTIÈRE dans son cadre n'a rien
 *     à faire défiler : elle ne refuse rien, à raison.
 *     ⚠️ LA QUESTION EST POSÉE UNE SEULE FOIS, AU POSER DU DOIGT : un
 *     glissement parti d'une galerie ne peut donc pas devenir une
 *     bascule en sortant de la galerie en cours de route.
 *
 *  3. LE RETOUR DU NAVIGATEUR. iOS et Android ouvrent leur geste de
 *     retour (et d'avance) sur les tout premiers millimètres du bord de
 *     l'écran : on n'écoute pas ce qui commence à moins de 24 px d'un
 *     bord — deux gestes qui se disputent la même zone, c'est le
 *     navigateur qui gagne, et il doit gagner.
 *
 *  4. UNE SURFACE OUVERTE PAR-DESSUS — la feuille des filtres, une
 *     fenêtre de fiche, la pile. DEUX gardes, encore : ces surfaces
 *     GÈLENT LE CORPS (`corpsGele`), et la feuille comme le panneau
 *     vivent dans un PORTAIL — leurs événements ne passent jamais par
 *     l'élément porteur. Un menu déroulant ouvert ne peut donc rien
 *     déclencher, ce qui est la consigne.
 *
 *  5. LE PINCEMENT. Le geste est abandonné dès qu'un second doigt
 *     touche l'écran, au poser comme en route : deux doigts, ce n'est
 *     plus un glissement.
 *
 *  6. LE DÉFILEMENT VERTICAL DE LA PAGE. Voir juste dessous.
 *
 * ══ HORIZONTAL OU VERTICAL : L'AXE SE DÉCIDE UNE FOIS ═════════════
 * C'est le motif classique du verrou d'axe, et il tient en une phrase :
 * au premier mouvement qui dépasse la TOLÉRANCE (12 px — le tremblement
 * d'un doigt qui se pose vaut une dizaine de pixels), on compare les
 * deux déplacements. Le plus grand gagne, et il gagne POUR TOUT LE
 * GESTE : vertical, on abandonne aussitôt (c'est un défilement) ;
 * horizontal, on continue de mesurer. Décider à chaque image, au
 * contraire, ferait osciller un geste en diagonale entre les deux
 * lectures.
 * ⚠️ ET L'AXE PEUT SE PERDRE EN ROUTE : un geste devenu vertical après
 * s'être annoncé horizontal (on cherchait une photo, on se met à
 * descendre) est abandonné dès que sa DÉRIVE dépasse 48 px. Sans cela,
 * un long défilement commencé de biais basculerait à l'arrivée.
 *
 * ⚠️ RIEN N'EST EMPÊCHÉ, JAMAIS : aucun `preventDefault`, aucune
 * propriété `touch-action`. La page défile exactement comme avant
 * pendant qu'on mesure — et le geste reste TOUJOURS disponible pour le
 * navigateur, qui en fait ce qu'il veut. C'est ce qui garantit que ni
 * le défilement vertical ni les galeries ne peuvent être abîmés : il
 * n'y a rien ici qui puisse le leur prendre.
 *
 * ══ LE SEUIL DE DÉCLENCHEMENT ════════════════════════════════════
 * 64 px, une distance FIXE et non une part de l'écran : le geste doit
 * se sentir pareil sur un petit et un grand téléphone. En dessous d'une
 * cinquantaine de pixels on attrape les hésitations de fin de
 * défilement ; au-delà d'une centaine, le geste ressemble à du travail
 * et paraît mort quand il ne prend pas. 64 px, c'est environ deux
 * largeurs de pouce, le sixième d'un écran de 390 px.
 *
 * ══ LE CLIC FANTÔME ══════════════════════════════════════════════
 * Un doigt qui glisse de 64 px sur une carte peut, au relâchement,
 * produire quand même un CLIC sur ce qu'il touchait : on aurait changé
 * d'onglet ET ouvert une fiche. Le premier clic qui suit une bascule
 * est donc avalé, en phase de capture, et l'écouteur se retire de
 * lui-même — au premier clic, ou au bout de 400 ms s'il ne vient
 * jamais.
 */

/** Le tremblement toléré avant de décider de l'axe. */
const TOLERANCE = 12;
/** La distance horizontale qui déclenche la bascule. */
const SEUIL = 64;
/** La dérive verticale qui annule un geste déjà dit horizontal. */
const DERIVE = 48;
/** La bande de bord réservée au geste de retour du navigateur. */
const BORD = 24;
/** Le temps pendant lequel un clic fantôme est encore possible. */
const FANTOME_MS = 400;

/** 1 = « va vers l'onglet de DROITE » (le doigt est parti vers la
    gauche) ; -1 = « va vers celui de GAUCHE ». C'est le SENS VOULU,
    pas le sens du doigt : l'appelant n'a aucune inversion à refaire. */
export type SensGlissement = -1 | 1;

type Geste = {
  doigt: number;
  x: number;
  y: number;
  axe: "indécis" | "horizontal";
};

/** Le geste part-il d'une zone qui défile horizontalement ? On s'arrête
    au porteur : au-dessus de lui, ce n'est plus notre affaire. */
function partDUneZoneQuiDefile(depart: Element | null, porteur: Element) {
  let noeud: Element | null = depart;
  while (noeud && noeud !== porteur) {
    if (noeud instanceof HTMLElement) {
      const debord = getComputedStyle(noeud).overflowX;
      if (
        (debord === "auto" || debord === "scroll") &&
        noeud.scrollWidth > noeud.clientWidth
      ) {
        return true;
      }
    }
    noeud = noeud.parentElement;
  }
  return false;
}

/** Avaler le clic qui suivrait la bascule — voir la note du module. */
function avalerLeClicFantome() {
  const avaler = (evenement: Event) => {
    evenement.preventDefault();
    evenement.stopPropagation();
  };
  window.addEventListener("click", avaler, { capture: true, once: true });
  window.setTimeout(
    () => window.removeEventListener("click", avaler, true),
    FANTOME_MS
  );
}

/**
 * Rend les écouteurs à poser sur l'élément qui porte la page.
 * `surGlissement` reçoit le SENS VOULU (voir `SensGlissement`).
 */
export function useGlissementLateral(
  surGlissement: (sens: SensGlissement) => void
) {
  /*  LE RAPPEL LE PLUS RÉCENT, DANS UNE RÉFÉRENCE : les écouteurs
      rendus plus bas ne dépendent ainsi de RIEN et ne se refabriquent
      jamais — la leçon des nº 521/522, appliquée d'avance. */
  const rappel = useRef(surGlissement);
  useEffect(() => {
    rappel.current = surGlissement;
  });

  const geste = useRef<Geste | null>(null);

  return useMemo(
    () => ({
      onTouchStart(evenement: TouchEventReact<HTMLElement>) {
        //  §5 — un second doigt, ou un geste déjà en cours : on sort.
        geste.current = null;
        if (evenement.touches.length !== 1) return;
        const doigt = evenement.touches[0];
        //  §1 — le document doit se dire mobile.
        if (document.documentElement.dataset.appareil !== "mobile") return;
        //  §4 — une surface recouvre l'écran.
        if (corpsGele()) return;
        //  §3 — la bande que le navigateur se réserve.
        const x = doigt.clientX;
        if (x < BORD || x > window.innerWidth - BORD) return;
        //  §2 — le départ est-il dans une rangée qui défile ?
        const depart =
          evenement.target instanceof Element ? evenement.target : null;
        if (partDUneZoneQuiDefile(depart, evenement.currentTarget)) return;

        geste.current = {
          doigt: doigt.identifier,
          x,
          y: doigt.clientY,
          axe: "indécis",
        };
      },

      onTouchMove(evenement: TouchEventReact<HTMLElement>) {
        const encours = geste.current;
        if (!encours) return;
        //  §5 — un doigt s'est ajouté : ce n'est plus un glissement.
        if (evenement.touches.length !== 1) {
          geste.current = null;
          return;
        }
        const doigt = evenement.touches[0];
        if (doigt.identifier !== encours.doigt) {
          geste.current = null;
          return;
        }
        const dx = doigt.clientX - encours.x;
        const dy = doigt.clientY - encours.y;

        if (encours.axe === "indécis") {
          //  Tant qu'on n'a pas bougé assez, on ne décide rien.
          if (Math.abs(dx) < TOLERANCE && Math.abs(dy) < TOLERANCE) return;
          if (Math.abs(dy) >= Math.abs(dx)) {
            //  Un défilement : on rend la main tout de suite.
            geste.current = null;
            return;
          }
          encours.axe = "horizontal";
        }
        //  L'axe est tenu, mais le geste peut encore se perdre.
        if (Math.abs(dy) > DERIVE) geste.current = null;
      },

      onTouchEnd(evenement: TouchEventReact<HTMLElement>) {
        const encours = geste.current;
        geste.current = null;
        if (!encours || encours.axe !== "horizontal") return;
        const doigt = Array.from(evenement.changedTouches).find(
          (candidat) => candidat.identifier === encours.doigt
        );
        if (!doigt) return;
        const dx = doigt.clientX - encours.x;
        if (Math.abs(dx) < SEUIL) return;
        avalerLeClicFantome();
        //  Le doigt part à gauche → l'onglet de droite, et l'inverse.
        rappel.current(dx < 0 ? 1 : -1);
      },

      onTouchCancel() {
        geste.current = null;
      },
    }),
    []
  );
}
