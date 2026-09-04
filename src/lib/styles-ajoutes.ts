import { revalidateTag, unstable_cache } from "next/cache";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import {
  lesStylesAjoutes,
  poserStylesAjoutes,
  type StyleAjoute,
} from "@/config/tatouage";

/**
 * LES STYLES NÉS D'UNE SUGGESTION — le chargement côté SERVEUR
 * ============================================================
 * Le catalogue des trente-huit styles vit dans le code
 * (src/config/tattoo.ts). Ceux que l'administration a acceptés
 * vivent en base (supabase/yokofolio-suggestions-styles.sql). Ce
 * fichier fait le pont : il lit les seconds et les POSE dans le
 * registre du fichier de réglages, d'où tout le site les lit ensuite
 * SANS RIEN SAVOIR de la base.
 *
 * ⚠️ POURQUOI UN CACHE, ET POURQUOI SI COURT ?
 * Cette lecture arrive au début de CHAQUE page de yokofolio. Sans
 * cache, c'est un aller-retour de base par page — pour une liste qui
 * change quelques fois par an. Une minute suffit à effacer ce coût
 * tout en gardant le site vivant : un style accepté apparaît partout
 * en moins d'une minute, sans redémarrer quoi que ce soit.
 *
 * ⚠️ JAMAIS BLOQUANT. Migration pas passée, base injoignable, clé de
 * service absente : on garde le catalogue d'origine et le site marche
 * exactement comme avant. Un style ajouté qui n'apparaît pas est une
 * gêne ; une page blanche, non.
 *
 * ██ nº 808 — LA MINUTE VIT DANS LE CACHE DE DONNÉES DE NEXT, PLUS DANS
 * CE MODULE ██
 * ------------------------------------------------------------------
 * CE QUE LE PROPRIÉTAIRE A VU : un style renommé en base restait en
 * français à l'écran des minutes durant, et « la minute ne se vide
 * pas ». DEUX CAUSES, mesurées au banc (styles-808.mjs, serveur
 * `next start`) :
 *  1. la liste des styles est CUITE dans les pages mises en cache
 *     (cache de route, cinq minutes) — c'est `rafraichirToutLeSite`
 *     (lib/rafraichir) qui les invalide désormais après chaque décision
 *     sur le catalogue ;
 *  2. et la minute d'ici était une MÉMOIRE DE MODULE : chaque paquet
 *     serveur (la route d'admin, la mise en page, le plan du site) en
 *     portait la SIENNE — sur Vercel, chaque fonction aussi. Le
 *     « oublier » appelé par la route d'admin ne touchait donc JAMAIS
 *     la mémoire de la page : une page recuite dans la minute
 *     resservait l'ancienne liste. Vu noir sur blanc dans le journal de
 *     la doublure : après la décision, la page se recuisait SANS relire
 *     `suggestions_style`.
 * LE REMÈDE : la lecture passe par le cache de données de Next
 * (`unstable_cache`, une minute, étiquette « styles-ajoutes »), qui est
 * PARTAGÉ entre les paquets et les fonctions ; « oublier » appelle
 * `revalidateTag` dessus — le prochain rendu, où qu'il tourne, relit la
 * base. Le registre du fichier de réglages reste posé à chaque appel :
 * c'est lui que le reste du site lit, sans rien savoir de tout ceci.
 * (`use cache` remplacera `unstable_cache` un jour : il exige d'opter
 * pour les Cache Components, un chantier à part.)
 */

/** Une minute : voir le commentaire d'en-tête. */
const DUREE_CACHE_MS = 60_000;
/** L'étiquette du cache de données — celle que « oublier » revalide. */
const ETIQUETTE_CACHE = "styles-ajoutes";

/** Le dernier ÉCHEC de lecture : on ne retente pas avant une minute
    (une base injoignable ne doit pas coûter un aller-retour raté par
    page — le cache de données, lui, ne mémorise pas les erreurs). */
let dernierEchec = 0;
let enCours: Promise<void> | null = null;

/** La lecture elle-même, sans cache. */
async function lireEnBase(): Promise<StyleAjoute[]> {
  const admin = creerClientSupabaseAdmin();
  const { data, error } = await admin
    .from("suggestions_style")
    .select("slug, label, famille")
    .eq("etat", "acceptee");
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter(
      (ligne): ligne is { slug: string; label: string; famille: string | null } =>
        typeof ligne?.slug === "string" && typeof ligne?.label === "string"
    )
    .map((ligne) => ({
      slug: ligne.slug,
      label: ligne.label,
      famille: ligne.famille ?? null,
    }));
}

/**
 * REMPLIR LE REGISTRE. À appeler AVANT tout rendu qui affiche des
 * styles — la mise en page du groupe tatouage le fait pour toutes ses
 * pages, le plan du site et les routes concernées pour eux-mêmes.
 * Rend la liste posée, pour la transmettre au navigateur.
 */
/** La lecture, servie par le cache de données de Next : une minute,
    partagée entre tous les paquets et toutes les fonctions (nº 808). */
const lireEnBaseEnCache = unstable_cache(lireEnBase, [ETIQUETTE_CACHE], {
  revalidate: DUREE_CACHE_MS / 1000,
  tags: [ETIQUETTE_CACHE],
});

export async function chargerStylesAjoutes(): Promise<StyleAjoute[]> {
  if (Date.now() - dernierEchec < DUREE_CACHE_MS) {
    return [...lesStylesAjoutes()];
  }
  //  Deux pages rendues en même temps ne déclenchent qu'UNE lecture :
  //  la seconde attend la promesse de la première.
  enCours ??= (async () => {
    try {
      poserStylesAjoutes(await lireEnBaseEnCache());
    } catch (erreur) {
      //  ⚠️ ON NOTE L'ÉCHEC. Sans ça, une base injoignable — ou une
      //  migration nº 52 pas encore passée — ferait retenter à CHAQUE
      //  rendu de page : un aller-retour raté par page, et le site
      //  ralentit au moment précis où il devrait faire comme si de rien
      //  n'était. On garde le catalogue d'origine et on réessaie dans
      //  une minute.
      dernierEchec = Date.now();
      console.warn(
        "[added styles] catalog not reread:",
        erreur instanceof Error ? erreur.message : String(erreur)
      );
    } finally {
      enCours = null;
    }
  })();
  await enCours;
  return [...lesStylesAjoutes()];
}

/** Vider le cache — l'administration vient de décider, la prochaine
    page doit relire sans attendre la minute. nº 808 : c'est le cache
    de données de Next qu'on vide (l'étiquette), pas une mémoire de ce
    module — voir l'en-tête. `{ expire: 0 }` : rien de périmé n'est
    resservi, la prochaine lecture attend la base. */
export function oublierStylesAjoutes(): void {
  dernierEchec = 0;
  try {
    revalidateTag(ETIQUETTE_CACHE, { expire: 0 });
  } catch {
    //  Hors d'un rendu Next (un banc, un script) : rien à invalider.
  }
}
