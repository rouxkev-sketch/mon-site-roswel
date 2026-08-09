import { NextResponse } from "next/server";
import { EMAILS_NOTIFICATION, VALIDATION_FICHE } from "@/config/roswel";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { adresseDuSite, envoyerEmail } from "@/lib/email";
import { verifierSiren } from "@/lib/siren";
import { calculerScoreTotal, determinerPastille } from "@/lib/score";

/**
 * DÉCISION DE VALIDATION D'UNE FICHE (admin, étape 8b)
 * ----------------------------------------------------
 * - « valider » (toutes les cases cochées) → la fiche devient
 *   visible dans la recherche. RÈGLE ABSOLUE : le SIREN est
 *   re-vérifié ici même auprès de l'annuaire officiel — aucune
 *   validation sans SIREN vérifié.
 * - « demander » (au moins une case décochée) → statut
 *   « modifications demandées » + les messages types des cases
 *   décochées, affichés dans l'espace de l'artisan.
 *   (L'email de prévenance sera branché avec les notifications de
 *   l'étape 9.)
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, message: "Outil désactivé sur le site en ligne." },
      { status: 403 }
    );
  }

  let corps: {
    artisanId?: string;
    action?: "valider" | "demander";
    casesCochees?: string[];
  };
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Requête illisible." },
      { status: 400 }
    );
  }

  const { artisanId, action } = corps;
  const cochees = corps.casesCochees ?? [];
  if (!artisanId || !action) {
    return NextResponse.json(
      { ok: false, message: "Fiche ou action manquante." },
      { status: 400 }
    );
  }

  const toutesCochees = VALIDATION_FICHE.every(({ cle }) =>
    cochees.includes(cle)
  );

  try {
    const supabase = creerClientSupabaseAdmin();

    if (action === "valider") {
      if (!toutesCochees) {
        return NextResponse.json(
          {
            ok: false,
            message: "Impossible de valider : toutes les cases doivent être cochées.",
          },
          { status: 400 }
        );
      }

      // Re-vérification du SIREN côté serveur : la règle ne peut pas
      // être contournée depuis le navigateur. (Les chiffres du score
      // sont relus pour le recalcul avec l'ancienneté confirmée.)
      const { data: fiche, error: erreurFiche } = await supabase
        .from("artisans")
        .select(
          "siren, nom_affiche, abonnes_instagram, publications_instagram, note_google, nombre_avis_google, telephone, telephone_visible, whatsapp"
        )
        .eq("id", artisanId)
        .single();
      if (erreurFiche || !fiche) {
        throw new Error(erreurFiche?.message ?? "fiche introuvable");
      }

      // RÈGLE DE CONTACT MINIMUM : pas de fiche fantôme — impossible
      // de valider sans au moins un moyen de contact joignable
      // (téléphone affiché ou WhatsApp).
      const contactJoignable =
        Boolean(fiche.whatsapp) ||
        (Boolean(fiche.telephone) && fiche.telephone_visible === true);
      if (!contactJoignable) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Impossible de valider : aucun moyen de contact joignable (téléphone affiché ou WhatsApp). L'artisan doit en renseigner un.",
          },
          { status: 400 }
        );
      }
      if (!fiche.siren) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Impossible de valider : aucun SIREN sur cette fiche. L'artisan doit le renseigner.",
          },
          { status: 400 }
        );
      }
      const verdict = await verifierSiren(fiche.siren, fiche.nom_affiche);
      if (verdict.etat !== "verifie") {
        const detail =
          verdict.etat === "introuvable"
            ? "introuvable dans l'annuaire officiel"
            : verdict.etat === "inactif"
              ? `établissement fermé (${verdict.nomLegal})`
              : "annuaire injoignable, réessayer plus tard";
        return NextResponse.json(
          {
            ok: false,
            message: `Impossible de valider : SIREN non vérifié (${detail}).`,
          },
          { status: 400 }
        );
      }

      // La vérification Sirene confirme la date de création : le
      // score de confiance (ancienneté comprise) est recalculé.
      const score = calculerScoreTotal(
        fiche.abonnes_instagram,
        fiche.publications_instagram,
        fiche.note_google,
        fiche.nombre_avis_google,
        verdict.dateCreation
      );

      const { error } = await supabase
        .from("artisans")
        .update({
          statut_validation: "valide",
          motifs_modifications: [],
          siren_verifie: true,
          date_creation_entreprise: verdict.dateCreation,
          score_total: score,
          pastille: determinerPastille(score),
        })
        .eq("id", artisanId);
      if (error) throw new Error(error.message);
      return NextResponse.json({
        ok: true,
        message:
          "Fiche validée (SIREN vérifié) : elle est maintenant visible dans la recherche.",
      });
    }

    // action === "demander" : messages types des cases DÉCOCHÉES
    const motifs = VALIDATION_FICHE.filter(
      ({ cle }) => !cochees.includes(cle)
    ).map(({ message }) => message);
    if (motifs.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "Décocher au moins une case pour demander des modifications.",
        },
        { status: 400 }
      );
    }

    const { data: artisan, error } = await supabase
      .from("artisans")
      .update({
        statut_validation: "modifications_demandees",
        motifs_modifications: motifs,
      })
      .eq("id", artisanId)
      .select("user_id")
      .single();
    if (error) throw new Error(error.message);

    // Prévenir l'artisan par email (sans détail : il se connecte)
    let email = "aucun compte email lié";
    if (artisan?.user_id) {
      try {
        const { data } = await supabase.auth.admin.getUserById(artisan.user_id);
        if (data.user?.email) {
          const modele = EMAILS_NOTIFICATION.modificationsDemandees;
          const statut = await envoyerEmail(
            data.user.email,
            modele.sujet,
            modele.texte.replace("{lien}", `${adresseDuSite()}/artisan/espace`)
          );
          email =
            statut === "envoye"
              ? "email envoyé"
              : statut === "simule"
                ? "email simulé (voir le terminal)"
                : "échec de l'email";
        }
      } catch {
        email = "échec de l'email";
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Modifications demandées : ${motifs.length} message(s) type(s) transmis (${email}).`,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
