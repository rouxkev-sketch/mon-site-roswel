"use client";

import { IconeOeil, IconeOeilBarre } from "@/components/Icones";

/**
 * ██ LE STANDARD DES ERREURS DE FORMULAIRE (passe nº 788) ██
 * ==================================================================
 * Trois pages disaient leurs erreurs de trois façons — un gros encadré
 * rouge pour l'une, un liseré pour l'autre, les deux pour la
 * troisième. Le propriétaire a tranché : ce sera CELUI DU FORMULAIRE
 * DE PORTFOLIO, qui existe déjà et qui marche.
 *
 * IL TIENT EN DEUX GESTES, ET RIEN D'AUTRE :
 *  1. LE CHAMP FAUTIF PREND UN CONTOUR ROUGE — sa bordure était
 *     transparente, elle se teint. Rien ne bouge d'un pixel : la
 *     bordure était déjà là, en attente de cette couleur ;
 *  2. LE MESSAGE SE MET SOUS LUI, en rouge, sans fond ni encadré.
 *
 * ⚠️ CE QUI DISPARAÎT AVEC ÇA : le pavé rouge à fond plein. Il
 * s'affichait EN BAS du formulaire, loin du champ qu'il accusait, et
 * son fond en faisait l'objet le plus voyant de la page — pour dire
 * « 8 caractères minimum ».
 *
 * ⚠️ L'ERREUR S'EFFACE À LA CORRECTION (nº 788), et c'est la moitié du
 * sujet : une erreur qui survit à sa réparation apprend à ne plus lire
 * les erreurs. Chaque `onChange` appelle donc `oublier(...)`.
 *
 * ⚠️ UNE SEULE ÉCRITURE POUR LES TROIS PAGES (piège nº 378) : c'est ce
 * qui les empêchera de re-diverger.
 */

/**
 * LA BORDURE DU CHAMP. À coller derrière la classe `CHAMP` de la page.
 * ⚠️ UNE SEULE CLASSE PAR PROPRIÉTÉ (règle nº 389) : les deux valeurs
 * s'excluent, il n'y a pas de classe de base par-dessous.
 */
export const bordureChamp = (enFaute: boolean) =>
  enFaute ? "border-erreur" : "border-transparent";

/**
 * LE MESSAGE SOUS LE CHAMP. `role="alert"` pour qu'un lecteur d'écran
 * l'annonce au moment où il paraît — c'est une information qui arrive,
 * pas un texte qui attendait là.
 */
export function MessageErreur({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-1.5 text-[13px] text-erreur">
      {children}
    </p>
  );
}

/**
 * ██ L'AIR AU-DESSUS DU BOUTON QUI VALIDE (nº 788) ██
 * ------------------------------------------------------------------
 * LE DÉFAUT DU PROPRIÉTAIRE : « le bouton est collé au dernier champ ».
 * Les formulaires respirent d'un `gap-4` (16 px) entre champs ; le
 * bouton, qui n'est pas un champ, prenait le même écart et se
 * confondait avec la pile.
 * LA MESURE DEMANDÉE : « ~1,5 à 2 fois l'espacement entre champs ».
 * `mt-3` (12 px) s'ajoute au `gap-4` du parent : 28 px en tout, soit
 * 1,75 fois — le milieu de la fourchette.
 */
export const AIR_AVANT_BOUTON = "mt-3";

/**
 * ██ AFFICHER / MASQUER LE MOT DE PASSE (nº 788) ██
 * ------------------------------------------------------------------
 * CE QU'IL REMPLACE : le mot « Afficher » (puis « Masquer ») posé dans
 * le champ, à droite. Un mot à l'intérieur d'un champ se lit comme une
 * partie de ce qu'on y a tapé, et celui-ci changeait de longueur d'un
 * état à l'autre — le champ devait réserver 88 px pour le plus long.
 * ⚠️ IL RESTE NOMMÉ POUR QUI N'Y VOIT PAS : `aria-label` dit le geste,
 * `aria-pressed` dit l'état. Une icône seule ne se lit pas à voix
 * haute.
 * ⚠️ SA ZONE DE TOUCHE FAIT LA HAUTEUR DU CHAMP : le dessin ne fait que
 * 20 px, mais on n'appuie pas sur un dessin de 20 px avec un pouce.
 */
export function BoutonOeil({
  visible,
  surBascule,
}: {
  visible: boolean;
  surBascule: () => void;
}) {
  return (
    <button
      type="button"
      onClick={surBascule}
      aria-pressed={visible}
      aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex
                 h-11 w-11 items-center justify-center rounded-lg
                 text-sombre-texte-doux hover:text-sombre-texte
                 transition-colors"
    >
      {visible ? <IconeOeilBarre taille={20} /> : <IconeOeil taille={20} />}
    </button>
  );
}

/** Ce que le champ doit réserver à sa droite pour ne pas passer sous
    l'œil. Il réservait 88 px pour le mot « Afficher ». */
export const PLACE_DE_L_OEIL = 48;
