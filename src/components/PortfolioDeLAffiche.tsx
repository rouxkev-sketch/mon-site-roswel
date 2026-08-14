"use client";

import { SelecteurCapsule } from "@/components/SelecteurCapsule";
import {
  CATEGORIES_EXPLORER,
  ECRITURE_TITRE_SECTION,
} from "@/config/tatouage";
import { RENDU_PAR_DEFAUT, RENDUS_PHOTO } from "@/lib/photos-tatoueur";
import type { PhotoGalerie, StyleGalerie } from "@/lib/photo-tatoueur";

/**
 * L'AFFICHE EN DEUX ONGLETS — « Profil » et « Portfolio »
 * ==================================================================
 * (passe nº 197 ; refondu par la nº 276-§3)
 *
 *  · « Profil / Portfolio » (nº 205-§1) — DEUX MOTS NUS côte à côte,
 *    l'actif en blanc, l'autre en gris, une CAPSULE opaque qui GLISSE
 *    (`SelecteurCapsule`, l'écriture partagée avec « Ma sélection »).
 *    LA RANGÉE DU HAUT (nº 205-§2) : le sélecteur à gauche, « Suivre »
 *    à droite — c'est ContenuFiche qui compose la rangée.
 *
 * ⚠️ LES DEUX VA-ET-VIENT ONT DISPARU (nº 276-§3, code compris) :
 * « Réalisations / Flashs » (OngletsLigne) et « Noir & gris / Couleur »
 * (les deux rectangles) cachaient chacun la moitié du portfolio
 * derrière un aller-retour. À leur place, DEUX SECTIONS EMPILÉES :
 *
 *  · un titre « RÉALISATIONS », puis « FLASHS » — les libellés de
 *    `CATEGORIES_EXPLORER` (les seuls endroits du site qui les
 *    nomment), rendus par L'ÉCRITURE DES TITRES DE SECTION DU PROFIL
 *    (`ECRITURE_TITRE_SECTION`, les capitales grises espacées de la
 *    nº 223) — aucune valeur choisie ici, on réutilise la leur ;
 *  · sous chaque titre, TOUTES SES SÉRIES en vignettes, noir & gris
 *    et couleur MÊLÉS, dans leur ordre existant — les styles de A à Z
 *    (nº 208-§4), et dans un style, l'ordre de `RENDUS_PHOTO` — SANS
 *    aucun titre intermédiaire : les mots « Noir & gris » et
 *    « Couleur » ne s'écrivent nulle part ;
 *  · une section vide NE REND RIEN — ni titre, ni espace.
 *
 * UNE SÉRIE = STYLE + CATÉGORIE + RENDU — exactement une galerie de
 * dépôt, donc vingt photos au plus PAR CONSTRUCTION : rien de tronqué.
 * Un toucher de vignette ouvre cette série dans la galerie de
 * l'affiche, comme avant — les vignettes et leur remontée n'ont pas
 * bougé.
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
 * LE SÉLECTEUR « PROFIL / PORTFOLIO » — deux mots nus, une capsule qui
 * glisse (nº 205-§1).
 *
 * ⚠️ SON ÉCRITURE A ÉTÉ EXTRAITE (nº 255-§1) : la capsule, sa mesure,
 * ses couleurs et sa glissade vivent dans `SelecteurCapsule`, et la
 * barre de « Ma sélection » consomme LA MÊME — deux emplois, une seule
 * écriture. Rien n'a changé de ce qu'il dessine ici : mêmes mots,
 * même `w-fit` (la rangée du haut pose « Suivre » à sa droite).
 */
export function SelecteurOngletAffiche({
  valeur,
  surChoix,
}: {
  valeur: OngletAffiche;
  surChoix: (onglet: OngletAffiche) => void;
}) {
  return (
    <SelecteurCapsule
      valeur={valeur}
      options={ONGLETS}
      surChoix={surChoix}
      ariaLabel="Profil ou portfolio"
    />
  );
}

/** Une série publiée — sa vignette dans la grille d'une section. */
type SeriePubliee = {
  style: string;
  label: string;
  rendu: string;
  miniature: string;
};

/**
 * TOUTES LES SÉRIES PUBLIÉES D'UNE CATÉGORIE, APLATIES (nº 276-§3).
 * Les styles de A à Z (`localeCompare` en français, nº 208-§4 — les
 * accents se rangent où on les attend) ; DANS un style, les rendus
 * présents dans l'ordre de `RENDUS_PHOTO` (noir & gris, puis couleur)
 * — « leur ordre existant », celui que les sélecteurs parcouraient.
 * Les deux rendus sont MÊLÉS dans la même grille : aucun mot de rendu
 * ne s'écrit, nulle part. Un style sans photo dans cette catégorie n'a
 * pas de vignette.
 */
function seriesDeLaCategorie(
  groupes: StyleGalerie[],
  nature: string
): SeriePubliee[] {
  const series: SeriePubliee[] = [];
  const parLabel = groupes
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
  for (const groupe of parLabel) {
    for (const rendu of RENDUS_PHOTO) {
      const photos = groupe.photos.filter(
        (photo) => photo.nature === nature && renduDe(photo) === rendu.slug
      );
      if (photos.length === 0) continue;
      series.push({
        style: groupe.slug,
        label: groupe.label,
        rendu: rendu.slug,
        miniature: photos[0]?.miniature ?? "",
      });
    }
  }
  return series;
}

/**
 * LE PANNEAU « PORTFOLIO » — deux sections empilées, sans plus aucun
 * sélecteur (nº 276-§3).
 */
export function PanneauPortfolio({
  groupes,
  surSerie,
  nomTatoueur,
}: {
  groupes: StyleGalerie[];
  /** Un toucher sur une vignette : la galerie principale montre CETTE
      série — style + catégorie + rendu, une galerie de dépôt — et la
      page remonte en haut (nº 197-§4, précisé par la nº 204-§3). */
  surSerie: (serie: SerieChoisie) => void;
  nomTatoueur: string;
}) {
  /*  LES DEUX SECTIONS — « Réalisations » puis « Flashs », les
      libellés de CATEGORIES_EXPLORER. UNE SECTION VIDE NE REND RIEN :
      ni titre, ni espace (nº 276-§3). */
  const sections = CATEGORIES_EXPLORER.map((categorie) => ({
    nature: categorie.nature,
    titre: categorie.titre,
    series: seriesDeLaCategorie(groupes, categorie.nature),
  })).filter((section) => section.series.length > 0);

  if (sections.length === 0) {
    /*  §5 (nº 197) — LE TITRE SEUL, centré. Aucune phrase, aucune
        icône. */
    return (
      <p className="mt-10 text-center text-[16px] font-semibold text-sombre-texte-doux">
        Aucune publication
      </p>
    );
  }

  return (
    <div>
      {sections.map((section) => (
        /*  §2 (nº 277) — L'AÉRATION DES SECTIONS, et sa règle : PLUS
            D'ESPACE AVANT UN TITRE QU'APRÈS LUI — c'est ce qui rattache
            un titre à ce qui le SUIT. Les valeurs, dans le rythme du
            site : 40 px avant chaque titre (`mt-10` — sous la rangée
            Profil / Portfolio pour « RÉALISATIONS », sous le dernier
            carrousel des réalisations pour « FLASHS ») et 20 px entre
            un titre et son premier carrousel (`mt-5`, sur la grille).
            L'écart entre deux carrousels d'une même section ne change
            pas (le `gap` de la grille, plus bas). 40 > 20 : la preuve
            est au banc, mesurée au pixel. */
        <section key={section.nature} className="mt-10">
          {/*  LE TITRE DE SECTION — l'écriture des titres du profil
               (nº 223), consommée telle quelle : capitales grises
               espacées, 13 px. Aucune valeur choisie ici. */}
          <h2 className={ECRITURE_TITRE_SECTION}>{section.titre}</h2>

          {/*  LES VIGNETTES — une par SÉRIE publiée, le nom du style
               dessous. Angles arrondis, aucun contour, aucun encadré :
               l'image et son nom, rien de plus. (Le cœur de série de
               la nº 203 est ANNULÉ par la nº 204-§1 : le cœur vit sur
               chaque photo, dans la galerie — jamais ici.) Un style
               publié dans les deux rendus a DEUX vignettes, sous le
               même nom : c'est la première photo de chaque série qui
               les distingue — jamais un mot de rendu. */}
          {/*  §2 (nº 277) — 20 px sous le titre (`mt-5`) : moins que
               les 40 au-dessus, le titre appartient à sa section. Le
               `gap` entre carrousels, lui, NE CHANGE PAS. */}
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-7">
            {section.series.map((serie) => (
              <li key={`${serie.style}-${serie.rendu}`}>
                <button
                  type="button"
                  onClick={() =>
                    surSerie({
                      style: serie.style,
                      nature: section.nature,
                      rendu: serie.rendu,
                    })
                  }
                  className="group block w-full text-left"
                >
                  {/*  ANGLES DROITS (nº 207-§6) — web et mobile : la
                       vignette est une image nette, sans arrondi. */}
                  <span className="block overflow-hidden bg-sombre-eleve">
                    {/* eslint-disable-next-line @next/next/no-img-element --
                        photo déposée par le tatoueur, servie telle quelle
                        (même règle que le portrait rond de l'affiche). */}
                    <img
                      src={serie.miniature}
                      alt={`${serie.label} — ${nomTatoueur}`}
                      loading="lazy"
                      className="aspect-[4/5] w-full object-cover
                                 transition-opacity group-hover:opacity-90"
                    />
                  </span>
                  {/*  LE NOM DU STYLE — blanc, aligné à gauche, et
                       ALLÉGÉ D'UN CRAN (nº 207-§7) : `font-semibold`
                       (600) se lisait comme du gras, la fonte du site
                       n'ayant pas de graisse intermédiaire dessinée —
                       le navigateur la remplaçait par le gras. `medium`
                       (500) donne le demi-gras voulu. */}
                  <span className="mt-2.5 block text-[15px] font-medium text-sombre-texte">
                    {serie.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
