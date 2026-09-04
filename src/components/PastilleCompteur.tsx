"use client";

import { useEffect, useRef, useState } from "react";
import { ECRITURE_COMPTEUR, PASTILLE_COMPTEUR } from "@/config/tatouage";

/**
 * ██ LA PASTILLE « 7/20 » — UNE SEULE RÈGLE, PARTOUT — nº 844 ██
 * ==================================================================
 * CE QUE LE PROPRIÉTAIRE DEMANDE (passe nº 844-§1) : la pastille du
 * compteur obéit désormais À LA MÊME RÈGLE sur toutes les surfaces —
 * INVISIBLE AU REPOS ; elle APPARAÎT dès qu'on fait défiler ; elle
 * S'EFFACE EN FONDU trois secondes après le dernier geste. Cartes du
 * web, cartes du fil au doigt, fiches et vues photo des deux appareils,
 * vue photo ouverte depuis l'onglet Portfolio : une seule écriture,
 * celle-ci.
 *
 * ██ CE QU'ELLE REMPLACE, ET QUI DIVERGEAIT DEPUIS TROIS PASSES ██
 * ------------------------------------------------------------------
 * Trois comportements coexistaient pour un seul objet :
 *  · SUR UNE FICHE (nº 483) : permanente, sur les deux appareils —
 *    « le nombre est-il visible ? OUI, toujours » ;
 *  · SUR UNE CARTE DU WEB (nº 369, reprise nº 839) : absente, puis
 *    rendue visible au SURVOL de la carte, en CSS pur ;
 *  · SUR UNE CARTE DU FIL AU DOIGT (nº 841) : permanente, faute de
 *    survol sur un pointeur grossier.
 * Aucun des trois n'était faux ; ils ne pouvaient simplement plus se
 * lire ensemble. La règle du geste les remplace tous : ELLE EST LA
 * MÊME au doigt et à la souris, parce qu'elle ne parle NI d'appareil NI
 * de survol — elle parle du DÉFILEMENT, qui existe sur les deux (le
 * doigt glisse, la souris clique un chevron), et c'est ce qui permet de
 * n'écrire qu'une fois ce qui s'écrivait trois fois.
 *
 * ██ POURQUOI L'OPACITÉ, ET NON `visibility` ██
 * Le propriétaire demande un FONDU. `visibility` ne se dégrade pas —
 * elle saute (la leçon de la nº 394 sur les flèches). `opacity`
 * s'anime, et elle ne retire rien à la mise en page : la pastille garde
 * sa boîte, rien ne bouge autour d'elle quand elle s'allume.
 * ⚠️ MAIS UNE BOÎTE TRANSPARENTE REÇOIT ENCORE LES CLICS, et c'est
 * précisément ce que `invisible` évitait sur les cartes : au repos, la
 * pastille couvrirait l'angle de la photo sans que rien ne se voie.
 * Elle est donc TRANSPARENTE AUX POINTEURS quand elle dort, et les
 * reçoit quand elle est éveillée — la décision de la nº 367 (« elle
 * n'ouvre jamais la fiche ») ne vaut que pour une pastille visible.
 * ⚠️ UNE SEULE CLASSE PAR PROPRIÉTÉ (piège nº 389) : l'opacité et les
 * pointeurs s'écrivent chacun dans UN ternaire, jamais empilés.
 */

/** Les trois secondes du propriétaire — le même délai que le réveil des
    flèches de la nº 394, et il n'y a pas de raison qu'ils diffèrent. */
export const REPOS_PASTILLE = 3000;

/**
 * ██ LA RÈGLE, EN CROCHET ██
 * ------------------------------------------------------------------
 * `eveillee` dit si la pastille se voit ; `reveiller()` est ce que le
 * porteur appelle À CHAQUE GESTE DE DÉFILEMENT — un glissement du
 * doigt, un chevron, un rond de la frise. Chaque appel REPOUSSE
 * l'extinction : les trois secondes comptent depuis le DERNIER geste,
 * jamais depuis le premier.
 *
 * ⚠️ PAS UN RENDU DE PLUS QU'IL N'EN FAUT : un défilement natif émet
 * des dizaines d'événements par seconde, mais `setEveillee(true)` sur
 * un état DÉJÀ vrai est un non-événement pour React (il abandonne le
 * rendu quand la valeur ne change pas). Le réarmement, lui, ne passe
 * pas par React du tout : c'est une référence, pas un état. Deux rendus
 * par cycle — l'allumage, l'extinction —, jamais davantage.
 * ⚠️ AUCUNE MINUTERIE AU REPOS : elle n'existe qu'entre le premier
 * geste et l'extinction, et chaque geste remplace la précédente
 * (`clearTimeout` puis `setTimeout`) — il n'y en a jamais deux. Le
 * démontage l'efface : rien ne survit à une carte qui sort de l'écran.
 */
export function usePastilleDeDefilement() {
  const [eveillee, setEveillee] = useState(false);
  const minuteur = useRef(0);
  useEffect(() => () => window.clearTimeout(minuteur.current), []);
  return {
    eveillee,
    reveiller: () => {
      setEveillee(true);
      window.clearTimeout(minuteur.current);
      minuteur.current = window.setTimeout(
        () => setEveillee(false),
        REPOS_PASTILLE
      );
    },
  };
}

/**
 * ██ LA PASTILLE ELLE-MÊME ██
 * ------------------------------------------------------------------
 * Elle prend son disque noir et son texte du patron partagé
 * (`PASTILLE_COMPTEUR`, `ECRITURE_COMPTEUR`, config/tatouage) et NE
 * CHOISIT AUCUNE VALEUR de gabarit : l'ancre, le rembourrage et la
 * taille du texte restent au porteur — c'est la règle du site (nº 276),
 * et ce sont eux qui font les trois gabarits de la nº 367 (fiche, carte
 * pleine largeur, carte côte à côte).
 * ⚠️ LES REPÈRES DE BANC DU PORTEUR PASSENT PAR `attributs`, tels
 * qu'ils étaient : `data-role="compteur"` sur une fiche (nº 218-§1),
 * `data-compteur-de-carte` sur une carte du web (nº 839). Le repère
 * COMMUN, lui, est écrit ici une fois pour toutes.
 */
export function PastilleCompteur({
  indice,
  nombre,
  eveillee,
  place,
  ecriture,
  attributs,
}: {
  /** Le rang regardé, à partir de zéro — la pastille affiche `+1`. */
  indice: number;
  nombre: number;
  /** L'état du crochet ci-dessus : le porteur le tient, elle l'affiche. */
  eveillee: boolean;
  /** L'ancre et le rembourrage du porteur (« top-2 right-2 px-2 py-1 »). */
  place: string;
  /** La taille du nombre chez le porteur (« text-[12px] »). */
  ecriture: string;
  /** Les repères de banc du porteur, s'il en a. */
  attributs?: Record<string, string>;
}) {
  return (
    <span
      {...attributs}
      data-compteur-photos=""
      //  L'ÉTAT, LISIBLE PAR LE BANC sans mesurer une opacité calculée.
      data-compteur-eveille={eveillee ? "" : undefined}
      className={`${PASTILLE_COMPTEUR} inline-flex ${place} ${
        eveillee ? "opacity-100" : "opacity-0"
      } ${
        eveillee ? "pointer-events-auto" : "pointer-events-none"
      } transition-opacity duration-300 motion-reduce:transition-none`}
    >
      <span className={`${ECRITURE_COMPTEUR} ${ecriture}`}>
        {indice + 1}/{nombre}
      </span>
    </span>
  );
}
