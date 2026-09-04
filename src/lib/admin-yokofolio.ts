import { COURRIELS_ADMIN } from "@/config/tatouage";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";

/**
 * LE GARDE DE L'ADMIN YOKOFOLIO — côté serveur
 * =============================================
 * /admin et ses API sont réservés aux comptes Supabase dont l'adresse
 * figure dans COURRIELS_ADMIN (src/config/tattoo.ts). L'écran
 * vérifie pour l'affichage ; CHAQUE API revérifie ici — c'est la
 * sécurité réelle, celle qu'aucun navigateur ne contourne.
 */

/** Cette adresse est-elle administratrice ? (comparaison insensible
    à la casse) */
export function estCourrielAdmin(courriel: string | undefined | null): boolean {
  if (!courriel) return false;
  const propre = courriel.trim().toLowerCase();
  return COURRIELS_ADMIN.some((c) => c.trim().toLowerCase() === propre);
}

/** Le compte connecté de la requête est-il administrateur ?
    null = oui ; sinon la raison du refus (à renvoyer en 401/403). */
export async function verifierAdmin(): Promise<
  { statut: 401 | 403; message: string } | null
> {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { statut: 401, message: "Log in to open the admin." };
  }
  if (!estCourrielAdmin(user.email)) {
    return {
      statut: 403,
      message: "This account isn't a YokoFolio admin.",
    };
  }
  return null;
}
