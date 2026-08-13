"use client";

import { IconeCartes, IconePhoto } from "@/components/Icones";
import { useVuePhototheque } from "@/components/AffichageMosaique";
import { poserPhototheque } from "@/lib/vue-phototheque";
import { basculerSansSaut } from "@/lib/bascule-verrouillee";
//  ⚠️ TEMPORAIRE (nº 173) — la sonde-journal enregistre les clics de
//  bascule. Elle n'écrit RIEN sans `?sonde-bascule=1`.
import { noter } from "@/lib/journal-bascule";

/**
 * L'ICÔNE DE MISE EN PAGE — L'ÉCRITURE UNIQUE (extraite nº 255-§4)
 * ==================================================================
 * D'OÙ ELLE VIENT. C'est le bouton « photothèque » de la barre du
 * moteur de recherche (nº 140) : une seule icône, qui montre la vue
 * VERS LAQUELLE on bascule — la photo mène aux images seules, la carte
 * ramène aux cartes. La nº 255-§4 la veut aussi dans la barre de « Ma
 * sélection » : elle est donc SORTIE du moteur, à l'identique, et les
 * deux barres consomment cette écriture-ci. Il n'en existe pas d'autre
 * — pas un second dessin, pas une seconde robe.
 *
 * CE QU'ELLE GARDE, AU JETON PRÈS :
 *  · AUCUNE COULEUR D'ÉTAT (nº 141-4C) : la robe ne bouge pas, c'est
 *    le DESSIN qui dit l'état. Ni contour, ni rose ;
 *  · son fond est gouverné par `[data-clair-barre]` (nº 174-§1),
 *    comme l'encadré voisin ;
 *  · le clic passe par `basculerSansSaut` (nº 162-§2) : note de la
 *    carte du haut, changement et remise en place tiennent dans UNE
 *    SEULE tâche — aucune image intermédiaire n'est peinte. Et il
 *    demande une valeur EXPLICITE (nº 164) : deux déclenchements ne
 *    peuvent plus se défaire l'un l'autre.
 *
 * `diametre` — 46 px dans les barres à souris, 52 px dans la rangée du
 * doigt : les deux tailles existaient déjà, aucune n'est choisie ici.
 * `retourAuDoigt` — la rangée du doigt marque l'appui par l'opacité
 * (`active:opacity-80`) là où le web anime sa couleur : c'est le seul
 * écart entre les deux barres, et il reste là où il était.
 */
export function BoutonPhototheque({
  contexte,
  diametre = 46,
  retourAuDoigt = false,
}: {
  /** Ce que la sonde-journal écrit (« barre web », « Ma sélection »…). */
  contexte: string;
  diametre?: number;
  retourAuDoigt?: boolean;
}) {
  const phototheque = useVuePhototheque();
  return (
    <button
      type="button"
      onClick={() => {
        noter(
          `CLIC bouton PHOTOTHÈQUE (${contexte}) · ${phototheque} → ${!phototheque}`
        );
        basculerSansSaut(() => poserPhototheque(!phototheque));
      }}
      aria-pressed={phototheque}
      aria-label={phototheque ? "Revenir aux cartes" : "Voir les images seules"}
      title={phototheque ? "Revenir aux cartes" : "Images seules"}
      data-bouton-phototheque=""
      //  ⚠️ UN CRAN PLUS CLAIR (nº 150-§2), comme l'encadré.
      //  ⚠️ FOND GOUVERNÉ PAR `[data-clair-barre]` (nº 174-§1).
      data-clair-barre=""
      style={{ width: diametre, height: diametre }}
      className={`relative shrink-0 rounded-full text-sombre-texte
                  flex items-center justify-center ${
                    retourAuDoigt
                      ? "active:opacity-80 transition-opacity"
                      : "transition-colors"
                  }`}
    >
      {phototheque ? <IconeCartes taille={20} /> : <IconePhoto taille={20} />}
    </button>
  );
}
