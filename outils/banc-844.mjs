//  ██ BANC 844 — LA PASTILLE, LES CHEVRONS, LE BADGE, LA PLAQUE ██
//  Les quatre points de la passe, mesurés là où ils vivent :
//   1. la pastille « 7/20 » : invisible au repos, allumée par le
//      défilement, éteinte en fondu trois secondes après — sur les
//      QUATRE surfaces (carte du web, carte du fil, fiche du web, vue
//      photo du doigt ouverte depuis l'onglet Portfolio) ;
//   2. les chevrons des fiches du web : le chevron NU des galeries de
//      profil (nº 264/301), pas le disque de verre de la nº 368, et
//      l'apparition au survol des cartes (nº 839) ;
//   3. le badge du type : fond transparent, contour fin seul ;
//   4. la vue photo rendue à ses deux entrées (lien partagé, vignette
//      du Portfolio), les cartes du fil menant au profil.
//  ⚠️ MIS AU PAS DE LA nº 845 : la plaque du profil, que la nº 844 avait
//  supprimée, est RÉTABLIE (correction de consigne du propriétaire) et
//  la croix de retour retirée. Ce banc constate les deux ; le banc 845
//  mesure la plaque elle-même.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = `banc844-${Date.now()}`;
const ID = `20000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
const TEINTES = ["blackwork", "old-school", "geometrique"];
const PHOTOS = [];
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", {
    ...gabarit, id: ID, slug: T, nom: "Banc 844",
    styles: ["blackwork"], ville_slug: `lyon-${T}`,
    type_fiche: "salon", etablissement: "prive",
  });
  //  SIX PHOTOS DANS UNE SEULE SÉRIE : il faut plus d'une photo pour
  //  qu'il y ait une pastille et des chevrons, et assez pour avancer
  //  plusieurs fois sans buter sur la fin.
  for (let i = 0; i < 6; i += 1) {
    const cle = `44000000-0000-4000-8000-${(i + 1).toString().padStart(12, "0")}`;
    PHOTOS.push(cle);
    const teinte = TEINTES[i % TEINTES.length];
    await ranger("photos_tatoueur", [{
      id: cle, tatoueur_id: ID, style: "blackwork", rendu: "black",
      nature: "tatouage", url: `/images-demo/tatouage/${teinte}-1.svg`,
      miniature: `/images-demo/tatouage/${teinte}-1.svg`,
      ordre: i + 1, cree_le: "2026-01-01T00:00:00Z",
    }]);
  }
  //  UNE SECONDE SÉRIE, pour que l'onglet Portfolio ait deux galeries
  //  et que la vignette touchée ne soit pas celle du cadre du haut.
  for (let i = 0; i < 4; i += 1) {
    await ranger("photos_tatoueur", [{
      id: `44000001-0000-4000-8000-${(i + 1).toString().padStart(12, "0")}`,
      tatoueur_id: ID, style: "blackwork", rendu: "color",
      nature: "tatouage", url: `/images-demo/tatouage/${TEINTES[i % 3]}-2.svg`,
      miniature: `/images-demo/tatouage/${TEINTES[i % 3]}-2.svg`,
      ordre: 10 + i, cree_le: "2026-01-01T00:00:00Z",
    }]);
  }
}

/*  ██ COMMENT ON LIT LA PASTILLE ██
    L'OPACITÉ CALCULÉE, et rien d'autre : c'est ce que le fondu de la
    nº 844 pilote. On note aussi la propriété de transition (elle doit
    être `opacity`, une seule — piège nº 389) et si elle laisse passer
    les pointeurs (une pastille éteinte ne doit avaler aucun clic).
    ⚠️ ON LUI DONNE LA PASTILLE, JAMAIS UNE RACINE À FOUILLER : une
    carte de la mosaïque en contient DEUX — celle du fil (rendue, mais
    masquée par la feuille de style au web) et la sienne. Chercher « la
    première » lisait celle du fil, qui ne bouge jamais au web. */
const PASTILLE = `(p) => {
  if (!p) return null;
  const s = getComputedStyle(p);
  return {
    texte: p.textContent.trim(),
    opacite: Number(s.opacity),
    transition: s.transitionProperty,
    duree: s.transitionDuration,
    pointeurs: s.pointerEvents,
    eveillee: p.hasAttribute("data-compteur-eveille"),
  };
}`;
const REPOS = 3400;

//  ══ 1 · LE WEB — LA CARTE DE LA MOSAÏQUE ═════════════════════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("844 · la carte du web : la pastille suit le geste, pas le survol");
    const CARTE = `[data-carte]:has([data-lien-carte][href*="${T}"])`;
    await page.goto(`${BASE}/search?style=blackwork&nature=tatouage`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    //  DEUX SÉRIES = DEUX CARTES pour cette fiche (black et color) : on
    //  travaille sur la PREMIÈRE, et sur elle seule.
    await page.locator(CARTE).first().scrollIntoViewIfNeeded();
    const auRepos = await page.evaluate(([SEL, M]) => {
      const f = new Function("return " + M)();
      return f(document.querySelector(SEL + " [data-compteur-de-carte]"));
    }, [CARTE, PASTILLE]);
    verif("au repos, elle est transparente et ne prend aucun clic",
      auRepos && auRepos.opacite === 0 && auRepos.pointeurs === "none", JSON.stringify(auRepos));
    verif("le fondu porte sur l'opacité seule",
      auRepos && auRepos.transition === "opacity" && auRepos.duree === "0.3s",
      `${auRepos?.transition} / ${auRepos?.duree}`);

    //  LE SURVOL SEUL NE L'ALLUME PLUS (c'était la règle de la nº 369).
    await page.locator(CARTE).first().hover();
    await page.waitForTimeout(400);
    const surSurvol = await page.evaluate(([SEL, M]) => {
      const f = new Function("return " + M)();
      return f(document.querySelector(SEL + " [data-compteur-de-carte]"));
    }, [CARTE, PASTILLE]);
    verif("le survol seul ne l'allume pas", surSurvol.opacite === 0, `opacité ${surSurvol.opacite}`);

    //  … MAIS LE CHEVRON, OUI.
    await page.locator(`${CARTE} [data-fleche-de-carte="droite"]`).first().click();
    await page.waitForTimeout(500);
    const apresLePas = await page.evaluate(([SEL, M]) => {
      const f = new Function("return " + M)();
      return f(document.querySelector(SEL + " [data-compteur-de-carte]"));
    }, [CARTE, PASTILLE]);
    verif("un pas de chevron l'allume, et elle dit le rang",
      apresLePas.opacite === 1 && apresLePas.texte === "2/6" && apresLePas.eveillee,
      `${apresLePas.texte} · opacité ${apresLePas.opacite}`);
    verif("allumée, elle reprend les pointeurs (nº 367 : elle n'ouvre pas la fiche)",
      apresLePas.pointeurs === "auto", apresLePas.pointeurs);

    await page.waitForTimeout(REPOS);
    const apresLeRepos = await page.evaluate(([SEL, M]) => {
      const f = new Function("return " + M)();
      return f(document.querySelector(SEL + " [data-compteur-de-carte]"));
    }, [CARTE, PASTILLE]);
    verif("trois secondes après le dernier geste, elle s'efface",
      apresLeRepos.opacite === 0 && !apresLeRepos.eveillee && apresLeRepos.texte === "2/6",
      `opacité ${apresLeRepos.opacite} · ${apresLeRepos.texte}`);
  } catch (e) {
    verif("déroulement du banc 844 (carte du web)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · LE WEB — LA FICHE : CHEVRONS ET PASTILLE ═════════════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("844 · la fiche du web : les chevrons des galeries, et la pastille");
    await page.goto(`${BASE}/artist/${T}?style=blackwork&rendu=black&nature=tatouage`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const CADRE = "[data-carrousel] ";
    const auRepos = await page.evaluate(([M]) => {
      const f = new Function("return " + M)();
      const racine = document.querySelector("[data-carrousel]");
      const droite = racine.querySelector('[data-role="right arrow"]');
      const s = droite && getComputedStyle(droite);
      const svg = droite?.querySelector("svg");
      return {
        pastille: f(racine.querySelector('[data-role="compteur"]')),
        //  LE DESSIN : un chevron NU (le viewBox 12×24 de la nº 264),
        //  dans une colonne de 40 px collée au bord et haute comme
        //  l'image — jamais le disque de verre de la nº 368.
        boite: svg?.getAttribute("viewBox"),
        largeurGlyphe: svg?.getAttribute("width"),
        hauteurGlyphe: svg?.getAttribute("height"),
        zone: droite && Math.round(droite.getBoundingClientRect().width),
        hauteurZone: droite && Math.round(droite.getBoundingClientRect().height),
        hauteurCadre: Math.round(racine.getBoundingClientRect().height),
        fond: s?.backgroundColor,
        rayon: s?.borderRadius,
        flou: s?.backdropFilter,
        visibilite: s?.visibility,
        ensemble: racine.className.split(/\s+/).includes("group"),
      };
    }, [PASTILLE]);
    /*  ██ LA RÈGLE D'ARRIVÉE A CHANGÉ À LA nº 852-§4 ██
        La nº 844 l'éteignait au repos, partout. Le propriétaire ajoute
        deux règles d'ALLUMAGE : au web, une fiche ou une vue photo
        montre sa pastille À L'OUVERTURE, trois secondes, puis l'éteint
        si la souris ne bouge plus. La règle du geste, elle, n'a pas
        bougé — c'est ce que la suite de ce banc mesure encore. */
    verif("à l'ouverture d'une fiche au web, la pastille est ALLUMÉE (nº 852-§4)",
      auRepos.pastille.opacite === 1 && auRepos.pastille.texte === "1/6",
      `${auRepos.pastille.texte} · opacité ${auRepos.pastille.opacite}`);
    verif("le chevron est NU : le dessin des galeries, aucun disque, aucun flou",
      auRepos.boite === "0 0 12 24" && auRepos.largeurGlyphe === "20" && auRepos.hauteurGlyphe === "40" &&
      auRepos.fond === "rgba(0, 0, 0, 0)" && auRepos.rayon === "0px" && auRepos.flou === "none",
      `${auRepos.boite} ${auRepos.largeurGlyphe}×${auRepos.hauteurGlyphe} · fond ${auRepos.fond} · rayon ${auRepos.rayon} · flou ${auRepos.flou}`);
    verif("sa zone prend toute la hauteur de l'image, sur 40 px de large",
      auRepos.zone === 40 && auRepos.hauteurZone === auRepos.hauteurCadre,
      `${auRepos.zone} × ${auRepos.hauteurZone} pour un cadre de ${auRepos.hauteurCadre}`);
    verif("hors survol, il est invisible (l'écriture des cartes, nº 839)",
      auRepos.visibilite === "hidden" && auRepos.ensemble, `${auRepos.visibilite} · group ${auRepos.ensemble}`);

    //  LE SURVOL DE LA PHOTO LES MONTRE.
    await page.locator("[data-carrousel]").hover();
    await page.waitForTimeout(300);
    const surSurvol = await page.evaluate(([M]) => {
      const f = new Function("return " + M)();
      const racine = document.querySelector("[data-carrousel]");
      return {
        droite: getComputedStyle(racine.querySelector('[data-role="right arrow"]')).visibility,
        gauche: racine.querySelector('[data-role="left arrow"]') ? "présent" : "absent",
        pastille: f(racine.querySelector('[data-role="compteur"]')).opacite,
      };
    }, [PASTILLE]);
    /*  nº 852-§4 — LE SURVOL EST UN MOUVEMENT DE SOURIS, et au web un
        mouvement de souris tient désormais la pastille éveillée : elle
        est donc allumée ici, avec le chevron. Ce que ce point garde de
        la nº 844 : le chevron paraît au survol. */
    verif("au survol de la photo, le chevron paraît — et la pastille reste éveillée (nº 852-§4)",
      surSurvol.droite === "visible" && surSurvol.pastille === 1,
      `chevron ${surSurvol.droite} · pastille ${surSurvol.pastille}`);
    verif("à la première photo, il n'y a pas de chevron gauche", surSurvol.gauche === "absent");

    await page.locator(`${CADRE}[data-role="right arrow"]`).click();
    await page.waitForTimeout(900);
    const apres = await page.evaluate(([M]) => {
      const f = new Function("return " + M)();
      return f(document.querySelector('[data-carrousel] [data-role="compteur"]'));
    }, [PASTILLE]);
    verif("le chevron fait défiler, et le défilement allume la pastille",
      apres.opacite === 1 && apres.texte === "2/6", `${apres.texte} · opacité ${apres.opacite}`);

    await page.waitForTimeout(REPOS);
    const eteinte = await page.evaluate(([M]) => {
      const f = new Function("return " + M)();
      return f(document.querySelector('[data-carrousel] [data-role="compteur"]'));
    }, [PASTILLE]);
    verif("trois secondes plus tard, elle s'efface sur la fiche aussi", eteinte.opacite === 0, `opacité ${eteinte.opacite}`);

    //  LA SOURIS QUITTE LA PHOTO : LES CHEVRONS S'EN VONT.
    await page.mouse.move(5, 5);
    await page.waitForTimeout(300);
    const sorti = await page.evaluate(() =>
      getComputedStyle(document.querySelector('[data-carrousel] [data-role="right arrow"]')).visibility);
    verif("la souris partie, le chevron redisparaît", sorti === "hidden", sorti);
  } catch (e) {
    verif("déroulement du banc 844 (fiche du web)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3 · LE DOIGT — LE FIL : PASTILLE, BADGE, DESTINATION ═════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("844 · la carte du fil : la pastille au geste, le badge transparent");
    const CARTE = `[data-carte]:has([data-lien-profil-de-fil][href*="${T}"])`;
    await page.goto(`${BASE}/search?style=blackwork&nature=tatouage`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    //  DEUX SÉRIES = DEUX CARTES : la première, et elle seule.
    await page.locator(CARTE).first().scrollIntoViewIfNeeded();
    /*  ██ LA MESURE ATTENDAIT UN NOMBRE ANIMÉ (corrigé nº 862) ██
        CE QUI SE PASSAIT : la règle de la nº 852-§4 allume la pastille à
        l'arrivée sur une page de résultats et l'éteint TROIS SECONDES
        après le dernier défilement. Ce bloc mesurait six cents
        millisecondes après un `scrollIntoViewIfNeeded` qui, la carte
        déjà visible, ne défile pas : le compte à rebours courait donc
        depuis l'arrivée, et l'on tombait une fois sur deux au milieu du
        FONDU — opacité 0,82 pour une vérification qui exige 1. Un banc
        qui compare une valeur en train de changer ne mesure rien.
        CE QU'ON FAIT MAINTENANT : on provoque un vrai défilement (d'un
        pixel — c'est le geste, pas la distance, que la règle écoute),
        puis on ATTEND que le fondu soit fini avant de lire. La règle
        vérifiée ne bouge pas d'un iota : allumée, pleine, « 1/6 ». */
    await page.evaluate(() => window.scrollBy(0, 1));
    await page.waitForFunction(
      (SEL) => getComputedStyle(document.querySelector(
        SEL + ' [data-cadre-de-fil] [data-role="compteur"]')).opacity === "1",
      CARTE, { timeout: 5000 });
    const auRepos = await page.evaluate(([SEL, M]) => {
      const f = new Function("return " + M)();
      const c = document.querySelector(SEL);
      const badge = [...c.querySelectorAll("[data-badge-type]")]
        .find((n) => n.getBoundingClientRect().height > 0);
      const s = getComputedStyle(badge);
      const carte = getComputedStyle(c);
      return {
        pastille: f(c.querySelector('[data-cadre-de-fil] [data-role="compteur"]')),
        badgeFond: s.backgroundColor,
        fondDeLaCarte: carte.backgroundColor,
        contour: `${s.borderTopWidth} ${s.borderTopStyle}`,
        contourCouleur: s.borderTopColor,
        badgeTexte: badge.textContent.trim(),
        lienProfil: c.querySelector("[data-lien-profil-de-fil]").getAttribute("href"),
      };
    }, [CARTE, PASTILLE]);
    /*  ██ LE FIL AU DOIGT, LUI AUSSI, A CHANGÉ À LA nº 852-§4 ██
        Sur une page de RÉSULTATS, la pastille des cartes est là
        D'EMBLÉE et s'efface trois secondes après l'arrêt du défilement
        de la page. Ce banc ouvre exactement une page de résultats : la
        pastille y est donc allumée à l'arrivée. */
    verif("sur les résultats au doigt, la pastille du fil est ALLUMÉE d'emblée (nº 852-§4)",
      auRepos.pastille.opacite === 1 && auRepos.pastille.texte === "1/6",
      `${auRepos.pastille.texte} · opacité ${auRepos.pastille.opacite}`);
    /*  ██ §3 — LA ROBE DU BADGE, ANNULÉE PAR LA nº 852-§6 ██
        La nº 844 l'avait VIDÉ (fond transparent, contour seul) ; le
        propriétaire lui donne la robe de « Suivre » — un aplat plein,
        sans contour — « parce que c'est un lien ». La règle mesurée est
        donc l'inverse, et c'est écrit plutôt que caché. */
    verif("le badge du type est PLEIN (la robe de « Suivre », nº 852-§6)",
      auRepos.badgeFond !== "rgba(0, 0, 0, 0)" && auRepos.badgeFond !== auRepos.fondDeLaCarte,
      `${auRepos.badgeFond} sur ${auRepos.fondDeLaCarte}`);
    verif("… et il n'a plus aucun contour",
      parseFloat(auRepos.contour) === 0, auRepos.contour);
    verif("la carte du fil mène toujours au PROFIL",
      auRepos.lienProfil === `/artist/${T}?entree=lien`, auRepos.lienProfil);

    //  UN DÉFILEMENT DE L'IMAGE (le glissement du doigt, joué par le
    //  défilement natif du cadre) ALLUME LA PASTILLE.
    await page.evaluate((SEL) => {
      const z = document.querySelector(SEL + ' [data-cadre-de-fil] [data-role="cadre"]');
      z.scrollBy({ left: z.clientWidth, behavior: "smooth" });
    }, CARTE);
    await page.waitForTimeout(900);
    const enGlissant = await page.evaluate(([SEL, M]) => {
      const f = new Function("return " + M)();
      return f(document.querySelector(SEL).querySelector('[data-cadre-de-fil] [data-role="compteur"]'));
    }, [CARTE, PASTILLE]);
    verif("le glissement l'allume, et elle dit le rang",
      enGlissant.opacite === 1 && enGlissant.texte === "2/6",
      `${enGlissant.texte} · opacité ${enGlissant.opacite}`);
    await page.waitForTimeout(REPOS);
    const eteinte = await page.evaluate(([SEL, M]) => {
      const f = new Function("return " + M)();
      return f(document.querySelector(SEL).querySelector('[data-cadre-de-fil] [data-role="compteur"]'));
    }, [CARTE, PASTILLE]);
    verif("trois secondes après le glissement, elle s'efface", eteinte.opacite === 0, `opacité ${eteinte.opacite}`);
  } catch (e) {
    verif("déroulement du banc 844 (fil du doigt)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4 · LE DOIGT — LE LIEN PARTAGÉ REND LA VUE PHOTO ═════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    //  ⚠️ MIS AU PAS DE LA nº 845 : la plaque du profil est RÉTABLIE et
    //  la croix de retour RETIRÉE (le propriétaire corrige la consigne
    //  de la nº 844). Ce que ce banc tient toujours, et qui est bien de
    //  la nº 844 : la vue photo revient au doigt pour ses deux entrées,
    //  et la pastille y est éteinte à l'arrivée. Le banc 845 mesure la
    //  plaque elle-même.
    titre("844 · un lien partagé ouvre la VUE PHOTO au doigt (la plaque est mesurée par le banc 845)");
    const PARTAGE = `/artist/${T}?style=blackwork&rendu=black&nature=tatouage&photo=${PHOTOS[2]}`;
    await page.goto(`${BASE}${PARTAGE}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    const vue = await page.evaluate(([M]) => {
      const f = new Function("return " + M)();
      const lecture = document.querySelector("[data-colonne-lecture]");
      const croix = document.querySelector("[data-retour-vue-photo]");
      return {
        url: location.pathname + location.search,
        vuePhoto: document.querySelector("[data-vue-photo]") !== null,
        lectureMasquee: lecture ? getComputedStyle(lecture).display === "none" : null,
        photoMontree: (document.querySelector("[data-photo-de-tete]")?.getBoundingClientRect().height ?? 0) > 0,
        plaque: document.querySelector("[data-habillage-photo]") !== null,
        croix: croix !== null,
        pastille: f(document.querySelector('[data-carrousel] [data-role="compteur"]')),
      };
    }, [PASTILLE]);
    verif("l'adresse partagée n'est PLUS réécrite en « entree=lien » (la redirection de la nº 841 est retirée)",
      vue.url === PARTAGE, vue.url);
    verif("c'est bien la vue photo : la photo est montrée, la colonne de lecture retirée",
      vue.vuePhoto && vue.photoMontree && vue.lectureMasquee === true,
      `vue-photo ${vue.vuePhoto} · photo ${vue.photoMontree} · lecture masquée ${vue.lectureMasquee}`);
    verif("LA PLAQUE DU PROFIL EST LÀ (rétablie nº 845)", vue.plaque === true);
    verif("et la croix de la nº 844 n'y est plus (nº 845 : doublon avec la plaque)", vue.croix === false);
    verif("elle s'ouvre sur la photo partagée, pastille éteinte",
      vue.pastille.texte === "3/6" && vue.pastille.opacite === 0,
      `${vue.pastille.texte} · opacité ${vue.pastille.opacite}`);

    //  LE CHEMIN DU RETOUR EST LA PLAQUE (nº 845).
    //  nº 862 — l'habillage porte DEUX liens (le profil, le badge du
    //  type) : on nomme celui qu'on touche.
    await page.locator("[data-habillage-photo] [data-lien-profil-de-fil]").tap();
    await page.waitForTimeout(2500);
    const apresLaPlaque = await page.evaluate(() => ({
      url: location.pathname + location.search,
      photoMontree: (document.querySelector("[data-photo-de-tete]")?.getBoundingClientRect().height ?? 0) > 0,
    }));
    verif("un toucher sur la plaque rend le profil",
      apresLaPlaque.url === `/artist/${T}?entree=lien` && !apresLaPlaque.photoMontree,
      `${apresLaPlaque.url} · photo ${apresLaPlaque.photoMontree}`);
  } catch (e) {
    verif("déroulement du banc 844 (lien partagé)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 5 · LE DOIGT — LA VIGNETTE DU PORTFOLIO REND LA VUE PHOTO ════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("844 · une vignette de l'onglet Portfolio ouvre la vue photo (la nº 841 menait au profil)");
    await page.goto(`${BASE}/artist/${T}?entree=lien`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await page.locator("[role=radio]").filter({ hasText: /portfolio/i }).first().tap();
    await page.waitForFunction(
      () => document.querySelectorAll('[data-galeries="doigt"] [data-galerie-serie]').length >= 2,
      null, { timeout: 15000 });
    await page.waitForTimeout(800);
    await page.locator('[data-galeries="doigt"] [data-galerie-serie]').first()
      .locator('[data-case-galerie="1"] button').tap();
    await page.waitForFunction(() => /photo=/.test(location.search), null, { timeout: 15000 });
    await page.waitForTimeout(1500);
    /*  ██ nº 863-§3 — DEPUIS L'ONGLET PORTFOLIO, LA VUE PHOTO EST LE FIL
        DE LA GALERIE ██ Plus de carrousel ni de plaque : la galerie
        entière, empilée, chaque photo dans sa carte, la vue ouverte sur
        la photo touchée (FilDeGalerie). Ce bloc mesure donc la nouvelle
        vérité ; LA PASTILLE, elle, se mesure au bloc suivant sur la vue
        photo d'un LIEN PARTAGÉ, qui garde son carrousel (nº 862, §4 de
        la nº 863). */
    const vue = await page.evaluate(() => {
      const lecture = document.querySelector("[data-colonne-lecture]");
      return {
        url: location.pathname + location.search,
        vuePhoto: document.querySelector("[data-vue-photo]") !== null,
        lectureMasquee: lecture ? getComputedStyle(lecture).display === "none" : null,
        photoMontree: (document.querySelector("[data-photo-de-tete]")?.getBoundingClientRect().height ?? 0) > 0,
        plaque: document.querySelector("[data-habillage-photo]") !== null,
        fil: getComputedStyle(document.querySelector("[data-fil-de-galerie]") ?? document.body).display,
        ouverte: document.querySelector("[data-carte-ouverte]")?.getAttribute("data-carte-de-galerie") ?? null,
        cartes: document.querySelectorAll("[data-carte-de-galerie]").length,
      };
    });
    verif("la vignette mène à la VUE PHOTO, pas au profil",
      vue.vuePhoto && vue.photoMontree && vue.lectureMasquee === true && !/entree=lien/.test(vue.url),
      `${vue.url} · vue-photo ${vue.vuePhoto} · photo ${vue.photoMontree}`);
    verif("elle est le FIL DE LA GALERIE (nº 863) : six cartes, ouvert sur LA photo touchée (la deuxième), sans plaque",
      vue.fil !== "none" && vue.cartes === 6 && vue.ouverte === "1" && vue.plaque === false && /entree=portfolio/.test(vue.url),
      `fil ${vue.fil} · ${vue.cartes} carte(s) · ouverte ${vue.ouverte} · plaque ${vue.plaque}`);
    /*  L'ANCIENNE VÉRIFICATION, GARDÉE POUR MÉMOIRE ET NEUTRALISÉE : elle
        lisait la pastille d'un carrousel qui n'existe plus ici. */
    verif("(mémoire nº 844) l'ancienne vue photo du Portfolio ouvrait un carrousel — remplacé par le fil (nº 863)",
      true, "");
    if (false) verif("elle s'ouvre sur LA photo touchée (la deuxième de la galerie), pastille éteinte, plaque présente",
      vue.pastille.texte === "2/6" && vue.pastille.opacite === 0 && vue.plaque,
      `${vue.pastille.texte} · opacité ${vue.pastille.opacite} · plaque ${vue.plaque}`);

    //  ET LA PASTILLE DE LA VUE PHOTO DU PORTFOLIO OBÉIT À LA MÊME RÈGLE.
    titre("844 · la vue photo d'un lien partagé : la même pastille, la même règle (nº 863 : le carrousel vit là)");
    await page.goto(`${BASE}/artist/${T}?style=blackwork&rendu=black&nature=tatouage&photo=${PHOTOS[1]}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      const z = document.querySelector('[data-carrousel] [data-role="cadre"]');
      z.scrollBy({ left: z.clientWidth, behavior: "smooth" });
    });
    await page.waitForTimeout(900);
    const allumee = await page.evaluate(([M]) => {
      const f = new Function("return " + M)();
      return f(document.querySelector('[data-carrousel] [data-role="compteur"]'));
    }, [PASTILLE]);
    verif("le glissement l'allume", allumee.opacite === 1, `${allumee.texte} · opacité ${allumee.opacite}`);
    await page.waitForTimeout(REPOS);
    const eteinte = await page.evaluate(([M]) => {
      const f = new Function("return " + M)();
      return f(document.querySelector('[data-carrousel] [data-role="compteur"]'));
    }, [PASTILLE]);
    verif("trois secondes plus tard, elle s'efface", eteinte.opacite === 0, `opacité ${eteinte.opacite}`);
  } catch (e) {
    verif("déroulement du banc 844 (vignette du Portfolio)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 6 · UNE SEULE ÉCRITURE ═══════════════════════════════════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("844 · une seule écriture : la même pastille sur toutes les surfaces");
    const releve = async (url, quoi) => {
      await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      return page.evaluate((Q) => {
        const toutes = [...document.querySelectorAll("[data-compteur-photos]")];
        return {
          quoi: Q,
          combien: toutes.length,
          //  LA MÊME SIGNATURE PARTOUT : le disque du patron partagé, le
          //  fondu, et jamais deux classes d'opacité empilées.
          signatures: [...new Set(toutes.map((p) => {
            const s = getComputedStyle(p);
            return `${s.borderRadius}|${s.backdropFilter !== "none"}|${s.transitionProperty}|${s.color}`;
          }))],
          //  AUCUNE PASTILLE HORS DE L'ÉCRITURE COMMUNE : plus un seul
          //  ancien repère orphelin.
          orphelines: [...document.querySelectorAll('[data-role="compteur"],[data-compteur-de-carte]')]
            .filter((p) => !p.hasAttribute("data-compteur-photos")).length,
        };
      }, quoi);
    };
    const mosaique = await releve("/search?style=blackwork&nature=tatouage", "mosaïque");
    const fiche = await releve(`/artist/${T}?style=blackwork&rendu=black&nature=tatouage`, "fiche");
    verif("la mosaïque et la fiche portent la MÊME pastille (même robe, même fondu)",
      mosaique.signatures.length === 1 && fiche.signatures.length === 1 &&
      mosaique.signatures[0] === fiche.signatures[0],
      `${mosaique.signatures[0]} vs ${fiche.signatures[0]}`);
    verif("aucune pastille n'échappe à l'écriture commune",
      mosaique.orphelines === 0 && fiche.orphelines === 0,
      `${mosaique.orphelines} + ${fiche.orphelines}`);
    verif("elles sont bien plusieurs à la mesurer", mosaique.combien >= 1 && fiche.combien >= 1,
      `${mosaique.combien} sur la mosaïque, ${fiche.combien} sur la fiche`);
  } catch (e) {
    verif("déroulement du banc 844 (écriture unique)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

process.exit(bilan());
