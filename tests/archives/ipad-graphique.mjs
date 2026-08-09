/**
 * TEST PERMANENT — GRAPHISME iPad (barre de défilement + fiche continue)
 * ---------------------------------------------------------------------
 * Deux bugs constatés en « mode responsive iPad » de Safari :
 *
 *   1. BARRE DE DÉFILEMENT STATIQUE — sur la page de résultats en
 *      largeur iPad, une barre grise restait affichée en permanence.
 *      Elle ne doit JAMAIS être visible, à AUCUNE largeur : la liste
 *      défile à l'intérieur de sa zone, sans barre de document, et les
 *      conteneurs défilants masquent leur barre (scrollbar-width:none).
 *
 *   2. FICHE ARTISAN COUPÉE EN DEUX — sur la page fiche SEULE (hors
 *      mode double), la fiche s'arrêtait au milieu puis le pied de page
 *      et le bandeau contact réapparaissaient plus bas, séparés par une
 *      grande zone blanche. La fiche doit être UN SEUL bloc continu
 *      jusqu'en bas : contour englobant tout jusqu'au bandeau contact
 *      intégré (soudé), défilement à l'intérieur du bloc, comme sur
 *      smartphone. Le document, lui, ne défile pas.
 *
 * Largeurs couvertes : 700 (smartphone étiré, même charte depuis la
 *   bascule à 560 px), 768, 834 (colonne fiche autonome) et 1024, 1194
 * (mode double colonnes) — exactement les largeurs iPad demandées.
 *
 * Lancement (site en dev sur http://localhost:3000) :
 *   node tests/ipad-graphique.mjs
 * Playwright requis (ou CHEMIN_CHROMIUM pour un binaire précis).
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

async function nouvellePage(largeur, hauteur) {
  const ctx = await navigateur.newContext({ viewport: { width: largeur, height: hauteur } });
  const page = await ctx.newPage();
  await page.route("**/rest/v1/**", (r) => r.fulfill({ json: [] }));
  return { ctx, page };
}
async function fermerBandeau(page) {
  const compris = page.locator('button:has-text("J\'ai compris")');
  if (await compris.count()) { await compris.click(); await page.waitForTimeout(150); }
}

// 560 et 700 = smartphone étiré (560–767) : depuis la bascule à
// 560 px, il
// affiche la MÊME présentation que la tablette et le web — c'est donc
// exactement le même contrat qui doit tenir (bloc autonome, contour
// englobant, plus de bandeau contact fixe).
// iPad : 768 / 834 = colonne fiche autonome ; 1024 / 1194 = mode double
const LARGEURS = [
  [560, 1024],
  [700, 1024],
  [768, 1024],
  [834, 1194],
  [1024, 768],
  [1194, 834],
];

// ── BUG 1 : aucune barre de défilement visible sur la page résultats ──
for (const [largeur, hauteur] of LARGEURS) {
  console.log(`\n=== Résultats ${largeur}×${hauteur} ===`);
  const { ctx, page } = await nouvellePage(largeur, hauteur);
  await page.goto(`${BASE}/apercu-artisans/apercu-double`, { waitUntil: "networkidle" });
  await fermerBandeau(page);
  const g = await page.evaluate(() => {
    const zone = document.querySelector(
      'section[aria-label="Résultats de recherche"] div.overflow-y-auto'
    );
    return {
      docBarre: window.innerWidth - document.documentElement.clientWidth,
      zonePresente: !!zone,
      zoneDefile: zone ? zone.scrollHeight > zone.clientHeight + 1 : false,
      zoneBarre: zone ? getComputedStyle(zone).scrollbarWidth : "?",
      corpsBarre: getComputedStyle(document.body).scrollbarWidth,
    };
  });
  // La zone doit bien défiler pour de vrai
  await page.evaluate(() => {
    const z = document.querySelector(
      'section[aria-label="Résultats de recherche"] div.overflow-y-auto'
    );
    if (z) z.scrollTo(0, 320);
  });
  const st = await page.evaluate(() =>
    document.querySelector('section[aria-label="Résultats de recherche"] div.overflow-y-auto')?.scrollTop ?? 0
  );
  nb(g.docBarre === 0, `${largeur} : aucune barre de défilement de document (réserve ${g.docBarre}px)`);
  nb(g.zonePresente && g.zoneDefile, `${largeur} : la liste défile dans sa zone interne`);
  // RENVERSEMENT ASSUMÉ : la règle « jamais d'ascenseur affiché, à
  // aucune largeur » ne vaut plus en COLONNE UNIQUE (768–1023 px). Le
  // propriétaire a demandé que la barre y soit VISIBLE : sur cette
  // plage, la page n'affiche qu'une seule colonne et rien n'indiquait
  // qu'il restait du contenu plus bas. Dès 1024 px (deux colonnes),
  // elle reste masquée — deux barres côte à côte alourdiraient l'écran.
  // Uniquement de 768 à 1023 : sous 768 (smartphone), la barre reste
  // masquée comme avant — le périmètre de la demande était le web.
  const barreAttendue = largeur >= 768 && largeur < 1024 ? "thin" : "none";
  nb(g.zoneBarre === barreAttendue,
     `${largeur} : barre de la zone ${barreAttendue === "thin" ? "VISIBLE" : "masquée"} (scrollbar-width=${g.zoneBarre})`);
  nb(st > 280, `${largeur} : défilement interne effectif (${st}px)`);
  await ctx.close();
}

// ── BUG 2 : la fiche seule est un bloc continu jusqu'au bandeau contact ──
for (const [largeur, hauteur] of LARGEURS) {
  console.log(`\n=== Fiche seule ${largeur}×${hauteur} ===`);
  const { ctx, page } = await nouvellePage(largeur, hauteur);
  await page.goto(`${BASE}/artisan/apercu-1`, { waitUntil: "networkidle" });
  await fermerBandeau(page);
  const g = await page.evaluate(() => {
    const section = document.querySelector('section[aria-label="Fiche de l\'artisan"]');
    const wrap = section?.parentElement ?? null;
    const barre = document.querySelector('div[class*="bottom-0"]');
    // Le calque de contour ne porte plus « rounded-3xl » : depuis que la
    // fiche adopte la charte web DÈS 560 px, il n'existe qu'à partir de
    // cette largeur et n'a donc plus qu'un seul rayon — « rounded-2xl »
    // (16 px), celui des cartes de résultats.
    const contour = wrap?.querySelector('div[aria-hidden][class*="rounded-2xl"]') ?? null;
    const r = (el) => (el ? { top: Math.round(el.getBoundingClientRect().top), bottom: Math.round(el.getBoundingClientRect().bottom) } : null);
    // Boutons Appeler / WhatsApp RÉELLEMENT visibles (rendus dans le
    // contenu de la fiche à partir de 1024 px après la refonte).
    const liensContact = [
      ...document.querySelectorAll('a[aria-label^="Appeler"], a[aria-label*="WhatsApp"]'),
    ].filter((a) => a.getClientRects().length > 0);
    return {
      vp: window.innerHeight,
      docBarre: window.innerWidth - document.documentElement.clientWidth,
      bodyDefile: document.body.scrollHeight > window.innerHeight + 1,
      bodyOverflow: getComputedStyle(document.body).overflowY,
      wrap: r(wrap),
      barre: r(barre),
      barrePos: barre ? getComputedStyle(barre).position : "?",
      barreAffichee: barre ? getComputedStyle(barre).display !== "none" : false,
      liensContactVisibles: liensContact.length,
      contourVisible: contour ? getComputedStyle(contour).display !== "none" : false,
      // La fiche est un CONTENEUR de défilement interne (elle défile en
      // elle-même si son contenu dépasse ; sinon elle tient, ce qui est
      // aussi correct). On vérifie l'architecture, pas un débordement.
      sectionScroll: section ? getComputedStyle(section).overflowY : "?",
    };
  });
  const margeBasse = g.wrap ? g.vp - g.wrap.bottom : 999;
  // RETOUR À LA RÈGLE COMMUNE — la parenthèse « c'est la PAGE qui défile
  // de 768 à 1023 px » est refermée : cette plage se comporte de nouveau
  // comme les deux autres présentations (480–767 et ≥ 1024), c'est-à-dire
  // un CADRE FIXE dont seul le contenu défile. C'est ce qui garantit que
  // le bas de l'encadré est toujours à l'écran, contour et marge compris.
  const pageDefilante = false;
  if (pageDefilante) {
    nb(g.bodyOverflow === "visible", `${largeur} : la PAGE défile (overflow=${g.bodyOverflow})`);
    nb(g.wrap.bottom > g.vp - 1, `${largeur} : le bloc se prolonge sous la fenêtre (bas ${g.wrap.bottom} > ${g.vp})`);
  } else {
    nb(g.bodyOverflow === "hidden" && !g.bodyDefile, `${largeur} : le document ne défile pas (overflow=${g.bodyOverflow})`);
    nb(g.docBarre === 0, `${largeur} : aucune barre de défilement de document (réserve ${g.docBarre}px)`);
    // RENVERSEMENT ASSUMÉ — dès 1024 px (deux colonnes), le PIED DE PAGE
    // est sorti de l'encadré et se pose SOUS lui : la marge basse du bloc
    // ne vaut donc plus 16 px, elle vaut la place du pied de page. Ce qui
    // compte reste vérifié : le bloc s'arrête AVANT le bas de la fenêtre,
    // et l'ensemble (encadré + pied de page) tient dans la hauteur.
    const plafondMarge = largeur >= 1024 ? 96 : 40;
    nb(
      margeBasse >= 8 && margeBasse <= plafondMarge,
      `${largeur} : le bloc va jusqu'en bas, pied de page compris (marge basse ${margeBasse}px)`
    );
  }
  if (largeur < 560) {
    // < 560 (téléphone tenu en main) : bandeau contact SOUDÉ au bas du
    // bloc (dans le contour), collant — inchangé.
    // Le seuil était 768, puis 640 : il est à 560 depuis que la fiche a
    // adopté la charte web dès cette largeur.
    const barreDansBloc = g.barre && g.wrap && g.barre.bottom <= g.wrap.bottom + 2 && g.barre.top >= g.wrap.top;
    nb(barreDansBloc, `${largeur} : bandeau contact intégré au bloc (bas ${g.barre?.bottom} ≤ ${g.wrap?.bottom})`);
    nb(g.barrePos === "sticky", `${largeur} : bandeau contact collant dans le bloc (${g.barrePos})`);
  } else {
    // ≥ 560 (composant UNIFIÉ smartphone étiré + tablette + web) : plus
    // de bandeau contact fixe — Appeler / WhatsApp sont REMONTÉS dans le
    // contenu, à côté des encadrés Google et Instagram.
    nb(!g.barreAffichee, `${largeur} : plus de bandeau contact fixe (refonte ≥ 560)`);
    nb(g.liensContactVisibles >= 1, `${largeur} : Appeler / WhatsApp remontés dans le contenu (${g.liensContactVisibles})`);
  }
  nb(g.contourVisible, `${largeur} : contour englobant visible`);
  nb(g.sectionScroll === (pageDefilante ? "visible" : "auto"),
     `${largeur} : la fiche ${pageDefilante ? "n'est PLUS un conteneur défilant" : "est un conteneur de défilement interne"} (${g.sectionScroll})`);
  await ctx.close();
}

// ── NON-RÉGRESSION smartphone (<480) : inchangé (document défile, barre fixe, pas de contour) ──
{
  console.log(`\n=== Non-régression smartphone 390×844 ===`);
  const { ctx, page } = await nouvellePage(390, 844);
  await page.goto(`${BASE}/artisan/apercu-1`, { waitUntil: "networkidle" });
  await fermerBandeau(page);
  const g = await page.evaluate(() => {
    const barre = document.querySelector('div[class*="bottom-0"]');
    const contour = document.querySelector('div[aria-hidden][class*="rounded-2xl"]');
    return {
      bodyOverflow: getComputedStyle(document.body).overflowY,
      barrePos: barre ? getComputedStyle(barre).position : "?",
      contourVisible: contour ? getComputedStyle(contour).display !== "none" : false,
    };
  });
  nb(g.bodyOverflow !== "hidden", `smartphone : le document défile comme avant (overflow=${g.bodyOverflow})`);
  nb(g.barrePos === "fixed", `smartphone : bandeau contact fixe comme avant (${g.barrePos})`);
  nb(!g.contourVisible, `smartphone : pas de contour de colonne (plein écran)`);
  await ctx.close();
}

await navigateur.close();
console.log(erreurs === 0 ? "\nTOUT EST BON" : `\n${erreurs} PROBLÈME(S)`);
process.exit(erreurs === 0 ? 0 : 1);
