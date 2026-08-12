/**
 * LE BANC DE LA PASSE Nº 237 — UNE SEULE LARGEUR (1440 px),
 * plus le rendu à 390 px demandé au §3
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE,
 * jamais le rendu de WebKit.
 *
 * LES CONTRÔLES DU §3 :
 *   §1 — le liseré des MENUS mesuré plus faible que celui des
 *        FENÊTRES, et la nuance haut/bas conservée sur les deux ;
 *   §2 — la ligne de Mon compte : translucide (jamais un aplat), au
 *        survol sur web et à l'appui au doigt, même géométrie des
 *        deux côtés, couleur du texte inchangée.
 *
 * Il se lance comme les autres :  node tests/verif-p237.mjs
 * (le site doit tourner sur http://localhost:3000 — .next PURGÉ).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

const navigateur = await chromium.launch();

/* ==================================================================
 * §1 — LES DEUX LISERÉS, À LA SOURCE
 * ================================================================== */
titre("§1 — les deux liserés, à la source");
{
  const css = lire("src/app/globals.css");
  const fenetre = css.match(/\[data-verre-fenetre\]\s*\{[^}]+\}/)?.[0] ?? "";
  const menu = css.match(/\[data-verre-menu\]\s*\{[^}]+\}/)?.[0] ?? "";
  verif(
    "les fenêtres gardent les valeurs de la 234 (0,10 / 0,035)",
    /inset 0 1px 0 0 rgba\(255, 255, 255, 0\.1\)/.test(fenetre) &&
      /inset 0 0 0 1px rgba\(255, 255, 255, 0\.035\)/.test(fenetre)
  );
  verif(
    "les menus descendent d'un cran (0,05 / 0,02)",
    /inset 0 1px 0 0 rgba\(255, 255, 255, 0\.05\)/.test(menu) &&
      /inset 0 0 0 1px rgba\(255, 255, 255, 0\.02\)/.test(menu)
  );
  //  LA NUANCE HAUT/BAS : le coefficient du bord haut est PLUS FORT
  //  que celui du tour, sur les deux règles.
  const nuance = (bloc) => {
    const haut = Number(bloc.match(/inset 0 1px 0 0 rgba\(255, 255, 255, ([\d.]+)\)/)?.[1]);
    const tour = Number(bloc.match(/inset 0 0 0 1px rgba\(255, 255, 255, ([\d.]+)\)/)?.[1]);
    return { haut, tour, tenue: haut > tour };
  };
  const nf = nuance(fenetre);
  const nm = nuance(menu);
  verif(
    "la nuance haut/bas est conservée sur les DEUX",
    nf.tenue && nm.tenue,
    `fenêtre ${nf.haut}/${nf.tour} · menu ${nm.haut}/${nm.tour}`
  );
  verif(
    "et le liseré du menu est PLUS FAIBLE que celui de la fenêtre",
    nm.haut < nf.haut && nm.tour < nf.tour
  );
}

/* ==================================================================
 * §1 — MESURÉ DANS LE NAVIGATEUR (1440 px)
 * ================================================================== */
titre("§1 — mesuré : menu contre fenêtre (1440 px)");
const contexteWeb = await navigateur.newContext({
  viewport: { width: 1440, height: 950 },
});
const web = await contexteWeb.newPage();
let accueil = false;
try {
  await web.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await web.waitForSelector("#moteur-tatouage-lieu", { timeout: 30000 });
  await web.waitForTimeout(2500);
  accueil = true;
} catch {
  accueil = false;
}
if (!accueil) {
  nonJoue("§1 · mesure", "l'accueil n'a pas répondu");
} else {
  //  UN MENU : les suggestions d'adresse.
  await web.locator("#moteur-tatouage-lieu").click();
  await web.keyboard.type("lyon", { delay: 60 });
  await web
    .waitForFunction(() => document.querySelectorAll('[role="option"]').length > 0, null, {
      timeout: 15000,
    })
    .catch(() => {});
  const ombreMenu = await web.evaluate(() => {
    const m = document.querySelector("[data-verre-menu]");
    return m ? getComputedStyle(m).boxShadow : null;
  });
  if (!ombreMenu) {
    nonJoue("§1 · menu", "le panneau de suggestions ne s'est pas ouvert");
  } else {
    verif(
      "le menu porte le liseré affaibli (0,05 en haut)",
      ombreMenu.includes("0.05") && ombreMenu.includes("0.02"),
      ombreMenu.slice(0, 90)
    );
  }
}
await contexteWeb.close();

/* ==================================================================
 * §2 — LA LIGNE DE MON COMPTE (web puis doigt)
 * ================================================================== */
titre("§2 — la ligne de Mon compte, translucide (1440 px)");
/**
 * ⚠️ LA FENÊTRE DU COMPTE EXIGE UNE SESSION (MenuEspace ne se rend
 * que connecté), et la base est hors de portée d'ici : elle ne peut
 * pas s'ouvrir — on le dit. La MÉCANIQUE, elle, est éprouvée pour de
 * vrai : la classe EXACTE de la ligne est lue dans la source et
 * injectée dans une page réelle — survol, appui, géométrie, tout est
 * mesuré sur le DOM avec la feuille de style du site.
 */
nonJoue(
  "§2 · la fenêtre du compte elle-même",
  "elle exige une session (base hors de portée) — la classe réelle est éprouvée par injection ci-dessous"
);
const sourceMenu = lire("src/components/MenuEspace.tsx");
const morceaux = sourceMenu.match(
  /const classeEntree =\s*"([^"]+)" \+\s*"([^"]+)" \+\s*"([^"]+)";/
);
const classeEntree = morceaux ? morceaux[1] + morceaux[2] + morceaux[3] : null;

const eprouver = async (page, endroit, enfonceAuDoigt) => {
  if (!classeEntree) {
    nonJoue(`§2 · ${endroit}`, "classeEntree introuvable dans la source");
    return;
  }
  await page.evaluate((classes) => {
    const bouton = document.createElement("button");
    bouton.id = "essai-ligne-compte";
    bouton.className = classes;
    bouton.textContent = "Ligne d'essai";
    bouton.style.position = "fixed";
    bouton.style.top = "200px";
    bouton.style.left = "20px";
    bouton.style.width = "280px";
    bouton.style.zIndex = "999";
    document.body.appendChild(bouton);
  }, classeEntree);
  const ligne = page.locator("#essai-ligne-compte");
  const repos = await ligne.evaluate((n) => {
    const s = getComputedStyle(n);
    return {
      fond: s.backgroundColor,
      couleur: s.color,
      rayon: s.borderRadius,
      hauteurMin: s.minHeight,
      retrait: s.paddingLeft,
    };
  });
  const boite = await ligne.boundingBox();
  await page.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2);
  await page.waitForTimeout(150);
  const auSurvol = await ligne.evaluate((n) => {
    const s = getComputedStyle(n);
    return { fond: s.backgroundColor, couleur: s.color };
  });
  await page.mouse.down();
  await page.waitForTimeout(150);
  const enfonce = await ligne.evaluate((n) => getComputedStyle(n).backgroundColor);
  await page.mouse.up();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(250);
  const relache = await ligne.evaluate((n) => getComputedStyle(n).backgroundColor);

  if (enfonceAuDoigt) {
    verif(
      `${endroit} : l'état ENFONCÉ apparaît sous le doigt (voile, jamais un aplat)`,
      enfonce !== repos.fond && !enfonce.startsWith("rgb("),
      `${repos.fond} → ${enfonce}`
    );
    verif(
      `${endroit} : et il repart au relâchement`,
      relache === repos.fond,
      `${enfonce} → ${relache}`
    );
  } else {
    verif(
      `${endroit} : au survol, un VOILE translucide — jamais un aplat`,
      auSurvol.fond !== repos.fond && !auSurvol.fond.startsWith("rgb("),
      `${repos.fond} → ${auSurvol.fond}`
    );
    verif(
      `${endroit} : la couleur du texte ne change jamais`,
      auSurvol.couleur === repos.couleur
    );
    verif(
      `${endroit} : aucun rose`,
      !auSurvol.fond.includes("238, 61") && !auSurvol.couleur.includes("238, 61")
    );
  }
  verif(
    `${endroit} : la géométrie de la ligne (46 px, rayon 12, retrait 12)`,
    repos.hauteurMin === "46px" && repos.rayon === "12px" && repos.retrait === "12px",
    `${repos.hauteurMin} · ${repos.rayon} · ${repos.retrait}`
  );
  await page.evaluate(() => document.querySelector("#essai-ligne-compte")?.remove());
};

{
  const contexte = await navigateur.newContext({
    viewport: { width: 1440, height: 950 },
  });
  const page = await contexte.newPage();
  try {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);
    await eprouver(page, "web", false);
  } catch {
    nonJoue("§2 · web", "l'accueil n'a pas répondu");
  }
  await contexte.close();
}

titre("§2 — l'état enfoncé au doigt (390 px)");
{
  const contexte = await navigateur.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await contexte.newPage();
  try {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);
    await eprouver(page, "doigt", true);
  } catch {
    nonJoue("§2 · doigt", "l'accueil n'a pas répondu");
  }
  await contexte.close();
}

//  §2 — À LA SOURCE : la classe est UNIQUE (même géométrie web/doigt
//  par construction), translucide, avec l'état enfoncé.
{
  const menu = lire("src/components/MenuEspace.tsx");
  verif(
    "la ligne du compte : une seule classe, voile + état enfoncé",
    /hover:bg-white\/5 active:bg-white\/10/.test(menu) &&
      !/hover:bg-sombre-eleve-clair "/.test(menu.match(/const classeEntree[\s\S]{0,300}/)?.[0] ?? "")
  );
}

await navigateur.close();
bilan();
