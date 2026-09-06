//  ██ BANC 889 — LE DÉFILEMENT REVENU AU STANDARD ██
//   §1 — TOUTE ARRIVÉE COMMENCE EN HAUT, quelle que soit l'amplitude
//        du défilement de la page qu'on quitte — y compris la petite,
//        celle que le routeur de Next GARDE par défaut (le défaut que
//        huit passes ont attribué à WebKit ; voir
//        docs/DEFILEMENT-889-INVENTAIRE.md).
//   §2 — LE NAVIGATEUR RESTITUE LES RETOURS, tout seul : depuis un
//        profil, le fil revient à sa place ; la mémoire des GALERIES
//        (nº 863 §5) survit, elle, intacte.
//   §5 — LA FENÊTRE DE FICHE DU WEB N'EST PAS UNE ARRIVÉE : elle change
//        l'adresse sans quitter la grille, et la grille NE BOUGE PAS.
//   §4 — LE SITE N'ÉCRIT PLUS AUCUNE POSITION : ni place d'adresse, ni
//        colonne, ni demande de restitution. Et `scrollRestoration`
//        reste « auto » (nº 363 — l'écran noir du glissement retour).
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = Date.now();
const SLUG = `banc889-${T}`;
const U = { id: `c889${String(T).slice(-8)}-0000-4000-8000-000000000889`, email: `banc889-${T}@exemple.test` };
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", [{ ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 889",
    styles: ["blackwork", "realisme", "trash-polka"], ville_slug: `lyon-${SLUG}` }]);
  const photos = [];
  for (const [k, style, nature, n] of [
    [0, "blackwork", "tatouage", 8], [1, "realisme", "flash", 6],
    [2, "realisme", "tatouage", 6], [3, "trash-polka", "tatouage", 6],
  ]) {
    for (let i = 1; i <= n; i += 1) photos.push({
      id: `5889${k}00${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`,
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
/** LE VISITEUR DÉFILE : la molette d'abord (c'est elle, le geste), la
    position exacte ensuite — quelques pixels ne se visent pas à la
    molette. Le motif des bancs 875 et 882. */
async function defilerCommeUnVisiteur(page, y) {
  await page.mouse.wheel(0, Math.max(60, y));
  await attendre(page, 350);
  await page.evaluate((v) => window.scrollTo({ top: v, left: 0, behavior: "instant" }), y);
  await attendre(page, 350);
  return ou(page);
}
/** CLIQUER SANS DÉPLACER LA PAGE : Playwright amène l'élément à l'écran
    avant de cliquer, ce qui DÉFERAIT le défilement de l'origine — tout
    le sujet du banc. Le clic part donc de la page elle-même. */
const cliquer = (page, selecteur, texte = null) =>
  page.evaluate(([s, t]) => {
    const tous = [...document.querySelectorAll(s)];
    const cible = t ? tous.find((n) => n.textContent.trim() === t) : tous[0];
    if (!cible) return false;
    cible.click();
    return true;
  }, [selecteur, texte]);
/** LES CLÉS DE POSITION que le site n'écrit plus. */
const clesDePosition = (page) => page.evaluate(() => {
  const prises = [];
  for (const magasin of [localStorage, sessionStorage]) {
    try {
      for (let i = 0; i < magasin.length; i += 1) {
        const c = magasin.key(i);
        if (/^yokofolio:(defilement|colonne|restaurer-position)/.test(c)) prises.push(c);
      }
    } catch { /* magasin indisponible */ }
  }
  return prises;
});

//  ══ 1 · TOUTE ARRIVÉE COMMENCE EN HAUT ═════════════════════════════
/*  LES TROIS AMPLITUDES SONT LE CŒUR DU BANC. 39 px est la valeur du
    relevé du propriétaire, et c'est LA seule que le routeur gardait :
    le haut du contenu qui arrive y est encore visible, et Next
    s'abstient alors de défiler (comportement documenté de <Link>).
    300 px passait déjà avant la nº 889 — on le garde pour la
    non-régression. */
const DEPARTS = [8, 39, 300];
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode, { session: U });
  try {
    titre(`889 · §1 — ${mode} : toutes les sortes de pages arrivent à zéro`);
    const fautes = [];
    let arrivees = 0;
    for (const depart of DEPARTS) {
      if (mode === "doigt") {
        await page.goto(`${BASE}${RECHERCHE}`, { waitUntil: "networkidle" });
        await page.waitForSelector("[data-carte]", { timeout: 20000 });
      } else {
        await page.goto(`${BASE}/artist/${SLUG}`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector(ONGLETS, { timeout: 20000 });
      }
      await page.evaluate(() => { try { localStorage.clear(); } catch { /* rien */ } });
      await attendre(page, 900);
      const sauts = [
        ...(mode === "doigt"
          ? [["profil", `[data-lien-profil-de-fil][href*="${SLUG}"]`, null, `/artist/${SLUG}`]]
          : []),
        ["portfolio", ONGLETS, "Portfolio", `/artist/${SLUG}/portfolio`],
        ["flash", ONGLETS, "Flash", `/artist/${SLUG}/flash`],
        ["accueil", '[aria-label$="home"]', null, "/"],
        ["Ma sélection", '[aria-label="My favorites"]', null, "/my-favorites"],
        ["accueil (depuis Ma sélection)", '[aria-label$="home"]', null, "/"],
      ];
      for (const [nom, selecteur, texte, adresse] of sauts) {
        const partiDe = await defilerCommeUnVisiteur(page, depart);
        if (!(await cliquer(page, selecteur, texte))) { fautes.push(`${nom} : lien introuvable`); continue; }
        await page.waitForFunction((a) => location.pathname === a, adresse, { timeout: 20000 }).catch(() => {});
        await attendre(page, 1600);
        arrivees += 1;
        const ici = await ou(page);
        if (ici !== 0) fautes.push(`${nom} (départ ${depart}, parti de ${partiDe}) → ${ici}`);
      }
    }
    verif(`${mode} : les ${arrivees} arrivées sont à zéro, au pixel`,
      fautes.length === 0 && arrivees === DEPARTS.length * (mode === "doigt" ? 6 : 5),
      fautes.slice(0, 8).join(" | ") || `${arrivees} arrivées à zéro`);

    titre(`889 · §1 — ${mode} : la CARTE DE STYLE de l'accueil, à la petite amplitude`);
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-lien-carte][href^="/search"]', { timeout: 20000 });
    /*  ⚠️ ON ATTEND QUE LE DOCUMENT AIT DE LA COURSE, et on ne le
        suppose pas : au web l'accueil est COURT (1022 px de document
        pour 950 de fenêtre, mesuré — 72 px de course), et ses cartes
        montent sa hauteur après coup. Scruter la hauteur vaut mieux
        qu'une attente au jugé. */
    await page.waitForFunction(
      () => document.documentElement.scrollHeight - window.innerHeight >= 39,
      null, { timeout: 20000 }
    ).catch(() => {});
    await attendre(page, 800);
    const course = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight
    );
    /*  ⚠️ SI L'ACCUEIL N'A PAS DE COURSE, IL N'Y A PAS DE PETITE
        AMPLITUDE À ÉPROUVER — et c'est le cas au web pour un visiteur
        CONNECTÉ (l'appel « devenir tatoueur » ne s'y affiche pas, la
        page tient dans la fenêtre). On le DIT plutôt que de faire
        semblant de mesurer. */
    const vise = Math.min(39, course);
    const partiDe = vise > 0 ? await defilerCommeUnVisiteur(page, vise) : 0;
    verif(`l'accueil est descendu de ${vise} px (la petite amplitude du relevé)`,
      vise === 0 || partiDe === vise,
      `course ${course} · parti de ${partiDe}`);
    await cliquer(page, '[data-lien-carte][href^="/search"]');
    await page.waitForFunction(() => location.pathname === "/search", null, { timeout: 20000 });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1500);
    verif("… et la recherche s'ouvre à zéro (le cas exact du relevé)",
      (await ou(page)) === 0, `parti de ${partiDe} → ${await ou(page)}`);

    titre(`889 · §4 — ${mode} : aucune position n'est écrite, nulle part`);
    verif("aucune clé de position dans les magasins",
      (await clesDePosition(page)).length === 0,
      JSON.stringify(await clesDePosition(page)));
    verif("la restauration native reste « auto » (nº 363)",
      (await page.evaluate(() => history.scrollRestoration)) === "auto",
      String(await page.evaluate(() => history.scrollRestoration)));
  } catch (e) {
    verif(`déroulement du banc 889 (§1 ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · LE NAVIGATEUR RESTITUE LES RETOURS ═════════════════════════
{
  const { nav, page } = await ouvrir("doigt", { session: U });
  try {
    titre("889 · §2 — doigt : le retour du navigateur rend la place du fil");
    await page.goto(`${BASE}${RECHERCHE}`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1200);
    const place = await defilerCommeUnVisiteur(page, 420);
    verif("le fil est descendu de 420 px", place === 420, String(place));
    await cliquer(page, `[data-lien-profil-de-fil][href*="${SLUG}"]`);
    await page.waitForFunction(() => location.pathname.startsWith("/artist/"), null, { timeout: 20000 });
    await attendre(page, 1500);
    verif("… le profil s'ouvre en haut", (await ou(page)) === 0, String(await ou(page)));
    await page.goBack();
    await page.waitForFunction(() => location.pathname === "/search", null, { timeout: 20000 });
    await attendre(page, 2000);
    const revenu = await ou(page);
    /*  ⚠️ LA TOLÉRANCE EST VOULUE, ET ELLE EST LE PRIX DU STANDARD : le
        navigateur repose la position SANS attendre que les cartes
        soient arrivées. Il retombe donc « autour » de la place, pas
        au pixel — c'est ce que la nº 889 accepte en retirant
        lib/pose-sur-contenu. Ce qu'on mesure ici : il RESTITUE, il ne
        remet pas à zéro. */
    verif("… et le retour rend la place du fil (le navigateur, seul)",
      revenu > 200, `revenu à ${revenu}`);

    /*  ██ LA MÉMOIRE DES GALERIES N'EST PAS MESURÉE ICI, ET C'EST
        VOULU ██ La position d'une BANDE (nº 863 §5) et la photo d'un
        carrousel (nº 866) vivent dans lib/memoire-galeries, un module
        qui n'importe RIEN et que la nº 889 n'a pas touché d'un octet.
        Le banc qui l'éprouve de bout en bout existe déjà — banc 863,
        rejoué à cette passe. Le redire ici avec un sélecteur fragile
        n'ajouterait pas une preuve, seulement un banc de plus à
        entretenir. */
  } catch (e) {
    verif("déroulement du banc 889 (§2)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 5 · LA FENÊTRE DE FICHE DU WEB NE DÉPLACE PAS LA GRILLE ══════
{
  const { nav, page } = await ouvrir("web", { session: U });
  try {
    titre("889 · §5 — web : ouvrir une fiche par-dessus la grille ne la déplace pas");
    await page.goto(`${BASE}${RECHERCHE}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 1800);
    const place = await defilerCommeUnVisiteur(page, 300);
    verif("la grille est descendue de 300 px", place === 300, String(place));
    await cliquer(page, `[data-carte] a[href*="${SLUG}"]`);
    await page.waitForFunction(() => location.pathname.startsWith("/artist/"), null, { timeout: 20000 });
    await attendre(page, 1600);
    /*  ⚠️ C'EST L'EXCEPTION DE LA nº 506, REPRISE À LA nº 889 : la
        fenêtre pose `data-fenetre-fiche` sur <html>, et l'arrivée en
        haut s'abstient. Sans elle, la mosaïque remonterait derrière le
        voile et le retour rendrait une autre page. */
    verif("… la fenêtre est bien ouverte (la marque est posée)",
      (await page.evaluate(() => document.documentElement.dataset.fenetreFiche ?? null)) !== null,
      String(await page.evaluate(() => document.documentElement.dataset.fenetreFiche ?? null)));
    /*  ⚠️ SOUS LA FENÊTRE, LE CORPS EST GELÉ — `position: fixed;
        top: -300px` (lib/gel-du-corps) — et `window.scrollY` y vaut
        ZÉRO par construction. Lire `scrollY` ici ne mesurerait pas le
        défilement, mais le gel. La place retenue se lit sur le corps,
        et c'est elle qui dit que la grille n'a pas bougé. */
    const sousLeGel = await page.evaluate(() => {
      const t = document.body.style.top;
      return t ? Math.abs(parseInt(t, 10)) : null;
    });
    verif("… et la grille est GELÉE à sa place, pas remontée",
      sousLeGel === place, `${sousLeGel} / ${place}`);
    await page.goBack();
    await attendre(page, 1800);
    verif("… et la refermer rend la grille exactement où elle était",
      (await ou(page)) === place, `${await ou(page)} / ${place}`);
  } catch (e) {
    verif("déroulement du banc 889 (§5)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

/*  ██ LES ONGLETS SONT MESURÉS PAR LE BANC 882, PAS ICI ██
    « Changer d'onglet REMPLACE l'étape » (nº 875 §1) et « un seul
    retour ramène au fil » se mesurent AVEC DE VRAIS TOUCHERS
    (`pointerdown` / `pointerup`) : c'est ce relâchement-là que le filet
    de retour écoute, et un `click` nu ne l'émet pas. Le banc 882 le
    fait déjà, il est rejoué à cette passe, et il vérifie AUSSI que ces
    onglets rouvrent en haut. Deux bancs pour une règle finiraient par
    diverger (piège nº 378). */

bilan();
