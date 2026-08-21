"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  arriveeEnHautVoulue,
  arriveeQuiRestitue,
  consommerArriveeEnHaut,
  consommerRestaurationPosition,
  demanderRestaurationPosition,
  oublierRestaurationPosition,
  marquerHydratation,
  memoriserDefilement,
  noterDepartOnglet,
  noterPageOnglet,
  noterPageVisitee,
  purgerDefilementsAnciens,
  signalerTraversee,
} from "@/lib/navigation-session";
//  §2 (nº 328) — LA POSITION SE LIT SOUS LE GEL, JAMAIS BRUTE.
//  C'est le point 4 de la règle de navigation (lib/navigation-session).
import { positionSousLeGel } from "@/lib/gel-du-corps";
import {
  poserLaPosition,
  rendreLaPlace,
  reprendreLaReserveDuScript,
} from "@/lib/restitution-position";
//  §2-§3 (nº 426) — le refus de réveil s'écrit au journal de la sonde.
import { noter } from "@/lib/journal-bascule";
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
 * 2. Mémorise la position en continu et la réapplique APRÈS
 *    l'affichage de la page cible, au retour.
 *    ⚠️ nº 363 — CE COMPOSANT NE COUPE PLUS LA RESTAURATION NATIVE.
 *    Il posait `scrollRestoration = "manual"` depuis la nº 143 (la
 *    restauration du navigateur s'applique pendant que l'ancienne
 *    page est encore à l'écran, d'où un sursaut de quelques pixels).
 *    Le réglage est rendu au moteur — « auto », écrit une seule fois
 *    dans le script d'avant peinture — parce que la mesure de la
 *    nº 362 ne laissait plus que lui pour expliquer l'écran noir du
 *    glissement retour. CE QUE FAIT CE FICHIER N'A PAS CHANGÉ D'UNE
 *    LIGNE : il reste l'autorité sur les positions, et il pose la
 *    MÊME valeur que celle que le moteur a rangée dans l'entrée
 *    d'historique (la position du départ).
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
  /**
   * §2 (nº 333) — L'ADRESSE ARRIVE AVANT LE DRAPEAU, ET C'EST LE
   * DÉFAUT.
   * ==================================================================
   * MESURÉ, PAS DÉDUIT. Au retour depuis des résultats vers l'accueil,
   * le relevé donne :
   *
   *     +16 ms  replaceState → /   (le routeur de Next)
   *     +21 ms  popstate     /     (le navigateur)
   *     …et AUCUNE lecture de la position mémorisée.
   *
   * Le routeur remet l'adresse EN PREMIER. Le magasin d'adresse
   * (`souscrireAdresse`) le voit, ce composant se rend de nouveau, et
   * l'effet de restitution s'exécute AVANT que `marquerTraversee` n'ait
   * posé son drapeau — cinq millisecondes plus tôt. Il ne voit donc
   * aucune traversée, il sort… et il ne se rejoue plus jamais, puisque
   * ni le chemin ni la requête ne changeront ensuite. La position était
   * bien en mémoire (900 px, relevé) : personne n'allait plus la lire.
   * C'est la piste que le propriétaire avait donnée à la nº 333 — elle
   * était juste, à ceci près que ce `replaceState` n'EFFACE rien : il
   * ARRIVE TROP TÔT.
   *
   * LE REMÈDE, ET SA BORNE. On note l'adresse pour laquelle l'effet
   * est sorti FAUTE DE SIGNAL ; si un `popstate` arrive juste après
   * POUR CETTE MÊME ADRESSE, on réveille l'effet une fois. Rien
   * d'autre ne le réveille : un `popstate` qui referme une surface
   * n'a pas changé d'adresse, l'effet n'était donc pas en attente, et
   * il ne se rejoue pas — sans quoi on reposerait une position par
   * dessus le dégel, et l'on rouvrirait le défaut de la nº 329.
   */
  /**
   * ██ §2 (nº 426) — L'ATTENTE EST DATÉE, ET LE RÉVEIL EST BORNÉ ██
   * ------------------------------------------------------------------
   * LE DÉFAUT, et c'était LE poseur « aléatoire » de la recherche en
   * bas de page : CHAQUE navigation sans restitution note ici son
   * adresse (« au cas où le popstate du routeur arrive juste après »,
   * nº 333-§2). Mais la note restait posée SANS LIMITE DE TEMPS. Or la
   * FERMETURE D'UNE SURFACE — la croix ou Échap sur la page de
   * recherche, le retour qui referme un panneau — produit exactement la
   * signature attendue : un popstate SUR L'ADRESSE COURANTE. Des
   * secondes ou des minutes après la note, ce popstate-là réveillait
   * l'effet, qui se croyait dans le cas nº 333-§2 (vraie traversée) et
   * RENDAIT LA PLACE mémorisée de la liste — celle d'une visite
   * précédente, en bas. D'où l'aléatoire : il fallait une place
   * mémorisée (moins de 30 min) ET une fermeture par croix/Échap/retour
   * au bon moment. Et « même depuis le haut » : la place posée est
   * celle de la MÉMOIRE, pas celle de l'écran.
   * LA BORNE : le popstate du routeur suit son replaceState de
   * quelques millisecondes (mesuré nº 333 : +16 ms → +21 ms). Une
   * attente de plus de 400 ms n'est PAS ce cas-là — le réveil est
   * refusé, et le refus s'écrit au journal.
   */
  const attenteDeTraversee = useRef<{ url: string; quand: number } | null>(
    null
  );
  const [reveils, setReveils] = useState(0);

  useEffect(() => {
    //  nº 357 — LE NU TOTAL (nº 354) se décide ici, côté client : la
    //  racine est prérendue et ne lit plus le cookie. Une lecture,
    //  rien d'autre, et le composant se tait.
    if (document.cookie.indexOf("yf_nu_total=1") >= 0) return;
    /*  nº 363 — PLUS RIEN N'EST POSÉ ICI. Ces trois lignes coupaient la
        restauration native (« manual »), depuis la nº 143 et pour une
        vraie raison : elle s'applique pendant que l'ancienne page est
        encore à l'écran, d'où un sursaut. La mesure de la nº 362 a
        renversé la balance — l'écran noir du glissement retour ne
        s'explique plus que par elle — et le réglage est rendu au
        moteur, EN UN SEUL ENDROIT : le script d'avant peinture, qui
        s'exécute avant toute ligne d'application (lib/script-avant-
        peinture, « auto »). Le reste de ce fichier ne bouge pas d'une
        ligne : c'est toujours lui qui mémorise et qui rend la place. */

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
      //  §2 (nº 333) — L'EFFET ÉTAIT-IL SORTI FAUTE DE CE DRAPEAU, POUR
      //  CETTE ADRESSE ? Alors on le réveille : il a désormais de quoi
      //  répondre. Une seule fois, et seulement dans ce cas-là.
      const attente = attenteDeTraversee.current;
      if (attente !== null && attente.url === adresseTraversee.current) {
        //  §2 (nº 426) — le réveil n'est légitime que COLLÉ au
        //  replaceState du routeur (nº 333-§2 : mesuré à ~20 ms).
        if (Date.now() - attente.quand < 400) {
          attenteDeTraversee.current = null;
          setReveils((n) => n + 1);
        } else {
          noter(
            `RÉVEIL REFUSÉ · popstate sur ${attente.url} · l'attente date ` +
              `de ${Date.now() - attente.quand} ms (fermeture de surface ` +
              `probable, pas la traversée du routeur)`
          );
        }
      }
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
      /**
       * §1 (nº 335) — DEUX IMAGES, PAS UNE, ET C'EST À CAUSE DE LA
       * RANGÉE.
       * ------------------------------------------------------------
       * Depuis cette passe, on ne range pas que la position : on range
       * aussi L'ÉTAT DE LA RANGÉE de recherche (lib/reserve-barre). Or
       * cet état est décidé PAR CE MÊME ÉVÉNEMENT de défilement : la
       * barre l'entend, elle aussi, et se replie. À une image d'écart,
       * on relevait donc l'ANCIEN état — mesuré au banc de la nº 333 :
       * « repliée » écrit `p: false` juste après le geste, puis
       * `p: true` à l'écriture suivante. La seconde image suffit : la
       * barre a alors rendu, et son attribut dit la vérité.
       * ⚠️ CELA NE RETARDE RIEN D'AUTRE : cette écriture était déjà
       * différée d'une image, et la position relue une image plus tard
       * est simplement plus récente — jamais fausse.
       */
      requestAnimationFrame(() => requestAnimationFrame(() => {
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
      }));
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

    /*  §1 (nº 428) — AU DÉPART DU DOCUMENT, LA MÉMOIRE D'ONGLET EST
        MISE À L'HEURE (adresse affichée + instant). C'est ce qui
        permet au script d'avant-peinture de RÉPARER un repli de
        navigation du routeur : quand une navigation douce échoue,
        Next recharge le document — et le relevé de la nº 428 a montré
        qu'il peut partir sur « / » NU, les critères et la page perdus
        en route. Le document suivant lit cette note et rend l'adresse
        complète. */
    const auDepartDuDocument = () => {
      noterDepartOnglet();
      /*  ██ §3 (nº 431) — LA NOTE FINALE, AU DÉPART DU DOCUMENT ██
          LE DÉFAUT (Brave, section profil d'une fiche) : au
          rechargement tiré du doigt, la page renaissait « catapultée
          au milieu ». La note restituée par le script (règle 332 :
          un rechargement rend la place) ne décrivait PAS la position
          du moment du rechargement : l'écriture au fil du défilement
          est différée de DEUX images (voir memoriserPosition) — un
          rechargement les coupe — et, sur une fiche, la seule note
          existante venait d'un clic fiche → fiche (nº 230-§3),
          vieille parfois de plusieurs minutes. LE COMPORTEMENT JUSTE
          d'un rafraîchissement volontaire : rendre la position DU
          MOMENT — celle que le navigateur lui-même rendrait. On
          photographie donc la place au pagehide, synchronement, en
          écrasant toute vieille note. Un rechargement tiré du doigt
          part toujours du haut : la note dit alors ~0, et la page
          renaît en haut — sur les trois navigateurs pareil.
          ⚠️ PAS d'exclusion de page de détail ICI, et c'est voulu :
          la photographie du départ est exacte par construction — au
          reload elle rend l'écran quitté, et au retour de document
          elle dit la même chose que la restauration native (auto,
          nº 363). La règle « une fiche s'ouvre en haut » vaut pour
          les navigations NEUVES, que le script refuse déjà
          (« navigate » sans marque). Deux gardes restent : la page
          de recherche occupe l'écran (sa position ne décrit pas la
          liste), et la fenêtre de fiche (l'adresse est celle de la
          fiche, la position celle de la grille : rien à écrire). */
      if (
        !document.documentElement.dataset.recherche &&
        !(window.history.state as { fenetreFiche?: boolean } | null)
          ?.fenetreFiche
      ) {
        memoriserDefilement(
          location.pathname + location.search,
          positionSousLeGel()
        );
      }
    };

    window.addEventListener("popstate", marquerTraversee);
    window.addEventListener("scroll", memoriserPosition, { passive: true });
    window.addEventListener("pagehide", auDepartDuDocument);
    document.addEventListener("click", auDepart, true);
    for (const geste of ["touchstart", "wheel", "keydown"] as const) {
      window.addEventListener(geste, auGeste, { passive: true });
    }
    return () => {
      window.removeEventListener("popstate", marquerTraversee);
      window.removeEventListener("scroll", memoriserPosition);
      window.removeEventListener("pagehide", auDepartDuDocument);
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

    /*  ██ §1 (nº 446) — LA SORTIE CONFIRMÉE ARRIVE EN HAUT ██
        ------------------------------------------------------------
        Le « Quitter sans enregistrer » de la garde de saisie a
        DÉCLARÉ son départ (declarerArriveeEnHaut) : même si son
        véhicule est une traversée d'historique (le go(-2) du bouton
        « précédent » — un popstate, donc `vraieTraversee` VRAI), on
        ne restitue RIEN : c'est une navigation en avant dans la tête
        du visiteur, elle arrive en haut. DefilementEnHaut a déjà
        remonté la page avant la peinture (lecture non destructive) ;
        ici, DERNIER lecteur de la chaîne, on CONSOMME la déclaration
        et on signe la décision au journal — la ligne POSE dit 0, et
        pourquoi. Les vrais retours ne déclarent jamais rien : aucune
        restitution légitime (423, 426, 431, fermeture 438) ne passe
        par cette branche. */
    const sortieConfirmee = arriveeEnHautVoulue();
    consommerArriveeEnHaut();
    if (sortieConfirmee) {
      attenteDeTraversee.current = null;
      poserLaPosition(
        0,
        undefined,
        "sortie confirmée — l'arrivée en haut est voulue (nº 446)"
      );
      return;
    }

    if (!vraieTraversee && !documentRestitue && !restaurationDemandee) {
      //  §2 (nº 333) — ON SORT SANS AVOIR SERVI : on le NOTE. Si le
      //  `popstate` de cette même adresse arrive juste après (le
      //  routeur remet l'adresse avant lui, mesuré), il nous rappellera.
      attenteDeTraversee.current = { url, quand: Date.now() };
      return;
    }
    attenteDeTraversee.current = null;
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
    //  §1 (nº 335) — ET AVEC L'ÉTAT DE LA RANGÉE : `rendreLaPlace` rend
    //  les deux ensemble (lib/restitution-position).
    /*  §3 (nº 426) — LA POSE EST SIGNÉE : la raison voyage jusqu'à la
        ligne POSE du journal (lib/restitution-position). */
    rendreLaPlace(
      url,
      vraieTraversee
        ? "retour ou avance (popstate)"
        : documentRestitue
          ? "document restitué (rechargement ou retour de document)"
          : "demande explicite (retour reconstruit)"
    );
  }, [pathname, requete, reveils]);

  return null;
}
