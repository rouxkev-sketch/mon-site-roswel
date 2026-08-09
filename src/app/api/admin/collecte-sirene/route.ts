import { NextResponse } from "next/server";
import { CODES_NAF_BATIMENT, COLLECTE_SIRENE } from "@/config/roswel";
import { collecterSirene } from "@/lib/sirene-collecte";

/**
 * COLLECTE DES PROSPECTS DEPUIS L'ANNUAIRE SIRENE (outil admin)
 * --------------------------------------------------------------
 * Outil de développement, comme /api/admin/artisans-demo : désactivé
 * sur le site en ligne. L'admin le lance depuis son ordinateur, avec
 * la clé secrète Supabase — il écrit dans la même base.
 *
 * UN APPEL = UN CODE NAF × UNE COMMUNE. C'est ce qui garde
 * l'exécution courte et l'annuaire de bonne humeur.
 *
 * Corps attendu (JSON) :
 *   { "codeNaf": "4322A", "codeInsee": "69081", "maximum": 25 }
 *   - codeNaf   : un code de CODES_NAF_BATIMENT (le point est toléré)
 *   - codeInsee : le code INSEE de la commune (table `communes`)
 *   - maximum   : facultatif, borné par COLLECTE_SIRENE.entreprisesMaximum
 *
 * Essai :
 *   curl -X POST http://localhost:3000/api/admin/collecte-sirene \
 *     -H "Content-Type: application/json" \
 *     -d '{"codeNaf":"4322A","codeInsee":"69081"}'
 */

// La collecte enchaîne des appels espacés : l'exécution peut durer.
export const maxDuration = 60;

function erreur(message: string, code = 400) {
  return NextResponse.json({ ok: false, message }, { status: code });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return erreur("Outil désactivé sur le site en ligne.", 403);
  }

  let corps: { codeNaf?: string; codeInsee?: string; maximum?: number };
  try {
    corps = await request.json();
  } catch {
    return erreur("Requête illisible.");
  }

  const codeNaf = (corps.codeNaf ?? "").toString().trim();
  const codeInsee = (corps.codeInsee ?? "").toString().trim();

  if (!codeNaf) {
    return erreur(
      "Code NAF manquant. Codes acceptés : " +
        CODES_NAF_BATIMENT.map((n) => `${n.code} (${n.libelle})`).join(" · ")
    );
  }
  if (!codeInsee) {
    return erreur(
      "Code INSEE de commune manquant (par exemple 69081 pour Écully)."
    );
  }

  try {
    const resultat = await collecterSirene({
      codeNaf,
      codeInsee,
      maximum: corps.maximum,
    });

    // Le journal garde une trace de chaque collecte : utile pour
    // savoir quelles combinaisons métier × commune ont déjà été faites.
    console.log(
      `[collecte-sirene] ${codeNaf} × ${codeInsee} — ${resultat.message}`
    );

    return NextResponse.json(
      {
        ok: resultat.ok,
        message: resultat.message,
        compteurs: resultat.compteurs,
        interrompue: resultat.interrompue,
        resume: resultat.resume,
      },
      // 200 : collecte menée à son terme.
      // 409 : l'annuaire a fermé la porte en cours de route — ce
      //       n'est pas une erreur de la requête, il faut réessayer.
      // 400 : la demande elle-même est à corriger (code NAF, commune,
      //       base injoignable).
      { status: resultat.ok ? 200 : resultat.interrompue ? 409 : 400 }
    );
  } catch (e) {
    return erreur(
      `Collecte impossible : ${e instanceof Error ? e.message : String(e)}`,
      500
    );
  }
}

/**
 * Rappel des réglages en vigueur (pratique avant de lancer une
 * collecte) : GET /api/admin/collecte-sirene
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return erreur("Outil désactivé sur le site en ligne.", 403);
  }
  return NextResponse.json({
    ok: true,
    message:
      "Envoyer un POST avec { codeNaf, codeInsee, maximum? } pour lancer une collecte.",
    reglages: COLLECTE_SIRENE,
    codesNaf: CODES_NAF_BATIMENT,
  });
}
