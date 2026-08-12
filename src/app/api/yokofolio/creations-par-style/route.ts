import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { natureConnue } from "@/lib/photos-tatoueur";

/**
 * COMBIEN DE CRÉATIONS PAR STYLE — le nombre du menu « Explorer »
 * ================================================================
 * (passe nº 216-§2)
 *
 * Le menu annonce, en face de chaque style, ce qu'on y trouvera : trois
 * créations abstraites en flash affichent « 3 » en face d'« Abstrait ».
 * C'est une promesse tenue d'avance — on ne choisit plus une entrée
 * pour découvrir qu'elle est vide.
 *
 * CE QU'ON COMPTE : les PHOTOS PUBLIÉES, par style et par catégorie.
 * Une photo dont la fiche est retirée du site ne compte pas — elle ne
 * s'affichera pas non plus.
 *
 * ⚠️ UNE SEULE LECTURE POUR LES DEUX CATÉGORIES. On pourrait demander
 * « les flashs » puis « les réalisations » ; on rapporte les deux d'un
 * coup, et le navigateur trie. C'est une réponse de quelques centaines
 * d'octets, la même pour tout le monde : elle se met en cache.
 *
 * ⚠️ JAMAIS BLOQUANT : base injoignable, migration absente, table
 * vide — on répond un objet vide, et le menu s'affiche sans nombres,
 * exactement comme avant cette passe.
 */
export const revalidate = 300;

type Comptes = Record<string, Record<string, number>>;

export async function GET() {
  try {
    const supabase = await creerClientSupabaseServeur();

    //  LES FICHES EN LIGNE — « en ligne », c'est `publie = true`
    //  (migration nº 60), et rien d'autre.
    const { data: fiches } = await supabase
      .from("tatoueurs")
      .select("id")
      .eq("publie", true);
    const enLigne = new Set((fiches ?? []).map((f) => f.id as string));
    if (enLigne.size === 0) return NextResponse.json({ comptes: {} });

    const { data: photos } = await supabase
      .from("photos_tatoueur")
      .select("tatoueur_id, style, nature");

    const comptes: Comptes = {};
    for (const photo of (photos ?? []) as Array<{
      tatoueur_id: string;
      style: string;
      nature: string | null;
    }>) {
      if (!enLigne.has(photo.tatoueur_id)) continue;
      const nature = natureConnue(photo.nature);
      const parStyle = (comptes[nature] ??= {});
      parStyle[photo.style] = (parStyle[photo.style] ?? 0) + 1;
    }
    return NextResponse.json({ comptes });
  } catch {
    return NextResponse.json({ comptes: {} });
  }
}
