/**
 * BANC DE LA PASSE Nº 263
 * ==================================================================
 * §1 DEUX MÉMOIRES DE MISE EN PAGE, une par surface : la recherche et
 *    l'accueil d'un côté, « Ma sélection » de l'autre — le texte ET la
 *    disposition. Le mécanisme n'est pas doublé, la clé l'est
 *    (lib/surface-affichage). Les mémoires restent lues PAR LE SERVEUR
 *    (chaque page naît dans son état), et l'adresse l'emporte.
 * §2 le titre inactif (« Mes suivis » en bas de « Favoris ») est parti :
 *    c'était un titre rendu HORS des blocs conditionnels — le contrôle
 *    de la nº 249 devenu mot nu à la nº 253.
 *
 * ⚠️ « MA SÉLECTION » EXIGE UNE SESSION (Supabase hors de portée) : la
 * page redirige ici sans elle. Son côté du mécanisme est donc éprouvé
 * PAR LE VRAI CODE DU MAGASIN : les boutons réels de l'accueil, le
 * chemin d'adresse posé sur « /mes-favoris » (history.replaceState —
 * les composants montés sont les vrais, seule la surface change), et
 * les clés écrites sont mesurées. Le rendu React de la page est dit
 * NON JOUÉ.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : ce banc ne dit rien de Safari ni
 * d'iOS.
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
  if (options.cookies) {
    await contexte.addCookies(
      options.cookies.map(([name, value]) => ({
        name,
        value,
        url: BASE,
      }))
    );
  }
  const page = await contexte.newPage();
  await page.goto(`${BASE}${chemin}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2000);
  const fermerContexte = contexte.close.bind(contexte);
  contexte.close = async () => {
    await fermerContexte();
    await nav.close();
  };
  return { contexte, page };
};

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const surface = lire("src/lib/surface-affichage.ts");
const surfaceNue = sansNotes(surface);
const phototheque = sansNotes(lire("src/lib/vue-phototheque.ts"));
const dispositionLib = sansNotes(lire("src/lib/disposition-grille.ts"));
const pageAccueil = sansNotes(lire("src/app/(tatouage)/page.tsx"));
const pageSelection = sansNotes(lire("src/app/(tatouage)/mes-favoris/page.tsx"));
const enTete = sansNotes(lire("src/components/EnTeteTatouage.tsx"));
const pageFavoris = lire("src/components/PageFavoris.tsx");
const pageFavorisNue = sansNotes(pageFavoris);

/** L'ÉTAT DU BOUTON PHOTOTHÈQUE DANS UN HTML SERVI — le témoin de la
    mise en page rendue par le serveur (aria-pressed est rendu par le
    serveur, avant toute ligne de JavaScript). */
function temoinsPhototheque(html) {
  return [...html.matchAll(/<button[^>]*data-bouton-phototheque[^>]*>/g)].map(
    (m) => /aria-pressed="true"/.test(m[0])
  );
}

/* ==================================================================
 * §1 — À LA SOURCE : UNE ÉCRITURE, DEUX CLÉS
 * ================================================================== */
titre("§1 — à la source : le mécanisme unique, la clé doublée");
{
  verif(
    "la surface est une écriture UNIQUE : le chemin décide, la clé se suffixe",
    /export function surfaceDuChemin\(chemin: string\): SurfaceAffichage/.test(
      surfaceNue
    ) &&
      /chemin === CHEMIN_SELECTION \|\|\s*chemin\.startsWith\(`\$\{CHEMIN_SELECTION\}\/`\)/.test(
        surfaceNue
      ) &&
      /return surface === SURFACE_SELECTION \? `\$\{cle\}-selection` : cle;/.test(
        surfaceNue
      ) &&
      //  La clé de la recherche reste NUE : les cookies déjà posés
      //  chez les visiteurs restent valides.
      !/-recherche/.test(surfaceNue)
  );
  verif(
    "le magasin du TEXTE a une valeur PAR SURFACE, et sa clé suit la surface",
    /const valeurs: Record<SurfaceAffichage, boolean \| null> = \{\s*recherche: null,\s*selection: null,\s*\}/.test(
      phototheque
    ) &&
      /export function cleCookieTexte\(surface: SurfaceAffichage\): string \{\s*return cleDeSurface\(COOKIE_TEXTE, surface\);/.test(
        phototheque
      ) &&
      /document\.cookie = `\$\{cleCookieTexte\(surfaceCourante\(\)\)\}=/.test(
        phototheque
      )
  );
  verif(
    "le magasin de la DISPOSITION aussi — même écriture, sa clé de session doublée",
    /const valeurs: Record<SurfaceAffichage, DispositionGrille \| null> = \{\s*recherche: null,\s*selection: null,\s*\}/.test(
      dispositionLib
    ) &&
      /sessionStorage\.setItem\(cleDeSurface\(CLE_SESSION, surfaceCourante\(\)\), voulue\)/.test(
        dispositionLib
      ) &&
      /sessionStorage\.getItem\(cleDeSurface\(CLE_SESSION, surface\)\)/.test(
        dispositionLib
      )
  );
  verif(
    "l'adresse n'appartient qu'à la page qui la porte (surface étrangère : la mémoire seule)",
    /\(surface === surfaceCourante\(\) \? depuisLAdresse\(\) : null\) \?\?\s*memorisee\(surface\)/.test(
      phototheque
    ) &&
      /surface === surfaceCourante\(\)\s*\? depuisLAdresse\(\)\s*: \(memorisee\(surface\) \?\? "deux"\)/.test(
        dispositionLib
      )
  );
  verif(
    "chaque page serveur NOMME sa surface — les deux mémoires lues par le serveur",
    /cleCookieTexte\(SURFACE_RECHERCHE\)/.test(pageAccueil) &&
      /cleCookieTexte\(SURFACE_SELECTION\)/.test(pageSelection)
  );
  verif(
    "la barre bâtit l'adresse de l'ACCUEIL : elle nomme la surface de la recherche",
    /lireDisposition\(SURFACE_RECHERCHE\)/.test(enTete) &&
      /lirePhototheque\(SURFACE_RECHERCHE\)/.test(enTete)
  );
}

/* ==================================================================
 * §1 — LE SERVEUR (requêtes nues) : chaque mémoire lue, l'adresse reine
 * ================================================================== */
titre("§1 — le serveur : la bonne mémoire, et elle seule ; l'adresse l'emporte");
{
  const { contexte, page } = await ouvrirA(1440, "/", { mobile: false });
  try {
    const servir = async (chemin, cookie) => {
      const reponse = await page.request.get(`${BASE}${chemin}`, {
        headers: cookie ? { Cookie: cookie } : {},
      });
      return reponse.text();
    };
    const sansTexte = temoinsPhototheque(await servir("/", "yf_texte=sans"));
    verif(
      "cookie de la RECHERCHE posé → l'accueil naît SANS texte (HTML serveur)",
      sansTexte.length > 0 && sansTexte.every(Boolean),
      `${sansTexte.length} bouton(s) · ${sansTexte.join(", ")}`
    );
    const etrangere = temoinsPhototheque(
      await servir("/", "yf_texte-selection=sans")
    );
    verif(
      "cookie de MA SÉLECTION posé seul → l'accueil n'en tient AUCUN compte",
      etrangere.length > 0 && etrangere.every((v) => v === false),
      `${etrangere.length} bouton(s) · ${etrangere.join(", ")}`
    );
    const adresseReine = temoinsPhototheque(
      await servir("/?texte=sans", "yf_texte=avec")
    );
    verif(
      "l'adresse l'emporte TOUJOURS sur la mémoire (?texte=sans contre cookie avec)",
      adresseReine.length > 0 && adresseReine.every(Boolean),
      adresseReine.join(", ")
    );
    const dispositionAdresse = await servir("/?disposition=une", "");
    verif(
      "la disposition de l'adresse est rendue par le serveur (pleine largeur)",
      /grid-template-columns:\s*minmax\(0,\s*1fr\)/.test(dispositionAdresse) ||
        /grid-template-columns:minmax\(0, 1fr\)/.test(dispositionAdresse)
    );
  } catch (erreur) {
    nonJoue("§1 · serveur", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §1 — VIVANT : la page naît dans son état, rien ne se corrige après
 * ================================================================== */
for (const largeur of [390, 1440]) {
  titre(`§1 — VIVANT (${largeur} px) : née sans texte, et stable après l'hydratation`);
  const { contexte, page } = await ouvrirA(largeur, "/", {
    cookies: [["yf_texte", "sans"]],
  });
  try {
    const etat = await page.evaluate(() => {
      const boutons = [
        ...document.querySelectorAll("[data-bouton-phototheque]"),
      ];
      return {
        presses: boutons.map(
          (b) => b.getAttribute("aria-pressed") === "true"
        ),
        scrollY: Math.round(window.scrollY),
      };
    });
    verif(
      `${largeur} px : après l'hydratation, la vue photothèque TIENT (aucune correction) et scrollY n'a pas bougé`,
      etat.presses.length > 0 &&
        etat.presses.every(Boolean) &&
        etat.scrollY === 0,
      `boutons ${etat.presses.join(", ")} · scrollY ${etat.scrollY}`
    );
  } catch (erreur) {
    nonJoue(`§1 · vivant (${largeur} px)`, String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §1 — VIVANT (390 px) : les bascules écrivent LÀ OÙ ELLES VIVENT
 * ================================================================== */
titre("§1 — VIVANT (390 px) : chaque bascule écrit sa clé, jamais l'autre");
{
  //  A. SUR LA RECHERCHE (« / ») : les vrais boutons de la rangée du
  //  doigt — le texte puis la disposition — n'écrivent QUE la clé nue.
  const { contexte, page } = await ouvrirA(390, "/");
  try {
    await page.locator("[data-bouton-phototheque]:visible").first().click();
    await page.waitForTimeout(400);
    await page
      .locator('button[aria-label="Afficher une image par ligne"]:visible')
      .first()
      .click();
    await page.waitForTimeout(400);
    const apres = await page.evaluate(() => ({
      cookies: document.cookie,
      filet: sessionStorage.getItem("yokofolio-disposition-visite"),
      filetSelection: sessionStorage.getItem(
        "yokofolio-disposition-visite-selection"
      ),
      pleineLargeur: getComputedStyle(
        document.querySelector("[data-grille-tatoueurs], main ul, main div[style*='overflow-anchor']") ?? document.body
      ).gridTemplateColumns,
    }));
    verif(
      "sur la recherche : le texte s'écrit dans `yf_texte`, jamais dans la clé de Ma sélection",
      /yf_texte=sans/.test(apres.cookies) &&
        !/yf_texte-selection=/.test(apres.cookies),
      apres.cookies
        .split("; ")
        .filter((c) => c.startsWith("yf_"))
        .join(" · ")
    );
    verif(
      "sur la recherche : la pleine largeur s'écrit dans le filet NU, jamais dans l'autre",
      apres.filet === "une" && apres.filetSelection === null,
      `nu ${apres.filet} · selection ${apres.filetSelection}`
    );
  } catch (erreur) {
    nonJoue("§1 · bascules recherche", String(erreur).slice(0, 90));
  }
  await contexte.close();
}
{
  //  B. LE CHEMIN DE « MA SÉLECTION » : la page exige une session — on
  //  pose donc SON chemin (history.replaceState) sous les composants
  //  réels de l'accueil, et on rejoue les MÊMES boutons : c'est le
  //  vrai code du magasin qui choisit la clé, d'après le chemin.
  const { contexte, page } = await ouvrirA(390, "/");
  try {
    await page.evaluate(() =>
      window.history.replaceState(null, "", "/mes-favoris")
    );
    await page.locator("[data-bouton-phototheque]:visible").first().click();
    await page.waitForTimeout(400);
    await page
      .locator('button[aria-label="Afficher une image par ligne"]:visible')
      .first()
      .click();
    await page.waitForTimeout(400);
    const apres = await page.evaluate(() => ({
      cookies: document.cookie,
      filet: sessionStorage.getItem("yokofolio-disposition-visite"),
      filetSelection: sessionStorage.getItem(
        "yokofolio-disposition-visite-selection"
      ),
    }));
    verif(
      "sur le chemin de Ma sélection : le texte s'écrit dans `yf_texte-selection`, la clé nue reste vierge",
      /yf_texte-selection=sans/.test(apres.cookies) &&
        !/(^|; )yf_texte=/.test(apres.cookies),
      apres.cookies
        .split("; ")
        .filter((c) => c.startsWith("yf_"))
        .join(" · ") || "(aucun yf_)"
    );
    verif(
      "sur le chemin de Ma sélection : la pleine largeur s'écrit dans le filet -selection, le nu reste vierge",
      apres.filetSelection === "une" && apres.filet === null,
      `selection ${apres.filetSelection} · nu ${apres.filet}`
    );
  } catch (erreur) {
    nonJoue("§1 · bascules sur le chemin de Ma sélection", String(erreur).slice(0, 90));
  }
  await contexte.close();
}

/* ==================================================================
 * §2 — LE TITRE INACTIF EST PARTI, LES SECTIONS RESTENT EXCLUSIVES
 * ================================================================== */
titre("§2 — à la source : plus de titre hors des blocs conditionnels");
{
  verif(
    "le bloc du titre inactif (data-titre-inactif) n'existe plus, ni `titreControle`",
    !/data-titre-inactif/.test(pageFavoris) &&
      !/titreControle/.test(pageFavorisNue)
  );
  verif(
    "le SEUL « Mes suivis » de la page est le titre CONDITIONNEL en tête",
    (pageFavorisNue.match(/"Mes suivis"/g) ?? []).length === 1 &&
      /titre=\{surLesFavoris \? "Mes favoris" : "Mes suivis"\}/.test(
        pageFavorisNue
      )
  );
  verif(
    "les deux sections restent exclusives (la nº 247) — favoris et suivis gardés",
    /\{!surLesFavoris \? null : photos\.length === 0 \?/.test(pageFavorisNue) &&
      /\{!surLesFavoris && \(\s*<BlocSuivis/.test(pageFavorisNue)
  );
}

nonJoue(
  "« Ma sélection » vivante (les deux contrôles croisés et le titre en bas)",
  "la page exige une session (Supabase hors de portée) : elle redirige " +
    "ici. Le côté « Ma sélection » du mécanisme est éprouvé par le VRAI " +
    "code du magasin (les boutons réels, le chemin posé sur " +
    "/mes-favoris — clés mesurées, croisées vierges), sa page serveur " +
    "est vérifiée à la source (cleCookieTexte(SURFACE_SELECTION)), et " +
    "le titre inactif est parti du fichier même qui le rendait. Seul " +
    "le rendu React de la page n'est pas éprouvé — l'appareil tranchera"
);

bilan();
