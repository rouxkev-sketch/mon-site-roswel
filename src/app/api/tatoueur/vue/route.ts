import { NextRequest, NextResponse } from "next/server";
import { creerClientSupabaseAnonyme } from "@/lib/supabase/server";

/**
 * ██ §6 (nº 853) — LE COMPTAGE D'UNE VUE DE PORTFOLIO ██
 * ==================================================================
 * Le navigateur envoie ici le slug d'un portfolio ouvert (une fois par
 * portfolio et par session/heure — le garde-fou vit chez
 * `lib/vue-portfolio`, avec son pourquoi). Cette route ne fait qu'une
 * chose : appeler la FONCTION de la base.
 *
 * ⚠️ UNE FONCTION, ET PAS UN `update` : `compter_vue_portfolio` (SQL
 * nº 852) incrémente la colonne et ne touche à rien d'autre ; elle
 * refuse les fiches dépubliées ou supprimées, et personne ne peut
 * écrire ce nombre à la main. La route n'a donc aucun droit
 * d'administrateur à porter — le client ANONYME suffit, comme pour la
 * lecture des fiches.
 * ⚠️ LA RÉPONSE EST TOUJOURS « ok » : une balise n'attend rien, et un
 * comptage raté ne doit jamais gêner la navigation. Tant que le SQL
 * nº 852 n'est pas passé, la fonction est inconnue et la route répond
 * « ok » sans rien compter — exactement comme la route des clics le
 * fait pour sa migration.
 */
export async function POST(requete: NextRequest) {
  let slug = "";
  try {
    const corps = (await requete.json()) as { slug?: unknown };
    slug = typeof corps.slug === "string" ? corps.slug.trim() : "";
  } catch {
    //  Corps illisible : rien à compter.
  }
  if (!slug || slug.length > 120) return NextResponse.json({ ok: true });
  try {
    const supabase = await creerClientSupabaseAnonyme();
    await supabase.rpc("compter_vue_portfolio", { p_slug: slug });
  } catch {
    //  Base muette, fonction absente : la vue n'est pas comptée, et
    //  c'est tout.
  }
  return NextResponse.json({ ok: true });
}
