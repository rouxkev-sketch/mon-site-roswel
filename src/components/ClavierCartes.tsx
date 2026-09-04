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
 * ██ §1 (nº 840) — CE QU'IL POUSSE A CHANGÉ DE NATURE ██
 * ------------------------------------------------------------------
 * ÉCRIT À LA nº 371, IL POUSSAIT le cadre de défilement du carrousel
 * qu'une carte montait alors (`data-role="cadre"`). La nº 445 a retiré
 * ce carrousel des cartes : depuis, ce sélecteur ne trouvait plus rien
 * et LES FLÈCHES DU CLAVIER NE FAISAIENT PLUS RIEN. Le propriétaire
 * l'a relevé sur la galerie de la nº 839 — le défaut est plus vieux
 * qu'elle de quatre cents passes.
 * COMMENT ON FAIT DÉFILER, DÉSORMAIS : on APPUIE SUR SON CHEVRON — le
 * bouton que la carte survolée montre déjà (`data-fleche-de-carte`,
 * GalerieDeCarte). C'est le geste de la souris, à la lettre : même
 * chemin, même garde, même préchargement de la photo suivante, et rien
 * à tenir d'accord entre deux écritures (piège nº 378). La galerie n'a
 * rien à apprendre du clavier, et rien n'est écrit dans l'adresse :
 * aucune entrée d'historique (règle 332-§1).
 * ⚠️ ON NE TOUCHE À AUCUNE GÉOMÉTRIE : on ne mesure rien, on ne déplace
 * rien — on appuie sur un bouton qui existe.
 *
 * LES QUATRE GARDES, dans l'ordre :
 *  1. UNE TOUCHE NUE — avec Commande, Contrôle, Alt ou Majuscule, on
 *     ne touche à rien : ce sont les raccourcis du navigateur ;
 *  2. ON N'ÉCRIT PAS — curseur dans un champ, une zone de texte, une
 *     liste déroulante ou un bloc modifiable : les flèches
 *     appartiennent au texte, et rien d'autre ne se produit ;
 *  3. UNE CARTE EST SURVOLÉE — sinon la page garde exactement son
 *     comportement (aucun `preventDefault` n'est appelé) ;
 *  4. LE CHEVRON DE CE CÔTÉ-LÀ EXISTE — une carte à photo unique n'en
 *     a aucun, et une carte arrivée au bout n'a plus celui du bout :
 *     la galerie ne boucle pas, le clavier non plus.
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
      //  §1 (nº 841) — RIEN AU DOIGT, et c'est écrit plutôt que
      //  supposé : un écran tactile peut tenir un `:hover` après un
      //  toucher, et une tablette peut avoir un clavier. Le chevron y
      //  existe dans le document (masqué) et un `click()` l'atteindrait
      //  quand même. L'appareil tranche (règle nº 60).
      if (document.documentElement.dataset.appareil === "mobile") return;
      const chevron = document.querySelector<HTMLElement>(
        `[data-carte]:hover [data-fleche-de-carte="${
          sens === 1 ? "droite" : "gauche"
        }"]`
      );
      if (!chevron) return;
      evenement.preventDefault();
      chevron.click();
    };
    document.addEventListener("keydown", auClavier);
    return () => document.removeEventListener("keydown", auClavier);
  }, []);
  return null;
}
