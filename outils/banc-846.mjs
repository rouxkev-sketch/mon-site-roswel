//  ██ BANC 846 — LES EN-TÊTES DE RECHERCHE (ACCUEIL ET RÉSULTATS) ██
//  Les quatre points de la passe :
//   1. au doigt, sur l'ACCUEIL, le champ de recherche ne se rétracte
//      plus — mesuré avant et après défilement — et son texte d'invite
//      ne redit plus le titre de la page ;
//   2. au doigt, sur les RÉSULTATS, il n'y a plus de champ : la LOUPE
//      de la barre fixe le remplace (comme sur « Ma sélection ») ;
//   3. l'ACCUEIL porte son titre ET son sous-titre — « N portfolios •
//      M styles » — sur LES DEUX appareils, avec des comptes justes ;
//   4. les RÉSULTATS ont pour titre le COMPTE, et sous lui des BADGES
//      (le style, la localité) dont la croix retire le filtre ; retirer
//      le dernier ramène à l'accueil.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = `banc846-${Date.now()}`;
const ID = `23000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", {
    ...gabarit, id: ID, slug: T, nom: "Banc 846",
    styles: ["blackwork"], ville_slug: `lyon-${T}`,
    type_fiche: "salon", etablissement: "prive",
  });
  for (let i = 0; i < 3; i += 1) {
    await ranger("photos_tatoueur", [{
      id: `46000000-0000-4000-8000-${(i + 1).toString().padStart(12, "0")}`,
      tatoueur_id: ID, style: "blackwork", rendu: "black", nature: "tatouage",
      url: "/images-demo/tatouage/blackwork-1.svg",
      miniature: "/images-demo/tatouage/blackwork-1.svg",
      ordre: i + 1, cree_le: "2026-01-01T00:00:00Z",
    }]);
  }
}

const RESULTATS = "/search?style=blackwork&nature=tatouage";
/*  UNE RECHERCHE AVEC UN LIEU : l'adresse porte le lieu en clair (la
    règle du site — une recherche est partageable), plus son rayon. */
const LIEU = new URLSearchParams({
  style: "blackwork", nature: "tatouage",
  lieu: "Austin", zone: "TX", lat: "30.26715", lon: "-97.74306",
  niveau: "ville", paysCode: "US", region: "Texas", ville: "Austin",
  rayon: "25",
}).toString();

/** L'en-tête de la page, tel que l'écran le rend. */
const ENTETE = `() => {
  const bloc = document.querySelector("[data-titre-mosaique]");
  const badges = [...document.querySelectorAll("[data-filtre-actif]")];
  return {
    montre: (bloc?.getBoundingClientRect().height ?? 0) > 0,
    titre: bloc?.querySelector("h1")?.textContent?.trim() ?? null,
    sousTitre: bloc?.querySelector("p")?.textContent?.trim() ?? null,
    badges: badges.map((b) => ({
      cle: b.getAttribute("data-filtre-actif"),
      texte: b.textContent.trim(),
      rayon: getComputedStyle(b).borderRadius,
      fond: getComputedStyle(b).backgroundColor,
      hauteur: Math.round(b.getBoundingClientRect().height),
      etiquette: b.querySelector("[data-retrait-filtre]")?.getAttribute("aria-label"),
    })),
    url: location.pathname + location.search,
  };
}`;

//  ══ 1 · L'ACCUEIL — LE TITRE ET LES DEUX COMPTES, AUX DEUX APPAREILS ═
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`846 · ${mode} — l'accueil : le titre, et « N portfolios • M styles »`);
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const vu = await page.evaluate((E) => {
      const f = new Function("return " + E)();
      const entete = f();
      /*  LES COMPTES SE VÉRIFIENT CONTRE CE QUI EST À L'ÉCRAN : le
          nombre de cartes de style posées sous le titre, et la somme
          des portfolios que chacune annonce. C'est la définition même
          que la page se donne (« compte des styles présents sur la
          page ») — on ne recompte pas autrement, on lit. */
      const cartes = [...document.querySelectorAll("[data-catalogue-styles] [data-nom-du-style]")];
      const comptes = [...document.querySelectorAll("[data-catalogue-styles] [data-compte-du-style]")]
        .map((n) => Number((n.textContent || "").replace(/[^0-9]/g, "")))
        .filter((n) => Number.isFinite(n));
      return { ...entete, styles: cartes.length, comptes };
    }, ENTETE);
    verif("le bloc de tête est MONTRÉ (au doigt aussi, depuis la nº 846)",
      vu.montre === true);
    verif("le titre est celui de l'accueil",
      vu.titre === "Find your tattoo style…", vu.titre);
    /*  LA SOMME DES CARTES : chaque carte de style annonce son nombre
        de portfolios, et le sous-titre en est la somme (nº 628). Le
        second nombre est le nombre de cartes. */
    const somme = vu.comptes.reduce((a, b) => a + b, 0) / 2;
    verif("le sous-titre dit les DEUX comptes, séparés par la puce du site",
      vu.sousTitre === `${somme} portfolios • ${vu.styles} styles`,
      `${vu.sousTitre}  (attendu : ${somme} portfolios • ${vu.styles} styles)`);
    verif("aucun badge de filtre sur l'accueil", vu.badges.length === 0);
  } catch (e) {
    verif(`déroulement du banc 846 (accueil ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · LE DOIGT — LE CHAMP EST FIXE, ET IL N'INVITE PLUS COMME LE
//         TITRE ══════════════════════════════════════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("846 · doigt — le champ de l'accueil ne se rétracte plus");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const releve = () =>
      page.evaluate(() => {
        const rangee = document.querySelector("[data-rangee-moteur]");
        //  LA PILULE DU DOIGT : le seul bouton VISIBLE de la rangée.
        const pilule = [...rangee.querySelectorAll("button")]
          .find((b) => b.getBoundingClientRect().height > 0);
        const reserve = document.querySelector("[data-reserve-barre]");
        return {
          texte: pilule?.textContent?.trim() ?? null,
          haut: pilule ? Math.round(pilule.getBoundingClientRect().top) : null,
          hauteur: pilule ? Math.round(pilule.getBoundingClientRect().height) : null,
          rangee: Math.round(rangee.getBoundingClientRect().height),
          reserve: Number(reserve?.getAttribute("data-reserve-posee")),
          opacite: Number(getComputedStyle(rangee).opacity),
          loupe: Number(getComputedStyle(document.querySelector("[data-loupe-barre]")).opacity),
          y: Math.round(window.scrollY),
        };
      });
    const avant = await releve();
    verif("le texte d'invite ne redit plus le titre de la page",
      avant.texte === "Search a style or a city", avant.texte);
    verif("le champ est là, à sa hauteur de toujours (46 px)",
      avant.hauteur === 46 && avant.haut !== null, `${avant.hauteur} px @ ${avant.haut}`);
    verif("et la loupe de la barre est éteinte (le champ suffit)",
      avant.loupe === 0, `opacité ${avant.loupe}`);

    //  ON FAIT DÉFILER, POUR DE BON : bien au-delà des seuils de la
    //  barre (64 px du haut, 24 px cumulés vers le bas).
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(900);
    const apres = await releve();
    verif("APRÈS DÉFILEMENT, la page a bien bougé", apres.y >= 200, `${apres.y} px`);
    verif("le champ n'a pas bougé d'un pixel — il est FIXE",
      apres.haut === avant.haut && apres.hauteur === avant.hauteur &&
      apres.rangee === avant.rangee && apres.opacite === 1,
      `haut ${avant.haut} → ${apres.haut} · rangée ${avant.rangee} → ${apres.rangee} · opacité ${apres.opacite}`);
    verif("la réserve de la barre ne change pas non plus",
      apres.reserve === avant.reserve && avant.reserve === 122,
      `${avant.reserve} → ${apres.reserve}`);
    verif("et la loupe reste éteinte", apres.loupe === 0, `opacité ${apres.loupe}`);
  } catch (e) {
    verif("déroulement du banc 846 (champ fixe)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3 · LE DOIGT — LES RÉSULTATS : LA LOUPE, PLUS DE CHAMP ═══════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("846 · doigt — sur les résultats, la loupe remplace le champ");
    await page.goto(`${BASE}${RESULTATS}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    const m = await page.evaluate(() => {
      const rangee = document.querySelector("[data-rangee-moteur]");
      const loupe = document.querySelector("[data-loupe-barre]");
      const reserve = document.querySelector("[data-reserve-barre]");
      return {
        rangeeHauteur: Math.round(rangee.getBoundingClientRect().height),
        rangeeAffichee: getComputedStyle(rangee).display,
        //  AUCUN champ visible : pas un seul bouton de la rangée n'a de
        //  boîte.
        champsVisibles: [...rangee.querySelectorAll("button, input")]
          .filter((n) => n.getBoundingClientRect().height > 0).length,
        loupeOpacite: Number(getComputedStyle(loupe).opacity),
        loupeHauteur: Math.round(loupe.getBoundingClientRect().height),
        loupeEtiquette: loupe.getAttribute("aria-label"),
        reserve: Number(reserve.getAttribute("data-reserve-posee")),
      };
    });
    verif("la rangée du moteur est retirée de l'affichage",
      m.rangeeAffichee === "none" && m.rangeeHauteur === 0 && m.champsVisibles === 0,
      `${m.rangeeAffichee} · ${m.rangeeHauteur} px · ${m.champsVisibles} champ(s)`);
    verif("LA LOUPE est là, entière, et c'est elle qui mène à la recherche",
      m.loupeOpacite === 1 && m.loupeHauteur === 46, `opacité ${m.loupeOpacite} · ${m.loupeHauteur} px`);
    verif("la réserve de la barre retombe à la hauteur du logo seul",
      m.reserve === 64, `${m.reserve} px`);

    //  ET ELLE OUVRE BIEN LA PAGE DE RECHERCHE.
    await page.locator("[data-loupe-barre]").tap();
    await page.waitForTimeout(1200);
    const ouverte = await page.evaluate(() =>
      document.querySelector('[role="dialog"], [data-page-recherche]') !== null);
    verif("un toucher sur la loupe ouvre la recherche", ouverte === true);
  } catch (e) {
    verif("déroulement du banc 846 (loupe des résultats)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4 · LES RÉSULTATS — LE COMPTE EN TITRE, LES BADGES DESSOUS ═══════
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`846 · ${mode} — les résultats : le compte en titre, le style en badge`);
    await page.goto(`${BASE}${RESULTATS}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    const vu = await page.evaluate((E) => {
      const f = new Function("return " + E)();
      const entete = f();
      const cartes = document.querySelectorAll("[data-grille-tatoueurs] [data-carte]").length;
      return { ...entete, cartes };
    }, ENTETE);
    verif("le TITRE est le compte des portfolios",
      /^\d+ portfolios?$/.test(vu.titre ?? ""), vu.titre);
    verif("il n'y a plus de sous-titre : la ligne du dessous est aux badges",
      vu.sousTitre === null, String(vu.sousTitre));
    verif("un seul badge, celui du STYLE, avec son libellé",
      vu.badges.length === 1 && vu.badges[0].cle === "style" &&
      vu.badges[0].texte === "Blackwork",
      vu.badges.map((b) => `${b.cle}:${b.texte}`).join(" | "));
    /*  ⚠️ ON NE FIGE PAS LE JETON DE COULEUR (la charte a déjà été
        retintée, nº 466) : ce qui compte est la RÈGLE — un rectangle à
        coins LÉGÈREMENT arrondis, jamais la capsule pleine. Une capsule
        aurait un rayon égal à la moitié de sa hauteur (15 px) ; le
        badge en a 8, le rayon des badges du site (nº 449). */
    verif("c'est un RECTANGLE à coins arrondis, pas une capsule",
      vu.badges[0].rayon === "8px" && vu.badges[0].hauteur === 30,
      `rayon ${vu.badges[0].rayon} pour ${vu.badges[0].hauteur} px de haut`);
    verif("sa croix porte un nom accessible explicite",
      vu.badges[0].etiquette === "Remove the Blackwork filter", vu.badges[0].etiquette);

    //  LA CROIX DU DERNIER BADGE RAMÈNE À L'ACCUEIL.
    const cartesAvant = vu.cartes;
    const clic = async (sel) =>
      mode === "doigt" ? page.locator(sel).tap() : page.locator(sel).click();
    await clic('[data-retrait-filtre="style"]');
    await page.waitForTimeout(2500);
    const apres = await page.evaluate((E) => {
      const f = new Function("return " + E)();
      return f();
    }, ENTETE);
    verif("retirer le DERNIER badge ramène à l'accueil",
      apres.url === "/" && apres.titre === "Find your tattoo style…" &&
      apres.badges.length === 0,
      `${apres.url} · ${apres.titre}`);
    verif("le compte des résultats n'était pas vide au départ", cartesAvant > 0, `${cartesAvant} carte(s)`);
  } catch (e) {
    verif(`déroulement du banc 846 (badges ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 5 · DEUX BADGES — LA CROIX EN RETIRE UN ET RAFRAÎCHIT ════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("846 · deux badges : la croix retire SON filtre et rafraîchit la liste");
    await page.goto(`${BASE}/search?${LIEU}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    const deux = await page.evaluate((E) => {
      const f = new Function("return " + E)();
      return f();
    }, ENTETE);
    verif("les DEUX badges sont là, style puis localité",
      deux.badges.length === 2 && deux.badges[0].cle === "style" &&
      deux.badges[1].cle === "lieu",
      deux.badges.map((b) => `${b.cle}:${b.texte}`).join(" | "));
    /*  LA LOCALITÉ PORTE SON RAYON, d'un seul tenant et séparé par la
        même puce que le sous-titre de l'accueil. PAS DE PAYS : l'adresse
        d'une recherche n'en porte pas le nom (voir la note
        d'IndexTatoueurs) — c'est l'exemple du propriétaire, au
        caractère près. */
    verif("la localité dit la ville, sa division et le rayon",
      deux.badges[1].texte === "Austin, TX • 25 mi", deux.badges[1].texte);
    verif("le titre reste le compte", /^\d+ portfolios?$/.test(deux.titre ?? ""), deux.titre);

    //  ON RETIRE LA LOCALITÉ : le style reste, la liste se rafraîchit.
    await page.locator('[data-retrait-filtre="lieu"]').click();
    await page.waitForTimeout(2500);
    const apres = await page.evaluate((E) => {
      const f = new Function("return " + E)();
      const entete = f();
      return { ...entete, cartes: document.querySelectorAll("[data-grille-tatoueurs] [data-carte]").length };
    }, ENTETE);
    verif("la localité est partie, le style est resté",
      apres.badges.length === 1 && apres.badges[0].cle === "style",
      apres.badges.map((b) => b.cle).join(" | "));
    verif("l'adresse ne porte plus le lieu (la liste est rafraîchie)",
      !/[?&]lieu=/.test(apres.url) && /style=blackwork/.test(apres.url), apres.url);
    verif("et des résultats sont rendus", apres.cartes > 0, `${apres.cartes} carte(s)`);
  } catch (e) {
    verif("déroulement du banc 846 (deux badges)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

process.exit(bilan());
