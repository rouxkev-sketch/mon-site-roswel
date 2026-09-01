"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  arriveeEnHautVoulue,
  arriveeQuiRestitue,
  restaurationDemandeePour,
} from "@/lib/navigation-session";
import { rendreLaPlace, positionDejaPosee } from "@/lib/restitution-position";
//  §1 (nº 661) — la garde de position : le mécanisme du site qui TIENT
//  une pose tant qu'aucun geste ne reprend la main (nº 427/626).
import { armerLaGardeDePosition } from "@/lib/defilement-programme";
import { souscrireAdresse } from "@/lib/adresse-courante";
//  §1 (nº 653) — le chemin de la recherche, écrit une seule fois
//  (nº 652), et le journal des sondes.
import { estLaMosaique } from "@/lib/chemin-recherche";
//  §1 (nº 654) — la boîte noire : les mêmes décisions, écrites AUSSI
//  dans la trace permanente. `noter` ne parle que sonde armée ;
//  `noterNavigation` parle toujours. Aucune décision ne change.

/**
 * ██ §1 (nº 653) — L'ACCUEIL ET LA RECHERCHE SONT UN MÊME ÉCRAN ██
 * ==================================================================
 * CE QUE LA nº 652 A CHANGÉ SOUS CE COMPOSANT. Jusque-là, lancer une
 * recherche depuis l'accueil ne changeait PAS le chemin (« / » avec une
 * requête en plus) : l'effet ci-dessous ne rejouait pas, et rien ne
 * remontait la page. Depuis que la recherche a son adresse, le chemin
 * change — et la remontée automatique s'est mise à jouer, dans les deux
 * sens, sur un mouvement qui n'est pas un changement d'écran.
 * LA RÈGLE DU PROPRIÉTAIRE : entre ces deux adresses-là, ON NE REMONTE
 * PAS. La restitution de position garde la priorité — c'est elle qui
 * sait où l'œil était, et elle passe après cette remontée-ci (voir le
 * §3 de la nº 328, plus bas).
 * ⚠️ LA DÉFINITION A DÉMÉNAGÉ (nº 732) : `estLaMosaique` vit dans
 * lib/chemin-recherche, à côté du chemin qu'elle nomme — la lecture
 * gelée de la mosaïque (lib/adresse-courante) la lit aussi désormais,
 * et un écran ne se définit qu'une fois. Rien d'autre ne change : ce
 * composant la consomme exactement comme avant.
 */

/**
 * ██ nº 361 — LA REMONTÉE ATTEND QUE L'ADRESSE SOIT COMMISE ██
 * ==================================================================
 * L'ÉCRAN NOIR DU GLISSEMENT RETOUR, ET SA MÉCANIQUE. Pendant le
 * geste, le navigateur ne montre pas la page : il montre la PHOTO
 * D'ADIEU qu'il a prise de la page qu'on quittait. WebKit (le moteur
 * des trois navigateurs de l'iPhone) prend cette photo AU MOMENT OÙ
 * L'ENTRÉE D'HISTORIQUE CHANGE — donc au `pushState` du routeur. Or
 * chez nous (mesure nº 336), le routeur rend la nouvelle page AVANT
 * de commettre l'adresse : la remontée instantanée de ce composant
 * partait donc AVANT la photo. Sur un accueil DÉFILÉ, ce saut à zéro
 * pointe l'écran vers une zone que le moteur n'a jamais rasterisée
 * (il ne garde de tuiles qu'autour de la position courante) : l'écran
 * montre alors le FOND — notre anthracite — et c'est LUI que la photo
 * fige. Le geste rejouait ensuite cette photo noire. Sans défilement,
 * le saut ne bouge rien : la photo est bonne — exactement la variable
 * du propriétaire, sur les trois navigateurs.
 *
 * LA CORRECTION : quand l'adresse n'est pas encore commise, la
 * remontée ATTEND l'écriture d'adresse (`souscrireAdresse` — l'
 * événement part DANS le `pushState`, donc dans la même tâche, avant
 * toute peinture : l'exigence nº 143-§5 « aucune image ailleurs qu'en
 * haut » reste tenue). La photo est alors prise sur l'accueil ENCORE
 * INTACT, à sa vraie position, et le saut part juste après elle.
 * ⚠️ LA POSITION NE COMPTE QUE SI L'ADRESSE EST LA BONNE : un autre
 * événement (un nettoyage d'adresse, un retour pendant le battement)
 * ne remonte rien — et le filet d'une image (rAF) retire l'écoute si
 * l'adresse ne vient jamais.
 * ⚠️ ADRESSE DÉJÀ COMMISE (rechargement, routeur en avance) : la
 * remontée part tout de suite, exactement comme avant cette passe.
 */
function remonterALAdresseCommise(
  chemin: string,
  /**
   * ██ §1 (nº 661) — LE HAUT EST-IL GARANTI, OU SEULEMENT POSÉ ? ██
   * ------------------------------------------------------------------
   * LE DÉFAUT MESURÉ (boîte noire du propriétaire, 27-08 12:42) : la
   * remontée joue à l'instant de la navigation, sur un document ENCORE
   * COURT — 788 px depuis « Ma sélection » vide. Vingt-sept
   * millisecondes plus tard, le contenu de l'accueil arrive, le
   * document passe à 1790, et la page se retrouve à 1002 px SANS
   * qu'aucun mécanisme du site n'ait signé de pose : c'est le
   * navigateur qui recale (restauration native de l'entrée
   * d'historique, ou ancrage). Poser le haut ne suffit pas ; il faut
   * le TENIR le temps que le contenu arrive.
   * QUAND ON LE GARANTIT : quand l'arrivée en haut a été DÉCLARÉE
   * (nº 429 + nº 446) — c'est-à-dire sur un geste qui va EN AVANT, et
   * jamais sur un retour. La distinction reste posée par le geste,
   * jamais déduite de l'adresse (la règle du propriétaire, nº 330).
   * AVEC QUOI : la GARDE DE POSITION (lib/defilement-programme,
   * nº 427/626) — le mécanisme du site dont c'est déjà tout le
   * travail : « après une pose du site, la position TIENT tant que
   * l'utilisateur n'a pas repris la main ». Elle se lève au premier
   * geste, meurt si l'adresse change, et cède au bout de douze
   * recalages. Rien n'est inventé ici.
   */
  garantirLeHaut: boolean
): (() => void) | undefined {
  const remonter = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    //  §1 (nº 661) — LA GARDE EST ARMÉE ICI, ET PAS AVANT : à cet
    //  instant l'adresse est commise (c'est toute la raison d'être de
    //  cette fonction), donc la garde retient la BONNE page. Armée
    //  plus tôt, elle aurait retenu celle qu'on quitte et serait morte
    //  au changement d'adresse.
    if (garantirLeHaut) {
      armerLaGardeDePosition(0, "arrivée en haut voulue (nº 446)");
    }
  };
  if (window.location.pathname === chemin) {
    remonter();
    return undefined;
  }
  let retirer: () => void = () => {};
  let fait = false;
  const desAConfirmation = () => {
    if (fait || window.location.pathname !== chemin) return;
    fait = true;
    retirer();
    remonter();
  };
  const desabonner = souscrireAdresse(desAConfirmation);
  //  LE FILET : deux images au plus, puis tout est retiré — aucune
  //  écoute ne survit à son battement. (Adresse jamais commise —
  //  navigation abandonnée : on ne remonte rien, la garde d'adresse
  //  protège la page où l'on est resté.)
  let secondeImage = 0;
  const premiereImage = requestAnimationFrame(() => {
    desAConfirmation();
    secondeImage = requestAnimationFrame(() => {
      desAConfirmation();
      retirer();
    });
  });
  retirer = () => {
    desabonner();
    cancelAnimationFrame(premiereImage);
    cancelAnimationFrame(secondeImage);
  };
  return retirer;
}

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
  /** §1 (nº 653) — le chemin d'où l'on vient. `null` au tout premier
      rendu : on arrive alors de l'extérieur, et la règle ci-dessus ne
      s'applique pas. */
  const cheminPrecedent = useRef<string | null>(null);
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
    /*  §1 (nº 653) — LE CHEMIN D'OÙ L'ON VIENT, RELEVÉ AVANT TOUTE
        DÉCISION ET SANS AUCUNE CONDITION. Il doit être noté même quand
        les branches ci-dessous rendent la main plus tôt (une fiche, un
        retour) : un relevé qui saute un tour désignerait l'avant-
        dernier écran, et la règle de l'accueil-recherche se tromperait
        de mouvement. */
    const venaitDeLaMosaique = cheminPrecedent.current;
    cheminPrecedent.current = chemin;
    /**
     * §3 (nº 328) — C-2 : LE CHEMIN DÉCIDE, ET LA DÉCISION EST PRISE
     * ICI, AVANT LA PEINTURE.
     * ==================================================================
     * CE QUI ÉTAIT ÉCRIT, ET LE DÉFAUT QU'IL CAUSAIT. Cette branche
     * remontait la page en haut sur TOUTE adresse `/tatoueur/`, SANS
     * CONDITION — « une page de détail est toujours en haut » (nº 193-
     * §2). Depuis la nº 230-§3, ce n'est plus vrai : une fiche ouverte
     * DEPUIS UNE FICHE écrit sa position, et le retour doit la rendre.
     * Les deux règles se contredisaient à un rendu d'intervalle : cette
     * remontée-ci s'exécute AVANT la peinture, la restitution de
     * `MemoireNavigation` APRÈS. La page s'affichait donc en haut, PUIS
     * sautait à sa place. C'est le « parfois ça remonte, parfois non »
     * du propriétaire, et c'est le point 3 de la règle qui tranche.
     *
     * LA RÈGLE : un écran NEUF s'ouvre en haut, un écran où l'on
     * REVIENT se pose là où on l'a quitté — le CHEMIN décide.
     *
     * COMMENT ON RECONNAÎT UN RETOUR, SANS RIEN CONSOMMER. Trois
     * signaux, tous LUS et jamais mangés — c'est essentiel :
     * `MemoireNavigation` doit pouvoir consommer les siens un instant
     * plus tard, et deux consommateurs pour un jeton, c'est une
     * restitution perdue sur deux.
     *  · le popstate de ce document, avec l'adresse qu'il visait ;
     *  · une demande NOMMÉE pour cette adresse
     *    (`restaurationDemandeePour`, lecture non destructive ajoutée
     *    à cette passe) ;
     *  · un document né d'un retour, d'une avance ou d'un rechargement
     *    (`arriveeQuiRestitue`, mémoïsé, non destructif).
     *
     * ET LA POSITION EST POSÉE ICI, PAS PLUS TARD — c'est l'exigence
     * (b) du §3 : `useLayoutEffect` s'exécute ENTRE la pose du DOM et
     * la peinture. Aucune image n'est peinte avec la page au mauvais
     * endroit, donc aucun saut. `MemoireNavigation` repose la même
     * valeur après ; poser deux fois la même position ne déplace rien
     * — c'est un filet, pas un second mouvement.
     *
     * ⚠️ APRÈS la fenêtre de fiche (le web ouvre la fiche PAR-DESSUS la
     * mosaïque : là, il ne faut toucher à rien).
     */
    if (
      chemin.startsWith("/tatoueur/") &&
      !document.documentElement.dataset.fenetreFiche
    ) {
      const url = chemin + window.location.search;
      const revient =
        (retourNavigateur.current && adresseRetour.current === url) ||
        restaurationDemandeePour(url) ||
        (premierRendu.current && arriveeQuiRestitue());
      retourNavigateur.current = false;
      adresseRetour.current = "";
      premierRendu.current = false;
      //  §1 (nº 446) — UNE SORTIE CONFIRMÉE ARRIVE EN HAUT, même quand
      //  son véhicule est une traversée d'historique (le go(-2) de la
      //  garde de saisie) : la déclaration l'emporte sur les signaux
      //  de retour. Lecture NON destructive — MemoireNavigation, le
      //  dernier de la chaîne, consomme.
      if (revient && !arriveeEnHautVoulue()) {
        //  ON REVIENT : la place est rendue AVANT la peinture. Rien à
        //  rendre (une fiche ouverte depuis une liste n'en a jamais
        //  écrit) : `poserLaPosition` ne bouge rien, et la page reste
        //  où le navigateur l'a mise — c'est-à-dire en haut.
        if (!positionDejaPosee()) {
          //  §1 (nº 335) — la position ET l'état de la rangée, ensemble.
          rendreLaPlace(url);
        }
        return;
      }
      //  nº 361 — après la photo d'adieu du navigateur (voir l'en-tête).
      //  §1 (nº 661) — une fiche s'ouvre en haut par nature (nº 191) :
      //  aucune déclaration n'est en jeu, aucune garde à armer.
      return remonterALAdresseCommise(chemin, false);
    }

    if (estLaMosaique(venaitDeLaMosaique) && estLaMosaique(chemin)) {
      return;
    }

    const versLAdresseDuRetour =
      retourNavigateur.current &&
      adresseRetour.current === chemin + window.location.search;
    retourNavigateur.current = false;
    adresseRetour.current = "";
    //  §1 (nº 446) — même règle que la branche des fiches : une sortie
    //  confirmée (déclarée) arrive en haut, traversée d'historique ou
    //  pas. C'est LA branche du symptôme — le go(-2) de la garde de
    //  saisie atterrit sur l'accueil par un popstate, et sans la
    //  déclaration on s'effaçait ici devant la restitution.
    if (versLAdresseDuRetour && !arriveeEnHautVoulue()) {
      //  §1 (nº 653) — la sonde doit pouvoir distinguer « je me suis
      //  effacé » de « je n'ai pas joué ». Sans cette ligne, l'absence
      //  de remontée ne se lit nulle part.
      return;
    }
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
    if (premiereFois && (arriveeQuiRestitue() || positionDejaPosee())) {
      //  §1 (nº 653) — même raison : on dit pourquoi on ne remonte pas.
      return;
    }
    // La fenêtre de fiche est ouverte (ou vient de changer l'adresse) :
    // la grille reste où elle est.
    if (document.documentElement.dataset.fenetreFiche) return;
    //  §1 (nº 653) — LA REMONTÉE, ÉCRITE ELLE AUSSI : c'est la ligne
    //  qui doit MANQUER quand on passe de l'accueil à la recherche.
    /*  §1 (nº 661) — LA DÉCLARATION EST LUE, PAS CONSOMMÉE. C'est la
        règle de la chaîne depuis la nº 446 : ce composant LIT,
        `MemoireNavigation` — dernier de la chaîne — CONSOMME. Deux
        consommateurs pour un jeton, ce serait une garantie perdue sur
        deux. */
    const voulue = arriveeEnHautVoulue();
    //  nº 361 — après la photo d'adieu du navigateur (voir l'en-tête).
    return remonterALAdresseCommise(chemin, voulue);
  }, [chemin]);

  return null;
}
