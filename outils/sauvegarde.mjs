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

/**
 * ██ §1 (nº 690) — AUCUNE LECTURE SANS DÉLAI DE GARDE ██
 * ==================================================================
 * CE QUI EST ARRIVÉ CHEZ LE PROPRIÉTAIRE, et le banc ne pouvait pas le
 * voir : sur la VRAIE base, la sauvegarde annonçait « 40 tables », puis
 * PLUS RIEN. Plusieurs minutes de silence, aucun message, jusqu'au
 * Ctrl+C. Contre la doublure — trois petites tables qui répondent en
 * une milliseconde — tout passait.
 *
 * DEUX DÉFAUTS SE SUPERPOSAIENT, et il faut les séparer :
 *  · `fetch` SANS SIGNAL ATTEND POUR TOUJOURS. C'est exactement la
 *    leçon de la nº 686 pour le site, et elle vaut pour les outils : un
 *    serveur qui prend la requête et ne répond jamais fige le script,
 *    sans erreur, sans fin. Ce fichier-ci la corrige ;
 *  · L'OUTIL N'AFFICHAIT RIEN pendant la copie. Même sans blocage, 40
 *    tables réelles prennent des minutes — et un écran muet ne se
 *    distingue pas d'un écran figé. La progression, plus bas, le
 *    corrige.
 *
 * DEUX DÉLAIS, ET PAS UN SEUL, parce que les deux gestes n'ont rien de
 * comparable : lire une page de mille lignes doit tenir en une minute ;
 * télécharger une photo aussi, mais on en télécharge des milliers, et
 * un délai trop long sur l'une d'elles arrête tout le reste.
 * ⚠️ ILS SE RÈGLENT SANS TOUCHER AU CODE — `DELAI_LECTURE=120` devant
 * la commande, si un jour une table demande plus.
 */
const DELAI_LECTURE_MS = Math.max(
  5_000,
  Number(process.env.DELAI_LECTURE ?? 60) * 1000
);
const DELAI_FICHIER_MS = Math.max(
  5_000,
  Number(process.env.DELAI_FICHIER ?? 30) * 1000
);

function fabriquerLeFacteur(url, cle) {
  const enTetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  return async function appeler(chemin, options = {}) {
    const delai = options.delai ?? DELAI_LECTURE_MS;
    const { delai: _ignore, ...reste } = options;
    void _ignore;
    //  ⚠️ `AbortSignal.timeout` COUPE LA REQUÊTE, il ne se contente pas
    //  de rendre la main : sans lui, la socket resterait ouverte et le
    //  script ne se terminerait jamais, même après l'erreur.
    const reponse = await fetch(url.replace(/\/+$/, "") + chemin, {
      ...reste,
      headers: { ...enTetes, ...(reste.headers ?? {}) },
      signal: AbortSignal.timeout(delai),
    });
    return reponse;
  };
}

/** Le message d'une panne, dit en français plutôt qu'en jargon. */
function raisonLisible(erreur, delai) {
  const nom = erreur?.name ?? "";
  if (nom === "TimeoutError" || nom === "AbortError") {
    return `pas de réponse après ${Math.round(delai / 1000)} s`;
  }
  return erreur?.message ?? String(erreur);
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
 *
 * ██ §2 (nº 690) — LE TRI NE PART PLUS QU'À LA SECONDE PAGE ██
 * ------------------------------------------------------------------
 * LA nº 689 DEMANDAIT `order=id.asc` DÈS LA PREMIÈRE PAGE, et c'est un
 * candidat sérieux au blocage constaté sur la vraie base. Les quarante
 * « tables » qu'elle expose ne sont pas toutes des tables : il y a des
 * VUES (`popularite_tatoueurs`, `points_tatoueur`, `comptes_a_purger`…),
 * qui CALCULENT. Trier une vue calculée sur une colonne sans index,
 * c'est la faire produire en entier puis la ranger — sur une base
 * distante, ça peut durer très longtemps, sans erreur, sans fin.
 * OR CE TRI NE SERT À RIEN TANT QU'IL N'Y A QU'UNE PAGE. Il ne protège
 * que d'un cas précis : deux pages successives qui, faute d'ordre
 * stable, rendraient deux fois la même ligne ou en sauteraient une.
 * On le demande donc SEULEMENT si une deuxième page est nécessaire —
 * et l'on reprend alors la table DEPUIS LE DÉBUT, pour que toutes ses
 * pages viennent du même ordre. Une page de plus pour les grandes
 * tables ; plus aucun tri inutile pour toutes les autres.
 *
 * ██ §3 (nº 690) — « UNE PAGE INCOMPLÈTE » NE VEUT PLUS DIRE « FINI » ██
 * ------------------------------------------------------------------
 * LA nº 689 S'ARRÊTAIT DÈS QU'UNE PAGE RENDAIT MOINS DE LIGNES QUE
 * DEMANDÉ. C'est faux dès que le serveur PLAFONNE les réponses — et
 * PostgREST le fait (`max-rows`), Supabase le règle. Une table de cinq
 * mille lignes sur une base plafonnée à cinq cents aurait donné cinq
 * cents lignes, sans une alerte, avec un « ✔ Sauvegarde vérifiée ».
 * Une sauvegarde incomplète qui se déclare complète est pire que pas
 * de sauvegarde du tout.
 * DÉSORMAIS C'EST LE TOTAL ANNONCÉ QUI DÉCIDE (`content-range`, obtenu
 * par `Prefer: count=exact`) : on continue tant qu'on n'a pas tout. Le
 * compte de page ne sert plus que de filet quand la base n'annonce
 * rien — et dans ce cas le résumé le DIT, plutôt que de promettre.
 */
/**
 * LES PAGES D'UNE TABLE, dans l'ordre demandé (ou sans ordre).
 * Elle ne décide rien : elle lit jusqu'au bout et rend ce qu'elle a vu,
 * avec de quoi juger — le total annoncé, le nombre de pages, et si le
 * serveur a PLAFONNÉ ses réponses.
 */
async function lirePages(appeler, table, trier, surPage, pagesMax = Infinity) {
  const lignes = [];
  let total = null;
  let pages = 0;
  let plafonne = false;

  /*  ██ §5 (nº 690) — LE DÉCALAGE SUIT CE QU'ON A REÇU, PAS CE QU'ON A
      DEMANDÉ ██
      ------------------------------------------------------------------
      DÉFAUT TROUVÉ AU BANC, et c'est le pire de la passe : avec un
      serveur qui PLAFONNE à 500 lignes, la boucle avançait de 1 000 à
      chaque tour — elle demandait `offset=1000` après n'avoir reçu que
      les cinq cents premières. Résultat mesuré sur cinq mille lignes :
      2 500 copiées, PAR TRANCHES, avec des trous entre elles. Une
      sauvegarde pleine de trous.
      LE DÉCALAGE SUIVANT EST DONC LE NOMBRE DE LIGNES DÉJÀ REÇUES.
      C'est vrai quel que soit le plafond du serveur, et c'est la seule
      écriture qui n'ait rien à supposer.
      ⚠️ C'EST LA VÉRIFICATION QUI L'A ATTRAPÉ (« la base en annonce
      5 000, 2 500 copiées »). Elle a fait exactement ce pour quoi elle
      existe — et c'est la meilleure raison de l'avoir écrite. */
  for (;;) {
    const depart = lignes.length;
    const tri = trier ? "&order=id.asc" : "";
    const chemin =
      `/rest/v1/${table}?select=*${tri}` +
      `&limit=${TAILLE_PAGE}&offset=${depart}`;
    let reponse;
    try {
      reponse = await appeler(chemin, { headers: { Prefer: "count=exact" } });
    } catch (erreur) {
      return {
        erreur: raisonLisible(erreur, DELAI_LECTURE_MS),
        triRefuse: false, lignes, total, pages, plafonne,
      };
    }

    if (!reponse.ok) {
      const message = await reponse.text().catch(() => "");
      return {
        erreur: `HTTP ${reponse.status} ${message.slice(0, 160)}`,
        //  UN 400 SUR UN TRI, c'est presque toujours « cette colonne
        //  n'existe pas » : beaucoup de vues n'ont pas d'`id`. Ce n'est
        //  pas un incident, c'est un cas ordinaire — l'appelant reprend
        //  sans tri.
        triRefuse: trier && reponse.status === 400,
        lignes, total, pages, plafonne,
      };
    }

    //  LE TOTAL ANNONCÉ PAR LA BASE : « 0-999/12345 ». C'est lui qui
    //  dit quand s'arrêter, et lui qui permettra de vérifier.
    const plage = reponse.headers.get("content-range");
    const annonce = plage && plage.includes("/") ? plage.split("/")[1] : null;
    if (annonce && annonce !== "*" && Number.isFinite(Number(annonce))) {
      total = Number(annonce);
    }

    let lot;
    try {
      lot = await reponse.json();
    } catch (erreur) {
      return {
        erreur: `réponse illisible (${raisonLisible(erreur, DELAI_LECTURE_MS)})`,
        triRefuse: false, lignes, total, pages, plafonne,
      };
    }
    if (!Array.isArray(lot)) {
      return {
        erreur: "réponse inattendue (ce n'est pas une liste)",
        triRefuse: false, lignes, total, pages, plafonne,
      };
    }

    pages += 1;
    lignes.push(...lot);
    if (surPage && pages > 1) surPage(lignes.length, total);

    //  Une page VIDE : il n'y a plus rien, quoi qu'annonce le total.
    if (lot.length === 0) break;
    //  Tout est là, la base l'a dit.
    if (total !== null && lignes.length >= total) break;
    //  Moins de lignes que demandé ALORS QU'IL EN RESTE : c'est un
    //  PLAFOND du serveur (`max-rows`), pas une fin (§3). On continue,
    //  au rythme que le serveur impose (§5).
    if (lot.length < TAILLE_PAGE) {
      if (total === null) break;
      plafonne = true;
    }
    //  LE PREMIER COUP D'ŒIL S'ARRÊTE À UNE PAGE (`pagesMax`), et
    //  c'est ce qui évite de tout lire deux fois : il sert juste à
    //  savoir si la table tient en une page. Si non, l'appelant
    //  recommence avec le tri (§2).
    if (pages >= pagesMax) break;
    //  Filet : une base qui ignorerait `offset` rendrait toujours la
    //  même page. Deux cents pages, et l'on s'arrête en le disant.
    if (pages >= 200) {
      return {
        erreur: "arrêt à 200 pages — la pagination n'avance pas",
        triRefuse: false, lignes, total, pages, plafonne,
      };
    }
  }
  return { erreur: null, triRefuse: false, lignes, total, pages, plafonne };
}

/**
 * TOUTES LES LIGNES D'UNE TABLE — la stratégie, en trois temps.
 *  1. On lit SANS TRI. Neuf tables sur dix tiennent en une page : elles
 *     s'arrêtent là, et n'auront jamais payé un tri (§2).
 *  2. S'il en faut plusieurs, on RECOMMENCE AVEC LE TRI, pour que
 *     toutes les pages viennent du même ordre.
 *  3. Si la base refuse ce tri (une vue sans `id`), on garde la lecture
 *     sans ordre — et le résumé le DIT, plutôt que de promettre.
 */
async function copierUneTable(appeler, table, surPage = null) {
  const premier = await lirePages(appeler, table, false, surPage, 1);
  if (premier.erreur) {
    return { table, ...premier, lignes: null, triee: false, sansOrdre: false };
  }
  const complet =
    premier.total !== null
      ? premier.lignes.length >= premier.total
      : premier.lignes.length < TAILLE_PAGE;
  if (complet) {
    return {
      table, erreur: null, lignes: premier.lignes, total: premier.total,
      pages: premier.pages, triee: false, sansOrdre: false,
      plafonne: premier.plafonne,
      incertain: false,
    };
  }

  const trie = await lirePages(appeler, table, true, surPage);
  if (!trie.erreur) {
    return {
      table, erreur: null, lignes: trie.lignes, total: trie.total,
      pages: premier.pages + trie.pages, triee: true, sansOrdre: false,
      plafonne: trie.plafonne,
      incertain: trie.total === null && trie.pages > 1,
    };
  }
  //  LE TRI A ÉTÉ REFUSÉ (pas d'`id`) : on relit TOUT sans ordre.
  //  ⚠️ ON NE GARDE PAS LA PREMIÈRE PAGE À LA PLACE : elle ne contient
  //  que mille lignes sur plusieurs milliers, et la rendre ici aurait
  //  fabriqué le pire des résultats — une copie tronquée qui se croit
  //  entière. C'est la meilleure copie possible, et son doute est écrit
  //  dans le résumé (`sansOrdre`).
  if (trie.triRefuse) {
    const sansTri = await lirePages(appeler, table, false, surPage);
    if (sansTri.erreur) {
      return { table, ...sansTri, lignes: null, triee: false, sansOrdre: true };
    }
    return {
      table, erreur: null, lignes: sansTri.lignes, total: sansTri.total,
      pages: premier.pages + sansTri.pages, triee: false, sansOrdre: true,
      plafonne: sansTri.plafonne,
      incertain: sansTri.total === null && sansTri.pages > 1,
    };
  }
  return { table, ...trie, lignes: null, triee: true, sansOrdre: false };
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
    let reponse;
    try {
      reponse = await appeler(
        `/auth/v1/admin/users?page=${page}&per_page=${TAILLE_PAGE}`
      );
    } catch (erreur) {
      //  §1 (nº 690) — une lecture qui n'aboutit pas ne fige plus rien.
      return { comptes: null, erreur: raisonLisible(erreur, DELAI_LECTURE_MS) };
    }
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
  let reponse;
  try {
    reponse = await appeler("/storage/v1/bucket");
  } catch {
    //  §1 (nº 690) — pas de réponse : aucun panier, et l'on continue.
    return [];
  }
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
    let reponse;
    try {
      reponse = await appeler(`/storage/v1/object/list/${panier}`, {
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
      //  §1 (nº 690) — un dossier qui ne répond pas n'arrête pas les
      //  autres : on rend ce qu'on a trouvé jusque-là.
      break;
    }
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
  let reponse;
  try {
    //  §1 (nº 690) — SON PROPRE DÉLAI, plus court que celui des
    //  lectures : on télécharge des milliers de fichiers, et attendre
    //  une minute sur l'un d'eux arrêterait tous les suivants.
    reponse = await appeler(
      `/storage/v1/object/${panier}/${chemin.split("/").map(encodeURIComponent).join("/")}`,
      { delai: DELAI_FICHIER_MS }
    );
  } catch {
    return 0;
  }
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

/** « 1 ligne », « 3 lignes » — le pluriel se dit, il ne se devine pas. */
const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? "s" : ""}`;

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
    //  §1 (nº 690) — ce salut a SON délai, court : s'il n'aboutit pas
    //  en dix secondes, rien de ce qui suit n'aboutira non plus.
    const salut = await appeler("/rest/v1/", { method: "HEAD", delai: 10_000 });
    if (salut.status >= 500) throw new Error(`HTTP ${salut.status}`);
  } catch (erreur) {
    console.log(`  ✖  La base ne répond pas (${raisonLisible(erreur, 10_000)}).`);
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

  /*  ██ §4 (nº 690) — LA PROGRESSION, TABLE PAR TABLE ██
      ------------------------------------------------------------------
      CE QUE LE PROPRIÉTAIRE A VU : « Tables à copier : 40 », puis rien.
      Le script travaillait peut-être très bien — nul ne pouvait le
      savoir, et c'est le vrai défaut. Un écran muet ne se distingue pas
      d'un écran figé.
      DÉSORMAIS CHAQUE TABLE S'ANNONCE AVANT d'être lue, et se complète
      quand elle est écrite. Si ça se bloque, la dernière ligne affichée
      NOMME la table en cause — et un délai de garde finira par la
      libérer de toute façon (§1).
      ⚠️ ON ÉCRIT SUR LA MÊME LIGNE tant qu'on peut (`\r`), pour ne pas
      noyer l'écran sous quarante lignes ; mais SEULEMENT sur un vrai
      terminal. Redirigé dans un fichier, `\r` donnerait une bouillie :
      on écrit alors une ligne par table, proprement. */
  const terminal = Boolean(process.stdout.isTTY);
  const dire = (texte) => {
    if (terminal) {
      process.stdout.write(`\r\u001b[2K  ${texte}`);
    } else {
      console.log(`  ${texte}`);
    }
  };
  const finirLaLigne = () => { if (terminal) process.stdout.write("\n"); };

  const resultats = [];
  let rang = 0;
  for (const table of tables) {
    rang += 1;
    const prefixe = `${String(rang).padStart(2)}/${tables.length} · ${table}`;
    dire(`${prefixe} …`);
    const depart = Date.now();
    const resultat = await copierUneTable(appeler, table, (lues, total) =>
      dire(`${prefixe} · ${lues}${total ? `/${total}` : ""} lignes …`)
    );
    const duree = Math.round((Date.now() - depart) / 1000);
    const lent = duree >= 5 ? ` (${duree} s)` : "";

    if (resultat.erreur) {
      //  ⚠️ UNE TABLE QUI ÉCHOUE N'ARRÊTE PAS LES AUTRES, et c'est la
      //  consigne : on le DIT, sur sa propre ligne, et l'on continue.
      dire(`${prefixe} · ✖ ${resultat.erreur}`);
      finirLaLigne();
      resultats.push({ ...resultat, nombre: null, fichier: null, poids: 0 });
      continue;
    }
    const fichier = path.join(dossier, "tables", `${table}.json`);
    await writeFile(fichier, JSON.stringify(resultat.lignes, null, 1), "utf8");
    dire(`${prefixe} · ${pluriel(resultat.lignes.length, "ligne")}${lent}`);
    resultats.push({
      table, erreur: null, nombre: resultat.lignes.length,
      total: resultat.total, pages: resultat.pages, triee: resultat.triee,
      sansOrdre: Boolean(resultat.sansOrdre),
      plafonne: Boolean(resultat.plafonne),
      incertain: Boolean(resultat.incertain),
      fichier: path.relative(dossier, fichier),
      poids: (await stat(fichier)).size,
    });
  }
  finirLaLigne();

  // ── LES COMPTES ───────────────────────────────────────────────
  dire("comptes …");
  const { comptes, erreur: erreurComptes } = await copierLesComptes(appeler);
  dire(comptes ? `comptes · ${comptes.length}` : `comptes · ✖ ${erreurComptes}`);
  finirLaLigne();
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
  dire("stockage · recherche des fichiers …");
  const paniers = await listerLesPaniers(appeler);
  const stockage = [];
  for (const panier of paniers) {
    const chemins = await listerLesObjets(appeler, panier.name);
    let poids = 0;
    let copies = 0;
    let rate = 0;
    for (const [n, chemin] of chemins.entries()) {
      //  §4 (nº 690) — LA PROGRESSION DES PHOTOS. C'est ici que le
      //  temps passe vraiment sur une vraie base : des milliers de
      //  fichiers, un par un. Sans compteur, l'attente est aveugle.
      if (n % 10 === 0 || n === chemins.length - 1) {
        dire(`stockage · ${panier.name} · ${n + 1}/${chemins.length} fichiers …`);
      }
      const taille = await telecharger(
        appeler, panier.name, chemin,
        path.join(dossier, "stockage", panier.name, chemin)
      );
      if (taille > 0) copies += 1;
      else rate += 1;
      poids += taille;
    }
    dire(
      `stockage · ${panier.name} · ${copies}/${chemins.length} fichiers` +
      `${rate > 0 ? ` (${rate} manquant${rate > 1 ? "s" : ""})` : ""}`
    );
    finirLaLigne();
    stockage.push({ panier: panier.name, trouves: chemins.length, copies, poids });
  }

  // ── LA VÉRIFICATION ───────────────────────────────────────────
  //  On ne se croit pas sur parole : on relit ce qu'on vient
  //  d'écrire. Un fichier qui existe et pèse quelque chose ne suffit
  //  pas — il doit se RELIRE, et contenir le nombre de lignes annoncé.
  const alertes = [];
  /*  §5 (nº 690) — DEUX LISTES, ET PAS UNE. Une ALERTE est quelque
      chose à regarder ; une REMARQUE est un fait de la base, normal,
      qu'il vaut mieux savoir. Les mêler faisait afficher « ⚠ » pour un
      serveur qui plafonne ses réponses — c'est-à-dire pour un
      fonctionnement ordinaire, et c'est le meilleur moyen qu'on
      n'écoute plus les vraies alertes. */
  const remarques = [];
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
      //  §2/§3 (nº 690) — LES TROIS DOUTES QU'ON NE TAIT PAS.
      if (r.sansOrdre) {
        alertes.push(
          `${r.table} : lue en ${r.pages} pages SANS ordre stable ` +
          `(la base a refusé le tri) — à revérifier`
        );
      }
      if (r.plafonne) {
        remarques.push(
          `${r.table} : la base plafonne ses réponses — lue en ` +
          `${r.pages} pages au lieu d'une`
        );
      }
      if (r.incertain) {
        alertes.push(
          `${r.table} : lue en ${r.pages} pages et la base n'annonce ` +
          `aucun total — impossible de PROUVER qu'elle est entière`
        );
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
    delais: {
      lecture_s: Math.round(DELAI_LECTURE_MS / 1000),
      fichier_s: Math.round(DELAI_FICHIER_MS / 1000),
    },
    tables: copiees.map((r) => ({
      nom: r.table, lignes: r.nombre, total_annonce: r.total,
      pages: r.pages, triee: r.triee, sans_ordre: r.sansOrdre,
      plafonne: r.plafonne, poids: r.poids,
    })),
    tables_en_echec: resultats
      .filter((r) => r.erreur)
      .map((r) => ({ nom: r.table, raison: r.erreur })),
    comptes: nombreComptes,
    stockage,
    alertes,
    remarques,
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
    for (const r of remarques) console.log(`     · ${r}`);
  } else {
    console.log(`  ⚠  ${alertes.length} point(s) à regarder :`);
    for (const a of alertes.slice(0, 20)) console.log(`       · ${a}`);
    if (alertes.length > 20) console.log(`       · … et ${alertes.length - 20} autres`);
    console.log("");
    for (const r of remarques) console.log(`       · ${r}`);
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
