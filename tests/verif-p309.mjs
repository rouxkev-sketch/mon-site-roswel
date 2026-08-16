/**
 * BANC DE LA PASSE Nº 309 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 — LE BADGE « SE CONNECTER » DU WEB, DÉCONNECTÉ : fond de page,
 *      contour gris, texte rose, icône DANS le badge. Mesuré en vivant,
 *      sur les couleurs CALCULÉES — et l'exception à la charte doit
 *      être ÉCRITE dans le code, sans quoi une passe future la
 *      retirera en croyant bien faire ; le banc la cherche.
 * §2-a — LES QUATRE ÉTATS du sélecteur de rendu, et le soulignement
 *      rose sous le seul bouton choisi.
 * §2-b — LE RENDU D'OUVERTURE, ÉPROUVÉ SUR LES TROIS CAS. La page qui
 *      le consomme exige une session Supabase signée par le serveur,
 *      que ce conteneur ne peut pas fabriquer : la règle a donc été
 *      écrite en FONCTION PURE (`renduDOuverture`), et le banc
 *      l'EXÉCUTE hors navigateur, cas par cas. C'est plus fort qu'une
 *      capture d'écran.
 * §3 — LE CHAMP « Style » DU WEB ne garde que le style.
 *
 * ⚠️ UNE SEULE FENÊTRE : 1440 × 823 — celle du propriétaire.
 */
//  ⚠️ LE CROCHET D'ALIAS S'ENREGISTRE, IL NE S'IMPORTE PAS (nº 302) :
//  c'est `module.register` qui apprend `@/…` à Node, pour que le banc
//  EXÉCUTE le TypeScript du site au lieu de le lire.
import { register } from "node:module";
register("./_alias-src.mjs", import.meta.url);

import {
  BASE,
  bilan,
  chromium,
  lire,
  nonJoue,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const entete = lire("src/components/EnTeteTatouage.tsx");
const portfolio = sansNotes(lire("src/components/BlocPortfolio.tsx"));
const moteur = sansNotes(lire("src/components/MoteurTatouage.tsx"));

const ANTHRACITE = "rgb(26, 26, 29)"; //  #1A1A1D
const GRIS_TRAIT = "rgb(56, 56, 63)"; //  #38383F
const ROSE = "rgb(238, 61, 111)"; //  #EE3D6F
const BLANC = "rgb(255, 255, 255)";
const GRIS_DOUX = "rgb(168, 168, 176)"; //  #A8A8B0

/* ==================================================================
 * §1 — L'EXCEPTION À LA CHARTE EST ÉCRITE
 * ================================================================== */
titre("§1 à la source — l'exception à la charte est écrite noir sur blanc");
{
  //  ⚠️ ON LIT LE FICHIER AVEC SES COMMENTAIRES : c'est justement le
  //  commentaire qu'on vérifie.
  verif(
    "le commentaire d'exception nomme la charte ET dit que c'est voulu",
    /EXCEPTION EXPLICITE À LA CHARTE/.test(entete) &&
      /AUCUN CONTOUR NULLE PART/.test(entete) &&
      /AUCUNE PASSE FUTURE NE DOIT LE RETIRER/.test(entete)
  );
  verif(
    "il dit de QUI vient la demande et de QUELLE passe",
    /DEMANDÉE\s*\n?\s*NOMMÉMENT PAR LE PROPRIÉTAIRE À LA PASSE Nº 309/.test(
      entete
    )
  );
  /*  ⚠️ AMENDÉ PAR LA Nº 311-§1a : l'icône est passée du rang 18 au
      rang 24, celui du GLOBE de la barre. CE QUE CE CONTRÔLE TIENT, et
      qui ne change pas : c'est l'icône QUI EXISTE DÉJÀ qu'on réemploie,
      aucun second dessin n'a été fabriqué pour ce bouton. La taille,
      elle, est mesurée en vivant par le banc de la nº 311 — en face de
      celle du globe. */
  verif(
    "l'icône réemployée est celle qui existe (aucun second dessin)",
    /<IconeUtilisateur taille=\{24\}/.test(entete) &&
      !/function IconeConnexion/.test(entete)
  );
}

/* ==================================================================
 * §2-b — LA RÈGLE, EXÉCUTÉE SUR LES TROIS CAS
 * ================================================================== */
titre("§2-b hors navigateur — le rendu d'ouverture, sur les trois cas");
{
  const { renduDOuverture, RENDUS_PHOTO } = await import(
    "@/lib/photos-tatoueur"
  );
  const photo = (rendu) => ({ style: "realisme", rendu, nature: "tatouage" });
  const cas = [
    {
      nom: "SEULEMENT DE LA COULEUR",
      photos: [photo("color"), photo("color")],
      attendu: "color",
    },
    {
      nom: "SEULEMENT DU NOIR ET GRIS",
      photos: [photo("black_and_grey")],
      attendu: "black_and_grey",
    },
    {
      nom: "LES DEUX (comportement actuel : le premier)",
      photos: [photo("black_and_grey"), photo("color")],
      attendu: RENDUS_PHOTO[0].slug,
    },
    {
      nom: "AUCUN (comportement actuel : le premier)",
      photos: [],
      attendu: RENDUS_PHOTO[0].slug,
    },
  ];
  for (const c of cas) {
    const rendu = renduDOuverture(c.photos, "realisme", "tatouage");
    verif(`ouverture — ${c.nom}`, rendu === c.attendu, `→ « ${rendu} »`);
  }
  //  LA NATURE COMPTE : de la couleur en FLASH ne doit pas décider de
  //  l'ouverture d'une galerie de RÉALISATIONS.
  const melange = [
    { style: "realisme", rendu: "color", nature: "flash" },
    { style: "realisme", rendu: "black_and_grey", nature: "tatouage" },
  ];
  verif(
    "la nature est bien prise en compte (un flash ne décide pas d'une réalisation)",
    renduDOuverture(melange, "realisme", "tatouage") === "black_and_grey" &&
      renduDOuverture(melange, "realisme", "flash") === "color"
  );
  //  ET LE STYLE AUSSI.
  verif(
    "le style est bien pris en compte",
    renduDOuverture(melange, "blackwork", "tatouage") === RENDUS_PHOTO[0].slug
  );
}

titre("§2 à la source — le formulaire consomme la règle, et rien d'autre");
{
  verif(
    "la règle n'est pas recopiée dans le formulaire : il appelle la fonction",
    /renduDOuverture,/.test(portfolio) &&
      /renduDOuverture\(photos, style, nature\)/.test(portfolio) &&
      !/garnis\.length === 1/.test(portfolio)
  );
  verif(
    "l'ouverture d'un style l'utilise",
    /setRenduOuvert\(ouvertureSur\(style, nature\)\);/.test(portfolio)
  );
  verif(
    "…et la RÉOUVERTURE d'un portfolio aussi (la dérivation)",
    /styleActif \? ouvertureSur\(styleActif, natureActive\)/.test(portfolio)
  );
  verif(
    "§2-a — le titre du rendu choisi est BLANC, l'autre GRIS",
    /actif \? "text-white" : "text-sombre-texte-doux"/.test(portfolio)
  );
  /*  ⚠️ AMENDÉ DEUX FOIS, ET IL EST REVENU À SON POINT DE DÉPART. La
      nº 311-§3a avait fait passer le trait du bord BAS au bord GAUCHE ;
      la nº 312-§4 l'a RAMENÉ EN BAS, sur consigne — c'est-à-dire
      exactement ce que cette passe-ci avait livré. On réécrit donc la
      valeur d'origine. Ce que ce contrôle tient n'a jamais bougé : le
      trait n'est RENDU que sur le rendu choisi, et sur lui seul. */
  verif(
    "§2-a — le trait rose n'est rendu que sur l'actif",
    /\{actif && \(/.test(portfolio) &&
      /data-soulignement-rendu=""/.test(portfolio) &&
      /absolute inset-x-0 bottom-0 h-\[2px\] bg-primaire/.test(portfolio)
  );
  /*  ⚠️ AMENDÉ PAR LA Nº 311-§3b : le TITRE est désormais blanc dans les
      deux états, il n'a donc plus de ternaire — le compte de deux
      couples n'a plus de sens. Ce qui distingue les quatre états, c'est
      maintenant le SOUS-TITRE (blanc / gris) et le TRAIT. On tient donc
      les deux : un titre inconditionnellement blanc, et un sous-titre
      qui, lui, bascule. */
  verif(
    "les QUATRE états sont écrits (titre blanc partout, sous-titre blanc / gris)",
    /block text-\[14px\] font-semibold text-white/.test(portfolio) &&
      (portfolio.match(/actif \? "text-white" : "text-sombre-texte-doux"/g) ?? [])
        .length === 1
  );
}

/* ==================================================================
 * §3 — À LA SOURCE
 * ================================================================== */
titre("§3 à la source — le champ « Style » du web");
{
  verif(
    "le champ ne reçoit plus le couple `libelleQuoi`",
    /libelleValeur=\{libelleChampStyleWeb\}/.test(moteur) &&
      !/libelleValeur=\{libelleQuoi\}/.test(moteur)
  );
  verif(
    "…et il rend le STYLE quand il y en a un",
    /criteres\.style\s*\n?\s*\? libelleStyle\(criteres\.style\)/.test(moteur)
  );
  verif(
    "le couple reste pour le smartphone et les lecteurs d'écran",
    /Rechercher — \$\{libelleQuoi \|\| "tout"\}/.test(moteur)
  );
}

/* ==================================================================
 * EN VIVANT — 1440 × 823
 * ================================================================== */
const nav = await chromium.launch({
  executablePath: process.env.CHEMIN_CHROMIUM,
  args: ["--no-proxy-server"],
});
const ctx = await nav.newContext({ viewport: { width: 1440, height: 823 } });
const page = await ctx.newPage();

titre("§1 en vivant — le badge de connexion, déconnecté, 1440 × 823");
{
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector("[data-bouton-connexion]", { timeout: 30000 });
  const b = await page.evaluate(() => {
    const n = document.querySelector("[data-bouton-connexion]");
    const s = getComputedStyle(n);
    const svg = n.querySelector("svg");
    const texte = n.querySelector("span");
    const nr = n.getBoundingClientRect();
    const sr = svg.getBoundingClientRect();
    return {
      affiche: s.display,
      fond: s.backgroundColor,
      contourLargeur: s.borderTopWidth,
      contourStyle: s.borderTopStyle,
      contourCouleur: s.borderTopColor,
      couleurTexte: getComputedStyle(texte).color,
      icone: `${sr.width}×${sr.height}`,
      cercles: svg.querySelectorAll("circle").length,
      dedans:
        sr.left >= nr.left &&
        sr.right <= nr.right &&
        sr.top >= nr.top &&
        sr.bottom <= nr.bottom,
      //  L'icône est-elle AVANT le texte, dans le badge ?
      avantLeTexte: sr.left < texte.getBoundingClientRect().left,
    };
  });
  verif("il s'affiche en web", b.affiche === "flex", b.affiche);
  verif(
    "son fond est l'anthracite de la page #1A1A1D",
    b.fond === ANTHRACITE,
    b.fond
  );
  /*  ⚠️ AMENDÉ PAR LA Nº 311-§1b : le contour est DOUBLÉ, 1 px → 2 px.
      Ce que ce contrôle tient : il existe, il est plein, et il est du
      gris des traits du site. */
  verif(
    "il porte un CONTOUR GRIS #38383F, épais de 2 px",
    b.contourLargeur === "2px" &&
      b.contourStyle === "solid" &&
      b.contourCouleur === GRIS_TRAIT,
    `${b.contourLargeur} ${b.contourStyle} ${b.contourCouleur}`
  );
  verif("son texte est rose #EE3D6F", b.couleurTexte === ROSE, b.couleurTexte);
  verif(
    "l'icône « rond avec une personne » est DANS le badge, avant le texte",
    b.dedans && b.avantLeTexte && b.cercles === 2,
    `${b.icone} · ${b.cercles} cercles`
  );

  //  AU DOIGT, RIEN NE CHANGE : c'est la silhouette ronde qui mène à
  //  la connexion, et le badge n'existe pas.
  const ctxM = await nav.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const pM = await ctxM.newPage();
  await pM.goto(BASE + "/", { waitUntil: "networkidle" });
  await pM.waitForTimeout(800);
  const auDoigt = await pM.evaluate(() => {
    const n = document.querySelector("[data-bouton-connexion]");
    return n ? getComputedStyle(n).display : "absent";
  });
  verif(
    "au doigt, le badge ne s'affiche pas (web uniquement)",
    auDoigt === "none" || auDoigt === "absent",
    auDoigt
  );
  await ctxM.close();
}

titre("§3 en vivant — ce que le champ « Style » contient");
{
  const lireChamp = async (adresse) => {
    await page.goto(BASE + adresse, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    return page.evaluate(() => {
      const n = document.querySelector('[aria-label="Style"]');
      return n ? n.textContent.trim() : null;
    });
  };
  verif(
    "réalisations + acid-trad → « Acid-trad », et rien d'autre",
    (await lireChamp("/?style=acid-trad&nature=tatouage")) === "Acid-trad"
  );
  verif(
    "flashs + réalisme → « Réalisme », et rien d'autre",
    (await lireChamp("/?style=realisme&nature=flash")) === "Réalisme"
  );
  verif(
    "un style sans catégorie → le style seul",
    (await lireChamp("/?style=acid-trad")) === "Acid-trad"
  );
  verif(
    "SANS STYLE, la catégorie garde ses mots (le champ ne se vide pas)",
    (await lireChamp("/?nature=tatouage")) === "Toutes les réalisations"
  );
  verif(
    "rien de cherché : l'invitation « Style » reprend sa place",
    (await lireChamp("/")) === "Style"
  );
}

nonJoue(
  "§2 EN VIVANT",
  "le formulaire de portfolio (« Mon portfolio ») exige une session " +
    "Supabase validée par le serveur, que ce conteneur ne peut pas " +
    "signer. Le §2-b n'en souffre pas : sa règle a été extraite en " +
    "fonction pure et EXÉCUTÉE ci-dessus sur les quatre cas. Le §2-a, " +
    "lui, n'est vérifié qu'à la source — les quatre états et le " +
    "soulignement sont lus au caractère près, mais je n'ai pas pu les " +
    "voir peints"
);

await ctx.close();
await nav.close();
process.exit(bilan());
