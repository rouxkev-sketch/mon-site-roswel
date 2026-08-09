import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { infosConnexionSupabase } from "./env";

/**
 * Client Supabase pour le SERVEUR (pages générées côté serveur,
 * routes API, actions serveur).
 *
 * Il lit la session du visiteur dans les cookies pour savoir
 * qui est connecté.
 */
export async function creerClientSupabaseServeur() {
  const { url, clePublishable } = infosConnexionSupabase();
  const magasinCookies = await cookies();

  return createServerClient(url, clePublishable, {
    cookies: {
      getAll() {
        return magasinCookies.getAll();
      },
      setAll(cookiesAPoser) {
        try {
          cookiesAPoser.forEach(({ name, value, options }) =>
            magasinCookies.set(name, value, options)
          );
        } catch {
          // Appelé depuis un composant serveur : l'écriture des
          // cookies y est interdite par Next.js. Sans gravité :
          // le fichier src/proxy.ts s'occupe de rafraîchir la session.
        }
      },
    },
  });
}
