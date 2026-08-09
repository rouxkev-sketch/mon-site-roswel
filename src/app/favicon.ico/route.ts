import { NextResponse } from "next/server";
import { MARQUE_YOKOFOLIO } from "@/config/tatouage";

/**
 * /favicon.ico — LA PORTE PAR LAQUELLE UNE VIEILLE ICÔNE REVIENT
 * ===============================================================
 * Les navigateurs demandent d'eux-mêmes « /favicon.ico », en dehors de
 * toute déclaration dans la page — et ils GARDENT cette réponse très
 * longtemps. Un visiteur dont le navigateur a mémorisé l'icône d'un
 * ancien produit à cette adresse peut donc la revoir dans l'onglet,
 * même si plus aucune page ne la déclare.
 *
 * Cette route reprend l'adresse en main : elle renvoie vers le cœur
 * de yokofolio, en interdisant la mise en mémoire de la redirection
 * (`no-store`) — la prochaine visite écrase l'ancienne icône au lieu
 * de la ressusciter.
 *
 * Aucune image n'est fabriquée ici : on redirige vers le fichier
 * déposé par le propriétaire, tel quel.
 */
export function GET(request: Request) {
  return NextResponse.redirect(
    new URL(MARQUE_YOKOFOLIO.iconeOnglet, request.url),
    { status: 307, headers: { "Cache-Control": "no-store" } }
  );
}
