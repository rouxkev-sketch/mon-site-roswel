//  ██ BANC 861 — /flash CHARGE À CHAQUE FOIS ██
//  ==================================================================
//  LE BOGUE, MESURÉ AVANT D'Y TOUCHER : dans Flash, après un
//  aller-retour, la page restait bloquée sur un squelette — et sur le
//  MAUVAIS, celui de la grille de cartes — sans jamais charger.
//  LA CAUSE : « /flash » ne figurait pas dans la liste des écrans de
//  mosaïque (`estLaMosaique`, lib/chemin-recherche). Or c'est elle qui
//  décide du rafraîchissement de LA REQUÊTE GELÉE (lib/adresse-courante)
//  — gelée exprès, pour qu'une fiche ouverte par-dessus ne l'efface pas.
//  « /flash » héritait donc de la requête d'un écran précédent, ne s'y
//  retrouvait pas, et se déclarait EN CHANTIER pour toujours.
//  CE BANC REJOUE LES DEUX CHEMINS, dix fois chacun :
//   · celui du propriétaire — accueil → Flash → retour → Flash ;
//   · CELUI QUI CASSAIT — avec une recherche au milieu, c'est-à-dire
//     une requête gelée qui n'est pas celle de Flash.
//  Les deux véhicules du retour sont éprouvés : le lien du va-et-vient
//  (navigation douce) et le bouton du navigateur.
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan } from "./banc-socle.mjs";

const ETAT = `() => {
  const main = document.querySelector("main");
  const grille = document.querySelector("[data-catalogue-styles]");
  return {
    adresse: location.pathname + location.search,
    //  LES TROIS SIGNES DU CHANTIER, ensemble : la page se dit occupée,
    //  son corps ne se peint pas, et le squelette de cartes le couvre.
    busy: main?.getAttribute("aria-busy") === "true",
    invisible: (main?.className ?? "").includes("invisible"),
    squelette: Boolean(document.querySelector(".animate-pulse")),
    catalogue: grille ? { nature: grille.dataset.nature, cartes: grille.children.length,
      visible: grille.getBoundingClientRect().height > 0 } : null,
  };
}`;
const lire = (page) => page.evaluate((S) => new Function("return " + S)()(), ETAT);
/** Flash a chargé : son catalogue est là, visible, et rien ne le couvre. */
const aCharge = (v) =>
  v.adresse === "/flash" && !v.busy && !v.invisible && !v.squelette
  && v.catalogue?.nature === "flash" && v.catalogue.cartes > 0 && v.catalogue.visible;

const versFlash = async (page) => {
  await page.locator("[data-va-et-vient-nature] a[href='/flash']").tap();
  await page.waitForFunction(() => location.pathname === "/flash", { timeout: 20000 });
  await page.waitForTimeout(1600);
};

//  ══ 1 · LE CHEMIN DU PROPRIÉTAIRE, DIX FOIS ══════════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("861 · accueil → Flash → retour → Flash, dix fois");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1400);
    const ratés = [];
    for (let tour = 1; tour <= 10; tour += 1) {
      await versFlash(page);
      const v = await lire(page);
      if (!aCharge(v)) ratés.push(`tour ${tour} : ${JSON.stringify(v)}`);
      //  UN TOUR SUR DEUX PAR LE BOUTON DU NAVIGATEUR, l'autre par le
      //  lien du va-et-vient : les deux véhicules du retour.
      if (tour % 2 === 0) await page.goBack();
      else await page.locator("[data-va-et-vient-nature] a[href='/']").tap();
      await page.waitForFunction(() => location.pathname === "/", { timeout: 20000 });
      await page.waitForTimeout(1400);
    }
    verif("Flash a chargé aux DIX tours", ratés.length === 0,
      ratés.length ? ratés[0] : "10 / 10");
  } catch (e) {
    verif("déroulement du banc 861 (chemin simple)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · LE CHEMIN QUI CASSAIT : UNE RECHERCHE AU MILIEU ══════════════
/*  C'est LUI le bogue. Une carte de style mène à « /search?style=…&
    nature=flash » : cette requête-là se gelait, et « /flash » n'avait
    aucun moyen de la corriger. Le retour laissait donc la page en
    chantier, pour toujours. */
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("861 · Flash → une carte de style → retour vers Flash, dix fois");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1400);
    const ratés = [];
    for (let tour = 1; tour <= 10; tour += 1) {
      await versFlash(page);
      //  On descend dans une recherche : c'est elle qui gèle sa requête.
      await page.locator("[data-catalogue-styles] a").first().tap();
      await page.waitForFunction(() => location.pathname.startsWith("/search"), { timeout: 25000 });
      await page.waitForTimeout(1800);
      //  Puis on revient sur Flash — par le bouton un tour sur deux.
      if (tour % 2 === 0) {
        await page.goBack();
        await page.waitForFunction(() => location.pathname === "/flash", { timeout: 20000 });
      } else {
        await page.goto(`${BASE}/flash`, { waitUntil: "domcontentloaded" });
      }
      await page.waitForTimeout(2200);
      const v = await lire(page);
      if (!aCharge(v)) ratés.push(`tour ${tour} : ${JSON.stringify(v)}`);
      //  Et l'on repart de l'accueil pour le tour suivant.
      await page.locator("[data-va-et-vient-nature] a[href='/']").tap().catch(() => {});
      await page.waitForTimeout(1400);
    }
    verif("Flash a chargé aux DIX tours, recherche au milieu comprise",
      ratés.length === 0, ratés.length ? `${ratés.length} raté(s) · ${ratés[0]}` : "10 / 10");
  } catch (e) {
    verif("déroulement du banc 861 (recherche au milieu)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3 · L'ANCIENNE ADRESSE PARTAGÉE, QUI GÈLE AUSSI SA REQUÊTE ═══════
/*  « /?style=… » est un lien déjà partagé : le proxy le sert par
    réécriture, mais LE CHEMIN DU NAVIGATEUR RESTE « / » — sa requête se
    gèle donc elle aussi. On vérifie qu'elle ne bloque plus Flash. */
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("861 · depuis une ancienne adresse partagée (« /?style=… »)");
    await page.goto(`${BASE}/?style=blackwork&nature=tatouage`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1400);
    await versFlash(page);
    const v = await lire(page);
    verif("Flash charge après un passage par l'ancienne adresse", aCharge(v), JSON.stringify(v));
  } catch (e) {
    verif("déroulement du banc 861 (ancienne adresse)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

bilan();
