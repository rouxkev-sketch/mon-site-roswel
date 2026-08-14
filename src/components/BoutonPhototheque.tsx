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
      /*  §6 (nº 258) — LE TRAIT FANTÔME À GAUCHE DU « T », mesuré
          avant d'être corrigé : à chaque bascule, UNE SEULE icône est
          montée (jamais deux), opacité 1, visibilité pleine, et la
          transition du bouton ne porte que des couleurs — aucun fondu
          croisé, aucun reste dans le DOM. Mais le rasterisé parle : le
          T ne peint RIEN à gauche de x=4, tandis que le cadre de
          l'icône photo y peint son bord gauche (x=3,5 au trait 1,8 —
          la colonne 2,6 → 4,4). Le trait intermittent est donc une
          INVALIDATION DE PEINTURE INCOMPLÈTE au remplacement du
          glyphe : le bouton vit au-dessus du verre de la barre
          (backdrop-filter), et la colonne de l'ancien cadre qui
          déborde de la boîte d'encre du T peut survivre dans une tuile
          non repeinte. `contain: paint` borne la peinture du bouton à
          SA boîte et force son invalidation ENTIÈRE à chaque
          changement — une borne d'invalidation, PAS un masque posé
          par-dessus : rien ne déborde d'un rond de 46 dont l'icône de
          20 est centrée. Les `key` gravent le remplacement franc du
          nœud SVG (aujourd'hui garanti par les deux composants
          distincts ; la clé protège d'un refactor qui les unifierait). */
      className={`relative shrink-0 rounded-full text-sombre-texte
                  [contain:paint]
                  flex items-center justify-center ${
                    retourAuDoigt
                      ? "active:opacity-80 transition-opacity"
                      : "transition-colors"
                  }`}
    >
      {phototheque ? (
        <IconeCartes key="cartes" taille={20} />
      ) : (
        <IconePhoto key="photo" taille={20} />
      )}
    </button>
  );
}
