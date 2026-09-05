import type { MetadataRoute } from "next";
import { adresseDuSite } from "@/lib/email";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { estEnLigne, styleConnu } from "@/lib/tatoueurs";
//  §1 (nº 873) — les trois pages d'un portfolio, leur chemin écrit une
//  seule fois.
import { cheminDeFiche } from "@/lib/lien-interne";
import { chargerStylesAjoutes } from "@/lib/styles-ajoutes";
//  nº 811/814 — les adresses des pages éditoriales, écrites une fois.
import {
  CHEMIN_ABOUT,
  CHEMIN_CONTACT,
  CHEMIN_LEGAL,
  CHEMIN_TERMS,
} from "@/lib/chemins-editoriaux";

// Le plan du site est reconstruit au plus une fois par jour
export const revalidate = 86400;

/**
 * PLAN DU SITE (sitemap.xml) — celui de YOKOFOLIO, et de lui seul
 * ================================================================
 * ⚠️ IL A ÉTÉ NETTOYÉ. Il annonçait aussi les adresses des AUTRES
 * produits du dossier (/agence, /artisans, /devenir-artisan, les
 * fiches d'artisans, les pages métier + ville) : le plan de yokofolio
 * parlait donc surtout d'autre chose que de yokofolio. Ces produits
 * ONT ÉTÉ SUPPRIMÉS à la passe nº 760 — leurs adresses rendent
 * désormais la page introuvable du site. Ce plan-ci n'a pas bougé
 * pour autant : il ne les déclarait déjà plus.
 *
 * CE QU'IL LISTE, ET RIEN D'AUTRE :
 *  - l'accueil, « Qui sommes-nous », « Contact », les mentions légales ;
 *  - les fiches /artist/nom des tatoueurs PUBLIÉS — et, depuis la
 *    nº 873-§1, leurs deux autres pages, /artist/nom/portfolio et
 *    /artist/nom/flash : trois adresses, trois titres, trois canoniques ;
 *  - les pages /tattoo/style/ville qui EXISTENT vraiment (au moins
 *    un tatoueur — jamais de page vide dans un plan de site).
 *
 * CE QU'IL N'ANNONCE JAMAIS :
 *  - les fiches de DÉMONSTRATION : elles n'existent pas ;
 *  - les fiches NON PUBLIÉES, supprimées, hors ligne ou refusées :
 *    c'est `estEnLigne` qui tranche, et elle seule ;
 *  - les espaces privés (compte, admin) : voir robots.ts.
 *
 * ⚠️⚠️ CE QU'IL N'EXCLUT PLUS, ET QU'IL NE FAUT PAS REMETTRE
 * (passes nº 178 et 275). Ces lignes annonçaient jusqu'ici que « les
 * fiches d'essai des administrateurs sont retirées à la source ».
 * C'ÉTAIT VRAI, ET C'ÉTAIT LE DÉFAUT : le propriétaire du site est le
 * SEUL compte administrateur, donc cette règle retirait SES fiches —
 * toutes — du plan du site. Résultat, en juillet : elles n'entraient
 * dans aucun index, et le site était introuvable sur Google. La
 * nº 178 a supprimé le masquage ici comme dans la mosaïque et sur la
 * page de fiche ; la nº 275 l'a retiré de la base elle-même
 * (migration yokofolio-recherche-sans-masquage.sql).
 * IL N'Y A PLUS QU'UNE RÈGLE DE VISIBILITÉ, celle de la base
 * (`fiche_en_ligne`, nº 60), recopiée une seule fois côté site dans
 * `estEnLigne`. Une fiche qu'on ne veut pas voir se cache en ne la
 * publiant pas — jamais par le compte auquel elle appartient.
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
      url: `${base}${CHEMIN_ABOUT}`,
      lastModified: aujourdhui,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${base}${CHEMIN_CONTACT}`,
      lastModified: aujourdhui,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${base}${CHEMIN_LEGAL}`,
      lastModified: aujourdhui,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    //  nº 814 — les conditions d'utilisation, même régime que /legal.
    {
      url: `${base}${CHEMIN_TERMS}`,
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
        url: `${base}${cheminDeFiche(fiche.slug)}`,
        lastModified: fiche.date ?? aujourdhui,
        changeFrequency: "weekly",
        priority: 0.8,
      });
      //  §1 (nº 873) — LE PORTFOLIO ET LES FLASHS, un cran sous le
      //  profil : ce sont ses pages, pas des doublons — chacune a son
      //  contenu propre. La page Flash existe même sans flash (§2 :
      //  l'onglet est toujours là) ; elle dit alors « No flash yet. ».
      for (const vue of ["portfolio", "flash"] as const) {
        pages.push({
          url: `${base}${cheminDeFiche(fiche.slug, vue)}`,
          lastModified: fiche.date ?? aujourdhui,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
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
        url: `${base}/tattoo/${style}/${ville}`,
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
 * n'a que faire.
 * ⚠️ AUCUNE FICHE N'EST RETIRÉE POUR SON PROPRIÉTAIRE (nº 178, voir la
 * note de tête) : `estEnLigne` décide seule, comme partout ailleurs.
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
    //  ⚠️ LA RÈGLE DE LA BASE, ET RIEN QU'ELLE (passe nº 178). Le plan
    //  du site retirait EN PLUS les fiches des comptes
    //  administrateurs : celles du propriétaire n'entraient donc
    //  jamais dans Google. Il applique désormais `estEnLigne`, comme
    //  la mosaïque et la page de fiche.
    //  ⚠️ `hors_ligne` et `statut` PEUVENT MANQUER sur une base à qui
    //  il manque une migration : on redemande alors sans elles, et
    //  `estEnLigne` se contente de ce qu'elle a.
    const COLONNES = "slug, ville_slug, styles, cree_le, decide_le, supprime_le, publie";
    const lire = (colonnes: string) =>
      supabase
        .from("tatoueurs")
        .select(colonnes)
        .eq("publie", true)
        .is("supprime_le", null);
    let { data, error } = await lire(`${COLONNES}, hors_ligne, statut`);
    if (error) ({ data, error } = await lire(COLONNES));
    if (error) return fiches;
    for (const ligne of (data ?? []) as unknown as Array<{
      slug: string | null;
      ville_slug: string | null;
      styles: string[] | null;
      cree_le: string | null;
      decide_le: string | null;
      publie?: boolean | null;
      supprime_le?: string | null;
      hors_ligne?: boolean | null;
      statut?: string | null;
    }>) {
      if (!ligne.slug || !ligne.ville_slug) continue;
      //  La même règle que partout ailleurs — celle de la base.
      if (!estEnLigne(ligne)) continue;
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
