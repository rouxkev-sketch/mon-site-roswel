import type { ReactNode } from "react";
import { IconeFlecheDiagonale } from "@/components/Icones";

/**
 * LE STYLE DE LIEN DE LA FICHE ARTISAN
 * ------------------------------------
 * Le même partout — sur téléphone comme sur web, pour « Voir le site
 * Internet », « Signaler cet artisan » et l'adresse :
 *
 *   • AU REPOS : pas de soulignement, une simple flèche rose ;
 *   • AU SURVOL : le texte passe au rose ET se souligne, curseur main ;
 *   • LA FLÈCHE (↗) : toujours visible, TOUJOURS rose (au repos comme au
 *     survol : elle ne change jamais de couleur), jamais soulignée, et
 *     haute comme la typographie du lien (elle mesure `1em`).
 *
 * `group/lien` : c'est le survol du LIEN ENTIER qui souligne le texte —
 * le soulignement ne pourrait pas être posé sur le lien lui-même sans
 * traverser aussi la flèche.
 */

/** Les classes à poser sur le lien (balise <a> ou <button>) */
export const CLASSE_LIEN_FLECHE =
  "group/lien cursor-pointer text-left hover:text-primaire transition-colors";

/**
 * Le texte d'un lien : souligné au survol seulement, suivi de la flèche
 * rose. `whitespace-nowrap` sur le dernier mot n'est pas nécessaire : la
 * flèche est dans le même conteneur en ligne, elle suit donc le texte.
 */
export function TexteLienFleche({ children }: { children: ReactNode }) {
  return (
    <span className="inline">
      <span className="group-hover/lien:underline underline-offset-2">
        {children}
      </span>
      <FlecheLien />
    </span>
  );
}

/**
 * La flèche seule — pour les liens dont le texte tient sur plusieurs
 * lignes (l'adresse), où elle se place à la fin de la DERNIÈRE ligne.
 * `align-[-0.1em]` la descend d'un cheveu pour que son bas s'aligne sur
 * la ligne de base du texte plutôt que sur le bas des jambages.
 */
export function FlecheLien() {
  return (
    <span className="text-primaire ml-1 inline-block align-[-0.1em]" aria-hidden>
      <IconeFlecheDiagonale />
    </span>
  );
}
