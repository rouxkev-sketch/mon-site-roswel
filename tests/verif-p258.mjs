/**
 * BANC DE LA PASSE Nº 258
 * ==================================================================
 * §1 à 390 : les trois blocs à 46 px (−11 % de 52, arrondi au pixel),
 *    identiques et alignés entre eux ; la barre réduite d'autant
 *    (128 → 122), la réserve suit, scrollY immobile ;
 * §2 à 1440 : l'encadré du moteur À LA HAUTEUR RELEVÉE SUR LES
 *    CERCLES (jamais un nombre choisi), la barre web inchangée
 *    (76 px, le relevé d'avant la passe) ; l'encadré de « Ma
 *    sélection » pareil, par injection ;
 * §3 : plus aucune ligne étroite — ni au code ni à l'écran ; DEUX
 *    hauteurs de réserve (122 / 64) ; la courbe et la durée du
 *    rabattement comparées à la rangée de recherche VIVANTE ;
 * §4 : la pilule un cran au-dessus de son fond dans les TROIS états
 *    (repos, survol, focus) — l'écart mesuré, jamais nul ;
 * §5 : au moins 12 px à droite de la flèche du menu (20, l'air des
 *    mots du badge) ;
 * §6 : la cause du trait fantôme NOMMÉE et mesurée (une seule icône,
 *    aucun fondu, le débord du cadre : voir BoutonPhototheque), et le
 *    glyphe propre sur vingt bascules ;
 * §7 : aucun débordement du document.
 *
 * ⚠️ « Ma sélection » exige une session (base hors de portée) : son
 * bloc est mesuré PAR INJECTION des classes réelles (branches
 * résolues) — dit NON JOUÉ pour le montage React seul.
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

const nettoyer = (t) => (t ?? "").replace(/\s+/g, " ").trim();
const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const menus = lire("src/components/MenusSelection.tsx");
const menusNus = sansNotes(menus);
const barre = lire("src/components/EnTeteTatouage.tsx");
const barreNue = sansNotes(barre);
const encadre = lire("src/components/EncadreBarre.tsx");
const capsule = lire("src/components/SelecteurCapsule.tsx");

/* ==================================================================
 * §1/§3 — À LA SOURCE
 * ================================================================== */
titre("§1/§3/§5 — à la source : 46 partout, la ligne étroite morte, la flèche");
{
  const moteur = lire("src/components/MoteurTatouage.tsx");
  verif(
    "les trois hauteurs du doigt : 46 (−11 % de 52, arrondi au pixel entier)",
    /px-5 min-h-\[46px\] transition-colors/.test(moteur) &&
      /w-\[46px\] h-\[46px\] rounded-full\s*\n\s*text-sombre-texte\s*\n\s*flex items-center justify-center active:opacity-80/.test(
        moteur
      ) &&
      /diametre=\{46\} retourAuDoigt/.test(moteur) &&
      !/min-h-\[52px\]|w-\[52px\] h-\[52px\]/.test(sansNotes(moteur).replace(/min-h-\[52px\]"?\s*mobile:min-h-0/g, "").replace(/gap-2\.5 min-h-\[52px\]/g, ""))
  );
  verif(
    "l'encadré du web aussi : le menu, le champ de localité, « Ma sélection »",
    /hauteur="min-h-\[46px\]"/.test(moteur) &&
      /min-h-\[46px\] bg-transparent/.test(lire("src/components/ChampLocalisation.tsx")) &&
      /hauteur="min-h-\[46px\]"/.test(menus)
  );
  verif(
    "la barre web garde sa zone (min-h-[52px] sur les rangées à souris)",
    /items-center gap-2\.5 min-h-\[52px\]"/.test(moteur) &&
      /min-h-\[52px\] mobile:min-h-0/.test(menus)
  );
  verif(
    "§3 — la ligne étroite a entièrement disparu du dépôt",
    !/data-ligne-repliee/.test(menus) &&
      !/IconeChevronBas/.test(menus) &&
      !/surDeploiement/.test(menus) &&
      !/surDeploiement|deplier/.test(sansNotes(lire("src/components/BarreSelection.tsx")))
  );
  verif(
    "§3 — la réserve n'a plus que DEUX hauteurs : 122 et 64",
    /data-reserve-posee=\{rangeePresente && !moteurReplie \? 122 : 64\}/.test(barre) &&
      /data-reserve-depliee=\{rangeePresente \? 122 : 64\}/.test(barre) &&
      /h-\[122px\]/.test(barre) &&
      !/104|h-\[104px\]/.test(barreNue)
  );
  //  ⚠️ MIS À JOUR nº 259-§2 : le bloc n'écrit plus son propre
  //  rabattement — c'est L'ENVELOPPE DE LA BARRE qui replie les deux
  //  rangées, avec les jetons du moteur (le bloc gardait un second
  //  pliage, et les 12 px de son air restaient à l'écran). Ce que
  //  CETTE passe exigeait — mêmes jetons que la rangée du moteur — se
  //  lit désormais à un seul endroit.
  verif(
    "§3 — le rabattement : les jetons du moteur, dans UNE seule enveloppe",
    /max-lg:transition-\[grid-template-rows,opacity\]\s*\n?\s*max-lg:duration-300 max-lg:ease-out/.test(
      barre
    ) && !/transition-\[grid-template-rows,opacity\]/.test(menus)
  );
  verif(
    "§5 — la flèche du menu : l'air des mots du badge (20 px ≥ le plancher de 12)",
    /positionFleche="right 1\.25rem center"/.test(menus) &&
      /positionFleche \?\? \(compact \? "right 0\.65rem center" : "right 0\.9rem center"\)/.test(
        lire("src/components/MenuDeroulant.tsx")
      )
  );
  verif(
    "§1 — la pilule du badge suit l'encadré : 38 (46 − 2 × 4 d'air), la fiche garde 44",
    /hauteurMot="min-h-\[38px\]"/.test(menus) &&
      /hauteurMot = "min-h-\[44px\]"/.test(capsule) &&
      !/hauteurMot/.test(lire("src/components/PortfolioDeLAffiche.tsx"))
  );
}

titre("§4 — à la source : la robe de la pilule est RELATIVE (globals.css)");
{
  const css = lire("src/app/globals.css");
  verif(
    "au repos, la pilule prend LE BARREAU AU-DESSUS du fond (la variable existante)",
    /\[data-clair-barre\] \[data-capsule-glissante\] \{\s*background-color: var\(--rw-clair-barre-vif\);/.test(
      css
    )
  );
  verif(
    "au survol, à l'appui, au focus et panneau ouvert : un barreau de plus",
    /\[data-clair-barre\]:hover \[data-capsule-glissante\],\s*\[data-clair-barre\]:active \[data-capsule-glissante\],\s*\[data-clair-barre\]:focus-within \[data-capsule-glissante\],\s*\[data-clair-barre\]\[data-clair-vif\] \[data-capsule-glissante\] \{\s*background-color: var\(--rw-clair-pilule-vif\);/.test(
      css
    ) && /--rw-clair-pilule-vif: #55555f;/.test(css)
  );
  verif(
    "la barre ne passe plus de robe (le CSS habille), la fiche garde la sienne",
    /robeCapsule=""/.test(menusNus) &&
      /robeCapsule = "bg-sombre-haut"/.test(capsule) &&
      //  La mécanique gravée nº 175 n'a pas bougé d'une ligne.
      /\[data-clair-barre\]:hover,\s*\[data-clair-barre\]:active,\s*\[data-clair-barre\]:focus-within,\s*\[data-clair-barre\]\[data-clair-vif\] \{\s*background-color: var\(--rw-clair-barre-vif\);/.test(
        css
      )
  );
}

/* ==================================================================
 * §1 — VIVANT À 390 : les trois blocs, la barre, la réserve
 * ================================================================== */
titre("§1 — VIVANT (390 px) : trois blocs à 46, la barre à 122, scrollY immobile");
{
  const { contexte, page } = await ouvrirA(390, "/");
  try {
    const yAuChargement = await page.evaluate(() => Math.round(window.scrollY));
    const vu = await page.evaluate(() => {
      const boite = (n) => n?.getBoundingClientRect();
      const champ = boite(document.querySelector('button[aria-haspopup="dialog"]'));
      const ronds = [...document.querySelectorAll("[data-clair-barre]")]
        .filter((n) => /rounded-full/.test(n.className) && n.offsetHeight > 0 && n.tagName === "BUTTON")
        .map((n) => boite(n));
      const cale = document.querySelector("[data-reserve-barre]");
      return {
        champ: { h: champ?.height ?? 0, haut: champ?.top ?? 0, bas: champ?.bottom ?? 0 },
        ronds: ronds.map((r) => ({ h: r.height, haut: r.top, bas: r.bottom })),
        header: Math.round(boite(document.querySelector("[data-barre-fixe]"))?.height ?? 0),
        reserve: Number(cale?.getAttribute("data-reserve-posee")),
        hauteurCale: Math.round(boite(cale)?.height ?? 0),
        debordement:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    verif(
      "390 px : le champ et les deux ronds font 46, LA MÊME hauteur au pixel",
      Math.round(vu.champ.h) === 46 &&
        vu.ronds.length >= 2 &&
        vu.ronds.every((r) => Math.round(r.h) === 46),
      `champ ${Math.round(vu.champ.h)} · ronds ${vu.ronds.map((r) => Math.round(r.h)).join("/")}`
    );
    verif(
      "390 px : les trois restent ALIGNÉS au pixel (mêmes haut et bas)",
      vu.ronds.every(
        (r) => Math.abs(r.haut - vu.champ.haut) <= 0.5 && Math.abs(r.bas - vu.champ.bas) <= 0.5
      ),
      `haut ${Math.round(vu.champ.haut)} · bas ${Math.round(vu.champ.bas)}`
    );
    verif(
      "390 px : la barre a rendu l'espace — 122 (64 + 12 + 46), réserve comprise",
      vu.header === 122 && vu.reserve === 122 && vu.hauteurCale === 122,
      `barre ${vu.header} · réserve annoncée ${vu.reserve} · cale ${vu.hauteurCale}`
    );
    await page.waitForTimeout(1000);
    const yApres = await page.evaluate(() => Math.round(window.scrollY));
    verif(
      "390 px : scrollY immobile au chargement et une seconde après",
      yAuChargement === 0 && yApres === 0,
      `${yAuChargement} → ${yApres}`
    );
    verif(
      "390 px : §7 — le document ne déborde pas",
      vu.debordement === 0,
      `scrollWidth − clientWidth = ${vu.debordement}`
    );

    /*  §3 — LE RABATTEMENT, VIVANT : la rangée de recherche se replie
        à 64 et se redéploie à 122 ; sa courbe et sa durée sont LE
        relevé auquel le bloc doit être identique. */
    const releveMoteur = await page.evaluate(() => {
      const rangee = document.querySelector("[data-rangee-moteur]");
      const s = getComputedStyle(rangee);
      return { duree: s.transitionDuration, courbe: s.transitionTimingFunction };
    });
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(700);
    const replie = await page.evaluate(() => ({
      reserve: Number(
        document.querySelector("[data-reserve-barre]").getAttribute("data-reserve-posee")
      ),
      ligneEtroite: document.querySelector("[data-ligne-repliee]") !== null,
    }));
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(700);
    const redeplie = await page.evaluate(() =>
      Number(document.querySelector("[data-reserve-barre]").getAttribute("data-reserve-posee"))
    );
    /*  LE SECOND RELEVÉ — ⚠️ MIS À JOUR nº 259-§2 : le bloc n'a plus
        de pliage à lui. On mesure donc L'ENVELOPPE DE LA BARRE, sur
        ses classes réelles lues à la source (branches résolues) : la
        rangée libre et celle du moteur la partagent désormais. */
    const releveBloc = await page.evaluate(
      `((classes) => {
        const hote = document.createElement("div");
        hote.innerHTML = '<div data-b class="' + classes + '"></div>';
        document.body.appendChild(hote);
        const s = getComputedStyle(hote.querySelector("[data-b]"));
        const vu = { duree: s.transitionDuration, courbe: s.transitionTimingFunction };
        hote.remove();
        return vu;
      })(${JSON.stringify(
        nettoyer(
          barre
            .match(/className=\{`(order-3 lg:order-2 basis-full[\s\S]*?)`\}/)?.[1]
            ?.replace(
              /\$\{\s*rangeePresente\s*\?\s*`([\s\S]*?)`\s*:\s*"[^"]*"\s*\}/,
              "$1"
            )
            .replace(
              /\$\{\s*moteurReplie\s*\?\s*"([^"]*)"\s*:\s*"[^"]*"\s*\}/,
              "$1"
            )
        )
      )})`
    );
    verif(
      "§3 — replié il ne reste RIEN (64, aucune ligne étroite), redéployé 122",
      replie.reserve === 64 && !replie.ligneEtroite && redeplie === 122,
      `122 → ${replie.reserve} → ${redeplie} · ligne étroite ${replie.ligneEtroite ? "PRÉSENTE" : "absente"}`
    );
    verif(
      "§3 — les deux relevés du rabattement, identiques (moteur vivant / enveloppe)",
      releveMoteur.duree === releveBloc.duree &&
        releveMoteur.courbe === releveBloc.courbe &&
        /0\.3s/.test(releveMoteur.duree) &&
        /cubic-bezier\(0, 0, 0\.2, 1\)/.test(releveMoteur.courbe),
      `moteur ${releveMoteur.duree} ${releveMoteur.courbe} · enveloppe ${releveBloc.duree} ${releveBloc.courbe}`
    );
  } catch (erreur) {
    nonJoue("§1 · vivant 390", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §2 — VIVANT À 1440 : la hauteur des cercles, relevée puis comparée
 * ================================================================== */
titre("§2 — VIVANT (1440 px) : tout à la hauteur RELEVÉE des cercles");
{
  const { contexte, page } = await ouvrirA(1440, "/", { mobile: false });
  try {
    const vu = await page.evaluate(() => {
      const boite = (s) => document.querySelector(s)?.getBoundingClientRect();
      return {
        cercleFiltres: Math.round(boite('button[aria-label="Filtres"]')?.height ?? 0),
        cerclePhoto: Math.round(boite("[data-bouton-phototheque]")?.height ?? 0),
        encadreMoteur: Math.round(boite("[data-encadre-barre]")?.height ?? 0),
        header: Math.round(boite("[data-barre-fixe]")?.height ?? 0),
        debordement:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    verif(
      "1440 px : l'encadré du moteur = la hauteur des cercles, relevée (pas choisie)",
      vu.encadreMoteur === vu.cercleFiltres &&
        vu.encadreMoteur === vu.cerclePhoto &&
        vu.cercleFiltres === 46,
      `encadré ${vu.encadreMoteur} · cercles ${vu.cercleFiltres}/${vu.cerclePhoto}`
    );
    verif(
      "1440 px : la hauteur de la barre n'a pas bougé (76, le relevé d'avant)",
      vu.header === 76,
      `${vu.header} px`
    );
    verif(
      "1440 px : §7 — le document ne déborde pas",
      vu.debordement === 0,
      `scrollWidth − clientWidth = ${vu.debordement}`
    );
  } catch (erreur) {
    nonJoue("§2 · vivant 1440", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §2/§4 — LE BLOC DE « MA SÉLECTION », INJECTÉ (1440) : hauteurs et
 * pilule relative dans les trois états
 * ================================================================== */
const classeEncadre = nettoyer(
  encadre
    .match(/className=\{`(flex items-stretch[^`]*)`\}/)?.[1]
    ?.replace(/\$\{\s*porteBadge \? "([^"]+)" : "[^"]+"\s*\}/, "$1")
);
const classeMoitieBadge = nettoyer(
  encadre.match(/\? "(shrink-0 grow-0 basis-1\/2 box-content[^"]+)"/)?.[1]
);
const classeMoitieChamp = nettoyer(
  encadre.match(/<div className="(flex-1 min-w-0 basis-1\/2)">\{droite\}/)?.[1]
);
const classeTrait = nettoyer(encadre.match(/className="(w-px my-2\.5[^"]*)"/)?.[1]);
const hauteurChamp = menus.match(/hauteur="(min-h-\[\d+px\])"/)?.[1] ?? "";
const hauteurMot = menus.match(/hauteurMot="(min-h-\[\d+px\])"/)?.[1] ?? "";
const classeBadge = nettoyer(
  capsule
    .match(/data-selecteur-capsule=""[\s\S]*?className=\{`([^`]+)`\}/)?.[1]
    ?.replace(/\$\{[^}]*"w-full"[^}]*\}/, "w-full")
);
const classeHote = nettoyer(
  capsule.match(/data-hote-capsule="" className="([^"]+)"/)?.[1]
);
const gabaritMot = capsule.match(/className=\{`(relative z-\[1\][^`]+)`\}/)?.[1];
const classeMot = (actif) =>
  nettoyer(
    gabaritMot
      ?.replace(/\$\{hauteurMot\}/, hauteurMot)
      .replace(/\$\{[^}]*"flex-1 basis-1\/2 min-w-0"[^}]*\}/, "flex-1 basis-1/2 min-w-0")
      .replace(
        /\$\{[^}]*actif[^}]*\}/,
        actif ? "text-sombre-texte" : "text-sombre-texte-doux"
      )
  );
//  ⚠️ LA ROBE DE LA PILULE EST VIDE DEPUIS LA §4 : le CSS d'attribut
//  habille — c'est précisément ce qu'on mesure.
const classeCapsuleGlissante = nettoyer(
  capsule
    .match(/data-capsule-glissante=""[\s\S]*?className=\{`([^`]+)`\}/)?.[1]
    ?.replace(/\$\{robeCapsule\}/, "")
);

titre("§2/§4 — le bloc injecté (1440 px) : 46, le badge 38, la pilule relative");
{
  const { contexte, page } = await ouvrirA(1440, "/", { mobile: false });
  try {
    const vu = await page.evaluate(
      `(async (c) => {
        const hote = document.createElement("div");
        //  FIXE ET DANS LA FENÊTRE (leçon nº 253) : le survol réel.
        hote.style.cssText = "position:fixed;top:200px;left:120px;width:720px;z-index:9999";
        const mot = (actif, texte, classe) =>
          '<button type="button" role="radio" aria-checked="' + (actif ? "true" : "false") +
          '" class="' + classe + '">' + texte + '</button>';
        hote.innerHTML =
          '<div data-encadre-barre data-clair-barre class="' + c.encadre + '">' +
            '<div class="' + c.moitieBadge + '">' +
              '<div data-hote-capsule class="' + c.hote + '">' +
              '<div data-selecteur-capsule role="radiogroup" class="' + c.badge + '">' +
              '<span data-capsule-glissante class="' + c.capsule + '"></span>' +
              mot(true, "Favoris", c.motActif) + mot(false, "Suivis", c.motDormant) +
              '</div></div>' +
            '</div>' +
            '<div data-trait aria-hidden="true" class="' + c.trait + '"></div>' +
            '<div class="' + c.moitieChamp + '">' +
              '<button data-champ type="button" class="w-full ' + c.hauteur +
              ' text-base pl-4 pr-10 text-left">Toutes les réalisations</button>' +
            '</div>' +
          '</div>';
        document.body.appendChild(hote);
        const cadre = hote.querySelector("[data-encadre-barre]");
        const zone = hote.querySelector("[data-selecteur-capsule]");
        const pilule = hote.querySelector("[data-capsule-glissante]");
        const lireEtat = () => ({
          fond: getComputedStyle(cadre).backgroundColor,
          robe: getComputedStyle(pilule).backgroundColor,
        });
        const bCadre = cadre.getBoundingClientRect();
        const bZone = zone.getBoundingClientRect();
        const mesure = {
          encadre: bCadre.height,
          rayon: parseFloat(getComputedStyle(cadre).borderRadius),
          badge: bZone.height,
          pilule: pilule.getBoundingClientRect().height,
          airHaut: bZone.top - bCadre.top,
          airBas: bCadre.bottom - bZone.bottom,
          repos: lireEtat(),
          boite: { x: bCadre.left + 40, y: bCadre.top + bCadre.height / 2 },
        };
        window.__p258 = { hote, cadre, lireEtat };
        return mesure;
      })(${JSON.stringify({
        encadre: classeEncadre,
        moitieBadge: classeMoitieBadge,
        moitieChamp: classeMoitieChamp,
        trait: classeTrait,
        hauteur: hauteurChamp,
        badge: classeBadge,
        hote: classeHote,
        capsule: classeCapsuleGlissante,
        motActif: classeMot(true),
        motDormant: classeMot(false),
      })})`
    );
    verif(
      "l'encadré de « Ma sélection » : 46 (la hauteur des cercles), toujours capsule",
      vu.encadre === 46 && vu.rayon >= 23,
      `${Math.round(vu.encadre)} px · rayon effectif ${Math.min(Math.round(vu.rayon), 23)}`
    );
    verif(
      "le badge suit : 38 (46 − 2 × 4), l'air de 4 px conservé",
      vu.badge === 38 &&
        vu.pilule === 38 &&
        Math.abs(vu.airHaut - 4) <= 0.5 &&
        Math.abs(vu.airBas - 4) <= 0.5,
      `badge ${Math.round(vu.badge)} · pilule ${Math.round(vu.pilule)} · air ${vu.airHaut.toFixed(1)}/${vu.airBas.toFixed(1)}`
    );
    /*  §4 — LES TROIS ÉTATS. L'écart se mesure canal par canal : la
        pilule STRICTEMENT plus claire que son fond, à chaque fois. */
    const plusClair = (robe, fond) =>
      robe.match(/\d+/g).every((canal, rang) => Number(canal) > Number(fond.match(/\d+/g)[rang]));
    verif(
      "§4 — AU REPOS : la pilule un cran au-dessus du fond",
      vu.repos.fond === "rgb(65, 65, 73)" &&
        vu.repos.robe === "rgb(75, 75, 84)" &&
        plusClair(vu.repos.robe, vu.repos.fond),
      `fond ${vu.repos.fond} · pilule ${vu.repos.robe}`
    );
    await page.mouse.move(vu.boite.x, vu.boite.y);
    await page.waitForTimeout(350);
    const auSurvol = await page.evaluate(() => window.__p258.lireEtat());
    verif(
      "§4 — AU SURVOL : le fond monte d'un barreau, la pilule aussi — l'écart tient",
      auSurvol.fond === "rgb(75, 75, 84)" &&
        auSurvol.robe === "rgb(85, 85, 95)" &&
        plusClair(auSurvol.robe, auSurvol.fond),
      `fond ${auSurvol.fond} · pilule ${auSurvol.robe}`
    );
    await page.mouse.move(5, 700);
    await page.evaluate(() => window.__p258.hote.querySelector("[data-champ]").focus());
    await page.waitForTimeout(350);
    const auFocus = await page.evaluate(() => window.__p258.lireEtat());
    await page.evaluate(() => window.__p258.hote.remove());
    verif(
      "§4 — AU FOCUS : pareil — l'écart ne s'annule jamais",
      auFocus.fond === "rgb(75, 75, 84)" &&
        auFocus.robe === "rgb(85, 85, 95)" &&
        plusClair(auFocus.robe, auFocus.fond),
      `fond ${auFocus.fond} · pilule ${auFocus.robe}`
    );
  } catch (erreur) {
    nonJoue("§2/§4 · injection", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §6 — LE TRAIT FANTÔME : la cause mesurée, le glyphe propre ×20
 * ================================================================== */
titre("§6 — le trait fantôme (1440 px) : cause nommée, vingt bascules propres");
{
  verif(
    "la cause est NOMMÉE à la source, et le remède n'est pas un masque",
    /INVALIDATION DE PEINTURE INCOMPLÈTE/.test(lire("src/components/BoutonPhototheque.tsx")) &&
      /\[contain:paint\]/.test(lire("src/components/BoutonPhototheque.tsx")) &&
      /<IconeCartes key="cartes"/.test(lire("src/components/BoutonPhototheque.tsx"))
  );
  const { contexte, page } = await ouvrirA(1440, "/", { mobile: false });
  try {
    const bascules = [];
    for (let rang = 0; rang < 20; rang += 1) {
      await page.locator("[data-bouton-phototheque]:visible").first().click();
      await page.waitForTimeout(120);
      bascules.push(
        await page.evaluate(async () => {
          const bouton = document.querySelector("[data-bouton-phototheque]");
          const svgs = bouton.querySelectorAll("svg");
          const s = getComputedStyle(svgs[0]);
          //  LE GLYPHE COURANT, RASTERISÉ : en vue photothèque (le T),
          //  RIEN ne doit exister à gauche de x = 4/24 — la colonne où
          //  vivait le bord du cadre de l'icône photo.
          const source = new XMLSerializer().serializeToString(svgs[0]);
          const image = new Image();
          const chargee = new Promise((f, r) => { image.onload = f; image.onerror = r; });
          image.src = "data:image/svg+xml;base64," + btoa(source);
          await chargee;
          const toile = document.createElement("canvas");
          toile.width = 96; toile.height = 96;
          const encre = toile.getContext("2d");
          encre.drawImage(image, 0, 0, 96, 96);
          const pixels = encre.getImageData(0, 0, 96, 96).data;
          let aGauche = 0;
          for (let y = 0; y < 96; y += 1)
            for (let x = 0; x < 15; x += 1)
              if (pixels[(y * 96 + x) * 4 + 3] > 8) aGauche += 1;
          return {
            svgs: svgs.length,
            opacite: s.opacity,
            visibilite: s.visibility,
            fonduCroise: /opacity/.test(getComputedStyle(bouton).transitionProperty),
            enT: bouton.getAttribute("aria-pressed") === "true",
            aGauche,
          };
        })
      );
    }
    const enT = bascules.filter((b) => b.enT);
    verif(
      "vingt bascules : UNE seule icône montée, jamais d'opacité ni de fondu croisé",
      bascules.every(
        (b) => b.svgs === 1 && b.opacite === "1" && b.visibilite === "visible" && !b.fonduCroise
      ),
      `${bascules.length} bascules`
    );
    verif(
      "le « T » ne peint RIEN à gauche de son chapeau, sur ses dix passages",
      enT.length >= 8 && enT.every((b) => b.aGauche === 0),
      `${enT.length} passages en T · pixels fantômes ${enT.map((b) => b.aGauche).join(",")}`
    );
  } catch (erreur) {
    nonJoue("§6 · bascules", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

nonJoue(
  "« Ma sélection » vivante",
  "la page exige une session (base hors de portée) : son bloc est mesuré " +
    "par INJECTION des classes réelles (branches résolues) dans la page " +
    "vivante — hauteurs, capsule, pilule relative aux trois états — et la " +
    "rétractation, la réserve et les trois blocs du doigt sont éprouvés " +
    "vivants sur l'accueil, qui partage la barre — seul le montage React " +
    "de la page n'est pas éprouvé"
);

process.exit(bilan());
