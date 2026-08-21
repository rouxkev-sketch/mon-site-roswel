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
 *  · `vue`         — l'onglet affiché, « tatouage » ou « flash »
 *                    (§1, nº 447 : Réalisation | Flash) ;
 *  · `brouillons`  — les choix en cours DE CHAQUE ONGLET, tant que
 *                    « Valider » n'a pas été pressé (aucune recherche
 *                    ne part avant) ;
 *  · `defilement`  — où en étaient les résultats quand on est parti.
 */

/**
 * ██ §1 (nº 447) — LES DEUX ONGLETS « RÉALISATION | FLASH » ██
 * ------------------------------------------------------------------
 * L'ancien va-et-vient « Explorer | Filtres » séparait les CHAMPS des
 * FILTRES ; le propriétaire le remplace par deux onglets DE NATURE —
 * Réalisation et Flash — qui portent chacun la même page complète
 * (style, localité, rayon, Technique, Rendu) et CHACUN SES PROPRES
 * critères. Les clés sont les natures du catalogue
 * (CATEGORIES_EXPLORER : « tatouage », « flash ») — aucune liste
 * inventée. « Valider » cherche l'onglet en cours, nature comprise ;
 * « Effacer » ne vide que lui. Le type garde son nom (VueRecherche) :
 * une vue EST un onglet désormais, et les deux consommateurs
 * (PageRechercheMobile, MoteurTatouage) lisent ce même mot.
 */
export type VueRecherche = "tatouage" | "flash";

export type EtatRecherche = {
  ouverte: boolean;
  /** L'onglet affiché — la NATURE qu'il cherche. */
  vue: VueRecherche;
  /** §1 (nº 447) — UN BROUILLON PAR ONGLET : chacun garde ses choix
      (style, lieu/rayon, filtres) tant que la page vit. `null` =
      onglet jamais touché — le moteur y lit une page vierge. */
  brouillons: Record<VueRecherche, CritèresTatouage | null>;
};

/** L'état FERMÉ, en un seul exemplaire — c'est aussi la réponse du
    serveur (voir `lireEtatServeur`) : un rendu serveur n'a jamais de
    page de recherche ouverte, et il doit rendre la MÊME référence à
    chaque appel, sans quoi React boucle. */
const FERME: EtatRecherche = {
  ouverte: false,
  vue: "tatouage",
  brouillons: { tatouage: null, flash: null },
};

let etat: EtatRecherche = FERME;
const abonnes = new Set<() => void>();

/**
 * ⚠️ CELUI-LÀ N'EST PAS DANS L'ÉTAT RENDU, ET C'EST VOLONTAIRE : le
 * changer ne doit RIEN redessiner. C'est un fait de mécanique, pas de
 * l'affichage.
 * (Le drapeau `entreePosee` a disparu avec l'étape d'historique de la
 * page de recherche — nº 194-§4 : elle n'en pose plus aucune.)
 */
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

/** OUVRIR — sur l'onglet de la NATURE en cours (Flash si la recherche
    active cherche des flashs, Réalisation sinon), son brouillon
    ensemencé par la recherche en cours ; l'autre onglet part vierge
    (§1, nº 447). */
export function ouvrirRecherche(depuis: CritèresTatouage) {
  const onglet: VueRecherche = depuis.nature === "flash" ? "flash" : "tatouage";
  etat = {
    ouverte: true,
    vue: onglet,
    brouillons: { tatouage: null, flash: null, [onglet]: depuis },
  };
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

/** Poser des choix DANS LE BROUILLON DE L'ONGLET AFFICHÉ — aucune
    recherche déclenchée, et jamais un mot dans l'autre onglet
    (§1, nº 447). */
export function poserBrouillon(brouillon: CritèresTatouage) {
  etat = {
    ...etat,
    brouillons: { ...etat.brouillons, [etat.vue]: brouillon },
  };
  prevenir();
}

/** La position des résultats, mise de côté le temps de la recherche. */
export function memoriserDefilementResultats(y: number) {
  defilementResultats = y;
}
export function lireDefilementResultats() {
  return defilementResultats;
}
