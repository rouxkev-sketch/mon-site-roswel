import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * LES NOTIFICATIONS DU COMPTE — écrites par le SERVEUR seul
 * ==========================================================
 * Une notification est une PAROLE DU SITE : « ta fiche est en ligne »,
 * « des modifications sont demandées », « ta fiche a été retirée »,
 * « la suppression est programmée », « la suppression est annulée ».
 * Personne ne s'en écrit à soi-même — la table n'a aucune politique
 * d'écriture, seule la clé de service passe (voir
 * supabase/yokofolio-notifications.sql).
 *
 * CHAQUE NOTIFICATION NOMME SA FICHE. Un compte peut en gérer
 * plusieurs : « une modification a été refusée » ne veut plus rien
 * dire sans dire LAQUELLE. Le nom est recopié EN DUR au moment de
 * l'écriture, pour que la nouvelle reste lisible même après la
 * disparition de la fiche dont elle parle.
 *
 * JAMAIS BLOQUANT : si la table n'existe pas encore (migration nº 25
 * non passée) ou si l'écriture échoue, on n'interrompt RIEN — une
 * décision d'administration ne doit pas échouer parce qu'une
 * notification n'a pas pu être posée. L'échec est simplement noté
 * dans le journal du serveur.
 */

/** Ce qui provoque une notification. */
export type GenreNotification =
  | "validee"
  | "modifications"
  | "hors_ligne"
  | "suppression_fiche"
  | "suppression_compte"
  | "annulation"
  //  ⚠️ LES DEUX GENRES DE LA PASSE Nº 122 — la réponse à une
  //  SUGGESTION DE STYLE. Ils ne parlent d'aucune fiche en
  //  particulier (`fiche_id` et `fiche_nom` restent nuls quand la
  //  demande n'est partie d'aucun brouillon nommé) : ce sont les
  //  premières nouvelles du site qui concernent le CATALOGUE, pas un
  //  portfolio. Le message de l'administration, quand il y en a un,
  //  voyage dans `detail`.
  | "style_ajoute"
  | "style_refuse"
  //  ⚠️ LES DEUX GENRES DE LA PASSE Nº 132 :
  //  · `demande_style` — l'ACCUSÉ DE RÉCEPTION d'une suggestion : posé
  //    par la route de dépôt, au moment où la demande entre en file ;
  //  · `en_validation` — « ta fiche est en cours de vérification ».
  //    AUCUNE ROUTE NE L'ÉCRIT ENCORE : l'envoi d'une fiche se fait
  //    par le navigateur, sans passage serveur où poser la nouvelle.
  //    Le genre existe pour que le CATALOGUE d'affichage soit complet
  //    (textes du brief nº 132) le jour où un point d'écriture naîtra.
  | "demande_style"
  | "en_validation";
/*  ⚠️ LES TROIS GENRES DE RATTACHEMENT ONT DISPARU (passe C) :
    « liaison », « liaison_validee », « liaison_refusee ». Un
    rattachement est désormais IMMÉDIAT — il n'y a plus rien à
    demander, donc plus rien à annoncer ni à valider. C'était la seule
    nouvelle qui portait des boutons.
    Ce qui RESTE relève de l'administration ou du compte : validation
    d'une fiche, demande de modifications, mise hors ligne, suppression
    d'une fiche ou d'un compte, annulation. Aucune de ces décisions
    n'a d'autre canal — c'est ce qui justifie de garder la boîte. */

export type Notification = {
  id: string;
  fiche_id: string | null;
  fiche_nom: string | null;
  genre: GenreNotification;
  titre: string;
  detail: string | null;
  motifs: string[] | null;
  /** La demande de rattachement à laquelle on peut répondre depuis la
      nouvelle (genre « liaison »). Null partout ailleurs. */
  liaison_id?: string | null;
  /** ⚠️ CES DEUX-LÀ NE SONT PAS EN BASE : la route de lecture les
      RELIT dans `liaisons_artiste_salon` au moment de servir la liste
      (voir /api/tatoueur/notifications). Deux raisons, et la seconde
      compte plus que la première :
       · `origine` change les mots des boutons — un salon qui INVITE
         ne demande pas la même chose qu'un artiste qui SE DÉCLARE ;
       · `statut` dit si la demande a DÉJÀ reçu sa réponse ailleurs
         (un autre appareil, une autre session). Sans lui, on
         proposerait de répondre à une question déjà tranchée.
      Recopier ces deux valeurs en base les aurait figées au jour de
      l'écriture ; les relire, c'est toujours dire le vrai. */
  liaison_origine?: "artiste" | "salon" | null;
  liaison_statut?: "demande" | "validee" | "refusee" | null;
  creee_le: string;
  lue_le: string | null;
};

/** Le titre standard de chaque genre — un seul endroit, pour que le
    vocabulaire du site reste le même partout. */
export const TITRE_NOTIFICATION: Record<GenreNotification, string> = {
  //  ⚠️ LES TITRES DU BRIEF Nº 132, au mot près — ils s'écrivent en
  //  base pour les nouvelles lignes ; l'affichage, lui, dérive du
  //  GENRE (voir FenetreNotifications) pour que les anciennes lignes
  //  parlent aussi la nouvelle langue.
  validee: "Fiche en ligne",
  modifications: "Modifications demandées",
  hors_ligne: "Fiche hors ligne",
  suppression_fiche: "Suppression de portfolio programmée",
  suppression_compte: "Suppression du compte programmée",
  annulation: "Suppression annulée",
  style_ajoute: "Style accepté",
  style_refuse: "Style refusé",
  demande_style: "Demande de style",
  en_validation: "Fiche en cours de validation",
};

/**
 * POSER UNE NOTIFICATION. Rend `true` si elle a bien été écrite —
 * mais l'appelant n'a aucune raison d'en dépendre.
 */
export async function creerNotification(entree: {
  userId: string | null | undefined;
  ficheId?: string | null;
  ficheNom?: string | null;
  genre: GenreNotification;
  detail?: string | null;
  motifs?: string[] | null;
  liaisonId?: string | null;
}): Promise<boolean> {
  if (!entree.userId) return false;
  try {
    const admin = creerClientSupabaseAdmin();
    const { error } = await admin.from("notifications_compte").insert({
      user_id: entree.userId,
      fiche_id: entree.ficheId ?? null,
      fiche_nom: entree.ficheNom ?? null,
      genre: entree.genre,
      titre: TITRE_NOTIFICATION[entree.genre],
      detail: entree.detail ?? null,
      motifs: entree.motifs?.length ? entree.motifs : null,
      liaison_id: entree.liaisonId ?? null,
    });
    if (error) throw new Error(error.message);
    return true;
  } catch (erreur) {
    console.warn(
      "[notifications] non écrite :",
      erreur instanceof Error ? erreur.message : String(erreur)
    );
    return false;
  }
}

/**
 * LE PROPRIÉTAIRE ET LE NOM D'UNE FICHE — ce qu'il faut savoir pour
 * lui adresser une notification. Rend null si la fiche n'existe pas
 * (ou n'appartient à personne : les fiches de démonstration).
 */
export async function proprietaireDeLaFiche(
  ficheId: string
): Promise<{ userId: string; nom: string } | null> {
  try {
    const admin = creerClientSupabaseAdmin();
    const { data } = await admin
      .from("tatoueurs")
      .select("user_id, nom")
      .eq("id", ficheId)
      .maybeSingle();
    const ligne = data as { user_id?: string | null; nom?: string } | null;
    if (!ligne?.user_id) return null;
    return { userId: ligne.user_id, nom: ligne.nom ?? "Ton portfolio" };
  } catch {
    return null;
  }
}
