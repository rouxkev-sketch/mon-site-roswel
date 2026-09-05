//  ██ BANC 860 — DEUX PAGES D'ACCUEIL, ET DEUX DÉFILEMENTS ██
//  ==================================================================
//  Les quatre points de la passe :
//   1. DEUX ADRESSES — « / » (Tattoo) et « /flash » (Flash) : même
//      présentation, même catalogue, chacune sa nature. Le va-et-vient
//      est devenu une NAVIGATION : deux liens, et l'onglet actif se dit
//      « page courante ».
//   2. LE DÉFILEMENT — chaque page garde SA position, par la mémoire du
//      site : Tattoo au fond → Flash arrive en haut → Flash à 300 →
//      retour Tattoo à SA place. Aucune influence entre les deux.
//   3. LE MAGASIN DE SESSION de la nº 857 n'existe plus : l'adresse
//      décide, et le va-et-vient garde son apparence (nº 858-859).
//   4. LE WEB — l'adresse répond, avec le même contenu ; le va-et-vient
//      n'y est pas affiché, mais ses deux liens sont dans le document.
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan } from "./banc-socle.mjs";

//  nº 863-§1 — les deux positions sont devenues des TITRES, toujours entiers.
const TATTOO = "Explore tattoo styles", FLASH = "Explore flash styles";

const SONDE = `() => {
  const r = (n) => { if (!n) return null; const x = n.getBoundingClientRect();
    return { y: +x.top.toFixed(1), bas: +x.bottom.toFixed(1), h: +x.height.toFixed(1), l: Math.round(x.width) }; };
  const vv = document.querySelector("[data-va-et-vient-nature]");
  const groupe = vv?.querySelector("nav");
  const liens = vv ? [...vv.querySelectorAll("a")] : [];
  const boite = groupe ? [...groupe.children].find((n) => n.tagName === "DIV" && Math.round(n.getBoundingClientRect().height) === 3) : null;
  const grille = document.querySelector("[data-catalogue-styles]");
  const barre = document.querySelector("[data-barre-fixe]");
  const reserve = document.querySelector("[data-reserve-barre]");
  const main = document.querySelector("main");
  const contenu = main ? [...main.children].find((n) =>
    n.getBoundingClientRect().height > 0 && !n.hasAttribute("data-air-sous-barre")) : null;
  return {
    adresse: location.pathname, y: Math.round(window.scrollY),
    vv: r(vv), estUneNavigation: Boolean(groupe),
    resteUnGroupeDeBoutons: Boolean(vv?.querySelector("[role='radiogroup'], [role='radio']")),
    ligne: r(boite?.querySelector("span:first-child")),
    liens: liens.map((a) => ({ href: a.getAttribute("href"), courant: a.getAttribute("aria-current"),
      nom: a.getAttribute("aria-label"), texte: a.textContent.trim(),
      dessin: Boolean(a.querySelector("svg")), ...r(a) })),
    grille: grille ? { nature: grille.dataset.nature, cartes: grille.children.length,
      adresses: [...grille.querySelectorAll("a")].map((a) => a.getAttribute("href")) } : null,
    barre: r(barre), reserve: reserve ? Number(reserve.dataset.reservePosee) : null,
    contenu: r(contenu),
    //  §3 — le magasin de la nº 857 écrivait sa nature ici.
    magasin: (() => { try { return sessionStorage.getItem("yokofolio:nature-accueil"); } catch { return "?"; } })(),
  };
}`;
const sonder = (page) => page.evaluate((S) => new Function("return " + S)()(), SONDE);

//  ══ 1 ET 3 · LES DEUX PAGES, AU DOIGT ════════════════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    for (const [nom, chemin, nature, autre] of [
      ["l'accueil Tattoo", "/", "tatouage", "/flash"],
      ["l'accueil Flash", "/flash", "flash", "/"],
    ]) {
      titre(`860 · §1 — ${nom} (${chemin})`);
      await page.goto(`${BASE}${chemin}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1400);
      const v = await sonder(page);
      verif("l'adresse répond, et montre les cartes de style de SA nature",
        v.grille?.nature === nature && v.grille.cartes > 0
          && v.grille.adresses.every((a) => a.includes(`nature=${nature}`)),
        v.grille ? `${v.grille.cartes} carte(s) · ${v.grille.adresses[0]}` : "grille absente");
      verif("le va-et-vient est une NAVIGATION : deux liens, plus un groupe de boutons",
        v.estUneNavigation && v.liens.length === 2 && v.resteUnGroupeDeBoutons === false,
        `nav ${v.estUneNavigation} · ${v.liens.length} lien(s) · reste des boutons : ${v.resteUnGroupeDeBoutons}`);
      const ici = v.liens.find((l) => l.href === chemin);
      const laBas = v.liens.find((l) => l.href === autre);
      verif("… le lien de CETTE page se dit « page courante », et porte la phrase entière",
        ici?.courant === "page" && ici.dessin && ici.texte === (nature === "flash" ? FLASH : TATTOO),
        `« ${ici?.texte} » · aria-current ${ici?.courant} · ${ici?.l} px`);
      //  nº 863-§1 — plus de mot court ni de colonne de 88 : le titre
      //  entier de l'autre page, dans une colonne égale.
      verif("… celui de l'autre page ne dit rien, et porte son titre entier (nº 863)",
        laBas && laBas.courant === null && laBas.dessin
          && laBas.texte === (nature === "flash" ? TATTOO : FLASH) && laBas.l === ici?.l,
        `« ${laBas?.texte} » · aria-current ${laBas?.courant} · ${laBas?.l} px`);
      /*  §3 — L'APPARENCE NE BOUGE PAS D'UN PIXEL : la boîte de la nº 858
          (46 = 43 + la ligne de 3), la ligne bord à bord, la réserve. */
      verif("… et l'apparence est celle des nº 858-859 : 46 px, ligne bord à bord, réserve 116",
        v.vv?.h === 46 && v.ligne?.h === 1 && v.ligne.l === 390 && v.reserve === 116
          && v.barre?.bas === v.ligne.bas,
        `va-et-vient ${v.vv?.h} · ligne ${v.ligne?.l} px · réserve ${v.reserve} · barre ${v.barre?.bas}`);
      verif("… l'air de la nº 859 est là, au cran de la nº 863 : seize pixels sous la ligne",
        v.contenu && v.ligne && Math.round(v.contenu.y - v.ligne.bas) === 16,
        `${Math.round((v.contenu?.y ?? 0) - (v.ligne?.bas ?? 0))} px`);
      verif("… et le magasin de session de la nº 857 n'écrit plus rien (§3)",
        v.magasin === null, `${v.magasin}`);
    }
  } catch (e) {
    verif("déroulement du banc 860 (§1-§3)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · LES DEUX DÉFILEMENTS ═════════════════════════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("860 · §2 — chaque page garde SA position");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1400);
    /*  ⚠️ LA CIBLE EST BORNÉE PAR LA PAGE : le propriétaire dit 800 px,
        et c'est la bonne demande sur son téléphone ; l'atelier n'a que
        quelques styles, sa page est plus courte. On descend AUSSI LOIN
        QUE LA PAGE LE PERMET, et l'on vérifie que CE nombre-là revient —
        la règle est l'indépendance, pas un chiffre. */
    const bas = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    await page.evaluate((c) => window.scrollTo(0, c), Math.min(800, bas));
    await page.waitForTimeout(700);
    const surTattoo = await page.evaluate(() => Math.round(window.scrollY));
    verif("on descend dans Tattoo", surTattoo > 100, `${surTattoo} px (page défilable sur ${bas})`);

    const aller = async (vers) => {
      await page.locator(`[data-va-et-vient-nature] a[href='${vers}']`).tap();
      await page.waitForFunction((c) => location.pathname === c, vers, { timeout: 20000 });
      await page.waitForTimeout(1500);
      return page.evaluate(() => Math.round(window.scrollY));
    };
    const arriveeFlash = await aller("/flash");
    verif("Flash s'ouvre EN HAUT : la position de Tattoo ne l'a pas suivi",
      arriveeFlash === 0, `${arriveeFlash} px`);
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(700);
    const retourTattoo = await aller("/");
    verif("revenir à Tattoo rend SA place, pas celle de Flash",
      retourTattoo === surTattoo, `${retourTattoo} px (laissé à ${surTattoo})`);
    const retourFlash = await aller("/flash");
    verif("et revenir à Flash rend la sienne",
      retourFlash === 300, `${retourFlash} px (laissé à 300)`);
    /*  ET LE RETOUR DU NAVIGATEUR MARCHE COMME PARTOUT : ce sont deux
        pages, l'historique les traverse. */
    await page.goBack();
    await page.waitForTimeout(1600);
    const arriere = await sonder(page);
    verif("le retour du navigateur ramène à l'autre page, à sa place",
      arriere.adresse === "/" && arriere.y === surTattoo,
      `${arriere.adresse} à ${arriere.y} px`);
  } catch (e) {
    verif("déroulement du banc 860 (§2)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4 · LE WEB ══════════════════════════════════════════════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("860 · §4 — au web, l'adresse répond et les liens sont dans le document");
    for (const [chemin, nature] of [["/", "tatouage"], ["/flash", "flash"]]) {
      await page.goto(`${BASE}${chemin}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
      const v = await sonder(page);
      verif(`${chemin} rend le même contenu, dans sa nature`,
        v.grille?.nature === nature && v.grille.cartes > 0,
        v.grille ? `${v.grille.nature} · ${v.grille.cartes} carte(s)` : "grille absente");
      verif(`${chemin} : le va-et-vient n'est pas AFFICHÉ au web…`,
        v.vv === null || v.vv.h === 0, `${v.vv ? `${v.vv.h} px` : "absent"}`);
      verif(`${chemin} : … mais ses deux liens sont bien dans le document`,
        v.liens.length === 2 && v.liens.some((l) => l.href === "/") && v.liens.some((l) => l.href === "/flash"),
        v.liens.map((l) => l.href).join(" | "));
    }
  } catch (e) {
    verif("déroulement du banc 860 (§4)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

bilan();
