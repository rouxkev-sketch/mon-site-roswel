"use client";

//  §4 (nº 459) — `useEffect` : la purge d'arrivée de la mémoire des
//  galeries (voir PanneauPortfolio).
import { useEffect, useState } from "react";
import { OngletsLigne } from "@/components/OngletsLigne";
//  §4 (nº 459) — la mémoire de défilement des galeries du doigt.
import {
  cleDeGalerie,
  oublierLesAutresGaleries,
} from "@/lib/memoire-galeries";
import {
  CATEGORIES_EXPLORER,
  ECRITURE_TITRE_SECTION,
} from "@/config/tatouage";
import {
  RENDU_PAR_DEFAUT,
  RENDUS_PHOTO,
  titreDeGalerie,
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
 *  · sous chaque titre, TOUTES SES SÉRIES en vignettes, tous rendus
 *    MÊLÉS (noir, noir & gris, couleur — nº 404), dans leur ordre
 *    existant — les styles de A à Z (nº 208-§4), et dans un style,
 *    l'ordre de `RENDUS_PHOTO` — SANS aucun titre intermédiaire : les
 *    mots des rendus ne s'écrivent nulle part ;
 *  · une section vide NE REND RIEN — ni titre, ni espace.
 *
 * ██ §2 (nº 375) — LES DEUX TITRES DE SECTION DEVIENNENT UN SURTITRE ██
 * ==================================================================
 * CE QUI CHANGE : « RÉALISATIONS » et « FLASHS » ne coiffent plus une
 * section. Le mot descend AU-DESSUS DU TITRE DE CHAQUE GALERIE et s'y
 * RÉPÈTE — cinq galeries de réalisations, cinq fois « RÉALISATIONS ».
 * Le portfolio n'est donc plus deux blocs, mais UNE SUITE de galeries
 * qui portent chacune sa catégorie ; l'ordre ne bouge pas (toutes les
 * réalisations, puis tous les flashs), et le mot garde son écriture au
 * cheveu près — c'est toujours `ECRITURE_TITRE_SECTION`, on ne
 * redéclare ni sa taille, ni sa graisse, ni son gris, ni son
 * espacement de lettres.
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
 * LE SÉLECTEUR « PROFIL / PORTFOLIO »
 * ==================================================================
 * (nº 205-§1, puis nº 255-§1 — REFAIT PAR LA nº 382-§2.)
 *
 * ██ §2 (nº 382) — LA CAPSULE CÈDE LA PLACE AU SOULIGNEMENT ROSE ██
 * L'onglet actif était encadré par un badge opaque qui glissait
 * (`SelecteurCapsule`). Il porte désormais LE SOULIGNEMENT DE LA
 * CRÉATION DE PORTFOLIO — celui qui choisit entre « Réalisation » et
 * « Flash » dans l'espace tatoueur (BlocPortfolio) : les mots nus,
 * l'actif en blanc, et un trait rose de trois pixels qui GLISSE d'un
 * mot à l'autre.
 *
 * CE QUE JE RÉEMPLOIE, ET C'EST LE COMPOSANT LUI-MÊME :
 * `OngletsLigne`. Aucun second système n'est dessiné — ni la couleur
 * (`bg-primaire`), ni l'épaisseur (3 px), ni la courbe de glissement
 * (300 ms, `cubic-bezier(0.32,0.72,0,1)`), ni l'ARIA (`radiogroup` +
 * `radio`) ne sont réécrits ici. Il a simplement reçu deux RÉGLAGES
 * facultatifs (nº 382, voir OngletsLigne), dont les défauts
 * reproduisent son écriture d'avant au caractère près : ses cinq
 * autres appelants ne bougent pas d'un pixel.
 *
 * LES DEUX RÉGLAGES, ET POURQUOI :
 *  · `classeOnglet="px-5 min-h-[44px]"` — LA CIBLE TACTILE DU BADGE
 *    QU'IL REMPLACE, reprise au pixel : la capsule posait ses mots en
 *    `px-5 min-h-[44px]` (SelecteurCapsule). Sans ce réglage, les
 *    onglets tomberaient au `px-1` de la pleine largeur et la cible se
 *    réduirait presque au texte — c'est le piège nommé par le
 *    propriétaire ;
 *  · `avecLigneGrise={false}` — la rangée porte DÉJÀ son trait, sur
 *    toute sa largeur, depuis la nº 381. Deux gris empilés feraient
 *    deux pixels sous les onglets et un seul ailleurs.
 *
 * OÙ TOMBE LE ROSE (§3) : le bloc d'onglets mesure 44 + 3 = 47 px et
 * c'est le PLUS HAUT de la rangée (« Suivre » fait 30). Il occupe donc
 * toute la boîte de contenu, et son trait rose — posé sur son bord
 * bas — se retrouve COLLÉ au trait fin de la rangée, qui commence
 * exactement là. Aucun calcul, aucune valeur : une identité de boîtes.
 *
 * ⚠️ « SUIVRE » N'EST PAS TOUCHÉ : il n'est pas rendu ici, c'est la
 * rangée de ContenuFiche qui le pose à droite. Rien de ce fichier ne
 * le concerne.
 */
export function SelecteurOngletAffiche({
  valeur,
  surChoix,
}: {
  valeur: OngletAffiche;
  surChoix: (onglet: OngletAffiche) => void;
}) {
  return (
    <OngletsLigne
      options={ONGLETS}
      cleActive={valeur}
      //  Les clés sont celles de `ONGLETS`, donc des `OngletAffiche` :
      //  le composant partagé, lui, parle en chaînes.
      surChoix={(cle) => surChoix(cle as OngletAffiche)}
      ariaLabel="Profil ou portfolio"
      classeOnglet="px-5 min-h-[44px]"
      avecLigneGrise={false}
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
 * présents dans l'ordre de `RENDUS_PHOTO` (noir, noir & gris, puis
 * couleur — nº 404) — « leur ordre existant », celui que les
 * sélecteurs parcouraient. Les rendus sont MÊLÉS dans la même
 * grille : aucun mot de rendu ne s'écrit, nulle part. Un style sans
 * photo dans cette catégorie n'a pas de vignette.
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
 * LE PANNEAU « PORTFOLIO » — UNE SUITE DE GALERIES, sans plus aucun
 * sélecteur (nº 276-§3) ni aucun titre de section (nº 375-§2). Chaque
 * galerie porte sa catégorie en surtitre.
 */
export function PanneauPortfolio({
  groupes,
  surSerie,
  nomTatoueur,
  slugTatoueur = "",
}: {
  groupes: StyleGalerie[];
  /** Un toucher sur une vignette : la galerie principale montre CETTE
      série — style + catégorie + rendu, une galerie de dépôt — et la
      page remonte en haut (nº 197-§4, précisé par la nº 204-§3). */
  surSerie: (serie: SerieChoisie) => void;
  nomTatoueur: string;
  /** §4 (nº 459) — L'IDENTITÉ DE LA FICHE, pour la mémoire de
      défilement des galeries du doigt (lib/memoire-galeries) : la clé
      de chaque galerie commence par lui, et son arrivée purge les
      positions des AUTRES fiches. Vide : aucune mémoire — rien ne
      change. */
  slugTatoueur?: string;
}) {
  /*  §4 (nº 459) — LA PURGE D'ARRIVÉE : les positions retenues des
      autres fiches meurent quand ce panneau se monte — aucune
      position fantôme ne voyage d'un profil à l'autre. */
  useEffect(() => {
    if (slugTatoueur) oublierLesAutresGaleries(slugTatoueur);
  }, [slugTatoueur]);
  /*  LES DEUX SECTIONS — « Réalisations » puis « Flashs », les
      libellés de CATEGORIES_EXPLORER. UNE SECTION VIDE NE REND RIEN :
      ni titre, ni espace (nº 276-§3). */
  const sections = CATEGORIES_EXPLORER.map((categorie) => ({
    nature: categorie.nature,
    titre: categorie.titre,
    series: seriesDeLaCategorie(groupes, categorie.nature),
  })).filter((section) => section.series.length > 0);

  /**
   * §2 (nº 375) — UNE SEULE SUITE DE GALERIES, CHACUNE PORTANT SA
   * CATÉGORIE.
   * ------------------------------------------------------------------
   * On aplatit les sections dans l'ordre où elles arrivent : toutes les
   * réalisations, puis tous les flashs — `CATEGORIES_EXPLORER` donne
   * l'ordre, il ne change pas. Chaque galerie emporte le MOT de sa
   * catégorie, qui s'écrira au-dessus de son titre.
   * ⚠️ LE FILTRE DU DESSUS FAIT DÉJÀ LE TRAVAIL DES CAS LIMITES : un
   * tatoueur sans flash n'a qu'une section, donc aucune galerie ne porte
   * « Flashs », et l'inverse est vrai aussi. Rien ne peut rester
   * orphelin — il n'y a plus de titre qui existe indépendamment d'une
   * galerie.
   */
  const galeries = sections.flatMap((section) =>
    section.series.map((serie) => ({
      serie,
      nature: section.nature,
      titre: section.titre,
    }))
  );

  if (sections.length === 0) {
    /*  §5 (nº 197) — LE TITRE SEUL, centré. Aucune phrase, aucune
        icône. */
    return (
      <p className="mt-10 text-center text-[16px] font-semibold text-sombre-texte-doux">
        Aucune publication
      </p>
    );
  }

  /**
   * §3 (nº 314) — LES CASES D'UNE GALERIE, ÉCRITES UNE SEULE FOIS.
   * ------------------------------------------------------------------
   * Le web et le doigt montrent EXACTEMENT les mêmes cases : même
   * largeur, même format, même geste. Seuls diffèrent le débord et
   * l'effacement, qui sont des réglages de l'enveloppe — pas du
   * contenu. Les écrire deux fois, c'était garantir qu'ils finiraient
   * par diverger ; ils vivent donc ici, et les deux blocs les
   * appellent.
   */
  const casesDe = (serie: SeriePubliee, nature: string) =>
    serie.photos.map((photo, rang) => (
      <li
        key={photo.cle}
        data-case-galerie={rang}
        /*  LA LARGEUR D'UNE CASE — deux photos pleines, 10 % de la
             troisième, son bord droit collé au bord droit du cadre :
             `2,1 × case + 2 × écart = 100 %`, d'où
             `case = (100 % − 6px) / 2,1` avec l'écart de 3 px. `100 %`
             est la boîte de CONTENU de la rangée — au doigt, le
             rembourrage du débord n'en fait donc pas partie, et la
             règle tient telle quelle sur les deux appareils. Aucune
             largeur en dur.
             §2 (nº 310) — `grow` : ET C'ÉTAIT ÇA, LA MARGE DE DROITE.
             ------------------------------------------------------
             LA CAUSE, DÉCODÉE AU PIXEL : cette largeur est calculée
             pour qu'IL Y AIT une troisième photo. Une série qui n'en a
             QUE DEUX ne remplit donc pas le cadre, et ce qui reste se
             voit comme une marge à droite — mesuré 21 px à deux
             photos, 202 px à une seule, contre 0,00 px dès trois.
             LE REMÈDE : les cases GRANDISSENT pour remplir ce qui
             reste. `shrink-0` les empêche toujours de rétrécir, donc
             dès trois photos la rangée déborde, l'espace libre est
             négatif, et `grow` n'a rien à distribuer — la règle des
             10 % est intacte, au pixel.
             ██ §4 (nº 417) — ET C'ÉTAIT AUSSI LA PHOTO PLEINE LARGEUR ██
             LE RELEVÉ : une galerie qui ne contient QU'UNE photo
             l'affiche sur toute la largeur, au lieu du format d'une
             galerie ordinaire.
             LA CAUSE EST CE MÊME `grow`, ET SA MESURE ÉTAIT DÉJÀ ÉCRITE
             DEUX LIGNES PLUS HAUT : « 202 px à une seule » photo. À
             deux photos il rattrape 21 px, ce qui se voit à peine ; à
             une seule il en rattrape DIX FOIS PLUS — la case unique
             absorbe tout l'espace libre et occupe la rangée entière.
             Le défaut ne vient donc pas de l'origine : il est né AVEC
             le remède de la nº 310 (commit du 16-08-2026), et il vaut
             pour LE WEB COMME POUR LE DOIGT — les deux rendus posent
             les mêmes cases, par cette seule fonction.
             LE REMÈDE, MINIMAL : `grow` ne s'applique plus qu'À PARTIR
             DE DEUX photos. Une case seule garde donc sa largeur de
             gabarit — `basis` intacte, exactement celle qu'elle aurait
             au milieu d'une galerie de dix —, et la nº 310 n'est pas
             défaite d'un pixel là où elle réparait quelque chose.
             ⚠️ LES CHEVRONS, EUX, N'APPARAISSENT PAS POUR AUTANT, et
             c'est par construction : `GalerieQuiDefile` les allume sur
             les BOUTS DE COURSE réels (`scrollWidth` contre
             `clientWidth`) — une rangée qui ne déborde pas n'en a
             aucun, ni fondu. Les points ont été supprimés à la nº 301,
             et cette galerie n'a jamais porté de badge de comptage. */
        className={`${
          serie.photos.length > 1 ? "grow " : ""
        }shrink-0 snap-start basis-[calc((100%_-_6px)/2.1)]`}
      >
        {/*  RÈGLE 6 (nº 306) — TOUCHER UNE PHOTO L'OUVRE, ELLE ET PAS
             UNE AUTRE. C'est le chemin qui existe déjà (`surSerie`),
             avec le RANG en plus : en web il pose la photo dans le
             cadre du haut, au doigt il ouvre la fenêtre de carrousel
             dessus (§3-d, nº 314 — voir FicheTatoueur). */}
        <button
          type="button"
          onClick={() =>
            surSerie({
              style: serie.style,
              nature,
              rendu: serie.rendu,
              indice: rang,
            })
          }
          className="group/case block w-full text-left"
        >
          <span className="block aspect-[4/5] overflow-hidden bg-sombre-eleve">
            {/* eslint-disable-next-line @next/next/no-img-element --
                photo déposée par le tatoueur, servie telle quelle
                (la règle des vignettes). */}
            <img
              src={photo.miniature}
              alt={`${serie.label} — ${nomTatoueur}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover
                         transition-opacity group-hover/case:opacity-90"
            />
          </span>
        </button>
      </li>
    ));

  /**
   * §2 (nº 375) — LE SURTITRE D'UNE GALERIE — « RÉALISATIONS » ou
   * « FLASHS », écrit une fois pour les deux appareils.
   * ------------------------------------------------------------------
   * MÊME ÉCRITURE QU'HIER, AU CHEVEU : `ECRITURE_TITRE_SECTION`, la
   * classe que portait le `<h2>` — mêmes capitales, même gris, mêmes
   * 13 px, même graisse, même espacement de lettres. On ne la recopie
   * pas, on la consomme ; il n'y a donc rien à faire diverger.
   * L'ÉLÉMENT CHANGE (`<p>` et non `<h2>`) et c'est voulu : ce n'est
   * plus le titre d'une section, c'est la catégorie de la galerie qui
   * suit, répétée autant de fois qu'il y a de galeries. Un `<h2>`
   * répété cinq fois avec le même texte mentirait au plan du document
   * et aux lecteurs d'écran.
   * ⚠️ AUCUNE MARGE : le surtitre est collé au titre de sa galerie —
   * c'est ce qui les fait lire comme un seul bloc, et c'est ce qui
   * garantit qu'aucun espace neuf n'entre dans le portfolio.
   */
  const surtitre = (titre: string) => (
    <p data-surtitre-galerie="" className={ECRITURE_TITRE_SECTION}>
      {titre}
    </p>
  );

  /**
   * ██ §1 (nº 521) — LA TÊTE D'UNE GALERIE, AVEC SON COMPTEUR ██
   * ==================================================================
   * CE QU'ELLE POSE : la nature (« Réalisation »), puis la ligne du
   * style — et, À L'OPPOSÉ de celle-ci, le rang de la photo vue sur le
   * total : « 1/20 ». Enfin la galerie elle-même, que l'appelant
   * fournit : les deux affichages (doigt et web) gardent chacun leurs
   * réglages de débord, d'écart et de chevron, qui ne se ressemblent
   * pas.
   * ⚠️ POURQUOI UN COMPOSANT ET NON TROIS LIGNES DANS LA BOUCLE : le
   * rang est un ÉTAT, et il en faut un PAR galerie. Dans une boucle, un
   * état ne peut pas se déclarer — c'est la règle des crochets. Le
   * composant est donc la forme, pas un choix de style.
   * ⚠️ LE COMPTEUR NE POUSSE JAMAIS LE STYLE : c'est le TITRE qui cède
   * (il prend la place restante et s'abrège), le compteur garde la
   * sienne. Un style long s'écrit donc avec des points de suspension,
   * et le nombre reste lisible et entier.
   * ⚠️ LES CHIFFRES ONT TOUS LA MÊME LARGEUR (`tabular-nums`, le
   * procédé du compteur de carrousel) : passer de « 9/20 » à « 10/20 »
   * ne fait pas frémir la ligne.
   * ⚠️ IL N'EST JAMAIS VIDE : le rang part de zéro, et l'affichage
   * ajoute un.
   * ⚠️ §2 (nº 522) — CE QU'IL COMPTE EST LA DERNIÈRE VIGNETTE VUE, plus
   * la première. Une galerie de 19 photos qui en montre deux ouvre donc
   * sur « 2/19 » — deux photos SONT vues — et finit sur « 19/19 ». Avec
   * la première, elle disait « 1/19 » puis se bloquait à « 18/19 », la
   * dernière photo restant à l'écran sans être comptée : la première
   * visible ne peut pas dépasser l'avant-dernière quand deux tiennent
   * côte à côte. Le pourquoi complet vit dans GalerieQuiDefile.
   * ⚠️ CE N'EST PAS LE COMPTEUR DE LA VUE PHOTO (nº 483/487), et les
   * deux restent séparés à dessein : celui-là est une PASTILLE POSÉE
   * SUR L'IMAGE, avec son fond et son placement dans l'angle ; celui-ci
   * est du TEXTE NU au bout d'une ligne de titre. Ils ne partagent ni
   * habillage ni support — les réunir demanderait de paramétrer les
   * deux, pour ne mettre en commun qu'une barre oblique.
   */
  const TeteDeGalerie = ({
    nature,
    titre,
    total,
    galerie,
  }: {
    nature: string;
    titre: string;
    total: number;
    galerie: (surRang: (rang: number) => void) => React.ReactNode;
  }) => {
    const [rang, setRang] = useState(0);
    return (
      <>
        {surtitre(nature)}
        {/*  `items-baseline` : le nombre s'assoit sur la même ligne
             d'écriture que le style, quelle que soit la casse. */}
        <div className="flex items-baseline gap-3">
          {/*  LE TITRE, AU-DESSUS DE SA GALERIE — l'écriture des noms
               de style de la grille (15 px, `medium`, blanche),
               reprise telle quelle. `min-w-0` : sans lui, un titre
               long refuserait de s'abréger et pousserait le compteur
               hors de la colonne. */}
          <p
            data-titre-galerie=""
            className="min-w-0 flex-1 truncate text-[15px] font-medium text-sombre-texte"
          >
            {titre}
          </p>
          {/*  LE COMPTEUR — 15 px comme la ligne qu'il accompagne, le
               GRIS des textes secondaires (le jeton de la nº 466), et
               la graisse NORMALE : il accompagne le style, il ne le
               concurrence pas. */}
          {/*  §1 (nº 522) — UN CRAN PLUS PETIT : 15 → 14 px. Il
               accompagne la ligne du style, il ne la double pas — et
               c'est la valeur que la ligne d'information d'une carte
               porte déjà (nº 480), pas un nombre neuf. Le gris, la
               graisse et la place ne bougent pas. */}
          <p
            data-compteur-galerie=""
            className="shrink-0 text-[14px] font-normal tabular-nums text-sombre-texte-doux"
          >
            {rang + 1}/{total}
          </p>
        </div>
        {galerie(setRang)}
      </>
    );
  };

  return (
    /*  §2 (nº 375) — LE RYTHME, ET CE QU'IL DEVIENT.
        ------------------------------------------------------------
        CE QUI DISPARAÎT, entièrement :
         · le `mt-10` que portait CHAQUE `<section>` — 40 px avant
           « RÉALISATIONS », 40 px avant « FLASHS » ;
         · la ligne du `<h2>` lui-même, deux fois ;
         · le `mt-5` (20 px) qui séparait un titre de sa première
           galerie, deux fois.
        CE QUI EST CONSERVÉ, à la valeur près :
         · les 40 px qui ouvrent le portfolio sous la rangée Profil /
           Portfolio — le `mt-10` ne disparaît pas, il REMONTE d'un
           cran, du `<section>` au conteneur des galeries. Le premier
           mot du portfolio se pose donc exactement là où se posait
           « RÉALISATIONS » ;
         · le `mt-7 first:mt-0` (28 px) entre deux galeries — pas
           touché d'un pixel, y compris à la jointure réalisations /
           flashs, qui n'est plus une frontière de section mais deux
           galeries qui se suivent ;
         · le `mt-2.5` (10 px) entre un titre de galerie et sa rangée,
           et le `gap-[3px]` dans la rangée.
        AUCUNE VALEUR NEUVE N'EST INTRODUITE : le surtitre s'empile sur
        le titre sans marge du tout.

        ██ §1 (nº 382) — LE PORTFOLIO REÇOIT SON PROPRE PLAN ██
        ============================================================
        LE DÉFAUT : sur le web, en remontant dans les galeries, LES
        FLÈCHES DE DÉFILEMENT PASSENT PAR-DESSUS LA BARRE FIXE.
        LES RANGS EN PRÉSENCE :
         · la flèche d'une galerie — `z-[2]`, et son enveloppe
           (`GalerieQuiDefile`) est `relative` SANS rang : elle ne
           fabrique donc aucun plan, et la flèche se compare
           DIRECTEMENT au premier plan rencontré en remontant ;
         · le voile de bord d'une galerie — `z-[1]`, même situation ;
         · la photo agrandie au pincement — `z-[60]` (ZoomPincement,
           monté par `CarrouselPortfolio`, donc présent sur cette
           page) : au-dessus de la barre, et c'est le rang qui prouve
           que la comparaison directe est dangereuse ;
         · la barre fixe du logo — `z-50` ;
         · la rangée collante — `lg:z-[2]` sur le web, `mobile:z-[3]`
           au doigt (nº 377).
        LA CAUSE, ET ELLE EST DÉJÀ DOCUMENTÉE : c'est très exactement
        le défaut de la nº 193-§3, où les cartes passaient devant la
        barre. « La barre est au rang 50, mais la mosaïque
        n'appartenait à aucun plan à elle — ses enfants pouvaient donc
        se comparer DIRECTEMENT à la barre… et l'ordre de peinture
        entre un calque neuf et une barre en verre dépoli n'est pas
        garanti. » Le portfolio est dans la même situation : aucun
        plan à lui.
        LE REMÈDE EST LE SIEN, MOT POUR MOT : un plan au rang 0.
        Tout ce que le portfolio contient s'ordonne À L'INTÉRIEUR
        (les voiles sous les flèches, comme avant), et le plan entier
        reste sous la barre — quoi qu'il arrive, y compris si un
        navigateur promeut la zone sur son propre calque.
        ⚠️ ET LA RÈGLE DE LA Nº 377 EN SORT RENFORCÉE, PAS CASSÉE : la
        rangée collante est au rang 2 (web) ou 3 (doigt), ce plan au
        rang 0 — elle passe donc au-dessus du portfolio, ce qui est
        précisément ce que la nº 377 demandait. Aujourd'hui les
        flèches (`z-[2]`) ÉGALAIENT la rangée du web et passaient
        devant elle par l'ordre du flux ; elles ne le peuvent plus.
        ⚠️ RIEN DE GÉOMÉTRIQUE : `relative` sans décalage ne déplace
        rien, et le rang 0 ne change aucun ordre interne.
        ⚠️ ET RIEN AU-DESSUS DE LA RANGÉE : ce bloc est un frère
        SUIVANT de la rangée, jamais un de ses parents — la règle de
        cette passe est tenue. La fenêtre d'adresse (`z-[80]`,
        BlocLieux) vit dans l'onglet Profil, hors de ce plan : son
        échappée reste entière. */
    <div className="relative z-0">
      {/*  LES VIGNETTES — une par SÉRIE publiée, le nom du style
           dessous. Angles arrondis, aucun contour, aucun encadré :
           l'image et son nom, rien de plus. (Le cœur de série de
           la nº 203 est ANNULÉ par la nº 204-§1 : le cœur vit sur
           chaque photo, dans la galerie — jamais ici.) Un style
           publié dans les deux rendus a DEUX vignettes, sous le
           même nom : c'est la première photo de chaque série qui
           les distingue — jamais un mot de rendu. */}
      {/*  §3 (nº 314) — AU DOIGT AUSSI, DES GALERIES QUI DÉFILENT.
           ------------------------------------------------------
           CE QUI EST REMPLACÉ : la GRILLE DE VIGNETTES par lignes
           de deux (une vignette par SÉRIE, sa première photo et le
           nom du style dessous). Elle ne montrait qu'une image par
           carrousel ; on ne voyait le reste qu'après avoir touché.
           CE QUI PREND SA PLACE : la présentation du web — un titre
           « Réalisme · Couleur » et, sous lui, TOUTES les photos du
           carrousel dans une galerie qui défile.
           LA SEULE DIFFÉRENCE AVEC LE WEB, et c'est le cœur du
           point : AU DOIGT, LA GALERIE VA BORD À BORD DE L'ÉCRAN et
           s'efface dans les marges de la page.
           ⚠️ RIEN N'EST INVENTÉ ICI : ce débord et cet effacement
           sont EXACTEMENT ceux de « Ma sélection » au doigt
           (BlocSuivis) — mêmes marges négatives rendues en
           rembourrage (`-mx-4 px-4 sm:-mx-6 sm:px-6`), et les deux
           FONDUS ANTHRACITE du dessin partagé, qui sont son
           comportement PAR DÉFAUT (`avecVoiles`, `decalageGauche`
           et `decalageDroite` de `GalerieQuiDefile`). On ne les
           repasse même pas : ne rien passer, c'est déjà les
           demander.
           ⚠️ ET C'EST LE MÊME COMPOSANT : le débord et l'effacement
           étaient déjà des réglages, comme l'écart et la taille des
           chevrons. Aucun second dessin. */}
      <div data-galeries="doigt" className="mt-10 lg:hidden">
        {galeries.map(({ serie, nature, titre }) => (
          <div
            /*  §2 (nº 375) — LA NATURE ENTRE DANS LA CLÉ, et il le
                 faut : la liste est APLATIE, or un même style dans
                 un même rendu peut exister en réalisation ET en
                 flash. Sans elle, deux galeries porteraient la
                 même clé — et le même nom de sonde. */
            key={`doigt-${nature}-${serie.style}-${serie.rendu}`}
            data-galerie-serie={`${nature}·${serie.style}·${serie.rendu}`}
            className="mt-7 first:mt-0"
          >
            <TeteDeGalerie
              nature={titre}
              titre={titreDeGalerie(serie.label, serie.rendu)}
              total={serie.photos.length}
              galerie={(surRang) => (
            <GalerieQuiDefile
              surRang={surRang}
              classeEnveloppe="mt-2.5"
              /*  LE DÉBORD DE « MA SÉLECTION », À LA LETTRE : la
                   rangée sort jusqu'aux bords de l'écran (marges
                   négatives de la largeur des marges de page) et se
                   les reprend en REMBOURRAGE — au repos, la
                   première photo reste donc alignée sur les titres,
                   et ce qui défile passe SOUS les marges, où les
                   fondus l'effacent.
                   ⚠️ ET LE REMBOURRAGE DE DÉFILEMENT AVEC (`scroll-pl`),
                   MESURÉ : sans lui, la rangée s'ouvrait décalée de
                   16 px (`scrollLeft: 16`) et la première photo
                   collait au bord de l'écran, à moitié effacée. LA
                   RAISON : `snap-start` aligne sur le SNAPPORT, qui
                   est la boîte de REMBOURRAGE — le rembourrage de
                   débord en faisait donc partie, et le navigateur
                   « rattrapait » les 16 px pour poser la première
                   case au bord. « Ma sélection » ne connaît pas ce
                   défaut parce que ses cases sont en `snap-center`,
                   pas en `snap-start` ; les nôtres suivent le web
                   (nº 308), qui n'a aucun rembourrage. On ne change
                   donc NI les cases NI le web : on dit seulement au
                   défilement où est le bord utile, et le débord se
                   comporte enfin comme celui de « Ma sélection ». */
              classeRangee="-mx-4 px-4 scroll-pl-4 sm:-mx-6 sm:px-6 sm:scroll-pl-6"
              //  L'écart de la fiche (nº 308), le même qu'en web :
              //  le portfolio se lit pareil sur les deux appareils.
              ecart="gap-[3px]"
              cleDuContenu={`${serie.style}-${serie.rendu}-${serie.photos.length}`}
              /*  §4 (nº 459) — CHAQUE GALERIE DU DOIGT SE SOUVIENT DE
                   SA POSITION au retour d'une vue photo (le remontage
                   la remettait au début) : la clé porte la fiche et
                   l'identité de la série. Sans slug (aucun appelant
                   aujourd'hui), pas de mémoire — comportement
                   d'avant. Le web n'est pas concerné : sur lui, une
                   vignette ne démonte rien. */
              cleMemoire={
                slugTatoueur
                  ? cleDeGalerie(slugTatoueur, nature, serie.style, serie.rendu)
                  : undefined
              }
              etiquette={titreDeGalerie(serie.label, serie.rendu)}
            >
              {casesDe(serie, nature)}
            </GalerieQuiDefile>
              )}
            />
          </div>
        ))}
      </div>

      {/*  §1 (nº 306) — LE WEB : UNE GALERIE QUI DÉFILE PAR
           CARROUSEL, la présentation de « Ma sélection »
           (`GalerieQuiDefile`, partagée — aucun second dessin).
           ------------------------------------------------------
           RÈGLE 2 — LE TITRE PORTE LE STYLE ET LE RENDU :
           « Réalisme · Couleur », « Réalisme · Noir et gris ».
           Deux carrousels d'un même style mais de rendus
           différents portent donc deux titres distincts, et c'est
           le but. Les mots viennent de `titreDeGalerie` (nº 376) :
           aucun libellé n'est écrit ici, et la ligne sous la photo
           de la fiche au doigt affiche EXACTEMENT la même chaîne.
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
      <div data-galeries="web" className="mt-10 hidden lg:block">
        {galeries.map(({ serie, nature, titre }) => (
          <div
            //  §2 (nº 375) — la nature dans la clé, même raison
            //  qu'au doigt : la liste est aplatie.
            key={`galerie-${nature}-${serie.style}-${serie.rendu}`}
            data-galerie-serie={`${nature}·${serie.style}·${serie.rendu}`}
            className="mt-7 first:mt-0"
          >
            {/*  §2 (nº 375) — LE SURTITRE : « RÉALISATIONS » ou
                 « FLASHS », l'écriture de l'ancien titre de
                 section, collée au titre de la galerie. */}
            <TeteDeGalerie
              nature={titre}
              titre={titreDeGalerie(serie.label, serie.rendu)}
              total={serie.photos.length}
              galerie={(surRang) => (
            <GalerieQuiDefile
              surRang={surRang}
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
              etiquette={titreDeGalerie(serie.label, serie.rendu)}
            >
              {casesDe(serie, nature)}
            </GalerieQuiDefile>
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
