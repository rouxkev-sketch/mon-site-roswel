/**
 * TEST PERMANENT — RETOUR DEPUIS UNE FICHE (position + pagination)
 * ----------------------------------------------------------------
 * Reproduit le VRAI parcours utilisateur — page de résultats →
 * défiler la liste → CLIC sur une carte (navigation SPA vers la
 * fiche) → retour — et vérifie que la liste réapparaît EXACTEMENT à
 * la position de la carte cliquée, avec les pages « Voir plus » déjà
 * chargées, sans flash. Deux modes de retour : « back » du navigateur
 * (SPA) et RECHARGEMENT COMPLET du document (cas PWA/plein écran, qui
 * était l'origine du retour « en haut »). Testé sur mobile ET
 * desktop.
 *
 * Ce bug a résisté à plusieurs corrections ; sa cause racine (une
 * valeur de défilement ROGNÉE écrite pendant la transition de
 * navigation, puis restaurée) est désormais couverte ici.
 *
 * Lancement (site en dev sur http://localhost:3000, où la route
 * /artisan/apercu-N rend une fiche fictive sans base) :
 *   node tests/retour-liste.mjs
 * Playwright requis (ou CHEMIN_CHROMIUM pour un binaire précis).
 */
const { chromium } = await import("playwright").catch(
  () => import("/opt/node22/lib/node_modules/playwright/index.mjs")
);

const navigateur = await chromium.launch(
  process.env.CHEMIN_CHROMIUM ? { executablePath: process.env.CHEMIN_CHROMIUM } : {}
);
const BASE = "http://localhost:3000";
const ZONE = 'section[aria-label="Résultats de recherche"] div.overflow-y-auto';
let erreurs = 0;
const nb = (ok, msg) => { console.log(`${ok ? "  OK " : "ÉCHEC"} ${msg}`); if (!ok) erreurs++; };

async function preparerEtOuvrir(page) {
  await page.route("**/rest/v1/**", (r) => r.fulfill({ json: [] }));
  await page.goto(`${BASE}/apercu-artisans/apercu-double`, { waitUntil: "networkidle" });
  const compris = page.locator('button:has-text("J\'ai compris")');
  if (await compris.count()) { await compris.click(); await page.waitForTimeout(150); }
  // Charger la 2e page (« Voir plus ») puis défiler profond
  const vp = page.locator('button:has-text("Voir plus")');
  if (await vp.count()) { await vp.click(); await page.waitForTimeout(250); }
  const zone = page.locator(ZONE);
  await zone.evaluate((el) => el.scrollTo(0, Math.round(el.scrollHeight * 0.6)));
  await page.waitForTimeout(450);
  const voulu = await zone.evaluate((el) => Math.round(el.scrollTop));
  // Clic PAR COORDONNÉES sur une carte visible (comme un vrai doigt,
  // sans scrollIntoView parasite). On vise le lien PHOTO dont le centre
  // est le plus proche du milieu de l'écran ET bien à l'intérieur du
  // viewport (les cartes à photo de couverture sont hautes : la bande
  // fixe d'antan ne convient plus).
  const idx = await page.locator("article").evaluateAll((arts, vh) => {
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < arts.length; i++) {
      const link = arts[i].querySelector('a[href^="/artisan/"]');
      if (!link) continue;
      const r = link.getBoundingClientRect();
      const centre = r.top + r.height / 2;
      if (centre > 80 && centre < vh - 80) {
        const d = Math.abs(centre - vh / 2);
        if (d < bestDist) { bestDist = d; best = i; }
      }
    }
    return best;
  }, page.viewportSize().height);
  const box = await page.locator("article").nth(idx).locator('a[href^="/artisan/"]').first().boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForURL("**/artisan/**", { timeout: 6000 });
  await page.waitForTimeout(500);
  return voulu;
}

async function verifier(page, voulu, label) {
  await page.waitForTimeout(900);
  const pos = await page.locator(ZONE).evaluate((el) => Math.round(el.scrollTop)).catch(() => -1);
  const cartes = await page.locator("article").count();
  nb(cartes === 12, `${label} : pagination « Voir plus » retrouvée (${cartes} cartes)`);
  nb(Math.abs(pos - voulu) <= 4, `${label} : position restaurée (${pos}px ≈ ${voulu}px)`);
}

for (const [largeur, hauteur, nom] of [
  [390, 844, "390 mobile"],
  [430, 932, "430 mobile"],
  [1366, 900, "1366 desktop"],
]) {
  console.log(`\n=== ${nom} ===`);
  // Retour SPA (bouton back du navigateur)
  {
    const ctx = await navigateur.newContext({ viewport: { width: largeur, height: hauteur } });
    const page = await ctx.newPage();
    const voulu = await preparerEtOuvrir(page);
    await page.goBack();
    await verifier(page, voulu, "retour SPA");
    await ctx.close();
  }
  // Retour par RECHARGEMENT COMPLET du document (PWA / plein écran)
  {
    const ctx = await navigateur.newContext({ viewport: { width: largeur, height: hauteur } });
    const page = await ctx.newPage();
    const voulu = await preparerEtOuvrir(page);
    await page.goto(`${BASE}/apercu-artisans/apercu-double`, { waitUntil: "networkidle" });
    await verifier(page, voulu, "retour rechargement complet");
    await ctx.close();
  }
}

await navigateur.close();
console.log(erreurs === 0 ? "\nTOUT EST BON" : `\n${erreurs} PROBLÈME(S)`);
process.exit(erreurs === 0 ? 0 : 1);
