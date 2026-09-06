/**
 * ██ UNE ARRIVÉE SANS POSITION MÉMORISÉE COMMENCE EN HAUT, ET Y RESTE ██
 * ==================================================================
 * (passe nº 882 — la nº 881 n'a pas suffi, et voici pourquoi)
 *
 * CE QUE LE PROPRIÉTAIRE MESURE, SUR IPHONE, SAFARI ET CHROME (donc
 * WebKit dans les deux cas) : on ouvre une page depuis une page
 * légèrement défilée, et la nouvelle page est VRAIMENT défilée de
 * quelques pixels — elle bouge encore vers le haut quand on la tire au
 * doigt. Sur TOUTES les pages, pas seulement les fiches.
 *
 * POURQUOI UNE SEULE POSE NE SUFFIT PAS SUR WEBKIT. Le défilement de la
 * page qu'on quitte survit à la navigation douce (le document ne change
 * pas, seul son contenu est remplacé), et WebKit le RÉTABLIT APRÈS
 * notre pose — pas une fois, mais à chaque étape tardive de la mise en
 * page :
 *  · le repli de la barre d'adresse, qui change la hauteur utile ;
 *  · `visualViewport` qui se redimensionne dans la foulée ;
 *  · les polices qui arrivent et rallongent le document ;
 *  · le rebond élastique (« rubber-band ») en fin de geste ;
 *  · une mise en page tardive quand les images prennent leur place.
 * Chacune de ces étapes est un moment où le moteur « retrouve » la
 * position qu'il croyait bonne. Poser zéro entre le DOM et la peinture
 * — ce que le site fait depuis la nº 191 — arrive AVANT toutes.
 *
 * CE QUE CE MODULE FAIT, ET C'EST LA CONSIGNE DU PROPRIÉTAIRE, MOT POUR
 * MOT : sur toute arrivée sans position mémorisée, poser zéro AVANT la
 * peinture (l'appelant s'en charge, il est dans un effet de mise en
 * page), APRÈS la peinture, à `load`, à `fonts.ready`, à CHAQUE
 * redimensionnement de `visualViewport` — et rester armé jusqu'au
 * PREMIER GESTE du visiteur.
 *
 * LES DEUX ÉCRITURES DE LA POSE, ET IL EN FAUT DEUX : `window.scrollTo`
 * ne suffit pas partout — sur WebKit, l'élément qui défile vraiment est
 * `document.scrollingElement`, et lui écrire `scrollTop` atteint des
 * cas que la première manque. Les deux ensemble ne coûtent rien : la
 * seconde ne fait rien quand la première a réussi.
 *
 * ⚠️ CE MODULE NE COMBAT JAMAIS UNE INTENTION. Il s'arrête net dès que :
 *  · un GESTE commence (`auDebutDuGeste` — la règle du site depuis la
 *    nº 427 : dès que la main est au visiteur, la position lui
 *    appartient) ;
 *  · l'ADRESSE change (cette arrivée-ci n'est plus le sujet) ;
 *  · l'écart dépasse LE PLAFOND (nº 881-§2) — quelques pixels sont un
 *    recalage, quelques centaines sont voulues (le site qui repose une
 *    place, un banc qui mesure).
 * ⚠️ ET IL NE REMPLACE PAS LA GARDE DE POSITION (nº 661) : il la
 * complète. La garde répond aux événements `scroll` ; ce module-ci
 * répond aux MOMENTS où WebKit recale sans qu'aucun `scroll` ne soit
 * encore parti. Les deux visent la même valeur, aucune ne peut
 * contredire l'autre.
 */
import { auDebutDuGeste } from "@/lib/geste-toucher";

/**
 * ██ L'AMPLITUDE QU'UN RECALAGE DE MOTEUR PEUT AVOIR (nº 881-§2) ██
 * ==================================================================
 * LE PLAFOND, ÉCRIT UNE SEULE FOIS ET LU DES DEUX CÔTÉS : par ce
 * module (qui repose aux moments tardifs) et par `DefilementEnHaut`
 * (qui arme la garde de position). Le propriétaire décrit « quelques
 * pixels » : quarante est large pour un recalage, et dérisoire pour
 * une intention — un défilement voulu se compte en centaines. Au-delà,
 * les deux mécanismes s'effacent : le mouvement est VOULU (le site qui
 * repose une place, un banc qui mesure), et rien ne doit le combattre.
 */
export const ECART_DE_RECALAGE_PX = 40;

/**
 * LA POSE, DANS SES DEUX ÉCRITURES — et c'est LA SEULE ÉCRITURE DE LA
 * POSE DE ZÉRO du site : `DefilementEnHaut` l'appelle aussi, entre le
 * DOM et la peinture (la sixième occasion, la plus ancienne).
 */
export function poserLeHaut(): void {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  const racine = document.scrollingElement;
  if (racine && racine.scrollTop !== 0) racine.scrollTop = 0;
}

/**
 * TENIR LE HAUT DE CETTE PAGE-CI jusqu'au premier geste. Rend la
 * fonction qui range tout — l'appelant la donne à React, qui l'appelle
 * au démontage (changement de page compris).
 */
export function tenirLeHautDeLaPage(): () => void {
  if (typeof window === "undefined") return () => {};
  const adresse = window.location.pathname + window.location.search;
  let vivant = true;
  const ranger = () => {
    if (!vivant) return;
    vivant = false;
    quitterLeGeste();
    window.removeEventListener("load", reposer);
    window.visualViewport?.removeEventListener("resize", reposer);
    window.visualViewport?.removeEventListener("scroll", reposer);
    cancelAnimationFrame(image1);
    cancelAnimationFrame(image2);
  };
  /** REPOSER, SI C'EST ENCORE À NOUS DE LE FAIRE. */
  function reposer(): void {
    if (!vivant) return;
    //  L'adresse a changé : cette arrivée n'est plus le sujet.
    if (window.location.pathname + window.location.search !== adresse) {
      ranger();
      return;
    }
    const y = Math.round(window.scrollY);
    if (y === 0) return;
    //  Un grand écart est VOULU : on s'efface (nº 881-§2).
    if (y > ECART_DE_RECALAGE_PX) {
      ranger();
      return;
    }
    poserLeHaut();
  }
  //  ── LE PREMIER GESTE REND LA MAIN, définitivement.
  const quitterLeGeste = auDebutDuGeste(() => ranger());
  //  ── APRÈS LA PEINTURE : deux images, le temps que le moteur ait
  //     fini de composer la première vue.
  let image2 = 0;
  const image1 = requestAnimationFrame(() => {
    reposer();
    image2 = requestAnimationFrame(reposer);
  });
  //  ── LES MOMENTS TARDIFS DE WEBKIT (voir l'en-tête).
  window.addEventListener("load", reposer);
  window.visualViewport?.addEventListener("resize", reposer);
  window.visualViewport?.addEventListener("scroll", reposer);
  //  ⚠️ `fonts.ready` NE SE RETIRE PAS — une promesse ne s'annule pas.
  //  Le drapeau `vivant` fait le travail : la reprise ne pose rien si
  //  l'on a déjà rangé.
  document.fonts?.ready.then(reposer).catch(() => {});
  return ranger;
}
