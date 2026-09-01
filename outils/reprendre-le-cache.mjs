//  ██ nº 777 — REPOSER LA CONSIGNE DE CACHE SUR UN SEAU DÉJÀ REMPLI ██
//  ==================================================================
//  On ne le lance pas directement : `sh outils/reprendre-le-cache`
//  s'en charge. Le QUOI et le POURQUOI sont écrits là-bas.
//
//  ⚠️ ESSAI À BLANC PAR DÉFAUT (la règle de `reprendre-avatars`,
//  nº 719, et de `demenager-photos`, nº 766) : sans `--reel`, il LIT
//  la consigne de chaque photo, dit combien sont à reprendre, et
//  n'écrit rien.
//
//  ⚠️ IL N'EFFACE JAMAIS RIEN, et ne renomme rien : chaque photo est
//  réenvoyée SOUS SON PROPRE CHEMIN, avec les octets qu'il vient d'en
//  lire. Les adresses en base restent donc justes — il n'y a aucun SQL
//  à passer après lui.
//
//  ⚠️ AUCUNE CLÉ AFFICHÉE : le script ne montre que l'adresse du
//  projet, jamais son jeton.
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  dureeCachePhotos,
  secondesDeLaConsigne,
} from "./duree-cache-photos.mjs";

const RACINE = process.cwd();
const REEL = process.argv.includes("--reel");
const TAILLE_PAGE = 1000;
const DELAI_MS = Math.max(10_000, Number(process.env.DELAI_LECTURE ?? 60) * 1000);
const DELAI_FICHIER_MS = Math.max(5_000, Number(process.env.DELAI_FICHIER ?? 30) * 1000);

/*  LE SEAU DES PHOTOS — même variable et même défaut que
    `demenager-photos` (l'écriture du site est `BUCKET_PHOTOS`, dans
    `lib/photos-stockage`). Le second seau du produit artisans se vise
    par SEAU_PHOTOS=photos-artisans. */
const SEAU = process.env.SEAU_PHOTOS ?? "photos-tatoueurs";

/** L'accès : le projet du `.env.local` par défaut — c'est celui que le
    site sert aujourd'hui —, ou celui que les deux variables désignent.
    Mêmes noms que `demenager-photos`, pour n'avoir qu'une habitude. */
async function acces() {
  if (process.env.CIBLE_URL && process.env.CIBLE_SECRET_KEY) {
    return { url: process.env.CIBLE_URL, cle: process.env.CIBLE_SECRET_KEY, dit: "CIBLE_URL" };
  }
  let texte = "";
  try {
    texte = await readFile(path.join(RACINE, ".env.local"), "utf8");
  } catch {
    /*  Pas de fichier : l'environnement prendra le relais. */
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
  return {
    url: lu.NEXT_PUBLIC_SUPABASE_URL,
    cle: lu.SUPABASE_SECRET_KEY,
    dit: ".env.local",
  };
}

function fabriquerLeFacteur(url, cle) {
  const base = url.replace(/\/+$/, "");
  const enTetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  return async function appeler(chemin, options = {}) {
    const { delai = DELAI_MS, ...reste } = options;
    const controle = new AbortController();
    const minuterie = setTimeout(() => controle.abort(), delai);
    try {
      return await fetch(`${base}${chemin}`, {
        ...reste,
        headers: { ...enTetes, ...(reste.headers ?? {}) },
        signal: controle.signal,
      });
    } finally {
      clearTimeout(minuterie);
    }
  };
}
const nomDuProjet = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return "(adresse illisible)";
  }
};
const encoder = (chemin) => chemin.split("/").map(encodeURIComponent).join("/");

/** POURQUOI ÇA N'A PAS RÉPONDU, EN FRANÇAIS (l'écriture de
    `demenager-photos`, nº 766). */
function raisonLisible(erreur) {
  const texte = String(erreur?.message ?? erreur);
  if (/abort/i.test(texte)) return "trop lent, la demande a été abandonnée";
  if (/fetch failed|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT/i.test(texte)) {
    return "projet injoignable (adresse fausse, ou pas de réseau)";
  }
  return texte.slice(0, 120);
}

/** Les objets d'un seau, dossier par dossier — la descente de
    `demenager-photos` et de la sauvegarde (nº 689) : l'API rend les
    fichiers d'un niveau, et les dossiers en entrées SANS identifiant. */
async function listerLesObjets(appeler, prefixe = "") {
  const trouves = [];
  for (let depart = 0; ; depart += TAILLE_PAGE) {
    let reponse;
    try {
      reponse = await appeler(`/storage/v1/object/list/${SEAU}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prefix: prefixe,
          limit: TAILLE_PAGE,
          offset: depart,
          sortBy: { column: "name", order: "asc" },
        }),
      });
    } catch {
      break;
    }
    if (!reponse.ok) break;
    const lot = await reponse.json().catch(() => []);
    if (!Array.isArray(lot) || lot.length === 0) break;
    for (const entree of lot) {
      const chemin = prefixe ? `${prefixe}/${entree.name}` : entree.name;
      if (entree.id) trouves.push(chemin);
      else trouves.push(...(await listerLesObjets(appeler, chemin)));
    }
    if (lot.length < TAILLE_PAGE) break;
  }
  return trouves;
}

/**
 * LA CONSIGNE ACTUELLE D'UNE PHOTO — deux voies, et la seconde n'est
 * pas un luxe :
 *  · `/object/info/…` rend les métadonnées en JSON, sans le corps :
 *    c'est la lecture la moins chère, et c'est celle du client
 *    officiel (`storage.from(...).info()`) ;
 *  · si ce point d'entrée n'existe pas sur le service (404), on
 *    retombe sur un `HEAD` de l'objet, qui rend les mêmes en-têtes
 *    sans le corps. Une seule bascule pour tout le seau : dès que
 *    `info` a dit non, on ne le redemande plus.
 * ⚠️ ON LIT PAR LA VOIE AUTHENTIFIÉE, JAMAIS PAR L'ADRESSE PUBLIQUE :
 * la publique passe par le réseau de diffusion, qui peut rendre une
 * réponse mise en cache AVANT la reprise — on relèverait alors
 * l'ancienne consigne et l'on croirait la reprise ratée.
 */
async function lireLaConsigne(appeler, chemin, etat) {
  if (!etat.sansInfo) {
    try {
      const reponse = await appeler(
        `/storage/v1/object/info/${SEAU}/${encoder(chemin)}`,
        { delai: DELAI_FICHIER_MS }
      );
      if (reponse.ok) {
        const metadonnees = await reponse.json().catch(() => ({}));
        //  Le service parle serpent (`cache_control`), le client
        //  officiel chamelle (`cacheControl`) : on accepte les deux.
        return {
          consigne:
            metadonnees.cacheControl ?? metadonnees.cache_control ?? null,
          type: metadonnees.contentType ?? metadonnees.content_type ?? null,
        };
      }
      if (reponse.status === 404) etat.sansInfo = true;
    } catch {
      etat.sansInfo = true;
    }
  }
  try {
    const reponse = await appeler(`/storage/v1/object/${SEAU}/${encoder(chemin)}`, {
      method: "HEAD",
      delai: DELAI_FICHIER_MS,
    });
    if (!reponse.ok) return { consigne: null, type: null, echec: `HTTP ${reponse.status}` };
    return {
      consigne: reponse.headers.get("cache-control"),
      type: reponse.headers.get("content-type"),
    };
  } catch (erreur) {
    return { consigne: null, type: null, echec: raisonLisible(erreur) };
  }
}

/**
 * REPRENDRE UNE PHOTO — et c'est tout ce que le service permet.
 * ------------------------------------------------------------------
 * La consigne de cache n'est pas DANS le fichier : elle est dans les
 * métadonnées de l'objet, posées au dépôt par l'en-tête de l'envoi.
 * Aucun point d'entrée ne les modifie seules — `copy` et `move` les
 * recopient telles quelles (c'est déjà écrit dans `lib/cache-photos`
 * depuis la nº 721). Reposer la consigne, c'est donc RENVOYER le
 * fichier : on le lit, on le réécrit à SON chemin, avec l'en-tête.
 * ⚠️ `PUT` ET NON `POST` : c'est la mise à jour d'un objet existant —
 * le geste que le client officiel appelle `update()`. Le contenu
 * renvoyé est celui qu'on vient de lire, octet pour octet : la photo
 * n'est ni recompressée, ni redimensionnée, ni renommée.
 */
async function reprendreUnePhoto(appeler, chemin, enTete, typeConnu) {
  let source;
  try {
    source = await appeler(`/storage/v1/object/${SEAU}/${encoder(chemin)}`, {
      delai: DELAI_FICHIER_MS,
    });
  } catch (erreur) {
    return `lecture : ${raisonLisible(erreur)}`;
  }
  if (!source.ok) return `lecture : HTTP ${source.status}`;
  const octets = Buffer.from(await source.arrayBuffer());
  //  Le type est celui que le service annonce — on ne le devine pas.
  const type =
    source.headers.get("content-type") ?? typeConnu ?? "application/octet-stream";
  let reponse;
  try {
    reponse = await appeler(`/storage/v1/object/${SEAU}/${encoder(chemin)}`, {
      method: "PUT",
      headers: { "content-type": type, "cache-control": enTete },
      body: octets,
      delai: DELAI_FICHIER_MS,
    });
  } catch (erreur) {
    return `écriture : ${raisonLisible(erreur)}`;
  }
  if (!reponse.ok) {
    const message = await reponse.text().catch(() => "");
    return `écriture : HTTP ${reponse.status} ${message.slice(0, 120)}`;
  }
  return null;
}

async function principal() {
  const { url, cle, dit } = await acces();
  if (!url || !cle) {
    console.log("  ✖  Il manque l'accès au projet.");
    console.log("     Soit `.env.local` porte NEXT_PUBLIC_SUPABASE_URL et");
    console.log("     SUPABASE_SECRET_KEY, soit tu passes :");
    console.log("       CIBLE_URL='https://…' CIBLE_SECRET_KEY='…' \\");
    console.log("         sh outils/reprendre-le-cache");
    process.exit(1);
  }

  const duree = await dureeCachePhotos(RACINE);
  const enTete = `max-age=${duree}`;
  const voulues = Number(duree);
  const appeler = fabriquerLeFacteur(url, cle);

  console.log();
  console.log("  ██ LA CONSIGNE DE CACHE DES PHOTOS ██");
  console.log(`     projet : ${nomDuProjet(url)}   (lu dans ${dit})`);
  console.log(`     seau   : ${SEAU}`);
  console.log(`     visée  : ${enTete}  (lue chez le site — lib/cache-photos)`);
  console.log(
    REEL
      ? "     MODE RÉEL — les photos mal réglées seront renvoyées."
      : "     ESSAI À BLANC — rien ne sera écrit. (Ajoute --reel pour agir.)"
  );
  console.log();

  const chemins = await listerLesObjets(appeler);
  if (chemins.length === 0) {
    console.log("  ⚠️  Aucun fichier lu. Deux causes possibles : le seau ne");
    console.log(`     s'appelle pas « ${SEAU} », ou la clé secrète employée`);
    console.log("     n'est pas celle de ce projet.");
    console.log("     (Le nom du seau se change avec SEAU_PHOTOS=…)");
    console.log();
    return;
  }

  //  ---- LE CONSTAT : la consigne de chacune, sans rien écrire ----
  const etat = { sansInfo: false };
  const aReprendre = [];
  const dejaBonnes = [];
  const illisibles = [];
  const parConsigne = new Map();
  for (const chemin of chemins) {
    const { consigne, type, echec } = await lireLaConsigne(appeler, chemin, etat);
    if (echec) {
      illisibles.push(`${chemin} — ${echec}`);
      continue;
    }
    const vue = consigne ?? "(aucune)";
    parConsigne.set(vue, (parConsigne.get(vue) ?? 0) + 1);
    if (secondesDeLaConsigne(consigne) === voulues) dejaBonnes.push(chemin);
    else aReprendre.push({ chemin, type });
  }

  console.log(`  photos du seau : ${chemins.length}`);
  for (const [consigne, combien] of [...parConsigne].sort((a, b) => b[1] - a[1])) {
    console.log(`     · ${String(combien).padStart(5)}  en « ${consigne} »`);
  }
  if (etat.sansInfo) {
    console.log("     (ce service n'a pas /object/info : lecture par HEAD)");
  }
  console.log();
  console.log(`  déjà bonnes  : ${dejaBonnes.length}`);
  console.log(`  à reprendre  : ${aReprendre.length}`);
  if (illisibles.length > 0) console.log(`  illisibles   : ${illisibles.length}`);
  console.log();

  if (aReprendre.length === 0) {
    console.log("  ✔  Rien à faire : toutes les photos portent déjà la consigne.");
    console.log();
    return;
  }
  if (!REEL) {
    for (const { chemin } of aReprendre.slice(0, 10)) console.log(`     · ${chemin}`);
    if (aReprendre.length > 10) {
      console.log(`     … et ${aReprendre.length - 10} autre(s)`);
    }
    console.log();
    console.log("  Pour agir : ajoute --reel à la fin de la commande.");
    console.log("  (Chaque photo est relue puis renvoyée à SON chemin, telle");
    console.log("   quelle : rien n'est recompressé, rien n'est renommé.)");
    console.log();
    return;
  }

  //  ---- LA REPRISE ----
  let reprises = 0;
  const soucis = [];
  //  L'ARRÊT SUR PANNE FRANCHE (nº 766 bis) : dix échecs D'AFFILÉE,
  //  c'est une panne — une clé sans droit d'écriture, un seau parti —
  //  et non une suite de fichiers abîmés. Un échec isolé au milieu de
  //  réussites n'arrête rien.
  let deSuite = 0;
  let franche = false;
  for (const { chemin, type } of aReprendre) {
    const echec = await reprendreUnePhoto(appeler, chemin, enTete, type);
    if (echec) {
      soucis.push(`${chemin} — ${echec}`);
      deSuite += 1;
      if (deSuite >= 10) {
        franche = true;
        break;
      }
    } else {
      reprises += 1;
      deSuite = 0;
    }
    if ((reprises + soucis.length) % 25 === 0) {
      console.log(`     … ${reprises + soucis.length}/${aReprendre.length}`);
    }
  }

  //  ---- LE CONTRÔLE : on relit ce qu'on vient d'écrire ----
  let confirmees = 0;
  const recalcitrantes = [];
  for (const { chemin } of aReprendre) {
    const { consigne } = await lireLaConsigne(appeler, chemin, etat);
    if (secondesDeLaConsigne(consigne) === voulues) confirmees += 1;
    else recalcitrantes.push(`${chemin} — ${consigne ?? "(aucune)"}`);
  }

  console.log();
  console.log(`  ── reprises : ${reprises} · en échec : ${soucis.length}`);
  console.log(`  ── contrôle : ${confirmees}/${aReprendre.length} portent la consigne`);
  if (franche) {
    console.log();
    console.log("  ⛔  ARRÊTÉ : dix échecs d'affilée, c'est une panne franche.");
    console.log("     Les deux causes : la clé employée n'a pas le droit");
    console.log(`     d'écrire, ou le seau « ${SEAU} » n'est pas celui-là.`);
  }
  if (soucis.length > 0) {
    console.log();
    console.log("  ⚠️  CE QUI N'EST PAS PASSÉ (les vingt premiers) :");
    for (const s of soucis.slice(0, 20)) console.log(`     · ${s}`);
    console.log();
    console.log("     Relance la commande : elle ne reprend que ce qui reste.");
  }
  if (recalcitrantes.length > 0 && soucis.length === 0) {
    console.log();
    console.log("  ⚠️  RENVOYÉES SANS EFFET (les dix premières) — le service");
    console.log("     n'a pas retenu la consigne :");
    for (const r of recalcitrantes.slice(0, 10)) console.log(`     · ${r}`);
  }
  console.log();
  if (confirmees === aReprendre.length && soucis.length === 0) {
    console.log("  ✔  Toutes les photos du seau portent maintenant la consigne.");
    console.log("     Le réseau de diffusion peut encore servir quelques");
    console.log("     minutes ses réponses d'avant : c'est normal, et ça passe");
    console.log("     tout seul. Pour vérifier depuis ton Mac :");
    console.log("       curl -sI \"<adresse d'une photo>\" | grep -i cache-control");
    console.log();
  }
}

principal().catch((erreur) => {
  console.log(`  ✖  ${raisonLisible(erreur)}`);
  process.exit(1);
});
