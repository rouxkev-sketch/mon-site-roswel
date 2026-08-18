"use client";

import { useEffect, useRef } from "react";

/**
 * UNE SURFACE QUI COUVRE L'ÉCRAN POSE UNE ÉTAPE, ET LE RETOUR LA REFERME
 * ==================================================================
 * (passe nº 330-§3 — le C-4 de l'inventaire nº 327)
 *
 * C'est le POINT 1 de la règle de navigation (lib/navigation-session),
 * et c'était le dernier chantier ouvert après la nº 329. Quatre
 * surfaces couvraient l'écran sans rien poser dans l'historique : le
 * panneau du bas des menus, la page de recherche du smartphone, le
 * menu « Mon espace » et le détail d'une fiche dans l'administration.
 * Sur un téléphone, le bouton retour QUITTAIT LA PAGE au lieu de
 * refermer ce qui était ouvert.
 *
 * L'ÉCRITURE EST UNIQUE, et les quatre l'appellent : quatre copies
 * auraient divergé à la première passe suivante.
 *
 * CE QU'ELLE FAIT, ET DANS CET ORDRE :
 *
 *  1. À L'OUVERTURE — `pushState` À DEUX ARGUMENTS, jamais trois.
 *     L'adresse ne change pas : ces surfaces ne sont pas des pages,
 *     elles se posent SUR la page. Passer une adresse ferait repartir
 *     le routeur de Next (la leçon de RetourGaranti et de la nº 194).
 *     L'ÉTAT DE NEXT EST RECOPIÉ dans le nouvel état : les deux étapes
 *     décrivent alors le même arbre, et le routeur n'a rien à refaire
 *     quand on repasse de l'une à l'autre.
 *
 *  2. AU RETOUR (`popstate`) — on referme, et RIEN D'AUTRE. L'étape a
 *     été consommée par le navigateur lui-même : un seul appui, une
 *     seule surface. C'est l'exigence « un seul appui de retour par
 *     surface, pas deux ».
 *
 *  3. À LA FERMETURE PAR ELLE-MÊME (la croix, Échap, un choix, le
 *     glissement) — on REPASSE PAR L'HISTORIQUE (`history.back()`)
 *     pour retirer l'étape qu'on avait posée. Sans cela elle resterait
 *     orpheline, et le retour suivant ne ferait rien du tout : c'est
 *     précisément le défaut « il faut appuyer deux fois ».
 *
 *  4. ⚠️ ET L'ADRESSE ÉCRITE PENDANT L'OUVERTURE EST PRÉSERVÉE. C'est
 *     le piège de cette passe, et il est réel : le panneau du bas de
 *     « Ma sélection » écrit le filtre dans l'adresse par
 *     `replaceState` — donc SUR NOTRE ÉTAPE. Revenir d'un cran
 *     ramènerait l'adresse SANS le filtre, et le filtre qu'on vient de
 *     choisir serait perdu. On note donc l'adresse au moment de partir,
 *     et on la repose sur l'étape d'arrivée. Le compte d'étapes reste
 *     juste (une posée, une reprise) ET le filtre survit.
 *
 * ⚠️ ON NE TOUCHE JAMAIS AU GEL DU CORPS. Chaque surface garde son
 * propre gel, posé et repris par son propre effet : une ouverture, une
 * fermeture, quel que soit le chemin emprunté. Ce module ne décide que
 * de l'historique — c'est le `fermer` de la surface qui, en repassant
 * son état à faux, fait jouer son dégel une fois et une seule.
 *
 * ⚠️ ET SI L'ON A NAVIGUÉ pendant que la surface était ouverte (une
 * entrée de menu qui mène à une page), ON NE REPREND RIEN : reculer
 * d'un cran annulerait la navigation que la personne vient de
 * demander. C'est le §1 de la nº 331 — voir `laSurfaceVaNaviguer`
 * plus bas, et la raison pour laquelle la règle y est INVERSÉE.
 */

/** La marque de nos étapes, dans l'état d'historique. */
const CLE = "etapeRefermable";

/** Un rang par ouverture : deux surfaces empilées ne se confondent
    pas, et la seconde reprend bien SA propre étape. */
let rangSuivant = 0;

/**
 * ⚠️ LA REPRISE EST DIFFÉRÉE D'UN TOUR, ET C'EST UNE LEÇON PAYÉE AU
 * BANC DE CETTE PASSE.
 * ------------------------------------------------------------------
 * React REJOUE les effets sur une même instance — mode strict en
 * développement, rafraîchissement à chaud, remontage d'un arbre. La
 * séquence est alors « pose, reprise, pose », dans le même instant,
 * sans que la surface se soit fermée une seule fois. Une reprise
 * IMMÉDIATE reculait donc pour de bon (mesuré : l'historique
 * RÉTRÉCISSAIT à l'ouverture de la page de recherche), et la pose
 * suivante ajoutait une SECONDE étape — il aurait fallu deux appuis.
 * ON DIFFÈRE DONC LA REPRISE D'UN TOUR DE BOUCLE : si une pose
 * survient dans cet intervalle et que l'étape du dessus est encore la
 * nôtre, on ANNULE la reprise et l'on REPREND L'ÉTAPE DÉJÀ POSÉE au
 * lieu d'en poser une seconde. Une vraie fermeture, elle, n'est
 * suivie d'aucune pose : la reprise se fait, un tour plus tard, et
 * personne ne le voit.
 */
let repriseEnAttente: { rang: number; minuteur: number } | null = null;

/**
 * §1 (nº 331) — LA NAVIGATION GAGNE TOUJOURS.
 * ==================================================================
 * LE DÉFAUT, RELEVÉ PAR LE PROPRIÉTAIRE SUR SON iPHONE : dans le menu
 * « Mon espace », AUCUN lien ne fonctionnait plus. Sa lecture était
 * juste — l'étape que la fenêtre avait posée AVALAIT LE CLIC. Le lien
 * demandait au routeur d'avancer, la fenêtre reculait d'un cran pour
 * se refermer, et les deux s'annulaient.
 *
 * ⚠️ CE QUI ÉTAIT FAUX DANS LA nº 330, ET QU'IL FAUT DIRE : la garde
 * y était posée DANS LE MAUVAIS SENS. Elle reculait par défaut, et ne
 * s'abstenait que si elle pouvait PROUVER qu'une navigation était
 * passée — en regardant si l'étape du dessus portait encore sa marque.
 * Or cette preuve arrive trop tard : le routeur n'a pas encore écrit
 * l'historique au moment où React démonte la surface. On pariait donc
 * sur l'ordre de deux événements, et le pari se perdait.
 *
 * LA RÈGLE EST INVERSÉE, ET ELLE EST DÉTERMINISTE. Reculer est le
 * geste DANGEREUX ; ne rien faire est toujours sans risque (l'étape
 * reste sous la nouvelle, et le retour y retombe sur l'adresse d'avant
 * l'ouverture — la bonne destination, en un seul appui). On ne recule
 * donc QUE si aucune navigation n'a été demandée, et la demande est
 * relevée AU CLIC — c'est-à-dire AVANT que React n'ait quoi que ce
 * soit à démonter. Ce n'est plus une course entre deux événements :
 * l'un précède l'autre, toujours.
 *
 * DEUX PORTES, UNE SEULE ÉCRITURE :
 *  · LES LIENS — le module écoute lui-même les clics, en phase de
 *    CAPTURE : tout clic qui touche un `<a href>` du site arme la
 *    marque. Aucune surface n'a une ligne à écrire pour cela, et les
 *    quatre entrées de « Mon espace » sont couvertes sans les nommer.
 *  · LE CODE QUI NAVIGUE SANS LIEN — `router.push` depuis un bouton :
 *    il APPELLE `laSurfaceVaNaviguer()`. Une ligne, la même fonction
 *    que le module s'appelle à lui-même : ce n'est pas une rustine,
 *    c'est le vocabulaire commun.
 */
let navigationDemandee = false;

/**
 * « CETTE SURFACE SE REFERME POUR NAVIGUER » — à appeler AVANT la
 * navigation, par tout code qui change d'adresse autrement que par un
 * lien (`router.push` depuis un bouton, « Valider » de la page de
 * recherche). La surface laissera alors son étape en place, plutôt que
 * d'entrer en course avec le routeur.
 */
export function laSurfaceVaNaviguer(): void {
  navigationDemandee = true;
}

/**
 * §1 (nº 332) — L'ÉTAPE D'UNE SURFACE EST CONSOMMÉE PAR LA NAVIGATION,
 * JAMAIS DOUBLÉE.
 * ==================================================================
 * LE DÉFAUT, TROUVÉ AU RECENSEMENT DE LA nº 331 (son nº 22) : quand
 * une surface se referme POUR NAVIGUER, son étape restait en place —
 * sous la nouvelle. Une entrée en trop PAR RECHERCHE VALIDÉE, et son
 * adresse est celle de la page d'avant : un seul retour depuis les
 * résultats renvoyait donc à l'accueil. Dix recherches, dix jumelles.
 *
 * LES DEUX CHEMINS INTERDITS, ET POURQUOI :
 *  · RECULER APRÈS AVOIR NAVIGUÉ rouvrirait la course de la nº 330 —
 *    on ne parie sur l'ordre d'aucun événement ;
 *  · LAISSER L'ÉTAPE est le défaut lui-même.
 *
 * CE QU'ON FAIT : la navigation REMPLACE l'étape au lieu de s'empiler
 * dessus. L'étape de la surface porte l'adresse de la page qu'on
 * regardait ; en la remplaçant par la destination, elle DEVIENT la
 * nouvelle entrée. Une posée, une consommée, rien entre les deux.
 *
 *     avant :  [accueil] → [étape (accueil)] → [résultats]
 *     après :  [accueil] → [résultats]
 *
 * ⚠️ ELLE NE RÉPOND VRAI QUE SI L'ÉTAPE DU DESSUS EST BIEN UNE DES
 * NÔTRES. Sur le web, où aucune surface ne pose d'étape, elle répond
 * faux et la navigation empile normalement : rien ne change pour
 * personne d'autre. Et c'est une LECTURE de `history.state`, pas une
 * hypothèse — elle ne peut pas se tromper d'entrée.
 */
export function laNavigationRemplaceLEtape(): boolean {
  if (typeof window === "undefined") return false;
  const etat = window.history.state as Record<string, unknown> | null;
  return etat?.[CLE] !== undefined;
}

export function useEtapeQuiSeReferme(
  ouverte: boolean,
  fermer: () => void
): void {
  /*  LA FERMETURE SE LIT DANS UNE RÉFÉRENCE : elle est recréée à
      chaque rendu de la surface, et la mettre en dépendance rejouerait
      l'effet — donc POSERAIT UNE ÉTAPE DE PLUS — à chaque rendu. */
  const fermerRef = useRef(fermer);
  useEffect(() => {
    fermerRef.current = fermer;
  }, [fermer]);

  useEffect(() => {
    if (!ouverte) return;
    let rang: number;
    const dejaLa =
      repriseEnAttente &&
      (window.history.state as Record<string, unknown> | null)?.[CLE] ===
        repriseEnAttente.rang;
    if (repriseEnAttente && dejaLa) {
      //  L'effet se rejoue : l'étape posée à l'instant est encore là.
      window.clearTimeout(repriseEnAttente.minuteur);
      rang = repriseEnAttente.rang;
      repriseEnAttente = null;
    } else {
      rang = rangSuivant += 1;
      window.history.pushState(
        { ...((window.history.state as object | null) ?? {}), [CLE]: rang },
        ""
      );
    }
    //  UNE SURFACE QUI S'OUVRE PART D'UNE ARDOISE PROPRE : la marque
    //  d'une navigation passée ne doit pas éteindre la reprise de
    //  celle-ci.
    navigationDemandee = false;
    let aNous = true;

    const auRetour = () => {
      if (!aNous) return;
      aNous = false;
      fermerRef.current();
    };
    window.addEventListener("popstate", auRetour);

    /*  §1 (nº 331) — LE CLIC SUR UN LIEN ARME LA MARQUE, EN CAPTURE.
        La phase de capture passe AVANT le gestionnaire du lien et
        avant tout changement d'état de React : quand le démontage
        arrive, la marque est déjà posée. C'est ce qui rend la règle
        déterministe au lieu de dépendre d'un ordre.
        ⚠️ TOUT `<a href>`, PAS SEULEMENT CEUX DE LA SURFACE : un lien
        touché ailleurs dans la page referme aussi la surface, et la
        navigation doit gagner là aussi. */
    const auClic = (evenement: MouseEvent) => {
      const cible = evenement.target;
      if (cible instanceof Element && cible.closest("a[href]")) {
        navigationDemandee = true;
      }
    };
    document.addEventListener("click", auClic, true);

    return () => {
      window.removeEventListener("popstate", auRetour);
      document.removeEventListener("click", auClic, true);
      //  Le retour a déjà consommé l'étape : il n'y a rien à reprendre.
      if (!aNous) return;
      aNous = false;
      //  LA NAVIGATION GAGNE TOUJOURS : on laisse l'étape en place.
      if (navigationDemandee) return;
      const etat = window.history.state as Record<string, unknown> | null;
      //  On a navigué : l'étape du dessus n'est plus la nôtre.
      if (etat?.[CLE] !== rang) return;
      const adresse = window.location.pathname + window.location.search;
      const minuteur = window.setTimeout(() => {
        repriseEnAttente = null;
        const encore = window.history.state as Record<
          string,
          unknown
        > | null;
        //  Une navigation a pu passer pendant ce tour d'attente.
        if (encore?.[CLE] !== rang) return;
        const remettre = () => {
          window.removeEventListener("popstate", remettre);
          if (window.location.pathname + window.location.search === adresse) {
            return;
          }
          /*  §1 (nº 349) — LA RÉÉCRITURE ATTEND QUE LA TRAVERSÉE SOIT
              RÉELLEMENT FINIE. Elle s'exécutait ICI MÊME, dans le
              gestionnaire du `popstate` : une réécriture de l'entrée
              pendant que le navigateur règle encore sa transition de
              retour — exactement la fenêtre que le propriétaire a
              désignée à la nº 349, et la seule réécriture DE CE SITE
              qui s'y trouvait. Deux images puis un tour de boucle :
              la transition est peinte et rendue avant qu'on touche à
              l'entrée. La borne nº 332-§1 est intacte — aucune entrée
              ajoutée ni retirée, la même adresse est reposée, on
              revérifie seulement qu'une navigation n'est pas passée
              entre-temps. */
          requestAnimationFrame(() =>
            requestAnimationFrame(() =>
              window.setTimeout(() => {
                if (
                  window.location.pathname + window.location.search ===
                  adresse
                ) {
                  return;
                }
                //  §4 ci-dessus — l'adresse écrite pendant l'ouverture
                //  survit.
                window.history.replaceState(window.history.state, "", adresse);
              }, 0)
            )
          );
        };
        window.addEventListener("popstate", remettre);
        window.history.back();
      }, 0);
      repriseEnAttente = { rang, minuteur };
    };
  }, [ouverte]);
}
