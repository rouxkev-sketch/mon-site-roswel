//  ██ BANC 747 (web) — LES GALERIES SURVIVENT AU RE-RENDU ██
//  ⛔ nº 873 — LE DOIGT NE PASSE PLUS ICI : la page Portfolio du doigt est
//  le fil de galeries (plus de bandes par style, plus de vue photo à
//  ouvrir depuis une vignette) ; l'onglet Portfolio est UNE PAGE
//  (/artist/<nom>/portfolio) — le banc y va par son lien.
//  ⛔ nº 876 — LES BANDES DU WEB SONT PARTIES À LEUR TOUR : la page
//  Portfolio du web montre LES CARTES DE GALERIE du fil, une par rangée,
//  dont la photo glisse par la galerie de carte de la nº 839
//  (`useGalerieDeCarte`, un rang par carte).
//  ⚠️ nº 877 — LE DÉCLENCHEUR D'ORIGINE EST REVENU, SOUS UNE AUTRE
//  FORME : un clic sur LA PHOTO D'UNE CARTE pose de nouveau cette photo
//  dans le cadre du haut (`surSerieChoisie`) — le banc 877 le mesure.
//  Ici, on pose les rangs PAR LES CHEVRONS (le pied et ses points ont
//  quitté les cartes du web à la nº 877-§2). CE QUI RESTE À ÉPROUVER EST
//  LA PROMESSE ELLE-MÊME : un RE-RENDU de la fiche SANS remontage laisse les cartes
//  en place — mêmes nœuds, mêmes rangs, mêmes compteurs, aucune photo
//  redemandée. Le re-rendu : une adresse qui change sans changer de tag
//  (la clé de FicheSelonLAdresse reste la même) ; sa preuve : l'effet de
//  FicheSelonLAdresse, qui efface `data-fiche-parametree` quand la
//  requête change. Puis un redimensionnement de la fenêtre.
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

//  LES RANGS POSÉS SUR LES TROIS CARTES (par leurs chevrons, nº 877),
//  tous différents du repos, pour qu'un remontage se voie.
const RANGS = [2, 3, 4];
const LECTURE = `(() => {
  const cartes = [...document.querySelectorAll("[data-carte-de-galerie]")];
  //  La photo montrée : la case dont le bord gauche est celui de l'encadré.
  const montree = (c) => { const cadre = c.querySelector("[data-cadre-de-galerie]"); if (!cadre) return null;
    const g = cadre.getBoundingClientRect().left;
    return [...c.querySelectorAll("[data-case-de-carte]")].findIndex((k) => Math.abs(k.getBoundingClientRect().left - g) < 1); };
  return {
    url: location.pathname + location.search,
    galeries: cartes.map((c) => c.getAttribute("data-galerie-serie")),
    memes: window.__cartes ? window.__cartes.map((c) => document.contains(c)) : null,
    imgsMemes: window.__imgs ? window.__imgs.filter((i) => document.contains(i)).length : null,
    compteurs: cartes.map((c) => (c.querySelector("[data-compteur-galerie]") || {}).textContent),
    montrees: cartes.map(montree),
    parametree: document.documentElement.dataset.ficheParametree ?? null,
    onglet: [...document.querySelectorAll('nav[aria-label="Profile, portfolio or flash"] a')].map((a) => a.textContent.trim() + ":" + (a.getAttribute("aria-current") === "page")).join(" "),
  };
})()`;
const lire_ = (page) => page.evaluate(LECTURE);
const memoriser = (page) => page.evaluate(() => {
  window.__cartes = [...document.querySelectorAll("[data-carte-de-galerie]")];
  window.__imgs = [...document.querySelectorAll("[data-fil-de-galerie] img")];
  return window.__imgs.length;
});
const intact = (nom, avant, apres, images, nImages) => {
  verif(`${nom} : les trois cartes sont les MÊMES nœuds (images comprises)`, apres.memes.every(Boolean) && apres.imgsMemes === nImages, `nœuds ${JSON.stringify(apres.memes)} · images ${apres.imgsMemes}/${nImages}`);
  verif(`${nom} : le rang de chaque carte est intact`, JSON.stringify(apres.montrees) === JSON.stringify(avant.montrees), `${JSON.stringify(avant.montrees)} → ${JSON.stringify(apres.montrees)}`);
  verif(`${nom} : les compteurs sont intacts`, JSON.stringify(apres.compteurs) === JSON.stringify(avant.compteurs), `${JSON.stringify(avant.compteurs)} → ${JSON.stringify(apres.compteurs)}`);
  verif(`${nom} : aucune photo redemandée`, images === 0, `${images} requête(s) d'image`);
};

{
  const { nav, page } = await ouvrir("web");
  const images = [];
  page.on("request", (r) => { if (r.resourceType() === "image") images.push(r.url()); });
  try {
    titre("747 · web — le portfolio, trois cartes de galerie, posées à trois rangs distincts");
    await page.goto(`${BASE}/artist/${SLUG}?entree=lien`, { waitUntil: "networkidle" });
    //  nº 873 — l'onglet est un lien vers la page Portfolio.
    await page.locator('nav[aria-label="Profile, portfolio or flash"] a').filter({ hasText: /^Portfolio$/ }).first().click();
    await page.waitForFunction((s) => location.pathname === `/artist/${s}/portfolio`, SLUG, { timeout: 15000 });
    await page.waitForFunction(() => document.querySelectorAll("[data-carte-de-galerie]").length === 3, null, { timeout: 15000 });
    await page.waitForTimeout(600);
    //  ON POSE LE RANG PAR LE CHEVRON DE DROITE, autant de fois qu'il
    //  faut : c'est le seul geste qui fait glisser une carte au web
    //  depuis la nº 877 (le pied et ses points sont partis).
    for (let i = 0; i < 3; i += 1) {
      const carte = page.locator("[data-carte-de-galerie]").nth(i);
      await carte.hover({ position: { x: 200, y: 200 } });
      for (let pas = 1; pas < RANGS[i]; pas += 1) {
        await carte.locator("[data-fleche-de-carte='droite']").click();
        await page.waitForTimeout(400);
      }
    }
    await page.waitForTimeout(700);
    const nImages = await memoriser(page);
    const avant = await lire_(page);
    verif("trois cartes, aux rangs 2, 3 et 4 (compteurs « 2/6 · 3/5 · 4/4 »)",
      avant.galeries.length === 3 && avant.compteurs.join(" · ") === "2/6 · 3/5 · 4/4" && JSON.stringify(avant.montrees) === "[1,2,3]",
      `${JSON.stringify(avant.galeries)} · ${avant.compteurs.join(" · ")} · montrées ${JSON.stringify(avant.montrees)} · ${nImages} image(s)`);

    titre("747 · web — un re-rendu de la fiche SANS remontage (adresse qui change, clé identique)");
    images.length = 0;
    await page.evaluate(() => { document.documentElement.dataset.ficheParametree = "banc"; history.replaceState(history.state, "", location.pathname + (location.search ? location.search + "&" : "?") + "banc=1"); });
    await page.waitForTimeout(800);
    const apres = await lire_(page);
    verif("preuve du re-rendu : l'effet de FicheSelonLAdresse a effacé la marque", apres.parametree === null && apres.url.includes("banc=1"), `marque ${JSON.stringify(apres.parametree)} · ${apres.url}`);
    verif("la fiche reste sur le portfolio", /Portfolio:true/.test(apres.onglet), apres.onglet);
    intact("re-rendu", avant, apres, images.length, nImages);

    titre("747 · web — un redimensionnement de la fenêtre");
    images.length = 0;
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(800);
    intact("redimensionnement", avant, await lire_(page), images.length, nImages);
  } catch (e) {
    verif("déroulement du banc 747 · web", false, String(e).slice(0, 300));
  } finally {
    await nav.close();
  }
}
process.exit(bilan());
