import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import {
  DELAI_SUPPRESSION_JOURS,
  demanderSuppression,
} from "@/lib/suppression-compte";
import { creerNotification } from "@/lib/notifications";

/**
 * SUPPRESSION DU COMPTE TATOUEUR (RGPD) — DIFFÉRÉE DE 30 JOURS
 * -------------------------------------------------------------
 * PLUS RIEN N'EST EFFACÉ ICI. La demande rend le compte et sa fiche
 * INVISIBLES immédiatement, et pose l'échéance : la suppression
 * définitive (photos, fiche, compte) intervient 30 jours plus tard,
 * par la tâche planifiée /api/cron/purge-comptes.
 *
 * ENTRE-TEMPS, UNE SIMPLE RECONNEXION ANNULE TOUT — automatiquement,
 * sans rien demander : voir /api/tatoueur/reactiver et
 * lib/suppression-compte.
 *
 * L'appel exige d'être CONNECTÉ : on ne supprime que SON PROPRE
 * compte. La confirmation forte (« écris SUPPRIMER ») vit côté écran ;
 * ici, on enregistre la demande.
 */
export async function POST() {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Connecte-toi pour supprimer ton compte." },
      { status: 401 }
    );
  }

  const resultat = await demanderSuppression(user.id, user.email ?? null);
  if (!resultat.ok) {
    return NextResponse.json(
      { ok: false, message: `Suppression impossible : ${resultat.message}` },
      { status: 500 }
    );
  }

  // La trace, pour la retrouver au retour : se reconnecter annule
  // tout, encore faut-il savoir qu'une suppression courait.
  await creerNotification({
    userId: user.id,
    genre: "suppression_compte",
    detail: `Le compte et TOUS ses portfolios sont retirés du public. Effacement définitif dans ${DELAI_SUPPRESSION_JOURS} jours — une simple reconnexion annule tout.`,
  });

  return NextResponse.json({
    ok: true,
    purgeLe: resultat.purgeLe,
    jours: DELAI_SUPPRESSION_JOURS,
  });
}
