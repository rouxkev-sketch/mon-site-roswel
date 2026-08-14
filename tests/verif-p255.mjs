/**
 * BANC DE LA PASSE Nº 255
 * ==================================================================
 * §1 le bloc perd ses deux menus : une moitié badge, une moitié menu,
 *    une seule ligne aux deux largeurs ; le badge occupe toute sa
 *    moitié, ses deux mots à égalité, la capsule glisse d'exactement
 *    une demi-largeur ;
 * §2 le badge bascule le contenu et n'ouvre rien ; « Favoris » actif à
 *    l'arrivée, aucun état neutre ;
 * §3 le champ du filtre n'est jamais vide, porte le chevron et pas de
 *    loupe ; panneau sur le web, feuille par le bas au doigt ; les deux
 *    portes et la sous-porte « Cultures du monde » s'ouvrent ;
 * §4 l'icône de mise en page : celle de la recherche (une écriture),
 *    présente sur « Favoris », absente sur « Suivis », largeur du bloc
 *    inchangée entre les deux ;
 * §5 plus aucune trace des deux menus ni des deux titres cliquables ;
 * §6 la rétractation comparée à celle de la recherche VIVANTE —
 *    hauteur déployée, seuils, durée, courbe ;
 * §7 aucun débordement du document, aux deux largeurs.
 *
 * ⚠️ « Ma sélection » exige une session (base hors de portée) : son
 * bloc est mesuré PAR INJECTION des classes réelles, lues à la source,
 * et ses prédicats sont EXTRAITS du fichier livré puis rejoués. Ce qui
 * peut l'être est éprouvé VIVANT sur les surfaces qui partagent la
 * même écriture : le badge sur une fiche, le menu et ses portes sur le
 * moteur, l'icône de mise en page sur la page de recherche, la
 * rétractation sur l'accueil. Le reste est dit NON JOUÉ.
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
/** LE SOURCE SANS SES NOTES — les commentaires ont déjà fait mentir
    trois bancs (nº 246, nº 248, nº 251) : ils citent ce qu'on cherche. */
const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const menus = lire("src/components/MenusSelection.tsx");
const menusNus = sansNotes(menus);
const capsule = lire("src/components/SelecteurCapsule.tsx");
const encadre = lire("src/components/EncadreBarre.tsx");
const affiche = lire("src/components/PortfolioDeLAffiche.tsx");
const moteur = lire("src/components/MoteurTatouage.tsx");
const barre = lire("src/components/EnTeteTatouage.tsx");
const favoris = lire("src/components/PageFavoris.tsx");

/* ------------------------------------------------------------------
 * LES CLASSES RÉELLES, LUES À LA SOURCE — jamais recopiées.
 * Les gabarits portent des ternaires : on RÉSOUT la branche qu'on
 * injecte, on ne réécrit pas la chaîne.
 * ---------------------------------------------------------------- */
//  ⚠️ MIS À JOUR nº 256-§1 : l'encadré porte désormais un ternaire
//  `porteBadge` (capsule + air du badge) — les branches du bloc de
//  « Ma sélection » sont RÉSOLUES, comme pour tout gabarit.
const classeEncadre = nettoyer(
  encadre
    .match(/className=\{`(flex items-stretch[^`]*)`\}/)?.[1]
    ?.replace(/\$\{\s*porteBadge \? "([^"]+)" : "[^"]+"\s*\}/, "$1")
);
const classeMoitieBadge = nettoyer(
  encadre.match(/\? "(shrink-0 grow-0 basis-1\/2 box-content[^"]+)"/)?.[1]
);
const classeMoitie = nettoyer(
  encadre.match(/<div className="(flex-1 min-w-0 basis-1\/2)">\{droite\}/)?.[1]
);
const classeTrait = nettoyer(
  encadre.match(/className="(w-px my-2\.5[^"]*)"/)?.[1]
);
const classeBadge = nettoyer(
  capsule
    .match(/data-selecteur-capsule=""[\s\S]*?className=\{`([^`]+)`\}/)?.[1]
    ?.replace(/\$\{[^}]*"w-full"[^}]*\}/, "w-full")
);
/** L'enveloppe qui centre le badge dans sa moitié sans l'étirer. */
const classeHote = nettoyer(
  capsule.match(/data-hote-capsule="" className="([^"]+)"/)?.[1]
);
const gabaritMot = capsule.match(/className=\{`(relative z-\[1\][^`]+)`\}/)?.[1];
//  ⚠️ MIS À JOUR nº 258-§1 : la hauteur des mots est un PARAMÈTRE
//  (`hauteurMot`) — on résout celle que la barre passe (38).
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
//  ⚠️ MIS À JOUR nº 256-§2 : la robe de la pilule est un PARAMÈTRE
//  (`robeCapsule`) — pour le bloc de la barre, on résout celle que la
//  barre passe (le cran au-dessus du fond de l'encadré).
const robeBarre = menus.match(/robeCapsule="([^"]+)"/)?.[1] ?? "";
const classeCapsuleGlissante = nettoyer(
  capsule
    .match(/data-capsule-glissante=""[\s\S]*?className=\{`([^`]+)`\}/)?.[1]
    ?.replace(/\$\{robeCapsule\}/, robeBarre)
);
/** La hauteur du champ, telle que le bloc la demande. */
const hauteurChamp = menus.match(/hauteur="(min-h-\[\d+px\])"/)?.[1] ?? "";
/** L'écart entre l'encadré et l'icône, et la rangée qui les porte. */
const classeRangee = nettoyer(
  //  (élargie nº 258 : la rangée porte aussi min-h-[52px] mobile:min-h-0.)
  menus.match(/className="(flex items-center gap-[\d.][^"]*)"/)?.[1]
);
/** LES PRÉDICATS DE LA CAPSULE, extraits du fichier livré. */
const selecteurActif = capsule.match(/querySelector<HTMLButtonElement>\(\s*"([^"]+)"/)?.[1];
const mesureCapsule = capsule.match(
  /setCapsule\(\{ (left: actif\.offsetLeft, width: actif\.offsetWidth) \}\)/
)?.[1];

/* ==================================================================
 * §1 — À LA SOURCE : DEUX MENUS DEHORS, UN BADGE ET UN MENU DEDANS
 * ================================================================== */
titre("§1/§5 — à la source : le bloc, le badge, ce qui disparaît");
{
  verif(
    "le bloc garde sa forme : le MÊME encadré à deux moitiés (fin trait compris)",
    /<EncadreDeuxChamps/.test(menusNus) &&
      /basis-1\/2/.test(encadre) &&
      /w-px my-2\.5 bg-sombre-bordure/.test(encadre)
  );
  verif(
    "sa moitié gauche est le BADGE des fiches, sa moitié droite UN SEUL menu",
    /gauche=\{badge\}/.test(menusNus) &&
      /droite=\{filtre\(\)\}/.test(menusNus) &&
      (menusNus.match(/<MenuDeroulant/g) ?? []).length === 1 &&
      /<SelecteurCapsule/.test(menusNus)
  );
  verif(
    "le badge est L'ÉCRITURE DES FICHES, extraite — les deux endroits la consomment",
    /export function SelecteurCapsule/.test(capsule) &&
      /<SelecteurCapsule/.test(affiche) &&
      //  Plus une seule capsule écrite dans la fiche : la mesure, la
      //  glissade et les couleurs ne vivent plus qu'à un endroit.
      !/setCapsule/.test(affiche) &&
      /transition-\[left,width\] duration-300 ease-out/.test(capsule),
    classeCapsuleGlissante
  );
  verif(
    "une seule ligne AUX DEUX LARGEURS : plus de contenu par point de rupture",
    !/hidden lg:block/.test(menusNus) &&
      !/className="lg:hidden"/.test(menusNus) &&
      !/blocDesTitres|blocDesMenus/.test(menus)
  );
  verif(
    "§5 — les deux titres cliquables de la nº 253 ont disparu du dépôt",
    !/data-titre-barre/.test(menus) &&
      !/titreFeuille=\{nom\}/.test(menus) &&
      !/data-titre-barre/.test(lire("src/components/BarreSelection.tsx"))
  );
  verif(
    "§5 — les titres de la page restent, et ne sont cliquables nulle part",
    /function titreControle\(nom: string\): React\.ReactNode \{\s*return nom;/.test(
      sansNotes(favoris)
    ) &&
      //  ⚠️ SUR LE SOURCE SANS SES NOTES : les commentaires de la page
      //  RACONTENT le menu de la nº 249 qu'elle ne porte plus.
      !/MenuDeroulant/.test(sansNotes(favoris)) &&
      (sansNotes(favoris).match(/<LigneResultats/g) ?? []).length === 2
  );
}

/* ==================================================================
 * §2 — LE BADGE BASCULE, IL N'OUVRE RIEN
 * ================================================================== */
titre("§2 — à la source : il bascule le contenu, aucun état neutre");
{
  const filtres = lire("src/lib/filtres-selection.ts");
  verif(
    "un appui repose LE PARAMÈTRE UNIQUE de la nº 247 — rien d'autre",
    /surChoix=\{\(menu\) => poserSelection\(menu, ""\)\}/.test(menusNus) &&
      /export const PARAM_SELECTION = "selection"/.test(filtres)
  );
  verif(
    "le badge n'ouvre RIEN : ni menu, ni feuille, ni portail dans son écriture",
    !/MenuDeroulant|createPortal|feuille/i.test(sansNotes(capsule))
  );
  verif(
    "aucun état neutre : « Favoris » à l'arrivée, et l'adresse ne rend jamais autre chose",
    /CHOIX_PAR_DEFAUT: ChoixSelection = \{\s*menu: MENU_FAVORIS/.test(filtres) &&
      /if \(menu !== MENU_FAVORIS && menu !== MENU_SUIVIS\) return CHOIX_PAR_DEFAUT;/.test(
        filtres
      ) &&
      /valeur=\{choix\.menu\}/.test(menusNus)
  );
}

/* ==================================================================
 * §1 — LE BLOC, MESURÉ PAR INJECTION (les classes réelles)
 * ================================================================== */
const BLOC = `((c) => {
  const hote = document.createElement("div");
  hote.setAttribute("data-hote-p255", "");
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
  hote.innerHTML =
    '<div data-bloc class="' + c.rangee + '">' +
      '<div class="flex-1 min-w-0">' +
        '<div data-encadre-barre data-clair-barre class="' + c.encadre + '">' +
          '<div data-moitie class="' + c.moitieBadge + '">' + badge + '</div>' +
          '<div aria-hidden="true" class="' + c.trait + '"></div>' +
          '<div data-moitie class="' + c.moitie + '">' + champ + '</div>' +
        '</div>' +
      '</div>' +
      '<div data-mise-en-page class="hidden lg:flex' + (c.iconeInvisible ? " invisible" : "") + '">' +
      '<button data-bouton-phototheque data-clair-barre style="width:46px;height:46px" ' +
      'class="relative shrink-0 rounded-full flex items-center justify-center"></button></div>' +
    '</div>';
  document.body.appendChild(hote);
  return hote;
})`;

const RELEVE_BLOC = `((c, poserBloc, selecteurActif, mesurer) => {
  const hote = poserBloc(c);
  const bloc = hote.querySelector("[data-bloc]");
  const moities = [...hote.querySelectorAll("[data-moitie]")];
  const zone = hote.querySelector("[data-selecteur-capsule]");
  const mots = [...zone.querySelectorAll("button")];
  //  LES PRÉDICATS LIVRÉS, REJOUÉS : la capsule épouse le bouton actif.
  const lireCapsule = () => {
    const actif = zone.querySelector(selecteurActif);
    return new Function("actif", "return {" + mesurer + "};")(actif);
  };
  const surFavoris = lireCapsule();
  mots[0].setAttribute("aria-checked", "false");
  mots[1].setAttribute("aria-checked", "true");
  const surSuivis = lireCapsule();
  const boites = {
    //  L'ÉCART ENTRE LES DEUX MOTS (le gap-1 de l'écriture des
    //  fiches) : la pilule le franchit en même temps que le mot.
    ecart:
      mots[1].getBoundingClientRect().left - mots[0].getBoundingClientRect().right,
    bloc: bloc.getBoundingClientRect().width,
    encadre: hote.querySelector("[data-encadre-barre]").getBoundingClientRect().width,
    gauche: moities[0].getBoundingClientRect().width,
    droite: moities[1].getBoundingClientRect().width,
    badge: zone.getBoundingClientRect().width,
    mot1: mots[0].getBoundingClientRect().width,
    mot2: mots[1].getBoundingClientRect().width,
    hauteurEncadre: hote.querySelector("[data-encadre-barre]").getBoundingClientRect().height,
    lignes: bloc.getBoundingClientRect().height,
    //  LA PILULE : sa hauteur (celle des mots), et l'air qui la sépare
    //  des bords du champ.
    hauteurCapsule: zone.querySelector("[data-capsule-glissante]").getBoundingClientRect().height,
    airHaut:
      zone.getBoundingClientRect().top -
      hote.querySelector("[data-encadre-barre]").getBoundingClientRect().top,
  };
  const debordement =
    document.documentElement.scrollWidth - document.documentElement.clientWidth;
  hote.remove();
  return { boites, surFavoris, surSuivis, debordement };
})`;

for (const largeur of [390, 1440]) {
  titre(`§1/§7 — le bloc mesuré par injection (${largeur} px)`);
  const { contexte, page } = await ouvrirA(largeur, "/", { mobile: false });
  try {
    const config = {
      largeur: Math.min(largeur - 32, 720),
      encadre: classeEncadre,
      moitieBadge: classeMoitieBadge,
      moitie: classeMoitie,
      trait: classeTrait,
      badge: classeBadge,
      capsule: classeCapsuleGlissante,
      motActif: classeMot(true),
      motDormant: classeMot(false),
      hauteur: hauteurChamp,
      hote: classeHote,
      rangee: classeRangee,
      iconeInvisible: false,
    };
    const vu = await page.evaluate(
      `(${RELEVE_BLOC})(${JSON.stringify(config)}, ${BLOC}, ${JSON.stringify(
        selecteurActif
      )}, ${JSON.stringify(mesureCapsule)})`
    );
    verif(
      `${largeur} px : une seule ligne — l'encadré de 46 centré dans la zone du web`,
      //  ⚠️ MIS À JOUR nº 258-§1/§2 : l'encadré est descendu à la
      //  hauteur des cercles (46) ; sur le web (cette injection est à
      //  souris), la rangée GARDE sa zone de 52 et y centre l'encadré
      //  — la barre ne change pas. « Une seule ligne » demeure : le
      //  bloc ne fait qu'une hauteur de zone.
      vu.boites.hauteurEncadre === 46 && Math.round(vu.boites.lignes) === 52,
      `bloc ${Math.round(vu.boites.lignes)} px · encadré ${Math.round(
        vu.boites.hauteurEncadre
      )} px`
    );
    //  ⚠️ MIS À JOUR nº 256-§1/§3 : la moitié du badge est passée en
    //  `box-content` — sa moitié SE MESURE SUR LE BADGE LUI-MÊME, et
    //  l'air (4 px à gauche, 12 à droite) s'AJOUTE autour au lieu de
    //  le rétrécir, cédé par le champ. Ce que CETTE passe a posé — le
    //  badge occupe toute sa moitié d'encadré — se lit sur le contenu.
    verif(
      `${largeur} px : le badge occupe toute sa moitié (de contenu depuis la nº 256)`,
      Math.abs(vu.boites.badge - vu.boites.encadre / 2) <= 1.5,
      `badge ${Math.round(vu.boites.badge)} px · demi-encadré ${Math.round(
        vu.boites.encadre / 2
      )} px`
    );
    verif(
      `${largeur} px : les deux mots se partagent la largeur À ÉGALITÉ`,
      Math.abs(vu.boites.mot1 - vu.boites.mot2) <= 1,
      `${Math.round(vu.boites.mot1)} / ${Math.round(vu.boites.mot2)} px`
    );
    verif(
      //  ⚠️ MIS À JOUR nº 258-§1 : 38 dans 46 — l'air de 4 px, la
      //  règle de CETTE passe, n'a pas bougé.
      `${largeur} px : la pilule garde la hauteur des mots (38), centrée dans le champ`,
      vu.boites.hauteurCapsule === 38 &&
        Math.abs(vu.boites.airHaut - (vu.boites.hauteurEncadre - 38) / 2) <= 1,
      `pilule ${Math.round(vu.boites.hauteurCapsule)} px dans ${Math.round(
        vu.boites.hauteurEncadre
      )} px · air ${Math.round(vu.boites.airHaut)} px`
    );
    /*  ⚠️ « EXACTEMENT UNE DEMI-LARGEUR » SE MESURE AVEC L'ÉCART DES
        MOTS. Les deux mots partagent la largeur à égalité, séparés par
        le `gap-1` (4 px) de l'écriture des fiches : la pilule parcourt
        donc UNE LARGEUR DE MOT PLUS CET ÉCART — c'est-à-dire la
        demi-largeur du badge, à deux pixels près (la moitié de
        l'écart). Elle atterrit exactement sur l'autre mot, ce qui est
        l'invariant réel du mécanisme. */
    const glissade = vu.surSuivis.left - vu.surFavoris.left;
    verif(
      `${largeur} px : la capsule parcourt une demi-largeur et atterrit sur l'autre mot`,
      Math.abs(glissade - (vu.boites.mot1 + vu.boites.ecart)) <= 1 &&
        Math.abs(glissade - vu.boites.badge / 2) <= vu.boites.ecart / 2 + 1 &&
        Math.abs(vu.surSuivis.width - vu.boites.mot2) <= 1,
      `glissade ${Math.round(glissade)} px = mot ${Math.round(
        vu.boites.mot1
      )} + écart ${Math.round(vu.boites.ecart)} · demi-badge ${Math.round(
        vu.boites.badge / 2
      )} px`
    );
    verif(
      `${largeur} px : §7 — le document ne déborde pas (scrollWidth = clientWidth)`,
      vu.debordement === 0,
      `scrollWidth − clientWidth = ${vu.debordement}`
    );

    /*  §4 — ⚠️ MIS À JOUR nº 256-§4/§5 : la nº 255 démontait l'icône
        sur « Suivis » et faisait REPRENDRE sa place au champ — c'est
        précisément ce qui faisait GLISSER tout le groupe à chaque
        bascule (la largeur changeait, le centrage recalculait).
        L'emplacement est désormais RÉSERVÉ EN PERMANENCE (`invisible`,
        jamais démontée) : sur « Suivis », RIEN ne bouge — ni le bloc,
        ni l'encadré. */
    const surSuivisBloc = await page.evaluate(
      `(${RELEVE_BLOC})(${JSON.stringify({
        ...config,
        iconeInvisible: true,
      })}, ${BLOC}, ${JSON.stringify(selecteurActif)}, ${JSON.stringify(
        mesureCapsule
      )})`
    );
    verif(
      `${largeur} px : §4 — l'icône invisible (« Suivis »), le bloc ET l'encadré immobiles (nº 256)`,
      Math.abs(vu.boites.bloc - surSuivisBloc.boites.bloc) <= 0.5 &&
        Math.abs(vu.boites.encadre - surSuivisBloc.boites.encadre) <= 0.5,
      `bloc ${Math.round(vu.boites.bloc)} → ${Math.round(
        surSuivisBloc.boites.bloc
      )} px · encadré ${Math.round(vu.boites.encadre)} → ${Math.round(
        surSuivisBloc.boites.encadre
      )} px`
    );
  } catch (erreur) {
    nonJoue(`§1 · injection (${largeur} px)`, String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §1 — LA CAPSULE, VIVANTE : le sélecteur des fiches
 * ================================================================== */
titre("§1 — la capsule qui glisse, VIVANTE (le sélecteur d'une fiche, 1440 px)");
{
  const { contexte, page } = await ouvrirA(
    1440,
    "/tatoueur/atelier-corvus-lyon-1er",
    { mobile: false }
  );
  try {
    const zone = page.locator("[data-selecteur-capsule]").first();
    await zone.waitFor({ state: "visible", timeout: 15000 });
    const avant = await zone.evaluate((n) => {
      const c = n.querySelector("[data-capsule-glissante]");
      const actif = n.querySelector("button[aria-checked='true']");
      return {
        capsule: c.getBoundingClientRect().left,
        largeur: c.getBoundingClientRect().width,
        actif: actif.getBoundingClientRect().left,
        mot: actif.textContent.trim(),
        transition: getComputedStyle(c).transitionProperty,
        duree: getComputedStyle(c).transitionDuration,
        courbe: getComputedStyle(c).transitionTimingFunction,
      };
    });
    verif(
      "au repos, la capsule épouse le mot actif (position ET largeur)",
      Math.abs(avant.capsule - avant.actif) <= 1,
      `« ${avant.mot} » · capsule ${Math.round(avant.capsule)} px, mot ${Math.round(
        avant.actif
      )} px`
    );
    verif(
      "elle GLISSE : left et width en transition, 300 ms, ease-out",
      /left/.test(avant.transition) &&
        /width/.test(avant.transition) &&
        avant.duree === "0.3s" &&
        avant.courbe === "cubic-bezier(0, 0, 0.2, 1)",
      `${avant.transition} · ${avant.duree} · ${avant.courbe}`
    );
    await zone.locator("button", { hasText: "Portfolio" }).first().click();
    await page.waitForTimeout(500);
    const apres = await zone.evaluate((n) => {
      const c = n.querySelector("[data-capsule-glissante]");
      const actif = n.querySelector("button[aria-checked='true']");
      return {
        capsule: c.getBoundingClientRect().left,
        actif: actif.getBoundingClientRect().left,
        mot: actif.textContent.trim(),
      };
    });
    verif(
      "un appui sur l'autre mot la fait passer dessous, sans rien ouvrir",
      apres.capsule > avant.capsule &&
        Math.abs(apres.capsule - apres.actif) <= 1 &&
        apres.mot !== avant.mot,
      `« ${avant.mot} » → « ${apres.mot} » · ${Math.round(
        avant.capsule
      )} → ${Math.round(apres.capsule)} px`
    );
  } catch (erreur) {
    nonJoue("§1 · capsule vivante", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §3 — LE CHAMP DU FILTRE
 * ================================================================== */
titre("§3 — à la source : jamais vide, le chevron, aucune loupe");
{
  verif(
    "les drapeaux du champ « Explorer » du moteur, `repliable` compris",
    /sansBordure\s+sombre\s+repliable\s+feuilleMobile/.test(nettoyer(menusNus)) &&
      //  (46 depuis la nº 258 — la hauteur des cercles.)
      /hauteur="min-h-\[46px\]"/.test(menusNus) &&
      /taillePolice="text-base"/.test(menusNus)
  );
  verif(
    "il n'est JAMAIS vide : le libellé dit l'état, et retombe sur la porte présente",
    /libelleValeur=\{libelleDuFiltre\(/.test(menusNus) &&
      /const nature = choix\.nature \|\| \(entrees\[0\]\?\.value\.split\(":"\)\[0\] \?\? ""\)/.test(
        menusNus
      ) &&
      //  Les mots viennent du moteur, aucun n'est écrit ici.
      //  ⚠️ MIS À JOUR nº 257-§1 : l'écriture est passée dans
      //  `libelleDuChoix` (partagée avec le sous-titre de la page),
      //  qui consomme toujours `libelleExplorer` — la règle de CETTE
      //  passe, « les mots du moteur », n'a pas bougé.
      /libelleExplorer\(choix\.nature, choix\.style\)/.test(menusNus)
  );
  verif(
    "le libellé se raccourcit sur écran étroit — et la borne est CELLE DE LA BARRE",
    //  ⚠️ MIS À JOUR nº 256-§6 : au doigt, le champ ne dit plus que LA
    //  CATÉGORIE, toujours (même filtré par un style) — le style
    //  complet vit dans le titre de la page. Le principe de CETTE
    //  passe — raccourcir au titre de la porte plutôt que rétrécir le
    //  badge — est devenu la règle entière du doigt.
    /if \(etroit\) return titre \?\? "";/.test(menusNus) &&
      /matchMedia\("\(max-width: 1023\.98px\)"\)/.test(menusNus) &&
      /matchMedia\("\(max-width: 1023\.98px\)"\)/.test(barre)
  );
  verif(
    "aucune loupe dans le champ (la loupe veut dire « rechercher »)",
    !/IconeLoupe/.test(menus)
  );
  verif(
    "le chevron est celui du menu de la maison, pas un second dessin",
    //  ⚠️ MIS À JOUR nº 258-§3 : `IconeChevronBas` est partie avec la
    //  ligne étroite — le bloc ne dessine plus AUCUNE icône, et le
    //  chevron du champ reste la flèche du MenuDeroulant lui-même.
    !/svg|path |chevron|Icone/i.test(sansNotes(menus)) &&
      /FLECHE_GRISE/.test(lire("src/components/MenuDeroulant.tsx"))
  );
  verif(
    "il filtre CE QUE LE BADGE A CHOISI (les entrées suivent le menu actif)",
    /const entrees = surLesFavoris \? entreesFavoris : entreesSuivis;/.test(
      menusNus
    ) &&
      /poserSelection\(choix\.menu, suivante\)/.test(menusNus)
  );
}

titre("§3 — VIVANT : le panneau du web, ses deux portes, la sous-porte");
{
  const { contexte, page } = await ouvrirA(1440, "/", { mobile: false });
  try {
    const champ = page.locator('button[aria-label="Explorer"]').first();
    await champ.waitFor({ state: "visible", timeout: 15000 });
    await champ.click();
    await page.waitForTimeout(500);
    const panneau = page.locator('[data-verre-menu] [role="listbox"]').first();
    const ouvert = await panneau.count();
    const verre = await page
      .locator("[data-verre-menu]")
      .first()
      .evaluate((n) => getComputedStyle(n).backgroundColor);
    const portes = await page
      .locator('[data-verre-menu] button:has-text("Réalisations")')
      .count();
    verif(
      "sur le web, la liste s'ouvre en PANNEAU (pas une feuille par le bas)",
      ouvert > 0 &&
        (await panneau.evaluate((n) => {
          const boite = n.getBoundingClientRect();
          //  Un panneau se pose SOUS le champ, il ne colle pas au bas
          //  de l'écran sur toute la largeur.
          return boite.width < window.innerWidth * 0.9;
        })),
      `listbox ${ouvert}`
    );
    verif(
      "les DEUX PORTES de catégorie sont là (Réalisations, Flashs)",
      portes > 0 &&
        (await page
          .locator('[data-verre-menu] button:has-text("Flashs")')
          .count()) > 0
    );
    verif(
      "et c'est LE VERRE DES MENUS, l'écriture existante (45 %)",
      verre === "rgba(26, 26, 29, 0.45)",
      verre
    );
    //  UNE PORTE S'OUVRE, ET LA SOUS-PORTE DEDANS.
    await page
      .locator('[data-verre-menu] button:has-text("Réalisations")')
      .first()
      .click();
    await page.waitForTimeout(400);
    const apresPorte = await page
      .locator('[data-verre-menu] [role="option"]')
      .count();
    const sousPorte = page
      .locator('[data-verre-menu] button:has-text("Cultures du monde")')
      .first();
    const aSousPorte = await sousPorte.count();
    let apresSousPorte = 0;
    if (aSousPorte) {
      await sousPorte.click();
      await page.waitForTimeout(400);
      apresSousPorte = await page
        .locator('[data-verre-menu] [role="option"]')
        .count();
    }
    verif(
      "la porte s'ouvre sur ses styles, et la sous-porte « Cultures du monde » aussi",
      apresPorte > 0 && aSousPorte > 0 && apresSousPorte > apresPorte,
      `${apresPorte} styles → ${apresSousPorte} avec la famille dépliée`
    );
  } catch (erreur) {
    nonJoue("§3 · portes du web", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

titre("§3 — VIVANT : au doigt, la feuille monte PAR LE BAS (le même menu)");
{
  //  Le même `MenuDeroulant` avec `feuilleMobile`, sur une surface
  //  ouvrable sans session : le champ « Métier » des artisans.
  const { contexte, page } = await ouvrirA(390, "/artisans");
  try {
    const champ = page.locator("button[aria-haspopup='listbox']").first();
    await champ.waitFor({ state: "visible", timeout: 15000 });
    await champ.click();
    await page.waitForTimeout(600);
    const vu = await page.evaluate(() => {
      const liste = [...document.querySelectorAll('[role="listbox"]')].find(
        (n) => n.getBoundingClientRect().height > 0
      );
      if (!liste) return null;
      const feuille = liste.parentElement;
      const b = feuille.getBoundingClientRect();
      return {
        bas: Math.round(window.innerHeight - b.bottom),
        largeur: Math.round(b.width),
        fenetre: window.innerWidth,
        //  LE PORTAIL : la feuille est posée dans <body>, pas dans la
        //  boîte du champ (nº 251) — aucun cadre ne la découpe.
        dansLeCorps: feuille.parentElement === document.body,
      };
    });
    verif(
      "elle monte du BAS, en pleine largeur, posée sur le corps (portail)",
      vu !== null &&
        vu.bas <= 2 &&
        vu.largeur >= vu.fenetre - 2 &&
        vu.dansLeCorps,
      vu ? `bas ${vu.bas} px · largeur ${vu.largeur}/${vu.fenetre} px` : "absente"
    );
    //  ⚠️ CE CHAMP-LÀ EST CLAIR (c'est l'autre produit) : il éprouve la
    //  FEUILLE, pas le verre. Le verre des menus est celui du drapeau
    //  `sombre`, que notre champ passe — mesuré vivant sur le panneau du
    //  web, au §3 ci-dessus.
    verif(
      "notre champ, lui, demande le verre des menus (`sombre`) — la même écriture",
      /sombre/.test(menusNus) && /data-verre-menu/.test(lire("src/components/MenuDeroulant.tsx"))
    );
  } catch (erreur) {
    nonJoue("§3 · feuille du doigt", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §4 — L'ICÔNE DE MISE EN PAGE
 * ================================================================== */
titre("§4 — à la source : une écriture, sur « Favoris » et sur le web");
{
  const bouton = lire("src/components/BoutonPhototheque.tsx");
  verif(
    "l'icône est EXTRAITE : le moteur et « Ma sélection » consomment la même",
    /export function BoutonPhototheque/.test(bouton) &&
      (moteur.match(/<BoutonPhototheque/g) ?? []).length === 2 &&
      /<BoutonPhototheque/.test(menusNus) &&
      //  Plus aucun second dessin dans le moteur.
      !/IconeCartes|IconePhoto/.test(moteur)
  );
  verif(
    "elle n'existe que sur « Favoris », et sur le web",
    //  ⚠️ MIS À JOUR nº 256-§4 : le montage conditionnel de la nº 255
    //  faisait GLISSER le groupe à chaque bascule (la largeur
    //  changeait). L'icône est désormais TOUJOURS montée, `invisible`
    //  sur « Suivis » — elle n'existe toujours QUE sur « Favoris »
    //  pour l'œil et pour le doigt (visibility ne reçoit ni clic ni
    //  focus), mais son emplacement demeure.
    /className=\{`hidden lg:flex \$\{surLesFavoris \? "" : "invisible"\}`\}/.test(
      menus
    ) && /data-mise-en-page-selection=""/.test(menusNus)
  );
  verif(
    "elle COMMANDE vraiment : la page passe la vue à ses cartes",
    /const phototheque = useVuePhototheque\(\);/.test(favoris) &&
      /phototheque=\{phototheque\}/.test(favoris)
  );
}

titre("§4 — VIVANTE sur la page de recherche (1440 px)");
{
  const { contexte, page } = await ouvrirA(1440, "/", { mobile: false });
  try {
    const icone = page.locator("[data-bouton-phototheque]:visible").first();
    await icone.waitFor({ state: "visible", timeout: 15000 });
    const boite = await icone.boundingBox();
    const avant = await icone.getAttribute("aria-pressed");
    await icone.click();
    await page.waitForTimeout(600);
    const apres = await page
      .locator("[data-bouton-phototheque]:visible")
      .first()
      .getAttribute("aria-pressed");
    verif(
      "le rond de 46 px de la barre de recherche, et il bascule la vue",
      Math.round(boite.width) === 46 &&
        Math.round(boite.height) === 46 &&
        avant === "false" &&
        apres === "true",
      `${Math.round(boite.width)}×${Math.round(boite.height)} px · ${avant} → ${apres}`
    );
  } catch (erreur) {
    nonJoue("§4 · icône vivante", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §6 — LA RÉTRACTATION, COMPARÉE À CELLE DE LA RECHERCHE VIVANTE
 * ================================================================== */
titre("§6 — à la source : une seule mécanique de repli, aucune seconde");
{
  verif(
    "les seuils de juillet, intacts et écrits UNE fois (24 / −12 / 64)",
    /if \(cumulDuGeste\.current > 24\) poserReplie\(true\);/.test(barre) &&
      /else if \(cumulDuGeste\.current < -12\) poserReplie\(false\);/.test(barre) &&
      /if \(y < 64\) \{/.test(barre) &&
      //  Le bloc de « Ma sélection » n'écrit AUCUN seuil, AUCUN écouteur.
      !/scrollY|addEventListener\("scroll"/.test(menus)
  );
  verif(
    "la réserve déployée est la MÊME que celle du moteur (122), et elle est unique",
    //  ⚠️ MIS À JOUR nº 258-§1/§3 : 122 (64 + 12 + 46), et DEUX
    //  hauteurs — la ligne étroite (104) est partie avec la nº 258.
    /rangeePresente && !moteurReplie \? 122 : 64/.test(barre) &&
      (barre.match(/122/g) ?? []).length >= 2 &&
      //  ⚠️ SUR LE SOURCE SANS SES NOTES : le commentaire de la ligne
      //  étroite RACONTE le calcul de la réserve (64 + 12 + 28 = 104),
      //  il ne la pose pas.
      !/122|104/.test(menusNus)
  );
  //  ⚠️ MIS À JOUR nº 259-§2 : le pliage du bloc est parti — c'est
  //  l'enveloppe de la barre qui replie les deux rangées. Ce que CETTE
  //  passe exigeait — la durée et la courbe de la rangée du moteur —
  //  se lit au même endroit que le repli lui-même.
  verif(
    "la durée et la courbe du pliage : celles de la rangée du moteur",
    /max-lg:duration-300 max-lg:ease-out/.test(barre) &&
      !/duration-300 ease-out/.test(menusNus)
  );
}

titre("§6 — VIVANTE : la barre de la recherche, sur l'accueil (390 px)");
{
  const { contexte, page } = await ouvrirA(390, "/");
  try {
    const releve = async () =>
      page.evaluate(() => {
        const cale = document.querySelector("[data-reserve-posee]");
        const rangee = document.querySelector("[data-rangee-moteur]");
        const s = rangee ? getComputedStyle(rangee) : null;
        return {
          reserve: Number(cale?.getAttribute("data-reserve-posee") ?? 0),
          hauteur: cale ? Math.round(cale.getBoundingClientRect().height) : 0,
          duree: s?.transitionDuration ?? "",
          courbe: s?.transitionTimingFunction ?? "",
        };
      });
    const haut = await releve();
    //  On replie par un vrai geste (au-delà des 24 px cumulés).
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(700);
    const replie = await releve();
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(700);
    const redeplie = await releve();
    verif(
      //  ⚠️ MIS À JOUR nº 258-§1 : 122 (les blocs descendus à 46).
      "la rangée déployée réserve 122 px, repliée 64, et redéployée 122",
      haut.reserve === 122 && replie.reserve === 64 && redeplie.reserve === 122,
      `${haut.reserve} → ${replie.reserve} → ${redeplie.reserve}`
    );
    verif(
      "la hauteur posée suit la réserve, au pixel",
      haut.hauteur === 122 && replie.hauteur === 64,
      `${haut.hauteur} px → ${replie.hauteur} px`
    );
    verif(
      "300 ms, ease-out — la courbe de juillet",
      /0\.3s/.test(haut.duree) && /cubic-bezier\(0, 0, 0\.2, 1\)/.test(haut.courbe),
      `${haut.duree} · ${haut.courbe}`
    );
    //  ET CE QUE « MA SÉLECTION » Y AJOUTE : 64 + 12 + 52 = 128, la
    //  même réserve déployée — son bloc a la hauteur de l'encadré du
    //  moteur (mesurée plus haut : 52 px).
    verif(
      "« Ma sélection » retombe sur la même réserve déployée (64 + 12 + 46 = 122)",
      64 + 12 + 46 === 122 && /max-lg:pt-3/.test(barre) && hauteurChamp === "min-h-[46px]",
      `champ ${hauteurChamp}`
    );
  } catch (erreur) {
    nonJoue("§6 · rétractation vivante", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

nonJoue(
  "« Ma sélection » vivante",
  "la page exige une session (base hors de portée) : le bloc est mesuré " +
    "par INJECTION des classes réelles et les prédicats de la capsule sont " +
    "EXTRAITS du fichier livré puis rejoués ; le badge est éprouvé VIVANT " +
    "sur le sélecteur d'une fiche (la même écriture), le menu et ses portes " +
    "sur le moteur, la feuille du doigt sur le champ des artisans, l'icône " +
    "de mise en page sur la page de recherche, et la rétractation sur " +
    "l'accueil — seul le montage React de la page n'est pas éprouvé"
);

process.exit(bilan());
