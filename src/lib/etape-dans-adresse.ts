"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * UN ÉTAT QUI VIT DANS L'ADRESSE, ET QUI COMPTE COMME UN PAS
 * ==================================================================
 * (passe nº 332-§4 — le C-6 de l'inventaire nº 327)
 *
 * C'est le POINT 5 de la règle de navigation (lib/navigation-session) :
 * l'état d'un écran vit dans l'adresse, pas dans React. Deux états n'y
 * étaient toujours pas — la SECTION d'administration et l'ÉTAPE d'un
 * formulaire. Résultat : on passe d'une section à l'autre, et le
 * retour SORT de l'administration au lieu de ramener à la précédente.
 *
 * ⚠️ CE N'EST PAS LA RÈGLE DE L'ONGLET PROFIL / PORTFOLIO, ET C'EST LE
 * POINT LE PLUS IMPORTANT DE CE MODULE. L'onglet d'une fiche
 * REMPLACE son entrée (`replaceState`) : changer d'onglet n'est pas un
 * déplacement, et le retour doit continuer de quitter la fiche d'un
 * seul appui. ICI, c'est l'inverse et le propriétaire l'a tranché à la
 * nº 332 : passer d'une section à l'autre EST un vrai déplacement, et
 * personne ne veut qu'un retour abandonne un formulaire à moitié
 * rempli. Chaque pas POSE donc une entrée (`pushState`), et le retour
 * ramène au pas précédent.
 *
 * CE QU'IL GARANTIT, ET QUI EST DEMANDÉ :
 *  · LE RETOUR ramène à la section ou à l'étape précédente ;
 *  · LE PAS EN AVANT la retrouve — l'adresse de l'étape la porte ;
 *  · UN RECHARGEMENT tombe sur la bonne : l'adresse fait foi, elle est
 *    lue à l'arrivée comme à chaque `popstate`.
 *
 * ⚠️ L'ÉTAT DE L'ÉTAPE EST RECOPIÉ, jamais écrasé : les marques du
 * site y vivent (le filet `retourReconstruit`, l'étape d'une surface
 * refermable), et les jeter casserait leurs comptes.
 *
 * ⚠️ AUCUNE ENTRÉE POUR UN PAS QUI N'EN EST PAS UN : reposer la valeur
 * courante ne pousse rien. Sans cette garde, un rendu de plus suffirait
 * à empiler une étape identique.
 *
 * ⚠️ ET ON NE PASSE PAS PAR LE ROUTEUR DE NEXT : `pushState` natif
 * suffit, le chemin ne change pas — seule la requête bouge. Le routeur
 * sait lire ces étapes (c'est ce que fait déjà toute la navigation
 * interne du site), et l'on évite un aller-retour serveur pour un
 * changement d'onglet local.
 */
export function useEtapeDansLAdresse<T extends string>(
  /** Le nom du paramètre — « section », « etape »… */
  parametre: string,
  /** La valeur d'arrivée, quand l'adresse ne dit rien. */
  parDefaut: T,
  /** Ce qu'on accepte : rend la valeur retenue, ou `null` si inconnue.
      Une valeur inconnue retombe sur `parDefaut` — l'écran est alors
      celui de l'arrivée, jamais un écran vide. */
  reconnue: (brut: string) => T | null
): [T, (suivante: T) => void] {
  const lireLAdresse = useCallback((): T => {
    if (typeof window === "undefined") return parDefaut;
    const brut = new URLSearchParams(window.location.search).get(parametre);
    return (brut && reconnue(brut)) || parDefaut;
  }, [parametre, parDefaut, reconnue]);

  /*  ⚠️ LE SERVEUR NE CONNAÎT PAS L'ADRESSE DU NAVIGATEUR au premier
      rendu : on part du défaut, et l'on se réaligne PENDANT LE RENDU
      (le motif de React, celui que ContenuFiche emploie déjà) — jamais
      dans un effet, qui rendrait la page une fois avec le mauvais
      écran avant de la corriger. */
  const [valeur, setValeur] = useState<T>(parDefaut);
  const [requeteLue, setRequeteLue] = useState<string | null>(null);
  if (typeof window !== "undefined") {
    const requete = window.location.search;
    if (requeteLue !== requete) {
      setRequeteLue(requete);
      const voulue = lireLAdresse();
      if (voulue !== valeur) setValeur(voulue);
    }
  }

  /*  LE RETOUR ET LE PAS EN AVANT : l'adresse a changé sans que le
      chemin bouge, donc React n'a rien à rendre de lui-même. On relit
      l'adresse — elle fait foi. */
  useEffect(() => {
    const auRetour = () => {
      setRequeteLue(window.location.search);
      setValeur(lireLAdresse());
    };
    window.addEventListener("popstate", auRetour);
    return () => window.removeEventListener("popstate", auRetour);
  }, [lireLAdresse]);

  const poser = useCallback(
    (suivante: T) => {
      if (typeof window === "undefined") return;
      if (suivante === lireLAdresse()) {
        //  Le pas n'en est pas un : on ne pousse rien, mais l'écran
        //  suit quand même (un premier choix depuis le défaut).
        setValeur(suivante);
        return;
      }
      const params = new URLSearchParams(window.location.search);
      if (suivante === parDefaut) params.delete(parametre);
      else params.set(parametre, suivante);
      const requete = params.toString();
      window.history.pushState(
        { ...((window.history.state as object | null) ?? {}) },
        "",
        window.location.pathname + (requete ? `?${requete}` : "")
      );
      setRequeteLue(window.location.search);
      setValeur(suivante);
    },
    [parametre, parDefaut, lireLAdresse]
  );

  return [valeur, poser];
}
