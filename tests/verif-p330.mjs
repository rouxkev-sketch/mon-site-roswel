/**
 * BANC DE LA PASSE Nº 330 — LIVRAISON RAPIDE
 * ==================================================================
 * TROISIÈME ET DERNIÈRE PASSE DE LA RÉPARATION DE LA NAVIGATION SUR
 * SMARTPHONE. Elle finit le C-4 de l'inventaire nº 327 et reprend le
 * §5 de la nº 329, que le propriétaire a vu rater sur son iPhone.
 *
 * §1 — LA REMONTÉE APRÈS UN FILTRE SURVIT AU GEL D'UN PANNEAU. Le
 *      banc de la nº 329 mesurait le MENU du web ; le défaut vit sous
 *      le PANNEAU DU BAS, qui gèle le corps. Ici, on gèle pour de vrai
 *      — avec les fonctions du site, par `?sonde-remontee=1` — et l'on
 *      mesure où la page se pose au dégel. Avec le TÉMOIN inverse :
 *      sans remontée demandée, la position revient (la nº 329-§2 tient).
 * §2 — UNE RECHERCHE OUVRE SA LISTE EN HAUT, et la remontée est posée
 *      par LE GESTE : `DefilementEnHaut` ne regarde toujours que le
 *      CHEMIN — le piège que le propriétaire a interdit d'ouvrir.
 * §3 — LES QUATRE SURFACES DU C-4 posent leur étape d'historique, par
 *      une écriture unique. Une seule est atteignable sans session : la
 *      page de recherche du smartphone, mesurée en vivant.
 * §4 — « MON PORTFOLIO » porte la consigne des liens internes, et
 *      l'écriture qui la pose est unique.
 *
 * ⚠️ TOUT SE JOUE AU DOIGT, À UNE SEULE LARGEUR : 390 × 844, densité 3,
 * `hasTouch` (livraison rapide).
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
import { existsSync } from "node:fs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const FICHE_B = "/tatoueur/nadege-roux-villeurbanne";

const { nav, ctx, page } = await ouvrirLeNavigateur(
  "p330",
  { width: 390, height: 844 },
  { hasTouch: true, isMobile: true, deviceScaleFactor: 3 }
);

/* ==================================================================
 * §1 — LA REMONTÉE SURVIT AU GEL DU PANNEAU DU BAS
 * ================================================================== */
titre("§1 — un filtre remonte la liste, panneau du bas compris");
{
  const filtres = sansNotes(lire("src/lib/filtres-selection.ts"));
  verif(
    "`poserSelection` PASSE PAR L'ÉCRITURE UNIQUE, plus par un défilement nu",
    /ouvrirLaListeEnHaut\(\);/.test(filtres) &&
      !/defilerSansGeste\(/.test(filtres),
    "`ouvrirLaListeEnHaut()` — lib/liste-neuve"
  );
  const neuve = sansNotes(lire("src/lib/liste-neuve.ts"));
  verif(
    "…et cette écriture-là FAIT LES QUATRE GESTES, dans le même appel",
    /oublierRestaurationPosition\(\)/.test(neuve) &&
      /oublierDefilementDe\(/.test(neuve) &&
      /laPositionDuGelRepartDeZero\(\)/.test(neuve) &&
      /defilerSansGeste\(\{ top: 0, left: 0 \}\)/.test(neuve),
    "oublier la demande · oublier la position · dire au gel · défiler"
  );
  verif(
    "…et JAMAIS un `window.scrollTo` nu — la barre y lirait un geste",
    !/window\.scrollTo/.test(neuve),
    "aucun défilement non annoncé dans ce module"
  );
  const gel = sansNotes(lire("src/lib/gel-du-corps.ts"));
  /*  ⚠️ ON LIT LE CORPS DE LA FONCTION, PAS LE FICHIER : `gelerLeCorps`
      touche évidemment `corps.top`, et le chercher dans tout le module
      accuserait le voisin. */
  const depart = gel.indexOf("export function laPositionDuGelRepartDeZero");
  const corpsDeLaFonction =
    depart >= 0 ? gel.slice(depart, gel.indexOf("}", depart) + 1) : "";
  verif(
    "LE GEL SAIT REPARTIR DE ZÉRO, et ne touche ni au corps figé ni au défilement",
    /positionRetenue = 0;/.test(corpsDeLaFonction) &&
      !/corps\.|scrollTo/.test(corpsDeLaFonction),
    "seule la position À RENDRE change — aucun saut sous le panneau"
  );

  /* ---------- EN VIVANT, AVEC LES VRAIES FONCTIONS DU SITE ----------
     La sonde `?sonde-remontee=1` les pose sur `window` : on reproduit
     donc la séquence EXACTE du panneau du bas — geler à 900, poser un
     filtre, refermer — sur une page publique, puisque le seul panneau
     du site vit derrière une session. */
  await page.goto(`${BASE}/?sonde-remontee=1`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const sondePosee = await page.evaluate(() =>
    Boolean(window.__sondeRemontee)
  );
  if (!sondePosee) {
    nonJoue(
      "§1 EN VIVANT",
      "la sonde `?sonde-remontee=1` n'a pas été montée sur la page " +
        "publique : les contrôles de source ci-dessus tiennent, la " +
        "mesure non."
    );
  } else {
    /*  LE TÉMOIN D'ABORD — sans remontée demandée, le dégel rend la
        position. C'est la nº 329-§2, et elle doit rester vraie : sans
        ce contrôle, un « 0 » ne prouverait rien. */
    const temoin = await page.evaluate(async () => {
      window.scrollTo({ top: 900, left: 0, behavior: "instant" });
      await new Promise((r) => requestAnimationFrame(r));
      const degeler = window.__sondeRemontee.geler(window.scrollY);
      const sousLeGel = window.__sondeRemontee.position();
      degeler();
      await new Promise((r) => requestAnimationFrame(r));
      return { sousLeGel, apres: Math.round(window.scrollY) };
    });
    await page.waitForTimeout(300);
    const temoinFinal = await page.evaluate(() => Math.round(window.scrollY));
    verif(
      "TÉMOIN — sans remontée, le dégel REND la position (la nº 329-§2 tient)",
      temoin.sousLeGel >= 890 && temoinFinal >= 890,
      `gelée à ${temoin.sousLeGel} · rendue à ${temoinFinal}`
    );

    const mesure = await page.evaluate(async () => {
      window.scrollTo({ top: 900, left: 0, behavior: "instant" });
      await new Promise((r) => requestAnimationFrame(r));
      //  1. LE PANNEAU S'OUVRE : le corps gèle à la position courante.
      const degeler = window.__sondeRemontee.geler(window.scrollY);
      const gelee = window.__sondeRemontee.position();
      //  2. ON CHOISIT UN FILTRE : l'écriture unique, celle même que
      //     `poserSelection` appelle.
      window.__sondeRemontee.remonter();
      //  3. RIEN N'A BOUGÉ SOUS LE PANNEAU ENCORE OUVERT.
      const corpsEncoreFige = document.body.style.position === "fixed";
      const hautDuCorps = document.body.style.top;
      //  4. LE PANNEAU SE REFERME.
      degeler();
      await new Promise((r) => requestAnimationFrame(r));
      return {
        gelee,
        corpsEncoreFige,
        hautDuCorps,
        apres: Math.round(window.scrollY),
      };
    });
    await page.waitForTimeout(400);
    const finale = await page.evaluate(() => Math.round(window.scrollY));
    verif(
      "LE PANNEAU GÈLE BIEN LA PAGE à l'endroit où on l'a ouvert",
      mesure.gelee >= 890,
      `${mesure.gelee} px sous le gel`
    );
    verif(
      "LA REMONTÉE NE FAIT RIEN SAUTER SOUS LE PANNEAU ENCORE OUVERT",
      mesure.corpsEncoreFige && mesure.hautDuCorps === "-900px",
      `corps toujours figé à ${mesure.hautDuCorps}`
    );
    verif(
      "ET LE PANNEAU REFERMÉ, LA LISTE EST EN HAUT",
      mesure.apres === 0 && finale === 0,
      `${mesure.gelee} px avant le filtre → ${finale} px après`
    );
  }
}

/* ==================================================================
 * §2 — LA RECHERCHE OUVRE SA LISTE EN HAUT
 * ================================================================== */
titre("§2 — une recherche remonte, et le piège reste fermé");
{
  const index = sansNotes(lire("src/components/IndexTatoueurs.tsx"));
  const chercher = index.slice(
    index.indexOf("function chercher("),
    index.indexOf("function voirPlus(")
  );
  verif(
    "`chercher` APPELLE L'ÉCRITURE UNIQUE — la même que le filtre",
    /ouvrirLaListeEnHaut\(\);/.test(chercher),
    "la remontée est posée par LE GESTE, dans la fonction du clic"
  );
  const voirPlus = index.slice(index.indexOf("function voirPlus("));
  verif(
    "…et « VOIR PLUS » NE LA RAPPELLE PAS — la même liste s'allonge par le bas",
    !/ouvrirLaListeEnHaut/.test(voirPlus.slice(0, 400)),
    "on continue de lire là où on est (nº 224-§3)"
  );
  /*  LE PIÈGE QUE LE PROPRIÉTAIRE A INTERDIT D'OUVRIR : rendre
      `DefilementEnHaut` sensible à la REQUÊTE. Un retour arrive lui
      aussi avec une requête — il casserait la nº 329-§2. */
  const defilement = sansNotes(lire("src/components/DefilementEnHaut.tsx"));
  verif(
    "LE PIÈGE RESTE FERMÉ : `DefilementEnHaut` ne dépend QUE du chemin",
    /\}, \[chemin\]\);/.test(defilement) &&
      !/useSearchParams/.test(defilement),
    "aucune requête dans son tableau de dépendances"
  );

  /* ---------- EN VIVANT : la loupe, un style, « Valider ». ---------- */
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.evaluate(() =>
    window.scrollTo({ top: 1200, left: 0, behavior: "instant" })
  );
  await page.waitForTimeout(400);
  /*  ⚠️ UN CRAN DE MOLETTE VERS LE HAUT — LA BARRE DÉPLIE SA RANGÉE.
      Descendue, elle la replie (nº 150-§5) et la pilule de recherche
      n'est plus touchable : c'est le comportement du site, pas un
      défaut du banc. Un vrai doigt fait exactement ce geste avant de
      toucher la loupe. On reste largement en bas de page. */
  await page.mouse.wheel(0, -200);
  await page.waitForTimeout(700);
  const avantRecherche = await page.evaluate(() => Math.round(window.scrollY));
  const loupe = page.locator('button[aria-label^="Rechercher"]').first();
  if ((await loupe.count()) === 0 || avantRecherche < 100) {
    nonJoue(
      "§2 EN VIVANT",
      "la pilule de recherche du doigt n'a pas été trouvée sur l'accueil, " +
        `ou la page n'était pas assez longue pour descendre (${avantRecherche} px). ` +
        "Les contrôles de source ci-dessus tiennent."
    );
  } else {
    await loupe.click();
    await page.waitForTimeout(1000);
    const styles = page.locator('button:has-text("Valider")').first();
    const valider = (await styles.count()) > 0;
    if (!valider) {
      nonJoue(
        "§2 EN VIVANT",
        "le bouton « Valider » de la page de recherche n'a pas été trouvé."
      );
    } else {
      await styles.click();
      await page.waitForTimeout(1400);
      const apres = await page.evaluate(() => Math.round(window.scrollY));
      verif(
        "APRÈS UNE RECHERCHE VALIDÉE, LA LISTE EST EN HAUT",
        apres === 0,
        `${avantRecherche} px avant → ${apres} px après`
      );
    }
  }
}

/* ==================================================================
 * §3 — LES QUATRE SURFACES POSENT LEUR ÉTAPE
 * ================================================================== */
titre("§3 — le retour referme la surface, il ne quitte plus la page");
{
  verif(
    "L'ÉCRITURE EST UNIQUE : `lib/etape-refermable` existe",
    existsSync("/home/user/mon-site-roswel/src/lib/etape-refermable.ts"),
    "`useEtapeQuiSeReferme`"
  );
  const etape = sansNotes(lire("src/lib/etape-refermable.ts"));
  verif(
    "ELLE POSE UNE ÉTAPE SANS ADRESSE — `pushState` à DEUX arguments",
    /window\.history\.pushState\(\s*\{[\s\S]*?\},\s*""\s*\)/.test(etape),
    "l'adresse ne change pas : ces surfaces ne sont pas des pages"
  );
  verif(
    "…et elle RECOPIE L'ÉTAT DE NEXT : les deux étapes décrivent le même arbre",
    /\.\.\.\(\(window\.history\.state as object \| null\) \?\? \{\}\)/.test(
      etape
    ),
    "le routeur n'a rien à refaire en repassant de l'une à l'autre"
  );
  verif(
    "LE RETOUR REFERME, ET NE DÉPILE RIEN — le navigateur l'a déjà fait",
    /popstate", auRetour\)/.test(etape) &&
      !/auRetour[\s\S]{0,200}history\.back/.test(etape),
    "un seul appui par surface, jamais deux"
  );
  verif(
    "LA FERMETURE PAR LA CROIX REPREND SON ÉTAPE — et SEULEMENT la sienne",
    /if \(etat\?\.\[CLE\] !== rang\) return;/.test(etape) &&
      /window\.history\.back\(\);/.test(etape),
    "la marque répond à « cette étape est-elle encore la mienne ? »"
  );
  verif(
    "…ET L'ADRESSE ÉCRITE PENDANT L'OUVERTURE SURVIT — le filtre n'est pas perdu",
    /window\.history\.replaceState\(window\.history\.state, "", adresse\)/.test(
      etape
    ),
    "le panneau de « Ma sélection » écrit son filtre SUR notre étape"
  );
  verif(
    "ELLE NE TOUCHE JAMAIS AU GEL — le compte des surfaces reste équilibré",
    !/gelerLeCorps|corpsGele|positionSousLeGel/.test(etape),
    "chaque surface garde son propre gel, posé et repris par son effet"
  );

  //  LES QUATRE SURFACES L'APPELLENT, ET AUCUNE N'A SA COPIE.
  const surfaces = [
    ["le panneau du bas des menus", "src/components/MenuDeroulant.tsx"],
    ["la page de recherche du smartphone", "src/components/PageRechercheMobile.tsx"],
    ["le menu « Mon espace »", "src/components/MenuEspace.tsx"],
    ["l'administration", "src/components/AdminYokofolio.tsx"],
  ];
  for (const [nom, fichier] of surfaces) {
    const source = sansNotes(lire(fichier));
    verif(
      `${nom} POSE SON ÉTAPE par l'écriture unique`,
      /useEtapeQuiSeReferme\(/.test(source) &&
        !/history\.pushState/.test(source),
      "aucune copie du mécanisme dans ce fichier"
    );
  }

  /* ---------- EN VIVANT : la page de recherche du smartphone ----------
     ⚠️ UN ONGLET NEUF. Le §2 vient de valider une recherche : sa page
     a repris son étape, et l'historique de cet onglet-ci porte encore
     une étape en avant. Compter des étapes là-dessus mesurerait mon
     banc, pas le site. On repart donc d'une pile propre. */
  const page3 = await ctx.newPage();
  await page3.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page3.waitForTimeout(900);
  const longueurAvant = await page3.evaluate(() => history.length);
  const loupe = page3.locator('button[aria-label^="Rechercher"]').first();
  if ((await loupe.count()) === 0) {
    nonJoue("§3 EN VIVANT", "la pilule de recherche n'a pas été trouvée.");
  } else {
    await loupe.click();
    await page3.waitForTimeout(1000);
    const ouverte = await page3.evaluate(() => ({
      longueur: history.length,
      recherche: Boolean(document.documentElement.dataset.recherche),
      chemin: location.pathname,
    }));
    verif(
      "LA PAGE DE RECHERCHE POSE UNE ÉTAPE EN S'OUVRANT",
      ouverte.longueur === longueurAvant + 1 && ouverte.recherche,
      `${longueurAvant} → ${ouverte.longueur} étapes, page à l'écran`
    );
    await page3.goBack({ waitUntil: "commit" });
    await page3.waitForTimeout(1000);
    const apres = await page3.evaluate(() => ({
      recherche: Boolean(document.documentElement.dataset.recherche),
      chemin: location.pathname,
    }));
    verif(
      "UN SEUL APPUI DE RETOUR LA REFERME…",
      apres.recherche === false,
      "la page de recherche n'est plus à l'écran"
    );
    verif(
      "…ET L'ON EST TOUJOURS SUR LA PAGE QU'ON REGARDAIT",
      apres.chemin === "/",
      `chemin : ${apres.chemin} (avant cette passe : on quittait la page)`
    );
    await page3.close();
  }
}

/* ==================================================================
 * §4 — « MON PORTFOLIO » PORTE LA CONSIGNE
 * ================================================================== */
titre("§4 — pas de photo en haut par « Mon portfolio »");
{
  const contenu = lire("src/components/ContenuFiche.tsx");
  verif(
    "L'ÉCRITURE DE LA CONSIGNE EST UNIQUE, et vaut pour N'IMPORTE QUELLE adresse",
    /export function avecConsigneDeLienInterne/.test(contenu) &&
      /return avecConsigneDeLienInterne\(`\/tatoueur\/\$\{slug\}`\);/.test(
        contenu
      ),
    "`adresseDeLienInterne` n'en est plus que le cas particulier"
  );
  const espace = sansNotes(lire("src/components/MenuEspace.tsx"));
  verif(
    "« MON PORTFOLIO » LA PORTE, par cette écriture et pas à la main",
    /href=\{avecConsigneDeLienInterne\(versFiche\("vue=apercu"\)\)\}/.test(
      espace
    ) && !/entree=lien/.test(espace),
    "`avecConsigneDeLienInterne(versFiche(\"vue=apercu\"))`"
  );
  const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));
  verif(
    "L'APERÇU N'EST PLUS EXCLU — c'est la consigne qui décide, dans les deux modes",
    /const sansPhoto = entreeInitiale === ENTREE_LIEN;/.test(fiche),
    "`!apercu &&` a disparu : on arrive bien en aperçu par un lien"
  );
  const formulaire = sansNotes(lire("src/components/FormulaireFiche.tsx"));
  verif(
    "…et l'aperçu LIT LA CONSIGNE PAR `useSearchParams`, jamais par `window.location`",
    /entreeInitiale=\{parametres\.get\("entree"\) \?\? ""\}/.test(formulaire),
    "l'adresse y est juste dès le premier rendu (leçon nº 329-§4)"
  );

  /*  AUCUNE AUTRE ENTRÉE DU MENU NE MÈNE À UN PORTFOLIO : on liste
      TOUTES les destinations du menu et l'on regarde. */
  const destinations = [...espace.matchAll(/href=\{?"?([^"}\n]+)"?\}?/g)]
    .map((m) => m[1])
    .filter((h) => h.startsWith("/") || h.startsWith("avec") || h.startsWith("versFiche"));
  verif(
    "LES AUTRES ENTRÉES DU MENU NE MÈNENT À AUCUN PORTFOLIO",
    destinations.every(
      (h) =>
        //  La seule entrée qui mène à un PORTFOLIO, et elle la porte.
        h.startsWith("avecConsigneDeLienInterne") ||
        //  Les autres mènent à des LISTES ou à des FORMULAIRES, où la
        //  question de la photo du haut ne se pose pas :
        //   · « Ma sélection » — une liste ;
        //   · « Modification » — le formulaire du portfolio ;
        //   · « Sécurité » — les réglages du compte.
        h === "/mes-favoris" ||
        h === "versFiche()" ||
        h === "/devenir-tatoueur/securite"
    ),
    `destinations : ${destinations.join(" · ") || "aucune"}`
  );

  /* ---------- ET LE CHEMIN PUBLIC N'A PAS BOUGÉ ---------- */
  await page.goto(`${BASE}${FICHE_B}?entree=lien`, {
    waitUntil: "networkidle",
  });
  verif(
    "PAR UN LIEN INTERNE, LA PHOTO DU HAUT N'EST TOUJOURS PAS LÀ",
    (await page.evaluate(
      () => document.querySelectorAll("[data-photo-fiche]").length
    )) === 0,
    "le chemin public de la nº 329-§4 est intact"
  );
  await page.goto(`${BASE}${FICHE_B}`, { waitUntil: "networkidle" });
  verif(
    "…et une arrivée ordinaire garde la sienne",
    (await page.evaluate(
      () => document.querySelectorAll("[data-photo-fiche]").length
    )) > 0,
    "la photo est là, comme toujours"
  );
}

nonJoue(
  "§1 ET §3 SUR « MA SÉLECTION » ET LE MENU « MON ESPACE » EN VIVANT",
  "/mes-favoris répond 307 sans une session Supabase signée par le " +
    "serveur, et le menu « Mon espace » n'existe que connecté : ce " +
    "conteneur ne sait fabriquer ni l'une ni l'autre. CE QUI EST " +
    "PROUVÉ QUAND MÊME : le mécanisme du §1 est joué EN VIVANT avec " +
    "les VRAIES fonctions du site (sonde `?sonde-remontee=1`), sur la " +
    "séquence exacte d'un panneau du bas — geler, filtrer, refermer ; " +
    "et les quatre surfaces du §3 passent toutes par la même écriture, " +
    "dont une est mesurée de bout en bout. CE QUI NE L'EST PAS : " +
    "l'assemblage à l'écran de ces deux surfaces-là."
);

nonJoue(
  "§3 SUR L'ADMINISTRATION EN VIVANT",
  "elle exige un compte administrateur. Sa surface est le DÉTAIL " +
    "d'une fiche (`ficheOuverte`), et elle repose sur le MÊME " +
    "mécanisme que les trois autres — un état de composant qui " +
    "remplace ce qu'on regarde sans changer d'adresse : l'écriture " +
    "unique s'y applique telle quelle, rien n'a été improvisé pour " +
    "elle. La SECTION d'administration, elle, n'est pas touchée " +
    "(C-6, réservé à la passe suivante)."
);

nonJoue(
  "WEBKIT",
  "ce conteneur n'a que Chromium. Toutes les mesures ci-dessus valent " +
    "pour Chromium et pour lui seul — ce n'est une preuve ni pour " +
    "Safari, ni pour l'iPhone du propriétaire, qui est justement " +
    "l'appareil où le §1 a été relevé."
);

await bilan(nav);
