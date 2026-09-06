//  ██ BANC 885 — LE DÉPART À ZÉRO, ET L'AVALEMENT QUI NE TUE PLUS ██
//   1. ON QUITTE UNE PAGE À ZÉRO quand elle n'était descendue que de
//      quelques pixels : l'entrée d'historique naît en haut, il n'y a
//      plus rien à restituer — et la garde de l'arrivée n'a plus une
//      seule pose à faire. Au-delà du plafond, RIEN NE CHANGE : une
//      vraie place reste une vraie place, et le retour la rend.
//   2. L'AVALEMENT DE LA GARDE DES NAVIGATIONS est borné : un second
//      toucher du même lien passe après une seconde et demie, au lieu
//      de mourir pendant douze secondes.
//   3. LE DIAGNOSTIC ÉCRIT LES TROIS JOURNAUX DEMANDÉS : les clics
//      (capture et bulle), les appels de navigation, et les
//      défilements avec l'état de la garde.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = Date.now();
const SLUG = `banc885-${T}`;
const ADMIN = { id: "33000000-0000-4000-8000-000000000885", email: "rouxkev@gmail.com" };
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", [{ ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 885",
    styles: ["blackwork", "realisme", "trash-polka"], ville_slug: `lyon-${SLUG}` }]);
  const photos = [];
  for (const [k, style, nature, n] of [
    [0, "blackwork", "tatouage", 8], [1, "realisme", "flash", 6], [2, "realisme", "tatouage", 6],
  ]) {
    for (let i = 1; i <= n; i += 1) photos.push({
      id: `5985${k}00${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`,
      tatoueur_id: SLUG, style, rendu: "black", nature,
      url: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`,
      miniature: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`,
      ordre: i, cree_le: "2026-01-01T00:00:00Z" });
  }
  await ranger("photos_tatoueur", photos);
}
const RECHERCHE = "/search?style=blackwork&nature=tatouage";
const attendre = (page, ms) => page.waitForTimeout(ms);
const ou = (page) => page.evaluate(() => Math.round(window.scrollY));
/** LE VISITEUR DÉFILE : la molette d'abord (c'est elle, le geste). */
async function defilerCommeUnVisiteur(page, y) {
  await page.mouse.wheel(0, Math.max(60, y));
  await attendre(page, 350);
  await page.evaluate((v) => window.scrollTo({ top: v, left: 0, behavior: "instant" }), y);
  await attendre(page, 350);
  return ou(page);
}
const cliquer = (page, s) => page.evaluate((x) => {
  const n = document.querySelector(x);
  if (!n) return false;
  n.click();
  return true;
}, s);

//  ══ 1 · LE DÉPART À ZÉRO ═══════════════════════════════════════════
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`885 · 1 — ${mode} : une page quittée sous le plafond part de ZÉRO`);
    /*  LE CAS DU PROPRIÉTAIRE, AU PIXEL PRÈS : la page d'origine est
        descendue de 31 px — au-dessus du plancher des places (24), en
        dessous du plafond des recalages (40). C'est cette bande-là qui
        fabriquait les « quelques pixels » de l'arrivée sur WebKit. */
    await page.goto(`${BASE}${RECHERCHE}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1800);
    const partiDe = await defilerCommeUnVisiteur(page, 31);
    verif("l'origine est bien descendue de 31 px", partiDe === 31, String(partiDe));
    const lien = mode === "doigt"
      ? `[data-lien-profil-de-fil][href*="${SLUG}"]`
      : `[data-lien-carte][href*="${SLUG}"]`;
    /*  ⚠️ ON MESURE LA PAGE QU'ON QUITTE, JUSTE APRÈS LE CLIC : c'est
        LÀ que se joue la neutralisation — l'entrée d'historique de la
        page suivante naît avec la position du moment. */
    await page.evaluate((s) => document.querySelector(s)?.click(), lien);
    const surLOrigine = await ou(page);
    verif("… et le clic la remet à zéro AVANT de partir", surLOrigine === 0,
      String(surLOrigine));
    await page.waitForFunction(() => location.pathname.startsWith("/artist/"), null, { timeout: 20000 })
      .catch(() => {});
    await attendre(page, 1600);
    verif("… l'arrivée est à zéro, comme toujours", (await ou(page)) === 0,
      String(await ou(page)));
    /*  ET LE PRIX, DIT FRANCHEMENT : une page quittée sous le plafond
        n'était pas une place — le retour la rend en haut. C'est déjà
        la règle du site pour tout ce qui est sous le plancher des
        vingt-quatre pixels (nº 875) ; la nº 885 l'étend jusqu'à
        quarante. */
    /*  ⚠️ AU WEB, IL N'Y A PAS DE DÉPART : un clic sur une carte y ouvre
        la FENÊTRE SUPERPOSÉE (nº 506) — la grille reste où elle est,
        derrière le voile, et la refermer la rend à ses 31 px. C'est
        juste : on n'a jamais quitté la page. La règle du départ à zéro
        ne se mesure donc qu'au doigt, où la carte mène à une PAGE. */
    if (mode === "doigt") {
      await page.goBack();
      await attendre(page, 2000);
      verif("… et le retour rend l'origine en haut (31 px n'était pas une place)",
        (await ou(page)) === 0, String(await ou(page)));
    }

    titre(`885 · 1 — ${mode} : au-delà du plafond, une VRAIE place ne bouge pas`);
    await page.goto(`${BASE}${RECHERCHE}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1800);
    const grand = await defilerCommeUnVisiteur(page, 400);
    verif("l'origine est descendue de 400 px", grand === 400, String(grand));
    await page.evaluate((s) => document.querySelector(s)?.click(), lien);
    await page.waitForFunction(() => location.pathname.startsWith("/artist/"), null, { timeout: 20000 })
      .catch(() => {});
    await attendre(page, 1600);
    verif("… et l'arrivée est à zéro quand même", (await ou(page)) === 0,
      String(await ou(page)));
    /*  ⚠️ CE QUI SE MESURE ICI, C'EST LA PLACE RENDUE — pas la position
        à l'instant du clic : au doigt, l'arrivée pose son zéro dans le
        même souffle, et la lecture d'après-clic dirait la DESTINATION.
        La règle vraie, celle que l'œil voit : une page quittée à 400 px
        est une PLACE, et le retour la rend. */
    await page.goBack();
    await attendre(page, 2000);
    const rendue = await ou(page);
    verif("… et le retour rend bien les 400 px (c'est une place)",
      Math.abs(rendue - 400) <= 2, `${rendue} / 400`);
  } catch (e) {
    verif(`déroulement du banc 885 (1 · ${mode})`, false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 2 · L'AVALEMENT NE DURE PLUS DOUZE SECONDES ════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("885 · 2 — doigt : un re-toucher passe après une seconde et demie");
    await page.goto(`${BASE}${RECHERCHE}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1800);
    /*  ON SIMULE LE DÉFAUT DU PROPRIÉTAIRE : une navigation qui ne part
        PAS (le clic est prévenu par un écouteur du banc, comme un
        routeur qui se perd). L'attente reste alors armée — et c'est
        elle qui avalait tout pendant douze secondes. */
    await page.evaluate((s) => {
      const l = document.querySelector(s);
      l.addEventListener("click", (e) => e.preventDefault(), { once: true });
    }, `[data-lien-profil-de-fil][href*="${SLUG}"]`);
    await cliquer(page, `[data-lien-profil-de-fil][href*="${SLUG}"]`);
    await attendre(page, 200);
    verif("la navigation ne s'est pas faite (le défaut est reproduit)",
      !(await page.evaluate(() => location.pathname.startsWith("/artist/"))),
      await page.evaluate(() => location.pathname));
    //  Le re-toucher IMMÉDIAT est avalé : c'est le rôle de la garde.
    const avale = await page.evaluate((s) => {
      const l = document.querySelector(s);
      let vu = false;
      l.addEventListener("click", () => { vu = true; }, { once: true });
      l.click();
      return vu;
    }, `[data-lien-profil-de-fil][href*="${SLUG}"]`);
    verif("un re-toucher immédiat est bien avalé (une seule navigation)",
      avale === false);
    //  DEUX SECONDES PLUS TARD, il passe — et la page part.
    await attendre(page, 1800);
    await cliquer(page, `[data-lien-profil-de-fil][href*="${SLUG}"]`);
    await page.waitForFunction(() => location.pathname.startsWith("/artist/"), null, { timeout: 20000 })
      .catch(() => {});
    verif("… et deux secondes plus tard, le même toucher navigue",
      await page.evaluate(() => location.pathname.startsWith("/artist/")),
      await page.evaluate(() => location.pathname));
  } catch (e) {
    verif("déroulement du banc 885 (2 · avalement)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 3 · LES TROIS JOURNAUX DU DIAGNOSTIC ═══════════════════════════
{
  const { nav, page } = await ouvrir("doigt", { session: ADMIN });
  try {
    titre("885 · 3 — doigt : le diagnostic écrit clics, navigations et défilements");
    await page.goto(`${BASE}${RECHERCHE}&diag=1`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-diagnostic]", { timeout: 20000 });
    await attendre(page, 1500);
    await defilerCommeUnVisiteur(page, 31);
    await page.evaluate((s) => document.querySelector(s)?.click(),
      `[data-lien-profil-de-fil][href*="${SLUG}"]`);
    await page.waitForFunction(() => location.pathname.startsWith("/artist/"), null, { timeout: 20000 })
      .catch(() => {});
    await attendre(page, 1800);
    const texte = await page.evaluate(() => document.querySelector("[data-diagnostic]")?.textContent ?? "");
    for (const [nom, attendu] of [
      ["le clic en capture, avec son lien", "CLIC (capture)"],
      ["le clic en bulle, et qui l'a pris", "CLIC (bulle)"],
      ["les appels de navigation", "PUSHSTATE"],
      ["le changement d'adresse", "ADRESSE ·"],
      ["les défilements, avec l'état de la garde", "DÉFILEMENT ·"],
      ["le départ à zéro de la nº 885", "DÉPART À ZÉRO"],
      ["la garde des navigations, armée", "NAVIGATION ARMÉE"],
      ["… et aboutie", "NAVIGATION ABOUTIE"],
    ]) {
      verif(`le journal porte ${nom}`, texte.includes(attendu),
        attendu === "DÉFILEMENT ·" ? texte.slice(texte.indexOf("DÉFILEMENT"), texte.indexOf("DÉFILEMENT") + 90) : "");
    }
    verif("… et le journal garde quarante lignes",
      /journal \(\d+\/40\)/.test(texte),
      texte.slice(texte.indexOf("journal ("), texte.indexOf("journal (") + 20));
  } catch (e) {
    verif("déroulement du banc 885 (3 · journaux)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

process.exit(bilan());
