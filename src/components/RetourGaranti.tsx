"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  aucunePageDuSiteDerriere,
  deposerLeVerdict,
  ligneDeDecision,
  marquerLeVerdictVerse,
  unePageEtrangereEstDerriere,
} from "@/lib/bas-de-la-pile";
import {
  noterDansLeJournal,
  tracesAvantPeinture,
} from "@/lib/journal-historique";

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
 * §1 (nº 346) — CE QUI L'EMPÊCHAIT ENCORE DE S'ARMER.
 * ------------------------------------------------------------------
 * Le relevé en ligne du propriétaire, en navigation privée, montre
 * qu'après la nº 345 le filet ne s'armait toujours pas sur Chrome.
 * ⚠️ CE N'EST PAS LA QUESTION DU RÉFÉRENT : un référent VIDE donne
 * `etranger = false` dans le code de la nº 345 comme dans celui-ci —
 * elle ne pouvait pas faire renoncer le filet. C'est LE RELEVÉ
 * LUI-MÊME QUI MANQUAIT : il n'était fait que par le script d'avant
 * peinture, et sans lui la nº 345 retombait sur `history.length <= 1`,
 * c'est-à-dire sur la règle qu'elle venait de retirer. Le journal du
 * propriétaire le montre : sa première ligne est « ARRIVÉE SUR LA PAGE
 * · sonde », jamais « DOCUMENT OUVERT (avant peinture) » ni la mention
 * « enveloppes déjà posées » — ce bloc du script ne s'exécute pas chez
 * lui, et notre relevé y était.
 * DEUX CHANGEMENTS : le repli sur l'ancienne condition est SUPPRIMÉ
 * (une absence de mesure ne doit jamais rétablir une règle fausse en
 * silence), et lib/bas-de-la-pile PREND LA MESURE LUI-MÊME au
 * chargement du module si le script ne l'a pas faite.
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

/**
 * §1 (nº 346) — LE VOYANT : UNE LIGNE, À L'ARRIVÉE, QUI DIT QUI A DÉCIDÉ.
 * ------------------------------------------------------------------
 * Quatre passes ont été dépensées à DEVINER pourquoi le filet ne
 * s'armait pas, faute de cette ligne. Elle porte la profondeur de pile,
 * le référent EXACT, d'où vient la mesure, et LAQUELLE des deux
 * questions a fermé la porte.
 *
 * Le type d'événement est un type EXISTANT — « ARRIVÉE SUR LA PAGE » —
 * à la demande du propriétaire : aucune sonde n'a de nouveau
 * vocabulaire à apprendre.
 *
 * §A (nº 347) — LA DÉCISION EST D'ABORD DÉPOSÉE, ENSUITE PROPOSÉE AU
 * JOURNAL. À la nº 346 elle n'était qu'écrite : si le journal n'était
 * pas là pour l'entendre, elle disparaissait sans trace, et le
 * propriétaire a perdu un tour à le constater. Désormais le dépôt
 * (lib/bas-de-la-pile) survit, le journal le verse à son ouverture, et
 * son silence même devient une ligne (« aucune décision du filet
 * reçue », journal-historique). La ligne porte AUSSI les traces
 * d'avant peinture — le millésime du script servi en tête — pour
 * démasquer une page périmée sortie d'un cache (branche B).
 */
function dire(decision: string): void {
  const ligne = `${ligneDeDecision(decision)} · ${tracesAvantPeinture()}`;
  deposerLeVerdict(ligne);
  if (noterDansLeJournal("ARRIVÉE SUR LA PAGE", ligne)) {
    marquerLeVerdictVerse();
  }
}

/**
 * §4 (nº 352) — CE QUI VAUT POUR LE DOCUMENT, PAS POUR LA PAGE.
 * ------------------------------------------------------------------
 * L'effet ci-dessous vit et meurt avec CHAQUE adresse (navigations
 * douces comprises) ; le CRAN, lui, vit avec le DOCUMENT. Ces deux
 * drapeaux vivent donc ici, à l'échelle du module — remis à zéro par
 * un vrai chargement, jamais par une navigation douce :
 *  · le cran est-il posé quelque part sous nous ? (l'état de l'entrée
 *    courante ne sait pas le dire : la marque est plus bas dans la
 *    pile) ;
 *  · l'attente d'un appui franc a-t-elle déjà été dite ?
 * SANS EUX, LE JOURNAL MENTAIT (relevé nº 352) : chaque arrivée de
 * fiche rejouait « EN ATTENTE — le cran attend un appui franc » alors
 * que le cran était posé depuis l'accueil. La ligne n'est désormais
 * écrite que si elle est VRAIE : aucun cran encore posé dans ce
 * document, et une seule fois.
 */
let cranPoseDansCeDocument = false;
let attenteDejaDiteDansCeDocument = false;

export function RetourGaranti() {
  const chemin = usePathname();

  useEffect(() => {
    let aNous = true;
    let ecoutePose = false;

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

    function decider() {
      if (!aNous) return;
      //  Déjà posée (un effet rejoué, un remontage, ou l'étape du filet
      //  elle-même) : on n'en pose pas une seconde.
      const etat = window.history.state as Record<string, unknown> | null;
      if (etat?.[MARQUE]) {
        dire("RENONCE — étape déjà posée");
        return;
      }
      //  §1 (nº 345) — LES DEUX MOITIÉS DE LA QUESTION (lib/bas-de-la-pile).
      //  Une page DU SITE derrière : le navigateur fait son travail.
      if (!aucunePageDuSiteDerriere()) {
        dire("RENONCE — une page du site est derrière");
        return;
      }
      //  LA BORNE : il est arrivé d'ailleurs, son retour doit l'y rendre.
      if (unePageEtrangereEstDerriere()) {
        dire("RENONCE — une page étrangère est derrière");
        return;
      }
      dire("ARMÉ");
      window.history.pushState(
        { ...((window.history.state as object | null) ?? {}), [MARQUE]: true },
        ""
      );
      cranPoseDansCeDocument = true;
      window.addEventListener("popstate", auRetour);
      ecoutePose = true;
    }

    /*  ██ LE CRAN N'EST POSÉ QUE SUR UN GESTE DU VISITEUR (nº 350) ██
        ------------------------------------------------------------
        LA RÈGLE, TROUVÉE ET SOURCÉE PAR LE PROPRIÉTAIRE : depuis
        Chrome 127 / iOS 17.5+, le navigateur SAUTE au retour les
        entrées d'historique créées SANS interaction (protection
        anti-piège ; fil navigation-dev de Chromium, « Issue with
        Browser Back Button Skipping Pages in History on Chrome for
        iOS »). Le crédit d'interaction vaut ~10 s et se consomme —
        d'où l'aléatoire des relevés. Notre cran était poussé au
        chargement, sans geste : STRUCTURELLEMENT SAUTABLE. Les POSÉE
        du routeur, nées d'un toucher, sont créditées, elles. Et le
        local s'explique enfin : l'ancien filet (`history.length <= 1`)
        ne s'armait jamais sur Chrome — pas de cran, pas de saut.

        DONC : le cran est posé À LA PREMIÈRE INTERACTION RÉELLE,
        SYNCHRONE dans le gestionnaire de l'événement, pour que
        l'entrée porte le crédit d'activation ; la CAPTURE nous fait
        passer AVANT le clic d'un lien — si le premier geste ouvre
        déjà une fiche, le cran se pose sous elle, dans le bon ordre,
        dans le même geste. Avant le premier toucher, pas de cran : un
        retour immédiat sort du site, et c'est le comportement normal
        du web — accepté par le propriétaire, nº 350. Depuis la
        nº 351, « interaction réelle » veut dire APPUI FRANC RELÂCHÉ,
        plus début de geste — voir le bloc §1 (nº 351) plus bas.

        ⚠️ LA nº 348 (attendre le document fini) visait la même plaie
        avec la mauvaise cause : c'est le CRÉDIT qui manquait, pas la
        stabilité du document. Son attente est retirée — le geste est
        désormais l'unique déclencheur.

        L'AUDIT DEMANDÉ (nº 350) — les autres entrées du site : les
        surfaces refermables, la fenêtre de carrousel et les fenêtres
        de fiche posent toutes leur étape en réponse à un toucher
        (gestionnaire de clic, ou effet déclenché par lui, quelques
        millisecondes après — dans le crédit) ; les POSÉE du routeur
        naissent des liens. Le cran était LA SEULE entrée posée sans
        aucun geste. */
    /*  §1 (nº 351) — L'APPUI FRANC, PAS LE DÉBUT DE DÉFILEMENT.
        ------------------------------------------------------------
        Le relevé de la nº 351 a tranché ma branche annoncée : sur
        Chrome et Brave, le cran posé au `pointerdown` d'un DÉFILEMENT
        (POSÉE·RetourGaranti seule, une seconde avant le premier lien)
        a encore été sauté ; sur Safari, dix retours d'affilée, zéro
        éjection. Un début de défilement n'est pas un geste au crédit
        plein. LA POSE PASSE DONC AU RELÂCHEMENT D'UN APPUI FRANC :
        `pointerup` du même doigt, à moins de dix pixels de son point
        de départ — ou une touche du clavier, ou un `click` là où les
        événements de pointeur n'existent pas. Toujours SYNCHRONE dans
        le gestionnaire, toujours en CAPTURE : si ce premier appui
        franc est le clic d'un lien, le cran se glisse sous la
        navigation dans le même geste. Un défilement n'arme rien —
        l'appui suivant armera ; le journal le dit UNE fois
        (« EN ATTENTE »), pour que le relevé montre la distinction. */
    const SEUIL_APPUI_PX = 10;
    let debut: { id: number; x: number; y: number } | null = null;

    const poserSurCeGeste = () => {
      retirerLesDeclencheurs();
      decider();
    };
    const surAppui = (evenement: PointerEvent) => {
      if (!evenement.isPrimary) return;
      debut = {
        id: evenement.pointerId,
        x: evenement.clientX,
        y: evenement.clientY,
      };
    };
    const surAbandon = (evenement: PointerEvent) => {
      //  Le navigateur a pris le geste pour lui (défilement au doigt) :
      //  ce n'était pas un appui.
      if (debut && evenement.pointerId === debut.id) debut = null;
    };
    const surRelachement = (evenement: PointerEvent) => {
      if (!debut || evenement.pointerId !== debut.id) return;
      const dx = evenement.clientX - debut.x;
      const dy = evenement.clientY - debut.y;
      debut = null;
      if (Math.hypot(dx, dy) > SEUIL_APPUI_PX) {
        /*  §4 (nº 352) — LA LIGNE NE SORT QUE SI ELLE EST VRAIE : cran
            pas encore posé dans CE document, et une seule fois. Le
            relevé nº 352 la montrait sur chaque arrivée de fiche alors
            que le cran était posé depuis l'accueil — elle mentait. */
        if (!cranPoseDansCeDocument && !attenteDejaDiteDansCeDocument) {
          attenteDejaDiteDansCeDocument = true;
          dire(
            "EN ATTENTE — le premier geste était un défilement, le cran attend un appui franc"
          );
        }
        return;
      }
      poserSurCeGeste();
    };
    const surTouche = (evenement: KeyboardEvent) => {
      //  Les touches mortes ne portent pas le crédit d'activation.
      if (["Escape", "Shift", "Control", "Alt", "Meta"].includes(evenement.key)) {
        return;
      }
      poserSurCeGeste();
    };
    //  Filet des navigateurs sans événements de pointeur : un clic est
    //  un appui franc par définition (le navigateur l'a déjà distingué
    //  d'un défilement). Sur le chemin normal, `pointerup` a posé et
    //  retiré cet écouteur avant que le clic n'arrive.
    const surClic = () => poserSurCeGeste();

    const retirerLesDeclencheurs = () => {
      window.removeEventListener("pointerdown", surAppui, true);
      window.removeEventListener("pointercancel", surAbandon, true);
      window.removeEventListener("pointerup", surRelachement, true);
      window.removeEventListener("keydown", surTouche, true);
      window.removeEventListener("click", surClic, true);
    };
    window.addEventListener("pointerdown", surAppui, {
      capture: true,
      passive: true,
    });
    window.addEventListener("pointercancel", surAbandon, {
      capture: true,
      passive: true,
    });
    window.addEventListener("pointerup", surRelachement, {
      capture: true,
      passive: true,
    });
    window.addEventListener("keydown", surTouche, { capture: true });
    window.addEventListener("click", surClic, { capture: true });

    return () => {
      aNous = false;
      retirerLesDeclencheurs();
      if (ecoutePose) window.removeEventListener("popstate", auRetour);
    };
  }, [chemin]);

  return null;
}
