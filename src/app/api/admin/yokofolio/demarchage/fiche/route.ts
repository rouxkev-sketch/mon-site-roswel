import { NextRequest, NextResponse } from "next/server";
import { verifierAdmin } from "@/lib/admin-yokofolio";
import { identifiantsAdmin } from "@/lib/fiches-admin";
import { rafraichirPagesPubliques } from "@/lib/rafraichir";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * ADMIN YOKOFOLIO — L'INTERRUPTEUR, ET LA RESTAURATION
 * ======================================================
 * POST { id, publique: boolean } — « Rendre publique ».
 * POST { id, restaurer: true }   — remettre en place une fiche que le
 *                                  tatoueur a fait retirer.
 *
 * ⚠️ UNE FICHE D'ADMINISTRATEUR NE PASSE PLUS PAR LA VALIDATION À SA
 * CRÉATION (passe nº 135). Elle suivait le parcours de modération d'un
 * vrai tatoueur : envoyée en attente, relue, publiée. C'était absurde —
 * l'administrateur relisait ce qu'il venait d'écrire, et une fiche
 * préparée pour un démarchage restait invisible tant qu'il n'avait pas
 * cliqué « Valider » dans son propre écran.
 *
 * ⚠️ SES MODIFICATIONS, ELLES, Y REPASSENT (passe nº 152) : modifier
 * une fiche EN LIGNE écrit les changements dans un `brouillon` et pose
 * « en_attente ». L'interrupteur ne touche donc plus au statut tant
 * qu'un brouillon attend — sans quoi il ferait sortir la fiche de la
 * file de validation sans que rien n'ait été approuvé.
 *
 * DÉSORMAIS, L'INTERRUPTEUR FAIT TOUT : il pose `publie`, `statut` ET
 * `admin_publique` d'un seul geste. Les trois colonnes vont ensemble —
 * `publie` fait exister la fiche, `admin_publique` lève le masquage
 * des comptes administrateurs (migration nº 43), et `statut` évite que
 * la fiche réapparaisse dans la file d'attente de la modération.
 *
 * ⚠️ CELA NE CHANGE RIEN POUR LES VRAIS TATOUEURS : la seconde
 * serrure ci-dessous refuse toute fiche qui n'appartient pas à un
 * compte administrateur. Leur parcours de modération est intact.
 */

const SANS_MIGRATION =
  "La migration nº 43 (yokofolio-fiche-admin-publique.sql) n'est pas passée : la colonne admin_publique n'existe pas encore.";

function colonneAbsente(message: string): boolean {
  const texte = message.toLowerCase();
  return (
    /column\b[^]*\bdoes not exist/.test(texte) ||
    /could not find the .* column/.test(texte) ||
    texte.includes("schema cache")
  );
}

export async function POST(requete: NextRequest) {
  const refus = await verifierAdmin();
  if (refus) {
    return NextResponse.json(
      { ok: false, message: refus.message },
      { status: refus.statut }
    );
  }

  try {
    const corps = (await requete.json()) as {
      id?: string;
      publique?: boolean;
      restaurer?: boolean;
    };
    if (!corps.id) {
      return NextResponse.json(
        { ok: false, message: "Requête incomplète." },
        { status: 400 }
      );
    }

    const admin = creerClientSupabaseAdmin();

    //  LA SECONDE SERRURE : à qui appartient cette fiche ? Une fiche
    //  DÉJÀ RATTACHÉE à son tatoueur n'appartient plus à
    //  l'administrateur — et c'est très bien : il ne doit pas pouvoir
    //  publier ni dépublier la fiche de quelqu'un depuis cet écran.
    const proprio = await admin
      .from("tatoueurs")
      .select("id, user_id, supprime_le, brouillon")
      .eq("id", corps.id)
      .maybeSingle();
    if (proprio.error) throw new Error(proprio.error.message);
    const ligne = proprio.data as {
      user_id: string | null;
      supprime_le: string | null;
      brouillon?: Record<string, unknown> | null;
    } | null;
    if (!ligne) {
      return NextResponse.json(
        { ok: false, message: "Fiche introuvable." },
        { status: 404 }
      );
    }
    const comptes = await identifiantsAdmin();
    if (!ligne.user_id || !comptes.includes(ligne.user_id)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Cet écran ne pilote QUE les fiches d'un compte administrateur.",
        },
        { status: 403 }
      );
    }

    //  ---------- LA RESTAURATION ----------
    //  Le tatoueur a fait retirer sa fiche depuis son lien. Elle n'est
    //  pas effacée : elle attend trente jours. L'administrateur peut
    //  la remettre — c'est l'exact pendant du bouton « Réactiver mon
    //  portfolio » côté tatoueur.
    if (corps.restaurer) {
      const remise = await admin
        .from("tatoueurs")
        .update({ supprime_le: null, purge_le: null })
        .eq("id", corps.id);
      if (remise.error) throw new Error(remise.error.message);
      rafraichirPagesPubliques();
      return NextResponse.json({ ok: true });
    }

    //  ---------- L'INTERRUPTEUR ----------
    if (typeof corps.publique !== "boolean") {
      return NextResponse.json(
        { ok: false, message: "Requête incomplète." },
        { status: 400 }
      );
    }

    //  LES TROIS COLONNES ENSEMBLE. Écrire `admin_publique` seul
    //  laissait la fiche invisible (elle n'était pas publiée) et
    //  l'interrupteur passait pour cassé.
    const valeurs: Record<string, unknown> = {
      admin_publique: corps.publique,
      publie: corps.publique,
      statut: corps.publique ? "valide" : "brouillon",
    };
    //  ⚠️ UNE MODIFICATION EN ATTENTE N'EST PAS EFFACÉE PAR
    //  L'INTERRUPTEUR (passe nº 152). La fiche porte un `brouillon` :
    //  elle attend une décision dans « Fiches à valider », et son
    //  statut « en_attente » est CE QUI L'Y FAIT FIGURER. L'écraser
    //  d'un « valide » la ferait sortir de la file sans que personne
    //  n'ait rien approuvé — le changement resterait dans le brouillon,
    //  invisible, exactement le défaut que cette passe corrige.
    //  L'interrupteur garde donc son rôle — mettre en ligne ou retirer
    //  — sans jamais trancher à la place de la modération.
    if (ligne.brouillon != null) delete valeurs.statut;
    let ecriture = await admin
      .from("tatoueurs")
      .update(valeurs)
      .eq("id", corps.id);
    if (ecriture.error && colonneAbsente(ecriture.error.message)) {
      const message = ecriture.error.message.toLowerCase();
      //  Base pas encore migrée : on retire la colonne que l'erreur
      //  nomme et on réessaie — `publie` suffit à faire l'essentiel.
      for (const colonne of ["statut", "admin_publique"]) {
        if (message.includes(colonne)) delete valeurs[colonne];
      }
      ecriture = await admin
        .from("tatoueurs")
        .update(valeurs)
        .eq("id", corps.id);
      if (ecriture.error && colonneAbsente(ecriture.error.message)) {
        return NextResponse.json(
          { ok: false, message: SANS_MIGRATION },
          { status: 409 }
        );
      }
    }
    if (ecriture.error) throw new Error(ecriture.error.message);

    //  LA MOSAÏQUE ET LE PLAN DU SITE SONT EN CACHE : sans ce
    //  rafraîchissement, la fiche mettrait l'âge du cache à
    //  apparaître (ou à disparaître).
    rafraichirPagesPubliques();

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: e instanceof Error ? e.message : "Enregistrement impossible.",
      },
      { status: 500 }
    );
  }
}
