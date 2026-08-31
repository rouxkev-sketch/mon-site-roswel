/**
 * LES RÉGLAGES DE YOKOFOLIO
 * =========================
 * Tout ce qui se règle sans toucher au code vit ici : la marque, les
 * langues, les styles proposés, les rayons de recherche, les textes et
 * les couleurs du fond sombre.
 *
 * POURQUOI UN FICHIER À PART ? Parce que YOKOFOLIO EST UN PRODUIT À
 * PART ENTIÈRE, avec sa propre identité. Il a d'abord fallu le tenir
 * à l'écart des réglages des autres produits (artisans, agence) ;
 * ceux-ci ont depuis été supprimés du code — les pages et les routes
 * à la nº 760, leur fichier de réglages `config/roswel.ts` à la
 * nº 761. Il ne reste qu'un site.
 *
 * ⚠️ LA COULEUR PRIMAIRE EST ICI, ET NULLE PART AILLEURS (nº 761).
 * Elle venait de `roswel.ts` ; `COULEURS_SOMBRE.primaire` est désormais
 * sa seule source — y compris pour les deux endroits que le CSS
 * n'atteint pas, la flèche et le point des menus déroulants. La nº 762
 * l'a vérifié en pratique : le passage du rose au ROUGE n'a demandé
 * qu'une ligne ici, plus les deux nuances qui s'en déduisent.
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
 * ⚠️ LES ICÔNES DES LIENS NE SONT PLUS DES FICHIERS (nº 240-§1).
 * `ICONE_SITE` et `ICONES_RESEAUX` vivaient ici et pointaient sur
 * `site.png`, `icone-instagram(-rognee).png`, `icone-tiktok(-rognee).png`,
 * `icone-youtube.png` : les trois liens des fiches et le pied de page
 * sont désormais dessinés dans le code (`IconeDuLien`,
 * src/components/IconeReseau.tsx), en `currentColor`, sans disque.
 * Les fichiers déposés à la main par le propriétaire restent dans
 * `public/` — INTOUCHABLES et hors livraison, comme toujours — mais
 * plus rien ne les sert ; les versions rognées (dérivées, nº 231) sont
 * supprimées avec la mécanique du liseré qui les justifiait.
 */

/**
 * L'ICÔNE D'UNE ADRESSE — la pastille d'un lieu sans photo
 * (nº 224-§1). `adresse.png`, déposée à la main sous ce nom EXACT :
 * glyphe noir jamais retouché, éclairci par `invert` + opacité, et
 * jamais dans une livraison. Elle, elle RESTE un fichier : la nº 240
 * n'a redessiné que les trois icônes de liens.
 */
export const ICONE_ADRESSE = "/adresse.png";

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
  //  §4 (nº 465) — LA DISPONIBILITÉ S'INVERSE, sur consigne : ENGLISH
  //  est la langue en ligne (choisissable), FRANÇAIS passe « bientôt »
  //  — et il REPREND SA PLACE DANS L'ORDRE ALPHABÉTIQUE de la liste,
  //  après Deutsch, au lieu de rester en tête. Le reste de la liste et
  //  son ordre ne changent pas.
  { code: "en", label: "English", actif: true },
  { code: "es", label: "Español", actif: false },
  { code: "de", label: "Deutsch", actif: false },
  { code: "fr", label: "Français", actif: false },
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
 * à quarante entrées (nº 291), un ordre thématique oblige à balayer
 * la liste pour retrouver un style. L'AFFICHAGE EST DÉSORMAIS
 * ALPHABÉTIQUE, ET CALCULÉ — voir `stylesAlphabetiques()` et
 * `entreesExplorer()` plus bas. On peut donc ajouter une ligne ici
 * n'importe où : elle se rangera d'elle-même, à sa lettre.
 *
 * « Japonais · Irezumi » garde le slug historique `japonais` : un slug
 * publié ne change pas (référencement), seul le libellé évolue. Même
 * règle pour tous les autres — les slugs ci-dessous sont gravés dans
 * les adresses, les fiches et les liens déjà partagés.
 *
 * ⚠️ ET C'EST AUSSI LA RÈGLE DES SCISSIONS (nº 230-§2). « Biomécanique
 * / Organique » et « Cyber-tribal / Cyberpunk » sont devenus quatre
 * styles : le PREMIER de chaque paire garde le slug publié
 * (`biomecanique`, `cyber-tribal`), le second en reçoit un neuf
 * (`organique`, `cyberpunk`). Aucune adresse déjà partagée ne casse,
 * et la migration nº 66 donne LES DEUX styles à toute fiche qui
 * portait l'ancien — personne ne perd un style au passage.
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
  /**
   * ██ §2 (nº 400) — L'ÉTIQUETTE « MONOCHROME » ██
   * Un style ENTIÈREMENT NOIR : lui demander « noir et gris ou
   * couleur ? » n'a aucun sens. Le formulaire de l'espace tatoueur lit
   * cette étiquette (voir `estStyleMonochrome`, plus bas) et n'y montre
   * qu'un seul encadré, inerte, déjà posé sur « Noir et gris ».
   * ⚠️ EN AJOUTER UN NE DEMANDE QU'UNE LIGNE : `monochrome: true` sur
   * son entrée, ici. Aucun nom de style n'est écrit en dur ailleurs.
   * ⚠️ LE VISITEUR NE VOIT RIEN DE TOUT ÇA : filtres, fiches, titres de
   * galerie et vitrines continuent d'afficher « Noir et gris » et
   * « Couleur » comme avant. L'étiquette ne parle qu'au formulaire.
   */
  { slug: "blackwork", label: "Blackwork", couleur: "#26262B", monochrome: true },
  { slug: "dotwork", label: "Dotwork", couleur: "#4E4A42" },
  { slug: "geometrique", label: "Géométrique", couleur: "#3B5B7A" },
  { slug: "ornemental", label: "Ornemental", couleur: "#6B5540" },
  { slug: "old-school", label: "Old School", couleur: "#A2402F" },
  /**
   * ██ §1 (nº 401) — LE LIBELLÉ PASSE EN FRANÇAIS ██
   * « Neo-Traditional » devient « Néo-traditionnel ».
   * ⚠️ LE SLUG NE BOUGE PAS, ET C'EST TOUT CE QUI COMPTE : il était
   * DÉJÀ français (`neo-traditionnel`). C'est lui qui est écrit en base
   * (colonne `styles` des fiches, colonne `style` des photos), lui qui
   * fait l'adresse de la vitrine (`/tatouage/neo-traditionnel/<ville>`),
   * lui que portent les favoris et les liens déjà partagés. Changer le
   * seul libellé ne touche donc QUE ce qui s'affiche — aucune galerie
   * ne peut disparaître, aucune migration n'est nécessaire.
   * ⚠️ ET IL N'Y A QU'UN ENDROIT À CHANGER : tout le site lit ce mot
   * par `libelleStyle(slug)`, juste plus bas. Menus, filtres,
   * formulaire, titres de galerie, fiches, cartes, vitrines et données
   * structurées suivent sans être touchés.
   */
  { slug: "neo-traditionnel", label: "Néo-traditionnel", couleur: "#7A3A55" },
  { slug: "new-school", label: "New School", couleur: "#8A5A2E" },
  //  §1 (nº 291) — IL FIGURE AUSSI DANS « Cultures du monde », SANS
  //  quitter le premier niveau (voir `aussi`, plus bas). Un seul
  //  style, un seul slug, un seul jeu de photos : il se montre à deux
  //  endroits, il ne se compte jamais deux fois.
  { slug: "japonais", label: "Japonais · Irezumi", couleur: "#1F4E5F" },
  //  §1 (nº 291) — CHICANO NE BOUGE PAS : premier niveau, à sa lettre.
  { slug: "chicano", label: "Chicano", couleur: "#57544B" },
  //  §1 (nº 291) — DÉPLACÉ dans « Cultures du monde » : il quitte le
  //  premier niveau. Son slug, sa page /tatouage/tribal/<ville> et les
  //  fiches qui le portent ne bougent pas — une famille est un
  //  RANGEMENT, jamais une donnée.
  { slug: "tribal", label: "Tribal", couleur: "#3E3E36" },
  { slug: "aquarelle", label: "Aquarelle", couleur: "#4C6470" },
  { slug: "illustratif", label: "Illustratif", couleur: "#705E48" },
  { slug: "anime-manga", label: "Anime & Manga", couleur: "#6E4A62" },
  { slug: "abstrait", label: "Abstrait", couleur: "#565066" },
  { slug: "trash-polka", label: "Trash Polka", couleur: "#77303A" },
  { slug: "biomecanique", label: "Biomécanique", couleur: "#44575B" },
  //  ⚠️ SCINDÉ DE « Biomécanique / Organique » (nº 230-§2) : deux
  //  styles distincts. Le slug historique reste à « Biomécanique »
  //  (un slug publié ne change pas), « Organique » en reçoit un neuf.
  { slug: "organique", label: "Organique", couleur: "#4B5F52" },
  { slug: "ignorant-style", label: "Ignorant Style", couleur: "#54505B" },
  { slug: "cyber-tribal", label: "Cyber-tribal", couleur: "#474077" },
  //  ⚠️ SCINDÉ DE « Cyber-tribal / Cyberpunk » (nº 230-§2), même
  //  règle : le slug publié reste au premier, le second est neuf.
  { slug: "cyberpunk", label: "Cyberpunk", couleur: "#3A3560" },
  { slug: "lettering", label: "Lettering", couleur: "#5A4632" },
  //  ---- LES SEPT DE LA PASSE Nº 113 ----
  { slug: "acid-trad", label: "Acid-trad", couleur: "#6B7A2E" },
  //  §1 (nº 291) — RENOMMÉ « Bio-organique », SLUG INCHANGÉ. Le
  //  libellé seul évolue, et c'est la règle de ce fichier depuis
  //  toujours (« Japonais · Irezumi » garde `japonais`) : les
  //  portfolios déjà rangés en `bio-mecha` restent rangés, les liens
  //  déjà partagés (`?style=bio-mecha`) répondent encore, et il n'y a
  //  AUCUNE migration à lancer.
  //  ⚠️ CE N'EST PAS UN DOUBLON DE « Biomécanique », et il ne faut
  //  jamais les fusionner : la Biomécanique met du MÉTAL sous la peau,
  //  le Bio-organique de la CHAIR, de l'os, du tendon. Deux styles,
  //  deux publics.
  { slug: "bio-mecha", label: "Bio-organique", couleur: "#4A4550" },
  { slug: "chrome", label: "Chrome", couleur: "#5A6068" },
  { slug: "cyber-sigilism", label: "Cyber-sigilism", couleur: "#3E3A5C" },
  { slug: "gravure", label: "Gravure", couleur: "#4E4740" },
  { slug: "one-line", label: "One Line", couleur: "#5B5560" },
  { slug: "suminagashi", label: "Suminagashi", couleur: "#2F4A57" },
  //  ---- LES NEUF DE LA FAMILLE `cultures-du-monde` ----
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

/**
 * §2 (nº 400) — CE STYLE EST-IL ENTIÈREMENT NOIR ?
 * ------------------------------------------------------------------
 * La seule lecture de l'étiquette posée ci-dessus. Un style AJOUTÉ par
 * l'administration (STYLES_AJOUTES, nº 122) vient de la base et n'en
 * porte pas : il répond donc « non », ce qui est le comportement
 * d'avant cette passe — jamais une surprise.
 */
export function estStyleMonochrome(slug: string): boolean {
  const style = STYLES_TATOUAGE.find((entree) => entree.slug === slug);
  return Boolean(style && "monochrome" in style && style.monochrome);
}

/* ================================================================
 * LE CATALOGUE S'AGRANDIT — les styles nés d'une suggestion (nº 122)
 * ================================================================ */
/**
 * UN STYLE AJOUTÉ PAR L'ADMINISTRATION.
 * Il naît d'une suggestion de tatoueur, acceptée dans /admin : nom
 * arrêté par l'administration, rangement choisi (la liste principale
 * ou la famille « Cultures du monde »). En base, jamais dans ce
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
 * exactement comme avant, avec ses quarante styles (nº 291).
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
 * LE CATALOGUE COMPLET : les quarante d’origine (nº 291), plus ceux que
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

/** Le style demandé est-il connu ? Sinon on l'ignore plutôt que de vider
    la page. Vivait dans lib/tatoueurs ; déménagée ici (nº 359) parce que
    la fiche préparée d'avance lit ses tags DANS LE NAVIGATEUR
    (FicheSelonLAdresse) — et lib/tatoueurs, qui parle à la base, ne peut
    pas y entrer. lib/tatoueurs la ré-exporte : aucun appelant n'a bougé. */
export function styleConnu(slug: string | undefined): string {
  return slug && styleDuCatalogue(slug) ? slug : "";
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
 * page /tatouage/cultures-du-monde/<ville> ne peut exister. Ouvrir
 * une famille ne fait qu'une chose : montrer ce qu'elle contient.
 *
 * ⚠️ ET ELLE N'EST JAMAIS DÉCLARABLE. La fenêtre « Ajouter un style »
 * du formulaire (passe nº 116) reprend la porte du menu Explorer :
 * l’ouvrir montre les onze styles (nº 291), décalés à droite, et le tatoueur
 * choisit l'un d'eux — « Maori », pas « du traditionnel ethnique ».
 */
export const FAMILLES_STYLES = [
  {
    //  ⚠️ RENOMMÉE À LA nº 239-§2 — « Traditionnel ethnique » est
    //  devenu « Cultures du monde », slug compris. LE SLUG POUVAIT
    //  CHANGER SANS RIEN CASSER, et c'est vérifié : une famille n'est
    //  pas cherchable, elle n'a donc JAMAIS eu d'adresse publique
    //  (/tatouage/traditionnel-ethnique/<ville> a toujours répondu
    //  404, par construction) — rien à rediriger. En base, il ne vit
    //  qu'à un seul endroit, `suggestions_style.famille` : voir la
    //  migration nº 67, qui le renomme et refait sa contrainte.
    slug: "cultures-du-monde",
    label: "Cultures du monde",
    //  CEUX QUI VIVENT ICI, ET NULLE PART AILLEURS : ils quittent le
    //  premier niveau du menu et ne se lisent que dans la famille.
    //  (nº 291 — « Tribal » les rejoint.)
    styles: [
      "berbere",
      "celtique",
      "copte",
      "maori",
      "nordique",
      "pa-tutiki",
      "polynesien",
      "sicanje",
      "tribal",
      "yoruba",
    ],
    /**
     * §1 (nº 291) — CEUX QUI FIGURENT ICI **SANS** QUITTER LE PREMIER
     * NIVEAU.
     * ----------------------------------------------------------------
     * « Japonais · Irezumi » se lit à sa lettre dans la liste ET dans
     * cette famille : il appartient aux deux lectures. Ce n'est pas
     * une copie — c'est LE MÊME STYLE, le même slug, le même jeu de
     * photos, le même compteur, le même résultat de recherche. Le menu
     * l'affiche à deux endroits ; tout le reste du site n'en connaît
     * qu'un.
     * ⚠️ D'OÙ LES DEUX LECTURES SÉPARÉES, plus bas : `famillesStyles()`
     * dit CE QUE LA FAMILLE MONTRE (`styles` + `aussi`), et
     * `stylesRangesEnFamille()` dit CE QUI QUITTE LE PREMIER NIVEAU
     * (`styles` seul). Les confondre remettrait Japonais hors de la
     * liste alphabétique — c'est précisément ce qu'on ne veut pas.
     */
    aussi: ["japonais"],
    /**
     * §2 (nº 292) — LE LIBELLÉ D'UN STYLE **DANS CETTE FAMILLE**.
     * ----------------------------------------------------------------
     * Sous « Cultures du monde », l'entrée s'écrit « Irezumi » tout
     * court : le mot « Japonais » y serait un pléonasme — la famille
     * dit déjà de quelle culture on parle. Au PREMIER NIVEAU, où rien
     * ne le situe, il garde son nom complet « Japonais · Irezumi ».
     * ⚠️ C'EST UN LIBELLÉ, RIEN D'AUTRE. Même style, même slug
     * (`japonais`), même jeu de photos, même compteur, même résultat
     * de recherche : seul le mot affiché change selon l'endroit. Le
     * catalogue (`libelleStyle`) n'en sait rien et ne doit rien en
     * savoir — sinon le nom changerait aussi sur les fiches, les
     * badges et les pages style + ville.
     */
    intitules: { japonais: "Irezumi" } as Record<string, string>,
  },
] as const;

/**
 * LES FAMILLES, REGISTRE COMPRIS (nº 122).
 * Un style accepté par l'administration peut être rangé dans
 * « Cultures du monde » : il rejoint alors la famille exactement
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
    //  CE QUE LA FAMILLE MONTRE : les siens, ceux qui y figurent SANS
    //  la rejoindre (nº 291), et ceux que l'administration y a rangés.
    styles: [
      ...famille.styles,
      ...famille.aussi,
      ...lesStylesAjoutes()
        .filter((style) => style.famille === famille.slug)
        .map((style) => style.slug),
    ],
  }));
}

/**
 * LES SLUGS QUI QUITTENT LE PREMIER NIVEAU — calculé, jamais recopié.
 * ⚠️ CE N'EST PAS `famillesStyles()`, et la nuance est tout le §1 de
 * la nº 291 : `aussi` en est EXCLU. Un style « aussi » se lit dans la
 * famille sans perdre sa place à sa lettre ; s'il entrait dans cet
 * ensemble, il disparaîtrait de la liste alphabétique.
 */
function stylesRangesEnFamille(): Set<string> {
  return new Set<string>(
    FAMILLES_STYLES.flatMap((famille) => [
      ...famille.styles,
      ...lesStylesAjoutes()
        .filter((style) => style.famille === famille.slug)
        .map((style) => style.slug),
    ])
  );
}

/** LES STYLES, DE A À Z — la liste du FORMULAIRE : les familles n'y
    existent pas, chaque style est à sa lettre. QUARANTE d'origine
    (nº 291), plus ceux que l'administration a acceptés. Chacun UNE
    SEULE FOIS : elle part du catalogue, où « Japonais · Irezumi »
    n'a qu'une ligne — les deux places qu'il occupe dans le menu ne
    sont qu'un affichage. */
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
 * LES TRENTE ET UNE ENTRÉES DU MENU « EXPLORER », DE A À Z (nº 291).
 * Trente styles isolés + une famille, rangés ensemble par leur
 * libellé : « Cultures du monde » se place entre « Chrome » et
 * « Cyber-sigilism » comme n'importe quel autre mot — la famille ne
 * saute pas en fin de liste, elle prend simplement sa lettre. (Elle
 * était à la lettre T avant la nº 239 ; le tri est calculé, il l'a
 * suivie tout seul.)
 *
 * ⚠️ LES NOMBRES, TENUS À JOUR (nº 291) : QUARANTE styles au
 * catalogue ; DIX vivent dans la famille et n'apparaissent que là ;
 * TRENTE restent au premier niveau — dont « Japonais · Irezumi », qui
 * se lit EN PLUS dans la famille. La famille en montre donc ONZE,
 * mais le catalogue n'en compte toujours que quarante : la seconde
 * place de Japonais est un affichage, pas une ligne de plus.
 * (Les nombres d'avant — « trente entrées », « vingt-neuf isolés »,
 * « trente-huit d'origine » — dataient de la nº 230, qui avait scindé
 * deux styles en quatre sans qu'on repasse par ici.)
 */
export function entreesExplorer(): EntreeExplorer[] {
  const enFamille = stylesRangesEnFamille();
  const isoles: EntreeExplorer[] = catalogueStyles()
    .filter((style) => !enFamille.has(style.slug))
    .map((style) => ({
      genre: "style",
      slug: style.slug,
      label: style.label,
    }));
  const familles: EntreeExplorer[] = famillesStyles().map((famille) => {
    //  §2 (nº 292) — LE LIBELLÉ DE FAMILLE, quand il y en a un : c'est
    //  la SEULE différence entre les deux places d'un même style.
    const propres =
      FAMILLES_STYLES.find((une) => une.slug === famille.slug)?.intitules ?? {};
    return {
      genre: "famille",
      slug: famille.slug,
      label: famille.label,
      styles: famille.styles
        .map((slug) => ({ slug, label: propres[slug] ?? libelleStyle(slug) }))
        .sort(parLibelle),
    };
  });
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
 * LE MENU S’OUVRE DONC SUR DEUX MOTS, pas sur trente et un : TATOUAGES
 * et FLASHS. On en déplie UN, et les styles apparaissent dessous —
 * précédés de « Tous les … » pour qui n'a pas de style en tête.
 * Déplier l’autre referme le premier : on ne lit jamais soixante-deux
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
      //  §3 (nº 465) — TEBORI AVANT HANDPOKE, sur consigne. L'ordre
      //  d'affichage de ce groupe se lit ICI, la source unique : les
      //  filtres du doigt, ceux du web et les badges du moteur posent
      //  la liste telle quelle. Machine reste en dernier, rien
      //  d'autre ne bouge.
      { slug: "tebori", label: "Tebori" },
      { slug: "handpoke", label: "Handpoke" },
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
 *   · OÙ IL TATOUE — comment l'artiste travaille : Studio · Salon ·
 *                    Guest (nº 402 — « à domicile » est supprimé ;
 *                    nº 414-417 — un quatrième mode l'a remplacé un
 *                    temps ; nº 418 — il est abandonné à son tour, et
 *                    il ne reste que ces trois-là)
 *
 * ⚠️ LA GRAMMAIRE QUI SÉPARAIT LES DEUX GROUPES (noms d'un côté,
 * compléments de lieu de l'autre) N'EXISTE PLUS depuis la nº 402 : le
 * propriétaire fait tomber le « en » — « Salon », « Studio », « Guest »
 * des deux côtés. C'est le TITRE du groupe qui distingue désormais
 * (« Profil » / « Artiste »), et lui seul.
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
  //  ██ nº 402 — TROIS OPTIONS : « à domicile » est supprimé du site,
  //  et les libellés tombent le « en » — « Salon », « Studio »,
  //  « Guest », dans l'ordre du sélecteur du formulaire. LES SLUGS NE
  //  BOUGENT PAS : ce sont les clés du langage `exclure=` — un vieux
  //  lien `exclure=a-domicile` est simplement ignoré (`filtresConnus`
  //  ne garde que les slugs connus).
  //  ██ nº 403 — STUDIO PASSE DEVANT SALON ██
  //  Le propriétaire veut UN SEUL ordre sur tout le site : Studio ·
  //  Salon · Guest. Ce groupe était le dernier à ne pas le suivre —
  //  la nº 402 l'avait posé en « Salon · Studio · Guest » alors que
  //  GENRES_MODE et RANG_DU_GENRE (l'ordre des profils sur une fiche)
  //  disaient déjà Studio d'abord. Les trois listes concordent
  //  désormais. LES SLUGS NE BOUGENT PAS : l'ordre d'un groupe n'a
  //  aucun effet sur ce qui part vers la base — `exclure=` est un
  //  ENSEMBLE, pas une liste.
  //  ██ nº 414 — « DISPONIBLE » ENTRE, EN DERNIER ██
  //  Le quatrième mode (l'artiste qui CHERCHE un lieu) prend la place
  //  qu'occupait « à domicile » dans ce groupe : une option de plus,
  //  même position dans la liste que dans le sélecteur du formulaire.
  //  ⚠️ LE SLUG DU FILTRE EST `disponible`, PAS `a-domicile` : l'ancien
  //  slug portait l'ancien sens. Un vieux lien `exclure=a-domicile`
  //  reste simplement ignoré (`filtresConnus` ne garde que les slugs
  //  connus) — il n'éteint donc RIEN, la recherche se fait comme si le
  //  filtre n'avait pas été touché.
  //  ██ nº 415 — LE MODE SE NOMME, ET IL PASSE EN PREMIER ██
  //  DEUX CHANGEMENTS, ET UN SEUL EST VISIBLE :
  //   · LE LIBELLÉ change — « Disponible » laissait croire à un carnet
  //     ouvert. La nº 415 avait posé « Freelance » ; la nº 416 écrit
  //     « Independent », EN ANGLAIS ET SANS ACCENT (voir GENRES_MODE) ;
  //   · L'ORDRE devient Freelance · Studio · Salon · Guest, ici comme
  //     au sélecteur du formulaire et comme RANG_DU_GENRE. Les trois
  //     listes ordonnées bougent ENSEMBLE (règle nº 403).
  //  ⚠️ LE SLUG NE BOUGE PAS, ET C'EST UN CHOIX (nº 415) : `disponible`
  //  voyage dans l'adresse (`exclure=disponible`) et vaut la valeur
  //  écrite en base. Rien ne l'impose — « disponible » ne CONTREDIT pas
  //  « freelance » (un artiste sans établissement est disponible), à la
  //  différence de `domicile`, qui affirmait un lieu qui n'existait
  //  plus. Le renommer casserait les liens déjà partagés sans rien
  //  apprendre à personne. C'est la règle des nº 402 et 403 : le
  //  libellé change, la valeur jamais.
  //  ██ nº 757 — LA CINQUIÈME LISTE REJOINT LES QUATRE AUTRES ██
  //  ==================================================================
  //  ⚠️ ET ELLE NE CHANGE RIEN À L'ÉCRAN, IL FAUT LE DIRE D'ABORD.
  //  Ce groupe est RETIRÉ DU VOLET DE FILTRES depuis la nº 444
  //  (décision du propriétaire, voir SLUGS_FILTRES_RETIRES juste plus
  //  bas) : aucun visiteur ne peut cocher ni décocher ces cases, et
  //  `filtresConnus` écarte ses slugs de toute recherche — `p_modes`
  //  part donc TOUJOURS à `null`. Les deux options ajoutées ici sont
  //  inertes tant que le groupe ne revient pas à l'écran.
  //  POURQUOI LES POSER QUAND MÊME : parce que la règle du site est
  //  que LES LISTES ORDONNÉES BOUGENT ENSEMBLE (nº 403, redite dans
  //  BlocModesExercice). Quatre d'entre elles portent les cinq genres
  //  — le catalogue (GENRES_MODE, nº 749), le sélecteur du formulaire
  //  (nº 751), l'ordre des profils d'une fiche (RANG_DU_GENRE, nº 753)
  //  — et celle-ci en montrait trois. Une liste qui reste en arrière
  //  est ce qui fait diverger le vocabulaire à la passe suivante.
  //  ⚠️ LA RÈGLE 5 DE LA CONCEPTION nº 748-D EST DONC PÉRIMÉE, et
  //  c'est nº 444 qui l'a périmée — une décision POSTÉRIEURE à elle.
  //  Le jour où le propriétaire voudra rendre ce filtre au visiteur,
  //  il n'y aura rien à écrire ici : les cinq cases l'attendent.
  //  ⚠️ LES LIBELLÉS SONT CEUX DE `GENRES_MODE` (le catalogue), et pas
  //  ceux du sélecteur du formulaire : celui-ci dit « Autre » à
  //  l'ARTISTE qui choisit son mode (nº 751, décision du
  //  propriétaire), tandis que le VISITEUR qui cherche lit
  //  « INDEPENDENT » sur les fiches (nº 755). Un filtre parle au
  //  visiteur : il dit le mot des fiches.
  //  ⚠️ LES SLUGS NE BOUGENT PLUS JAMAIS une fois posés : ce sont les
  //  clés du langage `exclure=`, qui voyage dans les liens partagés.
  //  ⚠️ AUCUN SQL POUR LA RECHERCHE ELLE-MÊME : la fonction de base
  //  compare les genres de façon générique (`m.genre = any(p_modes)`)
  //  et les trois vues géographiques prennent TOUS les genres depuis
  //  la nº 749 — un vrai PostgreSQL l'a prouvé à la nº 757, les cinq
  //  modes sortent d'une recherche par ville sans une ligne de SQL de
  //  plus.
  options: [
    { slug: "en-studio-prive", label: "Studio", genre: "prive" },
    { slug: "en-salon", label: "Salon", genre: "salon" },
    { slug: "en-guest", label: "Guest", genre: "guest" },
    { slug: "en-convention", label: "Convention", genre: "convention" },
    { slug: "independent", label: "Independent", genre: "independent" },
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
 * ██ nº 404 — « NOIR » ARRIVE, AVANT « NOIR ET GRIS » ██
 * TROIS RENDUS DISTINCTS, TROIS FILTRES DISTINCTS, AUCUN ENGLOBEMENT :
 * chercher « Noir et gris » ne remonte PAS les galeries « Noir » — la
 * comparaison est une égalité de slug, en base (`p2.rendu =
 * p_photo_rendu`) comme en mémoire (`carrousel.rendu === renduVoulu`).
 * L'ordre est celui de RENDUS_PHOTO (lib/photos-tatoueur) : les deux
 * listes doivent bouger ensemble.
 */
export const FILTRE_RENDU = {
  groupe: "rendu",
  titre: "Rendu",
  options: [
    { slug: "black", label: "Noir" },
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

/**
 * ██ nº 444 — LES DEUX GROUPES RETIRÉS DE L'ÉCRAN ██
 * ==================================================================
 * LA DÉCISION DU PROPRIÉTAIRE (passe nº 444) : les blocs ARTISTE (le
 * groupe `mode` — Studio, Salon, Guest) et LIEU (le groupe `type` —
 * Studio, Salon) sont supprimés du volet de filtres, mobile comme
 * ordinateur.
 *
 * ⚠️ LEURS GROUPES RESTENT DÉFINIS ICI, ET C'EST VOULU : la base les
 * connaît (`etablissement`, `modes_exercice.genre`), le formulaire de
 * fiche s'en sert, et les libellés servent encore à écrire une fiche.
 * Ce qui disparaît, c'est leur pouvoir de FILTRER une recherche.
 *
 * LA GARDE DES VIEUX LIENS (règles 328/329) : une adresse qui porte
 * encore un de ces slugs (« ?exclure=studio-prive%2Csalon », un lien
 * partagé, un signet) doit s'ouvrir NORMALEMENT — sans erreur, et sans
 * mosaïque secrètement filtrée par un critère que plus aucun bouton ne
 * peut défaire. `filtresVivants` les retire donc partout où `exclure`
 * est lu : au serveur (lib/tatoueurs, `filtresConnus` — la porte
 * unique de la recherche) comme au navigateur (MoteurTatouage,
 * `criteresComplets` — la porte unique des critères). Le paramètre
 * survit dans l'adresse sans plus rien faire, exactement comme les
 * réglages de mise en page de la nº 443.
 */
export const SLUGS_FILTRES_RETIRES = new Set<string>([
  ...FILTRE_MODE_ACTIVITE.options.map((o) => o.slug as string),
  ...FILTRE_TYPE_FICHE.options.map((o) => o.slug as string),
]);

/** Ne garde que les slugs des groupes ENCORE AFFICHÉS (nº 444). */
export function filtresVivants(slugs: string[] | undefined): string[] {
  return (slugs ?? []).filter((slug) => !SLUGS_FILTRES_RETIRES.has(slug));
}

/** Un slug de RENDU connu, ou la chaîne vide (adresse malmenée). */
export function renduConnu(slug: string | undefined): string {
  return slug && FILTRE_RENDU.options.some((o) => o.slug === slug) ? slug : "";
}

/**
 * LA RECHERCHE PORTE-T-ELLE SUR UN RENDU ?
 * =========================================
 * Le rendu ne se coche pas : il s'ÉTEINT. Les interrupteurs — TROIS
 * depuis la nº 404 : Noir, Noir et gris, Couleur — sont tous allumés
 * par défaut ; éteindre les autres, c'est chercher celui qui reste. Il
 * n'y a donc recherche par rendu que lorsqu'il en reste EXACTEMENT UN
 * d'allumé — plusieurs allumés (ou zéro) ne désignent rien, et la
 * fiche s'ouvre alors comme d'habitude. (Deux allumés sur trois
 * restreignent quand même LES FICHES : il faut une photo dans l'un des
 * deux — `p_rendus`, `allumesDuGroupe` — mais aucun rendu unique n'est
 * cherché.)
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
/**
 * ██ nº 402 — « À DOMICILE » EST SUPPRIMÉ, ET LES NOMS TOMBENT LE
 * « EN » ██
 * ==================================================================
 * DEUX DÉCISIONS DU PROPRIÉTAIRE, D'UN COUP :
 *  · le mode « à domicile » DISPARAÎT ENTIÈREMENT — du formulaire, des
 *    filtres, des fiches. Le site n'est pas en ligne et aucune fiche
 *    ne l'utilise : il n'y a rien à préserver. Retirer l'entrée D'ICI
 *    rétrécit le type `GenreMode` : le compilateur a désigné chaque
 *    branche morte, aucune n'a pu être oubliée ;
 *  · « En salon » et « En studio » deviennent « Salon » et « Studio »,
 *    partout — le libellé seul : les slugs `salon` et `prive`, écrits
 *    dans `modes_exercice.genre`, ne bougent pas d'une lettre.
 * ⚠️ LA CONTRAINTE DE BASE (`modes_exercice_genre_connu`) accepte
 * toujours `('salon','guest','domicile','prive')` : rien de ce qu'on
 * écrit désormais n'en sort, l'enregistrement marche SANS migration.
 * Celle du zip (`yokofolio-fin-du-mode-domicile.sql`) est un VERROU :
 * elle purge les lignes `domicile` (les démos en avaient deux) et
 * resserre la contrainte à trois valeurs.
 */
/**
 * ██ nº 414 — LE QUATRIÈME MODE : « DISPONIBLE » ██
 * ==================================================================
 * L'ARTISTE QUI CHERCHE UN LIEU. C'est le RETOUR de la mécanique du
 * mode « à domicile » (ville + rayon de déplacement, supprimés à la
 * nº 402) sous un AUTRE nom et un AUTRE sens : « à domicile » disait
 * « je reçois chez moi / je me déplace », « Disponible » dit « je
 * n'ai pas de lieu, je suis à la recherche d'un endroit où exercer ».
 * ⚠️ LE SLUG EST `disponible`, PAS `domicile` : le slug est la valeur
 * écrite en base (`modes_exercice.genre`) et il PORTE le sens —
 * réutiliser `domicile` aurait fait mentir chaque ligne future, et
 * toute requête, migration ou relecture qui tomberait dessus. Le mot
 * est neuf parce que le sens est neuf ; la mécanique, elle, est
 * l'héritage exact (colonne `rayon_km` conservée par la nº 402).
 * ██ nº 415 puis nº 416 — LE MOT CHANGE, LE SLUG RESTE ██
 * « Disponible » laissait croire à un carnet de rendez-vous ouvert ; la
 * nº 415 a posé « Freelance », la nº 416 écrit « Independent » (en
 * anglais, sans accent). Le mot dit ce qu'il faut : aucun
 * établissement de rattachement.
 * LE SLUG `disponible` NE BOUGE PAS — il est déjà écrit en base
 * et rien ne l'impose : « disponible » ne contredit pas « freelance »
 * (c'est le même artiste, décrit d'un autre bout), là où `domicile`
 * affirmait un lieu. Le changer imposerait de RÉÉCRIRE les lignes
 * existantes et de rejouer la contrainte, pour zéro gain visible.
 * C'est la règle des nº 402 et 403, appliquée une fois de plus : le
 * LIBELLÉ change, la VALEUR jamais.
 * ⚠️ ET L'ENTRÉE PASSE EN TÊTE (nº 415) : Independent · Studio ·
 * Salon · Guest, l'ordre du sélecteur du formulaire, du filtre et de
 * RANG_DU_GENRE. Cette liste-ci n'ordonne rien à elle seule (on y
 * cherche par slug, et le repli de `genreMode` est NOMMÉ, pas
 * positionnel) : elle suit pour que les quatre listes se lisent dans
 * le même ordre.
 * ⚠️ LA CONTRAINTE `modes_exercice_genre_connu` a été RESSERRÉE à
 * ('salon','guest','prive') par la nº 402 : sans migration, la base
 * REFUSE une ligne `disponible`. La migration de ce zip
 * (`yokofolio-mode-disponible.sql`) l'élargit — À COLLER AVANT LE
 * DÉPLOIEMENT (l'ancien site n'écrit jamais `disponible`, elle ne
 * risque rien ; dans l'autre ordre, enregistrer un mode Disponible
 * échouerait sur la contrainte jusqu'à son passage).
 * EN TÊTE de cette liste depuis la nº 415 : Independent · Studio ·
 * Salon · Guest — l'ordre dicté du sélecteur du formulaire.
 * ██ nº 418 — LE MODE SANS LIEU EST ABANDONNÉ ██
 * Son entrée a quitté cette liste (et sa tête de liste avec elle) :
 * le site est revenu à Studio · Salon · Guest, et la contrainte de
 * base à trois genres — les deux paragraphes ci-dessus sont l'histoire
 * de l'aller-retour, pas l'état courant.
 * ██ nº 749 — LE CATALOGUE PASSE À CINQ : convention, independent ██
 * La base d'abord (yokofolio-conventions-et-independent.sql, collée
 * avant ce déploiement — la règle de la nº 414) ; puis ce catalogue.
 * DEUX ENTRÉES DE PLUS, ET AUCUN ÉCRAN NE CHANGE, c'est le contrat de
 * la passe :
 *  · le sélecteur du formulaire (ORDRE_SELECTEUR, BlocModesExercice),
 *    le filtre « Artiste » (FILTRE_MODE_ACTIVITE) et l'ordre des
 *    profils (RANG_DU_GENRE) sont des listes EXPLICITES — ils ne
 *    montrent pas encore les nouveautés. Ils les gagneront aux passes
 *    d'écran (750 formulaire Convention, 751 formulaire Independent,
 *    754 moteur), dans l'ordre dicté : Studio · Salon · Guest ·
 *    Convention · Independent ;
 *  · les LIBELLÉS des nouveautés sont EN ANGLAIS (le site sera
 *    anglais au lancement — conception nº 748-C ; les modes existants
 *    passeront à l'anglais avec le chantier de traduction, pas ici) ;
 *  · `independent` est un SLUG NEUF, pas la réutilisation de
 *    `disponible` : le slug vaut la valeur en base et doit dire ce
 *    qu'il est (la leçon nº 414, écrite plus haut). `disponible`
 *    reste ACCEPTÉ par la contrainte et par les vues, par prudence.
 * ⚠️ LES PHRASES des deux nouveautés sont des VALEURS DE GARDE :
 * aucune ligne de ces genres n'existe encore, et la fiche publique de
 * la nº 753 posera les tournures définitives (plaque Convention avec
 * nom + dates, ligne de statut + zones Independent).
 */
export const GENRES_MODE = [
  {
    slug: "prive",
    label: "Studio",
    titre: "Studio",
    phrase: "Studio privé / Secteur :",
    phraseLiee: "Studio privé / Secteur :",
  },
  {
    slug: "salon",
    /** Ce qu'on lit sous le nom, sur la fiche publique. */
    label: "Salon",
    /** Ce qu'on lit dans le sélecteur du formulaire. */
    titre: "Salon",
    /** Ce qui précède l'adresse quand aucun studio inscrit n'est lié. */
    phrase: "Artiste en studio fixe",
    /** Ce qui précède le nom du studio quand il est lié. */
    phraseLiee: "Résident chez",
  },
  {
    slug: "guest",
    label: "Guest",
    titre: "Guest",
    phrase: "En session Guest à",
    phraseLiee: "En Guest chez",
  },
  //  nº 749 — LES DEUX NOUVEAUTÉS, EN QUEUE : l'ordre dicté est
  //  Studio · Salon · Guest · Convention · Independent (conception
  //  nº 748-B). Libellés en anglais, phrases = valeurs de garde
  //  jusqu'à la fiche publique de la nº 753 (voir la chronique
  //  ci-dessus) ; aucun écran ne les liste encore.
  {
    slug: "convention",
    label: "Convention",
    titre: "Convention",
    phrase: "At a convention in",
    phraseLiee: "At",
  },
  {
    slug: "independent",
    label: "Independent",
    titre: "Independent",
    phrase: "Service area:",
    phraseLiee: "Service area:",
  },
] as const;

export type GenreMode = (typeof GENRES_MODE)[number]["slug"];

/**
 * JUSQU'OÙ UN ARTISTE SE DÉPLACE — le rayon du mode « Independent »
 * (nº 414 ; hérité de l'ancien « à domicile », mêmes paliers).
 * ⚠️ IL NE S'AFFICHE QU'AUTOUR D'UNE VILLE, jamais autour d'une
 * région ni d'un pays : « 50 km autour de la France » ne veut rien
 * dire. C'est exactement la règle du champ de localité du moteur, et
 * elle est TENUE À DEUX ENDROITS (nº 415, point 4) : `leRayon`
 * n'affiche les badges que sur une précision « ville » ou « adresse »,
 * `rayonRequis` n'exige le rayon que là — un État ou un pays n'en
 * demande donc aucun, et le mode reste valide sans lui.
 */
export const RAYONS_DEPLACEMENT = [10, 25, 50, 100, 200] as const;

/**
 * ██ nº 749 — LES CINQ STATUTS DU MODE « INDEPENDENT » ██
 * ==================================================================
 * Le premier champ du futur formulaire Independent (nº 751) et la
 * première ligne de son bloc de lieux sur la fiche (nº 753) : un
 * choix UNIQUE parmi cinq. Les SLUGS sont les valeurs écrites en base
 * (`modes_exercice.statut`, contrainte `modes_exercice_statut_connu`
 * — yokofolio-conventions-et-independent.sql) ; les LIBELLÉS sont les
 * mots exacts de la conception nº 748-B2, en anglais.
 * ⚠️ LE STATUT VIT SUR LA LIGNE DE MODE, pas sur la fiche : un artiste
 * à trois zones a trois lignes qui le répètent — l'enregistrement les
 * écrit ensemble, la lecture prend la première (conception nº 748-A3).
 * ⚠️ « On break » NE CACHE PAS LA FICHE : elle reste dans les
 * résultats, le statut s'affiche dessus (décision du propriétaire,
 * avant la nº 749 — le moteur ne traite pas le statut).
 */
export const STATUTS_INDEPENDENT = [
  { slug: "guest_spots_only", label: "Guest spots only" },
  { slug: "conventions_only", label: "Conventions only" },
  { slug: "guest_spots_and_conventions", label: "Guest spots & conventions" },
  { slug: "on_break", label: "On break" },
  { slug: "available_on_request", label: "Available on request" },
] as const;

export type StatutIndependent = (typeof STATUTS_INDEPENDENT)[number]["slug"];

/** Le libellé d'un statut Independent — la chaîne vide s'il est
    absent ou inconnu : on n'affiche jamais un mot qu'on ne sait pas
    lire (la règle du booking d'équipe, nº 492). */
export function libelleStatutIndependent(
  slug: string | null | undefined
): string {
  return STATUTS_INDEPENDENT.find((s) => s.slug === slug)?.label ?? "";
}

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
/**
 * ██ nº 403 — L'ORDRE S'INVERSE, LES MOTS SE RÉDUISENT ██
 * ------------------------------------------------------------------
 * DEUX DEMANDES DU PROPRIÉTAIRE, ET AUCUNE NE TOUCHE AUX DONNÉES :
 *  · « Résident » PASSE DEVANT — c'est le cas de loin le plus
 *    fréquent, et une bascule se lit de gauche à droite ;
 *  · LES DEUX FORMES LONGUES DISPARAISSENT. « Fondateur du salon » et
 *    « Artiste résident » deviennent « Fondateur » et « Résident »,
 *    tout court. Le lieu est déjà nommé partout où le rôle s'affiche
 *    (l'encadré du formulaire, « Salon · … » sur la fiche) : le
 *    répéter dans le rôle allongeait sans rien apprendre.
 * ⚠️ LES SLUGS SONT LES VALEURS ÉCRITES EN BASE (`modes_exercice.role`,
 * contrainte `modes_exercice_role_connu`) : `fondateur` et `resident`
 * ne bougent pas d'une lettre. Personne ne change de rôle, et la
 * contrainte n'a pas à être touchée. Seul l'ordre de cette liste et
 * les deux mots affichés changent.
 * ⚠️ `label` ET `choix` DISENT MAINTENANT LA MÊME CHOSE POUR LES DEUX
 * (ce n'était le cas que de « Fondateur »). Les deux champs restent :
 * `libelleRoleStudio` et `libelleRoleCourt` ont chacun leurs
 * appelants, et les fusionner ne changerait rien à l'écran.
 * ⚠️ CE N'EST PAS LE DÉFAUT QUI CHANGE. Un mode neuf naît toujours sur
 * `fondateur` (voir `modeVierge`, BlocModesExercice), et la bascule ne
 * le lit plus par POSITION mais par NOM — sans quoi cette inversion
 * aurait silencieusement fait naître les nouveaux modes en
 * « résident ».
 */
export const ROLES_STUDIO = [
  { slug: "resident", label: "Résident", choix: "Résident" },
  { slug: "fondateur", label: "Fondateur", choix: "Fondateur" },
] as const;

export type RoleStudio = (typeof ROLES_STUDIO)[number]["slug"];

/** Le libellé d'un rôle, ou la chaîne vide s'il est absent. */
export function libelleRoleStudio(slug: string | null | undefined): string {
  return ROLES_STUDIO.find((r) => r.slug === slug)?.label ?? "";
}

/**
 * LE RÔLE EN UN SEUL MOT — « Fondateur », « Résident » (nº 222-§1f).
 * ⚠️ DEPUIS LA nº 403, `libelleRoleStudio` REND LE MÊME MOT : les
 * formes longues (« Artiste résident », « Fondateur du salon ») sont
 * supprimées. Les deux fonctions subsistent parce qu'elles ont chacune
 * leurs appelants ; elles ne peuvent plus diverger, puisque `label` et
 * `choix` portent la même valeur.
 */
export function libelleRoleCourt(slug: string | null | undefined): string {
  return ROLES_STUDIO.find((r) => r.slug === slug)?.choix ?? "";
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

/**
 * LE PALIER JUSTE AU-DESSUS — `null` quand il n'y en a plus (nº 307-§2).
 * C'est ce que fait « Élargir le rayon » sur un écran sans résultat :
 * UN cran, pas un saut au maximum. Un rayon hors paliers (une adresse
 * partagée à la main : `rayon=75`) trouve quand même son suivant —
 * on cherche le premier palier STRICTEMENT plus grand, pas un rang
 * dans la liste.
 * `null` au dernier palier : l'appelant n'affiche alors pas le bouton,
 * plutôt que d'en proposer un qui ne ferait rien.
 */
export function rayonSuivant(km: number): number | null {
  return RAYONS_TATOUAGE.find((palier) => palier > km) ?? null;
}

/** Combien de cartes la grille affiche au plus, en une fois. */
export const CARTES_PAR_PAGE = 24;

/**
 * §1 (nº 279) — LE PLAFOND DE CE QU'ON RAPATRIE POUR ÉCLATER EN
 * CARROUSELS.
 * ------------------------------------------------------------------
 * La mosaïque liste des carrousels, la base pagine des fiches : on lui
 * demande donc TOUTES les fiches qui répondent aux critères, puis on
 * éclate, on classe et on coupe côté site (lib/classement — l'écriture
 * unique). Ce plafond borne le pire des cas : deux mille fiches, c'est
 * déjà bien au-delà du catalogue, et cela reste une lecture bornée —
 * jamais « tout le catalogue » sans limite.
 * ⚠️ LE JOUR OÙ CE PLAFOND SERA ATTEINT, ce n'est pas lui qu'il faudra
 * lever : c'est le classement qu'il faudra descendre en base (la
 * formule est écrite une seule fois, elle se traduit sans se
 * réinventer).
 */
export const PLAFOND_CARROUSELS = 2000;

/**
 * §RÈGLE 2 (nº 283) — COMBIEN DE PHOTOS ON DEMANDE PAR FICHE, ET
 * POURQUOI CE NOMBRE EST GRAND
 * ------------------------------------------------------------------
 * ⚠️ CE N'EST PAS UN PLAFOND D'AFFICHAGE, c'est un plafond de LECTURE,
 * et il ne doit JAMAIS être ce qui décide qu'une carte existe. C'est
 * exactement ce qui s'était produit : la mosaïque demandait vingt
 * photos par fiche (le plafond d'UNE galerie), et depuis que la carte
 * vaut un carrousel (nº 279), toute galerie dont la première photo
 * arrivait après la vingtième de la fiche N'EXISTAIT PLUS — un salon à
 * cinq styles n'en montrait qu'un, pour toujours, sans message.
 *
 * ON DEMANDE DONC LARGE. Cinq cents photos par fiche, c'est vingt-cinq
 * galeries pleines : aucun portfolio réel n'en approche, et la lecture
 * reste bornée (jamais « tout », sans limite).
 *
 * ⚠️ ET LA MIGRATION Nº 69 REND CE NOMBRE INOFFENSIF : elle borne à DIX
 * PHOTOS PAR CARROUSEL au lieu de vingt par fiche. Demander cinq cents
 * revient alors à demander « dix par carrousel », c'est-à-dire
 * exactement ce que la règle 3 autorise. Avant la migration, la base
 * envoie tout et le site coupe lui-même (lib/carrousels) : les deux
 * versions donnent LA MÊME MOSAÏQUE, seule la quantité transportée
 * change. Aucune version du site n'exige la migration.
 */
export const PHOTOS_LUES_PAR_FICHE = 500;

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
 * ██ §1 (nº 696) — LE DÉLAI DE L'ADMINISTRATION : SEPT JOURS ██
 * ==================================================================
 * CE QUI CHANGE. Jusqu'ici la suppression d'un portfolio par
 * l'administration était IMMÉDIATE et définitive (nº 675, confirmée
 * par la nº 688) : un clic, et la ligne comme les photos partaient
 * sans retour. Le propriétaire veut un filet — le sien, pas un autre.
 * ⚠️ CE N'EST PAS UN SECOND MÉCANISME, et c'est le point. Les trente
 * jours du tatoueur ne sont rien de plus que deux colonnes,
 * `supprime_le` et `purge_le` (migration nº 24) : la fiche devient
 * invisible à la première, elle est effacée à la seconde. Sept jours
 * s'y écrivent exactement pareil — même colonnes, même vue
 * `fiches_a_purger`, même purge nocturne, même nettoyage du stockage
 * (nº 692). SEUL LE NOMBRE CHANGE. Aucune migration.
 * ⚠️ ET C'EST L'ÉCART QUI DIT QUI A DEMANDÉ : sept jours d'un côté,
 * trente de l'autre — l'écran d'administration lit `purge_le` moins
 * `supprime_le` et sait de quelle suppression il parle, sans qu'on
 * ait eu besoin d'ajouter une colonne pour le dire.
 */
export const DELAI_SUPPRESSION_ADMIN_JOURS = 7;

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
 */
export const ARRIVEE_APRES_CONNEXION = "/apres-connexion";

/**
 * L'ARRIVÉE, ET IL N'Y EN A PLUS QU'UNE (nº 313-§2).
 * ------------------------------------------------------------------
 * « Ma sélection », pour tout le monde, portfolio ou pas.
 * ⚠️ `ARRIVEE_AVEC_PORTFOLIO` EST SUPPRIMÉE, code compris : l'aiguillage
 * envoyait vers la fiche quand un portfolio existait, et ce n'était pas
 * voulu. Le nom est retiré pour qu'aucune passe future ne le retrouve
 * et ne rétablisse la bifurcation par mégarde.
 */
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
 * ██ §1-§2 (nº 466) — LE FOND DEVIENT LE BLEU NUIT #0B0F14, ET TOUTE
 * L'ÉCHELLE EST RECALCULÉE DESSUS ██
 * Le nouveau fond est plus sombre ET plus bleuté que l'anthracite
 * #1A1A1D d'avant : des niveaux restés au gris neutre auraient l'air
 * de taches sales posées dessus. Chaque barreau reprend donc la teinte
 * de la base (B > V > R, un écart qui grandit doucement en montant
 * pour rester perceptible), et l'ORDRE comme les ÉCARTS de la nº 287
 * (~13 points par niveau) sont conservés — l'escalier se lit pareil,
 * toujours sans le moindre contour.
 *
 * Contrastes vérifiés sur le fond #0B0F14 :
 *  - texte principal #F2F2F4 → 17,1:1 (AAA)
 *  - texte discret  #A8A8B0 → 8,1:1  (AAA pour le petit texte)
 *  - ROUGE #E11144          → 4,0:1  (nº 762) — voir l'avertissement
 *    posé sur `primaire` plus bas : ce rouge est plus SOMBRE que le
 *    rose qu'il remplace (5,4:1), il ne suffit donc plus au PETIT
 *    texte. En aplat, il fait mieux : le blanc dessus passe de 3,6:1
 *    à 4,8:1.
 * Aucun gris plus sombre que #A8A8B0 ne doit servir à du texte.
 */
export const COULEURS_SOMBRE = {
  /** Le fond de page. §1 (nº 466) : #1A1A1D → #0B0F14 (11, 15, 20). */
  fond: "#0B0F14",
  /** Les cartes et les blocs : un cran plus clair que le fond. */
  //  §1 (nº 287) — L'ÉCHELLE EST RETENDUE : le bloc se confondait avec
  //  la page (écart de 9 sur 255 — le relevé du propriétaire). L'ordre
  //  ne change pas, les ÉCARTS si : page #1A1A1D · bloc #28282D ·
  //  badge #33333A · champ #3F3F47 — quatre niveaux, chacun lisible à
  //  côté de sa voisine, sans un seul contour.
  //  §2 (nº 466) — recalculé sur le bleu nuit : #28282D → #1A1F26
  //  (26, 31, 38). C'est aussi le fond du pied de page (nº 138).
  carte: "#1A1F26",
  /** Un cran encore au-dessus : champs, éléments survolés.
      §2 (nº 466) : #33333A → #262C34 (38, 44, 52). */
  eleve: "#262C34",
  /** LE FOCUS D'UN CHAMP (passe nº 116) : le fond s'éclaircit très
      légèrement, et le curseur clignote — c'est tout. Le contour rose
      au focus a disparu : le rose est réservé à ce qui compte (badges
      sélectionnés, bouton final, ligne du sélecteur). */
  //  §1 (nº 287) — C'EST LE NIVEAU DES CHAMPS AU REPOS, désormais : la
  //  charte a toujours dit « badge plus sombre que le champ », mais les
  //  deux vivaient sur `eleve`. Les champs de saisie et de recherche
  //  montent ici ; leur focus monte d'autant (`haut`).
  //  §2 (nº 466) : #3F3F47 → #323942 (50, 57, 66).
  eleveClair: "#323942",
  /** Les traits : présents, jamais visibles avant qu'on les cherche.
      ⚠️ CE JETON N'EST PLUS CELUI DES LIGNES DE SÉPARATION (nº 315-§4) :
      voir `trait` juste dessous. Il reste ce qu'il a toujours été
      ailleurs — le fond de survol du badge « Se connecter » (nº 313),
      les traits des fenêtres et des listes.
      §2 (nº 466) : #38383F → #2C323B (44, 50, 59) — il garde sa place
      entre `eleve` et `eleveClair`. */
  bordure: "#2C323B",
  /**
   * §4 (nº 315) — LE TRAIT QUI SÉPARE DEUX SECTIONS.
   * ------------------------------------------------------------------
   * LE DÉFAUT RELEVÉ PAR LE PROPRIÉTAIRE : sur les fiches, les lignes
   * de séparation se distinguaient mal du fond. Elles étaient écrites
   * `border-sombre-bordure/60` — le jeton des traits, DILUÉ à 60 % :
   * peint sur l'anthracite, il rendait (44, 44, 49) contre un fond à
   * (26, 26, 29). Dix-huit points d'écart sur 255, pour un trait d'un
   * pixel : on ne le voyait qu'en le cherchant.
   * CE JETON EXISTE POUR QU'IL N'Y AIT QU'UNE VALEUR, écrite une seule
   * fois et partagée par tout ce qui sépare deux sections — il y en
   * avait DEUX qui ne s'accordaient même pas (voir TRAIT_SEPARATION).
   * §3 (nº 320) — ET IL REDESCEND D'UN DEMI-CRAN : #4A4A53 → #3B3B42.
   * La nº 315 avait raison de l'éclaircir, mais elle est allée un cran
   * trop loin — le trait se voyait un peu trop. #3B3B42 est LE MILIEU
   * EXACT entre l'ancien #2C2C31 et le #4A4A53 de la nº 315 : peint
   * sur l'anthracite, il rend (59, 59, 66) contre un fond à
   * (26, 26, 29), là où le dilué d'avant la nº 315 rendait (44, 44, 49)
   * et où la nº 315 montait à (74, 74, 83).
   * ⚠️ IL RESTE LE JETON UNIQUE de la nº 315 : il vaut donc AUSSI pour
   * l'écran de connexion et l'administration, qui lisent la même
   * variable. C'est accepté, et c'est le prix de l'unicité — deux
   * valeurs finiraient par diverger.
   * ⚠️ ET IL RESTE UN TRAIT, PAS UNE BARRE : un pixel, jamais deux.
   * §2 (nº 466) : #3B3B42 → #2F353E (47, 53, 62) — même place dans
   * l'échelle (entre `bordure` et `eleveClair`), même retenue.
   */
  trait: "#2F353E",
  /** LE HAUT DE L'ÉCHELLE (passe nº 144). Les fenêtres du web ont été
      éclaircies d'un cran (`carte` → `eleve`) pour mieux se détacher
      de la page : tout ce qui est POSÉ SUR ELLES devait grimper
      d'autant, et l'échelle manquait d'un barreau au-dessus de
      `bordure`. C'est lui — jamais employé ailleurs que comme dernier
      niveau d'un empilement (sélecteur ouvert dans « Mon compte »,
      badge sélectionné dans le panneau des filtres).
      §2 (nº 466) : #4A4A53 → #3E4650 (62, 70, 80) — c'est aussi le
      focus d'un champ (le cran au-dessus de son repos `eleveClair`),
      toujours sans contour, sans halo, sans rose. */
  haut: "#3E4650",
  /** LE CRAN AU-DESSUS DE `haut` (passe nº 146-§3). Le sélecteur de
      portfolios se confondait avec le fond de la fenêtre « Mon
      compte » : son repos monte à `haut`, et son état ouvert — ainsi
      que sa liste, qui le prolonge — avait donc besoin d'un barreau de
      plus. Même usage strict que `haut` : le DERNIER niveau d'un
      empilement, jamais un fond courant.
      §2 (nº 466) : #55555F → #4A525D (74, 82, 93). */
  hautClair: "#4A525D",
  /** Le texte principal. */
  texte: "#F2F2F4",
  /** Le texte discret (ville, styles, mentions). */
  texteDoux: "#A8A8B0",
  /**
   * §5 (nº 388) — LE BLEU DES LIENS QUI SORTENT DU SITE.
   * ------------------------------------------------------------------
   * IL N'EXISTAIT PAS : la charte n'avait que le rose de l'action, les
   * gris de l'échelle et le rouge d'erreur. Instagram et l'adresse
   * mènent DEHORS — c'est le seul endroit du site où la convention du
   * web (un lien est bleu) a quelque chose à dire, et le propriétaire
   * la demande.
   * LA VALEUR : un bleu ÉCLAIRCI, pas le #0000EE des navigateurs.
   * Sur le fond sombre (l'anthracite d'alors, le bleu nuit #0B0F14
   * depuis la nº 466 — le contraste y monte encore), un bleu foncé ne
   * se lit pas ; celui-ci est monté jusqu'à rendre autant de lumière
   * que le gris doux qu'il remplace, pour que la ligne ne pèse pas
   * plus qu'une autre.
   * ⚠️ SA VARIANTE D'ÉCLAIRCISSEMENT est le survol, et rien d'autre :
   * même famille, deux crans plus clair. Aucune troisième valeur.
   */
  lien: "#7FA9EE",
  lienClair: "#A8C6F6",
  /**
   * ██ §4 (nº 664) — LE VERT DE CE QUI EST VALIDÉ ██
   * ------------------------------------------------------------------
   * IL EXISTAIT DÉJÀ, MAIS PAS COMME JETON : `#34D399` était écrit EN
   * DUR dans le catalogue des notifications (`FenetreNotifications`),
   * seule couleur du produit tatouage à ne pas venir d'ici. Une valeur
   * écrite à un endroit est une valeur qui dérive : la nº 664 la
   * rapatrie sans la changer d'un chiffre.
   * ⚠️ IL N'EST PAS `COULEURS.succes` (le vert des artisans) : ce
   * dernier est calculé pour un fond BLANC. Celui-ci vit sur le bleu
   * nuit #0B0F14 et sur les gris de l'échelle — il rend 8,9:1 sur le
   * fond de page, 5,4:1 sur son propre voile à 20 %.
   * ⚠️ SON EMPLOI EST STRICT, comme celui du rose : VALIDÉ / RÉUSSI, et
   * rien d'autre (fiche en ligne, style accepté, suppression annulée,
   * message envoyé). Ni un ornement, ni un second accent.
   */
  succes: "#34D399",
  /**
   * ██ §5 (nº 664) — LE ROUGE DU PROBLÈME, RECALCULÉ POUR LE FOND ██
   * ------------------------------------------------------------------
   * LE ROUGE DU SITE (`COULEURS.erreur` #D32E28) EST CALCULÉ POUR UNE
   * PAGE BLANCHE : c'est un rouge SOMBRE, et c'est ce qu'il faut sur
   * du blanc. Posé sur le bleu nuit, puis sur son propre voile à 20 %,
   * il ne rend plus que 2,4:1 — SOUS le minimum de 3:1 d'un symbole.
   * C'était le vrai défaut derrière « les cercles sont délavés » : la
   * moitié rouge de la famille l'était pour de bon.
   * ⚠️ CE N'EST PAS UNE COULEUR INVENTÉE, c'est EXACTEMENT l'opération
   * de la nº 466 sur le rose, appliquée au rouge : même famille de
   * teinte (2°, celle du #D32E28), saturation portée à 100 %, valeur
   * relevée pour une base sombre et froide. Il rend 5,9:1 sur le fond
   * de page et 3,4:1 sur son voile.
   * ⚠️ LES ARTISANS NE CHANGENT PAS : leurs pages lisent toujours
   * `COULEURS.erreur`. Celui-ci ne vaut que dans le périmètre tatouage,
   * et pour la famille des pastilles d'événement.
   */
  erreur: "#FF4D45",
  /*  ██ §3 (nº 672), SUPPRIMÉ PAR LE §4 (nº 674) — LE JETON `or` ██
      ------------------------------------------------------------------
      CE QU'IL ÉTAIT : l'ambre pur #FFBF00, créé à la nº 672 pour une
      seule chose — l'étoile dorée du message de bienvenue. Le
      propriétaire l'a jugé HORS CHARTE (« le doré ne convient pas ») et
      l'étoile passe au ROSE de la charte.
      POURQUOI IL DISPARAÎT ENTIÈREMENT, ET PAS SEULEMENT DE L'ÉTOILE :
      il n'avait qu'un porteur, le ton `marque` de la famille des
      pastilles. Sans lui, ce jeton ne serait plus qu'une couleur que
      rien n'emploie — c'est-à-dire une couleur que quelqu'un finirait
      par employer sans savoir pourquoi elle existe. Il part donc aussi
      de lib/theme (`--rw-sombre-or`) et de globals.css
      (`--color-sombre-or`) : la chaîne entière, ou rien.
      ⚠️ LA CHARTE REVIENT DONC À SES QUATRE COULEURS DE SENS — rose,
      vert, rouge, gris (nº 664) —, et c'est bien ainsi que le
      propriétaire la veut. */
  /**
   * ██ §1 (nº 762) — LA PRIMAIRE PASSE DU ROSE AU ROUGE ██
   * ------------------------------------------------------------------
   * DÉCISION DU PROPRIÉTAIRE : #FF2E6C (rose) devient #E11144 (rouge),
   * partout où la primaire est lue. Les deux nuances qui l'accompagnent
   * SE DÉDUISENT de la base — elles ne sont pas choisies à l'œil, et
   * c'est ce qui permettra de recommencer sans rien casser :
   *  · `primaire` #E11144 — teinte 345°, saturation 86 %, luminosité
   *    47 %. ⚠️ IL EST PLUS SOMBRE QUE LE ROSE (59 %), et cela se paie
   *    d'un côté et se gagne de l'autre : en TEXTE sur le fond, le
   *    contraste tombe de 5,4:1 à 4,0:1 — assez pour du gros ou du
   *    gras, plus pour du petit texte ; en APLAT, le blanc posé dessus
   *    monte de 3,6:1 à 4,8:1, donc les boutons y gagnent ;
   *  · `primaireFonce` #B80E38 — l'appui/survol : la base assombrie de
   *    8,6 points de luminosité, EXACTEMENT l'écart que #E51C59 avait
   *    avait sous le rose d’avant ;
   *  · `primaireVoile` #270F1A — le fond d'un badge sélectionné :
   *    12,9 % de la primaire posée sur le fond #0B0F14. Cette
   *    proportion n'est pas inventée — elle a été RETROUVÉE dans
   *    l'ancien #291320, dont les trois canaux la donnent à 1,3 point
   *    près (12,3 / 12,9 / 13,6 %).
   * (§4 nº 466, remplacé : ce rose avait lui-même remplacé le
   * rose historique de Roswel, délavé sur le bleu nuit.)
   * ⚠️ LA SURCHARGE RESTE, MÊME SANS LES ARTISANS (nº 761). La couche
   * CLAIRE a ses propres nuances (src/config/charte.ts) — elles ont
   * suivi le même passage au rouge à la nº 762, mais elles se
   * déclinent d'une base plus claire ; celles d'ici ne les remplacent
   * que DANS LE PÉRIMÈTRE TATOUAGE, par la surcharge des
   * variables `--rw-primaire*` que pose app/(tatouage)/layout.tsx —
   * c'est-à-dire partout sauf sur les deux pages sans groupe (la page
   * introuvable, le tableau de bord des sondes) — les classes
   * (`bg-primaire`, `text-primaire`…) restent les mêmes partout, seul
   * ce qu'elles valent change selon le produit. AUCUN usage nouveau :
   * la primaire reste réservée au badge sélectionné, au bouton d'action
   * finale, à la ligne du sélecteur actif et à l'état d'une fiche.
   */
  primaire: "#E11144",
  primaireFonce: "#B80E38",
  primaireVoile: "#270F1A",
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
    "travail pour ce style précis. Chaque résultat renvoie vers le portfolio " +
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
  /**
   * §5 (nº 321) — LE BOUTON DE « QUI SOMMES-NOUS », ET LUI SEUL.
   * ------------------------------------------------------------------
   * Cette page portait « Rejoindre », le mot de la barre fixe
   * (`lienInscription` ci-dessus). Elle dit désormais ce qu'on y fait :
   * « Crée ton portfolio ». LE MOT DE LA BARRE NE BOUGE PAS — elle
   * s'adresse à tout le monde (garder des photos, suivre un tatoueur),
   * pendant que cette page-ci vient de finir d'expliquer ce qu'est un
   * portfolio et à qui il sert. Deux endroits, deux publics, deux mots :
   * c'est pourquoi il y a DEUX clés et non une seule partagée.
   */
  lienCreerPortfolio: "Crée ton portfolio",
  /** LE TITRE AU-DESSUS DE LA MOSAÏQUE, sans recherche (nº 211-§1) —
      une INVITATION adressée au visiteur, et non plus la description
      d'un écran (« Explorer toutes les créations »).
      ⚠️ À NE PAS CONFONDRE avec `titreAccueil` ci-dessus, qui est le
      titre DESCRIPTIF du bloc de référencement : celui-ci parle au
      visiteur, celui-là aux moteurs de recherche. */
  titreMosaique: "Find your tattoo style…",
  /*  ██ §1 (nº 507) — `sousTitreMosaique` EST SUPPRIMÉE ██
      « Le portfolio des tatouages et des tatoueurs » ne s'écrit plus
      sous le titre : le propriétaire ne veut qu'UNE ligne au-dessus de
      la mosaïque. La clé est retirée d'ici plutôt que laissée
      inutilisée (règle nº 386 : rien d'orphelin).
      ⚠️ L'AIR QU'ELLE OCCUPAIT NE PART PAS AVEC ELLE : l'appel de
      l'accueil passe désormais `degagementConstant` à LigneResultats
      (mécanisme nº 301), qui rend une ligne muette PORTANT LES MÊMES
      CLASSES à sa place. La hauteur du bloc de tête est donc identique
      au pixel, sans qu'aucun nombre ne soit recopié.
      ⚠️ LE TITRE DE RÉFÉRENCEMENT (`titreAccueil`, plus haut) N'EST PAS
      TOUCHÉ : il parle aux moteurs, celui-ci au visiteur. */
  /**
   * ██ §2 (nº 508) — LE TITRE D'UNE RECHERCHE SANS CATÉGORIE ██
   * LE DÉFAUT que cette clé corrige : quand on cherchait une VILLE
   * SEULE, la ville PRENAIT LA PLACE DU TITRE (« Lyon ») et
   * disparaissait du sous-titre. Le propriétaire tranche : une ville
   * n'est jamais un titre. Sans catégorie choisie, le titre est
   * générique et la ville redescend dans le sous-titre, exactement
   * comme lorsqu'une catégorie l'accompagne.
   * ⚠️ CE N'EST PAS `CATEGORIES_EXPLORER` : quand aucune catégorie
   * n'est choisie, la mosaïque ne filtre RIEN par nature — elle montre
   * les réalisations ET les flashs (lib/tatoueurs : `!natureVoulue`
   * laisse tout passer). Emprunter le mot « Toutes les réalisations »
   * à la catégorie « tatouage » ferait croire à un filtre qui n'existe
   * pas. C'est donc un texte À PART, et le propriétaire l'a nommé
   * lui-même à la nº 508.
   * ⚠️ SANS POINT FINAL, comme tous les titres du site.
   */
  titreRechercheSansCategorie: "Toutes les réalisations",
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
  //  nº 444 — le fantôme du champ de localité, en anglais (texte
  //  exact demandé par le proprietaire). Web et mobile le partagent :
  //  c est le meme champ, il porte donc le meme mot.
  ouLabel: "Enter city or country",
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
    explication: "Ce compte Instagram ne correspond pas au portfolio.",
  },
  {
    slug: "tiktok-ne-correspond-pas",
    label: "Le compte TikTok ne correspond pas",
    champ: "tiktok",
    explication: "Ce compte TikTok ne correspond pas au portfolio.",
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
    explication: "Ce site web ne correspond pas au portfolio.",
  },
  {
    slug: "page-de-liens-non-conforme",
    label: "Le Linktree / Beacons ne correspond pas",
    champ: "pageDeLiens",
    explication:
      "Cette page de liens ne correspond pas au portfolio, ou ne s'ouvre pas.",
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
  { slug: "fiche-en-double", label: "Portfolio en double" },
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

/**
 * §4 (nº 251) — LE CADRE 4:5, ÉCRIT UNE SEULE FOIS
 * ------------------------------------------------------------------
 * Le format ci-dessus dit les PIXELS d'un fichier ; celui-ci dit la
 * CLASSE qui réserve sa place à l'écran. Les deux vont ensemble : le
 * cadre tient la hauteur AVANT que l'image n'arrive (la règle du §3 de
 * la nº 226 — rien ne saute), et l'image la remplit.
 * ⚠️ IL ÉTAIT RECOPIÉ À LA MAIN dans quatre fichiers (`aspect-4/5`,
 * `aspect-[4/5]`) : quatre occasions de diverger. Tout ce qui montre
 * une photo de portfolio consomme désormais CETTE constante — la carte
 * de la mosaïque, le carrousel de la fiche, la galerie, et les bandes
 * de « Ma sélection ».
 */
export const CADRE_PHOTO_PORTFOLIO = "aspect-4/5";

/**
 * ██ §2 (nº 648) — LE RECTANGLE D'ATTENTE NE DÉPASSE PLUS ██
 * ------------------------------------------------------------------
 * LE DÉFAUT, ET SA CAUSE : le fond clair qui réserve la place pendant
 * que la photo arrive était peint SUR LE CADRE lui-même. Or la hauteur
 * du cadre est calculée par un RAPPORT (4/5) : elle tombe presque
 * toujours sur une fraction de pixel — 250,4 px pour une carte de
 * 200,32. Le navigateur peint le FOND sur cette hauteur fractionnaire
 * et l'IMAGE sur une hauteur arrondie : il reste une lame de fond
 * clair, en bas surtout, de l'ordre du pixel. C'est ce que le
 * propriétaire voit.
 * LE REMÈDE, FRANC ET DÉFINITIF (sa consigne) : le fond quitte le
 * cadre pour une plaque à lui, RENTRÉE DE DEUX PIXELS sur tout le
 * pourtour. Deux, et pas une fraction : l'écart d'arrondi ne dépasse
 * jamais UN pixel physique, et deux pixels de CSS en valent au moins
 * un quel que soit le zoom usuel (à 50 %, le plus petit des zooms
 * courants, ils en font encore un). Chercher la fraction juste aurait
 * demandé plusieurs passes pour un résultat qui changerait avec chaque
 * zoom — c'est précisément ce que le propriétaire ne veut pas.
 * ⚠️ LA RÉSERVE DE HAUTEUR (nº 226) N'EST PAS TOUCHÉE : c'est le CADRE
 * qui la porte, par son rapport 4/5, et il ne bouge pas d'un pixel. La
 * plaque ne fait que peindre à l'intérieur.
 * ⚠️ LA PHOTO NON PLUS NE BOUGE PAS : elle remplit toujours le cadre
 * entier. Elle passe simplement AU-DESSUS de la plaque — d'où le
 * `relative` qu'elle reçoit chez ses trois porteurs : une image en flux
 * passerait sinon SOUS un frère positionné.
 * ⚠️ ET LE RECTANGLE RESTE BIEN VISIBLE pendant l'attente : deux
 * pixels sur une carte qui en fait deux cents, c'est un centième de sa
 * largeur.
 */
export const FOND_RESERVE_PHOTO =
  "pointer-events-none absolute inset-[2px] bg-sombre-eleve";

/**
 * §3 (nº 276) — L'ÉCRITURE DES TITRES DE SECTION, UNE SEULE FOIS
 * ------------------------------------------------------------------
 * Les capitales grises espacées de 13 px de la nº 223 : « STYLES »,
 * « TECHNIQUE » sur le profil d'une fiche, les titres de « Ma
 * sélection », et — depuis la nº 276 — « RÉALISATIONS » et « FLASHS »
 * dans l'onglet Portfolio. Elle était recopiée à la main dans deux
 * fichiers ; le troisième consommateur l'extrait ici : AUCUNE valeur
 * n'est choisie, tout le monde réutilise LA LEUR.
 * (Les majuscules viennent d'`uppercase` : les libellés restent écrits
 * en toutes lettres — « Réalisations » — là où ils vivent.)
 */
export const ECRITURE_TITRE_SECTION =
  "text-[13px] font-semibold uppercase tracking-[0.14em] text-sombre-texte-doux";

/**
 * §3 (nº 315) — LA FORME D'UNE ÉTIQUETTE : DES ANGLES ARRONDIS
 * ==================================================================
 * LA RÈGLE DE CHARTE, DÉCISION DU PROPRIÉTAIRE (passe nº 315) :
 *
 *   « La gélule (`rounded-full`) est réservée aux ACTIONS : bouton
 *   d'action finale, action intermédiaire, segment de sélecteur. Une
 *   ÉTIQUETTE qui ne se clique pas pour agir — badge de style, capsule
 *   de PRATIQUE — prend des ANGLES ARRONDIS de 8 px. C'est ce qui
 *   distingue un bouton d'une information. Décision du propriétaire,
 *   passe nº 315 : aucune passe future ne doit remettre de gélule sur
 *   une étiquette. »
 *
 * ⚠️ ET LA LECTURE DE LA RÈGLE, QUI FAIT TOUTE SA PORTÉE : UN BADGE DE
 * STYLE SE CLIQUE QUAND MÊME. C'est un LIEN vers
 * /tatouage/<style>/<ville> — la valeur de référencement du site.
 * CLIQUER POUR ALLER QUELQUE PART N'EST PAS AGIR : un lien de
 * navigation reste une ÉTIQUETTE, et prend donc les angles arrondis.
 * Seul ce qui DÉCLENCHE quelque chose — envoyer, choisir, basculer —
 * est une action, et garde la gélule.
 *
 * ⚠️ UNE SEULE VALEUR, ÉCRITE ICI : 8 px, c'est-à-dire `rounded-lg`,
 * le rayon des champs posé à la nº 287. Deux valeurs recopiées dans
 * deux fichiers finiraient par diverger — tout ce qui est une
 * étiquette consomme cette constante.
 */
export const ARRONDI_ETIQUETTE = "rounded-lg";

/**
 * §4 (nº 315) — LE TRAIT QUI SÉPARE DEUX SECTIONS, UNE SEULE ÉCRITURE
 * ==================================================================
 * IL Y EN AVAIT DEUX SUR UNE FICHE, ET ELLES NE S'ACCORDAIENT PAS :
 *  · `border-t border-sombre-bordure/60` — les séparations du profil
 *    (ContenuFiche), le jeton des traits DILUÉ à 60 % ;
 *  · `h-px bg-sombre-bordure` — le soulignement du sélecteur à deux
 *    choix (OngletsLigne), le même jeton À PLEIN.
 * Deux écritures pour un même objet, donc deux gris différents à
 * l'écran. Elles lisent désormais LA MÊME variable (`sombre-trait`,
 * voir COULEURS_SOMBRE) : il ne peut plus y en avoir qu'un.
 *
 * ⚠️ DEUX CLASSES, UNE SEULE VALEUR. Un trait se peint tantôt en
 * BORDURE (`border-t`), tantôt en FOND d'un bloc d'un pixel
 * (`h-px`) — Tailwind veut alors deux préfixes. Les deux pointent la
 * même couleur : c'est la variable CSS qui tient l'unicité, pas la
 * discipline de celui qui écrit.
 */
export const TRAIT_SEPARATION = "border-sombre-trait";
export const TRAIT_SEPARATION_FOND = "bg-sombre-trait";
