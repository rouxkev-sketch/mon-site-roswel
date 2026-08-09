"use client";

import { useEffect, useRef } from "react";
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
 */
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

  useEffect(() => {
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
