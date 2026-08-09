import { DELAI_SUPPRESSION_JOURS } from "@/config/tatouage";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * LA SUPPRESSION DE COMPTE, EN TROIS TEMPS
 * =========================================
 * Toute la mécanique vit ICI — les routes ne font que l'appeler, et
 * la règle des 30 jours n'est écrite qu'à un seul endroit.
 *
 * 1. DEMANDE (`demanderSuppression`) — le compte et sa fiche
 *    deviennent INVISIBLES tout de suite. Rien n'est effacé : ni la
 *    fiche, ni les photos, ni le compte de connexion. On pose une
 *    date (`tatoueurs.supprime_le`) et une ligne d'échéance
 *    (`suppressions_comptes`).
 *
 * 2. RETOUR (`reactiverCompte`) — une reconnexion avant l'échéance
 *    annule tout, AUTOMATIQUEMENT : la ligne part, la date repasse à
 *    null, et la fiche revient EXACTEMENT dans l'état où elle était
 *    (publiée ou non, brouillon compris) — puisqu'on n'a touché à
 *    aucun autre champ.
 *
 * 3. PURGE (`purgerComptesEchus`) — à l'échéance seulement, on efface
 *    pour de bon : les photos, puis le compte (la fiche suit en
 *    cascade). Déclenchée par la tâche planifiée
 *    /api/cron/purge-comptes.
 *
 * TOLÉRANT AUX MIGRATIONS : tant que supabase/yokofolio-suppression-
 * differee.sql n'est pas passé, la table n'existe pas — la
 * réactivation se contente alors de ne rien faire (jamais d'échec de
 * connexion pour cette raison), et la demande, elle, le dit
 * clairement.
 */

/** LE DÉLAI DE RÉFLEXION vit dans la CONFIG (config/tatouage.ts) :
    l'écran de confirmation l'annonce, cette mécanique l'applique — le
    même chiffre, forcément. (Ce fichier parle à la clé de service :
    il ne doit JAMAIS être importé par un composant du navigateur.) */
export { DELAI_SUPPRESSION_JOURS };

const BUCKET_PHOTOS = "photos-tatoueurs";

/** Vrai quand l'erreur vient d'une table ou d'une colonne absente. */
function structureAbsente(message: string): boolean {
  const texte = message.toLowerCase();
  return (
    texte.includes("suppressions_comptes") ||
    texte.includes("supprime_le") ||
    texte.includes("does not exist") ||
    texte.includes("schema cache")
  );
}

/** L'échéance d'une demande faite maintenant. */
export function echeanceSuppression(depuis = new Date()): Date {
  const echeance = new Date(depuis);
  echeance.setDate(echeance.getDate() + DELAI_SUPPRESSION_JOURS);
  return echeance;
}

/**
 * TEMPS 1 — la demande. Rend l'échéance retenue.
 * Ne supprime RIEN : c'est tout l'objet de cette refonte.
 */
export async function demanderSuppression(
  utilisateurId: string,
  courriel: string | null
): Promise<{ ok: true; purgeLe: string } | { ok: false; message: string }> {
  const admin = creerClientSupabaseAdmin();
  const purgeLe = echeanceSuppression().toISOString();
  try {
    const { error } = await admin.from("suppressions_comptes").upsert(
      {
        user_id: utilisateurId,
        demandee_le: new Date().toISOString(),
        purge_le: purgeLe,
        courriel,
      },
      { onConflict: "user_id" }
    );
    if (error) throw new Error(error.message);

    // TOUTES LES FICHES DU COMPTE DISPARAISSENT DU PUBLIC — sans
    // changer `publie` : c'est ce qui permet de les rendre plus tard
    // exactement telles qu'elles étaient. Un compte peut en avoir
    // plusieurs : supprimer le compte les emporte toutes.
    const { error: erreurFiche } = await admin
      .from("tatoueurs")
      .update({ supprime_le: new Date().toISOString() })
      .eq("user_id", utilisateurId);
    if (erreurFiche) throw new Error(erreurFiche.message);

    return { ok: true, purgeLe };
  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : String(erreur);
    return {
      ok: false,
      message: structureAbsente(message)
        ? "La base n'est pas prête pour la suppression différée : passer supabase/yokofolio-suppression-differee.sql."
        : message,
    };
  }
}

/**
 * TEMPS 2 — le retour. Vrai SI une suppression était en cours (et
 * vient d'être annulée) ; faux dans tous les autres cas, y compris
 * quand la migration n'est pas passée : se reconnecter ne doit
 * JAMAIS échouer à cause de ceci.
 */
export async function reactiverCompte(utilisateurId: string): Promise<boolean> {
  try {
    const admin = creerClientSupabaseAdmin();
    const { data, error } = await admin
      .from("suppressions_comptes")
      .select("user_id")
      .eq("user_id", utilisateurId)
      .maybeSingle();
    if (error || !data) return false;

    await admin
      .from("suppressions_comptes")
      .delete()
      .eq("user_id", utilisateurId);
    // ON NE RESSUSCITE QUE CE QUE LA SUPPRESSION DU COMPTE AVAIT
    // COUCHÉ. Une fiche supprimée SEULE porte, elle, une échéance
    // propre (`purge_le`) : sa suppression a été demandée à part, et
    // se reconnecter n'a aucune raison de l'annuler.
    await admin
      .from("tatoueurs")
      .update({ supprime_le: null })
      .eq("user_id", utilisateurId)
      .is("purge_le", null);
    return true;
  } catch {
    return false;
  }
}

/** La suppression en cours pour ce compte, s'il y en a une. */
export async function suppressionEnCours(
  utilisateurId: string
): Promise<{ purgeLe: string } | null> {
  try {
    const admin = creerClientSupabaseAdmin();
    const { data } = await admin
      .from("suppressions_comptes")
      .select("purge_le")
      .eq("user_id", utilisateurId)
      .maybeSingle();
    const ligne = data as { purge_le?: string } | null;
    return ligne?.purge_le ? { purgeLe: ligne.purge_le } : null;
  } catch {
    return null;
  }
}

/**
 * LA PURGE DES FICHES SUPPRIMÉES SEULES (le compte, lui, reste).
 * Même mécanique que pour les comptes, à l'échelle d'une fiche : la
 * vue `fiches_a_purger` liste celles dont l'échéance est passée, on
 * efface leurs photos puis la ligne. Rend le nombre de fiches
 * réellement effacées.
 *
 * ⚠️ LES PHOTOS SONT RANGÉES PAR COMPTE, pas par fiche
 * (photos-tatoueurs/<id du compte>/…) : on n'efface donc QUE les
 * fichiers dont le nom porte l'identifiant de la fiche, et on laisse
 * intact le reste du dossier — les autres fiches du même compte y
 * vivent aussi.
 */
export async function purgerFichesEchues(): Promise<{
  effacees: number;
  echecs: Array<{ id: string; raison: string }>;
}> {
  const admin = creerClientSupabaseAdmin();
  const echecs: Array<{ id: string; raison: string }> = [];
  let effacees = 0;

  const { data, error } = await admin
    .from("fiches_a_purger")
    .select("id, user_id");
  if (error || !data) return { effacees: 0, echecs };

  for (const ligne of data as Array<{ id: string; user_id: string | null }>) {
    try {
      if (ligne.user_id) {
        try {
          const { data: fichiers } = await admin.storage
            .from(BUCKET_PHOTOS)
            .list(ligne.user_id);
          const aEffacer = (fichiers ?? [])
            .filter((f) => f.name.includes(ligne.id))
            .map((f) => `${ligne.user_id}/${f.name}`);
          if (aEffacer.length > 0) {
            await admin.storage.from(BUCKET_PHOTOS).remove(aEffacer);
          }
        } catch {
          // Dossier introuvable : la suite reste valable.
        }
      }
      const { error: erreurLigne } = await admin
        .from("tatoueurs")
        .delete()
        .eq("id", ligne.id);
      if (erreurLigne) throw new Error(erreurLigne.message);
      effacees++;
    } catch (erreur) {
      echecs.push({
        id: ligne.id,
        raison: erreur instanceof Error ? erreur.message : String(erreur),
      });
    }
  }
  return { effacees, echecs };
}

/**
 * TEMPS 3 — la purge définitive des comptes dont le délai est écoulé.
 * Rend le nombre de comptes réellement effacés.
 * L'ORDRE COMPTE : les photos d'abord (elles ne sont rattachées à
 * rien une fois le compte parti), puis le compte — la fiche suit en
 * cascade (colonne user_id, `on delete cascade`).
 */
export async function purgerComptesEchus(): Promise<{
  effaces: number;
  echecs: Array<{ user_id: string; raison: string }>;
}> {
  const admin = creerClientSupabaseAdmin();
  const echecs: Array<{ user_id: string; raison: string }> = [];
  let effaces = 0;

  const { data, error } = await admin
    .from("comptes_a_purger")
    .select("user_id");
  if (error || !data) return { effaces: 0, echecs };

  for (const ligne of data as Array<{ user_id: string }>) {
    try {
      // 1. Les photos du compte (un dossier à son nom).
      try {
        const { data: fichiers } = await admin.storage
          .from(BUCKET_PHOTOS)
          .list(ligne.user_id);
        if (fichiers && fichiers.length > 0) {
          await admin.storage
            .from(BUCKET_PHOTOS)
            .remove(fichiers.map((f) => `${ligne.user_id}/${f.name}`));
        }
      } catch {
        // Dossier introuvable : la suite reste valable.
      }

      // 2. Le compte — la fiche suit en cascade.
      const { error: erreurCompte } = await admin.auth.admin.deleteUser(
        ligne.user_id
      );
      if (erreurCompte) throw new Error(erreurCompte.message);

      // 3. La ligne d'échéance n'a plus lieu d'être (la cascade sur
      //    auth.users l'emporte déjà — on s'en assure).
      await admin
        .from("suppressions_comptes")
        .delete()
        .eq("user_id", ligne.user_id);
      effaces++;
    } catch (erreur) {
      echecs.push({
        user_id: ligne.user_id,
        raison: erreur instanceof Error ? erreur.message : String(erreur),
      });
    }
  }
  return { effaces, echecs };
}
