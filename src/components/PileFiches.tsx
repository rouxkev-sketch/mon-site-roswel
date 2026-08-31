"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { positionSousLeGel } from "@/lib/gel-du-corps";
import { FenetreFiche } from "@/components/FenetreFiche";
import { ficheComplete } from "@/lib/fiche-complete";
//  §1 (nº 438) — la fermeture passe par history.back() : elle se
//  déclare, pour que le rattrapage du filet ne la prenne jamais pour
//  un atterrissage accidentel au fond de la pile.
import { annoncerRepriseDuSite } from "@/lib/navigation-session";
//  §2 (nº 587) — le nom du paramètre d'onglet de « Ma sélection », lu
//  là où il est défini : la pile ne le réécrit pas à la main.
import { PARAM_SELECTION } from "@/lib/filtres-selection";
import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * LA PILE DES FICHES SUPERPOSÉES (passe nº 226-§5)
 * ==================================================================
 * §1 (nº 318) — LA RÈGLE DES FENÊTRES EN WEB, ÉCRITE UNE FOIS POUR
 * TOUTES. C'est ici qu'elle décide, et AUCUNE PASSE FUTURE NE DOIT LA
 * CONTREDIRE — décision du propriétaire, passe nº 318 :
 *
 *   EN VERSION WEB, LE FORMAT PLEIN ÉCRAN EST RÉSERVÉ À DEUX CAS, ET
 *   À DEUX SEULEMENT :
 *     1. « Mon portfolio », dans le compte du propriétaire de la
 *        fiche (c'est l'aperçu — le drapeau `actif={false}` de cette
 *        pile : on n'empile rien par-dessus son propre formulaire) ;
 *     2. une fiche ouverte depuis un LIEN DE PARTAGE, c'est-à-dire
 *        par quelqu'un qui arrive de l'extérieur (l'adresse directe
 *        /tatoueur/nom, rendue en page complète par le serveur — le
 *        référencement ne voit qu'elle).
 *   TOUT LE RESTE S'OUVRE EN FENÊTRE CENTRÉE SUPERPOSÉE : les cartes
 *   de la mosaïque, celles de « Ma sélection », et TOUT lien interne
 *   d'une fiche vers une autre — même quand on lit déjà une fiche en
 *   fenêtre : le lien s'empile, il ne sort JAMAIS de la fenêtre.
 *
 *   Toute surface du web qui montre une fiche en fenêtre doit donc
 *   être enveloppée par CETTE pile — c'est elle qui tient la règle.
 *   SMARTPHONE : rien de tout cela ; une fiche y est une page.
 * ==================================================================
 * DEPUIS UNE FICHE, cliquer un membre de l'équipe ou le salon d'un
 * profil ouvrait une NOUVELLE PAGE : la fiche qu'on lisait était
 * perdue, position de défilement comprise. Ces liens ouvrent désormais
 * une FENÊTRE SUPERPOSÉE — sur le web comme sur mobile — et le retour
 * rend la fiche d'en dessous, exactement là où on l'avait laissée.
 *
 * ⚠️ C'EST LE MÉCANISME EXISTANT, PAS UN SECOND. La fenêtre est
 * `FenetreFiche` — celle-là même que la mosaïque ouvre — qui monte
 * `ContenuFiche`, l'unique contenu de fiche du site. Ce fichier
 * n'ajoute que la PILE : qui est ouvert au-dessus de qui.
 *
 * L'ADRESSE DÉCIDE TOUT, comme pour la fenêtre de la mosaïque :
 *  · OUVRIR pousse UNE entrée d'historique (`pushState` vers
 *    /tatoueur/nom — Next sait lire ces pushState natifs) et empile
 *    une fenêtre ; l'historique ne grossit jamais de plus d'une
 *    entrée par ouverture ;
 *  · FERMER (croix, voile, Échap), c'est `history.back()` : le
 *    navigateur retire UNE entrée, l'adresse redevient celle d'en
 *    dessous, et la pile se défait d'un cran — le bouton « précédent »
 *    referme donc naturellement, un cran à la fois ;
 *  · un empilement de PLUSIEURS fiches est permis : chaque retour ne
 *    remonte que d'un cran ;
 *  · l'adresse directe de chacune de ces fiches continue de rendre
 *    une PAGE complète côté serveur — le référencement ne voit jamais
 *    la fenêtre (les liens restent de vrais liens : clic du milieu,
 *    Ctrl+clic et moteurs vont à la page).
 *
 * LA POSITION DE DÉFILEMENT : chaque fenêtre gèle le corps du document
 * (voir FenetreFiche) et le rend à sa fermeture. Le gel est COMPTÉ —
 * seule la première fenêtre gèle, seule la dernière à partir dégèle :
 * fermer une fenêtre du dessus ne rend jamais le défilement tant
 * qu'une autre vit dessous.
 *
 * QUI FOURNIT LA PILE ? Les deux racines qui montrent des fiches :
 * la PAGE de fiche (FicheTatoueur) et la MOSAÏQUE (GrilleTatoueurs,
 * dont la fenêtre de base garde sa mécanique propre — reprise après
 * rechargement, clé d'ouverture — inchangée). Le fournisseur enveloppe
 * leurs enfants : les liens de `BlocLieux` le trouvent par le
 * contexte, y compris depuis une fenêtre déjà superposée — c'est ce
 * qui permet d'empiler.
 */

type OuvertureFiche = (slug: string, adresse: string) => void;

const ContexteOuvertureFiche = createContext<OuvertureFiche | null>(null);

/** La main pour ouvrir une fiche PAR-DESSUS — `null` quand aucune
    pile n'enveloppe (l'aperçu « Ma fiche ») : le lien navigue alors
    comme un lien. */
export function useOuvertureFiche(): OuvertureFiche | null {
  return useContext(ContexteOuvertureFiche);
}

/**
 * LA LARGEUR À PARTIR DE LAQUELLE UNE FICHE LIÉE S'OUVRE EN FENÊTRE
 * ==================================================================
 * (passe nº 230-§3)
 *
 * LE RELEVÉ : sur smartphone, ouvrir une autre adresse ou un résident
 * depuis une fiche donnait une fenêtre superposée, comme sur le web.
 * Ce n'est pas ce qu'il faut — au doigt, une fiche est une FICHE : la
 * présentation normale des fiches sur smartphone, pleine page.
 *
 * 1024 px, ET CE N'EST PAS UN NOMBRE DE PLUS : c'est le point où
 * `FenetreFiche` passe déjà de ses deux colonnes à une seule (voir
 * ses classes `lg:`). En dessous, la fenêtre n'apportait plus qu'un
 * voile par-dessus une pleine page — autant servir la page.
 *
 * ⚠️ LA LARGEUR NE DÉCIDE QUE DE L'HABILLAGE. L'adresse reste la
 * seule vérité (règle de la nº 191) : c'est elle qui dit quelle fiche
 * est montrée. Une entrée d'historique par ouverture, un cran par
 * retour — au doigt c'est `<Link>` qui la pousse, sur le web c'est le
 * `pushState` de la pile. Le mécanisme est le même vu de
 * l'historique.
 *
 * ⚠️ ET ELLE SE LIT AU MOMENT DU CLIC, jamais au rendu : une valeur
 * lue au rendu serait fausse au premier rendu du serveur (qui ne
 * connaît aucune largeur) et ferait diverger l'hydratation.
 */
export const LARGEUR_FENETRE_SUPERPOSEE = 1024;

export function laLargeurVeutUneFenetre(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth >= LARGEUR_FENETRE_SUPERPOSEE;
}

/** Une fenêtre de la pile : la fiche, la position que son gel devra
    rendre, et un numéro d'ouverture (la clé — chaque ouverture est une
    fenêtre NEUVE, la règle de la nº 220-§3). */
type EntreePile = {
  fiche: Tatoueur;
  position: number;
  ouverture: number;
};

/**
 * ██ §1 (nº 746) — L'OUVERTURE EN PRÉPARATION ██
 * ==================================================================
 * CE QUI SE PASSAIT, mesuré au banc sur base endormie (4 s par
 * lecture) : un lien interne cliqué N'OUVRAIT RIEN pendant 10 à 25
 * secondes — la pile attendait la fiche complète AVANT de montrer
 * quoi que ce soit. Devant un lien muet, on re-clique : chaque clic
 * relançait `ouvrir`, tous les appels s'accrochaient à la même
 * demande, et sa résolution poussait D'UN COUP autant d'entrées
 * d'historique et de fenêtres jumelles qu'il y avait eu de clics.
 * C'est la pile qui « se fige » : des liens qui clignotent sans
 * ouvrir, puis un historique encombré de doublons.
 * LA RÈGLE, DÉSORMAIS : le clic ouvre TOUT DE SUITE une fenêtre
 * d'attente (l'habillage neutre de la nº 745 — même écriture), SANS
 * entrée d'historique : une préparation est un état d'affichage, pas
 * une étape (règle 332-§1 : une entrée par ouverture RÉELLE). À
 * l'arrivée de la fiche : l'entrée est poussée, la fenêtre réelle
 * remplace l'attente — en un seul rendu. À l'échec : le lien fait son
 * métier de lien (la page complète), comme avant.
 * ⚠️ LA GARDE ANTI-DOUBLON EST LÀ : re-cliquer le MÊME lien pendant
 * la préparation ne fait RIEN (elle est déjà en route) ; cliquer un
 * AUTRE lien remplace la préparation, et la réponse de l'ancienne,
 * quand elle arrive, est ignorée — le drapeau vit PAR PRÉPARATION
 * (le slug fait foi), jamais en global.
 * ⚠️ ELLE S'ANNULE D'UN GESTE : croix, voile ou Échap sur la fenêtre
 * d'attente la referment SANS `history.back()` — rien n'a été poussé.
 */
type PreparationOuverture = {
  slug: string;
  adresse: string;
  position: number;
  ouverture: number;
};

/** La fiche « coquille » de la fenêtre d'attente : juste de quoi
    monter l'enveloppe (la colonne montre l'habillage, jamais ces
    champs vides). */
function coquilleDAttente(slug: string): Tatoueur {
  return {
    id: `attente-${slug}`,
    nom: "",
    slug,
    ville_nom: "",
    ville_slug: "",
    latitude: 0,
    longitude: 0,
    styles: [],
    lien_instagram: "",
    photo_principale: "",
    photos_styles: {},
    photos: [],
    publie: true,
  };
}

export function PileFiches({
  actif = true,
  voileDejaPose = false,
  surProfondeur,
  children,
}: {
  /** Faux dans l'aperçu « Ma fiche » : on n'empile rien par-dessus un
      formulaire — les liens restent des liens. */
  actif?: boolean;
  /**
   * §2 (nº 320) — Y A-T-IL DÉJÀ UN VOILE SOUS CETTE PILE ?
   * ------------------------------------------------------------------
   * VRAI sur les surfaces qui montent elles-mêmes une FENÊTRE DE BASE :
   * la mosaïque et « Ma sélection » — leur fenêtre est la première, et
   * c'est elle qui peint. La pile n'en rajoute alors AUCUN.
   * FAUX sur une PAGE de fiche : rien ne voile dessous, c'est donc la
   * PREMIÈRE fenêtre de la pile qui peint.
   * ⚠️ POURQUOI UN DRAPEAU, ET NON UN COMPTEUR PARTAGÉ. Un compteur de
   * fenêtres montées ne se lit qu'APRÈS le rendu (un effet) : la
   * première fenêtre s'afficherait un instant sans voile, puis il
   * apparaîtrait — un clignotement à chaque ouverture. Ici la réponse
   * est connue AVANT le premier rendu, parce qu'elle ne dépend que de
   * la surface, jamais de l'instant.
   * ⚠️ ET ELLE NE PEUT PAS SE DÉSYNCHRONISER : une fenêtre de la pile
   * ne s'ouvre QUE depuis une fiche déjà affichée (c'est
   * `useOuvertureFiche`, consommé par BlocLieux, qui ne vit que dans
   * une fiche). Là où la base existe, elle est donc toujours ouverte
   * sous la pile.
   */
  voileDejaPose?: boolean;
  /** La profondeur de la pile, remontée à l'enveloppe qui la veut :
      la mosaïque s'en sert pour garder sa fenêtre de base VISIBLE
      sous les fiches empilées (son adresse ne correspond plus, mais
      elle n'est pas fermée pour autant). */
  surProfondeur?: (profondeur: number) => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [pile, setPile] = useState<EntreePile[]>([]);
  /** §1 (nº 746) — L'OUVERTURE EN PRÉPARATION (une seule à la fois :
      la dernière demandée). L'état rend la fenêtre d'attente ; la
      référence est la vérité que le `.then` consulte — un état lu
      dans une fermeture serait figé au rendu du clic. */
  const [preparation, setPreparation] = useState<PreparationOuverture | null>(
    null
  );
  const preparationRef = useRef<PreparationOuverture | null>(null);
  const ouvertures = useRef(0);
  /** §5 (nº 328) — COMBIEN D'ENTRÉES CETTE PILE A POUSSÉES. Un
      COMPTEUR et non un drapeau : les fenêtres s'empilent, et
      chaque fermeture ne rend qu'un cran (point 7 de la règle —
      voir `fermer`). */
  const entreesPoussees = useRef(0);

  /**
   * LA PILE SUIT L'ADRESSE — ajustée PENDANT LE RENDU, jamais dans un
   * effet (le motif « ajuster un état pendant le rendu » de React,
   * celui d'IndexTatoueurs) : chaque cran d'adresse en moins défait un
   * cran de pile, sans clignotement. Un retour de deux crans d'un coup
   * (menu de l'historique) en défait deux ; une navigation ailleurs
   * (fil d'Ariane, badge de style) vide tout.
   *
   * ⚠️ LA VÉRITÉ EST `location.pathname`, PAS `usePathname` — mesuré :
   * le routeur traite un pushState natif EN TRANSITION, et
   * `usePathname` reste donc EN RETARD d'un rendu au moment où la pile
   * vient de s'allonger. Comparée à lui, la fenêtre tout juste ouverte
   * était défaite dans le même souffle — on ne la voyait jamais.
   * `location`, lui, change dans l'instant du pushState comme du
   * retour ; `usePathname` ne sert plus que de RÉVEIL : c'est son
   * changement qui re-rend ce composant.
   */
  const cheminReel =
    typeof window === "undefined" ? pathname : window.location.pathname;
  let visibles = pile;
  while (
    visibles.length > 0 &&
    cheminReel !== `/tatoueur/${visibles[visibles.length - 1].fiche.slug}`
  ) {
    visibles = visibles.slice(0, -1);
  }
  if (visibles.length !== pile.length) setPile(visibles);

  /** L'enveloppe est prévenue de la profondeur — après le rendu, une
      simple remontée de valeur. */
  const profondeur = visibles.length;
  useEffect(() => {
    surProfondeur?.(profondeur);
  }, [profondeur, surProfondeur]);

  /**
   * ██ §2 (nº 589) — LA PROFONDEUR EST AUSSI ANNONCÉE DANS LE GESTE ██
   * ==================================================================
   * LE DÉFAUT, RELEVÉ PAR LE PROPRIÉTAIRE : sur « Ma sélection », ouvrir
   * une PREMIÈRE fiche allait bien ; en ouvrir une SECONDE depuis elle
   * faisait CLIGNOTER LE FOND — le voile sautait, puis la nouvelle
   * fenêtre s'ouvrait. La troisième et les suivantes, sans défaut.
   * LA CAUSE, ET ELLE TIENT AU « SEULEMENT LA DEUXIÈME » : la surface
   * garde sa fenêtre de base visible tant que L'ADRESSE EST LA SIENNE
   * **OU** que la pile n'est pas vide (`profondeurPile > 0`, la même
   * ligne dans la mosaïque et dans « Ma sélection »). Au passage de UN
   * à DEUX, ces deux conditions changent — mais PAS AU MÊME MOMENT :
   * l'adresse bascule dans l'instant du `pushState`, tandis que la
   * profondeur ne remontait que par un EFFET, donc après le rendu. Il
   * s'intercalait un rendu où l'adresse n'était plus celle de la
   * fenêtre de base et où la pile paraissait encore vide : la fenêtre
   * de base se croyait fermée, son voile disparaissait — et revenait au
   * rendu suivant. Au passage de DEUX à TROIS, la profondeur vaut déjà
   * un : plus rien ne bascule, et c'est pourquoi seul le deuxième
   * clignotait.
   * LE REMÈDE : la profondeur est annoncée DANS LE GESTE, à côté du
   * `setPile` qui la fait grandir. React groupe les deux poseurs d'état
   * en un seul rendu — l'enveloppe voit donc la pile grandir et
   * l'adresse changer ensemble, et plus aucun rendu ne peut les voir en
   * désaccord.
   * ⚠️ L'EFFET RESTE, ET IL SERT TOUJOURS : c'est lui qui annonce la
   * DÉCROISSANCE (une fermeture, un retour, un vidage). Dans ce sens-là
   * il n'y a rien à devancer — une profondeur qui reste haute un rendu
   * de trop ne fait que GARDER la fenêtre de base visible, ce qui est
   * précisément ce qu'on veut. Et réannoncer la même valeur ne coûte
   * aucun rendu.
   * ⚠️ RIEN D'AUTRE NE BOUGE : ni l'adresse poussée (une entrée par
   * ouverture, 332-§1 et §4), ni le paramètre d'onglet qu'elle emporte
   * depuis la nº 587, ni le voile, ni le gel compté.
   */
  const profondeurConnue = useRef(0);
  profondeurConnue.current = profondeur;
  //  La main tendue par l'enveloppe, lisible depuis `ouvrir` sans la
  //  faire entrer dans ses dépendances (les deux surfaces passent leur
  //  poseur d'état, que React garantit stable).
  const annoncer = useRef(surProfondeur);
  annoncer.current = surProfondeur;

  const ouvrir = useCallback<OuvertureFiche>((slug, adresse) => {
    /*  §1 (nº 746) — LA GARDE ANTI-RE-CLIC : cette fiche est déjà en
        préparation, le clic n'a rien de plus à demander. C'est elle
        qui empêchait N clics d'impatience de devenir N fenêtres
        jumelles et N entrées d'historique à la résolution. */
    if (preparationRef.current?.slug === slug) return;
    /*  §1 (nº 746) — LA RÉACTION EST IMMÉDIATE : la fenêtre d'attente
        se montre au clic (habillage nº 745), SANS entrée d'historique.
        La position est capturée ICI, au geste — c'est elle que le gel
        de la fenêtre (d'attente puis réelle) devra rendre. */
    ouvertures.current += 1;
    const preparation = {
      slug,
      adresse,
      position: positionSousLeGel(),
      ouverture: ouvertures.current,
    };
    preparationRef.current = preparation;
    setPreparation(preparation);
    //  LA FICHE COMPLÈTE (le cache de lib/fiche-complete : au survol
    //  du web elle est souvent déjà là) ; l'historique n'est poussé
    //  QUE quand elle a répondu — jamais d'adresse changée pour une
    //  fenêtre qui ne viendra pas.
    void ficheComplete(slug).then((fiche) => {
      /*  §1 (nº 746) — LA RÉPONSE D'UNE PRÉPARATION ABANDONNÉE SE
          TAIT : refermée d'une croix, ou remplacée par un clic vers
          une autre fiche. Le drapeau vit par préparation (le slug
          fait foi), jamais en global — c'est ce qui interdit à la
          réponse d'une fiche de parler pour une autre. */
      if (preparationRef.current?.slug !== slug) return;
      preparationRef.current = null;
      if (!fiche) {
        //  Base injoignable ou fiche partie : le lien fait son métier
        //  de lien — la page complète, comme avant cette passe.
        window.location.assign(adresse);
        return;
      }
      //  La position que le gel rendra : celle capturée AU CLIC (le
      //  corps est gelé depuis par la fenêtre d'attente — la lecture
      //  d'ici rendrait zéro). ⚠️ LA LECTURE VIT AVEC LE GEL
      //  (extraite nº 259-§3, lib/gel-du-corps) : deux endroits ne
      //  peuvent plus lire le corps de deux façons.
      const position = preparation.position;
      //  Le drapeau AVANT le pushState : DefilementEnHaut le lit au
      //  moment où l'adresse change (même règle que la mosaïque).
      document.documentElement.setAttribute("data-fenetre-fiche", "1");
      /**
       * ██ §2 (nº 587) — L'ADRESSE EMPORTE L'ONGLET DE LA PAGE DE FOND ██
       * ==================================================================
       * LE DÉFAUT : sur « Ma sélection » → Portfolios, ouvrir une fiche
       * puis, DEPUIS elle, un lieu ou un membre d'équipe faisait
       * BASCULER LA PAGE DE FOND sur l'onglet Favoris.
       * LA CAUSE, ET C'EST LE JUMEAU EXACT DU §1 DE LA nº 314 : cette
       * adresse-ci était écrite SANS AUCUNE REQUÊTE. Or l'onglet de
       * cette page-là vit dans la requête (`?selection=suivis:…`, lu
       * par `lireSelection` à travers `lireRequeteCourante`, qui rend
       * `window.location.search`). En l'effaçant, on faisait retomber
       * la page sur son choix par défaut — « Mes favoris ». La nº 314
       * avait réglé le MÊME oubli dans `PageFavoris.ouvrirLaFiche` ; il
       * restait ici, sur le chemin de la PILE.
       * ⚠️ ON N'EMPORTE QUE CE PARAMÈTRE-LÀ, ET SÛREMENT PAS TOUTE LA
       * REQUÊTE. Cette pile sert AUSSI la mosaïque et les fiches, dont
       * l'adresse porte la SÉRIE regardée (`?style=…&photo=…`) : la
       * recopier ferait hériter à la fiche suivante une photo qui n'est
       * pas la sienne, qu'un rechargement irait ensuite chercher.
       * `selection`, lui, n'appartient qu'à « Ma sélection » et n'est lu
       * nulle part ailleurs — le transporter ne peut donc rien changer
       * d'autre que ce qu'on veut réparer.
       * ⚠️ L'HISTORIQUE NE BOUGE PAS : c'est toujours UNE entrée par
       * ouverture, et le retour en défait toujours une (332-§1 et §4).
       * Seule l'adresse écrite dans cette entrée gagne son paramètre.
       */
      const selection = new URLSearchParams(window.location.search).get(
        PARAM_SELECTION
      );
      window.history.pushState(
        { fenetreFiche: true },
        "",
        `/tatoueur/${slug}${
          selection
            ? `?${new URLSearchParams({ [PARAM_SELECTION]: selection })}`
            : ""
        }`
      );
      entreesPoussees.current += 1;
      setPile((courante) => [
        ...courante,
        //  §1 (nº 746) — le numéro d'ouverture est celui de la
        //  préparation : la fenêtre réelle CONTINUE la fenêtre
        //  d'attente, elle n'en est pas une seconde.
        { fiche, position, ouverture: preparation.ouverture },
      ]);
      //  §1 (nº 746) — l'attente s'efface DANS LE MÊME geste que la
      //  pile grandit : un seul rendu, la fenêtre réelle remplace la
      //  fenêtre d'attente sans clignotement.
      setPreparation(null);
      //  §2 (nº 589) — DANS LE MÊME GESTE : voir la note du compteur,
      //  plus haut. Les deux poseurs d'état partent ensemble, donc un
      //  seul rendu — l'enveloppe ne voit jamais l'adresse changée et
      //  la pile encore vide.
      annoncer.current?.(profondeurConnue.current + 1);
    });
  }, []);

  /** §1 (nº 746) — REFERMER LA FENÊTRE D'ATTENTE (croix, voile,
      Échap) : rien n'a été poussé, il n'y a donc RIEN à consommer
      dans l'historique — on efface la préparation, c'est tout. La
      réponse en vol, quand elle arrivera, se taira (le drapeau ne
      porte plus son slug). */
  const annulerLaPreparation = useCallback(() => {
    preparationRef.current = null;
    setPreparation(null);
  }, []);

  /** Fermer = machine arrière : l'adresse recule d'un cran, et le
      rendu ci-dessus défait le cran de pile correspondant.
      §5 (nº 328) — ET SEULEMENT SI CETTE PILE A POUSSÉ (point 7 de la
      règle) : au doigt, un lien interne NAVIGUE (voir BlocLieux, qui
      s'arrête sous 1024 px) et cette pile n'a rien empilé — une
      fermeture y consommerait l'entrée du dessous. Le compteur répond
      à « ai-je poussé ? », la seule question qui vaille. */
  const fermer = useCallback(() => {
    if (entreesPoussees.current <= 0) return;
    entreesPoussees.current -= 1;
    //  §1 (nº 438) — reprise déclarée AVANT le back : le rattrapage du
    //  filet la lit au popstate et se tait.
    annoncerRepriseDuSite();
    window.history.back();
  }, []);

  if (!actif) return <>{children}</>;

  return (
    <ContexteOuvertureFiche.Provider value={ouvrir}>
      {children}
      {/*  LES FENÊTRES EMPILÉES — dans l'ordre d'ouverture : la
           dernière du tableau est la dernière du document, donc
           au-dessus (même z-index, l'ordre du flux tranche).
           §2 (nº 320) — UN SEUL VOILE POUR TOUTE LA PILE, et il est
           peint TOUT EN BAS. La toute première fenêtre superposée le
           pose ; aucune de celles qui montent par-dessus n'en ajoute.
           Sur la mosaïque et sur « Ma sélection », la fenêtre de base
           l'a déjà posé (`voileDejaPose`) : la pile n'en pose alors
           aucun, pas même sur son premier cran. */}
      {visibles.map((entree, rang) => (
        <FenetreFiche
          key={`${entree.fiche.id}-${entree.ouverture}`}
          tatoueur={entree.fiche}
          positionGrille={entree.position}
          avecVoile={rang === 0 && !voileDejaPose}
          //  §1 (nº 440) — seul le SOMMET de la pile garde son fil
          //  d'Ariane et son titre : toute fenêtre recouverte les
          //  efface, et les retrouve au rendu qui suit la fermeture
          //  de celle du dessus (la position dans la pile fait foi).
          //  §1 (nº 746) — et une ouverture en préparation EST le
          //  sommet : tout ce qui vit dessous s'efface.
          habillageEfface={
            rang !== visibles.length - 1 || preparation !== null
          }
          //  §1 (nº 776) — une fenêtre réelle de cette pile CONTINUE
          //  la fenêtre d'attente qui l'a précédée (toute ouverture
          //  passe par la préparation, nº 746) : l'entrée s'est déjà
          //  animée au clic. La rejouer rendait la fenêtre transparente
          //  200 ms — et l'on voyait la photo de la fiche du dessous.
          entreeAnimee={false}
          surFermeture={fermer}
        />
      ))}
      {/*  §1 (nº 746) — LA FENÊTRE D'ATTENTE : montée AU CLIC, sans
           entrée d'historique. La coquille ne montre rien d'elle-même
           (la colonne est couverte par l'habillage nº 745, le cadre
           photo reste sombre) ; la fenêtre réelle la remplace dans le
           rendu où la fiche arrive. Sa croix ANNULE la préparation —
           jamais de `history.back()`, rien n'a été poussé. */}
      {preparation && (
        <FenetreFiche
          key={`attente-${preparation.slug}-${preparation.ouverture}`}
          tatoueur={coquilleDAttente(preparation.slug)}
          positionGrille={preparation.position}
          avecVoile={visibles.length === 0 && !voileDejaPose}
          contenuEnAttente
          //  Le fil d'Ariane lit le nom de la fiche — la coquille n'en
          //  a pas : « Accueil › (rien) » serait un fil menteur. On
          //  l'efface le temps de l'attente, comme sous une pile.
          habillageEfface
          surFermeture={annulerLaPreparation}
        />
      )}
    </ContexteOuvertureFiche.Provider>
  );
}
