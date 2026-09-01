/*  ██ ARCHIVE — CE BANC NE PEUT PLUS TOURNER TEL QUEL (nº 790) ██
    Il lit un fichier de sonde retiré au grand ménage d'avant mise en
    ligne : l'instrument qu'il éprouvait n'existe plus. Le fichier est
    GARDÉ parce qu'il est le compte rendu écrit de sa passe — la preuve
    de ce qui a été mesuré, et comment. Ne pas le lancer sans l'avoir
    d'abord relu : ce qu'il vérifie du SITE reste vrai, ce qu'il
    vérifie de la SONDE ne l'est plus. */
/**
 * BANC DE LA PASSE Nº 282
 * ==================================================================
 * §1 LE MÉCANISME : un seul, un défilement NATIF avec accrochage — ni
 *    translation de piste, ni remontage d'indice — et un seul
 *    composant pour la page de fiche comme pour la fenêtre superposée ;
 * §2 LA CAUSE DU TRAIT BLANC, ET SA CORRECTION : le bord gauche du
 *    cadre tombait ENTRE DEUX PIXELS (86,90625 px mesuré ici). La
 *    largeur, elle, était déjà juste depuis la nº 280 — on n'y touche
 *    pas. Une marge de moins d'un pixel repose le cadre sur la grille ;
 * §3 LA SONDE mesure EN CONTINU, suit la colonne réellement affichée,
 *    et affiche les deux nombres qui décident au millième.
 *
 * ⚠️ UNE SEULE LARGEUR (1609 px — celle du relevé du propriétaire),
 * livraison rapide. UNE SEULE EXCEPTION : trois lignes au doigt
 * (390 px) pour prouver que la correction y est NULLE — c'est le seul
 * endroit où elle pourrait se voir, et il fallait le mesurer.
 * ⚠️ CHROMIUM N'EST PAS LE MOTEUR DU PROPRIÉTAIRE : le trait blanc ne
 * s'affiche PAS ici (mesuré : le pixel du bord est du fond pur). Ce
 * banc prouve donc la GÉOMÉTRIE — bord entier, décalage nul —, pas la
 * disparition du trait, que lui seul peut constater.
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

const carrousel = lire("src/components/CarrouselPortfolio.tsx");
const carrouselNu = sansNotes(carrousel);
const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));
const fenetre = sansNotes(lire("src/components/FenetreFiche.tsx"));
const sonde = lire("src/components/SondeCadre.tsx");
const sondeNu = sansNotes(sonde);

const FICHE = "/tatoueur/typo-sauvage-bordeaux";
const LARGE = { width: 1609, height: 1363 };

const ouvrir = async (viewport, options = {}) => {
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({ viewport, ...options });
  const page = await contexte.newPage();
  return { nav, page };
};

/*  LA MESURE, ÉCRITE UNE FOIS — c'est exactement ce que la sonde
    affiche, et exactement ce que le propriétaire doit pouvoir lire. */
const MESURE = () => {
  const cadre =
    document.querySelector('[data-photo-fiche] [data-role="cadre"]') ??
    document.querySelector('[data-role="cadre"]');
  if (!cadre) return null;
  const colonnes = [...cadre.querySelectorAll('[data-role^="colonne"]')];
  const boite = cadre.getBoundingClientRect();
  let rang = -1;
  let meilleur = Infinity;
  colonnes.forEach((colonne, index) => {
    const ecart = Math.abs(colonne.getBoundingClientRect().left - boite.left);
    if (ecart < meilleur) {
      meilleur = ecart;
      rang = index;
    }
  });
  const mobile = rang >= 0 ? colonnes[rang] : null;
  return {
    cadres: document.querySelectorAll('[data-role="cadre"]').length,
    largeur: boite.width,
    bord: boite.left,
    fraction: boite.left - Math.round(boite.left),
    marge: parseFloat(getComputedStyle(cadre).marginLeft) || 0,
    scrollLeft: cadre.scrollLeft,
    scrollWidth: cadre.scrollWidth,
    clientWidth: cadre.clientWidth,
    photos: colonnes.length,
    rang,
    residuel: mobile
      ? mobile.getBoundingClientRect().left - boite.left
      : null,
    offsets: colonnes.map((colonne) => colonne.offsetLeft),
  };
};

/* ==================================================================
 * §1 — LE MÉCANISME : UN SEUL, ET IL EST NATIF
 * ================================================================== */
titre("§1 — à la source : un défilement natif, un seul composant");
{
  verif(
    "le cadre DÉFILE (overflow-x + accrochage), il ne se translate pas",
    /overflow-x-auto snap-x snap-mandatory/.test(carrouselNu) &&
      /data-role="cadre"/.test(carrouselNu)
  );
  verif(
    "les flèches et les points LISENT `offsetLeft` — aucune largeur " +
      "calculée",
    /zone\.scrollTo\(\{\s*left: colonne\.offsetLeft/.test(carrouselNu)
  );
  //  UNE SEULE translation dans tout le fichier, et c'est la frise des
  //  ronds — la piste des photos, elle, n'en porte aucune.
  const translations = carrouselNu.match(/translateX/g) ?? [];
  verif(
    "AUCUNE translation sur la piste des photos (la seule du fichier " +
      "est la frise des ronds)",
    translations.length === 1 &&
      /transform: `translateX\(\$\{-debut \* CRAN_FRISE\}px\)`/.test(
        carrouselNu
      ),
    `${translations.length} translation(s)`
  );
  verif(
    "la page de fiche ET la fenêtre superposée montent LE MÊME " +
      "composant — un seul mécanisme, pas deux",
    /<CarrouselPortfolio/.test(fiche) && /<CarrouselPortfolio/.test(fenetre)
  );
  verif(
    "la page de fiche n'en monte QU'UN",
    (fiche.match(/<CarrouselPortfolio/g) ?? []).length === 1
  );
}

/* ==================================================================
 * §2 — LA CORRECTION : LA POSITION, JAMAIS LA LARGEUR
 * ================================================================== */
titre("§2 — à la source : on cale le BORD, on ne retouche aucune largeur");
{
  verif(
    "l'arrondi de largeur de la nº 280 est INTACT, et il reste le seul",
    /w-\[round\(down,100%,1px\)\]/.test(carrouselNu) &&
      (carrouselNu.match(/round\(down/g) ?? []).length === 1
  );
  verif(
    "la correction retranche ce qu'elle a déjà posé (elle ne corrige " +
      "pas sa propre correction)",
    /const brut = zone\.getBoundingClientRect\(\)\.left - calagePose\.current;/.test(
      carrouselNu
    ) && /const voulu = Math\.round\(brut\) - brut;/.test(carrouselNu)
  );
  verif(
    "elle s'écrit en MARGE GAUCHE, et nulle part ailleurs",
    /marginLeft: calage \|\| undefined/.test(carrouselNu)
  );
  verif(
    "elle se remesure quand le cadre change de taille et quand la " +
      "fenêtre bouge",
    /new ResizeObserver\(auChangement\)/.test(carrouselNu) &&
      /window\.addEventListener\("resize", auChangement\)/.test(carrouselNu)
  );
  verif(
    "elle ne s'applique PAS aux cartes de mosaïque (content-visibility)",
    /if \(surCarte\) return;\s*const zone = cadre\.current;/.test(carrouselNu)
  );
  verif(
    "elle ne touche NI `scrollLeft`, NI l'accrochage, NI `offsetLeft`",
    !/calage[^\n]*scrollLeft/.test(carrouselNu) &&
      /snap-x snap-mandatory/.test(carrouselNu)
  );
}

titre("§2 — vivant (1609 px) : le bord tombe juste, à chaque photo");
{
  const { nav, page } = await ouvrir(LARGE);
  try {
    await page.goto(`${BASE}${FICHE}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForSelector('[data-role="cadre"]', { timeout: 60000 });
    await page.waitForTimeout(2500);
    const depart = await page.evaluate(MESURE);

    verif(
      "un seul cadre sur la page de fiche — la sonde ne peut pas se " +
        "tromper d'élément",
      depart.cadres === 1,
      `${depart.cadres} cadre(s)`
    );
    verif(
      "la largeur du cadre est ENTIÈRE (acquis de la nº 280)",
      Number.isInteger(depart.largeur),
      `${depart.largeur} px`
    );
    verif(
      "LE BORD GAUCHE TOMBE SUR UN PIXEL ENTIER — la correction du §2",
      Math.abs(depart.fraction) < 0.0005,
      `bord ${depart.bord} px · fraction ${depart.fraction}`
    );
    verif(
      "et elle a coûté MOINS D'UN PIXEL de marge (sans la correction, " +
        "le bord valait " +
        `${depart.bord - depart.marge})`,
      depart.marge > 0 && depart.marge < 1,
      `marge ${depart.marge} px`
    );

    //  LE PARCOURS — flèche après flèche, on relit les deux nombres.
    const etapes = [depart];
    for (let pas = 0; pas < depart.photos - 1; pas += 1) {
      const fleche = page.locator('[data-role="flèche droite"]');
      if (!(await fleche.count())) break;
      await fleche.click();
      await page.waitForTimeout(700);
      etapes.push(await page.evaluate(MESURE));
    }
    verif(
      "le parcours a bien changé de photo à chaque flèche",
      etapes.length === depart.photos &&
        etapes.every((etape, rang) => etape.rang === rang),
      etapes.map((e) => e.rang).join(" → ")
    );
    verif(
      "DÉCALAGE RÉSIDUEL NUL sur TOUTES les photos (bord de la photo " +
        "= bord du cadre)",
      etapes.every((etape) => Math.abs(etape.residuel) < 0.0005),
      etapes.map((e) => e.residuel.toFixed(3)).join(" · ")
    );
    verif(
      "le bord du cadre ne bouge pas d'un millième pendant le parcours",
      etapes.every((etape) => Math.abs(etape.fraction) < 0.0005)
    );
    verif(
      "les arrêts du défilement tombent sur des ENTIERS",
      etapes.every((etape) => Number.isInteger(etape.scrollLeft)),
      etapes.map((e) => e.scrollLeft).join(" · ")
    );
    verif(
      "LA RESTAURATION DE POSITION EST INTACTE : `offsetLeft` reste un " +
        "multiple exact de la largeur (la marge ne le déplace pas)",
      depart.offsets.every(
        (valeur, rang) => valeur === rang * depart.largeur
      ),
      depart.offsets.join(" · ")
    );
    verif(
      "le glissement fluide n'est pas cassé : accrochage toujours posé",
      await page.evaluate(() => {
        const cadre = document.querySelector('[data-role="cadre"]');
        const style = getComputedStyle(cadre);
        return (
          style.scrollSnapType.includes("x") && style.overflowX === "auto"
        );
      })
    );
  } finally {
    await nav.close();
  }
}

titre("§2 — vivant (390 px) : AU DOIGT, LA CORRECTION EST NULLE");
{
  const { nav, page } = await ouvrir(
    { width: 390, height: 844 },
    { isMobile: true, hasTouch: true, deviceScaleFactor: 3 }
  );
  try {
    await page.goto(`${BASE}${FICHE}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForSelector('[data-role="cadre"]', { timeout: 60000 });
    await page.waitForTimeout(2500);
    const mobile = await page.evaluate(MESURE);
    verif(
      "la photo touche le bord de l'écran : le bord est déjà entier, " +
        "donc AUCUNE marge n'est posée",
      mobile.marge === 0 && Math.abs(mobile.fraction) < 0.0005,
      `bord ${mobile.bord} · marge ${mobile.marge}`
    );
    verif(
      "et le décalage résiduel y est nul aussi",
      Math.abs(mobile.residuel) < 0.0005,
      `${mobile.residuel}`
    );
  } finally {
    await nav.close();
  }
}

/* ==================================================================
 * §3 — LA SONDE : EN DIRECT, SUR LA PIÈCE QUI BOUGE
 * ================================================================== */
titre("§3 — à la source : la sonde mesure en continu");
{
  verif(
    "elle boucle sur les images du navigateur — c'est ce qui manquait " +
      "à la nº 281 (aucun écouteur, relevé figé au chargement)",
    /image = requestAnimationFrame\(mesurer\);/.test(sondeNu)
  );
  verif(
    "elle ne repose un état que si un nombre a changé",
    /if \(signature !== empreinte\.current\)/.test(sondeNu)
  );
  verif(
    "elle TROUVE la colonne affichée (la plus proche du bord), elle ne " +
      "la suppose pas",
    /if \(ecart < meilleur\)/.test(sondeNu) &&
      /rang = index;/.test(sondeNu)
  );
  verif(
    "elle vise le cadre DE LA FICHE quand il y en a plusieurs, et dit " +
      "combien il y en a",
    /\[data-photo-fiche\] \$\{CADRE\}/.test(sondeNu) &&
      /cadres: tous\.length/.test(sondeNu)
  );
  verif(
    "elle affiche LE DÉCALAGE RÉSIDUEL et LA FRACTION DU BORD, au " +
      "millième, avec un verdict",
    /DÉCALAGE RÉSIDUEL/.test(sondeNu) &&
      /FRACTION DU BORD/.test(sondeNu) &&
      /residuelJuste/.test(sondeNu) &&
      /fractionJuste/.test(sondeNu) &&
      /valeur\.toFixed\(3\)/.test(sondeNu)
  );
  verif(
    "elle ne s'installe toujours que si l'adresse la demande",
    /get\("sonde-cadre"\) === "1"/.test(sondeNu) &&
      /if \(!active\) return null;/.test(sondeNu)
  );
}

titre("§3 — vivant (1609 px) : le relevé suit le doigt, il ne se fige plus");
{
  const { nav, page } = await ouvrir(LARGE);
  try {
    await page.goto(`${BASE}${FICHE}?sonde-cadre=1`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForSelector("[data-sonde-cadre]", { timeout: 60000 });
    await page.waitForTimeout(2500);
    const lireLaSonde = () =>
      page.locator("[data-sonde-cadre]").innerText();
    const avant = await lireLaSonde();
    verif(
      "au chargement : décalage résiduel 0,000 et fraction du bord 0,000",
      /DÉCALAGE RÉSIDUEL\s*0,000 px/.test(avant) &&
        /FRACTION DU BORD\s*0,000 px/.test(avant),
      avant.replace(/\n/g, " · ").slice(0, 120)
    );
    verif(
      "elle nomme la pièce mobile et compte les cadres",
      /pièce mobile\s*colonne 0/.test(avant) && /cadres sur la page/.test(avant)
    );

    //  LE POINT DE LA nº 282 : on change de photo SANS toucher au
    //  bouton « suivant » de la sonde — exactement ce que le
    //  propriétaire a fait, et qui figeait le relevé.
    await page.locator('[data-role="flèche droite"]').click();
    await page.waitForTimeout(800);
    const apres = await lireLaSonde();
    verif(
      "APRÈS UNE FLÈCHE (sans son bouton) : le relevé a suivi — c'est " +
        "le défaut de la nº 281, corrigé",
      /pièce mobile\s*colonne 1/.test(apres) && !/scrollLeft\s*0,000/.test(apres),
      apres
        .split("\n")
        .filter((l, i, t) => t[i - 1] === "scrollLeft" || t[i - 1] === "pièce mobile")
        .join(" · ")
    );
    verif(
      "et les deux nombres restent à zéro une fois la photo changée",
      /DÉCALAGE RÉSIDUEL\s*0,000 px/.test(apres) &&
        /FRACTION DU BORD\s*0,000 px/.test(apres)
    );
    verif(
      "« suivant » fait toujours défiler d'une photo",
      await page.evaluate(async () => {
        const boutons = [
          ...document.querySelectorAll("[data-sonde-cadre] button"),
        ];
        const suivant = boutons.find((b) => b.textContent.trim() === "suivant");
        const cadre = document.querySelector(
          '[data-photo-fiche] [data-role="cadre"]'
        );
        const avant = cadre.scrollLeft;
        suivant.click();
        await new Promise((r) => setTimeout(r, 800));
        return cadre.scrollLeft > avant;
      })
    );
  } finally {
    await nav.close();
  }
}

process.exit(bilan());
