import {
  CATEGORIES_EXPLORER,
  entreesExplorer,
  genreMode,
  libelleTypeFiche,
  lireValeurExplorer,
  styleDuCatalogue,
  valeurExplorer,
} from "@/config/tatouage";

/**
 * LES DEUX MENUS DE « MA SÉLECTION » — L'ADRESSE EST LA VÉRITÉ
 * ==================================================================
 * (passe nº 245-§3, REFAITE par la nº 247-§2 et §3)
 *
 * ⚠️ LES DEUX MENUS SONT EXCLUSIFS, PAS COMPLÉMENTAIRES (nº 247-§2).
 * C'était le contresens de la nº 245 : deux paramètres d'adresse
 * (`?favoris=`, `?suivis=`) filtraient EN MÊME TEMPS deux sections
 * affichées l'une sous l'autre. Chacun mène en réalité SA PROPRE
 * recherche, et une seule vit à la fois :
 *  · « Mes favoris »  → les photos gardées, et RIEN d'autre ;
 *  · « Mes suivis »  → les artistes suivis, et les favoris disparaissent ;
 *  · choisir dans l'un REMET L'AUTRE À ZÉRO — c'est mécanique, il n'y
 *    a qu'une valeur.
 * UN SEUL PARAMÈTRE SUFFIT DONC, et deux ne pourraient que se
 * contredire : `?selection=<menu>[:<catégorie>[:<style>]]`.
 *   (absent)                  → « Mes favoris », tout : l'état d'ouverture
 *   `suivis`                  → tous les suivis
 *   `favoris:flash`           → les flashs aimés
 *   `suivis:tatouage:maori`   → les suivis qui publient du maori réalisé
 *
 * ⚠️ CE MODULE N'EST PAS « use client » : `entreesDuFiltre` est PURE
 * et la page serveur l'appelle pour bâtir les deux listes. Les deux
 * fonctions qui touchent `window` se gardent d'elles-mêmes.
 *
 * ⚠️ `replaceState`, PAS `pushState` : changer de filtre ne doit pas
 * empiler des entrées d'historique. L'adresse porte le filtre — c'est
 * tout ce dont la restitution a besoin : la mémoire de position est
 * indexée sur `chemin + recherche` (MemoireNavigation), donc revenir
 * d'une fiche rend le même écran ET la même place.
 */

/** Le paramètre — UN SEUL, et c'est le sujet du §2. */
export const PARAM_SELECTION = "selection";

export const MENU_FAVORIS = "favoris";
export const MENU_SUIVIS = "suivis";
export type MenuSelection = typeof MENU_FAVORIS | typeof MENU_SUIVIS;

/** Ce que l'adresse dit : quel menu mène la recherche, et sur quoi. */
export type ChoixSelection = {
  menu: MenuSelection;
  /** « tatouage », « flash », ou vide (toutes catégories). */
  nature: string;
  /** Un style du catalogue, ou vide (tous les styles). */
  style: string;
  /**
   * §2 (nº 316) — LE PROFIL CHOISI dans le second menu des portfolios
   * suivis : « mode:domicile », « lieu:prive »… ou vide.
   * ⚠️ IL EXCLUT LE STYLE, et c'est mécanique : l'adresse ne porte
   * qu'UNE valeur pour ce menu (voir `lireSelection`). Choisir un
   * profil remplace donc le style, exactement comme choisir un style
   * remplace le profil — c'est la même règle qu'entre les deux menus
   * de la page, et elle ne demande aucun code de plus.
   * ⚠️ TOUJOURS VIDE SUR « MES FAVORIS » : ce menu-là n'a pas de
   * profil, ses entrées sont des photos.
   */
  profil: string;
};

/** L'ÉTAT D'OUVERTURE (§2) : les favoris seuls, tous styles, aucun
    suivi. C'est aussi ce que rend une adresse sans paramètre. */
export const CHOIX_PAR_DEFAUT: ChoixSelection = {
  menu: MENU_FAVORIS,
  nature: "",
  style: "",
  profil: "",
};

/**
 * LIRE L'ADRESSE — et ne jamais rendre n'importe quoi : un menu
 * inconnu retombe sur l'ouverture, une catégorie ou un style inconnus
 * sont ignorés (c'est `lireValeurExplorer` qui tranche, la même
 * autorité que le moteur).
 */
export function lireSelection(recherche?: string): ChoixSelection {
  const params = new URLSearchParams(
    recherche ?? (typeof window === "undefined" ? "" : window.location.search)
  );
  const brut = params.get(PARAM_SELECTION) ?? "";
  if (!brut) return CHOIX_PAR_DEFAUT;
  const [menu = "", ...reste] = brut.split(":");
  if (menu !== MENU_FAVORIS && menu !== MENU_SUIVIS) return CHOIX_PAR_DEFAUT;
  const valeur = reste.join(":");
  /*  §1 (nº 257) — SUR « SUIVIS », LE RESTE EST UN STYLE, PAS UN
      COUPLE. On ne suit pas une photo, on suit une personne : la
      division Réalisations / Flashs n'a aucun sens sur ce menu, et
      elle a donc disparu de ses entrées. Le paramètre reste UNIQUE
      (`?selection=suivis:maori`) — c'est sa LECTURE qui suit le menu,
      et un style inconnu est ignoré comme partout ailleurs
      (`styleDuCatalogue`, la même autorité que le moteur). */
  if (menu === MENU_SUIVIS) {
    /*  §2 (nº 316) — UN STYLE OU UN PROFIL, jamais les deux : ce menu
        ne porte qu'UNE valeur, et c'est son préfixe qui dit laquelle.
        Rien à valider de plus — un profil inconnu ne comptera aucune
        entrée, et un style inconnu est ignoré comme depuis toujours. */
    const profil = profilDuFiltre(valeur);
    return {
      menu,
      nature: "",
      style: profil ? "" : styleDuCatalogue(valeur) ? valeur : "",
      profil,
    };
  }
  const { nature, style } = lireValeurExplorer(valeur);
  return { menu, nature, style, profil: "" };
}

/**
 * POSER UN CHOIX — le menu qui parle devient le seul actif, et l'autre
 * est remis à zéro par construction : il n'y a qu'une valeur à écrire.
 * `valeur` est celle du menu « Explorer » — « flash », « flash:maori »
 * (vide : retour à l'état d'ouverture).
 */
export function poserSelection(menu: MenuSelection, valeur: string): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  //  L'ouverture (les favoris, tous styles) ne s'écrit pas : une page
  //  sans paramètre est déjà exactement cela.
  if (menu === MENU_FAVORIS && !valeur) params.delete(PARAM_SELECTION);
  else params.set(PARAM_SELECTION, valeur ? `${menu}:${valeur}` : menu);
  const requete = params.toString();
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname + (requete ? `?${requete}` : "")
  );
}

/** CE QUE PORTE UN MENU : sa valeur d'Explorer s'il mène la recherche,
    rien s'il est en sommeil (l'autre a la main). */
export function valeurDuMenu(
  choix: ChoixSelection,
  menu: MenuSelection
): string {
  if (choix.menu !== menu) return "";
  //  §1 (nº 257) — « Suivis » ne connaît que le style (voir
  //  `lireSelection`) : sa valeur EST le style, jamais un couple.
  //  §2 (nº 316) — … ou son PROFIL, quand c'est lui qui est choisi.
  //  Les deux occupent la même place : il n'y en a qu'une.
  if (menu === MENU_SUIVIS) return choix.profil || choix.style;
  return valeurExplorer(choix.nature, choix.style);
}

/**
 * LES ENTRÉES D'UN MENU — CALCULÉES, JAMAIS ÉCRITES (§3)
 * ------------------------------------------------------------------
 * ⚠️ ELLES DISTINGUENT LES RÉALISATIONS DES FLASHS (nº 247-§3), et
 * exactement comme le menu « Explorer » du moteur : mêmes deux portes
 * (`CATEGORIES_EXPLORER`), mêmes mots (« Toutes les réalisations »,
 * « Tous les flashs »), même ordre de styles (`entreesExplorer`),
 * mêmes familles en sous-porte (« Cultures du monde »). Une seule
 * source, celle du moteur — aucune seconde liste nulle part.
 *
 * ON NE GARDE QUE CE QUI EXISTE : une catégorie sans rien dedans n'a
 * pas de porte, un style sans rien n'a pas de ligne. Les trente-huit
 * styles du site dans un menu où trente-cinq ne donnent rien seraient
 * inutilisables.
 *
 * `comptes` est indexé par la valeur d'Explorer : « flash »,
 * « flash:maori », « tatouage », « tatouage:realisme »… — les totaux
 * de catégorie compris.
 */
export type EntreeFiltre = {
  value: string;
  label: string;
  /** La porte de catégorie — « Réalisations » / « Flashs ». */
  groupe?: string;
  /** La sous-porte de famille — « Cultures du monde ». */
  sousGroupe?: string;
  /**
   * §2 (nº 317) — CETTE SOUS-SECTION EST UN SIMPLE SOUS-TITRE, PAS UNE
   * PORTE.
   * ------------------------------------------------------------------
   * ⚠️ CE DRAPEAU REMPLACE `sousGroupeGris` (nº 316), ET IL DIT PLUS
   * QUE LUI. La nº 316 avait posé « ARTISTE » et « LIEU » en
   * réemployant le mécanisme à deux niveaux des favoris : ils avaient
   * donc une flèche, ils se pliaient, ils se cliquaient. Le
   * propriétaire a tranché — CE SONT DE SIMPLES SOUS-TITRES. Ils
   * annoncent, et c'est tout : ni flèche, ni pliage, ni survol, ni
   * état choisi. Leurs options sont visibles dès que leur groupe est
   * ouvert.
   * ⚠️ « CULTURES DU MONDE » N'EST PAS CONCERNÉE, et c'est bien pour ça
   * que le drapeau vit sur l'entrée : elle, elle EST une porte — onze
   * styles derrière, et d'autres styles à côté d'elle dans la liste
   * alphabétique. Elle ne passe pas ce drapeau, elle garde tout.
   * LA COULEUR SUIT LA NATURE : un sous-titre s'écrit en gris (§2-b au
   * web, §2-c au doigt) — c'est le menu qui le peint, à partir d'ici.
   */
  sousTitre?: boolean;
  /** Combien d'éléments derrière cette entrée. */
  compte?: number;
};

/* ==================================================================
 * §2 (nº 316) — LE SECOND MENU DES PORTFOLIOS SUIVIS : « PROFIL »
 * ==================================================================
 * L'onglet des favoris avait deux groupes (Réalisations, Flashs),
 * l'onglet des portfolios un seul. Il en a deux : « Styles », celui
 * qui existait, et « Profil » — comment le portfolio suivi exerce.
 *
 *     STYLES   →   (inchangé)
 *     PROFIL   →   ARTISTE : À domicile · En studio · En salon · Guest
 *                  LIEU    : Studio · Salon
 *
 * ⚠️ AUCUN SECOND MÉCANISME (§2-h) : ce sont les groupes et sous-portes
 * du menu des favoris, tels quels. Les deux sous-titres sont des
 * SOUS-PORTES, comme « Cultures du monde » ; les deux menus sont des
 * GROUPES, comme « Réalisations » et « Flashs ». Rien de neuf n'est
 * dessiné — c'est la LISTE qui change, pas le menu.
 *
 * ⚠️ ET LA RÈGLE DE LA nº 304 TIENT (§2-g) : à un seul groupe, pas de
 * flèche et tout reste ouvert. Elle se joue toute seule ici — quand
 * aucun profil n'existe, « Styles » reste le seul groupe.
 *
 * COMMENT ÇA VOYAGE DANS L'ADRESSE. Le menu des suivis portait un
 * STYLE (`?selection=suivis:maori`). Il porte maintenant un style OU
 * un profil, et les deux ne peuvent pas se confondre : un profil est
 * PRÉFIXÉ (`suivis:mode:domicile`, `suivis:lieu:prive`), et aucun slug
 * de style du catalogue ne contient de deux-points. Une valeur
 * inconnue est ignorée, comme partout ailleurs.
 */

/** Le préfixe d'un mode d'exercice d'ARTISTE — « mode:domicile ». */
export const PROFIL_MODE = "mode";
/** Le préfixe d'un genre de LIEU — « lieu:prive », « lieu:salon ». */
export const PROFIL_LIEU = "lieu";

/** Les deux sous-titres du menu « Profil » — écrits une seule fois. */
export const SOUS_TITRE_ARTISTE = "ARTISTE";
export const SOUS_TITRE_LIEU = "LIEU";
/** Le titre des deux menus (§2-a et §2-b). */
export const GROUPE_STYLES = "Styles";
export const GROUPE_PROFIL = "Profil";

/** La clé d'un mode d'artiste, dans la table des comptes comme dans
    l'adresse — une seule écriture pour les deux. */
export const cleProfilMode = (genre: string) => `${PROFIL_MODE}:${genre}`;
/** La clé d'un genre de lieu — « prive » (Studio) ou « salon ». */
export const cleProfilLieu = (nature: string) => `${PROFIL_LIEU}:${nature}`;

/**
 * §2-d (nº 317) — LES DEUX TÊTES DE SOUS-GROUPE.
 * ------------------------------------------------------------------
 * « Tous les artistes » et « Tous les lieux » : elles se placent EN
 * PREMIER dans leur sous-groupe et sélectionnent tout — le procédé de
 * « Toutes les réalisations » sur l'onglet des favoris, à la lettre.
 * ⚠️ L'ÉTOILE N'EST NI UN GENRE NI UNE NATURE : aucune collision
 * possible avec « mode:domicile » ou « lieu:salon ». C'est la même
 * ruse que `CLE_TOTAL`, et pour la même raison.
 * ⚠️ ELLES NE SONT PAS UN RACCOURCI D'AFFICHAGE : elles ont leur
 * propre clé dans la table des comptes, posée par `clesDuProfil` en
 * même temps que les autres. Compter et filtrer restent une seule
 * fonction — le nombre annoncé ne peut donc pas mentir.
 */
export const TOUS_LES_ARTISTES = `${PROFIL_MODE}:*`;
export const TOUS_LES_LIEUX = `${PROFIL_LIEU}:*`;
/** Leurs mots, écrits une seule fois — le menu et le champ les lisent
    tous les deux (voir `libelleDuProfil`). */
export const LIBELLE_TOUS_LES_ARTISTES = "Tous les artistes";
export const LIBELLE_TOUS_LES_LIEUX = "Tous les lieux";

/**
 * EST-CE UNE VALEUR DE PROFIL ? Rend la valeur telle quelle si oui,
 * « » sinon — c'est ce qui départage un style d'un profil à la
 * lecture de l'adresse, et c'est écrit UNE fois.
 * ⚠️ ON NE VALIDE PAS LE GENRE ICI : un genre disparu du catalogue ne
 * comptera simplement aucune entrée, donc aucun portfolio ne
 * correspondra — l'écran est vide, jamais faux. C'est exactement ce
 * que fait un style inconnu.
 */
export function profilDuFiltre(valeur: string): string {
  const [prefixe] = valeur.split(":");
  return prefixe === PROFIL_MODE || prefixe === PROFIL_LIEU ? valeur : "";
}

/**
 * COMMENT UN PROFIL CHOISI S'APPELLE — « À domicile », « Studio »…
 * ------------------------------------------------------------------
 * Le CHAMP de la barre et le SOUS-TITRE de la page le lisent tous les
 * deux : une seule écriture, comme `libelleDuChoix` l'exige depuis la
 * nº 257. Et aucun mot n'est inventé ici — `genreMode` porte les
 * libellés des modes, `libelleTypeFiche` ceux des lieux, exactement
 * comme le menu les affiche.
 */
export function libelleDuProfil(profil: string): string {
  //  §2-d (nº 317) — LES DEUX TÊTES D'ABORD : leur mot n'est pas celui
  //  d'un genre, il dit « tout ce sous-groupe ».
  if (profil === TOUS_LES_ARTISTES) return LIBELLE_TOUS_LES_ARTISTES;
  if (profil === TOUS_LES_LIEUX) return LIBELLE_TOUS_LES_LIEUX;
  const [prefixe, valeur = ""] = profil.split(":");
  if (prefixe === PROFIL_MODE) return genreMode(valeur).label;
  if (prefixe === PROFIL_LIEU) return libelleTypeFiche("salon", valeur);
  return "";
}

/**
 * LES STYLES PRÉSENTS, dans l'ordre et avec les libellés du moteur —
 * l'écriture UNIQUE des deux menus (§1, nº 257). `cle` dit sous quelle
 * valeur chaque style se compte et se choisit : le couple d'Explorer
 * pour « Mes favoris » (« flash:maori »), le style seul pour « Mes
 * suivis » (« maori »).
 */
function stylesPresents(
  comptes: Map<string, number>,
  cle: (slug: string) => string,
  groupe?: string
): EntreeFiltre[] {
  const entrees: EntreeFiltre[] = [];
  for (const entree of entreesExplorer()) {
    if (entree.genre === "style") {
      const compte = comptes.get(cle(entree.slug));
      if (compte) {
        entrees.push({ value: cle(entree.slug), label: entree.label, groupe, compte });
      }
      continue;
    }
    for (const style of entree.styles) {
      const compte = comptes.get(cle(style.slug));
      if (!compte) continue;
      entrees.push({
        value: cle(style.slug),
        label: style.label,
        groupe,
        //  ⚠️ LA FAMILLE EN SOUS-PORTE — elle n'ouvrait pas du tout
        //  à la nº 245 (nº 247-§3) : `sousGroupe` n'a d'effet
        //  qu'avec le drapeau `repliable` du menu, que ces deux
        //  menus-ci ne passaient pas. Voir MenusSelection.
        //  ⚠️ ET ELLE VIT SANS PORTE DE CATÉGORIE (nº 257-§1) : la
        //  sous-porte ne dépend pas d'un groupe parent — voir
        //  `sousEnteteVisible` dans MenuDeroulant.
        sousGroupe: entree.label,
        compte,
      });
    }
  }
  return entrees;
}

export function entreesDuFiltre(
  comptes: Map<string, number>
): EntreeFiltre[] {
  if (comptes.size === 0) return [];
  const entrees: EntreeFiltre[] = [];

  for (const categorie of CATEGORIES_EXPLORER) {
    const compteCategorie = comptes.get(valeurExplorer(categorie.nature, ""));
    if (!compteCategorie) continue;
    //  La tête de la porte : « Toutes les réalisations », « Tous les
    //  flashs » — les mots du moteur, au mot près.
    entrees.push({
      value: valeurExplorer(categorie.nature, ""),
      label: categorie.tous,
      groupe: categorie.titre,
      compte: compteCategorie,
    });
    entrees.push(
      ...stylesPresents(
        comptes,
        (slug) => valeurExplorer(categorie.nature, slug),
        categorie.titre
      )
    );
  }

  //  ⚠️ « TOUS LES STYLES » A DISPARU (nº 249-§1). Elle était inutile :
  //  « Toutes les réalisations » et « Tous les flashs » jouent déjà ce
  //  rôle à l'intérieur de leur catégorie — et personne ne mélange une
  //  recherche de flashs avec une recherche de réalisations. Ces deux
  //  entrées restent le seul chemin de retour vers tout.
  return entrees;
}

/**
 * LE MENU DES SUIVIS — LES STYLES SEULS (§1, nº 257)
 * ------------------------------------------------------------------
 * PAS DE PORTE Réalisations / Flashs ICI, et c'est le sujet du §1 : on
 * ne suit pas une photo, on suit une PERSONNE — un artiste n'est ni
 * une réalisation ni un flash, il fait les deux. Le menu ne garde donc
 * que la liste des styles, dans l'ordre et avec les libellés du
 * moteur, familles EN SOUS-PORTE comprises (« Cultures du monde »).
 *
 * ⚠️ ET UNE TÊTE, « Tous les styles » : sans porte de catégorie, plus
 * RIEN ne ramenait à la liste entière une fois un style choisi (les
 * deux têtes « Toutes les réalisations » / « Tous les flashs » jouaient
 * ce rôle sur les favoris — c'est très exactement pourquoi la nº 249-§1
 * pouvait retirer cette entrée-là). Le mot n'est pas inventé : c'est
 * celui de `libelleStyleChoisi` (MoteurTatouage), l'écriture du site
 * pour « aucun style choisi ».
 */
export const TOUS_LES_STYLES = "";

/** §2-c (nº 318) — LE MOT DE L'ENTRÉE NEUTRE : « Tous les
    portfolios ». Écrit une fois — l'entrée du menu et le champ de la
    barre le lisent tous les deux (voir MenusSelection). Il remplace
    « Tous les styles », qui mentait depuis que le menu filtre aussi
    par profil (nº 316). */
export const LIBELLE_TOUS_LES_PORTFOLIOS = "Tous les portfolios";

/** LA CLÉ DU TOTAL, dans la table des comptes — une étoile : ni un
    slug de style, ni une valeur d'Explorer, donc aucune collision
    possible (voir `comptesDesSuivis`). */
export const CLE_TOTAL = "*";

export function entreesDesStyles(
  comptes: Map<string, number>
): EntreeFiltre[] {
  //  §2-a (nº 316) — LE MENU QUI EXISTAIT REÇOIT SON TITRE. Il n'en
  //  avait aucun : il était seul, donc rien à nommer. Maintenant qu'un
  //  second le rejoint, il lui faut son mot — « Styles ».
  const styles = stylesPresents(comptes, (slug) => slug, GROUPE_STYLES);
  if (styles.length === 0) return [];
  return [
    /*  §2-c (nº 318) — L'ENTRÉE NEUTRE S'APPELLE « TOUS LES
        PORTFOLIOS », ET ELLE VIT HORS GROUPE.
        --------------------------------------------------------------
        Elle s'appelait « Tous les styles » — ce n'était plus vrai
        depuis que le menu filtre AUSSI par profil (nº 316) : sa valeur
        vide annule TOUT, le style comme le profil. Le mot suit ce
        qu'elle fait, et c'est le mot du titre de la page (« Ma
        sélection de portfolios », nº 301).
        ET ELLE SORT DU GROUPE « Styles » : une entrée qui annule les
        DEUX groupes ne peut pas vivre dans l'un d'eux — elle se pose
        AU-DESSUS des deux, sans `groupe`, donc visible en permanence,
        portes fermées comprises.
        ⚠️ LE DÉFAUT DE LA nº 317 NE PEUT PAS SE RÉVEILLER, et
        doublement : la garde « une valeur vide n'est pas un choix »
        (replieALOuverture) tient toujours — et cette entrée n'ayant
        plus AUCUN groupe, même sans la garde elle n'aurait plus rien
        à ouvrir. Le banc éprouve les deux. */
    {
      value: TOUS_LES_STYLES,
      label: LIBELLE_TOUS_LES_PORTFOLIOS,
      compte: comptes.get(CLE_TOTAL) ?? 0,
    },
    ...styles,
  ];
}

/**
 * §2-b et §2-c (nº 316) — LE MENU « PROFIL », BÂTI SUR CE QUI EXISTE
 * ------------------------------------------------------------------
 * DEUX SOUS-TITRES, ET RIEN QUI N'EXISTE PAS :
 *  · une entrée n'apparaît que si au moins un portfolio suivi lui
 *    répond (`comptes` ne porte que du réel — voir `comptesDesSuivis`) ;
 *  · un sous-titre n'apparaît que si une de ses options existe : c'est
 *    mécanique, une sous-porte sans option n'est jamais rendue (le
 *    menu la pose À LA PLACE de sa première option) ;
 *  · si les deux sont vides, la fonction rend une liste VIDE — et le
 *    groupe « Profil » n'existe alors nulle part.
 *
 * ⚠️ L'ORDRE DES MODES EST CELUI DE LA CONSIGNE — à domicile, en
 * studio, en salon, guest — et non celui de `GENRES_MODE`, qui range
 * pour le formulaire. Les LIBELLÉS, eux, viennent de `GENRES_MODE` et
 * de `libelleTypeFiche` : aucun mot n'est réécrit ici.
 */
const MODES_DU_PROFIL = ["domicile", "prive", "salon", "guest"] as const;
const LIEUX_DU_PROFIL = ["prive", "salon"] as const;

export function entreesDuProfil(
  comptes: Map<string, number>
): EntreeFiltre[] {
  const entrees: EntreeFiltre[] = [];
  const ajouter = (
    value: string,
    label: string,
    sousGroupe: string
  ) => {
    const compte = comptes.get(value);
    //  §2-d — CHAQUE ENTRÉE PORTE SON NOMBRE, comme celles de
    //  « Styles » : c'est le même champ, lu au même endroit. Et une
    //  entrée sans compte n'entre jamais : rien ne s'affiche qui
    //  n'existe pas (§2-c de la nº 316, inchangé).
    if (compte) {
      entrees.push({
        value,
        label,
        groupe: GROUPE_PROFIL,
        sousGroupe,
        //  §2 (nº 317) — CE SOUS-GROUPE EST UN SOUS-TITRE, PAS UNE
        //  PORTE : ni flèche, ni pliage, ni clic.
        sousTitre: true,
        compte,
      });
    }
  };
  /*  §2-d (nº 317) — LA TÊTE D'ABORD, LES OPTIONS ENSUITE, dans chaque
      sous-groupe. C'est l'ordre de « Toutes les réalisations » sur
      l'onglet des favoris : on peut reprendre TOUT le sous-groupe sans
      avoir à parcourir ses entrées.
      ⚠️ ET LA TÊTE SUIT LA MÊME RÈGLE QUE LES AUTRES : sans compte,
      elle n'entre pas. Un artiste qui n'a déclaré aucun mode ne
      nourrit aucune clé (voir `clesDuProfil`) — « Tous les artistes »
      n'apparaît donc pas plus que les entrées individuelles, et le cas
      « aucun profil déclaré » du §1 reste ce qu'il est. */
  ajouter(TOUS_LES_ARTISTES, LIBELLE_TOUS_LES_ARTISTES, SOUS_TITRE_ARTISTE);
  for (const genre of MODES_DU_PROFIL) {
    ajouter(cleProfilMode(genre), genreMode(genre).label, SOUS_TITRE_ARTISTE);
  }
  ajouter(TOUS_LES_LIEUX, LIBELLE_TOUS_LES_LIEUX, SOUS_TITRE_LIEU);
  for (const nature of LIEUX_DU_PROFIL) {
    //  « Studio » pour un studio privé, « Salon » pour un salon — les
    //  mots de `libelleTypeFiche`, ceux des fiches et des cartes.
    ajouter(
      cleProfilLieu(nature),
      libelleTypeFiche("salon", nature),
      SOUS_TITRE_LIEU
    );
  }
  return entrees;
}
