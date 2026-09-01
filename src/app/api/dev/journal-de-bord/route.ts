/**
 * LA ROUTE DU JOURNAL DE BORD (nº 272-§2) — l'oreille côté serveur
 * =================================================================
 * Elle reçoit les lignes de src/lib/journal-de-bord et les AJOUTE,
 * une par une, à `journal-de-bord.ndjson` à la racine du projet — le
 * même toit que les relevés des sondes (nº 174). AU FIL DE L'EAU :
 * chaque ligne est écrite dès qu'elle arrive (`appendFile`), jamais
 * en fin de session — c'est ce qui fait qu'un plantage, un écran
 * noir ou une fermeture brutale n'effacent RIEN de ce qui précède.
 *
 * CHAQUE LIGNE EST UN JSON AUTONOME (NDJSON) : l'heure du serveur,
 * l'événement du navigateur tel quel, et la présence du cookie de
 * session VUE DU SERVEUR — c'est la moitié qui manquait au relevé du
 * drame : savoir si, au moment du clignotement, le serveur voyait
 * encore une session.
 *
 * ██ §1 (nº 790) — LE VERROU ADMIN, À LA PLACE DU VERROU D'AMBIANCE ██
 * ------------------------------------------------------------------
 * ELLE RÉPONDAIT INTROUVABLE EN PRODUCTION, et ouvrait son disque à
 * QUICONQUE en développement — sauf si le propriétaire posait
 * `JOURNAL_DE_BORD=1` pour instrumenter une version en ligne, ce qui
 * la rouvrait alors à tout le monde, en ligne. Les deux réglages
 * partent : c'est désormais le COMPTE qui décide, comme pour la page
 * `/dev` et comme pour /admin — `verifierAdmin()`, la session lue dans
 * les cookies. Le propriétaire garde donc ce qu'il voulait (écrire un
 * journal depuis une version en ligne) sans que personne d'autre ne
 * l'obtienne, et l'atelier n'a plus de porte ouverte par défaut.
 *
 * ⚠️ REFUS = INTROUVABLE : la même réponse que pour une adresse qui
 * n'existe pas, connecté ou non. Une route d'atelier ne s'annonce pas.
 * ⚠️ ET JAMAIS UNE ERREUR VERS LE NAVIGATEUR : le journal observe le
 * site, il ne doit pas pouvoir le perturber — une écriture qui rate
 * répond « ok » quand même.
 */

import { appendFile, rename, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { verifierAdmin } from "@/lib/admin-yokofolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Une ligne raisonnable : au-delà, c'est tronqué, jamais refusé. */
const LIGNE_MAXIMUM = 4_000;
/** Au-delà de 2 Mo, le fichier bascule en `.1` : une génération de
    garde, et le journal courant repart léger. */
const TAILLE_ROTATION = 2 * 1024 * 1024;

const FICHIER = "journal-de-bord.ndjson";

export async function POST(requete: Request) {
  //  §1 (nº 790) — le verrou admin, avant toute lecture du corps.
  if (await verifierAdmin()) {
    return NextResponse.json({ erreur: "introuvable" }, { status: 404 });
  }

  try {
    const brut = (await requete.text()).slice(0, LIGNE_MAXIMUM);
    if (!brut.trim()) return NextResponse.json({ ok: true });

    //  L'événement du navigateur, relu — et jamais cru sur parole :
    //  illisible, il est gardé comme texte brut, pour ne rien perdre.
    let evenement: Record<string, unknown>;
    try {
      evenement = JSON.parse(brut) as Record<string, unknown>;
    } catch {
      evenement = { genre: "illisible", brut };
    }

    const ligne =
      JSON.stringify({
        recu_le: new Date().toISOString(),
        //  LA SESSION VUE DU SERVEUR — l'autre juge (le navigateur
        //  écrit la sienne dans `session_cookie`) : c'est l'écart
        //  entre les deux qui raconte une session à moitié morte.
        session_vue_du_serveur: Boolean(
          requete.headers.get("cookie")?.includes("-auth-token")
        ),
        ...evenement,
      }) + "\n";

    const chemin = path.join(process.cwd(), FICHIER);
    try {
      const etat = await stat(chemin);
      if (etat.size > TAILLE_ROTATION) {
        await rename(chemin, path.join(process.cwd(), "journal-de-bord.1.ndjson"));
      }
    } catch {
      // Pas encore de fichier : la première ligne va le créer.
    }
    await appendFile(chemin, ligne, "utf8");
  } catch {
    // Une écriture qui rate ne remonte JAMAIS au navigateur.
  }
  return NextResponse.json({ ok: true });
}
