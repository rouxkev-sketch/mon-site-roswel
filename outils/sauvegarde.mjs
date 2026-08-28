//  ██ LA SAUVEGARDE DE LA BASE — passe nº 689 ██
//  ==================================================================
//  On ne le lance pas directement : `sh outils/sauvegarde` s'en charge
//  (il vérifie Node avant). Tout ce qui explique QUOI et POURQUOI est
//  écrit là-bas ; ici, c'est le COMMENT.
//
//  ⚠️ LECTURE SEULE, ET C'EST UNE RÈGLE, PAS UNE INTENTION. Ce fichier
//  n'écrit rien dans la base. Les seules écritures sont des fichiers
//  sur le disque, dans `sauvegardes/`.
//  Une exception d'APPARENCE, qu'il faut nommer : lister les fichiers
//  du stockage se fait par un `POST /storage/v1/object/list/...`.
//  C'est l'API de Supabase qui l'impose (la liste prend des critères
//  dans un corps de requête) ; ce POST LIT, il ne range rien.
//
//  ⚠️ POURQUOI L'API ET PAS `pg_dump`. `pg_dump` demande le mot de
//  passe Postgres du projet — il n'est PAS dans `.env.local`, et il
//  faudrait l'y ajouter (donc un secret de plus à garder, dans un
//  fichier qui voyage dans les zips). L'API, elle, se contente de la
//  clé de service DÉJÀ présente, et ne demande RIEN à installer :
//  Node suffit. Ce que `pg_dump` donnerait en plus — la FORME des
//  tables — est déjà dans le dépôt (`supabase/*.sql`), donc dans
//  chaque zip.
//
//  ⚠️ CE QUE ÇA NE REMPLACE PAS, DIT FRANCHEMENT : une sauvegarde
//  faite à la main est une sauvegarde qu'on oublie de faire. Celle-ci
//  vaut ce que vaut la régularité de son lanceur. Elle est là parce
//  que le plan gratuit de Supabase n'en fait aucune — c'est mieux que
//  rien, ce n'est pas une sauvegarde continue.

import { createWriteStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";

const RACINE = process.cwd();
const TAILLE_PAGE = 1000;

/* ==================================================================
   1 · LES ACCÈS — lus dans `.env.local`, jamais écrits nulle part
   ================================================================== */

/** Le format de `.env.local` : `CLE=valeur`, une par ligne. On ne
    dépend d'aucune bibliothèque pour ça — c'est dix lignes.
    ⚠️ CE QUI EST DANS L'ENVIRONNEMENT GAGNE sur le fichier, et c'est
    la convention de tout le projet (le banc lance déjà le site avec
    `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3222`). C'est ce qui
    permet d'éprouver cet outil contre la doublure sans toucher au
    `.env.local` du propriétaire — donc sans risquer de le laisser
    modifié. En usage normal, l'environnement est vide et le fichier
    décide, comme prévu. */
async function lireLesAcces() {
  let texte;
  try {
    texte = await readFile(path.join(RACINE, ".env.local"), "utf8");
  } catch {
    //  Pas de fichier : l'environnement peut suffire (le banc).
    texte = process.env.NEXT_PUBLIC_SUPABASE_URL ? "" : null;
    if (texte === null) return null;
  }
  const acces = {};
  for (const ligne of texte.split("\n")) {
    const nette = ligne.trim();
    if (!nette || nette.startsWith("#")) continue;
    const coupure = nette.indexOf("=");
    if (coupure < 1) continue;
    const cle = nette.slice(0, coupure).trim();
    let valeur = nette.slice(coupure + 1).trim();
    if (
      (valeur.startsWith('"') && valeur.endsWith('"')) ||
      (valeur.startsWith("'") && valeur.endsWith("'"))
    ) {
      valeur = valeur.slice(1, -1);
    }
    acces[cle] = valeur;
  }
  for (const cle of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY"]) {
    if (process.env[cle]) acces[cle] = process.env[cle];
  }
  return acces;
}

/* ==================================================================
   2 · PARLER À SUPABASE
   ================================================================== */

function fabriquerLeFacteur(url, cle) {
  const enTetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  return async function appeler(chemin, options = {}) {
    const reponse = await fetch(url.replace(/\/+$/, "") + chemin, {
      ...options,
      headers: { ...enTetes, ...(options.headers ?? {}) },
    });
    return reponse;
  };
}

/**
 * LA LISTE DES TABLES — demandée à la base, pas écrite à la main.
 * PostgREST publie à sa racine un document qui décrit TOUT ce qu'il
 * expose : une entrée par table et par vue. C'est la seule liste qui
 * ne puisse pas vieillir — une table ajoutée demain y sera.
 * ⚠️ ET SI CETTE RACINE NE RÉPOND PAS (une version qui ne la publie
 * pas, un réglage), ON NE S'ARRÊTE PAS : on retombe sur la liste
 * écrite plus bas. Elle peut vieillir, elle ; c'est pour cela qu'elle
 * n'est QUE le filet, et que le script DIT laquelle des deux il a
 * employée.
 */
const TABLES_DE_SECOURS = [
  //  YokoFolio
  "tatoueurs", "photos_tatoueur", "modes_exercice", "studios",
  "liaisons_artiste_salon", "notifications_compte", "favoris_photos",
  "tatoueurs_suivis", "clics_fiches", "visites_selection",
  "signalements_fiches", "suggestions_style", "suppressions_comptes",
  "messages_yokofolio", "demarchages", "demarchage_fiches",
  //  Le produit artisans, dans la même base
  "artisans", "artisan_metiers", "artisans_prospects", "particuliers",
  "favoris", "demandes_rdv", "messages_contact", "signalements",
  "communes", "prospection_envois",
];

async function listerLesTables(appeler) {
  try {
    const reponse = await appeler("/rest/v1/", {
      headers: { Accept: "application/openapi+json" },
    });
    if (reponse.ok) {
      const document = await reponse.json();
      const chemins = Object.keys(document?.paths ?? {})
        .filter((c) => c.startsWith("/") && c.length > 1 && !c.includes("{"))
        .map((c) => c.slice(1))
        .filter((nom) => /^[a-z0-9_]+$/.test(nom));
      if (chemins.length > 0) {
        return { tables: [...new Set(chemins)].sort(), origine: "la base" };
      }
    }
  } catch {
    //  Racine muette : le filet ci-dessous.
  }
  return { tables: [...TABLES_DE_SECOURS].sort(), origine: "la liste de secours" };
}

/**
 * TOUTES LES LIGNES D'UNE TABLE, page par page.
 * ⚠️ LE TRI, ET SA LIMITE, DITE FRANCHEMENT. On demande un tri par
 * `id` quand la table en a un : sans tri, deux pages successives
 * peuvent, en théorie, rendre deux fois la même ligne ou en sauter
 * une. Les tables sans `id` (les vues, surtout) sont lues sans tri —
 * elles tiennent en une page à l'échelle de ce site, et une page
 * unique n'a pas ce problème. Le résumé signale toute table qui a
 * demandé plus d'une page ET n'avait pas de tri : c'est la seule
 * situation où le doute existe.
 */
async function copierUneTable(appeler, table) {
  const lignes = [];
  let triable = true;
  let total = null;
  let pages = 0;

  for (let depart = 0; ; depart += TAILLE_PAGE) {
    const tri = triable ? "&order=id.asc" : "";
    const chemin =
      `/rest/v1/${table}?select=*${tri}` +
      `&limit=${TAILLE_PAGE}&offset=${depart}`;
    const reponse = await appeler(chemin, {
      headers: { Prefer: "count=exact" },
    });

    if (!reponse.ok) {
      //  Un tri sur une colonne absente : on réessaie sans tri.
      if (triable && reponse.status === 400) {
        triable = false;
        depart -= TAILLE_PAGE;
        continue;
      }
      const message = await reponse.text().catch(() => "");
      return {
        table, erreur: `HTTP ${reponse.status} ${message.slice(0, 160)}`,
        lignes: null, total: null, pages, triee: triable,
      };
    }

    //  LE TOTAL ANNONCÉ PAR LA BASE : « 0-999/12345 ». C'est lui qui
    //  permettra de vérifier que rien n'a été perdu en route.
    const plage = reponse.headers.get("content-range");
    const annonce = plage && plage.includes("/") ? plage.split("/")[1] : null;
    if (annonce && annonce !== "*" && Number.isFinite(Number(annonce))) {
      total = Number(annonce);
    }

    const lot = await reponse.json();
    if (!Array.isArray(lot)) {
      return {
        table, erreur: "réponse inattendue (ce n'est pas une liste)",
        lignes: null, total, pages, triee: triable,
      };
    }
    pages += 1;
    lignes.push(...lot);
    if (lot.length < TAILLE_PAGE) break;
    //  Garde-fou : une base qui ignorerait `offset` renverrait
    //  éternellement la même page. Au-delà de deux cents pages
    //  (deux cent mille lignes) on s'arrête et on le dit.
    if (pages >= 200) {
      return {
        table, erreur: "arrêt à 200 pages — la pagination n'avance pas",
        lignes, total, pages, triee: triable,
      };
    }
  }
  return { table, erreur: null, lignes, total, pages, triee: triable };
}

/**
 * LES COMPTES. Ils ne sont dans AUCUNE table ordinaire : Supabase les
 * garde à part, et seule l'API d'administration les rend. Sans eux,
 * une base restaurée aurait des portfolios sans personne à qui les
 * rattacher — c'est la pièce dont l'absence se remarquerait le plus
 * tard, et le plus douloureusement.
 * ⚠️ LES MOTS DE PASSE N'EN FONT PAS PARTIE, et c'est très bien :
 * Supabase ne les rend à personne. Une restauration demandera donc
 * aux gens de redemander un mot de passe — c'est écrit dans le
 * LISEZMOI.
 */
async function copierLesComptes(appeler) {
  const comptes = [];
  for (let page = 1; page <= 200; page += 1) {
    const reponse = await appeler(
      `/auth/v1/admin/users?page=${page}&per_page=${TAILLE_PAGE}`
    );
    if (!reponse.ok) {
      const message = await reponse.text().catch(() => "");
      return { comptes: null, erreur: `HTTP ${reponse.status} ${message.slice(0, 160)}` };
    }
    const corps = await reponse.json();
    const lot = Array.isArray(corps) ? corps : (corps?.users ?? []);
    if (!Array.isArray(lot) || lot.length === 0) break;
    comptes.push(...lot);
    if (lot.length < TAILLE_PAGE) break;
  }
  return { comptes, erreur: null };
}

/* ==================================================================
   3 · LE STOCKAGE — les photos, fichier par fichier
   ================================================================== */

async function listerLesPaniers(appeler) {
  const reponse = await appeler("/storage/v1/bucket");
  if (!reponse.ok) return [];
  const corps = await reponse.json().catch(() => []);
  return Array.isArray(corps) ? corps.filter((p) => p?.name) : [];
}

/** Les objets d'un panier, dossier par dossier (l'API ne descend pas
    toute seule : elle rend les fichiers d'un niveau, et les dossiers
    comme des entrées SANS identifiant). */
async function listerLesObjets(appeler, panier, prefixe = "") {
  const trouves = [];
  for (let depart = 0; ; depart += TAILLE_PAGE) {
    const reponse = await appeler(`/storage/v1/object/list/${panier}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        prefix: prefixe,
        limit: TAILLE_PAGE,
        offset: depart,
        sortBy: { column: "name", order: "asc" },
      }),
    });
    if (!reponse.ok) break;
    const lot = await reponse.json().catch(() => []);
    if (!Array.isArray(lot) || lot.length === 0) break;
    for (const entree of lot) {
      const chemin = prefixe ? `${prefixe}/${entree.name}` : entree.name;
      if (entree.id) trouves.push(chemin);
      else trouves.push(...(await listerLesObjets(appeler, panier, chemin)));
    }
    if (lot.length < TAILLE_PAGE) break;
  }
  return trouves;
}

async function telecharger(appeler, panier, chemin, destination) {
  const reponse = await appeler(
    `/storage/v1/object/${panier}/${chemin.split("/").map(encodeURIComponent).join("/")}`
  );
  if (!reponse.ok || !reponse.body) return 0;
  await mkdir(path.dirname(destination), { recursive: true });
  await pipeline(Readable.fromWeb(reponse.body), createWriteStream(destination));
  return (await stat(destination)).size;
}

/* ==================================================================
   4 · LE DOSSIER DU JOUR
   ================================================================== */

/** `sauvegardes/2026-08-28`, et `-2`, `-3`… si le jour a déjà servi.
    ⚠️ ON N'ÉCRASE JAMAIS : une sauvegarde qu'un second lancement
    remplacerait n'est pas une sauvegarde. */
async function dossierDuJour() {
  const jour = new Date().toISOString().slice(0, 10);
  const base = path.join(RACINE, "sauvegardes");
  for (let n = 1; n <= 99; n += 1) {
    const essai = path.join(base, n === 1 ? jour : `${jour}-${n}`);
    try {
      await stat(essai);
    } catch {
      await mkdir(essai, { recursive: true });
      return essai;
    }
  }
  throw new Error("99 sauvegardes le même jour : quelque chose ne va pas.");
}

/* ==================================================================
   5 · LA COMMANDE
   ================================================================== */

const octets = (n) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} Mo`
  : n >= 1024 ? `${(n / 1024).toFixed(0)} ko`
  : `${n} o`;

async function principal() {
  console.log("");
  console.log("  ▲  Sauvegarde de la base YokoFolio");
  console.log("");

  const acces = await lireLesAcces();
  if (!acces) {
    console.log("  ✖  Le fichier `.env.local` est introuvable.");
    console.log("     Place-toi dans le dossier du projet, puis relance :");
    console.log("");
    console.log("         sh outils/sauvegarde");
    console.log("");
    process.exit(1);
  }
  const url = acces.NEXT_PUBLIC_SUPABASE_URL;
  const cle = acces.SUPABASE_SECRET_KEY;
  const manquantes = [
    !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !cle ? "SUPABASE_SECRET_KEY" : null,
  ].filter(Boolean);
  if (manquantes.length > 0) {
    console.log(`  ✖  Il manque dans .env.local : ${manquantes.join(", ")}`);
    console.log("     Recopie-les depuis Supabase → Project Settings → API.");
    console.log("");
    process.exit(1);
  }

  const appeler = fabriquerLeFacteur(url, cle);

  //  LA BASE RÉPOND-ELLE ? On le demande avant tout le reste : un
  //  message clair vaut mieux que trente erreurs à la suite.
  try {
    const salut = await appeler("/rest/v1/", { method: "HEAD" });
    if (salut.status >= 500) throw new Error(`HTTP ${salut.status}`);
  } catch (erreur) {
    console.log(`  ✖  La base ne répond pas (${erreur.message}).`);
    console.log(`     Adresse essayée : ${url}`);
    console.log("     Vérifie ta connexion, puis relance.");
    console.log("");
    process.exit(1);
  }

  const dossier = await dossierDuJour();
  const relatif = path.relative(RACINE, dossier);
  console.log(`  Dossier : ${relatif}`);
  console.log("");

  // ── LES TABLES ────────────────────────────────────────────────
  const { tables, origine } = await listerLesTables(appeler);
  console.log(`  Tables à copier : ${tables.length} (liste fournie par ${origine})`);
  await mkdir(path.join(dossier, "tables"), { recursive: true });

  const resultats = [];
  for (const table of tables) {
    const resultat = await copierUneTable(appeler, table);
    if (resultat.erreur) {
      resultats.push({ ...resultat, fichier: null, poids: 0 });
      continue;
    }
    const fichier = path.join(dossier, "tables", `${table}.json`);
    await writeFile(fichier, JSON.stringify(resultat.lignes, null, 1), "utf8");
    resultats.push({
      table, erreur: null, nombre: resultat.lignes.length,
      total: resultat.total, pages: resultat.pages, triee: resultat.triee,
      fichier: path.relative(dossier, fichier),
      poids: (await stat(fichier)).size,
    });
  }

  // ── LES COMPTES ───────────────────────────────────────────────
  const { comptes, erreur: erreurComptes } = await copierLesComptes(appeler);
  let nombreComptes = 0;
  if (comptes) {
    nombreComptes = comptes.length;
    await writeFile(
      path.join(dossier, "comptes.json"),
      JSON.stringify(comptes, null, 1),
      "utf8"
    );
  }

  // ── LE STOCKAGE ───────────────────────────────────────────────
  const paniers = await listerLesPaniers(appeler);
  const stockage = [];
  for (const panier of paniers) {
    const chemins = await listerLesObjets(appeler, panier.name);
    let poids = 0;
    let copies = 0;
    for (const chemin of chemins) {
      const taille = await telecharger(
        appeler, panier.name, chemin,
        path.join(dossier, "stockage", panier.name, chemin)
      );
      if (taille > 0) copies += 1;
      poids += taille;
    }
    stockage.push({ panier: panier.name, trouves: chemins.length, copies, poids });
  }

  // ── LA VÉRIFICATION ───────────────────────────────────────────
  //  On ne se croit pas sur parole : on relit ce qu'on vient
  //  d'écrire. Un fichier qui existe et pèse quelque chose ne suffit
  //  pas — il doit se RELIRE, et contenir le nombre de lignes annoncé.
  const alertes = [];
  for (const r of resultats) {
    if (r.erreur) {
      alertes.push(`${r.table} : non copiée (${r.erreur})`);
      continue;
    }
    try {
      const relu = JSON.parse(
        await readFile(path.join(dossier, "tables", `${r.table}.json`), "utf8")
      );
      if (!Array.isArray(relu) || relu.length !== r.nombre) {
        alertes.push(`${r.table} : le fichier relu ne contient pas ${r.nombre} lignes`);
      }
      if (r.total !== null && r.total !== r.nombre) {
        alertes.push(
          `${r.table} : la base en annonce ${r.total}, ` +
          `${r.nombre} copiée${r.nombre > 1 ? "s" : ""}`
        );
      }
      if (r.pages > 1 && !r.triee) {
        alertes.push(`${r.table} : lue en ${r.pages} pages SANS tri — à revérifier`);
      }
    } catch (erreur) {
      alertes.push(`${r.table} : fichier illisible (${erreur.message})`);
    }
  }
  if (erreurComptes) alertes.push(`comptes : non copiés (${erreurComptes})`);
  for (const s of stockage) {
    if (s.copies !== s.trouves) {
      alertes.push(
        `stockage ${s.panier} : ${s.trouves} fichiers listés, ${s.copies} copiés`
      );
    }
  }

  // ── LE RÉSUMÉ ─────────────────────────────────────────────────
  const lignesTotal = resultats.reduce((t, r) => t + (r.nombre ?? 0), 0);
  const poidsTables = resultats.reduce((t, r) => t + r.poids, 0);
  const poidsPhotos = stockage.reduce((t, s) => t + s.poids, 0);
  const photos = stockage.reduce((t, s) => t + s.copies, 0);
  const copiees = resultats.filter((r) => !r.erreur);

  const resume = {
    faite_le: new Date().toISOString(),
    base: url,
    origine_de_la_liste: origine,
    tables: copiees.map((r) => ({
      nom: r.table, lignes: r.nombre, total_annonce: r.total,
      pages: r.pages, triee: r.triee, poids: r.poids,
    })),
    tables_en_echec: resultats
      .filter((r) => r.erreur)
      .map((r) => ({ nom: r.table, raison: r.erreur })),
    comptes: nombreComptes,
    stockage,
    alertes,
  };
  await writeFile(
    path.join(dossier, "resume.json"),
    JSON.stringify(resume, null, 1),
    "utf8"
  );

  console.log("");
  console.log("  ──────────────────────────────────────────────");
  for (const r of copiees.filter((x) => x.nombre > 0)) {
    console.log(
      `    ${String(r.nombre).padStart(7)} ligne${r.nombre > 1 ? "s" : " "}  ${r.table}` +
      `${" ".repeat(Math.max(1, 26 - r.table.length))}${octets(r.poids)}`
    );
  }
  const vides = copiees.filter((x) => x.nombre === 0).length;
  if (vides > 0) console.log(`    ${String(0).padStart(7)} lignes  (${vides} tables vides)`);
  console.log("  ──────────────────────────────────────────────");
  console.log(
    `    ${copiees.length} table${copiees.length > 1 ? "s" : ""}` +
    ` · ${lignesTotal} ligne${lignesTotal > 1 ? "s" : ""} · ${octets(poidsTables)}`
  );
  console.log(`    ${nombreComptes} compte${nombreComptes > 1 ? "s" : ""}`);
  console.log(`    ${photos} photo${photos > 1 ? "s" : ""} · ${octets(poidsPhotos)}`);
  console.log(`    TOTAL : ${octets(poidsTables + poidsPhotos)}`);
  console.log("  ──────────────────────────────────────────────");
  console.log("");

  if (alertes.length === 0) {
    console.log("  ✔  Sauvegarde vérifiée : tout est relu et complet.");
    console.log(`     ${relatif}`);
  } else {
    console.log(`  ⚠  ${alertes.length} point(s) à regarder :`);
    for (const a of alertes.slice(0, 20)) console.log(`       · ${a}`);
    if (alertes.length > 20) console.log(`       · … et ${alertes.length - 20} autres`);
    console.log("");
    console.log("     Le reste EST sauvegardé. Le détail complet :");
    console.log(`     ${path.join(relatif, "resume.json")}`);
  }
  console.log("");
  console.log("  Pour remettre une sauvegarde en place, lis :");
  console.log("     outils/LISEZMOI-sauvegardes.md");
  console.log("");

  //  ⚠️ ON NE SORT PAS EN ERREUR POUR UNE ALERTE : une sauvegarde
  //  partielle vaut mieux que pas de sauvegarde, et le résumé compte
  //  plus qu'un code de sortie. Seule une panne franche (base
  //  injoignable, accès manquants) arrête le script — plus haut.
}

principal().catch((erreur) => {
  console.log("");
  console.log(`  ✖  La sauvegarde s'est arrêtée : ${erreur.message}`);
  console.log("");
  process.exit(1);
});
