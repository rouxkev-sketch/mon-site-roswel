/**
 * LE BANC DE LA PASSE Nº 226 — UNE SEULE LARGEUR (1440 px),
 * plus la mesure du §1 aux TROIS largeurs demandées (390, 900, 1440)
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE,
 * jamais le rendu de WebKit.
 *
 * ⚠️ LA BASE EST HORS DE PORTÉE D'ICI : l'accueil sert les DIX-NEUF
 * fiches de démonstration. C'est assez pour mesurer le §1 à 390 px
 * (2 colonnes → 12 cartes, puis 19 au premier « Voir plus ») et à
 * 900 px (3 colonnes → 18) ; à 1440 px, dix-neuf fiches tiennent sous
 * les vingt-quatre demandées — le contrôle de coupe y est NON JOUÉ, et
 * il le dit. Une TROISIÈME page n'existe pas dans ce catalogue : le
 * contrôle d'intersection se joue sur les DEUX pages atteignables.
 *
 * LES CONTRÔLES DU §6 :
 *   §1 — taille de page = colonnes × 6, décidée par le cookie du
 *        script d'avant peinture ; aucune carte en double ni sautée
 *        (les pages sont des PRÉFIXES d'un même ordre) ; dernière
 *        ligne complète tant qu'il reste des cartes à voir ;
 *   §2 — les cinq titres de badges, dans l'ordre et avec ces mots :
 *        STYLES, RENDU, TECHNIQUE, TYPES DE PROJETS, BESOINS
 *        PARTICULIERS ;
 *   §3 — le sélecteur Adresse / Autre adresse a DISPARU (code
 *        compris) ; « Autre adresse : » en lien Google Maps ;
 *        l'équipe APRÈS toutes les adresses ;
 *   §4 — toute la ligne d'équipe est UN lien : la pastille a le lien
 *        pour ancêtre ;
 *   §5 — un membre d'équipe s'ouvre en FENÊTRE superposée (web ET
 *        mobile), UNE entrée d'historique par ouverture, chaque
 *        retour défait UN cran, la position de défilement revient,
 *        et l'adresse directe rend toujours une page serveur.
 *
 * Il se lance comme les autres :  node tests/verif-p226.mjs
 * (le site doit tourner sur http://localhost:3000).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

const navigateur = await chromium.launch();

/* ==================================================================
 * §1 — CE QUE LE CODE DIT, LU À LA SOURCE
 * ================================================================== */
titre("§1 — la taille de page, à la source");
{
  const paliers = lire("src/lib/colonnes-mosaique.ts");
  const grille = lire("src/components/GrilleTatoueurs.tsx");
  const script = lire("src/lib/script-avant-peinture.ts");
  const accueil = lire("src/app/(tatouage)/page.tsx");

  verif(
    "six cartes par colonne (CARTES_PAR_COLONNE = 6)",
    /CARTES_PAR_COLONNE = 6/.test(paliers)
  );
  //  LES PALIERS SONT CEUX DE LA GRILLE — les mêmes points de rupture
  //  que les classes Tailwind (md 48rem, xl 80rem, 2xl 96rem,
  //  3xl 104rem), sans copie divergente.
  verif(
    "les paliers du cookie sont ceux des classes de la grille",
    paliers.includes('"(min-width: 104rem)", colonnes: 6') &&
      paliers.includes('"(min-width: 96rem)", colonnes: 5') &&
      paliers.includes('"(min-width: 80rem)", colonnes: 4') &&
      paliers.includes('"(min-width: 48rem)", colonnes: 3') &&
      /COLONNES_AU_DOIGT = 2/.test(paliers) &&
      grille.includes(
        "grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6"
      )
  );
  verif(
    "le cookie est écrit par le script d'avant peinture, et par lui seul",
    script.includes("COOKIE_COLONNES") &&
      !/COOKIE_COLONNES/.test(grille) &&
      //  Aucune écoute de redimensionnement n'écrit le cookie : la
      //  taille est décidée UNE fois par chargement.
      !/addEventListener\("resize"/.test(script)
  );
  verif(
    "l'accueil sert taillePage × page, sans décalage",
    accueil.includes("taillePageServie") &&
      accueil.includes("limite: taillePage * page") &&
      !/decalage:/.test(accueil)
  );
}

/* ==================================================================
 * §1 — LA MESURE, AUX TROIS LARGEURS
 * ==================================================================
 * À chaque largeur : une première visite pose le cookie, le
 * rechargement sert la page à sa taille. Le catalogue de
 * démonstration compte DIX-NEUF fiches — les attentes en tiennent
 * compte, et le disent.
 */
const TOTAL_DEMO = 19;
const LARGEURS = [
  { largeur: 390, hauteur: 844, colonnes: 2, mobile: true },
  { largeur: 900, hauteur: 800, colonnes: 3, mobile: false },
  { largeur: 1440, hauteur: 950, colonnes: 4, mobile: false },
];

/** Les identifiants des cartes, dans l'ordre du document. */
const identifiants = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[data-carte]")].map(
      (carte) => carte.dataset.carte
    )
  );

let accueilServi = true;
for (const palier of LARGEURS) {
  titre(`§1 — la mosaïque à ${palier.largeur} px (${palier.colonnes} colonnes)`);
  const contexte = await navigateur.newContext({
    viewport: { width: palier.largeur, height: palier.hauteur },
    ...(palier.mobile
      ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true }
      : {}),
  });
  const page = await contexte.newPage();
  try {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForSelector("[data-carte]", { timeout: 30000 });
  } catch {
    accueilServi = false;
    nonJoue(`§1 à ${palier.largeur} px`, "l'accueil n'a servi aucune carte");
    await contexte.close();
    continue;
  }

  //  LE COOKIE POSÉ PAR LE SCRIPT D'AVANT PEINTURE — la question même
  //  que se pose la feuille de style, posée par matchMedia.
  const cookie = await page.evaluate(
    () => document.cookie.match(/yf_colonnes=(\d+)/)?.[1] ?? "(absent)"
  );
  verif(
    `le cookie dit ${palier.colonnes} colonnes`,
    cookie === String(palier.colonnes),
    `yf_colonnes=${cookie}`
  );

  //  LE RECHARGEMENT : la réponse suit maintenant le cookie.
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-carte]", { timeout: 30000 });
  const attendu = Math.min(palier.colonnes * 6, TOTAL_DEMO);
  const cartes = await page.locator("[data-carte]").count();
  if (palier.colonnes * 6 > TOTAL_DEMO) {
    nonJoue(
      `§1 · coupe à ${palier.colonnes * 6} cartes (${palier.largeur} px)`,
      `le catalogue de démonstration n'en a que ${TOTAL_DEMO} — la coupe ne peut pas se mesurer ici`
    );
  } else {
    verif(
      `la première page sert ${attendu} cartes (colonnes × 6)`,
      cartes === attendu,
      `${cartes} cartes`
    );
    verif(
      "la dernière ligne est COMPLÈTE (il reste des cartes à voir)",
      cartes % palier.colonnes === 0,
      `${cartes} % ${palier.colonnes} = ${cartes % palier.colonnes}`
    );
  }

  //  « VOIR PLUS » À 390 px — les pages successives sont des PRÉFIXES
  //  du même ordre : rien en double, rien de sauté.
  if (palier.largeur === 390) {
    const avant = await identifiants(page);
    const bouton = page.getByRole("button", { name: /Voir plus de portfolios/ });
    if ((await bouton.count()) === 0) {
      nonJoue("§1 · pages successives", "aucun « Voir plus » à toucher");
    } else {
      await bouton.scrollIntoViewIfNeeded();
      await bouton.click();
      await page
        .waitForFunction(
          (n) => document.querySelectorAll("[data-carte]").length > n,
          avant.length,
          { timeout: 20000 }
        )
        .catch(() => {});
      const apres = await identifiants(page);
      verif(
        "la page suivante GARDE les premières cartes, dans le même ordre",
        avant.every((id, rang) => apres[rang] === id),
        `${avant.length} → ${apres.length} cartes`
      );
      const nouvelles = apres.slice(avant.length);
      verif(
        "aucune carte en double entre les deux pages",
        new Set(apres).size === apres.length &&
          nouvelles.every((id) => !avant.includes(id)),
        `${nouvelles.length} nouvelles`
      );
      nonJoue(
        "§1 · une TROISIÈME page",
        `le catalogue de démonstration (${TOTAL_DEMO} fiches) est épuisé à la deuxième`
      );
    }
  }
  await contexte.close();
}

/* ==================================================================
 * §2, §3, §4 — LA FICHE DE DÉMONSTRATION LA PLUS COMPLÈTE
 * ==================================================================
 * atelier-corvus-lyon-1er : un salon à DEUX adresses, avec une équipe
 * (résidente et guest) — le cas que ces trois points visent.
 */
titre("§2 — les cinq titres de badges, dans l'ordre");
{
  const contenu = lire("src/components/ContenuFiche.tsx");
  const ordre = [...contenu.matchAll(/titre: "([^"]+)"/g)].map((m) => m[1]);
  verif(
    "l'ordre du code : Styles, Rendu, Technique, Types de projets, Besoins particuliers",
    JSON.stringify(ordre) ===
      JSON.stringify([
        "Styles",
        "Rendu",
        "Technique",
        "Types de projets",
        "Besoins particuliers",
      ]),
    ordre.join(" · ")
  );
  verif(
    "« Techniques maîtrisées » n'est plus un TITRE",
    //  Le nom peut rester dans un COMMENTAIRE (il explique ce qui a
    //  changé — même règle qu'IconeWorld au banc nº 224) ; ce qui
    //  compte, c'est qu'aucun groupe ne le porte plus.
    !/titre: "Techniques maîtrisées"/.test(contenu)
  );
  verif(
    "un groupe vide ne rend RIEN (le null du map)",
    /groupe\.slugs\.length > 0 \?/.test(contenu) && /\) : null\s*\)\}/.test(contenu)
  );
}

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
  //  L'hydratation d'abord : on va cliquer dans du React.
  await web.waitForTimeout(2500);
  fiche = true;
} catch {
  fiche = false;
}

if (!fiche) {
  nonJoue("§2 (rendu), §3, §4, §5", "la fiche de démonstration n'a pas répondu");
} else {
  //  §2 — LES TITRES RENDUS, dans l'ordre du document.
  {
    const titres = await web.evaluate(() =>
      [...document.querySelectorAll("main h2")]
        .map((h) => h.textContent.trim())
        .filter((t) =>
          [
            "Styles",
            "Rendu",
            "Technique",
            "Types de projets",
            "Besoins particuliers",
          ].includes(t)
        )
    );
    const attendus = ["Styles", "Rendu", "Technique", "Types de projets", "Besoins particuliers"];
    verif(
      "les titres rendus suivent l'ordre demandé (les groupes vides absents)",
      titres.length > 0 &&
        JSON.stringify(titres) ===
          JSON.stringify(attendus.filter((t) => titres.includes(t))),
      titres.join(" · ")
    );
  }

  titre("§3 — l'empilement des adresses");
  {
    const bloc = lire("src/components/BlocLieux.tsx");
    verif(
      "le sélecteur Adresse / Autre adresse est SUPPRIMÉ, code compris",
      //  Ni importé, ni rendu, ni d'état d'onglet — le NOM peut rester
      //  dans un commentaire qui raconte la suppression (même règle
      //  qu'IconeWorld au banc nº 224).
      !/^import .*OngletsLigne/m.test(bloc) &&
        !/<OngletsLigne/.test(bloc) &&
        !/onglet === "adresse"/.test(bloc) &&
        !bloc.includes('label: "Autre adresse"')
    );
    const geometrie = await web.evaluate(() => {
      const principale = [...document.querySelectorAll("main p")].find((p) =>
        p.textContent.startsWith("Adresse :")
      );
      const autres = [...document.querySelectorAll("main p")].filter((p) =>
        p.textContent.startsWith("Autre adresse :")
      );
      const equipe = [...document.querySelectorAll("main ul li a, main ul li div")]
        .map((n) => n.closest("li"))
        .filter(Boolean)
        .find((li) => /Fondateur|Résident|Guest/.test(li.textContent));
      const lienMaps = autres[0]?.querySelector('a[href*="google.com/maps"]');
      const suit = (a, b) =>
        Boolean(
          a && b && a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
        );
      return {
        principale: Boolean(principale),
        autres: autres.length,
        lienMaps: Boolean(lienMaps),
        hrefMaps: lienMaps?.getAttribute("href") ?? "",
        apresPrincipale: suit(principale, autres[0]),
        equipeApresTout:
          Boolean(equipe) && autres.every((autre) => suit(autre, equipe)),
      };
    });
    verif("l'adresse de l'affiche ouvre le bloc", geometrie.principale);
    verif(
      "« Autre adresse : » suit, sur sa ligne",
      geometrie.autres >= 1 && geometrie.apresPrincipale,
      `${geometrie.autres} autre(s)`
    );
    verif(
      "et c'est un lien Google Maps au format demandé",
      geometrie.lienMaps &&
        geometrie.hrefMaps.startsWith(
          "https://www.google.com/maps/search/?api=1&query="
        ),
      geometrie.hrefMaps
    );
    verif(
      "l'équipe vient APRÈS toutes les adresses",
      geometrie.equipeApresTout
    );
  }

  titre("§4 — toute la ligne d'équipe est le lien");
  {
    const ligne = await web.evaluate(() => {
      const lien = [...document.querySelectorAll('main a[href^="/tatoueur/"]')].find(
        (a) => /Résident|Fondateur|Guest/.test(a.textContent)
      );
      if (!lien) return null;
      const pastille = lien.querySelector("span.rounded-full");
      return {
        pastilleDansLeLien: Boolean(pastille),
        roleDansLeLien: /Résident|Fondateur|Guest/.test(lien.textContent),
        nomDansLeLien: lien.textContent.includes("·"),
        sansContour: !lien.className.includes("ring") && !lien.className.includes("outline-2"),
      };
    });
    verif("un lien d'équipe existe sur cette fiche", ligne !== null);
    if (ligne) {
      verif("la PASTILLE a le lien pour ancêtre", ligne.pastilleDansLeLien);
      verif("le rôle et le nom vivent dans le même lien", ligne.roleDansLeLien && ligne.nomDansLeLien);
      verif("aucun contour, aucun halo", ligne.sansContour);
    }
  }

  /* ================================================================
   * §5 — LA FENÊTRE SUPERPOSÉE, ET LE RETOUR (web, 1440 px)
   * ================================================================ */
  titre("§5 — fenêtre superposée et retour (web)");
  {
    const membre = web.locator('main a[href="/tatoueur/nadege-roux-villeurbanne"]').first();
    if ((await membre.count()) === 0) {
      nonJoue("§5 (web)", "aucun membre d'équipe avec fiche sur cette page");
    } else {
      await membre.scrollIntoViewIfNeeded();
      await web.waitForTimeout(300);
      const avant = await web.evaluate(() => ({
        y: Math.round(window.scrollY),
        historique: window.history.length,
        adresse: location.pathname,
      }));
      await membre.click();
      const fenetre = web.locator('[role="dialog"][aria-label^="Fiche de"]');
      await fenetre.first().waitFor({ timeout: 10000 }).catch(() => {});
      const apresOuverture = await web.evaluate(() => ({
        historique: window.history.length,
        adresse: location.pathname,
      }));
      verif(
        "le clic OUVRE une fenêtre superposée (pas une page)",
        (await fenetre.count()) === 1,
        apresOuverture.adresse
      );
      verif(
        "l'adresse est celle de la fiche ouverte",
        apresOuverture.adresse === "/tatoueur/nadege-roux-villeurbanne"
      );
      verif(
        "UNE entrée d'historique, pas plus",
        apresOuverture.historique === avant.historique + 1,
        `${avant.historique} → ${apresOuverture.historique}`
      );

      //  L'EMPILEMENT : depuis la fenêtre de l'artiste, son salon
      //  s'ouvre PAR-DESSUS — deux fenêtres vivent.
      const salon = web.locator(
        '[role="dialog"] a[href="/tatoueur/atelier-corvus-lyon-1er"]'
      ).first();
      if ((await salon.count()) === 0) {
        nonJoue("§5 · empilement", "la fenêtre n'expose pas de lien de salon");
      } else {
        await salon.click();
        await web.waitForTimeout(1200);
        const empile = await web.evaluate(() => ({
          fenetres: document.querySelectorAll('[role="dialog"][aria-label^="Fiche de"]')
            .length,
          historique: window.history.length,
          adresse: location.pathname,
        }));
        verif(
          "le salon s'ouvre PAR-DESSUS : deux fenêtres empilées",
          empile.fenetres === 2,
          `${empile.fenetres} fenêtre(s) · ${empile.adresse}`
        );
        verif(
          "une entrée d'historique de plus, une seule",
          empile.historique === avant.historique + 2,
          `${avant.historique} → ${empile.historique}`
        );
        //  PREMIER RETOUR : un cran, pas deux.
        await web.goBack();
        await web.waitForTimeout(800);
        const unCran = await web.evaluate(() => ({
          fenetres: document.querySelectorAll('[role="dialog"][aria-label^="Fiche de"]')
            .length,
          adresse: location.pathname,
        }));
        verif(
          "le retour ne défait QU'UN cran",
          unCran.fenetres === 1 &&
            unCran.adresse === "/tatoueur/nadege-roux-villeurbanne",
          `${unCran.fenetres} fenêtre(s) · ${unCran.adresse}`
        );
      }

      //  DERNIER RETOUR : la fiche principale, à sa position.
      await web.goBack();
      await web.waitForTimeout(800);
      const retour = await web.evaluate(() => ({
        fenetres: document.querySelectorAll('[role="dialog"][aria-label^="Fiche de"]')
          .length,
        adresse: location.pathname,
        y: Math.round(window.scrollY),
      }));
      verif(
        "le retour réaffiche la fiche principale",
        retour.fenetres === 0 && retour.adresse === avant.adresse,
        retour.adresse
      );
      verif(
        "à sa position de défilement (± 2 px)",
        Math.abs(retour.y - avant.y) <= 2,
        `${avant.y} → ${retour.y}`
      );
    }
  }

  //  L'ADRESSE DIRECTE REND UNE PAGE SERVEUR — le HTML brut, sans
  //  JavaScript, porte déjà la fiche.
  {
    const brut = await web.evaluate(async () => {
      const reponse = await fetch("/tatoueur/nadege-roux-villeurbanne");
      return await reponse.text();
    });
    verif(
      "l'adresse directe d'une fiche empilable rend une page complète",
      brut.includes("<main") && brut.includes("Nadège"),
      `${brut.length} octets`
    );
  }
}
await contexteWeb.close();

/* ==================================================================
 * §5 — LA MÊME FENÊTRE, AU DOIGT (390 px)
 * ================================================================== */
titre("§5 — fenêtre superposée au doigt (390 px)");
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
    nonJoue("§5 (mobile)", "la fiche de démonstration n'a pas répondu");
  } else {
    const membre = page
      .locator('main a[href="/tatoueur/nadege-roux-villeurbanne"]')
      .first();
    if ((await membre.count()) === 0) {
      nonJoue("§5 (mobile)", "aucun membre d'équipe avec fiche sur cette page");
    } else {
      await membre.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const avantY = await page.evaluate(() => Math.round(window.scrollY));
      await membre.click();
      const fenetre = page.locator('[role="dialog"][aria-label^="Fiche de"]');
      await fenetre.first().waitFor({ timeout: 10000 }).catch(() => {});
      verif(
        "au doigt AUSSI, le membre s'ouvre en fenêtre superposée",
        (await fenetre.count()) === 1,
        page.url()
      );
      await page.goBack();
      await page.waitForTimeout(800);
      const retour = await page.evaluate(() => ({
        fenetres: document.querySelectorAll('[role="dialog"][aria-label^="Fiche de"]')
          .length,
        y: Math.round(window.scrollY),
      }));
      verif(
        "le retour rend la fiche, à sa position (± 2 px)",
        retour.fenetres === 0 && Math.abs(retour.y - avantY) <= 2,
        `${avantY} → ${retour.y}`
      );
    }
  }
  await contexte.close();
}

if (!accueilServi) {
  nonJoue("§1 (rappel)", "au moins une largeur n'a pas vu l'accueil");
}

await navigateur.close();
bilan();
