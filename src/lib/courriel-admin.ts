/**
 * ██ UNE ADRESSE EST-ELLE CELLE DE L'ADMINISTRATION ? ██
 * ==================================================================
 * (sorti de lib/admin-yokofolio à la passe nº 884)
 *
 * POURQUOI CE FICHIER EXISTE. La question — « cette adresse est-elle
 * administratrice ? » — se posait UNIQUEMENT côté serveur, et vivait
 * donc avec le garde qui lit la session Supabase du serveur. Le
 * bandeau de diagnostic (nº 884) la pose CÔTÉ NAVIGATEUR : importer
 * `admin-yokofolio` depuis un composant client ferait entrer le client
 * Supabase SERVEUR dans la page — ce que Next refuse, à raison.
 * LA RÈGLE NE CHANGE PAS D'UN CARACTÈRE : c'est la même comparaison,
 * à la même liste (`COURRIELS_ADMIN`, src/config/tatouage) — écrite
 * une seule fois, ici, et lue des deux côtés (piège nº 378).
 * ⚠️ ET CE N'EST PAS UNE SÉCURITÉ : la sécurité réelle reste le garde
 * du serveur (`verifierAdmin`), que chaque API revérifie. Cette
 * lecture-ci ne décide que d'un AFFICHAGE.
 */
import { COURRIELS_ADMIN } from "@/config/tatouage";

/** Cette adresse est-elle administratrice ? (comparaison insensible
    à la casse) */
export function estCourrielAdmin(courriel: string | undefined | null): boolean {
  if (!courriel) return false;
  const propre = courriel.trim().toLowerCase();
  return COURRIELS_ADMIN.some((c) => c.trim().toLowerCase() === propre);
}
