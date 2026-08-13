import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";

/**
 * LA VISITE DE « MA SÉLECTION » VIENT D'ÊTRE FAITE (nº 243-§5)
 * ==================================================================
 * Appelée AU DÉPART de la page — jamais à l'ouverture : écrite à
 * l'arrivée, elle effacerait les compteurs de nouveautés avant qu'ils
 * n'aient été lus. C'est le navigateur qui appelle (`sendBeacon` sur
 * `pagehide`, ou le démontage du composant), voir PageFavoris.
 *
 * UNE LIGNE PAR COMPTE (`visites_selection`, migration nº 68) : la
 * page entière est concernée, un seul horodatage suffit. `upsert` :
 * la première visite crée la ligne, les suivantes la remplacent.
 * Sans session, sans table (migration pas passée) : 204 silencieux —
 * marquer une visite n'est jamais une erreur qui remonte à l'écran.
 */
export async function POST() {
  try {
    const supabase = await creerClientSupabaseServeur();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new NextResponse(null, { status: 204 });

    await supabase.from("visites_selection").upsert(
      { utilisateur_id: user.id, vu_le: new Date().toISOString() },
      { onConflict: "utilisateur_id" }
    );
  } catch {
    //  Table absente ou base injoignable : le compteur restera celui
    //  d'avant, et c'est tout.
  }
  return new NextResponse(null, { status: 204 });
}
