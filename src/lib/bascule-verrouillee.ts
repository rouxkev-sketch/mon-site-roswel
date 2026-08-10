"use client";

import { flushSync } from "react-dom";
import {
  noterLaCarteDuHaut,
  reposerEncoreLaCarteDuHaut,
  oublierLaCarteDuHaut,
} from "@/lib/carte-du-haut";

/**
 * LE VERROU DE BASCULE — RIEN N'EST PEINT PENDANT LA RECOMPOSITION
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

/** L'attribut du verrou, sur <html> — `data-bascule`. */
const MARQUEUR = "bascule";

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

/** Vrai pendant qu'une bascule est verrouillée (la sonde le lit). */
export function basculeVerrouillee(): boolean {
  return typeof document !== "undefined"
    ? Boolean(document.documentElement.dataset[MARQUEUR])
    : false;
}

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
  const racine = document.documentElement;
  //  1. LE VERROU, AVANT TOUT LE RESTE.
  racine.dataset[MARQUEUR] = "1";
  if (leverEnCours !== null) cancelAnimationFrame(leverEnCours);
  //  2. LA CARTE QU'ON REGARDE.
  noterLaCarteDuHaut();
  //  3. LE CHANGEMENT, RENDU ET REPOSÉ DANS LA MÊME TÂCHE.
  //     `flushSync` fait tout : rendu, mise à jour du DOM, effets de
  //     mise en page (c'est là que GrilleTatoueurs repose la carte).
  flushSync(changer);
  //  4 et 5. LA STABILISATION, PUIS LA LEVÉE.
  attendreLaStabilite(() => {
    leverEnCours = null;
    oublierLaCarteDuHaut();
    delete racine.dataset[MARQUEUR];
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
