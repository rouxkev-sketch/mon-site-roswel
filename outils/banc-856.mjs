//  ██ BANC 856 — LES BADGES REMIS, LE WEB D'UN CRAN, LE FANION SUR SA LIGNE ██
//  ========================================================================
//  Les quatre points de la passe, et rien d'autre :
//   1-2. AU DOIGT, les badges du type ET ceux de la recherche reviennent
//        à l'état du bâti nº 854 — boîte de 30, air latéral 14, corps 14 —
//        et l'ENCRE se mesure aux mêmes nombres qu'alors (relevé nº 855,
//        avant tout changement) : compte 10·8·15, filtre 10·10·16, type
//        10·11·13 (haut · bas · gauche). « Identique au bâti 854 » se
//        vérifie sur l'encre peinte, pas sur des boîtes.
//   3.   AU WEB, les badges de RECHERCHE montent d'un cran (corps 15) et
//        grandissent EN PROPORTION — les rapports hauteur/corps et
//        air/corps de l'état nº 853 (30/14 et 14/14) se retrouvent à
//        32/15 et 15/15. Le badge du TYPE, lui, n'a pas bougé (30/14/14).
//   4.   AU WEB, le FANION prend place sur la ligne des styles, aligné à
//        droite, hors du lien, sans toucher la photo. Au doigt, cette
//        place n'existe pas (le pied du fil porte déjà le sien).
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";
import { imageDuPng, airsVisuels } from "./mesure-air.mjs";

const RECHERCHE = new URLSearchParams({
  style: "blackwork", nature: "tatouage", lieu: "Lyon", zone: "69",
  lat: "45.76000", lon: "4.83000", niveau: "ville", paysCode: "FR",
  region: "Auvergne-Rhône-Alpes", ville: "Lyon", rayon: "25",
}).toString();
const URL_RECHERCHE = `${BASE}/search?${RECHERCHE}`;

/** LE JEU D'UN PIXEL SUR L'ENCRE, ET SA CAUSE : la carte lue n'est pas
    toujours la même (le fil est mélangé, et les bancs forgent des
    fiches), et sa colonne de grille ne tombe pas sur un pixel entier —
    la capture rastérise donc le premier trait un pixel plus tôt ou plus
    tard selon la carte. Les BOÎTES, elles, se lisent au pixel exact. */
const JEU = 1;
const memeEncre = (b, a) => b && Math.abs(b.haut - a.haut) <= JEU
  && Math.abs(b.bas - a.bas) <= JEU && Math.abs(b.gauche - a.gauche) <= JEU;

/** Un badge : sa boîte (calculée) et ses airs (sur l'encre). */
async function badge(page, selecteur) {
  const poignee = await page.evaluateHandle((s) => [...document.querySelectorAll(s)]
    .find((n) => n.getBoundingClientRect().height > 0) ?? null, selecteur);
  const noeud = poignee.asElement();
  if (!noeud) return null;
  await noeud.scrollIntoViewIfNeeded();
  const boite = await noeud.evaluate((n) => {
    const c = getComputedStyle(n), r = n.getBoundingClientRect();
    const partie = [...n.childNodes].find((x) => x.nodeType === 3 || x.tagName === "SPAN");
    let fin = r.width;
    if (partie) { const pl = document.createRange(); pl.selectNodeContents(partie); fin = pl.getBoundingClientRect().right - r.left + 2; }
    return { h: Math.round(r.height), pad: parseFloat(c.paddingLeft), corps: parseFloat(c.fontSize),
             xTexteFin: Math.round(fin), mot: n.textContent.trim() };
  });
  const img = imageDuPng(await noeud.screenshot({ scale: "css" }));
  const a = airsVisuels(img, { bord: 0, xTexteFin: boite.xTexteFin });
  return { ...boite, haut: a.haut, bas: a.bas, gauche: a.gauche };
}
const dit = (b) => b ? `boîte ${b.h} · air ${b.pad} · corps ${b.corps} · encre ${b.haut}·${b.bas}·${b.gauche}` : "absent";

//  ══ 1-2 · AU DOIGT, TOUT REVIENT AU BÂTI 854 ═════════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("856 · doigt — les badges, identiques au bâti 854");
    await page.goto(URL_RECHERCHE, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-filtre-actif]", { state: "visible", timeout: 20000 });
    await page.waitForTimeout(900);
    const attendu = { //  LE RELEVÉ DU BÂTI 854 (fait à la nº 855, avant tout changement)
      "[data-badge-compte]": { h: 30, pad: 14, corps: 14, haut: 10, bas: 8, gauche: 15, nom: "compte" },
      "[data-filtre-actif]": { h: 30, pad: 14, corps: 14, haut: 10, bas: 10, gauche: 16, nom: "filtre" },
      "[data-badge-type]":   { h: 30, pad: 14, corps: 14, haut: 10, bas: 11, gauche: 13, nom: "type" },
    };
    for (const [sel, a] of Object.entries(attendu)) {
      const b = await badge(page, sel);
      verif(`${a.nom} : boîte 30, air 14, corps 14 — comme au bâti 854`,
        b && b.h === a.h && b.pad === a.pad && b.corps === a.corps, dit(b));
      verif(`${a.nom} : la même encre qu'au bâti 854 (${a.haut}·${a.bas}·${a.gauche}, au pixel près)`,
        memeEncre(b, a), dit(b));
    }
  } catch (e) {
    verif("déroulement du banc 856 (doigt)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3 · AU WEB, LA RECHERCHE MONTE D'UN CRAN, EN PROPORTION ══════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("856 · web — la recherche d'un cran plus grande, le type intact");
    await page.goto(URL_RECHERCHE, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-filtre-actif]", { state: "visible", timeout: 20000 });
    await page.waitForTimeout(900);
    const compte = await badge(page, "[data-badge-compte]");
    const filtre = await badge(page, "[data-filtre-actif]");
    const type = await badge(page, "[data-badge-type]");
    for (const [nom, b] of [["compte", compte], ["filtre", filtre]]) {
      verif(`${nom} : corps 15, boîte 32, air 15`,
        b && b.corps === 15 && b.h === 32 && b.pad === 15, dit(b));
    }
    /*  LES RAPPORTS DE L'ÉTAT nº 853 (30/14 et 14/14), retrouvés à un
        corps de plus : 32/15 et 15/15. La hauteur ne peut pas être 32,14
        — un demi-pourcent de jeu, c'est l'arrondi au pixel. */
    const rapport = (b) => ({ hauteur: b.h / b.corps, air: b.pad / b.corps });
    const r853 = { hauteur: 30 / 14, air: 14 / 14 };
    const r = rapport(filtre);
    verif("… même rapport hauteur/corps et air/corps qu'à l'état 853 (au pixel près)",
      Math.abs(r.hauteur - r853.hauteur) < 0.02 && Math.abs(r.air - r853.air) < 0.02,
      `hauteur/corps ${r.hauteur.toFixed(3)} (853 : ${r853.hauteur.toFixed(3)}) · air/corps ${r.air.toFixed(3)} (853 : ${r853.air.toFixed(3)})`);
    verif("… et PAS l'air de la 855 : l'encre est à 11·11·16, pas à 15·15·15",
      memeEncre(filtre, { haut: 11, bas: 11, gauche: 16 }), dit(filtre));
    verif("le badge du TYPE des cartes web N'A PAS BOUGÉ (30 / 14 / 14, encre 10·11·13)",
      type && type.h === 30 && type.pad === 14 && type.corps === 14
        && memeEncre(type, { haut: 10, bas: 11, gauche: 13 }), dit(type));
  } catch (e) {
    verif("déroulement du banc 856 (web, badges)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4 · LE FANION SUR LA LIGNE DES STYLES (WEB) ══════════════════════
/*  ⚠️ DE VRAIS IDENTIFIANTS DE BASE : le fanion d'une photo ne se rend que
    pour eux (`estIdentifiantDeBase`) — les fiches de démonstration de la
    doublure n'en ont pas. On forge donc une fiche et ses photos, comme au
    banc 842. */
const T = `banc856-${Date.now()}`;
const ID = `56000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
const TEINTES = ["blackwork", "old-school", "geometrique"];
const photoId = (rang) => `56100000-0000-4000-8000-${rang.toString().padStart(12, "0")}`;
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", { ...gabarit, id: ID, slug: T, nom: "Banc 856", styles: ["blackwork"], ville_slug: `lyon-${T}` });
  await ranger("photos_tatoueur", TEINTES.map((teinte, i) => ({
    id: photoId(i + 1), tatoueur_id: ID, style: "blackwork", rendu: "black", nature: "tatouage",
    url: `/images-demo/tatouage/${teinte}-1.svg`, miniature: `/images-demo/tatouage/${teinte}-1.svg`,
    ordre: i + 1, cree_le: "2026-01-01T00:00:00Z",
  })));
}
const CARTE = `[data-carte]:has([href*="/artist/${T}"])`;
const MOSAIQUE = `${BASE}/search?style=blackwork&nature=tatouage`;

for (const mode of ["web", "doigt"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`856 · ${mode} — le fanion et la ligne des styles`);
    await page.goto(`${MOSAIQUE}&t=${Date.now()}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(CARTE, { timeout: 20000 });
    /*  ⚠️ ON NE GARDE AUCUNE POIGNÉE SUR LA CARTE : la page porte un
        écart d'hydratation antérieur à cette passe (React #418, relevé
        à la nº 856 sur le bâti 855 tel quel), et React RÉGÉNÈRE l'arbre
        côté client juste après le premier rendu — un nœud attrapé trop
        tôt est détaché quand on s'en sert. On attend que ce soit passé,
        puis on fait défiler DANS la page, par le sélecteur. */
    await page.waitForTimeout(1500);
    await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: "center" }), CARTE);
    await page.waitForTimeout(600);
    const vu = await page.evaluate((sel) => {
      const c = document.querySelector(sel);
      const b = (n) => { if (!n) return null; const x = n.getBoundingClientRect();
        return { y: Math.round(x.top), bas: Math.round(x.bottom), droite: Math.round(x.right), h: Math.round(x.height) }; };
    //  nº 876 — LA PHOTO, PAS LE ROND DE L'EN-TÊTE : au web, la première
    //  image de la carte est désormais l'avatar de l'en-tête du fil
    //  (au-dessus de la photo). On prend la première image VISIBLE hors
    //  de l'en-tête.
      const photo = [...c.querySelectorAll("img")].map((i) => i.closest("div")).find((d) => d && !d.closest("[data-en-tete-de-fil]") && d.getBoundingClientRect().height > 0);
      const ligne = [...c.querySelectorAll("p")].find((n) => n.textContent.includes("•"));
      const enveloppe = c.querySelector("[data-fanion-de-ligne]");
      const bouton = enveloppe?.querySelector("button[aria-pressed]");
      return {
        photo: b(photo), ligne: b(ligne), rangee: b(ligne?.parentElement),
        enveloppeVisible: enveloppe ? getComputedStyle(enveloppe).display !== "none" : false,
        fanion: b(bouton), dansLien: bouton ? Boolean(bouton.closest("a")) : null,
        glyphe: b(bouton?.querySelector("svg")),
        fanionsVisibles: [...c.querySelectorAll("button[aria-pressed]")]
          .filter((n) => n.getBoundingClientRect().height > 0).length,
        //  nº 876 — au web, le fanion vit dans le PIED du fil (la carte
        //  de recherche a pris la structure du fil) : on le lit là.
        ligneVisible: ligne ? ligne.getClientRects().length > 0 : false,
        pied: b(c.querySelector("[data-pied-de-fil]")),
        fanionDuPied: (() => { const f = c.querySelector("[data-pied-de-fil] button[aria-pressed]");
          return f ? { ...b(f), dansLien: Boolean(f.closest("a")) } : null; })(),
      };
    }, CARTE);
    if (mode === "web") {
      /*  ⛔ nº 876 — LA LIGNE DES STYLES A DISPARU DES CARTES DE RECHERCHE
          au web (comme au doigt) : la place du fanion SUR cette ligne
          (nº 856, puis nº 859-§4 pour ses quatre pixels) n'existe plus.
          Le fanion est celui du PIED DU FIL, sous la photo — la même
          écriture que la carte du doigt (`PiedDeFil`) : hors du lien,
          quarante pixels, dans la rangée du pied. */
      verif("au web, la place du fanion sur la ligne des styles N'EXISTE PLUS (nº 876)",
        vu.enveloppeVisible === false && vu.ligneVisible === false, `enveloppe visible ${vu.enveloppeVisible} · ligne visible ${vu.ligneVisible}`);
      verif("le fanion est celui du PIED DU FIL, HORS du lien de la carte, quarante pixels",
        vu.fanionDuPied && vu.fanionDuPied.h === 40 && vu.fanionDuPied.dansLien === false,
        vu.fanionDuPied ? `${vu.fanionDuPied.h} px · dans un lien ${vu.fanionDuPied.dansLien}` : "fanion absent du pied");
      verif("… dans la rangée du pied, sous la photo",
        vu.fanionDuPied && vu.pied && vu.photo && vu.fanionDuPied.y >= vu.pied.y && vu.fanionDuPied.bas <= vu.pied.bas && vu.pied.y >= vu.photo.bas,
        vu.fanionDuPied ? `fanion ${vu.fanionDuPied.y}→${vu.fanionDuPied.bas} · pied ${vu.pied?.y}→${vu.pied?.bas} · photo →${vu.photo?.bas}` : "fanion absent du pied");
      verif("… et c'est le seul fanion visible de la carte", vu.fanionsVisibles === 1, `${vu.fanionsVisibles} fanion(s) visible(s)`);
    } else {
      verif("au doigt, la place du fanion sur la ligne des styles N'EXISTE PAS",
        vu.enveloppeVisible === false, `enveloppe visible ${vu.enveloppeVisible}`);
      verif("… et la carte du fil garde son seul fanion, celui du pied",
        vu.fanionsVisibles === 1, `${vu.fanionsVisibles} fanion(s) visible(s)`);
    }
  } catch (e) {
    verif(`déroulement du banc 856 (fanion, ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

bilan();
