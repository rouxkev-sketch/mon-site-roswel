"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LARGEUR_SITE } from "@/config/tatouage";
import {
  lireSelection,
  poserSelection,
  MENU_FAVORIS,
  MENU_SUIVIS,
} from "@/lib/filtres-selection";
//  §2 (nº 526) — la reconnaissance du glissement horizontal, écrite une
//  fois et branchée ici sur l'écriture qui existe déjà.
import { useGlissementLateral } from "@/lib/glissement-lateral";
import { lireRequeteCourante, souscrireAdresse } from "@/lib/adresse-courante";
import { CarteTatoueur } from "@/components/CarteTatoueur";
import { CLASSES_GRILLE_CARTES } from "@/components/GrilleTatoueurs";
import { ClavierCartes } from "@/components/ClavierCartes";
import { useVuePhototheque } from "@/components/AffichageMosaique";
import { positionSousLeGel } from "@/lib/gel-du-corps";
import { BlocSuivis } from "@/components/BlocSuivis";
import { FenetreFiche } from "@/components/FenetreFiche";
import { PileFiches } from "@/components/PileFiches";
//  §3 (nº 460) — le pont vers le va-et-vient de la barre : la page
//  pose les comptes filtrés, la barre les affiche.
import { poserComptesSelection } from "@/lib/compte-selection";
import {
  CLE_FENETRE_FICHE,
  type ContexteFenetreFiche,
} from "@/components/RetourFenetreFiche";
import { natureConnue, RENDU_PAR_DEFAUT } from "@/lib/photos-tatoueur";
import {
  cartesDesFavoris,
  photoDuChoix,
  suivisDuChoix,
} from "@/lib/selection-suivis";
import { ficheComplete } from "@/lib/fiche-complete";
//  §1 (nº 438) — la fermeture passe par history.back() : elle se
//  déclare, pour que le rattrapage du filet ne la prenne jamais pour
//  un atterrissage accidentel au fond de la pile.
import { annoncerRepriseDuSite } from "@/lib/navigation-session";
import type { PhotoFavorite, TatoueurSuivi } from "@/lib/favoris-serveur";
import type { Tatoueur } from "@/lib/tatoueurs";
//  §1 (nº 643) — l'écran vide des DEUX onglets, écrit une seule fois
//  (il porte le lien vers l'accueil qui déclare son départ, nº 475).
import { EcranVideSelection } from "@/components/EcranVideSelection";
//  nº 817 — l'encart « Welcome », une seule fois, pour un compte neuf.
import { EncartBienvenue } from "@/components/EncartBienvenue";
import { useBienvenue } from "@/lib/bienvenue";

/**
 * MA SÉLECTION — les photos gardées, et les tatoueurs suivis
 * ==========================================================
 * §1 (nº 243) — PLUS DE FENÊTRE POUR LES SUIVIS : ils vivaient
 * derrière un bouton, dans une fenêtre qui défilait sur elle-même —
 * deux défilements imbriqués et une boîte dans une boîte. Supprimée,
 * code compris. Tout vit dans la page, un seul défilement.
 *
 * §2 (nº 245) — ET PLUS DE VA-ET-VIENT NON PLUS. Le sélecteur
 * `Photos · Tatoueurs` de la nº 243 est supprimé, code compris : ce
 * sont LES DEUX MENUS de la barre — « Mes favoris » et « Mes suivis »
 * (MenusSelection, posés dans la rangée de EnTeteTatouage à la place
 * du bloc de recherche) — qui décident de ce qui s'affiche. Les deux
 * sections sont là, l'une sous l'autre : les photos gardées, puis les
 * artistes suivis.
 *
 * ⚠️ LES DEUX CHOIX VIVENT DANS L'ADRESSE (`?favoris=…`, `?suivis=…`),
 * comme tout depuis la nº 191 — et c'est aussi ce qui les fait
 * partager par la BARRE et par la PAGE, deux composants frères : voir
 * lib/filtres-selection. Le retour d'une fiche rend donc le même
 * filtre ET la même position (la mémoire de défilement est indexée
 * sur `chemin + recherche`, MemoireNavigation).
 *
 * LES MENUS NE MONTRENT QUE LES STYLES PRÉSENTS, et c'est le point
 * important : les trente-huit styles du site dans un menu où
 * trente-cinq entrées ne donnent rien seraient inutilisables. Les
 * listes sont CALCULÉES (voir `entreesDuFiltre`), dans l'ordre et
 * avec les libellés du menu du moteur — aucune seconde liste.
 *
 * ⚠️ UNE PHOTO RETIRÉE NE DISPARAÎT PAS SOUS LE DOIGT. Le cœur
 * s'éteint, la carte PÂLIT et reste en place : on peut se raviser
 * d'un second toucher. Elle ne s'en va qu'au prochain affichage de la
 * page. Faire disparaître une image à l'instant où on la touche, c'est
 * empêcher de revenir sur une erreur — et donner l'impression que
 * quelque chose s'est cassé.
 */

/*  §1 (nº 253) — LA PAGE NE PORTE PLUS AUCUN MENU : les deux entrées
    qu'elle recevait depuis la nº 249 sont retournées à la BARRE, seule
    à commander (l'encadré sur le web, les deux titres au doigt). Elle
    n'ANNONCE plus que ce qui est cherché. */
/**
 * ██ §1 (nº 597) — COMBIEN DE PORTFOLIOS PAR DÉPLIEMENT ██
 * ------------------------------------------------------------------
 * DOUZE, le nombre demandé par le propriétaire. Il n'a rien à voir
 * avec les colonnes, et c'est pour une raison de forme : un portfolio
 * occupe UNE LIGNE ENTIÈRE (`grid-cols-[minmax(0,1fr)]`, BlocSuivis) —
 * il n'y a donc aucune rangée à compléter, aucun multiple à respecter.
 * Les FAVORIS, eux, sont des cartes en grille : leur taille de page
 * suit les colonnes et vient du serveur (voir `taillePage`).
 * ██ §2 (nº 614) — ET ELLE VIENT DU SERVEUR ELLE AUSSI, DÉSORMAIS.
 * Le nombre n'est plus écrit ici : le propriétaire veut VINGT au doigt
 * et douze au web, et cette page-ci ne peut pas savoir quel appareil
 * la regarde — le serveur, lui, a le cookie des colonnes. La décision
 * vit donc là où vivent déjà toutes les tailles de page
 * (`taillePortfoliosServie`, lib/colonnes-mosaique), et non dans une
 * constante de composant qu'il aurait fallu doubler.
 */

export function PageFavoris({
  photos,
  suivis,
  taillePage,
  taillePortfolios,
}: {
  photos: PhotoFavorite[];
  suivis: TatoueurSuivi[];
  /** §1 (nº 597) — la taille d'une page de FAVORIS, décidée au cookie
      des colonnes par la page qui nous monte : un multiple du nombre
      de colonnes, pour que la dernière rangée reste pleine (nº 226). */
  taillePage: number;
  /** §2 (nº 614) — combien de PORTFOLIOS un dépliement montre, décidé
      au même cookie par la même page : vingt au doigt, douze au web.
      Aucun multiple à respecter — un portfolio prend toute la ligne. */
  taillePortfolios: number;
}) {
  //  LE FILTRE VIENT DE L'ADRESSE — la même source que les menus de la
  //  barre, lue par le même magasin (nº 245-§3, nº 247-§2).
  const requete = useSyncExternalStore(
    souscrireAdresse,
    lireRequeteCourante,
    () => ""
  );
  const choix = lireSelection(requete);
  /*  §2 (nº 247) — LES DEUX MENUS SONT EXCLUSIFS : un seul mène la
      recherche, et l'autre section n'est PAS affichée. À l'ouverture
      (adresse sans paramètre), c'est « Mes favoris » : les favoris
      seuls, aucun suivi. */
  const surLesFavoris = choix.menu === MENU_FAVORIS;
  /*  nº 818 — LA BIENVENUE DU PREMIER PASSAGE : la page décide (voir
      `useBienvenue`), et elle la monte À LA PLACE de l'état vide des
      favoris — jamais les deux (règle du propriétaire). Marquée « vue »
      dès ce passage : un compte d'avant ne la voit jamais. */
  const bienvenue = useBienvenue();
  /**
   * ██ §2 (nº 526) — UN GLISSEMENT HORIZONTAL CHANGE D'ONGLET ██
   * ------------------------------------------------------------------
   * LE GESTE est reconnu ailleurs (lib/glissement-lateral, où sont
   * écrits le verrou d'axe, le seuil, et tout ce qui doit le REFUSER —
   * les galeries, le bord du navigateur, la feuille ouverte, le
   * pincement). ICI, il ne reste que la traduction : le sens voulu
   * désigne un onglet, et cet onglet se pose comme si on l'avait
   * touché.
   * ⚠️ ET C'EST LITTÉRALEMENT LA MÊME ÉCRITURE : `poserSelection(cible,
   * "")` est mot pour mot ce que fait le va-et-vient de la barre
   * (MenusSelection, `surChoix`) quand le doigt touche l'autre côté.
   * D'où trois conséquences qu'on n'a pas à obtenir, on les HÉRITE :
   *  · le va-et-vient se met à jour tout seul — trait rose, nombre et
   *    chevron compris : il lit l'adresse, et c'est l'adresse qu'on
   *    écrit (les deux composants sont frères depuis la nº 245) ;
   *  · L'HISTORIQUE NE BOUGE PAS D'UN CRAN. `poserSelection` écrit par
   *    `replaceState` (nº 333) : une bascule ne pose aucune entrée, un
   *    seul appui de retour quitte toujours la page — la règle 332
   *    tient sans qu'on la touche ;
   *  · la liste neuve se pose EN HAUT (`ouvrirLaListeEnHaut`, nº 329),
   *    comme après un filtre.
   * ⚠️ LA BASCULE EST FRANCHE, SANS ANIMATION, et c'est un choix : les
   * deux sections sont EXCLUSIVES depuis la nº 247 — l'autre n'est même
   * pas montée. Une glissade d'une section à l'autre demanderait de
   * monter les deux et de les faire tenir côte à côte dans une piste
   * translatée : une seconde mise en page, une seconde grille, et le
   * piège 378/379 en plein. Le va-et-vient a déjà son animation à lui
   * (le trait rose qui coulisse) : c'est elle qui accuse le geste.
   * ⚠️ RIEN SI L'ON EST DÉJÀ DU BON CÔTÉ : sans cette garde, un
   * glissement vers la gauche sur « Portfolios » réécrirait l'adresse
   * et REMONTERAIT LA LISTE EN HAUT pour rien — on aurait perdu sa
   * place sans rien avoir changé.
   */
  const glissementDOnglet = useGlissementLateral((sens) => {
    const cible = sens === 1 ? MENU_SUIVIS : MENU_FAVORIS;
    if (cible === choix.menu) return;
    poserSelection(cible, "");
  });
  /*  §4 (nº 255) — LA MISE EN PAGE DES CARTES. L'icône posée dans la
      barre commande la MÊME vue que sur la page de recherche : le
      magasin est partagé (lib/vue-phototheque, lu ici par le même
      abonnement que la mosaïque). Sans cette lecture, l'icône ne
      commanderait rien — les cartes de cette page ignoraient l'état.
      §2 (nº 257) — ET SON INSTANTANÉ SERVEUR EST CELUI DU COOKIE : le
      contexte le porte (voir plus bas), exactement comme la mosaïque
      le reçoit d'IndexTatoueurs. */
  const phototheque = useVuePhototheque();

  /**
   * §5 (nº 243) — LA DERNIÈRE VISITE S'ÉCRIT AU DÉPART, JAMAIS À
   * L'OUVERTURE : écrite à l'arrivée, elle effacerait les compteurs
   * avant qu'ils n'aient été lus. La valeur affichée vient du rendu
   * serveur (lue au montage) ; ici, on ne fait que MARQUER la visite
   * quand on s'en va — `pagehide` couvre la fermeture d'onglet et le
   * passage en arrière-plan sur iOS (`beforeunload` n'y est pas
   * fiable), le nettoyage de l'effet couvre la navigation interne.
   * `sendBeacon` : la requête survit au départ de la page.
   */
  useEffect(() => {
    let marquee = false;
    const marquer = () => {
      if (marquee) return;
      marquee = true;
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/selection/visite", new Blob([], { type: "text/plain" }));
        } else {
          void fetch("/api/selection/visite", { method: "POST", keepalive: true });
        }
      } catch {
        //  Sans importance : le compteur restera celui d'avant.
      }
    };
    window.addEventListener("pagehide", marquer);
    return () => {
      window.removeEventListener("pagehide", marquer);
      marquer();
    };
  }, []);

  /* ================================================================
   * LA FICHE EN FENÊTRE SUPERPOSÉE (nº 143-6B)
   * ================================================================
   * Une carte de favori mène à une fiche EXACTEMENT comme une carte de
   * la mosaïque : sur le web, elle s'ouvre PAR-DESSUS la page, sans la
   * quitter. Elle naviguait, et l'on perdait sa place dans une liste
   * qu'on est précisément en train de parcourir.
   *
   * ⚠️ LA MÊME MÉCANIQUE QUE LA MOSAÏQUE, à la lettre — `pushState`
   * vers /tatoueur/…, le drapeau `data-fenetre-fiche` posé AVANT lui
   * (DefilementEnHaut le lit à ce moment-là), la note de rechargement,
   * et la fenêtre qui ne vit que tant que l'adresse est la sienne. Le
   * bouton « précédent » la referme sans une ligne de plus.
   *
   * ⚠️ UNE SEULE DIFFÉRENCE, et elle est dans la donnée : la mosaïque
   * tient déjà une fiche (allégée) pour chaque carte et ouvre donc
   * INSTANTANÉMENT ; ici, on n'a que le slug de la photo. On demande
   * la fiche — mais le survol l'a presque toujours déjà rapportée
   * (`ficheComplete` garde ses réponses), si bien que le clic ouvre
   * sans attendre. Base injoignable : on laisse le lien faire son
   * travail, et la page de fiche s'ouvre normalement.
   */
  const pathname = usePathname();
  const [ficheOuverte, setFicheOuverte] = useState<Tatoueur | null>(null);
  /** §5 (nº 328) — CETTE PAGE A-T-ELLE POUSSÉ L'ENTRÉE ? Voir
      `fermerLaFiche` : une fermeture ne consomme que ce qu'elle a
      créé (point 7 de la règle). */
  const entreePoussee = useRef(false);
  const [positionPage, setPositionPage] = useState(0);
  /**
   * §1 (nº 247) — LES TROIS TAGS DE L'ENSEMBLE OUVERT, ET PLUS LE SEUL
   * STYLE. C'est ICI que la catégorie se perdait : la fenêtre ne
   * recevait que `styleRecherche`, donc elle ouvrait TOUT le style —
   * et sa première photo est une réalisation. On ouvrait un flash, on
   * voyait une réalisation.
   */
  /*  §4 (nº 302) — ET L'IDENTIFIANT DE LA PHOTO TOUCHÉE. Les trois
      tags désignent une SÉRIE ; ils ne disent pas LAQUELLE des photos
      on a ouverte. La carte de favori EST une photo : son identifiant
      voyage avec, et la fenêtre s'ouvre dessus (« 8/14 »). */
  const [serieOuverte, setSerieOuverte] = useState({
    cle: "",
    style: "",
    nature: "",
    rendu: "",
    photo: "",
  });
  /*  §1 (nº 318) — COMBIEN DE FICHES SONT EMPILÉES PAR-DESSUS la
      fenêtre de base : remonté par PileFiches, exactement comme sur la
      mosaïque (nº 226-§5). Un artiste ouvert depuis la fenêtre change
      l'adresse — la fenêtre de base ne doit pas se fermer pour autant :
      son contenu, sa série et son gel du corps l'attendent au retour. */
  const [profondeurPile, setProfondeurPile] = useState(0);
  const visible =
    ficheOuverte !== null &&
    (pathname === `/tatoueur/${ficheOuverte.slug}` || profondeurPile > 0);

  const ouvrirLaFiche = useCallback(
    async (
      slug: string,
      serie: {
        cle: string;
        style: string;
        nature: string;
        rendu: string;
        photo: string;
      },
      adresse: string
    ) => {
      const fiche = await ficheComplete(slug);
      if (!fiche) {
        //  Rien à montrer : on s'efface devant la navigation normale.
        window.location.assign(adresse);
        return;
      }
      try {
        const note: ContexteFenetreFiche = {
          slug,
          retour: window.location.pathname + window.location.search,
          //  §2 (nº 328) — sous le gel, jamais brute (point 4).
          defilement: positionSousLeGel(),
        };
        sessionStorage.setItem(CLE_FENETRE_FICHE, JSON.stringify(note));
      } catch {
        // Stockage indisponible : le rechargement servira la page.
      }
      setPositionPage(positionSousLeGel());
      setSerieOuverte(serie);
      document.documentElement.setAttribute("data-fenetre-fiche", "1");
      /**
       * §1 (nº 314) — L'ADRESSE GARDE SA REQUÊTE, ET C'EST TOUT LE BUG.
       * ----------------------------------------------------------------
       * CE QUI ÉTAIT ÉCRIT : `pushState(…, `/tatoueur/${slug}`)` — une
       * adresse SANS AUCUNE requête. Or L'ONGLET DE CETTE PAGE VIT DANS
       * LA REQUÊTE (`?selection=suivis:…`, lu par `lireSelection` à
       * travers `lireRequeteCourante()`, qui rend `window.location.search`).
       * En l'effaçant, on faisait retomber la page sur le choix par
       * défaut — « Mes favoris ». La fenêtre s'ouvrait bien, mais LA
       * PAGE DERRIÈRE BASCULAIT SUR L'ONGLET FAVORIS, et la refermer y
       * laissait le propriétaire.
       * ⚠️ ÇA NE SE VOYAIT PAS DEPUIS LES CARTES DE FAVORIS : on y est
       * DÉJÀ sur l'onglet par défaut, donc l'effacement ne changeait
       * rien. Le défaut n'est apparu qu'en ouvrant la même écriture
       * depuis les PORTFOLIOS (nº 312-§2).
       * LE REMÈDE : on emporte la requête courante. L'onglet, le filtre
       * de style et la catégorie survivent à l'ouverture, et la
       * fermeture rend la page exactement telle qu'elle était.
       */
      window.history.pushState(
        { fenetreFiche: true },
        "",
        `/tatoueur/${slug}${window.location.search}`
      );
      entreePoussee.current = true;
      setFicheOuverte(fiche);
    },
    []
  );

  const fermerLaFiche = useCallback(() => {
    document.documentElement.removeAttribute("data-fenetre-fiche");
    try {
      sessionStorage.removeItem(CLE_FENETRE_FICHE);
    } catch {
      // Sans importance : la note ne sert qu'au rechargement.
    }
    setFicheOuverte(null);
    /*  §1 (nº 318) — ET LA MACHINE ARRIÈRE, comme la mosaïque (son
        `fermer` ne fait que ça). L'ouverture POUSSE une entrée
        d'historique ; la croix, le voile et Échap doivent la
        CONSOMMER — sans quoi l'adresse restait /tatoueur/… sur une
        page qui montre « Ma sélection », et le compte de l'historique
        divergeait de celui de la pile posée à cette passe (une entrée
        par fenêtre, un cran par retour). Le bouton « précédent »,
        lui, passait déjà par là — c'est le même chemin désormais. */
  /**
   * §5 (nº 328) — UNE FERMETURE NE CONSOMME QUE CE QU'ELLE A CRÉÉ.
   * ------------------------------------------------------------------
   * C'est le POINT 7 de la règle (lib/navigation-session). `fermer`
   * faisait `history.back()` SANS CONDITION — or l'entrée n'existe que
   * si c'est bien CETTE surface qui l'a poussée. Sur smartphone,
   * l'ouverture passe par un `<Link>` ordinaire et ne pousse rien
   * d'ici : une fermeture consommerait alors l'entrée du dessous, et
   * l'on reculerait d'un cran de trop.
   * ⚠️ UN DRAPEAU, PAS UN TEST D'APPAREIL. « Ai-je poussé ? » est la
   * question exacte ; « suis-je sur un mobile ? » n'en est qu'un
   * indice, et il serait faux le jour où une largeur change d'avis.
   */
    if (!entreePoussee.current) return;
    entreePoussee.current = false;
    //  §1 (nº 438) — reprise déclarée AVANT le back : le rattrapage du
    //  filet la lit au popstate et se tait.
    annoncerRepriseDuSite();
    window.history.back();
  }, []);

  /** LES STYLES RÉELLEMENT ENREGISTRÉS, avec leur nombre — dans
      l'ordre d'arrivée des photos (la plus récente d'abord), donc le
      style qu'on vient d'enrichir se présente en premier. */
  /** ⚠️ IL COMPTE LES ENSEMBLES, PLUS LES PHOTOS (nº 213-§3d) : la
      page affiche un élément par ensemble — le sélecteur doit annoncer
      ce qu'il va montrer, pas ce qu'il contient. Trois ensembles de
      réalisme font « 3 », qu'ils portent trois photos ou trente. */
  //  UN SEUL FILTRE, celui du menu actif (l'adresse) — et la règle vit
  //  dans `lib/selection-suivis`, écrite une fois pour le filtrage
  //  comme pour le comptage des entrées de menu.
  //  ⚠️ PLUS DE `useMemo` À LA MAIN ICI (nº 249) : le compilateur de
  //  React ne parvenait plus à préserver ces deux mémoïsations depuis
  //  que `choix` sert aussi aux titres — il mémoïse désormais
  //  lui-même, et ces filtres sur quelques dizaines d'éléments ne
  //  coûtent rien.
  //  §2-e (nº 316) — LE PROFIL VOYAGE AVEC LE STYLE jusqu'au filtre :
  //  c'est la même règle, écrite une fois dans `suivisDuChoix`.
  const { nature, style, profil } = choix;
  const visibles = surLesFavoris
    ? photos.filter((photo) => photoDuChoix(photo, { nature, style }))
    : [];
  const suivisVisibles = surLesFavoris
    ? []
    : suivisDuChoix(suivis, { nature, style, profil });

  /**
   * LES ENSEMBLES À MONTRER — un par ensemble, dans l'ordre d'arrivée
   * (le plus récemment enrichi d'abord), CHACUN SOUS LA FORME D'UNE
   * FICHE (nº 213-§3b).
   * ⚠️ C'EST LA CARTE DE LA MOSAÏQUE qui les affiche désormais, sans
   * variante : elle attend un tatoueur et sa galerie. On lui donne
   * donc le tatoueur de l'ensemble, et pour galerie LES PHOTOS DE CET
   * ENSEMBLE — ce qui fait tomber juste, sans rien écrire de plus, la
   * photo montrée, le cœur (qui aime l'ensemble) et, en pleine largeur
   * au doigt, le défilement des photos.
   * Les champs qu'une carte ne lit pas (coordonnées, réseaux) sont
   * neutres : les inventer serait pire que les laisser vides.
   * ⚠️ PLUS DE `useMemo` À LA MAIN (nº 249) : sa dépendance `visibles`
   * est désormais calculée au rendu — c'est le compilateur de React
   * qui mémoïse, comme pour les deux filtres au-dessus.
   */
  /*  §2 (nº 303) — LA LISTE DES CARTES EST CALCULÉE HORS DE CE
      COMPOSANT (`cartesDesFavoris`, lib/selection-suivis) : une photo
      aimée = une carte, et c'est une RÈGLE, pas un détail d'affichage.
      Sortie d'ici, elle s'exécute — donc elle se prouve. */
  const ensemblesVisibles = cartesDesFavoris(visibles);

  /**
   * ██ §1 (nº 597) — LA PAGINATION DE « MA SÉLECTION » ██
   * ==================================================================
   * ELLE N'A RIEN À DEMANDER À PERSONNE, et c'est ce qui la sépare de
   * celle de l'accueil : tout est DÉJÀ chargé (la page lit ses favoris
   * en entier, relevé nº 596). Déplier, ici, c'est seulement MONTRER
   * PLUS DE CE QU'ON A. D'où un BOUTON, jamais un lien : aucune
   * navigation, aucune adresse à changer, aucun rendu serveur.
   * ⚠️ CE QUE CELA ÉVITE, ET CE N'EST PAS UN DÉTAIL : le défaut relevé
   * à la nº 595 sur l'accueil — où « Voir plus » navigue vers `/?page=2`,
   * fait ressortir la page prérendue du cache du routeur et démonte
   * tout l'arbre — NE PEUT PAS se produire ici. Deux raisons, et
   * chacune suffirait : cette page est dynamique (`force-dynamic`),
   * il n'existe donc aucune version prérendue à ressortir ; et surtout
   * il n'y a AUCUNE navigation, donc rien à démonter. Les cartes déjà
   * posées ne sont pas retouchées — React les reconnaît à leur clé et
   * n'ajoute que les suivantes.
   *
   * LE COMPTE REPART À ZÉRO QUAND LE FILTRE CHANGE, et c'est le seul
   * choix qui se défend : après avoir déplié trente favoris puis choisi
   * « Flash », garder trente reviendrait à tout montrer d'un coup d'une
   * liste qu'on vient de restreindre — le dépliement du filtre
   * précédent n'a aucun sens pour le nouveau. Changer d'ONGLET repart
   * de zéro pour la même raison (et la taille de page n'est pas la même
   * des deux côtés).
   * ⚠️ AJUSTÉ PENDANT LE RENDU, jamais dans un effet : c'est le motif
   * de React employé au même endroit par la mosaïque (IndexTatoueurs)
   * et par la pile des fiches. Un effet peindrait d'abord l'ancien
   * compte, puis le corrigerait — un clignotement pour rien.
   */
  const cleDuChoix = `${choix.menu}|${choix.nature}|${choix.style}|${choix.profil}`;
  const parDepliement = surLesFavoris ? taillePage : taillePortfolios;
  const [affiches, setAffiches] = useState(parDepliement);
  const [choixDeplie, setChoixDeplie] = useState(cleDuChoix);
  if (choixDeplie !== cleDuChoix) {
    setChoixDeplie(cleDuChoix);
    setAffiches(parDepliement);
  }
  const cartesDepliees = ensemblesVisibles.slice(0, affiches);
  const suivisDeplies = suivisVisibles.slice(0, affiches);

  /**
   * ██ §1 (nº 597) — LE PIED DE LISTE : LE JUMEAU DE CELUI DE L'ACCUEIL ██
   * ==================================================================
   * ⚠️ CES VALEURS SONT RECOPIÉES DE L'ACCUEIL (IndexTatoueurs), sur
   * ordre du propriétaire : capsule, largeur (celle du web en base, la
   * variante `mobile:` pour le doigt — nº 592 et nº 593), hauteur,
   * rayon, couleurs, et le compteur gris en dessous. RIEN N'EST
   * PARTAGÉ : le bouton de l'accueil est un LIEN qui navigue, celui-ci
   * est un BOUTON qui compte — même apparence, mécanismes étrangers.
   * ⚠️ LES DEUX DOIVENT DONC ÊTRE CHANGÉS ENSEMBLE. Toucher l'un sans
   * l'autre les fera diverger sans que rien ne le signale : il n'y a
   * pas d'écriture commune pour s'en apercevoir. C'est le prix accepté
   * pour ne pas remanier l'accueil.
   * ⚠️ LE BLOC RESTE MÊME QUAND IL N'Y A PLUS RIEN À DÉPLIER (la règle
   * nº 220-§2, reprise telle quelle) : c'est son CONTENU qui s'efface,
   * jamais le bloc — sinon il quitterait le document d'un coup sous
   * les pieds de quelqu'un qui est justement en bas de page.
   */
  const piedDeListe = (montres: number, total: number) => (
    <div
      className={
        montres < total ? "mt-10 flex flex-col items-center gap-2" : "mt-10"
      }
    >
      {montres < total && (
        <>
          <button
            type="button"
            onClick={() => setAffiches((deja) => deja + parDepliement)}
            className="inline-flex items-center justify-center rounded-full
                       bg-sombre-eleve px-5 min-h-[42px]
                       w-[328px] mobile:w-[160px]
                       text-[14px] font-semibold
                       text-sombre-texte transition-colors
                       hover:bg-sombre-haut"
          >
            See more
          </button>
          <p className="text-[13px] text-sombre-texte-doux">
            {montres} sur {total}
          </p>
        </>
      )}
    </div>
  );

  /**
   * §3 (nº 460) — LES COMPTES DU VA-ET-VIENT DE LA BARRE (mobile).
   * ------------------------------------------------------------------
   * Le côté choisi du va-et-vient affiche LE NOMBRE DE CE QUI EST
   * RÉELLEMENT MONTRÉ après filtrage — les longueurs mêmes que le
   * sous-titre du web (`visibles`, `suivisVisibles`), posées dans le
   * petit magasin que la barre lit (lib/compte-selection). Le côté
   * inactif reste `null` : ses listes ne sont pas calculées (les deux
   * menus sont exclusifs, nº 247), et il n'affiche pas de nombre.
   * Reposé à CHAQUE rendu filtré : le nombre suit les filtres.
   */
  useEffect(() => {
    poserComptesSelection(
      surLesFavoris ? visibles.length : null,
      surLesFavoris ? null : suivisVisibles.length
    );
  }, [surLesFavoris, visibles.length, suivisVisibles.length]);

  return (
    /*  §1 (nº 318) — LA PILE DES FICHES SUPERPOSÉES ENVELOPPE LA PAGE.
        C'ÉTAIT LE CHAÎNON MANQUANT, et tout le défaut : la fenêtre de
        cette page était montée SANS fournisseur de pile — les liens
        internes d'une fiche (membre d'équipe, salon, studio, guest)
        ne trouvaient donc aucune main pour empiler (`useOuvertureFiche`
        rendait null) et redevenaient des liens : la fiche suivante
        s'ouvrait EN PLEIN ÉCRAN, hors de la fenêtre. La mosaïque et la
        page de fiche avaient leur pile depuis la nº 226 ; cette page,
        née après (nº 143), ne l'avait jamais reçue.
        RÉEMPLOI STRICT : le fournisseur, ses fenêtres, son historique
        (une entrée par fiche, un cran par retour) — rien n'est réécrit
        ici. La règle entière vit dans PileFiches, où elle est écrite. */
    <PileFiches surProfondeur={setProfondeurPile} voileDejaPose>
    {/*  §1 (nº 371) — LE MÊME ÉCOUTEUR DE CLAVIER QUE LA MOSAÏQUE, monté
         UNE FOIS pour toute la page : « Ma sélection » rend les mêmes
         cartes, elles répondent donc aux mêmes flèches. Les deux
         surfaces ne coexistent jamais : jamais plus d'un écouteur. */}
    <ClavierCartes />
    {/*  ⚠️ LA LARGEUR DE LA MOSAÏQUE (nº 213-§3a) : `LARGEUR_SITE` et
        les mêmes marges latérales que l'accueil — cette page montre
        les mêmes cartes, elle doit occuper le même espace. */}
    <main
      /*  §1 (nº 254) — LE `pt-6` EN TROP EST PARTI : la page de
          recherche n'en met pas sur son <main> — c'est LigneResultats
          qui porte l'air du titre (pt-6 sm:pt-8, pb-5 sm:pb-6). Le
          doubler ici décalait « Mes favoris » de 24 px vers le bas par
          rapport à la recherche. Mêmes classes, même composant : les
          deux pages sont désormais identiques valeur par valeur. */
      className={`flex-1 mx-auto w-full ${LARGEUR_SITE} px-4 sm:px-6 pb-16`}
      /*  §2 (nº 526) — LES QUATRE ÉCOUTEURS TACTILES DU GLISSEMENT, ET
          RIEN D'AUTRE : cette ligne n'ajoute pas une classe, pas un
          style, pas une boîte — la racine de page ne change ni de forme
          ni de taille (pièges 378/379). Elle ÉCOUTE, elle n'empêche
          rien : ni `preventDefault`, ni `touch-action`.
          ⚠️ ET C'EST LE BON PORTEUR, PAS UN CHOIX DE CONFORT : la
          feuille des filtres, le panneau du web, leur voile et la pile
          de fiches vivent dans un PORTAIL — hors de cet élément. Leurs
          gestes ne passent donc jamais ici, sans qu'aucune garde ait à
          les nommer. */
      {...glissementDOnglet}
    >
      {/* ---------- LE TITRE (§2, nº 249) ----------
           « Ma sélection » et le sous-titre en capitales ont DISPARU.
           À la place, L'ÉCRITURE DE LA PAGE DE RECHERCHE — le même
           composant (`LigneResultats`), la même hiérarchie : le titre
           est le menu qui mène la recherche (« Mes favoris », aussi le
           titre de l'écran d'ouverture, ou « Mes suivis »), et
           dessous, LE CRITÈRE EN COURS, écrit par `libelleExplorer` —
           l'écriture exacte de la page de recherche (« Réalisations ·
           Abstrait », « Tous les flashs ») ; rien sans critère.
           §3 — SUR LE WEB, CE TITRE EST LE CONTRÔLE : voir
           `titreControle`. */}
      {/*  §1 (nº 257) — LE SOUS-TITRE LIT LA MÊME ÉCRITURE QUE LE CHAMP
           DE LA BARRE (`libelleDuChoix`) : sur « Mes suivis », le menu
           n'a plus de catégorie, et `libelleExplorer` rendait « » pour
           un style pourtant choisi — le critère disparaissait de la
           page. Une seule écriture, deux endroits. */}
      {/*  §2 (nº 263) — le titre est un MOT NU depuis la nº 253 :
           `titreControle`, réduit à l'identité, est parti avec le
           titre inactif qu'il servait encore. */}
      {/*  §1 (nº 301) — LES DEUX TITRES DISENT CE QUE LA LISTE CONTIENT.
           « Mes suivis » → « Ma sélection de portfolios » : la liste ne
           contient PAS que des artistes — il y a aussi des salons et
           des studios, et « portfolio » est le seul mot qui couvre les
           trois. « Mes favoris » → « Ma sélection de photos » : celle-là
           contient des photos. ⚠️ AUCUNE SESSION FUTURE NE DOIT LES
           « CORRIGER » : ce sont les mots du propriétaire, et la raison
           est écrite ici.
           §1 (nº 301) — ET LE TITRE GARDE LE MÊME DÉGAGEMENT dans les
           deux cas (voir `degagementConstant`) : le sous-titre n'existe
           que sous un filtre, la page sautait de 30 px quand on le
           retirait. */}
      {/*  §1 (nº 303) — LE SOUS-TITRE PORTE LE COMPTE, et il ne peut
           plus être vide. ⚠️ LE NOM DU FILTRE EST GARDÉ : jusqu'ici
           cette ligne ne disait QUE lui (« Réalisme », « Réalisations ·
           Abstrait ») ; les deux tiennent ensemble — « Réalisme ·
           7 portfolios sur 18 ». Les trois cas (un, aucun, filtré)
           vivent dans `compteDeLaSelection`, pas ici. */}
      {/*  ██ §1 (nº 462) — PLUS AUCUN TITRE, WEB COMPRIS ██
           Le bloc de tête (« Ma sélection de photos » / « 10 photos »,
           « 7 portfolios sur 18 »…) avait quitté le DOIGT à la nº 460
           (`masqueAuDoigt`) ; il part désormais DES DEUX CÔTÉS, code
           compris — filtré ou non. Le va-et-vient de la barre porte le
           compte (nº 460/461), il n'y a plus rien à répéter ici.
           L'AIR qui le remplace est celui du doigt (nº 445,
           `data-air-sous-barre`, 14 px), désormais aux deux
           largeurs — aucune bande vide à l'ancienne hauteur du titre. */}
      {/*  §2 (nº 463) — L'AIR GRANDIT AU WEB SEULEMENT : 14 px au
           doigt (l'écriture nº 445, bien réglée — pas un pixel de
           plus), 32 px au web (`lg:h-8`) — le `sm:pt-8` que les blocs
           de tête des pages web portaient (LigneResultats), le jeton
           d'air des têtes de page, rien d'inventé. Posé sur CE
           séparateur, jamais sur un conteneur partagé. */}
      <div aria-hidden data-air-sous-barre className="h-3.5 lg:h-8" />

      {/* ---------- LES PHOTOS GARDÉES ----------
           §2 (nº 247) — LES DEUX MENUS SONT EXCLUSIFS : cette section
           n'existe que si « Mes favoris » mène la recherche. Choisir
           dans « Mes suivis » la fait disparaître, et réciproquement —
           on ne lit jamais deux recherches à la fois. */}
      {!surLesFavoris ? null : photos.length === 0 ? (
        /* L'ÉTAT VIDE — il dit quoi faire, en une ligne, et ouvre la
           porte. Pas de dessin, pas de paragraphe. */
        /*  ██ §1 (nº 643) — LA BOÎTE ET LE BOUTON ONT DÉMÉNAGÉ ██
             Ils vivent désormais dans `EcranVideSelection`, monté ICI
             et par l'onglet Portfolios (`BlocSuivis`) : le propriétaire
             veut le même bouton des deux côtés, et une seule écriture
             est la seule façon qu'ils ne divergent jamais. Rien n'est
             redessiné — la boîte, ses airs et l'apparence du bouton
             sont ceux de cet écran-ci, repris au caractère.
             LE MESSAGE, LUI, EST DU PROPRIÉTAIRE : « Touche le fanion
             d'une photo pour la retrouver ici » (nº 642) devient une
             phrase qui décrit l'écran au lieu de dicter un geste.
             nº 818 — LA BIENVENUE PREND SA PLACE tant qu'elle se
             montre (premier passage) ; disparue, l'état vide revient
             tant que la page est vide. Jamais les deux. */
        bienvenue ? (
          <EncartBienvenue />
        ) : (
          <EcranVideSelection message="Your favorite photos will show up here." />
        )
      ) : (
        <>
          {/*  ⚠️ LES DEUX FILTRES QUI VIVAIENT ICI SONT PARTIS
               (nº 245-§2) : le menu de style local et le sélecteur
               Réalisations / Flashs faisaient double emploi avec les
               deux menus de la barre, qui décident désormais seuls.
               Une seule écriture, et un seul endroit où choisir. */}
          {/* ---------- LES PHOTOS, EN CARTES ---------- */}
          {ensemblesVisibles.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-sombre-carte px-4 py-6 text-center text-[14px] text-sombre-texte-doux">
              Nothing saved in this style.
            </p>
          ) : (
            /*  ⚠️ LA GRILLE DE LA MOSAÏQUE, L'ÉCRITURE MÊME (nº 249-§4).
                Cette page en recopiait les colonnes mais PAS les
                gouttières du smartphone : ses cartes gardaient 16 px
                d'écart là où la recherche colle les siennes bord à
                bord (2 px). C'est désormais LA MÊME CHAÎNE DE CLASSES
                (`CLASSES_GRILLE_CARTES`, exportée par la mosaïque) —
                mêmes cartes, même grille, une seule écriture. */
            /*  §2 (nº 264) — PLUS AUCUNE MARGE AJOUTÉE SOUS LE BLOC DU
                TITRE : la recherche enchaîne sa grille directement sous
                le `pb` de LigneResultats (relevé vivant : 20 px au
                doigt, 24 sur le web, dans les DEUX états) — le `mt-6`
                d'ici s'y AJOUTAIT, et le bloc ne respectait plus les
                marges de la page de recherche. Même écriture, même
                rythme, plus rien d'ajouté. */
            /*  §3 (nº 452 → nº 706) — la marque `data-signe-muet`
                taisait le trait de chargement sur ce chemin ; le
                trait n'existe plus (nº 706), la marque est partie
                avec. L'avalement du re-clic et le nettoyage à
                l'arrivée (GardeDesNavigations) ne changent pas. */
            <ul className={CLASSES_GRILLE_CARTES}>
              {/*  §1 (nº 597) — LA TRANCHE DÉPLIÉE, jamais la liste
                   entière. Les cartes déjà posées gardent leur clé,
                   donc leur place : le dépliement n'en retouche
                   aucune, il en ajoute. */}
              {cartesDepliees.map(({ cle, fiche, photo }) => (
                <li key={cle}>
                  {/*  ⚠️ LA CARTE DE LA MOSAÏQUE, SANS VARIANTE
                       (nº 213-§3b) — le même composant que la
                       recherche, donc les mêmes proportions, le même
                       cœur, le même sous-titre, et le défilement des
                       photos en pleine largeur. */}
                  {/*  §1 (nº 247) — LA CATÉGORIE VOYAGE, ELLE AUSSI.
                       Elle manquait ici : l'adresse que la carte
                       fabrique (`?style=…&rendu=…`) n'emportait donc
                       pas `&nature=`, et le smartphone — qui navigue
                       par ce lien — ouvrait TOUT le style. C'est la
                       moitié mobile du défaut. */}
                  <CarteTatoueur
                    tatoueur={fiche}
                    //  §2 (nº 452) — LE FANION REVIENT SUR CES CARTES,
                    //  et sur elles seules : visible en permanence dans
                    //  l'angle de l'image (l'état d'avant la nº 445) —
                    //  retirer un favori depuis la page redevient
                    //  possible. La mosaïque du moteur ne passe pas ce
                    //  drapeau et reste nue.
                    fanion
                    styleRecherche={photo.style}
                    renduRecherche={photo.rendu ?? ""}
                    natureRecherche={natureConnue(photo.nature)}
                    //  §4 (nº 302) — au doigt, la carte NAVIGUE : son
                    //  adresse porte la photo, et la fiche s'ouvre
                    //  dessus. Sur le web, c'est la fenêtre superposée
                    //  qui la reçoit (voir plus bas) — le même
                    //  identifiant, les deux chemins.
                    photoRecherche={photo.id}
                    //  §4 (nº 255) — LA MÊME VUE QUE LA MOSAÏQUE : le
                    //  drapeau que la carte attend depuis toujours, et
                    //  que cette page ne lui donnait pas.
                    phototheque={phototheque}
                    /*  §2 (nº 371) — LA PHOTO REGARDÉE, ET NON PLUS
                        SEULEMENT CELLE DE LA CARTE. La carte de « Ma
                        sélection » naît sur `photo.id` ; dès qu'on fait
                        défiler son carrousel, c'est le rang courant
                        qu'elle annonce, et la fiche s'ouvre dessus —
                        exactement comme dans la mosaïque. Sans défilé,
                        la valeur reçue EST `photo.id` : cette page se
                        comporte comme avant, au caractère près. */
                    surOuverture={(_, photoRegardee) => {
                      const photoVoulue = photoRegardee || photo.id;
                      void ouvrirLaFiche(
                        photo.tatoueurSlug,
                        {
                          cle,
                          style: photo.style,
                          nature: natureConnue(photo.nature),
                          rendu: photo.rendu ?? RENDU_PAR_DEFAUT,
                          //  §4 (nº 302) — la photo elle-même.
                          photo: photoVoulue,
                        },
                        `/tatoueur/${photo.tatoueurSlug}?style=${photo.style}` +
                          `&nature=${natureConnue(photo.nature)}&rendu=${
                            photo.rendu ?? RENDU_PAR_DEFAUT
                          }&photo=${photoVoulue}`
                      );
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
          {/*  §1 (nº 597) — LE PIED DES FAVORIS : la taille de page
               suit les colonnes (voir `taillePage`), la rangée reste
               donc pleine à chaque appui. Voir la note de
               `piedDeListe`. */}
          {piedDeListe(cartesDepliees.length, ensemblesVisibles.length)}
        </>
      )}

      {/* ---------- LES ARTISTES SUIVIS (nº 243-§2 à §5) ----------
           §2 (nº 247) — ILS N'APPARAISSENT QUE SI « Mes suivis » mène
           la recherche : à l'ouverture, la page ne montre QUE les
           favoris. §2 (nº 249) — le sous-titre en capitales est parti :
           le TITRE de la page dit déjà « Mes suivis ». */}
      {!surLesFavoris && (
        /*  §2 (nº 312) — EN WEB, UN PORTFOLIO S'OUVRE EN FENÊTRE
            CENTRÉE SUPERPOSÉE, comme partout ailleurs sur le site.
            ⚠️ ON LUI PASSE `ouvrirLaFiche`, CELLE QUI SERT DÉJÀ AUX
            CARTES DE FAVORIS : même note de retour, même position de
            page mémorisée, même entrée d'historique, même fenêtre
            montée plus bas. Rien n'est écrit une seconde fois, et la
            fenêtre elle-même n'est pas touchée — elle est seulement
            ouverte depuis un endroit de plus.
            ⚠️ AU DOIGT, RIEN NE CHANGE : `BlocSuivis` n'appelle ce
            rappel que sur un appareil à pointeur fin (voir
            `ouvrirEnFenetre`) — ailleurs, ses liens naviguent. */
        <>
        <BlocSuivis
          suivis={suivisDeplies}
          surOuverture={(slug, serie, adresse) =>
            void ouvrirLaFiche(slug, serie, adresse)
          }
        />
        {/*  §1 (nº 597) — LE PIED DES PORTFOLIOS : douze de plus à
             chaque appui. Voir la note de `piedDeListe`. */}
        {piedDeListe(suivisDeplies.length, suivisVisibles.length)}
        </>
      )}

      {/* ---------- LE TITRE INACTIF EST PARTI (§2, nº 263) ----------
           LA CAUSE DU RELEVÉ (« Mes suivis » traînait en bas de la
           page, sur le web) : un titre rendu HORS des blocs
           conditionnels. À la nº 249 c'était un CONTRÔLE — le titre de
           l'autre recherche, en menu, la porte pour y aller ; à la
           nº 253 la commande est retournée à la barre et il est devenu
           un MOT NU (`titreControle`) : il avait perdu sa raison
           d'être, pas sa place. Depuis la nº 247 les deux sections
           sont exclusives — sur « Favoris », RIEN des suivis ne se
           rend, ni titre ni espace ; le bloc entier est donc retiré,
           et la symétrie vaut sur « Suivis ». */}

      {/* `key` : chaque ouverture repart de L'ENSEMBLE ouvert, jamais
          de l'état d'une fiche précédente.
          ⚠️ ET L'ENSEMBLE, PAS SEULEMENT LA FICHE (nº 247-§1) : la clé
          ne portait que l'identifiant du tatoueur. Ouvrir un flash de
          Lola puis une de ses réalisations (ou l'inverse) réutilisait
          donc LA MÊME fenêtre — React garde l'état interne d'un
          composant dont la clé n'a pas changé, à commencer par la série
          et l'indice de photo. Une photo héritée de l'ensemble voisin,
          exactement. La mosaïque comptait déjà ses ouvertures pour
          cette raison (nº 220-§3) ; cette page ne le faisait pas. */}
      <FenetreFiche
        key={`${ficheOuverte?.id ?? "fermee"}-${serieOuverte.cle}`}
        tatoueur={visible ? ficheOuverte : null}
        styleRecherche={serieOuverte.style}
        //  LES TROIS TAGS, jusqu'au bout : la fenêtre s'ouvre sur
        //  L'ENSEMBLE qu'on a touché, jamais sur tout le style.
        natureRecherche={serieOuverte.nature}
        renduRecherche={serieOuverte.rendu}
        /*  §4 (nº 302) — LA PHOTO TOUCHÉE, ET NON LA PREMIÈRE DE SA
            SÉRIE. Une carte de favori EST une photo précise : la
            fenêtre s'ouvre dessus. */
        photoRecherche={serieOuverte.photo}
        positionGrille={positionPage}
        //  §1 (nº 440) — même règle que la mosaïque : la fenêtre de
        //  base efface son habillage tant qu'une fiche vit dessus.
        habillageEfface={profondeurPile > 0}
        surFermeture={fermerLaFiche}
      />
    </main>
    </PileFiches>
  );
}

/*  §2 (nº 303) — `cleEnsembleFavori` EST SUPPRIMÉE, code compris. Elle
    servait à DÉDOUBLONNER les favoris par carrousel — exactement ce
    que le propriétaire ne veut plus : une photo aimée, une carte. Rien
    d'autre ne l'appelait. */


