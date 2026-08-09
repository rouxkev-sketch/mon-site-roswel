import { NextResponse } from "next/server";
import { verifierAdmin } from "@/lib/admin-yokofolio";

/**
 * ADMIN YOKOFOLIO — « SUIS-JE ADMINISTRATEUR ? »
 * -----------------------------------------------
 * Répond { admin: true } UNIQUEMENT si le compte de la requête est
 * administrateur — vérifié CÔTÉ SERVEUR (session + liste
 * COURRIELS_ADMIN), jamais côté navigateur. C'est cette réponse qui
 * autorise l'affichage des actions d'administration posées sur les
 * fiches (« Mettre la fiche hors ligne ») : sans elle, rien n'est
 * rendu — et l'ACTION elle-même est revérifiée par son API.
 * Les visiteurs non connectés ne l'appellent même pas.
 */
export async function GET() {
  const refus = await verifierAdmin();
  return NextResponse.json({ ok: true, admin: refus === null });
}
