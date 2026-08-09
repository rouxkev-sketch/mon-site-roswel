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
      "Connexion Supabase impossible : il manque NEXT_PUBLIC_SUPABASE_URL " +
        "ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY dans le fichier .env.local " +
        "(voir le modèle .env.local.example à la racine du projet)."
    );
  }

  return { url, clePublishable };
}
