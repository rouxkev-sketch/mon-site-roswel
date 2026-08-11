"use client";

import { flushSync } from "react-dom";
import {
  noterLaCarteDuHaut,
  reposerEncoreLaCarteDuHaut,
  oublierLaCarteDuHaut,
} from "@/lib/carte-du-haut";

/**
 * LA BASCULE TIENT DANS UNE SEULE TÂCHE — ET NE CACHE PLUS RIEN
 * =================================================================
 * ⚠️ L'EFFACEMENT DE LA MOSAÏQUE EST SUPPRIMÉ (passe nº 166). Vu de
 * l'écran, il était pire que le mal qu'il soignait : sur smartphone la
 * mosaïque OCCUPE TOUT — l'effacer noircit la page entière, et la
 * barre, qui est un verre à 85 %, prend la couleur du noir qu'elle
 * laisse passer. Le propriétaire voyait donc « toute l'interface
 * disparaître », barre comprise, à chaque clic.
 * ET IL N'A PLUS D'OBJET : la nº 164 a supprimé LA CAUSE du saut —
 * l'état relu dans le stockage à chaque rendu, et la bascule qui
 * inversait au lieu de poser une valeur. Un clic ne produit plus qu'un
 * seul changement de hauteur ; il n'y a plus d'image intermédiaire à
 * cacher. CE QUI RESTE, ET QUI COMPTE : la note de la carte du haut,
 * le changement en UNE SEULE TÂCHE (`flushSync` — un navigateur ne
 * peint jamais au milieu d'une tâche), et la remise en place tant que
 * la hauteur du document bouge encore.
 *
 * (Ce qui suit décrit la nº 162, et reste vrai du mécanisme.)
 * =================================================================
 * (passe nº 162-§2 — SEPTIÈME passe sur ce défaut. Les six premières
 * ont corrigé des symptômes ; celle-ci s'attaque à LA COURSE.)
 *
 * CE QUE LA SONDE A PROUVÉ CHEZ LE PROPRIÉTAIRE. La barre fixe ne
 * bouge JAMAIS — même fond, même hauteur, rangée jamais repliée sur
 * les 121 images du film. C'est LA PAGE qui s'effondre :
 *
 *     t=1    scrollY 490   docH 11874
 *     t=42   scrollY  69   docH  3505      ← une seule image
 *
 * CE QUE L'ALÉATOIRE NOUS DIT. Le saut survient trois fois sur quatre
 * au changement de FORMAT, rarement au changement de TEXTE — c'est-à-
 * dire proportionnellement à l'ampleur du changement de hauteur. Et
 * une fois sur quatre, rien ne se voit. Un défaut qui dépend de la
 * charge du téléphone n'est pas un défaut de calcul : c'est UNE
 * COURSE. Plusieurs opérations s'enchaînent — le magasin change, React
 * rend, le navigateur recalcule la mise en page, on repose la page sur
 * sa carte — et si le navigateur PEINT ENTRE DEUX de ces étapes, on
 * voit l'état intermédiaire. Sinon on ne voit rien.
 *
 * ⚠️ POURQUOI LE FONDU DE LA Nº 159-§2 NE SUFFISAIT PAS. Il masquait
 * la mosaïque APRÈS le changement, dans un effet de mise en page —
 * donc APRÈS que le magasin ait notifié, et APRÈS que React ait rendu.
 * Entre le clic et cet effet, il restait une fenêtre où le navigateur
 * pouvait peindre. Cacher le symptôme n'empêche pas la course : d'où
 * l'échec une fois sur quatre.
 *
 * LA CORRECTION : TOUT SE PASSE DANS UNE SEULE TÂCHE. Un navigateur ne
 * peint JAMAIS au milieu d'une tâche JavaScript — il peint entre deux.
 * Il suffit donc que le changement de disposition ET la remise en
 * place tiennent dans la même :
 *
 *   1. LE VERROU — un attribut posé sur <html>, à la main, tout de
 *      suite. Pas un état React : un état demanderait un rendu, donc
 *      une occasion de peindre. La mosaïque disparaît par CSS avant
 *      que quoi que ce soit d'autre ne bouge (globals.css).
 *   2. LA NOTE — quelle carte occupe le haut de l'écran.
 *   3. LE CHANGEMENT, EN SYNCHRONE (`flushSync`) : React rend, place
 *      le nouveau DOM et joue ses effets de mise en page — dont la
 *      remise en place de la carte — SANS RENDRE LA MAIN au
 *      navigateur. C'est la clef : sans `flushSync`, React est libre
 *      de rendre plus tard, dans une autre tâche.
 *   4. LA STABILISATION — les images qui finissent d'arriver changent
 *      encore la hauteur du document. Tant qu'elle bouge, on repose la
 *      page sur la même carte, image par image.
 *   5. LA LEVÉE — deux images de suite sans le moindre changement de
 *      hauteur (ou le délai maximum) : la disposition est en place, la
 *      hauteur est stable, la position est juste. ALORS seulement la
 *      mosaïque revient, en fondu.
 */

/** Deux images de suite sans changement de hauteur : c'est fini. */
const IMAGES_CALMES = 2;

/** Jamais verrouillé plus longtemps que cela, quoi qu'il arrive : une
    image qui n'arrive pas ne doit pas laisser la mosaïque cachée. */
const ATTENTE_MAXI_MS = 600;

/** Le verrou en cours — une bascule chasse la précédente (le
    propriétaire enchaîne les appuis). */
let leverEnCours: number | null = null;

/**
 * LE REBOND (passe nº 164) — deux déclenchements pour un doigt.
 * ⚠️ CEINTURE ET BRETELLES. La cause des trois bascules était la
 * relecture du stockage (lib/disposition-grille), et elle est
 * corrigée à la source ; les boutons demandent en outre une valeur
 * EXPLICITE, si bien qu'un appel doublé ne peut plus se défaire
 * lui-même. Reste le cas d'un appel doublé DÉCALÉ (le clic fantôme
 * d'iOS après un toucher, un événement rejoué) : deux demandes
 * opposées à 300 ms d'intervalle feraient encore un aller-retour.
 * Aucun doigt ne bascule deux fois en un tiers de seconde : on ignore
 * la seconde.
 */
const REBOND_MS = 350;
let derniereBascule = 0;

/**
 * BASCULER SANS SAUT — `changer` est l'appel qui modifie la
 * disposition (format) ou la vue (texte des cartes). Les deux boutons
 * passent par ici.
 */
export function basculerSansSaut(changer: () => void): void {
  if (typeof document === "undefined") {
    changer();
    return;
  }
  //  LE REBOND — voir plus haut. Un second déclenchement dans le tiers
  //  de seconde qui suit n'est pas un doigt : on l'ignore.
  const maintenant = performance.now();
  if (maintenant - derniereBascule < REBOND_MS) return;
  derniereBascule = maintenant;
  if (leverEnCours !== null) cancelAnimationFrame(leverEnCours);
  /**
   * 0. LA HAUTEUR EST RÉSERVÉE AVANT LE CHANGEMENT (nº 194-§2)
   * ------------------------------------------------------------------
   * LE CONSTAT DU PROPRIÉTAIRE : sur iPhone, la barre fixe SAUTE à
   * chaque bascule ; sur son Mac, elle ne bouge pas d'un pixel.
   * LA CAUSE N'EST PAS DANS LA SUPERPOSITION, ELLE EST DANS LA HAUTEUR.
   * Passer de deux colonnes à une (ou retirer le texte des cartes)
   * change la hauteur du document d'un coup. iOS répond à un
   * raccourcissement brutal en DÉPLAÇANT SA PROPRE BARRE D'ADRESSE — et
   * tout ce qui est fixe ou collant suit ce mouvement. C'est le saut.
   * CE QU'ON FAIT : on réserve la hauteur qu'a le document AVANT le
   * changement, on applique la nouvelle disposition, et on ne relâche
   * la réserve qu'une fois la page stabilisée. Le document ne peut
   * donc pas raccourcir en cours de route — il ne peut que rester
   * aussi haut, ou grandir. Aucun raccourcissement, aucune réaction du
   * système.
   * ⚠️ SUR <html> ET NON SUR LE CORPS : React rend <body>, et tout ce
   * qu'on y écrit peut être écrasé au rendu suivant (leçon de la
   * passe 107).
   */
  const racine = document.documentElement;
  const hauteurAvant = racine.scrollHeight;
  racine.style.minHeight = `${hauteurAvant}px`;
  //  1. LA CARTE QU'ON REGARDE.
  noterLaCarteDuHaut();
  //  2. LE CHANGEMENT, RENDU ET REPOSÉ DANS LA MÊME TÂCHE.
  //     `flushSync` fait tout : rendu, mise à jour du DOM, effets de
  //     mise en page (c'est là que GrilleTatoueurs repose la carte).
  //     ⚠️ RIEN N'EST CACHÉ (nº 166) : c'est le fait de tenir dans UNE
  //     SEULE tâche qui empêche l'image intermédiaire, pas un voile.
  flushSync(changer);
  //  3. LA PAGE BOUGE-T-ELLE ENCORE ? On la repose sur sa carte tant
  //     que la hauteur n'est pas stable, puis on oublie la note.
  attendreLaStabilite(() => {
    leverEnCours = null;
    oublierLaCarteDuHaut();
    //  ET LA RÉSERVE PART, une fois la page immobile. Si le contenu
    //  réel est devenu plus haut, elle ne servait déjà plus à rien ;
    //  s'il est plus court, la page se raccourcit MAINTENANT, alors que
    //  plus rien ne bouge — et le système n'y voit pas un geste.
    racine.style.minHeight = "";
  });
}

/**
 * ATTENDRE QUE LA PAGE AIT FINI DE BOUGER. Tant que la hauteur du
 * document change (images qui arrivent, polices, mise en page tardive),
 * on remet la carte notée sous la barre — c'est cela, VERROUILLER LA
 * POSITION : pas une valeur figée, une carte qui ne bouge pas.
 */
function attendreLaStabilite(fini: () => void) {
  const depart = performance.now();
  let hauteur = document.documentElement.scrollHeight;
  let calmes = 0;
  const image = () => {
    const maintenant = document.documentElement.scrollHeight;
    if (maintenant === hauteur) {
      calmes += 1;
    } else {
      calmes = 0;
      hauteur = maintenant;
      //  La page a encore bougé : on la repose sur SA carte.
      reposerEncoreLaCarteDuHaut();
    }
    if (calmes >= IMAGES_CALMES || performance.now() - depart > ATTENTE_MAXI_MS) {
      fini();
      return;
    }
    leverEnCours = requestAnimationFrame(image);
  };
  leverEnCours = requestAnimationFrame(image);
}
