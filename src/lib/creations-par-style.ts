"use client";

import { useSyncExternalStore } from "react";

/**
 * COMBIEN DE PORTFOLIOS PAR STYLE — le magasin du navigateur
 * ===========================================================
 * (passe nº 216-§2, corrigée par la nº 217-§1)
 *
 * Le menu « Explorer » annonce, en face de chaque style, COMBIEN DE
 * PORTFOLIOS on y trouvera — pas combien de photos existent, et pas
 * non plus combien d'artistes : depuis la nº 624, un portfolio est UNE
 * GALERIE, c'est-à-dire une carte de la mosaïque. Le chiffre annoncé
 * et le nombre de vignettes qui suivront sont donc le même nombre. Les
 * nombres viennent de /api/yokofolio/creations-par-style.
 *
 * ⚠️ UN MAGASIN DE MODULE, PAS UN ÉTAT DE COMPOSANT. Le moteur de
 * recherche est monté DEUX fois (la barre du site et la page plein
 * écran du smartphone), et il remonte à chaque reconstruction de
 * l'arbre du routeur. Un `useState` + `useEffect` aurait redemandé les
 * nombres à chaque fois ; ici la demande part UNE SEULE FOIS par
 * chargement de page, et tous les menus lisent le même objet.
 *
 * ⚠️ JAMAIS BLOQUANT — le menu s'affiche AVANT que les nombres
 * n'arrivent, et si la réponse n'arrive jamais (base injoignable,
 * hors ligne), il reste exactement ce qu'il était avant cette passe :
 * une liste de styles, sans nombres. Rien n'attend, rien n'échoue.
 */

/**
 * CE QUE LE MAGASIN CONTIENT :
 *  · `comptes` — nature → style → nombre de PORTFOLIOS publiés ;
 *  · `totaux`  — nature → nombre de portfolios de la catégorie.
 *
 * ⚠️ `totaux` VIENT DU SERVEUR, ET C'EST CE QUI COMPTE : lui seul a les
 * identifiants, le navigateur n'a que des nombres.
 * ⚠️ §1 (nº 624) — LA RAISON HISTORIQUE DE CE CHAMP A CHANGÉ, ET LE
 * CHAMP RESTE. Il était écrit ici que `totaux` NE POUVAIT PAS être la
 * somme de `comptes` : un artiste publiant en aquarelle ET en chicano
 * comptait dans les deux styles mais ne valait qu'un portfolio dans
 * « Tous les flashs ». Depuis la nº 624, on compte des GALERIES, et une
 * galerie n'appartient qu'à un style : la somme retombe juste. Le champ
 * demeure — il est calculé au même endroit et au même passage que
 * `comptes` (voir la route), et le supprimer ferait recalculer au
 * navigateur ce que le serveur sait déjà.
 */
export type ComptesCreations = {
  comptes: Record<string, Record<string, number>>;
  totaux: Record<string, number>;
};

/** L'objet des débuts — et celui du serveur. Une CONSTANTE : c'est ce
    que `useSyncExternalStore` attend d'un instantané qui ne change
    pas (une valeur neuve à chaque lecture ferait boucler le rendu). */
const VIDE: ComptesCreations = { comptes: {}, totaux: {} };

let comptes: ComptesCreations = VIDE;
let demandeLancee = false;
const abonnes = new Set<() => void>();

/** La demande — lancée UNE fois, au premier abonnement. */
function demander() {
  if (demandeLancee || typeof window === "undefined") return;
  demandeLancee = true;
  fetch("/api/yokofolio/creations-par-style")
    .then((reponse) => (reponse.ok ? reponse.json() : null))
    .then((donnees) => {
      const recus = donnees?.comptes;
      if (!recus || typeof recus !== "object") return;
      comptes = {
        comptes: recus as ComptesCreations["comptes"],
        totaux: (donnees?.totaux ?? {}) as ComptesCreations["totaux"],
      };
      abonnes.forEach((prevenir) => prevenir());
    })
    .catch(() => {
      /*  Aucun nombre : le menu s'affiche sans, et c'est très bien. */
    });
}

function sAbonner(prevenir: () => void) {
  abonnes.add(prevenir);
  demander();
  return () => {
    abonnes.delete(prevenir);
  };
}

function instantane(): ComptesCreations {
  return comptes;
}

function instantaneServeur(): ComptesCreations {
  return VIDE;
}

/** Les nombres, tels qu'on les connaît à cet instant. Vide tant que la
    réponse n'est pas arrivée — voir `comptesConnus` pour savoir s'il
    faut afficher un nombre ou rien du tout. */
export function useComptesCreations(): ComptesCreations {
  return useSyncExternalStore(sAbonner, instantane, instantaneServeur);
}

/**
 * A-T-ON REÇU LES NOMBRES ?
 * ⚠️ LA DIFFÉRENCE COMPTE : un menu qui afficherait « 0 » partout en
 * attendant la réponse mentirait pendant une demi-seconde. Tant que
 * rien n'est arrivé, on n'affiche AUCUN nombre ; une fois la réponse
 * là, un style sans photo affiche « 0 » — et c'est une information.
 */
export function comptesConnus(etat: ComptesCreations): boolean {
  return etat !== VIDE;
}

/** Les portfolios publiés dans un style, pour une catégorie. */
export function compteDuStyle(
  etat: ComptesCreations,
  nature: string,
  style: string
): number {
  return etat.comptes[nature]?.[style] ?? 0;
}

/** Les portfolios d'une catégorie — le nombre de « Toutes les
    réalisations » et de « Tous les flashs ». Il vient du serveur : le
    même artiste peut tenir plusieurs styles, l'addition compterait
    deux fois (nº 217-§1). */
export function compteDeLaCategorie(
  etat: ComptesCreations,
  nature: string
): number {
  return etat.totaux[nature] ?? 0;
}
