/**
 * BANC DE LA PASSE Nº 314 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 — LA PAGE DE FOND NE BASCULE PLUS SUR « FAVORIS ». La cause est
 *      une PERTE DE REQUÊTE ; on l'éprouve donc en exécutant la
 *      lecture d'adresse (`lireSelection`) sur les deux écritures —
 *      celle d'avant et celle d'après — puis on lit la source.
 * §2 — LE MENU DES FAVORIS COMPTE LES PHOTOS. `comptesDesFavoris` est
 *      une FONCTION PURE : le banc l'EXÉCUTE sur un cas où l'ancien
 *      comptage et le nouveau diffèrent, et compare les deux.
 * §3 — AU DOIGT, LE PORTFOLIO PASSE EN GALERIES QUI DÉFILENT : boîtes
 *      mesurées, débord de chaque côté, largeur des bandes
 *      d'effacement, et l'effacement DÉCODÉ AU PIXEL. Puis §3-d (on
 *      ouvre sur la photo touchée), §3-e (la photo du haut n'ouvre
 *      rien) et §3-f (le web n'a pas bougé).
 * §4 — LE MESSAGE DE BIENVENUE A DISPARU, CODE COMPRIS.
 *
 * ⚠️ UNE SEULE FENÊTRE PAR APPAREIL, jamais de balayage de largeurs :
 * 1440 × 823 pour le web (celle du propriétaire) et 390 × 844 au doigt.
 *
 * ⚠️ CE QUI NE PEUT PAS ÊTRE JOUÉ ICI est dit, jamais tu : voir les
 * NON JOUÉES en fin de fichier.
 */
//  ⚠️ LE CROCHET D'ALIAS S'ENREGISTRE, IL NE S'IMPORTE PAS (nº 302).
import { register } from "node:module";
register("./_alias-src.mjs", import.meta.url);

import {
  BASE,
  bilan,
  lire,
  nonJoue,
  ouvrirLeNavigateur,
  titre,
  verif,
} from "./commun-verif.mjs";
import { lirePixels } from "./_pixels.mjs";

const { lireSelection, CHOIX_PAR_DEFAUT, MENU_SUIVIS } = await import(
  "@/lib/filtres-selection"
);
const { comptesDesFavoris } = await import("@/lib/selection-suivis");
const { valeurExplorer } = await import("@/config/tatouage");
const { cleDEnsemble, natureConnue } = await import("@/lib/photos-tatoueur");

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const favoris = sansNotes(lire("src/components/PageFavoris.tsx"));
const affiche = sansNotes(lire("src/components/PortfolioDeLAffiche.tsx"));
const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));
const suivis = sansNotes(lire("src/components/BlocSuivis.tsx"));
const formulaire = sansNotes(lire("src/components/FormulaireFiche.tsx"));
const rappel = sansNotes(lire("src/app/auth/callback/route.ts"));
const arrivee = sansNotes(lire("src/app/(tatouage)/apres-connexion/page.tsx"));
const ecran = sansNotes(lire("src/components/EcranAuthentification.tsx"));
const config = sansNotes(lire("src/config/tatouage.ts"));

const FICHE = "/tatoueur/ligne-claire-studio-nantes";
const SERIE = "cyberpunk·color";
const sel = `[data-galerie-serie="${SERIE}"]`;

/* ==================================================================
 * §1 — LA CAUSE, ÉPROUVÉE : UNE REQUÊTE PERDUE
 * ================================================================== */
titre("§1 — l'onglet vit dans la requête, et l'ouverture la garde");
{
  //  L'ADRESSE QUE POSAIT L'ANCIENNE ÉCRITURE : le chemin seul, sans
  //  la moindre requête. C'est très exactement ce que `lireSelection`
  //  reçoit alors — et ce qu'elle en fait est le bug entier.
  const avant = lireSelection("");
  const apres = lireSelection("?selection=suivis:cyberpunk");

  verif(
    "une adresse SANS requête retombe sur le choix par défaut — le menu Favoris",
    avant.menu === CHOIX_PAR_DEFAUT.menu && avant.menu === "favoris",
    `lireSelection("") → menu « ${avant.menu} »`
  );
  verif(
    "la même adresse AVEC sa requête garde l'onglet Portfolios (« suivis »)",
    apres.menu === MENU_SUIVIS && apres.style === "cyberpunk",
    `lireSelection("?selection=suivis:cyberpunk") → menu « ${apres.menu} », ` +
      `style « ${apres.style} »`
  );
  verif(
    "les deux lectures DIFFÈRENT : effacer la requête change bien d'onglet",
    avant.menu !== apres.menu,
    `${avant.menu} ≠ ${apres.menu}`
  );

  //  LA SOURCE : c'est bien `ouvrirLaFiche` (réemployée à la nº 312)
  //  qui posait l'adresse, et elle emporte désormais la requête.
  verif(
    "l'ouverture en fenêtre emporte la requête courante",
    /pushState\(\s*\{\s*fenetreFiche:\s*true\s*\},\s*"",\s*`\/tatoueur\/\$\{slug\}\$\{window\.location\.search\}`/.test(
      favoris
    ),
    "pushState(…, `/tatoueur/${slug}${window.location.search}`)"
  );
  verif(
    "plus aucune écriture d'adresse sans requête dans PageFavoris",
    !/`\/tatoueur\/\$\{slug\}`/.test(favoris),
    "aucun `/tatoueur/${slug}` nu"
  );
  verif(
    "l'onglet est bien lu dans la requête, et nulle part ailleurs",
    /lireSelection\(requete\)/.test(favoris) &&
      /lireRequeteCourante/.test(favoris),
    "lireSelection(requete), requete = lireRequeteCourante()"
  );
  //  LA POSITION DE LA PAGE : elle était déjà gardée, et la passe n'y
  //  touche pas — on vérifie qu'elle est toujours là (le propriétaire
  //  demande la page « à sa position »).
  verif(
    "la position de la page est mémorisée à l'ouverture et rendue à la fermeture",
    /setPositionPage\(window\.scrollY\)/.test(favoris) &&
      /defilement:\s*window\.scrollY/.test(favoris),
    "setPositionPage + note de rechargement"
  );
}

/* ==================================================================
 * §2 — LE COMPTE DU MENU : DES PHOTOS, PLUS DES ENSEMBLES
 * ================================================================== */
titre("§2 — le menu compte les photos aimées, exécuté sur un cas discriminant");
{
  /** L'ANCIEN COMPTAGE, RECOPIÉ TEL QUEL depuis le code d'avant la
      passe : il comptait des ENSEMBLES distincts. Il vit ici pour
      qu'on puisse montrer le nombre AVANT et le nombre APRÈS sur la
      même donnée — c'est la preuve demandée. */
  const comptageAncien = (photos) => {
    const parCle = new Map();
    const ajouter = (cle, ensemble) => {
      const vus = parCle.get(cle) ?? new Set();
      vus.add(ensemble);
      parCle.set(cle, vus);
    };
    for (const photo of photos) {
      const nature = natureConnue(photo.nature);
      const ensemble = `${photo.tatoueurSlug}·${cleDEnsemble(photo)}`;
      ajouter(valeurExplorer(nature, ""), ensemble);
      ajouter(valeurExplorer(nature, photo.style), ensemble);
    }
    return new Map([...parCle].map(([cle, vus]) => [cle, vus.size]));
  };

  /*  LE CAS : SIX PHOTOS D'UN MÊME CARROUSEL (même tatoueur, même
      style, même catégorie, même rendu) — celui où l'ancien comptage
      et le nouveau ne peuvent PAS être d'accord. Plus deux flashs, pour
      que la seconde catégorie soit éprouvée elle aussi. */
  const photo = (id, style, nature, rendu, slug) => ({
    id,
    url: `/${id}.jpg`,
    miniature: `/${id}.jpg`,
    style,
    rendu,
    nature,
    ordre: Number(id.split("-").pop()),
    tatoueurId: slug,
    tatoueurNom: slug,
    tatoueurSlug: slug,
    ville: "Lyon",
    region: null,
    pays: "France",
    codePays: "FR",
    typeFiche: "artiste",
    etablissement: "",
    photoProfil: null,
  });
  const jeu = [
    ...Array.from({ length: 6 }, (_, i) =>
      photo(`r-${i}`, "realisme", "tatouage", "color", "ana")
    ),
    photo("f-0", "maori", "flash", "black_grey", "ana"),
    photo("f-1", "maori", "flash", "black_grey", "ana"),
  ];

  const ancien = comptageAncien(jeu);
  const nouveau = comptesDesFavoris(jeu);
  const cleTatouage = valeurExplorer("tatouage", "");
  const cleRealisme = valeurExplorer("tatouage", "realisme");
  const cleFlash = valeurExplorer("flash", "");
  const cleMaori = valeurExplorer("flash", "maori");

  verif(
    "« Réalisations » : 1 avant (un ensemble), 6 après (six photos)",
    ancien.get(cleTatouage) === 1 && nouveau.get(cleTatouage) === 6,
    `avant ${ancien.get(cleTatouage)} → après ${nouveau.get(cleTatouage)}`
  );
  verif(
    "« Réalisations · Réalisme » : 1 avant, 6 après",
    ancien.get(cleRealisme) === 1 && nouveau.get(cleRealisme) === 6,
    `avant ${ancien.get(cleRealisme)} → après ${nouveau.get(cleRealisme)}`
  );
  verif(
    "« Flashs » : 1 avant, 2 après — la seconde catégorie suit la même règle",
    ancien.get(cleFlash) === 1 && nouveau.get(cleFlash) === 2,
    `avant ${ancien.get(cleFlash)} → après ${nouveau.get(cleFlash)}`
  );
  verif(
    "« Flashs · Maori » : 1 avant, 2 après",
    ancien.get(cleMaori) === 1 && nouveau.get(cleMaori) === 2,
    `avant ${ancien.get(cleMaori)} → après ${nouveau.get(cleMaori)}`
  );
  verif(
    "les deux clés d'une même photo bougent ENSEMBLE : jamais des photos " +
      "d'un côté et des ensembles de l'autre",
    nouveau.get(cleTatouage) === nouveau.get(cleRealisme) &&
      nouveau.get(cleFlash) === nouveau.get(cleMaori),
    `catégorie ${nouveau.get(cleTatouage)} = couple ${nouveau.get(cleRealisme)}`
  );
  //  DEUX ARTISTES, UN MÊME STYLE : le compte les additionne (ce sont
  //  bien des photos, pas des ensembles ni des artistes).
  const deux = comptesDesFavoris([
    photo("a-0", "realisme", "tatouage", "color", "ana"),
    photo("b-0", "realisme", "tatouage", "color", "bo"),
  ]);
  verif(
    "deux artistes, une photo chacun : le compte fait 2",
    deux.get(cleRealisme) === 2,
    `${deux.get(cleRealisme)}`
  );
  verif(
    "la source ne compte plus d'ensembles : plus de Set, plus de cleDEnsemble",
    /function comptesDesFavoris[\s\S]*?\n}/
      .exec(sansNotes(lire("src/lib/selection-suivis.ts")))[0]
      .includes("cleDEnsemble") === false,
    "comptesDesFavoris n'appelle plus cleDEnsemble"
  );
}

/* ==================================================================
 * §3 — À LA SOURCE : LA GRILLE REMPLACÉE, LE COMPOSANT RÉEMPLOYÉ
 * ================================================================== */
titre("§3 à la source — la grille est remplacée, le composant est réemployé");
{
  verif(
    "la grille de vignettes du doigt (grid-cols-2) a disparu",
    !/grid-cols-2[^"]*lg:hidden|lg:hidden[^"]*grid-cols-2/.test(affiche) &&
      !/grid\s+grid-cols-2/.test(affiche),
    "aucune grille à deux colonnes dans PortfolioDeLAffiche"
  );
  verif(
    "le doigt a désormais son bloc de galeries",
    /data-galeries="doigt"[\s\S]{0,120}lg:hidden/.test(affiche),
    'data-galeries="doigt" … lg:hidden'
  );
  verif(
    "le web garde le sien, inchangé",
    /data-galeries="web"[\s\S]{0,120}hidden lg:block/.test(affiche),
    'data-galeries="web" … hidden lg:block'
  );
  verif(
    "AUCUN second composant : GalerieQuiDefile est importée, jamais redessinée",
    /import \{[\s\S]{0,120}GalerieQuiDefile[\s\S]{0,80}\} from "@\/components\/GalerieQuiDefile"/.test(
      affiche
    ) && (affiche.match(/<GalerieQuiDefile/g) ?? []).length === 2,
    "deux emplois du même composant (doigt + web)"
  );
  verif(
    "les cases sont écrites UNE SEULE FOIS et partagées par les deux blocs",
    /const casesDe = \(/.test(affiche) &&
      (affiche.match(/\{casesDe\(serie, section\.nature\)\}/g) ?? []).length ===
        2 &&
      (affiche.match(/<li\s/g) ?? []).length === 1,
    "un seul <li> dans le fichier, appelé deux fois"
  );
  //  LE DÉBORD DU DOIGT EST CELUI DE « MA SÉLECTION », À LA LETTRE.
  const rangeeSuivis = /classeRangee="([^"]+)"/.exec(suivis)?.[1] ?? "";
  const rangeeDoigt = /classeRangee="([^"]+)"/.exec(affiche)?.[1] ?? "";
  const classes = (t) => t.split(/\s+/).filter(Boolean);
  verif(
    "le débord du doigt est COPIÉ de « Ma sélection » : pas une valeur inventée",
    classes(rangeeSuivis).length > 0 &&
      classes(rangeeSuivis).every((c) => classes(rangeeDoigt).includes(c)),
    `« ${rangeeSuivis} » ⊂ « ${rangeeDoigt} »`
  );
  verif(
    "le seul ajout est le rembourrage de DÉFILEMENT, qui accorde le " +
      "`snap-start` de nos cases au rembourrage du débord",
    classes(rangeeDoigt)
      .filter((c) => !classes(rangeeSuivis).includes(c))
      .join(" ") === "scroll-pl-4 sm:scroll-pl-6",
    classes(rangeeDoigt)
      .filter((c) => !classes(rangeeSuivis).includes(c))
      .join(" ")
  );
  verif(
    "et il ne touche PAS le web : la rangée du web n'a aucun classeRangee",
    !/data-galeries="web"[\s\S]*?classeRangee/.test(affiche),
    "aucun réglage de rangée dans le bloc web"
  );
  verif(
    "les voiles et les décalages ne sont pas repassés : ce sont les défauts " +
      "du composant, ceux de « Ma sélection »",
    !/data-galeries="doigt"[\s\S]*?avecVoiles/.test(
      affiche.split('data-galeries="web"')[0]
    ),
    "aucun avecVoiles / decalage* dans le bloc du doigt"
  );
  verif(
    "§3-e — la photo du haut n'ouvre toujours rien (la règle de la nº 304)",
    !/surToucherDeLaPhoto/.test(fiche),
    "surToucherDeLaPhoto reste supprimée"
  );
  verif(
    "§3-d — la fenêtre s'ouvre sur le rang touché, par le chemin existant",
    /ouvrirLaFenetreCarrousel\(\s*serie\.style,\s*\{ nature: serie\.nature, rendu: serie\.rendu \},\s*serie\.indice \?\? 0,?\s*\)/.test(
      fiche
    ) && /ouvertureSurUnePhoto/.test(lire("src/components/FenetreCarrousel.tsx") + fiche),
    "serie.indice ?? 0, porté par ?photo="
  );
}

/* ==================================================================
 * §3 EN VIVANT, AU DOIGT — 390 × 844
 * ================================================================== */
titre("§3 au doigt (390 × 844) — bord à bord, et l'effacement dans les marges");
const { nav, ctx, page } = await ouvrirLeNavigateur(
  "p314",
  { width: 390, height: 844 },
  { hasTouch: true, isMobile: true, deviceScaleFactor: 3 }
);
/** LE PORTFOLIO EST UN ONGLET DE LA FICHE (nº 197) : au doigt, on
    arrive sur « Style », et c'est ce bouton qui montre les galeries.
    Rien à voir avec la passe — c'est le chemin normal du visiteur. */
async function ouvrirLOngletPortfolio(p) {
  await p.getByRole("radio", { name: "Portfolio" }).click();
  await p.waitForSelector('[data-galeries="doigt"]', { timeout: 20000 });
  await p.waitForTimeout(400);
}

{
  await page.goto(BASE + FICHE, { waitUntil: "networkidle" });
  await ouvrirLOngletPortfolio(page);

  const mesure = await page.evaluate((selecteur) => {
    const bloc = document.querySelector('[data-galeries="doigt"]');
    const serie = bloc.querySelector(selecteur);
    const rangee = serie.querySelector("ul");
    const titre = serie.querySelector("[data-titre-galerie]");
    const cases = [...rangee.querySelectorAll("li")];
    const st = getComputedStyle(rangee);
    const voiles = [...serie.querySelectorAll("div")]
      .filter((n) => getComputedStyle(n).backgroundImage.includes("gradient"))
      .map((n) => {
        const r = n.getBoundingClientRect();
        return { x: Math.round(r.x), largeur: Math.round(r.width) };
      });
    const r = rangee.getBoundingClientRect();
    const t = titre.getBoundingClientRect();
    return {
      ecran: window.innerWidth,
      rangee: [Math.round(r.x), Math.round(r.right)],
      titre: [Math.round(t.x), Math.round(t.right)],
      premiereCase: Math.round(cases[0].getBoundingClientRect().x),
      rembourrage: [st.paddingLeft, st.paddingRight],
      marge: [st.marginLeft, st.marginRight],
      ecart: st.columnGap,
      largeurCase: Number(cases[0].getBoundingClientRect().width.toFixed(2)),
      nbCases: cases.length,
      voiles,
      grilleAncienne: document.querySelectorAll(
        '[data-galeries="doigt"] .grid-cols-2'
      ).length,
    };
  }, sel);

  verif(
    "la rangée va BORD À BORD de l'écran",
    mesure.rangee[0] === 0 && mesure.rangee[1] === mesure.ecran,
    `rangée [${mesure.rangee}] pour un écran de ${mesure.ecran} px`
  );
  verif(
    "le débord vaut la marge de page, des DEUX côtés",
    mesure.marge[0] === "-16px" && mesure.marge[1] === "-16px",
    `marge ${mesure.marge.join(" / ")}`
  );
  verif(
    "il est repris en rembourrage : au repos, la première photo s'aligne " +
      "sur le titre",
    mesure.rembourrage[0] === "16px" &&
      mesure.rembourrage[1] === "16px" &&
      mesure.premiereCase === mesure.titre[0],
    `rembourrage ${mesure.rembourrage.join(" / ")} — ` +
      `première case à ${mesure.premiereCase}, titre à ${mesure.titre[0]}`
  );
  //  ⚠️ AU REPOS, IL N'Y EN A QU'UNE — celle de DROITE. C'est le
  //  comportement de « Ma sélection », et il est juste : à gauche, rien
  //  n'a encore défilé sous la marge, donc il n'y a rien à effacer
  //  (`etat.gauche` de GalerieQuiDefile). La seconde apparaît dès qu'on
  //  pousse la rangée — c'est vérifié quelques lignes plus bas.
  verif(
    "au repos, UNE bande d'effacement à droite, à la largeur de la marge",
    mesure.voiles.length === 1 &&
      mesure.voiles[0].largeur === 16 &&
      mesure.voiles[0].x === mesure.ecran - 16,
    mesure.voiles.map((v) => `${v.largeur} px @ ${v.x}`).join(" · ")
  );
  verif(
    "l'écart entre photos est celui du web — le portfolio se lit pareil",
    mesure.ecart === "3px",
    mesure.ecart
  );
  verif(
    "toutes les photos de la série sont là (une galerie, plus une vignette)",
    mesure.nbCases >= 3,
    `${mesure.nbCases} cases de ${mesure.largeurCase} px`
  );
  verif(
    "l'ancienne grille à deux colonnes n'est plus rendue",
    mesure.grilleAncienne === 0,
    "0"
  );

  /* --------------------------------------------------------------
   * L'EFFACEMENT, DÉCODÉ AU PIXEL — pas « il y a un dégradé », mais
   * la valeur peinte de la marge gauche, de son bord vers l'intérieur.
   * -------------------------------------------------------------- */
  //  On amène la rangée SOUS LES YEUX (elle est loin dans la page),
  //  puis on la pousse pour qu'une PHOTO occupe toute la marge : au
  //  repos, le rembourrage l'en tient à l'écart — il n'y aurait rien
  //  à effacer.
  await page
    .locator(`[data-galeries="doigt"] ${sel} ul`)
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  /*  ⚠️ ET ON PLACE LA SCÈNE (la leçon de la nº 310). Une photo n'est
      pas une couleur : lue au milieu, sa peinture monte et descend
      toute seule, et l'on ne saurait plus dire ce qui vient du fondu.
      On repeint donc les cases d'un MAGENTA plein — une teinte qui
      n'existe nulle part dans la charte — pour que TOUT écart lu dans
      la marge vienne du fondu, et de lui seul. On ne touche ni au
      fondu, ni à la géométrie : seulement au sujet photographié. */
  const MAGENTA = "#FF00FF";
  await page.evaluate(
    ({ selecteur, magenta }) => {
      const rangee = document
        .querySelector('[data-galeries="doigt"]')
        .querySelector(`${selecteur} ul`);
      rangee.style.scrollSnapType = "none";
      rangee.scrollLeft = 80;
      for (const noeud of rangee.querySelectorAll("li, li span")) {
        noeud.style.background = magenta;
      }
      for (const img of rangee.querySelectorAll("img")) {
        img.style.visibility = "hidden";
      }
    },
    { selecteur: sel, magenta: MAGENTA }
  );
  await page.waitForTimeout(250);

  const voilesPoussee = await page.evaluate((selecteur) => {
    const serie = document
      .querySelector('[data-galeries="doigt"]')
      .querySelector(selecteur);
    return [...serie.querySelectorAll("div")].filter((n) =>
      getComputedStyle(n).backgroundImage.includes("gradient")
    ).length;
  }, sel);
  verif(
    "poussée, la rangée montre SES DEUX bandes — une par marge",
    voilesPoussee === 2,
    `${voilesPoussee} bandes après un défilement de 80 px`
  );

  /*  ⚠️ ON CAPTURE L'ÉLÉMENT, PAS UNE DÉCOUPE DE PAGE. Un `clip` se
      compte dans le DOCUMENT, et cette rangée est à 1 400 px du haut :
      la découpe tombait hors de ce qui est affiché. La capture d'un
      élément, elle, cadre toute seule — et elle prend bien ce qui est
      PEINT par-dessus lui, donc les fondus. */
  const png = await page
    .locator(`[data-galeries="doigt"] ${sel} ul`)
    .screenshot();
  const pix = lirePixels(png);
  //  densité 3 : une colonne CSS = trois colonnes de pixels.
  const colonne = (xCss) => {
    const p = pix.pixel(
      Math.min(Math.round(xCss * 3), pix.largeur - 1),
      Math.round(pix.hauteur / 2)
    );
    return { r: p[0], v: p[1], b: p[2] };
  };
  const releve = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18].map((x) => ({
    x,
    ...colonne(x),
  }));
  const dedans = releve.slice(0, 9); //  0 → 16 px : la marge elle-même
  //  LE MAGENTA MONTE ET LE FOND DESCEND : le vert est nul dans le
  //  sujet et vaut 26 dans l'anthracite — c'est donc le ROUGE, seul,
  //  qui dit combien de photo passe (0 % au bord, 100 % à 16 px).
  const croissant = dedans.every((c, i, t) => i === 0 || c.r >= t[i - 1].r);
  const paliers = new Set(dedans.map((c) => c.r)).size;
  verif(
    "l'effacement est PROGRESSIF dans la marge : le sujet monte pas à pas, " +
      "du bord vers l'intérieur, sans palier",
    croissant && paliers === dedans.length,
    dedans.map((c) => `${c.x}px:${c.r},${c.v},${c.b}`).join("  ")
  );
  /*  LE FONDU VA DE `from-sombre-fond/90` À `to-sombre-fond/0` : au
      bord, il reste donc 10 % du sujet — c'est le maximum d'effacement
      que le dessin partagé prévoit, celui de « Ma sélection ». On lit
      donc 0,9 × #1A1A1D + 0,1 × magenta ≈ (49, 23, 51). */
  const attendu = { r: 49, v: 23, b: 51 };
  verif(
    "au bord de l'écran, l'effacement est à son maximum : 90 % d'anthracite",
    Math.abs(releve[0].r - attendu.r) <= 8 &&
      Math.abs(releve[0].v - attendu.v) <= 8 &&
      Math.abs(releve[0].b - attendu.b) <= 8,
    `0 px → ${releve[0].r},${releve[0].v},${releve[0].b} ` +
      `(attendu ≈ ${attendu.r},${attendu.v},${attendu.b})`
  );
  verif(
    "au bout de la marge (16 px), l'effacement est fini : le sujet est plein",
    releve[8].r >= 250 && releve[8].v <= 12 && releve[8].b >= 250,
    `16 px → ${releve[8].r},${releve[8].v},${releve[8].b} (magenta plein)`
  );
  verif(
    "et au-delà, plus rien n'efface",
    releve[9].r >= 250 && releve[9].b >= 250,
    `18 px → ${releve[9].r},${releve[9].v},${releve[9].b}`
  );
}

/* ==================================================================
 * §3-d ET §3-e EN VIVANT
 * ================================================================== */
titre("§3-d et §3-e au doigt — on ouvre sur la photo touchée, et pas ailleurs");
{
  await page.goto(BASE + FICHE, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-photo-fiche]", { timeout: 20000 });

  //  §3-e D'ABORD, SUR L'ONGLET D'ARRIVÉE : la photo du haut. Il ne
  //  doit RIEN se passer — donc rien à refermer avant la suite.
  const avantHaut = page.url();
  await page.locator("[data-photo-fiche] img").first().click({ force: true });
  await page.waitForTimeout(400);
  verif(
    "§3-e — toucher la photo du haut ne change pas l'adresse",
    page.url() === avantHaut,
    "adresse inchangée"
  );
  verif(
    "§3-e — et n'ouvre aucune fenêtre de carrousel",
    (await page.locator("[data-fenetre-carrousel]").count()) === 0,
    "aucune fenêtre"
  );

  //  §3-d : LA QUATRIÈME PHOTO DE LA SÉRIE, dans l'onglet Portfolio.
  await ouvrirLOngletPortfolio(page);
  await page
    .locator(`[data-galeries="doigt"] ${sel} li[data-case-galerie="3"] button`)
    .click({ force: true });
  await page.waitForSelector("[data-fenetre-carrousel]", { timeout: 10000 });
  const ouverture = await page.evaluate(() => ({
    adresse: window.location.pathname + window.location.search,
    compteur:
      document
        .querySelector('[data-role="compteur-fenetre"]')
        ?.textContent?.trim() ?? "",
  }));
  verif(
    "§3-d — l'adresse porte le rang de la photo touchée",
    /[?&]photo=3(\b|&)/.test(ouverture.adresse),
    ouverture.adresse
  );
  verif(
    "§3-d — et la fenêtre s'ouvre DESSUS : son compteur dit « 4/… »",
    /^4\s*\/\s*\d+$/.test(ouverture.compteur),
    `compteur « ${ouverture.compteur} »`
  );
  verif(
    "§3-d — aucun second mécanisme : c'est le ?photo= de la nº 302",
    /photo=/.test(ouverture.adresse) && /ouvertureSurUnePhoto/.test(fiche),
    "?photo=, lu par ouvertureSurUnePhoto"
  );
}
await ctx.close();
await nav.close();

/* ==================================================================
 * §3-f — LE WEB N'A PAS BOUGÉ (1440 × 823)
 * ================================================================== */
titre("§3-f en web (1440 × 823) — mesuré, rien n'a changé");
{
  const w = await ouvrirLeNavigateur("p314w", { width: 1440, height: 823 });
  await w.page.goto(BASE + FICHE, { waitUntil: "networkidle" });
  await w.page.getByRole("radio", { name: "Portfolio" }).click();
  await w.page.waitForSelector('[data-galeries="web"]', { timeout: 20000 });
  await w.page.waitForTimeout(400);

  const web = await w.page.evaluate((selecteur) => {
    const bloc = document.querySelector('[data-galeries="web"]');
    const serie = bloc.querySelector(selecteur);
    const rangee = serie.querySelector("ul");
    const titre = serie.querySelector("[data-titre-galerie]");
    const cases = [...rangee.querySelectorAll("li")];
    const st = getComputedStyle(rangee);
    const r = rangee.getBoundingClientRect();
    const t = titre.getBoundingClientRect();
    const troisieme = cases[2]?.getBoundingClientRect();
    return {
      rangee: [Math.round(r.x), Math.round(r.right)],
      titre: [Math.round(t.x), Math.round(t.right)],
      rembourrage: [st.paddingLeft, st.paddingRight],
      marge: [st.marginLeft, st.marginRight],
      masque: st.maskImage,
      voiles: [...serie.querySelectorAll("div")].filter((n) =>
        getComputedStyle(n).backgroundImage.includes("gradient")
      ).length,
      ecart: st.columnGap,
      largeurCase: Number(cases[0].getBoundingClientRect().width.toFixed(2)),
      partVisible3e: troisieme
        ? Math.round(((r.right - troisieme.x) / troisieme.width) * 100)
        : -1,
    };
  }, sel);

  verif(
    "§3-f — la galerie du web reste dans sa colonne : rangée = titre, au pixel",
    web.rangee[0] === web.titre[0] && web.rangee[1] === web.titre[1],
    `rangée [${web.rangee}] = titre [${web.titre}]`
  );
  verif(
    "§3-f — aucun débord, aucun rembourrage (la nº 312-§1 tient)",
    web.marge.join("/") === "0px/0px" &&
      web.rembourrage.join("/") === "0px/0px",
    `marge ${web.marge.join(" / ")} · rembourrage ${web.rembourrage.join(" / ")}`
  );
  verif(
    "§3-f — aucune bande d'effacement en web, et aucun masque",
    web.voiles === 0 && web.masque === "none",
    `${web.voiles} voile(s), masque « ${web.masque} »`
  );
  verif(
    "§3-f — l'écart et la largeur de case sont ceux d'avant la passe",
    web.ecart === "3px" && web.largeurCase > 150 && web.largeurCase < 170,
    `écart ${web.ecart}, case ${web.largeurCase} px`
  );
  verif(
    "§3-f — la règle des 10 % de la troisième photo est intacte",
    web.partVisible3e >= 8 && web.partVisible3e <= 12,
    `${web.partVisible3e} % de la troisième visible`
  );
  await w.ctx.close();
  await w.nav.close();
}

/* ==================================================================
 * §4 — LE MESSAGE DE BIENVENUE, SUPPRIMÉ CODE COMPRIS
 * ================================================================== */
titre("§4 — plus une ligne de code ne parle de bienvenue");
{
  verif(
    "le formulaire de fiche n'a plus ni l'état, ni l'écouteur, ni la fenêtre",
    !/fenetreRetour/.test(formulaire) && !/bienvenue/.test(formulaire),
    "FormulaireFiche : aucune trace"
  );
  verif(
    "la route de rappel ne pose plus le paramètre",
    !/bienvenue/.test(rappel) && /redirect\(`\$\{origin\}\$\{suite\}`\)/.test(rappel),
    "auth/callback redirige vers ${suite}, nu"
  );
  verif(
    "l'écran d'authentification ne le pose plus non plus",
    !/bienvenue/.test(ecran) && !/rétabli/.test(ecran),
    "EcranAuthentification : router.push(arrivee)"
  );
  verif(
    "la page d'arrivée ne le fait plus suivre : elle n'a plus de searchParams",
    !/bienvenue/.test(arrivee) && !/searchParams/.test(arrivee),
    "PageApresConnexion() sans argument"
  );
  verif(
    "la configuration n'en parle plus",
    !/bienvenue/.test(config),
    "config/tatouage.ts : aucune trace"
  );
  verif(
    "LA RÉACTIVATION, ELLE, EST INTACTE — c'est la promesse faite au " +
      "moment de la demande de suppression",
    /reactiverCompte\(user\.id\)/.test(rappel) &&
      /\/api\/tatoueur\/reactiver/.test(ecran),
    "deux chemins de réactivation conservés"
  );
  //  ET NULLE PART AILLEURS DANS LE PRODUIT.
  const restes = [
    "src/components/PageFavoris.tsx",
    "src/components/FicheTatoueur.tsx",
    "src/components/PortfolioDeLAffiche.tsx",
  ].filter((f) => /bienvenue/.test(sansNotes(lire(f))));
  verif(
    "aucun reste dans les fichiers touchés par la passe",
    restes.length === 0,
    restes.join(", ") || "aucun"
  );
}

nonJoue(
  "§1 EN VIVANT SUR /mes-favoris",
  "la page exige une session Supabase signée par le serveur : sans elle " +
    "elle répond 307 vers la connexion, et le cookie fabriqué du socle ne " +
    "franchit pas `auth.getUser()`. Ce qui est prouvé ici à la place : LE " +
    "MÉCANISME LUI-MÊME — `lireSelection` exécutée sur l'adresse d'avant " +
    "(sans requête → onglet Favoris) et sur celle d'après (avec requête → " +
    "onglet Portfolios), plus l'écriture corrigée dans la source. Je n'ai " +
    "pas pu ouvrir une fiche depuis mes propres favoris"
);

nonJoue(
  "§2 EN VIVANT DANS LE MENU DÉROULANT",
  "le menu vit sur /mes-favoris, derrière la même session. Le compte est " +
    "calculé par une fonction pure : elle est EXÉCUTÉE ici sur un jeu où " +
    "l'ancien comptage et le nouveau diffèrent (1 contre 6), ce qui donne " +
    "le nombre avant et après sans ouvrir la page"
);

process.exit(bilan());
