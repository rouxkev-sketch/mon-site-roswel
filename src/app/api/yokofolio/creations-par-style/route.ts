import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { natureConnue } from "@/lib/photos-tatoueur";

/**
 * COMBIEN DE PORTFOLIOS PAR STYLE — le nombre du menu « Explorer »
 * ================================================================
 * (passe nº 216-§2, corrigée par la nº 217-§1)
 *
 * Le menu annonce, en face de chaque style, ce qu'on y trouvera : sept
 * portfolios publiés en flash + aquarelle affichent « 7 » en face
 * d'« Aquarelle ». C'est une promesse tenue d'avance — on ne choisit
 * plus une entrée pour découvrir qu'elle est vide.
 *
 * ⚠️ ON COMPTE LES PORTFOLIOS, PAS LES PHOTOS (nº 217-§1). La nº 216
 * comptait les lignes de `photos_tatoueur` : un seul artiste ayant
 * déposé vingt aquarelles affichait « 20 » — un nombre qui ne répond
 * à AUCUNE question qu'on se pose en ouvrant ce menu. Le menu choisit
 * des artistes à découvrir ; il annonce donc COMBIEN D'ARTISTES
 * répondent, exactement comme la mosaïque qui s'affichera ensuite.
 * Techniquement : on compte des `tatoueur_id` DISTINCTS.
 *
 * ⚠️ ET LE TOTAL D'UNE CATÉGORIE N'EST PAS LA SOMME DE SES STYLES.
 * Un artiste qui publie des flashs en aquarelle ET en chicano compte
 * une fois dans chacun des deux styles, mais il n'est QU'UN portfolio
 * dans « Tous les flashs ». Les deux nombres se comptent donc
 * séparément — d'où `totaux`, à côté de `comptes`.
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
    if (enLigne.size === 0) {
      return NextResponse.json({ comptes: {}, totaux: {} });
    }

    const { data: photos } = await supabase
      .from("photos_tatoueur")
      .select("tatoueur_id, style, nature");

    //  DES ENSEMBLES DE FICHES, PAS DES ADDITIONS : un artiste qui a
    //  déposé vingt aquarelles n'entre qu'une fois dans son ensemble.
    const parStyle = new Map<string, Set<string>>();
    const parCategorie = new Map<string, Set<string>>();
    for (const photo of (photos ?? []) as Array<{
      tatoueur_id: string;
      style: string;
      nature: string | null;
    }>) {
      if (!enLigne.has(photo.tatoueur_id)) continue;
      const nature = natureConnue(photo.nature);
      const cle = `${nature}·${photo.style}`;
      (parStyle.get(cle) ?? parStyle.set(cle, new Set()).get(cle)!).add(
        photo.tatoueur_id
      );
      (
        parCategorie.get(nature) ??
        parCategorie.set(nature, new Set()).get(nature)!
      ).add(photo.tatoueur_id);
    }

    const comptes: Comptes = {};
    for (const [cle, fichesDuStyle] of parStyle) {
      const [nature, style] = cle.split("·");
      (comptes[nature] ??= {})[style] = fichesDuStyle.size;
    }
    const totaux: Record<string, number> = {};
    for (const [nature, fichesDeLaCategorie] of parCategorie) {
      totaux[nature] = fichesDeLaCategorie.size;
    }
    return NextResponse.json({ comptes, totaux });
  } catch {
    return NextResponse.json({ comptes: {}, totaux: {} });
  }
}
