//  ██ BANC 732 (web) — LA LECTURE GELÉE HORS DE LA MOSAÏQUE ██
//  La fenêtre de fiche possède l'adresse (/artist/…, pushState brut) : la
//  mosaïque reste montée dessous, rien ne la redemande, et le retour la
//  retrouve telle quelle (nœud, cartes, position).
import { BASE, ouvrir, verif, titre, bilan } from "./banc-socle.mjs";

const MOSAIQUE = "/search?style=blackwork&nature=tatouage";
const { nav, page } = await ouvrir("web");
//  Une fenêtre basse pour que la mosaïque défile.
await page.setViewportSize({ width: 1100, height: 620 });
const journal = [];
page.on("request", (r) => journal.push({ url: r.url().replace(BASE, ""), rsc: r.headers()["rsc"] === "1", nav: r.isNavigationRequest(), frame: r.frame() === page.mainFrame() }));
try {
  titre("732 · la mosaïque, puis une fenêtre par-dessus");
  await page.goto(`${BASE}${MOSAIQUE}`, { waitUntil: "networkidle" });
  const avant = await page.evaluate(() => {
    window.__mos = document.querySelector("[data-mosaique]");
    window.__grille = document.querySelector("[data-grille-tatoueurs]");
    window.__cartes = document.querySelectorAll('[data-lien-carte][href^="/artist/"]').length;
    return { cartes: window.__cartes, hauteur: document.scrollingElement.scrollHeight, fenetre: innerHeight };
  });
  //  UN VRAI DÉFILEMENT (molette), puis une carte ENTIÈREMENT visible :
  //  cliquer une carte à moitié hors de l'écran la ferait défiler dans
  //  la vue avant le clic, et la position capturée ne serait plus celle
  //  d'avant — un artefact de banc, pas un défaut.
  journal.length = 0;
  const carte = page.locator('[data-lien-carte][href^="/artist/"]').nth(4);
  await carte.scrollIntoViewIfNeeded();
  await page.mouse.move(500, 400);
  await page.waitForTimeout(800);
  const defile = await page.evaluate(() => window.scrollY);
  //  Le NOMBRE de cartes est lu, jamais présumé (nº 838) : la doublure en
  //  montre 14 à vide, davantage dès qu'un autre banc y a rangé des fiches.
  verif("la mosaïque est là (au moins 8 cartes, et elle défile)", avant.cartes >= 8 && defile > 0, `${avant.cartes} cartes · défilée à ${defile} px (${avant.hauteur} > ${avant.fenetre})`);
  const href = await carte.getAttribute("href");
  const slug = href.split("?")[0].split("/").pop();
  await carte.click();
  await page.waitForSelector("[role=dialog]", { timeout: 15000 });
  await page.waitForFunction((s) => location.pathname === `/artist/${s}` && !document.querySelector("[data-attente-fiche]"), slug, { timeout: 15000 });
  await page.waitForTimeout(1500);
  const pendant = await page.evaluate(() => ({
    url: location.pathname, dialog: document.querySelectorAll("[role=dialog]").length, drapeau: document.documentElement.getAttribute("data-fenetre-fiche"),
    mosMeme: document.querySelector("[data-mosaique]") === window.__mos, grilleMeme: document.querySelector("[data-grille-tatoueurs]") === window.__grille,
    cartes: document.querySelectorAll('[data-lien-carte][href^="/artist/"]').length, titre: document.querySelector("[data-titre-fenetre]")?.textContent?.trim(),
  }));
  verif("la fenêtre de fiche est ouverte et possède l'adresse", pendant.dialog === 1 && pendant.url === `/artist/${slug}` && pendant.drapeau === "1", `${pendant.url} · ${pendant.titre}`);
  verif("la mosaïque est restée MONTÉE dessous (même nœud, mêmes cartes)", pendant.mosMeme && pendant.grilleMeme && pendant.cartes === avant.cartes, `cartes ${pendant.cartes}`);
  const redemandes = journal.filter((r) => r.rsc && /^\/search(\?|$)/.test(r.url));
  const navigations = journal.filter((r) => r.nav && r.frame);
  verif("aucune redemande de la mosaïque au serveur pendant la fenêtre", redemandes.length === 0, `${redemandes.length} requête(s) de page /search`);
  verif("aucune navigation de document (la fenêtre n'a pas remplacé la page)", navigations.length === 0, `${navigations.length}`);
  const fiche = journal.filter((r) => r.url.startsWith(`/api/tatoueur/${slug}`)).length;
  verif("la fiche est venue par son API, pas par la page complète", fiche >= 1 && !journal.some((r) => r.nav && r.url.startsWith(`/artist/${slug}`)), `${fiche} appel(s) API`);

  titre("732 · le retour");
  journal.length = 0;
  await page.goBack();
  await page.waitForFunction(() => !document.querySelector("[role=dialog]"), null, { timeout: 15000 });
  await page.waitForTimeout(1200);
  const apres = await page.evaluate(() => ({
    url: location.pathname + location.search, drapeau: document.documentElement.getAttribute("data-fenetre-fiche"),
    mosMeme: document.querySelector("[data-mosaique]") === window.__mos, cartes: document.querySelectorAll('[data-lien-carte][href^="/artist/"]').length, scroll: window.scrollY,
    invisible: !!document.querySelector("[data-mosaique].invisible, [data-mosaique] .invisible"),
  }));
  verif("l'adresse de la mosaïque est revenue, drapeau retiré", apres.url === MOSAIQUE && apres.drapeau === null, apres.url);
  verif("la mosaïque n'a pas été remplacée (même nœud, mêmes cartes)", apres.mosMeme && apres.cartes === avant.cartes, `cartes ${apres.cartes}`);
  verif("la position est rendue", Math.abs(apres.scroll - defile) <= 2, `${apres.scroll} px (avant : ${defile})`);
  verif("aucune redemande de /search au retour", journal.filter((r) => r.rsc && /^\/search(\?|$)/.test(r.url)).length === 0);

  titre("732 · une seconde fenêtre, refermée par Échap");
  journal.length = 0;
  const autre = page.locator('[data-lien-carte][href^="/artist/"]').nth(5);
  const slug2 = (await autre.getAttribute("href")).split("?")[0].split("/").pop();
  await autre.click();
  await page.waitForFunction((s) => location.pathname === `/artist/${s}` && document.querySelector("[role=dialog]") && !document.querySelector("[data-attente-fiche]"), slug2, { timeout: 15000 });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("[role=dialog]"), null, { timeout: 15000 });
  await page.waitForTimeout(800);
  const fin = await page.evaluate(() => ({ url: location.pathname + location.search, mosMeme: document.querySelector("[data-mosaique]") === window.__mos, cartes: document.querySelectorAll('[data-lien-carte][href^="/artist/"]').length }));
  verif("Échap referme la fenêtre et rend l'adresse de la mosaïque", fin.url === MOSAIQUE, fin.url);
  verif("la mosaïque est toujours le même nœud, mêmes cartes", fin.mosMeme && fin.cartes === avant.cartes, `cartes ${fin.cartes}`);
  verif("toujours aucune redemande de /search", journal.filter((r) => r.rsc && /^\/search(\?|$)/.test(r.url)).length === 0);
} catch (e) {
  verif("déroulement du banc 732", false, String(e).slice(0, 300));
} finally {
  await nav.close();
}
process.exit(bilan());
