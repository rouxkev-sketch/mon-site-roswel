"use client";

import { useSyncExternalStore } from "react";
//  §1 (nº 693) — le délai de garde des lectures du navigateur,
//  écrit une seule fois (voir lib/lecture-navigateur).
import { lireDuServeur } from "@/lib/lecture-navigateur";

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

/**
 * ██ §1 (nº 683) — LA DEMANDE NE PART PLUS TOUTE SEULE ██
 * ==================================================================
 * CE QU'ELLE FAISAIT, ET CE QUE ÇA COÛTAIT. Elle était déclenchée par
 * `sAbonner`, c'est-à-dire par le PREMIER RENDU du moteur de
 * recherche — et le moteur vit dans l'en-tête de TOUTES les pages du
 * produit. Le balayage nº 681 l'a relevée sur les TRENTE mesures de
 * page, mentions légales, contact et « nouveau mot de passe »
 * compris : ~255 ms de requête sur des écrans qui n'affichent aucune
 * création, et c'est cette queue qui tenait toute page publique
 * au-dessus de 540 ms quand son premier écran était à ~150.
 *
 * ⚠️ CE QUE CES NOMBRES SERVENT, ET IL FAUT LE DIRE PARCE QUE ÇA
 * CHANGE LA RÉPONSE : ils ne garnissent RIEN sur la page. Leur seul
 * porteur est le menu « Explorer » (MoteurTatouage), en face de chaque
 * style. Aucune page ne les montre — pas même l'accueil.
 *
 * D'OÙ DEUX DÉCLENCHEURS EXPLICITES, ET PLUS AUCUN DÉCLENCHEMENT
 * AUTOMATIQUE :
 *  · LA MOSAÏQUE (`IndexTatoueurs`) les demande à son montage. Elle
 *    n'est montée que par `RenduAccueil` — donc « / » et
 *    « /search », les deux pages bâties autour du menu des styles.
 *    Sur celles-là RIEN NE CHANGE : les nombres sont là avant qu'on
 *    ouvre le menu, exactement comme avant ;
 *  · LE MENU LUI-MÊME, à son ouverture. C'est le filet : sur une page
 *    sans mosaïque, ouvrir « Explorer » déclenche la demande, et le
 *    menu se remplit — un peu plus tard qu'avant, jamais jamais.
 *
 * ⚠️ ET LE MENU SUPPORTE DÉJÀ L'ATTENTE PAR CONSTRUCTION : tant que
 * rien n'est arrivé, `comptesConnus` rend faux et AUCUN nombre n'est
 * écrit (voir plus bas). Ce n'est pas une tolérance qu'on ajoute ici,
 * c'est celle de la nº 216 — la même qui couvre déjà une base
 * injoignable.
 */
export function demanderLesComptes(): void {
  demander();
}

/** La demande — lancée UNE fois par chargement de page. */
function demander() {
  if (demandeLancee || typeof window === "undefined") return;
  demandeLancee = true;
  lireDuServeur("/api/yokofolio/creations-par-style")
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

/*  ⚠️ S'ABONNER NE DEMANDE PLUS RIEN (§1 nº 683). C'est ici que la
    requête partait, et c'est tout le défaut : s'abonner, c'est se
    rendre — or le moteur se rend sur chaque page du site. Lire les
    nombres et les DEMANDER sont deux gestes distincts, désormais. */
function sAbonner(prevenir: () => void) {
  abonnes.add(prevenir);
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
