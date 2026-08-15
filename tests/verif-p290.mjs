/**
 * BANC DE LA PASSE Nº 290 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 l'adresse saisie à la main se clique SUR UNE FICHE D'ARTISTE —
 *    et par le MÊME mécanisme que partout ailleurs (`LienAdresse`,
 *    extrait d'`AdresseCliquable` : il n'y en a plus qu'un) ;
 * §2 le soulignement rose de « Cultures du monde » — le moteur
 *    principal (doigt et web), les deux menus de Ma sélection en web,
 *    et NULLE PART ailleurs ;
 * §3 la photo de fiche pleine page épouse la hauteur visible : la
 *    hauteur libre est MESURÉE (plus aucune constante), et les deux
 *    marges sont égales.
 * ⚠️ UNE SEULE LARGEUR (1440 px), un seul navigateur, aucun banc de
 * régression rejoué ici : c'est la consigne de livraison rapide.
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

const lieux = sansNotes(lire("src/components/BlocLieux.tsx"));
const menu = sansNotes(lire("src/components/MenuDeroulant.tsx"));
const moteur = sansNotes(lire("src/components/MoteurTatouage.tsx"));
const selection = sansNotes(lire("src/components/MenusSelection.tsx"));
const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));

titre("§1 — un seul mécanisme d'adresse, et la fiche d'artiste l'emprunte");
{
  verif(
    "le lien est SORTI d'`AdresseCliquable` : `LienAdresse` le porte " +
      "seul, avec sa fenêtre de verre — plus une seule recopie",
    /function LienAdresse\(/.test(lieux) &&
      /<FenetreAdresse/.test(
        lieux.slice(lieux.indexOf("function LienAdresse("), lieux.indexOf("function AdresseCliquable("))
      ) &&
      //  DEUX `adresseMaps(lieu)` DANS TOUT LE FICHIER, et c'est le
      //  compte juste : celui du lien, celui du bouton « Ouvrir dans
      //  Google Maps » de la fenêtre. Un troisième serait un second
      //  mécanisme.
      (lieux.match(/href=\{adresseMaps\(lieu\)\}/g) ?? []).length === 2
  );
  verif(
    "`AdresseCliquable` consomme `LienAdresse` (le verrou de la " +
      "nº 288-§4 — `lieu && adresse` — est intact au-dessus)",
    /const complete = Boolean\(lieu && adresse\);/.test(lieux) &&
      /<LienAdresse\s+texte=\{adresse\}\s+lieu=\{cliquable \? lieu : null\}/.test(
        lieux.replace(/\s+/g, " ")
      )
  );
  const trois = lieux.slice(
    lieux.indexOf("function TroisLignesDuLieu("),
    lieux.indexOf("export function BlocProfilsArtiste(")
  );
  verif(
    "LA FICHE D'ARTISTE : les DEUX lignes passent par `LienAdresse` — " +
      "la grise (l'adresse) et la blanche quand l'adresse y est montée " +
      "faute de nom",
    /<LienAdresse\s+texte=\{nom\}\s+lieu=\{adresse \? null : lieu\}/.test(
      trois.replace(/\s+/g, " ")
    ) && /<LienAdresse texte=\{adresse\} lieu=\{lieu\}/.test(trois.replace(/\s+/g, " "))
  );
  verif(
    "LES DEUX SEULES EXCEPTIONS, écrites au même endroit : un DOMICILE " +
      "n'expose jamais d'adresse, et une ligne DÉJÀ cliquable vers une " +
      "fiche du site n'en reçoit pas une seconde",
    /sansLien \|\| mode\.genre === "domicile"\s*\? null/.test(
      trois.replace(/\s+/g, " ")
    ) && /<TroisLignesDuLieu mode=\{mode\} sansLien=\{lie\} \/>/.test(lieux)
  );
}

titre("§2 — le trait rose, demandé et jamais posé d'office");
{
  const porte = menu.slice(
    menu.indexOf("function porteSousSection("),
    menu.indexOf("const optionSombre =")
  );
  verif(
    "le trait est FIN (1 px), ROSE au jeton (`decoration-primaire`), " +
      "et il n'est posé que sur DEMANDE (`souligne`)",
    /souligne = false/.test(porte) &&
      /underline decoration-primaire decoration-1 underline-offset-4/.test(porte)
  );
  verif(
    "il ne tient QU'AUX MOTS : un second `span` en ligne le reçoit, " +
      "jamais le `flex-1` qui porte toute la largeur de la ligne",
    /<span className="flex-1">\s*<span/.test(porte)
  );
  verif(
    "LE PANNEAU CLASSIQUE le pose (le moteur au doigt comme au web, " +
      "Ma sélection en web) ; LA FEUILLE GLISSANTE, jamais",
    /porteSousSection\(sousEntete, optionSombre\(OPTION_LISTE\), \{ souligne: familleSoulignee, \}\)/.test(
      menu.replace(/\s+/g, " ")
    ) &&
      /\{ avecPoint: true, sansVoile: true \}/.test(menu) &&
      !/avecPoint: true, sansVoile: true, souligne/.test(menu)
  );
  verif(
    "TROIS APPELANTS, PAS UN DE PLUS : le moteur (web + smartphone) " +
      "et les deux menus de Ma sélection — le formulaire de fiche, le " +
      "formulaire de contact et le menu métier des artisans n'y touchent pas",
    (moteur.match(/familleSoulignee/g) ?? []).length === 2 &&
      (selection.match(/familleSoulignee/g) ?? []).length === 1 &&
      [
        "src/components/FormulaireFiche.tsx",
        "src/components/FormulaireContact.tsx",
        "src/components/ChampMetier.tsx",
        "src/components/BlocPortfolio.tsx",
      ].every((chemin) => !/familleSoulignee/.test(lire(chemin)))
  );
  verif(
    "Ma sélection ne le pose qu'en WEB, et ce n'est pas une condition " +
      "à tenir : au doigt cette page ouvre sa FEUILLE (`feuilleMobile`), " +
      "qui ne pose jamais le trait",
    /feuilleMobile/.test(selection) && !/feuilleMobile/.test(moteur)
  );
}

titre("§3 — la hauteur libre est mesurée, plus jamais devinée");
{
  verif(
    "la largeur DÉCOULE de la mesure (`--photo-hauteur-libre`) ; les " +
      "119 px ne survivent QUE comme repli du tout premier rendu",
    /lg:w-\[calc\(var\(--photo-hauteur-libre,100vh_-_119px\)\*0\.8\)\]/.test(
      fiche
    ) && !/calc\(\(100vh-119px\)\*0\.8\)/.test(fiche)
  );
  verif(
    "LES DEUX NOMBRES SONT LUS, aucun n'est écrit : le haut de la photo " +
      "dans le document, et la marge du bas DÉJÀ ÉCRITE sur la racine",
    /getBoundingClientRect\(\)\.top \+/.test(fiche) &&
      /document\.scrollingElement\?\.scrollTop \?\? 0/.test(fiche) &&
      /getComputedStyle\(racine\)\.paddingBottom/.test(fiche) &&
      /const libre = window\.innerHeight - haut - basEcrit;/.test(fiche) &&
      /data-racine-fiche=""/.test(fiche)
  );
  verif(
    "AUCUNE BOUCLE POSSIBLE : on observe la BARRE, jamais la photo ni " +
      "aucun de ses parents (leur hauteur dépend de la sienne)",
    /const barre = document\.querySelector\("header"\);/.test(fiche) &&
      /observateur\.observe\(barre\)/.test(fiche) &&
      !/observateur\.observe\(zone\)/.test(fiche)
  );
}

titre("vivant (1440 px) — les quatre mesures, et le trait");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  try {
    const contexte = await nav.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await contexte.newPage();

    /* ---------------- §3 — la photo d'une fiche pleine page --------- */
    await page.goto(`${BASE}/tatoueur/typo-sauvage-bordeaux`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForSelector("[data-photo-fiche]", { timeout: 90000 });
    await page.waitForTimeout(2000);
    const geometrie = () =>
      page.evaluate(() => {
        const photo = document
          .querySelector("[data-photo-fiche]")
          .getBoundingClientRect();
        const barre = document.querySelector("header").getBoundingClientRect();
        return {
          ecran: window.innerHeight,
          hauteur: photo.height,
          largeur: photo.width,
          dessus: photo.top - barre.bottom,
          dessous: window.innerHeight - photo.bottom,
        };
      });
    const m = await geometrie();
    verif(
      "LES DEUX MARGES SONT ÉGALES — celle du bas était DÉJÀ ÉCRITE " +
        "(`lg:pb-5`, la jumelle de `lg:pt-5`) : l'élargissement la mangeait",
      Math.abs(m.dessus - m.dessous) < 1,
      `dessus ${m.dessus.toFixed(1)} · dessous ${m.dessous.toFixed(1)}`
    );
    verif(
      "LA SOMME NE DÉPASSE PAS L'ÉCRAN : barre + marge + photo + marge",
      m.hauteur + m.dessus + m.dessous <= m.ecran,
      `écran ${m.ecran} · cadre ${m.largeur.toFixed(1)}×${m.hauteur.toFixed(1)}`
    );
    verif(
      "et le format 4:5 est intact — la largeur suit la hauteur",
      Math.abs(m.largeur - m.hauteur * 0.8) < 1.5,
      `${m.largeur.toFixed(1)} pour ${(m.hauteur * 0.8).toFixed(1)} attendus`
    );

    //  LE CAS QUI CASSAIT : « Mon portfolio » pose la fiche DANS
    //  l'espace tatoueur, qui a son propre bandeau — il y a bien plus
    //  que 119 px au-dessus de la photo. On le simule en épaississant
    //  ce qui la surmonte : la mesure doit suivre, la constante ne le
    //  pouvait pas.
    await page.evaluate(() => {
      const cale = document.createElement("div");
      cale.style.height = "160px";
      document.querySelector("header").appendChild(cale);
    });
    await page.waitForTimeout(600);
    const apres = await geometrie();
    verif(
      "160 px de plus AU-DESSUS de la photo : le cadre en rend 160 — " +
        "la mesure suit ce que la constante ne voyait pas",
      Math.abs(m.hauteur - apres.hauteur - 160) < 1.5,
      `${m.hauteur.toFixed(1)} → ${apres.hauteur.toFixed(1)}`
    );
    verif(
      "…et les deux marges restent égales, sans débordement",
      Math.abs(apres.dessus - apres.dessous) < 1 &&
        apres.hauteur + apres.dessus + apres.dessous <= apres.ecran,
      `dessus ${apres.dessus.toFixed(1)} · dessous ${apres.dessous.toFixed(1)}`
    );

    /* ---------------- §1 — l'adresse de la fiche d'artiste ---------- */
    await page.goto(`${BASE}/tatoueur/typo-sauvage-bordeaux`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForTimeout(2000);
    const adresse = await page.evaluate(() => {
      const lien = [...document.querySelectorAll("li a")].find((a) =>
        (a.getAttribute("href") ?? "").startsWith("https://www.google.com/maps")
      );
      if (!lien) return null;
      const mot = lien.querySelector("span");
      return {
        texte: (mot?.textContent ?? "").trim(),
        href: lien.getAttribute("href"),
        cible: lien.getAttribute("target"),
        //  Le trait ne s'allume qu'au survol : au repos, du texte nu.
        traitAuRepos: getComputedStyle(mot).textDecorationLine,
      };
    });
    verif(
      "LE LIEU SAISI À LA MAIN : l'adresse est un lien Google Maps, " +
        "nouvel onglet — elle n'est plus du texte mort",
      adresse !== null &&
        adresse.cible === "_blank" &&
        decodeURIComponent(adresse.href).includes(adresse.texte.split(",")[0]),
      adresse ? `« ${adresse.texte} »` : "aucun lien trouvé"
    );
    verif(
      "et elle garde l'écriture du site : AUCUN trait au repos " +
        "(il n'apparaît qu'au survol — `SOULIGNEMENT_LIEN`)",
      adresse !== null && adresse.traitAuRepos === "none"
    );

    await page.goto(`${BASE}/tatoueur/camille-fauve-paris-18e`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForTimeout(2000);
    const lie = await page.evaluate(() => {
      const ligne = [...document.querySelectorAll("li")].find((n) =>
        /Résident du salon/i.test(n.textContent ?? "")
      );
      const liens = [...ligne.querySelectorAll("a")].map((a) =>
        a.getAttribute("href")
      );
      return { liens, texte: (ligne.textContent ?? "").replace(/\s+/g, " ") };
    });
    verif(
      "LE LIEU QUI A SA FICHE ne reçoit PAS un second lien : la ligne " +
        "entière mène à sa fiche, et l'adresse s'y clique — jamais " +
        "« encadré ET souligné », jamais un `<a>` dans un `<a>`",
      lie.liens.length === 1 && lie.liens[0].startsWith("/tatoueur/"),
      lie.liens.join(" · ")
    );

    /* ---------------- §2 — le trait rose, au pixel ------------------ */
    await page.goto(`${BASE}/`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForTimeout(2500);
    await page.locator('button[aria-label="Explorer"]').first().click();
    await page.waitForTimeout(800);
    await page.locator('[role="listbox"] button').first().click();
    await page.waitForTimeout(700);
    const trait = await page.evaluate(() => {
      const porte = document.querySelector(
        '[data-sous-porte="Cultures du monde"]'
      );
      const mot = porte.querySelector("[data-porte-soulignee]");
      const style = getComputedStyle(mot);
      return {
        texte: mot.textContent,
        ligne: style.textDecorationLine,
        couleur: style.textDecorationColor,
        epaisseur: style.textDecorationThickness,
        largeurMot: mot.getBoundingClientRect().width,
        largeurLigne: porte.getBoundingClientRect().width,
        combien: document.querySelectorAll(
          '[role="listbox"] [data-porte-soulignee]'
        ).length,
      };
    });
    verif(
      "MOTEUR PRINCIPAL : « Cultures du monde » porte un trait FIN " +
        "(1 px) et ROSE `#EE3D6F` — le libellé est celui du code, il " +
        "n'a pas été réécrit",
      trait.texte === "Cultures du monde" &&
        trait.ligne === "underline" &&
        trait.couleur === "rgb(238, 61, 111)" &&
        trait.epaisseur === "1px",
      `${trait.couleur} · ${trait.epaisseur}`
    );
    verif(
      "le trait s'arrête AUX MOTS — il ne barre pas la ligne entière " +
        "(le chevron rose reste à sa droite, seul)",
      trait.largeurMot < trait.largeurLigne - 40,
      `mot ${trait.largeurMot.toFixed(0)} px · ligne ${trait.largeurLigne.toFixed(0)} px`
    );
    verif(
      "UNE SEULE entrée soulignée dans tout le panneau",
      trait.combien === 1,
      `${trait.combien}`
    );
  } finally {
    await nav.close();
  }
}

nonJoue(
  "§2 en vivant sur « Ma sélection » et sur la version smartphone",
  "les deux menus de Ma sélection ne s'affichent qu'avec des suivis " +
    "ou des favoris enregistrés — donc une session, hors de portée " +
    "d'ici ; et le panneau du moteur AU DOIGT est le MÊME code que " +
    "celui mesuré ci-dessus (ce menu-là n'a pas de branche « feuille »), " +
    "vérifié à la source"
);
nonJoue(
  "§3 sur la vraie page « Mon portfolio » (l'aperçu de l'espace tatoueur)",
  "elle demande une session ; le banc simule à sa place ce qui la " +
    "distingue — 160 px de plus au-dessus de la photo — et montre que " +
    "la mesure les rend"
);

process.exit(bilan());
