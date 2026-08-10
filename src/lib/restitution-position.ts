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
    defilerSansGeste({ top: 0, left: 0 });
    return;
  }
  const reserve = position + window.innerHeight;
  document.documentElement.style.minHeight = `${reserve}px`;
  defilerSansGeste({ top: position, left: 0 });
  surveillerLaReserve(reserve);
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
