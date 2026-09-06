//  ██ BANC 886 — LA RÉSERVE EST LA HAUTEUR RÉELLE DE SA BARRE ██
//   1. SUR CHAQUE SORTE DE PAGE, au doigt, connecté et déconnecté : la
//      réserve vaut la barre AU PIXEL, et le contenu commence SOUS
//      elle, jamais dessous-dessous.
//   2. L'ARRIVÉE NE CHANGE RIEN : venir d'une page défilée, ou d'une
//      page à barre plus haute (accueil 116 → profil 70), donne la
//      même réserve — elle n'est jamais héritée.
//   3. LE DIAGNOSTIC LE DIT : « réserve N · barre N · écart 0 ».
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = Date.now();
const SLUG = `banc886-${T}`;
const ADMIN = { id: "35000000-0000-4000-8000-000000000886", email: "rouxkev@gmail.com" };
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", [{ ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 886",
    styles: ["blackwork", "realisme"], ville_slug: `lyon-${SLUG}` }]);
  const photos = [];
  for (const [k, style, nature, n] of [[0, "blackwork", "tatouage", 8], [1, "realisme", "flash", 6]]) {
    for (let i = 1; i <= n; i += 1) photos.push({
      id: `6186${k}00${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`,
      tatoueur_id: SLUG, style, rendu: "black", nature,
      url: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`,
      miniature: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`,
      ordre: i, cree_le: "2026-01-01T00:00:00Z" });
  }
  await ranger("photos_tatoueur", photos);
}
const RECHERCHE = "/search?style=blackwork&nature=tatouage";
const attendre = (page, ms) => page.waitForTimeout(ms);
const MESURE = `() => {
  const b = document.querySelector("[data-barre-fixe]");
  const r = document.querySelector("[data-reserve-barre]");
  return {
    y: Math.round(window.scrollY),
    barre: b ? Math.round(b.getBoundingClientRect().height) : null,
    reserve: r ? Math.round(r.getBoundingClientRect().height) : null,
    posee: r ? Number(r.dataset.reservePosee) : null,
    depliee: r ? Number(r.dataset.reserveDepliee) : null,
  };
}`;
const mesurer = (page) => page.evaluate((M) => new Function("return " + M)()(), MESURE);

//  ══ 1 · CHAQUE SORTE DE PAGE, CONNECTÉ ET DÉCONNECTÉ ═══════════════
for (const [qui, session] of [["déconnecté", null], ["connecté", ADMIN]]) {
  const { nav, page } = await ouvrir("doigt", session ? { session } : {});
  try {
    titre(`886 · 1 — doigt ${qui} : la réserve vaut la barre, au pixel`);
    for (const [nom, chemin, repere] of [
      ["accueil", "/", null],
      ["recherche", RECHERCHE, "[data-carte]"],
      ["flashes", "/flash", null],
      ["profil", `/artist/${SLUG}`, null],
      ["portfolio", `/artist/${SLUG}/portfolio`, null],
      ["Ma sélection", "/my-favorites", null],
    ]) {
      await page.goto(`${BASE}${chemin}`, { waitUntil: "domcontentloaded" });
      if (repere) await page.waitForSelector(repere, { timeout: 20000 });
      await attendre(page, 2000);
      const m = await mesurer(page);
      verif(`${nom} : réserve ${m.reserve} = barre ${m.barre}`,
        m.reserve !== null && m.barre !== null && m.reserve === m.barre,
        JSON.stringify(m));
      verif(`… ${nom} : la hauteur annoncée est celle qui est posée`,
        m.posee === m.reserve, `${m.posee} / ${m.reserve}`);
    }
  } catch (e) {
    verif(`déroulement du banc 886 (1 · ${qui})`, false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 2 · L'ARRIVÉE N'HÉRITE RIEN ════════════════════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("886 · 2 — doigt : la réserve d'une page ne vient jamais de la précédente");
    /*  LE PARCOURS DU PROPRIÉTAIRE : une page à GRANDE barre (l'accueil,
        116) légèrement défilée, puis une page à PETITE barre (le profil,
        70). Si la réserve était héritée, le contenu du profil
        commencerait 46 px trop bas — ou, dans l'autre sens, sous la
        barre. Elle doit valoir SA barre, dès la première image. */
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await attendre(page, 2000);
    const surLAccueil = await mesurer(page);
    verif("l'accueil : réserve = barre (116 attendus)",
      surLAccueil.reserve === surLAccueil.barre, JSON.stringify(surLAccueil));
    await page.mouse.wheel(0, 120);
    await attendre(page, 400);
    await page.evaluate(() => window.scrollTo({ top: 31, left: 0, behavior: "instant" }));
    await attendre(page, 400);
    await page.evaluate(() => document.querySelector('[data-lien-carte][href^="/search"]')?.click());
    await page.waitForFunction(() => location.pathname === "/search", null, { timeout: 20000 });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1500);
    const surLaRecherche = await mesurer(page);
    verif("… la recherche : réserve = barre, arrivée depuis un accueil défilé",
      surLaRecherche.reserve === surLaRecherche.barre, JSON.stringify(surLaRecherche));
    verif("… et ce n'est PAS la réserve de l'accueil",
      surLaRecherche.reserve !== surLAccueil.reserve,
      `${surLAccueil.reserve} → ${surLaRecherche.reserve}`);
    await page.evaluate((s) => document.querySelector(`[data-lien-profil-de-fil][href*="${s}"]`)?.click(), SLUG);
    await page.waitForFunction(() => location.pathname.startsWith("/artist/"), null, { timeout: 20000 });
    await attendre(page, 1500);
    const surLeProfil = await mesurer(page);
    verif("… le profil : réserve = barre, et l'arrivée est à zéro",
      surLeProfil.reserve === surLeProfil.barre && surLeProfil.y === 0,
      JSON.stringify(surLeProfil));
  } catch (e) {
    verif("déroulement du banc 886 (2 · héritage)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 3 · LE DIAGNOSTIC LE DIT ═══════════════════════════════════════
{
  const { nav, page } = await ouvrir("doigt", { session: ADMIN });
  try {
    titre("886 · 3 — doigt : le bandeau annonce la réserve et la barre");
    await page.goto(`${BASE}${RECHERCHE}&diag=1`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-diagnostic]", { timeout: 20000 });
    await attendre(page, 1500);
    const texte = await page.evaluate(() => document.querySelector("[data-diagnostic]")?.textContent ?? "");
    verif("le bandeau porte « réserve / barre »", texte.includes("réserve / barre"));
    verif("… et il annonce un écart nul", /écart 0 \(juste\)/.test(texte),
      texte.slice(texte.indexOf("réserve /"), texte.indexOf("réserve /") + 110));
  } catch (e) {
    verif("déroulement du banc 886 (3 · diagnostic)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

process.exit(bilan());
