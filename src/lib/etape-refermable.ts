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
 * ⚠️ ET SI L'ON A NAVIGUÉ AILLEURS pendant que la surface était
 * ouverte (une entrée de menu qui mène à une page), notre étape n'est
 * plus celle du dessus : on ne reprend rien. Reculer d'un cran
 * annulerait la navigation que la personne vient de demander. La
 * marque posée dans l'état de l'étape répond à cette question-là, et
 * elle seule.
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

export function useEtapeQuiSeReferme(
  ouverte: boolean,
  fermer: () => void,
  /**
   * ⚠️ FAUX QUAND LA SURFACE SE FERME **POUR NAVIGUER** (nº 330-§3).
   * Le cas est réel : « Valider », sur la page de recherche, referme
   * la page ET change d'adresse. Reculer d'un cran à cet instant-là
   * entrerait en course avec la navigation du routeur — au mieux pour
   * rien, au pire en l'annulant, et la recherche serait perdue. On ne
   * PARIE PAS sur l'ordre : la surface le DIT, et l'étape reste alors
   * en place, sous la nouvelle. Le retour y retombe, sur la même
   * adresse que celle d'avant l'ouverture : un seul appui, la bonne
   * destination — au prix d'une étape jumelle dans la pile, qui ne se
   * voit pas.
   */
  reprendreSonEtape = true
): void {
  const reprendre = useRef(reprendreSonEtape);
  useEffect(() => {
    reprendre.current = reprendreSonEtape;
  }, [reprendreSonEtape]);
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
    let aNous = true;

    const auRetour = () => {
      if (!aNous) return;
      aNous = false;
      fermerRef.current();
    };
    window.addEventListener("popstate", auRetour);

    return () => {
      window.removeEventListener("popstate", auRetour);
      //  Le retour a déjà consommé l'étape : il n'y a rien à reprendre.
      if (!aNous) return;
      aNous = false;
      //  La surface se ferme POUR NAVIGUER : on laisse son étape.
      if (!reprendre.current) return;
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
          //  §4 ci-dessus — l'adresse écrite pendant l'ouverture survit.
          window.history.replaceState(window.history.state, "", adresse);
        };
        window.addEventListener("popstate", remettre);
        window.history.back();
      }, 0);
      repriseEnAttente = { rang, minuteur };
    };
  }, [ouverte]);
}
