"use client";

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

const EVENEMENT = "roswel:adresse-changee";

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
