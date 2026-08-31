/**
 * BANC DE LA PASSE Nº 331 — LIVRAISON RAPIDE
 * ==================================================================
 * DEUX RÉGRESSIONS DE LA Nº 330, ET L'INSTRUMENT DU RELEVÉ.
 *
 * §1 — LA NAVIGATION GAGNE TOUJOURS. Les liens du menu « Mon espace »
 *      étaient morts : l'étape de la surface reculait au moment où le
 *      routeur avançait. La règle est INVERSÉE — on ne recule que si
 *      aucune navigation n'a été demandée, et la demande est relevée
 *      AU CLIC, en capture, donc AVANT tout démontage.
 * §2 — LA GRANDE PHOTO DE L'APERÇU revient sur la version web : la
 *      consigne « sans photo » ne lui est plus transmise hors du doigt.
 * §4 — LA SONDE `?sonde-historique=1` tient le journal de la pile, en
 *      traversant les pages, et le rend en texte.
 *
 * ⚠️ TOUT SE JOUE AU DOIGT, À UNE SEULE LARGEUR : 390 × 844, densité 3,
 * `hasTouch` (livraison rapide).
 *
 * ⚠️ CE QUE CE BANC NE PEUT PAS JOUER, ET IL FAUT LE DIRE : le menu
 * « Mon espace » n'existe que CONNECTÉ, et l'aperçu « Mon portfolio »
 * aussi. Le §1 est donc mesuré sur la SEULE surface publique qui pose
 * une étape — la page de recherche du smartphone — et sur la MÉCANIQUE
 * du clic de lien, avec un vrai `<a href>` et un vrai événement.
 */
import {
  BASE,
  bilan,
  lire,
  nonJoue,
  ouvrirLeNavigateur,
  titre,
  verif,
} from "./commun-verif.mjs";
import { existsSync } from "node:fs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const FICHE_B = "/tatoueur/nadege-roux-villeurbanne";

const { nav, ctx, page } = await ouvrirLeNavigateur(
  "p331",
  { width: 390, height: 844 },
  { hasTouch: true, isMobile: true, deviceScaleFactor: 3 }
);

/** Pose un mouchard sur `history.back` : le banc veut savoir s'il a
    été appelé, pas le deviner. Il APPELLE TOUJOURS L'ORIGINALE. */
async function surveillerLeRetour(p) {
  await p.evaluate(() => {
    window.__reculs = 0;
    const original = history.back.bind(history);
    history.back = () => {
      window.__reculs += 1;
      return original();
    };
  });
}

/* ==================================================================
 * §1 — LA NAVIGATION GAGNE TOUJOURS
 * ================================================================== */
titre("§1 — les liens d'une surface ouverte ne sont plus avalés");
{
  const etape = sansNotes(lire("src/lib/etape-refermable.ts"));
  verif(
    "LA RÈGLE EST INVERSÉE : on ne recule QUE si aucune navigation n'a été demandée",
    /if \(navigationDemandee\) return;/.test(etape),
    "reculer est le geste dangereux — ne rien faire est toujours sans risque"
  );
  verif(
    "LA DEMANDE EST RELEVÉE AU CLIC, EN CAPTURE — avant tout démontage",
    /document\.addEventListener\("click", auClic, true\)/.test(etape) &&
      /closest\("a\[href\]"\)/.test(etape),
    "la phase de capture précède le lien ET le changement d'état de React"
  );
  verif(
    "…et le module la RETIRE au démontage : rien ne traîne",
    /document\.removeEventListener\("click", auClic, true\)/.test(etape),
    "écouteur posé, écouteur repris"
  );
  verif(
    "UNE SURFACE QUI S'OUVRE PART D'UNE ARDOISE PROPRE",
    /navigationDemandee = false;/.test(etape),
    "la marque d'une navigation passée n'éteint pas la reprise de celle-ci"
  );
  verif(
    "L'ÉCRITURE EST UNIQUE ET EXPORTÉE : `laSurfaceVaNaviguer`",
    /export function laSurfaceVaNaviguer\(\): void \{\s*navigationDemandee = true;/.test(
      etape
    ),
    "une seule façon de dire « la navigation gagne »"
  );
  verif(
    "…et LE DRAPEAU PAR SURFACE A DISPARU — plus de second mécanisme",
    !/reprendreSonEtape/.test(etape) &&
      !/reprendreSonEtape/.test(lire("src/components/PageRechercheMobile.tsx")),
    "`reprendreSonEtape` n'existe plus nulle part"
  );
  const moteur = sansNotes(lire("src/components/MoteurTatouage.tsx"));
  verif(
    "« VALIDER » LE DIT AVANT DE REFERMER",
    /laSurfaceVaNaviguer\(\);[\s\S]{0,80}fermerRecherche\(\);/.test(moteur),
    "l'ordre compte : la marque d'abord, la fermeture ensuite"
  );
  const espace = sansNotes(lire("src/components/MenuEspace.tsx"));
  /*  ON LIT LE CORPS DE LA FONCTION, pas une fenêtre de caractères :
      il y a une garde « on y est déjà » entre les deux lignes. */
  const debut = espace.indexOf("function allerCreerUneFiche");
  const corpsCreation =
    debut >= 0 ? espace.slice(debut, espace.indexOf("\n  }", debut)) : "";
  verif(
    "…et LE BOUTON « AJOUTER UN PORTFOLIO » AUSSI (il n'est pas un lien)",
    /laSurfaceVaNaviguer\(\);/.test(corpsCreation) &&
      /router\.push\(ADRESSE_NOUVELLE\)/.test(corpsCreation) &&
      corpsCreation.indexOf("laSurfaceVaNaviguer") <
        corpsCreation.indexOf("router.push"),
    "les quatre LIENS du menu, eux, sont armés par le module tout seul"
  );

  /* ---------- EN VIVANT (1) : LA MÉCANIQUE DU CLIC DE LIEN ----------
     Un vrai `<a href>`, un vrai événement de clic, une vraie surface
     ouverte. On ne mesure pas un parcours d'utilisateur (le menu
     « Mon espace » demande une session) : on mesure que le clic d'un
     lien EMPÊCHE le recul, ce qui est exactement le défaut relevé. */
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await surveillerLeRetour(page);
  const loupe = page.locator('button[aria-label^="Rechercher"]').first();
  if ((await loupe.count()) === 0) {
    nonJoue("§1 EN VIVANT", "la pilule de recherche n'a pas été trouvée.");
  } else {
    await loupe.click();
    await page.waitForTimeout(1000);
    /*  UN LIEN EST TOUCHÉ pendant que la surface est ouverte. On le
        pose nous-mêmes et on annule sa navigation par défaut : ce qui
        est mesuré, c'est la RÈGLE — un clic de lien arme la marque —,
        pas la destination. */
    await page.evaluate(() => {
      const lien = document.createElement("a");
      lien.href = "/mes-favoris";
      lien.textContent = "lien d'épreuve";
      lien.id = "lien-epreuve";
      lien.addEventListener("click", (e) => e.preventDefault());
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
    });
    //  Puis la surface se referme par sa croix.
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1200);
    const apresLien = await page.evaluate(() => ({
      reculs: window.__reculs,
      recherche: Boolean(document.documentElement.dataset.recherche),
    }));
    verif(
      "UN LIEN TOUCHÉ PENDANT L'OUVERTURE : LA SURFACE NE RECULE PLUS",
      apresLien.reculs === 0,
      `${apresLien.reculs} recul(s) — avant cette passe, le recul avalait le clic`
    );
    verif(
      "…et la surface s'est bien refermée quand même",
      apresLien.recherche === false,
      "la fermeture ne dépend pas du recul"
    );
  }

  /* ---------- EN VIVANT (2) : LA FERMETURE SUR PLACE RECULE ENCORE ----
     Le contre-contrôle : sans navigation demandée, la croix reprend
     bien son étape. Sans lui, un « 0 recul » ne prouverait rien. */
  const page2 = await ctx.newPage();
  await page2.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page2.waitForTimeout(900);
  await surveillerLeRetour(page2);
  const loupe2 = page2.locator('button[aria-label^="Rechercher"]').first();
  if ((await loupe2.count()) === 0) {
    nonJoue("§1 CONTRE-CONTRÔLE", "la pilule de recherche n'a pas été trouvée.");
  } else {
    await loupe2.click();
    await page2.waitForTimeout(1000);
    await page2.keyboard.press("Escape");
    await page2.waitForTimeout(1200);
    const surPlace = await page2.evaluate(() => window.__reculs);
    verif(
      "CONTRE-CONTRÔLE — une fermeture SUR PLACE reprend bien son étape",
      surPlace === 1,
      `${surPlace} recul — la nº 330-§3 tient, elle n'est pas désarmée`
    );
  }

  /* ---------- EN VIVANT (3) : « VALIDER » NE RECULE PLUS ---------- */
  await page2.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page2.waitForTimeout(900);
  await surveillerLeRetour(page2);
  await page2.locator('button[aria-label^="Rechercher"]').first().click();
  await page2.waitForTimeout(1000);
  const valider = page2.locator('button:has-text("Valider")').first();
  if ((await valider.count()) === 0) {
    nonJoue("§1 « VALIDER »", "le bouton « Valider » n'a pas été trouvé.");
  } else {
    await valider.click();
    await page2.waitForTimeout(2000);
    const apresValider = await page2.evaluate(() => ({
      reculs: window.__reculs,
      recherche: Boolean(document.documentElement.dataset.recherche),
    }));
    verif(
      "« VALIDER » NE RECULE PLUS DU TOUT — la navigation garde la main",
      apresValider.reculs === 0 && apresValider.recherche === false,
      `${apresValider.reculs} recul(s) — la nº 330 en faisait un, mesuré`
    );
  }
  await page2.close();
}

/* ==================================================================
 * §2 — LA PHOTO DE L'APERÇU REVIENT SUR LE WEB
 * ================================================================== */
titre("§2 — l'aperçu « Mon portfolio » retrouve sa photo sur ordinateur");
{
  const formulaire = sansNotes(lire("src/components/FormulaireFiche.tsx"));
  verif(
    "LA CONSIGNE N'EST TRANSMISE À L'APERÇU QU'AU DOIGT",
    /entreeInitiale=\{surMobile \? \(parametres\.get\("entree"\) \?\? ""\) : ""\}/.test(
      formulaire
    ),
    "sur ordinateur, l'aperçu ne la reçoit pas — `sansPhoto` reste faux"
  );
  verif(
    "…et LE SEUIL EST CELUI DU SITE, pas un nouveau",
    /const surMobile = useAppareilMobile\(\);/.test(formulaire),
    "`data-appareil` — un DOIGT, jamais une largeur (règle nº 60)"
  );
  const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));
  verif(
    "LA FICHE N'A PAS BOUGÉ : une seule règle, et elle vient de l'adresse",
    /const sansPhoto = entreeInitiale === ENTREE_LIEN;/.test(fiche),
    "rien n'a été reconstruit ni réinventé dans la photo elle-même"
  );

  /* ---------- LE CHEMIN PUBLIC EST INTACT (nº 329-§4) ---------- */
  await page.goto(`${BASE}${FICHE_B}?entree=lien`, {
    waitUntil: "networkidle",
  });
  verif(
    "PAR UN LIEN INTERNE, LA PHOTO DU HAUT N'EST TOUJOURS PAS LÀ",
    (await page.evaluate(
      () => document.querySelectorAll("[data-photo-fiche]").length
    )) === 0,
    "le chemin public n'est pas touché par cette passe"
  );
  await page.goto(`${BASE}${FICHE_B}`, { waitUntil: "networkidle" });
  verif(
    "…et une arrivée ordinaire garde la sienne",
    (await page.evaluate(
      () => document.querySelectorAll("[data-photo-fiche]").length
    )) > 0,
    "la photo est là, comme toujours"
  );
}

/* ==================================================================
 * §4 — LA SONDE DE L'HISTORIQUE
 * ================================================================== */
titre("§4 — le journal de la pile, lisible et recopiable au téléphone");
{
  verif(
    "LA SONDE EXISTE, ET SON JOURNAL VIT HORS DE REACT",
    existsSync("/home/user/mon-site-roswel/src/components/SondeHistorique.tsx") &&
      existsSync("/home/user/mon-site-roswel/src/lib/journal-historique.ts"),
    "`?sonde-historique=1`"
  );
  const journal = sansNotes(lire("src/lib/journal-historique.ts"));
  verif(
    "ELLE NE POSE AUCUNE ENTRÉE ET NE DÉFILE PAS — elle enveloppe et note",
    !/pushState\(\{/.test(journal) &&
      !/scrollTo|gelerLeCorps/.test(journal),
    "aucune écriture d'historique à elle, aucun défilement, aucun gel"
  );
  verif(
    "…et CHAQUE ENVELOPPE APPELLE TOUJOURS L'ORIGINALE",
    /const valeur = pushOriginal\(\.\.\.args\);/.test(journal) &&
      /const valeur = replaceOriginal\(\.\.\.args\);/.test(journal) &&
      /return backOriginal\(\);/.test(journal),
    "elle note APRÈS coup, elle ne remplace rien"
  );
  verif(
    "ELLE SURVIT AUX CHANGEMENTS DE PAGE — mémoire de l'onglet",
    /sessionStorage\.setItem\(CLE/.test(journal) &&
      /sessionStorage\.getItem\(CLE\)/.test(journal),
    "`sessionStorage` : traverse les navigations, meurt avec l'onglet"
  );
  verif(
    "ELLE NOTE LES QUATRE ÉVÉNEMENTS DEMANDÉS",
    /"POSÉE"/.test(journal) &&
      /"REMPLACÉE"/.test(journal) &&
      /REPRISE \(history\.back\)/.test(journal) &&
      /DÉPART DU SITE/.test(journal),
    "POSÉE · REMPLACÉE · REPRISE · DÉPART DU SITE"
  );
  const sonde = lire("src/components/SondeHistorique.tsx");
  verif(
    "ELLE SE REPLIE, ET SE RECOPIE EN TEXTE",
    /useSondeRepliee/.test(sonde) &&
      /BoutonCopierJournal/.test(sonde) &&
      /PastilleSonde/.test(sonde),
    "pastille, repli, et le bouton COPIER à trois niveaux"
  );
  verif(
    "ELLE N'ENTOURE LA PAGE D'AUCUN CONTENEUR",
    !/children/.test(sonde) && /position: "fixed"/.test(sonde),
    "des éléments posés À CÔTÉ de la page, jamais autour"
  );
  const bandeau = lire("src/lib/navigation-session.ts");
  verif(
    "LES DEUX SONDES SONT INSCRITES AU BANDEAU DES CHANTIERS OUVERTS",
    /\?sonde-remontee=1/.test(bandeau) && /\?sonde-historique=1/.test(bandeau),
    "à retirer avant la mise en ligne, avec la liste des fichiers"
  );

  /* ---------- EN VIVANT : elle enregistre, et elle traverse ---------- */
  const page4 = await ctx.newPage();
  await page4.goto(`${BASE}/?sonde-historique=1`, {
    waitUntil: "networkidle",
  });
  await page4.waitForTimeout(900);
  const pastille = page4.locator('button[aria-label="Ouvrir Sonde de l\'historique"]');
  verif(
    "LA PASTILLE EST LÀ, REPLIÉE, sans rien masquer",
    (await pastille.count()) === 1,
    "44 px dans un coin — le reste de l'écran est à la page"
  );
  //  Une surface s'ouvre : elle doit apparaître au journal.
  await page4.locator('button[aria-label^="Rechercher"]').first().click();
  await page4.waitForTimeout(1000);
  await page4.keyboard.press("Escape");
  await page4.waitForTimeout(1200);
  //  Puis on CHANGE DE PAGE : le journal doit survivre.
  await page4.goto(`${BASE}${FICHE_B}?sonde-historique=1`, {
    waitUntil: "networkidle",
  });
  await page4.waitForTimeout(1000);
  const releve = await page4.evaluate(() => {
    const brut = sessionStorage.getItem("yokofolio:journal-historique");
    return brut ? JSON.parse(brut) : [];
  });
  verif(
    "LE JOURNAL A SURVÉCU AU CHANGEMENT DE PAGE",
    releve.length > 0 &&
      releve.some((l) => l.ou.startsWith("/?")) &&
      releve.some((l) => l.ou.startsWith("/tatoueur/")),
    `${releve.length} ligne(s), sur DEUX adresses différentes`
  );
  verif(
    "…et il porte bien les cinq colonnes demandées",
    releve.every(
      (l) =>
        typeof l.n === "number" &&
        typeof l.t === "string" &&
        typeof l.quoi === "string" &&
        typeof l.ou === "string" &&
        typeof l.qui === "string" &&
        typeof l.pile === "number"
    ),
    "rang · instant · événement · adresse · origine · profondeur"
  );
  verif(
    "…et il a VU l'étape de la page de recherche",
    releve.some((l) => l.quoi === "POSÉE"),
    releve
      .filter((l) => l.quoi === "POSÉE")
      .map((l) => l.qui)
      .join(" · ") || "aucune"
  );
  await page4.close();
}

nonJoue(
  "§1 ET §2 SUR LE MENU « MON ESPACE » ET SUR L'APERÇU, EN VIVANT",
  "les deux n'existent que CONNECTÉ, et ce conteneur ne sait pas " +
    "signer une session Supabase. CE QUI EST PROUVÉ QUAND MÊME : la " +
    "règle du §1 est mesurée EN VIVANT sur la seule surface publique " +
    "qui pose une étape — un clic de lien empêche le recul, une " +
    "fermeture sur place le fait encore, et « Valider » ne recule " +
    "plus du tout. CE QUI NE L'EST PAS : les quatre liens du menu " +
    "un par un, et la photo de l'aperçu sur ordinateur. Pour les " +
    "mesurer toi-même : ouvre n'importe quelle page avec " +
    "`?sonde-historique=1`, touche un lien du menu, et regarde si une " +
    "ligne REPRISE apparaît — elle ne doit plus apparaître."
);

nonJoue(
  "LE §3 — IL N'EST PAS MESURABLE, C'EST UN RELEVÉ",
  "l'inventaire des écritures d'historique est rendu dans le compte " +
    "rendu, pas ici : ce banc mesure des comportements, pas des " +
    "listes. La sonde du §4 est l'instrument qui permettra de le " +
    "vérifier sur l'appareil du propriétaire."
);

nonJoue(
  "WEBKIT",
  "ce conteneur n'a que Chromium. Toutes les mesures ci-dessus valent " +
    "pour Chromium et pour lui seul — ce n'est une preuve ni pour " +
    "Safari, ni pour l'iPhone du propriétaire, qui est justement " +
    "l'appareil où les deux régressions ont été relevées."
);

await bilan(nav);
