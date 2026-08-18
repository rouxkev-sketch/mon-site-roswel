/**
 * BANC DE LA PASSE Nº 332 — LIVRAISON RAPIDE
 * ==================================================================
 * FERMETURE DU CHANTIER NAVIGATION.
 *
 * §1 — L'ÉTAPE JUMELLE. L'étape d'une surface est CONSOMMÉE par la
 *      navigation (elle la REMPLACE), jamais doublée. La preuve est
 *      chiffrée : dix recherches validées d'affilée, la profondeur
 *      après chacune, puis dix retours.
 * §2 — LE FILET. Un retour depuis une page atteinte en première entrée
 *      de l'onglet pose sur l'accueil, en haut — et il ne coûte AUCUN
 *      appui supplémentaire à une surface refermable.
 * §3 — LE ROND DE PROFIL d'un carrousel PARTAGÉ mène à la fiche, par
 *      l'écriture unique du lien interne.
 * §4 — LA SECTION D'ADMINISTRATION vit dans l'adresse, une entrée par
 *      pas, par l'écriture commune.
 *
 * ⚠️ TOUT SE JOUE AU DOIGT, À UNE SEULE LARGEUR : 390 × 844, densité 3,
 * `hasTouch` (livraison rapide).
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
  "p332",
  { width: 390, height: 844 },
  { hasTouch: true, isMobile: true, deviceScaleFactor: 3 }
);

/** UNE RECHERCHE ENTIÈRE, AU DOIGT : la loupe, le menu des styles, la
    porte « Réalisations », UN style, puis « Valider ».
    ⚠️ CHAQUE RECHERCHE PORTE UN STYLE DIFFÉRENT — sans cela les dix
    adresses seraient identiques, et « les retours redescendent une par
    une » ne voudrait plus rien dire. */
async function unecherche(p, style) {
  /*  ⚠️ LES CLICS SONT DÉCLENCHÉS SUR L'ÉLÉMENT. Après une recherche
      sans résultat, la barre du site recouvre la pilule et Playwright
      refuse de la toucher — c'est une question d'atteignabilité, pas
      d'historique, et ce banc-ci mesure la PILE. */
  await p
    .locator('button[aria-label^="Rechercher"]')
    .first()
    .evaluate((el) => el.click());
  await p.waitForTimeout(700);
  await p.locator('[aria-label="Style"]').first().evaluate((el) => el.click());
  await p.waitForTimeout(700);
  /*  LA PORTE « Réalisations » RESTE OUVERTE d'une recherche à l'autre :
      on ne la touche QUE si le style visé n'est pas déjà à l'écran —
      sinon on la refermerait, et l'option deviendrait introuvable. */
  const dejaOuverte = await p.evaluate(
    (libelle) =>
      [...document.querySelectorAll("button")].some((e) =>
        (e.textContent || "").trim().startsWith(libelle)
      ),
    style
  );
  if (!dejaOuverte) {
    await p.evaluate(() => {
      const porte = [...document.querySelectorAll("button")].find(
        (e) => (e.textContent || "").trim() === "Réalisations"
      );
      porte?.click();
    });
    await p.waitForTimeout(600);
  }
  const choisi = await p.evaluate((libelle) => {
    const option = [...document.querySelectorAll("button")].find((e) =>
      (e.textContent || "").trim().startsWith(libelle)
    );
    if (!option) return false;
    option.click();
    return true;
  }, style);
  await p.waitForTimeout(600);
  await p
    .locator('button:has-text("Valider")')
    .first()
    .evaluate((el) => el.click());
  await p.waitForTimeout(1100);
  return p.evaluate(
    (ok) => ({
      pile: history.length,
      ou: location.pathname + location.search,
      choisi: ok,
    }),
    choisi
  );
}

/** Les dix styles de l'épreuve — pris dans la porte « Réalisations ».
    Un style sans aucune photo convient : ce qui compte est que
    l'ADRESSE change, pas que la liste soit pleine. */
const STYLES = [
  "Abstrait",
  "Acid-trad",
  "Anime & Manga",
  "Aquarelle",
  "Bio-organique",
  "Biomécanique",
  "Blackwork",
  "Chicano",
  "Dotwork",
  //  ⚠️ « Fine line » N'EXISTE PAS AU CATALOGUE (mesuré) : le dixième
  //  style est « Géométrique », qui, lui, y est.
  "Géométrique",
];

/* ==================================================================
 * §1 — L'ÉTAPE EST CONSOMMÉE, PAS DOUBLÉE
 * ================================================================== */
titre("§1 — plus d'étape jumelle après une recherche validée");
{
  const etape = sansNotes(lire("src/lib/etape-refermable.ts"));
  verif(
    "L'ÉCRITURE COMMUNE SAIT DIRE « REMPLACE PLUTÔT QUE D'EMPILER »",
    /export function laNavigationRemplaceLEtape\(\): boolean/.test(etape) &&
      /return etat\?\.\[CLE\] !== undefined;/.test(etape),
    "elle LIT l'étape du dessus — elle ne la suppose pas"
  );
  verif(
    "…et ELLE NE RECULE PAS : la course de la nº 330 n'est pas rouverte",
    !/laNavigationRemplaceLEtape[\s\S]{0,400}history\.back/.test(etape),
    "remplacer ne dépend de l'ordre d'aucun événement"
  );
  verif(
    "LES DEUX ACQUIS DE LA nº 331 SONT INTACTS",
    /if \(navigationDemandee\) return;/.test(etape) &&
      /document\.addEventListener\("click", auClic, true\)/.test(etape),
    "reculer reste le geste dangereux, la demande se relève au clic"
  );
  const index = sansNotes(lire("src/components/IndexTatoueurs.tsx"));
  verif(
    "LA RECHERCHE CONSOMME L'ÉTAPE DE LA PAGE DE RECHERCHE",
    /const consommeLEtape = laNavigationRemplaceLEtape\(\);/.test(index) &&
      /consommeLEtape \|\|/.test(index),
    "`router.replace` au lieu de `router.push` quand l'étape est là"
  );
  const espace = sansNotes(lire("src/components/MenuEspace.tsx"));
  verif(
    "…et LES QUATRE LIENS DU MENU « MON ESPACE » AUSSI",
    (espace.match(/replace=\{liensRemplacent\}/g) ?? []).length === 4 &&
      /const liensRemplacent = auDoigt && ouvert && laNavigationRemplaceLEtape\(\)/.test(
        espace
      ),
    "quatre liens, une seule règle, aucune copie"
  );

  /* ---------- LA PREUVE CHIFFRÉE : DIX RECHERCHES, PUIS DIX RETOURS ---
     ⚠️ UN ONGLET NEUF : la pile doit être celle d'un vrai visiteur,
     pas celle qu'un banc a remplie avant. */
  const p1 = await ctx.newPage();
  await p1.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p1.waitForTimeout(900);
  const depart = await p1.evaluate(() => history.length);
  const profondeurs = [];
  const adresses = [];
  let jouables = true;
  for (let i = 0; i < 10; i += 1) {
    if ((await p1.locator('button[aria-label^="Rechercher"]').count()) === 0) {
      jouables = false;
      break;
    }
    const releve = await unecherche(p1, STYLES[i]);
    if (!releve.choisi) {
      jouables = false;
      break;
    }
    profondeurs.push(releve.pile);
    adresses.push(releve.ou);
  }
  if (!jouables) {
    nonJoue(
      "§1 EN VIVANT",
      "la pilule de recherche ou l'un des dix styles n'a pas été trouvé " +
        "dans le menu — les contrôles de source ci-dessus tiennent."
    );
  } else {
    const ecarts = profondeurs.map((p, i) =>
      i === 0 ? p - depart : p - profondeurs[i - 1]
    );
    verif(
      "DIX RECHERCHES VALIDÉES : LA PILE MONTE DE UN PAR RECHERCHE",
      ecarts.every((e) => e === 1),
      `départ ${depart} → ${profondeurs.join(" → ")} (écarts : ${ecarts.join(", ")})`
    );

    //  PUIS DIX RETOURS.
    const traversee = [];
    for (let i = 0; i < 10; i += 1) {
      await p1.goBack({ waitUntil: "commit" });
      await p1.waitForTimeout(700);
      traversee.push(
        await p1.evaluate(() => location.pathname + location.search)
      );
    }
    /*  LES NEUF PREMIERS RETOURS DOIVENT RENDRE LES NEUF RECHERCHES
        PRÉCÉDENTES, DANS L'ORDRE INVERSE — c'est-à-dire exactement la
        pile attendue, sans jumelle intercalée. */
    const attendues = adresses.slice(0, 9).reverse();
    const neufPremiers = traversee.slice(0, 9);
    verif(
      "LES NEUF PREMIERS RETOURS REDESCENDENT LES RECHERCHES, UNE PAR UNE",
      neufPremiers.every((u, i) => u === attendues[i]),
      neufPremiers
        .map((u, i) => (u === attendues[i] ? "✔" : `${u} ≠ ${attendues[i]}`))
        .join(" ")
    );
    verif(
      "…ET LE DIXIÈME SEULEMENT REND L'ACCUEIL",
      traversee[9] === "/",
      `dixième retour : ${traversee[9]}`
    );
  }
  await p1.close();
}

/* ==================================================================
 * §2 — LE FILET
 * ================================================================== */
titre("§2 — un retour ne fait jamais quitter le site");
{
  const filet = sansNotes(lire("src/components/RetourGaranti.tsx"));
  verif(
    "IL COUVRE TOUT LE SITE — plus de garde de chemin ni d'appareil",
    !/startsWith\("\/tatoueur\//.test(filet) &&
      !/dataset\.appareil/.test(filet),
    "toute page, au doigt comme sur ordinateur"
  );
  /*  ⚠️ CETTE ASSERTION A ÉTÉ RÉÉCRITE À LA nº 345, ET IL FAUT DIRE
      POURQUOI. Elle exigeait la condition `history.length > 1`. Le
      propriétaire a mesuré en ligne que cette condition rendait le
      filet INEXISTANT sur Chrome iOS, qui ouvre ses onglets avec une
      entrée déjà en place, et il a ordonné qu'elle change. La BORNE,
      elle, n'a pas bougé d'un pouce — c'est elle qu'on vérifie ici,
      dans sa nouvelle écriture (lib/bas-de-la-pile). */
  verif(
    "LA BORNE EST GARDÉE — une page ÉTRANGÈRE derrière, et le filet se tait",
    /unePageEtrangereEstDerriere\(\)/.test(filet) &&
      /aucunePageDuSiteDerriere\(\)/.test(filet),
    "arrivé d'Instagram dans le même onglet, le retour y ramène (nº 345-§1)"
  );
  verif(
    "IL POSE SON ÉTAPE SANS ADRESSE, et recopie l'état",
    /window\.history\.pushState\(\s*\{ \.\.\.\(\(window\.history\.state as object \| null\) \?\? \{\}\), \[MARQUE\]: true \},\s*""\s*\)/.test(
      filet
    ),
    "`pushState` à deux arguments — le routeur de Next ne repart pas"
  );
  verif(
    "IL NE COÛTE AUCUN APPUI À UNE SURFACE : il se tait tant qu'on est au-dessus",
    /if \(ici\?\.\[MARQUE\]\) return;/.test(filet),
    "une surface recopie la marque du filet : refermer ne le réveille pas"
  );
  verif(
    "ET L'ACCUEIL S'OUVRE EN HAUT — aucune position demandée",
    /window\.location\.replace\("\/"\);/.test(filet) &&
      !/demanderRestaurationPosition/.test(filet),
    "un onglet sans passé est un écran neuf"
  );
  const contenu = sansNotes(lire("src/components/ContenuFiche.tsx"));
  const grille = sansNotes(lire("src/components/GrilleTatoueurs.tsx"));
  const formulaire = sansNotes(lire("src/components/FormulaireFiche.tsx"));
  verif(
    "LES NETTOYAGES D'ADRESSE NE JETTENT PLUS L'ÉTAT — les marques survivent",
    !/replaceState\(null,/.test(contenu) &&
      !/replaceState\(null,/.test(grille) &&
      !/replaceState\(null,/.test(formulaire),
    "`replaceState(window.history.state, …)` partout : filet et étapes intacts"
  );

  /* ---------- EN VIVANT : LE FILET, PUIS UNE SURFACE PAR-DESSUS ---- */
  /*  ⚠️ ON ARRIVE PAR `location.replace` : un remplacement depuis la
      page blanche reproduit ce que fait un lien partagé ouvert dans un
      onglet neuf — une seule étape.
      ⚠️ ET DEPUIS LA nº 345, UN `goto` CONVIENDRAIT AUSSI : la page
      blanche qu'il laisse derrière lui est une entrée FANTÔME, sans
      référent, et le filet s'arme quand même. C'était tout le défaut —
      voir le banc p345, qui prend précisément ce chemin-là. */
  const p2 = await ctx.newPage();
  await p2.evaluate((u) => window.location.replace(u), `${BASE}${FICHE_B}`);
  await p2.waitForTimeout(2500);
  const arme = await p2.evaluate(() => ({
    pile: history.length,
    marque: Boolean(
      (history.state ?? {}).retourReconstruit
    ),
  }));
  verif(
    "SUR UNE PAGE ATTEINTE DIRECTEMENT, LE FILET S'ARME",
    arme.pile === 2 && arme.marque,
    `pile ${arme.pile}, marque posée : ${arme.marque}`
  );
  await p2.goBack({ waitUntil: "commit" });
  await p2.waitForTimeout(1600);
  const apres = await p2.evaluate(() => location.pathname + location.search);
  verif(
    "…ET UN RETOUR POSE SUR L'ACCUEIL, au lieu de sortir du site",
    apres === "/",
    `arrivée : ${apres}`
  );
  await p2.close();

  //  LE nº 24 : une surface refermable par-dessus le filet.
  const p3 = await ctx.newPage();
  await p3.evaluate((u) => window.location.replace(u), `${BASE}/`);
  await p3.waitForTimeout(2500);
  const avantSurface = await p3.evaluate(() => history.length);
  if ((await p3.locator('button[aria-label^="Rechercher"]').count()) === 0) {
    nonJoue("§2 AVEC UNE SURFACE", "la pilule de recherche est absente.");
  } else {
    await p3.locator('button[aria-label^="Rechercher"]').first().click();
    await p3.waitForTimeout(900);
    await p3.goBack({ waitUntil: "commit" });
    await p3.waitForTimeout(1200);
    const refermee = await p3.evaluate(() => ({
      ou: location.pathname + location.search,
      recherche: Boolean(document.documentElement.dataset.recherche),
      pile: history.length,
    }));
    verif(
      "UN SEUL APPUI REFERME LA SURFACE, ET LE FILET NE S'EN MÊLE PAS",
      refermee.recherche === false && refermee.ou === "/",
      `pile ${avantSurface} → ${refermee.pile}, on reste sur ${refermee.ou}`
    );
    //  Et le retour SUIVANT, lui, doit poser sur l'accueil (pas sortir).
    await p3.goBack({ waitUntil: "commit" });
    await p3.waitForTimeout(1600);
    verif(
      "…et le retour SUIVANT pose sur l'accueil (le nº 24 est couvert)",
      (await p3.evaluate(() => location.pathname)) === "/",
      "on ne sort pas du site"
    );
  }
  await p3.close();
}

/* ==================================================================
 * §3 — LE ROND DE PROFIL D'UN CARROUSEL PARTAGÉ
 * ================================================================== */
titre("§3 — la photo de profil d'un lien partagé mène à la fiche");
{
  const fenetre = sansNotes(lire("src/components/FenetreCarrousel.tsx"));
  verif(
    "ELLE PASSE PAR L'ÉCRITURE UNIQUE, jamais par « entree=lien » à la main",
    /adresseDeLienInterne\(tatoueur\.slug\)/.test(fenetre) &&
      !/entree=lien/.test(fenetre),
    "`adresseDeLienInterne(slug)` + `#profil`"
  );
  verif(
    "…et SEULEMENT DEPUIS UN LIEN PARTAGÉ (page à part entière)",
    /superposee\s*\?\s*`\/tatoueur\/\$\{tatoueur\.slug\}#profil`/.test(fenetre),
    "superposée, la fiche est déjà dessous : on y revient, on n'y arrive pas"
  );
  verif(
    "LE LOGO N'A PAS BOUGÉ — il mène toujours à l'accueil (nº 329-§1)",
    /<Link href="\/" aria-label="Accueil YokoFolio"/.test(fenetre),
    "intouché, comme demandé"
  );

  /* ---------- EN VIVANT : la page partagée d'un carrousel ---------- */
  const p4 = await ctx.newPage();
  await p4.goto(`${BASE}${FICHE_B}/carrousel`, { waitUntil: "networkidle" });
  await p4.waitForTimeout(1200);
  const rond = p4.locator('a[aria-label^="Voir le profil"]').first();
  if ((await rond.count()) === 0) {
    nonJoue(
      "§3 EN VIVANT",
      "le rond de profil n'a pas été trouvé sur la page partagée du " +
        "carrousel — la fiche d'épreuve n'a peut-être aucune photo."
    );
  } else {
    const cible = await rond.getAttribute("href");
    verif(
      "SUR LA PAGE PARTAGÉE, LE ROND PORTE LA CONSIGNE",
      (cible ?? "").includes("entree=lien") &&
        (cible ?? "").endsWith("#profil"),
      `href : ${cible}`
    );
    await rond.click();
    await p4.waitForTimeout(1400);
    const arrivee = await p4.evaluate(() => ({
      ou: location.pathname + location.search,
      photos: document.querySelectorAll("[data-photo-fiche]").length,
    }));
    verif(
      "…ELLE MÈNE À LA FICHE, SANS PHOTO EN HAUT",
      arrivee.ou.startsWith(FICHE_B) && arrivee.photos === 0,
      `${arrivee.ou} · ${arrivee.photos} photo(s) en haut`
    );
  }
  await p4.close();
}

/* ==================================================================
 * §4 — LA SECTION D'ADMINISTRATION DANS L'ADRESSE
 * ================================================================== */
titre("§4 — la section d'admin vit dans l'adresse, une entrée par pas");
{
  verif(
    "L'ÉCRITURE EST COMMUNE : `lib/etape-dans-adresse` existe",
    existsSync("/home/user/mon-site-roswel/src/lib/etape-dans-adresse.ts"),
    "`useEtapeDansLAdresse`"
  );
  const commun = sansNotes(lire("src/lib/etape-dans-adresse.ts"));
  verif(
    "CHAQUE PAS POSE UNE ENTRÉE — et ce n'est PAS la règle de l'onglet",
    /window\.history\.pushState\(/.test(commun) &&
      !/replaceState/.test(commun),
    "un vrai déplacement : le retour ramène au pas précédent"
  );
  verif(
    "…et L'ÉTAT EST RECOPIÉ : les marques du site survivent",
    /\.\.\.\(\(window\.history\.state as object \| null\) \?\? \{\}\)/.test(
      commun
    ),
    "le filet et l'étape d'une surface gardent leur compte"
  );
  verif(
    "UN PAS QUI N'EN EST PAS UN NE POUSSE RIEN",
    /if \(suivante === lireLAdresse\(\)\)/.test(commun),
    "reposer la valeur courante n'empile aucune étape identique"
  );
  verif(
    "LE RETOUR ET LE PAS EN AVANT RELISENT L'ADRESSE",
    /window\.addEventListener\("popstate", auRetour\)/.test(commun),
    "l'adresse fait foi, y compris à un rechargement"
  );
  const admin = sansNotes(lire("src/components/AdminYokofolio.tsx"));
  verif(
    "L'ADMINISTRATION L'EMPLOIE, sans copier le mécanisme",
    /useEtapeDansLAdresse<SectionCle>\(\s*"section",/.test(admin) &&
      !/history\.pushState/.test(admin),
    "aucun `pushState` recopié dans ce fichier"
  );
  verif(
    "…et UNE SECTION INCONNUE retombe sur l'écran d'arrivée",
    /function reconnaitreLaSection\(brut: string\): SectionCle \| null/.test(
      admin
    ),
    "une adresse bricolée n'affiche jamais un écran vide"
  );
}

nonJoue(
  "§4 SUR L'ADMINISTRATION EN VIVANT",
  "elle exige un compte administrateur, que ce conteneur ne sait pas " +
    "signer. CE QUI EST PROUVÉ : l'écriture commune est mesurée à la " +
    "source sur les quatre exigences (une entrée par pas, l'état " +
    "recopié, aucun pas vide, la relecture au retour), et " +
    "l'administration l'emploie sans en recopier une ligne."
);

nonJoue(
  "L'AUTRE MOITIÉ DU C-6 — L'ÉTAPE DE FORMULAIRE",
  "elle n'a pas d'objet dans le code : le formulaire du portfolio n'a " +
    "AUCUNE étape que l'on parcourt. Son seul état nommé `etape` vaut " +
    "« verification » puis « formulaire », et il avance TOUT SEUL au " +
    "bout de huit secondes (c'est un sas de chargement, pas un pas). " +
    "Le porter dans l'adresse enverrait le retour sur un écran qui " +
    "repartirait aussitôt en avant. Rien n'a donc été inventé ici — " +
    "la question est posée au propriétaire dans le compte rendu."
);

nonJoue(
  "WEBKIT",
  "ce conteneur n'a que Chromium. Toutes les mesures ci-dessus valent " +
    "pour Chromium et pour lui seul — ce n'est une preuve ni pour " +
    "Safari, ni pour l'iPhone du propriétaire. Le défaut d'origine de " +
    "la nº 194 s'était vu sur CHROME iPHONE, sur un va-et-vient " +
    "d'historique : le filet et la consommation d'étape sont " +
    "précisément de cette famille, et restent à éprouver là-bas."
);

await bilan(nav);
