import { NextResponse } from "next/server";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * CHANGER LE STATUT D'UN SIGNALEMENT (admin)
 * ------------------------------------------
 * Réservé aux outils d'administration (comme /api/admin/validation,
 * désactivé sur le site en ligne : l'admin travaille en local avec la
 * clé secrète Supabase). Fait passer un signalement de « nouveau » à
 * « traité » ou « rejeté » (ou le remet à « nouveau »).
 */
const STATUTS = new Set(["nouveau", "traite", "rejete"]);

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, message: "Outil désactivé sur le site en ligne." },
      { status: 403 }
    );
  }

  let corps: { signalementId?: string; statut?: string };
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Requête illisible." },
      { status: 400 }
    );
  }

  const { signalementId, statut } = corps;
  if (!signalementId || !statut || !STATUTS.has(statut)) {
    return NextResponse.json(
      { ok: false, message: "Signalement ou statut manquant / invalide." },
      { status: 400 }
    );
  }

  try {
    const admin = creerClientSupabaseAdmin();
    const { error } = await admin
      .from("signalements")
      .update({ statut })
      .eq("id", signalementId);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, message: "Statut mis à jour." });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
