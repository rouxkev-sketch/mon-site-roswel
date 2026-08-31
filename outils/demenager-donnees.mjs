//  ██ nº 766 — COPIER LES LIGNES DE L'ANCIEN PROJET VERS LE NOUVEAU ██
//  ==================================================================
//  On ne le lance pas directement : `sh outils/demenager-donnees` s'en
//  charge. Tout ce qui explique QUOI et POURQUOI est écrit là-bas ;
//  ici, c'est le COMMENT.
//
//  ⚠️ ESSAI À BLANC PAR DÉFAUT. Sans `--reel`, il LIT l'ancien projet,
//  compte ce qu'il trouve, dit ce qu'il écrirait — et n'écrit rien.
//  C'est la règle de `reprendre-avatars` (nº 719), et elle a déjà
//  évité des dégâts.
//
//  ⚠️ IL N'EFFACE JAMAIS RIEN. Son seul verbe d'écriture est un
//  `POST` avec `Prefer: resolution=merge-duplicates` — autrement dit :
//  ajouter la ligne, ou la remplacer si elle existe déjà (même clé).
//  Aucun `DELETE`, aucun `PATCH` : c'est vérifiable en lisant le code,
//  il n'y a qu'une seule fonction qui écrit.
//
//  ⚠️ AUCUNE CLÉ N'EST AFFICHÉE, ni écrite dans un fichier, ni
//  consignée. Le script ne montre jamais que les ADRESSES des projets,
//  et encore, sans leur jeton.
import { readFile } from "node:fs/promises";
import path from "node:path";

const RACINE = process.cwd();
const REEL = process.argv.includes("--reel");
const TAILLE_PAGE = 1000;
const LOT_ECRITURE = 200;
const DELAI_MS = Math.max(10_000, Number(process.env.DELAI_LECTURE ?? 60) * 1000);

/* ==================================================================
   L'ORDRE DES TABLES — ET IL N'EST PAS DÉCORATIF
   ==================================================================
   Une ligne de `photos_tatoueur` pointe vers un `tatoueurs` ; une de
   `modes_exercice` vers une `conventions`. Écrite avant sa cible, elle
   est REFUSÉE par la base — et c'est tant mieux, mais il faut donc
   servir dans l'ordre des dépendances.
   ⚠️ CET ORDRE N'EST PAS DEVINÉ : il a été relevé sur le graphe des
   CLÉS ÉTRANGÈRES de la base rejouée (nº 766), table par table.
   ⚠️ ET TOUT CE QUI POINTE VERS UN COMPTE (`auth.users`) SUPPOSE LES
   COMPTES DÉJÀ RECRÉÉS — c'est-à-dire `outils/restaurer-comptes`
   AVANT celui-ci. Sinon la moitié des lignes sera refusée, proprement
   mais entièrement. */
const ORDRE = [
  "tatoueurs",
  "conventions",
  "modes_exercice",
  "liaisons_artiste_salon",
  "photos_tatoueur",
  "studios",
  "demarchages",
  "demarchage_fiches",
  "notifications_compte",
  "favoris_photos",
  "suggestions_style",
  "tatoueurs_suivis",
  "suppressions_comptes",
  "visites_selection",
  //  Sans aucune clé étrangère : elles peuvent venir n'importe quand.
  "clics_fiches",
  "messages_yokofolio",
  "signalements_fiches",
];

/* ==================================================================
   LES DEUX ACCÈS — la source dans .env.local, la cible dans
   l'environnement de la commande
   ================================================================== */

/** L'ancien projet : celui que le site emploie aujourd'hui. */
async function accesSource() {
  let texte = "";
  try {
    texte = await readFile(path.join(RACINE, ".env.local"), "utf8");
  } catch {
    /*  Pas de fichier : on se rabat sur l'environnement. */
  }
  const lu = {};
  for (const ligne of texte.split("\n")) {
    const nette = ligne.trim();
    if (!nette || nette.startsWith("#")) continue;
    const coupure = nette.indexOf("=");
    if (coupure < 1) continue;
    let valeur = nette.slice(coupure + 1).trim();
    if (
      (valeur.startsWith('"') && valeur.endsWith('"')) ||
      (valeur.startsWith("'") && valeur.endsWith("'"))
    ) {
      valeur = valeur.slice(1, -1);
    }
    lu[nette.slice(0, coupure).trim()] = valeur;
  }
  for (const cle of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY"]) {
    if (process.env[cle]) lu[cle] = process.env[cle];
  }
  return { url: lu.NEXT_PUBLIC_SUPABASE_URL, cle: lu.SUPABASE_SECRET_KEY };
}

/** Le nouveau projet : nommé sur la ligne de commande, jamais écrit
    dans un fichier du dépôt. */
function accesCible() {
  return { url: process.env.CIBLE_URL, cle: process.env.CIBLE_SECRET_KEY };
}

function fabriquerLeFacteur(url, cle) {
  const enTetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  return async function appeler(chemin, options = {}) {
    const controle = new AbortController();
    const minuterie = setTimeout(() => controle.abort(), DELAI_MS);
    try {
      return await fetch(`${url}${chemin}`, {
        ...options,
        headers: { ...enTetes, ...(options.headers ?? {}) },
        signal: controle.signal,
      });
    } finally {
      clearTimeout(minuterie);
    }
  };
}

/** L'adresse d'un projet, sans rien qui ressemble à un jeton. */
const nomDuProjet = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return "(adresse illisible)";
  }
};

/** POURQUOI ÇA N'A PAS RÉPONDU, EN FRANÇAIS. « TypeError: fetch
    failed » ne dit rien à personne : c'est le message de Node quand
    la machine d'en face n'a pas répondu. On le traduit — un compte
    rendu qu'on ne comprend pas est un compte rendu qu'on ignore. */
function raisonLisible(erreur) {
  const texte = String(erreur?.message ?? erreur);
  if (/abort/i.test(texte)) return "trop lent, la demande a été abandonnée";
  if (/fetch failed|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT/i.test(texte)) {
    return "projet injoignable (adresse fausse, ou pas de réseau)";
  }
  return texte.slice(0, 120);
}

/* ==================================================================
   LIRE — page par page, sans jamais tout charger d'un coup
   ================================================================== */

async function lireTout(appeler, table) {
  const lignes = [];
  for (let depart = 0; depart < 200_000; depart += TAILLE_PAGE) {
    const fin = depart + TAILLE_PAGE - 1;
    let reponse;
    try {
      reponse = await appeler(`/rest/v1/${table}?select=*`, {
        headers: { Range: `${depart}-${fin}`, "Range-Unit": "items" },
      });
    } catch (erreur) {
      return { lignes: null, erreur: raisonLisible(erreur) };
    }
    if (!reponse.ok) {
      const message = await reponse.text().catch(() => "");
      return { lignes: null, erreur: `HTTP ${reponse.status} ${message.slice(0, 120)}` };
    }
    const lot = await reponse.json().catch(() => []);
    if (!Array.isArray(lot) || lot.length === 0) break;
    lignes.push(...lot);
    if (lot.length < TAILLE_PAGE) break;
  }
  return { lignes, erreur: null };
}

/* ==================================================================
   ÉCRIRE — L'UNIQUE FONCTION QUI TOUCHE LA CIBLE
   ==================================================================
   `resolution=merge-duplicates` : une ligne déjà présente (même clé)
   est REMPLACÉE, pas dupliquée. C'est ce qui rend le script
   REJOUABLE — si la copie s'interrompt, on la relance sans rien
   nettoyer.
   ================================================================== */

async function ecrireUnLot(appeler, table, lot) {
  const reponse = await appeler(`/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(lot),
  });
  if (!reponse.ok) {
    const message = await reponse.text().catch(() => "");
    return `HTTP ${reponse.status} ${message.slice(0, 200)}`;
  }
  return null;
}

/* ==================================================================
   LE PASSAGE
   ================================================================== */

async function principal() {
  const source = await accesSource();
  const cible = accesCible();

  if (!source.url || !source.cle) {
    console.log("  ✖  Il manque l'accès à l'ANCIEN projet.");
    console.log("     Attendu dans .env.local : NEXT_PUBLIC_SUPABASE_URL et");
    console.log("     SUPABASE_SECRET_KEY (la clé se remet avec `sh livre`).");
    process.exit(1);
  }
  if (!cible.url || !cible.cle) {
    console.log("  ✖  Il manque l'accès au NOUVEAU projet.");
    console.log("     Donne-les sur la ligne de commande, sans les écrire");
    console.log("     dans un fichier :");
    console.log();
    console.log("       CIBLE_URL='https://…supabase.co' \\");
    console.log("       CIBLE_SECRET_KEY='…' \\");
    console.log("         sh outils/demenager-donnees");
    process.exit(1);
  }
  if (source.url === cible.url) {
    console.log("  ✖  La source et la cible sont le MÊME projet. Rien à faire.");
    process.exit(1);
  }

  const lire = fabriquerLeFacteur(source.url, source.cle);
  const ecrire = fabriquerLeFacteur(cible.url, cible.cle);

  console.log();
  console.log("  ██ DÉMÉNAGEMENT DES LIGNES ██");
  console.log(`     depuis : ${nomDuProjet(source.url)}`);
  console.log(`     vers   : ${nomDuProjet(cible.url)}`);
  console.log(
    REEL
      ? "     MODE RÉEL — les lignes seront écrites."
      : "     ESSAI À BLANC — rien ne sera écrit. (Ajoute --reel pour agir.)"
  );
  console.log();

  let totalLu = 0;
  let totalEcrit = 0;
  const soucis = [];

  for (const table of ORDRE) {
    const { lignes, erreur } = await lireTout(lire, table);
    if (erreur) {
      soucis.push(`${table} : lecture impossible — ${erreur}`);
      console.log(`  ✖  ${table.padEnd(24)} lecture impossible — ${erreur}`);
      continue;
    }
    totalLu += lignes.length;
    if (lignes.length === 0) {
      console.log(`  ·  ${table.padEnd(24)} vide`);
      continue;
    }
    if (!REEL) {
      console.log(`  →  ${table.padEnd(24)} ${String(lignes.length).padStart(6)} ligne(s) à écrire`);
      continue;
    }
    let ecrites = 0;
    let echec = null;
    for (let i = 0; i < lignes.length && !echec; i += LOT_ECRITURE) {
      const lot = lignes.slice(i, i + LOT_ECRITURE);
      try {
        echec = await ecrireUnLot(ecrire, table, lot);
      } catch (erreurEcriture) {
        echec = raisonLisible(erreurEcriture);
      }
      if (!echec) ecrites += lot.length;
    }
    totalEcrit += ecrites;
    if (echec) {
      soucis.push(`${table} : ${echec}`);
      console.log(`  ✖  ${table.padEnd(24)} ${ecrites}/${lignes.length} écrite(s) — ${echec}`);
    } else {
      console.log(`  ✔  ${table.padEnd(24)} ${String(ecrites).padStart(6)} ligne(s) écrite(s)`);
    }
  }

  console.log();
  console.log(`  ── lues : ${totalLu} · écrites : ${REEL ? totalEcrit : 0}`);
  if (soucis.length > 0) {
    console.log();
    console.log("  ⚠️  CE QUI N'EST PAS PASSÉ :");
    for (const s of soucis) console.log(`     · ${s}`);
    console.log();
    console.log("     La cause la plus fréquente : un COMPTE qui n'existe pas");
    console.log("     encore dans le nouveau projet. Passe d'abord");
    console.log("     `sh outils/restaurer-comptes`, puis relance celui-ci —");
    console.log("     il est rejouable, rien ne sera écrit en double.");
  } else if (!REEL) {
    console.log();
    console.log("  Pour agir : ajoute --reel à la fin de la commande.");
  }
  console.log();
}

principal().catch((erreur) => {
  console.log(`  ✖  ${raisonLisible(erreur)}`);
  process.exit(1);
});
