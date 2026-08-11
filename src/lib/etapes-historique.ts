"use client";

/**
 * QUI A LE DROIT D'ÉCRIRE UNE ÉTAPE D'HISTORIQUE — ET QUAND
 * ==================================================================
 * (passe nº 184-§1)
 *
 * LE DÉFAUT RELEVÉ SUR L'IPHONE DU PROPRIÉTAIRE. Ce sont tous des
 * RETOURS, et l'historique GRANDIT à chacun :
 *
 *     POPSTATE · /?sonde-bascule=1 ......... HISTORIQUE 3 entrées
 *     POPSTATE · /?style=abstrait .......... HISTORIQUE 4 entrées
 *     POPSTATE · /?style=acid-trad ......... HISTORIQUE 5 entrées
 *     POPSTATE · /?style=bio-mecha ......... HISTORIQUE 6 entrées
 *
 * Un retour doit CONSOMMER une entrée, jamais en créer une. L'étape
 * posée à la main par la passe nº 182 — celle qui donne son entrée à
 * une recherche VALIDÉE — se reposait au retour : le code croyait à une
 * nouvelle validation, empilait une étape, et effaçait du même geste
 * celles qui suivaient. D'où le tourne-en-rond, puis la sortie du site.
 *
 * CE MODULE POSE LES DEUX VERROUS DEMANDÉS, ET RIEN D'AUTRE :
 *
 *  a) ON NE POSE PLUS RIEN PENDANT UNE TRAVERSÉE. `traverseeEnCours()`
 *     dit si le navigateur vient de reculer ou d'avancer — soit dans ce
 *     document (`popstate`), soit en le créant (type de navigation
 *     « back_forward »). Tant qu'elle répond oui, aucune étape n'est
 *     écrite : l'adresse est corrigée SUR PLACE.
 *
 *     ⚠️ ET NOTRE PROPRE `back()` N'EST PAS UNE TRAVERSÉE. La page de
 *     recherche du smartphone dépile SON étape elle-même avant de
 *     valider (voir PageRechercheMobile) : ce retour-là est ordonné par
 *     le site, il est annoncé par `ignorerLeProchainRetour()` et ne
 *     compte pas. Sans cette nuance, le verrou aurait supprimé l'étape
 *     de la recherche validée — c'est-à-dire annulé la nº 182.
 *
 *  b) LE DRAPEAU « RECHERCHE VALIDÉE » NE SERT QU'UNE FOIS.
 *     `armerValidation()` est appelé par le bouton « Valider », et
 *     `consommerValidation()` l'efface AU PREMIER REGARD, qu'il ait
 *     servi ou non. Il ne survit ni à une navigation (tout `popstate`
 *     l'efface) ni à l'attente (un peu plus d'une seconde) : une
 *     fonction rejouée avec un vieux `{ validee: true }` en main ne
 *     trouve donc plus rien à consommer.
 *
 * TOUT VIT DANS UN MODULE, jamais dans un état React : un remontage de
 * composant ne doit pas remettre ces verrous à zéro (c'est la leçon de
 * lib/recherche-mobile, payée comptant).
 */

/** Combien de temps un retour/avance couvre ce qui le suit. */
const FENETRE_TRAVERSEE_MS = 1500;

/** Combien de temps un « Valider » reste valable. Au-delà, ce n'est
    plus le geste de l'utilisateur, c'est un écho. */
const VIE_VALIDATION_MS = 1200;

/** `history.back()` est ASYNCHRONE : son `popstate` arrive plus tard.
    Passé ce délai, l'annonce est périmée — elle ne doit pas avaler le
    retour SUIVANT, qui, lui, sera bien celui de l'utilisateur. */
const DELAI_RETOUR_ORDONNE_MS = 1000;

/** Quand le navigateur a reculé ou avancé pour de bon (0 : jamais). */
let dernierRetour = 0;
/** Quand le site a ordonné lui-même un retour (0 : aucun en attente). */
let retourOrdonne = 0;
/** Quand « Valider » a été pressé (0 : rien à consommer). */
let validationArmee = 0;
let ecouteurPose = false;

/** Le document lui-même est-il né d'un retour ou d'une avance ? */
function documentNeDUneTraversee(): boolean {
  try {
    const [navigation] = performance.getEntriesByType(
      "navigation"
    ) as PerformanceNavigationTiming[];
    return (navigation?.type ?? "navigate") === "back_forward";
  } catch {
    return false;
  }
}

/**
 * POSER L'OREILLE — une seule fois, au démarrage du site (appelé par
 * MemoireNavigation, qui vit dans la mise en page).
 * ⚠️ L'ÉCOUTEUR EST POSÉ LE PREMIER, avant ceux que les composants
 * ajoutent en cours de route : il voit donc chaque traversée avant que
 * quiconque ne réagisse.
 */
export function surveillerLesTraversees() {
  if (ecouteurPose || typeof window === "undefined") return;
  ecouteurPose = true;
  window.addEventListener("popstate", () => {
    //  b) UNE NAVIGATION EFFACE LA VALIDATION EN ATTENTE, toujours.
    validationArmee = 0;
    //  a) NOTRE PROPRE RETOUR N'EN EST PAS UNE.
    if (retourOrdonne && Date.now() - retourOrdonne < DELAI_RETOUR_ORDONNE_MS) {
      retourOrdonne = 0;
      return;
    }
    retourOrdonne = 0;
    dernierRetour = Date.now();
  });
}

/** « Le retour qui vient est le mien » — à dire JUSTE AVANT
    `history.back()`. L'annonce se périme toute seule. */
export function ignorerLeProchainRetour() {
  retourOrdonne = Date.now();
}

/** Le navigateur vient-il de reculer ou d'avancer ? */
export function traverseeEnCours(): boolean {
  if (dernierRetour && Date.now() - dernierRetour < FENETRE_TRAVERSEE_MS) {
    return true;
  }
  //  Un document RESSUSCITÉ par un retour : ses tout premiers instants
  //  appartiennent encore à la traversée.
  try {
    return documentNeDUneTraversee() && performance.now() < FENETRE_TRAVERSEE_MS;
  } catch {
    return false;
  }
}

/** « Valider » vient d'être pressé — à dire juste avant de lancer la
    recherche. */
export function armerValidation() {
  validationArmee = Date.now();
}

/** VRAI UNE SEULE FOIS, et seulement dans la seconde qui suit
    « Valider ». Le drapeau est effacé quoi qu'il arrive. */
export function consommerValidation(): boolean {
  const quand = validationArmee;
  validationArmee = 0;
  return quand !== 0 && Date.now() - quand < VIE_VALIDATION_MS;
}
