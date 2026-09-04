/**
 * ██ nº 810 — RELIRE LES LIEUX DÉJÀ EN BASE, EN ANGLAIS ██
 * ==================================================================
 * CE QUE LA nº 805 A FAIT, ET CE QU'ELLE A LAISSÉ. Depuis cette passe,
 * le géocodeur est interrogé en anglais (`lang=en`, lib/geocodage/
 * photon.ts) : une fiche enregistrée APRÈS porte « United States »,
 * « California ». Les fiches enregistrées AVANT portent encore les
 * noms français que le géocodeur rendait alors — « États-Unis »,
 * « Californie », « Bavière » — dans TROIS tables : `tatoueurs` (le
 * lieu de la fiche), `studios` (les adresses d'une enseigne) et
 * `modes_exercice` (les lieux d'un artiste). Ce script-ci les relit,
 * une fois.
 *
 * ██ CE QU'IL FAIT, POUR CHAQUE LIGNE QUI A UN POINT ██
 *  1. il demande au géocodeur CE QU'IL Y A À CE POINT, en anglais
 *     (`/reverse?lat=…&lon=…&lang=en`) — la même source, la même
 *     langue que le champ de saisie d'aujourd'hui ;
 *  2. il compare la RÉGION (`state`, à défaut `county` — la lecture
 *     exacte de photon.ts) et le PAYS (`country`) à ce que la ligne
 *     porte ;
 *  3. il réécrit SEULEMENT ces deux colonnes, et `code_pays` s'il
 *     manquait — jamais la ville, jamais la rue, jamais le code postal,
 *     jamais une limace, jamais un point. La ville est un NOM (« Paris »
 *     se dit « Paris »), la rue est un nom (« Rue Trousseau » ne se
 *     traduit pas), et les limaces font les adresses publiques
 *     (/tattoo/<style>/<ville>) : y toucher casserait le
 *     référencement acquis ;
 *  4. il REFUSE d'écrire quand le géocodeur ne répond pas au point ce
 *     que la ligne dit du pays (`countrycode` ≠ `code_pays`) : un point
 *     posé au mauvais endroit ne doit pas recevoir un pays qui ment.
 *
 * ██ POURQUOI LA RÉGION COMPTE, ET PAS SEULEMENT POUR L'ŒIL ██
 * La recherche par région (`rechercher_tatoueurs`, niveau « region »)
 * compare le NOM normalisé : « californie » ≠ « california ». Depuis la
 * nº 805, une recherche « California » ne trouve donc plus une fiche
 * écrite « Californie » avant. Réécrire la région dans les mots exacts
 * du géocodeur, c'est rendre ces fiches à la recherche. Le pays, lui,
 * se cherche par son CODE (`p_code_pays`) : sa réécriture n'est que
 * d'affichage — et d'honnêteté de la donnée.
 *
 * ⚠️ RELANÇABLE SANS DÉGÂT : une ligne déjà dans les mots du géocodeur
 * n'est pas réécrite. Relancer dix fois de suite ne fait rien de plus
 * que la première.
 * ⚠️ ESSAI À BLANC PAR DÉFAUT : sans `--reel`, il n'écrit rien nulle
 * part — il dit ce qu'il ferait, ligne par ligne, et s'arrête là.
 * ⚠️ UNE REQUÊTE PAR SECONDE, PAS PLUS : le géocodeur public est
 * gratuit et partagé (`PAUSE_MS`, réglable par `PAUSE_RELECTURE`).
 * ⚠️ AUCUN NOM N'EST RECOPIÉ ICI : ni table de pays, ni table de
 * régions — c'est le géocodeur qui parle, en anglais, comme pour une
 * fiche neuve. Le SQL de docs/SQL-810-LOCALITES.md fait le même travail
 * SANS géocodeur, avec des tables de correspondance : à Kevin de
 * choisir la voie ; les deux se relancent sans dégât.
 *
 * ██ LA CLÉ DE SERVICE ██
 * Elle est lue dans l'environnement ou dans `.env.local`, et elle
 * n'est JAMAIS affichée, ni écrite, ni consignée — pas même tronquée.
 * Le script dit seulement si elle est présente.
 *
 * ══ COMMENT ON S'EN SERT ══
 *     node outils/relire-les-lieux-en-anglais.mjs            (essai à blanc)
 *     node outils/relire-les-lieux-en-anglais.mjs --reel     (le vrai passage)
 *     --tables=tatoueurs,studios     (par défaut : les trois tables)
 *     --limite=20                    (s'arrêter après N lignes relues)
 *     PHOTON_URL=https://…/          (un autre Photon ; défaut : komoot)
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const REEL = process.argv.includes("--reel");
const option = (nom) => {
  const trouve = process.argv.find((a) => a.startsWith(`--${nom}=`));
  return trouve ? trouve.slice(nom.length + 3) : null;
};

/** Les trois tables qui portent un lieu, et le nom de leurs colonnes.
    ⚠️ `tatoueurs` dit la ville `ville_nom`, les deux autres `ville` —
    c'est la base qui est ainsi (migration nº 26). */
const TABLES = {
  tatoueurs: { nom: "nom", ville: "ville_nom" },
  studios: { nom: "intitule", ville: "ville" },
  modes_exercice: { nom: "intitule", ville: "ville" },
};
const tablesDemandees = (option("tables") ?? Object.keys(TABLES).join(","))
  .split(",")
  .map((t) => t.trim())
  .filter(Boolean);
const LIMITE = Number(option("limite") ?? 0) || Infinity;

/** Le géocodeur — le même que le site (photon.ts), surchargeable. */
const PHOTON = (process.env.PHOTON_URL ?? "https://photon.komoot.io/").replace(/\/+$/, "");
/** Une requête par seconde, pas plus. */
const PAUSE_MS = Math.max(0, Number(process.env.PAUSE_RELECTURE ?? 1100));
const DELAI_MS = 15_000;
const PAGE = 500;

/* ==================================================================
 * 1 · LES ACCÈS — lus, jamais écrits
 * ================================================================== */

/** Le format de `.env.local` : `CLE=valeur`. Ce qui est dans
    l'environnement gagne sur le fichier — la convention du projet
    (voir outils/reprendre-avatars.mjs, même lecture). */
async function lireLesAcces() {
  let texte;
  try {
    texte = await readFile(path.join(RACINE, ".env.local"), "utf8");
  } catch {
    texte = process.env.NEXT_PUBLIC_SUPABASE_URL ? "" : null;
    if (texte === null) return null;
  }
  const acces = {};
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
    acces[nette.slice(0, coupure).trim()] = valeur;
  }
  for (const cle of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY"]) {
    if (process.env[cle]) acces[cle] = process.env[cle];
  }
  return acces;
}

function fabriquerLeFacteur(url, cle) {
  const base = url.replace(/\/+$/, "");
  const enTetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  return async function appeler(chemin, options = {}) {
    return fetch(base + chemin, {
      ...options,
      headers: { ...enTetes, ...(options.headers ?? {}) },
      signal: AbortSignal.timeout(DELAI_MS),
    });
  };
}

/* ==================================================================
 * 2 · LE GÉOCODEUR, EN ANGLAIS, AU POINT DE LA LIGNE
 * ================================================================== */

const propre = (valeur) => {
  const texte = String(valeur ?? "").trim();
  return texte.length > 0 ? texte : null;
};
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Ce que le géocodeur dit d'un point : région, pays, code. Null s'il
    ne sait pas. La lecture de la région est CELLE DE photon.ts
    (`state`, à défaut `county`) : ce script ne doit pas inventer une
    troisième façon de lire le même service. */
async function relireLePoint(latitude, longitude) {
  const adresse = new URL(`${PHOTON}/reverse`);
  adresse.searchParams.set("lat", String(latitude));
  adresse.searchParams.set("lon", String(longitude));
  adresse.searchParams.set("lang", "en");
  adresse.searchParams.set("limit", "1");
  const reponse = await fetch(adresse, { signal: AbortSignal.timeout(DELAI_MS) });
  if (!reponse.ok) throw new Error(`geocoder answered ${reponse.status}`);
  const donnees = await reponse.json();
  const p = donnees?.features?.[0]?.properties;
  if (!p) return null;
  return {
    region: propre(p.state) ?? propre(p.county),
    pays: propre(p.country),
    code_pays: propre(p.countrycode)?.toUpperCase() ?? null,
  };
}

/* ==================================================================
 * 3 · UNE LIGNE
 * ================================================================== */

/** Relit UNE ligne. Rend un compte rendu, et ne jette jamais : un
    échec sur une ligne ne doit pas arrêter les autres. */
async function relireUneLigne(table, ligne, appeler) {
  const colonnes = TABLES[table];
  const nom = ligne[colonnes.nom] ?? ligne[colonnes.ville] ?? ligne.id;
  const details = { table, nom };
  const latitude = Number(ligne.latitude);
  const longitude = Number(ligne.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) {
    return { etat: "sans point", ...details };
  }

  let lu;
  try {
    lu = await relireLePoint(latitude, longitude);
  } catch (erreur) {
    return { etat: "échec", ...details, raison: erreur?.message ?? String(erreur) };
  }
  if (!lu || (!lu.region && !lu.pays)) {
    return { etat: "échec", ...details, raison: "le géocodeur ne sait rien de ce point" };
  }

  //  LE GARDE-FOU : le point doit être dans le pays que la ligne dit.
  const codeLigne = propre(ligne.code_pays)?.toUpperCase() ?? null;
  if (codeLigne && lu.code_pays && codeLigne !== lu.code_pays) {
    return {
      etat: "ignorée",
      ...details,
      raison: `la ligne dit ${codeLigne}, le point est en ${lu.code_pays} — à regarder à la main`,
    };
  }

  const modifications = {};
  const dits = [];
  const regionAvant = propre(ligne.region);
  if (lu.region && lu.region !== regionAvant) {
    modifications.region = lu.region;
    dits.push(`region « ${regionAvant ?? ""} » → « ${lu.region} »`);
  }
  const paysAvant = propre(ligne.pays);
  if (lu.pays && lu.pays !== paysAvant) {
    modifications.pays = lu.pays;
    dits.push(`pays « ${paysAvant ?? ""} » → « ${lu.pays} »`);
  }
  if (!codeLigne && lu.code_pays) {
    modifications.code_pays = lu.code_pays;
    dits.push(`code_pays « » → « ${lu.code_pays} »`);
  }
  if (dits.length === 0) return { etat: "déjà en anglais", ...details };

  if (!REEL) return { etat: "à réécrire", ...details, raison: dits.join(" · ") };

  const reponse = await appeler(
    `/rest/v1/${table}?id=eq.${encodeURIComponent(ligne.id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(modifications),
    }
  );
  if (!reponse.ok) {
    return { etat: "échec", ...details, raison: `base refusée (${reponse.status}) — ligne inchangée` };
  }
  return { etat: "réécrite", ...details, raison: dits.join(" · ") };
}

/* ==================================================================
 * 4 · LE PASSAGE
 * ================================================================== */

async function lireLaTable(table, appeler) {
  const colonnes = TABLES[table];
  const lignes = [];
  for (let decalage = 0; ; decalage += PAGE) {
    const reponse = await appeler(
      `/rest/v1/${table}?select=id,${colonnes.nom},${colonnes.ville},region,pays,code_pays,latitude,longitude` +
        `&order=id.asc&limit=${PAGE}&offset=${decalage}`
    );
    if (!reponse.ok) throw new Error(`lecture de ${table} refusée (${reponse.status})`);
    const page = await reponse.json();
    lignes.push(...page);
    if (page.length < PAGE) break;
  }
  return lignes;
}

async function main() {
  const acces = await lireLesAcces();
  if (!acces?.NEXT_PUBLIC_SUPABASE_URL || !acces?.SUPABASE_SECRET_KEY) {
    console.error(
      "✖ Il manque les accès. Attendu dans .env.local (ou dans " +
        "l'environnement) : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY."
    );
    process.exitCode = 1;
    return;
  }
  const inconnues = tablesDemandees.filter((t) => !TABLES[t]);
  if (inconnues.length > 0) {
    console.error(`✖ Table(s) inconnue(s) : ${inconnues.join(", ")}. Connues : ${Object.keys(TABLES).join(", ")}.`);
    process.exitCode = 1;
    return;
  }
  const base = acces.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");
  //  ⚠️ ON DIT QU'ELLE EST LÀ, ON NE LA MONTRE PAS.
  console.log(`  base : ${base} · clé de service : présente`);
  console.log(`  géocodeur : ${PHOTON} (lang=en) · une requête toutes les ${PAUSE_MS} ms`);
  console.log(
    REEL
      ? "  MODE RÉEL — region, pays (et code_pays s'il manque) seront réécrits."
      : "  ESSAI À BLANC — rien ne sera écrit. (Ajoute --reel pour agir.)"
  );
  console.log("  Jamais touchés : ville, rue, code postal, limaces, points.\n");

  const appeler = fabriquerLeFacteur(base, acces.SUPABASE_SECRET_KEY);
  const bilan = { "à réécrire": 0, réécrite: 0, "déjà en anglais": 0, "sans point": 0, ignorée: 0, échec: 0 };
  let relues = 0;

  for (const table of tablesDemandees) {
    let lignes;
    try {
      lignes = await lireLaTable(table, appeler);
    } catch (erreur) {
      console.error(`✖ ${erreur?.message ?? erreur}`);
      process.exitCode = 1;
      return;
    }
    console.log(`── ${table} : ${lignes.length} ligne(s)`);
    for (const ligne of lignes) {
      if (relues >= LIMITE) break;
      let resultat;
      try {
        resultat = await relireUneLigne(table, ligne, appeler);
      } catch (erreur) {
        resultat = { etat: "échec", table, nom: ligne.id, raison: erreur?.message ?? String(erreur) };
      }
      bilan[resultat.etat] = (bilan[resultat.etat] ?? 0) + 1;
      if (resultat.etat !== "sans point") relues++;
      if (resultat.etat === "déjà en anglais" || resultat.etat === "sans point") continue;
      console.log(`   ${resultat.etat.padEnd(15)} ${resultat.nom}${resultat.raison ? ` — ${resultat.raison}` : ""}`);
      if (resultat.etat !== "sans point") await dormir(PAUSE_MS);
    }
    if (relues >= LIMITE) {
      console.log(`   (limite de ${LIMITE} lignes relues atteinte)`);
      break;
    }
  }

  console.log(
    `\n  Bilan : ${bilan["à réécrire"]} à réécrire · ${bilan.réécrite} réécrite(s) · ` +
      `${bilan["déjà en anglais"]} déjà en anglais · ${bilan["sans point"]} sans point · ` +
      `${bilan.ignorée} ignorée(s) · ${bilan.échec} échec(s)`
  );
  if (!REEL && bilan["à réécrire"] > 0) {
    console.log("  Rien n'a été écrit. Relance avec --reel pour réécrire ces lignes.");
  }
  if (bilan.échec > 0) process.exitCode = 1;
}

main().catch((erreur) => {
  console.error(`✖ ${erreur?.message ?? erreur}`);
  process.exitCode = 1;
});
