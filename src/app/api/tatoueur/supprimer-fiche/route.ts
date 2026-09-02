import { NextRequest, NextResponse } from "next/server";
import { DELAI_SUPPRESSION_JOURS } from "@/config/tatouage";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { echeanceSuppression } from "@/lib/suppression-compte";
import { creerNotification } from "@/lib/notifications";
//  nº 819 — le courriel « portfolio en cours de suppression » : le nom,
//  la date, le bouton « Reactivate my portfolio » (lib/courriels-suppression).
import { envoyerCourrielSuppressionPortfolio } from "@/lib/courriels-suppression";

/**
 * SUPPRIMER UNE FICHE — SANS TOUCHER AU COMPTE
 * ---------------------------------------------
 * Un compte peut gérer plusieurs fiches : fermer un salon ne doit pas
 * fermer le compte. Cette route reprend EXACTEMENT le mécanisme de la
 * suppression de compte, à l'échelle d'une fiche :
 *
 *  1. LA DEMANDE ({ id }) — la fiche disparaît du public TOUT DE
 *     SUITE (`supprime_le`), et l'échéance est écrite noir sur blanc
 *     (`purge_le` = aujourd'hui + 30 jours). RIEN n'est effacé : ni
 *     la fiche, ni ses photos.
 *  2. LE RETOUR ({ id, annuler: true }) — les deux dates repartent à
 *     null, la fiche revient EXACTEMENT dans l'état où elle était
 *     (publiée ou non), puisqu'on n'a touché à aucun autre champ.
 *     UNE SIMPLE MODIFICATION DE LA FICHE annule aussi la suppression
 *     — c'est le formulaire qui s'en charge (voir FormulaireFiche).
 *  3. LA PURGE — à l'échéance, par la tâche planifiée
 *     /api/cron/purge-comptes, qui lit la vue `fiches_a_purger`.
 *
 * ON NE SUPPRIME QUE SES PROPRES FICHES : la propriété est revérifiée
 * CÔTÉ SERVEUR avant toute écriture, jamais devinée d'après ce que le
 * navigateur envoie.
 */
export async function POST(requete: NextRequest) {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Log in first." },
      { status: 401 }
    );
  }

  const corps = (await requete.json().catch(() => null)) as {
    id?: string;
    annuler?: boolean;
  } | null;
  const id = corps?.id ?? "";
  if (!id) {
    return NextResponse.json(
      { ok: false, message: "Incomplete request." },
      { status: 400 }
    );
  }

  const admin = creerClientSupabaseAdmin();

  // LA PROPRIÉTÉ, VÉRIFIÉE ICI ET NULLE PART AILLEURS.
  const { data: fiche } = await admin
    .from("tatoueurs")
    .select("id, nom, user_id")
    .eq("id", id)
    .maybeSingle();
  const ligne = fiche as { id: string; nom: string; user_id: string } | null;
  if (!ligne || ligne.user_id !== user.id) {
    return NextResponse.json(
      { ok: false, message: "This portfolio isn't yours." },
      { status: 403 }
    );
  }

  const annuler = Boolean(corps?.annuler);
  const purgeLe = annuler ? null : echeanceSuppression().toISOString();

  const { error } = await admin
    .from("tatoueurs")
    .update({
      supprime_le: annuler ? null : new Date().toISOString(),
      purge_le: purgeLe,
    })
    .eq("id", id);

  if (error) {
    const message = error.message.toLowerCase();
    return NextResponse.json(
      {
        ok: false,
        message: message.includes("purge_le")
          ? "The database isn't ready: run supabase/yokofolio-fiches-multiples.sql."
          : error.message,
      },
      { status: 500 }
    );
  }

  // LA TRACE DANS LES NOTIFICATIONS — la personne doit retrouver
  // l'échéance (ou son annulation) ailleurs que dans un écran fugace.
  //  nº 819 — LE COURRIEL PART APRÈS L'ÉCRITURE, pour une demande de
  //  suppression seulement (une annulation ne l'appelle pas), et ne la
  //  bloque jamais. Sans adresse connue, la notification seule.
  if (!annuler && purgeLe && user.email) {
    await envoyerCourrielSuppressionPortfolio(
      user.email,
      ligne.nom,
      ligne.id,
      purgeLe
    );
  }
  await creerNotification({
    userId: user.id,
    ficheId: ligne.id,
    ficheNom: ligne.nom,
    genre: annuler ? "annulation" : "suppression_fiche",
    detail: annuler
      ? "The deletion is canceled: the portfolio is restored as it was."
      : `The portfolio is removed from public view. It will be permanently deleted in ${DELAI_SUPPRESSION_JOURS} days — reactivating it before then puts everything back.`,
  });

  return NextResponse.json({
    ok: true,
    purgeLe,
    jours: DELAI_SUPPRESSION_JOURS,
  });
}
