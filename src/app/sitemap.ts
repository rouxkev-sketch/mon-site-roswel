import type { MetadataRoute } from "next";
import { adresseDuSite } from "@/lib/email";
import { identifiantsAdmin } from "@/lib/fiches-admin";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { styleConnu } from "@/lib/tatoueurs";
import { chargerStylesAjoutes } from "@/lib/styles-ajoutes";

// Le plan du site est reconstruit au plus une fois par jour
export const revalidate = 86400;

/**
 * PLAN DU SITE (sitemap.xml) — celui de YOKOFOLIO, et de lui seul
 * ================================================================
 * ⚠️ IL A ÉTÉ NETTOYÉ. Il annonçait aussi les adresses des AUTRES
 * produits du dossier (/agence, /artisans, /devenir-artisan, les
 * fiches d'artisans, les pages métier + ville) : le plan de yokofolio
 * parlait donc surtout d'autre chose que de yokofolio. Ces produits
 * restent en ligne à leurs adresses ; ils ne sont simplement plus
 * déclarés ici.
 *
 * CE QU'IL LISTE, ET RIEN D'AUTRE :
 *  - l'accueil, « Qui sommes-nous », « Contact », les mentions légales ;
 *  - les fiches /tatoueur/nom des tatoueurs PUBLIÉS ;
 *  - les pages /tatouage/style/ville qui EXISTENT vraiment (au moins
 *    un tatoueur — jamais de page vide dans un plan de site).
 *
 * CE QU'IL N'ANNONCE JAMAIS :
 *  - les fiches de DÉMONSTRATION : elles n'existent pas ;
 *  - les fiches d'ESSAI DES ADMINISTRATEURS : elles sont retirées à la
 *    source, par la lecture elle-même (voir lib/fiches-admin) — ce
 *    plan hérite donc de la règle sans avoir à la répéter ;
 *  - les espaces privés (compte, admin) : voir robots.ts.
 *
 * LA DATE DE DERNIÈRE MODIFICATION accompagne chaque entrée quand elle
 * est connue : `decide_le` (la dernière décision de modération, donc
 * la dernière fois que la version publique a bougé), sinon `cree_le`.
 * Les pages fixes portent la date de construction du plan.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = adresseDuSite();
  const aujourdhui = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: base, lastModified: aujourdhui, changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/qui-sommes-nous`,
      lastModified: aujourdhui,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${base}/contact`,
      lastModified: aujourdhui,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${base}/mentions-legales`,
      lastModified: aujourdhui,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // ----- LES FICHES ET LES PAGES STYLE + VILLE -----
  // Lues à part, et sans jamais faire échouer le reste : une table
  // absente ne doit pas priver le site de son plan.
  try {
    // ⚠️ LE PLAN DU SITE NE LIT PLUS LES FICHES ENTIÈRES (passe
    // « performance »). Il n'a besoin que de six colonnes : le slug,
    // la ville, les styles et deux dates. Charger le catalogue COMPLET
    // — photos comprises — pour n'écrire que des adresses était le
    // gâchis le plus silencieux du site : personne ne le voit, et il
    // se paie à chaque passage de robot.
    //  ⚠️ LE CATALOGUE D'ABORD (passe nº 122) : `styleConnu` juste en
    //  dessous filtre les couples style + ville. Sans cette lecture, un
    //  style né d'une suggestion acceptée serait tenu pour inconnu et
    //  ses pages n'entreraient jamais dans le plan du site.
    await chargerStylesAjoutes();
    const fiches = await fichesPourLePlan();
    for (const fiche of fiches) {
      pages.push({
        url: `${base}/tatoueur/${fiche.slug}`,
        lastModified: fiche.date ?? aujourdhui,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    // LES COUPLES STYLE + VILLE QUI EXISTENT VRAIMENT — jamais de page
    // vide envoyée aux moteurs de recherche.
    const couples = new Set<string>();
    for (const fiche of fiches) {
      for (const style of fiche.styles) {
        if (styleConnu(style)) couples.add(`${style}|${fiche.ville_slug}`);
      }
    }
    for (const couple of couples) {
      const [style, ville] = couple.split("|");
      pages.push({
        url: `${base}/tatouage/${style}/${ville}`,
        lastModified: aujourdhui,
        changeFrequency: "daily",
        priority: 0.9,
      });
    }
  } catch {
    // Base injoignable : le plan garde ses pages fixes.
  }

  return pages;
}

/**
 * LA DATE DE DERNIÈRE MODIFICATION DE CHAQUE FICHE PUBLIÉE.
 * Une lecture légère (quatre colonnes), à part de la lecture des
 * fiches : celle-ci n'a pas à porter des colonnes dont l'affichage
 * n'a que faire. Les fiches des administrateurs en sont retirées,
 * comme partout ailleurs.
 * Table ou colonne absente : une carte vide, et le plan se rabat sur
 * la date du jour — jamais d'échec.
 */
async function fichesPourLePlan(): Promise<
  Array<{ slug: string; ville_slug: string; styles: string[]; date: Date | null }>
> {
  const fiches: Array<{
    slug: string;
    ville_slug: string;
    styles: string[];
    date: Date | null;
  }> = [];
  try {
    const supabase = await creerClientSupabaseServeur();
    const masques = new Set(await identifiantsAdmin());
    //  ⚠️ `admin_publique` PEUT NE PAS EXISTER — la migration nº 43
    //  n'est peut-être pas passée. Le site doit continuer de servir son
    //  plan sans elle : on redemande alors sans la colonne, et le
    //  masquage reprend sa forme d'avant (toute fiche d'admin dehors).
    const COLONNES = "slug, ville_slug, styles, cree_le, decide_le, user_id, supprime_le";
    const lire = (colonnes: string) =>
      supabase
        .from("tatoueurs")
        .select(colonnes)
        .eq("publie", true)
        .is("supprime_le", null);
    let { data, error } = await lire(`${COLONNES}, admin_publique`);
    if (error) ({ data, error } = await lire(COLONNES));
    if (error) return fiches;
    for (const ligne of (data ?? []) as unknown as Array<{
      slug: string | null;
      ville_slug: string | null;
      styles: string[] | null;
      cree_le: string | null;
      decide_le: string | null;
      user_id: string | null;
      admin_publique?: boolean | null;
    }>) {
      if (!ligne.slug || !ligne.ville_slug) continue;
      // FICHE D'ESSAI D'UN ADMINISTRATEUR : hors du plan du site, donc
      // hors de Google — SAUF si l'interrupteur de la migration nº 43
      // est allumé, auquel cas elle devient une page comme une autre.
      if (
        ligne.user_id &&
        masques.has(ligne.user_id) &&
        ligne.admin_publique !== true
      ) {
        continue;
      }
      const quand = ligne.decide_le ?? ligne.cree_le;
      fiches.push({
        slug: ligne.slug,
        ville_slug: ligne.ville_slug,
        styles: ligne.styles ?? [],
        date: quand ? new Date(quand) : null,
      });
    }
  } catch {
    // Base injoignable : le plan garde ses pages fixes.
  }
  return fiches;
}
