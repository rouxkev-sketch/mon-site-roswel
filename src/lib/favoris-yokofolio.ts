"use client";

import { useSyncExternalStore } from "react";

/**
 * CE QU'ON GARDE — photos enregistrées et tatoueurs suivis
 * =========================================================
 * UN SEUL ÉTAT PAR OBJET, PARTAGÉ PAR TOUS LES BOUTONS À L'ÉCRAN.
 * C'est nécessaire, et pas seulement élégant : sur le web, la carte de
 * la mosaïque et la fenêtre de fiche du MÊME tatoueur sont visibles en
 * même temps. Un cœur allumé sur l'une doit s'allumer sur l'autre à
 * l'instant, sans rechargement.
 *
 * LA BASE RESTE LA SOURCE DE VÉRITÉ : ce magasin ne fait que tenir
 * l'affichage cohérent entre les instances, le temps de la page. Au
 * chargement suivant, c'est le serveur qui dit ce qui est enregistré.
 *
 * ⚠️ LE GESTE EN ATTENTE (`enAttente`) — la promesse faite au visiteur
 * NON CONNECTÉ. Toucher un cœur sans compte mène à la page de
 * connexion ; on retient AVANT de partir ce qu'il voulait faire, et on
 * le REJOUE à son retour. Il ne perd donc ni sa page (l'adresse de
 * départ voyage dans `?suite=`), ni son geste. La note vit dans
 * `sessionStorage` : elle meurt avec l'onglet, et ne contient que le
 * genre et l'identifiant de ce qui était visé — rien de personnel.
 */

/* ================================================================
 * L'ÉTAT PARTAGÉ
 * ================================================================ */

type Genre = "photo" | "tatoueur";

/** L'état courant de chaque objet, par genre. */
const etats: Record<Genre, Map<string, boolean>> = {
  photo: new Map(),
  tatoueur: new Map(),
};
const ecouteurs = new Set<() => void>();

function prevenir() {
  ecouteurs.forEach((rappel) => rappel());
}

function sAbonner(rappel: () => void) {
  ecouteurs.add(rappel);
  return () => {
    ecouteurs.delete(rappel);
  };
}

/** AMORCE l'état d'un objet SANS écraser ce qu'on sait déjà — appelé
    pendant le rendu, donc volontairement SANS notification (prévenir
    React pendant qu'il rend est une faute qu'il signale). */
export function amorcer(genre: Genre, id: string, actif: boolean) {
  if (!etats[genre].has(id)) etats[genre].set(id, actif);
}

/** Pose l'état d'un objet et réveille tous ses boutons. */
export function definir(genre: Genre, id: string, actif: boolean) {
  if (etats[genre].get(id) === actif) return;
  etats[genre].set(id, actif);
  prevenir();
}

function lire(genre: Genre, id: string, defaut: boolean): boolean {
  const connu = etats[genre].get(id);
  return connu === undefined ? defaut : connu;
}

/** L'ÉTAT D'UN OBJET, tel que tous ses boutons le voient. */
export function useEtatFavori(
  genre: Genre,
  id: string,
  defaut: boolean
): boolean {
  return useSyncExternalStore(
    sAbonner,
    () => lire(genre, id, defaut),
    () => defaut
  );
}

/**
 * L'ÉTAT D'UNE SÉRIE (nº 203-§2) — le cœur d'une vignette de style.
 * La série est enregistrée quand TOUTES ses photos le sont : c'est le
 * seul état que le cœur puisse dire honnêtement. L'instantané est un
 * booléen — React compare la VALEUR, la fonction peut changer.
 */
export function useEtatSerie(ids: string[]): boolean {
  return useSyncExternalStore(
    sAbonner,
    () => ids.length > 0 && ids.every((id) => lire("photo", id, false)),
    () => false
  );
}

/* ================================================================
 * LE GESTE EN ATTENTE — pour qui n'est pas connecté
 * ================================================================ */

const CLE_ATTENTE = "yokofolio-geste-en-attente";

/** « serie » (nº 203-§2) : le cœur d'une vignette de style — l'id est
    alors la liste des photos de la série, jointes par des virgules. */
export type GesteEnAttente = { genre: Genre | "serie"; id: string };

/** Retenir le geste avant de partir vers la connexion. */
export function retenirLeGeste(geste: GesteEnAttente) {
  try {
    sessionStorage.setItem(CLE_ATTENTE, JSON.stringify(geste));
  } catch {
    // Stockage refusé (navigation privée stricte) : on perd le geste,
    // jamais la page — l'adresse de retour, elle, est dans l'URL.
  }
}

/** Le geste retenu, s'il vise CET objet — et il est consommé : on ne
    rejoue jamais deux fois la même chose. */
export function reprendreLeGeste(
  genre: GesteEnAttente["genre"],
  id: string
): boolean {
  try {
    const brut = sessionStorage.getItem(CLE_ATTENTE);
    if (!brut) return false;
    const geste = JSON.parse(brut) as GesteEnAttente;
    if (geste.genre !== genre || geste.id !== id) return false;
    sessionStorage.removeItem(CLE_ATTENTE);
    return true;
  } catch {
    return false;
  }
}

/**
 * L'ADRESSE DE LA CONNEXION, AVEC LE CHEMIN DU RETOUR.
 * ⚠️ ON N'EMPORTE QUE LE CHEMIN INTERNE (jamais une adresse complète
 * venue d'ailleurs) : c'est ce qui empêche qu'un lien fabriqué renvoie
 * quelqu'un hors du site après sa connexion.
 */
export function versLaConnexion(): string {
  const ici = `${window.location.pathname}${window.location.search}`;
  return `/devenir-tatoueur?suite=${encodeURIComponent(ici)}`;
}

/** Le chemin de retour, nettoyé : interne, et rien d'autre. */
export function suiteSure(brut: string | null | undefined): string | null {
  if (!brut) return null;
  if (!brut.startsWith("/") || brut.startsWith("//")) return null;
  return brut;
}

/**
 * CET IDENTIFIANT DÉSIGNE-T-IL VRAIMENT UNE LIGNE EN BASE ?
 * =========================================================
 * ⚠️ TOUT CE QUI S'AFFICHE N'EST PAS ENREGISTRABLE, et il faut le
 * savoir AVANT de montrer un cœur — un bouton qui échoue une fois
 * touché est pire que pas de bouton. Deux cas, tous deux réels :
 *  · LES FICHES DE DÉMONSTRATION, dont les photos portent des clés
 *    fabriquées (« demo-01-photo-0-2 ») ;
 *  · LES PORTFOLIOS D'AVANT LE CATALOGUE (migration nº 31), dont la
 *    clé de carrousel est « style-adresse ».
 * Dans les deux cas la photo n'existe pas dans `photos_tatoueur` :
 * l'enregistrer serait refusé par la clé étrangère. Le cœur ne
 * s'affiche donc pas (voir BoutonCoeurPhoto).
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function estIdentifiantDeBase(id: string | null | undefined): boolean {
  return typeof id === "string" && UUID.test(id);
}

/* ================================================================
 * CE QUE J'AI DÉJÀ ENREGISTRÉ — lu UNE fois par page
 * ================================================================ */

let chargementLance = false;

/**
 * LES FAVORIS DU COMPTE, EN UNE SEULE DEMANDE.
 * ⚠️ POURQUOI PAS DEPUIS LE SERVEUR, avec les cartes ? Parce que la
 * mosaïque est mise en cache et partagée par tout le monde : y mêler
 * « ce que CETTE personne a enregistré » la rendrait personnelle, donc
 * incachable, pour un cœur. On demande donc la liste à part, une fois,
 * et les cœurs s'allument dès qu'elle arrive.
 * Les identifiants seuls voyagent : c'est tout ce dont les boutons ont
 * besoin.
 */
export function chargerLesMiens() {
  if (chargementLance) return;
  chargementLance = true;
  fetch("/api/yokofolio/favoris/miens")
    .then((reponse) => reponse.json())
    .then((donnees: { photos?: string[]; tatoueurs?: string[] } | null) => {
      for (const id of donnees?.photos ?? []) definir("photo", id, true);
      for (const id of donnees?.tatoueurs ?? []) definir("tatoueur", id, true);
    })
    .catch(() => {
      // Liste injoignable : les cœurs restent éteints, et le geste
      // fonctionne quand même (la base tranchera à l'écriture).
    });
}

/** Une déconnexion vide l'ardoise : les cœurs du visiteur suivant ne
    doivent rien porter du compte précédent. */
export function oublierLesMiens() {
  chargementLance = false;
  etats.photo.clear();
  etats.tatoueur.clear();
  prevenir();
}

/* ================================================================
 * ÉCRIRE EN BASE — une seule porte pour les deux genres
 * ================================================================ */

/** Enregistre (ou retire) — rend `true` si le serveur a suivi. */
export async function ecrireFavori(
  genre: Genre,
  id: string,
  actif: boolean
): Promise<boolean> {
  try {
    const reponse = await fetch(
      genre === "photo"
        ? "/api/yokofolio/favoris/photo"
        : "/api/yokofolio/favoris/tatoueur",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, actif }),
      }
    );
    const donnees = (await reponse.json().catch(() => null)) as {
      ok?: boolean;
    } | null;
    return Boolean(donnees?.ok);
  } catch {
    return false;
  }
}

/** UNE SÉRIE ENTIÈRE, EN UNE DEMANDE (nº 203-§2) — le cœur d'une
    vignette enregistre (ou retire) toutes les photos du style d'un
    coup : une seule requête, une seule réponse, jamais de série à
    moitié posée parce qu'un des appels aurait échoué en route. */
export async function ecrireFavorisEnSerie(
  ids: string[],
  actif: boolean
): Promise<boolean> {
  try {
    const reponse = await fetch("/api/yokofolio/favoris/photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, actif }),
    });
    const donnees = (await reponse.json().catch(() => null)) as {
      ok?: boolean;
    } | null;
    return Boolean(donnees?.ok);
  } catch {
    return false;
  }
}
