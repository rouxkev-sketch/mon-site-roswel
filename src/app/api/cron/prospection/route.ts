import { NextResponse } from "next/server";
import { PLANIFICATION_ENVOI } from "@/config/roswel";
import { envoyerCeQuiEstDu } from "@/lib/prospection-envoi";

/**
 * TÂCHE PLANIFIÉE — ENVOI DES MESSAGES DE PROSPECTION
 * ---------------------------------------------------
 * C'est la seule partie de la prospection qui tourne EN PRODUCTION.
 * Elle regarde la file d'attente (`prochain_envoi_le`), envoie ce qui
 * est dû, et se rendort. Mon navigateur peut être fermé, mon
 * ordinateur éteint.
 *
 * PROTECTION : un secret, et lui seul. Deux façons de le présenter :
 *  - « Authorization: Bearer <secret> » — ce que Vercel envoie tout
 *    seul quand la variable CRON_SECRET existe sur le projet ;
 *  - « x-cron-secret: <secret> » — pour un planificateur extérieur
 *    (cron-job.org, GitHub Actions) ou un essai à la main.
 *
 * Sans secret configuré, la route REFUSE de travailler : mieux vaut
 * une tâche qui ne tourne pas qu'une adresse qui permet à n'importe
 * qui de vider la file d'attente.
 *
 * ⚠️ RYTHME — le plan Vercel Hobby n'autorise qu'UNE exécution par
 * jour et par tâche. L'étalement dans la journée suppose donc un
 * planificateur extérieur ; voir PLANIFICATION_ENVOI dans
 * src/config/roswel.ts. La route, elle, se comporte correctement dans
 * les deux cas : appelée une fois, elle vide la file du jour ;
 * appelée toutes les quinze minutes, elle n'envoie que ce qui est dû.
 *
 * Essai manuel :
 *   curl -H "x-cron-secret: LE_SECRET" http://localhost:3000/api/cron/prospection
 */

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Comparaison à durée CONSTANTE (pas de secret devinable au chrono). */
function memeSecret(recu: string, attendu: string): boolean {
  if (recu.length !== attendu.length) return false;
  let difference = 0;
  for (let i = 0; i < recu.length; i += 1) {
    difference |= recu.charCodeAt(i) ^ attendu.charCodeAt(i);
  }
  return difference === 0;
}

function secretPresente(request: Request): string | null {
  const entete = request.headers.get("authorization");
  if (entete?.startsWith("Bearer ")) return entete.slice(7).trim();
  return request.headers.get("x-cron-secret");
}

export async function GET(request: Request) {
  const attendu = process.env.CRON_SECRET;
  if (!attendu) {
    console.error(
      "[cron prospection] REFUSÉ : la variable CRON_SECRET n'est pas configurée."
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
    console.warn("[cron prospection] REFUSÉ : secret absent ou incorrect.");
    return NextResponse.json({ ok: false, message: "Accès refusé." }, { status: 401 });
  }

  // Une panne (base injoignable, clé absente) doit ressortir en JSON
  // lisible dans le tableau de bord de l'hébergeur, jamais en page
  // d'erreur : c'est ce message-là qu'on lira à 7 h du matin.
  let resultat;
  try {
    resultat = await envoyerCeQuiEstDu();
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error(`[cron prospection] ERREUR : ${detail}`);
    return NextResponse.json(
      { ok: false, message: `Envoi impossible : ${detail}` },
      { status: 500 }
    );
  }

  // Le journal de l'hébergeur garde une trace de CHAQUE envoi : c'est
  // là qu'on regarde en premier si un artisan dit n'avoir rien reçu,
  // ou en avoir reçu deux.
  console.log(
    `[cron prospection] ${resultat.envoyes} envoyé(s), ` +
      `${resultat.simules} simulé(s), ${resultat.echecs} échec(s), ` +
      `${resultat.ignores} ignoré(s)` +
      (resultat.horsPlage ? " · HORS PLAGE" : "") +
      ` · ${PLANIFICATION_ENVOI.executionsParJour} exécution(s)/jour prévue(s)`
  );
  for (const ligne of resultat.journal) {
    console.log(
      `[cron prospection]   ${ligne.action} · ${ligne.entreprise} · ${ligne.detail}`
    );
  }

  return NextResponse.json(
    {
      ok: resultat.ok,
      message: resultat.message,
      envoyes: resultat.envoyes,
      simules: resultat.simules,
      echecs: resultat.echecs,
      ignores: resultat.ignores,
      restants: resultat.restants,
      horsPlage: resultat.horsPlage,
      journal: resultat.journal,
    },
    { status: resultat.ok ? 200 : 500 }
  );
}
