"use client";

import { useEffect } from "react";
import { useUtilisateur } from "@/lib/use-utilisateur";
import { chargerLesMiens, oublierLesMiens } from "@/lib/favoris-yokofolio";

/**
 * ALLUMER LES CŒURS DÉJÀ POSÉS
 * =============================
 * Il n'affiche RIEN. Il demande une fois, par page, la liste de ce que
 * ce compte a enregistré — juste des identifiants — et la donne au
 * magasin partagé. Tous les cœurs de la mosaïque, des fiches et des
 * fenêtres s'allument alors d'un coup.
 *
 * POURQUOI UN COMPOSANT, ET PAS UN APPEL DANS CHAQUE BOUTON : parce
 * qu'une mosaïque de vingt-quatre cartes ferait vingt-quatre demandes
 * de la même liste. Une seule suffit, et elle vit ici.
 *
 * ⚠️ IL SUIT LES CHANGEMENTS DE SESSION. À la connexion il charge ; à
 * la déconnexion il OUBLIE — sans quoi le visiteur suivant sur ce
 * navigateur verrait les cœurs du compte précédent.
 */
export function ChargeurFavoris() {
  const { utilisateur, pret } = useUtilisateur();
  const id = utilisateur?.id ?? null;

  useEffect(() => {
    if (!pret) return;
    if (id) {
      chargerLesMiens();
      return;
    }
    oublierLesMiens();
  }, [pret, id]);

  return null;
}
