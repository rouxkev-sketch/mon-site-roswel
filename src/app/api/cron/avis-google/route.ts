import { NextResponse } from "next/server";
import { rafraichirAvisGoogle } from "@/lib/google-rafraichissement";
import { journaliserAppelsGoogle } from "@/lib/journal-google";

/**
 * TÂCHE PLANIFIÉE — RAFRAÎCHISSEMENT DES AVIS GOOGLE
 * ---------------------------------------------------
 * Contrairement aux outils de /admin, cette route tourne EN
 * PRODUCTION : c'est l'hébergeur (Vercel Cron, déclaré dans
 * vercel.json) qui l'appelle chaque jour, sans navigateur ouvert.
 *
 * Elle est donc protégée par un SECRET, et par lui seul. Deux façons
 * de le présenter, toutes deux acceptées :
 *  - « Authorization: Bearer <secret> » — c'est ce que Vercel envoie
 *    tout seul quand la variable CRON_SECRET existe sur le projet ;
 *  - « x-cron-secret: <secret> » — pratique pour un essai à la main.
 *
 * Sans secret configuré sur l'hébergement, la route REFUSE de
 * travailler : mieux vaut une tâche qui ne tourne pas qu'une adresse
 * ouverte à tous, chaque appel étant facturé par Google.
 *
 * Essai manuel :
 *   curl -H "x-cron-secret: LE_SECRET" https://roswel.fr/api/cron/avis-google
 */

// Borne de sécurité : l'exécution ne peut pas s'éterniser (et donc
// coûter) si Google répond très lentement.
export const maxDuration = 60;

// Rien ne doit être mis en cache : la tâche écrit en base.
export const dynamic = "force-dynamic";

/**
 * Comparaison à durée CONSTANTE : on compare toujours toute la
 * chaîne, sans s'arrêter au premier caractère différent. Cela évite
 * qu'un attaquant devine le secret en mesurant le temps de réponse.
 */
function memeSecret(recu: string, attendu: string): boolean {
  if (recu.length !== attendu.length) return false;
  let difference = 0;
  for (let i = 0; i < recu.length; i += 1) {
    difference |= recu.charCodeAt(i) ^ attendu.charCodeAt(i);
  }
  return difference === 0;
}

/** Le secret présenté par l'appelant, quelle que soit la forme. */
function secretPresente(request: Request): string | null {
  const entete = request.headers.get("authorization");
  if (entete?.startsWith("Bearer ")) return entete.slice(7).trim();
  return request.headers.get("x-cron-secret");
}

export async function GET(request: Request) {
  const attendu = process.env.CRON_SECRET;
  if (!attendu) {
    console.error(
      "[cron avis-google] REFUSÉ : la variable CRON_SECRET n'est pas configurée."
    );
    return NextResponse.json(
      {
        ok: false,
        message:
          "Tâche désactivée : la variable CRON_SECRET n'est pas configurée sur l'hébergement.",
      },
      { status: 503 }
    );
  }

  const recu = secretPresente(request);
  if (!recu || !memeSecret(recu, attendu)) {
    console.warn("[cron avis-google] REFUSÉ : secret absent ou incorrect.");
    return NextResponse.json(
      { ok: false, message: "Accès refusé." },
      { status: 401 }
    );
  }

  const resultat = await rafraichirAvisGoogle();

  // LE JOURNAL DES APPELS. Cette tâche ne fait qu'un type d'appel :
  // lire la note et le nombre d'avis d'une fiche connue — le palier
  // le plus cher, sur la franchise la plus basse (1 000 par mois).
  // C'est le SEUL des trois outils à tourner en production : sans
  // cette écriture, la plus grosse consommation du mois serait aussi
  // la plus invisible.
  await journaliserAppelsGoogle([
    {
      outil: "cron-avis-google",
      typeAppel: "details_avis",
      nombreAppels: resultat.appels,
      resultat: !resultat.ok ? "echec" : resultat.interrompu ? "partiel" : "ok",
      detail:
        `${resultat.misesAJour} mise(s) à jour` +
        (resultat.echecs > 0 ? ` · ${resultat.echecs} échec(s)` : ""),
    },
  ]);

  // Le journal de l'hébergeur garde une trace du NOMBRE D'APPELS
  // réellement facturés — c'est la ligne à relire en cas de doute
  // sur une facture Google.
  console.log(
    `[cron avis-google] ${resultat.appels} appel(s) Google · ` +
      `${resultat.misesAJour} mise(s) à jour · ${resultat.echecs} échec(s)` +
      (resultat.reutilisations > 0
        ? ` · ${resultat.reutilisations} sans appel`
        : "") +
      (resultat.restantes != null ? ` · ${resultat.restantes} restante(s)` : "") +
      (resultat.interrompu ? " · INTERROMPUE" : "")
  );

  return NextResponse.json(
    {
      ok: resultat.ok,
      message: resultat.message,
      appels: resultat.appels,
      misesAJour: resultat.misesAJour,
      echecs: resultat.echecs,
      reutilisations: resultat.reutilisations,
      restantes: resultat.restantes,
      resume: resultat.resume,
    },
    // Un échec doit se voir comme un échec dans le tableau de bord
    // de l'hébergeur, pas passer pour une exécution réussie.
    { status: resultat.ok ? 200 : 500 }
  );
}
