"use client";

import { createContext, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { ContexteSessionServeur } from "@/lib/use-utilisateur";

/**
 * LA SESSION, DU SERVEUR VERS LES COMPOSANTS — contre le clignotement
 * ====================================================================
 * La mise en page du groupe tatouage (côté serveur) lit le cookie de
 * session et passe l'utilisateur ici. Ce fournisseur le met à
 * disposition de `useUtilisateur` pour le rendu serveur ET
 * l'hydratation : le tout premier écran peint est DÉJÀ le bon —
 * connecté si l'on est connecté — sans un instant d'état déconnecté.
 *
 * `useState` fige la valeur : l'instantané serveur doit être IDENTIQUE
 * à chaque lecture d'un même rendu (exigence de useSyncExternalStore).
 * La suite de la vie de la session (connexion, déconnexion) est
 * l'affaire du magasin client, pas de ce fournisseur.
 */

/**
 * « UN COMPTE S'EST DÉJÀ CONNECTÉ ICI » — CE QUE LE SERVEUR A LU
 * (nº 203-§1a). Le drapeau vit dans un cookie (lib/deja-connecte) : la
 * mise en page le lit et le passe ici, et le bouton « Se connecter » /
 * « Rejoindre » de la barre est juste dès le HTML — plus de libellé
 * qui change sous les yeux après l'hydratation.
 */
export const ContexteDejaConnecteServeur = createContext(false);

export function FournisseurSession({
  utilisateur,
  dejaConnecte = false,
  pretServeur = true,
  children,
}: {
  utilisateur: User | null;
  /** Le drapeau « déjà connecté sur ce navigateur », lu dans le cookie
      par la mise en page. */
  dejaConnecte?: boolean;
  /*  nº 357 — L'ACCUEIL EST PRÉRENDU : la mise en page ne lit plus la
      session au serveur et passe `pretServeur={false}`. L'instantané
      d'hydratation est alors « muet » (personne, pas prêt) — et c'est
      le script d'avant peinture + la garde CSS (`data-compte`,
      globals.css) qui tiennent la promesse de la nº 203 : aucun état
      FAUX peint, jamais. Voir EnTeteTatouage. */
  pretServeur?: boolean;
  children: ReactNode;
}) {
  const [valeur] = useState(() => ({ utilisateur, pret: pretServeur }));
  return (
    <ContexteSessionServeur.Provider value={valeur}>
      <ContexteDejaConnecteServeur.Provider value={dejaConnecte}>
        {children}
      </ContexteDejaConnecteServeur.Provider>
    </ContexteSessionServeur.Provider>
  );
}
