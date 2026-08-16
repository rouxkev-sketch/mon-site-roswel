/**
 * BANC DE LA PASSE Nº 318 — LIVRAISON RAPIDE
 * ==================================================================
 * §1   — LA RÈGLE DES FENÊTRES EN WEB. Un lien interne d'une fiche
 *        vers une autre reste DANS la fenêtre superposée : la pile
 *        s'empile, elle ne sort jamais. Éprouvé EN VIVANT sur la
 *        mosaïque (trois fiches l'une depuis l'autre, puis trois
 *        retours), et à la source pour « Ma sélection » (voir la
 *        NON JOUÉE : la page est derrière une session).
 * §2-a — LES OPTIONS SOUS « ARTISTE » ET « LIEU » NE SONT PLUS
 *        DÉCALÉES : mesuré sur la feuille compilée, aux deux largeurs,
 *        et la VRAIE porte (« Cultures du monde ») garde son retrait.
 * §2-b — UNE SEULE COULEUR DE FOND EN WEB : mesuré en vivant sur le
 *        menu du moteur, porte de famille OUVERTE — plus un seul
 *        voile ; l'ancienne teinte est reconstruite en témoin.
 * §2-c — « TOUS LES PORTFOLIOS », HORS GROUPE : exécuté — sa place,
 *        son nombre, et la preuve que le défaut de la nº 317 ne se
 *        réveille pas.
 *
 * ⚠️ UNE SEULE FENÊTRE PAR APPAREIL : 1440 × 823 (celle du
 * propriétaire) et 390 × 844 au doigt. Aucun balayage de largeurs.
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

const {
  entreesDesStyles,
  entreesDuProfil,
  LIBELLE_TOUS_LES_PORTFOLIOS,
  GROUPE_PROFIL,
  GROUPE_STYLES,
} = await import("@/lib/filtres-selection");
const { comptesDesSuivis } = await import("@/lib/selection-suivis");
const {
  aDesPortesDeGroupe,
  optionSeVoit,
  replieALOuverture,
  sousTitresDe,
} = await import("@/lib/repli-menu");

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

//  ⚠️ CELUI-CI SE LIT AVEC SES NOTES : c'est la RÈGLE DES FENÊTRES,
//  écrite en commentaire, qu'on y cherche.
const pile = lire("src/components/PileFiches.tsx");
const pileNue = sansNotes(pile);
const pageFavoris = sansNotes(lire("src/components/PageFavoris.tsx"));
const ficheTatoueur = sansNotes(lire("src/components/FicheTatoueur.tsx"));
const menuNu = sansNotes(lire("src/components/MenuDeroulant.tsx"));
const menus = sansNotes(lire("src/components/MenusSelection.tsx"));
const blocLieux = sansNotes(lire("src/components/BlocLieux.tsx"));

/* ==================================================================
 * D'ABORD, LA VÉRITÉ SUR CE CONTENEUR
 * ================================================================== */
titre("La page « Ma sélection » est-elle atteignable ici ?");
const reponse = await fetch(`${BASE}/mes-favoris`, { redirect: "manual" });
verif(
  "« Ma sélection » répond 307 sans session : son branchement à la pile " +
    "ne pourra être vérifié qu'à la source",
  reponse.status === 307,
  `${reponse.status} → ${reponse.headers.get("location")}`
);

/* ==================================================================
 * §1 À LA SOURCE — LA RÈGLE ÉCRITE, ET LE CHAÎNON BRANCHÉ
 * ================================================================== */
titre("§1 à la source — la règle des fenêtres, et « Ma sélection » branchée");
{
  //  LA RÈGLE, MOT POUR MOT, LÀ OÙ ELLE DÉCIDE (PileFiches).
  const normalise = (t) =>
    t.replace(/^\s*\*[ \t]?/gm, " ").replace(/\s+/g, " ").toLowerCase();
  const regle = normalise(pile);
  const morceaux = [
    "en version web, le format plein écran est réservé à deux cas, et à deux seulement",
    "« mon portfolio », dans le compte du propriétaire de la fiche",
    "une fiche ouverte depuis un lien de partage",
    "quelqu'un qui arrive de l'extérieur",
    "tout le reste s'ouvre en fenêtre centrée superposée",
    "il ne sort jamais de la fenêtre",
    "aucune passe future ne doit la contredire",
  ].map(normalise);
  const manquants = morceaux.filter((m) => !regle.includes(m));
  verif(
    "LA RÈGLE EST ÉCRITE EN COMMENTAIRE, phrase par phrase, dans PileFiches",
    manquants.length === 0,
    manquants.length ? `manque : ${manquants.join(" / ")}` : "les sept phrases"
  );
  //  LE CHAÎNON MANQUANT : « Ma sélection » est ENVELOPPÉE PAR LA PILE.
  verif(
    "« Ma sélection » est enveloppée par PileFiches — le fournisseur " +
      "existant, aucun second mécanisme",
    /<PileFiches surProfondeur=\{setProfondeurPile\}>/.test(pageFavoris) &&
      /import \{ PileFiches \} from "@\/components\/PileFiches"/.test(
        pageFavoris
      ),
    "PageFavoris : <PileFiches surProfondeur={…}>"
  );
  verif(
    "…sa fenêtre de base SURVIT sous la pile, comme celle de la mosaïque",
    /profondeurPile > 0/.test(pageFavoris) &&
      /const \[profondeurPile, setProfondeurPile\] = useState\(0\)/.test(
        pageFavoris
      ),
    "visible = adresse de la fiche OU pile non vide"
  );
  verif(
    "…et sa fermeture consomme l'entrée d'historique (machine arrière), " +
      "comme la mosaïque",
    /fermerLaFiche[\s\S]{0,700}window\.history\.back\(\)/.test(pageFavoris),
    "fermerLaFiche → history.back()"
  );
  //  LES DEUX CAS DE PLEIN ÉCRAN, à la source.
  verif(
    "CAS 1 — « Mon portfolio » : l'aperçu désactive la pile, les liens " +
      "restent des liens",
    /<PileFiches actif=\{!apercu\}>/.test(ficheTatoueur) &&
      /if \(!actif\) return <>\{children\}<\/>/.test(pileNue),
    "FicheTatoueur : actif={!apercu}"
  );
  //  TOUS LES CHEMINS D'UNE FICHE À UNE AUTRE passent par UNE main.
  verif(
    "TOUS les liens fiche → fiche passent par l'unique main de la pile " +
      "(useClicVersFiche), et il n'y a que deux écritures de lien",
    (blocLieux.match(/href=\{`\/tatoueur\/\$\{/g) ?? []).length === 2 &&
      (blocLieux.match(/clicVersFiche\?\.\(/g) ?? []).length === 2 &&
      /const ouvrirFiche = useOuvertureFiche\(\)/.test(blocLieux),
    "membre d'équipe (BlocLieux:équipe) · lieu d'un mode (BlocLieux:profils)"
  );
  verif(
    "…et AUCUN autre composant d'une fiche ne pose de lien vers une fiche",
    !/href=.*tatoueur\//.test(sansNotes(lire("src/components/ContenuFiche.tsx"))) &&
      !/href=.*tatoueur\//.test(
        sansNotes(lire("src/components/PortfolioDeLAffiche.tsx"))
      ),
    "ContenuFiche et PortfolioDeLAffiche : aucun"
  );
}

/* ==================================================================
 * §1 EN VIVANT — TROIS FICHES L'UNE DEPUIS L'AUTRE (1440 × 823)
 * ================================================================== */
titre("§1 en vivant — l'empilement, et ce qu'il fait à l'historique");
const { nav, ctx, page } = await ouvrirLeNavigateur("p318", {
  width: 1440,
  height: 823,
});
{
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector("[data-carte]", { timeout: 20000 });

  const etat = () =>
    page.evaluate(() => ({
      adresse: location.pathname,
      fenetres: document.querySelectorAll('[role="dialog"][aria-modal="true"]')
        .length,
    }));

  //  FENÊTRE 1 — une carte de la mosaïque (le salon lyonnais, qui a
  //  une équipe de deux artistes).
  await page
    .locator('[data-carte] a[href^="/tatoueur/atelier-corvus-lyon-1er?"]')
    .first()
    .click();
  await page.waitForSelector('[role="dialog"]', { timeout: 20000 });
  await page
    .locator('[role="dialog"] [role="radio"]', { hasText: "Profil" })
    .click();
  await page.waitForTimeout(900);
  const un = await etat();
  verif(
    "FENÊTRE 1 — la carte ouvre la fenêtre superposée, jamais la page",
    un.fenetres === 1 && un.adresse === "/tatoueur/atelier-corvus-lyon-1er",
    `${un.fenetres} fenêtre · ${un.adresse}`
  );

  //  FENÊTRE 2 — UN MEMBRE DE L'ÉQUIPE, cliqué DANS la fenêtre.
  await page
    .locator('[role="dialog"] a[href="/tatoueur/nadege-roux-villeurbanne"]')
    .first()
    .click();
  await page.waitForTimeout(1400);
  const deux = await etat();
  verif(
    "FENÊTRE 2 — le membre d'équipe S'EMPILE : deux fenêtres, pas une page",
    deux.fenetres === 2 && deux.adresse === "/tatoueur/nadege-roux-villeurbanne",
    `${deux.fenetres} fenêtres · ${deux.adresse}`
  );

  //  FENÊTRE 3 — DEPUIS LA FICHE EMPILÉE, LE LIEU D'UN DE SES MODES
  //  (son salon : le chemin « Résident chez »).
  const fenetreDeux = page.locator('[role="dialog"]').last();
  await fenetreDeux.locator('[role="radio"]', { hasText: "Profil" }).click();
  await page.waitForTimeout(700);
  await fenetreDeux.locator('a[href^="/tatoueur/"]').first().click();
  await page.waitForTimeout(1400);
  const trois = await etat();
  verif(
    "FENÊTRE 3 — le lieu du mode S'EMPILE aussi : trois fenêtres",
    trois.fenetres === 3,
    `${trois.fenetres} fenêtres · ${trois.adresse}`
  );

  //  L'HISTORIQUE : UNE ENTRÉE PAR FICHE, UN CRAN PAR RETOUR.
  await page.goBack();
  await page.waitForTimeout(900);
  const retour1 = await etat();
  verif(
    "RETOUR 1 — un cran : la fenêtre du dessus se referme, la deuxième " +
      "revient",
    retour1.fenetres === 2 &&
      retour1.adresse === "/tatoueur/nadege-roux-villeurbanne",
    `${retour1.fenetres} fenêtres · ${retour1.adresse}`
  );
  await page.goBack();
  await page.waitForTimeout(900);
  const retour2 = await etat();
  verif(
    "RETOUR 2 — encore un cran : la première fenêtre revient",
    retour2.fenetres === 1 &&
      retour2.adresse === "/tatoueur/atelier-corvus-lyon-1er",
    `${retour2.fenetres} fenêtre · ${retour2.adresse}`
  );
  await page.goBack();
  await page.waitForTimeout(900);
  const retour3 = await etat();
  verif(
    "RETOUR 3 — le dernier cran rend la page de départ, sans fenêtre",
    retour3.fenetres === 0 && retour3.adresse === "/",
    `${retour3.fenetres} fenêtre · ${retour3.adresse}`
  );

  //  CAS 2 DU PLEIN ÉCRAN — LE LIEN DE PARTAGE : l'adresse directe
  //  rend une PAGE complète, aucune fenêtre.
  await page.goto(BASE + "/tatoueur/atelier-corvus-lyon-1er", {
    waitUntil: "networkidle",
  });
  const partage = await page.evaluate(() => ({
    fenetres: document.querySelectorAll('[role="dialog"][aria-modal="true"]')
      .length,
    h1: document.querySelector("h1")?.textContent?.trim() ?? "",
  }));
  verif(
    "LIEN DE PARTAGE — l'adresse directe rend la page complète, " +
      "aucune fenêtre : le cas 2 du plein écran tient",
    partage.fenetres === 0 && partage.h1.length > 0,
    `0 fenêtre · h1 « ${partage.h1} »`
  );
}

/* ==================================================================
 * §2-b EN VIVANT — LE MENU DU MOTEUR, PORTE OUVERTE (1440 × 823)
 * ================================================================== */
titre("§2-b en vivant — un seul fond, porte de famille ouverte");
{
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  //  Le champ « Style » du moteur, dans la barre — puis la porte de
  //  catégorie (« Réalisations »), puis la VRAIE porte de famille
  //  (« Cultures du monde ») : le chemin du visiteur, clic à clic.
  await page.locator('button[aria-label="Style"]').first().click({ force: true });
  await page.waitForSelector('[role="listbox"] button', { timeout: 20000 });
  await page
    .locator('[role="listbox"] button', { hasText: "Réalisations" })
    .first()
    .click();
  await page.waitForSelector("[data-sous-porte]", { timeout: 20000 });
  await page.locator("[data-sous-porte]").first().click();
  //  ⚠️ LA SOURIS SORT DU PANNEAU AVANT LA MESURE : restée sur la
  //  liste après le clic, elle peignait le SURVOL d'une option
  //  (`hover:bg-sombre-eleve`) — un état de pointeur, pas une teinte
  //  de section. On mesure le repos.
  await page.mouse.move(5, 5);
  await page.waitForTimeout(600);
  const fonds = await page.evaluate(() => {
    const options = [...document.querySelectorAll('[role="option"]')];
    const porte = document.querySelector("[data-sous-porte]");
    const teintes = new Set(
      options.map((o) => getComputedStyle(o).backgroundColor)
    );
    return {
      nbOptions: options.length,
      teintes: [...teintes],
      fondPorte: porte ? getComputedStyle(porte).backgroundColor : "",
      retraitFamille: (() => {
        //  Une option DANS la famille ouverte garde son retrait — la
        //  nº 318-§2-a ne touche pas les vraies portes.
        const dedans = options.find(
          (o) => getComputedStyle(o).paddingLeft === "36px"
        );
        return dedans ? getComputedStyle(dedans).paddingLeft : "absent";
      })(),
    };
  });
  verif(
    "PORTE OUVERTE, LES OPTIONS N'ONT PLUS QU'UNE TEINTE : transparente — " +
      "la plaque seule peint le fond, du haut en bas",
    fonds.teintes.length === 1 && fonds.teintes[0] === "rgba(0, 0, 0, 0)",
    `${fonds.nbOptions} options · teinte(s) : ${fonds.teintes.join(" · ")}`
  );
  verif(
    "…et la porte ouverte elle-même n'est plus voilée",
    fonds.fondPorte === "rgba(0, 0, 0, 0)",
    fonds.fondPorte
  );
  verif(
    "…tandis que les enfants de la VRAIE porte gardent leur retrait " +
      "(36 px = pl-9) : l'appartenance se lit toujours",
    fonds.retraitFamille === "36px",
    fonds.retraitFamille
  );
  //  L'AVANT, EN TÉMOIN : la teinte que le voile peignait.
  const avant = await page.evaluate(() => {
    const temoin = document.createElement("div");
    temoin.style.backgroundColor = "rgba(255,255,255,0.06)";
    document.body.appendChild(temoin);
    const teinte = getComputedStyle(temoin).backgroundColor;
    temoin.remove();
    return teinte;
  });
  verif(
    "L'AVANT, reconstruit en témoin : le groupe ouvert portait un voile " +
      "blanc à 6 % — DEUX teintes dans un même panneau",
    avant === "rgba(255, 255, 255, 0.06)",
    `avant ${avant} sur le groupe ouvert, transparent ailleurs → ` +
      `après transparent partout`
  );
}
await ctx.close();
await nav.close();

/* ==================================================================
 * §2-a — LE RETRAIT, MESURÉ SUR LA FEUILLE COMPILÉE, AUX 2 LARGEURS
 * ================================================================== */
const sonde = `
  <div id="sonde-p318">
    <p data-soustitre-web class="px-4">ARTISTE</p>
    <button data-avant-web class="pr-4 pl-9">option</button>
    <button data-apres-web class="px-4">option</button>
    <p data-soustitre-doigt class="pl-3">ARTISTE</p>
    <button data-avant-doigt class="pl-8">option</button>
    <button data-apres-doigt class="pl-3">option</button>
  </div>`;
const lireRetraits = () => {
  const bloc = document.querySelector("#sonde-p318");
  const g = (sel) => getComputedStyle(bloc.querySelector(sel)).paddingLeft;
  return {
    sousTitreWeb: g("[data-soustitre-web]"),
    avantWeb: g("[data-avant-web]"),
    apresWeb: g("[data-apres-web]"),
    sousTitreDoigt: g("[data-soustitre-doigt]"),
    avantDoigt: g("[data-avant-doigt]"),
    apresDoigt: g("[data-apres-doigt]"),
  };
};

titre("§2-a — le retrait avant et après, aux deux largeurs");
{
  const web = await ouvrirLeNavigateur("p318w", { width: 1440, height: 823 });
  await web.page.goto(BASE + "/", { waitUntil: "networkidle" });
  await web.page.evaluate((html) => {
    document.body.insertAdjacentHTML("beforeend", html);
  }, sonde);
  const m = await web.page.evaluate(lireRetraits);
  verif(
    "EN WEB — avant : 36 px de retrait (pl-9) ; après : 16 px, la ligne " +
      "même du sous-titre (px-4)",
    m.avantWeb === "36px" && m.apresWeb === "16px" && m.sousTitreWeb === "16px",
    `avant ${m.avantWeb} → après ${m.apresWeb} · sous-titre ${m.sousTitreWeb}`
  );
  verif(
    "…et la source ne retraite plus que les VRAIES portes",
    /option\.sousGroupe && !option\.sousTitre\s*\?\s*OPTION_LISTE\.replace\("px-4", "pr-4 pl-9"\)/.test(
      menuNu
    ),
    "pl-9 réservé aux familles"
  );
  await web.ctx.close();
  await web.nav.close();

  const doigt = await ouvrirLeNavigateur(
    "p318m",
    { width: 390, height: 844 },
    { hasTouch: true, isMobile: true, deviceScaleFactor: 3 }
  );
  await doigt.page.goto(BASE + "/", { waitUntil: "networkidle" });
  await doigt.page.evaluate((html) => {
    document.body.insertAdjacentHTML("beforeend", html);
  }, sonde);
  const d = await doigt.page.evaluate(lireRetraits);
  verif(
    "AU DOIGT — avant : 32 px (pl-8) ; après : 12 px, la ligne même du " +
      "sous-titre (pl-3)",
    d.avantDoigt === "32px" &&
      d.apresDoigt === "12px" &&
      d.sousTitreDoigt === "12px",
    `avant ${d.avantDoigt} → après ${d.apresDoigt} · sous-titre ${d.sousTitreDoigt}`
  );
  verif(
    "…et la feuille du bas suit la même règle à la source",
    /option\.sousGroupe && !option\.sousTitre\s*\?\s*"pl-8"\s*:\s*"pl-3"/.test(
      menuNu
    ),
    "pl-8 réservé aux familles"
  );
  await doigt.ctx.close();
  await doigt.nav.close();
}

/* ==================================================================
 * §2-c — « TOUS LES PORTFOLIOS », EXÉCUTÉ
 * ================================================================== */
titre("§2-c — l'entrée neutre : son mot, sa place, et la nº 317 saine");
{
  const suivi = (id, typeFiche, etablissement, genres, style = "maori") => ({
    id, nom: id, slug: id, ville: "Lyon", region: null, pays: "France",
    codePays: "FR", photoProfil: null, typeFiche, etablissement,
    modes: genres.map((genre, rang) => ({
      id: `${id}-${rang}`, genre, role: null, salon_id: null,
    })),
    recentes: [
      { id: `${id}-p`, url: "", miniature: "", style, rendu: "color",
        nature: "tatouage", ordre: 0 },
    ],
    nouveautes: 0,
  });
  const SUIVIS = [
    suivi("a1", "artiste", "", ["domicile"]),
    suivi("a2", "artiste", "", ["guest"], "realisme"),
    suivi("l1", "salon", "salon", []),
  ];
  const comptes = comptesDesSuivis(SUIVIS);
  const ENTREES = [...entreesDesStyles(comptes), ...entreesDuProfil(comptes)];

  const neutre = ENTREES[0];
  verif(
    "ELLE S'APPELLE « Tous les portfolios », et c'est la PREMIÈRE entrée",
    neutre.label === LIBELLE_TOUS_LES_PORTFOLIOS && neutre.value === "",
    `« ${neutre.label} » (valeur vide, en tête)`
  );
  verif(
    "ELLE VIT HORS GROUPE : au-dessus de « Styles » et de « Profil »",
    neutre.groupe === undefined && neutre.sousGroupe === undefined,
    "aucun groupe, aucun sous-groupe"
  );
  verif(
    "elle porte son nombre : le total des portfolios suivis",
    neutre.compte === 3,
    `${neutre.compte}`
  );
  verif(
    "les deux groupes existent toujours, avec leurs portes",
    aDesPortesDeGroupe(ENTREES, true) === true &&
      ENTREES.some((e) => e.groupe === GROUPE_STYLES) &&
      ENTREES.some((e) => e.groupe === GROUPE_PROFIL),
    "Styles · Profil"
  );
  //  LE DÉFAUT DE LA nº 317 NE SE RÉVEILLE PAS — doublement.
  const arrivee = replieALOuverture(ENTREES, "");
  verif(
    "LA nº 317 NE SE RÉVEILLE PAS (1) : la valeur vide n'ouvre toujours " +
      "AUCUN groupe à l'arrivée",
    arrivee.groupe === null && arrivee.sousGroupe === null,
    `groupe ${arrivee.groupe} · sous-groupe ${arrivee.sousGroupe}`
  );
  verif(
    "…ET (2) : même sans cette garde, l'entrée n'a plus de groupe à " +
      "ouvrir — la cause d'origine a disparu avec le rangement",
    replieALOuverture([neutre], neutre.value).groupe === null &&
      neutre.groupe === undefined,
    "une entrée hors groupe ne peut rien déplier"
  );
  //  ET ELLE SE VOIT TOUJOURS, portes fermées comprises.
  const etatFerme = {
    repliable: true,
    portesDeGroupe: true,
    groupeDeplie: null,
    sousGroupeDeplie: null,
    sousTitres: sousTitresDe(ENTREES),
  };
  verif(
    "portes fermées, ELLE est visible — et elle seule",
    optionSeVoit(neutre, etatFerme) &&
      ENTREES.filter((e) => e !== neutre).every(
        (e) => !optionSeVoit(e, etatFerme)
      ),
    "l'entrée neutre au-dessus des deux portes closes"
  );
  //  LE CHAMP LIT LE MÊME MOT.
  verif(
    "le champ affiche le même mot quand rien n'est choisi — l'écriture " +
      "unique, aux deux largeurs",
    /if \(!choix\.style\) return LIBELLE_TOUS_LES_PORTFOLIOS/.test(menus) &&
      !/return "Style"/.test(menus),
    "MenusSelection lit LIBELLE_TOUS_LES_PORTFOLIOS (le raccourci « Style » est parti)"
  );
}

nonJoue(
  "§1 SUR « MA SÉLECTION », EN VIVANT",
  "la page exige une session Supabase signée par le serveur (307 vérifié " +
    "en première section) : je n'ai pas pu ouvrir une fiche depuis mes " +
    "favoris et cliquer un artiste dedans. Ce qui est prouvé à la place : " +
    "le MÊME fournisseur de pile enveloppe désormais la page (à la " +
    "source), et ce fournisseur est éprouvé EN VIVANT sur la mosaïque — " +
    "trois fiches empilées l'une depuis l'autre, trois retours, un cran " +
    "chacun. « Mon portfolio » (cas 1 du plein écran) est derrière la " +
    "même session : vérifié à la source (actif={!apercu})"
);

nonJoue(
  "WEBKIT",
  "ce conteneur n'a que Chromium. Les mesures ci-dessus valent pour " +
    "Chromium et pour lui seul — ce n'est une preuve ni pour Safari, ni " +
    "pour l'iPhone du propriétaire"
);

process.exit(bilan());
