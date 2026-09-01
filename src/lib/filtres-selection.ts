import {
  CATEGORIES_EXPLORER,
  entreesExplorer,
  libelleTypeFiche,
  lireValeurExplorer,
  styleDuCatalogue,
  valeurExplorer,
} from "@/config/tatouage";
//  §5 (nº 329), §1 (nº 330) — LA REMONTÉE (voir `poserSelection`).
//  ⚠️ Ce module reste utilisable par le SERVEUR : `entreesDuFiltre`
//  est pure et la page serveur l'appelle. L'import ci-dessous ne
//  s'exécute qu'au moment où une fonction du navigateur l'appelle,
//  et `poserSelection` se garde déjà de `window`.
import { ouvrirLaListeEnHaut } from "@/lib/liste-neuve";
//  §1 (nº 333) — « cette surface se referme pour naviguer » : écrire un
//  filtre, c'est changer d'adresse. Le module commun le sait, et laisse
//  alors l'étape du panneau — celle qui porte le filtre.
import { laSurfaceVaNaviguer } from "@/lib/etape-refermable";

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
   * suivis : « profil:artiste », « profil:prive »… ou vide (le
   * vocabulaire est celui de la nº 321 — voir `cleProfil`).
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
  /*  §1 (nº 333) — UN FILTRE VALIDÉ LAISSE SON ENTRÉE.
      ==================================================================
      LE DÉFAUT, RELEVÉ PAR LE PROPRIÉTAIRE DANS SON JOURNAL, cinq fois
      de suite et à l'identique :

          POSÉE      /mes-favoris                  par la surface
          REMPLACÉE  /mes-favoris?selection=…      par la surface
          REPRISE    (history.back)                par la surface
          popstate   /mes-favoris                  par le navigateur
          REMPLACÉE  /mes-favoris?selection=…      par le routeur

      SOLDE NUL. Le panneau posait son étape, écrivait le filtre DESSUS
      (ce `replaceState`), puis la REPRENAIT en se refermant — parce que
      rien ne lui avait dit que l'adresse avait changé. Il ne restait
      donc rien à défaire : le retour suivant quittait la page.

      LE REMÈDE EST LE MÉCANISME DE LA RECHERCHE, PAS UN SECOND. Écrire
      le filtre, c'est changer d'adresse : on le DIT au module commun
      (`laSurfaceVaNaviguer`, lib/etape-refermable), exactement comme
      « Valider » de la page de recherche le dit depuis la nº 331. Le
      panneau laisse alors son étape — laquelle PORTE DÉJÀ le filtre,
      puisqu'on vient de l'écrire dessus par `replaceState`. L'étape est
      CONSOMMÉE par le filtre, pas doublée : une entrée par filtre,
      jamais deux.

      ⚠️ ET ANNULER NE COÛTE TOUJOURS RIEN. Refermer le panneau sans
      rien choisir n'appelle pas cette fonction : aucune marque, le
      module reprend son étape comme depuis la nº 330, et un seul appui
      de retour rend la page. Valider coûte une entrée, annuler zéro —
      c'est la distinction demandée, et elle tient toute seule.

      ⚠️ SUR LE WEB, où le menu ne pose aucune étape, la marque ne
      trouve rien à retenir : elle est sans effet. Rien ne change. */
  laSurfaceVaNaviguer();
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname + (requete ? `?${requete}` : "")
  );
  /*  §5 (nº 329) — UNE LISTE FILTRÉE COMMENCE EN HAUT.
      ------------------------------------------------------------------
      LE DÉFAUT : on descend dans « Ma sélection », on ouvre le menu, on
      choisit un filtre — et les résultats s'affichaient LÀ OÙ ON ÉTAIT.
      La page ne change pas d'adresse au sens du routeur (c'est un
      `replaceState`), donc rien ne remontait : ni `DefilementEnHaut`,
      qui ne se rejoue qu'au changement de CHEMIN, ni le navigateur.
      On se retrouvait au milieu d'une liste qu'on n'avait jamais
      parcourue.
      LA RÈGLE : un filtre appliqué, c'est une liste NEUVE — elle se
      pose en haut (point 3 de la règle de navigation).
      ⚠️ CE N'EST PLUS UN SIMPLE `defilerSansGeste` (nº 330-§1). Il
      suffisait au menu du WEB ; au doigt, le filtre se choisit dans un
      PANNEAU DU BAS, et un panneau GÈLE LE CORPS : la remontée
      s'exécutait pendant le gel — où elle ne peut rien — puis le dégel
      reposait l'ancienne position. Le propriétaire l'a relevé sur son
      iPhone alors que le banc était vert : le banc mesurait le menu,
      pas le panneau.
      `ouvrirLaListeEnHaut` (lib/liste-neuve) est L'ÉCRITURE UNIQUE des
      deux — elle oublie la position mémorisée, dit au gel de repartir
      de zéro, et fait défiler. Le moteur de recherche l'appelle aussi
      (nº 330-§2) : une seule règle, deux surfaces.
      ⚠️ TOUT DE SUITE, sans attendre le nouveau rendu : la liste ne
      peut que RACCOURCIR ou s'allonger sous nous, et dans les deux cas
      zéro reste zéro. */
  ouvrirLaListeEnHaut();
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

/**
 * §2 (nº 321) — LE MENU « PROFIL » EST UNE LISTE PLATE DE TROIS TYPES.
 * ------------------------------------------------------------------
 * ⚠️ CECI SIMPLIFIE CE QUE LES nº 316 ET 317 AVAIENT CONSTRUIT, sur
 * décision du propriétaire. Ce qui disparaît, entièrement :
 *  · les deux SOUS-TITRES « ARTISTE » et « LIEU » — plus de sous-titre
 *    gris, plus de point rose, plus de sous-groupe du tout ;
 *  · les quatre MODES D'EXERCICE (à domicile, en studio, en salon,
 *    guest) — ils ne figurent plus dans ce menu.
 * CE QUI RESTE : quatre entrées à plat, dans cet ordre —
 *
 *     Tous les profils
 *     Artiste
 *     Studio
 *     Salon
 *
 * LE FILTRE PORTE DONC SUR LE TYPE DE PORTFOLIO SUIVI, plus sur le
 * mode d'exercice de son auteur. C'est une question plus simple, et
 * c'est celle que le propriétaire veut poser.
 *
 * ⚠️ UN SEUL PRÉFIXE SUFFIT DÉSORMAIS. Il en fallait deux (`mode:` et
 * `lieu:`) tant que le menu mélangeait deux natures de chose ; il n'y
 * en a plus qu'une — le type de fiche. `profil:` porte tout, et aucun
 * slug de style du catalogue ne contient de deux-points : la confusion
 * reste impossible.
 */

/** Le préfixe d'un type de portfolio — « profil:artiste ». */
export const PROFIL = "profil";
/** Le titre des deux menus (§2-a et §2-b de la nº 316). */
export const GROUPE_STYLES = "Styles";
export const GROUPE_PROFIL = "Profil";

/** La clé d'un type, dans la table des comptes comme dans l'adresse —
    une seule écriture pour les deux. Les natures sont celles de
    `natureDeLaFiche` : « artiste », « prive » (Studio), « salon ». */
export const cleProfil = (nature: string) => `${PROFIL}:${nature}`;

/**
 * §2-d (nº 321) — LA TÊTE DU GROUPE : « Tous les profils ».
 * ------------------------------------------------------------------
 * Elle porte LE TOTAL et sélectionne tous les types — le procédé de
 * « Toutes les réalisations » sur l'onglet des favoris, à la lettre.
 * ⚠️ L'ÉTOILE N'EST PAS UNE NATURE : aucune collision possible avec
 * « profil:artiste ». C'est la même ruse que `CLE_TOTAL`, et pour la
 * même raison.
 * ⚠️ ELLE N'EST PAS UN RACCOURCI D'AFFICHAGE : elle a sa propre clé
 * dans la table des comptes, posée par `clesDuProfil` en même temps
 * que les autres. Compter et filtrer restent une seule fonction — le
 * nombre annoncé ne peut donc pas mentir.
 */
export const TOUS_LES_PROFILS = `${PROFIL}:*`;
/** Son mot, écrit une seule fois — le menu et le champ le lisent tous
    les deux (voir `libelleDuProfil`). */
export const LIBELLE_TOUS_LES_PROFILS = "Tous les profils";

/**
 * EST-CE UNE VALEUR DE PROFIL ? Rend la valeur telle quelle si oui,
 * « » sinon — c'est ce qui départage un style d'un profil à la
 * lecture de l'adresse, et c'est écrit UNE fois.
 * ⚠️ ON NE VALIDE PAS LA NATURE ICI : une nature inconnue ne comptera
 * simplement aucune entrée, donc aucun portfolio ne correspondra —
 * l'écran est vide, jamais faux. C'est exactement ce que fait un style
 * inconnu.
 */
export function profilDuFiltre(valeur: string): string {
  const [prefixe] = valeur.split(":");
  return prefixe === PROFIL ? valeur : "";
}

/**
 * COMMENT UN PROFIL CHOISI S'APPELLE — « Artiste », « Studio »…
 * ------------------------------------------------------------------
 * Le CHAMP de la barre et le SOUS-TITRE de la page le lisent tous les
 * deux : une seule écriture, comme `libelleDuChoix` l'exige depuis la
 * nº 257. Et aucun mot n'est inventé ici — `libelleTypeFiche` porte
 * les trois, exactement comme les fiches et les cartes les écrivent.
 */
export function libelleDuProfil(profil: string): string {
  //  §2-d (nº 321) — LA TÊTE D'ABORD : son mot n'est celui d'aucun
  //  type, il dit « tout le groupe ».
  if (profil === TOUS_LES_PROFILS) return LIBELLE_TOUS_LES_PROFILS;
  const [prefixe, nature = ""] = profil.split(":");
  if (prefixe !== PROFIL) return "";
  //  « artiste » se dit par lui-même ; « prive » et « salon » sont des
  //  natures d'ÉTABLISSEMENT — d'où les deux formes d'appel.
  return nature === "artiste"
    ? libelleTypeFiche("artiste", "")
    : libelleTypeFiche("salon", nature);
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

/**
 * ██ §2 (nº 576) — UN GROUPE QUI NE PEUT RIEN TRIER S'EN VA ██
 * ====================================================================
 * LE DÉFAUT : dans le menu des portfolios, la section « Profil »
 * s'affichait même quand tous les portfolios suivis sont de la même
 * nature — qui ne suit que des artistes y lisait « Tous les profils » et
 * « Artiste », deux entrées qui montrent EXACTEMENT la même chose. Une
 * section qui ne peut rien trier n'a rien à faire à l'écran.
 *
 * LE CRITÈRE, ET IL EST EXACT PLUTÔT QU'APPROCHÉ. On pourrait croire
 * qu'« une seule entrée = inutile » ; C'EST FAUX, et le menu des favoris
 * le prouve : « Réalisations » n'ayant qu'un style reste utile, parce
 * que sa tête (« Toutes les réalisations ») écarte quand même les
 * flashs. LE VRAI CRITÈRE EST LE COMPTE : une entrée dont le compte vaut
 * LE TOTAL montre tout, donc ne trie rien. Un groupe dont TOUTES les
 * entrées sont dans ce cas ne peut rien trier du tout — il part.
 *  · « Profil » avec les seuls artistes : tête = total, « Artiste » =
 *    total → il part. C'est le cas signalé.
 *  · « Styles » avec un seul style porté par TOUS les portfolios :
 *    même compte, même sort — la règle est la même pour les deux
 *    sections, il n'y en a qu'une écrite.
 *  · « Styles » avec un seul style porté par DEUX portfolios sur trois :
 *    son compte est inférieur au total, il trie, il reste. C'est
 *    précisément ce qu'un « une seule entrée » aveugle aurait perdu.
 *  · les deux portes des favoris : leur tête compte les photos de LEUR
 *    catégorie, jamais le total tant que l'autre catégorie existe.
 *
 * ⚠️ LE TOTAL EST DÉJÀ DANS LA TABLE (`CLE_TOTAL`, une étoile) : les
 * deux tables de comptes le posent (voir `selection-suivis`). On ne
 * recompte rien.
 * ⚠️ LES ENTRÉES SANS GROUPE NE SONT JAMAIS TOUCHÉES — il n'y en a plus
 * depuis la nº 525, la garde est là pour qu'on puisse en remettre.
 * ⚠️ CE QUI ARRIVE ENSUITE VIENT TOUT SEUL, et c'est voulu : s'il ne
 * reste qu'un groupe, `aDesPortesDeGroupe` rend faux, il n'y a plus de
 * portes et le bloc fixe de la nº 575 ne s'affiche pas — le menu
 * redevient une liste simple. Et s'il ne reste AUCUNE entrée, le menu
 * DISPARAÎT : `MenusSelection` rend un blanc quand sa liste est vide
 * (règle d'avant cette passe, inchangée).
 */
export function sansGroupeSansPrise(
  entrees: EntreeFiltre[],
  comptes: Map<string, number>
): EntreeFiltre[] {
  const total = comptes.get(CLE_TOTAL) ?? 0;
  if (!total) return entrees;
  const parGroupe = new Map<string, EntreeFiltre[]>();
  for (const entree of entrees) {
    if (!entree.groupe) continue;
    const liste = parGroupe.get(entree.groupe);
    if (liste) liste.push(entree);
    else parGroupe.set(entree.groupe, [entree]);
  }
  const sansPrise = new Set<string>();
  for (const [groupe, liste] of parGroupe) {
    if (liste.every((entree) => (entree.compte ?? 0) >= total)) {
      sansPrise.add(groupe);
    }
  }
  if (sansPrise.size === 0) return entrees;
  return entrees.filter(
    (entree) => !entree.groupe || !sansPrise.has(entree.groupe)
  );
}

export function entreesDuFiltre(
  comptes: Map<string, number>
): EntreeFiltre[] {
  if (comptes.size === 0) return [];
  /*  §3 (nº 321) — « TOUS LES FAVORIS » : L'ENTRÉE NEUTRE DE CE MENU.
      ⛔ CE QUI SUIT EST DE L'HISTOIRE — l'entrée a été retirée à la
      nº 525 (note juste dessous). On la garde parce qu'elle dit ce
      qu'il faudrait refaire si on la remettait un jour.
      ------------------------------------------------------------------
      Le menu des portfolios a la sienne depuis la nº 318 (« Tous les
      portfolios ») ; celui des favoris n'en avait aucune. Même place,
      même rôle, même écriture :
       · PREMIÈRE de la liste, et HORS GROUPE — au-dessus des deux
         portes. Une entrée qui annule TOUT le filtre ne peut pas vivre
         dans l'une d'elles ;
       · elle porte LE TOTAL des photos aimées (`CLE_TOTAL`) ;
       · sa valeur est VIDE : la choisir efface le paramètre d'adresse
         (voir `poserSelection`), donc annule catégorie et style d'un
         coup.
      ⚠️ LE DÉFAUT DE LA nº 317 NE PEUT PAS SE RÉVEILLER, et doublement :
      la garde « une valeur vide n'est pas un choix » (replieALOuverture)
      tient toujours — et cette entrée n'ayant AUCUN groupe, même sans
      la garde elle n'aurait rien à ouvrir. Le banc éprouve les deux. */
  /*  ██ §2 (nº 525) — L'ENTRÉE « TOUS LES FAVORIS » A QUITTÉ LE MENU ██
      Le propriétaire n'en veut plus dans la liste. CE QU'ELLE FAISAIT
      NE DISPARAÎT PAS POUR AUTANT : elle était le SEUL chemin de retour
      vers « tout », et sans elle un filtre choisi aurait enfermé le
      visiteur. Le retour passe désormais par le RE-CHOIX de l'entrée
      active, qui l'annule (voir MenusSelection).
      ⚠️ LE MOT, LUI, RESTE : c'est ce que le champ de la barre affiche
      quand rien n'est filtré. Il ne nomme plus une entrée de liste, il
      nomme un ÉTAT — celui de l'absence de filtre. */
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

  //  ⚠️ « TOUS LES STYLES » AVAIT DISPARU À LA nº 249-§1, et ne revient
  //  PAS : ce n'est pas ce que « Tous les favoris » remplace. Celle-là
  //  cherchait un style toutes catégories confondues — une question que
  //  personne ne pose. Celle-ci ANNULE le filtre, ce qui est autre
  //  chose, et c'est pourquoi elle vit hors groupe.
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
 * ⚠️ LA VALEUR NEUTRE — celle qui n'est ni un style, ni une catégorie,
 * ni un profil : la valeur VIDE. La choisir efface le paramètre
 * d'adresse, donc annule TOUT le filtre. Les DEUX menus l'emploient
 * pour leur entrée de tête, chacun avec son mot :
 *  · les portfolios → « Tous les portfolios » (nº 318) ;
 *  · les favoris    → « Tous les favoris » (nº 321).
 * ⚠️ ELLE S'APPELAIT `TOUS_LES_STYLES`, et ce nom est parti avec le
 * mot (nº 321-§3) : il ne restait plus une seule entrée « Tous les
 * styles » dans le site, garder son nom sur la valeur aurait rappelé
 * un objet disparu.
 */
export const VALEUR_NEUTRE = "";

/** §2-c (nº 318) — LE MOT DE L'ENTRÉE NEUTRE : « Tous les
    portfolios ». Écrit une fois — l'entrée du menu et le champ de la
    barre le lisent tous les deux (voir MenusSelection). Il remplace
    « Tous les styles », qui mentait depuis que le menu filtre aussi
    par profil (nº 316). */
export const LIBELLE_TOUS_LES_PORTFOLIOS = "Tous les portfolios";

/** §3 (nº 321) — LE MOT DE L'ENTRÉE NEUTRE DU MENU DES FAVORIS. Même
    place et même rôle que « Tous les portfolios » sur l'autre onglet :
    première de la liste, hors groupe, elle annule le filtre — et c'est
    ce que le champ affiche quand rien n'est choisi. Écrit une fois,
    lu par le menu et par le champ (voir MenusSelection). */
export const LIBELLE_TOUS_LES_FAVORIS = "Tous les favoris";

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
        ⛔ CE QUI SUIT EST DE L'HISTOIRE — l'entrée a été retirée à la
        nº 525 (note juste dessous), pour la même raison et par le même
        geste que sa jumelle des favoris.
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
    /*  ██ §1 (nº 525) — L'ENTRÉE « TOUS LES PORTFOLIOS » A QUITTÉ LE
         MENU ██ Même geste et même raison que sur les favoris, juste
         au-dessus : le retour vers « tout » passe par le re-choix de
         l'entrée active. Le mot reste, pour le champ de la barre. */
    ...styles,
  ];
}

/**
 * §2 (nº 321) — LE MENU « PROFIL », À PLAT
 * ------------------------------------------------------------------
 * QUATRE ENTRÉES, ET RIEN QUI N'EXISTE PAS :
 *  · une entrée n'apparaît que si au moins un portfolio suivi lui
 *    répond (`comptes` ne porte que du réel — voir `comptesDesSuivis`) ;
 *  · s'il n'y a aucun portfolio suivi, la fonction rend une liste
 *    VIDE — et le groupe « Profil » n'existe alors nulle part.
 *
 * ⚠️ PLUS AUCUN SOUS-GROUPE (nº 321-§2-a) : les entrées sont posées à
 * plat, dans le groupe « Profil » et rien de plus. Les sous-titres
 * « ARTISTE » et « LIEU » de la nº 316 sont partis, avec leur point
 * rose et les quatre modes d'exercice qu'ils abritaient.
 *
 * ⚠️ L'ORDRE EST CELUI DE LA CONSIGNE — Tous les profils, Artiste,
 * Studio, Salon. Les LIBELLÉS viennent de `libelleTypeFiche` : aucun
 * mot n'est réécrit ici.
 */
const TYPES_DU_PROFIL = ["artiste", "prive", "salon"] as const;

export function entreesDuProfil(
  comptes: Map<string, number>
): EntreeFiltre[] {
  const entrees: EntreeFiltre[] = [];
  const ajouter = (value: string, label: string) => {
    const compte = comptes.get(value);
    //  §2-d — CHAQUE ENTRÉE PORTE SON NOMBRE, comme celles de
    //  « Styles » : c'est le même champ, lu au même endroit. Et une
    //  entrée sans compte n'entre jamais : rien ne s'affiche qui
    //  n'existe pas (la règle de la nº 316-§2-c, inchangée).
    if (compte) entrees.push({ value, label, groupe: GROUPE_PROFIL, compte });
  };
  /*  LA TÊTE D'ABORD, LES TYPES ENSUITE. C'est l'ordre de « Toutes les
      réalisations » sur l'onglet des favoris : on peut reprendre TOUT
      le groupe sans avoir à parcourir ses entrées. */
  ajouter(TOUS_LES_PROFILS, LIBELLE_TOUS_LES_PROFILS);
  for (const nature of TYPES_DU_PROFIL) {
    ajouter(cleProfil(nature), libelleDuProfil(cleProfil(nature)));
  }
  return entrees;
}
