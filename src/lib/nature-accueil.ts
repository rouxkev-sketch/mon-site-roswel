import { useSyncExternalStore } from "react";
import {
  NATURE_PAR_DEFAUT,
  natureConnue,
  type SlugNature,
} from "@/lib/photos-tatoueur";

/**
 * ██ §1 ET §4 (nº 857) — LA NATURE QUE L'ACCUEIL DU DOIGT MONTRE ██
 * ==================================================================
 * Le va-et-vient de la barre (VaEtVientNature) et la page (IndexTatoueurs)
 * doivent lire LE MÊME MOT — « tatouage » ou « flash » — sans être
 * voisins dans l'arbre : l'un vit dans la barre fixe, l'autre dans le
 * corps. C'est le motif de `lib/recherche-mobile` (le magasin partagé,
 * `useSyncExternalStore`), repris tel quel, en plus petit.
 *
 * ⚠️ L'ACCUEIL EST PRÉRENDU (nº 357) : le serveur ne connaît jamais le
 * choix du visiteur, il rend TOUJOURS la position « tattoo »
 * (`lireNatureAccueilServeur`). Le navigateur relit ensuite sa mémoire
 * de session et, si elle dit « flash », redessine — après l'hydratation,
 * jamais pendant : aucun écart d'hydratation possible, c'est la règle
 * même de `useSyncExternalStore`.
 * ⚠️ MÉMOIRE DE SESSION, PAS D'ADRESSE : « /?nature=flash » existe déjà
 * et veut dire autre chose — la MOSAÏQUE de tous les flashs, servie par
 * le jumeau. La position du va-et-vient n'est pas une recherche ; elle
 * survit à un aller-retour vers un profil (la session), et meurt avec
 * l'onglet du navigateur — comme le brouillon de la page de recherche.
 * ⚠️ AU WEB, PERSONNE NE L'ÉCRIT : le va-et-vient n'y est pas rendu, la
 * page y reste « tattoo ». Le web ne change pas (consigne nº 857).
 */
const CLE = "yokofolio:nature-accueil";

let nature: SlugNature = NATURE_PAR_DEFAUT;
/** La mémoire de session n'est lue qu'UNE fois, à la première demande
    côté navigateur — jamais au serveur, où elle n'existe pas. */
let memoireLue = false;
const abonnes = new Set<() => void>();

function lireLaMemoire(): SlugNature {
  try {
    return natureConnue(window.sessionStorage.getItem(CLE)) as SlugNature;
  } catch {
    return NATURE_PAR_DEFAUT;
  }
}

/** ⚠️ REND TOUJOURS LA MÊME VALEUR tant que rien n'a changé — la règle
    de `useSyncExternalStore`. La première lecture au navigateur relit la
    session, les suivantes rendent le mot retenu. */
export function lireNatureAccueil(): SlugNature {
  if (!memoireLue && typeof window !== "undefined") {
    nature = lireLaMemoire();
    memoireLue = true;
  }
  return nature;
}

/** Côté serveur — et pendant l'hydratation — l'accueil est toujours
    « tattoo » : c'est ce que le prérendu a écrit. */
export function lireNatureAccueilServeur(): SlugNature {
  return NATURE_PAR_DEFAUT;
}

/**
 * ██ §3 (nº 859) — CHAQUE NATURE GARDE SA PROPRE POSITION DE PAGE ██
 * ------------------------------------------------------------------
 * DEMANDE DU PROPRIÉTAIRE : « les défilements Tattoo et Flash sont
 * INDÉPENDANTS ». Basculer vers Flash ne doit pas hériter de la
 * position où l'on avait laissé Tattoo, et le retour doit rendre
 * celle-ci.
 * COMMENT, ET POURQUOI ICI : la bascule est le SEUL moment où l'on
 * quitte une nature — c'est donc le seul endroit qui sache quoi
 * retenir, et quoi rendre. Rien n'est posé au montage de la page :
 * l'arrivée sur l'accueil, le retour depuis un profil et la mémoire de
 * position du site (MemoireNavigation) ne sont pas touchés.
 * ⚠️ DEUX IMAGES D'ATTENTE avant de rendre la position, et il les faut :
 * la grille de l'autre nature n'existe pas encore quand on repose le
 * mot — la page serait trop courte, et le navigateur bornerait notre
 * demande. C'est l'écriture du site pour ce cas (`rendreLEtatDeRangee`,
 * lib/reserve-barre).
 * ⚠️ MÉMOIRE DE MODULE, pas de session : une position n'a de sens que
 * dans la page où on l'a laissée. Un rechargement rend la nature (la
 * session la retient) mais repart du haut, comme n'importe quelle page.
 */
const positions: Record<SlugNature, number> = { tatouage: 0, flash: 0 };

export function poserNatureAccueil(voulue: SlugNature): void {
  const actuelle = lireNatureAccueil();
  if (voulue === actuelle) return;
  if (typeof window !== "undefined") positions[actuelle] = window.scrollY;
  nature = voulue;
  try {
    window.sessionStorage.setItem(CLE, voulue);
  } catch {
    /*  Session inaccessible (navigation privée stricte) : le choix vaut
        pour cette page, et c'est tout. */
  }
  for (const abonne of abonnes) abonne();
  if (typeof window === "undefined") return;
  const rendue = positions[voulue];
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, rendue);
    });
  });
}

/** La position retenue pour une nature — lue par le banc, qui vérifie
    que les deux défilements ne se mélangent pas. */
export function positionDeLaNature(nature: SlugNature): number {
  return positions[nature];
}

export function souscrireNatureAccueil(abonne: () => void): () => void {
  abonnes.add(abonne);
  return () => {
    abonnes.delete(abonne);
  };
}

/** La nature affichée, telle que les deux consommateurs la lisent. */
export function useNatureAccueil(): SlugNature {
  return useSyncExternalStore(
    souscrireNatureAccueil,
    lireNatureAccueil,
    lireNatureAccueilServeur
  );
}
