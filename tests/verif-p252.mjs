/**
 * BANC DE LA PASSE Nº 252 — LES BANDEAUX DE VERRE, ET L'AIR DES BLOCS
 * ==================================================================
 * §1 web : les flèches de la nº 250 s'en vont ; deux bandeaux de verre
 *    aux extrémités de la rangée — toute la hauteur des images, flèche
 *    au centre exact, celui de gauche seulement après défilement, le
 *    verre des plaques (22 %) plus léger que les menus (45 %), aucun
 *    dégradé de bord, jamais une vignette entièrement couverte ;
 *    au doigt (390), ils n'existent pas ;
 * §2 l'écart identité → bande, et l'écart entre deux blocs : les deux
 *    mesurés, le second strictement plus grand.
 *
 * ⚠️ « Ma sélection » exige une session (base hors de portée) : la
 * géométrie et le verre sont mesurés PAR INJECTION des classes
 * réelles ; les prédicats de présence des bandeaux sont EXTRAITS DU
 * FICHIER SOURCE et rejoués sur la rangée injectée — le banc éprouve
 * les expressions livrées, pas une réécriture. Le montage React
 * lui-même est dit NON JOUÉ.
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

const source = lire("src/components/BlocSuivis.tsx");
const nettoyer = (t) => (t ?? "").replace(/\s+/g, " ").trim();
const classeCase = nettoyer(
  (source.match(/const CASE_RANGEE =\s*((?:"[^"]*"\s*\+?\s*)+);/)?.[1] ?? "")
    .replace(/["+]/g, " ")
);
const classeRangee = nettoyer(
  source.match(/className="(flex gap-1\.5 overflow-x-auto[^"]*)"/)?.[1]
);
//  LA CLASSE DU BANDEAU, lue à la source (les deux sens partagent tout
//  sauf right-0/left-0, injecté par le ternaire).
//  (mis à jour nº 253-§4 : la classe porte en plus le survol —
//  `invisible group-hover:visible` — entre le pointer-fine et
//  l'absolu ; l'ancre s'élargit d'autant.)
const classeBandeau = nettoyer(
  source.match(
    /className=\{`(hidden pointer-fine:flex[^`]*inset-y-0[^`]*)`\}/
  )?.[1]
)
  .replace(/\$\{\s*sens === 1 \? "right-0" : "left-0"\s*\}/, "")
  .trim();
//  LES PRÉDICATS DE PRÉSENCE, extraits du fichier livré — le banc
//  rejoue CES expressions-là, jamais une réécriture.
const predicatGauche = source.match(/gauche: (cadre\.[^,]+),/)?.[1] ?? "";
const predicatDroite = source.match(/droite: (cadre\.[^,]+),/)?.[1] ?? "";

/* ==================================================================
 * §1 — À LA SOURCE
 * ================================================================== */
titre("§1 — à la source : les bandeaux remplacent les flèches");
{
  verif(
    "les flèches de la nº 250 (la rangée au-dessus) ont disparu",
    !/justify-end gap-1 mb-1/.test(source) &&
      !/hover:text-sombre-texte active:bg-white\/10/.test(source)
  );
  verif(
    "le verre est UNE écriture existante (data-verre-fenetre), aucune seconde",
    /data-verre-fenetre=""/.test(source) &&
      !/backdrop-filter|backdropFilter|blur\(/.test(source) &&
      classeBandeau.includes("inset-y-0")
  );
  verif(
    "présence par MONTAGE conditionnel — aucun fondu d'opacité sur la plaque",
    //  (nº 253 : l'état s'appelle `etat` — il porte aussi les pages.)
    /\{etat\.gauche && bandeau\(-1\)\}/.test(source) &&
      /\{etat\.droite && bandeau\(1\)\}/.test(source) &&
      !/transition-opacity/.test(classeBandeau) &&
      !/starting:/.test(classeBandeau)
  );
  verif(
    "les prédicats existent, relevés au montage, au défilement et à la taille",
    predicatGauche === "cadre.scrollLeft > 1" &&
      /scrollLeft \+ cadre\.clientWidth < cadre\.scrollWidth - 1/.test(
        predicatDroite
      ) &&
      /addEventListener\("scroll", lire, \{ passive: true \}\)/.test(source) &&
      /new ResizeObserver\(lire\)/.test(source),
    `${predicatGauche} · ${predicatDroite}`
  );
  verif(
    "au doigt, le bandeau n'existe pas (`hidden pointer-fine:flex`)",
    classeBandeau.startsWith("hidden pointer-fine:flex")
  );
}

/* ==================================================================
 * §1 — LA GÉOMÉTRIE ET LE VERRE, MESURÉS (injection, 1440)
 * ================================================================== */
titre("§1 — les bandeaux, mesurés sur la rangée injectée (1440 px)");
{
  const { contexte, page } = await ouvrirA(1440, "/", { mobile: false });
  try {
    const vu = await page.evaluate(
      `(async (c) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:relative;width:1376px;margin:0 auto;";
        const bandeau = (sens) =>
          '<button data-bandeau-defilement="' + (sens > 0 ? "droite" : "gauche") + '"' +
          ' data-verre-fenetre="" class="' + c.bandeau + " " + (sens > 0 ? "right-0" : "left-0") + '">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none">' +
          '<path d="M9.5 5.5 16 12l-6.5 6.5" stroke="currentColor" stroke-width="2.2"/></svg></button>';
        hote.innerHTML =
          '<div class="relative mt-2" data-enveloppe>' +
          '<ul data-rangee class="' + c.rangee + '">' +
          Array.from({ length: 12 })
            .map(() => '<li class="' + c.case + '"><a class="relative block aspect-4/5 overflow-hidden rounded-none bg-sombre-eleve"></a></li>')
            .join("") +
          '</ul>' + bandeau(-1) + bandeau(1) + '</div>';
        document.body.appendChild(hote);
        const rangee = hote.querySelector("[data-rangee]");
        const image = hote.querySelector("li > a").getBoundingClientRect();
        const droit = hote.querySelector('[data-bandeau-defilement="droite"]');
        const gauche = hote.querySelector('[data-bandeau-defilement="gauche"]');
        const bd = droit.getBoundingClientRect();
        const fleche = droit.querySelector("svg").getBoundingClientRect();
        const s = getComputedStyle(droit);
        //  Le dépassement de la nº 250 : la case partielle du bord droit.
        const cadreR = rangee.getBoundingClientRect();
        const partielle = [...rangee.querySelectorAll("li")]
          .map((el) => el.getBoundingClientRect())
          .filter((b) => b.left < cadreR.right && b.right > cadreR.right)[0];
        const visible = partielle ? cadreR.right - partielle.left : 0;
        //  LES PRÉDICATS LIVRÉS, rejoués sur cette rangée réelle.
        const predicat = (cadre, expr) => new Function("cadre", "return " + expr)(cadre);
        const auRepos = {
          gauche: predicat(rangee, ${JSON.stringify(predicatGauche)}),
          droite: predicat(rangee, ${JSON.stringify(predicatDroite)}),
        };
        //  ⚠️ AU MILIEU, pas d'une page entière : sur 12 cases dont 6,4
        //  visibles, une page entière atterrit EN FIN de rangée — où
        //  « droite absent » est la bonne réponse, pas un raté.
        rangee.scrollTo({
          left: (rangee.scrollWidth - rangee.clientWidth) / 2,
          behavior: "instant",
        });
        await new Promise((fin) => requestAnimationFrame(() => requestAnimationFrame(fin)));
        const apresDefilement = {
          gauche: predicat(rangee, ${JSON.stringify(predicatGauche)}),
          droite: predicat(rangee, ${JSON.stringify(predicatDroite)}),
        };
        rangee.scrollTo({ left: 0, behavior: "instant" });
        await new Promise((fin) => requestAnimationFrame(() => requestAnimationFrame(fin)));
        const auRetour = {
          gauche: predicat(rangee, ${JSON.stringify(predicatGauche)}),
        };
        const mesure = {
          hauteurBandeau: Math.round(bd.height),
          hauteurImage: Math.round(image.height),
          centreFlecheX: Math.abs((fleche.left + fleche.right) / 2 - (bd.left + bd.right) / 2),
          centreFlecheY: Math.abs((fleche.top + fleche.bottom) / 2 - (bd.top + bd.bottom) / 2),
          largeurBandeau: Math.round(bd.width),
          largeurCase: Math.round(image.width),
          depassementVisible: Math.round(visible),
          fond: s.backgroundColor,
          flou: s.backdropFilter || "",
          degrade: s.backgroundImage,
          auRepos,
          apresDefilement,
          auRetour,
        };
        hote.remove();
        return mesure;
      })(${JSON.stringify({ rangee: classeRangee, case: classeCase, bandeau: classeBandeau })})`
    );
    verif(
      "le bandeau court sur toute la hauteur des images, à un pixel près",
      Math.abs(vu.hauteurBandeau - vu.hauteurImage) <= 1,
      `bandeau ${vu.hauteurBandeau} px · image ${vu.hauteurImage} px`
    );
    verif(
      "la flèche est au centre exact du bandeau",
      vu.centreFlecheX <= 1 && vu.centreFlecheY <= 1,
      `écart x ${vu.centreFlecheX.toFixed(1)} px · y ${vu.centreFlecheY.toFixed(1)} px`
    );
    verif(
      "il ne recouvre jamais complètement une vignette, et le dépassement reste visible",
      vu.largeurBandeau < vu.largeurCase && vu.largeurBandeau < vu.depassementVisible,
      `bandeau ${vu.largeurBandeau} px · case ${vu.largeurCase} px · dépassement ${vu.depassementVisible} px`
    );
    verif(
      "le verre des plaques : 22 %, flou 40 — et aucun dégradé de bord",
      vu.fond === "rgba(26, 26, 29, 0.22)" &&
        /blur\(40px\)/.test(vu.flou) &&
        vu.degrade === "none",
      `${vu.fond} · ${vu.flou} · fond d'image ${vu.degrade}`
    );
    verif(
      "au repos : droite seulement — les prédicats LIVRÉS le disent",
      vu.auRepos.droite === true && vu.auRepos.gauche === false,
      JSON.stringify(vu.auRepos)
    );
    verif(
      "après défilement : gauche présent ; au retour au début : reparti",
      vu.apresDefilement.gauche === true &&
        vu.apresDefilement.droite === true &&
        vu.auRetour.gauche === false,
      `${JSON.stringify(vu.apresDefilement)} · retour ${JSON.stringify(vu.auRetour)}`
    );
  } catch (erreur) {
    nonJoue("§1 · bandeaux (1440)", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

titre("§1 — plus léger que les menus (le panneau de verre VIVANT, 1440 px)");
{
  const { contexte, page } = await ouvrirA(1440, "/", { mobile: false });
  try {
    await page.locator('button[aria-label="Explorer"]').first().click();
    await page.waitForTimeout(600);
    const menu = await page.evaluate(() => {
      const panneau = document.querySelector("[data-verre-menu]");
      if (!panneau) return null;
      const s = getComputedStyle(panneau);
      return { fond: s.backgroundColor, flou: s.backdropFilter };
    });
    const alphaDe = (rgba) => Number(rgba?.match(/[\d.]+(?=\))/)?.[0] ?? NaN);
    verif(
      "la teinte du bandeau (0,22) est plus légère que celle des menus (0,45)",
      Boolean(menu) &&
        alphaDe(menu.fond) === 0.45 &&
        0.22 < alphaDe(menu.fond),
      menu ? `bandeau 0.22 · menu ${alphaDe(menu.fond)} (${menu.flou})` : "panneau absent"
    );
  } catch (erreur) {
    nonJoue("§1 · comparaison menus", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

titre("§1 — au doigt (390 px) : aucun bandeau");
{
  const { contexte, page } = await ouvrirA(390, "/");
  try {
    const affichage = await page.evaluate(
      `((classes) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:relative;width:350px;height:100px;";
        hote.innerHTML = '<button data-verre-fenetre="" class="' + classes + ' right-0"></button>';
        document.body.appendChild(hote);
        const vu = getComputedStyle(hote.firstElementChild).display;
        hote.remove();
        return vu;
      })(${JSON.stringify(classeBandeau)})`
    );
    verif(
      "le bandeau n'existe pas au doigt (display none — pointer-fine absent)",
      affichage === "none",
      `display ${affichage}`
    );
  } catch (erreur) {
    nonJoue("§1 · 390", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

/* ==================================================================
 * §2 — L'AIR AU-DESSUS DES BANDES
 * ================================================================== */
titre("§2 — l'écart identité → bande, contre l'écart entre deux blocs");
{
  const { contexte, page } = await ouvrirA(1440, "/", { mobile: false });
  try {
    const classeLigne = nettoyer(
      lire("src/components/BlocLieux.tsx").match(
        /export const CLASSES_LIGNE_CLIQUABLE =\s*((?:"[^"]*"\s*\+?\s*)+);/
      )?.[1].replace(/["+]/g, " ")
    );
    const classeGrille = nettoyer(
      source.match(/className="(mt-5 grid gap-\[34px\][^"]*)"/)?.[1]
    );
    const vu = await page.evaluate(
      `((c) => {
        const hote = document.createElement("div");
        hote.style.cssText = "position:relative;width:1376px;margin:0 auto;";
        const bloc =
          '<li><div class="flex flex-col">' +
          '<a class="' + c.ligne + '" data-identite>' +
          '<span class="flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sombre-eleve"></span>' +
          '<span class="flex min-h-13 min-w-0 flex-1 flex-col justify-center">' +
          '<span class="truncate text-[15px] font-semibold text-sombre-texte">Lola</span>' +
          '<span class="truncate text-[14px] leading-relaxed text-sombre-texte-doux">En salon · Lyon</span>' +
          '</span></a>' +
          '<div class="relative mt-2" data-enveloppe>' +
          '<ul data-rangee class="' + c.rangee + '">' +
          Array.from({ length: 8 })
            .map(() => '<li class="' + c.case + '"><a class="relative block aspect-4/5 rounded-none bg-sombre-eleve"></a></li>')
            .join("") +
          '</ul></div></div></li>';
        hote.innerHTML = '<ul class="' + c.grille + '" data-grille>' + bloc + bloc + '</ul>';
        document.body.appendChild(hote);
        const identites = [...hote.querySelectorAll("[data-identite]")];
        const rangees = [...hote.querySelectorAll("[data-rangee]")];
        //  L'écart VISUEL : du bas du CONTENU de la ligne d'identité
        //  (son rembourrage -m-2/p-2 s'annule) au haut de la rangée.
        const basIdentite = identites[0].getBoundingClientRect().bottom - 8;
        const hautBande = rangees[0].getBoundingClientRect().top;
        //  L'écart entre deux blocs : bas de la première bande → haut
        //  de la deuxième identité (contenu, +8 du rembourrage).
        const basBloc1 = rangees[0].getBoundingClientRect().bottom;
        const hautBloc2 = identites[1].getBoundingClientRect().top + 8;
        const mesure = {
          identiteVersBande: Math.round(hautBande - basIdentite),
          entreBlocs: Math.round(hautBloc2 - basBloc1),
        };
        hote.remove();
        return mesure;
      })(${JSON.stringify({
        ligne: classeLigne,
        rangee: classeRangee,
        case: classeCase,
        grille: classeGrille,
      })})`
    );
    verif(
      "l'identité et sa bande se lisent comme UN bloc (l'écart mesuré)",
      vu.identiteVersBande <= 12 && vu.identiteVersBande >= 4,
      `${vu.identiteVersBande} px`
    );
    verif(
      "l'écart entre deux blocs reste 34 px — STRICTEMENT le plus grand",
      vu.entreBlocs === 34 && vu.entreBlocs > vu.identiteVersBande,
      `entre blocs ${vu.entreBlocs} px > identité→bande ${vu.identiteVersBande} px`
    );
  } catch (erreur) {
    nonJoue("§2", String(erreur).slice(0, 70));
  }
  await contexte.close();
}

nonJoue(
  "« Ma sélection » vivante",
  "la page exige une session (base hors de portée) : la géométrie, le " +
    "verre et les écarts sont mesurés par injection des classes réelles, " +
    "et les prédicats de présence sont EXTRAITS du fichier livré puis " +
    "rejoués sur la rangée injectée — seul le montage React lui-même " +
    "n'est pas éprouvé"
);

process.exit(bilan());
