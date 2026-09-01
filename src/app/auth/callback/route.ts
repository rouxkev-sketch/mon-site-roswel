import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { ARRIVEE_APRES_CONNEXION } from "@/config/tatouage";

/**
 * RETOUR DE CONNEXION (Google, et les liens d'e-mail)
 * ----------------------------------------------------
 * Quand quelqu'un se connecte via un fournisseur externe,
 * celui-ci le renvoie ici avec un code temporaire. On échange
 * ce code contre une vraie session, puis on redirige vers la
 * page d'origine.
 *
 * ⚠️ CETTE LIGNE DISAIT « Google, Facebook, Apple… » (corrigé nº 783) :
 * les deux derniers n'ont jamais rien renvoyé ici — ils n'étaient que
 * des boutons annoncés — et ils sont retirés. Le seul fournisseur
 * externe du site est Google. Ce chemin sert AUSSI aux liens d'e-mail
 * (confirmation d'adresse, mot de passe oublié), qui portent le même
 * code.
 *
 * Cette adresse (/auth/callback) est à déclarer dans Supabase :
 * voir docs/CONFIGURATION-SUPABASE.md.
 */
/**
 * ██ §1 (nº 783) — L'ORIGINE OÙ L'ON RENVOIE ██
 * ------------------------------------------------------------------
 * LE DÉFAUT, MESURÉ AU BANC : `new URL(request.url).origin` ne rend pas
 * l'adresse par laquelle le visiteur est arrivé — il rend celle que le
 * serveur croit avoir. Une demande faite sur `127.0.0.1:3000` en
 * ressort en `localhost:3000` ; en ligne, une demande faite sur
 * `yokofolio.com` peut en ressortir avec l'adresse interne du
 * déploiement.
 * CE QUE ÇA COÛTERAIT, ET CE N'EST PAS UN DÉTAIL : le cookie de session
 * vient d'être posé sur le domaine d'ARRIVÉE. Renvoyer vers un autre
 * domaine, c'est le laisser derrière — le visiteur reviendrait sur un
 * site qui ne le connaît pas, sa connexion pourtant réussie. C'est très
 * exactement le genre de panne que la nº 775 a coûté.
 * LA RÈGLE : on lit l'hôte que le proxy annonce (`x-forwarded-host`,
 * posé par Vercel), sinon celui de la demande (`host`), et l'on ne
 * retombe sur l'URL qu'en dernier recours.
 * ⚠️ AUCUNE PORTE OUVERTE : on ne compose jamais qu'un CHEMIN INTERNE
 * derrière cette origine (voir `suite`, filtrée à l'entrée du site) —
 * jamais une adresse reçue telle quelle.
 */
function origineReelle(request: Request): string {
  const entetes = request.headers;
  const hote = entetes.get("x-forwarded-host") ?? entetes.get("host");
  if (!hote) return new URL(request.url).origin;
  const protocole =
    entetes.get("x-forwarded-proto") ??
    (hote.startsWith("localhost") || hote.startsWith("127.0.0.1")
      ? "http"
      : "https");
  return `${protocole}://${hote}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = origineReelle(request);
  const code = searchParams.get("code");
  //  Page vers laquelle revenir après connexion. LE DÉFAUT EST
  //  L'AIGUILLAGE (passe nº 137, il remplace la règle de la nº 131) :
  //  ce chemin ne sert qu'à des retours de CONNEXION (fournisseur
  //  externe, lien d'e-mail), et la règle est la même pour tous — la
  //  page /apres-connexion demande à la base si ce compte a un
  //  portfolio, puis mène à sa fiche ou à ses favoris.
  //  L'accueil était un défaut hérité, jamais choisi.
  const suite = searchParams.get("next") ?? ARRIVEE_APRES_CONNEXION;

  if (code) {
    const supabase = await creerClientSupabaseServeur();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      /*  UNE SUPPRESSION DE COMPTE EN COURS ? Revenir, c'est l'annuler
          — quel que soit le chemin de retour (mot de passe, lien
          d'e-mail, fournisseur externe).
          §4 (nº 314) — ET PLUS AUCUN `?bienvenue=1` : le message
          d'accueil qu'il portait est supprimé, sur consigne (il vivait
          sur le formulaire de fiche, page où une connexion ne mène plus
          depuis la nº 313-§2). LA RÉACTIVATION, ELLE, RESTE — c'est la
          promesse faite au moment de la demande de suppression, et elle
          n'a jamais eu besoin d'un message pour se faire. */
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { reactiverCompte } = await import("@/lib/suppression-compte");
        await reactiverCompte(user.id);
      }
      return NextResponse.redirect(`${origin}${suite}`);
    }
  }

  // Code absent ou invalide : retour à l'accueil avec un signal d'erreur
  return NextResponse.redirect(`${origin}/?erreur=connexion`);
}
