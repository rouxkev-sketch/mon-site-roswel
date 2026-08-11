"use client";

import { robeDuBadge } from "@/components/BadgesCharte";
import { BoutonCoeurSerie } from "@/components/BoutonCoeurSerie";
import { OngletsLigne } from "@/components/OngletsLigne";
import { estIdentifiantDeBase } from "@/lib/favoris-yokofolio";
import { NATURES_PHOTO } from "@/lib/photos-tatoueur";
import type { StyleGalerie } from "@/lib/photo-tatoueur";

/**
 * L'AFFICHE EN DEUX ONGLETS — « Profil » et « Portfolio »
 * ==================================================================
 * (passe nº 197)
 *
 * ⚠️ RIEN N'EST DESSINÉ ICI. Les deux sélecteurs REPRENNENT des pièces
 * qui existent déjà, et c'est la règle de la passe :
 *
 *  · « Profil / Portfolio » — LA FORME du sélecteur du formulaire de
 *    portfolio (les deux rectangles « Noir et gris » / « Couleur » de
 *    BlocPortfolio : deux colonnes, `rounded-xl`, `px-3 py-2.5`, aucun
 *    contour) et LES COULEURS DU BADGE DE FILTRE — la fonction
 *    `robeDuBadge` de BadgesCharte, celle-là même qui habille chaque
 *    badge du panneau des filtres et chaque pilule de rayon. Les quatre
 *    couleurs (fond et texte, actif et inactif) ne sont donc écrites
 *    qu'à un seul endroit, et pas ici ;
 *
 *  · « Réalisation / Flash » — le composant `OngletsLigne`, celui du
 *    sélecteur « Explorer / Filtres » du moteur de recherche. Mots
 *    côte à côte, aucune piste, ligne fine et grise qui s'épaissit et
 *    passe au rose sous le mot actif, et qui glisse d'un segment à
 *    l'autre. Aucune copie : le composant lui-même.
 *
 * LES DEUX CATÉGORIES viennent de `NATURES_PHOTO` (lib/photos-tatoueur),
 * la seule liste du site qui les nomme : « Réalisation » et « Flash ».
 */

/** Les deux onglets de l'affiche. */
export type OngletAffiche = "profil" | "portfolio";

const ONGLETS: Array<{ cle: OngletAffiche; label: string }> = [
  { cle: "profil", label: "Profil" },
  { cle: "portfolio", label: "Portfolio" },
];

/**
 * LE SÉLECTEUR « PROFIL / PORTFOLIO » — forme du formulaire, couleurs
 * du badge de filtre.
 */
export function SelecteurOngletAffiche({
  valeur,
  surChoix,
}: {
  valeur: OngletAffiche;
  surChoix: (onglet: OngletAffiche) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Profil ou portfolio"
      //  LA GÉOMÉTRIE DU FORMULAIRE, À L'IDENTIQUE : deux colonnes,
      //  8 px entre elles (voir BlocPortfolio, « LE RENDU — DEUX
      //  RECTANGLES »).
      className="grid grid-cols-2 gap-2"
    >
      {ONGLETS.map((onglet) => {
        const actif = valeur === onglet.cle;
        return (
          <button
            key={onglet.cle}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => surChoix(onglet.cle)}
            //  ⚠️ AUCUN CONTOUR, AUCUN ROSE : `robeDuBadge` dit tout —
            //  c'est la robe du badge de filtre, importée telle quelle.
            className={`rounded-xl px-3 py-2.5 text-center text-[14px]
                        font-semibold transition-colors ${robeDuBadge(actif)}`}
          >
            {onglet.label}
          </button>
        );
      })}
    </div>
  );
}

/** Un style publié dans la catégorie choisie, et sa vignette. */
type StylePublie = {
  slug: string;
  label: string;
  miniature: string;
  nombre: number;
  /** LES PHOTOS DE LA SÉRIE QUI EXISTENT EN BASE (nº 203-§2) — le
      cœur de la vignette les enregistre toutes d'un geste. Vide
      (démonstration, fiche d'avant le catalogue) : pas de cœur. */
  enregistrables: string[];
};

/** LES STYLES PUBLIÉS DANS UNE CATÉGORIE — et rien d'autre : un style
    sans photo de cette catégorie-là n'a pas de vignette. */
function stylesDeLaCategorie(
  groupes: StyleGalerie[],
  nature: string
): StylePublie[] {
  return groupes
    .map((groupe) => {
      const photos = groupe.photos.filter((photo) => photo.nature === nature);
      return {
        slug: groupe.slug,
        label: groupe.label,
        miniature: photos[0]?.miniature ?? "",
        nombre: photos.length,
        enregistrables: photos
          .map((photo) => photo.cle)
          .filter((cle) => estIdentifiantDeBase(cle)),
      };
    })
    .filter((style) => style.nombre > 0);
}

/**
 * LE PANNEAU « PORTFOLIO » — la catégorie, puis les styles publiés.
 */
export function PanneauPortfolio({
  groupes,
  nature,
  surNature,
  surStyle,
  nomTatoueur,
}: {
  groupes: StyleGalerie[];
  nature: string;
  surNature: (nature: string) => void;
  /** Un toucher sur une vignette : la galerie principale montre ce
      style, et la page remonte en haut (§4). */
  surStyle: (slug: string) => void;
  nomTatoueur: string;
}) {
  const styles = stylesDeLaCategorie(groupes, nature);

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

      {styles.length === 0 ? (
        /*  §5 — LE TITRE SEUL, centré. Aucune phrase, aucune icône. */
        <p className="mt-10 text-center text-[16px] font-semibold text-sombre-texte-doux">
          Aucune publication
        </p>
      ) : (
        /*  LES VIGNETTES — une par style publié, le nom dessous.
            Angles arrondis, aucun contour, aucun encadré : l'image et
            son nom, rien de plus.
            ⚠️ LE CŒUR DE LA SÉRIE (nº 203-§2) vit dans l'angle haut
            droit de la vignette : il enregistre TOUTE la série du
            style, d'un geste. Il est posé À CÔTÉ du bouton de la
            vignette (jamais dedans — un bouton dans un bouton n'est
            pas du HTML), par-dessus l'image. */
        <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3">
          {styles.map((style) => (
            <li key={style.slug} className="relative">
              <button
                type="button"
                onClick={() => surStyle(style.slug)}
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
              <span className="absolute right-1.5 top-1.5">
                <BoutonCoeurSerie
                  ids={style.enregistrables}
                  label={style.label}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
