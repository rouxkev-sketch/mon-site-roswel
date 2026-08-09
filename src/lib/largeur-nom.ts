/**
 * LE NOM DE L'ARTISAN SUR LA FICHE GRAND FORMAT (≥ 560 px)
 * ========================================================
 *
 * Le nom s'affiche à droite de la photo de profil, dans la hauteur que
 * celle-ci déborde sous le bandeau gris — 52 px, pas un de plus. La
 * règle demandée :
 *
 *   • il tient sur UNE ligne → grande taille (26 px) ;
 *   • il ne tient pas → DEUX lignes en taille réduite (20 px, interligne
 *     25 px : deux lignes font exactement 50 px et restent au-dessus du
 *     bas de la photo) ;
 *   • au-delà de deux lignes → troncature avec des points de suspension.
 *
 * POURQUOI UN CALCUL, ET PAS UNE MESURE DANS LE NAVIGATEUR
 * --------------------------------------------------------
 * Aucune règle CSS ne sait changer la taille d'un texte selon qu'il
 * tienne ou non sur une ligne. Et mesurer après rendu ferait sauter le
 * nom sous les yeux du visiteur à l'ouverture de la fiche.
 *
 * On calcule donc la largeur du nom AVANT le rendu, en additionnant la
 * largeur de ses caractères — relevées une fois pour toutes dans le
 * navigateur, avec la police réellement servie (Geist), en gras 26 px.
 * On en déduit la largeur de colonne à partir de laquelle le nom tient
 * sur une ligne, et on émet une `@container` : la bascule se fait alors
 * sur la largeur RÉELLE de la colonne, quelle que soit la fenêtre — la
 * fiche seule, les deux colonnes, la tablette : tout est couvert par la
 * même règle.
 *
 * PRÉCISION : la somme des caractères SURESTIME toujours un peu la
 * largeur réelle (de 1,5 à 3 % selon le nom), parce que le navigateur
 * resserre certaines paires de lettres. C'est l'erreur qui va dans le
 * bon sens : on passe en deux lignes un poil trop tôt, JAMAIS trop tard
 * — un nom ne peut donc pas déborder sous la photo. Une marge de
 * sécurité supplémentaire est ajoutée par prudence.
 */

/** Largeur de chaque caractère en Geist gras 26 px (mesurée) */
const LARGEURS: Record<string, number> = {
  "0": 18.03, "1": 11.69, "2": 16.98, "3": 16.91, "4": 17.06, "5": 17.45,
  "6": 16.31, "7": 14.16, "8": 17.27, "9": 16.41,
  A: 18.98, B: 18.28, C: 19.09, D: 18.63, E: 16.19, F: 15.72, G: 19.2,
  H: 18.75, I: 7.81, J: 16.31, K: 17.92, L: 15.33, M: 23.8, N: 19.52,
  O: 20.19, P: 17.48, Q: 20, R: 18.13, S: 17.72, T: 15.58, U: 18.28,
  V: 18.98, W: 26.39, X: 17.89, Y: 16.41, Z: 15.45,
  a: 15.45, b: 16.48, c: 15.56, d: 16.48, e: 15.73, f: 11.63, g: 16.48,
  h: 15.89, i: 7.31, j: 8.61, k: 16.83, l: 8.14, m: 23.41, n: 15.89,
  o: 16.08, p: 16.48, q: 16.48, r: 11.06, s: 14.83, t: 11.58, u: 15.8,
  v: 15.84, w: 22.08, x: 16.91, y: 15.25, z: 15.17,
  " ": 5.94,
  à: 15.45, â: 15.45, ä: 15.45, ç: 15.56, é: 15.73, è: 15.73, ê: 15.73,
  ë: 15.73, î: 7.31, ï: 7.31, ô: 16.08, ö: 16.08, ù: 15.8, û: 15.8,
  ü: 15.8, ÿ: 15.25, œ: 25.95, æ: 24.94,
  À: 18.98, Â: 18.98, Ä: 18.98, Ç: 19.09, É: 16.19, È: 16.19, Ê: 16.19,
  Ë: 16.19, Î: 7.81, Ï: 7.81, Ô: 20.19, Ö: 20.19, Ù: 18.28, Û: 18.28,
  Ü: 18.28, Ÿ: 18.83, Œ: 29.13, Æ: 27.09,
  "-": 10.84, "–": 15.48, "—": 23.69, "'": 5.28, "’": 6.44, '"': 10.14,
  "“": 12.02, "”": 12.02, ".": 6.14, ",": 6.14, ";": 8.09, ":": 8.09,
  "!": 6.69, "?": 15.38, "(": 8.41, ")": 8.41, "[": 10.14, "]": 10.14,
  "{": 10.61, "}": 10.61, "&": 18.36, "/": 13.58, "\\": 13.03, "+": 14.83,
  "*": 10.98, "=": 14.36, "@": 25.02, "#": 15.33, "%": 21.45, "°": 11.14,
  "<": 14.31, ">": 14.31, _: 14.59, "|": 7.66, "~": 13.61, "^": 12,
  "`": 7.23, $: 17.42, "€": 19.89,
};

/** Repli pour un caractère hors table (alphabet rare, émoji…) : la plus
    large lettre mesurée, pour ne jamais sous-estimer. */
const LARGEUR_INCONNUE = 29.13;

/** Marge de sécurité sur la largeur calculée (1,5 % + 2 px) */
const MARGE = 0.015;
const MARGE_FIXE = 2;

/** Grande taille (une ligne) */
export const NOM_GRANDE_TAILLE = 26;
/** Taille réduite (deux lignes) — 2 × 25 px = 50 px, sous les 52 px que
    la photo déborde du bandeau. */
export const NOM_PETITE_TAILLE = 20;
const NOM_PETIT_INTERLIGNE = 25;

export type CascadeNom = {
  /** La classe unique à poser sur la rangée du nom */
  classe: string;
  /** Le CSS à injecter (une `@container`) */
  css: string;
  /** Largeur de colonne à partir de laquelle le nom tient sur une ligne */
  seuil: number;
};

/**
 * Calcule le seuil de bascule « une ligne / deux lignes » et le CSS.
 *
 * @param nom le nom affiché de l'artisan
 */
export function cascadeNomArtisan(nom: string): CascadeNom {
  const largeur = [...nom].reduce(
    (total, caractere) => total + (LARGEURS[caractere] ?? LARGEUR_INCONNUE),
    0
  );
  const seuil = Math.ceil(largeur * (1 + MARGE) + MARGE_FIXE);
  const classe = `nom-artisan-${seuil}`;

  /* État de base = DEUX LIGNES en taille réduite, tronquées au-delà.
     Au-dessus du seuil, la rangée est assez large pour le nom en entier :
     grande taille et UNE seule ligne.
     `line-clamp: 1` dans l'état large n'est pas qu'une décoration : si la
     largeur calculée se trouvait un jour sous-estimée, le nom serait
     tronqué plutôt que de déborder sous la photo — la contrainte de
     hauteur reste tenue quoi qu'il arrive. */
  const css =
    `.${classe} .nom-artisan{font-size:${NOM_PETITE_TAILLE}px;line-height:${NOM_PETIT_INTERLIGNE}px;-webkit-line-clamp:2}` +
    `@container (min-width:${seuil}px){` +
    `.${classe} .nom-artisan{font-size:${NOM_GRANDE_TAILLE}px;line-height:1.25;-webkit-line-clamp:1}` +
    `}`;

  return { classe, css, seuil };
}
