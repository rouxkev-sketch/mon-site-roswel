//  ██ nº 766 — COPIER LES PHOTOS VERS LE NOUVEAU PROJET ██
//  ==================================================================
//  On ne le lance pas directement : `sh outils/demenager-photos` s'en
//  charge. Le QUOI et le POURQUOI sont écrits là-bas.
//
//  ⚠️ ESSAI À BLANC PAR DÉFAUT (la règle de `reprendre-avatars`,
//  nº 719) : sans `--reel`, il liste les deux côtés, dit ce qui
//  manque, et ne téléverse rien.
//
//  ⚠️ IL N'EFFACE JAMAIS RIEN, ni d'un côté ni de l'autre. Dans
//  l'ancien projet il ne fait que LIRE. Dans le nouveau, il n'écrit
//  qu'un fichier ABSENT — un fichier déjà là est laissé tel quel et
//  compté « déjà en place ». Relancé dix fois, il ne recopie que ce
//  qui manque encore.
//
//  ⚠️ AUCUNE CLÉ AFFICHÉE. Le script ne montre que les adresses des
//  projets, jamais leurs jetons.
import { readFile } from "node:fs/promises";
import path from "node:path";
//  §1 (nº 777) — LA DURÉE DE VALIDITÉ, lue chez le site : voir la
//  raison longue dans ce module et dans `copierUnFichier` plus bas.
import { enTeteCachePhotos } from "./duree-cache-photos.mjs";

const RACINE = process.cwd();
const REEL = process.argv.includes("--reel");
const TAILLE_PAGE = 1000;
const DELAI_MS = Math.max(10_000, Number(process.env.DELAI_LECTURE ?? 60) * 1000);
const DELAI_FICHIER_MS = Math.max(5_000, Number(process.env.DELAI_FICHIER ?? 30) * 1000);

/*  LE SEAU DES PHOTOS. C'est l'écriture unique de `lib/photos-stockage`
    (`BUCKET_PHOTOS`), recopiée ici parce qu'un outil de ligne de
    commande ne charge pas le code du site. Si elle change là-bas, elle
    change ici — les deux sont nommées dans le même souffle. */
const SEAU = process.env.SEAU_PHOTOS ?? "photos-tatoueurs";

async function accesSource() {
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
  return { url: lu.NEXT_PUBLIC_SUPABASE_URL, cle: lu.SUPABASE_SECRET_KEY };
}
const accesCible = () => ({
  url: process.env.CIBLE_URL,
  cle: process.env.CIBLE_SECRET_KEY,
});

function fabriquerLeFacteur(url, cle) {
  const enTetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  return async function appeler(chemin, options = {}) {
    const { delai = DELAI_MS, ...reste } = options;
    const controle = new AbortController();
    const minuterie = setTimeout(() => controle.abort(), delai);
    try {
      return await fetch(`${url}${chemin}`, {
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

/** Les objets d'un seau, dossier par dossier. L'API ne descend pas
    toute seule : elle rend les fichiers d'un niveau, et les dossiers
    comme des entrées SANS identifiant. (Même descente que la
    sauvegarde, nº 689.) */
async function listerLesObjets(appeler, seau, prefixe = "") {
  const trouves = [];
  for (let depart = 0; ; depart += TAILLE_PAGE) {
    let reponse;
    try {
      reponse = await appeler(`/storage/v1/object/list/${seau}`, {
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
      else trouves.push(...(await listerLesObjets(appeler, seau, chemin)));
    }
    if (lot.length < TAILLE_PAGE) break;
  }
  return trouves;
}

/** LE SEUL GESTE D'ÉCRITURE. `x-upsert: false` : si le fichier existe
    déjà dans le nouveau projet, le serveur REFUSE et on passe au
    suivant. C'est voulu — on ne réécrit jamais par-dessus.
    ██ §1 (nº 777) — L'ENVOI PORTE LA CONSIGNE DE CACHE ██
    ------------------------------------------------------------------
    CE QUI SE PASSAIT, ET LE PROPRIÉTAIRE L'A RELEVÉ SUR LES 1150
    PHOTOS COPIÉES : elles étaient servies en `cache-control:
    no-cache`. Le déménagement copiait bien le CONTENU, mais pas la
    consigne de la nº 721 — et une consigne ne se copie pas toute
    seule : elle n'est pas dans le fichier, elle est dans les
    métadonnées de l'objet, posées AU DÉPÔT par l'en-tête de l'envoi.
    Sans cet en-tête, le service pose son défaut, `no-cache`.
    CE QUE ÇA COÛTAIT : `no-cache` ne veut pas dire « garde-la une
    heure », mais « ne réutilise jamais sans me redemander d'abord ».
    Le réseau de diffusion revalidait donc chaque photo auprès de
    l'origine — désormais aux États-Unis : la distance se payait à
    chaque affichage, sur toutes les photos de toutes les grilles.
    ⚠️ LA VALEUR N'EST PAS ÉCRITE ICI (piège nº 378) : elle est LUE
    chez le site (`lib/cache-photos` via `duree-cache-photos.mjs`),
    comme la reprise des avatars le fait depuis la nº 721.
    ⚠️ ET LES PHOTOS DÉJÀ COPIÉES ? Ce script ne réécrit jamais un
    fichier en place — c'est sa règle, et elle ne change pas. Pour
    reprendre la consigne d'un seau déjà rempli, il y a l'outil de la
    même passe : `sh outils/reprendre-le-cache`. */
async function copierUnFichier(lire, ecrire, chemin, cache) {
  let source;
  try {
    source = await lire(`/storage/v1/object/${SEAU}/${encoder(chemin)}`, {
      delai: DELAI_FICHIER_MS,
    });
  } catch (erreur) {
    return `lecture : ${raisonLisible(erreur)}`;
  }
  if (!source.ok) return `lecture : HTTP ${source.status}`;
  const octets = await source.arrayBuffer();
  const type = source.headers.get("content-type") ?? "application/octet-stream";
  let reponse;
  try {
    reponse = await ecrire(`/storage/v1/object/${SEAU}/${encoder(chemin)}`, {
      method: "POST",
      headers: {
        "content-type": type,
        "x-upsert": "false",
        //  §1 (nº 777) — la consigne, sur l'envoi (voir la note).
        "cache-control": cache,
      },
      body: Buffer.from(octets),
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
  const source = await accesSource();
  const cible = accesCible();
  if (!source.url || !source.cle) {
    console.log("  ✖  Il manque l'accès à l'ANCIEN projet (.env.local).");
    process.exit(1);
  }
  if (!cible.url || !cible.cle) {
    console.log("  ✖  Il manque l'accès au NOUVEAU projet.");
    console.log("     CIBLE_URL='https://…' CIBLE_SECRET_KEY='…' \\");
    console.log("       sh outils/demenager-photos");
    process.exit(1);
  }
  if (source.url === cible.url) {
    console.log("  ✖  La source et la cible sont le MÊME projet. Rien à faire.");
    process.exit(1);
  }

  const lire = fabriquerLeFacteur(source.url, source.cle);
  const ecrire = fabriquerLeFacteur(cible.url, cible.cle);
  //  §1 (nº 777) — la consigne de cache que portera chaque envoi.
  const cache = await enTeteCachePhotos(RACINE);

  console.log();
  console.log("  ██ DÉMÉNAGEMENT DES PHOTOS ██");
  console.log(`     seau   : ${SEAU}`);
  console.log(`     depuis : ${nomDuProjet(source.url)}`);
  console.log(`     vers   : ${nomDuProjet(cible.url)}`);
  console.log(`     cache  : ${cache} (posé sur chaque copie — nº 777)`);
  console.log(
    REEL
      ? "     MODE RÉEL — les fichiers manquants seront copiés."
      : "     ESSAI À BLANC — rien ne sera copié. (Ajoute --reel pour agir.)"
  );
  console.log();

  const cotesSource = await listerLesObjets(lire, SEAU);
  const cotesCible = new Set(await listerLesObjets(ecrire, SEAU));
  const manquants = cotesSource.filter((c) => !cotesCible.has(c));

  console.log(`  ancien projet  : ${cotesSource.length} fichier(s)`);
  console.log(`  nouveau projet : ${cotesCible.size} fichier(s) déjà en place`);
  console.log(`  à copier       : ${manquants.length}`);
  console.log();

  if (cotesSource.length === 0) {
    console.log("  ⚠️  Aucun fichier lu dans l'ancien projet. Deux causes");
    console.log(`     possibles : le seau ne s'appelle pas « ${SEAU} », ou la`);
    console.log("     clé secrète employée n'est pas la bonne.");
    console.log("     (Le nom du seau se change avec SEAU_PHOTOS=…)");
    console.log();
    return;
  }
  if (!REEL) {
    for (const c of manquants.slice(0, 10)) console.log(`     · ${c}`);
    if (manquants.length > 10) console.log(`     … et ${manquants.length - 10} autre(s)`);
    console.log();
    console.log("  Pour agir : ajoute --reel à la fin de la commande.");
    console.log();
    return;
  }

  let copies = 0;
  const soucis = [];
  //  L'ARRÊT SUR PANNE FRANCHE (nº 766 bis). Un seau qui n'existe pas
  //  fait échouer TOUS les fichiers de la même façon : dérouler cinq
  //  mille refus identiques n'apprend rien de plus que les dix
  //  premiers, et ça prend une heure. Dix échecs D'AFFILÉE et on
  //  s'arrête. Un échec isolé au milieu de réussites, lui, n'arrête
  //  rien : c'est un fichier abîmé, pas une panne.
  let deSuite = 0;
  let franche = false;
  for (const chemin of manquants) {
    const echec = await copierUnFichier(lire, ecrire, chemin, cache);
    if (echec) {
      soucis.push(`${chemin} — ${echec}`);
      deSuite += 1;
      if (deSuite >= 10) {
        franche = true;
        break;
      }
    } else {
      copies += 1;
      deSuite = 0;
    }
    if ((copies + soucis.length) % 25 === 0) {
      console.log(`     … ${copies + soucis.length}/${manquants.length}`);
    }
  }
  console.log();
  console.log(`  ── copiés : ${copies} · en échec : ${soucis.length}`);
  if (franche) {
    console.log();
    console.log("  ⛔  ARRÊTÉ : dix échecs d'affilée, c'est une panne franche et");
    console.log("     non une suite de fichiers abîmés. Les deux causes :");
    console.log(`     · le seau « ${SEAU} » n'existe pas encore dans le nouveau`);
    console.log("       projet (Storage ▸ New bucket, coché « Public ») ;");
    console.log("     · la clé secrète employée n'est pas celle du bon projet.");
  }
  if (soucis.length > 0) {
    console.log();
    console.log("  ⚠️  CE QUI N'EST PAS PASSÉ (les vingt premiers) :");
    for (const s of soucis.slice(0, 20)) console.log(`     · ${s}`);
    console.log();
    console.log("     Relance la commande : elle ne recopie que ce qui manque.");
  }
  console.log();
}

principal().catch((erreur) => {
  console.log(`  ✖  ${raisonLisible(erreur)}`);
  process.exit(1);
});
