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
  //  Page vers laquelle revenir après connexion. LE DÉFAUT EST « MA
  //  FICHE » (passe nº 131) : ce chemin ne sert qu'à des retours de
  //  CONNEXION (fournisseur externe, lien d'e-mail), et la règle est
  //  la même pour tous — on arrive sur l'aperçu de son portfolio, ou
  //  sur le formulaire de création si l'on n'a pas encore de fiche.
  //  L'accueil était un défaut hérité, jamais choisi.
  const suite = searchParams.get("next") ?? ARRIVEE_APRES_CONNEXION;

  if (code) {
    const supabase = await creerClientSupabaseServeur();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // UNE SUPPRESSION DE COMPTE EN COURS ? Revenir, c'est l'annuler
      // — quel que soit le chemin de retour (mot de passe, lien
      // d'e-mail, fournisseur externe). La page d'arrivée accueille
      // alors la personne (?bienvenue=1).
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let retour = suite;
      if (user) {
        const { reactiverCompte } = await import("@/lib/suppression-compte");
        if (await reactiverCompte(user.id)) {
          retour += (suite.includes("?") ? "&" : "?") + "bienvenue=1";
        }
      }
      return NextResponse.redirect(`${origin}${retour}`);
    }
  }

  // Code absent ou invalide : retour à l'accueil avec un signal d'erreur
  return NextResponse.redirect(`${origin}/?erreur=connexion`);
}
