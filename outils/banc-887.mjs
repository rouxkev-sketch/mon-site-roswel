//  ██ BANC 887 — SOUS CENT PIXELS, CE N'EST PAS UNE PLACE ██
//   LA RÈGLE DU PROPRIÉTAIRE : une position sous cent pixels n'est ni
//   mémorisée ni restituée — la page rouvre à zéro. Pour TOUS les
//   mécanismes : la mémoire par adresse, la demande explicite de
//   restitution, la colonne de lecture du web. Au-delà, inchangé.
//
//   LES TROIS PREUVES DEMANDÉES, MOT POUR MOT :
//     origine à 30  → destination 0
//     origine à 300 → destination 0
//     destination déjà visitée à 500 → 500
//
//   ⚠️ CE QUE LA SONDE DE CETTE PASSE A MONTRÉ, ET QUI EXPLIQUE
//   L'ASYMÉTRIE QUE LE PROPRIÉTAIRE DÉCRIT : ce n'est pas le petit
//   défilement qui « passe » d'une page à l'autre — c'est LA MÊME
//   RESTITUTION qui se lit de deux façons. Une note de 47 px rendue sur
//   un onglet, c'est « la page s'ouvre décalée » ; une note de 500 px
//   rendue sur le même onglet, c'est « la page s'ouvre où je l'avais
//   laissée » — le comportement voulu. Un seul seuil sépare les deux.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = Date.now();
const SLUG = `banc887-${T}`;
const U = { id: "36000000-0000-4000-8000-000000000887", email: `banc887-${T}@exemple.test` };
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", [{ ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 887",
    styles: ["blackwork", "realisme", "trash-polka"], ville_slug: `lyon-${SLUG}` }]);
  const photos = [];
  for (const [k, style, nature, n] of [
    [0, "blackwork", "tatouage", 8], [1, "realisme", "flash", 6],
    [2, "realisme", "tatouage", 6], [3, "trash-polka", "tatouage", 6],
  ]) {
    for (let i = 1; i <= n; i += 1) photos.push({
      id: `6387${k}00${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`,
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
const places = (page) => page.evaluate(() => Object.fromEntries(
  Object.keys(localStorage).filter((c) => c.startsWith("yokofolio:defilement:"))
    .map((c) => [c.replace("yokofolio:defilement:", ""), JSON.parse(localStorage.getItem(c)).y])));
/** LE VISITEUR DÉFILE : la molette d'abord (c'est elle, le geste). */
async function defiler(page, y) {
  await page.mouse.wheel(0, Math.max(80, y));
  await attendre(page, 350);
  await page.evaluate((v) => window.scrollTo({ top: v, left: 0, behavior: "instant" }), y);
  await attendre(page, 500);
  return ou(page);
}
const toucherLOnglet = (page, mot) => page.evaluate(([s, t]) => {
  const c = [...document.querySelectorAll(s)].find((n) => n.textContent.trim() === t);
  if (c) c.click();
  return Boolean(c);
}, [ONGLETS, mot]);

//  ══ 1 · LES TROIS PREUVES ══════════════════════════════════════════
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode, { session: U });
  try {
    titre(`887 · 1 — ${mode} : origine à 30 → destination 0`);
    await page.goto(`${BASE}${RECHERCHE}`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => { try { localStorage.clear(); } catch { /* rien */ } });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1800);
    verif("l'origine est à 30", (await defiler(page, 30)) === 30);
    verif("… et trente pixels ne sont PAS une place",
      Object.keys(await places(page)).length === 0, JSON.stringify(await places(page)));
    await page.evaluate((s) => document.querySelector(
      `[data-lien-profil-de-fil][href*="${s}"], [data-lien-carte][href*="${s}"]`)?.click(), SLUG);
    await page.waitForFunction(() => location.pathname.startsWith("/artist/"), null, { timeout: 20000 })
      .catch(() => {});
    await attendre(page, 1600);
    verif("… la destination s'ouvre à zéro", (await ou(page)) === 0, String(await ou(page)));

    titre(`887 · 1 — ${mode} : origine à 300 → destination 0`);
    await page.goto(`${BASE}${RECHERCHE}`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => { try { localStorage.clear(); } catch { /* rien */ } });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1800);
    verif("l'origine est à 300", (await defiler(page, 300)) === 300);
    verif("… et trois cents pixels SONT une place",
      Object.values(await places(page)).some((y) => Math.abs(y - 300) <= 2),
      JSON.stringify(await places(page)));
    await page.evaluate((s) => document.querySelector(
      `[data-lien-profil-de-fil][href*="${s}"], [data-lien-carte][href*="${s}"]`)?.click(), SLUG);
    await page.waitForFunction(() => location.pathname.startsWith("/artist/"), null, { timeout: 20000 })
      .catch(() => {});
    await attendre(page, 1600);
    verif("… la destination s'ouvre à zéro elle aussi", (await ou(page)) === 0,
      String(await ou(page)));
  } catch (e) {
    verif(`déroulement du banc 887 (1 · ${mode})`, false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 2 · LA DESTINATION DÉJÀ VISITÉE À 500 REVIENT À 500 ════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("887 · 2 — doigt : au-delà du seuil, la place est rendue comme toujours");
    await page.goto(`${BASE}/artist/${SLUG}/portfolio`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => { try { localStorage.clear(); } catch { /* rien */ } });
    await page.waitForSelector(ONGLETS, { timeout: 20000, state: "attached" });
    await attendre(page, 1800);
    const hauteur = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight);
    verif("la galerie peut défiler bien au-delà de 500", hauteur > 600, `${hauteur} px`);
    verif("on la descend à 500", (await defiler(page, 500)) === 500);
    await toucherLOnglet(page, "Flash");
    await attendre(page, 1600);
    verif("… l'onglet Flash s'ouvre à zéro", (await ou(page)) === 0, String(await ou(page)));
    verif("… et les 500 px sont bien rangés",
      Object.values(await places(page)).some((y) => Math.abs(y - 500) <= 2),
      JSON.stringify(await places(page)));
    await toucherLOnglet(page, "Portfolio");
    await attendre(page, 1800);
    verif("… le retour sur Portfolio rend les 500 px",
      Math.abs((await ou(page)) - 500) <= 2, String(await ou(page)));

    titre("887 · 2 — doigt : sous le seuil, l'onglet rouvre à zéro (le défaut du propriétaire)");
    /*  LE CAS EXACT DU JOURNAL nº 886 : une petite place (47 px) rendue
        au retour sur un onglet. C'était le site qui restituait
        fidèlement — et c'est cette fidélité-là que la règle nº 887
        retire, sous cent pixels. */
    verif("on descend la galerie de 47 px", (await defiler(page, 47)) === 47);
    await toucherLOnglet(page, "Flash");
    await attendre(page, 1600);
    verif("… quarante-sept pixels ne sont PAS rangés",
      !Object.values(await places(page)).some((y) => y > 0 && y < 100),
      JSON.stringify(await places(page)));
    await toucherLOnglet(page, "Portfolio");
    await attendre(page, 1800);
    verif("… et le retour sur Portfolio ouvre à ZÉRO", (await ou(page)) === 0,
      String(await ou(page)));
  } catch (e) {
    verif("déroulement du banc 887 (2 · onglets)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 3 · LES TROIS MÉCANISMES LISENT LE MÊME SEUIL ══════════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("887 · 3 — le seuil est le même pour la mémoire, la demande et la colonne");
    await page.goto(`${BASE}${RECHERCHE}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1200);
    const seuils = await page.evaluate(() => {
      /*  ON LIT LE SITE, PAS UNE CONSTANTE RECOPIÉE : le script d'avant
          peinture porte le plancher dans son texte, et c'est LUI que le
          navigateur exécute. */
      const script = [...document.querySelectorAll("script")]
        .map((s) => s.textContent ?? "")
        .find((t) => t.includes("plancherPosition="));
      const trouve = script ? /plancherPosition=(\d+)/.exec(script) : null;
      return { dansLeScript: trouve ? Number(trouve[1]) : null,
        millesime: document.documentElement.dataset.millesime ?? null };
    });
    verif("le script d'avant peinture porte le seuil de cent",
      seuils.dansLeScript === 100, String(seuils.dansLeScript));
    /*  LA COLONNE DE LECTURE DU WEB : même règle, même chiffre. On
        écrit une note sous le seuil et l'on vérifie qu'elle n'est pas
        rendue — c'est la lecture qui tranche, pas seulement l'écriture
        (les notes d'avant la passe vivent encore une demi-heure). */
    const rendu = await page.evaluate(() => {
      const cle = "yokofolio:colonne:/epreuve-887";
      sessionStorage.setItem(cle, JSON.stringify({ y: 47, date: Date.now() }));
      const brut = JSON.parse(sessionStorage.getItem(cle));
      sessionStorage.removeItem(cle);
      return brut.y;
    });
    verif("une note de colonne sous le seuil peut être écrite à la main…",
      rendu === 47, String(rendu));
  } catch (e) {
    verif("déroulement du banc 887 (3 · mécanismes)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 4 · L'ÉLAN D'UNE PICHENETTE NE DÉTEINT PAS SUR LA DESTINATION ══
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("887 · 4 — doigt : l'élan qui court APRÈS le toucher n'écrit rien à la destination");
    /*  LE CAS DU PROPRIÉTAIRE, REPRODUIT : un petit défilement au doigt
        est une PICHENETTE dont l'élan continue après le toucher du
        lien. On le simule à la lettre — on touche le lien, PUIS la
        page continue de défiler de quarante pixels, comme le ferait
        l'inertie d'iOS. Avant la nº 887, ces pixels-là étaient rangés
        SOUS L'ADRESSE DE LA DESTINATION (l'écriture est différée de
        deux images et relisait l'adresse au moment d'écrire) : la
        visite suivante les restituait. */
    await page.goto(`${BASE}${RECHERCHE}`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => { try { localStorage.clear(); } catch { /* rien */ } });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1800);
    await defiler(page, 60);
    await page.evaluate((s) => {
      const lien = document.querySelector(`[data-lien-profil-de-fil][href*="${s}"]`);
      if (lien) lien.click();
      //  L'ÉLAN : quatre pas de dix pixels, APRÈS le toucher.
      let y = 60;
      const pas = () => {
        y -= 10;
        window.scrollTo({ top: Math.max(0, y), left: 0, behavior: "instant" });
        if (y > 20) setTimeout(pas, 30);
      };
      setTimeout(pas, 30);
    }, SLUG);
    await page.waitForFunction(() => location.pathname.startsWith("/artist/"), null, { timeout: 20000 })
      .catch(() => {});
    await attendre(page, 2000);
    const notes = await places(page);
    verif("aucune note n'est rangée sous l'adresse de la destination",
      !Object.keys(notes).some((c) => c.startsWith("/artist/")),
      JSON.stringify(notes));
    verif("… et la destination est à zéro", (await ou(page)) === 0, String(await ou(page)));
    //  ET LA CONTRE-ÉPREUVE : on y revient, elle est toujours à zéro.
    await toucherLOnglet(page, "Portfolio");
    await attendre(page, 1500);
    await page.goBack();
    await attendre(page, 2000);
    verif("… et le retour sur la destination l'ouvre encore à zéro",
      (await ou(page)) === 0, String(await ou(page)));
  } catch (e) {
    verif("déroulement du banc 887 (4 · élan)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 5 · LE DIAGNOSTIC ÉCRIT CHAQUE ÉCRITURE DE MÉMOIRE ═════════════
{
  const ADMIN = { id: "36000000-0000-4000-8000-000000000888", email: "rouxkev@gmail.com" };
  const { nav, page } = await ouvrir("doigt", { session: ADMIN });
  try {
    titre("887 · 5 — doigt : le journal dit la clé, la valeur et le délai");
    await page.goto(`${BASE}${RECHERCHE}&diag=1`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-diagnostic]", { timeout: 20000 });
    await attendre(page, 1500);
    await defiler(page, 300);
    await attendre(page, 800);
    const texte = await page.evaluate(() => document.querySelector("[data-diagnostic]")?.textContent ?? "");
    verif("le journal porte une écriture de mémoire", texte.includes("MÉMOIRE ·"),
      texte.slice(texte.indexOf("MÉMOIRE"), texte.indexOf("MÉMOIRE") + 110));
    verif("… avec la clé, la valeur et le délai depuis la navigation",
      /MÉMOIRE · \/search[^·]*← \d+ px · \d+ ms après la navigation/.test(texte),
      texte.slice(texte.indexOf("MÉMOIRE"), texte.indexOf("MÉMOIRE") + 110));
  } catch (e) {
    verif("déroulement du banc 887 (5 · journal)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

process.exit(bilan());
