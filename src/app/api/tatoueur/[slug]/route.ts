import { NextResponse } from "next/server";
import { lireTatoueur } from "@/lib/tatoueurs";

/**
 * UNE FICHE COMPLÈTE — pour la fenêtre superposée du web
 * =======================================================
 * DEPUIS LA PASSE « PERFORMANCE », LA MOSAÏQUE NE REÇOIT QU'UNE PHOTO
 * PAR FICHE : c'est tout ce qu'une carte affiche, et charger vingt
 * photos par carte pour n'en montrer qu'une était le gros du gâchis.
 *
 * Mais la FENÊTRE qui s'ouvre au clic (web ≥ 1024 px) montre, elle,
 * TOUT le portfolio, les adresses et l'équipe. Elle les demande donc
 * ici, au moment où on l'ouvre — et pas pour les 23 autres cartes que
 * personne ne cliquera.
 *
 * ⚠️ AUCUNE RÈGLE DE VISIBILITÉ N'EST RÉÉCRITE : cette route passe par
 * `lireTatoueur`, la même lecture publique que la page de fiche. Une
 * fiche non publiée, d'un administrateur ou en cours de suppression
 * répond « introuvable », ici comme ailleurs.
 *
 * Essai :
 *   curl "http://localhost:3000/api/tatoueur/atelier-corvus-lyon-1er"
 */

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { tatoueur, demonstration } = await lireTatoueur(slug);
  if (!tatoueur) {
    return NextResponse.json({ ok: false, tatoueur: null }, { status: 404 });
  }
  return NextResponse.json({ ok: true, tatoueur, demonstration });
}
