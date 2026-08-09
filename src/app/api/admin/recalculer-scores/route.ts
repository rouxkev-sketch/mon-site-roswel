import { NextResponse } from "next/server";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { calculerScoreTotal, determinerPastille } from "@/lib/score";
import {
  travailleNuit,
  travailleWeekend,
  type HorairesSemaine,
} from "@/lib/horaires";

/**
 * RECALCUL DE TOUS LES SCORES (étape 7)
 * -------------------------------------
 * Les scores sont ENREGISTRÉS dans la base (pour un classement
 * rapide). Si on modifie une grille ou un seuil de pastille dans
 * src/config/roswel.ts, les scores déjà enregistrés ne bougent pas
 * tout seuls : cet outil les recalcule tous avec les grilles
 * actuelles et met à jour ce qui a changé.
 * Il recalcule AUSSI les déductions « travaille la nuit / le
 * week-end » depuis les horaires (utile après une migration).
 *
 * À lancer depuis http://localhost:3000/admin/recalculer-scores
 * après chaque modification des grilles ou des seuils.
 */

const TAILLE_PAGE = 500;

type LigneArtisan = {
  id: string;
  nom_affiche: string;
  abonnes_instagram: number | null;
  publications_instagram: number | null;
  note_google: number | null;
  nombre_avis_google: number | null;
  date_creation_entreprise: string | null;
  horaires: HorairesSemaine | null;
  dispo_nuit: boolean;
  dispo_weekend: boolean;
  score_total: number;
  pastille: string | null;
};

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, message: "Outil désactivé sur le site en ligne." },
      { status: 403 }
    );
  }

  try {
    const supabase = creerClientSupabaseAdmin();

    // 1. Lire TOUS les artisans, page par page (quel que soit leur statut)
    const artisans: LigneArtisan[] = [];
    for (let depuis = 0; ; depuis += TAILLE_PAGE) {
      const { data, error } = await supabase
        .from("artisans")
        .select(
          "id, nom_affiche, abonnes_instagram, publications_instagram, note_google, nombre_avis_google, date_creation_entreprise, horaires, dispo_nuit, dispo_weekend, score_total, pastille"
        )
        .order("id")
        .range(depuis, depuis + TAILLE_PAGE - 1);
      if (error) throw new Error(error.message);
      artisans.push(...((data ?? []) as LigneArtisan[]));
      if (!data || data.length < TAILLE_PAGE) break;
    }

    // 2. Recalculer chacun avec les grilles ACTUELLES de la config
    const modifications: Array<Record<string, string | number>> = [];
    for (const artisan of artisans) {
      const nouveauScore = calculerScoreTotal(
        artisan.abonnes_instagram,
        artisan.publications_instagram,
        artisan.note_google,
        artisan.nombre_avis_google,
        artisan.date_creation_entreprise
      );
      const nouvellePastille = determinerPastille(nouveauScore);
      // Déductions depuis les horaires (plus jamais cochées à la main)
      const nuit = travailleNuit(artisan.horaires);
      const weekend = travailleWeekend(artisan.horaires);

      const inchange =
        nouveauScore === artisan.score_total &&
        (nouvellePastille ?? null) === (artisan.pastille ?? null) &&
        nuit === artisan.dispo_nuit &&
        weekend === artisan.dispo_weekend;
      if (inchange) continue;

      const { error } = await supabase
        .from("artisans")
        .update({
          score_total: nouveauScore,
          pastille: nouvellePastille,
          dispo_nuit: nuit,
          dispo_weekend: weekend,
        })
        .eq("id", artisan.id);
      if (error) {
        throw new Error(`${artisan.nom_affiche} : ${error.message}`);
      }

      modifications.push({
        artisan: artisan.nom_affiche,
        avant: `${artisan.score_total} (${artisan.pastille ?? "aucune"})`,
        apres: `${nouveauScore} (${nouvellePastille ?? "aucune"})`,
      });
    }

    return NextResponse.json({
      ok: true,
      message:
        modifications.length === 0
          ? `${artisans.length} artisan(s) contrôlé(s) : tous les scores étaient déjà à jour.`
          : `${artisans.length} artisan(s) contrôlé(s), ${modifications.length} mis à jour.`,
      modifications,
    });
  } catch (erreur) {
    return NextResponse.json(
      {
        ok: false,
        message: erreur instanceof Error ? erreur.message : String(erreur),
      },
      { status: 500 }
    );
  }
}
