/**
 * ██ LA MOSAÏQUE LISTE DES CARROUSELS, PAS DES ARTISTES (nº 279-§1) ██
 * ==================================================================
 * LE CHANGEMENT DE NATURE. Jusqu'ici, une carte = UN ARTISTE, montré
 * par une photo « représentative », et l'ouvrir montrait tout son
 * travail d'un coup — le réalisme, puis les flashs, mêlés. Ce n'était
 * pas un défaut d'affichage : on cherche un STYLE, pas une personne.
 *
 * DÉSORMAIS, UNE CARTE = UN CARROUSEL, c'est-à-dire une galerie au
 * sens du §0 de la nº 278 : un style, une catégorie, un rendu. Un
 * artiste qui a créé trois galeries occupe donc TROIS cartes, chacune
 * montrant LA PREMIÈRE PHOTO DE SA GALERIE (règle 1), et l'ouvrir
 * n'ouvre que celle-là (règle 3).
 *
 * CE QUE CE CHANGEMENT D'UNITÉ TOUCHE, et qui est traité ici ou dans
 * les fichiers nommés :
 *  · LA PAGINATION compte des carrousels (lib/tatoueurs,
 *    `pageDeResultats`) — la règle « colonnes × 6 » de la nº 226
 *    s'applique telle quelle au nouveau compte, elle ne parle que de
 *    taille de page ;
 *  · L'ORDRE STABLE ET L'ABSENCE DE DOUBLONS entre pages (migrations
 *    nº 61 et nº 63) tiennent sur la nouvelle unité : le classement
 *    porte sur la liste ENTIÈRE de carrousels avant toute coupe, et
 *    l'âge est ancré au jour (lib/classement-carrousels) ;
 *  · LE COMPTEUR de résultats dit des carrousels (IndexTatoueurs) ;
 *  · LA VARIÉTÉ DES ARTISTES devient nécessaire — sans elle, un salon
 *    à douze galeries occupe la première page (lib/classement-carrousels,
 *    `etalerParPage`) ;
 *  · LA CLÉ DE RENDU et la MÉMOIRE DE POSITION ne peuvent plus être
 *    l'identifiant de la fiche : deux cartes d'un même artiste le
 *    partageraient. C'est `cle` ci-dessous qui les porte
 *    (GrilleTatoueurs, CarteTatoueur, lib/carte-du-haut) ;
 *  · LE CŒUR ne change pas d'unité : il portait DÉJÀ sur la galerie
 *    entière (règle 4) — une carte de carrousel aime exactement ce
 *    qu'elle montre ;
 *  · LES FAVORIS n'ont rien à changer : ils affichaient déjà un
 *    ENSEMBLE par carte (nº 213), c'est-à-dire un carrousel — ils
 *    avaient donc raison avant tout le monde.
 */

import {
  cleDEnsemble,
  galerieOrdonnee,
  natureConnue,
  PHOTOS_PAR_CARROUSEL,
  RENDU_PAR_DEFAUT,
  type PhotoTatoueur,
} from "@/lib/photos-tatoueur";
import { ageEnJours, jourCourant, type Classable } from "@/lib/classement-carrousels";
import type { Tatoueur } from "@/lib/tatoueurs";

/** UN CARROUSEL — l'unité de la mosaïque. */
export type Carrousel = Classable & {
  /** La fiche de l'artiste, SA GALERIE RESTREINTE à ce carrousel : la
      carte n'a ainsi rien d'autre à montrer, et le cœur n'aime que
      cette galerie. */
  fiche: Tatoueur;
  style: string;
  nature: string;
  rendu: string;
  photos: PhotoTatoueur[];
};

/** La clé d'un carrousel — unique sur tout le site, et STABLE : c'est
    elle qui sert de clé de rendu, de repère de position dans la
    mosaïque, et de départage dans le classement. */
export function cleDuCarrousel(slug: string, photo: {
  style?: string;
  rendu: string | null;
  nature?: string | null;
}): string {
  return `${slug}·${cleDEnsemble(photo)}`;
}

/**
 * LES CARROUSELS D'UNE FICHE — dans l'ordre de l'artiste.
 * Les galeries se suivent dans l'ordre où leur PREMIÈRE photo apparaît
 * dans le portfolio : c'est encore lui qui décide (règles 1 et 2), et
 * cela vaut ordre d'entrée pour le classement (voir `signaux`).
 * Une fiche sans portfolio catalogué (d'avant la migration nº 31) rend
 * UN carrousel — sa photo principale : elle reste dans la mosaïque,
 * comme avant, plutôt que d'en disparaître.
 */
export function carrouselsDeLaFiche(
  fiche: Tatoueur,
  contexte: { distanceKm?: number | null; popularite?: number; jour?: number } = {}
): Carrousel[] {
  const jour = contexte.jour ?? jourCourant();
  const galerie = galerieOrdonnee(fiche.galerie);
  if (galerie.length === 0) {
    //  L'ANCIEN MODÈLE : aucune photo cataloguée. La fiche vaut un
    //  carrousel d'une photo — celle qu'elle a toujours montrée.
    const style = fiche.styles[0] ?? "";
    return [
      {
        cle: cleDuCarrousel(fiche.slug, { style, rendu: null, nature: null }),
        artisteId: fiche.id,
        fiche,
        style,
        nature: natureConnue(null),
        rendu: RENDU_PAR_DEFAUT,
        photos: [],
        signaux: {
          popularite: contexte.popularite ?? 0,
          ageJours: 0,
          distanceKm: contexte.distanceKm ?? null,
          personnalisation: 0,
          //  Aucune photo cataloguée : ce carrousel-là n'a rien à
          //  faire valoir au départage du §5, et c'est juste.
          photos: 0,
        },
      },
    ];
  }

  const parCle = new Map<string, PhotoTatoueur[]>();
  for (const photo of galerie) {
    const cle = cleDEnsemble(photo);
    const liste = parCle.get(cle) ?? [];
    liste.push(photo);
    parCle.set(cle, liste);
  }

  return [...parCle.entries()].map(([, photos]) => {
    const premiere = photos[0];
    /**
     * §3 (nº 283) — LA LIMITE EST DANS LE CARROUSEL, JAMAIS SUR LA
     * FICHE. Au plus dix photos, DANS L'ORDRE DE L'ARTISTE — c'est un
     * `slice`, jamais un tri : la première photo reste celle qu'il a
     * mise en tête (règle 1), et les suivantes se suivent (règle 3).
     * ⚠️ ON NE SUPPRIME JAMAIS UN CARROUSEL : ce qui dépasse dix
     * photos n'écarte pas la galerie, il la raccourcit. C'est toute la
     * différence avec le plafond par fiche que cette passe retire.
     */
    const montrees = photos.slice(0, PHOTOS_PAR_CARROUSEL);
    //  L'ÂGE DU CARROUSEL : celui de sa photo LA PLUS RÉCENTE. Une
    //  galerie qu'on enrichit reste vivante — c'est le comportement
    //  voulu par le §3 (« les artistes qui publient doivent voir un
    //  effet »). Sans date connue (base d'avant, démonstration) :
    //  âge nul, le carrousel est traité comme neuf.
    const derniere = photos
      .map((photo) => photo.cree_le ?? null)
      .filter((date): date is string => Boolean(date))
      .sort()
      .at(-1);
    return {
      cle: cleDuCarrousel(fiche.slug, premiere),
      artisteId: fiche.id,
      fiche: { ...fiche, galerie: montrees },
      style: premiere.style,
      nature: natureConnue(premiere.nature),
      rendu: premiere.rendu ?? RENDU_PAR_DEFAUT,
      photos: montrees,
      signaux: {
        popularite: contexte.popularite ?? 0,
        //  ⚠️ L'ÂGE SE MESURE SUR LE CARROUSEL ENTIER, pas sur les dix
        //  photos montrées : une galerie enrichie hier est jeune même
        //  si sa nouveauté est la quinzième (règle 4).
        ageJours: ageEnJours(derniere, jour),
        distanceKm: contexte.distanceKm ?? null,
        personnalisation: 0,
        //  §5 (nº 283) — CE QUI DÉPARTAGE DEUX NOTES ÉGALES : le
        //  nombre de photos REÇUES pour ce carrousel. Voir la note du
        //  classement — au-delà de dix, la base n'en envoie pas plus,
        //  et deux carrousels bien fournis sont alors départagés par
        //  leur fraîcheur.
        photos: photos.length,
      },
    };
  });
}

/**
 * TOUTE UNE LISTE DE FICHES, ÉCLATÉE EN CARROUSELS.
 * ⚠️ L'ORDRE D'ENTRÉE EST CONSERVÉ (fiche par fiche, puis galerie par
 * galerie) : c'est lui qui départage les égalités de score — le
 * mélange du jour ou la proximité, selon le chemin qui a construit la
 * liste. Le classement ne le détruit jamais (voir lib/classement-carrousels).
 */
export function carrouselsDesFiches(
  fiches: Tatoueur[],
  contexte: {
    populariteParFiche?: Map<string, number>;
    distanceParFiche?: Map<string, number | null>;
    jour?: number;
  } = {}
): Carrousel[] {
  const jour = contexte.jour ?? jourCourant();
  return fiches.flatMap((fiche) =>
    carrouselsDeLaFiche(fiche, {
      jour,
      popularite: contexte.populariteParFiche?.get(fiche.slug) ?? 0,
      distanceKm: contexte.distanceParFiche?.get(fiche.id) ?? null,
    })
  );
}

/**
 * LA FICHE QU'UNE CARTE REÇOIT — celle du carrousel, avec ses tags.
 * ⚠️ `carrousel` VOYAGE AVEC ELLE : c'est ce qui permet à la grille de
 * donner à chaque carte SES tags (et non les critères de la recherche,
 * qui sont les mêmes pour toute la page), et à la carte de porter une
 * clé unique. Sans lui, deux carrousels d'un même artiste seraient
 * deux cartes identiques.
 */
export function ficheDuCarrousel(carrousel: Carrousel): Tatoueur {
  return {
    ...carrousel.fiche,
    carrousel: {
      cle: carrousel.cle,
      style: carrousel.style,
      nature: carrousel.nature,
      rendu: carrousel.rendu,
    },
  };
}
