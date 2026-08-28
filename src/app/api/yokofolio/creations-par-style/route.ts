import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { natureConnue } from "@/lib/photos-tatoueur";
//  §1 (nº 624) — L'ÉCRITURE QUI DIT CE QU'EST UNE CARTE. On compte des
//  clés de carrousel : le chiffre annoncé et le nombre de vignettes
//  sortent désormais de la même fonction.
import { cleDuCarrousel } from "@/lib/carrousels";
//  §1 (nº 694) — la règle « en ligne » du site entier, posée sur une
//  lecture. Une seule écriture (voir sa note dans lib/tatoueurs).
import { listeEnLigne } from "@/lib/tatoueurs";

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
 * à AUCUNE question qu'on se pose en ouvrant ce menu.
 *
 * ██ ⚠️ ET « PORTFOLIO » VEUT DIRE GALERIE DEPUIS LA nº 624 ██
 * CE QUI ÉTAIT ÉCRIT ICI : « le menu annonce COMBIEN D'ARTISTES
 * répondent, exactement comme la mosaïque qui s'affichera ensuite —
 * techniquement, des `tatoueur_id` DISTINCTS ». La seconde moitié de
 * la phrase a cessé d'être vraie à la nº 279, quand la mosaïque est
 * passée aux CARROUSELS : le menu annonçait « 1 » et la recherche
 * montrait deux cartes du même tatoueur (une galerie en couleur, une
 * en noir et gris). ON COMPTE DONC CE QUI S'AFFICHE — des clés de
 * carrousel (`cleDuCarrousel`), l'écriture qui définit une carte.
 * Un artiste ayant deux galeries dans un style y compte pour deux :
 * c'est la conséquence, et elle est voulue.
 *
 * ⚠️ LE TOTAL D'UNE CATÉGORIE EST DÉSORMAIS LA SOMME DE SES STYLES,
 * et il ne l'était pas avant la nº 624 : une galerie appartient à UN
 * seul style, là où un artiste pouvait publier dans deux styles et ne
 * valoir qu'un portfolio dans « Tous les flashs ». `totaux` reste
 * calculé à côté de `comptes` — même passage, même règle : le jour où
 * l'un des deux changera, l'autre suivra sans qu'on l'oublie.
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
    //  §1 (nº 624) — LE SLUG EST LU EN PLUS DE L'IDENTIFIANT : c'est
    //  lui qu'attend `cleDuCarrousel`, l'écriture qui dit ce qu'est une
    //  carte de la mosaïque. Un champ de plus dans un `select` déjà
    //  fait ; aucune lecture ajoutée.
    //  §1 (nº 694) — « en ligne », pas « publiée » : un portfolio en
    //  suppression différée ne doit plus gonfler les nombres du menu.
    const fiches = await listeEnLigne<{ id: string; slug: string }>((verrous) =>
      supabase.from("tatoueurs").select(`id, slug, ${verrous}`)
    );
    const slugParFiche = new Map<string, string>();
    for (const ligne of fiches) {
      slugParFiche.set(ligne.id, ligne.slug);
    }
    if (slugParFiche.size === 0) {
      return NextResponse.json({ comptes: {}, totaux: {} });
    }

    //  §1 (nº 624) — LE RENDU EST LU EN PLUS : il entre dans l'identité
    //  d'une galerie (`cleDEnsemble` : style · catégorie · rendu). Sans
    //  lui, deux galeries d'un même style — une en couleur, une en noir
    //  et gris — se confondraient, et le compte annoncerait une carte
    //  de moins que la mosaïque n'en affiche.
    const { data: photos } = await supabase
      .from("photos_tatoueur")
      .select("tatoueur_id, style, rendu, nature");

    /*  ██ §1 (nº 624) — ON COMPTE DES GALERIES, PLUS DES ARTISTES ██
        ------------------------------------------------------------------
        CE QUI ÉTAIT ÉCRIT, ET LE DÉFAUT QU'IL CAUSAIT : « des ensembles
        de fiches, pas des additions — un artiste qui a déposé vingt
        aquarelles n'entre qu'une fois ». C'était vrai tant qu'une carte
        valait un artiste ; depuis la nº 279, LA MOSAÏQUE AFFICHE DES
        CARROUSELS. Le menu annonçait donc « 1 » là où la recherche
        montrait DEUX cartes du même tatoueur — une galerie en couleur,
        une en noir et gris.
        LA RÈGLE : on compte des CLÉS DE CARROUSEL (`cleDuCarrousel`,
        lib/carrousels), c'est-à-dire exactement ce qui s'affiche. Le
        catalogue d'accueil (lib/catalogue-styles) compte la même chose,
        avec la même écriture : les deux ne peuvent plus diverger.
        ⚠️ TOUJOURS DES ENSEMBLES, JAMAIS DES ADDITIONS : vingt photos
        d'une même galerie ne font qu'une clé, donc une carte.
        ⚠️ LES DEUX CATÉGORIES SUIVENT LA MÊME RÈGLE — réalisations et
        flashs sont comptés ici d'un seul passage, ils ne peuvent pas
        diverger non plus. */
    const parStyle = new Map<string, Set<string>>();
    const parCategorie = new Map<string, Set<string>>();
    for (const photo of (photos ?? []) as Array<{
      tatoueur_id: string;
      style: string;
      rendu: string | null;
      nature: string | null;
    }>) {
      const slug = slugParFiche.get(photo.tatoueur_id);
      if (!slug) continue;
      const nature = natureConnue(photo.nature);
      const galerie = cleDuCarrousel(slug, photo);
      const cle = `${nature}·${photo.style}`;
      (parStyle.get(cle) ?? parStyle.set(cle, new Set()).get(cle)!).add(galerie);
      (
        parCategorie.get(nature) ??
        parCategorie.set(nature, new Set()).get(nature)!
      ).add(galerie);
    }

    const comptes: Comptes = {};
    for (const [cle, galeriesDuStyle] of parStyle) {
      const [nature, style] = cle.split("·");
      (comptes[nature] ??= {})[style] = galeriesDuStyle.size;
    }
    const totaux: Record<string, number> = {};
    for (const [nature, galeriesDeLaCategorie] of parCategorie) {
      totaux[nature] = galeriesDeLaCategorie.size;
    }
    return NextResponse.json({ comptes, totaux });
  } catch {
    return NextResponse.json({ comptes: {}, totaux: {} });
  }
}
