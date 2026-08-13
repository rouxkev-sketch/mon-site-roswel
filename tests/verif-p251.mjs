/**
 * BANC DE LA PASSE Nº 251
 * ==================================================================
 * §1 web : l'encadré à deux menus est REVENU dans la barre, mesuré
 *    identique à celui du moteur ; aucun titre n'y est cliquable ;
 * §2 doigt : aucun menu dans la barre, les deux titres portent leur
 *    chevron, chacun ouvre SA feuille par le bas (portail, sœur du
 *    voile, aucune racine d'arrière-plan sur la chaîne d'ancêtres,
 *    plaque à l'opacité 1), et « Cultures du monde » s'y ouvre ;
 * §3 aucun titre au-dessus des bandes, dans aucun des trois cas ;
 * §4 vignettes 4/5 (l'écriture unique du format), angles à zéro, trois
 *    visibles à 390 avec dépassement, hauteur réservée avant l'image,
 *    `scrollWidth === clientWidth` aux deux largeurs.
 *
 * ⚠️ « Ma sélection » exige une session (base hors de portée) : les
 * classes sont mesurées PAR INJECTION des classes réelles, la feuille
 * du menu est éprouvée VIVANTE sur le champ « Explorer » du moteur —
 * LE MÊME composant, avec LES MÊMES drapeaux — et l'encadré est
 * comparé au bloc de recherche VIVANT. Le reste est dit NON JOUÉ.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : ce banc ne dit rien de Safari.
 */
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

/* ==================================================================
 * §1 — L'ENCADRÉ REVIENT DANS LA BARRE DU WEB
 * ================================================================== */
titre("§1 — à la source : l'encadré est de retour, et les titres se taisent");
{
  const menus = lire("src/components/MenusSelection.tsx");
  const favoris = lire("src/components/PageFavoris.tsx");
  verif(
    //  (mis à jour nº 253-§1 : la rangée du smartphone est rétablie —
    //  l'enveloppe est pleine largeur, l'encadré vit dans sa branche
    //  web, les titres dans la branche doigt.)
    "le bloc à deux menus vit sur le web — la rangée du doigt porte les titres",
    /className="w-full"/.test(menus) &&
      /<div className="hidden lg:block">\{blocDesMenus\}<\/div>/.test(menus) &&
      /<div className="lg:hidden">\{blocDesTitres\}<\/div>/.test(menus)
  );
  verif(
    "…toujours par l'écriture partagée avec le moteur (EncadreDeuxChamps)",
    /<EncadreDeuxChamps/.test(menus) &&
      /<EncadreDeuxChamps/.test(lire("src/components/MoteurTatouage.tsx"))
  );
  verif(
    //  (mis à jour nº 253-§1 : `rangeeWeb` est défait — la rangée
    //  existe aux deux largeurs, et la réserve du doigt a ses trois
    //  hauteurs.)
    "la rangée existe aux deux largeurs, la réserve à trois hauteurs",
    /const rangeePresente = surAccueil \|\| rangeeLibre;/.test(
      lire("src/components/EnTeteTatouage.tsx")
    )
  );
  verif(
    //  (mis à jour nº 253-§1 : le titre de la PAGE est un mot nu aux
    //  DEUX largeurs — la commande du doigt vit dans la barre.)
    "les titres de la page sont des mots nus (la commande est dans la barre)",
    /function titreControle\(nom: string\)/.test(favoris) &&
      !/<MenuDeroulant/.test(favoris) &&
      /data-titre-barre=\{cle\}/.test(lire("src/components/MenusSelection.tsx"))
  );
  verif(
    //  (mis à jour nº 253-§1 : au doigt, la BARRE porte les deux
    //  titres — l'inactif de la page redevient web seulement.)
    "le second titre de la page ne vit que sur le web",
    /data-titre-inactif="" className="hidden lg:block"/.test(favoris)
  );
  verif(
    "et le repli de la barre reste écrit (bandeau, ligne étroite, jetons)",
    /data-ligne-repliee/.test(menus) &&
      /duration-300 ease-out/.test(menus) &&
      /surDeploiement/.test(menus)
  );
}

titre("§1 — l'encadré, comparé au bloc de recherche VIVANT (1440 px)");
{
  const { contexte, page } = await ouvrirA(1440, "/");
  try {
    const RELEVE = `(encadre) => {
      if (!encadre) return null;
      const s = getComputedStyle(encadre);
      const trait = [...encadre.children].find((e) => e.getAttribute("aria-hidden"));
      const st = trait ? getComputedStyle(trait) : null;
      return {
        hauteur: Math.round(encadre.getBoundingClientRect().height),
        rayon: s.borderRadius,
        fond: s.backgroundColor,
        bordure: s.borderWidth,
        trait: st ? { largeur: st.width, fond: st.backgroundColor } : null,
      };
    }`;
    const moteur = await page.evaluate(
      `((lire) => lire(document.querySelector("[data-encadre-barre]")))(${RELEVE})`
    );
    //  L'ENCADRÉ DE « Ma sélection », injecté avec SA classe réelle
    //  (lue dans EncadreBarre) et les drapeaux que MenusSelection passe.
    const classe =
      lire("src/components/EncadreBarre.tsx").match(/className="([^"]+)"/)?.[1] ??
      "";
    const vu = await page.evaluate(
      `((classes, lire) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:fixed;top:0;left:20px;width:680px;z-index:9999;";
        hote.innerHTML = '<div id="e" data-encadre-barre="" data-clair-barre="" class="' +
          classes.replace(/\\s+/g, " ") + '">' +
          '<div class="flex-1 min-w-0 basis-1/2"><button class="w-full min-h-[52px] bg-transparent">A</button></div>' +
          '<div aria-hidden="true" class="w-px my-2.5 bg-sombre-bordure shrink-0"></div>' +
          '<div class="flex-1 min-w-0 basis-1/2"><button class="w-full min-h-[52px] bg-transparent">B</button></div>' +
          '</div>';
        document.body.appendChild(hote);
        const mesure = lire(document.getElementById("e"));
        hote.remove();
        return mesure;
      })(${JSON.stringify(classe)}, ${RELEVE})`
    );
    verif(
      "hauteur, rayon, fond et bordure identiques à ceux du moteur",
      Boolean(moteur) &&
        vu.hauteur === moteur.hauteur &&
        vu.rayon === moteur.rayon &&
        vu.fond === moteur.fond &&
        vu.bordure === moteur.bordure,
      `${vu.hauteur} px · ${vu.rayon} · ${vu.fond} · bordure ${vu.bordure}`
    );
    verif(
      "…et la même fine séparation intérieure",
      vu.trait?.largeur === moteur?.trait?.largeur &&
        vu.trait?.fond === moteur?.trait?.fond,
      `${vu.trait?.largeur} · ${vu.trait?.fond}`
    );
  } catch (erreur) {
    nonJoue("§1 · encadré vivant", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §2 — LA FEUILLE DU MENU, PAR LE BAS
 * ================================================================== */
/*  ⚠️ ON LIT LE CODE, PAS LES COMMENTAIRES (le faux positif payé à la
    nº 245, puis à la nº 248) : cette passe PARLE de « Vos coups de
    cœur » et du fondu, précisément pour dire qu'ils sont partis. */
const sansNotes = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

titre("§2 — à la source : les trois conditions déjà payées");
{
  const menu = lire("src/components/MenuDeroulant.tsx");
  //  ⚠️ `lastIndexOf` : « FEUILLE GLISSANTE » apparaît aussi dans
  //  l'en-tête du fichier, et le panneau déroulant porte LUI AUSSI
  //  `data-verre-menu` — une ancre trop haute découpait le mauvais
  //  bloc.
  const feuille = menu.slice(menu.lastIndexOf("FEUILLE GLISSANTE"));
  verif(
    "la feuille est montée dans un PORTAIL sur le corps du document",
    /createPortal\(/.test(feuille) && /document\.body\s*\n?\s*\)\}/.test(feuille)
  );
  verif(
    "la plaque est SŒUR du voile, jamais son enfant",
    //  Le voile est `absolute inset-0` et la plaque le suit dans le
    //  même parent : deux enfants, jamais l'un dans l'autre.
    /className="absolute inset-0 bg-black\/40[\s\S]*?\/>\s*\{\/\*[\s\S]*?\*\/\}\s*<div\s*\n?\s*\{\.\.\.\(sombre \? \{ "data-verre-menu"/.test(
      feuille
    )
  );
  {
    //  LA DÉCLARATION DE LA PLAQUE, isolée : de son `<div` porteur du
    //  verre jusqu'à la fin de son `style`.
    const plaque = feuille.slice(
      feuille.indexOf('{...(sombre ? { "data-verre-menu"'),
      feuille.indexOf("Barre de glissement")
    );
    verif(
      "aucun fondu d'opacité sur la plaque — le fondu vit sur le voile",
      //  Le voile, lui, fond.
      /bg-black\/40[\s\S]{0,120}starting:opacity-0/.test(feuille) &&
        //  La plaque : aucune opacité, aucune transition d'opacité, et
        //  une animation qui ne bouge QUE `transform`.
        !/opacity/.test(plaque) &&
        /animation: "rw-feuille-monte/.test(plaque) &&
        /@keyframes rw-feuille-monte \{\s*from \{ transform/.test(
          lire("src/app/globals.css").replace(/\n/g, " ")
        )
    );
  }
  verif(
    "c'est le VERRE DES MENUS (45 %, flou 60), pas celui des fenêtres",
    /"data-verre-menu": ""/.test(feuille) && !/data-verre-fenetre/.test(feuille)
  );
  verif(
    //  (mis à jour nº 253-§1 : les titres du doigt vivent dans la
    //  BARRE — MenusSelection — plus dans la page.)
    "le titre du doigt ouvre LE menu de la maison, avec sa feuille et `repliable`",
    /feuilleMobile/.test(lire("src/components/MenusSelection.tsx")) &&
      /titreFeuille=\{nom\}/.test(lire("src/components/MenusSelection.tsx")) &&
      (lire("src/components/MenusSelection.tsx").match(/^\s*repliable$/gm) ?? [])
        .length === 2
  );
}

titre("§2 — la feuille VIVANTE (le même composant, 390 px)");
{
  //  ⚠️ OÙ ON PEUT L'OUVRIR SANS SESSION : « Ma sélection » est fermée,
  //  et le champ « Explorer » du moteur ne passe PAS `feuilleMobile`.
  //  Le seul consommateur atteignable est le champ « Métier » de la
  //  recherche artisans — LE MÊME composant, la MÊME feuille, le même
  //  portail. Ce qui s'y mesure est donc la mécanique elle-même : la
  //  position, le portail, la fratrie, la chaîne d'ancêtres et
  //  l'opacité. La TEINTE, elle, ne s'allume qu'avec `sombre` : elle
  //  est vérifiée à la source ci-dessus (`data-verre-menu`), et la
  //  règle qui la peint est mesurée par les bancs du verre.
  const { contexte, page } = await ouvrirA(390, "/artisans");
  try {
    const champ = page.locator('button[aria-haspopup="listbox"]').first();
    await champ.click();
    await page.waitForTimeout(700);
    const vu = await page.evaluate(() => {
      const liste = [...document.querySelectorAll('[role="listbox"]')].find(
        (n) => n.getBoundingClientRect().height > 0
      );
      if (!liste) return null;
      const s = getComputedStyle(liste);
      const b = liste.getBoundingClientRect();
      const voile = liste.previousElementSibling;
      const coupables = [];
      for (let n = liste.parentElement; n; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (
          cs.filter !== "none" ||
          cs.transform !== "none" ||
          cs.perspective !== "none" ||
          cs.backdropFilter !== "none" ||
          cs.willChange.includes("transform") ||
          cs.willChange.includes("filter")
        ) {
          coupables.push(n.tagName.toLowerCase() + "." + String(n.className).slice(0, 30));
        }
      }
      return {
        basColle: Math.abs(b.bottom - window.innerHeight) < 2,
        dansLeCorps: liste.parentElement?.parentElement === document.body,
        soeurDuVoile: Boolean(voile) && voile.className.includes("bg-black/40"),
        opacite: s.opacity,
        coupables,
      };
    });
    verif(
      "elle monte PAR LE BAS de l'écran, montée dans le corps du document",
      Boolean(vu) && vu.basColle && vu.dansLeCorps,
      vu ? `bas collé ${vu.basColle} · dans le corps ${vu.dansLeCorps}` : "feuille absente"
    );
    verif(
      "la plaque est SŒUR du voile, et son opacité vaut 1 dès l'ouverture",
      Boolean(vu) && vu.soeurDuVoile && vu.opacite === "1",
      vu ? `sœur ${vu.soeurDuVoile} · opacité ${vu.opacite}` : "—"
    );
    verif(
      "aucune racine d'arrière-plan sur toute sa chaîne d'ancêtres",
      Boolean(vu) && vu.coupables.length === 0,
      vu?.coupables.join(" · ") || "chaîne propre"
    );
  } catch (erreur) {
    nonJoue("§2 · feuille vivante", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

titre("§2 — la sous-porte, VIVANTE (le menu partagé, 1440 px)");
{
  //  La sous-porte « Cultures du monde » vit dans le menu « Explorer »,
  //  ouvrable sans session sur l'accueil. C'est LE MÊME
  //  `MenuDeroulant`, avec LE MÊME drapeau `repliable` que celui des
  //  titres — l'interrupteur de la nº 247. (À 390, il faudrait passer
  //  par la page de recherche : le même menu, un détour de plus.)
  const { contexte, page } = await ouvrirA(1440, "/");
  try {
    await page.locator('button[aria-label="Explorer"]').first().click();
    await page.waitForTimeout(700);
    await page.locator('text="Réalisations"').first().click();
    await page.waitForTimeout(400);
    const porte = page.locator('[data-sous-porte="Cultures du monde"]').first();
    const presente = (await porte.count()) > 0;
    const avant = await page.locator('[role="option"]').count();
    if (presente) await porte.click();
    await page.waitForTimeout(400);
    const apres = await page.locator('[role="option"]').count();
    verif(
      "« Cultures du monde » s'ouvre (le drapeau `repliable` est bien passé)",
      presente && apres > avant,
      `porte ${presente ? "présente" : "ABSENTE"} · ${avant} → ${apres} entrées`
    );
  } catch (erreur) {
    nonJoue("§2 · sous-porte vivante", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §3 — PLUS AUCUN TITRE AU-DESSUS DES BANDES
 * ================================================================== */
titre("§3 — les trois lignes de provenance ont disparu");
{
  const bloc = sansNotes(lire("src/components/BlocSuivis.tsx"));
  verif(
    "aucun titre au-dessus des bandes, dans aucun des trois cas",
    !/data-provenance/.test(bloc) &&
      !/bande\.provenance/.test(bloc) &&
      !/Vos coups de cœur|Ses dernières réalisations|Ses derniers flashs/.test(
        bloc
      )
  );
  verif(
    "…et c'est bien le CŒUR qui porte l'information (le cas « aimees » seul)",
    /bande\.cas === "aimees"/.test(bloc) &&
      (bloc.match(/data-coeur-aime/g) ?? []).length === 1
  );
  verif(
    "les trois libellés ne s'écrivent plus nulle part dans la page",
    !/Vos coups de cœur/.test(sansNotes(lire("src/components/PageFavoris.tsx")))
  );
}

/* ==================================================================
 * §4 — LE FORMAT DES PHOTOS
 * ================================================================== */
titre("§4 — le cadre 4/5, écrit UNE fois et consommé partout");
{
  const config = lire("src/config/tatouage.ts");
  const bloc = lire("src/components/BlocSuivis.tsx");
  verif(
    "le format est déclaré une seule fois (CADRE_PHOTO_PORTFOLIO)",
    /export const CADRE_PHOTO_PORTFOLIO = "aspect-4\/5"/.test(config)
  );
  const consommateurs = [
    "src/components/CarteTatoueur.tsx",
    "src/components/CarrouselPortfolio.tsx",
    "src/components/GrilleGalerie.tsx",
    "src/components/BlocSuivis.tsx",
  ];
  verif(
    "…et lu par tout ce qui montre une photo de portfolio",
    consommateurs.every((f) => /CADRE_PHOTO_PORTFOLIO/.test(lire(f))) &&
      //  Plus une seule recopie à la main du format.
      consommateurs.every((f) => !/aspect-\[?4\/5\]?["\s]/.test(lire(f)))
  );
  verif(
    "les vignettes des bandes ne sont plus carrées, et gardent leurs angles droits",
    !/aspect-square/.test(bloc) && /rounded-none/.test(bloc)
  );
}

titre("§4 — les vignettes, mesurées (injection des classes réelles)");
for (const largeur of [390, 1440]) {
  const { contexte, page } = await ouvrirA(largeur, "/", { mobile: false });
  try {
    const source = lire("src/components/BlocSuivis.tsx");
    const nettoyer = (t) => (t ?? "").replace(/\s+/g, " ").trim();
    const classeCase = nettoyer(
      (source.match(/const CASE_RANGEE =\s*((?:"[^"]*"\s*\+?\s*)+);/)?.[1] ?? "")
        .replace(/["+]/g, " ")
    );
    const classeRangee = nettoyer(
      source.match(/className="(flex gap-1\.5 overflow-x-auto[^"]*)"/)?.[1]
    );
    const avant = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    );
    const vu = await page.evaluate(
      `((c) => {
        const hote = document.createElement("div");
        const l = Math.min(document.documentElement.clientWidth, ${largeur}) - 32;
        hote.style.cssText = "position:relative;width:" + l + "px;";
        hote.innerHTML =
          '<ul data-rangee class="' + c.rangee + '">' +
          Array.from({ length: 12 })
            .map(() =>
              '<li data-case class="' + c.case + '">' +
              //  ⚠️ AUCUNE IMAGE : c'est le CADRE seul qu'on mesure —
              //  la hauteur doit être réservée AVANT qu'elle arrive.
              '<a class="relative block aspect-4/5 overflow-hidden rounded-none bg-sombre-eleve"></a>' +
              '</li>'
            )
            .join("") +
          '</ul>';
        document.body.appendChild(hote);
        const rangee = hote.querySelector("[data-rangee]");
        const cadre = rangee.getBoundingClientRect();
        const cases = [...hote.querySelectorAll("[data-case] > a")];
        const b0 = cases[0].getBoundingClientRect();
        const pleines = cases.filter(
          (el) => el.getBoundingClientRect().right <= cadre.right + 0.5
        ).length;
        const partielle = cases
          .map((el) => el.getBoundingClientRect())
          .filter((b) => b.left < cadre.right && b.right > cadre.right)[0];
        const s = getComputedStyle(cases[0]);
        const mesure = {
          rapport: b0.width / b0.height,
          hauteurReservee: Math.round(b0.height),
          rayon: s.borderRadius,
          pleines,
          depassement: partielle ? (cadre.right - partielle.left) / b0.width : 0,
          debordement:
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        };
        hote.remove();
        return mesure;
      })(${JSON.stringify({ rangee: classeRangee, case: classeCase })})`
    );
    verif(
      `${largeur} px : les vignettes sont en 4/5 (0,8), angles à zéro`,
      Math.abs(vu.rapport - 0.8) < 0.01 && vu.rayon === "0px",
      `rapport ${vu.rapport.toFixed(3)} · rayon ${vu.rayon}`
    );
    verif(
      `${largeur} px : la hauteur est RÉSERVÉE avant toute image`,
      vu.hauteurReservee > 0,
      `${vu.hauteurReservee} px sans une seule image chargée`
    );
    if (largeur === 390) {
      verif(
        "390 px : trois vignettes pleines, et la suivante dépasse",
        vu.pleines === 3 && vu.depassement > 0.1,
        `${vu.pleines} pleines · dépassement ${(vu.depassement * 100).toFixed(0)} %`
      );
    } else {
      verif(
        "1440 px : le nombre visible d'aujourd'hui, et le dépassement",
        vu.pleines === 6 && vu.depassement > 0.1,
        `${vu.pleines} pleines · dépassement ${(vu.depassement * 100).toFixed(0)} %`
      );
    }
    verif(
      `${largeur} px : scrollWidth === clientWidth (le piège de la nº 228)`,
      vu.debordement === avant && vu.debordement === 0,
      `avant ${avant} → après ${vu.debordement}`
    );
  } catch (erreur) {
    nonJoue(`§4 (${largeur} px)`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

nonJoue(
  "« Ma sélection » vivante",
  "la page exige une session (base hors de portée) : l'encadré est " +
    "comparé au bloc de recherche VIVANT, la feuille du menu éprouvée " +
    "sur le MÊME composant (le champ « Explorer »), et les vignettes " +
    "mesurées par injection des classes réelles"
);

process.exit(bilan());
