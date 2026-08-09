import { NextResponse } from "next/server";
import { chargerFicheComplete } from "@/lib/fiche-artisan";

/**
 * FICHE COMPLÈTE EN JSON (mode double colonnes)
 * ---------------------------------------------
 * Sur grand écran, cliquer une carte affiche la fiche dans la
 * colonne de droite SANS recharger la page : cette route fournit
 * les mêmes données que la page /artisan/[slug] (fiches validées
 * uniquement — même règle de sécurité en base).
 */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) {
    return NextResponse.json(
      { ok: false, message: "Adresse de fiche manquante." },
      { status: 400 }
    );
  }

  try {
    const fiche = await chargerFicheComplete(slug);
    if (!fiche) {
      return NextResponse.json(
        { ok: false, message: "Fiche introuvable." },
        { status: 404 }
      );
    }
    return NextResponse.json(fiche, {
      // Une fiche bouge rarement : petite mise en cache côté CDN
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Base injoignable pour le moment." },
      { status: 503 }
    );
  }
}
