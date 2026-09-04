//  ██ BANC 850 — L'AIR VISUEL DES BADGES DE RECHERCHE ██
//  ==================================================================
//  LA RÈGLE DU PROPRIÉTAIRE : « l'air VISUEL — du bord du badge jusqu'aux
//  glyphes (haut de capitale, ligne de base) et jusqu'à la première
//  lettre / au bord de la croix — suit la proportion standard des
//  badges : horizontal légèrement supérieur au vertical », de l'ordre de
//  12 px sur les côtés et 8 en haut et en bas.
//  CE BANC MESURE L'ENCRE, jamais les boîtes (outils/mesure-air.mjs, où
//  la leçon est écrite) : c'est très exactement ce que la nº 848 n'avait
//  pas fait, et pourquoi son air était faux à l'œil tout en étant juste
//  au calcul.
//  IL RESTE COURT, sur consigne : les quatre airs par appareil, et le
//  squelette qui ne saute pas. Rien d'autre.
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan } from "./banc-socle.mjs";
import { imageDuPng, airsVisuels } from "./mesure-air.mjs";

/*  LES DEUX PROPORTIONS VOULUES. Le web en a un cran de plus sur les
    côtés : son texte est d'un cran plus grand, et le propriétaire l'a
    demandé en toutes lettres (« au web, pas assez d'air gauche/droite »). */
const VOULU = {
  doigt: { cotes: 12, vertical: 8, hauteur: 26 },
  web: { cotes: 14, vertical: 8, hauteur: 28 },
};
/*  UNE TOLÉRANCE D'UN PIXEL, ET ELLE EST HONNÊTE : une boîte peut tomber
    sur un demi-pixel, et chaque lettre a son propre flanc (le « 3 » d'un
    compte n'est pas le « B » de Blackwork). On vérifie une PROPORTION,
    pas une gravure. */
const PRES = 1;

const RECHERCHE = new URLSearchParams({
  style: "blackwork", nature: "tatouage", lieu: "Lyon", zone: "69",
  lat: "45.76000", lon: "4.83000", niveau: "ville", paysCode: "FR",
  region: "Auvergne-Rhône-Alpes", ville: "Lyon", rayon: "25",
}).toString();
const URL_RECHERCHE = `${BASE}/search?${RECHERCHE}`;

/** Les quatre airs d'un badge, mesurés sur son encre. */
async function airsDuBadge(page, position) {
  const badge = page.locator("[data-badge-compte],[data-filtre-actif]").nth(position);
  //  ⚠️ AMENÉ DANS LA VUE D'ABORD : au doigt la rangée glisse (nº 847) et
  //  le dernier badge déborde de l'écran — une capture rognée mesurerait
  //  le bord de l'écran au lieu du badge.
  await badge.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const b = await badge.evaluate((n) => {
    const r = n.getBoundingClientRect();
    const s = getComputedStyle(n);
    const croix = n.querySelector("[data-retrait-filtre]");
    return {
      texte: n.textContent.trim(), x: r.x, y: r.y, w: r.width, h: r.height,
      bord: parseFloat(s.borderTopWidth),
      croixX: croix ? croix.getBoundingClientRect().x - r.x : null,
      aCroix: croix !== null,
    };
  });
  const png = await page.screenshot({
    clip: { x: b.x, y: b.y, width: b.w, height: b.h }, scale: "css",
  });
  //  LE TEXTE S'ARRÊTE À LA CROIX : sa boîte est plus haute que les
  //  lettres, elle fausserait la lecture du haut et du bas.
  const a = airsVisuels(imageDuPng(png), { bord: b.bord, xTexteFin: b.croixX ?? b.w });
  return { ...a, ...b };
}

for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`850 · ${mode} — les quatre airs, mesurés sur les lettres`);
    const v = VOULU[mode];
    await page.goto(URL_RECHERCHE, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-filtre-actif]", { state: "visible", timeout: 20000 });
    await page.waitForTimeout(800);

    /*  ON MESURE SUR LE BADGE DU STYLE (« Blackwork »), et c'est le bon
        choix : son mot n'a AUCUN jambage, sa dernière encre EST donc la
        ligne de base — la référence donnée. Le badge de localité
        (« Lyon · 25 mi ») descend sous elle avec son « y », et le compte
        avec son « p » : on lit alors le jambage, pas la ligne de base. */
    const style = await airsDuBadge(page, 1);
    verif("c'est bien le badge du style, et il est sans jambage (sa dernière encre EST la ligne de base)",
      style.texte === "Blackwork", `« ${style.texte} »`);
    verif(`AIR DU HAUT — du bord du badge au haut des capitales : ${v.vertical} px`,
      Math.abs(style.haut - v.vertical) <= PRES, `${style.haut} px`);
    verif(`AIR DU BAS — de la ligne de base au bord du badge : ${v.vertical} px`,
      Math.abs(style.bas - v.vertical) <= PRES, `${style.bas} px`);
    verif(`AIR DE GAUCHE — du bord du badge à la première lettre : ${v.cotes} px`,
      Math.abs(style.gauche - v.cotes) <= PRES, `${style.gauche} px`);
    verif(`AIR DE DROITE — du dessin de la croix au bord du badge : ${v.cotes} px, LE MÊME QU'À GAUCHE`,
      Math.abs(style.droite - v.cotes) <= PRES && Math.abs(style.droite - style.gauche) <= PRES,
      `${style.droite} px pour ${style.gauche} à gauche`);
    verif("et l'horizontal est bien PLUS GRAND que le vertical (la proportion demandée)",
      style.gauche > style.haut && style.droite > style.bas,
      `côtés ${style.gauche}/${style.droite} · haut-bas ${style.haut}/${style.bas}`);

    //  ██ LA MÊME ÉCRITURE POUR TOUS ██ — le compte et la localité
    //  partagent l'air du style, à la lettre près.
    const compte = await airsDuBadge(page, 0);
    const lieu = await airsDuBadge(page, 2);
    verif("le badge du COMPTE porte le même air (une seule écriture pour la rangée)",
      Math.abs(compte.haut - v.vertical) <= PRES &&
      Math.abs(compte.gauche - v.cotes) <= PRES &&
      Math.abs(compte.droite - v.cotes) <= PRES,
      `haut ${compte.haut} · gauche ${compte.gauche} · droite ${compte.droite}`);
    verif("le badge de LOCALITÉ aussi, sa croix comprise",
      Math.abs(lieu.haut - v.vertical) <= PRES &&
      Math.abs(lieu.gauche - v.cotes) <= PRES &&
      Math.abs(lieu.droite - v.cotes) <= PRES,
      `haut ${lieu.haut} · gauche ${lieu.gauche} · droite ${lieu.droite}`);
    verif("les trois badges ont la même hauteur, celle qu'appelle cet air",
      [compte, style, lieu].every((b) => Math.round(b.h) === v.hauteur),
      [compte, style, lieu].map((b) => Math.round(b.h)).join(" | "));
    /*  LA CROIX A GARDÉ SA CIBLE : c'est tout l'objet de sa marge
        négative — l'air se resserre, la surface à toucher non. */
    const croix = await page.evaluate(() => {
      const n = document.querySelector("[data-retrait-filtre]").getBoundingClientRect();
      return { l: Math.round(n.width), h: Math.round(n.height) };
    });
    verif("… et la CIBLE de la croix n'a pas rétréci d'un pixel",
      croix.l === (mode === "doigt" ? 22 : 24) && croix.h === croix.l,
      `${croix.l}×${croix.h}`);
  } catch (e) {
    verif(`déroulement du banc 850 (${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ LE SQUELETTE PROMET LA BONNE HAUTEUR ═════════════════════════════
/*  MESURE FINE AUTORISÉE ICI, sur consigne : c'est le seul endroit où un
    pixel d'écart se voit vraiment — la page sauterait à chaque arrivée. */
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`850 · ${mode} — le squelette promet la rangée qui vient`);
    //  Le procédé d'attrapage est celui du banc nº 845 : on rend la main
    //  dès la navigation COMMISE, puis on interroge toutes les cinq
    //  millisecondes ; trois tentatives, la doublure étant très rapide.
    let gris = null;
    for (let essai = 0; essai < 3 && !gris; essai += 1) {
      await page.goto(URL_RECHERCHE, { waitUntil: "commit" });
      for (let i = 0; i < 400 && !gris; i += 1) {
        gris = await page.evaluate(() => {
          const ligne = document.querySelector('[aria-busy="true"] [data-squelette-badges]');
          if (!ligne || !ligne.children.length) return null;
          const r = (n) => n.getBoundingClientRect();
          return {
            hauteurs: [...ligne.children].map((n) => Math.round(r(n).height)),
            y: Math.round(r(ligne).top), h: Math.round(r(ligne).height),
          };
        }).catch(() => null);
        if (!gris) await page.waitForTimeout(5);
      }
    }
    verif("le squelette de la recherche est là, avec sa rangée de badges gris",
      gris !== null && gris.hauteurs.length === 2,
      gris ? `${gris.hauteurs.length} rectangle(s)` : "jamais vu");
    await page.waitForSelector("[data-filtre-actif]", { state: "visible", timeout: 20000 });
    await page.waitForTimeout(800);
    const vrai = await page.evaluate(() => {
      const rangee = document.querySelector("[data-filtres-actifs]");
      const r = rangee.getBoundingClientRect();
      return { y: Math.round(r.top), h: Math.round(r.height) };
    });
    const attendue = VOULU[mode].hauteur;
    verif("les badges gris ont la hauteur des vrais",
      gris.hauteurs.every((h) => h === attendue), `${gris.hauteurs.join(" | ")} pour ${attendue}`);
    verif("AUCUN SAUT : la rangée arrive là où le squelette la promettait",
      gris.y === vrai.y && gris.h === vrai.h,
      `promis ${gris.y} px de haut sur ${gris.h}, venu ${vrai.y} sur ${vrai.h}`);
  } catch (e) {
    verif(`déroulement du banc 850 (squelette ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

process.exit(bilan());
