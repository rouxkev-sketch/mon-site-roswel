/**
 * Transforme un nom en « slug » : la version simplifiée utilisée
 * dans les adresses web (minuscules, sans accents ni espaces).
 *
 *   "Vénissieux"        → "venissieux"
 *   "L'Haÿ-les-Roses"   → "l-hay-les-roses"
 *   "Saint-Étienne"     → "saint-etienne"
 *
 * Utilisé pour les communes (étape 3) puis pour les adresses des
 * pages de recherche comme /plombier/villeurbanne (étape 5).
 */
export function slugifier(texte: string): string {
  return texte
    .toLowerCase()
    .replace(/œ/g, "oe") // lettres doubles que la ligne suivante ne sait pas séparer
    .replace(/æ/g, "ae")
    .normalize("NFD") // sépare les lettres de leurs accents (é → e + ´)
    .replace(/[\u0300-\u036f]/g, "") // supprime les accents isolés
    .replace(/[^a-z0-9]+/g, "-") // tout le reste (espaces, apostrophes…) → tiret
    .replace(/^-+|-+$/g, ""); // pas de tiret en début ou fin
}

/**
 * L'ADRESSE D'UNE FICHE DE TATOUEUR : le nom ET LA VILLE.
 * ------------------------------------------------------
 *   « Maison Vermillon » à Lille → maison-vermillon-lille
 *
 * POURQUOI LA VILLE : deux tatoueurs peuvent porter le même nom à
 * l'autre bout du monde ; l'adresse doit rester lisible et distincte.
 * Elle aide aussi les moteurs de recherche, qui lisent l'adresse.
 *
 * CALCULÉ UNE SEULE FOIS, À LA CRÉATION, PUIS FIGÉ EN BASE : il n'est
 * JAMAIS recalculé, même si le tatoueur change de nom ou de ville —
 * sinon tous les liens déjà partagés se casseraient. (Les fiches
 * d'avant cette règle gardent leur ancienne adresse dans
 * `ancien_slug` : la page de fiche l'y redirige.)
 *
 * `dejaPris` reçoit les slugs existants : en cas de collision exacte
 * (même nom, même ville), on numérote — « -2 », « -3 »…
 */
export function slugFiche(
  nom: string,
  ville: string,
  dejaPris: Iterable<string> = []
): string {
  const racine =
    [slugifier(nom), slugifier(ville)].filter(Boolean).join("-") || "fiche";
  const pris = new Set(dejaPris);
  if (!pris.has(racine)) return racine;
  for (let numero = 2; numero < 1000; numero++) {
    const candidat = `${racine}-${numero}`;
    if (!pris.has(candidat)) return candidat;
  }
  // Garde-fou : au-delà de mille homonymes dans la même ville, un
  // suffixe aléatoire plutôt qu'une boucle sans fin.
  return `${racine}-${Math.random().toString(36).slice(2, 6)}`;
}
