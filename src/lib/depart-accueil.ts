"use client";

import { declarerDepartVouluVersLAccueil } from "@/lib/navigation-session";

/**
 * ██ nº 820 — LES DEUX SORTIES MÈNENT À L'ACCUEIL ██
 * ==================================================================
 * DEUX RELEVÉS DU PROPRIÉTAIRE, UNE SEULE CAUSE.
 *  · SE DÉCONNECTER laissait la page telle quelle (« déconnexion sans
 *    redirection forcée », nº 133) : sur « Ma sélection », on restait
 *    donc devant SES FAVORIS, affichés, alors qu'on venait de quitter
 *    son compte.
 *  · SUPPRIMER SON COMPTE partait bien vers l'accueil
 *    (`location.assign("/")`, nº 429)… et l'on atterrissait pourtant
 *    sur la page de connexion. LA CAUSE, mesurée : effacer la session
 *    réveille les gardes des pages du compte (« plus personne ici →
 *    la page de connexion », Securite et FormulaireFiche). Elles
 *    partent AVANT que le chargement de l'accueil n'ait abouti, et
 *    leur `router.replace` gagne la course.
 *
 * LA RÈGLE, DÉSORMAIS : quitter son compte — par la porte ou par la
 * suppression — mène à L'ACCUEIL, et le trajet est déclaré. Tant qu'il
 * dure, les gardes se taisent : elles ne servent qu'à raccompagner
 * quelqu'un qui n'a rien à faire là, pas à doubler un départ voulu.
 *
 * ⚠️ UN DRAPEAU DE MODULE, ET C'EST SUFFISANT : le document est en
 * train de partir (chargement complet). Il meurt avec lui, et rien ne
 * traîne d'une page à l'autre — c'est justement ce qu'on veut d'un
 * verrou de course.
 * ⚠️ CHARGEMENT COMPLET, PAS NAVIGATION DOUCE : la session vient de
 * changer ; le HTML servi doit être celui d'un visiteur (barre,
 * habillage, cache du routeur remis à zéro). C'est déjà ce que faisait
 * la suppression depuis la nº 429 — la déconnexion le fait à son tour.
 * ⚠️ LE FILET DE RÉPARATION DU REPLI N'A PAS À S'EN MÊLER : le départ
 * est déclaré (`declarerDepartVouluVersLAccueil`, nº 429), comme avant.
 */

let departEnCours = false;

/** Un départ vers l'accueil COMMENCE : les gardes des pages du compte
    ne doivent plus rediriger (l'effacement de la session va les
    réveiller, et le trajet est déjà décidé). */
export function marquerLeDepartVersLAccueil(): void {
  departEnCours = true;
}

/** Un départ est-il en cours dans ce document ? Lu par les gardes. */
export function leDepartVersLAccueilEstEnCours(): boolean {
  return departEnCours;
}

/** On part : le départ est déclaré, puis la page s'en va — vraiment. */
export function partirVersLAccueil(): void {
  marquerLeDepartVersLAccueil();
  declarerDepartVouluVersLAccueil();
  window.location.assign("/");
}
