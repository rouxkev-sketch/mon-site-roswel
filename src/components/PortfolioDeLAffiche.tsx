"use client";

import { robeDuBadge } from "@/components/BadgesCharte";
import { OngletsLigne } from "@/components/OngletsLigne";
import {
  NATURES_PHOTO,
  RENDU_PAR_DEFAUT,
  RENDUS_PHOTO,
} from "@/lib/photos-tatoueur";
import type { PhotoGalerie, StyleGalerie } from "@/lib/photo-tatoueur";

/**
 * L'AFFICHE EN DEUX ONGLETS — « Profil » et « Portfolio »
 * ==================================================================
 * (passe nº 197, complétée par la nº 204)
 *
 * ⚠️ RIEN N'EST DESSINÉ ICI. Les sélecteurs REPRENNENT des pièces qui
 * existent déjà, et c'est la règle de la passe :
 *
 *  · « Profil / Portfolio » ET « Noir et gris / Couleur » — LA FORME
 *    du sélecteur du formulaire de portfolio (deux rectangles,
 *    `rounded-xl`, `px-3 py-2.5`, aucun contour) et LES COULEURS DU
 *    BADGE DE FILTRE — la fonction `robeDuBadge` de BadgesCharte. Les
 *    quatre couleurs ne sont écrites qu'à un seul endroit, et pas
 *    ici. Les deux sélecteurs sont LE MÊME composant
 *    (`SelecteurRectangles`), pas deux copies ;
 *
 *  · « Réalisation / Flash » — le composant `OngletsLigne`, celui du
 *    sélecteur « Explorer / Filtres » du moteur de recherche. Aucune
 *    copie : le composant lui-même.
 *
 * LA HIÉRARCHIE DU PORTFOLIO (nº 204-§3) : Profil / Portfolio, puis
 * Réalisation / Flash, puis Noir et gris / Couleur, puis les vignettes
 * de styles. UNE SÉRIE = STYLE + CATÉGORIE + RENDU — exactement une
 * galerie de dépôt, donc vingt photos au plus PAR CONSTRUCTION, sans
 * aucune limite d'affichage : une série ouverte sous « Flash » ne
 * contient plus aucune réalisation.
 *
 * LES CATÉGORIES viennent de `NATURES_PHOTO`, LES RENDUS de
 * `RENDUS_PHOTO` (lib/photos-tatoueur) — les seules listes du site qui
 * les nomment.
 */

/** Les deux onglets de l'affiche. */
export type OngletAffiche = "profil" | "portfolio";

/** UNE SÉRIE — ce qu'un toucher de vignette ouvre (nº 204-§3) :
    exactement une galerie de dépôt. */
export type SerieChoisie = { style: string; nature: string; rendu: string };

const ONGLETS: Array<{ cle: OngletAffiche; label: string }> = [
  { cle: "profil", label: "Profil" },
  { cle: "portfolio", label: "Portfolio" },
];

/** Le rendu d'une photo, jamais vide : les lignes d'avant la migration
    nº 48 n'en portent pas — on lit alors le même défaut que partout. */
function renduDe(photo: PhotoGalerie): string {
  return photo.rendu ?? RENDU_PAR_DEFAUT;
}

/**
 * LES DEUX RECTANGLES — LE sélecteur de l'affiche, unique.
 * Forme du formulaire (deux colonnes, 8 px entre elles — voir
 * BlocPortfolio, « LE RENDU — DEUX RECTANGLES »), couleurs du badge de
 * filtre (`robeDuBadge`, importée telle quelle). « Profil / Portfolio »
 * et « Noir et gris / Couleur » l'appellent tous les deux : une seule
 * géométrie, une seule robe, aucune copie (nº 204-§3).
 */
function SelecteurRectangles({
  ariaLabel,
  valeur,
  surChoix,
  options,
}: {
  ariaLabel: string;
  valeur: string;
  surChoix: (cle: string) => void;
  options: ReadonlyArray<{ cle: string; label: string }>;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const actif = valeur === option.cle;
        return (
          <button
            key={option.cle}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => surChoix(option.cle)}
            //  ⚠️ AUCUN CONTOUR, AUCUN ROSE : `robeDuBadge` dit tout.
            className={`rounded-xl px-3 py-2.5 text-center text-[14px]
                        font-semibold transition-colors ${robeDuBadge(actif)}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * LE SÉLECTEUR « PROFIL / PORTFOLIO » — les deux rectangles.
 */
export function SelecteurOngletAffiche({
  valeur,
  surChoix,
}: {
  valeur: OngletAffiche;
  surChoix: (onglet: OngletAffiche) => void;
}) {
  return (
    <SelecteurRectangles
      ariaLabel="Profil ou portfolio"
      valeur={valeur}
      surChoix={(cle) => surChoix(cle as OngletAffiche)}
      options={ONGLETS}
    />
  );
}

/** Un style publié dans la série regardée, et sa vignette. */
type StylePublie = {
  slug: string;
  label: string;
  miniature: string;
  nombre: number;
};

/** LES RENDUS PRÉSENTS DANS UNE CATÉGORIE, dans l'ordre de la
    configuration — c'est eux qui décident si le sélecteur s'affiche. */
function rendusDeLaCategorie(
  groupes: StyleGalerie[],
  nature: string
): string[] {
  const presents = new Set(
    groupes.flatMap((groupe) =>
      groupe.photos
        .filter((photo) => photo.nature === nature)
        .map((photo) => renduDe(photo))
    )
  );
  return RENDUS_PHOTO.map((r) => r.slug).filter((slug) => presents.has(slug));
}

/** LES STYLES PUBLIÉS DANS UNE SÉRIE (catégorie + rendu) — et rien
    d'autre : un style sans photo de cette série-là n'a pas de
    vignette. */
function stylesDeLaSerie(
  groupes: StyleGalerie[],
  nature: string,
  rendu: string
): StylePublie[] {
  return groupes
    .map((groupe) => {
      const photos = groupe.photos.filter(
        (photo) => photo.nature === nature && renduDe(photo) === rendu
      );
      return {
        slug: groupe.slug,
        label: groupe.label,
        miniature: photos[0]?.miniature ?? "",
        nombre: photos.length,
      };
    })
    .filter((style) => style.nombre > 0);
}

/**
 * LE PANNEAU « PORTFOLIO » — la catégorie, le rendu, puis les styles
 * publiés.
 */
export function PanneauPortfolio({
  groupes,
  nature,
  surNature,
  rendu,
  surRendu,
  surSerie,
  nomTatoueur,
}: {
  groupes: StyleGalerie[];
  nature: string;
  surNature: (nature: string) => void;
  /** Le rendu CHOISI — le panneau le ramène de lui-même à un rendu
      réellement présent dans la catégorie regardée. */
  rendu: string;
  surRendu: (rendu: string) => void;
  /** Un toucher sur une vignette : la galerie principale montre CETTE
      série — style + catégorie + rendu, une galerie de dépôt — et la
      page remonte en haut (nº 197-§4, précisé par la nº 204-§3). */
  surSerie: (serie: SerieChoisie) => void;
  nomTatoueur: string;
}) {
  const rendus = rendusDeLaCategorie(groupes, nature);
  /** LE RENDU EFFECTIF : celui qu'on a choisi s'il existe ici, sinon
      LE SEUL présent (nº 204-§3 : un artiste qui n'a déposé qu'un
      rendu le voit directement, sans sélecteur). */
  const renduEffectif = rendus.includes(rendu)
    ? rendu
    : (rendus[0] ?? RENDU_PAR_DEFAUT);
  const styles = stylesDeLaSerie(groupes, nature, renduEffectif);

  return (
    <div className="mt-6">
      {/*  LE SÉLECTEUR DU MOTEUR DE RECHERCHE, RÉUTILISÉ TEL QUEL. */}
      <OngletsLigne
        ariaLabel="Réalisations ou flashs"
        cleActive={nature}
        surChoix={surNature}
        options={NATURES_PHOTO.map((categorie) => ({
          cle: categorie.slug,
          label: categorie.label,
        }))}
      />

      {/*  LE RENDU (nº 204-§3) — les deux rectangles, SEULEMENT quand
           les deux rendus existent dans la catégorie : à un seul
           rendu, le choix n'existe pas, on le montre directement. */}
      {rendus.length === 2 && (
        <div className="mt-5">
          <SelecteurRectangles
            ariaLabel="Noir et gris ou couleur"
            valeur={renduEffectif}
            surChoix={surRendu}
            options={RENDUS_PHOTO.map((r) => ({
              cle: r.slug,
              label: r.label,
            }))}
          />
        </div>
      )}

      {styles.length === 0 ? (
        /*  §5 (nº 197) — LE TITRE SEUL, centré. Aucune phrase, aucune
            icône. */
        <p className="mt-10 text-center text-[16px] font-semibold text-sombre-texte-doux">
          Aucune publication
        </p>
      ) : (
        /*  LES VIGNETTES — une par style publié, le nom dessous.
            Angles arrondis, aucun contour, aucun encadré : l'image et
            son nom, rien de plus. (Le cœur de série de la nº 203 est
            ANNULÉ par la nº 204-§1 : le cœur vit sur chaque photo,
            dans la galerie — jamais ici.) */
        <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3">
          {styles.map((style) => (
            <li key={style.slug}>
              <button
                type="button"
                onClick={() =>
                  surSerie({
                    style: style.slug,
                    nature,
                    rendu: renduEffectif,
                  })
                }
                className="group block w-full text-left"
              >
                <span className="block overflow-hidden rounded-2xl bg-sombre-eleve">
                  {/* eslint-disable-next-line @next/next/no-img-element --
                      photo déposée par le tatoueur, servie telle quelle
                      (même règle que le portrait rond de l'affiche). */}
                  <img
                    src={style.miniature}
                    alt={`${style.label} — ${nomTatoueur}`}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover
                               transition-opacity group-hover:opacity-90"
                  />
                </span>
                {/*  LE NOM DU STYLE — la hiérarchie tient à lui seul :
                     blanc, demi-gras, au-dessus de tout le reste de la
                     page en poids. */}
                <span className="mt-2.5 block text-[15px] font-semibold text-sombre-texte">
                  {style.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
