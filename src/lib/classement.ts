/**
 * CLASSEMENT DES RÉSULTATS DE RECHERCHE
 * -------------------------------------
 * 100 % score de confiance : du plus haut au plus bas. (L'ancien
 * départage par rapidité de réponse a disparu avec la messagerie
 * interne — le contact passe désormais par WhatsApp et téléphone.)
 * À score égal, l'ordre renvoyé par la base est conservé.
 */
export function classerArtisans<T extends { score_total: number }>(
  artisans: T[]
): T[] {
  return [...artisans].sort((a, b) => b.score_total - a.score_total);
}
