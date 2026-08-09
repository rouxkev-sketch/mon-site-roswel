import { NextResponse } from "next/server";
import {
  annulerFormulaireEnvoye,
  chercherContactFormulaire,
  marquerFormulaireEnvoye,
  mettreEnFile,
  preparerApercu,
  retirerContactFormulaire,
} from "@/lib/prospection-envoi";

/**
 * MISE EN FILE D'ATTENTE DES ENVOIS (outil admin)
 * ------------------------------------------------
 * Outil de développement, comme /api/admin/collecte-sirene :
 * désactivé sur le site en ligne. C'est MOI qui décide à qui écrire,
 * depuis mon ordinateur ; la tâche planifiée, elle, tourne en
 * production et se contente d'exécuter (/api/cron/prospection).
 *
 * Cette route N'ENVOIE JAMAIS un e-mail. Elle prépare, elle
 * programme, elle note — rien de plus. Trois usages :
 *
 *  1. VOIR les messages avant de décider (aucune écriture) :
 *       { "apercu": true, "prospectIds": ["…"], "commune": "69081" }
 *     → { automatiques[], aLaMain[], ecartes[], quotaRestant }
 *
 *  2. METTRE EN FILE (écrit `prochain_envoi_le`) :
 *       { "prospectIds": ["…"] }
 *     → { misEnFile, premierDepart, dernierDepart, ecartMinutes }
 *
 *  3. NOTER un contact pris à la main dans un formulaire (hors quota) :
 *       { "formulaireEnvoye": "id-du-prospect" }
 *     → { ok, message, annulableSecondes }
 *
 *  4. DÉFAIRE ce contact, dans les minutes qui suivent (retour EXACT
 *     à l'état d'avant le clic) :
 *       { "annulerFormulaire": "id-du-prospect" }
 *
 *  5. CORRIGER un contact ancien, en deux temps (outil rare, sous le
 *     tableau) : d'abord VOIR la fiche, ensuite retirer.
 *       { "chercherFormulaire": "123456789" }   (SIREN)
 *       { "retirerFormulaire": "id-du-prospect" }
 *
 * Essai :
 *   curl -X POST http://localhost:3000/api/admin/prospection-envoi \
 *     -H "Content-Type: application/json" \
 *     -d '{"apercu":true,"prospectIds":["…"]}'
 */

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function erreur(message: string, code = 400) {
  return NextResponse.json({ ok: false, message }, { status: code });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return erreur("Outil désactivé sur le site en ligne.", 403);
  }

  let corps: {
    apercu?: boolean;
    prospectIds?: unknown;
    commune?: string;
    formulaireEnvoye?: string;
    annulerFormulaire?: string;
    chercherFormulaire?: string;
    retirerFormulaire?: string;
  };
  try {
    corps = await request.json();
  } catch {
    return erreur("Requête illisible.");
  }

  // ----- 3. Contact pris à la main -----
  if (corps.formulaireEnvoye) {
    const resultat = await marquerFormulaireEnvoye(
      String(corps.formulaireEnvoye)
    );
    return NextResponse.json(resultat, { status: resultat.ok ? 200 : 400 });
  }

  // ----- 4. Le même contact, défait dans la foulée -----
  if (corps.annulerFormulaire) {
    const resultat = await annulerFormulaireEnvoye(
      String(corps.annulerFormulaire)
    );
    return NextResponse.json(resultat, { status: resultat.ok ? 200 : 400 });
  }

  // ----- 5a. Voir la fiche visée par la correction (aucune écriture) -----
  if (corps.chercherFormulaire) {
    const resultat = await chercherContactFormulaire(
      String(corps.chercherFormulaire)
    );
    return NextResponse.json(resultat, { status: resultat.ok ? 200 : 400 });
  }

  // ----- 5b. Retirer ce contact ancien -----
  if (corps.retirerFormulaire) {
    const resultat = await retirerContactFormulaire(
      String(corps.retirerFormulaire)
    );
    return NextResponse.json(resultat, { status: resultat.ok ? 200 : 400 });
  }

  const ids = Array.isArray(corps.prospectIds)
    ? corps.prospectIds.map((v) => String(v)).filter(Boolean)
    : [];

  // ----- 1. Aperçu (aucune écriture, aucun envoi) -----
  if (corps.apercu === true) {
    try {
      const apercu = await preparerApercu(ids, { commune: corps.commune });
      return NextResponse.json({ ok: true, ...apercu });
    } catch (e) {
      return erreur(
        `Aperçu impossible : ${e instanceof Error ? e.message : String(e)}`,
        500
      );
    }
  }

  // ----- 2. Mise en file -----
  if (ids.length === 0) return erreur("Aucun prospect sélectionné.");

  try {
    const resultat = await mettreEnFile(ids);
    console.log(
      `[prospection-envoi] ${resultat.misEnFile} mis en file` +
        (resultat.ecartes.length > 0
          ? ` · ${resultat.ecartes.length} écarté(s)`
          : "") +
        (resultat.premierDepart ? ` · premier départ ${resultat.premierDepart}` : "")
    );
    return NextResponse.json(resultat, { status: resultat.ok ? 200 : 400 });
  } catch (e) {
    return erreur(
      `Mise en file impossible : ${e instanceof Error ? e.message : String(e)}`,
      500
    );
  }
}
