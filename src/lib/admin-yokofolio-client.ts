import { COURRIELS_ADMIN } from "@/config/tatouage";

/**
 * LE MÊME TEST QUE CÔTÉ SERVEUR, pour l'AFFICHAGE de /admin — séparé
 * de src/lib/admin-yokofolio.ts, qui importe le client Supabase
 * SERVEUR (interdit dans un composant navigateur). La vraie sécurité
 * reste dans les API : ce test-ci ne décide que de ce qu'on montre.
 */
export function estCourrielAdmin(courriel: string | undefined | null): boolean {
  if (!courriel) return false;
  const propre = courriel.trim().toLowerCase();
  return COURRIELS_ADMIN.some((c) => c.trim().toLowerCase() === propre);
}
