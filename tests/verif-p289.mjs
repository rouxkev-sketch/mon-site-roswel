/**
 * BANC DE LA PASSE Nº 289 — GRAPHIQUE (livraison économe)
 * ==================================================================
 * §1 le TRACÉ de la flèche (pas sa boîte) aligné sur le bord du rond ;
 * §2 le liseré de verre du champ « Mon compte » — sans filtre propre,
 *    sans @supports, sans var() : il n'y a rien à piéger ;
 * §3 les sélectionnés perdent leur fond rose : fond neutre un cran
 *    plus clair (#3F3F47), typographie rose #EE3D6F — le voile
 *    `primaireVoile` survit aux pastilles d'icône et badges d'info.
 * ⚠️ UN SEUL NAVIGATEUR, UNE SEULE LARGEUR (390 px), les valeurs
 * demandées et rien de plus.
 */
import {
  BASE,
  bilan,
  chromium,
  lire,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const fenetre = sansNotes(lire("src/components/FenetreCarrousel.tsx"));
const menu = sansNotes(lire("src/components/MenuEspace.tsx"));
const modes = sansNotes(lire("src/components/BlocModesExercice.tsx"));
const portfolio = sansNotes(lire("src/components/BlocPortfolio.tsx"));
const globals = lire("src/app/globals.css");

titre("§1-§3 — à la source");
{
  verif(
    "§1 — le chevron est posé en ABSOLU à −6,325 px (le bord visible " +
      "du trait à 0 du bouton), la zone de touche garde ses 44 px — " +
      "sur les DEUX flèches (bouton et lien)",
    (fenetre.match(/left: "-6\.325px", top: "11px"/g) ?? []).length === 2 &&
      (fenetre.match(/relative flex h-11 w-11/g) ?? []).length === 2
  );
  const regle = globals.slice(
    globals.indexOf("[data-verre-champ]"),
    globals.indexOf("}", globals.indexOf("[data-verre-champ]")) + 1
  );
  verif(
    "§2 — le liseré de verre : deux ombres INTERNES (0,05 haut / 0,02 " +
      "pourtour), AUCUN filtre propre, ni @supports ni var() dans la " +
      "règle — et le champ le porte",
    /inset 0 1px 0 0 rgba\(255, 255, 255, 0\.05\)/.test(regle) &&
      /inset 0 0 0 1px rgba\(255, 255, 255, 0\.02\)/.test(regle) &&
      !/backdrop-filter|@supports|var\(/.test(regle) &&
      /data-verre-champ=""/.test(menu)
  );
  verif(
    "§3 — les modes « À domicile / En studio / En salon / Guest » : " +
      "sélectionné en fond NEUTRE #3F3F47, typo rose — plus de voile",
    /\? "bg-sombre-eleve-clair"\s*: "bg-sombre-eleve hover:bg-sombre-eleve-clair active:bg-sombre-eleve-clair"/.test(
      modes.replace(/\s+/g, " ")
    ) && !/bg-primaire-voile/.test(modes)
  );
  verif(
    "§3 — « Noir et gris — 19/20 photos » : fond neutre, TITRE rose, " +
      "la ligne secondaire RESTE GRISE",
    /\? "bg-sombre-eleve-clair"\s*: "bg-sombre-eleve hover:bg-sombre-eleve-clair"/.test(
      portfolio.replace(/\s+/g, " ")
    ) &&
      /\{nombre\}\/\{PLAFOND_GALERIE\} photos/.test(portfolio) &&
      /text-\[12\.5px\] text-sombre-texte-doux/.test(portfolio) &&
      !/bg-primaire-voile/.test(portfolio)
  );
  verif(
    "§3 — un seul jeu partout : horaires, calendrier, styles, admin — " +
      "sélectionné `bg-sombre-eleve-clair text-primaire`",
    [
      "src/components/BlocHorairesStudio.tsx",
      "src/components/CalendrierPlage.tsx",
      "src/components/SelecteurStyleFiche.tsx",
      "src/components/AdminYokofolio.tsx",
    ].every((chemin) => {
      const t = sansNotes(lire(chemin));
      return /bg-sombre-eleve-clair (font-semibold )?text-primaire/.test(t);
    })
  );
  verif(
    "§3 — `primaireVoile` SURVIT, aux pastilles d'icône et badges " +
      "d'information (l'horloge de la confirmation, la jauge, " +
      "« Retenu »…) — jamais plus sur un bouton sélectionné",
    /primaireVoile: "#381E29"/.test(sansNotes(lire("src/config/roswel.ts"))) &&
      /rounded-full bg-primaire-voile text-primaire/.test(
        sansNotes(lire("src/components/FormulaireFiche.tsx"))
      ) &&
      /bg-primaire-voile/.test(sansNotes(lire("src/components/JaugeMotDePasse.tsx")))
  );
}

titre("vivant (390 px) — le tracé de la flèche, au pixel du rond");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  try {
    const contexte = await nav.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
    });
    const page = await contexte.newPage();
    await page.goto(
      `${BASE}/tatoueur/typo-sauvage-bordeaux/carrousel?style=chicano&nature=tatouage&rendu=black_and_grey`,
      { waitUntil: "domcontentloaded", timeout: 90000 }
    );
    await page.waitForSelector("[data-fenetre-carrousel]", { timeout: 60000 });
    await page.waitForTimeout(1500);
    const mesure = await page.evaluate(() => {
      const bouton = document.querySelector(
        '[data-fenetre-carrousel] a[aria-label="Voir la fiche"], [data-fenetre-carrousel] button[aria-label="Retour"]'
      );
      const trait = bouton.querySelector("path");
      const rond = document.querySelector(
        '[data-fenetre-carrousel] a[aria-label^="Voir le profil"]'
      );
      //  `getBoundingClientRect` d'un <path> rend la GÉOMÉTRIE nue
      //  (mesuré) : le bord VISIBLE du trait est une demi-épaisseur
      //  plus à gauche — 1,1 unité × 22/24 = 1,00833 px.
      return {
        traceVisible: trait.getBoundingClientRect().left - 1.00833,
        rond: rond.getBoundingClientRect().left,
        bouton: bouton.getBoundingClientRect().left,
        largeurBouton: bouton.getBoundingClientRect().width,
      };
    });
    verif(
      "LE BORD DU TRAIT est celui du rond, au pixel (l'écart restant " +
        "est l'arrondi de grille du moteur, < 1/60 px)",
      Math.abs(mesure.traceVisible - mesure.rond) < 0.05,
      `trait ${mesure.traceVisible.toFixed(3)} · rond ${mesure.rond.toFixed(3)}`
    );
    verif(
      "et la zone de touche n'a pas bougé : 44 px, à sa place",
      mesure.largeurBouton === 44 && mesure.bouton === 16,
      `bouton ${mesure.bouton}, ${mesure.largeurBouton} px`
    );
  } finally {
    await nav.close();
  }
}

process.exit(bilan());
