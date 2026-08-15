/**
 * BANC DE LA PASSE Nº 278
 * ==================================================================
 * §0 la DÉFINITION du carrousel et ses quatre règles sont écrites en
 *    tête du code qui les porte (lib/photos-tatoueur) ;
 * §1 dans les favoris, la première photo affichée est celle que
 *    l'artiste a placée en premier : la colonne `ordre` est LUE, elle
 *    voyage jusqu'à l'écran, et c'est elle qui range les carrousels ;
 * §2 les quatre règles tenues surface par surface — mosaïque, cartes,
 *    fiche, fenêtre superposée, favoris, rangées de suivis,
 *    photothèque, pages style + ville, formulaire ;
 * §3 la migration qui retire les 72 fiches de démonstration compte
 *    avant et après, nettoie tout ce qui en dépend, et ne touche à
 *    AUCUNE autre fiche (démarchage compris) ;
 * §4 le catalogue de démonstration ne s'active qu'en développement :
 *    en production, une base injoignable ne sert aucune fausse fiche.
 *
 * ⚠️ UNE SEULE LARGEUR (390 px) : livraison rapide demandée par le
 * propriétaire — cette passe ne porte sur aucune valeur graphique.
 * ⚠️ SUPABASE EST HORS DE PORTÉE de ce conteneur : les favoris (qui
 * exigent une session) sont prouvés par le REJEU des écritures
 * livrées, jamais maquillés. Les sections concernées le disent.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : rien ici ne parle pour Safari/iOS.
 */
import {
  BASE,
  bilan,
  chromium,
  lire,
  nonJoue,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const photosLib = lire("src/lib/photos-tatoueur.ts");
const photosNu = sansNotes(photosLib);
const favorisServeur = lire("src/lib/favoris-serveur.ts");
const favorisNu = sansNotes(favorisServeur);
const pageFavorisNu = sansNotes(lire("src/components/PageFavoris.tsx"));
const selectionNu = sansNotes(lire("src/lib/selection-suivis.ts"));
const tatoueursLib = lire("src/lib/tatoueurs.ts");
const tatoueursNu = sansNotes(tatoueursLib);
const villesNu = sansNotes(lire("src/lib/villes-catalogue.ts"));
const garde = lire("src/lib/catalogue-demonstration.ts");
const photoLib = sansNotes(lire("src/lib/photo-tatoueur.ts"));
const ficheNu = sansNotes(lire("src/components/FicheTatoueur.tsx"));
const fenetreNu = sansNotes(lire("src/components/FenetreFiche.tsx"));
const carteNu = sansNotes(lire("src/components/CarteTatoueur.tsx"));
const enregistrerNu = sansNotes(lire("src/lib/enregistrer-photos.ts"));
const migration = lire("supabase/yokofolio-retirer-fiches-demo.sql");

/* ==================================================================
 * §0 — LA DÉFINITION EST ÉCRITE, ET AU BON ENDROIT
 * ================================================================== */
titre("§0 — la définition du carrousel, en tête du code qui la porte");
{
  //  Elle vit dans le fichier qui porte `cleDEnsemble` : c'est LUI qui
  //  définit un carrousel, et donc lui qui doit porter la règle.
  const enTete = photosLib.slice(0, photosLib.indexOf("export const RENDUS_PHOTO"));
  verif(
    "les TROIS composantes (style, catégorie, rendu) et l'ordre de " +
      "l'artiste sont nommés en tête de lib/photos-tatoueur",
    /UN CARROUSEL N'EST PAS UNE PHOTO/.test(enTete) &&
      /photos_tatoueur\.ordre/.test(enTete) &&
      /cleDEnsemble/.test(enTete)
  );
  verif(
    "LES QUATRE RÈGLES y sont, numérotées — première photo, ordre des " +
      "suivantes, aucun mélange, le cœur porte sur le carrousel entier",
    /1\. LA PREMIÈRE PHOTO DE L'ARTISTE EST LA PREMIÈRE PHOTO AFFICHÉE/.test(
      enTete
    ) &&
      /2\. L'ORDRE DES SUIVANTES NE CHANGE JAMAIS/.test(enTete) &&
      /3\. UN CARROUSEL NE MÊLE JAMAIS LES PHOTOS D'UN AUTRE/.test(enTete) &&
      /4\. LE CŒUR PORTE SUR LE CARROUSEL ENTIER/.test(enTete)
  );
  verif(
    "et l'exception est dite, pour qu'on ne l'invente pas plus tard : " +
      "une bande CHRONOLOGIQUE n'est pas un carrousel",
    /CE QUI N'EST PAS UN CARROUSEL/.test(enTete)
  );
}

/* ==================================================================
 * §1 — LA CAUSE, ET LE REMÈDE, À LA SOURCE
 * ================================================================== */
titre("§1 — à la source : `ordre` est lu, il voyage, il range");
{
  verif(
    "LA CAUSE 1 EST CORRIGÉE : la lecture des favoris demande `ordre` " +
      "à la base (elle ne le demandait pas du tout)",
    /\.select\("id, tatoueur_id, style, rendu, nature, url, miniature, ordre"\)/.test(
      favorisNu
    )
  );
  verif(
    "il voyage jusqu'à l'écran : `PhotoFavorite` porte `ordre`, et la " +
      "lecture le renseigne (repli 0 si la colonne manque)",
    /ordre: number;/.test(favorisNu) && /ordre: photo\.ordre \?\? 0,/.test(favorisNu)
  );
  verif(
    "LA CAUSE 2 EST CORRIGÉE : la page des favoris range chaque " +
      "carrousel par l'ordre de l'artiste, et garde `ordre` dans la " +
      "galerie qu'elle fabrique (elle y écrivait le rang des favoris)",
    /const duMemeEnsemble = ordreDeLArtiste\(/.test(pageFavorisNu) &&
      /ordre: entree\.ordre,/.test(pageFavorisNu) &&
      !/ordre: rang,/.test(pageFavorisNu)
  );
  verif(
    "la rangée « Vos coups de cœur » de Ma sélection suit la même règle " +
      "— carrousel par carrousel, l'ordre de l'artiste dans chacun",
    /const aimeesSource = ordreDeLArtiste\(duSuivi\)\.sort\(/.test(selectionNu) &&
      /rangDuCarrousel/.test(selectionNu)
  );
  verif(
    "l'écriture est UNIQUE (`ordreDeLArtiste`), et le tri est STABLE — " +
      "une base sans la colonne garde l'ordre qu'elle avait",
    /export function ordreDeLArtiste/.test(photosNu) &&
      /\(a\.photo\.ordre \?\? 0\) - \(b\.photo\.ordre \?\? 0\) \|\| a\.rang - b\.rang/.test(
        photosNu
      )
  );
  verif(
    "et la règle devient STRUCTURELLE : `ensembleDeLaPhoto` rend le " +
      "carrousel DÉJÀ rangé, quelle que soit la surface qui l'appelle",
    /return ordreDeLArtiste\(\s*\(galerie \?\? \[\]\)\.filter/.test(photosNu)
  );
}

/* ------------------------------------------------------------------
 * §1 — LE REJEU : la correction jouée sur le défaut exact du relevé
 * ---------------------------------------------------------------- */
titre("§1 — REJEU de l'écriture livrée sur le cas du relevé");
{
  //  ⚠️ ON REJOUE LA FONCTION LIVRÉE, extraite du fichier — pas une
  //  copie écrite ici : c'est la règle de la maison depuis la nº 265.
  //  (Les annotations TypeScript de la SIGNATURE sont retirées avant
  //  `new Function` — le piège payé en nº 272 et nº 275.)
  const source = photosLib.slice(
    photosLib.indexOf("export function ordreDeLArtiste"),
    photosLib.indexOf("export function ordreDeLArtiste") + 700
  );
  //  ⚠️ ON DÉCOUPE APRÈS LA SIGNATURE, et pas à la première accolade :
  //  le générique en contient une (`<T extends { ordre?: … }>`), et
  //  `new Function` refuse les annotations TypeScript — le piège payé
  //  en nº 272 puis en nº 275, et une troisième fois ici.
  const debut = source.indexOf("): T[] {") + "): T[] {".length;
  const corps = source.slice(debut, source.indexOf("\n}"));
  const ordreDeLArtiste = new Function("photos", corps);

  //  LE CAS DU RELEVÉ : une galerie de quatre photos aimée d'un seul
  //  geste. Les lignes de favoris sortent de la base dans un ordre qui
  //  n'est pas celui de l'artiste (même `cree_le` pour toutes : le
  //  `upsert` les écrit en une fois — voir /api/yokofolio/favoris/photo).
  const commeLaBaseLesRend = [
    { id: "c", ordre: 2 },
    { id: "a", ordre: 0 },
    { id: "d", ordre: 3 },
    { id: "b", ordre: 1 },
  ];
  const range = ordreDeLArtiste(commeLaBaseLesRend);
  verif(
    "la PREMIÈRE photo affichée redevient celle de l'artiste, et la " +
      "suite est dans son ordre",
    range.map((p) => p.id).join("") === "abcd",
    `favoris rendus « ${commeLaBaseLesRend.map((p) => p.id).join("")} » → affichés « ${range
      .map((p) => p.id)
      .join("")} »`
  );
  const sansColonne = [{ id: "x" }, { id: "y" }, { id: "z" }];
  verif(
    "une base d'avant la colonne (aucun `ordre`) garde son ordre — le " +
      "tri est stable, rien ne se mélange",
    ordreDeLArtiste(sansColonne).map((p) => p.id).join("") === "xyz"
  );
}

/* ==================================================================
 * §2 — LES QUATRE RÈGLES, SURFACE PAR SURFACE
 * ================================================================== */
titre("§2 — à la source : chaque surface et sa source d'ordre");
{
  verif(
    "MOSAÏQUE / CARTES / PHOTOTHÈQUE : la galerie est lue en base DANS " +
      "L'ORDRE (`order(\"ordre\")`), et la carte n'affiche qu'un ensemble",
    /\.order\("ordre"\)/.test(tatoueursNu) &&
      /ensembleDeLaPhoto\(\s*tatoueur\.galerie/.test(carteNu)
  );
  verif(
    "CARTES : le cœur enregistre l'ENSEMBLE ENTIER (règle 4), pas la " +
      "photo touchée",
    /galerie=\{ensembleDeLaPhoto\(/.test(carteNu)
  );
  verif(
    "FICHE et FENÊTRE : le carrousel ne mêle plus deux galeries — sans " +
      "recherche, il ouvre l'ensemble de la PREMIÈRE photo (règle 3)",
    /const serieInitiale =\s*serieCherchee \?\? serieDeLOuverture\(groupes, ouverture\.style\);/.test(
      ficheNu
    ) &&
      /const serieInitiale =\s*serieCherchee \?\? serieDeLOuverture\(groupes, ouverture\.style\);/.test(
        fenetreNu
      ) &&
      /export function serieDeLOuverture/.test(photoLib)
  );
  verif(
    "FICHE : les photos d'un style sont rangées par `ordre` " +
      "(`photosDuStyle` → `galerieOrdonnee`), et le cœur porte sur " +
      "l'ensemble affiché",
    /return galerieOrdonnee\(photos\)\.filter\(\(photo\) => photo\.style === style\);/.test(
      photosNu
    ) && /galerie=\{galerieAffichee\}/.test(ficheNu)
  );
  verif(
    "FORMULAIRE : c'est lui qui ÉCRIT l'ordre — le rang du " +
      "glisser-déposer devient `ordre` en base",
    /ordre: rang,/.test(enregistrerNu)
  );
  verif(
    "PAGES STYLE + VILLE : elles montrent les mêmes cartes, donc la " +
      "même règle — aucune seconde écriture de la vignette",
    /export function photoPourStyle/.test(sansNotes(lire("src/lib/photo-tatoueur.ts"))) &&
      /const choisie = photoChoisie\(tatoueur, style, rendu, nature\);/.test(
        sansNotes(lire("src/lib/photo-tatoueur.ts"))
      )
  );
}

titre("§2 — VIVANT (390 px) : le carrousel d'une fiche est UN carrousel");
{
  //  ⚠️ DEUX SERVEURS, DEUX TEMPS — et ce n'est pas un caprice du banc.
  //  Le serveur de développement (port 3000) et celui de production
  //  (port 3100) écrivent et lisent LE MÊME dossier `.next` : ils ne
  //  peuvent pas tourner ensemble. Ce banc se joue donc DEUX FOIS —
  //  une fois production bâtie et démarrée (le §4 vivant s'exécute, le
  //  §2 se déclare non joué), une fois en développement (l'inverse) —
  //  et chaque exécution dit ce qu'elle a joué. Aucun vert n'est
  //  emprunté à l'autre.
  let devJoignable = false;
  try {
    devJoignable = (await fetch(`${BASE}/`, { signal: AbortSignal.timeout(8000) })).ok;
  } catch {
    devJoignable = false;
  }
  if (!devJoignable) {
    nonJoue(
      "§2 · vivant",
      `aucun serveur de développement ne répond sur ${BASE} — le lancer ` +
        "avec `npm run dev`, puis rejouer ce banc (voir la note ci-dessus)"
    );
  } else {
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await contexte.newPage();
  try {
    //  typo-sauvage porte DES FLASHS ET DES RÉALISATIONS dans le même
    //  style : c'est la fiche où le mélange se voyait.
    await page.goto(`${BASE}/tatoueur/typo-sauvage-bordeaux`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(2500);
    const vu = await page.evaluate(() => {
      const carrousel = document.querySelector("[data-carrousel]");
      const colonnes = [...(carrousel?.querySelectorAll("[data-nature]") ?? [])];
      return {
        declaree: carrousel?.getAttribute("data-serie-nature") ?? null,
        natures: [...new Set(colonnes.map((c) => c.getAttribute("data-nature")))],
        photos: colonnes.length,
      };
    });
    verif(
      "390 px : ouverte SANS recherche, la fiche ne montre QU'UNE " +
        "catégorie — plus de flash mêlé aux réalisations (règle 3)",
      vu.natures.length === 1 && vu.natures[0] === vu.declaree,
      `${vu.photos} photo(s), catégorie(s) [${vu.natures.join(", ")}], déclarée « ${vu.declaree} »`
    );
  } catch (erreur) {
    nonJoue("§2 vivant", String(erreur).slice(0, 110));
  } finally {
    await contexte.close();
    await nav.close();
  }
  }
}

nonJoue(
  "§1 et §2 · LES FAVORIS VIVANTS",
  "la page « Ma sélection » exige une session et la base : les deux " +
    "sont hors de portée de ce conteneur. La correction est prouvée " +
    "par la source (la colonne lue, portée, et le tri appliqué aux " +
    "deux surfaces) et par le REJEU ci-dessus de l'écriture livrée sur " +
    "le cas exact du relevé — l'essai sur le vrai compte revient au " +
    "propriétaire"
);

/* ==================================================================
 * §3 — LA MIGRATION
 * ================================================================== */
titre("§3 — la migration de suppression, lue ligne à ligne");
{
  verif(
    "elle ne vise QUE le préfixe des fiches de démonstration — aucun " +
      "autre critère de suppression de fiche",
    (migration.match(/delete from public\.tatoueurs/g) ?? []).length === 1 &&
      /delete from public\.tatoueurs where slug like 'demo-p214-%';/.test(
        migration
      )
  );
  verif(
    "elle COMPTE avant et après : fiches de démonstration, photos, " +
      "AUTRES fiches, et rattachements de démarchage",
    /fiches_demo_avant/.test(migration) &&
      /fiches_demo_apres/.test(migration) &&
      /autres_fiches_avant/.test(migration) &&
      /autres_fiches_apres/.test(migration) &&
      /demarchage_avant/.test(migration) &&
      /demarchage_apres/.test(migration)
  );
  verif(
    "LE VERDICT est explicite : il exige 0 fiche de démonstration ET " +
      "aucune autre fiche perdue ET le démarchage intact",
    /then '✅ les fiches de démonstration sont parties/.test(migration) &&
      /else '⚠️ VÉRIFIER/.test(migration)
  );
  verif(
    "les dépendances SANS cascade sont traitées à la main — modes " +
      "(salon_id), notifications, suggestions, clics, signalements",
    /update public\.modes_exercice\s*\n\s*set salon_id = null/.test(migration) &&
      /delete from public\.notifications_compte/.test(migration) &&
      /delete from public\.suggestions_style/.test(migration) &&
      /delete from public\.clics_fiches where tatoueur_slug like 'demo-p214-%';/.test(
        migration
      ) &&
      /delete from public\.signalements_fiches where tatoueur_slug like 'demo-p214-%';/.test(
        migration
      )
  );
  verif(
    "AUCUNE LIGNE ORPHELINE : les neuf tables rattachées sont comptées " +
      "après coup, et doivent toutes rendre zéro",
    [
      "photos_orphelines",
      "coeurs_orphelins",
      "abonnements_orphelins",
      "modes_orphelins",
      "salons_fantomes",
      "studios_orphelins",
      "liaisons_orphelines",
      "demarchage_orphelins",
    ].every((colonne) => migration.includes(colonne))
  );
  verif(
    "elle est encadrée par une transaction : rien n'est écrit tant que " +
      "les deux blocs de vérification n'ont pas été lus",
    /^begin;$/m.test(migration) &&
      /^commit;$/m.test(migration) &&
      /rollback/.test(migration)
  );
  verif(
    "elle est déclarée dans le LISEZ-MOI, au numéro 67",
    /^67\. \*\*`yokofolio-retirer-fiches-demo\.sql`\*\*/m.test(
      lire("supabase/LISEZ-MOI-ordre-des-migrations.md")
    )
  );
  nonJoue(
    "§3 · la migration PASSÉE (72 → 0)",
    "Supabase est hors de portée de ce conteneur, et une migration ne " +
      "se joue JAMAIS ici (règle du propriétaire) : les comptes 72 " +
      "avant / 0 après s'afficheront dans son éditeur SQL, avec le " +
      "verdict et le tableau des orphelines. Le fichier est vérifié " +
      "ligne à ligne ci-dessus"
  );
}

/* ==================================================================
 * §4 — LE CATALOGUE DE DÉMONSTRATION, HORS PRODUCTION
 * ================================================================== */
titre("§4 — à la source : une seule garde, et tous les replis la posent");
{
  verif(
    "la règle a UNE écriture : `catalogueDemoAutorise` — jamais en " +
      "production, sauf soupape explicite (CATALOGUE_DEMO=1)",
    /export function catalogueDemoAutorise\(\): boolean \{/.test(garde) &&
      /process\.env\.NODE_ENV !== "production"/.test(garde) &&
      /process\.env\.CATALOGUE_DEMO === "1"/.test(garde)
  );
  verif(
    "et un message HONNÊTE, qui ne nomme ni la base ni l'erreur",
    /export const MESSAGE_INDISPONIBLE =/.test(garde) &&
      /momentanément indisponible/.test(garde)
  );
  //  TOUS LES POINTS DE REPLI : chacun doit poser la question. On les
  //  compte à la source — cinq usages du catalogue, cinq gardes.
  const usagesTatoueurs = (tatoueursNu.match(/TATOUEURS_DEMO/g) ?? []).length;
  const gardesTatoueurs = (tatoueursNu.match(/catalogueDemoAutorise\(\)/g) ?? [])
    .length;
  verif(
    "lib/tatoueurs : CHAQUE repli vers le catalogue est gardé " +
      "(recherche, fiche publique, fiche du propriétaire, ancien slug, ville)",
    gardesTatoueurs >= 5 && gardesTatoueurs >= usagesTatoueurs - 1,
    `${usagesTatoueurs} usage(s) du catalogue · ${gardesTatoueurs} garde(s)`
  );
  verif(
    "lib/villes-catalogue : les suggestions de lieux aussi — une ville " +
      "inventée mènerait à une fausse fiche",
    /if \(!catalogueDemoAutorise\(\)\) return \[\];/.test(villesNu)
  );
  verif(
    "la recherche rend une liste VIDE et le message honnête, jamais " +
      "des fiches inventées",
    /if \(!catalogueDemoAutorise\(\)\) \{\s*return pageDeResultats\(\[\], filtres, clics, \{\s*demonstration: false,\s*message: MESSAGE_INDISPONIBLE,/.test(
      tatoueursNu
    )
  );
  verif(
    "LE PLAN DU SITE ne pouvait déjà pas les voir : il lit la base " +
      "DIRECTEMENT, sans aucun repli sur le catalogue",
    !/TATOUEURS_DEMO|tatoueurs-demo/.test(lire("src/app/sitemap.ts"))
  );
  verif(
    "la soupape n'est PAS armée dans l'environnement livré",
    !/^CATALOGUE_DEMO=/m.test(lire(".env.local"))
  );
}

/* ------------------------------------------------------------------
 * §4 — VIVANT : une production simulée, base injoignable
 * ---------------------------------------------------------------- */
titre("§4 — VIVANT : en production, aucune fausse fiche servie");
{
  //  Le banc interroge un serveur bâti et démarré en PRODUCTION
  //  (`npm run build && npm start -- -p 3100`), la base étant
  //  injoignable depuis ce conteneur — le cas exact que le §4 vise.
  const BASE_PROD = process.env.BASE_PROD ?? "http://localhost:3100";
  let joignable = false;
  try {
    const reponse = await fetch(`${BASE_PROD}/`, { signal: AbortSignal.timeout(8000) });
    joignable = reponse.ok;
  } catch {
    joignable = false;
  }
  if (!joignable) {
    nonJoue(
      "§4 · production simulée",
      `aucun serveur de production ne répond sur ${BASE_PROD} — le lancer ` +
        "avec `npm run build && npm start -- -p 3100`, puis rejouer ce banc"
    );
  } else {
    const nav = await chromium.launch({
      executablePath: process.env.CHEMIN_CHROMIUM,
      args: ["--no-proxy-server"],
    });
    const contexte = await nav.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await contexte.newPage();
    try {
      await page.goto(`${BASE_PROD}/`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForTimeout(3000);
      const accueil = await page.evaluate(() => ({
        cartes: document.querySelectorAll("[data-carte]").length,
        texte: document.body.innerText.slice(0, 4000),
      }));
      verif(
        "production · l'accueil ne sert AUCUNE carte quand la base ne " +
          "répond pas",
        accueil.cartes === 0,
        `${accueil.cartes} carte(s)`
      );
      verif(
        "production · le message est honnête, et ne parle ni de " +
          "démonstration ni de la base",
        /momentanément indisponible/i.test(accueil.texte) &&
          !/DÉMONSTRATION/i.test(accueil.texte),
        accueil.texte.split("\n").find((l) => /indisponible/i.test(l)) ?? "(absent)"
      );
      //  L'ADRESSE D'UNE FICHE DE DÉMONSTRATION — elle ne doit plus
      //  répondre : c'est une page introuvable, comme n'importe quelle
      //  adresse qui n'existe pas.
      const reponseFiche = await page.goto(
        `${BASE_PROD}/tatoueur/camille-fauve-paris-18e`,
        { waitUntil: "domcontentloaded", timeout: 60000 }
      );
      await page.waitForTimeout(1500);
      const fiche = await page.evaluate(() => document.body.innerText.slice(0, 1500));
      //  ⚠️ 404 EXIGÉ, PAS SEULEMENT « la fiche n'apparaît pas » : une
      //  adresse de démonstration doit répondre comme une adresse qui
      //  n'existe pas. (Un 500 signale ici un `.next` partagé entre le
      //  serveur de développement et celui de production — les deux ne
      //  peuvent pas tourner ensemble sur le même dossier de build ;
      //  voir la note d'usage en tête de cette section.)
      verif(
        "production · l'adresse d'une fausse fiche répond « page " +
          "introuvable » (404), et ne montre aucun nom inventé",
        reponseFiche?.status() === 404 && !/Camille Fauve/i.test(fiche),
        `statut ${reponseFiche?.status()} · ${fiche.split("\n")[0] ?? ""}`
      );
      //  LE PLAN DU SITE — aucune adresse de démonstration.
      const plan = await (await fetch(`${BASE_PROD}/sitemap.xml`)).text();
      verif(
        "production · le plan du site ne contient AUCUNE fiche de " +
          "démonstration",
        !/camille-fauve|typo-sauvage|hokusai-mecanique|demo-p214-/.test(plan),
        `${(plan.match(/<url>/g) ?? []).length} adresse(s) annoncée(s)`
      );
    } catch (erreur) {
      nonJoue("§4 · production simulée", String(erreur).slice(0, 110));
    } finally {
      await contexte.close();
      await nav.close();
    }
  }
}

bilan();
