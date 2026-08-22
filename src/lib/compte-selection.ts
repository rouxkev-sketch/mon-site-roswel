/**
 * LES COMPTES DE « MA SÉLECTION » — §3 (nº 460)
 * ==================================================================
 * Le va-et-vient mobile de la barre affiche, sur son côté choisi, LE
 * NOMBRE DE CE QUI EST RÉELLEMENT AFFICHÉ après filtrage
 * (« Favoris 1 ⌄ » sur un filtre à une photo — jamais le total).
 *
 * QUI SAIT, QUI MONTRE : c'est la PAGE (PageFavoris) qui calcule les
 * listes filtrées — les mêmes longueurs que son ancien sous-titre
 * (« 7 portfolios sur 18 ») ; la barre (MenusSelection), elle, ne
 * connaît que l'adresse. Ce petit magasin fait le pont : la page POSE
 * les deux comptes à chaque rendu, la barre s'y ABONNE — le motif des
 * magasins du site, rien d'autre.
 *
 * ⚠️ RÈGLE 137/203 : les favoris et les suivis se chargent côté
 * navigateur — tant que la page n'a rien posé, les comptes valent
 * `null` et la barre n'écrit AUCUN nombre (jamais un « 0 » menteur
 * peint avant que l'état soit connu).
 * ⚠️ L'INSTANTANÉ EST STABLE (exigence de `useSyncExternalStore`) :
 * l'objet n'est remplacé que quand une valeur change.
 */

export type ComptesSelection = {
  favoris: number | null;
  suivis: number | null;
};

let comptes: ComptesSelection = { favoris: null, suivis: null };
const abonnes = new Set<() => void>();

export function poserComptesSelection(
  favoris: number | null,
  suivis: number | null
): void {
  if (comptes.favoris === favoris && comptes.suivis === suivis) return;
  comptes = { favoris, suivis };
  for (const prevenir of abonnes) prevenir();
}

export function lireComptesSelection(): ComptesSelection {
  return comptes;
}

export function souscrireComptesSelection(prevenir: () => void): () => void {
  abonnes.add(prevenir);
  return () => abonnes.delete(prevenir);
}
