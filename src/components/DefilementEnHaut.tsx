"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { arriveeQuiRestitue } from "@/lib/navigation-session";
import { positionDejaPosee } from "@/lib/restitution-position";

/**
 * CHAQUE NAVIGATION OUVRE LA PAGE TOUT EN HAUT
 * =============================================
 * Sans ce composant, les pages s'ouvraient LÉGÈREMENT DESCENDUES.
 * La cause : le site déclare un défilement doux global
 * (`html { scroll-behavior: smooth }`, posé pour les ancres du site
 * vitrine). La remontée automatique de Next devient alors une
 * ANIMATION — et cette animation est interrompue par le premier rendu
 * de la nouvelle page, qui la fige à quelques pixels du haut.
 *
 * Ici : à chaque changement d'adresse, un repositionnement IMMÉDIAT
 * (`behavior: "instant"` passe outre le défilement doux). Rien à
 * animer, rien à interrompre.
 *
 * EXCEPTION : le retour/avant du NAVIGATEUR (popstate). Là, c'est la
 * position mémorisée qui doit revenir — c'est ce qu'attend quiconque
 * appuie sur « précédent », et c'est MemoireNavigation qui s'en
 * charge. On ne force donc le haut que sur les navigations par lien.
 *
 * AUTRE EXCEPTION : la FENÊTRE DE FICHE (FenetreFiche). Elle change
 * l'adresse (pushState vers /tatoueur/…) SANS quitter la grille — la
 * grille doit rester exactement où elle est derrière le voile. La
 * fenêtre pose `data-fenetre-fiche` sur <html> tant qu'elle vit.
 *
 * ⚠️ ET TOUS LES RETOURS ARRIÈRE NE CHANGENT PAS D'ADRESSE. La page de
 * recherche du smartphone pose son étape SUR l'adresse courante : la
 * refermer produit un `popstate` sans changement de chemin. L'effet
 * ci-dessous ne se rejouant qu'au changement de chemin, le drapeau
 * serait resté armé et aurait mangé la remontée de la navigation
 * SUIVANTE. On retient donc l'adresse visée, et le drapeau ne compte
 * que si c'est bien elle qu'on affiche.
 *
 * Posé une seule fois, dans la mise en page du groupe (tatouage) :
 * il couvre toutes les pages de yokofolio, et n'affiche rien.
 *
 * ⚠️ LA REMONTÉE SE FAIT AVANT LA PEINTURE (passe nº 143-§5), et c'est
 * la seule façon de garantir qu'aucune image ne montre la page
 * ailleurs qu'en haut. Avec un `useEffect` ordinaire, la correction
 * arrive APRÈS le premier affichage de la nouvelle page : le navigateur
 * a le droit de peindre une image intermédiaire, et c'est exactement ce
 * qui se voit comme « la page s'ouvre légèrement décalée ». Un effet de
 * mise en page (`useLayoutEffect`) s'exécute entre la pose du DOM et la
 * peinture — il n'y a plus d'intervalle où quoi que ce soit puisse
 * s'afficher de travers.
 */

/** useLayoutEffect côté navigateur, useEffect côté serveur (silencieux) */
const useEffetAvantPeinture =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function DefilementEnHaut() {
  const chemin = usePathname();
  // Vrai uniquement entre un retour/avant du navigateur et le rendu
  // de la page cible.
  const retourNavigateur = useRef(false);
  /** L'adresse rejointe par ce retour (voir l'avertissement ci-dessus). */
  const adresseRetour = useRef("");
  /** Faux dès la fin du tout premier rendu de ce document. */
  const premierRendu = useRef(true);

  useEffect(() => {
    const marquer = () => {
      retourNavigateur.current = true;
      adresseRetour.current = location.pathname + location.search;
    };
    window.addEventListener("popstate", marquer);
    return () => window.removeEventListener("popstate", marquer);
  }, []);

  useEffetAvantPeinture(() => {
    /**
     * ⚠️ UNE PAGE DE DÉTAIL EST TOUJOURS EN HAUT — RETOUR COMME AVANCE
     * (nº 193-§2).
     * LE CONSTAT : en AVANÇANT sur une fiche, on arrivait « tout en
     * bas, à un endroit où l'on n'a jamais été ». C'est le défilement
     * de la LISTE qui reste en place : le site a coupé la restauration
     * du navigateur, la page de fiche est plus courte, et le navigateur
     * rabote la position à son bas. Une traversée ne dispensait pas de
     * remonter — elle le faisait, et c'était le trou.
     * ⚠️ APRÈS la fenêtre de fiche (le web ouvre la fiche PAR-DESSUS la
     * mosaïque : là, il ne faut toucher à rien).
     */
    if (
      chemin.startsWith("/tatoueur/") &&
      !document.documentElement.dataset.fenetreFiche
    ) {
      retourNavigateur.current = false;
      adresseRetour.current = "";
      premierRendu.current = false;
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return;
    }

    const versLAdresseDuRetour =
      retourNavigateur.current &&
      adresseRetour.current === chemin + window.location.search;
    retourNavigateur.current = false;
    adresseRetour.current = "";
    if (versLAdresseDuRetour) return;
    // ⚠️ ET LA MÊME RÈGLE QUE LA MÉMOIRE DE NAVIGATION, sans quoi les
    // deux se contredisent. Un document NÉ d'un retour, d'une avance ou
    // d'un rechargement (réouverture du navigateur comprise) n'a pas
    // connu de `popstate` : le drapeau ci-dessus est faux, et on
    // remontait la page en haut juste avant que la mémoire ne la
    // repose. On s'efface donc devant elle.
    const premiereFois = premierRendu.current;
    premierRendu.current = false;
    // ⚠️ ET SURTOUT : si le script bloquant a DÉJÀ posé la position
    // avant la première peinture (reprise de session comprise, où le
    // type de navigation est pourtant « navigate » — c'est un
    // `location.replace`), remonter en haut ici ANNULERAIT tout le
    // travail fait au bon moment. Mesuré : la page repartait à zéro.
    if (premiereFois && (arriveeQuiRestitue() || positionDejaPosee())) return;
    // La fenêtre de fiche est ouverte (ou vient de changer l'adresse) :
    // la grille reste où elle est.
    if (document.documentElement.dataset.fenetreFiche) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [chemin]);

  return null;
}
