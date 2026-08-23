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


/* ================================================================
 * LE GESTE EN ATTENTE — pour qui n'est pas connecté
 * ================================================================ */

const CLE_ATTENTE = "yokofolio-geste-en-attente";

export type GesteEnAttente = { genre: Genre; id: string };

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
export function reprendreLeGeste(genre: Genre, id: string): boolean {
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
/**
 * ██ §5 (nº 397) — L'ONGLET EST DEMANDÉ, JAMAIS DEVINÉ ██
 * ------------------------------------------------------------------
 * La page de compte porte DEUX onglets — créer, se connecter — et
 * choisissait le sien d'après un drapeau « ce navigateur a déjà connu
 * un compte » (cookie de la nº 203-§1a). Sur un ordinateur PARTAGÉ,
 * c'est présumer qui est devant l'écran : le propriétaire l'interdit.
 * Le bouton cliqué le dit désormais LUI-MÊME, dans l'adresse, et ce
 * choix l'emporte sur tout le reste (voir EcranAuthentification).
 * ⚠️ LE CHEMIN DE RETOUR NE BOUGE PAS D'UN CARACTÈRE : `suite` reste
 * le premier paramètre, écrit comme avant. Le mode s'ajoute derrière,
 * il ne remplace rien — l'inscription comme la connexion ramènent donc
 * toujours à la page qu'on regardait.
 * ⚠️ SANS ARGUMENT, L'ADRESSE EST EXACTEMENT CELLE D'AVANT : aucun
 * appelant existant ne change de comportement.
 */
export function versLaConnexion(mode?: "creer" | "connexion"): string {
  const ici = `${window.location.pathname}${window.location.search}`;
  const suite = `suite=${encodeURIComponent(ici)}`;
  return `/devenir-tatoueur?${suite}${mode ? `&mode=${mode}` : ""}`;
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
 * ██ §2 (nº 506) — « SAIT-ON CE QUE CETTE PERSONNE A ENREGISTRÉ ? » ██
 * ==================================================================
 * LE DÉFAUT QU'IL FERME : les boutons peignaient « Suivre » AVANT que
 * la liste des favoris n'arrive, puis basculaient sur « Suivi ». Un
 * état de compte FAUX, peint le temps d'un aller-retour réseau —
 * exactement ce que la règle 203 interdit.
 * CE DRAPEAU DIT LA VÉRITÉ SUR LA CONNAISSANCE, pas sur les données :
 * faux tant que la réponse n'est pas revenue, vrai ensuite — MÊME SI
 * ELLE A ÉCHOUÉ. Une liste injoignable est une réponse : on sait alors
 * qu'on ne saura pas, et un bouton muet pour toujours serait pire
 * qu'un bouton éteint.
 * ⚠️ IL NE RÉPOND QUE POUR UN COMPTE CONNECTÉ : sans session,
 * `chargerLesMiens` n'est jamais appelé (ChargeurFavoris ne demande
 * rien), et ce drapeau resterait faux À JAMAIS. C'est à l'APPELANT de
 * composer — « prêt ET (pas de compte OU liste arrivée) » —, et c'est
 * ce que fait `BoutonSuivre`. Le dire ici évite qu'on l'oublie
 * ailleurs.
 */
let listeConnue = false;

const ecouteursConnue = new Set<() => void>();

function sAbonnerConnue(rappel: () => void) {
  ecouteursConnue.add(rappel);
  return () => {
    ecouteursConnue.delete(rappel);
  };
}

function poserListeConnue() {
  if (listeConnue) return;
  listeConnue = true;
  ecouteursConnue.forEach((rappel) => rappel());
}

/** VRAI dès que la liste des favoris du compte a répondu — quelle que
    soit sa réponse. Voir la note ci-dessus : sans compte, il reste
    faux, et c'est à l'appelant d'en tenir compte. */
export function useListeFavorisConnue(): boolean {
  return useSyncExternalStore(
    sAbonnerConnue,
    () => listeConnue,
    () => false
  );
}

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
    })
    //  §2 (nº 506) — DANS LES DEUX CAS, ON SAIT : la réponse est
    //  arrivée, ou elle ne viendra pas. Les boutons peuvent parler.
    .finally(poserListeConnue);
}

/** Une déconnexion vide l'ardoise : les cœurs du visiteur suivant ne
    doivent rien porter du compte précédent. */
export function oublierLesMiens() {
  chargementLance = false;
  //  §2 (nº 506) — on ne sait plus rien du compte suivant.
  listeConnue = false;
  ecouteursConnue.forEach((rappel) => rappel());
  etats.photo.clear();
  etats.tatoueur.clear();
  prevenir();
}

/* ================================================================
 * ÉCRIRE EN BASE — une seule porte pour les deux genres
 * ================================================================ */

/*  §3 (nº 302) — `ecrireFavorisPhotos` EST SUPPRIMÉE, code compris.
    Elle écrivait TOUTE UNE GALERIE d'un geste (nº 208-§6) : « aimer une
    photo du carrousel, c'est aimer le carrousel ». Le propriétaire
    annule cette règle — un cœur ne met en favori QUE la photo cliquée.
    Il ne reste donc qu'une porte, `ecrireFavori`, et plus aucun chemin
    ne peut réintroduire l'ancien comportement par mégarde. */

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
