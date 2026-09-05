//  ██ BANC 747 (web) — LES GALERIES SURVIVENT AU RE-RENDU ██
//  ⛔ nº 873 — LE DOIGT NE PASSE PLUS ICI : la page Portfolio du doigt est
//  le fil de galeries (plus de bandes par style, plus de vue photo à
//  ouvrir depuis une vignette) ; le panneau de galeries ne se montre
//  qu'au web, où l'onglet Portfolio est désormais UNE PAGE
//  (/artist/<nom>/portfolio) — le banc y va par son lien.
//  `TeteDeGalerie` vit au module : un re-rendu du panneau ne démonte plus
//  les galeries — mêmes nœuds, mêmes images, défilement et compteurs
//  intacts, aucune photo redemandée.
//  DOIGT : la fiche est re-rendue SANS remontage par un changement
//  d'adresse qui ne change aucun tag (la clé de FicheSelonLAdresse reste
//  la même) ; la preuve du re-rendu est l'effet de FicheSelonLAdresse,
//  qui efface `data-fiche-parametree` quand la requête change.
//  WEB : le déclencheur d'origine — un clic de vignette pose la photo
//  dans le cadre du haut (état de la fiche → re-rendu du panneau).
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const SLUG = `riche-747-${Date.now()}`;
const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
await ranger("tatoueurs", { ...gabarit, id: SLUG, slug: SLUG, nom: "Atelier riche 747", styles: ["blackwork", "realisme"], ville_slug: `lyon-${SLUG}` });
const photos = []; let n = 0;
const serie = (style, rendu, nature, k) => { for (let i = 0; i < k; i++) { n++; photos.push({ id: `${SLUG}-p${n}`, tatoueur_id: SLUG, style, rendu, nature, url: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`, miniature: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`, ordre: n, cree_le: "2026-01-01T00:00:00Z" }); } };
//  nº 873 — trois galeries de TATTOOS : la page Portfolio ne montre que
//  cette catégorie (les flashs ont leur page).
serie("blackwork", "black", "tatouage", 6); serie("blackwork", "color", "tatouage", 5); serie("realisme", "black", "tatouage", 4);
await ranger("photos_tatoueur", photos);

const LECTURE = `(() => {
  const bloc = document.documentElement.dataset.appareil === "mobile" ? "doigt" : "web";
  const gs = [...document.querySelectorAll('[data-galeries="' + bloc + '"] [data-galerie-serie]')];
  const rangee = (g) => { const c = g.querySelector("[data-case-galerie]"); let el = c && c.parentElement; while (el && el !== g) { const o = getComputedStyle(el).overflowX; if (o === "auto" || o === "scroll") return el; el = el.parentElement; } return null; };
  return {
    url: location.pathname + location.search,
    galeries: gs.map((g) => g.getAttribute("data-galerie-serie")),
    memes: window.__gs ? window.__gs.map((g) => document.contains(g)) : null,
    rangeesMemes: window.__rs ? window.__rs.map((r) => document.contains(r)) : null,
    imgsMemes: window.__imgs ? window.__imgs.filter((i) => document.contains(i)).length : null,
    sl: gs.map((g) => { const r = rangee(g); return r ? Math.round(r.scrollLeft) : null; }),
    compteurs: gs.map((g) => (g.querySelector("[data-compteur-galerie]") || {}).textContent),
    parametree: document.documentElement.dataset.ficheParametree ?? null,
    onglet: [...document.querySelectorAll('nav[aria-label="Profile, portfolio or flash"] a')].map((a) => a.textContent.trim() + ":" + (a.getAttribute("aria-current") === "page")).join(" "),
  };
})()`;
const lire_ = (page) => page.evaluate(LECTURE);
const memoriser = (page, offsets) => page.evaluate((o) => {
  const bloc = document.documentElement.dataset.appareil === "mobile" ? "doigt" : "web";
  const gs = [...document.querySelectorAll('[data-galeries="' + bloc + '"] [data-galerie-serie]')];
  const rangee = (g) => { const c = g.querySelector("[data-case-galerie]"); let el = c && c.parentElement; while (el && el !== g) { const s = getComputedStyle(el).overflowX; if (s === "auto" || s === "scroll") return el; el = el.parentElement; } return null; };
  window.__gs = gs; window.__rs = gs.map(rangee); window.__imgs = [...document.querySelectorAll('[data-galeries="' + bloc + '"] img')];
  gs.forEach((g, i) => { const r = rangee(g); if (r) r.scrollLeft = o[i]; });
  return window.__imgs.length;
}, offsets);
const CASE_VISIBLE = `(() => {
  const bloc = document.documentElement.dataset.appareil === "mobile" ? "doigt" : "web";
  const g = document.querySelectorAll('[data-galeries="' + bloc + '"] [data-galerie-serie]')[1];
  const cases = [...g.querySelectorAll("[data-case-galerie]")];
  const r0 = cases[0].getBoundingClientRect(); let el = cases[0].parentElement; let cadre = null;
  while (el && el !== g) { const o = getComputedStyle(el).overflowX; if (o === "auto" || o === "scroll") { cadre = el; break; } el = el.parentElement; }
  const c = cadre.getBoundingClientRect();
  const visible = cases.find((k) => { const r = k.getBoundingClientRect(); return r.left >= c.left - 1 && r.right <= c.right + 1; });
  return visible ? visible.getAttribute("data-case-galerie") : null;
})()`;
const OFFSETS = [150, 300, 450];
const intact = (nom, avant, apres, images) => {
  verif(`${nom} : les trois galeries sont les MÊMES nœuds (rangées et images comprises)`, apres.memes.every(Boolean) && apres.rangeesMemes.every(Boolean) && apres.imgsMemes === 15, `nœuds ${JSON.stringify(apres.memes)} · images ${apres.imgsMemes}/15`);
  verif(`${nom} : le défilement de chaque galerie est intact`, JSON.stringify(apres.sl) === JSON.stringify(avant.sl), `${JSON.stringify(avant.sl)} → ${JSON.stringify(apres.sl)}`);
  verif(`${nom} : les compteurs sont intacts`, JSON.stringify(apres.compteurs) === JSON.stringify(avant.compteurs), `${JSON.stringify(avant.compteurs)} → ${JSON.stringify(apres.compteurs)}`);
  verif(`${nom} : aucune photo redemandée`, images === 0, `${images} requête(s) d'image`);
};

for (const mode of ["web"]) {
  const { nav, page } = await ouvrir(mode);
  const images = [];
  page.on("request", (r) => { if (r.resourceType() === "image") images.push(r.url()); });
  try {
    titre(`747 · ${mode} — le portfolio, trois galeries`);
    await page.goto(`${BASE}/artist/${SLUG}?entree=lien`, { waitUntil: "networkidle" });
    //  nº 873 — l'onglet est un lien vers la page Portfolio.
    await page.locator('nav[aria-label="Profile, portfolio or flash"] a').filter({ hasText: /^Portfolio$/ }).first().click();
    await page.waitForFunction((s) => location.pathname === `/artist/${s}/portfolio`, SLUG, { timeout: 15000 });
    await page.waitForFunction((b) => document.querySelectorAll('[data-galeries="' + b + '"] [data-galerie-serie]').length === 3, mode, { timeout: 15000 });
    await page.waitForTimeout(600);
    const nImages = await memoriser(page, OFFSETS);
    await page.waitForTimeout(700);
    const avant = await lire_(page);
    verif("trois galeries, quinze images, défilées à trois positions distinctes", avant.galeries.length === 3 && nImages === 15 && avant.sl.every((v) => v > 0), `${JSON.stringify(avant.galeries)} · ${JSON.stringify(avant.sl)} · compteurs ${JSON.stringify(avant.compteurs)}`);

    if (mode === "doigt") {
      titre("747 · doigt — un re-rendu de la fiche SANS remontage (adresse qui change, clé identique)");
      images.length = 0;
      await page.evaluate(() => { document.documentElement.dataset.ficheParametree = "banc"; history.replaceState(history.state, "", location.pathname + location.search + "&banc=1"); });
      await page.waitForTimeout(800);
      const apres = await lire_(page);
      verif("preuve du re-rendu : l'effet de FicheSelonLAdresse a effacé la marque", apres.parametree === null && apres.url.includes("banc=1"), `marque ${JSON.stringify(apres.parametree)} · ${apres.url}`);
      intact("re-rendu", avant, apres, images.length);

      titre("747 · doigt — un redimensionnement de la fenêtre");
      images.length = 0;
      await page.setViewportSize({ width: 390, height: 780 });
      await page.waitForTimeout(800);
      intact("redimensionnement", avant, await lire_(page), images.length);

      titre("747 · doigt — la vue photo, puis le retour (la mémoire du doigt, nº 459)");
      const rangDoigt = await page.evaluate(CASE_VISIBLE);
      verif("une case de la seconde galerie est entièrement visible (on ne fait pas défiler avant le geste)", rangDoigt !== null, `case ${rangDoigt}`);
      await page.locator('[data-galeries="doigt"] [data-galerie-serie]').nth(1).locator(`[data-case-galerie="${rangDoigt}"] button`).tap();
      await page.waitForFunction(() => /photo=/.test(location.search), null, { timeout: 15000 });
      await page.waitForTimeout(800);
      const vuePhoto = await lire_(page);
      verif("le tap navigue vers la vue photo de la série touchée (vrai démontage des galeries)", /style=blackwork&rendu=color&nature=tatouage&photo=/.test(vuePhoto.url) && vuePhoto.galeries.length === 0, vuePhoto.url);
      await page.goBack();
      await page.waitForFunction(() => document.querySelectorAll('[data-galeries="doigt"] [data-galerie-serie]').length === 3, null, { timeout: 15000 });
      await page.waitForTimeout(1000);
      const retour = await lire_(page);
      verif("le retour rend le portfolio et ses trois galeries", retour.galeries.length === 3 && /Portfolio:true/.test(retour.onglet), retour.onglet);
      verif("la mémoire du doigt rend le défilement des galeries", JSON.stringify(retour.sl) === JSON.stringify(avant.sl), `${JSON.stringify(avant.sl)} → ${JSON.stringify(retour.sl)}`);
    } else {
      titre("747 · web — le déclencheur d'origine : un clic de vignette re-rend le panneau");
      images.length = 0;
      const rangWeb = await page.evaluate(CASE_VISIBLE);
      verif("une case de la seconde galerie est entièrement visible (on ne fait pas défiler avant le geste)", rangWeb !== null, `case ${rangWeb}`);
      await page.locator('[data-galeries="web"] [data-galerie-serie]').nth(1).locator(`[data-case-galerie="${rangWeb}"] button`).click();
      await page.waitForTimeout(900);
      const apres = await lire_(page);
      verif("la fiche reste sur le portfolio (aucune navigation) et la photo touchée est demandée au cadre du haut", apres.galeries.length === 3 && /Portfolio:true/.test(apres.onglet), `${apres.url} · ${apres.onglet}`);
      intact("clic de vignette", avant, apres, images.length);
    }
  } catch (e) {
    verif(`déroulement du banc 747 · ${mode}`, false, String(e).slice(0, 300));
  } finally {
    await nav.close();
  }
}
process.exit(bilan());
