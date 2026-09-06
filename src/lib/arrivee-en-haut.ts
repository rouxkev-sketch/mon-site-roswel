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
 * CE QUE CE MODULE FAIT : sur toute arrivée sans position mémorisée,
 * poser zéro AVANT la peinture (l'appelant s'en charge, il est dans un
 * effet de mise en page), APRÈS la peinture, à `load` et à
 * `fonts.ready` — le temps d'UNE SECONDE, et pas une de plus.
 *
 * ██ §1 (nº 883) — CE QUE LA 882 FAISAIT DE TROP, ET QUI BLOQUAIT ██
 * ==================================================================
 * LA nº 882 ÉCOUTAIT AUSSI `visualViewport` (resize et scroll) et
 * restait armée JUSQU'AU PREMIER GESTE. Safari s'en est trouvé
 * corrigé ; CHROME iOS, lui, s'est bloqué — relevé du propriétaire :
 * à l'ouverture d'une page, toute la barre fixe (logo, loupe,
 * globe/fanion, avatar) ET le va-et-vient ne répondaient plus à aucun
 * toucher, jusqu'à ce qu'on fasse défiler.
 * LA CAUSE : sur Chrome iOS, le repli de la barre d'adresse fait
 * pleuvoir les événements de `visualViewport` — en continu, et sans
 * qu'aucun pixel du DOCUMENT n'ait bougé. Chacun rappelait la pose ;
 * un `scrollTo` par événement, et le moteur annule le toucher en
 * cours. Ce que l'œil prenait pour « la page est défilée » n'était
 * d'ailleurs pas le document : c'était le VIEWPORT VISUEL, hérité de
 * la page d'origine dont la barre d'adresse était repliée.
 * LES TROIS RÈGLES DU PROPRIÉTAIRE, ÉCRITES ICI :
 *  (a) plus aucune écoute de `visualViewport`, et la garde se DÉSARME
 *      d'elle-même — au plus une seconde après l'arrivée, jamais
 *      « jusqu'au premier geste » ;
 *  (b) AUCUNE POSE N'INTERROMPT UN TOUCHER : un doigt posé, même
 *      immobile, suffit à rendre la main (`unDoigtEstPose`) ;
 *  (c) rien de tout cela ne dépend de l'état de la barre d'adresse.
 * ⚠️ LA PEINTURE ET `load` TOMBENT TOUS DEUX DANS CETTE SECONDE : c'est
 * elle qui borne, et non `load` seul — le recalage tardif de Safari
 * (celui que la 882 a fermé, et qui est corrigé chez le propriétaire)
 * arrive parfois juste après lui.
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
 * contredire l'autre — et depuis la nº 883, les deux s'éteignent
 * ensemble, au bout de la même seconde (`DUREE_DE_LA_GARDE_MS`).
 */
import { auDebutDuGeste, unDoigtEstPose } from "@/lib/geste-toucher";
//  nº 884 — le journal du diagnostic : désarmé, il ne coûte qu'un test
//  de booléen (voir sa note).
import { diagnosticArme, noterDiag } from "@/lib/journal-diagnostic";

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
 * ██ §1 (nº 883) — LA SECONDE, ET PAS PLUS ██
 * ==================================================================
 * COMBIEN DE TEMPS LE SITE DÉFEND SON ZÉRO. La nº 882 ne bornait pas
 * (« jusqu'au premier geste ») : sur Chrome iOS, où les événements de
 * viewport ne s'arrêtent jamais, cela revenait à défendre pour
 * toujours — et à manger les touchers. Une seconde couvre la peinture,
 * `load`, les polices et le repli de la barre d'adresse ; au-delà, un
 * mouvement appartient au visiteur, quoi qu'il arrive.
 * ⚠️ ÉCRITE ICI, LUE DES DEUX CÔTÉS : ce module s'en sert pour sa fin
 * de vie, et `DefilementEnHaut` la passe à la garde de position — les
 * deux mécanismes ne peuvent pas diverger.
 */
export const DUREE_DE_LA_GARDE_MS = 1000;

/**
 * LA POSE, DANS SES DEUX ÉCRITURES — et c'est LA SEULE ÉCRITURE DE LA
 * POSE DE ZÉRO du site : `DefilementEnHaut` l'appelle aussi, entre le
 * DOM et la peinture (la sixième occasion, la plus ancienne).
 */
export function poserLeHaut(): void {
  //  nº 884 — LA POSE S'ÉCRIT, avec ce qu'elle a trouvé et ce qu'elle
  //  laisse : c'est l'unique endroit où le site pose zéro.
  const avant = diagnosticArme() ? Math.round(window.scrollY) : 0;
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  const racine = document.scrollingElement;
  if (racine && racine.scrollTop !== 0) racine.scrollTop = 0;
  if (diagnosticArme()) {
    noterDiag(`POSE ZÉRO · y ${avant} → ${Math.round(window.scrollY)}`);
  }
}

/**
 * TENIR LE HAUT DE CETTE PAGE-CI, une seconde au plus. Rend la
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
    cancelAnimationFrame(image1);
    cancelAnimationFrame(image2);
    window.clearTimeout(fin);
  };
  /** REPOSER, SI C'EST ENCORE À NOUS DE LE FAIRE. */
  function reposer(): void {
    if (!vivant) return;
    //  L'adresse a changé : cette arrivée n'est plus le sujet.
    if (window.location.pathname + window.location.search !== adresse) {
      ranger();
      return;
    }
    //  §1-b (nº 883) — UN DOIGT EST POSÉ : la main est au visiteur, et
    //  un `scrollTo` annulerait son toucher. On rend la main pour de
    //  bon (le geste l'aurait fait de toute façon, un battement plus
    //  tard : `auDebutDuGeste` ci-dessous).
    if (unDoigtEstPose()) {
      noterDiag("MAINTIEN rangé · un doigt est posé (règle b, nº 883)");
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
  //  ── LES MOMENTS TARDIFS DE WEBKIT (voir l'en-tête) — `load` et les
  //     polices, tous deux DANS la seconde.
  window.addEventListener("load", reposer);
  //  ⚠️ `fonts.ready` NE SE RETIRE PAS — une promesse ne s'annule pas.
  //  Le drapeau `vivant` fait le travail : la reprise ne pose rien si
  //  l'on a déjà rangé.
  document.fonts?.ready.then(reposer).catch(() => {});
  //  ── ET LA FIN, QUOI QU'IL ARRIVE (§1-a nº 883).
  const fin = window.setTimeout(() => {
    noterDiag(`MAINTIEN rangé · la seconde est écoulée (${DUREE_DE_LA_GARDE_MS} ms)`);
    ranger();
  }, DUREE_DE_LA_GARDE_MS);
  return ranger;
}
