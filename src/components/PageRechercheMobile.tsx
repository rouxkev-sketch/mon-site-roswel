"use client";

import { noter } from "@/lib/journal-bascule";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
//  §2 (nº 427) — la garde de position : l'OUVERTURE la désarme (cette
//  page déplace le défilement pour elle-même, la garde combattrait le
//  scrollTo vers 0 ci-dessous) ; la SORTIE l'arme sur la place rendue
//  (l'ancrage de WebKit peut recaler après le retour aux résultats).
import {
  armerLaGardeDePosition,
  desarmerLaGardeDePosition,
} from "@/lib/defilement-programme";
import { positionSousLeGel } from "@/lib/gel-du-corps";
//  §3 (nº 330) — l'étape d'historique, écriture unique des quatre
//  surfaces qui couvrent l'écran.
import { useEtapeQuiSeReferme } from "@/lib/etape-refermable";
import { IconeCroix, IconeLoupe } from "@/components/Icones";
import { OngletsLigne } from "@/components/OngletsLigne";
import {
  lireDefilementResultats,
  memoriserDefilementResultats,
  type VueRecherche,
} from "@/lib/recherche-mobile";

/**
 * LA PAGE DE RECHERCHE PLEIN ÉCRAN (smartphone)
 * ==============================================
 * ELLE REMPLACE LA FENÊTRE SUPERPOSÉE, ET C'EST UNE DÉCISION DE FOND.
 *
 * Dix passes ont été consacrées à faire tenir une fenêtre flottante
 * pendant que le clavier d'iOS arrive : glissement de l'arrière-plan,
 * saccades, bande blanche, menu mal placé, page qui descend. Chaque
 * correction en produisait une autre, parce que la cause était
 * STRUCTURELLE : un élément qu'il faut repositionner à la main quand
 * iOS déplace le viewport visuel, réduit le viewport de mise en page,
 * et ne donne aucune mesure qui décrive complètement ce mouvement.
 *
 * UNE PAGE NORMALE N'A RIEN À REPOSITIONNER. Le navigateur fait
 * défiler le document pour amener le champ au-dessus des touches —
 * c'est son travail, il le fait sur iOS comme sur Android, et il le
 * fait mieux que nous. C'est ce que font Apple, Airbnb et Booking sur
 * mobile : toucher la barre de recherche ouvre une PAGE.
 *
 * DEUX ÉTATS, ET UN SEUL COMPTE VRAIMENT
 * ---------------------------------------
 * · « posée » — L'ÉTAT DE TRAVAIL, celui où vit le clavier. La page
 *   est en FLUX NORMAL dans le document (`position: static`), le reste
 *   du site est retiré du flux (voir `data-recherche` dans
 *   globals.css), et le document ne contient donc plus qu'elle : il
 *   défile pour elle seule. AUCUNE mesure, AUCUN écouteur de viewport,
 *   AUCUNE compensation. C'est tout l'intérêt de la refonte.
 * · « arrive » / « part » — LA GLISSADE, et rien d'autre. La page est
 *   momentanément `position: fixed` pour passer PAR-DESSUS les
 *   résultats pendant qu'elle les couvre. Aucun champ n'a le doigt à
 *   cet instant, aucun clavier n'est en jeu : c'est une translation,
 *   pas un placement. Seul `transform` est animé — le navigateur la
 *   peint sans recalculer la moindre mise en page.
 *
 * ELLE NE TOUCHE PLUS À L'HISTORIQUE — PLUS DU TOUT (nº 194-§4)
 * ------------------------------------------------------------------
 * ⚠️ ELLE POSAIT UNE ÉTAPE À L'OUVERTURE (`pushState` sans adresse) ET
 * LA RETIRAIT ELLE-MÊME (`history.back()`) AVANT DE VALIDER. C'était le
 * seul endroit du site qui manipulait l'historique à la main, et le
 * seul candidat restant au défaut du propriétaire : sur Chrome pour
 * iPhone, après plusieurs recherches, un retour ne ramenait ni aux
 * recherches précédentes ni à l'accueil — il sortait du site. Ce
 * va-et-vient exige que le navigateur retire l'étape EXACTEMENT quand
 * on le lui demande ; rien ne le garantit d'un navigateur à l'autre, et
 * une étape retirée de trop suffit à effacer l'accueil.
 *
 * ELLE EST DONC UN PANNEAU POSÉ PAR-DESSUS, INVISIBLE POUR LE
 * NAVIGATEUR. Elle n'ajoute ni ne retire aucune étape. SEULE LA
 * VALIDATION D'UNE RECHERCHE en crée une — par un changement d'adresse
 * ordinaire, comme partout ailleurs sur le site.
 *
 * CE QUE CELA CHANGE POUR LA PERSONNE : le retour arrière du navigateur
 * (et le geste depuis le bord de l'écran) ne referme plus la page de
 * recherche — il quitte la page en cours, comme il l'aurait fait sans
 * elle ; la page se referme alors sans rien appliquer. Les trois portes
 * de sortie visibles restent inchangées : la croix, « Valider » et la
 * touche Échap.
 */

/**
 * LES DEUX GLISSADES (nº 153-§3) — deux durées, deux courbes.
 * L'ARRIVÉE arrive vite et SE POSE : décélération appuyée, 380 ms —
 * la page franchit l'essentiel du chemin en un tiers de seconde puis
 * s'installe sans rebond. LA SORTIE, elle, S'ARRACHE : accélération
 * franche, 240 ms — elle s'incline puis file, sans traîner au bord de
 * l'écran. Ce sont les courbes de mouvement des grandes interfaces
 * (Material « emphasized », même famille que les feuilles d'iOS).
 * ⚠️ CES DURÉES NE COMMANDENT PLUS LA FIN : c'est `transitionend` qui
 * la dit (voir plus bas). Elles ne règlent QUE la vitesse.
 */
const DUREE_ARRIVEE_MS = 380;
const COURBE_ARRIVEE = "cubic-bezier(0.05, 0.7, 0.1, 1)";
const DUREE_SORTIE_MS = 240;
const COURBE_SORTIE = "cubic-bezier(0.3, 0, 0.8, 0.15)";

/** LE FILET DES FINS DE GLISSADE : si `transitionend` ne vient jamais
    (onglet en arrière-plan, mouvement réduit), la fin est prononcée
    quand même — un peu après la durée nominale, jamais avant. */
const MARGE_FILET_MS = 160;

/** Où en est la page. « posée » est le seul état où l'on saisit. */
type Phase = "arrive" | "posee" | "part";

/*  ⚠️ LA BASCULE « Recherche / Filtres » EST DE RETOUR (nº 141) — la
    page unique de la nº 139 était trop chargée, le propriétaire l'a
    constaté sur son téléphone. Elle revient dans la GRAMMAIRE DE LA
    CHARTE : les mots côte à côte sur la ligne fine au segment rose
    (OngletsLigne), plus jamais la piste à fond rose plein d'avant. */

export function PageRechercheMobile({
  vue,
  surVue,
  onValider,
  onAbandonner,
  onEffacer,
  children,
}: {
  /** L'onglet affiché — « tatouage » (Réalisation) ou « flash »
      (§1, nº 447). */
  vue: VueRecherche;
  surVue: (vue: VueRecherche) => void;
  /** « Valider » : la SEULE porte qui lance la recherche. */
  onValider: () => void;
  /** La croix et le retour arrière : on referme sans rien appliquer. */
  onAbandonner: () => void;
  /** Remet à zéro LA VUE AFFICHÉE (page ouverte, sans chercher). */
  onEffacer: () => void;
  children: React.ReactNode;
}) {
  /**
   * ⚠️ L'ARRIVÉE EST TOUJOURS JOUÉE, MÊME SI L'ÉTAPE D'HISTORIQUE EST
   * DÉJÀ POSÉE — ET C'EST UNE LEÇON PAYÉE COMPTANT.
   * Une version de cette passe sautait la glissade quand l'étape
   * existait déjà, pour éviter de revoir la page descendre après un
   * remontage. Mais React rejoue les effets sur une MÊME instance (mode
   * strict, Fast Refresh) sans remettre `useState` à zéro : la branche
   * « déjà posée » se déclenchait alors que `enPlace` valait encore
   * faux, et la page RESTAIT HORS ÉCRAN, translatée de −100 % — dans le
   * DOM, avec son marqueur, mais invisible. Impossible de distinguer
   * les deux cas par l'état, et le mauvais côté du pari coûte une page
   * blanche. On joue donc l'arrivée à chaque montage : au pire une
   * glissade de trois dixièmes de seconde, jamais un écran vide.
   */
  const [phase, setPhase] = useState<Phase>("arrive");
  /** Vrai = la page est à sa place ; faux = hors écran, par le haut. */
  const [enPlace, setEnPlace] = useState(false);
  /** LE CONTENEUR — c'est lui qui glisse, et c'est sur LUI qu'on
      écoute la fin de la transition (nº 153-§3). */
  const conteneur = useRef<HTMLDivElement>(null);
  /** LE DÉFILEMENT DE LA PAGE AU MOMENT DE LA SORTIE (nº 153-§2).
      La page posée est EN FLUX : quand on la regardait défilée de
      `s` pixels, la refixer en haut de l'écran ferait SAUTER son
      contenu de `s` pixels avant la glissade — le fond repartait du
      haut pendant que les badges changeaient de place. On fige donc
      la page LÀ OÙ L'ŒIL LA VOYAIT (`top: -s`), et tout part d'un
      seul geste. Posé AVEC le passage en phase « part » : React
      groupe les deux, un seul rendu, aucun état intermédiaire. */
  const [decalageSortie, setDecalageSortie] = useState(0);
  /** La sortie en cours valide-t-elle la recherche ? Lu par l'effet
      avant peinture qui rend le site au flux (position à restituer). */
  const [validerEnSortant, setValiderEnSortant] = useState(false);

  /**
   * LA FIN D'UNE GLISSADE, DITE PAR LA TRANSITION ELLE-MÊME
   * (nº 153-§3) — et plus par un minuteur.
   * ⚠️ C'ÉTAIT LA CAUSE DU « COUP SEC » : le minuteur partait au
   * changement d'état React, mais la transition ne démarre qu'une à
   * deux images plus tard (double `requestAnimationFrame`). Le
   * minuteur sonnait donc AVANT la fin de la course : l'arrivée
   * sautait ses derniers pixels d'un coup, et la sortie était
   * DÉMONTÉE en plein vol (mesuré : coupée à −567 px sur −717).
   * `transitionend` dit la vraie fin ; le minuteur ne reste qu'en
   * FILET, un peu plus long, pour les cas où la transition ne joue
   * pas (mouvement réduit, onglet caché).
   */
  function aLaFinDeLaGlissade(duree: number, faire: () => void) {
    const element = conteneur.current;
    let fait = false;
    const conclure = () => {
      if (fait) return;
      fait = true;
      element?.removeEventListener("transitionend", surFin);
      faire();
    };
    function surFin(evenement: TransitionEvent) {
      if (evenement.target !== element) return;
      if (evenement.propertyName !== "transform") return;
      conclure();
    }
    element?.addEventListener("transitionend", surFin);
    const filet = window.setTimeout(conclure, duree + MARGE_FILET_MS);
    return () => {
      window.clearTimeout(filet);
      element?.removeEventListener("transitionend", surFin);
    };
  }

  /** Les sorties changent d'un rendu à l'autre : on les lit dans une
      référence, jamais dans les dépendances d'un effet (l'effet se
      démonterait et se remonterait à chaque frappe). */
  const sorties = useRef({ onValider, onAbandonner });
  useEffect(() => {
    sorties.current = { onValider, onAbandonner };
  }, [onValider, onAbandonner]);

  /**
   * L'ARRIVÉE — l'étape d'historique, puis la glissade.
   * À la fin de la glissade seulement, la page se POSE : le reste du
   * site quitte le flux et le document devient le sien. Faire les deux
   * d'un coup ferait disparaître les résultats d'un bloc au lieu de les
   * laisser se couvrir.
   */
  useEffect(() => {
    // ⚠️ LA POSITION DES RÉSULTATS N'EST PRISE QU'À LA PREMIÈRE
    // OUVERTURE : si l'étape est déjà posée, le document ne montre
    // plus les résultats (il est à la page de recherche), et relire
    // `scrollY` écraserait la bonne valeur par un zéro.
    //  ⚠️ LA POSITION DES RÉSULTATS N'EST PRISE QUE TANT QU'ILS SONT
    //  ENCORE DANS LE DOCUMENT : une fois la page posée
    //  (`data-recherche`), le reste du site a quitté le flux, et relire
    //  `scrollY` écraserait la bonne valeur par un zéro.
    if (!document.documentElement.dataset.recherche) {
      //  §2 (nº 328) — sous le gel, jamais brute (point 4). La
      //  garde `data-recherche` ci-dessus reste : elle dit que les
      //  résultats sont ENCORE DANS LE FLUX. Celle-ci dit qu'ils ne
      //  sont pas SOUS UNE SURFACE — une feuille de menu ouverte
      //  quand on touche la barre, par exemple.
      memoriserDefilementResultats(positionSousLeGel());
    }

    //  ⚠️ DEUX IMAGES, PAS UNE (nº 153-§3) : une seule laissait le
    //  navigateur regrouper l'état de départ (−100 %) et l'état
    //  d'arrivée (0) dans la même peinture — aucune transition, la
    //  page APPARAISSAIT d'un coup. La première image peint la page
    //  hors écran, la seconde lance la glissade. C'est déjà la règle
    //  de la sortie, l'arrivée la suit enfin.
    let imageSuivante = 0;
    const image = requestAnimationFrame(() => {
      imageSuivante = requestAnimationFrame(() => setEnPlace(true));
    });
    const rompre = aLaFinDeLaGlissade(DUREE_ARRIVEE_MS, () => {
      document.documentElement.dataset.recherche = "ouverte";
      setPhase("posee");
      // Le document ne contient plus qu'elle : on repart de son haut.
      //  §2 (nº 427) — une garde encore armée (une restitution, une
      //  liste neuve) défendrait l'ancienne position CONTRE ce
      //  scrollTo : cette page déplace le défilement pour elle-même,
      //  la garde n'a plus rien à y défendre.
      desarmerLaGardeDePosition();
      //  §3 (nº 426) — la pose s'écrit (aucun poseur anonyme).
      noter("POSE DE DÉFILEMENT · vers 0 · par PageRechercheMobile (ouverture)");
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });

    return () => {
      cancelAnimationFrame(image);
      cancelAnimationFrame(imageSuivante);
      rompre();
      // FILET DE SÉCURITÉ : quel que soit le chemin de démontage, le
      // site retrouve son flux. Sans lui, un démontage imprévu
      // laisserait la page blanche.
      delete document.documentElement.dataset.recherche;
    };
  }, []);

  /** LA GLISSADE DE SORTIE — le site reparaît DERRIÈRE la page, à sa
      position, et la page remonte par le haut. Rien n'est mesuré : on
      remet le défilement qu'on avait pris, c'est tout.
      « Valider » rend les résultats EN HAUT : une nouvelle recherche se
      lit depuis sa première carte, pas depuis le milieu de l'ancienne. */
  function glisserDehors(valider: boolean) {
    if (phase === "part") return;
    //  ⚠️ LE DÉFILEMENT EST PRIS AVANT TOUT LE RESTE (nº 153-§2) : la
    //  page part de LÀ OÙ L'ŒIL LA VOYAIT — `top: -s` sur le conteneur
    //  refixé, et plus jamais du haut du document. Sans cela, le
    //  contenu SAUTAIT de `s` pixels (mesuré : badge 432 → 581) avant
    //  de glisser : deux mouvements au lieu d'un.
    setDecalageSortie(phase === "posee" ? window.scrollY : 0);
    setValiderEnSortant(valider);
    setPhase("part");
    // Deux images : la première peint la page redevenue fixe à sa
    // place, la seconde lance la transition. Une seule, et le
    // navigateur regrouperait les deux valeurs — aucun mouvement.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setEnPlace(false))
    );
    aLaFinDeLaGlissade(DUREE_SORTIE_MS, () => {
      //  §3 (nº 330) — L'ÉTAPE EST REPRISE PAR `useEtapeQuiSeReferme`,
      //  au démontage de cette page et à ce moment-là seulement : il
      //  n'y a rien à attendre ici, on conclut.
      const { onValider: valide, onAbandonner: abandonne } = sorties.current;
      if (valider) valide();
      else abandonne();
    });
  }

  /**
   * LE SITE REVIENT DANS LE FLUX **AVEC** LA PAGE REFIXÉE — dans le
   * même effet avant peinture, jamais entre deux (nº 153-§2).
   * ⚠️ Faire ces deux gestes DANS `glisserDehors` ouvrait une fenêtre :
   * le site rendu au flux tout de suite, la page encore en flux
   * derrière lui jusqu'au rendu suivant — un instant où le document
   * mesurait site + page empilés. Chromium ne le peignait pas ; rien
   * ne garantissait que Safari en fasse autant. Ici, React a DÉJÀ posé
   * la page en `fixed` quand l'effet s'exécute, et la peinture
   * n'arrive qu'après : les deux états sont indissociables à l'écran.
   */
  /*  §1 (nº 334) — ET ON NE REMONTE PLUS LA PAGE QU'ON QUITTE.
      ------------------------------------------------------------------
      CE QUI ÉTAIT ÉCRIT : « Valider » posait le document À ZÉRO ici même,
      au DÉBUT de la glissade de sortie. Le propriétaire l'a décrit
      exactement : « au moment où je valide, LA PAGE REMONTE — je vois le
      haut de l'accueil, PUIS les résultats s'affichent ». Pendant les
      240 ms de la glissade, l'ancienne liste est encore là, et on la
      voyait remonter.
      MAINTENANT : on rend le document à la place où il était, dans les
      DEUX cas. La liste NEUVE, elle, est posée en haut par
      `laListeServieEstArrivee` (lib/liste-neuve), à son arrivée et AVANT
      SA PEINTURE — jamais sur celle qu'on quitte. Une liste neuve
      s'ouvre en haut parce qu'elle est neuve, pas parce qu'on a fait
      remonter l'ancienne sous les yeux de quelqu'un. */
  useLayoutEffect(() => {
    if (phase !== "part") return;
    delete document.documentElement.dataset.recherche;
    /*  §3 (nº 426) — la pose s'écrit, avec la valeur relue : c'est la
        position d'AVANT l'ouverture, rendue au site pendant la
        glissade de sortie (nº 334-§1). */
    const place = lireDefilementResultats();
    noter(
      `POSE DE DÉFILEMENT · vers ${Math.round(place)} · ` +
        "par PageRechercheMobile (sortie — la place d'avant l'ouverture)"
    );
    window.scrollTo({
      top: place,
      left: 0,
      behavior: "instant",
    });
    /*  §2 (nº 427) — la place rendue se DÉFEND, comme toute pose : les
        cartes des résultats rechargent leurs images derrière la
        glissade, et l'ancrage de WebKit peut recaler. Une validation
        re-armera la garde sur 0 quand la liste neuve posera la sienne
        (lib/liste-neuve) — la dernière pose gagne, c'est l'ordre
        naturel. */
    armerLaGardeDePosition(
      place,
      "PageRechercheMobile (sortie — la place d'avant l'ouverture)"
    );
  }, [phase, validerEnSortant]);

  /** LA CROIX ET « VALIDER » — ils glissent, et rien d'autre : c'est le
      démontage qui reprend l'étape posée à l'ouverture (nº 330-§3), et
      lui seul. */
  function fermer(valider: boolean) {
    glisserDehors(valider);
  }

  /**
   * §3 (nº 330) — ELLE POSE DE NOUVEAU UNE ÉTAPE, ET LE RETOUR LA
   * REFERME AU LIEU DE QUITTER LA PAGE.
   * ==================================================================
   * ⚠️ CECI REVIENT SUR LA DÉCISION DE LA nº 194-§4, ET IL FAUT LE
   * DIRE. Cette page posait une étape puis LA RETIRAIT ELLE-MÊME
   * (`history.back()`) AVANT DE VALIDER — un va-et-vient qui exigeait
   * du navigateur qu'il dépile exactement quand on le lui demandait.
   * Sur Chrome pour iPhone, une étape de trop retirée effaçait
   * l'accueil : on sortait du site. C'est ce défaut-là qui avait fait
   * renoncer à toute étape.
   * CE N'EST PAS LE MÊME MÉCANISME QU'ON REMET. Celui-ci
   * (lib/etape-refermable) ne dépile QUE dans un cas, et seulement
   * après avoir VÉRIFIÉ que l'étape du dessus porte sa propre marque :
   * une fermeture par la croix ou par Échap. Le retour du navigateur,
   * lui, ne dépile rien du tout — le navigateur l'a déjà fait. Il n'y
   * a plus aucun aller-retour à la main, donc plus rien à retirer « de
   * trop ». Le propriétaire l'a redemandé explicitement à la nº 330 :
   * sur un téléphone, le retour doit refermer ce qui est ouvert.
   */
  /*  §1 (nº 331) — « VALIDER » CHANGE D'ADRESSE, et c'est `validerLaPage`
      (MoteurTatouage) qui le DIT au module commun, par
      `laSurfaceVaNaviguer()`. Le drapeau qui vivait ici a disparu :
      il n'y a plus qu'une seule façon de dire « la navigation gagne »,
      la même pour les liens et pour le code qui navigue. */
  useEtapeQuiSeReferme(true, () => glisserDehors(false));

  /** Échap referme comme la croix. Sans tableau de dépendances :
      l'écouteur voit toujours la phase courante. */
  useEffect(() => {
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") fermer(false);
    }
    document.addEventListener("keydown", auClavier);
    return () => document.removeEventListener("keydown", auClavier);
  });

  const enGlissade = phase !== "posee";

  return createPortal(
    <div
      // ⚠️ CE MARQUEUR EST LU PAR globals.css : c'est lui qui distingue
      // la page du reste du site quand celui-ci quitte le flux.
      data-page-recherche=""
      role="dialog"
      aria-modal="true"
      aria-label="Rechercher un tatoueur"
      ref={conteneur}
      style={
        enGlissade
          ? {
              transform: enPlace ? "translateY(0)" : "translateY(-100%)",
              transition: `transform ${
                phase === "part"
                  ? `${DUREE_SORTIE_MS}ms ${COURBE_SORTIE}`
                  : `${DUREE_ARRIVEE_MS}ms ${COURBE_ARRIVEE}`
              }`,
              //  LA SORTIE PART DE LÀ OÙ L'ŒIL ÉTAIT (nº 153-§2) : la
              //  page refixée garde le décalage qu'elle avait en flux.
              //  À l'arrivée il vaut zéro — la page couvre l'écran.
              top: phase === "part" ? -decalageSortie : 0,
            }
          : undefined
      }
      className={`${
        enGlissade
          ? // LA GLISSADE : par-dessus les résultats, le temps de les
            // couvrir. Seul `transform` bouge — aucune mise en page à
            // recalculer, le navigateur peint sur le compositeur.
            // ⚠️ PLUS DE `bottom: 0` (nº 153-§2) : borner la hauteur à
            // l'écran faisait SAUTER un contenu plus grand que lui au
            // moment de refixer. La hauteur reste celle du CONTENU
            // (comme en flux, au pixel près), le plancher couvre
            // l'écran, et « −100 % » veut dire « toute sa hauteur » —
            // la page sort entière, jamais coupée.
            "fixed inset-x-0 z-[70] min-h-[100dvh] will-change-transform"
          : // POSÉE : une PAGE, en flux normal. Aucune position, aucun
            // repère d'écran — le navigateur fait défiler le document
            // pour dégager le champ du clavier, et c'est tout.
            "relative z-[70] min-h-[100dvh] w-full"
      } flex flex-col bg-sombre-fond text-sombre-texte
         motion-reduce:transition-none`}
    >
      {/* LA CROIX, EN HAUT À DROITE — la sortie sans appliquer. Le
          rembourrage haut respecte l'encoche : en application installée
          (barre d'état translucide), le contenu passerait dessous.

          ⚠️ CETTE LIGNE EST COLLANTE (`sticky`), ET C'EST DÉLIBÉRÉ.
          Quand on touche le champ de localité, la page défile pour
          l'amener en haut de l'écran (voir ChampLocalisation) : tout
          ce qui le précède sort alors par le haut. La CROIX, elle, est
          une des trois sorties — elle doit rester atteignable même au
          milieu d'une saisie. `sticky` est du CSS pur : le navigateur
          s'en charge, rien n'est mesuré ni déplacé à la main.
          Le fond opaque est obligatoire : sans lui, le contenu
          défilerait en transparence derrière la croix. */}
      {/*  L'EN-TÊTE (refait à la nº 144-§10) — DEUX LIGNES :
            1. le TITRE « Recherche », précédé de sa LOUPE, et la CROIX
               NUE à droite (plus de cercle depuis la nº 141-2A — le
               dessin seul, la zone tactile de 44 px reste, invisible) ;
            2. dessous, la BASCULE « Explorer / Filtres » — DESCENDUE
               du bord de l'écran auquel elle collait, l'espace du
               titre respire au-dessus d'elle.
           « Recherche » est redevenu le NOM DE LA PAGE : l'onglet, lui,
           s'appelle « Explorer » (§10C) — c'est le geste, pas la page.
           Le bloc entier reste COLLANT : quand le champ de localité
           remonte la page, la sortie et la bascule restent
           atteignables. */}
      <div
        //  ⚠️ 24 px EN HAUT (nº 149-§5) : le titre était collé au bord
        //  de l'écran. La marge de sécurité des encoches reste.
        //  ⚠️ ET IL SE NOMME (nº 180-§1) : c'est LUI qui reste collé en
        //  haut quand un champ remonte. Le marqueur `data-clavier`
        //  — celui que pose la remontée, clavier ou menu — le libère le
        //  temps du geste : il redevient un bloc ordinaire et s'en va
        //  par le haut avec la page (globals.css). Rien n'est mesuré.
        data-entete-recherche=""
        className="sticky top-0 z-10 bg-sombre-fond px-4 pb-1
                   pt-[max(24px,env(safe-area-inset-top))]"
      >
        <div className="flex items-center justify-between gap-4">
          {/*  LE TITRE ET SA LOUPE, agrandis et en BLANC (nº 149-§1) :
               20 px de corps, loupe au rang 22 — les deux en blanc
               pur, c'est le nom de la page. */}
          <h1 className="flex items-center gap-2.5 text-[20px] font-bold text-white">
            <IconeLoupe taille={22} classe="shrink-0 text-white" />
            Recherche
          </h1>
          <button
            type="button"
            onClick={() => fermer(false)}
            aria-label="Fermer la recherche"
            className="flex h-11 w-11 -mr-2 items-center justify-center
                       text-sombre-texte-doux active:text-sombre-texte
                       transition-colors"
          >
            {/*  §3 (nº 401) — LA CROIX PASSE DE 18 À 22 px.
                 D'OÙ VIENT CETTE VALEUR : c'est LE RANG DE LA LOUPE DE
                 CETTE MÊME LIGNE (`IconeLoupe taille={22}`, posé par la
                 nº 149-§1). Les deux glyphes de l'en-tête sont donc à
                 la même échelle, ce qu'ils n'étaient pas — une croix de
                 18 en face d'une loupe de 22 et d'un titre de 20 px
                 paraissait rabougrie. Le rang 24 de la barre fixe
                 aurait dépassé l'échelle propre à cette page.
                 ⚠️ RIEN NE BOUGE AUTOUR : la ZONE TACTILE ne change
                 pas — elle vaut toujours 44 px (`h-11 w-11`), et c'est
                 la boîte, pas le glyphe, qui la donne. Le glyphe
                 grandit À L'INTÉRIEUR d'une boîte fixe : ni la position
                 du bouton, ni le `-mr-2`, ni la hauteur de la rangée
                 (que ce bouton de 44 px commande déjà, contre les
                 ~28 px du titre) ne changent d'un pixel.
                 ⚠️ LE WEB N'EST PAS CONCERNÉ : cette page n'est montée
                 que par le moteur au doigt (`PageRechercheMobile`). */}
            <IconeCroix taille={22} />
          </button>
        </div>
        {/*  ⚠️ PLEINE LARGEUR (nº 149-§3) : le max-w-[260px] arrêtait
             la ligne du sélecteur avant le bord droit des champs — la
             bascule occupe désormais exactement leur largeur (même
             px-4 des deux côtés). Et mt-4 (§2) : elle respirait mal
             sous le titre. */}
        <div className="mt-4">
          {/*  §1 (nº 447) — LE VA-ET-VIENT DEVIENT « Réalisation |
               Flash » : deux onglets DE NATURE, même présentation
               dedans (style, localité, rayon, Technique, Rendu), et
               chacun ses critères. Les clés sont les natures du
               catalogue — c'est l'onglet qui porte la nature de la
               recherche validée. */}
          <OngletsLigne
            ariaLabel="Réalisation ou flash"
            cleActive={vue}
            surChoix={(cle) => surVue(cle as VueRecherche)}
            options={[
              { cle: "tatouage", label: "Réalisation" },
              { cle: "flash", label: "Flash" },
            ]}
          />
        </div>
      </div>

      {/* LA VUE — elle prend toute la hauteur restante, et s'allonge
          quand la liste de suggestions s'ouvre DANS LE FLUX sous le
          champ. C'est cet allongement qui rend le document défilable :
          le navigateur a alors de quoi remonter le champ au-dessus des
          touches, sans que personne ne lui dise comment. */}
      {/* ⚠️ `grow`, ET SURTOUT PAS `flex-1 min-h-0` — c'est ce qui
          empêchait le champ de remonter.
          `flex-1` pose `flex-basis: 0` et `min-h-0` autorise l'élément
          à être plus petit que son contenu : la vue restait donc à la
          hauteur de l'écran, la liste de suggestions DÉBORDAIT par le
          bas, et le DOCUMENT NE S'ALLONGEAIT PAS D'UN PIXEL. Sans
          hauteur à défiler, le défilement natif n'avait rien à faire,
          et le champ ne bougeait jamais (mesuré : gain de 0 px).
          `grow` part de la hauteur du CONTENU et grandit s'il reste de
          la place : la vue s'allonge donc quand la liste s'ouvre, le
          document devient défilable, et `scrollIntoView` peut amener
          le champ en haut. */}
      {/*  ⚠️ LES CHAMPS RESPIRENT (nº 149-§4) : 24 px au-dessus du
           champ Explorer (pt-6) et 24 px entre les champs (gap-6) —
           les 8 et 16 px d'avant donnaient l'impression de manquer de
           place. La page défile quand il le faut : la hauteur n'est
           plus la contrainte, la lisibilité l'est. */}
      <div className="flex grow flex-col gap-6 px-4 pt-6">
        {children}
      </div>

      {/* LES DEUX BOUTONS, aux extrémités de la même ligne, DANS LES
          DEUX VUES et à la même place : « Effacer » (clair,
          secondaire) à gauche — il ne vide que la vue affichée, et ne
          cherche pas — et « Valider » (rose, plein) à droite, LE SEUL
          GESTE QUI LANCE LA RECHERCHE.
          EN FLUX, jamais collés en bas : un pied fixe repasserait sous
          le clavier, et c'est très exactement ce qu'on vient de
          supprimer. Quand la liste s'ouvre, ils descendent avec la
          page — on les rejoint en défilant, comme dans n'importe quel
          formulaire. */}
      <div
        //  ⚠️ 20 px au-dessus, 28 px en dessous (nº 149-§5) : la ligne
        //  « Effacer / Valider » était collée au bas de la page.
        //  ⚠️ ET ELLE S'EFFACE TANT QU'UN MENU EST OUVERT (nº 195-§2) :
        //  « Effacer » et « Valider » n'ont aucun sens tant qu'une
        //  liste est dépliée. La règle est en CSS (globals.css), sur le
        //  marqueur que pose la remontée d'un champ ou d'un menu.
        data-actions-recherche=""
        className="flex items-center justify-between px-4 pt-5
                   pb-[max(28px,env(safe-area-inset-bottom))]"
      >
        {/*  « Effacer » EN TEXTE BRUT (nº 141-2C) : c'est une action
             négative — jamais de capsule. La zone tactile de 44 px
             demeure, invisible. */}
        <button
          type="button"
          onClick={onEffacer}
          className="min-h-[44px] px-2 -ml-2 text-[15px] font-semibold
                     text-sombre-texte-doux active:text-sombre-texte
                     transition-colors"
        >
          Effacer
        </button>
        <button
          type="button"
          onClick={() => fermer(true)}
          className="rounded-full px-6 min-h-[44px] text-[15px] font-semibold
                     bg-primaire active:bg-primaire-fonce text-white
                     transition-colors"
        >
          Valider
        </button>
      </div>
    </div>,
    document.body
  );
}
