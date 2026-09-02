import { NextResponse } from "next/server";
import {
  DELAI_SUPPRESSION_JOURS,
  purgerComptesEchus,
  purgerFichesEchues,
} from "@/lib/suppression-compte";

/**
 * TÂCHE PLANIFIÉE — LA SUPPRESSION DÉFINITIVE
 * --------------------------------------------
 * C'est ELLE qui exécute, au bout des 30 jours, ce qu'une demande de
 * suppression avait seulement ANNONCÉ.
 *
 * DEUX LISTES, une seule tâche — un compte peut gérer plusieurs
 * fiches, et l'on peut vouloir n'en fermer qu'une :
 *  - LES COMPTES échus : photos, fiches (toutes) et compte de
 *    connexion ;
 *  - LES FICHES échues seules : la fiche et ses photos, le compte
 *    restant intact.
 * Les comptes passent EN PREMIER : effacer un compte emporte ses
 * fiches en cascade, la seconde liste n'a alors plus rien à y faire.
 *
 * POURQUOI UNE TÂCHE PLANIFIÉE, ET PAS UN DÉCLENCHEUR EN BASE ?
 * Parce que la suppression touche à TROIS choses qui ne vivent pas
 * dans la même table : le stockage des photos, la fiche, et le compte
 * de connexion (auth). Seule une clé de service peut faire les trois,
 * et elle ne s'utilise que depuis un serveur. Un déclencheur SQL, lui,
 * ne sait effacer que des lignes — il laisserait les photos derrière.
 *
 * ELLE TOURNE EN PRODUCTION, appelée par l'hébergeur (Vercel Cron,
 * déclaré dans vercel.json), une fois par jour. Elle est donc protégée
 * par un SECRET, et par lui seul — exactement comme les deux autres
 * tâches du projet. Deux façons de le présenter, toutes deux
 * acceptées :
 *  - « Authorization: Bearer <secret> » — ce que Vercel envoie tout
 *    seul quand la variable CRON_SECRET existe sur le projet ;
 *  - « x-cron-secret: <secret> » — pratique pour un essai à la main.
 *
 * Sans secret configuré, la route REFUSE de travailler : une adresse
 * qui efface des comptes ne s'ouvre pas au tout-venant.
 *
 * TOURNER UN JOUR EN RETARD N'EST PAS GRAVE : la liste des comptes à
 * purger (`purge_le <= now()`) rattrape d'elle-même les retards. Et
 * une reconnexion, elle, retire le compte de la liste — donc un
 * compte revenu ne peut PAS être effacé par une exécution tardive.
 *
 * Essai manuel :
 *   curl -H "x-cron-secret: LE_SECRET" https://…/api/cron/purge-comptes
 */

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Comparaison à durée CONSTANTE : on compare toujours toute la
    chaîne, sans s'arrêter au premier caractère différent. */
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
      "[cron purge-comptes] REFUSED: the CRON_SECRET variable is not configured."
    );
    return NextResponse.json(
      {
        ok: false,
        message:
          "Task disabled: the CRON_SECRET variable is not configured on the host.",
      },
      { status: 503 }
    );
  }

  const recu = secretPresente(request);
  if (!recu || !memeSecret(recu, attendu)) {
    console.warn("[cron purge-comptes] REFUSED: secret missing or incorrect.");
    return NextResponse.json(
      { ok: false, message: "Access denied." },
      { status: 401 }
    );
  }

  const resultat = await purgerComptesEchus();
  const fiches = await purgerFichesEchues();

  // Une trace dans le journal de l'hébergeur : une suppression
  // définitive ne doit jamais être silencieuse.
  console.log(
    `[cron purge-comptes] ${resultat.effaces} account(s) and ` +
      `${fiches.effacees} portfolio(s) deleted after ` +
      `${DELAI_SUPPRESSION_JOURS} days · ` +
      `${resultat.echecs.length + fiches.echecs.length} failure(s)`
  );

  return NextResponse.json({
    ok: resultat.echecs.length === 0 && fiches.echecs.length === 0,
    effaces: resultat.effaces,
    fichesEffacees: fiches.effacees,
    echecs: [...resultat.echecs, ...fiches.echecs],
    delaiJours: DELAI_SUPPRESSION_JOURS,
  });
}
