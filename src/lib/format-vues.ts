/**
 * ██ §8 (nº 867) — LE NOMBRE DE VUES, ÉCRIT UNE SEULE FOIS ██
 * ==================================================================
 * DÉCISION DU PROPRIÉTAIRE, À LA LETTRE :
 *
 *    jusqu'à 999   →  « 999 »
 *    1 000         →  « 1K »
 *    12 300        →  « 12.3K »
 *    1 000 000     →  « 1M »
 *
 * LA RÈGLE QUI EN DÉCOULE, et elle tient en trois lignes : sous mille,
 * le nombre entier ; sous un million, les milliers avec UN chiffre
 * après le point, et le point disparaît quand ce chiffre est zéro ;
 * au-delà, les millions, à la même règle.
 *
 * ⚠️ ON TRONQUE, ON N'ARRONDIT PAS : 12 399 s'écrit « 12.3K », jamais
 * « 12.4K ». Un compteur de vues ne doit pas annoncer plus que ce qui
 * a été compté — c'est la règle du site pour tout ce qui vient de la
 * base (la même que le compteur d'une galerie : il montre ce qu'il a).
 * ⚠️ LE POINT, PAS LA VIRGULE : le site est en anglais (le lexique,
 * docs/LEXIQUE-ANGLAIS.md), et « 12.3K » est la forme anglaise. On
 * n'appelle pas `toLocaleString` : sa sortie dépendrait de la langue du
 * navigateur, et deux visiteurs ne liraient pas la même chose.
 * ⚠️ RIEN N'EST INVENTÉ EN CHEMIN : un nombre absent, négatif ou
 * illisible se lit ZÉRO — la règle de la nº 854 (« le bloc paraît
 * toujours, et zéro est un nombre »), inchangée.
 *
 * ⚠️ UNE SEULE ÉCRITURE POUR TOUT LE SITE (piège nº 378) : le pied des
 * cartes (CarteFil, `PiedDeFil`) l'appelle, et tout ce qui montrera des
 * vues demain l'appellera aussi. Le banc 867 l'éprouve sur les quatre
 * nombres de la consigne et sur leurs voisins.
 */

/** Les milliers, puis les millions — l'ordre dans lequel on essaie. */
const PALIERS = [
  { seuil: 1_000_000, lettre: "M" },
  { seuil: 1_000, lettre: "K" },
] as const;

export function vuesAffichees(vues: number | null | undefined): string {
  const nombre =
    typeof vues === "number" && Number.isFinite(vues) && vues > 0
      ? Math.floor(vues)
      : 0;
  for (const { seuil, lettre } of PALIERS) {
    if (nombre < seuil) continue;
    //  UN chiffre après le point, TRONQUÉ (voir la note) : on compte en
    //  dixièmes du palier, puis on coupe.
    const dixiemes = Math.floor((nombre * 10) / seuil);
    const entier = Math.floor(dixiemes / 10);
    const reste = dixiemes % 10;
    return `${entier}${reste ? `.${reste}` : ""}${lettre}`;
  }
  return String(nombre);
}
