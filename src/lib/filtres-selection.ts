import {
  CATEGORIES_EXPLORER,
  entreesExplorer,
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
};

/** L'ÉTAT D'OUVERTURE (§2) : les favoris seuls, tous styles, aucun
    suivi. C'est aussi ce que rend une adresse sans paramètre. */
export const CHOIX_PAR_DEFAUT: ChoixSelection = {
  menu: MENU_FAVORIS,
  nature: "",
  style: "",
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
    return {
      menu,
      nature: "",
      style: styleDuCatalogue(valeur) ? valeur : "",
    };
  }
  const { nature, style } = lireValeurExplorer(valeur);
  return { menu, nature, style };
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
  if (menu === MENU_SUIVIS) return choix.style;
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
  /** Combien d'éléments derrière cette entrée. */
  compte?: number;
};

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

/** LA CLÉ DU TOTAL, dans la table des comptes — une étoile : ni un
    slug de style, ni une valeur d'Explorer, donc aucune collision
    possible (voir `comptesDesSuivis`). */
export const CLE_TOTAL = "*";

export function entreesDesStyles(
  comptes: Map<string, number>
): EntreeFiltre[] {
  const styles = stylesPresents(comptes, (slug) => slug);
  if (styles.length === 0) return [];
  return [
    {
      value: TOUS_LES_STYLES,
      label: "Tous les styles",
      compte: comptes.get(CLE_TOTAL) ?? 0,
    },
    ...styles,
  ];
}
