import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";

/**
 * CE QUE J'AI ENREGISTRÉ — la liste des identifiants, rien de plus
 * =================================================================
 * Elle sert à ALLUMER LES CŒURS déjà posés, partout où ils
 * s'affichent : la mosaïque, les fiches, la fenêtre de fiche. Une
 * seule demande par page (voir `chargerLesMiens`).
 *
 * ⚠️ ELLE NE REND QUE DES IDENTIFIANTS. Ni photos, ni noms, ni dates :
 * les boutons n'ont besoin que de savoir « celui-ci est enregistré ».
 * La page Favoris, elle, lit la base côté serveur — avec les images.
 *
 * PAS DE SESSION ? Deux listes vides, et un 200 : un visiteur non
 * connecté n'est pas une erreur, c'est le cas ordinaire du site.
 */
export async function GET() {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ photos: [], tatoueurs: [] });

  const [photos, tatoueurs] = await Promise.all([
    supabase
      .from("favoris_photos")
      .select("photo_id")
      .eq("utilisateur_id", user.id),
    supabase
      .from("tatoueurs_suivis")
      .select("tatoueur_id")
      .eq("utilisateur_id", user.id),
  ]);

  return NextResponse.json({
    photos: (photos.data ?? []).map((ligne) => ligne.photo_id as string),
    tatoueurs: (tatoueurs.data ?? []).map(
      (ligne) => ligne.tatoueur_id as string
    ),
  });
}
