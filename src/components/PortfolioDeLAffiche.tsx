"use client";

import { useLayoutEffect, useRef, useState } from "react";
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
 * (passe nº 197, complétée par les nº 204 et 205)
 *
 * ⚠️ RIEN N'EST INVENTÉ ICI. Chaque sélecteur reprend un vocabulaire
 * qui existe déjà :
 *
 *  · « Profil / Portfolio » (nº 205-§1) — DEUX MOTS NUS côte à côte,
 *    sans piste ni rail ni fond de rangée : l'actif en blanc, l'autre
 *    en gris. Derrière l'actif, une CAPSULE qui GLISSE d'un mot à
 *    l'autre.
 *    ⚠️ ELLE EST OPAQUE, PLUS DE VERRE DÉPOLI (nº 207-§1) : un verre
 *    dépoli ne peut rien montrer sur un panneau uni — il n'y a rien à
 *    flouter derrière, et le `backdrop-filter` ne faisait que coûter
 *    un calque. La capsule prend donc `sombre-haut`, LE BARREAU
 *    AU-DESSUS de l'actif des rectangles de rendu
 *    (`sombre-eleve-clair`, voir `robeDuBadge`) : le niveau le plus
 *    haut de la hiérarchie est le plus clair. Aucun contour, aucun
 *    rose ;
 *
 *  · « Réalisation / Flash » — le composant `OngletsLigne`, celui du
 *    sélecteur « Explorer / Filtres » du moteur de recherche. Aucune
 *    copie : le composant lui-même ;
 *
 *  · « Noir et gris / Couleur » (nº 204-§3) — les deux rectangles du
 *    formulaire de portfolio (`rounded-xl`, aucun contour), habillés
 *    par `robeDuBadge` de BadgesCharte : les quatre couleurs ne sont
 *    écrites qu'à un seul endroit, et pas ici.
 *
 * LA RANGÉE DU HAUT (nº 205-§2) : le sélecteur à gauche, « Suivre » à
 * droite — c'est ContenuFiche qui compose la rangée, le sélecteur ne
 * s'occupe que de lui.
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
 * LES DEUX RECTANGLES — le sélecteur du rendu.
 * Forme du formulaire (deux colonnes, 8 px entre elles — voir
 * BlocPortfolio, « LE RENDU — DEUX RECTANGLES »), couleurs du badge de
 * filtre (`robeDuBadge`, importée telle quelle). Ils sont INCHANGÉS
 * par la nº 205-§3 : seul « Profil / Portfolio » a quitté cette forme
 * pour la capsule de verre.
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
 * LE SÉLECTEUR « PROFIL / PORTFOLIO » — deux mots nus, une capsule de
 * verre qui glisse (nº 205-§1).
 *
 * LA MÉCANIQUE : la capsule est un seul élément, posé DERRIÈRE les
 * mots, dont la position et la largeur épousent le bouton actif —
 * mesurées avant peinture (useLayoutEffect), et re-mesurées si la
 * boîte change (police chargée, redimensionnement : le ResizeObserver
 * du conteneur voit tout). Au changement d'onglet, seule cette paire
 * left / width change : la transition la fait GLISSER d'un mot à
 * l'autre. À sa première apparition, elle naît directement en place —
 * une transition n'anime qu'un changement, pas une naissance.
 */
export function SelecteurOngletAffiche({
  valeur,
  surChoix,
}: {
  valeur: OngletAffiche;
  surChoix: (onglet: OngletAffiche) => void;
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const [capsule, setCapsule] = useState<{ left: number; width: number } | null>(
    null
  );

  useLayoutEffect(() => {
    const zone = conteneur.current;
    if (!zone) return;
    const mesurer = () => {
      const actif = zone.querySelector<HTMLButtonElement>(
        "button[aria-checked='true']"
      );
      if (!actif) return;
      setCapsule({ left: actif.offsetLeft, width: actif.offsetWidth });
    };
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(zone);
    return () => observateur.disconnect();
  }, [valeur]);

  return (
    <div
      ref={conteneur}
      role="radiogroup"
      aria-label="Profil ou portfolio"
      //  SANS piste, sans rail, sans fond de rangée : les mots, c'est
      //  tout. `w-fit` : la rangée du haut (ContenuFiche) pose
      //  « Suivre » à sa droite.
      className="relative flex w-fit items-center gap-1"
    >
      {/*  LA CAPSULE — derrière le mot actif, OPAQUE (nº 207-§1) et
           d'un cran plus claire que l'actif des rectangles de rendu.
           Aucun contour, aucun rose. */}
      {capsule && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 rounded-full bg-sombre-haut
                     transition-[left,width] duration-300 ease-out"
          style={{ left: capsule.left, width: capsule.width }}
        />
      )}
      {ONGLETS.map((onglet) => {
        const actif = valeur === onglet.cle;
        return (
          <button
            key={onglet.cle}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => surChoix(onglet.cle)}
            //  Le mot passe au blanc quand il devient actif, l'autre
            //  redescend en gris — la même transition douce que la
            //  capsule. L'air vient du rembourrage : la capsule
            //  enveloppe le mot, elle ne le serre pas.
            className={`relative z-[1] min-h-[44px] rounded-full px-5
                        text-[14px] font-semibold transition-colors ${
                          actif
                            ? "text-sombre-texte"
                            : "text-sombre-texte-doux hover:text-sombre-texte"
                        }`}
          >
            {onglet.label}
          </button>
        );
      })}
    </div>
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
    .filter((style) => style.nombre > 0)
    //  ⚠️ DE A À Z (nº 208-§4), quels que soient la catégorie et le
    //  rendu choisis. L'ordre d'origine était celui du dépôt : il
    //  changeait d'un sélecteur à l'autre, et l'œil devait rechercher
    //  chaque fois le même style à un endroit différent. `localeCompare`
    //  en français : les accents se rangent où on les attend.
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
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
    <div>
      {/*  LE SÉLECTEUR DU MOTEUR DE RECHERCHE, RÉUTILISÉ TEL QUEL.
           ⚠️ IL NE DÉFILE PAS (nº 207-§4, web) : avec la rangée du
           haut, il reste posé pendant que la galerie défile sous lui.
           `top-11` = la hauteur de la rangée (44 px), et son air
           (`pt-6`) est DANS le bloc collant — sinon la galerie
           passerait dans l'espace laissé au-dessus de lui. Le fond est
           celui de l'enveloppe (`bg-inherit`) : la page l'anthracite,
           la fenêtre superposée sa carte — aucune variante à écrire
           ici.
           ⚠️ PAR UNE VARIABLE, ET NON `bg-inherit` (nº 209-§6) : ce
           bloc a pour parent le panneau, pas la colonne — il héritait
           donc du transparent, et le contenu se voyait passer
           derrière. */}
      {/*  ⚠️ ET UNE MARGE DE CONFORT SOUS LA LIGNE (nº 210-§4) : les
           photos disparaissaient PILE sous elle, qui devenait
           invisible — un trait qui touche ce qui passe dessous ne se
           lit plus. Les 12 px du bas appartiennent au bandeau (il est
           opaque) : les photos s'effacent donc 12 px plus bas, et la
           ligne reste nette en toute circonstance. */}
      <div className="pt-6 lg:pb-3 lg:sticky lg:top-11 lg:z-[1] bg-[var(--fond-colonne)]">
        <OngletsLigne
          ariaLabel="Réalisations ou flashs"
          cleActive={nature}
          surChoix={surNature}
          options={NATURES_PHOTO.map((categorie) => ({
            cle: categorie.slug,
            label: categorie.label,
          }))}
        />
      </div>

      {/*  LE RENDU (nº 204-§3) — les deux rectangles, SEULEMENT quand
           les deux rendus existent dans la catégorie : à un seul
           rendu, le choix n'existe pas, on le montre directement.
           ⚠️ IL DÉFILE AVEC LA GALERIE (nº 207-§4) : il appartient à
           ce qu'on regarde, pas à l'en-tête. */}
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
        <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-7">
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
                {/*  ANGLES DROITS (nº 207-§6) — web et mobile : la
                     vignette est une image nette, sans arrondi. */}
                <span className="block overflow-hidden bg-sombre-eleve">
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
                {/*  LE NOM DU STYLE — blanc, aligné à gauche, et
                     ALLÉGÉ D'UN CRAN (nº 207-§7) : `font-semibold`
                     (600) se lisait comme du gras, la fonte du site
                     n'ayant pas de graisse intermédiaire dessinée —
                     le navigateur la remplaçait par le gras. `medium`
                     (500) donne le demi-gras voulu. */}
                <span className="mt-2.5 block text-[15px] font-medium text-sombre-texte">
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
