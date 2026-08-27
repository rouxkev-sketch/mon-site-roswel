"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
//  §1 (nº 652) — le chemin de la recherche, écrit une seule fois.
import { ADRESSE_RECHERCHE } from "@/lib/chemin-recherche";
import Link, { useLinkStatus } from "next/link";
import { useRouter } from "next/navigation";
//  §1 (nº 621) — la carte de style et sa grille. Le TYPE seul vient de
//  la lecture serveur (`import type` : il s'efface à la compilation,
//  rien du module de lecture n'entre dans le navigateur).
import { GrilleStyles } from "@/components/CarteStyle";
import type { StyleDuCatalogue } from "@/lib/catalogue-styles";
import {
  LARGEUR_SITE,
  libelleStyle,
  rayonSuivant,
  renduCherche,
  TEXTES_TATOUAGE,
} from "@/config/tatouage";
import { AucunResultat, type IssueAucunResultat } from "@/components/AucunResultat";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { GrilleTatoueurs } from "@/components/GrilleTatoueurs";
//  `noter` — TEMPORAIRE (nº 630), voir la mesure plus bas.
import { noter, noterDemontage, noterMontage } from "@/lib/journal-bascule";
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
import { lieuVersParametres, paysDuLieu } from "@/lib/geocodage";
import { ligneCarte, nomPaysAffiche } from "@/lib/adresse";
import { paysAvecPreposition } from "@/lib/preposition-pays";
import { useUtilisateur } from "@/lib/use-utilisateur";
import { ContexteAffichageServi } from "@/components/AffichageMosaique";
import {
  lireDisposition,
  reprendreDisposition,
  type DispositionGrille,
} from "@/lib/disposition-grille";
import { lirePhototheque, reprendrePhototheque } from "@/lib/vue-phototheque";
import { memoriserRechercheTatouage } from "@/lib/derniere-recherche";
//  §1 (nº 425) — la taille de page de CET écran, lue au cookie des
//  colonnes : le lien « Voir plus » calcule sa page d'après ce qui est
//  AFFICHÉ, pas d'après la numérotation du serveur qui a rendu.
import { COOKIE_COLONNES, taillePageServie } from "@/lib/colonnes-mosaique";
//  §1 (nº 426) — l'insertion des cartes s'annonce (l'ancrage WebKit).
import { annoncerMouvementDuSite } from "@/lib/defilement-programme";
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

/**
 * ██ §1 (nº 631) — LA SIGNATURE DES CRITÈRES D'UNE REQUÊTE ██
 * ==================================================================
 * Elle sert à UNE chose : comparer ce que L'ADRESSE demande à ce que le
 * SERVEUR a servi. Trois précautions, et chacune compte :
 *  · ON NE GARDE QUE LES CRITÈRES. La page, le mélange, la disposition,
 *    le texte des cartes et les sondes ne décrivent pas une recherche
 *    (c'est la liste `PARAMETRES_HORS_RECHERCHE` de `_accueil/rendu`,
 *    vue de ce côté-ci) : « /?page=2 » demande la même chose que « / » ;
 *  · ON TRIE. `parametresDeRecherche` écrit dans son ordre, une adresse
 *    partagée peut porter le sien : deux écritures de la même recherche
 *    doivent donner la même signature ;
 *  · ON NE DÉCODE RIEN. Pas de `styleConnu`, pas de `lieuDepuisParametres`
 *    — ces fonctions-là vivent du côté serveur du site, et les faire
 *    entrer ici pour une comparaison serait payer très cher un test.
 *    La conséquence est assumée et bornée plus bas : un style que le
 *    catalogue refuse donne un désaccord PERMANENT, d'où le garde-fou
 *    « une seule reprise par adresse ».
 */
const CLES_DE_CRITERE = [
  "style", "nature", "exclure", "rayon",
  //  Les clés qu'écrit `lieuVersParametres` (lib/geocodage).
  "lieu", "zone", "lat", "lon", "niveau", "paysCode", "region", "ville",
] as const;

function signatureDesCriteres(recherche: string | URLSearchParams): string {
  const source =
    typeof recherche === "string" ? new URLSearchParams(recherche) : recherche;
  const gardees: string[] = [];
  for (const cle of CLES_DE_CRITERE) {
    const valeur = source.get(cle);
    if (valeur) gardees.push(`${cle}=${valeur}`);
  }
  return gardees.sort().join("&");
}

/** L'adresse complète d'une recherche.
    ⚠️ L'AFFICHAGE VOYAGE AVEC ELLE (nº 203-§1b) : la disposition et le
    texte des cartes vivent dans l'adresse — une nouvelle recherche ou
    un « Voir plus » ne doivent pas les remettre au défaut. On relit
    donc les valeurs courantes au moment de fabriquer l'adresse. */
function adresseDe(
  criteres: CritèresTatouage,
  page = 1,
  /** §2 (nº 425) — le jour du mélange du rendu AFFICHÉ. Écrit dans
      l'adresse par la seule PAGINATION (page > 1) : la page suivante
      prolonge alors exactement l'ordre de celle-ci, même quand minuit
      UTC ou une régénération de l'accueil passe entre deux clics. Une
      RECHERCHE n'en écrit jamais : une liste neuve prend l'ordre du
      moment. */
  jourMelange?: number
): string {
  const parametres = parametresDeRecherche(criteres, page);
  if (page > 1 && jourMelange !== undefined) {
    parametres.set("melange", String(jourMelange));
  }
  if (lireDisposition() === "une") parametres.set("disposition", "une");
  if (lirePhototheque()) parametres.set("texte", "sans");
  const requete = parametres.toString();
  /*  §1 (nº 652) — LA RECHERCHE A SON ADRESSE : « /recherche ». Sans
      un seul critère, il n'y a pas de recherche — c'est l'accueil, et
      l'adresse reste « / ». Le partage d'un ancien lien « /?style=… »
      continue de marcher : le proxy le réécrit vers cette page. */
  return requete ? `${ADRESSE_RECHERCHE}?${requete}` : "/";
}

/** §1 (nº 425) — LA TAILLE DE PAGE DE CET ÉCRAN, lue UNE FOIS au
    cookie des colonnes (posé par le script d'avant peinture, donc
    toujours là quand React s'hydrate) et gardée pour la visite. Servie
    par `useSyncExternalStore` : au serveur elle est inconnue (null),
    et le lien garde alors la numérotation du rendu — aucun écart
    d'hydratation, la correction arrive au premier rendu client. */
let taillePageEcranMemo: number | null = null;
function lireTaillePageEcran(): number | null {
  if (taillePageEcranMemo === null) {
    const valeur = document.cookie
      .split("; ")
      .find((morceau) => morceau.startsWith(`${COOKIE_COLONNES}=`))
      ?.split("=")[1];
    taillePageEcranMemo = taillePageServie(valeur);
  }
  return taillePageEcranMemo;
}
/** Rien à écouter : le cookie ne bouge pas pendant la vie de la page. */
function sourisMuette(): () => void {
  return () => {};
}
function tailleInconnueAuServeur(): null {
  return null;
}

/**
 * ██ §2 (nº 509) — LES ISSUES DU VIDE : TROIS PALIERS, ET ON N'EN SAUTE
 * AUCUN ██
 * ==================================================================
 * CE QU'IL Y AVAIT, ET LES DEUX DÉFAUTS QUE LE PROPRIÉTAIRE NOMME :
 *  · « Élargir le rayon » n'annonçait pas JUSQU'OÙ — on cliquait à
 *    l'aveugle ;
 *  · « Chercher partout » sautait du quartier AU MONDE ENTIER d'un
 *    seul geste. Brutal quand on cherchait à Lyon : il reste la France
 *    entre les deux, et personne ne la proposait.
 *
 * LES TROIS PALIERS, DANS CET ORDRE :
 *  a) LE RAYON — « Élargir à 100 km ». Le badge ANNONCE la valeur
 *     qu'il va poser, et il DISPARAÎT quand la liste des rayons du
 *     site est épuisée (elle vaut 10 · 25 · 50 · 100 · 200 : voir
 *     RAYONS_TATOUAGE). Comme avant, il n'existe qu'autour d'un POINT
 *     — on n'élargit pas un cercle autour d'un pays.
 *  b) LE PAYS — « Chercher en France », « aux États-Unis », « au
 *     Japon ». Le nom vient du CODE ISO porté par l'adresse
 *     (`paysDuLieu`, lib/geocodage — voir la nº 510 : le NOM, lui, ne
 *     voyage pas, et l'exiger rendait ce badge introuvable) ; la
 *     préposition vient d'une table clée par ce même code
 *     (lib/preposition-pays), qui n'écrit que les cas minoritaires et
 *     replie tout le reste sur « en ».
 *     ⚠️ LA FORME LONGUE, ICI : `nomPaysAffiche` écrit « États-Unis ».
 *     La BARRE, elle, abrège en « USA » une fois le lieu posé
 *     (`nomPaysMoteur`, la règle nº 486) — ce n'est pas une
 *     incohérence, ce sont deux endroits qui n'ont pas la même place.
 *  c) LE MONDE — « Partout dans le monde », le seul badge qui reste
 *     une fois qu'on cherche déjà dans un pays entier.
 *
 * ⚠️ B ET C SONT EXCLUSIFS, ET C'EST TOUT L'INTÉRÊT : tant qu'un pays
 * peut être proposé, le monde ne l'est pas — sinon on rouvrirait
 * exactement le saut que cette passe supprime. Le monde prend la
 * relève dans les DEUX cas où le pays n'a pas de sens : on y est déjà,
 * ou l'adresse ne porte pas son code ISO (`paysDuLieu` rend alors
 * `null` — et c'est le SEUL cas restant depuis la nº 510).
 * ⚠️ ET LE RESTE DE LA RECHERCHE NE BOUGE PAS : le style, la nature et
 * les filtres sont recopiés tels quels à chaque palier — on élargit le
 * LIEU, jamais la question.
 * ⚠️ AUCUN DESSIN NE CHANGE : les capsules restent celles de
 * AucunResultat (gris élevé, sans contour). Seuls le texte et la
 * logique sont neufs.
 */
function issuesDuVide(
  affiches: CritèresTatouage,
  chercher: (suivants: CritèresTatouage) => void
): IssueAucunResultat[] {
  const lieu = affiches.lieu;
  if (!lieu) return [];

  const issues: IssueAucunResultat[] = [];

  const suivant = rayonSuivant(affiches.rayonKm);
  if (rayonApplicable(lieu) && suivant !== null) {
    issues.push({
      libelle: `Élargir à ${suivant} km`,
      surClic: () => chercher({ ...affiches, rayonKm: suivant }),
    });
  }

  const pays = paysDuLieu(lieu);
  if (pays) {
    issues.push({
      libelle: `Chercher ${paysAvecPreposition(nomPaysAffiche(pays), pays.code_pays)}`,
      surClic: () => chercher({ ...affiches, lieu: pays }),
    });
    return issues;
  }

  issues.push({
    libelle: "Partout dans le monde",
    surClic: () => chercher({ ...affiches, lieu: null }),
  });
  return issues;
}

/** §2 (nº 422) — LE LIBELLÉ DU LIEN « VOIR PLUS ». `useLinkStatus` ne
    se lit que SOUS le Link : ce petit composant y vit, et dit
    « Chargement… » tant que la navigation du lien est en route — le
    même message que portait l'ancien bouton pendant sa transition. */
function LibelleVoirPlus() {
  const { pending } = useLinkStatus();
  return pending ? "Chargement…" : "Voir plus";
}

export function IndexTatoueurs({
  premiers,
  catalogue = [],
  criteresInitiaux,
  message,
  total,
  page,
  jourMelange,
  affichage = { disposition: "deux", phototheque: false },
}: {
  /** LES CARTES DE CETTE ADRESSE — toutes celles qu'elle demande,
      pages cumulées comprises. C'est le SEUL contenu de la mosaïque. */
  premiers: Tatoueur[];
  /** ██ §1 (nº 621) — LE CATALOGUE DE STYLES, quand la page en a un ██
      L'ACCUEIL AU REPOS n'affiche plus une mosaïque de portfolios mais
      UNE CARTE PAR STYLE (lib/catalogue-styles, lu à la nº 620). Le
      serveur ne le fournit QUE là : une recherche, une page de style,
      le jumeau avec des critères ne le reçoivent jamais, et cette
      surface se comporte alors exactement comme avant.
      ⚠️ VIDE PAR DÉFAUT, ET C'EST LA GARDE : aucun appelant existant
      n'a à changer, et l'absence de catalogue vaut « la mosaïque,
      comme toujours ». */
  catalogue?: StyleDuCatalogue[];
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
  /** §2 (nº 425) — le jour du mélange utilisé par CE rendu (voir
      `jourDuMelange`, lib/tatoueurs). Le lien « Voir plus » le
      transmet pour que la page suivante prolonge cet ordre-ci. */
  jourMelange: number;
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
   *
   * ██ §2 (nº 632) — `pret` EST LU, ET C'EST TOUTE LA CORRECTION ██
   * ------------------------------------------------------------------
   * LE DÉFAUT : connecté, on rafraîchit l'accueil et le bandeau
   * « Tu es tatoueur ? » paraît un instant avant de s'effacer.
   * LA CAUSE, ET ELLE EST ÉCRITE NOIR SUR BLANC DANS LA NOTE DU BANDEAU
   * LUI-MÊME, plus bas : « la réponse vient du serveur avec la page,
   * l'appel n'apparaît donc jamais pour disparaître ensuite ». C'ÉTAIT
   * VRAI — jusqu'à la nº 357, qui a rendu l'accueil PRÉRENDU. Une page
   * préparée d'avance n'a AUCUNE REQUÊTE, donc aucun cookie, donc
   * aucune session : le contexte servi y vaut « on ne sait rien »
   * (`utilisateur: null`, `pret: false`). Or le bandeau ne regardait
   * QUE `utilisateur` — il lisait « personne » là où il fallait lire
   * « je ne sais pas encore », et s'affichait. La page hydratée lit
   * alors le cookie du navigateur, trouve la session, et le retire.
   * La note d'alors n'était pas fausse : elle a été rendue fausse.
   *
   * `useUtilisateur` DISTINGUE DÉJÀ LES TROIS ÉTATS — c'est
   * exactement ce que `pret` dit, et onze écrans du site le lisent
   * déjà. Il n'y avait rien à inventer : il manquait ici.
   *
   * ⚠️ CE QU'UN VISITEUR SANS COMPTE Y PERD, ET POURQUOI C'EST LE BON
   * CHOIX : sur l'accueil prérendu, il attend UN RENDU — celui qui suit
   * l'hydratation. Pas une requête réseau : la session se lit dans le
   * cookie, de façon synchrone (voir lib/use-utilisateur). Sur toutes
   * les autres pages, qui sont dynamiques, le serveur a déjà lu le
   * cookie et le bandeau est dans le HTML d'origine — rien n'attend.
   * Et ce bandeau vit TOUT EN BAS, après la mosaïque entière : au
   * moment où il paraît, il est à des milliers de pixels sous l'œil.
   * Une apparition que personne ne voit vaut mieux qu'une disparition
   * que le propriétaire voit.
   * ⚠️ AUCUN RISQUE D'ÉCART D'HYDRATATION : le premier rendu du
   * navigateur lit le MÊME instantané que le serveur (`pret: false`),
   * donc pas de bandeau des deux côtés. C'est le rendu SUIVANT qui
   * tranche.
   * ⚠️ ET L'ACCUEIL RESTE PRÉRENDU : on ne lit ni cookie ni en-tête au
   * serveur — on se contente de ne rien affirmer tant qu'on ne sait pas.
   */
  const { utilisateur, pret: sessionConnue } = useUtilisateur();

  /** LES CRITÈRES SERVIS — ceux de l'adresse, décodés par le serveur.
      Ce sont EUX que la mosaïque illustre, toujours. */
  const criteresServis = criteresComplets(criteresInitiaux);
  const cleServie = parametresDeRecherche(criteresServis).toString();
  /*  §1 (nº 631) — LA MÊME CLÉ, MISE EN FORME COMPARABLE : c'est elle
      qu'on oppose à l'adresse du navigateur, juste en dessous. On la
      calcule à partir de `cleServie` pour qu'il n'y ait qu'UNE écriture
      des critères servis — jamais deux lectures des mêmes propriétés. */
  const cleSignee = signatureDesCriteres(cleServie);

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

  /**
   * ██ §1 (nº 631) — QUAND LA PAGE SERVIE N'EST PAS CELLE DE L'ADRESSE ██
   * ==================================================================
   * LE DÉFAUT, ET IL EST MESURÉ. Journal du propriétaire, au web, en
   * cliquant « Toutes les réalisations » depuis une page de résultats :
   *
   *   10545  ADRESSE pushState · va vers /?nature=tatouage · entrées 6 → 6
   *   10549  ⚠️ DÉMONTAGE page (IndexTatoueurs)
   *   10553  PAGE SERVIE · adresse /?nature=tatouage · servi style=""
   *          nature="" · CATALOGUE 9 · premiers 0 · total 0
   *
   * L'adresse dit « toutes les réalisations » ; les propriétés disent
   * l'accueil au repos, catalogue compris. Huit millisecondes entre la
   * navigation et le rendu : AUCUNE REQUÊTE N'EST PARTIE.
   *
   * LA CAUSE, NOMMÉE. Le routeur de Next garde en mémoire l'arbre des
   * pages qu'il a déjà rendues, et le nôtre est PRÉRENDU (`○ /`,
   * régénéré toutes les 5 minutes — la borne posée à la nº 356, qui a
   * réparé les éjections de retour sur Chrome iPhone). Une navigation
   * CLIENTE qui ne change que la REQUÊTE reste sur le même chemin « / » :
   * le routeur retrouve son entrée, la juge fraîche, et ressort l'arbre
   * de l'accueil sans rien demander au serveur — donc sans jamais
   * atteindre le jumeau `/recherche` que le proxy réserve aux
   * adresses à requête. C'est le défaut relevé à la nº 595 (il y démontait
   * déjà tout l'arbre, voir la note de PageFavoris) ; il n'y produisait
   * qu'un CLIGNOTEMENT, parce que l'accueil prérendu était alors une
   * mosaïque vide. Depuis que l'accueil porte un CATALOGUE DE STYLES
   * (nº 621), cette copie est une page entière et crédible : plus rien
   * ne signale l'erreur, et elle reste.
   *
   * POURQUOI CETTE VOIE-CI, ET PAS LES TROIS DE LA nº 595 :
   *  1. DONNER À LA RECHERCHE UNE ADRESSE À ELLE — c'est la voie sûre,
   *     mais elle rendrait `/recherche` visible dans la barre du
   *     navigateur. C'EST UNE DÉCISION DU PROPRIÉTAIRE, pas la mienne :
   *     elle n'est pas prise ici ;
   *  2. RETIRER LE PRÉCHARGEMENT DU LIEN — écartée depuis : la mesure a
   *     montré que le défaut vit sans le moindre survol ;
   *  3. NE PLUS TOUT REDEMANDER — un chantier, pas une correction.
   * LA QUATRIÈME, celle-ci : ON NE CHERCHE PLUS À EMPÊCHER LE ROUTEUR DE
   * SE TROMPER, ON LUI DEMANDE LA VÉRITÉ QUAND IL S'EST TROMPÉ. La page
   * compare la signature des critères de SON ADRESSE à celle des critères
   * qu'on lui a SERVIS. Tant qu'elles s'accordent — c'est-à-dire toujours,
   * hors ce défaut — il ne se passe rien du tout. Quand elles divergent,
   * `router.refresh()` redemande la page courante AU SERVEUR : la
   * documentation de Next dit qu'il refait la requête et ne consulte pas
   * la mémoire du routeur. C'est exactement ce qui manque ici.
   *
   * ⚠️ IL NE PEUT PAS BOUCLER, et c'est le garde-fou qui le garantit,
   * pas la chance : UNE SEULE REPRISE PAR ADRESSE. Un désaccord peut être
   * LÉGITIME et donc permanent — un style que le catalogue ne connaît
   * plus (`styleConnu` le refuse en silence : l'adresse dit « style=X »,
   * le servi n'a plus que la nature), un vieux lien partagé, un `rayon`
   * sans lieu. Dans ces cas-là on paie UNE requête de plus, une fois, et
   * plus rien.
   * ⚠️ IL NE TOUCHE NI L'HISTORIQUE NI LA POSITION : `refresh` ne pousse
   * aucune entrée et ne défile pas — le retour (nº 329) et la mémoire de
   * position ne le voient pas passer. Et il NE REMONTE PAS le composant :
   * React garde l'état client, seules les propriétés servies changent.
   * ⚠️ IL SOIGNE « VOIR PLUS » PAR LA MÊME PORTE : « /?page=2 » est le
   * cas d'origine de la nº 595, et c'est le même désaccord — sauf que la
   * page n'y est pas un critère, donc la signature ne bouge pas et rien
   * ne se déclenche tant que la page servie est la bonne.
   */
  const adresseReprise = useRef<string | null>(null);
  //  ⚠️ SANS LISTE DE DÉPENDANCES, ET C'EST VOULU : le défaut est
  //  précisément que les PROPRIÉTÉS NE CHANGENT PAS quand l'adresse
  //  change. Un effet qui n'écoute que les propriétés ne le verrait
  //  jamais. Il tourne donc à chaque rendu — deux courtes chaînes à
  //  comparer, et il sort à sa première ligne dans le cas normal.
  useEffect(() => {
    const demande = signatureDesCriteres(window.location.search);
    if (demande === cleSignee) {
      //  Tout est en ordre : on rouvre le droit à une reprise, pour que
      //  le garde-fou vaille par ÉPISODE et non une fois pour toutes.
      adresseReprise.current = null;
      return;
    }
    const ici = window.location.pathname + window.location.search;
    if (adresseReprise.current === ici) return;
    adresseReprise.current = ici;
    noter(
      `⚠️ PAGE EN RETARD SUR L'ADRESSE · demandé « ${demande || "(rien)"} »` +
        ` · servi « ${cleSignee || "(rien)"} » — on redemande au serveur`
    );
    router.refresh();
  });

  //  ⚠️ LA SONDE DE LA BASCULE (nº 173) : le conteneur de page est-il
  //  démonté au clic ? (N'écrit que sous `?sonde-bascule=1`.)
  useEffect(() => {
    noterMontage("page (IndexTatoueurs)");
    return () => noterDemontage("page (IndexTatoueurs)");
  }, []);

  /* ==================================================================
   * ██ TEMPORAIRE (nº 630) — L'ADRESSE ET LES PROPRIÉTÉS DISENT-ELLES
   * LA MÊME CHOSE ? ██
   * ==================================================================
   * CE QU'ON CHERCHE. Deux défauts du moteur au web : « Toutes les
   * réalisations » ramène le catalogue de styles ; un second choix
   * affiche la page du précédent. Le propriétaire soupçonne UNE seule
   * cause, et il a raison de le soupçonner : les deux se décrivent de
   * la même façon — LA PAGE MONTRÉE N'EST PAS CELLE DE L'ADRESSE.
   *
   * CE QUE LA MESURE DE L'ATELIER A DÉJÀ ÉCARTÉ (relevé de la nº 630,
   * pris au navigateur sur la compilation de production) :
   *  · LE CLIC ÉCRIT LA BONNE ADRESSE — l'écriture d'historique tracée
   *    dit `pushState → /?style=…&nature=tatouage`, jamais autre chose ;
   *  · LE SERVEUR DÉCODE BIEN CETTE ADRESSE — « Toutes les
   *    réalisations » sur `/?nature=tatouage`, le bon style sur
   *    `/?style=…` ;
   *  · CINQ CHOIX DE SUITE tombent tous juste ;
   *  · L'ALLER-RETOUR DE LA FENÊTRE DE FICHE (le `pushState` brut de
   *    GrilleTatoueurs, puis `history.back()`) ne dérègle rien.
   * CE QUE L'ATELIER NE PEUT PAS AVOIR : la base est injoignable
   * (`Host not in allowlist`), donc `catalogue` y est TOUJOURS VIDE et
   * `surLeCatalogue` TOUJOURS FAUX. La condition même dont les deux
   * symptômes parlent ne peut pas s'y produire. Corriger d'ici serait
   * corriger à l'aveugle.
   *
   * LA MESURE, ET CE QU'ELLE TRANCHE. À chaque arrivée de page servie,
   * on écrit CÔTE À CÔTE l'adresse du navigateur et ce que le serveur a
   * mis dans les propriétés. Trois réponses possibles, trois causes
   * différentes, et la ligne les sépare sans discussion :
   *  a) adresse « /?nature=tatouage » avec « servi nature="" » et
   *     « catalogue 31 » → LES PROPRIÉTÉS SONT EN RETARD SUR L'ADRESSE :
   *     le routeur a ressorti un arbre déjà en cache (le défaut nommé à
   *     la nº 595) ;
   *  b) adresse et servi D'ACCORD, mais « catalogue 31 » quand même →
   *     c'est le SERVEUR qui a joint un catalogue à une recherche : la
   *     faute est dans `_accueil/rendu`, pas dans le routeur ;
   *  c) adresse et servi d'accord, « catalogue 0 », et pourtant des
   *     cartes de style à l'écran → RIEN N'A ÉTÉ REPEINT : React n'a pas
   *     rendu, et la cause est un état bloqué, pas une donnée.
   *  d) adresse « /?style=X&nature=tatouage » avec « servi style="" » et
   *     « nature="tatouage" » → LE SLUG A ÉTÉ REFUSÉ. `styleConnu`
   *     (config/tatouage) rend la chaîne vide pour tout style absent du
   *     catalogue statique, SANS RIEN DIRE : il ne reste alors que la
   *     nature, et la page s'intitule « Toutes les réalisations ». Ce
   *     cas-là est reproduit dans l'atelier — un chargement direct de
   *     `/?style=<slug inconnu>&nature=tatouage` rend exactement le
   *     symptôme du second défaut.
   * ON ÉCRIT AUSSI `premiers` ET `total` : le cas (b) se reconnaît à un
   * total nul avec un catalogue plein.
   *
   * ⚠️ ELLE NE FAIT QUE LIRE, et seulement sous `?sonde-bascule=1` :
   * `noter` sort à sa première ligne sans la sonde. Aucune décision du
   * site ne dépend d'elle.
   * ⚠️ ELLE PART À LA PASSE SUIVANTE, comme celles des nº 625 et 626.
   */
  useEffect(() => {
    noter(
      `PAGE SERVIE · adresse ${window.location.pathname}${window.location.search}` +
        ` · servi style="${criteresServis.style}" nature="${criteresServis.nature}"` +
        ` lieu=${criteresServis.lieu ? "oui" : "non"} exclure=${criteresServis.exclure.length}` +
        ` · catalogue ${catalogue.length} · premiers ${premiers.length} · total ${total}`
    );
  }, [cleServie, catalogue.length, premiers.length, total, criteresServis]);

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
  /**
   * ██ §2 (nº 422) — « VOIR PLUS » EST UN LIEN PRÉCHARGÉ, PLUS UN
   * BOUTON QUI DÉCLENCHE ██
   * ==================================================================
   * LE DÉFAUT, constaté en ligne : au premier clic, AUCUNE nouvelle
   * carte ne semblait s'afficher, et la remontée qui suivait était
   * saccadée ; au deuxième clic, tout marchait. INSTRUIT au banc de
   * navigation de cette passe : le clic déclenchait bien UNE vraie
   * requête serveur (le jumeau de recherche rend les cartes — vérifié
   * requête par requête), mais elle ne PARTAIT qu'au clic. En ligne,
   * le temps qu'elle revienne (réseau + session + base), le visiteur
   * était déjà reparti vers le haut : les cartes arrivaient DERRIÈRE
   * lui — invisibles depuis le bouton — et leur pose tombait au beau
   * milieu de son geste de remontée, d'où les à-coups. Le deuxième
   * clic, servi juste après la pose, paraissait « réparer ».
   *
   * LA CORRECTION : le bouton devient un `<Link prefetch>` vers la
   * page suivante. `prefetch={true}` (doc Next : « The full route will
   * be prefetched for both static and dynamic routes ») précharge la
   * RÉPONSE ENTIÈRE dès que le lien ENTRE À L'ÉCRAN — c'est-à-dire
   * seulement pour qui est descendu jusqu'en bas, exactement celui qui
   * va cliquer. Au clic, la réponse est déjà là : les cartes se posent
   * IMMÉDIATEMENT, sous ses yeux, pendant qu'il est encore en bas — et
   * plus rien ne se commet en retard pendant la remontée.
   *
   * CE QUI NE CHANGE PAS : `replace` (la pagination ne pose JAMAIS
   * d'étape d'historique, nº 332-§1) ; `scroll={false}` (la page ne
   * bouge pas d'un pixel, nº 224-§3) ; l'adresse est la même
   * (`adresseDe`, disposition et texte compris, nº 203-§1b) ; la sonde
   * des cartes s'ouvre toujours AVANT la navigation (nº 224-§5).
   * CE QUI CHANGE, ET C'EST DIT : la grille ne s'estompe plus pendant
   * un « Voir plus » (l'estompe venait de la transition du bouton) —
   * elle reste entière, les cartes s'ajoutent dessous ; l'estompe
   * demeure pour les vraies recherches (`chercher`). Le libellé
   * « Chargement… » demeure, par `useLinkStatus` (LibelleVoirPlus).
   */

  const visibles = premiers;
  const resteAVoir = total > visibles.length;

  /**
   * ██ §1 (nº 425) — LA PAGE SUIVANTE SE CALCULE SUR CE QUI EST
   * AFFICHÉ, PAS SUR LA NUMÉROTATION DU SERVEUR QUI A RENDU ██
   * ==================================================================
   * LE DÉFAUT, prouvé par les nombres du relevé du propriétaire
   * (« 24/27 figé au premier clic, tout au deuxième ») : la page
   * PRÉRENDUE sert 24 cartes — le repli de la nº 226, elle ne peut pas
   * lire le cookie des colonnes — et se dit « page 1 ». Sur un
   * téléphone à deux colonnes, le JUMEAU compte en pages de DOUZE
   * (cookie) : le premier clic demandait `page=2`, soit 12 × 2 =
   * 24 cartes — EXACTEMENT ce qui était déjà à l'écran. Rien de neuf,
   * compteur figé. Le deuxième clic (page 3 → 36) « débloquait ».
   * LA RÈGLE : le lien vise la première page (au sens de CET écran,
   * son cookie) qui apporte des cartes de plus que l'affiché —
   * `floor(affichées ÷ taille de l'écran) + 1`. Avec 24 affichées et
   * des pages de 12 : page 3 (36 cartes servies, 12 nouvelles). Sur le
   * web à 24 par page : page 2, comme avant — rien ne change.
   * ⚠️ LA LECTURE DU COOKIE EST FAITE APRÈS L'HYDRATATION (un effet) :
   * le HTML du serveur garde son lien d'origine, aucun écart
   * d'hydratation ; l'effet corrige le lien dans la foulée. La règle
   * nº 226 (rangées complètes) est intacte : les limites servies
   * restent des multiples de la taille de page du cookie.
   */
  const taillePageEcran = useSyncExternalStore(
    sourisMuette,
    lireTaillePageEcran,
    tailleInconnueAuServeur
  );
  /**
   * ██ §1 (nº 593) — ON NE PEUT JAMAIS REDEMANDER LA PAGE QU'ON A ██
   * ==================================================================
   * LE DÉFAUT, RELEVÉ PAR LE PROPRIÉTAIRE : sur son grand écran,
   * « Voir plus » clignotait et n'ajoutait RIEN.
   * LA CAUSE, ET ELLE N'EST PAS CELLE QU'ON CROYAIT (la nº 592 n'a
   * posé qu'une largeur, et une classe ne peut pas empêcher une
   * navigation) : c'est cette division-ci, quand la page SERVIE est
   * plus courte que la page de l'ÉCRAN. L'accueil nu est prérendu — il
   * ne lit aucun cookie et sert donc toujours le repli de 24 cartes —
   * tandis que le cookie des colonnes dit 30 sur un écran à cinq
   * colonnes. `Math.floor(24 / 30)` vaut ZÉRO, la page suivante
   * devenait donc la page 1 : l'adresse du lien était CELLE OÙ L'ON
   * ÉTAIT DÉJÀ. Le routeur y naviguait — d'où le clignotement — et
   * rendait la même chose.
   * ⚠️ SEUL LE PALIER DE CINQ COLONNES EST TOUCHÉ, et c'est ce qui
   * explique que le défaut ait pu dormir : à quatre colonnes 24/24
   * donne 1, à trois 24/18 donne 1, à deux 24/12 donne 2 — toutes
   * rendent une page suivante qui existe. Il n'y a qu'à cinq, où la
   * page de l'écran dépasse celle qui est servie, que le quotient
   * tombe à zéro.
   * LE REMÈDE : un plancher. La page demandée est toujours au moins
   * celle d'après l'adresse courante — on ne peut pas demander moins
   * que ce qu'on a déjà. Le calcul du cookie garde tout son rôle
   * partout ailleurs (c'est lui qui évite de sauter des cartes quand
   * la page de l'écran est plus PETITE que celle qui est servie).
   */
  const pageSuivante = Math.max(
    taillePageEcran !== null && visibles.length > 0
      ? Math.floor(visibles.length / taillePageEcran) + 1
      : page + 1,
    page + 1
  );

  /*  ⚠️ PLUS AUCUNE REMISE EN PLACE (nº 224-§3) : la page ne doit pas
      bouger, donc personne ne la déplace. Cet effet ne fait plus que
      FERMER le relevé de la sonde, une fois les nouvelles cartes
      posées — il ne touche jamais au défilement. */
  const nombreAffiche = useRef(visibles.length);
  useEffetAvantPeinture(() => {
    if (visibles.length === nombreAffiche.current) return;
    nombreAffiche.current = visibles.length;
    /*  ██ §1 (nº 426) — L'INSERTION DES CARTES EST ANNONCÉE, comme un
        défilement posé par le site.
        LE DÉFAUT (relevé du propriétaire, iPhone) : au premier « Voir
        plus » qui marche (nº 425), douze cartes s'insèrent AU-DESSUS
        du lien qu'on vient de toucher. Sur WebKit — Chrome iPhone EST
        WebKit — `overflow-anchor: none` n'existe pas (mesuré nº 424) :
        l'ancrage natif garde le lien immobile en AJUSTANT le
        défilement, et ces ajustements arrivent en événements `scroll`
        qu'aucun doigt n'a faits. La barre y lisait un GESTE : cumul
        basculé, et la rangée de recherche (le volet) se rouvrait toute
        seule après le clic. La fenêtre de `defilement-programme`
        (300 ms + deux images) couvre ces ajustements : la barre prend
        acte, sans y lire d'intention — la règle nº 154-§6A, étendue
        aux mouvements que le NAVIGATEUR fait pour nous. */
    annoncerMouvementDuSite();
    fermerReleveCartes();
  }, [visibles.length]);
  /** Ce que la ligne de résultats annonce : les critères SERVIS, jamais
      ceux que le doigt vient de poser. */
  const affiches = criteresServis;

  /** ██ §1 (nº 621) — MONTRE-T-ON LE CATALOGUE DE STYLES ? ██
      DEUX CONDITIONS, et les deux comptent :
       · LE SERVEUR EN A FOURNI UN. Il ne le fait que sur l'accueil au
         repos — une recherche n'en reçoit jamais ;
       · AUCUN CRITÈRE N'EST AFFICHÉ. La surface est cliente : entre le
         clic sur « Rechercher » et l'arrivée de la nouvelle page, ce
         sont les critères AFFICHÉS qui disent où l'on en est. Sans
         cette seconde condition, le catalogue resterait à l'écran
         pendant la transition d'une recherche lancée depuis l'accueil.
      ⚠️ LES QUATRE CRITÈRES, PAS TROIS : les interrupteurs éteints
      (`exclure`) sont une recherche eux aussi — c'est la définition
      qu'a posée `estLAccueilNu` à la nº 619, et les deux disent la
      même chose de la même page. */
  const surLeCatalogue =
    catalogue.length > 0 &&
    !affiches.style &&
    !affiches.nature &&
    !affiches.lieu &&
    affiches.exclure.length === 0;

  /*  §1 (nº 480) — `aucuneRecherche` A ÉTÉ RETIRÉE, avec le gros
      relevé qui la documentait (nº 395). Elle ne servait qu'à une
      chose : décider si la première ligne des cartes portait le
      STYLE ou le NOM, parce que la carte n'avait que deux lignes et
      qu'il fallait choisir. La carte en a trois depuis cette passe —
      le style au premier rang, le nom au deuxième, partout et sans
      condition —, donc plus personne ne pose la question. Le
      raisonnement complet reste lisible dans l'historique ; le
      garder ici, inerte, aurait fait croire à un réglage vivant.
      ⚠️ RIEN D'AUTRE N'EST TOUCHÉ : `affiches` et les critères
      servis gardent tous leurs autres lecteurs. */

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
            se lisent.
            LA RÈGLE, À JOUR (nº 508-§2, AFFINÉE nº 633) : le QUOI en
            titre — LE NOM DU STYLE quand un style est choisi (« Anime &
            Manga »), la catégorie entière quand il n'y en a pas
            (« Toutes les réalisations », « Tous les flashs ») — et,
            quand aucune catégorie n'est choisie, le titre GÉNÉRIQUE :
            un lieu n'est jamais un titre. Le lieu et le rayon vivent
            TOUJOURS dans le sous-titre, derrière le compte. Sans
            recherche du tout : le titre d'invitation de la mosaïque, et
            une ligne muette à la place du sous-titre (nº 507-§1). */}
        {(() => {
          /*  ██ §1 (nº 633) — LE TITRE NE RÉPÈTE PLUS LA CATÉGORIE ██
              ------------------------------------------------------------
              CE QUI CHANGE : « Réalisations · Anime & Manga » devient
              « Anime & Manga ». Le nom du style suffit — la catégorie
              est déjà dite par le champ du moteur juste au-dessus, et
              elle n'apprend rien de plus sur ce qu'on regarde.
              ⚠️ `libelleExplorer` N'EST PAS TOUCHÉE, et c'est délibéré :
              elle sert DEUX AUTRES surfaces où la mention doit rester —
              le champ refermé du moteur (MoteurTatouage) et celui de
              « Ma sélection » (MenusSelection). Là-bas, la ligne dit CE
              QU'ON A RÉPONDU, dans l'ordre où on l'a répondu (voir sa
              note) ; ici, elle dit CE QU'ON REGARDE. Deux rôles, deux
              écritures — changer la fonction aurait emporté les trois.
              On ne l'appelle donc plus que pour ce qu'elle seule sait :
              le nom d'une catégorie ENTIÈRE.
              ⚠️ LE REPLI DE LA nº 321-§3 DISPARAÎT SANS RIEN PERDRE : il
              rattrapait le cas d'un style SANS catégorie (une adresse
              bricolée, « /?style=anime-manga »), où `libelleExplorer`
              rendait la chaîne vide. Ce cas passe désormais par le
              chemin PRINCIPAL — le style d'abord — et rend le même mot
              qu'avant. Une branche de moins, aucun cas de moins. */
          const quoi = affiches.style
            ? libelleStyle(affiches.style)
            : libelleExplorer(affiches.nature, "");
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
          /*  §2 (nº 624) — « PORTFOLIOS », PLUS « CRÉATIONS ». Ce
              chiffre est le TOTAL des cartes que la recherche a
              trouvées (`total`, c'est-à-dire des carrousels depuis la
              nº 279) : il disait donc « créations » pour désigner des
              portfolios. Le mot s'aligne sur celui des cartes de style
              (nº 623) et sur celui du menu « Explorer » — un seul mot
              pour une seule chose.
              ⚠️ L'ACCORD TIENT AU SINGULIER : « 1 portfolio ».
              ⚠️ ÉCRIT UNE SEULE FOIS, ICI : `LigneResultats` ne fait que
              recevoir cette chaîne (ses mentions de « créations » sont
              des exemples en commentaire). Le titre d'invitation de la
              mosaïque, lui, garde ses mots (`TEXTES_TATOUAGE`) — il ne
              porte aucun nombre. */
          /*  ██ §2 (nº 628) — LE COMPTE DIT CE QUE LA PAGE MONTRE, ET
               L'ACCUEIL EN A UN LUI AUSSI ██
               D'OÙ VIENT LE NOMBRE, ET C'EST LA QUESTION DU
               PROPRIÉTAIRE : de la SOMME DU CATALOGUE DE STYLES
               (nº 624), pas d'une lecture neuve. `catalogueDesStyles`
               est déjà lue par l'accueil au repos (nº 621) et chaque
               entrée porte son nombre de portfolios — celui-là même
               qui s'écrit sous chaque carte. Le total annoncé est donc,
               à la lettre, LA SOMME DE CE QUI EST À L'ÉCRAN. Aucune
               requête de plus, aucun cookie, aucun en-tête : l'accueil
               reste prérendu (`○ /`).
               ⚠️ POURQUOI PAS `resultat.total`, le total de la
               recherche à vide : sur l'accueil au catalogue, il vaut
               ZÉRO par construction — le serveur n'envoie AUCUNE carte
               de portfolio dans ce cas (nº 621), et c'est ce zéro qui
               fait taire « Voir plus » et le compteur. Aller le
               chercher demanderait de défaire cet accord ; la somme du
               catalogue dit la même chose et se vérifie à l'œil.
               ⚠️ L'ÉCART AVEC LA RECHERCHE EST CONNU ET ASSUMÉ (il est
               écrit à la nº 624) : un portfolio dont le style n'est pas
               catalogué produit bien une carte en recherche, mais
               n'entre dans aucun style — il n'est donc pas dans cette
               somme. Les deux nombres peuvent différer d'autant.
               ⚠️ SANS CATALOGUE (une recherche, ou la base muette), la
               valeur reste EXACTEMENT `total` : cette ligne ne change
               rien pour les pages de résultats. */
          const totalAffiche = surLeCatalogue
            ? catalogue.reduce((somme, style) => somme + style.portfolios, 0)
            : total;
          const compte = `${totalAffiche} portfolio${totalAffiche > 1 ? "s" : ""}`;
          if (!quoi && !lieu) {
            //  SANS RECHERCHE : l'invitation, et ce que le site est.
            //  §2 (nº 445) — ET L'AIR SOUS LA BARRE, AU DOIGT : la
            //  phrase d'introduction ayant quitté le mobile (nº 444),
            //  les cartes touchaient presque la barre fixe. Ce bloc
            //  vide de 14 px rend cet air — et LUI SEUL : il ne vit
            //  que sur l'accueil SANS recherche (là où le titre est
            //  masqué), au doigt seulement (`mobile:`, le vrai
            //  appareil), et ne touche aucun conteneur partagé. Quand
            //  une recherche est active, c'est le titre qui donne
            //  l'air, comme avant — rien n'y est ajouté.
            return (
              <>
              <div
                aria-hidden="true"
                data-air-sous-barre=""
                className="h-3.5 hidden mobile:block"
              />
              <LigneResultats
                titre={TEXTES_TATOUAGE.titreMosaique}
                /*  ██ §1 (nº 507) — PLUS DE SOUS-TITRE, ET PAS UN PIXEL
                     D'AIR EN MOINS ██
                     La signature « Le portfolio des tatouages et des
                     tatoueurs » est supprimée (voir la note laissée à
                     sa place dans config/tatouage.ts). Sans rien
                     d'autre, le bloc de tête aurait maigri de la
                     hauteur de cette ligne et la mosaïque serait
                     montée d'autant. `degagementConstant` — le
                     mécanisme de la nº 301 — rend à sa place une ligne
                     muette PORTANT LES MÊMES CLASSES : même écart
                     au-dessus, même corps, même hauteur de ligne.
                     L'égalité est structurelle, pas approchée : aucun
                     nombre n'est écrit ici ni là-bas. */
                /*  ██ §2 (nº 628) — LE SOUS-TITRE REVIENT, ET C'EST LE
                     COMPTE ██
                     La nº 507 avait SUPPRIMÉ la signature « Le
                     portfolio des tatouages et des tatoueurs » en
                     GARDANT SON AIR (`degagementConstant`, une ligne
                     muette aux mêmes classes). Cet air est donc encore
                     là, à la hauteur exacte d'une ligne de sous-titre :
                     le compte s'y pose SANS DÉPLACER UN SEUL PIXEL —
                     ni le titre au-dessus, ni les cartes en dessous. Le
                     mécanisme de la nº 301 n'a rien à faire de plus,
                     c'est très précisément ce pour quoi il existe.
                     ⚠️ ET LE DRAPEAU RESTE POSÉ, il n'est pas devenu
                     inutile : quand le nombre vaut zéro — la base
                     muette, un catalogue vide — on n'écrit pas
                     « 0 portfolio », on rend la ligne muette et l'air
                     tient tout seul, comme depuis la nº 507.
                     ⚠️ RIEN AU DOIGT, et ce n'est pas un choix de plus :
                     `masqueAuDoigt` (nº 444) retire le bloc ENTIER —
                     titre et sous-titre — du vrai appareil tactile. Ce
                     compte ne s'affiche donc qu'au web, sans qu'aucune
                     classe ait eu à le dire. */
                sousTitre={totalAffiche > 0 ? compte : null}
                degagementConstant
                //  §1 (nº 444) — AU DOIGT, CETTE PHRASE NE S'AFFICHE
                //  PLUS : les cartes commencent tout de suite. Sur
                //  ordinateur, rien ne change. Le drapeau n'est passé
                //  QUE par cet appel-ci (l'accueil SANS recherche) :
                //  le titre d'une recherche, juste en dessous, garde
                //  ses deux affichages intacts.
                masqueAuDoigt
              />
              </>
            );
          }
          //  AVEC UNE RECHERCHE : le titre dit CE QU'ON CHERCHE, le
          //  sous-titre RÉSUME la recherche — compte · lieu · rayon,
          //  séparés par le point médian entouré d'espaces.
          /*  ██ §2 (nº 508) — UNE VILLE NE PREND PLUS LA PLACE DU
               TITRE ██
               CE QUI SE LISAIT AVANT, et que le propriétaire refuse :
               une ville cherchée SANS catégorie devenait le titre
               (« Lyon »), et le sous-titre n'en disait plus rien —
               « 4 créations · 50 km », un rayon autour de nulle part.
               Le lieu ne titrait que dans ce cas-là : dès qu'une
               catégorie l'accompagnait, il était déjà dans le
               sous-titre. C'était donc DEUX écritures pour une même
               donnée, et le défaut vivait dans l'écart entre les deux.
               DÉSORMAIS, UNE SEULE : le lieu est TOUJOURS dans le
               sous-titre, et le titre dit la catégorie — générique
               quand aucune n'est choisie. Les deux autres cas ne
               bougent pas d'un caractère : `quoi` gagne toujours, et
               le lieu occupait déjà la même place quand `quoi`
               existait.
               ⚠️ LES SÉPARATEURS SE FONT TOUJOURS PAR `filter(Boolean)`
               (nº 386) : une donnée absente emporte sa puce — une
               région rend « 4 portfolios: Occitanie » sans rayon,
               jamais de point médian orphelin.
               ⚠️ `affiches.lieu!.intitule` DISPARAÎT AVEC LA BRANCHE :
               il n'était atteint que par ce chemin, et son assertion
               non-nulle avec lui. */
          /*  ██ §1 (nº 635) — DEUX POINTS COLLÉS APRÈS LE COMPTE ██
              ------------------------------------------------------------
              « 1 portfolio · Paris · 50 km » devient « 1 portfolio:
              Paris · 50 km ». Le compte et le lieu ne sont pas de même
              nature — l'un dit COMBIEN, l'autre dit OÙ : une puce les
              mettait sur le même rang, les deux points annoncent. Entre
              LA VILLE ET LE RAYON, qui disent tous deux le même OÙ, la
              puce reste.
              ⚠️ PAS D'ESPACE AVANT, UN APRÈS : c'est l'usage anglais, et
              le site parlera anglais au lancement (acquis nº 614). En
              français on aurait mis une espace fine avant ; ce n'est pas
              la langue de ce texte.
              ⚠️ AUCUNE PONCTUATION ORPHELINE, ET C'EST GARDÉ PAR
              CONSTRUCTION (règle nº 386) : les deux points ne s'écrivent
              QUE si le morceau de droite existe. Sans lieu, la ligne
              n'est que le compte — et le compte, lui, ne peut jamais
              être vide (« 0 portfolio » reste une phrase). Le rayon sans
              lieu n'existe pas : il est gardé par `affiches.lieu` juste
              au-dessus. */
          const ou = [lieu, rayon].filter(Boolean).join(" · ");
          return (
            <LigneResultats
              titre={quoi || TEXTES_TATOUAGE.titreRechercheSansCategorie}
              sousTitre={ou ? `${compte}: ${ou}` : compte}
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
             recherche servie.
             SANS LIEU RENSEIGNÉ, aucune : la liste est déjà celle du
             monde entier, il n'y a plus rien à élargir — il ne reste
             que le titre. Ce qu'on propose quand il y a un lieu se
             décide dans `issuesDuVide`, juste au-dessus du composant. */}
        {!surLeCatalogue && visibles.length === 0 && (
          <AucunResultat issues={issuesDuVide(affiches, chercher)} />
        )}
        {/*  ██ §1 (nº 621) — L'ACCUEIL AU REPOS MONTRE LE CATALOGUE ██
             ------------------------------------------------------
             UNE CARTE PAR STYLE, à la place de la mosaïque de
             portfolios — et à cet endroit précis, pour que TOUT LE
             RESTE de la page reste ce qu'il était : la barre et son
             moteur au-dessus, le titre, le bloc de « Voir plus » en
             dessous (la nº 622 décidera de son sort).
             ⚠️ LES DEUX NE COEXISTENT PAS À L'ÉCRAN, ET AUCUNE CLASSE
             N'A EU À LE DIRE : quand la page porte un catalogue, le
             serveur ne lui envoie AUCUNE carte de portfolio (voir
             _accueil/rendu). La mosaïque reste donc montée — la règle
             de la nº 171, qui interdit de la démonter parce qu'elle
             porte la fenêtre de fiche — mais elle n'a rien à peindre.
             « Voir plus » et le compteur se taisent de la même façon,
             sans qu'on y touche : c'est un total de zéro, pas une
             condition de plus. Le vrai ménage est celui de la nº 622.
             ⚠️ ET LA BASCULE NE SE PRODUIT QU'ENTRE DEUX PAGES :
             lancer une recherche depuis l'accueil change d'adresse, et
             la page suivante ne reçoit plus de catalogue. Rien ne
             saute au chargement, rien ne se démonte en cours de
             route. */}
        {surLeCatalogue && <GrilleStyles styles={catalogue} />}
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
            //  §1 (nº 621) — LA NOTE D'ICI CITAIT `aucuneRecherche`,
            //  RETIRÉE À LA nº 480 : elle décrivait un réglage mort
            //  (piège des commentaires, nº 472). Ce qui reste vrai est
            //  la seule ligne ci-dessous — la grille s'estompe pendant
            //  une transition de recherche.
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
            <Link
              href={adresseDe(criteresServis, pageSuivante, jourMelange)}
              replace
              scroll={false}
              prefetch={true}
              onClick={() => ouvrirReleveCartes()}
              /**
               * ██ §1 (nº 592) — TROIS FOIS PLUS LARGE, AU WEB SEUL ██
               * ------------------------------------------------------
               * LE DÉFAUT, RELEVÉ PAR LE PROPRIÉTAIRE : sous une grille
               * qui occupe tout l'écran, cette capsule de 109 px se
               * perdait au milieu du vide. Elle passe à 328 — trois
               * fois sa largeur, mesurée à l'écran avant d'être posée.
               * ⚠️ LA HAUTEUR NE BOUGE PAS : `min-h-[42px]` reste seul à
               * la commander, et le rembourrage latéral reste écrit
               * pour le doigt. Il ne fait plus la largeur, il ne fait
               * qu'empêcher le mot de toucher le bord.
               * ⚠️ CONSÉQUENCE HEUREUSE, ET JE LA DIS : le bouton NE
               * CHANGE PLUS DE TAILLE pendant le chargement. Sa largeur
               * suivait son libellé — 109 px pour « Voir plus », 151
               * pour « Chargement… » —, et il se dilatait donc au clic.
               * Une largeur posée le fige.
               *
               * ██ §3-c (nº 593) — L'APPAREIL, PAS LA LARGEUR D'ÉCRAN ██
               * LE DÉFAUT, RELEVÉ PAR LE PROPRIÉTAIRE : en rétrécissant
               * la fenêtre de son navigateur, le bouton reprenait la
               * capsule du téléphone.
               * LA CAUSE EST LA MIENNE, ET C'EST UNE RÈGLE DU SITE QUE
               * J'AI MANQUÉE (nº 60) : la nº 592 avait posé la largeur
               * derrière `lg:`, un cran de LARGEUR D'ÉCRAN. Or ici la
               * question n'est pas « l'écran est-il large ? » mais
               * « suis-je au doigt ou à la souris ? » — et le site y
               * répond par `data-appareil`, posé sur `<html>` avant la
               * première peinture d'après la finesse du pointeur. Un
               * ordinateur à fenêtre étroite reste un ordinateur.
               * LE REMÈDE : la largeur du WEB devient celle de base, et
               * c'est la variante `mobile:` — celle qui lit
               * `data-appareil` — qui pose celle du doigt. Rétrécir une
               * fenêtre ne change donc plus rien.
               *
               * ██ §3-b (nº 593) — ET LA CAPSULE DU DOIGT S'ÉLARGIT ██
               * Le propriétaire la trouve trop petite : ses 109 px
               * passent à 160. Légèrement, comme demandé — et juste
               * assez pour contenir « Chargement… » (151 px mesurés),
               * si bien qu'elle ne se dilate plus sous le doigt non
               * plus.
               */
              className="inline-flex items-center justify-center rounded-full
                         bg-sombre-eleve px-5 min-h-[42px]
                         w-[328px] mobile:w-[160px]
                         text-[14px] font-semibold
                         text-sombre-texte transition-colors
                         hover:bg-sombre-haut"
            >
              {/*  §5 (nº 280) — « VOIR PLUS », TOUT COURT. Le bouton
                   charge des GALERIES depuis la nº 279, plus des
                   portfolios : le mot promettait autre chose que ce
                   qu'il apporte. (Le compteur, lui, ne change pas.) */}
              <LibelleVoirPlus />
            </Link>
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
            d'accueil ne lui apprend rien et le traite en inconnu.
            ⚠️ ET SEULEMENT QUAND ON SAIT (nº 632). L'ancienne note
            disait ici que « la réponse vient du serveur avec la page,
            l'appel n'apparaît donc jamais pour disparaître ensuite » :
            c'était vrai quand l'accueil était rendu à la demande, et la
            nº 357 l'a rendu PRÉRENDU — une page préparée d'avance ne
            connaît aucune session. `sessionConnue` distingue « personne
            n'est connecté » de « je ne sais pas encore », et seul le
            premier fait paraître le bandeau. Toute la raison est
            écrite à la déclaration de `sessionConnue`, plus haut. */}
        {sessionConnue && !utilisateur && (
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
