import { NextResponse } from "next/server";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { calculerScoreTotal, determinerPastille } from "@/lib/score";

/**
 * SAISIE MANUELLE INSTAGRAM (admin, étape 8b)
 * -------------------------------------------
 * Enregistre abonnés + publications, met la date de mise à jour à
 * aujourd'hui, et RECALCULE AUTOMATIQUEMENT le score et la pastille
 * (cahier des charges §5). L'automatisation par API est prévue en
 * V2 : il suffira de remplacer la saisie par un appel automatique,
 * ce recalcul restant identique.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, message: "Outil désactivé sur le site en ligne." },
      { status: 403 }
    );
  }

  let corps: { artisanId?: string; abonnes?: number; publications?: number };
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Requête illisible." },
      { status: 400 }
    );
  }

  const { artisanId } = corps;
  const abonnes = Number(corps.abonnes);
  const publications = Number(corps.publications);
  if (
    !artisanId ||
    !Number.isInteger(abonnes) ||
    !Number.isInteger(publications) ||
    abonnes < 0 ||
    publications < 0
  ) {
    return NextResponse.json(
      {
        ok: false,
        message: "Abonnés et publications doivent être des nombres entiers positifs.",
      },
      { status: 400 }
    );
  }

  try {
    const supabase = creerClientSupabaseAdmin();

    // Les autres composantes du score (Google + ancienneté Sirene)
    const { data: artisan, error: erreurLecture } = await supabase
      .from("artisans")
      .select("note_google, nombre_avis_google, date_creation_entreprise")
      .eq("id", artisanId)
      .single();
    if (erreurLecture || !artisan) {
      throw new Error(erreurLecture?.message ?? "artisan introuvable");
    }

    // Recalcul automatique du score avec les nouvelles données
    const score = calculerScoreTotal(
      abonnes,
      publications,
      artisan.note_google,
      artisan.nombre_avis_google,
      artisan.date_creation_entreprise
    );
    const pastille = determinerPastille(score);

    const { error: erreurEcriture } = await supabase
      .from("artisans")
      .update({
        abonnes_instagram: abonnes,
        publications_instagram: publications,
        date_maj_instagram: new Date().toISOString(),
        score_total: score,
        pastille,
      })
      .eq("id", artisanId);
    if (erreurEcriture) throw new Error(erreurEcriture.message);

    return NextResponse.json({
      ok: true,
      message: `Enregistré. Nouveau score : ${score}/100 (pastille : ${pastille ?? "aucune"}).`,
      score,
      pastille,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
