import type { User } from "@supabase/supabase-js";

/**
 * LIRE L'UTILISATEUR CONNECTÉ DANS LES COOKIES — sans réseau
 * ===========================================================
 * @supabase/ssr range la session dans un cookie
 * « sb-<projet>-auth-token », en un ou plusieurs morceaux (« .0 »,
 * « .1 »… quand elle est longue), encodés « base64- » + base64url du
 * JSON. Cette fonction recompose, décode et rend l'utilisateur.
 *
 * Elle est ISOMORPHE : le NAVIGATEUR l'appelle avec `document.cookie`
 * découpé (voir use-utilisateur.ts), le SERVEUR avec `cookies()` de
 * next/headers (voir la mise en page du groupe tatouage). C'est ce qui
 * permet au HTML rendu par le serveur de porter DÉJÀ l'état connecté :
 * aucun clignotement, même au premier chargement d'une page.
 *
 * Au moindre doute : null — l'écoute Supabase côté navigateur
 * tranchera. Seul l'objet `user` est extrait, jamais les jetons.
 */
export function utilisateurDepuisCookies(
  cookies: { name: string; value: string }[]
): User | null {
  try {
    const morceaux = cookies
      .filter(({ name }) => /^sb-.+-auth-token(\.\d+)?$/.test(name))
      // Le morceau sans numéro d'abord, puis .0, .1, .2…
      .sort((a, b) => {
        const na = a.name.match(/\.(\d+)$/);
        const nb = b.name.match(/\.(\d+)$/);
        return (na ? Number(na[1]) : -1) - (nb ? Number(nb[1]) : -1);
      });
    if (morceaux.length === 0) return null;

    let valeur = morceaux.map(({ value }) => value).join("");
    // `document.cookie` livre la valeur encodée pour l'URL ; le serveur
    // la livre parfois déjà décodée — décoder est alors sans effet.
    try {
      valeur = decodeURIComponent(valeur);
    } catch {
      // valeur déjà décodée contenant un « % » isolé : on la garde telle quelle
    }
    if (valeur.startsWith("base64-")) {
      const brut = atob(
        valeur.slice("base64-".length).replace(/-/g, "+").replace(/_/g, "/")
      );
      // atob rend des octets ; les accents des noms sont en UTF-8.
      valeur = new TextDecoder().decode(
        Uint8Array.from(brut, (c) => c.charCodeAt(0))
      );
    }
    const session = JSON.parse(valeur) as { user?: User } | null;
    return session?.user ?? null;
  } catch {
    return null;
  }
}
