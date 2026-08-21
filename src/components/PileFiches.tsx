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

  const ouvrir = useCallback<OuvertureFiche>((slug, adresse) => {
    //  LA FICHE COMPLÈTE D'ABORD (le cache de lib/fiche-complete : au
    //  survol du web elle est souvent déjà là) ; l'historique n'est
    //  poussé QUE quand elle a répondu — jamais d'adresse changée pour
    //  une fenêtre qui ne viendra pas.
    void ficheComplete(slug).then((fiche) => {
      if (!fiche) {
        //  Base injoignable ou fiche partie : le lien fait son métier
        //  de lien — la page complète, comme avant cette passe.
        window.location.assign(adresse);
        return;
      }
      //  La position que le gel rendra : celle du CORPS DÉJÀ GELÉ
      //  quand une surface vit dessous (window.scrollY y vaut zéro),
      //  celle de la page sinon. ⚠️ LA LECTURE VIT AVEC LE GEL
      //  (extraite nº 259-§3, lib/gel-du-corps) : deux endroits ne
      //  peuvent plus lire le corps de deux façons.
      const position = positionSousLeGel();
      //  Le drapeau AVANT le pushState : DefilementEnHaut le lit au
      //  moment où l'adresse change (même règle que la mosaïque).
      document.documentElement.setAttribute("data-fenetre-fiche", "1");
      window.history.pushState(
        { fenetreFiche: true },
        "",
        `/tatoueur/${slug}`
      );
      ouvertures.current += 1;
      entreesPoussees.current += 1;
      setPile((courante) => [
        ...courante,
        { fiche, position, ouverture: ouvertures.current },
      ]);
    });
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
          habillageEfface={rang !== visibles.length - 1}
          surFermeture={fermer}
        />
      ))}
    </ContexteOuvertureFiche.Provider>
  );
}
