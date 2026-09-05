//  ██ BANC 855 — L'ŒIL DES VUES, ET L'AIR DES BADGES ██
//  ==================================================================
//  DEUX SUJETS, ET RIEN D'AUTRE — les deux de la passe :
//
//   1. LE PIED DES CARTES DU FIL (doigt) — le bloc des vues passe À
//      DROITE du signalement, le DESSIN ouvre et le nombre suit
//      (« icône puis 28 »), le dessin est un ŒIL de vingt pixels, et
//      les deux sont en BLANC. Quatre choses, quatre mesures.
//
//   2. L'AIR DES BADGES (les deux appareils) — « l'air au-dessus et
//      au-dessous du texte = l'air entre le bord gauche du badge et la
//      première lettre, mesuré aux LETTRES ». On mesure donc L'ENCRE
//      PEINTE (outils/mesure-air.mjs, où la leçon de la nº 850 est
//      écrite), jamais les boîtes.
//      ⚠️ DEUX BADGES POUR TROIS AIRS, et il le faut. Le flanc du
//      glyphe et la descendante décalent chacun UN des trois nombres,
//      et aucun mot ne les évite tous les deux :
//        · le badge du COMPTE (« 14 portfolios ») porte un « p » qui
//          descend sous la ligne de base — son BAS est donc l'encre de
//          la descendante, pas de l'air. Il prouve HAUT = GAUCHE ;
//        · le badge du FILTRE (« Blackwork ») n'a aucune descendante :
//          il prouve HAUT = BAS.
//      Ensemble, les trois airs sont égaux — et c'est la seule façon
//      honnête de le dire.
//
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, modifier } from "./banc-socle.mjs";
import { imageDuPng, airsVisuels } from "./mesure-air.mjs";

/** L'air voulu, de quinze pixels — voir `AIR_BADGE` (config/tatouage),
    qui en est la source et où le calcul est écrit en entier. */
const AIR = 15;
/** LE JEU TOLÉRÉ, ET IL A UNE CAUSE PRÉCISE : le FLANC du premier
    glyphe. Le « T » de « Tattoo » avance sur sa marge, le « B » de
    « Blackwork » recule d'un flanc — un pixel, que rien ne peut
    égaliser sans décaler le mot lui-même. Jamais plus d'un. */
const JEU = 1;

const RECHERCHE = new URLSearchParams({
  style: "blackwork", nature: "tatouage", lieu: "Lyon", zone: "69",
  lat: "45.76000", lon: "4.83000", niveau: "ville", paysCode: "FR",
  region: "Auvergne-Rhône-Alpes", ville: "Lyon", rayon: "25",
}).toString();
const URL_RECHERCHE = `${BASE}/search?${RECHERCHE}`;

/** Les airs visuels d'un badge, lus sur l'encre qu'il peint. */
async function airsDuBadge(page, selecteur) {
  const poignee = await page.evaluateHandle((s) => [...document.querySelectorAll(s)]
    //  LE VISIBLE SEULEMENT : deux badges de type vivent dans le
    //  document depuis la nº 852, et l'un des deux est toujours retiré
    //  de l'affichage.
    .find((n) => n.getBoundingClientRect().height > 0) ?? null, selecteur);
  const noeud = poignee.asElement();
  if (!noeud) return null;
  await noeud.scrollIntoViewIfNeeded();
  const { hauteur, xTexteFin, mot } = await noeud.evaluate((n) => {
    const r = n.getBoundingClientRect();
    //  On borne la lecture À LA FIN DU TEXTE : la croix, plus haute
    //  que les lettres, fausserait la mesure des glyphes.
    const partie = [...n.childNodes].find((x) => x.nodeType === 3 || x.tagName === "SPAN");
    let fin = r.width;
    if (partie) {
      const plage = document.createRange();
      plage.selectNodeContents(partie);
      fin = plage.getBoundingClientRect().right - r.left + 2;
    }
    return { hauteur: Math.round(r.height), xTexteFin: Math.round(fin), mot: n.textContent.trim() };
  });
  const img = imageDuPng(await noeud.screenshot({ scale: "css" }));
  return { ...airsVisuels(img, { bord: 0, xTexteFin }), hauteur, mot };
}

//  ══ 1 · LE PIED DU FIL : L'ŒIL, PUIS LE NOMBRE, EN BLANC ═════════════
{
  //  On donne le MÊME nombre à toutes les fiches : l'ordre du fil est
  //  mélangé (le tirage du jour), et l'on lit alors n'importe laquelle.
  for (const { slug } of await lire("tatoueurs", "select=slug")) {
    await modifier("tatoueurs", `slug=eq.${slug}`, { vues: 28 });
  }
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("855 · le pied du fil — l'œil des vues");
    await page.goto(`${BASE}/search?style=blackwork&nature=tatouage&t=${Date.now()}`,
      { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-grille-tatoueurs] > *", { timeout: 20000 });
    await page.waitForTimeout(1200);
    const vu = await page.evaluate(() => {
      const pied = document.querySelector("[data-pied-de-fil]");
      const bloc = pied?.querySelector("[data-vues-de-fil]");
      const signaler = pied?.querySelector('[aria-label^="Report"]');
      if (!bloc || !signaler) return null;
      const r = (n) => n.getBoundingClientRect();
      const dessinS = signaler.querySelector("svg");
      const dessinV = bloc.querySelector("svg");
      return {
        aDroiteDuSignalement: r(bloc).left >= r(signaler).right - 1,
        //  L'ORDRE À L'INTÉRIEUR : le premier enfant est-il le dessin ?
        dessinDAbord: bloc.firstElementChild === dessinV
          && r(dessinV).right <= r(bloc).right,
        nombre: bloc.textContent.trim(),
        taille: Math.round(r(dessinV).width),
        couleur: getComputedStyle(bloc).color,
        //  L'ÉCART entre le glyphe barré et l'œil — le vide que le
        //  signalement porte déjà dans sa propre cible, (40 − 22) / 2.
        ecart: Math.round(r(dessinV).left - r(dessinS).right),
      };
    });
    verif("le bloc des vues est À DROITE du signalement (nº 855-§1)",
      vu?.aDroiteDuSignalement === true, vu ? String(vu.aDroiteDuSignalement) : "pied absent");
    verif("… le DESSIN ouvre le bloc, le nombre suit (« icône puis 28 »)",
      vu?.dessinDAbord === true && vu?.nombre === "28",
      vu ? `dessin d'abord ${vu.dessinDAbord} · « ${vu.nombre} »` : "pied absent");
    verif("… le dessin fait vingt pixels",
      vu?.taille === 20, vu ? `${vu.taille} px` : "pied absent");
    /*  LE BLANC DE LA CHARTE (#F2F2F4), pas un blanc inventé : c'est
        `text-sombre-texte`, la couleur de texte du site. */
    verif("… et les deux sont en BLANC (le blanc de la charte)",
      vu?.couleur === "rgb(242, 242, 244)", vu ? vu.couleur : "pied absent");
    verif("… l'œil est à neuf pixels du glyphe de signalement",
      vu?.ecart === 9, vu ? `${vu.ecart} px` : "pied absent");

    /*  ET L'ENCRE EST VRAIMENT BLANCHE À L'ÉCRAN : la couleur calculée
        peut être juste et le dessin peint autrement (la leçon de la
        nº 849). On lit donc le pixel le plus clair de l'œil. */
    const dessin = await page.$("[data-vues-de-fil] svg");
    const img = imageDuPng(await dessin.screenshot({ scale: "css" }));
    let clair = [0, 0, 0];
    for (let y = 0; y < img.h; y += 1) for (let x = 0; x < img.l; x += 1) {
      const p = img.at(x, y);
      if (p[0] + p[1] + p[2] > clair[0] + clair[1] + clair[2]) clair = p;
    }
    verif("… et le trait PEINT est bien ce blanc-là",
      clair[0] === 242 && clair[1] === 242 && clair[2] === 244,
      `rgb(${clair.join(",")})`);
  } catch (e) {
    verif("déroulement du banc 855 (le pied)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · L'AIR DES BADGES, AUX DEUX APPAREILS ═════════════════════════
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`855 · ${mode} — l'air des badges, mesuré aux lettres`);
    await page.goto(URL_RECHERCHE, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-filtre-actif]", { state: "visible", timeout: 20000 });
    await page.waitForTimeout(900);

    //  a · LE COMPTE — sa descendante lui interdit de dire le BAS, mais
    //  il dit HAUT = GAUCHE, qui est la règle telle qu'elle est écrite.
    const compte = await airsDuBadge(page, "[data-badge-compte]");
    verif("le badge du compte est là, et son encre se lit",
      compte !== null, compte ? `« ${compte.mot} »` : "badge absent");
    verif("HAUT = GAUCHE, à quinze pixels de l'encre",
      compte && Math.abs(compte.haut - AIR) <= JEU && Math.abs(compte.gauche - AIR) <= JEU
        && Math.abs(compte.haut - compte.gauche) <= JEU,
      compte ? `haut ${compte.haut} · gauche ${compte.gauche}` : "badge absent");

    //  b · UN FILTRE — sans descendante, il dit HAUT = BAS.
    const filtre = await airsDuBadge(page, "[data-filtre-actif]");
    verif("HAUT = BAS, à quinze pixels de l'encre",
      filtre && Math.abs(filtre.haut - AIR) <= JEU && Math.abs(filtre.bas - AIR) <= JEU
        && Math.abs(filtre.haut - filtre.bas) <= JEU,
      filtre ? `haut ${filtre.haut} · bas ${filtre.bas}` : "badge absent");

    //  c · LA MÊME BOÎTE POUR TOUS — c'est ce que « ils suivent » veut
    //  dire : le badge du type des cartes partage l'écriture.
    const type = await airsDuBadge(page, "[data-badge-type]");
    verif("le badge du TYPE des cartes suit la même hauteur",
      compte && filtre && type
        && compte.hauteur === filtre.hauteur && filtre.hauteur === type.hauteur,
      [compte?.hauteur, filtre?.hauteur, type?.hauteur].join(" | "));
  } catch (e) {
    verif(`déroulement du banc 855 (l'air, ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3 · LE SQUELETTE PROMET LA NOUVELLE HAUTEUR, SANS SAUT ═══════════
/*  MESURE FINE ASSUMÉE ICI : c'est le seul endroit où un pixel d'écart
    se voit vraiment — la page sauterait à chaque arrivée. Le procédé
    d'attrapage est celui du banc nº 845. */
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`855 · ${mode} — le squelette promet la hauteur qui vient`);
    let gris = null;
    for (let essai = 0; essai < 3 && !gris; essai += 1) {
      await page.goto(URL_RECHERCHE, { waitUntil: "commit" });
      for (let i = 0; i < 400 && !gris; i += 1) {
        gris = await page.evaluate(() => {
          const ligne = document.querySelector('[aria-busy="true"] [data-squelette-badges]');
          if (!ligne || !ligne.children.length) return null;
          return [...ligne.children].map((n) => Math.round(n.getBoundingClientRect().height));
        }).catch(() => null);
        if (!gris) await page.waitForTimeout(5);
      }
    }
    await page.waitForSelector("[data-filtre-actif]", { state: "visible", timeout: 20000 });
    await page.waitForTimeout(800);
    const vraie = await page.evaluate(() =>
      Math.round(document.querySelector("[data-filtre-actif]").getBoundingClientRect().height));
    verif("le squelette promet EXACTEMENT la hauteur du vrai badge",
      gris !== null && gris.every((h) => h === vraie),
      gris ? `gris ${gris.join(" · ")} contre ${vraie} rendus` : "squelette jamais vu");
  } catch (e) {
    verif(`déroulement du banc 855 (squelette, ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

bilan();
