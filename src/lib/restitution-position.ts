"use client";

import { defilerSansGeste } from "@/lib/defilement-programme";
import {
  adresseDeRecherche,
  adresseDeRechercheCourante,
} from "@/lib/adresse-recherche";
import { noter } from "@/lib/journal-bascule";
import { lireLaPlace } from "@/lib/navigation-session";
import { rendreLEtatDeRangee } from "@/lib/reserve-barre";
//  §1 (nº 337) — « on ne pose une position que sur du contenu » :
//  la règle, sa mesure et sa raison sont dans ce module-là.
import {
  ATTENTE_MAX_MS as ATTENTE_CONTENU_MS,
  contenuAtteint,
  MARQUE_ATTENTE,
} from "@/lib/pose-sur-contenu";

/**
 * LA POSITION EST POSÉE, UNE FOIS, ET C'EST TOUT
 * ==================================================================
 * REFONTE DE LA PASSE Nº 191 — une seule mécanique, plus aucune
 * poursuite concurrente.
 *
 * CE QUI A RENDU CELA POSSIBLE : l'adresse porte désormais le NOMBRE DE
 * PAGES chargées (`&page=3`), et le serveur rend toutes ces cartes d'un
 * coup. La page a donc sa hauteur définitive AVANT la première
 * peinture : il n'y a plus rien à attendre, plus rien à rattraper, plus
 * rien à poursuivre image par image.
 *
 * IL RESTE DEUX GESTES, ET DEUX SEULEMENT :
 *  1. RÉSERVER la hauteur nécessaire sur <html> (`min-height`), pour
 *     que le défilement demandé ne soit pas raboté pendant que les
 *     images se posent ;
 *  2. POSER le défilement, une fois.
 * La réserve s'efface d'elle-même dès que le contenu réel l'atteint —
 * on mesure la hauteur du CORPS, que la réserve ne concerne pas — ou au
 * bout de cinq secondes.
 *
 * ⚠️ POURQUOI SUR <html> ET PAS SUR LE CORPS : React rend <body>, et
 * tout ce qu'on y écrit avant l'hydratation devient un écart
 * d'hydratation (mesuré à la passe 107). <html>, non.
 *
 * DEUX GARDE-FOUS, HÉRITÉS DES PASSES 185 ET 186, QUI RESTENT :
 *  · une position de 0 ne déplace RIEN ;
 *  · une position n'est posée que si la clé sous laquelle elle a été
 *    rangée est encore l'adresse courante — une place appartient à une
 *    recherche, jamais à une autre.
 * Chaque pose laisse une ligne au journal de la sonde.
 */

/** Au-delà, on rend la main : le contenu ne viendra plus. */
const ATTENTE_MAX_MS = 5000;

/** La surveillance en cours, pour ne jamais en laisser traîner deux. */
let arreter: (() => void) | null = null;

/**
 * Garde la réserve tant que le contenu réel ne la remplit pas, puis
 * l'efface. Sans elle, la page rétrécirait sous les pieds de
 * l'utilisateur.
 */
function surveillerLaReserve(reserve: number) {
  arreter?.();
  const racine = document.documentElement;
  const limite = performance.now() + ATTENTE_MAX_MS;
  let image = 0;
  const liberer = () => {
    racine.style.minHeight = "";
    delete racine.dataset.positionPosee;
    arreter = null;
  };
  const surveiller = () => {
    // La hauteur NATURELLE : celle du corps, que la réserve n'atteint pas.
    if (
      document.body.getBoundingClientRect().height >= reserve ||
      performance.now() > limite
    ) {
      liberer();
      return;
    }
    image = requestAnimationFrame(surveiller);
  };
  image = requestAnimationFrame(surveiller);
  arreter = () => {
    cancelAnimationFrame(image);
    liberer();
  };
}

/**
 * POSE LA PAGE À `position`. `cle` est l'adresse canonique sous
 * laquelle cette position a été rangée : sans correspondance avec
 * l'adresse courante, on ne touche à rien.
 */
export function poserLaPosition(position: number, cle?: string) {
  const hauteur = Math.round(document.body.getBoundingClientRect().height);
  //  RIEN À RESTITUER : ON NE TOUCHE À RIEN (nº 185-b).
  if (position <= 0) {
    noter(`POSE · demandée 0 · document ${hauteur} · AUCUN DÉPLACEMENT`);
    return;
  }
  //  UNE POSITION APPARTIENT À SA RECHERCHE (nº 185-c).
  const adresse = adresseDeRechercheCourante();
  if (cle !== undefined && cle !== adresse) {
    noter(
      `POSE · demandée ${position} · document ${hauteur} · ` +
        `REFUSÉE (clé « ${cle} » ≠ adresse « ${adresse} »)`
    );
    return;
  }
  noter(`POSE · demandée ${position} · document ${hauteur} · POSÉE`);
  /**
   * §1 (nº 337) — ON ATTEND QUE LE CONTENU SOIT LÀ.
   * ------------------------------------------------------------------
   * CE QUI SE PASSAIT : la réserve de hauteur et le défilement étaient
   * posés SUR-LE-CHAMP. Sur un document qui n'a pas fini d'arriver, on
   * se retrouvait à 900 px dans un document de 1744 px entièrement
   * VIDE — c'est l'écran nu que le propriétaire voit depuis des passes,
   * et il l'a diagnostiqué lui-même. La règle vit maintenant dans
   * lib/pose-sur-contenu, avec la mesure qui l'a établie.
   * ⚠️ QUAND LE CONTENU EST DÉJÀ LÀ — le dégel d'une surface, un retour
   * de client où React n'a rien démonté — la première mesure passe et
   * l'on pose dans la foulée : rien n'est retardé.
   */
  attendreLeContenu(position, () => {
    //  ⚠️ JAMAIS UN GESTE (nº 154-§6A) : une restitution de position est
    //  posée PAR LE SITE. Sans l'annoncer, la barre y lisait un geste et
    //  repliait sa rangée de recherche à l'arrivée sur la page.
    const reserve = position + window.innerHeight;
    document.documentElement.style.minHeight = `${reserve}px`;
    defilerSansGeste({ top: position, left: 0 });
    surveillerLaReserve(reserve);
  });
}

/** L'attente en cours, pour ne jamais en laisser traîner deux. */
let attenteEnCours: (() => void) | null = null;

/**
 * ATTENDRE QUE LE CONTENU ATTEIGNE LA POSITION, PUIS POSER — dans la
 * MÊME image, avant sa peinture. Voir lib/pose-sur-contenu pour la
 * règle, la mesure qui l'a établie, et pourquoi on masque en attendant.
 */
function attendreLeContenu(position: number, poser: () => void) {
  attenteEnCours?.();
  const racine = document.documentElement;
  const limite = performance.now() + ATTENTE_CONTENU_MS;
  let image = 0;
  const demasquer = () => {
    racine.style.visibility = "";
    delete racine.dataset[MARQUE_ATTENTE];
    attenteEnCours = null;
  };
  //  LE CAS LE PLUS FRÉQUENT, ET IL NE COÛTE RIEN : le contenu est déjà
  //  là. On ne masque même pas.
  if (contenuAtteint(position)) {
    poser();
    return;
  }
  const essayer = () => {
    if (contenuAtteint(position) || performance.now() > limite) {
      poser();
      demasquer();
      return;
    }
    image = requestAnimationFrame(essayer);
  };
  //  §1 (nº 339) — L'INSTANT, et non « 1 » : la sonde du retour en a
  //  besoin pour dire depuis combien de temps l'écran est masqué.
  racine.dataset[MARQUE_ATTENTE] = String(Date.now());
  racine.style.visibility = "hidden";
  image = requestAnimationFrame(essayer);
  attenteEnCours = () => {
    cancelAnimationFrame(image);
    demasquer();
  };
}

/**
 * RENDRE LA PLACE D'UNE ADRESSE — LA SEULE PORTE DU RETOUR
 * ==================================================================
 * §1 (nº 335) — UNE PLACE, C'EST DEUX CHOSES, ET ELLES SE RENDENT
 * ENSEMBLE : la position de défilement, et l'état de la rangée de
 * recherche qui allait avec. Les rendre séparément, c'était le défaut :
 * la position revenait juste, la réserve de la barre revenait dépliée,
 * et le contenu se retrouvait un cran plus bas — puis remontait tout
 * seul quand la barre se repliait enfin. Voir lib/reserve-barre.
 *
 * ⚠️ LA RANGÉE D'ABORD, LA POSITION ENSUITE, DANS LA MÊME TÂCHE : React
 * vide sa file avant la peinture suivante, la réserve et le défilement
 * changent donc pour la MÊME image. Aucune image intermédiaire.
 *
 * DEUX APPELANTS, ET DEUX SEULEMENT : `MemoireNavigation` et
 * `DefilementEnHaut`. Toute autre restitution passerait à côté de la
 * rangée.
 */
export function rendreLaPlace(url: string) {
  const place = lireLaPlace(url);
  if (!place) {
    //  Rien à rendre : on ne touche à rien, ni à la page ni à la barre.
    poserLaPosition(0);
    return;
  }
  rendreLEtatDeRangee(place.p);
  poserLaPosition(place.y, adresseDeRecherche(url));
}

/**
 * LE SCRIPT BLOQUANT A-T-IL DÉJÀ POSÉ LA POSITION ?
 * À consulter par tout ce qui déplacerait la page au premier rendu : la
 * remontée en haut, par exemple, l'annulait sans le savoir — et la page
 * repartait de zéro alors que tout avait été fait correctement avant la
 * première peinture.
 */
export function positionDejaPosee(): boolean {
  return Boolean(document.documentElement.dataset.positionPosee);
}

/**
 * REPREND LA RÉSERVE POSÉE PAR LE SCRIPT BLOQUANT (au chargement du
 * document). Rend la position qu'il a posée, ou 0 s'il n'a rien fait.
 * Le script laisse un filet de sécurité de son côté : si React ne
 * démarre jamais, la réserve part quand même.
 */
export function reprendreLaReserveDuScript(): number {
  const pose = document.documentElement.dataset.positionPosee;
  if (!pose) return 0;
  const position = Number(pose) || 0;
  if (position > 0) surveillerLaReserve(position + window.innerHeight);
  return position;
}
