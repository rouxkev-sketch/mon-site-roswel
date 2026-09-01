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
import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";
import {
  dureeCachePhotos,
  secondesDeLaConsigne,
} from "./duree-cache-photos.mjs";

const RACINE = process.cwd();
const REEL = process.argv.includes("--reel");

/**
 * ██ §1 (nº 778) — TOUT CE QUI S'AFFICHE S'ÉCRIT AUSSI SUR LE DISQUE ██
 * ------------------------------------------------------------------
 * LE RELEVÉ DU PROPRIÉTAIRE : « le --reel a affiché 1150/1150 puis plus
 * rien — session Mac fermée pendant le bilan ». Le compte rendu final
 * est parti avec la fenêtre, et il ne restait aucune trace de ce qui
 * avait été fait. Chaque ligne va donc AUSSI dans un fichier, écrite au
 * fil de l'eau : la fenêtre peut se fermer, le journal reste.
 * ⚠️ IL NE CONTIENT AUCUNE CLÉ : les mêmes lignes que l'écran, qui n'en
 * montrent jamais (règle du projet).
 */
const JOURNAL = path.join(RACINE, "reprise-du-cache.txt");
let journalOuvert = true;
async function dire(ligne = "") {
  console.log(ligne);
  if (!journalOuvert) return;
  try {
    await appendFile(JOURNAL, `${ligne}\n`);
  } catch {
    //  Dossier en lecture seule : on n'insiste pas, et on ne le redit
    //  pas à chaque ligne — l'écran, lui, continue.
    journalOuvert = false;
  }
}
/** L'heure, pour que le journal dise AUSSI quand c'est arrivé. */
const horodate = () =>
  new Date().toLocaleTimeString("fr-FR", { hour12: false });
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

/**
 * Les objets d'un seau, dossier par dossier — la descente de
 * `demenager-photos` et de la sauvegarde (nº 689) : l'API rend les
 * fichiers d'un niveau, et les dossiers en entrées SANS identifiant.
 *
 * ██ §2 (nº 778) — LE LISTING RAPPORTE DÉJÀ LA CONSIGNE ██
 * ------------------------------------------------------------------
 * CE QUI SE PASSAIT, ET C'EST LA CAUSE DU SILENCE : le constat de la
 * nº 777 demandait la consigne PHOTO PAR PHOTO (`/object/info`, puis
 * `HEAD` en repli). Mille cent cinquante allers-retours depuis un Mac
 * européen vers un projet américain — plusieurs minutes pendant
 * lesquelles rien ne s'affichait. L'outil n'était pas bloqué : il
 * travaillait sans le dire.
 * CE QUE ÇA IGNORAIT : chaque entrée du listing porte ses métadonnées —
 * `metadata.cacheControl` et `metadata.mimetype` (les types du client
 * officiel les déclarent : `FileMetadata`). La consigne des mille cent
 * cinquante photos tient donc dans les quelques requêtes de la
 * descente, et le constat devient immédiat.
 * ⚠️ ET SI LE SERVICE NE LES SERT PAS (entrée sans `metadata`) : on
 * garde le repli d'avant, photo par photo — mais on le DIT, et on
 * affiche l'avancement (voir le constat, §1 nº 779).
 */
/*  ⚠️ LE COMPTEUR EST PARTAGÉ, PAS LOCAL. Première écriture de cette
    passe : il comptait `trouves.length`, la liste du NIVEAU courant —
    or la descente est récursive, un dossier par appel. Dans un seau
    rangé par fiche (dix photos par dossier), ce nombre ne dépassait
    jamais dix : le seuil d'annonce n'était jamais atteint, et la
    descente restait muette. Mesuré au banc sur 1150 photos, corrigé
    ici : le total vit dans un objet que tous les appels partagent. */
async function listerLesObjets(
  appeler,
  prefixe = "",
  avancement = null,
  compte = { vues: 0 }
) {
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
      if (entree.id) {
        trouves.push({
          chemin,
          //  La consigne telle que le service la garde — `undefined`
          //  quand ce listing-ci ne porte pas de métadonnées.
          consigne: entree.metadata?.cacheControl,
          type: entree.metadata?.mimetype,
        });
        compte.vues += 1;
        await avancement?.(compte.vues);
      } else {
        trouves.push(
          ...(await listerLesObjets(appeler, chemin, avancement, compte))
        );
      }
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
/**
 * ██ §1 (nº 779) — L'EN-TÊTE SERVI, ET RIEN D'AUTRE ██
 * ------------------------------------------------------------------
 * CE QUE LA nº 778 A PRIS POUR UNE PREUVE, ET QUI N'EN ÉTAIT PAS : la
 * consigne rapportée par l'API (la liste du seau, `/object/info`).
 * Sur le vrai service, elle a dit « max-age=31536000 » pour les 1150
 * photos pendant que le serveur répondait « no-cache » au navigateur.
 * LA RAISON, LUE DANS LE CODE DU SERVICE : la liste montre ce qui est
 * rangé EN BASE (`storage.objects.metadata`), tandis que la réponse
 * servie porte la consigne DE L'OBJET DANS LE STOCKAGE — celle que le
 * moteur de rendu recopie depuis ce que le stockage lui rend. Deux
 * sources, qui peuvent se contredire.
 * LA RÈGLE, DÉSORMAIS : on ne juge QUE sur l'en-tête servi. C'est lui
 * que reçoit le navigateur, c'est lui qui décide si la photo repart à
 * l'origine à chaque affichage. Un `HEAD` par la voie authentifiée le
 * donne sans le corps, et sans passer par le réseau de diffusion —
 * donc sans risque de lire une copie d'avant.
 * ⚠️ CE QUE ÇA COÛTE : une requête par photo, là où la liste seule en
 * coûtait une par millier. C'est le prix de la vérité, et la nº 778
 * avait choisi la vitesse — au point de mesurer autre chose. Le
 * constat annonce donc sa durée et affiche son avancement.
 */
async function lireLEnTeteServi(appeler, chemin) {
  try {
    const reponse = await appeler(`/storage/v1/object/${SEAU}/${encoder(chemin)}`, {
      method: "HEAD",
      delai: DELAI_FICHIER_MS,
    });
    if (!reponse.ok) return { consigne: null, echec: `HTTP ${reponse.status}` };
    return {
      consigne: reponse.headers.get("cache-control"),
      type: reponse.headers.get("content-type"),
    };
  } catch (erreur) {
    return { consigne: null, echec: raisonLisible(erreur) };
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
 * fichier : on le lit, on le réécrit à SON chemin, avec l'en-tête. Le
 * contenu renvoyé est celui qu'on vient de lire, octet pour octet : la
 * photo n'est ni recompressée, ni redimensionnée, ni renommée.
 *
 * ██ §3 (nº 778) — DEUX GESTES POSSIBLES, ET C'EST LE SERVICE QUI
 * TRANCHE ██
 * ------------------------------------------------------------------
 * LE RELEVÉ DU PROPRIÉTAIRE : après un `--reel` allé jusqu'à
 * « 1150/1150 », les photos répondaient TOUJOURS `no-cache`. Renvoyer
 * un fichier peut donc, chez lui, ne pas reposer la consigne.
 * DEUX ÉCRITURES EXISTENT, et elles ne sont pas équivalentes partout :
 *  · `PUT` — la mise à jour, ce que le client officiel appelle
 *    `update()` ; c'est ce que la nº 777 employait ;
 *  · `POST` + `x-upsert: true` — le dépôt qui écrase, celui que
 *    `reprendre-avatars` emploie depuis la nº 719.
 * JE NE PEUX PAS TRANCHER D'ICI lequel le service retient : l'atelier
 * n'a pas accès au vrai projet. L'outil ne devine donc plus — il
 * ESSAIE sur UNE photo et RELIT le résultat (voir `eprouverLeGeste`).
 * Celui qui prend est employé pour les autres ; si aucun ne prend, on
 * s'arrête net au lieu de renvoyer mille photos pour rien.
 */
async function lireLesOctets(appeler, chemin) {
  let source;
  try {
    source = await appeler(`/storage/v1/object/${SEAU}/${encoder(chemin)}`, {
      delai: DELAI_FICHIER_MS,
    });
  } catch (erreur) {
    return { echec: `lecture : ${raisonLisible(erreur)}` };
  }
  if (!source.ok) return { echec: `lecture : HTTP ${source.status}` };
  return {
    octets: Buffer.from(await source.arrayBuffer()),
    //  Le type est celui que le service annonce — on ne le devine pas.
    type: source.headers.get("content-type"),
  };
}

async function reprendreUnePhoto(appeler, chemin, enTete, geste, typeConnu) {
  const { octets, type, echec } = await lireLesOctets(appeler, chemin);
  if (echec) return echec;
  const typeReel = type ?? typeConnu ?? "application/octet-stream";
  let reponse;
  try {
    if (geste === "MULTIPART") {
      /*  §2 (nº 779) — LA VOIE DU SITE. Le service a DEUX façons de
          lire la consigne (lu dans son code) : sur un dépôt binaire il
          prend l'en-tête `cache-control` ; sur un dépôt en formulaire
          il prend le CHAMP `cacheControl`, en secondes, dont il fait
          lui-même `max-age=<N>`. C'est cette seconde voie qu'emploie
          le client officiel depuis un navigateur — donc le site — et
          les photos déposées par le site sont bien réglées, quand
          celles que nos outils ont envoyées en binaire ne le sont pas.
          Le nom de champ VIDE pour le fichier est celui du client
          officiel : le service prend le premier fichier du formulaire,
          quel qu'en soit le nom. */
      const formulaire = new FormData();
      formulaire.append("cacheControl", enTete.replace(/^max-age=/, ""));
      formulaire.append(
        "",
        new Blob([octets], { type: typeReel }),
        chemin.split("/").pop()
      );
      reponse = await appeler(`/storage/v1/object/${SEAU}/${encoder(chemin)}`, {
        method: "POST",
        headers: { "x-upsert": "true" },
        body: formulaire,
        delai: DELAI_FICHIER_MS,
      });
    } else {
      const enTetes = { "content-type": typeReel, "cache-control": enTete };
      //  Le dépôt qui écrase se déclare ; la mise à jour n'en a pas besoin.
      if (geste === "POST") enTetes["x-upsert"] = "true";
      reponse = await appeler(`/storage/v1/object/${SEAU}/${encoder(chemin)}`, {
        method: geste,
        headers: enTetes,
        body: octets,
        delai: DELAI_FICHIER_MS,
      });
    }
  } catch (erreur) {
    return `écriture : ${raisonLisible(erreur)}`;
  }
  if (!reponse.ok) {
    const message = await reponse.text().catch(() => "");
    return `écriture : HTTP ${reponse.status} ${message.slice(0, 120)}`;
  }
  return null;
}

/**
 * §3 (nº 778) — LA PHOTO TÉMOIN. On reprend UNE photo, on relit sa
 * consigne à la source (jamais par l'adresse publique : le réseau de
 * diffusion pourrait rendre sa copie d'avant), et l'on ne déroule que
 * si elle a bien changé. Rend le geste qui marche, ou `null`.
 */
async function eprouverLeGeste(appeler, temoin, enTete, voulues) {
  //  ⚠️ DEUX ÉCHECS QUI NE SE SOIGNENT PAS PAREIL, et le compte rendu
  //  doit les distinguer : un envoi REFUSÉ (droits, seau, réseau) n'a
  //  rien à voir avec un envoi ACCEPTÉ dont la consigne ne prend pas
  //  (un réglage du service). Dire l'un pour l'autre enverrait chercher
  //  au mauvais endroit.
  const refus = [];
  //  §2 (nº 779) — LE FORMULAIRE EN PREMIER : c'est la voie du site, la
  //  seule dont on ait la preuve qu'elle donne des photos bien servies
  //  (celles que le site a déposées le sont). Les deux voies binaires
  //  restent essayées derrière — sur le vrai service, elles changent la
  //  fiche rangée en base sans changer l'en-tête servi.
  for (const geste of ["MULTIPART", "PUT", "POST"]) {
    await dire(`     essai du geste ${geste} sur « ${temoin.chemin} »…`);
    const echec = await reprendreUnePhoto(
      appeler,
      temoin.chemin,
      enTete,
      geste,
      temoin.type
    );
    if (echec) {
      await dire(`     ${geste} : refusé — ${echec}`);
      refus.push(`${geste} — ${echec}`);
      continue;
    }
    //  §1 (nº 779) — on relit L'EN-TÊTE SERVI, jamais la métadonnée :
    //  c'est cette confusion-là qui a fait croire à la nº 778 que
    //  1150 photos étaient réglées alors qu'aucune ne l'était.
    const { consigne } = await lireLEnTeteServi(appeler, temoin.chemin);
    if (secondesDeLaConsigne(consigne) === voulues) {
      await dire(`     ${geste} : la photo répond maintenant « ${consigne} » ✔`);
      return { geste };
    }
    await dire(
      `     ${geste} : envoyé sans erreur, mais la photo répond toujours ` +
        `« ${consigne ?? "(aucune)"} »`
    );
  }
  //  Refusés des DEUX côtés : c'est l'accès, pas la consigne.
  return { geste: null, refus: refus.length === 2 ? refus : null };
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

  await dire();
  await dire("  ██ LA CONSIGNE DE CACHE DES PHOTOS ██");
  await dire(`     projet : ${nomDuProjet(url)}   (lu dans ${dit})`);
  await dire(`     seau   : ${SEAU}`);
  await dire(`     visée  : ${enTete}  (lue chez le site — lib/cache-photos)`);
  await dire(
    REEL
      ? "     MODE RÉEL — les photos mal réglées seront renvoyées."
      : "     ESSAI À BLANC — rien ne sera écrit. (Ajoute --reel pour agir.)"
  );
  await dire(`     journal : ${path.basename(JOURNAL)}  (tout s'y écrit aussi)`);
  await dire();

  //  §1 (nº 778) — LA DESCENTE PARLE. Elle prend quelques secondes sur
  //  un millier de photos, et le propriétaire doit voir qu'elle avance.
  await dire(`  [${horodate()}] lecture du seau…`);
  let derniereAnnonce = 0;
  const photos = await listerLesObjets(appeler, "", async (combien) => {
    if (combien - derniereAnnonce < 200) return;
    derniereAnnonce = combien;
    await dire(`     … ${combien} photos vues`);
  });
  if (photos.length === 0) {
    await dire("  ⚠️  Aucun fichier lu. Deux causes possibles : le seau ne");
    await dire(`     s'appelle pas « ${SEAU} », ou la clé secrète employée`);
    await dire("     n'est pas celle de ce projet.");
    await dire("     (Le nom du seau se change avec SEAU_PHOTOS=…)");
    await dire();
    return;
  }
  await dire(`  [${horodate()}] ${photos.length} photos dans le seau.`);

  //  ---- LE CONSTAT ----
  //  §1 (nº 779) — CHAQUE PHOTO EST INTERROGÉE, et c'est assumé : seul
  //  l'en-tête SERVI dit la vérité (voir la note de `lireLEnTeteServi`).
  //  La liste du seau, elle, ne sert plus qu'à savoir QUELLES photos
  //  existent.
  await dire(
    `  [${horodate()}] on demande à chaque photo l'en-tête qu'elle SERT` +
      ` (${photos.length} lectures — compte environ ${Math.ceil(
        (photos.length * 0.35) / 60
      )} min).`
  );
  let lues = 0;
  for (const photo of photos) {
    const lu = await lireLEnTeteServi(appeler, photo.chemin);
    photo.consigne = lu.echec ? null : lu.consigne;
    photo.type = lu.type ?? photo.type;
    photo.illisible = lu.echec;
    lues += 1;
    if (lues % 100 === 0) {
      await dire(`     [${horodate()}] … ${lues}/${photos.length} lues`);
    }
  }

  const aReprendre = [];
  const dejaBonnes = [];
  const illisibles = [];
  const parConsigne = new Map();
  for (const photo of photos) {
    if (photo.illisible) {
      illisibles.push(`${photo.chemin} — ${photo.illisible}`);
      continue;
    }
    const vue = photo.consigne ?? "(aucune)";
    parConsigne.set(vue, (parConsigne.get(vue) ?? 0) + 1);
    if (secondesDeLaConsigne(photo.consigne) === voulues) dejaBonnes.push(photo);
    else aReprendre.push(photo);
  }

  await dire();
  for (const [consigne, combien] of [...parConsigne].sort((a, b) => b[1] - a[1])) {
    await dire(`     · ${String(combien).padStart(5)}  en « ${consigne} »`);
  }
  await dire();
  await dire(`  déjà bonnes  : ${dejaBonnes.length}`);
  await dire(`  à reprendre  : ${aReprendre.length}`);
  if (illisibles.length > 0) await dire(`  illisibles   : ${illisibles.length}`);
  await dire();

  if (aReprendre.length === 0) {
    await dire("  ✔  Rien à faire : toutes les photos portent déjà la consigne.");
    await dire();
    return;
  }
  if (!REEL) {
    for (const { chemin } of aReprendre.slice(0, 10)) await dire(`     · ${chemin}`);
    if (aReprendre.length > 10) {
      await dire(`     … et ${aReprendre.length - 10} autre(s)`);
    }
    await dire();
    await dire("  Pour agir : ajoute --reel à la fin de la commande.");
    await dire("  (Chaque photo est relue puis renvoyée à SON chemin, telle");
    await dire("   quelle : rien n'est recompressé, rien n'est renommé.)");
    await dire();
    return;
  }

  //  ---- LE GESTE QUI MARCHE, ÉPROUVÉ SUR UNE SEULE PHOTO (§3) ----
  await dire(`  [${horodate()}] on éprouve d'abord sur UNE photo :`);
  const { geste, refus } = await eprouverLeGeste(
    appeler,
    aReprendre[0],
    enTete,
    voulues
  );
  if (!geste) {
    await dire();
    if (refus) {
      //  L'ENVOI EST REFUSÉ : c'est l'accès, et rien d'autre.
      await dire("  ⛔  ARRÊTÉ : le service REFUSE d'écrire cette photo.");
      for (const r of refus) await dire(`     · ${r}`);
      await dire("     Les deux causes : la clé employée n'a pas le droit");
      await dire(`     d'écrire, ou le seau « ${SEAU} » n'est pas celui-là.`);
      await dire("     (La clé secrète du projet : Settings ▸ API ▸ service_role.)");
    } else {
      //  L'ENVOI PASSE, MAIS LA CONSIGNE NE PREND PAS : c'est un
      //  réglage du service, et renvoyer le reste n'y changerait rien.
      await dire("  ⛔  ARRÊTÉ AVANT D'ALLER PLUS LOIN : le service accepte les");
      await dire("     envois, mais l'en-tête qu'il SERT ne change pas.");
      await dire(`     Renvoyer les ${aReprendre.length - 1} autres photos n'y`);
      await dire("     changerait rien — c'est ce qui s'est passé la fois");
      await dire("     d'avant, sur 987 photos.");
      await dire();
      await dire("     ➜  LANCE LE DIAGNOSTIC : il essaie les autres façons");
      await dire("        d'écrire sur UNE SEULE photo, et dit laquelle agit :");
      await dire("          sh outils/diagnostic-cache --reel");
    }
    await dire();
    await dire(`     (Tout est aussi dans ${path.basename(JOURNAL)}.)`);
    await dire();
    return;
  }
  const restantes = aReprendre.slice(1);
  await dire();
  await dire(
    `  [${horodate()}] reprise des ${restantes.length} autres en ${geste} —` +
      " une ligne tous les 25."
  );

  //  ---- LA REPRISE ----
  let reprises = 1; // la photo témoin est déjà faite
  const soucis = [];
  //  L'ARRÊT SUR PANNE FRANCHE (nº 766 bis) : dix échecs D'AFFILÉE,
  //  c'est une panne — une clé sans droit d'écriture, un seau parti —
  //  et non une suite de fichiers abîmés. Un échec isolé au milieu de
  //  réussites n'arrête rien.
  let deSuite = 0;
  let franche = false;
  let faites = 0;
  for (const { chemin, type } of restantes) {
    const echec = await reprendreUnePhoto(appeler, chemin, enTete, geste, type);
    faites += 1;
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
    //  §1 (nº 778) — LA PROGRESSION DIT LES DEUX NOMBRES. « 1150/1150 »
    //  mélangeait réussites et échecs : on ne savait pas ce qu'on
    //  lisait. Désormais chacun a sa colonne, et l'heure est là.
    if (faites % 25 === 0) {
      await dire(
        `     [${horodate()}] ${faites}/${restantes.length} · reprises ` +
          `${reprises} · échecs ${soucis.length}`
      );
    }
  }

  //  ---- LE CONTRÔLE : sur l'EN-TÊTE SERVI, par sondage ----
  //  §1 (nº 779) — la nº 778 relisait la LISTE du seau : rapide, mais
  //  elle ne dit pas ce que le navigateur reçoit. On relit donc de
  //  vrais en-têtes servis — sur un échantillon réparti, pour que le
  //  contrôle reste court, et l'on dit que c'en est un.
  await dire();
  const echantillon = [];
  const pas = Math.max(1, Math.floor(aReprendre.length / 20));
  for (let rang = 0; rang < aReprendre.length; rang += pas) {
    echantillon.push(aReprendre[rang]);
  }
  await dire(
    `  [${horodate()}] contrôle : on relit l'en-tête servi de ` +
      `${echantillon.length} photos prises au fil de la liste…`
  );
  let bonnesApres = 0;
  const restees = [];
  for (const { chemin } of echantillon) {
    const { consigne } = await lireLEnTeteServi(appeler, chemin);
    if (secondesDeLaConsigne(consigne) === voulues) bonnesApres += 1;
    else restees.push(`${chemin} — ${consigne ?? "(aucune)"}`);
  }

  await dire();
  await dire(`  ── reprises : ${reprises} · en échec : ${soucis.length}`);
  await dire(
    `  ── contrôle : ${bonnesApres}/${echantillon.length} photos sondées` +
      " servent la bonne consigne"
  );
  if (restees.length > 0) {
    await dire();
    await dire("  ⚠️  CELLES QUI SERVENT ENCORE L'ANCIENNE CONSIGNE :");
    for (const r of restees.slice(0, 10)) await dire(`     · ${r}`);
    await dire();
    await dire("     L'envoi a été accepté, mais le service ne change pas");
    await dire("     l'en-tête qu'il sert. Lance le diagnostic — il essaie");
    await dire("     les autres façons d'écrire sur UNE seule photo :");
    await dire("       sh outils/diagnostic-cache --reel");
  }
  if (franche) {
    await dire();
    await dire("  ⛔  ARRÊTÉ : dix échecs d'affilée, c'est une panne franche.");
    await dire("     Les deux causes : la clé employée n'a pas le droit");
    await dire(`     d'écrire, ou le seau « ${SEAU} » n'est pas celui-là.`);
  }
  if (soucis.length > 0) {
    await dire();
    await dire("  ⚠️  CE QUI N'EST PAS PASSÉ (les vingt premiers) :");
    for (const s of soucis.slice(0, 20)) await dire(`     · ${s}`);
    await dire();
    await dire("     Relance la commande : elle ne reprend que ce qui reste.");
  }
  await dire();
  if (bonnesApres === echantillon.length && soucis.length === 0) {
    await dire("  ✔  Toutes les photos sondées servent maintenant la consigne.");
    await dire("     Le réseau de diffusion peut encore servir quelques");
    await dire("     minutes ses réponses d'avant : c'est normal, et ça passe");
    await dire("     tout seul. Pour vérifier depuis ton Mac :");
    await dire("       curl -sI \"<adresse d'une photo>\" | grep -i cache-control");
    await dire();
  }
}

principal().catch(async (erreur) => {
  //  §1 (nº 778) — même une panne s'écrit dans le journal : c'est
  //  souvent la ligne qu'on cherche après coup.
  await dire(`  ✖  ${raisonLisible(erreur)}`);
  process.exit(1);
});
