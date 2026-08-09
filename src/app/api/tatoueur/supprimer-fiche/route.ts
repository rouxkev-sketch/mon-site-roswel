import { NextRequest, NextResponse } from "next/server";
import { DELAI_SUPPRESSION_JOURS } from "@/config/tatouage";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { echeanceSuppression } from "@/lib/suppression-compte";
import { creerNotification } from "@/lib/notifications";

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
      { ok: false, message: "Connecte-toi d'abord." },
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
      { ok: false, message: "Demande incomplète." },
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
      { ok: false, message: "Cette fiche n'est pas la tienne." },
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
          ? "La base n'est pas prête : passer supabase/yokofolio-fiches-multiples.sql."
          : error.message,
      },
      { status: 500 }
    );
  }

  // LA TRACE DANS LES NOTIFICATIONS — la personne doit retrouver
  // l'échéance (ou son annulation) ailleurs que dans un écran fugace.
  await creerNotification({
    userId: user.id,
    ficheId: ligne.id,
    ficheNom: ligne.nom,
    genre: annuler ? "annulation" : "suppression_fiche",
    detail: annuler
      ? "La suppression est annulée : la fiche est rétablie telle qu'elle était."
      : `La fiche est retirée du public. Elle sera définitivement supprimée dans ${DELAI_SUPPRESSION_JOURS} jours — la réactiver avant l\u2019échéance remet tout en place.`,
  });

  return NextResponse.json({
    ok: true,
    purgeLe,
    jours: DELAI_SUPPRESSION_JOURS,
  });
}
