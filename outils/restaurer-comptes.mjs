//  ██ LA RESTAURATION DES COMPTES — passe nº 690 ██
//  ==================================================================
//  On ne le lance pas directement : `sh outils/restaurer-comptes` s'en
//  charge (il vérifie Node avant). Tout ce qui explique QUOI et
//  POURQUOI est écrit là-bas ; ici, c'est le COMMENT.
//
//  ⚠️ C'EST LE SEUL OUTIL DU PROJET QUI ÉCRIVE DANS LA BASE. Il n'a
//  qu'un verbe : CRÉER un compte qui n'existe pas. Il ne modifie rien,
//  n'écrase rien, ne supprime rien — et le code ci-dessous ne contient
//  aucun appel qui le pourrait. C'est vérifiable en le lisant : le
//  seul `method` autre que `GET` est le `POST` de création.
//
//  ⚠️ IL SORT DE LA RÉSERVE DE LA nº 689, qui disait : « un outil qui
//  CRÉE des comptes est un outil dangereux à laisser traîner ». Il
//  l'est toujours. C'est pourquoi il ne fait rien sans qu'on lui nomme
//  une sauvegarde ET qu'on tape RESTAURER.

import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import path from "node:path";

const RACINE = process.cwd();
const DELAI_MS = Math.max(5_000, Number(process.env.DELAI_LECTURE ?? 30) * 1000);
const PAR_PAGE = 1000;

/* ==================================================================
   LES ACCÈS — la même lecture que la sauvegarde
   ================================================================== */

async function lireLesAcces() {
  let texte = "";
  try {
    texte = await readFile(path.join(RACINE, ".env.local"), "utf8");
  } catch {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
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
  const enTetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  return async function appeler(chemin, options = {}) {
    //  §1 (nº 690) — comme la sauvegarde : aucune lecture, aucune
    //  écriture, sans délai de garde. Un serveur muet ne fige rien.
    return fetch(url.replace(/\/+$/, "") + chemin, {
      ...options,
      headers: { ...enTetes, ...(options.headers ?? {}) },
      signal: AbortSignal.timeout(DELAI_MS),
    });
  };
}

function raisonLisible(erreur) {
  const nom = erreur?.name ?? "";
  if (nom === "TimeoutError" || nom === "AbortError") {
    return `pas de réponse après ${Math.round(DELAI_MS / 1000)} s`;
  }
  return erreur?.message ?? String(erreur);
}

/* ==================================================================
   CE QUE LA BASE CONTIENT DÉJÀ
   ================================================================== */

/**
 * TOUS LES COMPTES ACTUELS — leurs adresses et leurs identifiants.
 * ⚠️ C'EST LA PIÈCE MAÎTRESSE DU GARDE-FOU Nº 3 : sans cette liste, on
 * ne peut PAS savoir ce qu'on écraserait. Si elle ne peut pas être lue,
 * le script s'arrête — il ne restaure rien « au cas où ».
 */
async function comptesExistants(appeler) {
  const adresses = new Set();
  const identifiants = new Set();
  for (let page = 1; page <= 200; page += 1) {
    let reponse;
    try {
      reponse = await appeler(`/auth/v1/admin/users?page=${page}&per_page=${PAR_PAGE}`);
    } catch (erreur) {
      return { erreur: raisonLisible(erreur) };
    }
    if (!reponse.ok) {
      const message = await reponse.text().catch(() => "");
      return { erreur: `HTTP ${reponse.status} ${message.slice(0, 160)}` };
    }
    const corps = await reponse.json().catch(() => null);
    const lot = Array.isArray(corps) ? corps : (corps?.users ?? []);
    if (!Array.isArray(lot) || lot.length === 0) break;
    for (const compte of lot) {
      if (compte?.email) adresses.add(String(compte.email).trim().toLowerCase());
      if (compte?.id) identifiants.add(String(compte.id));
    }
    if (lot.length < PAR_PAGE) break;
  }
  return { adresses, identifiants, erreur: null };
}

/**
 * CRÉER UN COMPTE — et rien d'autre.
 * ⚠️ `id` EST ENVOYÉ, ET C'EST LE POINT QUI COMPTE : c'est lui qui
 * relie une personne à ses portfolios (`tatoueurs.user_id`). Un compte
 * recréé avec un autre identifiant serait un ÉTRANGER pour ses propres
 * fiches. On vérifie donc, après coup, que la base a bien retenu celui
 * qu'on lui a donné — et sinon on le dit, fort.
 * ⚠️ `email_confirm: true` : la personne existe déjà, son adresse a
 * déjà été confirmée un jour. Lui renvoyer un courriel de confirmation
 * n'aurait aucun sens — et le script n'envoie AUCUN courriel.
 */
async function creerUnCompte(appeler, compte) {
  const corps = {
    id: compte.id,
    email: compte.email,
    email_confirm: true,
    user_metadata: compte.user_metadata ?? {},
    app_metadata: compte.app_metadata ?? {},
  };
  let reponse;
  try {
    reponse = await appeler("/auth/v1/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(corps),
    });
  } catch (erreur) {
    return { erreur: raisonLisible(erreur) };
  }
  const texte = await reponse.text().catch(() => "");
  if (!reponse.ok) {
    return { erreur: `HTTP ${reponse.status} ${texte.slice(0, 160)}` };
  }
  let cree = null;
  try {
    cree = JSON.parse(texte);
  } catch {
    cree = null;
  }
  return { erreur: null, idObtenu: cree?.id ?? null };
}

/* ==================================================================
   LA COMMANDE
   ================================================================== */

/** La confirmation tapée. Rend vrai si le mot exact a été écrit. */
async function motTape(question) {
  const lecteur = createInterface({ input: process.stdin, output: process.stdout });
  const reponse = await new Promise((rendre) => lecteur.question(question, rendre));
  lecteur.close();
  return reponse.trim().toUpperCase() === "RESTAURER";
}

async function principal() {
  console.log("");
  console.log("  ▲  Restauration des comptes");
  console.log("");

  //  ── GARDE-FOU 1 : LE DOSSIER EST NOMMÉ, OU RIEN NE SE PASSE ──
  const donne = process.argv[2];
  if (!donne) {
    console.log("  ✖  Il faut NOMMER la sauvegarde à restaurer.");
    console.log("");
    console.log("         sh outils/restaurer-comptes sauvegardes/2026-08-28");
    console.log("");
    console.log("     Ce script ne choisit pas tout seul : recréer des comptes");
    console.log("     n'est pas un geste qu'on fait par mégarde.");
    console.log("");
    process.exit(1);
  }
  const dossier = path.resolve(RACINE, donne);
  const fichier = path.join(dossier, "comptes.json");
  let sauvegardes;
  try {
    sauvegardes = JSON.parse(await readFile(fichier, "utf8"));
  } catch (erreur) {
    console.log(`  ✖  Impossible de lire ${path.relative(RACINE, fichier)}`);
    console.log(`     (${erreur.message})`);
    console.log("");
    process.exit(1);
  }
  if (!Array.isArray(sauvegardes) || sauvegardes.length === 0) {
    console.log("  ✖  Ce fichier ne contient aucun compte.");
    console.log("");
    process.exit(1);
  }

  const acces = await lireLesAcces();
  const url = acces?.NEXT_PUBLIC_SUPABASE_URL;
  const cle = acces?.SUPABASE_SECRET_KEY;
  if (!url || !cle) {
    console.log("  ✖  Il manque dans .env.local :");
    if (!url) console.log("       NEXT_PUBLIC_SUPABASE_URL");
    if (!cle) console.log("       SUPABASE_SECRET_KEY");
    console.log("");
    process.exit(1);
  }
  const appeler = fabriquerLeFacteur(url, cle);

  //  ── CE QUE LA BASE CONTIENT DÉJÀ (garde-fou 3) ──
  const { adresses, identifiants, erreur } = await comptesExistants(appeler);
  if (erreur) {
    console.log(`  ✖  Impossible de lire les comptes actuels (${erreur}).`);
    console.log("     Sans cette liste, on ne peut pas garantir qu'on");
    console.log("     n'écrasera rien : on ne restaure donc rien.");
    console.log("");
    process.exit(1);
  }

  const aCreer = [];
  const ignores = [];
  for (const compte of sauvegardes) {
    const adresse = String(compte?.email ?? "").trim().toLowerCase();
    if (!adresse || !compte?.id) {
      ignores.push({ compte, raison: "ligne incomplète (ni adresse ni identifiant)" });
      continue;
    }
    if (adresses.has(adresse)) {
      ignores.push({ compte, raison: "cette adresse existe déjà" });
      continue;
    }
    if (identifiants.has(String(compte.id))) {
      ignores.push({ compte, raison: "cet identifiant existe déjà" });
      continue;
    }
    aCreer.push(compte);
  }

  console.log(`  Sauvegarde  : ${path.relative(RACINE, dossier)}`);
  console.log(`  Base        : ${url}`);
  console.log(`  Comptes du fichier : ${sauvegardes.length}`);
  console.log(`  Déjà en base       : ${ignores.length}  (ils ne seront pas touchés)`);
  console.log(`  À créer            : ${aCreer.length}`);
  console.log("");

  if (aCreer.length === 0) {
    console.log("  ✔  Rien à faire : tous ces comptes existent déjà.");
    console.log("");
    return;
  }

  //  ── GARDE-FOU 2 : LE MOT SE TAPE ──
  console.log("  Les mots de passe ne se restaurent PAS : chaque personne");
  console.log("  devra cliquer « mot de passe oublié ».");
  console.log("");
  if (!(await motTape(`  Tape RESTAURER pour créer ces ${aCreer.length} comptes : `))) {
    console.log("");
    console.log("  Annulé. Rien n'a été créé.");
    console.log("");
    return;
  }
  console.log("");

  //  ── LA CRÉATION ──
  const crees = [];
  const echecs = [];
  const identifiantsChanges = [];
  for (const [n, compte] of aCreer.entries()) {
    const etiquette = `${n + 1}/${aCreer.length} · ${compte.email}`;
    const resultat = await creerUnCompte(appeler, compte);
    if (resultat.erreur) {
      console.log(`    ✖ ${etiquette} — ${resultat.erreur}`);
      echecs.push({ email: compte.email, raison: resultat.erreur });
      continue;
    }
    if (resultat.idObtenu && resultat.idObtenu !== compte.id) {
      //  ⚠️ LE CAS QU'IL NE FAUT SURTOUT PAS TAIRE : le compte existe,
      //  mais il ne retrouvera aucun de ses portfolios.
      console.log(`    ⚠ ${etiquette} — créé avec un AUTRE identifiant`);
      identifiantsChanges.push({
        email: compte.email, attendu: compte.id, obtenu: resultat.idObtenu,
      });
    } else {
      console.log(`    ✔ ${etiquette}`);
    }
    crees.push(compte.email);
  }

  //  ── GARDE-FOU 4 : ON SE RELIT ──
  console.log("");
  const apres = await comptesExistants(appeler);
  const manquants = apres.erreur
    ? null
    : crees.filter((a) => !apres.adresses.has(String(a).trim().toLowerCase()));

  console.log("  ──────────────────────────────────────────────");
  console.log(`    ${crees.length} compte(s) créé(s)`);
  console.log(`    ${ignores.length} ignoré(s) — déjà en base`);
  if (echecs.length > 0) console.log(`    ${echecs.length} en échec`);
  console.log("  ──────────────────────────────────────────────");
  console.log("");

  for (const i of ignores.slice(0, 10)) {
    console.log(`    · ignoré : ${i.compte?.email ?? "(sans adresse)"} — ${i.raison}`);
  }
  if (ignores.length > 10) console.log(`    · … et ${ignores.length - 10} autres`);

  if (identifiantsChanges.length > 0) {
    console.log("");
    console.log("  ⚠  ATTENTION — des comptes ont reçu un AUTRE identifiant que");
    console.log("     celui de la sauvegarde. Ils ne retrouveront PAS leurs");
    console.log("     portfolios : le lien passe par cet identifiant.");
    for (const c of identifiantsChanges) {
      console.log(`       · ${c.email} : attendu ${c.attendu}, obtenu ${c.obtenu}`);
    }
    console.log("     Dis-le-moi : il faudra corriger `tatoueurs.user_id`.");
  }

  console.log("");
  if (manquants === null) {
    console.log("  ⚠  La relecture n'a pas abouti : vérifie dans Supabase →");
    console.log("     Authentication → Users que les comptes sont bien là.");
  } else if (manquants.length === 0 && echecs.length === 0) {
    console.log("  ✔  Relu : tous les comptes créés sont bien en base.");
  } else {
    if (manquants.length > 0) {
      console.log(`  ⚠  ${manquants.length} compte(s) créé(s) sont introuvables à la relecture :`);
      for (const a of manquants.slice(0, 10)) console.log(`       · ${a}`);
    }
    for (const e of echecs.slice(0, 10)) {
      console.log(`  ✖  ${e.email} : ${e.raison}`);
    }
  }
  console.log("");
  console.log("  La suite (données, photos) est décrite dans :");
  console.log("     outils/LISEZMOI-sauvegardes.md");
  console.log("");
}

principal().catch((erreur) => {
  console.log("");
  console.log(`  ✖  La restauration s'est arrêtée : ${erreur.message}`);
  console.log("");
  process.exit(1);
});
