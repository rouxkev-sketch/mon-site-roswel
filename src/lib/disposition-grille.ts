/**
 * LA DISPOSITION DE LA MOSAÏQUE (smartphone) — deux colonnes ou une
 * ==================================================================
 * Le bouton rond de la barre fixe bascule la grille entre :
 *  - « deux » : deux colonnes façon Instagram (le défaut, toujours) ;
 *  - « une »  : une image par ligne, bord à bord, textes agrandis.
 *
 * Seuls les VRAIS MOBILES voient le bouton : sur un ordinateur, la
 * valeur reste « deux » pour toujours.
 *
 * ⚠️ LE CHOIX VIT DANS L'ADRESSE (nº 203-§1b) — « ?disposition=une »,
 * rien pour le défaut. C'est la règle de la nº 191 : L'ADRESSE DÉCIDE
 * DE TOUT. Le stockage local, lui, n'était lisible que par le
 * navigateur : le serveur rendait la disposition PAR DÉFAUT, et la
 * page se corrigeait sous les yeux après l'hydratation — c'est le saut
 * que le propriétaire voyait en revenant à l'accueil. Désormais :
 *  · LE SERVEUR lit le paramètre (page.tsx) et rend la bonne
 *    disposition du premier coup — plus rien à corriger après coup ;
 *  · LA BASCULE écrit la mémoire du module (l'écran répond tout de
 *    suite, sous le verrou de lib/bascule-verrouillee) ET l'adresse
 *    (history.replaceState — pas d'étape d'historique : changer
 *    d'affichage n'est pas une navigation) ;
 *  · LE RETOUR (popstate) relit l'adresse de l'étape retrouvée ;
 *  · LA CLÉ DE POSITION contient le paramètre d'elle-même (tout ce qui
 *    n'est pas un réglage de sonde compte comme un critère, voir
 *    lib/adresse-recherche) : une position prise en une colonne ne
 *    s'applique jamais à la page en deux colonnes.
 * Cliquer le logo ramène à l'adresse nue — donc au défaut : c'est le
 * même contrat que les critères de recherche, et c'est voulu.
 *
 * LA VALEUR VIT EN MÉMOIRE ENTRE DEUX LECTURES (acquis de la nº 164) :
 * `getSnapshot` rend la variable du module, stable et insensible à
 * tout aléa — l'adresse n'est relue qu'aux moments où elle a pu
 * changer (première lecture, popstate, remise au pas par l'accueil).
 */

import { mecanismeCoupe } from "@/lib/variantes-essai";
import {
  cleDeSurface,
  surfaceCourante,
  type SurfaceAffichage,
} from "@/lib/surface-affichage";

const EVENEMENT = "yokofolio-disposition-grille-changee";

/** Le paramètre d'adresse — écrit seulement quand il diffère du défaut. */
export const PARAMETRE_DISPOSITION = "disposition";

/**
 * LE FILET DE LA VISITE (nº 212-§3)
 * ==================================
 * ⚠️ POURQUOI L'ADRESSE SEULE NE SUFFISAIT PAS. La bascule écrit
 * l'adresse par `history.replaceState` — sans navigation, donc sans
 * nouveau rendu (c'est tout l'intérêt : la mosaïque ne se recharge
 * pas). Mais Next garde en cache le rendu qu'il a servi POUR L'ADRESSE
 * D'ORIGINE : au retour depuis une fiche, il restitue ce rendu-là, où
 * `affichage.disposition` vaut encore le défaut — et la disposition
 * choisie était perdue.
 * LE FILET : la préférence est aussi rangée dans le stockage de
 * session. Au retour, si l'adresse ne dit rien, on la repose ET on la
 * réécrit dans l'adresse. L'ADRESSE RESTE LA SOURCE quand elle parle —
 * c'est elle qui fait rendre le bon HTML au premier coup (nº 203-§1b) ;
 * le filet ne sert qu'à survivre au cache du routeur.
 */
const CLE_SESSION = "yokofolio-disposition-visite";

//  §1 (nº 263) — LE FILET N'EST PLUS UNIQUE : une clé par surface
//  (`cleDeSurface`, la même écriture que le cookie du texte). Choisir
//  la pleine largeur sur la recherche n'écrit plus dans la mémoire de
//  « Ma sélection », ni l'inverse.
function memoriser(voulue: DispositionGrille) {
  try {
    sessionStorage.setItem(cleDeSurface(CLE_SESSION, surfaceCourante()), voulue);
  } catch {
    // Stockage refusé : la préférence vivra le temps de la page.
  }
}

function memorisee(surface: SurfaceAffichage): DispositionGrille | null {
  try {
    const lue = sessionStorage.getItem(cleDeSurface(CLE_SESSION, surface));
    return lue === "une" || lue === "deux" ? lue : null;
  } catch {
    return null;
  }
}

/**
 * REMETTRE L'AFFICHAGE AU PAS APRÈS UNE NAVIGATION — l'adresse d'abord,
 * la préférence de la visite à défaut. Appelée par l'accueil à chaque
 * rendu servi (voir IndexTatoueurs).
 */
export function reprendreDisposition() {
  const surface = surfaceCourante();
  const dansLAdresse = new URLSearchParams(window.location.search).has(
    PARAMETRE_DISPOSITION
  );
  if (dansLAdresse) {
    //  L'adresse parle : elle a toujours raison.
    const voulue = depuisLAdresse();
    valeurs[surface] = voulue;
    memoriser(voulue);
    window.dispatchEvent(new Event(EVENEMENT));
    return;
  }
  const retenue = memorisee(surface);
  //  Rien dans l'adresse, rien en mémoire : le défaut, et c'est juste.
  if (!retenue || retenue === "deux") {
    valeurs[surface] = "deux";
    window.dispatchEvent(new Event(EVENEMENT));
    return;
  }
  //  La visite avait choisi : on repose, et on réécrit l'adresse.
  valeurs[surface] = "deux";
  poserDisposition(retenue);
}

export type DispositionGrille = "deux" | "une";

/** LA source de vérité entre deux relectures de l'adresse.
    §1 (nº 263) — UNE PAR SURFACE : le module survit aux navigations du
    routeur, et une valeur unique portait la pleine largeur choisie sur
    la recherche jusqu'à « Ma sélection » — le suivi relevé par le
    propriétaire. */
const valeurs: Record<SurfaceAffichage, DispositionGrille | null> = {
  recherche: null,
  selection: null,
};

/** La lecture de l'adresse — le défaut sans paramètre. */
function depuisLAdresse(): DispositionGrille {
  try {
    return new URLSearchParams(window.location.search).get(
      PARAMETRE_DISPOSITION
    ) === "une"
      ? "une"
      : "deux";
  } catch {
    return "deux";
  }
}

/** Écrit (ou efface) le paramètre dans l'adresse COURANTE — un
    remplacement, jamais une étape : changer d'affichage n'est pas une
    navigation. */
function ecrireDansLAdresse(voulue: DispositionGrille) {
  try {
    const parametres = new URLSearchParams(window.location.search);
    if (voulue === "une") parametres.set(PARAMETRE_DISPOSITION, "une");
    else parametres.delete(PARAMETRE_DISPOSITION);
    const requete = parametres.toString();
    if (!mecanismeCoupe("nettoyages")) {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + (requete ? `?${requete}` : "") + window.location.hash
      );
    }
  } catch {
    // Adresse inaccessible : la bascule vivra le temps de la page.
  }
}

/** La disposition en cours — celle de l'adresse.
    §1 (nº 263) — DE LA SURFACE DEMANDÉE (la page en cours par défaut).
    L'adresse n'appartient qu'à la page qui la porte : pour une surface
    étrangère (la barre qui bâtit une adresse de recherche depuis
    « Ma sélection »), c'est son filet de session qui parle. */
export function lireDisposition(
  surface: SurfaceAffichage = surfaceCourante()
): DispositionGrille {
  if (valeurs[surface] === null) {
    valeurs[surface] =
      surface === surfaceCourante()
        ? depuisLAdresse()
        : (memorisee(surface) ?? "deux");
  }
  return valeurs[surface];
}

/**
 * POSER LA DISPOSITION VOULUE — et prévenir les abonnés.
 * ⚠️ UNE VALEUR EXPLICITE, PAS UNE INVERSION (nº 164) : demander « je
 * veux DEUX colonnes » est idempotent — deux fois la même demande ne
 * font qu'un seul changement, et rien du tout si l'on y est déjà.
 */
export function poserDisposition(voulue: DispositionGrille) {
  if (lireDisposition() === voulue) return;
  //  Toujours SUR LA SURFACE EN COURS : une bascule agit là où elle
  //  vit (nº 263-§1).
  valeurs[surfaceCourante()] = voulue;
  ecrireDansLAdresse(voulue);
  memoriser(voulue);
  window.dispatchEvent(new Event(EVENEMENT));
}

/** Bascule et prévient tous les abonnés (grille, cartes, bouton). */
export function basculerDisposition() {
  poserDisposition(lireDisposition() === "une" ? "deux" : "une");
}

/** Abonnement pour `useSyncExternalStore`. Le RETOUR (popstate) est le
    seul moment où l'adresse a raison contre la mémoire : on relit
    ALORS, et alors seulement. */
export function souscrireDisposition(rappel: () => void) {
  const auRetour = () => {
    valeurs[surfaceCourante()] = depuisLAdresse();
    rappel();
  };
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener("popstate", auRetour);
  return () => {
    window.removeEventListener(EVENEMENT, rappel);
    window.removeEventListener("popstate", auRetour);
  };
}
