/**
 * LES RÉGLAGES DE YOKOFOLIO
 * =========================
 * Tout ce qui se règle sans toucher au code vit ici : la marque, les
 * langues, les styles proposés, les rayons de recherche, les textes et
 * les couleurs du fond sombre.
 *
 * POURQUOI UN FICHIER À PART, et pas dans roswel.ts ? Parce que
 * YOKOFOLIO EST UN PRODUIT À PART ENTIÈRE, avec sa propre identité. Les
 * fichiers des autres produits (artisans, agence) restent dans le code
 * — ils ne sont ni supprimés, ni modifiés — mais AUCUNE page de
 * yokofolio ne doit les afficher ni y renvoyer.
 *
 * Le rose vient encore de roswel.ts (`COULEURS.primaire`) : c'est la
 * couleur, pas la marque. Le jour où yokofolio prendra un autre rose,
 * une seule ligne changera — ici.
 */

/**
 * LA MARQUE
 * ---------
 * Le nom s'écrit « yokofolio », TOUJOURS en minuscules : c'est le nom,
 * pas une phrase à capitaliser.
 *
 * LE LOGO est un fichier déposé à la main par le propriétaire, comme
 * les logos de Roswel : le code ne le fabrique pas, ne le retouche
 * pas, ne le recadre pas. Il l'affiche tel quel. S'il manque du clone,
 * l'image ne s'affiche pas — c'est normal, et ce n'est pas une
 * régression.
 *
 * `icone` sert d'icône d'onglet (favicon) et d'icône d'application. Si
 * le fichier carré n'existe pas, le site retombe automatiquement sur
 * le logo (voir src/app/(tatouage)/layout.tsx) : un logo large fait un
 * favicon médiocre, mais mieux vaut ça que rien.
 */
export const MARQUE_YOKOFOLIO = {
  //  ⚠️ « YokoFolio », Y et F majuscules (passe nº 104) — c'est la
  //  graphie officielle de la marque À L'ÉCRAN. Les identifiants
  //  techniques (chemins, clés, slugs, adresses) restent en minuscules.
  nom: "YokoFolio",
  slogan: "Les portfolios des tatoueurs, par style",
  logo: "/yokofolio-logo.png",
  /** Le CŒUR SEUL, carré : onglet du navigateur et écran d'accueil. */
  icone: "/yokofolio-icone.png",
  /**
   * LA MÊME ICÔNE, AVEC UN NUMÉRO DE VERSION.
   * Les navigateurs gardent l'icône d'onglet très longtemps, et par
   * ADRESSE DU SITE — pas par page. Une icône déjà mémorisée revient
   * donc même après avoir changé le fichier. Le « ?v= » lui donne une
   * adresse neuve : le navigateur est obligé d'aller la rechercher.
   * À incrémenter le jour où l'icône change de dessin.
   */
  iconeOnglet: "/yokofolio-icone.png?v=3",
};

/**
 * LES ICÔNES RONDES OFFICIELLES D'INSTAGRAM ET DE TIKTOK — deux
 * fichiers DÉPOSÉS À LA MAIN par le propriétaire (comme les logos),
 * affichés tels quels sur les fiches. S'ils manquent du clone, ils ne
 * s'affichent pas — c'est normal, pas une régression.
 *
 * Le rond TikTok est NOIR sur notre fond quasi noir : partout où il
 * s'affiche, un FIN LISERÉ CLAIR (ring-1 ring-white/25) le détoure —
 * l'icône elle-même n'est jamais retouchée, la marque reste intacte.
 */
export const ICONES_RESEAUX = {
  instagram: "/icone-instagram.png",
  tiktok: "/icone-tiktok.png",
  // ⚠️ DÉPOSÉE À LA MAIN elle aussi, sous ce nom EXACT : le code ne la
  // fabrique pas et ne l'inclut jamais dans une livraison.
  youtube: "/icone-youtube.png",
};

/**
 * LES COMPTES DU SITE LUI-MÊME — à ne pas confondre avec ceux des
 * tatoueurs. Celui-ci vit dans le pied de page, sur toutes les pages.
 */
export const COMPTES_YOKOFOLIO = {
  instagram: "https://www.instagram.com/yoko.folio/",
};

/**
 * LES LANGUES — la structure est prête, rien n'est branché
 * --------------------------------------------------------
 * Le sélecteur de langue existe et s'ouvre, mais SEUL le français est
 * actif : les autres sont affichées en grisé, non cliquables. C'est un
 * choix assumé — annoncer une langue qu'on ne sert pas est pire que ne
 * rien annoncer.
 *
 * Le jour de l'internationalisation : passer `actif: true` sur une
 * langue et brancher la traduction. Aucun autre fichier ne change.
 */
export const LANGUES_YOKOFOLIO = [
  { code: "fr", label: "Français", actif: true },
  { code: "en", label: "English", actif: false },
  { code: "es", label: "Español", actif: false },
  { code: "de", label: "Deutsch", actif: false },
  { code: "it", label: "Italiano", actif: false },
  { code: "pt", label: "Português", actif: false },
  { code: "ja", label: "日本語", actif: false },
];

/**
 * LES STYLES DE TATOUAGE — la liste à faire évoluer
 * -------------------------------------------------
 * `slug` sert dans les adresses (/tatouage/fine-line/lyon) : une fois
 * publié, un slug ne se change plus sans casser le référencement.
 * `label` est ce qui s'affiche.
 * `couleur` habille les images de démonstration (rectangles colorés)
 * tant qu'aucune vraie photo n'est fournie.
 *
 * Ajouter un style : une ligne de plus, rien d'autre. Le menu de
 * recherche, les badges, les pages style + ville et le plan du site
 * s'y adaptent tout seuls.
 */
/*
 * ⚠️ CETTE LISTE EST UN CATALOGUE, PAS UN ORDRE D'AFFICHAGE (passe
 * nº 113). Elle a longtemps porté l'ordre du menu, décidé à la main ;
 * à trente-huit entrées, un ordre thématique oblige à balayer toute
 * la liste pour retrouver un style. L'AFFICHAGE EST DÉSORMAIS
 * ALPHABÉTIQUE, ET CALCULÉ — voir `stylesAlphabetiques()` et
 * `entreesExplorer()` plus bas. On peut donc ajouter une ligne ici
 * n'importe où : elle se rangera d'elle-même, à sa lettre.
 *
 * « Japonais (Irezumi) » garde le slug historique `japonais` : un slug
 * publié ne change pas (référencement), seul le libellé évolue. Même
 * règle pour tous les autres — les slugs ci-dessous sont gravés dans
 * les adresses, les fiches et les liens déjà partagés.
 *
 * LES SLUGS DES NOUVEAUX suivent la convention des anciens : minuscules,
 * sans accent ni signe diacritique, mots liés par des traits d'union.
 * « Pā Tūtiki » devient donc `pa-tutiki` — un macron ne survit ni à une
 * barre d'adresse, ni à un copier-coller, ni à un clavier français.
 */
export const STYLES_TATOUAGE = [
  { slug: "realisme", label: "Réalisme", couleur: "#3C4650" },
  { slug: "fine-line", label: "Fine Line", couleur: "#6E5B7B" },
  { slug: "minimaliste", label: "Minimaliste", couleur: "#4A4A55" },
  { slug: "blackwork", label: "Blackwork", couleur: "#26262B" },
  { slug: "dotwork", label: "Dotwork", couleur: "#4E4A42" },
  { slug: "geometrique", label: "Géométrique", couleur: "#3B5B7A" },
  { slug: "ornemental", label: "Ornemental", couleur: "#6B5540" },
  { slug: "old-school", label: "Old School", couleur: "#A2402F" },
  { slug: "neo-traditionnel", label: "Neo-Traditional", couleur: "#7A3A55" },
  { slug: "new-school", label: "New School", couleur: "#8A5A2E" },
  { slug: "japonais", label: "Japonais (Irezumi)", couleur: "#1F4E5F" },
  { slug: "chicano", label: "Chicano", couleur: "#57544B" },
  { slug: "tribal", label: "Tribal", couleur: "#3E3E36" },
  { slug: "aquarelle", label: "Aquarelle", couleur: "#4C6470" },
  { slug: "illustratif", label: "Illustratif", couleur: "#705E48" },
  { slug: "anime-manga", label: "Anime / Manga", couleur: "#6E4A62" },
  { slug: "abstrait", label: "Abstrait", couleur: "#565066" },
  { slug: "trash-polka", label: "Trash Polka", couleur: "#77303A" },
  { slug: "biomecanique", label: "Biomécanique / Organique", couleur: "#44575B" },
  { slug: "ignorant-style", label: "Ignorant Style", couleur: "#54505B" },
  { slug: "cyber-tribal", label: "Cyber-tribal / Cyberpunk", couleur: "#474077" },
  { slug: "lettering", label: "Lettering", couleur: "#5A4632" },
  //  ---- LES SEPT DE LA PASSE Nº 113 ----
  { slug: "acid-trad", label: "Acid-trad", couleur: "#6B7A2E" },
  { slug: "bio-mecha", label: "Bio-mecha", couleur: "#4A4550" },
  { slug: "chrome", label: "Chrome", couleur: "#5A6068" },
  { slug: "cyber-sigilism", label: "Cyber-sigilism", couleur: "#3E3A5C" },
  { slug: "gravure", label: "Gravure", couleur: "#4E4740" },
  { slug: "one-line", label: "One Line", couleur: "#5B5560" },
  { slug: "suminagashi", label: "Suminagashi", couleur: "#2F4A57" },
  //  ---- LES NEUF TRADITIONNELS (famille `traditionnel-ethnique`) ----
  //  Ce sont des styles À PART ENTIÈRE : cherchables, portant chacun sa
  //  page style + ville. Seul leur RANGEMENT diffère (voir plus bas).
  { slug: "berbere", label: "Berbère", couleur: "#6B4A38" },
  { slug: "celtique", label: "Celtique", couleur: "#3D5A46" },
  { slug: "copte", label: "Copte", couleur: "#5B4638" },
  { slug: "maori", label: "Maori", couleur: "#2E3B38" },
  { slug: "nordique", label: "Nordique", couleur: "#3A4756" },
  { slug: "pa-tutiki", label: "Pā Tūtiki", couleur: "#33403C" },
  { slug: "polynesien", label: "Polynésien", couleur: "#2C3C42" },
  { slug: "sicanje", label: "Sicanje", couleur: "#4A3F4A" },
  { slug: "yoruba", label: "Yoruba", couleur: "#6A5230" },
] as const;

export type StyleTatouage = (typeof STYLES_TATOUAGE)[number]["slug"];

/* ================================================================
 * LE CATALOGUE S'AGRANDIT — les styles nés d'une suggestion (nº 122)
 * ================================================================ */
/**
 * UN STYLE AJOUTÉ PAR L'ADMINISTRATION.
 * Il naît d'une suggestion de tatoueur, acceptée dans /admin : nom
 * arrêté par l'administration, rangement choisi (la liste principale
 * ou la famille « Traditionnel ethnique »). En base, jamais dans ce
 * fichier — sinon il faudrait une livraison à chaque style ajouté.
 */
export type StyleAjoute = {
  slug: string;
  label: string;
  /** `null` = liste principale ; sinon le slug d'une famille. */
  famille: string | null;
};

/**
 * LE REGISTRE — la seule variable modifiable de ce fichier.
 * ⚠️ POURQUOI UN REGISTRE, ET PAS UN APPEL À LA BASE ?
 * `libelleStyle`, `stylesAlphabetiques`, `entreesExplorer` sont
 * appelées partout — dans des composants client, des rendus serveur,
 * des images générées — et TOUJOURS de façon SYNCHRONE. Les rendre
 * asynchrones aurait contaminé une quarantaine de fichiers.
 * On garde donc leur signature, et on remplit ce registre AVANT le
 * rendu, aux deux seuls endroits qui le peuvent :
 *  · côté serveur, `chargerStylesAjoutes()` (src/lib/styles-ajoutes.ts)
 *    lit la base au début de la mise en page du groupe tatouage ;
 *  · côté navigateur, `<FournisseurStyles>` repose la même liste
 *    pendant son rendu — donc avant celui de ses enfants.
 * Vide par défaut : sans base, sans migration, le site marche
 * exactement comme avant, avec ses trente-huit styles.
 */
let STYLES_AJOUTES: readonly StyleAjoute[] = [];

/** Remplace le registre. Idempotent : reposer la même liste ne change
    rien. Les slugs déjà portés par le catalogue d'origine sont
    ignorés — le fichier fait toujours foi sur ses propres styles. */
export function poserStylesAjoutes(liste: readonly StyleAjoute[]): void {
  const dorigine = new Set<string>(STYLES_TATOUAGE.map((s) => s.slug));
  const vus = new Set<string>();
  STYLES_AJOUTES = liste.filter((style) => {
    if (!style.slug || dorigine.has(style.slug) || vus.has(style.slug)) {
      return false;
    }
    vus.add(style.slug);
    return true;
  });
}

/** Le registre, en lecture. */
export function lesStylesAjoutes(): readonly StyleAjoute[] {
  return STYLES_AJOUTES;
}

/**
 * LA COULEUR D'UN STYLE AJOUTÉ — calculée, jamais choisie.
 * Elle n'habille que les images de démonstration. L'administration a
 * déjà trois décisions à prendre (accepter, nommer, ranger) ; en
 * ajouter une quatrième, purement décorative, aurait été de trop.
 * Le slug donne toujours la même teinte : un style ne change pas de
 * couleur d'un chargement à l'autre.
 */
const COULEURS_STYLES_AJOUTES = [
  "#3C4650", "#6E5B7B", "#4A4A55", "#4E4A42", "#3B5B7A",
  "#6B5540", "#7A3A55", "#1F4E5F", "#4C6470", "#565066",
] as const;

function couleurCalculee(slug: string): string {
  let somme = 0;
  for (let rang = 0; rang < slug.length; rang += 1) {
    somme = (somme * 31 + slug.charCodeAt(rang)) % 100000;
  }
  return COULEURS_STYLES_AJOUTES[somme % COULEURS_STYLES_AJOUTES.length];
}

/**
 * LE CATALOGUE COMPLET : les trente-huit d'origine, plus ceux que
 * l'administration a acceptés. C'est la SEULE liste que le reste du
 * fichier consulte — ajouter un style en base suffit à le faire
 * apparaître partout.
 */
export function catalogueStyles(): {
  slug: string;
  label: string;
  couleur: string;
}[] {
  return [
    ...STYLES_TATOUAGE.map((style) => ({ ...style })),
    ...STYLES_AJOUTES.map((style) => ({
      slug: style.slug,
      label: style.label,
      couleur: couleurCalculee(style.slug),
    })),
  ];
}

/** Le libellé d'un style, ou le slug tel quel s'il est inconnu. */
export function libelleStyle(slug: string): string {
  return catalogueStyles().find((s) => s.slug === slug)?.label ?? slug;
}

/** Ce slug désigne-t-il un style du catalogue ? */
export function styleDuCatalogue(slug: string | null | undefined): boolean {
  return Boolean(slug) && catalogueStyles().some((s) => s.slug === slug);
}

/* ================================================================
 * L'ORDRE ALPHABÉTIQUE — CALCULÉ, JAMAIS ÉCRIT
 * ================================================================ */
/**
 * LA SEULE COMPARAISON DE LIBELLÉS DU SITE.
 * ⚠️ ELLE TRIE LE TEXTE AFFICHÉ, pas la clé technique — c'est toute
 * la différence. Le jour où le site parlera anglais ou japonais, les
 * libellés changeront et la liste se rangera d'elle-même, sans qu'une
 * seule ligne d'ordre ait à être retouchée. Un tableau d'ordre écrit à
 * la main, lui, serait resté figé en français.
 *
 * `localeCompare` en français gère ce qu'un `<` naïf rate : les
 * accents (« Géométrique » avant « Gravure »), le macron de « Pā
 * Tūtiki » (rangé à P-a, pas après Z), et les traits d'union
 * (« Bio-mecha » avant « Biomécanique »).
 */
function parLibelle(a: { label: string }, b: { label: string }): number {
  return a.label.localeCompare(b.label, "fr");
}

/**
 * LES FAMILLES DE STYLES — un rangement, pas un style
 * ---------------------------------------------------
 * Une famille regroupe des styles qui se cherchent séparément mais
 * qu'on trouve ensemble. Elle porte un nom et une porte dans le menu
 * « Explorer » ; elle N'EST PAS CHERCHABLE : son slug n'existe pas
 * dans STYLES_TATOUAGE, donc `lireValeurExplorer` le refuse et aucune
 * page /tatouage/traditionnel-ethnique/<ville> ne peut exister. Ouvrir
 * une famille ne fait qu'une chose : montrer ce qu'elle contient.
 *
 * ⚠️ ET ELLE N'EST JAMAIS DÉCLARABLE. La fenêtre « Ajouter un style »
 * du formulaire (passe nº 116) reprend la porte du menu Explorer :
 * l'ouvrir montre les neuf styles, décalés à droite, et le tatoueur
 * choisit l'un d'eux — « Maori », pas « du traditionnel ethnique ».
 */
export const FAMILLES_STYLES = [
  {
    slug: "traditionnel-ethnique",
    label: "Traditionnel ethnique",
    styles: [
      "berbere",
      "celtique",
      "copte",
      "maori",
      "nordique",
      "pa-tutiki",
      "polynesien",
      "sicanje",
      "yoruba",
    ],
  },
] as const;

/**
 * LES FAMILLES, REGISTRE COMPRIS (nº 122).
 * Un style accepté par l'administration peut être rangé dans
 * « Traditionnel ethnique » : il rejoint alors la famille exactement
 * comme les neuf d'origine, sans que ce fichier ait à être retouché.
 */
export function famillesStyles(): {
  slug: string;
  label: string;
  styles: string[];
}[] {
  return FAMILLES_STYLES.map((famille) => ({
    slug: famille.slug,
    label: famille.label,
    styles: [
      ...famille.styles,
      ...lesStylesAjoutes()
        .filter((style) => style.famille === famille.slug)
        .map((style) => style.slug),
    ],
  }));
}

/** Les slugs rangés dans une famille — calculé, jamais recopié. */
function stylesEnFamille(): Set<string> {
  return new Set<string>(
    famillesStyles().flatMap((famille) => famille.styles)
  );
}

/** LES STYLES, DE A À Z — la liste du FORMULAIRE : les familles n'y
    existent pas, chaque style est à sa lettre. Trente-huit d'origine,
    plus ceux que l'administration a acceptés. */
export function stylesAlphabetiques(): { slug: string; label: string }[] {
  return catalogueStyles()
    .map((style) => ({ slug: style.slug, label: style.label }))
    .sort(parLibelle);
}

/** Une entrée du menu « Explorer » : soit un style, soit une famille
    dépliante qui en contient plusieurs. */
export type EntreeExplorer =
  | { genre: "style"; slug: string; label: string }
  | {
      genre: "famille";
      slug: string;
      label: string;
      styles: { slug: string; label: string }[];
    };

/**
 * LES TRENTE ENTRÉES DU MENU « EXPLORER », DE A À Z.
 * Vingt-neuf styles isolés + une famille, rangés ensemble par leur
 * libellé : « Traditionnel ethnique » se place entre « Suminagashi »
 * et « Trash Polka » comme n'importe quel autre mot — la famille ne
 * saute pas en fin de liste, elle prend simplement sa lettre.
 */
export function entreesExplorer(): EntreeExplorer[] {
  const enFamille = stylesEnFamille();
  const isoles: EntreeExplorer[] = catalogueStyles()
    .filter((style) => !enFamille.has(style.slug))
    .map((style) => ({
      genre: "style",
      slug: style.slug,
      label: style.label,
    }));
  const familles: EntreeExplorer[] = famillesStyles().map((famille) => ({
    genre: "famille",
    slug: famille.slug,
    label: famille.label,
    styles: famille.styles
      .map((slug) => ({ slug, label: libelleStyle(slug) }))
      .sort(parLibelle),
  }));
  return [...isoles, ...familles].sort(parLibelle);
}

/* ================================================================
 * LE MENU « EXPLORER » — deux catégories, et rien d'autre
 * ================================================================ */
/**
 * CE QU'ON CHERCHE D'ABORD : DU TRAVAIL RÉALISÉ, OU DES FLASHS ?
 * ===============================================================
 * ⚠️ LE MENU « QUEL STYLE ? » NE POSAIT QU'UNE QUESTION, et ce
 * n'était pas la première. Quelqu'un qui veut un flash ne cherche pas
 * un style : il cherche une PLANCHE — un dessin déjà prêt qu'il n'aura
 * qu'à choisir. Quelqu'un qui vient avec son projet cherche, lui, du
 * travail réalisé. Deux intentions, deux chemins.
 *
 * LE MENU S'OUVRE DONC SUR DEUX MOTS, pas sur vingt-deux : TATOUAGES
 * et FLASHS. On en déplie UN, et les styles apparaissent dessous —
 * précédés de « Tous les … » pour qui n'a pas de style en tête.
 * Déplier l'autre referme le premier : on ne lit jamais quarante-six
 * lignes d'un coup.
 *
 * ⚠️ COVER ET CICATRICE NE SONT PAS ICI, et c'est délibéré : ce sont
 * des BESOINS, ils restent des déclarations dans les filtres (voir
 * FILTRES_TATOUAGE). Ce menu ne parle que de ce qu'on regarde.
 *
 * LA VALEUR QUI CIRCULE est un couple encodé en une chaîne —
 * « flash », « flash:realisme », « tatouage », « tatouage:realisme ».
 * Un seul champ à faire voyager dans le menu, l'adresse et l'API,
 * pour deux informations qui ne se séparent jamais.
 */
//  ⚠️ « RÉALISATIONS », PAS « TATOUAGES » (passe nº 111) — et la clé
//  `tatouage` ne change pas : elle est écrite en base et dans les
//  adresses de recherche. Le mot « tatouage » désigne le métier
//  partout ailleurs sur le site ; ici, on nomme UNE NATURE DE PHOTO,
//  et ce qu'on regarde alors, c'est ce que le tatoueur a RÉALISÉ —
//  par opposition au flash, qui n'est pas encore fait.
export const CATEGORIES_EXPLORER = [
  { nature: "tatouage", titre: "Réalisations", tous: "Toutes les réalisations" },
  { nature: "flash", titre: "Flashs", tous: "Tous les flashs" },
] as const;

/** « flash » + « realisme » → « flash:realisme ». Sans style : la
    nature seule. Sans nature : la chaîne vide (rien de cherché). */
export function valeurExplorer(nature: string, style: string): string {
  if (!nature) return "";
  return style ? `${nature}:${style}` : nature;
}

/** L'inverse — et il ne rend JAMAIS n'importe quoi : une nature
    inconnue vide le couple, un style inconnu ne garde que la nature. */
export function lireValeurExplorer(valeur: string | null | undefined): {
  nature: string;
  style: string;
} {
  const [nature = "", style = ""] = (valeur ?? "").split(":");
  if (!CATEGORIES_EXPLORER.some((c) => c.nature === nature)) {
    return { nature: "", style: "" };
  }
  return { nature, style: styleDuCatalogue(style) ? style : "" };
}

/** La couleur d'un style (images de démonstration). */
export function couleurStyle(slug: string): string {
  return catalogueStyles().find((s) => s.slug === slug)?.couleur ?? "#3A3A40";
}

/**
 * AUCUNE LIMITE DE STYLES : un tatoueur peut couvrir TOUS les styles
 * du site. Ce qui reste limité, c'est la photo — UNE par style (voir
 * photos_styles) : couvrir un style, c'est le montrer.
 */

/**
 * LES FILTRES SECONDAIRES — des interrupteurs, SANS photo
 * --------------------------------------------------------
 * Deux groupes : la technique et la composition. Ils COMPLÈTENT les
 * styles (qui restent la porte d'entrée, avec leur photo). Deux
 * logiques VOULUES, inverses l'une de l'autre :
 *  - dans le FORMULAIRE du tatoueur, tout est ÉTEINT : il allume ce
 *    qu'il pratique ;
 *  - dans la RECHERCHE, tout est ALLUMÉ : on éteint ce qu'on ne veut
 *    pas voir (tout allumé = aucun filtrage).
 *
 * RÈGLE DE FILTRAGE (par exclusions) : dans un groupe où des
 * interrupteurs sont éteints, une fiche reste visible si elle a
 * déclaré AU MOINS UNE pratique encore allumée — ou si elle n'a RIEN
 * déclaré dans ce groupe (les cases du formulaire sont facultatives,
 * on n'écarte personne sur un silence). Les groupes se cumulent.
 *
 * `groupe` = le nom de la colonne en base (filtres_<groupe>, voir
 * supabase/yokofolio-filtres.sql).
 */
export const FILTRES_TATOUAGE = [
  {
    groupe: "technique",
    titre: "Technique",
    options: [
      { slug: "handpoke", label: "Handpoke" },
      { slug: "tebori", label: "Tebori" },
      { slug: "machine", label: "Machine" },
    ],
  },
  {
    groupe: "composition",
    // « Composition » était un mot de métier : on compose un tatouage,
    // mais celui qui cherche, lui, a un PROJET. Le nom du groupe le
    // dit désormais. La clé `composition` ne bouge pas : c'est le nom
    // de la colonne (`filtres_composition`).
    titre: "Types de projets",
    options: [
      { slug: "petit-tatouage", label: "Petit tatouage" },
      //  ⚠️ « FLASH » A QUITTÉ CE GROUPE À LA PASSE Nº 110, et il n'y
      //  reviendra pas. Une case cochée annonçait des flashs sans
      //  qu'on puisse en voir un seul — or un flash est un DESSIN :
      //  ce qui compte, c'est de le regarder. Il est devenu une
      //  NATURE DE PHOTO (voir NATURES_PHOTO dans lib/photos-tatoueur)
      //  et se cherche dans le menu « Explorer ». La migration nº 49
      //  retire la valeur des `filtres_composition` déjà enregistrés.
      { slug: "patchwork", label: "Patchwork" },
      {
        // LE LIBELLÉ SE SUFFIT — « Grandes pièces », rien de plus, ni
        // ici ni sous la case du formulaire : la liste des formats
        // (sleeve, dos, torse…) alourdissait sans rien apprendre.
        slug: "sleeve",
        label: "Grandes pièces",
      },
      // LE BODYSUIT RESSORT DE « GRANDES PIÈCES ».
      // ⚠️ ET IL NE PEUT PAS ÊTRE RÉTABLI SUR LES FICHES EXISTANTES.
      // La migration nº 17 (yokofolio-grandes-pieces.sql) a basculé
      // `bodysuit`, `piece-dos` et `piece-torse` vers `sleeve` : ces
      // trois-là sont devenus indiscernables en base. Rien ne permet
      // de savoir laquelle des trois une fiche avait cochée — on ne
      // devine pas, on ne restaure pas. Les fiches concernées gardent
      // « Grandes pièces » ; leurs propriétaires cochent « Bodysuit »
      // s'ils le pratiquent, à leur prochaine visite au formulaire.
      // Ce qui justifie sa sortie : un bodysuit n'est pas une grande
      // pièce de plus, c'est un engagement de plusieurs années.
      { slug: "bodysuit", label: "Bodysuit" },
    ],
  },
  {
    // LES BESOINS — ce qu'on vient chercher, pas ce qu'on aime.
    // Un recouvrement ou une cicatrice ne sont pas des goûts : ce
    // sont des demandes précises, que tous les tatoueurs ne prennent
    // pas. Elles se déclarent donc au niveau de la FICHE, comme les
    // deux autres groupes — et pas photo par photo.
    // ⚠️ LES SLUGS SONT EN ANGLAIS, comme les tags de photos : le
    // site sera traduit, et une clé française deviendrait un boulet.
    groupe: "besoins",
    titre: "Besoins",
    options: [
      { slug: "cover", label: "Cover" },
      { slug: "scar", label: "Cicatrice" },
    ],
  },
] as const;

/**
 * LE FILTRE « ARTISTE / SALON » — le même jeu d'interrupteurs que les
 * autres, mais il ne porte pas sur une colonne de pratiques : il
 * porte sur le TYPE de la fiche (voir TYPES_FICHE). Tout allumé =
 * artistes ET salons ; éteindre l'un ne laisse que l'autre.
 */
export const FILTRE_TYPE_FICHE = {
  groupe: "type",
  //  « LIEU » depuis la passe nº 149-§6 : la liste unique des filtres
  //  dit d'abord comment travaille l'ARTISTE (le groupe `mode`), puis
  //  quel LIEU on cherche — un studio, un salon. C'est le même groupe
  //  technique qu'avant (le type de la fiche), présenté par sa moitié
  //  « établissements ».
  titre: "Lieu",
  options: [
    //  ⚠️ « ARTISTES » N'A PLUS DE BADGE (nº 149-§6) : le groupe
    //  « Artiste » (les modes d'exercice) parle déjà pour eux. Le slug
    //  RESTE dans le groupe — il appartient au langage `exclure=` (les
    //  adresses partagées le portent, la base le connaît) — mais
    //  l'écran ne le montre plus : il reste sélectionné en
    //  permanence, et le moteur raisonne sur les badges VISIBLES.
    { slug: "artiste", label: "Artistes", cachee: true },
    // LA FICHE DE LIEU dont `etablissement = 'prive'` (migration
    // nº 37). Slug distinct de `prive` (le genre de mode) : deux
    // groupes ne peuvent pas partager un slug, tous voyagent dans le
    // même `exclure=`.
    { slug: "studio-prive", label: "Studio" },
    // ⚠️ LE SLUG RESTE « salon » : c'est une CLÉ TECHNIQUE, écrite en
    // base et dans les adresses de recherche depuis le premier jour.
    { slug: "salon", label: "Salon" },
  ],
} as const;

/**
 * OÙ IL TATOUE — LE MODE D'ACTIVITÉ, ET NON LE PROFIL
 * ====================================================
 * ⚠️ LE DÉFAUT QUE CE GROUPE CORRIGE. « Artiste » et « À domicile »
 * cohabitaient dans un seul groupe. Or ils ne répondent pas à la même
 * question : le premier dit CE QU'EST la fiche, le second CE QU'ELLE
 * FAIT. Mélangés, ils s'annulaient — éteindre « Artiste » faisait
 * disparaître les artistes à domicile alors que « À domicile » restait
 * allumé. Un filtre qui se contredit lui-même.
 *
 * DEUX AXES INDÉPENDANTS, DONC DEUX GROUPES :
 *   · PROFIL       — ce qu'est la fiche : Artiste · Salon · Studio privé
 *   · OÙ IL TATOUE — comment l'artiste travaille : En salon · En guest ·
 *                    À domicile · En studio privé
 *
 * LA GRAMMAIRE PORTE LA DISTINCTION, et ce n'est pas un ornement :
 * c'est ce qui évite de relire deux fois. Le profil prend des NOMS
 * (« Salon » : la chose), le mode des COMPLÉMENTS DE LIEU (« En
 * salon » : l'endroit où l'on va). Aucune entrée ne se lit deux fois
 * de la même façon.
 *
 * ⚠️ CE GROUPE NE CONCERNE QUE LES ARTISTES. Un salon n'a pas de mode
 * d'exercice — il a des adresses. Éteindre « En guest » ne doit donc
 * RETIRER AUCUN salon : le filtre ne s'applique qu'aux fiches
 * d'artiste, les fiches de lieu passent au travers. C'est exactement
 * ce qui empêche les deux groupes de se contredire à nouveau.
 *
 * `genre` = la valeur écrite dans `modes_exercice.genre` (voir
 * GENRES_MODE). Le slug, lui, est ce qui voyage dans l'adresse.
 */
export const FILTRE_MODE_ACTIVITE = {
  groupe: "mode",
  //  « ARTISTE » depuis la passe nº 149-§6 : premier groupe de la
  //  liste unique des filtres — comment travaille l'artiste qu'on
  //  cherche. (Un salon n'a pas de mode : ce groupe ne concerne que
  //  les fiches d'artiste, voir plus haut.)
  titre: "Artiste",
  //  L'ORDRE ET LES LIBELLÉS DU BRIEF nº 149-§6 : « À domicile ·
  //  En studio · En salon · Guest ». Les SLUGS et les GENRES, eux, ne
  //  bougent pas d'une lettre : ce sont les clés du langage `exclure=`
  //  et de `modes_exercice.genre` — l'ordre d'un groupe n'a aucun
  //  effet sur ce qui part vers la base (des ensembles, pas des
  //  listes). « En studio privé » se raccourcit en « En studio » sur
  //  demande explicite de cette passe.
  options: [
    { slug: "a-domicile", label: "À domicile", genre: "domicile" },
    { slug: "en-studio-prive", label: "En studio", genre: "prive" },
    { slug: "en-salon", label: "En salon", genre: "salon" },
    { slug: "en-guest", label: "Guest", genre: "guest" },
  ],
} as const;

/** Le genre de mode d'un slug de filtre (« en-guest » → « guest »). */
export function genreDuModeFiltre(slug: string): string | null {
  return (
    FILTRE_MODE_ACTIVITE.options.find((o) => o.slug === slug)?.genre ?? null
  );
}

/** L'inverse : le slug de filtre d'un genre (« guest » → « en-guest »). */
export function slugDuGenreMode(genre: string | null | undefined): string | null {
  if (!genre) return null;
  return (
    FILTRE_MODE_ACTIVITE.options.find((o) => o.genre === genre)?.slug ?? null
  );
}

/** Le PROFIL d'une fiche, dans le vocabulaire du filtre : c'est la
    nature (voir `natureDeLaFiche`), avec le slug du groupe. */
export function profilDeLaFiche(
  typeFiche: string | null | undefined,
  etablissement: string | null | undefined
): "artiste" | "salon" | "studio-prive" {
  const nature = natureDeLaFiche(typeFiche, etablissement);
  return nature === "prive" ? "studio-prive" : nature;
}

/** TOUS les groupes d'interrupteurs du moteur, dans leur ordre
    d'affichage — un seul tableau, parcouru à l'identique par le
    panneau du web et par la fenêtre du téléphone. */
/**
 * LE FILTRE « RENDU » — le seul qui ne se déclare PAS sur la fiche.
 * Il porte sur les TAGS DES PHOTOS : cocher « Couleur » remonte les
 * tatoueurs qui ont au moins une photo en couleur, et la carte montre
 * cette photo — exactement ce que fait déjà un style cherché.
 * Il n'a donc AUCUNE case dans le formulaire : rien à déclarer, la
 * galerie répond toute seule. C'est pourquoi il vit ici, et pas dans
 * FILTRES_TATOUAGE (qui, lui, dessine aussi les interrupteurs du
 * formulaire).
 * ⚠️ SLUGS EN ANGLAIS, les mêmes qu'en base (voir photos-tatoueur).
 */
export const FILTRE_RENDU = {
  groupe: "rendu",
  titre: "Rendu",
  options: [
    { slug: "black_and_grey", label: "Noir et gris" },
    { slug: "color", label: "Couleur" },
  ],
} as const;

export const GROUPES_FILTRES = [
  // EN PREMIER : « qui je cherche » précède toujours « comment il
  // travaille ». Puis « où il tatoue », qui précise le premier sans
  // le contredire. Technique, Types de projets, Rendu et Besoins
  // affinent ensuite.
  FILTRE_TYPE_FICHE,
  FILTRE_MODE_ACTIVITE,
  ...FILTRES_TATOUAGE,
  FILTRE_RENDU,
] as const;

export type GroupeFiltre = (typeof FILTRES_TATOUAGE)[number]["groupe"];

/** Tous les slugs de filtre connus (validation des adresses et API) —
    le type de fiche compris : lui aussi voyage dans « exclure ». */
export const SLUGS_FILTRES = new Set<string>(
  GROUPES_FILTRES.flatMap((g) => g.options.map((o) => o.slug))
);

/** Un slug de RENDU connu, ou la chaîne vide (adresse malmenée). */
export function renduConnu(slug: string | undefined): string {
  return slug && FILTRE_RENDU.options.some((o) => o.slug === slug) ? slug : "";
}

/**
 * LA RECHERCHE PORTE-T-ELLE SUR UN RENDU ?
 * =========================================
 * Le rendu ne se coche pas : il s'ÉTEINT. Les deux interrupteurs sont
 * allumés par défaut ; éteindre « Noir et gris », c'est chercher de la
 * couleur. Il n'y a donc recherche par rendu que lorsqu'il en reste
 * EXACTEMENT UN d'allumé — deux allumés (ou zéro) ne désignent rien,
 * et la fiche s'ouvre alors comme d'habitude.
 */
export function renduCherche(exclure: string[] | undefined): string {
  const eteints = new Set(exclure ?? []);
  const allumes = FILTRE_RENDU.options
    .map((o) => o.slug as string)
    .filter((slug) => !eteints.has(slug));
  return allumes.length === 1 ? allumes[0] : "";
}

/** Le libellé d'un filtre, ou le slug tel quel s'il est inconnu. */
export function libelleFiltre(slug: string): string {
  for (const groupe of [...FILTRES_TATOUAGE, FILTRE_RENDU]) {
    const option = groupe.options.find((o) => o.slug === slug);
    if (option) return option.label;
  }
  return slug;
}

/** Le groupe d'un filtre (« technique » | « composition »). */
export function groupeDuFiltre(slug: string): GroupeFiltre | null {
  for (const groupe of FILTRES_TATOUAGE) {
    if (groupe.options.some((o) => o.slug === slug)) return groupe.groupe;
  }
  return null;
}

/**
 * LE TYPE DE FICHE ET LE MODE D'EXERCICE
 * =======================================
 * DEUX QUESTIONS, PAS UNE : « qui es-tu ? » puis « où travailles-tu ? ».
 * C'est ce couple qui décide de TOUT ce que la fiche demande ensuite
 * en matière de lieu — une adresse, une ville et un rayon, ou une
 * liste de villes. Il n'y a donc plus d'encadré « adresse » séparé :
 * le champ de localisation VIT DANS cet encadré et change avec lui.
 *
 * UN SALON a une adresse, et c'est tout : un salon ne se déplace pas.
 * UN ARTISTE a trois façons d'exercer, toutes légitimes :
 *   · EN SALON   — il tatoue à l'adresse d'un salon ;
 *   · SUR ZONE   — pas d'adresse publique : une ville de rattachement
 *                  et un rayon d'intervention ;
 *   · ITINÉRANT  — il tourne entre plusieurs villes (2 à 5).
 */
/**
 * ⚠️ « SALON » EST UNE CLÉ, ET C'EST AUSSI LE MOT
 * ------------------------------------------------
 * Le slug reste `salon` : il est écrit dans des milliers de lignes en
 * base (`type_fiche`), dans les adresses de recherche et dans les
 * politiques SQL. Le renommer casserait les données existantes pour
 * un gain nul — personne ne lit un slug.
 *
 * ⚠️ ET LE LIBELLÉ REDIT « SALON ». Une passe précédente avait imposé
 * « Studio » partout ; ce choix est annulé. Deux raisons, et la
 * seconde décide : « salon de tatouage » est la formule que les gens
 * tapent réellement dans Google, et le mot « studio » est désormais
 * PRIS — il désigne le studio privé, qui est autre chose.
 *
 * DEUX ENTRÉES ICI, TROIS NATURES À L'ÉCRAN. Le type de fiche répond à
 * une seule question : la fiche appartient-elle à une PERSONNE ou à un
 * LIEU ? La nature du lieu, elle, se lit dans `etablissement` (voir
 * NATURES_ETABLISSEMENT juste dessous).
 */
export const TYPES_FICHE = [
  {
    slug: "artiste",
    label: "Artiste",
    resume: "Je tatoue en mon nom",
  },
  {
    slug: "salon",
    // Le second choix ouvre un sous-choix (Salon / Studio privé),
    // exactement comme « Artiste » ouvre ses modes d'activité.
    label: "Salon / Studio privé",
    resume: "Un lieu, une équipe",
  },
] as const;

export type TypeFiche = (typeof TYPES_FICHE)[number]["slug"];

/**
 * LES TROIS CHOIX DU BLOC 1 — AU MÊME NIVEAU
 * ===========================================
 * On proposait DEUX cartes (« Artiste », « Salon / Studio privé »),
 * la seconde ouvrant un sous-choix. Un étage de plus pour une
 * question qui n'en demandait pas : celui qui tient un studio privé
 * ne se reconnaît pas d'abord dans « Salon ». Les trois sont donc
 * offerts d'emblée.
 *
 * ⚠️ LE MODÈLE DE DONNÉES NE BOUGE PAS. Un studio privé reste une
 * fiche de LIEU (`type_fiche = 'salon'`) dont `etablissement` vaut
 * « prive » — c'est le choix arrêté à la passe A, et rien ne le
 * remet en cause : aucune requête, aucune politique, aucun slug ne
 * change. Seule la façon de POSER LA QUESTION change.
 */
//  ⚠️ ORDRE ET LIBELLÉS DE LA PASSE Nº 104 : Artiste · Studio · Salon,
//  et « Studio privé » se dit désormais « Studio » — le mot court
//  suffit à l'écran, la nuance « privé » vit dans les explications.
//  Le slug `studio-prive` et le couple type/établissement, eux, ne
//  bougent pas : rien ne change en base ni dans les adresses.
export const CHOIX_PROFIL = [
  { slug: "artiste", label: "Artiste", typeFiche: "artiste", etablissement: "salon" },
  {
    slug: "studio-prive",
    label: "Studio",
    typeFiche: "salon",
    etablissement: "prive",
  },
  { slug: "salon", label: "Salon", typeFiche: "salon", etablissement: "salon" },
] as const;

/**
 * LA NATURE DU LIEU — le sous-choix de « Salon / Studio privé »
 * =============================================================
 * Les deux créent une fiche d'ÉTABLISSEMENT, avec sa page publique.
 * Ce qui les sépare n'est pas le statut, c'est le rapport au public :
 *  · UN SALON reçoit — vitrine, passage, horaires d'ouverture ;
 *  · UN STUDIO PRIVÉ travaille sur rendez-vous, sans vitrine.
 *
 * ⚠️ CONSÉQUENCE, ET ELLE EST STRUCTURANTE : UN STUDIO PRIVÉ N'A PAS
 * D'HORAIRES. Le bloc des horaires ne lui est jamais proposé — on
 * n'affiche pas des heures d'ouverture à un lieu qui n'ouvre pas.
 * (Le bloc lui-même déménage à la passe C ; ici, seule la règle est
 * posée, par `aDesHoraires`.)
 *
 * ⚠️ LE SLUG `salon` DE `type_fiche` NE CHANGE PAS pour autant : un
 * studio privé reste un LIEU. Voir yokofolio-etablissement-prive.sql.
 */
export const NATURES_ETABLISSEMENT = [
  {
    slug: "salon",
    label: "Salon",
    resume: "J'accueille du public",
  },
  {
    slug: "prive",
    label: "Studio privé",
    resume: "Je reçois sur rendez-vous",
  },
] as const;

export type NatureEtablissement =
  (typeof NATURES_ETABLISSEMENT)[number]["slug"];

/**
 * LES TROIS NATURES TELLES QU'ON LES MONTRE — artiste, salon, studio
 * privé. C'est la seule fonction à consulter pour savoir « c'est quoi,
 * cette fiche ? » : elle croise le type et l'établissement, et elle
 * est la source unique des badges de cartes comme des titres de fiche.
 */
export function natureDeLaFiche(
  typeFiche: string | null | undefined,
  etablissement: string | null | undefined
): "artiste" | "salon" | "prive" {
  if (typeFiche === "artiste") return "artiste";
  return etablissement === "prive" ? "prive" : "salon";
}

/** UN LIEU QUI OUVRE SES PORTES A DES HORAIRES ; un studio privé, non.
    La règle tient en une ligne, et elle est ici pour n'être écrite
    qu'une fois (formulaire, fiche publique, admin). */
export function aDesHoraires(
  typeFiche: string | null | undefined,
  etablissement: string | null | undefined
): boolean {
  return natureDeLaFiche(typeFiche, etablissement) === "salon";
}

/**
 * LES MODES D'EXERCICE D'UN ARTISTE — CUMULATIFS, RÉPÉTABLES
 * ==========================================================
 * On choisissait UN statut parmi trois. La réalité du métier ne tient
 * pas dans une case : on est résident d'un salon à Lyon, on part en
 * guest à Paris quinze jours en septembre, et on reçoit chez soi le
 * reste du temps. Les trois en même temps.
 *
 * Un artiste ajoute donc AUTANT DE MODES QU'IL VEUT, dans l'ordre
 * qu'il veut, et peut répéter le même genre (deux salons, cinq
 * sessions guest). Aucune limite.
 *
 * UN SALON, LUI, N'A PAS DE MODE : il a des STUDIOS — une adresse,
 * ou plusieurs (voir `studios`). C'est la même idée, vue de l'autre
 * côté du comptoir.
 */
/**
 * QUATRE MODES, ET NON PLUS TROIS
 * --------------------------------
 * « À domicile » et « Studio privé » étaient confondus dans une seule
 * case. Ce sont pourtant deux métiers différents : recevoir chez soi
 * (ou se déplacer), ce n'est pas tenir un lieu fermé au public. Les
 * séparer, c'est laisser chacun se décrire tel qu'il est — et laisser
 * la personne qui cherche comprendre ce qu'elle trouvera.
 *
 * ⚠️ LES SLUGS `salon`, `guest` ET `domicile` NE BOUGENT PAS : ils
 * sont en base. Seul `prive` est neuf (migration nº 33).
 */
//  ⚠️ L'ORDRE EST CELUI DE LA GRILLE DU FORMULAIRE — deux colonnes,
//  lues de gauche à droite puis de haut en bas (passe nº 107, à la
//  demande du propriétaire) :
//        En studio  ·  En salon
//        À domicile ·  Guest
//  Les deux LIEUX À SOI d'abord, les deux façons d'aller ailleurs
//  ensuite. (La passe nº 105 avait un autre ordre ; seul l'affichage
//  bouge.) LES SLUGS, EUX, NE BOUGENT JAMAIS — ils sont en base.
//  ⚠️ « En studio privé » SE DIT « En studio » depuis la passe nº 105,
//  en cohérence avec le sélecteur du bloc 1 (« Studio »). Le slug
//  `prive` et les phrases descriptives de la fiche publique (qui
//  qualifient le LIEU, pas le mode) ne changent pas.
export const GENRES_MODE = [
  {
    slug: "prive",
    label: "En studio",
    titre: "En studio",
    phrase: "Studio privé / Secteur :",
    phraseLiee: "Studio privé / Secteur :",
  },
  {
    slug: "salon",
    /** Ce qu'on lit sous le nom, sur la fiche publique. */
    label: "En salon",
    /** Ce qu'on lit dans le sélecteur du formulaire. */
    titre: "En salon",
    /** Ce qui précède l'adresse quand aucun studio inscrit n'est lié. */
    phrase: "Artiste en studio fixe",
    /** Ce qui précède le nom du studio quand il est lié. */
    phraseLiee: "Résident chez",
  },
  {
    slug: "domicile",
    label: "À domicile",
    titre: "À domicile",
    phrase: "À domicile / Secteur :",
    phraseLiee: "À domicile / Secteur :",
  },
  {
    slug: "guest",
    label: "Guest",
    titre: "Guest",
    phrase: "En session Guest à",
    phraseLiee: "En Guest chez",
  },
] as const;

export type GenreMode = (typeof GENRES_MODE)[number]["slug"];

/**
 * JUSQU'OÙ UN ARTISTE SE DÉPLACE — le rayon du mode « à domicile ».
 * ⚠️ IL NE S'AFFICHE QU'AUTOUR D'UNE VILLE, jamais autour d'une
 * région ni d'un pays : « 50 km autour de la France » ne veut rien
 * dire. C'est exactement la règle du champ de localité du moteur.
 */
export const RAYONS_DEPLACEMENT = [10, 25, 50, 100, 200] as const;

/**
 * LE SOUS-CHOIX DU MODE « EN STUDIO » — fondateur ou résident.
 * =============================================================
 * « En studio » disait où l'on tatoue, jamais à quel titre. Or les
 * deux situations n'ont rien à voir : celui qui a monté le lieu et
 * celui qui y a sa place. C'est la première chose qu'un client
 * comprend d'un studio, et elle manquait.
 *
 * OBLIGATOIRE dès que « En studio » est choisi : un mode sans ce
 * sous-choix ne dit qu'une demi-vérité (voir `modeComplet`).
 */
export const ROLES_STUDIO = [
  // UN SEUL MOT, AU FORMULAIRE COMME SUR LA FICHE. « Fondateur /
  // Gérant » cherchait à couvrir les deux situations au moment de
  // choisir ; le double libellé pesait dans une pilule de 14 px et
  // faisait hésiter là où il n'y a pas à hésiter. « Fondateur » se
  // comprend seul — `choix` et `label` disent désormais la même
  // chose, et le slug (écrit en base) ne bouge pas d'une lettre.
  { slug: "fondateur", label: "Fondateur du salon", choix: "Fondateur" },
  { slug: "resident", label: "Artiste résident", choix: "Résident" },
] as const;

export type RoleStudio = (typeof ROLES_STUDIO)[number]["slug"];

/** Le libellé d'un rôle, ou la chaîne vide s'il est absent. */
export function libelleRoleStudio(slug: string | null | undefined): string {
  return ROLES_STUDIO.find((r) => r.slug === slug)?.label ?? "";
}

/**
 * La définition d'un genre, ou « En salon » à défaut.
 * ⚠️ LE REPLI EST NOMMÉ, PLUS POSITIONNEL (passe nº 107). Il s'écrivait
 * `GENRES_MODE[0]` : il changeait donc de sens à chaque fois que le
 * propriétaire demandait un autre ORDRE D'AFFICHAGE des quatre modes —
 * un réglage graphique qui n'a rien à voir avec ce qu'on montre d'une
 * ligne dont le genre serait illisible. « En salon » est le cas
 * courant, et c'était la valeur d'avant les remaniements d'ordre.
 * (Ce repli ne sert qu'aux slugs inconnus : la base, elle, contraint
 * la colonne aux quatre valeurs.)
 */
export function genreMode(slug: string | null | undefined) {
  return (
    GENRES_MODE.find((g) => g.slug === slug) ??
    GENRES_MODE.find((g) => g.slug === "salon")!
  );
}

/** « Artiste » ou « Studio » — sur les CARTES de la mosaïque. Sur la
    fiche publique d'un artiste, ce sont ses MODES qui prennent cette
    place (voir `libelleModesActifs` dans lib/modes-exercice). */
/**
 * LE MOT POSÉ SUR UNE CARTE ET EN TÊTE D'UNE FICHE.
 * Trois valeurs, et trois seulement : « Artiste », « Salon »,
 * « Studio ». Le studio privé s'annonce « Studio » tout court sur une
 * carte — le badge est étroit, et « privé » n'apprend rien à qui
 * regarde une mosaïque ; la fiche, elle, le dit en toutes lettres.
 */
export function libelleTypeFiche(
  slug: string | null | undefined,
  etablissement?: string | null
): string {
  const nature = natureDeLaFiche(slug, etablissement);
  if (nature === "artiste") return "Artiste";
  return nature === "prive" ? "Studio" : "Salon";
}

/**
 * LES RAYONS DE RECHERCHE, en kilomètres.
 * Des paliers FIXES plutôt qu'un curseur libre : « 27 km » n'a aucun
 * sens pour la personne qui cherche, et multiplierait les adresses
 * indexables pour rien.
 *
 * LE PREMIER PALIER EST DIX KILOMÈTRES. Le palier « 0 km » — la ville
 * choisie sans ses alentours — a existé un temps ; il est retiré. Une
 * recherche de tatoueur ne s'arrête pas au panneau d'entrée d'une
 * commune : chercher « Lyon » sans Villeurbanne ni Vénissieux ne rend
 * service à personne, et laissait des recherches vides là où il y
 * avait vingt tatoueurs à dix minutes.
 * MÊMES PALIERS SUR WEB ET SUR SMARTPHONE : les pilules du panneau et
 * le curseur de la fenêtre lisent la même liste.
 */
export const RAYONS_TATOUAGE = [10, 25, 50, 100, 200];

/** Le plus petit rayon possible — le premier palier. */
export const RAYON_TATOUAGE_MINIMUM = RAYONS_TATOUAGE[0];

/** Le rayon proposé par défaut dès qu'une ville est choisie. */
export const RAYON_TATOUAGE_DEFAUT = 50;

/**
 * LE RAYON RETENU, quoi qu'on lui donne.
 * Les adresses partagées AVANT cette passe portent encore
 * « rayon=0 » : elles remonteraient une recherche vide. On les ramène
 * au premier palier plutôt que de leur rendre un mode qui n'existe
 * plus. Une valeur absurde (vide, texte, négative) repart du défaut.
 */
export function rayonRetenu(km: number): number {
  if (!Number.isFinite(km) || km <= 0) return RAYON_TATOUAGE_DEFAUT;
  return Math.max(RAYON_TATOUAGE_MINIMUM, km);
}

/** Combien de cartes la grille affiche au plus, en une fois. */
export const CARTES_PAR_PAGE = 24;

/**
 * LE DÉLAI DE RÉFLEXION AVANT SUPPRESSION DÉFINITIVE, en jours.
 * TRENTE JOURS : le standard du secteur — assez long pour qu'un
 * regret ait le temps de venir, assez court pour ne pas garder des
 * données que plus personne ne réclame.
 * ÉCRIT ICI — donc lisible aussi bien par l'écran de confirmation
 * (navigateur) que par la mécanique serveur (lib/suppression-compte) :
 * le chiffre ANNONCÉ et le chiffre APPLIQUÉ ne peuvent pas diverger.
 * Pendant ce délai, le compte est invisible mais INTACT : une simple
 * reconnexion le rétablit.
 * (Les demandes DÉJÀ en cours gardent l'échéance qui leur avait été
 * annoncée : elle est écrite en base, pas recalculée — voir
 * supabase/yokofolio-suppression-differee.sql.)
 */
export const DELAI_SUPPRESSION_JOURS = 30;

/**
 * OÙ L'ON ARRIVE APRÈS S'ÊTRE CONNECTÉ
 * =====================================
 * ⚠️ LA RÈGLE A CHANGÉ À LA PASSE Nº 137, et elle REMPLACE celle de
 * la nº 131 (« toujours Ma fiche ») : le site ne s'adresse plus aux
 * seuls tatoueurs.
 *
 *   · le compte a AU MOINS UN PORTFOLIO → sa fiche, comme avant ;
 *   · le compte n'en a AUCUN → ses FAVORIS.
 *
 * ELLE VAUT AUSSI JUSTE APRÈS LA CRÉATION DU COMPTE — et c'est ce qui
 * la rend juste : quelqu'un qui vient d'ouvrir un compte pour garder
 * des photos n'a rien à faire devant un formulaire de portfolio.
 *
 * ⚠️ POURQUOI UNE ADRESSE D'AIGUILLAGE, ET PAS UN CHOIX DANS L'ÉCRAN
 * DE CONNEXION ? Parce que la réponse demande de LIRE LA BASE (« ce
 * compte a-t-il un portfolio ? »), et que la question se pose à cinq
 * endroits : le formulaire de connexion, la création de compte, le
 * retour d'un lien d'e-mail (/auth/callback, côté serveur), le
 * nouveau mot de passe, et la reprise de session. Une page qui tranche
 * une fois pour toutes vaut mieux que cinq lectures à tenir d'accord —
 * et /auth/callback, qui tourne sur le serveur, ne pourrait de toute
 * façon pas interroger un magasin de navigateur.
 *
 * `?bienvenue=1` (retour d'un compte dont la suppression est annulée)
 * traverse l'aiguillage sans être touché.
 */
export const ARRIVEE_APRES_CONNEXION = "/apres-connexion";

/** LA PAGE DU PORTFOLIO — l'une des deux sorties de l'aiguillage.
    AUCUN IDENTIFIANT DE FICHE DANS L'ADRESSE, ET C'EST VOULU : sans
    paramètre `fiche`, `ficheActive()` prend celle qui est RETENUE (le
    choix du sélecteur, gardé en mémoire locale), et à défaut la
    première. */
export const ARRIVEE_AVEC_PORTFOLIO = "/devenir-tatoueur/fiche?vue=apercu";

/** L'AUTRE SORTIE — les favoris, pour qui n'a pas de portfolio. */
export const ARRIVEE_SANS_PORTFOLIO = "/mes-favoris";

/**
 * LA BIO DU TATOUEUR — FACULTATIVE, plafonnée.
 * Plus aucun minimum : une fiche sans bio est une fiche complète.
 * Au plus 150 caractères : deux ou trois phrases nettes — la fiche
 * est une vitrine, la bio se lit d'un coup d'œil juste sous le nom.
 * La borne en base suit dans supabase/yokofolio-hors-ligne.sql ; le
 * champ à compteur est src/components/ChampBio.tsx.
 */
export const BIO_MAXIMUM = 150;

/**
 * LES COULEURS DU FOND SOMBRE
 * ---------------------------
 * Anthracite très foncé, JAMAIS noir pur : le noir absolu écrase les
 * photos et fatigue l'œil sur grand écran. Les cartes sont un cran
 * plus claires que le fond — c'est ce décalage, et non un contour
 * marqué, qui les fait exister.
 *
 * Contrastes vérifiés sur le fond #1A1A1D :
 *  - texte principal #F2F2F4 → 15,4:1 (AAA)
 *  - texte discret  #A8A8B0 → 7,4:1  (AAA pour le petit texte)
 *  - rose #EE3D6F           → 4,9:1  (AA, et AAA en gras 18 px+)
 * Aucun gris plus sombre que #A8A8B0 ne doit servir à du texte.
 */
export const COULEURS_SOMBRE = {
  /** Le fond de page. */
  fond: "#1A1A1D",
  /** Les cartes et les blocs : un cran plus clair que le fond. */
  carte: "#232327",
  /** Un cran encore au-dessus : champs, éléments survolés. */
  eleve: "#2C2C31",
  /** LE FOCUS D'UN CHAMP (passe nº 116) : le fond s'éclaircit très
      légèrement, et le curseur clignote — c'est tout. Le contour rose
      au focus a disparu : le rose est réservé à ce qui compte (badges
      sélectionnés, bouton final, ligne du sélecteur). */
  eleveClair: "#35353B",
  /** Les traits : présents, jamais visibles avant qu'on les cherche. */
  bordure: "#38383F",
  /** LE HAUT DE L'ÉCHELLE (passe nº 144). Les fenêtres du web ont été
      éclaircies d'un cran (`carte` → `eleve`) pour mieux se détacher
      de la page : tout ce qui est POSÉ SUR ELLES devait grimper
      d'autant, et l'échelle manquait d'un barreau au-dessus de
      `bordure`. C'est lui — jamais employé ailleurs que comme dernier
      niveau d'un empilement (sélecteur ouvert dans « Mon compte »,
      badge sélectionné dans le panneau des filtres). */
  haut: "#414149",
  /** LE CRAN AU-DESSUS DE `haut` (passe nº 146-§3). Le sélecteur de
      portfolios se confondait avec le fond de la fenêtre « Mon
      compte » : son repos monte à `haut`, et son état ouvert — ainsi
      que sa liste, qui le prolonge — avait donc besoin d'un barreau de
      plus. Même usage strict que `haut` : le DERNIER niveau d'un
      empilement, jamais un fond courant. */
  hautClair: "#4B4B54",
  /** Le texte principal. */
  texte: "#F2F2F4",
  /** Le texte discret (ville, styles, mentions). */
  texteDoux: "#A8A8B0",
};

/** Les textes du site, au même endroit que le reste. */
export const TEXTES_TATOUAGE = {
  /**
   * LE TITRE DE LA PAGE D'ACCUEIL — visible, dans le bloc de recherche.
   * Il est descriptif À DESSEIN : c'est la phrase que les moteurs de
   * recherche lisent en premier, et celle qui doit répondre à ce que
   * les gens tapent (« tatoueur réalisme Lyon »).
   */
  titreAccueil: "Trouve ton tatoueur, par style et par ville",
  /**
   * Le vrai texte de la page, sous le titre. Un moteur de recherche ne
   * sait rien faire de trois champs de formulaire : il lui faut des
   * phrases. Celles-ci décrivent honnêtement ce que fait le site.
   */
  paragrapheAccueil:
    "Choisis un style, une ville, un rayon : yokofolio affiche les tatoueurs " +
    "qui travaillent dans ce style près de chez toi, et une image de leur " +
    "travail pour ce style précis. Chaque fiche renvoie vers le portfolio " +
    "du tatoueur, sur Instagram et TikTok.",
  /** Le libellé au-dessus des champs, à droite de l'icône rose. */
  titreRecherche: "Chercher un tatoueur",
  /**
   * LE BOUTON D'APPEL de la barre fixe.
   * ⚠️ « REJOINDRE », ET PLUS « Montrer mon travail » (passe nº 137).
   * L'ancienne formule ne s'adressait qu'aux PROFESSIONNELS — elle
   * datait d'un site où seuls les tatoueurs avaient une raison de
   * créer un compte. Le compte est désormais ouvert à tous : garder
   * des photos, suivre des tatoueurs. « Rejoindre » n'exclut personne
   * et ne promet rien de faux.
   * L'appel aux tatoueurs, lui, n'a pas disparu : il vit en BAS DE
   * L'ACCUEIL, après la mosaïque (« Tu es tatoueur ? »), là où il
   * s'adresse à quelqu'un qui a vu ce que le site fait.
   * Une fois CONNECTÉ, le bouton affiche « Mon espace » à la place.
   */
  lienInscription: "Rejoindre",
  /** LE TITRE AU-DESSUS DE LA MOSAÏQUE, sans recherche (nº 211-§1) —
      une INVITATION adressée au visiteur, et non plus la description
      d'un écran (« Explorer toutes les créations »).
      ⚠️ À NE PAS CONFONDRE avec `titreAccueil` ci-dessus, qui est le
      titre DESCRIPTIF du bloc de référencement : celui-ci parle au
      visiteur, celui-là aux moteurs de recherche. */
  titreMosaique: "Trouve ton prochain tatouage",
  /** Ce que le site EST, sous le titre. Il cède la place au résumé de
      la recherche dès qu'une recherche est en cours. */
  sousTitreMosaique: "Le portfolio des tatouages et des tatoueurs.",
  /** L'APPEL AUX TATOUEURS — en bas de l'accueil, après la mosaïque.
      Pas dans la barre fixe : elle n'a pas la place, et quatre
      visiteurs sur cinq arrivent par le téléphone. */
  titreAppelTatoueur: "Tu es tatoueur ?",
  boutonAppelTatoueur: "Créer mon portfolio",
  /**
   * LA LOCALITÉ PAR DÉFAUT, quand aucun lieu n'est choisi.
   * « Partout », et plus « Toute la France » : depuis la refonte de la
   * localisation, les fiches viennent du monde entier — un champ vide
   * ne veut plus dire « la France », il veut dire « aucune limite ».
   * Ce n'est PAS une entrée de la liste des suggestions : c'est l'état
   * du champ VIDE, celui où l'on revient par la croix d'effacement
   * (web) ou par le bouton « Effacer » (smartphone).
   */
  partoutLabel: "Partout",
  /** Le libellé fantôme du champ de localité. */
  ouLabel: "Où ?",
  descriptionSite:
    "Compare les portfolios des tatoueurs par style et par ville : " +
    "réalisme, fine line, old school, japonais, blackwork et bien d'autres.",
};

/**
 * LES ADMINISTRATEURS DE YOKOFOLIO
 * ---------------------------------
 * Les adresses e-mail des comptes Supabase autorisés à ouvrir /admin
 * (validation des fiches, signalements). Ajouter un administrateur =
 * ajouter son adresse ici, rien d'autre. La vérification se fait DES
 * DEUX CÔTÉS : l'écran /admin (affichage) et chaque API d'admin
 * (sécurité réelle, côté serveur).
 */
export const COURRIELS_ADMIN = ["rouxkev@gmail.com"];

/**
 * LES MOTIFS DE MODÉRATION — la liste pré-enregistrée de l'admin.
 * Cochés avec « Demander des modifications » COMME avec « Mettre la
 * fiche hors ligne » (au moins un motif exigé ; « autre » exige
 * quelques mots). Chaque motif est RATTACHÉ À UN CHAMP du formulaire
 * (`champ`) : côté tatoueur, le champ visé s'encadre de rouge et
 * porte l'explication (`explication`) juste dessous. Les motifs
 * partent en base avec la décision (motifs_moderation —
 * supabase/yokofolio-moderation.sql, remappage des anciens slugs
 * dans supabase/yokofolio-hors-ligne.sql).
 */
export const MOTIFS_MODERATION = [
  {
    slug: "photo-non-conforme",
    label: "Photo non conforme",
    champ: "photos",
    explication:
      "Une photo ne convient pas : remplace-la, puis réenregistre.",
  },
  {
    slug: "bio-inappropriee",
    label: "Bio inappropriée",
    champ: "bio",
    explication: "La bio ne convient pas : reformule-la.",
  },
  {
    slug: "nom-incorrect",
    label: "Nom incorrect",
    champ: "nom",
    explication: "Ce nom ne convient pas : corrige-le.",
  },
  {
    slug: "adresse-incorrecte",
    label: "Adresse incorrecte",
    champ: "adresse",
    explication:
      "L'adresse ne correspond pas : vérifie le numéro, la rue et la ville.",
  },
  {
    slug: "instagram-ne-correspond-pas",
    label: "Le compte Instagram ne correspond pas",
    champ: "instagram",
    explication: "Ce compte Instagram ne correspond pas à la fiche.",
  },
  {
    slug: "tiktok-ne-correspond-pas",
    label: "Le compte TikTok ne correspond pas",
    champ: "tiktok",
    explication: "Ce compte TikTok ne correspond pas à la fiche.",
  },
  {
    slug: "styles-non-conformes",
    label: "Styles déclarés non conformes",
    champ: "styles",
    explication:
      "Les styles déclarés ne correspondent pas aux photos montrées.",
  },
  {
    slug: "site-web-non-conforme",
    label: "Le site web ne correspond pas",
    champ: "site",
    explication: "Ce site web ne correspond pas à la fiche.",
  },
  {
    slug: "page-de-liens-non-conforme",
    label: "Le Linktree / Beacons ne correspond pas",
    champ: "pageDeLiens",
    explication:
      "Cette page de liens ne correspond pas à la fiche, ou ne s'ouvre pas.",
  },
  //  ⚠️ « formulaire-non-conforme » A ÉTÉ RETIRÉ à la passe nº 102,
  //  avec le champ « Formulaire de demande » lui-même. Un motif de
  //  refus qui désigne un champ inexistant encadre du vide : la fiche
  //  serait renvoyée en correction sans que rien ne soit corrigeable.
  { slug: "autre", label: "Autre (préciser)", champ: null, explication: null },
] as const;

/**
 * LES MOTIFS DE SIGNALEMENT d'une fiche — cochés par les visiteurs
 * (fenêtre « Signaler cette fiche »), sans aucune donnée personnelle.
 */
export const MOTIFS_SIGNALEMENT = [
  { slug: "usurpation", label: "Usurpation d'identité" },
  { slug: "contenu-inapproprie", label: "Contenu inapproprié" },
  { slug: "compte-ne-correspond-pas", label: "Le compte ne correspond pas" },
  { slug: "fiche-en-double", label: "Fiche en double" },
  { slug: "autre", label: "Autre (préciser)" },
] as const;

/**
 * LE FORMULAIRE DE CONTACT de yokofolio (/contact) — les bornes du
 * message et le garde-fou d'envois par adresse IP et par jour.
 */
export const CONTACT_YOKOFOLIO = {
  messageMin: 20,
  messageMax: 3000,
  maxParIpParJour: 5,
};

/**
 * LA LARGEUR MAXIMALE DU SITE
 * ---------------------------
 * 1760 px, la mesure des grands sites de grille. Une galerie d'images
 * n'a rien à gagner à être serrée : chaque centaine de pixels gagnée
 * fait tenir une colonne de cartes de plus, donc des images plus
 * nombreuses sans les rétrécir. Écrit une seule fois, utilisé partout
 * (barre, grille, pied de page) : les trois s'alignent au pixel.
 */
export const LARGEUR_SITE = "max-w-[1760px]";

/**
 * LE FORMAT DES PHOTOS, DÉCLARÉ UNE SEULE FOIS
 * =============================================
 * Les photos de portfolio sont découpées au dépôt : 4:5, 1080×1350 en
 * pleine résolution et 320×400 en miniature. Le portrait rond, lui, est
 * carré.
 *
 * ⚠️ À QUOI ÇA SERT : à ce qu'une image OCCUPE SA PLACE AVANT D'ARRIVER.
 * Une image sans dimensions ne prend aucune hauteur tant qu'elle n'est
 * pas chargée ; quand elle arrive, elle pousse tout ce qui la suit — et
 * la page bouge sous les yeux. Les cadres du site imposent déjà le
 * format par la feuille de style, mais déclarer les dimensions
 * intrinsèques rend la réserve indépendante d'elle : si la feuille
 * tarde, rien ne saute quand même.
 */
export const PHOTO_PORTFOLIO = { largeur: 1080, hauteur: 1350 } as const;
export const PHOTO_MINIATURE = { largeur: 320, hauteur: 400 } as const;
/** Le portrait rond (carte, fiche, équipe) — carré. */
export const PORTRAIT_ROND = 320;
