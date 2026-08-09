"use client";

import { useSyncExternalStore } from "react";

/**
 * ÉTAT PARTAGÉ DES FAVORIS (côté navigateur)
 * ------------------------------------------
 * Un seul état par artisan, partagé par TOUS les cœurs affichés :
 * la carte d'un artisan et sa fiche (visibles côte à côte en mode
 * double) restent synchronisées instantanément, sans rechargement.
 * Cœur activé sur une carte → cœur plein sur la fiche du même
 * artisan, et inversement.
 *
 * L'état vit en mémoire (le temps de la page) ; la base reste la
 * source de vérité au chargement suivant. Chaque bouton écrit la
 * base de son côté ; ici on ne gère que la cohérence visuelle
 * immédiate entre les instances.
 */

const etats = new Map<string, boolean>();
// L'état de DÉPART de chaque artisan (celui du serveur, à l'arrivée sur
// la page) et le NOMBRE de favoris annoncé alors. Les deux sont figés
// pour toute la session : voir `nombreFavorisAffiche` plus bas.
const departs = new Map<string, boolean>();
const bases = new Map<string, number>();
const ecouteurs = new Set<() => void>();

/** Amorce l'état d'un artisan (première instance montée) sans
    écraser une valeur déjà connue — appelé pendant le rendu, donc
    volontairement SANS notification. */
export function amorcerFavori(id: string, actif: boolean) {
  if (!etats.has(id)) etats.set(id, actif);
  if (!departs.has(id)) departs.set(id, actif);
}

export function lireFavori(id: string): boolean {
  return etats.get(id) ?? false;
}

/** Change l'état d'un artisan et prévient toutes les instances */
export function definirFavori(id: string, actif: boolean) {
  if (etats.get(id) === actif) return;
  etats.set(id, actif);
  ecouteurs.forEach((prevenir) => prevenir());
}

/**
 * LE COMPTEUR DE FAVORIS DE LA FICHE
 * ----------------------------------
 * Il partait du nombre envoyé par le serveur, auquel chaque bouton
 * ajoutait ou retranchait SON état : `nombre − état de départ + état
 * courant`. Le calcul est juste tant que ses deux termes serveur ne
 * bougent pas… mais ils bougent : la fiche est rechargée (clic sur une
 * carte, retour arrière, nouvelle recherche) et revient avec un nombre
 * réactualisé, tandis que l'état de départ, lui, provient de la liste
 * de favoris lue au CHARGEMENT DE LA PAGE. Les deux se désaccordent, et
 * le compteur restait bloqué — un favori retiré ne le faisait plus
 * redescendre.
 *
 * On fige donc les deux repères À LA PREMIÈRE RENCONTRE de l'artisan,
 * ici, dans l'état partagé : le nombre de départ et l'état de départ.
 * Seul l'état COURANT bouge ensuite. Ajout = +1, retrait = −1, dans les
 * deux sens et depuis n'importe quel cœur — carte comme fiche.
 * (Rendu serveur : on ne touche à rien et on renvoie la valeur reçue —
 * ces tables vivent dans le navigateur, le temps de la page.)
 */
export function nombreFavorisAffiche(
  id: string,
  nombreServeur: number | null,
  actif: boolean
): number {
  if (typeof window === "undefined") {
    return Math.max(0, nombreServeur ?? 0);
  }
  if (!bases.has(id) && nombreServeur != null) bases.set(id, nombreServeur);
  const base = bases.get(id) ?? 0;
  const depart = departs.get(id) ?? false;
  return Math.max(0, base - (depart ? 1 : 0) + (actif ? 1 : 0));
}

function abonner(ecouteur: () => void) {
  ecouteurs.add(ecouteur);
  return () => {
    ecouteurs.delete(ecouteur);
  };
}

/**
 * Lit l'état favori d'un artisan et re-rend quand il change,
 * d'où qu'il vienne. `initial` sert au tout premier rendu (serveur
 * puis hydratation) : il doit être amorcé AVANT l'appel pour que
 * le premier instantané client corresponde à celui du serveur.
 */
export function useFavori(id: string, initial: boolean): boolean {
  return useSyncExternalStore(
    abonner,
    () => lireFavori(id),
    () => initial
  );
}
