"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LARGEUR_SITE,
  libelleStyle,
  rayonSuivant,
  renduCherche,
  TEXTES_TATOUAGE,
} from "@/config/tatouage";
import { AucunResultat } from "@/components/AucunResultat";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { GrilleTatoueurs } from "@/components/GrilleTatoueurs";
import { noterDemontage, noterMontage } from "@/lib/journal-bascule";
//  §2 (nº 330) — L'ÉCRITURE UNIQUE DE « UNE LISTE NEUVE COMMENCE EN
//  HAUT », partagée avec les filtres de « Ma sélection ».
import {
  laListeServieEstArrivee,
  ouvrirLaListeEnHaut,
} from "@/lib/liste-neuve";
//  §1 (nº 332) — « l'étape d'une surface est consommée par la
//  navigation, jamais doublée » (lib/etape-refermable).
import { laNavigationRemplaceLEtape } from "@/lib/etape-refermable";
import { LigneResultats } from "@/components/LigneResultats";
import {
  criteresComplets,
  libelleExplorer,
  rayonApplicable,
  type CritèresTatouage,
} from "@/components/MoteurTatouage";
import type { Tatoueur } from "@/lib/tatoueurs";
import { lieuVersParametres } from "@/lib/geocodage";
import { ligneCarte } from "@/lib/adresse";
import { useUtilisateur } from "@/lib/use-utilisateur";
import { ContexteAffichageServi } from "@/components/AffichageMosaique";
import {
  lireDisposition,
  reprendreDisposition,
  type DispositionGrille,
} from "@/lib/disposition-grille";
import { lirePhototheque, reprendrePhototheque } from "@/lib/vue-phototheque";
import { memoriserRechercheTatouage } from "@/lib/derniere-recherche";
//  ⚠️ TEMPORAIRE (nº 224-§5) — la sonde des cartes. Sans
//  `?sonde-cartes=1`, ces deux appels sortent à leur première ligne.
import {
  fermerReleveCartes,
  ouvrirReleveCartes,
} from "@/lib/journal-cartes";

/** useLayoutEffect côté navigateur, useEffect côté serveur (silencieux) */
const useEffetAvantPeinture =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * L'ACCUEIL DE YOKOFOLIO (adresse « / ») — L'ADRESSE DÉCIDE DE TOUT
 * ==================================================================
 * REFONTE DE LA PASSE Nº 191, ET C'EST LA SEULE RÈGLE DU FICHIER :
 *
 *   les critères, les cartes affichées et le NOMBRE de cartes chargées
 *   viennent de l'adresse, et de rien d'autre. Aucune mémoire
 *   parallèle ne négocie avec elle. Rien ne s'affiche qui n'en découle.
 *
 * CE QUE CELA VEUT DIRE, CONCRÈTEMENT :
 *  · ce composant ne CHERCHE plus. Il n'appelle aucune API, ne garde
 *    aucune liste, ne met plus rien de côté. Il AFFICHE `premiers` —
 *    ce que le serveur a rendu POUR CETTE ADRESSE — et rien d'autre ;
 *  · chercher, c'est CHANGER D'ADRESSE (`router.push`). Le serveur rend
 *    alors la mosaïque filtrée, et l'écran ne montre qu'un seul état :
 *    l'ancien, puis le nouveau. Jamais un troisième, intermédiaire ;
 *  · « Voir plus », c'est aussi changer d'adresse — `&page=2`, `&page=3`
 *    — mais par un REMPLACEMENT (`router.replace`) : la pagination
 *    n'ajoute pas d'étape d'historique. Le retour depuis une fiche
 *    retrouve donc `&page=3`, c'est-à-dire SOIXANTE-DOUZE cartes, sans
 *    qu'aucune mémoire n'ait eu à les garder ;
 *  · la seule chose qui vive hors de l'adresse est la POSITION de
 *    défilement (voir lib/navigation-session et MemoireNavigation),
 *    rangée sous une clé qui contient les critères.
 *
 * CE QUI A ÉTÉ SUPPRIMÉ AVEC CETTE REFONTE : la mosaïque mise de côté
 * (lib/mosaique-session), les jetons de geste et de validation et le
 * verrou de traversée (lib/etapes-historique), l'écoute d'adresse qui
 * relançait une recherche, l'état local des cartes, l'appel à
 * /api/tatoueurs, les interrupteurs de mesure. Chacun doublait la règle
 * ci-dessus ; à plusieurs, ils se contredisaient.
 *
 * Les premières cartes arrivent DÉJÀ RENDUES par le serveur : la page
 * est lisible et indexable avant même que le navigateur n'exécute la
 * moindre ligne.
 */

/** L'ADRESSE D'UNE RECHERCHE — la seule fonction qui la fabrique.
    Les critères, puis la page demandée (jamais écrite pour la
    première : « / » et « /?page=1 » ne doivent pas être deux adresses
    différentes). */
export function parametresDeRecherche(
  criteres: CritèresTatouage,
  page = 1
): URLSearchParams {
  const parametres = new URLSearchParams();
  if (criteres.style) parametres.set("style", criteres.style);
  //  LA NATURE (tatouage / flash) voyage à côté du style, jamais fondue
  //  dedans : une adresse partagée reste lisible à l'œil nu.
  if (criteres.nature) parametres.set("nature", criteres.nature);
  if (criteres.exclure.length > 0) {
    parametres.set("exclure", criteres.exclure.join(","));
  }
  if (criteres.lieu) {
    // Le LIEU voyage en clair (intitulé, contexte, coordonnées) : la
    // recherche est partageable et survit au rechargement.
    for (const [cle, valeur] of Object.entries(
      lieuVersParametres(criteres.lieu)
    )) {
      parametres.set(cle, valeur);
    }
    parametres.set("rayon", String(criteres.rayonKm));
  }
  if (page > 1) parametres.set("page", String(page));
  return parametres;
}

/** L'adresse complète d'une recherche.
    ⚠️ L'AFFICHAGE VOYAGE AVEC ELLE (nº 203-§1b) : la disposition et le
    texte des cartes vivent dans l'adresse — une nouvelle recherche ou
    un « Voir plus » ne doivent pas les remettre au défaut. On relit
    donc les valeurs courantes au moment de fabriquer l'adresse. */
function adresseDe(criteres: CritèresTatouage, page = 1): string {
  const parametres = parametresDeRecherche(criteres, page);
  if (lireDisposition() === "une") parametres.set("disposition", "une");
  if (lirePhototheque()) parametres.set("texte", "sans");
  const requete = parametres.toString();
  return requete ? `/?${requete}` : "/";
}

export function IndexTatoueurs({
  premiers,
  criteresInitiaux,
  message,
  total,
  page,
  affichage = { disposition: "deux", phototheque: false },
}: {
  /** LES CARTES DE CETTE ADRESSE — toutes celles qu'elle demande,
      pages cumulées comprises. C'est le SEUL contenu de la mosaïque. */
  premiers: Tatoueur[];
  criteresInitiaux?: Partial<CritèresTatouage>;
  /** §4 (nº 278) — LE DRAPEAU `demonstration` NE VIENT PLUS JUSQU'ICI :
      il ne servait qu'à conditionner l'affichage du message, et ce
      message existe désormais AUSSI en production (« momentanément
      indisponible »). La page d'accueil le garde pour ce qui le
      regarde vraiment : ne pas laisser indexer une mosaïque de
      démonstration (voir `robots` dans page.tsx). */
  message: string | null;
  /** COMBIEN DE TATOUEURS RÉPONDENT EN TOUT — pas seulement ceux de
      cette page. C'est lui qui décide s'il faut proposer « Voir plus ». */
  total: number;
  /** La page demandée par l'adresse (1 par défaut). */
  page: number;
  /** L'AFFICHAGE demandé par l'adresse (nº 203-§1b) : la disposition
      de la mosaïque et le texte des cartes — décodés par le serveur,
      comme les critères. */
  affichage?: { disposition: DispositionGrille; phototheque: boolean };
}) {
  const router = useRouter();
  /** Une navigation du routeur est en cours : la mosaïque s'estompe,
      exactement comme elle le faisait pendant une recherche. */
  const [enTransition, demarrerTransition] = useTransition();

  /**
   * QUI REGARDE ? — pour l'appel aux tatoueurs, en bas de page
   * (passe nº 145-§2). Il ne s'affiche QUE pour un visiteur qui n'a pas
   * de compte : une fois connecté, on n'a plus rien à faire dans une
   * invitation à s'inscrire.
   */
  const { utilisateur } = useUtilisateur();

  /** LES CRITÈRES SERVIS — ceux de l'adresse, décodés par le serveur.
      Ce sont EUX que la mosaïque illustre, toujours. */
  const criteresServis = criteresComplets(criteresInitiaux);
  const cleServie = parametresDeRecherche(criteresServis).toString();

  /**
   * CE QUE LES CHAMPS DU MOTEUR AFFICHENT — et rien de plus.
   * ⚠️ CE N'EST PAS UNE MÉMOIRE PARALLÈLE : cet état ne décide d'AUCUNE
   * carte. Il n'existe que pour que le champ réponde au doigt sans
   * attendre le serveur. Et dès que le serveur rend d'autres critères,
   * IL S'Y REMET — pendant le rendu, sans effet ni clignotement (c'est
   * le motif « ajuster un état pendant le rendu » de React).
   */
  const [criteres, setCriteres] = useState(criteresServis);
  const [cleAffichee, setCleAffichee] = useState(cleServie);
  if (cleServie !== cleAffichee) {
    setCleAffichee(cleServie);
    setCriteres(criteresServis);
  }

  //  ⚠️ LA SONDE DE LA BASCULE (nº 173) : le conteneur de page est-il
  //  démonté au clic ? (N'écrit que sous `?sonde-bascule=1`.)
  useEffect(() => {
    noterMontage("page (IndexTatoueurs)");
    return () => noterDemontage("page (IndexTatoueurs)");
  }, []);

  /** LA RECHERCHE SERVIE EST RETENUE LE TEMPS DE LA VISITE (nº 209-§1)
      — pour que la loupe d'une FICHE ouvre le moteur avec les critères
      en cours. Elle ne décide d'aucune carte : voir
      lib/derniere-recherche. */
  useEffect(() => {
    memoriserRechercheTatouage(criteresServis);
  }, [cleServie, criteresServis]);

  /**
   * §1 (nº 334) — LA REMONTÉE MISE EN ATTENTE EST JOUÉE ICI, À
   * L'ARRIVÉE DE LA LISTE — ET AVANT SA PEINTURE.
   * ------------------------------------------------------------------
   * `chercher` ne fait plus remonter la page qu'on QUITTE (le
   * propriétaire voyait le haut de l'accueil passer avant les
   * résultats, et cette remontée écrasait au passage la position
   * mémorisée de l'accueil — voir lib/liste-neuve). Elle met la
   * remontée en attente ; c'est cette liste-ci qui la consomme quand
   * son nouveau contenu est posé.
   * ⚠️ UN EFFET DE MISE EN PAGE, pas un effet ordinaire : il s'exécute
   * ENTRE la pose du DOM et la peinture. Aucune image ne montre donc la
   * nouvelle liste ailleurs qu'en haut, et aucune ne montre l'ancienne
   * remonter.
   * ⚠️ ET IL NE FAIT RIEN SANS GESTE : `laListeServieEstArrivee` ne
   * consomme que ce qu'un clic a armé. Un RETOUR change lui aussi la
   * clé servie, et passe ici sans rien déclencher — la position
   * restituée n'est pas touchée.
   */
  useEffetAvantPeinture(() => {
    laListeServieEstArrivee();
  }, [cleServie]);

  /**
   * L'AFFICHAGE EST REMIS AU PAS À CHAQUE RENDU SERVI (nº 212-§3).
   * ⚠️ ON NE REPOSE PLUS CE QUE LE SERVEUR A RENDU, on relit L'ADRESSE
   * COURANTE — et c'est la correction. Au retour depuis une fiche, le
   * routeur restitue le rendu qu'il avait mis en cache pour l'adresse
   * D'ORIGINE : `affichage.disposition` y vaut encore le défaut, et
   * l'ancien effet écrasait donc la disposition choisie. La reprise
   * lit l'adresse, puis, si celle-ci ne dit rien, la préférence de la
   * visite (voir lib/disposition-grille).
   */
  useEffect(() => {
    reprendreDisposition();
    reprendrePhototheque();
  }, [affichage.disposition, affichage.phototheque]);

  /**
   * CHERCHER, C'EST CHANGER D'ADRESSE.
   * Une recherche PART TOUJOURS DE LA PREMIÈRE PAGE : on ne garde pas
   * les soixante-douze cartes d'une recherche pour la suivante.
   * `scroll: false` : la grille ne saute pas pendant qu'on affine (le
   * retour en haut d'une recherche validée est le geste de la page de
   * recherche, voir MoteurTatouage).
   */
  function chercher(suivants: CritèresTatouage) {
    //  Le champ répond tout de suite ; l'adresse tranchera.
    setCriteres(suivants);
    /*  §2 (nº 330) — UNE RECHERCHE OUVRE SA LISTE EN HAUT.
        ------------------------------------------------------------------
        LE DÉFAUT : on descend dans l'accueil, on choisit un style, et
        l'on arrive AU MILIEU des résultats. Rien ne remontait — la
        navigation porte `scroll: false` (voulu : la grille ne doit pas
        sauter pendant qu'on affine), et `DefilementEnHaut` ne se
        rejoue qu'au changement de CHEMIN : `/` → `/?style=…` n'en
        change pas.
        ⚠️ LE PIÈGE QU'ON N'OUVRE PAS : rendre `DefilementEnHaut`
        sensible à la REQUÊTE. Un retour en arrière arrive lui aussi
        avec une requête, et lui doit garder sa position — on casserait
        la restitution réparée à la nº 329-§2. La remontée est donc
        posée PAR LE GESTE, ici, dans la fonction que seul un clic
        appelle ; elle n'est jamais déduite de l'adresse.
        ⚠️ ET PAS DANS `voirPlus` : « Voir plus » allonge la MÊME liste
        par le bas, on continue de lire là où on est (nº 224-§3). */
    /*  §2 (nº 333) — ET ON LUI DONNE L'ADRESSE DE LA LISTE QUI ARRIVE.
        ------------------------------------------------------------------
        LE DÉFAUT, MESURÉ : sans elle, `ouvrirLaListeEnHaut` effaçait la
        position mémorisée de L'ADRESSE COURANTE — c'est-à-dire de
        L'ACCUEIL QU'ON QUITTE, puisqu'on appelle AVANT de naviguer.
        Relevé : `roswel:defilement:/` valait 900 avant la recherche, la
        mémoire était VIDE après, et le retour rendait 0. Le propriétaire
        l'a vu sur son iPhone à la nº 333 (« j'arrive bien sur l'accueil,
        mais pas là où j'étais ») : ce n'était pas l'historique, c'était
        la position — et c'est la nº 330 qui l'avait cassée.
        L'adresse de destination est calculée juste au-dessus : on la
        passe, et l'accueil garde sa place. */
    const adresse = adresseDe(suivants, 1);
    ouvrirLaListeEnHaut(adresse);
    /*  §1 (nº 332) — L'ÉTAPE DE LA PAGE DE RECHERCHE EST CONSOMMÉE PAR
        CETTE NAVIGATION, PAS DOUBLÉE.
        ------------------------------------------------------------------
        LE DÉFAUT (nº 22 du recensement de la nº 331) : au doigt, la
        page de recherche pose une étape en s'ouvrant, et se referme
        POUR NAVIGUER — son étape restait donc SOUS les résultats, avec
        l'adresse de l'accueil. Un seul retour depuis les résultats
        renvoyait à l'accueil, et dix recherches empilaient dix
        jumelles.
        ⚠️ LA QUESTION EST POSÉE ICI, AU MOMENT DU GESTE, et elle LIT
        l'étape du dessus — elle ne la suppose pas. Sur le web, où
        aucune surface ne pose d'étape, la réponse est faux et la
        recherche empile normalement : rien ne change de ce côté.
        ⚠️ ET ON NE RECULE PAS : reculer après avoir navigué rouvrirait
        la course de la nº 330. Remplacer ne dépend d'aucun ordre. */
    const consommeLEtape = laNavigationRemplaceLEtape();
    demarrerTransition(() => {
      //  UNE RECHERCHE QUI NE CHANGE RIEN N'AJOUTE PAS D'ÉTAPE : rouvrir
      //  la page de recherche et valider sans avoir touché à un critère
      //  ne doit pas empiler une étape identique à la précédente.
      if (
        consommeLEtape ||
        adresse === window.location.pathname + window.location.search
      ) {
        router.replace(adresse, { scroll: false });
      } else {
        router.push(adresse, { scroll: false });
      }
    });
  }

  /**
   * « VOIR PLUS » — LA PAGE SUIVANTE PASSE PAR L'ADRESSE
   * ====================================================
   * ⚠️ ET PAR UN REMPLACEMENT, JAMAIS PAR UNE ÉTAPE. C'est ce qui rend
   * l'exigence nº 5 possible sans aucune mémoire : au retour depuis une
   * fiche, l'adresse porte encore `&page=3`, le serveur rend les
   * soixante-douze cartes, et la page a sa hauteur définitive avant la
   * première peinture — la position mémorisée retombe donc juste.
   * En contrepartie, le retour ne repasse pas par les pages
   * intermédiaires : il quitte la liste entière d'un seul geste, ce qui
   * est bien ce qu'on attend d'un bouton « Voir plus ».
   *
   * Pourquoi un bouton et non un défilement infini ? Parce qu'un
   * défilement infini enlève toute chance d'atteindre le pied de page,
   * casse le retour arrière, et n'est suivi par aucun moteur de
   * recherche.
   */
  /**
   * §3 (nº 224) — « VOIR PLUS » NE DÉPLACE PLUS LA PAGE, VRAIMENT
   * ==================================================================
   * LA CAUSE, ET ELLE EST DE MON FAIT : la nº 220 ancrait le BOUTON.
   * Elle notait sa position à l'écran avant la transition et la lui
   * rendait après — donc, les nouvelles cartes s'insérant AU-DESSUS de
   * lui, elle faisait DESCENDRE la page de toute leur hauteur pour le
   * garder immobile. C'était la lecture de la demande d'alors ; la
   * demande d'aujourd'hui est l'inverse, et elle est plus simple :
   * `window.scrollY` ne bouge pas d'un pixel, les cartes s'ajoutent
   * dessous, on continue de lire.
   *
   * IL N'Y A DONC PLUS RIEN À CORRIGER APRÈS COUP — c'est le
   * comportement naturel d'un document qui s'allonge par le bas. Ce
   * qui reste, ce sont les trois choses qui pourraient le troubler, et
   * elles sont traitées à la source :
   *   · `scroll: false` sur la navigation (le routeur ne remonte pas) ;
   *   · `overflow-anchor: none` sur la grille — l'ancrage de
   *     défilement du navigateur choisit un nœud de référence et
   *     compense les changements de hauteur autour de lui ; sur une
   *     grille qui s'allonge, il déplace la page de quelques pixels
   *     (voir GrilleTatoueurs) ;
   *   · la hauteur de chaque image est réservée AVANT son arrivée
   *     (cadre `aspect-4/5` + `width`/`height` déclarés sur la
   *     balise) : aucune photo qui se pose ne pousse quoi que ce soit.
   */
  function voirPlus() {
    //  SONDE (nº 224-§5) : le relevé s'ouvre AVANT la transition et se
    //  ferme après le rendu — c'est lui qui prouve que `scrollY` n'a
    //  pas bougé. Sans `?sonde-cartes=1`, ne coûte rien.
    ouvrirReleveCartes();
    demarrerTransition(() => {
      router.replace(adresseDe(criteresServis, page + 1), { scroll: false });
    });
  }

  const visibles = premiers;
  const resteAVoir = total > visibles.length;

  /*  ⚠️ PLUS AUCUNE REMISE EN PLACE (nº 224-§3) : la page ne doit pas
      bouger, donc personne ne la déplace. Cet effet ne fait plus que
      FERMER le relevé de la sonde, une fois les nouvelles cartes
      posées — il ne touche jamais au défilement. */
  const nombreAffiche = useRef(visibles.length);
  useEffetAvantPeinture(() => {
    if (visibles.length === nombreAffiche.current) return;
    nombreAffiche.current = visibles.length;
    fermerReleveCartes();
  }, [visibles.length]);
  /** Ce que la ligne de résultats annonce : les critères SERVIS, jamais
      ceux que le doigt vient de poser. */
  const affiches = criteresServis;

  /**
   * ██ §2 (nº 395) — L'ACCUEIL AU REPOS ÉCRIT LE STYLE, LES RÉSULTATS
   * ÉCRIVENT LE NOM ██
   * ==================================================================
   * CE QUE J'APPELLE « LA PAGE D'ACCUEIL », et c'est la question du
   * propriétaire : la mosaïque SANS AUCUN CRITÈRE. Pas une adresse,
   * pas un fichier — un ÉTAT.
   *
   * POURQUOI PAS L'ADRESSE : depuis la nº 357 l'accueil a un jumeau
   * dynamique (`/accueil-recherche`) qui sert les adresses à requête,
   * et LES DEUX montent le même `RenduAccueil`, donc ce composant-ci.
   * Trancher sur le chemin dirait « accueil » aussi bien pour une
   * recherche servie par le jumeau que pour la page nue — et le
   * propriétaire interdit la devinette d'adresse. Trancher sur les
   * CRITÈRES dit exactement ce qu'on voulait dire.
   *
   * CE QUI SE PASSE DONC, CAS PAR CAS :
   *  · `/` prérendue, aucun critère → LE STYLE ;
   *  · une recherche depuis l'accueil (style, catégorie, lieu, ou un
   *    interrupteur éteint) → l'adresse porte une requête, le jumeau
   *    la sert, `criteresServis` n'est plus vide → LE NOM DE
   *    L'ARTISTE. La bascule est immédiate et vaut dans les deux
   *    sens : effacer la recherche ramène le style ;
   *  · les VITRINES montent `GrilleTatoueurs` en direct, elles ne
   *    passent pas ici → LE NOM ;
   *  · « MA SÉLECTION » monte la carte en direct → LE NOM.
   *
   * ⚠️ CE SONT LES CRITÈRES **SERVIS**, jamais ceux que le doigt vient
   * de poser dans les champs : `criteres` n'est qu'un état d'affichage
   * des champs, il ne décide d'AUCUNE carte (voir sa note plus haut).
   * Le libellé suit donc les cartes qui sont à l'écran, jamais une
   * frappe en cours.
   * ⚠️ `rayonKm` N'ENTRE PAS DANS LE COMPTE : il a une valeur par
   * défaut et ne veut rien dire sans lieu — le lire ferait croire à une
   * recherche là où il n'y en a aucune.
   */
  const aucuneRecherche =
    !affiches.style &&
    !affiches.nature &&
    !affiches.lieu &&
    affiches.exclure.length === 0;

  /** L'affichage servi, fourni à la grille, aux cartes et aux boutons
      de bascule : c'est LUI que le HTML du serveur montre (nº 203-§1b). */
  const affichageServi = useMemo(
    () => ({
      disposition: affichage.disposition,
      phototheque: affichage.phototheque,
    }),
    [affichage.disposition, affichage.phototheque]
  );

  return (
    <ContexteAffichageServi.Provider value={affichageServi}>
      <EnTeteTatouage
        criteres={criteres}
        surRecherche={(suivants) => chercher(suivants)}
      />

      <main
        className={`flex-1 mx-auto w-full ${LARGEUR_SITE} px-4 sm:px-6 pb-16`}
      >
        {/* LE TITRE DIT LA RECHERCHE (nº 140) — la pilule de la barre
            dit toujours « Recherche », c'est donc ICI que les critères
            se lisent. LA RÈGLE : le QUOI en titre (« Flashs ·
            Réalisme », « Tous les flashs », « Réalisme ») ; un lieu
            SEUL devient le titre ; les deux → le quoi en titre, le
            lieu derrière le compte. Sans recherche : « Explorer toutes
            les créations », sans sous-titre. */}
        {(() => {
          const quoi =
            libelleExplorer(affiches.nature, affiches.style) ||
            //  ⚠️ `libelleStyle` EN DIRECT (nº 321-§3) : cette ligne
            //  passait par `libelleStyleChoisi`, mais elle est GARDÉE
            //  par `affiches.style` — le cas vide n'y arrivait jamais.
            //  Le mot « Tous les styles » a donc quitté le site.
            (affiches.style ? libelleStyle(affiches.style) : "");
          //  ⚠️ LE LIEU AU FORMAT INTERNATIONAL (nº 211-§1) — « Paris,
          //  France », « Austin, TX, États-Unis ». La règle vit dans
          //  lib/adresse (`ligneCarte`), celle-là même qui écrit la
          //  localité sous les cartes : une seule écriture du monde,
          //  pas deux.
          const lieu = affiches.lieu ? ligneCarte(affiches.lieu) : "";
          //  LE RAYON, seulement quand il veut dire quelque chose : on
          //  cherche « à 50 km de Paris », jamais « à 50 km de la
          //  France ».
          const rayon =
            affiches.lieu &&
            (affiches.lieu.precision === "ville" ||
              affiches.lieu.precision === "adresse")
              ? `${affiches.rayonKm} km`
              : "";
          const compte = `${total} création${total > 1 ? "s" : ""}`;
          if (!quoi && !lieu) {
            //  SANS RECHERCHE : l'invitation, et ce que le site est.
            return (
              <LigneResultats
                titre={TEXTES_TATOUAGE.titreMosaique}
                sousTitre={TEXTES_TATOUAGE.sousTitreMosaique}
              />
            );
          }
          //  AVEC UNE RECHERCHE : le titre dit CE QU'ON CHERCHE, le
          //  sous-titre RÉSUME la recherche — compte · lieu · rayon,
          //  séparés par le point médian entouré d'espaces.
          return (
            <LigneResultats
              titre={quoi || lieu || affiches.lieu!.intitule}
              sousTitre={[compte, quoi ? lieu : "", rayon]
                .filter(Boolean)
                .join(" · ")}
            />
          );
        })()}

        {/*  §4 (nº 278) — LE MESSAGE S'AFFICHE DÈS QU'IL Y EN A UN, et
             non plus seulement en démonstration. C'est par là que passe
             désormais le SEUL message servi en production : « le site
             est momentanément indisponible », quand la base ne répond
             pas (voir lib/catalogue-demonstration). Le lier au drapeau
             de démonstration le rendait muet exactement là où il compte
             le plus. */}
        {message && (
          <p className="mb-6 rounded-xl border border-primaire/40 bg-primaire/10 px-4 py-3 text-sm text-sombre-texte">
            {message}
          </p>
        )}

        {/*  §2 (nº 307) — LE MESSAGE DU VIDE EST DÉSORMAIS ÉCRIT UNE
             SEULE FOIS (composants/AucunResultat). Ici, on ne décide
             plus que des ISSUES : celles qui ont un sens pour la
             recherche servie, dans l'ordre où le propriétaire les a
             demandées.
              · « Élargir le rayon » — un cran, et seulement quand le
                rayon veut dire quelque chose (une ville, une adresse :
                on ne cherche pas « à 50 km de la France ») et qu'il
                reste un palier au-dessus ;
              · « Chercher partout » — efface le lieu, rien d'autre :
                le style, la nature et les filtres restent.
             SANS LIEU RENSEIGNÉ, ni l'une ni l'autre : la liste est
             déjà celle du monde entier, il n'y a plus rien à élargir.
             Il ne reste alors que le titre. */}
        {visibles.length === 0 && (
          <AucunResultat
            issues={[
              ...(rayonApplicable(affiches.lieu) &&
              rayonSuivant(affiches.rayonKm) !== null
                ? [
                    {
                      libelle: "Élargir le rayon",
                      surClic: () =>
                        chercher({
                          ...affiches,
                          rayonKm: rayonSuivant(affiches.rayonKm)!,
                        }),
                    },
                  ]
                : []),
              ...(affiches.lieu
                ? [
                    {
                      libelle: "Chercher partout",
                      surClic: () => chercher({ ...affiches, lieu: null }),
                    },
                  ]
                : []),
            ]}
          />
        )}
        {
          // La grille porte aussi la FENÊTRE de fiche (grand écran).
          //  ⚠️ ELLE N'EST JAMAIS DÉMONTÉE, ET C'EST LE POINT (nº 171) :
          //  elle vivait dans la branche d'un ternaire — un instant où
          //  la liste passe par le vide, et React la DÉTRUIT puis la
          //  reconstruit, images comprises. Vu de l'écran : tout le
          //  contenu disparaît, puis revient d'un coup. Le message du
          //  vide s'affiche désormais À CÔTÉ, sans rien démonter.
          //  ⚠️ ET SA CLÉ EST STABLE ET EXPLICITE : la disposition
          //  change PAR LES STYLES, jamais par un remontage — une clé
          //  qui bougerait suffirait à recréer toute la mosaïque.
          <GrilleTatoueurs
            key="mosaique"
            tatoueurs={visibles}
            styleRecherche={affiches.style}
            // LE RENDU vient des interrupteurs : il n'y a recherche par
            // rendu que lorsqu'il n'en reste qu'un allumé.
            renduRecherche={renduCherche(affiches.exclure)}
            //  LA CATÉGORIE (nº 216-§1) : chaque carte met alors en
            //  avant une photo QUI EN EST — plus de réalisation
            //  affichée quand on cherche des flashs.
            natureRecherche={affiches.nature}
            //  §2 (nº 395) — LE RÉGLAGE EXPLICITE, décidé juste
            //  au-dessus (`aucuneRecherche`) : c'est cette surface, et
            //  elle seule, qui sait si l'on est sur l'accueil au repos
            //  ou devant des résultats.
            premiereLigne={aucuneRecherche ? "style" : "nom"}
            estompee={enTransition}
          />
        }

        {/*  ⚠️ CE BLOC N'EST PLUS RETIRÉ PUIS RÉINSÉRÉ (nº 220-§2).
             Il vivait dans `{resteAVoir && …}` : à la dernière page, il
             quittait le document d'un coup — quatre-vingt-dix pixels de
             moins sous les pieds de quelqu'un qui est justement en bas
             de page, donc un saut. Il reste donc toujours là, le MÊME
             élément d'une page à l'autre ; c'est son contenu qui
             s'efface quand il n'y a plus rien à charger. */}
        <div
          className={
            resteAVoir ? "mt-10 flex flex-col items-center gap-2" : "mt-10"
          }
        >
          {resteAVoir && (
            <>
            {/*  LA CHARTE DES BOUTONS (nº 217-§7) : « Voir plus » est
                 une action INTERMÉDIAIRE — elle prolonge la page, elle
                 ne la conclut pas. Donc une CAPSULE À SA MESURE, en
                 gris relevé, SANS contour et SANS rose plein (le rose
                 plein appartient à l'action finale d'une page).
                 ⚠️ ET AUCUN ROSE AU SURVOL NON PLUS (nº 218-§6) : la
                 nº 217 en avait gardé un voile et la couleur du texte.
                 Le rose ne désigne pas un bouton survolé, il désigne
                 l'action finale d'une page — sinon il ne désigne plus
                 rien. Au survol, le fond monte d'UN CRAN sur l'échelle
                 sombre (`eleve` → `haut`) et le texte reste BLANC :
                 le même geste que le focus d'un champ. */}
            <button
              type="button"
              onClick={voirPlus}
              disabled={enTransition}
              className="inline-flex items-center justify-center rounded-full
                         bg-sombre-eleve px-5 min-h-[42px] text-[14px] font-semibold
                         text-sombre-texte transition-colors
                         hover:bg-sombre-haut
                         disabled:opacity-60"
            >
              {/*  §5 (nº 280) — « VOIR PLUS », TOUT COURT. Le bouton
                   charge des GALERIES depuis la nº 279, plus des
                   portfolios : le mot promettait autre chose que ce
                   qu'il apporte. (Le compteur, lui, ne change pas.) */}
              {enTransition ? "Chargement…" : "Voir plus"}
            </button>
            <p className="text-[13px] text-sombre-texte-doux">
              {visibles.length} sur {total}
            </p>
            </>
          )}
        </div>

        {/* ---------- L'APPEL AUX TATOUEURS (passe nº 137) ----------
            EN BAS DE L'ACCUEIL, APRÈS LA MOSAÏQUE — et nulle part
            ailleurs. La barre fixe s'adresse maintenant à tout le
            monde (« Rejoindre ») : l'invitation aux professionnels
            descend ici, où elle rencontre quelqu'un qui vient de voir
            ce que le site fait de leur travail. Elle n'a rien à faire
            dans la barre, qui n'a pas la place — et quatre visiteurs
            sur cinq arrivent par le téléphone.
            DEUX LIGNES, PAS UNE DE PLUS : une question, un bouton.

            ⚠️ POUR LES VISITEURS SANS COMPTE, ET EUX SEULS (passe
            nº 145-§2). Un connecté a déjà franchi cette porte : lui
            redemander « Tu es tatoueur ? » en bas de chaque page
            d'accueil ne lui apprend rien et le traite en inconnu. La
            réponse vient du serveur avec la page, l'appel n'apparaît
            donc jamais pour disparaître ensuite. */}
        {!utilisateur && (
        <section className="mt-14 rounded-2xl bg-sombre-carte px-5 py-8 text-center">
          <h2 className="text-[19px] font-bold tracking-tight text-sombre-texte">
            {TEXTES_TATOUAGE.titreAppelTatoueur}
          </h2>
          {/* LE BOUTON MÈNE DROIT À LA CRÉATION DE PORTFOLIO — pas à
              une page de présentation. Un compte déjà connecté y
              arrive sur le formulaire vierge ; un visiteur passe
              d'abord par la création de compte, et y revient (c'est
              le rôle de `?suite=`). */}
          {/* ⚠️ ON REMONTE AVANT DE PARTIR (nº 143-§5). Ce bouton est
              le SEUL du site qu'on touche depuis le BAS d'une page très
              longue : la mosaïque fait plusieurs milliers de pixels, et
              la page d'après en fait quelques centaines. Remonter au
              départ, plutôt qu'à l'arrivée, ne laisse aucune chance à
              une image intermédiaire — la nouvelle page naît en haut.
              (DefilementEnHaut tient déjà le cas général, désormais
              avant peinture ; ici, c'est ceinture et bretelles pour le
              chemin le plus exposé.) */}
          <Link
            onClick={() =>
              window.scrollTo({ top: 0, left: 0, behavior: "instant" })
            }
            href={`/devenir-tatoueur?suite=${encodeURIComponent(
              "/devenir-tatoueur/fiche?fiche=nouvelle"
            )}`}
            className="mt-4 inline-flex min-h-[48px] items-center justify-center
                       rounded-full bg-primaire px-7 text-[15px] font-semibold
                       text-white transition-colors hover:bg-primaire-fonce
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-primaire"
          >
            {TEXTES_TATOUAGE.boutonAppelTatoueur}
          </Link>
        </section>
        )}
      </main>
    </ContexteAffichageServi.Provider>
  );
}
