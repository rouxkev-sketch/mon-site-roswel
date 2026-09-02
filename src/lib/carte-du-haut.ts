"use client";

import { defilerSansGeste } from "@/lib/defilement-programme";

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

/**
 * ⚠️ ET ON S'EN SOUVIENT APRÈS L'AVOIR CONSOMMÉE (passe nº 162-§2).
 * La remise en place n'est plus un geste unique : tant que la page
 * BOUGE ENCORE (images qui arrivent, mise en page tardive), le verrou
 * de bascule la rejoue — c'est ce qui verrouille vraiment la position.
 * `note` reste la note À CONSOMMER (une bascule, une remise en place
 * automatique) ; `derniere` est la même carte, gardée le temps du
 * verrou, et effacée par `oublierLaCarteDuHaut` à sa levée.
 */
let derniere: string | null = null;

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
  const bas = window.innerHeight;
  let choisie = "";
  let meilleure = 0;
  for (const carte of document.querySelectorAll<HTMLElement>("[data-carte]")) {
    const boite = carte.getBoundingClientRect();
    /**
     * ⚠️ LA CARTE QUI OCCUPE LE PLUS DE PLACE, ET NON LA PLUS HAUTE
     * (nº 213-§2). On retenait la PREMIÈRE carte passant sous la
     * barre : à trois pixels visibles, elle l'emportait sur celle qui
     * remplissait tout l'écran juste dessous. La bascule ramenait donc
     * sur une carte qu'on ne regardait pas.
     * On mesure maintenant la SURFACE VISIBLE de chacune — la hauteur
     * comprise entre la barre et le bas de l'écran (la largeur est la
     * même pour toutes dans une colonne, et proportionnelle en deux :
     * comparer les hauteurs suffit et évite une mesure de plus). La
     * plus grande gagne : c'est celle que l'œil tient.
     */
    const visible = Math.min(boite.bottom, bas) - Math.max(boite.top, repere);
    if (visible <= meilleure) continue;
    meilleure = visible;
    choisie = carte.dataset.carte ?? "";
  }
  // Tout en haut de la page (rien n'est encore passé sous la barre) :
  // il n'y a rien à rattraper, la bascule ne bougera pas la page.
  note = choisie && window.scrollY > 1 ? choisie : null;
  derniere = note;
}

/**
 * REPOSE LA CARTE NOTÉE SOUS LA BARRE — à appeler APRÈS que la
 * nouvelle disposition est peinte. Vrai si quelque chose a été fait.
 * La note est consommée : une seule bascule, une seule remise en place.
 */
export function reposerLaCarteDuHaut(): boolean {
  const visee = note;
  note = null;
  return poserLaPageSurLaCarte(visee);
}

/**
 * LA REMETTRE ENCORE, SANS CONSOMMER LA NOTE (passe nº 162-§2) — le
 * verrou de bascule s'en sert à chaque fois que la hauteur du document
 * bouge encore, jusqu'à ce qu'elle se taise.
 */
export function reposerEncoreLaCarteDuHaut(): boolean {
  return poserLaPageSurLaCarte(derniere);
}

/** LA LEVÉE DU VERROU : on oublie la carte. Sans cela, une bascule
    suivante pourrait reposer la page sur une carte d'avant. */
export function oublierLaCarteDuHaut() {
  note = null;
  derniere = null;
}

function poserLaPageSurLaCarte(visee: string | null): boolean {
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
  // ⚠️ ET SANS QUE CE SOIT UN GESTE (nº 154-§6A) : ce saut n'est pas
  // un doigt qui défile. Sans l'annoncer, la barre y lisait un geste
  // vers le bas et REPLIAIT sa rangée de recherche — on touchait un
  // bouton d'affichage, et la barre se rétractait toute seule.
  defilerSansGeste(
    {
    top: Math.max(0, window.scrollY + boite.top - repere),
    left: 0,
  },
    "top card (layout change)"
  );
  return true;
}
