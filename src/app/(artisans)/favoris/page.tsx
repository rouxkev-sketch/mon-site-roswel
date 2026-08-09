import type { Metadata } from "next";
import Link from "next/link";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import type { ArtisanResultat } from "@/lib/recherche-artisans";
import { CarteArtisan } from "@/components/CarteArtisan";
import { AuthParticulier } from "@/components/AuthParticulier";
import { OngletsParticulier } from "@/components/OngletsParticulier";

export const metadata: Metadata = { title: "Mes favoris" };

/**
 * MES FAVORIS — onglet 2 de l'espace particulier (§16)
 * ----------------------------------------------------
 * Les artisans enregistrés avec le cœur, pour comparer et
 * recontacter. Mêmes cartes que la recherche.
 */
export default async function PageFavoris() {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex-1 flex flex-col px-5 py-6 max-w-[730px] w-full mx-auto">
        <h1 className="text-xl font-bold mb-4">Mes favoris</h1>
        <p className="text-sm text-encre-douce mb-4">
          Connecte-toi pour retrouver les artisans que tu as enregistrés.
        </p>
        <AuthParticulier suite="/favoris" />
      </main>
    );
  }

  // Les artisans enregistrés (les fiches devenues invisibles sont filtrées)
  const { data } = await supabase
    .from("favoris")
    .select(
      "artisan_id, artisans ( id, slug, nom_affiche, type_compte, nom_societe, nom_responsable, ville_nom, ville_code_postal, photo_url, pastille, cree_le, score_total, note_google, nombre_avis_google, abonnes_instagram, publications_instagram, telephone, telephone_visible, whatsapp, siren_verifie, date_creation_entreprise, horaires, dispo_urgence, dispo_nuit, dispo_weekend, dispo_feries, absence_debut, absence_fin, artisan_metiers ( metier ) )"
    )
    .eq("particulier_id", user.id)
    .order("cree_le", { ascending: false });

  const artisans: ArtisanResultat[] = (data ?? [])
    .map((ligne) => ligne.artisans as unknown as (Record<string, unknown> & {
      artisan_metiers?: Array<{ metier: string }>;
    }) | null)
    .filter((artisan): artisan is NonNullable<typeof artisan> => artisan !== null)
    .map((artisan) => ({
      ...(artisan as unknown as ArtisanResultat),
      metiers: (artisan.artisan_metiers ?? []).map((m) => m.metier),
      distance_km: 0, // sans objet ici (pas de ville de référence)
    }));

  return (
    <main className="flex-1 flex flex-col px-5 py-6 pb-24 max-w-[730px] w-full mx-auto">
      <h1 className="text-xl font-bold mb-4">Mes favoris</h1>

      {artisans.length === 0 ? (
        <div className="rounded-3xl border border-bordure bg-fond-doux p-6 text-center">
          <p className="text-3xl mb-3" aria-hidden>❤️</p>
          <p className="font-semibold">Aucun favori pour le moment</p>
          <p className="text-sm text-encre-douce mt-1">
            Sur la fiche d&apos;un artisan, touche le cœur en haut à
            droite pour l&apos;enregistrer ici.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center mt-4 bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-full px-6 min-h-[44px] text-sm transition-colors"
          >
            Chercher un artisan
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {artisans.map((artisan) => (
            <CarteArtisan
              key={artisan.id}
              artisan={artisan}
              userId={user.id}
              initialFavori
            />
          ))}
        </div>
      )}

      <OngletsParticulier actif="favoris" />
    </main>
  );
}
