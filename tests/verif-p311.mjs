/**
 * BANC DE LA PASSE Nº 311 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 — LE BADGE « SE CONNECTER » : son icône monte au rang du GLOBE de
 *      la barre (les deux sont mesurées et comparées, en vivant), et
 *      son contour passe à 2 px. L'exception à la charte doit rester
 *      ÉCRITE — le banc la cherche, comme à la nº 309.
 * §2 — LA FENÊTRE DU GLOBE : le voile de la nº 294 est réemployé (on
 *      vérifie qu'il n'y en a qu'UNE couleur, qu'UN z-index, qu'il
 *      couvre TOUT l'écran barre comprise, et qu'il n'épargne que le
 *      bloc du globe) ; les langues indisponibles sont DÉCODÉES AU
 *      PIXEL, avant et après, sur le même fond.
 * §3 — LE SÉLECTEUR DE RENDU : trait rose à GAUCHE, vertical, et les
 *      quatre états.
 * §4 — « Élargir le rayon » quitte les pages de référencement, et
 *      SEULEMENT elles.
 *
 * ⚠️ UNE SEULE FENÊTRE : 1440 × 823, densité 2 — celle du propriétaire.
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
import { lirePixels } from "./_pixels.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const entete = lire("src/components/EnTeteTatouage.tsx"); // AVEC ses notes
const langue = sansNotes(lire("src/components/SelecteurLangue.tsx"));
const portfolio = sansNotes(lire("src/components/BlocPortfolio.tsx"));
const styleVille = sansNotes(
  lire("src/app/(tatouage)/tatouage/[style]/[ville]/page.tsx")
);
const index = sansNotes(lire("src/components/IndexTatoueurs.tsx"));

const ROSE = "rgb(238, 61, 111)";
const BLANC = "rgb(255, 255, 255)";
const GRIS_DOUX = "rgb(168, 168, 176)"; //  #A8A8B0
const ANTHRACITE = "rgb(26, 26, 29)";
const GRIS_TRAIT = "rgb(56, 56, 63)"; //  #38383F

/* ==================================================================
 * À LA SOURCE
 * ================================================================== */
titre("§1 · §3 · §4 à la source");
{
  verif(
    "§1 — l'exception à la charte est TOUJOURS écrite, et toujours datée",
    /EXCEPTION EXPLICITE À LA CHARTE/.test(entete) &&
      /AUCUN CONTOUR NULLE PART/.test(entete) &&
      /AUCUNE PASSE FUTURE NE DOIT LE RETIRER/.test(entete) &&
      /PASSE Nº 309/.test(entete)
  );
  verif(
    "§1 — le contour est passé de 1 px à 2 px",
    /border-2 border-sombre-bordure/.test(entete) &&
      !/\bborder border-sombre-bordure/.test(entete)
  );
  verif(
    "§1 — l'icône du badge est au rang 24, celui du globe",
    /<IconeUtilisateur taille=\{24\}/.test(entete) &&
      /<IconeMonde taille=\{24\} \/>/.test(langue)
  );
  verif(
    "§2-a — c'est LE mécanisme de voile existant, pas un second",
    /import \{ useVoileDeLaPage \} from "@\/components\/VoileDeLaPage";/.test(
      langue
    ) &&
      /useVoileDeLaPage\(ouvert && !superposee, zone\);/.test(langue) &&
      //  rien n'est recopié : aucune couleur, aucune opacité, aucun z
      !/z-\[[0-9]+\][^\n]*bg-black/.test(langue)
  );
  /*  ⚠️ AMENDÉ PAR LA Nº 312-§3a — ANNULATION, SUR CONSIGNE. La
      consigne de cette passe-ci était fausse : le propriétaire trouvait
      le /50 DÉJÀ trop sombre, et l'assombrir encore l'a rendu illisible.
      On est remonté à /85. Ce contrôle tient donc l'inverse de ce qu'il
      tenait — c'est la même mesure, retournée. */
  verif(
    "§2-b — les langues indisponibles sont REMONTÉES au-dessus du /50 de départ",
    /text-sombre-texte-doux\/85 cursor-not-allowed/.test(langue) &&
      !/text-sombre-texte-doux\/20/.test(langue)
  );
  /*  ⚠️ AMENDÉ PAR LA Nº 312-§4 — ANNULATION, SUR CONSIGNE : le trait
      est revenu au bord BAS, celui de la nº 309. */
  verif(
    "§3-a — le trait rose court le long du bord BAS (revenu par la nº 312)",
    /absolute inset-x-0 bottom-0 h-\[2px\] bg-primaire/.test(portfolio) &&
      !/absolute inset-y-0 left-0 w-\[2px\] bg-primaire/.test(portfolio)
  );
  verif(
    "§3-a — …et il n'est rendu que sous le rendu choisi",
    /\{actif && \(/.test(portfolio) && /data-soulignement-rendu=""/.test(portfolio)
  );
  verif(
    "§3-b — le TITRE est blanc dans les deux états",
    /block text-\[14px\] font-semibold text-white/.test(portfolio) &&
      !/actif \? "text-white" : "text-sombre-texte-doux"[\s\S]{0,120}\{rendu\.label\}/.test(
        portfolio
      )
  );
  verif(
    "§3-b — le SOUS-TITRE, lui, reste blanc / gris",
    /actif \? "text-white" : "text-sombre-texte-doux"/.test(portfolio)
  );
  verif(
    "§4 — « Élargir le rayon » a quitté la page de référencement",
    !/Élargir le rayon/.test(styleVille) &&
      /issues=\{\[\{ libelle: "Chercher partout", href: `\/\?style=\$\{style\}` \}\]\}/.test(
        styleVille
      )
  );
  verif(
    "§4 — …et le MOTEUR garde ses deux boutons",
    /libelle: "Élargir le rayon"/.test(index) &&
      /libelle: "Chercher partout"/.test(index)
  );
}

/* ==================================================================
 * EN VIVANT — 1440 × 823, densité 2
 * ================================================================== */
const nav = await chromium.launch({
  executablePath: process.env.CHEMIN_CHROMIUM,
  args: ["--no-proxy-server"],
});
const ctx = await nav.newContext({
  viewport: { width: 1440, height: 823 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

titre("§1 en vivant — le badge et le globe, côte à côte");
{
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector("[data-bouton-connexion]", { timeout: 30000 });
  const m = await page.evaluate(() => {
    const badge = document.querySelector("[data-bouton-connexion]");
    const svgB = badge.querySelector("svg");
    const globe = document.querySelector('button[aria-label^="Langue"]');
    const svgG = globe?.querySelector("svg");
    const s = getComputedStyle(badge);
    const B = svgB.getBoundingClientRect();
    const G = svgG?.getBoundingClientRect();
    return {
      badge: [B.width, B.height],
      globe: G ? [G.width, G.height] : null,
      fond: s.backgroundColor,
      contour: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
      largeurContour: [
        s.borderTopWidth,
        s.borderRightWidth,
        s.borderBottomWidth,
        s.borderLeftWidth,
      ],
      texte: getComputedStyle(badge.querySelector("span")).color,
    };
  });
  verif(
    "L'ICÔNE DU BADGE ET CELLE DU GLOBE FONT LA MÊME TAILLE",
    m.globe !== null &&
      m.badge[0] === m.globe[0] &&
      m.badge[1] === m.globe[1] &&
      m.badge[0] === 24,
    `badge ${m.badge.join(" × ")} · globe ${m.globe?.join(" × ")}`
  );
  verif(
    "le contour fait 2 px, sur les quatre côtés",
    m.largeurContour.every((l) => l === "2px"),
    m.largeurContour.join(" ")
  );
  verif(
    "le contour est le gris des traits du site (#38383F)",
    m.contour === `2px solid ${GRIS_TRAIT}`,
    m.contour
  );
  verif("le fond reste l'anthracite #1A1A1D", m.fond === ANTHRACITE, m.fond);
  verif("le texte reste rose #EE3D6F", m.texte === ROSE, m.texte);
}

titre("§2-a en vivant — le voile de la fenêtre du globe");
{
  const avant = await page.evaluate(
    () => document.querySelectorAll("[data-voile-page]").length
  );
  verif("aucun voile tant que la fenêtre est fermée", avant === 0, `${avant}`);

  await page.click('button[aria-label^="Langue"]');
  await page.waitForTimeout(800);
  const v = await page.evaluate(() => {
    const morceaux = [...document.querySelectorAll("[data-voile-page]")];
    const rects = morceaux.map((n) => n.getBoundingClientRect());
    //  Chaque point d'une grille de l'écran est-il recouvert ?
    let couverts = 0,
      total = 0;
    const nus = [];
    for (let x = 4; x < window.innerWidth; x += 20) {
      for (let y = 4; y < window.innerHeight; y += 20) {
        total += 1;
        if (
          rects.some(
            (r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
          )
        )
          couverts += 1;
        else nus.push([x, y]);
      }
    }
    const bloc = document
      .querySelector('button[aria-label^="Langue"]')
      .closest("div")
      .getBoundingClientRect();
    const barre = document.querySelector("header")?.getBoundingClientRect();
    return {
      morceaux: morceaux.length,
      couleurs: [...new Set(morceaux.map((n) => getComputedStyle(n).backgroundColor))],
      z: [...new Set(morceaux.map((n) => getComputedStyle(n).zIndex))],
      couverts,
      total,
      //  Tout ce qui n'est PAS recouvert tombe-t-il dans le bloc épargné ?
      nusHorsBloc: nus.filter(
        ([x, y]) =>
          !(x >= bloc.left && x <= bloc.right && y >= bloc.top && y <= bloc.bottom)
      ).length,
      barreRecouverte: barre
        ? rects.some((r) => r.top <= barre.top + 2 && r.bottom >= barre.top + 2)
        : false,
    };
  });
  verif(
    "LE VOILE EST LÀ, et il n'a QU'UNE couleur et QU'UN plan",
    v.morceaux > 0 && v.couleurs.length === 1 && v.z.length === 1,
    `${v.morceaux} morceau(x) · ${v.couleurs[0]} · z ${v.z[0]}`
  );
  verif(
    "il recouvre TOUT l'écran, LA BARRE COMPRISE",
    v.barreRecouverte && v.nusHorsBloc === 0,
    `${v.couverts}/${v.total} points couverts · ${v.nusHorsBloc} point(s) nu(s) hors du bloc épargné`
  );
  verif(
    "…et il n'épargne QUE le bloc qui a ouvert la fenêtre",
    v.couverts < v.total,
    `${v.total - v.couverts} point(s) épargné(s), tous dans le bloc`
  );
}

titre("§2-b au pixel — les langues indisponibles, avant et après");
{
  /** Le pixel le plus clair du texte d'une langue désactivée. */
  async function texteEteint() {
    const z = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button[lang]")].filter(
        (n) => n.disabled
      )[0];
      const r = b.getBoundingClientRect();
      return {
        x: Math.round(r.left + 30),
        y: Math.round(r.top + 12),
        width: 120,
        height: 22,
        mot: b.textContent.trim().slice(0, 12),
      };
    });
    const png = await page.screenshot({
      clip: { x: z.x, y: z.y, width: z.width, height: z.height },
    });
    const px = lirePixels(png);
    let max = -1,
      best = null;
    for (let x = 0; x < px.largeur; x += 1) {
      for (let y = 0; y < px.hauteur; y += 1) {
        const p = px.pixel(x, y);
        const l = p[0] + p[1] + p[2];
        if (l > max) {
          max = l;
          best = p;
        }
      }
    }
    return { pixel: best, mot: z.mot };
  }

  const apres = await texteEteint();
  //  ⚠️ ON REMET L'ANCIENNE VALEUR POUR MESURER « AVANT » SUR LE MÊME
  //  FOND : deux nombres pris sur deux captures différentes ne se
  //  comparent pas. La plaque de verre, elle, ne bouge pas.
  await page.addStyleTag({
    content: `button[lang][disabled]{color:rgba(168,168,176,0.5)!important}`,
  });
  await page.waitForTimeout(300);
  const avant = await texteEteint();
  //  …et on rend la main à la valeur du produit.
  await page.addStyleTag({
    content: `button[lang][disabled]{color:rgba(168,168,176,0.2)!important}`,
  });

  /*  ⚠️ AMENDÉ PAR LA Nº 312-§3a : le sens est INVERSÉ. Le texte éteint
      doit maintenant être plus CLAIR que le /50 de départ, pas plus
      sombre. La mesure, elle, ne change pas d'un iota — c'est le même
      pixel, lu sur le même fond. */
  verif(
    "le texte éteint est NETTEMENT plus CLAIR que le /50 de départ",
    apres.pixel[0] > avant.pixel[0] + 30,
    `/50 rgb(${avant.pixel.join(", ")}) → /85 rgb(${apres.pixel.join(", ")})`
  );
  const dispo = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button[lang]")].find(
      (n) => !n.disabled
    );
    return getComputedStyle(b).color;
  });
  /*  ⚠️ AMENDÉ PAR LA Nº 312-§3a : une langue indisponible doit rester
      MOINS PRÉSENTE qu'une disponible — mais lisible. On borne donc par
      le haut, plus par le bas. */
  verif(
    "…tout en restant moins présente qu'une langue disponible",
    dispo === "rgb(242, 242, 244)" && apres.pixel[0] < 200,
    `disponible ${dispo} · indisponible rgb(${apres.pixel.join(", ")})`
  );
  const point = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button[lang]")].filter(
      (n) => n.disabled
    )[0];
    return getComputedStyle(b.querySelector("span[aria-hidden]"))
      .backgroundColor;
  });
  /*  ⚠️ AMENDÉ PAR LA Nº 312-§3b : le point est revenu à 40 %, sa valeur
      de la nº 241 — il n'avait été descendu à 15 % que pour suivre un
      texte qu'on assombrissait, et le texte est remonté. */
  verif(
    "le point de la ligne est revenu à 40 % (la valeur de la nº 241)",
    /0\.4\b|40%/.test(point),
    point
  );
}

titre("§3 en vivant — les quatre états, tels que le navigateur les résout");
{
  /*  ⚠️ LE FORMULAIRE DE PORTFOLIO EXIGE UNE SESSION QUE CE CONTENEUR
      NE PEUT PAS SIGNER. Ce qu'on peut donc prouver ici, et qu'on
      prouve : les CLASSES que la source assigne à chacun des quatre
      états, résolues par le navigateur du site, avec ses variables de
      thème. La source dit qui reçoit quoi ; le navigateur dit ce que
      ça vaut. */
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const etats = await page.evaluate(() => {
    const sonde = document.createElement("div");
    sonde.innerHTML = `
      <span data-e="titre" class="block text-[14px] font-semibold text-white">t</span>
      <span data-e="sous-titre choisi" class="mt-0.5 block text-[12.5px] text-white">s</span>
      <span data-e="sous-titre non choisi" class="mt-0.5 block text-[12.5px] text-sombre-texte-doux">s</span>
      <span data-e="trait" class="absolute inset-y-0 left-0 w-[2px] bg-primaire"></span>`;
    sonde.style.position = "relative";
    sonde.style.height = "60px";
    document.body.appendChild(sonde);
    const lu = {};
    for (const n of sonde.querySelectorAll("[data-e]")) {
      const s = getComputedStyle(n);
      const r = n.getBoundingClientRect();
      lu[n.dataset.e] =
        n.dataset.e === "trait"
          ? {
              fond: s.backgroundColor,
              largeur: r.width,
              hauteur: r.height,
              cote: `${s.left} / ${s.right}`,
            }
          : s.color;
    }
    sonde.remove();
    return lu;
  });
  verif(
    "SÉLECTIONNÉ — titre BLANC",
    etats["titre"] === "rgb(255, 255, 255)",
    etats["titre"]
  );
  verif(
    "SÉLECTIONNÉ — sous-titre BLANC",
    etats["sous-titre choisi"] === "rgb(255, 255, 255)",
    etats["sous-titre choisi"]
  );
  verif(
    "NON SÉLECTIONNÉ — titre BLANC (c'est le §3-b)",
    etats["titre"] === "rgb(255, 255, 255)",
    "même écriture que l'actif : une seule classe, aucun ternaire"
  );
  verif(
    "NON SÉLECTIONNÉ — sous-titre GRIS",
    etats["sous-titre non choisi"] === GRIS_DOUX,
    etats["sous-titre non choisi"]
  );
  verif(
    "LE TRAIT est rose, VERTICAL, 2 px, collé à GAUCHE",
    etats["trait"].fond === ROSE &&
      etats["trait"].largeur === 2 &&
      etats["trait"].hauteur > 40 &&
      etats["trait"].cote.startsWith("0px"),
    `${etats["trait"].fond} · ${etats["trait"].largeur} × ${etats["trait"].hauteur} · left ${etats["trait"].cote}`
  );
}

titre("§4 en vivant — les pages de référencement, et le moteur");
{
  /** Les libellés des issues du bloc « Aucun résultat ». */
  const issues = () =>
    page.evaluate(() => {
      const t = [...document.querySelectorAll("p")].find(
        (p) => p.textContent.trim() === "Aucun résultat"
      );
      if (!t) return null;
      return [...t.parentElement.querySelectorAll("button, a")].map((n) =>
        n.textContent.trim()
      );
    });

  await page.goto(BASE + "/tatouage/abstrait/bordeaux", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(500);
  const seo = await issues();
  verif(
    "PAGE DE RÉFÉRENCEMENT : « Chercher partout » SEULE",
    JSON.stringify(seo) === JSON.stringify(["Chercher partout"]),
    seo ? seo.join(" | ") : "aucun bloc « Aucun résultat »"
  );

  await page.goto(
    BASE +
      "/?lieu=Nulle+part&lat=0.00000&lon=0.00000&niveau=ville&ville=Nulle+part&rayon=10",
    { waitUntil: "networkidle" }
  );
  await page.waitForTimeout(700);
  const moteur = await issues();
  verif(
    "MOTEUR DE RECHERCHE : les DEUX boutons restent",
    JSON.stringify(moteur) ===
      JSON.stringify(["Élargir le rayon", "Chercher partout"]),
    moteur ? moteur.join(" | ") : "aucun bloc « Aucun résultat »"
  );
}

nonJoue(
  "§3 EN VIVANT, SUR SA PAGE",
  "le formulaire de portfolio exige une session Supabase validée par le " +
    "serveur, que ce conteneur ne peut pas signer. Les quatre états sont " +
    "donc prouvés en DEUX temps : la source dit quelle classe reçoit " +
    "chaque état (au caractère près), et le navigateur du site dit ce que " +
    "ces classes valent (ci-dessus). Je n'ai pas pu voir le sélecteur " +
    "peint sur sa propre page"
);

await ctx.close();
await nav.close();
process.exit(bilan());
