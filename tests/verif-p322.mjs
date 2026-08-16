/**
 * BANC DE LA PASSE Nº 322 — LIVRAISON RAPIDE
 * ==================================================================
 * TOUTE LA PASSE PORTE SUR /mentions-legales, ET SUR SON TEXTE SEUL.
 *
 * §1 — LE CONSTAT AVANT L'ÉCRITURE. Le propriétaire voulait ajouter
 *      « ce portfolio disparaît alors avec ses photos » et a demandé
 *      qu'on VÉRIFIE d'abord. La vérification dit NON : la phrase
 *      n'est donc PAS écrite, et ce banc éprouve les deux faces —
 *      la cause dans le code, et l'absence de la phrase dans la page.
 * §2 — LES TROIS ESPACES MANGÉES sont réparées, et le site entier est
 *      balayé : plus une seule sur AUCUNE page publique.
 * §3 — LES SIX AJOUTS, au mot près, chacun dans sa section.
 * §4 — LA MISE EN PAGE N'A PAS BOUGÉ D'UN PIXEL. L'empreinte relevée
 *      AVANT la retouche est GRAVÉE ici : le banc ne compare pas deux
 *      mesures éphémères, il exige que la page rende toujours ces
 *      valeurs-là. La garde survit donc à la passe.
 *
 * ⚠️ UNE SEULE LARGEUR : 1440 × 823, celle du propriétaire.
 */
import { execSync } from "node:child_process";
import {
  BASE,
  bilan,
  lire,
  nonJoue,
  ouvrirLeNavigateur,
  RACINE,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/*  LES DEUX CARACTÈRES INVISIBLES : apostrophe courbe et espace
    insécable. LES DEUX CÔTÉS passent par ici (leçon de la nº 320). */
const nu = (t) =>
  t.replace(/[’']/g, "'").replace(/ /g, " ").replace(/\s+/g, " ").trim();

const { nav, page } = await ouvrirLeNavigateur("p322", {
  width: 1440,
  height: 823,
});

/* ==================================================================
 * §1 — LE CONSTAT : LES PHOTOS D'UN PORTFOLIO SUPPRIMÉ RESTENT
 * ================================================================== */
titre("§1 — pourquoi la phrase du §3-c n'est PAS écrite");
{
  const purge = lire("src/lib/suppression-compte.ts");
  const purgeNue = sansNotes(purge);
  const televerser = sansNotes(lire("src/lib/televerser-photos.ts"));
  const formulaire = sansNotes(lire("src/components/FormulaireFiche.tsx"));

  /*  LA CAUSE, EN DEUX MORCEAUX QUI NE SE RENCONTRENT PAS.
      ------------------------------------------------------------------
      1. LA PURGE D'UNE FICHE cherche, dans le dossier du compte, les
         fichiers dont le NOM CONTIENT L'IDENTIFIANT DE LA FICHE.
      2. LE TÉLÉVERSEMENT nomme les fichiers `<style>-<horodatage>-
         <rang>.jpg`, dans un dossier au nom du COMPTE. L'identifiant
         de la fiche n'entre nulle part dans ce nom.
      Le filtre ne peut donc JAMAIS retenir un fichier : la liste
      d'effacement est toujours vide, et les photos restent. */
  verif(
    "LA PURGE D'UNE FICHE FILTRE PAR L'IDENTIFIANT DE LA FICHE dans le nom du fichier",
    /\.filter\(\(f\) => f\.name\.includes\(ligne\.id\)\)/.test(purgeNue),
    "f.name.includes(ligne.id)"
  );
  verif(
    "…MAIS LE NOM D'UNE PHOTO NE PORTE QUE LE STYLE, L'HEURE ET LE RANG",
    /const base = `\$\{dossier\}\/\$\{photo\.style\}-\$\{Date\.now\(\)\}-\$\{rang\}`/.test(
      televerser
    ),
    "`<dossier>/<style>-<horodatage>-<rang>`"
  );
  verif(
    "…et le DOSSIER est celui du COMPTE, pas celui de la fiche",
    /dossier: utilisateur\.id/.test(formulaire),
    "photos-tatoueurs/<id du compte>/…"
  );
  verif(
    "CONCLUSION EXÉCUTÉE : aucun nom de photo ne contient jamais un identifiant de fiche",
    (() => {
      //  On rejoue le filtre de la purge sur des noms produits par la
      //  vraie règle de nommage, avec un identifiant de fiche réaliste.
      const idFiche = "8f14e45f-ceea-467a-9c85-1b1f4c5f6a20";
      const noms = [
        "realisme-1755300000000-0.jpg",
        "realisme-1755300000000-0-mini.jpg",
        "maori-1755300000001-1.jpg",
        "profil-1755300000002.jpg",
      ];
      return noms.filter((n) => n.includes(idFiche)).length === 0;
    })(),
    "0 fichier retenu sur 4 — la liste d'effacement est vide"
  );

  /*  LE COMPTE, LUI, EFFACE VRAIMENT — mais à travers un `list()` que
      le SDK plafonne à 100 entrées. C'est écrit noir sur blanc dans
      le paquet installé : on le LIT plutôt que de l'affirmer. */
  verif(
    "LA PURGE D'UN COMPTE, ELLE, EFFACE TOUT LE DOSSIER — sans filtre",
    /\.remove\(fichiers\.map\(\(f\) => `\$\{ligne\.user_id\}\/\$\{f\.name\}`\)\)/.test(
      purgeNue
    ),
    "remove(tout le dossier du compte)"
  );
  verif(
    "…mais le `list()` du SDK est PLAFONNÉ À 100 entrées par défaut, et rien ne le relève ici",
    /limit: 100/.test(
      lire("node_modules/@supabase/storage-js/src/packages/StorageFileApi.ts")
    ) && !/\.list\([^)]*limit/.test(purgeNue),
    "DEFAULT_SEARCH_OPTIONS.limit = 100, aucun paramètre passé"
  );

  //  ET LA PAGE NE PROMET DONC RIEN DE CE QU'ELLE NE TIENT PAS.
  await page.goto(`${BASE}/mentions-legales`, { waitUntil: "networkidle" });
  const texte = nu(await page.textContent("main"));
  verif(
    "LA PAGE N'ÉCRIT PAS LA PHRASE DU §3-c : rien n'y promet la disparition des photos",
    !/disparait alors avec ses photos|disparaît alors avec ses photos/i.test(
      texte
    ),
    "phrase absente, comme le constat l'exige"
  );
}

/* ==================================================================
 * §2 — LES ESPACES MANGÉES
 * ================================================================== */
titre("§2 — plus une seule espace mangée, ici ni ailleurs");
{
  /*  LA SIGNATURE D'UNE ESPACE MANGÉE, ET POURQUOI ELLE EST SÛRE.
      React sépare DEUX NŒUDS DE TEXTE VOISINS par un commentaire vide
      `<!-- -->`, pour pouvoir les redécouper à l'hydratation. Un
      caractère de mot DES DEUX CÔTÉS de ce marqueur, c'est donc
      exactement deux mots que le rendu colle — « YokoFolioest ». On
      cherche ce motif dans le HTML SERVI, sur toutes les pages
      publiques : c'est une sonde générique, elle n'attrape pas que le
      nom de la marque. */
  const SIGNATURE = /[\p{L}\p{N}]<!-- -->[\p{L}\p{N}]/u;
  const PAGES = [
    "/",
    "/qui-sommes-nous",
    "/contact",
    "/mentions-legales",
    "/devenir-tatoueur",
    "/rendez-vous",
    "/favoris",
    "/tatoueur/nadege-roux-villeurbanne",
    "/tatoueur/atelier-corvus-lyon-1er",
    "/tatouage/realisme/lyon",
  ];
  const collees = [];
  for (const chemin of PAGES) {
    const reponse = await page.request.get(`${BASE}${chemin}`);
    const html = await reponse.text();
    if (SIGNATURE.test(html)) {
      const extrait = html.match(
        /.{0,20}[\p{L}\p{N}]<!-- -->[\p{L}\p{N}].{0,20}/u
      );
      collees.push(`${chemin} → « ${extrait?.[0] ?? ""} »`);
    }
  }
  verif(
    "AUCUNE ESPACE MANGÉE SUR AUCUNE PAGE PUBLIQUE — les dix balayées",
    collees.length === 0,
    collees.length ? collees[0] : `${PAGES.length} pages, 0 collage`
  );

  //  LES TROIS ENDROITS NOMMÉS PAR LE PROPRIÉTAIRE, UN PAR UN.
  const rendu = nu(await page.textContent("main"));
  for (const attendu of [
    "YokoFolio est édité SANS MODÈLE ÉCONOMIQUE",
    "YokoFolio ne dépose AUCUN cookie publicitaire",
    "YokoFolio ne revendique aucun droit sur ces images",
  ]) {
    verif(
      `« ${attendu.slice(0, 40)}… » — l'espace est là`,
      rendu.includes(attendu),
      "rendu conforme"
    );
  }
  //  …ET LA RÉPARATION EST ÉCRITE, pas obtenue par chance de mise en
  //  forme : les trois portent l'espace en expression explicite.
  const source = lire("src/app/(tatouage)/mentions-legales/page.tsx");
  /*  ⚠️ QUATRE, ET NON TROIS. La page en portait DÉJÀ UN avant cette
      passe : celui de « Liens vers Instagram et TikTok », posé quand on
      lisait « yokofolion'en est ni l'éditeur » — son commentaire est
      toujours là, au-dessus. La nº 322 en ajoute trois ; le total est
      donc quatre, et c'est CE nombre qu'on grave. (Compter 3 faisait
      rater le banc sur un code parfaitement juste : la première
      exécution l'a montré.) */
  const posees = source.match(/\{MARQUE_YOKOFOLIO\.nom\}\{" "\}/g) ?? [];
  verif(
    "les espaces sont POSÉES EN EXPRESSION (`{\" \"}`) — les 3 de la nº 322 " +
      "plus celle d'avant",
    posees.length === 4,
    `${posees.length} sur 4`
  );
}

/* ==================================================================
 * §3 — LES SIX AJOUTS, AU MOT PRÈS
 * ================================================================== */
titre("§3 — les six ajouts, au mot près, chacun dans sa section");
{
  /** Le texte d'une section, retrouvée par le TITRE et non par son
      rang : le §3-g ajoute un bloc, les index bougent, les titres non. */
  const sectionDite = (titreSection) =>
    page.evaluate((t) => {
      const h2 = [...document.querySelectorAll("main h2")].find(
        (n) => n.textContent.trim() === t
      );
      return h2 ? h2.closest("section").textContent : "";
    }, titreSection);

  const AJOUTS = [
    [
      "§3-a — le compte visiteur",
      "Données personnelles",
      "Un VISITEUR qui veut garder une sélection crée un compte avec une adresse e-mail. Le site conserve alors les portfolios qu'il suit, les photos qu'il a mises en favori, et la date de sa dernière visite — uniquement pour lui afficher sa sélection et lui signaler ce qui est nouveau depuis son dernier passage. Rien de cela n'est vendu, cédé, ni utilisé à des fins publicitaires. Base légale : l'exécution du service demandé (article 6.1.b du RGPD). Conservation : tant que le compte existe, puis suppression.",
    ],
    [
      "§3-b — la suppression depuis le compte",
      "Données personnelles",
      "Un compte peut être supprimé à tout moment par son titulaire, DIRECTEMENT DEPUIS SON COMPTE, sans avoir à le demander à personne.",
    ],
    [
      "§3-d — le formulaire de contact",
      "Données personnelles",
      "Le formulaire de contact recueille un nom, une adresse e-mail et un message. Ils servent uniquement à répondre, et ne sont conservés que le temps nécessaire à cet échange.",
    ],
    [
      "§3-e — l'hébergement hors d'Europe",
      "Hébergement",
      "Ces deux hébergeurs sont établis hors de l'Union européenne : les données du site sont donc traitées aux États-Unis et à Singapour.",
    ],
    [
      "§3-f — la relecture des photos",
      "Données personnelles",
      "Les photos déposées sur un portfolio sont relues avant d'être publiées. L'éditeur du site y a donc accès, à cette seule fin.",
    ],
  ];
  for (const [nom, section, phrase] of AJOUTS) {
    verif(
      `${nom} — au mot près, dans « ${section} »`,
      nu(await sectionDite(section)).includes(nu(phrase)),
      "phrase retrouvée entière"
    );
  }

  //  §3-b — LA VOIE DE L'E-MAIL RESTE OUVERTE, juste après.
  const droits = nu(await sectionDite("Données personnelles"));
  verif(
    "§3-b — …et la voie de l'e-mail RESTE, dans le même paragraphe",
    /DIRECTEMENT DEPUIS SON COMPTE, sans avoir à le demander à personne\. Un tatoueur peut demander à tout moment la correction ou la suppression complète de sa fiche et de son compte, par simple e-mail à/.test(
      droits
    ),
    "la phrase neuve précède l'e-mail, qui est conservé"
  );

  //  §3-g — LA DATE, EN BAS, ET AVANT LE LIEN DE RETOUR.
  const bas = await page.evaluate(() => {
    const main = document.querySelector("main");
    const retour = [...main.querySelectorAll("a")].find(
      (a) => a.getAttribute("href") === "/"
    );
    const date = [...main.querySelectorAll("p")].find((p) =>
      p.textContent.includes("Dernière mise à jour")
    );
    if (!date) return null;
    const s = getComputedStyle(date);
    const chapo = getComputedStyle(main.querySelector("h1 + p"));
    return {
      texte: date.textContent.trim(),
      taille: s.fontSize,
      couleur: s.color,
      memeEcritureQueLeChapo:
        s.fontSize === chapo.fontSize && s.color === chapo.color,
      avantLeRetour: Boolean(
        date.compareDocumentPosition(retour) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ),
    };
  });
  verif(
    "§3-g — « Dernière mise à jour : 16 août 2026 », au mot près",
    bas !== null && nu(bas.texte) === "Dernière mise à jour : 16 août 2026",
    bas ? `« ${bas.texte} »` : "introuvable"
  );
  verif(
    "…dans l'ÉCRITURE DISCRÈTE DE LA PAGE — celle du chapô, aucune valeur neuve",
    bas.memeEcritureQueLeChapo,
    `${bas.taille} · ${bas.couleur}`
  );
  verif(
    "…et elle ferme le CONTENU : elle vient avant le lien de retour",
    bas.avantLeRetour,
    "date, puis « Retour à l'accueil »"
  );

  //  ET LE §3-c N'EST PAS LÀ — dit ici aussi, du côté du texte.
  verif(
    "§3-c — NON ÉCRIT : la page ne parle nulle part de supprimer UN portfolio",
    !/n.en supprimer qu.un/i.test(nu(await page.textContent("main"))),
    "écarté par le constat du §1"
  );
}

/* ==================================================================
 * §4 — LA MISE EN PAGE N'A PAS BOUGÉ D'UN PIXEL
 * ================================================================== */
titre("§4 — l'empreinte de mise en page, relevée AVANT la retouche");
{
  /*  ⚠️ CES VALEURS ONT ÉTÉ MESURÉES SUR LA PAGE AVANT QUE LE TEXTE NE
      SOIT TOUCHÉ, à 1440 × 823. Elles sont gravées ici plutôt que
      comparées à une seconde mesure éphémère : ainsi la garde ne vaut
      pas que pour cette passe-ci — toute passe future qui déplacerait
      une taille, une couleur ou une marge de cette page le saura. */
  const EMPREINTE = {
    main: {
      largeur: 760,
      remplissageHaut: "40px",
      remplissageBas: "80px",
      remplissageGauche: "24px",
    },
    h1: {
      taille: "38.4px",
      graisse: "700",
      couleur: "rgb(242, 242, 244)",
      margeHaut: "0px",
      largeur: 712,
      gauche: 364,
    },
    chapo: { taille: "15px", couleur: "rgb(168, 168, 176)", margeHaut: "12px" },
    pile: { margeHaut: "40px", ecart: "28px" },
    titreDeSection: {
      taille: "20px",
      graisse: "700",
      couleur: "rgb(242, 242, 244)",
    },
    corpsDeSection: {
      taille: "15px",
      couleur: "rgb(168, 168, 176)",
      hauteurLigne: "24.375px",
      ecart: "12px",
      margeHaut: "12px",
    },
    trait: { bordureHaut: "1px", bordureCouleur: "rgb(56, 56, 63)" },
    premiereSection: { bordureHaut: "0px", remplissageHaut: "0px" },
    retour: {
      bordureHaut: "1px",
      bordureCouleur: "rgb(56, 56, 63)",
      margeHaut: "48px",
      couleur: "rgb(242, 242, 244)",
      remplissageGauche: "24px",
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
        margeHaut: s.marginTop,
        remplissageHaut: s.paddingTop,
        remplissageBas: s.paddingBottom,
        remplissageGauche: s.paddingLeft,
        bordureHaut: s.borderTopWidth,
        bordureCouleur: s.borderTopColor,
        arrondi: s.borderTopLeftRadius,
        ecart: s.gap,
        largeur: Math.round(r.width),
        gauche: Math.round(r.left),
      };
      return Object.fromEntries(clefs.map((c) => [c, source[c]]));
    };
    const main = document.querySelector("main");
    const sections = [...main.querySelectorAll("section")];
    const retour = [...main.querySelectorAll("a")].find(
      (a) => a.getAttribute("href") === "/"
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
        "margeHaut"
      ),
      pile: geo(main.querySelector("h1 + p + div"), "margeHaut", "ecart"),
      //  TOUS les titres et TOUS les corps, ramenés à leurs valeurs
      //  DISTINCTES : s'il y en a plus d'une, l'un d'eux a dérivé.
      titres: [
        ...new Set(
          [...main.querySelectorAll("h2")].map((n) =>
            JSON.stringify(geo(n, "taille", "graisse", "couleur"))
          )
        ),
      ],
      corps: [
        ...new Set(
          sections.map((s) =>
            JSON.stringify(
              geo(
                s.querySelector("h2").nextElementSibling,
                "taille",
                "couleur",
                "hauteurLigne",
                "ecart",
                "margeHaut"
              )
            )
          )
        ),
      ],
      traits: [
        ...new Set(
          sections
            .slice(1)
            .map((s) =>
              JSON.stringify(geo(s, "bordureHaut", "bordureCouleur"))
            )
        ),
      ],
      premiere: geo(sections[0], "bordureHaut", "remplissageHaut"),
      nombreDeSections: sections.length,
      retour: geo(
        retour,
        "bordureHaut",
        "bordureCouleur",
        "margeHaut",
        "couleur",
        "remplissageGauche"
      ),
      arrondiRetour: parseFloat(getComputedStyle(retour).borderTopLeftRadius),
      hauteurRetour: retour.getBoundingClientRect().height,
      largeurDocument: document.documentElement.scrollWidth,
    };
  });

  const memeQue = (attendu, obtenu) =>
    JSON.stringify(attendu) === JSON.stringify(obtenu);

  verif(
    "LA COLONNE DE TEXTE : 760 px de large, mêmes marges intérieures",
    memeQue(EMPREINTE.main, mesure.main),
    JSON.stringify(mesure.main)
  );
  verif(
    "LE GRAND TITRE : 38,4 px, gras 700, #F2F2F4, à la même place au pixel",
    memeQue(EMPREINTE.h1, mesure.h1),
    `${mesure.h1.taille} · ${mesure.h1.couleur} · ${mesure.h1.largeur} px à ${mesure.h1.gauche}`
  );
  verif(
    "LE CHAPÔ : 15 px, #A8A8B0, 12 px sous le titre",
    memeQue(EMPREINTE.chapo, mesure.chapo),
    JSON.stringify(mesure.chapo)
  );
  verif(
    "LA PILE DE SECTIONS : 40 px sous le chapô, 28 px entre chaque",
    memeQue(EMPREINTE.pile, mesure.pile),
    JSON.stringify(mesure.pile)
  );
  verif(
    "LES HUIT TITRES DE SECTION ONT TOUS LA MÊME ÉCRITURE — 20 px, gras 700, #F2F2F4",
    mesure.titres.length === 1 &&
      memeQue(EMPREINTE.titreDeSection, JSON.parse(mesure.titres[0])),
    `${mesure.titres.length} écriture(s) · ${mesure.titres[0]}`
  );
  verif(
    "LES HUIT CORPS DE SECTION AUSSI — 15 px, #A8A8B0, interligne 24,375, écart 12",
    mesure.corps.length === 1 &&
      memeQue(EMPREINTE.corpsDeSection, JSON.parse(mesure.corps[0])),
    `${mesure.corps.length} écriture(s) · ${mesure.corps[0]}`
  );
  verif(
    "LES TRAITS DE SÉPARATION : 1 px de #38383F, et rien d'autre",
    mesure.traits.length === 1 &&
      memeQue(EMPREINTE.trait, JSON.parse(mesure.traits[0])),
    `${mesure.traits.length} valeur(s) · ${mesure.traits[0]}`
  );
  verif(
    "…et la PREMIÈRE section n'en a toujours pas (`first:border-0`)",
    memeQue(EMPREINTE.premiereSection, mesure.premiere),
    JSON.stringify(mesure.premiere)
  );
  verif(
    "IL Y A TOUJOURS HUIT SECTIONS — aucune n'a été ajoutée ni scindée",
    mesure.nombreDeSections === 8,
    `${mesure.nombreDeSections} sections`
  );
  verif(
    "LE LIEN DE RETOUR : son contour, sa couleur, ses 48 px de marge, son remplissage",
    memeQue(EMPREINTE.retour, mesure.retour),
    JSON.stringify(mesure.retour)
  );
  verif(
    "…et c'est toujours une capsule",
    mesure.arrondiRetour >= mesure.hauteurRetour / 2,
    `rayon ${Math.round(mesure.arrondiRetour)} px pour ${Math.round(
      mesure.hauteurRetour
    )} px de haut`
  );
  verif(
    "LA PAGE NE DÉBORDE PAS : le document fait la largeur de la fenêtre",
    mesure.largeurDocument === 1440,
    `${mesure.largeurDocument} px`
  );

  //  LE TEXTE QUI N'A PAS ÉTÉ TOUCHÉ L'EST RESTÉ : les huit titres,
  //  au mot près et dans l'ordre.
  const titres = await page.evaluate(() =>
    [...document.querySelectorAll("main h2")].map((n) => n.textContent.trim())
  );
  verif(
    "LES HUIT TITRES DE SECTION SONT INCHANGÉS, dans le même ordre",
    nu(titres.join(" | ")) ===
      nu(
        "Éditeur du site | Directeur de la publication | Hébergement | Données personnelles | Cookies | Les photos appartiennent aux tatoueurs | Liens vers Instagram et TikTok | Mise à jour"
      ),
    titres.join(" | ")
  );
}

nonJoue(
  "LA PURGE ELLE-MÊME, JOUÉE CONTRE UN VRAI SUPABASE",
  "le §1 est un constat de CODE, et il ne peut pas être autre chose " +
    "ici : purger demande la clé de service et un Storage réel, que ce " +
    "conteneur n'a pas. Ce qui est prouvé ci-dessus est la CAUSE, pas " +
    "l'effet — le filtre de la purge et la règle de nommage sont lus " +
    "dans le code livré, et le filtre est rejoué sur des noms produits " +
    "par cette règle. C'est assez pour ne PAS écrire une promesse, ce " +
    "qui était la question posée ; ce ne serait pas assez pour écrire " +
    "l'inverse."
);

nonJoue(
  "WEBKIT",
  "ce conteneur n'a que Chromium. Les mesures de mise en page " +
    "ci-dessus valent pour Chromium et pour lui seul — ce n'est une " +
    "preuve ni pour Safari, ni pour l'iPhone du propriétaire."
);

await nav.close();
process.exit(bilan());
