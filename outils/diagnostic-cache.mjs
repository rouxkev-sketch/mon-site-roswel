//  ██ nº 779 — QUELLE MÉTHODE CHANGE VRAIMENT L'EN-TÊTE SERVI ? ██
//  ==================================================================
//  On ne le lance pas directement : `sh outils/diagnostic-cache` s'en
//  charge. Le QUOI et le POURQUOI sont écrits là-bas.
//
//  ⚠️ IL NE TOUCHE QU'UNE SEULE PHOTO — celle qu'on lui nomme, ou la
//  première mal réglée. Les autres ne sont jamais écrites.
//
//  ⚠️ CE QU'IL MESURE, ET C'EST TOUT LE POINT DE CETTE PASSE : après
//  chaque essai, il lit L'EN-TÊTE RÉELLEMENT SERVI (celui que le
//  navigateur reçoit), ET la métadonnée que l'API rapporte. Les deux
//  peuvent se contredire — c'est justement ce que le propriétaire a
//  relevé, et ce que la nº 778 n'avait pas vu parce qu'elle ne
//  regardait que la seconde.
import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";
import {
  dureeCachePhotos,
  secondesDeLaConsigne,
} from "./duree-cache-photos.mjs";

const RACINE = process.cwd();
const REEL = process.argv.includes("--reel");
const SEAU = process.env.SEAU_PHOTOS ?? "photos-tatoueurs";
const PHOTO = process.env.PHOTO ?? "";
const DELAI_MS = Math.max(10_000, Number(process.env.DELAI_LECTURE ?? 60) * 1000);
const JOURNAL = path.join(RACINE, "diagnostic-cache.txt");

let journalOuvert = true;
async function dire(ligne = "") {
  console.log(ligne);
  if (!journalOuvert) return;
  try {
    await appendFile(JOURNAL, `${ligne}\n`);
  } catch {
    journalOuvert = false;
  }
}

/*  L'accès : mêmes noms que les autres outils (nº 777). */
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
    const { delai = DELAI_MS, sansJeton = false, ...reste } = options;
    const controle = new AbortController();
    const minuterie = setTimeout(() => controle.abort(), delai);
    try {
      return await fetch(`${base}${chemin}`, {
        ...reste,
        headers: sansJeton
          ? { ...(reste.headers ?? {}) }
          : { ...enTetes, ...(reste.headers ?? {}) },
        signal: controle.signal,
      });
    } finally {
      clearTimeout(minuterie);
    }
  };
}
const encoder = (chemin) => chemin.split("/").map(encodeURIComponent).join("/");
const nomDuProjet = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return "(adresse illisible)";
  }
};
function raisonLisible(erreur) {
  const texte = String(erreur?.message ?? erreur);
  if (/abort/i.test(texte)) return "trop lent, la demande a été abandonnée";
  if (/fetch failed|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT/i.test(texte)) {
    return "projet injoignable (adresse fausse, ou pas de réseau)";
  }
  return texte.slice(0, 140);
}

/**
 * ██ §1 (nº 780) — QUELLE PORTE DIT LA VÉRITÉ ██
 * ------------------------------------------------------------------
 * CE QUI S'EST PASSÉ À LA nº 779, ET C'EST MA TROISIÈME MESURE FAUSSE
 * D'AFFILÉE : le diagnostic lisait l'adresse PUBLIQUE en lui ajoutant
 * un paramètre neuf (`?diagnostic=<instant>`), en croyant qu'un
 * paramètre inédit obligerait le réseau de diffusion à redemander le
 * fichier à l'origine. IL NE L'OBLIGE PAS : ce réseau-là ne met pas la
 * requête dans sa clé de cache. La réponse est donc revenue de son
 * cache — `cf-cache-status: HIT` était écrit noir sur blanc dans mon
 * propre relevé — avec une consigne qui datait d'on ne sait quand, et
 * j'en ai conclu que tout allait bien. Une minute plus tard, le
 * propriétaire tombait sur un `MISS` : l'origine, elle, répondait
 * `no-cache`.
 * ⚠️ LES DEUX OUTILS NE SE CONTREDISAIENT PAS : `reprendre-le-cache`
 * lit par la voie AUTHENTIFIÉE, que ce réseau ne met jamais en cache
 * (une réponse porteuse d'un jeton n'est pas partageable), et il
 * disait déjà « en-tête inchangé ». C'est le diagnostic qui se
 * trompait de porte.
 *
 * LA RÈGLE, DÉSORMAIS :
 *  · LA MESURE QUI DÉCIDE est la voie AUTHENTIFIÉE. Elle traverse le
 *    bord sans s'y arrêter : ce qu'elle rend vient du service ;
 *  · LA VOIE PUBLIQUE reste affichée — c'est ce que reçoit vraiment un
 *    visiteur — mais elle NE CONCLUT JAMAIS tant que le bord dit avoir
 *    répondu de son cache. Le mot `HIT` disqualifie la lecture, et on
 *    l'écrit en toutes lettres au lieu de la prendre pour une preuve ;
 *  · LA MÉTADONNÉE de l'API est montrée pour l'écart qu'elle révèle
 *    (nº 779), jamais pour conclure.
 */
const LECTURE_FRAICHE = /^(MISS|EXPIRED|DYNAMIC|BYPASS|REVALIDATED)$/i;

async function mesurer(appeler, chemin) {
  const marque = `diagnostic=${Date.now()}`;
  const lu = {
    origine: null,
    publique: null,
    bord: "(non dit)",
    metadonnee: null,
    age: null,
  };
  //  1 · L'ORIGINE — la voie authentifiée, jamais mise en cache.
  try {
    const reponse = await appeler(
      `/storage/v1/object/${SEAU}/${encoder(chemin)}?${marque}`,
      { method: "HEAD" }
    );
    lu.origine = reponse.ok
      ? reponse.headers.get("cache-control")
      : `(HTTP ${reponse.status})`;
  } catch (erreur) {
    lu.origine = `(illisible : ${raisonLisible(erreur)})`;
  }
  //  2 · LA PORTE PUBLIQUE — témoin, et rien de plus.
  try {
    const reponse = await appeler(
      `/storage/v1/object/public/${SEAU}/${encoder(chemin)}?${marque}`,
      { method: "GET", sansJeton: true }
    );
    lu.publique = reponse.headers.get("cache-control");
    lu.bord =
      reponse.headers.get("cf-cache-status") ??
      reponse.headers.get("x-cache") ??
      "(non dit)";
    lu.age = reponse.headers.get("age");
  } catch (erreur) {
    lu.publique = `(illisible : ${raisonLisible(erreur)})`;
  }
  //  3 · LA MÉTADONNÉE rangée en base.
  try {
    const info = await appeler(`/storage/v1/object/info/${SEAU}/${encoder(chemin)}`);
    if (info.ok) {
      const m = await info.json().catch(() => ({}));
      lu.metadonnee = m.cacheControl ?? m.cache_control ?? null;
    }
  } catch {
    /*  Ce service n'a pas ce point d'entrée : ce n'est pas grave ici. */
  }
  return lu;
}

async function rendreCompte(appeler, chemin, voulues, titre) {
  const l = await mesurer(appeler, chemin);
  const fraiche = LECTURE_FRAICHE.test(String(l.bord));
  await dire(`     · ORIGINE (à la clé)  : ${l.origine ?? "(aucun)"}      ← la mesure`);
  await dire(
    `     · porte publique      : ${l.publique ?? "(aucun)"}   [${l.bord}` +
      `${l.age ? `, âge ${l.age} s` : ""}]` +
      (fraiche ? "" : "  ⚠️ réponse du cache du bord — ne prouve rien")
  );
  await dire(`     · métadonnée de l'API : ${l.metadonnee ?? "(aucune)"}`);
  //  ⚠️ LE VERDICT NE TIENT QU'À L'ORIGINE (§1 nº 780).
  const bon = secondesDeLaConsigne(l.origine) === voulues;
  await dire(
    `     ${bon ? "✔" : "✖"} ${titre} — ${
      bon ? "L'ORIGINE SERT LA BONNE CONSIGNE" : "l'origine sert toujours l'ancienne"
    }`
  );
  return bon;
}

async function principal() {
  const { url, cle, dit } = await acces();
  if (!url || !cle) {
    await dire("  ✖  Il manque l'accès au projet (voir sh outils/diagnostic-cache).");
    process.exit(1);
  }
  const duree = await dureeCachePhotos(RACINE);
  const enTete = `max-age=${duree}`;
  const voulues = Number(duree);
  const appeler = fabriquerLeFacteur(url, cle);

  await dire();
  await dire("  ██ DIAGNOSTIC : QUELLE MÉTHODE CHANGE L'EN-TÊTE SERVI ? ██");
  await dire(`     projet : ${nomDuProjet(url)}   (lu dans ${dit})`);
  await dire(`     seau   : ${SEAU}`);
  await dire(`     visée  : ${enTete}`);
  await dire(`     journal : ${path.basename(JOURNAL)}`);
  await dire();

  //  ---- LA PHOTO TÉMOIN ----
  let chemin = PHOTO;
  if (!chemin) {
    await dire("  Recherche d'une photo mal réglée…");
    const reponse = await appeler(`/storage/v1/object/list/${SEAU}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prefix: "", limit: 100, offset: 0, sortBy: { column: "name", order: "asc" } }),
    });
    const lot = reponse.ok ? await reponse.json().catch(() => []) : [];
    const dossier = Array.isArray(lot) ? lot.find((e) => !e.id) : null;
    if (dossier) {
      const dedans = await appeler(`/storage/v1/object/list/${SEAU}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prefix: dossier.name, limit: 100, offset: 0, sortBy: { column: "name", order: "asc" } }),
      });
      const fichiers = dedans.ok ? await dedans.json().catch(() => []) : [];
      const premier = fichiers.find((e) => e.id);
      if (premier) chemin = `${dossier.name}/${premier.name}`;
    } else if (Array.isArray(lot)) {
      const premier = lot.find((e) => e.id);
      if (premier) chemin = premier.name;
    }
  }
  if (!chemin) {
    await dire("  ✖  Aucune photo trouvée dans ce seau.");
    await dire("     Nomme-la toi-même : PHOTO='dossier/fichier.jpg' …");
    return;
  }
  await dire(`  PHOTO TÉMOIN : ${chemin}`);
  await dire("  (une seule photo est touchée — jamais les autres)");
  await dire();

  await dire("  ── ÉTAT DE DÉPART ──");
  const dejaBon = await rendreCompte(appeler, chemin, voulues, "au départ");
  await dire();
  if (dejaBon) {
    await dire("  Cette photo est déjà bien servie : prends-en une autre pour");
    await dire("  le diagnostic — PHOTO='dossier/fichier.jpg' sh outils/diagnostic-cache");
    await dire();
    return;
  }
  if (!REEL) {
    await dire("  ESSAI À BLANC — rien n'a été écrit.");
    await dire("  Pour lancer les essais sur CETTE photo : ajoute --reel.");
    await dire();
    return;
  }

  //  ---- LES OCTETS, LUS UNE FOIS ----
  let octets;
  let type = "image/jpeg";
  try {
    const source = await appeler(`/storage/v1/object/${SEAU}/${encoder(chemin)}`);
    if (!source.ok) {
      await dire(`  ✖  Lecture impossible : HTTP ${source.status}`);
      return;
    }
    octets = Buffer.from(await source.arrayBuffer());
    type = source.headers.get("content-type") ?? type;
  } catch (erreur) {
    await dire(`  ✖  Lecture impossible : ${raisonLisible(erreur)}`);
    return;
  }
  await dire(`  (${octets.length} octets lus, type ${type} — c'est ce même contenu`);
  await dire("   qui est renvoyé à chaque essai : la photo ne change pas)");
  await dire();

  const essais = [];

  //  ── 1 · LE DÉPÔT BINAIRE, en-tête `cache-control` (la nº 777) ──
  //  C'est la voie que storage-api appelle « binary upload » : elle lit
  //  `request.headers['cache-control']`, et retombe sur `no-cache`
  //  quand l'en-tête manque.
  for (const geste of ["POST", "PUT"]) {
    await dire(`  ── ESSAI : dépôt BINAIRE en ${geste} (en-tête cache-control) ──`);
    try {
      const enTetes = { "content-type": type, "cache-control": enTete };
      if (geste === "POST") enTetes["x-upsert"] = "true";
      const reponse = await appeler(`/storage/v1/object/${SEAU}/${encoder(chemin)}`, {
        method: geste,
        headers: enTetes,
        body: octets,
      });
      await dire(`     envoi : HTTP ${reponse.status}`);
    } catch (erreur) {
      await dire(`     envoi : ${raisonLisible(erreur)}`);
    }
    essais.push([
      `binaire ${geste}`,
      await rendreCompte(appeler, chemin, voulues, `binaire ${geste}`),
    ]);
    await dire();
  }

  //  ── 2 · LE DÉPÔT MULTIPART, champ `cacheControl` ──
  //  C'EST LA VOIE DU SITE : le client officiel, dans un navigateur,
  //  envoie un formulaire dont le champ `cacheControl` porte le nombre
  //  de secondes — storage-api en fait `max-age=<nombre>`. Les photos
  //  déposées par le site sont bien réglées ; celles que nos outils ont
  //  envoyées en binaire ne le sont pas. Cet essai-là compare les deux
  //  voies sur la MÊME photo.
  await dire("  ── ESSAI : dépôt MULTIPART (champ cacheControl — la voie du site) ──");
  try {
    const formulaire = new FormData();
    formulaire.append("cacheControl", String(duree));
    //  Le client officiel envoie le fichier sous un nom de champ VIDE.
    formulaire.append("", new Blob([octets], { type }), chemin.split("/").pop());
    const reponse = await appeler(`/storage/v1/object/${SEAU}/${encoder(chemin)}`, {
      method: "POST",
      headers: { "x-upsert": "true" },
      body: formulaire,
    });
    await dire(`     envoi : HTTP ${reponse.status}`);
  } catch (erreur) {
    await dire(`     envoi : ${raisonLisible(erreur)}`);
  }
  essais.push([
    "multipart",
    await rendreCompte(appeler, chemin, voulues, "multipart"),
  ]);
  await dire();

  //  ── 3 · LA COPIE QUI REMPLACE LES MÉTADONNÉES ──
  //  `/object/copy` accepte `metadata: { cacheControl }` avec
  //  `copyMetadata: false` : le stockage reçoit alors l'ordre de
  //  REMPLACER les métadonnées de l'objet au lieu de les recopier.
  //  C'est le seul geste qui vise la consigne SANS renvoyer le
  //  fichier. ⚠️ Il écrit dans un dossier à part
  //  (`diagnostic-cache/…`) : l'original n'est pas touché, et cette
  //  copie se supprime à la main quand tu veux.
  const copie = `diagnostic-cache/${chemin.split("/").pop()}`;
  await dire("  ── ESSAI : COPIE avec remplacement des métadonnées ──");
  await dire(`     (vers ${copie} — l'original n'est pas touché)`);
  try {
    const reponse = await appeler(`/storage/v1/object/copy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        bucketId: SEAU,
        sourceKey: chemin,
        destinationBucket: SEAU,
        destinationKey: copie,
        copyMetadata: false,
        metadata: { cacheControl: enTete, mimetype: type },
      }),
    });
    const corps = await reponse.text().catch(() => "");
    await dire(`     envoi : HTTP ${reponse.status} ${corps.slice(0, 100)}`);
    if (reponse.ok) {
      essais.push([
        "copie (metadata REPLACE)",
        await rendreCompte(appeler, copie, voulues, "copie"),
      ]);
    } else {
      essais.push(["copie (metadata REPLACE)", false]);
    }
  } catch (erreur) {
    await dire(`     envoi : ${raisonLisible(erreur)}`);
    essais.push(["copie (metadata REPLACE)", false]);
  }
  await dire();

  //  ── 4 · EFFACER PUIS REDÉPOSER ──
  //  Le dernier recours : un objet NEUF, jamais un objet mis à jour.
  //  Si même celui-là est servi en `no-cache`, alors la consigne ne
  //  vient pas du dépôt du tout, et c'est un réglage du service.
  //  ⚠️ CET ESSAI SE FAIT SUR LA COPIE, JAMAIS SUR L'ORIGINAL : on
  //  n'efface une photo du portfolio sous aucun prétexte.
  await dire("  ── ESSAI : EFFACER puis REDÉPOSER (sur la copie seulement) ──");
  try {
    const efface = await appeler(`/storage/v1/object/${SEAU}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prefixes: [copie] }),
    });
    await dire(`     effacement : HTTP ${efface.status}`);
    const formulaire = new FormData();
    formulaire.append("cacheControl", String(duree));
    formulaire.append("", new Blob([octets], { type }), copie.split("/").pop());
    const depot = await appeler(`/storage/v1/object/${SEAU}/${encoder(copie)}`, {
      method: "POST",
      body: formulaire,
    });
    await dire(`     dépôt neuf : HTTP ${depot.status}`);
    essais.push([
      "effacer + redéposer",
      await rendreCompte(appeler, copie, voulues, "dépôt neuf"),
    ]);
  } catch (erreur) {
    await dire(`     ${raisonLisible(erreur)}`);
    essais.push(["effacer + redéposer", false]);
  }
  await dire();

  //  ---- LE VERDICT ----
  await dire("  ══ CE QUI MARCHE, ET CE QUI NE MARCHE PAS ══");
  for (const [nom, bon] of essais) {
    await dire(`     ${bon ? "✔" : "✖"}  ${nom}`);
  }
  await dire();
  const gagnantes = essais.filter(([, bon]) => bon).map(([nom]) => nom);
  if (gagnantes.length > 0) {
    await dire(`  ➜  MÉTHODE À EMPLOYER : ${gagnantes[0]}`);
    await dire("     Envoie-moi ces lignes : je règle l'outil de reprise");
    await dire("     sur cette méthode-là, et les 1150 photos suivront.");
  } else {
    await dire("  ➜  AUCUNE des méthodes ne change ce que sert l'origine.");
    await dire("     Ce n'est alors pas le fichier, mais un réglage du");
    await dire("     service (seau ou projet). Envoie-moi ces lignes :");
    await dire("     elles disent exactement ce qui a été essayé.");
  }

  //  §2 (nº 780) — LA COMMANDE DE CONTRÔLE, PRÊTE À COLLER. Le
  //  propriétaire l'a demandée : une seule commande, qui interroge
  //  L'ORIGINE (donc pas le cache du bord) et n'affiche AUCUNE clé —
  //  elle la lit dans `.env.local` sans jamais l'imprimer.
  await dire();
  await dire("  ══ POUR VÉRIFIER TOI-MÊME, À COLLER TEL QUEL ══");
  await dire("  (une seule commande ; elle n'affiche jamais ta clé)");
  await dire();
  await dire("  CLE=$(grep '^SUPABASE_SECRET_KEY=' .env.local | cut -d= -f2-) \\");
  await dire("  ; URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d= -f2-) \\");
  await dire(`  ; curl -sSI -H "apikey: $CLE" -H "Authorization: Bearer $CLE" \\`);
  await dire(`      "$URL/storage/v1/object/${SEAU}/${chemin}" \\`);
  await dire("    | grep -iE 'cache-control|content-type|etag|last-modified'");
  await dire();
  await dire("  ⚠️ C'est l'adresse SANS « /public/ » : celle-là interroge le");
  await dire("     service lui-même. L'adresse publique, elle, peut te");
  await dire("     répondre depuis le cache du bord (`cf-cache-status: HIT`)");
  await dire("     et te montrer une consigne qui n'est plus celle du");
  await dire("     fichier — c'est exactement ce qui m'a trompé.");
  await dire();
  await dire(`  (Tout est aussi dans ${path.basename(JOURNAL)}.)`);
  await dire();
}

principal().catch(async (erreur) => {
  await dire(`  ✖  ${raisonLisible(erreur)}`);
  process.exit(1);
});
