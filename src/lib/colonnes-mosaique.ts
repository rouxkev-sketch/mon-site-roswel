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
 * grille écrit en classes (`COLONNES_MOSAIQUE`, voir
 * GrilleTatoueurs) : ils sont
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
 * range exactement en 2, 3 et 4 colonnes ; SEULE la bande à cinq
 * colonnes (1600 px et au-delà, §1 nº 473) voit une dernière rangée
 * incomplète — quatre cartes au lieu de cinq —, et seulement ce
 * premier écran-là : le cookie est posé dans le même souffle, et tout
 * ce qui suit — le premier « Voir plus » compris — est déjà au bon
 * compte (trente cartes à cinq colonnes).
 * ⚠️ AUCUN NOMBRE NE RÈGLE CE CAS SANS EN CRÉER UN AUTRE : le plus
 * petit multiple commun de 2, 3, 4 et 5 vaut SOIXANTE — une première
 * page deux fois et demie plus lourde pour tout le monde, sur tous
 * les écrans, afin de compléter une seule rangée d'un seul premier
 * affichage. Le propriétaire tranchera s'il veut ce prix ; en
 * attendant, le repli reste à vingt-quatre.
 *
 * ⚠️ LA TAILLE EST DÉCIDÉE UNE SEULE FOIS PAR CHARGEMENT. Le cookie
 * n'est écrit QUE par le script d'avant peinture, jamais au
 * redimensionnement : élargir la fenêtre en cours de route ne
 * re-découpe donc rien de ce qui est déjà chargé — c'est l'exigence du
 * §1, et elle tient parce que personne d'autre n'écrit ce cookie.
 */

/** LE NOM DU COOKIE — court, sans donnée personnelle : un chiffre. */
export const COOKIE_COLONNES = "yf_colonnes";

/**
 * LA POLITIQUE DES COOKIES D'AFFICHAGE — ÉCRITE UNE FOIS (nº 257-§2)
 * ------------------------------------------------------------------
 * Un an de validité : le repli ne sert qu'à la toute première visite.
 * `samesite=lax` : le cookie part avec les navigations du site, jamais
 * avec une requête d'un autre domaine. `path=/` : toutes les pages le
 * lisent.
 * ⚠️ CE SUFFIXE EST CONSOMMÉ PAR LES DEUX COOKIES D'AFFICHAGE — celui
 * des colonnes (script d'avant peinture, nº 226-§1) et celui de la
 * mise en page (lib/vue-phototheque, nº 257-§2). Une seule écriture :
 * ils ne peuvent pas diverger.
 */
export const SUFFIXE_COOKIE_AFFICHAGE = ";path=/;max-age=31536000;samesite=lax";

/** SIX CARTES PAR COLONNE : le multiplicateur demandé (§1). */
export const CARTES_PAR_COLONNE = 6;

/** LES PALIERS DE LA GRILLE, du plus large au plus étroit — les mêmes
    valeurs que les classes de GrilleTatoueurs, écrites en `rem` comme
    les points de rupture de Tailwind (`--breakpoint-3xl: 104rem` vit
    dans globals.css). */
//  ██ §1 (nº 472) — QUATRE COLONNES AU MAXIMUM, LE PASSAGE À 1440 px ██
//  La jumelle de `COLONNES_MOSAIQUE` (GrilleTatoueurs) : mêmes deux
//  seuils, dans le même ordre. Les cinq et six colonnes sont parties
//  avec le rétrécissement qu'elles causaient (relevé nº 471 : une
//  photo tombait à 253 px sur grand écran contre 357 px sur un
//  portable). Les deux lignes ne peuvent pas diverger sans que la
//  dernière rangée redevienne incomplète.
//  §1 (nº 473) — le palier des CINQ colonnes s'ajoute, à 1600 px. Du
//  plus large au plus étroit, comme toujours : la première requête qui
//  répond « oui » donne le nombre.
//  §1 (nº 474) — le palier des quatre colonnes descend : 90rem
//  (1440 px) devient 80rem (1280 px), pour les petits portables.
export const PALIERS_COLONNES = [
  { requete: "(min-width: 100rem)", colonnes: 5 }, // grille5 (1600 px)
  { requete: "(min-width: 80rem)", colonnes: 4 }, // grille (1280 px)
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
