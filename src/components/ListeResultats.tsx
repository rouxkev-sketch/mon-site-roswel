"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CLASSEMENT } from "@/config/roswel";
import { estHydrate } from "@/lib/navigation-session";
import type { ArtisanResultat } from "@/lib/recherche-artisans";
import { CarteArtisan } from "@/components/CarteArtisan";

/** useLayoutEffect côté navigateur, useEffect côté serveur (silencieux) */
const useEffetAvantPeinture =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * LA LISTE DES RÉSULTATS, PAR PAGES DE 10
 * ---------------------------------------
 * Affiche les 10 premiers artisans (réglable dans la config),
 * puis un bouton « Afficher plus d'artisans » charge les 10
 * suivants — défilement progressif, sans numéros de pages.
 */
export function ListeResultats({
  artisans,
  userId,
  favoris,
  villeRecherchee = null,
  metierRecherche = null,
  surClicFiche,
}: {
  artisans: ArtisanResultat[];
  userId: string | null;
  favoris: string[]; // identifiants des artisans déjà en favoris
  villeRecherchee?: string | null; // « Intervient sur [ville] » sur les cartes
  metierRecherche?: string | null; // « Métier : … » sur les cartes
  /** Mode double colonnes : clic sur une carte → fiche dans la colonne
      (la carte ouverte ne porte aucun marquage : identique aux autres) */
  surClicFiche?: (slug: string) => void;
}) {
  const parPage = CLASSEMENT.resultatsParPage;

  // Mémorise combien de cartes étaient affichées : au retour depuis
  // une fiche, la liste retrouve sa longueur (et le navigateur sa
  // position de défilement). En localStorage : la mémoire survit à
  // l'inactivité et aux relances de l'application, comme le journal
  // de navigation du bouton retour.
  const chemin = usePathname();
  const parametres = useSearchParams();
  const cleMemoire = `roswel:resultats:${chemin}?${parametres.toString()}`;

  const [visibles, setVisibles] = useState(() => {
    // Navigation interne (application déjà hydratée) : la longueur
    // mémorisée est lue DÈS le premier rendu — la liste réapparaît
    // complète immédiatement, et la position peut être restaurée
    // AVANT la première peinture (retour sans flash). Au tout
    // premier chargement, on rend la même chose que le serveur
    // (une page) pour une hydratation sans écart.
    if (estHydrate()) {
      try {
        const sauvegarde = Number(localStorage.getItem(cleMemoire));
        if (sauvegarde > parPage) return sauvegarde;
      } catch {
        // stockage indisponible : première page
      }
    }
    return parPage;
  });

  // Premier chargement DIRECT de la page de résultats (chargement
  // complet du document, ex. retour qui recharge la page dans une
  // PWA) : le rendu initial doit copier le serveur (une page, sinon
  // erreur d'hydratation), mais la longueur mémorisée doit être
  // rétablie AVANT LA PREMIÈRE PEINTURE — sinon la liste est trop
  // courte quand la position de défilement est restaurée, et le
  // navigateur la borne « en haut » (c'était l'origine du retour
  // qui remontait en haut sur les rechargements). useLayoutEffect de
  // ListeResultats (composant ENFANT) s'exécute AVANT celui
  // d'EcranRecherche (parent) : la liste est donc déjà à sa pleine
  // longueur quand la position est restaurée.
  useEffetAvantPeinture(() => {
    try {
      const sauvegarde = Number(localStorage.getItem(cleMemoire));
      if (sauvegarde > parPage) {
        setVisibles((actuel) => Math.max(actuel, sauvegarde));
      }
    } catch {
      // stockage indisponible : on repart de la première page
    }
  }, [cleMemoire, parPage]);

  function voirPlus() {
    setVisibles((actuel) => {
      const prochain = actuel + parPage;
      try {
        localStorage.setItem(cleMemoire, String(prochain));
      } catch {
        // sans stockage, la pagination fonctionne quand même
      }
      return prochain;
    });
  }
  const enFavoris = new Set(favoris);

  return (
    <>
      {/* Empilement vertical (smartphone < 768 ET mode double ≥ 1024, où la
          colonne liste est étroite). ENTRE 768 et 1023 px (une colonne pleine
          largeur), les cartes passent en GRILLE de 2 PAR RANGÉE, avec une
          gouttière de 16 px — elles remplissent la largeur de la page. */}
      <div className="flex flex-col gap-3 mt-4 md:max-lg:grid md:max-lg:grid-cols-2 md:max-lg:gap-4">
        {artisans.slice(0, visibles).map((artisan) => (
          <CarteArtisan
            key={artisan.id}
            artisan={artisan}
            userId={userId}
            initialFavori={enFavoris.has(artisan.id)}
            villeRecherchee={villeRecherchee}
            metierRecherche={metierRecherche}
            surClicFiche={surClicFiche}
          />
        ))}
      </div>

      {visibles < artisans.length && (
        <button
          type="button"
          onClick={voirPlus}
          className="mt-4 w-full min-h-[48px] rounded-full border border-primaire text-primaire font-semibold text-sm hover:bg-primaire-clair transition-colors"
        >
          Voir plus
        </button>
      )}
    </>
  );
}
