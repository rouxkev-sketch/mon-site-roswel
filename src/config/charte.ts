/**
 * ██ LA PALETTE CLAIRE DU SITE ██
 * ==================================================================
 * (passe nº 761 — le dernier fichier de Roswel a été supprimé, et
 * voici ce qu'on en a gardé.)
 *
 * D'OÙ ELLE VIENT. Ces valeurs vivaient dans `src/config/roswel.ts`,
 * le fichier de réglages du produit ARTISANS — 1 351 lignes dont un
 * seul export était encore lu. Le produit est parti (nº 760) ; sa
 * palette claire, elle, EST TOUJOURS CELLE DU SITE, parce que
 * `globals.css` en fait vingt couleurs Tailwind (`bg-fond`,
 * `text-encre`, `border-bordure`…) que les écrans de YokoFolio
 * emploient encore. Aucune valeur n'a changé d'un chiffre : le
 * déménagement ne devait pas décaler un seul pixel, et le banc de la
 * nº 761 l'a mesuré avant et après.
 *
 * ⚠️ CE N'EST PAS LA CHARTE DES ÉCRANS SOMBRES. Le bleu nuit, le rose
 * vif, les gris de carte — tout ce qui fait l'apparence de YokoFolio —
 * vivent dans `COULEURS_SOMBRE` (src/config/tatouage.ts). Ce
 * fichier-ci ne porte que la couche CLAIRE, celle qui reste sous
 * l'autre.
 *
 * ⚠️ LE ROSE `primaire` CI-DESSOUS EST L'ANCIEN, ET C'EST VOULU. Sur
 * toutes les pages du groupe (tatouage) — c'est-à-dire le site entier
 * ou presque — `src/app/(tatouage)/layout.tsx` SURCHARGE les trois
 * variables `--rw-primaire*` avec le rose de la charte sombre
 * (#FF2E6C, nº 466). Celui d'ici n'apparaît donc que sur les deux
 * pages qui ne sont dans aucun groupe : la page introuvable et le
 * tableau de bord des sondes. MESURÉ, pas supposé (banc nº 761) :
 *   · /recherche et /tatoueur/…  → --rw-primaire = #FF2E6C
 *   · page introuvable            → --rw-primaire = #EE3D6F
 * Le changer ferait changer l'aspect de ces deux pages : c'est une
 * décision du propriétaire, pas un ménage. Elle lui a été posée.
 *
 * ⚠️ CE QUI A ÉTÉ ÉLAGUÉ AU PASSAGE — six couleurs que plus personne
 * ne lisait : les trois fonds de carte sélectionnée du mode deux
 * colonnes (`selectionTresRecommande`, `selectionRecommande`,
 * `selectionSansBadge`), l'orange du badge « Joignable à… »
 * (`reprise`) et les deux couleurs d'icône de contact
 * (`contactTelephone`, `contactWhatsApp`). Elles servaient les cartes
 * d'artisans, parties à la nº 760.
 *
 * ⚠️ ON NE RETIRE PAS DE VARIABLE SANS TOUCHER `globals.css`, et
 * `globals.css` ne se touche pas (règle nº 172). Les vingt valeurs
 * lues par `lib/theme.ts` restent donc toutes définies, même celles
 * dont aucune classe ne se sert aujourd'hui (`degrade-debut`,
 * `degrade-fin`, `bordure-carte-claire`, `pastille-excellence`,
 * `pastille-recommande`, `alerte`) : une variable citée par la
 * feuille de style et non définie donne une couleur invalide, pas une
 * absence propre.
 */
export const CHARTE_CLAIRE = {
  //  — Le rose (voir l'avertissement de tête : surchargé partout) —
  primaire: "#EE3D6F",
  primaireVoile: "#381E29",
  primaireFonce: "#D42A5C",
  primaireClair: "#FFEBF1",

  //  — Dégradé (haut → bas) : plus aucune classe ne l'emploie —
  degradeDebut: "#FB7BA2",
  degradeFin: "#EC3A6E",

  //  — Fonds et textes —
  /** Fond principal. Sert aussi de couleur de barre du navigateur sur
      les pages hors groupe (app/layout.tsx). */
  fond: "#FFFFFF",
  fondDoux: "#F8F7F8",
  /** Fond de page ≥ 768 px. Lu directement par globals.css. */
  fondPage: "#F6F6F7",
  encre: "#101B33",
  /** Texte secondaire, assombri pour le contraste (≈ 9:1 sur blanc). */
  encreDouce: "#474747",
  bordure: "#D5D2DA",
  bordureChamp: "#BEBFC9",
  /** Flèche des menus déroulants AU REPOS. Ouverts, ils prennent le
      rose de la charte sombre — voir MenuDeroulant. */
  flecheMenus: "#9AA1AC",

  //  — Pastilles et contours —
  pastilleExcellence: "#EE3D6F",
  pastilleRecommande: "#1D9BF0",
  /** Contour fin, lisible sur blanc. Lu aussi par globals.css (les
      barres de défilement fines). */
  bordureCarte: "#C9CCD4",
  bordureCarteClaire: "#EDEEF1",

  //  — Couleurs d'état —
  succes: "#3F8443",
  alerte: "#F59E0B",
  erreur: "#D32E28",
};
