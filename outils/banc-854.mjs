//  ██ BANC 854 — LE NOMBRE DE VUES ARRIVE VRAIMENT, ET « 0 » EST UN NOMBRE ██
//  ========================================================================
//  LE BOGUE Nº 853, MESURÉ : en production, le bloc « vues + icône
//  statistiques » n'apparaissait sur AUCUNE carte du fil. Deux causes,
//  et ce banc les tient toutes les deux :
//
//   1. LA FICHE DE LA RECHERCHE EST RÉDUITE. Les résultats ne sont pas
//      lus colonne par colonne : ils viennent de la fonction
//      `rechercher_tatoueurs`, qui fabrique une fiche de trente-trois
//      champs choisis à la main — `vues` n'y est pas, la colonne étant
//      née après elle (SQL nº 852). ⚠️ ET L'ATELIER NE POUVAIT PAS LE
//      VOIR : la doublure rendait la ligne ENTIÈRE. Ce banc allume donc
//      le cran `fichePartielle` de la doublure (nº 854) — la vraie
//      forme, celle de la production — AVANT de mesurer, et le remet
//      comme il l'a trouvé en partant.
//   2. LE BLOC SE CACHAIT À ZÉRO. La nº 853 écrivait `vues > 0`. Le
//      propriétaire tranche : il doit AFFICHER « 0 ».
//
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import {
  BASE, DOUBLURE, ouvrir, verif, titre, bilan, lire, ranger, modifier,
} from "./banc-socle.mjs";

const RESULTATS = `${BASE}/search?style=blackwork&nature=tatouage`;

/** Le cran de la doublure — allumé, elle répond comme la vraie base. */
async function fichePartielle(actif) {
  const r = await fetch(`${DOUBLURE}/__reglages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fichePartielle: actif }),
  });
  return (await r.json()).fichePartielle;
}

/**
 * UNE CARTE DU FIL, ouverte au doigt : son slug, et ce que son pied
 * montre. `&t=` force une page neuve à chaque relevé — le cache de la
 * recherche ne doit pas répondre à notre place.
 * ⚠️ ON NOMME LA CARTE QU'ON LIT. Le fil est MÉLANGÉ (le tirage du
 * jour) : « la première carte » n'est pas la même d'un chargement à
 * l'autre, et un banc qui écrirait sur l'une pour relire l'autre
 * mesurerait le hasard. Sans slug, on prend la première et l'on rend
 * son nom — c'est ainsi qu'on choisit celle qu'on suivra ensuite.
 */
async function pied(page, slug = null) {
  await page.goto(`${RESULTATS}&t=${Date.now()}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-grille-tatoueurs] > *", { timeout: 20000 });
  await page.waitForTimeout(1200);
  return page.evaluate((cherche) => {
    const cartes = [...document.querySelectorAll("[data-carte]")];
    const lien = (c) => c.querySelector("[data-lien-profil-de-fil]")
      ?.getAttribute("href")?.split("/artist/")[1]?.split("?")[0] ?? null;
    const carte = cherche
      ? cartes.find((c) => lien(c) === cherche)
      : cartes[0];
    if (!carte) return null;
    const bloc = carte.querySelector("[data-vues-de-fil]");
    return {
      slug: lien(carte),
      present: Boolean(bloc),
      texte: bloc ? bloc.textContent.trim() : null,
      dessin: bloc?.querySelector("svg")
        ? Math.round(bloc.querySelector("svg").getBoundingClientRect().width) : 0,
    };
  }, slug);
}

const cranALArrivee = await fichePartielle(true);

//  ══ 1 · LA FORME DE PRODUCTION : LA FICHE RÉDUITE ════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("854 · la fiche réduite de la recherche (la forme de la production)");
    verif("la doublure rend désormais la fiche réduite, comme la vraie base",
      cranALArrivee === true, `cran ${cranALArrivee}`);

    /*  ⚠️ LA PREUVE QUE LE CRAN MORD : la fiche que la fonction fabrique
        ne porte pas `booking` (nº 745). Si la doublure rendait encore la
        ligne entière, la carte le connaîtrait. */
    const premier = (await pied(page))?.slug;
    verif("une carte est là, et l'on sait laquelle", Boolean(premier), String(premier));

    //  ZÉRO VUE : le bloc doit PARAÎTRE, et dire « 0 ».
    await modifier("tatoueurs", `slug=eq.${premier}`, { vues: 0 });
    const aZero = await pied(page, premier);
    verif("à zéro vue, le bloc paraît quand même…",
      aZero?.present === true,
      aZero ? `présent ${aZero.present}` : "sa carte est introuvable dans le fil");
    verif("… et il montre « 0 », suivi de l'icône de 20 px",
      aZero?.texte === "0" && aZero?.dessin === 20,
      aZero ? `« ${aZero.texte} » · dessin ${aZero.dessin} px` : "carte absente");

    //  UN NOMBRE : il doit traverser la fiche RÉDUITE et arriver au pied.
    //  C'est LE point du bogue : sans `avecLesVues`, la carte ne le voit
    //  jamais, quel que soit le nombre écrit en base.
    await modifier("tatoueurs", `slug=eq.${premier}`, { vues: 28 });
    const a28 = await pied(page, premier);
    verif("un nombre écrit en base traverse la fiche réduite jusqu'au pied",
      a28?.texte === "28",
      a28 ? `« ${a28.texte} »` : "carte absente");
  } catch (e) {
    verif("déroulement du banc 854 (fiche réduite)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · LE COMPTAGE, DE BOUT EN BOUT, SUR LA FORME DE PRODUCTION ═════
/*  Ouvrir un profil compte une vue (nº 853) ; ce banc-ci vérifie que
    cette vue-là REDESCEND jusqu'à la carte du fil — le trajet complet
    que le propriétaire a décrit et qui ne se faisait pas. */
{
  const T = `banc854-${Date.now()}`;
  const ID = `54000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", {
    ...gabarit, id: ID, slug: T, nom: "Banc 854", styles: ["blackwork"], vues: 0,
  });
  //  nº 866 — UNE PHOTO, SANS QUOI LA FICHE N'EST PLUS DANS LES RÉSULTATS :
  //  une page de résultats par style ne liste que les fiches qui ont une
  //  photo de la nature demandée (la fiche forgée n'en avait aucune, et
  //  ce banc n'avait pas été rejoué depuis). Le trajet mesuré ne change
  //  pas : une visite, puis le nombre au pied de SA carte.
  await ranger("photos_tatoueur", [{
    id: `54000001-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`,
    tatoueur_id: ID, style: "blackwork", rendu: "black", nature: "tatouage",
    url: "/images-demo/tatouage/blackwork-1.svg", miniature: "/images-demo/tatouage/blackwork-1.svg",
    ordre: 1, cree_le: "2026-01-01T00:00:00Z",
  }]);
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("854 · d'une visite au pied de la carte");
    await page.goto(`${BASE}/artist/${T}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    const enBase = ((await lire("tatoueurs", `slug=eq.${T}`))[0] ?? {}).vues;
    verif("ouvrir le profil compte une vue", enBase === 1, String(enBase));

    /*  On la met en tête du fil en lui donnant le nombre le plus élevé
        n'est pas possible (le classement ne suit pas `vues`) : on lit
        donc SA carte, où qu'elle soit dans la page. */
    await page.goto(`${RESULTATS}&t=${Date.now()}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-grille-tatoueurs] > *", { timeout: 20000 });
    await page.waitForTimeout(1200);
    const sienne = await page.evaluate((slug) => {
      const lien = [...document.querySelectorAll("[data-carte] [data-lien-profil-de-fil]")]
        .find((a) => (a.getAttribute("href") ?? "").includes(`/artist/${slug}`));
      const carte = lien?.closest("[data-carte]");
      const bloc = carte?.querySelector("[data-vues-de-fil]");
      return bloc ? bloc.textContent.trim() : null;
    }, T);
    verif("et cette vue-là arrive au pied de SA carte dans le fil",
      sienne === "1", sienne === null ? "carte ou bloc absent" : `« ${sienne} »`);
  } catch (e) {
    verif("déroulement du banc 854 (bout en bout)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  On rend la doublure telle qu'on l'a trouvée : les autres bancs ne
//  doivent pas hériter de notre réglage.
await fichePartielle(false);
bilan();
