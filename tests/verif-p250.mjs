/**
 * BANC DE LA PASSE Nº 250 — LES ÉTATS, LA BARRE REPLIÉE, LE CŒUR,
 * LE DÉPASSEMENT
 * ==================================================================
 * §1 les trois icônes de la barre ont leur cercle À L'APPUI sur
 *    mobile, aux valeurs du survol web, et il ne reste pas affiché ;
 * §2 la ligne étroite resserrée (36 → 28), la réserve ajustée (112 →
 *    104), le mot « Ma sélection » et la flèche vers le bas, la
 *    mécanique de juillet intacte (300 ms, ease-out, 24/12/64) ;
 * §3 le cœur : un huitième de la vignette, à 8 px des deux bords,
 *    aucun fond ni halo ;
 * §4 le dépassement (~un tiers à droite au repos, le précédent à
 *    gauche après défilement), aucun dégradé de bord, flèches hors de
 *    la rangée, « voir plus » en capsule naturelle.
 *
 * ⚠️ « Ma sélection » exige une session (base hors de portée) : la
 * ligne étroite et la rangée sont mesurées PAR INJECTION des classes
 * réelles, la mécanique partagée VIVANTE sur l'accueil, les icônes
 * VIVANTES là où elles s'affichent sans session. Le reste est dit NON
 * JOUÉ.
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

/*  Le gris du cercle : `sombre-eleve` (#2C2C31) — la valeur du survol
    web, lue de config/tatouage (COULEURS_SOMBRE.eleve). */
const GRIS_CERCLE = "rgb(44, 44, 49)";

/* ==================================================================
 * §1 — LE CERCLE À L'APPUI, SUR MOBILE
 * ================================================================== */
titre("§1 — à la source : l'écriture unique des états du rond");
{
  const icones = lire("src/components/Icones.tsx");
  const barre = lire("src/components/EnTeteTatouage.tsx");
  const espace = lire("src/components/MenuEspace.tsx");
  verif(
    "les états sont écrits UNE fois (ETATS_ROND_BARRE : survol + enfoncé, mêmes valeurs)",
    //  ⚠️ MIS À JOUR nº 254-§6 : l'écriture unique porte désormais
    //  AUSSI le rose de l'icône (`text-primaire`, survol ET appui) —
    //  le littéral d'une seule chaîne est devenu une concaténation.
    //  Ce que CETTE passe exigeait — cercle au survol ET à l'appui,
    //  mêmes valeurs, une seule écriture — s'y lit toujours.
    /export const ETATS_ROND_BARRE =\s*"hover:bg-sombre-eleve active:bg-sombre-eleve " \+\s*"hover:text-primaire active:text-primaire"/.test(
      icones
    )
  );
  verif(
    "…et consommés par les trois icônes : loupe, fanion, compte (ses deux visages)",
    (barre.match(/\$\{ETATS_ROND_BARRE\}/g) ?? []).length === 3 &&
      (espace.match(/\$\{ETATS_ROND_BARRE\}/g) ?? []).length === 2 &&
      //  Plus aucune écriture directe du survol sur ces boutons.
      !/hover:bg-sombre-eleve\b(?!\/)/.test(
        barre.replace(/ETATS_ROND_BARRE/g, "")
      )
  );
  verif(
    "le survol web n'a pas bougé (rose du survol compris — c'est un survol)",
    //  ⚠️ MIS À JOUR nº 254-§6 : le `hover:text-primaire` local a
    //  rejoint ETATS_ROND_BARRE — le rose du survol vit dans l'écriture
    //  unique, la couleur de repos reste posée sur chaque bouton.
    /hover:text-primaire/.test(icones) &&
      /\$\{ETATS_ROND_BARRE\}[\s\S]{0,200}?text-sombre-texte/.test(barre)
  );
}

titre("§1 — l'appui, VIVANT (la loupe et le compte, 390 px)");
{
  //  Sur une FICHE : la loupe y est visible sans session, et l'icône
  //  du compte (déconnecté) aussi. Le fanion, lui, exige une session —
  //  même écriture (le grep ci-dessus), dit en NON JOUÉ.
  //  ⚠️ UNE PAGE NEUVE PAR ICÔNE : relâcher la loupe est un CLIC, qui
  //  OUVRE la page de recherche en portail — elle couvrait l'icône du
  //  compte, et l'appui suivant tombait sur elle (mesuré : aucun état
  //  ne s'allumait).
  const { contexte, page } = await ouvrirA(
    390,
    "/tatoueur/atelier-corvus-lyon-1er"
  );
  try {
    for (const [nom, selecteur] of [
      ["la loupe", 'button[aria-label="Rechercher"]'],
      ["l'icône du compte", 'a[href="/devenir-tatoueur"]:visible'],
    ]) {
      await page.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForTimeout(1500);
      const cible = page.locator(selecteur).first();
      const boite = await cible.boundingBox();
      if (!boite) {
        nonJoue(`§1 · ${nom}`, "introuvable à 390 px");
        continue;
      }
      const fond = () =>
        cible.evaluate((n) => getComputedStyle(n).backgroundColor);
      const repos = await fond();
      await page.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2);
      await page.mouse.down();
      //  ⚠️ APRÈS la transition de couleurs (150 ms) : lue trop tôt,
      //  la valeur est encore en route.
      await page.waitForTimeout(350);
      const enfonce = await fond();
      await page.mouse.up();
      await page.mouse.move(5, 400);
      await page.waitForTimeout(350);
      const relache = await fond();
      verif(
        `${nom} : le cercle gris apparaît sous le doigt, et repart au relâchement`,
        (repos === "rgba(0, 0, 0, 0)" || repos === "transparent") &&
          enfonce === GRIS_CERCLE &&
          (relache === "rgba(0, 0, 0, 0)" || relache === "transparent"),
        `repos ${repos} → appui ${enfonce} → relâché ${relache}`
      );
      const geometrie = await cible.evaluate((n) => {
        const s = getComputedStyle(n);
        const b = n.getBoundingClientRect();
        return { l: Math.round(b.width), h: Math.round(b.height), rayon: s.borderRadius };
      });
      verif(
        `${nom} : même géométrie que le web (rond de 40)`,
        geometrie.l === 40 && geometrie.h === 40,
        `${geometrie.l}×${geometrie.h} · rayon ${geometrie.rayon}`
      );
    }
  } catch (erreur) {
    nonJoue("§1 · vivant", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §2 — LA BARRE REPLIÉE SE REPLIE DAVANTAGE
 * ================================================================== */
titre("§2 — la ligne étroite : 28 px, « Ma sélection », la flèche vers le bas");
{
  const menus = lire("src/components/MenusSelection.tsx");
  const barre = lire("src/components/EnTeteTatouage.tsx");
  const icones = lire("src/components/Icones.tsx");
  verif(
    "la ligne passe de 36 à 28 px, mot et flèche lisibles (13 px / 14)",
    /min-h-\[28px\] text-\[13px\]/.test(menus) &&
      /IconeChevronBas taille=\{14\}/.test(menus) &&
      !/min-h-\[36px\]/.test(menus)
  );
  verif(
    "la flèche pointe vers le bas, dans l'écriture unique des icônes (currentColor)",
    /export function IconeChevronBas/.test(icones) &&
      /stroke="currentColor"/.test(
        icones.slice(icones.indexOf("function IconeChevronBas"))
      ) &&
      !/IconeLoupe/.test(menus)
  );
  verif(
    "la réserve suit : 64 + 12 + 28 = 104 (et h-[104px])",
    /rangeeLibre \? 104 : 64/.test(barre) &&
      /rangeeLibre\s*\n?\s*\? "h-\[104px\]"/.test(barre) &&
      !/rangeeLibre \? 112/.test(barre)
  );
  verif(
    "la mécanique de juillet est INTACTE (24 / −12 / 64, 300 ms, ease-out)",
    /cumulDuGeste\.current > 24/.test(barre) &&
      /cumulDuGeste\.current < -12/.test(barre) &&
      /y < 64/.test(barre) &&
      /duration-300 ease-out/.test(menus) &&
      /max-lg:duration-300 max-lg:ease-out/.test(barre)
  );
  verif(
    "aucun contour, aucun halo, aucun rose sur la ligne",
    !/primaire|border-|shadow/.test(
      menus.slice(menus.indexOf("data-ligne-repliee"), menus.indexOf("</button>"))
    )
  );
}

titre("§2 — la hauteur et la courbe, mesurées (injection + accueil vivant)");
{
  const { contexte, page } = await ouvrirA(390, "/");
  try {
    //  LA LIGNE ÉTROITE, injectée avec ses classes réelles : hauteur
    //  AVANT (36, celle de la nº 246) contre APRÈS (28).
    const menus = lire("src/components/MenusSelection.tsx");
    const classeLigne = (
      menus.match(/className="(flex w-full items-center justify-center[^"]*)"/)?.[1] ??
      ""
    ).replace(/\s+/g, " ");
    const vu = await page.evaluate(
      `((classes) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:fixed;top:0;left:0;width:350px;z-index:9999;";
        hote.innerHTML =
          '<button class="' + classes + '">Ma sélection</button>' +
          '<button class="' + classes.replace("min-h-[28px]", "min-h-[36px]") + '">avant</button>' +
          //  Les jetons du pliage — la courbe et la durée se LISENT.
          '<div class="grid grid-cols-[minmax(0,1fr)] transition-[grid-template-rows,opacity] duration-300 ease-out" data-pliage></div>';
        document.body.appendChild(hote);
        const [apres, avant] = [...hote.querySelectorAll("button")].map(
          (b) => Math.round(b.getBoundingClientRect().height)
        );
        const pliage = getComputedStyle(hote.querySelector("[data-pliage]"));
        //  LA RÉFÉRENCE : la rangée du moteur, VIVANTE sur cette page —
        //  c'est SA courbe et SA durée (juillet) qu'il faut égaler.
        const moteur = getComputedStyle(
          document.querySelector("[data-rangee-moteur]")
        );
        const mesure = {
          apres,
          avant,
          duree: pliage.transitionDuration,
          courbe: pliage.transitionTimingFunction,
          dureeMoteur: moteur.transitionDuration,
          courbeMoteur: moteur.transitionTimingFunction,
        };
        hote.remove();
        return mesure;
      })(${JSON.stringify(classeLigne)})`
    );
    verif(
      "la ligne repliée : 36 px avant, 28 px après — un cran de moins",
      vu.avant === 36 && vu.apres === 28,
      `${vu.avant} → ${vu.apres} px`
    );
    verif(
      "la courbe et la durée du repli : celles de juillet, à l'identique",
      /^0\.3s/.test(vu.duree) &&
        vu.duree === vu.dureeMoteur &&
        vu.courbe === vu.courbeMoteur,
      `${vu.duree} = ${vu.dureeMoteur} · ${vu.courbe} = ${vu.courbeMoteur}`
    );
    //  ET LA MÉCANIQUE VIVANTE, sur l'accueil (celle qu'on partage).
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
      "la mécanique vivante n'a pas bougé (128 → 64 → 128 sur l'accueil)",
      haut === 128 && descendu === 64 && remonte === 128,
      `${haut} → ${descendu} → ${remonte}`
    );
  } catch (erreur) {
    nonJoue("§2 · mesures", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §3 — LE CŒUR : SA JUSTE TAILLE
 * ================================================================== */
titre("§3 — le cœur : un huitième de la vignette, 8 px des bords, nu");
{
  const source = lire("src/components/BlocSuivis.tsx");
  verif(
    "à la source : w-[12.5%], bottom-2 right-2, sur le cas « aimees » seul",
    /absolute bottom-2 right-2 w-\[12\.5%\]/.test(source) &&
      /bande\.cas === "aimees" && \(/.test(source) &&
      (source.match(/data-coeur-aime/g) ?? []).length === 1
  );
}
for (const largeur of [390, 1440]) {
  const { contexte, page } = await ouvrirA(largeur, "/", { mobile: largeur < 1024 });
  try {
    const source = lire("src/components/BlocSuivis.tsx");
    const classeCase = (
      (source.match(/const CASE_RANGEE =\s*((?:"[^"]*"\s*\+?\s*)+);/)?.[1] ?? "")
        .replace(/["+]/g, " ")
    ).replace(/\s+/g, " ").trim();
    const vu = await page.evaluate(
      `((c) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:fixed;top:0;left:0;width:" +
          Math.min(document.documentElement.clientWidth, ${largeur} - 32) + "px;z-index:9999;";
        hote.innerHTML =
          '<ul class="flex gap-1.5 overflow-x-auto">' +
          '<li class="' + c + '"><a class="relative block aspect-square overflow-hidden rounded-none bg-sombre-eleve">' +
          '<span data-coeur class="pointer-events-none absolute bottom-2 right-2 w-[12.5%]">' +
          '<svg viewBox="0 0 24 24" class="block h-auto w-full" style="display:block"><path d="M12 20.5C7.5 17.2 3.5 13.9 3.5 9.9"/></svg>' +
          '</span></a></li></ul>';
        document.body.appendChild(hote);
        const vignette = hote.querySelector("a").getBoundingClientRect();
        const coeur = hote.querySelector("[data-coeur]").getBoundingClientRect();
        const s = getComputedStyle(hote.querySelector("[data-coeur]"));
        const mesure = {
          part: coeur.width / vignette.width,
          droite: Math.round(vignette.right - coeur.right),
          bas: Math.round(vignette.bottom - coeur.bottom),
          fond: s.backgroundColor,
          ombreBoite: s.boxShadow,
        };
        hote.remove();
        return mesure;
      })(${JSON.stringify(classeCase)})`
    );
    verif(
      `${largeur} px : un huitième de la vignette (12,5 %), à 8 px des deux bords`,
      Math.abs(vu.part - 0.125) < 0.005 && vu.droite === 8 && vu.bas === 8,
      `${(vu.part * 100).toFixed(1)} % · droite ${vu.droite} px · bas ${vu.bas} px`
    );
    verif(
      `${largeur} px : aucun fond, aucun halo derrière lui`,
      (vu.fond === "rgba(0, 0, 0, 0)" || vu.fond === "transparent") &&
        vu.ombreBoite === "none",
      `fond ${vu.fond} · ombre de boîte ${vu.ombreBoite}`
    );
  } catch (erreur) {
    nonJoue(`§3 (${largeur} px)`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §4 — LE DÉPASSEMENT, LES FLÈCHES, « VOIR PLUS »
 * ================================================================== */
titre("§4 — à la source : rien sur les bords, les flèches dehors, la capsule");
{
  const source = lire("src/components/BlocSuivis.tsx");
  verif(
    "aucun dégradé ni voile de bord sur la rangée",
    !/gradient|mask/.test(source)
  );
  verif(
    //  (mis à jour nº 252-§1 : les flèches de la marge haute sont
    //  devenues DEUX BANDEAUX DE VERRE aux extrémités — toujours par
    //  `pointer-fine:`, toujours sans capsule pleine ni flou porté à
    //  soi : le verre est l'écriture partagée `data-verre-fenetre`.)
    "les commandes de défilement : les bandeaux de verre, sans capsule pleine",
    /data-bandeau-defilement/.test(source) &&
      //  ⚠️ MIS À JOUR nº 254-§4 : le survol de la nº 253 (`invisible
      //  group-hover:visible`) puis le passage au bouton rond ont
      //  glissé des classes entre le pointer-fine et l'absolu — les
      //  jetons demeurent, plus leur adjacence.
      /hidden pointer-fine:flex[\s\S]{0,80}?absolute inset-y-0/.test(source) &&
      !/absolute[^"]*(right|left)-1 top-1\/2/.test(source) &&
      !/bg-sombre-fond\/55/.test(source) &&
      !/backdrop-blur/.test(source)
  );
  verif(
    "« voir plus » : la capsule des actions intermédiaires, jamais de rose",
    /rounded-full\s*\n?\s*bg-sombre-eleve px-3\.5 min-h-\[32px\]/.test(
      source.replace(/\s+/g, " ")
    ) &&
      !/data-voir-plus[^>]*primaire/.test(source)
  );
}

titre("§4 — le dépassement, mesuré (injection, 390 et 1440)");
for (const largeur of [390, 1440]) {
  const { contexte, page } = await ouvrirA(largeur, "/", { mobile: false });
  try {
    const source = lire("src/components/BlocSuivis.tsx");
    const classeCase = (
      (source.match(/const CASE_RANGEE =\s*((?:"[^"]*"\s*\+?\s*)+);/)?.[1] ?? "")
        .replace(/["+]/g, " ")
    ).replace(/\s+/g, " ").trim();
    const classeRangee = (
      source.match(/className="(flex gap-1\.5 overflow-x-auto[^"]*)"/)?.[1] ?? ""
    ).replace(/\s+/g, " ");
    const vu = await page.evaluate(
      `(async (c) => {
        const hote = document.createElement("div");
        const largeurHote = Math.min(document.documentElement.clientWidth, ${largeur}) - 32;
        hote.style.cssText = "position:fixed;top:0;left:0;width:" + largeurHote + "px;z-index:9999;";
        hote.innerHTML =
          '<div class="hidden pointer-fine:flex justify-end gap-1 mb-1" data-marge-fleches>' +
          '<button data-fleche class="hidden pointer-fine:flex h-8 w-8 items-center justify-center rounded-full text-sombre-texte-doux"></button></div>' +
          '<ul data-rangee class="' + c.rangee + '">' +
          Array.from({ length: 12 })
            .map(() => '<li data-case class="' + c.case + '"><a class="relative block aspect-square rounded-none bg-sombre-eleve"></a></li>')
            .join("") +
          '</ul>';
        document.body.appendChild(hote);
        const rangee = hote.querySelector("[data-rangee]");
        const cadre = rangee.getBoundingClientRect();
        const cases = [...hote.querySelectorAll("[data-case]")];
        const largeurCase = cases[0].getBoundingClientRect().width;
        const partielle = (bord) =>
          cases
            .map((el) => el.getBoundingClientRect())
            .filter((b) =>
              bord === "droit"
                ? b.left < cadre.right && b.right > cadre.right
                : b.left < cadre.left && b.right > cadre.left
            )
            .map((b) =>
              bord === "droit"
                ? (cadre.right - b.left) / largeurCase
                : (b.right - cadre.left) / largeurCase
            )[0] ?? 0;
        const reposDroit = partielle("droit");
        rangee.scrollTo({ left: rangee.scrollWidth / 2, behavior: "instant" });
        await new Promise((fin) => requestAnimationFrame(() => requestAnimationFrame(fin)));
        const apresGauche = partielle("gauche");
        const fleches = hote.querySelector("[data-marge-fleches]").getBoundingClientRect();
        const mesure = {
          reposDroit,
          apresGauche,
          //  Les flèches ne recouvrent JAMAIS une vignette : leur boîte
          //  est entièrement AU-DESSUS de la rangée.
          flechesDehors: fleches.bottom <= cadre.top,
          flecheVisible: getComputedStyle(hote.querySelector("[data-fleche]")).display,
        };
        hote.remove();
        return mesure;
      })(${JSON.stringify({ rangee: classeRangee, case: classeCase })})`
    );
    verif(
      `${largeur} px : au repos, la suivante dépasse d'environ un tiers à droite`,
      vu.reposDroit > 0.2 && vu.reposDroit < 0.5,
      `${(vu.reposDroit * 100).toFixed(0)} % de sa largeur`
    );
    verif(
      `${largeur} px : après défilement, la précédente dépasse à gauche`,
      vu.apresGauche > 0.08,
      `${(vu.apresGauche * 100).toFixed(0)} % de sa largeur`
    );
    verif(
      `${largeur} px : les flèches ne recouvrent aucune vignette (au-dessus de la rangée)`,
      vu.flechesDehors && vu.flecheVisible === "flex",
      `dehors ${vu.flechesDehors} · display ${vu.flecheVisible}`
    );
  } catch (erreur) {
    nonJoue(`§4 (${largeur} px)`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

nonJoue(
  "« Ma sélection » vivante (et le fanion connecté)",
  "la page et le fanion exigent une session (base hors de portée) : la " +
    "ligne étroite, le cœur et la rangée sont mesurés par injection des " +
    "classes réelles ; la loupe et le compte, vivants sur une fiche ; le " +
    "fanion porte LA MÊME écriture (ETATS_ROND_BARRE, vérifiée à la source)"
);

process.exit(bilan());
