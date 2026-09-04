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
    "/tattoo/[style]/[ville]",
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
      revalidatePath(`/artist/${slug}`);
    } catch {
      // Idem.
    }
  }
}

/**
 * ██ nº 808 — TOUT LE SITE, D'UN COUP : quand LE CATALOGUE change ██
 * ------------------------------------------------------------------
 * LA CAUSE, vue par le propriétaire : un style renommé en base
 * (« Néo-réalisme » → « Neo-realism ») restait en français à l'écran
 * des minutes durant, navigation privée comprise. Ce n'était pas la
 * minute de lib/styles-ajoutes : c'est le CACHE DE ROUTE. La mise en
 * page du groupe tatouage lit la liste des styles et la sérialise pour
 * le navigateur (FournisseurStyles) ; elle est donc CUITE dans chaque
 * page mise en cache — l'accueil, les pages style + ville et les
 * portfolios sont revalidés toutes les cinq minutes (`revalidate =
 * 300`), les pages sans revalidation (légales, À propos) le sont au
 * prochain déploiement seulement. La minute du registre est DERRIÈRE
 * ce cache : elle ne compte que quand une page se recuit.
 * LE REMÈDE : après toute décision sur le catalogue (style accepté,
 * refusé, retiré, renommé), on invalide la MISE EN PAGE racine — tout
 * ce qui est dessous se recuit à la prochaine visite. C'est large, et
 * c'est voulu : le catalogue est dans TOUTES les pages, et il change
 * quelques fois par an.
 * ⚠️ UNE ÉCRITURE SQL DIRECTE NE PASSE PAS PAR ICI : elle attend la
 * revalidation des pages (cinq minutes, et la première visite après
 * l'échéance reçoit encore l'ancienne page pendant que la neuve se
 * cuit). Pour forcer : renommer le style depuis l'admin, même à
 * l'identique (docs/SQL-807-STYLES-AJOUTES.md).
 */
export function rafraichirToutLeSite(): void {
  try {
    revalidatePath("/", "layout");
  } catch {
    //  Hors d'un rendu Next (un banc, un script) : rien à invalider.
  }
}
