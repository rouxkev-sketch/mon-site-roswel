"use client";

import type { CritèresTatouage } from "@/components/MoteurTatouage";

/**
 * L'ÉTAT DE LA PAGE DE RECHERCHE — HORS DE REACT, ET C'EST LE SUJET
 * ==================================================================
 * LE DÉFAUT CORRIGÉ : la page s'ouvrait, puis DISPARAISSAIT AUSSITÔT
 * sur l'iPhone du propriétaire — sauf quand l'adresse portait
 * `?sonde=1`.
 *
 * Elle vivait dans un `useState` de MoteurTatouage. Or ce composant
 * est monté dans la barre du site, à l'intérieur de l'arbre du routeur
 * de Next. Si cet arbre est reconstruit — pour n'importe quelle
 * raison — le composant REMONTE, son état repart à zéro, et la page
 * se ferme sans que personne ne l'ait demandé. Aucune trace, aucun
 * événement : elle disparaît, simplement.
 *
 * ⚠️ CE N'EST PAS UNE HYPOTHÈSE. La cause première (voir
 * PageRechercheMobile, `poserLEntree`) faisait précisément
 * reconstruire cet arbre. Elle est corrigée. MAIS UN ÉTAT D'ÉCRAN NE
 * DOIT PAS DÉPENDRE DE LA SURVIE D'UN COMPOSANT : c'est ce qui a rendu
 * le défaut invisible pendant toute une passe, et impossible à
 * distinguer d'une fermeture volontaire.
 *
 * IL VIT DONC ICI, dans un module. Un module n'est évalué qu'UNE FOIS
 * par page chargée : ni un rendu, ni un remontage, ni une
 * reconstruction d'arbre ne peuvent le remettre à zéro. Les composants
 * s'y abonnent par `useSyncExternalStore` — le crochet prévu pour
 * exactement cela — et se rendent de nouveau quand il change.
 * Un rechargement de page, lui, l'efface : c'est voulu, une page
 * rechargée n'a aucune recherche en cours.
 *
 * ON Y RANGE TOUT CE QUI DOIT SURVIVRE À UN REMONTAGE :
 *  · `ouverte`     — la page est-elle à l'écran ;
 *  · `vue`         — « recherche » ou « filtres » ;
 *  · `brouillon`   — les choix en cours, tant que « Valider » n'a pas
 *                    été pressé (aucune recherche ne part avant) ;
 *  · `entreePosee` — notre étape d'historique est-elle au sommet de la
 *                    pile (elle ne doit être posée QU'UNE fois, et
 *                    dépilée qu'une fois) ;
 *  · `defilement`  — où en étaient les résultats quand on est parti.
 */

/** Les deux vues de la page de recherche (smartphone). */
export type VueRecherche = "recherche" | "filtres";

export type EtatRecherche = {
  ouverte: boolean;
  vue: VueRecherche;
  brouillon: CritèresTatouage | null;
};

/** L'état FERMÉ, en un seul exemplaire — c'est aussi la réponse du
    serveur (voir `lireEtatServeur`) : un rendu serveur n'a jamais de
    page de recherche ouverte, et il doit rendre la MÊME référence à
    chaque appel, sans quoi React boucle. */
const FERME: EtatRecherche = {
  ouverte: false,
  vue: "recherche",
  brouillon: null,
};

let etat: EtatRecherche = FERME;
const abonnes = new Set<() => void>();

/**
 * ⚠️ CES DEUX-LÀ NE SONT PAS DANS L'ÉTAT RENDU, ET C'EST VOLONTAIRE :
 * les changer ne doit RIEN redessiner. Ce sont des faits de mécanique,
 * pas de l'affichage.
 */
let entreePosee = false;
let defilementResultats = 0;

function prevenir() {
  for (const abonne of abonnes) abonne();
}

/** Abonnement pour `useSyncExternalStore`. */
export function souscrireRecherche(abonne: () => void) {
  abonnes.add(abonne);
  return () => {
    abonnes.delete(abonne);
  };
}

/** ⚠️ REND TOUJOURS LA MÊME RÉFÉRENCE tant que rien n'a changé — c'est
    la règle de `useSyncExternalStore`, et un objet reconstruit à chaque
    lecture ferait boucler React à l'infini. */
export function lireRecherche(): EtatRecherche {
  return etat;
}

/** Côté serveur, la page n'est jamais ouverte. */
export function lireRechercheServeur(): EtatRecherche {
  return FERME;
}

/** OUVRIR — toujours sur la vue « Recherche », et sur un brouillon qui
    part de la recherche en cours. */
export function ouvrirRecherche(depuis: CritèresTatouage) {
  etat = { ouverte: true, vue: "recherche", brouillon: depuis };
  prevenir();
}

/** FERMER — la page n'est plus à l'écran, le brouillon est jeté. */
export function fermerRecherche() {
  etat = FERME;
  prevenir();
}

export function poserVueRecherche(vue: VueRecherche) {
  if (etat.vue === vue) return;
  etat = { ...etat, vue };
  prevenir();
}

/** Poser des choix DANS LE BROUILLON — aucune recherche déclenchée. */
export function poserBrouillon(brouillon: CritèresTatouage) {
  etat = { ...etat, brouillon };
  prevenir();
}

/** L'ÉTAPE D'HISTORIQUE — posée une fois, dépilée une fois.
    `prendreLEntree` la « consomme » : elle rend vrai UNE SEULE FOIS,
    ce qui garantit qu'on ne dépile jamais deux fois (et donc qu'on ne
    quitte jamais le site). */
export function marquerEntreePosee() {
  entreePosee = true;
}
export function entreeDejaPosee() {
  return entreePosee;
}
export function prendreLEntree() {
  if (!entreePosee) return false;
  entreePosee = false;
  return true;
}

/** La position des résultats, mise de côté le temps de la recherche. */
export function memoriserDefilementResultats(y: number) {
  defilementResultats = y;
}
export function lireDefilementResultats() {
  return defilementResultats;
}
