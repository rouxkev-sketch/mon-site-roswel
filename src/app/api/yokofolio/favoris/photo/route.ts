import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";

/**
 * ENREGISTRER (OU RETIRER) UNE PHOTO — le cœur
 * =============================================
 * Un seul point d'entrée pour les deux sens : `actif` dit lequel.
 * C'est ce que fait le bouton — il bascule — et une route qui parle le
 * même langage que le geste évite les désaccords entre les deux.
 *
 * ⚠️ AUCUNE VÉRIFICATION D'IDENTITÉ N'EST FAITE ICI À LA MAIN, et
 * c'est voulu : la sécurité vit dans la BASE (politiques RLS de la
 * migration nº 53). Le client serveur porte la session de la personne ;
 * PostgreSQL refuse tout ce qui ne lui appartient pas. Écrire une
 * deuxième garde ici, c'est se donner deux vérités à tenir d'accord.
 * On vérifie tout de même qu'il y a UNE session — pour répondre 401
 * proprement au lieu de laisser la base répondre une erreur obscure.
 */
export async function POST(requete: Request) {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, raison: "connexion" }, { status: 401 });
  }

  const corps = (await requete.json().catch(() => null)) as {
    id?: string;
    /** LA GALERIE AFFICHÉE (nº 208-§6) — toucher le cœur d'une photo
        enregistre tout ce qu'on regarde : le style, la catégorie et le
        rendu courants. Une photo seule (`id`) reste acceptée : c'est
        ce qu'envoient les cartes de la mosaïque. */
    ids?: string[];
    actif?: boolean;
  } | null;
  //  Une photo ou une galerie : la même porte. La liste est bornée —
  //  une galerie de dépôt fait vingt photos, au-delà c'est une requête
  //  fabriquée à la main.
  const photoIds = [
    ...new Set(
      (Array.isArray(corps?.ids) ? corps.ids : [corps?.id ?? ""])
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean)
    ),
  ].slice(0, 80);
  if (photoIds.length === 0) {
    return NextResponse.json({ ok: false, raison: "photo" }, { status: 400 });
  }

  if (corps?.actif) {
    //  `upsert` et non `insert` : réenregistrer une photo déjà
    //  enregistrée ne doit pas être une erreur (double clic, deux
    //  onglets). La clé composite de la table rend le geste sûr.
    const { error } = await supabase
      .from("favoris_photos")
      .upsert(
        photoIds.map((photoId) => ({
          utilisateur_id: user.id,
          photo_id: photoId,
        })),
        { onConflict: "utilisateur_id,photo_id" }
      );
    if (error) {
      return NextResponse.json({ ok: false, raison: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from("favoris_photos")
      .delete()
      .eq("utilisateur_id", user.id)
      .in("photo_id", photoIds);
    if (error) {
      return NextResponse.json({ ok: false, raison: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
