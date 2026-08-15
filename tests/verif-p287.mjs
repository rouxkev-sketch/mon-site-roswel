/**
 * BANC DE LA PASSE Nº 287 — GRAPHIQUE (livraison économe)
 * ==================================================================
 * §1 l'échelle retendue — quatre niveaux distincts (page · bloc ·
 *    badge · champ), champs et focus montés d'autant ;
 * §2 le badge sélectionné : UN jeton (`primaire-voile`), le mot rose
 *    dessus — plus un seul `bg-primaire/15` ;
 * §3 les arrondis réduits (blocs 16/24 → 12 px, champs 12 → 8 px) ;
 * §4 la flèche de la fenêtre du carrousel alignée au pixel sur le
 *    rond de profil ;
 * §5 les séparateurs du profil dans les marges, au doigt.
 *
 * ⚠️ UN SEUL NAVIGATEUR, UNE SEULE LARGEUR (390 px), les valeurs
 * demandées et rien de plus — c'est la consigne de la passe.
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

const config = sansNotes(lire("src/config/tatouage.ts"));
const roswel = sansNotes(lire("src/config/roswel.ts"));
const fenetre = sansNotes(lire("src/components/FenetreCarrousel.tsx"));
const contenu = sansNotes(lire("src/components/ContenuFiche.tsx"));
const formulaire = sansNotes(lire("src/components/FormulaireFiche.tsx"));
const securite = sansNotes(lire("src/components/Securite.tsx"));

titre("§1-§3 — à la source : les valeurs, et une seule écriture");
{
  verif(
    "L'ÉCHELLE : page #1A1A1D (inchangée) · bloc #28282D · badge " +
      "#33333A · champ #3F3F47 — et les deux crans du dessus suivent",
    /fond: "#1A1A1D"/.test(config) &&
      /carte: "#28282D"/.test(config) &&
      /eleve: "#33333A"/.test(config) &&
      /eleveClair: "#3F3F47"/.test(config) &&
      /haut: "#4A4A53"/.test(config) &&
      /hautClair: "#55555F"/.test(config)
  );
  verif(
    "LES CHAMPS SONT MONTÉS D'UN CRAN : repos `eleve-clair`, focus " +
      "`haut` — badge plus sombre que le champ, enfin vrai",
    /bg-sombre-eleve-clair/.test(securite) &&
      /focus:bg-sombre-haut/.test(securite) &&
      !/focus:bg-sombre-eleve-clair/.test(securite)
  );
  verif(
    "LE VOILE ROSE : un jeton (`primaireVoile: #381E29`), et PLUS UN " +
      "SEUL `bg-primaire/15` dans tout le site",
    /primaireVoile: "#381E29"/.test(roswel) &&
      !/bg-primaire\/15/.test(
        [
          formulaire,
          securite,
          sansNotes(lire("src/components/BlocModesExercice.tsx")),
          sansNotes(lire("src/components/BlocPortfolio.tsx")),
          sansNotes(lire("src/components/SelecteurStyleFiche.tsx")),
        ].join("")
      ) &&
      /bg-primaire-voile/.test(sansNotes(lire("src/components/BlocModesExercice.tsx")))
  );
  verif(
    "LES BLOCS : 12 px (`rounded-xl`), plus aucun 16/24 " +
      "(`rounded-2xl` / `sm:rounded-3xl`) ; les champs à 8 px " +
      "(`rounded-lg`)",
    /bg-sombre-carte rounded-xl px-4 py-6/.test(formulaire) &&
      /bg-sombre-carte rounded-xl px-4 py-6/.test(securite) &&
      !/rounded-2xl|rounded-3xl/.test(formulaire) &&
      !/rounded-2xl|rounded-3xl/.test(securite) &&
      /rounded-lg[^"]*bg-sombre-eleve-clair|bg-sombre-eleve-clair[^"]*rounded-lg|rounded-lg/.test(
        securite
      )
  );
  verif(
    "§4 — la barre de la fenêtre porte le `px-4` de la ligne du rond",
    /flex h-14 items-center justify-between px-4/.test(fenetre) &&
      /flex items-center gap-3 px-4/.test(fenetre)
  );
  verif(
    "§5 — le séparateur du profil ne sort plus des marges " +
      "(`mobile:-mx-4` est parti)",
    /const separation = "border-t border-sombre-bordure\/60";/.test(contenu) &&
      !/mobile:-mx-4 mobile:px-4/.test(contenu)
  );
}

titre("vivant (390 px) — les valeurs servies, la flèche, le séparateur");
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

    //  LES JETONS, tels que le navigateur les reçoit.
    await page.goto(
      `${BASE}/tatoueur/typo-sauvage-bordeaux/carrousel?style=chicano&nature=tatouage&rendu=black_and_grey`,
      { waitUntil: "domcontentloaded", timeout: 90000 }
    );
    await page.waitForSelector("[data-fenetre-carrousel]", { timeout: 60000 });
    await page.waitForTimeout(2000);
    const jetons = await page.evaluate(() => {
      const lireVar = (nom) =>
        getComputedStyle(document.documentElement)
          .getPropertyValue(nom)
          .trim()
          .toUpperCase();
      return {
        fond: lireVar("--rw-sombre-fond"),
        carte: lireVar("--rw-sombre-carte"),
        eleve: lireVar("--rw-sombre-eleve"),
        eleveClair: lireVar("--rw-sombre-eleve-clair"),
        haut: lireVar("--rw-sombre-haut"),
        voile: lireVar("--rw-primaire-voile"),
        primaire: lireVar("--rw-primaire"),
      };
    });
    verif(
      "les quatre niveaux servis : #1A1A1D · #28282D · #33333A · #3F3F47",
      jetons.fond === "#1A1A1D" &&
        jetons.carte === "#28282D" &&
        jetons.eleve === "#33333A" &&
        jetons.eleveClair === "#3F3F47" &&
        jetons.haut === "#4A4A53",
      `${jetons.fond} · ${jetons.carte} · ${jetons.eleve} · ${jetons.eleveClair}`
    );
    verif(
      "le voile rose servi : fond #381E29 sous un texte #EE3D6F",
      jetons.voile === "#381E29" && jetons.primaire === "#EE3D6F",
      `${jetons.voile} / ${jetons.primaire}`
    );

    //  §4 — LA FLÈCHE ET LE ROND, au pixel.
    const alignement = await page.evaluate(() => {
      const fleche = document.querySelector(
        '[data-fenetre-carrousel] a[aria-label="Voir la fiche"], [data-fenetre-carrousel] button[aria-label="Retour"]'
      );
      const rond = document.querySelector(
        '[data-fenetre-carrousel] a[aria-label^="Voir le profil"]'
      );
      return {
        fleche: fleche.getBoundingClientRect().left,
        rond: rond.getBoundingClientRect().left,
      };
    });
    verif(
      "§4 — le bord gauche de la flèche est CELUI du rond de profil",
      alignement.fleche === alignement.rond,
      `flèche ${alignement.fleche} = rond ${alignement.rond}`
    );

    //  §5 — LE SÉPARATEUR DU PROFIL, dans les marges.
    await page.goto(`${BASE}/tatoueur/typo-sauvage-bordeaux`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForSelector('[data-role="cadre"]', { timeout: 60000 });
    await page.waitForTimeout(2000);
    const separateur = await page.evaluate(() => {
      const ligne = [...document.querySelectorAll("div")].find((d) =>
        d.className.includes?.("border-sombre-bordure/60")
      );
      if (!ligne) return null;
      const boite = ligne.getBoundingClientRect();
      return { gauche: boite.left, droite: window.innerWidth - boite.right };
    });
    verif(
      "§5 — le séparateur respecte les marges : 16 px de chaque côté, " +
        "plus de bord à bord",
      Boolean(separateur) &&
        separateur.gauche === 16 &&
        separateur.droite === 16,
      separateur ? `gauche ${separateur.gauche} · droite ${separateur.droite}` : "introuvable"
    );
  } finally {
    await nav.close();
  }
}

process.exit(bilan());
