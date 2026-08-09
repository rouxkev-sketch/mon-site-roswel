import { NextRequest, NextResponse } from "next/server";
import { verifierAdmin } from "@/lib/admin-yokofolio";
import { identifiantsAdmin } from "@/lib/fiches-admin";
import { rafraichirPagesPubliques } from "@/lib/rafraichir";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
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

    //  ⚠️ LES FICHES DE L'ADMINISTRATEUR NE SONT PLUS RELUES (passe
    //  nº 135). Elles suivaient le même parcours de modération que
    //  celles des vrais tatoueurs : il relisait ce qu'il venait
    //  d'écrire, et une fiche préparée pour un démarchage restait
    //  invisible tant qu'il n'avait pas cliqué « Valider » dans son
    //  propre écran. Elles se mettent en ligne d'un interrupteur, dans
    //  le tableau de démarchage — elles n'ont donc plus rien à faire
    //  dans cette file d'attente.
    //  ⚠️ RIEN NE CHANGE POUR LES VRAIS TATOUEURS : on écarte des
    //  PROPRIÉTAIRES, pas des fiches. Le jour où une adresse quitte
    //  COURRIELS_ADMIN, ses fiches reviennent ici d'elles-mêmes.
    const comptesAdmin = await identifiantsAdmin();
    const enAttente = ((reponse.data ?? []) as Array<Record<string, unknown>>)
      .filter((ligne) => {
        const proprietaire = ligne.user_id as string | null;
        return !proprietaire || !comptesAdmin.includes(proprietaire);
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

  if (!id || !["valider", "modifier", "hors_ligne"].includes(action)) {
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
