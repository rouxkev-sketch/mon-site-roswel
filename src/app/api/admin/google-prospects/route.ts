import { NextResponse } from "next/server";
import { GOOGLE_PROSPECTS } from "@/config/roswel";
import {
  chercherFichesGoogle,
  compterProspectsSansGoogle,
} from "@/lib/google-prospects";
import { journaliserAppelsGoogle } from "@/lib/journal-google";

/**
 * RECHERCHE DES FICHES GOOGLE DES PROSPECTS (outil admin)
 * --------------------------------------------------------
 * Outil de développement, comme /api/admin/collecte-sirene :
 * désactivé sur le site en ligne.
 *
 * ⚠️ CHAQUE APPEL COÛTE DE L'ARGENT. Deux usages, bien séparés :
 *
 *  - COMPTER, sans dépenser un centime :
 *      { "compter": true, "statut": "…", "metier": "…", "commune": "…" }
 *    → { ok, nombre, appelsMaximum, coutMaximum }
 *    C'est ce que le tableau demande AVANT de proposer de lancer.
 *
 *  - CHERCHER, et là oui, ça coûte :
 *      { "statut": "…", "metier": "…", "commune": "…" }
 *    → { ok, message, compteurs, resume }
 *
 * UNE exécution = UN lot borné (GOOGLE_PROSPECTS.appelsMaximumParExecution).
 * Volontairement PAS d'enchaînement automatique : sur un outil qui
 * dépense, on relance à la main, en sachant ce qu'on relance.
 *
 * Essai :
 *   curl -X POST http://localhost:3000/api/admin/google-prospects \
 *     -H "Content-Type: application/json" -d '{"compter":true}'
 */

export const maxDuration = 60;

function erreur(message: string, code = 400) {
  return NextResponse.json({ ok: false, message }, { status: code });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return erreur("Outil désactivé sur le site en ligne.", 403);
  }

  let corps: {
    compter?: boolean;
    statut?: string;
    metier?: string;
    commune?: string;
  };
  try {
    corps = await request.json();
  } catch {
    corps = {};
  }

  const filtres = {
    statut: corps.statut,
    metier: corps.metier,
    commune: corps.commune,
  };

  // ----- Compter : aucune dépense -----
  if (corps.compter === true) {
    try {
      const nombre = await compterProspectsSansGoogle(filtres);
      // Le pire des cas : deux appels par prospect, borné par le
      // plafond de l'exécution.
      const appelsMaximum = Math.min(
        nombre * 2,
        GOOGLE_PROSPECTS.appelsMaximumParExecution
      );
      const coutMaximum =
        appelsMaximum *
        Math.max(
          GOOGLE_PROSPECTS.coutRechercheEuro,
          GOOGLE_PROSPECTS.coutDetailsEuro
        );
      // LE PIRE DES CAS, TYPE D'APPEL PAR TYPE D'APPEL — sans quoi la
      // fenêtre de confirmation ne pourrait pas dire sur QUELLE
      // franchise l'exécution va peser. Les deux bornes ne peuvent
      // pas être atteintes en même temps (si tout part en recherches,
      // il ne reste rien pour les détails) : chacune est un maximum,
      // pas une prévision.
      const plafond = GOOGLE_PROSPECTS.appelsMaximumParExecution;
      const rechercheMaximum = Math.min(nombre, plafond);
      const detailsMaximum = Math.min(nombre, Math.floor(plafond / 2));

      return NextResponse.json({
        ok: true,
        nombre,
        appelsMaximum,
        coutMaximum,
        rechercheMaximum,
        detailsMaximum,
        plafond,
      });
    } catch (e) {
      return erreur(
        `Comptage impossible : ${e instanceof Error ? e.message : String(e)}`,
        500
      );
    }
  }

  // ----- Chercher : c'est ici que ça coûte -----
  try {
    const resultat = await chercherFichesGoogle(filtres);

    // LE JOURNAL DES APPELS — DEUX TYPES, DEUX FRANCHISES.
    // La recherche ne demande jamais la note : elle reste au palier
    // « Pro ». Les détails, eux, lisent la note et le nombre d'avis :
    // palier « Enterprise », la franchise la plus basse. Les compter
    // ensemble reviendrait à masquer celui qui sature le premier.
    // Journalisé AVANT de répondre, et même en cas d'échec : un appel
    // refusé par Google a souvent déjà été facturé.
    await journaliserAppelsGoogle([
      {
        outil: "google-prospects",
        typeAppel: "recherche",
        nombreAppels: resultat.compteurs.appelsRecherche,
        resultat: resultat.ok ? (resultat.interrompu ? "partiel" : "ok") : "echec",
        detail: filtres.commune ? `commune ${filtres.commune}` : "toutes communes",
      },
      {
        outil: "google-prospects",
        typeAppel: "details_avis",
        nombreAppels: resultat.compteurs.appelsDetails,
        resultat: resultat.ok ? (resultat.interrompu ? "partiel" : "ok") : "echec",
        detail: filtres.commune ? `commune ${filtres.commune}` : "toutes communes",
      },
    ]);

    // Le terminal garde lui aussi une trace du nombre d'appels
    // RÉELLEMENT facturés : c'est la ligne à relire en cas de doute
    // sur une facture Google.
    console.log(
      `[google-prospects] ${resultat.compteurs.appelsRecherche} recherche(s) + ` +
        `${resultat.compteurs.appelsDetails} détail(s) = ` +
        `${
          resultat.compteurs.appelsRecherche + resultat.compteurs.appelsDetails
        } appel(s) facturé(s) · ` +
        `${resultat.compteurs.rattaches} rattaché(s), ` +
        `${resultat.compteurs.propositions} proposition(s)` +
        (resultat.interrompu ? " · INTERROMPU" : "")
    );

    return NextResponse.json(
      {
        ok: resultat.ok,
        message: resultat.message,
        compteurs: resultat.compteurs,
        resume: resultat.resume,
        restants: resultat.restants,
      },
      { status: resultat.ok ? 200 : 500 }
    );
  } catch (e) {
    return erreur(
      `Recherche impossible : ${e instanceof Error ? e.message : String(e)}`,
      500
    );
  }
}

/** Rappel des réglages : GET /api/admin/google-prospects */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return erreur("Outil désactivé sur le site en ligne.", 403);
  }
  return NextResponse.json({
    ok: true,
    message:
      "POST { compter: true, … } pour compter sans dépenser ; POST { … } pour chercher.",
    reglages: GOOGLE_PROSPECTS,
    cleConfiguree: Boolean(process.env.GOOGLE_PLACES_API_KEY),
  });
}
