/**
 * Lit les informations de connexion Supabase depuis le fichier
 * .env.local, avec un message d'erreur clair si elles manquent.
 * Rien à modifier ici : les valeurs se règlent dans .env.local.
 */
export function infosConnexionSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clePublishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !clePublishable) {
    throw new Error(
      "Can't connect to Supabase: NEXT_PUBLIC_SUPABASE_URL " +
        "or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing from .env.local " +
        "(see the .env.local.example template at the project root)."
    );
  }

  return { url, clePublishable };
}
