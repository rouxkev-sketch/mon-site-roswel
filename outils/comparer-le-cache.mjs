//  ██ nº 781 — LE MÊME GESTE, DANS LES DEUX PROJETS ██
//  ==================================================================
//  On ne le lance pas directement : `sh outils/comparer-le-cache`
//  s'en charge. Le QUOI et le POURQUOI sont écrits là-bas.
//
//  CE QU'IL ÉTABLIT, ET C'EST TOUT CE QU'ON LUI DEMANDE : un fait
//  reproductible. Le même dépôt, avec la même consigne, dans l'ancien
//  projet et dans le nouveau — puis, des deux côtés, ce que le service
//  RÉPOND. Si l'un sert la consigne et l'autre non, ce n'est ni le
//  fichier, ni la façon de l'envoyer : c'est le service. C'est
//  exactement ce qu'un support doit recevoir.
//
//  ⚠️ IL NE TOUCHE À AUCUNE PHOTO DU PORTFOLIO. Il dépose un fichier
//  d'essai de quelques octets dans `essai-cache/`, le lit, puis
//  L'EFFACE. Rien d'autre n'est écrit.
import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";
import {
  dureeCachePhotos,
  secondesDeLaConsigne,
} from "./duree-cache-photos.mjs";

const RACINE = process.cwd();
const SEAU = process.env.SEAU_PHOTOS ?? "photos-tatoueurs";
const DELAI_MS = Math.max(10_000, Number(process.env.DELAI_LECTURE ?? 60) * 1000);
const JOURNAL = path.join(RACINE, "comparer-le-cache.txt");

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

async function lireEnvLocal() {
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
  return lu;
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
 * LE RELEVÉ D'UN PROJET — quatre faits, et une expérience.
 * ------------------------------------------------------------------
 * ⚠️ TOUTES LES LECTURES PASSENT PAR LA VOIE AUTHENTIFIÉE (sans
 * `/public/`) : c'est la leçon de la nº 780 — l'adresse publique peut
 * répondre depuis le cache du bord et montrer une consigne qui n'est
 * plus celle du fichier.
 */
async function relever(nom, url, cle, duree) {
  const appeler = fabriquerLeFacteur(url, cle);
  const enTete = `max-age=${duree}`;
  const releve = { nom, projet: nomDuProjet(url) };

  //  1 · LA VERSION DU SERVICE.
  try {
    const reponse = await appeler("/storage/v1/version");
    releve.version = reponse.ok
      ? (await reponse.text()).trim().slice(0, 40)
      : `(HTTP ${reponse.status})`;
  } catch (erreur) {
    releve.version = `(${raisonLisible(erreur)})`;
  }

  //  2 · LES RÉGLAGES DU SEAU. ⚠️ AUCUN N'EST UNE CONSIGNE DE CACHE :
  //  le service n'en propose pas (sa réponse ne porte que l'identité,
  //  le caractère public, la taille limite et les types permis). On les
  //  relève pour ÉCARTER cette piste par la preuve, pas par principe.
  try {
    const reponse = await appeler(`/storage/v1/bucket/${SEAU}`);
    if (reponse.ok) {
      const b = await reponse.json().catch(() => ({}));
      releve.seau = {
        public: b.public,
        cree: b.created_at,
        limite: b.file_size_limit ?? null,
        types: b.allowed_mime_types ?? null,
      };
    } else {
      releve.seau = { erreur: `HTTP ${reponse.status}` };
    }
  } catch (erreur) {
    releve.seau = { erreur: raisonLisible(erreur) };
  }

  //  3 · L'EXPÉRIENCE — un fichier neuf, déposé avec la consigne.
  //  C'est LE fait : même geste, même consigne, deux services.
  const essai = `essai-cache/temoin-${Date.now()}.jpg`;
  const octets = Buffer.from("essai de consigne de cache — nº 781");
  try {
    const formulaire = new FormData();
    formulaire.append("cacheControl", String(duree));
    formulaire.append(
      "",
      new Blob([octets], { type: "image/jpeg" }),
      essai.split("/").pop()
    );
    const depot = await appeler(`/storage/v1/object/${SEAU}/${encoder(essai)}`, {
      method: "POST",
      body: formulaire,
    });
    releve.depot = `HTTP ${depot.status}`;
    if (depot.ok) {
      //  a) ce que le service RÉPOND (l'origine).
      const servi = await appeler(`/storage/v1/object/${SEAU}/${encoder(essai)}`, {
        method: "HEAD",
      });
      releve.servi = servi.headers.get("cache-control");
      releve.etag = servi.headers.get("etag");
      //  b) ce que le service RANGE (la métadonnée).
      const info = await appeler(`/storage/v1/object/info/${SEAU}/${encoder(essai)}`);
      if (info.ok) {
        const m = await info.json().catch(() => ({}));
        releve.metadonnee = m.cacheControl ?? m.cache_control ?? null;
      }
      releve.accord = secondesDeLaConsigne(releve.servi) === Number(duree);
    }
  } catch (erreur) {
    releve.depot = raisonLisible(erreur);
  } finally {
    //  ON EFFACE LE FICHIER D'ESSAI, toujours.
    try {
      await appeler(`/storage/v1/object/${SEAU}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prefixes: [essai] }),
      });
      releve.nettoye = true;
    } catch {
      releve.nettoye = false;
      releve.aEffacer = essai;
    }
  }
  releve.enTeteEnvoye = enTete;
  return releve;
}

async function montrer(r) {
  await dire(`  ── ${r.nom} — ${r.projet}`);
  await dire(`     version du service Storage : ${r.version}`);
  if (r.seau?.erreur) {
    await dire(`     seau « ${SEAU} » : ${r.seau.erreur}`);
  } else {
    await dire(
      `     seau « ${SEAU} » : public=${r.seau.public} · créé ${r.seau.cree}` +
        ` · limite ${r.seau.limite ?? "(aucune)"} · types ${
          r.seau.types ? JSON.stringify(r.seau.types) : "(tous)"
        }`
    );
  }
  await dire(`     dépôt du fichier d'essai   : ${r.depot}`);
  if (r.servi !== undefined) {
    await dire(`     → l'origine RÉPOND         : ${r.servi ?? "(aucune)"}`);
    await dire(`     → la métadonnée DIT        : ${r.metadonnee ?? "(aucune)"}`);
    await dire(
      `     ${r.accord ? "✔" : "✖"} ${
        r.accord
          ? "le service sert la consigne qu'on lui a donnée"
          : "le service RANGE la consigne mais NE LA SERT PAS"
      }`
    );
  }
  if (r.nettoye === false) {
    await dire(`     ⚠️ fichier d'essai non effacé : ${r.aEffacer}`);
  }
  await dire();
}

async function principal() {
  const lu = await lireEnvLocal();
  const duree = await dureeCachePhotos(RACINE);
  const projets = [];
  if (lu.NEXT_PUBLIC_SUPABASE_URL && lu.SUPABASE_SECRET_KEY) {
    projets.push({
      nom: "PROJET COURANT (celui du site)",
      url: lu.NEXT_PUBLIC_SUPABASE_URL,
      cle: lu.SUPABASE_SECRET_KEY,
    });
  }
  if (process.env.AUTRE_URL && process.env.AUTRE_SECRET_KEY) {
    projets.push({
      nom: "AUTRE PROJET (celui de comparaison)",
      url: process.env.AUTRE_URL,
      cle: process.env.AUTRE_SECRET_KEY,
    });
  }

  await dire();
  await dire("  ██ LE MÊME GESTE, DANS LES DEUX PROJETS ██");
  await dire(`     seau    : ${SEAU}`);
  await dire(`     consigne : max-age=${duree}`);
  await dire(`     journal : ${path.basename(JOURNAL)}`);
  await dire();
  if (projets.length === 0) {
    await dire("  ✖  Aucun projet à interroger (voir sh outils/comparer-le-cache).");
    process.exit(1);
  }
  await dire("  Un fichier d'essai de quelques octets est déposé dans");
  await dire("  `essai-cache/`, lu, puis effacé. Aucune photo n'est touchée.");
  await dire();

  const releves = [];
  for (const p of projets) {
    releves.push(await relever(p.nom, p.url, p.cle, duree));
  }
  for (const r of releves) await montrer(r);

  //  ---- CE QUE ÇA DÉMONTRE ----
  await dire("  ══ CE QUE CES CHIFFRES DÉMONTRENT ══");
  const servent = releves.filter((r) => r.accord === true);
  const nonServent = releves.filter((r) => r.accord === false);
  if (releves.length >= 2 && servent.length > 0 && nonServent.length > 0) {
    await dire("  Le MÊME dépôt, avec la MÊME consigne, sur un fichier NEUF :");
    for (const r of servent) await dire(`     ✔ ${r.projet} la sert`);
    for (const r of nonServent) await dire(`     ✖ ${r.projet} ne la sert pas`);
    await dire();
    await dire("  Ce n'est donc ni le fichier, ni la façon de l'envoyer, ni le");
    await dire("  code du site : c'est le service de ce projet-là. Le message");
    await dire("  à envoyer au support est prêt dans");
    await dire("  docs/SUPPORT-SUPABASE-cache.md — recopie ces lignes dedans.");
  } else if (nonServent.length === releves.length) {
    await dire("  Aucun des projets interrogés ne sert la consigne qu'on lui");
    await dire("  donne, alors que tous la RANGENT. Deux lectures possibles :");
    await dire("   · le service se comporte ainsi partout depuis une mise à");
    await dire("     jour — dans ce cas la version relevée ci-dessus le dira ;");
    await dire("   · ou la consigne n'est pas transmise au stockage lui-même.");
    await dire("  Dans les deux cas c'est au support de trancher : le message");
    await dire("  est prêt dans docs/SUPPORT-SUPABASE-cache.md.");
  } else if (servent.length === releves.length) {
    await dire("  Tous les projets interrogés servent la consigne. Si des");
    await dire("  photos restent en `no-cache`, ce sont donc les FICHIERS qui");
    await dire("  n'ont pas été repris : `sh outils/reprendre-le-cache --reel`.");
  }
  await dire();
  await dire(`  (Tout est aussi dans ${path.basename(JOURNAL)}.)`);
  await dire();
}

principal().catch(async (erreur) => {
  await dire(`  ✖  ${raisonLisible(erreur)}`);
  process.exit(1);
});
