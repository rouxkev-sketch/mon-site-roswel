import { cache } from "react";
import { lireTatoueur } from "@/lib/tatoueurs";

/**
 * LA FICHE PUBLIQUE, LUE UNE SEULE FOIS PAR REQUÊTE
 * =================================================
 * Trois morceaux de la page ont besoin de la même fiche : les
 * métadonnées (titre, description, robots), l'IMAGE DE PARTAGE (son
 * texte alternatif se construit à partir du nom et de la ville) et le
 * corps de la page. Sans précaution, ça ferait TROIS lectures de base
 * pour un seul affichage.
 *
 * `cache` de React les ramène à UNE : la première lecture est retenue
 * le temps de la requête, les suivantes la retrouvent. ⚠️ Il faut pour
 * cela que tout le monde appelle LA MÊME instance — d'où ce fichier,
 * plutôt qu'un `cache(lireTatoueur)` recopié dans chaque module : deux
 * `cache()` distincts sont deux mémoires distinctes.
 *
 * ⚠️ C'est bien la lecture PUBLIQUE : elle applique déjà toutes les
 * exclusions (fiche non publiée, fiche d'essai d'un administrateur,
 * compte en cours de suppression). L'image de partage n'a donc AUCUNE
 * règle à réécrire — elle se contente de constater.
 */
export const ficheLue = cache(lireTatoueur);
