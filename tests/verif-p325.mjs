/**
 * BANC DE LA PASSE Nº 325 — LIVRAISON RAPIDE
 * ==================================================================
 * PAGE « MA SÉLECTION », WEB UNIQUEMENT.
 *
 * §1 — ANNULATION de la marge posée au §2 de la nº 323 : l'écart entre
 *      le bloc d'identité d'un artiste et sa galerie redescend de 36 à
 *      20 px, aux deux largeurs.
 * §2 — DE L'AIR SOUS LE BLOC DE TÊTE de la page : 24 → 40 px sur le
 *      web, le doigt gardant ses 20. Et LA PAGE DE RECHERCHE, qui
 *      partage ce composant, NE BOUGE PAS D'UN PIXEL.
 *
 * ⚠️ COMMENT C'EST MESURÉ, ET POURQUOI AINSI (procédé de la nº 323).
 * ------------------------------------------------------------------
 * /mes-favoris répond 307 sans une session Supabase SIGNÉE PAR LE
 * SERVEUR, que ce conteneur ne peut pas fabriquer. Ce banc ne contourne
 * pas ce mur : il LIT LES CLASSES DANS LES FICHIERS SOURCES, les pose
 * dans une VRAIE page du site — donc avec la vraie feuille Tailwind
 * compilée — et mesure ce que le navigateur en peint. Les classes ne
 * sont jamais recopiées ici : si quelqu'un les change, la mesure
 * change.
 * ⚠️ ET LE TÉMOIN, LUI, EST MESURÉ EN VIVANT : la page de recherche
 * monte le MÊME composant sans le drapeau, à l'adresse `/`. C'est elle
 * qui prouve que le réglage n'a pas débordé.
 *
 * ⚠️ UNE SEULE LARGEUR : 1440 × 823, celle du propriétaire — plus une
 * mesure au doigt, parce que « web uniquement » ne vaut rien sans elle.
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

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const SUIVIS = lire("src/components/BlocSuivis.tsx");
const LIGNE = lire("src/components/LigneResultats.tsx");
const FAVORIS = lire("src/components/PageFavoris.tsx");

/* ==================================================================
 * LES CLASSES, EXTRAITES DES COMPOSANTS
 * ================================================================== */
/** L'écart entre le bloc d'identité d'un artiste et sa galerie. */
const ECART_GALERIE = (SUIVIS.match(/classeEnveloppe="([^"]+)"/) ?? [])[1] ?? "";

/** Le rembourrage du bloc de tête, DANS SES DEUX ÉTATS. On lit le
    gabarit du composant et on le déroule à la main pour les deux
    valeurs du drapeau — c'est la seule façon de mesurer un état qu'on
    ne peut pas atteindre par une page. */
const GABARIT =
  (LIGNE.match(/className=\{`(pt-6[^`]*)`\}/) ?? [])[1] ?? "";
const TETE_SANS_AIR = GABARIT.replace(/\$\{[^}]+\}/, "").replace(/\s+/g, " ").trim();
const TETE_AVEC_AIR = GABARIT.replace(
  /\$\{airEnBas \? "([^"]+)" : ""\}/,
  "$1"
)
  .replace(/\s+/g, " ")
  .trim();

const { nav, page } = await ouvrirLeNavigateur("p325", {
  width: 1440,
  height: 823,
});

/** Pose des classes dans la page ouverte, et rend ce qui est peint. */
const peindre = (cible, classes) =>
  cible.evaluate((c) => {
    const n = document.createElement("div");
    n.className = c;
    document.body.appendChild(n);
    const s = getComputedStyle(n);
    const mesure = { margeHaut: s.marginTop, basPad: s.paddingBottom, hautPad: s.paddingTop };
    n.remove();
    return mesure;
  }, classes);

titre("les classes ont bien été extraites des composants");
{
  verif(
    "l'écart de galerie et les deux états du bloc de tête sont lus dans la source",
    ECART_GALERIE.startsWith("mt-") &&
      TETE_SANS_AIR.includes("pb-") &&
      TETE_AVEC_AIR.includes("pb-"),
    `galerie « ${ECART_GALERIE} » · tête sans air « ${TETE_SANS_AIR} » · avec air « ${TETE_AVEC_AIR} »`
  );
}

/* ==================================================================
 * §1 — L'ANNULATION
 * ================================================================== */
titre("§1 — l'écart identité / galerie redescend à 20 px");
{
  await page.goto(BASE, { waitUntil: "networkidle" });
  const web = await peindre(page, ECART_GALERIE);

  verif(
    "§1 WEB — 36 px À LA nº 323, 20 px MAINTENANT : la valeur d'avant est remise",
    web.margeHaut === "20px",
    web.margeHaut
  );
  verif(
    "…et il n'y a PLUS AUCUN CRAN `lg:` sur cet écart — une seule valeur, partout",
    ECART_GALERIE === "mt-5",
    `« ${ECART_GALERIE} »`
  );
  /*  ⚠️ ON CHERCHE DANS LE CODE, NOTES RETIRÉES. La note d'annulation
      NOMME `lg:mt-9` — c'est même tout son objet : dire ce qui est
      parti et pourquoi. Chercher la chaîne dans le fichier entier
      faisait donc rater le banc sur un code parfaitement propre (la
      première exécution l'a montré). */
  verif(
    "…et le `lg:mt-9` de la nº 323 a quitté LE CODE — il ne survit que dans la note",
    !/lg:mt-9/.test(sansNotes(SUIVIS)) && /lg:mt-9/.test(SUIVIS),
    "absent du code, cité par la note"
  );
  verif(
    "LA NOTE DIT QUE C'EST UNE ANNULATION DEMANDÉE, pas un oubli à réparer",
    /AUCUNE PASSE FUTURE NE DOIT « RÉTABLIR » LES 36 px/.test(SUIVIS),
    "l'avertissement est écrit dans le composant"
  );
}

/* ==================================================================
 * §2 — L'AIR SOUS LE BLOC DE TÊTE
 * ================================================================== */
titre("§2 — le bloc de tête respire avant la première photo de profil");
{
  const sansAir = await peindre(page, TETE_SANS_AIR);
  const avecAir = await peindre(page, TETE_AVEC_AIR);

  verif(
    "§2 WEB — 24 px AVANT, 40 px APRÈS",
    sansAir.basPad === "24px" && avecAir.basPad === "40px",
    `${sansAir.basPad} → ${avecAir.basPad}`
  );
  verif(
    "…et LE HAUT DU BLOC NE BOUGE PAS : ses 32 px sont intacts",
    sansAir.hautPad === "32px" && avecAir.hautPad === sansAir.hautPad,
    `${avecAir.hautPad} dans les deux cas`
  );

  /*  CE REMBOURRAGE EST TOUT L'ÉCART, et c'est ce qui rend la mesure
      suffisante : le bloc qui suit — `BlocSuivis` — ne pose AUCUNE
      marge haute sur son premier groupe (`rang > 0 ? "mt-10…" : ""`).
      Rien ne s'ajoute donc entre les deux, et rien ne peut absorber
      les 16 px gagnés. */
  verif(
    "CE REMBOURRAGE EST TOUT L'ÉCART : le premier groupe de la liste n'a aucune marge haute",
    /rang > 0 \? "mt-10 border-t border-sombre-bordure\/60 pt-10" : ""/.test(
      sansNotes(SUIVIS)
    ),
    "le premier groupe part à zéro — le `pb` du bloc de tête est seul"
  );

  //  LE DRAPEAU EST BIEN DEMANDÉ PAR « MA SÉLECTION », ET PAR ELLE SEULE.
  verif(
    "« MA SÉLECTION » DEMANDE L'AIR, et c'est le seul appelant à le faire",
    /^\s*airEnBas$/m.test(sansNotes(FAVORIS)) &&
      !/airEnBas/.test(sansNotes(lire("src/components/IndexTatoueurs.tsx"))),
    "PageFavoris : oui · IndexTatoueurs : non"
  );
}

titre("§2 — LE TÉMOIN : la page de recherche n'a pas bougé");
{
  /*  ⚠️ CELUI-CI EST MESURÉ EN VIVANT, sur la vraie page d'accueil :
      elle monte le MÊME composant sans le drapeau. C'est la preuve que
      le réglage n'a pas débordé — et c'est la raison d'être du
      drapeau, plutôt qu'une valeur changée pour tout le monde. */
  await page.goto(BASE, { waitUntil: "networkidle" });
  const vivant = await page.evaluate(() => {
    const n = document.querySelector("[data-titre-mosaique]");
    const s = getComputedStyle(n);
    return {
      hautPad: s.paddingTop,
      basPad: s.paddingBottom,
      air: n.hasAttribute("data-air-en-bas"),
    };
  });
  verif(
    "LA MOSAÏQUE DE L'ACCUEIL GARDE SES 32 / 24 px — au pixel, en vivant",
    vivant.hautPad === "32px" && vivant.basPad === "24px",
    `${vivant.hautPad} / ${vivant.basPad}`
  );
  verif(
    "…et son bloc de tête NE PORTE PAS le drapeau",
    vivant.air === false,
    "aucun `data-air-en-bas`"
  );
}

/* ==================================================================
 * LE DOIGT — IL NE DOIT PAS BOUGER
 * ================================================================== */
titre("le smartphone ne change pas : les deux §, mesurés à 390 px");
{
  const doigt = await ouvrirLeNavigateur(
    "p325d",
    { width: 390, height: 844 },
    { hasTouch: true, isMobile: true, deviceScaleFactor: 3 }
  );
  await doigt.page.goto(BASE, { waitUntil: "networkidle" });

  const ecart = await peindre(doigt.page, ECART_GALERIE);
  const teteAvecAir = await peindre(doigt.page, TETE_AVEC_AIR);
  const vivant = await doigt.page.evaluate(() => {
    const s = getComputedStyle(document.querySelector("[data-titre-mosaique]"));
    return { hautPad: s.paddingTop, basPad: s.paddingBottom };
  });

  verif(
    "§1 AU DOIGT — l'écart identité / galerie vaut 20 px, comme toujours",
    ecart.margeHaut === "20px",
    ecart.margeHaut
  );
  verif(
    "§2 AU DOIGT — LE BLOC DE TÊTE GARDE SES 20 px : le drapeau n'ouvre qu'un cran `lg:`",
    teteAvecAir.basPad === "20px",
    `${teteAvecAir.basPad} — l'air de 40 px ne descend pas sous 1024 px`
  );
  verif(
    "…et la mosaïque de l'accueil au doigt garde ses 24 / 20 px",
    vivant.hautPad === "24px" && vivant.basPad === "20px",
    `${vivant.hautPad} / ${vivant.basPad}`
  );
  await doigt.ctx.close();
  await doigt.nav.close();
}

nonJoue(
  "LA PAGE « MA SÉLECTION » OUVERTE EN VIVANT",
  "/mes-favoris répond 307 sans une session Supabase signée par le " +
    "serveur, et ce conteneur n'a pas de quoi en signer une. Ce qui est " +
    "prouvé ci-dessus : les classes des deux § sont LUES DANS LEURS " +
    "COMPOSANTS puis peintes par la vraie feuille du site, le drapeau " +
    "n'est demandé que par « Ma sélection », et le bloc qui suit la " +
    "tête ne pose aucune marge — donc le rembourrage mesuré EST " +
    "l'écart. Ce qui ne l'est pas : l'assemblage à l'écran. Cela reste " +
    "à l'œil du propriétaire."
);

nonJoue(
  "WEBKIT",
  "ce conteneur n'a que Chromium. Les mesures ci-dessus valent pour " +
    "Chromium et pour lui seul — ce n'est une preuve ni pour Safari, ni " +
    "pour l'iPhone du propriétaire."
);

await nav.close();
process.exit(bilan());
