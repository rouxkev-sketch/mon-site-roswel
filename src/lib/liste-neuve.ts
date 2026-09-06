"use client";

import { defilerSansGeste } from "@/lib/defilement-programme";
import { laPositionDuGelRepartDeZero } from "@/lib/gel-du-corps";

/**
 * UNE LISTE NEUVE COMMENCE EN HAUT — L'ÉCRITURE UNIQUE
 * ==================================================================
 * (passe nº 330 §1-§2, RAMENÉE À SON OS À LA nº 889)
 *
 * C'est le POINT 3 de la règle de navigation (lib/navigation-session) :
 * un écran NEUF s'ouvre en haut. Une liste qu'on vient de filtrer est
 * un écran neuf — on ne l'a jamais parcourue, il n'y a donc aucune
 * place à y retrouver.
 *
 * ██ CE QUI A DISPARU À LA nº 889, ET POURQUOI ██
 * ------------------------------------------------------------------
 * Ce module portait CINQ gestes, et quatre d'entre eux servaient une
 * mécanique qui n'existe plus : oublier une demande de restitution
 * (nº 431), effacer la position mémorisée de la liste qui arrive
 * (nº 332), tuer une restitution en vol (nº 424), et surtout METTRE LA
 * REMONTÉE EN ATTENTE quand la liste neuve était AILLEURS — la
 * remontée jouée à l'arrivée (nº 334) puis, depuis les squelettes, au
 * squelette (nº 722).
 *
 * Cette attente-là n'a plus d'objet : quand la liste est ailleurs, on
 * NAVIGUE, et c'est le routeur qui pose le haut de la nouvelle page —
 * une fois, par son propre chemin (voir `scroll-padding-top` dans
 * globals.css et docs/DEFILEMENT-889-INVENTAIRE.md). Le site n'a plus
 * à guetter l'arrivée de quoi que ce soit.
 *
 * ██ CE QUI RESTE, ET QUI N'EST PAS DÉLÉGABLE ██
 * ------------------------------------------------------------------
 * LE FILTRE SUR PLACE. Un filtre écrit son adresse par `replaceState`
 * (les critères changent, la page non) : le routeur ne fait AUCUN
 * défilement dans ce cas — il n'y a pas de navigation. C'est donc
 * encore au geste de remonter, et c'est le seul cas.
 *
 * ⚠️ `defilerSansGeste`, ET JAMAIS `window.scrollTo` : la barre du site
 * surveille le défilement pour replier sa rangée de recherche, et elle
 * lirait un mouvement non annoncé comme un GESTE de l'utilisateur (la
 * leçon de la nº 154-§6A).
 *
 * ⚠️ ELLE EST APPELÉE PAR LE GESTE, JAMAIS DÉDUITE DE L'ADRESSE. C'est
 * une exigence du propriétaire (nº 330) : un RETOUR arrive lui aussi
 * avec une requête dans l'adresse, et lui doit garder sa position.
 */
export function ouvrirLaListeEnHaut(
  /** L'adresse de la liste QUI VA S'AFFICHER, quand elle n'est pas
      encore l'adresse courante (une recherche appelle avant de
      naviguer). Omise : l'adresse courante — c'est déjà la bonne pour
      un filtre, qui a écrit la sienne juste avant.
      ⚠️ ELLE RESTE DANS LA SIGNATURE bien qu'on n'en fasse plus qu'une
      comparaison : c'est elle qui distingue le filtre (ici même) de la
      recherche (ailleurs), et les appelants la passent déjà. */
  adresseDeLaListe?: string
): void {
  if (typeof window === "undefined") return;
  const ici = window.location.pathname + window.location.search;
  const cible = adresseDeLaListe ?? ici;
  //  §3 (nº 330) — LE GEL REPART DE ZÉRO. Sans cela, le panneau du bas
  //  qui se referme repose l'ancienne position par-dessus tout le
  //  reste — le défaut relevé par le propriétaire à la nº 330.
  laPositionDuGelRepartDeZero();
  if (cible !== ici) return;
  //  LA LISTE NEUVE EST ICI MÊME (un filtre : l'adresse a été écrite
  //  par `replaceState`, la page ne change pas). On remonte tout de
  //  suite — c'est ce que le propriétaire a validé à la nº 330-§1.
  defilerSansGeste({ top: 0, left: 0 }, "fresh list, right here (filter)");
}
