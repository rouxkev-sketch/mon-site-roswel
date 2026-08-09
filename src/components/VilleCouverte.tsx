"use client";

import { useSyncExternalStore } from "react";
import { lireDerniereRecherche } from "@/lib/recherche-session";
import { nomVilleCourt } from "@/lib/villes";

// La mémoire de recherche ne change pas pendant l'affichage de la fiche
const sansAbonnement = () => () => {};

/**
 * LE NOM DE LA VILLE « COUVERTE » (fiche artisan)
 * -----------------------------------------------
 * Affiche la ville RECHERCHÉE par le visiteur (mémorisée pendant la
 * visite), sans code postal. S'il n'y a pas eu de recherche (arrivée
 * directe, favoris…), repli sur la ville de l'artisan.
 * Rendu côté navigateur : la mémoire de recherche y vit
 * (sessionStorage) — le serveur affiche d'abord le repli.
 */
export function VilleCouverte({ villeArtisan }: { villeArtisan: string }) {
  const ville = useSyncExternalStore(
    sansAbonnement,
    () => {
      const recherche = lireDerniereRecherche();
      return recherche?.villeNom ? nomVilleCourt(recherche.villeNom) : villeArtisan;
    },
    () => villeArtisan
  );

  return <>{ville}</>;
}
