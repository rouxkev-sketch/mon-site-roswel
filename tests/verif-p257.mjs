/**
 * BANC DE LA PASSE Nº 257
 * ==================================================================
 * §1 sur « Suivis », le menu ne se divise plus : aucune porte
 *    Réalisations / Flashs, la liste des styles seule — familles en
 *    sous-porte (« Cultures du monde ») — précédée de « Tous les
 *    styles » (le mot retenu, celui de `libelleStyleChoisi`) ; sur
 *    « Favoris », les deux portes restent ; le libellé du champ est
 *    juste dans les deux modes, à l'ouverture comme après un choix ;
 * §2 la mise en page est MÉMORISÉE (cookie `yf_texte`, le mécanisme de
 *    la nº 226) et lue par le serveur : la première image peinte est
 *    déjà la bonne, aucun transitoire, `scrollY` inchangé ; elle
 *    survit à un aller-retour et à un rechargement complet.
 *
 * ⚠️ LES RÈGLES DU §1 SONT ÉPROUVÉES PAR LE HARNAIS DES VRAIS MODULES
 * (regles-p257.harnais.mjs — jamais une réécriture), et la mécanique
 * de la sous-porte par LES PRÉDICATS EXTRAITS de MenuDeroulant,
 * rejoués. « Ma sélection » vivante exige une session : dit NON JOUÉ.
 * Le §2 s'éprouve VIVANT sur l'accueil, aux deux largeurs.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : ce banc ne dit rien de Safari.
 */
import { execFileSync } from "node:child_process";
import {
  BASE,
  bilan,
  chromium,
  lire,
  nonJoue,
  titre,
  verif,
} from "./commun-verif.mjs";

const ouvrirA = async (largeur, chemin = "/", options = {}) => {
  const mobile = options.mobile ?? largeur < 1024;
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({
    viewport: { width: largeur, height: mobile ? 844 : 950 },
    ...(mobile ? { isMobile: true, hasTouch: true } : {}),
  });
  const page = await contexte.newPage();
  await page.goto(`${BASE}${chemin}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2000);
  return { contexte, page };
};

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/* ==================================================================
 * §1 — LES RÈGLES, PAR LE HARNAIS DES VRAIS MODULES
 * ================================================================== */
titre("§1 — le harnais des vrais modules : les deux menus, deux formes");
const R = JSON.parse(
  execFileSync(
    process.execPath,
    ["--experimental-strip-types", "tests/regles-p257.harnais.mjs"],
    { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  )
);
{
  verif(
    "le menu des suivis n'a AUCUNE porte Réalisations / Flashs",
    R.entreesSuivis.length > 0 &&
      R.entreesSuivis.every((entree) => entree.groupe === undefined) &&
      R.entreesSuivis.every(
        (entree) => !/^(tatouage|flash)(:|$)/.test(entree.value)
      ),
    `${R.entreesSuivis.length} entrées, aucun groupe`
  );
  verif(
    "il contient LES STYLES, familles en sous-porte (« Cultures du monde »)",
    R.entreesSuivis.some(
      (entree) =>
        entree.value === "maori" && entree.sousGroupe === "Cultures du monde"
    ) && R.entreesSuivis.some((entree) => entree.value === "realisme"),
    R.entreesSuivis.map((entree) => entree.value || "(tous)").join(" · ")
  );
  verif(
    "sa tête est « Tous les styles » — le mot de `libelleStyleChoisi`, pas un neuf",
    R.entreesSuivis[0].value === "" &&
      R.entreesSuivis[0].label === "Tous les styles" &&
      /return style \? libelleStyle\(style\) : "Tous les styles";/.test(
        lire("src/components/MoteurTatouage.tsx")
      ),
    `« ${R.entreesSuivis[0].label} » (${R.entreesSuivis[0].compte} artistes)`
  );
  verif(
    "un artiste compte UNE fois par style, toutes catégories confondues",
    //  « huit » a du maori réalisé ET en flash : compte 1 ; le
    //  réalisme est chez « huit » et « deux » : compte 2.
    R.entreesSuivis.find((entree) => entree.value === "maori")?.compte === 1 &&
      R.entreesSuivis.find((entree) => entree.value === "realisme")?.compte === 2
  );
  verif(
    "sur « Favoris », les deux portes restent telles quelles",
    R.entreesFavoris.some(
      (entree) => entree.groupe === "Réalisations" && entree.value === "tatouage"
    ) &&
      R.entreesFavoris.some(
        (entree) => entree.groupe === "Flashs" && entree.value === "flash"
      ) &&
      R.entreesFavoris.some((entree) => entree.sousGroupe === "Cultures du monde")
  );
  verif(
    "aucun suivi → aucun menu (jamais une liste morte)",
    Array.isArray(R.entreesVides) && R.entreesVides.length === 0
  );
  verif(
    "l'adresse : sur « suivis » le reste est UN STYLE — l'ancienne forme retombe",
    R.adresses.suivisStyle.style === "maori" &&
      R.adresses.suivisStyle.nature === "" &&
      R.adresses.suivisNu.style === "" &&
      R.adresses.suivisCouple.style === "" &&
      R.adresses.suivisStyleInconnu.style === "" &&
      R.adresses.favorisCouple.nature === "flash" &&
      R.adresses.favorisCouple.style === "maori",
    JSON.stringify(R.adresses.suivisStyle)
  );
  verif(
    "la valeur du champ suit le menu : le style seul, ou le couple",
    R.valeurs.suivisMaori === "maori" &&
      R.valeurs.favorisFlashMaori === "flash:maori"
  );
}

titre("§1 — à la source : la page, le champ, le sous-titre");
{
  const pageFavoris = lire("src/app/(tatouage)/mes-favoris/page.tsx");
  const menus = sansNotes(lire("src/components/MenusSelection.tsx"));
  const corps = sansNotes(lire("src/components/PageFavoris.tsx"));
  verif(
    "la page sert `entreesDesStyles` aux suivis, `entreesDuFiltre` aux favoris",
    /entreesDuFiltre\(comptesDesFavoris\(photos\)\)/.test(pageFavoris) &&
      /entreesDesStyles\(comptesDesSuivis\(suivis\)\)/.test(pageFavoris)
  );
  verif(
    "le champ des suivis dit le style, « Tous les styles » à l'ouverture",
    /if \(choix\.menu === MENU_SUIVIS\) return libelleStyleChoisi\(choix\.style\);/.test(
      menus
    )
  );
  verif(
    "le sous-titre de la page lit LA MÊME écriture que le champ (libelleDuChoix)",
    /export function libelleDuChoix/.test(menus) &&
      /sousTitre=\{libelleDuChoix\(choix\) \|\| null\}/.test(corps) &&
      !/libelleExplorer/.test(corps)
  );
}

titre("§1 — la sous-porte SANS porte parente : les prédicats, rejoués");
{
  //  LES PRÉDICATS DE MenuDeroulant, EXTRAITS du fichier livré — la
  //  mécanique même qui décidera des lignes visibles dans la feuille
  //  et le panneau, rejouée sur les entrées calculées par le harnais.
  const menu = lire("src/components/MenuDeroulant.tsx");
  const texteOptionVisible = menu.match(
    /const optionVisible = \(option: OptionMenu\) => \{([\s\S]*?)\};/
  )?.[1];
  const texteSousEntete = menu.match(
    /const sousEnteteVisible = \(option: OptionMenu\) =>([\s\S]*?);/
  )?.[1];
  const fabrique = (corpsFonction, expression) =>
    new Function(
      "option",
      "repliable",
      "groupeDeplie",
      "sousGroupeDeplie",
      expression ? `return (${corpsFonction});` : corpsFonction
    );
  const optionVisible = fabrique(texteOptionVisible, false);
  const sousEnteteVisible = fabrique(texteSousEntete, true);
  const maori = R.entreesSuivis.find((entree) => entree.value === "maori");
  verif(
    "la PORTE de la famille se voit sans aucun groupe parent",
    Boolean(texteSousEntete) &&
      sousEnteteVisible(maori, true, null, null) === true
  );
  verif(
    "fermée, la famille cache ses styles ; ouverte, elle les montre",
    optionVisible(maori, true, null, null) === false &&
      optionVisible(maori, true, null, "Cultures du monde") === true
  );
  verif(
    "les styles isolés, eux, se voient toujours",
    optionVisible(
      R.entreesSuivis.find((entree) => entree.value === "realisme"),
      true,
      null,
      null
    ) === true
  );
}

/* ==================================================================
 * §2 — LA MISE EN PAGE MÉMORISÉE : LA SOURCE
 * ================================================================== */
titre("§2 — à la source : le cookie, le mécanisme de la nº 226, une écriture");
{
  const magasin = lire("src/lib/vue-phototheque.ts");
  const magasinNu = sansNotes(magasin);
  const colonnes = lire("src/lib/colonnes-mosaique.ts");
  const script = lire("src/lib/script-avant-peinture.ts");
  const accueil = lire("src/app/(tatouage)/page.tsx");
  const selection = lire("src/app/(tatouage)/mes-favoris/page.tsx");
  verif(
    "la préférence vit dans un cookie (`yf_texte`), plus dans le sessionStorage",
    /COOKIE_TEXTE = "yf_texte"/.test(magasin) &&
      /document\.cookie = `\$\{COOKIE_TEXTE\}=/.test(magasin) &&
      !/sessionStorage/.test(magasinNu)
  );
  verif(
    "la politique du cookie est ÉCRITE UNE FOIS (le suffixe de la nº 226, partagé)",
    /SUFFIXE_COOKIE_AFFICHAGE = ";path=\/;max-age=31536000;samesite=lax"/.test(
      colonnes
    ) &&
      /SUFFIXE_COOKIE_AFFICHAGE/.test(script) &&
      /SUFFIXE_COOKIE_AFFICHAGE/.test(magasin) &&
      //  Le littéral n'existe nulle part ailleurs.
      !/max-age=31536000/.test(sansNotes(script)) &&
      !/max-age=31536000/.test(magasinNu)
  );
  verif(
    "le serveur de l'accueil lit le cookie — et L'ADRESSE L'EMPORTE toujours",
    /params\.texte === undefined\s*\?\s*phototequeDuCookie\(/.test(accueil) &&
      /params\.texte === "sans"/.test(accueil)
  );
  verif(
    "« Ma sélection » naît elle aussi dans le bon état (le fournisseur servi)",
    /FournisseurAffichageServi/.test(selection) &&
      /phototequeDuCookie\(/.test(selection) &&
      /export function FournisseurAffichageServi/.test(
        lire("src/components/AffichageMosaique.tsx")
      )
  );
  verif(
    "le magasin lit l'adresse D'ABORD, le cookie ENSUITE — jamais l'inverse",
    /valeur = depuisLAdresse\(\) \?\? memorisee\(\) \?\? false;/.test(magasin) &&
      /if \(!parametres\.has\(PARAMETRE_TEXTE\)\) return null;/.test(magasin)
  );
}

/* ==================================================================
 * §2 — VIVANT : le choix survit, la première image est la bonne
 * ================================================================== */
for (const largeur of [390, 1440]) {
  titre(`§2 — la mise en page mémorisée, VIVANTE (${largeur} px)`);
  const { contexte, page } = await ouvrirA(largeur, "/");
  try {
    /** L'ÉTAT DU DOM : combien de cartes, et combien de liens-couvercle
        (« Voir la fiche de… » n'existe QUE dans la vue photothèque). */
    const etatDuDom = () =>
      page.evaluate(() => ({
        cartes: document.querySelectorAll("[data-carte]").length,
        couvercles: document.querySelectorAll('a[aria-label^="Voir la fiche de"]')
          .length,
        y: Math.round(window.scrollY),
      }));

    //  1. LE CHOIX, PAR LE VRAI GESTE : l'icône de la barre.
    const icone = page.locator("[data-bouton-phototheque]:visible").first();
    await icone.waitFor({ state: "visible", timeout: 15000 });
    await icone.click();
    await page.waitForTimeout(800);
    const cookie = await page.evaluate(() =>
      document.cookie.match(/yf_texte=(\w+)/)?.[1] ?? "(absent)"
    );
    verif(
      `${largeur} px : le choix écrit le cookie (yf_texte=sans)`,
      cookie === "sans",
      `yf_texte=${cookie}`
    );

    //  2. RETOUR SUR L'ACCUEIL PAR ADRESSE NUE — le cas du relevé.
    //  LA PREMIÈRE IMAGE PEINTE : le HTML de la réponse elle-même,
    //  avant qu'une ligne de JavaScript n'ait tourné.
    const reponse = await page.goto(`${BASE}/`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    const html = await reponse.text();
    const dansLeHtml = (html.match(/aria-label="Voir la fiche de/g) ?? [])
      .length;
    const auChargement = await etatDuDom();
    await page.waitForTimeout(1500);
    const apresHydratation = await etatDuDom();
    verif(
      `${largeur} px : le HTML SERVI est déjà sans texte (adresse nue, cookie lu)`,
      dansLeHtml > 0,
      `${dansLeHtml} carte(s) en photothèque dans la réponse serveur`
    );
    verif(
      `${largeur} px : AUCUN transitoire — l'état d'arrivée est l'état final`,
      auChargement.cartes > 0 &&
        auChargement.couvercles === auChargement.cartes &&
        apresHydratation.couvercles === apresHydratation.cartes &&
        apresHydratation.cartes === auChargement.cartes,
      `chargement ${auChargement.couvercles}/${auChargement.cartes} · +1,5 s ${apresHydratation.couvercles}/${apresHydratation.cartes}`
    );
    verif(
      `${largeur} px : scrollY inchangé au chargement et une seconde après`,
      auChargement.y === 0 && apresHydratation.y === 0,
      `${auChargement.y} → ${apresHydratation.y}`
    );

    //  3. LE RECHARGEMENT COMPLET.
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const apresRechargement = await etatDuDom();
    verif(
      `${largeur} px : la préférence survit au rechargement complet`,
      apresRechargement.cartes > 0 &&
        apresRechargement.couvercles === apresRechargement.cartes &&
        apresRechargement.y === 0,
      `${apresRechargement.couvercles}/${apresRechargement.cartes} · scrollY ${apresRechargement.y}`
    );

    //  4. L'ALLER-RETOUR VERS UNE FICHE.
    await page.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(800);
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const auRetour = await etatDuDom();
    verif(
      `${largeur} px : elle survit à l'aller-retour vers une fiche`,
      auRetour.cartes > 0 && auRetour.couvercles === auRetour.cartes,
      `${auRetour.couvercles}/${auRetour.cartes}`
    );

    //  5. LE CHEMIN INVERSE : re-choisir le texte, adresse nue → texte.
    const iconeRetour = page.locator("[data-bouton-phototheque]:visible").first();
    await iconeRetour.click();
    await page.waitForTimeout(800);
    const reponseAvec = await page.goto(`${BASE}/`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    const htmlAvec = await reponseAvec.text();
    verif(
      `${largeur} px : le retour au texte est mémorisé pareil (cookie « avec »)`,
      (htmlAvec.match(/aria-label="Voir la fiche de/g) ?? []).length === 0 &&
        (await page.evaluate(
          () => document.cookie.match(/yf_texte=(\w+)/)?.[1]
        )) === "avec"
    );
  } catch (erreur) {
    nonJoue(`§2 (${largeur} px)`, String(erreur).slice(0, 90));
  }
  await contexte.close();
}

nonJoue(
  "« Ma sélection » vivante",
  "la page exige une session (base hors de portée) : les règles du menu " +
    "des suivis sont éprouvées par le harnais des VRAIS modules, la " +
    "mécanique des sous-portes par les prédicats extraits de MenuDeroulant " +
    "et rejoués, la naissance dans le bon état par la source (le " +
    "fournisseur servi, le même contexte que la mosaïque) — et le §2 " +
    "vivant est éprouvé sur l'accueil, qui partage cookie, magasin et " +
    "cartes"
);

process.exit(bilan());
