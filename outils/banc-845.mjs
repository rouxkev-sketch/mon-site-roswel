//  ██ BANC 845 — LA PLAQUE, LE SQUELETTE DU FIL, LA PASTILLE ██
//  Les trois points de la passe :
//   1. la plaque du profil est RÉTABLIE dans la vue photo du doigt, et
//      la vue photo s'ouvre bien pour ses deux entrées (lien partagé,
//      vignette de l'onglet Portfolio) ; la croix de la nº 844 n'est
//      plus là ; les cartes du fil mènent toujours au profil ;
//   2. le squelette du fil épouse la carte réelle — mêmes hauteurs,
//      mêmes positions, aucun saut au remplacement ; le web inchangé ;
//   3. la pastille du compteur : air à droite = air en haut = la marge
//      de droite du site.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const T = `banc845-${Date.now()}`;
const ID = `22000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
const TEINTES = ["blackwork", "old-school", "geometrique"];
const PHOTOS = [];
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", {
    ...gabarit, id: ID, slug: T, nom: "Banc 845",
    styles: ["blackwork"], ville_slug: `lyon-${T}`,
    type_fiche: "salon", etablissement: "prive",
  });
  for (let i = 0; i < 6; i += 1) {
    const cle = `45100000-0000-4000-8000-${(i + 1).toString().padStart(12, "0")}`;
    PHOTOS.push(cle);
    await ranger("photos_tatoueur", [{
      id: cle, tatoueur_id: ID, style: "blackwork", rendu: "black",
      nature: "tatouage", url: `/images-demo/tatouage/${TEINTES[i % 3]}-1.svg`,
      miniature: `/images-demo/tatouage/${TEINTES[i % 3]}-1.svg`,
      ordre: i + 1, cree_le: "2026-01-01T00:00:00Z",
    }]);
  }
  //  UNE SECONDE SÉRIE : l'onglet Portfolio a alors deux galeries, et
  //  la vignette touchée n'est pas celle du cadre du haut.
  for (let i = 0; i < 4; i += 1) {
    await ranger("photos_tatoueur", [{
      id: `45100001-0000-4000-8000-${(i + 1).toString().padStart(12, "0")}`,
      tatoueur_id: ID, style: "blackwork", rendu: "color",
      nature: "tatouage", url: `/images-demo/tatouage/${TEINTES[i % 3]}-2.svg`,
      miniature: `/images-demo/tatouage/${TEINTES[i % 3]}-2.svg`,
      ordre: 10 + i, cree_le: "2026-01-01T00:00:00Z",
    }]);
  }
}

const MOSAIQUE = "/search?style=blackwork&nature=tatouage";
const CARTE = `[data-carte]:has([data-lien-profil-de-fil][href*="${T}"])`;

/*  ██ CE QU'ON RELÈVE D'UNE CARTE DU FIL, RÉELLE OU GRISE ██
    Les quatre boîtes qui font sa hauteur (la carte, l'en-tête, l'image,
    le pied) et les repères que l'œil suit d'une rangée à l'autre : le
    rond de l'avatar, le rectangle du badge, les cibles du pied. On note
    les positions RELATIVES à la carte : c'est ce qui doit coïncider
    entre le squelette et la vraie, quel que soit l'endroit de la page
    où chacun se trouve. */
const RELEVE = `(carte, tete, cadre, pied, avatar, badge, gauche, droite) => {
  const b = (n) => (n ? n.getBoundingClientRect() : null);
  const r = b(carte);
  const rel = (n) => {
    const x = b(n);
    return x ? {
      h: Math.round(x.height * 1000) / 1000,
      l: Math.round((x.left - r.left) * 1000) / 1000,
      d: Math.round((r.right - x.right) * 1000) / 1000,
      y: Math.round((x.top - r.top) * 1000) / 1000,
    } : null;
  };
  return {
    hauteur: Math.round(r.height * 1000) / 1000,
    largeur: Math.round(r.width * 1000) / 1000,
    tete: rel(tete), cadre: rel(cadre), pied: rel(pied),
    avatar: rel(avatar), badge: rel(badge),
    gauche: rel(gauche), droite: rel(droite),
  };
}`;

//  ══ 1 · LE SQUELETTE DU FIL, CONTRE LA CARTE RÉELLE ══════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("845 · le squelette du fil épouse la carte du fil");
    /*  ⚠️ COMMENT ON ATTRAPE LE SQUELETTE, SANS RIEN RALENTIR : on
        rend la main dès que la navigation est COMMISE (`commit`), puis
        on interroge le document toutes les cinq millisecondes. Next
        envoie le repli de `loading.tsx` dans le premier flux, avant la
        page résolue : il est donc là, et il porte `aria-busy`. */
    /*  ⚠️ ON RÉESSAIE LA NAVIGATION, ET C'EST NÉCESSAIRE : le repli de
        `loading.tsx` ne vit qu'entre le premier flux et la page résolue.
        Sur une doublure qui répond en dix millisecondes, cette fenêtre
        se ferme parfois avant la première interrogation — le squelette
        EXISTE, on l'a simplement manqué. Trois tentatives suffisent (une
        seule a échoué sur une dizaine de relevés) ; sans elles, le banc
        rendrait un faux RATÉ. */
    let gris = null;
    for (let essai = 0; essai < 3 && !gris; essai += 1) {
    await page.goto(`${BASE}${MOSAIQUE}`, { waitUntil: "commit" });
    for (let i = 0; i < 400 && !gris; i += 1) {
      gris = await page.evaluate((R) => {
        const b = document.querySelector('[aria-busy="true"]');
        if (!b) return null;
        const cases = [...b.querySelectorAll("li")];
        const montrees = cases.filter((n) => n.getBoundingClientRect().height > 0);
        const c = montrees[0];
        if (!c) return null;
        const f = new Function("return " + R)();
        const tete = c.children[1];
        const cadre = c.children[2];
        const pied = c.children[3];
        const releve = f(
          c, tete, cadre, pied,
          tete?.children[0],
          tete?.children[2],
          pied?.children[0],
          pied?.children[2]
        );
        return {
          ...releve,
          rendues: cases.length,
          montrees: montrees.length,
          colonnes: getComputedStyle(b.querySelector("ul")).gridTemplateColumns.split(" ").length,
          //  Le premier bloc de chaque case est celui du WEB : au doigt
          //  il doit être retiré de l'affichage, comme sur la vraie.
          blocWeb: getComputedStyle(c.children[0]).display,
          y: c.getBoundingClientRect().top,
        };
      }, RELEVE).catch(() => null);
      if (!gris) await page.waitForTimeout(5);
    }
    }
    verif("le squelette du fil est bien là, et il est UNE colonne",
      gris !== null && gris.colonnes === 1, gris ? `${gris.colonnes} colonne(s)` : "jamais vu");
    verif("il montre TROIS cartes au doigt (quinze rendues, douze retirées de l'affichage)",
      gris.rendues === 15 && gris.montrees === 3, `${gris.montrees} montrée(s) sur ${gris.rendues}`);
    verif("le bloc de la carte du WEB est retiré de l'affichage au doigt",
      gris.blocWeb === "none", gris.blocWeb);

    //  … ET MAINTENANT LA VRAIE, SUR LA MÊME PAGE.
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1800);
    const vraie = await page.evaluate(([SEL, R]) => {
      const c = document.querySelector(SEL);
      const f = new Function("return " + R)();
      const tete = c.querySelector("[data-en-tete-de-fil]");
      const cadre = c.querySelector("[data-cadre-de-fil]");
      const pied = c.querySelector("[data-pied-de-fil]");
      return {
        ...f(
          c, tete, cadre, pied,
          tete.querySelector("[data-lien-profil-de-fil] > span:first-child"),
          //  nº 852 — le badge QU'ON VOIT (deux vivent dans le document).
          [...tete.querySelectorAll("[data-badge-type]")]
            .find((n) => n.getBoundingClientRect().height > 0),
          pied.querySelector(":scope > div:first-child"),
          pied.querySelector(":scope > div:last-child")
        ),
        premiere: (() => {
          const p = document.querySelector("[data-grille-tatoueurs] > *");
          return p ? Math.round(p.getBoundingClientRect().top) : null;
        })(),
      };
    }, [CARTE, RELEVE]);

    const egal = (a, b, tol = 0.001) => Math.abs(a - b) <= tol;
    verif("MÊME HAUTEUR DE CARTE, au millième",
      egal(gris.hauteur, vraie.hauteur), `${gris.hauteur} px (gris) vs ${vraie.hauteur} px (vraie)`);
    verif("MÊME LARGEUR — pleine largeur d'écran, la grille saigne aux bords",
      egal(gris.largeur, vraie.largeur) && gris.largeur === 390, `${gris.largeur} vs ${vraie.largeur}`);
    verif("l'EN-TÊTE : même hauteur, même place",
      egal(gris.tete.h, vraie.tete.h) && egal(gris.tete.y, vraie.tete.y),
      `h ${gris.tete.h}/${vraie.tete.h} · y ${gris.tete.y}/${vraie.tete.y}`);
    verif("l'IMAGE : même hauteur, même place",
      egal(gris.cadre.h, vraie.cadre.h) && egal(gris.cadre.y, vraie.cadre.y),
      `h ${gris.cadre.h}/${vraie.cadre.h} · y ${gris.cadre.y}/${vraie.cadre.y}`);
    verif("le PIED : même hauteur, même place",
      egal(gris.pied.h, vraie.pied.h) && egal(gris.pied.y, vraie.pied.y),
      `h ${gris.pied.h}/${vraie.pied.h} · y ${gris.pied.y}/${vraie.pied.y}`);
    verif("le ROND DE L'AVATAR : même gabarit, même place",
      egal(gris.avatar.h, vraie.avatar.h) && egal(gris.avatar.l, vraie.avatar.l) &&
      egal(gris.avatar.y, vraie.avatar.y),
      `h ${gris.avatar.h}/${vraie.avatar.h} · x ${gris.avatar.l}/${vraie.avatar.l} · y ${gris.avatar.y}/${vraie.avatar.y}`);
    verif("le RECTANGLE DU BADGE : même hauteur, même bord droit",
      egal(gris.badge.h, vraie.badge.h) && egal(gris.badge.d, vraie.badge.d),
      `h ${gris.badge.h}/${vraie.badge.h} · droite ${gris.badge.d}/${vraie.badge.d}`);
    verif("les CIBLES DU PIED : mêmes gabarits, mêmes bords",
      egal(gris.gauche.h, vraie.gauche.h) && egal(gris.gauche.l, vraie.gauche.l) &&
      egal(gris.droite.h, vraie.droite.h) && egal(gris.droite.d, vraie.droite.d),
      `gauche ${gris.gauche.h}@${gris.gauche.l} / ${vraie.gauche.h}@${vraie.gauche.l} · droite ${gris.droite.h}@${gris.droite.d} / ${vraie.droite.h}@${vraie.droite.d}`);
    verif("AUCUN SAUT AU REMPLACEMENT : la première rangée arrive là où le squelette la promettait",
      egal(gris.y, vraie.premiere, 1), `${Math.round(gris.y)} px promis, ${vraie.premiere} px rendus`);
  } catch (e) {
    verif("déroulement du banc 845 (squelette du fil)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · LA PASTILLE, ALIGNÉE SUR LA MARGE ════════════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("845 · la pastille : air à droite = air en haut = la marge du site");
    await page.goto(`${BASE}${MOSAIQUE}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    await page.locator(CARTE).first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const m = await page.evaluate((SEL) => {
      const c = document.querySelector(SEL);
      const cadre = c.querySelector("[data-cadre-de-fil]");
      const past = cadre.querySelector('[data-role="compteur"]');
      const badge = [...c.querySelectorAll("[data-badge-type]")]
        .find((n) => n.getBoundingClientRect().height > 0);
      const rp = past.getBoundingClientRect();
      const rc = cadre.getBoundingClientRect();
      const principal = document.querySelector("main");
      return {
        droite: Math.round((rc.right - rp.right) * 1000) / 1000,
        haut: Math.round((rp.top - rc.top) * 1000) / 1000,
        margeSite: parseFloat(getComputedStyle(principal).paddingRight),
        //  Le cadre touche-t-il le bord de l'écran ? (la saignée du fil)
        cadreAuBord: Math.round(innerWidth - rc.right),
        //  Le badge du type s'arrête, lui, sur la marge : les deux bords
        //  droits doivent tomber au même endroit.
        bordBadge: Math.round(innerWidth - badge.getBoundingClientRect().right),
        bordPastille: Math.round(innerWidth - rp.right),
      };
    }, CARTE);
    verif("l'air à DROITE égale l'air en HAUT — une seule valeur",
      m.droite === m.haut, `droite ${m.droite} px · haut ${m.haut} px`);
    verif("et cette valeur EST la marge de droite du site",
      m.droite === m.margeSite && m.margeSite === 16,
      `${m.droite} px pour une marge de ${m.margeSite} px`);
    verif("le cadre, lui, touche bien le bord de l'écran (la saignée du fil)",
      m.cadreAuBord === 0, `${m.cadreAuBord} px`);
    verif("la pastille tombe sur le MÊME bord droit que le badge du type",
      m.bordPastille === m.bordBadge && m.bordPastille === 16,
      `pastille ${m.bordPastille} px · badge ${m.bordBadge} px`);
  } catch (e) {
    verif("déroulement du banc 845 (pastille)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3 · LA PLAQUE DU PROFIL, RÉTABLIE ════════════════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("845 · un lien partagé ouvre la vue photo AVEC sa plaque");
    const PARTAGE = `/artist/${T}?style=blackwork&rendu=black&nature=tatouage&photo=${PHOTOS[2]}`;
    await page.goto(`${BASE}${PARTAGE}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    const vue = await page.evaluate(() => {
      const lecture = document.querySelector("[data-colonne-lecture]");
      const plaque = document.querySelector("[data-habillage-photo]");
      const lien = plaque?.querySelector("a");
      const bloc = lien?.querySelector(":scope > span:nth-child(2)");
      const photo = document.querySelector("[data-photo-de-tete]");
      const r = plaque?.getBoundingClientRect();
      return {
        url: location.pathname + location.search,
        vuePhoto: document.querySelector("[data-vue-photo]") !== null,
        lectureMasquee: lecture ? getComputedStyle(lecture).display === "none" : null,
        photoMontree: (photo?.getBoundingClientRect().height ?? 0) > 0,
        plaqueMontree: (r?.height ?? 0) > 0,
        /*  ██ SA PLACE A CHANGÉ À LA nº 862 ██ Elle était SOUS la photo
            depuis la nº 454 ; l'EN-TÊTE DU FIL qui la remplace ouvre la
            vue, AU-DESSUS de l'image — c'est le sens même de « prendre la
            présentation des cartes du fil ». On mesure donc l'inverse, et
            on le dit. La marque, elle, ne bouge pas : elle nomme
            l'habillage de la photo au doigt depuis la nº 451. */
        auDessusDeLaPhoto: r && photo ? r.top < (photo.querySelector("[data-photo-fiche]")?.getBoundingClientRect().top ?? Infinity) : null,
        href: lien?.getAttribute("href"),
        nom: bloc?.querySelector(":scope > span:first-child")?.textContent.trim(),
        sous: bloc?.querySelector(":scope > span:nth-child(2)")?.textContent.trim(),
        avatar: (lien?.querySelector(":scope > span:first-child")?.getBoundingClientRect().height ?? 0),
        //  LA CROIX DE LA nº 844 : elle ne doit plus exister.
        croix: document.querySelector("[data-retour-vue-photo]") !== null,
      };
    });
    verif("l'adresse partagée n'est pas réécrite", vue.url === PARTAGE, vue.url);
    verif("c'est la vue photo : photo montrée, colonne de lecture retirée",
      vue.vuePhoto && vue.photoMontree && vue.lectureMasquee === true,
      `vue-photo ${vue.vuePhoto} · photo ${vue.photoMontree} · lecture ${vue.lectureMasquee}`);
    verif("L'HABILLAGE EST LÀ, montré, AU-DESSUS de la photo (nº 862)",
      vue.plaqueMontree && vue.auDessusDeLaPhoto === true,
      `montré ${vue.plaqueMontree} · au-dessus ${vue.auDessusDeLaPhoto}`);
    verif("il dit le nom, puis LA VILLE SEULE (nº 862), avec son rond de 40",
      vue.nom === "Banc 845" && vue.sous === "Lyon, FR" && vue.avatar === 40,
      `${vue.nom} / ${vue.sous} / rond ${vue.avatar}`);
    verif("il est un lien vers le profil", vue.href === `/artist/${T}?entree=lien`, vue.href);
    verif("LA CROIX DE LA nº 844 N'EST PLUS LÀ (doublon avec la plaque)", vue.croix === false);

    await page.locator("[data-habillage-photo] [data-lien-profil-de-fil]").tap();
    await page.waitForTimeout(2500);
    const apres = await page.evaluate(() => ({
      url: location.pathname + location.search,
      photoMontree: (document.querySelector("[data-photo-de-tete]")?.getBoundingClientRect().height ?? 0) > 0,
    }));
    verif("un toucher sur l'en-tête ouvre le profil",
      apres.url === `/artist/${T}?entree=lien` && !apres.photoMontree,
      `${apres.url} · photo ${apres.photoMontree}`);

    /*  ██ nº 863-§3 — DEPUIS L'ONGLET PORTFOLIO, PLUS DE PLAQUE NI
        D'EN-TÊTE : c'est LE FIL DE LA GALERIE (FilDeGalerie) — le titre
        de la galerie au-dessus de chaque image, ouvert sur la photo
        touchée. La plaque / l'en-tête de la nº 845/862 vit toujours sur
        la vue photo d'un lien partagé (mesurée plus haut dans ce banc). */
    titre("845 · une vignette du Portfolio ouvre le fil de la galerie, sur la photo touchée (nº 863)");
    await page.locator("[role=radio]").filter({ hasText: /portfolio/i }).first().tap();
    await page.waitForFunction(
      () => document.querySelectorAll('[data-galeries="doigt"] [data-galerie-serie]').length >= 2,
      null, { timeout: 15000 });
    await page.waitForTimeout(800);
    await page.locator('[data-galeries="doigt"] [data-galerie-serie]').first()
      .locator('[data-case-galerie="1"] button').tap();
    await page.waitForFunction(() => /photo=/.test(location.search), null, { timeout: 15000 });
    await page.waitForTimeout(1500);
    const vignette = await page.evaluate(() => {
      const plaque = document.querySelector("[data-habillage-photo]");
      const lecture = document.querySelector("[data-colonne-lecture]");
      return {
        url: location.pathname + location.search,
        vuePhoto: document.querySelector("[data-vue-photo]") !== null,
        lectureMasquee: lecture ? getComputedStyle(lecture).display === "none" : null,
        plaqueMontree: (plaque?.getBoundingClientRect().height ?? 0) > 0,
        href: plaque?.querySelector("a")?.getAttribute("href"),
        ouverte: document.querySelector("[data-carte-ouverte]")?.getAttribute("data-carte-de-galerie") ?? null,
        cartes: document.querySelectorAll("[data-carte-de-galerie]").length,
        pastille: [...document.querySelectorAll("[data-carte-ouverte] [data-cadre-de-galerie] *")].map((e) => e.textContent.trim()).find((t) => /^\d+\/\d+$/.test(t)) ?? null,
        titre: document.querySelector("[data-carte-ouverte] [data-titre-galerie]")?.textContent.trim() ?? null,
      };
    });
    verif("la vignette mène à la vue photo (pas au profil), sur LA photo touchée — la première des deux cartes du fil, ouverte sur « 2/6 » (nº 866)",
      vignette.vuePhoto && vignette.lectureMasquee === true && /entree=portfolio/.test(vignette.url) &&
      vignette.cartes === 2 && vignette.ouverte === "0" && vignette.pastille === "2/6",
      `${vignette.url} · ${vignette.cartes} carte(s) · ouverte ${vignette.ouverte} · pastille ${vignette.pastille}`);
    verif("et le titre de la galerie coiffe l'image, sans plaque (nº 863)",
      !vignette.plaqueMontree && vignette.titre === "Blackwork • Black",
      `plaque ${vignette.plaqueMontree} · « ${vignette.titre} »`);

    titre("845 · la carte du fil, elle, mène toujours au profil direct");
    await page.goto(`${BASE}${MOSAIQUE}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    await page.locator(CARTE).first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.locator(`${CARTE} [data-lien-profil-de-fil]`).first().tap();
    await page.waitForTimeout(2500);
    const duFil = await page.evaluate(() => ({
      url: location.pathname + location.search,
      photoMontree: (document.querySelector("[data-photo-de-tete]")?.getBoundingClientRect().height ?? 0) > 0,
      plaqueMontree: (document.querySelector("[data-habillage-photo]")?.getBoundingClientRect().height ?? 0) > 0,
    }));
    verif("elle ouvre le PROFIL — ni photo en haut, ni plaque",
      duFil.url === `/artist/${T}?entree=lien` && !duFil.photoMontree && !duFil.plaqueMontree,
      `${duFil.url} · photo ${duFil.photoMontree} · plaque ${duFil.plaqueMontree}`);
  } catch (e) {
    verif("déroulement du banc 845 (plaque)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4 · LE WEB N'A PAS BOUGÉ ═════════════════════════════════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("845 · le web : ni fil, ni squelette de fil");
    //  ⚠️ MÊME RÉESSAI QU'AU DOIGT : voir la note du premier bloc.
    let gris = null;
    for (let essai = 0; essai < 3 && !gris; essai += 1) {
    await page.goto(`${BASE}${MOSAIQUE}`, { waitUntil: "commit" });
    for (let i = 0; i < 400 && !gris; i += 1) {
      gris = await page.evaluate(() => {
        const b = document.querySelector('[aria-busy="true"]');
        if (!b) return null;
        const cases = [...b.querySelectorAll("li")];
        const montrees = cases.filter((n) => n.getBoundingClientRect().height > 0);
        if (!montrees.length) return null;
        return {
          colonnes: getComputedStyle(b.querySelector("ul")).gridTemplateColumns.split(" ").length,
          montrees: montrees.length,
          //  Au web, la structure du fil ne doit rien peindre : la
          //  première case n'a que son bloc web affiché.
          filMontre: montrees[0].children.length > 1
            ? [...montrees[0].children].slice(1).some((n) => n.getBoundingClientRect().height > 0)
            : false,
          hauteur: Math.round(montrees[0].getBoundingClientRect().height),
        };
      }).catch(() => null);
      if (!gris) await page.waitForTimeout(5);
    }
    }
    verif("le squelette du web garde ses colonnes (quatre à 1440 px) et ses douze cases",
      gris !== null && gris.colonnes === 4 && gris.montrees === 12,
      gris ? `${gris.colonnes} colonnes · ${gris.montrees} cases` : "jamais vu");
    verif("aucune structure de fil n'y est peinte", gris.filMontre === false);

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    const vrai = await page.evaluate((SEL) => {
      const c = document.querySelector(SEL);
      const cadre = c.querySelector("[data-cadre-de-fil]");
      const past = c.querySelector("[data-compteur-de-carte]");
      const piste = c.querySelector("[data-piste-de-carte]");
      return {
        colonnes: getComputedStyle(document.querySelector("[data-grille-tatoueurs]")).gridTemplateColumns.split(" ").length,
        filMasque: cadre ? getComputedStyle(cadre).display === "none" : null,
        //  La pastille du WEB garde ses 8 px de la nº 367 : la nº 845 ne
        //  touche QUE la carte du doigt.
        droite: past && piste
          ? Math.round(piste.getBoundingClientRect().right - past.getBoundingClientRect().right)
          : null,
        haut: past && piste
          ? Math.round(past.getBoundingClientRect().top - piste.getBoundingClientRect().top)
          : null,
      };
    }, `[data-carte]:has([data-lien-carte][href*="${T}"])`);
    verif("la vraie mosaïque du web garde ses quatre colonnes et son fil masqué",
      vrai.colonnes === 4 && vrai.filMasque === true, `${vrai.colonnes} colonnes · fil masqué ${vrai.filMasque}`);
    verif("et la pastille du web garde ses 8 px (nº 367), inchangés",
      vrai.droite === 8 && vrai.haut === 8, `droite ${vrai.droite} · haut ${vrai.haut}`);
  } catch (e) {
    verif("déroulement du banc 845 (web)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

process.exit(bilan());
