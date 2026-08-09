/**
 * TEST PERMANENT — LES PAGES PUBLIQUES DE YOKOFOLIO
 * ==================================================
 * POURQUOI CE FICHIER EXISTE. Quatre suites de vérification
 * (verif-p90 à verif-p93) avaient été écrites passe après passe, puis
 * laissées dans un dossier de travail. Elles ont pourri : leurs
 * sélecteurs cherchaient des textes disparus, et surtout elles
 * ouvraient TOUTES le formulaire de fiche AVANT tout le reste, en
 * attendant un bouton (« Je tatoue en mon nom ») supprimé depuis la
 * passe nº 95. Elles patientaient trois minutes, puis s'arrêtaient
 * sur une pile d'erreur — sans avoir rien vérifié, pas même les
 * sections suivantes, qui ne demandaient pourtant rien.
 *
 * ⚠️ CORRECTION D'UNE ERREUR QUE CE FICHIER A LUI-MÊME PROPAGÉE :
 * il était écrit ici que le formulaire « exige une session Supabase »
 * et serait donc hors d'atteinte de ce conteneur. C'est FAUX. Il
 * s'affiche après huit à dix secondes (le temps que l'appel à
 * Supabase expire) et se remplit de bout en bout — voir
 * `formulaireNeuf()` dans commun-verif.mjs, et les suites p91 à p93
 * qui s'en servent. Les sondes d'alors n'attendaient pas assez.
 *
 * CE FICHIER GARDE CE QU'ELLES AVAIENT DE BON — les vérifications qui
 * portent sur les PAGES PUBLIQUES — et rien d'autre. Il ne demande ni
 * session, ni base, ni réseau : il tourne partout, tout le temps.
 * C'est la condition pour qu'il ne pourrisse pas à son tour.
 *
 * CE QUI EN A ÉTÉ RETIRÉ, ET POURQUOI : voir
 * tests/LISEZ-MOI-les-suites.md.
 *
 *     npm run test:public      (serveur de développement démarré)
 */

const { chromium } = await import("playwright").catch(
  () => import("/opt/node22/lib/node_modules/playwright/index.mjs")
);
import { readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const RACINE = process.env.RACINE ?? "/home/user/mon-site-roswel";
const lire = (chemin) => readFileSync(`${RACINE}/${chemin}`, "utf8");

let reussis = 0;
const echecs = [];
function verif(nom, condition, detail = "") {
  if (condition) {
    reussis++;
    console.log(`  OK  ${nom}`);
  } else {
    echecs.push({ nom, detail });
    console.log(`  ÉCHEC  ${nom}${detail ? `\n         ↳ ${detail}` : ""}`);
  }
}
const titre = (t) => console.log(`\n──── ${t} ────`);

const nav = await chromium.launch({ args: ["--no-proxy-server"] });
const ctx = await nav.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
const erreurs = [];
page.on("pageerror", (e) => erreurs.push(e.message));

/** Aller sur une page et attendre que le corps soit peuplé. */
async function ouvrir(chemin, attendre = "body") {
  await page.goto(`${BASE}${chemin}`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.locator(attendre).first().waitFor({ timeout: 60000 });
  await page.waitForTimeout(1200);
}

/* ================================================================
 * 1) L'ACCUEIL — repris de verif-p90 §4
 * ================================================================ */
titre("1 · L'accueil et le pied de page");
await ouvrir("/");
const corpsAccueil = await page.locator("body").innerText();
//  ⚠️ LE MENU S'APPELLE « EXPLORER » depuis la passe nº 110 (il
//  demandait « Quel style ? », il propose maintenant des TATOUAGES ou
//  des FLASHS, puis un style dans l'un ou l'autre).
verif(
  "la page rend le moteur de recherche",
  /explorer/i.test(corpsAccueil),
  corpsAccueil.replace(/\n+/g, " | ").slice(0, 160)
);

const lienInsta = page.locator(
  'footer a[href="https://www.instagram.com/yoko.folio/"]'
);
verif("le compte Instagram est dans le pied de page", (await lienInsta.count()) === 1);
verif(
  "il s'ouvre dans un nouvel onglet, proprement",
  (await lienInsta.first().getAttribute("target")) === "_blank" &&
    (await lienInsta.first().getAttribute("rel"))?.includes("noopener")
);
//  ⚠️ nº 141-8 : plus de SVG maison — le pied porte le glyphe
//  `icone-instagram.png` déposé par le propriétaire, éclairci par
//  `invert` (jamais retouché), dans un cercle gris.
verif(
  "il porte l'icône Instagram du propriétaire",
  (await lienInsta.first().locator('img[src="/icone-instagram.png"]').count()) === 1
);

/* ================================================================
 * 2) LA FICHE PUBLIQUE — repris de verif-p90 §6 et §7
 * ================================================================ */
titre("2 · La fiche publique");
await ouvrir("/tatoueur/atelier-corvus-lyon-1er", "h1");
const sections = (await page.locator("h2").allInnerTexts()).map((t) =>
  t.trim().toLowerCase()
);
verif("la section « Besoins » est là", sections.includes("besoins"), sections.join(" / "));
verif("la section « Rendu » est là", sections.includes("rendu"));

const badgesRendu = await page.evaluate(() => {
  const h = [...document.querySelectorAll("h2")].find(
    (x) => x.textContent.trim().toLowerCase() === "rendu"
  );
  if (!h) return [];
  return [...h.parentElement.querySelectorAll("li")].map((l) =>
    l.textContent.trim()
  );
});
verif(
  "elle porte de vrais badges, déduits des photos",
  badgesRendu.length > 0 &&
    badgesRendu.every((b) => ["Noir et gris", "Couleur"].includes(b)),
  badgesRendu.join(" · ")
);
verif(
  "une section vide ne s'affiche pas",
  lire("src/components/FicheTatoueur.tsx").includes("groupe.slugs.length > 0") &&
    lire("src/components/FenetreFiche.tsx").includes("groupe.slugs.length > 0")
);
verif(
  "le rendu se déduit des photos, en un seul endroit",
  lire("src/lib/photos-tatoueur.ts").includes("export function rendusDuPortfolio")
);

/* ================================================================
 * 3) LES FILTRES — repris de verif-p90 §8
 * ================================================================ */
titre("3 · Les filtres retirent vraiment des fiches");
async function combien(parametres) {
  await ouvrir(`/?${parametres}`);
  return page.locator("a[href^='/tatoueur/']").count();
}
const total = await combien("");
const sansCover = await combien("exclure=cover");
const sansCouleur = await combien("exclure=color");
verif("l'accueil montre des fiches", total > 0, `total = ${total}`);
verif(
  "éteindre « Cover » en retire",
  sansCover < total,
  `${sansCover} au lieu de ${total}`
);
verif(
  "éteindre « Couleur » en retire",
  sansCouleur < total,
  `${sansCouleur} au lieu de ${total}`
);

/* ================================================================
 * 4) LA RECHERCHE CONNAÎT TOUS LES LIEUX — la passe nº 96
 * ================================================================
 * ⚠️ CES QUATRE-LÀ SONT NEUVES. Elles gardent la correction de cette
 * passe : une fiche remonte si L'UN QUELCONQUE de ses lieux répond.
 * Les fiches de démonstration portent exprès ce qu'il faut :
 * `kosei-tattoo-lyon-2e` fait un guest à Bordeaux (à venir), et
 * `trait-nord-strasbourg` en a fait un à Strasbourg, TERMINÉ.
 */
titre("4 · La recherche connaît tous les lieux d'une fiche");

async function chercher(ville, lat, lon, rayon = 0) {
  await ouvrir(
    `/?lieu=${encodeURIComponent(ville)}&lat=${lat}&lon=${lon}&rayon=${rayon}&ville=${encodeURIComponent(ville)}`
  );
  return {
    combien: await page.locator("a[href^='/tatoueur/']").count(),
    texte: await page.locator("body").innerText(),
  };
}

const bordeaux = await chercher("Bordeaux", 44.8378, -0.5792);
//  ⚠️ ON VISE LE LIEN, PAS LE NOM AFFICHÉ : la fiche s'appelle
//  « Kōsei Tattoo », avec un macron. Un test qui cherche un nom propre
//  dans du texte se casse à la première coquille typographique ; le
//  slug, lui, est figé à la création et ne bouge plus.
const liens = async () =>
  Promise.all(
    (await page.locator("a[href^='/tatoueur/']").all()).map((a) =>
      a.getAttribute("href")
    )
  );
verif(
  "un guest à Bordeaux fait sortir sa fiche à Bordeaux",
  (await liens()).includes("/tatoueur/kosei-tattoo-lyon-2e"),
  `${bordeaux.combien} fiche(s) — ${bordeaux.texte
    .replace(/\n+/g, " | ")
    .slice(0, 200)}`
);
verif(
  "les fiches DE Bordeaux y sont toujours",
  bordeaux.combien >= 3,
  `${bordeaux.combien} fiche(s)`
);
verif(
  "aucune fiche en double",
  await page.evaluate(() => {
    const liens = [...document.querySelectorAll("a[href^='/tatoueur/']")].map(
      (a) => a.getAttribute("href")
    );
    return new Set(liens).size === liens.length;
  })
);

const strasbourg = await chercher("Strasbourg", 48.5734, 7.7521);
verif(
  "un guest TERMINÉ ne fait plus sortir personne",
  !(await liens()).includes("/tatoueur/kosei-tattoo-lyon-2e") &&
    strasbourg.combien === 1,
  `${strasbourg.combien} fiche(s)`
);

verif(
  "la règle est écrite UNE fois, et lue des deux côtés",
  lire("src/lib/modes-exercice.ts").includes("export function lieuxDeLaFiche") &&
    lire("src/lib/tatoueurs.ts").includes("lieuxDeLaFiche(t)") &&
    lire("supabase/yokofolio-tous-les-lieux.sql").includes(
      "create or replace view public.lieux_tatoueur"
    )
);

/* ================================================================
 * 5) L'INTERRUPTEUR « FICHE D'ESSAI EN LIGNE » — la passe nº 97
 * ================================================================
 * ⚠️ VÉRIFIÉ DANS LE CODE, PAS À L'ÉCRAN, et c'est assumé : allumer
 * l'interrupteur demande une session d'administrateur, que ce banc
 * n'a pas. Ce qui compte ici, c'est que le contrôle existe AUX TROIS
 * ENDROITS SERVEUR — en oublier un rendrait la fiche visible par une
 * porte qu'on n'a pas regardée.
 */
titre("5 · L'interrupteur des fiches d'essai");
verif(
  "la recherche connaît l'exception (migration nº 43)",
  lire("supabase/yokofolio-fiche-admin-publique.sql").includes(
    "or t.admin_publique"
  )
);
verif(
  "la mosaïque hors base la connaît aussi",
  lire("src/lib/tatoueurs.ts").includes('fiche.admin_publique === true')
);
verif(
  "l'adresse directe d'une fiche la connaît",
  lire("src/lib/tatoueurs.ts").includes("fiche.admin_publique !== true")
);
verif(
  "le plan du site la connaît",
  lire("src/app/sitemap.ts").includes("ligne.admin_publique !== true")
);
//  ⚠️ LA ROUTE A CHANGÉ DE NOM À LA PASSE Nº 135 : l'interrupteur vit
//  désormais dans le tableau de démarchage. Sa SECONDE SERRURE, elle,
//  est la même — et c'est elle qu'on vérifie ici.
verif(
  "l'API refuse d'allumer l'interrupteur sur la fiche d'un vrai tatoueur",
  lire("src/app/api/admin/yokofolio/demarchage/fiche/route.ts").includes(
    "!comptes.includes(ligne.user_id)"
  )
);
//  ⚠️ L'AVERTISSEMENT « une fiche d'essai est EN LIGNE » A DISPARU
//  (passe nº 135), et c'est voulu : une fiche d'administrateur EN
//  LIGNE n'est plus un oubli à corriger, c'est le but — c'est ce
//  qu'on démarche. Le tableau montre l'état de chacune, en clair.
verif(
  "le tableau de démarchage dit ce qui est en ligne",
  lire("src/components/AdminDemarchage.tsx").includes("en ligne sur")
);

/* ================================================================
 * 6) NON-RÉGRESSIONS — reprises des quatre suites
 * ================================================================ */
titre("6 · Non-régressions");
verif(
  "les logos définitifs ne sont référencés que par leur chemin",
  lire("src/components/Logo.tsx").includes("/images/roswel-logo.png") &&
    lire("src/components/Logo.tsx").includes("/images/roswel-icone.png")
);
verif(
  "le remplissage automatique est neutralisé partout où il gêne",
  lire("src/components/ChampLocalisation.tsx").includes("sansRemplissageAuto") &&
    lire("src/components/FormulaireFiche.tsx").includes("sansRemplissageAuto") &&
    lire("src/components/ChampBio.tsx").includes("sansRemplissageAuto")
);
verif(
  "le défilement de page garde son garde-fou",
  lire("src/app/layout.tsx").includes("data-scroll-behavior")
);
verif("aucune erreur JavaScript sur les pages visitées", erreurs.length === 0,
  erreurs.slice(0, 3).join(" | "));

await nav.close();

console.log(
  `\n${reussis}/${reussis + echecs.length} vérifications passées` +
    (echecs.length ? `\n\n${echecs.length} ÉCHEC(S) :` : "\n\nTOUT EST BON")
);
for (const e of echecs) console.log(`  · ${e.nom}${e.detail ? ` — ${e.detail}` : ""}`);
process.exit(echecs.length === 0 ? 0 : 1);
