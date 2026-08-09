"use client";

import { useState, type ReactNode } from "react";
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
export function FournisseurSession({
  utilisateur,
  children,
}: {
  utilisateur: User | null;
  children: ReactNode;
}) {
  const [valeur] = useState(() => ({ utilisateur, pret: true }));
  return (
    <ContexteSessionServeur.Provider value={valeur}>
      {children}
    </ContexteSessionServeur.Provider>
  );
}
