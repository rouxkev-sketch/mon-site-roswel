//  ██ BANC 880 — AIR, VA-ET-VIENT FLUIDE, ZOOM, PASTILLE ██
//   §1 — L'AIR au-dessus de la première carte du fil : vingt-huit au
//        doigt (un cran de plus qu'à la nº 879), vingt-quatre au web.
//   §2 — LE VA-ET-VIENT GLISSE, même quand changer d'onglet change de
//        page : le trait est À MI-COURSE cent millisecondes après le
//        geste, et les couleurs fondent.
//   §3 — LE ZOOM AU PINCEMENT : il répond sur une carte de galerie
//        (il ne répondait pas), et la PASTILLE reste hors du zoom.
//   §4 — LA VUE PHOTO ouvre sur sa pastille, qui s'éteint à trois
//        secondes.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = Date.now();
const SLUG = `banc880-${T}`;
const PHOTO = (k, i) => `4f80${k}00${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`;
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", [{ ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 880",
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
const proche = (a, b, marge = 0.5) =>
  a !== null && a !== undefined && b !== null && b !== undefined && Math.abs(a - b) <= marge;

//  ══ 1 · L'AIR AU-DESSUS DE LA PREMIÈRE CARTE ═══════════════════════
const AIRS = `() => {
  const B = (n) => { if (!n) return null; const r = n.getBoundingClientRect();
    return { y: +r.top.toFixed(1), bas: +r.bottom.toFixed(1) }; };
  const onglets = document.querySelector('[aria-label="Profile, portfolio or flash"]');
  const bande = onglets ? onglets.parentElement : null;
  const cartes = [...document.querySelectorAll("[data-carte-de-galerie]")];
  const titres = cartes.map((c) => c.querySelector("[data-titre-galerie], h2, h3"));
  return { bande: B(bande), cartes: cartes.map(B), titres: titres.map(B),
    gouttiere: getComputedStyle(document.querySelector("[data-fil-de-galerie] ul")).rowGap };
}`;
for (const [mode, attendu] of [["doigt", 28], ["web", 24]]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`880 · §1 — ${mode} : l'air au-dessus de la première carte`);
    await page.goto(`${BASE}/artist/${SLUG}/portfolio`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte-de-galerie]", { timeout: 20000 });
    const tot = await page.evaluate((A) => new Function("return " + A)()(), AIRS);
    await page.waitForLoadState("networkidle").catch(() => {});
    await attendre(page, 1500);
    const v = await page.evaluate((A) => new Function("return " + A)()(), AIRS);
    const air1 = v.titres[0] ? +(v.titres[0].y - v.bande.bas).toFixed(1) : null;
    const air2 = v.titres[1] ? +(v.titres[1].y - v.cartes[0].bas).toFixed(1) : null;
    verif(`${mode} : l'air vaut ${attendu} px`, proche(air1, attendu, 0.5),
      `${air1} (gouttière ${v.gouttiere}, air entre deux cartes ${air2})`);
    if (mode === "web") {
      verif("web : il vaut toujours celui qui sépare deux cartes (nº 879 intacte)",
        proche(air1, air2, 0.5), `air 1 ${air1} · air 2 ${air2}`);
    } else {
      verif("doigt : il est bien PLUS GRAND que celui qui sépare deux cartes (le cran demandé)",
        air1 > air2, `air 1 ${air1} · air 2 ${air2}`);
    }
    const airTot = tot.titres[0] ? +(tot.titres[0].y - tot.bande.bas).toFixed(1) : null;
    verif(`${mode} : aucun saut — même air au premier rendu et une fois tout arrivé`,
      proche(airTot, air1, 0.5), `tôt ${airTot} · tard ${air1}`);
  } catch (e) {
    verif(`déroulement du banc 880 (§1 ${mode})`, false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 2 · LE VA-ET-VIENT GLISSE ══════════════════════════════════════
/*  ⚠️ ON MESURE LE TRAIT À MI-COURSE : sa transformation cent dix
    millisecondes après le geste, puis une fois posée. Deux valeurs
    différentes = il glisse ; identiques = il a sauté. C'est la seule
    preuve qui vaille — la classe de transition, elle, était déjà là et
    ne servait à rien quand la page changeait (voir OngletsLigne). */
const TRAIT = `(etiquette) => {
  const rangee = document.querySelector('[aria-label="' + etiquette + '"]');
  if (!rangee) return null;
  const trait = [...rangee.querySelectorAll("span")].find((s) => (s.getAttribute("style") || "").includes("translateX"));
  if (!trait) return { sansTrait: true };
  const s = getComputedStyle(trait);
  const actif = rangee.querySelector('[aria-current="page"], [aria-checked="true"]');
  return { transforme: s.transform, duree: s.transitionDuration,
    dureeCouleur: actif ? getComputedStyle(actif).transitionDuration : null,
    largeurRangee: Math.round(rangee.getBoundingClientRect().width) };
}`;
const trait = (page, e) => page.evaluate(([T, x]) => new Function("return " + T)()(x), [TRAIT, e]);
const CAS = [
  ["accueil (doigt) — deux pages", "doigt", "/", "Tattoo or flash", "Flash"],
  ["profil Portfolio → Flash (doigt) — deux pages", "doigt", `/artist/${SLUG}/portfolio`, "Profile, portfolio or flash", "Flash"],
  ["profil (web) — deux pages", "web", `/artist/${SLUG}`, "Profile, portfolio or flash", "Portfolio"],
];
for (const [nom, mode, adresse, etiquette, mot] of CAS) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`880 · §2 — ${nom}`);
    await page.goto(`${BASE}${adresse}`, { waitUntil: "networkidle" });
    await attendre(page, 1800);
    const avant = await trait(page, etiquette);
    if (!avant || avant.sansTrait || avant.largeurRangee === 0) {
      verif(`${nom} : (ce va-et-vient ne s'affiche pas ici — rien à mesurer)`, false,
        JSON.stringify(avant));
    } else {
      const onglet = page.locator(`[aria-label="${etiquette}"] a, [aria-label="${etiquette}"] button`)
        .filter({ hasText: new RegExp(`^${mot}`) }).first();
      await onglet.click({ noWaitAfter: true }).catch(() => {});
      await attendre(page, 110);
      const miCourse = await trait(page, etiquette);
      await attendre(page, 900);
      const pose = await trait(page, etiquette);
      verif(`${nom} : LE TRAIT EST À MI-COURSE cent millisecondes après le geste`,
        Boolean(miCourse && pose && !miCourse.sansTrait && !pose.sansTrait &&
          miCourse.transforme !== pose.transforme),
        `${miCourse?.transforme} → ${pose?.transforme}`);
      verif(`${nom} : la durée annoncée est de 300 ms pour le trait, 150 pour la couleur`,
        pose?.duree === "0.3s" && pose?.dureeCouleur === "0.15s",
        `trait ${pose?.duree} · couleur ${pose?.dureeCouleur}`);
    }
  } catch (e) {
    verif(`déroulement du banc 880 (§2 ${nom})`, false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 3 · LE ZOOM AU PINCEMENT ═══════════════════════════════════════
/*  DEUX DOIGTS, POSÉS PUIS ÉCARTÉS : `usePincement` écoute des
    `pointer…` — on les envoie donc directement, en `touch`, comme un
    vrai écran. (La souris de Playwright n'a qu'un pointeur.) */
const PINCER = `(selecteur) => {
  const zone = document.querySelector(selecteur);
  if (!zone) return "zone introuvable";
  const r = zone.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const envoyer = (type, id, x, y, primaire) => zone.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, composed: true, pointerId: id, pointerType: "touch",
    isPrimary: primaire, clientX: x, clientY: y, buttons: type === "pointerup" ? 0 : 1 }));
  envoyer("pointerdown", 1, cx - 20, cy, true);
  envoyer("pointerdown", 2, cx + 20, cy, false);
  for (const pas of [40, 70, 100]) {
    envoyer("pointermove", 1, cx - pas, cy, true);
    envoyer("pointermove", 2, cx + pas, cy, false);
  }
  return "pincé";
}`;
const LACHER = `(selecteur) => {
  const zone = document.querySelector(selecteur);
  if (!zone) return;
  const r = zone.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (const id of [1, 2]) zone.dispatchEvent(new PointerEvent("pointerup", {
    bubbles: true, cancelable: true, composed: true, pointerId: id, pointerType: "touch",
    isPrimary: id === 1, clientX: cx, clientY: cy, buttons: 0 }));
}`;
const pincer = (page, s) => page.evaluate(([P, x]) => new Function("return " + P)()(x), [PINCER, s]);
const lacher = (page, s) => page.evaluate(([L, x]) => new Function("return " + L)()(x), [LACHER, s]);

{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("880 · §3-a — doigt : le pincement répond sur une carte de galerie (Portfolio)");
    await page.goto(`${BASE}/artist/${SLUG}/portfolio`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-carte-de-galerie]", { timeout: 20000 });
    await attendre(page, 1500);
    const lireCadre = () => page.evaluate(() => {
      const cadre = document.querySelector("[data-carte-de-galerie='0'] [data-cadre-de-galerie]");
      const r = cadre.getBoundingClientRect();
      return { transforme: getComputedStyle(cadre).transform, l: +r.width.toFixed(1),
        marque: document.querySelector("[data-pincement]") !== null };
    });
    const repos = await lireCadre();
    await pincer(page, "[data-carte-de-galerie='0']");
    await attendre(page, 250);
    const pince = await lireCadre();
    verif("§3-a : LE CADRE DE L'IMAGE GROSSIT (il ne bougeait pas du tout avant la nº 880)",
      pince.transforme !== "none" && pince.transforme !== repos.transforme,
      `${repos.transforme} → ${pince.transforme}`);
    verif("§3-a : la carte porte la marque du geste (le confinement est levé)",
      pince.marque === true, String(pince.marque));
    await lacher(page, "[data-carte-de-galerie='0']");
    await attendre(page, 500);
    const relache = await lireCadre();
    verif("§3-a : au relâchement, l'image revient à sa place",
      relache.transforme === "none" || relache.transforme === "matrix(1, 0, 0, 1, 0, 0)",
      relache.transforme);
  } catch (e) {
    verif("déroulement du banc 880 (§3-a)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("880 · §3-b — doigt : sur une carte de recherche, la pastille reste hors du zoom");
    await page.goto(`${BASE}/search?style=blackwork&nature=tatouage`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1800);
    const lire2 = () => page.evaluate(() => {
      const carte = document.querySelector("[data-carte]");
      const cadre = carte.querySelector('[data-cadre-de-fil] [data-role="cadre"]');
      const pastille = carte.querySelector('[data-role="compteur"]');
      const rc = cadre ? cadre.getBoundingClientRect() : null;
      const rp = pastille ? pastille.getBoundingClientRect() : null;
      return {
        photo: rc ? { l: +rc.width.toFixed(1), x: +rc.left.toFixed(1) } : null,
        transforme: cadre ? getComputedStyle(cadre).transform : null,
        pastille: rp ? { l: +rp.width.toFixed(1), x: +rp.left.toFixed(1), y: +rp.top.toFixed(1) } : null,
      };
    });
    const repos = await lire2();
    if (!repos.photo || !repos.pastille) {
      verif("§3-b : (la carte de recherche du doigt n'a ni cadre de photos ni pastille — rien à mesurer)", false, JSON.stringify(repos));
    } else {
      await pincer(page, "[data-carte]");
      await attendre(page, 250);
      const pince = await lire2();
      verif("§3-b : LA PHOTO GROSSIT", pince.transforme !== "none" && pince.transforme !== repos.transforme,
        `${repos.transforme} → ${pince.transforme}`);
      verif("§3-b : LA PASTILLE NE BOUGE PAS D'UN PIXEL — ni de taille, ni de place",
        proche(pince.pastille.l, repos.pastille.l, 0.5) &&
        proche(pince.pastille.x, repos.pastille.x, 0.5) &&
        proche(pince.pastille.y, repos.pastille.y, 0.5),
        `${JSON.stringify(repos.pastille)} → ${JSON.stringify(pince.pastille)}`);
      await lacher(page, "[data-carte]");
      await attendre(page, 500);
      const relache = await lire2();
      verif("§3-b : au relâchement, tout revient en place",
        (relache.transforme === "none" || relache.transforme === "matrix(1, 0, 0, 1, 0, 0)") &&
        proche(relache.pastille.x, repos.pastille.x, 0.5),
        `${relache.transforme} · pastille ${JSON.stringify(relache.pastille)}`);
    }
  } catch (e) {
    verif("déroulement du banc 880 (§3-b)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

//  ══ 4 · LA VUE PHOTO OUVRE SUR SA PASTILLE ═════════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("880 · §4 — doigt : la vue photo montre sa pastille, puis l'éteint à trois secondes");
    await page.goto(`${BASE}/artist/${SLUG}?photo=${PHOTO(0, 1)}`, { waitUntil: "networkidle" });
    await page.waitForSelector('[data-carrousel] [data-role="compteur"]', { timeout: 20000 });
    await attendre(page, 400);
    const eveillee = () => page.evaluate(() =>
      document.querySelector('[data-carrousel] [data-role="compteur"]')?.hasAttribute("data-compteur-eveille") ?? null);
    verif("§4 : à l'ouverture, la pastille est ALLUMÉE (elle ne s'affichait pas du tout au doigt)",
      (await eveillee()) === true, String(await eveillee()));
    await attendre(page, 3500);
    verif("§4 : trois secondes et demie plus tard, sans geste, elle est éteinte",
      (await eveillee()) === false, String(await eveillee()));
  } catch (e) {
    verif("déroulement du banc 880 (§4)", false, String(e).slice(0, 300));
  } finally { await nav.close(); }
}

process.exit(bilan());
