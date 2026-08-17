"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  arriveeQuiRestitue,
  consommerRestaurationPosition,
  demanderRestaurationPosition,
  oublierRestaurationPosition,
  lireDefilement,
  marquerHydratation,
  memoriserDefilement,
  noterPageOnglet,
  noterPageVisitee,
  purgerDefilementsAnciens,
  signalerTraversee,
} from "@/lib/navigation-session";
//  §2 (nº 328) — LA POSITION SE LIT SOUS LE GEL, JAMAIS BRUTE.
//  C'est le point 4 de la règle de navigation (lib/navigation-session).
import { positionSousLeGel } from "@/lib/gel-du-corps";
import { adresseDeRecherche } from "@/lib/adresse-recherche";
import {
  poserLaPosition,
  reprendreLaReserveDuScript,
} from "@/lib/restitution-position";
import {
  lireRequeteCourante,
  lireRequeteServeur,
  souscrireAdresse,
} from "@/lib/adresse-courante";

/**
 * MÉMOIRE DE NAVIGATION (posée une seule fois dans le layout)
 * -----------------------------------------------------------
 * 1. Tient le journal des pages visitées (bouton retour de la
 *    fiche : lib/navigation-session) — persistant, il ne s'efface
 *    pas avec l'inactivité.
 * 2. Reprend en main la restauration du défilement lors d'un
 *    retour arrière. Laissée au navigateur, elle s'applique
 *    IMMÉDIATEMENT — pendant que l'ancienne page est encore à
 *    l'écran — d'où un sursaut de quelques pixels avant
 *    l'affichage de la page cible. Ici : position mémorisée en
 *    continu, puis réappliquée seulement APRÈS l'affichage de la
 *    page cible (la transition reste parfaitement immobile).
 * N'affiche rien.
 */
/*  ⚠️ L'ABONNEMENT A CHANGÉ (passe nº 154) — il ne suffisait pas.
    Il ne portait QUE sur `popstate`, l'événement des retours arrière.
    Une RECHERCHE, elle, change l'adresse par `router.replace('/?…')`,
    donc par `history.replaceState` : aucun `popstate`, aucune
    notification, et ce magasin rendait éternellement l'ancienne
    requête. L'effet plus bas ne se rejouait donc jamais après une
    recherche, et LA PAGE DE RÉSULTATS N'ÉTAIT JAMAIS INSCRITE AU
    JOURNAL — d'où un « retour » qui ramenait à l'accueil nu, ou pire,
    à la page d'avant (« Ma sélection », « Créer mon portfolio »).
    `souscrireAdresse` surveille les deux portes : le navigateur ET le
    code. Voir lib/adresse-courante. */

/** Une page de DÉTAIL — une fiche. Elle s'ouvre toujours en haut. */
function estUnePageDeDetail(chemin: string): boolean {
  return chemin.startsWith("/tatoueur/");
}

export function MemoireNavigation() {
  const pathname = usePathname();
  /**
   * ⚠️ LES CRITÈRES AUSSI, ET C'ÉTAIT UN TROU.
   * L'effet de restitution ne se rejouait qu'au changement de CHEMIN.
   * Or deux pages du site peuvent ne différer que par leurs critères :
   * `/?style=realisme` et `/?style=minimaliste` ont le même chemin. Un
   * retour de l'une à l'autre ne restituait donc rien — et c'est le
   * trajet d'une recherche à la précédente, l'un des plus fréquents.
   *
   * ⚠️ ET SURTOUT PAS AVEC `useSearchParams` : ESSAYÉ, MESURÉ, ÉCARTÉ.
   * Ce crochet exige une frontière `Suspense`, et la frontière change
   * tout : pendant la transition du routeur, le composant peut être
   * suspendu — ses RÉFÉRENCES sont alors perdues, dont le drapeau de
   * retour posé au `popstate`. Mesuré : plus aucun retour interne ne
   * restituait quoi que ce soit.
   * On lit donc l'adresse là où elle est vraie — dans le navigateur —
   * et on s'abonne au seul événement qui nous intéresse : le retour ou
   * l'avance. Aucune frontière, aucune suspension, aucune référence
   * perdue.
   */
  const requete = useSyncExternalStore(
    souscrireAdresse,
    lireRequeteCourante,
    lireRequeteServeur
  );
  // Vrai uniquement entre un retour/avant (popstate) et le rendu
  // de la page cible
  const traversee = useRef(false);
  /**
   * L'ADRESSE VISÉE PAR CE RETOUR ARRIÈRE.
   * ⚠️ TOUS LES `popstate` NE CHANGENT PAS D'ADRESSE. La page de
   * recherche du smartphone pose son étape d'historique SUR L'ADRESSE
   * COURANTE (voir PageRechercheMobile) : la refermer produit un
   * `popstate` qui ne bouge ni le chemin ni la requête. L'effet
   * ci-dessous, lui, ne se rejoue qu'au CHANGEMENT de chemin — le
   * drapeau restait donc armé, et c'est la navigation SUIVANTE (une
   * fiche, par exemple) qui héritait d'une restauration de position
   * qu'on ne lui avait pas demandée.
   * On note donc l'adresse au moment du retour : la restauration
   * n'a lieu que si c'est bien CELLE-LÀ que l'on affiche ensuite.
   */
  const adresseTraversee = useRef("");
  /**
   * ⚠️ ET L'INSTANT DU RETOUR, PARCE QUE L'EFFET PEUT SE REJOUER DEUX
   * FOIS. Le chemin et les critères viennent de DEUX contextes
   * différents du routeur, et ils ne se mettent pas toujours à jour
   * dans le même rendu. L'effet tournait donc une première fois avec
   * l'ancienne adresse — il consommait le drapeau sans rien restituer —
   * puis une seconde fois avec la bonne, mais les mains vides. Mesuré :
   * le retour ne rendait plus rien du tout.
   * Le drapeau n'est donc consommé QUE lorsque l'adresse correspond, et
   * il s'éteint tout seul au bout d'une seconde et demie — un retour
   * qui ne mène à aucun changement d'adresse (la page de recherche qui
   * se referme) ne peut plus le laisser traîner.
   */
  const quandTraversee = useRef(0);
  /** Faux jusqu'à la fin du tout premier rendu de ce document. */
  const premierRendu = useRef(true);

  useEffect(() => {
    // La restauration native provoque le sursaut : on la coupe
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // L'hydratation est finie : les navigations internes pourront
    // lire leur mémoire dès le premier rendu (liste sans flash)
    marquerHydratation();

    purgerDefilementsAnciens();

    const marquerTraversee = () => {
      //  ⚠️ ON NE DÉGÈLE PAS ICI, ET C'EST TOUT LE POINT. Au retour,
      //  l'adresse redevient celle de la liste AVANT que React n'ait
      //  rendu la liste : le document est encore celui de la fiche,
      //  court, et le navigateur rabote le défilement. Ce rabotage
      //  s'écrivait sous l'adresse de la LISTE — et écrasait la place
      //  qu'on s'apprêtait à rendre. Seul un vrai geste rend la main.
      traversee.current = true;
      quandTraversee.current = Date.now();
      // À cet instant, l'adresse est DÉJÀ celle de l'étape rejointe.
      adresseTraversee.current = location.pathname + location.search;
      // La liste de résultats restaure aussi SA position interne
      signalerTraversee();
    };

    /**
     * LA POSITION EST MÉMORISÉE EN CONTINU — mais elle se FIGE AU
     * DÉPART (refonte nº 191).
     * ⚠️ SANS CE GEL, LA DERNIÈRE VALEUR ÉCRITE N'EST PAS LA VÔTRE.
     * Mesuré au banc : on quitte la liste à 2400 px, la page suivante
     * arrive, le document raccourcit d'un coup — et le navigateur
     * RABOTE le défilement à la nouvelle hauteur (1271 px). Ce
     * rabotage déclenche un `scroll`, il arrive alors que l'adresse est
     * encore celle de la liste, et il écrasait la vraie position. Au
     * retour, on atterrissait 1100 px trop haut.
     * On écrit donc la position AU MOMENT DU CLIC sur un lien — c'est
     * la dernière que l'œil a vue — puis on ne touche plus à rien
     * jusqu'au prochain vrai geste (doigt, molette, clavier) ou au
     * prochain retour.
     */
    let gele = false;
    let ecriturePrevue = false;
    const memoriserPosition = () => {
      if (gele || ecriturePrevue) return;
      ecriturePrevue = true;
      requestAnimationFrame(() => {
        ecriturePrevue = false;
        // ⚠️ LA PAGE DE RECHERCHE OCCUPE LE DOCUMENT SANS CHANGER
        // D'ADRESSE. Quand elle se pose, le reste du site quitte le
        // flux (`display: none`) : le document raccourcit d'un coup,
        // le navigateur ramène le défilement à zéro, et ce zéro
        // s'écrivait dans la mémoire DE LA MOSAÏQUE. Ensuite, le champ
        // de localité fait défiler la page de recherche (passe 106) —
        // ses positions à elle finissaient au même endroit.
        // Rien de tout cela ne décrit la mosaïque : tant que la
        // recherche tient l'écran, on n'écrit pas. Sa propre position
        // de retour est gardée à part (recherche-mobile), et elle est
        // désormais la seule à parler pour elle.
        if (document.documentElement.dataset.recherche) return;
        //  ⚠️ UNE POSITION APPARTIENT À UNE LISTE (exigence nº 4 de la
        //  refonte nº 191). Une fiche s'ouvre toujours en haut : on
        //  n'écrit donc jamais de position pour une page de détail, et
        //  on n'en restitue jamais non plus (voir plus bas).
        if (estUnePageDeDetail(location.pathname)) return;
        memoriserDefilement(
          location.pathname + location.search,
          positionSousLeGel()
        );
      });
    };

    /** L'écriture tout de suite, sans attendre l'image suivante. */
    const ecrireMaintenant = () => {
      if (document.documentElement.dataset.recherche) return;
      if (estUnePageDeDetail(location.pathname)) return;
      memoriserDefilement(
        location.pathname + location.search,
        positionSousLeGel()
      );
    };
    const auDepart = (evenement: MouseEvent) => {
      const cible = evenement.target;
      const lien =
        cible instanceof Element ? cible.closest("a[href]") : null;
      if (!lien) return;
      /**
       * ⚠️ LA DEMANDE N'EST POSÉE QUE VERS UNE FICHE (nº 194-§1).
       * LE DÉFAUT DE LA PASSE PRÉCÉDENTE : elle était posée pour TOUT
       * lien. Toucher le logo pour remonter en haut la posait donc
       * aussi — et la page d'accueil, en arrivant, rendait fidèlement
       * la place qu'on venait de quitter. La page remontait, puis
       * redescendait, sans qu'on puisse jamais rester en haut.
       * REVENIR n'a de sens que depuis une page de DÉTAIL. Tout autre
       * lien — le logo, le menu, « Ma sélection », le pied de page —
       * EFFACE la demande au lieu d'en poser une.
       */
      const versUneFiche = (lien.getAttribute("href") ?? "").startsWith(
        "/tatoueur/"
      );
      if (!versUneFiche) {
        oublierRestaurationPosition();
        return;
      }
      /**
       * ⚠️ UNE FICHE GARDE SA PLACE QUAND ELLE MÈNE À UNE AUTRE FICHE
       * (passe nº 230-§3)
       * ------------------------------------------------------------
       * La règle de la nº 191 — « une fiche s'ouvre toujours en haut,
       * on n'écrit ni ne rend jamais sa position » — a été écrite
       * quand on n'arrivait sur une fiche QUE depuis une liste. Depuis
       * la nº 226-§5, une fiche mène à une autre fiche (un résident,
       * une autre adresse), et au doigt c'est désormais une PAGE
       * (nº 230-§3) : le retour doit rendre la fiche précédente À SA
       * POSITION, comme il le fait pour une mosaïque.
       * On écrit donc la position d'une fiche DANS CE SEUL CAS —
       * fiche → fiche. Une fiche ouverte depuis une liste n'écrit
       * toujours rien, et s'ouvre donc toujours en haut : la règle de
       * la nº 191 n'est pas touchée, elle est bornée.
       */
      if (estUnePageDeDetail(location.pathname)) {
        /*  §2 (nº 328) — C-3 : LA POSITION SOUS LE GEL, ET C'ÉTAIT LE
            BUG LE PLUS SILENCIEUX DU SITE.
            ------------------------------------------------------------
            CE QUI ÉTAIT ÉCRIT : `window.scrollY`. Or quand on part
            depuis une SURFACE SUPERPOSÉE — la fenêtre de carrousel du
            smartphone, une fenêtre de fiche du web —, le corps est
            `position: fixed` et `window.scrollY` VAUT ZÉRO
            (lib/gel-du-corps). On écrasait donc la position de la
            fiche par 0 à chaque départ depuis une fenêtre, et le
            retour suivant la rouvrait en haut.
            `positionSousLeGel()` rend la position DU CORPS GELÉ quand
            il l'est (elle la relit dans son `top: -Ypx`), et
            `window.scrollY` sinon. Elle existait déjà — la fenêtre de
            carrousel et la pile de fiches l'appellent depuis la
            nº 259-§3 ; c'est ce fichier-ci qui ne l'appelait pas. */
        memoriserDefilement(
          location.pathname + location.search,
          positionSousLeGel()
        );
        demanderRestaurationPosition(location.pathname + location.search);
        gele = true;
        return;
      }
      ecrireMaintenant();
      gele = true;
      /**
       * ⚠️ ET ON DEMANDE LA RESTITUTION D'AVANCE (nº 193-§1).
       * LE CONSTAT : depuis une RECHERCHE, le retour rend la place ;
       * depuis l'ACCUEIL, on atterrit en haut. Les deux passent pourtant
       * par le même code — sauf sur un point qui ne nous appartient
       * pas : la façon dont le navigateur QUALIFIE l'arrivée. Toute la
       * restitution en dépendait (« retour ou avance » selon
       * `performance`), et cette qualification varie d'un navigateur et
       * d'un appareil à l'autre.
       * On pose donc une DEMANDE NOMMÉE, adressée à la liste qu'on
       * quitte : au retour, la page reconnaît son adresse et rend la
       * place, que le navigateur ait appelé cela un retour ou non. La
       * demande n'est consommée que par CETTE adresse (voir
       * lib/navigation-session), et le script d'avant peinture la lit
       * lui aussi — la place est donc posée avant la première image.
       */
      demanderRestaurationPosition(location.pathname + location.search);
    };
    const auGeste = () => {
      gele = false;
      //  ⚠️ ET LA DEMANDE MEURT AVEC LE GESTE (nº 194-§1) : dès que la
      //  personne touche la page, plus rien n'a le droit de la
      //  déplacer à sa place.
      oublierRestaurationPosition();
    };

    window.addEventListener("popstate", marquerTraversee);
    window.addEventListener("scroll", memoriserPosition, { passive: true });
    document.addEventListener("click", auDepart, true);
    for (const geste of ["touchstart", "wheel", "keydown"] as const) {
      window.addEventListener(geste, auGeste, { passive: true });
    }
    return () => {
      window.removeEventListener("popstate", marquerTraversee);
      window.removeEventListener("scroll", memoriserPosition);
      document.removeEventListener("click", auDepart, true);
      for (const geste of ["touchstart", "wheel", "keydown"] as const) {
        window.removeEventListener(geste, auGeste);
      }
    };
  }, []);

  useEffect(() => {
    /**
     * ⚠️ ON N'ÉCRIT QUE SUR UNE ADRESSE STABLE (passe nº 154).
     * Le chemin vient du ROUTEUR, les critères du NAVIGATEUR, et les
     * deux ne se mettent pas à jour dans le même rendu. Depuis que ce
     * composant est prévenu de TOUS les changements d'adresse, il voit
     * donc passer des états intermédiaires — après l'ouverture d'une
     * fiche, un rendu où le chemin est encore celui de la mosaïque et
     * les critères déjà vides. Inscrire cet entre-deux au journal
     * écrasait la vraie page précédente : la fiche croyait venir de
     * « / » alors qu'on arrivait des résultats.
     * La règle : tant que le routeur et le navigateur ne montrent pas
     * la même page, on ne note rien — le rendu suivant le fera.
     */
    if (pathname !== window.location.pathname) return;
    const url = pathname + window.location.search;
    noterPageVisitee(url);
    // ⚠️ UNE FENÊTRE DE FICHE N'EST PAS UNE PAGE. Elle se pose PAR-
    // DESSUS la mosaïque et écrit son adresse dans la barre
    // (`pushState`, drapeau `fenetreFiche`) — mais l'onglet, lui, est
    // toujours sur la mosaïque. L'inscrire au journal d'onglet, c'est
    // dire à la reprise de session « la dernière page était cette
    // fiche » : au réveil, elle rouvrait une fiche que personne
    // n'avait demandée. Le journal d'onglet ne retient donc que les
    // VRAIES pages.
    if (!(window.history.state as { fenetreFiche?: boolean } | null)
      ?.fenetreFiche) {
      noterPageOnglet(url);
    }

    /**
     * LA RÈGLE UNIQUE, APPLIQUÉE ICI ET NULLE PART AILLEURS.
     * Si une position est mémorisée pour cette page, on la rend —
     * sauf si l'on vient d'y arriver par une navigation NEUVE et
     * voulue. Trois façons d'y arriver autrement :
     */
    // 1. un RETOUR ou une AVANCE d'historique dans ce même document
    //    (popstate). ⚠️ Un retour arrière qui n'a pas changé d'adresse
    //    — la page de recherche qui se referme — n'en est pas un : ce
    //    n'est pas une traversée de page, et le drapeau ne doit pas
    //    rester à traîner.
    const vraieTraversee =
      traversee.current &&
      adresseTraversee.current === url &&
      Date.now() - quandTraversee.current < 1500;
    // On ne consomme QUE si l'on a servi : un rendu intermédiaire ne
    // doit pas manger le drapeau du rendu suivant.
    if (vraieTraversee) {
      traversee.current = false;
      adresseTraversee.current = "";
    }
    // 2. un DOCUMENT NEUF né d'un retour, d'une avance ou d'un
    //    rechargement (réouverture du navigateur comprise).
    const premiereFois = premierRendu.current;
    premierRendu.current = false;
    if (premiereFois) {
      // ⚠️ LE SCRIPT BLOQUANT A DÉJÀ TRANCHÉ, AVANT LA PREMIÈRE
      // PEINTURE (voir lib/script-avant-peinture). S'il a posé la
      // position, il ne reste qu'à reprendre sa réserve de hauteur —
      // surtout pas à re-défiler : ce second mouvement, appliqué après
      // le rendu, était précisément ce que l'œil voyait passer.
      if (reprendreLaReserveDuScript() > 0) return;
    }
    const documentRestitue = premiereFois && arriveeQuiRestitue();
    // 3. une demande explicite, posée avant de renvoyer l'utilisateur
    //    sur sa page (le retour reconstruit d'une fiche sans
    //    historique).
    const restaurationDemandee = consommerRestaurationPosition();

    if (!vraieTraversee && !documentRestitue && !restaurationDemandee) return;
    //  ⚠️ UNE FICHE PEUT DÉSORMAIS RENDRE SA PLACE (nº 230-§3) — mais
    //  SEULEMENT par l'un des trois chemins ci-dessus, qui tous
    //  disent un RETOUR. Une navigation neuve vers une fiche n'allume
    //  aucun des trois : elle s'ouvre en haut, comme depuis la
    //  nº 191. Et une fiche ouverte depuis une LISTE n'a jamais de
    //  position écrite (seul le clic fiche → fiche en écrit une, voir
    //  `auDepart`) : `poserLaPosition` ne trouve alors rien, et ne
    //  bouge rien.
    //  ⚠️ LA POSITION VOYAGE AVEC SA CLÉ (nº 185-c) : celle d'une
    //  mosaïque complète ne doit jamais être appliquée à une mosaïque
    //  filtrée. La pose la revérifie à chaque tentative.
    poserLaPosition(lireDefilement(url), adresseDeRecherche(url));
  }, [pathname, requete]);

  return null;
}
