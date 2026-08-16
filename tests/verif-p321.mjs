/**
 * BANC DE LA PASSE Nº 321 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 — LE BOUTON « SE CONNECTER » NE FAIT PLUS QU'UN SEUL BLOC :
 *      fond et contour mesurés EN VIVANT, au repos puis au survol,
 *      et comparés DEUX À DEUX (ce ne sont pas des constantes lues
 *      dans la feuille : c'est ce que le navigateur peint).
 * §2 — LE MENU « PROFIL », À PLAT : ses entrées, leurs nombres, et
 *      la preuve que chaque nombre est CELUI DE CE QUE LE FILTRE
 *      MONTRERA (le compte et le filtrage passent par la même
 *      fonction — on les fait diverger pour voir s'ils divergent).
 *      Plus la disparition, à la source, des sous-titres et des
 *      quatre modes.
 * §3 — « TOUS LES FAVORIS » : sa place, son hors-groupe, son total,
 *      les DEUX groupes fermés à l'ouverture (le défaut de la nº 317
 *      ne se réveille pas), et « Tous les styles » introuvable dans
 *      TOUT `src/`.
 * §4 — LE TEXTE DE « QUI SOMMES-NOUS », au mot près, avec ses gras :
 *      les trois retouches, et les six autres paragraphes intacts.
 * §5 — LE BOUTON « CRÉE TON PORTFOLIO » : son mot, ses deux fonds
 *      mesurés, et l'absence de tout contour — le bouton rose à sa
 *      gauche mesuré lui aussi, pour prouver qu'il n'a pas bougé.
 *
 * ⚠️ UNE SEULE FENÊTRE : 1440 × 823, celle du propriétaire. Aucun
 * balayage de largeurs (livraison rapide).
 */
//  ⚠️ LE CROCHET D'ALIAS S'ENREGISTRE, IL NE S'IMPORTE PAS (nº 302).
import { register } from "node:module";
register("./_alias-src.mjs", import.meta.url);

import {
  BASE,
  bilan,
  lire,
  nonJoue,
  ouvrirLeNavigateur,
  RACINE,
  titre,
  verif,
} from "./commun-verif.mjs";

const {
  entreesDesStyles,
  entreesDuFiltre,
  entreesDuProfil,
  GROUPE_PROFIL,
  GROUPE_STYLES,
  LIBELLE_TOUS_LES_FAVORIS,
  LIBELLE_TOUS_LES_PORTFOLIOS,
  LIBELLE_TOUS_LES_PROFILS,
  TOUS_LES_PROFILS,
  cleProfil,
} = await import("@/lib/filtres-selection");
const { comptesDesFavoris, comptesDesSuivis, suivisDuChoix } = await import(
  "@/lib/selection-suivis"
);
const { aDesPortesDeGroupe, optionSeVoit, replieALOuverture, sousTitresDe } =
  await import("@/lib/repli-menu");

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/*  LES DEUX CARACTÈRES INVISIBLES : apostrophe courbe et espace
    insécable. LES DEUX CÔTÉS passent par ici — sans quoi deux textes
    identiques à l'œil se déclarent différents (défaut de la nº 320). */
const nu = (t) =>
  t.replace(/[’']/g, "'").replace(/ /g, " ").replace(/\s+/g, " ").trim();

const { nav, ctx, page } = await ouvrirLeNavigateur("p321", {
  width: 1440,
  height: 823,
});
/*  ⚠️ ON ENLÈVE LA SESSION QUE LE SOCLE VIENT DE POSER, ET C'EST
    INDISPENSABLE ICI : le bouton du §1 EST celui des visiteurs
    DÉCONNECTÉS — connecté, la barre affiche « Mon espace » à sa place
    et `[data-bouton-connexion]` n'existe pas dans la page. Rien
    d'autre dans ce banc n'a besoin d'un compte (les deux pages
    mesurées sont publiques, les deux menus sont joués en direct sur
    leurs fonctions). */
await ctx.clearCookies();

/** La couleur peinte d'un élément, telle que le navigateur la rend. */
const peinture = (selecteur) =>
  page.evaluate((s) => {
    const n = document.querySelector(s);
    if (!n) return null;
    const c = getComputedStyle(n);
    return {
      fond: c.backgroundColor,
      contour: c.borderTopColor,
      epaisseur: c.borderTopWidth,
      largeur: Math.round(n.getBoundingClientRect().width),
      hauteur: Math.round(n.getBoundingClientRect().height),
    };
  }, selecteur);

/* ==================================================================
 * §1 — « SE CONNECTER » : UN SEUL BLOC, DANS LES DEUX ÉTATS
 * ================================================================== */
titre("§1 — le bouton « Se connecter » : fond et contour, deux à deux");
{
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-bouton-connexion]", { timeout: 20000 });

  //  ⚠️ SORTIR LA SOURIS D'ABORD (leçon de la nº 318) : elle atterrit
  //  au centre de la fenêtre, et une mesure « au repos » prise sous le
  //  curseur lit en réalité le survol.
  await page.mouse.move(5, 5);
  const repos = await peinture("[data-bouton-connexion]");

  await page.hover("[data-bouton-connexion]");
  //  La transition dure 150 ms par défaut (`transition-colors`) : on
  //  laisse la couleur arriver, sinon on mesure un entre-deux.
  await page.waitForTimeout(400);
  const survol = await peinture("[data-bouton-connexion]");

  verif(
    "AU REPOS, LE FOND ET LE CONTOUR SONT LA MÊME COULEUR — #38383F",
    repos.fond === "rgb(56, 56, 63)" && repos.contour === "rgb(56, 56, 63)",
    `fond ${repos.fond} · contour ${repos.contour}`
  );
  verif(
    "AU SURVOL, LES DEUX MONTENT ENSEMBLE — #4A4A53, toujours égales",
    survol.fond === "rgb(74, 74, 83)" && survol.contour === "rgb(74, 74, 83)",
    `fond ${survol.fond} · contour ${survol.contour}`
  );
  verif(
    "LE CONTOUR N'EST DONC JAMAIS VISIBLE : égal au fond dans les deux états",
    repos.fond === repos.contour && survol.fond === survol.contour,
    "repos et survol : contour = fond"
  );
  verif(
    "…et il garde ses 2 px, qui tiennent la TAILLE du bouton",
    repos.epaisseur === "2px",
    repos.epaisseur
  );
  verif(
    "les deux états ne changent RIEN à la taille du bouton",
    repos.largeur === survol.largeur && repos.hauteur === survol.hauteur,
    `${repos.largeur} × ${repos.hauteur} px, inchangé au survol`
  );

  //  §1 est WEB SEULEMENT : la classe le dit, et c'est la consigne.
  const entete = sansNotes(lire("src/components/EnTeteTatouage.tsx"));
  verif(
    "WEB UNIQUEMENT : le bouton reste `hidden sm:flex`, le doigt garde sa silhouette",
    /hidden sm:flex[\s\S]{0,400}?bg-sombre-bordure border-2 border-sombre-bordure/.test(
      entete
    ),
    "hidden sm:flex conservé"
  );
  verif(
    "LE COMMENTAIRE D'EXCEPTION EST TOUJOURS LÀ, et il dit ce qu'il protège",
    /LES 2 px RESTENT/.test(lire("src/components/EnTeteTatouage.tsx")),
    "la note explique désormais que les 2 px tiennent la taille"
  );
}

/* ==================================================================
 * §2 — LE MENU « PROFIL », À PLAT — EXÉCUTÉ
 * ================================================================== */
titre("§2 — « Profil » : quatre entrées à plat, leurs nombres, leur filtre");

/*  LES PORTFOLIOS SUIVIS DE L'ÉPREUVE — trois natures de fiche, en
    nombres DIFFÉRENTS les uns des autres. C'est volontaire : si le
    compte et le filtrage divergeaient, des nombres égaux le
    masqueraient. Ici, 4 artistes, 2 studios, 3 salons, total 9. */
const suivi = (id, typeFiche, etablissement, style = "maori") => ({
  id,
  nom: id,
  slug: id,
  ville: "Lyon",
  region: null,
  pays: "France",
  codePays: "FR",
  photoProfil: null,
  typeFiche,
  etablissement,
  modes: [{ id: `${id}-m`, genre: "domicile", role: null, salon_id: null }],
  recentes: [
    {
      id: `${id}-p`,
      url: "",
      miniature: "",
      style,
      rendu: "color",
      nature: "tatouage",
      ordre: 0,
    },
  ],
  nouveautes: 0,
});
const SUIVIS = [
  suivi("a1", "artiste", ""),
  suivi("a2", "artiste", "", "realisme"),
  suivi("a3", "artiste", ""),
  suivi("a4", "artiste", "", "realisme"),
  suivi("p1", "salon", "prive"),
  suivi("p2", "salon", "prive"),
  suivi("s1", "salon", "salon"),
  suivi("s2", "salon", "salon"),
  suivi("s3", "salon", "salon", "realisme"),
];
{
  const comptes = comptesDesSuivis(SUIVIS);
  const profil = entreesDuProfil(comptes);

  verif(
    "LA LISTE EST PLATE, DANS L'ORDRE : Tous les profils · Artiste · Studio · Salon",
    profil.map((e) => e.label).join(" · ") ===
      `${LIBELLE_TOUS_LES_PROFILS} · Artiste · Studio · Salon`,
    profil.map((e) => `${e.label} (${e.compte})`).join(" · ")
  );
  verif(
    "AUCUN SOUS-GROUPE, AUCUN SOUS-TITRE : les quatre sont au même rang",
    profil.every(
      (e) => e.groupe === GROUPE_PROFIL && !e.sousGroupe && !e.sousTitre
    ),
    "quatre entrées dans le seul groupe « Profil »"
  );
  verif(
    "CHAQUE ENTRÉE PORTE SON NOMBRE — 9 · 4 · 2 · 3",
    profil.map((e) => e.compte).join(" · ") === "9 · 4 · 2 · 3",
    profil.map((e) => `${e.label} ${e.compte}`).join(" · ")
  );

  /*  LA PREUVE QUE LE NOMBRE NE MENT PAS : on FILTRE avec la valeur de
      chaque entrée et on compte ce qui reste. Compte et filtrage
      passent par `clesDuProfil` — cette boucle est ce qui empêche que
      l'un dérive sans l'autre. */
  const ecarts = profil.filter(
    (e) => suivisDuChoix(SUIVIS, { nature: "", style: "", profil: e.value }).length !==
      e.compte
  );
  verif(
    "LE NOMBRE ANNONCÉ EST CELUI QUE LE FILTRE MONTRE — les quatre, exécutés",
    ecarts.length === 0,
    ecarts.length
      ? `écart sur « ${ecarts[0].label} »`
      : profil
          .map(
            (e) =>
              `${e.label} → ${
                suivisDuChoix(SUIVIS, {
                  nature: "",
                  style: "",
                  profil: e.value,
                }).length
              }`
          )
          .join(" · ")
  );
  verif(
    "« TOUS LES PROFILS » REPREND TOUT LE GROUPE : 9 sur 9",
    suivisDuChoix(SUIVIS, { nature: "", style: "", profil: TOUS_LES_PROFILS })
      .length === SUIVIS.length,
    `${SUIVIS.length} portfolios suivis, 9 retenus`
  );
  verif(
    "…et les trois types se PARTAGENT le total, sans recouvrement : 4 + 2 + 3 = 9",
    ["artiste", "prive", "salon"].reduce(
      (somme, nature) => somme + (comptes.get(cleProfil(nature)) ?? 0),
      0
    ) === SUIVIS.length,
    "4 + 2 + 3 = 9"
  );

  /*  RIEN NE S'AFFICHE QUI N'EXISTE PAS — la règle de la nº 316-§2-c,
      inchangée : sans le moindre salon, l'entrée « Salon » n'est pas
      dans la liste (elle n'est pas à zéro, elle n'y est pas). */
  const sansSalon = entreesDuProfil(
    comptesDesSuivis(SUIVIS.filter((s) => s.etablissement !== "salon"))
  );
  verif(
    "une entrée sans portfolio n'apparaît PAS — « Salon » disparaît quand il n'y en a plus",
    !sansSalon.some((e) => e.label === "Salon") && sansSalon.length === 3,
    sansSalon.map((e) => `${e.label} (${e.compte})`).join(" · ")
  );
  verif(
    "aucun portfolio suivi : la liste est VIDE, le groupe « Profil » n'existe nulle part",
    entreesDuProfil(comptesDesSuivis([])).length === 0,
    "0 entrée"
  );
}

titre("§2-a et §2-b — les sous-titres et les modes ont quitté la source");
{
  const filtres = lire("src/lib/filtres-selection.ts");
  const filtresNu = sansNotes(filtres);
  verif(
    "LES SOUS-TITRES « ARTISTE » ET « LIEU » N'EXISTENT PLUS : aucun symbole ne les porte",
    !/SOUS_TITRE_ARTISTE|SOUS_TITRE_LIEU|TOUS_LES_ARTISTES|TOUS_LES_LIEUX/.test(
      filtresNu
    ),
    "les quatre symboles de la nº 317 sont partis"
  );
  verif(
    "LES QUATRE MODES D'EXERCICE NE SONT PLUS UNE ENTRÉE DE MENU",
    !/cleProfilMode|MODES_DU_PROFIL|LIEUX_DU_PROFIL|genreMode/.test(filtresNu),
    "plus aucun mode dans le vocabulaire du menu"
  );
  const suivisNu = sansNotes(lire("src/lib/selection-suivis.ts"));
  verif(
    "`clesDuProfil` NE POSE PLUS QUE DEUX CLÉS : le total et le type",
    /return \[TOUS_LES_PROFILS, cleProfil\(nature\)\];/.test(suivisNu),
    "TOUS_LES_PROFILS + cleProfil(nature)"
  );

  /*  §2 — LE MÉCANISME DE SOUS-TITRE DANS LE COMPOSANT : plus AUCUN
      appelant du produit ne le demande. On le mesure plutôt que de
      l'affirmer — la décision de retirer le code, elle, appartient au
      propriétaire (voir le rapport, question 3). */
  const appelants = [
    "src/lib/filtres-selection.ts",
    "src/components/MenusSelection.tsx",
    "src/components/MoteurTatouage.tsx",
  ];
  const encoreDemande = appelants.filter((f) =>
    /sousTitre:\s*true/.test(sansNotes(lire(f)))
  );
  verif(
    "PLUS AUCUNE ENTRÉE DU PRODUIT NE DEMANDE `sousTitre` — le mécanisme est sans emploi",
    encoreDemande.length === 0,
    encoreDemande.length ? encoreDemande.join(", ") : "aucun appelant"
  );
  //  …ET LE POINT ROSE DE LA VRAIE PORTE DE FAMILLE, LUI, VIT TOUJOURS :
  //  c'est l'usage que la charte autorise nommément.
  const menu = sansNotes(lire("src/components/MenuDeroulant.tsx"));
  verif(
    "le point rose de la PORTE DE FAMILLE (« Cultures du monde ») est intact",
    /porteSousSection\([\s\S]{0,600}?\{ avecPoint: true \}/.test(menu) &&
      /data-porte-famille=\{avecPoint \? "" : undefined\}/.test(menu),
    "`avecPoint: true` toujours passé à `porteSousSection`"
  );
}

/* ==================================================================
 * §3 — « TOUS LES FAVORIS »
 * ================================================================== */
titre("§3 — « Tous les favoris » : place, total, et les deux portes fermées");
{
  /*  SEPT PHOTOS AIMÉES : 4 réalisations (3 maori, 1 réalisme) et
      3 flashs (2 maori, 1 réalisme). Total 7 — un nombre qu'aucune
      entrée de catégorie ne porte, donc impossible à confondre. */
  const photo = (id, nature, style) => ({
    id,
    url: "",
    miniature: "",
    style,
    rendu: "color",
    nature,
    ordre: 0,
  });
  const FAVORIS = [
    photo("f1", "tatouage", "maori"),
    photo("f2", "tatouage", "maori"),
    photo("f3", "tatouage", "maori"),
    photo("f4", "tatouage", "realisme"),
    photo("f5", "flash", "maori"),
    photo("f6", "flash", "maori"),
    photo("f7", "flash", "realisme"),
  ];
  const comptes = comptesDesFavoris(FAVORIS);
  const ENTREES = entreesDuFiltre(comptes);

  const neutre = ENTREES[0];
  verif(
    "ELLE S'APPELLE « Tous les favoris », et c'est la PREMIÈRE de la liste",
    neutre.label === LIBELLE_TOUS_LES_FAVORIS && neutre.value === "",
    `« ${neutre.label} » (valeur vide, en tête)`
  );
  verif(
    "ELLE VIT HORS GROUPE : au-dessus des deux portes de catégorie",
    neutre.groupe === undefined && neutre.sousGroupe === undefined,
    "aucun groupe, aucun sous-groupe"
  );
  verif(
    "ELLE PORTE LE TOTAL DES PHOTOS AIMÉES — 7",
    neutre.compte === FAVORIS.length,
    `${neutre.compte} sur ${FAVORIS.length}`
  );
  verif(
    "ELLE ANNULE LE FILTRE : sa valeur est vide, donc elle efface le paramètre",
    neutre.value === "",
    "valeur vide"
  );

  /*  LE DÉFAUT DE LA nº 317 NE SE RÉVEILLE PAS, ET ON L'ÉPROUVE À
      L'ENDROIT MÊME OÙ IL VIVAIT : à l'ouverture, le filtre vaut « »
      — la règle « une valeur vide n'est pas un choix » doit rendre
      DEUX null, et les DEUX portes doivent rester fermées. */
  const portes = aDesPortesDeGroupe(ENTREES, true);
  const replie = replieALOuverture(ENTREES, "");
  verif(
    "À L'OUVERTURE, RIEN N'EST DÉPLIÉ — la valeur vide n'ouvre aucun groupe",
    replie.groupe === null && replie.sousGroupe === null,
    "groupe null · sous-groupe null"
  );
  const etat = {
    repliable: true,
    portesDeGroupe: portes,
    groupeDeplie: replie.groupe,
    sousGroupeDeplie: replie.sousGroupe,
    sousTitres: sousTitresDe(ENTREES),
  };
  const vues = ENTREES.filter((e) => optionSeVoit(e, etat));
  verif(
    "LES DEUX GROUPES RESTENT FERMÉS : seule « Tous les favoris » se voit",
    portes === true && vues.length === 1 && vues[0].label === LIBELLE_TOUS_LES_FAVORIS,
    `${vues.length} entrée visible : « ${vues[0]?.label} »`
  );
  verif(
    "…et elle se voit PARCE QU'ELLE N'A PAS DE GROUPE, portes fermées comprises",
    optionSeVoit(neutre, { ...etat, groupeDeplie: null }),
    "visible sans qu'aucun groupe soit ouvert"
  );

  //  L'AUTRE ONGLET N'A PAS BOUGÉ (nº 318) : sa tête garde son mot.
  const suivis = entreesDesStyles(comptesDesSuivis(SUIVIS));
  verif(
    "l'onglet des portfolios garde « Tous les portfolios » — les deux mots coexistent",
    suivis[0].label === LIBELLE_TOUS_LES_PORTFOLIOS && suivis[0].value === "",
    `« ${suivis[0].label} » face à « ${LIBELLE_TOUS_LES_FAVORIS} »`
  );
  verif(
    "les groupes des deux menus sont bien deux : « Styles » et « Profil »",
    [...new Set([...suivis, ...entreesDuProfil(comptesDesSuivis(SUIVIS))]
      .map((e) => e.groupe).filter(Boolean))].sort().join(" · ") ===
      [GROUPE_PROFIL, GROUPE_STYLES].sort().join(" · "),
    `${GROUPE_PROFIL} · ${GROUPE_STYLES}`
  );
}

titre("§3 — « Tous les styles » a quitté le site, partout");
{
  //  ON BALAIE `src/` ENTIER, notes comprises : c'est un MOT montré à
  //  l'écran, pas un symbole — il ne doit rester nulle part où il
  //  pourrait revenir à l'affichage. Les commentaires qui RACONTENT sa
  //  disparition sont, eux, légitimes : on ne cherche donc que la
  //  chaîne littérale entre guillemets de code.
  const { execSync } = await import("node:child_process");
  const trouves = execSync(`grep -rn '"Tous les styles"' src/ || true`, {
    encoding: "utf8",
    cwd: RACINE,
  }).trim();
  verif(
    "PLUS AUCUNE CHAÎNE « Tous les styles » DANS `src/` — le mot est parti",
    trouves === "",
    trouves === "" ? "0 occurrence" : trouves.split("\n")[0]
  );
  const moteur = lire("src/components/MoteurTatouage.tsx");
  verif(
    "`libelleStyleChoisi` — la fonction qui le portait — n'existe plus",
    !/export function libelleStyleChoisi/.test(moteur) &&
      /« TOUS LES STYLES » N'EXISTE PLUS NULLE PART/.test(moteur),
    "supprimée, et la note dit pourquoi"
  );
  verif(
    "son seul appelant (IndexTatoueurs) lit `libelleStyle` en direct",
    /affiches\.style \? libelleStyle\(affiches\.style\) : ""/.test(
      sansNotes(lire("src/components/IndexTatoueurs.tsx"))
    ),
    "le cas vide n'y arrivait jamais — il n'y a plus de cas vide"
  );
}

nonJoue(
  "§3 — « Tous les favoris » MESURÉ DANS LE NAVIGATEUR, sur /mes-favoris",
  "la page répond 307 sans session Supabase signée par le serveur : le " +
    "cookie fabriqué du socle ne franchit pas `auth.getUser()`, et ce " +
    "conteneur n'a pas de quoi en signer un. Les quatre contrôles " +
    "ci-dessus jouent donc les MÊMES fonctions que la page — " +
    "`comptesDesFavoris`, `entreesDuFiltre`, `replieALOuverture`, " +
    "`optionSeVoit` —, à la même suite et sur des données à nombres " +
    "distincts. Ce que le navigateur ajouterait, ce sont des pixels, " +
    "pas une autre vérité."
);

/* ==================================================================
 * §4 — LE TEXTE DE « QUI SOMMES-NOUS »
 * ================================================================== */
titre("§4 — le texte : rendu à la nº 324, l'exception de page gardée");
{
  await page.goto(`${BASE}/qui-sommes-nous`, { waitUntil: "networkidle" });

  /*  ⚠️ AMENDÉ PAR LA nº 324 — LE TEXTE A CHANGÉ DE MAIN.
      ------------------------------------------------------------------
      CE BLOC MESURAIT ICI les neuf paragraphes au mot près, les trois
      retouches de la nº 321-§4 une à une, et les quatre gras. LE
      PROPRIÉTAIRE A RÉÉCRIT LE CORPS DU TEXTE À LA nº 324-§1 :
      l'algorithme remplace « aucune case ne pose cette question », la
      phrase sur Instagram est refaite, « Ici » ouvre la dernière, et il
      y a désormais CINQ gras. Les attendus d'ici sont donc périmés —
      pas faux quand ils ont été écrits, dépassés par une décision.
      LA MESURE EST RENDUE, PAS RETIRÉE, et elle est plus fine là-bas :
      `verif-p324.mjs` §1 contrôle les neuf paragraphes au mot près, les
      cinq gras avec leur couleur et leur graisse, les trois changements
      nommés un par un, ET le collage d'espaces paragraphe par
      paragraphe. ELLE VIT LÀ, ET LÀ SEULEMENT : recopier le même texte
      dans deux bancs, ce sont deux endroits à corriger à la retouche
      suivante — et un oublié. (C'est déjà ce que la nº 321 avait fait
      des bancs p319 et p320.)

      CE QUI RESTE MESURÉ ICI, parce que c'est le sujet DE LA nº 321 et
      de personne d'autre : que la page porte toujours neuf paragraphes,
      et qu'elle garde l'exception de mise en page actée à la nº 320 —
      les deux choses que le §4 de cette passe-là ne devait pas casser. */
  const nombre = await page.evaluate(
    () => document.querySelectorAll("main p").length
  );
  verif(
    "LA PAGE PORTE TOUJOURS SES NEUF PARAGRAPHES " +
      "(leur texte au mot près se mesure dans p324-§1)",
    nombre === 9,
    `${nombre} paragraphes`
  );


  //  ET L'EXCEPTION DE MISE EN PAGE DE LA nº 320 TIENT TOUJOURS.
  const exception = lire("src/app/(tatouage)/qui-sommes-nous/page.tsx");
  verif(
    "LA PAGE GARDE SON EXCEPTION DE MISE EN PAGE (nº 320), en commentaire",
    /AUCUNE PASSE FUTURE NE DOIT LES Y RAMENER/.test(exception),
    "le commentaire d'exception est intact"
  );
  const grand = await page.evaluate(() => {
    const h1 = document.querySelector("main h1");
    return {
      taille: Math.round(parseFloat(getComputedStyle(h1).fontSize)),
      centre: getComputedStyle(h1).textAlign,
    };
  });
  verif(
    "…et la grande typographie centrée qu'elle protège est toujours peinte",
    grand.taille >= 32 && grand.centre === "center",
    `titre ${grand.taille} px, centré`
  );
}

/* ==================================================================
 * §5 — LE BOUTON « CRÉE TON PORTFOLIO »
 * ================================================================== */
titre("§5 — « Crée ton portfolio » : capsule pleine, sans aucun contour");
{
  const SECOND = 'main a[href="/devenir-tatoueur"]';
  const ROSE = 'main a[href="/"]';

  await page.mouse.move(5, 5);
  const repos = await peinture(SECOND);
  const rose = await peinture(ROSE);
  const mot = await page.textContent(SECOND);

  await page.hover(SECOND);
  await page.waitForTimeout(400);
  const survol = await peinture(SECOND);
  //  ⚠️ ON REMESURE LE ROSE PENDANT QUE LA SOURIS EST SUR L'AUTRE :
  //  c'est la preuve qu'il ne bouge EN RIEN.
  const roseVoisin = await peinture(ROSE);

  verif(
    "IL DIT « Crée ton portfolio » — plus « Rejoindre »",
    mot.trim() === "Crée ton portfolio",
    `« ${mot.trim()} »`
  );
  verif(
    "AU REPOS, SON FOND EST #33333A",
    repos.fond === "rgb(51, 51, 58)",
    repos.fond
  );
  verif(
    "AU SURVOL, SON FOND MONTE À #4A4A53",
    survol.fond === "rgb(74, 74, 83)",
    survol.fond
  );
  verif(
    "AUCUN CONTOUR, DANS AUCUN DES DEUX ÉTATS — épaisseur nulle",
    repos.epaisseur === "0px" && survol.epaisseur === "0px",
    `repos ${repos.epaisseur} · survol ${survol.epaisseur}`
  );
  const texte = await page.evaluate(
    (s) => getComputedStyle(document.querySelector(s)).color,
    SECOND
  );
  verif(
    "SON TEXTE EST BLANC — pas le rose de l'action finale",
    texte === "rgb(255, 255, 255)",
    texte
  );
  const rayon = await page.evaluate((s) => {
    const n = document.querySelector(s);
    return {
      rayon: parseFloat(getComputedStyle(n).borderTopLeftRadius),
      hauteur: n.getBoundingClientRect().height,
    };
  }, SECOND);
  verif(
    "C'EST UNE CAPSULE : son rayon vaut au moins la moitié de sa hauteur",
    rayon.rayon >= rayon.hauteur / 2,
    `rayon ${Math.round(rayon.rayon)} px pour ${Math.round(
      rayon.hauteur
    )} px de haut`
  );
  verif(
    "LE BOUTON ROSE À SA GAUCHE NE CHANGE EN RIEN — #EE3D6F, avant comme pendant",
    rose.fond === "rgb(238, 61, 111)" && roseVoisin.fond === rose.fond,
    `${rose.fond}, inchangé quand la souris est sur l'autre`
  );
  verif(
    "…et il reste LE SEUL rose de la page : l'action finale ne se dédouble pas",
    repos.fond !== rose.fond && survol.fond !== rose.fond,
    "un seul bouton rose"
  );
}

await nav.close();
process.exit(bilan());
