import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import {
  LigneAvisGoogle,
  type ArtisanAvisGoogle,
} from "@/components/LigneAvisGoogle";
import { LogoComplet } from "@/components/Logo";

export const metadata: Metadata = { title: "Avis Google (admin)" };

/**
 * PAGE ADMIN — AVIS GOOGLE (étape 11)
 * -----------------------------------
 * http://localhost:3000/admin/avis-google (développement uniquement).
 * Associer chaque artisan à sa fiche Google, puis rafraîchir la note
 * régulièrement (règle Google : pas de stockage durable). Le score
 * est recalculé à chaque rafraîchissement.
 */
export default async function PageAvisGoogle() {
  if (process.env.NODE_ENV === "production") notFound();

  let artisans: ArtisanAvisGoogle[] = [];
  let probleme: string | null = null;
  try {
    const supabase = creerClientSupabaseAdmin();
    const { data, error } = await supabase
      .from("artisans")
      .select(
        "id, nom_affiche, adresse, place_id_google, note_google, nombre_avis_google, score_total"
      )
      .order("nom_affiche");
    if (error) throw new Error(error.message);
    artisans = (data ?? []) as ArtisanAvisGoogle[];
  } catch (e) {
    probleme = e instanceof Error ? e.message : String(e);
  }

  const cleConfiguree = Boolean(process.env.GOOGLE_PLACES_API_KEY);

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-10">
      <LogoComplet tailleIcone={32} />

      <div className="w-full max-w-[730px] mt-8 flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold">Avis Google</h1>
          <p className="text-encre-douce text-sm mt-1">
            Associe chaque artisan à sa fiche Google, puis rafraîchis la
            note régulièrement — seuls la note et le nombre d&apos;avis
            sont récupérés (jamais le détail), et le score se recalcule
            tout seul.
          </p>
        </div>

        {!cleConfiguree && (
          <p className="rounded-2xl border border-alerte/40 bg-alerte/10 p-4 text-sm">
            ⚠️ Clé Google Places absente : compléter{" "}
            <code className="text-xs">GOOGLE_PLACES_API_KEY</code> dans{" "}
            <code className="text-xs">.env.local</code> (guide :
            docs/ETAPE-11-LANCEMENT.md). Les artisans de démonstration,
            eux, ont déjà des notes fictives.
          </p>
        )}

        {probleme && (
          <p className="rounded-2xl border border-erreur/40 bg-erreur/5 p-4 text-sm">
            ❌ {probleme}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {artisans.map((artisan) => (
            <LigneAvisGoogle key={artisan.id} artisan={artisan} />
          ))}
        </div>
      </div>
    </main>
  );
}
