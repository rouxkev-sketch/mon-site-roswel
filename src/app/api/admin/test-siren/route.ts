import { NextResponse } from "next/server";
import { verifierSiren } from "@/lib/siren";

/**
 * OUTIL DE TEST D'UN SIREN (développement uniquement)
 * ---------------------------------------------------
 * Ouvrir dans le navigateur :
 * http://localhost:3000/api/admin/test-siren?siren=55210055400013&nom=SNCF
 * → montre exactement ce que la vérification conclut, pour
 * diagnostiquer un numéro refusé en un coup d'œil.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const siren = searchParams.get("siren") ?? "";
  const nom = searchParams.get("nom") ?? "";

  if (!siren) {
    return NextResponse.json({
      ok: false,
      message:
        "Ajouter ?siren=XXXXXXXXXXXXXX (9 chiffres) et éventuellement &nom=… à l'adresse.",
    });
  }

  const resultat = await verifierSiren(siren, nom);
  return NextResponse.json({ ok: true, siren, nomCompare: nom, resultat });
}
