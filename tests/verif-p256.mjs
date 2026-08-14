/**
 * BANC DE LA PASSE Nº 256
 * ==================================================================
 * §1 l'encadré UNIQUE reste (badge puis champ) et devient une CAPSULE :
 *    rayon à la moitié de sa hauteur, aux deux largeurs ; le champ n'a
 *    plus de forme propre ; aucun contour nulle part ;
 * §2 le badge (la pilule) devient PLUS CLAIR que l'encadré — le cran
 *    franc au-dessus (`haut` → `haut-clair`), mesuré ;
 * §3 le badge ne touche rien : 4 px d'air en haut, en bas et à gauche,
 *    12 px à sa droite avant le fin trait ;
 * §4 hauteur 44, courbure et largeurs de mots de la nº 255, une à une
 *    (87/91 à 390, 164/168 à 1440) — l'air est cédé par le champ ;
 * §5 l'emplacement de l'icône réservé EN PERMANENCE : largeur du champ
 *    et bord gauche de « Favoris » identiques au pixel entre les deux
 *    états ;
 * §6 au doigt, le champ ne dit que la CATÉGORIE (chevron gardé) ;
 * §7 la rétractation inchangée (recherche vivante), aucun débordement.
 *
 * ⚠️ « Ma sélection » exige une session (base hors de portée) : le
 * bloc est mesuré PAR INJECTION des classes réelles, lues à la source
 * (les branches `porteBadge` résolues, jamais réécrites), et les
 * prédicats de la capsule sont EXTRAITS du fichier livré puis rejoués.
 * La rétractation est éprouvée VIVANTE sur l'accueil. Dit NON JOUÉ.
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
const capsule = lire("src/components/SelecteurCapsule.tsx");
const encadre = lire("src/components/EncadreBarre.tsx");

/** LES VALEURS DE LA Nº 255, la référence à laquelle §4 compare une à
    une : le banc verif-p255 les a mesurées, le propriétaire les cite. */
const REFERENCE_255 = {
  390: { badge: 179, mot: 87, glissade: 91 },
  1440: { badge: 332, mot: 164, glissade: 168 },
};

/* ------------------------------------------------------------------
 * LES CLASSES RÉELLES, LUES À LA SOURCE — les branches `porteBadge`
 * RÉSOLUES depuis le gabarit, jamais réécrites.
 * ---------------------------------------------------------------- */
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
const classeTrait = nettoyer(
  encadre.match(/className="(w-px my-2\.5[^"]*)"/)?.[1]
);
const classeRangee = nettoyer(
  //  (élargie nº 258 : la rangée porte aussi min-h-[52px] mobile:min-h-0.)
  menus.match(/className="(flex items-center gap-2\.5[^"]*)"/)?.[1]
);
const hauteurChamp = menus.match(/hauteur="(min-h-\[\d+px\])"/)?.[1] ?? "";
/** LA ROBE DE LA PILULE — le paramètre passé par la barre, et le
    défaut de la fiche : les deux barreaux, lus, jamais recopiés. */
const robeBarre = menus.match(/robeCapsule="([^"]+)"/)?.[1] ?? "";
const robeDefaut = capsule.match(/robeCapsule = "([^"]+)"/)?.[1] ?? "";
const classeBadge = nettoyer(
  capsule
    .match(/data-selecteur-capsule=""[\s\S]*?className=\{`([^`]+)`\}/)?.[1]
    ?.replace(/\$\{[^}]*"w-full"[^}]*\}/, "w-full")
);
const classeHote = nettoyer(
  capsule.match(/data-hote-capsule="" className="([^"]+)"/)?.[1]
);
const gabaritMot = capsule.match(/className=\{`(relative z-\[1\][^`]+)`\}/)?.[1];
//  ⚠️ MIS À JOUR nº 258-§1 : la hauteur des mots est un PARAMÈTRE —
//  on résout celle que la barre passe (38, l'encadré descendu à 46).
const hauteurMotBarre = menus.match(/hauteurMot="(min-h-\[\d+px\])"/)?.[1] ?? "";
const classeMot = (actif) =>
  nettoyer(
    gabaritMot
      ?.replace(/\$\{hauteurMot\}/, hauteurMotBarre)
      .replace(/\$\{[^}]*"flex-1 basis-1\/2 min-w-0"[^}]*\}/, "flex-1 basis-1/2 min-w-0")
      .replace(
        /\$\{[^}]*actif[^}]*\}/,
        actif ? "text-sombre-texte" : "text-sombre-texte-doux"
      )
  );
const classeCapsuleGlissante = nettoyer(
  capsule
    .match(/data-capsule-glissante=""[\s\S]*?className=\{`([^`]+)`\}/)?.[1]
    ?.replace(/\$\{robeCapsule\}/, robeBarre)
);
/** LES PRÉDICATS DE LA CAPSULE, extraits du fichier livré. */
const selecteurActif = capsule.match(
  /querySelector<HTMLButtonElement>\(\s*"([^"]+)"/
)?.[1];
const mesureCapsule = capsule.match(
  /setCapsule\(\{ (left: actif\.offsetLeft, width: actif\.offsetWidth) \}\)/
)?.[1];

/* ==================================================================
 * §1/§2/§5/§6 — À LA SOURCE
 * ================================================================== */
titre("§1/§2/§5/§6 — à la source : l'encadré-capsule, le cran, la réserve");
{
  verif(
    "l'encadré UNIQUE est de retour — badge puis champ, `porteBadge` posé",
    /<EncadreDeuxChamps gauche=\{badge\} droite=\{filtre\(\)\} porteBadge \/>/.test(
      menusNus
    ) && (menusNus.match(/<MenuDeroulant/g) ?? []).length === 1
  );
  verif(
    "la capsule : `rounded-full` sur l'encadré, et le champ sans forme propre",
    /porteBadge \? "rounded-full" : "rounded-2xl"/.test(encadre) &&
      //  (le `rounded-2xl` de la ligne étroite repliée, lui, est
      //  d'avant la nº 255 et ne concerne pas le champ.)
      !/data-champ-selection|mobile:rounded-full/.test(menusNus)
  );
  verif(
    "le moteur, lui, ne passe pas le drapeau : son encadré ne change pas",
    !/porteBadge/.test(lire("src/components/MoteurTatouage.tsx")) &&
      /rounded-2xl/.test(encadre)
  );
  verif(
    "§2 — le cran franc, par PARAMÈTRE de l'écriture unique (la fiche garde le sien)",
    //  ⚠️ MIS À JOUR nº 258-§4 : le cran n'est plus une CLASSE absolue
    //  mais la règle RELATIVE de globals.css (`[data-clair-barre]
    //  [data-capsule-glissante]`) — la barre passe une robe VIDE, le
    //  CSS habille un cran au-dessus du fond dans tous ses états. Ce
    //  que CETTE passe exigeait — la pilule plus claire que l'encadré,
    //  la fiche gardant son défaut — se mesure inchangé plus bas.
    robeBarre === "" &&
      /robeCapsule=""/.test(sansNotes(menus)) &&
      /\[data-clair-barre\] \[data-capsule-glissante\]/.test(
        lire("src/app/globals.css")
      ) &&
      robeDefaut === "bg-sombre-haut" &&
      //  La fiche ne passe rien : elle consomme le défaut.
      !/robeCapsule/.test(lire("src/components/PortfolioDeLAffiche.tsx"))
  );
  verif(
    "§3 — l'air du badge vit dans l'encadré (`box-content pl-1 pr-3`) : cédé par le champ",
    /shrink-0 grow-0 basis-1\/2 box-content pl-1 pr-3 flex items-center/.test(
      encadre
    ) && /w-px my-2\.5 bg-sombre-bordure/.test(encadre)
  );
  verif(
    "§5 — l'icône est TOUJOURS montée : `invisible` sur « Suivis », jamais démontée",
    /className=\{`hidden lg:flex \$\{surLesFavoris \? "" : "invisible"\}`\}/.test(
      menus
    ) &&
      !/\{surLesFavoris && \(/.test(menusNus) &&
      !/opacity-0|transition-opacity/.test(
        nettoyer(menus.match(/data-mise-en-page-selection[\s\S]{0,200}/)?.[0] ?? "")
      )
  );
  verif(
    "§6 — au doigt, la CATÉGORIE SEULE (le chevron reste, la borne est celle de la barre)",
    /if \(etroit\) return titre \?\? "";/.test(menusNus) &&
      /matchMedia\("\(max-width: 1023\.98px\)"\)/.test(menus) &&
      !/IconeLoupe/.test(menus)
  );
  verif(
    "le badge lui-même n'a pas changé d'écriture (SelecteurCapsule, nº 255)",
    /export function SelecteurCapsule/.test(capsule) &&
      /transition-\[left,width\] duration-300 ease-out/.test(capsule) &&
      /min-h-\[44px\]/.test(capsule)
  );
}

/* ==================================================================
 * LE BLOC INJECTÉ — la structure réelle de la nº 256
 * ================================================================== */
const BLOC = `((c) => {
  const hote = document.createElement("div");
  hote.setAttribute("data-hote-p256", "");
  hote.style.cssText = "position:relative;width:" + c.largeur + "px;margin:0 auto;";
  const mot = (actif, texte, classe) =>
    '<button type="button" role="radio" aria-checked="' + (actif ? "true" : "false") +
    '" class="' + classe + '">' + texte + '</button>';
  const badge =
    '<div data-hote-capsule class="' + c.hote + '">' +
    '<div data-selecteur-capsule role="radiogroup" class="' + c.badge + '">' +
    '<span data-capsule-glissante class="' + c.capsule + '"></span>' +
    mot(true, "Favoris", c.motActif) + mot(false, "Suivis", c.motDormant) +
    '</div></div>';
  const champ =
    '<button data-champ type="button" class="w-full ' + c.hauteur +
    ' text-base pl-4 pr-10 text-left overflow-hidden text-ellipsis whitespace-nowrap">Toutes les réalisations</button>';
  const icone =
    '<div data-mise-en-page class="hidden lg:flex' + (c.iconeInvisible ? " invisible" : "") + '">' +
    '<button data-bouton-phototheque data-clair-barre style="width:46px;height:46px" ' +
    'class="relative shrink-0 rounded-full flex items-center justify-center"></button></div>';
  hote.innerHTML =
    '<div data-bloc class="' + c.rangee + '">' +
      '<div class="flex-1 min-w-0">' +
        '<div data-encadre-barre data-clair-barre class="' + c.encadre + '">' +
          '<div data-moitie-badge class="' + c.moitieBadge + '">' + badge + '</div>' +
          '<div data-trait aria-hidden="true" class="' + c.trait + '"></div>' +
          '<div data-moitie-champ class="' + c.moitieChamp + '">' + champ + '</div>' +
        '</div>' +
      '</div>' + icone +
    '</div>';
  document.body.appendChild(hote);
  return hote;
})`;

const RELEVE = `((c, poserBloc, selecteurActif, mesurer) => {
  const hote = poserBloc(c);
  const cadre = hote.querySelector("[data-encadre-barre]");
  const zone = hote.querySelector("[data-selecteur-capsule]");
  const mots = [...zone.querySelectorAll("button")];
  const pilule = zone.querySelector("[data-capsule-glissante]");
  const trait = hote.querySelector("[data-trait]");
  const champ = hote.querySelector("[data-champ]");
  //  LES PRÉDICATS LIVRÉS, REJOUÉS : la capsule épouse le bouton actif.
  const lireCapsule = () => {
    const actif = zone.querySelector(selecteurActif);
    return new Function("actif", "return {" + mesurer + "};")(actif);
  };
  const surFavoris = lireCapsule();
  mots[0].setAttribute("aria-checked", "false");
  mots[1].setAttribute("aria-checked", "true");
  const surSuivis = lireCapsule();
  const sCadre = getComputedStyle(cadre);
  const sPilule = getComputedStyle(pilule);
  const bCadre = cadre.getBoundingClientRect();
  const bZone = zone.getBoundingClientRect();
  const bChamp = champ.getBoundingClientRect();
  const mesure = {
    cadreHauteur: bCadre.height,
    cadreRayon: parseFloat(sCadre.borderRadius),
    cadreFond: sCadre.backgroundColor,
    cadreBordure: sCadre.borderTopWidth,
    zoneBordure: getComputedStyle(zone).borderTopWidth,
    piluleFond: sPilule.backgroundColor,
    piluleHauteur: pilule.getBoundingClientRect().height,
    piluleRayon: parseFloat(sPilule.borderRadius),
    badge: bZone.width,
    hauteurBadge: bZone.height,
    mot1: mots[0].getBoundingClientRect().width,
    mot2: mots[1].getBoundingClientRect().width,
    motFavorisGauche: mots[0].getBoundingClientRect().left,
    glissade: surSuivis.left - surFavoris.left,
    airHaut: bZone.top - bCadre.top,
    airBas: bCadre.bottom - bZone.bottom,
    airGauche: bZone.left - bCadre.left,
    airDroite: trait.getBoundingClientRect().left - bZone.right,
    champLargeur: bChamp.width,
    debordement:
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
  hote.remove();
  return mesure;
})`;

for (const largeur of [390, 1440]) {
  titre(`§1 à §5 — le bloc mesuré par injection (${largeur} px)`);
  const { contexte, page } = await ouvrirA(largeur, "/");
  try {
    const config = {
      largeur: Math.min(largeur - 32, 720),
      rangee: classeRangee,
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
      iconeInvisible: false,
    };
    const vu = await page.evaluate(
      `(${RELEVE})(${JSON.stringify(config)}, ${BLOC}, ${JSON.stringify(
        selecteurActif
      )}, ${JSON.stringify(mesureCapsule)})`
    );
    const ref = REFERENCE_255[largeur];
    verif(
      `${largeur} px : §1 — l'encadré est une CAPSULE (rayon ≥ la moitié de sa hauteur)`,
      //  (46 depuis la nº 258 — la hauteur des cercles.)
      vu.cadreHauteur === 46 && vu.cadreRayon >= vu.cadreHauteur / 2,
      `hauteur ${Math.round(vu.cadreHauteur)} px · rayon effectif ${Math.min(
        Math.round(vu.cadreRayon),
        Math.round(vu.cadreHauteur / 2)
      )} px`
    );
    verif(
      `${largeur} px : §2 — la pilule STRICTEMENT plus claire que l'encadré, mesurée`,
      vu.piluleFond === "rgb(75, 75, 84)" &&
        vu.cadreFond === "rgb(65, 65, 73)" &&
        vu.piluleFond
          .match(/\d+/g)
          .every((canal, rang) => Number(canal) > Number(vu.cadreFond.match(/\d+/g)[rang])),
      `pilule ${vu.piluleFond} · encadré ${vu.cadreFond}`
    );
    verif(
      `${largeur} px : §1 — aucun contour, ni sur l'encadré ni sur le badge`,
      vu.cadreBordure === "0px" && vu.zoneBordure === "0px",
      `bordures ${vu.cadreBordure} / ${vu.zoneBordure}`
    );
    verif(
      `${largeur} px : §3 — l'air du badge : 4 en haut, 4 en bas, 4 à gauche, 12 à droite`,
      Math.abs(vu.airHaut - 4) <= 0.5 &&
        Math.abs(vu.airBas - 4) <= 0.5 &&
        Math.abs(vu.airGauche - 4) <= 0.5 &&
        Math.abs(vu.airDroite - 12) <= 0.5,
      `haut ${vu.airHaut.toFixed(1)} · bas ${vu.airBas.toFixed(1)} · gauche ${vu.airGauche.toFixed(
        1
      )} · droite ${vu.airDroite.toFixed(1)} px (avant le fin trait)`
    );
    verif(
      //  ⚠️ MIS À JOUR nº 258-§1 : le badge suit son encadré descendu
      //  à 46 — 38 de haut (46 − 2 × 4 d'air), la courbure pleine.
      `${largeur} px : §4 — hauteur 38 et courbure pleine, l'air de la nº 256 intact`,
      vu.hauteurBadge === 38 && vu.piluleHauteur === 38 && vu.piluleRayon >= 19,
      `badge ${Math.round(vu.hauteurBadge)} px · pilule ${Math.round(
        vu.piluleHauteur
      )} px, rayon effectif ${Math.min(Math.round(vu.piluleRayon), 22)} px`
    );
    verif(
      `${largeur} px : §4 — largeurs de la nº 255, une à une (badge ${ref.badge}, mots ${ref.mot}, glissade ${ref.glissade})`,
      Math.abs(vu.badge - ref.badge) <= 1.5 &&
        Math.abs(vu.mot1 - ref.mot) <= 1.5 &&
        Math.abs(vu.mot2 - ref.mot) <= 1.5 &&
        Math.abs(vu.glissade - ref.glissade) <= 1.5,
      `badge ${Math.round(vu.badge)} · mots ${Math.round(vu.mot1)}/${Math.round(
        vu.mot2
      )} · glissade ${Math.round(vu.glissade)}`
    );
    verif(
      `${largeur} px : le document ne déborde pas (scrollWidth = clientWidth)`,
      vu.debordement === 0,
      `scrollWidth − clientWidth = ${vu.debordement}`
    );

    /*  §5 — LE MÊME BLOC, ICÔNE INVISIBLE (« Suivis ») : rien ne bouge. */
    const suivis = await page.evaluate(
      `(${RELEVE})(${JSON.stringify({
        ...config,
        iconeInvisible: true,
      })}, ${BLOC}, ${JSON.stringify(selecteurActif)}, ${JSON.stringify(
        mesureCapsule
      )})`
    );
    verif(
      `${largeur} px : §5 — le champ garde EXACTEMENT sa largeur dans les deux états`,
      Math.abs(vu.champLargeur - suivis.champLargeur) === 0,
      `${vu.champLargeur.toFixed(1)} px sur les deux`
    );
    verif(
      `${largeur} px : §5 — le bord gauche de « Favoris » au même pixel`,
      Math.abs(vu.motFavorisGauche - suivis.motFavorisGauche) === 0,
      `${vu.motFavorisGauche.toFixed(1)} px sur les deux`
    );
  } catch (erreur) {
    nonJoue(`injection (${largeur} px)`, String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §7 — LA RÉTRACTATION, VIVANTE SUR LA RECHERCHE
 * ================================================================== */
titre("§7 — la rétractation inchangée (l'accueil VIVANT, 390 px)");
{
  const barre = lire("src/components/EnTeteTatouage.tsx");
  const { contexte, page } = await ouvrirA(390, "/");
  try {
    const releve = async () =>
      page.evaluate(() => {
        const cale = document.querySelector("[data-reserve-posee]");
        const rangee = document.querySelector("[data-rangee-moteur]");
        const s = rangee ? getComputedStyle(rangee) : null;
        return {
          reserve: Number(cale?.getAttribute("data-reserve-posee") ?? 0),
          duree: s?.transitionDuration ?? "",
          courbe: s?.transitionTimingFunction ?? "",
        };
      });
    const haut = await releve();
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(700);
    const replie = await releve();
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(700);
    const redeplie = await releve();
    verif(
      //  ⚠️ MIS À JOUR nº 258-§1 : 122 (les blocs à 46). La durée et
      //  la courbe — les réglages de juillet — n'ont pas bougé.
      "122 → 64 → 122, en 300 ms ease-out — les réglages de juillet",
      haut.reserve === 122 &&
        replie.reserve === 64 &&
        redeplie.reserve === 122 &&
        /0\.3s/.test(haut.duree) &&
        /cubic-bezier\(0, 0, 0\.2, 1\)/.test(haut.courbe),
      `${haut.reserve} → ${replie.reserve} → ${redeplie.reserve} · ${haut.duree} · ${haut.courbe}`
    );
    verif(
      "et le bloc de « Ma sélection » n'écrit toujours AUCUN seuil, AUCUN écouteur",
      !/scrollY|addEventListener\("scroll"/.test(menus) &&
        /if \(cumulDuGeste\.current > 24\) poserReplie\(true\);/.test(barre)
    );
  } catch (erreur) {
    nonJoue("§7 · rétractation", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

nonJoue(
  "« Ma sélection » vivante",
  "la page exige une session (base hors de portée) : le bloc est mesuré " +
    "par INJECTION des classes réelles lues à la source (branches " +
    "`porteBadge` résolues), les prédicats de la capsule sont EXTRAITS du " +
    "fichier livré puis rejoués, et la rétractation est éprouvée vivante " +
    "sur l'accueil — seul le montage React de la page n'est pas éprouvé"
);

process.exit(bilan());
