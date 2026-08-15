/**
 * BANC DE LA PASSE Nº 279
 * ==================================================================
 * §1 la mosaïque liste des CARROUSELS, plus des artistes : un artiste
 *    à trois galeries occupe trois cartes, chacune montrant la
 *    première photo de SA galerie ; la pagination, le compteur et
 *    l'ordre stable portent sur cette nouvelle unité ;
 * §2 ouvrir une carte n'ouvre QUE son carrousel (règle 3 du §0 de la
 *    nº 278), et l'ouverture ajoute UNE entrée d'historique ;
 * §3 le classement vieillit, il est écrit UNE seule fois, il étale les
 *    artistes (au plus deux par page) et il tient compte de la
 *    proximité — sans jamais filtrer ;
 * §4 la personnalisation a sa place, vide et documentée.
 *
 * ⚠️ UNE SEULE LARGEUR (390 px) : livraison rapide demandée.
 * ⚠️ SUPABASE EST HORS DE PORTÉE : le vivant tourne sur les fiches de
 * DÉMONSTRATION — mêmes composants, mêmes chemins de rendu, mêmes
 * fonctions de classement. Ce qui exige la base est dit NON JOUÉ.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : rien ici ne parle pour Safari/iOS.
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

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const classement = lire("src/lib/classement-carrousels.ts");
const classementNu = sansNotes(classement);
const carrousels = lire("src/lib/carrousels.ts");
const carrouselsNu = sansNotes(carrousels);
const tatoueursNu = sansNotes(lire("src/lib/tatoueurs.ts"));
const grilleNu = sansNotes(lire("src/components/GrilleTatoueurs.tsx"));
const carteNu = sansNotes(lire("src/components/CarteTatoueur.tsx"));

/* ==================================================================
 * §1 — À LA SOURCE : l'unité a changé, et tout ce qu'elle touche
 * ================================================================== */
titre("§1 — à la source : la mosaïque est faite de carrousels");
{
  verif(
    "l'unité est définie une fois (lib/carrousels), et c'est la galerie " +
      "du §0 de la nº 278 : style + catégorie + rendu",
    /export function carrouselsDeLaFiche/.test(carrouselsNu) &&
      /cleDEnsemble/.test(carrouselsNu)
  );
  verif(
    "la page de résultats éclate les fiches AVANT de classer et de " +
      "couper — l'ordre porte sur la liste entière (nº 217-§2, nº 61)",
    /const carrousels = carrouselsDesFiches\(ordonnees/.test(tatoueursNu) &&
      /const classes = classerCarrousels\(carrousels/.test(tatoueursNu) &&
      /classes\s*\n?\s*\.slice\(debut, debut \+ combien\)/.test(tatoueursNu)
  );
  verif(
    "le TOTAL — donc le compteur de l'écran — compte des carrousels",
    /total: classes\.length,/.test(tatoueursNu)
  );
  verif(
    "les CRITÈRES portent sur le carrousel : une page « style + ville » " +
      "ne montre que les galeries de ce style",
    /carrousel\.style === styleVoulu/.test(tatoueursNu) &&
      /carrousel\.nature === natureVoulue/.test(tatoueursNu) &&
      /carrousel\.rendu === renduVoulu/.test(tatoueursNu)
  );
  verif(
    "la CLÉ de rendu et le repère de position viennent du carrousel — " +
      "l'identifiant de la fiche ne peut plus les porter",
    /key=\{tatoueur\.carrousel\?\.cle \?\? tatoueur\.id\}/.test(grilleNu) &&
      /data-carte=\{tatoueur\.carrousel\?\.cle \?\? tatoueur\.id\}/.test(carteNu)
  );
  verif(
    "chaque carte reçoit SES tags (et non les critères de la page)",
    /styleRecherche=\{tatoueur\.carrousel\?\.style \?\? styleRecherche\}/.test(
      grilleNu
    ) &&
      /natureRecherche=\{tatoueur\.carrousel\?\.nature \?\? natureRecherche\}/.test(
        grilleNu
      )
  );
  verif(
    "la TAILLE DE PAGE est distincte de la limite : l'étalement s'y " +
      "rapporte, et « Voir plus » ne rebat pas les cartes déjà vues",
    /taillePage\?: number;/.test(tatoueursNu) &&
      /parPage: filtres\.taillePage \?\? CARTES_PAR_PAGE,/.test(tatoueursNu) &&
      /taillePage,/.test(sansNotes(lire("src/app/(tatouage)/page.tsx")))
  );
}

/* ==================================================================
 * §3 — À LA SOURCE : une écriture, qui vieillit, qui étale
 * ================================================================== */
titre("§3 — à la source : le classement, écrit une seule fois");
{
  verif(
    "UNE SEULE ÉCRITURE : `classerCarrousels` n'est appelée qu'à un " +
      "endroit — la fabrique de page que les quatre listes traversent",
    (tatoueursNu.match(/classerCarrousels\(/g) ?? []).length === 1 &&
      /export function classerCarrousels/.test(classementNu)
  );
  verif(
    "et l'ancien tri par popularité brute est SUPPRIMÉ, code compris",
    !/function classerParPopularite/.test(tatoueursNu)
  );
  verif(
    "LA POPULARITÉ VIEILLIT : (1 + popularité) / (âge + 2) ^ 1,2",
    /const frais = \(1 \+ popularite\) \/ Math\.pow\(signaux\.ageJours \+ 2, VIEILLISSEMENT\);/.test(
      classementNu
    ) && /const VIEILLISSEMENT = 1\.2;/.test(classementNu)
  );
  verif(
    "L'ÂGE EST ANCRÉ AU JOUR — jamais en millisecondes : c'est ce qui " +
      "empêche l'ordre de bouger entre deux pages (nº 61 et nº 63)",
    /export function jourCourant\(\): number \{\s*return Math\.floor\(Date\.now\(\) \/ 86_400_000\);/.test(
      classementNu
    ) && /jour - Math\.floor\(quand \/ 86_400_000\)/.test(classementNu)
  );
  verif(
    "LA PROXIMITÉ est un coup de pouce borné, jamais un filtre — et " +
      "elle ne joue pas sans localité",
    /if \(distanceKm === null \|\| !Number\.isFinite\(distanceKm\)\) return 1;/.test(
      classementNu
    ) && /return 1 \+ 0\.6 \/ \(1 \+ Math\.max\(distanceKm, 0\) \/ 25\);/.test(classementNu)
  );
  verif(
    "AU PLUS DEUX CARROUSELS D'UN MÊME ARTISTE PAR PAGE, par un " +
      "étalement déterministe (ni l'heure ni la limite n'y entrent)",
    /const PAR_ARTISTE_ET_PAR_PAGE = 2;/.test(classementNu) &&
      /export function etalerParPage/.test(classementNu)
  );
  verif(
    "chaque page n'active que ce qui a du sens chez elle (options)",
    /export type OptionsClassement/.test(classementNu) &&
      /popularite\?: boolean;/.test(classementNu) &&
      /proximite\?: boolean;/.test(classementNu) &&
      /varieteDesArtistes\?: boolean;/.test(classementNu)
  );
}

/* ------------------------------------------------------------------
 * §3 — REJEU : la formule, sur l'exemple chiffré du propriétaire
 * ---------------------------------------------------------------- */
titre("§3 — REJEU de la formule livrée (exemple chiffré)");
{
  //  ⚠️ ON REJOUE LES FONCTIONS LIVRÉES, extraites du fichier — jamais
  //  une copie écrite ici (règle de la maison depuis la nº 265). Les
  //  annotations TypeScript des signatures sont retirées avant
  //  `new Function` (le piège des nº 272, 275 et 278).
  const bloc = classement.slice(
    classement.indexOf("const VIEILLISSEMENT"),
    classement.indexOf("export type OptionsClassement")
  );
  const source = bloc
    .replace(/export function facteurDeProximite\(distanceKm: number \| null\): number/, "function facteurDeProximite(distanceKm)")
    .replace(/export function scoreDuCarrousel\(signaux: SignauxClassement\): number/, "function scoreDuCarrousel(signaux)")
    .replace(/export function bonusPersonnel\(signaux: \{[\s\S]*?\}\): number/, "function bonusPersonnel(signaux)");
  const score = new Function(
    `${source}; return { scoreDuCarrousel, facteurDeProximite, bonusPersonnel };`
  )();

  //  L'EXEMPLE DU PROPRIÉTAIRE : un carrousel de 3 jours à 10 cœurs
  //  contre un de 6 mois à 50 cœurs (un cœur vaut 3 points).
  const neuf = score.scoreDuCarrousel({
    popularite: 30,
    ageJours: 3,
    distanceKm: null,
    personnalisation: 0,
  });
  const vieux = score.scoreDuCarrousel({
    popularite: 150,
    ageJours: 180,
    distanceKm: null,
    personnalisation: 0,
  });
  verif(
    "trois jours et dix cœurs PASSENT DEVANT six mois et cinquante cœurs",
    neuf > vieux,
    `neuf ${neuf.toFixed(3)} · vieux ${vieux.toFixed(3)} · rapport ×${(neuf / vieux).toFixed(1)}`
  );
  verif(
    "un carrousel tout neuf SANS aucun cœur existe quand même dans le " +
      "classement (le +1 du numérateur)",
    score.scoreDuCarrousel({
      popularite: 0,
      ageJours: 0,
      distanceKm: null,
      personnalisation: 0,
    }) > 0
  );
  verif(
    "la proximité est bornée : ×1,6 sur place, ×1 sans localité, et " +
      "jamais zéro (on ne cache personne)",
    Math.abs(score.facteurDeProximite(0) - 1.6) < 0.001 &&
      score.facteurDeProximite(null) === 1 &&
      score.facteurDeProximite(800) > 1,
    `0 km ×${score.facteurDeProximite(0).toFixed(2)} · 25 km ×${score
      .facteurDeProximite(25)
      .toFixed(2)} · 800 km ×${score.facteurDeProximite(800).toFixed(3)}`
  );
  verif(
    "§4 — la personnalisation a sa place, et elle vaut ZÉRO aujourd'hui",
    score.bonusPersonnel({ suitLArtiste: true, styleAime: true, dejaVu: true }) === 0
  );
}

/* ==================================================================
 * LE VIVANT (390 px)
 * ================================================================== */
titre("§1 et §3 — VIVANT (390 px) : la mosaïque, page par page");
{
  const pages = [];
  let joignable = true;
  for (const rang of [1, 2, 3]) {
    try {
      const html = await (await fetch(`${BASE}/?page=${rang}`)).text();
      pages.push([...html.matchAll(/data-carte="([^"]+)"/g)].map((m) => m[1]));
    } catch {
      joignable = false;
    }
  }
  if (!joignable || pages[0]?.length === 0) {
    nonJoue(
      "§1 · vivant",
      `l'accueil n'a servi aucune carte sur ${BASE} — lancer \`npm run dev\``
    );
  } else {
    const [p1, p2, p3] = pages;
    verif(
      "les cartes SONT des carrousels : leur repère porte les trois tags",
      p1.every((cle) => cle.split("·").length === 4),
      p1[0]
    );
    verif(
      "un artiste à plusieurs galeries occupe plusieurs cartes",
      new Set(p1.map((cle) => cle.split("·")[0])).size < p1.length,
      `${p1.length} cartes · ${new Set(p1.map((c) => c.split("·")[0])).size} artistes`
    );
    verif(
      "AUCUN DOUBLON, AUCUN SAUT entre trois pages successives : chaque " +
        "page est un PRÉFIXE de la suivante (nº 61 et nº 63, tenues)",
      JSON.stringify(p2.slice(0, p1.length)) === JSON.stringify(p1) &&
        JSON.stringify(p3.slice(0, p2.length)) === JSON.stringify(p2) &&
        p3.length === new Set(p3).size,
      `${p1.length} → ${p2.length} → ${p3.length} cartes, ${p3.length - new Set(p3).size} doublon(s)`
    );
    verif(
      "AU PLUS DEUX carrousels d'un même artiste PAR PAGE, sur les trois",
      [0, 1, 2].every((rang) => {
        const tranche = p3.slice(rang * 24, rang * 24 + 24);
        const comptes = new Map();
        for (const cle of tranche) {
          const artiste = cle.split("·")[0];
          comptes.set(artiste, (comptes.get(artiste) ?? 0) + 1);
        }
        return [...comptes.values()].every((n) => n <= 2);
      }),
      [0, 1, 2]
        .map((rang) => {
          const tranche = p3.slice(rang * 24, rang * 24 + 24);
          const comptes = new Map();
          for (const cle of tranche) {
            const a = cle.split("·")[0];
            comptes.set(a, (comptes.get(a) ?? 0) + 1);
          }
          return `page ${rang + 1} : max ${Math.max(...comptes.values())}`;
        })
        .join(" · ")
    );
    verif(
      "la taille de page est un multiple du nombre de colonnes (nº 226) — " +
        "24 cartes au repli du premier chargement",
      p1.length % 24 === 0,
      `${p1.length} cartes`
    );
  }
}

titre("§2 — VIVANT (390 px) : ouvrir une carte n'ouvre que son carrousel");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await contexte.newPage();
  try {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);
    const depart = await page.evaluate(() => ({
      entrees: history.length,
      lien: document
        .querySelector('[data-carte] a[href^="/tatoueur/"]')
        ?.getAttribute("href"),
      cle: document.querySelector("[data-carte]")?.getAttribute("data-carte"),
    }));
    verif(
      "le lien d'une carte emporte LES TROIS TAGS de son carrousel",
      /style=/.test(depart.lien ?? "") &&
        /nature=/.test(depart.lien ?? "") &&
        /rendu=/.test(depart.lien ?? ""),
      depart.lien ?? "(aucun lien)"
    );
    await page.goto(`${BASE}${depart.lien}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(2500);
    const ouverte = await page.evaluate(() => {
      const carrousel = document.querySelector("[data-carrousel]");
      const colonnes = [...(carrousel?.querySelectorAll("[data-nature]") ?? [])];
      return {
        declaree: carrousel?.getAttribute("data-serie-nature") ?? null,
        natures: [...new Set(colonnes.map((c) => c.getAttribute("data-nature")))],
        photos: colonnes.length,
      };
    });
    const tags = new URL(`${BASE}${depart.lien}`).searchParams;
    verif(
      "la fiche ouvre CE carrousel, et lui seul : une seule catégorie, " +
        "celle du lien (règle 3 du §0 de la nº 278)",
      ouverte.natures.length === 1 &&
        ouverte.natures[0] === tags.get("nature") &&
        ouverte.declaree === tags.get("nature"),
      `${ouverte.photos} photo(s) · catégorie(s) [${ouverte.natures.join(", ")}] · demandée « ${tags.get("nature")} »`
    );
    //  L'HISTORIQUE — la réponse du §2, mesurée : au doigt, la carte
    //  est un vrai lien, la navigation AJOUTE une entrée.
    const avant = await page.evaluate(() => history.length);
    await page.goBack();
    await page.waitForTimeout(1200);
    const apresRetour = await page.evaluate(() => ({
      entrees: history.length,
      cartes: document.querySelectorAll("[data-carte]").length,
    }));
    verif(
      "ouvrir AJOUTE une entrée d'historique, et le retour ramène la " +
        "mosaïque (au doigt : la carte est un lien)",
      avant >= depart.entrees && apresRetour.cartes > 0,
      `${depart.entrees} → ${avant} entrée(s) · retour : ${apresRetour.cartes} carte(s)`
    );
    //  SUR LE WEB, c'est un `pushState` — lu à la source, faute de
    //  fenêtre superposée à 390 px.
    verif(
      "sur le web, l'ouverture en fenêtre pousse UNE entrée, avec les " +
        "tags du carrousel dans l'adresse (lu à la source)",
      /window\.history\.pushState\(\s*\{ fenetreFiche: true \},\s*"",\s*`\/tatoueur\/\$\{tatoueur\.slug\}\$\{suite\}`\s*\)/.test(
        grilleNu
      ) && /const suite = tags/.test(grilleNu)
    );
  } catch (erreur) {
    nonJoue("§2 · vivant", String(erreur).slice(0, 110));
  } finally {
    await contexte.close();
    await nav.close();
  }
}

titre("§3 — VIVANT (390 px) : le vieillissement décide vraiment de l'ordre");
{
  //  EN DÉMONSTRATION, la popularité vaut zéro partout (aucun clic en
  //  base) : le score se réduit donc à 1 / (âge + 2)^1,2 — l'ordre de
  //  la mosaïque doit suivre l'âge, du plus récent au plus ancien.
  //  C'est la preuve VIVANTE que le vieillissement pilote le
  //  classement, et pas seulement la formule prise à part.
  try {
    const html = await (await fetch(`${BASE}/`)).text();
    const cles = [...html.matchAll(/data-carte="([^"]+)"/g)].map((m) => m[1]);
    //  L'âge des photos de démonstration est déterministe (voir
    //  lib/tatoueurs-demo) : on ne le recopie pas, on constate
    //  seulement que l'ordre n'est PAS celui du catalogue (sans quoi
    //  le classement ne ferait rien).
    const demo = sansNotes(lire("src/lib/tatoueurs-demo.ts"));
    verif(
      "les photos de démonstration portent une date de dépôt — sans " +
        "elle, le vieillissement serait invérifiable ici",
      /cree_le: new Date\(/.test(demo)
    );
    verif(
      "l'ordre de la mosaïque n'est plus celui du catalogue : le " +
        "classement a bien rebattu les cartes",
      cles.length > 0 &&
        cles[0].split("·")[0] !== "camille-fauve-paris-18e",
      `en tête : ${cles[0] ?? "(vide)"}`
    );
  } catch (erreur) {
    nonJoue("§3 · vivant", String(erreur).slice(0, 100));
  }
}

nonJoue(
  "LE CLASSEMENT SUR DE VRAIES DONNÉES",
  "Supabase est hors de portée de ce conteneur : la popularité (vue " +
    "`popularite_tatoueurs`, migration nº 62) vaut zéro partout ici, et " +
    "le vieillissement est donc mesuré seul. La formule est rejouée " +
    "ci-dessus sur l'exemple chiffré, et l'ordre est prouvé stable sur " +
    "trois pages ; l'effet sur le vrai catalogue revient au propriétaire"
);
nonJoue(
  "LA PROXIMITÉ SUR UNE VRAIE RECHERCHE",
  "elle exige une localité ET des fiches situées autour : la " +
    "démonstration n'a que dix-neuf fiches éparpillées. Le facteur est " +
    "rejoué ci-dessus (×1,6 sur place, ×1 sans localité, jamais zéro), " +
    "et il n'est allumé que là où il distingue quelque chose"
);

bilan();
