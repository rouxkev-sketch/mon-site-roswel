/**
 * STYLES PARTAGÉS DES MENUS DÉROULANTS DE LA RECHERCHE
 * ----------------------------------------------------
 * Le menu « Catégorie d'artisan » (ChampMetier) et le menu des villes
 * (ChampVille) ouvrent EXACTEMENT le même panneau déroulant : mêmes
 * bordures, arrondis, ombre, marges, options. Un seul endroit à
 * modifier pour garder les deux rigoureusement identiques.
 */

/** Le panneau qui s'ouvre sous le champ (liste des choix) */
/** LE PANNEAU DÉROULANT (suggestions de ville, menu des métiers).
    `z-30` et non `z-10` : les cartes de résultats posent leur cœur
    favori en `z-10` et viennent APRÈS le moteur dans la page — à
    égalité de niveau, c'est le dernier qui gagne, et le cœur
    transparaissait par-dessus la liste ouverte. Trente le place
    au-dessus de tout le contenu des cartes (cœur, partage, badges,
    avatars, qui ne montent jamais plus haut que 10), tout en restant
    SOUS le bandeau collant du haut de page (50) et sous les fenêtres
    modales (60). */
export const PANNEAU_LISTE =
  "absolute z-30 mt-1 w-full rounded-2xl border border-bordure bg-fond shadow-lg overflow-hidden";

/** LE MÊME PANNEAU, MAIS POSÉ DANS <body> (createPortal) et placé en
    COORDONNÉES D'ÉCRAN (voir placement-menu.ts).
    POURQUOI : un menu enfant de son champ est DÉCOUPÉ par le premier
    parent qui rogne — la fenêtre du moteur, sur smartphone, n'en
    laissait voir que quatre entrées sur vingt-deux. Posé dans le
    corps de la page, il passe PAR-DESSUS cette fenêtre et descend
    jusqu'au bas de l'écran (ou jusqu'au clavier).
    z-80 : au-dessus des fenêtres superposées (70), sous rien d'autre.
    `flex flex-col` + `min-h-0` sur la liste : c'est la LISTE qui
    défile à l'intérieur du plafond de hauteur, jamais le panneau. */
export const PANNEAU_LISTE_FLOTTANT =
  "z-[80] flex flex-col rounded-2xl border border-bordure bg-fond shadow-[0_16px_50px_rgba(0,0,0,0.5)] overflow-hidden";

/** Une option cliquable dans le panneau */
export const OPTION_LISTE =
  "w-full min-h-[44px] px-4 py-2.5 text-left hover:bg-fond-doux active:bg-primaire-clair";
