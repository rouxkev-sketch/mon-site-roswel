import "server-only";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { typeDeLaFiche, type EtatLigne, type TypeFiche } from "@/lib/demarchage";

/**
 * LIRE UN DÉMARCHAGE PAR SON JETON
 * ==================================
 * Le seul chemin d'entrée de la page /rejoindre. Il sert au rendu de
 * la page ET aux gestes qu'elle permet (rattacher, supprimer,
 * réactiver) : une seule lecture, une seule vérité.
 *
 * ⚠️ IL PASSE PAR LA CLÉ DE SERVICE, ET C'EST OBLIGATOIRE. Les tables
 * du démarchage refusent tout accès public (sécurité par ligne active,
 * aucune politique — migration nº 52) : elles portent les jetons, et
 * un `select` ouvert suffirait à tous les lire, donc à s'approprier ou
 * supprimer n'importe quelle fiche démarchée.
 *
 * ⚠️ LE JETON EST LA SEULE SERRURE, ET C'EST ASSUMÉ. Aucune
 * vérification d'adresse e-mail : le lien arrive dans la messagerie du
 * tatoueur ; si quelqu'un le lui vole, c'est qu'il a accès à ses
 * messages — et il a alors bien pire à faire.
 */

export type FicheDuJeton = {
  id: string;
  nom: string;
  slug: string | null;
  ville: string | null;
  type: TypeFiche;
  photo: string | null;
  /** Retirée du public — le tatoueur l'a supprimée depuis ce lien. */
  retiree: boolean;
  /** À quel compte elle appartient aujourd'hui (null = personne). */
  proprietaire: string | null;
};

export type DemarchageLu = {
  id: string;
  jeton: string;
  etat: EtatLigne;
  rattacheA: string | null;
  fiches: FicheDuJeton[];
};

type LigneEnvoi = {
  id: string;
  jeton: string;
  rattache_le: string | null;
  retire_le: string | null;
  rattache_a: string | null;
};

/** Null quand le jeton n'existe pas — la page répond « introuvable »,
    sans jamais dire s'il a existé : on ne renseigne pas qui cherche. */
export async function lireDemarchageParJeton(
  jeton: string
): Promise<DemarchageLu | null> {
  //  UNE FORME PLAUSIBLE D'ABORD : 43 caractères base64url. Cela évite
  //  d'interroger la base pour chaque adresse fantaisiste essayée.
  if (!/^[A-Za-z0-9_-]{20,120}$/.test(jeton)) return null;

  try {
    const admin = creerClientSupabaseAdmin();
    const envoi = await admin
      .from("demarchages")
      .select("id, jeton, rattache_le, retire_le, rattache_a")
      .eq("jeton", jeton)
      .maybeSingle();
    if (envoi.error || !envoi.data) return null;
    const ligne = envoi.data as unknown as LigneEnvoi;

    const liens = await admin
      .from("demarchage_fiches")
      .select("tatoueur_id")
      .eq("demarchage_id", ligne.id);
    if (liens.error) return null;
    const ids = ((liens.data ?? []) as Array<{ tatoueur_id: string }>).map(
      (l) => l.tatoueur_id
    );
    if (ids.length === 0) return null;

    const fiches = await admin
      .from("tatoueurs")
      .select(
        "id, nom, slug, ville_nom, type_fiche, etablissement, photo_profil, supprime_le, user_id"
      )
      .in("id", ids);
    if (fiches.error) return null;

    const liste: FicheDuJeton[] = (
      (fiches.data ?? []) as unknown as Array<{
        id: string;
        nom: string | null;
        slug: string | null;
        ville_nom: string | null;
        type_fiche: string | null;
        etablissement: string | null;
        photo_profil: string | null;
        supprime_le: string | null;
        user_id: string | null;
      }>
    ).map((f) => ({
      id: f.id,
      nom: f.nom ?? "(sans nom)",
      slug: f.slug,
      ville: f.ville_nom,
      type: typeDeLaFiche(f),
      photo: f.photo_profil,
      retiree: Boolean(f.supprime_le),
      proprietaire: f.user_id,
    }));

    //  L'ÉTAT SE LIT DANS LES DATES, jamais dans la colonne `statut` :
    //  deux façons de dire la même chose, on écoute la plus sûre.
    const etat: EtatLigne = ligne.retire_le
      ? "supprime"
      : ligne.rattache_le
        ? "compte_cree"
        : "envoye";

    return {
      id: ligne.id,
      jeton: ligne.jeton,
      etat,
      rattacheA: ligne.rattache_a,
      fiches: liste,
    };
  } catch {
    return null;
  }
}
