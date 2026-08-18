"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  aucunePageDuSiteDerriere,
  unePageEtrangereEstDerriere,
} from "@/lib/bas-de-la-pile";

/**
 * ON NE SORT JAMAIS DU SITE PAR UN RETOUR — LE FILET
 * ==================================================
 * LE DÉFAUT CORRIGÉ : fermer complètement le navigateur depuis une
 * page du site, puis le rouvrir. On retombe bien sur la page — c'est
 * voulu — mais LE RETOUR ARRIÈRE NE FAIT PLUS RIEN, ou pire, il SORT
 * DU SITE. L'historique de l'onglet est mort avec l'application :
 * l'onglet n'a plus qu'une seule étape, et il n'y a rien derrière.
 * Même chose pour une adresse ouverte depuis un lien partagé, un
 * signet, un code QR, ou une application sans historique à elle.
 *
 * §2 (nº 332) — IL COUVRE MAINTENANT TOUT LE SITE.
 * ------------------------------------------------------------------
 * ⚠️ CE QU'IL ÉTAIT, ET POURQUOI CE N'ÉTAIT PAS ASSEZ. Il ne jouait
 * que sur une FICHE (`/tatoueur/…`), que sur un VRAI MOBILE, et il
 * renvoyait à la mosaïque retenue par le journal persistant. C'était
 * le défaut d'origine de la nº 194, resté ouvert jusqu'ici : sur
 * l'accueil, sur « Ma sélection », sur les pages vitrines, un retour
 * sortait du site. C'est le nº 23 du recensement de la nº 331.
 * MAINTENANT : toute page du site, au doigt COMME sur ordinateur, et
 * la destination est l'ACCUEIL, EN HAUT. C'est la décision du
 * propriétaire à la nº 332 — un onglet qui n'a rien derrière lui est
 * un onglet neuf, et le journal peut y désigner une page vue des
 * heures plus tôt : on ne restitue donc AUCUNE position.
 *
 * ⚠️ ET IL COUVRE AUSSI LE nº 24 : une surface refermable qui se ferme
 * SUR PLACE reprend son étape ; s'il n'y avait rien dessous, le retour
 * suivant sortait. Le filet est posé AVANT toute surface, il est donc
 * toujours dessous — voir la garde `auRetour`.
 *
 * §1 (nº 345) — IL S'ARME MAINTENANT QUEL QUE SOIT LE NAVIGATEUR.
 * ------------------------------------------------------------------
 * ⚠️ CE QUI ÉTAIT ÉCRIT, ET POURQUOI C'ÉTAIT FAUX : `history.length
 * <= 1`. Le propriétaire a relevé, en ligne, sur son iPhone :
 *
 *    SAFARI  — arrivée pile 1 → le filet s'arme → huit allers-retours
 *              sans faute.
 *    CHROME  — arrivée pile 2 → LE FILET NE S'ARME JAMAIS → il sort du
 *              site au premier retour.
 *
 * CHROME SUR IPHONE OUVRE SES ONGLETS AVEC UNE ENTRÉE DÉJÀ EN PLACE.
 * Sur ce navigateur, la condition ne pouvait donc pas être vraie une
 * seule fois : le filet n'existait pas. Reproduit au banc p345-§1.
 *
 * « LA PILE EST-ELLE VIDE ? » N'ÉTAIT PAS LA BONNE QUESTION — ce n'est
 * pas parce qu'il y a une entrée derrière soi qu'elle appartient à
 * quelqu'un. La bonne question, et c'est celle du propriétaire, est
 * « Y A-T-IL UNE VRAIE PAGE DERRIÈRE MOI DANS CET ONGLET ? ». Elle a
 * une écriture unique — lib/bas-de-la-pile — et deux moitiés :
 *  · UNE PAGE DE CE SITE ? notre propre marque répond (la profondeur
 *    relevée à l'arrivée, avant que rien n'ait pu empiler) ;
 *  · UNE PAGE ÉTRANGÈRE ? le référent répond, et lui seul.
 *
 * LA BORNE QU'ON NE FRANCHIT PAS RESTE ENTIÈRE. Si le visiteur est
 * arrivé depuis Instagram DANS LE MÊME ONGLET, son retour doit le
 * RAMENER À INSTAGRAM — c'est son droit, et le retenir de force serait
 * malhonnête. Le filet ne joue que quand il n'y a VRAIMENT rien
 * derrière : ni à nous, ni à personne.
 *
 * COMMENT : on empile une étape SANS ADRESSE (`pushState` à deux
 * arguments — jamais trois : passer une adresse fait repartir le
 * routeur de Next). L'onglet a désormais deux étapes ; le retour en
 * dépile une, produit un `popstate`, et c'est nous qui décidons alors
 * où aller.
 *
 * ⚠️ IL NE COÛTE AUCUN APPUI SUPPLÉMENTAIRE À UNE SURFACE. Une surface
 * refermable pose SON étape par-dessus la nôtre, et son état RECOPIE
 * le nôtre (voir lib/etape-refermable) : tant que la marque
 * `retourReconstruit` est encore là, c'est qu'on est AU-DESSUS du
 * filet — il ne bouge pas. Il n'agit que lorsqu'un retour l'a
 * dépassée par le bas, c'est-à-dire quand le prochain retour sortirait
 * du site.
 *
 * `replace` et non `push` : l'étape de secours a servi, elle disparaît.
 */

/** La marque de notre étape, recopiée par toute étape posée au-dessus. */
const MARQUE = "retourReconstruit";

export function RetourGaranti() {
  const chemin = usePathname();

  useEffect(() => {
    //  Déjà posée (un effet rejoué, un remontage, ou l'étape du filet
    //  elle-même) : on n'en pose pas une seconde.
    const etat = window.history.state as Record<string, unknown> | null;
    if (etat?.[MARQUE]) return;
    //  §1 (nº 345) — LES DEUX MOITIÉS DE LA QUESTION (lib/bas-de-la-pile).
    //  Une page DU SITE derrière : le navigateur fait son travail.
    if (!aucunePageDuSiteDerriere()) return;
    //  LA BORNE : il est arrivé d'ailleurs, son retour doit l'y rendre.
    if (unePageEtrangereEstDerriere()) return;

    let aNous = true;
    window.history.pushState(
      { ...((window.history.state as object | null) ?? {}), [MARQUE]: true },
      ""
    );

    function auRetour() {
      if (!aNous) return;
      /*  ⚠️ ON NE BOUGE QUE SI LE RETOUR NOUS A DÉPASSÉS PAR LE BAS.
          Une surface refermable pose son étape AU-DESSUS de la nôtre,
          en recopiant notre marque : la refermer ramène sur une étape
          qui la porte encore, et le filet doit alors se taire. Sans
          cette garde, refermer un panneau enverrait à l'accueil. */
      const ici = window.history.state as Record<string, unknown> | null;
      if (ici?.[MARQUE]) return;
      aNous = false;
      /*  ⚠️ `location.replace` ET NON le routeur de Next. Mesuré à la
          nº 190 : une navigation du routeur lancée DEPUIS un `popstate`
          ne part pas — le routeur est occupé à traiter la traversée
          qu'on vient de provoquer. Le remplacement du navigateur, lui,
          aboutit toujours, et l'étape consommée disparaît proprement.
          ⚠️ AUCUNE RESTITUTION DE POSITION DEMANDÉE : l'accueil s'ouvre
          EN HAUT (nº 332-§2), c'est un écran neuf. */
      window.location.replace("/");
    }

    window.addEventListener("popstate", auRetour);
    return () => {
      aNous = false;
      window.removeEventListener("popstate", auRetour);
    };
  }, [chemin]);

  return null;
}
