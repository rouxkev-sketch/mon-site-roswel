/**
 * BANC DE LA PASSE Nº 284 — LA FENÊTRE DE CARROUSEL (SMARTPHONE)
 * ==================================================================
 * §1 TOUCHER UN CARROUSEL N'ENTRAÎNE PLUS AUCUNE REMONTÉE : au doigt,
 *    une page s'ouvre PAR-DESSUS (`FenetreCarrousel`), et la refermer
 *    retombe EXACTEMENT à l'endroit touché — mesuré au pixel ;
 * §2 LA FENÊTRE, EN ENTIER : anthracite, la barre du site recouverte,
 *    flèche · logo · rien, le style en gras et sa série dessous, la
 *    photo NETTE (ni capsule ni points dessus), la ligne rond ·
 *    points · cœur, le défilement natif EXISTANT (nº 209-§7) ;
 * §3 LES TROIS COMMANDES : la flèche (retour d'historique, ou lien
 *    vers la fiche en arrivée directe), le logo (accueil), le rond de
 *    profil (la fiche, section Profil) ;
 * §4 LE PARTAGE : l'adresse de la fenêtre est une VRAIE page — elle
 *    ouvre la fenêtre chez qui n'a jamais vu la fiche, sur LA PHOTO
 *    TOUCHÉE (`photo=N`), et son aperçu est celui de la nº 281 ;
 * §5 LA VERSION WEB NE CHANGE EN RIEN.
 *
 * ⚠️ UNE SEULE LARGEUR (390 px — c'est une passe smartphone), plus UNE
 * exception : trois vérifications à 1440 px, parce que « le web ne
 * change en rien » ne peut se prouver qu'en le regardant.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : le glissement du bord d'iOS et le gel
 * sur un vrai iPhone ne se testent pas ici — dit au compte rendu.
 */
import {
  BASE,
  bilan,
  chromium,
  lire,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const fenetre = sansNotes(lire("src/components/FenetreCarrousel.tsx"));
const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));
const carrousel = sansNotes(lire("src/components/CarrouselPortfolio.tsx"));
const route = sansNotes(
  lire("src/app/(tatouage)/tatoueur/[slug]/carrousel/page.tsx")
);
const chemins = sansNotes(lire("src/lib/photo-tatoueur.ts"));

const FICHE = "/tatoueur/typo-sauvage-bordeaux";
const MOBILE = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
};

const ouvrir = async (options) => {
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext(options);
  const page = await contexte.newPage();
  return { nav, page };
};

/* ==================================================================
 * §1 — À LA SOURCE : le mécanisme, et ce qu'il ne casse pas
 * ================================================================== */
titre("§1 — à la source : une entrée d'historique, l'adresse décide");
{
  verif(
    "l'ouverture ne se fait QU'AU DOIGT, lue au moment du geste " +
      "(jamais au rendu), et jamais en aperçu",
    /if \(apercu\) return false;/.test(fiche) &&
      /dataset\.appareil !== "mobile"\) return false;/.test(fiche)
  );
  verif(
    "OUVRIR = UN SEUL pushState vers l'adresse de la fenêtre, marqué " +
      "`fenetreFiche` (la mémoire de navigation ne la prend pas pour " +
      "une page)",
    /window\.history\.pushState\(\s*\{ fenetreFiche: true, fenetreCarrousel: true \}/.test(
      fiche
    ) && /cheminDeLaFenetreCarrousel\(tatoueur\.slug/.test(fiche)
  );
  verif(
    "le drapeau `data-fenetre-fiche` est posé AVANT le pushState — " +
      "sans lui, DefilementEnHaut remonterait la page sous la fenêtre",
    /setAttribute\("data-fenetre-fiche", "1"\);\s*window\.history\.pushState/.test(
      fiche
    )
  );
  verif(
    "la position est capturée AVANT le pushState (le routeur déplace " +
      "brièvement le défilement après lui)",
    /const position = positionSousLeGel\(\);\s*document\.documentElement\.setAttribute/.test(
      fiche
    )
  );
  verif(
    "LA FENÊTRE SUIT L'ADRESSE (le motif de PileFiches) : le retour du " +
      "téléphone la referme d'un cran, sans code dédié",
    /if \(fenetreCarrousel && cheminReel !== adresseDeLaFenetre\)/.test(fiche) &&
      /surFermeture=\{\(\) => window\.history\.back\(\)\}/.test(fiche)
  );
  verif(
    "FERMER, C'EST LE GEL QUI REND LA POSITION : gelerLeCorps(position " +
      "du toucher), dégel au démontage — l'écriture unique du site",
    /gelerLeCorps\(positionPage\)/.test(fenetre) &&
      /degeler\(\);\s*if \(corpsGele\(\)\) return;\s*document\.documentElement\.removeAttribute\("data-fenetre-fiche"\)/.test(
        fenetre
      )
  );
  verif(
    "LE DÉFILEMENT EST L'EXISTANT : la fenêtre monte CarrouselPortfolio " +
      "— aucune translation, aucun remontage d'indice n'est réinventé",
    /<CarrouselPortfolio/.test(fenetre) &&
      !/translateX/.test(fenetre) &&
      (carrousel.match(/translateX/g) ?? []).length === 1 &&
      /transform: `translateX\(\$\{-debut \* CRAN_FRISE\}px\)`/.test(carrousel)
  );
  verif(
    "l'adresse de la fenêtre s'écrit UNE fois (cheminDeLaFenetreCarrousel), " +
      "et `photo=0` ne s'écrit pas",
    /export function cheminDeLaFenetreCarrousel\(/.test(chemins) &&
      /if \(photo > 0\) suite\.set\("photo", String\(photo\)\);/.test(chemins)
  );
  verif(
    "ELLE S'OUVRE SUR LA PHOTO TOUCHÉE : le toucher de la photo " +
      "principale calcule l'ensemble de la photo REGARDÉE et son rang " +
      "dedans — jamais la première d'office",
    /ensembleDeLaPhoto\(tatoueur\.galerie \?\? \[\], brute\)/.test(fiche) &&
      /findIndex\(\(photo\) => photo\.id === brute\.id\)/.test(fiche) &&
      /pincementRecent\(\)/.test(fiche) &&
      /closest\("button, a"\)/.test(fiche)
  );
}

titre("§2 — à la source : la fenêtre, pièce par pièce");
{
  verif(
    "page entière anthracite, par-dessus la barre du site (z-70 > z-50), " +
      "aucun contour",
    /fixed inset-0 z-\[70\]/.test(fenetre) &&
      /bg-sombre-fond/.test(fenetre) &&
      !/border(?![a-zA-Z-])/.test(
        fenetre.replace(/borderRadius|borderBottom/g, "")
      )
  );
  verif(
    "la barre du haut : la flèche à gauche, le logo au centre, RIEN à " +
      "droite (un vide de la largeur de la flèche — pas de croix)",
    /aria-label="Retour"/.test(fenetre) &&
      /LogoYokofolio/.test(fenetre) &&
      /<span className="h-11 w-11" aria-hidden="true" \/>/.test(fenetre) &&
      !/aria-label="Fermer/.test(fenetre)
  );
  verif(
    "le style en blanc et en gras, la série dessous en gris plus petit " +
      "(« Réalisation · Noir et gris » : libellés du site, jamais écrits " +
      "à la main)",
    /text-\[17px\] font-bold text-sombre-texte/.test(fenetre) &&
      /text-\[13px\] text-sombre-texte-doux/.test(fenetre) &&
      /libelleNature\(serieEffective\.nature\)/.test(fenetre) &&
      /libelleRendu\(serieEffective\.rendu\)/.test(fenetre)
  );
  verif(
    "LA PHOTO EST NETTE : la capsule « 3/12 » et les points DANS " +
      "l'image sont débrayés (sansCompteur, sansPoints) — et ces deux " +
      "réglages sont FAUX par défaut : page et fenêtre du web inchangées",
    /sansCompteur\s+sansPoints/.test(fenetre) &&
      /sansCompteur = false,/.test(carrousel) &&
      /sansPoints = false,/.test(carrousel) &&
      /!surCarte && !sansCompteur && compteur/.test(carrousel) &&
      /n > 1 && !sansPoints && paginationWeb\(\)/.test(carrousel)
  );
  verif(
    "LES POINTS SONT CEUX DU WEB, repris tels quels : une seule " +
      "écriture (PointsDuCarrousel), consommée par la pagination du " +
      "carrousel ET par la fenêtre",
    /export function PointsDuCarrousel\(/.test(carrousel) &&
      /<PointsDuCarrousel\s+photos=\{photos\}\s+indice=\{indice\}\s+surRang=\{\(rang\) => allerA\(rang, true, "rond"\)\}/.test(
        carrousel
      ) &&
      /<PointsDuCarrousel/.test(fenetre)
  );
  verif(
    "une série d'UNE photo : la fenêtre s'ouvre quand même, SANS points",
    /\{n > 1 && \(\s*<PointsDuCarrousel/.test(fenetre)
  );
  verif(
    "un rond touché suit LA règle du carrousel : scrollTo vers " +
      "`offsetLeft` — aucune largeur lue",
    /zone\.scrollTo\(\{ left: colonne\.offsetLeft, behavior: "smooth" \}\)/.test(
      fenetre
    )
  );
  verif(
    "LE CŒUR EST L'EXISTANT (BoutonCoeurPhoto, non redessiné) et il " +
      "aime TOUT le carrousel : l'ensemble de la photo regardée, " +
      "calculé depuis la galerie brute (nº 210-§2)",
    /<BoutonCoeurPhoto/.test(fenetre) &&
      /galerie=\{ensembleDeLaPhoto\(/.test(fenetre) &&
      /variante="fiche-mobile"/.test(fenetre)
  );
}

titre("§3 — à la source : trois commandes, trois destinations");
{
  verif(
    "LA FLÈCHE : retour d'historique quand on venait du profil, LIEN " +
      "vers la fiche (sur ce carrousel) en arrivée directe",
    /\{surFermeture \? \(/.test(fenetre) &&
      /onClick=\{surFermeture\}/.test(fenetre) &&
      /href=\{adresseFiche\}/.test(fenetre) &&
      /cheminDuCarrousel\(\s*tatoueur\.slug/.test(fenetre)
  );
  verif(
    "LE LOGO : l'accueil — une navigation de DOCUMENT (un <a>, pas un " +
      "<Link> : le dégel ne peut pas reposer l'ancienne position sur " +
      "la nouvelle page)",
    /<a href="\/" aria-label="Accueil YokoFolio"/.test(fenetre) &&
      !/import Link from/.test(fenetre)
  );
  verif(
    "LE ROND DE PROFIL : la fiche, section Profil — un vrai lien vers " +
      "l'adresse NUE de la fiche (l'onglet Profil est celui d'arrivée, " +
      "et DefilementEnHaut garantit l'arrivée en haut)",
    /href=\{`\/tatoueur\/\$\{tatoueur\.slug\}`\}/.test(fenetre) &&
      /aria-label=\{`Voir le profil de \$\{tatoueur\.nom\}`\}/.test(fenetre)
  );
  verif(
    "écran non tactile : la fenêtre n'existe pas — on repart vers la " +
      "fiche par un `replace` (aucune entrée d'historique laissée)",
    /if \(document\.documentElement\.dataset\.appareil === "mobile"\) return;\s*window\.location\.replace\(adresseFiche\);/.test(
      fenetre
    )
  );
  verif(
    "la route de la fenêtre ne rend PAS le menu fixe du site, et " +
      "annonce l'aperçu de la nº 281 (la route /partage, mêmes tags)",
    !/EnTeteTatouage/.test(route) &&
      /\/partage`/.test(route) &&
      /robots: \{ index: false/.test(route)
  );
}

/* ==================================================================
 * VIVANT — 390 px, le parcours du propriétaire
 * ================================================================== */
titre("§1-§2 — vivant (390 px) : toucher, regarder, refermer — au pixel");
{
  const { nav, page } = await ouvrir(MOBILE);
  try {
    await page.goto(`${BASE}${FICHE}`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForSelector('[data-role="cadre"]', { timeout: 60000 });
    await page.waitForTimeout(2000);
    verif(
      "l'appareil est vu « mobile » (pointer: coarse)",
      (await page.evaluate(() => document.documentElement.dataset.appareil)) ===
        "mobile"
    );

    //  L'ONGLET PORTFOLIO, puis DESCENDRE vers les vignettes — le
    //  geste exact décrit : chercher un carrousel dans la grille.
    await page.locator('button:has-text("Portfolio")').first().click();
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      document
        .querySelector("ul.grid button")
        ?.scrollIntoView({ block: "center", behavior: "instant" });
    });
    await page.waitForTimeout(600);
    const positionDuToucher = await page.evaluate(() => window.scrollY);
    verif(
      "on est DESCENDU dans la page (le cas qui faisait mal)",
      positionDuToucher > 100,
      `scrollY ${positionDuToucher}`
    );

    await page.locator("ul.grid button").first().click();
    await page.waitForTimeout(1200);
    const ouverte = await page.evaluate(() => {
      const barre = document.querySelector("[data-barre-fixe]");
      const boite = barre?.getBoundingClientRect();
      const dessus = boite
        ? document.elementFromPoint(
            boite.left + boite.width / 2,
            Math.max(boite.top + boite.height / 2, 1)
          )
        : null;
      return {
        chemin: location.pathname,
        criteres: location.search,
        fenetre: Boolean(document.querySelector("[data-fenetre-carrousel]")),
        corps: document.body.style.position,
        drapeau: document.documentElement.dataset.fenetreFiche ?? "",
        barreRecouverte: Boolean(dessus?.closest("[data-fenetre-carrousel]")),
        titre: document
          .querySelector("[data-fenetre-carrousel] h1")
          ?.textContent?.trim(),
        sousTitre: document
          .querySelector("[data-fenetre-carrousel] h1 + p")
          ?.textContent?.trim(),
        capsule: Boolean(
          document.querySelector(
            '[data-fenetre-carrousel] [data-role="compteur"]'
          )
        ),
        pointsDansLaPhoto: Boolean(
          document.querySelector(
            '[data-fenetre-carrousel] [data-role="pagination"]'
          )
        ),
        pointsSousLaPhoto: document.querySelectorAll(
          "[data-fenetre-carrousel] .grid .overflow-hidden button"
        ).length,
        cadre: Boolean(
          document.querySelector('[data-fenetre-carrousel] [data-role="cadre"]')
        ),
      };
    });
    verif(
      "LA FENÊTRE S'OUVRE, par-dessus, SANS AUCUNE REMONTÉE : l'adresse " +
        "est la sienne et le corps est gelé sur place",
      ouverte.fenetre &&
        ouverte.chemin === `${FICHE}/carrousel` &&
        ouverte.corps === "fixed" &&
        ouverte.drapeau === "1",
      `${ouverte.chemin}${ouverte.criteres}`
    );
    verif(
      "le menu fixe du site A DISPARU (recouvert par la fenêtre)",
      ouverte.barreRecouverte
    );
    verif(
      "le style en tête, sa série dessous — les libellés du site",
      Boolean(ouverte.titre) &&
        /·/.test(ouverte.sousTitre ?? ""),
      `« ${ouverte.titre} » · « ${ouverte.sousTitre} »`
    );
    verif(
      "LA PHOTO EST NETTE : ni capsule, ni points dans l'image — les " +
        "points vivent SOUS la photo, et le cadre est le carrousel natif",
      !ouverte.capsule &&
        !ouverte.pointsDansLaPhoto &&
        ouverte.pointsSousLaPhoto > 0 &&
        ouverte.cadre,
      `${ouverte.pointsSousLaPhoto} point(s) sous la photo`
    );

    //  REFERMER — le retour du téléphone (c'est le même `back()` que
    //  la flèche et que le glissement du bord).
    await page.goBack();
    await page.waitForTimeout(1200);
    const fermee = await page.evaluate(() => ({
      chemin: location.pathname,
      fenetre: Boolean(document.querySelector("[data-fenetre-carrousel]")),
      scrollY: window.scrollY,
      corps: document.body.style.position || "",
      drapeau: document.documentElement.dataset.fenetreFiche ?? "",
    }));
    verif(
      "REFERMER RETOMBE EXACTEMENT À L'ENDROIT TOUCHÉ — le carrousel " +
        "suivant est sous le doigt (position rendue AU PIXEL)",
      !fermee.fenetre &&
        fermee.chemin === FICHE &&
        fermee.scrollY === positionDuToucher &&
        fermee.corps === "" &&
        fermee.drapeau === "",
      `scrollY ${fermee.scrollY} = ${positionDuToucher}`
    );
  } finally {
    await nav.close();
  }
}

titre("§1 — vivant (390 px) : la photo TOUCHÉE, jamais la première");
{
  const { nav, page } = await ouvrir(MOBILE);
  try {
    await page.goto(
      `${BASE}${FICHE}?style=chicano&nature=tatouage&rendu=black_and_grey`,
      { waitUntil: "domcontentloaded", timeout: 90000 }
    );
    await page.waitForSelector('[data-role="cadre"]', { timeout: 60000 });
    await page.waitForTimeout(2000);
    //  Aller à la DEUXIÈME photo du carrousel principal, puis toucher
    //  la photo elle-même.
    await page.evaluate(() => {
      const cadre = document.querySelector(
        '[data-photo-fiche] [data-role="cadre"]'
      );
      const colonne = cadre.querySelector('[data-role="colonne 1"]');
      cadre.scrollTo({ left: colonne.offsetLeft, behavior: "instant" });
    });
    await page.waitForTimeout(900);
    await page.locator("[data-photo-fiche]").tap();
    await page.waitForTimeout(1200);
    const etat = await page.evaluate(() => {
      const cadre = document.querySelector(
        '[data-fenetre-carrousel] [data-role="cadre"]'
      );
      return {
        criteres: location.search,
        scrollLeft: cadre?.scrollLeft ?? -1,
        largeur: cadre?.clientWidth ?? 0,
      };
    });
    verif(
      "toucher la photo principale ouvre la fenêtre SUR CETTE PHOTO " +
        "(photo=1 dans l'adresse, cadre défilé d'une largeur exacte)",
      /photo=1/.test(etat.criteres) && etat.scrollLeft === etat.largeur,
      `scrollLeft ${etat.scrollLeft} / largeur ${etat.largeur}`
    );
  } finally {
    await nav.close();
  }
}

titre("§4 — vivant (390 px) : le partage — l'adresse ouvre la fenêtre");
{
  const { nav, page } = await ouvrir(MOBILE);
  try {
    const adresse =
      `${BASE}${FICHE}/carrousel` +
      `?style=chicano&nature=tatouage&rendu=black_and_grey&photo=1`;
    await page.goto(adresse, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForSelector("[data-fenetre-carrousel]", { timeout: 60000 });
    await page.waitForTimeout(2500);
    const etat = await page.evaluate(() => {
      const cadre = document.querySelector(
        '[data-fenetre-carrousel] [data-role="cadre"]'
      );
      return {
        barreDansLeDom: Boolean(document.querySelector("[data-barre-fixe]")),
        fleche: document
          .querySelector('[data-fenetre-carrousel] a[aria-label="Voir la fiche"]')
          ?.getAttribute("href"),
        logo: document
          .querySelector('[data-fenetre-carrousel] a[aria-label="Accueil YokoFolio"]')
          ?.getAttribute("href"),
        rond: document
          .querySelector('[data-fenetre-carrousel] a[aria-label^="Voir le profil"]')
          ?.getAttribute("href"),
        scrollLeft: cadre?.scrollLeft ?? -1,
        largeur: cadre?.clientWidth ?? 0,
      };
    });
    verif(
      "quelqu'un qui n'a JAMAIS vu la fiche reçoit la fenêtre, SANS le " +
        "menu du site, ouverte sur la photo partagée",
      !etat.barreDansLeDom && etat.scrollLeft === etat.largeur,
      `scrollLeft ${etat.scrollLeft} / ${etat.largeur}`
    );
    verif(
      "et les trois commandes visent leurs trois destinations : la " +
        "fiche sur ce carrousel, l'accueil, le profil",
      (etat.fleche ?? "").startsWith(`${FICHE}?style=chicano`) &&
        etat.logo === "/" &&
        etat.rond === FICHE,
      `flèche ${etat.fleche}`
    );

    //  L'APERÇU DU PARTAGE — celui de la nº 281, avec les tags.
    const html = await (await fetch(adresse)).text();
    verif(
      "l'aperçu annoncé est celui de la nº 281 : la route /partage, " +
        "avec les tags du carrousel",
      /property="og:image" content="[^"]*\/partage\?style=chicano&amp;nature=tatouage&amp;rendu=black_and_grey"/.test(
        html
      ) && /name="robots" content="noindex/.test(html)
    );
  } finally {
    await nav.close();
  }
}

/* ==================================================================
 * §5 — L'EXCEPTION JUSTIFIÉE : LE WEB, REGARDÉ À 1440 px
 * ================================================================== */
titre("§5 — vivant (1440 px) : la version web ne change en rien");
{
  const { nav, page } = await ouvrir({ viewport: { width: 1440, height: 950 } });
  try {
    await page.goto(`${BASE}${FICHE}`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForSelector('[data-role="cadre"]', { timeout: 60000 });
    await page.waitForTimeout(1500);
    await page.locator('button:has-text("Portfolio")').first().click();
    await page.waitForTimeout(800);
    await page.locator("ul.grid button").first().click();
    await page.waitForTimeout(1200);
    const etat = await page.evaluate(() => ({
      chemin: location.pathname,
      fenetre: Boolean(document.querySelector("[data-fenetre-carrousel]")),
      carrousel: document
        .querySelector('[data-photo-fiche] [role="region"]')
        ?.getAttribute("aria-label"),
    }));
    verif(
      "une vignette du web garde son comportement : PAS de fenêtre, " +
        "l'adresse ne bouge pas, le carrousel principal change",
      !etat.fenetre && etat.chemin === FICHE && /Chicano/.test(etat.carrousel ?? ""),
      etat.carrousel ?? ""
    );

    //  L'adresse de la fenêtre, OUVERTE SUR LE WEB : elle n'existe pas
    //  — on repart vers la fiche, sur ce carrousel.
    await page.goto(
      `${BASE}${FICHE}/carrousel?style=chicano&nature=tatouage&rendu=black_and_grey`,
      { waitUntil: "domcontentloaded", timeout: 90000 }
    );
    await page.waitForTimeout(3500);
    verif(
      "l'adresse de la fenêtre, sur un écran non tactile, repart vers " +
        "LA FICHE sur ce carrousel (location.replace)",
      await page.evaluate(
        () =>
          location.pathname === "/tatoueur/typo-sauvage-bordeaux" &&
          /style=chicano/.test(location.search)
      ),
      await page.evaluate(() => location.pathname + location.search)
    );
    verif(
      "la pagination du web est intacte : les points vivent DANS la " +
        "photo (data-role=pagination), la frise extraite n'a rien changé",
      await page.evaluate(() =>
        Boolean(
          document.querySelector(
            '[data-photo-fiche] [data-role="pagination"] button'
          )
        )
      )
    );
  } finally {
    await nav.close();
  }
}

process.exit(bilan());
