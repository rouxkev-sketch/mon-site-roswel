import { revalidatePath } from "next/cache";

/**
 * VIDER LE CACHE DES PAGES QUAND UNE FICHE CHANGE
 * ================================================
 * Depuis la passe « performance », les pages « style + ville » sont
 * GARDÉES EN CACHE cinq minutes (voir leur `revalidate`) : les
 * recalculer à chaque passage de robot n'apprend rien à personne, et
 * il y a une page par style et par ville.
 *
 * ⚠️ MAIS UNE FICHE VALIDÉE DOIT APPARAÎTRE TOUT DE SUITE. Un
 * administrateur qui valide et ne voit rien bouger croit — à raison —
 * que la validation ne marche pas. Cinq minutes d'attente seraient
 * exactement le genre de détail qui fait douter de l'outil.
 *
 * Cette fonction est donc appelée à CHAQUE changement d'état d'une
 * fiche (validation, mise hors ligne, publication, suppression) : elle
 * vide sur-le-champ ce qui pouvait la montrer. Le délai de cinq
 * minutes n'est plus qu'un filet pour ce qui passerait à côté.
 *
 * ELLE NE LÈVE JAMAIS. Un cache qu'on n'a pas pu vider se videra tout
 * seul cinq minutes plus tard ; faire échouer une validation pour ça
 * serait absurde.
 */
export function rafraichirPagesPubliques(slug?: string | null): void {
  const chemins = [
    // L'accueil et la recherche.
    "/",
    // TOUTES les pages « style + ville » à la fois : les crochets ne
    // sont pas une adresse, c'est le nom du GABARIT — Next vide alors
    // toutes les pages qu'il a produites à partir de lui. On ne peut
    // pas deviner lesquelles : une fiche peut changer de ville, et
    // elle apparaît sur autant de pages qu'elle a de styles.
    "/tatouage/[style]/[ville]",
    // Le plan du site : il liste les fiches publiées.
    "/sitemap.xml",
  ];
  for (const chemin of chemins) {
    try {
      revalidatePath(chemin, chemin.includes("[") ? "page" : undefined);
    } catch {
      // Hors contexte de requête (script, tâche planifiée) : sans
      // objet, et sans conséquence.
    }
  }
  if (slug) {
    try {
      revalidatePath(`/tatoueur/${slug}`);
    } catch {
      // Idem.
    }
  }
}
