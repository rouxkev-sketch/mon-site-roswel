"use client";

/**
 * LA CARTE QU'ON REGARDE SURVIT AU CHANGEMENT DE DISPOSITION
 * ===========================================================
 * LE DÉFAUT CORRIGÉ : le bouton rond de la barre fixe bascule la
 * mosaïque entre deux colonnes et une image par ligne. Les cartes
 * changent alors de taille — en une colonne, chacune occupe presque un
 * écran — donc la même position de défilement ne montre PLUS DU TOUT le
 * même tatoueur. On se retrouvait ailleurs dans la liste, sans savoir
 * où.
 *
 * LA RÈGLE : ce qu'on garde, ce n'est pas une position en pixels, c'est
 * UNE CARTE. On note laquelle occupe le haut de l'écran avant la
 * bascule, et on la ramène au même endroit après.
 *
 * LE REPÈRE : le bas de la barre fixe, mesuré sur place (elle porte
 * `data-barre-fixe`). C'est la première ligne réellement lisible de la
 * page — celle que l'œil suit. On ne rejoue pas le décalage exact de la
 * carte : on POSE SON HAUT sous la barre. La carte visée est entière,
 * quelle que soit la disposition, et c'est ce qu'on attend d'une
 * bascule.
 *
 * OÙ VIT LA NOTE : dans ce module, le temps d'une bascule. Elle est
 * prise par le bouton (MoteurTatouage) et reprise par la grille
 * (GrilleTatoueurs) au rendu suivant — puis effacée. Rien n'est
 * stocké, rien ne survit à la page.
 */

/** Ce qu'on retient tient en un mot : l'identifiant de la carte. */
let note: string | null = null;

/** Le bas de la barre fixe, ou 0 si elle n'est pas là (web, pages
    sans barre). C'est notre ligne de repère. */
export function repereDuHaut(): number {
  const barre = document.querySelector("[data-barre-fixe]");
  return barre ? Math.round(barre.getBoundingClientRect().bottom) : 0;
}

/**
 * NOTE LA CARTE DU HAUT — à appeler JUSTE AVANT de changer la
 * disposition. Silencieux s'il n'y a pas de carte à l'écran.
 */
export function noterLaCarteDuHaut() {
  const repere = repereDuHaut();
  let choisie = "";
  for (const carte of document.querySelectorAll<HTMLElement>("[data-carte]")) {
    // La première carte dont le BAS passe sous le repère : c'est celle
    // que l'on voit en haut de l'écran, entière ou entamée.
    if (carte.getBoundingClientRect().bottom <= repere + 1) continue;
    choisie = carte.dataset.carte ?? "";
    break;
  }
  // Tout en haut de la page (rien n'est encore passé sous la barre) :
  // il n'y a rien à rattraper, la bascule ne bougera pas la page.
  note = choisie && window.scrollY > 1 ? choisie : null;
}

/**
 * REPOSE LA CARTE NOTÉE SOUS LA BARRE — à appeler APRÈS que la
 * nouvelle disposition est peinte. Vrai si quelque chose a été fait.
 * La note est consommée : une seule bascule, une seule remise en place.
 */
export function reposerLaCarteDuHaut(): boolean {
  const visee = note;
  note = null;
  if (!visee) return false;
  const carte = document.querySelector<HTMLElement>(
    `[data-carte="${CSS.escape(visee)}"]`
  );
  if (!carte) return false;
  const repere = repereDuHaut();
  const boite = carte.getBoundingClientRect();
  // ⚠️ « instant » : le site déclare un défilement doux global, et sans
  // cela la mosaïque GLISSERAIT sur plusieurs centaines de pixels après
  // chaque bascule. On POSE la page, on ne la promène pas.
  window.scrollTo({
    top: Math.max(0, window.scrollY + boite.top - repere),
    left: 0,
    behavior: "instant",
  });
  return true;
}
