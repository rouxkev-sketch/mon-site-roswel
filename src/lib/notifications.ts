import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
//  §1 (nº 663) — la graphie officielle de la marque, écrite une seule
//  fois (nº 104) : le message de bienvenue la lit, il ne la recopie pas.
import { MARQUE_YOKOFOLIO } from "@/config/tatouage";

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
  | "en_validation"
  /*  ██ §1 (nº 663) — LE MESSAGE DE BIENVENUE ██
      LA PREMIÈRE NOUVELLE DE TOUTE VIE DE COMPTE, et la seule qui ne
      parle ni d'une fiche, ni du catalogue, ni d'une décision
      d'administration : elle accueille. Un compte neuf ouvrait une
      boîte VIDE — « Rien de neuf » sur un écran qu'on découvre.
      ⚠️ ELLE EST UNE NOTIFICATION COMME LES AUTRES, et c'est la
      consigne : une vraie ligne en base, qui RESTE dans la liste, que
      les nouvelles recouvrent (l'ordre est `creee_le` décroissant :
      étant la plus ancienne, elle finit en bas), et qui se marque
      comme lue d'un toucher. Rien de spécial à l'affichage. */
  | "bienvenue"
  /*  ██ §3 (nº 688) — LA DEMANDE DE PORTFOLIO REFUSÉE ██
      Quand l'administration SUPPRIME une demande de mise en ligne
      (nº 675), la personne n'apprenait rien : son portfolio
      disparaissait de son espace sans un mot. La nº 675 l'assumait —
      « prévenir un faux compte n'aurait aucun sens » —, et LE
      PROPRIÉTAIRE TRANCHE AUTREMENT : le cas du faux compte est le
      rare, celui de la demande refusée est le courant, et une
      disparition muette est ce qui inquiète le plus.
      ⚠️ AUCUNE MIGRATION N'EST NÉCESSAIRE : la colonne `genre` est un
      `text` sans contrainte de valeur (voir yokofolio-notifications.sql).
      Une base d'avant cette passe accepte donc la ligne telle quelle.
      ⚠️ ET LA NOUVELLE SURVIT À LA FICHE : `fiche_id` est déclaré
      `on delete set null`, `fiche_nom` garde le nom. C'est ce qui
      permet d'écrire la nouvelle AVANT l'effacement — et il le faut,
      sinon la clé étrangère refuserait une fiche déjà partie. */
  | "demande_refusee";
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
  validee: "Portfolio en ligne",
  modifications: "Modifications demandées",
  hors_ligne: "Portfolio hors ligne",
  suppression_fiche: "Suppression de portfolio programmée",
  suppression_compte: "Suppression du compte programmée",
  annulation: "Suppression annulée",
  style_ajoute: "Style accepté",
  style_refuse: "Style refusé",
  demande_style: "Demande de style",
  en_validation: "Portfolio en cours de validation",
  /*  §1 (nº 663) — LE MOT DU PROPRIÉTAIRE, à la graphie de la marque
      près : « YokoFolio », Y et F majuscules (la règle nº 104, sa
      décision). Il vient de la config, jamais recopié — le jour où la
      marque changerait de nom, cette ligne suivrait. */
  bienvenue: `Bienvenue sur ${MARQUE_YOKOFOLIO.nom} !`,
  //  §3 (nº 688) — le titre du propriétaire, au mot près.
  demande_refusee: "Demande de portfolio refusée",
};

/**
 * ██ §1 (nº 663) — POSER LA BIENVENUE, UNE FOIS PAR COMPTE ██
 * ==================================================================
 * OÙ ELLE EST POSÉE, ET POURQUOI PAS À L'INSCRIPTION. Les trois
 * écrans d'inscription du site appellent `signUp` DEPUIS LE
 * NAVIGATEUR (EcranAuthentification, AuthParticulier, AuthArtisan) :
 * il n'existe aucun passage serveur au moment où le compte naît, et
 * une notification ne s'écrit qu'avec la clé de service (voir l'en-tête
 * de ce fichier). Y greffer un appel voudrait dire trois appels à
 * tenir d'accord, et un compte créé autrement — un jour, par un lien
 * de connexion — n'en aurait aucun.
 * ELLE EST DONC POSÉE À LA PREMIÈRE LECTURE de la boîte de nouvelles,
 * si elle n'y est pas déjà. Pour un compte neuf, c'est le premier
 * instant où quelque chose peut être vu ; pour tous les autres, c'est
 * une ligne de plus, une seule fois.
 * ⚠️ CE QUE ÇA COÛTE, ET JE LE DIS : LES COMPTES DÉJÀ EXISTANTS la
 * reçoivent eux aussi, à leur prochaine ouverture. C'est le prix de ne
 * pas dépendre de l'instant de l'inscription — et c'est aussi ce qui
 * permet au propriétaire de la voir sur son propre compte.
 * ⚠️ LE DOUBLON EST POSSIBLE EN THÉORIE, et je le dis plutôt que de
 * le taire : deux lectures rigoureusement simultanées du même compte
 * verraient toutes deux une boîte sans bienvenue. Il faudrait un index
 * unique en base pour l'exclure — donc une migration à passer. Le cas
 * demande d'ouvrir la même boîte deux fois dans la même poignée de
 * millisecondes ; la ligne en double se marquerait comme lue et
 * s'effacerait de l'attention. On ne paie pas une migration pour ça.
 */
export async function poserLaBienvenue(
  userId: string
): Promise<Notification | null> {
  try {
    const admin = creerClientSupabaseAdmin();
    const { data, error } = await admin
      .from("notifications_compte")
      .insert({
        user_id: userId,
        genre: "bienvenue" as GenreNotification,
        titre: TITRE_NOTIFICATION.bienvenue,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return (data as Notification) ?? null;
  } catch (erreur) {
    //  La même règle que `creerNotification` : jamais bloquant. Une
    //  boîte de nouvelles s'affiche très bien sans son accueil.
    console.warn(
      "[notifications] bienvenue non écrite :",
      erreur instanceof Error ? erreur.message : erreur
    );
    return null;
  }
}

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
