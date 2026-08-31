"use client";

import { estLaMosaique } from "@/lib/chemin-recherche";

/**
 * L'ADRESSE COURANTE, ET TOUS SES CHANGEMENTS
 * ============================================
 * ⚠️ CE MODULE RÉPARE LA CORRUPTION DU JOURNAL DE NAVIGATION
 * (passe nº 154). Le défaut, mesuré :
 *
 *     accueil          → journal : courante « / »
 *     recherche à Lyon → journal : courante « / »   ← RIEN
 *     fiche            → journal : précédente « / » ← LA MAUVAISE PAGE
 *
 * POURQUOI. Le journal (lib/navigation-session) est tenu par
 * MemoireNavigation, dont l'effet se rejoue au changement de CHEMIN ou
 * de CRITÈRES. Les critères étaient lus par un magasin abonné au SEUL
 * `popstate` — l'événement des retours arrière. Or une recherche ne
 * fait pas de retour arrière : elle appelle `router.replace('/?…')`,
 * qui passe par `history.replaceState`. Aucun `popstate`, donc aucune
 * notification, donc un magasin qui rend éternellement l'ancienne
 * requête : l'effet ne se rejouait jamais et LA PAGE DE RÉSULTATS
 * N'ÉTAIT JAMAIS INSCRITE AU JOURNAL.
 *
 * CE QUE ÇA CASSAIT, EN AVAL. Tout ce qui demande « d'où vient-on ? » :
 *  · le bouton de retour d'une fiche quand l'historique du navigateur
 *    ne peut pas servir (application relancée, onglet neuf) —
 *    il reconstruisait le retour vers « / », l'accueil NU : la
 *    recherche était perdue ;
 *  · le retour garanti des vrais mobiles (RetourGaranti), qui
 *    `location.replace` vers la « page précédente » du journal — après
 *    un détour par les favoris, c'était « Ma sélection », puis
 *    « Créer mon portfolio » : le parcours déraillait de page en page.
 *
 * LA CORRECTION. On surveille les DEUX portes par lesquelles une
 * adresse peut changer : `popstate` (le navigateur) et
 * `pushState` / `replaceState` (le code, Next compris). Les deux
 * fonctions sont enveloppées UNE SEULE FOIS, elles appellent toujours
 * l'implémentation d'origine — celle de Next si elle est déjà en
 * place — et signalent le changement APRÈS coup.
 *
 * ⚠️ ON N'AJOUTE, ON NE REMPLACE RIEN. L'enveloppe est posée à la
 * première souscription, jamais au chargement du module : Next a alors
 * déjà armé son propre `pushState`, et c'est lui qu'on appelle.
 */

const EVENEMENT = "yokofolio:adresse-changee";

let surveillancePosee = false;

/** Enveloppe `pushState` et `replaceState` — une seule fois. */
function poserLaSurveillance() {
  if (surveillancePosee || typeof window === "undefined") return;
  surveillancePosee = true;
  for (const nom of ["pushState", "replaceState"] as const) {
    const original = window.history[nom];
    if (typeof original !== "function") continue;
    window.history[nom] = function (
      this: History,
      ...arguments_: Parameters<History["pushState"]>
    ) {
      const retour = original.apply(this, arguments_);
      //  APRÈS l'appel : l'adresse est déjà la nouvelle quand les
      //  abonnés se réveillent.
      window.dispatchEvent(new Event(EVENEMENT));
      return retour;
    };
  }
}

/**
 * S'ABONNER À TOUT CHANGEMENT D'ADRESSE — retour arrière du navigateur
 * ET navigation du code. Rend la fonction de désabonnement, comme le
 * veut `useSyncExternalStore`.
 */
export function souscrireAdresse(rappel: () => void): () => void {
  poserLaSurveillance();
  window.addEventListener("popstate", rappel);
  window.addEventListener(EVENEMENT, rappel);
  return () => {
    window.removeEventListener("popstate", rappel);
    window.removeEventListener(EVENEMENT, rappel);
  };
}

/** Les critères de l'adresse courante (« ?style=… »), côté navigateur. */
export function lireRequeteCourante(): string {
  return window.location.search;
}

/**
 * LA REQUÊTE D'UNE PAGE DONNÉE — GELÉE DÈS QUE L'ADRESSE N'EST PLUS
 * LA SIENNE (nº 360).
 * ==================================================================
 * `lireRequeteCourante` dit l'adresse DU MOMENT, quelle qu'elle soit.
 * Or une page préparée d'avance qui sème ses accessoires d'arrivée
 * (FicheSelonLAdresse) ne doit lire que LA SIENNE :
 *  · au premier rendu d'une navigation douce, l'adresse n'est pas
 *    encore commise (mesure nº 336) — lire là, c'est lire la page
 *    PRÉCÉDENTE ; on rend `null` : « je n'ai encore rien possédé » ;
 *  · pendant sa vie, une SURFACE peut posséder l'adresse (fenêtre de
 *    carrousel, pile des fiches — des pushState bruts) ; on rend la
 *    valeur MÉMORISÉE, inchangée — donc AUCUN rendu chez l'abonné.
 * LA MÉMOIRE VIT ICI, à l'échelle du module : une seule PAGE la lit à
 * la fois (c'est une lecture de page, jamais de surface), et changer
 * de chemin la remet à zéro — une navigation de fiche à fiche repart
 * de rien.
 */
let cheminGele = "";
let requeteGelee: string | null = null;
export function lireRequeteDeLaPage(chemin: string): string | null {
  if (cheminGele !== chemin) {
    cheminGele = chemin;
    requeteGelee = null;
  }
  if (window.location.pathname === chemin) {
    requeteGelee = window.location.search;
  }
  return requeteGelee;
}

/**
 * LA REQUÊTE DE LA MOSAÏQUE — GELÉE DÈS QUE L'ADRESSE N'EST PLUS LA
 * SIENNE (nº 732, sur le motif de la nº 360 juste au-dessus).
 * ==================================================================
 * POURQUOI UNE JUMELLE, ET PAS `lireRequeteDeLaPage`. La mémoire de la
 * nº 360 appartient à LA PAGE DE FICHE (un seul lecteur à la fois,
 * c'est écrit dans sa note) ; la mosaïque, qui vit sur DEUX chemins
 * (« / » et « /recherche » — `estLaMosaique`, lib/chemin-recherche),
 * a donc SA mémoire, et la même règle :
 *  · tant que l'adresse est celle de la mosaïque, on lit et on
 *    mémorise ;
 *  · dès qu'une SURFACE possède l'adresse (la fenêtre de fiche pousse
 *    /tatoueur/nom par un pushState brut), on rend la valeur
 *    MÉMORISÉE, inchangée — donc AUCUN rendu chez l'abonné.
 * C'EST TOUTE LA RÉPARATION DE LA nº 732 : la nº 673 lisait ici
 * l'adresse BRUTE (`lireRequeteCourante`), et chaque ouverture de
 * fenêtre re-rendait donc la page de recherche — dont le garde-fou de
 * la nº 631, réveillé, prenait l'adresse de la fiche pour une page
 * fausse et la redemandait au serveur : la fiche remplaçait la
 * mosaïque (les trois symptômes de la nº 729, cause tracée au commit
 * près par l'enquête nº 731).
 * ⚠️ `null` = « la mosaïque n'a encore jamais possédé l'adresse » —
 * même sémantique que la nº 360 ; le consommateur (IndexTatoueurs)
 * retombe alors sur ses critères servis : on ne juge pas une page
 * qu'on n'a pas vue à l'adresse.
 */
let requeteMosaiqueGelee: string | null = null;
export function lireRequeteDeLaMosaique(): string | null {
  if (estLaMosaique(window.location.pathname)) {
    requeteMosaiqueGelee = window.location.search;
  }
  return requeteMosaiqueGelee;
}

/**
 * LE CHEMIN DE L'ADRESSE COURANTE, côté navigateur.
 * §2 (nº 337) — POURQUOI IL A FALLU L'AJOUTER. `usePathname()` ne dit
 * pas tout : une surface qui pose son adresse par un `pushState` BRUT
 * (la fenêtre de carrousel, FicheTatoueur) ne passe pas par le routeur,
 * qui continue donc d'annoncer le chemin de la PAGE. Un composant
 * abonné au seul `usePathname` n'est alors JAMAIS réveillé quand cette
 * adresse-là change — mesuré : la fenêtre restait ouverte par-dessus la
 * fiche, et il fallait un second appui pour qu'un rendu quelconque la
 * referme. Ici, on lit le chemin là où il est vrai, et l'on est
 * réveillé par les DEUX portes (le navigateur et le code).
 */
export function lireCheminCourant(): string {
  return window.location.pathname;
}

/** Côté serveur : rien à lire, et surtout pas d'erreur. */
export function lireCheminServeur(): string {
  return "";
}

/** Côté serveur : rien à lire, et surtout pas d'erreur. */
export function lireRequeteServeur(): string {
  return "";
}
