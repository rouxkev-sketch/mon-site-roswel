"use client";

import { useEffect } from "react";

/**
 * LE RECHARGEMENT D'UNE FENÊTRE DE FICHE (web)
 * =============================================
 * Quand la fenêtre superposée est ouverte, l'adresse est déjà
 * /tatoueur/nom — un RECHARGEMENT sert donc la page de fiche complète,
 * et la recherche restée derrière serait perdue (retour arrière
 * compris : il renvoyait à l'accueil nu).
 *
 * La grille (GrilleTatoueurs) note donc dans sessionStorage, à chaque
 * ouverture de fenêtre, D'OÙ elle vient : l'adresse de la grille
 * (critères compris) et sa position de défilement. Cette note est
 * effacée à chaque fermeture propre — elle ne SURVIT qu'à un
 * rechargement.
 *
 * Ce composant, posé sur la page de fiche, la lit : si elle désigne
 * CETTE fiche et qu'on est sur un appareil à souris, il REPART vers la
 * grille (location.replace : la page de fiche ne laisse pas de trace
 * dans l'historique) en demandant, par ?fenetre=<slug>, d'y ROUVRIR la
 * fenêtre — recherche derrière, position rendue, retour arrière qui
 * ramène aux résultats. Sur les vrais mobiles, il ne fait rien : la
 * page complète EST la bonne vue.
 */

/** La clé partagée avec GrilleTatoueurs. */
export const CLE_FENETRE_FICHE = "yokofolio-fenetre-fiche";

export type ContexteFenetreFiche = {
  /** Le slug de la fiche qui était ouverte. */
  slug: string;
  /** L'adresse de la grille (chemin + critères de recherche). */
  retour: string;
  /** La position de défilement de la grille au moment de l'ouverture. */
  defilement: number;
};

export function RetourFenetreFiche({ slug }: { slug: string }) {
  useEffect(() => {
    if (document.documentElement.dataset.appareil === "mobile") return;
    let contexte: ContexteFenetreFiche | null = null;
    try {
      contexte = JSON.parse(
        sessionStorage.getItem(CLE_FENETRE_FICHE) ?? "null"
      ) as ContexteFenetreFiche | null;
    } catch {
      contexte = null;
    }
    if (!contexte || contexte.slug !== slug || !contexte.retour) return;

    // Repartir vers la grille, fenêtre demandée. `replace` : cette
    // page de fiche ne doit PAS s'empiler dans l'historique — après la
    // réouverture, « précédent » ramène à la grille, pas ici.
    const separateur = contexte.retour.includes("?") ? "&" : "?";
    window.location.replace(
      `${contexte.retour}${separateur}fenetre=${encodeURIComponent(slug)}`
    );
  }, [slug]);

  return null;
}
