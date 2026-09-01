/**
 * LA ROUTE QUI RECUEILLE LES RELEVÉS DES SONDES (nº 174-§3)
 * =========================================================
 * LE PROBLÈME QU'ELLE RÉSOUT : le bouton « Copier » des sondes ne
 * fonctionne pas sur l'iPhone du propriétaire. Le presse-papiers d'iOS
 * refuse l'écriture dans plusieurs situations (page non sécurisée,
 * geste jugé trop indirect, vue web intégrée) — et le relevé, qui est
 * le seul témoin d'un défaut qu'on ne reproduit pas ici, n'arrivait
 * jamais.
 *
 * CE CHEMIN NE DÉPEND PLUS DU PRESSE-PAPIERS : le bouton ENVOYER poste
 * le journal ici, et le serveur l'ÉCRIT DANS UN FICHIER, à la racine
 * du projet. Un fichier par envoi, horodaté, jamais écrasé :
 *
 *     journal-<sonde>-<AAAA-MM-JJ-HHhMM-SS>.txt
 *
 * ██ §1 (nº 790) — LE VERROU ADMIN, À LA PLACE DU VERROU D'AMBIANCE ██
 * ------------------------------------------------------------------
 * ELLE RÉPONDAIT INTROUVABLE EN PRODUCTION, et ouvrait son disque à
 * QUICONQUE en développement. C'est désormais le COMPTE qui décide,
 * comme pour la page `/dev` et comme pour /admin — `verifierAdmin()`,
 * la session lue dans les cookies. Le refus est un 404 : la même
 * réponse que pour une adresse qui n'existe pas, connecté ou non.
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { verifierAdmin } from "@/lib/admin-yokofolio";

//  Elle écrit un fichier : il lui faut Node, et aucune mise en cache.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 400 000 caractères : très au-delà du plus long journal, et une borne
    tout de même — on n'écrit pas un fichier de taille inconnue. */
const TAILLE_MAXIMUM = 400_000;

/** Le nom de la sonde, réduit à ce qui peut vivre dans un nom de
    fichier. Rien de ce qui arrive du navigateur ne compose un chemin. */
function nomDeSondeSur(valeur: unknown): string {
  const brut = typeof valeur === "string" ? valeur : "";
  const propre = brut
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return propre || "sonde";
}

/** 2026-08-11-07h12-33 — lisible, triable, et valable sur tout système. */
function horodatage(): string {
  const d = new Date();
  const deux = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}` +
    `-${deux(d.getHours())}h${deux(d.getMinutes())}-${deux(d.getSeconds())}`
  );
}

export async function POST(requete: Request) {
  //  §1 (nº 790) — le verrou admin, avant toute lecture du corps.
  if (await verifierAdmin()) {
    return NextResponse.json({ erreur: "introuvable" }, { status: 404 });
  }

  const corps = (await requete.json().catch(() => null)) as {
    sonde?: unknown;
    texte?: unknown;
  } | null;

  const texte = typeof corps?.texte === "string" ? corps.texte : "";
  if (texte.trim() === "") {
    return NextResponse.json({ erreur: "journal vide" }, { status: 400 });
  }

  const sonde = nomDeSondeSur(corps?.sonde);
  const fichier = `journal-${sonde}-${horodatage()}.txt`;
  //  ⚠️ LE NOM EST RECOMPOSÉ ICI, à partir de morceaux déjà nettoyés :
  //  `basename` garantit qu'aucun chemin ne peut sortir de la racine.
  const chemin = path.join(process.cwd(), path.basename(fichier));

  const entete =
    `# Relevé de la sonde « ${sonde} »\n` +
    `# Écrit le ${new Date().toLocaleString("fr-FR")}\n` +
    `# ${texte.split("\n").length} lignes\n\n`;

  try {
    await writeFile(chemin, entete + texte.slice(0, TAILLE_MAXIMUM), "utf8");
  } catch (erreur) {
    return NextResponse.json(
      { erreur: erreur instanceof Error ? erreur.message : "écriture refusée" },
      { status: 500 }
    );
  }

  return NextResponse.json({ fichier, chemin });
}
