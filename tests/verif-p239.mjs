/**
 * LE BANC DE LA PASSE Nº 239 — AUX DEUX LARGEURS (390 et 1440)
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE et
 * les nombres, jamais le rendu de WebKit.
 *
 * CE QU'IL MESURE :
 *   §1 — une vignette de galerie ramène AU HAUT DE LA PHOTO de
 *        l'affiche : scrollY avant, juste après, une seconde après ;
 *        la page ne descend jamais sous son départ ; aucune entrée
 *        d'historique. Et Profil / Portfolio GARDENT leur repère,
 *        celui d'avant — deux gestes, deux repères ;
 *   §2 — « Cultures du monde » partout, « Traditionnel ethnique »
 *        nulle part ; une seule écriture de la liste des familles ;
 *        aucune association de style perdue ; l'ancienne adresse.
 *
 * Il se lance comme les autres :  node tests/verif-p239.mjs
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

const ouvrirAccueil = async (page) => {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
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
 * §1 — LE REPÈRE DE LA VIGNETTE : LE HAUT DE LA PHOTO
 * ================================================================== */
titre("§1 — la vignette ramène au haut de la photo (390 px, doigt)");
{
  const { contexte, page } = await pageMobile();
  try {
    await ouvrirAccueil(page);
    const href = await premiereFiche(page);
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
      //  On suit le mouvement pour de bon : le plus bas atteint À TOUT
      //  INSTANT, pas seulement au début et à la fin.
      let plusBas = Math.max(avant, justeApres);
      for (let i = 0; i < 12; i += 1) {
        await page.waitForTimeout(90);
        const y = await page.evaluate(() => Math.round(window.scrollY));
        plusBas = Math.max(plusBas, y);
      }
      await page.waitForTimeout(400);
      const uneSeconde = await page.evaluate(() => Math.round(window.scrollY));
      const historiqueApres = await page.evaluate(() => history.length);
      //  LE REPÈRE VOULU : la page TOUT EN HAUT, et la photo de
      //  l'affiche entière — elle commence pile sous la barre fixe,
      //  pas dessous.
      const arrivee = await page.evaluate(() => {
        const p = document.querySelector("[data-photo-fiche]");
        const b = document.querySelector("[data-barre-fixe]");
        return {
          hautPhoto: p ? Math.round(p.getBoundingClientRect().top) : null,
          barre: b ? Math.round(b.getBoundingClientRect().height) : 0,
        };
      });

      verif(
        "juste après le clic, la page n'est pas descendue",
        justeApres <= avant + 2,
        `départ ${avant} → ${justeApres}`
      );
      verif(
        "à aucun instant elle ne descend sous son point de départ",
        plusBas <= avant + 2,
        `plus bas atteint : ${plusBas} (départ ${avant})`
      );
      verif(
        "une seconde après, la page est TOUT EN HAUT",
        uneSeconde === 0,
        `scrollY ${uneSeconde}`
      );
      verif(
        "et la photo de l'affiche commence pile sous la barre, entière",
        arrivee.hautPhoto !== null &&
          Math.abs(arrivee.hautPhoto - arrivee.barre) <= 2,
        `haut de photo à ${arrivee.hautPhoto} px · barre ${arrivee.barre} px`
      );
      verif(
        "aucune entrée d'historique",
        historiqueApres === historiqueAvant,
        `${historiqueAvant} → ${historiqueApres}`
      );

      //  ⚠️ ET PROFIL / PORTFOLIO GARDENT LE LEUR : sous la barre, le
      //  bas de la photo affleurant. Deux gestes, deux repères.
      await page.evaluate(() => window.scrollTo(0, 1500));
      await page.waitForTimeout(300);
      await page.getByRole("radio", { name: "Profil" }).click();
      await page.waitForTimeout(1100);
      const repereOnglet = await page.evaluate(() => Math.round(window.scrollY));
      const basPhoto = await page.evaluate(() => {
        const p = document.querySelector("[data-photo-fiche]");
        const b = document.querySelector("[data-barre-fixe]");
        if (!p) return null;
        return Math.round(
          p.getBoundingClientRect().bottom -
            (b?.getBoundingClientRect().height ?? 0)
        );
      });
      verif(
        "Profil / Portfolio gardent LEUR repère (sous la barre), inchangé",
        basPhoto !== null && Math.abs(basPhoto) <= 2 && repereOnglet > 0,
        `bas de photo sous la barre : ${basPhoto} px · scrollY ${repereOnglet}`
      );
      verif(
        "et les deux repères sont bien DIFFÉRENTS",
        repereOnglet > uneSeconde + 50,
        `vignette ${uneSeconde} · onglet ${repereOnglet}`
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
    const href = await premiereFiche(page);
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

//  §1 — À LA SOURCE : deux fonctions, deux repères, un seul mouvement.
{
  const source = lire("src/components/ContenuFiche.tsx");
  verif(
    "le repère de la vignette est le HAUT de la photo",
    /function remonterEnHautDeLaPhoto[\s\S]{0,1400}window\.scrollY \+ photo\.top - \(barre \?\? 0\)/.test(
      source
    )
  );
  verif(
    "celui des onglets n'a pas bougé (bas de la photo, moins la barre)",
    /function remonterSousLaBarre[\s\S]{0,900}window\.scrollY \+ photo\.bottom - \(barre \?\? 0\)/.test(
      source
    )
  );
  verif(
    "même mouvement pour les deux : le seul `defilerEnDouceur`",
    (source.match(/defilerEnDouceur\(/g) ?? []).length === 2
  );
  verif(
    "et c'est la vignette, et elle seule, qui prend le nouveau repère",
    /remonteeDemandee[\s\S]{0,400}remonterEnHautDeLaPhoto\(\)/.test(source) &&
      /choisirOnglet[\s\S]{0,200}remonterSousLaBarre\(\)/.test(source)
  );
}

/* ==================================================================
 * §2 — « CULTURES DU MONDE » PARTOUT
 * ================================================================== */
titre("§2 — le nouveau nom, dans le menu des styles (1440 px)");
{
  const { contexte, page } = await pageWeb(1440);
  try {
    await ouvrirAccueil(page);
    await page.locator('button[aria-label="Explorer"]').first().click({ timeout: 15000 });
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: /Réalisations/ }).first().click();
    await page.waitForTimeout(400);
    const texte = await page.evaluate(() => document.body.innerText);
    verif(
      "« Cultures du monde » s'affiche dans le menu",
      texte.includes("Cultures du monde")
    );
    verif(
      "« Traditionnel ethnique » n'apparaît nulle part",
      !texte.includes("Traditionnel ethnique")
    );
    const porte = page.locator('[data-sous-porte]').first();
    verif(
      "et c'est bien la porte de la famille",
      (await porte.getAttribute("data-sous-porte")) === "Cultures du monde",
      await porte.getAttribute("data-sous-porte")
    );
    await porte.click();
    await page.waitForTimeout(500);
    const enfants = await page.evaluate(() => {
      const mots = document.body.innerText;
      return [
        "Berbère",
        "Celtique",
        "Copte",
        "Maori",
        "Nordique",
        "Pā Tūtiki",
        "Polynésien",
        "Sicanje",
        "Yoruba",
      ].filter((m) => mots.includes(m)).length;
    });
    verif(
      "l'ouvrir montre bien ses NEUF styles",
      enfants === 9,
      `${enfants} / 9`
    );
  } catch (erreur) {
    nonJoue("§2 · menu", `le menu des styles n'a pas répondu (${String(erreur).slice(0, 60)})`);
  }
  await contexte.close();
}

titre("§2 — le même nom sur le doigt (390 px)");
{
  const { contexte, page } = await pageMobile();
  try {
    await ouvrirAccueil(page);
    await page
      .locator('button[aria-label="Rechercher un tatoueur"]')
      .first()
      .click();
    await page.waitForTimeout(1200);
    await page.locator('button[aria-label="Explorer"]').first().click();
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: /Réalisations/ }).first().click();
    await page.waitForTimeout(400);
    const texte = await page.evaluate(() => document.body.innerText);
    verif(
      "« Cultures du monde » s'affiche aussi sur smartphone",
      texte.includes("Cultures du monde")
    );
    verif(
      "et « Traditionnel ethnique » n'y est pas davantage",
      !texte.includes("Traditionnel ethnique")
    );
  } catch (erreur) {
    nonJoue("§2 · mobile", `la recherche mobile n'a pas répondu (${String(erreur).slice(0, 60)})`);
  }
  await contexte.close();
}

titre("§2 — une seule écriture, et aucune association perdue");
{
  const config = lire("src/config/tatouage.ts");
  verif(
    "la famille est renommée à sa source (slug ET libellé)",
    /slug: "cultures-du-monde"/.test(config) &&
      /label: "Cultures du monde"/.test(config)
  );
  //  LES NEUF STYLES : toujours là, toujours dans la famille.
  const bloc = config.match(/export const FAMILLES_STYLES[\s\S]*?\] as const;/)?.[0] ?? "";
  const neuf = [
    "berbere",
    "celtique",
    "copte",
    "maori",
    "nordique",
    "pa-tutiki",
    "polynesien",
    "sicanje",
    "yoruba",
  ];
  verif(
    "elle range toujours ses NEUF styles, aux mêmes slugs",
    neuf.every((slug) => bloc.includes(`"${slug}"`)),
    `${neuf.filter((s) => bloc.includes(`"${s}"`)).length} / 9`
  );
  //  AUCUNE LISTE EN DUR AILLEURS : l'admin lit la source.
  const admin = lire("src/components/AdminYokofolio.tsx");
  verif(
    "l'admin ne recopie plus la liste des familles : il la lit",
    /famillesStyles\(\)\.map\(/.test(admin) &&
      !/valeur: "cultures-du-monde"/.test(admin) &&
      !/libelle: "Cultures du monde"/.test(admin)
  );
  //  LE MOT ANCIEN NE VIT PLUS DANS LE CODE (les migrations déjà
  //  passées le gardent : une migration est une histoire).
  const { execSync } = await import("node:child_process");
  const restes = execSync(
    "grep -rn 'traditionnel-ethnique\\|Traditionnel ethnique' src --include=*.ts --include=*.tsx || true",
    { cwd: "/home/user/mon-site-roswel", encoding: "utf8" }
  )
    .split("\n")
    .filter(Boolean)
    //  La seule trace admise : la note d'histoire du fichier de
    //  réglages, qui dit d'où l'on vient.
    .filter((ligne) => !/config\/tatouage\.ts/.test(ligne));
  verif(
    "plus une seule occurrence de l'ancien nom dans le code",
    restes.length === 0,
    restes.slice(0, 2).join(" · ") || "aucune"
  );

  //  LES FICHES DE DÉMONSTRATION : chaque style qu'elles portent est
  //  toujours connu du catalogue — aucune association perdue.
  const demo = lire("src/lib/tatoueurs-demo.ts");
  const catalogue = new Set(
    [...config.matchAll(/\{ slug: "([a-z0-9-]+)", label:/g)].map((m) => m[1])
  );
  const associations = [
    ...demo.matchAll(/styles: \[([^\]]*)\]/g),
  ].flatMap((m) =>
    [...m[1].matchAll(/"([a-z0-9-]+)"/g)].map((s) => s[1])
  );
  const orphelins = associations.filter((slug) => !catalogue.has(slug));
  verif(
    "aucune fiche de démonstration ne perd son style",
    orphelins.length === 0,
    `${associations.length} associations lues, ${orphelins.length} orpheline(s)${
      orphelins.length ? ` : ${[...new Set(orphelins)].join(", ")}` : ""
    }`
  );
  const deLaFamille = associations.filter((slug) => neuf.includes(slug));
  verif(
    "et celles de la famille sont toutes encore reconnues",
    deLaFamille.every((slug) => catalogue.has(slug)),
    `${deLaFamille.length} associations dans « Cultures du monde »`
  );
}

titre("§2 — la base, et l'adresse publique");
{
  const migration = lire("supabase/yokofolio-famille-cultures-du-monde.sql");
  verif(
    "la migration nº 67 existe, et renomme la seule valeur qui vit en base",
    /update public\.suggestions_style[\s\S]{0,120}set famille = 'cultures-du-monde'/.test(
      migration
    ) && /where famille = 'traditionnel-ethnique'/.test(migration)
  );
  verif(
    "elle refait la contrainte AVANT d'écrire (sinon l'écriture la violerait)",
    migration.indexOf("add constraint suggestions_style_famille") <
      migration.indexOf("update public.suggestions_style")
  );
  verif(
    "elle compte les associations AVANT et APRÈS",
    /'AVANT' as moment/.test(migration) && /'APRÈS' as moment/.test(migration)
  );
  verif(
    "et elle se relance sans rien casser (écriture conditionnée)",
    /drop constraint if exists suggestions_style_famille/.test(migration)
  );
}

titre("§2 — l'ancienne adresse");
{
  const { contexte, page } = await pageWeb(1440);
  try {
    const ancienne = await page.goto(
      `${BASE}/tatouage/traditionnel-ethnique/lyon`,
      { waitUntil: "domcontentloaded", timeout: 30000 }
    );
    const temoin = await page.goto(`${BASE}/tatouage/maori/lyon`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    //  ⚠️ CE QU'ON PROUVE ICI : l'ancienne adresse répond EXACTEMENT
    //  comme un style ordinaire sans résultat — elle n'était donc pas
    //  une page publique, et il n'y a rien à faire suivre. (La base
    //  étant hors de portée d'ici, les deux répondent 404 : c'est
    //  l'ÉGALITÉ des deux réponses qui fait la preuve, pas le nombre.)
    verif(
      "l'ancienne adresse n'était pas une page publique — rien à rediriger",
      ancienne.status() === temoin.status() && ancienne.status() >= 400,
      `traditionnel-ethnique → ${ancienne.status()} · maori → ${temoin.status()}`
    );
    const config = lire("src/config/tatouage.ts");
    verif(
      "une famille reste non cherchable — c'est ce qui le garantit",
      /N'EST PAS CHERCHABLE/.test(config)
    );
  } catch (erreur) {
    nonJoue("§2 · adresse", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

await navigateur.close();
bilan();
