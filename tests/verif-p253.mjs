/**
 * BANC DE LA PASSE Nº 253
 * ==================================================================
 * §1 la barre du smartphone est rétablie (rangée, rétractation, ligne
 *    étroite, réserve à trois hauteurs) — les deux TITRES y remplacent
 *    les menus déroulants ; sur le web, l'encadré reste et les titres
 *    de la page sont des mots nus ;
 * §2 dans la feuille, les portes « Réalisations » / « Flashs »
 *    s'ouvrent, puis la sous-porte « Cultures du monde » — la cause
 *    est nommée (la fermeture au clic dehors ne connaissait pas la
 *    feuille montée en portail) ;
 * §3 « Mes j'aime » n'existe plus nulle part ;
 * §4 défilement par PAGE (une largeur visible exactement), indicateur
 *    de pages en haut à droite (recalculé à la taille), commandes au
 *    survol seulement, rien au doigt, scrollWidth === clientWidth.
 *
 * ⚠️ « Ma sélection » exige une session (base hors de portée) : la
 * feuille est éprouvée VIVANTE sur le champ « Métier » (le MÊME
 * composant, avec le correctif), la rangée et la mécanique sur
 * l'accueil, le reste par injection des classes réelles et par les
 * prédicats extraits du fichier livré. Dit en NON JOUÉ.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : ce banc ne dit rien de Safari.
 */
import { execFileSync } from "node:child_process";
import {
  BASE,
  bilan,
  chromium,
  lire,
  nonJoue,
  titre,
  verif,
} from "./commun-verif.mjs";

const ouvrirA = async (largeur, chemin = "/", options = {}) => {
  const mobile = options.mobile ?? largeur < 1024;
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({
    viewport: { width: largeur, height: mobile ? 844 : 950 },
    ...(mobile ? { isMobile: true, hasTouch: true } : {}),
  });
  const page = await contexte.newPage();
  await page.goto(`${BASE}${chemin}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2000);
  return { contexte, page };
};

const nettoyer = (t) => (t ?? "").replace(/\s+/g, " ").trim();

/* ==================================================================
 * §1 — LA BARRE DU SMARTPHONE, RÉTABLIE
 * ================================================================== */
titre("§1 — à la source : la rangée revient, les titres y commandent");
{
  const menus = lire("src/components/MenusSelection.tsx");
  const barre = lire("src/components/EnTeteTatouage.tsx");
  const barreSel = lire("src/components/BarreSelection.tsx");
  const favoris = lire("src/components/PageFavoris.tsx");
  verif(
    "le `rangeeWeb` de la nº 251 est défait — la rangée existe aux deux largeurs",
    !/rangeeWeb\??:/.test(barre) &&
      !/rangeeWeb$/m.test(barreSel) &&
      /const rangeePresente = surAccueil \|\| rangeeLibre;/.test(barre)
  );
  verif(
    "la réserve retrouve ses trois hauteurs (128 / 104 / 64)",
    /rangeePresente && !moteurReplie \? 128 : rangeeLibre \? 104 : 64/.test(
      barre
    ) && /rangeeLibre\s*\n?\s*\? "h-\[104px\]"/.test(barre)
  );
  //  ⚠️ MIS À JOUR nº 255-§1/§5 : les deux titres cliquables du doigt
  //  et les deux menus du web sont partis ENSEMBLE — le bloc porte
  //  désormais UN BADGE et UN SEUL menu, la même ligne aux deux
  //  largeurs. Ce que CETTE passe a rétabli — la rangée EXISTE au
  //  doigt, avec sa rétractation — se lit toujours, et c'est ce qu'on
  //  vérifie ici (le contenu de la rangée, lui, appartient à la 255).
  verif(
    "la rangée existe aux deux largeurs, sans contenu par point de rupture",
    !/hidden lg:block/.test(menus) &&
      !/className="lg:hidden"/.test(menus) &&
      /<EncadreDeuxChamps/.test(menus)
  );
  verif(
    "son menu est LE menu de la maison, avec feuille et `repliable`",
    /feuilleMobile$/m.test(menus.replace(/\s+$/gm, "")) &&
      (menus.match(/^\s*repliable$/gm) ?? []).length === 1
  );
  verif(
    "la ligne étroite et ses jetons restent écrits (28 px, flèche, 300 ms)",
    /data-ligne-repliee/.test(menus) &&
      /min-h-\[28px\]/.test(menus) &&
      /IconeChevronBas taille=\{14\}/.test(menus) &&
      /duration-300 ease-out/.test(menus)
  );
  verif(
    "les titres de la PAGE sont des mots nus, l'inactif web seulement",
    /function titreControle\(nom: string\)/.test(favoris) &&
      !/<MenuDeroulant/.test(favoris) &&
      /data-titre-inactif="" className="hidden lg:block"/.test(favoris)
  );
}

titre("§1 — la rangée VIVANTE (l'accueil, 390 px) : la mécanique partagée");
{
  const { contexte, page } = await ouvrirA(390, "/");
  try {
    const reserve = () =>
      page.evaluate(() =>
        Number(
          document
            .querySelector("[data-reserve-barre]")
            ?.getAttribute("data-reserve-posee")
        )
      );
    const haut = await reserve();
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(600);
    const descendu = await reserve();
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(600);
    const remonte = await reserve();
    verif(
      "elle se rétracte et se redéploie (les réglages de juillet)",
      haut === 128 && descendu === 64 && remonte === 128,
      `${haut} → ${descendu} → ${remonte}`
    );
  } catch (erreur) {
    nonJoue("§1 · vivant", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §2 — LES PORTES DE LA FEUILLE
 * ================================================================== */
titre("§2 — la cause, nommée à la source");
{
  const menu = lire("src/components/MenuDeroulant.tsx");
  verif(
    "la fermeture au clic dehors connaît DÉSORMAIS la feuille (le portail)",
    /if \(feuille\.current\?\.contains\(cible\)\) return;/.test(menu) &&
      /const feuille = useRef<HTMLDivElement>\(null\);/.test(menu) &&
      /ref=\{feuille\}/.test(menu)
  );
}

titre("§2 — la feuille VIVANTE (le même composant, 390 px) : les niveaux");
{
  //  Le champ « Métier » (recherche artisans) est le SEUL consommateur
  //  de la feuille ouvrable sans session — même composant, même
  //  portail, même fermeture au clic dehors : si un appui intérieur ne
  //  ferme plus la feuille ici, il ne la ferme plus nulle part.
  //  (Ses options n'ont pas de portes ; les portes, elles, sont
  //  éprouvées sur le menu Explorer au §2 suivant.)
  const { contexte, page } = await ouvrirA(390, "/artisans");
  try {
    await page.locator('button[aria-haspopup="listbox"]').first().click();
    await page.waitForTimeout(700);
    const feuille = page.locator('[role="listbox"]:visible').last();
    const avant = await feuille.count();
    //  UN APPUI À L'INTÉRIEUR (sur la zone de la liste, pas une
    //  option) : la feuille doit RESTER — c'était la cause du défaut.
    await feuille.click({ position: { x: 10, y: 8 } });
    await page.waitForTimeout(400);
    const apres = await page.locator('[role="listbox"]:visible').count();
    verif(
      "un appui À L'INTÉRIEUR de la feuille ne la ferme plus",
      avant === 1 && apres >= 1,
      `feuille ${avant} → ${apres}`
    );
  } catch (erreur) {
    nonJoue("§2 · feuille vivante", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

titre("§2 — les portes, VIVANTES (le menu partagé : catégorie, puis famille)");
{
  //  Le menu « Explorer » de la page de recherche mobile est LE MÊME
  //  MenuDeroulant, `repliable`, SANS feuille (il n'en passe pas le
  //  drapeau) : les portes y jouent la même mécanique d'état. La
  //  feuille des titres n'ajoute que l'habillage — et son défaut à
  //  elle (la fermeture au clic dehors) est corrigé et mesuré
  //  ci-dessus. Les DEUX niveaux, l'un puis l'autre :
  const { contexte, page } = await ouvrirA(
    390,
    "/tatoueur/atelier-corvus-lyon-1er"
  );
  try {
    await page.locator('button[aria-label="Rechercher"]').first().click();
    await page.waitForTimeout(1200);
    await page.locator('button[aria-label="Explorer"]').first().click();
    await page.waitForTimeout(700);
    //  Niveau 1 : la porte de catégorie.
    const optionsFermees = await page.locator('[role="option"]:visible').count();
    await page.locator('button:has-text("Réalisations")').first().click();
    await page.waitForTimeout(500);
    const optionsOuvertes = await page.locator('[role="option"]:visible').count();
    //  Niveau 2 : la sous-porte de famille.
    const porte = page.locator('[data-sous-porte="Cultures du monde"]').first();
    const portePresente = (await porte.count()) > 0;
    if (portePresente) await porte.click();
    await page.waitForTimeout(500);
    const optionsFamille = await page.locator('[role="option"]:visible').count();
    verif(
      "la porte « Réalisations » s'ouvre (niveau 1)",
      optionsOuvertes > optionsFermees,
      `${optionsFermees} → ${optionsOuvertes} entrées`
    );
    verif(
      "puis « Cultures du monde » s'ouvre DANS la catégorie (niveau 2)",
      portePresente && optionsFamille > optionsOuvertes,
      `porte ${portePresente ? "présente" : "ABSENTE"} · ${optionsOuvertes} → ${optionsFamille}`
    );
  } catch (erreur) {
    nonJoue("§2 · portes vivantes", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §3 — LE RENOMMAGE
 * ================================================================== */
titre("§3 — « Mes j'aime » n'existe plus nulle part");
{
  //  ⚠️ CE BANC-CI nomme l'ancien mot pour dire qu'il est parti : il
  //  s'exclut du balayage — tout le reste du dépôt est couvert.
  let restes = "";
  try {
    restes = execFileSync(
      "grep",
      [
        "-rl", "--exclude=verif-p253.mjs",
        "-e", "jaime", "-e", "j'aime", "-e", "Jaime",
        "src/", "tests/", "supabase/",
      ],
      { cwd: process.cwd(), encoding: "utf8" }
    );
  } catch {
    restes = "";
  }
  verif(
    "le dépôt ne porte plus le mot, dans aucune écriture",
    restes.trim() === "",
    restes.trim() ? restes.trim().split("\n").join(" · ") : "aucun fichier"
  );
  //  ⚠️ MIS À JOUR nº 255-§1 : le mot de la BARRE est passé de « Mes
  //  favoris » (le menu d'alors) à « Favoris » (le mot du badge, qui
  //  partage sa moitié avec « Suivis »). La règle de CETTE passe — un
  //  seul nom, « favoris », de la clé d'adresse au titre de la page —
  //  ne bouge pas : c'est elle qu'on vérifie.
  verif(
    "et « favoris » est le nom UNIQUE (clé d'adresse, badge de barre, titre de page)",
    /MENU_FAVORIS = "favoris"/.test(lire("src/lib/filtres-selection.ts")) &&
      /label: "Favoris"/.test(lire("src/components/MenusSelection.tsx")) &&
      /"Mes favoris"/.test(lire("src/components/PageFavoris.tsx"))
  );
}

/* ==================================================================
 * §4 — LE DÉFILEMENT PAR PAGE, ET L'INDICATEUR
 * ================================================================== */
const source = lire("src/components/BlocSuivis.tsx");
titre("§4 — à la source : la page entière, l'indicateur, le survol");
{
  verif(
    "un appui VISE une frontière de page (défilement natif, aucune translation)",
    /Math\.max\(0, etat\.page \+ sens\) \* cadre\.clientWidth/.test(source) &&
      /cadre\.scrollTo\(\{ left: cible, behavior: "smooth" \}\)/.test(source) &&
      !/transform|translate/.test(
        source.slice(source.indexOf("const defiler"), source.indexOf("};", source.indexOf("const defiler")))
      )
  );
  verif(
    "le nombre de pages : vignettes ÷ visibles, lu dans le DOM, recalculé à la taille",
    /Math\.ceil\(total \/ visibles\)/.test(source) &&
      /Math\.round\(cadre\.clientWidth \/ pas\)/.test(source) &&
      /new ResizeObserver\(lire\)/.test(source)
  );
  verif(
    "les commandes n'apparaissent QU'AU SURVOL — par la visibilité, jamais l'opacité",
    /invisible group-hover:visible/.test(source) &&
      //  ⚠️ MIS À JOUR nº 254-§2 : l'enveloppe a gagné `lg:mt-5`
      //  (20 px identité → bande sur le web) — la règle « au survol
      //  seulement », elle, n'a pas bougé.
      /className="group relative mt-2 lg:mt-5"/.test(source) &&
      !/opacity/.test(
        nettoyer(source.match(/className=\{`(hidden pointer-fine:flex[^`]*)`\}/)?.[1] ?? "")
      )
  );
  verif(
    "l'indicateur : absolu dans l'angle, dès deux pages (tirets depuis la nº 254-§5)",
    /etat\.pages > 1 && \(/.test(source) &&
      /data-indicateur-pages=\{etat\.pages\}/.test(source) &&
      /absolute top-3 right-3/.test(source) &&
      //  ⚠️ MIS À JOUR nº 254-§5 : les ronds 6 px (h-1.5 w-1.5) sont
      //  devenus des tirets 16 × 2 px. La place, l'apparition dès deux
      //  pages et l'absolu — ce que CETTE passe a posé — demeurent.
      /h-0\.5 w-4 rounded-full/.test(source)
  );
}

titre("§4 — mesuré sur la rangée injectée (les classes réelles, 390 et 1440)");
for (const largeur of [390, 1440]) {
  const { contexte, page } = await ouvrirA(largeur, "/", { mobile: false });
  try {
    const classeCase = nettoyer(
      (source.match(/const CASE_RANGEE =\s*((?:"[^"]*"\s*\+?\s*)+);/)?.[1] ?? "")
        .replace(/["+]/g, " ")
    );
    const vu = await page.evaluate(
      `(async (c) => {
        const hote = document.createElement("div");
        const l = Math.min(document.documentElement.clientWidth, ${largeur}) - 32;
        hote.style.cssText = "position:relative;width:" + l + "px;";
        hote.innerHTML = '<ul data-r class="' + c.rangee + '">' +
          Array.from({ length: 24 })
            .map(() => '<li class="' + c.case + '"><a class="block aspect-4/5 rounded-none bg-sombre-eleve"></a></li>')
            .join("") + '</ul>';
        document.body.appendChild(hote);
        const u = hote.querySelector("[data-r]");
        //  LE PAS D'UNE PAGE — exactement la largeur visible : on VISE
        //  la frontière 1 × clientWidth, comme le fait \`defiler\`.
        const largeurVisible = u.clientWidth;
        u.scrollTo({ left: largeurVisible, behavior: "instant" });
        await new Promise((f) => setTimeout(f, 450));
        const position = u.scrollLeft;
        //  LE NOMBRE DE PAGES, comme \`lire\` le calcule : visibles lus
        //  dans le DOM (pas d'une case), total ÷ visibles.
        const premiere = u.firstElementChild.getBoundingClientRect();
        const seconde = u.children[1].getBoundingClientRect();
        const pas = seconde.left - premiere.left;
        const visibles = Math.max(1, Math.round(u.clientWidth / pas));
        const pages = Math.max(1, Math.ceil(u.children.length / visibles));
        const debordement =
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth;
        hote.remove();
        return { largeurVisible, position, visibles, pages, debordement, pas };
      })(${JSON.stringify({
        rangee: nettoyer(source.match(/className="(flex gap-1\.5 overflow-x-auto[^"]*)"/)?.[1]),
        case: classeCase,
      })})`
    );
    const attendu = largeur === 390 ? Math.ceil(24 / 3) : Math.ceil(24 / 6);
    //  ⚠️ L'ACCROCHAGE AJUSTE L'ATTERRISSAGE : on vise la frontière de
    //  page, et `snap-center` cale ensuite sur la case la plus proche
    //  — au plus une demi-case d'écart. C'est le comportement DEMANDÉ
    //  (« en réutilisant l'accrochage déjà en place ») : la tolérance
    //  est donc une demi-case, et la preuve du « par page » est que le
    //  déplacement vaut PLUSIEURS cases, jamais une seule.
    verif(
      `${largeur} px : un appui déplace d'une largeur visible (à l'accrochage près)`,
      Math.abs(vu.position - vu.largeurVisible) <= vu.pas / 2 + 2 &&
        vu.position > vu.pas * 1.5,
      `${vu.position} px pour ${vu.largeurVisible} px visibles (case ${Math.round(vu.pas)} px)`
    );
    verif(
      `${largeur} px : ${attendu} page(s) pour 24 vignettes (${vu.visibles} visibles)`,
      vu.pages === attendu,
      `${vu.pages} page(s)`
    );
    verif(
      `${largeur} px : le débordement vit DANS la rangée (piège nº 228)`,
      vu.debordement === 0,
      `scrollWidth − clientWidth = ${vu.debordement}`
    );
  } catch (erreur) {
    nonJoue(`§4 (${largeur} px)`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

titre("§4 — le survol, mesuré (1440 px) ; le doigt (390 px)");
{
  const { contexte, page } = await ouvrirA(1440, "/", { mobile: false });
  try {
    //  ⚠️ MIS À JOUR nº 254-§4 : l'interpolation du bouton rond porte
    //  aussi les demi-marges (`"right-0 -mr-5" : "left-0 -ml-5"`) — la
    //  retirer TOUTE, sinon ses guillemets casseraient l'attribut.
    const classeBandeau = nettoyer(
      source.match(/className=\{`(hidden pointer-fine:flex[^`]*)`\}/)?.[1] ?? ""
    ).replace(/\$\{\s*sens === 1 \? "[^"]*" : "[^"]*"\s*\}/, "");
    const vu = await page.evaluate(
      `(async (classes) => {
        const hote = document.createElement("div");
        //  ⚠️ FIXE ET DANS LA FENÊTRE : ajouté au fil du corps, l'hôte
        //  atterrissait SOUS la page (y ≈ 4000) — la souris ne peut pas
        //  survoler hors de l'écran, et la mesure disait « hidden ».
        hote.style.cssText = "position:fixed;top:120px;left:120px;width:800px;height:200px;z-index:9999";
        hote.innerHTML = '<div class="group relative mt-2" data-enveloppe style="height:160px">' +
          '<button data-b data-verre-fenetre="" class="' + classes + ' right-0"></button></div>';
        document.body.appendChild(hote);
        const bouton = hote.querySelector("[data-b]");
        const auRepos = getComputedStyle(bouton).visibility;
        //  Le survol : la classe group-hover, jouée par un vrai survol.
        const enveloppe = hote.querySelector("[data-enveloppe]").getBoundingClientRect();
        const mesure = { auRepos, boite: { x: enveloppe.left + 60, y: enveloppe.top + 60 } };
        window.__mesure = { bouton, hote };
        return mesure;
      })(${JSON.stringify(classeBandeau)})`
    );
    verif(
      "au repos, la commande est invisible (et absolue : rien à déplacer)",
      vu.auRepos === "hidden",
      `visibility ${vu.auRepos}`
    );
    await page.mouse.move(vu.boite.x, vu.boite.y);
    await page.waitForTimeout(250);
    const auSurvol = await page.evaluate(
      () => getComputedStyle(window.__mesure.bouton).visibility
    );
    await page.evaluate(() => window.__mesure.hote.remove());
    verif(
      "au survol de la rangée, elle apparaît (visibility, pas un fondu)",
      auSurvol === "visible",
      `visibility ${auSurvol}`
    );
  } catch (erreur) {
    nonJoue("§4 · survol", String(erreur).slice(0, 70));
  }
  await contexte.close();
}
{
  const { contexte, page } = await ouvrirA(390, "/");
  try {
    //  ⚠️ MIS À JOUR nº 254-§4 : même retrait de l'interpolation
    //  entière (voir le survol ci-dessus).
    const classeBandeau = nettoyer(
      source.match(/className=\{`(hidden pointer-fine:flex[^`]*)`\}/)?.[1] ?? ""
    ).replace(/\$\{\s*sens === 1 \? "[^"]*" : "[^"]*"\s*\}/, "");
    const affichage = await page.evaluate(
      `((classes) => {
        const hote = document.createElement("div");
        hote.innerHTML = '<div class="group relative"><button data-b class="' + classes + ' right-0"></button></div>';
        document.body.appendChild(hote);
        const vu = getComputedStyle(hote.querySelector("[data-b]")).display;
        hote.remove();
        return vu;
      })(${JSON.stringify(classeBandeau)})`
    );
    verif(
      "au doigt, la commande n'existe pas du tout (display none)",
      affichage === "none",
      `display ${affichage}`
    );
  } catch (erreur) {
    nonJoue("§4 · doigt", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

nonJoue(
  "« Ma sélection » vivante",
  "la page exige une session (base hors de portée) : la feuille et ses " +
    "portes sont éprouvées sur le MÊME composant ouvrable sans session, " +
    "la mécanique de la barre sur l'accueil, et la rangée par injection " +
    "des classes réelles"
);

process.exit(bilan());
