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
import {
  CHEVRON_GALERIE_PETIT,
  GalerieQuiDefile,
} from "@/components/GalerieQuiDefile";
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
               d'où `case = (100 % − 6px) / 2,1` avec l'écart de 3 px.
               Aucune largeur en dur — la règle tient à toute largeur
               de colonne.
               RÈGLE 5 — ANNULÉE PAR LA Nº 312-§1, SUR CONSIGNE.
               ------------------------------------------------------
               Elle faisait DÉBORDER la galerie de 40 px vers la grande
               photo et effaçait cette bande en dégradé. Le propriétaire
               n'en veut plus : LA GALERIE S'ARRÊTE À L'ALIGNEMENT DU
               TEXTE, la même ligne verticale que les titres, et une
               photo qui sort à gauche disparaît NETTEMENT sur cette
               ligne. Plus de débord, plus de masque, plus de dégradé —
               la rangée n'a donc plus ni marge négative, ni
               rembourrage, ni rembourrage de défilement : sa boîte est
               celle de la colonne, et `snap-start` s'aligne dessus
               sans qu'on ait rien à corriger. */}
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
                  /*  §1 (nº 312) — PLUS AUCUN DÉBORD, PLUS AUCUN MASQUE.
                       ------------------------------------------------
                       LA GALERIE TIENT DANS LA COLONNE, exactement : ni
                       marge négative sur l'enveloppe, ni marge négative
                       sur la rangée, ni rembourrage pour la compenser.
                       Son bord gauche EST l'alignement du texte, parce
                       que c'est la même boîte que celle des titres — ce
                       n'est plus un réglage qui tombe juste, c'est une
                       identité.
                       CE QUE ÇA SIMPLIFIE AU PASSAGE : `scroll-pl-10`
                       n'a plus de raison d'être (il remettait le
                       snapport sur la boîte de contenu quand la rangée
                       avait 40 px de rembourrage), et les deux lignes
                       de masque disparaissent avec l'effacement — donc
                       aussi la racine d'arrière-plan qu'un masque crée
                       pour ses descendants, et toutes les précautions
                       qui allaient avec (nº 234). */
                  classeEnveloppe="mt-2.5"
                  /*  §4-a (nº 308) — L'ÉCART PASSE DE 6 À 3 px, la
                       moitié. Il est donné au dessin partagé en
                       RÉGLAGE : « Ma sélection » garde ses 6 px. */
                  ecart="gap-[3px]"
                  //  §4 (nº 310) — le petit chevron est demandé ICI,
                  //  et seulement ici : « Ma sélection » garde celui
                  //  de la nº 301 (le défaut du dessin partagé).
                  chevron={CHEVRON_GALERIE_PETIT}
                  /*  §3-b ET §4-c (nº 308) — LES DEUX CHEVRONS SONT
                       POSÉS DE LA MÊME FAÇON, chacun contre SON bord
                       de la galerie : `left-0` et `right-0`, donc la
                       même distance des deux côtés. Ils vivent DANS la
                       rangée — jamais dans une gouttière collée à la
                       grande photo, d'où venait « à moitié coupée »
                       (nº 308-§3, puis nº 310-§3). */
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
                      /*  LA LARGEUR D'UNE CASE — deux photos pleines,
                           10 % de la troisième, son bord droit collé
                           au bord droit du cadre :
                           `2,1 × case + 2 × écart = 100 %`, d'où
                           `case = (100 % − 6px) / 2,1` avec l'écart de
                           3 px. `100 %` est la boîte de CONTENU de la
                           rangée — le rembourrage de 40 px du débord
                           n'en fait pas partie. Aucune largeur en dur :
                           la règle tient à toute largeur de colonne.
                           §2 (nº 310) — `grow` : ET C'ÉTAIT ÇA, LA
                           MARGE DE DROITE.
                           ------------------------------------------
                           LA CAUSE, DÉCODÉE AU PIXEL : cette largeur
                           est calculée pour qu'IL Y AIT une troisième
                           photo. Une série qui n'en a QUE DEUX ne
                           remplit donc pas le cadre, et ce qui reste
                           se voit comme une marge à droite — mesuré
                           21 px à deux photos, 202 px à une seule,
                           contre 0,00 px dès trois. Mes trois relevés
                           précédents disaient tous zéro parce qu'ils
                           portaient tous sur une série de cinq : je
                           mesurais le seul cas qui allait bien.
                           LE REMÈDE : les cases GRANDISSENT pour
                           remplir ce qui reste. `shrink-0` les empêche
                           toujours de rétrécir, donc dès trois photos
                           la rangée déborde, l'espace libre est
                           négatif, et `grow` n'a rien à distribuer —
                           la règle des 10 % est intacte, au pixel. À
                           deux photos elles se partagent le cadre, à
                           une elle le prend en entier : plus jamais de
                           vide à droite, quel que soit le nombre. */
                      className="grow shrink-0 snap-start basis-[calc((100%_-_6px)/2.1)]"
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
