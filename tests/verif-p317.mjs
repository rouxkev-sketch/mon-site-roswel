/**
 * BANC DE LA PASSE Nº 317 — LIVRAISON RAPIDE
 * ==================================================================
 * §1   — AUCUN MENU N'EST PRÉ-OUVERT, et la règle de la nº 304 tient
 *        encore au cas du groupe unique. Les deux sont désormais des
 *        FONCTIONS PURES (lib/repli-menu) : le banc les EXÉCUTE, sur
 *        les entrées réelles du menu des portfolios suivis.
 * §2-a — « ARTISTE » et « LIEU » ne se plient plus : leurs options
 *        sont visibles dès que « Profil » est ouvert, et « Cultures du
 *        monde » garde sa porte entière.
 * §2-b — LA TYPOGRAPHIE DES SOUS-TITRES est celle des titres de
 *        groupe, MESURÉE côte à côte dans un vrai navigateur — même
 *        taille, même graisse, même chasse, le gris à la place du rose.
 * §2-d — « Tous les artistes » et « Tous les lieux » : leur nombre, et
 *        la preuve que le filtrage y répond exactement.
 *
 * ⚠️ UNE SEULE FENÊTRE PAR APPAREIL : 1440 × 823 (celle du
 * propriétaire) et 390 × 844 au doigt. Aucun balayage de largeurs.
 *
 * ⚠️⚠️ CE QUE CE BANC NE PEUT PAS FAIRE : « MA SÉLECTION »
 * (/mes-favoris) EXIGE UNE SESSION SUPABASE SIGNÉE PAR LE SERVEUR.
 * Sans elle la page répond 307 — vérifié à chaque exécution. Aucune
 * nouveauté de cette passe n'a donc pu être vue PEINTE SUR SA PAGE.
 * C'est très exactement pourquoi les règles du §1 et du §2-a ont été
 * SORTIES du composant à cette passe : ce qui ne peut pas être vu doit
 * au moins pouvoir être JOUÉ. Voir les NON JOUÉES en fin de fichier.
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
  aDesPortesDeGroupe,
  optionSeVoit,
  replieALOuverture,
  sousTitresDe,
} = await import("@/lib/repli-menu");
const {
  entreesDesStyles,
  entreesDuProfil,
  libelleDuProfil,
  lireSelection,
  GROUPE_PROFIL,
  GROUPE_STYLES,
  LIBELLE_TOUS_LES_ARTISTES,
  LIBELLE_TOUS_LES_LIEUX,
  SOUS_TITRE_ARTISTE,
  SOUS_TITRE_LIEU,
  TOUS_LES_ARTISTES,
  TOUS_LES_LIEUX,
} = await import("@/lib/filtres-selection");
const { comptesDesSuivis, suivisDuChoix } = await import(
  "@/lib/selection-suivis"
);

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

//  ⚠️ CELUI-CI SE LIT AVEC SES NOTES : c'est la règle de charte du
//  point rose (nº 316, tenue ici) qu'on y cherche.
const menu = lire("src/components/MenuDeroulant.tsx");
const menuNu = sansNotes(menu);
const repli = sansNotes(lire("src/lib/repli-menu.ts"));

const GRIS_DOUX = "rgb(168, 168, 176)"; //  #A8A8B0
const ROSE = "rgb(238, 61, 111)"; //  #EE3D6F

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

/* ------------------------------------------------------------------
 * LES ENTRÉES RÉELLES DU MENU, bâties comme la page serveur les bâtit
 * ------------------------------------------------------------------ */
const suivi = (id, typeFiche, etablissement, genres, style = "maori") => ({
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

//  LE CAS COMPLET : quatre artistes (dont deux qui cumulent), trois
//  lieux — et un artiste QUI N'A DÉCLARÉ AUCUN MODE, exprès.
const SUIVIS = [
  suivi("c1", "artiste", "", ["domicile", "guest"]),
  suivi("c2", "artiste", "", ["prive"]),
  suivi("c3", "artiste", "", ["salon", "domicile"], "realisme"),
  suivi("c0", "artiste", "", []),
  suivi("c4", "salon", "prive", []),
  suivi("c5", "salon", "salon", []),
  suivi("c6", "salon", "salon", [], "realisme"),
];
const comptes = comptesDesSuivis(SUIVIS);
const ENTREES = [...entreesDesStyles(comptes), ...entreesDuProfil(comptes)];

//  ET LE CAS DU GROUPE UNIQUE : personne n'a déclaré de mode, aucun
//  lieu n'est suivi — « Styles » reste seul.
const SUIVIS_SANS_PROFIL = [
  suivi("s1", "artiste", "", []),
  suivi("s2", "artiste", "", [], "realisme"),
];
const comptesSeuls = comptesDesSuivis(SUIVIS_SANS_PROFIL);
const ENTREES_SEULES = [
  ...entreesDesStyles(comptesSeuls),
  ...entreesDuProfil(comptesSeuls),
];

/* ==================================================================
 * §1 — RIEN N'EST PRÉ-OUVERT
 * ================================================================== */
titre("§1 — à l'ouverture, les deux groupes sont fermés");
{
  //  L'ÉTAT D'OUVERTURE DU FILTRE : aucune valeur (voir `valeurDuMenu`
  //  sur un choix vierge).
  const arrivee = replieALOuverture(ENTREES, "");
  verif(
    "à l'arrivée, AUCUN groupe n'est ouvert — ni « Styles », ni « Profil »",
    arrivee.groupe === null && arrivee.sousGroupe === null,
    `groupe ${arrivee.groupe} · sous-groupe ${arrivee.sousGroupe}`
  );
  //  LE DÉFAUT EXACT QUE CETTE PASSE CORRIGE : la tête « Tous les
  //  styles » a une valeur VIDE, et c'est elle qu'on trouvait.
  const tete = ENTREES.find((e) => e.value === "");
  verif(
    "…alors que le menu contient bien une entrée à valeur VIDE — c'était " +
      "elle, la cause : « Tous les styles » se faisait passer pour le " +
      "choix courant",
    Boolean(tete) && tete.groupe === GROUPE_STYLES,
    `« ${tete?.label} » (valeur vide, groupe « ${tete?.groupe}` + " »)"
  );
  //  ET LE COMPORTEMENT NORMAL N'A PAS BOUGÉ : un vrai choix rouvre
  //  son groupe, et sa famille.
  const surUnProfil = replieALOuverture(ENTREES, "mode:domicile");
  verif(
    "un VRAI choix, lui, rouvre son groupe et son sous-groupe — rien n'a " +
      "été cassé",
    surUnProfil.groupe === GROUPE_PROFIL &&
      surUnProfil.sousGroupe === SOUS_TITRE_ARTISTE,
    `${surUnProfil.groupe} / ${surUnProfil.sousGroupe}`
  );
  const surUnStyle = replieALOuverture(ENTREES, "maori");
  verif(
    "…et un style rouvre « Styles »",
    surUnStyle.groupe === GROUPE_STYLES,
    `${surUnStyle.groupe}`
  );

  //  LA RÈGLE DE LA nº 304, SUR LES DEUX CAS.
  verif(
    "DEUX groupes : les portes existent, donc les flèches aussi",
    aDesPortesDeGroupe(ENTREES, true) === true,
    `${new Set(ENTREES.map((e) => e.groupe)).size} groupes`
  );
  verif(
    "UN SEUL groupe (aucun profil déclaré) : AUCUNE porte — l'en-tête " +
      "redevient une étiquette et tout reste ouvert",
    aDesPortesDeGroupe(ENTREES_SEULES, true) === false &&
      new Set(ENTREES_SEULES.map((e) => e.groupe).filter(Boolean)).size === 1,
    "un seul groupe, aucune flèche"
  );
  /*  ⚠️ « SES OPTIONS » VEUT DIRE CELLES DU GROUPE, PAS CELLES D'UNE
      FAMILLE. La règle de la nº 304 retire la porte DE GROUPE ; elle
      ne touche pas aux sous-portes — « Cultures du monde » en est une
      vraie, onze styles derrière, et elle garde la sienne. Un style
      rangé dans une famille reste donc caché tant qu'on n'ouvre pas
      la famille : c'est écrit dans la note de la nº 304, et c'est ce
      qu'on éprouve ici. */
  const visibleSansRienOuvrir = (option) =>
    optionSeVoit(option, {
      repliable: true,
      portesDeGroupe: aDesPortesDeGroupe(ENTREES_SEULES, true),
      groupeDeplie: null,
      sousGroupeDeplie: null,
      sousTitres: sousTitresDe(ENTREES_SEULES),
    });
  const horsFamille = ENTREES_SEULES.filter((e) => !e.sousGroupe);
  verif(
    "…et ses options se voient toutes, sans rien ouvrir",
    horsFamille.length > 0 && horsFamille.every(visibleSansRienOuvrir),
    `${horsFamille.length} entrée(s) de premier niveau, visibles d'emblée`
  );
  verif(
    "…tandis qu'une FAMILLE de styles garde sa porte, même à groupe " +
      "unique (la nº 304 ne l'a jamais touchée)",
    ENTREES_SEULES.filter((e) => e.sousGroupe).every(
      (e) => !visibleSansRienOuvrir(e)
    ),
    `${ENTREES_SEULES.filter((e) => e.sousGroupe).length} style(s) en famille, encore rangés`
  );
  verif(
    "à DEUX groupes fermés, en revanche, RIEN ne se voit — c'est bien " +
      "l'écran d'arrivée du §1",
    ENTREES.every(
      (option) =>
        !optionSeVoit(option, {
          repliable: true,
          portesDeGroupe: true,
          groupeDeplie: null,
          sousGroupeDeplie: null,
          sousTitres: sousTitresDe(ENTREES),
        })
    ),
    "aucune option visible tant qu'on n'a rien ouvert"
  );
}

/* ==================================================================
 * §2-a — LES SOUS-TITRES NE SE PLIENT PLUS
 * ================================================================== */
titre("§2-a — « ARTISTE » et « LIEU » ne se plient plus");
{
  const sousTitres = sousTitresDe(ENTREES);
  verif(
    "les deux sous-titres sont reconnus comme tels, et EUX SEULS",
    sousTitres.size === 2 &&
      sousTitres.has(SOUS_TITRE_ARTISTE) &&
      sousTitres.has(SOUS_TITRE_LIEU),
    [...sousTitres].join(" · ")
  );
  //  « PROFIL » OUVERT, AUCUNE SOUS-PORTE OUVERTE : tout se voit.
  const etat = {
    repliable: true,
    portesDeGroupe: true,
    groupeDeplie: GROUPE_PROFIL,
    sousGroupeDeplie: null,
    sousTitres,
  };
  const duProfil = ENTREES.filter((e) => e.groupe === GROUPE_PROFIL);
  verif(
    "« Profil » ouvert : TOUTES ses entrées se voient, sans rien déplier " +
      "de plus",
    duProfil.length > 0 && duProfil.every((option) => optionSeVoit(option, etat)),
    `${duProfil.length} entrée(s) visibles`
  );
  verif(
    "…et celles de « Styles » restent cachées : le groupe fermé, lui, " +
      "cache toujours",
    ENTREES.filter((e) => e.groupe === GROUPE_STYLES).every(
      (option) => !optionSeVoit(option, etat)
    ),
    "aucune entrée de « Styles » visible"
  );
  //  « CULTURES DU MONDE » GARDE SA PORTE : elle ne porte pas le
  //  drapeau, donc elle se replie comme avant.
  const famille = ENTREES.find(
    (e) => e.sousGroupe && !sousTitres.has(e.sousGroupe)
  );
  if (famille) {
    const ferme = optionSeVoit(famille, {
      repliable: true,
      portesDeGroupe: true,
      groupeDeplie: GROUPE_STYLES,
      sousGroupeDeplie: null,
      sousTitres,
    });
    const ouvert = optionSeVoit(famille, {
      repliable: true,
      portesDeGroupe: true,
      groupeDeplie: GROUPE_STYLES,
      sousGroupeDeplie: famille.sousGroupe,
      sousTitres,
    });
    verif(
      `« ${famille.sousGroupe} » GARDE SA PORTE : cachée fermée, visible ` +
        "ouverte — rien ne lui a été pris",
      ferme === false && ouvert === true,
      `fermée : ${ferme} · ouverte : ${ouvert}`
    );
  } else {
    verif(
      "une famille de styles est présente pour éprouver la porte restante",
      false,
      "aucune sous-porte de famille dans ce jeu"
    );
  }
}

/* ==================================================================
 * §2-d — LES DEUX TÊTES, ET LEUR NOMBRE
 * ================================================================== */
titre("§2-d — « Tous les artistes » et « Tous les lieux »");
{
  const profil = entreesDuProfil(comptes);
  verif(
    "elles existent, et EN PREMIER dans leur sous-groupe",
    profil[0]?.value === TOUS_LES_ARTISTES &&
      profil[0]?.label === LIBELLE_TOUS_LES_ARTISTES &&
      profil.findIndex((e) => e.value === TOUS_LES_LIEUX) ===
        profil.findIndex((e) => e.sousGroupe === SOUS_TITRE_LIEU),
    profil.map((e) => `${e.sousGroupe}/${e.label}`).join(" · ")
  );
  const tousArtistes = profil.find((e) => e.value === TOUS_LES_ARTISTES);
  const tousLieux = profil.find((e) => e.value === TOUS_LES_LIEUX);
  verif(
    "« Tous les artistes » porte son nombre : les 3 artistes qui ONT " +
      "déclaré un mode (celui qui n'en a aucun n'est nulle part)",
    tousArtistes?.compte === 3,
    `${tousArtistes?.compte}`
  );
  verif(
    "« Tous les lieux » porte le sien : les 3 lieux suivis",
    tousLieux?.compte === 3,
    `${tousLieux?.compte}`
  );
  //  LA PREUVE QUE LE NOMBRE NE MENT PAS : on filtre, on compte.
  const filtre = (valeur) =>
    suivisDuChoix(SUIVIS, lireSelection(`?selection=suivis:${valeur}`));
  const artistes = filtre(TOUS_LES_ARTISTES);
  const lieux = filtre(TOUS_LES_LIEUX);
  verif(
    "…et le filtrage rend EXACTEMENT ce nombre d'artistes",
    artistes.length === tousArtistes?.compte &&
      artistes.map((s) => s.id).join(",") === "c1,c2,c3",
    `${artistes.length} : ${artistes.map((s) => s.id).join(", ")}`
  );
  verif(
    "…et exactement ce nombre de lieux",
    lieux.length === tousLieux?.compte &&
      lieux.map((s) => s.id).join(",") === "c4,c5,c6",
    `${lieux.length} : ${lieux.map((s) => s.id).join(", ")}`
  );
  verif(
    "elles sélectionnent bien TOUT leur sous-groupe, jamais l'autre",
    artistes.every((s) => s.typeFiche === "artiste") &&
      lieux.every((s) => s.typeFiche !== "artiste"),
    "aucun mélange"
  );
  verif(
    "leurs mots viennent de l'écriture unique, comme le champ les lira",
    libelleDuProfil(TOUS_LES_ARTISTES) === LIBELLE_TOUS_LES_ARTISTES &&
      libelleDuProfil(TOUS_LES_LIEUX) === LIBELLE_TOUS_LES_LIEUX,
    `${libelleDuProfil(TOUS_LES_ARTISTES)} · ${libelleDuProfil(TOUS_LES_LIEUX)}`
  );
  //  §2-e (nº 316, INCHANGÉ) — un sous-titre n'apparaît que si une de
  //  ses options existe. Sans lieu suivi, pas de sous-titre LIEU, donc
  //  pas de « Tous les lieux » non plus.
  const sansLieu = entreesDuProfil(
    comptesDesSuivis(SUIVIS.filter((s) => s.typeFiche === "artiste"))
  );
  verif(
    "§2-e — sans aucun lieu suivi, ni le sous-titre LIEU ni sa tête " +
      "n'apparaissent",
    sansLieu.every((e) => e.sousGroupe !== SOUS_TITRE_LIEU) &&
      !sansLieu.some((e) => e.value === TOUS_LES_LIEUX),
    `${sansLieu.length} entrée(s), toutes sous ARTISTE`
  );
}

/* ==================================================================
 * À LA SOURCE — CE QUI NE S'EXÉCUTE NI NE SE MESURE
 * ================================================================== */
titre("À la source — plus de porte, plus de clic, et la charte tenue");
{
  verif(
    "§2-a — un sous-titre est un `<p>`, pas un bouton : rien à toucher",
    /function sousTitreDeSection\(/.test(menuNu) &&
      /<p\s+role="presentation"\s+data-sous-titre=/.test(menuNu),
    "sousTitreDeSection rend un <p role=presentation>"
  );
  /*  ⚠️ ON LIT LE CORPS DE LA FONCTION, PAS SES ALENTOURS. Un filet
      de caractères autour de `data-sous-titre` attrapait la fonction
      SUIVANTE (la vraie porte, qui a bien sa flèche et son clic) et
      déclarait un défaut là où il n'y en a pas. On découpe donc
      `sousTitreDeSection` à ses accolades, et on n'y cherche que ce
      qui la concerne. */
  const corpsSousTitre = /function sousTitreDeSection\([\s\S]*?\n  \}/.exec(
    menuNu
  )?.[0];
  verif(
    "§2-a — aucun chevron, aucun `aria-expanded`, aucun `onClick` sur lui",
    Boolean(corpsSousTitre) &&
      !/aria-expanded|onClick|chevron\(|<button/.test(corpsSousTitre),
    "ni flèche, ni pliage, ni clic dans sousTitreDeSection"
  );
  verif(
    "§2-b — il partage L'ÉCRITURE des titres de groupe, par la même " +
      "constante : deux valeurs recopiées finiraient par diverger",
    /const ECRITURE_TITRE_GROUPE =\s*\n?\s*"text-\[13px\] font-bold uppercase tracking-\[0\.08em\]"/.test(
      menuNu
    ) &&
      /\$\{ECRITURE_TITRE_GROUPE\} text-primaire/.test(menuNu) &&
      /\$\{ECRITURE_TITRE_GROUPE\} px-4 pt-3 pb-1/.test(menuNu),
    "une seule chaîne, lue par le titre et par le sous-titre"
  );
  verif(
    "§2-b — et le gris à la place du rose, aux deux appareils",
    (menuNu.match(/text-sombre-texte-doux/g) ?? []).length >= 2,
    "sombre-texte-doux"
  );
  verif(
    "§2-b — AUCUN SOULIGNEMENT : le trait rose reste aux portes, et un " +
      "sous-titre n'en est pas une",
    !/data-sous-titre[\s\S]{0,400}souligne/.test(menuNu),
    "aucun `souligne` sur un sous-titre"
  );
  verif(
    "§2-c — au doigt, il garde le point rose de la nº 316",
    /sousTitreDeSection\(sousEntete, \{\s*avecPoint: true/.test(menuNu),
    "avecPoint sur la feuille du bas"
  );
  //  LA RÈGLE DE CHARTE DU POINT ROSE, TENUE.
  const normalise = (t) =>
    t.replace(/^\s*\*[ \t]?/gm, " ").replace(/^\s*\/\/[ \t]?/gm, " ").replace(/\s+/g, " ");
  const charte = normalise(menu).toLowerCase();
  const morceaux = [
    "ce point rose est un emploi prévu de la charte, pas une dérive",
    "le même usage que le point de la porte de famille « cultures du monde »",
    "le rose y dit « ceci ouvre un niveau », il ne désigne jamais une sélection",
    "aucune passe future ne doit l'effacer au nom de la charte",
  ].map((m) => normalise(m).toLowerCase());
  const manquants = morceaux.filter((m) => !charte.includes(m));
  verif(
    "§2-c — LE COMMENTAIRE DE CHARTE DU POINT ROSE EST TOUJOURS LÀ",
    manquants.length === 0,
    manquants.length ? `manque : ${manquants.join(" / ")}` : "les quatre phrases"
  );
  //  LES RÈGLES SONT SORTIES DU COMPOSANT — c'est ce qui les rend
  //  jouables, et c'est la leçon de cette passe.
  verif(
    "§1 — la règle de repli ne vit plus dans le rendu : le menu la CONSOMME",
    /replieALOuverture\(options, valeur\)/.test(menuNu) &&
      /export function replieALOuverture/.test(repli),
    "lib/repli-menu"
  );
  verif(
    "…et le menu n'en garde aucune seconde écriture",
    !/options\.find\(\(option\) => option\.value === valeur/.test(menuNu) &&
      !/new Set\(options\.map\(\(option\) => option\.groupe\)/.test(menuNu),
    "aucune règle recopiée dans le composant"
  );
}

/* ==================================================================
 * §2-b EN VIVANT — LES DEUX TYPOGRAPHIES, CÔTE À CÔTE
 * ================================================================== */
/*  ⚠️ CE QUE CETTE SECTION MESURE. Elle ne montre PAS « Ma sélection »
    (307, voir plus haut). Elle pose, dans une VRAIE page du site, un
    titre de groupe et un sous-titre portant EXACTEMENT les classes que
    le code émet, et compare ce que LA FEUILLE COMPILÉE leur donne.
    C'est la seule façon de répondre « identiques » à la question du
    §2-b avec des nombres plutôt qu'avec une intention. */
const sonde = `
  <div id="sonde-p317">
    <p data-titre class="text-[13px] font-bold uppercase tracking-[0.08em] text-primaire">PROFIL</p>
    <p data-sous class="text-[13px] font-bold uppercase tracking-[0.08em] text-sombre-texte-doux">ARTISTE</p>
    <button data-option class="text-base">Guest</button>
  </div>`;

const releve = () => {
  const bloc = document.querySelector("#sonde-p317");
  const st = (sel) => {
    const s = getComputedStyle(bloc.querySelector(sel));
    return {
      taille: s.fontSize,
      graisse: s.fontWeight,
      chasse: s.letterSpacing,
      casse: s.textTransform,
      couleur: s.color,
      souligne: s.textDecorationLine,
    };
  };
  return { titre: st("[data-titre]"), sous: st("[data-sous]"), option: st("[data-option]") };
};

titre("§2-b en web (1440 × 823) — sous-titre et titre de groupe, mesurés");
{
  const web = await ouvrirLeNavigateur("p317w", { width: 1440, height: 823 });
  await web.page.goto(BASE + "/", { waitUntil: "networkidle" });
  await web.page.evaluate((html) => {
    document.body.insertAdjacentHTML("beforeend", html);
  }, sonde);
  const m = await web.page.evaluate(releve);
  verif(
    "MÊME TAILLE et MÊME GRAISSE que « Styles » et « Profil »",
    m.sous.taille === m.titre.taille && m.sous.graisse === m.titre.graisse,
    `titre ${m.titre.taille}/${m.titre.graisse} · sous-titre ${m.sous.taille}/${m.sous.graisse}`
  );
  verif(
    "…même chasse et même casse : c'est bien la même écriture",
    m.sous.chasse === m.titre.chasse && m.sous.casse === m.titre.casse,
    `${m.titre.chasse} / ${m.titre.casse}`
  );
  verif(
    "EN GRIS, quand le titre de groupe est rose : c'est tout ce qui les " +
      "sépare",
    m.sous.couleur === GRIS_DOUX && m.titre.couleur === ROSE,
    `sous-titre ${m.sous.couleur} · titre ${m.titre.couleur}`
  );
  verif(
    "SANS SOULIGNEMENT",
    m.sous.souligne === "none",
    m.sous.souligne
  );
  verif(
    "et il reste SOUS la taille d'une entrée : un titre annonce, il ne se " +
      "choisit pas",
    Number.parseFloat(m.sous.taille) < Number.parseFloat(m.option.taille),
    `${m.sous.taille} contre ${m.option.taille}`
  );
  await web.ctx.close();
  await web.nav.close();
}

titre("§2-c au doigt (390 × 844) — le gris du sous-titre, et le point rose");
{
  const doigt = await ouvrirLeNavigateur(
    "p317m",
    { width: 390, height: 844 },
    { hasTouch: true, isMobile: true, deviceScaleFactor: 3 }
  );
  await doigt.page.goto(BASE + "/", { waitUntil: "networkidle" });
  const m = await doigt.page.evaluate(() => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="s"><p data-sous class="min-h-[52px] pl-3 pr-3 text-base text-sombre-texte-doux">ARTISTE</p></div>`
    );
    const n = document.querySelector("#s [data-sous]");
    const s = getComputedStyle(n);
    return { couleur: s.color, taille: s.fontSize, hauteur: s.minHeight };
  });
  verif(
    "au doigt, le sous-titre garde le gris de la nº 316",
    m.couleur === GRIS_DOUX,
    `${m.couleur} (#A8A8B0)`
  );
  verif(
    "…et le rang des entrées voisines : 16 px, 52 px de haut",
    m.taille === "16px" && m.hauteur === "52px",
    `${m.taille} · ${m.hauteur}`
  );
  await doigt.ctx.close();
  await doigt.nav.close();
}

nonJoue(
  "LE MENU PEINT SUR SA PAGE",
  "« Ma sélection » (/mes-favoris) exige une session Supabase signée par " +
    "le serveur : ce conteneur ne peut pas la signer, et la page répond " +
    "307 (vérifié à chaque exécution, première section). JE N'AI DONC VU " +
    "NI les deux groupes fermés à l'ouverture, NI les sous-titres " +
    "posés, NI les deux nouvelles entrées. Ce qui est prouvé à la place : " +
    "les règles du §1 et du §2-a sont désormais des FONCTIONS PURES " +
    "(lib/repli-menu) et le banc les EXÉCUTE sur les entrées réelles du " +
    "menu ; les nombres du §2-d sont exécutés eux aussi, filtrage " +
    "compris ; et les typographies du §2-b sont mesurées dans un vrai " +
    "navigateur sur la feuille compilée. Le rendu final reste à valider " +
    "par le propriétaire, sur son écran"
);

nonJoue(
  "WEBKIT",
  "ce conteneur n'a que Chromium. Les mesures ci-dessus valent pour " +
    "Chromium et pour lui seul — ce n'est une preuve ni pour Safari, ni " +
    "pour l'iPhone du propriétaire"
);

process.exit(bilan());
