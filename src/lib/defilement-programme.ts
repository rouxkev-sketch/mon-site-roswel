"use client";

/**
 * UN DÉFILEMENT POSÉ PAR LE SITE N'EST PAS UN GESTE
 * ==================================================
 * ⚠️ CE MODULE RÉPARE « LA BARRE SE REPLIE TOUTE SEULE » (nº 154-§6A).
 *
 * LE DÉFAUT. Changer de disposition, ou montrer/masquer le texte des
 * cartes, REPOSE la page sur la carte qu'on regardait
 * (lib/carte-du-haut) — un `window.scrollTo` de plusieurs centaines de
 * pixels. Or la barre juge le GESTE de l'utilisateur en cumulant les
 * deltas de défilement (nº 150-§5) : ce saut, qu'aucun doigt n'a fait,
 * franchissait le seuil des 24 px et REPLIAIT la rangée de recherche.
 * Vu de l'écran : on touche un bouton d'affichage, et la barre se
 * rétracte sans que rien n'ait été fait défiler.
 *
 * LA RÈGLE. Le site annonce ses propres défilements. Pendant ce
 * court instant, les écouteurs qui interprètent un GESTE se taisent —
 * ils prennent acte de la nouvelle position, mais n'y lisent aucune
 * intention. Tout ce qui MESURE (la barre posée, la mémoire de
 * position) continue de travailler normalement.
 *
 * POURQUOI UN ATTRIBUT SUR `<html>` ET PAS UNE VARIABLE. Les
 * écouteurs vivent dans d'autres modules et d'autres composants ; un
 * attribut de document est lisible de partout, survit à un remontage,
 * et se voit dans l'inspecteur quand on cherche à comprendre.
 *
 * LA LEVÉE SE FAIT SUR DEUX IMAGES **ET** UN DÉLAI. `scrollTo` est
 * synchrone, mais l'événement `scroll` qu'il déclenche arrive à
 * l'image suivante — parfois bien plus tard.
 * ⚠️ DEUX IMAGES NE SUFFISAIENT PAS (nº 156-§3), et c'est la cause du
 * saut qui restait au changement de disposition : la bascule
 * RECOMPOSE toute la mosaïque (une colonne ↔ deux colonnes), le
 * document change de hauteur de plusieurs milliers de pixels, et le
 * navigateur en tire DEUX mouvements — notre remise en place, puis un
 * RE-BORNAGE quand la page raccourcit sous la position courante. Le
 * second arrivait après la levée du drapeau : la barre y lisait un
 * geste, et se repliait. La fenêtre couvre donc aussi ce second
 * temps.
 */

const MARQUEUR = "defilementProgramme";

/** La fenêtre pendant laquelle les défilements ne sont pas des gestes.
    Assez large pour couvrir le re-bornage d'une recomposition de
    mosaïque, assez courte pour ne jamais avaler un vrai geste : un
    doigt qui défile juste après avoir touché un bouton d'affichage
    met bien plus de 300 ms à revenir sur l'écran. */
const FENETRE_MS = 300;

/** Vrai pendant qu'un défilement posé par le site est en cours. */
export function estDefilementProgramme(): boolean {
  return typeof document !== "undefined"
    ? Boolean(document.documentElement.dataset[MARQUEUR])
    : false;
}

/**
 * DÉFILER SANS QUE CE SOIT UN GESTE. Même signature que
 * `window.scrollTo`, à ceci près que le mouvement est annoncé.
 * ⚠️ « instant » par défaut : le site déclare un défilement doux
 * global, et une restitution qui s'anime est une restitution qu'on
 * voit passer.
 */
let leveeEnCours = 0;

export function defilerSansGeste(options: ScrollToOptions): void {
  if (typeof window === "undefined") return;
  document.documentElement.dataset[MARQUEUR] = "1";
  window.scrollTo({ behavior: "instant", ...options });
  //  Un seul minuteur : deux remises en place rapprochées ne doivent
  //  pas laisser la première lever le drapeau de la seconde.
  window.clearTimeout(leveeEnCours);
  leveeEnCours = window.setTimeout(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        delete document.documentElement.dataset[MARQUEUR];
      });
    });
  }, FENETRE_MS);
}
