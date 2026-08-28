"use client";

import { createBrowserClient } from "@supabase/ssr";
import { infosConnexionSupabase } from "./env";
import { fetchAvecDelai } from "./delai";

/**
 * Client Supabase pour le NAVIGATEUR (pages côté visiteur).
 * À utiliser dans les composants marqués "use client".
 */
export function creerClientSupabaseNavigateur() {
  const { url, clePublishable } = infosConnexionSupabase();
  /*  §1 (nº 686) — LE DÉLAI DE GARDE. Le dossier de reprise le
      signalait déjà : Chrome coupe une requête pendante vers 30 s,
      Safari attend BIEN plus — et c'est la signature du vieux blocage
      jamais élucidé. Dix secondes valent des deux côtés. La note
      complète est dans `./delai`. */
  return createBrowserClient(url, clePublishable, {
    global: { fetch: fetchAvecDelai() },
  });
}
