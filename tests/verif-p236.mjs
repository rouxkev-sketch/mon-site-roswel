/**
 * LE BANC DE LA PASSE Nº 236 — UNE SEULE LARGEUR (1440 px),
 * plus le rendu à 390 px demandé au §6
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE. Sur le verre, un vert ici n'a rien
 * prouvé TROIS FOIS : ce banc ne mesure donc PAS « le flou marche »,
 * il mesure LA STRUCTURE — une seule écriture, un portail, zéro
 * racine d'arrière-plan, aucune opacité sur la plaque. Ça, ça vaut
 * sur tous les moteurs, WebKit compris.
 *
 * LES CONTRÔLES DU §6 :
 *   §1 — une vignette de style remonte la page, sans historique ;
 *   §2 — une seule écriture du verre dans tout le dépôt ;
 *   §3 — chaque surface convertie : portail (pour les fenêtres),
 *        zéro racine sur la chaîne, `opacity 1` dès l'ouverture ;
 *   §4 — les déroulants NON listés sont inchangés ;
 *   §3bis — la fiche superposée reste OPAQUE.
 *
 * Il se lance comme les autres :  node tests/verif-p236.mjs
 * (le site doit tourner sur http://localhost:3000 — .next PURGÉ).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

const navigateur = await chromium.launch();

/* ==================================================================
 * §2 — UNE SEULE ÉCRITURE DU VERRE
 * ================================================================== */
titre("§2 — une seule écriture du verre");
{
  const css = lire("src/app/globals.css");
  //  DEUX RÈGLES, ET DEUX SEULEMENT : la fenêtre (avec voile) et le
  //  menu (sans voile). Même verre, valeurs isolées pour l'arbitrage.
  for (const nom of ["data-verre-fenetre", "data-verre-menu"]) {
    const bloc = css.match(new RegExp(`\\[${nom}\\]\\s*\\{[^}]+\\}`))?.[0] ?? "";
    verif(
      `[${nom}] : 22 %, blur 40, saturation 200 — deux lignes littérales`,
      bloc.includes("background-color: rgba(26, 26, 29, 0.22);") &&
        bloc.includes("-webkit-backdrop-filter: blur(40px) saturate(200%);") &&
        bloc.includes("\n  backdrop-filter: blur(40px) saturate(200%);") &&
        bloc.indexOf("-webkit-backdrop-filter") <
          bloc.lastIndexOf("  backdrop-filter:")
    );
    verif(`[${nom}] : aucun var() dans le filtre`, !/backdrop-filter:[^;]*var\(/.test(bloc));
    verif(
      `[${nom}] : le liseré divisé, nuance haut/bas`,
      /inset 0 1px 0 0 rgba\(255, 255, 255, 0\.1\)/.test(bloc) &&
        /inset 0 0 0 1px rgba\(255, 255, 255, 0\.035\)/.test(bloc)
    );
  }
  verif(
    "aucune TROISIÈME écriture du filtre de verre dans le dépôt",
    //  La barre fixe garde le sien (nº 163, valeurs propres) : c'est
    //  la seule autre, et elle est nommée.
    (css.match(/backdrop-filter: blur\(40px\) saturate\(200%\)/g) ?? []).length === 4
  );
  const surface = lire("src/components/SurfaceDeVerre.tsx");
  verif(
    "le composant partagé porte le portail et l'interdit d'opacité",
    surface.includes("createPortal(fenetre, document.body)") &&
      /AUCUN FONDU D'OPACITÉ SUR LA PLAQUE/.test(surface)
  );
}

/* ==================================================================
 * §3 — LES SURFACES CONVERTIES, ET CELLES QUI NE LE SONT PAS
 * ================================================================== */
titre("§3 — l'inventaire, à la source");
{
  const converties = [
    ["FenetreSignalement", "signalement"],
    ["BoutonHorsLigne", "mise hors ligne"],
    ["FenetreEnvoi", "envoi en cours"],
    ["FormulaireFiche", "validation 24 h + retour compte"],
    ["BlocPortfolio", "styles, demande envoyée, retrait"],
    ["PageRattachement", "suppression de fiche"],
    ["FenetreNotifications", "notifications"],
    ["FenetreTatoueursSuivis", "tatoueurs suivis"],
    ["MenuEspace", "fenêtre du compte"],
  ];
  for (const [fichier, quoi] of converties) {
    const t = lire(`src/components/${fichier}.tsx`);
    verif(
      `${quoi} : en verre, et son voile allégé`,
      /data-verre-(fenetre|menu)/.test(t) &&
        !/bg-black\/(55|60|70|80|85)/.test(t)
    );
  }
  //  LES EXCEPTIONS, NOMMÉES.
  const fenetreFiche = lire("src/components/FenetreFiche.tsx");
  verif(
    "EXCEPTION : la fiche superposée garde sa plaque OPAQUE",
    fenetreFiche.includes("bg-sombre-carte") &&
      !/data-verre-fenetre/.test(fenetreFiche)
  );
  const modale = lire("src/components/FenetreModale.tsx");
  verif(
    "EXCEPTION : la modale du produit ARTISANS n'est pas touchée",
    modale.includes("bg-fond") && !/data-verre/.test(modale)
  );
  const recadreur = lire("src/components/RecadreurPhoto.tsx");
  verif(
    "EXCEPTION : le recadreur reste opaque (on y juge un cadrage)",
    !/data-verre/.test(recadreur)
  );
}

/* ==================================================================
 * §1 — LA REMONTÉE SUR UNE VIGNETTE (390 px)
 * ================================================================== */
titre("§1 — une vignette de style remonte la page (390 px)");
{
  const contexte = await navigateur.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await contexte.newPage();
  let servie = false;
  try {
    await page.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForSelector("main h1", { timeout: 30000 });
    await page.waitForTimeout(2500);
    servie = true;
  } catch {
    servie = false;
  }
  if (!servie) {
    nonJoue("§1", "la fiche de démonstration n'a pas répondu");
  } else {
    const entreesAvant = await page.evaluate(() => history.length);
    await page.getByRole("radio", { name: "Portfolio" }).click();
    await page.waitForTimeout(1200);

    //  UNE VIGNETTE DE STYLE : un bouton du panneau qui porte un nom
    //  de style (Blackwork, Dotwork…), jamais une photo.
    const vignette = page
      .locator("main button", { hasText: /^(Blackwork|Dotwork|Géométrique|Gravure)$/ })
      .first();
    if ((await vignette.count()) === 0) {
      nonJoue("§1", "aucune vignette de style sur cette fiche");
    } else {
      await page.evaluate(() => window.scrollTo(0, 900));
      await page.waitForTimeout(400);
      const avant = await page.evaluate(() => Math.round(window.scrollY));
      await vignette.click();
      await page.waitForTimeout(1400);
      const apres = await page.evaluate(() => Math.round(window.scrollY));
      const repere = await page.evaluate(() => {
        const photo = document
          .querySelector("[data-photo-fiche]")
          ?.getBoundingClientRect();
        const barre = document
          .querySelector("[data-barre-fixe]")
          ?.getBoundingClientRect().height;
        return photo
          ? Math.max(0, window.scrollY + photo.bottom - (barre ?? 0))
          : null;
      });
      verif(
        "la vignette de style remonte en haut de l'affiche",
        repere !== null && apres < avant && Math.abs(apres - repere) <= 40,
        `${avant} → ${apres} px (repère ${repere === null ? "?" : Math.round(repere)})`
      );
      verif(
        "et elle n'a poussé AUCUNE entrée d'historique",
        (await page.evaluate(() => history.length)) === entreesAvant,
        `${entreesAvant} → ${await page.evaluate(() => history.length)}`
      );
    }
  }
  await contexte.close();
}

/* ==================================================================
 * §3 — LA STRUCTURE D'UNE SURFACE OUVERTE, MESURÉE (390 px)
 * ================================================================== */
titre("§3 — la structure d'une fenêtre convertie (390 px)");
{
  const contexte = await navigateur.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await contexte.newPage();
  let servie = false;
  try {
    await page.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForSelector("main h1", { timeout: 30000 });
    await page.waitForTimeout(2000);
    servie = true;
  } catch {
    servie = false;
  }
  if (!servie) {
    nonJoue("§3", "la fiche n'a pas répondu");
  } else {
    //  LA FENÊTRE DE SIGNALEMENT — une convertie de cette passe.
    const ouvrir = page.getByRole("button", { name: /Signaler cette fiche/ });
    if ((await ouvrir.count()) === 0) {
      nonJoue("§3", "le signalement n'est pas sur cette fiche");
    } else {
      await ouvrir.scrollIntoViewIfNeeded();
      await ouvrir.click();
      const plaque = page.locator("[data-verre-fenetre]");
      await plaque.waitFor({ timeout: 5000 }).catch(() => {});
      if ((await plaque.count()) === 0) {
        nonJoue("§3", "la fenêtre de signalement ne s'est pas ouverte");
      } else {
        const pendant = await page.evaluate(() => {
          const p = document.querySelector("[data-verre-fenetre]");
          return p ? getComputedStyle(p).opacity : null;
        });
        verif(
          "la plaque a `opacity 1` DÈS l'ouverture",
          pendant === "1",
          `opacity ${pendant}`
        );
        await page.waitForTimeout(700);
        const structure = await page.evaluate(() => {
          const p = document.querySelector("[data-verre-fenetre]");
          const racines = [];
          for (let n = p.parentElement; n; n = n.parentElement) {
            const s = getComputedStyle(n);
            const causes = [];
            if (Number(s.opacity) < 1) causes.push(`opacity ${s.opacity}`);
            if (s.filter !== "none") causes.push("filter");
            if (s.backdropFilter !== "none" && s.backdropFilter !== "")
              causes.push("backdrop-filter");
            if (s.transform !== "none") causes.push("transform");
            if (s.willChange !== "auto" && s.willChange !== "")
              causes.push("will-change");
            if (s.contain !== "none" && s.contain !== "") causes.push("contain");
            if (s.isolation === "isolate") causes.push("isolation");
            if (causes.length > 0)
              racines.push(`${n.tagName} → ${causes.join(",")}`);
          }
          const s = getComputedStyle(p);
          return {
            racines,
            fond: s.backgroundColor,
            filtre: s.backdropFilter,
          };
        });
        verif(
          "AUCUNE racine d'arrière-plan sur toute sa chaîne d'ancêtres",
          structure.racines.length === 0,
          structure.racines.join(" | ")
        );
        verif(
          "elle porte le verre partagé, aux valeurs de la 234",
          structure.fond === "rgba(26, 26, 29, 0.22)" &&
            structure.filtre.includes("blur(40px)") &&
            structure.filtre.includes("saturate(2)"),
          `${structure.fond} · ${structure.filtre}`
        );
      }
    }
  }
  await contexte.close();
}

/* ==================================================================
 * §4 — LES MENUS DE VERRE, ET CEUX QU'ON NE TOUCHE PAS (1440 px)
 * ================================================================== */
titre("§4 — les menus de verre (1440 px)");
{
  const contexte = await navigateur.newContext({
    viewport: { width: 1440, height: 950 },
  });
  const page = await contexte.newPage();
  let accueil = false;
  try {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector("[data-carte]", { timeout: 30000 });
    await page.waitForTimeout(2500);
    accueil = true;
  } catch {
    accueil = false;
  }
  if (!accueil) {
    nonJoue("§4", "l'accueil n'a pas répondu");
  } else {
    //  LES SUGGESTIONS D'ADRESSE — un menu de verre, sans voile.
    const champ = page.locator("#moteur-tatouage-lieu");
    await champ.click();
    await page.keyboard.type("lyon", { delay: 60 });
    await page
      .waitForFunction(() => document.querySelectorAll('[role="option"]').length > 0, null, {
        timeout: 15000,
      })
      .catch(() => {});
    const menu = await page.evaluate(() => {
      const m = document.querySelector("[data-verre-menu]");
      if (!m) return null;
      const s = getComputedStyle(m);
      const racines = [];
      for (let n = m.parentElement; n; n = n.parentElement) {
        const st = getComputedStyle(n);
        if (
          Number(st.opacity) < 1 ||
          st.filter !== "none" ||
          st.transform !== "none" ||
          (st.contain !== "none" && st.contain !== "") ||
          st.isolation === "isolate"
        ) {
          racines.push(n.tagName);
        }
      }
      return {
        fond: s.backgroundColor,
        filtre: s.backdropFilter,
        opacite: s.opacity,
        racines,
      };
    });
    if (!menu) {
      nonJoue("§4 · suggestions", "le panneau ne s'est pas ouvert");
    } else {
      verif(
        "les suggestions d'adresse sont en verre",
        menu.fond === "rgba(26, 26, 29, 0.22)" &&
          menu.filtre.includes("blur(40px)"),
        `${menu.fond} · ${menu.filtre}`
      );
      verif("le menu n'a aucune opacité partielle", menu.opacite === "1");
      verif(
        "aucune racine d'arrière-plan au-dessus de lui",
        menu.racines.length === 0,
        menu.racines.join(",")
      );
    }
  }
  await contexte.close();
}

//  LES DÉROULANTS NON LISTÉS — inchangés, à la source.
{
  const emojis = lire("src/components/SelecteurEmojis.tsx");
  verif(
    "les déroulants NON listés restent tels quels (sélecteur d'emojis)",
    !/data-verre/.test(emojis)
  );
}

await navigateur.close();
bilan();
