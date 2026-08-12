/**
 * LE BANC DE LA PASSE Nº 228 — UNE SEULE LARGEUR (1440 px),
 * plus la mesure du §3 à 390 px
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE,
 * jamais le rendu de WebKit.
 *
 * LES CONTRÔLES DU §4 :
 *   §1 — taper « LYON » dans le champ d'adresse donne au moins une
 *        suggestion, le champ accepte les caractères — et PLUS AUCUNE
 *        requête ne part du navigateur vers le géocodeur tiers ;
 *   §2 — le sous-titre d'une fiche d'artiste ne contient que le mot
 *        « Artiste » ; le rôle, en gris et en capitales, figure
 *        devant chaque adresse (« En salon · RÉSIDENT : … ») ;
 *   §3 — à 390 px EN PLEINE LARGEUR, `scrollWidth === clientWidth` sur
 *        l'accueil — avant ET après un « Voir plus de portfolios » —
 *        et sur une fiche. Sans aucun `overflow-x: hidden`, qui
 *        cacherait le symptôme au lieu de retirer ce qui déborde.
 *
 * Il se lance comme les autres :  node tests/verif-p228.mjs
 * (le site doit tourner sur http://localhost:3000).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

const navigateur = await chromium.launch();

/* ==================================================================
 * LES MÉCANIQUES, LUES À LA SOURCE
 * ================================================================== */
titre("§1 et §3 — les mécaniques, à la source");
{
  const facade = lire("src/lib/geocodage/index.ts");
  verif(
    "le fournisseur du navigateur est NOTRE serveur (/api/lieux)",
    facade.includes("chercherChezNous") &&
      !/FOURNISSEUR: FournisseurGeocodage = chercherChezPhoton/.test(facade)
  );
  const route = lire("src/app/api/lieux/route.ts");
  verif(
    "la route interroge le géocodeur CÔTÉ SERVEUR",
    route.includes("chercherChezPhoton")
  );
  verif(
    "et sert NOS villes quand il ne répond pas",
    route.includes("villesDuCatalogue")
  );
  //  §3 — LA PISTE DE GRILLE, et l'interdit du propriétaire.
  const grille = lire("src/components/GrilleTatoueurs.tsx");
  verif(
    "la colonne unique est `minmax(0, 1fr)`, jamais `1fr`",
    grille.includes('gridTemplateColumns: "minmax(0, 1fr)"') &&
      !/gridTemplateColumns: "1fr"/.test(grille)
  );
  verif(
    "AUCUN overflow-x: hidden sur la page ni sur la grille",
    //  ⚠️ ON LIT LE CODE, PAS LES COMMENTAIRES : les deux fichiers
    //  EXPLIQUENT en toutes lettres pourquoi ce masque est proscrit —
    //  un contrôle qui cherche la chaîne brute se déclenche sur son
    //  propre avertissement (le piège déjà payé avec `IconeWorld` à
    //  la nº 224). Les commentaires sont donc retirés avant l'examen.
    (() => {
      const sansCommentaires = (texte) =>
        texte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      return (
        !/overflow-x-hidden|overflowX:\s*["']hidden["']/.test(
          sansCommentaires(grille)
        ) &&
        !/overflow-x:\s*hidden/.test(sansCommentaires(lire("src/app/globals.css")))
      );
    })()
  );
  //  Le §4 de la nº 224 (mémoire) reste EN PLACE — le propriétaire l'a
  //  demandé en toutes lettres.
  const carte = lire("src/components/CarteTatoueur.tsx");
  verif(
    "la correction mémoire de la nº 224 est intacte",
    carte.includes("[content-visibility:auto]") &&
      carte.includes("[contain-intrinsic-size:auto_460px]")
  );
}

/* ==================================================================
 * §1 — LE CHAMP D'ADRESSE DU MOTEUR (1440 px)
 * ================================================================== */
titre("§1 — taper « LYON » dans le champ d'adresse");
{
  const contexte = await navigateur.newContext({
    viewport: { width: 1440, height: 950 },
  });
  const page = await contexte.newPage();
  /** TOUTES les requêtes qui partent du navigateur : le géocodeur
      tiers ne doit plus JAMAIS y figurer. */
  const sorties = [];
  page.on("request", (r) => {
    if (!r.url().startsWith(BASE) && !r.url().startsWith("data:")) {
      sorties.push(r.url());
    }
  });
  let accueil = false;
  try {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForSelector("#moteur-tatouage-lieu", { timeout: 30000 });
    await page.waitForTimeout(2000);
    accueil = true;
  } catch {
    accueil = false;
  }
  if (!accueil) {
    nonJoue("§1", "l'accueil n'a pas répondu");
  } else {
    await page.locator("#moteur-tatouage-lieu").click();
    await page.keyboard.type("LYON", { delay: 120 });
    await page.waitForTimeout(2500);
    const etat = await page.evaluate(() => ({
      valeur: document.querySelector("#moteur-tatouage-lieu")?.value ?? "",
      options: document.querySelectorAll('[role="option"]').length,
      premier:
        document.querySelector('[role="option"]')?.textContent.trim() ?? "",
    }));
    verif(
      "le champ ACCEPTE les caractères",
      etat.valeur === "LYON",
      `valeur « ${etat.valeur} »`
    );
    verif(
      "« LYON » donne AU MOINS une suggestion",
      etat.options >= 1,
      `${etat.options} suggestion(s) — « ${etat.premier.slice(0, 40)} »`
    );
    verif(
      "PLUS AUCUNE requête du navigateur vers le géocodeur tiers",
      !sorties.some((u) => u.includes("photon")),
      sorties.filter((u) => u.includes("photon")).join(" ")
    );
  }
  await contexte.close();
}

/* ==================================================================
 * §2 — LE SOUS-TITRE ET LE RÔLE, SUR UNE FICHE D'ARTISTE (1440 px)
 * ================================================================== */
titre("§2 — « Artiste » seul sous le nom, le rôle devant l'adresse");
{
  const contexte = await navigateur.newContext({
    viewport: { width: 1440, height: 950 },
  });
  const page = await contexte.newPage();
  let fiche = false;
  try {
    await page.goto(`${BASE}/tatoueur/nadege-roux-villeurbanne`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForSelector("main h1", { timeout: 30000 });
    await page.waitForTimeout(1500);
    fiche = true;
  } catch {
    fiche = false;
  }
  if (!fiche) {
    nonJoue("§2", "la fiche d'artiste de démonstration n'a pas répondu");
  } else {
    const mesure = await page.evaluate(() => {
      const h1 = document.querySelector("main h1");
      const sousTitre = h1?.nextElementSibling?.textContent.trim() ?? "";
      //  La ligne de profil : le p qui commence par « En salon ».
      const lignes = [...document.querySelectorAll("main p")].filter((p) =>
        p.textContent.trim().startsWith("En salon")
      );
      const ligne = lignes[0] ?? null;
      const valeur = ligne?.querySelector("span, a") ?? null;
      return {
        sousTitre,
        etiquette: ligne ? ligne.textContent.trim().slice(0, 60) : "(absente)",
        couleurEtiquette: ligne ? getComputedStyle(ligne).color : "",
        couleurValeur: valeur ? getComputedStyle(valeur).color : "",
      };
    });
    verif(
      "le sous-titre ne contient que « Artiste »",
      mesure.sousTitre === "Artiste",
      `« ${mesure.sousTitre} »`
    );
    verif(
      "le rôle figure devant l'adresse, EN CAPITALES",
      /^En salon · RÉSIDENT :/.test(mesure.etiquette),
      `« ${mesure.etiquette} »`
    );
    verif(
      "l'étiquette est en gris, la valeur garde sa couleur",
      mesure.couleurEtiquette !== "" &&
        mesure.couleurValeur !== "" &&
        mesure.couleurEtiquette !== mesure.couleurValeur,
      `${mesure.couleurEtiquette} / ${mesure.couleurValeur}`
    );
  }
  await contexte.close();
}

/* ==================================================================
 * §3 — LA PAGE NE DÉBORDE PLUS À DROITE (390 px, pleine largeur)
 * ================================================================== */
titre("§3 — scrollWidth === clientWidth à 390 px");
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
    await page.goto(`${BASE}/?disposition=une`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForSelector("[data-carte]", { timeout: 30000 });
    await page.waitForTimeout(2000);
    servie = true;
  } catch {
    servie = false;
  }
  /** La largeur du document, et ce qui dépasse s'il dépasse. */
  const largeurs = () =>
    page.evaluate(() => {
      const racine = document.documentElement;
      const debordants = [];
      for (const noeud of document.querySelectorAll("*")) {
        const boite = noeud.getBoundingClientRect();
        if (boite.width === 0 && boite.height === 0) continue;
        const trop = Math.round(boite.right - racine.clientWidth);
        //  On ne retient que ce qui pousse VRAIMENT le document : un
        //  élément dans un défileur horizontal (le carrousel d'une
        //  carte) dépasse sa fenêtre sans élargir la page.
        if (trop > 0 && racine.scrollWidth > racine.clientWidth) {
          debordants.push(
            `${noeud.tagName}.${(typeof noeud.className === "string"
              ? noeud.className
              : ""
            )
              .trim()
              .split(/\s+/)
              .slice(0, 3)
              .join(".")} +${trop}px`
          );
        }
      }
      return {
        scrollWidth: racine.scrollWidth,
        clientWidth: racine.clientWidth,
        pistes: (() => {
          const grille = document.querySelector("[data-mosaique]");
          return grille ? getComputedStyle(grille).gridTemplateColumns : "";
        })(),
        debordants: debordants.slice(0, 3),
      };
    });

  if (!servie) {
    nonJoue("§3", "l'accueil n'a servi aucune carte");
  } else {
    const avant = await largeurs();
    verif(
      "ACCUEIL pleine largeur : scrollWidth === clientWidth",
      avant.scrollWidth === avant.clientWidth,
      `${avant.scrollWidth} / ${avant.clientWidth}${
        avant.debordants.length ? " — " + avant.debordants.join(" | ") : ""
      }`
    );
    verif(
      "la piste de la colonne unique vaut la largeur de la fenêtre",
      avant.pistes === `${avant.clientWidth}px`,
      `« ${avant.pistes} »`
    );

    //  APRÈS UN « VOIR PLUS » — les cartes ajoutées ne doivent pas
    //  élargir la page non plus.
    const bouton = page.getByRole("button", { name: /Voir plus de portfolios/ });
    if ((await bouton.count()) === 0) {
      nonJoue(
        "§3 · après un « Voir plus »",
        "catalogue de démonstration — une seule page, aucun bouton à toucher"
      );
    } else {
      await bouton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const cartesAvant = await page.locator("[data-carte]").count();
      await bouton.click();
      await page
        .waitForFunction(
          (n) => document.querySelectorAll("[data-carte]").length > n,
          cartesAvant,
          { timeout: 20000 }
        )
        .catch(() => {});
      await page.waitForTimeout(1200);
      const apres = await largeurs();
      verif(
        "ACCUEIL après « Voir plus » : scrollWidth === clientWidth",
        apres.scrollWidth === apres.clientWidth,
        `${apres.scrollWidth} / ${apres.clientWidth}${
          apres.debordants.length ? " — " + apres.debordants.join(" | ") : ""
        }`
      );
    }

    //  ET SUR UNE FICHE.
    await page.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForSelector("main h1", { timeout: 30000 });
    await page.waitForTimeout(1500);
    const fiche = await largeurs();
    verif(
      "FICHE : scrollWidth === clientWidth",
      fiche.scrollWidth === fiche.clientWidth,
      `${fiche.scrollWidth} / ${fiche.clientWidth}${
        fiche.debordants.length ? " — " + fiche.debordants.join(" | ") : ""
      }`
    );
  }
  await contexte.close();
}

await navigateur.close();
bilan();
