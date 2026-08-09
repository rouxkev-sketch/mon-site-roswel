/**
 * SUITE PERMANENTE — L'AUTOCOMPLÉTION DU NAVIGATEUR ET LA RECHERCHE MOBILE
 * ========================================================================
 * (anciennement « balayage de la passe nº 91 »)
 *
 * CE QUI A ÉTÉ RETIRÉ, ET POURQUOI
 * ---------------------------------
 * · §3 « Les acquis de la fenêtre » — la moitié géométrique (5
 *   assertions : la fenêtre remonte à la saisie, la marge basse égale
 *   la marge haute, elle ne sort pas par le haut, elle ne passe pas
 *   sous le clavier, elle redescend d'elle-même).
 *   CADUQUE DEPUIS LA PASSE Nº 104 : la fenêtre superposée a été
 *   remplacée par une PAGE PLEIN ÉCRAN (voir PageRechercheMobile.tsx).
 *   Ces cinq mesures décrivaient le REPOSITIONNEMENT MANUEL qu'on
 *   faisait pendant que le clavier d'iOS arrivait — c'est-à-dire
 *   exactement la mécanique qu'on a supprimée. Les garder, c'était
 *   exiger le retour du défaut.
 *   ⚠️ L'AUTRE MOITIÉ EST RESTÉE, elle : la page s'ouvre, ses deux
 *   vues sont là, choisir une ville ne cherche pas, « Valider »
 *   cherche, la page se referme. Ces comportements-là n'ont jamais été
 *   abandonnés — c'est leur SUPPORT qui a changé, pas la règle.
 *
 * · §4 « Une seule mécanique de placement » — les 7 assertions.
 *   MÊME CAUSE, PASSE Nº 104. Elles lisaient dans MoteurTatouage.tsx
 *   des symboles qui n'existent plus (`vueVisible.haut`,
 *   `translateY(${decalage}px)`, `useFondImmobile`, la bascule
 *   `items-start`) parce que le composant ne place plus rien à la
 *   main. La seule qui portait sur autre chose — le module Photon de
 *   ChampLocalisation — a été gardée, en §4.
 *
 * · §5 « le verrou du bloc 1 » cherchait la phrase « Confirme ce
 *   premier bloc pour continuer ». CADUQUE DEPUIS LA PASSE Nº 95 :
 *   l'encadré et sa phrase ont disparu, le libellé du bouton (« Je
 *   confirme mon choix ») dit la même chose une fois au lieu de deux.
 *   L'assertion a été MISE À JOUR, pas retirée : le verrou, lui, est
 *   toujours voulu.
 *
 * · §5 « aucune migration nouvelle » lisait un numéro de migration
 *   figé. RETIRÉE : une suite permanente ne peut pas porter le
 *   compte des migrations, qui monte à chaque passe. C'est le travail
 *   de supabase/yokofolio-verification-migrations.sql.
 *
 * CE QUI A ÉTÉ MIS À JOUR
 * ------------------------
 * · L'ancre du formulaire : « Je tatoue en mon nom » (deux boutons
 *   radio) → « Qui es-tu ? » (trois cartes), passe nº 95.
 * · §2 balaie maintenant le formulaire COMPLET (bloc 1 confirmé),
 *   pas seulement le bloc 1 : c'est là que vivent les champs libres.
 *
 *     npm run verif:p91      (serveur de développement démarré)
 */

import {
  BASE,
  lire,
  verif,
  titre,
  nonJoue,
  bilan,
  ouvrirLeNavigateur,
  formulaireNeuf,
  RAISON_SANS_SESSION,
} from "./commun-verif.mjs";

const { nav, ctx, page } = await ouvrirLeNavigateur("verif-p91");

/* ================================================================
 * 1) LE FORMULAIRE S'OUVRE ET SE REMPLIT
 * ================================================================ */
titre("1 · Le formulaire s'ouvre, session connectée");
const formulaire = await formulaireNeuf(page, "salon");
verif(
  "le formulaire s'ouvre ET se laisse remplir jusqu'aux blocs suivants",
  formulaire,
  formulaire ? "bloc 1 confirmé" : RAISON_SANS_SESSION
);

/* ================================================================
 * 2) L'AUTOCOMPLÉTION DU NAVIGATEUR — LE CŒUR DE CETTE SUITE
 * ================================================================
 * ⚠️ C'EST LA PARTIE QU'IL FAUT GARDER À TOUT PRIX. Elle défend un
 * acquis fragile : Safari et Chrome proposent l'adresse personnelle
 * dans le champ « adresse du salon », et le seul moyen de les en
 * empêcher est un faisceau de six précautions dont AUCUNE ne suffit
 * seule. Une régression ici ne se voit pas à l'œil : elle se voit le
 * jour où un tatoueur publie son domicile sans l'avoir voulu.
 */
titre("2 · Le remplissage automatique du navigateur");
if (!formulaire) {
  nonJoue("§2 · autocomplétion", RAISON_SANS_SESSION);
} else {
  const champs = await page.evaluate(() =>
    [...document.querySelectorAll("input, textarea")]
      .filter(
        (c) =>
          c.tagName === "TEXTAREA" ||
          ["text", "url", "search", "tel"].includes(c.type)
      )
      .map((c) => ({
        id: c.id,
        nom: c.getAttribute("name") ?? "",
        autocomplete: c.getAttribute("autocomplete"),
        prise: c.hasAttribute("data-sans-remplissage"),
        onepassword: c.hasAttribute("data-1p-ignore"),
        lastpass: c.getAttribute("data-lpignore"),
        bitwarden: c.getAttribute("data-bwignore"),
      }))
  );
  verif(
    "des champs libres sont bien présents",
    champs.length > 0,
    `${champs.length} champ(s)`
  );
  verif(
    'AUCUN ne dit plus `autocomplete="off"` — ignoré exprès par Safari',
    champs.every((c) => c.autocomplete !== "off"),
    champs
      .filter((c) => c.autocomplete === "off")
      .map((c) => c.id)
      .join(", ")
  );
  verif(
    "tous portent la valeur non standard",
    champs.every((c) => c.autocomplete === "hors-carnet"),
    [...new Set(champs.map((c) => c.autocomplete))].join(" | ")
  );
  //  ⚠️ LE CŒUR DU DÉFAUT D'ORIGINE : le `name` posé contenait les
  //  mots mêmes que la devinette du navigateur cherche.
  const MOTS_QUI_TRAHISSENT = [
    "nom", "prenom", "prénom", "adresse", "address", "ville", "city",
    "postal", "tel", "phone", "mail", "lieu", "street", "name",
  ];
  const nomsQuiTrahissent = champs.filter((c) =>
    MOTS_QUI_TRAHISSENT.some((mot) => c.nom.toLowerCase().includes(mot))
  );
  verif(
    "aucun `name` ne contient un mot que Chrome ou Safari reconnaissent",
    nomsQuiTrahissent.length === 0,
    nomsQuiTrahissent.map((c) => `${c.id || "?"} → « ${c.nom} »`).join(", ")
  );
  //  ⚠️ ASSERTION MISE À JOUR — elle exigeait `/^q[0-9a-z]{4,}$/` sur
  //  TOUS les champs. Quatre y échouaient : `fiche-instagram`,
  //  `fiche-tiktok`, `fiche-youtube` et `fiche-site` n'ont PAS
  //  d'attribut `name` du tout — ils étalent la constante
  //  SANS_REMPLISSAGE_AUTO au lieu d'appeler sansRemplissageAuto().
  //  CE N'EST PAS UN DÉFAUT, et l'ancienne rédaction confondait le
  //  moyen avec la fin. Ce qu'on protège, c'est qu'aucun mot de
  //  dictionnaire ne nourrisse la devinette du navigateur ; un `name`
  //  ABSENT ne lui donne rien du tout — c'est au moins aussi sûr
  //  qu'un `name` opaque. L'assertion demande donc l'un OU l'autre.
  verif(
    "aucun `name` n'est un mot lisible : opaque (`q…`) ou absent",
    champs.every((c) => c.nom === "" || /^q[0-9a-z]{4,}$/.test(c.nom)),
    `${champs.filter((c) => c.nom === "").length} sans nom, ` +
      `${champs.filter((c) => c.nom !== "").length} opaques`
  );
  verif("tous portent la prise du CSS", champs.every((c) => c.prise));
  verif(
    "les trois gestionnaires de mots de passe sont écartés",
    champs.every(
      (c) => c.onepassword && c.lastpass === "true" && c.bitwarden === "true"
    )
  );
}
verif(
  "la silhouette de WebKit est retirée par le CSS",
  lire("src/app/globals.css").includes(
    "input[data-sans-remplissage]::-webkit-contacts-auto-fill-button"
  )
);
verif(
  "la connexion, elle, GARDE son autocomplétion",
  !lire("src/components/EcranAuthentification.tsx").includes(
    "champs-sans-remplissage"
  )
);

/* ================================================================
 * 2 bis) LES DEUX CHAMPS SANS PROTECTION — LE CAS SUSPECT
 * ================================================================
 * ⚠️ CE N'EST PAS UN DÉFAUT DE YOKOFOLIO, ET CETTE ASSERTION EXISTE
 * POUR QUE PERSONNE N'AIT À LE REDÉCOUVRIR.
 * `ChampVille.tsx` et `TableauProspection.tsx` portent encore
 * `autocomplete="off"` au lieu du jeton `hors-carnet`. Ils avaient
 * été signalés comme un manquement. Ils n'en sont pas un :
 *   · ChampVille n'est utilisé QUE par FormulaireRecherche,
 *     FormulaireArtisan et RechercheCompacte — les écrans /artisans,
 *     /artisan/[slug] et /artisan/espace, c'est-à-dire L'ANCIEN
 *     PRODUIT ARTISAN, qui n'est plus le sujet ;
 *   · TableauProspection est l'outil interne de prospection, réservé
 *     à l'administrateur.
 * AUCUN champ de yokofolio n'est concerné : tous passent par
 * `sansRemplissageAuto()`. On vérifie donc les deux faits qui
 * justifient ce verdict, plutôt que d'exiger une correction inutile.
 *
 * ➜ POINT VOLONTAIREMENT REPORTÉ (décision du propriétaire, passe
 *   nº 99) : il sera traité AVEC LA REFONTE DU FORMULAIRE, pas avant.
 *   Le détail — ce qu'il faudra faire, et à quelle condition — est
 *   consigné dans `docs/A-REPRENDRE-refonte-du-formulaire.md`.
 *   ⚠️ SI CES ASSERTIONS SE METTENT À ÉCHOUER, c'est que ChampVille a
 *   changé de mains : relire ce fichier-là AVANT de toucher au test.
 */
titre("2 bis · Les deux champs signalés — vérification du verdict");
const champVille = lire("src/components/ChampVille.tsx");
verif(
  "ChampVille porte bien encore l'ancien `autocomplete=\"off\"`",
  champVille.includes('autoComplete="off"') ||
    champVille.includes('autocomplete="off"'),
  "constat, pas exigence"
);
const usagers = [
  "src/components/FormulaireRecherche.tsx",
  "src/components/FormulaireArtisan.tsx",
  "src/components/RechercheCompacte.tsx",
].filter((f) => {
  try {
    return lire(f).includes("ChampVille");
  } catch {
    return false;
  }
});
verif(
  "…et il n'est lu QUE par l'ancien produit artisan",
  usagers.length > 0,
  usagers.map((f) => f.split("/").pop()).join(", ")
);
verif(
  "aucun écran yokofolio n'importe ChampVille",
  !lire("src/components/MoteurTatouage.tsx").includes("ChampVille") &&
    !lire("src/components/FormulaireFiche.tsx").includes("ChampVille") &&
    !lire("src/components/PageRechercheMobile.tsx").includes("ChampVille")
);
verif(
  "le formulaire de fiche, lui, passe tout par `sansRemplissageAuto`",
  lire("src/components/FormulaireFiche.tsx").includes("sansRemplissageAuto") &&
    lire("src/components/ChampLocalisation.tsx").includes("sansRemplissageAuto")
);

/* ================================================================
 * 3) LA RECHERCHE SUR TÉLÉPHONE — CE QUI RESTE VRAI
 * ================================================================ */
titre("3 · La recherche sur téléphone : la règle, pas le placement");
const tel = await nav.newContext({
  viewport: { width: 390, height: 780 },
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
    "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
await tel.route("**/photon.komoot.io/**", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      features: [
        {
          properties: {
            osm_id: 1, name: "Lyon", city: "Lyon",
            state: "Auvergne-Rhône-Alpes", country: "France",
            countrycode: "FR", postcode: "69001", type: "city",
          },
          geometry: { coordinates: [4.8357, 45.764] },
        },
      ],
    }),
  })
);
const mob = await tel.newPage();
let appels = 0;
mob.on("request", (r) => {
  if (r.url().includes("/api/tatoueurs")) appels += 1;
});
await mob.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 120000 });
await mob.waitForTimeout(2500);

await mob.locator('button[aria-haspopup="dialog"]').first().click();
await mob.waitForTimeout(1200);
const ecran = mob.locator('[role="dialog"][aria-label="Rechercher un tatoueur"]');
verif("l'écran de recherche s'ouvre", (await ecran.count()) === 1);
//  ⚠️ LA BASCULE A DISPARU À LA PASSE Nº 139 : la page n'a plus
//  qu'UN écran — le titre « Recherche » en tête, et le sélecteur à
//  deux positions (« Type de profil » / « Où tatoue-t-il ? ») au
//  milieu. C'est CE contrat qu'on vérifie désormais.
verif(
  "la page unique porte son titre et son sélecteur (nº 139)",
  (await ecran.locator("h1", { hasText: "Recherche" }).count()) === 1 &&
    (await ecran
      .locator('[role="radiogroup"][aria-label="Famille de filtres"]')
      .count()) === 1
);

appels = 0;
const champLieu = mob.locator('input[id$="-fenetre-lieu"]').first();
await champLieu.click();
await champLieu.fill("Lyon");
await mob.waitForTimeout(2200);
verif(
  "les suggestions de lieu apparaissent",
  (await mob.locator('[role="option"]').count()) > 0
);
await mob.locator('[role="option"]').first().click();
await mob.waitForTimeout(1500);
//  ACQUIS TOUJOURS VOULU — la refonte en page plein écran ne l'a pas
//  emporté : choisir une ville ne doit rien chercher.
verif(
  "ACQUIS · choisir une ville ne lance AUCUNE recherche",
  appels === 0,
  `${appels} appel(s)`
);
verif(
  "les deux boutons sont là",
  (await mob.locator('button:has-text("Valider")').count()) === 1 &&
    (await mob.locator('button:has-text("Effacer")').count()) === 1
);
await mob.locator('button:has-text("Valider")').first().click();
await mob.waitForTimeout(2500);
verif("ACQUIS · « Valider » lance la recherche", appels >= 1, `${appels} appel(s)`);
verif("l'écran se referme", (await ecran.count()) === 0);

/* ================================================================
 * 4) CE QUI A REMPLACÉ LA MÉCANIQUE DE PLACEMENT
 * ================================================================ */
titre("4 · Une PAGE, plus une fenêtre à repositionner");
const pageMobile = lire("src/components/PageRechercheMobile.tsx");
verif(
  "la recherche mobile est une page en flux normal",
  pageMobile.includes("position") && pageMobile.includes("static"),
  "PageRechercheMobile.tsx"
);
verif(
  "le moteur ne replace plus rien à la main",
  !lire("src/components/MoteurTatouage.tsx").includes("vueVisible.haut") &&
    !lire("src/components/MoteurTatouage.tsx").includes("useFondImmobile")
);
//  LA SEULE ASSERTION DE L'ANCIEN §4 QUI TIENT ENCORE : le module
//  Photon n'a pas bougé, et ne doit pas bouger.
verif(
  "le module Photon n'a pas bougé",
  lire("src/components/ChampLocalisation.tsx").includes("PAUSE_FRAPPE_MS") &&
    lire("src/components/ChampLocalisation.tsx").includes("panneauDansLeFlux")
);

/* ================================================================
 * 5) NON-RÉGRESSIONS
 * ================================================================ */
titre("5 · Non-régressions");
const codes = {};
for (const chemin of [
  "/",
  "/tatoueur/atelier-corvus-lyon-1er",
  "/sitemap.xml",
  "/robots.txt",
  "/api/tatoueurs?style=blackwork",
  "/api/tatoueurs?exclure=cover",
]) {
  codes[chemin] = (await page.request.get(`${BASE}${chemin}`)).status();
}
verif(
  "les routes clés répondent",
  Object.values(codes).every((s) => s === 200),
  JSON.stringify(codes)
);
const total = await (await page.request.get(`${BASE}/api/tatoueurs`)).json();
const sansCover = await (
  await page.request.get(`${BASE}/api/tatoueurs?exclure=cover`)
).json();
verif(
  "les filtres Besoins / Rendu filtrent toujours",
  sansCover.total < total.total,
  `${total.total} → ${sansCover.total}`
);
//  MIS À JOUR (passe nº 95) : l'encadré et sa phrase ont disparu, le
//  verrou et son bouton sont restés.
verif(
  "le verrou du bloc 1 et sa confirmation tiennent",
  lire("src/components/FormulaireFiche.tsx").includes("exercice_verrouille") &&
    lire("src/components/FormulaireFiche.tsx").includes("Je confirme mon choix")
);
verif(
  "YouTube et Linktree",
  lire("src/config/tatouage.ts").includes('youtube: "/icone-youtube.png"') &&
    lire("src/lib/liens-fiche.ts").includes("estLinktree")
);
//  MIS À JOUR (passe nº 95) : les horaires ont QUITTÉ BlocStudios pour
//  devenir le bloc 10 du formulaire. L'assertion cherchait encore
//  `BlocHorairesStudio` dans BlocStudios.tsx, où il n'a plus rien à
//  faire. Le module, lui, est toujours voulu — il a juste déménagé.
verif(
  "le module horaires et son accordéon",
  lire("src/components/FormulaireFiche.tsx").includes("BlocHorairesStudio") &&
    lire("src/components/HorairesStudio.tsx").includes("etatOuverture")
);
verif(
  "appareil, défilement, retour arrière, pincement",
  lire("src/lib/appareil.ts").includes("useAppareilMobile") &&
    lire("src/components/GrilleTatoueurs.tsx").includes("data-fenetre-fiche") &&
    lire("src/components/CarrouselPortfolio.tsx").includes("ZoomPincement")
);

await ctx.close();
await tel.close();
await nav.close();
process.exit(bilan());
