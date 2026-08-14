"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import {
  lireDisposition,
  souscrireDisposition,
  type DispositionGrille,
} from "@/lib/disposition-grille";
import {
  lirePhototheque,
  souscrirePhototheque,
} from "@/lib/vue-phototheque";

/**
 * L'AFFICHAGE DE LA MOSAÏQUE, DU SERVEUR VERS LES COMPOSANTS
 * ===========================================================
 * (passe nº 203-§1b)
 *
 * L'affichage — la disposition (deux colonnes / une) et le texte des
 * cartes (vue photothèque) — vit dans L'ADRESSE, comme les critères de
 * recherche (règle de la nº 191). Le serveur le lit (page.tsx) et le
 * rend directement ; IndexTatoueurs le fournit ici, et ces deux hooks
 * le donnent à la grille, aux cartes et aux boutons de bascule.
 *
 * POURQUOI UN CONTEXTE, ET PAS LES FONCTIONS « SERVEUR » D'AVANT :
 * l'instantané serveur de useSyncExternalStore est CE QUE LE HTML
 * MONTRE. Une fonction figée (« toujours le défaut ») rendait le HTML
 * faux dès que l'adresse portait un paramètre — et la correction après
 * l'hydratation était très exactement le saut visible de la §1b. La
 * valeur servie vient donc du serveur, par ce contexte ; côté
 * navigateur, la première lecture des magasins relit LA MÊME adresse —
 * les deux disent la même chose, rien ne se corrige à l'écran.
 */
export const ContexteAffichageServi = createContext<{
  disposition: DispositionGrille;
  phototheque: boolean;
}>({ disposition: "deux", phototheque: false });

/**
 * LE FOURNISSEUR, POUR UNE PAGE QUI N'EST PAS LA MOSAÏQUE (nº 257-§2)
 * ------------------------------------------------------------------
 * « Ma sélection » montre LES MÊMES CARTES (nº 249-§4) et suit LA MÊME
 * mise en page (nº 255-§4), mais elle n'a pas d'IndexTatoueurs pour
 * porter l'instantané servi : ses cartes et l'icône de la barre
 * naissaient donc au défaut, puis se corrigeaient à l'hydratation —
 * le saut de page du §2, à l'identique.
 * Ce fournisseur est POSÉ PAR LA PAGE SERVEUR, autour de la barre ET
 * du contenu : un composant client ne peut pas être monté depuis un
 * composant serveur autrement (un `Provider` n'existe pas côté
 * serveur). Il ne décide de rien — il transmet ce que le cookie a dit.
 */
export function FournisseurAffichageServi({
  phototheque,
  children,
}: {
  phototheque: boolean;
  children: React.ReactNode;
}) {
  const servi = useMemo(
    () => ({ disposition: "deux" as DispositionGrille, phototheque }),
    [phototheque]
  );
  return (
    <ContexteAffichageServi.Provider value={servi}>
      {children}
    </ContexteAffichageServi.Provider>
  );
}

/** La disposition de la mosaïque — celle de l'adresse. */
export function useDispositionGrille(): DispositionGrille {
  const servi = useContext(ContexteAffichageServi);
  return useSyncExternalStore(
    souscrireDisposition,
    lireDisposition,
    () => servi.disposition
  );
}

/** La vue photothèque (texte des cartes masqué) — celle de l'adresse. */
export function useVuePhototheque(): boolean {
  const servi = useContext(ContexteAffichageServi);
  return useSyncExternalStore(
    souscrirePhototheque,
    lirePhototheque,
    () => servi.phototheque
  );
}
