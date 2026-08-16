/**
 * BANC DE LA PASSE Nº 313 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 — LE SURVOL DU BADGE « SE CONNECTER » : le fond prend la couleur
 *      du contour, mesuré EN VIVANT, souris posée dessus.
 * §2 — APRÈS CONNEXION, TOUJOURS « MA SÉLECTION ». La page d'arrivée
 *      exige une session que ce conteneur ne peut pas signer : on
 *      vérifie donc qu'elle n'a plus AUCUNE bifurcation (la requête,
 *      la constante et la seconde sortie ont disparu, code compris), et
 *      surtout que LES RETOURS D'ACTION passent toujours avant elle.
 * §3 — LES STYLES DES MEMBRES D'ÉQUIPE. La règle d'écriture est une
 *      FONCTION PURE : le banc l'EXÉCUTE sur les trois cas demandés —
 *      un style, trois, cinq — puis vérifie le rendu EN VIVANT sur une
 *      page de salon.
 *
 * ⚠️ UNE SEULE FENÊTRE : 1440 × 823 — celle du propriétaire.
 */
//  ⚠️ LE CROCHET D'ALIAS S'ENREGISTRE, IL NE S'IMPORTE PAS (nº 302).
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

const entete = lire("src/components/EnTeteTatouage.tsx"); //  AVEC ses notes
const arrivee = sansNotes(
  lire("src/app/(tatouage)/apres-connexion/page.tsx")
);
const config = sansNotes(lire("src/config/tatouage.ts"));
const lieux = sansNotes(lire("src/components/BlocLieux.tsx"));
const modes = sansNotes(lire("src/lib/modes-exercice.ts"));
const tatoueurs = sansNotes(lire("src/lib/tatoueurs.ts"));
const coeur = sansNotes(lire("src/components/BoutonCoeurPhoto.tsx"));
const suivre = sansNotes(lire("src/components/BoutonSuivre.tsx"));
const ecran = sansNotes(lire("src/components/EcranAuthentification.tsx"));

const GRIS_TRAIT = "rgb(56, 56, 63)"; //  #38383F
const ANTHRACITE = "rgb(26, 26, 29)"; //  #1A1A1D
const ROSE = "rgb(238, 61, 111)";
const GRIS_DOUX = "rgb(168, 168, 176)"; //  #A8A8B0

/* ==================================================================
 * §2 — À LA SOURCE : une seule sortie, et les retours d'action saufs
 * ================================================================== */
titre("§2 à la source — une seule arrivée, et les retours d'action intacts");
{
  /*  ⚠️ AMENDÉ À LA nº 314. La sortie s'écrivait
      `redirect(`${ARRIVEE_SANS_PORTFOLIO}${suffixe}`)` — le `suffixe`
      ne servait qu'à faire suivre `?bienvenue=1`, et la nº 314-§4 a
      supprimé ce message, code compris. La sortie est donc nue.
      LA MESURE EST RENDUE, PAS RETIRÉE : ce que ce contrôle éprouve —
      plus aucune question posée à la base, et UNE SEULE sortie — est
      vérifié à l'identique, sur l'écriture d'aujourd'hui. */
  verif(
    "l'arrivée ne demande plus rien à la base : la bifurcation a disparu",
    !/aUnPortfolio/.test(arrivee) &&
      !/from\("tatoueurs"\)/.test(arrivee) &&
      /redirect\(ARRIVEE_SANS_PORTFOLIO\)/.test(arrivee) &&
      (arrivee.match(/redirect\(/g) ?? []).length === 2
  );
  verif(
    "…et la constante qui menait à la fiche est SUPPRIMÉE, code compris",
    !/ARRIVEE_AVEC_PORTFOLIO/.test(config) && !/ARRIVEE_AVEC_PORTFOLIO/.test(arrivee)
  );
  verif(
    "l'arrivée unique est bien « Ma sélection »",
    /export const ARRIVEE_SANS_PORTFOLIO = "\/mes-favoris";/.test(config)
  );
  //  ⚠️ CE QUI NE DOIT PAS AVOIR BOUGÉ : les retours d'action passent
  //  par `?suite=` / `next=`, LUS AVANT cette page. Si l'un d'eux
  //  disparaissait, la règle du §2 aurait mangé un geste.
  verif(
    "RETOUR D'ACTION — un cœur sans compte emporte le chemin de sa page",
    /versLaConnexion\(\)/.test(coeur) && /retenirLeGeste/.test(coeur)
  );
  verif(
    "RETOUR D'ACTION — « Suivre » sans compte fait de même",
    /versLaConnexion\(\)/.test(suivre) && /retenirLeGeste/.test(suivre)
  );
  verif(
    "…et l'écran de connexion HONORE ce chemin avant l'arrivée par défaut",
    /suiteSure\(suite\) \?\? ARRIVEE_APRES_CONNEXION/.test(ecran)
  );
  verif(
    "RETOUR D'ACTION — le rattachement revient à son jeton, jamais ici",
    /`\/rejoindre\/\$\{rattachement\.jeton\}`/.test(ecran)
  );
}

/* ==================================================================
 * §3 — LA RÈGLE D'ÉCRITURE, EXÉCUTÉE
 * ================================================================== */
titre("§3 hors navigateur — la ligne de styles, sur les trois cas");
{
  const { libelleStylesEquipe, STYLES_EQUIPE_AFFICHES } = await import(
    "@/lib/modes-exercice"
  );
  verif(
    "au plus TROIS styles s'écrivent",
    STYLES_EQUIPE_AFFICHES === 3,
    `${STYLES_EQUIPE_AFFICHES}`
  );
  const cas = [
    { nom: "UN style", styles: ["realisme"], attendu: "Réalisme" },
    {
      nom: "DEUX styles",
      styles: ["realisme", "trash-polka"],
      attendu: "Réalisme · Trash Polka",
    },
    {
      nom: "TROIS styles — aucun reste, aucun « + »",
      styles: ["realisme", "fine-line", "blackwork"],
      attendu: "Réalisme · Fine Line · Blackwork",
    },
    {
      nom: "CINQ styles — trois écrits, le reste compté",
      styles: ["realisme", "fine-line", "blackwork", "dotwork", "japonais"],
      attendu: "Réalisme · Fine Line · Blackwork +2",
    },
    {
      nom: "HUIT styles",
      styles: [
        "realisme",
        "fine-line",
        "blackwork",
        "dotwork",
        "japonais",
        "chicano",
        "tribal",
        "gravure",
      ],
      attendu: "Réalisme · Fine Line · Blackwork +5",
    },
    { nom: "AUCUN style — rien du tout", styles: [], attendu: "" },
    { nom: "styles absents (null)", styles: null, attendu: "" },
  ];
  for (const c of cas) {
    const rendu = libelleStylesEquipe(c.styles);
    verif(`${c.nom}`, rendu === c.attendu, `« ${rendu} »`);
  }
  verif(
    "les libellés viennent du catalogue, jamais d'un mot écrit à la main",
    /\.map\(libelleStyle\)/.test(modes) &&
      /import \{[\s\S]*libelleStyle,[\s\S]*\} from "@\/config\/tatouage";/.test(
        modes
      )
  );
}

titre("§3 à la source — d'où viennent les styles, et ce qu'ils ne font pas");
{
  verif(
    "ils viennent de la DÉCLARATION de l'artiste, comme son rôle",
    /from\("tatoueurs"\)\s*\n\s*\.select\("id, styles"\)/.test(tatoueurs) &&
      /styles: stylesDesMembres\.get\(ligne\.artiste_id\) \?\? null,/.test(
        tatoueurs
      )
  );
  /*  ⚠️ AUCUNE MIGRATION DANS CETTE PASSE, et c'est une décision : la
      vue `equipe_salon` aurait pu porter `a.styles`, mais elle dit QUI
      est de l'équipe — pas ce que chacun pratique. Les styles se lisent
      là où ils vivent (`tatoueurs.styles`), en une requête de plus.
      Le banc le VÉRIFIE : la vue ne les sélectionne toujours pas. */
  verif(
    "AUCUNE MIGRATION : la vue `equipe_salon` ne porte toujours pas les styles",
    !/create or replace view public\.equipe_salon as[\s\S]{0,600}?a\.styles/.test(
      lire("supabase/yokofolio-modes-et-liaisons.sql")
    ),
    "les styles se lisent dans `tatoueurs`, là où ils vivent"
  );
  verif(
    "la troisième ligne ne se rend PAS quand il n'y a rien",
    /\{libelleStylesEquipe\(membre\.styles\) && \(/.test(lieux)
  );
  verif(
    "…et c'est du TEXTE GRIS : aucune capsule, aucun contour",
    /data-styles-membre=""\s*\n\s*className="mt-0\.5 text-\[13px\] leading-relaxed text-sombre-texte-doux"/.test(
      lieux
    ) && !/data-styles-membre[\s\S]{0,200}rounded-full/.test(lieux)
  );
  verif(
    "la ligne entière reste cliquable vers la fiche du membre",
    /href=\{`\/tatoueur\/\$\{membre\.slug\}`\}/.test(lieux) &&
      /className=\{CLASSES_LIGNE_CLIQUABLE\}/.test(lieux)
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

titre("§1 en vivant — le survol du badge");
{
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector("[data-bouton-connexion]", { timeout: 30000 });
  const lire = () =>
    page.evaluate(() => {
      const n = document.querySelector("[data-bouton-connexion]");
      const s = getComputedStyle(n);
      return {
        fond: s.backgroundColor,
        contour: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
        texte: getComputedStyle(n.querySelector("span")).color,
        icone: n.querySelector("svg").getBoundingClientRect().width,
      };
    });

  const repos = await lire();
  verif("AU REPOS, le fond reste l'anthracite #1A1A1D", repos.fond === ANTHRACITE, repos.fond);

  await page.hover("[data-bouton-connexion]");
  //  La transition de couleur est douce : on la laisse finir.
  await page.waitForTimeout(600);
  const survol = await lire();
  verif(
    "AU SURVOL, LE FOND PREND LA COULEUR DU CONTOUR (#38383F)",
    survol.fond === GRIS_TRAIT,
    survol.fond
  );
  verif(
    "…si bien que le contour disparaît dans le fond : une seule couleur",
    survol.fond === survol.contour.split(" ").slice(2).join(" "),
    `fond ${survol.fond} · contour ${survol.contour}`
  );
  verif(
    "le reste ne bouge pas : contour 2 px, texte rose, icône à 24",
    survol.contour === `2px solid ${GRIS_TRAIT}` &&
      survol.texte === ROSE &&
      survol.icone === 24,
    `${survol.contour} · ${survol.texte} · icône ${survol.icone}`
  );
  verif(
    "l'exception à la charte est TOUJOURS écrite dans le code",
    /EXCEPTION EXPLICITE À LA CHARTE/.test(entete) &&
      /AUCUNE PASSE FUTURE NE DOIT LE RETIRER/.test(entete)
  );
}

titre("§2 en vivant — ce qui est atteignable sans session");
{
  //  Sans session, l'arrivée renvoie à la connexion : c'est le seul
  //  chemin que ce conteneur peut éprouver, et il prouve au moins que
  //  la page ne tombe pas.
  const reponse = await page.goto(BASE + "/apres-connexion", {
    waitUntil: "networkidle",
  });
  verif(
    "sans session, l'arrivée renvoie à la connexion sans casser",
    reponse.ok() && new URL(page.url()).pathname === "/devenir-tatoueur",
    `${reponse.status()} → ${new URL(page.url()).pathname}`
  );
  //  ET LE CHEMIN DE RETOUR D'ACTION EST BIEN PORTÉ PAR L'ADRESSE.
  await page.goto(BASE + "/mes-favoris", { waitUntil: "networkidle" });
  const url = new URL(page.url());
  verif(
    "RETOUR D'ACTION — « Ma sélection » sans compte emporte son chemin",
    url.pathname === "/devenir-tatoueur" &&
      url.searchParams.get("suite") === "/mes-favoris",
    `${url.pathname}?suite=${url.searchParams.get("suite")}`
  );
}

titre("§3 en vivant — la ligne de styles sur une page de salon");
{
  await page.goto(BASE + "/tatoueur/atelier-corvus-lyon-1er", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(700);
  const equipe = await page.evaluate(() =>
    [...document.querySelectorAll("[data-styles-membre]")].map((n) => {
      const bloc = n.parentElement;
      const ps = [...bloc.querySelectorAll("p")];
      const s = getComputedStyle(n);
      const sRole = getComputedStyle(ps[1]);
      const sNom = getComputedStyle(ps[0]);
      return {
        nom: ps[0]?.textContent.trim(),
        role: ps[1]?.textContent.trim(),
        styles: n.textContent.trim(),
        //  L'ORDRE : nom, rôle, styles — dans cet ordre, et pas un autre.
        rang: [...bloc.children].indexOf(n),
        couleurNom: sNom.color,
        couleurRole: sRole.color,
        couleurStyles: s.color,
        tailleRole: sRole.fontSize,
        tailleStyles: s.fontSize,
        //  Aucune capsule : ni fond, ni arrondi, ni contour.
        fond: s.backgroundColor,
        arrondi: s.borderTopLeftRadius,
        contour: s.borderTopWidth,
        //  La ligne entière est-elle un lien vers la fiche ?
        dansUnLien: Boolean(n.closest('a[href^="/tatoueur/"]')),
      };
    })
  );
  if (equipe.length === 0) {
    nonJoue(
      "§3 en vivant",
      "aucun membre d'équipe avec styles déclarés sur cette fiche de démonstration"
    );
  } else {
    const m = equipe[0];
    verif(
      "LES STYLES S'ÉCRIVENT, sous le nom et le rôle",
      m.styles.length > 0 && m.rang === 2,
      `« ${m.nom} » / « ${m.role} » / « ${m.styles} »`
    );
    verif(
      "le nom est blanc, le rôle et les styles gris",
      m.couleurNom !== GRIS_DOUX &&
        m.couleurRole === GRIS_DOUX &&
        m.couleurStyles === GRIS_DOUX,
      `nom ${m.couleurNom} · rôle ${m.couleurRole} · styles ${m.couleurStyles}`
    );
    verif(
      "…et les styles sont PLUS PETITS que le rôle",
      parseFloat(m.tailleStyles) < parseFloat(m.tailleRole),
      `rôle ${m.tailleRole} · styles ${m.tailleStyles}`
    );
    verif(
      "AUCUNE CAPSULE : ni fond, ni arrondi, ni contour",
      m.fond === "rgba(0, 0, 0, 0)" &&
        m.arrondi === "0px" &&
        m.contour === "0px",
      `fond ${m.fond} · arrondi ${m.arrondi} · contour ${m.contour}`
    );
    verif(
      "TOUTE LA LIGNE reste cliquable vers la fiche du membre",
      equipe.every((n) => n.dansUnLien)
    );
    verif(
      "les points médians séparent bien les styles",
      equipe.some((n) => / · /.test(n.styles)),
      equipe.map((n) => `« ${n.styles} »`).join(" ")
    );
  }

  //  UN MEMBRE SANS STYLE NE REND PAS DE TROISIÈME LIGNE : on le
  //  vérifie sur l'ensemble des membres de la page, styles ou non.
  const compte = await page.evaluate(() => {
    const lignes = [...document.querySelectorAll('li a[href^="/tatoueur/"]')];
    return {
      membres: lignes.length,
      avecStyles: lignes.filter((a) => a.querySelector("[data-styles-membre]"))
        .length,
      lignesVides: [...document.querySelectorAll("[data-styles-membre]")].filter(
        (n) => n.textContent.trim() === ""
      ).length,
    };
  });
  verif(
    "aucune troisième ligne VIDE n'est rendue",
    compte.lignesVides === 0,
    `${compte.avecStyles} membre(s) avec styles sur ${compte.membres}`
  );
}

nonJoue(
  "§2 CONNECTÉ, EN VIVANT",
  "l'arrivée après connexion exige une session Supabase validée par le " +
    "serveur, que ce conteneur ne peut pas signer — le cookie fabriqué du " +
    "socle ne franchit pas `auth.getUser()`. Ce qui est prouvé ici : la " +
    "page n'a plus AUCUNE bifurcation (la requête, la constante et la " +
    "seconde sortie ont disparu du code), et les retours d'action passent " +
    "toujours avant elle. Je n'ai pas pu me connecter pour voir l'arrivée"
);

await ctx.close();
await nav.close();
process.exit(bilan());
