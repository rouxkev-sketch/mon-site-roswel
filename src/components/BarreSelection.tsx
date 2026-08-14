"use client";

import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { MenusSelection } from "@/components/MenusSelection";
import type { EntreeFiltre } from "@/lib/filtres-selection";

/**
 * LA BARRE DE « MA SÉLECTION » (passe nº 245-§1 et §4)
 * ==================================================================
 * ⚠️ CE FICHIER NE DESSINE RIEN, et c'est tout son intérêt : il ne
 * fait que POSER les deux menus dans la rangée de la barre fixe. La
 * barre, son centrage, sa largeur et son repli sont ceux de
 * `EnTeteTatouage` — inchangés, partagés avec le moteur. Aucun second
 * mécanisme n'est écrit ici.
 *
 * POURQUOI IL EXISTE QUAND MÊME : la page est rendue par le SERVEUR,
 * et une fonction ne traverse pas la frontière serveur → client. Ce
 * petit composant client porte donc la fonction de rendu de la rangée,
 * et reçoit du serveur les deux listes d'entrées (des données pures).
 *
 * §1 — SUR CETTE PAGE, LE BLOC DE RECHERCHE N'EXISTE PAS : la rangée
 * porte les deux menus À SA PLACE (le moteur n'est monté que si
 * `surRecherche` est donné, ce qu'on ne fait pas ici). Il reste
 * intact partout ailleurs.
 * §3 (nº 258) — REPLIÉE, LA RANGÉE NE LAISSE RIEN : la ligne étroite
 * « Ma sélection » est partie. Le retour se fait en remontant la page,
 * ce que la mécanique de la barre fait déjà — plus aucun rappel à
 * porter ici.
 */
export function BarreSelection({
  entreesFavoris,
  entreesSuivis,
}: {
  entreesFavoris: EntreeFiltre[];
  entreesSuivis: EntreeFiltre[];
}) {
  //  Aucune entrée nulle part : la rangée n'a rien à porter, la barre
  //  redevient celle de n'importe quelle page (§3).
  const vide = entreesFavoris.length === 0 && entreesSuivis.length === 0;
  if (vide) return <EnTeteTatouage />;

  return (
    <EnTeteTatouage
      //  §1 (nº 253) — LA RANGÉE EXISTE AUX DEUX LARGEURS : le
      //  `rangeeWeb` de la nº 251 est défait. La barre du smartphone
      //  garde sa rétractation, ses deux hauteurs et sa ligne étroite ;
      //  seul le CONTENU de la rangée change (l'encadré sur le web,
      //  les deux titres au doigt — voir MenusSelection).
      rangee={({ replie }) => (
        <MenusSelection
          entreesFavoris={entreesFavoris}
          entreesSuivis={entreesSuivis}
          replie={replie}
        />
      )}
    />
  );
}
