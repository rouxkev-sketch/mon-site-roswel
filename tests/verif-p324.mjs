/**
 * BANC DE LA PASSE Nº 324 — LIVRAISON RAPIDE
 * ==================================================================
 * TOUTE LA PASSE PORTE SUR « QUI SOMMES-NOUS ».
 *
 * §1 — LE TEXTE, au mot près, et ses CINQ gras.
 *      Plus LE CONTRÔLE DES ESPACES MANGÉES, paragraphe par
 *      paragraphe : cette page en a déjà produit deux (nº 319 et
 *      nº 321), on ne se fie donc pas à la source, on lit le RENDU.
 * §2 — LE LIBELLÉ du lien rose : « Chercher un style ».
 * §3 — LA DESTINATION du bouton gris, dans les DEUX états du visiteur.
 * §4 — LA MISE EN PAGE N'A PAS BOUGÉ : l'empreinte relevée AVANT la
 *      retouche est gravée ici, comme à la nº 322.
 *
 * ⚠️ UNE SEULE LARGEUR : 1440 × 823, celle du propriétaire.
 */
import {
  BASE,
  bilan,
  lire,
  nonJoue,
  ouvrirLeNavigateur,
  titre,
  verif,
} from "./commun-verif.mjs";

/*  LES DEUX CARACTÈRES INVISIBLES : apostrophe courbe et espace
    insécable. LES DEUX CÔTÉS passent par ici (leçon de la nº 320). */
const nu = (t) =>
  t.replace(/[’']/g, "'").replace(/ /g, " ").replace(/\s+/g, " ").trim();

const { nav, page } = await ouvrirLeNavigateur("p324", {
  width: 1440,
  height: 823,
});

/* ==================================================================
 * §1 — LE TEXTE
 * ================================================================== */
titre("§1 — le texte du propriétaire, au mot près, et ses cinq gras");

const ATTENDUS = [
  "« Yoko » vient du japonais, il signifie « couché, sur le côté ». Regarde le cœur rose du logo, il est incliné. « Folio » vient de portfolio : c'est le cœur du site. YokoFolio, c'est un cœur incliné qui t'emmène vers des portfolios.",
  "Un tatouage commence par un style. YokoFolio classe les tatoueurs par style.",
  "Essaie de chercher « du réalisme autour de Lyon » sur Instagram : c'est l'algorithme qui décide ce que tu verras. Ici, c'est toi.",
  "Choisis un style, une ville et un rayon : les tatoueurs qui correspondent s'affichent, chacun avec un portfolio consacré à son travail dans le style recherché.",
  "YokoFolio n'a pas d'algorithme, il a des styles — et il te conduit jusqu'à l'Instagram de celui qui les tatoue.",
  //  ⚠️ AMENDÉ PAR LA nº 326 : les DEUX APPELS ont été réécrits par
  //  le propriétaire. Ils sont mis à jour ici PLUTÔT QUE RETIRÉS,
  //  parce que ce banc en a besoin pour ce qui reste SON sujet — la
  //  réécriture du §1 de la nº 324 (l'algorithme, la phrase sur
  //  Instagram, le « Ici » qui ouvre la dernière) : ces trois-là se
  //  mesurent sur les NEUF paragraphes, pas sur deux. La mesure
  //  PROPRE aux deux appels, elle, vit dans `verif-p326.mjs`, avec
  //  leurs virgules et le collage d'espaces après chaque amorce.
  "Tatoueur ? Montre tes styles, c'est par eux qu'on te trouvera.",
  "Envie d'un tatouage ? Cherche le style, tu trouveras l'artiste.",
  "Pas d'avis, pas de notes.",
  "Ici, personne ne commente ni ne juge le travail d'un tatoueur. Son portfolio parle pour lui. À toi de te faire ton avis.",
];
const GRAS = [
  "Ici, c'est toi.",
  "Choisis un style, une ville et un rayon :",
  "Tatoueur ?",
  //  ⚠️ « Curieux ? » a cédé la place à la nº 326 — le compte reste
  //  de cinq, seule cette amorce-ci a changé de mots.
  "Envie d'un tatouage ?",
  "À toi de te faire ton avis.",
];

{
  await page.goto(`${BASE}/qui-sommes-nous`, { waitUntil: "networkidle" });
  const m = await page.evaluate(() => {
    const main = document.querySelector("main");
    return {
      paragraphes: [...main.querySelectorAll("p")].map((p) =>
        p.textContent.trim()
      ),
      gras: [...main.querySelectorAll("strong")].map((n) => ({
        texte: n.textContent.trim(),
        couleur: getComputedStyle(n).color,
        graisse: getComputedStyle(n).fontWeight,
      })),
      titre: main.querySelector("h1").textContent.trim(),
      sections: [...main.querySelectorAll("h2")].map((n) =>
        n.textContent.trim()
      ),
    };
  });

  const ecarts = ATTENDUS.map((attendu, rang) => ({ attendu, rang })).filter(
    ({ attendu, rang }) => nu(m.paragraphes[rang] ?? "") !== nu(attendu)
  );
  verif(
    "LES NEUF PARAGRAPHES SONT CEUX DU PROPRIÉTAIRE, AU MOT PRÈS — zéro écart",
    m.paragraphes.length === ATTENDUS.length && ecarts.length === 0,
    ecarts.length
      ? `écart au paragraphe ${ecarts[0].rang + 1} : « ${nu(
          m.paragraphes[ecarts[0].rang] ?? ""
        ).slice(0, 70)}… »`
      : "9 paragraphes conformes"
  );
  verif(
    "…et les DEUX TITRES DE SECTION, plus le titre de la page",
    nu(m.titre) === nu("Pourquoi « YokoFolio » ?") &&
      nu(m.sections.join(" | ")) ===
        nu("Ce que fait le site | Ce qu'on ne fait pas"),
    `« ${m.titre} » · ${m.sections.join(" | ")}`
  );
  verif(
    "IL Y A CINQ GRAS, dans l'ordre, et ce sont ceux-là",
    nu(m.gras.map((g) => g.texte).join(" | ")) === nu(GRAS.join(" | ")),
    m.gras.map((g) => g.texte).join(" | ")
  );
  verif(
    "…et les CINQ sont EN BLANC (#F2F2F4) et EN GRAS (700)",
    m.gras.length === 5 &&
      m.gras.every(
        (g) => g.couleur === "rgb(242, 242, 244)" && Number(g.graisse) >= 700
      ),
    m.gras.map((g) => `${g.couleur}/${g.graisse}`).join(" · ")
  );

  //  LES TROIS CHANGEMENTS DE LA nº 324, NOMMÉS UN PAR UN.
  verif(
    "§1 — L'ALGORITHME REMPLACE « aucune case ne pose cette question »",
    /c'est l'algorithme qui décide ce que tu verras\. Ici, c'est toi\.$/.test(
      nu(m.paragraphes[2])
    ) && !/aucune case/.test(nu(m.paragraphes.join(" "))),
    `« …${nu(m.paragraphes[2]).slice(-52)} »`
  );
  verif(
    "§1 — LA PHRASE SUR INSTAGRAM est réécrite, et reste EN STYLE NORMAL",
    nu(m.paragraphes[4]) === nu(ATTENDUS[4]) &&
      !m.gras.some((g) => /algorithme|Instagram/.test(nu(g.texte))),
    `« ${m.paragraphes[4]} »`
  );
  verif(
    "§1 — « ICI » OUVRE LA DERNIÈRE PHRASE (« Ici, personne ne commente… »)",
    nu(m.paragraphes[8]).startsWith("Ici, personne ne commente") &&
      !/tatoueur ici\./.test(nu(m.paragraphes[8])),
    `« ${nu(m.paragraphes[8]).slice(0, 46)}… »`
  );
}

titre("§1 — LES ESPACES MANGÉES : le rendu, paragraphe par paragraphe");
{
  /*  LA SIGNATURE D'UNE ESPACE MANGÉE (procédé de la nº 322-§2) :
      React sépare deux nœuds de texte voisins par un commentaire vide
      `<!-- -->`. Un caractère de mot DES DEUX CÔTÉS de ce marqueur,
      c'est exactement deux mots que le rendu colle — « Tatoueur ?Crée »
      (nº 319), « YokoFolione remplace » (nº 321).
      ⚠️ ON LIT LE HTML SERVI, PAS LA SOURCE : c'est la consigne, et
      c'est la seule façon de voir ce que le compilateur a fait. */
  const html = await (await page.request.get(`${BASE}/qui-sommes-nous`)).text();
  const collages = [
    ...html.matchAll(/.{0,24}[\p{L}\p{N}]<!-- -->[\p{L}\p{N}].{0,24}/gu),
  ].map((c) => c[0]);
  verif(
    "AUCUN COLLAGE SUR TOUTE LA PAGE — la sonde ne trouve rien",
    collages.length === 0,
    collages.length ? `« ${collages[0]} »` : "0 occurrence"
  );

  /*  ET LE CONTRÔLE PARAGRAPHE PAR PARAGRAPHE, celui que le
      propriétaire demande : on découpe le HTML servi en `<p>` et on
      cherche la signature DANS CHACUN — on sait alors LEQUEL fauterait.
      ⚠️ ON CHERCHE LA SIGNATURE, PAS UNE FORME DE MOT. Une première
      version guettait « une minuscule collée à une majuscule » : elle
      accusait « YokoFolio », dont le F majuscule est au milieu du nom.
      Une heuristique sur les lettres ne peut pas distinguer un nom
      propre d'un collage ; le marqueur de React, lui, ne dit qu'une
      chose et il la dit toujours. */
  const paragraphes = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(
    (m) => m[1]
  );
  const fautifs = paragraphes
    .map((corps, rang) => ({ rang, colle: /[\p{L}\p{N}]<!-- -->[\p{L}\p{N}]/u.test(corps) }))
    .filter((p) => p.colle);
  verif(
    "…et AUCUN des neuf paragraphes ne colle deux mots l'un à l'autre",
    paragraphes.length >= 9 && fautifs.length === 0,
    fautifs.length
      ? `paragraphe ${fautifs[0].rang + 1}`
      : `${paragraphes.length} paragraphes contrôlés, 0 collage`
  );

  //  LES DEUX DÉFAUTS HISTORIQUES, NOMMÉMENT : ils ne sont pas revenus.
  const texteEntier = nu(await page.textContent("main"));
  verif(
    "les deux collages déjà connus ne sont pas revenus (« Tatoueur ?Crée », « YokoFolione »)",
    !/Tatoueur \?Crée/.test(texteEntier) && !/YokoFolion/.test(texteEntier),
    "ni l'un ni l'autre"
  );
  //  ET LE COLLAGE NEUF QUE CETTE PASSE POUVAIT PRODUIRE : le gras de
  //  fin de phrase, dont l'espace PRÉCÉDENTE se fait avaler.
  verif(
    "…ni celui que le §1 pouvait créer : « verras.Ici » (l'espace AVANT un gras)",
    /tu verras\. Ici, c'est toi\./.test(texteEntier),
    "« tu verras. Ici, c'est toi. »"
  );
}

/* ==================================================================
 * §2 — LE LIBELLÉ DU LIEN ROSE
 * ================================================================== */
titre("§2 — le lien rose dit « Chercher un style »");
{
  const rose = await page.evaluate(() => {
    const n = [...document.querySelectorAll("main a")].find(
      (a) => a.getAttribute("href") === "/"
    );
    const s = getComputedStyle(n);
    return {
      texte: n.textContent.trim(),
      href: n.getAttribute("href"),
      fond: s.backgroundColor,
      couleur: s.color,
      bordure: s.borderTopWidth,
      hauteur: Math.round(n.getBoundingClientRect().height),
    };
  });
  verif(
    "IL DIT « Chercher un style » — le tatoueur a laissé la place au style",
    rose.texte === "Chercher un style",
    `« ${rose.texte} »`
  );
  verif(
    "SA DESTINATION NE CHANGE PAS : toujours l'accueil",
    rose.href === "/",
    rose.href
  );
  verif(
    "SON APPARENCE NE CHANGE PAS : capsule rose #EE3D6F, texte blanc, aucun contour",
    rose.fond === "rgb(238, 61, 111)" &&
      rose.couleur === "rgb(255, 255, 255)" &&
      rose.bordure === "0px" &&
      rose.hauteur === 54,
    `${rose.fond} · ${rose.couleur} · ${rose.hauteur} px de haut`
  );
  //  LE LIBELLÉ DU MOTEUR, LUI, N'A PAS BOUGÉ : deux endroits, deux
  //  phrases — le propriétaire n'a rien demandé pour le second.
  verif(
    "…et `titreRecherche`, le libellé du MOTEUR, est intact",
    /titreRecherche: "Chercher un tatoueur"/.test(lire("src/config/tatouage.ts")),
    "« Chercher un tatoueur » reste au-dessus des deux champs"
  );
}

/* ==================================================================
 * §3 — LA DESTINATION DE « CRÉE TON PORTFOLIO »
 * ================================================================== */
titre("§3 — le bouton gris : deux visiteurs, deux destinations");
{
  /** Ce que le bouton rend, tel que le SERVEUR l'envoie puis tel que
      le navigateur le tient après hydratation. */
  const lireLeBouton = () =>
    page.evaluate(() => {
      const n = document.querySelector("[data-bouton-creer-portfolio]");
      const s = getComputedStyle(n);
      return {
        href: n.getAttribute("href"),
        texte: n.textContent.trim(),
        connecte: n.hasAttribute("data-connecte"),
        fond: s.backgroundColor,
        couleur: s.color,
        bordure: s.borderTopWidth,
        hauteur: Math.round(n.getBoundingClientRect().height),
      };
    });

  /* ---------- SANS COMPTE : UN NAVIGATEUR VRAIMENT NEUF ----------
      ⚠️ ET C'EST TOUT LE SOIN À PRENDRE ICI. Le socle pose une session
      à la création du contexte : effacer les cookies APRÈS avoir déjà
      chargé une page ne suffit pas. Le drapeau « déjà venu » se lit
      dans un cookie MAIS AUSSI dans le `localStorage` (voir
      lib/deja-connecte, l'héritage d'avant la nº 203), que
      `clearCookies` ne touche pas — le banc lisait alors « Me
      connecter » là où un vrai nouveau venu lit « Créer mon compte ».
      On ouvre donc un navigateur à part et on efface AVANT la première
      navigation : rien n'a pu écrire nulle part. */
  const neuf = await ouvrirLeNavigateur("p324n", { width: 1440, height: 823 });
  await neuf.ctx.clearCookies();
  await neuf.page.goto(`${BASE}/qui-sommes-nous`, { waitUntil: "networkidle" });
  const anonyme = await neuf.page.evaluate(() => {
    const n = document.querySelector("[data-bouton-creer-portfolio]");
    return {
      href: n.getAttribute("href"),
      connecte: n.hasAttribute("data-connecte"),
    };
  });
  verif(
    "SANS COMPTE — il mène à `/devenir-tatoueur`, la page de compte",
    anonyme.href === "/devenir-tatoueur" && anonyme.connecte === false,
    anonyme.href
  );
  /*  …ET CETTE PAGE S'OUVRE BIEN SUR « CRÉER MON COMPTE » pour qui n'a
      pas de compte. On ne le suppose pas : on y va, et on lit quel
      onglet est actif. C'est la moitié de la promesse du §3 — sans
      elle, « la page de création de compte » ne serait qu'un mot. */
  await neuf.page.goto(`${BASE}/devenir-tatoueur`, {
    waitUntil: "networkidle",
  });
  /*  ⚠️ LE SÉLECTEUR N'EST PAS UN JEU D'ONGLETS ARIA : c'est un
      `radiogroup` (SelecteurCapsule), et l'actif se dit
      `aria-checked="true"`. Chercher `aria-selected` ne trouvait rien
      — la première exécution du banc l'a montré. */
  const onglet = await neuf.page.evaluate(() => {
    const actif = [...document.querySelectorAll('[role="radio"]')].find(
      (b) => b.getAttribute("aria-checked") === "true"
    );
    return actif ? actif.textContent.trim() : "";
  });
  verif(
    "…et cette page S'OUVRE SUR « Créer mon compte » — le nouveau venu y arrive directement",
    onglet === "Créer mon compte",
    `onglet actif : « ${onglet} »`
  );

  await neuf.ctx.close();
  await neuf.nav.close();

  /* ---------- CONNECTÉ ---------- */
  /*  ⚠️ CE CAS-LÀ EST JOUABLE, ET C'EST IMPORTANT DE DIRE POURQUOI :
      le bouton lit la session DANS LE COOKIE (`useUtilisateur`, côté
      serveur comme côté navigateur), et non par `auth.getUser()` —
      c'est cette seconde voie, cryptographique, que le cookie fabriqué
      du socle ne franchit pas (d'où le 307 de /mes-favoris). Ici le
      cookie du socle suffit : le HTML servi porte déjà la destination
      d'un connecté. */
  const connecte = await ouvrirLeNavigateur("p324c", {
    width: 1440,
    height: 823,
  });
  await connecte.page.goto(`${BASE}/qui-sommes-nous`, {
    waitUntil: "networkidle",
  });
  const vu = await connecte.page.evaluate(() => {
    const n = document.querySelector("[data-bouton-creer-portfolio]");
    return {
      href: n.getAttribute("href"),
      texte: n.textContent.trim(),
      connecte: n.hasAttribute("data-connecte"),
    };
  });
  verif(
    "CONNECTÉ — il mène à « Ma sélection » (`/mes-favoris`)",
    vu.href === "/mes-favoris" && vu.connecte === true,
    vu.href
  );
  //  LA DESTINATION VIENT DE LA CONSTANTE, pas d'un chemin recopié.
  verif(
    "…et ce chemin vient de `ARRIVEE_SANS_PORTFOLIO`, jamais écrit à la main",
    /ARRIVEE_SANS_PORTFOLIO/.test(lire("src/components/BoutonCreerPortfolio.tsx")) &&
      /export const ARRIVEE_SANS_PORTFOLIO = "\/mes-favoris";/.test(
        lire("src/config/tatouage.ts")
      ),
    "une seule écriture de « Ma sélection »"
  );
  await connecte.ctx.close();
  await connecte.nav.close();

  /* ---------- SON LIBELLÉ ET SON HABIT N'ONT PAS BOUGÉ ---------- */
  await page.goto(`${BASE}/qui-sommes-nous`, { waitUntil: "networkidle" });
  const habit = await lireLeBouton();
  verif(
    "SON LIBELLÉ NE CHANGE PAS : « Crée ton portfolio »",
    habit.texte === "Crée ton portfolio",
    `« ${habit.texte} »`
  );
  verif(
    "SON APPARENCE NON PLUS : #33333A, texte blanc, aucun contour, 54 px de haut",
    habit.fond === "rgb(51, 51, 58)" &&
      habit.couleur === "rgb(255, 255, 255)" &&
      habit.bordure === "0px" &&
      habit.hauteur === 54,
    `${habit.fond} · ${habit.couleur} · ${habit.bordure} · ${habit.hauteur} px`
  );
  await page.hover("[data-bouton-creer-portfolio]");
  await page.waitForTimeout(400);
  const survol = await page.evaluate(
    () =>
      getComputedStyle(document.querySelector("[data-bouton-creer-portfolio]"))
        .backgroundColor
  );
  verif(
    "…et son survol reste #4A4A53, comme la nº 321 l'a posé",
    survol === "rgb(74, 74, 83)",
    survol
  );
}

/* ==================================================================
 * §4 — LA MISE EN PAGE N'A PAS BOUGÉ
 * ================================================================== */
titre("§4 — l'empreinte de mise en page, relevée AVANT la retouche");
{
  /*  ⚠️ CES VALEURS ONT ÉTÉ MESURÉES SUR LA PAGE AVANT QUE LE TEXTE NE
      SOIT TOUCHÉ, à 1440 × 823. Elles sont GRAVÉES ici plutôt que
      comparées à une seconde mesure éphémère (procédé de la nº 322) :
      la garde vaut donc pour toutes les passes à venir, et c'est elle
      qui tient l'exception de mise en page actée à la nº 320.
      ⚠️ UNE SEULE CHOSE A LE DROIT DE CHANGER, et elle est mesurée à
      part : LA LARGEUR DU BOUTON ROSE. Il est `inline-flex`, sa
      largeur suit donc son libellé — « Chercher un style » est plus
      court que « Chercher un tatoueur » (223 → 195 px). Ce n'est pas
      la mise en page qui bouge, c'est le §2 qui s'applique. */
  await page.mouse.move(5, 5);
  const EMPREINTE = {
    main: {
      largeur: 720,
      remplissageHaut: "64px",
      remplissageBas: "96px",
      remplissageGauche: "24px",
    },
    h1: {
      taille: "46.4px",
      graisse: "700",
      couleur: "rgb(242, 242, 244)",
      margeHaut: "40px",
      largeur: 672,
      gauche: 384,
    },
    chapo: {
      taille: "19px",
      couleur: "rgb(168, 168, 176)",
      margeHaut: "24px",
      hauteurLigne: "32.3px",
    },
    titreDeSection: {
      taille: "28.8px",
      graisse: "700",
      couleur: "rgb(242, 242, 244)",
    },
    section: { margeHaut: "64px", bordureHaut: "0px" },
    corps: {
      taille: "17px",
      couleur: "rgb(168, 168, 176)",
      hauteurLigne: "29.75px",
      ecart: "16px",
      margeHaut: "16px",
    },
    rose: {
      taille: "16px",
      graisse: "600",
      couleur: "rgb(255, 255, 255)",
      fond: "rgb(238, 61, 111)",
      margeHaut: "0px",
      remplissageGauche: "28px",
      bordureHaut: "0px",
    },
  };

  const mesure = await page.evaluate(() => {
    const geo = (n, ...clefs) => {
      const s = getComputedStyle(n);
      const r = n.getBoundingClientRect();
      const source = {
        taille: s.fontSize,
        graisse: s.fontWeight,
        hauteurLigne: s.lineHeight,
        couleur: s.color,
        fond: s.backgroundColor,
        margeHaut: s.marginTop,
        remplissageHaut: s.paddingTop,
        remplissageBas: s.paddingBottom,
        remplissageGauche: s.paddingLeft,
        bordureHaut: s.borderTopWidth,
        ecart: s.gap,
        largeur: Math.round(r.width),
        gauche: Math.round(r.left),
      };
      return Object.fromEntries(clefs.map((c) => [c, source[c]]));
    };
    const main = document.querySelector("main");
    const sections = [...main.querySelectorAll("section")];
    const rose = [...main.querySelectorAll("a")].find(
      (a) => a.getAttribute("href") === "/"
    );
    //  Les DEUX titres et les DEUX corps, ramenés à leurs valeurs
    //  DISTINCTES : plus d'une, et l'un d'eux a dérivé.
    //  ⚠️ ON DÉDOUBLONNE PAR LA CHAÎNE, MAIS ON REND DES OBJETS :
      //  rendre les chaînes faisait comparer `"{…}"` à `{…}`, et les
      //  trois contrôles rataient sur des valeurs pourtant justes.
      const distinct = (liste) =>
        [...new Set(liste.map((o) => JSON.stringify(o)))].map((c) =>
          JSON.parse(c)
        );
    return {
      main: geo(
        main,
        "largeur",
        "remplissageHaut",
        "remplissageBas",
        "remplissageGauche"
      ),
      h1: geo(
        main.querySelector("h1"),
        "taille",
        "graisse",
        "couleur",
        "margeHaut",
        "largeur",
        "gauche"
      ),
      chapo: geo(
        main.querySelector("h1 + p"),
        "taille",
        "couleur",
        "margeHaut",
        "hauteurLigne"
      ),
      titres: distinct(
        [...main.querySelectorAll("h2")].map((n) =>
          geo(n, "taille", "graisse", "couleur")
        )
      ),
      sections: distinct(
        sections.map((s) => geo(s, "margeHaut", "bordureHaut"))
      ),
      corps: distinct(
        sections.map((s) =>
          geo(
            s.querySelector("h2").nextElementSibling,
            "taille",
            "couleur",
            "hauteurLigne",
            "ecart",
            "margeHaut"
          )
        )
      ),
      rose: geo(
        rose,
        "taille",
        "graisse",
        "couleur",
        "fond",
        "margeHaut",
        "remplissageGauche",
        "bordureHaut"
      ),
      largeurRose: Math.round(rose.getBoundingClientRect().width),
      nombreDeSections: sections.length,
      largeurDocument: document.documentElement.scrollWidth,
    };
  });

  const memeQue = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  verif(
    "LA COLONNE : 720 px, mêmes marges intérieures (64 / 96 / 24)",
    memeQue(EMPREINTE.main, mesure.main),
    JSON.stringify(mesure.main)
  );
  verif(
    "LE GRAND TITRE : 46,4 px, gras 700, #F2F2F4, à la même place au pixel",
    memeQue(EMPREINTE.h1, mesure.h1),
    `${mesure.h1.taille} · ${mesure.h1.largeur} px à ${mesure.h1.gauche}`
  );
  verif(
    "LE CHAPÔ : 19 px, #A8A8B0, interligne 32,3, 24 px sous le titre",
    memeQue(EMPREINTE.chapo, mesure.chapo),
    JSON.stringify(mesure.chapo)
  );
  verif(
    "LES DEUX TITRES DE SECTION : une seule écriture, 28,8 px gras 700",
    mesure.titres.length === 1 &&
      memeQue(EMPREINTE.titreDeSection, mesure.titres[0]),
    `${mesure.titres.length} écriture(s) · ${JSON.stringify(mesure.titres[0])}`
  );
  verif(
    "LES DEUX SECTIONS : 64 px de marge haute, et TOUJOURS AUCUN TRAIT",
    mesure.sections.length === 1 && memeQue(EMPREINTE.section, mesure.sections[0]),
    JSON.stringify(mesure.sections[0])
  );
  verif(
    "LES DEUX CORPS : 17 px, #A8A8B0, interligne 29,75, écart 16",
    mesure.corps.length === 1 && memeQue(EMPREINTE.corps, mesure.corps[0]),
    `${mesure.corps.length} écriture(s) · ${JSON.stringify(mesure.corps[0])}`
  );
  verif(
    "IL Y A TOUJOURS DEUX SECTIONS — aucune ajoutée ni scindée",
    mesure.nombreDeSections === 2,
    `${mesure.nombreDeSections} sections`
  );
  verif(
    "LE BOUTON ROSE : mêmes taille, graisse, couleurs, marge et remplissage",
    memeQue(EMPREINTE.rose, mesure.rose),
    JSON.stringify(mesure.rose)
  );
  verif(
    "…SEULE SA LARGEUR CHANGE, et c'est le §2 : 223 px AVANT, 195 px APRÈS",
    mesure.largeurRose === 195,
    `${mesure.largeurRose} px — « Chercher un style » est plus court`
  );
  verif(
    "LA PAGE NE DÉBORDE PAS : le document fait la largeur de la fenêtre",
    mesure.largeurDocument === 1440,
    `${mesure.largeurDocument} px`
  );

  //  ET L'EXCEPTION DE LA nº 320 EST TOUJOURS ÉCRITE.
  verif(
    "L'EXCEPTION DE MISE EN PAGE DE LA nº 320 est toujours en commentaire",
    /AUCUNE PASSE FUTURE NE DOIT LES Y RAMENER/.test(
      lire("src/app/(tatouage)/qui-sommes-nous/page.tsx")
    ),
    "le commentaire est intact"
  );
}

nonJoue(
  "« MA SÉLECTION » OUVERTE AU BOUT DU BOUTON",
  "le §3 prouve OÙ le bouton mène — l'attribut `href` que le serveur " +
    "envoie et que le navigateur tient, dans les deux états. Il ne " +
    "prouve pas que la page d'arrivée s'affiche : /mes-favoris exige " +
    "une session Supabase signée par le serveur (`auth.getUser()`), que " +
    "le cookie fabriqué du socle ne franchit pas. La destination est " +
    "vérifiée, l'arrivée reste à l'œil du propriétaire."
);

nonJoue(
  "WEBKIT",
  "ce conteneur n'a que Chromium. Les mesures ci-dessus valent pour " +
    "Chromium et pour lui seul — ce n'est une preuve ni pour Safari, ni " +
    "pour l'iPhone du propriétaire."
);

await nav.close();
process.exit(bilan());
