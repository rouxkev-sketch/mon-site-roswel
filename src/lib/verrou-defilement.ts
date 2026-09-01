"use client";

/**
 * ██ §1 (nº 469) — LE VERROU DE DÉFILEMENT DU CORPS, COMPTÉ ██
 * ==================================================================
 * LE BUG QU'IL FERME (relevé du propriétaire, au doigt) : ouvrir
 * « Mon compte » (une page plein écran depuis la nº 465), ouvrir
 * « Langue » ou « Notifications » PAR-DESSUS, refermer — puis toucher
 * n'importe quelle entrée : LE SITE NE DÉFILE PLUS.
 *
 * LA CAUSE, NOMMÉE : quatre surfaces posaient `overflow: hidden` sur
 * le corps avec le même motif « sauver la valeur d'avant, la rendre à
 * la fermeture » — chacune pour soi, SANS compteur (MenuEspace,
 * FenetreLangue, FenetreNotifications, FenetreModale). Ce motif ne
 * survit pas à l'EMPILEMENT de la nº 465 : quand deux surfaces sont
 * ouvertes, « la valeur d'avant » que l'une capture est le `hidden`
 * posé par l'autre. Le chemin exact du relevé : l'effet de MenuEspace
 * rejoue quand `langueOuverte` change (les dépendances de la garde
 * d'Échap, nº 465) — dans ce commit, TOUS les nettoyages passent
 * d'abord (le sien rend « », celui de la fenêtre fermée rend
 * « hidden »), PUIS son re-run relit le corps : il sauve « hidden »
 * comme valeur d'origine. À la fermeture de « Mon compte » — croix,
 * retour, ou un lien (« Sécurité », « Modification ») — le nettoyage
 * restitue fidèlement ce « hidden » : le verrou reste posé pour
 * toujours, plus rien ne défile.
 *
 * LA RÈGLE, celle du propriétaire : AVEC DES SURFACES EMPILÉES, IL
 * FAUT UN COMPTEUR — la DERNIÈRE surface fermée retire le verrou, pas
 * la première. Ce module est l'écriture unique : qui couvre l'écran
 * POSE en s'ouvrant, RETIRE en se fermant (le nettoyage d'effet couvre
 * TOUS les chemins — croix, retour du téléphone, Échap, glissement,
 * choix d'option, et la navigation qui démonte la surface : le
 * nettoyage tourne aussi là) ; le corps n'est verrouillé que tant que
 * le compte est au-dessus de zéro. Un lien NATIF (document neuf) ne
 * peut rien laisser traîner : le style du corps meurt avec le
 * document.
 *
 * ⚠️ CE N'EST PAS LE GEL DU CORPS (lib/gel-du-corps) : le gel fige en
 * `position: fixed` pour les fenêtres de fiche et garde la position —
 * un autre mécanisme, un autre usage, il ne bouge pas.
 * ⚠️ AUCUNE SAUVEGARDE DE VALEUR : le corps du site ne porte JAMAIS
 * d'`overflow` en ligne hors de ce verrou — rendre « » rend la feuille
 * de style, c'est-à-dire l'état normal. C'est précisément la
 * sauvegarde qui fabriquait le bug.
 */

let compte = 0;

/** À l'ouverture d'une surface qui couvre l'écran. */
export function poserLeVerrouDeDefilement(): void {
  if (typeof document === "undefined") return;
  compte += 1;
  if (compte === 1) document.body.style.overflow = "hidden";
}

/** À la fermeture — le nettoyage d'effet de la surface, quel que soit
    le chemin qui l'a fermée. Le corps ne redéfile qu'au DERNIER. */
export function retirerLeVerrouDeDefilement(): void {
  if (typeof document === "undefined") return;
  if (compte === 0) {
    return;
  }
  compte -= 1;
  if (compte === 0) document.body.style.overflow = "";
}
