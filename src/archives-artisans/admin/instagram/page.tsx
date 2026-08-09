import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FRAICHEUR_INSTAGRAM_JOURS } from "@/config/roswel";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import {
  LigneInstagram,
  type ArtisanInstagram,
} from "@/components/LigneInstagram";
import { LogoComplet } from "@/components/Logo";

export const metadata: Metadata = { title: "Saisie Instagram (admin)" };

/** "2026-06-01T…" → nombre de jours écoulés (null si pas de date) */
function joursEcoulesDepuis(dateIso: string | null): number | null {
  if (!dateIso) return null;
  return Math.floor((Date.now() - new Date(dateIso).getTime()) / 86400000);
}

/**
 * PAGE ADMIN — SAISIE MANUELLE DES DONNÉES INSTAGRAM (étape 8b)
 * -------------------------------------------------------------
 * http://localhost:3000/admin/instagram (développement uniquement).
 * Les données jamais renseignées ou trop vieilles remontent en
 * premier. Chaque enregistrement recalcule le score automatiquement.
 */
export default async function PageInstagram() {
  if (process.env.NODE_ENV === "production") notFound();

  let artisans: ArtisanInstagram[] = [];
  let probleme: string | null = null;

  try {
    const supabase = creerClientSupabaseAdmin();
    const { data, error } = await supabase
      .from("artisans")
      .select(
        "id, nom_affiche, lien_instagram, abonnes_instagram, publications_instagram, date_maj_instagram, score_total, pastille, statut_validation"
      )
      .order("date_maj_instagram", { ascending: true, nullsFirst: true });
    if (error) throw new Error(error.message);

    // On transforme la date en « il y a X jours » (plus simple à afficher)
    artisans = (data ?? []).map((ligne) => ({
      ...ligne,
      joursDepuisMaj: joursEcoulesDepuis(ligne.date_maj_instagram),
    })) as ArtisanInstagram[];
  } catch (e) {
    probleme = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-10">
      <LogoComplet tailleIcone={32} />

      <div className="w-full max-w-[730px] mt-8 flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold">Saisie Instagram</h1>
          <p className="text-encre-douce text-sm mt-1">
            Relève les abonnés et publications sur le compte de chaque
            artisan, puis enregistre : le score se recalcule tout seul.
            Alerte au-delà de {FRAICHEUR_INSTAGRAM_JOURS} jours sans mise
            à jour (réglable dans la config). Les plus urgents sont en
            haut de liste.
          </p>
        </div>

        {probleme && (
          <p className="rounded-2xl border border-erreur/40 bg-erreur/5 p-4 text-sm">
            ❌ {probleme}
          </p>
        )}

        {!probleme && artisans.length === 0 && (
          <p className="text-sm text-encre-douce">Aucun artisan en base.</p>
        )}

        <div className="flex flex-col gap-3">
          {artisans.map((artisan) => (
            <LigneInstagram key={artisan.id} artisan={artisan} />
          ))}
        </div>
      </div>
    </main>
  );
}
