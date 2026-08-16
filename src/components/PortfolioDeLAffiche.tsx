"use client";

import { SelecteurCapsule } from "@/components/SelecteurCapsule";
import {
  CATEGORIES_EXPLORER,
  ECRITURE_TITRE_SECTION,
} from "@/config/tatouage";
import {
  RENDU_PAR_DEFAUT,
  RENDUS_PHOTO,
  libelleRendu,
} from "@/lib/photos-tatoueur";
import { GalerieQuiDefile } from "@/components/GalerieQuiDefile";
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
export type SerieChoisie = {
  style: string;
  nature: string;
  rendu: string;
  /** §1-6 (nº 306) — LE RANG DE LA PHOTO TOUCHÉE dans sa série. Le
      cadre photo de la fiche s'ouvre SUR ELLE. Absent : la première,
      comme depuis toujours (c'est ce qu'envoie la grille du doigt). */
  indice?: number;
};

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
  /** §1 (nº 306) — TOUTES LES PHOTOS DE CETTE SÉRIE, dans leur ordre.
      La galerie du web les montre TOUTES : pas de plafond ici (celui de
      « Ma sélection » ne vaut que pour elle), et pas de « Voir plus ».
      La grille du doigt, elle, n'en lit que la première (`miniature`) —
      elle ne change pas d'un pixel. */
  photos: PhotoGalerie[];
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
        photos,
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
          {/*  §1 (nº 306) — AU DOIGT, RIEN NE CHANGE : la grille de
               vignettes par lignes de deux reste exactement ce qu'elle
               était. Le web, lui, prend les galeries qui défilent (plus
               bas) — c'est la seule différence entre les deux. */}
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-7 lg:hidden">
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

          {/*  §1 (nº 306) — LE WEB : UNE GALERIE QUI DÉFILE PAR
               CARROUSEL, la présentation de « Ma sélection »
               (`GalerieQuiDefile`, partagée — aucun second dessin).
               ------------------------------------------------------
               RÈGLE 2 — LE TITRE PORTE LE STYLE ET LE RENDU :
               « Réalisme · Couleur », « Réalisme · Noir et gris ».
               Deux carrousels d'un même style mais de rendus
               différents portent donc deux titres distincts, et c'est
               le but. Les mots viennent de `libelleRendu` : aucun
               libellé n'est écrit ici.
               RÈGLE 3 — TOUTES les photos du carrousel. Le plafond de
               vingt de « Ma sélection » ne s'applique pas à cette
               page, et il n'y a pas de « Voir plus ».
               RÈGLE 4 — DEUX PHOTOS PLEINES ET 10 % DE LA TROISIÈME,
               son bord droit collé au bord droit du cadre :
               `2,1 × case + 2 écarts = 100 %` de la boîte de CONTENU,
               d'où `case = (100 % − 12px) / 2,1`. Aucune largeur en
               dur — la règle tient à toute largeur de colonne.
               RÈGLE 5 — À GAUCHE, LA GALERIE VA JUSQU'AU CONTACT DE LA
               GRANDE PHOTO (`-ml-10`, la gouttière de 40 px, rendue en
               rembourrage `pl-10` : au repos la première photo reste
               alignée sur les titres), ET CETTE BANDE S'EFFACE — un
               masque en dégradé, transparent au bord gauche du cadre,
               pleinement opaque à l'alignement des titres. À droite,
               rien : l'effacement ne concerne QUE la bande de gauche.
               ⚠️ UN MASQUE CRÉE UNE NOUVELLE RACINE D'ARRIÈRE-PLAN
               POUR SES DESCENDANTS. Ici ils ne sont que des images :
               aucune plaque de verre n'est prise dedans, et rien
               n'anime en opacité (le défaut nº 234 ne se rejoue pas).
               ⚠️ ET LES DEUX LIGNES DU MASQUE SONT LITTÉRALES, la
               préfixée d'abord — la même prudence que les filtres. */}
          <div className="mt-5 hidden lg:block">
            {section.series.map((serie) => (
              <div
                key={`galerie-${serie.style}-${serie.rendu}`}
                data-galerie-serie={`${serie.style}·${serie.rendu}`}
                className="mt-7 first:mt-0"
              >
                {/*  LE TITRE, AU-DESSUS DE SA GALERIE — l'écriture des
                     noms de style de la grille (15 px, `medium`,
                     blanche), reprise telle quelle. */}
                <p
                  data-titre-galerie=""
                  className="text-[15px] font-medium text-sombre-texte"
                >
                  {serie.label} · {libelleRendu(serie.rendu)}
                </p>
                <GalerieQuiDefile
                  /*  §1 ET §4-b (nº 308) — LE DÉBORD PASSE SUR
                       L'ENVELOPPE, ET LA RANGÉE N'A PLUS AUCUN
                       REMBOURRAGE.
                       ------------------------------------------------
                       CE QUE LA nº 306 AVAIT ÉCRIT, ET POURQUOI ÇA
                       LAISSAIT UNE MARGE À DROITE : la rangée portait
                       `-ml-10 pl-10 scroll-pl-10`. Elle débordait donc
                       de 40 px à gauche et se les reprenait en
                       REMBOURRAGE, pour que la première photo reste
                       alignée sur les titres au repos. Conséquence :
                       la largeur d'une case était un POURCENTAGE de la
                       boîte de CONTENU (380 − 40 = 340), pendant que
                       la boîte visible, elle, fait 380. Deux boîtes de
                       référence pour une même rangée, c'est une marge
                       qui attend son navigateur — et il a suffi d'un
                       moteur qui résout `100 %` sur l'autre boîte
                       pour qu'elle apparaisse. (Mesuré ici : Chromium
                       tombe juste, à 0,00 px près, au repos comme en
                       fin de course — donc ce n'est pas un défaut de
                       calcul, c'est une AMBIGUÏTÉ, et on l'enlève.)
                       CE QUI EST ÉCRIT MAINTENANT : le débord de 40 px
                       est sur l'ENVELOPPE (`-ml-10`), la rangée n'a
                       plus ni rembourrage ni rembourrage de
                       défilement. Sa boîte de contenu, sa boîte de
                       rembourrage et sa boîte visible sont LA MÊME —
                       380 px. `100 %` n'a plus qu'une seule lecture
                       possible, `snap-start` s'aligne sur le bon bord
                       sans `scroll-pl-*`, et la troisième photo touche
                       le bord droit par construction.
                       ET C'EST AUSSI LE §4-b : la galerie est décalée
                       de 40 px VERS LA GAUCHE — au repos, la première
                       photo commence désormais sous la bande
                       d'effacement au lieu de s'aligner sur les
                       titres. Les titres, eux, ne bougent pas. */
                  classeEnveloppe="mt-2.5 -ml-10"
                  /*  §4-a (nº 308) — L'ÉCART PASSE DE 6 À 3 px, la
                       moitié. Il est donné au dessin partagé en
                       RÉGLAGE : « Ma sélection » garde ses 6 px. */
                  ecart="gap-[3px]"
                  styleRangee={{
                    WebkitMaskImage:
                      "linear-gradient(to right, rgba(0,0,0,0) 0px, rgba(0,0,0,1) 40px)",
                    maskImage:
                      "linear-gradient(to right, rgba(0,0,0,0) 0px, rgba(0,0,0,1) 40px)",
                  }}
                  /*  §3-b ET §4-c (nº 308) — LES DEUX CHEVRONS SONT
                       POSÉS DE LA MÊME FAÇON, chacun contre SON bord
                       de la rangée : `left-0` et `right-0`, donc la
                       même distance des deux côtés.
                       CE QU'IL Y AVAIT AVANT : `-left-10` sortait le
                       chevron gauche de l'enveloppe pour le poser dans
                       la gouttière de 40 px, contre la grande photo —
                       à l'extérieur du dessin, à l'extérieur de la
                       galerie, et à l'endroit exact où la colonne
                       ROGNE (son bord de rognage tombe au même pixel).
                       C'est de là que venait « à moitié coupée ».
                       Le chevron gauche vit maintenant DANS la
                       rangée : son dessin est à 7 px du bord, jamais
                       au contact du rognage, jamais sur la photo. */
                  decalageGauche="left-0"
                  decalageDroite="right-0"
                  avecVoiles={false}
                  cleDuContenu={`${serie.style}-${serie.rendu}-${serie.photos.length}`}
                  etiquette={`${serie.label} · ${libelleRendu(serie.rendu)}`}
                >
                  {serie.photos.map((photo, rang) => (
                    <li
                      key={photo.cle}
                      data-case-galerie={rang}
                      /*  §1 ET §4 (nº 308) — LA LARGEUR RECALCULÉE.
                           La règle ne change pas — deux photos
                           pleines, 10 % de la troisième, son bord
                           droit collé au bord droit du cadre — mais
                           ses deux termes ont bougé : la rangée fait
                           maintenant 380 px de contenu (plus de
                           rembourrage) et l'écart 3 px au lieu de 6.
                           `2,1 × case + 2 × écart = 100 %`, d'où
                           `case = (100 % − 6px) / 2,1`. Aucune
                           largeur en dur : la règle tient à toute
                           largeur de colonne. */
                      className="shrink-0 snap-start basis-[calc((100%_-_6px)/2.1)]"
                    >
                      {/*  RÈGLE 6 — CLIQUER UNE PHOTO L'AFFICHE DANS LE
                           CADRE PHOTO DE LA FICHE. Elle ne s'ouvre pas
                           ailleurs, elle ne change pas de page : c'est
                           le chemin qui existe déjà (`surSerie`), avec
                           le rang en plus. */}
                      <button
                        type="button"
                        onClick={() =>
                          surSerie({
                            style: serie.style,
                            nature: section.nature,
                            rendu: serie.rendu,
                            indice: rang,
                          })
                        }
                        className="group/case block w-full text-left"
                      >
                        <span className="block aspect-[4/5] overflow-hidden bg-sombre-eleve">
                          {/* eslint-disable-next-line @next/next/no-img-element --
                              photo déposée par le tatoueur, servie telle
                              quelle (la règle des vignettes). */}
                          <img
                            src={photo.miniature}
                            alt={`${serie.label} — ${nomTatoueur}`}
                            loading="lazy"
                            className="h-full w-full object-cover
                                       transition-opacity group-hover/case:opacity-90"
                          />
                        </span>
                      </button>
                    </li>
                  ))}
                </GalerieQuiDefile>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
