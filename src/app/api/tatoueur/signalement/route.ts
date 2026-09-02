import { NextRequest, NextResponse } from "next/server";
import { MOTIFS_SIGNALEMENT } from "@/config/tatouage";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * LE SIGNALEMENT D'UNE FICHE — enregistrement côté serveur
 * ---------------------------------------------------------
 * Reçoit la fenêtre « Signaler cette fiche » : le slug de la fiche,
 * les motifs cochés (validés contre la liste de la configuration) et
 * le champ libre. AUCUNE donnée personnelle du signaleur n'est
 * demandée ni conservée. Écrit dans `signalements_fiches`
 * (supabase/yokofolio-signalements.sql) via la clé d'administration —
 * la table n'a aucune règle publique. L'admin les lit dans /admin.
 */

const MOTIFS_CONNUS = new Set<string>(MOTIFS_SIGNALEMENT.map((m) => m.slug));

export async function POST(requete: NextRequest) {
  try {
    const corps = (await requete.json().catch(() => null)) as {
      slug?: string;
      motifs?: string[];
      details?: string;
    } | null;

    const slug = corps?.slug?.trim().toLowerCase() ?? "";
    const motifs = (corps?.motifs ?? []).filter((m) => MOTIFS_CONNUS.has(m));
    const details = (corps?.details ?? "").trim().slice(0, 600);

    if (!/^[a-z0-9-]{2,80}$/.test(slug) || motifs.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Check at least one reason." },
        { status: 400 }
      );
    }

    const admin = creerClientSupabaseAdmin();
    const { error } = await admin.from("signalements_fiches").insert({
      tatoueur_slug: slug,
      motifs,
      details: details || null,
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Sending failed — the database may not be ready (migration supabase/yokofolio-signalements.sql).",
      },
      { status: 500 }
    );
  }
}
