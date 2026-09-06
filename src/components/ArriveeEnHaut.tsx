"use client";

import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { defilerSansGeste } from "@/lib/defilement-programme";
import {
  lireRequeteCourante,
  lireRequeteServeur,
  souscrireAdresse,
} from "@/lib/adresse-courante";

/**
 * ██████████████████████████████████████████████████████████████████
 * ██  UNE PAGE NEUVE S'OUVRE EN HAUT — ET C'EST TOUT (nº 889)   ██
 * ██████████████████████████████████████████████████████████████████
 *
 * CE FICHIER REMPLACE `DefilementEnHaut` (nº 328 → nº 888) ET TOUTE LA
 * MÉCANIQUE QUI L'ENTOURAIT : la mémoire de position par adresse, les
 * demandes de restitution, les gardes, les planchers, la remise à zéro
 * de l'origine. Environ deux mille cinq cents lignes, huit passes de
 * correctifs. L'inventaire complet, avec ce que chaque pièce faisait
 * et pourquoi elle part : docs/DEFILEMENT-889-INVENTAIRE.md.
 *
 * ██ POURQUOI IL EN RESTE UN, ET PAS ZÉRO ██
 * ------------------------------------------------------------------
 * LA CONSIGNE DE LA nº 889 DISAIT : « nouvelle page → scrollY 0, posé
 * UNE fois par le routeur (comportement Next par défaut) ». La
 * première moitié est le but ; LA SECONDE EST INEXACTE, et c'est
 * précisément ce qui a fait durer le défaut huit passes. Le
 * comportement documenté de `<Link>` (Next 16,
 * `docs/01-app/03-api-reference/02-components/link.md`) est :
 *
 *     « The default scrolling behavior of <Link> is to MAINTAIN
 *       SCROLL POSITION […] as long as the Page is visible in the
 *       viewport. However, if the Page is not visible in the
 *       viewport, Next.js will scroll to the top. »
 *
 * Autrement dit : le routeur GARDE la position quand le haut du
 * contenu qui arrive est encore visible — donc EXACTEMENT quand la
 * page qu'on quitte était LÉGÈREMENT défilée. C'est mot pour mot la
 * contrainte que le propriétaire avait posée à la nº 887 (« le
 * décalage n'apparaît que si la page d'origine était légèrement
 * défilée ; fortement défilée, elle s'ouvre juste »), et que personne
 * n'expliquait.
 *
 * MESURÉ AU BANC (sonde nº 889, Chromium) : au web, accueil descendu
 * de 39 px → carte de style → LA RECHERCHE S'OUVRE À 39. La trace dit
 * qui décide, sans ambiguïté — au doigt le routeur écrit
 * `html.scrollTop = 0` (pile : `dontForceLayout`, son propre
 * `layout-router`), au web il n'écrit RIEN. Le même code, deux
 * verdicts, selon une géométrie de quelques pixels.
 *
 * ⚠️ ET `scroll-padding-top` NE SUFFIT PAS, C'EST MESURÉ AUSSI. Next
 * lit bien cette propriété pour son test, mais la fenêtre utile est
 * d'UN pixel chez nous : à défilement nul le haut du contenu vaut la
 * réserve (70 px), et il faudrait un seuil au-dessus de 69 pour
 * rattraper un pixel hérité. Un réglage qui tient sur un pixel n'est
 * pas un réglage.
 *
 * ██ CE QU'IL FAIT, EN ENTIER ██
 * ------------------------------------------------------------------
 * Au changement d'adresse, AVANT LA PEINTURE, il pose zéro. Une fois.
 * Il ne mémorise rien, ne défend rien, ne guette rien, n'a ni seuil
 * ni minuterie ni écouteur de viewport.
 *
 * LES TROIS SEULS CAS OÙ IL SE TAIT :
 *  1. LE PREMIER RENDU D'UN DOCUMENT — un chargement, un rechargement,
 *     un retour de document. `history.scrollRestoration` vaut « auto »
 *     (nº 363, script d'avant peinture) : c'est le moteur qui repose
 *     la position, et il le fait avant nous. On ne le contredit pas.
 *  2. UN RETOUR OU UNE AVANCE (`popstate`) — le moteur restitue là
 *     aussi. Le drapeau est CONSOMMÉ par le rendu qui suit, et il
 *     PÉRIME : un `popstate` qui n'a pas changé d'adresse (une surface
 *     qui se referme) ne doit pas avaler la navigation d'après.
 *  3. LA FENÊTRE DE FICHE DU WEB (`FenetreFiche`, nº 506). Elle change
 *     l'adresse (`pushState` vers /artist/…) SANS quitter la grille :
 *     la mosaïque doit rester EXACTEMENT où elle est derrière le
 *     voile. La fenêtre pose `data-fenetre-fiche` sur <html> tant
 *     qu'elle vit, et c'est cette marque qu'on lit — la même exception
 *     que portait `DefilementEnHaut` depuis la nº 506, reprise mot
 *     pour mot : ce n'est pas une arrivée, c'est une surface.
 *
 * ⚠️ `defilerSansGeste`, ET JAMAIS `window.scrollTo` : la barre du site
 * surveille le défilement pour replier sa rangée de recherche, et elle
 * lirait un mouvement non annoncé comme un GESTE de l'utilisateur (la
 * leçon de la nº 154-§6A).
 *
 * ⚠️ L'ÉCRAN NOIR DU GLISSEMENT RETOUR (nº 361/363) NE PEUT PAS
 * REVENIR PAR ICI : il naissait d'un saut à zéro posé AVANT que
 * l'adresse ne soit commise, sur la page qu'on quittait — WebKit
 * photographiait alors le fond. Ce composant ne joue que sur un
 * changement d'adresse DÉJÀ arrivé, et jamais sur un retour.
 *
 * N'affiche rien.
 */

/** Un `popstate` plus vieux que cela n'explique plus le rendu courant
    (il n'a pas changé d'adresse : une surface s'est refermée). */
const TRAVERSEE_FRAICHE_MS = 1500;

//  L'effet d'avant peinture, côté navigateur seulement : sur le
//  serveur, `useLayoutEffect` avertit et ne sert à rien.
const useEffetAvantPeinture =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function ArriveeEnHaut() {
  const chemin = usePathname();
  //  Les critères viennent du NAVIGATEUR, le chemin du ROUTEUR, et les
  //  deux ne se mettent pas à jour dans le même rendu (règle nº 336).
  //  `souscrireAdresse` surveille les deux portes — y compris les
  //  `replaceState` du code, qui n'émettent aucun `popstate`.
  const requete = useSyncExternalStore(
    souscrireAdresse,
    lireRequeteCourante,
    lireRequeteServeur
  );
  const traverseeA = useRef(0);
  const premierRendu = useRef(true);

  useEffect(() => {
    const marquer = () => {
      traverseeA.current = Date.now();
    };
    window.addEventListener("popstate", marquer);
    return () => window.removeEventListener("popstate", marquer);
  }, []);

  useEffetAvantPeinture(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    if (Date.now() - traverseeA.current < TRAVERSEE_FRAICHE_MS) {
      traverseeA.current = 0;
      return;
    }
    //  La fenêtre de fiche est ouverte (ou vient de changer l'adresse) :
    //  la grille reste où elle est.
    if (document.documentElement.dataset.fenetreFiche) return;
    if (window.scrollY === 0) return;
    defilerSansGeste({ top: 0, left: 0 }, "new page (no. 889)");
  }, [chemin, requete]);

  return null;
}
