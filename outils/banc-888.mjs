//  ██ BANC 888 — LE DÉPART À ZÉRO PARTOUT, LA GARDE À TROIS SECONDES ██
//   1. LA REMISE À ZÉRO DE L'ORIGINE joue sur TOUTE navigation dont la
//      page de départ est sous le seuil : cartes de style de l'accueil,
//      cartes du fil, onglets d'un profil, logo. Et elle est
//      INSTANTANÉE — aucune animation avant le départ.
//   2. ELLE S'ÉCRIT, et son abstention aussi, AVEC SA RAISON.
//   3. LA GARDE D'ARRIVÉE tient trois secondes, et cède au doigt.
//   4. CHAQUE RECALAGE ANNULÉ dit d'où il vient (navigateur ou site).
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = Date.now();
const SLUG = `banc888-${T}`;
const ADMIN = { id: "37000000-0000-4000-8000-000000000888", email: "rouxkev@gmail.com" };
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", [{ ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 888",
    styles: ["blackwork", "realisme", "trash-polka"], ville_slug: `lyon-${SLUG}` }]);
  const photos = [];
  for (const [k, style, nature, n] of [
    [0, "blackwork", "tatouage", 8], [1, "realisme", "flash", 6], [2, "realisme", "tatouage", 6],
  ]) {
    for (let i = 1; i <= n; i += 1) photos.push({
      id: `6488${k}00${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`,
      tatoueur_id: SLUG, style, rendu: "black", nature,
      url: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`,
      miniature: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`,
      ordre: i, cree_le: "2026-01-01T00:00:00Z" });
  }
  await ranger("photos_tatoueur", photos);
}
const RECHERCHE = "/search?style=blackwork&nature=tatouage";
const ONGLETS = '[aria-label="Profile, portfolio or flash"] a, [aria-label="Profile, portfolio or flash"] button';
const attendre = (page, ms) => page.waitForTimeout(ms);
const ou = (page) => page.evaluate(() => Math.round(window.scrollY));
const recaler = (page, y) =>
  page.evaluate((v) => window.scrollTo({ top: v, left: 0, behavior: "instant" }), y);
async function defiler(page, y) {
  await page.mouse.wheel(0, Math.max(80, y));
  await attendre(page, 350);
  await page.evaluate((v) => window.scrollTo({ top: v, left: 0, behavior: "instant" }), y);
  await attendre(page, 400);
  return ou(page);
}
/*  CLIQUER ET LIRE LA POSITION DANS LA MÊME TÂCHE : c'est ainsi qu'on
    prouve l'INSTANTANÉITÉ (§4). Si la remise à zéro s'animait, la
    lecture qui suit le clic verrait encore la position de départ. */
const cliquerEtLire = (page, selecteur, texte = null) => page.evaluate(([s, t]) => {
  const tous = [...document.querySelectorAll(s)];
  const cible = t ? tous.find((n) => n.textContent.trim() === t) : tous[0];
  if (!cible) return { trouve: false };
  const avant = Math.round(window.scrollY);
  cible.click();
  return { trouve: true, avant, apres: Math.round(window.scrollY) };
}, [selecteur, texte]);

//  ══ 1 · TOUTES LES SORTES DE DÉPARTS ═══════════════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("888 · 1 — doigt : la carte de STYLE de l'accueil remet l'origine à zéro");
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-lien-carte][href^="/search"]', { timeout: 20000 });
    await attendre(page, 1800);
    verif("l'accueil est descendu de 39 px", (await defiler(page, 39)) === 39);
    const carte = await cliquerEtLire(page, '[data-lien-carte][href^="/search"]');
    verif("… le clic la remet à zéro DANS LA MÊME TÂCHE (instantané)",
      carte.trouve && carte.apres === 0, JSON.stringify(carte));
    await page.waitForFunction(() => location.pathname === "/search", null, { timeout: 20000 });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1500);
    verif("… et la recherche s'ouvre à zéro", (await ou(page)) === 0, String(await ou(page)));

    titre("888 · 1 — doigt : la carte du FIL remet l'origine à zéro");
    verif("le fil est descendu de 39 px", (await defiler(page, 39)) === 39);
    const fil = await cliquerEtLire(page, `[data-lien-profil-de-fil][href*="${SLUG}"]`);
    verif("… le clic la remet à zéro, instantanément",
      fil.trouve && fil.apres === 0, JSON.stringify(fil));
    await page.waitForFunction(() => location.pathname.startsWith("/artist/"), null, { timeout: 20000 });
    await attendre(page, 1500);
    verif("… et le profil s'ouvre à zéro", (await ou(page)) === 0, String(await ou(page)));

    titre("888 · 1 — doigt : l'ONGLET d'un profil aussi");
    await page.evaluate(([s]) => {
      const c = [...document.querySelectorAll(s)].find((n) => n.textContent.trim() === "Portfolio");
      if (c) c.click();
    }, [ONGLETS]);
    await page.waitForFunction(() => location.pathname.endsWith("/portfolio"), null, { timeout: 20000 });
    await attendre(page, 1500);
    verif("la galerie est descendue de 39 px", (await defiler(page, 39)) === 39);
    const onglet = await cliquerEtLire(page, ONGLETS, "Flash");
    verif("… le toucher de l'onglet remet à zéro, instantanément",
      onglet.trouve && onglet.apres === 0, JSON.stringify(onglet));
    await attendre(page, 1500);
    verif("… et l'onglet Flash s'ouvre à zéro", (await ou(page)) === 0, String(await ou(page)));

    titre("888 · 1 — doigt : au-dessus du seuil, on ne touche à rien");
    await page.goto(`${BASE}${RECHERCHE}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1800);
    verif("le fil est descendu de 400 px", (await defiler(page, 400)) === 400);
    const grand = await cliquerEtLire(page, `[data-lien-profil-de-fil][href*="${SLUG}"]`);
    verif("… la place de 400 px est laissée telle quelle",
      grand.trouve && grand.apres === 400, JSON.stringify(grand));
  } catch (e) {
    verif("déroulement du banc 888 (1 · départs)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 2 · LE JOURNAL DIT OUI, ET IL DIT NON AVEC SA RAISON ═══════════
{
  const { nav, page } = await ouvrir("doigt", { session: ADMIN });
  try {
    titre("888 · 2 — doigt : le journal porte la remise à zéro, et ses abstentions");
    await page.goto(`${BASE}/?diag=1`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-diagnostic]", { timeout: 20000 });
    await page.waitForSelector('[data-lien-carte][href^="/search"]', { timeout: 20000 });
    await attendre(page, 1500);
    await defiler(page, 39);
    await page.evaluate(() => document.querySelector('[data-lien-carte][href^="/search"]').click());
    await page.waitForFunction(() => location.pathname === "/search", null, { timeout: 20000 });
    await attendre(page, 1500);
    const texte = await page.evaluate(() => document.querySelector("[data-diagnostic]")?.textContent ?? "");
    verif("le journal porte « DÉPART À ZÉRO · la page quittée passe de 39 à 0 »",
      /DÉPART À ZÉRO · la page quittée passe de 39 à 0/.test(texte),
      texte.slice(texte.indexOf("DÉPART À ZÉRO"), texte.indexOf("DÉPART À ZÉRO") + 100));
    //  ET L'ABSTENTION, AVEC SA RAISON : la loupe ne navigue pas.
    await attendre(page, 600);
    await page.evaluate(() => document.querySelector('[aria-label="Search"]')?.click());
    await attendre(page, 800);
    const apres = await page.evaluate(() => document.querySelector("[data-diagnostic]")?.textContent ?? "");
    verif("… et l'abstention est écrite avec sa raison",
      /DÉPART À ZÉRO · non — /.test(apres),
      apres.slice(apres.indexOf("DÉPART À ZÉRO · non"), apres.indexOf("DÉPART À ZÉRO · non") + 90));
  } catch (e) {
    verif("déroulement du banc 888 (2 · journal)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 3 · LA GARDE TIENT TROIS SECONDES, ET DIT D'OÙ VIENT L'ÉCART ═══
{
  const { nav, page } = await ouvrir("doigt", { session: ADMIN });
  try {
    titre("888 · 3 — doigt : trois secondes de garde, et l'origine de chaque recalage");
    await page.goto(`${BASE}/artist/${SLUG}?diag=1`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-diagnostic]", { timeout: 20000 });
    await page.waitForSelector(ONGLETS, { timeout: 20000, state: "attached" });
    await attendre(page, 1800);
    await page.evaluate(([s]) => {
      const c = [...document.querySelectorAll(s)].find((n) => n.textContent.trim() === "Portfolio");
      if (c) c.click();
    }, [ONGLETS]);
    await page.waitForFunction(() => location.pathname.endsWith("/portfolio"), null, { timeout: 20000 });
    await attendre(page, 1500);
    await recaler(page, 39);
    await attendre(page, 400);
    verif("un recalage à 1,5 s est repris", (await ou(page)) === 0, String(await ou(page)));
    await attendre(page, 900);
    await recaler(page, 39);
    await attendre(page, 400);
    verif("… un autre à 2,8 s aussi (la garde tient trois secondes)",
      (await ou(page)) === 0, String(await ou(page)));
    const texte = await page.evaluate(() => document.querySelector("[data-diagnostic]")?.textContent ?? "");
    verif("… et le journal dit d'où vient le recalage",
      /RECALAGE ANNULÉ nº \d+ .*(LE NAVIGATEUR|script)/.test(texte),
      texte.slice(texte.indexOf("RECALAGE ANNULÉ"), texte.indexOf("RECALAGE ANNULÉ") + 120));
    await attendre(page, 1800);
    await recaler(page, 39);
    await attendre(page, 600);
    verif("… et passé les trois secondes, la garde a rendu la main",
      (await ou(page)) === 39, String(await ou(page)));
  } catch (e) {
    verif("déroulement du banc 888 (3 · garde)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

process.exit(bilan());
