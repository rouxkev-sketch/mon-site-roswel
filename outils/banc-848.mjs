//  ██ BANC 848 — LES BADGES DE RECHERCHE : QUATRE RETOUCHES ██
//   1. §1 — le fond des badges à croix prend un barreau ENTRE les deux
//      essais du propriétaire, et ce barreau est DÉCLARÉ dans la charte ;
//   2. §2 et §3b — l'air intérieur est ÉGAL sur les quatre côtés, aux
//      deux appareils ; la hauteur suit, et le squelette d'attente
//      promet EXACTEMENT la même (la leçon du banc nº 845) ;
//   3. §3a et §3c — au web, l'air au-dessus de la rangée vaut celui du
//      dessous, et le texte comme la croix montent d'un cran ;
//   4. §4 et §5 — le badge de localité sépare au point médian fin, et
//      toute la rangée passe en graisse moyenne.
//
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs` (doublure, .env.local,
//  build, `npx next start`, BANC_PLAYWRIGHT).
import { BASE, ouvrir, verif, titre, bilan } from "./banc-socle.mjs";

/*  UNE RECHERCHE QUI REND DES CARTES **ET** LES TROIS BADGES : le
    compte, le style, la localité avec son rayon.
    ⚠️ LES CARTES COMPTENT : sans elles, le bloc « aucun résultat »
    s'intercale entre la rangée et la grille, et l'air sous la rangée
    n'est plus mesurable (la leçon des nº 846 et 847). Toutes les fiches
    de la doublure sont à Lyon : le cercle de 25 les prend.
    ⚠️ ET LES COORDONNÉES S'ÉCRIVENT À CINQ DÉCIMALES, ce qui n'est pas
    une coquetterie — c'est la forme que le site lui-même écrit
    (`lieuVersParametres`, lib/geocodage : `latitude.toFixed(5)`). Une
    adresse forgée à deux décimales est DÉCODÉE puis RÉÉCRITE à cinq par
    le serveur : les deux signatures diffèrent, la page se croit « en
    retard sur l'adresse » (nº 673/710) et se met en CHANTIER — le bloc
    de tête passe alors en `visibility: hidden` (la règle de globals.css
    sous `main[aria-busy]`). Les boîtes se mesurent quand même, et le
    banc mesurerait donc sans rien voir. La garde ci-dessous l'interdit
    désormais. */
const RECHERCHE = new URLSearchParams({
  style: "blackwork", nature: "tatouage",
  lieu: "Lyon", zone: "69", lat: "45.76000", lon: "4.83000", niveau: "ville",
  paysCode: "FR", region: "Auvergne-Rhône-Alpes", ville: "Lyon", rayon: "25",
}).toString();

/*  LES DEUX BARREAUX D'ENCADREMENT, tels que le propriétaire les a
    refusés : `carte` (nº 847, « trop sombre ») et `eleve` (nº 846,
    « trop clair »). On ne les récite pas depuis le code du site — on les
    écrit ici en toutes lettres, pour que le banc dise la CONSIGNE et non
    ce que le site a fait. */
const CARTE = "#1A1F26";
const ELEVE = "#262C34";
const CLARTE = `(c) => {
  const [r, v, b] = c[0] === "#"
    ? [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
    : c.match(/\\d+/g).map(Number);
  return 0.2126 * r + 0.7152 * v + 0.0722 * b;
}`;

/** LA RANGÉE ET SES BADGES, TELS QUE L'ÉCRAN LES REND. */
const RANGEE = `() => {
  const bloc = document.querySelector("[data-titre-mosaique]");
  const rangee = document.querySelector("[data-filtres-actifs]");
  const compte = document.querySelector("[data-badge-compte]");
  const filtres = [...document.querySelectorAll("[data-filtre-actif]")];
  const grille = document.querySelector("[data-grille-tatoueurs]");
  const r = (n) => n.getBoundingClientRect();
  /*  L'AIR INTÉRIEUR, MESURÉ ET NON RÉCITÉ : on ne lit pas le
      rembourrage déclaré, on mesure les quatre distances entre le bord
      du badge et ce qu'il contient. Le TEXTE se mesure par une PLAGE
      (l'objet Range) — c'est le seul moyen d'atteindre la boîte anonyme
      qu'une ligne de flexion fabrique autour d'un texte nu. */
  const releve = (badge) => {
    const s = getComputedStyle(badge);
    const bb = r(badge);
    const bord = (cote) => parseFloat(s["border" + cote + "Width"]);
    const noeud = [...badge.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    const plage = document.createRange();
    plage.selectNodeContents(noeud);
    const tr = plage.getBoundingClientRect();
    const croix = badge.querySelector("[data-retrait-filtre]");
    const cb = croix ? r(croix) : null;
    const glyphe = croix ? r(croix.querySelector("svg")) : null;
    return {
      texte: badge.textContent.trim(),
      hauteur: Math.round(bb.height),
      /*  LES QUATRE AIRS. À GAUCHE, jusqu'au texte ; EN HAUT et EN BAS,
          jusqu'à la BOÎTE DE LIGNE — celle de la croix, qui vaut la
          même par construction (voir CROIX_BADGE, FiltresActifs) et
          qui, elle, est un
          élément mesurable. À DROITE, depuis cette même boîte. Sur le
          badge du compte, qui n'a pas de croix, la boîte de ligne se
          déduit de l'interligne. */
      gauche: +(tr.left - bb.left - bord("Left")).toFixed(2),
      haut: cb
        ? +(cb.top - bb.top - bord("Top")).toFixed(2)
        : +((bb.height - bord("Top") - bord("Bottom") - parseFloat(s.lineHeight)) / 2).toFixed(2),
      bas: cb
        ? +(bb.bottom - bord("Bottom") - cb.bottom).toFixed(2)
        : +((bb.height - bord("Top") - bord("Bottom") - parseFloat(s.lineHeight)) / 2).toFixed(2),
      droite: cb
        ? +(bb.right - bord("Right") - cb.right).toFixed(2)
        : +(bb.right - bord("Right") - tr.right).toFixed(2),
      croixBoite: cb ? Math.round(cb.width) + "x" + Math.round(cb.height) : null,
      croixHauteur: cb ? Math.round(cb.height) : null,
      glyphe: glyphe ? Math.round(glyphe.width) : null,
      interligne: Math.round(parseFloat(s.lineHeight)),
      corps: s.fontSize,
      graisse: s.fontWeight,
      fond: s.backgroundColor,
      trait: s.borderTopColor,
      y: Math.round(bb.top),
    };
  };
  return {
    compte: releve(compte),
    filtres: filtres.map(releve),
    //  LE JETON DE LA CHARTE, tel que la page le porte vraiment.
    jeton: getComputedStyle(document.documentElement)
      .getPropertyValue("--rw-sombre-carte-clair").trim(),
    bloc: {
      haut: getComputedStyle(bloc).paddingTop,
      bas: getComputedStyle(bloc).paddingBottom,
      //  L'AIR VU : du haut du bloc au haut de la rangée, et du bas de la
      //  rangée au bas du bloc — marges comprises, s'il en restait.
      airAuDessus: +(r(rangee).top - r(bloc).top).toFixed(2),
      airEnDessous: +(r(bloc).bottom - r(rangee).bottom).toFixed(2),
      //  … et rien ne s'intercale entre le bloc et les cartes.
      versGrille: grille ? +(r(grille).top - r(bloc).bottom).toFixed(2) : null,
    },
    rangeeY: Math.round(r(rangee).top),
    rangeeH: Math.round(r(rangee).height),
    /*  LA GARDE : la page est-elle VRAIMENT rendue ? Un bloc de tête en
        chantier garde ses boîtes (donc ses mesures) mais ne se peint
        pas — on refuse alors de conclure quoi que ce soit. */
    chantier: document.querySelector("main[aria-busy]") !== null,
    visible: getComputedStyle(bloc).visibility,
    cartes: document.querySelectorAll("[data-grille-tatoueurs] > *").length,
  };
}`;

//  ══ 1 · LA RANGÉE, AUX DEUX APPAREILS ════════════════════════════════
const releves = {};
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`848 · ${mode} — les badges : le fond, l'air, la croix, la graisse`);
    await page.goto(`${BASE}/search?${RECHERCHE}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    const m = await page.evaluate((R) => new Function("return " + R)()(), RANGEE);
    releves[mode] = m;
    const tous = [m.compte, ...m.filtres];
    const doigt = mode === "doigt";

    verif("la rangée porte bien les trois badges attendus (le compte, le style, la localité)",
      m.filtres.length === 2 && /^\d+ portfolios?$/.test(m.compte.texte),
      `« ${tous.map((b) => b.texte).join(" » « ")} »`);
    /*  ⚠️ ON MESURE CE QUI SE VOIT, ET ON LE PROUVE D'ABORD (voir la
        note de RECHERCHE, en tête) : ni chantier, ni bloc masqué, et des
        cartes sous la rangée. Sans cette garde, tout ce qui suit
        pourrait être mesuré sur une page invisible. */
    verif("la page est bel et bien RENDUE : aucun chantier, rien de masqué, des cartes dessous",
      m.chantier === false && m.visible === "visible" && m.cartes > 0,
      `chantier ${m.chantier} · ${m.visible} · ${m.cartes} carte(s)`);

    /*  ██ §1 — LE FOND : UN BARREAU ENTRE LES DEUX ██
        LE PROPRIÉTAIRE : « #1A1F26 trop sombre, #262C34 trop clair —
        mettre un barreau INTERMÉDIAIRE ; mesurer une luminosité entre 30
        et 43, sur la charte ». On mesure donc la LUMINOSITÉ RELATIVE du
        fond rendu, et on la veut STRICTEMENT entre celles des deux. */
    const clarte = await page.evaluate(
      ([C, ...couleurs]) => couleurs.map((c) => new Function("return " + C)()(c)),
      [CLARTE, m.filtres[0].fond, CARTE, ELEVE]
    );
    const [fond, bas, haut] = clarte;
    verif("le fond des badges à croix tombe ENTRE les deux essais refusés",
      fond > bas && fond < haut,
      `luminosité ${fond.toFixed(2)} — entre ${bas.toFixed(2)} (${CARTE}) et ${haut.toFixed(2)} (${ELEVE})`);
    verif("… et les deux badges à croix portent le MÊME fond",
      m.filtres.every((b) => b.fond === m.filtres[0].fond), m.filtres.map((b) => b.fond).join(" | "));
    /*  « SUR LA CHARTE » : la couleur n'est pas écrite au point d'usage,
        c'est un JETON de la palette. On le lit sur la page et on vérifie
        que c'est LUI que le badge porte. */
    const jetonRendu = await page.evaluate(
      ([C, jeton, fond]) => {
        const f = new Function("return " + C)();
        return Math.abs(f(jeton) - f(fond)) < 0.001;
      },
      [CLARTE, m.jeton, m.filtres[0].fond]
    );
    verif("… et cette couleur est un JETON DE LA CHARTE, pas une valeur posée à la main",
      /^#[0-9A-Fa-f]{6}$/.test(m.jeton) && jetonRendu,
      `--rw-sombre-carte-clair = ${m.jeton || "(absent)"} pour un fond ${m.filtres[0].fond}`);

    /*  ██ L'AIR INTÉRIEUR : LA RÈGLE A CHANGÉ À LA nº 850 ██
        CE QUE CE BANC MESURAIT ICI (nº 848) : « un seul nombre sur les
        quatre côtés », pris du bord du badge jusqu'à la BOÎTE DE LIGNE.
        LE PROPRIÉTAIRE A TRANCHÉ AUTREMENT à la nº 850 : ce qui compte
        est l'air VISUEL, jusqu'aux LETTRES — et il n'est pas égal des
        quatre côtés mais proportionné (12 ou 14 sur les côtés, 8 en haut
        et en bas). Une boîte de ligne de 22 px autour d'un texte de 15
        contenant déjà six pixels de vide en haut et en bas, la mesure
        d'ici disait 10 là où l'œil voyait 17.
        CE POINT-LÀ EST DONC MESURÉ AU BANC 850, sur l'encre peinte, et
        n'est plus mesuré ici : deux bancs ne diront pas deux vérités sur
        le même sujet. Ce qui reste ici est ce qui n'a pas changé — la
        rangée est HOMOGÈNE, et sa hauteur est celle que le squelette
        promet. */
    verif("tous les badges de la rangée ont la MÊME hauteur",
      tous.every((b) => b.hauteur === tous[0].hauteur),
      tous.map((b) => b.hauteur).join(" | "));
    //  §4 (nº 853) — TRENTE AUX DEUX APPAREILS : les badges prennent
    //  la boîte du badge du TYPE, au web comme au doigt.
    verif("… et c'est celle que le squelette d'attente promet",
      tous[0].hauteur === 30, `${tous[0].hauteur} px (attendu 30)`);

    /*  ██ §3c — LE TEXTE ET LA CROIX, AU WEB ██
        « un cran de plus qu'à la nº 847 » : le corps y valait 15 px sur
        les deux appareils, le dessin de la croix 16. Le doigt ne bouge
        pas, le web monte. */
    /*  nº 851 — AU DOIGT, LE CORPS EST CELUI DU BADGE DU TYPE (14 px) :
        le propriétaire a demandé les mesures exactes de ce badge-là sur
        smartphone. Le web garde le cran gagné à la nº 848. */
    verif("le corps est celui du badge du type : 14 px, aux deux appareils (nº 853-§4)",
      tous.every((b) => b.corps === "14px"),
      tous.map((b) => b.corps).join(" | "));
    verif(doigt
      ? "au doigt, le dessin de la croix ne bouge pas : 16 px"
      : "au web, le dessin de la croix monte d'un cran : 18 px contre 16",
      m.filtres.every((b) => b.glyphe === (doigt ? 16 : 18)),
      m.filtres.map((b) => `${b.glyphe} px`).join(" | "));

    /*  ██ §5 — LA GRAISSE ██
        « passer de 600 à 500 (medium) — le demi-gras paraît trop
        lourd ». Tous les badges, les deux robes. */
    /*  nº 851 — LA GRAISSE SUIT LE MÊME PARTAGE : demi-grasse au doigt
        (celle du badge du type), moyenne au web (nº 848-§5). */
    verif("la graisse est celle du badge du type (600), aux deux appareils (nº 853-§4)",
      tous.every((b) => b.graisse === "600"),
      tous.map((b) => b.graisse).join(" | "));

    /*  ██ §4 — LE SÉPARATEUR DU BADGE DE LOCALITÉ ██
        « le gros point est trop grand ; utiliser le point médian fin
        “ · ”, avec un espace de chaque côté ». */
    const localite = m.filtres.find((b) => /\d+ mi$/.test(b.texte));
    verif("le badge de localité sépare au POINT MÉDIAN FIN, entouré d'espaces",
      localite && localite.texte === "Lyon · 25 mi",
      `« ${localite ? localite.texte : "(pas de badge de localité)"} »`);
    verif("… et la grosse puce n'y est plus", localite && !localite.texte.includes("•"));

    /*  ██ §3a — L'AIR AU-DESSUS ET L'AIR AU-DESSOUS ██
        LE PROPRIÉTAIRE, pour le WEB : « l'air au-dessus de la rangée est
        trop grand (déséquilibré) — le réduire pour l'équilibrer avec
        l'air dessous ». Au doigt, il n'a rien demandé : les valeurs de la
        nº 847 doivent tenir au pixel. */
    if (doigt) {
      verif("au doigt, l'air ne bouge pas d'un pixel : 16 au-dessus, 24 au-dessous (nº 847-§6)",
        m.bloc.airAuDessus === 16 && m.bloc.airEnDessous === 24,
        `${m.bloc.airAuDessus} / ${m.bloc.airEnDessous}`);
    } else {
      verif("au web, l'air au-dessus de la rangée vaut EXACTEMENT celui du dessous",
        m.bloc.airAuDessus === m.bloc.airEnDessous,
        `${m.bloc.airAuDessus} au-dessus, ${m.bloc.airEnDessous} au-dessous`);
      verif("… et il a bien DIMINUÉ : 24 px, contre 38 à la nº 847 (32 du bloc + 6 de la rangée)",
        m.bloc.airAuDessus === 24, `${m.bloc.airAuDessus} px`);
    }
    verif("rien ne s'intercale entre le bloc de tête et les cartes : le dégagement EST l'air",
      m.bloc.versGrille === 0, `${m.bloc.versGrille} px`);
  } catch (e) {
    verif(`déroulement du banc 848 (la rangée, ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · LE WEB CONTRE LE DOIGT : LE CRAN DE PLUS ═════════════════════
{
  titre("848 · le web monte bien d'un cran sur le doigt");
  const d = releves.doigt, w = releves.web;
  /*  §4 (nº 853) — LE CORPS NE DIFFÈRE PLUS : les deux appareils
      prennent celui du badge du type. Ce qui reste vrai, et qu'on
      garde : les deux rangées disent la même chose, au même corps. */
  verif("le corps du texte est le MÊME aux deux appareils",
    d && w && w.compte.corps === d.compte.corps,
    d && w ? `${d.compte.corps} au doigt, ${w.compte.corps} au web` : "relevé manquant");
  verif("le dessin de la croix aussi",
    d && w && w.filtres[0].glyphe > d.filtres[0].glyphe,
    d && w ? `${d.filtres[0].glyphe} px au doigt, ${w.filtres[0].glyphe} au web` : "relevé manquant");
  /*  nº 850 — L'AIR N'EST PLUS LE MÊME AUX DEUX APPAREILS : le web en a
      un cran de plus sur les côtés (le propriétaire l'a demandé), et son
      texte est plus grand. Ce qui reste vrai, et qu'on garde : le badge
      du web est PLUS HAUT que celui du doigt, parce que ses lettres le
      sont. Le détail des quatre airs se mesure au banc 850. */
  /*  nº 851 — LES DEUX HAUTEURS NE SE COMPARENT PLUS : le doigt suit le
      badge du type (30 px), le web suit l'air visuel de la nº 850 (28).
      Chacune est vérifiée là où sa règle est écrite — bancs 851 et 850.
      Ce qui reste vrai des deux côtés : la rangée est homogène. */
  verif("chaque appareil garde une rangée homogène",
    d && w && d.filtres.every((b) => b.hauteur === d.compte.hauteur) &&
    w.filtres.every((b) => b.hauteur === w.compte.hauteur),
    d && w ? `doigt ${d.compte.hauteur} px · web ${w.compte.hauteur} px` : "relevé manquant");
}

//  ══ 3 · LE SQUELETTE D'ATTENTE PROMET LA MÊME RANGÉE ═════════════════
/*  LA LEÇON DU BANC nº 845, ET LA CONSIGNE : « la hauteur du badge
    grandit en conséquence — le squelette d'attente suit ». Un squelette
    qui promettrait les 30 px de la nº 847 ferait remonter toute la page
    de 14 à 16 px à l'arrivée des cartes. */
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`848 · ${mode} — le squelette promet la rangée qui vient`);
    /*  ⚠️ COMMENT ON ATTRAPE LE SQUELETTE (procédé du banc nº 845) : on
        rend la main dès que la navigation est COMMISE, puis on interroge
        toutes les cinq millisecondes. Le repli de `loading.tsx` part dans
        le premier flux. TROIS TENTATIVES, parce que la doublure répond en
        dix millisecondes et que la fenêtre se referme parfois avant la
        première question — le squelette existe, on l'a manqué. */
    let gris = null;
    for (let essai = 0; essai < 3 && !gris; essai += 1) {
      await page.goto(`${BASE}/search?${RECHERCHE}`, { waitUntil: "commit" });
      for (let i = 0; i < 400 && !gris; i += 1) {
        gris = await page.evaluate(() => {
          const b = document.querySelector('[aria-busy="true"]');
          if (!b) return null;
          //  LA RANGÉE GRISE : la ligne de flexion du bloc de tête.
          const ligne = b.querySelector("[data-squelette-badges]");
          const bloc = ligne?.parentElement;
          const cases = [...(ligne?.children ?? [])];
          if (!cases.length) return null;
          const r = (n) => n.getBoundingClientRect();
          return {
            hauteurs: cases.map((n) => Math.round(r(n).height)),
            largeurs: cases.map((n) => Math.round(r(n).width)),
            y: Math.round(r(ligne).top),
            h: Math.round(r(ligne).height),
            hautBloc: getComputedStyle(bloc).paddingTop,
            basBloc: getComputedStyle(bloc).paddingBottom,
            airAuDessus: +(r(ligne).top - r(bloc).top).toFixed(2),
          };
        }).catch(() => null);
        if (!gris) await page.waitForTimeout(5);
      }
    }
    verif("le squelette de la recherche est bien là, avec sa rangée de badges gris",
      gris !== null && gris.hauteurs.length === 2,
      gris ? `${gris.hauteurs.length} rectangle(s)` : "jamais vu");

    //  LA VRAIE RANGÉE, une fois la page arrivée — et VISIBLE, pas
    //  seulement présente (voir la garde plus haut).
    await page.waitForSelector("[data-filtres-actifs]", {
      state: "visible", timeout: 15000,
    });
    await page.waitForTimeout(1200);
    const vrai = await page.evaluate((R) => new Function("return " + R)()(), RANGEE);

    //  nº 850 — les deux hauteurs que l'air visuel appelle désormais.
    const attendue = 30;
    verif("les badges gris ont la hauteur des vrais badges",
      gris.hauteurs.every((h) => h === attendue),
      `${gris.hauteurs.join(" | ")} pour ${attendue} attendus`);
    verif("l'air au-dessus est le même que sur la vraie page",
      gris.airAuDessus === vrai.bloc.airAuDessus && gris.hautBloc === vrai.bloc.haut,
      `${gris.airAuDessus} (${gris.hautBloc}) contre ${vrai.bloc.airAuDessus} (${vrai.bloc.haut})`);
    verif("AUCUN SAUT AU REMPLACEMENT : la rangée arrive là où le squelette la promettait",
      gris.y === vrai.rangeeY && gris.h === vrai.rangeeH,
      `promis ${gris.y} px de haut sur ${gris.h}, venu ${vrai.rangeeY} sur ${vrai.rangeeH}`);
  } catch (e) {
    verif(`déroulement du banc 848 (squelette, ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4 · LA PUCE N'A PAS BOUGÉ AILLEURS ═══════════════════════════════
/*  §4 — « le point médian NE remplace la puce QUE dans le badge de
    localité ». Le sous-titre de l'accueil (« 58 portfolios • 4 styles »)
    est l'autre porteur de la puce, et il ne doit pas avoir changé. */
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("848 · la grosse puce reste où elle était");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    const sousTitre = await page.evaluate(() =>
      document.querySelector("[data-titre-mosaique] p")?.textContent?.trim() ?? null);
    verif("le sous-titre de l'accueil garde la puce du site, intacte",
      /^\d+ portfolios? • \d+ styles?$/.test(sousTitre ?? ""), `« ${sousTitre} »`);
  } catch (e) {
    verif("déroulement du banc 848 (la puce ailleurs)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

process.exit(bilan());
