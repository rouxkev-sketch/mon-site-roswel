import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ARRIVEE_SANS_PORTFOLIO } from "@/config/tatouage";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";

/**
 * L'ARRIVÉE D'APRÈS CONNEXION (passe nº 137, simplifiée nº 313-§2)
 * ==============================================================
 * Adresse : /apres-connexion
 *
 * ELLE N'AFFICHE RIEN, ET ELLE NE DEMANDE PLUS RIEN À LA BASE :
 * APRÈS CONNEXION, ON ARRIVE TOUJOURS SUR « MA SÉLECTION ». Même page
 * pour tout le monde, portfolio ou pas.
 *
 * ⚠️ CE QU'ELLE FAISAIT JUSQU'ICI, ET QUI EST ANNULÉ (nº 313-§2, sur
 * consigne) : elle posait une question à la base — « ce compte a-t-il
 * au moins un portfolio ? » — et envoyait vers la FICHE quand la
 * réponse était oui. Ce n'était pas voulu : quelqu'un qui a créé un
 * portfolio arrivait sur la visualisation de sa fiche au lieu de sa
 * sélection. La question, la requête et les deux sorties disparaissent
 * ensemble — il n'y a plus qu'une arrivée, donc plus rien à départager.
 *
 * ⚠️ CE QUI N'EST PAS CONCERNÉ, ET QUI NE DOIT PAS L'ÊTRE : LES
 * RETOURS D'ACTION. Un cœur ou un « Suivre » touché sans compte
 * emporte le chemin de la page qu'on regardait (`?suite=`, voir
 * `versLaConnexion`), et le lien d'e-mail son propre `next=`. Ces
 * chemins-là passent AVANT cette page et ne l'atteignent jamais : on
 * revient à son geste, pas ici. Cette règle ne vaut donc que pour une
 * connexion ORDINAIRE — celle qui n'a rien demandé de particulier.
 *
 * ⚠️ `?bienvenue=1` A DISPARU (nº 314-§4). Il portait un message
 * d'accueil pour qui revenait annuler la suppression de son compte ;
 * ce message est supprimé, code compris, sur consigne. La réactivation
 * du compte, elle, n'a pas bougé : elle se fait à la connexion, sans
 * rien afficher (voir /auth/callback).
 */
export const metadata: Metadata = {
  title: "Un instant…",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PageApresConnexion() {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  //  Personne : la page de connexion. Elle n'a pas à être atteinte
  //  ainsi, mais une adresse tapée à la main ne doit rien casser.
  if (!user) redirect("/devenir-tatoueur");

  //  §2 (nº 313) — UNE SEULE SORTIE, POUR TOUT LE MONDE.
  redirect(ARRIVEE_SANS_PORTFOLIO);
}
