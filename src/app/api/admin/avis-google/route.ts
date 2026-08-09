import { NextResponse } from "next/server";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { calculerScoreTotal, determinerPastille } from "@/lib/score";
import { journaliserAppelsGoogle } from "@/lib/journal-google";

/**
 * AVIS GOOGLE — RECHERCHE, ASSOCIATION, RAFRAÎCHISSEMENT (étape 11)
 * -----------------------------------------------------------------
 * Via l'API officielle Google Places (clé GOOGLE_PLACES_API_KEY dans
 * .env.local — guide : docs/ETAPE-11-LANCEMENT.md).
 *
 * Règles du cahier des charges (§5) et de Google respectées :
 * on ne récupère QUE la note et le nombre d'avis (jamais le détail
 * des avis), et on les rafraîchit régulièrement (bouton, puis
 * automatisation possible en V2). Le score est recalculé à chaque
 * rafraîchissement.
 */

const CHAMPS_RECHERCHE = "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount";
const CHAMPS_DETAILS = "rating,userRatingCount,displayName";

function erreur(message: string, code = 400) {
  return NextResponse.json({ ok: false, message }, { status: code });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return erreur("Outil désactivé sur le site en ligne.", 403);
  }

  const cle = process.env.GOOGLE_PLACES_API_KEY;
  if (!cle) {
    return erreur(
      "La clé Google Places n'est pas renseignée : compléter GOOGLE_PLACES_API_KEY dans .env.local (guide : docs/ETAPE-11-LANCEMENT.md) puis relancer `npm run dev`."
    );
  }

  let corps: {
    action?: "rechercher" | "associer" | "rafraichir";
    requete?: string;
    artisanId?: string;
    placeId?: string;
  };
  try {
    corps = await request.json();
  } catch {
    return erreur("Requête illisible.");
  }

  try {
    // ----- Rechercher la fiche Google d'un artisan -----
    if (corps.action === "rechercher") {
      const reponse = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": cle,
            "X-Goog-FieldMask": CHAMPS_RECHERCHE,
          },
          body: JSON.stringify({
            textQuery: corps.requete ?? "",
            languageCode: "fr",
            regionCode: "FR",
          }),
        }
      );

      // JOURNALISÉ TOUT DE SUITE, avant même de regarder la réponse.
      // Cette recherche demande la note et le nombre d'avis : elle
      // relève donc du palier « Enterprise », le plus cher, et non du
      // même budget que la recherche de la prospection.
      await journaliserAppelsGoogle([
        {
          outil: "avis-google",
          typeAppel: "recherche_avis",
          nombreAppels: 1,
          resultat: reponse.ok ? "ok" : "echec",
          detail: reponse.ok ? undefined : `Google a répondu ${reponse.status}`,
        },
      ]);

      if (!reponse.ok) {
        return erreur(
          `Google a répondu « ${reponse.status} » — vérifier que l'API Places (New) est activée pour cette clé.`
        );
      }
      const donnees = (await reponse.json()) as {
        places?: Array<{
          id: string;
          displayName?: { text?: string };
          formattedAddress?: string;
          rating?: number;
          userRatingCount?: number;
        }>;
      };
      return NextResponse.json({
        ok: true,
        candidats: (donnees.places ?? []).slice(0, 3).map((lieu) => ({
          placeId: lieu.id,
          nom: lieu.displayName?.text ?? "(sans nom)",
          adresse: lieu.formattedAddress ?? "",
          note: lieu.rating ?? null,
          avis: lieu.userRatingCount ?? null,
        })),
      });
    }

    // ----- Associer une fiche Google / rafraîchir la note -----
    if (corps.action === "associer" || corps.action === "rafraichir") {
      if (!corps.artisanId) return erreur("Artisan manquant.");
      const supabase = creerClientSupabaseAdmin();

      // La fiche Google à interroger
      let placeId = corps.placeId ?? null;
      if (corps.action === "rafraichir") {
        const { data } = await supabase
          .from("artisans")
          .select("place_id_google")
          .eq("id", corps.artisanId)
          .single();
        placeId = data?.place_id_google ?? null;
      }
      if (!placeId) return erreur("Aucune fiche Google associée.");

      const reponse = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
        {
          headers: { "X-Goog-Api-Key": cle, "X-Goog-FieldMask": CHAMPS_DETAILS },
        }
      );

      // La lecture de la note : l'appel le plus cher de la grille,
      // sur la franchise la plus basse. Journalisé succès ou échec.
      await journaliserAppelsGoogle([
        {
          outil: "avis-google",
          typeAppel: "details_avis",
          nombreAppels: 1,
          resultat: reponse.ok ? "ok" : "echec",
          detail:
            (corps.action === "associer" ? "association" : "rafraîchissement") +
            (reponse.ok ? "" : ` · Google a répondu ${reponse.status}`),
        },
      ]);

      if (!reponse.ok) {
        return erreur(`Google a répondu « ${reponse.status} » pour cette fiche.`);
      }
      const lieu = (await reponse.json()) as {
        rating?: number;
        userRatingCount?: number;
      };
      const note = lieu.rating ?? null;
      const avis = lieu.userRatingCount ?? 0;

      // Recalcul du score avec la note fraîche
      const { data: artisan, error: erreurLecture } = await supabase
        .from("artisans")
        .select("abonnes_instagram, publications_instagram, date_creation_entreprise")
        .eq("id", corps.artisanId)
        .single();
      if (erreurLecture || !artisan) throw new Error("artisan introuvable");

      const score = calculerScoreTotal(
        artisan.abonnes_instagram,
        artisan.publications_instagram,
        note,
        avis,
        artisan.date_creation_entreprise
      );
      const pastille = determinerPastille(score);

      const { error: erreurEcriture } = await supabase
        .from("artisans")
        .update({
          place_id_google: placeId,
          note_google: note,
          nombre_avis_google: avis,
          score_total: score,
          pastille,
        })
        .eq("id", corps.artisanId);
      if (erreurEcriture) throw new Error(erreurEcriture.message);

      return NextResponse.json({
        ok: true,
        message: `Note Google à jour : ${note ?? "—"} (${avis} avis). Nouveau score : ${score}/100 (${pastille ?? "aucune pastille"}).`,
      });
    }

    return erreur("Action inconnue.");
  } catch (e) {
    return erreur(e instanceof Error ? e.message : String(e), 500);
  }
}
