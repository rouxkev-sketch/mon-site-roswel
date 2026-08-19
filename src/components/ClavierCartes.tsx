"use client";

import { useEffect } from "react";

/**
 * ██ §1 (nº 371) — LES FLÈCHES DU CLAVIER FONT DÉFILER LA CARTE
 * SURVOLÉE ██
 * ==================================================================
 * OÙ L'ÉCOUTEUR EST POSÉ : sur le DOCUMENT, et une seule fois par
 * page. Ce composant n'affiche rien ; il est monté par la surface qui
 * porte des cartes — la mosaïque du moteur (GrilleTatoueurs) et « Ma
 * sélection » (PageFavoris) —, et ces deux-là ne coexistent jamais.
 * Il n'y a donc jamais qu'un écouteur, que la page montre une carte ou
 * quatre-vingts. Un écouteur PAR CARTE aurait été vingt fois le même
 * travail pour un geste qui n'en concerne qu'une.
 * ⚠️ IL FAUT LE DOCUMENT : une carte survolée n'a pas le FOCUS, donc
 * aucun écouteur posé sur elle ne recevrait la touche.
 *
 * COMMENT ON REPÈRE LA CARTE SURVOLÉE : on la DEMANDE au document,
 * avec le sélecteur `:hover` — `[data-carte]:hover`. Le navigateur
 * tient déjà cette information ; la redoubler dans un état React (un
 * `onMouseEnter` par carte, vingt rendus de plus à chaque passage de
 * souris) serait plus lourd et moins fidèle. `querySelector` rend
 * l'élément le plus profond survolé : c'est exactement celui qui est
 * sous la souris, et il n'y en a qu'un.
 *
 * COMMENT ON FAIT DÉFILER : on pousse SON cadre de défilement
 * (`data-role="cadre"`, CarrouselPortfolio) d'une largeur de colonne,
 * exactement comme le ferait un doigt. Le carrousel n'a rien à
 * apprendre : son observateur voit passer la photo et met son compte à
 * jour tout seul — la capsule suit, le fanion suit, et RIEN N'ÉCRIT
 * DANS L'ADRESSE : aucune entrée d'historique (règle 332-§1).
 * ⚠️ ON NE TOUCHE PAS AU CONTENEUR DE DÉFILEMENT, ni à sa géométrie :
 * on l'utilise comme le doigt l'utilise, c'est tout.
 *
 * LES QUATRE GARDES, dans l'ordre :
 *  1. UNE TOUCHE NUE — avec Commande, Contrôle, Alt ou Majuscule, on
 *     ne touche à rien : ce sont les raccourcis du navigateur ;
 *  2. ON N'ÉCRIT PAS — curseur dans un champ, une zone de texte, une
 *     liste déroulante ou un bloc modifiable : les flèches
 *     appartiennent au texte, et rien d'autre ne se produit ;
 *  3. UNE CARTE EST SURVOLÉE — sinon la page garde exactement son
 *     comportement (aucun `preventDefault` n'est appelé) ;
 *  4. SON CADRE DÉFILE VRAIMENT — une carte à photo unique n'a rien à
 *     faire défiler.
 * ⚠️ `preventDefault` N'EST APPELÉ QU'APRÈS LES QUATRE : sans cela on
 * volerait le défilement de la page dans tous les autres cas.
 * ⚠️ RIEN AU DOIGT : sans souris il n'y a pas de survol, donc jamais
 * de carte trouvée — et un téléphone n'a pas de flèches.
 */
export function ClavierCartes() {
  useEffect(() => {
    const auClavier = (evenement: KeyboardEvent) => {
      const sens =
        evenement.key === "ArrowRight"
          ? 1
          : evenement.key === "ArrowLeft"
            ? -1
            : 0;
      if (!sens) return;
      if (
        evenement.metaKey ||
        evenement.ctrlKey ||
        evenement.altKey ||
        evenement.shiftKey
      ) {
        return;
      }
      const actif = document.activeElement;
      if (
        actif instanceof HTMLElement &&
        (actif.isContentEditable ||
          actif.tagName === "INPUT" ||
          actif.tagName === "TEXTAREA" ||
          actif.tagName === "SELECT")
      ) {
        return;
      }
      const cadre = document.querySelector<HTMLElement>(
        '[data-carte]:hover [data-role="cadre"]'
      );
      if (!cadre || cadre.scrollWidth <= cadre.clientWidth + 1) return;
      evenement.preventDefault();
      cadre.scrollBy({ left: sens * cadre.clientWidth, behavior: "smooth" });
    };
    document.addEventListener("keydown", auClavier);
    return () => document.removeEventListener("keydown", auClavier);
  }, []);
  return null;
}
