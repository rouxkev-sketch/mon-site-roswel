import { NextRequest, NextResponse } from "next/server";
import { verifierAdmin } from "@/lib/admin-yokofolio";
import { creerNotification, proprietaireDeLaFiche } from "@/lib/notifications";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";

/**
 * ADMIN YOKOFOLIO — ROUVRIR LE BLOC 1 D'UNE FICHE
 * ================================================
 * POST { id } — le tatoueur redevient libre de changer son type de
 * fiche et ses lieux d'exercice, une fois. C'est le SEUL chemin :
 * la base interdit à quiconque d'autre de lever ce verrou (voir le
 * déclencheur `tatoueurs_verrou_exercice`, migration nº 28).
 *
 * TROIS CHOSES, ET AUCUNE N'EST FACULTATIVE :
 *  1. LA VÉRIFICATION D'ADMINISTRATEUR, côté serveur (`verifierAdmin`)
 *     — la page /admin vérifie pour l'affichage, cette route vérifie
 *     pour de vrai ;
 *  2. LA CLÉ DE SERVICE pour écrire : c'est elle, et elle seule, que
 *     le déclencheur laisse passer ;
 *  3. LA TRACE — qui a débloqué, et quand. Une action qui défait le
 *     choix de quelqu'un ne doit pas être anonyme : sans trace,
 *     personne ne peut répondre à « pourquoi ma fiche est-elle
 *     repassée en modifiable ? ».
 *
 * ET LE TATOUEUR EST PRÉVENU : une notification part vers lui. Se
 * retrouver devant un formulaire qui redemande un choix déjà fait,
 * sans explication, serait déroutant.
 */

export const dynamic = "force-dynamic";

export async function POST(requete: NextRequest) {
  const refus = await verifierAdmin();
  if (refus) {
    return NextResponse.json(
      { ok: false, message: refus.message },
      { status: refus.statut }
    );
  }

  const { id } = (await requete.json().catch(() => ({}))) as { id?: string };
  if (!id) {
    return NextResponse.json(
      { ok: false, message: "Which portfolio?" },
      { status: 400 }
    );
  }

  // QUI DÉBLOQUE — relu depuis la session, jamais depuis le corps de
  // la requête : une adresse envoyée par le client ne prouve rien.
  const session = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await session.auth.getUser();

  try {
    const admin = creerClientSupabaseAdmin();
    const { data, error } = await admin
      .from("tatoueurs")
      .update({
        exercice_verrouille: false,
        exercice_debloque_le: new Date().toISOString(),
        exercice_debloque_par: user?.email ?? "admin",
      })
      .eq("id", id)
      .select("id, nom")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      return NextResponse.json(
        { ok: false, message: "This portfolio no longer exists." },
        { status: 404 }
      );
    }

    const proprietaire = await proprietaireDeLaFiche(id);
    if (proprietaire) {
      await creerNotification({
        userId: proprietaire.userId,
        ficheId: id,
        ficheNom: proprietaire.nom,
        genre: "modifications",
        detail:
          "The first block of your portfolio (artist or studio, and where " +
          "you work) was reopened by the team: you can fix it, " +
          "then confirm it again.",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (erreur) {
    return NextResponse.json(
      {
        ok: false,
        message: `Unlocking failed: ${
          erreur instanceof Error ? erreur.message : String(erreur)
        }`,
      },
      { status: 500 }
    );
  }
}
