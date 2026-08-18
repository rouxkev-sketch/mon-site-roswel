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

/**
 * ██ nº 357 — LE LECTEUR ANONYME, pour les pages PRÉPARÉES D'AVANCE ██
 * ====================================================================
 * Même adresse, même clé publique, MAIS AUCUNE LECTURE DE COOKIES :
 * ce client voit la base exactement comme un visiteur déconnecté.
 * C'est le client du CATALOGUE (lib/tatoueurs), qui est, par
 * conception, le même pour tout le monde depuis la nº 275 (« la
 * mosaïque applique la même règle que la base — estEnLigne, rien
 * d'autre ») : la session n'y changeait RIEN, mais sa simple lecture
 * (`cookies()`) suffisait à rendre DYNAMIQUE toute page qui liste des
 * tatoueurs — et le rendu dynamique est la cause signée des éjections
 * de retour (verdict nº 356). Un composant qui a besoin de la session
 * garde `creerClientSupabaseServeur` ci-dessus.
 */
export function creerClientSupabaseAnonyme() {
  const { url, clePublishable } = infosConnexionSupabase();
  return createServerClient(url, clePublishable, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // rien à poser : ce client n'a pas de session
      },
    },
  });
}
