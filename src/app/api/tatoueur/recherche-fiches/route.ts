import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";

/**
 * LA RECHERCHE INTERNE — trouver un salon (ou un artiste) INSCRIT
 * ================================================================
 * C'est la barre posée dans le formulaire, au-dessus du champ
 * d'adresse : « ton salon est déjà sur yokofolio ? cherche-le par son
 * nom ». Elle ne cherche QUE dans les fiches PUBLIÉES — une fiche en
 * brouillon n'existe pas encore pour les autres.
 *
 * TROIS GARDES-FOUS, et ils tiennent en trois lignes :
 *  · il faut être CONNECTÉ (on ne fournit pas d'annuaire ouvert) ;
 *  · deux caractères au moins (sinon la liste n'apprend rien) ;
 *  · dix résultats au plus (une barre de recherche n'est pas une page
 *    de résultats).
 *
 * ON NE REND QUE CE QUI EST DÉJÀ PUBLIC sur la fiche : nom, ville,
 * adresse, coordonnées, photo de profil. Ni courriel, ni téléphone,
 * ni quoi que ce soit qui ne s'affiche pas déjà sur la page.
 */

export const dynamic = "force-dynamic";

const RESULTATS_MAXIMUM = 10;
const SAISIE_MINIMUM = 2;

export async function GET(requete: Request) {
  const parametres = new URL(requete.url).searchParams;
  const saisie = (parametres.get("q") ?? "").trim();
  //  `type` = LA COLONNE `type_fiche` : « artiste » (une personne) ou
  //  « salon » (un LIEU — salon comme studio privé). Toute autre
  //  valeur ne filtre rien.
  const type = parametres.get("type");
  //  ⚠️ `etablissement` = LA NATURE DU LIEU (passe nº 121), la colonne
  //  du même nom : « salon » ou « prive ». Sans elle, « En studio »
  //  proposait des salons et « En salon » des studios privés — les
  //  deux sont des `type_fiche = 'salon'`, et rien ne les distinguait
  //  dans la requête. Absente, les deux natures sont rendues : c'est
  //  ce qu'attendent le guest et « une autre adresse ».
  const etablissement = parametres.get("etablissement");

  if (saisie.length < SAISIE_MINIMUM) {
    return NextResponse.json({ ok: true, fiches: [] });
  }

  try {
    const supabase = await creerClientSupabaseServeur();
    const { data: session } = await supabase.auth.getUser();
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, message: "Connexion requise." },
        { status: 401 }
      );
    }

    let requeteFiches = supabase
      .from("tatoueurs")
      // ON REND AUSSI SES COORDONNÉES : l'artiste qui choisit un salon
      // inscrit n'a plus d'adresse à saisir — c'est celle du salon qui
      // situe son mode, et donc sa fiche. Rien de plus que ce qui est
      // déjà public sur la page du salon.
      .select(
        //  `photo_principale` EN PLUS (passe nº 104) : les fiches
        //  d'avant l'ère du portrait rond n'ont pas de photo de
        //  profil — on replie sur la première photo du portfolio pour
        //  que la liste ne montre jamais une pastille vide.
        "id, nom, slug, ville_nom, photo_profil, photo_principale, type_fiche, " +
          "adresse, code_postal, region, pays, code_pays, latitude, longitude, lieu_id"
      )
      .eq("publie", true)
      .is("supprime_le", null)
      // `ilike` : insensible à la casse, et le nom peut être n'importe
      // où dans l'intitulé (« encre » trouve « Maison Encre Noire »).
      .ilike("nom", `%${saisie}%`)
      .order("nom")
      .limit(RESULTATS_MAXIMUM);

    if (type === "salon" || type === "artiste") {
      requeteFiches = requeteFiches.eq("type_fiche", type);
    }
    //  LA NATURE DU LIEU — elle n'a de sens que sur une fiche de lieu.
    //  (`etablissement` est `not null default 'salon'` depuis la
    //  migration nº 37 : aucune ligne ne peut lui échapper.)
    if (type === "salon" && (etablissement === "salon" || etablissement === "prive")) {
      requeteFiches = requeteFiches.eq("etablissement", etablissement);
    }

    const { data, error } = await requeteFiches;
    if (error) throw new Error(error.message);

    //  LE REPLI SE FAIT ICI, une fois pour tous les écrans : le champ
    //  `photo_profil` rendu porte TOUJOURS la meilleure image connue.
    const fiches = ((data ?? []) as unknown as Array<Record<string, unknown>>).map(
      ({ photo_principale, ...fiche }) => ({
        ...fiche,
        photo_profil: fiche.photo_profil ?? photo_principale ?? null,
      })
    );
    return NextResponse.json({ ok: true, fiches });
  } catch (erreur) {
    // Base injoignable ou colonne absente : une liste vide, jamais une
    // page en erreur — le formulaire reste utilisable à la main.
    console.warn(
      "[recherche-fiches]",
      erreur instanceof Error ? erreur.message : String(erreur)
    );
    return NextResponse.json({ ok: true, fiches: [] });
  }
}
