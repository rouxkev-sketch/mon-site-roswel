/**
 * BANC DE LA PASSE Nº 264
 * ==================================================================
 * §1 « Filtrer » à la taille du MOT DU CHAMP de recherche (relevée
 *    vivante), plus celle d'un titre ; blanc et gras inchangés ;
 * §2 les marges du bloc titre/sous-titre de « Ma sélection » égales à
 *    celles de la page de recherche, dans les DEUX états — quatre
 *    relevés côte à côte ;
 * §3 les rangées débordent jusqu'aux bords de l'écran, fondu
 *    anthracite sur chaque marge, vignette de droite dépassant dès le
 *    repos, hauteurs web inchangées, +30 % entre carrousels — et le
 *    piège de la nº 228 mesuré (scrollWidth = clientWidth) ;
 * §4 au doigt, la vignette de droite montre EXACTEMENT 10 % au bord
 *    de l'écran — la taille découle de la règle, format 4/5, 20 px
 *    entre l'identité et la rangée ;
 * §5 pointillés au-dessus de la rangée sur le web, bord droit sur la
 *    dernière vignette PLEINE ; supprimés au doigt ;
 * §6 le chevron nu : blanc, 12 × 24, trait 1,8, sans disque ni verre
 *    ni fond, sur le fondu, survol seulement ;
 * §7 le cœur des vignettes à 9 % — mesuré CONTRE celui des cartes.
 *
 * ⚠️ « MA SÉLECTION » EXIGE UNE SESSION (Supabase hors de portée) :
 * les rangées réelles ne se montent pas ici. Les écritures RÉELLES
 * (classes, gabarits et branches résolues de la source) sont INJECTÉES
 * dans la page vivante — dans son vrai <main>, aux vraies marges — et
 * mesurées aux deux largeurs. Dit NON JOUÉ pour le montage React.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : rien ici ne parle pour Safari/iOS.
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
  const fermerContexte = contexte.close.bind(contexte);
  contexte.close = async () => {
    await fermerContexte();
    await nav.close();
  };
  return { contexte, page };
};

const nettoyer = (t) => (t ?? "").replace(/\s+/g, " ").trim();
const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const blocSuivis = lire("src/components/BlocSuivis.tsx");
const blocNu = sansNotes(blocSuivis);
const menus = sansNotes(lire("src/components/MenusSelection.tsx"));
const pageFavoris = sansNotes(lire("src/components/PageFavoris.tsx"));
const ligneResultats = lire("src/components/LigneResultats.tsx");
const grille = lire("src/components/GrilleTatoueurs.tsx");
const coeurCarte = sansNotes(lire("src/components/BoutonCoeurPhoto.tsx"));

/* ------------------------------------------------------------------
 * LES ÉCRITURES RÉELLES, EXTRAITES POUR LES INJECTIONS
 * ---------------------------------------------------------------- */
//  Le gabarit des cases : trois littéraux concaténés.
const CASE_RANGEE = (blocNu.match(
  /const CASE_RANGEE =\s*"([^"]+)" \+\s*"([^"]+)" \+\s*"([^"]+)";/
) ?? [])
  .slice(1)
  .join("");
//  La liste qui défile (le débordement y vit).
const classesListe = nettoyer(
  blocNu.match(/data-cas=\{bande\.cas\}\s*className="([^"]+)"/)?.[1]
);
//  La vignette (le lien 4/5), branche résolue du cadre.
const classesVignette = nettoyer(
  blocNu
    .match(/data-vignette-suivi=\{photo\.id\}\s*className=\{`([^`]+)`\}/)?.[1]
    ?.replace(/\$\{CADRE_PHOTO_PORTFOLIO\}/, "aspect-4/5")
);
//  Le voile de fondu — les deux branches.
const gabaritVoile = blocNu.match(
  /data-voile-rangee=[\s\S]*?className=\{`([^`]+)`\}/
)?.[1];
const classesVoile = (sens) =>
  nettoyer(
    gabaritVoile?.replace(
      /\$\{[\s\S]*?\}/,
      sens === 1
        ? "-right-4 sm:-right-6 bg-gradient-to-l"
        : "-left-4 sm:-left-6 bg-gradient-to-r"
    )
  );
//  Le chevron nu — branche droite.
const gabaritChevron = blocNu.match(
  /data-bandeau-defilement=[\s\S]*?className=\{`([^`]+)`\}/
)?.[1];
const classesChevron = nettoyer(
  gabaritChevron?.replace(/\$\{[\s\S]*?\}/, "-right-4 sm:-right-6")
);
const svgChevron = blocNu.match(/<svg width="12" height="24"[\s\S]*?\/>\s*<\/svg>/)?.[0];
//  Le cœur d'une vignette aimée.
const classesCoeur = nettoyer(
  blocNu.match(/data-coeur-aime=""\s*aria-hidden="true"\s*className="([^"]+)"/)?.[1]
);
//  Les pointillés.
const classesPoints = nettoyer(
  blocNu.match(/data-page-courante=\{etat\.page\}[\s\S]*?className="([^"]+)"/)?.[1]
);
//  La grille des carrousels (l'écart de 30 %), branche « un groupe ».
const classesGrilleBlocs = nettoyer(
  blocNu
    .match(/<ul\s*className=\{`\$\{\s*groupes\.length > 1 \? "mt-5 " : ""\s*\}([^`]+)`\}/)?.[1]
);
//  Le bloc du titre (LigneResultats) et la grille des cartes.
const classesTitreBloc = nettoyer(
  ligneResultats.match(/data-titre-mosaique="" className="([^"]+)"/)?.[1]
);
const classesTitreH = nettoyer(
  ligneResultats.match(/<Titre className="([^"]+)"/)?.[1]
);
const classesSousTitre = nettoyer(ligneResultats.match(/<p className="([^"]+)"/)?.[1]);
const socleGrille = grille.match(/SOCLE_GRILLE_CARTES = "([^"]+)"/)?.[1] ?? "";

/* ==================================================================
 * §1 — « FILTRER » À LA TAILLE DU MOT DU CHAMP
 * ================================================================== */
titre("§1 — à la source : la taille du champ, plus celle d'un titre");
{
  verif(
    "« Filtrer » porte text-base (le jeton même du champ), gras et blanc",
    /<span className="text-base font-bold text-white">Filtrer<\/span>/.test(
      menus
    ) && /taillePolice="text-base"/.test(menus)
  );
}
titre("§1 — VIVANT (390 px) : le relevé du champ, et le mot à sa taille");
{
  const { contexte, page } = await ouvrirA(390, "/");
  try {
    const champ = await page.evaluate(() => {
      const bouton = [...document.querySelectorAll("button")].find((b) => {
        const r = b.getBoundingClientRect();
        return r.height >= 44 && r.height <= 48 && r.width > 150 && r.top < 250;
      });
      return bouton ? getComputedStyle(bouton).fontSize : null;
    });
    const mot = await page.evaluate(() => {
      const hote = document.createElement("div");
      hote.innerHTML =
        '<span data-essai-filtrer class="text-base font-bold text-white">Filtrer</span>';
      document.body.appendChild(hote);
      const s = getComputedStyle(hote.querySelector("[data-essai-filtrer]"));
      const mesure = { taille: s.fontSize, graisse: s.fontWeight, couleur: s.color };
      hote.remove();
      return mesure;
    });
    verif(
      "le mot « Filtrer » fait EXACTEMENT la taille relevée du champ de recherche",
      champ === "16px" &&
        mot.taille === champ &&
        mot.graisse === "700" &&
        mot.couleur === "rgb(255, 255, 255)",
      `champ ${champ} · Filtrer ${mot.taille} · ${mot.graisse} · ${mot.couleur}`
    );
  } catch (erreur) {
    nonJoue("§1 · vivant", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §2 — LES MARGES DU TITRE, QUATRE RELEVÉS CÔTE À CÔTE
 * ================================================================== */
titre("§2 — à la source : plus aucune marge ajoutée sous le bloc");
{
  verif(
    "la grille des favoris n'ajoute plus de marge (le mt-6 est parti)",
    /<ul className=\{CLASSES_GRILLE_CARTES\}>/.test(pageFavoris) &&
      !/mt-6 \$\{CLASSES_GRILLE_CARTES\}/.test(pageFavoris)
  );
  verif(
    "la section des suivis non plus (mt-4 parti ; mt-5 réservé aux titres de groupe)",
    /<div data-section-suivis="">/.test(blocNu) &&
      /groupes\.length > 1 \? "mt-5 " : ""/.test(blocNu)
  );
}
const releves = {};
for (const largeur of [390, 1440]) {
  const { contexte, page } = await ouvrirA(largeur, "/");
  try {
    const mesurer = () =>
      page.evaluate(() => {
        const bloc = document.querySelector("[data-titre-mosaique]");
        const titreN = bloc.querySelector("h1, h2");
        const sous = bloc.querySelector("p");
        let apres = bloc.nextElementSibling;
        while (apres && apres.getBoundingClientRect().height === 0)
          apres = apres.nextElementSibling;
        const bB = bloc.getBoundingClientRect();
        const bT = titreN.getBoundingClientRect();
        const bS = sous?.getBoundingClientRect();
        const bA = apres?.getBoundingClientRect();
        return {
          haut: Math.round(bT.top - bB.top),
          entre: bS ? Math.round(bS.top - bT.bottom) : null,
          bas: bA ? Math.round(bA.top - (bS ?? bT).bottom) : null,
        };
      });
    releves[`recherche nue ${largeur}`] = await mesurer();
    await page.goto(`${BASE}/?style=japonais`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(1500);
    releves[`recherche filtrée ${largeur}`] = await mesurer();
    //  « MA SÉLECTION », INJECTÉE DANS LE MÊME MAIN : le bloc de titre
    //  (l'écriture exacte de LigneResultats) suivi de la grille des
    //  cartes SANS marge ajoutée — les classes livrées.
    const selection = await page.evaluate(
      `((c) => {
        const main = document.querySelector("main");
        const injecter = (avecSousTitre) => {
          const hote = document.createElement("div");
          hote.innerHTML =
            '<div data-titre-essai class="' + c.bloc + '">' +
            '<h1 class="' + c.titreClasse + '">Mes favoris</h1>' +
            (avecSousTitre ? '<p class="' + c.sousTitre + '">Réalisations · Abstrait</p>' : "") +
            '</div>' +
            '<ul data-grille-essai class="' + c.socle + '"><li style="height:80px;background:#232329"></li></ul>';
          main.appendChild(hote);
          const bloc = hote.querySelector("[data-titre-essai]");
          const titreN = bloc.querySelector("h1");
          const sous = bloc.querySelector("p");
          const grilleN = hote.querySelector("[data-grille-essai]");
          const bB = bloc.getBoundingClientRect();
          const bT = titreN.getBoundingClientRect();
          const bS = sous ? sous.getBoundingClientRect() : null;
          const bG = grilleN.getBoundingClientRect();
          const mesure = {
            haut: Math.round(bT.top - bB.top),
            entre: bS ? Math.round(bS.top - bT.bottom) : null,
            bas: Math.round(bG.top - (bS ?? bT).bottom),
          };
          hote.remove();
          return mesure;
        };
        return { filtree: injecter(true), nue: injecter(false) };
      })(${JSON.stringify({
        bloc: classesTitreBloc,
        titreClasse: classesTitreH,
        sousTitre: classesSousTitre,
        socle: socleGrille,
      })})`
    );
    releves[`sélection nue ${largeur}`] = selection.nue;
    releves[`sélection filtrée ${largeur}`] = selection.filtree;
    const r = (nom) => releves[`${nom} ${largeur}`];
    verif(
      `${largeur} px : sélection = recherche, au pixel, dans les deux états`,
      r("sélection filtrée").haut === r("recherche filtrée").haut &&
        r("sélection filtrée").entre === r("recherche filtrée").entre &&
        r("sélection filtrée").bas === r("recherche filtrée").bas &&
        r("sélection nue").haut === r("recherche nue").haut &&
        r("sélection nue").bas === r("recherche nue").bas,
      `recherche ${JSON.stringify(r("recherche filtrée"))} · sélection ${JSON.stringify(
        r("sélection filtrée")
      )}`
    );
  } catch (erreur) {
    nonJoue(`§2 · (${largeur} px)`, String(erreur).slice(0, 90));
  }
  await contexte.close();
}
console.log("\n  LES QUATRE RELEVÉS (haut · entre · bas) :");
for (const [nom, r] of Object.entries(releves)) {
  console.log(
    `   · ${nom} : ${r.haut} · ${r.entre ?? "—"} · ${r.bas ?? "—"}`
  );
}

/* ==================================================================
 * §3 à §7 — LA RANGÉE : SOURCES
 * ================================================================== */
titre("§3/§4/§5/§6/§7 — à la source");
{
  verif(
    "la rangée déborde des marges (marges négatives rendues en rembourrage)",
    /-mx-4 px-4 sm:-mx-6 sm:px-6/.test(classesListe) &&
      /overflow-x-auto/.test(classesListe)
  );
  verif(
    "les voiles anthracite existent, aux conditions des chevrons",
    /from-sombre-fond\/90 to-sombre-fond\/0/.test(gabaritVoile ?? "") &&
      /\{etat\.gauche && voile\(-1\)\}/.test(blocNu) &&
      /\{etat\.droite && voile\(1\)\}/.test(blocNu) &&
      /pointer-events-none/.test(gabaritVoile ?? "")
  );
  verif(
    "au doigt, la case suit la règle des 10 % — largeur déduite, jamais écrite",
    /basis-\[calc\(\(100%\+16px-18px\)\/3\.1\)\]/.test(CASE_RANGEE) &&
      //  … et le web garde ses gabarits d'hier, au caractère près.
      /sm:basis-\[calc\(\(100%-18px\)\/4\.4\)\]/.test(CASE_RANGEE) &&
      /lg:basis-\[calc\(\(100%-24px\)\/5\.4\)\]/.test(CASE_RANGEE) &&
      /xl:basis-\[calc\(\(100%-30px\)\/6\.4\)\]/.test(CASE_RANGEE)
  );
  verif(
    "l'écart entre carrousels s'élargit de 30 % sur le web (48 → 62), le doigt garde 34",
    /gap-\[34px\] lg:gap-\[62px\]/.test(classesGrilleBlocs ?? "")
  );
  verif(
    "20 px entre l'identité et la rangée, une seule valeur (mt-5)",
    /className="group relative mt-5"/.test(blocNu)
  );
  verif(
    "le pas d'une page se lit sur la LARGEUR DE CONTENU (le rembourrage déduit)",
    /const largeurContenu = \(cadre: HTMLElement\)/.test(blocNu) &&
      /Math\.max\(0, etat\.page \+ sens\) \* largeurContenu\(cadre\)/.test(blocNu) &&
      /Math\.round\(contenu \/ pas\)/.test(blocNu)
  );
  verif(
    "les pointillés : au-dessus de la rangée, web seul, bord droit sur la dernière pleine",
    /hidden pointer-fine:flex/.test(classesPoints ?? "") &&
      /bottom-full mb-1\.5/.test(classesPoints ?? "") &&
      /style=\{\{ right: etat\.decalage \}\}/.test(blocNu) &&
      /droite <= droiteContenu \+ 1 && droite > bordDerniere/.test(blocNu)
  );
  verif(
    "le chevron est NU : ni verre, ni disque, ni fond — blanc, 12 × 24, trait 1,8",
    !/data-verre-fenetre/.test(blocNu) &&
      /text-white/.test(gabaritChevron ?? "") &&
      !/rounded-full/.test(gabaritChevron ?? "") &&
      /<svg width="12" height="24"/.test(blocNu) &&
      /strokeWidth="1\.8"/.test(svgChevron ?? "") &&
      //  … apparition sans fondu : la visibilité, le montage — rien
      //  d'autre (les écritures de la nº 254 gardées).
      /invisible group-hover:visible/.test(gabaritChevron ?? "") &&
      /hidden pointer-fine:flex/.test(gabaritChevron ?? "")
  );
  verif(
    "le cœur descend à 9 %, ses 8 px de bords gardés",
    /w-\[9%\]/.test(classesCoeur ?? "") &&
      /bottom-2 right-2/.test(classesCoeur ?? "") &&
      !/w-\[12\.5%\]/.test(blocNu)
  );
}

/* ==================================================================
 * §3 à §7 — LA RANGÉE INJECTÉE, MESURÉE AUX DEUX LARGEURS
 * ================================================================== */
for (const largeur of [390, 1440]) {
  titre(`§3/§4 — la rangée injectée (${largeur} px)`);
  const { contexte, page } = await ouvrirA(largeur, "/");
  try {
    const vu = await page.evaluate(
      `((c) => {
        const main = document.querySelector("main");
        const hote = document.createElement("div");
        hote.setAttribute("data-rangee-essai", "");
        const cases = Array.from({ length: 12 }, (_, i) =>
          '<li class="' + c.caseRangee + '">' +
          '<a class="' + c.vignette + '">' +
          (i === 0 ? '<span data-coeur-aime class="' + c.coeur + '"><svg viewBox="0 0 24 24" class="block h-auto w-full"><path d="M12 21C7 16 2 12 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 4-5 8-10 13z" fill="white"/></svg></span>' : "") +
          '</a></li>'
        ).join("");
        hote.innerHTML =
          '<div class="group relative mt-5">' +
          '<ul data-liste-essai class="' + c.liste + '">' + cases + '</ul>' +
          '<div data-voile-essai-gauche class="' + c.voileGauche + '"></div>' +
          '<div data-voile-essai class="' + c.voileDroit + '"></div>' +
          '<button data-chevron-essai class="' + c.chevron + '">' +
          '<svg width="12" height="24" viewBox="0 0 12 24" fill="none"><path d="M3 4l6 8-6 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</button>' +
          '<div data-points-essai class="' + c.points + '"><span class="h-0.5 w-4 rounded-full bg-white"></span><span class="h-0.5 w-4 rounded-full bg-white/30"></span></div>' +
          '</div>';
        main.appendChild(hote);
        const liste = hote.querySelector("[data-liste-essai]");
        const enfants = [...liste.children];
        const style = getComputedStyle(liste);
        const bListe = liste.getBoundingClientRect();
        const droiteContenu = bListe.right - parseFloat(style.paddingRight);
        //  la meme lecture que le composant : la derniere PLEINE.
        let bordDerniere = 0;
        for (const e of enfants) {
          const d = e.getBoundingClientRect().right;
          if (d <= droiteContenu + 1 && d > bordDerniere) bordDerniere = d;
        }
        const points = hote.querySelector("[data-points-essai]");
        points.style.right = Math.max(0, Math.round(droiteContenu - bordDerniere)) + "px";
        const case1 = enfants[0].getBoundingClientRect();
        //  DEUX partielles : celle qui chevauche le bord de l'ECRAN
        //  (la regle des 10 % du doigt) et celle qui chevauche le bord
        //  de CONTENU (le depassement au repos du web, dans la marge).
        const chevauche = (bord) =>
          enfants
            .find((e) => {
              const b = e.getBoundingClientRect();
              return b.left < bord - 1 && b.right > bord + 1;
            })
            ?.getBoundingClientRect();
        const partielleEcran = chevauche(window.innerWidth);
        const partielle = chevauche(droiteContenu);
        const chevron = hote.querySelector("[data-chevron-essai]");
        const sChevron = getComputedStyle(chevron);
        const svg = chevron.querySelector("svg");
        const voile = hote.querySelector("[data-voile-essai]");
        const sVoile = getComputedStyle(voile);
        const bVoile = voile.getBoundingClientRect();
        //  LA COULEUR DU FONDU, RESOLUE PAR UN CANVAS : Tailwind v4
        //  serialise les arrets du degrade en oklab() — on extrait la
        //  teinte (sans regex : les antislashs ne survivent pas a un
        //  gabarit evaluate), on la peint SANS son alpha sur un canvas
        //  d'un pixel, et on lit le rgb : l'anthracite du fond attendu.
        const image = sVoile.backgroundImage;
        const debutTeinte = image.indexOf("oklab(");
        let fonduRgb = "(illisible)";
        if (debutTeinte >= 0) {
          const finTeinte = image.indexOf(")", debutTeinte);
          const teinte = image.slice(debutTeinte, finTeinte + 1);
          const pleine = teinte.indexOf("/") >= 0
            ? teinte.slice(0, teinte.indexOf("/")) + ")"
            : teinte;
          const toile = document.createElement("canvas");
          toile.width = 1; toile.height = 1;
          const pinceau = toile.getContext("2d");
          pinceau.fillStyle = pleine;
          pinceau.fillRect(0, 0, 1, 1);
          const px = pinceau.getImageData(0, 0, 1, 1).data;
          fonduRgb = "rgb(" + px[0] + ", " + px[1] + ", " + px[2] + ")";
        }
        const fonduAlpha = image.indexOf("/ 0.9)") >= 0;
        const bVoileG = hote.querySelector("[data-voile-essai-gauche]").getBoundingClientRect();
        const coeur = hote.querySelector("[data-coeur-aime]").getBoundingClientRect();
        const bPoints = points.getBoundingClientRect();
        const sPoints = getComputedStyle(points);
        const mesure = {
          ecran: window.innerWidth,
          documentPropre:
            document.documentElement.scrollWidth === document.documentElement.clientWidth,
          liste: { gauche: bListe.left, droite: bListe.right },
          contenuDroite: droiteContenu,
          caseL: case1.width,
          caseH: case1.height,
          case1Gauche: case1.left,
          partielle: partielle
            ? { gauche: partielle.left, droite: partielle.right }
            : null,
          partielleEcran: partielleEcran
            ? { visible: window.innerWidth - partielleEcran.left }
            : null,
          voile: {
            image: sVoile.backgroundImage.slice(0, 120),
            couleur: fonduRgb,
            legerementTransparent: fonduAlpha,
            gauche: Math.round(bVoileG.left),
            droite: Math.round(bVoile.right),
            largeur: Math.round(bVoile.width),
          },
          chevron: {
            affichage: sChevron.display,
            visibilite: sChevron.visibility,
            fond: sChevron.backgroundColor,
            rayon: sChevron.borderRadius,
            couleur: sChevron.color,
            filtreArriere: sChevron.backdropFilter ?? "none",
            svg: svg ? { l: svg.getBoundingClientRect().width, h: svg.getBoundingClientRect().height } : null,
          },
          coeur: { l: coeur.width },
          points: {
            affichage: sPoints.display,
            bordDroit: bPoints.right,
            derniereVignettePleine: bordDerniere,
            hautListe: bListe.top,
            basPoints: bPoints.bottom,
          },
        };
        hote.remove();
        return mesure;
      })(${JSON.stringify({
        caseRangee: CASE_RANGEE,
        vignette: classesVignette,
        coeur: classesCoeur,
        liste: classesListe,
        voileGauche: classesVoile(-1),
        voileDroit: classesVoile(1),
        chevron: classesChevron,
        points: classesPoints,
      })})`
    );
    verif(
      `${largeur} px : la rangée s'étend d'un bord de l'écran à l'autre`,
      Math.abs(vu.liste.gauche) <= 1 && Math.abs(vu.liste.droite - vu.ecran) <= 1,
      `gauche ${vu.liste.gauche.toFixed(1)} · droite ${vu.liste.droite.toFixed(1)} / ${vu.ecran}`
    );
    verif(
      `${largeur} px : LE PIÈGE DE LA nº 228 — le débordement vit dans la rangée, jamais dans la page`,
      vu.documentPropre
    );
    if (largeur === 390) {
      const attendue = (390 - 32 + 16 - 18) / 3.1;
      verif(
        "390 px : la taille des vignettes DÉCOULE de la règle des 10 %",
        Math.abs(vu.caseL - attendue) <= 0.6,
        `mesurée ${vu.caseL.toFixed(1)} · attendue ${attendue.toFixed(1)}`
      );
      verif(
        "390 px : la vignette de droite montre EXACTEMENT 10 % au bord de l'écran",
        Boolean(vu.partielleEcran) &&
          Math.abs(vu.partielleEcran.visible - vu.caseL * 0.1) <= 1,
        vu.partielleEcran
          ? `visible ${vu.partielleEcran.visible.toFixed(1)} · 10 % = ${(vu.caseL * 0.1).toFixed(1)}`
          : "(aucune partielle)"
      );
      verif(
        "390 px : le format 4/5 tient (la hauteur suit la largeur)",
        Math.abs(vu.caseH - vu.caseL * 1.25) <= 1,
        `${vu.caseL.toFixed(1)} × ${vu.caseH.toFixed(1)}`
      );
      verif(
        "390 px : au doigt, NI chevron NI pointillés",
        vu.chevron.affichage === "none" && vu.points.affichage === "none",
        `chevron ${vu.chevron.affichage} · points ${vu.points.affichage}`
      );
    } else {
      //  À 1440, c'est le palier xl (6,4 · 30 px d'écarts) qui parle.
      const attendue = (1440 - 48 - 30) / 6.4;
      verif(
        "1440 px : les vignettes du web n'ont pas bougé — ni largeur, ni hauteur, ni format",
        Math.abs(vu.caseL - attendue) <= 0.6 &&
          Math.abs(vu.caseH - vu.caseL * 1.25) <= 1,
        `mesurée ${vu.caseL.toFixed(1)} (attendue ${attendue.toFixed(1)}) · hauteur ${vu.caseH.toFixed(1)}`
      );
      verif(
        "1440 px : la vignette de droite dépasse DÈS LE REPOS (elle chevauche la marge)",
        Boolean(vu.partielle) && vu.partielle.droite > vu.contenuDroite + 4,
        vu.partielle
          ? `partielle → ${vu.partielle.droite.toFixed(1)} · contenu ${vu.contenuDroite.toFixed(1)}`
          : "(aucune partielle)"
      );
      verif(
        "1440 px : le chevron est nu — blanc, sans fond, sans rayon, sans verre, 12 × 24",
        vu.chevron.affichage !== "none" &&
          vu.chevron.fond === "rgba(0, 0, 0, 0)" &&
          (vu.chevron.rayon === "0px" || vu.chevron.rayon === "") &&
          vu.chevron.couleur === "rgb(255, 255, 255)" &&
          (vu.chevron.filtreArriere === "none" || !vu.chevron.filtreArriere) &&
          Math.abs(vu.chevron.svg.l - 12) <= 0.5 &&
          Math.abs(vu.chevron.svg.h - 24) <= 0.5,
        `fond ${vu.chevron.fond} · rayon ${vu.chevron.rayon} · svg ${vu.chevron.svg.l}×${vu.chevron.svg.h}`
      );
      verif(
        "1440 px : les pointillés vivent AU-DESSUS de la rangée, bord droit sur la dernière vignette PLEINE",
        vu.points.affichage !== "none" &&
          vu.points.basPoints <= vu.points.hautListe - 4 &&
          Math.abs(vu.points.bordDroit - vu.points.derniereVignettePleine) <= 1,
        `bas points ${vu.points.basPoints.toFixed(1)} · haut rangée ${vu.points.hautListe.toFixed(1)} · bords ${vu.points.bordDroit.toFixed(1)} / ${vu.points.derniereVignettePleine.toFixed(1)}`
      );
    }
    verif(
      `${largeur} px : les voiles couvrent les marges — l'anthracite du fond, légèrement transparent`,
      /linear-gradient/.test(vu.voile.image) &&
        //  la couleur du dégradé, résolue par le navigateur : #1A1A1D.
        vu.voile.couleur === "rgb(26, 26, 29)" &&
        vu.voile.legerementTransparent &&
        Math.abs(vu.voile.droite - vu.ecran) <= 1 &&
        Math.abs(vu.voile.gauche) <= 1 &&
        vu.voile.largeur === (largeur === 390 ? 16 : 24),
      `couleur ${vu.voile.couleur} · alpha 0,9 ${vu.voile.legerementTransparent} · bords ${vu.voile.gauche}/${vu.voile.droite} · largeur ${vu.voile.largeur}`
    );
    verif(
      `${largeur} px : le cœur (9 %) est plus discret que celui des cartes (24 px)`,
      vu.coeur.l < 24 && Math.abs(vu.coeur.l - vu.caseL * 0.09) <= 1,
      `cœur ${vu.coeur.l.toFixed(1)} px · carte 24 px · vignette ${vu.caseL.toFixed(1)}`
    );
  } catch (erreur) {
    nonJoue(`§3/§4 · injection (${largeur} px)`, String(erreur).slice(0, 90));
  }
  await contexte.close();
}
{
  //  Le cœur des CARTES, à la source : le témoin des 24 px du relevé.
  verif(
    "témoin : le cœur des cartes de favoris est bien le glyphe de 24 px",
    /variante === "carte" \? 24 : 30/.test(coeurCarte)
  );
}
{
  //  §3 — l'écart de 30 % entre deux carrousels, mesuré.
  const { contexte, page } = await ouvrirA(1440, "/");
  try {
    const ecarts = await page.evaluate(
      `((classes) => {
        const hote = document.createElement("div");
        hote.innerHTML =
          '<ul data-essai-ecart class="' + classes + '">' +
          '<li style="height:40px"></li><li style="height:40px"></li></ul>';
        document.body.appendChild(hote);
        const [a, b] = hote.querySelectorAll("li");
        const ecart = b.getBoundingClientRect().top - a.getBoundingClientRect().bottom;
        hote.remove();
        return Math.round(ecart);
      })(${JSON.stringify(classesGrilleBlocs)})`
    );
    verif(
      "1440 px : 62 px entre deux carrousels (48 + 30 %)",
      ecarts === 62,
      `${ecarts} px`
    );
  } catch (erreur) {
    nonJoue("§3 · écart carrousels", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

nonJoue(
  "« Ma sélection » vivante (les rangées réelles)",
  "la page exige une session (Supabase hors de portée) : les rangées ne " +
    "se montent pas ici. Le débordement, la règle des 10 %, les voiles, " +
    "le chevron, les pointillés et le cœur sont mesurés par INJECTION " +
    "des écritures livrées (classes et gabarits résolus) dans le vrai " +
    "<main> de la page vivante, aux deux largeurs ; les états montés/" +
    "démontés (voiles, chevrons, décalage des pointillés) sont vérifiés " +
    "à la source. Seuls le montage React et le défilement réel restent " +
    "à l'appareil"
);

bilan();
