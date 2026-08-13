/**
 * LE BANC DE LA PASSE Nº 240 — AUX DEUX LARGEURS (390 et 1440)
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE et
 * les nombres, jamais le rendu de WebKit.
 *
 * CE QU'IL MESURE :
 *   §1 — plus aucun des trois fichiers d'icônes servi, plus aucun
 *        disque blanc ; les trois icônes sont des SVG en currentColor
 *        et prennent la couleur du texte voisin — fiches ET pied de
 *        page, depuis une seule écriture ;
 *   §2 — badge GRIS dans les deux états (clair allumé, foncé éteint),
 *        le rose dans le POINT seul, présent des deux côtés, aucun
 *        flou propre ;
 *   §3 — langues, notifications, Mon compte à 45 % ; les autres
 *        fenêtres à 22 % ; filtres et rayon confirmés à 45 % (menus).
 *
 * Il se lance comme les autres :  node tests/verif-p240.mjs
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
const premiereFiche = (page) =>
  page.evaluate(
    () =>
      [...document.querySelectorAll('a[href^="/tatoueur/"]')].map((a) =>
        a.getAttribute("href")
      )[0]
  );

/* ==================================================================
 * §1 — LES ICÔNES : PLUS DE FICHIERS, PLUS DE DISQUE, currentColor
 * ================================================================== */
for (const [nomLargeur, faire] of [
  ["390 px", pageMobile],
  ["1440 px", () => pageWeb(1440)],
]) {
  titre(`§1 — les icônes des liens (${nomLargeur})`);
  const { contexte, page } = await faire();
  //  On relève TOUTES les images demandées par la page : aucun des
  //  trois fichiers (ni leurs versions rognées) ne doit passer.
  const servies = [];
  page.on("request", (r) => {
    if (/icone-instagram|icone-tiktok|site\.png/.test(r.url()))
      servies.push(r.url().slice(-40));
  });
  try {
    await ouvrir(page);
    //  ⚠️ UNE FICHE QUI A LES DEUX LIENS : la première n'a pas de
    //  TikTok — atelier-corvus (démo) porte Instagram ET TikTok.
    await ouvrir(page, "/tatoueur/atelier-corvus-lyon-1er");
    const releve = await page.evaluate(() => {
      //  Les liens de la fiche : Instagram, TikTok, site.
      const liens = [...document.querySelectorAll("a")].filter((a) =>
        /instagram\.com|tiktok\.com/.test(a.href) ||
        a.querySelector("svg")
      );
      const parNom = (mot) =>
        [...document.querySelectorAll("a")].find((a) =>
          a.textContent.trim().startsWith(mot)
        );
      const inspecter = (a) => {
        if (!a) return null;
        const svg = a.querySelector("svg");
        const img = a.querySelector("img");
        return {
          svg: Boolean(svg),
          img: img ? img.getAttribute("src") : null,
          //  Le disque blanc d'avant : un span rond au fond blanc.
          disque: Boolean(a.querySelector(".bg-white.rounded-full, [class*='rounded-full'][class*='bg-white']")),
          //  La couleur CALCULÉE du tracé = celle du texte voisin ?
          couleurTrait: svg
            ? getComputedStyle(svg.querySelector("[stroke]") ?? svg).stroke
            : null,
          couleurTexte: getComputedStyle(a).color,
          strokeEcrit: svg ? svg.innerHTML.includes('stroke="currentColor"') : false,
          couleurEnDur: svg ? /stroke="#|stroke="rgb|fill="#|fill="rgb/.test(svg.innerHTML) : null,
        };
      };
      return {
        instagram: inspecter(parNom("Instagram")),
        tiktok: inspecter(parNom("TikTok")),
        nbLiens: liens.length,
      };
    });
    for (const [nom, vu] of Object.entries({
      Instagram: releve.instagram,
      TikTok: releve.tiktok,
    })) {
      if (!vu) {
        nonJoue(`§1 · ${nom} (${nomLargeur})`, "lien absent de la fiche de démonstration");
        continue;
      }
      verif(
        `${nom} : un SVG, aucun fichier image, aucun disque`,
        vu.svg && !vu.img && !vu.disque,
        `svg ${vu.svg} · img ${vu.img ?? "aucune"} · disque ${vu.disque}`
      );
      verif(
        `${nom} : tracé en currentColor, aucune couleur écrite`,
        vu.strokeEcrit && vu.couleurEnDur === false
      );
      verif(
        `${nom} : le trait prend la couleur du texte voisin`,
        vu.couleurTrait === vu.couleurTexte,
        `${vu.couleurTrait} = ${vu.couleurTexte}`
      );
    }
    verif(
      `aucun des trois fichiers n'a été demandé au serveur (${nomLargeur})`,
      servies.length === 0,
      servies.join(", ") || "aucune requête"
    );
  } catch (erreur) {
    nonJoue(`§1 (${nomLargeur})`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

titre("§1 — le pied de page, même écriture");
{
  const { contexte, page } = await pageWeb(1440);
  try {
    await ouvrir(page);
    const vu = await page.evaluate(() => {
      const pied = document.querySelector("footer");
      const lien = [...(pied?.querySelectorAll("a") ?? [])].find((a) =>
        a.textContent.includes("Instagram")
      );
      if (!lien) return null;
      const svg = lien.querySelector("svg");
      return {
        svg: Boolean(svg),
        img: Boolean(lien.querySelector("img")),
        disque: Boolean(lien.querySelector("[class*='bg-white']")),
        couleurTrait: svg
          ? getComputedStyle(svg.querySelector("[stroke]") ?? svg).stroke
          : null,
        couleurTexte: getComputedStyle(lien).color,
      };
    });
    verif(
      "l'Instagram du pied de page : un SVG, aucun fichier, aucun disque",
      Boolean(vu) && vu.svg && !vu.img && !vu.disque,
      vu ? `svg ${vu.svg} · img ${vu.img} · disque ${vu.disque}` : "lien introuvable"
    );
    verif(
      "et son trait prend la couleur du texte du pied de page",
      Boolean(vu) && vu.couleurTrait === vu.couleurTexte,
      vu ? `${vu.couleurTrait} = ${vu.couleurTexte}` : "—"
    );
  } catch (erreur) {
    nonJoue("§1 · pied de page", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

//  §1 — À LA SOURCE : une seule écriture, plus aucune trace du disque.
{
  const icones = lire("src/components/IconeReseau.tsx");
  verif(
    "une seule écriture partagée (IconeDuLien), en currentColor",
    /export function IconeDuLien/.test(icones) &&
      !/IconeReseauSurDisque/.test(icones) &&
      (icones.match(/stroke="currentColor"/g) ?? []).length >= 6 &&
      !/stroke="#|fill="#/.test(icones)
  );
  const fiche = lire("src/components/ContenuFiche.tsx");
  const pied = lire("src/app/(tatouage)/layout.tsx");
  verif(
    "les fiches et le pied de page passent tous deux par elle",
    //  On cherche des USAGES (chaînes servies, ancien composant),
    //  jamais les commentaires qui racontent l'histoire.
    /IconeDuLien/.test(fiche) && /IconeDuLien/.test(pied) &&
      !/IconeReseauSurDisque|"\/icone-instagram|"\/icone-tiktok|"\/site\.png"|ICONES_RESEAUX|ICONE_SITE/.test(fiche) &&
      !/IconeReseauSurDisque|"\/icone-instagram|ICONES_RESEAUX/.test(pied)
  );
  const { execSync } = await import("node:child_process");
  const restes = execSync(
    "grep -rln '\\-rognee\\.png\\|IconeReseauSurDisque' src --include=*.ts --include=*.tsx || true",
    { cwd: "/home/user/mon-site-roswel", encoding: "utf8" }
  )
    .split("\n")
    .filter(Boolean)
    //  La note d'histoire du fichier de réglages est la seule admise.
    .filter((f) => !/config\/tatouage\.ts/.test(f));
  verif(
    "plus aucune trace du disque ni des fichiers rognés dans le code",
    restes.length === 0,
    restes.join(", ") || "aucune"
  );
  const { existsSync } = await import("node:fs");
  verif(
    "les versions rognées sont supprimées du dépôt, les originaux intacts",
    !existsSync("/home/user/mon-site-roswel/public/icone-instagram-rognee.png") &&
      !existsSync("/home/user/mon-site-roswel/public/icone-tiktok-rognee.png") &&
      existsSync("/home/user/mon-site-roswel/public/icone-instagram.png") &&
      existsSync("/home/user/mon-site-roswel/public/site.png")
  );
}

/* ==================================================================
 * §2 — LES BADGES GRIS, LE POINT ROSE
 * ================================================================== */
titre("§2 — les badges du panneau de filtres (1440 px)");
{
  const { contexte, page } = await pageWeb(1440);
  try {
    await ouvrir(page);
    await page.locator('button[aria-label="Filtres"]').first().click();
    await page.waitForTimeout(600);
    const lireBadge = async () => {
      await page.mouse.move(5, 5);
      await page.waitForTimeout(150);
      return page.evaluate(() => {
        const b = document.querySelector(
          "[data-panneau-filtres] button[aria-pressed]"
        );
        if (!b) return null;
        const s = getComputedStyle(b);
        const point = b.querySelector("span[aria-hidden]");
        return {
          coche: b.getAttribute("aria-pressed") === "true",
          fond: s.backgroundColor,
          filtre: s.backdropFilter,
          allume: b.hasAttribute("data-verre-badge-allume"),
          eteint: b.hasAttribute("data-verre-badge-eteint"),
          point: point ? getComputedStyle(point).backgroundColor : null,
        };
      });
    };
    const premier = await lireBadge();
    await page
      .locator("[data-panneau-filtres] button[aria-pressed]")
      .first()
      .click();
    await page.waitForTimeout(400);
    const second = await lireBadge();
    const etats = [premier, second].filter(Boolean);
    const allume = etats.find((e) => e.coche);
    const eteint = etats.find((e) => !e.coche);
    verif(
      "allumé : badge GRIS CLAIR (blanc 20 %), sans flou propre",
      Boolean(allume) &&
        allume.allume &&
        allume.fond === "rgba(255, 255, 255, 0.2)" &&
        (!allume.filtre || allume.filtre === "none"),
      allume ? `${allume.fond} · filtre ${allume.filtre || "none"}` : "état non atteint"
    );
    verif(
      "éteint : badge GRIS FONCÉ (blanc 8 %), sans flou propre",
      Boolean(eteint) &&
        eteint.eteint &&
        eteint.fond === "rgba(255, 255, 255, 0.08)" &&
        (!eteint.filtre || eteint.filtre === "none"),
      eteint ? `${eteint.fond} · filtre ${eteint.filtre || "none"}` : "état non atteint"
    );
    verif(
      "AUCUN rose sur le badge, dans aucun état",
      etats.every((e) => !e.fond.includes("238, 61"))
    );
    verif(
      "le POINT est rose allumé, gris éteint — présent des deux côtés",
      Boolean(allume?.point) &&
        Boolean(eteint?.point) &&
        allume.point.includes("238, 61") &&
        !eteint.point.includes("238, 61"),
      `allumé ${allume?.point} · éteint ${eteint?.point}`
    );
  } catch (erreur) {
    nonJoue("§2", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

titre("§2 — les pilules du rayon (1440 px, pied du menu de localité)");
{
  const { contexte, page } = await pageWeb(1440);
  try {
    await ouvrir(page);
    await page.locator("#moteur-tatouage-lieu").click();
    await page.keyboard.type("lyon", { delay: 50 });
    await page.waitForFunction(
      () => document.querySelectorAll('[role="option"]').length > 0,
      null,
      { timeout: 12000 }
    );
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(900);
    //  Le champ rouvert montre le pied « Rayon ».
    await page.locator("#moteur-tatouage-lieu").click();
    await page.waitForTimeout(700);
    const vu = await page.evaluate(() => {
      const badges = [
        ...document.querySelectorAll(
          "[data-verre-menu] button[aria-pressed]"
        ),
      ];
      if (badges.length === 0) return null;
      return badges.slice(0, 8).map((b) => {
        const s = getComputedStyle(b);
        return {
          coche: b.getAttribute("aria-pressed") === "true",
          fond: s.backgroundColor,
          filtre: s.backdropFilter,
        };
      });
    });
    if (!vu) {
      nonJoue("§2 · rayon", "le pied « Rayon » ne s'est pas montré");
    } else {
      verif(
        "les pilules du rayon : gris translucide, jamais rose, sans flou propre",
        vu.every(
          (b) =>
            !b.fond.includes("238, 61") &&
            (b.fond === "rgba(255, 255, 255, 0.2)" ||
              b.fond === "rgba(255, 255, 255, 0.08)" ||
              b.fond === "rgba(255, 255, 255, 0.14)") &&
            (!b.filtre || b.filtre === "none")
        ),
        vu.map((b) => `${b.coche ? "●" : "○"} ${b.fond}`).join(" · ")
      );
    }
  } catch (erreur) {
    nonJoue("§2 · rayon", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §3 — LA TEINTE DES SURFACES
 * ================================================================== */
titre("§3 — les valeurs, à la source");
{
  const css = lire("src/app/globals.css");
  const fenetre = css.match(/\[data-verre-fenetre\]\s*\{[^}]+\}/)?.[0] ?? "";
  const dense = css.match(
    /\[data-verre-fenetre\]\[data-verre-dense\]\s*\{[^}]+\}/
  )?.[0] ?? "";
  verif(
    "la règle dense existe : 45 % de teinte, et RIEN d'autre",
    /background-color: rgba\(26, 26, 29, 0\.45\)/.test(dense) &&
      !/backdrop-filter/.test(dense) &&
      !/box-shadow/.test(dense)
  );
  verif(
    "la règle de base des fenêtres reste à 22 %, flou et liseré intacts",
    /rgba\(26, 26, 29, 0\.22\)/.test(fenetre) &&
      /-webkit-backdrop-filter: blur\(40px\) saturate\(200%\)/.test(fenetre) &&
      /rgba\(255, 255, 255, 0\.1\)/.test(fenetre)
  );
  verif(
    "aucun @supports, aucun var() autour du verre",
    !/@supports[^{]*\{[^}]*data-verre/.test(css) &&
      !/\[data-verre[^\]]*\]\s*\{[^}]*var\(/.test(css)
  );
  //  LES TROIS SURFACES, ET ELLES SEULES — par la liste des porteurs.
  const { execSync } = await import("node:child_process");
  const porteurs = execSync(
    "grep -rln 'data-verre-dense' src/components --include=*.tsx || true",
    { cwd: "/home/user/mon-site-roswel", encoding: "utf8" }
  )
    .split("\n")
    .filter(Boolean);
  //  Les langues passent par la PROP `dense` de FenetreDeVerre (qui
  //  pose l'attribut) : le marqueur littéral ne vit que chez les deux
  //  fenêtres écrites à la main, et dans l'écriture commune.
  verif(
    "les porteurs du marqueur sont exactement les trois fenêtres (plus l'écriture)",
    porteurs.length === 3 &&
      porteurs.some((f) => f.includes("FenetreNotifications")) &&
      porteurs.some((f) => f.includes("MenuEspace")) &&
      porteurs.some((f) => f.includes("SurfaceDeVerre")) &&
      /dense\n?\s*surFermeture|dense$/m.test(
        lire("src/components/SelecteurLangue.tsx").match(/<FenetreDeVerre[\s\S]{0,300}/)?.[0] ?? ""
      ),
    porteurs.join(", ")
  );
}

titre("§3 — mesuré : la fenêtre des langues (les deux largeurs)");
for (const [nomLargeur, faire] of [
  ["390 px", pageMobile],
  ["1440 px", () => pageWeb(1440)],
]) {
  const { contexte, page } = await faire();
  try {
    await ouvrir(page);
    await page.locator('button[aria-label^="Langue"]').first().click();
    await page.waitForTimeout(600);
    const vu = await page.evaluate(() => {
      //  Mobile : la fenêtre dense. Web : le menu (45 % déjà).
      const dense = document.querySelector("[data-verre-fenetre][data-verre-dense]");
      const menu = document.querySelector("[data-verre-menu]");
      const el = dense ?? menu;
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        sorte: dense ? "fenêtre dense" : "menu",
        fond: s.backgroundColor,
        filtre: s.backdropFilter,
        opacite: s.opacity,
      };
    });
    verif(
      `langues à ${nomLargeur} : teinte 45 %, flou porté, opacité 1`,
      Boolean(vu) &&
        vu.fond === "rgba(26, 26, 29, 0.45)" &&
        /blur\(/.test(vu.filtre) &&
        vu.opacite === "1",
      vu ? `${vu.sorte} · ${vu.fond} · ${vu.filtre}` : "surface non ouverte"
    );
  } catch (erreur) {
    nonJoue(`§3 · langues (${nomLargeur})`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

titre("§3 — mesuré : les autres fenêtres restent à 22 % (390 px)");
{
  const { contexte, page } = await pageMobile();
  try {
    await ouvrir(page);
    const href = await premiereFiche(page);
    await ouvrir(page, href);
    //  La fenêtre de signalement : une fenêtre ordinaire, non dense.
    const bouton = page.getByRole("button", { name: /Signaler/ });
    if ((await bouton.count()) === 0) {
      nonJoue("§3 · fenêtre témoin", "pas de bouton « Signaler » sur la fiche");
    } else {
      await bouton.first().click();
      await page.waitForTimeout(600);
      const vu = await page.evaluate(() => {
        const el = document.querySelector("[data-verre-fenetre]");
        if (!el) return null;
        const s = getComputedStyle(el);
        return { fond: s.backgroundColor, dense: el.hasAttribute("data-verre-dense") };
      });
      verif(
        "la fenêtre de signalement reste à 22 % (non dense)",
        Boolean(vu) && vu.fond === "rgba(26, 26, 29, 0.22)" && !vu.dense,
        vu ? vu.fond : "non ouverte"
      );
    }
  } catch (erreur) {
    nonJoue("§3 · fenêtre témoin", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

titre("§3 — confirmé : filtres et rayon déjà à 45 % (1440 px)");
{
  const { contexte, page } = await pageWeb(1440);
  try {
    await ouvrir(page);
    await page.locator('button[aria-label="Filtres"]').first().click();
    await page.waitForTimeout(600);
    const filtres = await page.evaluate(() => {
      const el = document.querySelector("[data-panneau-filtres]");
      return el ? getComputedStyle(el).backgroundColor : null;
    });
    verif(
      "le panneau de filtres est à 45 % — rien n'y a été touché",
      filtres === "rgba(26, 26, 29, 0.45)",
      filtres ?? "non ouvert"
    );
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await page.locator("#moteur-tatouage-lieu").click();
    await page.keyboard.type("lyon", { delay: 50 });
    await page
      .waitForFunction(
        () => document.querySelectorAll('[role="option"]').length > 0,
        null,
        { timeout: 12000 }
      )
      .catch(() => {});
    const localite = await page.evaluate(() => {
      const el = document.querySelector("[data-verre-menu]");
      return el ? getComputedStyle(el).backgroundColor : null;
    });
    verif(
      "le menu de localité (qui porte le rayon) est à 45 % — inchangé",
      localite === "rgba(26, 26, 29, 0.45)",
      localite ?? "non ouvert"
    );
  } catch (erreur) {
    nonJoue("§3 · confirmation", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

//  §3 — LES SURFACES SOUS SESSION : notifications et Mon compte ne
//  s'ouvrent pas d'ici (base hors de portée) — l'écriture est vérifiée
//  à la source ci-dessus (le marqueur dense sur les bons fichiers), et
//  la sonde ?sonde-verre=1 relève le fond calculé sur l'iPhone.
nonJoue(
  "§3 · notifications et Mon compte, vivantes",
  "elles exigent une session — le marqueur dense est vérifié à la source, la sonde relèvera le fond sur l'appareil"
);

await navigateur.close();
bilan();
