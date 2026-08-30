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
  /*  nº 750 — L'ACCUSÉ DE RÉCEPTION D'UNE DEMANDE DE CONVENTION,
      exactement au même titre que `demande_style` ci-dessus et pour la
      même raison : la demande entre en file, la réponse viendra plus
      tard, et rien ne doit arriver de nulle part.
      ⚠️ AUCUNE MIGRATION, pour la raison du §3 nº 688 : `genre` est un
      `text` sans contrainte de valeur (yokofolio-notifications.sql). */
  | "demande_convention"
  /*  ██ nº 756 — LA RÉPONSE À UNE DEMANDE DE CONVENTION ██
      LES JUMEAUX DE `style_ajoute` / `style_refuse`, et le décalque
      est voulu de bout en bout : une demande de convention suit le
      chemin d'une demande de style — accusé de réception à l'envoi
      (`demande_convention`, nº 750), puis la décision de
      l'administration ici. Le message qu'elle ajoute, s'il y en a un,
      voyage dans `detail`, séparé par une ligne vide — la même
      convention d'écriture que les styles, lue par `messageAdmin`.
      ⚠️ AUCUNE MIGRATION, pour la raison du §3 nº 688 : `genre` est un
      `text` sans contrainte de valeur. */
  | "convention_ajoutee"
  | "convention_refusee"
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
  | "demande_refusee"
  /*  ██ §1 (nº 696) — LES DEUX NOUVELLES DE LA SUPPRESSION ADMIN ██
      LA nº 688 N'EN PRÉVOYAIT QU'UNE, et elle ne convenait qu'à un
      cas : « Demande de portfolio refusée » parle d'une demande QUI
      N'A JAMAIS ÉTÉ VALIDÉE. Dire cela à quelqu'un dont le portfolio
      était EN LIGNE depuis des mois serait faux — sa demande, elle,
      avait bien été retenue. Deux situations, deux phrases :
       · `portfolio_retire`  — il était en ligne, l'administration l'a
         retiré. Les mots sont ceux du propriétaire, au mot près ;
       · `portfolio_retabli` — l'administration s'est ravisée dans les
         sept jours. Elle ne RETIRE PAS la nouvelle précédente (une
         parole du site ne s'efface pas : la personne l'a peut-être
         déjà lue, et la faire disparaître serait pire que la laisser),
         elle en pose une seconde qui dit le contraire — coche verte.
      ⚠️ AUCUNE MIGRATION, pour la raison du §3 nº 688 : `genre` est un
      `text` sans contrainte de valeur. */
  | "portfolio_retire"
  | "portfolio_retabli";
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
  //  nº 750 — le titre suit celui des styles, au mot près.
  demande_convention: "Demande de convention",
  //  nº 756 — et les deux réponses aussi : « Style accepté » /
  //  « Style refusé » dictent la forme, rien n'est inventé.
  convention_ajoutee: "Convention acceptée",
  convention_refusee: "Convention refusée",
  en_validation: "Portfolio en cours de validation",
  /*  §1 (nº 663) — LE MOT DU PROPRIÉTAIRE, à la graphie de la marque
      près : « YokoFolio », Y et F majuscules (la règle nº 104, sa
      décision). Il vient de la config, jamais recopié — le jour où la
      marque changerait de nom, cette ligne suivrait. */
  bienvenue: `Bienvenue sur ${MARQUE_YOKOFOLIO.nom} !`,
  //  §3 (nº 688) — le titre du propriétaire, au mot près.
  demande_refusee: "Demande de portfolio refusée",
  //  §1 (nº 696) — les deux titres du propriétaire, au mot près. Le
  //  CORPS des deux phrases, lui, se dérive du genre au moment de
  //  l'affichage (FenetreNotifications) : c'est ce qui fait qu'une
  //  ligne écrite aujourd'hui restera lisible si la phrase change.
  portfolio_retire: "Portfolio retiré",
  portfolio_retabli: "Portfolio rétabli",
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
 *
 * ██ §1 (nº 695) — LA GARDE EST UNE LECTURE QUI VISE ██
 * ==================================================================
 * CE QUE L'AUDIT nº 691 A TROUVÉ (R6, orange) : « si elle n'y est pas
 * déjà » se lisait dans LES 50 DERNIÈRES nouvelles, la liste que la
 * route venait de charger. Or la bienvenue est, par construction, LA
 * PLUS ANCIENNE du compte. Passé cinquante nouvelles elle sort de la
 * fenêtre — la garde ne la voit plus, et en repose une.
 * ⚠️ LE RYTHME EXACT, MESURÉ AU BANC, ET IL N'EST PAS CELUI QU'ON
 * CROIT : PAS une par lecture. Le doublon qui vient d'être posé est la
 * ligne la plus RÉCENTE ; il tombe donc dans la fenêtre et la garde le
 * voit — jusqu'à ce que cinquante nouvelles l'en chassent à son tour.
 * La croissance est donc d'UNE BIENVENUE PAR CINQUANTE NOUVELLES, sans
 * fin. Le banc de la passe le montre ligne à ligne : 60 nouvelles et
 * dix ouvertures d'affilée n'en ajoutent qu'une ; cinq ouvertures
 * espacées de cinquante nouvelles en ajoutent cinq.
 * C'EST DONC LE COMPTE LE PLUS ACTIF QUI PAIE LE PLUS — celui du
 * propriétaire, qui reçoit sans cesse. La nº 693 en a montré l'effet
 * sans le nommer : sa route des nouvelles était la plus lente du site.
 *
 * LA GARDE NE REGARDE PLUS UNE FENÊTRE, ELLE VISE LA LIGNE : `genre =
 * bienvenue` pour ce compte-ci, la plus ancienne d'abord. Deux lignes
 * demandées, pas une, et c'est tout le §2 ci-dessous.
 * ⚠️ CE QUE ÇA COÛTE, ET JE LE DIS AUSSI : une lecture de plus à chaque
 * ouverture, là où la fenêtre servait de test gratuit. Elle porte sur
 * l'index `(user_id, creee_le desc)` qui existe déjà (migration nº 25)
 * et rend deux lignes minuscules. En face, on retire une ÉCRITURE par
 * ouverture sur les comptes chargés. Le change est bon.
 * ⚠️ ET LE DOUBLON SIMULTANÉ RESTE POSSIBLE, comme avant : deux
 * lectures à la même milliseconde verraient toutes deux une base sans
 * bienvenue. Il faudrait un index unique — donc une migration. Mais il
 * n'a plus d'importance : le §2 ramasse le doublon à la lecture
 * suivante, ce qui n'existait pas avant cette passe.
 *
 * ██ §2 (nº 695) — LES DOUBLONS DÉJÀ EN BASE SONT RETIRÉS AU PASSAGE ██
 * ==================================================================
 * Les comptes touchés en ont déjà un paquet — celui du propriétaire au
 * premier chef, qui ouvre sa boîte plus que quiconque. Corriger la
 * garde ne les efface pas : elle empêche seulement les suivants.
 * LE CHOIX : le ménage se fait ICI, au passage, plutôt que par un SQL
 * à coller dans la console. Trois raisons, dans cet ordre :
 *  · il n'y a rien à lancer, rien à ne pas oublier — un compte se
 *    répare tout seul la première fois qu'il ouvre sa boîte ;
 *  · il ne coûte RIEN en régime normal : la lecture ci-dessus est déjà
 *    faite, et l'effacement ne part que si elle rend DEUX lignes ;
 *  · il vaut pour les comptes qu'on ne connaît pas — je n'ai aucune
 *    liste des comptes touchés.
 * (Le SQL équivalent est joint tout de même, pour les comptes qui ne
 *  se reconnecteront jamais : supabase/yokofolio-bienvenue-unique.sql.)
 * ⚠️ DEUX LIGNES DEMANDÉES, ET PAS UNE : `limit 1` suffirait à
 * répondre « existe-t-elle ? », mais ne dirait pas « y en a-t-il en
 * trop ? ». La deuxième ligne est ce qui rend le ménage gratuit.
 * ⚠️ ON GARDE LA PLUS ANCIENNE — la vraie, celle du jour du compte —
 * et l'ordre croissant la met en tête. Un seul effacement suffit quel
 * que soit le nombre de doublons : il vise « toutes sauf elle ».
 * ⚠️ LES TROIS VERROUS DE CET EFFACEMENT SONT ÉCRITS EXPRÈS. La clé de
 * service passe outre la politique de sécurité : rien ne borne la
 * requête à sa place. Le compte, le genre, et l'identifiant à épargner
 * — les trois, ou l'on n'efface pas.
 */
export async function poserLaBienvenue(
  userId: string
): Promise<Notification | null> {
  try {
    const admin = creerClientSupabaseAdmin();
    const { data, error } = await admin
      .from("notifications_compte")
      .select("id")
      .eq("user_id", userId)
      .eq("genre", "bienvenue" as GenreNotification)
      .order("creee_le", { ascending: true })
      .limit(2);
    if (error) throw new Error(error.message);
    const dejaLa = (Array.isArray(data) ? data : []) as Array<{ id?: string }>;

    //  AUCUNE : c'est le seul cas où l'on écrit.
    if (dejaLa.length === 0) {
      const { data: posee, error: erreurPose } = await admin
        .from("notifications_compte")
        .insert({
          user_id: userId,
          genre: "bienvenue" as GenreNotification,
          titre: TITRE_NOTIFICATION.bienvenue,
        })
        .select()
        .single();
      if (erreurPose) throw new Error(erreurPose.message);
      return (posee as Notification) ?? null;
    }

    //  DEUX : le compte traîne des doublons de l'ancienne garde.
    const plusAncienne = dejaLa[0]?.id;
    if (dejaLa.length > 1 && typeof plusAncienne === "string" && plusAncienne) {
      const { error: erreurMenage } = await admin
        .from("notifications_compte")
        .delete()
        .eq("user_id", userId)
        .eq("genre", "bienvenue" as GenreNotification)
        .neq("id", plusAncienne);
      if (erreurMenage) throw new Error(erreurMenage.message);
    }
    //  ELLE EXISTE DÉJÀ : rien à rendre. Si elle est hors des cinquante
    //  dernières, elle n'apparaît pas — et c'est juste : elle est la
    //  plus ancienne d'un compte qui en a soixante.
    return null;
  } catch (erreur) {
    //  La même règle que `creerNotification` : jamais bloquant. Une
    //  boîte de nouvelles s'affiche très bien sans son accueil — et un
    //  ménage qui ne passe pas aujourd'hui repassera demain.
    console.warn(
      "[notifications] bienvenue :",
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
    /*  ██ §2 (nº 696) — L'ÉCRITURE A LE MÊME REPLI QUE LA LECTURE ██
        ------------------------------------------------------------
        L'ASYMÉTRIE QU'ON CORRIGE : la route qui LIT la boîte demande
        `liaison_id`, et RELIT SANS ELLE si la colonne manque (elle
        n'arrive qu'avec la migration nº 26). L'écriture, elle, la
        nommait toujours — et une base à qui il manque cette migration
        REJETTE ALORS LA LIGNE ENTIÈRE. Le `catch` du dessous avalait
        le refus, la fonction rendait `false`, et personne ne
        l'apprenait : la nouvelle n'existait pas, en silence.
        ⚠️ CE N'EST PAS LA CAUSE PROUVÉE du relevé du propriétaire — le
        banc, lui, écrit et rend la nouvelle de bout en bout (voir le
        compte rendu de la passe). C'est un CHEMIN D'ÉCHEC MUET, réel,
        que la lecture évitait déjà et que l'écriture ignorait. On le
        ferme, et l'appelant apprend désormais ce qui s'est passé. */
    const colonnes: Record<string, unknown> = {
      user_id: entree.userId,
      fiche_id: entree.ficheId ?? null,
      fiche_nom: entree.ficheNom ?? null,
      genre: entree.genre,
      titre: TITRE_NOTIFICATION[entree.genre],
      detail: entree.detail ?? null,
      motifs: entree.motifs?.length ? entree.motifs : null,
    };
    let { error } = await admin
      .from("notifications_compte")
      .insert({ ...colonnes, liaison_id: entree.liaisonId ?? null });
    //  SANS `liaison_id` : la ligne vaut mieux que rien. On ne perd que
    //  le bouton d'une demande de rattachement — et il n'y en a plus
    //  (les trois genres de liaison ont disparu, voir plus haut).
    if (error) ({ error } = await admin.from("notifications_compte").insert(colonnes));
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
