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
 *
 * ██ §1 (nº 775) — UN SEUL PROJET À LA FOIS ██
 * ==================================================================
 * LE DÉFAUT, VU EN PRODUCTION AU LENDEMAIN DU DÉMÉNAGEMENT : connexion
 * réussie (les favoris et le portfolio s'affichaient), et la barre
 * disait pourtant « Se connecter » — même après rechargement.
 * LA CAUSE : le filtre ci-dessous prenait TOUS les cookies
 * `sb-<projet>-auth-token`, quel que soit le projet. Or changer de
 * projet Supabase change le nom du cookie, et RIEN n'efface l'ancien :
 * le navigateur de qui s'était connecté avant la bascule en porte
 * DEUX. Les deux valeurs étaient alors collées bout à bout, et le
 * résultat n'était plus du base64 lisible — `JSON.parse` levait, on
 * rendait `null`, et la barre concluait « personne ».
 * Reproduit au banc : l'un ou l'autre cookie seul rend bien
 * l'utilisateur ; les deux ensemble, dans n'importe quel ordre, n'en
 * rendent aucun.
 * LA RÈGLE, DÉSORMAIS : les morceaux sont GROUPÉS PAR PROJET, et l'on
 * ne recompose jamais qu'un seul groupe. Le projet courant est essayé
 * d'abord ; si sa session est illisible ou absente, les autres
 * groupes sont tentés à leur tour — un ancien cookie encore valable
 * vaut mieux qu'un écran déconnecté, et l'écoute Supabase corrigera.
 */

/** Le nom court du projet dans l'adresse Supabase — c'est lui que
    @supabase/ssr met dans `sb-<projet>-auth-token`. Vaut `""` si
    l'adresse manque : on n'a alors pas de préférence, et l'ordre des
    groupes ne change rien à la sûreté. */
function projetCourant(): string {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return "";
    return new URL(url).hostname.split(".")[0] ?? "";
  } catch {
    return "";
  }
}

/** Recomposer UN groupe de morceaux (ceux d'un seul projet). */
function lireUnGroupe(
  morceaux: { name: string; value: string }[]
): User | null {
  try {
    const ordonnes = [...morceaux].sort((a, b) => {
      const na = a.name.match(/\.(\d+)$/);
      const nb = b.name.match(/\.(\d+)$/);
      return (na ? Number(na[1]) : -1) - (nb ? Number(nb[1]) : -1);
    });
    let valeur = ordonnes.map(({ value }) => value).join("");
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

export function utilisateurDepuisCookies(
  cookies: { name: string; value: string }[]
): User | null {
  try {
    //  §1 (nº 775) — UN GROUPE PAR PROJET. Le nom porte le projet entre
    //  « sb- » et « -auth-token » ; c'est cette part-là qui sépare.
    const groupes = new Map<string, { name: string; value: string }[]>();
    for (const cookie of cookies) {
      const trouve = /^sb-(.+)-auth-token(\.\d+)?$/.exec(cookie.name);
      if (!trouve) continue;
      const projet = trouve[1];
      const groupe = groupes.get(projet);
      if (groupe) groupe.push(cookie);
      else groupes.set(projet, [cookie]);
    }
    if (groupes.size === 0) return null;

    //  Le projet courant d'abord — c'est le sien qui fait foi.
    const courant = projetCourant();
    const noms = [...groupes.keys()].sort((a, b) => {
      if (a === courant) return -1;
      if (b === courant) return 1;
      return 0;
    });
    for (const nom of noms) {
      const utilisateur = lireUnGroupe(groupes.get(nom) ?? []);
      if (utilisateur) return utilisateur;
    }
    return null;
  } catch {
    return null;
  }
}
