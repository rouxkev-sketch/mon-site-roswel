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
 * (src/config/tatouage.ts). Ceux que l'administration a acceptés
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
 */

/** Une minute : voir le commentaire d'en-tête. */
const DUREE_CACHE_MS = 60_000;

let derniereLecture = 0;
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
export async function chargerStylesAjoutes(): Promise<StyleAjoute[]> {
  const maintenant = Date.now();
  if (maintenant - derniereLecture < DUREE_CACHE_MS) {
    return [...lesStylesAjoutes()];
  }
  //  Deux pages rendues en même temps ne déclenchent qu'UNE lecture :
  //  la seconde attend la promesse de la première.
  enCours ??= (async () => {
    try {
      poserStylesAjoutes(await lireEnBase());
      derniereLecture = Date.now();
    } catch (erreur) {
      //  ⚠️ ON NOTE L'ÉCHEC COMME UNE LECTURE. Sans ça, une base
      //  injoignable — ou une migration nº 52 pas encore passée —
      //  ferait retenter à CHAQUE rendu de page : un aller-retour raté
      //  par page, et le site ralentit au moment précis où il devrait
      //  faire comme si de rien n'était. On garde le catalogue
      //  d'origine et on réessaie dans une minute.
      derniereLecture = Date.now();
      console.warn(
        "[styles ajoutés] catalogue non relu :",
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
    page doit relire sans attendre la minute. */
export function oublierStylesAjoutes(): void {
  derniereLecture = 0;
}
