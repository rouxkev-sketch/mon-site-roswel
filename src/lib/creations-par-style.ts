"use client";

import { useSyncExternalStore } from "react";

/**
 * COMBIEN DE CRÉATIONS PAR STYLE — le magasin du navigateur
 * ===========================================================
 * (passe nº 216-§2)
 *
 * Le menu « Explorer » annonce, en face de chaque style, ce qu'on y
 * trouvera. Les nombres viennent de /api/yokofolio/creations-par-style.
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

/** Nature → style → nombre de photos publiées. */
export type ComptesCreations = Record<string, Record<string, number>>;

/** L'objet des débuts — et celui du serveur. Une CONSTANTE : c'est ce
    que `useSyncExternalStore` attend d'un instantané qui ne change
    pas (une valeur neuve à chaque lecture ferait boucler le rendu). */
const VIDE: ComptesCreations = {};

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
      comptes = recus as ComptesCreations;
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
export function comptesConnus(comptes: ComptesCreations): boolean {
  return comptes !== VIDE;
}

/** Les créations d'un style, dans une catégorie. */
export function compteDuStyle(
  comptes: ComptesCreations,
  nature: string,
  style: string
): number {
  return comptes[nature]?.[style] ?? 0;
}

/** Toutes les créations d'une catégorie — le nombre de « Toutes les
    réalisations » et de « Tous les flashs ». Chaque photo porte un
    style, la somme des styles est donc bien le total de la nature. */
export function compteDeLaCategorie(
  comptes: ComptesCreations,
  nature: string
): number {
  return Object.values(comptes[nature] ?? {}).reduce(
    (total, nombre) => total + nombre,
    0
  );
}
