"use client";

import { useEffect } from "react";

/**
 * ██ §2 (nº 370) — LES FLÈCHES DU CLAVIER FONT DÉFILER LA CARTE
 * SURVOLÉE ██
 * ==================================================================
 * UN SEUL ÉCOUTEUR POUR TOUTE LA PAGE, et c'est la contrainte du
 * propriétaire : pas un par carte. Ce composant n'affiche rien ; il
 * est monté UNE FOIS par la surface qui porte des cartes (la mosaïque
 * du moteur, « Ma sélection »), et les deux ne coexistent jamais.
 *
 * COMMENT ON TROUVE LA CARTE SURVOLÉE, SANS RIEN MÉMORISER : on la
 * DEMANDE au document, avec le sélecteur `:hover`. Le navigateur tient
 * déjà cette information — la redoubler dans un état React (un
 * `onMouseEnter` par carte, vingt rendus de plus) serait à la fois
 * plus lourd et moins fidèle. `querySelector` rend la carte la plus
 * profonde survolée, donc exactement celle qui est sous la souris.
 *
 * COMMENT ON FAIT DÉFILER : on pousse SON cadre (`data-role="cadre"`,
 * CarrouselPortfolio) d'une largeur de colonne, exactement comme le
 * ferait un doigt. Le carrousel n'a rien à apprendre : son observateur
 * de défilement voit passer la photo et met son compte à jour tout
 * seul — donc la capsule suit, et AUCUNE entrée d'historique n'est
 * créée (rien n'écrit dans l'adresse ; règle 332-§1).
 *
 * LES QUATRE GARDES, dans l'ordre où elles se posent :
 *  1. UNE TOUCHE NUE : avec Commande, Contrôle, Alt ou Majuscule, on
 *     ne touche à rien — ce sont les raccourcis du navigateur ;
 *  2. ON N'ÉCRIT PAS : si le curseur est dans un champ de saisie, une
 *     zone de texte, une liste déroulante ou un bloc modifiable, les
 *     flèches appartiennent au texte et rien d'autre ne se produit ;
 *  3. UNE CARTE EST SURVOLÉE : sinon on laisse la page se comporter
 *     comme d'habitude (aucun `preventDefault`) ;
 *  4. ELLE A UN CADRE QUI DÉFILE : une carte à photo unique n'en a
 *     pas — les flèches n'y font rien.
 * ⚠️ `preventDefault` N'EST APPELÉ QUE SI L'ON A VRAIMENT DÉFILÉ :
 * sans cela, on volerait le défilement vertical de la page dans tous
 * les autres cas.
 * ⚠️ RIEN AU DOIGT : sans souris il n'y a pas de survol, donc jamais
 * de carte trouvée — et un téléphone n'a pas de flèches.
 */
export function ClavierDefileCarte() {
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
          ["INPUT", "TEXTAREA", "SELECT"].includes(actif.tagName))
      ) {
        return;
      }
      const cadre = document.querySelector<HTMLElement>(
        '[data-carte]:hover [data-role="cadre"]'
      );
      if (!cadre || cadre.scrollWidth <= cadre.clientWidth) return;
      evenement.preventDefault();
      cadre.scrollBy({ left: sens * cadre.clientWidth, behavior: "smooth" });
    };
    //  NON PASSIF : on doit pouvoir empêcher le défilement de la page
    //  quand une carte répond.
    document.addEventListener("keydown", auClavier);
    return () => document.removeEventListener("keydown", auClavier);
  }, []);
  return null;
}
