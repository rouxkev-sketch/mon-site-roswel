"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconeCroix, IconeLoupe } from "@/components/Icones";
import { OngletsLigne } from "@/components/OngletsLigne";
import {
  entreeDejaPosee,
  lireDefilementResultats,
  marquerEntreePosee,
  memoriserDefilementResultats,
  prendreLEntree,
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
 * SON ENTRÉE D'HISTORIQUE — SANS CHANGER D'ADRESSE, ET SANS PASSER
 * D'ADRESSE À `pushState`
 * -------------------------------------------------
 * ⚠️ CETTE NUANCE EST LA CAUSE DU DÉFAUT « LA PAGE DISPARAÎT
 * AUSSITÔT ». Voir `poserLEntree` plus bas : c'est là que tout se
 * joue, et le commentaire y explique la mécanique exacte.
 *
 * `pushState` pose une étape SUR L'ADRESSE COURANTE. Le retour arrière
 * du navigateur et le geste depuis le bord de l'écran la referment donc
 * comme n'importe quelle page, et fermer la recherche ne fait JAMAIS
 * quitter le site. Pourquoi pas une adresse à elle (`/recherche`) :
 *  · RÉFÉRENCEMENT — une adresse qui n'existe pas n'a pas besoin d'être
 *    désindexée. Rien à écrire dans le sitemap, aucun `noindex`, aucune
 *    canonique à corriger. C'est la garantie la plus forte, et elle est
 *    gratuite ;
 *  · l'adresse courante PORTE DÉJÀ LA RECHERCHE (`/?style=…&lieu=…`,
 *    posée par IndexTatoueurs). Une seconde adresse par-dessus voudrait
 *    dire deux écritures d'historique concurrentes au moment de
 *    « Valider » ;
 *  · la MÉMOIRE DE NAVIGATION et la REPRISE DE SESSION travaillent par
 *    adresse : le journal d'onglet resterait sur les résultats de toute
 *    façon — autant ne rien avoir à leur apprendre. Position de
 *    défilement mémorisée, retour depuis une fiche : inchangés.
 *
 * UNE SEULE PORTE DE SORTIE, ET UN SEUL DRAPEAU. `prendreLEntree()`
 * dit si NOTRE étape est encore au sommet de la pile — et le
 * « consomme » du même geste. La croix et « Valider » la dépilent
 * eux-mêmes (`history.back()`) puis lancent la glissade ; un vrai
 * retour arrière trouve le drapeau et lance la même glissade, sans
 * jamais rappeler `back()`. Impossible de dépiler deux fois, donc
 * impossible de sortir du site.
 * ⚠️ CE DRAPEAU VIT HORS DE REACT (lib/recherche-mobile) : dans une
 * référence de composant, un remontage l'aurait remis à faux, et la
 * page aurait posé une DEUXIÈME étape sans jamais dépiler la première.
 */

/**
 * POSER L'ÉTAPE D'HISTORIQUE — ET SURTOUT, SANS LUI DONNER D'ADRESSE.
 * ==================================================================
 * ⚠️ C'EST ICI QUE LA PAGE SE REFERMAIT TOUTE SEULE. Elle appelait :
 *
 *     window.history.pushState(état, "", window.location.href)
 *
 * L'adresse passée était pourtant la même que l'adresse courante — on
 * pouvait la croire sans effet. Elle ne l'est pas.
 *
 * Next remplace `history.pushState` par le sien (app-router). Sa
 * version dit, en substance :
 *
 *     data = copierLesInternesDeNext(data);
 *     if (url) { appliquerLAdresse(url); }   // ← TOUT EST LÀ
 *     return vraiPushState(data, _, url);
 *
 * `appliquerLAdresse` envoie au routeur une action de RESTAURATION,
 * celle qu'il emploie quand on traverse l'historique. Le réducteur qui
 * la traite (`restore-reducer`) relance de VRAIES requêtes vers le
 * serveur pour la route (`spawnDynamicRequests`), puis REMPLACE l'arbre
 * du routeur par le résultat — et, s'il ne peut pas réconcilier,
 * termine par une navigation DURE, c'est-à-dire un rechargement.
 *
 * Autrement dit : demander une étape d'historique revenait à demander
 * à Next de REFAIRE LA PAGE. L'arbre reconstruit, le moteur de
 * recherche — qui portait l'état « la page est ouverte » — était
 * remonté à neuf, et la page disparaissait dans la seconde.
 *
 * POURQUOI `?sonde=1` L'EN EMPÊCHAIT. Ce réducteur ne prend pas
 * toujours le même chemin : il compare l'adresse restaurée à celle
 * déjà rendue (`renderedSearch`, `canonicalUrl`) et à ce qu'il a en
 * cache. Une adresse avec un paramètre en plus ne se réconcilie pas
 * comme une adresse nue. Le propriétaire avait donc raison de le
 * signaler : ce n'était pas la sonde qui réparait quoi que ce soit,
 * c'était le paramètre qui changeait le chemin pris par Next.
 *
 * LA CORRECTION TIENT EN UN ARGUMENT RETIRÉ. Sans adresse, la
 * condition `if (url)` est fausse : Next ne dispatche RIEN, ne
 * requête RIEN, ne reconstruit RIEN. L'étape est posée par le
 * navigateur sur l'adresse courante — c'est le comportement natif
 * quand on omet l'adresse — et les internes du routeur y sont tout de
 * même recopiés (`copierLesInternesDeNext` s'exécute avant le test).
 * Le retour arrière reste donc parfaitement compris par Next.
 */
function poserLEntree() {
  // UNE SEULE FOIS. Un remontage ne doit pas empiler une deuxième
  // étape : le retour arrière n'en dépilerait qu'une, et la page
  // resterait ouverte sur une pile faussée.
  if (entreeDejaPosee()) return;
  marquerEntreePosee();
  // ⚠️ DEUX ARGUMENTS, JAMAIS TROIS. Voir ci-dessus.
  window.history.pushState({ rechercheMobile: true }, "");
}

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
  /** La vue affichée — « recherche » ou « filtres ». */
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
    if (!entreeDejaPosee()) memoriserDefilementResultats(window.scrollY);
    poserLEntree();

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
      const conclure = () => {
        const { onValider: valide, onAbandonner: abandonne } = sorties.current;
        if (valider) valide();
        else abandonne();
      };
      //  ⚠️ ON N'AGIT PAS TANT QUE NOTRE ÉTAPE N'EST PAS DÉPILÉE
      //  (nº 154). Voir `attendreLeDepilement` : `history.back()` est
      //  ASYNCHRONE. « Valider » lançait la recherche — donc un
      //  `router.replace('/?…')` — avant que le navigateur n'ait
      //  retiré l'étape de la page de recherche : la recherche
      //  s'écrivait sur l'étape CONDAMNÉE, que le retour effaçait
      //  aussitôt, et l'onglet retombait sur l'étape d'en dessous. Le
      //  journal enregistrait alors cette page-là comme la dernière
      //  visitée — c'est ainsi qu'un retour depuis une fiche menait à
      //  « Ma sélection » puis à « Créer mon portfolio ».
      if (depilementFait.current) conclure();
      else actionEnAttente.current = conclure;
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
  useLayoutEffect(() => {
    if (phase !== "part") return;
    delete document.documentElement.dataset.recherche;
    window.scrollTo({
      top: validerEnSortant ? 0 : lireDefilementResultats(),
      left: 0,
      behavior: "instant",
    });
  }, [phase, validerEnSortant]);

  /**
   * ATTENDRE QUE LE NAVIGATEUR AIT VRAIMENT DÉPILÉ NOTRE ÉTAPE.
   * ⚠️ `history.back()` NE REND PAS LA MAIN UNE FOIS FAIT — il
   * PROGRAMME un retour, traité plus tard, et signalé par `popstate`.
   * Tout ce qui touche à l'adresse entre les deux s'écrit donc sur
   * l'étape que l'on est en train de retirer. C'est le défaut de
   * l'historique corrompu : « Valider » remplaçait l'adresse par celle
   * des résultats juste avant que le retour n'efface cette étape-là.
   * Un filet de 500 ms garantit qu'on n'attend jamais indéfiniment (un
   * navigateur qui refuserait le retour, une étape déjà consommée).
   */
  const depilementFait = useRef(true);
  const actionEnAttente = useRef<(() => void) | null>(null);
  function attendreLeDepilement() {
    depilementFait.current = false;
    const conclure = () => {
      if (depilementFait.current) return;
      window.removeEventListener("popstate", surRetour);
      window.clearTimeout(filet);
      depilementFait.current = true;
      const enAttente = actionEnAttente.current;
      actionEnAttente.current = null;
      enAttente?.();
    };
    function surRetour() {
      conclure();
    }
    window.addEventListener("popstate", surRetour);
    const filet = window.setTimeout(conclure, 500);
  }

  /** LA CROIX ET « VALIDER » — ils dépilent NOTRE étape eux-mêmes,
      puis glissent. Le `popstate` qui suit trouve le drapeau baissé et
      ne fait rien : une seule fermeture, jamais deux. */
  function fermer(valider: boolean) {
    // `prendreLEntree()` rend vrai UNE SEULE FOIS : impossible de
    // dépiler deux fois, donc impossible de quitter le site.
    if (prendreLEntree()) {
      attendreLeDepilement();
      window.history.back();
    }
    glisserDehors(valider);
  }

  /**
   * LE RETOUR ARRIÈRE DU NAVIGATEUR — et le geste depuis le bord de
   * l'écran, qui est le même événement. Il referme la page comme
   * n'importe quelle autre : c'est tout l'intérêt d'avoir une vraie
   * étape d'historique.
   * Sans tableau de dépendances : l'écouteur voit toujours la phase
   * courante.
   */
  useEffect(() => {
    function auRetour() {
      // Faux = c'était notre propre `back()`, déjà traité.
      if (!prendreLEntree()) return;
      glisserDehors(false);
    }
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") fermer(false);
    }
    window.addEventListener("popstate", auRetour);
    document.addEventListener("keydown", auClavier);
    return () => {
      window.removeEventListener("popstate", auRetour);
      document.removeEventListener("keydown", auClavier);
    };
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
            <IconeCroix taille={18} />
          </button>
        </div>
        {/*  ⚠️ PLEINE LARGEUR (nº 149-§3) : le max-w-[260px] arrêtait
             la ligne du sélecteur avant le bord droit des champs — la
             bascule occupe désormais exactement leur largeur (même
             px-4 des deux côtés). Et mt-4 (§2) : elle respirait mal
             sous le titre. */}
        <div className="mt-4">
          <OngletsLigne
            ariaLabel="Explorer ou filtres"
            cleActive={vue}
            surChoix={(cle) => surVue(cle as VueRecherche)}
            options={[
              { cle: "recherche", label: "Explorer" },
              { cle: "filtres", label: "Filtres" },
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
