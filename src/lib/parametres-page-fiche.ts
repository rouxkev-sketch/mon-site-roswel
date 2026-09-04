"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * ██ §1 (nº 733) — LES PARAMÈTRES DE LA PAGE DU COMPTE, GELÉS SOUS UNE
 * FENÊTRE ██
 * ==================================================================
 * LE DÉFAUT, MESURÉ AU BANC (films image par image, A/B au paramètre
 * près) : dans l'aperçu « Ma fiche », cliquer la carte d'un membre
 * d'équipe ou d'un salon lié doit ouvrir la fiche en FENÊTRE
 * SUPERPOSÉE (la pile de la nº 506). Or la fenêtre pousse
 * `/artist/<slug>` — une adresse qui ne porte NI `?fiche=…` NI
 * `?vue=apercu`. Tant que l'écran lisait l'adresse BRUTE
 * (`useSearchParams`), cette poussée faisait DEUX dégâts d'un coup :
 *  · la CLÉ REACT d'`EspaceFiche` (`?fiche` en fait partie — c'est
 *    elle qui garantit un formulaire vierge à « Ajouter une fiche »)
 *    voyait `?fiche=A` retomber sur « derniere » : le formulaire
 *    ENTIER était démonté-remonté, la pile et sa fenêtre NAISSANTE
 *    avec (jamais peinte ; seul le drapeau `data-fenetre-fiche`,
 *    posé sur <html> avant la poussée, restait — orphelin) ;
 *  · le remplaçant, né devant une adresse nue (ni `vue=apercu`, ni
 *    fenêtre à compter), montrait la MODIFICATION — l'écran de
 *    création/modification à la place de la fenêtre attendue.
 * SANS `?fiche=` dans l'adresse de départ, rien de tout cela (la clé
 * ne bougeait pas) : c'est le A/B qui a cerné la cause.
 *
 * LA RÈGLE — celle des nº 360 et 732, appliquée à CETTE page : une
 * adresse possédée par une SURFACE (la fenêtre de fiche) n'est pas
 * l'adresse de la page. Tant que le chemin est celui de la page, on
 * lit l'adresse et on la suit — « Ajouter une fiche », le passage
 * modification ↔ aperçu, le choix d'une autre fiche continuent de
 * fonctionner à l'identique. Dès que le chemin ne l'est plus, on rend
 * les paramètres GELÉS : même référence, donc ni remontage à la clé,
 * ni rechargement, ni bascule de vue. À la fermeture de la fenêtre
 * (le retour rend `?fiche=…&vue=apercu`), la lecture repart.
 *
 * ⚠️ LE CHEMIN SE LIT DANS `location`, PENDANT LE RENDU — la vérité
 * des surfaces (la mesure de PileFiches, nº 589) ; `useSearchParams`
 * reste la source quand l'adresse est la nôtre (leçon nº 329-§4 :
 * `location.search` est en retard d'un rendu au premier clic).
 * L'ajustement se fait PENDANT le rendu (le motif maison des
 * nº 162/372), jamais dans un effet : aucun rendu ne peut lire des
 * paramètres retombés. Côté serveur, le chemin est toujours réputé
 * nôtre : HTML préparé et hydratation lisent la même chose.
 * ⚠️ ÉCRIT UNE FOIS, LU DEUX FOIS : l'enveloppe (`EspaceFiche`, la
 * clé) et le formulaire (`FormulaireFiche`, la vue et la fiche
 * demandée) consomment CE crochet — deux lectures gelées qui ne
 * peuvent pas diverger.
 */
export const CHEMIN_PAGE_FICHE = "/become-an-artist/portfolio";

export function useParametresDeLaPageFiche(): ReturnType<
  typeof useSearchParams
> {
  const duRouteur = useSearchParams();
  const surLaPage =
    typeof window === "undefined" ||
    window.location.pathname === CHEMIN_PAGE_FICHE;
  const [geles, setGeles] = useState(duRouteur);
  if (surLaPage && geles !== duRouteur) {
    setGeles(duRouteur);
  }
  return surLaPage ? duRouteur : geles;
}
