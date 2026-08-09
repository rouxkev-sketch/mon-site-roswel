import { NextResponse } from "next/server";
import { RECHERCHE_EMAIL } from "@/config/roswel";
import { chercherAdressesEmail } from "@/lib/recherche-email";

/**
 * RECHERCHE DES ADRESSES E-MAIL DES PROSPECTS (outil admin)
 * ----------------------------------------------------------
 * Outil de développement, comme /api/admin/collecte-sirene :
 * désactivé sur le site en ligne.
 *
 * UN APPEL = UN PETIT LOT (RECHERCHE_EMAIL.prospectsParAppel). Le
 * tableau rappelle la route jusqu'à épuisement, en lui passant les
 * identifiants déjà traités : l'avancement se voit à l'écran, aucune
 * exécution ne s'éternise, et un prospect dont le site est injoignable
 * n'est jamais repris en boucle.
 *
 * Corps attendu (JSON), tout est facultatif :
 *   {
 *     "statut": "email_a_trouver",   // filtres de la page
 *     "metier": "plombier",
 *     "commune": "69081",
 *     "ignorer": ["id-1", "id-2"]    // déjà traités dans ce lot
 *   }
 *
 * Essai :
 *   curl -X POST http://localhost:3000/api/admin/recherche-email \
 *     -H "Content-Type: application/json" -d '{}'
 */

// Un lot enchaîne des lectures espacées : l'exécution peut durer.
export const maxDuration = 60;

function erreur(message: string, code = 400) {
  return NextResponse.json({ ok: false, message }, { status: code });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return erreur("Outil désactivé sur le site en ligne.", 403);
  }

  let corps: {
    statut?: string;
    metier?: string;
    commune?: string;
    ignorer?: unknown;
  };
  try {
    corps = await request.json();
  } catch {
    corps = {}; // appel sans corps : tous les prospects sans adresse
  }

  const ignorer = Array.isArray(corps.ignorer)
    ? corps.ignorer.map((x) => String(x)).slice(-2000)
    : [];

  try {
    const resultat = await chercherAdressesEmail({
      statut: corps.statut,
      metier: corps.metier,
      commune: corps.commune,
      ignorer,
    });

    console.log(
      `[recherche-email] ${resultat.compteurs.examines} examiné(s), ` +
        `${resultat.compteurs.trouves} trouvé(s), ${resultat.restants} restant(s)`
    );

    return NextResponse.json(
      {
        ok: resultat.ok,
        message: resultat.message,
        compteurs: resultat.compteurs,
        resume: resultat.resume,
        traites: resultat.traites,
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

/** Rappel des réglages : GET /api/admin/recherche-email */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return erreur("Outil désactivé sur le site en ligne.", 403);
  }
  return NextResponse.json({
    ok: true,
    message:
      "Envoyer un POST avec { statut?, metier?, commune?, ignorer? } pour chercher les adresses.",
    reglages: RECHERCHE_EMAIL,
  });
}
