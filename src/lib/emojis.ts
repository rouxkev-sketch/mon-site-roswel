/**
 * LA BIBLIOTHÈQUE D'ÉMOJIS DU SÉLECTEUR — LE JEU COMPLET
 * ==================================================================
 * §4 (nº 267) — LA LISTE N'EST PLUS CHOISIE À LA MAIN. Elle l'était,
 * et c'est ce qui avait creusé ses trous : les ronds de couleur
 * manquaient à côté des cœurs de couleur, et d'autres manquaient
 * sûrement. Corriger à la main en aurait laissé d'autres encore.
 *
 * ON SERT DONC LE JEU COMPLET D'UNICODE, rangé dans SES catégories
 * officielles — visages et émotions, personnes, animaux et nature,
 * nourriture, voyages et lieux, activités, objets, symboles,
 * drapeaux —, avec les libellés et les mots-clés d'Unicode EN
 * FRANÇAIS pour la recherche par nom.
 *
 * ⚠️ LES DONNÉES SONT ENGENDRÉES, PAS ÉCRITES : voir
 * `src/lib/emojis-donnees.ts` et `scripts/engendrer-emojis.mjs`. Le
 * site n'a AUCUNE dépendance nouvelle — le fichier engendré est du
 * texte ordinaire, versionné avec le reste ; la bibliothèque
 * `emojibase-data` ne sert qu'au moment d'engendrer, à la demande.
 *
 * CE FICHIER-CI garde ce qui RAISONNE : la recherche, et le comptage
 * des caractères tels que l'œil les voit.
 */

export type { EntreeEmoji } from "@/lib/emojis-donnees";
export { CATEGORIES_EMOJIS } from "@/lib/emojis-donnees";

import type { EntreeEmoji } from "@/lib/emojis-donnees";
import { CATEGORIES_EMOJIS } from "@/lib/emojis-donnees";

/** Retire les accents pour une recherche indulgente. */
export function sansAccents(texte: string): string {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Les émojis dont les mots-clés contiennent la recherche. */
export function chercherEmojis(recherche: string): EntreeEmoji[] {
  const propre = sansAccents(recherche.trim());
  if (!propre) return [];
  const resultats: EntreeEmoji[] = [];
  for (const categorie of CATEGORIES_EMOJIS) {
    for (const entree of categorie.emojis) {
      if (sansAccents(entree[1]).includes(propre)) resultats.push(entree);
    }
  }
  return resultats.slice(0, 64);
}

/**
 * COMPTER LES CARACTÈRES TELS QUE L'ŒIL LES VOIT (§4, nº 267)
 * ==================================================================
 * LE DÉFAUT : `texte.length` compte des UNITÉS TECHNIQUES, pas des
 * signes. Un cœur de couleur en vaut deux, un drapeau quatre, un
 * visage à teinte de peau jusqu'à sept. Une bio de dix émojis était
 * donc refusée bien avant les 150 caractères annoncés — sans que rien
 * ne l'explique.
 *
 * ON COMPTE DES GRAPHÈMES : ce qu'une personne appellerait « un
 * caractère ». `Intl.Segmenter` le fait, c'est la règle d'Unicode
 * elle-même — aucun découpage maison, aucune liste de cas.
 * ⚠️ REPLI HONNÊTE : sur un navigateur sans `Intl.Segmenter`, on
 * compte les POINTS DE CODE (`[...texte]`) — déjà bien plus juste que
 * `length` (un cœur de couleur y vaut deux au lieu de deux unités
 * UTF-16… mais un drapeau deux au lieu de quatre). Le compte reste
 * généreux, jamais plus sévère que ce que l'œil voit.
 */
let decoupeur: Intl.Segmenter | null = null;
export function longueurVisible(texte: string): number {
  if (!texte) return 0;
  try {
    if (!decoupeur && typeof Intl !== "undefined" && "Segmenter" in Intl) {
      decoupeur = new Intl.Segmenter("fr", { granularity: "grapheme" });
    }
    if (decoupeur) return [...decoupeur.segment(texte)].length;
  } catch {
    // Repli ci-dessous.
  }
  return [...texte].length;
}

/** Le texte tronqué à N caractères VISIBLES — même règle de comptage
    (un collage trop long garde ses émojis entiers, jamais coupés en
    deux moitiés qui ne veulent plus rien dire). */
export function tronquerVisible(texte: string, maximum: number): string {
  if (longueurVisible(texte) <= maximum) return texte;
  try {
    if (!decoupeur && typeof Intl !== "undefined" && "Segmenter" in Intl) {
      decoupeur = new Intl.Segmenter("fr", { granularity: "grapheme" });
    }
    if (decoupeur) {
      return [...decoupeur.segment(texte)]
        .slice(0, maximum)
        .map((morceau) => morceau.segment)
        .join("");
    }
  } catch {
    // Repli ci-dessous.
  }
  return [...texte].slice(0, maximum).join("");
}
