/**
 * LE BANC DE LA PASSE Nº 232 — UNE SEULE LARGEUR (1440 px),
 * plus le rendu à 390 px demandé au §3
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE,
 * jamais le rendu de WebKit.
 *
 * LES CONTRÔLES DU §3 :
 *   §1 — les deux encadrés (adresse, membre d'équipe) sont IDENTIQUES
 *        — mêmes classes, à la lettre — et la pastille a l'élément
 *        encadré pour ancêtre dans les deux cas ; les horaires sont
 *        dehors, le chevron est inoffensif ;
 *   §2 — la fenêtre d'adresse se referme après CHACUNE des deux
 *        actions, et le compte d'entrées d'historique est inchangé
 *        après ouverture puis fermeture.
 *
 * Il se lance comme les autres :  node tests/verif-p232.mjs
 * (le site doit tourner sur http://localhost:3000 — .next PURGÉ
 * avant la mesure).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

const navigateur = await chromium.launch();

/* ==================================================================
 * §1 — L'ENCADRÉ UNIQUE, À LA SOURCE
 * ================================================================== */
titre("§1 — une seule écriture de l'encadré");
{
  const bloc = lire("src/components/BlocLieux.tsx");
  verif(
    "la constante CLASSES_LIGNE_CLIQUABLE existe, et elle est seule",
    bloc.includes("const CLASSES_LIGNE_CLIQUABLE") &&
      //  Les DEUX lignes la consomment : l'équipe et l'adresse.
      (bloc.match(/CLASSES_LIGNE_CLIQUABLE/g) ?? []).length >= 3
  );
  verif(
    "plus AUCUN encadré de ligne écrit en double",
    //  L'ancienne écriture en clair de l'équipe a disparu : la chaîne
    //  complète ne vit plus que dans la constante.
    (bloc.match(/group flex items-start gap-3\.5 rounded-xl -m-2 p-2/g) ?? [])
      .length === 1
  );
}

/* ==================================================================
 * §1 — LES DEUX ENCADRÉS, MESURÉS (1440 px)
 * ================================================================== */
const contexteWeb = await navigateur.newContext({
  viewport: { width: 1440, height: 950 },
});
const web = await contexteWeb.newPage();
let fiche = false;
try {
  await web.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await web.waitForSelector("main h1", { timeout: 30000 });
  await web.waitForTimeout(2500);
  fiche = true;
} catch {
  fiche = false;
}

if (!fiche) {
  nonJoue("§1 (1440 px)", "la fiche de démonstration n'a pas répondu");
} else {
  titre("§1 — l'encadré de l'adresse est celui de l'équipe");
  {
    const mesure = await web.evaluate(() => {
      const lienAdresse = document.querySelector('main a[href*="google.com/maps"]');
      const equipe = [...document.querySelectorAll("main ul")].find((ul) =>
        /Fondateur|Résident|Guest/.test(ul.textContent)
      );
      const lienMembre = equipe?.querySelector(':scope > li a[href^="/tatoueur/"]');
      const chevron = document.querySelector("main button[aria-expanded]");
      if (!lienAdresse || !lienMembre) return null;
      const pastilleAdresse = lienAdresse.querySelector("span.rounded-full");
      const pastilleMembre = lienMembre.querySelector("span.rounded-full");
      return {
        classesAdresse: lienAdresse.className,
        classesMembre: lienMembre.className,
        pastilleAdresseDedans:
          Boolean(pastilleAdresse) && lienAdresse.contains(pastilleAdresse),
        pastilleMembreDedans:
          Boolean(pastilleMembre) && lienMembre.contains(pastilleMembre),
        chevronDehors: chevron ? !lienAdresse.contains(chevron) : null,
        largeurAdresse: Math.round(lienAdresse.getBoundingClientRect().left),
        largeurMembre: Math.round(lienMembre.getBoundingClientRect().left),
        encadreAuDessusDesHoraires: chevron
          ? lienAdresse.getBoundingClientRect().bottom <=
            chevron.getBoundingClientRect().top + 1
          : null,
      };
    });
    if (!mesure) {
      nonJoue("§1", "l'adresse ou l'équipe manque sur cette fiche");
    } else {
      verif(
        "les DEUX encadrés portent les mêmes classes, à la lettre",
        mesure.classesAdresse === mesure.classesMembre,
        mesure.classesAdresse === mesure.classesMembre
          ? mesure.classesAdresse.slice(0, 60)
          : `« ${mesure.classesAdresse.slice(0, 50)} » ≠ « ${mesure.classesMembre.slice(0, 50)} »`
      );
      verif(
        "la pastille a l'encadré pour ancêtre — ADRESSE",
        mesure.pastilleAdresseDedans
      );
      verif(
        "la pastille a l'encadré pour ancêtre — MEMBRE",
        mesure.pastilleMembreDedans
      );
      verif(
        "les deux encadrés partent du même bord gauche",
        mesure.largeurAdresse === mesure.largeurMembre,
        `${mesure.largeurAdresse} / ${mesure.largeurMembre}`
      );
      if (mesure.chevronDehors === null) {
        nonJoue("§1 · horaires", "aucun volet d'horaires sur cette fiche");
      } else {
        verif("le chevron des horaires est HORS de l'encadré", mesure.chevronDehors);
        verif(
          "l'encadré s'arrête avant les horaires",
          mesure.encadreAuDessusDesHoraires === true
        );
      }
    }

    //  LE CHEVRON EST INOFFENSIF : il déplie, il ne navigue jamais.
    const chevron = web.locator("main button[aria-expanded]").first();
    if ((await chevron.count()) === 0) {
      nonJoue("§1 · chevron", "aucun volet d'horaires sur cette fiche");
    } else {
      const avant = web.url();
      const pages = web.context().pages().length;
      await chevron.click();
      await web.waitForTimeout(400);
      verif(
        "l'appui sur le chevron ne déclenche JAMAIS le lien de l'adresse",
        web.url() === avant &&
          web.context().pages().length === pages &&
          (await chevron.getAttribute("aria-expanded")) === "true"
      );
      await chevron.click();
      await web.waitForTimeout(200);
    }
  }
}
await contexteWeb.close();

/* ==================================================================
 * §2 — LA FENÊTRE SE REFERME APRÈS L'ACTION (390 px)
 * ================================================================== */
titre("§2 — la fenêtre d'adresse se referme après l'action (390 px)");
{
  const contexte = await navigateur.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    permissions: ["clipboard-read", "clipboard-write"],
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
    nonJoue("§2", "la fiche de démonstration n'a pas répondu");
  } else {
    const lien = page.locator('a[href*="google.com/maps"]').first();
    const fenetre = page.locator("[data-verre-fenetre]");
    const entreesAvant = await page.evaluate(() => history.length);

    //  ---- ACTION 1 : « Ouvrir dans Google Maps » ----
    await lien.scrollIntoViewIfNeeded();
    await lien.click();
    await fenetre.waitFor({ timeout: 5000 }).catch(() => {});
    if ((await fenetre.count()) !== 1) {
      nonJoue("§2", "la fenêtre d'adresse ne s'est pas ouverte");
    } else {
      verif(
        "l'ouverture n'a poussé AUCUNE entrée d'historique",
        (await page.evaluate(() => history.length)) === entreesAvant
      );
      //  Le lien part en nouvel onglet : on le laisse s'ouvrir, on le
      //  referme, et la fenêtre doit être partie D'ELLE-MÊME.
      const [popup] = await Promise.all([
        page.context().waitForEvent("page", { timeout: 8000 }).catch(() => null),
        page.locator("[data-verre-action]").click(),
      ]);
      await page.waitForTimeout(400);
      verif(
        "« Ouvrir dans Google Maps » : le lien s'ouvre ET la fenêtre se referme",
        popup !== null && (await fenetre.count()) === 0,
        popup ? "" : "aucun onglet ouvert"
      );
      if (popup) await popup.close().catch(() => {});

      //  ---- ACTION 2 : « Copier l'adresse » ----
      await lien.scrollIntoViewIfNeeded();
      await lien.click();
      await fenetre.waitFor({ timeout: 5000 }).catch(() => {});
      if ((await fenetre.count()) !== 1) {
        nonJoue("§2 · copie", "la fenêtre ne s'est pas rouverte");
      } else {
        await fenetre.getByRole("button", { name: "Copier l'adresse" }).click();
        await page.waitForTimeout(250);
        const motChange =
          (await fenetre
            .getByRole("button", { name: "Adresse copiée" })
            .count()) === 1;
        const encoreLa = (await fenetre.count()) === 1;
        await page.waitForTimeout(800);
        verif(
          "« Copier l'adresse » : le mot change, la fenêtre reste 600 ms puis part",
          motChange && encoreLa && (await fenetre.count()) === 0,
          motChange
            ? encoreLa
              ? ""
              : "partie avant d'avoir montré la confirmation"
            : "le mot n'a pas changé"
        );
      }

      verif(
        "l'historique n'a pas grossi d'un cran : compte identique",
        (await page.evaluate(() => history.length)) === entreesAvant,
        `${entreesAvant} avant, ${await page.evaluate(() => history.length)} après`
      );
    }
  }
  await contexte.close();
}

await navigateur.close();
bilan();
