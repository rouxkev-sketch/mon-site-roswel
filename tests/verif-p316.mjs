/**
 * BANC DE LA PASSE Nº 316 — LIVRAISON RAPIDE
 * ==================================================================
 * §1-a — L'ÉCART DES PHOTOS DE « MA SÉLECTION » EST DIVISÉ PAR DEUX
 *        AU DOIGT, ET LE WEB NE BOUGE PAS. Mesuré aux deux largeurs,
 *        sur la classe RÉELLEMENT COMPILÉE par la feuille du site.
 * §1-b — LES NOMBRES ARRIVENT DANS LA FEUILLE DU BAS, depuis la même
 *        source que le panneau du web — jamais un second calcul.
 * §2   — LE SECOND MENU « PROFIL ». Toute sa règle est faite de
 *        fonctions PURES : le banc les EXÉCUTE sur les trois cas
 *        demandés — aucun mode déclaré, un seul, tous.
 * §2-f — LE SOUS-TITRE EN GRIS ET SON POINT ROSE, plus la règle de
 *        charte relue dans le code.
 *
 * ⚠️ UNE SEULE FENÊTRE PAR APPAREIL : 1440 × 823 (celle du
 * propriétaire) et 390 × 844 au doigt. Aucun balayage de largeurs.
 *
 * ⚠️⚠️ CE QUE CE BANC NE PEUT PAS FAIRE, ET IL FAUT LE LIRE AVANT LE
 * RESTE : « MA SÉLECTION » (/mes-favoris) EXIGE UNE SESSION SUPABASE
 * SIGNÉE PAR LE SERVEUR. Sans elle, la page répond 307 vers la
 * connexion — vérifié à chaque exécution, plus bas. AUCUNE des
 * nouveautés de cette passe n'a donc pu être vue PEINTE SUR SA PAGE.
 * Ce que ce banc fait à la place, et qui n'est pas rien :
 *  · il EXÉCUTE toute la règle du §2 (comptes, entrées, filtrage,
 *    lecture d'adresse) — ce sont des fonctions pures ;
 *  · il MESURE, dans un vrai navigateur et sur la feuille de style
 *    RÉELLEMENT COMPILÉE, ce que valent les classes que le nouveau
 *    code émet ;
 *  · il relit la source pour ce qui ne se mesure ni ne s'exécute.
 * Voir les NON JOUÉES en fin de fichier — elles le disent aussi.
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
  titre,
  verif,
} from "./commun-verif.mjs";

const {
  entreesDesStyles,
  entreesDuProfil,
  libelleDuProfil,
  lireSelection,
  valeurDuMenu,
  cleProfilLieu,
  cleProfilMode,
  GROUPE_PROFIL,
  GROUPE_STYLES,
  SOUS_TITRE_ARTISTE,
  SOUS_TITRE_LIEU,
  //  ⚠️ AJOUTÉES À LA nº 317 : les deux têtes de sous-groupe, dont les
  //  clés entrent désormais dans `clesDuProfil`.
  TOUS_LES_ARTISTES,
  TOUS_LES_LIEUX,
} = await import("@/lib/filtres-selection");
const { comptesDesSuivis, clesDuProfil, suivisDuChoix } = await import(
  "@/lib/selection-suivis"
);
const { COULEURS } = await import("@/config/roswel");

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const blocSuivis = sansNotes(lire("src/components/BlocSuivis.tsx"));
const galerie = sansNotes(lire("src/components/GalerieQuiDefile.tsx"));
//  ⚠️ CELUI-CI SE LIT AVEC SES NOTES : c'est la règle de charte du
//  §2-f, écrite en commentaire, qu'on y cherche.
const menu = lire("src/components/MenuDeroulant.tsx");
const menuNu = sansNotes(menu);
const pageServeur = sansNotes(lire("src/app/(tatouage)/mes-favoris/page.tsx"));
const pageFavoris = sansNotes(lire("src/components/PageFavoris.tsx"));

const ROSE = "#EE3D6F";
const GRIS_DOUX = "rgb(168, 168, 176)"; //  #A8A8B0

/* ==================================================================
 * D'ABORD, LA VÉRITÉ SUR CE CONTENEUR
 * ================================================================== */
titre("La page de la passe est-elle atteignable ici ?");
const reponse = await fetch(`${BASE}/mes-favoris`, { redirect: "manual" });
verif(
  "« Ma sélection » répond 307 sans session : rien de cette passe ne " +
    "pourra être vu peint sur sa propre page",
  reponse.status === 307,
  `${reponse.status} → ${reponse.headers.get("location")}`
);

/* ==================================================================
 * §2 — LA RÈGLE, EXÉCUTÉE SUR LES TROIS CAS DEMANDÉS
 * ================================================================== */
titre("§2-c — trois cas : aucun mode déclaré, un seul, tous");

/** Un portfolio suivi, réduit à ce que la règle du §2 regarde. */
const suivi = (id, typeFiche, etablissement, genres) => ({
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
  modes: genres.map((genre, rang) => ({
    id: `${id}-${rang}`,
    genre,
    role: null,
    salon_id: null,
  })),
  //  UNE PUBLICATION, pour que le menu « Styles » existe aussi : le
  //  §2-a porte sur LUI, il ne se vérifie pas sur une liste vide.
  recentes: [
    { id: `${id}-p`, url: "", miniature: "", style: "maori", rendu: "color", nature: "tatouage", ordre: 0 },
  ],
  nouveautes: 0,
});

const CAS = {
  //  (a) AUCUN MODE DÉCLARÉ : trois artistes, aucun mode, aucun lieu.
  aucun: [
    suivi("a1", "artiste", "", []),
    suivi("a2", "artiste", "", []),
    suivi("a3", "artiste", "", []),
  ],
  //  (b) UN SEUL : un artiste, un seul mode. Rien d'autre.
  unSeul: [suivi("b1", "artiste", "", ["guest"])],
  //  (c) TOUS : les quatre modes d'artiste ET les deux genres de lieu.
  tous: [
    suivi("c1", "artiste", "", ["domicile", "guest"]),
    suivi("c2", "artiste", "", ["prive"]),
    suivi("c3", "artiste", "", ["salon", "domicile"]),
    suivi("c4", "salon", "prive", []),
    suivi("c5", "salon", "salon", []),
    suivi("c6", "salon", "salon", []),
  ],
};

const profilDe = (liste) => entreesDuProfil(comptesDesSuivis(liste));

{
  //  (a) AUCUN MODE — pas une entrée, donc pas de menu « Profil ».
  const aucun = profilDe(CAS.aucun);
  verif(
    "AUCUN MODE DÉCLARÉ : le menu « Profil » ne s'affiche pas du tout",
    aucun.length === 0,
    `${aucun.length} entrée(s)`
  );
  verif(
    "…et il ne reste donc QU'UN SEUL groupe : la règle de la nº 304 " +
      "rouvre le menu sans flèche, d'elle-même (§2-g)",
    new Set(
      [...entreesDesStyles(comptesDesSuivis(CAS.aucun)), ...aucun]
        .map((e) => e.groupe)
        .filter(Boolean)
    ).size <= 1,
    "un groupe au plus"
  );

  /*  ⚠️ AMENDÉ À LA nº 317. Chaque sous-groupe a désormais une TÊTE
      (« Tous les artistes », « Tous les lieux ») posée EN PREMIER,
      comme « Toutes les réalisations » sur l'onglet des favoris. Les
      comptes de ce banc en gagnent donc un par sous-groupe présent.
      LA MESURE EST RENDUE, PAS RETIRÉE : ce que ces contrôles
      éprouvent — un seul mode déclaré ne remplit qu'un sous-titre,
      l'autre n'apparaît pas — est vérifié à l'identique. */
  //  (b) UN SEUL — sa tête et son entrée, sous le seul sous-titre ARTISTE.
  const unSeul = profilDe(CAS.unSeul);
  verif(
    "UN SEUL MODE : sa tête et son entrée, sous le seul sous-titre ARTISTE",
    unSeul.length === 2 &&
      unSeul.map((e) => e.label).join(" · ") === "Tous les artistes · Guest" &&
      unSeul.every(
        (e) =>
          e.sousGroupe === SOUS_TITRE_ARTISTE && e.groupe === GROUPE_PROFIL
      ),
    `${unSeul.map((e) => `${e.sousGroupe}/${e.label}`).join(" · ")}`
  );
  verif(
    "…et le sous-titre LIEU n'apparaît pas : aucune de ses options " +
      "n'existe (§2-c)",
    unSeul.every((e) => e.sousGroupe !== SOUS_TITRE_LIEU),
    "aucun sous-titre LIEU"
  );

  //  (c) TOUS — les six entrées de la consigne, plus les deux TÊTES
  //  posées à la nº 317, chacune en tête de son sous-groupe.
  const tous = profilDe(CAS.tous);
  verif(
    "TOUS : les six entrées, dans l'ordre exact de la consigne — chaque " +
      "sous-groupe précédé de sa tête (nº 317)",
    tous.map((e) => e.label).join(" · ") ===
      "Tous les artistes · À domicile · En studio · En salon · Guest · " +
        "Tous les lieux · Studio · Salon",
    tous.map((e) => e.label).join(" · ")
  );
  verif(
    "…rangées sous leurs deux sous-titres : cinq sous ARTISTE (sa tête " +
      "comprise), trois sous LIEU",
    tous.filter((e) => e.sousGroupe === SOUS_TITRE_ARTISTE).length === 5 &&
      tous.filter((e) => e.sousGroupe === SOUS_TITRE_LIEU).length === 3,
    `${SOUS_TITRE_ARTISTE} ×5 · ${SOUS_TITRE_LIEU} ×3`
  );
  verif(
    "§2-d — CHAQUE ENTRÉE PORTE SON NOMBRE, et il dit vrai",
    tous.map((e) => `${e.label}:${e.compte}`).join(" · ") ===
      "Tous les artistes:3 · À domicile:2 · En studio:1 · En salon:1 · " +
        "Guest:1 · Tous les lieux:3 · Studio:1 · Salon:2",
    tous.map((e) => `${e.label}:${e.compte}`).join(" · ")
  );
  /*  ⚠️ AMENDÉ À LA nº 317 : le drapeau `sousGroupeGris` s'appelle
      désormais `sousTitre`, et il dit plus que la couleur — ces
      sous-sections ne sont plus des portes du tout. La mesure est
      rendue : on éprouve toujours que les deux sous-titres se
      distinguent des options, sur le nom d'aujourd'hui. */
  verif(
    "…et les deux sous-titres se déclarent comme tels (§2-f, nº 317)",
    tous.every((e) => e.sousTitre === true),
    "sousTitre sur les huit"
  );
  //  UN ARTISTE QUI CUMULE COMPTE SOUS CHACUN DE SES MODES, mais UNE
  //  SEULE FOIS PAR MODE — c'est ce que « c1 » et « c3 » éprouvent.
  //  ⚠️ AMENDÉ À LA nº 317 : la tête du sous-groupe est une clé comme
  //  les autres, posée par la même fonction — elle ouvre donc la liste.
  verif(
    "un portfolio qui cumule deux modes apparaît sous les deux, une fois " +
      "sous chacun — et sous la tête de son sous-groupe",
    clesDuProfil(CAS.tous[0]).join(" ") ===
      `${TOUS_LES_ARTISTES} ${cleProfilMode("domicile")} ${cleProfilMode(
        "guest"
      )}`,
    clesDuProfil(CAS.tous[0]).join(" · ")
  );
  verif(
    "un LIEU ne porte QUE son genre : il n'a pas de mode d'exercice",
    clesDuProfil(CAS.tous[3]).join(" ") ===
      `${TOUS_LES_LIEUX} ${cleProfilLieu("prive")}` &&
      clesDuProfil(CAS.tous[4]).join(" ") ===
        `${TOUS_LES_LIEUX} ${cleProfilLieu("salon")}`,
    `${clesDuProfil(CAS.tous[3])} · ${clesDuProfil(CAS.tous[4])}`
  );
}

/* ==================================================================
 * §2-a · §2-e — LE PREMIER MENU NOMMÉ, ET LE FILTRE QUI SUIT
 * ================================================================== */
titre("§2-a et §2-e — « Styles » reçoit son titre, et choisir filtre");
{
  const styles = entreesDesStyles(comptesDesSuivis(CAS.tous));
  verif(
    "§2-a — toutes les entrées du menu existant portent le titre « Styles »",
    styles.length === 0 || styles.every((e) => e.groupe === GROUPE_STYLES),
    `${styles.length} entrée(s), groupe « ${styles[0]?.groupe ?? "—"} »`
  );

  //  §2-e — LE FILTRAGE, sur les mêmes données que le comptage.
  const choisir = (valeur) =>
    suivisDuChoix(CAS.tous, lireSelection(`?selection=suivis:${valeur}`));
  const domicile = choisir("mode:domicile");
  const lieuSalon = choisir("lieu:salon");
  verif(
    "§2-e — choisir « À domicile » ne garde que les portfolios concernés",
    domicile.map((s) => s.id).join(",") === "c1,c3",
    `${domicile.length} portfolio(s) : ${domicile.map((s) => s.id).join(", ")}`
  );
  verif(
    "§2-e — choisir « Salon » ne garde que les salons",
    lieuSalon.map((s) => s.id).join(",") === "c5,c6",
    `${lieuSalon.length} portfolio(s) : ${lieuSalon.map((s) => s.id).join(", ")}`
  );
  verif(
    "LE NOMBRE ANNONCÉ EST EXACTEMENT CE QUI S'AFFICHE — même fonction " +
      "pour compter et pour filtrer",
    profilDe(CAS.tous).every(
      (entree) => choisir(entree.value.replace(/^/, "")).length === entree.compte
    ),
    "les six entrées vérifiées une à une"
  );
  verif(
    "sans profil ni style, la liste entière revient",
    suivisDuChoix(CAS.tous, lireSelection("?selection=suivis")).length === 6,
    "6 portfolios"
  );
}

/* ==================================================================
 * §2 — L'ADRESSE : UN STYLE OU UN PROFIL, JAMAIS LES DEUX
 * ================================================================== */
titre("§2 — la lecture de l'adresse, et le mot du champ");
{
  const profil = lireSelection("?selection=suivis:mode:domicile");
  const style = lireSelection("?selection=suivis:maori");
  const faux = lireSelection("?selection=suivis:mode:nimporte-quoi");
  verif(
    "un profil se lit comme un profil, et efface le style",
    profil.profil === "mode:domicile" && profil.style === "",
    `profil « ${profil.profil} » · style « ${profil.style} »`
  );
  verif(
    "un style se lit comme un style, et n'invente aucun profil",
    style.style === "maori" && style.profil === "",
    `style « ${style.style} » · profil « ${style.profil} »`
  );
  verif(
    "un profil INCONNU ne casse rien : il ne comptera simplement aucune " +
      "entrée, et l'écran est vide — jamais faux",
    faux.profil === "mode:nimporte-quoi" &&
      suivisDuChoix(CAS.tous, faux).length === 0,
    "0 portfolio, aucune erreur"
  );
  verif(
    "le champ retrouve sa valeur : l'aller-retour adresse → menu est juste",
    valeurDuMenu(profil, "suivis") === "mode:domicile" &&
      valeurDuMenu(style, "suivis") === "maori",
    `${valeurDuMenu(profil, "suivis")} · ${valeurDuMenu(style, "suivis")}`
  );
  verif(
    "et il s'écrit avec les mots du site, jamais des seconds",
    libelleDuProfil("mode:domicile") === "À domicile" &&
      libelleDuProfil("mode:prive") === "En studio" &&
      libelleDuProfil("lieu:prive") === "Studio" &&
      libelleDuProfil("lieu:salon") === "Salon",
    "À domicile · En studio · Studio · Salon"
  );
  verif(
    "les favoris ne connaissent aucun profil : leur menu compte des photos",
    lireSelection("?selection=favoris:flash:maori").profil === "",
    "profil vide sur « favoris »"
  );
}

/* ==================================================================
 * À LA SOURCE — LE RÉEMPLOI, ET LES RÈGLES ÉCRITES
 * ================================================================== */
titre("À la source — rien de dessiné deux fois, et la charte écrite");
{
  //  §2-h — AUCUN SECOND MÉCANISME.
  verif(
    "§2-h — le second menu réemploie les groupes et sous-portes des " +
      "favoris : aucun composant neuf",
    !/function Menu(Profil|Deux)/.test(menuNu) &&
      /sousGroupe/.test(menuNu) &&
      /portesDeGroupe/.test(menuNu),
    "MenuDeroulant, tel quel"
  );
  /*  ⚠️ AMENDÉ À LA nº 317. La règle n'a pas changé d'un caractère,
      elle a CHANGÉ DE MAISON : elle vit dans `lib/repli-menu`, où un
      banc peut l'exécuter plutôt que la relire. C'est là qu'on la
      cherche désormais — et le contrôle éprouve en plus que le menu ne
      s'en est pas gardé une seconde écriture. */
  verif(
    "§2-g — la règle de la nº 304 est intacte : à un seul groupe, aucune " +
      "porte",
    /new Set\(options\.map\(\(option\) => option\.groupe\)\.filter\(Boolean\)\)\.size > 1/.test(
      sansNotes(lire("src/lib/repli-menu.ts"))
    ) && /aDesPortesDeGroupe\(options, repliable\)/.test(menuNu),
    "portesDeGroupe = plus d'un groupe (lib/repli-menu)"
  );
  //  §1-b — LA MÊME SOURCE, PAS UNE SECONDE.
  verif(
    "§1-b — la feuille du bas écrit `option.compte`, celui du panneau du " +
      "web : une seule source",
    (menuNu.match(/\{option\.compte\}/g) ?? []).length === 2 &&
      (menuNu.match(/option\.compte !== undefined/g) ?? []).length >= 2,
    "deux rendus, un seul champ"
  );
  verif(
    "…et rien n'est recalculé dans le menu : il ne connaît aucune " +
      "fonction de comptage",
    !/comptesDes|compteDuStyle|compteDeLaCategorie/.test(menuNu),
    "MenuDeroulant ne compte rien"
  );
  verif(
    "…dans la MÊME écriture que le web : gris doux, 12,5 px, chiffres à " +
      "chasse fixe",
    (
      menuNu.match(
        /shrink-0 pl-3 text-\[12\.5px\] text-sombre-texte-doux tabular-nums/g
      ) ?? []
    ).length === 2,
    "la classe du nombre, à l'identique aux deux endroits"
  );
  //  §2-f — LE GRIS, LE POINT, ET LA RÈGLE.
  //  ⚠️ AMENDÉ À LA nº 317 : le drapeau s'appelle `sousTitre`, et il
  //  emporte plus que la couleur — ces sous-sections ne sont plus des
  //  portes. Ce que ce contrôle éprouve ne change pas : le gris est
  //  DEMANDÉ PAR L'ENTRÉE, jamais écrit en dur dans le menu.
  verif(
    "§2-f — le gris du sous-titre est un DRAPEAU DE L'ENTRÉE, pas une " +
      "exception écrite dans le menu",
    /option\.sousTitre/.test(menuNu) && /text-sombre-texte-doux/.test(menuNu),
    "sousTitre → text-sombre-texte-doux"
  );
  const normalise = (t) =>
    t
      .replace(/^\s*\*[ \t]?/gm, " ")
      .replace(/^\s*\/\/[ \t]?/gm, " ")
      .replace(/\s+/g, " ");
  const regle = normalise(menu);
  //  ⚠️ AMENDÉ À LA nº 317 : la règle a suivi le point rose dans la
  //  note de `sousTitreDeSection`, et sa dernière phrase porte
  //  désormais les DEUX passes. Les quatre phrases de fond, elles,
  //  sont cherchées mot pour mot, comme avant.
  const morceaux = [
    "CE POINT ROSE EST UN EMPLOI PRÉVU DE LA CHARTE, PAS UNE DÉRIVE",
    "le même usage que le point de la porte de famille « Cultures du monde »",
    "le rose y dit « ceci ouvre un niveau », il ne désigne jamais une sélection",
    "AUCUNE PASSE FUTURE NE DOIT L'EFFACER AU NOM DE LA CHARTE",
    "décision du propriétaire, passe nº 316",
  ].map(normalise);
  const manquants = morceaux.filter((m) => !regle.toLowerCase().includes(m.toLowerCase()));
  verif(
    "§2-f — LE COMMENTAIRE DE CHARTE EST ÉCRIT DANS LE CODE, phrase par " +
      "phrase",
    manquants.length === 0,
    manquants.length ? `manque : ${manquants.join(" / ")}` : "les cinq phrases"
  );
  verif(
    "§2-f — le point est peint au jeton rose de la charte, jamais recopié",
    /backgroundColor: COULEURS\.primaire/.test(menuNu) &&
      COULEURS.primaire === ROSE,
    `COULEURS.primaire = ${COULEURS.primaire}`
  );
  //  §1-a — UN RÉGLAGE, ET LE DÉFAUT INTACT.
  verif(
    "§1-a — l'écart est passé en RÉGLAGE, comme la taille des chevrons",
    /ecart="gap-\[3px\] lg:gap-1\.5"/.test(blocSuivis),
    'ecart="gap-[3px] lg:gap-1.5"'
  );
  verif(
    "§1-a — le DÉFAUT du composant partagé n'est pas touché : la fiche " +
      "ne sent rien",
    /ECART_GALERIE = "gap-1\.5"/.test(galerie),
    'ECART_GALERIE = "gap-1.5"'
  );
  //  LES DEUX BRANCHEMENTS DE LA PAGE.
  verif(
    "les deux listes du menu des portfolios viennent de LA MÊME table de " +
      "comptes",
    /const comptesSuivis = comptesDesSuivis\(suivis\)/.test(pageServeur) &&
      /entreesDesStyles\(comptesSuivis\)/.test(pageServeur) &&
      /entreesDuProfil\(comptesSuivis\)/.test(pageServeur),
    "un seul comptesDesSuivis, deux listes"
  );
  verif(
    "et le profil voyage jusqu'au filtre de la page",
    /suivisDuChoix\(suivis, \{ nature, style, profil \}\)/.test(pageFavoris),
    "PageFavoris passe le profil"
  );
}

/* ==================================================================
 * EN VIVANT — CE QUE VALENT LES CLASSES, DANS LE VRAI NAVIGATEUR
 * ================================================================== */
/*  ⚠️ CE QUE CETTE SECTION MESURE, ET CE QU'ELLE NE MESURE PAS. Elle
    ne montre PAS « Ma sélection » : cette page est derrière une
    session (voir plus haut). Elle pose, dans une VRAIE page du site,
    des éléments portant EXACTEMENT les classes que le nouveau code
    émet, et lit ce que LA FEUILLE DE STYLE COMPILÉE leur donne. Ce
    n'est pas une preuve que la page est belle ; c'en est une que les
    classes existent dans le build et valent les nombres annoncés. */
const sonde = `
  <div id="sonde-p316">
    <div data-avant style="display:flex" class="gap-1.5"><i></i><i></i></div>
    <div data-apres style="display:flex" class="gap-[3px] lg:gap-1.5"><i></i><i></i></div>
    <span data-gris class="text-sombre-texte-doux">ARTISTE</span>
    <span data-nombre class="shrink-0 pl-3 text-[12.5px] text-sombre-texte-doux tabular-nums">12</span>
  </div>`;

const releve = () => {
  const bloc = document.querySelector("#sonde-p316");
  const st = (sel, prop) => getComputedStyle(bloc.querySelector(sel))[prop];
  return {
    avant: st("[data-avant]", "columnGap"),
    apres: st("[data-apres]", "columnGap"),
    gris: st("[data-gris]", "color"),
    tailleNombre: st("[data-nombre]", "fontSize"),
    couleurNombre: st("[data-nombre]", "color"),
    chiffres: st("[data-nombre]", "fontVariantNumeric"),
  };
};

titre("§1-a au doigt (390 × 844) — l'écart, mesuré sur la feuille compilée");
const doigt = await ouvrirLeNavigateur(
  "p316m",
  { width: 390, height: 844 },
  { hasTouch: true, isMobile: true, deviceScaleFactor: 3 }
);
let auDoigt;
{
  await doigt.page.goto(BASE + "/", { waitUntil: "networkidle" });
  await doigt.page.evaluate((html) => {
    document.body.insertAdjacentHTML("beforeend", html);
  }, sonde);
  auDoigt = await doigt.page.evaluate(releve);
  verif(
    "AVANT : l'écart partagé valait 6 px",
    auDoigt.avant === "6px",
    `gap-1.5 → ${auDoigt.avant}`
  );
  verif(
    "APRÈS : au doigt, il vaut 3 px — la moitié, exactement",
    auDoigt.apres === "3px",
    `gap-[3px] lg:gap-1.5 → ${auDoigt.apres}`
  );
  verif(
    "§2-f — le gris du sous-titre est celui des textes discrets du site",
    auDoigt.gris === GRIS_DOUX,
    `${auDoigt.gris} (#A8A8B0)`
  );
  verif(
    "§1-b — le nombre s'écrit en 12,5 px, gris doux, chiffres à chasse fixe",
    auDoigt.tailleNombre === "12.5px" &&
      auDoigt.couleurNombre === GRIS_DOUX &&
      auDoigt.chiffres.includes("tabular-nums"),
    `${auDoigt.tailleNombre} · ${auDoigt.couleurNombre} · ${auDoigt.chiffres}`
  );
}
await doigt.ctx.close();
await doigt.nav.close();

titre("§1-a en web (1440 × 823) — le web n'a pas bougé");
{
  const web = await ouvrirLeNavigateur("p316w", { width: 1440, height: 823 });
  await web.page.goto(BASE + "/", { waitUntil: "networkidle" });
  await web.page.evaluate((html) => {
    document.body.insertAdjacentHTML("beforeend", html);
  }, sonde);
  const enWeb = await web.page.evaluate(releve);
  verif(
    "LE WEB GARDE SES 6 px : la valeur était partagée, elle ne l'est plus " +
      "que là où on n'y touche pas",
    enWeb.apres === "6px" && enWeb.avant === "6px",
    `avant ${enWeb.avant} · après ${enWeb.apres}`
  );
  verif(
    "…et l'écart doigt/web est donc bien du simple au double",
    Number.parseFloat(enWeb.apres) === 2 * Number.parseFloat(auDoigt.apres),
    `${auDoigt.apres} au doigt · ${enWeb.apres} en web`
  );
  await web.ctx.close();
  await web.nav.close();
}

nonJoue(
  "TOUT LE §1-b ET LE §2 PEINTS SUR LEUR PAGE",
  "« Ma sélection » (/mes-favoris) exige une session Supabase signée par " +
    "le serveur : ce conteneur ne peut pas la signer, et la page répond " +
    "307 (vérifié à chaque exécution, première section). JE N'AI DONC VU " +
    "NI les nombres dans la feuille du bas, NI le menu « Profil », NI ses " +
    "deux sous-titres gris à point rose. Ce qui est prouvé à la place : " +
    "toute la règle du §2 est EXÉCUTÉE (comptes, entrées, filtrage, " +
    "lecture d'adresse), et les classes que le code émet sont MESURÉES " +
    "dans un vrai navigateur sur la feuille compilée du site. Le rendu " +
    "final reste à valider par le propriétaire, sur son écran"
);

nonJoue(
  "WEBKIT",
  "ce conteneur n'a que Chromium. Les mesures ci-dessus valent pour " +
    "Chromium et pour lui seul — ce n'est une preuve ni pour Safari, ni " +
    "pour l'iPhone du propriétaire"
);

process.exit(bilan());
