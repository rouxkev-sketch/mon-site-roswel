"use client";

import { sans } from "@/lib/interrupteurs-mesure";
import { defilerSansGeste } from "@/lib/defilement-programme";

/**
 * LA POSITION EST POSÉE, PAS RATTRAPÉE
 * =====================================
 * LE DÉFAUT CORRIGÉ : en enchaînant des retours en avant, on atterrissait
 * tantôt en haut, tantôt en pied de page, tantôt ailleurs. Pas une
 * position fausse : une position ALÉATOIRE.
 *
 * LA CAUSE. La passe précédente restituait APRÈS COUP : elle reposait le
 * défilement à chaque image pendant deux secondes et demie, en espérant
 * que la page finisse par être assez haute, et elle LÂCHAIT au premier
 * geste. Trois hasards en même temps —
 *  · à quel moment les photos donnent sa hauteur à la page,
 *  · si la fenêtre de deux secondes et demie expire avant ou après,
 *  · si le doigt qui a lancé le retour compte comme un geste
 *    d'abandon (au balayage depuis le bord, il compte).
 * Trois hasards, trois résultats différents pour la même séquence.
 *
 * LA MÉCANIQUE RETENUE : ON N'ATTEND PLUS QUE LA PAGE GRANDISSE, ON
 * L'EMPÊCHE D'ÊTRE TROP COURTE.
 * Pour poser le défilement à `y`, il faut que le document mesure au
 * moins `y + la hauteur de l'écran`. On RÉSERVE donc cette hauteur sur
 * <html> — une seule ligne, avant même que le contenu n'existe — puis on
 * pose le défilement. Il n'y a plus rien à raboter, plus rien à
 * réessayer, plus de geste à guetter : le résultat est le même à tous
 * les coups.
 *
 * PUIS LA RÉSERVE S'EFFACE TOUTE SEULE, dès que le contenu réel atteint
 * la même hauteur. On la mesure sans elle : le CORPS n'est pas concerné
 * par la réserve (sa hauteur minimale est en pourcentage, et <html> n'a
 * pas de hauteur fixe — le pourcentage ne s'applique donc pas), sa boîte
 * donne la hauteur NATURELLE de la page. Quand elle suffit, la réserve
 * part sans que rien ne bouge d'un pixel.
 *
 * ⚠️ POURQUOI SUR <html> ET PAS SUR LE CORPS : React rend <body>, et
 * tout ce qu'on y écrit avant l'hydratation devient un écart
 * d'hydratation (mesuré à la passe 107). <html>, non.
 *
 * ⚠️ ET « INSTANT » : le site déclare un défilement doux global. Sans
 * cela, la page GLISSE jusqu'à sa position au lieu de s'y poser.
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
  /**
   * ⚠️ INTERRUPTEUR DE MESURE (`&sans=reserve`), TEMPORAIRE.
   * La surveillance lit la géométrie du corps À CHAQUE IMAGE tant que la
   * page n'est pas assez haute. En temps normal elle s'arrête à la
   * première — mais si quelque chose la fait tourner pendant tout un
   * geste de retour, c'est une lecture de mise en page forcée par image.
   * Éteinte, la réserve se libère du premier coup.
   */
  if (sans("reserve")) {
    requestAnimationFrame(() => {
      racine.style.minHeight = "";
      delete racine.dataset.positionPosee;
      arreter = null;
    });
    return;
  }
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
 * POSE LA PAGE À `position`, TOUT DE SUITE, et garantit qu'elle y reste.
 * Pour les retours qui ne créent pas de document (le routeur de Next
 * rend la page cible sur place) : c'est l'équivalent, en cours de route,
 * de ce que le script bloquant fait au chargement.
 */
export function poserLaPosition(position: number) {
  //  ⚠️ JAMAIS UN GESTE (nº 154-§6A) : une restitution de position est
  //  posée PAR LE SITE. Sans l'annoncer, la barre y lisait un geste et
  //  repliait sa rangée de recherche à l'arrivée sur la page.
  if (position <= 0) {
    arreter?.();
    arreterLaPoursuite();
    defilerSansGeste({ top: 0, left: 0 });
    return;
  }
  const reserve = position + window.innerHeight;
  document.documentElement.style.minHeight = `${reserve}px`;
  defilerSansGeste({ top: position, left: 0 });
  surveillerLaReserve(reserve);
  poursuivreLaPosition(position);
}

/* ==================================================================
 * ON NE POSE LA POSITION QUE LORSQU'ELLE EST ATTEIGNABLE
 * (passe nº 181-§1b)
 * ==================================================================
 * LE RELEVÉ DU PROPRIÉTAIRE, sur son iPhone :
 *
 *     RETOUR demandée 4964 · arrivée 0
 *     RETOUR 1re image · atteinte 0 · écart −4964 · document 3717
 *     RETOUR +2500 ms  · atteinte 0 · écart −4964 · document 3717
 *
 * On demandait 4964 px sur un document de 3717 : impossible. Le
 * navigateur rabote alors la demande — et l'on atterrit en haut.
 *
 * LA RÉSERVE DE HAUTEUR (ci-dessus) est faite pour ça, mais elle ne
 * suffit pas toujours : elle s'efface dès que le CONTENU RÉEL atteint
 * la hauteur voulue, ou au bout de cinq secondes — et si la mosaïque
 * restituée est plus courte qu'à l'aller, le contenu ne l'atteindra
 * jamais. Au moment où la réserve part, le navigateur ramène la page
 * dans ses bornes… c'est-à-dire tout en haut.
 *
 * CE QUE FAIT CETTE POURSUITE :
 *  · elle REPOSE la position tant que la page ne s'y trouve pas, image
 *    par image — la mosaïque grandit (photos, « Voir plus » restitué),
 *    et chaque image rapproche du but ;
 *  · elle S'ARRÊTE dès que la position est atteinte ;
 *  · à L'EXPIRATION du délai, elle pose LA POSITION LA PLUS BASSE
 *    ATTEIGNABLE (hauteur du document − hauteur de l'écran) au lieu de
 *    laisser la page en haut. Le bas de la mosaïque vaut mieux que son
 *    sommet quand on revient d'une fiche prise tout en bas.
 */

/** À deux pixels près, on considère qu'on y est. */
const TOLERANCE_PX = 2;

/** La poursuite en cours — une seule à la fois, jamais deux. */
let poursuite: (() => void) | null = null;

function arreterLaPoursuite() {
  poursuite?.();
  poursuite = null;
}

function poursuivreLaPosition(position: number) {
  arreterLaPoursuite();
  const limite = performance.now() + ATTENTE_MAX_MS;
  let image = 0;
  //  ⚠️ LE DOIGT A TOUJOURS RAISON : au premier vrai geste, la
  //  poursuite s'arrête net. On ne se bat jamais contre la personne —
  //  c'est la leçon des versions qui « rattrapaient » la position.
  const gestes = ["wheel", "touchstart", "keydown"] as const;
  const finir = () => {
    cancelAnimationFrame(image);
    for (const geste of gestes) {
      window.removeEventListener(geste, finir);
    }
    poursuite = null;
  };
  for (const geste of gestes) {
    window.addEventListener(geste, finir, { passive: true, once: true });
  }
  const suivre = () => {
    if (Math.abs(window.scrollY - position) <= TOLERANCE_PX) {
      finir();
      return;
    }
    if (performance.now() > limite) {
      //  LE PLUS BAS ATTEIGNABLE, plutôt que le haut de la page.
      const atteignable = Math.max(
        0,
        Math.round(
          document.documentElement.scrollHeight - window.innerHeight
        )
      );
      defilerSansGeste({ top: Math.min(position, atteignable), left: 0 });
      finir();
      return;
    }
    //  La page a grandi (ou rétréci) : on redemande la même position.
    defilerSansGeste({ top: position, left: 0 });
    image = requestAnimationFrame(suivre);
  };
  image = requestAnimationFrame(suivre);
  poursuite = finir;
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
