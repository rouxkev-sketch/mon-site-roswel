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
  /**
   * ██ §3 (nº 642) — LA RANGÉE EXISTE MÊME QUAND TOUT EST VIDE ██
   * ------------------------------------------------------------------
   * CE QU'IL Y AVAIT ICI, ET LA CAUSE DU RELEVÉ : « aucune entrée nulle
   * part » rendait `<EnTeteTatouage />` NU. Or une barre sans rangée
   * n'est pas une barre vide — elle monte LE MOTEUR DE RECHERCHE (voir
   * la branche `rangee ? … : <MoteurTatouage …>` d'EnTeteTatouage).
   * C'est exactement ce que le propriétaire voit au web ; au doigt le
   * moteur est caché sous 1024 px, d'où « il n'y a rien ».
   * POURQUOI CE RACCOURCI EXISTAIT : à la nº 245, la rangée ne portait
   * QUE les deux menus de filtre — sans entrée, elle n'avait vraiment
   * rien à porter. LE VA-ET-VIENT « Favoris | Portfolios » L'A REJOINTE
   * DEPUIS (nº 460 au doigt, nº 461 au web), et lui, il a toujours
   * quelque chose à dire : il faut pouvoir passer sur Portfolios même
   * sans un seul favori. Le raccourci n'a pas été défait par une
   * passe — il a été dépassé par ce qu'on a mis dans la rangée.
   * ⚠️ LES MENUS DE FILTRE NE REVIENNENT PAS POUR AUTANT (acquis
   * nº 576/577) : `MenusSelection` rend un champ VIDE quand sa liste
   * d'entrées l'est (`if (entrees.length === 0) return <span />;`) —
   * la règle est chez lui, elle n'est pas écrite deux fois.
   * ⚠️ ET LA LOUPE RETROUVE SA PAGE (acquis nº 247-§6) : une rangée
   * libre fait monter l'hôte invisible du moteur ; sans elle, la page
   * de recherche du doigt n'avait personne pour l'ouvrir depuis une
   * sélection vide.
   */
  return (
    <EnTeteTatouage
      //  §1 (nº 253) — LA RANGÉE EXISTE AUX DEUX LARGEURS : le
      //  `rangeeWeb` de la nº 251 est défait. La barre du smartphone
      //  garde sa rétractation, ses deux hauteurs et sa ligne étroite ;
      //  seul le CONTENU de la rangée change (l'encadré sur le web,
      //  les deux titres au doigt — voir MenusSelection).
      //  §2 (nº 259) — LE REPLI EST CELUI DE LA BARRE, entièrement :
      //  son enveloppe se rabat pour les deux rangées (celle du moteur
      //  et celle-ci), avec les mêmes jetons. Le bloc n'a plus rien à
      //  savoir de l'état.
      rangee={() => (
        <MenusSelection
          entreesFavoris={entreesFavoris}
          entreesSuivis={entreesSuivis}
        />
      )}
    />
  );
}
