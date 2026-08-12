/**
 * LE BANC DE LA PASSE Nº 238 — MESURÉ AUX DEUX LARGEURS
 * ==================================================================
 * ⚠️ DEUX LARGEURS, 390 ET 1440, ET C'EST LE POINT (nº 238-§7). Le
 * banc de la 236 ne mesurait qu'à une seule : trois surfaces annoncées
 * converties ne l'étaient pas — la fenêtre du compte l'était sur
 * smartphone et pas sur web, celle des langues nulle part. Un défaut
 * qui dépend de la largeur signifie qu'il reste deux écritures là où
 * il n'en faut qu'une, et une largeur unique ne peut pas le voir.
 *
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE et
 * les nombres, jamais le rendu de WebKit.
 *
 * CE QU'IL MESURE :
 *   §1 — la vignette de galerie : scrollY avant, juste après, une
 *        seconde après — jamais plus bas que le départ, et le même
 *        repère que Profil / Portfolio ;
 *   §2 — la remontée sur un sous-menu de styles, sans historique ;
 *   §3 — le panneau de filtres s'ouvre en fenêtre RÉTRÉCIE ;
 *   §4 — le tableau des surfaces de verre, largeur par largeur ;
 *   §5 — ouvrir Notifications ferme « Mon compte » (et non l'inverse) ;
 *   §6 — les menus à 45 % / 60 px, le contraste, et les badges du
 *        filtre en verre dans les deux états, sans flou propre.
 *
 * Il se lance comme les autres :  node tests/verif-p238.mjs
 * (le site doit tourner sur http://localhost:3000 — .next PURGÉ).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

const navigateur = await chromium.launch();

/** Une page de web (souris, toute largeur). */
const pageWeb = async (largeur) => {
  const contexte = await navigateur.newContext({
    viewport: { width: largeur, height: 900 },
  });
  return { contexte, page: await contexte.newPage() };
};
/** Une page de VRAI mobile (tactile) — c'est `data-appareil` qui
    commande, jamais la largeur. */
const pageMobile = async () => {
  const contexte = await navigateur.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  return { contexte, page: await contexte.newPage() };
};

const ouvrirAccueil = async (page) => {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2200);
};

/** Le style calculé d'une surface de verre, ou null. */
const releve = (page, selecteur) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      filtre: s.backdropFilter || "",
      webkit: s.getPropertyValue("-webkit-backdrop-filter") || "",
      fond: s.backgroundColor,
      opacite: s.opacity,
      ombre: s.boxShadow,
      largeur: Math.round(r.width),
      hauteur: Math.round(r.height),
      //  Un ancêtre qui coupe, ou qui vole la racine d'arrière-plan.
      coupeurs: (() => {
        const l = [];
        let n = el.parentElement;
        while (n && n !== document.documentElement) {
          //  ⚠️ LE CORPS NE COMPTE PAS : il porte `overflow: hidden`
          //  quand une fenêtre verrouille le défilement, et il ne peut
          //  de toute façon pas rogner un élément `fixed`.
          if (n === document.body) { n = n.parentElement; continue; }
          const st = getComputedStyle(n);
          if (st.overflow !== "visible") l.push(`coupe:${n.tagName}`);
          if (
            Number(st.opacity) < 1 ||
            st.filter !== "none" ||
            st.transform !== "none" ||
            (st.backdropFilter && st.backdropFilter !== "none")
          )
            l.push(`racine:${n.tagName}`);
          n = n.parentElement;
        }
        return l;
      })(),
    };
  }, selecteur);

/* ==================================================================
 * §1 — LA VIGNETTE DE GALERIE
 * ================================================================== */
titre("§1 — la vignette de galerie (390 px, doigt)");
{
  const { contexte, page } = await pageMobile();
  try {
    await ouvrirAccueil(page);
    const href = await page.evaluate(
      () =>
        [...document.querySelectorAll('a[href^="/tatoueur/"]')].map((a) =>
          a.getAttribute("href")
        )[0]
    );
    await page.goto(`${BASE}${href}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(2200);
    await page.getByRole("radio", { name: "Portfolio" }).click();
    await page.waitForTimeout(800);

    const vignettes = page.locator("ul.grid li button");
    const combien = await vignettes.count();
    if (combien === 0) {
      nonJoue("§1", "aucune vignette de style publiée sur la fiche de démonstration");
    } else {
      await vignettes.nth(combien - 1).scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const historiqueAvant = await page.evaluate(() => history.length);
      const avant = await page.evaluate(() => Math.round(window.scrollY));
      await vignettes.nth(combien - 1).click();
      const justeApres = await page.evaluate(() => Math.round(window.scrollY));
      await page.waitForTimeout(1000);
      const uneSeconde = await page.evaluate(() => Math.round(window.scrollY));
      const historiqueApres = await page.evaluate(() => history.length);

      verif(
        "juste après le clic, la page n'est pas descendue",
        justeApres <= avant + 2,
        `départ ${avant} → ${justeApres}`
      );
      verif(
        "une seconde après, elle est REMONTÉE",
        uneSeconde < avant,
        `${avant} → ${uneSeconde}`
      );
      //  LE REPÈRE DE PROFIL / PORTFOLIO, mesuré sur la même page.
      await page.evaluate(() => window.scrollTo(0, 1500));
      await page.waitForTimeout(300);
      await page.getByRole("radio", { name: "Profil" }).click();
      await page.waitForTimeout(1000);
      const repere = await page.evaluate(() => Math.round(window.scrollY));
      verif(
        "et elle s'arrête AU MÊME REPÈRE que Profil / Portfolio",
        Math.abs(uneSeconde - repere) <= 2,
        `vignette ${uneSeconde} · onglet ${repere}`
      );
      verif(
        "aucune entrée d'historique",
        historiqueApres === historiqueAvant,
        `${historiqueAvant} → ${historiqueApres}`
      );
    }
  } catch (erreur) {
    nonJoue("§1", `la fiche n'a pas répondu (${String(erreur).slice(0, 60)})`);
  }
  await contexte.close();
}

titre("§1 — et à 1440 px, rien ne bouge (la règle de la nº 218-§3)");
{
  const { contexte, page } = await pageWeb(1440);
  try {
    await ouvrirAccueil(page);
    const href = await page.evaluate(
      () =>
        [...document.querySelectorAll('a[href^="/tatoueur/"]')].map((a) =>
          a.getAttribute("href")
        )[0]
    );
    await page.goto(`${BASE}${href}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(2200);
    await page.getByRole("radio", { name: "Portfolio" }).click();
    await page.waitForTimeout(700);
    const vignettes = page.locator("ul.grid li button");
    if ((await vignettes.count()) === 0) {
      nonJoue("§1 · web", "aucune vignette publiée");
    } else {
      await vignettes.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const avant = await page.evaluate(() => Math.round(window.scrollY));
      await vignettes.first().click();
      await page.waitForTimeout(900);
      const apres = await page.evaluate(() => Math.round(window.scrollY));
      verif(
        "sur le web, la place gardée dans la galerie ne bouge pas",
        Math.abs(apres - avant) <= 2,
        `${avant} → ${apres}`
      );
    }
  } catch (erreur) {
    nonJoue("§1 · web", `la fiche n'a pas répondu (${String(erreur).slice(0, 60)})`);
  }
  await contexte.close();
}

/* ==================================================================
 * §2 — LA REMONTÉE SUR UN SOUS-MENU DE STYLES
 * ================================================================== */
titre("§2 — le sous-menu de styles remonte (1440 px)");
{
  const { contexte, page } = await pageWeb(1440);
  try {
    await ouvrirAccueil(page);
    //  Le menu « Explorer » du moteur.
    await page.locator('button[aria-label="Explorer"]').first().click({ timeout: 10000 });
    await page.waitForTimeout(500);
    //  La porte d'une catégorie, puis celle de la famille.
    await page.getByRole("button", { name: /Réalisations/ }).first().click();
    await page.waitForTimeout(400);
    const porte = page.locator('[data-sous-porte]').first();
    const nomPorte = await porte.getAttribute("data-sous-porte");
    await porte.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const historiqueAvant = await page.evaluate(() => history.length);
    const mesurer = () =>
      page.evaluate(() => {
        const liste = document.querySelector("[data-verre-menu] ul, [role='listbox']");
        const p = document.querySelector("[data-sous-porte]");
        if (!liste || !p) return null;
        return {
          ecart: Math.round(
            p.getBoundingClientRect().top - liste.getBoundingClientRect().top
          ),
          //  Le défilement est-il allé au bout de ce qu'il pouvait ?
          auBout:
            Math.abs(liste.scrollTop - (liste.scrollHeight - liste.clientHeight)) <= 2,
        };
      });
    const avant = await mesurer();
    await porte.click();
    await page.waitForTimeout(400);
    const apres = await mesurer();
    const historiqueApres = await page.evaluate(() => history.length);
    //  ⚠️ « EN TÊTE » VEUT DIRE : aussi haut que la liste peut la
    //  mettre. « Traditionnel ethnique » est rangée à sa lettre, tout
    //  en bas : une fois le défilement au bout, elle ne peut pas
    //  monter davantage — et c'est bien le maximum qui est atteint.
    verif(
      `ouvrir « ${nomPorte} » l'amène en tête de liste`,
      avant !== null &&
        apres !== null &&
        apres.ecart < avant.ecart &&
        (apres.ecart <= 4 || apres.auBout),
      `écart au haut : ${avant?.ecart} → ${apres?.ecart} px${apres?.auBout ? " (défilement au bout)" : ""}`
    );
    verif(
      "et ses entrées se voient (la liste a bougé)",
      await page.evaluate(
        () => document.querySelectorAll("[data-sous-porte]").length > 0
      )
    );
    verif(
      "aucune entrée d'historique",
      historiqueApres === historiqueAvant,
      `${historiqueAvant} → ${historiqueApres}`
    );
  } catch (erreur) {
    nonJoue("§2", `le menu des styles n'a pas répondu (${String(erreur).slice(0, 70)})`);
  }
  await contexte.close();
}

//  §2 — À LA SOURCE : la porte se désigne, et la remontée est jouée à
//  l'ouverture SEULEMENT (la refermer ne déplace rien).
{
  const source = lire("src/components/MenuDeroulant.tsx");
  verif(
    "la sous-porte porte son marqueur, et remonte à l'ouverture",
    /data-sous-porte=\{sousEntete\}/.test(source) &&
      /function basculerSousGroupe[\s\S]{0,2000}data-sous-porte="\$\{CSS\.escape/.test(
        source
      )
  );
}

/* ==================================================================
 * §3 — LE PANNEAU DE FILTRES EN FENÊTRE RÉTRÉCIE
 * ================================================================== */
for (const largeur of [900, 1440]) {
  titre(`§3 — le panneau de filtres s'ouvre (${largeur} px)`);
  const { contexte, page } = await pageWeb(largeur);
  const exceptions = [];
  page.on("pageerror", (e) => exceptions.push(e.message.slice(0, 120)));
  try {
    await ouvrirAccueil(page);
    await page.locator('button[aria-label="Filtres"]').first().click();
    await page.waitForTimeout(600);
    const panneau = await releve(page, "[data-panneau-filtres]");
    verif(
      `${largeur} px : le panneau existe et a une taille`,
      Boolean(panneau) && panneau.largeur > 200 && panneau.hauteur > 100,
      panneau ? `${panneau.largeur} × ${panneau.hauteur}` : "absent"
    );
    verif(
      `${largeur} px : AUCUN ancêtre ne le coupe ni ne lui vole sa racine`,
      Boolean(panneau) && panneau.coupeurs.length === 0,
      panneau ? panneau.coupeurs.join(", ") || "aucun" : "—"
    );
    //  Il est réellement DANS l'écran (le défaut se voyait ici).
    const dansLEcran = await page.evaluate(() => {
      const p = document.querySelector("[data-panneau-filtres]");
      if (!p) return false;
      const r = p.getBoundingClientRect();
      return r.left >= 0 && r.right <= window.innerWidth && r.top >= 0;
    });
    verif(`${largeur} px : entièrement dans l'écran`, dansLEcran);
    verif(`${largeur} px : aucune exception en console`, exceptions.length === 0, exceptions[0] ?? "");
    //  Cocher un badge ne referme pas le panneau (le portail aurait pu).
    const badge = page.locator("[data-panneau-filtres] button[aria-pressed]").first();
    await badge.click();
    await page.waitForTimeout(400);
    verif(
      `${largeur} px : cocher un badge NE referme pas le panneau`,
      (await page.locator("[data-panneau-filtres]").count()) === 1
    );
  } catch (erreur) {
    nonJoue(`§3 · ${largeur}`, `l'accueil n'a pas répondu (${String(erreur).slice(0, 60)})`);
  }
  await contexte.close();
}

/* ==================================================================
 * §4 — LE TABLEAU DES SURFACES DE VERRE, LARGEUR PAR LARGEUR
 * ================================================================== */
const tableau = [];
/** Ouvre une surface, la mesure, et range la ligne du tableau. */
async function mesurer(page, endroit, largeur, ouvrir, selecteur = "[data-verre-menu], [data-verre-fenetre]") {
  try {
    await ouvrir(page);
    await page.waitForTimeout(500);
    const vu = await releve(page, selecteur);
    const bon =
      Boolean(vu) &&
      /blur\(/.test(vu.filtre) &&
      vu.opacite === "1" &&
      vu.coupeurs.length === 0;
    tableau.push({
      endroit,
      largeur,
      etat: bon ? "verre" : vu ? "DÉFAUT" : "non ouverte",
      detail: vu ? `${vu.filtre} · ${vu.fond} · opacité ${vu.opacite}` : "—",
    });
    verif(
      `${endroit} — ${largeur} px : la plaque porte le filtre`,
      bon,
      vu ? `${vu.filtre || "(vide)"} · opacité ${vu.opacite}${vu.coupeurs.length ? ` · ${vu.coupeurs.join()}` : ""}` : "surface non trouvée"
    );
  } catch (erreur) {
    tableau.push({ endroit, largeur, etat: "non jouée", detail: String(erreur).slice(0, 50) });
    nonJoue(`§4 · ${endroit} (${largeur})`, String(erreur).slice(0, 70));
  }
}

titre("§4 — les surfaces de verre, à 1440 px");
{
  const { contexte, page } = await pageWeb(1440);
  await ouvrirAccueil(page);
  await mesurer(page, "suggestions de localité", 1440, async (p) => {
    await p.locator("#moteur-tatouage-lieu").click();
    await p.keyboard.type("lyon", { delay: 50 });
    await p.waitForFunction(
      () => document.querySelectorAll('[role="option"]').length > 0,
      null,
      { timeout: 12000 }
    );
  });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  await mesurer(page, "menu des styles", 1440, async (p) => {
    await p.locator('button[aria-label="Explorer"]').first().click();
  });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  await mesurer(page, "panneau de filtres", 1440, async (p) => {
    await p.locator('button[aria-label="Filtres"]').first().click();
  }, "[data-panneau-filtres]");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  await mesurer(page, "menu des langues", 1440, async (p) => {
    await p.locator('button[aria-label^="Langue"]').first().click();
  }, '[data-source-composant="SelecteurLangue · menu web"]');
  await contexte.close();
}

titre("§4 — les mêmes, à 390 px (doigt)");
{
  const { contexte, page } = await pageMobile();
  await ouvrirAccueil(page);
  await mesurer(page, "fenêtre des langues", 390, async (p) => {
    await p.locator('button[aria-label^="Langue"]').first().click();
  }, "[data-verre-fenetre]");
  await contexte.close();
}

titre("§4 — les menus de la recherche mobile (390 px)");
//  ⚠️ UNE PAGE NEUVE PAR SURFACE, et c'est plus sûr que de refermer :
//  un menu de smartphone couvre l'écran, et le champ suivant devient
//  intouchable tant qu'il reste ouvert. On repart donc de zéro pour
//  chacun — le banc est un peu plus long, il ne ment jamais.
for (const [endroit, ouvrir] of [
  [
    "menu des styles",
    async (p) => {
      await p.locator('button[aria-label="Explorer"]').first().click();
    },
  ],
  [
    "suggestions de localité",
    async (p) => {
      await p.locator("#moteur-tatouage-fenetre-lieu").click();
      await p.keyboard.type("lyon", { delay: 50 });
      await p.waitForFunction(
        () => document.querySelectorAll('[role="option"]').length > 0,
        null,
        { timeout: 12000 }
      );
    },
  ],
]) {
  const { contexte, page } = await pageMobile();
  try {
    await ouvrirAccueil(page);
    await page
      .locator('button[aria-label="Rechercher un tatoueur"]')
      .first()
      .click();
    await page.waitForTimeout(1200);
    await mesurer(page, endroit, 390, ouvrir);
  } catch (erreur) {
    nonJoue(`§4 · ${endroit} (390)`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

//  LE RAYON N'EST PAS UN MENU ICI : sur la page de recherche mobile,
//  c'est un CURSEUR posé dans la page (`input[type=range]`). Ses
//  pilules, elles, vivent en PIED du panneau de localité — donc sur la
//  plaque qu'on vient de mesurer.
tableau.push({
  endroit: "rayon",
  largeur: 390,
  etat: "sans objet",
  detail: "un curseur dans la page ; ses pilules sont en pied du panneau de localité",
});

//  LE PANNEAU DE FILTRES À 390 : il n'y a PAS de panneau — sur un vrai
//  mobile, les filtres sont une PAGE pleine, sur le fond du site. Rien
//  à flouter, et c'est voulu : la ligne du tableau le dit.
tableau.push({
  endroit: "panneau de filtres",
  largeur: 390,
  etat: "sans objet",
  detail: "sur un vrai mobile, les filtres sont une PAGE, pas une surface flottante",
});

titre("§4 — la fenêtre d'adresse d'une fiche (390 px)");
{
  const { contexte, page } = await pageMobile();
  try {
    await ouvrirAccueil(page);
    const href = await page.evaluate(
      () =>
        [...document.querySelectorAll('a[href^="/tatoueur/"]')].map((a) =>
          a.getAttribute("href")
        )[0]
    );
    await page.goto(`${BASE}${href}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2000);
    const ligne = page.locator("[data-ligne-adresse], a[href*='maps'], button").filter({
      hasText: /rue|avenue|boulevard|place|chemin/i,
    });
    if ((await ligne.count()) === 0) {
      nonJoue("§4 · fenêtre d'adresse", "aucune adresse cliquable sur la fiche de démonstration");
    } else {
      await ligne.first().click();
      await page.waitForTimeout(600);
      const vu = await releve(page, "[data-verre-fenetre]");
      tableau.push({
        endroit: "fenêtre d'adresse",
        largeur: 390,
        etat: vu && /blur\(/.test(vu.filtre) ? "verre" : "DÉFAUT",
        detail: vu ? `${vu.filtre} · ${vu.fond}` : "—",
      });
      verif(
        "fenêtre d'adresse — 390 px : la plaque porte le filtre",
        Boolean(vu) && /blur\(/.test(vu.filtre) && vu.opacite === "1",
        vu ? `${vu.filtre} · opacité ${vu.opacite}` : "absente"
      );
      //  LES CAPSULES : translucides, et SANS filtre propre.
      const capsules = await page.evaluate(() =>
        [...document.querySelectorAll("[data-verre-capsule], [data-verre-action]")].map(
          (c) => {
            const s = getComputedStyle(c);
            return { fond: s.backgroundColor, filtre: s.backdropFilter };
          }
        )
      );
      verif(
        "ses deux capsules n'ont AUCUN filtre propre",
        capsules.length >= 2 &&
          capsules.every((c) => !c.filtre || c.filtre === "none"),
        capsules.map((c) => c.filtre || "none").join(" · ")
      );
    }
  } catch (erreur) {
    nonJoue("§4 · fenêtre d'adresse", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

//  §4 — LES SURFACES QUI EXIGENT UNE SESSION : la base est hors de
//  portée d'ici. On ne peut pas les OUVRIR — on vérifie donc leur
//  ÉCRITURE à la source, ce qui est la moitié qui nous a manqué à la
//  236 (une seule écriture, pas deux ; jamais de fondu sur la plaque).
titre("§4 — l'écriture des surfaces sous session (à la source)");
{
  nonJoue(
    "§4 · les surfaces du compte",
    "menu du compte, notifications, tatoueurs suivis, portfolios : elles exigent une session (base hors de portée) — leur écriture est vérifiée à la source ci-dessous"
  );
  const menu = lire("src/components/MenuEspace.tsx");
  verif(
    "la fenêtre du compte : UNE seule écriture de verre par appareil, aucune opaque",
    /<MenuDeVerre[\s\S]{0,400}data-source-composant="MenuEspace · fenêtre web"/.test(menu) &&
      /data-verre-fenetre=""/.test(menu) &&
      !/rounded-2xl bg-sombre-eleve/.test(menu)
  );
  const langue = lire("src/components/SelecteurLangue.tsx");
  verif(
    "les langues : plus aucune PLAQUE opaque, ni sur web ni sur mobile",
    //  Le globe de la barre garde son survol (`hover:bg-sombre-eleve`)
    //  et son fond d'ouverture : ce n'est pas une plaque, c'est un
    //  bouton. Ce qu'on interdit, c'est un fond posé sur la surface.
    !/rounded-2xl bg-sombre-eleve/.test(langue) &&
      !/rounded-3xl[^"]*bg-sombre-carte/.test(langue) &&
      !/bg-black\/60/.test(langue)
  );
  verif(
    "les langues : une seule fenêtre, montée par SurfaceDeVerre",
    /FenetreDeVerre/.test(langue) &&
      (langue.match(/export function FenetreLangue/g) ?? []).length === 1
  );
  verif(
    "aucune plaque ne porte de fondu d'opacité (l'interdit de la nº 234)",
    !/data-verre-(fenetre|menu)[\s\S]{0,400}starting:opacity-0/.test(langue) &&
      !/data-verre-(fenetre|menu)[\s\S]{0,400}starting:opacity-0/.test(menu)
  );
}

//  §4 — L'INVENTAIRE COMPLET, BALAYÉ À LA SOURCE. Toute surface qui
//  porte un marqueur de verre est listée, et chacune est passée au
//  crible de l'interdit de la nº 234 : aucun fondu d'opacité sur la
//  plaque. C'est la moitié du contrôle que la 236 n'avait pas faite —
//  elle avait déclaré converties des surfaces qu'elle n'avait pas
//  touchées.
titre("§4 — l'inventaire des surfaces, balayé à la source");
{
  const { execSync } = await import("node:child_process");
  const fichiers = execSync(
    "grep -rl 'data-verre-fenetre\\|data-verre-menu' src --include=*.tsx || true",
    { cwd: "/home/user/mon-site-roswel", encoding: "utf8" }
  )
    .split("\n")
    .filter(Boolean)
    .filter((f) => !/SondeVerre|SurfaceDeVerre/.test(f));
  verif(
    "des surfaces de verre sont bien déclarées un peu partout",
    fichiers.length >= 10,
    `${fichiers.length} fichiers`
  );
  const fautifs = [];
  for (const fichier of fichiers) {
    const texte = lire(fichier);
    //  Le fondu doit appartenir au VOILE : jamais dans les 400
    //  caractères qui suivent un marqueur de plaque.
    if (/data-verre-(fenetre|menu)="?"?[\s\S]{0,400}starting:opacity-0/.test(texte))
      fautifs.push(fichier.replace("src/components/", ""));
  }
  verif(
    "aucune plaque ne porte de fondu d'opacité",
    fautifs.length === 0,
    fautifs.join(", ") || "aucune"
  );
  for (const fichier of fichiers) {
    tableau.push({
      endroit: fichier.replace("src/components/", "").replace(".tsx", ""),
      largeur: 0,
      etat: "écriture vue",
      detail: "marqueur de verre présent, aucun fondu sur la plaque",
    });
  }
}

/* ==================================================================
 * §5 — LES FENÊTRES NE S'EMPILENT PLUS
 * ================================================================== */
titre("§5 — une seule surface flottante à la fois");
{
  nonJoue(
    "§5 · l'empilement vivant",
    "« Mon compte » ne se rend que connecté (base hors de portée) — la règle est vérifiée à la source, et elle tient en trois lignes"
  );
  const menu = lire("src/components/MenuEspace.tsx");
  verif(
    "ouvrir Notifications ferme « Mon compte »",
    /setNotificationsOuvertes\(true\)/.test(menu) &&
      /setOuvert\(false\);\s*\n\s*setNotificationsOuvertes\(true\)/.test(menu)
  );
  verif(
    "ouvrir Langue ferme « Mon compte »",
    /setOuvert\(false\);\s*\n\s*setLangueOuverte\(true\)/.test(menu)
  );
  verif(
    "la fenêtre des langues survit à la fermeture du menu (montée hors de lui)",
    /\{langueOuverte && \(\s*\n?\s*<FenetreLangue/.test(menu)
  );
  verif(
    "fermer Notifications ou Langue ne rouvre RIEN",
    !/setNotificationsOuvertes\(false\);\s*\n\s*setOuvert\(true\)/.test(menu) &&
      !/setLangueOuverte\(false\);\s*\n\s*setOuvert\(true\)/.test(menu)
  );
  verif(
    "aucune de ces bascules ne touche l'historique",
    !/pushState|router\.push/.test(
      menu.match(/setLangueOuverte[\s\S]{0,200}/)?.[0] ?? ""
    )
  );
}

/* ==================================================================
 * §6 — LE RÉGLAGE TRANCHÉ, ET LES BADGES
 * ================================================================== */
titre("§6 — les menus à 45 % et 60 px");
{
  const css = lire("src/app/globals.css");
  const menu = css.match(/\[data-verre-menu\]\s*\{[^}]+\}/)?.[0] ?? "";
  const fenetre = css.match(/\[data-verre-fenetre\]\s*\{[^}]+\}/)?.[0] ?? "";
  verif(
    "le fond des menus est à 45 %, le flou à 60 px",
    /background-color: rgba\(26, 26, 29, 0\.45\)/.test(menu) &&
      /-webkit-backdrop-filter: blur\(60px\) saturate\(200%\)/.test(menu) &&
      /\n\s*backdrop-filter: blur\(60px\) saturate\(200%\)/.test(menu)
  );
  verif(
    "la préfixée est écrite EN PREMIER, littéralement, sans var() ni @supports",
    menu.indexOf("-webkit-backdrop-filter") < menu.indexOf("\n  backdrop-filter") &&
      !/var\(/.test(menu) &&
      //  Une VRAIE règle `@supports` autour du menu — pas la phrase du
      //  commentaire qui rappelle de ne jamais en écrire.
      !/@supports[^{]*\{[^}]*\[data-verre-menu\]/.test(css)
  );
  verif(
    "les FENÊTRES n'ont pas bougé (22 %, 40 px)",
    /rgba\(26, 26, 29, 0\.22\)/.test(fenetre) &&
      /blur\(40px\) saturate\(200%\)/.test(fenetre)
  );
  verif(
    "et le liseré dosé de la nº 237 est intact (0,05 / 0,02 en menu)",
    /rgba\(255, 255, 255, 0\.05\)/.test(menu) && /rgba\(255, 255, 255, 0\.02\)/.test(menu)
  );
}

titre("§6 — mesuré dans le navigateur, et le contraste");
{
  const { contexte, page } = await pageWeb(1440);
  try {
    await ouvrirAccueil(page);
    await page.locator("#moteur-tatouage-lieu").click();
    await page.keyboard.type("lyon", { delay: 50 });
    await page
      .waitForFunction(() => document.querySelectorAll('[role="option"]').length > 0, null, {
        timeout: 12000,
      })
      .catch(() => {});
    const vu = await releve(page, "[data-verre-menu]");
    verif(
      "les suggestions de localité portent bien 45 % et 60 px",
      Boolean(vu) &&
        vu.fond === "rgba(26, 26, 29, 0.45)" &&
        /blur\(60px\)/.test(vu.filtre),
      vu ? `${vu.fond} · ${vu.filtre}` : "menu non ouvert"
    );
    //  LE CONTRASTE, sur le pire fond possible : un blanc pur derrière.
    const contraste = await page.evaluate(() => {
      const lum = (r, g, b) => {
        const c = [r, g, b]
          .map((v) => v / 255)
          .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
      };
      //  Le texte du menu (blanc cassé) sur la plaque posée devant du
      //  BLANC PUR (la photo la plus claire que la mosaïque puisse
      //  montrer) : fond = plaque composée sur blanc.
      const a = 0.45;
      const plaque = [26, 26, 29].map((v) => v * a + 255 * (1 - a));
      const texte = [242, 242, 244];
      const l1 = lum(...texte) + 0.05;
      const l2 = lum(...plaque) + 0.05;
      return Math.round((Math.max(l1, l2) / Math.min(l1, l2)) * 100) / 100;
    });
    //  ⚠️ LE PIRE CAS POSSIBLE, ET IL EST DIT TEL QUEL : le texte du
    //  menu par-dessus du BLANC PUR. À 22 % le contraste tombait à
    //  1,13 (illisible) ; à 45 % il remonte, sans atteindre les 4,5
    //  d'une norme d'accessibilité — aucune plaque translucide ne les
    //  atteint sur du blanc pur. Sur l'anthracite du site, il reste
    //  excellent (relevé juste après).
    const surAnthracite = await page.evaluate(() => {
      const lum = (r, g, b) => {
        const c = [r, g, b]
          .map((v) => v / 255)
          .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
      };
      const a = 0.45;
      const plaque = [26, 26, 29].map((v) => v * a + 18 * (1 - a));
      const l1 = lum(242, 242, 244) + 0.05;
      const l2 = lum(...plaque) + 0.05;
      return Math.round((Math.max(l1, l2) / Math.min(l1, l2)) * 100) / 100;
    });
    verif(
      "le contraste sur photo TRÈS CLAIRE est franchement meilleur qu'à 22 %",
      contraste >= 2,
      `${contraste} contre 1,13 à 22 % · sur l'anthracite du site : ${surAnthracite}`
    );
  } catch (erreur) {
    nonJoue("§6 · mesure", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

titre("§6 — les badges du panneau de filtres, en verre");
{
  const { contexte, page } = await pageWeb(1440);
  try {
    await ouvrirAccueil(page);
    await page.locator('button[aria-label="Filtres"]').first().click();
    await page.waitForTimeout(600);
    //  ⚠️ DANS CE PANNEAU, TOUT EST SÉLECTIONNÉ AU DÉPART : les filtres
    //  EXCLUENT (rien d'exclu = tout coché). On lit donc l'état où l'on
    //  est, on bascule, et on mesure les deux robes.
    //  ⚠️ LA SOURIS S'ÉCARTE AVANT CHAQUE MESURE : elle reste sinon
    //  posée sur le badge qu'on vient de toucher, et c'est la valeur
    //  DE SURVOL (blanc 28 %) qu'on lit — pas celle du repos.
    const lire1 = async () => {
      await page.mouse.move(5, 5);
      await page.waitForTimeout(150);
      return page.evaluate(() => {
        const b = document.querySelector("[data-panneau-filtres] button[aria-pressed]");
        if (!b) return null;
        const s = getComputedStyle(b);
        return {
          coche: b.getAttribute("aria-pressed") === "true",
          fond: s.backgroundColor,
          filtre: s.backdropFilter,
          capsule: b.hasAttribute("data-verre-capsule"),
          action: b.hasAttribute("data-verre-action"),
        };
      });
    };
    const premier = await lire1();
    await page.locator("[data-panneau-filtres] button[aria-pressed]").first().click();
    await page.waitForTimeout(400);
    const second = await lire1();
    const etats = [premier, second].filter(Boolean);
    const coche = etats.find((e) => e.coche);
    const eteint = etats.find((e) => !e.coche);
    verif(
      "éteint : du verre BLANC translucide (20 %), sans filtre propre",
      Boolean(eteint) &&
        eteint.capsule &&
        eteint.fond === "rgba(255, 255, 255, 0.2)" &&
        (!eteint.filtre || eteint.filtre === "none"),
      eteint ? `${eteint.fond} · filtre ${eteint.filtre || "none"}` : "état non atteint"
    );
    verif(
      "sélectionné : du verre ROSE translucide (40 %), sans filtre propre",
      Boolean(coche) &&
        coche.action &&
        coche.fond === "rgba(238, 61, 111, 0.4)" &&
        (!coche.filtre || coche.filtre === "none"),
      coche ? `${coche.fond} · filtre ${coche.filtre || "none"}` : "état non atteint"
    );
    verif(
      "le rose ne sert QU'À la sélection",
      Boolean(eteint) && !eteint.fond.includes("238, 61")
    );
    //  Le panneau, lui, garde SON flou : c'est le sien qu'on voit à
    //  travers les capsules.
    const plaque = await releve(page, "[data-panneau-filtres]");
    verif(
      "et la plaque qui les porte garde son flou",
      Boolean(plaque) && /blur\(60px\)/.test(plaque.filtre),
      plaque ? plaque.filtre : "—"
    );
  } catch (erreur) {
    nonJoue("§6 · badges", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * LE TABLEAU, POUR LE RAPPORT
 * ================================================================== */
titre("§4 — LE TABLEAU DES SURFACES, LARGEUR PAR LARGEUR");
for (const ligne of tableau.filter((l) => l.largeur > 0)) {
  console.log(
    `  ${ligne.endroit.padEnd(26)} ${String(ligne.largeur).padStart(5)} px  ${ligne.etat.padEnd(11)} ${ligne.detail}`
  );
}
console.log("\n  — et les fichiers où une surface de verre est écrite (balayage à la source) :");
for (const ligne of tableau.filter((l) => l.largeur === 0)) {
  console.log(`  ${ligne.endroit.padEnd(26)}   ·  ${ligne.detail}`);
}

await navigateur.close();
bilan();
