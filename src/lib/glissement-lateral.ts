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
 * Au doigt, un glissement horizontal fait passer d'un onglet à
 * l'autre : « Favoris » ↔ « Portfolios » sur Ma sélection (nº 526),
 * « Profil » ↔ « Portfolio » sur une fiche (§2 nº 527). Ce module ne
 * connaît NI les onglets NI l'adresse : il RECONNAÎT LE GESTE et dit
 * dans quel sens il est allé. Ce qu'on en fait appartient à
 * l'appelant — c'est ce qui permet de le brancher sur l'écriture qui
 * existe déjà (celle du toucher d'un onglet), sans jamais en écrire
 * une seconde.
 *
 * ██ §2 (nº 527) — UN SEUL RECONNAISSEUR, DEUX BRANCHEMENTS ██
 * ------------------------------------------------------------------
 * La nº 526 rendait des écouteurs REACT à poser sur un élément que
 * l'appelant possède. Une fiche n'a pas cet élément : le contenu d'une
 * fiche (ContenuFiche) rend un FRAGMENT — il n'y a aucune boîte à qui
 * les donner, et en fabriquer une serait ajouter un conteneur dans la
 * colonne de lecture (pièges 378/379).
 * D'OÙ LE SECOND BRANCHEMENT, `useGlissementLateralSurLaPage` : les
 * mêmes écouteurs, posés sur `window`, et une ZONE nommée par un
 * sélecteur — le geste doit partir dedans, et c'est elle qui borne la
 * remontée des ancêtres. Une fiche passe `[data-colonne-lecture]`.
 * ⚠️ LA RECONNAISSANCE, ELLE, N'EST ÉCRITE QU'UNE FOIS : les deux
 * branchements se contentent de traduire leurs événements vers le
 * MÊME suiveur (`nouveauSuiveur`, plus bas). Seuils, verrou d'axe et
 * refus sont donc identiques par construction — ils ne peuvent pas
 * diverger, il n'y a rien à tenir d'accord.
 *
 * ⚠️ AUCUN MARQUAGE, AUCUNE BOÎTE : ce module ne rend rien. Il ne
 * peut donc rien déplacer à l'écran.
 *
 * ══ POURQUOI DES ÉVÉNEMENTS TACTILES, ET NON DES POINTEURS ═══════
 * C'est LE choix technique de ce module, et il n'est pas un détail de
 * goût. Un `pointermove` s'ARRÊTE dès que le navigateur décide que le
 * geste lui appartient : il envoie `pointercancel` et ne dit plus rien.
 * Or le geste qu'on mesure se déroule sur une page qui défile — le
 * navigateur est un candidat permanent. La parade habituelle est de lui
 * retirer l'axe horizontal (`touch-action`), et ELLE EST INTERDITE ICI :
 * posée sur un conteneur de page, elle vaudrait pour tout ce qu'il
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
 *  2. CE QUI DÉFILE LATÉRALEMENT. Une galerie de portfolio, le
 *     carrousel d'une fiche, la rangée de vignettes d'un profil suivi :
 *     le doigt doit y faire défiler la rangée, pas changer d'onglet.
 *     LA MESURE EST GÉNÉRIQUE, pas un marquage : on remonte les
 *     ancêtres du point de départ et on refuse dès que l'un d'eux
 *     DÉBORDE HORIZONTALEMENT et défile (`overflow-x` qui défile ET
 *     une largeur de contenu supérieure à la boîte). Il n'y a donc
 *     aucun attribut à penser à poser, et ce qu'une passe future
 *     ajoutera sera attrapé sans qu'on y revienne. Et une rangée qui
 *     tient ENTIÈRE dans son cadre n'a rien à faire défiler : elle ne
 *     refuse rien, à raison.
 *     ⚠️ LA QUESTION EST POSÉE UNE SEULE FOIS, AU POSER DU DOIGT : un
 *     glissement parti d'une rangée ne peut donc pas devenir une
 *     bascule en sortant de cette rangée en cours de route.
 *
 *  3. LE RETOUR DU NAVIGATEUR. iOS et Android ouvrent leur geste de
 *     retour (et d'avance) sur les tout premiers millimètres du bord de
 *     l'écran : on n'écoute pas ce qui commence à moins de 24 px d'un
 *     bord — deux gestes qui se disputent la même zone, c'est le
 *     navigateur qui gagne, et il doit gagner.
 *
 *  4. UNE SURFACE OUVERTE PAR-DESSUS — la feuille des filtres, une
 *     fenêtre de fiche ou de carrousel, la pile. Ces surfaces GÈLENT
 *     LE CORPS (`corpsGele`) : un menu déroulant ouvert ne peut donc
 *     rien déclencher, ce qui est la consigne. Sur le branchement
 *     REACT s'ajoute une garde de structure — la feuille et le panneau
 *     vivent dans un PORTAIL, hors de l'élément porteur.
 *
 *  5. LE PINCEMENT. Le geste est abandonné dès qu'un second doigt
 *     touche l'écran, au poser comme en route : deux doigts, ce n'est
 *     plus un glissement.
 *
 *  6. LE DÉFILEMENT VERTICAL DE LA PAGE. Voir juste dessous.
 *
 *  7. CE QUI N'EST PAS DANS LA ZONE (branchement `SurLaPage`). Le
 *     geste doit PARTIR d'un élément contenu dans le sélecteur donné.
 *     Sur une fiche, c'est la colonne de lecture — celle qui porte les
 *     deux onglets et leurs deux panneaux. Conséquence heureuse et
 *     gratuite : EN VUE PHOTO (nº 453), cette colonne est retirée de
 *     l'affichage — rien dedans ne peut être touché, le geste ne peut
 *     donc pas commencer, et l'on ne bascule pas un va-et-vient que
 *     personne ne voit. Aucune garde n'a eu à le dire.
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
 * propriété `touch-action`, et les écouteurs de page sont posés en
 * PASSIF — le navigateur sait d'avance qu'on ne lui prendra rien. La
 * page défile exactement comme avant pendant qu'on mesure, et le geste
 * reste toujours disponible pour elle. C'est ce qui garantit que ni le
 * défilement vertical ni les galeries ne peuvent être abîmés : il n'y
 * a rien ici qui puisse le leur prendre.
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
 * Un doigt qui glisse de 64 px sur une carte ou une vignette peut, au
 * relâchement, produire quand même un CLIC sur ce qu'il touchait : on
 * aurait changé d'onglet ET ouvert une fiche ou une photo. Le premier
 * clic qui suit une bascule est donc avalé, en phase de capture, et
 * l'écouteur se retire de lui-même — au premier clic, ou au bout de
 * 400 ms s'il ne vient jamais.
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
  axe: "undecided" | "horizontal";
};

/*  CE QU'ON LIT D'UN DOIGT, ET RIEN DE PLUS. Le type le dit à la
    place d'un commentaire — et il rend le suiveur indifférent à la
    PROVENANCE de l'événement : React décrit ses touchers avec un type
    à lui, plus étroit que celui du navigateur (ni `force`, ni rayon).
    Demander l'un des deux fermerait la porte à l'autre ; on ne demande
    que les trois valeurs dont on se sert. */
type Doigt = { identifier: number; clientX: number; clientY: number };

/** Le geste part-il d'une zone qui défile horizontalement ? On s'arrête
    à la borne : au-dessus d'elle, ce n'est plus notre affaire. */
function partDUneZoneQuiDefile(depart: Element | null, borne: Element) {
  let noeud: Element | null = depart;
  while (noeud && noeud !== borne) {
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
 * ██ LE SUIVEUR — LA RECONNAISSANCE, ÉCRITE UNE SEULE FOIS ██
 * ------------------------------------------------------------------
 * Quatre entrées, aucune connaissance de React ni du DOM d'un
 * appelant : les deux branchements ci-dessous lui traduisent leurs
 * événements. `rappel` est relu à chaque bascule (jamais capturé) :
 * l'appelant peut donc changer de fonction sans rien reposer.
 */
function nouveauSuiveur(rappel: () => (sens: SensGlissement) => void) {
  let geste: Geste | null = null;
  return {
    debut(
      doigts: number,
      doigt: Doigt | undefined,
      depart: Element | null,
      borne: Element
    ) {
      //  §5 — un second doigt, ou un geste déjà en cours : on sort.
      geste = null;
      if (doigts !== 1 || !doigt) return;
      //  §1 — le document doit se dire mobile.
      if (document.documentElement.dataset.appareil !== "mobile") return;
      //  §4 — une surface recouvre l'écran.
      if (corpsGele()) return;
      //  §3 — la bande que le navigateur se réserve.
      const x = doigt.clientX;
      if (x < BORD || x > window.innerWidth - BORD) return;
      //  §2 — le départ est-il dans une rangée qui défile ?
      if (partDUneZoneQuiDefile(depart, borne)) return;

      geste = { doigt: doigt.identifier, x, y: doigt.clientY, axe: "undecided" };
    },

    bouge(doigts: number, doigt: Doigt | undefined) {
      if (!geste) return;
      //  §5 — un doigt s'est ajouté : ce n'est plus un glissement.
      if (doigts !== 1 || !doigt || doigt.identifier !== geste.doigt) {
        geste = null;
        return;
      }
      const dx = doigt.clientX - geste.x;
      const dy = doigt.clientY - geste.y;

      if (geste.axe === "undecided") {
        //  Tant qu'on n'a pas bougé assez, on ne décide rien.
        if (Math.abs(dx) < TOLERANCE && Math.abs(dy) < TOLERANCE) return;
        if (Math.abs(dy) >= Math.abs(dx)) {
          //  Un défilement : on rend la main tout de suite.
          geste = null;
          return;
        }
        geste.axe = "horizontal";
      }
      //  L'axe est tenu, mais le geste peut encore se perdre.
      if (Math.abs(dy) > DERIVE) geste = null;
    },

    fin(leves: ArrayLike<Doigt>) {
      const encours = geste;
      geste = null;
      if (!encours || encours.axe !== "horizontal") return;
      const doigt = Array.from(leves).find(
        (candidat) => candidat.identifier === encours.doigt
      );
      if (!doigt) return;
      const dx = doigt.clientX - encours.x;
      if (Math.abs(dx) < SEUIL) return;
      avalerLeClicFantome();
      //  Le doigt part à gauche → l'onglet de droite, et l'inverse.
      rappel()(dx < 0 ? 1 : -1);
    },

    annule() {
      geste = null;
    },
  };
}

/** Le rappel le plus récent, dans une référence : les écouteurs ne
    dépendent ainsi de RIEN et ne se refabriquent jamais — la leçon des
    nº 521/522, appliquée d'avance. */
function useRappelFrais(surGlissement: (sens: SensGlissement) => void) {
  const rappel = useRef(surGlissement);
  useEffect(() => {
    rappel.current = surGlissement;
  });
  return rappel;
}

/**
 * BRANCHEMENT nº 1 (nº 526) — DES ÉCOUTEURS REACT.
 * Rend les quatre écouteurs à poser sur un élément que l'appelant
 * possède ; c'est cet élément qui borne la remontée des ancêtres.
 * `surGlissement` reçoit le SENS VOULU (voir `SensGlissement`).
 */
export function useGlissementLateral(
  surGlissement: (sens: SensGlissement) => void
) {
  const rappel = useRappelFrais(surGlissement);
  const suiveur = useMemo(() => nouveauSuiveur(() => rappel.current), [rappel]);

  return useMemo(
    () => ({
      onTouchStart(evenement: TouchEventReact<HTMLElement>) {
        suiveur.debut(
          evenement.touches.length,
          evenement.touches[0],
          evenement.target instanceof Element ? evenement.target : null,
          evenement.currentTarget
        );
      },
      onTouchMove(evenement: TouchEventReact<HTMLElement>) {
        suiveur.bouge(evenement.touches.length, evenement.touches[0]);
      },
      onTouchEnd(evenement: TouchEventReact<HTMLElement>) {
        suiveur.fin(evenement.changedTouches);
      },
      onTouchCancel() {
        suiveur.annule();
      },
    }),
    [suiveur]
  );
}

/**
 * BRANCHEMENT nº 2 (§2 nº 527) — DES ÉCOUTEURS DE PAGE.
 * Pour un appelant qui n'a aucune boîte à donner (un contenu rendu en
 * fragment). Le geste doit PARTIR d'un élément contenu dans `zone`, un
 * sélecteur ; l'élément trouvé borne la remontée des ancêtres — il
 * joue exactement le rôle du porteur du branchement nº 1.
 * ⚠️ ÉCOUTEURS PASSIFS, et posés sur `window` : on ne prend rien, et
 * l'appel se démonte avec le composant.
 */
export function useGlissementLateralSurLaPage(
  surGlissement: (sens: SensGlissement) => void,
  zone: string
) {
  const rappel = useRappelFrais(surGlissement);

  useEffect(() => {
    const suiveur = nouveauSuiveur(() => rappel.current);
    const debut = (evenement: TouchEvent) => {
      const depart =
        evenement.target instanceof Element ? evenement.target : null;
      const borne = depart?.closest(zone) ?? null;
      //  §7 — hors zone : rien à suivre, et on efface un geste resté
      //  en l'air (un doigt reposé ailleurs ne prolonge pas l'autre).
      if (!borne) {
        suiveur.annule();
        return;
      }
      suiveur.debut(evenement.touches.length, evenement.touches[0], depart, borne);
    };
    const bouge = (evenement: TouchEvent) =>
      suiveur.bouge(evenement.touches.length, evenement.touches[0]);
    const fin = (evenement: TouchEvent) => suiveur.fin(evenement.changedTouches);
    const annule = () => suiveur.annule();

    const passif = { passive: true } as const;
    window.addEventListener("touchstart", debut, passif);
    window.addEventListener("touchmove", bouge, passif);
    window.addEventListener("touchend", fin, passif);
    window.addEventListener("touchcancel", annule, passif);
    return () => {
      window.removeEventListener("touchstart", debut);
      window.removeEventListener("touchmove", bouge);
      window.removeEventListener("touchend", fin);
      window.removeEventListener("touchcancel", annule);
    };
  }, [rappel, zone]);
}
