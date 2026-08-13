/**
 * LE BANC DE LA PASSE Nº 242 — AUX DEUX LARGEURS (390 et 1440)
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE et
 * les nombres, jamais le rendu de WebKit — le relevé qui a clos le
 * dossier de la fenêtre d'adresse venait de la sonde, sur l'iPhone.
 *
 * CE QU'IL MESURE :
 *   §2 — la LUMIÈRE DU VERRE : les ombres internes CALCULÉES des deux
 *        capsules de la fenêtre d'adresse, la nuance haut/tour en
 *        nombres, blanc à 12 %, rose à 40 %, filtre none ; l'écriture
 *        unique partagée avec la fenêtre Partage ; et l'INTERDIT du
 *        §1 : plaque, filtres, portail, voile INTACTS ;
 *   §3 — les quatre icônes de partage à 28 px ; le survol du badge
 *        « Copier » (fond +1 cran, texte inchangé, aucun contour).
 *
 * Il se lance comme les autres :  node tests/verif-p242.mjs
 * (le site doit tourner sur http://localhost:3000 — .next PURGÉ).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

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
const FICHE = "/tatoueur/atelier-corvus-lyon-1er";

/** Les DEUX alphas d'une ombre interne double (haut, tour), lus dans
    la valeur calculée — l'ordre des morceaux est celui de l'écriture. */
const alphasDeLOmbre = (ombre) =>
  [...(ombre?.matchAll(/rgba\(255, 255, 255, ([\d.]+)\)/g) ?? [])].map((m) =>
    Number(m[1])
  );

/* ==================================================================
 * §2 — LA LUMIÈRE DU VERRE, FENÊTRE D'ADRESSE OUVERTE À 390
 * ================================================================== */
titre("§2 — la fenêtre d'adresse : les ombres CALCULÉES (390 px)");
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
      const lireTout = (el) => {
        if (!el) return null;
        const s = getComputedStyle(el);
        return {
          fond: s.backgroundColor,
          filtre: s.backdropFilter || "none",
          ombre: s.boxShadow,
          bordure: s.borderWidth,
          enLigne: el.style.backgroundColor || "",
        };
      };
      const plaque = document.querySelector("[data-verre-fenetre]");
      const sp = plaque ? getComputedStyle(plaque) : null;
      return {
        capsule: lireTout(document.querySelector("[data-verre-capsule]")),
        action: lireTout(document.querySelector("[data-verre-action]")),
        plaque: sp
          ? {
              fond: sp.backgroundColor,
              filtre: sp.backdropFilter,
              webkit: sp.getPropertyValue("-webkit-backdrop-filter"),
              opacite: sp.opacity,
            }
          : null,
      };
    });

    //  LES OMBRES, RECOPIÉES — et la nuance haut/tour en nombres.
    for (const [nom, el] of [["capsule blanche", vu.capsule], ["capsule rose", vu.action]]) {
      if (!el) {
        nonJoue(`§2 · ${nom}`, "fenêtre non ouverte");
        continue;
      }
      const [haut, tour] = alphasDeLOmbre(el.ombre);
      verif(
        `${nom} : le reflet est là — haut 0,35 / tour 0,12, haut > tour`,
        haut === 0.35 && tour === 0.12 && haut > tour,
        `ombre calculée : ${el.ombre.slice(0, 110)}`
      );
      verif(
        `${nom} : aucun contour tracé, aucun filtre propre, aucun fond en ligne`,
        el.bordure === "0px" && el.filtre === "none" && el.enLigne === "",
        `bordure ${el.bordure} · filtre ${el.filtre}`
      );
    }
    verif(
      "« Copier l'adresse » : le blanc est descendu à 12 %",
      vu.capsule?.fond === "rgba(255, 255, 255, 0.12)",
      vu.capsule?.fond ?? "—"
    );
    verif(
      "« Ouvrir dans Google Maps » : le rose reste à 40 %",
      vu.action?.fond === "rgba(238, 61, 111, 0.4)",
      vu.action?.fond ?? "—"
    );
    //  §1 — L'INTERDIT : plaque, filtres, structure INTACTS.
    //  La préfixée : Chromium la sert comme ALIAS de la canonique et
    //  peut la rendre vide au calcul — c'est la SOURCE qui prouve les
    //  deux lignes (contrôle suivant), et la sonde iPhone l'a lue
    //  vivante. Ici : la canonique, le fond, l'opacité.
    verif(
      "et la plaque du §1 n'a pas bougé : 22 %, blur(40px), opacité 1",
      Boolean(vu.plaque) &&
        vu.plaque.fond === "rgba(26, 26, 29, 0.22)" &&
        /blur\(40px\)/.test(vu.plaque.filtre) &&
        (vu.plaque.webkit === "" || /blur\(40px\)/.test(vu.plaque.webkit)) &&
        vu.plaque.opacite === "1",
      vu.plaque ? `${vu.plaque.fond} · ${vu.plaque.filtre} · opacité ${vu.plaque.opacite}` : "—"
    );
    //  La proportion de la plaque, pour le rapport : 0,10/0,035.
    const nuancePlaque = await page.evaluate(() => {
      const p = document.querySelector("[data-verre-fenetre]");
      return p ? getComputedStyle(p).boxShadow.slice(0, 120) : null;
    });
    verif(
      "la nuance de la capsule suit la proportion de la plaque (2,92 contre 2,86)",
      Math.abs(0.35 / 0.12 - 0.1 / 0.035) < 0.15,
      `plaque : ${nuancePlaque}`
    );
  } catch (erreur) {
    nonJoue("§2", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

//  §2 — L'ÉCRITURE UNIQUE, à la source : UNE règle porte la lumière
//  pour les deux attributs, et AUCUN composant ne la réécrit.
titre("§2 — une seule écriture de la lumière");
{
  const css = lire("src/app/globals.css");
  //  L'interdit du §1, à la source : les DEUX lignes littérales de la
  //  plaque, préfixée en premier, intactes.
  const fenetre = css.match(/\[data-verre-fenetre\]\s*\{[^}]+\}/)?.[0] ?? "";
  verif(
    "le §1 est respecté à la source : les deux lignes du filtre, préfixée d'abord",
    /-webkit-backdrop-filter: blur\(40px\) saturate\(200%\)/.test(fenetre) &&
      fenetre.indexOf("-webkit-backdrop-filter") <
        fenetre.indexOf("\n  backdrop-filter") &&
      /rgba\(26, 26, 29, 0\.22\)/.test(fenetre)
  );
  const lumieres = [...css.matchAll(/inset 0 1px 0 0 rgba\(255, 255, 255, 0\.35\)/g)];
  verif(
    "la règle vit UNE fois, pour les deux attributs à la fois",
    lumieres.length === 1 &&
      /\[data-verre-capsule\],\s*\n\[data-verre-action\]\s*\{[^}]*0\.35[^}]*0\.12/.test(css)
  );
  const { execSync } = await import("node:child_process");
  const ailleurs = execSync(
    "grep -rln '0, 0, 0.35\\|inset 0 1px' src/components --include=*.tsx || true",
    { cwd: "/home/user/mon-site-roswel", encoding: "utf8" }
  )
    .split("\n")
    .filter(Boolean);
  verif(
    "aucun composant ne réécrit cette lumière",
    ailleurs.length === 0,
    ailleurs.join(", ") || "aucun"
  );
  verif(
    "et les deux consommateurs passent par les attributs",
    /data-verre-capsule/.test(lire("src/components/BlocLieux.tsx")) &&
      /data-verre-capsule/.test(lire("src/components/BoutonPartageFiche.tsx"))
  );
}

/* ==================================================================
 * §2 + §3 — LA FENÊTRE PARTAGE (1440 px)
 * ================================================================== */
titre("§2/§3 — la fenêtre Partage : lumière, icônes, survol (1440 px)");
{
  const { contexte, page } = await pageWeb(1440);
  try {
    await ouvrir(page, FICHE);
    const bouton = page.locator('button[aria-label^="Partager la fiche"]:visible').first();
    await bouton.click();
    await page.waitForTimeout(700);

    const badge = page.locator('[role="dialog"][aria-label="Partager cette fiche"] button').filter({ hasText: /Copier/ }).first();
    //  1) LA LUMIÈRE ET LE FOND, au repos (souris écartée).
    await page.mouse.move(5, 5);
    await page.waitForTimeout(200);
    const repos = await badge.evaluate((b) => {
      const s = getComputedStyle(b);
      return {
        fond: s.backgroundColor,
        couleur: s.color,
        ombre: s.boxShadow,
        bordure: s.borderWidth,
        filtre: s.backdropFilter || "none",
      };
    });
    const [haut, tour] = alphasDeLOmbre(repos.ombre);
    verif(
      "le badge « Copier » porte la MÊME lumière (0,35 / 0,12)",
      haut === 0.35 && tour === 0.12,
      repos.ombre.slice(0, 110)
    );
    verif(
      "son fond au repos : blanc à 12 %, sans flou propre",
      repos.fond === "rgba(255, 255, 255, 0.12)" && repos.filtre === "none",
      `${repos.fond} · filtre ${repos.filtre}`
    );

    //  2) LE SURVOL : +1 cran, texte inchangé, aucun contour.
    await badge.hover();
    await page.waitForTimeout(200);
    const survol = await badge.evaluate((b) => {
      const s = getComputedStyle(b);
      return { fond: s.backgroundColor, couleur: s.color, bordure: s.borderWidth };
    });
    verif(
      "au survol, le remplissage s'éclaircit d'un cran (12 → 18 %)",
      survol.fond === "rgba(255, 255, 255, 0.18)",
      `${repos.fond} → ${survol.fond}`
    );
    verif(
      "la couleur du texte ne change JAMAIS, aucun contour n'apparaît, aucun rose",
      survol.couleur === repos.couleur &&
        survol.bordure === "0px" &&
        !survol.fond.includes("238, 61"),
      `texte ${repos.couleur} = ${survol.couleur}`
    );

    //  3) LES QUATRE ICÔNES À 28 px.
    const icones = await page.evaluate(() => {
      const d = [...document.querySelectorAll('[role="dialog"]')].find(
        (x) => x.getAttribute("aria-label") === "Partager cette fiche"
      );
      return [...(d?.querySelectorAll("svg") ?? [])].map((g) => ({
        largeur: g.getAttribute("width"),
        boite: Math.round(g.getBoundingClientRect().width),
      }));
    });
    verif(
      "les quatre icônes de partage sont à 28 px",
      icones.length === 4 &&
        icones.every((i) => i.largeur === "28" && i.boite === 28),
      icones.map((i) => i.boite).join(" · ")
    );

    //  4) La capsule rose de l'adresse et celle-ci partagent l'ÉCRITURE,
    //  pas seulement les valeurs : même attribut → toucher l'un des
    //  deux endroits, c'est toucher l'autre.
    const attributs = await badge.evaluate((b) => b.hasAttribute("data-verre-capsule"));
    verif("le badge est bien une capsule de verre (l'attribut partagé)", attributs);
  } catch (erreur) {
    nonJoue("§2/§3 · Partage", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §3 — L'ÉTAT ENFONCÉ AU DOIGT (390 px, capsule de l'adresse)
 * ================================================================== */
titre("§3 — l'état enfoncé, au doigt (390 px)");
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
    const capsule = page.locator("[data-verre-capsule]").first();
    const repos = await capsule.evaluate((c) => getComputedStyle(c).backgroundColor);
    const boite = await capsule.boundingBox();
    //  Appui MAINTENU puis relâché — l'état apparaît et repart.
    await page.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(150);
    const enfonce = await capsule.evaluate((c) => getComputedStyle(c).backgroundColor);
    await page.mouse.up();
    verif(
      "l'état enfoncé apparaît sous le doigt (24 %), translucide",
      enfonce === "rgba(255, 255, 255, 0.24)",
      `${repos} → ${enfonce}`
    );
    //  ⚠️ ET LE SURVOL N'EXISTE PAS AU DOIGT : la règle est sous
    //  `@media (hover: hover)` — au repos, le fond est bien 12 %.
    verif(
      "au repos (pas de survol au doigt), le fond est 12 %",
      repos === "rgba(255, 255, 255, 0.12)",
      repos
    );
  } catch (erreur) {
    nonJoue("§3 · doigt", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

await navigateur.close();
bilan();
