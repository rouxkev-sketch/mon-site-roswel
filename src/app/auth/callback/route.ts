import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { ARRIVEE_APRES_CONNEXION } from "@/config/tatouage";

/**
 * RETOUR DE CONNEXION (Google, Facebook, Apple…)
 * ----------------------------------------------
 * Quand quelqu'un se connecte via un fournisseur externe,
 * celui-ci le renvoie ici avec un code temporaire. On échange
 * ce code contre une vraie session, puis on redirige vers la
 * page d'origine.
 *
 * Cette adresse (/auth/callback) est à déclarer dans Supabase :
 * voir docs/CONFIGURATION-SUPABASE.md.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
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
