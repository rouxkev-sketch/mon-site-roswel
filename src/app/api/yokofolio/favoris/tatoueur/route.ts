import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";

/**
 * SUIVRE (OU NE PLUS SUIVRE) UN TATOUEUR
 * =======================================
 * Le jumeau exact de la route des photos : un seul point d'entrée,
 * `actif` dit le sens, et c'est la BASE qui garde la porte (politiques
 * RLS de la migration nº 54).
 *
 * ⚠️ SUIVRE NE PRÉVIENT PERSONNE. Aucune notification n'est créée ici,
 * ni pour le tatoueur ni pour qui suit : c'est une liste personnelle,
 * pas un abonnement. Le jour où le site enverra quelque chose, ce sera
 * une décision prise et annoncée — pas un effet de bord glissé dans
 * cette route.
 */
export async function POST(requete: Request) {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, raison: "connexion" }, { status: 401 });
  }

  const corps = (await requete.json().catch(() => null)) as {
    id?: string;
    actif?: boolean;
  } | null;
  const tatoueurId = corps?.id?.trim();
  if (!tatoueurId) {
    return NextResponse.json({ ok: false, raison: "tatoueur" }, { status: 400 });
  }

  if (corps?.actif) {
    const { error } = await supabase
      .from("tatoueurs_suivis")
      .upsert(
        { utilisateur_id: user.id, tatoueur_id: tatoueurId },
        { onConflict: "utilisateur_id,tatoueur_id" }
      );
    if (error) {
      return NextResponse.json({ ok: false, raison: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from("tatoueurs_suivis")
      .delete()
      .eq("utilisateur_id", user.id)
      .eq("tatoueur_id", tatoueurId);
    if (error) {
      return NextResponse.json({ ok: false, raison: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
