/**
 * ██ nº 719 — LA REPRISE DES AVATARS DÉJÀ EN LIGNE ██
 * ==================================================================
 * CE QUE LA nº 718 A FAIT, ET CE QU'ELLE A LAISSÉ. Depuis cette passe,
 * déposer une photo de profil envoie TROIS fichiers : l'original, une
 * variante de 160 et une de 320 — et le nom porte la marque
 * (`avatar-…`) qui dit aux écrans que les variantes existent. Les
 * photos déposées AVANT s'appellent `profil-…` : `sourceAvatar` les
 * rend telles quelles, elles s'affichent donc parfaitement, mais elles
 * ne profitent d'aucun gain. Ce script-ci les reprend, une fois.
 *
 * ██ CE QU'IL FAIT, DANS L'ORDRE, POUR CHAQUE PHOTO ██
 *  1. il la télécharge depuis le stockage ;
 *  2. il fabrique les deux variantes ;
 *  3. il envoie TROIS fichiers sous le nom marqué — l'original étant
 *     RECOPIÉ TEL QUEL, octet pour octet, sans la moindre retouche
 *     (règle nº 356/467 : on ne recompresse pas l'image de quelqu'un) ;
 *  4. il met à jour `photo_profil` SEULEMENT si les trois envois ont
 *     réussi. Un envoi qui échoue laisse la ligne intacte : la photo
 *     continue de s'afficher par le repli, personne ne perd rien ;
 *  5. il ne supprime JAMAIS l'ancien fichier `profil-…`.
 *
 * ⚠️ RELANÇABLE SANS DÉGÂT : une photo déjà marquée `avatar-` est
 * ignorée. Relancer dix fois de suite ne fait rien de plus que la
 * première.
 * ⚠️ SAUF AVEC `--tout` (§1 nº 723) : la marque dit que les variantes
 * EXISTENT, pas qu'elles sont bonnes. Quand la qualité de réduction du
 * site change, il faut pouvoir repasser sur ce qui est déjà marqué —
 * c'est ce que fait cette option, et elle ne lève que ce tri-là.
 * ⚠️ ESSAI À BLANC PAR DÉFAUT : sans `--reel`, il n'écrit rien nulle
 * part — il dit ce qu'il ferait, et s'arrête là.
 *
 * ██ UN ÉCART À LA CONSIGNE, ASSUMÉ ET DIT ██
 * ------------------------------------------------------------------
 * La consigne demandait d'employer `compresserPhoto` (lib/photo), la
 * fonction même du dépôt. ELLE NE PEUT PAS TOURNER ICI : elle est
 * écrite pour un NAVIGATEUR — `createImageBitmap`, une toile
 * (`canvas`), `toBlob`. Aucune n'existe dans Node. L'appeler
 * demanderait de piloter un vrai navigateur, c'est-à-dire d'installer
 * Chromium sur la machine du propriétaire pour une reprise unique.
 * CE QUI EST FAIT À LA PLACE, et pourquoi c'est fidèle : la réduction
 * passe par `sharp` — la bibliothèque que Next embarque déjà, donc
 * rien à installer — RÉGLÉE SUR LES MÊMES PARAMÈTRES : JPEG, côté
 * maximum, rapport d'aspect conservé, et la même QUALITÉ. Ce sont
 * exactement les réglages de `compresserPhoto`. Et RIEN N'EST RECOPIÉ :
 * les tailles et la marque de nommage sont LUES dans
 * `src/lib/avatar-variantes.ts`, la durée de validité dans
 * `lib/cache-photos` (nº 721), la qualité dans `lib/qualite-photo`
 * (nº 723 — elle était encore écrite « 85 » en dur ici). Si le site
 * change l'une de ces valeurs, ce script la suit (règle des écritures
 * uniques, piège nº 378).
 * ⚠️ CE QUE CELA IMPLIQUE, HONNÊTEMENT : une variante reprise ici et
 * une variante déposée par le formulaire peuvent différer de quelques
 * octets — deux encodeurs JPEG ne sont jamais identiques au bit près.
 * À l'œil, rien ne les distingue.
 *
 * ██ LA CLÉ DE SERVICE ██
 * Elle est lue dans l'environnement ou dans `.env.local`, et elle
 * n'est JAMAIS affichée, ni écrite, ni consignée — pas même
 * tronquée. Le script dit seulement si elle est présente.
 *
 * ══ COMMENT ON S'EN SERT ══
 *     node outils/reprendre-avatars.mjs           (essai à blanc)
 *     node outils/reprendre-avatars.mjs --reel    (le vrai passage)
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exiger = createRequire(path.join(RACINE, "package.json"));

/** Le seau du stockage — la même valeur que le formulaire. */
const SEAU = "photos-tatoueurs";
/** La table et la colonne reprises. */
const TABLE = "tatoueurs";
const COLONNE = "photo_profil";

const REEL = process.argv.includes("--reel");
/**
 * ██ §1 (nº 723) — REPRENDRE MÊME CE QUI EST DÉJÀ MARQUÉ ██
 * ------------------------------------------------------------------
 * POURQUOI CETTE OPTION EXISTE. La marque (`avatar-…`) veut dire « ces
 * variantes existent » — elle ne dit RIEN de leur qualité. La nº 723
 * monte la qualité de réduction pour effacer le grain : les avatars
 * repris à la nº 719 portent donc la marque, mais l'ANCIENNE qualité,
 * et le tri normal les écarterait pour toujours.
 * `--tout` lève le seul tri de la marque, et rien d'autre : toutes les
 * autres garanties tiennent — essai à blanc par défaut, l'original
 * n'est jamais supprimé, la base n'est écrite qu'après les trois
 * envois réussis, et une relance reste sans dégât (elle refabrique les
 * mêmes fichiers sous un nom neuf).
 * ⚠️ CE QU'ELLE COÛTE, ET IL FAUT LE DIRE : chaque photo reprise repart
 * de l'ORIGINAL en ligne, qui est déjà un JPEG — la reprise ne peut pas
 * rendre plus de détail qu'il n'en reste. Elle cesse d'en RETIRER, ce
 * qui est tout l'objet de la passe.
 */
const TOUT = process.argv.includes("--tout");

/* ==================================================================
 * 1 · LES ACCÈS — lus, jamais écrits
 * ================================================================== */

/** Le format de `.env.local` : `CLE=valeur`. Ce qui est dans
    l'environnement gagne sur le fichier — la convention du projet
    (voir outils/sauvegarde.mjs, même lecture). */
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

/* ==================================================================
 * 2 · LES RÈGLES DU SITE — LUES CHEZ LUI, jamais recopiées
 * ================================================================== */

/**
 * Les trois valeurs qui commandent le nommage et les tailles vivent
 * dans `src/lib/avatar-variantes.ts`. On les LIT là-bas : ce script ne
 * porte aucun nombre en propre, et il suivra le site si le site change
 * (piège nº 378).
 */
async function lireLesReglesDuSite() {
  const source = await readFile(
    path.join(RACINE, "src", "lib", "avatar-variantes.ts"),
    "utf8"
  );
  const nombre = (nom) => {
    const trouve = new RegExp(`${nom}\\s*=\\s*(\\d+)`).exec(source);
    if (!trouve) throw new Error(`${nom} introuvable dans lib/avatar-variantes`);
    return Number(trouve[1]);
  };
  const marque = /PREFIXE_AVEC_VARIANTES\s*=\s*"([^"]+)"/.exec(source);
  if (!marque) throw new Error("le préfixe des variantes est introuvable");
  /*  §1 (nº 721) — LA DURÉE DE VALIDITÉ, lue elle aussi chez le site
      (`lib/cache-photos`), pour la même raison que le reste : une seule
      écriture. Sans elle, le stockage répond « no-cache » et chaque
      visite repaie chaque avatar — y compris ceux que CE script vient
      de reprendre. */
  const sourceCache = await readFile(
    path.join(RACINE, "src", "lib", "cache-photos.ts"),
    "utf8"
  );
  const duree = /CACHE_PHOTOS\s*=\s*"(\d+)"/.exec(sourceCache);
  if (!duree) throw new Error("CACHE_PHOTOS introuvable dans lib/cache-photos");
  /*  §1 (nº 723) — LA QUALITÉ, lue chez le site elle aussi. Elle était
      écrite « 85 » EN DUR ici, en face du 0,85 de `compresserPhoto` :
      deux copies tenues alignées à la main. La nº 723 monte la qualité
      pour effacer le grain de l'avatar — sans cette lecture, ce script
      aurait continué à reprendre les photos à l'ancienne, et les
      avatars repris n'auraient plus ressemblé aux avatars déposés. */
  const sourceQualite = await readFile(
    path.join(RACINE, "src", "lib", "qualite-photo.ts"),
    "utf8"
  );
  const qualite = /QUALITE_PHOTO\s*=\s*([\d.]+)/.exec(sourceQualite);
  if (!qualite) throw new Error("QUALITE_PHOTO introuvable dans lib/qualite-photo");
  return {
    petit: nombre("AVATAR_PETIT"),
    moyen: nombre("AVATAR_MOYEN"),
    marque: marque[1],
    duree: duree[1],
    //  Le site travaille de 0 à 1 (`canvas.toBlob`), sharp de 0 à 100 :
    //  même valeur, unité de l'outil.
    qualite: Math.round(Number(qualite[1]) * 100),
  };
}

/* ==================================================================
 * 3 · PARLER À SUPABASE
 * ================================================================== */

const DELAI_MS = Math.max(5_000, Number(process.env.DELAI_REPRISE ?? 60) * 1000);

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
 * 4 · LA REPRISE D'UNE PHOTO
 * ================================================================== */

const ko = (octets) => `${(octets / 1024).toFixed(1)} Ko`;

/**
 * Reprend UNE fiche. Rend un compte rendu, et ne jette jamais : un
 * échec sur une photo ne doit pas arrêter les autres.
 */
async function reprendreUnePhoto(fiche, outils) {
  const { appeler, regles, sharp, base } = outils;
  const adresse = fiche[COLONNE];
  const details = { nom: fiche.nom ?? fiche.id, avant: 0, apres: 0 };

  //  a) L'ORIGINAL, tel qu'il est en ligne.
  const reponse = await fetch(adresse, { signal: AbortSignal.timeout(DELAI_MS) });
  if (!reponse.ok) {
    return { etat: "échec", ...details, raison: `téléchargement ${reponse.status}` };
  }
  const original = Buffer.from(await reponse.arrayBuffer());
  details.avant = original.length;

  //  b) LES DEUX VARIANTES. Mêmes réglages que la réduction du site :
  //     JPEG, côté maximum, rapport conservé — et la QUALITÉ lue chez
  //     le site (§1 nº 723, lib/qualite-photo), jamais recopiée ici.
  const reduire = (cote) =>
    sharp(original)
      .resize({ width: cote, height: cote, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: regles.qualite })
      .toBuffer();
  let petite, moyenne;
  try {
    [petite, moyenne] = await Promise.all([
      reduire(regles.petit),
      reduire(regles.moyen),
    ]);
  } catch (erreur) {
    return { etat: "échec", ...details, raison: `réduction : ${erreur.message}` };
  }
  details.apres = petite.length;

  //  c) LES TROIS NOMS. Le dossier de la photo est conservé : c'est
  //     celui du compte, et les droits du stockage en dépendent.
  const dossier = new URL(adresse).pathname
    .split(`/${SEAU}/`)[1]
    ?.split("/")
    .slice(0, -1)
    .join("/");
  if (!dossier) {
    return { etat: "échec", ...details, raison: "dossier illisible dans l'adresse" };
  }
  const nomMarque = `${regles.marque}${Date.now()}.jpg`;
  const chemins = {
    original: `${dossier}/${nomMarque}`,
    petite: `${dossier}/${nomMarque.replace(/\.jpg$/, `-${regles.petit}.jpg`)}`,
    moyenne: `${dossier}/${nomMarque.replace(/\.jpg$/, `-${regles.moyen}.jpg`)}`,
  };

  if (!REEL) {
    return {
      etat: "à reprendre",
      ...details,
      raison: `→ ${chemins.original.split("/").pop()} (+ ${regles.petit} et ${regles.moyen})`,
    };
  }

  //  d) LES TROIS ENVOIS. ⚠️ L'ORIGINAL PART TEL QUEL — le tampon
  //     téléchargé, pas une version recompressée (règle nº 356/467).
  //     §1 (nº 721) — chaque envoi porte la durée de validité : c'est
  //     l'en-tête `cache-control` de l'envoi que le stockage recopie
  //     ensuite sur toutes ses réponses pour ce fichier.
  const envoyer = (chemin, corps) =>
    appeler(`/storage/v1/object/${SEAU}/${chemin}`, {
      method: "POST",
      headers: {
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
        "cache-control": `max-age=${regles.duree}`,
      },
      body: corps,
    });
  const envois = await Promise.all([
    envoyer(chemins.original, original),
    envoyer(chemins.petite, petite),
    envoyer(chemins.moyenne, moyenne),
  ]);
  const rate = envois.find((envoi) => !envoi.ok);
  if (rate) {
    return {
      etat: "échec",
      ...details,
      raison: `envoi refusé (${rate.status}) — la fiche reste inchangée`,
    };
  }

  //  e) LA BASE, EN DERNIER, et seulement maintenant. Tant que cette
  //     ligne n'est pas écrite, la fiche montre son ancienne photo :
  //     c'est ce qui rend un échec sans conséquence.
  const nouvelle = `${base}/storage/v1/object/public/${SEAU}/${chemins.original}`;
  const miseAJour = await appeler(
    `/rest/v1/${TABLE}?id=eq.${encodeURIComponent(fiche.id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ [COLONNE]: nouvelle }),
    }
  );
  if (!miseAJour.ok) {
    return {
      etat: "échec",
      ...details,
      raison: `base refusée (${miseAJour.status}) — fichiers en ligne, fiche inchangée`,
    };
  }
  return { etat: "reprise", ...details, raison: nomMarque };
}

/* ==================================================================
 * 5 · LE PASSAGE
 * ================================================================== */

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
  const base = acces.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");
  //  ⚠️ ON DIT QU'ELLE EST LÀ, ON NE LA MONTRE PAS.
  console.log(`  base : ${base} · clé de service : présente`);

  const regles = await lireLesReglesDuSite();
  console.log(
    `  règles lues chez le site : marque « ${regles.marque} », ` +
      `variantes ${regles.petit} et ${regles.moyen}, ` +
      `qualité ${regles.qualite}, validité ${regles.duree} s`
  );
  console.log(
    REEL
      ? "  MODE RÉEL — les fichiers seront écrits et les fiches mises à jour."
      : "  ESSAI À BLANC — rien ne sera écrit. (Ajoute --reel pour agir.)"
  );
  console.log(
    TOUT
      ? "  --tout : les photos DÉJÀ marquées sont reprises elles aussi.\n"
      : "  Les photos déjà marquées sont ignorées. (Ajoute --tout pour les reprendre.)\n"
  );

  const appeler = fabriquerLeFacteur(base, acces.SUPABASE_SECRET_KEY);
  let sharp;
  try {
    sharp = exiger("sharp");
  } catch {
    console.error(
      "✖ La bibliothèque d'images (sharp) est introuvable. " +
        "Lance `npm install` dans le dossier du site, puis réessaie."
    );
    process.exitCode = 1;
    return;
  }

  //  LES FICHES À REPRENDRE : une photo de profil qui n'est pas encore
  //  marquée. La marque est la seule chose qui distingue les deux
  //  états — c'est elle qui rend ce script relançable.
  const liste = await appeler(
    `/rest/v1/${TABLE}?select=id,nom,${COLONNE}` +
      `&${COLONNE}=not.is.null` +
      //  §1 (nº 723) — `--tout` reprend AUSSI les photos déjà marquées
      //  (voir la constante TOUT) : le filtre de marque saute ici, et
      //  le tri local ci-dessous s'efface avec lui.
      (TOUT ? "" : `&${COLONNE}=not.like.*${regles.marque}*`)
  );
  if (!liste.ok) {
    console.error(`✖ Lecture de la base refusée (${liste.status}).`);
    process.exitCode = 1;
    return;
  }
  /*  ██ LE TRI SE FAIT DEUX FOIS, ET C'EST VOULU ██
      La requête demande déjà au serveur d'écarter les photos marquées.
      On REFAIT le tri ici, sur ce qu'il a rendu — parce que c'est LUI
      qui garantit la promesse « relançable sans dégât », et qu'une
      promesse ne doit pas reposer sur la façon dont un serveur combine
      deux filtres portant le même nom de colonne. Éprouvé au banc : le
      tri du serveur seul laissait passer une photo déjà reprise.
      ⚠️ LA MARQUE EST CELLE DU SITE, lue plus haut — pas une chaîne
      recopiée ici. */
  const rendues = (await liste.json()).filter((f) => f[COLONNE]);
  const fiches = TOUT
    ? rendues
    : rendues.filter((f) => !String(f[COLONNE]).includes(regles.marque));
  const dejaMarquees = rendues.length - fiches.length;
  if (fiches.length === 0) {
    //  ⚠️ ON NE COMPTE PAS LES IGNORÉES ICI, et ce n'est pas un oubli :
    //  le serveur les a déjà écartées de sa réponse, donc le nombre
    //  qu'on afficherait serait zéro — ce qui se lirait comme « aucune
    //  photo marquée » alors que c'est le contraire.
    console.log("  Rien à reprendre : toutes les photos portent déjà la marque.");
    return;
  }
  console.log(
    `  ${fiches.length} photo(s) à reprendre` +
      (dejaMarquees > 0
        ? ` · ${dejaMarquees} déjà marquée${dejaMarquees > 1 ? "s" : ""}, ignorée${dejaMarquees > 1 ? "s" : ""}.\n`
        : ".\n")
  );

  const outils = { appeler, regles, sharp, base };
  const bilan = { reprises: [], ignorees: dejaMarquees, echecs: [] };
  for (const fiche of fiches) {
    let resultat;
    try {
      resultat = await reprendreUnePhoto(fiche, outils);
    } catch (erreur) {
      resultat = {
        etat: "échec",
        nom: fiche.nom ?? fiche.id,
        avant: 0,
        apres: 0,
        raison: erreur?.message ?? String(erreur),
      };
    }
    const marque =
      resultat.etat === "échec" ? "✖" : resultat.etat === "reprise" ? "✅" : "·";
    const poids =
      resultat.avant > 0
        ? `${ko(resultat.avant)} → ${resultat.apres > 0 ? ko(resultat.apres) : "?"}`
        : "";
    console.log(
      `  ${marque} ${String(resultat.nom).slice(0, 26).padEnd(26)} ${poids.padEnd(20)} ${resultat.raison}`
    );
    if (resultat.etat === "échec") bilan.echecs.push(resultat);
    else bilan.reprises.push(resultat);
  }

  const totalAvant = bilan.reprises.reduce((s, r) => s + r.avant, 0);
  const totalApres = bilan.reprises.reduce((s, r) => s + r.apres, 0);
  console.log(
    `\n  ══ ${REEL ? "REPRISES" : "À REPRENDRE"} : ${bilan.reprises.length}` +
      ` · ignorées (déjà marquées) : ${bilan.ignorees}` +
      ` · en échec : ${bilan.echecs.length} ══`
  );
  if (totalAvant > 0) {
    console.log(
      `  poids des avatars : ${ko(totalAvant)} → ${ko(totalApres)}` +
        ` (${Math.round((1 - totalApres / totalAvant) * 100)} % de moins` +
        ` sur les écrans qui servent la petite variante)`
    );
  }
  if (!REEL && bilan.reprises.length > 0) {
    console.log("\n  Pour agir : node outils/reprendre-avatars.mjs --reel");
  }
}

await main();
