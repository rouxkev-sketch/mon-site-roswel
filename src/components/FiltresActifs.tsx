"use client";

import { IconeCroix } from "@/components/Icones";

/**
 * ██ LES BADGES DE FILTRE — SOUS LE COMPTE DES RÉSULTATS (nº 846) ██
 * ==================================================================
 * CE QUE LE PROPRIÉTAIRE DEMANDE (passe nº 846-§4) : sur une page de
 * résultats, le titre devient LE COMPTE (« 15 portfolios ») et, juste
 * en dessous, des BADGES disent CE QUI EST FILTRÉ — le style choisi
 * (« Realism ✕ ») et, s'il y en a une, la localité (« Austin, TX •
 * 25 mi ✕ »). La croix retire ce filtre-là et rafraîchit la liste ;
 * retirer le dernier badge ramène à l'accueil.
 *
 * ██ LA FORME, ET POURQUOI ELLE N'EST PAS UNE CAPSULE ██
 * ------------------------------------------------------------------
 * La consigne est explicite : « rectangle, coins légèrement arrondis —
 * PAS la capsule pleine ». Le site a déjà cette forme-là, et un seul
 * rayon pour elle : celui des badges (`rounded-lg`, la charte nº 449) —
 * le même que le badge du type d'une carte du fil (BadgeTypeDeFiche).
 * Les capsules à bords ronds, elles, restent aux ISSUES d'une recherche
 * vide (AucunResultat) : deux objets différents, deux formes
 * différentes, et l'œil les distingue sans lire.
 * ⚠️ LE FOND EST PLEIN, et c'est une décision : un badge de filtre dit
 * un état ACTIF — quelque chose s'applique en ce moment à la liste
 * qu'on regarde. Le cran de l'interface (`bg-sombre-eleve`) le pose
 * sans crier ; le contour seul (celui du badge de type, nº 844) sert à
 * RENSEIGNER, pas à signaler un état. C'est dit au propriétaire.
 *
 * ██ DEUX ÉLÉMENTS, PAS UN ██
 * Le libellé n'est pas cliquable, la CROIX l'est — et elle seule. Un
 * badge entièrement cliquable serait un bouton dont le sens dépend de
 * l'endroit touché ; ici, ce qu'on touche est ce qui agit. La croix
 * porte son nom accessible en toutes lettres (« Remove … »), parce
 * qu'un lecteur d'écran ne voit pas le texte à sa gauche comme une
 * étiquette.
 * ⚠️ SA CIBLE : le glyphe fait 14 px et sa boîte 24 — le badge n'a que
 * 30 px de haut, une cible de 44 le ferait grandir. C'est le même
 * arbitrage que les croix des volets du portfolio (nº 553), et le badge
 * ENTIER (au moins 90 px de large) reste la zone que l'œil vise.
 */

/** UN FILTRE AFFICHÉ : ce qu'il dit, et ce que sa croix retire. */
export type FiltreAffiche = {
  /** La clé sert au banc et à React — jamais au libellé. */
  cle: string;
  libelle: string;
  /** Le nom accessible de la croix : « Remove the style filter ». */
  etiquetteRetrait: string;
  surRetrait: () => void;
};

export function FiltresActifs({ filtres }: { filtres: FiltreAffiche[] }) {
  if (filtres.length === 0) return null;
  return (
    <div
      data-filtres-actifs=""
      /*  §4 (nº 846) — L'AIR AU-DESSUS EST CELUI DU SOUS-TITRE qu'ils
          remplacent (`mt-1` au doigt, `mt-1.5` au web — LigneResultats,
          nº 628) : la ligne des badges se pose exactement là où la
          ligne de texte se posait, et le bloc de tête ne change pas de
          rythme. Le repli (`flex-wrap`) sert les libellés longs — une
          ville américaine et son rayon peuvent dépasser un écran de
          téléphone. */
      className="mobile:mt-1 not-mobile:mt-1.5 flex flex-wrap items-center gap-2"
    >
      {filtres.map((filtre) => (
        <span
          key={filtre.cle}
          data-filtre-actif={filtre.cle}
          className="inline-flex min-h-[30px] items-center gap-1.5
                     rounded-lg bg-sombre-eleve pl-3 pr-1.5
                     text-[14px] font-semibold text-sombre-texte"
        >
          {filtre.libelle}
          <button
            type="button"
            data-retrait-filtre={filtre.cle}
            aria-label={filtre.etiquetteRetrait}
            onClick={filtre.surRetrait}
            className="flex h-6 w-6 shrink-0 items-center justify-center
                       rounded-md text-sombre-texte-doux transition-colors
                       hover:text-sombre-texte hover:bg-sombre-eleve-clair
                       active:bg-sombre-eleve-clair
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-primaire"
          >
            <IconeCroix taille={14} />
          </button>
        </span>
      ))}
    </div>
  );
}
