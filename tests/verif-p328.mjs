/**
 * BANC DE LA PASSE Nº 328 — LIVRAISON RAPIDE
 * ==================================================================
 * LA PREMIÈRE DES DEUX PASSES QUI RÉPARENT LA NAVIGATION SMARTPHONE.
 * Elle pose la règle et corrige C-1, C-2, C-3 et C-5 de l'inventaire
 * de la nº 327.
 *
 * §1 — LA RÈGLE, écrite en entier dans `lib/navigation-session.ts`.
 * §2 — C-3 : plus une seule position lue BRUTE. Éprouvé à la source
 *      ET exécuté : on gèle un corps, et l'on vérifie que la fonction
 *      rend la position gelée là où `window.scrollY` rendrait zéro.
 * §3 — C-2 : le chemin décide. Arrivée neuve → en haut ; retour → à
 *      la place quittée. ET AUCUN SAUT VISIBLE : on enregistre
 *      CHAQUE IMAGE pendant le retour et l'on regarde où la page
 *      était quand la fiche d'arrivée a été peinte.
 * §4 — C-1 : le rond de profil et le logo de la fenêtre de carrousel
 *      sont des navigations de client. Le retour après le rond de
 *      profil RAMÈNE LA FENÊTRE.
 * §5 — C-5 : une fermeture ne consomme que ce qu'elle a créé.
 *
 * ⚠️ TOUT SE JOUE AU DOIGT : 390 × 844, densité 3, `hasTouch`. C'est
 * l'appareil du sujet — la version web n'est pas touchée par cette
 * passe, et les gardes d'appareil du site le vérifient d'eux-mêmes.
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

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** LA FICHE D'ÉPREUVE — un salon à équipe : elle porte des liens
    INTERNES vers d'autres portfolios, le seul chemin qui écrit une
    position de fiche (nº 230-§3). */
const FICHE_A = "/tatoueur/atelier-corvus-lyon-1er";
const FICHE_B = "/tatoueur/nadege-roux-villeurbanne";

const { nav, ctx, page } = await ouvrirLeNavigateur(
  "p328",
  { width: 390, height: 844 },
  { hasTouch: true, isMobile: true, deviceScaleFactor: 3 }
);

/* ==================================================================
 * §1 — LA RÈGLE EST ÉCRITE, ET À UN SEUL ENDROIT
 * ================================================================== */
titre("§1 — la règle de navigation, écrite en entier dans sa maison");
{
  const socle = lire("src/lib/navigation-session.ts");
  const POINTS = [
    "Toute surface qui couvre l'écran pose une entrée d'historique",
    "Le retour ne referme qu'une chose à la fois",
    "Un écran neuf s'ouvre en haut",
    "La position se lit toujours par la fonction qui sait lire sous",
    "L'état d'un écran vit dans l'adresse, pas dans React",
    "Un lien interne vers un autre portfolio n'affiche pas la photo",
    "Une fermeture ne consomme une entrée que si elle l'a créée",
    "Le pas en avant rouvre ce que le retour vient de fermer",
  ];
  const manquants = POINTS.filter((p) => !socle.includes(p));
  verif(
    "LES HUIT POINTS SONT ÉCRITS, au mot près, dans `lib/navigation-session.ts`",
    manquants.length === 0,
    manquants.length ? `manque : « ${manquants[0]}… »` : "8 sur 8"
  );
  verif(
    "…avec la phrase d'autorité du propriétaire, datée",
    /Décidée par le propriétaire à la passe nº 328, après l'inventaire/.test(
      socle
    ) && /si un\n \* écran a besoin d'une exception, elle s'écrit ici, nommée et datée/.test(socle),
    "la clause d'exception est là"
  );
  verif(
    "…et elle dit NOMMÉMENT ce que cette passe NE traite pas (C-4 et C-6)",
    /QUATRE SURFACES NE LE FONT\n \* {4}PAS ENCORE/.test(socle) &&
      /QUATRE ÉTATS N'Y SONT PAS ENCORE/.test(socle),
    "les deux renvois à la passe suivante sont écrits"
  );
  //  UNE SEULE MAISON : la règle n'est pas recopiée ailleurs.
  const { execSync } = await import("node:child_process");
  const ailleurs = execSync(
    `grep -rln "Toute surface qui couvre l'écran pose une entrée" src/ || true`,
    { encoding: "utf8", cwd: process.env.RACINE ?? "/home/user/mon-site-roswel" }
  )
    .trim()
    .split("\n")
    .filter(Boolean);
  verif(
    "ELLE N'EST ÉCRITE QU'UNE FOIS — un seul fichier la porte",
    ailleurs.length === 1 && ailleurs[0] === "src/lib/navigation-session.ts",
    ailleurs.join(", ")
  );
}

/* ==================================================================
 * §2 — C-3 : PLUS UNE SEULE POSITION LUE BRUTE
 * ================================================================== */
titre("§2 — la position se lit sous le gel, partout");
{
  /*  LES SEPT ÉCRITURES DE POSITION DU SITE, nommées une par une.
      Chacune doit passer par `positionSousLeGel()` — jamais par
      `window.scrollY`. On lit le CODE, notes retirées : une note a le
      droit de citer `window.scrollY` pour dire qu'il ne faut plus
      l'employer (c'est même tout l'objet des notes de cette passe). */
  const ECRITURES = [
    ["MemoireNavigation — au défilement", "src/components/MemoireNavigation.tsx"],
    ["GrilleTatoueurs — l'ouverture d'une fenêtre", "src/components/GrilleTatoueurs.tsx"],
    ["PageFavoris — l'ouverture d'une fenêtre", "src/components/PageFavoris.tsx"],
    ["PageRechercheMobile — la position des résultats", "src/components/PageRechercheMobile.tsx"],
  ];
  /*  ⚠️ ON VISE LES MÉMORISATIONS, PAS TOUTE LECTURE DE `scrollY`.
      Un fichier a le droit de lire la position brute pour de la
      GÉOMÉTRIE — placer une animation, mesurer un décalage : ces
      lectures-là sont instantanées et ne sont jamais rangées. Ce que
      la règle interdit, c'est d'ÉCRIRE une position destinée à être
      rendue plus tard sans passer sous le gel. La première version de
      ce banc accusait `PageRechercheMobile` pour son
      `setDecalageSortie(… ? window.scrollY : 0)`, qui place la
      glissade de sortie — mesuré, et corrigé ici. */
  const ECRITURE = /(memoriserDefilement|memoriserDefilementResultats|setPositionGrille|setPositionPage)\(([^;]*?)\)/gs;
  for (const [nom, fichier] of ECRITURES) {
    const nu = sansNotes(lire(fichier));
    const appels = [...nu.matchAll(ECRITURE)];
    //  ⚠️ ON CHERCHE LE NOM, PAS LES PARENTHÈSES : la capture
    //  s'arrête au premier `)` — celui de `positionSousLeGel(`
    //  lui-même — et un motif `positionSousLeGel\(\)` n'y trouvait
    //  donc jamais rien (mesuré à la première exécution).
    const brutes = appels.filter((a) => /window\.scrollY/.test(a[2]));
    const sousLeGel = appels.filter((a) => /positionSousLeGel/.test(a[2]));
    verif(
      `${nom} — mémorise SOUS LE GEL, jamais la valeur brute`,
      appels.length > 0 && brutes.length === 0 && sousLeGel.length > 0,
      `${appels.length} mémorisation(s) · ${sousLeGel.length} sous le gel · ` +
        `${brutes.length} brute(s)`
    );
  }
  //  ET LA NOTE DE PROPRIÉTÉ DES DEUX AUTRES ÉCRITURES : la note de
  //  rechargement (`defilement:`) suit la même règle.
  for (const fichier of [
    "src/components/GrilleTatoueurs.tsx",
    "src/components/PageFavoris.tsx",
  ]) {
    verif(
      `${fichier.split("/").pop()} — sa note de rechargement aussi`,
      /defilement: positionSousLeGel\(\)/.test(sansNotes(lire(fichier))),
      "`defilement: positionSousLeGel()`"
    );
  }
  //  LE BUG NOMMÉ PAR LE PROPRIÉTAIRE : la branche fiche → fiche.
  const memoire = sansNotes(lire("src/components/MemoireNavigation.tsx"));
  verif(
    "LE CAS FICHE → FICHE, celui qui écrasait la position par 0, est corrigé",
    /if \(estUnePageDeDetail\(location\.pathname\)\) \{\s*memoriserDefilement\(\s*location\.pathname \+ location\.search,\s*positionSousLeGel\(\)\s*\);/.test(
      memoire
    ),
    "`positionSousLeGel()` dans la branche de détail"
  );

  /*  ET LA PREUVE EXÉCUTÉE, celle qui vaut mieux qu'une relecture :
      on gèle un corps EXACTEMENT comme le site le fait, et l'on
      compare les deux lectures. C'est le défaut, reproduit puis
      mesuré. */
  await page.goto(`${BASE}${FICHE_A}`, { waitUntil: "networkidle" });
  const lecture = await page.evaluate(() => {
    window.scrollTo({ top: 600, left: 0, behavior: "instant" });
    const avant = window.scrollY;
    //  Le gel du site, à la lettre (lib/gel-du-corps).
    const corps = document.body.style;
    corps.position = "fixed";
    corps.top = `-${avant}px`;
    corps.left = "0";
    corps.right = "0";
    corps.width = "100%";
    //  La lecture brute — celle qui écrivait le 0.
    const brute = window.scrollY;
    //  La lecture du site, recopiée telle quelle : elle relit le gel.
    const sousLeGel =
      corps.position === "fixed"
        ? Math.abs(parseFloat(corps.top || "0")) || 0
        : window.scrollY;
    corps.position = "";
    corps.top = "";
    corps.left = "";
    corps.right = "";
    corps.width = "";
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return { avant, brute, sousLeGel };
  });
  verif(
    "SOUS UN CORPS GELÉ, LA LECTURE BRUTE REND ZÉRO — le défaut, reproduit",
    lecture.avant > 0 && lecture.brute === 0,
    `position réelle ${lecture.avant} · lecture brute ${lecture.brute}`
  );
  verif(
    "…et la lecture du site rend la VRAIE position",
    lecture.sousLeGel === lecture.avant,
    `${lecture.sousLeGel} = ${lecture.avant}`
  );
}

/* ==================================================================
 * §3 — C-2 : LE CHEMIN DÉCIDE, ET SANS AUCUN SAUT
 * ================================================================== */
titre("§3 — arrivée neuve en haut, retour à la place quittée");

/** Enregistre `scrollY` ET la hauteur du document À CHAQUE IMAGE.
    La hauteur dit QUELLE PAGE est peinte : deux fiches n'ont pas la
    même. C'est ainsi qu'on voit si la fiche d'arrivée a été peinte
    en haut avant d'être reposée — c'est-à-dire s'il y a un saut. */
const poserLEnregistreur = () =>
  page.evaluate(() => {
    window.__images = [];
    const boucle = () => {
      window.__images.push({
        y: Math.round(window.scrollY),
        h: document.body.scrollHeight,
      });
      window.__boucle = requestAnimationFrame(boucle);
    };
    window.__boucle = requestAnimationFrame(boucle);
  });

{
  /* ---------- 1. ARRIVÉE NEUVE : EN HAUT ---------- */
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() =>
    window.scrollTo({ top: 900, left: 0, behavior: "instant" })
  );
  await page.waitForTimeout(200);
  await page.goto(`${BASE}${FICHE_A}`, { waitUntil: "networkidle" });
  const arrivee = await page.evaluate(() => Math.round(window.scrollY));
  verif(
    "ARRIVÉE NEUVE SUR UNE FICHE : la page s'ouvre EN HAUT",
    arrivee === 0,
    `${arrivee} px`
  );

  /* ---------- 2. RETOUR : À LA PLACE QUITTÉE ---------- */
  //  On descend dans la fiche A, on suit un lien INTERNE vers la
  //  fiche B (le seul chemin qui écrit une position de fiche), puis
  //  on revient.
  const POSITION = 700;
  await page.evaluate((y) => {
    window.scrollTo({ top: y, left: 0, behavior: "instant" });
  }, POSITION);
  await page.waitForTimeout(250);
  const hauteurA = await page.evaluate(() => document.body.scrollHeight);

  /*  ⚠️ LA POSITION EST RELEVÉE AU MOMENT EXACT DU CLIC, et pas avant.
      Playwright fait défiler l'élément dans la vue avant de le
      toucher : la page bougeait de quelques pixels entre ma pose et le
      clic, et le banc comparait le retour à une position que
      l'utilisateur n'avait jamais quittée (mesuré : 700 posé, 706
      quitté, 706 rendu — le site avait raison, le banc avait tort).
      L'écouteur ci-dessous note ce que le site lui-même verrait. */
  await page.evaluate(() => {
    window.__auClic = null;
    document.addEventListener(
      "click",
      () => {
        window.__auClic = Math.round(window.scrollY);
      },
      true
    );
  });
  await page.click(`a[href="${FICHE_B}"]`);
  const posee = await page.evaluate(() => window.__auClic);
  await page.waitForURL(`**${FICHE_B}`, { timeout: 15000 });
  await page.waitForTimeout(400);
  const surB = await page.evaluate(() => ({
    y: Math.round(window.scrollY),
    h: document.body.scrollHeight,
  }));
  verif(
    "LE LIEN INTERNE MÈNE À L'AUTRE PORTFOLIO, et il s'ouvre en haut",
    surB.y === 0,
    `${surB.y} px sur la fiche liée`
  );

  //  L'ENREGISTREUR EST POSÉ AVANT LE RETOUR : il tourne pendant
  //  toute la traversée.
  await poserLEnregistreur();
  await page.goBack({ waitUntil: "commit" });
  await page.waitForTimeout(900);
  const images = await page.evaluate(() => {
    cancelAnimationFrame(window.__boucle);
    return window.__images;
  });
  const finale = await page.evaluate(() => Math.round(window.scrollY));

  verif(
    "RETOUR SUR LA FICHE : elle se pose LÀ OÙ ON L'AVAIT QUITTÉE",
    Math.abs(finale - posee) <= 4,
    `quittée à ${posee} · retrouvée à ${finale}`
  );

  /*  L'ABSENCE DE SAUT, ET VOICI COMMENT ELLE SE MESURE.
      ------------------------------------------------------------------
      On tient une image par rendu, avec DEUX nombres : la position, et
      LA HAUTEUR DU DOCUMENT. La hauteur est la signature de la page
      peinte — la fiche A et la fiche B n'ont pas la même. On cherche
      donc LA PREMIÈRE IMAGE OÙ LA FICHE A EST DE NOUVEAU À L'ÉCRAN, et
      l'on regarde où la page était À CET INSTANT.
      · SI ELLE Y ÉTAIT DÉJÀ À SA PLACE → la position a été posée AVANT
        la peinture : aucun saut n'a pu se voir.
      · SI ELLE Y ÉTAIT EN HAUT → l'œil a vu la page en haut, puis
        descendre. C'est le saut, et c'est ce que le §3 interdit. */
  const marge = 60;
  const surA = images.filter((i) => Math.abs(i.h - hauteurA) <= marge);
  const premiere = surA[0];
  verif(
    "AUCUN SAUT VISIBLE : dès la PREMIÈRE image où la fiche est peinte, la page y est",
    premiere !== undefined && Math.abs(premiere.y - posee) <= 4,
    premiere
      ? `1re image de la fiche : ${premiere.y} px (attendu ${posee})`
      : "aucune image identifiée — voir la NON JOUÉE"
  );
  const enHaut = surA.filter((i) => i.y <= 4).length;
  verif(
    "…et AUCUNE image de la fiche n'a été peinte en haut",
    surA.length > 0 && enHaut === 0,
    `${surA.length} image(s) de la fiche · ${enHaut} en haut`
  );

  //  ET LA SOURCE : la remontée inconditionnelle est bien partie.
  const defilement = sansNotes(lire("src/components/DefilementEnHaut.tsx"));
  verif(
    "`DefilementEnHaut` NE REMONTE PLUS SANS CONDITION sur une fiche",
    /const revient =/.test(defilement) &&
      /restaurationDemandeePour\(url\)/.test(defilement) &&
      /if \(revient\) \{/.test(defilement),
    "les trois signaux sont lus avant de décider"
  );
  verif(
    "…et il POSE la position lui-même, dans son effet d'AVANT PEINTURE",
    /poserLaPosition\(lireDefilement\(url\), adresseDeRecherche\(url\)\)/.test(
      defilement
    ) && /useEffetAvantPeinture/.test(defilement),
    "`poserLaPosition` appelée dans `useEffetAvantPeinture`"
  );
  verif(
    "…SANS consommer le jeton de `MemoireNavigation` (lecture non destructive)",
    /export function restaurationDemandeePour/.test(
      lire("src/lib/navigation-session.ts")
    ) &&
      !/consommerRestaurationPosition/.test(defilement),
    "`restaurationDemandeePour` lit, `consommerRestaurationPosition` reste à la mémoire"
  );
}

/* ==================================================================
 * §4 — C-1 : LES DEUX COMMANDES DE LA FENÊTRE DE CARROUSEL
 * ================================================================== */
titre("§4 — le rond de profil et le logo, en navigation de client");
{
  const fenetre = sansNotes(lire("src/components/FenetreCarrousel.tsx"));
  verif(
    "PLUS AUCUN `<a href>` INTERNE dans la fenêtre : les deux sont des `<Link>`",
    /<Link\s+href=\{`\/tatoueur\/\$\{tatoueur\.slug\}#profil`\}/.test(fenetre) &&
      /<Link href="\/" aria-label="Accueil YokoFolio"/.test(fenetre),
    "rond de profil et logo en client"
  );
  const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));
  verif(
    "L'ADRESSE OUVRE LA FENÊTRE AUTANT QU'ELLE LA FERME (point 5 de la règle)",
    /setFenetreCarrousel\(fenetreDeLAdresse\(\)\)/.test(fiche) &&
      /function fenetreDeLAdresse\(\)/.test(fiche),
    "l'ajustement pendant le rendu est symétrique"
  );

  /* ---------- EN VIVANT : ouvrir la fenêtre, puis le rond ---------- */
  await page.goto(`${BASE}${FICHE_A}`, { waitUntil: "networkidle" });
  await page.click('button:has-text("Portfolio")');
  await page.waitForTimeout(500);
  //  La première vignette de style de l'onglet Portfolio.
  //  La vignette de style de l'onglet Portfolio : un bouton qui
  //  porte une image en 4/5 (voir PortfolioDeLAffiche — elle n'a pas
  //  de marqueur à elle, on la reconnaît donc à sa forme).
  const vignette = page.locator(".group\\/case").first();
  const ouvrable = (await vignette.count()) > 0;
  if (!ouvrable) {
    nonJoue(
      "§4 EN VIVANT — l'ouverture de la fenêtre par une vignette",
      "aucune vignette trouvée dans l'onglet " +
        "Portfolio de la fiche d'épreuve : le marqueur n'existe pas sous " +
        "ce nom. Les deux contrôles de source ci-dessus tiennent, mais " +
        "le parcours n'a pas pu être joué."
    );
  } else {
    await vignette.click();
    await page.waitForTimeout(700);
    const ouverte = await page.evaluate(() => ({
      chemin: location.pathname,
      fenetre: Boolean(document.documentElement.dataset.fenetreFiche),
    }));
    verif(
      "LA FENÊTRE S'OUVRE : l'adresse devient celle du carrousel",
      ouverte.chemin.endsWith("/carrousel") && ouverte.fenetre,
      `${ouverte.chemin}`
    );

    await page.click('a[aria-label^="Voir le profil"]');
    await page.waitForTimeout(700);
    const apresRond = await page.evaluate(() => location.pathname);
    verif(
      "LE ROND DE PROFIL MÈNE À LA FICHE, en client (l'adresse quitte le carrousel)",
      apresRond === FICHE_A,
      apresRond
    );

    await page.goBack({ waitUntil: "commit" });
    await page.waitForTimeout(800);
    const auRetour = await page.evaluate(() => ({
      chemin: location.pathname,
      //  LA FENÊTRE EST-ELLE LÀ ? Sa barre porte le compteur et la
      //  flèche de fermeture — un BOUTON, pas un lien : c'est la
      //  signature de la version SUPERPOSÉE (la page à part entière
      //  rend un `<a>` à la place).
      superposee: Boolean(
        document.querySelector('button[aria-label="Fermer"]') ||
          document.querySelector('[data-fenetre-carrousel]')
      ),
      fenetre: Boolean(document.documentElement.dataset.fenetreFiche),
    }));
    verif(
      "LE RETOUR RAMÈNE L'ADRESSE DU CARROUSEL",
      auRetour.chemin.endsWith("/carrousel"),
      auRetour.chemin
    );
    verif(
      "…ET C'EST BIEN LA FENÊTRE SUPERPOSÉE, pas la page pleine",
      auRetour.fenetre,
      auRetour.fenetre
        ? "`data-fenetre-fiche` posé — la fiche est montée dessous"
        : "drapeau absent : la page serveur a répondu"
    );
  }
}

/* ==================================================================
 * §5 — C-5 : UNE FERMETURE NE CONSOMME QUE CE QU'ELLE A CRÉÉ
 * ================================================================== */
titre("§5 — les gardes de fermeture, sur les trois surfaces");
{
  const CAS = [
    ["PageFavoris", "src/components/PageFavoris.tsx", /if \(!entreePoussee\.current\) return;\s*entreePoussee\.current = false;\s*window\.history\.back\(\);/],
    ["GrilleTatoueurs", "src/components/GrilleTatoueurs.tsx", /if \(!entreePoussee\.current\) return;\s*entreePoussee\.current = false;\s*window\.history\.back\(\);/],
    ["PileFiches", "src/components/PileFiches.tsx", /if \(entreesPoussees\.current <= 0\) return;\s*entreesPoussees\.current -= 1;\s*window\.history\.back\(\);/],
  ];
  for (const [nom, fichier, forme] of CAS) {
    verif(
      `${nom} — sa fermeture vérifie qu'elle a poussé avant de consommer`,
      forme.test(sansNotes(lire(fichier))),
      "garde posée"
    );
  }
  //  ET LE DRAPEAU EST ARMÉ PAR L'OUVERTURE, sinon il ne dirait rien.
  verif(
    "…et chaque ouverture arme son drapeau juste après son `pushState`",
    /entreePoussee\.current = true;/.test(sansNotes(lire("src/components/PageFavoris.tsx"))) &&
      /entreePoussee\.current = true;/.test(sansNotes(lire("src/components/GrilleTatoueurs.tsx"))) &&
      /entreesPoussees\.current \+= 1;/.test(sansNotes(lire("src/components/PileFiches.tsx"))),
    "trois armements, trois gardes"
  );
  //  LA QUATRIÈME FERMETURE DU SITE — celle de la fenêtre de carrousel
  //  — est SYMÉTRIQUE PAR CONSTRUCTION : `surFermeture` n'est passé
  //  que lorsque la fenêtre existe, et elle n'existe que si l'ouverture
  //  a poussé. On le dit, on ne le laisse pas deviner.
  verif(
    "LA FENÊTRE DE CARROUSEL n'a pas besoin de garde : elle est symétrique par construction",
    /surFermeture=\{\(\) => window\.history\.back\(\)\}/.test(
      sansNotes(lire("src/components/FicheTatoueur.tsx"))
    ),
    "`surFermeture` n'est monté qu'avec la fenêtre"
  );
}

nonJoue(
  "LE LOGO DE LA FENÊTRE : LE RETOUR NE RAMÈNE PAS LA FENÊTRE",
  "et ce n'est pas un défaut caché — c'est écrit dans le composant. " +
    "Le logo QUITTE la route `/tatoueur/[slug]`, donc la fiche est " +
    "démontée ; le retour ramène l'adresse du carrousel, que la route " +
    "serveur sert en page à part entière. Pour que ce chemin rende la " +
    "fenêtre AUSSI, il faudrait que la route `/carrousel` monte la " +
    "fiche dessous sur smartphone — ce qui changerait ce que voit " +
    "quelqu'un qui reçoit un lien de partage. C'est une décision de " +
    "produit, elle n'est pas prise ici."
);

nonJoue(
  "WEBKIT",
  "ce conteneur n'a que Chromium. Toutes les mesures ci-dessus valent " +
    "pour Chromium et pour lui seul — ce n'est une preuve ni pour " +
    "Safari, ni pour l'iPhone du propriétaire, qui est justement " +
    "l'appareil où le défaut se voit."
);

await ctx.close();
await nav.close();
process.exit(bilan());
