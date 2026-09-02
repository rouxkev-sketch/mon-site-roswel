import {
  DELAI_SUPPRESSION_ADMIN_JOURS,
  DELAI_SUPPRESSION_JOURS,
} from "@/config/tatouage";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
//  §1 (nº 692) — LE MÉNAGE DU STOCKAGE, écrit une seule fois pour les
//  quatre chemins qui en ont besoin (voir lib/photos-stockage).
import {
  direLeMenage,
  nettoyerLeStockageDUnCompte,
  nettoyerLeStockageDUnPortfolio,
} from "@/lib/photos-stockage";

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
export { DELAI_SUPPRESSION_ADMIN_JOURS, DELAI_SUPPRESSION_JOURS };

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

/*  L'échéance d'une demande faite maintenant.
    §1 (nº 696) — LE NOMBRE DE JOURS EST DÉSORMAIS UN ARGUMENT, et
    c'est tout ce qu'il a fallu pour que l'administration ait le sien
    (sept, config/tatouage). Le tatoueur garde ses trente par défaut :
    aucun appel existant ne change. Une seule écriture pour les deux
    délais — deux calculs auraient fini par diverger d'un jour. */
export function echeanceSuppression(
  depuis = new Date(),
  jours = DELAI_SUPPRESSION_JOURS
): Date {
  const echeance = new Date(depuis);
  echeance.setDate(echeance.getDate() + jours);
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
        ? "The database isn't ready for deferred deletion: run supabase/yokofolio-suppression-differee.sql."
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
 * (photos-tatoueurs/<id du compte>/…) : on laisse donc intact le reste
 * du dossier — les autres fiches du même compte y vivent aussi.
 * ⚠️ ET LA PHRASE QUI SUIVAIT ÉTAIT FAUSSE, ELLE A COÛTÉ TOUTES LES
 * PHOTOS (nº 692) : elle disait « on n'efface que les fichiers dont le
 * nom porte l'identifiant de la fiche ». Aucun nom ne le porte — ils
 * s'appellent `<style>-<horodatage>-<rang>.jpg`. Le filtre ne retenait
 * rien, et rien n'était jamais effacé. On efface désormais d'après les
 * ADRESSES QUE LA BASE CONNAÎT (lib/photos-stockage), ce qui donne à la
 * fois le bon périmètre et la bonne garantie.
 */
/**
 * ██ §1 (nº 675) — EFFACER UNE FICHE, ET SES PHOTOS AVEC ██
 * ==================================================================
 * CE QU'ELLE EST : le corps de la boucle de `purgerFichesEchues`,
 * extrait tel quel — pas une ligne de comportement ne change. Elle
 * existe parce qu'un SECOND appelant en a désormais besoin :
 * l'administration, qui peut supprimer une demande de mise en ligne
 * (un faux compte, un portfolio jamais validé — point 6 de la nº 675).
 * L'ÉCRIRE DEUX FOIS AURAIT ÉTÉ LA FAUTE : deux effacements qui
 * divergent, c'est un jour où l'un des deux oublie les photos et
 * laisse des fichiers orphelins dans le stockage pour toujours.
 *
 * ⚠️ LES PHOTOS D'ABORD, LA LIGNE ENSUITE, et l'ordre compte : la ligne
 * porte l'identifiant qui sert à retrouver les fichiers. Effacée
 * d'abord, on ne saurait plus quoi nettoyer.
 * ⚠️ UN DOSSIER DE STOCKAGE INTROUVABLE N'ARRÊTE RIEN : une fiche sans
 * photo est un cas normal. Seule l'erreur sur LA LIGNE est fatale —
 * c'est elle qui dit si la fiche existe encore.
 */
async function effacerUneFiche(
  admin: ReturnType<typeof creerClientSupabaseAdmin>,
  id: string,
  userId: string | null
): Promise<void> {
  /*  ██ §1 (nº 692) — LE MÉNAGE PART DES LIGNES, PLUS DES NOMS ██
      ------------------------------------------------------------------
      CE QUI ÉTAIT ÉCRIT ICI, ET CE QUE ÇA FAISAIT (audit nº 691, R1) :
      on listait le dossier de la personne et l'on gardait les fichiers
      « dont le nom contient l'identifiant du portfolio ». Or un fichier
      s'appelle `<compte>/<style>-<horodatage>-<rang>.jpg` — il ne porte
      JAMAIS cet identifiant. Le filtre ne retenait rien : PAS UNE SEULE
      PHOTO n'a jamais été effacée, ni par la purge des trente jours, ni
      par la suppression de l'administration. Prouvé au banc.
      CE QUI LE REMPLACE : `nettoyerLeStockageDUnPortfolio`, qui efface
      d'après les ADRESSES QUE LA BASE CONNAÎT (lib/photos-stockage).
      ⚠️ IL N'A PLUS BESOIN DE `userId`, et c'est un progrès : les fiches
      de démarchage n'en ont pas, et n'étaient donc même pas candidates
      au ménage. Le paramètre reste — la purge du compte le passe — mais
      la fonction ne s'en sert plus pour trouver les fichiers.
      ⚠️ L'ORDRE EST LE CŒUR : ON LIT AVANT DE SUPPRIMER. Les lignes
      effacées d'abord, plus rien ne dirait quels fichiers sont à elles.
      ⚠️ ET LE MÉNAGE N'EMPÊCHE PAS LA SUPPRESSION : il ne lève jamais
      (voir sa note). Seule l'erreur sur LA LIGNE est fatale — c'est
      elle qui dit si la fiche existe encore. */
  const menage = await nettoyerLeStockageDUnPortfolio(admin, id);
  if (menage.echecs.length > 0) {
    console.warn(
      `[suppression] portfolio ${id} — ${direLeMenage(menage)} :`,
      menage.echecs.slice(0, 5).map((e) => `${e.chemin} (${e.raison})`).join(" · ")
    );
  }
  void userId;
  const { error } = await admin.from("tatoueurs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * §1 (nº 675) — LA MÊME SUPPRESSION, OUVERTE À L'ADMINISTRATION.
 * Elle ne fait RIEN de plus que la purge des trente jours : mêmes
 * photos effacées, même ligne supprimée, même écriture. Ce qui change
 * est QUI la déclenche et QUAND — l'administration, tout de suite,
 * pour une demande qui n'a jamais eu à exister.
 * ⚠️ ELLE NE TOUCHE PAS AU COMPTE DE CONNEXION : supprimer un portfolio
 * n'est pas supprimer quelqu'un. La personne garde son compte, ses
 * favoris et ses suivis — et retrouve son identité de particulier au
 * premier chargement qui suit (la règle de la nº 675, tenue par le
 * rattrapage de MenuEspace).
 */
export async function supprimerLaFicheDefinitivement(
  id: string,
  userId: string | null
): Promise<void> {
  await effacerUneFiche(creerClientSupabaseAdmin(), id, userId);
}

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
      await effacerUneFiche(admin, ligne.id, ligne.user_id);
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
      /*  1. LES PHOTOS DU COMPTE — tout son dossier.
          §1 (nº 692) — DEUX CHOSES CHANGENT ICI, ET UNE SEULE NE
          CHANGE PAS :
           · LA PAGINATION (audit nº 691, R4). `list()` était appelé
             sans options : le client Supabase plafonne à CENT, et un
             compte à plus de cent fichiers en gardait la queue pour
             toujours. `listerToutLeDossier` pagine, et descend dans
             les sous-dossiers.
           · LE MÉNAGE NE LÈVE PLUS, il rend un compte rendu — un
             fichier récalcitrant ne doit pas empêcher quelqu'un de
             partir.
          ⚠️ CE QUI NE CHANGE PAS, ET C'EST VOULU : ICI, ON BALAIE LE
          DOSSIER. La règle « n'efface que ce que les lignes nomment »
          vaut pour la suppression d'UN portfolio ; ici le COMPTE
          ENTIER s'en va, le dossier porte son identifiant, tout ce
          qu'il contient est à lui, et plus personne n'en veut rien.
          C'est aussi la seule occasion de ramasser les orphelins des
          fuites d'avant cette passe. */
      const menage = await nettoyerLeStockageDUnCompte(admin, ligne.user_id);
      if (menage.echecs.length > 0) {
        console.warn(
          `[purge] compte ${ligne.user_id} — ${direLeMenage(menage)}`
        );
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
