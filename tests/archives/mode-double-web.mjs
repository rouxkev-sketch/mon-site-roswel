/**
 * TEST PERMANENT — MODE DOUBLE SUR ÉCRANS WEB
 * -------------------------------------------
 * Deux garanties, aux largeurs web 1024 / 1280 / 1366 / 1440 px :
 *
 *  1. LE CONTOUR DES CARTES FAIT LE TOUR COMPLET (régression déjà vue
 *     puis réapparue) — la zone de liste défile en masquant le débord
 *     horizontal (overflow-x « auto ») ; sans un petit retrait, le
 *     liseré DROIT des cartes tombait pile sur le bord de coupe et
 *     disparaissait. On vérifie que les quatre bords portent bien un
 *     liseré de 1 px ET que les bords gauche/droit de chaque carte
 *     restent À L'INTÉRIEUR de la zone (jamais rognés).
 *
 *  2. LES DEUX COLONNES SONT FLUIDES (≥ 1024 px) : la fiche n'est jamais
 *     plus étroite que la liste, et le rapport liste/fiche reste celui du
 *     web (480/660 ≈ 42,1 % / 57,9 %) à TOUTES les largeurs — plus de
 *     plafond 540 px ni de saut de palier. À partir du plafond (~1192 px)
 *     les colonnes atteignent leur taille maximale : liste 480 px + fiche
 *     660 px (~1160 px de colonnes, centrées).
 *
 * Lancement (site en dev sur http://localhost:3000) :
 *   node tests/mode-double-web.mjs
 */
const { chromium } = await import("playwright").catch(
  () => import("/opt/node22/lib/node_modules/playwright/index.mjs")
);

const navigateur = await chromium.launch(
  process.env.CHEMIN_CHROMIUM ? { executablePath: process.env.CHEMIN_CHROMIUM } : {}
);
const BASE = "http://localhost:3000";
let erreurs = 0;
const nb = (ok, msg) => { console.log(`${ok ? "  OK " : "ÉCHEC"} ${msg}`); if (!ok) erreurs++; };

for (const largeur of [1024, 1280, 1366, 1440]) {
  console.log(`\n=== ${largeur}px ===`);
  const ctx = await navigateur.newContext({ viewport: { width: largeur, height: 900 } });
  const page = await ctx.newPage();
  await page.route("**/rest/v1/**", (r) => r.fulfill({ json: [] }));
  // apercu-double-fiche : colonne liste (cartes) À GAUCHE + fiche À DROITE
  await page.goto(`${BASE}/apercu-artisans/apercu-double-fiche`, { waitUntil: "networkidle" });
  const compris = page.locator('button:has-text("J\'ai compris")');
  if (await compris.count()) { await compris.click(); await page.waitForTimeout(120); }

  const g = await page.evaluate(() => {
    const zone = document.querySelector('section[aria-label="Résultats de recherche"] div.overflow-y-auto');
    const listeCol = document.querySelector('section[aria-label="Résultats de recherche"]');
    const ficheWrap = document.querySelector('section[aria-label="Fiche de l\'artisan"]')?.parentElement;
    const zr = zone.getBoundingClientRect();
    const clipLeft = zr.left;
    const clipRight = zr.left + zone.clientWidth;
    const cartes = [...document.querySelectorAll("article")].map((a) => {
      const cs = getComputedStyle(a);
      const r = a.getBoundingClientRect();
      return {
        ecartG: Math.round(r.left - clipLeft),
        ecartD: Math.round(clipRight - r.right),
        bords: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth],
      };
    });
    const rw = (el) => (el ? Math.round(el.getBoundingClientRect().width) : null);
    return {
      nbCartes: cartes.length,
      pireEcartG: Math.min(...cartes.map((c) => c.ecartG)),
      pireEcartD: Math.min(...cartes.map((c) => c.ecartD)),
      tousLes4Bords: cartes.every((c) => c.bords.every((b) => b === "1px")),
      liste: rw(listeCol),
      fiche: rw(ficheWrap),
    };
  });

  nb(g.nbCartes > 0, `${largeur} : cartes présentes (${g.nbCartes})`);
  nb(g.tousLes4Bords, `${largeur} : liseré de 1 px sur les 4 côtés de chaque carte`);
  nb(g.pireEcartG >= 1, `${largeur} : bord GAUCHE des cartes non rogné (marge ${g.pireEcartG}px)`);
  nb(g.pireEcartD >= 1, `${largeur} : bord DROIT des cartes non rogné (marge ${g.pireEcartD}px)`);

  nb(g.fiche >= g.liste, `${largeur} : fiche (${g.fiche}px) jamais plus étroite que la liste (${g.liste}px)`);
  // Colonnes FLUIDES (≥ 1024 px) : le rapport fiche / (liste + fiche) reste
  // ≈ 57,9 % (ratio web 660/1140) à TOUTES les largeurs.
  const ratioFiche = g.fiche / (g.liste + g.fiche);
  nb(Math.abs(ratioFiche - 660 / 1140) <= 0.02, `${largeur} : rapport liste/fiche = ratio web (fiche ${(ratioFiche * 100).toFixed(1)}% ≈ 57,9 %)`);
  // Les colonnes remplissent le contenu disponible (viewport − 2×16 px),
  // PLAFONNÉ à 1160 px — EXACTEMENT comme la page d'accueil.
  const contenuDispo = Math.min(largeur - 32, 1160);
  nb(g.liste + 20 + g.fiche >= contenuDispo * 0.95, `${largeur} : les 2 colonnes remplissent le contenu (${g.liste}+20+${g.fiche} vs ${contenuDispo})`);
  if (largeur >= 1192) {
    // Au plafond commun (1160 de contenu) : liste 480 + fiche 660, comme l'accueil.
    nb(g.liste === 480, `${largeur} : liste = 480 px (plafond 1160) (${g.liste})`);
    nb(g.fiche === 660, `${largeur} : fiche = 660 px (plafond 1160) (${g.fiche})`);
  }

  await ctx.close();
}

await navigateur.close();
console.log(erreurs === 0 ? "\nTOUT EST BON" : `\n${erreurs} PROBLÈME(S)`);
process.exit(erreurs === 0 ? 0 : 1);
