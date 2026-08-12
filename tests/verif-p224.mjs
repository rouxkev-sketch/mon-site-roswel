/**
 * LE BANC DE LA PASSE Nº 224 — UNE SEULE LARGEUR (390 px)
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE. Le propriétaire l'a écrit assez de
 * fois : un vert ici n'est PAS une preuve pour son iPhone. Ce banc
 * prouve la MÉCANIQUE — que le code fait ce qu'il annonce — jamais le
 * rendu de WebKit ni le comportement mémoire d'iOS.
 *
 * QUATRE CONTRÔLES, ceux du §6 :
 *   1. la ligne d'un lieu SANS PHOTO s'affiche, avec sa pastille de
 *      44 px portant le glyphe `adresse.png` ;
 *   2. les trois fichiers d'icônes servis sous la photo de profil sont
 *      bien `site.png`, `icone-instagram.png`, `icone-tiktok.png` ;
 *   3. `scrollY` est INCHANGÉ après trois « Voir plus » consécutifs ;
 *   4. à cent cartes, le nombre d'images portant un `src` réel est
 *      BORNÉ — il ne suit pas le nombre de cartes.
 *
 * Il se lance comme les autres :  node tests/verif-p224.mjs
 * (le site doit tourner sur http://localhost:3000).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

/** LA SEULE LARGEUR DE CE BANC — l'iPhone du propriétaire. */
const LARGEUR = 390;
const HAUTEUR = 844;

const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({
  viewport: { width: LARGEUR, height: HAUTEUR },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await contexte.newPage();

/* ==================================================================
 * 1 & 2 — CE QUE LE CODE SERT : les fichiers d'icônes
 * ==================================================================
 * ⚠️ LUS DANS LA SOURCE, pas dans un rendu : la fiche de démonstration
 * n'a ni site ni réseau, et une fiche réelle demande une base. Ce que
 * le banc doit prouver, c'est que le code NE PEUT PAS servir autre
 * chose — et cela se lit à la source, sûrement.
 */
titre("§2 — les trois fichiers d'icônes des liens");
{
  const config = lire("src/config/tatouage.ts");
  const contenu = lire("src/components/ContenuFiche.tsx");
  verif(
    "ICONE_SITE vaut /site.png",
    /ICONE_SITE\s*=\s*"\/site\.png"/.test(config)
  );
  verif(
    "ICONES_RESEAUX.instagram vaut /icone-instagram.png",
    /instagram:\s*"\/icone-instagram\.png"/.test(config)
  );
  verif(
    "ICONES_RESEAUX.tiktok vaut /icone-tiktok.png",
    /tiktok:\s*"\/icone-tiktok\.png"/.test(config)
  );
  verif(
    "les liens n'emploient plus l'icône SVG IconeWorld",
    //  Le nom peut rester dans un COMMENTAIRE (il explique ce qui a
    //  changé) ; ce qui compte, c'est qu'il ne soit plus importé.
    !/^import .*IconeWorld/m.test(contenu)
  );
  verif(
    "la colonne d'icônes reste à 18 px (nº 223)",
    contenu.includes('h-[18px] w-[18px]')
  );
  //  LES TROIS FICHIERS EXISTENT VRAIMENT — un chemin juste vers un
  //  fichier absent servirait une image cassée.
  for (const fichier of ["site.png", "icone-instagram.png", "icone-tiktok.png"]) {
    let present = true;
    try {
      lire(`public/${fichier}`);
    } catch {
      present = false;
    }
    verif(`public/${fichier} existe`, present);
  }
}

titre("§1 — la pastille d'un lieu sans photo");
{
  const bloc = lire("src/components/BlocLieux.tsx");
  verif(
    "la pastille distingue un LIEU d'une PERSONNE",
    /nature:\s*"lieu"\s*\|\s*"personne"/.test(bloc)
  );
  verif(
    "un lieu sans photo porte le glyphe ICONE_ADRESSE",
    bloc.includes("ICONE_ADRESSE") && /nature === "lieu"/.test(bloc)
  );
  verif(
    "une personne sans photo ne porte RIEN (ni icône, ni lettre)",
    /nature === "lieu" \? \([\s\S]{0,400}?\) : null/.test(bloc)
  );
  verif(
    "la pastille garde 44 px",
    bloc.includes("h-11 w-11")
  );
  verif(
    "la ligne d'adresse ne disparaît plus quand la valeur manque",
    !/if \(!valeur\) return null;/.test(bloc)
  );
  verif(
    "le mode « à domicile » prend la photo de profil de l'artiste",
    /mode\.genre === "domicile"[\s\S]{0,80}tatoueur\.photo_profil/.test(bloc)
  );
  verif(
    "un membre d'équipe porte une pastille de personne",
    /<PhotoRonde source=\{membre\.photo\} nature="personne" \/>/.test(bloc)
  );
  verif("public/adresse.png existe", (() => {
    try {
      lire("public/adresse.png");
      return true;
    } catch {
      return false;
    }
  })());
}

/* ==================================================================
 * 3 & 4 — LA MOSAÏQUE : la page ne bouge pas, la mémoire est bornée
 * ================================================================== */
titre("§3 et §4 — « Voir plus » et le coût des cartes");
let accueil = false;
try {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector("[data-carte]", { timeout: 30000 });
  accueil = true;
} catch {
  accueil = false;
}

if (!accueil) {
  nonJoue(
    "§3 et §4",
    "l'accueil n'a servi aucune carte (base injoignable depuis ce banc)"
  );
} else {
  const bouton = page.getByRole("button", { name: /Voir plus de portfolios/ });
  //  ON SE PLACE EN BAS, là où le défaut se voit : c'est de là qu'on
  //  touche le bouton.
  const compteDepart = await page.locator("[data-carte]").count();

  let ecartMax = 0;
  let tours = 0;
  for (let i = 0; i < 3; i += 1) {
    if ((await bouton.count()) === 0) break;
    await bouton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const avant = await page.evaluate(() => Math.round(window.scrollY));
    const cartesAvant = await page.locator("[data-carte]").count();
    await bouton.click();
    //  On attend que les cartes soient arrivées, puis une seconde de
    //  plus — le temps que les images se posent, c'est là que
    //  l'ancrage de défilement se manifesterait.
    await page
      .waitForFunction(
        (n) => document.querySelectorAll("[data-carte]").length > n,
        cartesAvant,
        { timeout: 20000 }
      )
      .catch(() => {});
    await page.waitForTimeout(1200);
    const apres = await page.evaluate(() => Math.round(window.scrollY));
    ecartMax = Math.max(ecartMax, Math.abs(apres - avant));
    tours += 1;
  }

  const cartes = await page.locator("[data-carte]").count();

  /**
   * ⚠️ CE BANC NE PEUT PAS ALLER PLUS LOIN ICI, ET IL LE DIT.
   * ------------------------------------------------------------------
   * La base est hors de portée depuis cet environnement (le domaine
   * Supabase n'est pas dans la liste d'accès) : l'accueil retombe donc
   * sur les DIX-NEUF fiches de DÉMONSTRATION, qui tiennent sur une
   * seule page. Il n'y a ni « Voir plus » à toucher, ni centième carte
   * à mesurer.
   * Plutôt que d'annoncer un vert qui ne prouve rien, les deux
   * contrôles qui demandent un vrai catalogue sont déclarés NON JOUÉS,
   * et les MÉCANIQUES qu'ils défendent sont vérifiées à la source
   * juste en dessous — c'est ce qu'on peut prouver d'ici, et rien de
   * plus. Sur le téléphone du propriétaire, c'est la sonde
   * `?sonde-cartes=1` qui répond.
   */
  if (tours === 0) {
    nonJoue(
      "§3 · scrollY après trois « Voir plus »",
      `catalogue de démonstration — ${cartes} cartes, une seule page, ` +
        "aucun bouton à toucher"
    );
    nonJoue(
      "§4 · images bornées à cent cartes",
      "le même catalogue de démonstration ne dépasse jamais dix-neuf cartes"
    );
  } else {
    verif(
      `scrollY inchangé après ${tours} « Voir plus »`,
      ecartMax === 0,
      `écart maximal ${ecartMax} px`
    );
    verif(
      "des cartes ont bien été ajoutées",
      cartes > compteDepart,
      `${compteDepart} → ${cartes}`
    );
    //  LE COÛT : combien d'images portent une vraie source ? On remonte
    //  en haut, puis on compte — les cartes lointaines ont rendu la
    //  leur.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1500);
    const mesure = await page.evaluate(() => {
      const vraies = [...document.querySelectorAll("img")].filter((image) => {
        const source = image.getAttribute("src") ?? "";
        return source !== "" && !source.startsWith("data:image/gif");
      }).length;
      return { cartes: document.querySelectorAll("[data-carte]").length, vraies };
    });
    verif(
      "le nombre d'images à source réelle est BORNÉ, pas proportionnel",
      mesure.vraies < mesure.cartes,
      `${mesure.vraies} images pour ${mesure.cartes} cartes`
    );
  }

  //  L'OBSERVATEUR DE LA MOSAÏQUE EST UNIQUE — lu à la source : un
  //  navigateur ne rend pas ses observateurs.
  const grille = lire("src/components/GrilleTatoueurs.tsx");
  verif(
    "un seul IntersectionObserver pour toute la mosaïque",
    (grille.match(/new IntersectionObserver/g) ?? []).length === 1
  );
  verif(
    "il se déconnecte au démontage",
    /observateur\.disconnect\(\)/.test(grille)
  );
  verif(
    "l'ancrage de défilement est coupé sur la grille",
    /overflowAnchor: "none"/.test(grille)
  );
  const carte = lire("src/components/CarteTatoueur.tsx");
  verif(
    "chaque carte porte content-visibility: auto",
    carte.includes("[content-visibility:auto]")
  );
  verif(
    "avec une hauteur mémorisée (contain-intrinsic-size: auto)",
    carte.includes("[contain-intrinsic-size:auto_460px]")
  );
}

titre("§5 — la sonde des cartes");
{
  const sonde = lire("src/components/SondeCartes.tsx");
  const journal = lire("src/lib/journal-cartes.ts");
  verif("elle s'arme sur ?sonde-cartes=1", journal.includes('"sonde-cartes"'));
  verif("elle est repliée par défaut", sonde.includes("useSondeRepliee"));
  verif("elle porte COPIER", sonde.includes("BoutonCopierJournal"));
  verif("elle porte ENVOYER", sonde.includes("BoutonEnvoyerJournal"));
  verif(
    "elle relève scrollY avant, après et après 1 s",
    journal.includes("scrollY avant") &&
      journal.includes("scrollY après") &&
      journal.includes("+1 s")
  );
  verif(
    "elle relève cartes, nœuds, images, observateurs et mémoire",
    /cartes \$\{cartes\}/.test(journal) &&
      journal.includes("nœuds") &&
      journal.includes("images avec src") &&
      journal.includes("observateurs") &&
      journal.includes("usedJSHeapSize")
  );
}

await navigateur.close();
bilan();
