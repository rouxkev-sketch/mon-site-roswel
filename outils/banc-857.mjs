//  ██ BANC 857 — LE VA-ET-VIENT TATTOO / FLASH, FIXE, ET MA SÉLECTION FIXE ██
//  ======================================================================
//  Les cinq points de la passe, au doigt (le web ne change pas, et on le
//  vérifie) :
//   1. L'ACCUEIL : plus de champ ; un va-et-vient à deux positions, la
//      position active avec icône + texte, l'inactive avec l'icône seule ;
//      un tap bascule.
//   2. IL EST FIXE : la page défile sous sa ligne de séparation, qui court
//      bord à bord.
//   3. LA LOUPE est dans la barre, allumée, et ouvre la recherche.
//   4. L'ACCUEIL FLASH : mêmes cartes de style, même titre « style +
//      portfolios », mêmes adresses — sur les flashs ; la position tient
//      au rechargement (mémoire de session).
//   5. MA SÉLECTION : son va-et-vient est fixe lui aussi, aucune marge
//      sous sa ligne, et le squelette promet la même chose.
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs` — la doublure porte un
//  flash par fiche depuis la nº 857.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, rest, effacer } from "./banc-socle.mjs";

/** Ce que l'accueil montre au doigt, en un relevé. */
const RELEVE_ACCUEIL = `() => {
  const r = (n) => { if (!n) return null; const x = n.getBoundingClientRect();
    return { y: Math.round(x.top), bas: Math.round(x.bottom), x: Math.round(x.left), droite: Math.round(x.right), h: Math.round(x.height), l: Math.round(x.width) }; };
  const vv = document.querySelector("[data-va-et-vient-nature]");
  const boutons = vv ? [...vv.querySelectorAll("[role='radio']")] : [];
  const grille = document.querySelector("[data-catalogue-styles]");
  const loupe = document.querySelector("[data-loupe-barre]");
  const reserve = document.querySelector("[data-reserve-barre]");
  const rangee = document.querySelector("[data-rangee-moteur]");
  return {
    affichage: vv ? getComputedStyle(vv).display : "absent",
    vv: r(vv), rangee: r(rangee),
    //  §1 (nº 858) — LE VA-ET-VIENT EST DEVENU CELUI DU SITE
    //  (OngletsLigne) : il n'émet plus d'attribut par position. On les
    //  lit dans leur ORDRE (tattoo, puis flash) et par leur NOM
    //  accessible, qui est le vrai contrat de cet onglet-là.
    positions: boutons.map((b, rang) => ({ nature: rang === 0 ? "tatouage" : "flash",
      active: b.getAttribute("aria-checked") === "true",
      texte: b.textContent.trim(), nom: b.getAttribute("aria-label"), dessin: Boolean(b.querySelector("svg")), ...r(b) })),
    //  §1 (nº 858) — LA LIGNE EST CELLE DU COMPOSANT DU SITE : la boîte
    //  de trois pixels sous la piste, et le trait gris qu'elle porte.
    ligne: r([...(vv?.querySelector("[role='radiogroup']")?.children ?? [])]
      .filter((n) => n.tagName === "DIV" && Math.round(n.getBoundingClientRect().height) === 3)
      .map((n) => n.querySelector("span"))[0]),
    loupe: loupe ? { opacite: Number(getComputedStyle(loupe).opacity), visibilite: getComputedStyle(loupe).visibility, affichage: getComputedStyle(loupe).display } : null,
    reserve: reserve ? Number(reserve.dataset.reservePosee) : null,
    grille: grille ? { nature: grille.dataset.nature, cartes: grille.children.length,
      adresses: [...grille.querySelectorAll("a")].map((a) => a.getAttribute("href")),
      textes: [...grille.children].map((c) => c.textContent.trim()) } : null,
    //  LE CHAMP DU WEB VIT DANS LE DOCUMENT aux deux appareils (le moteur
    //  est monté partout) ; ce qui compte est qu'il ne soit pas VISIBLE au
    //  doigt — on relève sa boîte, et zéro veut dire absent de l'écran.
    champWeb: r(rangee?.querySelector("input, [role='combobox']")),
    largeur: window.innerWidth, y: Math.round(window.scrollY),
  };
}`;
const releve = (page) => page.evaluate((R) => new Function("return " + R)()(), RELEVE_ACCUEIL);
const TATTOO = "Find your tattoo style…", FLASH = "Find your Flash style…";

//  ══ 1-2-3-4 · L'ACCUEIL AU DOIGT ═════════════════════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("857 · doigt — l'accueil : le va-et-vient, fixe, et la loupe");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const v = await releve(page);
    verif("plus de champ à l'écran : le va-et-vient à deux positions est là",
      v.affichage !== "none" && v.positions.length === 2 && (v.champWeb === null || v.champWeb.h === 0),
      `${v.positions.length} position(s) · champ ${v.champWeb && v.champWeb.h > 0 ? "visible" : "hors écran"}`);
    const [tattoo, flash] = v.positions;
    verif("la position ACTIVE (tattoo) montre icône + texte",
      tattoo?.active && tattoo.dessin && tattoo.texte === TATTOO, `« ${tattoo?.texte} » · dessin ${tattoo?.dessin}`);
    verif("la position INACTIVE (flash) montre l'icône SEULE, et garde son nom pour les lecteurs d'écran",
      flash && !flash.active && flash.dessin && flash.texte === "" && flash.nom === FLASH && flash.l === 43,
      `texte « ${flash?.texte} » · nom « ${flash?.nom} » · ${flash?.l} px`);
    verif("sa hauteur est celle du champ qu'il remplace (46 = 43 + la ligne de 3) ; la réserve dit la vraie barre (116, nº 858)",
      v.vv?.h === 46 && v.rangee?.h === 58 && v.reserve === 116, `va-et-vient ${v.vv?.h} · rangée ${v.rangee?.h} · réserve ${v.reserve}`);
    verif("sa ligne de séparation court BORD À BORD",
      v.ligne && v.ligne.x === 0 && v.ligne.droite === v.largeur && v.ligne.h === 1, v.ligne ? `${v.ligne.x} → ${v.ligne.droite} sur ${v.largeur}` : "ligne absente");
    verif("la LOUPE est dans la barre, allumée (§3)",
      v.loupe && v.loupe.opacite === 1 && v.loupe.visibilite === "visible" && v.loupe.affichage !== "none",
      v.loupe ? `opacité ${v.loupe.opacite} · ${v.loupe.visibilite}` : "loupe absente");
    verif("l'accueil montre les cartes de style des TATTOOS, adressées à leur nature",
      v.grille && v.grille.nature === "tatouage" && v.grille.cartes > 0 && v.grille.adresses.every((a) => a.includes("nature=tatouage")),
      v.grille ? `${v.grille.cartes} carte(s) · ${v.grille.adresses[0]}` : "grille absente");

    //  2 · FIXE : la page défile, le va-et-vient ne bouge pas.
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(800);
    const d = await releve(page);
    verif("APRÈS DÉFILEMENT, le va-et-vient n'a pas bougé d'un pixel — il est FIXE",
      //  ⚠️ LE SEUIL A BAISSÉ (nº 858) : la page raccourcit de vingt
      //  pixels quand la bande noire s'en va, et l'accueil ne défile
      //  plus jusqu'à 300. On demande donc qu'elle ait VRAIMENT bougé,
      //  sans exiger un nombre qui dépend de la hauteur du contenu.
      d.y >= 200 && d.vv?.y === v.vv?.y && d.ligne?.y === v.ligne?.y && d.reserve === 116,
      `page à ${d.y} · va-et-vient ${v.vv?.y} → ${d.vv?.y} · ligne ${v.ligne?.y} → ${d.ligne?.y}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);

    //  4 · UN TAP BASCULE : l'accueil FLASH.
    await page.locator("[data-va-et-vient-nature] [role='radio']").nth(1).tap();
    await page.waitForTimeout(900);
    const f = await releve(page);
    const [tattoo2, flash2] = f.positions;
    verif("un tap sur l'éclair BASCULE : Flash actif (icône + texte), Tattoo réduit à sa goutte",
      flash2?.active && flash2.texte === FLASH && tattoo2 && !tattoo2.active && tattoo2.texte === "" && tattoo2.l === 43,
      `flash « ${flash2?.texte} » · tattoo « ${tattoo2?.texte} » ${tattoo2?.l} px`);
    verif("l'accueil FLASH : mêmes cartes de style, adressées aux flashs",
      f.grille && f.grille.nature === "flash" && f.grille.cartes > 0 && f.grille.adresses.every((a) => a.includes("nature=flash")),
      f.grille ? `${f.grille.cartes} carte(s) · ${f.grille.adresses[0]}` : "grille absente");
    verif("… et le même titre « style + portfolios » sur chaque carte",
      f.grille && f.grille.textes.every((t) => /\d+ portfolios?$/.test(t)), f.grille ? `« ${f.grille.textes[0]} »` : "grille absente");
    verif("le va-et-vient n'a pas changé de hauteur en basculant (rien ne saute)",
      f.vv?.h === 46 && f.vv?.y === v.vv?.y && f.reserve === 116, `${f.vv?.h} px @ ${f.vv?.y}`);

    //  LA POSITION TIENT AU RECHARGEMENT (mémoire de session), puis on revient.
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const r2 = await releve(page);
    verif("la position Flash tient au rechargement (mémoire de session)",
      r2.positions.find((p) => p.active)?.nature === "flash" && r2.grille?.nature === "flash",
      `active ${r2.positions.find((p) => p.active)?.nature} · grille ${r2.grille?.nature}`);
    await page.locator("[data-va-et-vient-nature] [role='radio']").nth(0).tap();
    await page.waitForTimeout(700);
    const t = await releve(page);
    verif("un second tap ramène Tattoo",
      t.positions.find((p) => p.active)?.nature === "tatouage" && t.grille?.nature === "tatouage", `grille ${t.grille?.nature}`);

    //  3 · LA LOUPE OUVRE LA RECHERCHE.
    await page.locator("[data-loupe-barre]").tap();
    await page.waitForTimeout(900);
    const ouverte = await page.evaluate(() => Boolean(document.querySelector('[role="dialog"][aria-label="Find a tattoo artist"]')));
    verif("un tap sur la loupe ouvre la recherche plein écran", ouverte === true);
  } catch (e) {
    verif("déroulement du banc 857 (accueil doigt)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ LE WEB NE CHANGE PAS ═════════════════════════════════════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("857 · web — l'accueil ne change pas");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const v = await releve(page);
    verif("le va-et-vient n'est pas affiché, le champ du moteur tient la rangée",
      v.affichage === "none" && v.champWeb !== null && v.champWeb.h === 46, `va-et-vient ${v.affichage} · champ ${v.champWeb?.h} px`);
    verif("la loupe reste retirée de la barre au web", v.loupe?.affichage === "none", `${v.loupe?.affichage}`);
    verif("les cartes de style sont celles des tattoos", v.grille?.nature === "tatouage" && v.grille.cartes > 0, `${v.grille?.nature} · ${v.grille?.cartes}`);
  } catch (e) {
    verif("déroulement du banc 857 (accueil web)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 5 · MA SÉLECTION AU DOIGT : FIXE, SANS MARGE, SANS SAUT ══════════
{
  const U = { id: "30000000-0000-4000-8000-000000000857", email: "banc-857@yokofolio.test" };
  await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});
  await effacer("favoris_photos", `utilisateur_id=eq.${U.id}`);
  //  Trente favoris : de quoi faire défiler la page.
  const photos = (await lire("photos_tatoueur", "select=id,nature")).filter((p) => p.nature === "tatouage").slice(0, 30);
  await ranger("favoris_photos", photos.map((p, i) => ({
    utilisateur_id: U.id, photo_id: p.id, cree_le: `2026-01-01T00:00:${String(59 - i).padStart(2, "0")}Z`,
  })));
  const { nav, page } = await ouvrir("doigt", { session: U });
  const RELEVE = `() => {
    const r = (n) => { if (!n) return null; const x = n.getBoundingClientRect(); return { y: Math.round(x.top), bas: Math.round(x.bottom), h: Math.round(x.height) }; };
    const rangee = document.querySelector("[data-rangee-moteur]");
    const groupe = rangee?.querySelector("[role='radiogroup']");
    const reserve = document.querySelector("[data-reserve-barre]");
    const air = document.querySelector("[data-air-sous-barre]");
    const main = document.querySelector("main");
    const premier = main ? [...main.children].find((n) => n.getBoundingClientRect().height > 0 && !n.hasAttribute("data-air-sous-barre")) : null;
    return { rangee: r(rangee), groupe: r(groupe), reserve: reserve ? { posee: Number(reserve.dataset.reservePosee), bas: Math.round(reserve.getBoundingClientRect().bottom) } : null,
      air: air ? Math.round(air.getBoundingClientRect().height) : null, premier: r(premier), y: Math.round(window.scrollY) };
  }`;
  const lireSelection = () => page.evaluate((R) => new Function("return " + R)()(), RELEVE);
  try {
    titre("857 · doigt — « Ma sélection » : le va-et-vient fixe, sans marge");
    await page.goto(`${BASE}/my-favorites`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const v = await lireSelection();
    verif("le va-et-vient Favoris | Portfolios est dans la rangée fixe de la barre",
      v.groupe && v.groupe.h === 46 && v.rangee?.h === 58 && v.reserve?.posee === 116, `groupe ${v.groupe?.h} · rangée ${v.rangee?.h} · réserve ${v.reserve?.posee}`);
    verif("AUCUNE marge sous sa ligne : le contenu commence pile au bas de la réserve",
      v.air === 0 && v.premier && v.reserve && v.premier.y === v.reserve.bas,
      `air ${v.air} px · contenu à ${v.premier?.y} pour une réserve finissant à ${v.reserve?.bas}`);
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(800);
    const d = await lireSelection();
    verif("APRÈS DÉFILEMENT, le va-et-vient n'a pas bougé — il est FIXE lui aussi",
      d.y >= 400 && d.groupe?.y === v.groupe?.y && d.rangee?.y === v.rangee?.y, `page à ${d.y} · va-et-vient ${v.groupe?.y} → ${d.groupe?.y}`);

    /*  ██ nº 858 — LE SQUELETTE SE MESURE AU BANC 858 ██
        Ce banc croyait le mesurer et ne le mesurait pas : sur un
        chargement complet, la doublure répond plus vite que le squelette
        ne paraît, et la comparaison portait en réalité sur la page
        ARRIVÉE — deux fois la même valeur, verte pour rien. La mesure
        juste (navigation douce, et la RÉSERVE du squelette plutôt que
        ses cartes, qu'une garde peut ne pas peindre) vit au banc 858 :
        deux bancs ne diront pas deux vérités sur le même sujet. */
  } catch (e) {
    verif("déroulement du banc 857 (Ma sélection)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

bilan();
