//  ██ BANC 881 — LE ZOOM QUI DÉBORDE, ET L'ARRIVÉE À ZÉRO ██
//   §1 — LA PHOTO PINCÉE DÉBORDE DE SA CARTE, des deux sortes, et elle
//        passe DEVANT la barre fixe ; la pastille ne bouge pas.
//   §2 — DIX ORIGINES DÉFILÉES × TROIS DESTINATIONS : profil,
//        Portfolio, Flash — trente arrivées, toutes à zéro, aux deux
//        appareils.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = Date.now();
const SLUG = `banc881-${T}`;
const PHOTO = (k, i) => `5281${k}00${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`;
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", [{ ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 881",
    styles: ["blackwork", "realisme"], ville_slug: `lyon-${SLUG}` }]);
  const photos = [];
  for (const [k, style, n] of [[0, "blackwork", 6], [1, "realisme", 4]]) {
    for (let i = 1; i <= n; i += 1) {
      photos.push({ id: PHOTO(k, i), tatoueur_id: SLUG, style, rendu: "black", nature: "tatouage",
        url: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`,
        miniature: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`,
        ordre: i, cree_le: "2026-01-01T00:00:00Z" });
    }
  }
  await ranger("photos_tatoueur", photos);
}
const attendre = (page, ms) => page.waitForTimeout(ms);
const proche = (a, b, m = 0.5) => a != null && b != null && Math.abs(a - b) <= m;

//  ══ 1 · LE ZOOM DÉBORDE ════════════════════════════════════════════
const PINCER = `(selecteur) => {
  const zone = document.querySelector(selecteur);
  const r = zone.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const e = (type, id, x, y, p) => zone.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, composed: true, pointerId: id, pointerType: "touch",
    isPrimary: p, clientX: x, clientY: y, buttons: type === "pointerup" ? 0 : 1 }));
  e("pointerdown", 1, cx - 20, cy, true); e("pointerdown", 2, cx + 20, cy, false);
  for (const pas of [40, 70, 100]) { e("pointermove", 1, cx - pas, cy, true); e("pointermove", 2, cx + pas, cy, false); }
}`;
const RELEVE = `(selecteur) => {
  const carte = document.querySelector(selecteur);
  const cadre = carte.querySelector('[data-cadre-de-fil] [data-role="cadre"], [data-cadre-de-galerie]');
  const B = (n) => { if (!n) return null; const r = n.getBoundingClientRect();
    return { y: +r.top.toFixed(1), bas: +r.bottom.toFixed(1), g: +r.left.toFixed(1), d: +r.right.toFixed(1) }; };
  const pastille = carte.querySelector('[data-role="compteur"]');
  /*  CE QUE L'ŒIL VOIT AU RAS DU HAUT DE L'ÉCRAN — là où la barre fixe
      est posée : si la photo agrandie y est peinte, c'est qu'elle passe
      DEVANT la barre, et non dessous. */
  const auHaut = document.elementFromPoint(Math.round(window.innerWidth / 2), 20);
  return { cadre: B(cadre), carte: B(carte), pastille: B(pastille),
    transforme: cadre ? getComputedStyle(cadre).transform : null,
    auHaut: auHaut ? auHaut.tagName : null,
    photoAuHaut: Boolean(auHaut && (auHaut.tagName === "IMG" || auHaut.closest('[data-role="cadre"], [data-cadre-de-galerie]'))) };
}`;
const relever = (page, s) => page.evaluate(([R, x]) => new Function("return " + R)()(x), [RELEVE, s]);
const pincer = (page, s) => page.evaluate(([P, x]) => new Function("return " + P)()(x), [PINCER, s]);

for (const [nom, adresse, selecteur, avecPastille] of [
  ["carte de recherche", "/search?style=blackwork&nature=tatouage", "[data-carte]", true],
  ["carte de galerie", `/artist/${SLUG}/portfolio`, "[data-carte-de-galerie='0']", false],
]) {
  const { nav, page } = await ouvrir("doigt");
  try {
    titre(`881 · §1 — doigt : la photo pincée DÉBORDE de sa carte (${nom})`);
    await page.goto(`${BASE}${adresse}`, { waitUntil: "networkidle" });
    await page.waitForSelector(selecteur, { timeout: 20000 });
    await attendre(page, 1500);
    const repos = await relever(page, selecteur);
    await pincer(page, selecteur);
    await attendre(page, 300);
    const pince = await relever(page, selecteur);
    verif(`${nom} : la photo grossit`,
      pince.transforme !== "none" && pince.transforme !== repos.transforme,
      `${repos.transforme} → ${pince.transforme}`);
    verif(`${nom} : elle DÉBORDE de la carte des quatre côtés`,
      pince.cadre.y < pince.carte.y && pince.cadre.bas > pince.carte.bas &&
      pince.cadre.g < pince.carte.g && pince.cadre.d > pince.carte.d,
      `cadre ${JSON.stringify(pince.cadre)} · carte ${JSON.stringify(pince.carte)}`);
    verif(`${nom} : elle passe DEVANT la barre fixe (peinte au ras du haut de l'écran)`,
      pince.photoAuHaut === true, `au haut : ${pince.auHaut}`);
    if (avecPastille && repos.pastille) {
      verif(`${nom} : la pastille ne bouge pas d'un pixel (nº 880 tenue)`,
        proche(pince.pastille.y, repos.pastille.y) && proche(pince.pastille.g, repos.pastille.g) &&
        proche(pince.pastille.d - pince.pastille.g, repos.pastille.d - repos.pastille.g),
        `${JSON.stringify(repos.pastille)} → ${JSON.stringify(pince.pastille)}`);
    }
  } catch (e) {
    verif(`déroulement du banc 881 (§1 ${nom})`, false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 2 · DIX ORIGINES DÉFILÉES × TROIS DESTINATIONS ═════════════════
const DEPARTS = [4, 8, 16, 24, 40, 80, 150, 300, 600, 1200];
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`881 · §2 — ${mode} : dix origines défilées × trois destinations, toutes à zéro`);
    const y = () => page.evaluate(() => Math.round(window.scrollY));
    const fautes = [];
    for (const depart of DEPARTS) {
      await page.goto(`${BASE}/search?style=blackwork&nature=tatouage`, { waitUntil: "networkidle" });
      await page.waitForSelector("[data-carte]", { timeout: 20000 });
      await attendre(page, 900);
      await page.evaluate((v) => window.scrollTo(0, v), depart);
      await attendre(page, 500);
      const partiDe = await y();
      /*  ⚠️ LE LIEN N'EST PAS LE MÊME SELON L'APPAREIL : au doigt, un
          toucher sur la photo ne fait rien (nº 873) — c'est l'en-tête
          de la carte qui mène au profil. */
      const lien = mode === "doigt"
        ? page.locator(`[data-lien-profil-de-fil][href*="${SLUG}"]`).first()
        : page.locator(`[data-lien-carte][href*="${SLUG}"]`).first();
      await lien.click({ noWaitAfter: true });
      await page.waitForFunction(() => location.pathname.startsWith("/artist/"), null, { timeout: 20000 }).catch(() => {});
      await attendre(page, 1500);
      const surLeProfil = await y();
      if (surLeProfil !== 0) fautes.push(`profil depuis ${partiDe} → ${surLeProfil}`);
      //  ── PUIS LES DEUX AUTRES VUES, PAR LEUR ONGLET.
      for (const mot of ["Portfolio", "Flash"]) {
        const onglet = page.locator('[aria-label="Profile, portfolio or flash"] a, [aria-label="Profile, portfolio or flash"] button')
          .filter({ hasText: new RegExp(`^${mot}$`) }).first();
        if ((await onglet.count()) === 0) { fautes.push(`onglet ${mot} introuvable`); continue; }
        await onglet.click({ noWaitAfter: true });
        await attendre(page, 1500);
        const ici = await y();
        if (ici !== 0) fautes.push(`${mot} depuis ${partiDe} → ${ici}`);
      }
    }
    verif(`${mode} : les trente arrivées sont à zéro, au pixel`,
      fautes.length === 0, fautes.slice(0, 6).join(" | ") || `${DEPARTS.length} × 3 arrivées à zéro`);
  } catch (e) {
    verif(`déroulement du banc 881 (§2 ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

process.exit(bilan());
