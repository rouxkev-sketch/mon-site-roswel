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

  const arreter = () => {
    if (arrete) return;
    arrete = true;
    window.clearTimeout(minuteur);
    visuel?.removeEventListener("resize", auRedimensionnement);
    window.removeEventListener("resize", auRedimensionnement);
  };
  const remonter = () => {
    arreter();
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
