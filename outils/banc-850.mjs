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

/*  ██ nº 853-§4 — LA RÈGLE DE CE BANC A ÉTÉ REMPLACÉE ██
    Il mesurait l'AIR VISUEL des badges de recherche — 14 px sur les
    côtés, 8 en haut et en bas, lus sur l'ENCRE et non sur les boîtes
    (outils/mesure-air.mjs, où la leçon reste écrite). Le propriétaire a
    tranché autrement : les badges prennent les MESURES DU BADGE DU TYPE
    des cartes — au doigt à la nº 851, au web à la nº 853. Deux bancs ne
    diront pas deux vérités sur le même sujet : cette mesure-là vit
    désormais au banc 851, badge contre badge, aux deux appareils.
    CE QUI RESTE ICI, et qui n'appartient qu'à ce banc : LE SQUELETTE
    d'attente promet la hauteur qui vient, sans saut d'un pixel. */
const HAUTEUR_BADGE = 30;

const RECHERCHE = new URLSearchParams({
  style: "blackwork", nature: "tatouage", lieu: "Lyon", zone: "69",
  lat: "45.76000", lon: "4.83000", niveau: "ville", paysCode: "FR",
  region: "Auvergne-Rhône-Alpes", ville: "Lyon", rayon: "25",
}).toString();
const URL_RECHERCHE = `${BASE}/search?${RECHERCHE}`;

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
    const attendue = HAUTEUR_BADGE;
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
