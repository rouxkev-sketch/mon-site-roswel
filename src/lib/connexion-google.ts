import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { ARRIVEE_APRES_CONNEXION } from "@/config/tatouage";
import { suiteSure } from "@/lib/favoris-yokofolio";

/**
 * ██ SE CONNECTER AVEC GOOGLE (passe nº 783) ██
 * ==================================================================
 * Le bouton « Continuer avec Google » n'annonce plus, il FAIT : l'app
 * Google est créée, le fournisseur est activé dans le projet Supabase,
 * et l'adresse de retour de Supabase est déclarée chez Google.
 *
 * CE QUI SE PASSE, EN TROIS TEMPS :
 *  1. le navigateur part chez Google (c'est Supabase qui l'y envoie,
 *     avec les bons paramètres) ;
 *  2. Google renvoie chez Supabase, à SON adresse de retour à lui
 *     (`…/auth/v1/callback`) — celle qu'on déclare dans la console
 *     Google, et qui ne nous concerne pas ;
 *  3. Supabase renvoie ENFIN chez nous, à `/auth/callback`, avec un
 *     code que cette route échange contre une session (elle existe
 *     depuis toujours et n'a pas eu à changer).
 *
 * ⚠️ UNE SEULE ÉCRITURE POUR TOUTES LES SURFACES (piège nº 378) :
 * l'écran d'authentification et la page Sécurité appellent CETTE
 * fonction. La façon de composer l'adresse de retour — le point le
 * plus facile à se tromper — n'existe qu'ici.
 */

/**
 * L'ADRESSE OÙ GOOGLE (via Supabase) DOIT NOUS RAMENER.
 * ------------------------------------------------------------------
 * ⚠️ ELLE SE LIT SUR LA PAGE, elle ne s'écrit pas en dur. Le site vit
 * à trois endroits — `yokofolio.com`, les aperçus de Vercel, et
 * `localhost` quand on travaille — et une adresse écrite en dur
 * renverrait toujours au même, donc au mauvais deux fois sur trois.
 * `window.location.origin` dit toujours d'où l'on est parti.
 *
 * ⚠️ CE QUE ÇA SUPPOSE, ET C'EST À DÉCLARER UNE FOIS DANS SUPABASE
 * (Authentication ▸ URL Configuration ▸ Redirect URLs) : chacune de
 * ces origines suivie de `/auth/callback`. Une origine non déclarée
 * est refusée par Supabase — c'est une sécurité, pas une panne.
 *
 * ⚠️ LE CHEMIN DE RETOUR VOYAGE DANS `next=`, et il est PASSÉ AU
 * CRIBLE (`suiteSure`) : seul un chemin interne au site est accepté.
 * Sans cela, une adresse fabriquée pourrait faire revenir quelqu'un
 * ailleurs que chez nous, sa session fraîchement posée en poche.
 */
/** La page des réglages du compte — là où l'on revient quand c'est de
    là qu'on est parti lier Google (§3, nº 783). */
export const RETOUR_SECURITE = "/become-an-artist/security";

export function adresseDeRetour(suite?: string): string {
  const origine = window.location.origin;
  const propre = suiteSure(suite) ?? ARRIVEE_APRES_CONNEXION;
  return `${origine}/auth/callback?next=${encodeURIComponent(propre)}`;
}

/**
 * LANCE LA CONNEXION. Rend un message d'erreur en français, ou `null`
 * quand tout va bien — auquel cas le navigateur est déjà en train de
 * partir chez Google et il n'y a plus rien à faire.
 */
export async function connexionAvecGoogle(
  suite?: string
): Promise<string | null> {
  try {
    const supabase = creerClientSupabaseNavigateur();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: adresseDeRetour(suite),
        /*  ⚠️ `select_account` : Google propose SES comptes au lieu de
            reprendre le dernier utilisé sans rien demander. Sur un
            ordinateur partagé, c'est la différence entre « se
            connecter » et « se retrouver connecté à la place de
            quelqu'un d'autre ». */
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) return traduire(error.message);
    return null;
  } catch (erreur) {
    return traduire(erreur instanceof Error ? erreur.message : String(erreur));
  }
}

/**
 * ██ §3 (nº 783) — LIER GOOGLE À UN COMPTE DÉJÀ CONNECTÉ ██
 * ==================================================================
 * ⚠️ CE N'EST PAS LE MÊME APPEL QUE SE CONNECTER, ET C'EST TOUT LE
 * SUJET. `signInWithOAuth` veut dire « ouvre-moi une session » : si
 * l'adresse Google choisie n'est pas celle du compte en cours, elle
 * ouvre la session DE L'AUTRE COMPTE — on croit avoir ajouté un moyen
 * d'entrée, on a changé d'identité, et le compte de départ reste
 * derrière avec sa fiche. `linkIdentity` veut dire « ajoute ce moyen
 * d'entrée À CE COMPTE-CI » : c'est le seul appel juste depuis une
 * page de réglages, et il refuse tout seul une adresse Google déjà
 * prise par quelqu'un d'autre.
 *
 * ⚠️ UN RÉGLAGE À FAIRE UNE FOIS DANS SUPABASE, sans quoi cet appel
 * répond « Manual linking is disabled » : Authentication ▸ Providers ▸
 * **Enable Manual Linking**. Le message ci-dessous le dit en clair
 * plutôt que de laisser le bouton échouer sans raison lisible.
 */
export async function lierGoogle(): Promise<string | null> {
  try {
    const supabase = creerClientSupabaseNavigateur();
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: {
        //  On revient sur la page qu'on quitte : les réglages.
        redirectTo: adresseDeRetour(RETOUR_SECURITE),
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) return traduire(error.message);
    return null;
  } catch (erreur) {
    return traduire(erreur instanceof Error ? erreur.message : String(erreur));
  }
}

/**
 * ██ §3 (nº 783) — DÉLIER GOOGLE ██
 * ==================================================================
 * ⚠️ LE DANGER, ET IL EST DÉFINITIF : délier le SEUL moyen d'entrée
 * d'un compte, c'est s'en fermer la porte pour toujours. Un compte
 * créé par Google n'a pas de mot de passe ; lui retirer Google ne
 * laisse rien.
 * DEUX VERROUS, ET LES DEUX SONT NÉCESSAIRES :
 *  1. ICI — on compte les identités et l'on refuse la dernière, avec
 *     une phrase qui dit quoi faire (ajouter un mot de passe d'abord) ;
 *  2. l'écran, qui ne montre même pas le bouton dans ce cas. Le verrou
 *     de l'écran évite la question, celui-ci évite l'accident — un
 *     bouton peut toujours être atteint autrement.
 * (Supabase refuse aussi la dernière identité, en anglais. On ne
 * compte pas sur lui pour parler à Kevin.)
 */
export async function delierGoogle(): Promise<string | null> {
  try {
    const supabase = creerClientSupabaseNavigateur();
    const { data, error: lecture } = await supabase.auth.getUserIdentities();
    if (lecture) return traduire(lecture.message);
    const identites = data?.identities ?? [];
    const google = identites.find((une) => une.provider === "google");
    if (!google) return "Google isn't linked to this account.";
    if (identites.length <= 1) {
      return "It's your only way to log in: add a password first, then you can unlink Google.";
    }
    const { error } = await supabase.auth.unlinkIdentity(google);
    if (error) return traduire(error.message);
    /*  LA SESSION DIT ENCORE LE CONTRAIRE. `unlinkIdentity` écrit chez
        Supabase et s'arrête là : le cookie de session — celui d'où le
        site tire `app_metadata.providers`, au premier rendu et jusque
        sur le serveur — porte toujours « google ». Sans ce
        renouvellement, l'écran continuerait d'annoncer Google lié.
        ⚠️ ET C'EST BIEN `refreshSession`, malgré la mise en garde de
        `use-utilisateur` : elle vise la relecture ROUTINIÈRE, à chaque
        page, où faire tourner le jeton pour rien risque de déconnecter
        un second onglet. Ici, c'est un geste unique et voulu, qui vient
        de changer le compte pour de bon — c'est le seul appel qui
        réécrive le cookie. */
    await supabase.auth.refreshSession();
    return null;
  } catch (erreur) {
    return traduire(erreur instanceof Error ? erreur.message : String(erreur));
  }
}

/** Les rares erreurs de ce chemin, dites en français — jamais
    d'anglais brut à l'écran (la règle de `EcranAuthentification`). */
function traduire(brut: string): string {
  const texte = brut.toLowerCase();
  if (texte.includes("provider is not enabled")) {
    return "Google login isn't enabled on the site yet.";
  }
  //  §3 (nº 783) — le réglage « Enable Manual Linking » de Supabase.
  if (texte.includes("manual linking") || texte.includes("linking is disabled")) {
    return "Linking a Google account isn't allowed on the site yet. Let me know: it's a setting to turn on.";
  }
  //  §3 (nº 783) — cette adresse Google appartient déjà à quelqu'un.
  if (texte.includes("already") && texte.includes("identity")) {
    return "This Google account is already linked to another account on the site.";
  }
  //  §3 (nº 783) — le refus de Supabase sur la dernière identité.
  if (texte.includes("at least 1 identity") || texte.includes("single identity")) {
    return "It's your only way to log in: add a password first, then you can unlink Google.";
  }
  if (texte.includes("redirect") || texte.includes("not allowed")) {
    return "The return address isn't allowed. Let me know: it's a site setting.";
  }
  if (texte.includes("network") || texte.includes("fetch")) {
    return "The Google login couldn't open. Check your connection, then try again.";
  }
  return "Google login failed. Try again in a moment.";
}
