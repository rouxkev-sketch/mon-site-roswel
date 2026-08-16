/**
 * BANC DE LA PASSE Nº 304 — LIVRAISON RAPIDE
 * ==================================================================
 *  §1 la fenêtre « Ajouter un style » : verre, filet, chevron rose,
 *     et plus aucun quota de trois demandes ;
 *  §2 un volet unique n'a plus de flèche ;
 *  §3 la photo du haut d'une fiche n'ouvre plus la fenêtre ;
 *  §4 la remontée se pose exactement sous la photo.
 *
 * ⚠️ DEUX PAGES SONT HORS D'ATTEINTE ICI, et le banc le dit : celle du
 * formulaire de portfolio (§1) et « Ma sélection » (§2) exigent une
 * session Supabase validée par le serveur, que ce conteneur ne peut pas
 * signer. Ces deux points sont donc vérifiés À LA SOURCE, au caractère
 * près — et pour le verre, la RÈGLE elle-même est éprouvée en vivant :
 * on pose une plaque `data-verre-fenetre` dans une page et on lit le
 * filtre que le navigateur en tire.
 * ⚠️ LE §4 EST MESURÉ EN VIVANT, au doigt, depuis quatre positions.
 * ⚠️ UNE SEULE FENÊTRE : 390 × 844.
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

const portfolio = sansNotes(lire("src/components/BlocPortfolio.tsx"));
const menu = sansNotes(lire("src/components/MenuDeroulant.tsx"));
const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));
const contenu = sansNotes(lire("src/components/ContenuFiche.tsx"));
const api = sansNotes(lire("src/app/api/tatoueur/suggestion-style/route.ts"));
const css = lire("src/app/globals.css");
//  ⚠️ LES RÈGLES SEULES, SANS LES NOTES : le fichier EXPLIQUE les
//  pièges en toutes lettres (« @supports (backdrop-filter: …) — Safari
//  y répond faux »), et une recherche naïve retrouverait ces
//  explications comme si c'était du code. On enlève donc les
//  commentaires avant de chercher.
const cssRegles = css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Le bloc CSS de la plaque de verre des fenêtres, isolé. */
const blocVerre = (() => {
  const debut = css.indexOf("[data-verre-fenetre] {");
  return css.slice(debut, css.indexOf("}", debut) + 1);
})();
/** La fenêtre « Ajouter un style », isolée du reste du fichier. */
const fenetreStyles = (() => {
  const debut = portfolio.indexOf('aria-label="Ajouter un style"');
  return portfolio.slice(debut, debut + 4000);
})();

const FICHE = "studio-cameleon-bordeaux";

titre("§1-a — les six pièges du verre, un par un");
{
  verif(
    "PIÈGE 1 — AUCUN `@supports` autour de la règle de filtre : Safari " +
      "répond faux et laisse tomber tout le bloc",
    !/@supports/.test(blocVerre) &&
      !/@supports[^{]*backdrop-filter/.test(cssRegles)
  );
  verif(
    "PIÈGE 2 — AUCUN `var()` DANS LE FILTRE : WebKit l'invalide. Les " +
      "deux valeurs sont écrites en clair",
    /-webkit-backdrop-filter: blur\(40px\) saturate\(200%\);/.test(blocVerre) &&
      !/backdrop-filter:[^;]*var\(/.test(cssRegles)
  );
  verif(
    "PIÈGE 3 — RIEN N'EST POSÉ DEPUIS LE CODE : aucun " +
      "`setProperty(\\\"-webkit-backdrop-filter\\\")` nulle part (Chromium " +
      "le laisse tomber en silence). C'est du CSS, donc la question ne " +
      "se pose même pas",
    !/setProperty\(\s*["'`]-webkit-backdrop-filter/.test(
      lire("src/components/BlocPortfolio.tsx")
    ) &&
      !/setProperty\(\s*["'`]-?webkit-backdrop-filter/.test(cssRegles)
  );
  verif(
    "PIÈGE 4 — LES DEUX LIGNES SONT LITTÉRALES, LA PRÉFIXÉE D'ABORD",
    /-webkit-backdrop-filter: blur\(40px\) saturate\(200%\);\s*\n\s*backdrop-filter: blur\(40px\) saturate\(200%\);/.test(
      blocVerre
    )
  );
  verif(
    "PIÈGE 5 — AUCUN FONDU D'OPACITÉ NI TRANSFORMATION SUR LA PLAQUE : " +
      "c'est le défaut de la nº 234, et c'est celui que cette fenêtre " +
      "portait (`opacity-100 transition-opacity starting:opacity-0`). Le " +
      "fondu reste au VOILE, à qui il appartient",
    /data-verre-fenetre=""\n\s*className="relative flex w-full max-w-\[420px\]/.test(
      fenetreStyles
    ) &&
      !/data-verre-fenetre=""[\s\S]{0,400}?(transition-opacity|starting:opacity|translate|scale-)/.test(
        fenetreStyles
      ) &&
      /bg-black\/25[\s\S]{0,120}transition-opacity/.test(fenetreStyles)
  );
  verif(
    "PIÈGE 6 — AUCUN ANCÊTRE NE FABRIQUE UNE RACINE D'ARRIÈRE-PLAN : la " +
      "plaque vit dans un PORTAIL au corps du document, et son seul " +
      "parent ne porte ni opacité, ni filtre, ni masque, ni " +
      "transformation, ni `will-change`, ni `contain`, ni `isolation`",
    /createPortal\(/.test(portfolio) &&
      /className="fixed inset-0 z-\[80\] flex items-center justify-center p-4"/.test(
        fenetreStyles
      ) &&
      !/fixed inset-0 z-\[80\][^"]*(opacity-|blur-|mask-|scale-|translate|will-change|contain-|isolate)/.test(
        fenetreStyles
      )
  );
  verif(
    "…ET LA PLAQUE N'EST PLUS OPAQUE : `bg-sombre-carte` a disparu de " +
      "cette fenêtre, remplacé par l'écriture de verre du site",
    /data-verre-fenetre=""/.test(fenetreStyles) &&
      !/bg-sombre-carte/.test(fenetreStyles)
  );
}

titre("§1 b, c, d — le filet, le chevron rose, le quota");
{
  verif(
    "b) UNE LIGNE DE SÉPARATION SOUS LE TITRE — le filet du site " +
      "(`border-sombre-bordure`), aucune valeur neuve",
    /border-b border-sombre-bordure pl-5 pr-3 pt-3 pb-3/.test(fenetreStyles)
  );
  verif(
    "c) LE CHEVRON DE LA FAMILLE EST ROSE DANS LES DEUX ÉTATS, comme " +
      "dans le menu du moteur — il ne l'était qu'ouvert",
    /classe=\{`shrink-0 transition-transform text-primaire \$\{\s*\n?\s*depliee \? "rotate-180" : ""\s*\n?\s*\}`\}/.test(
      fenetreStyles
    ) && !/rotate-180 text-primaire/.test(portfolio)
  );
  verif(
    "…ET C'EST BIEN LE MÊME ROSE QUE LE MOTEUR : `text-primaire`, " +
      "c'est-à-dire #EE3D6F",
    /primaire: "#EE3D6F"/.test(lire("src/config/roswel.ts")) &&
      /<span className="text-primaire">\s*\n?\s*\{chevron\(sousGroupeDeplie === sousEntete\)\}/.test(
        menu
      )
  );
  verif(
    "d) LE QUOTA EST SUPPRIMÉ, CODE COMPRIS : plus de constante, plus " +
      "de comptage sur sept jours, plus de refus « quota »",
    !/QUOTA_SUGGESTIONS/.test(api) &&
      !/FENETRE_QUOTA_JOURS/.test(api) &&
      !/"quota"/.test(api) &&
      !/cette semaine/.test(api)
  );
  verif(
    "…ET LES DEUX REFUS DE FOND RESTENT — ils disent une vérité sur la " +
      "demande, pas une limite de volume",
    /type Refus = "existe" \| "doublon";/.test(api) &&
      /refus: "existe" satisfies Refus/.test(api) &&
      /refus: "doublon" satisfies Refus/.test(api)
  );
  verif(
    "…ET PLUS AUCUN MESSAGE NE PARLE DE SEMAINE, côté composant non plus",
    !/cette semaine/.test(portfolio) && !/quota est\s+atteint/.test(portfolio)
  );
}

titre("§2 — un volet unique n'a plus de flèche");
{
  verif(
    "LA RÈGLE EXISTE : les portes de groupe ne jouent qu'à partir de " +
      "DEUX groupes",
    /const portesDeGroupe =\s*\n?\s*repliable &&\s*\n?\s*new Set\(options\.map\(\(option\) => option\.groupe\)\.filter\(Boolean\)\)\.size > 1;/.test(
      menu
    )
  );
  verif(
    "À UN SEUL GROUPE, L'EN-TÊTE REDEVIENT UNE ÉTIQUETTE : aucune " +
      "flèche, rien à toucher (c'est la branche `<p role=\"presentation\">`)",
    /if \(!portesDeGroupe\) \{\s*\n\s*return \(\s*\n\s*<p role="presentation"/.test(
      menu
    )
  );
  verif(
    "…ET SES OPTIONS SONT VISIBLES D'EMBLÉE : le groupe ne cache plus rien",
    /if \(portesDeGroupe && option\.groupe && option\.groupe !== groupeDeplie\) \{/.test(
      menu
    )
  );
  verif(
    "LES SOUS-SECTIONS GARDENT LEUR PORTE : « Cultures du monde » en " +
      "est une vraie — onze styles derrière, et d'autres styles à côté",
    /return !option\.sousGroupe \|\| option\.sousGroupe === sousGroupeDeplie;/.test(
      menu
    ) && /function porteSousSection\(/.test(menu)
  );
  verif(
    "ET À DEUX GROUPES, LE MÉCANISME REVIENT TEL QU'IL EST : c'est la " +
      "même écriture, seule la condition d'existence change",
    /aria-expanded=\{groupeDeplie === entete\}/.test(menu) &&
      /onClick=\{\(\) => basculerGroupe\(entete\)\}/.test(menu)
  );
}

titre("§3 — la photo du haut n'ouvre plus la fenêtre");
{
  verif(
    "`surToucherDeLaPhoto` EST SUPPRIMÉE, code compris — et le `onClick` " +
      "de la photo avec elle",
    !/surToucherDeLaPhoto/.test(fiche) &&
      !/onClick=\{surToucherDeLaPhoto\}/.test(fiche)
  );
  verif(
    "…ET LES QUATRE IMPORTS QUI NE SERVAIENT QU'À ELLE SONT PARTIS " +
      "(`pincementRecent`, `RENDU_PAR_DEFAUT`, `ensembleDeLaPhoto`, " +
      "`natureConnue`)",
    !/pincementRecent/.test(fiche) &&
      !/ensembleDeLaPhoto/.test(fiche) &&
      !/natureConnue/.test(fiche)
  );
  verif(
    "LA FENÊTRE DE CARROUSEL S'OUVRE ENCORE DEPUIS LE PORTFOLIO, et de " +
      "là seulement : `ouvrirLaFenetreCarrousel` n'a plus qu'UN appelant, " +
      "la vignette de style (`surSerieChoisie`)",
    (fiche.match(/ouvrirLaFenetreCarrousel\(/g) ?? []).length === 2 &&
      /surSerieChoisie=\{\(serie\) => \{[\s\S]{0,400}ouvrirLaFenetreCarrousel\(/.test(
        fiche
      )
  );
  verif(
    "LA PHOTO GARDE TOUT LE RESTE : le carrousel est monté comme avant, " +
      "avec son défilement, son compteur et ses flèches",
    /<CarrouselPortfolio/.test(fiche) && /data-photo-fiche=""/.test(fiche)
  );
}

titre("§4 — la remontée, à la source");
{
  verif(
    "LA CIBLE S'ARRONDIT AU PIXEL SUPÉRIEUR : on ne s'arrête jamais " +
      "trop haut, au pire un pixel trop bas — invisible, et du bon côté",
    /Math\.max\(0, Math\.ceil\(window\.scrollY \+ photo\.bottom - barre\)\)/.test(
      contenu
    )
  );
  verif(
    "ET LA POSITION EST REMESURÉE À L'ARRIVÉE, puis corrigée s'il reste " +
      "quelque chose — sans animation, sans entrée d'historique",
    /function garantirLArrivee\(\)/.test(contenu) &&
      /window\.scrollTo\(\{ top: cible, left: 0, behavior: "instant" \}\)/.test(
        contenu
      ) &&
      /\}, 520\);/.test(contenu)
  );
  verif(
    "…ET ELLE S'EFFACE DEVANT LE DOIGT : un toucher ou une molette " +
      "pendant le mouvement désarme la garantie",
    /window\.addEventListener\("touchstart", auDoigt, \{ passive: true \}\)/.test(
      contenu
    ) && /if \(abandonnee\) return;/.test(contenu)
  );
}

titre("vivant — 390 × 844");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  try {
    const contexte = await nav.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await contexte.newPage();
    await page.goto(`${BASE}/tatoueur/${FICHE}`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForSelector("[data-photo-fiche]", { timeout: 90000 });
    await page.waitForTimeout(2500);

    /* ---- §1-a : LA RÈGLE DE VERRE, ÉPROUVÉE ------------------- */
    /*  On pose une plaque `data-verre-fenetre` dans la page et on lit
        ce que le navigateur en tire. La fenêtre elle-même vit derrière
        une session, mais la RÈGLE qu'elle consomme, elle, se mesure. */
    const verre = await page.evaluate(() => {
      const plaque = document.createElement("div");
      plaque.setAttribute("data-verre-fenetre", "");
      document.body.append(plaque);
      const cs = getComputedStyle(plaque);
      const lu = {
        filtre: cs.backdropFilter || cs.webkitBackdropFilter,
        fond: cs.backgroundColor,
      };
      plaque.remove();
      return lu;
    });
    verif(
      "§1-a EN VIVANT — LA RÈGLE DE VERRE PRODUIT BIEN UN FILTRE " +
        "D'ARRIÈRE-PLAN, et le fond translucide qui va avec",
      /blur\(40px\)/.test(verre.filtre) &&
        /saturate\(2/.test(verre.filtre) &&
        /rgba\(26, 26, 29, 0\.22\)/.test(verre.fond),
      `${verre.filtre} · ${verre.fond}`
    );

    /* ---- §3 : la photo ne porte plus de gestionnaire ----------- */
    const clicPhoto = await page.evaluate(() => {
      const photo = document.querySelector("[data-photo-fiche]");
      const avant = document.documentElement.getAttribute("data-fenetre-fiche");
      photo.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return {
        avant,
        apres: document.documentElement.getAttribute("data-fenetre-fiche"),
        adresse: location.pathname,
      };
    });
    await page.waitForTimeout(700);
    verif(
      "§3 EN VIVANT — TOUCHER LA PHOTO DU HAUT N'OUVRE PLUS RIEN : " +
        "aucun drapeau de fenêtre, et l'adresse ne bouge pas",
      clicPhoto.apres === null && clicPhoto.adresse === `/tatoueur/${FICHE}`,
      `drapeau ${clicPhoto.apres} · adresse ${clicPhoto.adresse}`
    );

    /* ---- §4 : LA REMONTÉE, DEPUIS QUATRE POSITIONS ------------- */
    const releves = [];
    for (const depart of [0, 300, 900, 1500]) {
      await page.evaluate((y) => window.scrollTo(0, y), depart);
      await page.waitForTimeout(700);
      await page.evaluate(() => {
        const bouton = [...document.querySelectorAll("button")].find((n) =>
          /^(Profil|Portfolio)$/i.test((n.textContent || "").trim())
        );
        bouton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
      //  Le mouvement dure 480 ms, la garantie se pose à 520 : on lit
      //  après les deux.
      await page.waitForTimeout(1400);
      releves.push(
        await page.evaluate(() => {
          const r = document
            .querySelector("[data-photo-fiche]")
            .getBoundingClientRect();
          const barre =
            document.querySelector("[data-barre-fixe]")?.getBoundingClientRect()
              .height ?? 0;
          return {
            position: window.scrollY,
            basPhoto: window.scrollY + r.bottom,
            barre,
            //  Ce qui reste VISIBLE de la photo sous la barre : négatif
            //  ou nul, rien ne dépasse.
            visible: r.bottom - barre,
          };
        })
      );
    }
    verif(
      "§4 EN VIVANT — LA POSITION OBTENUE ÉGALE LE BAS DE LA PHOTO MOINS " +
        "LA BARRE, au pixel supérieur, depuis quatre positions de départ",
      releves.every(
        (m) => m.position === Math.ceil(m.basPhoto - m.barre)
      ),
      releves
        .map((m) => `${m.position} = ceil(${m.basPhoto} − ${m.barre})`)
        .join(" · ")
    );
    verif(
      "…ET AUCUN MORCEAU DE PHOTO NE RESTE VISIBLE SOUS LA BARRE",
      releves.every((m) => m.visible <= 0.001),
      releves.map((m) => `${m.visible.toFixed(2)} px`).join(" · ")
    );
  } finally {
    await nav.close();
  }
}

nonJoue(
  "LA FENÊTRE « AJOUTER UN STYLE » ET LE MENU DES FAVORIS, EN VIVANT",
  "les deux pages qui les portent — le formulaire de portfolio et " +
    "« Ma sélection » — exigent une session Supabase validée par le " +
    "serveur, que ce conteneur ne peut pas signer. Les §1 et §2 sont " +
    "donc vérifiés à la source, au caractère près ; et la RÈGLE de " +
    "verre que la fenêtre consomme est, elle, éprouvée en vivant " +
    "ci-dessus. Je n'ai pas non plus pu reproduire la bande de photo du " +
    "§4 : Chromium arrivait déjà juste (0,5 px SOUS la barre) — la " +
    "correction est donc posée sur le relevé, et elle traite les deux " +
    "causes possibles"
);

process.exit(bilan());
