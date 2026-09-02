import { createClient } from "@supabase/supabase-js";
import { fetchAvecDelai } from "./delai";

/**
 * Client Supabase ADMINISTRATEUR — réservé au code qui tourne sur
 * le serveur (imports, futures pages admin).
 *
 * Il utilise la clé SECRÈTE du projet : elle n'est pas soumise aux
 * règles de sécurité (RLS) et peut donc tout lire et tout écrire.
 * ⚠️ Ne JAMAIS l'importer dans un composant marqué "use client" :
 * la clé partirait dans le navigateur des visiteurs.
 */
export function creerClientSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cleSecrete = process.env.SUPABASE_SECRET_KEY;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing from .env.local."
    );
  }

  if (!cleSecrete) {
    throw new Error(
      "The Supabase secret key isn't set. Open the " +
        ".env.local file and fill in the SUPABASE_SECRET_KEY= line with the " +
        "\"secret\" key (Supabase → Project Settings → API Keys). Then stop " +
        "and restart `npm run dev` so it's picked up."
    );
  }

  return createClient(url, cleSecrete, {
    // Pas de session ici : ce client sert uniquement côté serveur.
    auth: { persistSession: false, autoRefreshToken: false },
    //  §1 (nº 686) — le délai de garde, comme les trois autres clients.
    //  Les routes d'administration lisent de gros ensembles ; si la base
    //  se tait, elles doivent RENDRE UNE ERREUR, pas faire attendre
    //  jusqu'au délai de la fonction. La note est dans `./delai`.
    global: { fetch: fetchAvecDelai() },
  });
}
