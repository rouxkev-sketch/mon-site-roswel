import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { reactiverCompte } from "@/lib/suppression-compte";
import { creerNotification } from "@/lib/notifications";

/**
 * LE RETOUR D'UN COMPTE EN COURS DE SUPPRESSION
 * ----------------------------------------------
 * Appelée JUSTE APRÈS une connexion réussie. Si une suppression était
 * en cours pour ce compte, elle est ANNULÉE — la fiche redevient
 * visible exactement telle qu'elle était (rien d'autre n'avait été
 * touché), et la réponse le dit (`reactive: true`) pour que l'écran
 * puisse accueillir la personne.
 *
 * Aucune suppression en cours, ou migration pas encore passée : la
 * réponse dit simplement `reactive: false`. Se connecter ne doit
 * JAMAIS échouer à cause de cette route.
 */
export async function POST() {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, reactive: false }, { status: 401 });
  }

  const reactive = await reactiverCompte(user.id);
  // La bonne nouvelle est écrite noir sur blanc : « la suppression est
  // annulée » doit se retrouver dans les notifications, pas seulement
  // dans une fenêtre qui passe.
  if (reactive) {
    await creerNotification({
      userId: user.id,
      genre: "annulation",
      detail:
        "Te reconnecter a annulé la suppression du compte : tes portfolios sont rétablis tels qu'ils étaient.",
    });
  }
  return NextResponse.json({ ok: true, reactive });
}
