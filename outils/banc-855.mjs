//  ██ BANC 855 — L'ŒIL DES VUES, ET L'AIR DES BADGES ██
//  ==================================================================
//  DEUX SUJETS, ET RIEN D'AUTRE — les deux de la passe :
//
//   1. LE PIED DES CARTES DU FIL (doigt) — le bloc des vues passe À
//      DROITE du signalement, le DESSIN ouvre et le nombre suit
//      (« icône puis 28 »), le dessin est un ŒIL de vingt pixels, et
//      les deux sont en BLANC. Quatre choses, quatre mesures.
//
//   2. L'AIR DES BADGES — ANNULÉ PAR LA nº 856. Ce banc mesurait quinze
//      pixels jusqu'à l'encre sur trois côtés ; le propriétaire l'a
//      annulé, et ces mesures vivent désormais au banc 856. Il reste ici
//      le squelette, qui promet la hauteur du vrai badge quelle qu'elle
//      soit (3).
//
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, modifier } from "./banc-socle.mjs";
import { imageDuPng } from "./mesure-air.mjs";

const RECHERCHE = new URLSearchParams({
  style: "blackwork", nature: "tatouage", lieu: "Lyon", zone: "69",
  lat: "45.76000", lon: "4.83000", niveau: "ville", paysCode: "FR",
  region: "Auvergne-Rhône-Alpes", ville: "Lyon", rayon: "25",
}).toString();
const URL_RECHERCHE = `${BASE}/search?${RECHERCHE}`;

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
    //  nº 867-§7 — VINGT-QUATRE : le dessin des vues (l'histogramme
    //  depuis la nº 866) a pris la taille du fanion et du partage.
    verif("… le dessin fait vingt-quatre pixels depuis la nº 867 (vingt avant)",
      vu?.taille === 24, vu ? `${vu.taille} px` : "pied absent");
    /*  LE BLANC DE LA CHARTE (#F2F2F4), pas un blanc inventé : c'est
        `text-sombre-texte`, la couleur de texte du site. */
    verif("… et les deux sont en BLANC (le blanc de la charte)",
      vu?.couleur === "rgb(242, 242, 244)", vu ? vu.couleur : "pied absent");
    /*  ██ nº 866-§3 — NEUF PIXELS, C'ÉTAIT TROP SERRÉ ██ Le propriétaire
        veut le même air qu'entre le fanion et le partage : SEIZE de
        boîte à boîte (le bloc des vues a reçu sept pixels de marge). Et
        l'œil est devenu un HISTOGRAMME (nº 866-§2) : la mesure ne change
        pas de nature, seulement de valeur. */
    verif("… l'histogramme est à seize pixels du glyphe de signalement (neuf avant la nº 866)",
      vu?.ecart === 16, vu ? `${vu.ecart} px` : "pied absent");

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

//  ══ 2 · L'AIR DES BADGES — ANNULÉ PAR LA nº 856 ═════════════════════
/*  Ce banc mesurait ici « quinze pixels jusqu'à l'encre, en haut, en
    bas et à gauche », aux deux appareils, et la hauteur de quarante qui
    en découlait. Le propriétaire a annulé ce point à la nº 856 : les
    badges du doigt reviennent à l'état du bâti nº 854 (trente), et ceux
    du web montent d'un cran EN PROPORTION (trente-deux), sans air
    ajouté. Ces mesures-là vivent au banc 856 ; celui-ci ne garde que ce
    qui est resté vrai de la nº 855 — l'œil des vues (1) et le squelette
    qui promet la hauteur du vrai badge, quelle qu'elle soit (3). */

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
