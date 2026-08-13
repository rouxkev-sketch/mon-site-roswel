"use client";

import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  defilerSansGeste,
  estDefilementProgramme,
} from "@/lib/defilement-programme";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { lieuVersParametres } from "@/lib/geocodage";
import { MARQUE_YOKOFOLIO, TEXTES_TATOUAGE } from "@/config/tatouage";
import {
  ETATS_ROND_BARRE,
  IconeFanion,
  IconeLoupe,
  IconeSilhouette,
} from "@/components/Icones";
import { LogoYokofolio } from "@/components/LogoYokofolio";
import { MenuEspace } from "@/components/MenuEspace";
import { SelecteurLangue } from "@/components/SelecteurLangue";
import {
  lireDejaConnecte,
  marquerDejaConnecte,
  souscrireStockage,
} from "@/lib/deja-connecte";
import { ContexteDejaConnecteServeur } from "@/components/FournisseurSession";
import {
  lireDerniereRechercheServeur,
  lireDerniereRechercheTatouage,
  souscrireDerniereRecherche,
} from "@/lib/derniere-recherche";
import { lireDisposition } from "@/lib/disposition-grille";
import { lirePhototheque } from "@/lib/vue-phototheque";
import { useUtilisateur } from "@/lib/use-utilisateur";
import {
  criteresComplets,
  MoteurTatouage,
  type CritèresTatouage,
} from "@/components/MoteurTatouage";
import { ouvrirRecherche } from "@/lib/recherche-mobile";

/**
 * LA BARRE FIXE DE YOKOFOLIO
 * ==========================
 * Logo à gauche, moteur de recherche AU CENTRE, et à droite le globe
 * des langues puis le compte. Rien d'autre.
 *
 * LE LOGO COMPLET S'AFFICHE PARTOUT, smartphone compris : une marque
 * se lit, elle ne se devine pas — le cœur seul ne suffit pas. Sur
 * smartphone, c'est le bouton de compte qui se réduit en icône pour
 * lui laisser la place.
 *
 * LE COMPTE, trois états :
 *  - jamais venu : « Rejoindre » (web) / l'icône personnage
 *    grise, du même poids visuel que le globe (smartphone) — la
 *    formule d'invitation est réservée à qui n'a jamais eu de compte
 *    ici ;
 *  - DÉJÀ CONNECTÉ SUR CE NAVIGATEUR puis déconnecté : « Se
 *    connecter » — la mémoire est un simple drapeau local (« 1 »),
 *    sans aucune donnée personnelle, comme le font les grands sites ;
 *  - connecté : « MON ESPACE » (web) / l'icône passée en ROSE
 *    (smartphone) — et le bouton n'emmène plus nulle part : il OUVRE
 *    LE MENU DE COMPTE (MenuEspace) — état de la fiche, Modification,
 *    Ma fiche, Déconnexion.
 *
 * LE MOTEUR peut être retiré de la barre MOBILE (`moteurMobile`) : sur
 * les pages sans rapport avec la recherche (connexion, mentions
 * légales, qui sommes-nous), la barre du smartphone ne montre que le
 * logo, le globe et le compte. Sur le web, le moteur reste : il RAMÈNE
 * à l'accueil avec les critères choisis.
 *
 * DEUX FAÇONS DE CHERCHER, un seul composant :
 *  - sur l'accueil, `criteres` et `surRecherche` sont fournis → la
 *    grille se met à jour sur place, sans rechargement ;
 *  - ailleurs (fiche, page style + ville), ils ne le sont pas → le
 *    moteur garde son propre état et RAMÈNE à l'accueil avec les
 *    critères dans l'adresse.
 */

/** Hauteur du globe et du bouton de compte : ils s'alignent au pixel. */
const HAUTEUR_ACTIONS = 40;

/** useLayoutEffect côté navigateur, useEffect côté serveur (silencieux). */
const useEffetAvantPeinture =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function EnTeteTatouage({
  criteres,
  criteresInitiaux,
  surRecherche,
  rangee,
}: {
  /** Critères PILOTÉS PAR LA PAGE (accueil). Absent = état interne. */
  criteres?: CritèresTatouage;
  criteresInitiaux?: Partial<CritèresTatouage>;
  /** La recherche demandée. Sur l'accueil, elle change l'adresse — et
      c'est l'adresse qui décide de tout (refonte nº 191). */
  surRecherche?: (criteres: CritèresTatouage) => void;
  /**
   * §1 (nº 245) — UNE AUTRE RANGÉE QUE LE MOTEUR.
   * ------------------------------------------------------------------
   * « Ma sélection » n'a que faire du bloc de recherche : elle pose
   * SES deux menus à la place. Elle ne fabrique pour autant NI un
   * second centrage, NI un second repli — elle passe son contenu ici,
   * et c'est la rangée existante qui le porte : même largeur
   * (`basis-[680px]`, `max-w-[720px]`), même centrage, même mécanique
   * de repli (les deux hauteurs, réglages inchangés).
   * On lui rend l'état de repli : à elle de dire ce qu'elle montre
   * repliée (§4 — la ligne étroite « Recherche »), et de demander le
   * dépliement au toucher.
   */
  rangee?: (etat: {
    replie: boolean;
    deplier: () => void;
  }) => React.ReactNode;
}) {
  const router = useRouter();
  const { utilisateur, nom } = useUtilisateur();
  const connecte = utilisateur !== null;

  /** Vrai si un compte s'est DÉJÀ connecté sur ce navigateur : le
      bouton dit alors « Se connecter » au lieu d'inviter à s'inscrire.
      ⚠️ LE SERVEUR LE SAIT DÉSORMAIS (nº 203-§1a) : le drapeau vit
      dans un COOKIE, la mise en page le lit et le passe par contexte —
      le HTML porte le bon libellé du premier coup, plus de bouton qui
      change sous les yeux au retour à l'accueil. */
  const dejaConnecteServi = useContext(ContexteDejaConnecteServeur);
  const dejaConnecte = useSyncExternalStore(
    souscrireStockage,
    lireDejaConnecte,
    () => dejaConnecteServi
  );
  // Chaque session connectée POSE le drapeau — et un navigateur qui ne
  // portait que l'ANCIEN drapeau (stockage local, d'avant la nº 203)
  // reçoit son cookie au premier passage : la transition est muette.
  useEffect(() => {
    if (connecte || lireDejaConnecte()) marquerDejaConnecte();
  }, [connecte]);

  /**
   * LA DENSITÉ DE TEINTE DU VERRE SE RÈGLE PAR L'ADRESSE (nº 167-§1)
   * ================================================================
   * `?verre=30`, `?verre=50`, `?verre=75`, `?verre=85`… — la valeur est
   * un POURCENTAGE d'opacité de l'anthracite du site. SANS paramètre :
   * 75 (nº 169-§3c — les valeurs basses étaient trop claires ; le
   * commutateur, lui, reste en place).
   * ⚠️ ET LE FLOU SE RÈGLE AUSSI (nº 169-§3b) : `?flou=0`, `?flou=20`,
   * `?flou=40`, `?flou=60`, `?flou=80`, en PIXELS — 40 par défaut. Les
   * deux réglages sont indépendants, et la déclaration est la même sur
   * web et sur smartphone : ils agissent sur les deux.
   *
   * ⚠️ LES DEUX RÉGLAGES PASSENT PAR UN STYLE EN LIGNE (nº 172), posé
   * ICI, sur la barre, sous forme de CHAÎNE COMPLÈTE — jamais une
   * variable CSS dans la valeur finale : WebKit invalide un filtre
   * construit avec `var()`, et la propriété vaut alors `none`. Les
   * variables `--rw-verre` et `--rw-flou` restent posées sur <html>,
   * mais pour la seule sonde, qui les affiche.
   * Sans paramètre, ce sont les valeurs de globals.css qui règnent,
   * écrites en clair elles aussi ; sans `backdrop-filter` du tout, le
   * fond reste PLEIN (`bg-sombre-fond`), acquis de la nº 147-§2.
   *
   * ⚠️ POSÉE DANS UN EFFET, PAS DANS LE RENDU : le serveur ne connaît
   * pas l'adresse du navigateur, et une classe qui changerait entre les
   * deux serait un écart d'hydratation.
   */
  const barre = useRef<HTMLElement>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const racine = document.documentElement;
    const cible = barre.current;
    const declarations: string[] = [];

    const teinte = params.get("verre");
    if (teinte !== null) {
      const pourcent = Number(teinte);
      if (Number.isFinite(pourcent) && pourcent >= 0 && pourcent <= 100) {
        //  La variable, pour que la sonde la montre…
        racine.style.setProperty("--rw-verre", String(pourcent / 100));
        //  …et la VALEUR FINALE, écrite en clair.
        declarations.push(`background-color: rgba(26, 26, 29, ${pourcent / 100})`);
      }
    }
    //  ⚠️ LE CRAN D'ÉCLAIRCISSEMENT DU CHAMP ET DES DEUX ICÔNES
    //  (nº 174-§1) — `?clair=1`, `?clair=2`, `?clair=3`, du plus
    //  discret au plus clair. DÉFAUT : 2, écrit dans la feuille de
    //  style (globals.css) ; l'attribut ne sert qu'à en changer.
    //  Il vit sur <html> et non sur la barre : les mêmes trois crans
    //  habillent le champ et les boutons, qui ne sont pas frères.
    const clair = params.get("clair");
    if (clair === "1" || clair === "2" || clair === "3") {
      racine.dataset.clair = clair;
    }

    const flou = params.get("flou");
    if (flou !== null) {
      const pixels = Number(flou);
      if (Number.isFinite(pixels) && pixels >= 0 && pixels <= 200) {
        racine.style.setProperty("--rw-flou", `${pixels}px`);
        //  ⚠️ UNE CHAÎNE COMPLÈTE, SANS LA MOINDRE VARIABLE (nº 172) :
        //  c'est tout l'objet de cette passe — WebKit invalide un
        //  filtre construit avec `var()`, et la propriété vaut alors
        //  `none`. La préfixée est écrite en PREMIER : Safari ne lit
        //  qu'elle.
        const valeur = `blur(${pixels}px) saturate(150%)`;
        declarations.push(
          `-webkit-backdrop-filter: ${valeur}`,
          `backdrop-filter: ${valeur}`
        );
      }
    }

    //  ⚠️ ON ÉCRIT LE STYLE EN TEXTE, ET C'EST INDISPENSABLE : passée
    //  par `setProperty`, une propriété que LE MOTEUR COURANT ne
    //  connaît pas est simplement JETÉE — Chromium efface ainsi
    //  `-webkit-backdrop-filter` avant même qu'elle n'atteigne le
    //  document (mesuré). Le texte, lui, est analysé par chaque moteur
    //  qui garde ce qu'il comprend : Safari conserve la préfixée, les
    //  autres la nue. Une seule écriture sert les deux.
    if (cible && declarations.length > 0) {
      cible.style.cssText = `${declarations.join("; ")};`;
    }
  }, []);

  // État interne, utilisé UNIQUEMENT quand la page ne pilote rien
  // (fiche, page style + ville).
  const [internes, setInternes] = useState(() =>
    criteresComplets(criteresInitiaux)
  );
  /**
   * §1 (nº 209) — LA RECHERCHE N'EST PLUS PERDUE SUR UNE FICHE.
   * Une page qui ne porte AUCUN critère à elle (une fiche : son adresse
   * ne parle que du tatoueur) reprend ceux de la visite en cours — la
   * loupe ouvre alors le moteur avec la recherche en cours, prête à
   * être modifiée.
   * ⚠️ AUCUN ÉTAT, AUCUN EFFET : la valeur est simplement DÉRIVÉE. Le
   * stockage de session est lu par `useSyncExternalStore`, le hook
   * prévu pour cela — le serveur répond « rien », le navigateur répond
   * la mémoire, et React fait la jonction sans qu'aucun écran ne
   * clignote ni qu'aucun rendu ne cascade.
   * ⚠️ SEULEMENT SI LA PAGE NE PILOTE RIEN et n'a rien reçu : sur
   * l'accueil comme sur une page style + ville, ce sont les critères de
   * L'ADRESSE qui règnent — cette reprise ne les touche jamais. Et dès
   * que la main a touché un champ ici, c'est la main qui commande.
   */
  const retenue = useSyncExternalStore(
    souscrireDerniereRecherche,
    lireDerniereRechercheTatouage,
    lireDerniereRechercheServeur
  );
  const [modifieALaMain, setModifieALaMain] = useState(false);
  const aDesCriteresPropres =
    Boolean(criteres) ||
    Boolean(criteresInitiaux?.style) ||
    Boolean(criteresInitiaux?.lieu) ||
    Boolean(criteresInitiaux?.nature);
  const repris =
    !aDesCriteresPropres && !modifieALaMain && retenue
      ? criteresComplets(retenue)
      : internes;
  const valeur = criteres ?? repris;

  function chercher(suivants: CritèresTatouage) {
    if (surRecherche) {
      surRecherche(suivants);
      return;
    }
    setInternes(suivants);
    //  La main a parlé : la reprise de la visite ne reprend plus le
    //  dessus (nº 209-§1).
    setModifieALaMain(true);
    const parametres = new URLSearchParams();
    if (suivants.style) parametres.set("style", suivants.style);
    if (suivants.exclure.length > 0) {
      parametres.set("exclure", suivants.exclure.join(","));
    }
    if (suivants.lieu) {
      // Le LIEU voyage en clair dans l'adresse (intitulé, contexte,
      // coordonnées) : la recherche reste partageable et survit au
      // rechargement — voir lib/geocodage.
      for (const [cle, valeur] of Object.entries(
        lieuVersParametres(suivants.lieu)
      )) {
        parametres.set(cle, valeur);
      }
      parametres.set("rayon", String(suivants.rayonKm));
    }
    //  L'AFFICHAGE VOYAGE AVEC LA RECHERCHE (nº 203-§1b) : chercher
    //  depuis une fiche ne remet pas la mosaïque au défaut.
    if (lireDisposition() === "une") parametres.set("disposition", "une");
    if (lirePhototheque()) parametres.set("texte", "sans");
    const requete = parametres.toString();
    router.push(requete ? `/?${requete}` : "/");
  }

  /**
   * LES ESPACES AUTOUR DU BLOC CENTRAL SONT ÉGAUX (passe nº 169-§4)
   * ==============================================================
   * ⚠️ LA RÉSERVE SYMÉTRIQUE DE LA Nº 168 EST SUPPRIMÉE — variable
   * `--cote-barre` et ResizeObserver compris. Elle centrait le bloc
   * dans LA PAGE ; ce n'est pas ce qui est demandé, et elle laissait
   * tout l'espace libre s'entasser derrière le compte (mesuré chez le
   * propriétaire : 268 px perdus à droite, 20,5 px seulement entre le
   * titre et le bloc).
   *
   * LA RÈGLE, DÉSORMAIS, EST ARITHMÉTIQUE ET SANS AUCUNE MESURE :
   *  · les deux côtés gardent leur largeur NATURELLE et ne se
   *    compriment pas (`lg:flex-none`) ;
   *  · le bloc central porte une MARGE AUTOMATIQUE de chaque côté
   *    (`lg:mx-auto`). En disposition flexible, deux marges `auto` se
   *    partagent l'espace libre À ÉGALITÉ — c'est le navigateur qui
   *    fait le calcul, il n'y a rien à observer ni à recalculer ;
   *  · le côté droit se retrouve donc ancré AU BORD DROIT, à la même
   *    marge de page que le logo à gauche (`px-4 sm:px-6`).
   * Le bloc central, lui, ne bouge pas d'un pixel : 680 px,
   * incompressible (acquis de la nº 168).
   */

  /**
   * §6 (nº 247) — UN APPUI SUR L'ICÔNE DE LA PAGE OÙ L'ON EST DÉJÀ.
   * ------------------------------------------------------------------
   * Il ne se passait rien du tout : `<Link>` compare l'adresse visée à
   * l'adresse courante et n'a nulle part où aller. On rend donc le
   * geste attendu — la page revient EN HAUT et se rafraîchit — sans
   * recharger l'application (`router.refresh()` redemande au serveur
   * ce que cette page affiche, et rien d'autre).
   * ⚠️ LE DÉFILEMENT PASSE PAR `defilerSansGeste` : la barre y lirait
   * sinon une intention et se replierait (la règle de la nº 154-§6A).
   */
  const rafraichirSiDejaLa = (chemin: string) => (evenement: React.MouseEvent) => {
    if (evenement.metaKey || evenement.ctrlKey || evenement.shiftKey) return;
    if (window.location.pathname !== chemin) return;
    evenement.preventDefault();
    defilerSansGeste({ top: 0 });
    router.refresh();
  };

  /** Déconnecté : « Se connecter » pour qui est déjà venu, la formule
      d'invitation pour les autres. Le même libellé sert d'info-bulle à
      l'icône du smartphone. (Connecté, c'est MenuEspace qui joue.) */
  const libelleDeconnecte = dejaConnecte
    ? "Se connecter"
    : TEXTES_TATOUAGE.lienInscription;

  /**
   * LA BARRE EST UN VERRE DÉPOLI, ET NE CHANGE JAMAIS D'ÉTAT
   * (passe nº 161, refaite par la nº 163-§2)
   * =========================================================
   * ⚠️ LES DEUX ÉTATS DE LA Nº 156-§2 RESTENT SUPPRIMÉS : la barre a
   * UN SEUL traitement, permanent, à toutes les positions de
   * défilement — une apparence qui ne varie pas ne peut ni clignoter
   * (nº 154-§3), ni sauter (nº 156-§2), ni arriver « dans un second
   * temps ». Plus d'état `posee`, plus d'hystérésis 8 px / 2 px. Le
   * repli de la rangée, lui, n'a pas bougé d'une ligne.
   *
   * LE TRAITEMENT (nº 163-§2) : un VERRE DÉPOLI — teinte anthracite
   * dense (le fond du site à 85 %) sur un flou d'arrière-plan FORT
   * (40 px). Le contenu qui passe derrière n'est plus que des masses
   * de couleur diffuses : on devine qu'il y a quelque chose, on ne
   * distingue rien. La barre reste anthracite — ce qui passe derrière
   * la nuance à peine. Le VOILE de dégradé de la nº 161 (lu comme une
   * ombre portée) est supprimé (nº 163-§1).
   */
  /** LA LIGNE DE RECHERCHE SE RÉTRACTE (passe nº 147-§7, smartphone).
      En DESCENDANT dans les cartes, la rangée du moteur se replie et
      libère sa hauteur ; elle REVIENT AU PREMIER GESTE vers le haut —
      immédiatement, sans attendre le haut de page : c'est ce qui
      distingue une barre rétractable réussie d'une barre pénible.
      Près du haut (moins de 64 px), elle est toujours dépliée. Le
      seuil de 4 px par lecture ignore l'élastique du défilement.
      ⚠️ LA RANGÉE DU LOGO NE BOUGE JAMAIS : sans lui, plus de repère. */
  const [moteurReplie, setMoteurReplie] = useState(false);
  /**
   * §6 (nº 247) — L'ÉTAT DU REPLI TIENT DANS DEUX RÉFÉRENCES, ET C'EST
   * LA CORRECTION DE « LE BANDEAU NE SE RÉTRACTE PLUS ».
   * ------------------------------------------------------------------
   * CE QUI SE PASSAIT. L'écouteur de défilement gardait sa propre
   * mémoire de l'état (`replieCourant`, une variable de sa fermeture)
   * et refusait de rejouer une bascule qu'il croyait déjà faite. Or
   * `deplier` — l'appui sur la ligne étroite, §4 de la nº 245 —
   * remettait l'état REACT à « déplié » sans rien dire à l'écouteur :
   * celui-ci continuait de croire la rangée repliée, et son
   * `poserReplie(true)` ne faisait plus jamais rien. Un seul appui, et
   * le bandeau ne se rétractait plus de la visite.
   * POURQUOI L'ACCUEIL N'EN SOUFFRAIT PAS : il n'a pas de ligne
   * étroite à toucher — `deplier` n'existe QUE pour une rangée libre,
   * c'est-à-dire pour « Ma sélection ».
   * IL N'Y A DONC PLUS QU'UNE MÉMOIRE, partagée par l'écouteur et par
   * le doigt : deux références, et un seul chemin pour écrire l'état.
   * Aucune seconde mécanique — les réglages (24 / 12 / 64 px, 300 ms)
   * ne bougent pas d'un chiffre.
   */
  const cumulDuGeste = useRef(0);
  //  LE CUMUL REPART À CHAQUE CHANGEMENT D'ÉTAT, D'OÙ QU'IL VIENNE —
  //  du défilement comme du doigt. C'est ce que faisait `poserReplie`
  //  pour lui seul ; branché sur l'état, il n'a plus rien à savoir de
  //  qui a parlé.
  useEffect(() => {
    cumulDuGeste.current = 0;
  }, [moteurReplie]);
  /** SUR L'ACCUEIL, ET LÀ SEULEMENT, la barre porte la rangée du
      moteur sur smartphone (nº 150-§3) : l'accueil est la page qui
      PILOTE la recherche — elle fournit `surRecherche`. Partout
      ailleurs, la rangée n'existe pas : c'est LA LOUPE de la barre qui
      mène à la recherche. */
  const surAccueil = Boolean(surRecherche);
  /** §1 (nº 245) — LA RANGÉE PORTE UN AUTRE CONTENU (« Ma
      sélection »). Elle existe alors comme sur l'accueil, mais elle
      n'EST PAS le moteur : la loupe reste donc à sa place (§4), et la
      rangée ne s'escamote jamais entièrement — elle se réduit à sa
      ligne étroite, dont le contenu décide. */
  const rangeeLibre = Boolean(rangee);
  /** §1 (nº 253) — LA RANGÉE LIBRE EXISTE AUX DEUX LARGEURS : le
      `rangeeWeb` de la nº 251 est défait, et la réserve du smartphone
      retrouve ses trois hauteurs (128 dépliée, 104 repliée, 64 sans
      rangée). */
  const rangeePresente = surAccueil || rangeeLibre;
  /** LA LOUPE EST VISIBLE quand la rangée ne l'est pas : partout hors
      accueil, et sur l'accueil dès que la rangée est repliée. Avec une
      rangée libre, la loupe ne bouge pas (nº 245-§4). */
  const loupeVisible = !surAccueil || moteurReplie;
  /**
   * L'ÉCRAN EST-IL ÉTROIT ? — c'est-à-dire : la rangée du moteur est-
   * elle réellement repliable ici ?
   * ⚠️ SANS CETTE QUESTION, LE MOTEUR WEB DEVENAIT INERTE (nº 154-§5).
   * Le repli est une affaire de LARGEUR (variantes `max-lg:`), mais
   * `inert` et `aria-hidden` sont des ATTRIBUTS : ils ne connaissent
   * pas les points de rupture et s'appliquaient à TOUTES les largeurs.
   * Sur le web, dès qu'on avait défilé de 24 px, `moteurReplie`
   * passait à vrai et l'enveloppe entière — encadré, filtres, bouton
   * du texte des cartes — devenait inerte : les clics ne produisaient
   * plus rien, alors que tout restait parfaitement visible. En haut de
   * page, elle repassait à faux et tout refonctionnait.
   * On lit donc la MÊME borne que la feuille de style (1024 px), et
   * l'inertie ne vaut que là où la rangée se replie vraiment.
   * (Ceci ne touche pas C1 : la détection par appareil décide de ce
   * qu'on affiche, pas du point de rupture d'une variante Tailwind.)
   */
  const [etroit, setEtroit] = useState(false);
  useEffect(() => {
    const borne = window.matchMedia("(max-width: 1023.98px)");
    const lire = () => setEtroit(borne.matches);
    lire();
    borne.addEventListener("change", lire);
    return () => borne.removeEventListener("change", lire);
  }, []);
  /** La rangée est-elle VRAIMENT hors de portée ? */
  const rangeeEscamotee = surAccueil && moteurReplie && etroit;

  //  ⚠️ AVANT LA PEINTURE (nº 156-§2) : la toute première lecture doit
  //  décider de l'état de la rangée AVANT que la barre ne s'affiche —
  //  une page ouverte à une position mémorisée doit naître avec la
  //  rangée déjà juste.
  useEffetAvantPeinture(() => {
    /* ============================================================
     * LE REPLI, REFAIT DE A À Z (nº 150-§5) — un seul mouvement.
     * ------------------------------------------------------------
     * L'ancienne mécanique jugeait CHAQUE lecture de scroll (delta
     * > 4 px) et se protégeait de ses propres conséquences par un GEL
     * de 400 ms : les bascules différées repartaient en sens inverse
     * en pleine transition — trois mouvements visibles au lieu d'un.
     *
     * La nouvelle règle juge le GESTE, pas la lecture :
     *  · un CUMUL DIRECTIONNEL additionne les deltas tant que le sens
     *    ne change pas, et repart de zéro quand il s'inverse ;
     *  · 24 px cumulés vers le bas replient ; 12 px cumulés vers le
     *    haut déplient — le retour reste immédiat au premier vrai
     *    geste, où qu'on soit dans la page ;
     *  · sous 64 px du haut, toujours dépliée.
     * AUCUN gel : l'état ne peut plus se contredire en cours de
     * transition, car les faux gestes sont traités À LA SOURCE :
     *  · le RE-BORNAGE du bas de page (replier raccourcit le document,
     *    le navigateur re-borne le défilement — delta négatif) : un
     *    delta négatif qui laisse le défilement collé au bas n'est pas
     *    un geste, il est ignoré ;
     *  · l'ANCRAGE de défilement (déplier rallonge le header, le
     *    navigateur « compensait » — delta positif) : il est désactivé
     *    pour de bon (`overflow-anchor: none`, globals.css).
     * ============================================================ */
    let yPrecedent = window.scrollY;
    //  ⚠️ PLUS AUCUNE MÉMOIRE D'ÉTAT ICI (nº 247-§6) : `setMoteurReplie`
    //  est idempotent, React ne redessine pas pour la même valeur. La
    //  seule vérité est l'état React — un doigt et un défilement ne
    //  peuvent donc plus se contredire.
    const poserReplie = (valeur: boolean) => setMoteurReplie(valeur);
    const lire = () => {
      const y = window.scrollY;
      const delta = y - yPrecedent;
      yPrecedent = y;
      //  ⚠️ UN DÉFILEMENT POSÉ PAR LE SITE N'EST PAS UN GESTE
      //  (nº 154-§6A). Changer de disposition, montrer ou masquer le
      //  texte des cartes, restituer une position au retour : chacun
      //  de ces gestes REPOSE la page (lib/carte-du-haut,
      //  lib/restitution-position). Le saut franchissait les 24 px et
      //  repliait la rangée alors que personne n'avait fait défiler
      //  quoi que ce soit. On prend acte de la nouvelle position — le
      //  cumul, lui, ne bouge pas.
      //  ⚠️ LE FOND DE LA BARRE, LUI, N'A PLUS RIEN À SUIVRE
      //  (nº 161) : il est la couleur du fond du site, à toutes les
      //  positions — l'hystérésis 8 px / 2 px est partie avec lui.
      if (estDefilementProgramme()) {
        cumulDuGeste.current = 0;
        return;
      }
      if (y < 64) {
        poserReplie(false);
        cumulDuGeste.current = 0;
        return;
      }
      if (delta === 0) return;
      const yMax = document.documentElement.scrollHeight - window.innerHeight;
      if (delta < 0 && y >= yMax - 2) return;
      const cumul = cumulDuGeste.current;
      cumulDuGeste.current =
        Math.sign(delta) === Math.sign(cumul) ? cumul + delta : delta;
      if (cumulDuGeste.current > 24) poserReplie(true);
      else if (cumulDuGeste.current < -12) poserReplie(false);
    };
    lire();
    window.addEventListener("scroll", lire, { passive: true });
    return () => window.removeEventListener("scroll", lire);
  }, []);

  return (
    <>
    <header
      // Le repère du haut de l'écran : la mosaïque s'en sert pour
      // remettre sous les yeux la même carte après un changement de
      // disposition (voir src/lib/carte-du-haut.ts).
      data-barre-fixe=""
      //  ⚠️ LE VERRE DÉPOLI (nº 163-§2) — YouTube, iOS, macOS. Le
      //  contenu qui passe derrière est FORTEMENT flouté (40 px, un
      //  cran de saturation en plus pour que les couleurs vivent) :
      //  il n'en reste que des masses diffuses — aucune forme, aucun
      //  texte, aucun visage. La teinte anthracite à 85 % garde la
      //  barre dans la couleur du site : ce qui passe derrière ne fait
      //  que la nuancer.
      //  ⚠️ PAS LE FLOU DE LA Nº 147 : lui était trop FAIBLE (8 px) et
      //  le fond trop transparent — on lisait le contenu. Ici le flou
      //  est cinq fois plus fort, et la teinte reste dense. Sans
      //  `backdrop-filter` (navigateur ancien), le fond redevient
      //  PLEIN : jamais de contenu lisible à travers (nº 147-§2).
      //  ⚠️ UN SEUL ÉTAT, PERMANENT : les deux états de la nº 156-§2
      //  restent supprimés (nº 161) — une apparence qui ne varie pas
      //  ne peut pas clignoter. Toujours AUCUN trait : c'est un acquis.
      ref={barre}
      //  ⚠️ D'OÙ VIENT CE FOND (nº 169-§2) : la sonde du verre lit ces
      //  deux attributs dans le DOM et les affiche.
      data-source-fichier="src/components/EnTeteTatouage.tsx"
      data-source-composant="EnTeteTatouage · barre fixe (header)"
      //  ⚠️ LE FLOU ET LA TEINTE VIVENT DANS globals.css (nº 169-§3b) :
      //  ils sont réglables par l'adresse, donc portés par des
      //  variables — une classe Tailwind ne saurait pas les lire.
      /**
       * ⚠️ ARRIMÉE À LA FENÊTRE SUR MOBILE (nº 195-§1a) — plus au
       * document. Une barre `sticky` reste attachée au FLUX : tout
       * mouvement du contenu (une mosaïque qui se réagence, un
       * navigateur qui replace la page) la déplace avec lui, et c'est
       * le saut que le propriétaire voit à chaque bascule. En `fixed`,
       * elle est arrimée à la FENÊTRE : plus aucun mouvement du contenu
       * ne peut l'atteindre.
       * ⚠️ SUR MOBILE SEULEMENT : sur le web, la barre ne saute pas, et
       * `sticky` y tient sa hauteur toute seule (le moteur y vit sur la
       * même ligne que le logo — une hauteur qu'aucune réserve écrite à
       * la main ne saurait suivre).
       * LA RÉSERVE D'ESPACE est posée juste en dessous : sans elle, la
       * barre quittant le flux, la première carte passerait dessous.
       */
      className="sticky top-0 z-50 mobile:fixed mobile:inset-x-0 bg-sombre-fond"
    >
      <div
        //  ⚠️ PLUS DE gap-y (nº 147-§7) : l'espace au-dessus de la
        //  rangée du moteur vit DANS la rangée (`pt-3` de son
        //  enveloppe), pour disparaître AVEC elle quand elle se
        //  replie — un gap de grille, lui, serait resté.
        className="mx-auto w-full max-w-[1760px] px-4 sm:px-6
                   flex flex-wrap lg:flex-nowrap items-center gap-x-5 py-3"
      >
        {/* LOGO ET ACTIONS PRENNENT LA MÊME PLACE (`lg:flex-1` des deux
            côtés) : c'est ce qui met le moteur au milieu de la barre.
            ⚠️ L'ANCRAGE AU CENTRE DE LA PAGE (nº 147-§3) EST ANNULÉ
            (nº 150-§1), à la demande du propriétaire : retour EXACT à
            la règle de la nº 146-§2 — chaque côté réclame AU MOINS son
            contenu (`lg:min-w-fit`), seul le moteur (`lg:shrink` +
            `min-w-0`) peut céder, le logo jamais. Plus de réserve
            `--cote-barre`, plus de ResizeObserver. */}
        {/*  ⚠️ LE LOGO CÈDE AVANT QUE LA BARRE NE SE CASSE (nº 154-§4).
             Il était `shrink-0` à TOUTES les largeurs : à 320 px, le
             logo entier plus les trois icônes (loupe, fanion, compte)
             dépassaient la ligne, et le conteneur — qui doit rester
             `flex-wrap` pour que la rangée du moteur passe SOUS la
             barre — les renvoyait à la ligne. Vu de l'écran : le logo
             seul en haut, les icônes en dessous à droite.
             ⚠️ ET C'EST `basis-0` QUI COMPTE, PAS `shrink` : un
             conteneur qui peut passer à la ligne place ses éléments
             AVANT de les rétrécir — il compare leur taille de départ,
             pas leur taille possible. Un logo « rétrécissable » mais
             large au départ cassait donc quand même la ligne. Avec une
             taille de départ NULLE, il ne la casse jamais : il prend
             ensuite la place qui reste (`grow`), et l'image s'y borne.
             Au-delà de 1024 px, rien ne change : `lg:min-w-fit` garde
             la règle de la nº 146-§2 — seul le moteur cède, jamais le
             logo. */}
        <div
          //  ⚠️ SA LARGEUR NATURELLE, ET RIEN D'AUTRE (nº 169-§4) : le
          //  côté du logo ne grandit plus et ne se comprime plus au-delà
          //  de `lg`. Sous `lg`, rien ne change — le logo cède encore
          //  avant que la barre ne casse (nº 154-§4).
          className="min-w-0 basis-0 grow shrink order-1 lg:flex-none lg:basis-auto"
        >
          {/* LE LOGO RAMÈNE À L'ACCUEIL — un lien NATIF, exprès. La
              navigation douce de Next a déjà avalé ce clic deux fois
              (page du compte, puis page de création de fiche) : ici,
              c'est le NAVIGATEUR qui navigue, rien ne peut s'interposer
              — et le curseur main est garanti. `draggable=false` :
              une image de lien se laisse « traîner » par défaut, et un
              clic légèrement glissé partait en glisser-déposer muet au
              lieu de naviguer. Le lien épouse le logo (`w-fit`) : pas
              de zone cliquable invisible sur la moitié de la barre. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
              c'est un <a> natif PAR CHOIX : la navigation douce de
              <Link> a déjà avalé ce clic en silence, deux fois. */}
          <a
            href="/"
            aria-label={`Accueil ${MARQUE_YOKOFOLIO.nom}`}
            draggable={false}
            className="block w-fit cursor-pointer rounded-lg
                       focus-visible:outline-2 focus-visible:outline-offset-4
                       focus-visible:outline-primaire"
          >
            {/* LE LOGO COMPLET, PARTOUT — le fichier du propriétaire,
                affiché tel quel. Sur smartphone il perd juste quelques
                pixels de hauteur, jamais son nom. */}
            {/*  `max-w-full` : sur un écran très étroit, le logo se
                 borne à la place qui reste au lieu de pousser les
                 icônes à la ligne (nº 154-§4). Sa hauteur commande, sa
                 largeur suit — il n'est jamais déformé. */}
            <LogoYokofolio
              hauteur={48}
              classe="h-9 sm:h-11 lg:h-12 w-auto max-w-full object-contain object-left"
            />
          </a>
        </div>

        {/* LE MOTEUR, CENTRÉ. Il passe sous la barre en dessous de
            1024 px (il lui faut de la place pour respirer), et revient
            au milieu dès qu'il y en a. `moteurMobile` faux : il
            disparaît sous 768 px — sur une page sans recherche, un
            moteur dans la barre n'est que du bruit. */}
        {/*  ⚠️ ÉLARGI (nº 144-§4) : 520 px laissaient à peine 200 px à
             chacun des deux champs alors que la barre avait de la
             place. 680 px — la juste mesure : les champs respirent,
             et le moteur reste une PILULE au centre de la barre, pas
             une barre dans la barre.
             ⚠️ ET 680 EST UN MAXIMUM, PAS UNE LARGEUR FIXE (nº 146-§2) :
             `lg:shrink` + `min-w-0` laissent l'encadré se réduire dès
             que la barre manque de place — AVANT que quoi que ce soit
             d'autre ne cède (voir le `lg:min-w-fit` des deux côtés). */}
        {/*  ⚠️ LA RANGÉE DU MOTEUR N'EXISTE QUE SUR L'ACCUEIL
             (nº 150-§3) : partout ailleurs, `hidden lg:flex` — RIEN
             sous 1024 px (la loupe de la nav mène à la recherche), et
             le moteur web ordinaire au-delà. La régression corrigée :
             les variantes de repli `max-lg:grid` s'appliquaient SANS
             condition et rallumaient la rangée sur toutes les pages,
             par-dessus leur `hidden`.
             SUR L'ACCUEIL, elle SE REPLIE au défilement (nº 150-§5) :
             une grille à UNE COLONNE PLEINE LARGEUR
             (`grid-cols-[minmax(0,1fr)]` — la colonne implicite se
             dimensionnait au contenu et `justify-center` la centrait :
             c'était la marge parasite du §4) et UNE LIGNE qui passe de
             1fr à 0fr : la hauteur exacte se replie, le contenu est
             coupé par l'overflow de l'enveloppe — il se replie AVEC la
             rangée, jamais après. */}
        {/**
          * §2 et §3 (nº 248) — 680 EST UN MAXIMUM, PAS UNE LARGEUR FIXE.
          * ------------------------------------------------------------
          * LE DÉFAUT, MESURÉ. Ce bloc était posé en `lg:shrink-0` :
          * `flex: 0 0 680px`, incompressible. La rangée réclamait donc
          * toujours 24 + 239 (logo) + 20 + 680 + 20 + 189 (langue et
          * compte) = 1172 px, quelle que soit la fenêtre. Sous cette
          * largeur, le bloc poussait le côté droit HORS de la page —
          * l'icône du compte sortait de l'écran — et le document
          * s'élargissait d'autant : 1172 pour 1024 (148 px de trop),
          * 1172 pour 1100 (72 px de trop), rien à partir de 1196.
          * LA RÈGLE ÉTAIT DÉJÀ ÉCRITE, elle avait seulement été
          * défaite : la nº 146-§2 dit « 680 est un maximum, pas une
          * largeur fixe — `lg:shrink` + `min-w-0` laissent l'encadré se
          * réduire dès que la barre manque de place, AVANT que quoi que
          * ce soit d'autre ne cède ». C'est elle qu'on rétablit.
          *  · `lg:shrink` (et non `shrink-0`) : le bloc CÈDE, et lui
          *    seul — le logo et le côté du compte restent `flex-none`,
          *    ils ne bougent ni ne rétrécissent d'un pixel ;
          *  · `lg:grow-0` : il ne dépasse jamais 680 ;
          *  · `min-w-0` : il a le droit d'aller sous sa largeur de
          *    contenu, sinon la réduction ne peut pas jouer.
          * ⚠️ ET LES MARGES AUTOMATIQUES NE GÊNENT PAS : quand il reste
          * de la place, elles l'absorbent à égalité et le bloc garde ses
          * 680 px (nº 169-§4, intact) ; quand il en manque, elles valent
          * zéro et c'est la réduction qui joue. Les deux règles ne se
          * rencontrent jamais.
          * ⚠️ AUCUN `overflow-x: hidden` NULLE PART : on ne cache pas un
          * débordement, on retire ce qui déborde (le masque retiré à la
          * nº 228 ne revient pas).
          */}
        <div
          data-rangee-moteur=""
          className={`order-3 lg:order-2 basis-full lg:basis-[680px] lg:shrink lg:grow-0 lg:mx-auto
                      min-w-0 justify-center ${
                        surAccueil
                          ? `max-lg:grid max-lg:grid-cols-[minmax(0,1fr)]
                             max-lg:transition-[grid-template-rows,opacity]
                             max-lg:duration-300 max-lg:ease-out ${
                               moteurReplie
                                 ? "max-lg:grid-rows-[0fr] max-lg:opacity-0"
                                 : "max-lg:grid-rows-[1fr] max-lg:opacity-100"
                             } lg:flex`
                          : rangeeLibre
                            ? "flex"
                            : "hidden lg:flex"
                      }`}
          //  ⚠️ SEULEMENT LÀ OÙ LA RANGÉE SE REPLIE VRAIMENT
          //  (nº 154-§5) : ces deux attributs ignorent les points de
          //  rupture — appliqués sur le web, ils rendaient le moteur
          //  entier inerte dès qu'on avait défilé.
          aria-hidden={rangeeEscamotee || undefined}
          inert={rangeeEscamotee || undefined}
        >
          <div className="max-lg:min-h-0 max-lg:overflow-hidden flex w-full justify-center">
            {/*  Le pt-3 remplace l'ancien gap-y-3 du parent : il
                 appartient à la rangée et se replie avec elle. */}
            <div
              className={`w-full max-w-[720px] lg:pt-0 ${
                rangeePresente ? "max-lg:pt-3" : ""
              }`}
            >
              {rangee ? (
                //  §1 (nº 245) — la rangée libre : même enveloppe,
                //  même centrage, même repli. Seul son CONTENU change.
                rangee({
                  replie: moteurReplie && etroit,
                  //  §6 (nº 247) — L'ÉTAT EST LE MÊME POUR TOUS : le
                  //  doigt écrit là où l'écouteur lit, donc la rangée
                  //  se replie de nouveau au défilement suivant.
                  deplier: () => setMoteurReplie(false),
                })
              ) : (
                <MoteurTatouage
                  criteres={valeur}
                  surChangement={chercher}
                  rangeeMobile={surAccueil}
                />
              )}
            </div>
          </div>
        </div>

        {/**
          * §6 (nº 247) — LA LOUPE RETROUVE SA PAGE DE RECHERCHE
          * ------------------------------------------------------------
          * CE QUI SE PASSAIT. La page plein écran de la recherche
          * (PageRechercheMobile) est montée PAR LE MOTEUR, et par lui
          * seul : partout ailleurs, le moteur est bien là — simplement
          * caché sous 1024 px (`hidden lg:flex`) —, et comme sa page
          * est un PORTAIL, la loupe l'ouvre depuis n'importe où. Sur
          * « Ma sélection », la nº 245 a remplacé le contenu de la
          * rangée : plus de moteur monté du tout, donc plus personne
          * pour ouvrir la page. La loupe posait bien son état dans le
          * magasin partagé (recherche-mobile) — il n'y avait plus
          * d'écran pour l'entendre.
          * IL EST DONC REMONTÉ ICI, dans un hôte INVISIBLE : ce n'est
          * pas un second moteur, c'est LE moteur, sans sa rangée
          * (`rangeeMobile={false}`) et sans son encadré (le parent est
          * `hidden`) — rien qu'un porteur pour la page en portail.
          */}
        {rangeeLibre && (
          <div hidden data-hote-recherche="">
            <MoteurTatouage
              criteres={valeur}
              surChangement={chercher}
              id="moteur-hote-recherche"
              rangeeMobile={false}
            />
          </div>
        )}

        <nav
          aria-label="Langue et compte"
          //  gap-3 (nº 141-§7) : le cœur — ou le globe — respirait mal
          //  contre « Mon espace ».
          //  ⚠️ ANCRÉ AU BORD DROIT (nº 169-§4) : ce sont les marges
          //  automatiques du bloc central qui l'y poussent, en absorbant
          //  tout l'espace libre à égalité. `lg:ml-0` : sous `lg`, le
          //  `ml-auto` d'origine tient toujours.
          className="order-2 lg:order-3 ml-auto lg:ml-0 lg:flex-none shrink-0 flex items-center justify-end gap-3"
        >
          {/* LA LOUPE (nº 150-§3) — smartphone et écrans étroits
              seulement : elle mène à la recherche PARTOUT où la rangée
              du moteur n'est pas là — sur toutes les pages hors
              accueil, et sur l'accueil dès que la rangée est repliée.
              Elle garde sa place dans la barre même invisible
              (opacité seule) : son apparition ne décale jamais les
              icônes voisines, et elle suit le repli sans décalage.
              Rang 24, l'échelle de la barre. */}
          <button
            type="button"
            onClick={() => ouvrirRecherche(valeur)}
            aria-label="Rechercher"
            title="Rechercher"
            aria-hidden={!loupeVisible || undefined}
            tabIndex={loupeVisible ? 0 : -1}
            style={{ height: HAUTEUR_ACTIONS, width: HAUTEUR_ACTIONS }}
            className={`flex lg:hidden shrink-0 items-center justify-center rounded-full
                       transition-opacity duration-200 ${ETATS_ROND_BARRE}
                       text-sombre-texte
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-primaire ${
                         loupeVisible
                           ? "opacity-100"
                           : "opacity-0 pointer-events-none"
                       }`}
          >
            <IconeLoupe taille={24} />
          </button>
          {/* ⚠️ LA PLACE À GAUCHE DU COMPTE CHANGE DE MAIN SELON QU'ON
              EST CONNECTÉ (passe nº 137) :
               · DÉCONNECTÉ — le GLOBE des langues, comme toujours ;
               · CONNECTÉ — le CŒUR des favoris. Le globe, lui,
                 déménage dans la fenêtre « Mon compte », au-dessus de
                 Sécurité.
              Pourquoi un échange et non un ajout : la barre du
              smartphone tient trois éléments (logo, moteur, compte) et
              pas un de plus. Entre un sélecteur de langue qui ne
              propose qu'une langue et l'accès à ses propres photos, le
              choix se fait tout seul — et le globe reste à un geste,
              dans le menu. */}
          {connecte && utilisateur ? (
            <Link
              href="/mes-favoris"
              aria-label="Ma sélection"
              title="Ma sélection"
              //  §6 (nº 247) — L'ICÔNE DE LA PAGE COURANTE RAFRAÎCHIT.
              //  Un <Link> vers l'adresse où l'on est déjà ne fait
              //  RIEN : le routeur constate qu'il n'y a nulle part où
              //  aller. C'est pourtant le geste que tout le monde fait
              //  pour « revoir la page depuis le début ». On le rend
              //  donc : retour en haut, et le serveur redonne ses
              //  données (`router.refresh()` — les favoris d'à
              //  l'instant, sans recharger l'application entière).
              onClick={rafraichirSiDejaLa("/mes-favoris")}
              style={{ height: HAUTEUR_ACTIONS, width: HAUTEUR_ACTIONS }}
              className={`shrink-0 flex items-center justify-center rounded-full
                         transition-colors ${ETATS_ROND_BARRE}
                         focus-visible:outline-2 focus-visible:outline-offset-2
                         focus-visible:outline-primaire
                         text-sombre-texte`}
            >
              {/* ⚠️ LE FANION, ET PLUS LE CŒUR (nº 145-§3) : cette
                  icône désigne LA PAGE « Ma sélection », pas le geste
                  d'aimer une photo. Le cœur reste, lui, sur les cartes
                  et les fiches.
                  RANG 24 (nº 147-§6) : les icônes de la barre — globe,
                  fanion, compte — montent de 22 à 24, web et
                  smartphone. */}
              <IconeFanion taille={24} />
            </Link>
          ) : (
            <SelecteurLangue hauteur={HAUTEUR_ACTIONS} />
          )}

          {connecte && utilisateur ? (
            /* CONNECTÉ : « Mon espace » — le menu de compte (état de
               la fiche, Modification, Ma fiche, Déconnexion). */
            <MenuEspace
              idUtilisateur={utilisateur.id}
              nom={nom}
              hauteur={HAUTEUR_ACTIONS}
            />
          ) : (
            <>
              {/* SMARTPHONE : l'icône personnage, HABILLÉE COMME LE
                  GLOBE (grise, même gabarit, même survol) — elle mène
                  à la connexion. */}
              <Link
                href="/devenir-tatoueur"
                aria-label={libelleDeconnecte}
                title={libelleDeconnecte}
                style={{ height: HAUTEUR_ACTIONS, width: HAUTEUR_ACTIONS }}
                className={`sm:hidden flex items-center justify-center rounded-full
                           transition-colors ${ETATS_ROND_BARRE}
                           focus-visible:outline-2 focus-visible:outline-offset-2
                           focus-visible:outline-primaire
                           text-sombre-texte`}
              >
                {/*  LA SILHOUETTE SEULE, rang 24 (nº 147-§5 et §6). */}
                <IconeSilhouette taille={24} />
              </Link>

              {/* WEB : le bouton rose. Jamais venu, il invite ; déjà
                  venu, « Se connecter ».
                  ⚠️ LES DEUX ÉTATS OCCUPENT LA MÊME LARGEUR
                  (nº 203-§1a) : les deux libellés sont posés dans la
                  même case de grille — le plus long, invisible,
                  réserve la place. Quel que soit celui qui s'affiche,
                  le bouton ne change pas d'un pixel, et rien ne peut
                  jamais pousser le bloc central de la barre. */}
              <Link
                href="/devenir-tatoueur"
                aria-label={libelleDeconnecte}
                style={{ height: HAUTEUR_ACTIONS }}
                className="hidden sm:flex rounded-full px-5 items-center gap-2
                           bg-primaire hover:bg-primaire-fonce text-white
                           text-sm font-semibold transition-colors whitespace-nowrap
                           focus-visible:outline-2 focus-visible:outline-offset-2
                           focus-visible:outline-primaire"
              >
                <span className="grid text-center">
                  <span className="col-start-1 row-start-1">
                    {libelleDeconnecte}
                  </span>
                  <span aria-hidden="true" className="col-start-1 row-start-1 invisible">
                    Se connecter
                  </span>
                  <span aria-hidden="true" className="col-start-1 row-start-1 invisible">
                    {TEXTES_TATOUAGE.lienInscription}
                  </span>
                </span>
              </Link>
            </>
          )}
        </nav>
      </div>
      {/* ⚠️ LE VOILE DE FONDU DE LA Nº 161 EST SUPPRIMÉ (nº 163-§1) :
          son dégradé se lisait comme une OMBRE PORTÉE sur le contenu —
          pas voulu. C'est désormais le VERRE DÉPOLI de la barre qui
          éteint ce qui passe derrière (voir la classe du <header>). */}
    </header>
      {/**
        * LA RÉSERVE D'ESPACE DE LA BARRE FIXE (nº 195-§1a).
        * Sur mobile, la barre a quitté le flux : ce bloc invisible tient
        * sa place, exactement à sa hauteur — 128 px sur l'accueil quand
        * la rangée du moteur est dépliée, 64 px sinon (mesuré : la
        * rangée du logo fait 64, celle du moteur 64 de plus). Il suit le
        * repli avec la même durée, pour que le contenu monte et
        * descende comme avant.
        * Sur le web, la barre est restée `sticky` : la réserve n'existe
        * pas (`hidden`).
        */}
      {/**
        * ⚠️ ELLE SE DÉCLARE, EN PIXELS (nº 218-§4)
        * ------------------------------------------------------------
        * CETTE RÉSERVE CHANGE DE HAUTEUR — 128 px rangée dépliée, 64 px
        * repliée — et elle est DANS LE FLUX : tout le contenu descend
        * ou monte de 64 px avec elle. Or on quitte la mosaïque après
        * avoir défilé, donc rangée REPLIÉE, et l'on y revient rangée
        * DÉPLIÉE : rendre le même `scrollY` remettait l'œil 64 px plus
        * haut dans la liste. C'est le « cran » que voyait le
        * propriétaire, dans les deux dispositions.
        * Elle annonce donc les deux valeurs, et la mémoire de position
        * corrige l'écart (voir lib/navigation-session,
        * `memoriserDefilement`). Des NOMBRES, jamais une mesure : au
        * milieu de la transition de 300 ms, `offsetHeight` rendrait une
        * valeur intermédiaire qui n'est celle d'aucun des deux états.
        */}
      <div
        aria-hidden
        data-reserve-barre=""
        //  §4 (nº 245) — UNE TROISIÈME HAUTEUR, et une seule raison :
        //  repliée, la rangée LIBRE ne disparaît pas — il reste sa
        //  ligne étroite. La réserve doit donc l'annoncer, sans quoi
        //  le contenu passerait dessous. Les deux hauteurs du moteur
        //  (128 / 64) ne bougent pas d'un pixel : la position au
        //  retour reste celle de juillet.
        //  ⚠️ 104, ET C'EST UNE ADDITION, PAS UN CHOIX (nº 247-§6,
        //  recalculée nº 250-§2) : la rangée du logo fait 64 (40
        //  d'icônes + `py-3`), l'air au-dessus de la ligne étroite 12
        //  (`max-lg:pt-3`) et la ligne elle-même 28 (`min-h-[28px]`,
        //  resserrée d'un cran à la nº 250). La réserve suit, sans
        //  quoi la page sauterait d'autant.
        data-reserve-posee={
          rangeePresente && !moteurReplie ? 128 : rangeeLibre ? 104 : 64
        }
        data-reserve-depliee={rangeePresente ? 128 : 64}
        className={`hidden mobile:block shrink-0 transition-[height]
                    duration-300 ease-out ${
                      rangeePresente && !moteurReplie
                        ? "h-32"
                        : rangeeLibre
                          ? "h-[104px]"
                          : "h-16"
                    }`}
      />
    </>
  );
}
