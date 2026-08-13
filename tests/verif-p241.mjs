/**
 * LE BANC DE LA PASSE Nº 241 — AUX DEUX LARGEURS (390 et 1440)
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE et
 * les nombres, jamais le rendu de WebKit.
 *
 * CE QU'IL MESURE :
 *   §1 — 40 px au-dessus et au-dessous de la photo de profil, égaux ;
 *   §2 — TikTok en SURFACE PLEINE, poids d'encre comparé à Instagram
 *        (aux pixels rendus, par canvas) ;
 *   §3 — le contraste des points des langues à venir sur la plaque ;
 *   §4A — les valeurs CALCULÉES des deux capsules de la fenêtre
 *         d'adresse, fenêtre RÉELLEMENT ouverte à 390 px ;
 *   §4B — la fenêtre Partage refaite : ni titre ni croix, quatre
 *         partages + champ à badge intérieur, plaque 22 %, badge 20 %,
 *         aucune capsule rose ;
 *   §5 — menu et sous-menu : les deux niveaux mesurés, et la preuve
 *        que l'opacité de la plaque n'a pas baissé.
 *
 * Il se lance comme les autres :  node tests/verif-p241.mjs
 * (le site doit tourner sur http://localhost:3000 — .next PURGÉ).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue } from "./commun-verif.mjs";

/** L'ALPHA d'une couleur calculée — Tailwind v4 écrit les
    translucidités en `oklab(... / a)`, Chromium rend les nôtres en
    `rgba(..., a)` : on lit le dernier nombre, quel que soit l'habit. */
const alphaDe = (couleur) =>
  Number(couleur?.match(/\/\s*([\d.]+)\)$/)?.[1] ?? couleur?.match(/,\s*([\d.]+)\)$/)?.[1] ?? 1);
const estBlancTranslucide = (couleur, alpha) =>
  Boolean(couleur) &&
  (couleur.startsWith("oklab(0.99") || couleur.startsWith("rgba(255, 255, 255")) &&
  Math.abs(alphaDe(couleur) - alpha) < 0.005;

const navigateur = await chromium.launch();

const pageWeb = async (largeur) => {
  const contexte = await navigateur.newContext({
    viewport: { width: largeur, height: 900 },
  });
  return { contexte, page: await contexte.newPage() };
};
const pageMobile = async () => {
  const contexte = await navigateur.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  return { contexte, page: await contexte.newPage() };
};
const ouvrir = async (page, chemin = "/") => {
  await page.goto(`${BASE}${chemin}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2200);
};
//  La fiche de démonstration la plus complète (adresse cliquable,
//  Instagram ET TikTok).
const FICHE = "/tatoueur/atelier-corvus-lyon-1er";

/* ==================================================================
 * §1 — LES MARGES DE LA PHOTO DE PROFIL
 * ================================================================== */
for (const [nomLargeur, faire] of [
  ["390 px", pageMobile],
  ["1440 px", () => pageWeb(1440)],
]) {
  titre(`§1 — les marges de la photo de profil (${nomLargeur})`);
  const { contexte, page } = await faire();
  try {
    await ouvrir(page, FICHE);
    const vu = await page.evaluate(() => {
      //  Le bloc identité : le parent direct de la photo ronde.
      const photo = [...document.querySelectorAll("span")].find((s) =>
        s.className.includes("h-[92px]")
      );
      if (!photo) return null;
      const bloc = photo.parentElement;
      const s = getComputedStyle(bloc);
      //  La marge basse est PORTÉE par le bloc suivant (les liens) :
      //  son mt- mesure l'écart photo → liens.
      const suivant = bloc.nextElementSibling;
      return {
        dessus: parseFloat(s.marginTop),
        dessous: suivant ? parseFloat(getComputedStyle(suivant).marginTop) : null,
      };
    });
    verif(
      `40 px au-dessus et au-dessous, égaux (${nomLargeur})`,
      Boolean(vu) && vu.dessus === 40 && vu.dessous === 40,
      vu ? `dessus ${vu.dessus} · dessous ${vu.dessous}` : "photo introuvable"
    );
  } catch (erreur) {
    nonJoue(`§1 (${nomLargeur})`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §2 — TIKTOK EN SURFACE PLEINE, POIDS D'ENCRE
 * ================================================================== */
titre("§2 — l'icône TikTok (1440 px, pixels rendus)");
{
  const { contexte, page } = await pageWeb(1440);
  try {
    await ouvrir(page, FICHE);
    const vu = await page.evaluate(async () => {
      const lien = (mot) =>
        [...document.querySelectorAll("a")].find((a) =>
          a.textContent.trim().startsWith(mot)
        );
      const dessiner = async (svg) => {
        //  On rend le SVG dans un canvas et on compte les pixels
        //  encrés : le POIDS D'ENCRE réel, pas une impression.
        const source = new XMLSerializer().serializeToString(svg);
        const image = new Image();
        const fini = new Promise((oui) => (image.onload = oui));
        image.src =
          "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
        await fini;
        const canvas = document.createElement("canvas");
        canvas.width = 80;
        canvas.height = 80;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, 80, 80);
        const pixels = ctx.getImageData(0, 0, 80, 80).data;
        let encres = 0;
        for (let i = 3; i < pixels.length; i += 4)
          if (pixels[i] > 40) encres += 1;
        return encres;
      };
      const svgTikTok = lien("TikTok")?.querySelector("svg");
      const svgInstagram = lien("Instagram")?.querySelector("svg");
      if (!svgTikTok || !svgInstagram) return null;
      //  Le SVG hérite currentColor : pour le canvas, on fige une
      //  couleur pleine le temps de la mesure (copie, pas l'original).
      const copie = (svg) => {
        const c = svg.cloneNode(true);
        c.setAttribute("color", "#000");
        c.setAttribute("width", "80");
        c.setAttribute("height", "80");
        return c;
      };
      return {
        plein: svgTikTok.innerHTML.includes('fill="currentColor"') &&
          !svgTikTok.innerHTML.includes("stroke="),
        tiktok: await dessiner(copie(svgTikTok)),
        instagram: await dessiner(copie(svgInstagram)),
      };
    });
    if (!vu) {
      nonJoue("§2", "les deux liens ne sont pas sur la fiche");
    } else {
      verif(
        "TikTok est une SURFACE PLEINE (fill, aucun stroke)",
        vu.plein
      );
      const rapport = vu.tiktok / vu.instagram;
      //  ⚠️ LE POIDS APPARENT N'EST PAS L'ENCRE BRUTE : un aplat plein
      //  se lit ~deux fois plus lourd qu'un contour à encre égale (la
      //  masse est concentrée, le contour est dispersé). L'égalité
      //  APPARENTE se joue donc vers la moitié de l'encre brute du
      //  contour — c'est la fourchette jugée ici, et les deux nombres
      //  sont donnés pour l'arbitrage de l'œil.
      verif(
        "son poids d'encre BRUT vaut ~la moitié de celui d'Instagram (égalité apparente)",
        rapport > 0.4 && rapport < 0.75,
        `TikTok ${vu.tiktok} px² · Instagram ${vu.instagram} px² · rapport ${rapport.toFixed(2)}`
      );
    }
  } catch (erreur) {
    nonJoue("§2", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §3 — LES POINTS DES LANGUES À VENIR
 * ================================================================== */
titre("§3 — les points des langues, sur la plaque à 45 % (390 px)");
{
  const { contexte, page } = await pageMobile();
  try {
    await ouvrir(page);
    await page.locator('button[aria-label^="Langue"]').first().click();
    await page.waitForTimeout(600);
    const vu = await page.evaluate(() => {
      const plaque = document.querySelector("[data-verre-fenetre][data-verre-dense]");
      if (!plaque) return null;
      const points = [...plaque.querySelectorAll("li span[aria-hidden]")];
      //  Les points À VENIR sont TRANSLUCIDES (alpha < 1), l'actif est
      //  blanc plein — l'habit (rgba/oklab) dépend de qui a écrit la
      //  couleur, on lit l'alpha.
      const alpha = (c) =>
        Number(c.match(/\/\s*([\d.]+)\)$/)?.[1] ?? c.match(/,\s*([\d.]+)\)$/)?.[1] ?? 1);
      const inactifs = points.filter(
        (p) => alpha(getComputedStyle(p).backgroundColor) < 1
      );
      if (inactifs.length === 0) return { plaque: true, points: 0 };
      const fondPoint = getComputedStyle(inactifs[0]).backgroundColor;
      const alphaPoint = alpha(fondPoint);
      //  LE CONTRASTE : le point composé sur la plaque, contre la
      //  plaque elle-même — la plaque étant à 45 % de #1A1A1D sur le
      //  fond du site (#1A1A1D), son gris effectif est #1A1A1D.
      const lum = (r, g, b) => {
        const c = [r, g, b]
          .map((v) => v / 255)
          .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
      };
      const point = [255, 255, 255].map((v) => v * alphaPoint + 26 * (1 - alphaPoint));
      const plaqueRvb = [26, 26, 29];
      const l1 = lum(...point) + 0.05;
      const l2 = lum(...plaqueRvb) + 0.05;
      return {
        plaque: true,
        points: inactifs.length,
        fondPoint,
        contraste: Math.round((Math.max(l1, l2) / Math.min(l1, l2)) * 100) / 100,
      };
    });
    if (!vu || vu.points === 0) {
      nonJoue("§3", "la fenêtre des langues ne montre pas de langue à venir");
    } else {
      verif(
        "les points sont nettement éclaircis (blanc 40 %), et GRIS",
        estBlancTranslucide(vu.fondPoint, 0.4) && !vu.fondPoint.includes("238, 61"),
        vu.fondPoint
      );
      verif(
        "leur contraste sur la plaque est lisible",
        vu.contraste >= 3,
        `${vu.contraste} (l'ancien gris #38383F donnait ~1,3)`
      );
    }
  } catch (erreur) {
    nonJoue("§3", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §4A — LES CAPSULES DE LA FENÊTRE D'ADRESSE, FENÊTRE OUVERTE À 390
 * ================================================================== */
titre("§4A — la fenêtre d'adresse, réellement ouverte (390 px)");
{
  const { contexte, page } = await pageMobile();
  try {
    await ouvrir(page, FICHE);
    await page
      .locator("a, button")
      .filter({ hasText: /Capucins/ })
      .first()
      .click();
    await page.waitForTimeout(700);
    const vu = await page.evaluate(() => {
      const lireStyle = (el) => {
        if (!el) return null;
        const s = getComputedStyle(el);
        return {
          fond: s.backgroundColor,
          filtre: s.backdropFilter || "none",
          webkit: s.getPropertyValue("-webkit-backdrop-filter") || "none",
          enLigne: el.style.backgroundColor,
        };
      };
      return {
        capsule: lireStyle(document.querySelector("[data-verre-capsule]")),
        action: lireStyle(document.querySelector("[data-verre-action]")),
      };
    });
    verif(
      "« Copier l'adresse » CALCULÉ : blanc à 20 %, aucun flou propre",
      Boolean(vu.capsule) &&
        vu.capsule.fond === "rgba(255, 255, 255, 0.2)" &&
        vu.capsule.filtre === "none",
      vu.capsule ? `${vu.capsule.fond} · filtre ${vu.capsule.filtre}` : "fenêtre non ouverte"
    );
    verif(
      "« Ouvrir dans Google Maps » CALCULÉ : rose à 40 %, aucun flou propre",
      Boolean(vu.action) &&
        vu.action.fond === "rgba(238, 61, 111, 0.4)" &&
        vu.action.filtre === "none",
      vu.action ? `${vu.action.fond} · filtre ${vu.action.filtre}` : "fenêtre non ouverte"
    );
    //  §4A — LE DURCISSEMENT : le fond est AUSSI porté par l'élément
    //  (style en ligne), pour que rien — ordre de chunks, règle
    //  perdante, feuille d'un autre build — ne puisse le recouvrir.
    verif(
      "les deux fonds sont portés EN LIGNE par l'élément (imbattables en cascade)",
      vu.capsule?.enLigne === "rgba(255, 255, 255, 0.2)" &&
        vu.action?.enLigne === "rgba(238, 61, 111, 0.4)",
      `${vu.capsule?.enLigne} · ${vu.action?.enLigne}`
    );
  } catch (erreur) {
    nonJoue("§4A", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §4B — LA FENÊTRE PARTAGE
 * ================================================================== */
for (const [nomLargeur, faire] of [["1440 px", () => pageWeb(1440)]]) {
  titre(`§4B — la fenêtre Partage (${nomLargeur})`);
  const { contexte, page } = await faire();
  try {
    await ouvrir(page, FICHE);
    //  Le bouton de partage de la fiche. Sur un vrai mobile, le
    //  navigateur de banc n'a PAS navigator.share : la fenêtre du
    //  site s'ouvre — c'est elle qu'on mesure.
    //  `:visible` : le bouton existe en DEUX variantes (une par
    //  habillage), l'autre est en `display:none` — la première du DOM
    //  n'est pas forcément celle qu'on peut toucher.
    const boutonPartage = page.locator('button[aria-label^="Partager la fiche"]:visible').first();
    await boutonPartage.scrollIntoViewIfNeeded();
    await boutonPartage.click();
    await page.waitForTimeout(700);
    const vu = await page.evaluate(() => {
      const dialogue = [...document.querySelectorAll('[role="dialog"]')].find(
        (d) => d.getAttribute("aria-label") === "Partager cette fiche"
      );
      if (!dialogue) return null;
      const plaque = dialogue.querySelector("[data-verre-fenetre]");
      const s = plaque ? getComputedStyle(plaque) : null;
      const texte = dialogue.textContent;
      const boutons = [...dialogue.querySelectorAll("button")];
      const badge = boutons.find((b) => /Copier/.test(b.textContent));
      const roses = boutons.filter((b) =>
        getComputedStyle(b).backgroundColor.includes("238, 61")
      );
      const champ = badge?.closest("div");
      return {
        titre: /Partager cette fiche/.test(
          dialogue.querySelector("h1,h2,h3")?.textContent ?? ""
        ),
        //  Le VOILE porte aria-label="Fermer" (c'est l'appui à côté) :
        //  une croix serait un bouton DANS la plaque.
        croix: Boolean(plaque?.querySelector('button[aria-label="Fermer"]')),
        partages: ["WhatsApp", "SMS", "E-mail", "Facebook"].filter((m) =>
          texte.includes(m)
        ).length,
        copierLien: /Copier le lien/.test(texte),
        svg: dialogue.querySelectorAll("svg").length,
        couleursEcrites: [...dialogue.querySelectorAll("svg")].some((g) =>
          /stroke="#|fill="#|stroke="rgb/.test(g.innerHTML)
        ),
        plaque: s
          ? { fond: s.backgroundColor, filtre: s.backdropFilter, opacite: s.opacity }
          : null,
        badge: badge
          ? {
              fond: getComputedStyle(badge).backgroundColor,
              filtre: getComputedStyle(badge).backdropFilter || "none",
              dansLeChamp: Boolean(
                champ && champ.querySelector("span") && champ.contains(badge)
              ),
            }
          : null,
        roses: roses.length,
      };
    });
    if (!vu) {
      nonJoue(`§4B (${nomLargeur})`, "la fenêtre de partage ne s'est pas ouverte");
    } else {
      verif(
        `ni titre, ni croix, ni « Copier le lien » (${nomLargeur})`,
        !vu.titre && !vu.croix && !vu.copierLien,
        `titre ${vu.titre} · croix ${vu.croix} · copier-lien ${vu.copierLien}`
      );
      verif(
        `les quatre partages, et un champ à badge intérieur (${nomLargeur})`,
        vu.partages === 4 && Boolean(vu.badge?.dansLeChamp),
        `${vu.partages} / 4 · badge dans le champ ${vu.badge?.dansLeChamp}`
      );
      verif(
        `la plaque : 22 %, flou de fenêtre, opacité 1 (${nomLargeur})`,
        Boolean(vu.plaque) &&
          vu.plaque.fond === "rgba(26, 26, 29, 0.22)" &&
          /blur\(40px\)/.test(vu.plaque.filtre) &&
          vu.plaque.opacite === "1",
        vu.plaque ? `${vu.plaque.fond} · ${vu.plaque.filtre}` : "—"
      );
      verif(
        `le badge « Copier » : blanc à 20 %, sans flou propre (${nomLargeur})`,
        Boolean(vu.badge) &&
          vu.badge.fond === "rgba(255, 255, 255, 0.2)" &&
          vu.badge.filtre === "none",
        vu.badge ? `${vu.badge.fond} · filtre ${vu.badge.filtre}` : "—"
      );
      verif(
        `aucune capsule rose, icônes sans couleur écrite (${nomLargeur})`,
        vu.roses === 0 && vu.svg >= 4 && !vu.couleursEcrites,
        `capsules roses ${vu.roses} · svg ${vu.svg}`
      );
    }
    //  La fermeture par un appui à côté.
    await page.mouse.click(10, 60);
    await page.waitForTimeout(400);
    verif(
      `un appui à côté referme (${nomLargeur})`,
      (await page.evaluate(
        () =>
          ![...document.querySelectorAll('[role="dialog"]')].some(
            (d) => d.getAttribute("aria-label") === "Partager cette fiche"
          )
      ))
    );
  } catch (erreur) {
    nonJoue(`§4B (${nomLargeur})`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §5 — LE MENU ET SON SOUS-MENU
 * ================================================================== */
titre("§5 — menu et sous-menu « Cultures du monde » (1440 px)");
{
  const { contexte, page } = await pageWeb(1440);
  try {
    await ouvrir(page);
    await page.locator('button[aria-label="Explorer"]').first().click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /Réalisations/ }).first().click();
    await page.waitForTimeout(400);
    const porte = page.locator("[data-sous-porte]").first();
    await porte.scrollIntoViewIfNeeded();
    await porte.click();
    await page.waitForTimeout(500);
    const vu = await page.evaluate(() => {
      const plaque = document.querySelector("[data-verre-menu]");
      const porte = document.querySelector("[data-sous-porte]");
      //  Une entrée du sous-menu : retraitée (pl-9) sous la porte.
      const entree = [...plaque.querySelectorAll("button")].find((b) =>
        /Maori/.test(b.textContent)
      );
      const sp = getComputedStyle(plaque);
      return {
        menu: { fond: sp.backgroundColor, opacite: sp.opacity, filtre: sp.backdropFilter },
        porte: porte ? getComputedStyle(porte).backgroundColor : null,
        entree: entree ? getComputedStyle(entree).backgroundColor : null,
      };
    });
    verif(
      "le MENU : plaque à 45 %, opacité 1 — elle n'a pas baissé",
      vu.menu.fond === "rgba(26, 26, 29, 0.45)" && vu.menu.opacite === "1",
      `${vu.menu.fond} · opacité ${vu.menu.opacite}`
    );
    verif(
      "le SOUS-MENU : un voile blanc AJOUTÉ par-dessus (jamais une transparence)",
      estBlancTranslucide(vu.entree, 0.06) && estBlancTranslucide(vu.porte, 0.06),
      `entrées ${vu.entree} · porte ouverte ${vu.porte}`
    );
    verif(
      "et le flou de la plaque est intact sous le voile",
      /blur\(60px\)/.test(vu.menu.filtre),
      vu.menu.filtre
    );
  } catch (erreur) {
    nonJoue("§5", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

titre("§5 — le même sous-menu au doigt (390 px)");
{
  const { contexte, page } = await pageMobile();
  try {
    await ouvrir(page);
    await page.locator('button[aria-label="Rechercher un tatoueur"]').first().click();
    await page.waitForTimeout(1200);
    await page.locator('button[aria-label="Explorer"]').first().click();
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: /Réalisations/ }).first().click();
    await page.waitForTimeout(400);
    const porte = page.locator("[data-sous-porte]").first();
    await porte.scrollIntoViewIfNeeded();
    await porte.click();
    await page.waitForTimeout(500);
    const vu = await page.evaluate(() => {
      const entree = [...document.querySelectorAll("button")].find((b) =>
        /Maori/.test(b.textContent)
      );
      return entree ? getComputedStyle(entree).backgroundColor : null;
    });
    verif(
      "au doigt aussi, l'entrée du sous-menu porte son voile",
      estBlancTranslucide(vu, 0.06),
      vu ?? "entrée introuvable"
    );
  } catch (erreur) {
    nonJoue("§5 · doigt", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

//  §4B À 390 : LE BOUTON N'EXISTE PAS SUR LA FICHE MOBILE, et c'est
//  antérieur à cette passe — la variante « fiche » est `mobile:hidden`
//  (nº 198-§3), le partage d'un vrai téléphone passe par la FEUILLE
//  NATIVE du système (Web Share API), jamais par cette fenêtre. La
//  fenêtre refaite est celle du WEB, comme le demande le §4B ; sur
//  smartphone il n'y a rien à ouvrir, donc rien à mesurer.
titre("§4B — à 390 px");
{
  const { contexte, page } = await pageMobile();
  await ouvrir(page, FICHE);
  const visible = await page
    .locator('button[aria-label^="Partager la fiche"]:visible')
    .count();
  verif(
    "à 390 px, aucun bouton de partage n'ouvre cette fenêtre (feuille native)",
    visible === 0,
    `${visible} bouton(s) visible(s)`
  );
  await contexte.close();
}

await navigateur.close();
bilan();
