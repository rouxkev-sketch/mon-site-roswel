import { CARTES_PAR_PAGE } from "@/config/tatouage";

/**
 * COMBIEN DE COLONNES LA MOSAÏQUE MONTRE-T-ELLE, ET COMBIEN DE CARTES
 * UNE PAGE CONTIENT-ELLE ?
 * ==================================================================
 * (passe nº 226-§1)
 *
 * LE DÉFAUT. La dernière rangée de la mosaïque était incomplète, et le
 * manque grandissait à chaque « Voir plus de portfolios » : une carte,
 * puis deux, puis trois. Ce n'est pas une perte de cartes, c'est de
 * l'arithmétique — vingt-quatre cartes ne se rangent pas en cinq
 * colonnes (4 rangées pleines et 4 cartes), et l'erreur s'ajoute à
 * chaque page.
 *
 * LA RÈGLE. La taille d'une page est un MULTIPLE du nombre de
 * colonnes : colonnes × 6. Six colonnes → 36, cinq → 30, quatre → 24,
 * trois → 18, deux → 12. La dernière rangée est alors toujours pleine,
 * à toutes les pages.
 *
 * ⚠️ LE NOMBRE DE COLONNES EST UNE QUESTION DE CSS, ET LE SERVEUR NE
 * VOIT PAS L'ÉCRAN. Les paliers ci-dessous sont EXACTEMENT ceux que la
 * grille écrit en classes (`grid-cols-2 md:grid-cols-3 xl:grid-cols-4
 * 2xl:grid-cols-5 3xl:grid-cols-6`, voir GrilleTatoueurs) : ils sont
 * la SEULE écriture de cette correspondance, et le script d'avant
 * peinture les interroge avec `matchMedia` — il pose donc au navigateur
 * la question même que se pose la feuille de style, jamais une
 * approximation en pixels.
 *
 * ⚠️ ET LE CHIFFRE VOYAGE PAR UN COOKIE, POSÉ AVANT LA PREMIÈRE
 * PEINTURE. C'est le seul canal qui existe : le serveur rend le HTML
 * avant que la moindre ligne de JavaScript n'ait tourné.
 * CE QUE CELA COÛTE, ET IL FAUT LE DIRE : à la TOUTE PREMIÈRE visite
 * d'un navigateur, le cookie n'existe pas encore — la première page
 * est alors servie au repli de vingt-quatre cartes. Vingt-quatre se
 * range exactement en 2, 3, 4 et 6 colonnes ; SEULE la bande à cinq
 * colonnes (1536 à 1663 px) voit une dernière rangée incomplète, et
 * seulement ce premier écran-là : le cookie est posé dans le même
 * souffle, et tout ce qui suit — le premier « Voir plus » compris —
 * est déjà au bon compte.
 *
 * ⚠️ LA TAILLE EST DÉCIDÉE UNE SEULE FOIS PAR CHARGEMENT. Le cookie
 * n'est écrit QUE par le script d'avant peinture, jamais au
 * redimensionnement : élargir la fenêtre en cours de route ne
 * re-découpe donc rien de ce qui est déjà chargé — c'est l'exigence du
 * §1, et elle tient parce que personne d'autre n'écrit ce cookie.
 */

/** LE NOM DU COOKIE — court, sans donnée personnelle : un chiffre. */
export const COOKIE_COLONNES = "yf_colonnes";

/** SIX CARTES PAR COLONNE : le multiplicateur demandé (§1). */
export const CARTES_PAR_COLONNE = 6;

/** LES PALIERS DE LA GRILLE, du plus large au plus étroit — les mêmes
    valeurs que les classes de GrilleTatoueurs, écrites en `rem` comme
    les points de rupture de Tailwind (`--breakpoint-3xl: 104rem` vit
    dans globals.css). */
export const PALIERS_COLONNES = [
  { requete: "(min-width: 104rem)", colonnes: 6 }, // 3xl
  { requete: "(min-width: 96rem)", colonnes: 5 }, // 2xl
  { requete: "(min-width: 80rem)", colonnes: 4 }, // xl
  { requete: "(min-width: 48rem)", colonnes: 3 }, // md
] as const;

/** SOUS TOUS LES PALIERS : deux colonnes, la mosaïque du doigt. */
export const COLONNES_AU_DOIGT = 2;

/** Le plus grand nombre de colonnes que la grille sache montrer. */
export const COLONNES_MAXIMUM = PALIERS_COLONNES[0].colonnes;

/** LE REPLI, quand le navigateur n'a pas encore dit sa largeur : les
    vingt-quatre cartes d'avant cette passe — un multiple de 2, 3, 4 et
    6 colonnes. */
export const TAILLE_PAGE_REPLI = CARTES_PAR_PAGE;

/** La taille d'une page pour un nombre de colonnes donné. */
export function taillePageDeColonnes(colonnes: number): number {
  const bornees = Math.min(
    Math.max(Math.floor(colonnes), COLONNES_AU_DOIGT),
    COLONNES_MAXIMUM
  );
  return bornees * CARTES_PAR_COLONNE;
}

/**
 * LE COOKIE, RELU — et jamais cru sur parole : n'importe qui peut
 * écrire n'importe quoi dans un cookie. Une valeur hors des paliers
 * connus est refusée, et l'appelant retombe sur le repli.
 */
export function colonnesDuCookie(valeur: string | undefined | null): number | null {
  if (!valeur) return null;
  const nombre = Number(valeur);
  if (!Number.isInteger(nombre)) return null;
  if (nombre < COLONNES_AU_DOIGT || nombre > COLONNES_MAXIMUM) return null;
  return nombre;
}

/** LA TAILLE DE PAGE À SERVIR, d'après le cookie (ou son absence). */
export function taillePageServie(valeurCookie: string | undefined | null): number {
  const colonnes = colonnesDuCookie(valeurCookie);
  return colonnes === null ? TAILLE_PAGE_REPLI : taillePageDeColonnes(colonnes);
}

/**
 * L'EXPRESSION JAVASCRIPT QUI DIT LE NOMBRE DE COLONNES — fabriquée
 * ici, à partir des paliers ci-dessus, pour que le script d'avant
 * peinture n'en garde AUCUNE copie. Si un palier change, les deux
 * changent ensemble.
 */
export function expressionColonnes(): string {
  return (
    PALIERS_COLONNES.map(
      (palier) =>
        `matchMedia(${JSON.stringify(palier.requete)}).matches?${palier.colonnes}:`
    ).join("") + String(COLONNES_AU_DOIGT)
  );
}
