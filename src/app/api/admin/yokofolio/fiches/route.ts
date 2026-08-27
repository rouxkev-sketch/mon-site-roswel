import { NextRequest, NextResponse } from "next/server";
import { verifierAdmin } from "@/lib/admin-yokofolio";
import { identifiantsAdmin } from "@/lib/fiches-admin";
import { rafraichirPagesPubliques } from "@/lib/rafraichir";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
//  §1 (nº 675) — l'effacement d'une fiche, écrit une seule fois (le
//  corps de la purge des trente jours). Voir lib/suppression-compte.
import { supprimerLaFicheDefinitivement } from "@/lib/suppression-compte";
import {
  creerNotification,
  proprietaireDeLaFiche,
} from "@/lib/notifications";

/**
 * ADMIN YOKOFOLIO — LES FICHES À VALIDER
 * ---------------------------------------
 * GET  : tout ce qui ATTEND une décision, par ordre d'arrivée :
 *         - les fiches pas encore publiées (créations) ;
 *         - les fiches EN LIGNE dont le tatoueur a modifié le contenu
 *           (le `brouillon`) — l'écran montre alors la VERSION
 *           MODIFIÉE, fusionnée, avec `modification: true`.
 * POST : la décision — { id, action: "valider" | "modifier" |
 *        "hors_ligne", motifs?: string[], note?: string }.
 *        « valider » publie : s'il y a un brouillon, il REMPLACE la
 *        version publique, puis il est vidé ; la notification
 *        « fiche validée » est armée (validation_a_notifier) — et la
 *        mise hors ligne éventuelle est levée.
 *        « modifier » enregistre les motifs cochés et rend la main au
 *        tatoueur (statut « modifications ») — une fiche DÉJÀ EN LIGNE
 *        le RESTE, telle quelle : le refus ne dépublie jamais.
 *        « hors_ligne » DÉPUBLIE la fiche (elle disparaît de la
 *        recherche et des pages publiques — le compte, lui, reste
 *        actif : le tatoueur garde son espace pour corriger), avec
 *        les mêmes motifs cochés que le refus.
 * Accès : administrateurs uniquement (vérifié CÔTÉ SERVEUR).
 */

/**
 * LES CHAMPS QUI ONT CHANGÉ — le brouillon comparé à la version en
 * ligne (passe nº 152).
 * ⚠️ ON COMPARE CE QUI SE VOIT, pas la mécanique : `slug`, `publie`,
 * `statut`, les dates et les décisions de modération ne sont pas du
 * contenu à relire. Un champ absent du brouillon n'a pas changé (le
 * formulaire n'envoie que ce qu'il gère).
 * La comparaison est FAITE SUR LE TEXTE (`JSON.stringify`) : elle
 * traite les tableaux (styles, filtres) et les objets
 * (`photos_styles`) sans code particulier, et l'ordre y compte — deux
 * styles réordonnés SONT une modification à relire.
 */
const CHAMPS_LISIBLES: Array<[string, string]> = [
  ["nom", "Nom"],
  ["bio", "Bio"],
  ["styles", "Styles"],
  ["ville_nom", "Ville"],
  ["adresse", "Adresse"],
  ["code_postal", "Code postal"],
  ["photo_profil", "Photo de profil"],
  ["photo_principale", "Photo principale"],
  ["photos_styles", "Photos"],
  ["lien_instagram", "Instagram"],
  ["lien_tiktok", "TikTok"],
  ["site_web", "Site web"],
  ["site_web_titre", "Titre du site"],
  ["page_de_liens", "Second lien"],
  ["page_de_liens_titre", "Titre du second lien"],
  ["filtres_technique", "Technique"],
  ["filtres_composition", "Composition"],
  ["filtres_besoins", "Besoins"],
  ["type_fiche", "Type de fiche"],
  ["etablissement", "Établissement"],
];

function champsModifies(
  ligne: Record<string, unknown>,
  brouillon: Record<string, unknown> | null
): string[] {
  if (!brouillon) return [];
  const memeChose = (a: unknown, b: unknown) =>
    JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  return CHAMPS_LISIBLES.filter(
    ([cle]) => cle in brouillon && !memeChose(brouillon[cle], ligne[cle])
  ).map(([, libelle]) => libelle);
}

export async function GET() {
  const refus = await verifierAdmin();
  if (refus) {
    return NextResponse.json(
      { ok: false, message: refus.message },
      { status: refus.statut }
    );
  }

  try {
    const admin = creerClientSupabaseAdmin();
    // Tout ce qui attend une décision : statut « en_attente » (création
    // comme modification d'une fiche en ligne), plus les fiches d'avant
    // la colonne statut (publie=false, statut null).
    let reponse = await admin
      .from("tatoueurs")
      .select("*")
      .or("statut.eq.en_attente,and(publie.eq.false,statut.is.null)")
      .order("cree_le", { ascending: true });
    if (reponse.error) {
      // Base d'avant les migrations : les fiches non publiées, sans tri.
      reponse = await admin.from("tatoueurs").select("*").eq("publie", false);
    }
    if (reponse.error) throw new Error(reponse.error.message);

    /**
     * ██ §1 (nº 285) — LES FICHES DONT SEULES LES PHOTOS ATTENDENT ██
     * ==================================================================
     * Depuis la nº 285, une fiche en ligne ne retourne PLUS dans la
     * file quand on la modifie : tout part en ligne (règle 2), et LES
     * PHOTOS NEUVES SEULES attendent, ligne par ligne
     * (`photos_tatoueur.en_attente`). Leur fiche n'a donc ni brouillon,
     * ni statut « en_attente » — et sans ce qui suit, elle
     * n'apparaîtrait NULLE PART : les photos attendraient pour
     * toujours, exactement le défaut que la nº 152 avait corrigé pour
     * les brouillons.
     * ⚠️ ON NE TOUCHE PAS À SON STATUT POUR AUTANT (règle 6) : la fiche
     * reste en ligne, telle qu'elle était. C'est la FILE qui va la
     * chercher, pas la fiche qui vient s'y mettre.
     * ⚠️ SANS LA MIGRATION Nº 70, la colonne n'existe pas : la lecture
     * échoue, on l'ignore, et l'écran est celui d'avant cette passe.
     */
    const photosEnAttenteParFiche = new Map<string, number>();
    const attentes = await admin
      .from("photos_tatoueur")
      .select("tatoueur_id")
      .eq("en_attente", true);
    if (!attentes.error) {
      for (const ligne of (attentes.data ?? []) as Array<{
        tatoueur_id: string;
      }>) {
        photosEnAttenteParFiche.set(
          ligne.tatoueur_id,
          (photosEnAttenteParFiche.get(ligne.tatoueur_id) ?? 0) + 1
        );
      }
    }
    //  Les fiches concernées qui ne sont pas déjà dans la file.
    const dejaListees = new Set(
      ((reponse.data ?? []) as Array<Record<string, unknown>>).map((l) =>
        String(l.id)
      )
    );
    const manquantes = [...photosEnAttenteParFiche.keys()].filter(
      (id) => !dejaListees.has(id)
    );
    if (manquantes.length > 0) {
      const complement = await admin
        .from("tatoueurs")
        .select("*")
        .in("id", manquantes);
      if (!complement.error) {
        reponse = {
          ...reponse,
          data: [
            ...((reponse.data ?? []) as Array<Record<string, unknown>>),
            ...((complement.data ?? []) as Array<Record<string, unknown>>),
          ],
        } as typeof reponse;
      }
    }

    //  ⚠️ LES CRÉATIONS DE L'ADMINISTRATEUR NE SONT PAS RELUES (passe
    //  nº 135). Elles suivaient le même parcours de modération que
    //  celles des vrais tatoueurs : il relisait ce qu'il venait
    //  d'écrire, et une fiche préparée pour un démarchage restait
    //  invisible tant qu'il n'avait pas cliqué « Valider » dans son
    //  propre écran. Elles se mettent en ligne d'un interrupteur, dans
    //  le tableau de démarchage.
    //
    //  ⚠️ MAIS SES MODIFICATIONS, SI (passe nº 152) — ET C'EST LE
    //  DÉFAUT QUE CETTE PASSE CORRIGE. Modifier une fiche DÉJÀ EN LIGNE
    //  écrit les changements dans un `brouillon` et repasse la fiche en
    //  « en_attente » : c'est vrai pour TOUT LE MONDE, l'administrateur
    //  compris (voir FormulaireFiche, cas B). Sa fiche entrait donc dans
    //  une file d'attente… dont ce filtre l'excluait. Plus aucun écran
    //  ne pouvait approuver le changement : la modification restait
    //  invisible POUR TOUJOURS — un style ajouté qui n'apparaissait ni
    //  dans la recherche ni sur la fiche.
    //  LA RÈGLE EST DONC : une fiche d'administrateur n'est écartée QUE
    //  SI ELLE N'A RIEN EN ATTENTE. Dès qu'elle porte un brouillon,
    //  elle prend sa place dans la file, comme les autres — et
    //  l'interrupteur du démarchage, lui, continue de piloter sa mise
    //  en ligne (il ne touche plus au statut tant qu'une modification
    //  attend : voir demarchage/fiche/route.ts).
    //
    //  ⚠️⚠️ ET SES CRÉATIONS AUSSI, DEPUIS LA PASSE Nº 272 — C'EST LE
    //  DÉFAUT DU RELEVÉ. Le propriétaire du site EST l'administrateur
    //  (COURRIELS_ADMIN) : sa création NORMALE — le formulaire,
    //  « Envoyer mon portfolio pour vérification », statut
    //  « en_attente », publie=false — tombait dans l'exclusion de la
    //  nº 135 (pensée pour les fiches de démarchage) et n'apparaissait
    //  DANS AUCUN ÉCRAN de validation : elle ne pouvait jamais être
    //  mise en ligne par ce chemin. Le tableau de démarchage la
    //  listait bien (il liste TOUTES les fiches des comptes admins),
    //  mais comme une ligne « à envoyer », sans rien dire qu'elle
    //  attendait une décision.
    //  LA RÈGLE COMPLÈTE : une fiche d'un compte administrateur est
    //  écartée SEULEMENT quand rien n'attend — ni brouillon (nº 152),
    //  ni CRÉATION jamais publiée. Une fiche déjà passée par
    //  l'interrupteur du démarchage (`admin_publique` posé) reste
    //  pilotée par lui, comme avant : elle n'entre pas dans la file.
    //  Les fiches préparées POUR un démarchage apparaissent désormais
    //  ici AUSSI, marquées `fiche_admin` (l'écran les annonce) : les
    //  voir en trop est un moindre mal — une création invisible ne
    //  l'est pas.
    //  ⚠️ RIEN NE CHANGE POUR LES VRAIS TATOUEURS : on écarte des
    //  PROPRIÉTAIRES, pas des fiches. Le jour où une adresse quitte
    //  COURRIELS_ADMIN, ses fiches reviennent ici d'elles-mêmes.
    const comptesAdmin = await identifiantsAdmin();
    const enAttente = ((reponse.data ?? []) as Array<Record<string, unknown>>)
      .filter((ligne) => {
        const proprietaire = ligne.user_id as string | null;
        if (!proprietaire || !comptesAdmin.includes(proprietaire)) return true;
        if (ligne.brouillon != null) return true;
        //  §1 (nº 285) — MÊME RAISON QUE LE BROUILLON : des photos qui
        //  attendent sont une décision à prendre, fût-ce sur une fiche
        //  d'administrateur.
        if (photosEnAttenteParFiche.has(String(ligne.id))) return true;
        //  LA CRÉATION D'UN ADMINISTRATEUR : jamais publiée, jamais
        //  passée par l'interrupteur — elle attend une décision, elle
        //  est montrée. (`admin_publique` absent d'une base pas
        //  encore migrée se lit comme « jamais posé » : on montre.)
        return ligne.publie !== true && ligne.admin_publique !== true;
      });

    // LE COMPTE PROPRIÉTAIRE, fiche par fiche : un compte peut en
    // avoir plusieurs, et l'admin doit voir laquelle vient de qui.
    // On lit les adresses en UNE fois, puis on les rattache.
    const comptes = new Map<string, string>();
    const identifiants = [
      ...new Set(
        enAttente
          .map((l) => l.user_id as string | null)
          .filter((v): v is string => Boolean(v))
      ),
    ];
    for (const identifiant of identifiants) {
      try {
        const { data } = await admin.auth.admin.getUserById(identifiant);
        if (data?.user?.email) comptes.set(identifiant, data.user.email);
      } catch {
        // Compte illisible : la fiche reste affichée, sans son adresse.
      }
    }

    // La version que l'admin doit VOIR : la ligne, recouverte de son
    // brouillon s'il existe (c'est LUI qui attend la validation).
    const fiches = enAttente.map(
      (ligne: Record<string, unknown>) => {
        const brouillon = ligne.brouillon as Record<string, unknown> | null;
        const proprietaire = ligne.user_id as string | null;
        return {
          ...ligne,
          ...(brouillon ?? {}),
          id: ligne.id,
          slug: ligne.slug,
          brouillon: undefined,
          modification: Boolean(brouillon),
          //  CE QUI A CHANGÉ (passe nº 152) — les champs dont le
          //  brouillon diffère de la version en ligne, nommés en
          //  français. « Vérifier » ne veut pas dire « tout relire » :
          //  sur une modification, seul ce qui bouge demande un avis.
          champs_modifies: champsModifies(ligne, brouillon),
          //  UNE FICHE D'ADMINISTRATEUR SE DIT (passe nº 152) : elle
          //  n'est ici que parce qu'elle a une modification en attente,
          //  et l'écran doit pouvoir l'annoncer.
          fiche_admin: Boolean(
            proprietaire && comptesAdmin.includes(proprietaire)
          ),
          //  §1 (nº 285) — COMBIEN DE PHOTOS ATTENDENT. L'écran peut
          //  ainsi dire « seules des photos attendent » : la fiche,
          //  elle, est en ligne et n'a rien à faire relire.
          photos_en_attente:
            photosEnAttenteParFiche.get(String(ligne.id)) ?? 0,
          compte: proprietaire ? (comptes.get(proprietaire) ?? null) : null,
        };
      }
    );
    return NextResponse.json({ ok: true, fiches });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: `Lecture impossible : ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    );
  }
}

export async function POST(requete: NextRequest) {
  const refus = await verifierAdmin();
  if (refus) {
    return NextResponse.json(
      { ok: false, message: refus.message },
      { status: refus.statut }
    );
  }

  const corps = (await requete.json().catch(() => null)) as {
    id?: string;
    action?: string;
    motifs?: string[];
    note?: string;
  } | null;
  const id = corps?.id ?? "";
  const action = corps?.action ?? "";
  const motifs = (corps?.motifs ?? []).slice(0, 10);
  const note = (corps?.note ?? "").trim().slice(0, 600);

  if (!id || !["valider", "modifier", "hors_ligne", "supprimer"].includes(action)) {
    return NextResponse.json(
      { ok: false, message: "Demande incomplète." },
      { status: 400 }
    );
  }
  if (["modifier", "hors_ligne"].includes(action) && motifs.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Coche au moins un motif." },
      { status: 400 }
    );
  }

  try {
    const admin = creerClientSupabaseAdmin();

    /*  ██ §1 (nº 675) — SUPPRIMER UNE DEMANDE DE MISE EN LIGNE ██
        ==============================================================
        CE QUE C'EST, ET POURQUOI ELLE SORT DU LOT. Les trois décisions
        du dessous MODIFIENT une fiche : elles la publient, la renvoient
        en correction, ou la retirent — la ligne reste, le tatoueur la
        garde. Celle-ci l'EFFACE, elle, et ses photos avec. Elle est
        faite pour ce que le propriétaire nomme : un FAUX COMPTE, un
        portfolio qui n'aurait jamais dû être déposé.
        ELLE SORT DONC AVANT le reste de la fonction, sans passer par la
        mise à jour ni par la notification : il n'y a plus de ligne à
        notifier, et prévenir un faux compte n'aurait aucun sens.
        ⚠️ AUCUN DÉLAI, ET C'EST LA DEMANDE : « cette suppression ramène
        IMMÉDIATEMENT la photo et le nom du particulier ». Les trente
        jours de la suppression ordinaire protègent quelqu'un qui
        pourrait se raviser ; ici c'est l'administration qui tranche
        contre un abus, il n'y a rien à protéger.
        ⚠️ LE COMPTE DE CONNEXION N'EST PAS TOUCHÉ : supprimer un
        portfolio n'est pas supprimer quelqu'un. La personne garde son
        compte, ses favoris, ses suivis — et retrouve son identité de
        particulier au premier chargement (la règle de la nº 675, tenue
        par le rattrapage de MenuEspace).
        ⚠️ L'EFFACEMENT LUI-MÊME EST CELUI DE LA PURGE DES TRENTE JOURS,
        au caractère : `supprimerLaFicheDefinitivement` est le corps
        extrait de `purgerFichesEchues` (lib/suppression-compte). Deux
        écritures auraient fini par diverger — et celle qui oublie les
        photos laisse des fichiers orphelins pour toujours. */
    if (action === "supprimer") {
      const { data: ligne } = await admin
        .from("tatoueurs")
        .select("user_id")
        .eq("id", id)
        .maybeSingle();
      await supprimerLaFicheDefinitivement(
        id,
        (ligne as { user_id?: string | null } | null)?.user_id ?? null
      );
      return NextResponse.json({ ok: true });
    }

    let valeurs: Record<string, unknown>;
    if (action === "valider") {
      // Le brouillon éventuel devient LA fiche publique.
      const { data } = await admin
        .from("tatoueurs")
        .select("brouillon")
        .eq("id", id)
        .maybeSingle();
      const brouillon =
        (data as { brouillon?: Record<string, unknown> | null } | null)
          ?.brouillon ?? null;
      valeurs = {
        ...(brouillon ?? {}),
        publie: true,
        statut: "validee",
        hors_ligne: false,
        motifs_moderation: null,
        note_moderation: null,
        decide_le: new Date().toISOString(),
        brouillon: null,
        validation_a_notifier: true,
      };
    } else if (action === "hors_ligne") {
      // « Mettre la fiche hors ligne » : DÉPUBLIÉE (plus aucune page
      // publique ne la sert — recherche, mosaïque, fiche), le drapeau
      // `hors_ligne` distingue cette sanction d'une simple attente,
      // et les motifs cochés guident la correction — exactement le
      // mécanisme du refus. Le COMPTE, lui, n'est pas touché : le
      // tatoueur garde son espace.
      valeurs = {
        publie: false,
        hors_ligne: true,
        statut: "modifications",
        motifs_moderation: motifs,
        note_moderation: note || null,
        decide_le: new Date().toISOString(),
      };
    } else {
      // « Demander des modifications » : les motifs partent, la fiche
      // repasse au tatoueur. `publie` N'EST PAS TOUCHÉ — une fiche en
      // ligne le reste, sa version publique n'a pas bougé.
      valeurs = {
        statut: "modifications",
        motifs_moderation: motifs,
        note_moderation: note || null,
        decide_le: new Date().toISOString(),
      };
    }

    // Les colonnes des migrations récentes peuvent manquer : on retire
    // CELLE que l'erreur nomme et on réessaie, sans jamais abandonner
    // la décision elle-même.
    const tolerees = [
      "validation_a_notifier",
      "brouillon",
      "decide_le",
      "motifs_moderation",
      "note_moderation",
      "hors_ligne",
      "statut",
    ];
    let maj = await admin.from("tatoueurs").update(valeurs).eq("id", id);
    for (let essai = 0; essai < tolerees.length && maj.error; essai++) {
      const message = maj.error.message.toLowerCase();
      const enCause = tolerees.find(
        (colonne) => message.includes(colonne) && colonne in valeurs
      );
      if (!enCause) break;
      valeurs = { ...valeurs };
      delete valeurs[enCause];
      maj = await admin.from("tatoueurs").update(valeurs).eq("id", id);
    }
    if (maj.error && action === "valider") {
      // Dernier repli : la seule colonne dont tout dépend.
      maj = await admin.from("tatoueurs").update({ publie: true }).eq("id", id);
    }
    if (maj.error) throw new Error(maj.error.message);

    /**
     * §1 (nº 285) — VALIDER LIBÈRE AUSSI LES PHOTOS QUI ATTENDAIENT.
     * ------------------------------------------------------------------
     * C'est le geste qui TERMINE la règle 3 : les photos neuves
     * deviennent publiques, d'un coup, avec le reste. Sans lui elles
     * resteraient invisibles pour toujours.
     * ⚠️ SEULEMENT SUR « VALIDER » : demander des modifications ou
     * mettre hors ligne laisse les photos en attente — elles n'ont pas
     * été acceptées, elles ne doivent pas s'afficher.
     * ⚠️ JAMAIS BLOQUANT : sans la migration nº 70 la colonne n'existe
     * pas, et il n'y a alors rien à libérer (aucune photo n'attend).
     */
    if (action === "valider") {
      await admin
        .from("photos_tatoueur")
        .update({ en_attente: false })
        .eq("tatoueur_id", id)
        .eq("en_attente", true);
    }

    // LE CACHE DES PAGES PUBLIQUES EST VIDÉ TOUT DE SUITE : une fiche
    // validée doit apparaître dans la mosaïque et sur sa page « style
    // + ville » sans attendre (voir src/lib/rafraichir.ts).
    rafraichirPagesPubliques(
      (
        await admin
          .from("tatoueurs")
          .select("slug")
          .eq("id", id)
          .maybeSingle()
      ).data?.slug ?? null
    );

    // LA NOTIFICATION — elle NOMME la fiche concernée : un compte peut
    // en gérer plusieurs, « ta modification est refusée » ne veut plus
    // rien dire sans dire laquelle. Jamais bloquante : la décision est
    // déjà enregistrée, une notification manquée ne la défait pas.
    const proprietaire = await proprietaireDeLaFiche(id);
    if (proprietaire) {
      await creerNotification({
        userId: proprietaire.userId,
        ficheId: id,
        ficheNom: proprietaire.nom,
        genre:
          action === "valider"
            ? "validee"
            : action === "hors_ligne"
              ? "hors_ligne"
              : "modifications",
        detail: note || null,
        motifs: action === "valider" ? null : motifs,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: `La décision n'a pas été enregistrée : ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    );
  }
}
