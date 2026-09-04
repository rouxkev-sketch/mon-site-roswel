import { NextRequest, NextResponse } from "next/server";
import { verifierAdmin } from "@/lib/admin-yokofolio";
import { diagnosticCourriel } from "@/lib/email";
import { diagnosticVariables } from "@/lib/diagnostic-variables";

/**
 * ██ nº 830 — LE DIAGNOSTIC DES E-MAILS, EN UN APPEL ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE : « aucun e-mail ne part en production ».
 * Le site enregistrait tout et n'envoyait rien, SANS QUE RIEN NULLE
 * PART NE LE DISE (voir le §2 de lib/email, qui jetait la réponse de
 * Resend au lieu de la lire).
 *
 * POURQUOI UNE ROUTE, ET PAS SEULEMENT DES JOURNAUX : les journaux
 * d'un hébergeur se lisent quand on sait où regarder et quand on a
 * déjà provoqué l'envoi. Ici, UN SEUL APPEL dit tout l'état de la
 * chaîne — la clé est-elle là, quel expéditeur part, l'adresse de
 * l'API a-t-elle été détournée — et, si on le lui demande, TENTE UN
 * VRAI ENVOI et recopie la réponse de Resend telle quelle.
 * ⚠️ C'EST LA SEULE PREUVE POSSIBLE D'UN ENVOI RÉEL, et il faut le
 * dire : l'atelier où ce code est écrit n'a pas la clé Resend (règle
 * nº 697 — elle ne vit que sur le Mac du propriétaire). Aucun banc
 * d'ici ne peut donc envoyer pour de bon. Cette route le peut, là-bas,
 * en une seconde.
 *
 * DEUX EMPLOIS :
 *  · `GET  /api/admin/yokofolio/diagnostic-courriel`
 *    → l'état de la chaîne, sans rien envoyer ;
 *  · `POST` avec `{ "destinataire": "…" }`
 *    → le même état, PLUS un envoi réel à cette adresse et la réponse
 *      brute de Resend.
 *
 * ⚠️ RÉSERVÉE À L'ADMINISTRATION (`verifierAdmin`) : elle dit quel
 * expéditeur part et peut écrire à qui on lui nomme.
 * ⚠️ ELLE NE MONTRE JAMAIS LA CLÉ — seulement si elle est là, et sa
 * longueur. C'est la règle du dépôt sur les secrets, sans exception.
 *
 * ██ §1 (nº 831) — ELLE DIT AUSSI D'OÙ VIENNENT LES VARIABLES ██
 * La nº 830 avait répondu « la clé est absente » ; le propriétaire a
 * alors montré qu'elle est bien posée chez Vercel. Il manquait la
 * moitié de la réponse : LA SOURCE. `diagnosticVariables` la donne —
 * hébergeur ou fichier `.env` monté avec le dossier — et signale les
 * deux pièges de saisie déjà vus (valeur vide, valeur qui répète le
 * nom). Le bloc s'ajoute aux DEUX emplois ci-dessous, parce que la
 * question se pose autant avant un envoi qu'après.
 */

export async function GET() {
  const refus = await verifierAdmin();
  if (refus) {
    return NextResponse.json(
      { ok: false, message: refus.message },
      { status: refus.statut }
    );
  }
  return NextResponse.json({
    ok: true,
    ...(await diagnosticCourriel()),
    chaine: diagnosticVariables(),
  });
}

export async function POST(requete: NextRequest) {
  const refus = await verifierAdmin();
  if (refus) {
    return NextResponse.json(
      { ok: false, message: refus.message },
      { status: refus.statut }
    );
  }
  const corps = (await requete.json().catch(() => null)) as {
    destinataire?: string;
  } | null;
  const destinataire = corps?.destinataire?.trim();
  if (!destinataire || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(destinataire)) {
    return NextResponse.json(
      { ok: false, message: "Give a recipient to write to." },
      { status: 400 }
    );
  }
  return NextResponse.json({
    ok: true,
    ...(await diagnosticCourriel(destinataire)),
    chaine: diagnosticVariables(),
  });
}
