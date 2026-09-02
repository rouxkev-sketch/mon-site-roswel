import { NextRequest, NextResponse } from "next/server";
import { verifierAdmin } from "@/lib/admin-yokofolio";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * ADMIN YOKOFOLIO — LES SIGNALEMENTS
 * -----------------------------------
 * GET  : les signalements reçus (les non traités d'abord, puis par
 *        date), avec la NOTE de traitement éventuelle.
 * POST : { id } → archive (traite = true) ;
 *        { id, note } → enregistre la note de traitement, RELUE sur la
 *        carte du signalement (supabase/yokofolio-signalement-note.sql).
 * Accès : administrateurs uniquement (vérifié CÔTÉ SERVEUR).
 */

export async function GET() {
  const refus = await verifierAdmin();
  if (refus) {
    return NextResponse.json(
      { ok: false, message: refus.message },
      { status: refus.statut }
    );
  }
  try {
    const admin = creerClientSupabaseAdmin();
    const { data, error } = await admin
      .from("signalements_fiches")
      .select("*")
      .order("traite", { ascending: true })
      .order("cree_le", { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, signalements: data ?? [] });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: `Couldn't load (has migration supabase/yokofolio-signalements.sql been applied?): ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    );
  }
}

export async function POST(requete: NextRequest) {
  const refus = await verifierAdmin();
  if (refus) {
    return NextResponse.json(
      { ok: false, message: refus.message },
      { status: refus.statut }
    );
  }
  const corps = (await requete.json().catch(() => null)) as {
    id?: number | string;
    note?: string;
  } | null;
  if (!corps?.id) {
    return NextResponse.json(
      { ok: false, message: "Incomplete request." },
      { status: 400 }
    );
  }
  try {
    const admin = creerClientSupabaseAdmin();
    // Une note fournie = on l'enregistre ; sinon, c'est un archivage.
    const valeurs =
      typeof corps.note === "string"
        ? { note: corps.note.trim().slice(0, 600) || null }
        : { traite: true };
    const { error } = await admin
      .from("signalements_fiches")
      .update(valeurs)
      .eq("id", corps.id);
    if (error) {
      if (
        typeof corps.note === "string" &&
        error.message.toLowerCase().includes("note")
      ) {
        throw new Error(
          "The note column doesn't exist yet (migration supabase/yokofolio-signalement-note.sql)."
        );
      }
      throw new Error(error.message);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: `Saving failed: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    );
  }
}
