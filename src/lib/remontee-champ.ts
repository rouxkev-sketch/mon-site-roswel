"use client";

/**
 * LA REMONTÉE D'UN CHAMP AU TOUCHER — LA mécanique, pour TOUT le site
 * ====================================================================
 * (passe nº 155-§1 — extraite de ChampLocalisation, où la passe nº 21
 * l'avait posée, pour servir CHAQUE champ de saisie.)
 *
 * LA RÈGLE : sur smartphone, toucher un champ fait remonter la page
 * pour l'amener EN HAUT DE L'ÉCRAN — toute la place disponible passe
 * alors entre le champ et le clavier, au lieu de rester inutilisée
 * au-dessus. Sans cela, le navigateur pose le champ JUSTE au-dessus
 * des touches : assez pour saisir, insuffisant pour voir ce qu'on
 * fait.
 *
 * ⚠️ AUCUN CALCUL DE POSITION, ET C'EST LE POINT. Les approches qui
 * mesuraient (`getBoundingClientRect` − `visualViewport.offsetTop` −
 * une marge choisie à la main, puis `scrollBy`) ont coûté onze passes
 * de dérive : une conversion de repère, des sémantiques opposées
 * entre iOS et Chromium. On demande au navigateur, et rien d'autre :
 *
 *     cible.scrollIntoView({ block: "start", behavior: "smooth" })
 *
 * L'air laissé au-dessus n'est pas un chiffre d'ici : c'est
 * `scroll-margin-top`, portée par le champ (globals.css) — déclaratif,
 * et différent selon le contexte sans une ligne de JavaScript.
 *
 * LE SEUL RÉGLAGE EST LE MOMENT. On écoute le redimensionnement du
 * viewport pour savoir QUAND le clavier a fini d'arriver — on n'en lit
 * AUCUNE valeur. Trop tôt, le document n'a pas encore la hauteur
 * nécessaire et le défilement est raboté ; trop tard, on voit deux
 * mouvements. On part quand les redimensionnements se taisent
 * (CALME_CLAVIER_MS), avec un filet si aucun ne vient — clavier déjà
 * levé, clavier matériel (FILET_CLAVIER_MS).
 *
 * iOS ET ANDROID, SANS DISTINCTION : le premier fait glisser le
 * viewport visuel, le second redimensionne la fenêtre — mais les deux
 * émettent `visualViewport.resize`, et les deux font défiler le
 * document de la même façon. Aucun code spécifique à l'un ou l'autre.
 */

/**
 * L'ESPACE AJOUTÉ EN BAS PENDANT LA SAISIE (passe nº 159-§3)
 * ===========================================================
 * ⚠️ C'EST LA CAUSE QUI A RÉSISTÉ À DEUX PASSES, et la sonde l'a dite
 * en une ligne :
 *
 *     scrollY 0 · champHaut 93 · marge 76px · docH 669 · innerH 669
 *
 * `scrollIntoView` ÉTAIT BIEN APPELÉ, avec les bons arguments, et la
 * marge de 76 px était bien appliquée. Mais LE DOCUMENT FAISAIT
 * EXACTEMENT LA HAUTEUR DE L'ÉCRAN : il n'y avait rien à faire
 * défiler. Une page qui ne peut pas bouger ne bouge pas — le
 * navigateur avait raison, et nos quatre corrections portaient sur un
 * mécanisme qui n'était jamais en cause.
 *
 * CE QU'ON AJOUTE : un ESPACE VIDE au bas du document, le temps de la
 * saisie. Le document devient alors plus long que l'écran, et le
 * défilement natif a de quoi travailler — il amène le champ à sa
 * marge, tout seul, comme il l'a toujours su faire.
 *
 * ⚠️ CE N'EST PAS UN CALCUL DE POSITION. On ne mesure rien, on ne
 * déplace rien : on réserve UNE HAUTEUR D'ÉCRAN de vide. Que le champ
 * soit à 90 px ou à 600 px du haut, cette hauteur suffit toujours à
 * l'amener sous la barre. Le `scrollIntoView` reste le seul à décider
 * de la position finale.
 *
 * L'ESPACE PART AVEC LE DOIGT : la fonction d'annulation le retire,
 * et elle est appelée à la perte du focus, au démontage, et à chaque
 * nouvelle remontée.
 */
const MARQUE_ESPACE = "data-espace-remontee";

/** Le silence qui dit « le clavier a fini d'arriver ». */
export const CALME_CLAVIER_MS = 120;

/** Aucun redimensionnement du tout (clavier déjà levé, clavier
    matériel) : on part quand même. */
export const FILET_CLAVIER_MS = 450;

/**
 * ARME LA REMONTÉE d'un élément : elle se joue quand le clavier s'est
 * tu, ou au filet. Rend la fonction qui l'ANNULE — un départ du champ,
 * un second toucher ou un démontage ne doivent pas laisser d'écouteur
 * derrière eux.
 */
export function armerLaRemontee(cible: HTMLElement): () => void {
  let minuteur = 0;
  let arrete = false;
  //  L'ESPACE, POSÉ TOUT DE SUITE : il doit exister AVANT le
  //  `scrollIntoView`, sinon il n'y a toujours rien à faire défiler.
  const espace = poserLEspace();

  const arreter = () => {
    if (arrete) return;
    arrete = true;
    window.clearTimeout(minuteur);
    visuel?.removeEventListener("resize", auRedimensionnement);
    window.removeEventListener("resize", auRedimensionnement);
    espace.retirer();
  };
  const remonter = () => {
    //  ⚠️ ON COUPE LES ÉCOUTEURS, MAIS ON GARDE L'ESPACE : le
    //  défilement doux qui suit a besoin que le document reste long
    //  jusqu'à son terme. L'espace ne part qu'au désarmement (perte du
    //  focus, démontage, nouvelle remontée).
    if (!arrete) {
      window.clearTimeout(minuteur);
      visuel?.removeEventListener("resize", auRedimensionnement);
      window.removeEventListener("resize", auRedimensionnement);
    }
    // LE DÉFILEMENT NATIF, ET LUI SEUL. La marge au-dessus vient de
    // `scroll-margin-top` (CSS), jamais d'un calcul d'ici.
    cible.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  const auRedimensionnement = () => {
    window.clearTimeout(minuteur);
    minuteur = window.setTimeout(remonter, CALME_CLAVIER_MS);
  };

  const visuel = window.visualViewport;
  visuel?.addEventListener("resize", auRedimensionnement);
  window.addEventListener("resize", auRedimensionnement);
  minuteur = window.setTimeout(remonter, FILET_CLAVIER_MS);

  return arreter;
}

/**
 * POSER L'ESPACE DE FIN DE DOCUMENT — et savoir le retirer.
 * Un seul à la fois : s'il en existe déjà un (deux champs touchés
 * coup sur coup), on le réutilise plutôt que d'empiler des écrans de
 * vide.
 */
function poserLEspace(): { retirer: () => void } {
  if (typeof document === "undefined") return { retirer: () => {} };
  const existant = document.querySelector(`[${MARQUE_ESPACE}]`);
  if (existant) return { retirer: () => existant.remove() };
  const espace = document.createElement("div");
  espace.setAttribute(MARQUE_ESPACE, "");
  espace.setAttribute("aria-hidden", "true");
  //  UNE HAUTEUR D'ÉCRAN, et rien d'autre : pas de fond, pas de
  //  marge, aucune prise au doigt. `dvh` suit le viewport dynamique —
  //  c'est la hauteur que le navigateur donne vraiment à l'écran.
  espace.style.cssText =
    "height:100dvh;flex:none;pointer-events:none;visibility:hidden";
  document.body.appendChild(espace);
  return { retirer: () => espace.remove() };
}
