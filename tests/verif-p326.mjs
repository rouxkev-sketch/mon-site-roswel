/**
 * BANC DE LA PASSE Nº 326 — LIVRAISON RAPIDE
 * ==================================================================
 * UN SEUL POINT : LES DEUX APPELS DE « QUI SOMMES-NOUS » CHANGENT.
 *
 *   avant :  Tatoueur ? Crée ton portfolio : un style montré est un
 *            style trouvable.
 *            Curieux ? Cherche, et découvre ton prochain tatouage.
 *   après :  Tatoueur ? Montre tes styles, c'est par eux qu'on te
 *            trouvera.
 *            Envie d'un tatouage ? Cherche le style, tu trouveras
 *            l'artiste.
 *
 * CE BANC ÉPROUVE QUATRE CHOSES :
 *  1. les deux phrases, AU MOT PRÈS, virgules comprises ;
 *  2. les espaces mangées — SUR LA PAGE RENDUE, jamais dans la source :
 *     l'espace qui suit une amorce en gras est l'endroit exact où le
 *     défaut est né (« Tatoueur ?Crée », nº 319) ;
 *  3. les CINQ gras, et les SEPT autres paragraphes intacts au
 *     caractère près ;
 *  4. la mise en page, gravée depuis l'empreinte relevée AVANT la
 *     retouche — l'exception de présentation actée à la nº 320 tient.
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

const { nav, page } = await ouvrirLeNavigateur("p326", {
  width: 1440,
  height: 823,
});
await page.goto(`${BASE}/qui-sommes-nous`, { waitUntil: "networkidle" });

/** Les deux phrases neuves, et leurs amorces. */
const APPEL_TATOUEUR =
  "Tatoueur ? Montre tes styles, c'est par eux qu'on te trouvera.";
const APPEL_CURIEUX =
  "Envie d'un tatouage ? Cherche le style, tu trouveras l'artiste.";

/** Le texte entier de la page, au mot près — les deux appels compris. */
const ATTENDUS = [
  "« Yoko » vient du japonais, il signifie « couché, sur le côté ». Regarde le cœur rose du logo, il est incliné. « Folio » vient de portfolio : c'est le cœur du site. YokoFolio, c'est un cœur incliné qui t'emmène vers des portfolios.",
  "Un tatouage commence par un style. YokoFolio classe les tatoueurs par style.",
  "Essaie de chercher « du réalisme autour de Lyon » sur Instagram : c'est l'algorithme qui décide ce que tu verras. Ici, c'est toi.",
  "Choisis un style, une ville et un rayon : les tatoueurs qui correspondent s'affichent, chacun avec un portfolio consacré à son travail dans le style recherché.",
  "YokoFolio n'a pas d'algorithme, il a des styles — et il te conduit jusqu'à l'Instagram de celui qui les tatoue.",
  APPEL_TATOUEUR,
  APPEL_CURIEUX,
  "Pas d'avis, pas de notes.",
  "Ici, personne ne commente ni ne juge le travail d'un tatoueur. Son portfolio parle pour lui. À toi de te faire ton avis.",
];
const GRAS = [
  "Ici, c'est toi.",
  "Choisis un style, une ville et un rayon :",
  "Tatoueur ?",
  "Envie d'un tatouage ?",
  "À toi de te faire ton avis.",
];

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
  };
});

/* ==================================================================
 * 1 — LES DEUX PHRASES, AU MOT PRÈS
 * ================================================================== */
titre("les deux appels, relus au mot près sur la page rendue");
{
  verif(
    `L'APPEL AU TATOUEUR — « ${APPEL_TATOUEUR} »`,
    nu(m.paragraphes[5] ?? "") === nu(APPEL_TATOUEUR),
    `« ${m.paragraphes[5]} »`
  );
  verif(
    `L'APPEL AU CURIEUX — « ${APPEL_CURIEUX} »`,
    nu(m.paragraphes[6] ?? "") === nu(APPEL_CURIEUX),
    `« ${m.paragraphes[6]} »`
  );

  /*  LES VIRGULES, NOMMÉMENT. Le propriétaire les a écrites, et une
      virgule perdue ne se voit pas dans une comparaison qui aurait
      normalisé la ponctuation — celle-ci ne normalise que les espaces
      et les apostrophes, mais on le dit quand même à voix haute : ces
      deux phrases-là tiennent leur rythme de leur virgule. */
  verif(
    "…et LEURS VIRGULES SONT LÀ, une par phrase, à leur place",
    /styles, c'est par eux/.test(nu(m.paragraphes[5])) &&
      /le style, tu trouveras/.test(nu(m.paragraphes[6])),
    "« styles, c'est » · « style, tu »"
  );

  //  ET LES DEUX PHRASES D'AVANT ONT DISPARU DE LA PAGE.
  const entier = nu(m.paragraphes.join(" "));
  verif(
    "LES DEUX PHRASES D'AVANT NE SONT PLUS NULLE PART",
    !/Crée ton portfolio/.test(entier) &&
      !/un style montré est un style trouvable/.test(entier) &&
      !/découvre ton prochain tatouage/.test(entier) &&
      !/Curieux/.test(entier),
    "ni « Crée ton portfolio », ni « Curieux ? », ni leurs suites"
  );
}

/* ==================================================================
 * 2 — LES ESPACES MANGÉES, SUR LES DEUX PHRASES
 * ================================================================== */
titre("les espaces mangées : le rendu, et l'endroit exact du défaut");
{
  /*  LA SIGNATURE (procédé de la nº 322-§2) : React sépare DEUX NŒUDS
      DE TEXTE VOISINS par un commentaire vide `<!-- -->`. Un caractère
      de mot des deux côtés, ce sont deux mots que le rendu colle. On
      lit LE HTML SERVI — c'est la consigne, et c'est la seule façon de
      voir ce que le compilateur a fait de l'espace. */
  const html = await (await page.request.get(`${BASE}/qui-sommes-nous`)).text();
  const collages = [
    ...html.matchAll(/.{0,24}[\p{L}\p{N}]<!-- -->[\p{L}\p{N}].{0,24}/gu),
  ].map((c) => c[0]);
  verif(
    "AUCUN COLLAGE SUR TOUTE LA PAGE",
    collages.length === 0,
    collages.length ? `« ${collages[0]} »` : "0 occurrence"
  );

  /*  ET LES DEUX PARAGRAPHES NEUFS, PRIS À PART. C'est là que le
      défaut naît : juste après un `</strong>`, à l'endroit même où
      « Tatoueur ?Crée » s'était produit à la nº 319. On isole leur
      HTML et on y cherche la signature — on saurait donc lequel des
      deux fauterait. */
  const paragraphes = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(
    (c) => c[1]
  );
  const signature = /[\p{L}\p{N}]<!-- -->[\p{L}\p{N}]/u;
  verif(
    "L'APPEL AU TATOUEUR ne colle pas son amorce à sa suite",
    paragraphes[5] !== undefined && !signature.test(paragraphes[5]),
    "« Tatoueur ? » puis une espace, puis « Montre »"
  );
  verif(
    "L'APPEL AU CURIEUX non plus",
    paragraphes[6] !== undefined && !signature.test(paragraphes[6]),
    "« Envie d'un tatouage ? » puis une espace, puis « Cherche »"
  );
  //  ET LA FORME EXACTE, LUE DANS LE TEXTE RENDU : une espace, une
  //  seule, entre le point d'interrogation et le mot suivant.
  verif(
    "…mesuré dans le TEXTE : « ? Montre » et « ? Cherche », avec leur espace",
    /\? Montre tes styles/.test(nu(m.paragraphes[5])) &&
      /\? Cherche le style/.test(nu(m.paragraphes[6])),
    "les deux espaces sont là"
  );
  //  LE DÉFAUT HISTORIQUE, NOMMÉMENT : il ne peut pas revenir sous une
  //  autre forme.
  verif(
    "les collages déjà connus ne sont pas revenus (« Tatoueur ?Crée », « YokoFolione »)",
    !/Tatoueur \?[A-ZÀ-Þ]/.test(nu(m.paragraphes.join(" "))) &&
      !/YokoFolion/.test(nu(m.paragraphes.join(" "))),
    "ni l'un ni l'autre"
  );
  //  …ET LES DEUX ESPACES SONT ÉCRITES, pas obtenues par chance de
  //  mise en forme du fichier.
  const source = lire("src/app/(tatouage)/qui-sommes-nous/page.tsx");
  verif(
    "les deux amorces portent leur espace EN EXPRESSION (`{\" \"}`), comme la nº 319 l'a appris",
    /Tatoueur&nbsp;\?<\/strong>\{" "\}/.test(source) &&
      /Envie d&apos;un tatouage&nbsp;\?\s*<\/strong>\{" "\}/.test(source),
    "les deux `{\" \"}` sont écrits"
  );
}

/* ==================================================================
 * 3 — LES CINQ GRAS, ET LE RESTE INTACT
 * ================================================================== */
titre("les cinq gras, et les sept autres paragraphes au caractère près");
{
  verif(
    "IL Y A TOUJOURS CINQ GRAS, dans l'ordre — seule la quatrième amorce a changé",
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
  verif(
    "LES DEUX AMORCES SONT BIEN CELLES-LÀ : « Tatoueur ? » et « Envie d'un tatouage ? »",
    nu(m.gras[2].texte) === "Tatoueur ?" &&
      nu(m.gras[3].texte) === "Envie d'un tatouage ?",
    `« ${m.gras[2].texte} » · « ${m.gras[3].texte} »`
  );
  verif(
    "…et LE RESTE DE CHAQUE PHRASE N'EST PAS EN GRAS : le gras s'arrête au point d'interrogation",
    !m.gras.some((g) => /Montre tes styles|Cherche le style/.test(nu(g.texte))),
    "aucune suite de phrase n'est entrée dans un <strong>"
  );

  //  LE TEXTE ENTIER, ET LES SEPT PARAGRAPHES QU'ON NE DEVAIT PAS
  //  TOUCHER — nommés un par un.
  const ecarts = ATTENDUS.map((attendu, rang) => ({ attendu, rang })).filter(
    ({ attendu, rang }) => nu(m.paragraphes[rang] ?? "") !== nu(attendu)
  );
  verif(
    "LES NEUF PARAGRAPHES SONT CONFORMES, AU MOT PRÈS — zéro écart",
    m.paragraphes.length === 9 && ecarts.length === 0,
    ecarts.length
      ? `écart au paragraphe ${ecarts[0].rang + 1}`
      : "9 paragraphes conformes"
  );
  const INTACTS = [0, 1, 2, 3, 4, 7, 8];
  verif(
    "LES SEPT AUTRES PARAGRAPHES N'ONT PAS BOUGÉ D'UN CARACTÈRE",
    INTACTS.every((rang) => nu(m.paragraphes[rang]) === nu(ATTENDUS[rang])),
    "paragraphes 1, 2, 3, 4, 5, 8 et 9 inchangés"
  );
  const structure = await page.evaluate(() => {
    const main = document.querySelector("main");
    return {
      titre: main.querySelector("h1").textContent.trim(),
      sections: [...main.querySelectorAll("h2")].map((n) =>
        n.textContent.trim()
      ),
    };
  });
  verif(
    "…et le titre de la page comme ses deux titres de section sont intacts",
    nu(structure.titre) === nu("Pourquoi « YokoFolio » ?") &&
      nu(structure.sections.join(" | ")) ===
        nu("Ce que fait le site | Ce qu'on ne fait pas"),
    `« ${structure.titre} » · ${structure.sections.join(" | ")}`
  );
}

/* ==================================================================
 * 4 — LA MISE EN PAGE N'A PAS BOUGÉ
 * ================================================================== */
titre("la mise en page : l'empreinte relevée AVANT la retouche");
{
  /*  ⚠️ CES VALEURS ONT ÉTÉ MESURÉES AVANT QUE LES DEUX PHRASES NE
      SOIENT TOUCHÉES, à 1440 × 823 — et elles sont IDENTIQUES à celles
      que la nº 324 avait déjà gravées, ce qui est déjà une preuve :
      deux passes de suite, la même page rend les mêmes pixels. Elles
      sont regravées ici plutôt que renvoyées à p324, parce qu'un banc
      doit tenir seul.
      C'est cette empreinte qui protège l'exception de présentation
      actée à la nº 320. */
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
      largeur: 195,
      bordureHaut: "0px",
    },
    gris: {
      fond: "rgb(51, 51, 58)",
      couleur: "rgb(255, 255, 255)",
      bordureHaut: "0px",
    },
  };

  await page.mouse.move(5, 5);
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
    const distinct = (liste) =>
      [...new Set(liste.map((o) => JSON.stringify(o)))].map((c) =>
        JSON.parse(c)
      );
    const main = document.querySelector("main");
    const sections = [...main.querySelectorAll("section")];
    const rose = [...main.querySelectorAll("a")].find(
      (a) => a.getAttribute("href") === "/"
    );
    const gris = main.querySelector("[data-bouton-creer-portfolio]");
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
        "largeur",
        "bordureHaut"
      ),
      gris: geo(gris, "fond", "couleur", "bordureHaut"),
      motRose: rose.textContent.trim(),
      motGris: gris.textContent.trim(),
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
    `${mesure.titres.length} écriture(s)`
  );
  verif(
    "LES DEUX SECTIONS : 64 px de marge haute, et TOUJOURS AUCUN TRAIT",
    mesure.sections.length === 1 &&
      memeQue(EMPREINTE.section, mesure.sections[0]),
    JSON.stringify(mesure.sections[0])
  );
  verif(
    "LES DEUX CORPS : 17 px, #A8A8B0, interligne 29,75, écart 16",
    mesure.corps.length === 1 && memeQue(EMPREINTE.corps, mesure.corps[0]),
    `${mesure.corps.length} écriture(s)`
  );
  verif(
    "IL Y A TOUJOURS DEUX SECTIONS — aucune ajoutée ni scindée",
    mesure.nombreDeSections === 2,
    `${mesure.nombreDeSections} sections`
  );
  verif(
    "LE BOUTON ROSE NE BOUGE PAS — « Chercher un style », 195 px, #EE3D6F",
    memeQue(EMPREINTE.rose, mesure.rose) && mesure.motRose === "Chercher un style",
    `« ${mesure.motRose} » · ${mesure.rose.largeur} px`
  );
  verif(
    "LE BOUTON GRIS NON PLUS — « Crée ton portfolio », #33333A, aucun contour",
    memeQue(EMPREINTE.gris, mesure.gris) &&
      mesure.motGris === "Crée ton portfolio",
    `« ${mesure.motGris} » · ${mesure.gris.fond}`
  );
  verif(
    "LA PAGE NE DÉBORDE PAS : le document fait la largeur de la fenêtre",
    mesure.largeurDocument === 1440,
    `${mesure.largeurDocument} px`
  );
  verif(
    "L'EXCEPTION DE PRÉSENTATION DE LA nº 320 est toujours en commentaire",
    /AUCUNE PASSE FUTURE NE DOIT LES Y RAMENER/.test(
      lire("src/app/(tatouage)/qui-sommes-nous/page.tsx")
    ),
    "le commentaire est intact"
  );
}

nonJoue(
  "WEBKIT",
  "ce conteneur n'a que Chromium. Les mesures ci-dessus valent pour " +
    "Chromium et pour lui seul — ce n'est une preuve ni pour Safari, ni " +
    "pour l'iPhone du propriétaire."
);

await nav.close();
process.exit(bilan());
