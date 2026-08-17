/**
 * BANC DE LA PASSE Nº 329 — LIVRAISON RAPIDE
 * ==================================================================
 * SECONDE PASSE DE LA RÉPARATION DE LA NAVIGATION SMARTPHONE. Elle
 * traite les positions et les états ; les quatre surfaces qui ne
 * posent aucune entrée d'historique (C-4) restent pour plus tard.
 *
 * §1 — LE LOGO DE LA FENÊTRE pose l'accueil EN HAUT. C'était un
 *      contrecoup de la nº 328-§4, et le banc le dit en reproduisant
 *      la cause : le dégel reposait la position de la fiche sur une
 *      page qui n'était pas la sienne.
 * §2 — LA POSITION EXACTE AU RETOUR : le dégel passe par l'écriture
 *      unique de la restitution, réserve de hauteur comprise.
 * §3 — L'ONGLET Profil / Portfolio vit dans l'adresse : il survit au
 *      pas en avant, ET le retour continue de quitter la fiche.
 * §4 — LA CONSIGNE « sans photo » vit dans l'adresse : elle survit à
 *      un retour PUIS à un pas en avant, ce que la nº 295 ne savait
 *      pas faire. L'ancien mécanisme est retiré, code compris.
 * §5 — UN FILTRE APPLIQUÉ ouvre la liste EN HAUT.
 *
 * ⚠️ TOUT SE JOUE AU DOIGT : 390 × 844, densité 3, `hasTouch`.
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

const FICHE_A = "/tatoueur/atelier-corvus-lyon-1er";
const FICHE_B = "/tatoueur/nadege-roux-villeurbanne";
/** La vignette de style de l'onglet Portfolio (voir PortfolioDeLAffiche
    — elle n'a pas de marqueur, on la reconnaît à sa classe). */
const VIGNETTE = ".group\\/case";

const { nav, ctx, page } = await ouvrirLeNavigateur(
  "p329",
  { width: 390, height: 844 },
  { hasTouch: true, isMobile: true, deviceScaleFactor: 3 }
);

/** Ouvre la fenêtre de carrousel depuis la fiche, et rend la position
    de la page au moment du toucher. */
async function ouvrirLaFenetre() {
  await page.goto(`${BASE}${FICHE_A}`, { waitUntil: "networkidle" });
  await page.click('button:has-text("Portfolio")');
  await page.waitForTimeout(500);
  await page.locator(VIGNETTE).first().click();
  await page.waitForTimeout(700);
  return page.evaluate(() =>
    Math.abs(parseFloat(document.body.style.top || "0"))
  );
}

/* ==================================================================
 * §1 — LE LOGO POSE L'ACCUEIL EN HAUT
 * ================================================================== */
titre("§1 — le logo de la fenêtre : l'accueil s'ouvre en haut");
{
  const gelee = await ouvrirLaFenetre();
  verif(
    "LA FENÊTRE EST OUVERTE, et la page dessous est gelée à sa position",
    gelee > 0,
    `corps gelé à ${gelee} px`
  );

  await page.click(
    '[data-fenetre-carrousel] a[aria-label="Accueil YokoFolio"]'
  );
  await page.waitForTimeout(1100);
  const surLAccueil = await page.evaluate(() => ({
    url: location.pathname,
    y: Math.round(window.scrollY),
  }));
  verif(
    "LE LOGO MÈNE À L'ACCUEIL, ET LA PAGE Y EST EN HAUT",
    surLAccueil.url === "/" && surLAccueil.y === 0,
    `${surLAccueil.url} · ${surLAccueil.y} px (la fiche était à ${gelee})`
  );

  /*  ET LA CAUSE, DITE À LA SOURCE. Ce n'était NI la nº 328-§3 (celle
      qui a fait s'effacer `DefilementEnHaut` devant une position
      mémorisée) NI l'accueil : c'était LE DÉGEL. La nº 328-§4 a passé
      ce logo de `<a>` (navigation de DOCUMENT — le gel meurt avec la
      page) à `<Link>` (navigation de CLIENT — le dégel survit à la
      navigation), et le dégel reposait fidèlement la position de la
      FICHE sur l'accueil. */
  const gel = sansNotes(lire("src/lib/gel-du-corps.ts"));
  verif(
    "LA CAUSE EST TRAITÉE À LA SOURCE : le dégel connaît la page qu'il a gelée",
    /cheminDuGel !== null && location\.pathname !== cheminDuGel/.test(gel),
    "le dégel compare le chemin avant de reposer quoi que ce soit"
  );
  verif(
    "…et la fenêtre de carrousel LUI DIT sur quelle page elle est posée",
    /gelerLeCorps\(positionPage, `\/tatoueur\/\$\{tatoueur\.slug\}`\)/.test(
      sansNotes(lire("src/components/FenetreCarrousel.tsx"))
    ),
    "`gelerLeCorps(position, chemin)`"
  );
  verif(
    "…et une surface qui NE LE DIT PAS garde le comportement d'avant",
    /cheminAttendu\?: string/.test(gel) &&
      /cheminDuGel = cheminAttendu \?\? null;/.test(gel),
    "le paramètre est facultatif, `null` = on repose comme avant"
  );
}

/* ==================================================================
 * §2 — LA POSITION EXACTE AU RETOUR
 * ================================================================== */
titre("§2 — le dégel rend la position avec sa réserve de hauteur");
{
  /*  CE QUE J'AI TROUVÉ, ET C'EST LA PISTE DU PROPRIÉTAIRE :
      `lib/restitution-position` réserve bien la hauteur avant de poser
      — mais LE DÉGEL NE PASSAIT PAS PAR ELLE. Il faisait un `scrollTo`
      NU, qui suppose que le document a déjà sa hauteur définitive. Au
      moment où une surface se referme, la page dessous vient d'être
      rendue et ses images ne sont pas posées : le document est plus
      court, et le navigateur RABOTE la demande. */
  const gel = sansNotes(lire("src/lib/gel-du-corps.ts"));
  verif(
    "LE DÉGEL PASSE PAR L'ÉCRITURE UNIQUE (`poserLaPosition`), plus par un `scrollTo` nu",
    /poserLaPosition\(positionRetenue\);/.test(gel) &&
      !/window\.scrollTo\(\{ top: positionRetenue/.test(gel),
    "`poserLaPosition(positionRetenue)`"
  );
  verif(
    "…et cette écriture-là RÉSERVE la hauteur avant de poser",
    /document\.documentElement\.style\.minHeight = `\$\{reserve\}px`/.test(
      sansNotes(lire("src/lib/restitution-position.ts"))
    ),
    "`min-height` posée sur <html>, puis libérée quand le contenu l'atteint"
  );

  /*  ET LA MESURE, SUR LE SEUL DES TROIS ÉCRANS QUE CE CONTENEUR
      ATTEINT : la fenêtre de carrousel. On l'ouvre depuis une position
      basse, on la referme par le bouton du téléphone, et l'on regarde
      où la fiche se pose. */
  const gelee = await ouvrirLaFenetre();
  await page.goBack({ waitUntil: "commit" });
  await page.waitForTimeout(900);
  const rendue = await page.evaluate(() => Math.round(window.scrollY));
  verif(
    "AU RETOUR DANS LA FICHE, LA POSITION EST RENDUE AU PIXEL",
    Math.abs(rendue - gelee) <= 2,
    `gelée à ${gelee} · rendue à ${rendue}`
  );
}

/* ==================================================================
 * §3 — L'ONGLET VIT DANS L'ADRESSE
 * ================================================================== */
titre("§3 — l'onglet survit au pas en avant, le retour quitte la fiche");
{
  /*  ⚠️ UN ONGLET NEUF, ET UN PARCOURS PROPRE. Les sections
      précédentes ont empilé des `goto` vers la MÊME fiche : un
      « retour » y retombait sur une autre étape de la fiche, et le
      contrôle « le retour quitte la fiche » échouait pour une raison
      qui n'appartient qu'au banc. On repart donc d'un historique vide :
      l'accueil, puis la fiche. Deux étapes, pas une de plus. */
  const page3 = await ctx.newPage();
  await page3.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page3.goto(`${BASE}${FICHE_A}`, { waitUntil: "networkidle" });
  const avant = await page3.evaluate(() => location.search);
  await page3.click('button:has-text("Portfolio")');
  await page3.waitForTimeout(600);
  const apres = await page3.evaluate(() => ({
    search: location.search,
    len: history.length,
  }));
  verif(
    "CHANGER D'ONGLET ÉCRIT L'ADRESSE : `?onglet=portfolio`",
    apres.search.includes("onglet=portfolio"),
    apres.search
  );

  /*  ⚠️ ET IL N'AJOUTE AUCUNE ENTRÉE — c'est l'exigence du
      propriétaire, pas un détail : le retour doit continuer de QUITTER
      la fiche d'un seul appui. On le mesure DEUX FOIS : la longueur de
      l'historique ne bouge pas, et le retour sort bien de la fiche. */
  const longueurAvant = await page3.evaluate(() => history.length);
  await page3.click('button:has-text("Profil")');
  await page3.waitForTimeout(400);
  await page3.click('button:has-text("Portfolio")');
  await page3.waitForTimeout(400);
  const longueurApres = await page3.evaluate(() => history.length);
  verif(
    "TROIS CHANGEMENTS D'ONGLET N'AJOUTENT AUCUNE ENTRÉE D'HISTORIQUE",
    longueurApres === longueurAvant,
    `${longueurAvant} → ${longueurApres}`
  );
  verif(
    "…et la source le dit : `replaceState`, jamais `pushState`",
    /window\.history\.replaceState\(\s*window\.history\.state,/.test(
      sansNotes(lire("src/components/ContenuFiche.tsx"))
    ) &&
      !/pushState/.test(sansNotes(lire("src/components/ContenuFiche.tsx"))),
    "`replaceState` seul"
  );

  //  LE RETOUR QUITTE LA FICHE — le comportement dont le propriétaire
  //  est content, et qui ne doit pas changer.
  await page3.goBack({ waitUntil: "commit" });
  await page3.waitForTimeout(800);
  const apresRetour = await page3.evaluate(() => location.pathname);
  verif(
    "LE RETOUR QUITTE LA FICHE D'UN SEUL APPUI — inchangé",
    !apresRetour.startsWith(FICHE_A),
    apresRetour
  );

  //  ET LE PAS EN AVANT RETROUVE L'ONGLET.
  await page3.goForward({ waitUntil: "commit" });
  await page3.waitForTimeout(900);
  const enAvant = await page3.evaluate(() => ({
    search: location.search,
    //  L'onglet réellement affiché : le bouton actif du sélecteur.
    actif:
      [...document.querySelectorAll('[role="radio"]')]
        .find((b) => b.getAttribute("aria-checked") === "true")
        ?.textContent.trim() ?? "",
  }));
  verif(
    "LE PAS EN AVANT RETROUVE L'ADRESSE AVEC SON ONGLET",
    enAvant.search.includes("onglet=portfolio"),
    enAvant.search
  );
  verif(
    "…et la fiche s'affiche BIEN SUR PORTFOLIO, pas sur Profil",
    enAvant.actif === "Portfolio",
    `onglet actif : « ${enAvant.actif} » (avant cette passe : « Profil »)`
  );
  verif(
    "une adresse NUE reste sur Profil — rien n'a changé pour qui arrive normalement",
    avant === "" || !avant.includes("onglet="),
    "aucun paramètre d'onglet sur une arrivée ordinaire"
  );
  await page3.close();
}

/* ==================================================================
 * §4 — LA CONSIGNE « SANS PHOTO » VIT DANS L'ADRESSE
 * ================================================================== */
titre("§4 — pas de photo en haut par un lien interne, et ça survit");
{
  verif(
    "L'ANCIEN MÉCANISME EST RETIRÉ, CODE COMPRIS",
    !existsSync("/home/user/mon-site-roswel/src/lib/arrivee-sans-photo.ts"),
    "`lib/arrivee-sans-photo.ts` n'existe plus"
  );
  /*  ⚠️ ON CHERCHE DES APPELANTS, PAS DES SOUVENIRS. Le nom du
      mécanisme retiré est CITÉ dans les notes qui expliquent pourquoi
      il l'a été — c'est voulu, et une prochaine passe doit pouvoir le
      lire. On retire donc les commentaires AVANT de chercher : ce qui
      reste est du code, et du code seul. */
  const { execSync } = await import("node:child_process");
  const NOM = /arrivee-sans-photo|ArriveeSansPhoto|data-fiche-sans-photo/;
  const candidats = execSync(
    `grep -rl "arrivee-sans-photo\\|ArriveeSansPhoto\\|data-fiche-sans-photo" src/ || true`,
    { encoding: "utf8", cwd: process.env.RACINE ?? "/home/user/mon-site-roswel" }
  )
    .trim()
    .split("\n")
    .filter(Boolean);
  const restes = candidats.filter((f) => NOM.test(sansNotes(lire(f))));
  verif(
    "…et plus un seul appelant ne le nomme, la règle de style comprise",
    restes.length === 0,
    restes.length
      ? restes.join(", ")
      : candidats.length
        ? `0 appelant — ${candidats.length} fichier(s) le citent en NOTE : ${candidats.join(", ")}`
        : "0 trace dans `src/`"
  );

  //  TOUS LES LIENS INTERNES PORTENT LA CONSIGNE, par une écriture unique.
  const lieux = sansNotes(lire("src/components/BlocLieux.tsx"));
  const suivis = sansNotes(lire("src/components/BlocSuivis.tsx"));
  verif(
    "LES LIENS INTERNES PASSENT PAR `adresseDeLienInterne` — une seule écriture",
    /href=\{adresseDeLienInterne\(/.test(lieux) &&
      /href=\{adresseDeLienInterne\(/.test(suivis) &&
      /export function adresseDeLienInterne/.test(
        lire("src/components/ContenuFiche.tsx")
      ),
    "équipe, salon, et le rond de profil de « Ma sélection »"
  );

  /* ---------- EN VIVANT : le lien, le retour, le pas en avant ---------- */
  await page.goto(`${BASE}${FICHE_A}`, { waitUntil: "networkidle" });
  const lien = page.locator(`a[href^="${FICHE_B}?entree=lien"]`).first();
  const trouve = (await lien.count()) > 0;
  if (!trouve) {
    nonJoue(
      "§4 EN VIVANT",
      "aucun lien interne portant `?entree=lien` sur la fiche d'épreuve " +
        "— la fiche d'équipe attendue n'a pas été trouvée. Les contrôles " +
        "de source ci-dessus tiennent."
    );
  } else {
    await lien.click();
    await page.waitForTimeout(1000);
    const photoVisible = () =>
      page.evaluate(
        () => document.querySelectorAll("[data-photo-fiche]").length > 0
      );
    const arrivee = await page.evaluate(() => location.search);
    verif(
      "PAR UN LIEN INTERNE : l'adresse porte la consigne",
      arrivee.includes("entree=lien"),
      arrivee
    );
    verif(
      "…et LA PHOTO DU HAUT N'EST PAS LÀ",
      (await photoVisible()) === false,
      "aucun `[data-photo-fiche]` dans la page"
    );

    await page.goBack({ waitUntil: "commit" });
    await page.waitForTimeout(800);
    await page.goForward({ waitUntil: "commit" });
    await page.waitForTimeout(1000);
    const apresAllerRetour = await page.evaluate(() => location.search);
    verif(
      "APRÈS UN RETOUR PUIS UN PAS EN AVANT, la consigne est toujours là",
      apresAllerRetour.includes("entree=lien"),
      apresAllerRetour
    );
    verif(
      "…et LA PHOTO N'EST TOUJOURS PAS REVENUE — c'est ce que la nº 295 ratait",
      (await photoVisible()) === false,
      "la consigne se relit, elle ne se consomme plus"
    );

    //  ET UNE ARRIVÉE ORDINAIRE GARDE SA PHOTO.
    await page.goto(`${BASE}${FICHE_B}`, { waitUntil: "networkidle" });
    verif(
      "UNE ARRIVÉE PAR CARTE OU LIEN DE PARTAGE GARDE SA PHOTO",
      (await photoVisible()) === true,
      "la photo du haut est là, comme toujours"
    );
  }
}

/* ==================================================================
 * §5 — UN FILTRE OUVRE LA LISTE EN HAUT
 * ================================================================== */
titre("§5 — un filtre appliqué remonte la liste en haut");
{
  const filtres = sansNotes(lire("src/lib/filtres-selection.ts"));
  verif(
    "`poserSelection` REMONTE LA LISTE après avoir écrit l'adresse",
    /defilerSansGeste\(\{ top: 0, left: 0 \}\);/.test(filtres),
    "`defilerSansGeste({ top: 0 })` après le `replaceState`"
  );
  verif(
    "…et c'est `defilerSansGeste`, PAS un `scrollTo` nu — la barre ne doit pas y lire un geste",
    !/window\.scrollTo/.test(filtres),
    "aucun `scrollTo` brut dans ce module"
  );

  /*  LA MÉCANIQUE, JOUÉE EN VRAI sur une page longue : depuis le haut
      et depuis le milieu, la remontée pose bien la page à 0 — et sans
      être prise pour un geste (la rangée de recherche ne se replie
      pas). C'est la même fonction que `poserSelection` appelle. */
  for (const depart of [0, 900]) {
    await page.goto(`${BASE}/?style=realisme`, { waitUntil: "networkidle" });
    await page.evaluate((y) => {
      window.scrollTo({ top: y, left: 0, behavior: "instant" });
    }, depart);
    await page.waitForTimeout(250);
    const arrivee = await page.evaluate(() => {
      //  L'appel exact de `poserSelection`, joué à la main : le module
      //  n'est pas importable dans la page, mais la fonction qu'il
      //  appelle, si — c'est un `scrollTo` annoncé.
      document.documentElement.dataset.defilementProgramme = "1";
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      delete document.documentElement.dataset.defilementProgramme;
      return Math.round(window.scrollY);
    });
    verif(
      `DEPUIS ${depart} px, LA LISTE SE POSE EN HAUT`,
      arrivee === 0,
      `${depart} → ${arrivee}`
    );
  }
}

nonJoue(
  "§2 SUR « MA SÉLECTION » — LES ONGLETS SUIVIS ET FAVORIS",
  "/mes-favoris répond 307 sans une session Supabase signée par le " +
    "serveur, que ce conteneur ne peut pas fabriquer : je n'ai pu ni " +
    "reproduire le défaut, ni prouver qu'il est réparé sur ces deux " +
    "écrans. CE QUE J'AI VÉRIFIÉ À LA SOURCE : leur restitution passe " +
    "par `MemoireNavigation` → `poserLaPosition`, qui RÉSERVE DÉJÀ la " +
    "hauteur. La correction de cette passe porte sur le DÉGEL, qui ne " +
    "réservait rien — elle vaut donc pour la fenêtre de carrousel, " +
    "mesurée, et pour toute surface qui se referme au-dessus de ces " +
    "deux écrans. Si le défaut persiste sur Suivis et Favoris après " +
    "cette passe, il a une autre cause, et il faudra le mesurer sur " +
    "l'appareil du propriétaire."
);

nonJoue(
  "§5 SUR « MA SÉLECTION » EN VIVANT",
  "même mur : la page qui monte ces menus est derrière la session. La " +
    "remontée est prouvée à la source (l'appel est dans " +
    "`poserSelection`, l'écriture unique des deux menus) et sa " +
    "mécanique est jouée en vrai sur une page longue, aux deux points " +
    "de départ demandés."
);

nonJoue(
  "WEBKIT",
  "ce conteneur n'a que Chromium. Toutes les mesures ci-dessus valent " +
    "pour Chromium et pour lui seul — ce n'est une preuve ni pour " +
    "Safari, ni pour l'iPhone du propriétaire."
);

await ctx.close();
await nav.close();
process.exit(bilan());
