import { creerClientSupabaseServeur } from "@/lib/supabase/server";
/*  §1 (nº 884) — LA COMPARAISON A DÉMÉNAGÉ, et elle est réexportée
    ici : le bandeau de diagnostic la pose côté navigateur, où ce
    fichier-ci ne peut pas entrer (il importe le client Supabase du
    serveur). Une seule écriture, deux lecteurs. */
import { estCourrielAdmin } from "@/lib/courriel-admin";

export { estCourrielAdmin };

/**
 * LE GARDE DE L'ADMIN YOKOFOLIO — côté serveur
 * =============================================
 * /admin et ses API sont réservés aux comptes Supabase dont l'adresse
 * figure dans COURRIELS_ADMIN (src/config/tattoo.ts). L'écran
 * vérifie pour l'affichage ; CHAQUE API revérifie ici — c'est la
 * sécurité réelle, celle qu'aucun navigateur ne contourne.
 */

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
